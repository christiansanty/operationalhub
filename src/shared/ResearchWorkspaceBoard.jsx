import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ExternalLink, FileText, Flag, Link2, Paperclip, Pencil, Plus, Save, Trash2, UserRound, X } from 'lucide-react';
import './research-workspace-board.css';

const MAX_FILE_BYTES = 30 * 1024 * 1024;
const statuses = ['planned', 'in-progress', 'blocked', 'done'];
const priorities = ['low', 'medium', 'high'];
const today = () => new Date().toISOString().slice(0, 10);
const blankRecord = () => ({ title: '', details: '', ideaDate: today(), deadline: '', status: 'planned', priority: 'medium', owner: '', notes: '', attachments: [] });

const copy = {
    en: {
    kicker: 'RESEARCH WORKSPACE', title: 'Ideas, notes and deadlines in one file', subtitle: 'Each research idea is one shared record. The row shows when it was proposed, its note, projected deadline, status, priority and supporting files or links.', add: 'Add idea', edit: 'Edit record', close: 'Close', save: 'Save record', saving: 'Saving…', titleLabel: 'Idea or work title', details: 'Context or description', ideaDate: 'Date proposed', deadline: 'Projected deadline', status: 'Status', priority: 'Priority', owner: 'Working on it', notes: 'Note', support: 'Documents and links for this note', addLink: 'Add link', linkTitle: 'Link title', linkUrl: 'Google Sheet or any URL', chooseFile: 'Add document or photo', noResources: 'No documents or links yet.', cancel: 'Cancel', empty: 'No research records yet. Add the first idea to start the shared file.', open: 'Open', created: 'Proposed', due: 'Deadline', by: 'Created by', resources: 'Resources', noNote: 'Add a note', noDeadline: 'No deadline', statusLabels: { planned: 'Planned', 'in-progress': 'In progress', blocked: 'Blocked', done: 'Done' }, priorityLabels: { low: 'Low', medium: 'Medium', high: 'High' }, loadFailed: 'Research workspace could not be loaded.', failed: 'The research record could not be saved.', saved: 'Research record saved.', deleted: 'Research record removed.', remove: 'Remove', removeConfirm: 'Remove this research record?', invalidLink: 'Use a valid http or https link.', fileLimit: 'Files must be 30 MB or smaller.', attachmentFailed: 'The document or link could not be saved.', all: 'All', filter: 'Filter', records: 'records', overdue: 'overdue', openCount: 'open', highCount: 'high priority', retry: 'Try again', manageRequired: 'Manage access is required to edit this record.',
  },
  es: {
    kicker: 'WORKSPACE DE RESEARCH', title: 'Ideas, notas y deadlines en un solo archivo', subtitle: 'Cada idea de Research es un registro compartido. La fila muestra cuándo se planteó, su nota, deadline proyectado, estado, prioridad y documentos o enlaces de soporte.', add: 'Agregar idea', edit: 'Editar registro', close: 'Cerrar', save: 'Guardar registro', saving: 'Guardando…', titleLabel: 'Título de la idea o trabajo', details: 'Contexto o descripción', ideaDate: 'Fecha en que se planteó', deadline: 'Deadline proyectado', status: 'Estado', priority: 'Prioridad', owner: 'Quién trabaja en esto', notes: 'Nota', support: 'Documentos y enlaces para esta nota', addLink: 'Agregar enlace', linkTitle: 'Título del enlace', linkUrl: 'Google Sheet o cualquier URL', chooseFile: 'Agregar documento o foto', noResources: 'Todavía no hay documentos ni enlaces.', cancel: 'Cancelar', empty: 'Todavía no hay registros de Research. Agrega la primera idea para iniciar el archivo compartido.', open: 'Abrir', created: 'Planteada', due: 'Deadline', by: 'Creada por', resources: 'Recursos', noNote: 'Agregar una nota', noDeadline: 'Sin deadline', statusLabels: { planned: 'Planificada', 'in-progress': 'En progreso', blocked: 'Bloqueada', done: 'Completada' }, priorityLabels: { low: 'Baja', medium: 'Media', high: 'Alta' }, loadFailed: 'No se pudo cargar el workspace de Research.', failed: 'No se pudo guardar el registro de Research.', saved: 'Registro de Research guardado.', deleted: 'Registro de Research eliminado.', remove: 'Eliminar', removeConfirm: '¿Eliminar este registro de Research?', invalidLink: 'Usa un enlace http o https válido.', fileLimit: 'Los archivos deben pesar 30 MB o menos.', attachmentFailed: 'No se pudo guardar el documento o enlace.', all: 'Todos', filter: 'Filtrar', records: 'registros', overdue: 'vencidos', openCount: 'abiertos', highCount: 'alta prioridad', retry: 'Intentar de nuevo', manageRequired: 'Se requiere acceso Manage para editar este registro.',
  },
};

