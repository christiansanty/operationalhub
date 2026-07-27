import { syncOperationalAirtable } from '../server/operational-airtable-sync.mjs';

const snapshot=await syncOperationalAirtable();
console.log(`EM-MSO synchronized: ${snapshot.providers.length} providers, ${snapshot.contracts.length} contracts, ${snapshot.licenses.length} license records, ${snapshot.entities.length} entity records.`);
