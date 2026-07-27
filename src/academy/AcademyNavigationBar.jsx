import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, ChevronDown, GraduationCap, Home, X } from 'lucide-react';
import './academy-navigation-bar.css';

const buildCalendar = date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length:mondayOffset }, () => null),
    ...Array.from({ length:daysInMonth }, (_, index) => index + 1),
  ];
};

export default function AcademyNavigationBar({
  lang,
  currentPage,
  canBack,
  canForward,
  onBack,
  onForward,
  onHome,
  onCatalog,
}) {
  const isEn = lang === 'en';
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = new Date();
  const days = useMemo(() => buildCalendar(today), [today.getFullYear(), today.getMonth()]);
  const weekdays = isEn ? ['M','T','W','T','F','S','S'] : ['L','M','X','J','V','S','D'];
  const dateLabel = new Intl.DateTimeFormat(isEn ? 'en-US' : 'es-US', {
    weekday:'long', month:'long', day:'numeric', year:'numeric',
  }).format(today);
  const monthLabel = new Intl.DateTimeFormat(isEn ? 'en-US' : 'es-US', {
    month:'long', year:'numeric',
  }).format(today);
  const pageLabel = ({
    academy:isEn ? 'Academy overview' : 'Resumen de Academy',
    learning:isEn ? 'Course catalog' : 'Catálogo de cursos',
    systems:isEn ? 'Systems training' : 'Capacitación de sistemas',
    certificates:isEn ? 'Certificates' : 'Certificados',
    team:isEn ? 'Team progress' : 'Progreso del equipo',
  })[currentPage] || 'Eastern Medical Academy';

  return <nav className="academy-navigation-bar" aria-label={isEn ? 'Academy navigation controls' : 'Controles de navegación de Academy'}>
    <div className="academy-history-controls">
      <button type="button" onClick={onBack} disabled={!canBack} title={isEn ? 'Back' : 'Atrás'} aria-label={isEn ? 'Back in Academy' : 'Atrás en Academy'}><ArrowLeft/></button>
      <button type="button" onClick={onForward} disabled={!canForward} title={isEn ? 'Forward' : 'Adelante'} aria-label={isEn ? 'Forward in Academy' : 'Adelante en Academy'}><ArrowRight/></button>
    </div>
    <div className="academy-location">
      <span><GraduationCap/></span>
      <div><small>Eastern Medical Academy</small><strong>{pageLabel}</strong></div>
    </div>
    <div className="academy-destination-controls">
      <button type="button" className={currentPage === 'academy' ? 'active' : ''} onClick={onHome}><Home/>{isEn ? 'Academy home' : 'Inicio de Academy'}</button>
      <button type="button" className={currentPage === 'learning' ? 'active' : ''} onClick={onCatalog}><BookOpen/>{isEn ? 'Course catalog' : 'Catálogo de cursos'}</button>
    </div>
    <div className="academy-date-control">
      <button type="button" onClick={() => setCalendarOpen(value => !value)} aria-expanded={calendarOpen}><CalendarDays/><span><small>{isEn ? 'TODAY' : 'HOY'}</small><strong>{dateLabel}</strong></span><ChevronDown/></button>
      {calendarOpen && <section className="academy-calendar-popover">
        <header><div><small>{isEn ? 'CURRENT CALENDAR' : 'CALENDARIO ACTUAL'}</small><strong>{monthLabel}</strong></div><button type="button" onClick={() => setCalendarOpen(false)} aria-label={isEn ? 'Close calendar' : 'Cerrar calendario'}><X/></button></header>
        <div className="academy-calendar-weekdays">{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        <div className="academy-calendar-days">{days.map((day, index) => <span key={`${day || 'empty'}-${index}`} className={day === today.getDate() ? 'today' : day ? '' : 'empty'}>{day || ''}</span>)}</div>
        <footer><i/><span>{isEn ? 'Today' : 'Hoy'} · {dateLabel}</span></footer>
      </section>}
    </div>
  </nav>;
}
