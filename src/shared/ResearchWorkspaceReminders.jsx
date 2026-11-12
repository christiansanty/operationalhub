import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, CircleAlert, Clock3, RefreshCw, UserRound } from 'lucide-react';

const pinnedPeople = [
  { key: 'tyce', name: 'Tyce' },
  { key: 'pavel', name: 'Pavel' },
];

const copy = {
  en: {
    kicker: 'LIVE TEAM ALERTS',
    title: 'Keep the next action visible',
    subtitle: 'Live reminders for every Research work item owner, with Tyce and Pavel pinned for quick visibility.',
    assignedTo: 'Assigned reminders',
    deadline: 'Deadline',
    followUp: 'Follow-up',
    overdue: 'Overdue',
    today: 'Today',
    upcoming: 'Upcoming',
    empty: 'No reminders yet.',
    emptyHint: 'Assign work to any person and add a deadline or follow-up date.',
    openTracker: 'Open work tracker',
    refresh: 'Refresh reminders',
    rule: 'Notifications are generated from open work items with a deadline or follow-up date.',
    failed: 'Reminders could not be loaded.',
  },
  es: {
    kicker: 'ALERTAS ACTIVAS DEL EQUIPO',
    title: 'Mantén visible la próxima acción',
    subtitle: 'Recordatorios vivos para cada responsable de Research, con Tyce y Pavel fijados para acceso rápido.',
    assignedTo: 'Recordatorios asignados',
    deadline: 'Deadline',
    followUp: 'Follow-up',
    overdue: 'Vencido',
    today: 'Hoy',
    upcoming: 'Próximo',
    empty: 'Todavía no hay recordatorios.',
    emptyHint: 'Asigna trabajo a cualquier persona y agrega un deadline o fecha de follow-up.',
    openTracker: 'Abrir seguimiento',
    refresh: 'Actualizar recordatorios',
    rule: 'Las notificaciones se generan desde trabajos abiertos con deadline o fecha de follow-up.',
    failed: 'No se pudieron cargar los recordatorios.',
  },
};

const dateLabel = (value, lang) => {
  try {
    return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
};

const ownerKey = owner => String(owner || '').trim().toLowerCase();
const hasReminderDate = item => item.status !== 'done' && Boolean(item.deadline || item.followUpDate);

export default function ResearchWorkspaceReminders({ lang = 'en', scopeKey = 'entity-research' }) {
  const t = copy[lang] || copy.en;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/research-workspace/items?scope=${encodeURIComponent(scopeKey)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t.failed);
      setItems(payload.items || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || t.failed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scopeKey) loadItems();
  }, [scopeKey]);

  const displayPeople = useMemo(() => {
    const dynamicPeople = items.reduce((result, item) => {
      const name = String(item.owner || '').trim();
      const key = ownerKey(name);
      if (!hasReminderDate(item) || !key || pinnedPeople.some(person => person.key === key) || result.some(person => person.key === key)) return result;
      return [...result, { key, name }];
    }, []);
    const needsOwner = items.some(item => hasReminderDate(item) && !ownerKey(item.owner));
    return [...pinnedPeople, ...dynamicPeople, ...(needsOwner ? [{ key: 'unassigned', name: 'Unassigned' }] : [])];
  }, [items]);

  const reminders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return displayPeople.reduce((result, person) => {
      const personItems = items
        .filter(item => hasReminderDate(item) && (person.key === 'unassigned' ? !ownerKey(item.owner) : ownerKey(item.owner) === person.key))
        .flatMap(item => [
          item.deadline && { id: `${item.id}-deadline`, type: 'deadline', label: t.deadline, date: item.deadline, item },
          item.followUpDate && { id: `${item.id}-follow-up`, type: 'follow-up', label: t.followUp, date: item.followUpDate, item },
        ].filter(Boolean))
        .map(reminder => ({
          ...reminder,
          state: reminder.date < today ? 'overdue' : reminder.date === today ? 'today' : 'upcoming',
        }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.item.title.localeCompare(b.item.title));
      result[person.key] = personItems;
      return result;
    }, {});
  }, [displayPeople, items, t.deadline, t.followUp]);

  return <section className="research-reminders-panel">
    <header className="research-reminders-header">
      <div>
        <span><BellRing size={15}/>{t.kicker}</span>
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </div>
      <button type="button" className="research-reminders-refresh" onClick={loadItems} aria-label={t.refresh} title={t.refresh} disabled={loading}>
        <RefreshCw size={16} className={loading ? 'spinning' : ''}/>
      </button>
    </header>
    {error && <p className="research-reminders-error"><CircleAlert size={15}/>{error}</p>}
    <div className="research-reminders-people">
      {displayPeople.map(person => {
        const personReminders = reminders[person.key] || [];
        return <article className="research-reminder-person" key={person.key}>
          <header>
            <div className={`research-reminder-avatar avatar-${person.key}`}>{person.name.slice(0, 1)}</div>
            <div><strong>{person.name}</strong><small>{t.assignedTo}</small></div>
            <b>{personReminders.length}</b>
          </header>
          {personReminders.length ? <div className="research-reminder-list">{personReminders.map(reminder => <a className={`research-reminder-card state-${reminder.state}`} href="#research-work-tracker" key={reminder.id}>
            <div className="research-reminder-card-icon">{reminder.state === 'overdue' ? <CircleAlert size={16}/> : reminder.type === 'deadline' ? <CalendarClock size={16}/> : <Clock3 size={16}/>}</div>
            <div><strong>{reminder.item.title}</strong><span>{reminder.label} · {dateLabel(reminder.date, lang)}</span></div>
            <em>{t[reminder.state]}</em>
          </a>)}</div> : <div className="research-reminder-empty"><UserRound size={17}/><p>{t.empty}<small>{t.emptyHint}</small></p></div>}
          <a className="research-reminder-open" href="#research-work-tracker">{t.openTracker}</a>
        </article>;
      })}
    </div>
    <footer className="research-reminders-rule"><CircleAlert size={15}/><span>{t.rule}</span></footer>
  </section>;
}
