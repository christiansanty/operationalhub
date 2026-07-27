import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { getAcademyAttachment, getAcademyCatalog, getAcademyStatus, ingestAcademyExport } from './academy-store.mjs';
import { createAcademyCertificate, getAcademyLearnerPhoto, getAcademyLearnerRecord, listAcademyLearnerRecords, recordAcademyEvent, upsertAcademyLearner } from './academy-records.mjs';
import { syncAcademyBackend } from './academy-sync.mjs';
import { getAcademyWelcomeVideoStatus, saveAcademyWelcomeVideo, streamAcademyWelcomeVideo } from './academy-welcome-video.mjs';
import { createInventoryRequest, decideInventoryRequest, listInventoryRequests } from './inventory-store.mjs';
import { createDoctorDocument, getDoctorDocument, listDoctorDocuments } from './license-store.mjs';
import { claimNextAcaRpaCheck, completeAcaRpaCheck, createAcaRpaCheck, getAcaIntegrationStatus, importAcaRecords, listAcaRecords, listAcaRpaChecks } from './aca-store.mjs';
import { getOperationalAttachment, getOperationalSnapshot } from './operational-airtable-store.mjs';
import { syncOperationalAirtable } from './operational-airtable-sync.mjs';
import { getAiEngineStatus, runOperationalAi } from './ai-engine.mjs';
import { createHrPackage, deleteHrPackage, getHrPackage, listHrPackages } from './hr-package-store.mjs';
import { createDocusignEnvelope, getDocusignStatus } from './docusign.mjs';
import {
  acceptInvitation, deleteAccessUser, getAccessSystemStatus, getInvitation, inviteAccessUser,
  listAccessUsers, loginAccessUser, logoutAccessSession, resendAccessInvitation,
  resolveAccessSession, updateAccessUser,
} from './access-store.mjs';

const port = Number(process.env.PORT || 4176);
const distRoot = path.resolve('dist');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp' };

function json(response, status, payload, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  response.end(JSON.stringify(payload));
}

function cookies(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const index = value.indexOf('=');
    return index < 0 ? [value, ''] : [value.slice(0, index), decodeURIComponent(value.slice(index + 1))];
  }));
}

function accessToken(request) {
  return cookies(request).oh_session || '';
}

function sessionCookie(request, token, maxAge = 7 * 24 * 60 * 60) {
  const forwarded = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const secure = process.env.NODE_ENV === 'production' || forwarded === 'https';
  return `oh_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function requestBaseUrl(request) {
  if (process.env.APP_PUBLIC_URL) return process.env.APP_PUBLIC_URL;
  const host = /^[a-z0-9.:[\]-]+$/i.test(String(request.headers.host || '')) ? request.headers.host : `127.0.0.1:${port === 4176 ? 4173 : port}`;
  const forwarded = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return `${forwarded || 'http'}://${host}`;
}

function adminActor(request, requireManage = true) {
  const session = resolveAccessSession(accessToken(request));
  const userPermission = session?.permissions?.['admin-users'];
  if (session && (
    session.role === 'admin'
    || session.role === 'owner'
    || userPermission === 'manage'
    || (!requireManage && userPermission === 'view')
  )) return session;
  const demoAllowed = process.env.NODE_ENV !== 'production' && process.env.OPERATIONAL_HUB_DEMO_ADMIN !== 'false';
  if (demoAllowed && request.headers['x-operational-demo-admin'] === 'true') return { id:'demo-admin', role:'owner', name:'Admin', demo:true };
  return null;
}

function academyManager(request) {
  const session = resolveAccessSession(accessToken(request));
  if (session && (session.role === 'admin' || session.role === 'owner')) return session;
  const demoAllowed = process.env.NODE_ENV !== 'production' && process.env.OPERATIONAL_HUB_DEMO_ADMIN !== 'false';
  if (demoAllowed && request.headers['x-operational-demo-admin'] === 'true') return { id:'demo-admin', role:'owner', name:'Admin', demo:true };
  return null;
}

async function readJson(request,maxBytes=131072){
  const chunks=[];let size=0;
  for await(const chunk of request){size+=chunk.length;if(size>maxBytes)throw new Error('Request body too large');chunks.push(chunk)}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
}

