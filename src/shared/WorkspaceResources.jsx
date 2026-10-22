import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileImage, FileText, FolderOpen, Link2, Paperclip, Plus, Table2, Trash2, UploadCloud, X } from 'lucide-react';
import './workspace-resources.css';

const MAX_FILE_BYTES = 30 * 1024 * 1024;

const copy = {
  en: {
    title: 'Resources & attachments', subtitle: 'Keep documents, photos, files and useful links with this section.', add: 'Add resource', close: 'Close', type: 'Resource type', file: 'Document or file', photo: 'Photo or image', sheet: 'Google Sheet', drive: 'Google Drive', link: 'Web link', resourceTitle: 'Title', description: 'Description (optional)', chooseFile: 'Choose a file', noFile: 'No file selected', url: 'Paste link', save: 'Save resource', saving: 'Saving…', empty: 'No resources added yet.', by: 'Added by', remove: 'Remove', removeConfirm: 'Remove this resource?', unsupported: 'Use a valid file or link.', fileLimit: 'Files must be 30 MB or smaller.', saved: 'Resource saved.', failed: 'The resource could not be saved.', loadFailed: 'Resources could not be loaded.',
  },
  es: {
    title: 'Recursos y adjuntos', subtitle: 'Mantén documentos, fotos, archivos y enlaces útiles junto a esta sección.', add: 'Agregar recurso', close: 'Cerrar', type: 'Tipo de recurso', file: 'Documento o archivo', photo: 'Foto o imagen', sheet: 'Google Sheet', drive: 'Google Drive', link: 'Enlace web', resourceTitle: 'Título', description: 'Descripción (opcional)', chooseFile: 'Elegir archivo', noFile: 'No hay archivo seleccionado', url: 'Pegar enlace', save: 'Guardar recurso', saving: 'Guardando…', empty: 'Todavía no hay recursos.', by: 'Agregado por', remove: 'Eliminar', removeConfirm: '¿Eliminar este recurso?', unsupported: 'Usa un archivo o enlace válido.', fileLimit: 'Los archivos deben pesar 30 MB o menos.', saved: 'Recurso guardado.', failed: 'No se pudo guardar el recurso.', loadFailed: 'No se pudieron cargar los recursos.',
  },
};

const labels = {
  file: { icon: FileText, tone: 'blue' },
  photo: { icon: FileImage, tone: 'rose' },
  'google-sheet': { icon: Table2, tone: 'green' },
  'google-drive': { icon: FolderOpen, tone: 'amber' },
  link: { icon: Link2, tone: 'violet' },
};

function formatSize(size) {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value, lang) {
  try { return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(value)); }
  catch { return value || ''; }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',').pop() || '');
    reader.onerror = () => reject(new Error('file_read_failed'));
    reader.readAsDataURL(file);
  });
}

