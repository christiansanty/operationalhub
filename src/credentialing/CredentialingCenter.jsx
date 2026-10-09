import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, Building2, CheckCircle2, ChevronRight, ExternalLink, FileText,
  IdCard, KeyRound, RefreshCw, Search, ShieldCheck, Stethoscope, UsersRound, X,
} from 'lucide-react';
import './credentialing-center.css';

const entities = [
  { id:'all', name:{ en:'All entities', es:'Todas las entidades' }, table:'' },
  { id:'center', name:{ en:'Eastern Medical Center', es:'Eastern Medical Center' }, table:'EM Center', aliases:['eastern medical center','em center','coral way'] },
  { id:'group', name:{ en:'Eastern Medical Group', es:'Eastern Medical Group' }, table:'EM Group', aliases:['eastern medical group','em group','hialeah'] },
  { id:'care305', name:{ en:'305 Medical Care', es:'305 Medical Care' }, table:'305 MED CARE', aliases:['305 medical care','305 med care','305'] },
  { id:'fort-myers', name:{ en:'Eastern Medical Fort Myers', es:'Eastern Medical Fort Myers' }, table:'EM FM', aliases:['eastern medical fort myers','em fm','fort myers'] },
];

const portalLinks = [
  { name:'Availity Essentials', description:{ en:'Eligibility, claims and payer workflows', es:'Elegibilidad, claims y gestiones con planes' }, href:'https://www.availity.com/' },
  { name:'CAQH Provider Data Portal', description:{ en:'Provider profiles and attestations', es:'Perfiles y attestations de personal médico' }, href:'https://proview.caqh.org/' },
  { name:'CMS PECOS', description:{ en:'Medicare enrollment and reassignment', es:'Inscripción y reassignment de Medicare' }, href:'https://pecos.cms.hhs.gov/pecos/login.do' },
  { name:'Florida Medicaid Portal', description:{ en:'Florida Medicaid provider access', es:'Acceso de personal médico a Florida Medicaid' }, href:'https://portal.flmmis.com/FLPublic/Provider_Login/tabId/48/Default.aspx' },
];

const text = value => Array.isArray(value) ? value.join(', ') : String(value ?? '').trim();
const normalizeStatus = value => {
  const normalized=text(value).toLowerCase();
  if(['inactive','inactivo','terminated','expired','cancelled','canceled'].some(item=>normalized.includes(item)))return 'inactive';
  if(['active','activo','approved','participating','credentialed'].some(item=>normalized.includes(item)))return 'active';
  if(['progress','pending','process','credentialing'].some(item=>normalized.includes(item)))return 'progress';
  return normalized||'unknown';
};
const fieldValue = (fields, ...names) => {
  const entries=Object.entries(fields||{});
  for(const name of names){const match=entries.find(([key])=>key.trim().toLowerCase()===name.toLowerCase());if(match)return text(match[1])}
  return '';
};
const entityForProvider = provider => {
  const source=`${provider.credentialed||''} ${provider.entity||''} ${provider.address||''}`.toLowerCase();
  return entities.slice(1).filter(entity=>entity.aliases.some(alias=>source.includes(alias)));
};
const payerList = provider => [...new Set(text(provider.payerCredentialing).split(/[\n,;|]+/).map(item=>item.trim()).filter(Boolean))];
const attachmentUrl = id => `/api/operational/airtable/attachments/${encodeURIComponent(id)}`;
const attachmentName = file => typeof file==='object' ? text(file?.filename||file?.name||'Attachment') : text(file);

