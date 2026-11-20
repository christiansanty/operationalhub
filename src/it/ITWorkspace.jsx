import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Cpu, Lightbulb, ListFilter,
  RefreshCw, Save, ShieldCheck, UserRound, X,
} from 'lucide-react';
import './it-workspace.css';
import ApplicationScopeDirectory from './ApplicationScopeDirectory.jsx';
import ITTaskBoard from './ITTaskBoard.jsx';

const roadmapStatuses = ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
const proposalStatuses = ['SUBMITTED', 'IN_REVIEW', 'ACCEPTED', 'PLANNED', 'IN_PROGRESS', 'DECLINED', 'COMPLETED'];
const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const categories = ['ERROR', 'IMPROVEMENT', 'NEW_FEATURE', 'INTEGRATION', 'OTHER'];
const progressOptions = Array.from({ length: 11 }, (_, index) => index * 10);
const blankProposal = { applicationId: '', title: '', description: '', suggestedPriority: 'MEDIUM', category: 'IMPROVEMENT' };
const newSubmissionKey = () => `idea-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const label = (value, isEn) => {
  const labels = {
    NOT_STARTED: isEn ? 'Not started' : 'Sin comenzar', PLANNED: isEn ? 'Planned' : 'Planificado', IN_PROGRESS: isEn ? 'In progress' : 'En progreso', BLOCKED: isEn ? 'Blocked' : 'Bloqueado', COMPLETED: isEn ? 'Completed' : 'Completado',
    SUBMITTED: isEn ? 'Submitted' : 'Enviada', IN_REVIEW: isEn ? 'In review' : 'En revisión', ACCEPTED: isEn ? 'Accepted' : 'Aceptada', DECLINED: isEn ? 'Declined' : 'Declinada',
    LOW: isEn ? 'Low' : 'Baja', MEDIUM: isEn ? 'Medium' : 'Media', HIGH: isEn ? 'High' : 'Alta', CRITICAL: isEn ? 'Critical' : 'Crítica',
  };
  return labels[value] || String(value || '').replaceAll('_', ' ');
};

const displayDate = (value, isEn) => value ? new Date(value).toLocaleDateString(isEn ? 'en-US' : 'es-US') : (isEn ? 'Not set' : 'Sin fecha');

const roadmapDraft = row => ({ priority: row.priority, progress: row.progress, status: row.status, owner: row.owner, dueAt: row.dueAt, phase: row.phase, description: row.description || '', milestones: (row.milestones || []).join('\n') });
const blankTask = { applicationId: '', phase: '', description: '', priority: 'MEDIUM', status: 'NOT_STARTED', progress: 0, owner: '', dueAt: '', milestones: '' };
const splitLines = value => String(value || '').split('\n').map(line => line.trim()).filter(Boolean).slice(0, 20);
const isCatalogPlaceholder = task => task.createdBy === 'system:catalog' && task.phase === 'Registered';

const proposalPriority = proposal => proposal.priority || proposal.suggestedPriority || 'MEDIUM';
const sortProposals = proposals => [...proposals].sort((left, right) => {
  const priorityDifference = priorityOrder.indexOf(proposalPriority(left)) - priorityOrder.indexOf(proposalPriority(right));
  if (priorityDifference) return priorityDifference;
  return new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime();
});

function IdeaPriorityDashboard({ proposals, fullAccess, isEn, loading, onOpenProposal }) {
  const sortedProposals = sortProposals(proposals);
  const applicationCount = new Set(sortedProposals.map(proposal => proposal.applicationId)).size;
  const highPriorityCount = sortedProposals.filter(proposal => ['CRITICAL', 'HIGH'].includes(proposalPriority(proposal))).length;

  return <section className="it-card it-idea-dashboard">
    <header className="it-section-heading">
      <div>
        <span>{isEn ? 'IDEA PRIORITY DASHBOARD' : 'DASHBOARD DE PRIORIDAD DE IDEAS'}</span>
        <h2>{isEn ? 'All ideas, ready for IT review' : 'Todas las ideas, listas para revisión de IT'}</h2>
        <p>{fullAccess
          ? (isEn ? 'Every submitted idea is stored here and ordered by operational priority.' : 'Cada idea enviada se guarda aquí y se ordena por prioridad operacional.')
          : (isEn ? 'Your submitted ideas are stored here and ordered by operational priority.' : 'Tus ideas enviadas se guardan aquí y se ordenan por prioridad operacional.')}</p>
      </div>
      <span className="it-permission-badge"><ListFilter size={14}/>{isEn ? 'Priority order' : 'Orden de prioridad'}</span>
    </header>
    <div className="it-idea-metrics">
      <div><strong>{sortedProposals.length}</strong><span>{isEn ? 'Total ideas' : 'Ideas totales'}</span></div>
      <div><strong>{highPriorityCount}</strong><span>{isEn ? 'High / critical' : 'Altas / críticas'}</span></div>
      <div><strong>{applicationCount}</strong><span>{isEn ? 'Applications with ideas' : 'Aplicaciones con ideas'}</span></div>
    </div>
    {loading ? <div className="it-empty"><RefreshCw/><p>{isEn ? 'Loading saved ideas…' : 'Cargando ideas guardadas…'}</p></div> : <div className="it-priority-board">
      {priorityOrder.map(priority => {
        const group = sortedProposals.filter(proposal => proposalPriority(proposal) === priority);
        return <section className={`it-priority-group ${priority.toLowerCase()}`} key={priority}>
          <div className="it-priority-heading"><span className={`it-priority-marker ${priority.toLowerCase()}`}/><h3>{label(priority, isEn)}</h3><b>{group.length}</b></div>
          {group.length ? <div className="it-priority-list">{group.map(idea => <button className="it-priority-item" key={idea.id} onClick={() => onOpenProposal(idea)}>
            <div className="it-priority-item-main"><strong>{idea.title}</strong><small>{idea.applicationName} · {idea.submitter?.name || (isEn ? 'Unknown author' : 'Autor desconocido')}</small><p>{idea.description}</p></div>
            <div className="it-priority-item-meta"><span className={`it-pill ${idea.status.toLowerCase()}`}>{label(idea.status, isEn)}</span><small>{displayDate(idea.createdAt, isEn)}</small></div>
          </button>)}</div> : <p className="it-priority-empty">{isEn ? 'No ideas in this priority.' : 'No hay ideas con esta prioridad.'}</p>}
        </section>;
      })}
      {!sortedProposals.length && <div className="it-empty"><Lightbulb/><p>{isEn ? 'No ideas have been submitted yet.' : 'Todavía no se han enviado ideas.'}</p></div>}
    </div>}
  </section>;
}

export default function ITWorkspace({ lang = 'en', session }) {
  const isEn = lang === 'en';
  const canManage = session?.permissions?.['it:manage'] === 'manage';
  const [applications, setApplications] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposalError, setProposalError] = useState('');
  const [proposalNotice, setProposalNotice] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState(blankProposal);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(blankTask);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [roadmapForm, setRoadmapForm] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [proposalAdminForm, setProposalAdminForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const proposalSubmissionKey = useRef('');

  const readResponse = async (response, fallback) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || fallback);
    return payload;
  };

  const loadProposals = async () => {
    const payload = await readResponse(
      await fetch('/api/it/proposals', { cache: 'no-store' }),
      isEn ? 'IT ideas are not available.' : 'Las ideas de IT no están disponibles.',
    );
    setProposals(payload.proposals || []);
    setFullAccess(Boolean(payload.fullAccess));
    return payload;
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const catalogPayload = await readResponse(await fetch('/api/it/catalog', { cache: 'no-store' }), isEn ? 'IT applications are not available.' : 'Las aplicaciones de IT no están disponibles.');
      setApplications(catalogPayload.applications || []);
      const scopePayload = await readResponse(await fetch('/api/it/scope', { cache: 'no-store' }), isEn ? 'Application scope is not available.' : 'El scope de aplicaciones no está disponible.');
      setScopes(scopePayload.scopes || []);
      const roadmapPayload = await readResponse(await fetch('/api/it/roadmap', { cache: 'no-store' }), isEn ? 'The IT roadmap is not available.' : 'El roadmap de IT no está disponible.');
      setRoadmap(roadmapPayload.roadmap || []);
      await loadProposals();
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadScope = async () => {
    setScopeLoading(true);
    try {
      const response = await fetch('/api/it/scope', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'Application scope is not available.' : 'El scope de aplicaciones no está disponible.'));
      setScopes(payload.scopes || []);
    } catch (scopeError) { setError(scopeError.message); }
    finally { setScopeLoading(false); }
  };

  useEffect(() => {
    const interval = setInterval(loadScope, 60000);
    return () => clearInterval(interval);
  }, []);

  const submitProposal = async event => {
    event.preventDefault(); setSaving(true); setError(''); setProposalError('');
    try {
      if (!proposalSubmissionKey.current) proposalSubmissionKey.current = newSubmissionKey();
      const payload = await readResponse(
        await fetch('/api/it/proposals', { method: 'POST', headers: { 'content-type': 'application/json', 'x-idempotency-key': proposalSubmissionKey.current }, body: JSON.stringify(proposalForm) }),
        isEn ? 'Idea could not be submitted.' : 'No se pudo enviar la idea.',
      );
      if (!payload.proposal?.id) throw new Error(isEn ? 'The idea was not confirmed by the server.' : 'El servidor no confirmó el guardado de la idea.');
      setProposals(current => sortProposals([payload.proposal, ...current.filter(item => item.id !== payload.proposal.id)]));
      setProposalForm({ ...blankProposal });
      setProposalOpen(false);
      proposalSubmissionKey.current = '';
      setProposalNotice(payload.replayed ? (isEn ? 'This idea was already saved.' : 'Esta idea ya estaba guardada.') : (isEn ? 'Idea saved and sent to the IT inbox.' : 'La idea se guardó y se envió a la bandeja de IT.'));
      setError('');
      loadProposals().catch(() => setProposalNotice(isEn ? 'Idea saved. The inbox will refresh when the connection is available.' : 'La idea se guardó. La bandeja se actualizará cuando la conexión esté disponible.'));
    } catch (saveError) { setProposalError(saveError.message); setError(saveError.message); }
    finally { setSaving(false); }
  };

  const saveRoadmap = async event => {
    event.preventDefault(); if (!selectedRoadmap || !roadmapForm) return; setSaving(true); setError('');
    try {
      const response = await fetch(`/api/it/roadmap/${encodeURIComponent(selectedRoadmap.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...roadmapForm, progress: Number(roadmapForm.progress), milestones: splitLines(roadmapForm.milestones) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'IT work could not be saved.' : 'No se pudo guardar el trabajo de IT.'));
      setSelectedRoadmap(null); setRoadmapForm(null); await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const submitTask = async event => {
    event.preventDefault(); if (!taskForm.applicationId) return; setSaving(true); setError('');
    try {
      const response = await fetch('/api/it/roadmap', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...taskForm, progress: Number(taskForm.progress), milestones: splitLines(taskForm.milestones) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'The task could not be created.' : 'No se pudo crear la tarea.'));
      setTaskOpen(false); setTaskForm({ ...blankTask }); await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const saveProposalAdmin = async event => {
    event.preventDefault(); if (!selectedProposal || !proposalAdminForm) return; setSaving(true); setError('');
    try {
      const response = await fetch(`/api/it/proposals/${encodeURIComponent(selectedProposal.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(proposalAdminForm) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'Idea could not be updated.' : 'No se pudo actualizar la idea.'));
      setSelectedProposal(null); setProposalAdminForm(null); await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  const completeProposal = async proposal => {
    if (!proposal || !canManage || proposal.status === 'COMPLETED') return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/it/proposals/${encodeURIComponent(proposal.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'COMPLETED' }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'The idea could not be completed.' : 'No se pudo completar la idea.'));
      setProposals(current => sortProposals(current.map(item => item.id === proposal.id ? payload.proposal : item)));
      setProposalNotice(isEn ? 'Idea marked as completed.' : 'Idea marcada como completada.');
    } catch (completeError) { setError(completeError.message); }
    finally { setSaving(false); }
  };

  const updateProposalField = (field, value) => setProposalForm(current => ({ ...current, [field]: value }));
  const openProposalForm = () => { setProposalForm({ ...blankProposal }); setProposalError(''); setProposalNotice(''); proposalSubmissionKey.current = newSubmissionKey(); setProposalOpen(true); };
  const closeProposalForm = () => { if (!saving) { setProposalError(''); setProposalOpen(false); } };
  const openRoadmap = row => { setSelectedRoadmap(row); setRoadmapForm(roadmapDraft(row)); };
  const openTaskForm = () => { setTaskForm({ ...blankTask, applicationId: applications[0]?.id || '' }); setTaskOpen(true); };
  const actionableRoadmap = roadmap.filter(task => !isCatalogPlaceholder(task));
  const openProposal = proposal => {
    setSelectedProposal(proposal);
    setProposalAdminForm(fullAccess ? { status: proposal.status, suggestedPriority: proposal.suggestedPriority, category: proposal.category, assignedTo: proposal.assignedTo, itComment: proposal.itComment, declineReason: proposal.declineReason, dueAt: proposal.dueAt || '' } : null);
  };

  return <div className="page it-workspace">
    <header className="it-hero"><div><span><Cpu size={16}/> {isEn ? 'INFORMATION TECHNOLOGY · CONTROL CENTER' : 'TECNOLOGÍA DE INFORMACIÓN · CENTRO DE CONTROL'}</span><h1>{isEn ? 'IT Workspace' : 'Espacio de IT'}</h1><p>{isEn ? 'One simple place for applications, current IT work and coworker ideas.' : 'Un solo lugar para aplicaciones, trabajo actual de IT e ideas de los colaboradores.'}</p></div><div className="it-hero-actions"><button className="primary it-submit-idea" onClick={openProposalForm}><Lightbulb size={17}/>{isEn ? 'Submit an idea' : 'Enviar una idea'}</button><button className="icon-btn" onClick={load} title={isEn ? 'Refresh' : 'Actualizar'}><RefreshCw size={17}/></button></div></header>
    <div className="it-boundary"><ShieldCheck size={19}/><div><strong>{isEn ? 'Keep ideas operational and confidential' : 'Mantén las ideas operacionales y confidenciales'}</strong><span>{isEn ? 'Do not include patient data, PHI, passwords, tokens, secrets or confidential records. IT generates the expected outcome and impact from the idea.' : 'No incluyas datos de pacientes, PHI, contraseñas, tokens, secretos ni expedientes confidenciales. IT genera el resultado esperado y el impacto a partir de la idea.'}</span></div></div>
    {error && <div className="it-error"><AlertTriangle size={16}/>{error}</div>}
    {proposalNotice && <div className="it-success" role="status"><CheckCircle2 size={16}/>{proposalNotice}</div>}
    <IdeaPriorityDashboard proposals={proposals} fullAccess={fullAccess} isEn={isEn} loading={loading} onOpenProposal={openProposal}/>
    {loading ? <div className="it-card it-empty"><RefreshCw/><p>{isEn ? 'Loading IT applications…' : 'Cargando aplicaciones de IT…'}</p></div> : <><ITTaskBoard roadmap={actionableRoadmap} lang={lang} canManage={canManage} onOpenTask={openRoadmap} onAddTask={openTaskForm}/><ApplicationScopeDirectory scopes={scopes} roadmap={actionableRoadmap} proposals={sortProposals(proposals)} lang={lang} loading={scopeLoading} canManage={canManage} onRefresh={loadScope} onOpenRoadmap={openRoadmap} onOpenProposal={openProposal} onCompleteProposal={completeProposal}/></>}

    {proposalOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeProposalForm()}><form className="quick-modal it-modal" onSubmit={submitProposal}><div className="modal-heading"><div><span>{isEn ? 'COWORKER INPUT' : 'APORTE DEL COLABORADOR'}</span><h2>{isEn ? 'Submit an idea' : 'Enviar una idea'}</h2></div><button type="button" disabled={saving} onClick={closeProposalForm} aria-label={isEn ? 'Close' : 'Cerrar'}><X/></button></div><p className="it-warning"><ShieldCheck size={15}/>{isEn ? 'Only describe the idea or problem. Expected outcome and impact are generated by the system.' : 'Solo describe la idea o el problema. El resultado esperado y el impacto los genera el sistema.'}</p>{proposalError && <div className="it-error" role="alert"><AlertTriangle size={16}/>{proposalError}</div>}<div className="it-form-grid"><label>{isEn ? 'Related application' : 'Aplicación relacionada'}<select required value={proposalForm.applicationId} onChange={event => updateProposalField('applicationId', event.target.value)}><option value="">{isEn ? 'Select an application' : 'Selecciona una aplicación'}</option>{applications.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}</select></label><label>{isEn ? 'Priority' : 'Prioridad'}<select value={proposalForm.suggestedPriority} onChange={event => updateProposalField('suggestedPriority', event.target.value)}>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></label><label>{isEn ? 'Category' : 'Categoría'}<select value={proposalForm.category} onChange={event => updateProposalField('category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="it-wide">{isEn ? 'Idea title' : 'Título de la idea'}<input required value={proposalForm.title} onChange={event => updateProposalField('title', event.target.value)}/></label><label className="it-wide">{isEn ? 'Describe the idea or problem' : 'Describe la idea o el problema'}<textarea required rows="5" value={proposalForm.description} onChange={event => updateProposalField('description', event.target.value)}/></label></div><div className="modal-actions"><button type="button" disabled={saving} onClick={closeProposalForm}>{isEn ? 'Cancel' : 'Cancelar'}</button><button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving ? (isEn ? 'Sending…' : 'Enviando…') : (isEn ? 'Submit idea' : 'Enviar idea')}</button></div></form></div>}

    {taskOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && !saving && setTaskOpen(false)}><form className="quick-modal it-modal" onSubmit={submitTask}><div className="modal-heading"><div><span>{isEn ? 'IT WORK' : 'TRABAJO DE IT'}</span><h2>{isEn ? 'Add a task' : 'Añadir una tarea'}</h2></div><button type="button" disabled={saving} onClick={() => setTaskOpen(false)} aria-label={isEn ? 'Close' : 'Cerrar'}><X/></button></div><p className="it-warning"><ShieldCheck size={15}/>{isEn ? 'The new task will appear automatically in Tasks by applications and inside the selected application.' : 'La tarea nueva aparecerá automáticamente en Tareas por aplicación y dentro de la aplicación seleccionada.'}</p><div className="it-form-grid"><label>{isEn ? 'Application' : 'Aplicación'}<select required value={taskForm.applicationId} onChange={event => setTaskForm({ ...taskForm, applicationId: event.target.value })}><option value="">{isEn ? 'Select an application' : 'Selecciona una aplicación'}</option>{applications.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}</select></label><label>{isEn ? 'Owner' : 'Responsable'}<input value={taskForm.owner} onChange={event => setTaskForm({ ...taskForm, owner: event.target.value })} placeholder={isEn ? 'Person or team' : 'Persona o equipo'}/></label><label className="it-wide">{isEn ? 'Task' : 'Tarea'}<input required value={taskForm.phase} onChange={event => setTaskForm({ ...taskForm, phase: event.target.value })} placeholder={isEn ? 'What needs to be done?' : '¿Qué hay que hacer?'}/></label><label className="it-wide">{isEn ? 'What is this task about?' : '¿De qué trata esta tarea?'}<textarea required rows="3" value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })}/></label><label>{isEn ? 'Status' : 'Estado'}<select value={taskForm.status} onChange={event => setTaskForm({ ...taskForm, status: event.target.value })}>{roadmapStatuses.map(status => <option key={status}>{status}</option>)}</select></label><label>{isEn ? 'Progress' : 'Progreso'}<select value={taskForm.progress} onChange={event => setTaskForm({ ...taskForm, progress: event.target.value })}>{progressOptions.map(progress => <option key={progress} value={progress}>{progress}%</option>)}</select></label><label>{isEn ? 'Priority' : 'Prioridad'}<select value={taskForm.priority} onChange={event => setTaskForm({ ...taskForm, priority: event.target.value })}>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></label><label>{isEn ? 'Target date' : 'Fecha meta'}<input type="date" value={taskForm.dueAt} onChange={event => setTaskForm({ ...taskForm, dueAt: event.target.value })}/></label><label className="it-wide">{isEn ? 'Steps, one per line' : 'Pasos, uno por línea'}<textarea rows="4" value={taskForm.milestones} onChange={event => setTaskForm({ ...taskForm, milestones: event.target.value })} placeholder={isEn ? 'Confirm scope\nTest the change\nObtain owner sign-off' : 'Confirmar alcance\nProbar el cambio\nObtener aprobación'}/></label></div><div className="modal-actions"><button type="button" disabled={saving} onClick={() => setTaskOpen(false)}>{isEn ? 'Cancel' : 'Cancelar'}</button><button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Save task' : 'Guardar tarea')}</button></div></form></div>}

    {selectedRoadmap && roadmapForm && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelectedRoadmap(null)}><form className="quick-modal it-modal" onSubmit={canManage ? saveRoadmap : event => { event.preventDefault(); setSelectedRoadmap(null); }}><div className="modal-heading"><div><span>{selectedRoadmap.applicationName}</span><h2>{isEn ? 'IT work details' : 'Detalle del trabajo de IT'}</h2></div><button type="button" onClick={() => setSelectedRoadmap(null)} aria-label={isEn ? 'Close' : 'Cerrar'}><X/></button></div><div className="it-record-meta"><span><CalendarDays size={14}/><b>{isEn ? 'Created' : 'Creada'}</b>{displayDate(selectedRoadmap.createdAt, isEn)}</span><span><UserRound size={14}/><b>{isEn ? 'Created by' : 'Creada por'}</b>{selectedRoadmap.createdBy}</span></div>{canManage ? <div className="it-form-grid"><label className="it-wide">{isEn ? 'Task' : 'Tarea'}<input required value={roadmapForm.phase} onChange={event => setRoadmapForm({ ...roadmapForm, phase: event.target.value })}/></label><label className="it-wide">{isEn ? 'What is this task about?' : '¿De qué trata esta tarea?'}<textarea required rows="3" value={roadmapForm.description} onChange={event => setRoadmapForm({ ...roadmapForm, description: event.target.value })}/></label><label>{isEn ? 'Importance' : 'Importancia'}<select value={roadmapForm.priority} onChange={event => setRoadmapForm({ ...roadmapForm, priority: event.target.value })}>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></label><label>{isEn ? 'Status' : 'Estado'}<select value={roadmapForm.status} onChange={event => setRoadmapForm({ ...roadmapForm, status: event.target.value })}>{roadmapStatuses.map(status => <option key={status}>{status}</option>)}</select></label><label>{isEn ? 'Progress' : 'Progreso'}<select value={roadmapForm.progress} onChange={event => setRoadmapForm({ ...roadmapForm, progress: event.target.value })}>{progressOptions.map(progress => <option key={progress} value={progress}>{progress}%</option>)}</select></label><label>{isEn ? 'Working on it' : 'Trabaja en ella'}<input value={roadmapForm.owner} onChange={event => setRoadmapForm({ ...roadmapForm, owner: event.target.value })} placeholder={isEn ? 'Name or team' : 'Nombre o equipo'}/></label><label>{isEn ? 'Estimated completion' : 'Terminación estimada'}<input type="date" value={roadmapForm.dueAt ? roadmapForm.dueAt.slice(0, 10) : ''} onChange={event => setRoadmapForm({ ...roadmapForm, dueAt: event.target.value })}/></label><label className="it-wide">{isEn ? 'Steps, one per line' : 'Pasos, uno por línea'}<textarea rows="4" value={roadmapForm.milestones} onChange={event => setRoadmapForm({ ...roadmapForm, milestones: event.target.value })}/></label></div> : <div className="it-readonly-detail"><strong>{selectedRoadmap.phase}</strong><p>{selectedRoadmap.description || (isEn ? 'No task explanation recorded.' : 'No hay explicación registrada.')}</p><p>{isEn ? 'Status' : 'Estado'}: {label(selectedRoadmap.status, isEn)} · {isEn ? 'Importance' : 'Importancia'}: {label(selectedRoadmap.priority, isEn)} · {isEn ? 'Progress' : 'Progreso'}: {selectedRoadmap.progress}%</p>{selectedRoadmap.milestones?.length > 0 && <ol className="it-task-steps">{selectedRoadmap.milestones.map(step => <li key={step}>{step}</li>)}</ol>}<p>{isEn ? 'IT Manage permission is required to edit this record.' : 'Se requiere permiso IT Gestionar para editar este registro.'}</p></div>}<div className="modal-actions"><button type="button" onClick={() => setSelectedRoadmap(null)}>{isEn ? 'Close' : 'Cerrar'}</button>{canManage && <button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Save' : 'Guardar')}</button>}</div></form></div>}

    {selectedProposal && !proposalAdminForm && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelectedProposal(null)}><section className="quick-modal it-modal"><div className="modal-heading"><div><span>{selectedProposal.applicationName}</span><h2>{selectedProposal.title}</h2></div><button type="button" onClick={() => setSelectedProposal(null)} aria-label={isEn ? 'Close' : 'Cerrar'}><X/></button></div><div className="it-record-meta"><span><UserRound size={14}/><b>{isEn ? 'Inserted by' : 'Insertada por'}</b>{selectedProposal.submitter?.name}</span><span><CalendarDays size={14}/><b>{isEn ? 'Entered' : 'Ingresó'}</b>{displayDate(selectedProposal.createdAt, isEn)}</span><span><CalendarDays size={14}/><b>{isEn ? 'Deadline' : 'Deadline'}</b>{displayDate(selectedProposal.dueAt, isEn)}</span><span><b>{isEn ? 'Process' : 'Proceso'}</b>{label(selectedProposal.status, isEn)}</span><span><b>{isEn ? 'Priority' : 'Prioridad'}</b>{label(selectedProposal.priority || selectedProposal.suggestedPriority, isEn)}</span></div><p className="it-readonly-detail">{selectedProposal.description}</p><div className="it-generated-grid"><div><b>{isEn ? 'System-generated outcome' : 'Resultado generado por el sistema'}</b><p>{selectedProposal.expectedOutcome}</p></div><div><b>{isEn ? 'System-generated impact' : 'Impacto generado por el sistema'}</b><p>{selectedProposal.impact}</p></div></div>{selectedProposal.itComment && <div className="it-readonly-detail"><strong>{isEn ? 'IT note' : 'Nota de IT'}</strong><p>{selectedProposal.itComment}</p></div>}{selectedProposal.completedAt && <div className="it-success"><CheckCircle2 size={16}/>{isEn ? `Completed on ${displayDate(selectedProposal.completedAt, isEn)}` : `Completada el ${displayDate(selectedProposal.completedAt, isEn)}`}</div>}<div className="modal-actions"><button type="button" onClick={() => setSelectedProposal(null)}>{isEn ? 'Close' : 'Cerrar'}</button></div></section></div>}

    {selectedProposal && proposalAdminForm && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelectedProposal(null)}><form className="quick-modal it-modal" onSubmit={saveProposalAdmin}><div className="modal-heading"><div><span>{selectedProposal.applicationName} · {selectedProposal.submitter?.name}</span><h2>{selectedProposal.title}</h2></div><button type="button" onClick={() => setSelectedProposal(null)} aria-label={isEn ? 'Close' : 'Cerrar'}><X/></button></div><div className="it-record-meta"><span><UserRound size={14}/><b>{isEn ? 'Inserted by' : 'Insertada por'}</b>{selectedProposal.submitter?.name}</span><span><CalendarDays size={14}/><b>{isEn ? 'Entered' : 'Ingresó'}</b>{displayDate(selectedProposal.createdAt, isEn)}</span><span><b>{isEn ? 'Current process' : 'Proceso actual'}</b>{label(proposalAdminForm.status, isEn)}</span></div><p className="it-readonly-detail">{selectedProposal.description}</p><div className="it-generated-grid"><div><b>{isEn ? 'System-generated outcome' : 'Resultado generado por el sistema'}</b><p>{selectedProposal.expectedOutcome}</p></div><div><b>{isEn ? 'System-generated impact' : 'Impacto generado por el sistema'}</b><p>{selectedProposal.impact}</p></div></div><div className="it-form-grid"><label>{isEn ? 'Status' : 'Estado'}<select value={proposalAdminForm.status} onChange={event => setProposalAdminForm({ ...proposalAdminForm, status: event.target.value })}>{proposalStatuses.map(status => <option key={status}>{status}</option>)}</select></label><label>{isEn ? 'Importance' : 'Importancia'}<select value={proposalAdminForm.suggestedPriority} onChange={event => setProposalAdminForm({ ...proposalAdminForm, suggestedPriority: event.target.value })}>{priorities.map(priority => <option key={priority}>{label(priority, isEn)}</option>)}</select></label><label>{isEn ? 'Assigned to' : 'Asignada a'}<input value={proposalAdminForm.assignedTo} onChange={event => setProposalAdminForm({ ...proposalAdminForm, assignedTo: event.target.value })}/></label><label>{isEn ? 'Deadline' : 'Fecha límite'}<input type="date" value={proposalAdminForm.dueAt ? proposalAdminForm.dueAt.slice(0, 10) : ''} onChange={event => setProposalAdminForm({ ...proposalAdminForm, dueAt: event.target.value })}/></label><label>{isEn ? 'Category' : 'Categoría'}<select value={proposalAdminForm.category} onChange={event => setProposalAdminForm({ ...proposalAdminForm, category: event.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="it-wide">{isEn ? 'IT note' : 'Nota de IT'}<textarea rows="3" value={proposalAdminForm.itComment} onChange={event => setProposalAdminForm({ ...proposalAdminForm, itComment: event.target.value })}/></label>{proposalAdminForm.status === 'DECLINED' && <label className="it-wide">{isEn ? 'Decline reason' : 'Razón de declinación'}<textarea required rows="3" value={proposalAdminForm.declineReason} onChange={event => setProposalAdminForm({ ...proposalAdminForm, declineReason: event.target.value })}/></label>}</div><div className="modal-actions"><button type="button" onClick={() => setSelectedProposal(null)}>{isEn ? 'Cancel' : 'Cancelar'}</button><button className="primary" disabled={saving} type="submit"><Save size={16}/>{saving ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Save idea' : 'Guardar idea')}</button></div></form></div>}
  </div>;
}
