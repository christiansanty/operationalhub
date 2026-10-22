import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Lightbulb, MessageSquareText, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import './research-workspace-ideas.css';

const copy = {
  en: {
    kicker: 'SHARED RESEARCH IDEAS', title: 'Ideas everyone can move forward', subtitle: 'Capture a study opportunity, process improvement or question and keep its owner, status and history visible to the Research team.', add: 'Share an idea', close: 'Close', ideaTitle: 'Idea title', details: 'What should the team know?', status: 'Starting status', save: 'Share with Research', saving: 'Sharing…', empty: 'No ideas have been shared in this Research workspace yet.', by: 'Shared by', updated: 'Updated', edit: 'Edit', remove: 'Remove', removeConfirm: 'Remove this shared idea?', statuses: { idea: 'Idea', review: 'In review', planned: 'Planned', 'in-progress': 'In progress', done: 'Done' }, loadFailed: 'Ideas could not be loaded.', failed: 'The idea could not be saved.', saved: 'Idea shared with Research.', update: 'Save changes', cancel: 'Cancel', updateFailed: 'The idea could not be updated.', deleteFailed: 'The idea could not be removed.', retry: 'Try again', statusOptions: ['idea', 'review', 'planned', 'in-progress', 'done'],
  },
  es: {
    kicker: 'IDEAS COMPARTIDAS DE RESEARCH', title: 'Ideas que todos pueden impulsar', subtitle: 'Captura una oportunidad de estudio, mejora de proceso o pregunta y mantén visible su responsable, estado e historial para el equipo de Research.', add: 'Compartir una idea', close: 'Cerrar', ideaTitle: 'Título de la idea', details: '¿Qué debe saber el equipo?', status: 'Estado inicial', save: 'Compartir con Research', saving: 'Compartiendo…', empty: 'Todavía no se han compartido ideas en este workspace de Research.', by: 'Compartida por', updated: 'Actualizada', edit: 'Editar', remove: 'Eliminar', removeConfirm: '¿Eliminar esta idea compartida?', statuses: { idea: 'Idea', review: 'En revisión', planned: 'Planificada', 'in-progress': 'En progreso', done: 'Completada' }, loadFailed: 'No se pudieron cargar las ideas.', failed: 'No se pudo guardar la idea.', saved: 'Idea compartida con Research.', update: 'Guardar cambios', cancel: 'Cancelar', updateFailed: 'No se pudo actualizar la idea.', deleteFailed: 'No se pudo eliminar la idea.', retry: 'Intentar de nuevo', statusOptions: ['idea', 'review', 'planned', 'in-progress', 'done'],
  },
};

const dateLabel = (value, lang) => {
  try { return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(value)); }
  catch { return value || ''; }
};

