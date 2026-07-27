import { createWriteStream } from "node:fs";
import { chmod, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const privateDir = path.resolve("private");
const attachmentRoot = path.join(privateDir, "attachments");
const exportPath = path.join(privateDir, "airtable-export.json");
const manifestPath = path.join(privateDir, "attachment-manifest.json");
const payload = JSON.parse(await readFile(exportPath, "utf8"));

const cleanSegment = (value) =>
  String(value || "unnamed")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "unnamed";

const attachments = [];
const seen = new Set();

for (const table of payload.tables) {
  for (const record of table.records) {
    for (const [fieldName, value] of Object.entries(record.fields)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        if (!item?.id || !item?.url || !item?.filename || seen.has(item.id)) continue;
        seen.add(item.id);
        attachments.push({
          id: item.id,
          url: item.url,
          filename: item.filename,
          size: item.size || null,
          type: item.type || null,
          table: table.name,
          recordId: record.id,
          fieldName,
        });
      }
    }
  }
}

await mkdir(attachmentRoot, { recursive: true, mode: 0o700 });
const manifest = [];

for (let index = 0; index < attachments.length; index += 1) {
  const attachment = attachments[index];
  const tableDir = path.join(attachmentRoot, cleanSegment(attachment.table));
  await mkdir(tableDir, { recursive: true, mode: 0o700 });
  const filename = `${attachment.id}-${cleanSegment(attachment.filename)}`;
  const destination = path.join(tableDir, filename);
  const temporary = `${destination}.partial`;
  const existing = await stat(destination).catch(() => null);

  if (existing && (!attachment.size || existing.size === attachment.size)) {
    manifest.push({
      id: attachment.id,
      table: attachment.table,
      recordId: attachment.recordId,
      fieldName: attachment.fieldName,
      filename: attachment.filename,
      relativePath: path.relative(privateDir, destination),
      size: existing.size,
      type: attachment.type,
    });
    console.log(`[${index + 1}/${attachments.length}] Reused: ${attachment.table}: ${attachment.filename}`);
    continue;
  }
  const response = await fetch(attachment.url);

  if (!response.ok || !response.body) {
    throw new Error(`Unable to download ${attachment.filename}: HTTP ${response.status}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary, { mode: 0o600 }));
  await rename(temporary, destination);
  await chmod(destination, 0o600);

  manifest.push({
    id: attachment.id,
    table: attachment.table,
    recordId: attachment.recordId,
    fieldName: attachment.fieldName,
    filename: attachment.filename,
    relativePath: path.relative(privateDir, destination),
    size: attachment.size,
    type: attachment.type,
  });

  console.log(`[${index + 1}/${attachments.length}] ${attachment.table}: ${attachment.filename}`);
}

await writeFile(
  manifestPath,
  `${JSON.stringify({ downloadedAt: new Date().toISOString(), count: manifest.length, files: manifest }, null, 2)}\n`,
  { mode: 0o600 },
);
await chmod(manifestPath, 0o600);
console.log(`Completed: ${manifest.length} attachments.`);
