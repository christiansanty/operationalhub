import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getAccessEmailStatus, sendAccessInvitation } from './access-email.mjs';

const databasePath = process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private', 'operational-hub.sqlite');
const privateRoot = path.dirname(databasePath);
const invitationLifetimeMs = 72 * 60 * 60 * 1000;
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const permissionValues = new Set(['none', 'view', 'manage']);
const permissionKeys = new Set([
  'dashboard','entity-medical','entity-care305','entity-aesthetics','entity-seven','entity-research',
  'leads','protocols','licenses','doctor-licenses','contracting','academy','human-resources','personnel','admin-users',
  'app-seven-insurance','app-scribex-health','app-carecheck360','app-financial-hub','app-marketing-suite','app-executive-assistant',
]);
const accessProfiles = new Set(['academy', 'custom', 'admin', 'owner']);
const employmentStatuses = new Set(['active', 'inactive']);

function openDatabase() {
  mkdirSync(privateRoot, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS access_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      employment_status TEXT NOT NULL,
      access_profile TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions_json TEXT NOT NULL,
      account_status TEXT NOT NULL,
      password_salt TEXT,
      password_hash TEXT,
      invited_at TEXT NOT NULL,
      accepted_at TEXT,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS access_invitations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      revoked_at TEXT,
      delivery_status TEXT NOT NULL,
      delivery_provider TEXT,
      delivery_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_access_invitation_user ON access_invitations(user_id, created_at);
    CREATE TABLE IF NOT EXISTS access_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES access_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_access_session_token ON access_sessions(token_hash, expires_at);
    CREATE TABLE IF NOT EXISTS access_audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      action TEXT NOT NULL,
      target_id TEXT,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return database;
}

const now = () => new Date().toISOString();
const hashToken = token => createHash('sha256').update(String(token)).digest('hex');
const clean = (value, max = 240) => String(value || '').trim().slice(0, max);
const normalizeEmail = value => clean(value, 320).toLowerCase();
const parseJson = (value, fallback = {}) => { try { return JSON.parse(value || '') } catch { return fallback } };
const publicUser = row => ({
  id: row.id,
  name: row.name,
  email: row.email,
  employmentStatus: row.employment_status,
  accessProfile: row.access_profile,
  role: row.role,
  permissions: parseJson(row.permissions_json),
  accountStatus: row.account_status,
  invitedAt: row.invited_at,
  acceptedAt: row.accepted_at || '',
  lastLoginAt: row.last_login_at || '',
  updatedAt: row.updated_at,
});

function publicSession(row) {
  const user = publicUser(row);
  const assigned = Object.entries(user.permissions).filter(([, value]) => value === 'view' || value === 'manage');
  return {
    id: user.id,
    learnerId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessProfile: user.accessProfile,
    scope: user.role === 'owner' ? 'full' : user.role === 'admin' ? 'hub' : assigned.length === 1 && assigned[0][0] === 'academy' ? 'academy' : 'custom',
    permissions: user.permissions,
    updatedAt: user.updatedAt,
  };
}

function audit(database, actorId, action, targetId, details = {}) {
  database.prepare('INSERT INTO access_audit_events (id,actor_id,action,target_id,details_json,created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), actorId || null, action, targetId || null, JSON.stringify(details), now());
}

function validatePermissions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, permission]) => {
    const safeKey = clean(key, 100);
    return [safeKey, permissionValues.has(permission) ? permission : 'none'];
  }).filter(([key]) => permissionKeys.has(key)));
}

function permissionsForProfile(profile, value) {
  const permissions = validatePermissions(value);
  if (profile === 'academy') {
    return { ...Object.fromEntries(Object.keys(permissions).map(key => [key, 'none'])), academy:'view' };
  }
  return permissions;
}

const stablePermissions = value => JSON.stringify(Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right)));

function roleForProfile(profile) {
  return profile === 'owner' ? 'owner' : profile === 'admin' ? 'admin' : 'employee';
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N: 2 ** 15, r: 8, p: 3, maxmem: 128 * 1024 * 1024 });
  return { salt: salt.toString('base64'), hash: derived.toString('base64') };
}

