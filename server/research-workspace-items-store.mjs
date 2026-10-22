import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const itemStatuses = new Set(['planned', 'in-progress', 'blocked', 'done']);
const priorities = new Set(['low', 'medium', 'high']);
const now = () => new Date().toISOString();
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);
const httpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

function openDatabase() {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS research_workspace_items (
      id TEXT PRIMARY KEY,
      scope_key TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned',
      priority TEXT NOT NULL DEFAULT 'medium',
      deadline TEXT NOT NULL DEFAULT '',
      follow_up_date TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      attachments_json TEXT NOT NULL DEFAULT '[]',
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_research_workspace_items_scope ON research_workspace_items(scope_key, deadline, updated_at);
  `);
  return database;
}

function normalizeScope(value) {
  const scopeKey = clean(value, 120).toLowerCase();
  if (scopeKey !== 'entity-research') throw httpError('Research workspace scope is required.');
  return scopeKey;
}

function normalizeDate(value) {
  const date = clean(value, 20);
  if (!date) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError('Dates must use YYYY-MM-DD format.');
  return date;
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map(item => ({
    id: clean(item?.id, 100),
    title: clean(item?.title, 220),
    kind: clean(item?.kind, 30),
    url: clean(item?.url, 4000),
    fileUrl: clean(item?.fileUrl, 4000),
    filename: clean(item?.filename, 240),
    type: clean(item?.type, 160),
    createdByName: clean(item?.createdByName, 180),
  })).filter(item => item.title && (item.url || item.fileUrl));
}

function publicItem(row) {
  let attachments = [];
  try { attachments = JSON.parse(row.attachments_json || '[]'); } catch { attachments = []; }
  return {
    id: row.id,
    scopeKey: row.scope_key,
    title: row.title,
    details: row.details,
    status: row.status,
    priority: row.priority,
    deadline: row.deadline,
    followUpDate: row.follow_up_date,
    owner: row.owner,
    notes: row.notes,
    attachments,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listResearchWorkspaceItems(scopeKey = 'entity-research') {
  const normalizedScope = normalizeScope(scopeKey);
  const database = openDatabase();
  try { return database.prepare('SELECT * FROM research_workspace_items WHERE scope_key = ? ORDER BY CASE WHEN deadline = \'\' THEN 1 ELSE 0 END, deadline ASC, updated_at DESC').all(normalizedScope).map(publicItem); }
  finally { database.close(); }
}

export function getResearchWorkspaceItem(id) {
  const database = openDatabase();
  try { return database.prepare('SELECT * FROM research_workspace_items WHERE id = ?').get(clean(id, 100)) || null; }
  finally { database.close(); }
}

function itemValues(payload = {}, actor, existing = null) {
  const scopeKey = normalizeScope(payload.scopeKey || existing?.scope_key);
  const title = clean(payload.title, 220) || existing?.title || '';
  const details = payload.details === undefined ? (existing?.details || '') : clean(payload.details, 5000);
  const status = payload.status === undefined ? (existing?.status || 'planned') : clean(payload.status, 30);
  const priority = payload.priority === undefined ? (existing?.priority || 'medium') : clean(payload.priority, 30);
  const deadline = payload.deadline === undefined ? (existing?.deadline || '') : normalizeDate(payload.deadline);
  const followUpDate = payload.followUpDate === undefined ? (existing?.follow_up_date || '') : normalizeDate(payload.followUpDate);
  const owner = payload.owner === undefined ? (existing?.owner || '') : clean(payload.owner, 180);
  const notes = payload.notes === undefined ? (existing?.notes || '') : clean(payload.notes, 8000);
  let attachments = existing ? (() => { try { return JSON.parse(existing.attachments_json || '[]'); } catch { return []; } })() : [];
  if (payload.attachments !== undefined) attachments = normalizeAttachments(payload.attachments);
  if (!title) throw httpError('A workspace item title is required.');
  if (!itemStatuses.has(status)) throw httpError('A supported workspace item status is required.');
  if (!priorities.has(priority)) throw httpError('A supported workspace item priority is required.');
  const createdBy = existing?.created_by || clean(actor?.id, 180) || 'workspace-system';
  const createdByName = existing?.created_by_name || clean(actor?.name, 180) || clean(actor?.email, 320) || 'Workspace user';
  return { scopeKey, title, details, status, priority, deadline, followUpDate, owner, notes, attachments, createdBy, createdByName };
}

export function createResearchWorkspaceItem(payload = {}, actor) {
  const values = itemValues(payload, actor);
  const id = randomUUID();
  const timestamp = now();
  const database = openDatabase();
  try {
    database.prepare('INSERT INTO research_workspace_items (id,scope_key,title,details,status,priority,deadline,follow_up_date,owner,notes,attachments_json,created_by,created_by_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, values.scopeKey, values.title, values.details, values.status, values.priority, values.deadline, values.followUpDate, values.owner, values.notes, JSON.stringify(values.attachments), values.createdBy, values.createdByName, timestamp, timestamp);
    return publicItem(database.prepare('SELECT * FROM research_workspace_items WHERE id = ?').get(id));
  } finally { database.close(); }
}

export function updateResearchWorkspaceItem(id, payload = {}) {
  const existing = getResearchWorkspaceItem(id);
  if (!existing) return null;
  const values = itemValues(payload, null, existing);
  const updatedAt = now();
  const database = openDatabase();
  try {
    database.prepare('UPDATE research_workspace_items SET title=?,details=?,status=?,priority=?,deadline=?,follow_up_date=?,owner=?,notes=?,attachments_json=?,updated_at=? WHERE id=?')
      .run(values.title, values.details, values.status, values.priority, values.deadline, values.followUpDate, values.owner, values.notes, JSON.stringify(values.attachments), updatedAt, existing.id);
    return publicItem(database.prepare('SELECT * FROM research_workspace_items WHERE id = ?').get(existing.id));
  } finally { database.close(); }
}

export function deleteResearchWorkspaceItem(id) {
  const database = openDatabase();
  try { return database.prepare('DELETE FROM research_workspace_items WHERE id = ?').run(clean(id, 100)).changes > 0; }
  finally { database.close(); }
}
