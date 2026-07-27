import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const privateRoot=path.resolve('private');
const databasePath=path.join(privateRoot,'operational-hub.sqlite');
const sources=new Set(['licenses','background','roster']);
const modes=new Set(['api','rpa','manual']);

function openDatabase(){
  mkdirSync(privateRoot,{recursive:true,mode:0o700});
  const database=new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS aca_integration_records (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      facility TEXT,
      status TEXT,
      expires_on TEXT,
      last_verified_at TEXT,
      payload_json TEXT NOT NULL,
      synced_at TEXT NOT NULL,
      UNIQUE(source, external_id)
    );
    CREATE INDEX IF NOT EXISTS idx_aca_records_source ON aca_integration_records(source, status, synced_at);
    CREATE TABLE IF NOT EXISTS aca_sync_runs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      mode TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS aca_rpa_checks (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      scope TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      message TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_aca_rpa_checks_queue ON aca_rpa_checks(status, requested_at);
  `);
  return database;
}

const clean=(value,max=240)=>value===undefined||value===null?'':String(value).trim().slice(0,max);
const mapRecord=row=>({
  id:row.id,
  source:row.source,
  externalId:row.external_id,
  subject:row.subject,
  facility:row.facility||'',
  status:row.status||'',
  expiresOn:row.expires_on||'',
  lastVerifiedAt:row.last_verified_at||'',
  details:JSON.parse(row.payload_json||'{}'),
  syncedAt:row.synced_at,
});

export function getAcaIntegrationStatus(){
  const database=openDatabase();
  try{
    const counts={licenses:0,background:0,roster:0};
    for(const row of database.prepare('SELECT source, COUNT(*) AS count FROM aca_integration_records GROUP BY source').all())counts[row.source]=Number(row.count);
    const lastRun=database.prepare('SELECT * FROM aca_sync_runs ORDER BY completed_at DESC LIMIT 1').get();
    const checkCounts={queued:0,running:0,completed:0,failed:0};
    for(const row of database.prepare('SELECT status, COUNT(*) AS count FROM aca_rpa_checks GROUP BY status').all())checkCounts[row.status]=Number(row.count);
    return {
      agency:'Florida Agency for Health Care Administration',
      portal:'AHCA',
      connected:Boolean(lastRun),
      method:'authorized-rpa',
      externalApiAvailable:false,
      receiverConfigured:Boolean(process.env.ACA_RPA_CALLBACK_KEY||process.env.ACA_INTEGRATION_KEY),
      rpaConfigured:process.env.ACA_RPA_ENABLED==='true',
      rpaProvider:process.env.ACA_RPA_PROVIDER||'',
      counts,
      checkCounts,
      lastSync:lastRun?{source:lastRun.source,mode:lastRun.mode,recordCount:lastRun.record_count,status:lastRun.status,completedAt:lastRun.completed_at}:null,
    };
  }finally{database.close()}
}

const mapCheck=row=>({id:row.id,source:row.source,scope:row.scope,status:row.status,requestedAt:row.requested_at,startedAt:row.started_at||'',completedAt:row.completed_at||'',message:row.message||''});

export function listAcaRpaChecks(source){
  if(source&&!sources.has(source))throw new Error('Invalid ACA data source');
  const database=openDatabase();
  try{
    const rows=source?database.prepare('SELECT * FROM aca_rpa_checks WHERE source = ? ORDER BY requested_at DESC LIMIT 50').all(source):database.prepare('SELECT * FROM aca_rpa_checks ORDER BY requested_at DESC LIMIT 100').all();
    return rows.map(mapCheck);
  }finally{database.close()}
}

export function createAcaRpaCheck(payload){
  const source=clean(payload.source,40);
  const scope=clean(payload.scope||'all authorized facilities',240);
  if(!sources.has(source))throw new Error('Source must be licenses, background or roster');
  if(!scope)throw new Error('Verification scope is required');
  const check={id:`aca-check-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,source,scope,status:'queued',requestedAt:new Date().toISOString()};
  const database=openDatabase();
  try{database.prepare('INSERT INTO aca_rpa_checks (id,source,scope,status,requested_at) VALUES (?, ?, ?, ?, ?)').run(check.id,check.source,check.scope,check.status,check.requestedAt)}finally{database.close()}
  return check;
}

