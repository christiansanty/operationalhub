import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Clock3, Database,
  ExternalLink, FileText, HeartPulse, Languages, Layers3, Paperclip, RefreshCw, Search, ShieldCheck,
} from 'lucide-react';
import { airtableCourses, airtableSync } from '../data/airtableTraining.js';
import '../academy-airtable.css';

const number = new Intl.NumberFormat('en-US');

export function useAcademyBackendData() {
  const [data, setData] = useState({ sync: airtableSync, courses: airtableCourses, source: 'snapshot', loading: true });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/academy/catalog', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Backend unavailable')))
      .then((payload) => setData({ sync: payload.sync, courses: payload.courses, source: 'backend', loading: false }))
      .catch((error) => { if (error.name !== 'AbortError') setData((current) => ({ ...current, loading: false })); });
    return () => controller.abort();
  }, []);
  return data;
}

function formatDate(value, lang) {
  if (!value) return lang === 'en' ? 'Not available' : 'No disponible';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));
}

export function AirtableSyncPanel({ lang, sync = airtableSync, source = 'snapshot' }) {
  const isEn = lang === 'en';
  return <section className="airtable-sync-panel">
    <div className="airtable-sync-icon"><Database size={25}/></div>
    <div className="airtable-sync-copy">
      <span><i/>{source === 'backend' ? (isEn ? 'BACKEND DATABASE · LIVE' : 'BASE DE DATOS BACKEND · ACTIVA') : (isEn ? 'AIRTABLE SNAPSHOT DATA' : 'SNAPSHOT DE AIRTABLE')}</span>
      <h2>TRAININGS - Learning Center</h2>
      <p>{isEn
        ? 'The Academy catalog below was generated from the latest protected Airtable export. Tokens, collaborators and temporary attachment URLs are excluded.'
        : 'El catálogo de Academy se generó desde la exportación protegida más reciente de Airtable. Se excluyen tokens, colaboradores y URLs temporales de adjuntos.'}</p>
      <small><RefreshCw size={13}/>{isEn ? 'Last export' : 'Última exportación'}: {formatDate(sync.exportedAt, lang)}</small>
    </div>
    <div className="airtable-sync-stats">
      <div><strong>{number.format(sync.tableCount)}</strong><span>{isEn ? 'tables' : 'tablas'}</span></div>
      <div><strong>{number.format(sync.recordCount)}</strong><span>{isEn ? 'records' : 'registros'}</span></div>
      <div><strong>{number.format(sync.attachmentCount)}</strong><span>{isEn ? 'attachments' : 'adjuntos'}</span></div>
      <div><strong>{number.format(sync.publishedCourseCount)}</strong><span>{isEn ? 'modules' : 'módulos'}</span></div>
    </div>
  </section>;
}

function AirtableCourseCard({ course, lang, onOpen }) {
  const isEn = lang === 'en';
  const preview = course.content.slice(0, 3);
  const openCourse = () => onOpen(course);
  return <article className={`airtable-course-card ${course.tone}`} role="button" tabIndex="0" onClick={openCourse} onKeyDown={(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCourse()}}}>
    <div className="airtable-course-heading">
      <span><Layers3 size={15}/>{isEn ? 'LIVE CATALOG MODULE' : 'MÓDULO DEL CATÁLOGO'}</span>
      <div className="airtable-course-icon"><BookOpen size={24}/></div>
      <h3>{course.title[lang]}</h3>
      <p>{course.description[lang]}</p>
    </div>
    <div className="airtable-course-meta">
      <span><FileText size={14}/>{course.modules} {isEn ? 'resources' : 'recursos'}</span>
      <span><Paperclip size={14}/>{course.assetCount} {isEn ? 'attachments' : 'adjuntos'}</span>
      <span><Clock3 size={14}/>{course.duration}</span>
    </div>
    <div className="airtable-course-preview">
      {preview.map((item) => <div key={item.id}><CheckCircle2 size={14}/><span>{item.title}</span></div>)}
      {course.content.length > preview.length && <small>+{course.content.length - preview.length} {isEn ? 'more resources' : 'recursos adicionales'}</small>}
    </div>
    <button onClick={(event) => {event.stopPropagation();openCourse()}}>{isEn ? 'Open module' : 'Abrir módulo'}<ArrowRight size={16}/></button>
  </article>;
}

export function AirtableCatalog({ lang, onOpen, courses = airtableCourses }) {
  const isEn = lang === 'en';
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) => [
      course.title.en, course.title.es, course.description.en, course.description.es,
      ...course.sourceTables, ...course.content.map((item) => item.title),
    ].join(' ').toLowerCase().includes(needle));
  }, [query, courses]);

  return <section className="airtable-catalog-section">
    <div className="airtable-catalog-title">
      <div><span>{isEn ? 'CONNECTED LEARNING CENTER' : 'LEARNING CENTER CONECTADO'}</span><h2>{isEn ? 'Airtable training modules' : 'Módulos de capacitación de Airtable'}</h2></div>
      <label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isEn ? 'Search 93 records…' : 'Buscar en 93 registros…'}/></label>
    </div>
    {filtered.length
      ? <div className="airtable-course-grid">{filtered.map((course) => <AirtableCourseCard key={course.id} course={course} lang={lang} onOpen={onOpen}/>)}</div>
      : <div className="airtable-empty">{isEn ? 'No connected training resources match this search.' : 'No hay recursos conectados que coincidan con la búsqueda.'}</div>}
  </section>;
}

