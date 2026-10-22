import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = await mkdtemp(path.join(tmpdir(), 'operational-hub-it-'));
const databasePath = path.join(root, 'operational-hub.sqlite');
const port = 4199;
const baseUrl = `http://127.0.0.1:${port}`;
process.env.OPERATIONAL_HUB_DATABASE_PATH = databasePath;
delete process.env.RESEND_API_KEY;
delete process.env.INVITATION_FROM_EMAIL;
delete process.env.VITE_SEVEN_INSURANCE_URL;
delete process.env.UNIVERSAL_BASE_URL;

let server;
try {
  const access = await import(`../server/access-store.mjs?it=${Date.now()}`);
  const invite = async (name, email, permissions) => {
    const password = `${name.replace(/\s+/g, '-')}-valid-passphrase-2026`;
    const created = await access.inviteAccessUser({ name, email, employmentStatus: 'active', accessProfile: 'custom', permissions }, baseUrl, 'test-admin');
    const token = new URL(created.invitation.developmentUrl).searchParams.get('invite');
    access.acceptInvitation(token, password);
    return { ...created.user, password };
  };
  const viewer = await invite('IT Viewer', 'it-viewer@emgroup.test', { dashboard: 'view', 'it:view': 'view' });
  const manager = await invite('IT Manager', 'it-manager@emgroup.test', { dashboard: 'view', 'it:view': 'view', 'it:manage': 'manage' });
  const other = await invite('IT Other User', 'it-other@emgroup.test', { dashboard: 'view', 'it:view': 'view' });

  server = spawn(process.execPath, ['server/index.mjs'], { cwd: path.resolve('.'), env: { ...process.env, PORT: String(port), NODE_ENV: 'production', OPERATIONAL_HUB_DATABASE_PATH: databasePath }, stdio: 'ignore' });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
    if (attempt === 49) throw new Error('IT test server did not start');
  }
  const login = async user => {
    const response = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const request = async (method, pathname, cookie, body) => {
    const response = await fetch(`${baseUrl}${pathname}`, { method, headers: { cookie, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, payload: await response.json() };
  };
  const viewerCookie = await login(viewer);
  const managerCookie = await login(manager);
  const otherCookie = await login(other);

  const roadmap = await request('GET', '/api/it/roadmap', viewerCookie);
  assert.equal(roadmap.status, 200);
  assert.equal(roadmap.payload.roadmap.some(row => row.applicationName === 'Art RPA'), false);
  assert.equal(roadmap.payload.roadmap.some(row => row.applicationName === 'Medical RPA'), false);
  assert.ok(roadmap.payload.roadmap.some(row => row.applicationName === 'Operational Hub'));
  assert.ok(roadmap.payload.roadmap.some(row => row.applicationName === 'Binium'));
  assert.ok(roadmap.payload.roadmap.every(row => row.createdAt));
  const firstRoadmapId = roadmap.payload.roadmap[0].id;
  assert.equal((await request('PATCH', `/api/it/roadmap/${firstRoadmapId}`, viewerCookie, { status: 'IN_PROGRESS' })).status, 403);
  assert.equal((await request('PATCH', `/api/it/roadmap/${firstRoadmapId}`, managerCookie, { integrationState: 'LIVE_VERIFIED' })).status, 400);
  assert.equal((await request('PATCH', `/api/it/roadmap/${firstRoadmapId}`, managerCookie, { status: 'IN_PROGRESS', progress: 20 })).status, 200);

  const catalog = await request('GET', '/api/it/catalog', viewerCookie);
  assert.equal(catalog.status, 200);
  assert.equal(catalog.payload.applications.some(application => application.name === 'Art RPA'), false);
  assert.equal(catalog.payload.applications.some(application => application.name === 'Medical RPA'), false);
  assert.ok(catalog.payload.applications.some(application => application.name === 'Operational Hub'));
  assert.ok(catalog.payload.applications.some(application => application.name === 'Binium'));
  const appId = catalog.payload.applications[0].id;
  const proposalBody = { applicationId: appId, title: 'A safe improvement', description: 'Improve a workflow without confidential records.', expectedOutcome: 'Reduce manual work.', impact: 'Fewer duplicate steps.', suggestedPriority: 'HIGH', category: 'IMPROVEMENT' };
  const created = await request('POST', '/api/it/proposals', viewerCookie, proposalBody);
  assert.equal(created.status, 201);
  assert.equal(created.payload.proposal.submitter, undefined);
  const own = await request('GET', '/api/it/proposals', viewerCookie);
  assert.equal(own.status, 200);
  assert.equal(own.payload.proposals.length, 1);
  const ownId = own.payload.proposals[0].id;
  const otherCreated = await request('POST', '/api/it/proposals', otherCookie, { ...proposalBody, title: 'Other user idea' });
  assert.equal(otherCreated.status, 201);
  assert.equal((await request('GET', `/api/it/proposals/${otherCreated.payload.proposal.id}`, viewerCookie)).status, 404);
  assert.equal((await request('PATCH', `/api/it/proposals/${ownId}`, viewerCookie, { status: 'COMPLETED' })).status, 403);
  const inbox = await request('GET', '/api/it/proposals', managerCookie);
  assert.equal(inbox.status, 200);
  assert.equal(inbox.payload.fullAccess, true);
  assert.equal(inbox.payload.proposals.length, 2);
  assert.equal(inbox.payload.proposals.find(row => row.id === ownId).submitter.email, viewer.email);
  assert.equal((await request('PATCH', `/api/it/proposals/${ownId}`, managerCookie, { status: 'DECLINED' })).status, 400);
  assert.equal((await request('PATCH', `/api/it/proposals/${ownId}`, managerCookie, { status: 'DECLINED', declineReason: 'Not aligned with current scope.' })).status, 200);
  assert.equal((await request('POST', '/api/it/proposals', viewerCookie, { ...proposalBody, title: 'password token patient PHI' })).status, 400);

  const database = new DatabaseSync(databasePath);
  assert.ok(database.prepare("SELECT COUNT(*) AS count FROM it_roadmap_history WHERE roadmap_id = ?").get(firstRoadmapId).count >= 1);
  assert.ok(database.prepare("SELECT COUNT(*) AS count FROM it_proposal_history WHERE proposal_id = ?").get(ownId).count >= 2);
  const audited = database.prepare("SELECT details_json FROM access_audit_events WHERE action LIKE 'it_%' ORDER BY created_at").all().map(row => row.details_json).join(' ');
  assert.equal(audited.includes('password'), false);
  assert.equal(audited.includes('patient'), false);
  database.close();
  const component = await readFile(path.resolve('src/it/ITWorkspace.jsx'), 'utf8');
  assert.equal(component.includes('localStorage'), false);
  console.log('IT roadmap permissions, proposal isolation, audit and evidence-state tests passed.');
} finally {
  if (server?.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  await rm(root, { recursive: true, force: true });
}
