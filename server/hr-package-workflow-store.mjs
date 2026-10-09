import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getHrPackage } from './hr-package-store.mjs';

const databasePath=process.env.OPERATIONAL_HUB_DATABASE_PATH
  ? path.resolve(process.env.OPERATIONAL_HUB_DATABASE_PATH)
  : path.resolve('private','operational-hub.sqlite');
const privateRoot=path.dirname(databasePath);
const inboxRoot=path.join(privateRoot,'hr-records','package-inbox');
const clean=(value,max=500)=>String(value??'').trim().slice(0,max);
const httpError=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const tokenHash=token=>createHash('sha256').update(String(token||'')).digest('hex');
const jsonArray=value=>{try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}};

function openDatabase(){
  mkdirSync(inboxRoot,{recursive:true,mode:0o700});
  const database=new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS hr_package_workflows (
      id TEXT PRIMARY KEY,
      public_token_hash TEXT NOT NULL UNIQUE,
      candidate_name TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      package_ids TEXT NOT NULL,
      delivery_method TEXT NOT NULL,
      status TEXT NOT NULL,
      external_reference TEXT,
      subject TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      due_at TEXT,
      expires_at TEXT NOT NULL,
      employee_key TEXT,
      email_delivery_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      completed_at TEXT,
      assigned_at TEXT,
      assigned_by TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_hr_package_workflows_status ON hr_package_workflows(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_hr_package_workflows_external ON hr_package_workflows(external_reference);
    CREATE TABLE IF NOT EXISTS hr_package_returns (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      external_reference TEXT,
      received_at TEXT NOT NULL,
      assigned_employee_key TEXT,
      assigned_at TEXT,
      assigned_by TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_hr_package_returns_workflow ON hr_package_returns(workflow_id, received_at);
    CREATE INDEX IF NOT EXISTS idx_hr_package_returns_external ON hr_package_returns(external_reference);
  `);
  return database;
}

const publicReturn=row=>({
  id:row.id,workflowId:row.workflow_id,filename:row.filename,type:row.content_type,size:Number(row.size||0),
  source:row.source,status:row.status,externalReference:row.external_reference||'',receivedAt:row.received_at,
  assignedEmployeeKey:row.assigned_employee_key||'',assignedAt:row.assigned_at||'',assignedBy:row.assigned_by||'',
  fileUrl:`/api/hr/package-returns/${encodeURIComponent(row.id)}/file`,
});
const publicWorkflow=(row,returns=[])=>({
  id:row.id,candidateName:row.candidate_name,candidateEmail:row.candidate_email,packageIds:jsonArray(row.package_ids),
  deliveryMethod:row.delivery_method,status:row.status,externalReference:row.external_reference||'',subject:row.subject,
  message:row.message,dueAt:row.due_at||'',expiresAt:row.expires_at,employeeKey:row.employee_key||'',
  emailDeliveryId:row.email_delivery_id||'',createdBy:row.created_by,createdAt:row.created_at,sentAt:row.sent_at||'',
  completedAt:row.completed_at||'',assignedAt:row.assigned_at||'',assignedBy:row.assigned_by||'',returns,
});

async function withPackages(workflow){
  const packages=(await Promise.all(workflow.packageIds.map(id=>getHrPackage(id)))).filter(Boolean).map(record=>({
    id:record.id,filename:record.filename,type:record.type,size:record.size,createdAt:record.createdAt,
  }));
  return {...workflow,packages};
}

export async function createHrPackageWorkflow(payload={},actorId='system'){
  const candidateName=clean(payload.candidateName,180);const candidateEmail=clean(payload.candidateEmail,240).toLowerCase();
  const packageIds=[...new Set([].concat(payload.packageIds||[]).map(value=>clean(value,100)).filter(Boolean))].slice(0,20);
  const deliveryMethod=['portal','docusign'].includes(payload.deliveryMethod)?payload.deliveryMethod:'portal';
  if(!candidateName||!/^\S+@\S+\.\S+$/.test(candidateEmail)||!packageIds.length)throw httpError('Candidate name, valid email and at least one Employee Package document are required');
  for(const packageId of packageIds)if(!await getHrPackage(packageId))throw httpError(`Employee Package document not found: ${packageId}`,404);
  const id=randomUUID();const token=randomBytes(32).toString('base64url');const timestamp=new Date();
  const expiration=new Date(timestamp);expiration.setDate(expiration.getDate()+Math.min(60,Math.max(1,Number(payload.expirationDays)||30)));
  const dueAt=clean(payload.dueAt,30)||null;const subject=clean(payload.subject,140)||'Employee Package';const message=clean(payload.message,5000);
  const database=openDatabase();
  try{
    database.prepare(`INSERT INTO hr_package_workflows (id,public_token_hash,candidate_name,candidate_email,package_ids,delivery_method,status,subject,message,due_at,expires_at,created_by,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,tokenHash(token),candidateName,candidateEmail,JSON.stringify(packageIds),deliveryMethod,'prepared',subject,message,dueAt,expiration.toISOString(),clean(actorId,100)||'system',timestamp.toISOString());
    const workflow=publicWorkflow(database.prepare('SELECT * FROM hr_package_workflows WHERE id = ?').get(id),[]);
    return {workflow:await withPackages(workflow),token};
  }finally{database.close()}
}

export async function listHrPackageWorkflows(){
  const database=openDatabase();
  try{
    const workflows=database.prepare('SELECT * FROM hr_package_workflows ORDER BY created_at DESC').all();
    const returns=database.prepare('SELECT * FROM hr_package_returns ORDER BY received_at DESC').all();
    return Promise.all(workflows.map(row=>withPackages(publicWorkflow(row,returns.filter(item=>item.workflow_id===row.id).map(publicReturn)))));
  }finally{database.close()}
}

export async function getPublicHrPackageWorkflow(token){
  const database=openDatabase();
  try{
    const row=database.prepare('SELECT * FROM hr_package_workflows WHERE public_token_hash = ?').get(tokenHash(token));
    if(!row)return null;
    const returns=database.prepare('SELECT * FROM hr_package_returns WHERE workflow_id = ? ORDER BY received_at DESC').all(row.id).map(publicReturn);
    const workflow=await withPackages(publicWorkflow(row,returns));
    return {...workflow,expired:new Date(workflow.expiresAt).valueOf()<Date.now()};
  }finally{database.close()}
}

export function getHrPackageWorkflow(id){
  const database=openDatabase();
  try{const row=database.prepare('SELECT * FROM hr_package_workflows WHERE id = ?').get(clean(id,100));return row?publicWorkflow(row):null}finally{database.close()}
}

export function findHrPackageWorkflowByExternalReference(reference){
  const database=openDatabase();
  try{const row=database.prepare('SELECT * FROM hr_package_workflows WHERE external_reference = ? ORDER BY created_at DESC LIMIT 1').get(clean(reference,180));return row?publicWorkflow(row):null}finally{database.close()}
}

export function updateHrPackageWorkflow(id,payload={}){
  const database=openDatabase();
  try{
    const current=database.prepare('SELECT * FROM hr_package_workflows WHERE id = ?').get(clean(id,100));if(!current)throw httpError('Employee Package workflow not found',404);
    const allowedStatuses=new Set(['prepared','draft','sent','received','completed','assigned','failed']);
    const status=allowedStatuses.has(payload.status)?payload.status:current.status;const now=new Date().toISOString();
    const sentAt=payload.sentAt===true?now:clean(payload.sentAt,50)||current.sent_at;
    const completedAt=payload.completedAt===true?now:clean(payload.completedAt,50)||current.completed_at;
    database.prepare(`UPDATE hr_package_workflows SET status=?,external_reference=?,email_delivery_id=?,sent_at=?,completed_at=? WHERE id=?`)
      .run(status,clean(payload.externalReference,180)||current.external_reference,clean(payload.emailDeliveryId,180)||current.email_delivery_id,sentAt||null,completedAt||null,current.id);
    return publicWorkflow(database.prepare('SELECT * FROM hr_package_workflows WHERE id = ?').get(current.id));
  }finally{database.close()}
}

export async function archiveHrPackageReturn(workflowId,payload={},source='candidate-portal'){
  const workflow=getHrPackageWorkflow(workflowId);if(!workflow)throw httpError('Employee Package workflow not found',404);
  if(new Date(workflow.expiresAt).valueOf()<Date.now())throw httpError('This Employee Package link has expired',410);
  if(workflow.status==='assigned')throw httpError('This Employee Package has already been assigned',409);
  const filename=clean(payload.filename,240).replace(/[\\/\r\n"]/g,'_');const base64=String(payload.base64||'');
  if(!filename||!base64)throw httpError('Filename and completed document are required');
  const bytes=Buffer.from(base64,'base64');if(!bytes.length||bytes.length>30*1024*1024)throw httpError('Returned document must be between 1 byte and 30 MB');
  const externalReference=clean(payload.externalReference,180)||null;
  const database=openDatabase();
  try{
    if(externalReference){const existing=database.prepare('SELECT * FROM hr_package_returns WHERE external_reference = ? LIMIT 1').get(externalReference);if(existing)return publicReturn(existing)}
    const id=randomUUID();const extension=path.extname(filename).slice(0,12);const filePath=path.join(inboxRoot,`${id}${extension}`);const timestamp=new Date().toISOString();
    await writeFile(filePath,bytes,{mode:0o600});
    database.prepare(`INSERT INTO hr_package_returns (id,workflow_id,filename,content_type,size,file_path,source,status,external_reference,received_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id,workflow.id,filename,clean(payload.type,120)||'application/octet-stream',bytes.length,filePath,clean(source,80)||'candidate-portal','received',externalReference,timestamp);
    database.prepare("UPDATE hr_package_workflows SET status='received',completed_at=? WHERE id=?").run(timestamp,workflow.id);
    return publicReturn(database.prepare('SELECT * FROM hr_package_returns WHERE id = ?').get(id));
  }finally{database.close()}
}

export function findHrPackageReturnByExternalReference(reference){
  const database=openDatabase();
  try{const row=database.prepare('SELECT * FROM hr_package_returns WHERE external_reference = ? LIMIT 1').get(clean(reference,180));return row?publicReturn(row):null}finally{database.close()}
}

export function getHrPackageReturn(id){
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM hr_package_returns WHERE id = ?').get(clean(id,100))||null}finally{database.close()}
}

export async function readHrPackageReturn(id){
  const record=getHrPackageReturn(id);if(!record)return null;
  return {...publicReturn(record),bytes:await readFile(record.file_path)};
}

export function markHrPackageReturnAssigned(id,employeeKey,actorId='system'){
  const database=openDatabase();
  try{
    const row=database.prepare('SELECT * FROM hr_package_returns WHERE id = ?').get(clean(id,100));if(!row)throw httpError('Returned Employee Package document not found',404);
    const timestamp=new Date().toISOString();database.prepare("UPDATE hr_package_returns SET status='assigned',assigned_employee_key=?,assigned_at=?,assigned_by=? WHERE id=?")
      .run(clean(employeeKey,180),timestamp,clean(actorId,100)||'system',row.id);
    const pending=database.prepare("SELECT COUNT(*) AS count FROM hr_package_returns WHERE workflow_id=? AND status!='assigned'").get(row.workflow_id).count;
    if(!pending)database.prepare("UPDATE hr_package_workflows SET status='assigned',employee_key=?,assigned_at=?,assigned_by=? WHERE id=?")
      .run(clean(employeeKey,180),timestamp,clean(actorId,100)||'system',row.workflow_id);
    return publicReturn(database.prepare('SELECT * FROM hr_package_returns WHERE id = ?').get(row.id));
  }finally{database.close()}
}

export async function deleteHrPackageReturn(id){
  const database=openDatabase();
  try{const row=database.prepare('SELECT * FROM hr_package_returns WHERE id=?').get(clean(id,100));if(!row)return false;database.prepare('DELETE FROM hr_package_returns WHERE id=?').run(row.id);await unlink(row.file_path).catch(()=>null);return true}finally{database.close()}
}
