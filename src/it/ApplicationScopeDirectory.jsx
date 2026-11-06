import React, { useState } from 'react';
import {
  Boxes, Bot, CalendarDays, CheckCircle2, ChevronDown, Globe2, Pencil, RefreshCw, UserRound, Wrench,
} from 'lucide-react';

const text = (value, lang) => value?.[lang] || value?.en || value?.es || String(value || '');

function formatDate(value, isEn) {
  if (!value) return isEn ? 'Not set' : 'Sin fecha';
  return new Date(value).toLocaleDateString(isEn ? 'en-US' : 'es-US');
}

function statusLabel(value, isEn) {
  const labels = {
    NOT_STARTED: isEn ? 'Not started' : 'Sin comenzar',
    PLANNED: isEn ? 'Planned' : 'Planificado',
    IN_PROGRESS: isEn ? 'In progress' : 'En progreso',
    BLOCKED: isEn ? 'Blocked' : 'Bloqueado',
    COMPLETED: isEn ? 'Completed' : 'Completado',
  };
  return labels[value] || String(value || '').replaceAll('_', ' ');
}

function priorityLabel(value, isEn) {
  const labels = { LOW: isEn ? 'Low' : 'Baja', MEDIUM: isEn ? 'Medium' : 'Media', HIGH: isEn ? 'High' : 'Alta', CRITICAL: isEn ? 'Critical' : 'Crítica' };
  return labels[value] || value;
}

function proposalStatusLabel(value, isEn) {
  const labels = {
    SUBMITTED: isEn ? 'Submitted' : 'Enviada', IN_REVIEW: isEn ? 'In review' : 'En revisión', ACCEPTED: isEn ? 'Accepted' : 'Aceptada',
    PLANNED: isEn ? 'Planned' : 'Planificada', IN_PROGRESS: isEn ? 'In progress' : 'En progreso', DECLINED: isEn ? 'Declined' : 'Declinada', COMPLETED: isEn ? 'Completed' : 'Completada',
  };
  return labels[value] || String(value || '').replaceAll('_', ' ');
}

const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const ideaPriority = idea => idea.priority || idea.suggestedPriority || 'MEDIUM';

