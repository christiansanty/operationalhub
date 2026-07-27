import { chmod, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Pass the source .env path containing the existing OpenAI integration.');

const targetPath = path.resolve('.env.local');
const source = await readFile(path.resolve(sourcePath), 'utf8');
const current = await readFile(targetPath, 'utf8').catch(() => '');
const keys = ['AI_INTEGRATIONS_OPENAI_API_KEY', 'AI_INTEGRATIONS_OPENAI_BASE_URL'];

const readValue = (contents, key) => {
  const line = contents.split(/\r?\n/).find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : '';
};

let next = current.trimEnd();
for (const key of keys) {
  const value = readValue(source, key);
  if (!value) throw new Error(`Existing integration is missing ${key}.`);
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  next = pattern.test(next) ? next.replace(pattern, line) : `${next}${next ? '\n' : ''}${line}`;
}

const temporaryPath = `${targetPath}.tmp-${process.pid}`;
await writeFile(temporaryPath, `${next}\n`, { encoding: 'utf8', mode: 0o600 });
await rename(temporaryPath, targetPath);
await chmod(targetPath, 0o600);
console.log(`Linked ${keys.join(', ')} into ignored .env.local without displaying secret values.`);
