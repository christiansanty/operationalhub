import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

const testRoot = await mkdtemp(path.join(tmpdir(), 'operational-hub-fundamental-studies-'));
process.env.OPERATIONAL_HUB_DATABASE_PATH = path.join(testRoot, 'fundamental-studies.sqlite');

try {
  const store = await import(`../server/research-fundamental-studies-store.mjs?test=${Date.now()}`);
  const actor = { id: 'fundamental-test-user', name: 'Fundamental Test User', email: 'fundamental@test.local' };
  const created = store.createFundamentalStudy({
    title: 'Verified sponsor opportunity', institution: 'Research Institute', sponsor: 'Sponsor A', area: 'Sleep', location: 'Fort Myers',
    deadline: '2026-12-15', status: 'in-process', verificationState: 'verified', sourceUrl: 'https://example.org/study', ownerName: actor.name,
  }, actor);
  assert.equal(created.entityKey, 'research');
  assert.equal(created.status, 'in-process');
  assert.equal(created.verificationState, 'verified');
  const requirement = store.createFundamentalStudyRequirement(created.id, { title: 'Protocol packet', status: 'pending', dueDate: '2026-11-20', ownerName: actor.name }, actor);
  assert.equal(requirement.status, 'pending');
  assert.equal(store.updateFundamentalStudyRequirement(requirement.id, { status: 'ready' }, actor).status, 'ready');
  const document = store.createFundamentalStudyDocument(created.id, { title: 'Protocol PDF', category: 'protocol', sourceType: 'external_link', url: 'https://example.org/protocol.pdf', requirementId: requirement.id }, actor);
  assert.equal(document.version, 1);
  const version = store.createFundamentalStudyDocument(created.id, { title: 'Protocol PDF', category: 'protocol', sourceType: 'external_link', url: 'https://example.org/protocol-v2.pdf', requirementId: requirement.id, replacesDocumentId: document.id }, actor);
  assert.equal(version.version, 2);
  assert.equal(store.getFundamentalStudy(created.id).documents.length, 2);
  assert.equal(store.updateFundamentalStudy(created.id, { status: 'applied', statusNote: 'Human review complete.' }, actor).status, 'applied');
  const agentResult = store.prepareFundamentalStudyAgent(created.id, { task: 'review opportunity' }, actor, { configured: false });
  assert.equal(agentResult.requiresHumanApproval, true);
  assert.equal(agentResult.state, 'blocked_pending_configuration');
  assert.equal(store.listFundamentalStudies({ status: 'applied' }).length, 1);
  assert.equal(store.deleteFundamentalStudyDocument(document.id, actor), true);
  assert.equal(store.getFundamentalStudy(created.id).documents.length, 1);
  console.log('Fundamental Studies persistence, versioning and audit tests passed.');
} finally {
  await rm(testRoot, { recursive: true, force: true });
}
