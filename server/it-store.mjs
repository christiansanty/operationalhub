import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { applicationCatalog } from '../src/data/applicationCatalog.js';
import { recordAccessAuditEvent } from './access-store.mjs';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const privateRoot = path.dirname(databasePath);
const now = () => new Date().toISOString();
const clean = (value, max = 240) => String(value ?? '').trim().slice(0, max);
const nullable = (value, max = 240) => clean(value, max) || null;
const parseJson = (value, fallback = []) => { try { return JSON.parse(value || '') } catch { return fallback } };
const json = value => JSON.stringify(Array.isArray(value) ? value : []);

export const integrationStates = ['REGISTERED', 'CONFIGURED', 'CONNECTOR_CONFIGURED', 'LOCAL_VERIFIED', 'SANDBOX_VERIFIED', 'LIVE_VERIFIED'];
export const monitoringStates = ['NOT_CONNECTED', 'CONFIGURED', 'MONITORING_VERIFIED'];
export const roadmapStatuses = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
export const proposalStatuses = ['SUBMITTED', 'IN_REVIEW', 'ACCEPTED', 'PLANNED', 'IN_PROGRESS', 'DECLINED', 'COMPLETED'];
export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const proposalCategories = ['ERROR', 'IMPROVEMENT', 'NEW_FEATURE', 'INTEGRATION', 'OTHER'];

const universalCatalog = [
  { id: 'universal', name: 'Universal', description: { en: 'Coordination and monitoring plane. Connector status must be verified before use.', es: 'Plano de coordinación y monitoreo. El estado del conector debe verificarse antes de usarlo.' }, envKey: 'UNIVERSAL_BASE_URL', source: 'Universal catalog' },
  { id: 'operational-hub', name: 'Operational Hub', description: { en: 'Central operational workspace for internal teams.', es: 'Espacio central de operaciones para los equipos internos.' }, envKey: 'OPERATIONAL_HUB_URL', source: 'IT catalog' },
  { id: 'binium', name: 'Binium', description: { en: 'Binium operational application and connected workflow workspace.', es: 'Aplicación operativa Binium y espacio de flujos conectados.' }, envKey: 'BINIUM_URL', source: 'IT catalog' },
];

const retiredCatalogIds = ['art-rpa', 'medical-rpa', 'operational-help'];

function validUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch { return ''; }
}

function catalogEntries() {
  return [...applicationCatalog.map(item => ({ ...item, source: 'Operational Hub application registry' })), ...universalCatalog]
    .map(item => ({
      ...item,
      accessUrl: validUrl(process.env[item.envKey]),
      repository: clean(process.env[`IT_REPOSITORY_${item.id.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`], 500),
    }));
}

