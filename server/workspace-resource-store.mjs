import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const privateRoot = path.dirname(databasePath);
const resourceRoot = path.join(privateRoot, 'workspace-resources');
const resourceKinds = new Set(['file', 'photo', 'google-sheet', 'google-drive', 'link']);
const maxFileBytes = 30 * 1024 * 1024;
const now = () => new Date().toISOString();
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);
const httpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

function openDatabase() {
  mkdirSync(resourceRoot, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workspace_resources (
      id TEXT PRIMARY KEY,
      scope_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      filename TEXT NOT NULL DEFAULT '',
      content_type TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      file_path TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_workspace_resources_scope ON workspace_resources(scope_key, created_at);
  `);
  return database;
}

function normalizeScope(value) {
  const scopeKey = clean(value, 120).toLowerCase();
  if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/.test(scopeKey)) throw httpError('A valid resource section is required.');
  return scopeKey;
}

function publicResource(row) {
  return {
    id: row.id,
    scopeKey: row.scope_key,
    title: row.title,
    description: row.description,
    kind: row.kind,
    url: row.url || '',
    filename: row.filename || '',
    type: row.content_type || '',
    size: Number(row.size || 0),
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    fileUrl: row.file_path ? `/api/workspace-resources/${encodeURIComponent(row.id)}/file` : '',
  };
}

export function listWorkspaceResources(scopeKey) {
  const normalizedScope = normalizeScope(scopeKey);
  const database = openDatabase();
  try {
    return database.prepare('SELECT * FROM workspace_resources WHERE scope_key = ? ORDER BY created_at DESC').all(normalizedScope).map(publicResource);
  } finally { database.close(); }
}

export function getWorkspaceResource(id) {
  const database = openDatabase();
  try { return database.prepare('SELECT * FROM workspace_resources WHERE id = ?').get(clean(id, 100)) || null; }
  finally { database.close(); }
}

function decodeBase64(value) {
  const raw = String(value || '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!raw || !/^[a-z0-9+/]*={0,2}$/i.test(raw)) throw httpError('The selected file could not be read.');
  const bytes = Buffer.from(raw, 'base64');
  if (!bytes.length || bytes.length > maxFileBytes) throw httpError('Files must be between 1 byte and 30 MB.');
  return bytes;
}

function normalizedUrl(value) {
  const url = clean(value, 4000);
  if (!url) throw httpError('A link is required for this resource.');
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch { throw httpError('Use a valid http or https link.'); }
}

export async function createWorkspaceResource(payload = {}, actor) {
  const scopeKey = normalizeScope(payload.scopeKey);
  const title = clean(payload.title, 220);
  const description = clean(payload.description, 5000);
  const kind = clean(payload.kind, 30);
  if (!title) throw httpError('A resource title is required.');
  if (!resourceKinds.has(kind)) throw httpError('A supported resource type is required.');

  let url = '';
  let filename = '';
  let contentType = '';
  let size = 0;
  let filePath = '';
  if (['google-sheet', 'google-drive', 'link'].includes(kind)) {
    url = normalizedUrl(payload.url);
  } else {
    filename = clean(payload.filename, 240).replace(/[\\/\r\n]/g, '_') || 'uploaded-resource';
    contentType = clean(payload.type, 160) || (kind === 'photo' ? 'image/*' : 'application/octet-stream');
    const bytes = decodeBase64(payload.base64);
    size = bytes.length;
    const id = randomUUID();
    mkdirSync(resourceRoot, { recursive: true, mode: 0o700 });
    filePath = path.join(resourceRoot, `${id}${path.extname(filename).slice(0, 16)}`);
    await writeFile(filePath, bytes, { mode: 0o600 });
    const timestamp = now();
    const createdBy = clean(actor?.id, 180) || 'workspace-system';
    const createdByName = clean(actor?.name, 180) || clean(actor?.email, 320) || 'Workspace user';
    const database = openDatabase();
    try {
      database.prepare('INSERT INTO workspace_resources (id,scope_key,title,description,kind,url,filename,content_type,size,file_path,created_by,created_by_name,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(id, scopeKey, title, description, kind, url, filename, contentType, size, filePath, createdBy, createdByName, timestamp);
      return publicResource(database.prepare('SELECT * FROM workspace_resources WHERE id = ?').get(id));
    } finally { database.close(); }
  }

  const id = randomUUID();
  const timestamp = now();
  const createdBy = clean(actor?.id, 180) || 'workspace-system';
  const createdByName = clean(actor?.name, 180) || clean(actor?.email, 320) || 'Workspace user';
  const database = openDatabase();
  try {
    database.prepare('INSERT INTO workspace_resources (id,scope_key,title,description,kind,url,filename,content_type,size,file_path,created_by,created_by_name,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, scopeKey, title, description, kind, url, filename, contentType, size, filePath, createdBy, createdByName, timestamp);
    return publicResource(database.prepare('SELECT * FROM workspace_resources WHERE id = ?').get(id));
  } finally { database.close(); }
}

export async function deleteWorkspaceResource(id) {
  const resource = getWorkspaceResource(id);
  if (!resource) return false;
  const database = openDatabase();
  try { database.prepare('DELETE FROM workspace_resources WHERE id = ?').run(resource.id); }
  finally { database.close(); }
  if (resource.file_path) await unlink(resource.file_path).catch(() => null);
  return true;
}

export const workspaceResourceMaxFileBytes = maxFileBytes;