export default function WorkspaceResources({ scopeKey, lang = 'en', sectionLabel = '' }) {
  const t = copy[lang] || copy.en;
  const [resources, setResources] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadResources = async () => {
    try {
      const response = await fetch(`/api/workspace-resources?scope=${encodeURIComponent(scopeKey)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.loadFailed);
      setResources(payload.resources || []);
      setCanManage(Boolean(payload.canManage));
      setError('');
    } catch (loadError) { setError(loadError.message || t.loadFailed); }
  };

  useEffect(() => { if (scopeKey) loadResources(); }, [scopeKey]);

  const isLink = useMemo(() => ['google-sheet', 'google-drive', 'link'].includes(kind), [kind]);
  const resourceLabel = item => t[item.kind === 'google-sheet' ? 'sheet' : item.kind === 'google-drive' ? 'drive' : item.kind === 'photo' ? 'photo' : item.kind === 'link' ? 'link' : 'file'];

  const resetForm = () => { setOpen(false); setKind('file'); setTitle(''); setDescription(''); setUrl(''); setFile(null); setMessage(''); setError(''); };

  const submit = async event => {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      let base64 = '';
      if (isLink) {
        if (!url.trim()) throw new Error(t.unsupported);
      } else {
        if (!file) throw new Error(t.unsupported);
        if (file.size > MAX_FILE_BYTES) throw new Error(t.fileLimit);
        base64 = await readFile(file);
      }
      const response = await fetch('/api/workspace-resources', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scopeKey, kind, title: title.trim() || file?.name || resourceLabel({ kind }), description: description.trim(), url: isLink ? url.trim() : '', filename: file?.name || '', type: file?.type || '', base64 }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.failed);
      setResources(current => [payload.resource, ...current]);
      resetForm();
      setMessage(t.saved);
    } catch (submitError) { setError(submitError.message || t.failed); }
    finally { setSaving(false); }
  };

  const remove = async resource => {
    if (!window.confirm(t.removeConfirm)) return;
    const response = await fetch(`/api/workspace-resources/${encodeURIComponent(resource.id)}`, { method: 'DELETE' });
    if (response.ok) setResources(current => current.filter(item => item.id !== resource.id));
    else setError(t.failed);
  };

  return <section className="workspace-resources">
    <div className="workspace-resources-header">
      <div><span className="workspace-resources-kicker"><Paperclip size={14}/> {sectionLabel || (lang === 'es' ? 'SECCIÓN ACTUAL' : 'CURRENT SECTION')}</span><h2>{t.title}</h2><p>{t.subtitle}</p></div>
      <button className="workspace-resource-add" onClick={() => { setOpen(true); setMessage(''); setError(''); }}><Plus size={17}/>{t.add}</button>
    </div>
    {message && <p className="workspace-resource-message">{message}</p>}
    {error && <p className="workspace-resource-error">{error}</p>}
    {!resources.length && <div className="workspace-resources-empty"><Paperclip size={23}/><span>{t.empty}</span></div>}
    {!!resources.length && <div className="workspace-resource-grid">{resources.map(resource => {
      const meta = labels[resource.kind] || labels.link; const Icon = meta.icon; const image = resource.kind === 'photo' || resource.type?.startsWith('image/');
      return <article className="workspace-resource-card" key={resource.id}>
        <div className={`workspace-resource-icon ${meta.tone}`}><Icon size={20}/></div>
        <div className="workspace-resource-card-body"><div className="workspace-resource-card-top"><span>{resourceLabel(resource)}</span><time>{formatDate(resource.createdAt, lang)}</time></div><h3>{resource.title}</h3>{resource.description && <p>{resource.description}</p>}<small>{t.by} {resource.createdByName}{resource.size ? ` · ${formatSize(resource.size)}` : ''}</small><div className="workspace-resource-actions">{image && resource.fileUrl && <img className="workspace-resource-thumb" src={resource.fileUrl} alt={resource.title}/>}<a href={resource.fileUrl || resource.url} target="_blank" rel="noreferrer">{resource.kind === 'file' || resource.kind === 'photo' ? <FileText size={14}/> : <ExternalLink size={14}/>}<span>{resource.filename || resource.url}</span></a>{canManage && <button className="workspace-resource-delete" onClick={() => remove(resource)} title={t.remove}><Trash2 size={14}/></button>}</div></div>
      </article>;
    })}</div>}
    {open && <div className="workspace-resource-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) resetForm(); }}><form className="workspace-resource-modal" onSubmit={submit}><div className="workspace-resource-modal-header"><div><span className="workspace-resources-kicker"><UploadCloud size={14}/> {t.add}</span><h3>{t.title}</h3></div><button type="button" className="workspace-resource-close" onClick={resetForm} aria-label={t.close}><X size={18}/></button></div><label>{t.type}<select value={kind} onChange={event => { setKind(event.target.value); setFile(null); setUrl(''); }}><option value="file">{t.file}</option><option value="photo">{t.photo}</option><option value="google-sheet">{t.sheet}</option><option value="google-drive">{t.drive}</option><option value="link">{t.link}</option></select></label><label>{t.resourceTitle}<input value={title} onChange={event => setTitle(event.target.value)} placeholder={isLink ? t.resourceTitle : t.chooseFile}/></label>{isLink ? <label>{t.url}<input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://docs.google.com/spreadsheets/..." type="url" required/></label> : <label className="workspace-resource-file-field">{t.chooseFile}<input type="file" accept={kind === 'photo' ? 'image/*' : '*/*'} onChange={event => { const selected = event.target.files?.[0] || null; setFile(selected); if (selected && !title) setTitle(selected.name); }}/><span>{file?.name || t.noFile}</span></label>}<label>{t.description}<textarea value={description} onChange={event => setDescription(event.target.value)} rows="3"/></label><button className="workspace-resource-submit" type="submit" disabled={saving}>{saving ? t.saving : t.save}<UploadCloud size={16}/></button></form></div>}
  </section>;
}
