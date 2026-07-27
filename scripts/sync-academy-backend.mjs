import { syncAcademyBackend } from '../server/academy-sync.mjs';

const status = await syncAcademyBackend();
console.log(`Backend ready: ${status.tables} tables, ${status.records} records, ${status.attachments} attachments.`);