function passwordMatches(password, saltValue, hashValue) {
  if (!saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, 'base64');
  const actual = scryptSync(password, Buffer.from(saltValue, 'base64'), expected.length, { N: 2 ** 15, r: 8, p: 3, maxmem: 128 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    const error = new Error('Password must contain between 12 and 128 characters.');
    error.statusCode = 400;
    throw error;
  }
}

function createSession(database, userId) {
  const token = randomBytes(32).toString('base64url');
  const createdAt = now();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString();
  database.prepare('DELETE FROM access_sessions WHERE expires_at <= ?').run(createdAt);
  database.prepare('INSERT INTO access_sessions (id,user_id,token_hash,expires_at,created_at,last_seen_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), userId, hashToken(token), expiresAt, createdAt, createdAt);
  return { token, expiresAt };
}

async function issueInvitation(database, user, baseUrl, actorId) {
  const token = randomBytes(32).toString('base64url');
  const invitationId = randomUUID();
  const createdAt = now();
  const expiresAt = new Date(Date.now() + invitationLifetimeMs).toISOString();
  database.prepare("UPDATE access_invitations SET revoked_at = ? WHERE user_id = ? AND used_at IS NULL AND revoked_at IS NULL").run(createdAt, user.id);
  database.prepare('INSERT INTO access_invitations (id,user_id,token_hash,expires_at,delivery_status,created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(invitationId, user.id, hashToken(token), expiresAt, 'pending', createdAt);
  const inviteUrl = `${baseUrl.replace(/\/$/, '')}/?invite=${encodeURIComponent(token)}`;
  let delivery;
  try {
    delivery = await sendAccessInvitation({ email: user.email, name: user.name, inviteUrl, expiresAt, invitationId });
    database.prepare('UPDATE access_invitations SET delivery_status = ?, delivery_provider = ?, delivery_id = ? WHERE id = ?')
      .run(delivery.delivered ? 'sent' : 'preview', delivery.provider, delivery.deliveryId || null, invitationId);
  } catch (error) {
    database.prepare("UPDATE access_invitations SET delivery_status = 'failed', delivery_provider = ? WHERE id = ?")
      .run(getAccessEmailStatus().provider, invitationId);
    audit(database, actorId, 'invitation_email_failed', user.id, { message: error.message });
    throw error;
  }
  audit(database, actorId, 'user_invited', user.id, { delivery: delivery.delivered ? 'sent' : 'preview' });
  return {
    invitationId,
    expiresAt,
    delivery: { delivered: delivery.delivered, provider: delivery.provider },
    developmentUrl: delivery.previewUrl || '',
  };
}

export function getAccessSystemStatus() {
  const email = getAccessEmailStatus();
  return {
    email,
    demoAdministratorEnabled: false,
    invitationLifetimeHours: invitationLifetimeMs / 3600000,
    sessionLifetimeDays: sessionLifetimeMs / 86400000,
  };
}

export function listAccessUsers() {
  const database = openDatabase();
  try {
    const users = database.prepare(`
      SELECT u.*,
        (SELECT delivery_status FROM access_invitations i WHERE i.user_id = u.id ORDER BY i.created_at DESC LIMIT 1) AS delivery_status,
        (SELECT expires_at FROM access_invitations i WHERE i.user_id = u.id ORDER BY i.created_at DESC LIMIT 1) AS invitation_expires_at
      FROM access_users u ORDER BY u.created_at DESC
    `).all().map(row => ({ ...publicUser(row), deliveryStatus: row.delivery_status || '', invitationExpiresAt: row.invitation_expires_at || '' }));
    return users;
  } finally { database.close() }
}

export async function inviteAccessUser(payload, baseUrl, actorId = 'demo-admin') {
  const name = clean(payload.name, 160);
  const email = normalizeEmail(payload.email);
  const employmentStatus = employmentStatuses.has(payload.employmentStatus) ? payload.employmentStatus : 'active';
  const accessProfile = accessProfiles.has(payload.accessProfile) ? payload.accessProfile : 'academy';
  const permissions = permissionsForProfile(accessProfile, payload.permissions);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('A valid name and work email are required.');
    error.statusCode = 400;
    throw error;
  }
  if (!Object.values(permissions).some(value => value === 'view' || value === 'manage') && !['admin', 'owner'].includes(accessProfile)) {
    const error = new Error('At least one section permission is required.');
    error.statusCode = 400;
    throw error;
  }
  const database = openDatabase();
  try {
    const existing = database.prepare('SELECT * FROM access_users WHERE email = ?').get(email);
    if (existing?.account_status === 'active') {
      const error = new Error('An active account already exists for this email.');
      error.statusCode = 409;
      throw error;
    }
    const timestamp = now();
    const id = existing?.id || randomUUID();
    if (existing) {
      database.prepare(`UPDATE access_users SET name = ?, employment_status = ?, access_profile = ?, role = ?, permissions_json = ?, account_status = 'invited', updated_at = ? WHERE id = ?`)
        .run(name, employmentStatus, accessProfile, roleForProfile(accessProfile), JSON.stringify(permissions), timestamp, id);
    } else {
      database.prepare(`INSERT INTO access_users (id,name,email,employment_status,access_profile,role,permissions_json,account_status,invited_at,created_at,updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'invited', ?, ?, ?)`)
        .run(id, name, email, employmentStatus, accessProfile, roleForProfile(accessProfile), JSON.stringify(permissions), timestamp, timestamp, timestamp);
    }
    const user = database.prepare('SELECT * FROM access_users WHERE id = ?').get(id);
    const invitation = await issueInvitation(database, publicUser(user), baseUrl, actorId);
    return { user: publicUser(user), invitation };
  } finally { database.close() }
}

export async function resendAccessInvitation(userId, baseUrl, actorId = 'demo-admin') {
  const database = openDatabase();
  try {
    const row = database.prepare('SELECT * FROM access_users WHERE id = ?').get(userId);
    if (!row) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    if (row.account_status === 'active') {
      const error = new Error('This user has already activated the account.');
      error.statusCode = 409;
      throw error;
    }
    return { user: publicUser(row), invitation: await issueInvitation(database, publicUser(row), baseUrl, actorId) };
  } finally { database.close() }
}

export function getInvitation(token) {
  const database = openDatabase();
  try {
    const row = database.prepare(`
      SELECT i.id AS invitation_id, i.expires_at, i.used_at, i.revoked_at, u.*
      FROM access_invitations i JOIN access_users u ON u.id = i.user_id
      WHERE i.token_hash = ?
    `).get(hashToken(token));
    if (!row || row.used_at || row.revoked_at || row.expires_at <= now()) {
      const error = new Error('This invitation is invalid or has expired.');
      error.statusCode = 410;
      throw error;
    }
    return {
      invitationId: row.invitation_id,
      expiresAt: row.expires_at,
      user: publicUser(row),
    };
  } finally { database.close() }
}

export function acceptInvitation(token, password) {
  validatePassword(password);
  const database = openDatabase();
  try {
    database.exec('BEGIN IMMEDIATE');
    const row = database.prepare(`
      SELECT i.id AS invitation_id, i.expires_at, i.used_at, i.revoked_at, u.*
      FROM access_invitations i JOIN access_users u ON u.id = i.user_id
      WHERE i.token_hash = ?
    `).get(hashToken(token));
    if (!row || row.used_at || row.revoked_at || row.expires_at <= now()) {
      database.exec('ROLLBACK');
      const error = new Error('This invitation is invalid or has expired.');
      error.statusCode = 410;
      throw error;
    }
    const passwordRecord = hashPassword(password);
    const timestamp = now();
    database.prepare(`UPDATE access_users SET password_salt = ?, password_hash = ?, account_status = 'active', accepted_at = ?, updated_at = ? WHERE id = ?`)
      .run(passwordRecord.salt, passwordRecord.hash, timestamp, timestamp, row.id);
    database.prepare('UPDATE access_invitations SET used_at = ? WHERE id = ?').run(timestamp, row.invitation_id);
    audit(database, row.id, 'invitation_accepted', row.id);
    const session = createSession(database, row.id);
    database.exec('COMMIT');
    const user = database.prepare('SELECT * FROM access_users WHERE id = ?').get(row.id);
    return { session: publicSession(user), sessionToken: session.token, expiresAt: session.expiresAt };
  } catch (error) {
    try { database.exec('ROLLBACK') } catch {}
    throw error;
  } finally { database.close() }
}

export function loginAccessUser(emailValue, password) {
  const email = normalizeEmail(emailValue);
  const database = openDatabase();
  try {
    const row = database.prepare('SELECT * FROM access_users WHERE email = ?').get(email);
    const valid = row && row.account_status === 'active' && row.employment_status === 'active'
      && passwordMatches(String(password || ''), row.password_salt, row.password_hash);
    if (!valid) {
      const error = new Error('Invalid email or password, or the account is not active.');
      error.statusCode = 401;
      throw error;
    }
    const timestamp = now();
    database.prepare('UPDATE access_users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(timestamp, timestamp, row.id);
    audit(database, row.id, 'user_login', row.id);
    const session = createSession(database, row.id);
    return { session: publicSession({ ...row, last_login_at: timestamp, updated_at: timestamp }), sessionToken: session.token, expiresAt: session.expiresAt };
  } finally { database.close() }
}

export function resolveAccessSession(token) {
  if (!token) return null;
  const database = openDatabase();
  try {
    const row = database.prepare(`
      SELECT u.*, s.id AS session_id, s.expires_at AS session_expires_at
      FROM access_sessions s JOIN access_users u ON u.id = s.user_id
      WHERE s.token_hash = ?
    `).get(hashToken(token));
    if (!row || row.session_expires_at <= now() || row.account_status !== 'active' || row.employment_status !== 'active') return null;
    database.prepare('UPDATE access_sessions SET last_seen_at = ? WHERE id = ?').run(now(), row.session_id);
    return publicSession(row);
  } finally { database.close() }
}

export function logoutAccessSession(token) {
  if (!token) return;
  const database = openDatabase();
  try { database.prepare('DELETE FROM access_sessions WHERE token_hash = ?').run(hashToken(token)) }
  finally { database.close() }
}

export function updateAccessUser(userId, payload, actorId = 'demo-admin') {
  const database = openDatabase();
  try {
    const row = database.prepare('SELECT * FROM access_users WHERE id = ?').get(userId);
    if (!row) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    const name = payload.name === undefined ? row.name : clean(payload.name, 160);
    const employmentStatus = payload.employmentStatus === undefined ? row.employment_status : payload.employmentStatus;
    const accessProfile = payload.accessProfile === undefined ? row.access_profile : payload.accessProfile;
    const permissions = permissionsForProfile(accessProfile,payload.permissions === undefined ? parseJson(row.permissions_json) : payload.permissions);
    if (!name || !employmentStatuses.has(employmentStatus) || !accessProfiles.has(accessProfile)) {
      const error = new Error('Invalid user settings.');
      error.statusCode = 400;
      throw error;
    }
    if (!Object.values(permissions).some(value => value === 'view' || value === 'manage') && !['admin', 'owner'].includes(accessProfile)) {
      const error = new Error('At least one section permission is required.');
      error.statusCode = 400;
      throw error;
    }
    const accountStatus = employmentStatus === 'inactive'
      ? 'disabled'
      : row.account_status === 'disabled'
        ? (row.password_hash ? 'active' : 'invited')
        : row.account_status;
    database.prepare(`UPDATE access_users SET name = ?, employment_status = ?, access_profile = ?, role = ?, permissions_json = ?, account_status = ?, updated_at = ? WHERE id = ?`)
      .run(name, employmentStatus, accessProfile, roleForProfile(accessProfile), JSON.stringify(permissions), accountStatus, now(), userId);
    const accessChanged = employmentStatus !== row.employment_status
      || accessProfile !== row.access_profile
      || roleForProfile(accessProfile) !== row.role
      || stablePermissions(permissions) !== stablePermissions(parseJson(row.permissions_json));
    const revoked = accessChanged ? database.prepare('DELETE FROM access_sessions WHERE user_id = ?').run(userId).changes : 0;
    audit(database, actorId, 'user_access_updated', userId, { employmentStatus, accessProfile });
    return { user:publicUser(database.prepare('SELECT * FROM access_users WHERE id = ?').get(userId)), sessionsRevoked:Number(revoked || 0) };
  } finally { database.close() }
}

export function deleteAccessUser(userId, actorId = 'demo-admin') {
  const database = openDatabase();
  try {
    const found = database.prepare('SELECT id FROM access_users WHERE id = ?').get(userId);
    if (!found) return false;
    database.prepare('DELETE FROM access_users WHERE id = ?').run(userId);
    audit(database, actorId, 'user_removed', userId);
    return true;
  } finally { database.close() }
}
