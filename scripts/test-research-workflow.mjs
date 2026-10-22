import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = await mkdtemp(path.join(tmpdir(), 'operational-hub-research-'));
const databasePath = path.join(root, 'operational-hub.sqlite');
const port = 4198;
const baseUrl = `http://127.0.0.1:${port}`;
process.env.OPERATIONAL_HUB_DATABASE_PATH = databasePath;
delete process.env.RESEND_API_KEY;
delete process.env.INVITATION_FROM_EMAIL;

let server;
try {
  const access = await import(`../server/access-store.mjs?research=${Date.now()}`);
  const research = await import(`../server/research-store.mjs?research=${Date.now()}`);
  const operational = await import(`../server/operational-airtable-store.mjs?research=${Date.now()}`);
  const { datasetRowsForSession } = await import(`../server/ai-engine.mjs?research=${Date.now()}`);
  const invite = async (name, email, permissions) => {
    const created = await access.inviteAccessUser({ name, email, employmentStatus: 'active', accessProfile: 'custom', permissions }, baseUrl, 'test-admin');
    const token = new URL(created.invitation.developmentUrl).searchParams.get('invite');
    access.acceptInvitation(token, `${name.replace(/\s+/g, '-')}-valid-passphrase-2026`);
    return { ...created.user, password: `${name.replace(/\s+/g, '-')}-valid-passphrase-2026` };
  };
  const viewer = await invite('Research Viewer', 'research-viewer@emgroup.test', { 'entity-research': 'view', 'research-leads:view': 'view' });
  const manager = await invite('Research Manager', 'research-manager@emgroup.test', { 'entity-research': 'view', 'research-leads:view': 'view', 'research-leads:manage': 'manage', 'research-leads:contact:view': 'view', 'research-studies:manage': 'manage' });
  operational.replaceOperationalSnapshot({ baseId: 'test', providers: [{ recordId: 'research-provider', name: 'Research Provider', entityKey: 'research' }, { recordId: 'medical-provider', name: 'Medical Provider', entityKey: 'medical' }], contracts: [], licenses: [], entities: [{ recordId: 'research-entity', entityKey: 'research', tableName: 'EM Group', title: 'Research entity' }, { recordId: 'medical-entity', entityKey: 'medical', tableName: 'EM Group', title: 'Medical entity' }] });
  assert.deepEqual(datasetRowsForSession({ providers: [{ recordId: 'research-provider', entityKey: 'research' }, { recordId: 'medical-provider', entityKey: 'medical' }] }, 'providers', { permissions: { 'entity-research': 'view' } }).map(row => row.recordId), ['research-provider']);
  research.createResearchLead({ sourceSystem: 'manual', sourceRecordId: 'test-lead', firstName: 'Private', email: 'private@research.test', assignedUserId: viewer.id }, manager.id);

  server = spawn(process.execPath, ['server/index.mjs'], { cwd: path.resolve('.'), env: { ...process.env, PORT: String(port), NODE_ENV: 'production', OPERATIONAL_HUB_DATABASE_PATH: databasePath }, stdio: 'ignore' });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
    if (attempt === 49) throw new Error('Research test server did not start');
  }
  const login = async user => {
    const response = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const get = async (pathname, cookie = '') => {
    const response = await fetch(`${baseUrl}${pathname}`, { headers: cookie ? { cookie } : {} });
    return { status: response.status, payload: await response.json() };
  };
  assert.equal((await get('/api/research/leads')).status, 401);
  const viewerCookie = await login(viewer);
  const viewerLeads = await get('/api/research/leads', viewerCookie);
  assert.equal(viewerLeads.status, 200);
  assert.equal(viewerLeads.payload.leads.length, 1);
  assert.equal(viewerLeads.payload.leads[0].email, undefined);
  assert.equal(viewerLeads.payload.contactAccess, false);
  const viewerSnapshot = await get('/api/operational/airtable/snapshot', viewerCookie);
  assert.equal(viewerSnapshot.status, 200);
  assert.deepEqual(viewerSnapshot.payload.providers.map(row => row.recordId), ['research-provider']);
  assert.deepEqual(viewerSnapshot.payload.entities.map(row => row.recordId), ['research-entity']);
  const managerCookie = await login(manager);
  const managerLeads = await get('/api/research/leads', managerCookie);
  assert.equal(managerLeads.status, 200);
  assert.equal(managerLeads.payload.leads[0].email, 'private@research.test');
  console.log('Research HTTP permission and contact-scope tests passed.');
} finally {
  if (server?.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  await rm(root, { recursive: true, force: true });
}
