import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { getAcademyAttachment, getAcademyCatalog, getAcademyStatus, ingestAcademyExport } from './academy-store.mjs';
import { createAcademyCertificate, getAcademyLearnerPhoto, getAcademyLearnerRecord, listAcademyLearnerRecords, recordAcademyEvent, upsertAcademyLearner } from './academy-records.mjs';
import { syncAcademyBackend } from './academy-sync.mjs';
import { getAcademyWelcomeVideoStatus, saveAcademyWelcomeVideo, streamAcademyWelcomeVideo } from './academy-welcome-video.mjs';
import { createInventoryRequest, decideInventoryRequest, listInventoryRequests } from './inventory-store.mjs';
import { createItProposal, createItRoadmap, getItProposal, listItApplicationScopes, listItApplications, listItProposals, listItRoadmap, syncItApplicationScope, updateItProposal, updateItRoadmap } from './it-store.mjs';
import { createDoctorDocument, getDoctorDocument, listDoctorDocuments } from './license-store.mjs';
import { claimNextAcaRpaCheck, completeAcaRpaCheck, createAcaRpaCheck, getAcaIntegrationStatus, importAcaRecords, listAcaRecords, listAcaRpaChecks } from './aca-store.mjs';
import { getOperationalAttachment, getOperationalSnapshot, updateOperationalContractStatus } from './operational-airtable-store.mjs';
import { syncOperationalAirtable } from './operational-airtable-sync.mjs';
import { getAiEngineStatus, runOperationalAi } from './ai-engine.mjs';
import { createCorporateAttachment, createCorporateNote, createCorporateRecord, generateCorporateDocument, getCorporateAttachment, getCorporateRecord, listCorporateRecords, updateCorporateRecord } from './corporate-store.mjs';
import {
  createResearchFollowup, createResearchLead, createResearchSafetyEvent, createResearchScreening,
  createResearchAgreement, createResearchStudy, getResearchAgreement, getResearchLead, getResearchStatus, getResearchStudy, listResearchAgreements, listResearchLeads,
  listResearchOutbox, listResearchStudies, recordResearchIntegrationEvent, updateResearchAgreement, updateResearchLead,
  updateResearchStudy, upsertResearchLeadFromEmConnect,
} from './research-store.mjs';
import { emConnectStatus, parseEmConnectResearchEvent, universalStatus } from './research-integrations.mjs';
import { createHrPackage, deleteHrPackage, getHrPackage, listHrPackages } from './hr-package-store.mjs';
import { getHrPackageEmailStatus, sendHrPackageEmail } from './hr-package-email.mjs';
import {
  archiveHrPackageReturn, createHrPackageWorkflow, findHrPackageReturnByExternalReference,
  findHrPackageWorkflowByExternalReference, getHrPackageReturn, getPublicHrPackageWorkflow,
  listHrPackageWorkflows, markHrPackageReturnAssigned, readHrPackageReturn, updateHrPackageWorkflow,
} from './hr-package-workflow-store.mjs';
import {
  archiveHrDocument, createHrDocumentRequest, deleteHrDossierDocument, findHrDocumentByExternalReference,
  findHrDocumentRequestsByExternalReference, findHrEmployeeClassification, getHrDossierDocument, getHrDocumentRequest,
  listHrComplianceItems, listHrDossierDocuments, listHrDocumentRequests, listHrEmployeeClassifications,
  updateHrComplianceItem, updateHrEmployeeClassification,
} from './hr-dossier-store.mjs';
import { createDocusignEnvelope, downloadDocusignCombinedDocument, getDocusignStatus, verifyDocusignConnectSignature } from './docusign.mjs';
import { createWorkspaceResource, deleteWorkspaceResource, getWorkspaceResource, listWorkspaceResources } from './workspace-resource-store.mjs';
import { createResearchWorkspaceIdea, deleteResearchWorkspaceIdea, getResearchWorkspaceIdea, listResearchWorkspaceIdeas, updateResearchWorkspaceIdea } from './research-workspace-store.mjs';
import { createResearchWorkspaceItem, deleteResearchWorkspaceItem, getResearchWorkspaceItem, listResearchWorkspaceItems, updateResearchWorkspaceItem } from './research-workspace-items-store.mjs';
import {
  createFundamentalStudy, createFundamentalStudyDocument, createFundamentalStudyRequirement,
  deleteFundamentalStudyDocument, getFundamentalStudy, listFundamentalStudies, prepareFundamentalStudyAgent,
  updateFundamentalStudy, updateFundamentalStudyRequirement,
} from './research-fundamental-studies-store.mjs';
import { fundamentalStudyAgentStatus } from './research-integrations.mjs';
import {
  acceptInvitation, deleteAccessUser, getAccessSystemStatus, getInvitation, inviteAccessUser,
  listAccessUsers, loginAccessUser, logoutAccessSession, resendAccessInvitation,
  resolveAccessSession, updateAccessUser,
} from './access-store.mjs';

const port = Number(process.env.PORT || 4176);
const host = process.env.HOST || '0.0.0.0';
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

const permissionRank = { none:0, view:1, manage:2 };
const operationalPermissionKeys = [
  'dashboard', 'contracting', 'credentialing', 'licenses', 'doctor-licenses', 'human-resources',
  'entity-medical', 'entity-care305', 'entity-aesthetics', 'entity-seven', 'entity-research',
];

function requestIdentity(request) {
  const token=accessToken(request);
  return token?resolveAccessSession(token):null;
}

function permissionLevel(session,key){
  if(!session||!key)return 'none';
  if(session.role==='owner'||session.role==='admin'||session.scope==='full')return 'manage';
  const value=session.permissions?.[key]||(key==='human-resources'?session.permissions?.personnel:null);
  return Object.hasOwn(permissionRank,value)?value:'none';
}

function hasModuleAccess(session,keys,required='view'){
  const minimum=permissionRank[required]||permissionRank.view;
  return Boolean(session)&&[].concat(keys).some(key=>(permissionRank[permissionLevel(session,key)]||0)>=minimum);
}

const researchSensitivePermissionKeys = new Set([
  'research-leads:view','research-leads:manage','research-leads:contact:view',
  'research-studies:view','research-studies:manage','research-sync:manage',
  'research-fundamental-studies:view','research-fundamental-studies:manage',
]);

function explicitPermissionLevel(session, key) {
  if (!session) return 'none';
  const value = session.permissions?.[key];
  return Object.hasOwn(permissionRank, value) ? value : 'none';
}

function hasExplicitResearchPermission(session, key, required = 'view') {
  if (!researchSensitivePermissionKeys.has(key)) return false;
  return permissionRank[explicitPermissionLevel(session, key)] >= (permissionRank[required] || permissionRank.view);
}

function hasResearchEntityScope(session) {
  return Boolean(session) && (permissionRank[explicitPermissionLevel(session, 'entity-research')] || 0) >= permissionRank.view;
}

function researchActor(request, permissionKey, required = 'view') {
  const actor = requestIdentity(request);
  if (!actor) return { actor: null, status: 401 };
  if (!hasResearchEntityScope(actor) || !hasExplicitResearchPermission(actor, permissionKey, required)) return { actor, status: 403 };
  return { actor, status: 200 };
}

function researchDataActor(request, permissionKey, required = 'view') {
  const result = researchActor(request, permissionKey, required);
  return result.status === 200 ? result.actor : null;
}

function researchActorAny(request, permissionKeys, required = 'view') {
  const actor = requestIdentity(request);
  if (!actor) return { actor: null, status: 401 };
  if (!hasResearchEntityScope(actor) || !permissionKeys.some(key => hasExplicitResearchPermission(actor, key, required))) return { actor, status: 403 };
  return { actor, status: 200 };
}

function entityScopeKeys(actor) {
  const mapping = {
    'entity-medical': 'medical',
    'entity-care305': 'care305',
    'entity-aesthetics': 'aesthetics',
    'entity-seven': 'seven',
    'entity-research': 'research',
  };
  return Object.entries(mapping).filter(([key]) => ['view','manage'].includes(explicitPermissionLevel(actor, key))).map(([, value]) => value);
}

function filterEntityRows(actor, rows) {
  if (actor?.role === 'owner' || actor?.role === 'admin' || actor?.scope === 'full') return rows;
  const scoped = entityScopeKeys(actor);
  if (!scoped.length) return [];
  return rows.filter(item => item.entityKey && scoped.includes(item.entityKey));
}

function academyRecordActor(request,learnerId,required='view'){
  const actor=requestIdentity(request);
  if(!hasModuleAccess(actor,'academy',required))return null;
  const ownsRecord=String(actor.learnerId||actor.id)===String(learnerId||'');
  return ownsRecord||hasModuleAccess(actor,'academy','manage')?actor:null;
}