const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || '').split(',').pop() || '');
  reader.onerror = () => reject(new Error('file_read_failed'));
  reader.readAsDataURL(file);
});

const dateLabel = (value, lang) => {
  if (!value) return '';
  try { return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)); }
  catch { return value; }
};

export default function ResearchWorkspaceBoard({ lang = 'en', scopeKey = 'entity-research' }) {
  const t = copy[lang] || copy.en;
  const [items, setItems] = useState([]);
  const [permissions, setPermissions] = useState({ canCreate: false, canManage: false });
  const [record, setRecord] = useState(blankRecord());
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/research-workspace/items?scope=${encodeURIComponent(scopeKey)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.loadFailed);
      setItems(payload.items || []);
      setPermissions({ canCreate: Boolean(payload.canCreate), canManage: Boolean(payload.canManage) });
      setError('');
    } catch (loadError) { setError(loadError.message || t.loadFailed); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (scopeKey) load(); }, [scopeKey]);

  const filtered = useMemo(() => items.filter(item => (statusFilter === 'all' || item.status === statusFilter) && (priorityFilter === 'all' || item.priority === priorityFilter)), [items, statusFilter, priorityFilter]);
  const summary = useMemo(() => ({ open: items.filter(item => item.status !== 'done').length, high: items.filter(item => item.priority === 'high' && item.status !== 'done').length, overdue: items.filter(item => item.deadline && item.deadline < today() && item.status !== 'done').length }), [items]);

  const closeForm = () => { setOpen(false); setEditing(null); setRecord(blankRecord()); setLinkTitle(''); setLinkUrl(''); };
  const openNew = () => { setEditing(null); setRecord(blankRecord()); setLinkTitle(''); setLinkUrl(''); setError(''); setMessage(''); setOpen(true); };
  const openEdit = item => { if (!permissions.canManage) { setMessage(t.manageRequired); return; } setEditing(item); setRecord({ title: item.title || '', details: item.details || '', ideaDate: item.ideaDate || item.createdAt?.slice(0, 10) || today(), deadline: item.deadline || '', status: item.status || 'planned', priority: item.priority || 'medium', owner: item.owner || '', notes: item.notes || '', attachments: item.attachments || [] }); setLinkTitle(''); setLinkUrl(''); setError(''); setMessage(''); setOpen(true); };

  const addLink = () => {
    try {
      const parsed = new URL(linkUrl.trim());
      if (!['http:', 'https:'].includes(parsed.protocol) || !linkTitle.trim()) throw new Error();
      setRecord(current => ({ ...current, attachments: [...current.attachments, { pending: true, id: `pending-${Date.now()}`, title: linkTitle.trim(), kind: parsed.hostname.includes('docs.google.com') ? 'google-sheet' : 'link', url: parsed.toString(), filename: parsed.toString() }] }));
      setLinkTitle(''); setLinkUrl(''); setError('');
    } catch { setError(t.invalidLink); }
  };

  const addFile = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setError(t.fileLimit); return; }
    try {
      const base64 = await readFile(file);
      setRecord(current => ({ ...current, attachments: [...current.attachments, { pending: true, id: `pending-${Date.now()}`, title: file.name, kind: file.type.startsWith('image/') ? 'photo' : 'file', filename: file.name, type: file.type, base64 }] }));
      setError('');
    } catch { setError(t.attachmentFailed); }
  };

  const saveAttachments = async () => {
    const saved = [];
    for (const attachment of record.attachments) {
      if (!attachment.pending) { saved.push(attachment); continue; }
      const response = await fetch('/api/workspace-resources', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scopeKey, kind: attachment.kind, title: attachment.title, url: attachment.url || '', filename: attachment.filename || '', type: attachment.type || '', base64: attachment.base64 || '' }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.attachmentFailed);
      saved.push(payload.resource);
    }
    return saved;
  };

  const submit = async event => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const attachments = await saveAttachments();
      const endpoint = editing ? `/api/research-workspace/items/${encodeURIComponent(editing.id)}` : '/api/research-workspace/items';
      const response = await fetch(endpoint, { method: editing ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scopeKey, ...record, title: record.title.trim(), details: record.details.trim(), owner: record.owner.trim(), notes: record.notes.trim(), attachments }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.failed);
      setItems(current => editing ? current.map(item => item.id === payload.item.id ? payload.item : item) : [payload.item, ...current]);
      closeForm(); setMessage(t.saved);
    } catch (submitError) { setError(submitError.message || t.failed); }
    finally { setSaving(false); }
  };

  const patchField = async (item, field, value) => {
    if (!permissions.canManage) return;
    try {
      const response = await fetch(`/api/research-workspace/items/${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.failed);
      setItems(current => current.map(entry => entry.id === item.id ? payload.item : entry));
    } catch (patchError) { setError(patchError.message || t.failed); }
  };

  const remove = async item => {
    if (!window.confirm(t.removeConfirm)) return;
    const response = await fetch(`/api/research-workspace/items/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    if (response.ok) { setItems(current => current.filter(entry => entry.id !== item.id)); setMessage(t.deleted); }
    else setError(t.failed);
  };

  return <section className="research-board-panel">
    <header className="research-board-header"><div><span><CheckCircle2 size={15}/>{t.kicker}</span><h3>{t.title}</h3><p>{t.subtitle}</p></div>{permissions.canCreate && <button className="research-board-add" onClick={openNew}><Plus size={17}/>{t.add}</button>}</header>
    <div className="research-board-summary"><div><strong>{summary.open}</strong><span>{t.openCount}</span></div><div><strong>{summary.high}</strong><span>{t.highCount}</span></div><div><strong>{summary.overdue}</strong><span>{t.overdue}</span></div><div><strong>{items.length}</strong><span>{t.records}</span></div></div>
    {message && <p className="research-board-message">{message}</p>}{error && <p className="research-board-error">{error}</p>}
    <div className="research-board-toolbar"><span>{t.filter}</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">{t.all}</option>{statuses.map(value => <option key={value} value={value}>{t.statusLabels[value]}</option>)}</select><select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)}><option value="all">{t.all}</option>{priorities.map(value => <option key={value} value={value}>{t.priorityLabels[value]}</option>)}</select></div>
    {loading ? <div className="research-board-empty">Loading…</div> : filtered.length ? <div className="research-board-table-wrap"><div className="research-board-table-head"><span>{t.titleLabel}</span><span>{t.ideaDate}</span><span>{t.notes}</span><span>{t.deadline}</span><span>{t.resources}</span><span>{t.status}</span><span>{t.priority}</span><span aria-hidden="true"/></div>{filtered.map(item => <article className={`research-board-row priority-${item.priority}`} key={item.id}><div className="research-board-idea"><strong>{item.title}</strong>{item.details && <small>{item.details}</small>}<em><UserRound size={12}/>{t.by} {item.createdByName}</em></div><time className="research-board-date"><CalendarDays size={14}/>{dateLabel(item.ideaDate || item.createdAt?.slice(0, 10), lang)}</time><div className="research-board-note">{item.notes || <span>{t.noNote}</span>}</div><time className="research-board-deadline">{item.deadline ? <><CalendarDays size={14}/>{dateLabel(item.deadline, lang)}</> : <span>{t.noDeadline}</span>}</time><div className="research-board-resources">{item.attachments?.length ? <>{item.attachments.slice(0, 2).map(attachment => <a key={attachment.id || attachment.url} href={attachment.fileUrl || attachment.url} target="_blank" rel="noreferrer" title={attachment.title}><Paperclip size={13}/><span>{attachment.title}</span><ExternalLink size={11}/></a>)}{item.attachments.length > 2 && <small>+{item.attachments.length - 2}</small>}</> : <span>—</span>}</div><select className={`research-board-select status-${item.status}`} value={item.status} onChange={event => patchField(item, 'status', event.target.value)} disabled={!permissions.canManage} aria-label={t.status}><option value="planned">{t.statusLabels.planned}</option><option value="in-progress">{t.statusLabels['in-progress']}</option><option value="blocked">{t.statusLabels.blocked}</option><option value="done">{t.statusLabels.done}</option></select><select className={`research-board-select priority-${item.priority}`} value={item.priority} onChange={event => patchField(item, 'priority', event.target.value)} disabled={!permissions.canManage} aria-label={t.priority}><option value="low">{t.priorityLabels.low}</option><option value="medium">{t.priorityLabels.medium}</option><option value="high">{t.priorityLabels.high}</option></select><div className="research-board-actions"><button onClick={() => openEdit(item)} title={permissions.canManage ? t.edit : t.open}><Pencil size={14}/></button>{permissions.canManage && <button onClick={() => remove(item)} title={t.remove}><Trash2 size={14}/></button>}</div></article>)}</div> : <div className="research-board-empty"><FileText size={22}/><span>{t.empty}</span>{permissions.canCreate && <button onClick={openNew}><Plus size={15}/>{t.add}</button>}</div>}
    {open && <div className="research-board-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeForm()}><form className="research-board-modal" onSubmit={submit}><header><div><span><FileText size={14}/>{t.kicker}</span><h3>{editing ? t.edit : t.add}</h3></div><button type="button" onClick={closeForm} aria-label={t.close}><X size={18}/></button></header><div className="research-board-form-grid"><label className="wide">{t.titleLabel}<input required maxLength="220" autoFocus value={record.title} onChange={event => setRecord({ ...record, title: event.target.value })}/></label><label>{t.ideaDate}<input type="date" required value={record.ideaDate} onChange={event => setRecord({ ...record, ideaDate: event.target.value })}/></label><label>{t.deadline}<input type="date" value={record.deadline} onChange={event => setRecord({ ...record, deadline: event.target.value })}/></label><label>{t.status}<select value={record.status} onChange={event => setRecord({ ...record, status: event.target.value })}>{statuses.map(value => <option key={value} value={value}>{t.statusLabels[value]}</option>)}</select></label><label>{t.priority}<select value={record.priority} onChange={event => setRecord({ ...record, priority: event.target.value })}>{priorities.map(value => <option key={value} value={value}>{t.priorityLabels[value]}</option>)}</select></label><label>{t.owner}<input maxLength="180" value={record.owner} onChange={event => setRecord({ ...record, owner: event.target.value })}/></label><label className="wide">{t.details}<textarea rows="3" maxLength="5000" value={record.details} onChange={event => setRecord({ ...record, details: event.target.value })}/></label><label className="wide research-board-note-field">{t.notes}<textarea rows="4" maxLength="8000" value={record.notes} onChange={event => setRecord({ ...record, notes: event.target.value })}/></label></div><section className="research-board-support"><header><span><Paperclip size={15}/>{t.support}</span><small>{record.attachments.length ? `${record.attachments.length} ${t.resources.toLowerCase()}` : t.noResources}</small></header>{record.attachments.length > 0 && <div className="research-board-pending">{record.attachments.map(attachment => <div key={attachment.id || attachment.url}><span><Paperclip size={13}/>{attachment.title}</span><button type="button" onClick={() => setRecord(current => ({ ...current, attachments: current.attachments.filter(entry => entry.id !== attachment.id) }))} title={t.remove}><X size={14}/></button></div>)}</div>}<div className="research-board-link-fields"><input value={linkTitle} onChange={event => setLinkTitle(event.target.value)} placeholder={t.linkTitle}/><input value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder={t.linkUrl} type="url"/><button type="button" onClick={addLink}><Link2 size={15}/>{t.addLink}</button></div><label className="research-board-file-button"><FileText size={15}/>{t.chooseFile}<input type="file" onChange={addFile}/></label></section><div className="research-board-modal-actions"><button type="button" onClick={closeForm}>{t.cancel}</button><button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving ? t.saving : t.save}</button></div></form></div>}
  </section>;
}
