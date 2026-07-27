import { createWriteStream } from 'node:fs';
import { chmod, mkdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { replaceOperationalSnapshot, setOperationalSyncError } from './operational-airtable-store.mjs';

const apiRoot='https://api.airtable.com/v0';
const defaultBaseId='appCtkLVbC33nRuh1';
const shareRoot='https://airtable.com/appCtkLVbC33nRuh1/shrEiLgWd1FJvHWdJ';
const privateRoot=path.resolve('private');
const attachmentRoot=path.join(privateRoot,'operational-airtable-attachments');
const excludedFieldPattern=/\b(ssn|social security|dob|date of birth|personal doc|bank|routing|account number|password|secret)\b/i;
const entityTableNames=new Set(['EM FM','EMG PORTABLE','305 MED CARE','EM Center','EM Group','OFFICE ROSTER INFORMATION','MSO','W9\'S','DOCUMENTS PLATE']);

const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const safeSegment=value=>String(value||'file').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'file';
const cleanValue=value=>Array.isArray(value)?value.join(', '):value===null||value===undefined?'':String(value);
const maskIdentifier=value=>{const text=cleanValue(value).replace(/\s+/g,'');return text?`••••${text.slice(-4)}`:''};
const findField=(fields,...names)=>{for(const name of names){const match=Object.entries(fields).find(([key])=>key.trim().toLowerCase()===name.toLowerCase());if(match)return match[1]}return ''};
const recordTitle=(table,record)=>cleanValue(record.fields?.[table.primaryFieldName]||Object.values(record.fields||{}).find(value=>typeof value==='string')||record.id);
const sourceUrl=(tableId,viewId,recordId)=>`${shareRoot}/${tableId}/${viewId||''}/${recordId}?blocks=bipLH6GwhbnK9ZIh3`;

async function airtableJson(url,headers,attempt=0){
  const response=await fetch(url,{headers});
  if(response.status===429&&attempt<6){await wait(500*2**attempt);return airtableJson(url,headers,attempt+1)}
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){const type=payload?.error?.type||`HTTP_${response.status}`;throw new Error(`${type}: Airtable token does not have access to EM-MSO (${defaultBaseId}). Grant the token data.records:read and schema.bases:read for this base.`)}
  return payload;
}

async function readRecords(baseId,tableId,headers){
  const records=[];let offset='';
  do{
    const query=new URLSearchParams({pageSize:'100',cellFormat:'json'});if(offset)query.set('offset',offset);
    const page=await airtableJson(`${apiRoot}/${baseId}/${encodeURIComponent(tableId)}?${query}`,headers);
    records.push(...(page.records||[]));offset=page.offset||'';if(offset)await wait(220);
  }while(offset);
  return records;
}