function openDatabase() {
  mkdirSync(privateRoot, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS it_applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description_json TEXT NOT NULL,
      source TEXT NOT NULL,
      access_url TEXT,
      repository TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS it_roadmap_items (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES it_applications(id) ON DELETE CASCADE,
      phase TEXT NOT NULL,
      priority TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      owner TEXT,
      due_at TEXT,
      milestones_json TEXT NOT NULL,
      dependencies_json TEXT NOT NULL,
      blockers_json TEXT NOT NULL,
      next_actions_json TEXT NOT NULL,
      integration_state TEXT NOT NULL,
      monitoring_state TEXT NOT NULL,
      last_verified_at TEXT,
      evidence_reference TEXT,
      evidence_source TEXT,
      evidence_note TEXT,
      planned_environments_json TEXT NOT NULL DEFAULT '[]',
      verified_environments_json TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(application_id)
    );
    CREATE INDEX IF NOT EXISTS idx_it_roadmap_filters ON it_roadmap_items(application_id, owner, phase, priority, status);
    CREATE TABLE IF NOT EXISTS it_roadmap_history (
      id TEXT PRIMARY KEY,
      roadmap_id TEXT NOT NULL REFERENCES it_roadmap_items(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL,
      changed_fields_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS it_proposals (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES it_applications(id),
      submitter_id TEXT NOT NULL,
      submitter_name TEXT NOT NULL,
      submitter_email TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      expected_outcome TEXT NOT NULL,
      impact TEXT NOT NULL,
      suggested_priority TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT,
      it_comment TEXT,
      decline_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_it_proposals_submitter ON it_proposals(submitter_id, created_at);
    CREATE TABLE IF NOT EXISTS it_proposal_history (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL REFERENCES it_proposals(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL,
      changed_fields_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  for (const statement of [
    "ALTER TABLE it_roadmap_items ADD COLUMN planned_environments_json TEXT NOT NULL DEFAULT '[]'",
    "ALTER TABLE it_roadmap_items ADD COLUMN verified_environments_json TEXT NOT NULL DEFAULT '[]'",
  ]) { try { database.exec(statement); } catch {} }
  ensureCatalog(database);
  return database;
}

function ensureCatalog(database) {
  for (const applicationId of retiredCatalogIds) {
    database.prepare('DELETE FROM it_proposal_history WHERE proposal_id IN (SELECT id FROM it_proposals WHERE application_id = ?)').run(applicationId);
    database.prepare('DELETE FROM it_proposals WHERE application_id = ?').run(applicationId);
    database.prepare('DELETE FROM it_roadmap_history WHERE roadmap_id IN (SELECT id FROM it_roadmap_items WHERE application_id = ?)').run(applicationId);
    database.prepare('DELETE FROM it_roadmap_items WHERE application_id = ?').run(applicationId);
    database.prepare('DELETE FROM it_applications WHERE id = ?').run(applicationId);
  }
  const entries = catalogEntries();
  const timestamp = now();
  entries.forEach((entry, index) => {
    database.prepare(`INSERT OR IGNORE INTO it_applications (id,name,description_json,source,access_url,repository,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(entry.id, entry.name, JSON.stringify(entry.description), entry.source, entry.accessUrl || null, entry.repository || null, timestamp, timestamp);
    const application = database.prepare('SELECT id FROM it_applications WHERE id = ?').get(entry.id);
    database.prepare(`INSERT OR IGNORE INTO it_roadmap_items (id,application_id,phase,priority,progress,status,owner,due_at,milestones_json,dependencies_json,blockers_json,next_actions_json,integration_state,monitoring_state,last_verified_at,evidence_reference,evidence_source,evidence_note,planned_environments_json,verified_environments_json,sort_order,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(randomUUID(), application.id, 'Registered', 'MEDIUM', 0, 'NOT_STARTED', null, null, '[]', '[]', '[]', '[]', 'REGISTERED', 'NOT_CONNECTED', null, null, null, 'No verification evidence recorded.', '[]', '[]', index, 'system:catalog', timestamp, timestamp);
  });
}

function safeText(value, max, required = true) {
  const text = clean(value, max);
  if (required && !text) { const error = new Error('Required text is missing.'); error.statusCode = 400; throw error; }
  if (/(patient|phi|protected health|password|passcode|secret|token|api[_ -]?key|ssn|social security|date of birth|dob|medical record|mrn)/i.test(text)) {
    const error = new Error('Remove patient, PHI, credential or other confidential information before saving.'); error.statusCode = 400; throw error;
  }
  return text;
}

function safeOptional(value, max) { return value === undefined ? undefined : safeText(value, max, false); }
function enumValue(value, allowed, fallback) {
  const normalized = clean(value, 80).toUpperCase() || fallback;
  if (!allowed.includes(normalized)) { const error = new Error('Invalid IT value.'); error.statusCode = 400; throw error; }
  return normalized;
}
function arrayValue(value, maxItems = 20) {
  const values = Array.isArray(value) ? value.slice(0, maxItems) : [];
  return values.map(item => safeText(item, 240));
}
function audit(actorId, action, targetId, details = {}) { recordAccessAuditEvent(actorId, action, targetId, details); }

function publicApplication(row) {
  return { id: row.id, name: row.name, description: parseJson(row.description_json, {}), source: row.source, accessUrl: row.access_url || '', repository: row.repository || '', configured: Boolean(row.access_url), createdAt: row.created_at, updatedAt: row.updated_at };
}

function publicRoadmap(row) {
  const overdue = Boolean(row.due_at && new Date(row.due_at).getTime() < Date.now() && row.status !== 'COMPLETED');
  const noEvidence = !row.last_verified_at;
  return {
    id: row.id, applicationId: row.application_id, applicationName: row.application_name, applicationSource: row.application_source, createdAt: row.created_at,
    accessUrl: row.access_url || '', repository: row.repository || '', phase: row.phase, priority: row.priority, progress: row.progress,
    status: row.status, owner: row.owner || '', dueAt: row.due_at || '', milestones: parseJson(row.milestones_json), dependencies: parseJson(row.dependencies_json), blockers: parseJson(row.blockers_json), nextActions: parseJson(row.next_actions_json),
    integrationState: row.integration_state, monitoringState: row.monitoring_state, lastVerifiedAt: row.last_verified_at || '', evidence: { reference: row.evidence_reference || '', source: row.evidence_source || '', note: row.evidence_note || '' }, plannedEnvironments: parseJson(row.planned_environments_json), verifiedEnvironments: parseJson(row.verified_environments_json),
    attention: { blocked: row.status === 'BLOCKED', overdue, noRecentEvidence: noEvidence }, sortOrder: row.sort_order, updatedAt: row.updated_at,
  };
}

function roadmapRow(database, id) {
  return database.prepare(`SELECT r.*, a.name AS application_name, a.source AS application_source, a.access_url, a.repository FROM it_roadmap_items r JOIN it_applications a ON a.id = r.application_id WHERE r.id = ?`).get(id);
}

export function listItApplications() {
  const database = openDatabase();
  try { return database.prepare('SELECT * FROM it_applications ORDER BY name').all().map(publicApplication); }
  finally { database.close(); }
}

export function listItRoadmap(filters = {}) {
  const database = openDatabase();
  try {
    let rows = database.prepare('SELECT r.*, a.name AS application_name, a.source AS application_source, a.access_url, a.repository FROM it_roadmap_items r JOIN it_applications a ON a.id = r.application_id ORDER BY r.sort_order, a.name').all();
    const query = clean(filters.query, 160).toLowerCase();
    rows = rows.filter(row => (!filters.applicationId || row.application_id === filters.applicationId) && (!filters.owner || row.owner === filters.owner) && (!filters.phase || row.phase === filters.phase) && (!filters.priority || row.priority === filters.priority) && (!filters.status || row.status === filters.status) && (!filters.integrationState || row.integration_state === filters.integrationState) && (!query || `${row.application_name} ${row.phase} ${row.owner || ''} ${row.evidence_note || ''}`.toLowerCase().includes(query)));
    return rows.map(publicRoadmap);
  } finally { database.close(); }
}

function roadmapPayload(payload, current = {}) {
  const values = {
    phase: payload.phase === undefined ? current.phase || 'Registered' : safeText(payload.phase, 120),
    priority: payload.priority === undefined ? current.priority || 'MEDIUM' : enumValue(payload.priority, priorities, 'MEDIUM'),
    progress: payload.progress === undefined ? Number(current.progress || 0) : Math.max(0, Math.min(100, Number(payload.progress) || 0)),
    status: payload.status === undefined ? current.status || 'NOT_STARTED' : enumValue(payload.status, roadmapStatuses, 'NOT_STARTED'),
    owner: payload.owner === undefined ? current.owner || null : nullable(safeText(payload.owner, 160, false), 160),
    dueAt: payload.dueAt === undefined ? current.due_at || null : nullable(safeText(payload.dueAt, 80, false), 80),
    milestones: payload.milestones === undefined ? parseJson(current.milestones_json) : arrayValue(payload.milestones),
    dependencies: payload.dependencies === undefined ? parseJson(current.dependencies_json) : arrayValue(payload.dependencies),
    blockers: payload.blockers === undefined ? parseJson(current.blockers_json) : arrayValue(payload.blockers),
    nextActions: payload.nextActions === undefined ? parseJson(current.next_actions_json) : arrayValue(payload.nextActions),
    integrationState: payload.integrationState === undefined ? current.integration_state || 'REGISTERED' : enumValue(payload.integrationState, integrationStates, 'REGISTERED'),
    monitoringState: payload.monitoringState === undefined ? current.monitoring_state || 'NOT_CONNECTED' : enumValue(payload.monitoringState, monitoringStates, 'NOT_CONNECTED'),
    lastVerifiedAt: payload.lastVerifiedAt === undefined ? current.last_verified_at || null : nullable(safeText(payload.lastVerifiedAt, 80, false), 80),
    evidenceReference: payload.evidenceReference === undefined ? current.evidence_reference || null : nullable(safeText(payload.evidenceReference, 500, false), 500),
    evidenceSource: payload.evidenceSource === undefined ? current.evidence_source || null : nullable(safeText(payload.evidenceSource, 160, false), 160),
    evidenceNote: payload.evidenceNote === undefined ? current.evidence_note || null : nullable(safeText(payload.evidenceNote, 1000, false), 1000),
    plannedEnvironments: payload.plannedEnvironments === undefined ? parseJson(current.planned_environments_json) : arrayValue(payload.plannedEnvironments),
    verifiedEnvironments: payload.verifiedEnvironments === undefined ? parseJson(current.verified_environments_json) : arrayValue(payload.verifiedEnvironments),
    sortOrder: payload.sortOrder === undefined ? Number(current.sort_order || 0) : Math.max(0, Math.min(100000, Number(payload.sortOrder) || 0)),
  };
  if (['LOCAL_VERIFIED', 'SANDBOX_VERIFIED', 'LIVE_VERIFIED'].includes(values.integrationState) && (!values.lastVerifiedAt || (!values.evidenceReference && !values.evidenceSource && !values.evidenceNote))) {
    const error = new Error('A verified integration state requires a verification timestamp and evidence.'); error.statusCode = 400; throw error;
  }
  if (values.monitoringState === 'MONITORING_VERIFIED' && (!values.lastVerifiedAt || (!values.evidenceReference && !values.evidenceSource && !values.evidenceNote))) {
    const error = new Error('Verified monitoring requires a verification timestamp and evidence.'); error.statusCode = 400; throw error;
  }
  return values;
}

export function createItRoadmap(payload, actorId) {
  const applicationId = safeText(payload.applicationId, 120);
  const database = openDatabase();
  try {
    if (!database.prepare('SELECT id FROM it_applications WHERE id = ?').get(applicationId)) { const error = new Error('Application is not registered in the IT catalog.'); error.statusCode = 404; throw error; }
    const existing = database.prepare('SELECT id FROM it_roadmap_items WHERE application_id = ?').get(applicationId);
    if (existing) { const error = new Error('This application already has a roadmap record.'); error.statusCode = 409; throw error; }
    const values = roadmapPayload(payload);
    const id = randomUUID(); const timestamp = now();
    database.prepare('INSERT INTO it_roadmap_items (id,application_id,phase,priority,progress,status,owner,due_at,milestones_json,dependencies_json,blockers_json,next_actions_json,integration_state,monitoring_state,last_verified_at,evidence_reference,evidence_source,evidence_note,planned_environments_json,verified_environments_json,sort_order,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, applicationId, values.phase, values.priority, values.progress, values.status, values.owner, values.dueAt, json(values.milestones), json(values.dependencies), json(values.blockers), json(values.nextActions), values.integrationState, values.monitoringState, values.lastVerifiedAt, values.evidenceReference, values.evidenceSource, values.evidenceNote, json(values.plannedEnvironments), json(values.verifiedEnvironments), values.sortOrder, actorId, timestamp, timestamp);
    audit(actorId, 'it_roadmap_created', id, { applicationId, changedFields: Object.keys(values) });
    return publicRoadmap(roadmapRow(database, id));
  } finally { database.close(); }
}

export function updateItRoadmap(id, payload, actorId) {
  const database = openDatabase();
  try {
    const current = roadmapRow(database, id);
    if (!current) { const error = new Error('IT roadmap item not found.'); error.statusCode = 404; throw error; }
    const values = roadmapPayload(payload, current);
    const changedFields = Object.keys(values).filter(key => JSON.stringify(values[key]) !== JSON.stringify(key === 'milestones' ? parseJson(current.milestones_json) : key === 'dependencies' ? parseJson(current.dependencies_json) : key === 'blockers' ? parseJson(current.blockers_json) : key === 'nextActions' ? parseJson(current.next_actions_json) : key === 'plannedEnvironments' ? parseJson(current.planned_environments_json) : key === 'verifiedEnvironments' ? parseJson(current.verified_environments_json) : key === 'dueAt' ? current.due_at || null : key === 'lastVerifiedAt' ? current.last_verified_at || null : key === 'evidenceReference' ? current.evidence_reference || null : key === 'evidenceSource' ? current.evidence_source || null : key === 'evidenceNote' ? current.evidence_note || null : key === 'sortOrder' ? current.sort_order : key === 'integrationState' ? current.integration_state : key === 'monitoringState' ? current.monitoring_state : key === 'owner' ? current.owner || null : current[key]));
    const timestamp = now();
    database.prepare('UPDATE it_roadmap_items SET phase=?,priority=?,progress=?,status=?,owner=?,due_at=?,milestones_json=?,dependencies_json=?,blockers_json=?,next_actions_json=?,integration_state=?,monitoring_state=?,last_verified_at=?,evidence_reference=?,evidence_source=?,evidence_note=?,planned_environments_json=?,verified_environments_json=?,sort_order=?,updated_at=? WHERE id=?')
      .run(values.phase, values.priority, values.progress, values.status, values.owner, values.dueAt, json(values.milestones), json(values.dependencies), json(values.blockers), json(values.nextActions), values.integrationState, values.monitoringState, values.lastVerifiedAt, values.evidenceReference, values.evidenceSource, values.evidenceNote, json(values.plannedEnvironments), json(values.verifiedEnvironments), values.sortOrder, timestamp, id);
    database.prepare('INSERT INTO it_roadmap_history (id,roadmap_id,actor_id,changed_fields_json,created_at) VALUES (?,?,?,?,?)').run(randomUUID(), id, actorId, JSON.stringify(changedFields), timestamp);
    audit(actorId, 'it_roadmap_updated', id, { changedFields, status: values.status, integrationState: values.integrationState });
    return publicRoadmap(roadmapRow(database, id));
  } finally { database.close(); }
}

function publicProposal(row, includeContact = false) {
  const result = { id: row.id, applicationId: row.application_id, applicationName: row.application_name, title: row.title, description: row.description, expectedOutcome: row.expected_outcome, impact: row.impact, suggestedPriority: row.suggested_priority, category: row.category, status: row.status, assignedTo: row.assigned_to || '', itComment: row.it_comment || '', declineReason: row.decline_reason || '', createdAt: row.created_at, updatedAt: row.updated_at };
  if (includeContact) result.submitter = { id: row.submitter_id, name: row.submitter_name, email: row.submitter_email };
  return result;
}

function proposalRow(database, id, actorId, fullAccess) {
  return database.prepare(`SELECT p.*, a.name AS application_name FROM it_proposals p JOIN it_applications a ON a.id = p.application_id WHERE p.id = ? AND (? = 1 OR p.submitter_id = ?)`)
    .get(id, fullAccess ? 1 : 0, actorId);
}

export function listItProposals({ actorId, fullAccess = false } = {}) {
  const database = openDatabase();
  try {
    return database.prepare(`SELECT p.*, a.name AS application_name FROM it_proposals p JOIN it_applications a ON a.id = p.application_id WHERE (? = 1 OR p.submitter_id = ?) ORDER BY p.updated_at DESC`).all(fullAccess ? 1 : 0, actorId || '').map(row => publicProposal(row, fullAccess));
  } finally { database.close(); }
}

export function getItProposal(id, { actorId, fullAccess = false } = {}) {
  const database = openDatabase();
  try { const row = proposalRow(database, id, actorId || '', fullAccess); return row ? publicProposal(row, fullAccess) : null; }
  finally { database.close(); }
}

export function createItProposal(payload, actor) {
  const applicationId = safeText(payload.applicationId, 120);
  const title = safeText(payload.title, 200);
  const description = safeText(payload.description, 3000);
  const expectedOutcome = safeText(payload.expectedOutcome, 2000);
  const impact = safeText(payload.impact, 1600);
  const suggestedPriority = enumValue(payload.suggestedPriority, priorities, 'MEDIUM');
  const category = enumValue(payload.category, proposalCategories, 'OTHER');
  const database = openDatabase();
  try {
    if (!database.prepare('SELECT id FROM it_applications WHERE id = ?').get(applicationId)) { const error = new Error('Application is not registered in the IT catalog.'); error.statusCode = 404; throw error; }
    const id = randomUUID(); const timestamp = now();
    database.prepare('INSERT INTO it_proposals (id,application_id,submitter_id,submitter_name,submitter_email,title,description,expected_outcome,impact,suggested_priority,category,status,assigned_to,it_comment,decline_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, applicationId, actor.id, safeText(actor.name, 160), safeText(actor.email, 320), title, description, expectedOutcome, impact, suggestedPriority, category, 'SUBMITTED', null, null, null, timestamp, timestamp);
    database.prepare('INSERT INTO it_proposal_history (id,proposal_id,actor_id,changed_fields_json,created_at) VALUES (?,?,?,?,?)').run(randomUUID(), id, actor.id, JSON.stringify(['created']), timestamp);
    audit(actor.id, 'it_proposal_created', id, { applicationId, category, suggestedPriority });
    return publicProposal(proposalRow(database, id, actor.id, true), false);
  } finally { database.close(); }
}

export function updateItProposal(id, payload, actorId) {
  const database = openDatabase();
  try {
    const current = proposalRow(database, id, actorId, true);
    if (!current) { const error = new Error('IT proposal not found.'); error.statusCode = 404; throw error; }
    const status = payload.status === undefined ? current.status : enumValue(payload.status, proposalStatuses, 'SUBMITTED');
    const suggestedPriority = payload.suggestedPriority === undefined ? current.suggested_priority : enumValue(payload.suggestedPriority, priorities, 'MEDIUM');
    const category = payload.category === undefined ? current.category : enumValue(payload.category, proposalCategories, 'OTHER');
    const assignedTo = payload.assignedTo === undefined ? current.assigned_to : nullable(safeText(payload.assignedTo, 160, false), 160);
    const itComment = payload.itComment === undefined ? current.it_comment : nullable(safeText(payload.itComment, 2000, false), 2000);
    const declineReason = payload.declineReason === undefined ? current.decline_reason : nullable(safeText(payload.declineReason, 1600, false), 1600);
    if (status === 'DECLINED' && !declineReason) { const error = new Error('A decline explanation is required.'); error.statusCode = 400; throw error; }
    const changedFields = [];
    if (status !== current.status) changedFields.push('status');
    if (suggestedPriority !== current.suggested_priority) changedFields.push('suggestedPriority');
    if (category !== current.category) changedFields.push('category');
    if (assignedTo !== current.assigned_to) changedFields.push('assignedTo');
    if (itComment !== current.it_comment) changedFields.push('itComment');
    if (declineReason !== current.decline_reason) changedFields.push('declineReason');
    const timestamp = now();
    database.prepare('UPDATE it_proposals SET suggested_priority=?,category=?,status=?,assigned_to=?,it_comment=?,decline_reason=?,updated_at=? WHERE id=?').run(suggestedPriority, category, status, assignedTo, itComment, declineReason, timestamp, id);
    database.prepare('INSERT INTO it_proposal_history (id,proposal_id,actor_id,changed_fields_json,created_at) VALUES (?,?,?,?,?)').run(randomUUID(), id, actorId, JSON.stringify(changedFields), timestamp);
    audit(actorId, 'it_proposal_updated', id, { changedFields, status });
    return publicProposal(proposalRow(database, id, actorId, true), true);
  } finally { database.close(); }
}
