import { spawn } from 'node:child_process';
import { ingestAcademyExport } from './academy-store.mjs';

let activeSync = null;

function runNodeScript(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with code ${code}`)));
  });
}

export function syncAcademyBackend() {
  if (activeSync) return activeSync;
  activeSync = (async () => {
    if (!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not configured');
    await runNodeScript('scripts/export-airtable.mjs');
    await runNodeScript('scripts/download-airtable-attachments.mjs');
    await runNodeScript('scripts/build-academy-catalog.mjs');
    return ingestAcademyExport();
  })().finally(() => { activeSync = null; });
  return activeSync;
}
