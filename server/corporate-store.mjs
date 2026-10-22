import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const privateRoot = path.dirname(databasePath);
const attachmentRoot = path.join(privateRoot, 'corporate', 'attachments');
const categories = new Set(['idea', 'blueprint', 'strategy', 'action']);
const statuses = new Set(['draft', 'review', 'approved', 'active', 'done']);
const priorities = new Set(['low', 'medium', 'high', 'critical']);
const now = () => new Date().toISOString();
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);
const httpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const parseJson = (value, fallback = []) => { try { return JSON.parse(value || '') } catch { return fallback } };

function openDatabase() {
  mkdirSync(attachmentRoot, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS corporate_records (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      objective TEXT NOT NULL DEFAULT '',
      next_step TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      collaborators_json TEXT NOT NULL DEFAULT '[]',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'draft',
      target_date TEXT,
      prompt TEXT NOT NULL DEFAULT '',
      document_content TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_corporate_records_category ON corporate_records(category, updated_at);
    CREATE TABLE IF NOT EXISTS corporate_notes (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL REFERENCES corporate_records(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_corporate_notes_record ON corporate_notes(record_id, created_at);
    CREATE TABLE IF NOT EXISTS corporate_attachments (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL REFERENCES corporate_records(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_corporate_attachments_record ON corporate_attachments(record_id, created_at);
  `);
  return database;
}

const actorName = actor => clean(actor?.name, 180) || clean(actor?.email, 320) || 'Corporate executive';
const publicNote = row => ({ id: row.id, authorId: row.author_id, authorName: row.author_name, note: row.note, createdAt: row.created_at });
const publicAttachment = row => ({ id: row.id, filename: row.filename, type: row.content_type, size: Number(row.size || 0), uploadedBy: row.uploaded_by, uploadedByName: row.uploaded_by_name, createdAt: row.created_at, fileUrl: `/api/corporate/attachments/${encodeURIComponent(row.id)}/file` });
const publicRecord = row => ({
  id: row.id,
  category: row.category,
  title: row.title,
  summary: row.summary,
  objective: row.objective,
  nextStep: row.next_step,
  owner: row.owner,
  collaborators: parseJson(row.collaborators_json),
  priority: row.priority,
  status: row.status,
  targetDate: row.target_date || '',
  prompt: row.prompt,
  documentContent: row.document_content,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function validateRecord(payload = {}) {
  const category = clean(payload.category, 30);
  if (!categories.has(category)) throw httpError('Corporate module is required.');
  const title = clean(payload.title, 220);
  if (!title) throw httpError('Corporate record title is required.');
  const collaborators = Array.isArray(payload.collaborators)
    ? payload.collaborators.slice(0, 20).map(value => clean(value, 180)).filter(Boolean)
    : clean(payload.collaborators, 1200).split(/[,;\n]/).map(value => clean(value, 180)).filter(Boolean).slice(0, 20);
  return {
    category,
    title,
    summary: clean(payload.summary, 5000),
    objective: clean(payload.objective, 5000),
    nextStep: clean(payload.nextStep, 5000),
    owner: clean(payload.owner, 180),
    collaborators,
    priority: priorities.has(payload.priority) ? payload.priority : 'medium',
    status: statuses.has(payload.status) ? payload.status : 'draft',
    targetDate: clean(payload.targetDate, 50),
    prompt: clean(payload.prompt, 12000),
  };
}

function buildDocument(record, prompt = record.prompt) {
  const lines = [
    `# ${record.title}`,
    '',
    `Module: ${record.category}`,
    `Created by: ${record.createdByName}`,
    `Created: ${record.createdAt}`,
    `Owner: ${record.owner || 'Unassigned'}`,
    `Collaborators: ${record.collaborators.join(', ') || 'None listed'}`,
    `Deadline: ${record.targetDate || 'Not set'}`,
    `Priority: ${record.priority}`,
    `Status: ${record.status}`,
    '',
    '## Executive summary',
    record.summary || 'Add an executive summary to this record.',
    '',
    '## Objective',
    record.objective || 'Add the intended outcome.',
    '',
    '## Next step',
    record.nextStep || 'Define the next concrete action.',
  ];
  if (prompt) lines.push('', '## Dictated prompt', prompt);
  lines.push('', '## Follow-up', 'Use the notes timeline in Corporate to record decisions, progress and next actions.');
  return lines.join('\n');
}

export function listCorporateRecords(category = '') {
  const database = openDatabase();
  try {
    const rows = category && categories.has(category)
      ? database.prepare('SELECT * FROM corporate_records WHERE category = ? ORDER BY updated_at DESC').all(category)
      : database.prepare('SELECT * FROM corporate_records ORDER BY updated_at DESC').all();
    return rows.map(row => ({
      ...publicRecord(row),
      noteCount: Number(database.prepare('SELECT COUNT(*) AS count FROM corporate_notes WHERE record_id = ?').get(row.id)?.count || 0),
      attachmentCount: Number(database.prepare('SELECT COUNT(*) AS count FROM corporate_attachments WHERE record_id = ?').get(row.id)?.count || 0),
    }));
  } finally { database.close(); }
}

export function getCorporateRecord(id) {
  const database = openDatabase();
  try {
    const row = database.prepare('SELECT * FROM corporate_records WHERE id = ?').get(clean(id, 100));
    if (!row) return null;
    return {
      ...publicRecord(row),
      notes: database.prepare('SELECT * FROM corporate_notes WHERE record_id = ? ORDER BY created_at DESC').all(row.id).map(publicNote),
      attachments: database.prepare('SELECT * FROM corporate_attachments WHERE record_id = ? ORDER BY created_at DESC').all(row.id).map(publicAttachment),
    };
  } finally { database.close(); }
}

export function createCorporateRecord(payload = {}, actor) {
  const record = validateRecord(payload);
  const timestamp = now();
  const id = randomUUID();
  const createdBy = clean(actor?.id, 180) || 'corporate-system';
  const createdByName = actorName(actor);
  const documentContent = payload.generateDocument || record.prompt ? buildDocument({ ...record, createdByName, createdAt: timestamp }, record.prompt) : '';
  const database = openDatabase();
  try {
    database.prepare(`INSERT INTO corporate_records (id,category,title,summary,objective,next_step,owner,collaborators_json,priority,status,target_date,prompt,document_content,created_by,created_by_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, record.category, record.title, record.summary, record.objective, record.nextStep, record.owner || createdByName, JSON.stringify(record.collaborators), record.priority, record.status, record.targetDate || null, record.prompt, documentContent, createdBy, createdByName, timestamp, timestamp);
    if (clean(payload.note, 5000)) database.prepare('INSERT INTO corporate_notes (id,record_id,author_id,author_name,note,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(), id, createdBy, createdByName, clean(payload.note, 5000), timestamp);
    return getCorporateRecord(id);
  } finally { database.close(); }
}

export function updateCorporateRecord(id, payload = {}, actor) {
  const current = getCorporateRecord(id);
  if (!current) throw httpError('Corporate record not found.', 404);
  const record = validateRecord({ ...current, ...payload, category: payload.category || current.category });
  const timestamp = now();
  const database = openDatabase();
  try {
    const documentContent = payload.regenerateDocument ? buildDocument({ ...record, createdByName: current.createdByName, createdAt: current.createdAt }, record.prompt) : current.documentContent;
    database.prepare(`UPDATE corporate_records SET category=?,title=?,summary=?,objective=?,next_step=?,owner=?,collaborators_json=?,priority=?,status=?,target_date=?,prompt=?,document_content=?,updated_at=? WHERE id=?`)
      .run(record.category, record.title, record.summary, record.objective, record.nextStep, record.owner, JSON.stringify(record.collaborators), record.priority, record.status, record.targetDate || null, record.prompt, documentContent, timestamp, current.id);
    if (clean(payload.note, 5000)) database.prepare('INSERT INTO corporate_notes (id,record_id,author_id,author_name,note,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(), current.id, clean(actor?.id, 180) || 'corporate-system', actorName(actor), clean(payload.note, 5000), timestamp);
    return getCorporateRecord(current.id);
  } finally { database.close(); }
}

export function generateCorporateDocument(id, prompt, actor) {
  const current = getCorporateRecord(id);
  if (!current) throw httpError('Corporate record not found.', 404);
  const nextPrompt = clean(prompt, 12000);
  if (!nextPrompt) throw httpError('A dictated prompt is required.');
  const timestamp = now();
  const database = openDatabase();
  try {
    const content = buildDocument({ ...current, prompt: nextPrompt }, nextPrompt);
    database.prepare('UPDATE corporate_records SET prompt=?,document_content=?,updated_at=? WHERE id=?').run(nextPrompt, content, timestamp, current.id);
    database.prepare('INSERT INTO corporate_notes (id,record_id,author_id,author_name,note,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(), current.id, clean(actor?.id, 180) || 'corporate-system', actorName(actor), 'Document generated from the dictated prompt.', timestamp);
    return getCorporateRecord(current.id);
  } finally { database.close(); }
}

export function createCorporateNote(id, note, actor) {
  const value = clean(note, 5000);
  if (!value) throw httpError('Follow-up note is required.');
  const database = openDatabase();
  try {
    const record = database.prepare('SELECT id FROM corporate_records WHERE id = ?').get(clean(id, 100));
    if (!record) throw httpError('Corporate record not found.', 404);
    const timestamp = now();
    database.prepare('INSERT INTO corporate_notes (id,record_id,author_id,author_name,note,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(), record.id, clean(actor?.id, 180) || 'corporate-system', actorName(actor), value, timestamp);
    database.prepare('UPDATE corporate_records SET updated_at = ? WHERE id = ?').run(timestamp, record.id);
    return getCorporateRecord(record.id);
  } finally { database.close(); }
}

export async function createCorporateAttachment(id, payload = {}, actor) {
  const filename = clean(payload.filename, 240).replace(/[\\/\r\n"]/g, '_');
  const base64 = String(payload.base64 || '');
  if (!filename || !base64) throw httpError('Attachment filename and file content are required.');
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > 30 * 1024 * 1024) throw httpError('Corporate attachments must be between 1 byte and 30 MB.');
  const database = openDatabase();
  try {
    const record = database.prepare('SELECT id FROM corporate_records WHERE id = ?').get(clean(id, 100));
    if (!record) throw httpError('Corporate record not found.', 404);
    const attachmentId = randomUUID();
    const filePath = path.join(attachmentRoot, `${attachmentId}${path.extname(filename).slice(0, 12)}`);
    const timestamp = now();
    await writeFile(filePath, bytes, { mode: 0o600 });
    database.prepare('INSERT INTO corporate_attachments (id,record_id,filename,content_type,size,file_path,uploaded_by,uploaded_by_name,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(attachmentId, record.id, filename, clean(payload.type, 120) || 'application/octet-stream', bytes.length, filePath, clean(actor?.id, 180) || 'corporate-system', actorName(actor), timestamp);
    database.prepare('UPDATE corporate_records SET updated_at = ? WHERE id = ?').run(timestamp, record.id);
    return getCorporateRecord(record.id);
  } catch (error) {
    if (error.statusCode) throw error;
    throw error;
  } finally { database.close(); }
}

export function getCorporateAttachment(id) {
  const database = openDatabase();
  try { return database.prepare('SELECT * FROM corporate_attachments WHERE id = ?').get(clean(id, 100)) || null; }
  finally { database.close(); }
}
