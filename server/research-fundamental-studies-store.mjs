import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const privateRoot = path.dirname(databasePath);
const entityKey = 'research';
const statuses = new Set(['active', 'in-process', 'status', 'applied', 'stand-by']);
const verificationStates = new Set(['verified', 'pending_verification', 'manual_entry']);
const requirementStatuses = new Set(['pending', 'in-preparation', 'ready', 'not-applicable']);
const documentCategories = new Set(['protocol', 'eligibility', 'application', 'consent', 'regulatory', 'sponsor', 'other']);

const now = () => new Date().toISOString();
const clean = (value, max = 4000) => String(value ?? '').trim().slice(0, max);
const safeDate = value => {
  const date = clean(value, 10);
  if (!date) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError('Dates must use YYYY-MM-DD.');
  return date;
};
const safeUrl = value => {
  const url = clean(value, 4000);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch { throw httpError('Source links must use http or https.'); }
};
const actorName = actor => clean(actor?.name, 180) || clean(actor?.email, 320) || 'Research user';
const httpError = message => { const error = new Error(message); error.statusCode = 400; return error; };
const parseJson = (value, fallback = []) => { try { return JSON.parse(value || ''); } catch { return fallback; } };

function openDatabase() {
  mkdirSync(privateRoot, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS fundamental_studies (
      id TEXT PRIMARY KEY,
      entity_key TEXT NOT NULL CHECK (entity_key = 'research'),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      institution TEXT NOT NULL DEFAULT '',
      sponsor TEXT NOT NULL DEFAULT '',
      area TEXT NOT NULL DEFAULT '',
      eligibility TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      deadline TEXT NOT NULL DEFAULT '',
      important_dates_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL,
      verification_state TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      source_checked_at TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL DEFAULT '',
      owner_name TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fundamental_studies_scope ON fundamental_studies(entity_key, status, deadline, updated_at);
    CREATE TABLE IF NOT EXISTS fundamental_study_status_history (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES fundamental_studies(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL DEFAULT '',
      to_status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      changed_by_name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      changed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fundamental_study_history ON fundamental_study_status_history(study_id, changed_at);
    CREATE TABLE IF NOT EXISTS fundamental_study_requirements (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES fundamental_studies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      owner_id TEXT NOT NULL DEFAULT '',
      owner_name TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fundamental_requirements ON fundamental_study_requirements(study_id, status, due_date);
    CREATE TABLE IF NOT EXISTS fundamental_study_documents (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES fundamental_studies(id) ON DELETE CASCADE,
      requirement_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      source_type TEXT NOT NULL,
      resource_id TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      version INTEGER NOT NULL DEFAULT 1,
      replaces_document_id TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      incorporated_by TEXT NOT NULL,
      incorporated_by_name TEXT NOT NULL,
      incorporated_at TEXT NOT NULL,
      deleted_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_fundamental_documents ON fundamental_study_documents(study_id, deleted_at, incorporated_at);
    CREATE TABLE IF NOT EXISTS fundamental_study_activity (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES fundamental_studies(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fundamental_activity ON fundamental_study_activity(study_id, created_at);
  `);
  return database;
}

function publicHistory(row) {
  return { id: row.id, fromStatus: row.from_status, toStatus: row.to_status, changedBy: row.changed_by, changedByName: row.changed_by_name, note: row.note, changedAt: row.changed_at };
}

function publicRequirement(row) {
  return { id: row.id, studyId: row.study_id, title: row.title, description: row.description, status: row.status, ownerId: row.owner_id, ownerName: row.owner_name, dueDate: row.due_date, createdBy: row.created_by, createdByName: row.created_by_name, createdAt: row.created_at, updatedAt: row.updated_at };
}

function publicDocument(row) {
  return { id: row.id, studyId: row.study_id, requirementId: row.requirement_id || '', title: row.title, category: row.category, sourceType: row.source_type, resourceId: row.resource_id, url: row.url, version: row.version, replacesDocumentId: row.replaces_document_id, notes: row.notes, incorporatedBy: row.incorporated_by, incorporatedByName: row.incorporated_by_name, incorporatedAt: row.incorporated_at };
}

function publicActivity(row) {
  return { id: row.id, studyId: row.study_id, actorId: row.actor_id, actorName: row.actor_name, kind: row.kind, summary: row.summary, details: parseJson(row.details_json, {}), createdAt: row.created_at };
}

function addActivity(database, studyId, actor, kind, summary, details = {}) {
  database.prepare('INSERT INTO fundamental_study_activity (id,study_id,actor_id,actor_name,kind,summary,details_json,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(randomUUID(), studyId, clean(actor?.id, 180), actorName(actor), clean(kind, 80), clean(summary, 500), JSON.stringify(details), now());
}

function studyRow(database, id) {
  return database.prepare("SELECT * FROM fundamental_studies WHERE id = ? AND entity_key = 'research'").get(clean(id, 120)) || null;
}

function publicStudy(row, database) {
  if (!row) return null;
  const requirements = database.prepare('SELECT * FROM fundamental_study_requirements WHERE study_id = ? ORDER BY CASE status WHEN \'pending\' THEN 0 WHEN \'in-preparation\' THEN 1 WHEN \'ready\' THEN 2 ELSE 3 END, due_date, created_at').all(row.id).map(publicRequirement);
  const documents = database.prepare("SELECT * FROM fundamental_study_documents WHERE study_id = ? AND deleted_at = '' ORDER BY incorporated_at DESC").all(row.id).map(publicDocument);
  const history = database.prepare('SELECT * FROM fundamental_study_status_history WHERE study_id = ? ORDER BY changed_at DESC').all(row.id).map(publicHistory);
  const activity = database.prepare('SELECT * FROM fundamental_study_activity WHERE study_id = ? ORDER BY created_at DESC LIMIT 100').all(row.id).map(publicActivity);
  return {
    id: row.id, entityKey: row.entity_key, title: row.title, description: row.description, institution: row.institution,
    sponsor: row.sponsor, area: row.area, eligibility: row.eligibility, location: row.location, deadline: row.deadline,
    importantDates: parseJson(row.important_dates_json), status: row.status, verificationState: row.verification_state,
    sourceUrl: row.source_url, sourceCheckedAt: row.source_checked_at, ownerId: row.owner_id, ownerName: row.owner_name,
    createdBy: row.created_by, createdByName: row.created_by_name, createdAt: row.created_at, updatedAt: row.updated_at,
    requirements, documents, history, activity,
  };
}

export function listFundamentalStudies(filters = {}) {
  const database = openDatabase();
  try {
    const clauses = ["entity_key = 'research'"];
    const values = [];
    if (statuses.has(filters.status)) { clauses.push('status = ?'); values.push(filters.status); }
    const query = clean(filters.query, 160).toLowerCase();
    if (query) { clauses.push("lower(title || ' ' || description || ' ' || institution || ' ' || sponsor || ' ' || area || ' ' || location) LIKE ?"); values.push(`%${query}%`); }
    if (clean(filters.area, 120)) { clauses.push('lower(area) LIKE ?'); values.push(`%${clean(filters.area, 120).toLowerCase()}%`); }
    if (clean(filters.institution, 160)) { clauses.push('lower(institution) LIKE ?'); values.push(`%${clean(filters.institution, 160).toLowerCase()}%`); }
    if (clean(filters.location, 160)) { clauses.push('lower(location) LIKE ?'); values.push(`%${clean(filters.location, 160).toLowerCase()}%`); }
    if (clean(filters.owner, 160)) { clauses.push('lower(owner_name) LIKE ?'); values.push(`%${clean(filters.owner, 160).toLowerCase()}%`); }
    if (safeDate(filters.deadlineTo)) { clauses.push("deadline <> '' AND deadline <= ?"); values.push(safeDate(filters.deadlineTo)); }
    const rows = database.prepare(`SELECT * FROM fundamental_studies WHERE ${clauses.join(' AND ')} ORDER BY CASE WHEN deadline = '' THEN 1 ELSE 0 END, deadline, updated_at DESC`).all(...values);
    return rows.map(row => publicStudy(row, database));
  } finally { database.close(); }
}

export function getFundamentalStudy(id) {
  const database = openDatabase();
  try { return publicStudy(studyRow(database, id), database); } finally { database.close(); }
}

export function createFundamentalStudy(payload = {}, actor) {
  const title = clean(payload.title, 240);
  if (!title) throw httpError('A study title is required.');
  const status = statuses.has(payload.status) ? payload.status : 'stand-by';
  const verificationState = verificationStates.has(payload.verificationState) ? payload.verificationState : 'manual_entry';
  const timestamp = now();
  const id = randomUUID();
  const database = openDatabase();
  try {
    database.prepare(`INSERT INTO fundamental_studies (id,entity_key,title,description,institution,sponsor,area,eligibility,location,deadline,important_dates_json,status,verification_state,source_url,source_checked_at,owner_id,owner_name,created_by,created_by_name,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, entityKey, title, clean(payload.description), clean(payload.institution, 240), clean(payload.sponsor, 240), clean(payload.area, 180), clean(payload.eligibility), clean(payload.location, 240), safeDate(payload.deadline), JSON.stringify(Array.isArray(payload.importantDates) ? payload.importantDates.slice(0, 30) : []), status, verificationState, clean(payload.sourceUrl, 4000), clean(payload.sourceCheckedAt, 40), clean(payload.ownerId, 180), clean(payload.ownerName, 180), clean(actor?.id, 180), actorName(actor), timestamp, timestamp,
    );
    database.prepare('INSERT INTO fundamental_study_status_history (id,study_id,from_status,to_status,changed_by,changed_by_name,note,changed_at) VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(), id, '', status, clean(actor?.id, 180), actorName(actor), 'Study created.', timestamp);
    addActivity(database, id, actor, 'study_created', 'Fundamental Study created.', { verificationState });
    return publicStudy(studyRow(database, id), database);
  } finally { database.close(); }
}

export function updateFundamentalStudy(id, payload = {}, actor) {
  const database = openDatabase();
  try {
    const current = studyRow(database, id);
    if (!current) return null;
    const status = statuses.has(payload.status) ? payload.status : current.status;
    const verificationState = verificationStates.has(payload.verificationState) ? payload.verificationState : current.verification_state;
    const timestamp = now();
    database.prepare(`UPDATE fundamental_studies SET title=?,description=?,institution=?,sponsor=?,area=?,eligibility=?,location=?,deadline=?,important_dates_json=?,status=?,verification_state=?,source_url=?,source_checked_at=?,owner_id=?,owner_name=?,updated_at=? WHERE id=?`).run(
      clean(payload.title ?? current.title, 240), clean(payload.description ?? current.description), clean(payload.institution ?? current.institution, 240), clean(payload.sponsor ?? current.sponsor, 240), clean(payload.area ?? current.area, 180), clean(payload.eligibility ?? current.eligibility), clean(payload.location ?? current.location, 240), safeDate(payload.deadline ?? current.deadline), JSON.stringify(Array.isArray(payload.importantDates) ? payload.importantDates.slice(0, 30) : parseJson(current.important_dates_json)), status, verificationState, clean(payload.sourceUrl ?? current.source_url, 4000), clean(payload.sourceCheckedAt ?? current.source_checked_at, 40), clean(payload.ownerId ?? current.owner_id, 180), clean(payload.ownerName ?? current.owner_name, 180), timestamp, current.id,
    );
    if (status !== current.status) database.prepare('INSERT INTO fundamental_study_status_history (id,study_id,from_status,to_status,changed_by,changed_by_name,note,changed_at) VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(), id, current.status, status, clean(actor?.id, 180), actorName(actor), clean(payload.statusNote, 500), timestamp);
    addActivity(database, id, actor, status !== current.status ? 'status_changed' : 'study_updated', status !== current.status ? `Status changed to ${status}.` : 'Fundamental Study updated.', { fromStatus: current.status, toStatus: status });
    return publicStudy(studyRow(database, id), database);
  } finally { database.close(); }
}

export function createFundamentalStudyRequirement(studyId, payload = {}, actor) {
  const title = clean(payload.title, 240);
  if (!title) throw httpError('A requirement title is required.');
  const database = openDatabase();
  try {
    const study = studyRow(database, studyId); if (!study) return null;
    const timestamp = now(); const id = randomUUID(); const status = requirementStatuses.has(payload.status) ? payload.status : 'pending';
    database.prepare('INSERT INTO fundamental_study_requirements (id,study_id,title,description,status,owner_id,owner_name,due_date,created_by,created_by_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id, study.id, title, clean(payload.description), status, clean(payload.ownerId, 180), clean(payload.ownerName, 180), safeDate(payload.dueDate), clean(actor?.id, 180), actorName(actor), timestamp, timestamp);
    addActivity(database, study.id, actor, 'requirement_created', `Requirement added: ${title}.`, { requirementId: id });
    return publicRequirement(database.prepare('SELECT * FROM fundamental_study_requirements WHERE id = ?').get(id));
  } finally { database.close(); }
}

export function updateFundamentalStudyRequirement(requirementId, payload = {}, actor) {
  const database = openDatabase();
  try {
    const current = database.prepare('SELECT * FROM fundamental_study_requirements WHERE id = ?').get(clean(requirementId, 120));
    if (!current) return null;
    const timestamp = now(); const status = requirementStatuses.has(payload.status) ? payload.status : current.status;
    database.prepare('UPDATE fundamental_study_requirements SET title=?,description=?,status=?,owner_id=?,owner_name=?,due_date=?,updated_at=? WHERE id=?').run(clean(payload.title ?? current.title, 240), clean(payload.description ?? current.description), status, clean(payload.ownerId ?? current.owner_id, 180), clean(payload.ownerName ?? current.owner_name, 180), safeDate(payload.dueDate ?? current.due_date), timestamp, current.id);
    addActivity(database, current.study_id, actor, 'requirement_updated', `Requirement updated: ${current.title}.`, { requirementId: current.id, status });
    return publicRequirement(database.prepare('SELECT * FROM fundamental_study_requirements WHERE id = ?').get(current.id));
  } finally { database.close(); }
}

export function createFundamentalStudyDocument(studyId, payload = {}, actor) {
  const title = clean(payload.title, 240); const sourceType = clean(payload.sourceType, 40) || 'external_link';
  if (!title) throw httpError('A document title is required.');
  if (!['workspace_resource', 'external_link'].includes(sourceType)) throw httpError('Unsupported document source.');
  const category = documentCategories.has(payload.category) ? payload.category : 'other';
  const database = openDatabase();
  try {
    const study = studyRow(database, studyId); if (!study) return null;
    const replaces = clean(payload.replacesDocumentId, 120); const previous = replaces ? database.prepare("SELECT * FROM fundamental_study_documents WHERE id = ? AND study_id = ? AND deleted_at = ''").get(replaces, study.id) : null;
    if (sourceType === 'external_link' && !safeUrl(payload.url)) throw httpError('An external document link is required.');
    const version = previous ? Number(previous.version || 1) + 1 : 1; const timestamp = now(); const id = randomUUID();
    database.prepare('INSERT INTO fundamental_study_documents (id,study_id,requirement_id,title,category,source_type,resource_id,url,version,replaces_document_id,notes,incorporated_by,incorporated_by_name,incorporated_at,deleted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, study.id, clean(payload.requirementId, 120), title, category, sourceType, clean(payload.resourceId, 120), safeUrl(payload.url), version, previous ? previous.id : '', clean(payload.notes), clean(actor?.id, 180), actorName(actor), timestamp, '');
    addActivity(database, study.id, actor, previous ? 'document_version_added' : 'document_added', `${previous ? 'New document version' : 'Document added'}: ${title}.`, { documentId: id, requirementId: clean(payload.requirementId, 120), version });
    return publicDocument(database.prepare('SELECT * FROM fundamental_study_documents WHERE id = ?').get(id));
  } finally { database.close(); }
}

export function deleteFundamentalStudyDocument(documentId, actor) {
  const database = openDatabase();
  try {
    const current = database.prepare("SELECT * FROM fundamental_study_documents WHERE id = ? AND deleted_at = ''").get(clean(documentId, 120));
    if (!current) return false;
    database.prepare('UPDATE fundamental_study_documents SET deleted_at = ? WHERE id = ?').run(now(), current.id);
    addActivity(database, current.study_id, actor, 'document_deleted', `Document removed: ${current.title}.`, { documentId: current.id });
    return true;
  } finally { database.close(); }
}

export function prepareFundamentalStudyAgent(studyId, payload = {}, actor, agentStatus) {
  const database = openDatabase();
  try {
    const study = studyRow(database, studyId); if (!study) return null;
    const state = agentStatus?.configured ? 'queued_human_review' : 'blocked_pending_configuration';
    const summary = agentStatus?.configured ? 'Agent task prepared; human approval is required before any portal action.' : 'Agent task blocked because Universal Master RPA is not configured and verified.';
    addActivity(database, study.id, actor, 'agent_task', summary, { task: clean(payload.task, 160), state, requiresHumanApproval: true, agent: clean(payload.agent, 80) || 'research-opportunity-reviewer' });
    return { state, requiresHumanApproval: true, message: summary, agentStatus };
  } finally { database.close(); }
}
