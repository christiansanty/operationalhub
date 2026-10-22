import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { recordAccessAuditEvent } from './access-store.mjs';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const privateRoot = path.dirname(databasePath);
const entityKey = 'research';
const allowedLeadStatuses = new Set(['pending', 'contact_pending', 'contacted', 'requires_review', 'prescreening_blocked', 'closed']);
const allowedStudyStatuses = new Set(['draft', 'pending_activation', 'active', 'paused', 'closed']);
const allowedApprovalStatuses = new Set(['pending', 'verified', 'blocked', 'requires_review']);
const allowedAssignmentRoles = new Set(['pi', 'coordinator', 'monitor', 'data_manager']);
const allowedAgreementTypes = new Set(['clinical_trial_agreement', 'budget_agreement', 'vendor_agreement', 'site_agreement', 'other']);
const allowedAgreementStatuses = new Set(['draft', 'review', 'approved', 'executed', 'expired', 'blocked']);

const now = () => new Date().toISOString();
const clean = (value, max = 240) => String(value ?? '').trim().slice(0, max);
const nullable = (value, max = 240) => {
  const result = clean(value, max);
  return result || null;
};
const parseJson = (value, fallback = {}) => { try { return JSON.parse(value || '') } catch { return fallback } };

function openDatabase() {
  mkdirSync(privateRoot, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS research_leads (
      id TEXT PRIMARY KEY,
      entity_key TEXT NOT NULL CHECK (entity_key = 'research'),
      source_system TEXT NOT NULL,
      source_record_id TEXT NOT NULL,
      source_event_id TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      source_label TEXT,
      status TEXT NOT NULL,
      assigned_user_id TEXT,
      study_id TEXT,
      next_action TEXT,
      follow_up_at TEXT,
      source_updated_at TEXT,
      last_synced_at TEXT,
      sync_state TEXT NOT NULL,
      sync_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE(source_system, source_record_id)
    );
    CREATE INDEX IF NOT EXISTS idx_research_leads_scope ON research_leads(entity_key, assigned_user_id, status);
    CREATE TABLE IF NOT EXISTS research_followups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES research_leads(id) ON DELETE CASCADE,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      summary TEXT,
      next_action TEXT,
      follow_up_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_research_followups_lead ON research_followups(lead_id, created_at);
    CREATE TABLE IF NOT EXISTS research_studies (
      id TEXT PRIMARY KEY,
      entity_key TEXT NOT NULL CHECK (entity_key = 'research'),
      study_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      sponsor_name TEXT,
      status TEXT NOT NULL,
      irb_status TEXT NOT NULL,
      sponsor_status TEXT NOT NULL,
      activation_status TEXT NOT NULL,
      current_protocol_version TEXT,
      verification_note TEXT,
      verified_by TEXT,
      verified_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS research_agreements (
      id TEXT PRIMARY KEY,
      entity_key TEXT NOT NULL CHECK (entity_key = 'research'),
      study_id TEXT NOT NULL REFERENCES research_studies(id) ON DELETE CASCADE,
      agreement_type TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      status TEXT NOT NULL,
      effective_at TEXT,
      source_reference TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_research_agreements_scope ON research_agreements(entity_key, study_id, status);
    CREATE TABLE IF NOT EXISTS research_protocol_versions (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES research_studies(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      effective_at TEXT,
      irb_status TEXT NOT NULL,
      sponsor_status TEXT NOT NULL,
      source_reference TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(study_id, version)
    );
    CREATE TABLE IF NOT EXISTS research_study_assignments (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES research_studies(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      assignment_role TEXT NOT NULL,
      training_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(study_id, user_id, assignment_role)
    );
    CREATE INDEX IF NOT EXISTS idx_research_assignments_user ON research_study_assignments(user_id, study_id);
    CREATE TABLE IF NOT EXISTS research_screenings (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES research_studies(id) ON DELETE CASCADE,
      participant_ref TEXT NOT NULL,
      status TEXT NOT NULL,
      consent_status TEXT NOT NULL,
      consent_version TEXT,
      consent_at TEXT,
      consent_by TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(study_id, participant_ref)
    );
    CREATE TABLE IF NOT EXISTS research_safety_events (
      id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL REFERENCES research_studies(id) ON DELETE CASCADE,
      participant_ref TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      reported_at TEXT,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS research_outbox (
      id TEXT PRIMARY KEY,
      entity_key TEXT NOT NULL CHECK (entity_key = 'research'),
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_research_outbox_status ON research_outbox(status, updated_at);
    CREATE TABLE IF NOT EXISTS research_integration_events (
      id TEXT PRIMARY KEY,
      source_system TEXT NOT NULL,
      source_event_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      lead_id TEXT,
      state TEXT NOT NULL,
      error_code TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(source_system, source_event_id)
    );
  `);
  return database;
}

function requireLeadStatus(status) {
  const normalized = clean(status, 60) || 'pending';
  if (!allowedLeadStatuses.has(normalized)) {
    const error = new Error('Invalid Research lead status.'); error.statusCode = 400; throw error;
  }
  return normalized;
}

function requireStudyStatus(status) {
  const normalized = clean(status, 60) || 'draft';
  if (!allowedStudyStatuses.has(normalized)) {
    const error = new Error('Invalid Research study status.'); error.statusCode = 400; throw error;
  }
  return normalized;
}

function requireApprovalStatus(status) {
  const normalized = clean(status, 60) || 'pending';
  if (!allowedApprovalStatuses.has(normalized)) {
    const error = new Error('Invalid Research approval status.'); error.statusCode = 400; throw error;
  }
  return normalized;
}

function requireAssignmentRole(role) {
  const normalized = clean(role, 40).toLowerCase();
  if (!allowedAssignmentRoles.has(normalized)) {
    const error = new Error('A valid Research study assignment role is required.'); error.statusCode = 400; throw error;
  }
  return normalized;
}

function requireAgreementType(type) {
  const normalized = clean(type, 80).toLowerCase() || 'other';
  if (!allowedAgreementTypes.has(normalized)) {
    const error = new Error('Invalid Research agreement type.'); error.statusCode = 400; throw error;
  }
  return normalized;
}

function requireAgreementStatus(status) {
  const normalized = clean(status, 60).toLowerCase() || 'draft';
  if (!allowedAgreementStatuses.has(normalized)) {
    const error = new Error('Invalid Research agreement status.'); error.statusCode = 400; throw error;
  }
  return normalized;
}

function audit(actorId, action, targetId, details = {}) {
  recordAccessAuditEvent(actorId, action, targetId, details);
}

function leadScope(database, leadId, actorId, canManage) {
  return database.prepare(`SELECT * FROM research_leads WHERE id = ? AND entity_key = 'research' AND deleted_at IS NULL AND (? = 1 OR assigned_user_id = ?)`).get(leadId, canManage ? 1 : 0, actorId);
}

function studyScope(database, studyId, actorId, canManage) {
  return database.prepare(`
    SELECT s.* FROM research_studies s
    WHERE s.id = ? AND s.entity_key = 'research'
      AND (? = 1 OR EXISTS (SELECT 1 FROM research_study_assignments a WHERE a.study_id = s.id AND a.user_id = ?))
  `).get(studyId, canManage ? 1 : 0, actorId);
}

function agreementScope(database, agreementId, actorId, canManage) {
  return database.prepare(`
    SELECT a.*, s.study_code, s.title AS study_title
    FROM research_agreements a
    JOIN research_studies s ON s.id = a.study_id
    WHERE a.id = ? AND a.entity_key = 'research'
      AND (? = 1 OR EXISTS (SELECT 1 FROM research_study_assignments sa WHERE sa.study_id = a.study_id AND sa.user_id = ?))
  `).get(agreementId, canManage ? 1 : 0, actorId);
}

function publicLead(row, includeContact = false) {
  const result = {
    id: row.id,
    entityKey: row.entity_key,
    sourceSystem: row.source_system,
    sourceRecordId: row.source_record_id,
    sourceLabel: row.source_label || '',
    status: row.status,
    assignedUserId: row.assigned_user_id || '',
    studyId: row.study_id || '',
    nextAction: row.next_action || '',
    followUpAt: row.follow_up_at || '',
    sourceUpdatedAt: row.source_updated_at || '',
    lastSyncedAt: row.last_synced_at || '',
    syncState: row.sync_state,
    syncError: row.sync_error || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeContact) Object.assign(result, {
    firstName: row.first_name || '', lastName: row.last_name || '', email: row.email || '', phone: row.phone || '',
  });
  return result;
}

function publicStudy(row, database, actorId, includeAssignments = false) {
  const result = {
    id: row.id,
    entityKey: row.entity_key,
    studyCode: row.study_code,
    title: row.title,
    sponsorName: row.sponsor_name || '',
    status: row.status,
    irbStatus: row.irb_status,
    sponsorStatus: row.sponsor_status,
    activationStatus: row.activation_status,
    currentProtocolVersion: row.current_protocol_version || '',
    verificationNote: row.verification_note || '',
    verifiedBy: row.verified_by || '',
    verifiedAt: row.verified_at || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeAssignments) result.assignments = database.prepare('SELECT user_id AS userId, assignment_role AS assignmentRole, training_status AS trainingStatus FROM research_study_assignments WHERE study_id = ? ORDER BY assignment_role, user_id').all(row.id);
  result.assignment = database.prepare('SELECT assignment_role AS assignmentRole, training_status AS trainingStatus FROM research_study_assignments WHERE study_id = ? AND user_id = ? ORDER BY assignment_role LIMIT 1').get(row.id, actorId) || null;
  return result;
}

function publicResearchAgreement(row) {
  return {
    id: row.id,
    entityKey: row.entity_key,
    studyId: row.study_id,
    studyCode: row.study_code || '',
    studyTitle: row.study_title || '',
    agreementType: row.agreement_type,
    counterparty: row.counterparty,
    status: row.status,
    effectiveAt: row.effective_at || '',
    sourceReference: row.source_reference || '',
    notes: row.notes || '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getResearchStatus() {
  const database = openDatabase();
  try {
    return {
      entityKey,
      leads: database.prepare("SELECT COUNT(*) AS count FROM research_leads WHERE deleted_at IS NULL").get().count,
      studies: database.prepare('SELECT COUNT(*) AS count FROM research_studies').get().count,
      agreements: database.prepare('SELECT COUNT(*) AS count FROM research_agreements').get().count,
      pendingOutbox: database.prepare("SELECT COUNT(*) AS count FROM research_outbox WHERE status IN ('pending_external_contract','retryable_error')").get().count,
      integrationEvents: database.prepare('SELECT COUNT(*) AS count FROM research_integration_events').get().count,
    };
  } finally { database.close() }
}

export function listResearchLeads({ actorId, canManage = false, includeContact = false } = {}) {
  const database = openDatabase();
  try {
    return database.prepare(`SELECT * FROM research_leads WHERE entity_key = 'research' AND deleted_at IS NULL AND (? = 1 OR assigned_user_id = ?) ORDER BY CASE WHEN status = 'closed' THEN 1 ELSE 0 END, COALESCE(follow_up_at, '9999-12-31'), updated_at DESC`).all(canManage ? 1 : 0, actorId || '').map(row => publicLead(row, includeContact));
  } finally { database.close() }
}

export function getResearchLead(leadId, { actorId, canManage = false, includeContact = false } = {}) {
  const database = openDatabase();
  try {
    const row = leadScope(database, leadId, actorId || '', canManage);
    return row ? publicLead(row, includeContact) : null;
  } finally { database.close() }
}

export function createResearchLead(payload, actorId) {
  const sourceSystem = clean(payload.sourceSystem, 80) || 'operational-hub';
  const sourceRecordId = clean(payload.sourceRecordId, 240) || randomUUID();
  const timestamp = now();
  const lead = {
    id: randomUUID(), entityKey, sourceSystem, sourceRecordId,
    firstName: nullable(payload.firstName, 120), lastName: nullable(payload.lastName, 120),
    email: nullable(payload.email, 320), phone: nullable(payload.phone, 80),
    sourceLabel: nullable(payload.sourceLabel, 120), status: requireLeadStatus(payload.status),
    assignedUserId: nullable(payload.assignedUserId, 240), studyId: nullable(payload.studyId, 240),
    nextAction: nullable(payload.nextAction, 240), followUpAt: nullable(payload.followUpAt, 80),
    sourceUpdatedAt: nullable(payload.sourceUpdatedAt, 80), lastSyncedAt: timestamp,
    syncState: sourceSystem === 'em-connect' ? 'synced' : 'local', syncError: null,
  };
  if (!lead.firstName && !lead.lastName && !lead.email && !lead.phone) {
    const error = new Error('A Research lead requires an approved minimum contact field.'); error.statusCode = 400; throw error;
  }
  const database = openDatabase();
  try {
    const existing = database.prepare('SELECT id FROM research_leads WHERE source_system = ? AND source_record_id = ?').get(sourceSystem, sourceRecordId);
    if (existing) {
      const error = new Error('Research lead already exists for this source record.'); error.statusCode = 409; throw error;
    }
    database.prepare(`INSERT INTO research_leads (id,entity_key,source_system,source_record_id,source_event_id,first_name,last_name,email,phone,source_label,status,assigned_user_id,study_id,next_action,follow_up_at,source_updated_at,last_synced_at,sync_state,sync_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(lead.id, entityKey, lead.sourceSystem, lead.sourceRecordId, null, lead.firstName, lead.lastName, lead.email, lead.phone, lead.sourceLabel, lead.status, lead.assignedUserId, lead.studyId, lead.nextAction, lead.followUpAt, lead.sourceUpdatedAt, lead.lastSyncedAt, lead.syncState, lead.syncError, timestamp, timestamp);
    audit(actorId, 'research_lead_created', lead.id, { sourceSystem: lead.sourceSystem, sourceRecordId: lead.sourceRecordId });
    return publicLead(database.prepare('SELECT * FROM research_leads WHERE id = ?').get(lead.id), true);
  } finally { database.close() }
}

export function updateResearchLead(leadId, payload, { actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const row = leadScope(database, leadId, actorId || '', canManage);
    if (!row) { const error = new Error('Research lead not found.'); error.statusCode = 404; throw error; }
    const status = payload.status === undefined ? row.status : requireLeadStatus(payload.status);
    const assignedUserId = payload.assignedUserId === undefined ? row.assigned_user_id : nullable(payload.assignedUserId, 240);
    const studyId = payload.studyId === undefined ? row.study_id : nullable(payload.studyId, 240);
    const nextAction = payload.nextAction === undefined ? row.next_action : nullable(payload.nextAction, 240);
    const followUpAt = payload.followUpAt === undefined ? row.follow_up_at : nullable(payload.followUpAt, 80);
    const timestamp = now();
    database.prepare('UPDATE research_leads SET status = ?, assigned_user_id = ?, study_id = ?, next_action = ?, follow_up_at = ?, updated_at = ? WHERE id = ?')
      .run(status, assignedUserId, studyId, nextAction, followUpAt, timestamp, leadId);
    database.prepare(`INSERT INTO research_outbox (id,entity_key,resource_type,resource_id,action,status,attempts,last_error,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(randomUUID(), entityKey, 'lead', leadId, 'lead.followup.updated', 'pending_external_contract', 0, 'EM Connect outbound update contract is not available for Research.', actorId, timestamp, timestamp);
    audit(actorId, 'research_lead_updated', leadId, { status, hasFollowUp: Boolean(nextAction || followUpAt) });
    return publicLead(database.prepare('SELECT * FROM research_leads WHERE id = ?').get(leadId), true);
  } finally { database.close() }
}

export function createResearchFollowup(leadId, payload, { actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const row = leadScope(database, leadId, actorId || '', canManage);
    if (!row) { const error = new Error('Research lead not found.'); error.statusCode = 404; throw error; }
    const summary = nullable(payload.summary, 500);
    const action = clean(payload.action, 80) || 'follow_up';
    const nextAction = nullable(payload.nextAction, 240);
    const followUpAt = nullable(payload.followUpAt, 80);
    const timestamp = now();
    database.prepare('INSERT INTO research_followups (id,lead_id,actor_id,action,summary,next_action,follow_up_at,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(randomUUID(), leadId, actorId, action, summary, nextAction, followUpAt, timestamp);
    database.prepare('UPDATE research_leads SET next_action = ?, follow_up_at = ?, updated_at = ? WHERE id = ?')
      .run(nextAction, followUpAt, timestamp, leadId);
    database.prepare(`INSERT INTO research_outbox (id,entity_key,resource_type,resource_id,action,status,attempts,last_error,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(randomUUID(), entityKey, 'lead', leadId, 'lead.followup.created', 'pending_external_contract', 0, 'EM Connect outbound update contract is not available for Research.', actorId, timestamp, timestamp);
    audit(actorId, 'research_followup_created', leadId, { action, hasSummary: Boolean(summary), hasNextAction: Boolean(nextAction) });
    return { leadId, action, nextAction: nextAction || '', followUpAt: followUpAt || '', createdAt: timestamp };
  } finally { database.close() }
}

export function upsertResearchLeadFromEmConnect(event) {
  const entity = event.entity;
  const sourceRecordId = clean(entity.contactId || entity.id, 240);
  const timestamp = now();
  const database = openDatabase();
  try {
    const existing = database.prepare('SELECT * FROM research_leads WHERE source_system = ? AND source_record_id = ?').get('em-connect', sourceRecordId);
    if (existing) {
      database.prepare('UPDATE research_leads SET source_event_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, source_label = ?, source_updated_at = ?, last_synced_at = ?, sync_state = ?, sync_error = NULL, updated_at = ? WHERE id = ?')
        .run(event.eventId, nullable(entity.firstName, 120), nullable(entity.lastName, 120), nullable(entity.email || entity.contactEmail, 320), nullable(entity.phone || entity.contactPhone, 80), nullable(entity.sourceType, 120), nullable(entity.sourceUpdatedAt, 80), timestamp, 'synced', timestamp, existing.id);
      database.prepare('INSERT OR IGNORE INTO research_integration_events (id,source_system,source_event_id,event_type,lead_id,state,error_code,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(randomUUID(), 'em-connect', event.eventId, event.eventType, existing.id, 'updated', null, timestamp);
      return { state: 'updated', lead: publicLead(database.prepare('SELECT * FROM research_leads WHERE id = ?').get(existing.id), true) };
    }
    const id = randomUUID();
    database.prepare(`INSERT INTO research_leads (id,entity_key,source_system,source_record_id,source_event_id,first_name,last_name,email,phone,source_label,status,assigned_user_id,study_id,next_action,follow_up_at,source_updated_at,last_synced_at,sync_state,sync_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, entityKey, 'em-connect', sourceRecordId, event.eventId, nullable(entity.firstName, 120), nullable(entity.lastName, 120), nullable(entity.email || entity.contactEmail, 320), nullable(entity.phone || entity.contactPhone, 80), nullable(entity.sourceType, 120), 'pending', null, null, null, null, nullable(entity.sourceUpdatedAt, 80), timestamp, 'synced', null, timestamp, timestamp);
    database.prepare('INSERT INTO research_integration_events (id,source_system,source_event_id,event_type,lead_id,state,error_code,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(randomUUID(), 'em-connect', event.eventId, event.eventType, id, 'created', null, timestamp);
    return { state: 'created', lead: publicLead(database.prepare('SELECT * FROM research_leads WHERE id = ?').get(id), true) };
  } finally { database.close() }
}

export function recordResearchIntegrationEvent(event, state, errorCode = null) {
  const database = openDatabase();
  try {
    database.prepare('INSERT OR IGNORE INTO research_integration_events (id,source_system,source_event_id,event_type,lead_id,state,error_code,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(randomUUID(), event.sourceSystem, event.eventId, event.eventType, null, state, errorCode, now());
  } finally { database.close() }
}

export function listResearchOutbox() {
  const database = openDatabase();
  try { return database.prepare('SELECT id, entity_key AS entityKey, resource_type AS resourceType, resource_id AS resourceId, action, status, attempts, last_error AS lastError, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM research_outbox ORDER BY updated_at DESC LIMIT 200').all() }
  finally { database.close() }
}

export function createResearchStudy(payload, actorId) {
  const studyCode = clean(payload.studyCode, 120);
  const title = clean(payload.title, 240);
  const assignedUserId = clean(payload.assignedUserId, 240);
  const assignedRole = requireAssignmentRole(payload.assignedRole);
  const protocolVersion = clean(payload.protocolVersion, 80);
  if (!studyCode || !title || !assignedUserId || !protocolVersion) { const error = new Error('Study code, title, protocol version and an explicit assignment are required.'); error.statusCode = 400; throw error; }
  const timestamp = now();
  const database = openDatabase();
  try {
    const id = randomUUID();
    database.prepare(`INSERT INTO research_studies (id,entity_key,study_code,title,sponsor_name,status,irb_status,sponsor_status,activation_status,current_protocol_version,verification_note,verified_by,verified_at,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, entityKey, studyCode, title, nullable(payload.sponsorName, 240), 'draft', 'pending', 'pending', 'not_ready', protocolVersion, null, null, null, actorId, timestamp, timestamp);
    database.prepare('INSERT INTO research_protocol_versions (id,study_id,version,effective_at,irb_status,sponsor_status,source_reference,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(randomUUID(), id, protocolVersion, nullable(payload.effectiveAt, 80), 'pending', 'pending', nullable(payload.sourceReference, 240), actorId, timestamp);
    database.prepare('INSERT INTO research_study_assignments (id,study_id,user_id,assignment_role,training_status,created_at) VALUES (?,?,?,?,?,?)')
      .run(randomUUID(), id, assignedUserId, assignedRole, 'pending', timestamp);
    audit(actorId, 'research_study_created', id, { studyCode, assignedRole });
    return publicStudy(database.prepare('SELECT * FROM research_studies WHERE id = ?').get(id), database, actorId, true);
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE')) { error.statusCode = 409; error.message = 'A Research study with that code already exists.'; }
    throw error;
  } finally { database.close() }
}

export function listResearchStudies({ actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const rows = database.prepare(`SELECT s.* FROM research_studies s WHERE s.entity_key = 'research' AND (? = 1 OR EXISTS (SELECT 1 FROM research_study_assignments a WHERE a.study_id = s.id AND a.user_id = ?)) ORDER BY s.updated_at DESC`).all(canManage ? 1 : 0, actorId || '');
    return rows.map(row => publicStudy(row, database, actorId || '', canManage));
  } finally { database.close() }
}

export function listResearchAgreements({ actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const rows = database.prepare(`
      SELECT a.*, s.study_code, s.title AS study_title
      FROM research_agreements a
      JOIN research_studies s ON s.id = a.study_id
      WHERE a.entity_key = 'research'
        AND (? = 1 OR EXISTS (SELECT 1 FROM research_study_assignments sa WHERE sa.study_id = a.study_id AND sa.user_id = ?))
      ORDER BY a.updated_at DESC
    `).all(canManage ? 1 : 0, actorId || '');
    return rows.map(publicResearchAgreement);
  } finally { database.close() }
}

export function getResearchAgreement(agreementId, { actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const row = agreementScope(database, agreementId, actorId || '', canManage);
    return row ? publicResearchAgreement(row) : null;
  } finally { database.close() }
}

export function createResearchAgreement(payload, actorId) {
  const studyId = clean(payload.studyId, 240);
  const agreementType = requireAgreementType(payload.agreementType);
  const counterparty = clean(payload.counterparty, 240);
  if (!studyId || !counterparty) { const error = new Error('A Research study and counterparty are required.'); error.statusCode = 400; throw error; }
  const status = requireAgreementStatus(payload.status);
  const timestamp = now();
  const database = openDatabase();
  try {
    const study = database.prepare("SELECT id FROM research_studies WHERE id = ? AND entity_key = 'research'").get(studyId);
    if (!study) { const error = new Error('Research study not found.'); error.statusCode = 404; throw error; }
    const id = randomUUID();
    database.prepare('INSERT INTO research_agreements (id,entity_key,study_id,agreement_type,counterparty,status,effective_at,source_reference,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, entityKey, studyId, agreementType, counterparty, status, nullable(payload.effectiveAt, 80), nullable(payload.sourceReference, 240), nullable(payload.notes, 1000), actorId, timestamp, timestamp);
    audit(actorId, 'research_agreement_created', id, { studyId, agreementType, status });
    return publicResearchAgreement(database.prepare(`SELECT a.*, s.study_code, s.title AS study_title FROM research_agreements a JOIN research_studies s ON s.id = a.study_id WHERE a.id = ?`).get(id));
  } finally { database.close() }
}

export function updateResearchAgreement(agreementId, payload, { actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const row = agreementScope(database, agreementId, actorId || '', canManage);
    if (!row) { const error = new Error('Research agreement not found.'); error.statusCode = 404; throw error; }
    const agreementType = payload.agreementType === undefined ? row.agreement_type : requireAgreementType(payload.agreementType);
    const counterparty = payload.counterparty === undefined ? row.counterparty : clean(payload.counterparty, 240);
    const status = payload.status === undefined ? row.status : requireAgreementStatus(payload.status);
    if (!counterparty) { const error = new Error('A counterparty is required.'); error.statusCode = 400; throw error; }
    const timestamp = now();
    database.prepare('UPDATE research_agreements SET agreement_type = ?, counterparty = ?, status = ?, effective_at = ?, source_reference = ?, notes = ?, updated_at = ? WHERE id = ?')
      .run(agreementType, counterparty, status, payload.effectiveAt === undefined ? row.effective_at : nullable(payload.effectiveAt, 80), payload.sourceReference === undefined ? row.source_reference : nullable(payload.sourceReference, 240), payload.notes === undefined ? row.notes : nullable(payload.notes, 1000), timestamp, agreementId);
    audit(actorId, 'research_agreement_updated', agreementId, { agreementType, status });
    return publicResearchAgreement(agreementScope(database, agreementId, actorId || '', canManage));
  } finally { database.close() }
}

export function getResearchStudy(studyId, { actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const row = studyScope(database, studyId, actorId || '', canManage);
    return row ? publicStudy(row, database, actorId || '', canManage) : null;
  } finally { database.close() }
}

export function updateResearchStudy(studyId, payload, { actorId, canManage = false } = {}) {
  const database = openDatabase();
  try {
    const row = studyScope(database, studyId, actorId || '', canManage);
    if (!row) { const error = new Error('Research study not found.'); error.statusCode = 404; throw error; }
    const status = payload.status === undefined ? row.status : requireStudyStatus(payload.status);
    const irbStatus = payload.irbStatus === undefined ? row.irb_status : requireApprovalStatus(payload.irbStatus);
    const sponsorStatus = payload.sponsorStatus === undefined ? row.sponsor_status : requireApprovalStatus(payload.sponsorStatus);
    const activationStatus = (irbStatus === 'verified' && sponsorStatus === 'verified' && status === 'active') ? 'active' : status === 'closed' ? 'closed' : 'not_ready';
    const timestamp = now();
    database.prepare('UPDATE research_studies SET status = ?, irb_status = ?, sponsor_status = ?, activation_status = ?, verification_note = ?, verified_by = ?, verified_at = ?, updated_at = ? WHERE id = ?')
      .run(status, irbStatus, sponsorStatus, activationStatus, nullable(payload.verificationNote, 500), nullable(payload.verifiedBy, 240), (irbStatus === 'verified' && sponsorStatus === 'verified') ? timestamp : null, timestamp, studyId);
    audit(actorId, 'research_study_updated', studyId, { status, irbStatus, sponsorStatus, activationStatus });
    return publicStudy(database.prepare('SELECT * FROM research_studies WHERE id = ?').get(studyId), database, actorId, canManage);
  } finally { database.close() }
}

export function createResearchScreening(studyId, payload, actorId) {
  const participantRef = clean(payload.participantRef, 240);
  if (!participantRef) { const error = new Error('An internal participant reference is required.'); error.statusCode = 400; throw error; }
  const database = openDatabase();
  try {
    const study = database.prepare("SELECT * FROM research_studies WHERE id = ? AND entity_key = 'research'").get(studyId);
    if (!study) { const error = new Error('Research study not found.'); error.statusCode = 404; throw error; }
    if (study.activation_status !== 'active') { const error = new Error('Study activation and approvals are not verified.'); error.statusCode = 409; throw error; }
    const status = ['pending', 'requires_review', 'completed'].includes(payload.status) ? payload.status : 'pending';
    const consentStatus = ['not_started', 'pending', 'valid', 'revoked'].includes(payload.consentStatus) ? payload.consentStatus : 'not_started';
    if (consentStatus === 'valid' && (!clean(payload.consentVersion, 80) || !clean(payload.consentAt, 80) || !clean(payload.consentBy, 240))) { const error = new Error('Valid consent requires version, date and responsible user.'); error.statusCode = 400; throw error; }
    const timestamp = now();
    const id = randomUUID();
    database.prepare('INSERT INTO research_screenings (id,study_id,participant_ref,status,consent_status,consent_version,consent_at,consent_by,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(study_id,participant_ref) DO UPDATE SET status=excluded.status, consent_status=excluded.consent_status, consent_version=excluded.consent_version, consent_at=excluded.consent_at, consent_by=excluded.consent_by, updated_at=excluded.updated_at')
      .run(id, studyId, participantRef, status, consentStatus, nullable(payload.consentVersion, 80), nullable(payload.consentAt, 80), nullable(payload.consentBy, 240), actorId, timestamp, timestamp);
    audit(actorId, 'research_screening_recorded', studyId, { status, consentStatus });
    return { studyId, participantRef, status, consentStatus, consentVersion: nullable(payload.consentVersion, 80) || '', consentAt: nullable(payload.consentAt, 80) || '', updatedAt: timestamp };
  } finally { database.close() }
}

export function createResearchSafetyEvent(studyId, payload, actorId) {
  const participantRef = clean(payload.participantRef, 240);
  const severity = clean(payload.severity, 60).toLowerCase();
  if (!participantRef || !['non-serious', 'serious', 'urgent'].includes(severity)) { const error = new Error('Participant reference and valid safety severity are required.'); error.statusCode = 400; throw error; }
  const database = openDatabase();
  try {
    const study = database.prepare("SELECT * FROM research_studies WHERE id = ? AND entity_key = 'research' AND activation_status = 'active'").get(studyId);
    if (!study) { const error = new Error('Research study is not active.'); error.statusCode = 409; throw error; }
    const timestamp = now();
    const id = randomUUID();
    database.prepare('INSERT INTO research_safety_events (id,study_id,participant_ref,severity,status,reported_at,description,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, studyId, participantRef, severity, 'open', nullable(payload.reportedAt, 80), nullable(payload.description, 500), actorId, timestamp);
    audit(actorId, 'research_safety_event_recorded', studyId, { severity, status: 'open' });
    return { id, studyId, participantRef, severity, status: 'open', createdAt: timestamp };
  } finally { database.close() }
}
