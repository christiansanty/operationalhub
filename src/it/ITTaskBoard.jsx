import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, ClipboardList, Plus, Search, UserRound } from 'lucide-react';

const statusLabel = (value, isEn) => ({
  NOT_STARTED: isEn ? 'Not started' : 'Sin comenzar',
  PLANNED: isEn ? 'Planned' : 'Planificada',
  IN_PROGRESS: isEn ? 'In progress' : 'En progreso',
  BLOCKED: isEn ? 'Blocked' : 'Bloqueada',
  COMPLETED: isEn ? 'Completed' : 'Completada',
}[value] || String(value || '').replaceAll('_', ' '));

const progressTone = task => {
  if (task.status === 'BLOCKED') return 'blocked';
  if (task.status === 'COMPLETED' || Number(task.progress) >= 60) return 'complete';
  if (task.status === 'NOT_STARTED' || Number(task.progress) === 0) return 'not-started';
  return 'in-progress';
};

export default function ITTaskBoard({ roadmap = [], lang = 'en', canManage = false, onOpenTask, onAddTask }) {
  const isEn = lang === 'en';
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...roadmap]
      .filter(task => statusFilter === 'ALL' || task.status === statusFilter)
      .filter(task => !normalizedQuery || `${task.applicationName} ${task.phase} ${task.description} ${task.owner}`.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => `${left.applicationName} ${left.phase}`.localeCompare(`${right.applicationName} ${right.phase}`));
  }, [roadmap, query, statusFilter]);
  const completed = roadmap.filter(task => task.status === 'COMPLETED' || (task.status !== 'BLOCKED' && Number(task.progress) >= 60)).length;
  const active = roadmap.filter(task => ['PLANNED', 'IN_PROGRESS'].includes(task.status) && Number(task.progress) > 0 && Number(task.progress) < 60).length;
  const notStarted = roadmap.filter(task => task.status === 'NOT_STARTED' || Number(task.progress) === 0).length;

  return <section className="it-card it-task-board">
    <header className="it-section-heading it-task-board-heading">
      <div>
        <span>{isEn ? 'TASKS BY APPLICATION' : 'TAREAS POR APLICACIÓN'}</span>
        <h2>{isEn ? 'Current work, line by line' : 'Trabajo actual, línea por línea'}</h2>
        <p>{isEn ? 'Every task has an application, an accountable person, a clear status and a visible progress line.' : 'Cada tarea tiene aplicación, responsable, estado claro y una línea de progreso visible.'}</p>
      </div>
      {canManage && <button className="primary it-add-task" type="button" onClick={onAddTask}><Plus size={16}/>{isEn ? 'Add task' : 'Añadir tarea'}</button>}
    </header>
    <div className="it-task-metrics">
      <div><strong>{roadmap.length}</strong><span>{isEn ? 'Total tasks' : 'Tareas totales'}</span></div>
      <div className="complete"><CheckCircle2 size={17}/><strong>{completed}</strong><span>{isEn ? '60%+ / completed' : '60%+ / completadas'}</span></div>
      <div className="active"><strong>{active}</strong><span>{isEn ? 'In progress' : 'En progreso'}</span></div>
      <div className="not-started"><strong>{notStarted}</strong><span>{isEn ? 'Not started' : 'Sin comenzar'}</span></div>
    </div>
    <div className="it-task-toolbar">
      <label className="it-search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={isEn ? 'Search application, person or task…' : 'Buscar aplicación, persona o tarea…'}/></label>
      <label className="it-task-status-filter"><span>{isEn ? 'Show' : 'Mostrar'}</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="ALL">{isEn ? 'All tasks' : 'Todas'}</option><option value="NOT_STARTED">{statusLabel('NOT_STARTED', isEn)}</option><option value="PLANNED">{statusLabel('PLANNED', isEn)}</option><option value="IN_PROGRESS">{statusLabel('IN_PROGRESS', isEn)}</option><option value="BLOCKED">{statusLabel('BLOCKED', isEn)}</option><option value="COMPLETED">{statusLabel('COMPLETED', isEn)}</option></select></label>
    </div>
    <div className="it-task-table-wrap">
      <table className="it-task-table">
        <thead><tr><th>{isEn ? 'Application' : 'Aplicación'}</th><th>{isEn ? 'Owner' : 'Responsable'}</th><th>{isEn ? 'Status' : 'Estado'}</th><th>{isEn ? 'Task' : 'Tarea'}</th><th>{isEn ? 'Progress' : 'Progreso'}</th><th aria-label={isEn ? 'Open' : 'Abrir'}/></tr></thead>
        <tbody>{visibleTasks.map(task => {
          const tone = progressTone(task);
          return <tr key={task.id} className={`it-task-row ${tone}`}>
            <td><strong>{task.applicationName}</strong><small>{task.applicationSource || ''}</small></td>
            <td><span className="it-task-owner"><UserRound size={14}/>{task.owner || (isEn ? 'Unassigned' : 'Sin asignar')}</span></td>
            <td><span className={`it-task-status ${String(task.status || '').toLowerCase()}`}>{statusLabel(task.status, isEn)}</span></td>
            <td className="it-task-description"><button type="button" onClick={() => onOpenTask?.(task)}><strong>{task.phase}</strong><small>{task.description || (isEn ? 'No task explanation recorded.' : 'No hay explicación registrada.')}</small></button></td>
            <td><div className={`it-task-progress ${tone}`}><div><b>{Number(task.progress) || 0}%</b><span>{tone === 'complete' ? (isEn ? 'On track' : 'Avance sólido') : tone === 'not-started' ? (isEn ? 'Needs start' : 'Requiere inicio') : tone === 'blocked' ? (isEn ? 'Needs attention' : 'Requiere atención') : (isEn ? 'Moving' : 'En movimiento')}</span></div><div className="it-task-progress-track"><i style={{ width: `${Math.max(0, Math.min(100, Number(task.progress) || 0))}%` }}/></div></div></td>
            <td><button className="it-row-action" type="button" onClick={() => onOpenTask?.(task)} aria-label={`${isEn ? 'Open' : 'Abrir'} ${task.phase}`}><ChevronRight size={16}/></button></td>
          </tr>;
        })}{!visibleTasks.length && <tr><td className="it-table-empty" colSpan="6"><ClipboardList size={21}/><p>{isEn ? 'No tasks match this view.' : 'No hay tareas para esta vista.'}</p></td></tr>}</tbody>
      </table>
    </div>
  </section>;
}
