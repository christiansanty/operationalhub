import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

const testRoot = await mkdtemp(path.join(tmpdir(), 'operational-hub-resources-'));
process.env.OPERATIONAL_HUB_DATABASE_PATH = path.join(testRoot, 'resources.sqlite');

try {
  const resources = await import(`../server/workspace-resource-store.mjs?test=${Date.now()}`);
  const actor = { id: 'resource-test-user', name: 'Resource Test User', email: 'resources@test.local' };
  const file = await resources.createWorkspaceResource({
    scopeKey: 'it', kind: 'file', title: 'Implementation brief', description: 'Test document',
    filename: 'brief.txt', type: 'text/plain', base64: Buffer.from('resource-test').toString('base64'),
  }, actor);
  assert.equal(file.scopeKey, 'it');
  assert.equal(file.createdByName, actor.name);
  assert.equal(resources.listWorkspaceResources('it').length, 1);

  const sheet = await resources.createWorkspaceResource({
    scopeKey: 'it', kind: 'google-sheet', title: 'Roadmap sheet', url: 'https://docs.google.com/spreadsheets/d/test',
  }, actor);
  assert.equal(sheet.url, 'https://docs.google.com/spreadsheets/d/test');
  assert.equal(resources.listWorkspaceResources('it').length, 2);
  assert.equal(await resources.deleteWorkspaceResource(file.id), true);
  assert.equal(resources.listWorkspaceResources('it').length, 1);
  await resources.deleteWorkspaceResource(sheet.id);
  console.log('Workspace resource file, link, scope and deletion tests passed.');
} finally {
  await rm(testRoot, { recursive: true, force: true });
}