function filteredOperationalSnapshot(actor){
  const snapshot=getOperationalSnapshot();
  if(actor?.role==='owner'||actor?.role==='admin'||actor?.scope==='full')return snapshot;
  const canCredentialing=hasModuleAccess(actor,'credentialing');
  const broadProviderAccess=hasModuleAccess(actor,'human-resources','manage')||hasModuleAccess(actor,['doctor-licenses','licenses'])||canCredentialing;
  const canViewOwnProvider=hasModuleAccess(actor,'human-resources');
  const canContracts=hasModuleAccess(actor,['contracting','credentialing']);
  const canLicenses=hasModuleAccess(actor,['licenses','doctor-licenses']);
  const canEntities=hasModuleAccess(actor,['entity-medical','entity-care305','entity-aesthetics','entity-seven','entity-research'])||canCredentialing||hasModuleAccess(actor,'contracting');
  const entityProviderAccess=hasModuleAccess(actor,['entity-medical','entity-care305','entity-aesthetics','entity-research']);
  const ownProviders=canViewOwnProvider?snapshot.providers.filter(item=>String(item.email||'').toLowerCase()===String(actor.email||'').toLowerCase()):[];
  const entityProviderSummaries=entityProviderAccess?snapshot.providers.filter(item=>{
    const key=item.entityKey;
    if(!key)return false;
    return entityScopeKeys(actor).includes(key);
  }).map(item=>({recordId:item.recordId,name:item.name,status:item.status,degree:item.degree,credentialed:item.credentialed,role:item.role,entity:item.entity,entityKey:item.entityKey,lifecycle:item.lifecycle,workMode:item.workMode,initials:item.initials,source:'Restricted entity directory'})):[];
  return {
    status:snapshot.status,
    providers:broadProviderAccess?snapshot.providers:ownProviders.length?ownProviders:entityProviderSummaries,
    contracts:canContracts?snapshot.contracts:[],
    licenses:canLicenses?snapshot.licenses:[],
    entities:canEntities ? (canCredentialing || hasModuleAccess(actor,'contracting') ? snapshot.entities : filterEntityRows(actor, snapshot.entities)) : [],
  };
}

async function hrDossierFor(user){
  let academy=null;
  try{academy=await getAcademyLearnerRecord(user.id)}catch(error){if(error.statusCode!==404)throw error}
  const provider=getOperationalSnapshot().providers.find(item=>String(item.email||'').toLowerCase()===String(user.email||'').toLowerCase())||null;
  const normalizeIdentity=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(dr|doctor|md|do|employee)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
  const identities=[user.name,user.email,provider?.name,provider?.email].map(normalizeIdentity).filter(value=>value.length>3);
  const belongsToEmployee=record=>{const subject=normalizeIdentity(record.subject);return identities.some(identity=>subject===identity||(identity.length>7&&subject.includes(identity))||(subject.length>7&&identity.includes(subject)))};
  return {
    user:{id:user.id,name:user.name,email:user.email,employmentStatus:user.employmentStatus,accountStatus:user.accountStatus,accessProfile:user.accessProfile},
    academy,
    provider,
    documents:listHrDossierDocuments(user.id),
    requests:listHrDocumentRequests(user.id),
    compliance:listHrComplianceItems(user.id),
    aca:{background:listAcaRecords('background').filter(belongsToEmployee),roster:listAcaRecords('roster').filter(belongsToEmployee)},
    classification:findHrEmployeeClassification([provider?.recordId,user.id,`access-${user.id}`]),
  };
}

function sessionCookie(request, token, maxAge = 7 * 24 * 60 * 60) {
  const forwarded = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const secure = process.env.NODE_ENV === 'production' || forwarded === 'https';
  return `oh_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function requestBaseUrl(request) {
  if (process.env.APP_PUBLIC_URL) return process.env.APP_PUBLIC_URL;
  const forwardedHost = String(request.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const requestedHost = forwardedHost || String(request.headers.host || '');
  let host = /^[a-z0-9.:[\]-]+$/i.test(requestedHost) ? requestedHost : `127.0.0.1:${port}`;
  const forwarded = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwarded || 'http';
  if (process.env.NODE_ENV !== 'production') {
    try {
      const localUrl = new URL(`${protocol}://${host}`);
      if (['127.0.0.1', 'localhost', '[::1]'].includes(localUrl.hostname) && Number(localUrl.port || port) === port) {
        localUrl.port = String(process.env.FRONTEND_PORT || 4173);
        return localUrl.origin;
      }
    } catch {}
  }
  return `${protocol}://${host}`;
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
  return null;
}

function academyManager(request) {
  const session = resolveAccessSession(accessToken(request));
  if (hasModuleAccess(session,'academy','manage')) return session;
  return null;
}

function itManager(request) {
  const actor = requestIdentity(request);
  return actor && actor.permissions?.['it:manage'] === 'manage' ? actor : null;
}

function itActor(request) {
  const actor = requestIdentity(request);
  return actor ? { actor, status: 200 } : { actor: null, status: 401 };
}

function corporateActor(request) {
  const actor = requestIdentity(request);
  if (!actor) return { actor: null, status: 401 };
  if (actor.role === 'owner' || actor.scope === 'full') return { actor, status: 200 };
  return { actor, status: 403 };
}

const workspaceResourcePermissionKeys = {
  hub: 'dashboard',
  dashboard: 'dashboard',
  leads: 'leads',
  protocols: 'protocols',
  licenses: 'licenses',
  'doctor-licenses': 'doctor-licenses',
  credentialing: 'credentialing',
  contracting: 'contracting',
  research: 'entity-research',
  'entity-medical': 'entity-medical',
  'entity-care305': 'entity-care305',
  'entity-aesthetics': 'entity-aesthetics',
  'entity-seven': 'entity-seven',
  'entity-research': 'entity-research',
  'human-resources': 'human-resources',
  'admin-users': 'admin-users',
  academy: 'academy',
  learning: 'academy',
  systems: 'academy',
  certificates: 'academy',
  team: 'academy',
};

function workspaceResourceActor(request, scopeKey, required = 'view') {
  const actor = requestIdentity(request);
  if (!actor) return { actor: null, status: 401 };
  const scope = String(scopeKey || '').trim().toLowerCase();
  if (scope === 'corporate') {
    const access = corporateActor(request);
    if (access.status !== 200) return access;
    return { actor, status: 200 };
  }
  if (scope === 'it') {
    if (required === 'manage' && !itManager(request)) return { actor, status: 403 };
    return { actor, status: 200 };
  }
  if (scope === 'admin-users') {
    return adminActor(request, required === 'manage') ? { actor, status: 200 } : { actor, status: 403 };
  }
  const permissionKey = workspaceResourcePermissionKeys[scope];
  if (!permissionKey || !hasModuleAccess(actor, permissionKey, required)) return { actor, status: 403 };
  return { actor, status: 200 };
}

async function readBuffer(request,maxBytes=131072){
  const chunks=[];let size=0;
  for await(const chunk of request){size+=chunk.length;if(size>maxBytes)throw new Error('Request body too large');chunks.push(chunk)}
  return Buffer.concat(chunks);
}

async function readJson(request,maxBytes=131072){return JSON.parse((await readBuffer(request,maxBytes)).toString('utf8')||'{}')}

function scopeSyncAuthorized(request) {
  const configured = String(process.env.IT_SCOPE_SYNC_KEY || '').trim();
  if (!configured) return false;
  const header = String(request.headers['x-it-scope-sync-key'] || '').trim();
  const bearer = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  return header === configured || bearer === configured;
}

