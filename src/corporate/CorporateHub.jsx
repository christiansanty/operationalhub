import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock3,
  Crown, Download, FilePlus2, FileText, Flag, Lightbulb, ListChecks, LockKeyhole, MessageSquare,
  Mic, Paperclip, Plus, RefreshCw, Route, Save, Search, ShieldCheck, Target, Users, X
} from 'lucide-react';
import './corporate-hub.css';

const categoryConfig = {
  idea: { icon: Lightbulb, en: 'Ideas', es: 'Ideas', description: { en: 'Capture opportunities, hypotheses and decisions.', es: 'Captura oportunidades, hipótesis y decisiones.' }, tools: { en: ['Capture prompt', 'Document', 'Follow-up'], es: ['Captura', 'Documento', 'Seguimiento'] } },
  blueprint: { icon: FileText, en: 'Blueprints', es: 'Blueprints', description: { en: 'Shape operating models, plans and contingencies.', es: 'Diseña modelos operativos, planes y contingencias.' }, tools: { en: ['Plan builder', 'Attachments', 'Milestones'], es: ['Constructor de planes', 'Adjuntos', 'Hitos'] } },
  strategy: { icon: Target, en: 'Strategies', es: 'Estrategias', description: { en: 'Define priorities, direction and intended outcomes.', es: 'Define prioridades, dirección y resultados.' }, tools: { en: ['Priorities', 'Collaborators', 'Reviews'], es: ['Prioridades', 'Colaboradores', 'Revisiones'] } },
  action: { icon: ListChecks, en: 'Actions', es: 'Acciones', description: { en: 'Turn decisions into owned, dated execution.', es: 'Convierte decisiones en ejecución con responsables y fechas.' }, tools: { en: ['Owner', 'Deadline', 'Progress notes'], es: ['Responsable', 'Deadline', 'Notas de progreso'] } },
};

const emptyDraft = category => ({ category: category || 'idea', title: '', summary: '', objective: '', nextStep: '', owner: '', collaborators: '', priority: 'medium', status: 'draft', targetDate: '', prompt: '', note: '', generateDocument: true });
const statusOptions = { draft: { en: 'Draft', es: 'Borrador' }, review: { en: 'Under review', es: 'En revisión' }, approved: { en: 'Approved', es: 'Aprobado' }, active: { en: 'In execution', es: 'En ejecución' }, done: { en: 'Completed', es: 'Completado' } };
const priorityOptions = { low: { en: 'Low', es: 'Baja' }, medium: { en: 'Medium', es: 'Media' }, high: { en: 'High', es: 'Alta' }, critical: { en: 'Critical', es: 'Crítica' } };

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Corporate request failed');
  return payload;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',').pop());
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(value, lang) {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-US', { dateStyle: 'medium' }).format(new Date(value)); } catch { return value; }
}

function DictationButton({ lang, onText, recording, setRecording }) {
  const isEn = lang === 'en';
  const recognitionRef = useRef(null);
  const start = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { window.alert(isEn ? 'Voice dictation is not available in this browser.' : 'La dictación por voz no está disponible en este navegador.'); return; }
    const recognition = new Recognition();
    recognition.lang = isEn ? 'en-US' : 'es-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = event => onText(Array.from(event.results).map(result => result[0]?.transcript || '').join(' '));
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    setRecording(true);
    recognition.start();
  };
  const stop = () => { recognitionRef.current?.stop(); setRecording(false); };
  return <button type="button" className={`corporate-dictate-button ${recording ? 'recording' : ''}`} onClick={recording ? stop : start}><Mic size={15}/>{recording ? (isEn ? 'Stop' : 'Detener') : (isEn ? 'Dictate' : 'Dictar')}</button>;
}

function RecordCard({ item, isEn, onOpen }) {
  const config = categoryConfig[item.category];
  const Icon = config.icon;
  return <button className={`corporate-initiative priority-${item.priority}`} onClick={() => onOpen(item)}>
    <header><span className="corporate-type"><Icon/>{config[isEn ? 'en' : 'es']}</span><span className={`corporate-status ${item.status}`}>{statusOptions[item.status]?.[isEn ? 'en' : 'es'] || item.status}</span></header>
    <h3>{item.title}</h3><p>{item.summary || (isEn ? 'No summary added yet.' : 'Aún no se ha añadido un resumen.')}</p>
    <div className="corporate-initiative-meta"><span><Flag/>{priorityOptions[item.priority]?.[isEn ? 'en' : 'es'] || item.priority}</span><span><CalendarDays/>{formatDate(item.targetDate, isEn ? 'en' : 'es')}</span></div>
    <div className="corporate-card-secondary"><span><Users/>{item.owner || (isEn ? 'Unassigned' : 'Sin responsable')}</span><span><MessageSquare/>{item.noteCount || 0}</span><span><Paperclip/>{item.attachmentCount || 0}</span></div>
    <footer><span>{item.createdByName || item.owner}</span><ArrowRight/></footer>
  </button>;
}

