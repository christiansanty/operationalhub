import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Plus, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { canExplicitResearchPermission } from '../auth/accessControl.js';

const labelForState = (state, lang) => ({
  configuration_required: lang === 'en' ? 'Configuration required' : 'Configuración requerida',
  configured_pending_contract: lang === 'en' ? 'Pending contract verification' : 'Pendiente de verificar contrato',
  configured_pending_verification: lang === 'en' ? 'Pending verification' : 'Pendiente de verificación',
}[state] || state || (lang === 'en' ? 'Unknown' : 'Desconocido'));

function StateBadge({ state, lang }) {
  const ready = state === 'verified' || state === 'connected';
  return <span className={`research-state ${ready ? 'ready' : 'pending'}`}>{ready ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>} {labelForState(state, lang)}</span>;
}

export default function ResearchModule({ lang = 'en', session }) {
  const isEn = lang === 'en';
  const canLeads = canExplicitResearchPermission(session, 'research-leads:view') || canExplicitResearchPermission(session, 'research-leads:manage');
  const canManage = canExplicitResearchPermission(session, 'research-leads:manage', 'manage');
  const contactAccess = canExplicitResearchPermission(session, 'research-leads:contact:view');
  const canStudies = canExplicitResearchPermission(session, 'research-studies:view') || canExplicitResearchPermission(session, 'research-studies:manage');
  const canManageStudies = canExplicitResearchPermission(session, 'research-studies:manage', 'manage');
  const [status, setStatus] = useState(null);
  const [leads, setLeads] = useState([]);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', sourceLabel: '', nextAction: '', followUpAt: '' });
  const [saving, setSaving] = useState(false);
  const [studyModal, setStudyModal] = useState(false);
  const [studyForm, setStudyForm] = useState({ studyCode: '', title: '', sponsorName: '', protocolVersion: '', assignedUserId: '', assignedRole: 'coordinator' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const statusResponse = await fetch('/api/research/status', { cache: 'no-store' });
      const statusPayload = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(statusPayload.error || (isEn ? 'Research access is not available.' : 'El acceso a Research no está disponible.'));
      setStatus(statusPayload);
      if (canLeads) {
        const leadsResponse = await fetch('/api/research/leads', { cache: 'no-store' });
        const leadsPayload = await leadsResponse.json();
        if (!leadsResponse.ok) throw new Error(leadsPayload.error || (isEn ? 'Research leads are not available.' : 'Los leads de Research no están disponibles.'));
        setLeads(leadsPayload.leads || []);
      } else setLeads([]);
      if (canStudies) {
        const studiesResponse = await fetch('/api/research/studies', { cache: 'no-store' });
        const studiesPayload = await studiesResponse.json();
        if (!studiesResponse.ok) throw new Error(studiesPayload.error || (isEn ? 'Research studies are not available.' : 'Los estudios de Research no están disponibles.'));
        setStudies(studiesPayload.studies || []);
      } else setStudies([]);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [canLeads, canStudies]);

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const saveLead = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/research/leads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, sourceSystem: 'operational-hub', sourceRecordId: `manual-${Date.now()}`, status: 'pending' }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'Lead could not be saved.' : 'No se pudo guardar el lead.'));
      setForm({ firstName: '', lastName: '', email: '', phone: '', sourceLabel: '', nextAction: '', followUpAt: '' });
      setFormOpen(false); await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const saveStudy = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/research/studies', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(studyForm) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'Study could not be created.' : 'No se pudo crear el estudio.'));
      setStudyForm({ studyCode: '', title: '', sponsorName: '', protocolVersion: '', assignedUserId: '', assignedRole: 'coordinator' });
      setStudyModal(false); await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const rows = useMemo(() => leads.map(lead => ({ ...lead, displayName: contactAccess ? [lead.firstName, lead.lastName].filter(Boolean).join(' ') : 'Restricted Research lead' })), [leads, contactAccess]);

  return <section className="research-module">
    <header className="research-module-header">
      <div><span className="eyebrow">{isEn ? 'RESTRICTED RESEARCH OPERATIONS' : 'OPERACIONES DE RESEARCH RESTRINGIDAS'}</span><h2>{isEn ? 'Eastern Medical Research' : 'Eastern Medical Research'}</h2><p>{isEn ? 'Leads, study activation and controlled follow-up remain inside the Research scope.' : 'Los leads, la activación de estudios y el seguimiento controlado permanecen dentro del alcance de Research.'}</p></div>
      <button className="icon-btn" onClick={load} title={isEn ? 'Refresh' : 'Actualizar'}><RefreshCw size={17}/></button>
    </header>
    <div className="research-boundary"><ShieldCheck size={18}/><span><strong>{isEn ? 'Scope boundary' : 'Límite de alcance'}</strong>{isEn ? ' No participant records or PHI are shown in this workspace.' : ' No se muestran expedientes de participantes ni PHI en este espacio.'}</span></div>
    <div className="research-connector-grid">
      <article><div><span>EM Connect</span><StateBadge state={status?.emConnect?.state} lang={lang}/></div><p>{status?.emConnect?.outboundUpdates === 'blocked_pending_contract' ? (isEn ? 'Inbound Research routing and outbound update contract are still pending.' : 'El enrutamiento entrante y el contrato de actualización saliente aún están pendientes.') : ''}</p></article>
      <article><div><span>Universal</span><StateBadge state={status?.universal?.state} lang={lang}/></div><p>{isEn ? 'No requests or data transfers are made until the agent contract is verified.' : 'No se realizan solicitudes ni transferencias hasta verificar el contrato del agente.'}</p></article>
    </div>
    {!canLeads ? <div className="research-empty"><LockIcon/><strong>{isEn ? 'Research leads permission required' : 'Se requiere permiso de leads de Research'}</strong><p>{isEn ? 'Ask an administrator for research-leads:view or research-leads:manage. Entity access alone does not expose lead data.' : 'Solicita research-leads:view o research-leads:manage. El acceso a la entidad por sí solo no expone datos de leads.'}</p></div> : <>
      <div className="research-section-heading"><div><span>{isEn ? 'RECRUITMENT PIPELINE' : 'PIPELINE DE RECLUTAMIENTO'}</span><h3>{isEn ? 'Research leads' : 'Leads de Research'}</h3></div>{canManage&&<button className="primary" onClick={()=>setFormOpen(true)}><Plus size={16}/>{isEn ? 'New lead' : 'Nuevo lead'}</button>}</div>
      {error&&<div className="research-error"><AlertTriangle size={15}/>{error}</div>}
      {loading?<div className="research-empty"><RefreshCw/><p>{isEn ? 'Loading restricted Research records…' : 'Cargando registros restringidos de Research…'}</p></div>:<div className="research-table-wrap"><table className="research-table"><thead><tr>{contactAccess&&<th>{isEn ? 'Contact' : 'Contacto'}</th>}<th>{isEn ? 'Source' : 'Origen'}</th><th>{isEn ? 'Status' : 'Estado'}</th><th>{isEn ? 'Next action' : 'Próxima acción'}</th><th>{isEn ? 'Sync state' : 'Sincronización'}</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{contactAccess&&<td><strong>{row.displayName||'—'}</strong><small>{row.email||row.phone||'—'}</small></td>}<td>{row.sourceLabel||row.sourceSystem}<small>{row.sourceRecordId}</small></td><td><span className="record-status upcoming">{row.status}</span></td><td>{row.nextAction||'—'}<small>{row.followUpAt||''}</small></td><td>{row.syncState}</td></tr>)}{!rows.length&&<tr><td colSpan={contactAccess?5:4} className="research-table-empty">{isEn ? 'No Research leads are assigned to this scope.' : 'No hay leads de Research asignados a este alcance.'}</td></tr>}</tbody></table></div>}
    </>}
    {canStudies&&<section className="research-studies-section"><div className="research-section-heading"><div><span>{isEn ? 'STUDY CONTROL' : 'CONTROL DE ESTUDIOS'}</span><h3>{isEn ? 'Studies & activation' : 'Estudios y activación'}</h3></div>{canManageStudies&&<button className="primary" onClick={()=>setStudyModal(true)}><Plus size={16}/>{isEn ? 'New study' : 'Nuevo estudio'}</button>}</div><div className="research-table-wrap"><table className="research-table"><thead><tr><th>{isEn?'Study':'Estudio'}</th><th>{isEn?'Protocol':'Protocolo'}</th><th>{isEn?'Approvals':'Aprobaciones'}</th><th>{isEn?'Activation':'Activación'}</th><th>{isEn?'Assignment':'Asignación'}</th></tr></thead><tbody>{studies.map(study=><tr key={study.id}><td><strong>{study.studyCode}</strong><small>{study.title}</small></td><td>{study.currentProtocolVersion||'—'}</td><td>{study.irbStatus} · {study.sponsorStatus}</td><td><span className={`record-status ${study.activationStatus==='active'?'active':'upcoming'}`}>{study.activationStatus}</span></td><td>{study.assignment?.assignmentRole||'—'}<small>{study.assignment?.trainingStatus||''}</small></td></tr>)}{!studies.length&&<tr><td colSpan="5" className="research-table-empty">{isEn ? 'No studies are assigned to this scope.' : 'No hay estudios asignados a este alcance.'}</td></tr>}</tbody></table></div></section>}
    {formOpen&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setFormOpen(false)}><form className="quick-modal research-lead-modal" onSubmit={saveLead}><div className="modal-heading"><div><span>{isEn ? 'RESTRICTED RECORD' : 'REGISTRO RESTRINGIDO'}</span><h2>{isEn ? 'New Research lead' : 'Nuevo lead de Research'}</h2></div><button type="button" onClick={()=>setFormOpen(false)}>×</button></div><div className="lead-form-grid"><label>{isEn?'First name':'Nombre'}<input value={form.firstName} onChange={event=>update('firstName',event.target.value)}/></label><label>{isEn?'Last name':'Apellido'}<input value={form.lastName} onChange={event=>update('lastName',event.target.value)}/></label><label>{isEn?'Email':'Correo'}<input type="email" value={form.email} onChange={event=>update('email',event.target.value)}/></label><label>{isEn?'Phone':'Teléfono'}<input value={form.phone} onChange={event=>update('phone',event.target.value)}/></label><label>{isEn?'Source':'Origen'}<input value={form.sourceLabel} onChange={event=>update('sourceLabel',event.target.value)}/></label><label>{isEn?'Next action':'Próxima acción'}<input value={form.nextAction} onChange={event=>update('nextAction',event.target.value)}/></label><label>{isEn?'Follow-up date':'Fecha de seguimiento'}<input type="datetime-local" value={form.followUpAt} onChange={event=>update('followUpAt',event.target.value)}/></label></div><div className="modal-actions"><button type="button" onClick={()=>setFormOpen(false)}>{isEn?'Cancel':'Cancelar'}</button><button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving?(isEn?'Saving…':'Guardando…'):(isEn?'Save lead':'Guardar lead')}</button></div></form></div>}
    {studyModal&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setStudyModal(false)}><form className="quick-modal research-lead-modal" onSubmit={saveStudy}><div className="modal-heading"><div><span>{isEn ? 'CONTROLLED ACTIVATION' : 'ACTIVACIÓN CONTROLADA'}</span><h2>{isEn ? 'New Research study' : 'Nuevo estudio de Research'}</h2></div><button type="button" onClick={()=>setStudyModal(false)}>×</button></div><div className="lead-form-grid"><label>{isEn?'Study code':'Código'}<input required value={studyForm.studyCode} onChange={event=>setStudyForm({...studyForm,studyCode:event.target.value})}/></label><label>{isEn?'Title':'Título'}<input required value={studyForm.title} onChange={event=>setStudyForm({...studyForm,title:event.target.value})}/></label><label>{isEn?'Sponsor':'Patrocinador'}<input value={studyForm.sponsorName} onChange={event=>setStudyForm({...studyForm,sponsorName:event.target.value})}/></label><label>{isEn?'Protocol version':'Versión de protocolo'}<input required value={studyForm.protocolVersion} onChange={event=>setStudyForm({...studyForm,protocolVersion:event.target.value})}/></label><label>{isEn?'Assigned user ID':'ID de usuario asignado'}<input required value={studyForm.assignedUserId} onChange={event=>setStudyForm({...studyForm,assignedUserId:event.target.value})}/></label><label>{isEn?'Assignment role':'Rol asignado'}<select value={studyForm.assignedRole} onChange={event=>setStudyForm({...studyForm,assignedRole:event.target.value})}><option value="coordinator">Coordinator</option><option value="pi">PI</option><option value="monitor">Monitor</option><option value="data_manager">Data manager</option></select></label></div><p className="research-form-note"><ShieldCheck size={15}/>{isEn?'New studies begin as draft/not ready. Activation requires verified IRB and sponsor approvals.':'Los estudios nuevos comienzan como draft/not ready. La activación requiere aprobaciones IRB y del patrocinador verificadas.'}</p><div className="modal-actions"><button type="button" onClick={()=>setStudyModal(false)}>{isEn?'Cancel':'Cancelar'}</button><button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving?(isEn?'Saving…':'Guardando…'):(isEn?'Create study':'Crear estudio')}</button></div></form></div>}
  </section>;
}

function LockIcon() { return <ShieldCheck size={22}/>; }