async function relayScopeToUniversal(payload) {
  const baseUrl = String(process.env.UNIVERSAL_BASE_URL || '').trim();
  const token = String(process.env.UNIVERSAL_SYNC_TOKEN || '').trim();
  if (!baseUrl || !token) return { configured: false, delivered: false };
  try {
    const endpoint = new URL('/api/integrations/application-push', baseUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-it-scope-sync-key': token },
      body: JSON.stringify({ ...payload, source: 'operational-hub-relay' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { configured: true, delivered: response.ok, status: response.status };
  } catch {
    return { configured: true, delivered: false };
  }
}

async function refreshApplicationScopeManifests() {
  const applications = listItApplications().filter(application => application.accessUrl);
  const results = await Promise.all(applications.map(async application => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const endpoint = new URL('/.well-known/operational-scope.json', application.accessUrl).toString();
      const response = await fetch(endpoint, { headers: { accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) return { applicationId: application.id, refreshed: false };
      const manifest = await response.json();
      syncItApplicationScope({ ...manifest, applicationId: manifest.applicationId || application.id, source: 'application-manifest' }, 'integration:application-manifest');
      return { applicationId: application.id, refreshed: true };
    } catch {
      return { applicationId: application.id, refreshed: false };
    } finally {
      clearTimeout(timeout);
    }
  }));
  return results;
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
    if (request.method === 'GET' && /^\/api\/hr\/package-portal\/[^/]+\/templates\/[^/]+\/file$/.test(url.pathname)) {
      const parts=url.pathname.split('/');const token=decodeURIComponent(parts[4]);const packageId=decodeURIComponent(parts[6]);const workflow=await getPublicHrPackageWorkflow(token);
      if(!workflow||workflow.expired||workflow.status==='assigned'||!workflow.packageIds.includes(packageId))return json(response,404,{error:'Employee Package document is not available'});
      const packageRecord=await getHrPackage(packageId);if(!packageRecord||await access(packageRecord.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Employee Package document not found'});
      const safeName=packageRecord.filename.replace(/["\r\n]/g,'_');response.writeHead(200,{'content-type':packageRecord.type,'content-disposition':`attachment; filename="${safeName}"`,'cache-control':'private, no-store'});
      return createReadStream(packageRecord.filePath).pipe(response);
    }
    if (request.method === 'POST' && /^\/api\/hr\/package-portal\/[^/]+\/returns$/.test(url.pathname)) {
      const token=decodeURIComponent(url.pathname.split('/')[4]);const workflow=await getPublicHrPackageWorkflow(token);
      if(!workflow)return json(response,404,{error:'Employee Package link not found'});if(workflow.expired)return json(response,410,{error:'This Employee Package link has expired'});
      return json(response,201,{document:await archiveHrPackageReturn(workflow.id,await readJson(request,42*1024*1024),'candidate-portal')});
    }
    if (request.method === 'GET' && /^\/api\/hr\/package-portal\/[^/]+$/.test(url.pathname)) {
      const token=decodeURIComponent(url.pathname.split('/')[4]);const workflow=await getPublicHrPackageWorkflow(token);
      if(!workflow)return json(response,404,{error:'Employee Package link not found'});
      return json(response,200,{workflow:{candidateName:workflow.candidateName,candidateEmail:workflow.candidateEmail,deliveryMethod:workflow.deliveryMethod,status:workflow.status,subject:workflow.subject,message:workflow.message,dueAt:workflow.dueAt,expiresAt:workflow.expiresAt,expired:workflow.expired,assignedAt:workflow.assignedAt,packages:workflow.packages.map(item=>({...item,fileUrl:`/api/hr/package-portal/${encodeURIComponent(token)}/templates/${encodeURIComponent(item.id)}/file`})),returns:workflow.returns.map(item=>({id:item.id,filename:item.filename,type:item.type,size:item.size,status:item.status,receivedAt:item.receivedAt}))}});
    }
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
      if(request.method==='PATCH')return json(response,200,updateAccessUser(id,await readJson(request),actor.id));
      if(request.method==='DELETE'){const deleted=deleteAccessUser(id,actor.id);return json(response,deleted?200:404,{deleted})}
    }
    if (request.method === 'GET' && url.pathname === '/api/ai/status') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});
      return json(response, 200, await getAiEngineStatus(actor));
    }
    if (request.method === 'POST' && url.pathname === '/api/ai/chat') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});
      return json(response, 200, await runOperationalAi(await readJson(request, 256 * 1024),actor));
    }
    if (request.method === 'GET' && /^\/api\/workspace-resources\/[^/]+\/file$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split('/')[3]);
      const resource = getWorkspaceResource(id);
      const resourceAccess = workspaceResourceActor(request, resource?.scope_key, 'view');
      if (resourceAccess.status !== 200) return json(response, resourceAccess.status, { error: resourceAccess.status === 401 ? 'Authentication required' : 'Resource access required' });
      if (!resource?.file_path || await access(resource.file_path).then(() => false).catch(() => true)) return json(response, 404, { error: 'Resource file not found' });
      const safeName = (resource.filename || 'workspace-resource').replace(/["\r\n]/g, '_');
      response.writeHead(200, { 'content-type': resource.content_type || 'application/octet-stream', 'content-disposition': `inline; filename="${safeName}"`, 'cache-control': 'private, max-age=300' });
      return createReadStream(resource.file_path).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/research-workspace/ideas') {
      const scopeKey = url.searchParams.get('scope') || 'entity-research';
      const ideaAccess = workspaceResourceActor(request, scopeKey, 'view');
      if (ideaAccess.status !== 200) return json(response, ideaAccess.status, { error: ideaAccess.status === 401 ? 'Authentication required' : 'Research workspace access required' });
      return json(response, 200, { ideas: listResearchWorkspaceIdeas(scopeKey), canCreate: true, canManage: workspaceResourceActor(request, scopeKey, 'manage').status === 200 });
    }
    if (request.method === 'POST' && url.pathname === '/api/research-workspace/ideas') {
      const body = await readJson(request, 256 * 1024);
      const ideaAccess = workspaceResourceActor(request, body.scopeKey || 'entity-research', 'view');
      if (ideaAccess.status !== 200) return json(response, ideaAccess.status, { error: ideaAccess.status === 401 ? 'Authentication required' : 'Research workspace Manage access required' });
      return json(response, 201, { idea: createResearchWorkspaceIdea(body, ideaAccess.actor) });
    }
    if (/^\/api\/research-workspace\/ideas\/[^/]+$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split('/')[4]);
      const existing = getResearchWorkspaceIdea(id);
      const ideaAccess = workspaceResourceActor(request, existing?.scope_key || 'entity-research', 'manage');
      if (ideaAccess.status !== 200) return json(response, ideaAccess.status, { error: ideaAccess.status === 401 ? 'Authentication required' : 'Research workspace Manage access required' });
      if (request.method === 'PATCH') return json(response, existing ? 200 : 404, existing ? { idea: updateResearchWorkspaceIdea(id, await readJson(request, 256 * 1024)) } : { error: 'Research idea not found' });
      if (request.method === 'DELETE') return json(response, deleteResearchWorkspaceIdea(id) ? 200 : 404, { deleted: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/research-workspace/items') {
      const scopeKey = url.searchParams.get('scope') || 'entity-research';
      const itemAccess = workspaceResourceActor(request, scopeKey, 'view');
      if (itemAccess.status !== 200) return json(response, itemAccess.status, { error: itemAccess.status === 401 ? 'Authentication required' : 'Research workspace access required' });
      return json(response, 200, { items: listResearchWorkspaceItems(scopeKey), canCreate: true, canManage: workspaceResourceActor(request, scopeKey, 'manage').status === 200 });
    }
    if (request.method === 'POST' && url.pathname === '/api/research-workspace/items') {
      const body = await readJson(request, 42 * 1024 * 1024);
      const itemAccess = workspaceResourceActor(request, body.scopeKey || 'entity-research', 'view');
      if (itemAccess.status !== 200) return json(response, itemAccess.status, { error: itemAccess.status === 401 ? 'Authentication required' : 'Research workspace access required' });
      return json(response, 201, { item: createResearchWorkspaceItem(body, itemAccess.actor) });
    }
    if (/^\/api\/research-workspace\/items\/[^/]+$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split('/')[4]);
      const existing = getResearchWorkspaceItem(id);
      const itemAccess = workspaceResourceActor(request, existing?.scope_key || 'entity-research', 'manage');
      if (itemAccess.status !== 200) return json(response, itemAccess.status, { error: itemAccess.status === 401 ? 'Authentication required' : 'Research workspace Manage access required' });
      if (request.method === 'PATCH') return json(response, existing ? 200 : 404, existing ? { item: updateResearchWorkspaceItem(id, await readJson(request, 42 * 1024 * 1024)) } : { error: 'Research workspace item not found' });
      if (request.method === 'DELETE') return json(response, deleteResearchWorkspaceItem(id) ? 200 : 404, { deleted: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/research/fundamental-studies/agents/status') {
      const access = researchActorAny(request, ['research-fundamental-studies:view', 'research-fundamental-studies:manage']);
      if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Fundamental Studies access required' });
      return json(response, 200, fundamentalStudyAgentStatus());
    }
    if (request.method === 'GET' && url.pathname === '/api/research/fundamental-studies') {
      const access = researchActorAny(request, ['research-fundamental-studies:view', 'research-fundamental-studies:manage']);
      if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Fundamental Studies access required' });
      return json(response, 200, { studies: listFundamentalStudies(Object.fromEntries(url.searchParams.entries())), canManage: hasExplicitResearchPermission(access.actor, 'research-fundamental-studies:manage', 'manage') });
    }
    if (request.method === 'POST' && url.pathname === '/api/research/fundamental-studies') {
      const actor = researchDataActor(request, 'research-fundamental-studies:manage', 'manage');
      if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'Fundamental Studies Manage access required' : 'Authentication required' });
      return json(response, 201, { study: createFundamentalStudy(await readJson(request, 128 * 1024), actor) });
    }
    if (/^\/api\/research\/fundamental-studies\/[^/]+\/agents\/prepare$/.test(url.pathname)) {
      const actor = researchDataActor(request, 'research-fundamental-studies:manage', 'manage');
      if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'Fundamental Studies Manage access required' : 'Authentication required' });
      const studyId = decodeURIComponent(url.pathname.split('/')[4]);
      const result = prepareFundamentalStudyAgent(studyId, await readJson(request, 32 * 1024), actor, fundamentalStudyAgentStatus());
      return json(response, result ? 200 : 404, result ? { result } : { error: 'Fundamental Study not found' });
    }
    if (/^\/api\/research\/fundamental-studies\/[^/]+\/requirements$/.test(url.pathname)) {
      const actor = researchDataActor(request, 'research-fundamental-studies:manage', 'manage');
      if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'Fundamental Studies Manage access required' : 'Authentication required' });
      const studyId = decodeURIComponent(url.pathname.split('/')[4]);
      const requirement = createFundamentalStudyRequirement(studyId, await readJson(request, 32 * 1024), actor);
      return json(response, requirement ? 201 : 404, requirement ? { requirement } : { error: 'Fundamental Study not found' });
    }
    if (/^\/api\/research\/fundamental-studies\/[^/]+\/documents$/.test(url.pathname)) {
      const actor = researchDataActor(request, 'research-fundamental-studies:manage', 'manage');
      if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'Fundamental Studies Manage access required' : 'Authentication required' });
      const studyId = decodeURIComponent(url.pathname.split('/')[4]);
      const body = await readJson(request, 42 * 1024 * 1024);
      if (body.resourceId) {
        const resource = getWorkspaceResource(body.resourceId);
        if (!resource || resource.scope_key !== 'entity-research') return json(response, 404, { error: 'Authorized Research document resource not found' });
      }
      const document = createFundamentalStudyDocument(studyId, body, actor);
      return json(response, document ? 201 : 404, document ? { document } : { error: 'Fundamental Study not found' });
    }
    if (/^\/api\/research\/fundamental-studies\/[^/]+\/requirements\/[^/]+$/.test(url.pathname)) {
      const actor = researchDataActor(request, 'research-fundamental-studies:manage', 'manage');
      if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'Fundamental Studies Manage access required' : 'Authentication required' });
      const requirementId = decodeURIComponent(url.pathname.split('/')[6]);
      return json(response, 200, { requirement: updateFundamentalStudyRequirement(requirementId, await readJson(request, 32 * 1024), actor) });
    }
    if (/^\/api\/research\/fundamental-studies\/[^/]+\/documents\/[^/]+$/.test(url.pathname)) {
      const actor = researchDataActor(request, 'research-fundamental-studies:manage', 'manage');
      if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'Fundamental Studies Manage access required' : 'Authentication required' });
      const documentId = decodeURIComponent(url.pathname.split('/')[6]);
      const deleted = deleteFundamentalStudyDocument(documentId, actor);
      return json(response, deleted ? 200 : 404, deleted ? { deleted: true } : { error: 'Fundamental Study document not found' });
    }
    if (/^\/api\/research\/fundamental-studies\/[^/]+$/.test(url.pathname)) {
      const studyId = decodeURIComponent(url.pathname.split('/')[4]);
      const access = researchActorAny(request, ['research-fundamental-studies:view', 'research-fundamental-studies:manage']);
      if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Fundamental Studies access required' });
      const study = getFundamentalStudy(studyId);
      if (request.method === 'GET') return json(response, study ? 200 : 404, study ? { study } : { error: 'Fundamental Study not found' });
      if (request.method === 'PATCH') {
        if (!hasExplicitResearchPermission(access.actor, 'research-fundamental-studies:manage', 'manage')) return json(response, 403, { error: 'Fundamental Studies Manage access required' });
        return json(response, study ? 200 : 404, study ? { study: updateFundamentalStudy(studyId, await readJson(request, 128 * 1024), access.actor) } : { error: 'Fundamental Study not found' });
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/workspace-resources') {
      const scopeKey = url.searchParams.get('scope') || '';
      const resourceAccess = workspaceResourceActor(request, scopeKey, 'view');
      if (resourceAccess.status !== 200) return json(response, resourceAccess.status, { error: resourceAccess.status === 401 ? 'Authentication required' : 'Resource access required' });
      return json(response, 200, { resources: listWorkspaceResources(scopeKey), canContribute: scopeKey === 'entity-research' ? workspaceResourceActor(request, scopeKey, 'view').status === 200 : workspaceResourceActor(request, scopeKey, 'manage').status === 200, canManage: workspaceResourceActor(request, scopeKey, 'manage').status === 200 });
    }
    if (request.method === 'POST' && url.pathname === '/api/workspace-resources') {
      const body = await readJson(request, 42 * 1024 * 1024);
      const resourceAccess = workspaceResourceActor(request, body.scopeKey, body.scopeKey === 'entity-research' ? 'view' : 'manage');
      if (resourceAccess.status !== 200) return json(response, resourceAccess.status, { error: resourceAccess.status === 401 ? 'Authentication required' : 'Resource Manage access required' });
      return json(response, 201, { resource: await createWorkspaceResource(body, resourceAccess.actor) });
    }
    if (request.method === 'DELETE' && /^\/api\/workspace-resources\/[^/]+$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split('/')[3]);
      const resource = getWorkspaceResource(id);
      const resourceAccess = workspaceResourceActor(request, resource?.scope_key, 'manage');
      if (resourceAccess.status !== 200) return json(response, resourceAccess.status, { error: resourceAccess.status === 401 ? 'Authentication required' : 'Resource Manage access required' });
      const deleted = await deleteWorkspaceResource(id);
      return json(response, deleted ? 200 : 404, deleted ? { deleted: true } : { error: 'Resource not found' });
    }
    if (request.method === 'GET' && url.pathname === '/api/corporate/records') {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      return json(response, 200, { records: listCorporateRecords(url.searchParams.get('category') || '') });
    }
    if (request.method === 'POST' && url.pathname === '/api/corporate/records') {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      return json(response, 201, { record: createCorporateRecord(await readJson(request, 256 * 1024), access.actor) });
    }
    if (request.method === 'GET' && /^\/api\/corporate\/records\/[^/]+$/.test(url.pathname)) {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      const record = getCorporateRecord(decodeURIComponent(url.pathname.split('/')[4]));
      return json(response, record ? 200 : 404, record ? { record } : { error: 'Corporate record not found' });
    }
    if (request.method === 'PATCH' && /^\/api\/corporate\/records\/[^/]+$/.test(url.pathname)) {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      return json(response, 200, { record: updateCorporateRecord(decodeURIComponent(url.pathname.split('/')[4]), await readJson(request, 256 * 1024), access.actor) });
    }
    if (request.method === 'POST' && /^\/api\/corporate\/records\/[^/]+\/notes$/.test(url.pathname)) {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      return json(response, 201, { record: createCorporateNote(decodeURIComponent(url.pathname.split('/')[4]), (await readJson(request, 32 * 1024)).note, access.actor) });
    }
    if (request.method === 'POST' && /^\/api\/corporate\/records\/[^/]+\/document$/.test(url.pathname)) {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      return json(response, 200, { record: generateCorporateDocument(decodeURIComponent(url.pathname.split('/')[4]), (await readJson(request, 64 * 1024)).prompt, access.actor) });
    }
    if (request.method === 'POST' && /^\/api\/corporate\/records\/[^/]+\/attachments$/.test(url.pathname)) {
      const access = corporateActor(request); if (access.status !== 200) return json(response, access.status, { error: access.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      return json(response, 201, { record: await createCorporateAttachment(decodeURIComponent(url.pathname.split('/')[4]), await readJson(request, 42 * 1024 * 1024), access.actor) });
    }
    if (request.method === 'GET' && /^\/api\/corporate\/attachments\/[^/]+\/file$/.test(url.pathname)) {
      const corporateAccess = corporateActor(request); if (corporateAccess.status !== 200) return json(response, corporateAccess.status, { error: corporateAccess.status === 401 ? 'Authentication required' : 'Corporate executive access required' });
      const attachment = getCorporateAttachment(decodeURIComponent(url.pathname.split('/')[4]));
      if (!attachment || await access(attachment.file_path).then(() => false).catch(() => true)) return json(response, 404, { error: 'Attachment not found' });
      const safeName = attachment.filename.replace(/["\r\n]/g, '_');
      response.writeHead(200, { 'content-type': attachment.content_type || 'application/octet-stream', 'content-disposition': `inline; filename="${safeName}"`, 'cache-control': 'private, no-store' });
      return createReadStream(attachment.file_path).pipe(response);
    }
    if (request.method === 'POST' && url.pathname === '/api/integrations/application-push') {
      if (!scopeSyncAuthorized(request)) return json(response, 401, { error: 'Application scope sync authorization required' });
      const payload = await readJson(request, 512 * 1024);
      const scope = syncItApplicationScope(payload, 'integration:application-push');
      const universalRelay = payload.source === 'operational-hub-relay' ? { configured: true, delivered: true } : await relayScopeToUniversal(payload);
      return json(response, 200, { scope, universalRelay });
    }
    if (request.method === 'GET' && url.pathname === '/api/it/catalog') {
      const access = itActor(request); if (access.status !== 200) return json(response, 401, { error: 'Authentication required' });
      return json(response, 200, { applications: listItApplications() });
    }
    if (request.method === 'GET' && url.pathname === '/api/it/scope') {
      const access = itActor(request); if (access.status !== 200) return json(response, 401, { error: 'Authentication required' });
      const refreshed = await refreshApplicationScopeManifests();
      return json(response, 200, { scopes: listItApplicationScopes(), public: true, refreshedAt: new Date().toISOString(), manifestRefresh: refreshed });
    }
    if (request.method === 'GET' && url.pathname === '/api/it/roadmap') {
      const access = itActor(request); if (access.status !== 200) return json(response, 401, { error: 'Authentication required' });
      return json(response, 200, { roadmap: listItRoadmap(Object.fromEntries(url.searchParams.entries())) });
    }
    if (request.method === 'POST' && url.pathname === '/api/it/roadmap') {
      const actor = itManager(request); if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'IT Manage access required' : 'Authentication required' });
      return json(response, 201, { roadmap: createItRoadmap(await readJson(request, 128 * 1024), actor.id) });
    }
    if (request.method === 'PATCH' && /^\/api\/it\/roadmap\/[^/]+$/.test(url.pathname)) {
      const actor = itManager(request); if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'IT Manage access required' : 'Authentication required' });
      const id = decodeURIComponent(url.pathname.split('/')[4]);
      return json(response, 200, { roadmap: updateItRoadmap(id, await readJson(request, 128 * 1024), actor.id) });
    }
    if (request.method === 'GET' && url.pathname === '/api/it/proposals') {
      const access = itActor(request); if (access.status !== 200) return json(response, 401, { error: 'Authentication required' });
      const fullAccess = Boolean(itManager(request));
      return json(response, 200, { proposals: listItProposals({ actorId: access.actor.id, fullAccess }), fullAccess });
    }
    if (request.method === 'POST' && url.pathname === '/api/it/proposals') {
      const access = itActor(request); if (access.status !== 200) return json(response, 401, { error: 'Authentication required' });
      const created = createItProposal(await readJson(request, 128 * 1024), access.actor, { idempotencyKey: request.headers['x-idempotency-key'] });
      return json(response, created.replayed ? 200 : 201, created);
    }
    if (request.method === 'GET' && /^\/api\/it\/proposals\/[^/]+$/.test(url.pathname)) {
      const access = itActor(request); if (access.status !== 200) return json(response, 401, { error: 'Authentication required' });
      const id = decodeURIComponent(url.pathname.split('/')[4]);
      const proposal = getItProposal(id, { actorId: access.actor.id, fullAccess: Boolean(itManager(request)) });
      return json(response, proposal ? 200 : 404, proposal ? { proposal } : { error: 'IT proposal not found' });
    }
    if (request.method === 'PATCH' && /^\/api\/it\/proposals\/[^/]+$/.test(url.pathname)) {
      const actor = itManager(request); if (!actor) return json(response, requestIdentity(request) ? 403 : 401, { error: requestIdentity(request) ? 'IT Manage access required' : 'Authentication required' });
      const id = decodeURIComponent(url.pathname.split('/')[4]);
      return json(response, 200, { proposal: updateItProposal(id, await readJson(request, 64 * 1024), actor.id) });
    }
    if (request.method === 'GET' && url.pathname === '/api/academy/status') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
      return json(response, 200, getAcademyStatus());
    }
    if (request.method === 'GET' && url.pathname === '/api/academy/welcome-video') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
      return json(response, 200, await getAcademyWelcomeVideoStatus());
    }
    if (request.method === 'GET' && url.pathname === '/api/academy/welcome-video/file') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
      await streamAcademyWelcomeVideo(request,response);
      return;
    }
    if (request.method === 'PUT' && url.pathname === '/api/academy/welcome-video') {
      const actor=academyManager(request);
      if(!actor)return json(response,403,{error:'Academy Manage access required'});
      return json(response,201,await saveAcademyWelcomeVideo(request,actor.id));
    }
    if (request.method === 'GET' && url.pathname === '/api/academy/catalog') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
      return json(response, 200, await getAcademyCatalog());
    }
    if (request.method === 'POST' && url.pathname === '/api/academy/records/profile') {
      const body=await readJson(request,8*1024*1024);
      if(!academyRecordActor(request,body.learnerId))return json(response,403,{error:'Academy record access required'});
      return json(response, 201, { profile:await upsertAcademyLearner(body) });
    }
    if (request.method === 'GET' && url.pathname === '/api/academy/records') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy','manage'))return json(response,403,{error:'Academy Manage access required'});
      return json(response,200,{learners:await listAcademyLearnerRecords()});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/status') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});if(!hasModuleAccess(actor,'entity-research'))return json(response,403,{error:'Research access required'});
      const researchStatus=getResearchStatus();
      return json(response,200,{research:{...researchStatus,leads:(hasExplicitResearchPermission(actor,'research-leads:view')||hasExplicitResearchPermission(actor,'research-leads:manage'))?researchStatus.leads:null,studies:(hasExplicitResearchPermission(actor,'research-studies:view')||hasExplicitResearchPermission(actor,'research-studies:manage'))?researchStatus.studies:null,agreements:(hasExplicitResearchPermission(actor,'research-studies:view')||hasExplicitResearchPermission(actor,'research-studies:manage'))?researchStatus.agreements:null,pendingOutbox:hasExplicitResearchPermission(actor,'research-sync:manage','manage')?researchStatus.pendingOutbox:null,integrationEvents:hasExplicitResearchPermission(actor,'research-sync:manage','manage')?researchStatus.integrationEvents:null},emConnect:emConnectStatus(),universal:universalStatus()});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/leads') {
      const access=researchActorAny(request,['research-leads:view','research-leads:manage']);if(access.status!==200)return json(response,access.status,{error:access.status===401?'Authentication required':'Research leads access required'});
      const canManage=hasExplicitResearchPermission(access.actor,'research-leads:manage','manage');
      const includeContact=hasExplicitResearchPermission(access.actor,'research-leads:contact:view');
      return json(response,200,{leads:listResearchLeads({actorId:access.actor.id,canManage,includeContact}),contactAccess:includeContact});
    }
    if (request.method === 'POST' && url.pathname === '/api/research/leads') {
      const access=researchDataActor(request,'research-leads:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research leads Manage access required':'Authentication required'});
      const body=await readJson(request,64*1024);const lead=createResearchLead(body,access.id);return json(response,201,{lead:getResearchLead(lead.id,{actorId:access.id,canManage:true,includeContact:hasExplicitResearchPermission(access,'research-leads:contact:view')})});
    }
    if (request.method === 'GET' && /^\/api\/research\/leads\/[^/]+$/.test(url.pathname)) {
      const access=researchActorAny(request,['research-leads:view','research-leads:manage']);if(access.status!==200)return json(response,access.status,{error:access.status===401?'Authentication required':'Research leads access required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);const canManage=hasExplicitResearchPermission(access.actor,'research-leads:manage','manage');const includeContact=hasExplicitResearchPermission(access.actor,'research-leads:contact:view');const lead=getResearchLead(id,{actorId:access.actor.id,canManage,includeContact});return json(response,lead?200:404,lead?{lead}:{error:'Research lead not found'});
    }
    if (request.method === 'PATCH' && /^\/api\/research\/leads\/[^/]+$/.test(url.pathname)) {
      const access=researchDataActor(request,'research-leads:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research leads Manage access required':'Authentication required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);updateResearchLead(id,await readJson(request,32*1024),{actorId:access.id,canManage:true});return json(response,200,{lead:getResearchLead(id,{actorId:access.id,canManage:true,includeContact:hasExplicitResearchPermission(access,'research-leads:contact:view')})});
    }
    if (request.method === 'POST' && /^\/api\/research\/leads\/[^/]+\/follow-ups$/.test(url.pathname)) {
      const access=researchDataActor(request,'research-leads:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research leads Manage access required':'Authentication required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);return json(response,201,{followUp:createResearchFollowup(id,await readJson(request,16*1024),{actorId:access.id,canManage:true})});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/studies') {
      const access=researchActorAny(request,['research-studies:view','research-studies:manage']);if(access.status!==200)return json(response,access.status,{error:access.status===401?'Authentication required':'Research studies access required'});
      const canManage=hasExplicitResearchPermission(access.actor,'research-studies:manage','manage');return json(response,200,{studies:listResearchStudies({actorId:access.actor.id,canManage})});
    }
    if (request.method === 'POST' && url.pathname === '/api/research/studies') {
      const access=researchDataActor(request,'research-studies:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research studies Manage access required':'Authentication required'});
      return json(response,201,{study:createResearchStudy(await readJson(request,32*1024),access.id)});
    }
    if (request.method === 'GET' && /^\/api\/research\/studies\/[^/]+$/.test(url.pathname)) {
      const access=researchActorAny(request,['research-studies:view','research-studies:manage']);if(access.status!==200)return json(response,access.status,{error:access.status===401?'Authentication required':'Research studies access required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);const canManage=hasExplicitResearchPermission(access.actor,'research-studies:manage','manage');const study=getResearchStudy(id,{actorId:access.actor.id,canManage});return json(response,study?200:404,study?{study}:{error:'Research study not found'});
    }
    if (request.method === 'PATCH' && /^\/api\/research\/studies\/[^/]+$/.test(url.pathname)) {
      const access=researchDataActor(request,'research-studies:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research studies Manage access required':'Authentication required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);return json(response,200,{study:updateResearchStudy(id,await readJson(request,32*1024),{actorId:access.id,canManage:true})});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/agreements') {
      const access=researchActorAny(request,['research-studies:view','research-studies:manage']);if(access.status!==200)return json(response,access.status,{error:access.status===401?'Authentication required':'Research study agreement access required'});
      const canManage=hasExplicitResearchPermission(access.actor,'research-studies:manage','manage');return json(response,200,{agreements:listResearchAgreements({actorId:access.actor.id,canManage})});
    }
    if (request.method === 'POST' && url.pathname === '/api/research/agreements') {
      const access=researchDataActor(request,'research-studies:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research study agreement Manage access required':'Authentication required'});
      return json(response,201,{agreement:createResearchAgreement(await readJson(request,32*1024),access.id)});
    }
    if (request.method === 'GET' && /^\/api\/research\/agreements\/[^/]+$/.test(url.pathname)) {
      const access=researchActorAny(request,['research-studies:view','research-studies:manage']);if(access.status!==200)return json(response,access.status,{error:access.status===401?'Authentication required':'Research study agreement access required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);const canManage=hasExplicitResearchPermission(access.actor,'research-studies:manage','manage');const agreement=getResearchAgreement(id,{actorId:access.actor.id,canManage});return json(response,agreement?200:404,agreement?{agreement}:{error:'Research agreement not found'});
    }
    if (request.method === 'PATCH' && /^\/api\/research\/agreements\/[^/]+$/.test(url.pathname)) {
      const access=researchDataActor(request,'research-studies:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research study agreement Manage access required':'Authentication required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);return json(response,200,{agreement:updateResearchAgreement(id,await readJson(request,32*1024),{actorId:access.id,canManage:true})});
    }
    if (request.method === 'POST' && /^\/api\/research\/studies\/[^/]+\/screenings$/.test(url.pathname)) {
      const access=researchDataActor(request,'research-studies:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research studies Manage access required':'Authentication required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);return json(response,201,{screening:createResearchScreening(id,await readJson(request,24*1024),access.id)});
    }
    if (request.method === 'POST' && /^\/api\/research\/studies\/[^/]+\/safety-events$/.test(url.pathname)) {
      const access=researchDataActor(request,'research-studies:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research studies Manage access required':'Authentication required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);return json(response,201,{event:createResearchSafetyEvent(id,await readJson(request,24*1024),access.id)});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/integrations/outbox') {
      const access=researchDataActor(request,'research-sync:manage','manage');if(!access)return json(response,requestIdentity(request)?403:401,{error:requestIdentity(request)?'Research sync Manage access required':'Authentication required'});
      return json(response,200,{outbox:listResearchOutbox(),state:'pending_external_contract'});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/integrations/em-connect/status') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});if(!hasModuleAccess(actor,'entity-research'))return json(response,403,{error:'Research access required'});return json(response,200,emConnectStatus());
    }
    if (request.method === 'POST' && url.pathname === '/api/research/integrations/em-connect/events') {
      const raw=await readBuffer(request,256*1024);let event;
      try { event=parseEmConnectResearchEvent(raw.toString('utf8'),request.headers['x-em-connect-signature']); }
      catch (error) { if(error.code==='research_route_required') recordResearchIntegrationEvent({sourceSystem:'em-connect',eventId:'rejected-'+Date.now(),eventType:'contact.upserted'},'blocked',error.code); throw error; }
      if(event.ignored){recordResearchIntegrationEvent(event,'ignored');return json(response,202,{state:'ignored',reason:event.reason});}
      const result=upsertResearchLeadFromEmConnect(event);return json(response,200,{state:result.state,leadId:result.lead.id});
    }
    if (request.method === 'GET' && url.pathname === '/api/research/integrations/universal/status') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});if(!hasModuleAccess(actor,'entity-research'))return json(response,403,{error:'Research access required'});return json(response,200,universalStatus());
    }
    if (request.method === 'GET' && /^\/api\/academy\/records\/[^/]+$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      if(!academyRecordActor(request,learnerId))return json(response,403,{error:'Academy record access required'});
      return json(response,200,await getAcademyLearnerRecord(learnerId));
    }
    if (request.method === 'POST' && /^\/api\/academy\/records\/[^/]+\/events$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      if(!academyRecordActor(request,learnerId))return json(response,403,{error:'Academy record access required'});
      return json(response,201,{event:await recordAcademyEvent(learnerId,await readJson(request,512*1024))});
    }
    if (request.method === 'POST' && /^\/api\/academy\/records\/[^/]+\/certificates$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      if(!academyRecordActor(request,learnerId))return json(response,403,{error:'Academy record access required'});
      return json(response,201,{certificate:await createAcademyCertificate(learnerId,await readJson(request,256*1024))});
    }
    if (request.method === 'GET' && /^\/api\/academy\/records\/[^/]+\/photo$/.test(url.pathname)) {
      const learnerId=decodeURIComponent(url.pathname.split('/')[4]);
      if(!academyRecordActor(request,learnerId))return json(response,403,{error:'Academy record access required'});
      const photo=await getAcademyLearnerPhoto(learnerId);
      if(!photo||await access(photo.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Academy learner photo not found'});
      response.writeHead(200,{'content-type':photo.type,'cache-control':'private, max-age=300'});
      return createReadStream(photo.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/operational/airtable/status') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,operationalPermissionKeys))return json(response,403,{error:'Operational data access required'});
      return json(response, 200, getOperationalSnapshot().status);
    }
    if (request.method === 'GET' && url.pathname === '/api/operational/airtable/snapshot') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,operationalPermissionKeys))return json(response,403,{error:'Operational data access required'});
      return json(response, 200, filteredOperationalSnapshot(actor));
    }
    if (request.method === 'PATCH' && /^\/api\/operational\/contracts\/[^/]+\/status$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'contracting','manage'))return json(response,403,{error:'Contracting Manage access required'});
      const recordId=decodeURIComponent(url.pathname.split('/')[4]);
      return json(response,200,{contract:updateOperationalContractStatus(recordId,(await readJson(request)).status,actor.id)});
    }
    if (request.method === 'POST' && url.pathname === '/api/operational/airtable/refresh') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,['contracting','credentialing'],'manage'))return json(response,403,{error:'Contracting or Credentialing Manage access required'});
      await syncOperationalAirtable();
      return json(response,200,{ok:true,snapshot:filteredOperationalSnapshot(actor)});
    }
    if (request.method === 'GET' && url.pathname === '/api/hr/me/dossier') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});
      const user=listAccessUsers().find(item=>item.id===actor.id);if(!user)return json(response,404,{error:'Employee record not found'});
      return json(response,200,{dossier:await hrDossierFor(user)});
    }
    if (request.method === 'GET' && /^\/api\/hr\/me\/document-requests\/[^/]+\/template$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});
      const documentRequest=getHrDocumentRequest(decodeURIComponent(url.pathname.split('/')[5]));
      if(!documentRequest||documentRequest.userId!==actor.id||!documentRequest.packageId)return json(response,404,{error:'Assigned document not found'});
      const packageRecord=await getHrPackage(documentRequest.packageId);
      if(!packageRecord||await access(packageRecord.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Assigned document file not found'});
      const safeName=packageRecord.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':packageRecord.type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=300'});
      return createReadStream(packageRecord.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/hr/dossiers') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const users=listAccessUsers();const dossiers=await Promise.all(users.map(hrDossierFor));const byEmail=new Map(users.map(user=>[String(user.email||'').toLowerCase(),user]));
      const recordDossiers=getOperationalSnapshot().providers.map(provider=>{const user=byEmail.get(String(provider.email||'').toLowerCase());const storageKey=user?.id||provider.recordId;return {recordId:provider.recordId,storageKey,documents:listHrDossierDocuments(storageKey),classification:findHrEmployeeClassification([provider.recordId,storageKey,`access-${storageKey}`])}});
      return json(response,200,{dossiers,recordDossiers,classifications:listHrEmployeeClassifications()});
    }
    if (request.method === 'PUT' && /^\/api\/hr\/employee-classifications\/[^/]+$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const employeeKey=decodeURIComponent(url.pathname.split('/')[4]);const body=await readJson(request);
      return json(response,200,{classification:updateHrEmployeeClassification(employeeKey,body,actor.id)});
    }
    if (request.method === 'POST' && /^\/api\/hr\/employees\/[^/]+\/document-requests$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const userId=decodeURIComponent(url.pathname.split('/')[4]);
      if(!listAccessUsers().some(item=>item.id===userId))return json(response,404,{error:'Employee record not found'});
      const body=await readJson(request);const documents=Array.isArray(body.documents)?body.documents.slice(0,20):[body];const requests=[];
      for(const document of documents){
        if(document.packageId&&!await getHrPackage(document.packageId))return json(response,404,{error:'Employee Package document not found'});
        requests.push(createHrDocumentRequest(userId,document,actor.id));
      }
      return json(response,201,{request:requests[0],requests});
    }
    if (request.method === 'PUT' && /^\/api\/hr\/employees\/[^/]+\/compliance\/[^/]+$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const userId=decodeURIComponent(url.pathname.split('/')[4]);const itemKey=decodeURIComponent(url.pathname.split('/')[6]);
      if(!listAccessUsers().some(item=>item.id===userId))return json(response,404,{error:'Employee record not found'});
      return json(response,200,{item:updateHrComplianceItem(userId,itemKey,await readJson(request),actor.id)});
    }
    if (request.method === 'POST' && url.pathname === '/api/hr/me/documents') {
      const actor=requestIdentity(request);if(!actor)return json(response,401,{error:'Authentication required'});
      return json(response,201,{document:await archiveHrDocument(actor.id,await readJson(request,42*1024*1024),actor.id,'employee-upload')});
    }
    if (request.method === 'POST' && /^\/api\/hr\/employees\/[^/]+\/documents$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const userId=decodeURIComponent(url.pathname.split('/')[4]);
      if(!listAccessUsers().some(item=>item.id===userId))return json(response,404,{error:'Employee record not found'});
      return json(response,201,{document:await archiveHrDocument(userId,await readJson(request,42*1024*1024),actor.id,'human-resources-upload')});
    }
    if (request.method === 'POST' && /^\/api\/hr\/employee-records\/[^/]+\/documents$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const employeeKey=decodeURIComponent(url.pathname.split('/')[4]);const knownProvider=getOperationalSnapshot().providers.some(item=>item.recordId===employeeKey);const knownUser=listAccessUsers().some(item=>item.id===employeeKey);
      if(!knownProvider&&!knownUser)return json(response,404,{error:'Employee record not found'});
      return json(response,201,{document:await archiveHrDocument(employeeKey,await readJson(request,42*1024*1024),actor.id,'human-resources-photo')});
    }
    if (request.method === 'POST' && url.pathname === '/api/hr/integrations/document-return') {
      const configuredKey=process.env.HR_DOCUMENT_RETURN_KEY;
      if(!configuredKey||request.headers['x-document-return-key']!==configuredKey)return json(response,401,{error:'Unauthorized'});
      const body=await readJson(request,42*1024*1024);
      return json(response,201,{document:await archiveHrDocument(body.userId,body,'document-workflow','application-return')});
    }
    if (request.method === 'GET' && /^\/api\/hr\/documents\/[^/]+\/file$/.test(url.pathname)) {
      const document=getHrDossierDocument(decodeURIComponent(url.pathname.split('/')[4]));if(!document)return json(response,404,{error:'Employee document not found'});
      const actor=requestIdentity(request);const owns=document.user_id===actor?.id;
      if(!owns&&!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Employee document access required'});
      if(await access(document.file_path).then(()=>false).catch(()=>true))return json(response,404,{error:'Employee document file not found'});
      const safeName=document.filename.replace(/["\r\n]/g,'_');response.writeHead(200,{'content-type':document.content_type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=300'});
      return createReadStream(document.file_path).pipe(response);
    }
    if (request.method === 'DELETE' && /^\/api\/hr\/documents\/[^/]+$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const deleted=await deleteHrDossierDocument(decodeURIComponent(url.pathname.split('/')[4]));return json(response,deleted?200:404,{deleted});
    }
    if (request.method === 'GET' && url.pathname === '/api/hr/package-workflows') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      return json(response,200,{workflows:await listHrPackageWorkflows(),email:getHrPackageEmailStatus(),docusign:getDocusignStatus()});
    }
    if (request.method === 'POST' && url.pathname === '/api/hr/package-workflows') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const body=await readJson(request,512*1024);const method=body.deliveryMethod==='docusign'?'docusign':'portal';
      if(method==='docusign'){const status=getDocusignStatus();if(!status.connected||!status.webhookReady)return json(response,503,{error:'DocuSign account, Connect callback and HMAC must be configured before sending a future-employee package'});}
      const created=await createHrPackageWorkflow({...body,deliveryMethod:method},actor.id);const portalUrl=`${requestBaseUrl(request)}/?employee_package=${encodeURIComponent(created.token)}`;
      if(method==='docusign'){
        try{
          const envelope=await createDocusignEnvelope({packageIds:created.workflow.packageIds,workflowId:created.workflow.id,signerName:created.workflow.candidateName,signerEmail:created.workflow.candidateEmail,emailSubject:created.workflow.subject,emailBlurb:created.workflow.message});
          const workflow=updateHrPackageWorkflow(created.workflow.id,{status:'draft',externalReference:envelope.envelopeId});
          return json(response,201,{workflow:{...workflow,packages:created.workflow.packages},envelope,portalUrl:''});
        }catch(error){updateHrPackageWorkflow(created.workflow.id,{status:'failed'});throw error}
      }
      const delivery=await sendHrPackageEmail({candidateName:created.workflow.candidateName,candidateEmail:created.workflow.candidateEmail,portalUrl,dueAt:created.workflow.dueAt,subject:created.workflow.subject,message:created.workflow.message,workflowId:created.workflow.id});
      const workflow=updateHrPackageWorkflow(created.workflow.id,{status:delivery.delivered?'sent':'prepared',emailDeliveryId:delivery.deliveryId||'',sentAt:delivery.delivered});
      return json(response,201,{workflow:{...workflow,packages:created.workflow.packages},delivery,portalUrl});
    }
    if (request.method === 'POST' && /^\/api\/hr\/package-workflows\/[^/]+\/assign$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const workflowId=decodeURIComponent(url.pathname.split('/')[4]);const body=await readJson(request);const employeeKey=String(body.employeeKey||'').trim();
      const knownUser=listAccessUsers().some(item=>item.id===employeeKey);const knownProvider=getOperationalSnapshot().providers.some(item=>item.recordId===employeeKey);
      if(!knownUser&&!knownProvider)return json(response,404,{error:'Employee record not found'});
      const workflow=(await listHrPackageWorkflows()).find(item=>item.id===workflowId);if(!workflow)return json(response,404,{error:'Employee Package workflow not found'});
      const pending=workflow.returns.filter(item=>item.status!=='assigned');if(!pending.length)return json(response,409,{error:'No returned documents are waiting for assignment'});
      const documents=[];
      for(const item of pending){
        const returned=await readHrPackageReturn(item.id);if(!returned)continue;
        documents.push(await archiveHrDocument(employeeKey,{filename:returned.filename,type:returned.type,category:'employee-package',externalReference:workflow.id,base64:returned.bytes.toString('base64')},actor.id,'employee-package-assignment'));
        markHrPackageReturnAssigned(item.id,employeeKey,actor.id);
      }
      const updated=(await listHrPackageWorkflows()).find(item=>item.id===workflowId);
      return json(response,200,{workflow:updated,documents});
    }
    if (request.method === 'GET' && /^\/api\/hr\/package-returns\/[^/]+\/file$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const record=getHrPackageReturn(decodeURIComponent(url.pathname.split('/')[4]));if(!record||await access(record.file_path).then(()=>false).catch(()=>true))return json(response,404,{error:'Returned Employee Package document not found'});
      const safeName=record.filename.replace(/["\r\n]/g,'_');response.writeHead(200,{'content-type':record.content_type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, no-store'});
      return createReadStream(record.file_path).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/hr/packages') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      return json(response, 200, { packages:await listHrPackages() });
    }
    if (request.method === 'POST' && url.pathname === '/api/hr/packages') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      return json(response, 201, { package:await createHrPackage(await readJson(request, 42*1024*1024)) });
    }
    if (request.method === 'DELETE' && /^\/api\/hr\/packages\/[^/]+$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const deleted=await deleteHrPackage(decodeURIComponent(url.pathname.split('/')[4]));
      return json(response,deleted?200:404,{deleted});
    }
    if (request.method === 'GET' && /^\/api\/hr\/packages\/[^/]+\/file$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const packageRecord=await getHrPackage(decodeURIComponent(url.pathname.split('/')[4]));
      if(!packageRecord||await access(packageRecord.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Employee Package file not found'});
      const safeName=packageRecord.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':packageRecord.type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=300'});
      return createReadStream(packageRecord.filePath).pipe(response);
    }
    if (request.method === 'POST' && url.pathname === '/api/integrations/docusign/connect') {
      const rawBody=await readBuffer(request,2*1024*1024);
      if(!verifyDocusignConnectSignature(rawBody,request.headers['x-docusign-signature-1']))return json(response,401,{error:'Invalid DocuSign Connect signature'});
      let payload;try{payload=JSON.parse(rawBody.toString('utf8'))}catch{return json(response,400,{error:'Invalid DocuSign Connect payload'})}
      const eventName=String(payload.event||payload.eventType||'').toLowerCase();const envelopeSummary=payload.data?.envelopeSummary||payload.envelopeSummary||{};
      const status=String(envelopeSummary.status||payload.status||'').toLowerCase();const envelopeId=String(payload.data?.envelopeId||envelopeSummary.envelopeId||payload.envelopeId||'').trim();
      if(!envelopeId)return json(response,202,{acknowledged:true,ignored:'Envelope ID missing'});
      if(status!=='completed'&&!eventName.includes('completed'))return json(response,202,{acknowledged:true,envelopeId,status:status||eventName});
      const assignedRequests=findHrDocumentRequestsByExternalReference(envelopeId);
      if(assignedRequests.length){
        const existing=findHrDocumentByExternalReference(envelopeId);if(existing)return json(response,200,{acknowledged:true,envelopeId,document:existing,duplicate:true});
        const signed=await downloadDocusignCombinedDocument(envelopeId);const employeeId=assignedRequests[0].userId;
        const document=await archiveHrDocument(employeeId,{filename:`DocuSign-${envelopeId}-completed.pdf`,type:signed.type,category:'employee-package',externalReference:envelopeId,base64:signed.bytes.toString('base64')},'docusign-connect','docusign-completed');
        return json(response,200,{acknowledged:true,envelopeId,document});
      }
      const workflow=findHrPackageWorkflowByExternalReference(envelopeId);
      if(!workflow)return json(response,202,{acknowledged:true,envelopeId,ignored:'Envelope is not linked to an Operational Hub onboarding workflow'});
      const existingReturn=findHrPackageReturnByExternalReference(envelopeId);if(existingReturn)return json(response,200,{acknowledged:true,envelopeId,document:existingReturn,duplicate:true});
      const signed=await downloadDocusignCombinedDocument(envelopeId);
      const document=await archiveHrPackageReturn(workflow.id,{filename:`DocuSign-${envelopeId}-completed.pdf`,type:signed.type,externalReference:envelopeId,base64:signed.bytes.toString('base64')},'docusign-completed');
      updateHrPackageWorkflow(workflow.id,{status:'completed',completedAt:true});
      return json(response,200,{acknowledged:true,envelopeId,document,workflowId:workflow.id});
    }
    if (request.method === 'GET' && url.pathname === '/api/integrations/docusign/status') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      return json(response, 200, getDocusignStatus());
    }
    if (request.method === 'POST' && url.pathname === '/api/integrations/docusign/envelopes') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'human-resources','manage'))return json(response,403,{error:'Human Resources Manage access required'});
      const body=await readJson(request,256*1024);const employee=listAccessUsers().find(item=>item.id===body.employeeUserId);
      if(!employee)return json(response,404,{error:'Employee access account is required before sending documents'});
      const envelope=await createDocusignEnvelope({...body,employeeUserId:employee.id});const requests=[];
      for(const packageId of [...new Set((body.packageIds||[]).map(String))].slice(0,10)){
        const packageRecord=await getHrPackage(packageId);if(!packageRecord)continue;
        requests.push(createHrDocumentRequest(employee.id,{title:packageRecord.filename,category:'employee-package',packageId,deliveryMethod:'docusign',externalReference:envelope.envelopeId,description:'Employee Package sent through DocuSign.'},actor.id));
      }
      return json(response,201,{envelope:{...envelope,requestIds:requests.map(item=>item.id)}});
    }
    if (request.method === 'POST' && url.pathname === '/api/operational/airtable/sync') {
      const configuredKey=process.env.OPERATIONAL_AIRTABLE_SYNC_KEY;
      if(!configuredKey||request.headers['x-sync-key']!==configuredKey)return json(response,401,{error:'Unauthorized'});
      return json(response,200,{ok:true,snapshot:await syncOperationalAirtable()});
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/operational/airtable/attachments/')) {
      const attachment=getOperationalAttachment(decodeURIComponent(url.pathname.split('/').pop()));
      if(!attachment||await access(attachment.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Attachment not found'});
      const actor=requestIdentity(request);const attachmentKeys=attachment.permissionKeys||operationalPermissionKeys;const isHrAttachment=attachmentKeys.includes('human-resources');const ownHrAttachment=isHrAttachment&&attachment.ownerEmail&&String(attachment.ownerEmail).toLowerCase()===String(actor?.email||'').toLowerCase()&&hasModuleAccess(actor,'human-resources');
      const nonHrKeys=attachmentKeys.filter(key=>key!=='human-resources');
      const privilegedHrAttachment=isHrAttachment&&(hasModuleAccess(actor,'human-resources','manage')||hasModuleAccess(actor,['licenses','doctor-licenses','credentialing']));
      if(isHrAttachment?!ownHrAttachment&&!privilegedHrAttachment:!hasModuleAccess(actor,nonHrKeys))return json(response,403,{error:'Attachment access required'});
      const safeName=attachment.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':attachment.type||'application/octet-stream','content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=3600'});
      return createReadStream(attachment.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/status') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'doctor-licenses'))return json(response,403,{error:'Doctor Licenses / ACA access required'});
      return json(response, 200, getAcaIntegrationStatus());
    }
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/records') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'doctor-licenses'))return json(response,403,{error:'Doctor Licenses / ACA access required'});
      return json(response, 200, { records:listAcaRecords(url.searchParams.get('source')||'') });
    }
    if (request.method === 'GET' && url.pathname === '/api/integrations/aca/checks') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'doctor-licenses'))return json(response,403,{error:'Doctor Licenses / ACA access required'});
      return json(response, 200, { checks:listAcaRpaChecks(url.searchParams.get('source')||'') });
    }
    if (request.method === 'POST' && url.pathname === '/api/integrations/aca/checks') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'doctor-licenses','manage'))return json(response,403,{error:'Doctor Licenses / ACA Manage access required'});
      return json(response, 201, { check:createAcaRpaCheck(await readJson(request)) });
    }
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
      const actor=requestIdentity(request);
      if(request.method==='GET'){
        if(!hasModuleAccess(actor,['licenses','doctor-licenses']))return json(response,403,{error:'Licenses access required'});
        return json(response,200,{documents:listDoctorDocuments(providerId)});
      }
      if(request.method==='POST'){
        if(!hasModuleAccess(actor,['licenses','doctor-licenses'],'manage'))return json(response,403,{error:'Licenses Manage access required'});
        return json(response,201,{document:await createDoctorDocument(providerId,await readJson(request,28*1024*1024))});
      }
    }
    if (request.method === 'GET' && /^\/api\/licenses\/documents\/[^/]+\/file$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,['licenses','doctor-licenses']))return json(response,403,{error:'Licenses access required'});
      const document=getDoctorDocument(decodeURIComponent(url.pathname.split('/')[4]));
      if(!document||await access(document.filePath).then(()=>false).catch(()=>true))return json(response,404,{error:'Document not found'});
      const safeName=document.filename.replace(/["\r\n]/g,'_');
      response.writeHead(200,{'content-type':document.type,'content-disposition':`inline; filename="${safeName}"`,'cache-control':'private, max-age=3600'});
      return createReadStream(document.filePath).pipe(response);
    }
    if (request.method === 'GET' && url.pathname === '/api/inventory/requests') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
      return json(response, 200, { requests:listInventoryRequests(url.searchParams.get('scopeId')||undefined) });
    }
    if (request.method === 'POST' && url.pathname === '/api/inventory/requests') {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
      return json(response, 201, { request:createInventoryRequest(await readJson(request)) });
    }
    if (request.method === 'PATCH' && /^\/api\/inventory\/requests\/[^/]+\/decision$/.test(url.pathname)) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy','manage'))return json(response,403,{error:'Academy Manage access required'});
      const id=decodeURIComponent(url.pathname.split('/')[4]);
      const body=await readJson(request);
      return json(response,200,{request:decideInventoryRequest(id,body.status)});
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/academy/attachments/')) {
      const actor=requestIdentity(request);if(!hasModuleAccess(actor,'academy'))return json(response,403,{error:'Academy access required'});
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
server.listen(port, host, () => console.log(`Operational Hub backend listening on http://${host}:${port}`));
