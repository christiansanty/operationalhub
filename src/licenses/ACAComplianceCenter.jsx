import React, { useEffect, useState } from 'react';
import {
  BadgeCheck, Bot, Building2, CheckCircle2, ExternalLink, FileKey2, IdCard,
  LoaderCircle, RefreshCw, ShieldAlert, ShieldCheck, Unplug, UsersRound,
} from 'lucide-react';
import './aca-compliance-center.css';

const sections=[
  {id:'licenses',icon:BadgeCheck,label:{en:'ACA licenses',es:'Licencias ACA'},description:{en:'Facility licenses, license numbers, status, expiration and source documents. Available local AHCA licenses are shown here while the official connection is configured.',es:'Licencias de centros, números, estado, vencimiento y documentos fuente. Las licencias AHCA locales disponibles aparecen aquí mientras se configura la conexión oficial.'}},
  {id:'background',icon:ShieldCheck,label:{en:'Background screening',es:'Background screening'},description:{en:'Level 2 screening status, eligibility, renewal date and Clearinghouse verification.',es:'Estado del screening de nivel 2, elegibilidad, fecha de renovación y verificación en Clearinghouse.'}},
  {id:'roster',icon:UsersRound,label:{en:'ACA roster',es:'ACA roster'},description:{en:'Employee and contractor roster maintained for each participating facility.',es:'Roster de empleados y contratistas mantenido para cada centro participante.'}},
];

const portalUrl='https://apps.ahca.myflorida.com/SingleSignOnPortal';

const prettyDate=(value,lang)=>{
  if(!value)return '—';
  const date=new Date(value);
  return Number.isNaN(date.valueOf())?value:new Intl.DateTimeFormat(lang==='en'?'en-US':'es-US',{dateStyle:'medium'}).format(date);
};

