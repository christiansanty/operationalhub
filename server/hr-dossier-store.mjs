import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath=process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private','operational-hub.sqlite');
const privateRoot=path.dirname(databasePath);
const documentRoot=path.join(privateRoot,'hr-records','documents');
const categories=new Set(['certification','background-screening','aca-roster','e-verify','course','medical-exam','signed-document','credential','employee-package','other']);
const httpError=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const clean=(value,max=300)=>String(value??'').trim().slice(0,max);

function openDatabase(){
  mkdirSync(documentRoot,{recursive:true,mode:0o700});
  const database=new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS hr_document_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      due_at TEXT,
      requested_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_hr_requests_user ON hr_document_requests(user_id, created_at);
    CREATE TABLE IF NOT EXISTS hr_employee_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      request_id TEXT,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_hr_documents_user ON hr_employee_documents(user_id, created_at);
    CREATE TABLE IF NOT EXISTS hr_compliance_items (
      user_id TEXT NOT NULL,
      item_key TEXT NOT NULL,
      status TEXT NOT NULL,
      deadline TEXT,
      completed_at TEXT,
      notes TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, item_key)
    );
  `);
  const requestColumns=new Set(database.prepare('PRAGMA table_info(hr_document_requests)').all().map(column=>column.name));
  for(const [name,definition] of [
    ['package_id','TEXT'],
    ['delivery_method',"TEXT NOT NULL DEFAULT 'portal'"],
    ['external_reference','TEXT'],
    ['sent_at','TEXT'],
  ])if(!requestColumns.has(name))database.exec(`ALTER TABLE hr_document_requests ADD COLUMN ${name} ${definition}`);
  const documentColumns=new Set(database.prepare('PRAGMA table_info(hr_employee_documents)').all().map(column=>column.name));
  if(!documentColumns.has('external_reference'))database.exec('ALTER TABLE hr_employee_documents ADD COLUMN external_reference TEXT');
  return database;
}

const publicDocument=row=>({id:row.id,userId:row.user_id,requestId:row.request_id||'',filename:row.filename,type:row.content_type,size:Number(row.size||0),category:row.category,source:row.source,status:row.status,createdAt:row.created_at,externalReference:row.external_reference||'',fileUrl:`/api/hr/documents/${encodeURIComponent(row.id)}/file`});
const publicRequest=row=>({id:row.id,userId:row.user_id,title:row.title,description:row.description,category:row.category,status:row.status,dueAt:row.due_at||'',requestedBy:row.requested_by,createdAt:row.created_at,completedAt:row.completed_at||'',packageId:row.package_id||'',deliveryMethod:row.delivery_method||'portal',externalReference:row.external_reference||'',sentAt:row.sent_at||''});

export function listHrDossierDocuments(userId){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM hr_employee_documents WHERE user_id = ? ORDER BY created_at DESC').all(clean(userId,100)).map(publicDocument)}finally{database.close()}
}

export function listHrDocumentRequests(userId){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM hr_document_requests WHERE user_id = ? ORDER BY created_at DESC').all(clean(userId,100)).map(publicRequest)}finally{database.close()}
}

export function getHrDocumentRequest(id){
  const database=openDatabase();
  try{const row=database.prepare('SELECT * FROM hr_document_requests WHERE id = ?').get(clean(id,100));return row?publicRequest(row):null}finally{database.close()}
}

export function findHrDocumentRequestsByExternalReference(externalReference){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM hr_document_requests WHERE external_reference = ? ORDER BY created_at').all(clean(externalReference,180)).map(publicRequest)}finally{database.close()}
}

export function findHrDocumentByExternalReference(externalReference){
  const database=openDatabase();
  try{const row=database.prepare('SELECT * FROM hr_employee_documents WHERE external_reference = ? ORDER BY created_at DESC LIMIT 1').get(clean(externalReference,180));return row?publicDocument(row):null}finally{database.close()}
}

export function createHrDocumentRequest(userId,payload={},actorId='system'){
  const normalizedUserId=clean(userId,100);const title=clean(payload.title,180);const category=categories.has(payload.category)?payload.category:'other';
  if(!normalizedUserId||!title)throw httpError('Employee and document request title are required');
  const dueAt=clean(payload.dueAt,50)||null;const timestamp=new Date().toISOString();const id=randomUUID();
  const deliveryMethod=clean(payload.deliveryMethod,40)||'portal';const packageId=clean(payload.packageId,100)||null;const externalReference=clean(payload.externalReference,180)||null;
  const database=openDatabase();
  try{
    database.prepare('INSERT INTO hr_document_requests (id,user_id,title,description,category,status,due_at,requested_by,created_at,package_id,delivery_method,external_reference,sent_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id,normalizedUserId,title,clean(payload.description,1200),category,'requested',dueAt,clean(actorId,100)||'system',timestamp,packageId,deliveryMethod,externalReference,timestamp);
    return publicRequest(database.prepare('SELECT * FROM hr_document_requests WHERE id = ?').get(id));
  }finally{database.close()}
}

export async function archiveHrDocument(userId,payload={},actorId='system',source='employee-upload'){
  const normalizedUserId=clean(userId,100);const filename=clean(payload.filename,240).replace(/[\\/\r\n"]/g,'_');const base64=String(payload.base64||'');
  if(!normalizedUserId||!filename||!base64)throw httpError('Employee, filename and file content are required');
  const bytes=Buffer.from(base64,'base64');
  if(!bytes.length||bytes.length>30*1024*1024)throw httpError('Returned document must be between 1 byte and 30 MB');
  const category=categories.has(payload.category)?payload.category:'other';let requestId=clean(payload.requestId,100)||null;const externalReference=clean(payload.externalReference,180)||null;
  const database=openDatabase();
  try{
    if(requestId){
      const request=database.prepare('SELECT * FROM hr_document_requests WHERE id = ? AND user_id = ?').get(requestId,normalizedUserId);
      if(!request)throw httpError('The document request does not belong to this employee',404);
    }
    if(!requestId&&externalReference)requestId=database.prepare("SELECT id FROM hr_document_requests WHERE user_id = ? AND external_reference = ? AND status != 'received' ORDER BY created_at LIMIT 1").get(normalizedUserId,externalReference)?.id||null;
    const id=randomUUID();const extension=path.extname(filename).slice(0,12);const filePath=path.join(documentRoot,`${id}${extension}`);const timestamp=new Date().toISOString();
    await writeFile(filePath,bytes,{mode:0o600});
    database.prepare('INSERT INTO hr_employee_documents (id,user_id,request_id,filename,content_type,size,file_path,category,source,status,uploaded_by,created_at,external_reference) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id,normalizedUserId,requestId,filename,clean(payload.type,120)||'application/octet-stream',bytes.length,filePath,category,clean(source,80)||'employee-upload','received',clean(actorId,100)||normalizedUserId,timestamp,externalReference);
    if(externalReference)database.prepare("UPDATE hr_document_requests SET status = 'received', completed_at = ? WHERE user_id = ? AND external_reference = ?").run(timestamp,normalizedUserId,externalReference);
    else if(requestId)database.prepare("UPDATE hr_document_requests SET status = 'received', completed_at = ? WHERE id = ?").run(timestamp,requestId);
    return publicDocument(database.prepare('SELECT * FROM hr_employee_documents WHERE id = ?').get(id));
  }finally{database.close()}
}

export function getHrDossierDocument(id){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM hr_employee_documents WHERE id = ?').get(clean(id,100))||null}finally{database.close()}
}

export function listHrComplianceItems(userId){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM hr_compliance_items WHERE user_id = ? ORDER BY item_key').all(clean(userId,100)).map(row=>({userId:row.user_id,key:row.item_key,status:row.status,deadline:row.deadline||'',completedAt:row.completed_at||'',notes:row.notes,updatedBy:row.updated_by,updatedAt:row.updated_at}))}finally{database.close()}
}

export function updateHrComplianceItem(userId,itemKey,payload={},actorId='system'){
  const normalizedUserId=clean(userId,100);const key=clean(itemKey,100);const allowedStatuses=new Set(['pending','in-progress','completed','not-applicable']);const status=allowedStatuses.has(payload.status)?payload.status:'pending';
  if(!normalizedUserId||!key)throw httpError('Employee and compliance item are required');
  const timestamp=new Date().toISOString();const completedAt=status==='completed'?(clean(payload.completedAt,50)||timestamp):null;
  const database=openDatabase();
  try{
    database.prepare(`INSERT INTO hr_compliance_items (user_id,item_key,status,deadline,completed_at,notes,updated_by,updated_at)
      VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,item_key) DO UPDATE SET status=excluded.status,deadline=excluded.deadline,completed_at=excluded.completed_at,notes=excluded.notes,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
      .run(normalizedUserId,key,status,clean(payload.deadline,50)||null,completedAt,clean(payload.notes,1200),clean(actorId,100)||'system',timestamp);
    return listHrComplianceItems(normalizedUserId).find(item=>item.key===key);
  }finally{database.close()}
}

export async function deleteHrDossierDocument(id){
  const database=openDatabase();
  try{
    const row=database.prepare('SELECT * FROM hr_employee_documents WHERE id = ?').get(clean(id,100));if(!row)return false;
    database.prepare('DELETE FROM hr_employee_documents WHERE id = ?').run(row.id);await unlink(row.file_path).catch(()=>null);return true;
  }finally{database.close()}
}

export const hrDocumentCategories=[...categories];
