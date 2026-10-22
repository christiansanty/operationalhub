import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Bot, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Clock3,
  ExternalLink, FileText, Filter, History, Link2, Plus, RefreshCw, Search, ShieldCheck,
  UploadCloud, UserRound, X,
} from 'lucide-react';
import { canExplicitResearchPermission } from '../auth/accessControl.js';
import './fundamental-studies.css';

const tabs = [
  ['active', 'Active', 'Activos'],
  ['in-process', 'In Process', 'En proceso'],
  ['status', 'Status', 'Estado'],
  ['applied', 'Applied', 'Aplicados'],
  ['stand-by', 'Stand By', 'En espera'],
];
const statusOptions = ['active', 'in-process', 'status', 'applied', 'stand-by'];
const requirementStatuses = ['pending', 'in-preparation', 'ready', 'not-applicable'];
const categories = ['protocol', 'eligibility', 'application', 'consent', 'regulatory', 'sponsor', 'other'];
const initialStudy = { title: '', description: '', institution: '', sponsor: '', area: '', eligibility: '', location: '', deadline: '', status: 'stand-by', verificationState: 'manual_entry', sourceUrl: '', sourceCheckedAt: '', ownerId: '', ownerName: '' };
const initialRequirement = { title: '', description: '', status: 'pending', ownerId: '', ownerName: '', dueDate: '' };
const initialDocument = { title: '', category: 'other', sourceType: 'external_link', url: '', notes: '', requirementId: '', replacesDocumentId: '', file: null };

const label = (value, lang) => ({
  active: lang === 'en' ? 'Active' : 'Activo', 'in-process': lang === 'en' ? 'In Process' : 'En proceso', status: lang === 'en' ? 'Status' : 'Estado', applied: lang === 'en' ? 'Applied' : 'Aplicado', 'stand-by': lang === 'en' ? 'Stand By' : 'En espera',
  pending: lang === 'en' ? 'Pending' : 'Pendiente', 'in-preparation': lang === 'en' ? 'In preparation' : 'En preparación', ready: lang === 'en' ? 'Ready' : 'Listo', 'not-applicable': lang === 'en' ? 'Not applicable' : 'No aplica',
}[value] || value);

async function readFile(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '').split(',').pop() || ''); reader.onerror = () => reject(new Error('file_read_failed')); reader.readAsDataURL(file); });
}

function StatusBadge({ value, lang }) { return <span className={`fundamental-badge fundamental-${String(value).replace(/[^a-z-]/g, '')}`}><span />{label(value, lang)}</span>; }