export default function ACAComplianceCenter({lang,existingLicenses=[]}){
  const isEn=lang==='en';
  const [section,setSection]=useState('licenses');
  const [status,setStatus]=useState(null);
  const [records,setRecords]=useState([]);
  const [checks,setChecks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [requesting,setRequesting]=useState(false);
  const [error,setError]=useState('');

  const load=async()=>{
    setLoading(true);setError('');
    try{
      const [statusResponse,recordsResponse,checksResponse]=await Promise.all([
        fetch('/api/integrations/aca/status'),
        fetch(`/api/integrations/aca/records?source=${section}`),
        fetch(`/api/integrations/aca/checks?source=${section}`),
      ]);
      if(!statusResponse.ok||!recordsResponse.ok||!checksResponse.ok)throw new Error(isEn?'The ACA integration service is not available.':'El servicio de integración ACA no está disponible.');
      setStatus(await statusResponse.json());
      setRecords((await recordsResponse.json()).records||[]);
      setChecks((await checksResponse.json()).checks||[]);
    }catch(loadError){setError(loadError.message)}finally{setLoading(false)}
  };

  useEffect(()=>{load()},[section]);
  const requestVerification=async()=>{
    setRequesting(true);setError('');
    try{
      const response=await fetch('/api/integrations/aca/checks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source:section,scope:'all authorized Eastern Medical facilities'})});
      if(!response.ok)throw new Error(isEn?'The RPA verification could not be queued.':'No se pudo poner la comprobación RPA en cola.');
      await load();
    }catch(requestError){setError(requestError.message)}finally{setRequesting(false)}
  };
  const active=sections.find(item=>item.id===section);
  const displayedRecords=section==='licenses'?
    [...existingLicenses.map(row=>({id:`local-${row.number}`,subject:row.entity,facility:row.entity,status:row.status,expiresOn:row.expires,externalId:row.number,local:true})),...records]:records;
  const connectionReady=Boolean(status?.receiverConfigured&&status?.rpaConfigured);
  const latestCheck=checks[0];

  return <section className="aca-compliance-center">
    <header className="aca-center-hero">
      <div className="aca-center-mark"><FileKey2/></div>
      <div><span>{isEn?'FLORIDA REGULATORY ACCESS':'ACCESO REGULATORIO DE FLORIDA'}</span><h2>{isEn?'ACA / AHCA Compliance Center':'Centro de Cumplimiento ACA / AHCA'}</h2><p>{isEn?'One controlled workspace for facility licensing, Level 2 background screening and the employee/contractor roster.':'Un espacio controlado para licencias de centros, background screening de nivel 2 y roster de empleados y contratistas.'}</p></div>
      <div className={`aca-connection-state ${connectionReady?'ready':'pending'}`}>{connectionReady?<CheckCircle2/>:<Unplug/>}<span><small>{isEn?'Integration':'Integración'}</small><strong>{connectionReady?(isEn?'Configured':'Configurada'):(isEn?'Setup required':'Requiere configuración')}</strong></span></div>
    </header>

    <nav className="aca-section-tabs" aria-label={isEn?'ACA compliance areas':'Áreas de cumplimiento ACA'}>{sections.map(item=>{const Icon=item.icon;return <button key={item.id} className={section===item.id?'active':''} onClick={()=>setSection(item.id)}><Icon/><span><strong>{item.label[lang]}</strong><small>{item.description[lang]}</small></span><b>{item.id==='licenses'?existingLicenses.length+(status?.counts?.licenses||0):(status?.counts?.[item.id]||0)}</b></button>})}</nav>

    <div className="aca-workspace">
      <article className="aca-records-panel">
        <header><div><span>{isEn?'CURRENT AREA':'ÁREA ACTUAL'}</span><h3>{active.label[lang]}</h3><p>{active.description[lang]}</p></div><div className="aca-record-actions"><button className="request-rpa" onClick={requestVerification} disabled={requesting}><Bot className={requesting?'spinning':''}/>{requesting?(isEn?'Queuing…':'Enviando…'):(isEn?'Request RPA verification':'Solicitar comprobación RPA')}</button><button onClick={load} disabled={loading}><RefreshCw className={loading?'spinning':''}/>{isEn?'Refresh':'Actualizar'}</button></div></header>
        {latestCheck&&<div className={`aca-latest-check ${latestCheck.status}`}><Bot/><span><strong>{isEn?'Latest RPA verification':'Última comprobación RPA'} · {latestCheck.status}</strong><small>{latestCheck.message||(isEn?'Scope: all authorized Eastern Medical facilities':'Alcance: todos los centros autorizados de Eastern Medical')} · {prettyDate(latestCheck.completedAt||latestCheck.startedAt||latestCheck.requestedAt,lang)}</small></span></div>}
        {loading?<div className="aca-loading"><LoaderCircle className="spinning"/>{isEn?'Loading compliance records…':'Cargando registros de cumplimiento…'}</div>:error?<div className="aca-error"><ShieldAlert/><div><strong>{isEn?'Integration service unavailable':'Servicio de integración no disponible'}</strong><p>{error}</p></div></div>:displayedRecords.length?<div className="aca-record-table"><table><thead><tr><th>{section==='roster'?(isEn?'Employee / contractor':'Empleado / contratista'):(isEn?'Record':'Registro')}</th><th>{isEn?'Facility':'Centro'}</th><th>{isEn?'Reference':'Referencia'}</th><th>{isEn?'Expiration / verification':'Vencimiento / verificación'}</th><th>{isEn?'Status':'Estado'}</th></tr></thead><tbody>{displayedRecords.map(record=><tr key={`${record.local?'local':'sync'}-${record.id}`}><td><strong>{record.subject}</strong>{record.local&&<small>{isEn?'Existing Operational Hub record':'Registro existente del Operational Hub'}</small>}</td><td>{record.facility||'—'}</td><td><span>{record.externalId||'—'}</span></td><td>{prettyDate(record.expiresOn||record.lastVerifiedAt,lang)}</td><td><b className={`aca-record-status ${String(record.status||'pending').toLowerCase()}`}>{record.status|| (isEn?'Pending':'Pendiente')}</b></td></tr>)}</tbody></table></div>:<div className="aca-empty"><IdCard/><div><h4>{isEn?'No synchronized records yet':'Aún no hay registros sincronizados'}</h4><p>{isEn?'The area is ready. Records will appear here after an authorized API import or RPA run.':'El área está lista. Los registros aparecerán aquí después de una importación API o ejecución RPA autorizada.'}</p></div></div>}
      </article>

      <aside className="aca-integration-panel">
        <div className="aca-integration-heading"><Bot/><div><span>{isEn?'CONNECTION PLAN':'PLAN DE CONEXIÓN'}</span><h3>{isEn?'Authorized-firm RPA':'RPA de firma autorizada'}</h3></div></div>
        <ol><li className="done"><span>1</span><div><strong>{isEn?'Internal compliance model':'Modelo interno de cumplimiento'}</strong><small>{isEn?'Licenses, screenings and roster are compartmentalized.':'Licencias, screenings y roster están compartimentados.'}</small></div></li><li className={status?.receiverConfigured?'done':'current'}><span>2</span><div><strong>{isEn?'Protected robot receiver':'Receptor protegido del robot'}</strong><small>{status?.receiverConfigured?(isEn?'Private callback key configured on the server.':'Llave privada de retorno configurada en el servidor.'):(isEn?'Configure ACA_RPA_CALLBACK_KEY on the server.':'Configura ACA_RPA_CALLBACK_KEY en el servidor.')}</small></div></li><li className={status?.rpaConfigured?'done':'current'}><span>3</span><div><strong>{isEn?'Authorized firm worker':'Worker de la firma autorizada'}</strong><small>{status?.rpaConfigured?(isEn?`${status.rpaProvider||'Authorized firm'} is configured.`:`${status.rpaProvider||'Firma autorizada'} está configurada.`):(isEn?'Connect the firm runner with its authorized AHCA account.':'Conecta el runner de la firma con su cuenta AHCA autorizada.')}</small></div></li><li><span>4</span><div><strong>{isEn?'Scheduled checks':'Comprobaciones programadas'}</strong><small>{isEn?'The robot verifies, reconciles and flags changes for review.':'El robot verifica, concilia y marca cambios para revisión.'}</small></div></li></ol>
        <a className="aca-portal-link" href={portalUrl} target="_blank" rel="noreferrer"><Building2/><span><strong>{isEn?'Open official AHCA portal':'Abrir portal oficial de AHCA'}</strong><small>{isEn?'Authorized account required':'Se requiere cuenta autorizada'}</small></span><ExternalLink/></a>
        <p className="aca-security-note"><ShieldCheck/>{isEn?'AHCA has no external API in this workflow. The authorized robot uses the portal; credentials stay in the firm’s secure runtime and never in the browser.':'AHCA no tiene API externa en este flujo. El robot autorizado usa el portal; las credenciales permanecen en el entorno seguro de la firma y nunca en el navegador.'}</p>
      </aside>
    </div>
  </section>;
}