async function downloadAttachment(tableName,recordId,fieldName,item){
  if(!item?.id||!item?.url||!item?.filename)return null;
  const directory=path.join(attachmentRoot,safeSegment(tableName),safeSegment(recordId));
  await mkdir(directory,{recursive:true,mode:0o700});
  const filename=`${safeSegment(item.id)}-${safeSegment(item.filename)}`;
  const destination=path.join(directory,filename);
  const existing=await stat(destination).catch(()=>null);
  if(!existing||item.size&&existing.size!==item.size){
    const temporary=`${destination}.partial`;
    const response=await fetch(item.url);
    if(!response.ok||!response.body)throw new Error(`Unable to download Airtable attachment ${item.filename}: HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(temporary,{mode:0o600}));
    await rename(temporary,destination);await chmod(destination,0o600);
  }
  const fileStat=await stat(destination);
  return {id:item.id,filename:item.filename,type:item.type||'application/octet-stream',size:item.size||fileStat.size,fieldName,relativePath:path.relative(privateRoot,destination)};
}

async function attachmentsFor(tableName,record,allowedFields){
  const attachments=[];
  for(const [fieldName,value] of Object.entries(record.fields||{})){
    if(excludedFieldPattern.test(fieldName)||allowedFields&&!allowedFields.has(fieldName)||!Array.isArray(value))continue;
    for(const item of value){const downloaded=await downloadAttachment(tableName,record.id,fieldName,item);if(downloaded)attachments.push(downloaded)}
  }
  return attachments;
}

const safeFields=fields=>Object.fromEntries(Object.entries(fields||{}).filter(([name])=>!excludedFieldPattern.test(name)).map(([name,value])=>[name,Array.isArray(value)&&value.some(item=>item?.url)?value.map(item=>item.filename).filter(Boolean):value]));

export async function syncOperationalAirtable(){
  const token=process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId=process.env.AIRTABLE_EMMSO_BASE_ID||defaultBaseId;
  if(!token){const message='AIRTABLE_PERSONAL_ACCESS_TOKEN is missing.';setOperationalSyncError(message);throw new Error(message)}
  const headers={Authorization:`Bearer ${token}`};
  try{
    await mkdir(attachmentRoot,{recursive:true,mode:0o700});
    const schema=await airtableJson(`${apiRoot}/meta/bases/${baseId}/tables`,headers);
    const tables=(schema.tables||[]).map(table=>({...table,primaryFieldName:table.fields.find(field=>field.id===table.primaryFieldId)?.name||table.fields[0]?.name||''}));
    const byName=new Map(tables.map(table=>[table.name.toLowerCase(),table]));
    const providersTable=byName.get('roster - providers');
    const contractsTable=byName.get('insurance contracts');
    const licensingTable=byName.get('licensing');
    if(!providersTable||!contractsTable)throw new Error('EM-MSO schema is missing ROSTER - PROVIDERS or Insurance Contracts.');
    const viewId=table=>table.views?.[0]?.id||'';
    const providerRecords=await readRecords(baseId,providersTable.id,headers);
    const contractRecords=await readRecords(baseId,contractsTable.id,headers);
    const licenseRecords=licensingTable?await readRecords(baseId,licensingTable.id,headers):[];
    const providers=[];
    for(const record of providerRecords){
      const fields=record.fields||{};
      providers.push({recordId:record.id,name:cleanValue(findField(fields,'Name')),lastName:cleanValue(findField(fields,'Last Name')),status:cleanValue(findField(fields,'STATUS')),degree:cleanValue(findField(fields,'DEGREE')),credentialed:cleanValue(findField(fields,'CREDENTIALED')),npi:cleanValue(findField(fields,'NPI')),licenseNumber:cleanValue(findField(fields,'LICENSE')),taxIdMasked:maskIdentifier(findField(fields,'TAX ID')),medicare:cleanValue(findField(fields,'MEDICARE')),medicaid:cleanValue(findField(fields,'MEDICAID')),dea:cleanValue(findField(fields,'DEA')),caqh:cleanValue(findField(fields,'CAQH ID')),payerCredentialing:cleanValue(findField(fields,'PAYER CRED')),email:cleanValue(findField(fields,'email')),hospital:cleanValue(findField(fields,'HOSPITAL ASSOCIATE')),providerNumber:cleanValue(findField(fields,'PN')),address:cleanValue(findField(fields,'Address')),attachments:await attachmentsFor(providersTable.name,record,new Set(['Contract Attachments','ROSTER AHCA Attachment','LICENSES'])),sourceRecordUrl:sourceUrl(providersTable.id,viewId(providersTable),record.id)});
    }
    const contracts=[];
    for(const record of contractRecords){const fields=record.fields||{};contracts.push({recordId:record.id,insurance:cleanValue(findField(fields,'Insurance'))||recordTitle(contractsTable,record),status:cleanValue(findField(fields,'Status')),notes:cleanValue(findField(fields,'NOTES')),products:cleanValue(findField(fields,'Products')),ideas:cleanValue(findField(fields,'IDEAS')),attachments:await attachmentsFor(contractsTable.name,record,new Set(['Attachments','CREDENTIAL'])),sourceRecordUrl:sourceUrl(contractsTable.id,viewId(contractsTable),record.id)})}
    const licenses=[];
    for(const record of licenseRecords){const fields=record.fields||{};licenses.push({recordId:record.id,title:recordTitle(licensingTable,record),category:cleanValue(findField(fields,'Type','Category','License Type')),entity:cleanValue(findField(fields,'Entity','Office','Location')),licenseNumber:cleanValue(findField(fields,'License Number','License','Number')),status:cleanValue(findField(fields,'Status')),expiresOn:cleanValue(findField(fields,'Expiration','Expiration Date','Expires')),owner:cleanValue(findField(fields,'Owner','Responsible')),fields:safeFields(fields),attachments:await attachmentsFor(licensingTable.name,record),sourceRecordUrl:sourceUrl(licensingTable.id,viewId(licensingTable),record.id)})}
    const entities=[];const tableCounts={};
    for(const table of tables){
      if(!entityTableNames.has(table.name))continue;
      const records=await readRecords(baseId,table.id,headers);tableCounts[table.name]=records.length;
      for(const record of records)entities.push({recordId:record.id,tableName:table.name,title:recordTitle(table,record),fields:safeFields(record.fields),attachments:await attachmentsFor(table.name,record),sourceRecordUrl:sourceUrl(table.id,viewId(table),record.id)});
    }
    Object.assign(tableCounts,{[providersTable.name]:providers.length,[contractsTable.name]:contracts.length,...(licensingTable?{[licensingTable.name]:licenses.length}:{})});
    return replaceOperationalSnapshot({baseId,syncedAt:new Date().toISOString(),tableCounts,providers,contracts,licenses,entities});
  }catch(error){setOperationalSyncError(error.message);throw error}
}
