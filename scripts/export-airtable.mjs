import { mkdir, writeFile, chmod } from "node:fs/promises";
import path from "node:path";

const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID || "appaudJsTWWbjwNzd";
const apiRoot = "https://api.airtable.com/v0";
const privateDir = path.resolve("private");

if (!token) {
  throw new Error("AIRTABLE_PERSONAL_ACCESS_TOKEN is missing from .env.local");
}

const headers = { Authorization: `Bearer ${token}` };
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function airtableJson(url, attempt = 0) {
  const response = await fetch(url, { headers });

  if (response.status === 429 && attempt < 5) {
    await wait(400 * 2 ** attempt);
    return airtableJson(url, attempt + 1);
  }

  const payload = await response.json();
  if (!response.ok) {
    const type = payload?.error?.type || `HTTP_${response.status}`;
    throw new Error(`Airtable request failed: ${type}`);
  }

  return payload;
}

async function readAllRecords(tableId) {
  const records = [];
  let offset;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (offset) query.set("offset", offset);
    const page = await airtableJson(`${apiRoot}/${baseId}/${tableId}?${query}`);
    records.push(...page.records);
    offset = page.offset;
    await wait(220);
  } while (offset);

  return records;
}

await mkdir(privateDir, { recursive: true, mode: 0o700 });

const schema = await airtableJson(`${apiRoot}/meta/bases/${baseId}/tables`);
const exportedAt = new Date().toISOString();
const tables = [];

for (const table of schema.tables) {
  const records = await readAllRecords(table.id);
  tables.push({
    id: table.id,
    name: table.name,
    primaryFieldId: table.primaryFieldId,
    fields: table.fields,
    views: table.views,
    records,
  });
  console.log(`Exported: ${table.name} (${records.length} records)`);
}

const exportFile = path.join(privateDir, "airtable-export.json");
const summaryFile = path.join(privateDir, "airtable-summary.json");
const summary = {
  baseId,
  exportedAt,
  tableCount: tables.length,
  recordCount: tables.reduce((total, table) => total + table.records.length, 0),
  tables: tables.map((table) => ({
    id: table.id,
    name: table.name,
    recordCount: table.records.length,
    fields: table.fields.map(({ id, name, type }) => ({ id, name, type })),
  })),
};

await writeFile(exportFile, `${JSON.stringify({ baseId, exportedAt, tables }, null, 2)}\n`, { mode: 0o600 });
await writeFile(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
await chmod(exportFile, 0o600);
await chmod(summaryFile, 0o600);

console.log(`Completed: ${summary.tableCount} tables, ${summary.recordCount} records.`);