export function claimNextAcaRpaCheck(){
  const database=openDatabase();
  try{
    database.exec('BEGIN IMMEDIATE');
    const row=database.prepare("SELECT * FROM aca_rpa_checks WHERE status = 'queued' ORDER BY requested_at ASC LIMIT 1").get();
    if(!row){database.exec('COMMIT');return null}
    const startedAt=new Date().toISOString();
    database.prepare("UPDATE aca_rpa_checks SET status = 'running', started_at = ? WHERE id = ? AND status = 'queued'").run(startedAt,row.id);
    database.exec('COMMIT');
    return mapCheck({...row,status:'running',started_at:startedAt});
  }catch(error){try{database.exec('ROLLBACK')}catch{}throw error}finally{database.close()}
}

export function completeAcaRpaCheck(id,payload){
  const status=clean(payload.status,20);
  if(!['completed','failed'].includes(status))throw new Error('RPA result status must be completed or failed');
  const database=openDatabase();
  try{
    const current=database.prepare('SELECT * FROM aca_rpa_checks WHERE id = ?').get(id);
    if(!current)throw new Error('RPA verification not found');
    if(!['queued','running'].includes(current.status))throw new Error('RPA verification is already closed');
    if(status==='completed')importAcaRecords({source:current.source,mode:'rpa',records:Array.isArray(payload.records)?payload.records:[]});
    const completedAt=new Date().toISOString();
    database.prepare('UPDATE aca_rpa_checks SET status = ?, completed_at = ?, message = ? WHERE id = ?').run(status,completedAt,clean(payload.message,1000)||null,id);
    return mapCheck(database.prepare('SELECT * FROM aca_rpa_checks WHERE id = ?').get(id));
  }finally{database.close()}
}

export function listAcaRecords(source){
  if(!sources.has(source))throw new Error('Invalid ACA data source');
  const database=openDatabase();
  try{return database.prepare('SELECT * FROM aca_integration_records WHERE source = ? ORDER BY subject COLLATE NOCASE').all(source).map(mapRecord)}finally{database.close()}
}

export function importAcaRecords(payload){
  const source=clean(payload.source,40);
  const mode=clean(payload.mode||'api',20);
  const records=payload.records;
  if(!sources.has(source))throw new Error('Source must be licenses, background or roster');
  if(!modes.has(mode))throw new Error('Mode must be api, rpa or manual');
  if(!Array.isArray(records)||records.length>2500)throw new Error('Records must be an array with no more than 2,500 items');
  const database=openDatabase();
  const syncedAt=new Date().toISOString();
  const insert=database.prepare(`
    INSERT INTO aca_integration_records (id,source,external_id,subject,facility,status,expires_on,last_verified_at,payload_json,synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, external_id) DO UPDATE SET
      subject=excluded.subject,
      facility=excluded.facility,
      status=excluded.status,
      expires_on=excluded.expires_on,
      last_verified_at=excluded.last_verified_at,
      payload_json=excluded.payload_json,
      synced_at=excluded.synced_at
  `);
  try{
    database.exec('BEGIN IMMEDIATE');
    records.forEach((record,index)=>{
      if(!record||typeof record!=='object')throw new Error(`Invalid record at position ${index+1}`);
      const externalId=clean(record.externalId||record.id,160);
      const subject=clean(record.subject||record.name||record.licenseNumber,240);
      if(!externalId||!subject)throw new Error(`Record ${index+1} requires externalId and subject`);
      insert.run(
        `aca-${source}-${externalId}`,
        source,
        externalId,
        subject,
        clean(record.facility,240)||null,
        clean(record.status,80)||null,
        clean(record.expiresOn,30)||null,
        clean(record.lastVerifiedAt,40)||null,
        JSON.stringify(record),
        syncedAt,
      );
    });
    const runId=`aca-sync-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    database.prepare('INSERT INTO aca_sync_runs (id,source,mode,record_count,status,completed_at) VALUES (?, ?, ?, ?, ?, ?)').run(runId,source,mode,records.length,'completed',syncedAt);
    database.exec('COMMIT');
    return {id:runId,source,mode,recordCount:records.length,status:'completed',completedAt:syncedAt};
  }catch(error){
    try{database.exec('ROLLBACK')}catch{}
    throw error;
  }finally{database.close()}
}