function SourceBanner({ lang, sourceStatus, canManage, refreshing, onRefresh }) {
  const isEn=lang==='en';
  return <section className={`credential-source ${sourceStatus?.state==='connected'?'connected':''}`}>
    <span className="credential-source-mark">A</span>
    <div><strong>{sourceStatus?.state==='connected'?(isEn?'EM-MSO synchronization is active':'La sincronización EM-MSO está activa'):(isEn?'EM-MSO source is ready for protected synchronization':'La fuente EM-MSO está lista para sincronización protegida')}</strong><p>{sourceStatus?.syncedAt?`${isEn?'Last refresh':'Última actualización'}: ${new Date(sourceStatus.syncedAt).toLocaleString(isEn?'en-US':'es-US')}`:(isEn?'Connect the server token to download current records and original PDFs.':'Conecta el token del servidor para descargar los registros y PDF originales.')}</p></div>
    {canManage&&<button onClick={onRefresh} disabled={refreshing}><RefreshCw className={refreshing?'spinning':''}/>{refreshing?(isEn?'Refreshing…':'Actualizando…'):(isEn?'Refresh Airtable':'Actualizar Airtable')}</button>}
  </section>;
}

function EntitySelector({ lang, value, onChange }) {
  return <label className="credential-entity-select"><Building2/><span>{lang==='en'?'Entity':'Entidad'}</span><select value={value} onChange={event=>onChange(event.target.value)}>{entities.map(entity=><option key={entity.id} value={entity.id}>{entity.name[lang]}</option>)}</select></label>;
}