export default function ResearchWorkspaceIdeas({ lang = 'en', scopeKey = 'entity-research' }) {
  const t = copy[lang] || copy.en;
  const [ideas, setIdeas] = useState([]);
  const [canCreate, setCanCreate] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('idea');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/research-workspace/ideas?scope=${encodeURIComponent(scopeKey)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.loadFailed);
      setIdeas(payload.ideas || []);
      setCanCreate(Boolean(payload.canCreate));
      setCanManage(Boolean(payload.canManage));
      setError('');
    } catch (loadError) { setError(loadError.message || t.loadFailed); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (scopeKey) loadIdeas(); }, [scopeKey]);

  const counts = useMemo(() => t.statusOptions.reduce((result, key) => ({ ...result, [key]: ideas.filter(idea => idea.status === key).length }), {}), [ideas, t.statusOptions]);
  const resetForm = () => { setOpen(false); setEditing(null); setTitle(''); setDetails(''); setStatus('idea'); };
  const startEdit = idea => { setEditing(idea); setOpen(true); setTitle(idea.title); setDetails(idea.details); setStatus(idea.status); setMessage(''); setError(''); };

  const submit = async event => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const endpoint = editing ? `/api/research-workspace/ideas/${encodeURIComponent(editing.id)}` : '/api/research-workspace/ideas';
      const response = await fetch(endpoint, { method: editing ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scopeKey, title: title.trim(), details: details.trim(), status }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (editing ? t.updateFailed : t.failed));
      setIdeas(current => editing ? current.map(idea => idea.id === payload.idea.id ? payload.idea : idea) : [payload.idea, ...current]);
      resetForm(); setMessage(editing ? t.update : t.saved);
    } catch (submitError) { setError(submitError.message || (editing ? t.updateFailed : t.failed)); }
    finally { setSaving(false); }
  };

  const remove = async idea => {
    if (!window.confirm(t.removeConfirm)) return;
    const response = await fetch(`/api/research-workspace/ideas/${encodeURIComponent(idea.id)}`, { method: 'DELETE' });
    if (response.ok) setIdeas(current => current.filter(item => item.id !== idea.id));
    else setError(t.deleteFailed);
  };

  return <section className="research-ideas-panel">
    <header className="research-ideas-header"><div><span><Lightbulb size={15}/>{t.kicker}</span><h3>{t.title}</h3><p>{t.subtitle}</p></div>{canCreate && <button className="research-ideas-add" onClick={() => { resetForm(); setOpen(true); }}><Plus size={17}/>{t.add}</button>}</header>
    <div className="research-ideas-summary">{t.statusOptions.map(key => <div key={key}><strong>{counts[key] || 0}</strong><span>{t.statuses[key]}</span></div>)}</div>
    {message && <p className="research-ideas-message">{message}</p>}
    {error && <p className="research-ideas-error">{error}</p>}
    {loading ? <div className="research-ideas-empty"><Clock3 size={21}/><span>{lang === 'es' ? 'Cargando ideas compartidas…' : 'Loading shared ideas…'}</span></div> : ideas.length ? <div className="research-ideas-list">{ideas.map(idea => <article className={`research-idea-card status-${idea.status}`} key={idea.id}><div className="research-idea-card-top"><span className="research-idea-status">{t.statuses[idea.status] || idea.status}</span><time>{dateLabel(idea.updatedAt || idea.createdAt, lang)}</time></div><h4>{idea.title}</h4>{idea.details && <p>{idea.details}</p>}<footer><span><MessageSquareText size={14}/>{t.by} {idea.createdByName}</span><span><Clock3 size={14}/>{t.updated} {dateLabel(idea.updatedAt || idea.createdAt, lang)}</span>{canManage && <div><button onClick={() => startEdit(idea)} title={t.edit}><Pencil size={14}/></button><button onClick={() => remove(idea)} title={t.remove}><Trash2 size={14}/></button></div>}</footer></article>)}</div> : <div className="research-ideas-empty"><Lightbulb size={23}/><strong>{t.empty}</strong>{canCreate && <button onClick={() => { resetForm(); setOpen(true); }}><Plus size={16}/>{t.add}</button>}</div>}
    {open && <div className="research-ideas-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && resetForm()}><form className="research-ideas-modal" onSubmit={submit}><header><div><span><Lightbulb size={14}/>{t.kicker}</span><h3>{editing ? t.edit : t.add}</h3></div><button type="button" onClick={resetForm} aria-label={t.close}><X size={18}/></button></header><label>{t.ideaTitle}<input value={title} onChange={event => setTitle(event.target.value)} required maxLength="220" autoFocus/></label><label>{t.details}<textarea value={details} onChange={event => setDetails(event.target.value)} rows="5" maxLength="5000" placeholder={lang === 'es' ? 'Describe el contexto, la oportunidad o el próximo paso…' : 'Describe the context, opportunity or next step…'}/></label><label>{t.status}<select value={status} onChange={event => setStatus(event.target.value)}>{t.statusOptions.map(key => <option key={key} value={key}>{t.statuses[key]}</option>)}</select></label><div className="research-ideas-modal-actions"><button type="button" onClick={resetForm}>{t.cancel}</button><button className="primary" type="submit" disabled={saving}>{saving ? t.saving : editing ? t.update : t.save}<Send size={16}/></button></div></form></div>}
  </section>;
}
