import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  emmsoContractSnapshot,
  emmsoLicenseSnapshot,
  emmsoProviderSnapshot,
  emmsoSourceStatus,
} from '../src/data/emmsoOperational.js';

const privateRoot=path.resolve('private');
const databasePath=path.join(privateRoot,'operational-hub.sqlite');
const attachmentRoot=path.join(privateRoot,'operational-airtable-attachments');

function openDatabase(){
  const database=new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS operational_airtable_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      base_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      state TEXT NOT NULL,
      message TEXT,
      synced_at TEXT,
      table_counts_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS operational_providers (
      record_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      last_name TEXT,
      status TEXT,
      degree TEXT,
      credentialed TEXT,
      npi TEXT,
      license_number TEXT,
      tax_id_masked TEXT,
      medicare TEXT,
      medicaid TEXT,
      dea TEXT,
      caqh TEXT,
      payer_credentialing TEXT,
      email TEXT,
      hospital TEXT,
      provider_number TEXT,
      address TEXT,
      attachments_json TEXT NOT NULL DEFAULT '[]',
      source_record_url TEXT,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS operational_contracts (
      record_id TEXT PRIMARY KEY,
      insurance TEXT NOT NULL,
      status TEXT,
      notes TEXT,
      products TEXT,
      ideas TEXT,
      attachments_json TEXT NOT NULL DEFAULT '[]',
      source_record_url TEXT,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS operational_licenses (
      record_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      entity TEXT,
      license_number TEXT,
      status TEXT,
      expires_on TEXT,
      owner TEXT,
      fields_json TEXT NOT NULL DEFAULT '{}',
      attachments_json TEXT NOT NULL DEFAULT '[]',
      source_record_url TEXT,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS operational_entities (
      record_id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      title TEXT NOT NULL,
      fields_json TEXT NOT NULL DEFAULT '{}',
      attachments_json TEXT NOT NULL DEFAULT '[]',
      source_record_url TEXT,
      synced_at TEXT NOT NULL
    );
  `);
  return database;
}

const parseJson=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};
const mapProvider=row=>({recordId:row.record_id,name:[row.name,row.last_name].filter(Boolean).join(' '),firstName:row.name,lastName:row.last_name||'',status:row.status||'',degree:row.degree||'',credentialed:row.credentialed||'',npi:row.npi||'',licenseNumber:row.license_number||'',taxIdMasked:row.tax_id_masked||'',medicare:row.medicare||'',medicaid:row.medicaid||'',dea:row.dea||'',caqh:row.caqh||'',payerCredentialing:row.payer_credentialing||'',email:row.email||'',hospital:row.hospital||'',providerNumber:row.provider_number||'',address:row.address||'',sourceAttachments:parseJson(row.attachments_json,[]),sourceRecordUrl:row.source_record_url||'',source:'EM-MSO · ROSTER - PROVIDERS',initials:[row.name,row.last_name].filter(Boolean).map(value=>value[0]).join('').toUpperCase(),role:row.credentialed||row.degree||'Provider',entity:(row.credentialed||'').toLowerCase().includes('research')?'Eastern Medical Research':'Provider Network',lifecycle:(row.status||'').toLowerCase()==='active'?'active':'inactive',workMode:'onsite',compliance:(row.status||'').toLowerCase()==='active'?'review':'archived',license:`${row.degree||'Credential'} · Airtable`});
const mapContract=row=>({id:row.record_id,recordId:row.record_id,insurance:row.insurance,partner:row.insurance,status:(row.status||'unknown').toLowerCase()==='in progress'?'progress':(row.status||'unknown').toLowerCase(),notes:row.notes||'',products:row.products||'',ideas:row.ideas||'',attachments:parseJson(row.attachments_json,[]),attachmentCount:parseJson(row.attachments_json,[]).length,sourceRecordUrl:row.source_record_url||'',source:'EM-MSO · Insurance Contracts'});
const mapLicense=row=>({recordId:row.record_id,title:row.title,entity:row.entity||'',type:row.category||'',number:row.license_number||'',status:row.status||'',expires:row.expires_on||'',owner:row.owner||'',fields:parseJson(row.fields_json,{}),attachments:parseJson(row.attachments_json,[]),sourceRecordUrl:row.source_record_url||'',source:'EM-MSO · LICENSING'});
const mapEntity=row=>({recordId:row.record_id,tableName:row.table_name,title:row.title,fields:parseJson(row.fields_json,{}),attachments:parseJson(row.attachments_json,[]),sourceRecordUrl:row.source_record_url||''});

export function getOperationalSnapshot(){
  const database=openDatabase();
  try{
    const statusRow=database.prepare('SELECT * FROM operational_airtable_status WHERE id = 1').get();
    const storedProviders=database.prepare('SELECT * FROM operational_providers ORDER BY CASE WHEN status = \'ACTIVE\' THEN 0 ELSE 1 END, name, last_name').all().map(mapProvider);
    const storedContracts=database.prepare('SELECT * FROM operational_contracts ORDER BY insurance').all().map(mapContract);
    const storedLicenses=database.prepare('SELECT * FROM operational_licenses ORDER BY title').all().map(mapLicense);
    const entities=database.prepare('SELECT * FROM operational_entities ORDER BY table_name, title').all().map(mapEntity);
    // Keep the verified EM-MSO snapshot on the server only until the protected
    // Airtable sync populates SQLite. The client bundle never imports this data.
    const providers=storedProviders.length?storedProviders:emmsoProviderSnapshot;
    const contracts=storedContracts.length?storedContracts:emmsoContractSnapshot;
    const licenses=storedLicenses.length?storedLicenses:emmsoLicenseSnapshot;
    return {status:statusRow?{source:statusRow.source_name,baseId:statusRow.base_id,state:statusRow.state,message:statusRow.message||'',syncedAt:statusRow.synced_at||'',tableCounts:parseJson(statusRow.table_counts_json,{})}:emmsoSourceStatus,providers,contracts,licenses,entities};
  }finally{database.close()}
}

export function replaceOperationalSnapshot(snapshot){
  const database=openDatabase();
  const syncedAt=snapshot.syncedAt||new Date().toISOString();
  try{
    database.exec('BEGIN IMMEDIATE');
    database.exec('DELETE FROM operational_providers; DELETE FROM operational_contracts; DELETE FROM operational_licenses; DELETE FROM operational_entities;');
    const providerInsert=database.prepare('INSERT INTO operational_providers (record_id,name,last_name,status,degree,credentialed,npi,license_number,tax_id_masked,medicare,medicaid,dea,caqh,payer_credentialing,email,hospital,provider_number,address,attachments_json,source_record_url,synced_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    for(const item of snapshot.providers||[])providerInsert.run(item.recordId,item.name||'',item.lastName||'',item.status||'',item.degree||'',item.credentialed||'',item.npi||'',item.licenseNumber||'',item.taxIdMasked||'',item.medicare||'',item.medicaid||'',item.dea||'',item.caqh||'',item.payerCredentialing||'',item.email||'',item.hospital||'',item.providerNumber||'',item.address||'',JSON.stringify(item.attachments||[]),item.sourceRecordUrl||'',syncedAt);
    const contractInsert=database.prepare('INSERT INTO operational_contracts (record_id,insurance,status,notes,products,ideas,attachments_json,source_record_url,synced_at) VALUES (?,?,?,?,?,?,?,?,?)');
    for(const item of snapshot.contracts||[])contractInsert.run(item.recordId,item.insurance||'Untitled',item.status||'',item.notes||'',item.products||'',item.ideas||'',JSON.stringify(item.attachments||[]),item.sourceRecordUrl||'',syncedAt);
    const licenseInsert=database.prepare('INSERT INTO operational_licenses (record_id,title,category,entity,license_number,status,expires_on,owner,fields_json,attachments_json,source_record_url,synced_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    for(const item of snapshot.licenses||[])licenseInsert.run(item.recordId,item.title||'Untitled',item.category||'',item.entity||'',item.licenseNumber||'',item.status||'',item.expiresOn||'',item.owner||'',JSON.stringify(item.fields||{}),JSON.stringify(item.attachments||[]),item.sourceRecordUrl||'',syncedAt);
    const entityInsert=database.prepare('INSERT INTO operational_entities (record_id,table_name,title,fields_json,attachments_json,source_record_url,synced_at) VALUES (?,?,?,?,?,?,?)');
    for(const item of snapshot.entities||[])entityInsert.run(item.recordId,item.tableName||'',item.title||'Untitled',JSON.stringify(item.fields||{}),JSON.stringify(item.attachments||[]),item.sourceRecordUrl||'',syncedAt);
    database.prepare('INSERT INTO operational_airtable_status (id,base_id,source_name,state,message,synced_at,table_counts_json) VALUES (1,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET base_id=excluded.base_id,source_name=excluded.source_name,state=excluded.state,message=excluded.message,synced_at=excluded.synced_at,table_counts_json=excluded.table_counts_json').run(snapshot.baseId||'appCtkLVbC33nRuh1','Airtable · EM-MSO','connected','Official Airtable API synchronization completed.',syncedAt,JSON.stringify(snapshot.tableCounts||{}));
    database.exec('COMMIT');
  }catch(error){database.exec('ROLLBACK');throw error}finally{database.close()}
  return getOperationalSnapshot();
}

export function setOperationalSyncError(message){
  const database=openDatabase();
  try{database.prepare('INSERT INTO operational_airtable_status (id,base_id,source_name,state,message,synced_at,table_counts_json) VALUES (1,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,message=excluded.message').run('appCtkLVbC33nRuh1','Airtable · EM-MSO','permission-required',String(message||'Synchronization failed').slice(0,1000),'','{}')}finally{database.close()}
}

export function getOperationalAttachment(id){
  const snapshot=getOperationalSnapshot();
  const entityPermission=item=>{
    const value=`${item.tableName||''} ${item.title||''}`.toLowerCase();
    if(value.includes('research'))return 'entity-research';
    if(value.includes('aesthetic'))return 'entity-aesthetics';
    if(value.includes('seven'))return 'entity-seven';
    if(value.includes('305'))return 'entity-care305';
    return 'entity-medical';
  };
  const all=[
    ...snapshot.providers.flatMap(item=>(item.sourceAttachments||[]).map(attachment=>({...attachment,ownerEmail:item.email||'',permissionKeys:['human-resources','doctor-licenses','licenses',item.entity==='Eastern Medical Research'?'entity-research':'entity-medical']}))),
    ...snapshot.contracts.flatMap(item=>(item.attachments||[]).map(attachment=>({...attachment,permissionKeys:['contracting']}))),
    ...snapshot.licenses.flatMap(item=>(item.attachments||[]).map(attachment=>({...attachment,permissionKeys:['licenses','doctor-licenses']}))),
    ...snapshot.entities.flatMap(item=>(item.attachments||[]).map(attachment=>({...attachment,permissionKeys:[entityPermission(item)]}))),
  ];
  const attachment=all.find(item=>item.id===id);
  if(!attachment?.relativePath)return null;
  const filePath=path.resolve(privateRoot,attachment.relativePath);
  if(!filePath.startsWith(`${attachmentRoot}${path.sep}`))return null;
  return {...attachment,filePath};
}