export function AirtableCourseDetail({ course, lang, onBack, onHub, setLang, academyOnly=false, learner=null }) {
  const isEn = lang === 'en';
  const learnerKey=String(learner?.learnerId||learner?.id||'anonymous').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80);
  const storageKey = `ema-airtable-reviewed-${learnerKey}-${course.id}`;
  const [reviewed, setReviewed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { return new Set(); }
  });
  const toggleReviewed = (itemId) => {
    setReviewed((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };
  const completion = course.content.length ? Math.round((reviewed.size / course.content.length) * 100) : 0;
  return <div className="airtable-detail-page">
    <header className="airtable-detail-top">
      <button onClick={onBack}><ArrowLeft size={18}/>{isEn ? 'Back to catalog' : 'Volver al catálogo'}</button>
      <div className="airtable-detail-actions"><span><Database size={15}/>TRAININGS - Learning Center</span><label><Languages size={16}/><select aria-label={isEn ? 'Select language' : 'Seleccionar idioma'} value={lang} onChange={event=>setLang(event.target.value)}><option value="en">English</option><option value="es">Español</option></select><ChevronDown size={14}/></label></div>
    </header>
    <div className="airtable-detail-layout"><aside className="airtable-detail-nav"><button className="airtable-hub-return" onClick={onHub}><span><HeartPulse size={21}/></span><div><strong>{academyOnly?'Eastern Medical Academy':'Operational Hub'}</strong><small><ArrowLeft size={12}/>{academyOnly?(isEn?'Academy home':'Inicio de Academy'):(isEn ? 'Return to application' : 'Regresar a la aplicación')}</small></div></button><div className="airtable-nav-heading"><span>{isEn ? 'CURRENT MODULE' : 'MÓDULO ACTUAL'}</span><h2>{course.title[lang]}</h2><p>{reviewed.size}/{course.content.length} {isEn ? 'reviewed' : 'revisados'}</p></div><nav>{course.content.map((item,index)=><button key={item.id} onClick={()=>document.getElementById(`resource-${item.id}`)?.scrollIntoView({behavior:'smooth',block:'start'})} className={reviewed.has(item.id)?'reviewed':''}><i>{reviewed.has(item.id)?<Check size={12}/>:String(index+1).padStart(2,'0')}</i><span>{item.title}</span></button>)}</nav></aside><main>
      <section className={`airtable-detail-hero ${course.tone}`}>
        <span>{isEn ? 'AIRTABLE TRAINING MODULE' : 'MÓDULO DE AIRTABLE'}</span>
        <h1>{course.title[lang]}</h1>
        <p>{course.description[lang]}</p>
        <div><span><FileText size={15}/>{course.content.length} {isEn ? 'resources' : 'recursos'}</span><span><Paperclip size={15}/>{course.assetCount} {isEn ? 'attachments' : 'adjuntos'}</span><span><Layers3 size={15}/>{course.sourceTables.length} {isEn ? 'source tables' : 'tablas de origen'}</span></div>
      </section>
      <div className="airtable-source-note"><ShieldCheck size={19}/><p><strong>{isEn ? 'Protected sync' : 'Sincronización protegida'}</strong>{isEn ? 'Temporary Airtable attachment URLs and credentials are not included in the frontend.' : 'Las URLs temporales de adjuntos y las credenciales de Airtable no se incluyen en el frontend.'}</p></div>
      <section className="airtable-module-progress" aria-live="polite"><div><span>{isEn ? 'MODULE PROGRESS' : 'PROGRESO DEL MÓDULO'}</span><strong>{reviewed.size} / {course.content.length} {isEn ? 'resources reviewed' : 'recursos revisados'}</strong></div><div className="progress"><i style={{width:`${completion}%`}}/></div><b>{completion}%</b></section>
      <section className="airtable-resource-list">
        <div className="airtable-resource-header"><div><span>{isEn ? 'MODULE CONTENT' : 'CONTENIDO DEL MÓDULO'}</span><h2>{isEn ? 'Learning resources' : 'Recursos de aprendizaje'}</h2></div><small>{course.sourceTables.join(' · ')}</small></div>
        {course.content.map((item, index) => <article id={`resource-${item.id}`} key={item.id}>
          <i>{String(index + 1).padStart(2, '0')}</i>
          <div><span>{item.table}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{!!item.details?.length&&<dl className="airtable-resource-details">{item.details.map(detail=><div key={`${detail.label}-${detail.value}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>}
            {!!item.attachments.length && <div className="airtable-attachments">{item.attachments.map((attachment) => <a key={attachment.id} href={`/api/academy/attachments/${encodeURIComponent(attachment.id)}`} target="_blank" rel="noreferrer"><Paperclip size={13}/>{attachment.filename}<ExternalLink size={12}/></a>)}</div>}
          </div>
          <div className="airtable-resource-actions">{item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer">{isEn ? 'Open resource' : 'Abrir recurso'}<ExternalLink size={15}/></a>}<button className={reviewed.has(item.id) ? 'reviewed' : ''} onClick={() => toggleReviewed(item.id)}>{reviewed.has(item.id) ? <Check size={15}/> : <CheckCircle2 size={15}/>} {reviewed.has(item.id) ? (isEn ? 'Reviewed' : 'Revisado') : (isEn ? 'Mark reviewed' : 'Marcar revisado')}</button></div>
        </article>)}
      </section>
    </main></div>
  </div>;
}

export { airtableCourses, airtableSync };
