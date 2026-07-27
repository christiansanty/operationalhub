import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Gauge, Laptop, Route, ShieldCheck, UserRoundCheck } from 'lucide-react';
import InventoryRequestTool from './InventoryRequestTool.jsx';
import MedicalAssistantAllergyScope from './MedicalAssistantAllergyScope.jsx';
import './role-scope-lesson.css';

export default function RoleScopeLesson({scope,lang}) {
  if (!scope) return null;
  const isEn=lang==='en';
  return <section className="role-scope-lesson">
    <header className="role-scope-hero">
      <div>
        <span><ClipboardCheck size={16}/>{isEn?'REQUIRED MATERIAL · BEFORE THE TEST':'MATERIA OBLIGATORIA · ANTES DEL TEST'}</span>
        <h2>{isEn?'Scope of Work':'Scope of Work'} · {scope.title[lang]}</h2>
        <p>{scope.purpose[lang]}</p>
      </div>
      <aside><small>{isEn?'REPORTS TO':'REPORTA A'}</small><strong>{scope.reportsTo[lang]}</strong><small>{scope.department[lang]}</small></aside>
    </header>

    <div className="scope-learning-guide"><UserRoundCheck size={22}/><div><strong>{isEn?'What you must learn before answering':'Lo que debes aprender antes de responder'}</strong><p>{isEn?'Study what the role owns, the order of work, where responsibility changes hands and what the role must never do. The assessment below is based on this material.':'Estudia qué responsabilidad pertenece al cargo, en qué orden se trabaja, dónde cambia el responsable y qué cosas nunca debe hacer esta posición. La evaluación de abajo está basada en esta materia.'}</p></div></div>

    <div className="scope-teaching-grid">
      <article className="scope-teaching-card responsibilities">
        <header><CheckCircle2 size={21}/><div><span>{isEn?'CORE RESPONSIBILITIES':'RESPONSABILIDADES CENTRALES'}</span><h3>{isEn?'What this position owns':'De qué responde esta posición'}</h3></div></header>
        <ol>{scope.responsibilities[lang].map((item,index)=><li key={item}><i>{index+1}</i><p>{item}</p></li>)}</ol>
      </article>
      <article className="scope-teaching-card boundaries">
        <header><ShieldCheck size={21}/><div><span>{isEn?'ROLE BOUNDARIES':'LÍMITES DEL CARGO'}</span><h3>{isEn?'What this position must not do':'Lo que esta posición no debe hacer'}</h3></div></header>
        <ul>{scope.boundaries[lang].map(item=><li key={item}><AlertTriangle size={17}/><p>{item}</p></li>)}</ul>
        <div className="scope-boundary-rule"><strong>{isEn?'Stop and escalate':'Detente y escala'}</strong><p>{isEn?'When an order, competency, identity, safety condition or responsible owner is unclear, do not improvise. Pause, document and involve the approved lead.':'Cuando una orden, competencia, identidad, condición de seguridad o responsable no esté claro, no improvises. Detén el proceso, documenta y escala al líder autorizado.'}</p></div>
      </article>
    </div>

    <section className="scope-workflow-teaching">
      <header><Route size={22}/><div><span>{isEn?'THE WORK FROM A TO Z':'EL TRABAJO DE LA A A LA Z'}</span><h3>{isEn?'Daily workflow in the correct order':'Flujo diario en el orden correcto'}</h3></div></header>
      <div>{scope.workflow.map((item,index)=><article key={item.title.en}><i>{String(index+1).padStart(2,'0')}</i><div><strong>{item.title[lang]}</strong><p>{item.detail[lang]}</p></div>{index<scope.workflow.length-1&&<ArrowRight size={18}/>}</article>)}</div>
    </section>

    <div className="scope-operating-grid">
      <article><header><Laptop size={20}/><div><span>{isEn?'APPROVED SYSTEMS':'SISTEMAS APROBADOS'}</span><h3>{isEn?'Where the work is documented':'Dónde se documenta el trabajo'}</h3></div></header><div className="scope-system-list">{scope.systems.map(system=><span key={system}>{system}</span>)}</div></article>
      <article><header><ArrowRight size={20}/><div><span>{isEn?'CLOSED-LOOP HANDOFFS':'TRANSICIONES DE CICLO CERRADO'}</span><h3>{isEn?'Who receives the next step':'Quién recibe el próximo paso'}</h3></div></header><ul>{scope.handoffs[lang].map(item=><li key={item}><CheckCircle2 size={15}/>{item}</li>)}</ul></article>
      <article><header><Gauge size={20}/><div><span>{isEn?'PERFORMANCE STANDARD':'ESTÁNDAR DE DESEMPEÑO'}</span><h3>{isEn?'How good execution is measured':'Cómo se mide una buena ejecución'}</h3></div></header><ul>{scope.kpis[lang].map(item=><li key={item}><CheckCircle2 size={15}/>{item}</li>)}</ul></article>
    </div>

    {scope.inventory&&<InventoryRequestTool scope={scope} lang={lang}/>}
    {scope.allergyOperations&&<MedicalAssistantAllergyScope protocol={scope.allergyOperations} lang={lang}/>}

    <footer className="scope-before-test"><ClipboardCheck size={22}/><div><strong>{isEn?'Now you are ready for the learning activity':'Ahora estás listo para la actividad de aprendizaje'}</strong><p>{isEn?'First review the concepts, then choose and validate your answer. If you miss it, return to this scope and identify the responsibility, boundary or handoff that applies.':'Primero repasa los conceptos; después selecciona y valida tu respuesta. Si fallas, regresa a este scope e identifica la responsabilidad, el límite o la transición que corresponde.'}</p></div></footer>
  </section>;
}