async function serveStatic(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = path.resolve(distRoot, requested);
  if (!filePath.startsWith(`${distRoot}${path.sep}`) && filePath !== path.join(distRoot, 'index.html')) return json(response, 403, { error: 'Forbidden' });
  if (await access(filePath).then(() => false).catch(() => true)) filePath = path.join(distRoot, 'index.html');
  response.writeHead(200, { 'content-type': mime[path.extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { ok: true, service: 'operational-hub-backend' });
    if (request.method === 'GET' && url.pathname === '/api/auth/status') return json(response, 200, getAccessSystemStatus());
    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      const session=resolveAccessSession(accessToken(request));
      return json(response,session?200:401,{session});
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const body=await readJson(request);
      const result=loginAccessUser(body.email,body.password);
      return json(response,200,{session:result.session},{'set-cookie':sessionCookie(request,result.sessionToken)});
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      logoutAccessSession(accessToken(request));
      return json(response,200,{ok:true},{'set-cookie':sessionCookie(request,'',0)});
    }
    if (request.method === 'GET' && /^\/api\/auth\/invitations\/[^/]+$/.test(url.pathname)) {
      const token=decodeURIComponent(url.pathname.split('/')[4]);
      return json(response,200,getInvitation(token));
    }
    if (request.method === 'POST' && /^\/api\/auth\/invitations\/[^/]+\/accept$/.test(url.pathname)) {
      const token=decodeURIComponent(url.pathname.split('/')[4]);
      const body=await readJson(request);
      const result=acceptInvitation(token,body.password);
      return json(response,200,{session:result.session},{'set-cookie':sessionCookie(request,result.sessionToken)});
    }
    if (url.pathname === '/api/admin/users' && request.method === 'GET') {
      if(!adminActor(request,false))return json(response,403,{error:'User directory access required'});
      return json(response,200,{users:listAccessUsers(),system:getAccessSystemStatus()});
    }
    if (url.pathname === '/api/admin/invitations' && request.method === 'POST') {
      const actor=adminActor(request);if(!actor)return json(response,403,{error:'Administrator access required'});
      return json(response,201,await inviteAccessUser(await readJson(request),requestBaseUrl(request),actor.id));
    }
    if (request.method === 'POST' && /^\/api\/admin\/users\/[^/]+\/resend-invitation$/.test(url.pathname)) {
      const actor=adminActor(request);if(!actor)return json(response,403,{error:'Administrator access required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);
      return json(response,200,await resendAccessInvitation(id,requestBaseUrl(request),actor.id));
    }
    if (/^\/api\/admin\/users\/[^/]+$/.test(url.pathname)) {
      const actor=adminActor(request);if(!actor)return json(response,403,{error:'Administrator access required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);
      if(request.method==='PATCH')return json(response,200,{user:updateAccessUser(id,await readJson(request),actor.id)});
      if(request.method==='DELETE'){const deleted=deleteAccessUser(id,actor.id);return json(response,deleted?200:404,{deleted})}
    }
    if (request.method === 'GET' && url.pathname === '/api/ai/status') return json(response, 200, await getAiEngineStatus());
    if (request.method === 'POST' && url.pathname === '/api/ai/chat') return json(response, 200, await runOperationalAi(await readJson(request, 256 * 1024)));
    if (request.method === 'GET' && url.pathname === '/api/academy/status') return json(response, 200, getAcademyStatus());
    if (request.method === 'GET' && url.pathname === '/api/academy/welcome-video') return json(response, 200, await getAcademyWelcomeVideoStatus());
    if (request.method === 'GET' && url.pathname === '/api/academy/welcome-video/file') {
      await streamAcademyWelcomeVideo(request,response);
      return;
    }
    if (request.method === 'PUT' && url.pathname === '/api/academy/welcome-video') {
      const actor=academyManager(request);
      if(!actor)return json(response,403,{error:'Academy Manage access required'});
      return json(response,201,await saveAcademyWelcomeVideo(request,actor.id));
    }
    if (request.method === 'GET' && url.pathname === '/api/academy/catalog') return json(response, 200, await getAcademyCatalog());
    if (request.method === 'POST' && url.pathname === '/api/academy/records/profile') return json(response, 201, { profile:await upsertAcademyLearner(await readJson(request,8*1024*1024)) });
    if (request.method === 'GET' && url.pathname === '/api/academy/records') return json(response,200,{learners:await listAcademyLearnerRecords()});
    if (request.method === 'GET' && /^\/api\/academy\/records\/[^/]+$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      return json(response,200,await getAcademyLearnerRecord(learnerId));
    }
    if (request.method === 'POST' && /^\/api\/academy\/records\/[^/]+\/events$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      return json(response,201,{event:await recordAcademyEvent(learnerId,await readJson(request,512*1024))});
    }
    if (request.method === 'POST' && /^\/api\/academy\/records\/[^/]+\/certificates$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      return json(response,201,{certificate:await createAcademyCertificate(learnerId,await readJson(request,256*1024))});
    }
    if (request.method === 'GET' && /^\/api\/academy\/records\/[^/]+\/photo$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      const photo=await getAcademyLearnerPhoto(learnerId);
      if(!photo||await access(photo.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Academy learner photo not found'});
      response.writeHead(200,{'content-type':photo.type,'cache-control':'private, max-age=300'});
      return createReadStream(photo.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/operational/airtable/status') return json(response, 200, getOperationalSnapshot().status);
    if (request.method === 'GET' && url.pathname === '/api/operational/airtable/snapshot') return json(response, 200, getOperationalSnapshot());
    if (request.method === 'GET' && url.pathname === '/api/hr/packages') return json(response, 200, { packages:await listHrPackages() });
    if (request.method === 'POST' && url.pathname === '/api/hr/packages') return json(response, 201, { package:await createHrPackage(await readJson(request, 42*1024*1024)) });
    if (request.method === 'DELETE' && /^\/api\/hr\/packages\/[^/]+$/.test(url.pathname)) {
      const deleted=await deleteHrPackage(decodeURIComponent(url.pathname.split('/')[4]));
      return json(response,deleted?200:404,{deleted});
    }
    if (request.method === 'GET' && /^\/api\/hr\/packages\/[^/]+\/file$/.test(url.pathname)) {
      const packageRecord=await getHrPackage(decodeURIComponent(url.pathname.split('/')[4]));
      if(!packageRecord||await access(packageRecord.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Employee Package file not found'});
      const safeName=packageRecord.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':packageRecord.type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=300'});
      return createReadStream(packageRecord.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/integrations/docusign/status') return json(response, 200, getDocusignStatus());
    if (request.method === 'POST' && url.pathname === '/api/integrations/docusign/envelopes') return json(response, 201, { envelope:await createDocusignEnvelope(await readJson(request, 256*1024)) });
    if (request.method === 'POST' && url.pathname === '/api/operational/airtable/sync') {
      const configuredKey=process.env.OPERATIONAL_AIRTABLE_SYNC_KEY;
      if(!configuredKey||request.headers['x-sync-key']!==configuredKey)return json(response,401,{error:'Unauthorized'});
      return json(response,200,{ok:true,snapshot:await syncOperationalAirtable()});
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/operational/airtable/attachments/')) {
      const attachment=getOperationalAttachment(decodeURIComponent(url.pathname.split('/').pop()));
      if(!attachment||await access(attachment.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Attachment not found'});
      const safeName=attachment.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':attachment.type||'application/octet-stream','content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=3600'});
      return createReadStream(attachment.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/status') return json(response, 200, getAcaIntegrationStatus());
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/records') return json(response, 200, { records:listAcaRecords(url.searchParams.get('source')||'') });
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/checks') return json(response, 200, { checks:listAcaRpaChecks(url.searchParams.get('source')||'') });
    if (request.method === 'POST' && url.pathname === '/api/integrations/aca/checks') return json(response, 201, { check:createAcaRpaCheck(await readJson(request)) });
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/rpa/jobs/next') {
      const configuredKey=process.env.ACA_RPA_CALLBACK_KEY||process.env.ACA_INTEGRATION_KEY;
      if(!configuredKey||request.headers['x-rpa-key']!==configuredKey)return json(response,401,{error:'Unauthorized'});
      return json(response,200,{job:claimNextAcaRpaCheck()});
    }
    if (request.method === 'POST' && /^\/api\/integrations\/aca\/rpa\/jobs\/[^/]+\/result$/.test(url.pathname)) {
      const configuredKey=process.env.ACA_RPA_CALLBACK_KEY||process.env.ACA_INTEGRATION_KEY;
      if(!configuredKey||request.headers['x-rpa-key']!==configuredKey)return json(response,401,{error:'Unauthorized'});
      const id=decodeURIComponent(url.pathname.split('/')[6]);
      return json(response,200,{check:completeAcaRpaCheck(id,await readJson(request,8*1024*1024))});
    }
    if (request.method === 'POST' && url.pathname === '/api/integrations/aca/import') {
      const configuredKey=process.env.ACA_RPA_CALLBACK_KEY||process.env.ACA_INTEGRATION_KEY;
      if(!configuredKey)return json(response,503,{error:'ACA RPA receiver key is not configured'});
      if(request.headers['x-rpa-key']!==configuredKey)return json(response,401,{error:'Unauthorized'});
      return json(response,201,{run:importAcaRecords(await readJson(request,8*1024*1024))});
    }
    if (/^\/api\/licenses\/providers\/[^/]+\/documents$/.test(url.pathname)) {
      const providerId=decodeURIComponent(url.pathname.split('/')[4]);
      if(request.method==='GET')return json(response,200,{documents:listDoctorDocuments(providerId)});
      if(request.method==='POST')return json(response,201,{document:await createDoctorDocument(providerId,await readJson(request,28*1024*1024))});
    }
    if (request.method === 'GET' && /^\/api\/licenses\/documents\/[^/]+\/file$/.test(url.pathname)) {
      const document=getDoctorDocument(decodeURIComponent(url.pathname.split('/')[4]));
      if(!document||await access(document.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Document not found'});
      const safeName=document.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':document.type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=3600'});
      return createReadStream(document.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/inventory/requests') return json(response, 200, { requests:listInventoryRequests(url.searchParams.get('scopeId')||undefined) });
    if (request.method === 'POST' && url.pathname === '/api/inventory/requests') return json(response, 201, { request:createInventoryRequest(await readJson(request)) });
    if (request.method === 'PATCH' && /^\/api\/inventory\/requests\/[^/]+\/decision$/.test(url.pathname)) {
      if(request.headers['x-actor-role']!=='manager')return json(response,403,{error:'Manager role required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);
      const body=await readJson(request);
      return json(response,200,{request:decideInventoryRequest(id,body.status)});
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/academy/attachments/')) {
      const attachment = getAcademyAttachment(decodeURIComponent(url.pathname.split('/').pop()));
      if (!attachment || await access(attachment.filePath).then(() => false).catch(() => true)) return json(response, 404, { error: 'Attachment not found' });
      const safeName = attachment.filename.replace(/["\r\n]/g, '_');
      response.writeHead(200, { 'content-type': attachment.type || 'application/octet-stream', 'content-disposition': `inline; filename="${safeName}"`, 'cache-control': 'private, max-age=3600' });
      return createReadStream(attachment.filePath).pipe(response);
    }
    if (request.method === 'POST' && url.pathname === '/api/academy/sync') {
      const configuredKey = process.env.ACADEMY_SYNC_KEY;
      if (!configuredKey || request.headers['x-sync-key'] !== configuredKey) return json(response, 401, { error: 'Unauthorized' });
      const status = await syncAcademyBackend();
      return json(response, 200, { ok: true, status });
    }
    if (url.pathname.startsWith('/api/')) return json(response, 404, { error: 'Not found' });
    return serveStatic(request, response);
  } catch (error) {
    const status = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
    return json(response, status, { error: error.message });
  }
});

await ingestAcademyExport().catch(() => null);
if (process.env.ACADEMY_SYNC_ON_START === 'true') syncAcademyBackend().catch((error) => console.error('Academy startup sync failed:', error.message));
if (process.env.OPERATIONAL_AIRTABLE_SYNC_ON_START === 'true') syncOperationalAirtable().catch((error) => console.error('Operational Airtable startup sync failed:', error.message));
server.listen(port, '127.0.0.1', () => console.log(`Operational Hub backend listening on http://127.0.0.1:${port}`));
