import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.env.HR_PACKAGE_STORAGE_ROOT
  ? path.resolve(process.env.HR_PACKAGE_STORAGE_ROOT)
  : path.resolve('server/data/hr-packages');
const indexPath = path.join(root, 'index.json');

async function readIndex() {
  await mkdir(root, { recursive: true });
  return readFile(indexPath, 'utf8').then(JSON.parse).catch(() => []);
}

async function writeIndex(records) {
  await mkdir(root, { recursive: true });
  await writeFile(indexPath, JSON.stringify(records, null, 2));
}

export async function listHrPackages() {
  return (await readIndex()).map(({ filePath, ...record }) => record);
}

export async function createHrPackage(payload = {}) {
  const filename = String(payload.filename || '').replace(/[\\/\r\n"]/g, '_').trim();
  const base64 = String(payload.base64 || '');
  if (!filename || !base64) throw new Error('Filename and file content are required');
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > 30 * 1024 * 1024) throw new Error('Employee Package file must be between 1 byte and 30 MB');
  const records = await readIndex();
  const clientId = String(payload.clientId || '');
  const existing = clientId && records.find(record => record.clientId === clientId);
  if (existing) return (({ filePath, ...record }) => record)(existing);
  const id = randomUUID();
  const extension = path.extname(filename).slice(0, 12);
  const filePath = path.join(root, `${id}${extension}`);
  await writeFile(filePath, bytes);
  const record = { id, clientId, filename, type: String(payload.type || 'application/octet-stream'), size: bytes.length, createdAt: new Date().toISOString(), filePath };
  records.unshift(record);
  await writeIndex(records);
  return (({ filePath: ignored, ...publicRecord }) => publicRecord)(record);
}

export async function getHrPackage(id) {
  return (await readIndex()).find(record => record.id === id) || null;
}

export async function deleteHrPackage(id) {
  const records = await readIndex();
  const record = records.find(item => item.id === id);
  if (!record) return false;
  await unlink(record.filePath).catch(() => null);
  await writeIndex(records.filter(item => item.id !== id));
  return true;
}
