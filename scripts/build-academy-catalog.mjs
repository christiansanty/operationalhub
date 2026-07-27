import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const exportFile = path.resolve("private/airtable-export.json");
const outputFile = path.resolve("src/data/airtableTraining.js");
const backendCatalogFile = path.resolve("private/academy-catalog.json");
const payload = JSON.parse(await readFile(exportFile, "utf8"));

const groups = [
  {
    id: "airtable-clinical-systems",
    iconKey: "clinical",
    tone: "blue",
    title: { en: "Clinical Systems & EHR", es: "Sistemas Clínicos y EHR" },
    description: {
      en: "Practice Fusion, HMS, Availity, Nabla, imaging, Tebra and Updox training imported from Learning Center.",
      es: "Capacitación de Practice Fusion, HMS, Availity, Nabla, imágenes, Tebra y Updox importada del Learning Center.",
    },
    tables: ["Pratice Fusion", "HMS - Management System", "Availity", "Nabla", "Expressradiology", "Tebra or Kareo", "Updox"],
  },
  {
    id: "airtable-communications",
    iconKey: "communications",
    tone: "cyan",
    title: { en: "Communications, Call Center & CRM", es: "Comunicaciones, Call Center y CRM" },
    description: {
      en: "Operational training for phone platforms, call reporting, FreshWork CRM and customer communications.",
      es: "Capacitación operativa de plataformas telefónicas, reportes de llamadas, FreshWork CRM y comunicación con clientes.",
    },
    tables: ["APP Call center", "Ringotel", "Flash Operator Panel 2", "Asternic CDR Reports", "FreshWork CRM"],
  },
  {
    id: "airtable-workplace-tools",
    iconKey: "workplace",
    tone: "violet",
    title: { en: "Workplace Tools & Security", es: "Herramientas de Trabajo y Seguridad" },
    description: {
      en: "Windows, secure access, email, Microsoft Office, Adobe, Airtable and surveillance tools.",
      es: "Windows, acceso seguro, correo, Microsoft Office, Adobe, Airtable y herramientas de vigilancia.",
    },
    tables: ["Windows", "Cisco AnyConnect Secure", "Gmail WS", "IPAGE Mail", "Adobe Acrobat", "Microsoft Office", "Airtable", "NVRs MontavueGo"],
  },
  {
    id: "airtable-chronic-labs",
    iconKey: "care",
    tone: "teal",
    specialMode: "care",
    title: { en: "QHS Labs & Chronic Care", es: "QHS Labs y Chronic Care" },
    description: {
      en: "Patient identification, consent, documentation, referral and care-coordination resources.",
      es: "Recursos de identificación, consentimiento, documentación, referido y coordinación de pacientes.",
    },
    tables: ["QHSLAB", "SERVICES OFFICE"],
    include: (name) => !name || /CHRONIC CARE|BS\/? BP LOG/i.test(name),
  },
  {
    id: "airtable-clinical-services",
    iconKey: "services",
    tone: "rose",
    title: { en: "Clinical & Office Services", es: "Servicios Clínicos y de Oficina" },
    description: {
      en: "Forms and workflows for ultrasound, IV therapy, medical intake, disabled parking and aesthetics services.",
      es: "Formularios y procesos de ultrasonido, terapia IV, historial médico, estacionamiento accesible y estética.",
    },
    tables: ["SERVICES OFFICE", "305 MEDICAL CARE SERVICES"],
    exclude: (name) => /CHRONIC CARE|BS\/? BP LOG/i.test(name || ""),
  },
  {
    id: "airtable-office-operations",
    iconKey: "operations",
    tone: "amber",
    title: { en: "Office Operations & Position Training", es: "Operaciones de Oficina y Capacitación por Puesto" },
    description: {
      en: "Medical assistant, office requirements, inventory and supply-request training.",
      es: "Capacitación para asistentes médicos, requisitos de oficina, inventario y solicitud de suministros.",
    },
    tables: ["Inventory system", "POSITIONS TRAINING", "OFFICE REQUIEREMENTS", "SUPPLIES REQUEST"],
  },
  {
    id: "airtable-compliance",
    iconKey: "compliance",
    tone: "blue",
    title: { en: "Licensing & Prior Authorizations", es: "Licencias y Autorizaciones Previas" },
    description: {
      en: "CLIA waiver, laboratory responsibilities and payer prior-authorization resources.",
      es: "Recursos de CLIA Waiver, responsabilidades de laboratorio y autorizaciones previas de pagadores.",
    },
    tables: ["LICENSES", "PRIOR AUTHORIZATIONS"],
  },
];

