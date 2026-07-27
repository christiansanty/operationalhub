import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const privateRoot=path.resolve('private');
const databasePath=path.join(privateRoot,'operational-hub.sqlite');
const documentRoot=path.join(privateRoot,'license-documents');
const acceptedTypes=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
const maxFileBytes=20*1024*1024;

function openDatabase(){
  const database=new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS doctor_license_documents (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      category TEXT NOT NULL,
      filename TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      expires_on TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_doctor_license_documents_provider ON doctor_license_documents(provider_id, category, created_at);
  `);
  return database;
}

const mapDocument=row=>({id:row.id,providerId:row.provider_id,category:row.category,filename:row.filename,type:row.type,size:row.size,expiresOn:row.expires_on||'',notes:row.notes||'',createdAt:row.created_at});
const safeSegment=value=>String(value||'').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'file';

export function listDoctorDocuments(providerId){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM doctor_license_documents WHERE provider_id = ? ORDER BY created_at DESC').all(providerId).map(mapDocument)}finally{database.close()}
}

export async function createDoctorDocument(providerId,payload){
  const filename=String(payload.filename||'').trim();
  const type=String(payload.type||'').toLowerCase();
  const category=String(payload.category||'').trim();
  const encoded=String(payload.dataBase64||'').replace(/^data:[^;]+;base64,/, '');
  if(!providerId||!filename||!category||!encoded)throw new Error('Provider, category and file are required');
  if(!acceptedTypes.has(type))throw new Error('Only PDF, JPG, PNG and WebP files are supported');
  const buffer=Buffer.from(encoded,'base64');
  if(!buffer.length||buffer.length>maxFileBytes)throw new Error('File must be between 1 byte and 20 MB');
  const id=`doc-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  const providerDirectory=safeSegment(providerId);
  const storedFilename=`${id}-${safeSegment(filename)}`;
  const relativePath=path.join('license-documents',providerDirectory,storedFilename);
  const absolutePath=path.resolve(privateRoot,relativePath);
  if(!absolutePath.startsWith(`${documentRoot}${path.sep}`))throw new Error('Invalid document path');
  await mkdir(path.dirname(absolutePath),{recursive:true,mode:0o700});
  await writeFile(absolutePath,buffer,{mode:0o600});
  const document={id,providerId,category:category.slice(0,80),filename:filename.slice(0,240),relativePath,type,size:buffer.length,expiresOn:payload.expiresOn?String(payload.expiresOn).slice(0,20):'',notes:payload.notes?String(payload.notes).trim().slice(0,1000):'',createdAt:new Date().toISOString()};
  const database=openDatabase();
  try{database.prepare('INSERT INTO doctor_license_documents (id,provider_id,category,filename,relative_path,type,size,expires_on,notes,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(document.id,document.providerId,document.category,document.filename,document.relativePath,document.type,document.size,document.expiresOn||null,document.notes||null,document.createdAt)}finally{database.close()}
  return {...document,relativePath:undefined};
}

export function getDoctorDocument(id){
  const database=openDatabase();
  try{
    const row=database.prepare('SELECT * FROM doctor_license_documents WHERE id = ?').get(id);
    if(!row)return null;
    const filePath=path.resolve(privateRoot,row.relative_path);
    if(!filePath.startsWith(`${documentRoot}${path.sep}`))return null;
    return {...mapDocument(row),filePath};
  }finally{database.close()}
}