export default function CredentialingCenter({ lang='en', providers=[], entities:entityRows=[], sourceStatus={}, canManage=false, onSnapshot }) {
  const isEn=lang==='en';
  const [query,setQuery]=useState('');
  const [entity,setEntity]=useState('all');
  const [selected,setSelected]=useState(null);
  const [refreshing,setRefreshing]=useState(false);
  const [message,setMessage]=useState('');
  const selectedEntity=entities.find(item=>item.id===entity);
  const entityContracts=useMemo(()=>entityRows.filter(item=>entities.slice(1).some(entityItem=>entityItem.table===item.tableName)),[entityRows]);
  const visible=providers.filter(provider=>{
    const assigned=entityForProvider(provider);
    const entityMatches=entity==='all'||assigned.some(item=>item.id===entity);
    const searchable=`${provider.name||''} ${provider.degree||''} ${provider.npi||''} ${provider.payerCredentialing||''} ${provider.credentialed||''}`.toLowerCase();
    return entityMatches&&searchable.includes(query.trim().toLowerCase());
  });
  const withPlans=visible.filter(provider=>payerList(provider).length).length;
  const active=visible.filter(provider=>normalizeStatus(provider.status||provider.lifecycle)==='active').length;
  const refresh=async()=>{
    setRefreshing(true);setMessage('');
    try{const response=await fetch('/api/operational/airtable/refresh',{method:'POST'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Refresh failed');onSnapshot?.(payload.snapshot);setMessage(isEn?'Airtable data and attachments were refreshed.':'Se actualizaron los datos y adjuntos de Airtable.')}catch(error){setMessage(error.message)}finally{setRefreshing(false)}
  };
  return <div className="page credentialing-page">
    <header className="credential-page-title"><div><span><ShieldCheck/> SHARED OPERATIONS · EM-MSO</span><h1>{isEn?'Provider Credentialing':'Credencialización Médica'}</h1><p>{isEn?'Verify which medical professionals participate with each health plan, by legal entity, from one controlled workspace.':'Verifica qué personal médico participa con cada plan de salud, por entidad legal, desde un solo espacio controlado.'}</p></div><EntitySelector lang={lang} value={entity} onChange={setEntity}/></header>
    <SourceBanner lang={lang} sourceStatus={sourceStatus} canManage={canManage} refreshing={refreshing} onRefresh={refresh}/>
    {message&&<div className={`credential-message ${message.toLowerCase().includes('failed')||message.toLowerCase().includes('missing')?'error':''}`}><CheckCircle2/>{message}</div>}
    <section className="credential-metrics"><article><UsersRound/><div><span>{isEn?'Medical professionals':'Personal médico'}</span><strong>{visible.length}</strong></div></article><article><CheckCircle2/><div><span>{isEn?'Active records':'Registros activos'}</span><strong>{active}</strong></div></article><article><IdCard/><div><span>{isEn?'Payer list recorded':'Planes registrados'}</span><strong>{withPlans}</strong></div></article><article><FileText/><div><span>{isEn?'Entity contract records':'Contratos por entidad'}</span><strong>{entity==='all'?entityContracts.length:entityContracts.filter(item=>item.tableName===selectedEntity?.table).length}</strong></div></article></section>
    <section className="credential-portals"><header><div><span>{isEn?'AUTHORIZED PORTALS':'PORTALES AUTORIZADOS'}</span><h2>{isEn?'Credentialing access points':'Accesos para credencialización'}</h2><p>{isEn?'Credentials are never stored in the Hub. Each portal opens its own secure sign-in.':'Las credenciales nunca se guardan en el Hub. Cada portal abre su propio acceso seguro.'}</p></div><KeyRound/></header><div>{portalLinks.map(portal=><a key={portal.name} href={portal.href} target="_blank" rel="noreferrer"><span><strong>{portal.name}</strong><small>{portal.description[lang]}</small></span><ExternalLink/></a>)}</div></section>
    <div className="credential-toolbar"><div className="search-box"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={isEn?'Search doctor, NPI, plan or credential…':'Buscar doctor, NPI, plan o credencial…'}/></div><small>{visible.length} {isEn?'matching records':'registros coincidentes'}</small></div>
    <section className="credential-directory">
      <div className="credential-table-head"><span>{isEn?'Medical professional':'Personal médico'}</span><span>{isEn?'Entity affiliation':'Entidad afiliada'}</span><span>{isEn?'Credentialed plans':'Planes credencializados'}</span><span>{isEn?'Record':'Expediente'}</span></div>
      {visible.map(provider=>{const plans=payerList(provider);const assigned=entityForProvider(provider);const providerStatus=normalizeStatus(provider.status||provider.lifecycle);return <button key={provider.recordId||provider.name} className="credential-row" onClick={()=>setSelected(provider)}><span className="credential-person"><i>{provider.initials||'MD'}</i><span><strong>{provider.name}</strong><small>{provider.degree||(isEn?'Medical staff':'Personal médico')}{provider.npi?` · NPI ${provider.npi}`:''}</small></span></span><span className="credential-entities">{assigned.length?assigned.map(item=><b key={item.id}>{item.name[lang]}</b>):<em>{isEn?'Not specified in source':'No especificada en la fuente'}</em>}</span><span className="credential-payers">{plans.length?plans.slice(0,4).map(plan=><b key={plan}>{plan}</b>):<em>{isEn?'Payer list pending':'Lista de planes pendiente'}</em>}{plans.length>4&&<small>+{plans.length-4}</small>}</span><span className="credential-record-state"><b className={providerStatus}>{providerStatus==='active'?(isEn?'Active':'Activo'):providerStatus==='inactive'?(isEn?'Inactive':'Inactivo'):(provider.status||(isEn?'Review':'Revisar'))}</b><ChevronRight/></span></button>})}
      {!visible.length&&<div className="credential-empty"><AlertTriangle/><h2>{isEn?'No matching credential records':'No hay credenciales coincidentes'}</h2><p>{isEn?'Change the entity or search. Missing affiliations must be completed in EM-MSO.':'Cambia la entidad o la búsqueda. Las afiliaciones faltantes deben completarse en EM-MSO.'}</p></div>}
    </section>
    {selected&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setSelected(null)}><section className="quick-modal credential-detail"><header><div><span>{isEn?'PROVIDER CREDENTIAL RECORD':'EXPEDIENTE DE CREDENCIALIZACIÓN'}</span><h2>{selected.name}</h2><p>{selected.degree||'—'}{selected.npi?` · NPI ${selected.npi}`:''}</p></div><button onClick={()=>setSelected(null)}><X/></button></header><div className="credential-detail-grid"><article><span>{isEn?'STATUS':'ESTADO'}</span><strong>{selected.status||selected.lifecycle||'—'}</strong></article><article><span>CAQH</span><strong>{selected.caqh||'—'}</strong></article><article><span>MEDICARE</span><strong>{selected.medicare||'—'}</strong></article><article><span>MEDICAID</span><strong>{selected.medicaid||'—'}</strong></article></div><section><span>{isEn?'ENTITY AFFILIATIONS':'AFILIACIONES DE ENTIDAD'}</span><div className="credential-modal-tags">{entityForProvider(selected).map(item=><b key={item.id}>{item.name[lang]}</b>)}</div></section><section><span>{isEn?'PAYER CREDENTIALING':'CREDENCIALIZACIÓN CON PLANES'}</span><div className="credential-modal-tags">{payerList(selected).map(plan=><b key={plan}>{plan}</b>)}{!payerList(selected).length&&<p>{isEn?'No payer list is recorded in the current Airtable field.':'No hay planes registrados en el campo actual de Airtable.'}</p>}</div></section><section><span>{isEn?'SOURCE DOCUMENTS':'DOCUMENTOS FUENTE'}</span><div className="credential-documents">{(selected.sourceAttachments||[]).map((file,index)=>typeof file==='object'&&file.id?<a key={file.id} href={attachmentUrl(file.id)} target="_blank" rel="noreferrer"><FileText/><span>{attachmentName(file)}</span><ExternalLink/></a>:<div key={`${attachmentName(file)}-${index}`}><FileText/><span>{attachmentName(file)}</span><small>{isEn?'Awaiting protected import':'Pendiente de importación protegida'}</small></div>)}{!(selected.sourceAttachments||[]).length&&<p>{isEn?'No provider attachment has been imported for this record.':'No se ha importado un adjunto para este expediente.'}</p>}</div></section><footer><button onClick={()=>setSelected(null)}>{isEn?'Close':'Cerrar'}</button>{selected.sourceRecordUrl&&<a href={selected.sourceRecordUrl} target="_blank" rel="noreferrer">{isEn?'Open Airtable record':'Abrir registro en Airtable'}<ExternalLink/></a>}</footer></section></div>}
  </div>;
}

export function ContractingCenter({ lang='en', contracts=[], entities:entityRows=[], sourceStatus={}, canManage=false, onSnapshot }) {
  const isEn=lang==='en';
  const [query,setQuery]=useState('');const [entity,setEntity]=useState('all');const [filter,setFilter]=useState('all');const [selected,setSelected]=useState(null);const [overrides,setOverrides]=useState({});const [saving,setSaving]=useState('');const [refreshing,setRefreshing]=useState(false);const [message,setMessage]=useState('');
  const entityContracts=useMemo(()=>entityRows.filter(item=>entities.slice(1).some(entityItem=>entityItem.table===item.tableName)).map(item=>({
    ...item,id:item.recordId,insurance:item.title,partner:item.title,entity:entities.find(entityItem=>entityItem.table===item.tableName)?.name?.[lang]||item.tableName,
    status:normalizeStatus(overrides[item.recordId]||item.status||fieldValue(item.fields,'Status')),
    products:fieldValue(item.fields,'PRODUCTS','PRODUCT','Products'),notes:fieldValue(item.fields,'NOTES','Notes'),attachments:item.attachments||[],attachmentCount:item.attachments?.length||0,
  })),[entityRows,lang,overrides]);
  const masterContracts=contracts.map(item=>({...item,recordId:item.recordId||item.id,id:item.id||item.recordId,entity:isEn?'Master insurance library':'Biblioteca maestra',status:normalizeStatus(overrides[item.recordId||item.id]||item.status)}));
  const allRows=entity==='all'?[...masterContracts,...entityContracts]:entityContracts.filter(item=>item.tableName===entities.find(entityItem=>entityItem.id===entity)?.table);
  const rows=allRows.filter(row=>(filter==='all'||row.status===filter)&&`${row.insurance||row.partner} ${row.products||''} ${row.notes||''} ${row.entity||''}`.toLowerCase().includes(query.toLowerCase()));
  const setStatus=async(row,status)=>{setSaving(row.recordId);setMessage('');try{const response=await fetch(`/api/operational/contracts/${encodeURIComponent(row.recordId)}/status`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Unable to update status');setOverrides(current=>({...current,[row.recordId]:payload.contract.status}));setSelected(current=>current?.recordId===row.recordId?{...current,status:payload.contract.status}:current);setMessage(isEn?'Contract status saved.':'Estado del contrato guardado.')}catch(error){setMessage(error.message)}finally{setSaving('')}};
  const refresh=async()=>{setRefreshing(true);setMessage('');try{const response=await fetch('/api/operational/airtable/refresh',{method:'POST'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Refresh failed');onSnapshot?.(payload.snapshot);setMessage(isEn?'Contracts and original PDFs were refreshed from Airtable.':'Se actualizaron desde Airtable los contratos y PDF originales.')}catch(error){setMessage(error.message)}finally{setRefreshing(false)}};
  const attachmentCount=allRows.reduce((total,row)=>total+(row.attachments?.length||0),0);
  return <div className="page credentialing-page contracting-center-page">
    <header className="credential-page-title"><div><span><FileText/> AIRTABLE · EM-MSO</span><h1>{isEn?'Insurance Contracting':'Contratos con Aseguradoras'}</h1><p>{isEn?'Original agreements, products and participation status organized by legal entity.':'Contratos originales, productos y estado de participación organizados por entidad legal.'}</p></div><EntitySelector lang={lang} value={entity} onChange={setEntity}/></header>
    <SourceBanner lang={lang} sourceStatus={sourceStatus} canManage={canManage} refreshing={refreshing} onRefresh={refresh}/>
    {message&&<div className="credential-message"><CheckCircle2/>{message}</div>}
    <section className="credential-metrics"><article><FileText/><div><span>{isEn?'Visible agreements':'Acuerdos visibles'}</span><strong>{allRows.length}</strong></div></article><article><CheckCircle2/><div><span>{isEn?'Active':'Activos'}</span><strong>{allRows.filter(row=>row.status==='active').length}</strong></div></article><article><AlertTriangle/><div><span>{isEn?'Inactive':'Inactivos'}</span><strong>{allRows.filter(row=>row.status==='inactive').length}</strong></div></article><article><FileText/><div><span>{isEn?'Original files':'Archivos originales'}</span><strong>{attachmentCount}</strong></div></article></section>
    <div className="credential-toolbar contracting-toolbar"><div className="search-box"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={isEn?'Search payer, product, entity or note…':'Buscar plan, producto, entidad o nota…'}/></div><div className="credential-filter-pills">{['all','active','inactive','progress'].map(value=><button key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{value==='all'?(isEn?'All':'Todos'):value==='active'?(isEn?'Active':'Activos'):value==='inactive'?(isEn?'Inactive':'Inactivos'):(isEn?'In progress':'En proceso')}</button>)}</div></div>
    <section className="contract-center-table"><div className="contract-center-head"><span>{isEn?'Payer / agreement':'Plan / contrato'}</span><span>{isEn?'Entity':'Entidad'}</span><span>{isEn?'Products':'Productos'}</span><span>{isEn?'Participation status':'Estado de participación'}</span><span>{isEn?'PDFs':'PDF'}</span></div>{rows.map(row=><article key={`${row.tableName||'master'}-${row.recordId}`} onClick={()=>setSelected(row)}><div><strong>{row.insurance||row.partner}</strong><small>{row.tableName?`EM-MSO · ${row.tableName}`:'EM-MSO · Insurance Contracts'}</small></div><span>{row.entity}</span><p>{row.products||'—'}</p><div className="contract-status-toggle" onClick={event=>event.stopPropagation()}><button disabled={!canManage||saving===row.recordId} className={row.status==='active'?'active':''} onClick={()=>setStatus(row,'active')}><i/>{isEn?'Active':'Activo'}</button><button disabled={!canManage||saving===row.recordId} className={row.status==='inactive'?'inactive':''} onClick={()=>setStatus(row,'inactive')}><i/>{isEn?'Inactive':'Inactivo'}</button></div><button className="contract-file-count" aria-label={isEn?'Open contract':'Abrir contrato'}><FileText/>{row.attachments?.length||0}<ChevronRight/></button></article>)}{!rows.length&&<div className="credential-empty"><AlertTriangle/><h2>{isEn?'No matching agreements':'No hay contratos coincidentes'}</h2><p>{isEn?'Change the entity, status or search.':'Cambia la entidad, el estado o la búsqueda.'}</p></div>}</section>
    {!canManage&&<p className="contract-readonly"><ShieldCheck/>{isEn?'You have View access. A Contracting manager can change Active / Inactive status.':'Tienes acceso de lectura. Un manager de Contracting puede cambiar el estado Activo / Inactivo.'}</p>}
    {selected&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setSelected(null)}><section className="quick-modal credential-detail contract-center-detail"><header><div><span>{selected.tableName?`AIRTABLE · ${selected.tableName}`:'AIRTABLE · INSURANCE CONTRACTS'}</span><h2>{selected.insurance||selected.partner}</h2><p>{selected.entity}</p></div><button onClick={()=>setSelected(null)}><X/></button></header><div className="credential-detail-grid"><article><span>{isEn?'STATUS':'ESTADO'}</span><strong>{selected.status||'—'}</strong></article><article><span>{isEn?'ORIGINAL PDFS':'PDF ORIGINALES'}</span><strong>{selected.attachments?.length||0}</strong></article></div>{selected.products&&<section><span>{isEn?'PRODUCTS / PLANS':'PRODUCTOS / PLANES'}</span><p>{selected.products}</p></section>}{selected.notes&&<section><span>{isEn?'CONTRACTING NOTES':'NOTAS DE CONTRACTING'}</span><p>{selected.notes}</p></section>}<section><span>{isEn?'ORIGINAL CONTRACT DOCUMENTS':'DOCUMENTOS ORIGINALES DEL CONTRATO'}</span><div className="credential-documents">{(selected.attachments||[]).map((file,index)=>typeof file==='object'&&file.id?<a key={file.id} href={attachmentUrl(file.id)} target="_blank" rel="noreferrer"><FileText/><span>{attachmentName(file)}</span><ExternalLink/></a>:<div key={`${attachmentName(file)}-${index}`}><FileText/><span>{attachmentName(file)}</span><small>{isEn?'Awaiting protected import':'Pendiente de importación protegida'}</small></div>)}{!(selected.attachments||[]).length&&<p>{isEn?'No PDF has been imported for this Airtable record yet. Refresh Airtable or open the source record.':'Todavía no se ha importado un PDF para este registro. Actualiza Airtable o abre el registro fuente.'}</p>}</div></section>{canManage&&<section><span>{isEn?'PARTICIPATION STATUS':'ESTADO DE PARTICIPACIÓN'}</span><div className="contract-status-toggle detail"><button className={selected.status==='active'?'active':''} onClick={()=>setStatus(selected,'active')}>{isEn?'Mark Active':'Marcar Activo'}</button><button className={selected.status==='inactive'?'inactive':''} onClick={()=>setStatus(selected,'inactive')}>{isEn?'Mark Inactive':'Marcar Inactivo'}</button></div></section>}<footer><button onClick={()=>setSelected(null)}>{isEn?'Close':'Cerrar'}</button>{selected.sourceRecordUrl&&<a href={selected.sourceRecordUrl} target="_blank" rel="noreferrer">{isEn?'Open Airtable record':'Abrir registro en Airtable'}<ExternalLink/></a>}</footer></section></div>}
  </div>;
}
