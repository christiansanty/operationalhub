import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const ideaStatuses = new Set(['idea', 'review', 'planned', 'in-progress', 'done']);
const now = () => new Date().toISOString();
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);
const httpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

function openDatabase() {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS research_workspace_ideas (
      id TEXT PRIMARY KEY,
      scope_key TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'idea',
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_research_workspace_ideas_scope ON research_workspace_ideas(scope_key, updated_at);
  `);
  return database;
}

function normalizeScope(value) {
  const scopeKey = clean(value, 120).toLowerCase();
  if (scopeKey !== 'entity-research') throw httpError('Research workspace scope is required.');
  return scopeKey;
}

function publicIdea(row) {
  return {
    id: row.id,
    scopeKey: row.scope_key,
    title: row.title,
    details: row.details,
    status: row.status,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listResearchWorkspaceIdeas(scopeKey = 'entity-research') {
  const normalizedScope = normalizeScope(scopeKey);
  const database = openDatabase();
  try {
    return database.prepare('SELECT * FROM research_workspace_ideas WHERE scope_key = ? ORDER BY updated_at DESC').all(normalizedScope).map(publicIdea);
  } finally { database.close(); }
}

export function getResearchWorkspaceIdea(id) {
  const database = openDatabase();
  try { return database.prepare('SELECT * FROM research_workspace_ideas WHERE id = ?').get(clean(id, 100)) || null; }
  finally { database.close(); }
}

export function createResearchWorkspaceIdea(payload = {}, actor) {
  const scopeKey = normalizeScope(payload.scopeKey);
  const title = clean(payload.title, 220);
  const details = clean(payload.details, 5000);
  const status = clean(payload.status, 30) || 'idea';
  if (!title) throw httpError('An idea title is required.');
  if (!ideaStatuses.has(status)) throw httpError('A supported idea status is required.');
  const id = randomUUID();
  const timestamp = now();
  const createdBy = clean(actor?.id, 180) || 'workspace-system';
  const createdByName = clean(actor?.name, 180) || clean(actor?.email, 320) || 'Workspace user';
  const database = openDatabase();
  try {
    database.prepare('INSERT INTO research_workspace_ideas (id,scope_key,title,details,status,created_by,created_by_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, scopeKey, title, details, status, createdBy, createdByName, timestamp, timestamp);
    return publicIdea(database.prepare('SELECT * FROM research_workspace_ideas WHERE id = ?').get(id));
  } finally { database.close(); }
}

export function updateResearchWorkspaceIdea(id, payload = {}) {
  const existing = getResearchWorkspaceIdea(id);
  if (!existing) return null;
  const title = clean(payload.title, 220) || existing.title;
  const details = payload.details === undefined ? existing.details : clean(payload.details, 5000);
  const status = payload.status === undefined ? existing.status : clean(payload.status, 30);
  if (!ideaStatuses.has(status)) throw httpError('A supported idea status is required.');
  const updatedAt = now();
  const database = openDatabase();
  try {
    database.prepare('UPDATE research_workspace_ideas SET title = ?, details = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(title, details, status, updatedAt, existing.id);
    return publicIdea(database.prepare('SELECT * FROM research_workspace_ideas WHERE id = ?').get(existing.id));
  } finally { database.close(); }
}

export function deleteResearchWorkspaceIdea(id) {
  const database = openDatabase();
  try { return database.prepare('DELETE FROM research_workspace_ideas WHERE id = ?').run(clean(id, 100)).changes > 0; }
  finally { database.close(); }
}