function isAttachmentList(value) {
  return Array.isArray(value) && value.some((item) => item?.filename && item?.url);
}

function fieldText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && typeof value.value === "string") return value.value.trim();
  return "";
}

function firstWebUrl(...values) {
  for (const value of values) {
    const text = fieldText(value);
    const match = text.match(/https?:\/\/[^\s]+/i);
    if (match) return match[0];
  }
  return null;
}

function cleanRecord(table, record, index) {
  const fields = record.fields || {};
  const attachments = Object.entries(fields)
    .filter(([, value]) => isAttachmentList(value))
    .flatMap(([field, value]) => value.map(({ id, filename, type, size }) => ({ id, field, filename, type, size: size || null })));
  const externalUrl = firstWebUrl(fields.URL, fields.Videos, fields.Website);
  const name = String(fields.Name || "").trim();
  const description = String(fields.Description || fields.Notes || fields.Notas || "").trim();
  const reserved = new Set(["Name", "Description", "Notes", "Notas", "URL", "Videos", "Website", "Users", "Assignee", "Attachment Summary"]);
  const details = Object.entries(fields)
    .filter(([field, value]) => !reserved.has(field) && !isAttachmentList(value))
    .map(([label, value]) => ({ label, value: fieldText(value) }))
    .filter((detail) => detail.value);

  if (!name && !description && !externalUrl && attachments.length === 0 && details.length === 0) return null;

  return {
    id: record.id,
    table: table.name,
    title: name || `${table.name} · Resource ${index + 1}`,
    description,
    externalUrl,
    attachments,
    details,
    sourceUpdated: record.createdTime || null,
  };
}

const tableMap = new Map(payload.tables.map((table) => [table.name, table]));
const generatedAt = new Date().toISOString();

const courses = groups.map((group) => {
  const content = [];
  for (const tableName of group.tables) {
    const table = tableMap.get(tableName);
    if (!table) continue;
    const beforeTable = content.length;
    table.records.forEach((record, index) => {
      const lesson = cleanRecord(table, record, index);
      if (!lesson) return;
      if (group.include && !group.include(lesson.title)) return;
      if (group.exclude && group.exclude(lesson.title)) return;
      content.push(lesson);
    });
    if (content.length === beforeTable) {
      content.push({
        id: `${table.id}-content-pending`,
        table: table.name,
        title: `${table.name} · Content pending`,
        description: "This Airtable table is connected, but its current rows do not contain publishable training content yet.",
        externalUrl: null,
        attachments: [],
        details: [{ label: "Airtable rows", value: String(table.records.length) }],
        sourceUpdated: null,
        status: "pending",
      });
    }
  }

  const assetCount = content.reduce((total, item) => total + item.attachments.length, 0);
  const lessonCount = Math.max(content.length, 1);
  return {
    id: group.id,
    source: "airtable",
    sourceName: "TRAININGS - Learning Center",
    iconKey: group.iconKey,
    tone: group.tone,
    specialMode: group.specialMode || null,
    progress: 0,
    duration: `${Math.max(1, Math.ceil(lessonCount * 0.35))}h`,
    modules: lessonCount,
    due: { en: "Assigned", es: "Asignado" },
    title: group.title,
    description: group.description,
    sourceTables: group.tables,
    assetCount,
    content,
    lessons: content.length
      ? content.map((item) => [item.title, item.title])
      : [["Content review pending", "Contenido pendiente de revisión"]],
  };
});

const sync = {
  baseId: payload.baseId,
  baseName: "TRAININGS - Learning Center",
  exportedAt: payload.exportedAt,
  generatedAt,
  tableCount: payload.tables.length,
  recordCount: payload.tables.reduce((total, table) => total + table.records.length, 0),
  attachmentCount: courses.reduce((total, course) => total + course.assetCount, 0),
  publishedCourseCount: courses.length,
};

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(
  outputFile,
  `// Generated by scripts/build-academy-catalog.mjs from the private Airtable export.\n` +
    `// Collaborators, access tokens and temporary attachment URLs are intentionally excluded.\n` +
    `export const airtableSync = ${JSON.stringify(sync, null, 2)};\n\n` +
    `export const airtableCourses = ${JSON.stringify(courses, null, 2)};\n`,
);
await writeFile(backendCatalogFile, `${JSON.stringify({ sync, courses }, null, 2)}\n`, { mode: 0o600 });

console.log(`Generated ${courses.length} courses from ${sync.recordCount} records (${sync.attachmentCount} referenced attachments).`);