export default function FundamentalStudies({ lang = 'en', session }) {
  const isEn = lang === 'en';
  const canView = canExplicitResearchPermission(session, 'research-fundamental-studies:view') || canExplicitResearchPermission(session, 'research-fundamental-studies:manage');
  const canManage = canExplicitResearchPermission(session, 'research-fundamental-studies:manage', 'manage');
  const [studies, setStudies] = useState([]);
  const [resources, setResources] = useState([]);
  const [agentStatus, setAgentStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [filters, setFilters] = useState({ query: '', area: '', institution: '', location: '', owner: '', deadlineTo: '' });
  const [selectedId, setSelectedId] = useState('');
  const [studyForm, setStudyForm] = useState(initialStudy);
  const [requirementForm, setRequirementForm] = useState(initialRequirement);
  const [documentForm, setDocumentForm] = useState(initialDocument);
  const [studyModal, setStudyModal] = useState(false);
  const [requirementModal, setRequirementModal] = useState(false);
  const [documentModal, setDocumentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!canView) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const [studyResponse, agentResponse, resourceResponse] = await Promise.all([
        fetch(`/api/research/fundamental-studies?${params.toString()}`, { cache: 'no-store' }),
        fetch('/api/research/fundamental-studies/agents/status', { cache: 'no-store' }),
        fetch('/api/workspace-resources?scope=entity-research', { cache: 'no-store' }),
      ]);
      const studyPayload = await studyResponse.json();
      const agentPayload = await agentResponse.json();
      const resourcePayload = await resourceResponse.json();
      if (!studyResponse.ok) throw new Error(studyPayload.error || (isEn ? 'Fundamental Studies are not available.' : 'Fundamental Studies no está disponible.'));
      setStudies(studyPayload.studies || []); setAgentStatus(agentPayload); setResources(resourcePayload.resources || []);
      if (selectedId && !(studyPayload.studies || []).some(study => study.id === selectedId)) setSelectedId('');
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [canView, JSON.stringify(filters)]);
  const selected = studies.find(study => study.id === selectedId) || null;
  const resourceById = useMemo(() => new Map(resources.map(resource => [resource.id, resource])), [resources]);
  const counts = useMemo(() => Object.fromEntries(tabs.map(([key]) => [key, studies.filter(study => study.status === key).length])), [studies]);
  const visibleStudies = useMemo(() => studies.filter(study => study.status === activeTab), [studies, activeTab]);
  const updateStudyForm = (field, value) => setStudyForm(current => ({ ...current, [field]: value }));

  const saveStudy = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/research/fundamental-studies', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(studyForm) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Study could not be saved.');
      setStudyModal(false); setStudyForm(initialStudy); setActiveTab(payload.study.status); setSelectedId(payload.study.id); await load();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const patchStudy = async payload => {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/research/fundamental-studies/${encodeURIComponent(selected.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Study could not be updated.');
      setActiveTab(result.study.status); await load();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const saveRequirement = async event => {
    event.preventDefault(); if (!selected) return; setSaving(true); setError('');
    try {
      const response = await fetch(`/api/research/fundamental-studies/${encodeURIComponent(selected.id)}/requirements`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requirementForm) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Requirement could not be saved.');
      setRequirementModal(false); setRequirementForm(initialRequirement); await load();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const updateRequirement = async (requirement, status) => {
    if (!selected) return;
    const response = await fetch(`/api/research/fundamental-studies/${encodeURIComponent(selected.id)}/requirements/${encodeURIComponent(requirement.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    const payload = await response.json(); if (!response.ok) setError(payload.error || 'Requirement could not be updated.'); else await load();
  };

  const saveDocument = async event => {
    event.preventDefault(); if (!selected) return; setSaving(true); setError('');
    try {
      let resourceId = ''; let url = documentForm.url; let sourceType = documentForm.sourceType;
      if (documentForm.file) {
        const base64 = await readFile(documentForm.file);
        const resourceResponse = await fetch('/api/workspace-resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scopeKey: 'entity-research', title: documentForm.title || documentForm.file.name, description: documentForm.notes, kind: 'file', filename: documentForm.file.name, type: documentForm.file.type, base64 }) });
        const resourcePayload = await resourceResponse.json(); if (!resourceResponse.ok) throw new Error(resourcePayload.error || 'The file could not be stored.');
        resourceId = resourcePayload.resource.id; sourceType = 'workspace_resource';
      } else {
        if (!url || !/^https?:\/\//i.test(url)) throw new Error(isEn ? 'Use a valid http or https document link.' : 'Usa un enlace http o https válido.');
        const kind = /docs\.google\.com\/spreadsheets/i.test(url) ? 'google-sheet' : 'link';
        const resourceResponse = await fetch('/api/workspace-resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scopeKey: 'entity-research', title: documentForm.title, description: documentForm.notes, kind, url }) });
        const resourcePayload = await resourceResponse.json(); if (!resourceResponse.ok) throw new Error(resourcePayload.error || 'The link could not be stored.');
        resourceId = resourcePayload.resource.id;
      }
      const response = await fetch(`/api/research/fundamental-studies/${encodeURIComponent(selected.id)}/documents`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...documentForm, file: undefined, resourceId, sourceType, url }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'The document could not be associated.');
      setDocumentModal(false); setDocumentForm(initialDocument); setNotice(isEn ? 'Document saved with its original resource preserved.' : 'Documento guardado conservando el recurso original.'); await load();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const prepareAgent = async task => {
    if (!selected) return;
    const response = await fetch(`/api/research/fundamental-studies/${encodeURIComponent(selected.id)}/agents/prepare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ task, agent: 'research-opportunity-reviewer' }) });
    const payload = await response.json(); if (!response.ok) setError(payload.error || 'Agent task could not be prepared.'); else { setNotice(payload.result.message); await load(); }
  };

  if (!canView) return <section className="fundamental-studies fundamental-locked"><ShieldCheck size={24}/><div><strong>{isEn ? 'Fundamental Studies permission required' : 'Se requiere permiso de Fundamental Studies'}</strong><p>{isEn ? 'This area is isolated to Eastern Medical Research. Ask an administrator for research-fundamental-studies:view.' : 'Esta área está aislada a Eastern Medical Research. Solicita research-fundamental-studies:view a un administrador.'}</p></div></section>;

  return <section className="fundamental-studies" id="fundamental-studies">
    <header className="fundamental-header"><div><span>{isEn ? 'FUNDAMENTAL STUDIES' : 'FUNDAMENTAL STUDIES'}</span><h2>{isEn ? 'Research opportunities and application control' : 'Control de oportunidades y solicitudes de Research'}</h2><p>{isEn ? 'Search, evaluate and follow opportunities without presenting unverified information as current or available.' : 'Busca, evalúa y da seguimiento sin presentar información no verificada como vigente o disponible.'}</p></div><div className="fundamental-header-actions"><button className="fundamental-icon-button" onClick={load} title={isEn ? 'Refresh' : 'Actualizar'}><RefreshCw size={17}/></button>{canManage && <button className="fundamental-primary" onClick={() => setStudyModal(true)}><Plus size={16}/>{isEn ? 'Add opportunity' : 'Añadir oportunidad'}</button>}</div></header>
    <div className="fundamental-boundary"><ShieldCheck size={17}/><span><strong>{isEn ? 'Verified-source boundary' : 'Límite de fuente verificada'}</strong>{isEn ? 'Manual entries remain marked until a person verifies the source. No application is submitted automatically.' : 'Las entradas manuales permanecen marcadas hasta que una persona verifique la fuente. Ninguna solicitud se envía automáticamente.'}</span></div>
    {error && <div className="fundamental-alert"><AlertTriangle size={16}/>{error}</div>}{notice && <div className="fundamental-notice"><CheckCircle2 size={16}/>{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
    <div className="fundamental-agent-strip"><div><Bot size={19}/><span><strong>{isEn ? 'Universal Master RPA agents' : 'Agentes de Universal Master RPA'}</strong><small>{agentStatus?.configured ? (isEn ? 'Configured, pending Research contract verification.' : 'Configurado, pendiente de verificar contrato de Research.') : (isEn ? 'Not configured; no external request is made.' : 'No configurado; no se realiza ninguna solicitud externa.')}</small></span></div><span className={`fundamental-connection ${agentStatus?.configured ? 'pending' : 'blocked'}`}>{agentStatus?.configured ? (isEn ? 'Pending verification' : 'Pendiente') : (isEn ? 'Not connected' : 'No conectado')}</span></div>
    <div className="fundamental-toolbar"><label className="fundamental-search"><Search size={16}/><input placeholder={isEn ? 'Search title, sponsor, area or institution' : 'Buscar título, sponsor, área o institución'} value={filters.query} onChange={event => setFilters(current => ({ ...current, query: event.target.value }))}/></label><label><Filter size={15}/><input placeholder={isEn ? 'Area' : 'Área'} value={filters.area} onChange={event => setFilters(current => ({ ...current, area: event.target.value }))}/></label><label><input placeholder={isEn ? 'Institution' : 'Institución'} value={filters.institution} onChange={event => setFilters(current => ({ ...current, institution: event.target.value }))}/></label><label><CalendarDays size={15}/><input type="date" title={isEn ? 'Deadline through' : 'Fecha límite hasta'} value={filters.deadlineTo} onChange={event => setFilters(current => ({ ...current, deadlineTo: event.target.value }))}/></label></div>
    <nav className="fundamental-tabs">{tabs.map(([key, en, es]) => <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}>{isEn ? en : es}<b>{counts[key] || 0}</b></button>)}</nav>
    {loading ? <div className="fundamental-empty"><RefreshCw/><p>{isEn ? 'Loading authorized opportunities…' : 'Cargando oportunidades autorizadas…'}</p></div> : <div className="fundamental-layout"><div className="fundamental-list">{visibleStudies.map(study => <button key={study.id} className={`fundamental-study-card ${selectedId === study.id ? 'selected' : ''}`} onClick={() => setSelectedId(study.id)}><div className="fundamental-card-top"><StatusBadge value={study.status} lang={lang}/><span className={`fundamental-verification ${study.verificationState}`}>{study.verificationState === 'verified' ? <CheckCircle2 size={13}/> : <Clock3 size={13}/>} {study.verificationState === 'verified' ? (isEn ? 'Verified' : 'Verificado') : (isEn ? 'Needs review' : 'Requiere revisión')}</span></div><strong>{study.title}</strong><p>{[study.institution, study.sponsor, study.area].filter(Boolean).join(' · ') || (isEn ? 'Details pending entry' : 'Detalles pendientes')}</p><div className="fundamental-card-meta"><span>{study.deadline ? `${isEn ? 'Deadline' : 'Límite'} ${study.deadline}` : (isEn ? 'No deadline recorded' : 'Sin fecha límite')}</span><span><UserRound size={13}/>{study.ownerName || (isEn ? 'Unassigned' : 'Sin asignar')}</span></div><ChevronRight size={16}/></button>)}{!visibleStudies.length && <div className="fundamental-empty"><ClipboardList size={24}/><strong>{isEn ? 'No opportunities in this view' : 'No hay oportunidades en esta vista'}</strong><p>{isEn ? 'Add a manually sourced opportunity or adjust the filters.' : 'Añade una oportunidad manual o ajusta los filtros.'}</p></div>}</div><StudyDetail study={selected} lang={lang} canManage={canManage} resources={resourceById} saving={saving} onStatusChange={value => patchStudy({ status: value, statusNote: isEn ? 'Manual status update.' : 'Actualización manual de estado.' })} onOwnerChange={(ownerId, ownerName) => patchStudy({ ownerId, ownerName })} onAddRequirement={() => setRequirementModal(true)} onAddDocument={(replaces = '') => { setDocumentForm({ ...initialDocument, replacesDocumentId: replaces }); setDocumentModal(true); }} onRequirementChange={updateRequirement} onPrepareAgent={prepareAgent}/></div>}
    {studyModal && <Modal title={isEn ? 'Add Fundamental Study opportunity' : 'Añadir oportunidad de Fundamental Studies'} onClose={() => setStudyModal(false)}><form className="fundamental-form" onSubmit={saveStudy}><FormField label={isEn ? 'Study / opportunity name' : 'Nombre del estudio / oportunidad'} required><input required value={studyForm.title} onChange={event => updateStudyForm('title', event.target.value)}/></FormField><div className="fundamental-form-grid"><FormField label={isEn ? 'Institution' : 'Institución'}><input value={studyForm.institution} onChange={event => updateStudyForm('institution', event.target.value)}/></FormField><FormField label={isEn ? 'Sponsor' : 'Sponsor'}><input value={studyForm.sponsor} onChange={event => updateStudyForm('sponsor', event.target.value)}/></FormField><FormField label={isEn ? 'Research area' : 'Área de investigación'}><input value={studyForm.area} onChange={event => updateStudyForm('area', event.target.value)}/></FormField><FormField label={isEn ? 'Location' : 'Ubicación'}><input value={studyForm.location} onChange={event => updateStudyForm('location', event.target.value)}/></FormField><FormField label={isEn ? 'Status' : 'Estado'}><select value={studyForm.status} onChange={event => updateStudyForm('status', event.target.value)}>{statusOptions.map(value => <option key={value} value={value}>{label(value, lang)}</option>)}</select></FormField><FormField label={isEn ? 'Deadline' : 'Fecha límite'}><input type="date" value={studyForm.deadline} onChange={event => updateStudyForm('deadline', event.target.value)}/></FormField><FormField label={isEn ? 'Owner name' : 'Nombre del responsable'}><input value={studyForm.ownerName} onChange={event => updateStudyForm('ownerName', event.target.value)}/></FormField><FormField label={isEn ? 'Source URL' : 'URL de la fuente'}><input type="url" value={studyForm.sourceUrl} onChange={event => updateStudyForm('sourceUrl', event.target.value)}/></FormField></div><FormField label={isEn ? 'Description' : 'Descripción'}><textarea rows="3" value={studyForm.description} onChange={event => updateStudyForm('description', event.target.value)}/></FormField><FormField label={isEn ? 'Eligibility criteria' : 'Criterios de elegibilidad'}><textarea rows="3" value={studyForm.eligibility} onChange={event => updateStudyForm('eligibility', event.target.value)}/></FormField><p className="fundamental-form-note"><Clock3 size={14}/>{isEn ? 'New manual records are marked as requiring verification until a person confirms the source.' : 'Los registros manuales nuevos requieren verificación hasta que una persona confirme la fuente.'}</p><ModalActions saving={saving} lang={lang} onCancel={() => setStudyModal(false)}/></form></Modal>}
    {requirementModal && <Modal title={isEn ? 'Add requirement' : 'Añadir requisito'} onClose={() => setRequirementModal(false)}><form className="fundamental-form" onSubmit={saveRequirement}><FormField label={isEn ? 'Requirement' : 'Requisito'} required><input required value={requirementForm.title} onChange={event => setRequirementForm(current => ({ ...current, title: event.target.value }))}/></FormField><FormField label={isEn ? 'Description' : 'Descripción'}><textarea rows="3" value={requirementForm.description} onChange={event => setRequirementForm(current => ({ ...current, description: event.target.value }))}/></FormField><div className="fundamental-form-grid"><FormField label={isEn ? 'Owner' : 'Responsable'}><input value={requirementForm.ownerName} onChange={event => setRequirementForm(current => ({ ...current, ownerName: event.target.value }))}/></FormField><FormField label={isEn ? 'Due date' : 'Fecha límite'}><input type="date" value={requirementForm.dueDate} onChange={event => setRequirementForm(current => ({ ...current, dueDate: event.target.value }))}/></FormField></div><ModalActions saving={saving} lang={lang} onCancel={() => setRequirementModal(false)}/></form></Modal>}
    {documentModal && <Modal title={documentForm.replacesDocumentId ? (isEn ? 'Add document version' : 'Añadir versión del documento') : (isEn ? 'Add study documentation' : 'Añadir documentación del estudio')} onClose={() => setDocumentModal(false)}><form className="fundamental-form" onSubmit={saveDocument}><FormField label={isEn ? 'Document title' : 'Título del documento'} required><input required value={documentForm.title} onChange={event => setDocumentForm(current => ({ ...current, title: event.target.value }))}/></FormField><div className="fundamental-form-grid"><FormField label={isEn ? 'Category' : 'Categoría'}><select value={documentForm.category} onChange={event => setDocumentForm(current => ({ ...current, category: event.target.value }))}>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></FormField><FormField label={isEn ? 'Requirement link' : 'Requisito asociado'}><select value={documentForm.requirementId} onChange={event => setDocumentForm(current => ({ ...current, requirementId: event.target.value }))}><option value="">{isEn ? 'General study document' : 'Documento general del estudio'}</option>{selected?.requirements.map(requirement => <option key={requirement.id} value={requirement.id}>{requirement.title}</option>)}</select></FormField></div><label className="fundamental-upload"><UploadCloud size={17}/><span>{documentForm.file ? documentForm.file.name : (isEn ? 'Choose a file (up to 30 MB)' : 'Elegir archivo (hasta 30 MB)')}</span><input type="file" onChange={event => setDocumentForm(current => ({ ...current, file: event.target.files?.[0] || null, sourceType: 'workspace_resource' }))}/></label><div className="fundamental-or"><span>{isEn ? 'or add an external source link' : 'o añadir un enlace externo'}</span></div><FormField label={isEn ? 'External URL' : 'URL externa'}><input type="url" value={documentForm.url} onChange={event => setDocumentForm(current => ({ ...current, url: event.target.value, file: null, sourceType: 'external_link' }))}/></FormField><FormField label={isEn ? 'Notes' : 'Notas'}><textarea rows="3" value={documentForm.notes} onChange={event => setDocumentForm(current => ({ ...current, notes: event.target.value }))}/></FormField><p className="fundamental-form-note"><ShieldCheck size={14}/>{isEn ? 'The original resource is retained. Automated extraction, if later configured, remains a suggestion for review.' : 'El recurso original se conserva. La extracción automática, si se configura después, será solo una sugerencia para revisión.'}</p><ModalActions saving={saving} lang={lang} onCancel={() => setDocumentModal(false)}/></form></Modal>}
  </section>;
}

function StudyDetail({ study, lang, canManage, resources, saving, onStatusChange, onOwnerChange, onAddRequirement, onAddDocument, onRequirementChange, onPrepareAgent }) {
  const isEn = lang === 'en';
  if (!study) return <aside className="fundamental-detail fundamental-detail-empty"><ClipboardList size={30}/><strong>{isEn ? 'Select an opportunity' : 'Selecciona una oportunidad'}</strong><p>{isEn ? 'The detail view includes status history, requirements, documents and agent activity.' : 'El detalle incluye historial, requisitos, documentos y actividad de agentes.'}</p></aside>;
  return <aside className="fundamental-detail"><div className="fundamental-detail-heading"><div><StatusBadge value={study.status} lang={lang}/><h3>{study.title}</h3><p>{[study.institution, study.sponsor, study.area].filter(Boolean).join(' · ')}</p></div><button className="fundamental-close-detail" onClick={() => window.dispatchEvent(new CustomEvent('fundamental-close-detail'))}><X size={17}/></button></div><div className="fundamental-detail-actions"><label><span>{isEn ? 'Status' : 'Estado'}</span><select disabled={!canManage || saving} value={study.status} onChange={event => onStatusChange(event.target.value)}>{statusOptions.map(value => <option key={value} value={value}>{label(value, lang)}</option>)}</select></label><label><span>{isEn ? 'Owner' : 'Responsable'}</span><input disabled={!canManage || saving} value={study.ownerName || ''} placeholder={isEn ? 'Assign a person' : 'Asignar persona'} onChange={event => onOwnerChange(study.ownerId, event.target.value)} onBlur={event => onOwnerChange(study.ownerId, event.target.value)}/></label></div><div className="fundamental-detail-grid"><Info label={isEn ? 'Deadline' : 'Fecha límite'} value={study.deadline || (isEn ? 'Not recorded' : 'No registrada')} icon={CalendarDays}/><Info label={isEn ? 'Source status' : 'Estado de la fuente'} value={study.verificationState === 'verified' ? (isEn ? 'Verified' : 'Verificada') : (isEn ? 'Pending verification' : 'Pendiente de verificar')} icon={ShieldCheck}/><Info label={isEn ? 'Location' : 'Ubicación'} value={study.location || '—'} icon={ExternalLink}/><Info label={isEn ? 'Updated' : 'Actualizado'} value={new Date(study.updatedAt).toLocaleString(lang === 'es' ? 'es-US' : 'en-US')} icon={Clock3}/></div><DetailSection icon={FileText} title={isEn ? 'Study overview' : 'Resumen del estudio'}><p className="fundamental-detail-copy">{study.description || (isEn ? 'No description recorded.' : 'No hay descripción registrada.')}</p><p className="fundamental-detail-copy"><strong>{isEn ? 'Eligibility' : 'Elegibilidad'}:</strong> {study.eligibility || (isEn ? 'Pending verification.' : 'Pendiente de verificar.')}</p>{study.sourceUrl && <a className="fundamental-source-link" href={study.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{isEn ? 'Open official source' : 'Abrir fuente oficial'}</a>}</DetailSection><DetailSection icon={ClipboardList} title={isEn ? 'Requirements' : 'Requisitos'} action={canManage ? <button className="fundamental-small-action" onClick={onAddRequirement}><Plus size={14}/>{isEn ? 'Add' : 'Añadir'}</button> : null}>{study.requirements.length ? <div className="fundamental-requirements">{study.requirements.map(requirement => <div key={requirement.id}><div><strong>{requirement.title}</strong><small>{requirement.ownerName || (isEn ? 'Unassigned' : 'Sin asignar')} {requirement.dueDate ? `· ${requirement.dueDate}` : ''}</small></div>{canManage ? <select value={requirement.status} onChange={event => onRequirementChange(requirement, event.target.value)}>{requirementStatuses.map(value => <option key={value} value={value}>{label(value, lang)}</option>)}</select> : <StatusBadge value={requirement.status} lang={lang}/>}</div>)}</div> : <p className="fundamental-muted">{isEn ? 'No requirements entered yet.' : 'Todavía no hay requisitos.'}</p>}</DetailSection><DetailSection icon={UploadCloud} title={isEn ? 'Documents & versions' : 'Documentos y versiones'} action={canManage ? <button className="fundamental-small-action" onClick={() => onAddDocument()}><Plus size={14}/>{isEn ? 'Add document' : 'Añadir documento'}</button> : null}>{study.documents.length ? <div className="fundamental-documents">{study.documents.map(document => { const resource = resources.get(document.resourceId); const href = resource?.fileUrl || document.url || resource?.url; return <div key={document.id}><div className="fundamental-document-icon">{document.sourceType === 'external_link' ? <Link2 size={15}/> : <FileText size={15}/>}</div><div><strong>{document.title}</strong><small>{document.category} · v{document.version} · {document.incorporatedByName}</small></div><div className="fundamental-document-actions">{href && <a href={href} target="_blank" rel="noreferrer" title={isEn ? 'Open' : 'Abrir'}><ExternalLink size={14}/></a>}{canManage && <button title={isEn ? 'Replace version' : 'Reemplazar versión'} onClick={() => onAddDocument(document.id)}><RefreshCw size={14}/></button>}</div></div> })}</div> : <p className="fundamental-muted">{isEn ? 'No documentation attached yet.' : 'Todavía no hay documentación adjunta.'}</p>}</DetailSection><DetailSection icon={Bot} title={isEn ? 'Agent activity & human review' : 'Actividad de agentes y revisión humana'} action={canManage ? <button className="fundamental-small-action" onClick={() => onPrepareAgent('review opportunity and prepare a human-reviewed checklist')}><Bot size={14}/>{isEn ? 'Prepare review' : 'Preparar revisión'}</button> : null}>{study.activity.filter(item => item.kind === 'agent_task').length ? study.activity.filter(item => item.kind === 'agent_task').slice(0, 4).map(item => <div className="fundamental-agent-activity" key={item.id}><Bot size={15}/><span><strong>{item.summary}</strong><small>{item.actorName} · {new Date(item.createdAt).toLocaleString(lang === 'es' ? 'es-US' : 'en-US')}</small></span></div>) : <p className="fundamental-muted">{isEn ? 'No agent action recorded. Any future agent task requires human review before submission.' : 'No hay actividad de agentes. Toda tarea futura requiere revisión humana antes de enviar.'}</p>}</DetailSection><DetailSection icon={History} title={isEn ? 'Status history & audit' : 'Historial y auditoría'}>{study.history.map(item => <div className="fundamental-history" key={item.id}><span>{item.toStatus}</span><div><strong>{item.changedByName}</strong><small>{new Date(item.changedAt).toLocaleString(lang === 'es' ? 'es-US' : 'en-US')} · {item.note || (isEn ? 'Status update' : 'Actualización de estado')}</small></div></div>)}</DetailSection></aside>;
}

function DetailSection({ icon: Icon, title, action, children }) { return <section className="fundamental-detail-section"><header><div><Icon size={15}/><h4>{title}</h4></div>{action}</header>{children}</section>; }
function Info({ label: title, value, icon: Icon }) { return <div className="fundamental-info"><Icon size={14}/><span><small>{title}</small><strong>{value}</strong></span></div>; }
function FormField({ label: title, required, children }) { return <label className="fundamental-field"><span>{title}{required ? ' *' : ''}</span>{children}</label>; }
function Modal({ title, onClose, children }) { return <div className="fundamental-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="fundamental-modal"><header><div><span>RESEARCH WORKSPACE</span><h3>{title}</h3></div><button onClick={onClose}><X size={18}/></button></header>{children}</div></div>; }
function ModalActions({ saving, lang, onCancel }) { return <div className="fundamental-modal-actions"><button type="button" onClick={onCancel}>{lang === 'en' ? 'Cancel' : 'Cancelar'}</button><button className="fundamental-primary" disabled={saving} type="submit">{saving ? (lang === 'en' ? 'Saving…' : 'Guardando…') : (lang === 'en' ? 'Save' : 'Guardar')}</button></div>; }
