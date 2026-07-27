import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Crown,
  FileText, Flag, Lightbulb, ListChecks, LockKeyhole, Plus, Route, Search,
  ShieldCheck, Target, X
} from 'lucide-react';
import './corporate-hub.css';

const STORAGE_KEY='operational-hub-corporate-workspace-v1';

const categoryConfig={
  idea:{icon:Lightbulb,en:'Ideas',es:'Ideas'},
  blueprint:{icon:FileText,en:'Blueprints',es:'Blueprints'},
  strategy:{icon:Target,en:'Strategies',es:'Estrategias'},
  action:{icon:ListChecks,en:'Actions',es:'Acciones'},
};

const emptyDraft=()=>({category:'idea',title:'',summary:'',objective:'',nextStep:'',owner:'',priority:'medium',status:'draft',targetDate:''});

const readWorkspace=()=>{
  try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}
};

export default function CorporateHub({lang='es',ownerName='Executive'}){
  const isEn=lang==='en';
  const [items,setItems]=useState(readWorkspace);
  const [activeCategory,setActiveCategory]=useState('all');
  const [query,setQuery]=useState('');
  const [modalOpen,setModalOpen]=useState(false);
  const [selected,setSelected]=useState(null);
  const [draft,setDraft]=useState(emptyDraft);

  const saveItems=next=>{setItems(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next))};
  const filtered=useMemo(()=>items.filter(item=>(activeCategory==='all'||item.category===activeCategory)&&`${item.title} ${item.summary} ${item.objective} ${item.nextStep} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())),[items,activeCategory,query]);
  const openCreate=category=>{setDraft({...emptyDraft(),category:category==='all'?'idea':category,owner:ownerName||''});setModalOpen(true)};
  const closeCreate=()=>{setModalOpen(false);setDraft(emptyDraft())};
  const createItem=event=>{event.preventDefault();const now=new Date().toISOString();const next=[{...draft,id:`corp-${Date.now()}`,createdAt:now,updatedAt:now},...items];saveItems(next);closeCreate()};
  const updateStatus=(id,status)=>{const next=items.map(item=>item.id===id?{...item,status,updatedAt:new Date().toISOString()}:item);saveItems(next);setSelected(current=>current?.id===id?{...current,status}:current)};
  const categoryName=category=>categoryConfig[category]?.[isEn?'en':'es']||category;
  const statusLabel=status=>({draft:isEn?'Draft':'Borrador',review:isEn?'Under review':'En revisión',approved:isEn?'Approved':'Aprobado',active:isEn?'In execution':'En ejecución',done:isEn?'Completed':'Completado'}[status]||status);
  const priorityLabel=priority=>({low:isEn?'Low':'Baja',medium:isEn?'Medium':'Media',high:isEn?'High':'Alta',critical:isEn?'Critical':'Crítica'}[priority]||priority);

  return <div className="page corporate-page">
    <header className="corporate-hero">
      <div className="corporate-hero-icon"><Crown/></div>
      <div><span>{isEn?'CORPORATE · EXECUTIVES ONLY':'CORPORATE · SOLO EJECUTIVOS'}</span><h1>{isEn?'Corporate Strategy Room':'Sala de Estrategia Corporate'}</h1><p>{isEn?'A private workspace to capture decisions, shape blueprints and move strategic actions into execution.':'Un espacio privado para registrar decisiones, desarrollar blueprints y llevar acciones estratégicas a ejecución.'}</p></div>
      <div className="corporate-security"><LockKeyhole/><span><strong>{isEn?'Restricted access':'Acceso restringido'}</strong><small>{isEn?'Visible only to verified executives':'Visible solo para ejecutivos verificados'}</small></span></div>
    </header>

    <section className="corporate-trust-banner"><ShieldCheck/><p><strong>{isEn?'Confidential executive workspace':'Espacio confidencial de ejecutivos'}</strong>{isEn?'Corporate content is separated from employee operations and never appears in shared search or navigation for non-executive accounts.':'El contenido Corporate está separado de la operación de empleados y nunca aparece en la búsqueda ni navegación de cuentas que no sean ejecutivas.'}</p></section>

    <div className="corporate-category-grid">
      {Object.entries(categoryConfig).map(([key,config])=>{const Icon=config.icon;const count=items.filter(item=>item.category===key).length;return <button key={key} className={activeCategory===key?'active':''} onClick={()=>setActiveCategory(key)}><span><Icon/></span><div><strong>{config[isEn?'en':'es']}</strong><small>{key==='idea'?(isEn?'Capture opportunities and hypotheses':'Captura oportunidades e hipótesis'):key==='blueprint'?(isEn?'Design operating models and plans':'Diseña modelos operativos y planes'):key==='strategy'?(isEn?'Define priorities and strategic direction':'Define prioridades y dirección estratégica'):(isEn?'Assign the next concrete moves':'Asigna los próximos movimientos concretos')}</small></div><b>{count}</b><ChevronRight/></button>})}
    </div>

    <section className="corporate-workspace card">
      <div className="corporate-workspace-head"><div><span>{isEn?'PRIVATE PORTFOLIO':'PORTAFOLIO PRIVADO'}</span><h2>{activeCategory==='all'?(isEn?'All corporate initiatives':'Todas las iniciativas corporativas'):categoryName(activeCategory)}</h2><p>{isEn?'Turn thinking into documented ownership, timing and execution.':'Convierte el pensamiento en responsabilidad, tiempos y ejecución documentada.'}</p></div><button className="primary" onClick={()=>openCreate(activeCategory)}><Plus/>{isEn?'New initiative':'Nueva iniciativa'}</button></div>
      <div className="corporate-toolbar"><div className="search-box"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={isEn?'Search private initiatives…':'Buscar iniciativas privadas…'}/></div><div className="corporate-filters"><button className={activeCategory==='all'?'active':''} onClick={()=>setActiveCategory('all')}>{isEn?'All':'Todas'}</button>{Object.entries(categoryConfig).map(([key,config])=><button key={key} className={activeCategory===key?'active':''} onClick={()=>setActiveCategory(key)}>{config[isEn?'en':'es']}</button>)}</div></div>
      {!filtered.length?<div className="corporate-empty"><Crown/><span>{isEn?'PRIVATE WORKSPACE READY':'ESPACIO PRIVADO PREPARADO'}</span><h3>{items.length?(isEn?'No initiatives match this view':'No hay iniciativas que coincidan'):(isEn?'Start with the first corporate initiative':'Comienza con la primera iniciativa Corporate')}</h3><p>{items.length?(isEn?'Change the category or search terms.':'Cambia la categoría o los términos de búsqueda.'):(isEn?'Add an idea, blueprint, strategy or action. Nothing fictitious has been preloaded.':'Añade una idea, blueprint, estrategia o acción. No se ha precargado contenido ficticio.')}</p>{!items.length&&<button className="primary" onClick={()=>openCreate('idea')}><Plus/>{isEn?'Create first initiative':'Crear primera iniciativa'}</button>}</div>:<div className="corporate-card-grid">{filtered.map(item=>{const config=categoryConfig[item.category];const Icon=config.icon;return <button key={item.id} onClick={()=>setSelected(item)} className={`corporate-initiative priority-${item.priority}`}><header><span className="corporate-type"><Icon/>{config[isEn?'en':'es']}</span><span className={`corporate-status ${item.status}`}>{statusLabel(item.status)}</span></header><h3>{item.title}</h3><p>{item.summary}</p><div className="corporate-initiative-meta"><span><Flag/>{priorityLabel(item.priority)}</span>{item.targetDate&&<span><CalendarDays/>{item.targetDate}</span>}</div><footer><span>{item.owner||ownerName}</span><ArrowRight/></footer></button>})}</div>}
    </section>

    {modalOpen&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&closeCreate()}><form className="quick-modal corporate-modal" onSubmit={createItem}><div className="modal-heading"><div><span>{isEn?'CORPORATE · PRIVATE RECORD':'CORPORATE · REGISTRO PRIVADO'}</span><h2>{isEn?'Create strategic initiative':'Crear iniciativa estratégica'}</h2><p>{isEn?'Document enough context for an executive to understand the decision and next move.':'Documenta suficiente contexto para que un ejecutivo entienda la decisión y el próximo movimiento.'}</p></div><button type="button" onClick={closeCreate} aria-label={isEn?'Close':'Cerrar'}><X/></button></div><div className="corporate-form-grid"><label>{isEn?'Category':'Categoría'}<select value={draft.category} onChange={event=>setDraft({...draft,category:event.target.value})}>{Object.entries(categoryConfig).map(([key,config])=><option key={key} value={key}>{config[isEn?'en':'es']}</option>)}</select></label><label>{isEn?'Owner':'Responsable'}<input required value={draft.owner} onChange={event=>setDraft({...draft,owner:event.target.value})}/></label><label className="span-two">{isEn?'Title':'Título'}<input required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})} placeholder={isEn?'Clear initiative title':'Título claro de la iniciativa'}/></label><label className="span-two">{isEn?'Executive summary':'Resumen ejecutivo'}<textarea required value={draft.summary} onChange={event=>setDraft({...draft,summary:event.target.value})} placeholder={isEn?'What is the opportunity, problem or proposed direction?':'¿Cuál es la oportunidad, el problema o la dirección propuesta?'}/></label><label className="span-two">{isEn?'Strategic objective':'Objetivo estratégico'}<textarea value={draft.objective} onChange={event=>setDraft({...draft,objective:event.target.value})} placeholder={isEn?'What outcome should this create?':'¿Qué resultado debe producir?'}/></label><label className="span-two">{isEn?'Next concrete action':'Próxima acción concreta'}<textarea value={draft.nextStep} onChange={event=>setDraft({...draft,nextStep:event.target.value})} placeholder={isEn?'What happens next, and who moves it?':'¿Qué ocurre después y quién lo mueve?'}/></label><label>{isEn?'Priority':'Prioridad'}<select value={draft.priority} onChange={event=>setDraft({...draft,priority:event.target.value})}><option value="low">{isEn?'Low':'Baja'}</option><option value="medium">{isEn?'Medium':'Media'}</option><option value="high">{isEn?'High':'Alta'}</option><option value="critical">{isEn?'Critical':'Crítica'}</option></select></label><label>{isEn?'Status':'Estado'}<select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="draft">{isEn?'Draft':'Borrador'}</option><option value="review">{isEn?'Under review':'En revisión'}</option><option value="approved">{isEn?'Approved':'Aprobado'}</option><option value="active">{isEn?'In execution':'En ejecución'}</option></select></label><label>{isEn?'Target date':'Fecha objetivo'}<input type="date" value={draft.targetDate} onChange={event=>setDraft({...draft,targetDate:event.target.value})}/></label></div><div className="modal-actions"><button type="button" onClick={closeCreate}>{isEn?'Cancel':'Cancelar'}</button><button className="primary" type="submit"><ShieldCheck/>{isEn?'Save privately':'Guardar en privado'}</button></div></form></div>}

    {selected&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setSelected(null)}><section className="quick-modal corporate-detail-modal"><div className="modal-heading"><div><span>{categoryName(selected.category)} · {priorityLabel(selected.priority)}</span><h2>{selected.title}</h2></div><button onClick={()=>setSelected(null)} aria-label={isEn?'Close':'Cerrar'}><X/></button></div><p className="corporate-detail-summary">{selected.summary}</p>{selected.objective&&<section><span><Target/>{isEn?'STRATEGIC OBJECTIVE':'OBJETIVO ESTRATÉGICO'}</span><p>{selected.objective}</p></section>}{selected.nextStep&&<section><span><Route/>{isEn?'NEXT ACTION':'PRÓXIMA ACCIÓN'}</span><p>{selected.nextStep}</p></section>}<div className="corporate-detail-meta"><div><small>{isEn?'OWNER':'RESPONSABLE'}</small><strong>{selected.owner}</strong></div><div><small>{isEn?'TARGET DATE':'FECHA OBJETIVO'}</small><strong>{selected.targetDate||'—'}</strong></div></div><div className="corporate-decision-bar"><label>{isEn?'Execution status':'Estado de ejecución'}<select value={selected.status} onChange={event=>updateStatus(selected.id,event.target.value)}><option value="draft">{isEn?'Draft':'Borrador'}</option><option value="review">{isEn?'Under review':'En revisión'}</option><option value="approved">{isEn?'Approved':'Aprobado'}</option><option value="active">{isEn?'In execution':'En ejecución'}</option><option value="done">{isEn?'Completed':'Completado'}</option></select></label>{selected.status==='done'?<span><CheckCircle2/>{isEn?'Execution completed':'Ejecución completada'}</span>:<span><AlertTriangle/>{isEn?'Executive decision remains active':'La decisión ejecutiva sigue activa'}</span>}</div></section></div>}
  </div>;
}