export default function CorporateHub({ lang = 'es', ownerName = 'Executive' }) {
  const isEn = lang === 'en';
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(emptyDraft('idea'));
  const [note, setNote] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);

  const load = async () => {
    try { setError(''); const payload = await api('/api/corporate/records'); setItems(payload.records || []); } catch (loadError) { setError(loadError.message); }
  };
  useEffect(() => { load(); }, []);
  const categoryName = category => categoryConfig[category]?.[isEn ? 'en' : 'es'] || category;
  const activeConfig = activeCategory ? categoryConfig[activeCategory] : null;
  const filtered = useMemo(() => items.filter(item => (!activeCategory || item.category === activeCategory) && `${item.title} ${item.summary} ${item.objective} ${item.nextStep} ${item.owner} ${(item.collaborators || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())), [items, activeCategory, query]);
  const openCreate = category => { setDraft({ ...emptyDraft(category), owner: ownerName || '' }); setError(''); setModalOpen(true); };
  const openRecord = async item => { setBusy(true); setError(''); try { const payload = await api(`/api/corporate/records/${encodeURIComponent(item.id)}`); setSelected(payload.record); setPrompt(payload.record.prompt || ''); setMessage(''); } catch (openError) { setError(openError.message); } finally { setBusy(false); } };
  const closeCreate = () => { setModalOpen(false); setDraft(emptyDraft(activeCategory || 'idea')); };
  const createRecord = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { const payload = await api('/api/corporate/records', { method: 'POST', body: JSON.stringify(draft) }); setItems(current => [payload.record, ...current]); setModalOpen(false); setSelected(payload.record); setPrompt(payload.record.prompt || ''); setActiveCategory(payload.record.category); } catch (createError) { setError(createError.message); } finally { setBusy(false); }
  };
  const updateRecord = async changes => {
    if (!selected) return;
    setBusy(true); setError('');
    try { const payload = await api(`/api/corporate/records/${encodeURIComponent(selected.id)}`, { method: 'PATCH', body: JSON.stringify(changes) }); setSelected(payload.record); setItems(current => current.map(item => item.id === payload.record.id ? payload.record : item)); } catch (updateError) { setError(updateError.message); } finally { setBusy(false); }
  };
  const addNote = async event => { event.preventDefault(); if (!note.trim()) return; setBusy(true); try { const payload = await api(`/api/corporate/records/${encodeURIComponent(selected.id)}/notes`, { method: 'POST', body: JSON.stringify({ note }) }); setSelected(payload.record); setItems(current => current.map(item => item.id === payload.record.id ? payload.record : item)); setNote(''); } catch (noteError) { setError(noteError.message); } finally { setBusy(false); } };
  const generateDocument = async () => { if (!prompt.trim()) return; setBusy(true); setError(''); try { const payload = await api(`/api/corporate/records/${encodeURIComponent(selected.id)}/document`, { method: 'POST', body: JSON.stringify({ prompt }) }); setSelected(payload.record); setItems(current => current.map(item => item.id === payload.record.id ? payload.record : item)); } catch (documentError) { setError(documentError.message); } finally { setBusy(false); } };
  const uploadAttachment = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file || !selected) return;
    if (file.size > 30 * 1024 * 1024) { setError(isEn ? 'Attachments are limited to 30 MB.' : 'Los adjuntos están limitados a 30 MB.'); return; }
    setBusy(true); setError('');
    try { const payload = await api(`/api/corporate/records/${encodeURIComponent(selected.id)}/attachments`, { method: 'POST', body: JSON.stringify({ filename: file.name, type: file.type, base64: await fileToBase64(file) }) }); setSelected(payload.record); setItems(current => current.map(item => item.id === payload.record.id ? payload.record : item)); } catch (uploadError) { setError(uploadError.message); } finally { setBusy(false); }
  };

  return <div className="page corporate-page">
    <header className="corporate-hero"><div className="corporate-hero-icon"><Crown/></div><div><span>{isEn ? 'CORPORATE · EXECUTIVES ONLY' : 'CORPORATE · SOLO EJECUTIVOS'}</span><h1>{isEn ? 'Executive Workspace' : 'Espacio Ejecutivo Corporate'}</h1><p>{isEn ? 'A shared workspace for ideas, blueprints, strategies and owned actions.' : 'Un workspace compartido para ideas, blueprints, estrategias y acciones con responsables.'}</p></div><div className="corporate-security"><LockKeyhole/><span><strong>{isEn ? 'Restricted access' : 'Acceso restringido'}</strong><small>{isEn ? 'Corporate executives only' : 'Solo ejecutivos Corporate'}</small></span></div></header>
    <section className="corporate-trust-banner"><ShieldCheck/><p><strong>{isEn ? 'Private, collaborative records' : 'Registros privados y colaborativos'}</strong>{isEn ? 'Every record keeps its author, collaborators, deadline, progress notes, generated document and attachments in the Corporate workspace.' : 'Cada registro conserva autor, colaboradores, deadline, notas de avance, documento generado y adjuntos dentro del workspace Corporate.'}</p></section>
    {error && <div className="corporate-alert"><AlertTriangle size={17}/>{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
    {!activeCategory ? <section className="corporate-module-launcher"><div className="corporate-section-heading"><div><span>{isEn ? 'WORKSPACE MODULES' : 'MÓDULOS DEL WORKSPACE'}</span><h2>{isEn ? 'Choose a module to open it' : 'Elige un módulo para abrirlo'}</h2><p>{isEn ? 'Each module has its own records, tools and follow-up.' : 'Cada módulo tiene sus propios registros, herramientas y seguimiento.'}</p></div></div><div className="corporate-category-grid">{Object.entries(categoryConfig).map(([key, config]) => { const Icon = config.icon; return <button key={key} onClick={() => setActiveCategory(key)}><span><Icon/></span><div><strong>{config[isEn ? 'en' : 'es']}</strong><small>{config.description[isEn ? 'en' : 'es']}</small></div><b>{items.filter(item => item.category === key).length}</b><ChevronRight/></button>; })}</div></section> : <section className="corporate-workspace card"><div className="corporate-workspace-head"><div><button className="corporate-back-button" onClick={() => setActiveCategory(null)}><ArrowLeft size={15}/>{isEn ? 'All modules' : 'Todos los módulos'}</button><span>{isEn ? 'OPEN CORPORATE MODULE' : 'MÓDULO CORPORATE ABIERTO'}</span><h2>{activeConfig[isEn ? 'en' : 'es']}</h2><p>{activeConfig.description[isEn ? 'en' : 'es']}</p><div className="corporate-tool-chips">{activeConfig.tools[isEn ? 'en' : 'es'].map(tool => <span key={tool}><CheckCircle2 size={13}/>{tool}</span>)}</div></div><button className="primary" onClick={() => openCreate(activeCategory)}><Plus/>{isEn ? `New ${activeConfig.en.slice(0, -1)}` : `Nueva ${activeConfig.es.slice(0, -1)}`}</button></div><div className="corporate-toolbar"><div className="search-box"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={isEn ? `Search ${activeConfig.en.toLowerCase()}…` : `Buscar ${activeConfig.es.toLowerCase()}…`}/></div><div className="corporate-module-switcher">{Object.entries(categoryConfig).map(([key, config]) => <button key={key} className={key === activeCategory ? 'active' : ''} onClick={() => setActiveCategory(key)}>{config[isEn ? 'en' : 'es']}</button>)}</div></div>{!filtered.length ? <div className="corporate-empty"><FilePlus2/><span>{activeConfig[isEn ? 'en' : 'es'].toUpperCase()}</span><h3>{items.some(item => item.category === activeCategory) ? (isEn ? 'No records match this search' : 'No hay registros para esta búsqueda') : (isEn ? 'This module is ready' : 'Este módulo está listo')}</h3><p>{isEn ? 'Create a record, dictate a prompt into a document, add collaborators and track the work here.' : 'Crea un registro, dicta un prompt para convertirlo en documento, añade colaboradores y sigue el trabajo aquí.'}</p><button className="primary" onClick={() => openCreate(activeCategory)}><Plus/>{isEn ? 'Create first record' : 'Crear primer registro'}</button></div> : <div className="corporate-card-grid">{filtered.map(item => <RecordCard key={item.id} item={item} isEn={isEn} onOpen={openRecord}/>)}</div>}</section>}

    {modalOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeCreate()}><form className="quick-modal corporate-modal" onSubmit={createRecord}><div className="modal-heading"><div><span>{categoryName(draft.category)} · {isEn ? 'COLLABORATIVE RECORD' : 'REGISTRO COLABORATIVO'}</span><h2>{isEn ? 'Create workspace record' : 'Crear registro del workspace'}</h2><p>{isEn ? 'The system records who created it and when.' : 'El sistema registra quién lo creó y cuándo.'}</p></div><button type="button" onClick={closeCreate}><X/></button></div><div className="corporate-form-grid"><label>{isEn ? 'Module' : 'Módulo'}<select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>{Object.entries(categoryConfig).map(([key, config]) => <option key={key} value={key}>{config[isEn ? 'en' : 'es']}</option>)}</select></label><label>{isEn ? 'Owner' : 'Responsable'}<input required value={draft.owner} onChange={event => setDraft({ ...draft, owner: event.target.value })}/></label><label className="span-two">{isEn ? 'Title' : 'Título'}<input required value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder={isEn ? 'Example: Contingency plan' : 'Ejemplo: Plan de contingencia'}/></label><label className="span-two">{isEn ? 'Summary' : 'Resumen'}<textarea required value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })}/></label><label className="span-two">{isEn ? 'Objective' : 'Objetivo'}<textarea value={draft.objective} onChange={event => setDraft({ ...draft, objective: event.target.value })}/></label><label className="span-two">{isEn ? 'Next step' : 'Próximo paso'}<textarea value={draft.nextStep} onChange={event => setDraft({ ...draft, nextStep: event.target.value })}/></label><label>{isEn ? 'Collaborators' : 'Colaboradores'}<input value={draft.collaborators} onChange={event => setDraft({ ...draft, collaborators: event.target.value })} placeholder={isEn ? 'Pavel, name or email' : 'Pavel, nombre o email'}/></label><label>{isEn ? 'Deadline' : 'Deadline'}<input type="date" value={draft.targetDate} onChange={event => setDraft({ ...draft, targetDate: event.target.value })}/></label><label>{isEn ? 'Priority' : 'Prioridad'}<select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value })}>{Object.entries(priorityOptions).map(([key, option]) => <option key={key} value={key}>{option[isEn ? 'en' : 'es']}</option>)}</select></label><label>{isEn ? 'Status' : 'Estado'}<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>{Object.entries(statusOptions).map(([key, option]) => <option key={key} value={key}>{option[isEn ? 'en' : 'es']}</option>)}</select></label><label className="span-two corporate-prompt-field">{isEn ? 'Dictate or write a prompt to generate a document' : 'Dicta o escribe un prompt para generar un documento'}<textarea value={draft.prompt} onChange={event => setDraft({ ...draft, prompt: event.target.value })} placeholder={isEn ? 'Describe the document you want Corporate to structure…' : 'Describe el documento que quieres estructurar en Corporate…'}/><DictationButton lang={lang} recording={recording} setRecording={setRecording} onText={text => setDraft(current => ({ ...current, prompt: `${current.prompt}${current.prompt ? ' ' : ''}${text}` }))}/></label><label className="span-two">{isEn ? 'Initial follow-up note' : 'Nota inicial de seguimiento'}<textarea value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })}/></label></div><div className="modal-actions"><button type="button" onClick={closeCreate}>{isEn ? 'Cancel' : 'Cancelar'}</button><button className="primary" type="submit" disabled={busy}><Save/>{busy ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Create record' : 'Crear registro')}</button></div></form></div>}

    {selected && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelected(null)}><section className="quick-modal corporate-detail-modal"><div className="modal-heading"><div><span>{categoryName(selected.category)} · {priorityOptions[selected.priority]?.[isEn ? 'en' : 'es']}</span><h2>{selected.title}</h2><p className="corporate-created-line"><Clock3 size={14}/>{isEn ? 'Created' : 'Creado'} {formatDate(selected.createdAt, lang)} · {selected.createdByName}</p></div><button onClick={() => setSelected(null)}><X/></button></div><div className="corporate-detail-meta"><div><small>{isEn ? 'OWNER' : 'RESPONSABLE'}</small><strong>{selected.owner || '—'}</strong></div><div><small>{isEn ? 'DEADLINE' : 'DEADLINE'}</small><strong>{formatDate(selected.targetDate, lang)}</strong></div><div><small>{isEn ? 'COLLABORATORS' : 'COLABORADORES'}</small><strong>{selected.collaborators?.join(', ') || '—'}</strong></div><div><small>{isEn ? 'LAST UPDATED' : 'ÚLTIMA ACTUALIZACIÓN'}</small><strong>{formatDate(selected.updatedAt, lang)}</strong></div></div><div className="corporate-detail-status"><label>{isEn ? 'Progress status' : 'Estado de progreso'}<select disabled={busy} value={selected.status} onChange={event => updateRecord({ ...selected, status: event.target.value })}>{Object.entries(statusOptions).map(([key, option]) => <option key={key} value={key}>{option[isEn ? 'en' : 'es']}</option>)}</select></label><label>{isEn ? 'Priority' : 'Prioridad'}<select disabled={busy} value={selected.priority} onChange={event => updateRecord({ ...selected, priority: event.target.value })}>{Object.entries(priorityOptions).map(([key, option]) => <option key={key} value={key}>{option[isEn ? 'en' : 'es']}</option>)}</select></label></div><p className="corporate-detail-summary">{selected.summary}</p>{selected.objective && <section><span><Target/>{isEn ? 'OBJECTIVE' : 'OBJETIVO'}</span><p>{selected.objective}</p></section>}{selected.nextStep && <section><span><Route/>{isEn ? 'NEXT STEP' : 'PRÓXIMO PASO'}</span><p>{selected.nextStep}</p></section>}
      <section className="corporate-document-panel"><div className="corporate-panel-heading"><span><FileText/>{isEn ? 'DOCUMENT FROM PROMPT' : 'DOCUMENTO DESDE PROMPT'}</span><button type="button" onClick={generateDocument} disabled={busy || !prompt.trim()}><RefreshCw size={14}/>{isEn ? 'Generate' : 'Generar'}</button></div><textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={isEn ? 'Write or dictate the prompt for the document…' : 'Escribe o dicta el prompt del documento…'}/><DictationButton lang={lang} recording={recording} setRecording={setRecording} onText={text => setPrompt(current => `${current}${current ? ' ' : ''}${text}`)}/>{selected.documentContent && <pre>{selected.documentContent}</pre>}</section>
      <section className="corporate-followup-panel"><div className="corporate-panel-heading"><span><MessageSquare/>{isEn ? 'FOLLOW-UP NOTES' : 'NOTAS DE SEGUIMIENTO'}</span></div><form onSubmit={addNote}><textarea value={note} onChange={event => setNote(event.target.value)} placeholder={isEn ? 'Add progress, decision or next action…' : 'Añade avance, decisión o próxima acción…'}/><button className="primary" disabled={busy || !note.trim()}><Plus size={15}/>{isEn ? 'Add note' : 'Añadir nota'}</button></form><div className="corporate-notes-list">{selected.notes?.length ? selected.notes.map(item => <article key={item.id}><div><strong>{item.authorName}</strong><small>{formatDate(item.createdAt, lang)}</small></div><p>{item.note}</p></article>) : <p className="corporate-muted">{isEn ? 'No follow-up notes yet.' : 'Aún no hay notas de seguimiento.'}</p>}</div></section>
      <section className="corporate-attachments-panel"><div className="corporate-panel-heading"><span><Paperclip/>{isEn ? 'ATTACHMENTS' : 'ADJUNTOS'}</span><button type="button" onClick={() => fileInput.current?.click()} disabled={busy}><Plus size={14}/>{isEn ? 'Attach file' : 'Adjuntar archivo'}</button><input ref={fileInput} hidden type="file" onChange={uploadAttachment}/></div>{selected.attachments?.length ? <div className="corporate-attachment-list">{selected.attachments.map(item => <a key={item.id} href={item.fileUrl} target="_blank" rel="noreferrer"><FileText size={15}/><span>{item.filename}<small>{item.uploadedByName} · {formatDate(item.createdAt, lang)}</small></span><Download size={14}/></a>)}</div> : <p className="corporate-muted">{isEn ? 'Add supporting documents, plans or references.' : 'Añade documentos, planes o referencias de apoyo.'}</p>}</section>
      <div className="corporate-detail-footer"><span>{selected.status === 'done' ? <><CheckCircle2/>{isEn ? 'Completed' : 'Completado'}</> : <><AlertTriangle/>{isEn ? 'Active follow-up' : 'Seguimiento activo'}</>}</span><span>{busy ? (isEn ? 'Saving…' : 'Guardando…') : message}</span></div></section></div>}
  </div>;
}
