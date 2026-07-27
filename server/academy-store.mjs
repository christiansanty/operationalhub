import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const privateRoot = path.resolve('private');
const databasePath = path.join(privateRoot, 'academy.sqlite');
const exportPath = path.join(privateRoot, 'airtable-export.json');
const manifestPath = path.join(privateRoot, 'attachment-manifest.json');
const catalogPath = path.join(privateRoot, 'academy-catalog.json');

function openDatabase() {
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS academy_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS airtable_tables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_field_id TEXT,
      position INTEGER NOT NULL,
      fields_json TEXT NOT NULL,
      views_json TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS airtable_records (
      id TEXT NOT NULL,
      table_id TEXT NOT NULL REFERENCES airtable_tables(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      created_time TEXT,
      fields_json TEXT NOT NULL,
      synced_at TEXT NOT NULL,
      PRIMARY KEY (table_id, id)
    );
    CREATE TABLE IF NOT EXISTS airtable_attachments (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      size INTEGER,
      type TEXT,
      downloaded_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_airtable_records_table ON airtable_records(table_id, position);
    CREATE INDEX IF NOT EXISTS idx_airtable_attachments_record ON airtable_attachments(record_id);
  `);
  return database;
}

export async function ingestAcademyExport() {
  await mkdir(privateRoot, { recursive: true, mode: 0o700 });
  const payload = JSON.parse(await readFile(exportPath, 'utf8'));
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{"files":[]}'));
  const database = openDatabase();
  const insertTable = database.prepare('INSERT INTO airtable_tables VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertRecord = database.prepare('INSERT INTO airtable_records VALUES (?, ?, ?, ?, ?, ?)');
  const insertAttachment = database.prepare('INSERT INTO airtable_attachments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const setMetadata = database.prepare('INSERT OR REPLACE INTO academy_metadata (key, value) VALUES (?, ?)');

  database.exec('BEGIN IMMEDIATE');
  try {
    database.exec('DELETE FROM airtable_attachments; DELETE FROM airtable_records; DELETE FROM airtable_tables;');
    payload.tables.forEach((table, tableIndex) => {
      insertTable.run(table.id, table.name, table.primaryFieldId || null, tableIndex, JSON.stringify(table.fields || []), JSON.stringify(table.views || []), payload.exportedAt);
      table.records.forEach((record, recordIndex) => {
        insertRecord.run(record.id, table.id, recordIndex, record.createdTime || null, JSON.stringify(record.fields || {}), payload.exportedAt);
      });
    });
    for (const attachment of manifest.files || []) {
      insertAttachment.run(attachment.id, attachment.table, attachment.recordId, attachment.fieldName, attachment.filename, attachment.relativePath, attachment.size || null, attachment.type || null, manifest.downloadedAt || payload.exportedAt);
    }
    setMetadata.run('base_id', payload.baseId);
    setMetadata.run('exported_at', payload.exportedAt);
    setMetadata.run('ingested_at', new Date().toISOString());
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.close();
  }

  return getAcademyStatus();
}

export function getAcademyStatus() {
  const database = openDatabase();
  try {
    const tables = database.prepare('SELECT COUNT(*) AS count FROM airtable_tables').get().count;
    const records = database.prepare('SELECT COUNT(*) AS count FROM airtable_records').get().count;
    const attachments = database.prepare('SELECT COUNT(*) AS count FROM airtable_attachments').get().count;
    const metadataRows = database.prepare('SELECT key, value FROM academy_metadata').all();
    const metadata = Object.fromEntries(metadataRows.map((row) => [row.key, row.value]));
    return { ready: tables > 0, tables, records, attachments, ...metadata };
  } finally {
    database.close();
  }
}

export async function getAcademyCatalog() {
  return JSON.parse(await readFile(catalogPath, 'utf8'));
}

export function getAcademyAttachment(id) {
  const database = openDatabase();
  try {
    const attachment = database.prepare('SELECT filename, relative_path, type FROM airtable_attachments WHERE id = ?').get(id);
    if (!attachment) return null;
    const filePath = path.resolve(privateRoot, attachment.relative_path);
    if (!filePath.startsWith(`${privateRoot}${path.sep}`)) return null;
    return { ...attachment, filePath };
  } finally {
    database.close();
  }
}

export { databasePath };
