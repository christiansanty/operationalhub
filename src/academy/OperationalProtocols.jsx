import React, {useMemo, useState} from 'react';
import {AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, Database, FileText, GitBranch, HeartPulse, Search, ShieldCheck, Stethoscope, Users, Workflow} from 'lucide-react';
import {departmentCourseTracks, operationalScopes, protocolCategories, protocolEvidence} from '../data/operationalProtocols.js';
import './operational-protocols.css';

const statusLabels={
  confirmed:{en:'Internal source confirmed',es:'Fuente interna confirmada'},
  'owner-defined':{en:'Owner-defined standard',es:'Estándar definido por el propietario'},
  review:{en:'Digitized · approval pending',es:'Digitalizado · aprobación pendiente'},
  draft:{en:'Structured draft · validate',es:'Borrador estructurado · validar'},
};

function GraduationBadge(){return <div className="course-map-badge"><BookOpen size={24}/><strong>{departmentCourseTracks.length}</strong><span>paths</span></div>}

export function DepartmentCourseMap({lang,onOpenCourse}){
  const isEn=lang==='en'; const [selected,setSelected]=useState('general');
  const track=departmentCourseTracks.find(item=>item.id===selected)||departmentCourseTracks[0];
  return <section className="department-course-map"><header><div><span>{isEn?'ROLE-BASED ACADEMY':'ACADEMIA POR FUNCIONES'}</span><h2>{isEn?'One common foundation. Deep training for every department.':'Una base común. Capacitación profunda para cada departamento.'}</h2><p>{isEn?'Every active employee completes the common path, then the courses assigned to their department and role.':'Cada empleado activo completa la ruta común y después los cursos asignados a su departamento y función.'}</p></div><GraduationBadge/></header><div className="department-course-layout"><nav aria-label={isEn?'Department course paths':'Rutas de cursos por departamento'}>{departmentCourseTracks.map(item=><button key={item.id} className={selected===item.id?'active':''} onClick={()=>setSelected(item.id)}><span>{item.name[lang]}</span><small>{item.audience[lang]}</small></button>)}</nav><article><span>{isEn?'ASSIGNED PATH':'RUTA ASIGNADA'}</span><h3>{track.name[lang]}</h3><p>{track.summary[lang]}</p><div className="track-audience"><Users size={17}/><div><small>{isEn?'Required for':'Obligatorio para'}</small><strong>{track.audience[lang]}</strong></div></div><div className="track-course-list">{track.required.map((courseId,index)=><button key={courseId} onClick={()=>onOpenCourse?.(courseId)}><i>{String(index+1).padStart(2,'0')}</i><span>{courseId.replaceAll('-',' ')}</span><CheckCircle2 size={16}/></button>)}</div></article></div></section>;
}

function ScopeList({items,empty,icon:Icon=CheckCircle2}){
  return <div className="scope-list">{items?.map((item,index)=><article key={`${index}-${item}`}><Icon size={17}/><span>{item}</span></article>)}{!items?.length&&<p className="protocol-empty">{empty}</p>}</div>;
}

function StatusBadge({scope,lang}){return <span className={`scope-status ${scope.status}`}>{scope.status==='confirmed'||scope.status==='owner-defined'?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>}{statusLabels[scope.status]?.[lang]}</span>}

