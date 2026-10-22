import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

const testRoot = await mkdtemp(path.join(tmpdir(), 'operational-hub-research-workspace-'));
process.env.OPERATIONAL_HUB_DATABASE_PATH = path.join(testRoot, 'research-workspace.sqlite');

try {
  const store = await import(`../server/research-workspace-store.mjs?test=${Date.now()}`);
  const items = await import(`../server/research-workspace-items-store.mjs?test=${Date.now()}`);
  const actor = { id: 'research-test-user', name: 'Research Test User', email: 'research@test.local' };
  const created = store.createResearchWorkspaceIdea({ scopeKey: 'entity-research', title: 'Add a sponsor feasibility checklist', details: 'Share a checklist before site activation.', status: 'idea' }, actor);
  assert.equal(created.scopeKey, 'entity-research');
  assert.equal(created.createdByName, actor.name);
  assert.equal(store.listResearchWorkspaceIdeas().length, 1);
  const updated = store.updateResearchWorkspaceIdea(created.id, { status: 'planned', details: 'Review with the study and regulatory teams.' });
  assert.equal(updated.status, 'planned');
  assert.equal(updated.createdByName, actor.name);
  assert.equal(store.deleteResearchWorkspaceIdea(created.id), true);
  assert.equal(store.listResearchWorkspaceIdeas().length, 0);
  const item = items.createResearchWorkspaceItem({
    scopeKey: 'entity-research',
    title: 'Confirm site startup package',
    details: 'Coordinate sponsor and regulatory review.',
    status: 'in-progress',
    priority: 'high',
    deadline: '2026-11-15',
    followUpDate: '2026-11-01',
    owner: 'Research Operations',
    notes: 'Waiting for protocol version.',
    attachments: [{ id: 'resource-1', title: 'Study sheet', kind: 'google-sheet', url: 'https://docs.google.com/spreadsheets/d/example' }],
  }, actor);
  assert.equal(item.title, 'Confirm site startup package');
  assert.equal(item.priority, 'high');
  assert.equal(item.deadline, '2026-11-15');
  assert.equal(item.attachments[0].kind, 'google-sheet');
  assert.equal(items.listResearchWorkspaceItems().length, 1);
  const updatedItem = items.updateResearchWorkspaceItem(item.id, { status: 'done', notes: 'Reviewed and approved.' });
  assert.equal(updatedItem.status, 'done');
  assert.equal(updatedItem.notes, 'Reviewed and approved.');
  assert.equal(items.deleteResearchWorkspaceItem(item.id), true);
  assert.equal(items.listResearchWorkspaceItems().length, 0);
  console.log('Research workspace ideas and tracker persistence tests passed.');
} finally {
  await rm(testRoot, { recursive: true, force: true });
}