export default function ApplicationScopeDirectory({
  scopes = [], roadmap = [], proposals = [], lang = 'en', loading = false, canManage = false, onRefresh, onOpenRoadmap, onOpenProposal, onCompleteProposal,
}) {
  const isEn = lang === 'en';
  const [openApplicationId, setOpenApplicationId] = useState(null);
  const [openModuleKey, setOpenModuleKey] = useState(null);
  const roadmapByApplication = new Map(roadmap.map(item => [item.applicationId, item]));

  return <section className="it-card it-scope-card">
    <header className="it-section-heading">
      <div>
        <span>{isEn ? 'IT APPLICATIONS' : 'APLICACIONES DE IT'}</span>
        <h2>{isEn ? 'Applications and current work' : 'Aplicaciones y trabajo actual'}</h2>
        <p>{isEn ? 'Open an application to see what it does, its modules and the IT work connected to it.' : 'Abre una aplicación para ver qué hace, sus módulos y el trabajo de IT conectado.'}</p>
      </div>
      <div className="it-scope-heading-actions"><span className="it-permission-badge"><Globe2 size={14}/>{isEn ? 'Visible to IT users' : 'Visible para usuarios de IT'}</span><button className="icon-btn" onClick={onRefresh} title={isEn ? 'Refresh applications' : 'Actualizar aplicaciones'} disabled={loading}><RefreshCw size={16}/></button></div>
    </header>
    {loading ? <div className="it-empty"><RefreshCw/><p>{isEn ? 'Loading applications…' : 'Cargando aplicaciones…'}</p></div> : <div className="it-scope-directory">{scopes.map(scope => {
      const implementation = roadmapByApplication.get(scope.applicationId);
      const relatedIdeas = proposals.filter(proposal => proposal.applicationId === scope.applicationId).sort((left, right) => {
        const priorityDifference = (priorityRank[ideaPriority(left)] ?? 4) - (priorityRank[ideaPriority(right)] ?? 4);
        if (priorityDifference) return priorityDifference;
        return new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime();
      });
      const highPriorityIdeas = relatedIdeas.filter(idea => ['CRITICAL', 'HIGH'].includes(ideaPriority(idea))).length;
      const open = openApplicationId === scope.applicationId;
      return <article className={`it-scope-application ${open ? 'open' : ''}`} key={scope.applicationId}>
        <button className="it-scope-application-toggle" onClick={() => setOpenApplicationId(open ? null : scope.applicationId)} aria-expanded={open}>
          <span className="it-scope-app-icon"><Boxes size={19}/></span>
          <span className="it-scope-app-title"><strong>{scope.applicationName}</strong><small>{text(scope.purpose, lang)}</small></span>
          <span className="it-scope-app-status"><b>{implementation ? `${implementation.progress}% · ${statusLabel(implementation.status, isEn)}` : (isEn ? 'No IT work recorded' : 'Sin trabajo de IT')}</b><small>{scope.modules.length} {isEn ? (scope.modules.length === 1 ? 'module' : 'modules') : (scope.modules.length === 1 ? 'módulo' : 'módulos')} · {relatedIdeas.length} {isEn ? (relatedIdeas.length === 1 ? 'idea' : 'ideas') : (relatedIdeas.length === 1 ? 'idea' : 'ideas')}</small></span>
          <ChevronDown className="it-scope-chevron" size={18}/>
        </button>
        {open && <div className="it-scope-application-detail">
          <div className="it-scope-facts"><span><b>{isEn ? 'Version' : 'Versión'}</b>{scope.version}</span><span><b>{isEn ? 'Last sync' : 'Última sincronización'}</b>{formatDate(scope.lastSyncedAt, isEn)}</span><span><b>{isEn ? 'Repository' : 'Repositorio'}</b>{scope.repository || (isEn ? 'Not connected' : 'Sin conexión')}</span><span><b>{isEn ? 'Scope source' : 'Fuente del scope'}</b>{scope.source === 'catalog' ? (isEn ? 'Repository catalog' : 'Catálogo del repositorio') : scope.source}</span></div>
          <div className="it-scope-purpose"><div><b>{isEn ? 'What it does' : 'Qué hace'}</b><p>{text(scope.purpose, lang)}</p></div></div>
          <div className="it-scope-work-section">
            <div className="it-scope-subheading"><Wrench size={16}/><strong>{isEn ? 'IT work' : 'Trabajo de IT'}</strong></div>
            {implementation ? <button className="it-scope-work-item" onClick={() => onOpenRoadmap?.(implementation)}>
              <div><strong>{implementation.phase}</strong><small>{isEn ? 'Open task details' : 'Abrir detalle de la tarea'}</small></div>
              <div className="it-scope-work-status"><span className={`it-pill ${implementation.priority.toLowerCase()}`}>{priorityLabel(implementation.priority, isEn)}</span><span className={`it-pill ${implementation.status.toLowerCase()}`}>{statusLabel(implementation.status, isEn)}</span><b>{implementation.progress}%</b></div><Pencil size={15}/>
            </button> : <p className="it-scope-empty-line">{isEn ? 'No IT task has been recorded for this application yet.' : 'Todavía no hay una tarea de IT registrada para esta aplicación.'}</p>}
            {implementation && <div className="it-scope-work-meta"><span><CalendarDays size={13}/>{isEn ? 'Created' : 'Creada'} {formatDate(implementation.createdAt, isEn)} · {implementation.createdBy}</span><span><UserRound size={13}/>{isEn ? 'Working on it' : 'Trabaja en ella'} {implementation.owner || (isEn ? 'Not assigned' : 'Sin asignar')}</span><span><CalendarDays size={13}/>{isEn ? 'Target' : 'Meta'} {formatDate(implementation.dueAt, isEn)}</span></div>}
          </div>
          <div className="it-scope-modules"><div className="it-scope-subheading"><Wrench size={16}/><strong>{isEn ? 'Modules and tools' : 'Módulos y herramientas'}</strong></div>{scope.modules.map(module => {
            const moduleKey = `${scope.applicationId}:${module.id}`;
            const moduleOpen = openModuleKey === moduleKey;
            return <div className={`it-scope-module ${moduleOpen ? 'open' : ''}`} key={module.id}>
              <button className="it-scope-module-toggle" onClick={() => setOpenModuleKey(moduleOpen ? null : moduleKey)} aria-expanded={moduleOpen}><span><strong>{text(module.name, lang)}</strong><small>{module.tools.length} {isEn ? (module.tools.length === 1 ? 'tool' : 'tools') : (module.tools.length === 1 ? 'herramienta' : 'herramientas')}</small></span><ChevronDown size={16}/></button>
              {moduleOpen && <div className="it-scope-module-detail"><p>{text(module.summary, lang)}</p><div className="it-scope-tool-list">{module.tools.map(tool => <span key={tool}><Wrench size={12}/>{tool}</span>)}</div><div className="it-scope-ai-role"><Bot size={15}/><div><b>{isEn ? 'AI-agent function' : 'Función del agente de IA'}</b><p>{text(module.aiRole, lang)}</p></div></div></div>}
            </div>;
          })}</div>
          {!!scope.aiAgents?.length && <div className="it-scope-agents"><div className="it-scope-subheading"><Bot size={16}/><strong>{isEn ? 'AI agents' : 'Agentes de IA'}</strong></div>{scope.aiAgents.map(agent => <div className="it-scope-agent" key={agent.id || text(agent.name, lang)}><strong>{text(agent.name, lang)}</strong><p>{text(agent.function, lang)}</p></div>)}</div>}
          <div className="it-scope-proposals"><div className="it-scope-subheading"><Wrench size={16}/><strong>{isEn ? 'Ideas for this application' : 'Ideas para esta aplicación'}</strong><span className="it-scope-idea-count">{relatedIdeas.length}{highPriorityIdeas ? ` · ${highPriorityIdeas} ${isEn ? 'high priority' : 'de alta prioridad'}` : ''}</span></div>{relatedIdeas.map(idea => <article className={`it-scope-proposal ${idea.status === 'COMPLETED' ? 'completed' : ''}`} key={idea.id}>
            <button className="it-scope-proposal-main" onClick={() => onOpenProposal?.(idea)}>
              <div className="it-scope-proposal-heading"><strong>{idea.title}</strong><span className={`it-pill ${ideaPriority(idea).toLowerCase()}`}>{priorityLabel(ideaPriority(idea), isEn)}</span><span className={`it-pill ${String(idea.status || '').toLowerCase()}`}>{proposalStatusLabel(idea.status, isEn)}</span></div>
              <p>{idea.description}</p>
              <div className="it-scope-proposal-meta"><span><CalendarDays size={12}/><b>{isEn ? 'Entered' : 'Ingresó'}</b>{formatDate(idea.createdAt, isEn)}</span><span><CalendarDays size={12}/><b>{isEn ? 'Deadline' : 'Deadline'}</b>{formatDate(idea.dueAt, isEn)}</span><span><UserRound size={12}/><b>{isEn ? 'Inserted by' : 'Insertada por'}</b>{idea.submitter?.name || (isEn ? 'Unknown author' : 'Autor desconocido')}</span><span><b>{isEn ? 'Process' : 'Proceso'}</b>{proposalStatusLabel(idea.status, isEn)}</span></div>
            </button>
            {canManage && idea.status !== 'COMPLETED' && <button className="it-scope-complete" onClick={() => onCompleteProposal?.(idea)}><CheckCircle2 size={15}/>{isEn ? 'Mark completed' : 'Marcar completada'}</button>}
            {idea.status === 'COMPLETED' && <span className="it-scope-completed"><CheckCircle2 size={14}/>{isEn ? 'Completed' : 'Completada'}{idea.completedAt ? ` · ${formatDate(idea.completedAt, isEn)}` : ''}</span>}
          </article>)}{!relatedIdeas.length && <p className="it-scope-empty-line">{isEn ? 'No ideas submitted for this application.' : 'No hay ideas enviadas para esta aplicación.'}</p>}</div>
        </div>}
      </article>;
    })}{!scopes.length && <div className="it-empty"><Boxes/><p>{isEn ? 'No applications are available yet.' : 'Todavía no hay aplicaciones disponibles.'}</p></div>}</div>}
  </section>;
}