export default function OperationalProtocols({lang}){
  const isEn=lang==='en'; const [selectedId,setSelectedId]=useState('front-desk-check-in'); const [section,setSection]=useState('scope'); const [category,setCategory]=useState('all'); const [query,setQuery]=useState(''); const [evidenceOpen,setEvidenceOpen]=useState(false);
  const normalized=query.trim().toLowerCase();
  const filtered=useMemo(()=>operationalScopes.filter(scope=>{
    if(category!=='all'&&scope.category!==category)return false;
    const haystack=[scope.title.en,scope.title.es,scope.department.en,scope.department.es,scope.purpose.en,scope.purpose.es,...scope.responsibilities.en,...scope.responsibilities.es,...scope.systems].join(' ').toLowerCase();
    return !normalized||haystack.includes(normalized);
  }),[category,normalized]);
  const selected=operationalScopes.find(scope=>scope.id===selectedId)||filtered[0]||operationalScopes[0];
  const selectScope=id=>{setSelectedId(id);setSection('scope')};
  const confirmed=operationalScopes.filter(scope=>scope.status==='confirmed'||scope.status==='owner-defined').length;
  const tabs=[['scope',isEn?'Scope':'Scope'],['workflow',isEn?'Daily workflow':'Flujo diario'],['systems',isEn?'Systems':'Sistemas'],['handoffs',isEn?'Handoffs':'Transiciones'],['boundaries',isEn?'Boundaries':'Límites'],['metrics',isEn?'Metrics':'Métricas'],['sources',isEn?'Sources':'Fuentes']];
  return <div className="page operational-protocols-page">
    <header className="protocols-hero"><div><span>{isEn?'OPERATIONAL PROTOCOLS':'PROTOCOLOS OPERACIONALES'}</span><h1>{isEn?'Every area. Clear ownership. One operating standard.':'Todas las áreas. Responsabilidad clara. Un solo estándar operacional.'}</h1><p>{isEn?'A role-by-role library for daily work, systems, handoffs, controls and escalation across Eastern Medical.':'Biblioteca por cargo para trabajo diario, sistemas, transiciones, controles y escalamiento en Eastern Medical.'}</p></div><div><Workflow size={30}/><strong>{operationalScopes.length}</strong><span>{isEn?'role scopes structured':'scopes estructurados'}</span></div></header>
    <div className="protocol-metrics"><article><Users/><strong>{operationalScopes.length}</strong><span>{isEn?'roles and work areas':'cargos y áreas'}</span></article><article><ShieldCheck/><strong>{confirmed}</strong><span>{isEn?'confirmed or owner-defined':'confirmados o definidos'}</span></article><article><Database/><strong>{protocolEvidence.length}</strong><span>{isEn?'evidence groups':'grupos de evidencia'}</span></article><article><GitBranch/><strong>{operationalScopes.reduce((sum,item)=>sum+item.handoffs[lang].length,0)}</strong><span>{isEn?'documented handoffs':'transiciones documentadas'}</span></article></div>
    <button className="protocol-source-notice" onClick={()=>setEvidenceOpen(!evidenceOpen)}><AlertTriangle size={20}/><p><strong>{isEn?'Controlled operational library':'Biblioteca operacional controlada'}</strong>{isEn?'Confirmed sources are separated from structured drafts. Clinical, compliance, billing and department owners must approve pending content before policy release.':'Las fuentes confirmadas están separadas de los borradores. Clínica, cumplimiento, facturación y responsables deben aprobar lo pendiente antes de publicarlo como política.'}</p><ChevronRight className={evidenceOpen?'open':''} size={20}/></button>
    {evidenceOpen&&<section className="protocol-evidence">{protocolEvidence.map(item=><article key={item.id}><Database size={17}/><div><strong>{item.label}</strong><p>{item.detail[lang]}</p></div></article>)}</section>}
    <div className="protocol-category-bar">{protocolCategories.map(item=><button key={item.id} className={category===item.id?'active':''} onClick={()=>setCategory(item.id)}>{item.label[lang]}</button>)}</div>
    <section className="protocol-library">
      <aside><div className="protocol-search"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={isEn?'Search roles, duties or systems…':'Buscar cargos, tareas o sistemas…'}/></div><span>{isEn?'WORK AREAS':'ÁREAS DE TRABAJO'} · {filtered.length}</span><div className="scope-nav">{filtered.map(scope=><button key={scope.id} className={selected.id===scope.id?'active':''} onClick={()=>selectScope(scope.id)}><span><strong>{scope.title[lang]}</strong><small>{scope.department[lang]}</small></span><ChevronRight size={16}/></button>)}</div>{!filtered.length&&<p className="protocol-empty">{isEn?'No scope matches the filters.':'Ningún scope coincide con los filtros.'}</p>}</aside>
      <main><header><div><span>{isEn?'CURRENT SCOPE':'SCOPE ACTUAL'}</span><h2>{selected.title[lang]}</h2><p>{selected.department[lang]} · {isEn?'Reports to':'Reporta a'}: {selected.reportsTo[lang]}</p><StatusBadge scope={selected} lang={lang}/></div><Stethoscope size={31}/></header>
        <div className="scope-purpose"><HeartPulse size={22}/><div><span>{isEn?'PURPOSE':'PROPÓSITO'}</span><p>{selected.purpose[lang]}</p></div></div>
        <nav className="protocol-tabs">{tabs.map(([id,label])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}>{label}</button>)}</nav>
        {section==='scope'&&<><div className="section-heading"><ClipboardCheck/><div><span>{isEn?'CORE ACCOUNTABILITIES':'RESPONSABILIDADES CENTRALES'}</span><h3>{isEn?'What this role owns':'De qué responde este cargo'}</h3></div></div><ScopeList items={selected.responsibilities[lang]} empty={isEn?'No responsibilities loaded.':'No hay responsabilidades.'}/></>}
        {section==='workflow'&&<div className="protocol-step-list">{selected.workflow.map((item,index)=><article key={`${selected.id}-${item.title.en}`}><i>{String(index+1).padStart(2,'0')}</i><div><h3>{item.title[lang]}</h3><p>{item.detail[lang]}</p></div></article>)}</div>}
        {section==='systems'&&<><div className="section-heading"><Database/><div><span>{isEn?'AUTHORIZED TOOLSET':'HERRAMIENTAS AUTORIZADAS'}</span><h3>{isEn?'Systems used by this role':'Sistemas de este cargo'}</h3></div></div><ScopeList items={selected.systems} icon={Database}/></>}
        {section==='handoffs'&&<><div className="section-heading"><GitBranch/><div><span>{isEn?'CLOSED-LOOP OWNERSHIP':'RESPONSABILIDAD DE CICLO CERRADO'}</span><h3>{isEn?'Where work goes next':'A dónde se transfiere el trabajo'}</h3></div></div><ScopeList items={selected.handoffs[lang]} icon={GitBranch}/></>}
        {section==='boundaries'&&<><div className="section-heading"><ShieldCheck/><div><span>{isEn?'DO NOT CROSS':'LÍMITES DEL CARGO'}</span><h3>{isEn?'Safety, privacy and authority boundaries':'Límites de seguridad, privacidad y autoridad'}</h3></div></div><div className="scope-boundary-list"><ScopeList items={selected.boundaries[lang]} icon={AlertTriangle}/></div></>}
        {section==='metrics'&&<><div className="section-heading"><BarChart3/><div><span>{isEn?'OPERATIONAL CONTROL':'CONTROL OPERACIONAL'}</span><h3>{isEn?'Measures for review—not clinical quotas':'Medidas de revisión, no cuotas clínicas'}</h3></div></div><ScopeList items={selected.kpis[lang]} icon={BarChart3}/></>}
        {section==='sources'&&<div className="protocol-documents">{selected.sources.map(source=><article key={source}><FileText size={20}/><div><strong>{source}</strong><span>{isEn?'Evidence used for this structured scope':'Evidencia usada para este scope estructurado'}</span></div><CheckCircle2 size={17}/></article>)}</div>}
      </main>
    </section>
  </div>;
}
