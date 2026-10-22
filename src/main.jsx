import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Award, BarChart3, Bell, BookOpen, Building2,
  Bot, CalendarDays, Camera, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  ClipboardCheck, Clock3, Cpu, Download, ExternalLink, FileCheck2, FileText, Filter, GraduationCap, Headphones,
  HeartPulse, Languages, LayoutDashboard, LockKeyhole, LogOut, MapPin, Maximize2, Mic, Minimize2,
  Menu, MessageSquareText, Play, Plus, Route, Search, Send, ShieldCheck, Sparkles, Stethoscope,
  Target, TrendingUp, UserPlus, UserRound, Users, WandSparkles, X
} from 'lucide-react';
import './styles.css';
import { AirtableCatalog, AirtableCourseDetail, AirtableSyncPanel, airtableSync, useAcademyBackendData } from './academy/AirtableTraining.jsx';
import AcademyLesson from './academy/AcademyLesson.jsx';
import AcademyWelcomeVideo from './academy/AcademyWelcomeVideo.jsx';
import InternalAppsAcademy from './academy/InternalAppsAcademy.jsx';
import OperationalProtocols, { DepartmentCourseMap } from './academy/OperationalProtocols.jsx';
import LicenseCenter from './licenses/LicenseCenter.jsx';
import EntityWorkspace, { entityDefinitions, entityNavItems, entityPage, parseEntityPage } from './entities/EntityWorkspace.jsx';
import CorporateHub from './corporate/CorporateHub.jsx';
import HumanResources from './hr/HumanResources.jsx';
import CredentialingCenter, { ContractingCenter } from './credentialing/CredentialingCenter.jsx';
import ResearchModule from './research/ResearchModule.jsx';
import ResearchAgreements from './research/ResearchAgreements.jsx';
import ITWorkspace from './it/ITWorkspace.jsx';
import WorkspaceResources from './shared/WorkspaceResources.jsx';
import EmployeePackagePortal from './hr/EmployeePackagePortal.jsx';
import ApplicationEcosystem from './apps/ApplicationEcosystem.jsx';
import { applicationPermissionModules } from './apps/applicationRegistry.js';
import ServerUsersAdministration, { InvitationSetup } from './admin/UsersAdministration.jsx';
import {
  canSessionAccessApplication, canSessionAccessPage, canSessionManagePage,
  firstAccessiblePage, sessionAccessSignature,
} from './auth/accessControl.js';

const UI = {
  en: {
    academy: 'Eastern Medical Academy', signIn: 'Employee sign in', signInSub: 'Continue your training journey.',
    email: 'Work email', password: 'Password', enter: 'Sign in', demo: 'Enter demo academy', secure: 'Secure employee learning portal',
    nav: ['Overview', 'My learning', 'Course library', 'Certificates', 'Team progress'],
    welcome: 'Welcome back, Admin', welcomeSub: 'You’re building the skills that make every patient interaction exceptional.',
    continue: 'Continue learning', resume: 'Resume lesson', progress: 'Overall progress', hours: 'Learning hours', completed: 'Modules completed', score: 'Average score',
    paths: 'Your learning paths', viewAll: 'View all courses', due: 'Due', modules: 'modules', complete: 'complete', required: 'Required', specialization: 'Specialization',
    activity: 'This week', goals: 'Weekly goal', achieved: 'Goal achieved', cert: 'Certification readiness', certSub: 'Complete all requirements to unlock your certificate.',
    library: 'Course library', librarySub: 'Build confidence across every part of the patient experience.', search: 'Search courses', all: 'All', core: 'Core training', specializations: 'Specializations',
    lesson: 'Lesson', lessonProgress: 'Course progress', mark: 'Mark complete & continue', previous: 'Previous', next: 'Next lesson', knowledge: 'Knowledge check',
    submit: 'Submit answers', result: 'Your result', passed: 'Passed', retry: 'Review & retry', explanation: 'Why this matters',
    admin: 'Team progress', adminSub: 'Monitor completion, assessment results, and certification readiness.', export: 'Export report', employee: 'Employee', department: 'Department', lastActive: 'Last active', status: 'Status',
    certificate: 'Certificate of Completion', certifies: 'This certifies that', certifiedText: 'has successfully completed the foundational training requirements of', download: 'Download training record', print: 'Print certificate',
    logout: 'Sign out', profile: 'Profile', notifications: 'Notifications', preview: 'Prototype · Training content requires final approval',
  },
  es: {
    academy: 'Eastern Medical Academy', signIn: 'Acceso de empleados', signInSub: 'Continúa tu recorrido de capacitación.',
    email: 'Correo corporativo', password: 'Contraseña', enter: 'Iniciar sesión', demo: 'Entrar a la academia demo', secure: 'Portal seguro de aprendizaje',
    nav: ['Resumen', 'Mi aprendizaje', 'Catálogo de cursos', 'Certificados', 'Progreso del equipo'],
    welcome: 'Bienvenido de nuevo, Admin', welcomeSub: 'Estás desarrollando las habilidades que hacen excepcional cada interacción con el paciente.',
    continue: 'Continuar aprendiendo', resume: 'Retomar lección', progress: 'Progreso general', hours: 'Horas de estudio', completed: 'Módulos completados', score: 'Promedio',
    paths: 'Tus rutas de aprendizaje', viewAll: 'Ver todos los cursos', due: 'Vence', modules: 'módulos', complete: 'completado', required: 'Obligatorio', specialization: 'Especialización',
    activity: 'Esta semana', goals: 'Meta semanal', achieved: 'Meta alcanzada', cert: 'Preparación para certificación', certSub: 'Completa todos los requisitos para habilitar tu certificado.',
    library: 'Catálogo de cursos', librarySub: 'Desarrolla confianza en cada etapa de la experiencia del paciente.', search: 'Buscar cursos', all: 'Todos', core: 'Capacitación común', specializations: 'Especializaciones',
    lesson: 'Lección', lessonProgress: 'Progreso del curso', mark: 'Completar y continuar', previous: 'Anterior', next: 'Siguiente lección', knowledge: 'Comprobación de conocimiento',
    submit: 'Enviar respuestas', result: 'Tu resultado', passed: 'Aprobado', retry: 'Revisar e intentar de nuevo', explanation: 'Por qué es importante',
    admin: 'Progreso del equipo', adminSub: 'Supervisa avance, evaluaciones y preparación para certificación.', export: 'Exportar reporte', employee: 'Empleado', department: 'Departamento', lastActive: 'Última actividad', status: 'Estado',
    certificate: 'Certificado de Finalización', certifies: 'Se certifica que', certifiedText: 'ha completado satisfactoriamente los requisitos de capacitación fundamental de', download: 'Descargar expediente', print: 'Imprimir certificado',
    logout: 'Cerrar sesión', profile: 'Perfil', notifications: 'Notificaciones', preview: 'Prototipo · Contenido sujeto a aprobación final',
  }
};

const courses = [
  {
    id: 'foundations', icon: Building2, tone: 'teal', progress: 64, duration: '6h 30m', modules: 8, due: { en: 'Jul 26', es: '26 jul' },
    title: { en: 'Eastern Medical Foundations', es: 'Fundamentos de Eastern Medical' },
    description: { en: 'Organization, culture, locations, services and the complete patient journey.', es: 'Organización, cultura, sedes, servicios y el recorrido completo del paciente.' },
    lessons: [
      ['Welcome to Eastern Medical', 'Bienvenidos a Eastern Medical'],
      ['Our organization', 'Nuestra organización'],
      ['Mission, vision & values', 'Misión, visión y valores'],
      ['Locations & services', 'Sedes y servicios'],
      ['The patient journey', 'El recorrido del paciente'],
      ['Communication standards', 'Estándares de comunicación'],
      ['Team collaboration', 'Colaboración en equipo'],
      ['Foundation assessment', 'Evaluación de fundamentos'],
    ]
  },
  {
    id: 'compliance', icon: ShieldCheck, tone: 'blue', progress: 38, duration: '4h 10m', modules: 6, due: { en: 'Aug 02', es: '2 ago' },
    title: { en: 'HIPAA, Safety & Compliance', es: 'HIPAA, Seguridad y Cumplimiento' },
    description: { en: 'Protect patient information and apply safe, compliant workplace practices.', es: 'Protege la información del paciente y aplica prácticas seguras y conformes.' },
    lessons: [
      ['HIPAA essentials', 'Fundamentos de HIPAA'], ['Privacy in daily work', 'Privacidad en el trabajo diario'],
      ['Documentation standards', 'Estándares de documentación'], ['Security & incident reporting', 'Seguridad y reporte de incidentes'],
      ['Fraud prevention', 'Prevención de fraude'], ['Compliance assessment', 'Evaluación de cumplimiento']
    ]
  },
  {
    id: 'aesthetics', icon: Sparkles, tone: 'rose', progress: 0, duration: '42h', modules: 20, due: { en: 'Role assigned', es: 'Según el cargo' }, tag: 'specialization',
    title: { en: 'Eastern Medical Aesthetics Certification', es: 'Certificación en Eastern Medical Aesthetics' },
    description: { en: 'Twenty-module corporate certification covering the complete patient journey, treatments, systems, ethical recommendations and supervised competency.', es: 'Certificación corporativa de veinte módulos sobre recorrido del paciente, tratamientos, sistemas, recomendaciones éticas y competencia supervisada.' },
    lessons: [['Institutional identity','Identidad institucional'],['The complete patient journey','El recorrido completo del paciente'],['Endolift','Endolift'],['Botox','Botox'],['Dermal fillers','Fillers'],['Radiesse','Radiesse'],['Sculptra','Sculptra'],['PiXel8 RF','PiXel8 RF'],['Spectrum Laser','Spectrum Laser'],['Venus Legacy','Venus Legacy'],['PRF','PRF'],['Salmon DNA / polynucleotides','ADN de salmón / polinucleótidos'],['PDO threads','Hilos PDO'],['Medical weight management','Programa médico de pérdida de peso'],['Exceptional patient care','Atención excepcional al paciente'],['Ethical recommendations','Ventas éticas'],['Practice Fusion','Practice Fusion'],['Financing','Financiamiento'],['WhatsApp conversations','Conversaciones por WhatsApp'],['Interactive cases & certification','Casos interactivos y certificación']]
  },
  {
    id: 'insurance', icon: FileCheck2, logo: '/brand/seven-insurance.png', tone: 'amber', progress: 0, duration: '8h 20m', modules: 9, due: { en: 'Sep 01', es: '1 sep' }, tag: 'specialization',
    title: { en: 'Seven Insurance', es: 'Seven Insurance' },
    description: { en: 'ACA, Marketplace eligibility, Sherpa workflows, documentation and client service.', es: 'ACA, elegibilidad del Marketplace, Sherpa, documentación y servicio al cliente.' },
    lessons: [['Insurance foundations','Fundamentos de seguros'],['ACA & Marketplace','ACA y Marketplace'],['Eligibility & household','Elegibilidad y hogar'],['Enrollment periods','Períodos de inscripción'],['Required documents','Documentos requeridos'],['Sherpa workflow','Flujo de Sherpa'],['Maintenance & renewals','Mantenimiento y renovaciones'],['Compliance & fraud prevention','Cumplimiento y prevención de fraude'],['Final assessment','Evaluación final']]
  },
  {
    id: 'patient-care', icon: MessageSquareText, tone: 'blue', progress: 0, duration: '3h 30m', modules: 5, due: { en: 'Required', es: 'Obligatorio' },
    title: { en: 'Patient Care & Communication', es: 'Atención y Comunicación con Pacientes' },
    description: { en: 'Official answers, employee boundaries, service exclusions, insurance conversations and the Eastern care philosophy.', es: 'Respuestas oficiales, límites del colaborador, casos no atendidos, conversaciones de seguros y filosofía de atención Eastern.' },
    lessons: [['Patient frequently asked questions','Preguntas frecuentes de pacientes'],['What an employee can and cannot answer','Qué puede y qué no puede responder un colaborador'],['Patients we cannot safely serve','Casos que Eastern Medical no atiende'],['Out-of-network insurance','Seguros fuera de la red'],['Eastern patient-care philosophy','Filosofía de atención al paciente']]
  },
  {
    id: 'services-routing', icon: Route, tone: 'cyan', progress: 0, duration: '5h 30m', modules: 8, due: { en: 'Required', es: 'Obligatorio' },
    title: { en: 'Services & Lead Routing', es: 'Servicios y Canalización de Leads' },
    description: { en: 'Identify each need, document the lead and complete a warm handoff to the correct service, location or specialized team.', es: 'Identifica cada necesidad, documenta el lead y completa una transición acompañada al servicio, sede o equipo especializado correcto.' },
    lessons: [
      ['The Eastern service ecosystem','El ecosistema de servicios Eastern'],
      ['Seven Insurance leads','Leads de Seven Insurance'],
      ['Medical care and location routing','Medicina y canalización por sede'],
      ['Chronic Care coordination','Coordinación de Chronic Care'],
      ['Allergy and immunology services','Servicios de alergia e inmunología'],
      ['Aesthetics and wellness leads','Leads de estética y bienestar'],
      ['Eastern Medical Research','Eastern Medical Research'],
      ['Routing practicum','Práctica de canalización']
    ]
  },
  {
    id: 'systems', icon: BarChart3, tone: 'violet', progress: 20, duration: '7h 05m', modules: 11, due: { en: 'Aug 23', es: '23 ago' },
    title: { en: 'Systems & Digital Tools', es: 'Sistemas y Herramientas Digitales' },
    description: { en: 'Practice Fusion, Sherpa, Google Workspace, Teams, RingCentral, CRM and AI.', es: 'Practice Fusion, Sherpa, Google Workspace, Teams, RingCentral, CRM e IA.' },
    lessons: [['Digital workplace','Entorno digital'],['Practice Fusion','Practice Fusion'],['Sherpa','Sherpa'],['Google Workspace','Google Workspace'],['Microsoft Teams','Microsoft Teams'],['Zoom','Zoom'],['RingCentral','RingCentral'],['WhatsApp Business','WhatsApp Business'],['CRM','CRM'],['Responsible AI','IA responsable'],['Systems practicum','Práctica de sistemas']]
  },
  {
    id: 'calls', icon: Headphones, tone: 'cyan', progress: 0, duration: '5h 40m', modules: 7, due: { en: 'Aug 30', es: '30 ago' },
    title: { en: 'Call Center Excellence', es: 'Excelencia en Call Center' },
    description: { en: 'Scheduling, follow-up, recovery, scripts, tone and objection handling.', es: 'Citas, seguimiento, recuperación, guiones, tono y manejo de objeciones.' },
    lessons: [['The Eastern call standard','El estándar de llamadas Eastern'],['Appointment scheduling','Programación de citas'],['Follow-up calls','Llamadas de seguimiento'],['No-show recovery','Recuperación de ausencias'],['Patient recovery','Recuperación de pacientes'],['Objection handling','Manejo de objeciones'],['Call practicum','Práctica de llamadas']]
  },
  {
    id:'medicine',icon:Stethoscope,tone:'teal',progress:0,duration:'12h 30m',modules:12,due:{en:'Department required',es:'Obligatorio por departamento'},tag:'specialization',
    title:{en:'Medical Office · A to Z',es:'Oficina Médica · De la A a la Z'},
    description:{en:'The complete medical-office model for Front Desk, Medical Assistants, records, providers and office leadership.',es:'El modelo completo para Front Desk, asistentes médicos, records, proveedores y liderazgo de oficina.'},
    lessons:[['The complete office journey','El recorrido completo de la oficina'],['Front Desk check-in','Front Desk · Check-in'],['Insurance and copay verification','Verificación de seguro y copago'],['Medical Assistant workflow','Flujo del asistente médico'],['Provider support and clinical boundaries','Apoyo al proveedor y límites clínicos'],['Practice Fusion documentation','Documentación en Practice Fusion'],['Laboratory, imaging and referrals','Laboratorio, imágenes y referidos'],['Telemedicine operations','Operaciones de telemedicina'],['Transportation coordination','Coordinación de transportación'],['Front Desk check-out','Front Desk · Check-out'],['Records, follow-up and quality control','Records, seguimiento y Quality Control'],['Medical office certification','Certificación de oficina médica']]
  },
  {
    id:'allergy',icon:HeartPulse,tone:'blue',progress:0,duration:'8h 15m',modules:8,due:{en:'Role required',es:'Obligatorio por función'},tag:'specialization',
    title:{en:'Allergy & Immunology',es:'Alergia e Inmunología'},
    description:{en:'Provider-ordered testing, room workflow, objective documentation, safety response, immunotherapy and billing controls.',es:'Pruebas ordenadas por proveedor, flujo del salón, documentación objetiva, respuesta de seguridad, inmunoterapia y controles de facturación.'},
    lessons:[['Program purpose and clinical scope','Propósito del programa y alcance clínico'],['Pre-visit screening and preparation','Screening y preparación antes de la visita'],['Room setup and infection control','Preparación del salón y control de infecciones'],['Authorized test sequence','Secuencia autorizada de la prueba'],['Measurements, forms and photographs','Medidas, formularios y fotografías'],['Reaction and emergency response','Reacciones y respuesta de emergencia'],['Immunotherapy coordination','Coordinación de inmunoterapia'],['Billing controls and certification','Controles de facturación y certificación']]
  },
  {
    id:'billing',icon:ClipboardCheck,tone:'amber',progress:0,duration:'7h 30m',modules:8,due:{en:'Department required',es:'Obligatorio por departamento'},tag:'specialization',
    title:{en:'Billing & Authorizations',es:'Facturación y Autorizaciones'},
    description:{en:'Eligibility, documentation, authorizations, clean claims, denials and reconciliation.',es:'Elegibilidad, documentación, autorizaciones, claims limpios, denegaciones y conciliación.'},
    lessons:[['Revenue-cycle overview','Introducción al revenue cycle'],['Eligibility and benefits','Elegibilidad y beneficios'],['Prior authorizations','Autorizaciones previas'],['Documentation readiness','Preparación de documentación'],['Coding control','Control de codificación'],['Clean claim submission','Envío de claims limpios'],['Denials and corrections','Denegaciones y correcciones'],['Audit and reconciliation','Auditoría y conciliación']]
  },
  {
    id:'marketing',icon:WandSparkles,tone:'violet',progress:0,duration:'6h 20m',modules:7,due:{en:'Department required',es:'Obligatorio por departamento'},tag:'specialization',
    title:{en:'Marketing & Lead Operations',es:'Marketing y Operaciones de Leads'},
    description:{en:'Campaign governance, consent, attribution, CRM handoffs, measurement and conversion.',es:'Gobernanza de campañas, consentimiento, atribución, transiciones al CRM, medición y conversión.'},
    lessons:[['Eastern growth strategy','Estrategia de crecimiento Eastern'],['Campaign planning and approval','Planificación y aprobación de campañas'],['Lead consent and attribution','Consentimiento y atribución del lead'],['CRM intake and assignment','Ingreso y asignación en CRM'],['Call Center handoff','Transición al Call Center'],['Metrics, ROI and quality','Métricas, ROI y calidad'],['Closed-loop conversion practicum','Práctica de conversión de ciclo cerrado']]
  },
  {
    id:'hr',icon:Users,tone:'green',progress:0,duration:'6h 10m',modules:7,due:{en:'Department required',es:'Obligatorio por departamento'},tag:'specialization',
    title:{en:'Human Resources Operations',es:'Operaciones de Recursos Humanos'},
    description:{en:'Onboarding, Human Resources records, E-Verify timing, access, training assignments and offboarding.',es:'Onboarding, expedientes de Recursos Humanos, tiempos de E-Verify, accesos, asignaciones de capacitación y offboarding.'},
    lessons:[['Employee lifecycle','Ciclo de vida del empleado'],['Hiring records and E-Verify','Expediente de contratación y E-Verify'],['Onboarding and first-day readiness','Onboarding y preparación del primer día'],['Access and role permissions','Accesos y permisos por función'],['Training assignment and compliance','Asignación de capacitación y cumplimiento'],['Employee issues and escalation','Asuntos laborales y escalamiento'],['Offboarding and access closure','Offboarding y cierre de accesos']]
  }
];

const licenseRows = [];
const contractRows = [];
const staffRows = [];
const emmsoSourceStatus={source:'Airtable · EM-MSO',baseId:'',state:'not-loaded',message:'Protected operational data loads after access is verified.',syncedAt:'',tableCounts:{}};

const patientSteps = [
  ['Lead', 'Prospecto'], ['Call', 'Llamada'], ['Schedule', 'Cita'], ['Verify', 'Verificar'], ['Confirm', 'Confirmar'],
  ['Check-in', 'Registro'], ['Visit', 'Consulta'], ['Treatment', 'Tratamiento'], ['Follow-up', 'Seguimiento'], ['Retention', 'Retención']
];

const EASTERN_LOGO='/eastern-medical-logo.svg';
const EM_GROUP_LOGO='/brand/em-group.png';
const SEVEN_MARK='/brand/seven-insurance-mark.png';

function Brand({ compact=false }) {
  return <div className={`brand ${compact ? 'compact' : ''}`}>
    <img className="official-eastern-logo" src={EASTERN_LOGO} alt="Eastern Medical"/>
    <div className="brand-product"><strong>Eastern Medical</strong><span>ACADEMY</span></div>
  </div>;
}

function HubBrand({ compact=false }) {
  return <div className={`brand hub-brand ${compact ? 'compact' : ''}`}>
    <img className="official-em-group-logo" src={EM_GROUP_LOGO} alt="EM Group"/>
    <div className="brand-product"><strong>Operational Hub</strong><span>EM GROUP</span></div>
  </div>;
}

function Login({ onLogin, lang, setLang }) {
  const t=UI[lang];
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loginError,setLoginError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [photo,setPhoto]=useState('');
  const [photoError,setPhotoError]=useState('');
  const capturePhoto=event=>{const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>5*1024*1024){setPhotoError(lang==='en'?'Use a JPG, PNG or WebP photo smaller than 5 MB.':'Usa una foto JPG, PNG o WebP menor de 5 MB.');return}const reader=new FileReader();reader.onload=()=>{setPhoto(String(reader.result||''));setPhotoError('')};reader.onerror=()=>setPhotoError(lang==='en'?'The photo could not be read.':'No se pudo leer la foto.');reader.readAsDataURL(file)};
  const signIn=async event=>{
    event.preventDefault();
    setSubmitting(true);setLoginError('');
    const result=await onLogin({email,password,photoDataUrl:photo});
    if(!result?.ok)setLoginError(result?.error||(lang==='en'?'The email or password is incorrect, or the account is inactive.':'El correo o la contraseña es incorrecto, o la cuenta está inactiva.'));
    setSubmitting(false);
  };
  return <div className="login-shell">
    <section className="login-story">
      <div className="story-orb orb-one"/><div className="story-orb orb-two"/>
      <HubBrand />
      <div className="story-content">
        <span className="eyebrow"><Sparkles size={15}/> One place. Every operation.</span>
        <h1>{lang==='en' ? 'Clarity for every company, team and deadline.' : 'Claridad para cada compañía, equipo y fecha clave.'}</h1>
        <p>{lang==='en' ? 'A single operational workspace for compliance, Human Resources and organizational learning.' : 'Un solo espacio operativo para cumplimiento, Recursos Humanos y aprendizaje organizacional.'}</p>
        <div className="story-stats"><div><strong>6</strong><span>{lang==='en'?'Entities':'Entidades'}</span></div><div><strong>3</strong><span>{lang==='en'?'Core modules':'Módulos iniciales'}</span></div><div><strong>2</strong><span>{lang==='en'?'Languages':'Idiomas'}</span></div></div>
      </div>
      <div className="story-quote"><span>“</span><p>{lang==='en' ? 'Every patient should feel understood, protected and cared for.' : 'Cada paciente debe sentirse comprendido, protegido y atendido.'}</p></div>
    </section>
    <section className="login-panel">
      <button className="language-pill" onClick={()=>setLang(lang==='en'?'es':'en')}><Languages size={17}/>{lang==='en'?'Español':'English'}</button>
      <form className="login-card" onSubmit={signIn}>
        <div className="mobile-brand"><HubBrand compact/></div>
        <span className="secure-label"><LockKeyhole size={14}/> {lang==='en'?'Secure operations portal':'Portal seguro de operaciones'}</span>
        <h2>{lang==='en'?'Welcome to the Hub':'Bienvenido al Hub'}</h2><p>{lang==='en'?'Sign in to manage your organization.':'Inicia sesión para gestionar tu organización.'}</p>
        <div className={`employee-photo-signin ${photo?'ready':''}`}><div className="employee-photo-preview">{photo?<img src={photo} alt={lang==='en'?'Employee sign-in':'Foto del colaborador'}/>:<Camera size={28}/>}</div><div><strong>{lang==='en'?'Academy profile photo · optional':'Foto de perfil de Academy · opcional'}</strong><p>{lang==='en'?'Add a current headshot for Academy records and certificates, or complete it later.':'Agrega una foto actual para el expediente y certificados de Academy, o complétala después.'}</p><label><Camera size={16}/>{photo?(lang==='en'?'Retake / replace':'Repetir / reemplazar'):(lang==='en'?'Add photo':'Agregar foto')}<input type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={capturePhoto}/></label></div></div>
        {photoError&&<p className="login-error"><AlertTriangle size={15}/>{photoError}</p>}
        <label>{t.email}<input value={email} onChange={event=>{setEmail(event.target.value);setLoginError('')}} placeholder="name@company.com" type="email" autoComplete="email" required/></label>
        <label>{t.password}<input value={password} onChange={event=>{setPassword(event.target.value);setLoginError('')}} type="password" autoComplete="current-password" required/></label>
        <div className="login-row"><span className="remember"><ShieldCheck size={14}/> {lang==='en'?'Server-verified account':'Cuenta verificada por el servidor'}</span></div>
        {loginError&&<p className="login-error"><AlertTriangle size={15}/>{loginError}</p>}
        <button className="primary full" type="submit" disabled={submitting}>{submitting?(lang==='en'?'Signing in…':'Ingresando…'):t.enter}<ArrowRight size={18}/></button>
        <small>{lang==='en'?'Authorized employees only · Activity is recorded':'Solo empleados autorizados · La actividad es registrada'}</small>
      </form>
    </section>
  </div>;
}

function Sidebar({ page, setPage, lang, onLogout, mobile, close, academyOnly=false, canAccessCorporate=false, canAccessAdmin=false, canAccessPage=()=>true, session }) {
  const t=UI[lang];
  const userName=session?.name||'Admin';
  const userInitials=userName.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'AD';
  const userRole=session?.role==='owner'?(lang==='en'?'Executive':'Ejecutivo'):session?.role==='admin'?(lang==='en'?'Administrator':'Administrador'):(lang==='en'?'Employee':'Empleado');
  const academyContext=academyOnly||['academy','learning','systems','certificates','team'].includes(page);
  const entityContext=parseEntityPage(page);
  const workspaceItems=[
    {id:'hub', label:lang==='en'?'Dashboard':'Dashboard', icon:LayoutDashboard},
  ];
  const entityItems=['medical','care305','aesthetics','seven','research'].map(key=>({
    id:entityPage(key,'overview'),
    label:entityDefinitions[key].name,
    icon:entityDefinitions[key].icon,
  }));
  const moduleItems=[
    {id:'leads', label:lang==='en'?'All Leads':'Todos los Leads', icon:Target},
    {id:'protocols', label:lang==='en'?'Operational Protocols':'Protocolos Operacionales', icon:FileCheck2},
    {id:'licenses', label:lang==='en'?'Licenses':'Licencias', icon:FileText},
    {id:'credentialing', label:lang==='en'?'Credentialing':'Credencialización', icon:ShieldCheck},
    {id:'contracting', label:lang==='en'?'Contracting':'Contratos', icon:ClipboardCheck},
    {id:'it', label:'IT', icon:Cpu},
    {id:'staff', label:lang==='en'?'Human Resources':'Recursos Humanos', icon:Users},
  ];
  const academyDoor={id:'academy',label:'Eastern Medical Academy',icon:GraduationCap};
  const academyItems=[
    {id:'academy',label:lang==='en'?'Academy overview':'Resumen de academia',icon:GraduationCap},
    {id:'learning',label:lang==='en'?'Course library':'Catálogo de cursos',icon:BookOpen},
    {id:'systems',label:lang==='en'?'Systems training':'Capacitación de sistemas',icon:Bot},
    {id:'certificates',label:lang==='en'?'Certificates':'Certificados',icon:Award},
    {id:'team',label:lang==='en'?'Team progress':'Progreso del equipo',icon:TrendingUp},
  ];
  const adminItems=[
    ...(canAccessPage('users')?[{id:'users',label:lang==='en'?'Users':'Usuarios',icon:UserRound}]:[]),
  ];
  const navigate=id=>{setPage(id);close?.()};
  if(entityContext){
    const {definition}=entityContext;const EntityIcon=definition.icon;const items=entityNavItems(definition,lang);
    return <aside className={`sidebar entity-context-sidebar ${definition.tone} ${mobile?'mobile':''}`}>
      <div className="sidebar-top"><button className="module-return" onClick={()=>navigate('hub')}><HubBrand compact/><span><ArrowLeft size={15}/>{lang==='en'?'Return to Operational Hub':'Regresar a Operational Hub'}</span></button>{mobile&&<button className="icon-btn" onClick={close}><X/></button>}</div>
      <nav><div className="academy-context-title entity-context-title"><span className={`module-symbol ${definition.logo?'entity-logo-symbol':''}`}>{definition.logo?<img src={definition.logo} alt={`${definition.name} logo`}/>:<EntityIcon size={18}/>}</span><div><small>{lang==='en'?'CURRENT ENTITY':'ENTIDAD ACTUAL'}</small><strong>{definition.name}</strong></div></div><span className="nav-label nav-section-label">{lang==='en'?'Inside this entity':'Dentro de esta entidad'}</span>{items.map(({id,label,icon:Icon})=><button key={id} className={`entity-nav ${page===id?'active':''}`} onClick={()=>navigate(id)}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-help"><CircleHelp size={22}/><strong>{lang==='en'?'Entity navigation':'Navegación de la entidad'}</strong><p>{lang==='en'?'Everything in this menu belongs to the entity you opened.':'Todo lo que aparece en este menú pertenece a la entidad que abriste.'}</p><button onClick={()=>navigate(entityPage(definition.key,'resources'))}>{lang==='en'?'Open resources':'Abrir recursos'}</button></div>
      <div className="sidebar-user"><div className="avatar">{userInitials}</div><div><strong>{userName}</strong><span>{userRole}</span></div><button onClick={onLogout} title={t.logout}><LogOut size={17}/></button></div>
    </aside>;
  }
  return <aside className={`sidebar ${mobile?'mobile':''}`}>
    <div className={`sidebar-top ${academyContext?'academy-context-top':''}`}>{academyContext?(academyOnly?<div className="academy-only-brand"><HubBrand compact/><span><LockKeyhole size={14}/>{lang==='en'?'Academy-only access':'Acceso exclusivo a Academy'}</span></div>:<button className="module-return" onClick={()=>navigate('hub')}><HubBrand compact/><span><ArrowLeft size={15}/>{lang==='en'?'Return to Operational Hub':'Regresar a Operational Hub'}</span></button>):<HubBrand compact/>}{mobile&&<button className="icon-btn" onClick={close}><X/></button>}</div>
    <nav>
      {academyContext?<><div className="academy-context-title"><span className="module-symbol"><HeartPulse size={18}/></span><div><small>{lang==='en'?'CURRENT MODULE':'MÓDULO ACTUAL'}</small><strong>Eastern Medical Academy</strong></div></div><span className="nav-label nav-section-label">{lang==='en'?'Academy navigation':'Navegación de Academy'}</span>{academyItems.filter(item=>canAccessPage(item.id)).map(({id,label,icon:Icon})=><button key={id} className={`academy-nav ${page===id?'active':''}`} onClick={()=>navigate(id)}><Icon size={18}/><span>{label}</span></button>)}</>:<>
        <span className="nav-label">{lang==='en'?'Workspace':'Espacio de trabajo'}</span>
        {workspaceItems.filter(item=>canAccessPage(item.id)).map(({id,label,icon:Icon})=><button key={id} className={`hub-nav-door ${page===id?'active':''}`} onClick={()=>navigate(id)}><span className="sidebar-nav-icon"><Icon size={18}/></span><span>{label}</span><ChevronRight className="nav-door-arrow" size={15}/></button>)}
        {entityItems.some(item=>canAccessPage(item.id))&&<span className="nav-label nav-section-label">{lang==='en'?'Organizations':'Entidades'}</span>}
        {entityItems.filter(item=>canAccessPage(item.id)).map(({id,label,icon:Icon})=><button key={id} className={`hub-nav-door entity-door-nav ${page===id?'active':''}`} onClick={()=>navigate(id)}><span className="sidebar-nav-icon"><Icon size={18}/></span><span>{label}</span><ChevronRight className="nav-door-arrow" size={15}/></button>)}
        {canAccessPage('academy')&&<><span className="nav-label nav-section-label">{lang==='en'?'Learning':'Aprendizaje'}</span><button className={`hub-nav-door academy-door-nav ${page===academyDoor.id?'active':''}`} onClick={()=>navigate(academyDoor.id)}><span className="sidebar-nav-icon"><academyDoor.icon size={18}/></span><span>{academyDoor.label}</span><ChevronRight className="nav-door-arrow" size={15}/></button></>}
        {moduleItems.some(item=>canAccessPage(item.id))&&<span className="nav-label nav-section-label">{lang==='en'?'Shared operations':'Operaciones compartidas'}</span>}
        {moduleItems.filter(item=>canAccessPage(item.id)).map(({id,label,icon:Icon})=><button key={id} className={`hub-nav-door ${page===id?'active':''}`} onClick={()=>navigate(id)}><span className="sidebar-nav-icon"><Icon size={18}/></span><span>{label}</span><ChevronRight className="nav-door-arrow" size={15}/></button>)}
        {canAccessCorporate&&<><span className="nav-label nav-section-label corporate-nav-label">{lang==='en'?'Executive workspace':'Espacio ejecutivo'}</span><button className={`corporate-nav ${page==='corporate'?'active':''}`} onClick={()=>navigate('corporate')}><span className="sidebar-nav-icon"><LockKeyhole size={17}/></span><span>Corporate</span><b>{lang==='en'?'EXECUTIVE':'EJECUTIVOS'}</b></button></>}
        {!!adminItems.length&&<span className="nav-label nav-section-label">{lang==='en'?'Administration':'Administración'}</span>}
        {adminItems.map(({id,label,icon:Icon})=><button key={id} className={`hub-nav-door admin-nav ${page===id?'active':''}`} onClick={()=>navigate(id)}><span className="sidebar-nav-icon"><Icon size={17}/></span><span>{label}</span><ChevronRight className="nav-door-arrow" size={15}/></button>)}
      </>}
    </nav>
    <div className="sidebar-user"><div className="avatar">{userInitials}</div><div><strong>{userName}</strong><span>{userRole}</span></div><button onClick={onLogout} title={t.logout}><LogOut size={17}/></button></div>
  </aside>
}

function AppNavigationBar({ lang, page, canBack, canForward, onBack, onForward }) {
  const isEn = lang === 'en';
  const labels = {
    hub: isEn ? 'Dashboard' : 'Dashboard', leads: isEn ? 'Lead Center' : 'Centro de Leads', protocols: isEn ? 'Operational Protocols' : 'Protocolos Operacionales',
    licenses: isEn ? 'Licenses' : 'Licencias', 'doctor-licenses': isEn ? 'Doctor Licenses' : 'Licencias de doctores', credentialing: isEn ? 'Credentialing' : 'Credencialización',
    contracting: isEn ? 'Contracting' : 'Contratos', it: 'IT', 'research-agreements': isEn ? 'Research Study Agreements' : 'Acuerdos de Estudios de Research', staff: isEn ? 'Human Resources' : 'Recursos Humanos', users: isEn ? 'Users' : 'Usuarios', roadmap: 'Roadmap',
    academy: isEn ? 'Academy' : 'Academy', learning: isEn ? 'Course library' : 'Catálogo de cursos', systems: isEn ? 'Systems training' : 'Capacitación de sistemas',
    certificates: isEn ? 'Certificates' : 'Certificados', team: isEn ? 'Team progress' : 'Progreso del equipo', corporate: 'Corporate',
  };
  const entity = parseEntityPage(page);
  const location = entity ? `${entity.definition.name} · ${entity.section}` : labels[page] || page;
  return <nav className="app-navigation-bar" aria-label={isEn ? 'Application navigation controls' : 'Controles de navegación de la aplicación'}>
    <div className="app-history-controls">
      <button type="button" onClick={onBack} disabled={!canBack} title={isEn ? 'Back' : 'Atrás'} aria-label={isEn ? 'Back' : 'Atrás'}><ArrowLeft size={17}/><span>{isEn ? 'Back' : 'Atrás'}</span></button>
      <button type="button" onClick={onForward} disabled={!canForward} title={isEn ? 'Next' : 'Siguiente'} aria-label={isEn ? 'Next' : 'Siguiente'}><span>{isEn ? 'Next' : 'Siguiente'}</span><ArrowRight size={17}/></button>
    </div>
    <div className="app-navigation-location"><span>{isEn ? 'CURRENT LOCATION' : 'UBICACIÓN ACTUAL'}</span><strong>{location}</strong></div>
  </nav>;
}

function LanguageSelect({lang,setLang,className=''}) {
  return <label className={`language-select ${className}`}><Languages size={17}/><span>{lang==='en'?'Language':'Idioma'}</span><select aria-label={lang==='en'?'Select language':'Seleccionar idioma'} value={lang} onChange={event=>setLang(event.target.value)}><option value="en">English</option><option value="es">Español</option></select><ChevronDown size={14}/></label>;
}

function Header({ lang,setLang,onMenu,onNavigate,currentPage='',canAccessCorporate=false,canAccessAdmin=false,canAccessPage=()=>true }) {
  const t=UI[lang]; const [searchOpen,setSearchOpen]=useState(false); const [noticeOpen,setNoticeOpen]=useState(false); const [query,setQuery]=useState(''); const [sectionResults,setSectionResults]=useState([]);
  const searchItems=lang==='en'?[{label:'Dashboard',page:'hub'},{label:'IT',page:'it'},{label:'Eastern Medical',page:'medical-overview'},{label:'305 Medical Care',page:'care305-overview'},{label:'Eastern Medical Aesthetics',page:'aesthetics-overview'},{label:'Seven Insurance',page:'seven-overview'},{label:'Eastern Medical Research',page:'research-overview'},{label:'Eastern Medical Academy',page:'academy'},{label:'All Leads',page:'leads'},{label:'Operational Protocols',page:'protocols'},{label:'License Management',page:'licenses'},{label:'Doctor Licenses',page:'doctor-licenses'},{label:'Provider Credentialing',page:'credentialing'},{label:'Contracting',page:'contracting'},{label:'Human Resources',page:'staff'},{label:'Administration Users',page:'users'}]:[{label:'Dashboard',page:'hub'},{label:'IT',page:'it'},{label:'Eastern Medical',page:'medical-overview'},{label:'305 Medical Care',page:'care305-overview'},{label:'Eastern Medical Aesthetics',page:'aesthetics-overview'},{label:'Seven Insurance',page:'seven-overview'},{label:'Eastern Medical Research',page:'research-overview'},{label:'Eastern Medical Academy',page:'academy'},{label:'Todos los Leads',page:'leads'},{label:'Protocolos Operacionales',page:'protocols'},{label:'Gestión de Licencias',page:'licenses'},{label:'Licencias de doctores',page:'doctor-licenses'},{label:'Credencialización médica',page:'credentialing'},{label:'Contratos',page:'contracting'},{label:'Recursos Humanos',page:'staff'},{label:'Usuarios de Administración',page:'users'}];
  if(canAccessCorporate)searchItems.push({label:lang==='en'?'Corporate Strategy Room':'Corporate · Sala de Estrategia',page:'corporate'});
  const results=searchItems.filter(item=>canAccessPage(item.page)&&item.label.toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{
    const shortcut=event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setSearchOpen(true);globalThis.setTimeout(()=>document.querySelector('.top-search input')?.focus(),0)}};
    globalThis.addEventListener('keydown',shortcut);return()=>globalThis.removeEventListener('keydown',shortcut);
  },[]);
  useEffect(()=>{setQuery('');setSectionResults([]);setSearchOpen(false)},[currentPage]);
  useEffect(()=>{
    const needle=query.trim().toLocaleLowerCase();
    if(!searchOpen||needle.length<2){setSectionResults([]);return}
    const root=document.querySelector('.main-shell > main');
    if(!root){setSectionResults([]);return}
    const candidates=[...root.querySelectorAll('table tbody tr, details > summary, [data-search-entry], article, h1, h2, h3')];
    const seen=new Set();const matches=[];
    for(const candidate of candidates){
      if(candidate.offsetParent===null)continue;
      const target=candidate.matches('h1,h2,h3')&&candidate.closest('article')?candidate.closest('article'):candidate;
      const raw=String(target.textContent||'').replace(/\s+/g,' ').trim();
      if(raw.length<2||!raw.toLocaleLowerCase().includes(needle)||seen.has(target))continue;
      seen.add(target);
      const heading=target.matches('tr')?'':target.querySelector?.('h1,h2,h3,h4,strong')?.textContent?.trim();
      const index=raw.toLocaleLowerCase().indexOf(needle);const start=Math.max(0,index-42);const excerpt=`${start?'…':''}${raw.slice(start,start+170)}${raw.length>start+170?'…':''}`;
      matches.push({target,label:heading||raw.slice(0,92),excerpt});
      if(matches.length===8)break;
    }
    setSectionResults(matches);
  },[query,searchOpen,currentPage]);
  const openSectionResult=result=>{
    const details=result.target.closest?.('details');if(details)details.open=true;
    result.target.scrollIntoView({behavior:'smooth',block:'center'});
    result.target.classList.add('section-search-hit');
    globalThis.setTimeout(()=>result.target.classList.remove('section-search-hit'),1800);
    setQuery('');setSearchOpen(false);
  };
  return <header className="topbar">
    <button className="menu-btn" onClick={onMenu}><Menu/></button>
    <div className="topbar-brand"><img src={EM_GROUP_LOGO} alt="EM Group"/><span>Operational Hub</span></div>
    <div className="global-search"><div className={`top-search ${searchOpen?'focused':''}`}><Search size={17}/><input value={query} onFocus={()=>setSearchOpen(true)} onChange={e=>{setQuery(e.target.value);setSearchOpen(true)}} placeholder={lang==='en'?'Search this section or navigate…':'Buscar aquí o navegar…'}/><kbd>⌘ K</kbd></div>{searchOpen&&<><button className="search-scrim" aria-label="Close search" onClick={()=>setSearchOpen(false)}/><div className="search-popover section-aware-search">{query.trim().length>=2&&<><span>{lang==='en'?'IN THIS SECTION':'EN ESTA SECCIÓN'}</span>{sectionResults.map((item,i)=><button className="section-result" key={`section-${i}`} onClick={()=>openSectionResult(item)}><Search size={14}/><span><strong>{item.label}</strong><small>{item.excerpt}</small></span><b>{lang==='en'?'Open':'Ver'}</b></button>)}</>}<span>{lang==='en'?'AUTHORIZED MODULES':'MÓDULOS AUTORIZADOS'}</span>{results.map((item,i)=><button key={`${item.page}-${item.label}`} onClick={()=>{setQuery('');setSearchOpen(false);onNavigate(item.page)}}><ArrowRight size={14}/><strong>{item.label}</strong><small>0{i+1}</small></button>)}{!results.length&&!sectionResults.length&&<p>{lang==='en'?'No matching information in this section':'No hay información coincidente en esta sección'}</p>}</div></>}</div>
    <div className="top-actions"><LanguageSelect lang={lang} setLang={setLang}/><div className="notification-wrap"><button className={`notify ${noticeOpen?'active':''}`} title={t.notifications} onClick={()=>setNoticeOpen(!noticeOpen)}><Bell size={19}/><i/></button>{noticeOpen&&<div className="notification-panel"><div><span>{lang==='en'?'NOTIFICATIONS':'NOTIFICACIONES'}</span><strong>{lang==='en'?'Authorized items that need attention':'Asuntos autorizados que requieren atención'}</strong></div>{canAccessPage('licenses')&&<button onClick={()=>onNavigate('licenses')}><AlertTriangle size={17}/><p><strong>{lang==='en'?'License renewal approaching':'Renovación de licencia próxima'}</strong><span>Seven Insurance · 26 {lang==='en'?'days':'días'}</span></p></button>}{canAccessPage('doctor-licenses')&&<button onClick={()=>onNavigate('doctor-licenses')}><UserRound size={17}/><p><strong>{lang==='en'?'Doctor license review pending':'Revisión de licencia médica pendiente'}</strong><span>2 {lang==='en'?'provider records':'expedientes de proveedores'}</span></p></button>}{canAccessPage('academy')&&<button onClick={()=>onNavigate('team')}><GraduationCap size={17}/><p><strong>{lang==='en'?'Training follow-up':'Seguimiento de capacitación'}</strong><span>{lang==='en'?'Open your Academy record':'Abrir tu expediente de Academy'}</span></p></button>}</div>}</div><div className="avatar small">AD</div></div>
  </header>
}

function Metric({icon:Icon,label,value,delta,tone}) { return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{delta}</small></div></div> }

function HubDashboard({lang,setPage,operationalData,canAccessCorporate=false,canAccessAdmin=false,canAccessPage=()=>true,canAccessApplication=()=>true}) {
  const isEn=lang==='en';
  const providers=operationalData?.providers||[];
  const contracts=operationalData?.contracts||[];
  const licenses=operationalData?.licenses||[];
  const sourceStatus=operationalData?.status||emmsoSourceStatus;
  const attachmentCount=providers.reduce((sum,row)=>sum+(row.sourceAttachments?.length||0),0)+contracts.reduce((sum,row)=>sum+(row.attachmentCount||row.attachments?.length||0),0)+licenses.reduce((sum,row)=>sum+(row.attachments?.length||0),0);
  const leads=[];
  const openLeads=(service,title)=>{sessionStorage.setItem('operational-hub-lead-filter',service);sessionStorage.setItem('operational-hub-business-title',title);setPage('leads')};
  const entityCards=[
    {key:'seven',className:'insurance',icon:ShieldCheck,logo:SEVEN_MARK,label:isEn?'INSURANCE ENTITY':'ENTIDAD DE SEGUROS',name:'Seven Insurance',description:isEn?'Licensed operations, departments, coverage services, team, leads and resources.':'Operaciones licenciadas, departamentos, servicios, equipo, leads y recursos.'},
    {key:'aesthetics',className:'aesthetics',icon:Sparkles,label:isEn?'AESTHETICS ENTITY':'ENTIDAD DE ESTÉTICA',name:'Eastern Medical Aesthetics',description:isEn?'Departments, aesthetic services, clinical roles, leads and operating resources.':'Departamentos, servicios estéticos, funciones clínicas, leads y recursos.'},
    {key:'medical',className:'medicine',icon:Stethoscope,logo:EASTERN_LOGO,label:isEn?'MEDICAL ENTITY':'ENTIDAD MÉDICA',name:'Eastern Medical',description:isEn?'Coral Way, Hialeah and Fort Myers with their services, teams, leads and records.':'Coral Way, Hialeah y Fort Myers con sus servicios, equipos, leads y registros.'},
    {key:'care305',className:'care305',icon:HeartPulse,label:isEn?'INDEPENDENT MEDICAL ENTITY':'ENTIDAD MÉDICA INDEPENDIENTE',name:'305 Medical Care',description:isEn?'Its own medical operations, services, Human Resources, leads, records and compliance.':'Sus propias operaciones médicas, servicios, Recursos Humanos, leads, expedientes y cumplimiento.'},
    {key:'research',className:'research',icon:Target,label:isEn?'CLINICAL RESEARCH ENTITY':'ENTIDAD DE INVESTIGACIÓN CLÍNICA',name:'Eastern Medical Research',description:isEn?'Studies, recruitment, protocols, coordinators, leads and regulatory resources.':'Estudios, reclutamiento, protocolos, coordinadores, leads y recursos regulatorios.'},
  ];
  const operationalModules=[
    {page:'leads',icon:UserPlus,tone:'leads',name:isEn?'Lead Center':'Centro de Leads',description:isEn?'Capture, assign and follow every opportunity.':'Captura, asigna y da seguimiento a cada oportunidad.',value:String(leads.length)},
    {page:'licenses',icon:FileCheck2,tone:'licenses',name:isEn?'Licensing':'Licencias',description:isEn?'Doctor, occupational, AHCA and compliance records.':'Licencias médicas, ocupacionales, AHCA y cumplimiento.',value:String(licenses.length)},
    {page:'contracting',icon:ClipboardCheck,tone:'contracting',name:'Contracting',description:isEn?'Carrier contracts, products and source files.':'Contratos, productos y archivos fuente por aseguradora.',value:String(contracts.length)},
    {page:'staff',icon:Users,tone:'staff',name:isEn?'Human Resources':'Recursos Humanos',description:isEn?'Employee records grouped by position, documents and completion status.':'Expedientes por posición, documentos y estado de completitud.',value:String(providers.length)},
    {page:'protocols',icon:Route,tone:'protocols',name:isEn?'Operational Protocols':'Protocolos Operacionales',description:isEn?'Scopes of work and step-by-step procedures.':'Scopes of work y procedimientos paso a paso.',value:isEn?'OPEN':'ABRIR'},
    {page:'users',icon:LockKeyhole,tone:'admin',name:isEn?'Administration':'Administración',description:isEn?'Users, access by module and implementation roadmap.':'Usuarios, acceso por módulo y roadmap de implementación.',value:isEn?'ADMIN':'ADMIN'},
  ];
  const visibleEntityCards=entityCards.filter(item=>canAccessPage(entityPage(item.key)));
  const visibleOperationalModules=operationalModules.filter(item=>canAccessPage(item.page));
  const visibleStatusSections=['contracting','doctor-licenses','licenses'].filter(canAccessPage);
  const leadDoors=[
    {service:'insurance',name:'Seven Insurance',icon:ShieldCheck},
    {service:'aesthetics',name:'Eastern Medical Aesthetics',icon:Sparkles},
    {service:'medicine',name:'Eastern Medical',icon:Stethoscope},
    {service:'care305',name:'305 Medical Care',icon:HeartPulse},
  ];
  return <div className="page hub-page hub-dashboard-page">
    <div className="hub-hero">
      <div><span className="eyebrow">{isEn?'OPERATIONAL HUB · EXECUTIVE HOME':'OPERATIONAL HUB · INICIO EJECUTIVO'}</span><h1>{isEn?'Operational Dashboard':'Dashboard Operativo'}</h1><p>{isEn?'Enter an entity first, or open a shared operational tool from this command center.':'Entra primero a una entidad o abre una herramienta operacional compartida desde este centro de control.'}</p></div>
      <div className="hub-entry-guidance"><Building2/><span><strong>{visibleEntityCards.length} {isEn?'authorized operating entities':'entidades operativas autorizadas'}</strong><small>{isEn?'Only your assigned sections are shown.':'Se muestran únicamente tus secciones asignadas.'}</small></span></div>
    </div>

    {!!visibleEntityCards.length&&<section className="primary-business-launcher"><div className="primary-business-heading"><span>{isEn?'AUTHORIZED ORGANIZATIONS':'ORGANIZACIONES AUTORIZADAS'}</span><h2>{isEn?'Enter an assigned entity':'Entra a una entidad asignada'}</h2><p>{isEn?'Each door opens only the entity workspaces authorized for this account.':'Cada puerta abre únicamente los espacios de entidades autorizados para esta cuenta.'}</p></div><div className="primary-business-grid entity-door-grid five-entity-grid">{visibleEntityCards.map(({key,className,icon:Icon,logo,label,name,description})=><button className={className} key={key} onClick={()=>setPage(entityPage(key))}><span className={`primary-business-icon ${logo?'entity-brand-logo':''}`}>{logo?<img src={logo} alt={`${name} logo`}/>:<Icon/>}</span><div><small>{label}</small><strong>{name}</strong><p>{description}</p><b>{isEn?'Enter entity':'Entrar a la entidad'}<ArrowRight/></b></div></button>)}</div></section>}

    {canAccessPage('academy')&&<section className="academy-hub-feature"><div className="academy-hub-mark"><GraduationCap/></div><div className="academy-hub-copy"><span>{isEn?'LEARNING & DEVELOPMENT':'APRENDIZAJE Y DESARROLLO'}</span><h2>Eastern Medical Academy</h2><p>{isEn?'The Academy is not an operating entity. It is the permanent learning center for courses, systems, certifications and role-based training across the organization.':'La academia no es una entidad operativa. Es el centro permanente de aprendizaje para cursos, sistemas, certificaciones y capacitación por puesto de toda la organización.'}</p></div><div className="academy-hub-actions"><button className="academy-main-action" onClick={()=>setPage('academy')}>{isEn?'Open Academy':'Abrir Academy'}<ArrowRight/></button><button onClick={()=>setPage('learning')}><BookOpen/>{isEn?'Course catalog':'Catálogo'}</button><button onClick={()=>setPage('systems')}><Bot/>{isEn?'Systems':'Sistemas'}</button><button onClick={()=>setPage('certificates')}><Award/>{isEn?'Certificates':'Certificados'}</button></div></section>}

    <ApplicationEcosystem lang={lang} canAccessApplication={canAccessApplication}/>

    {canAccessCorporate&&<section className="corporate-dashboard-entry"><span className="corporate-entry-icon"><LockKeyhole/></span><div><small>{isEn?'PRIVATE EXECUTIVE WORKSPACE':'ESPACIO EJECUTIVO PRIVADO'}</small><h2>Corporate</h2><p>{isEn?'Ideas, blueprints, strategies and actions reserved exclusively for authorized executives.':'Ideas, blueprints, estrategias y acciones reservadas exclusivamente para ejecutivos autorizados.'}</p></div><button onClick={()=>setPage('corporate')}>{isEn?'Open executive strategy room':'Abrir sala ejecutiva'}<ArrowRight/></button></section>}

    <div className="hub-metrics">
      <Metric icon={Building2} label={isEn?'Operating entities':'Entidades operativas'} value="5" delta={isEn?'Five structured workspaces':'Cinco espacios estructurados'} tone="teal"/>
      <Metric icon={ClipboardCheck} label={isEn?'Insurance agreements':'Contratos de seguros'} value={String(contracts.length)} delta={isEn?'Mapped from EM-MSO':'Mapeados desde EM-MSO'} tone="blue"/>
      <Metric icon={Users} label={isEn?'Provider profiles':'Perfiles de proveedores'} value={String(providers.length)} delta={isEn?'Protected fields excluded':'Campos protegidos excluidos'} tone="green"/>
      <Metric icon={FileText} label={isEn?'Mapped source files':'Archivos fuente mapeados'} value={String(attachmentCount)} delta={isEn?'Contracts and credentials':'Contratos y credenciales'} tone="amber"/>
    </div>

    {!!visibleOperationalModules.length&&<section className="hub-operations-section"><div className="section-heading hub-section-heading"><div><span>{isEn?'AUTHORIZED OPERATIONAL TOOLS':'HERRAMIENTAS OPERACIONALES AUTORIZADAS'}</span><h2>{isEn?'Daily command center':'Centro de control diario'}</h2><p>{isEn?'Your assigned shared tools are available here without duplicating entity information.':'Tus herramientas compartidas asignadas están disponibles aquí sin duplicar información de las entidades.'}</p></div></div><div className="hub-module-grid">{visibleOperationalModules.map(({page,icon:Icon,tone,name,description,value})=><button key={page} onClick={()=>setPage(page)}><span className={`launcher-icon ${tone}`}><Icon/></span><span><strong>{name}</strong><small>{description}</small></span><b>{value}</b><ChevronRight/></button>)}</div></section>}

    <div className="hub-dashboard-lower">
      {!!visibleStatusSections.length&&<section className="card attention-card hub-data-status">
        <div className="panel-heading"><div><span>{isEn?'DATA & WORKFLOW STATUS':'ESTADO DE DATOS Y FLUJOS'}</span><h2>{isEn?'Operational priorities':'Prioridades operacionales'}</h2></div>{canAccessAdmin&&<button onClick={()=>setPage('it')}>{isEn?'Open IT roadmap':'Abrir roadmap en IT'}<ArrowRight size={15}/></button>}</div>
        <div className="hub-status-list">{canAccessPage('contracting')&&<button onClick={()=>setPage('contracting')}><span className="status-symbol ready"><ClipboardCheck/></span><span><strong>{isEn?'Insurance contracting library':'Biblioteca de contratos de seguros'}</strong><small>{contracts.length} / {sourceStatus.discovered?.contracts||contracts.length} {isEn?'verified carrier records currently available':'registros verificados disponibles actualmente'}</small></span><ChevronRight/></button>}{canAccessPage('doctor-licenses')&&<button onClick={()=>setPage('doctor-licenses')}><span className="status-symbol ready"><Users/></span><span><strong>{isEn?'Provider credential profiles':'Perfiles de credenciales médicas'}</strong><small>{providers.length} / {sourceStatus.discovered?.providers||providers.length} {isEn?'verified provider records currently available':'registros verificados disponibles actualmente'}</small></span><ChevronRight/></button>}{canAccessPage('licenses')&&<button onClick={()=>setPage('licenses')}><span className={`status-symbol ${sourceStatus.state==='connected'?'ready':'waiting'}`}><FileCheck2/></span><span><strong>{isEn?'Protected licensing import':'Importación protegida de licencias'}</strong><small>{sourceStatus.state==='connected'?(isEn?'EM-MSO protected synchronization is active.':'La sincronización protegida EM-MSO está activa.'):(isEn?'EM-MSO API permission is still required for every license and attachment.':'Aún se requiere permiso API de EM-MSO para importar cada licencia y adjunto.')}</small></span><ChevronRight/></button>}</div>
      </section>}

      {canAccessPage('leads')&&<section className="dashboard-leads card"><div className="panel-heading"><div><span>{isEn?'CENTRAL LEAD INTAKE':'ENTRADA CENTRAL DE LEADS'}</span><h2>{isEn?'Send each opportunity to the right entity':'Canaliza cada oportunidad a la entidad correcta'}</h2></div><button onClick={()=>setPage('leads')}>{isEn?'View all leads':'Ver todos los leads'}<ArrowRight size={15}/></button></div><div className="dashboard-lead-categories entity-lead-categories">{leadDoors.map(({service,name,icon:Icon})=>{const count=leads.filter(item=>item.service===service).length;return <button key={service} onClick={()=>openLeads(service,name)}><Icon/><span><strong>{name}</strong><small>{count} {isEn?(count===1?'lead':'leads'):(count===1?'lead':'leads')}</small></span><ChevronRight/></button>})}</div><p>{isEn?'One shared intake center preserves ownership and follow-up while each entity keeps its own filtered view.':'Un solo centro de entrada conserva responsable y seguimiento, mientras cada entidad mantiene su vista filtrada.'}</p></section>}
    </div>
  </div>;
}

const emptyLead={name:'',phone:'',email:'',contactMethod:'phone',service:'medicine',serviceDetail:'',source:'',location:'',owner:'',status:'new',followUp:'',notes:''};

function Leads({lang,initialService='all',businessTitle='',embedded=false}) {
  const isEn=lang==='en';
  const entityServices=['insurance','aesthetics','medicine','care305'];
  const launchService=initialService==='all'?sessionStorage.getItem('operational-hub-lead-filter'):initialService;
  const resolvedBusinessTitle=businessTitle||sessionStorage.getItem('operational-hub-business-title')||'';
  const [leads,setLeads]=useState([]);
  const [query,setQuery]=useState(''); const [filter,setFilter]=useState(entityServices.includes(launchService)?launchService:initialService); const [formOpen,setFormOpen]=useState(false); const [form,setForm]=useState(()=>({...emptyLead,service:entityServices.includes(launchService)?launchService:(initialService==='all'?'medicine':initialService)})); const [error,setError]=useState(''); const [saved,setSaved]=useState(false);
  useEffect(()=>{sessionStorage.removeItem('operational-hub-lead-filter');sessionStorage.removeItem('operational-hub-business-title')},[]);
  const persist=next=>setLeads(next);
  const counts={insurance:leads.filter(item=>item.service==='insurance').length,aesthetics:leads.filter(item=>item.service==='aesthetics').length,medicine:leads.filter(item=>item.service==='medicine').length,care305:leads.filter(item=>item.service==='care305').length};
  const visible=leads.filter(item=>(filter==='all'||item.service===filter)&&`${item.name} ${item.phone} ${item.email} ${item.serviceDetail} ${item.source} ${item.owner}`.toLowerCase().includes(query.toLowerCase()));
  const update=(field,value)=>{if(embedded&&field==='service')return;setForm(current=>({...current,[field]:value}));setError('')};
  const createLead=event=>{event.preventDefault();if(!form.phone.trim()&&!form.email.trim()){setError(isEn?'Add at least a phone number or email address.':'Añade por lo menos un teléfono o correo electrónico.');return}const now=new Date();const next=[{...form,id:`lead-${now.getTime()}`,createdAt:now.toISOString()},...leads];persist(next);setForm({...emptyLead,service:embedded?initialService:'medicine'});setFormOpen(false);setSaved(true);window.setTimeout(()=>setSaved(false),2600)};
  const updateStatus=(id,status)=>persist(leads.map(item=>item.id===id?{...item,status}:item));
  const serviceName=value=>value==='insurance'?'Seven Insurance':value==='aesthetics'?'Eastern Medical Aesthetics':value==='care305'?'305 Medical Care':value==='research'?'Eastern Medical Research':'Eastern Medical';
  const statusName=value=>({new:isEn?'New':'Nuevo',contacted:isEn?'Contacted':'Contactado',qualified:isEn?'Qualified':'Cualificado',scheduled:isEn?'Scheduled':'Cita programada',converted:isEn?'Converted':'Convertido',closed:isEn?'Closed':'Cerrado'}[value]);
  const contactName=value=>({phone:isEn?'Phone':'Teléfono',text:'SMS',email:isEn?'Email':'Correo',whatsapp:'WhatsApp'}[value]);
  return <div className={`page records-page leads-page ${embedded?'embedded-leads':''}`}>
    <div className="page-title records-title"><div><span className="eyebrow">{resolvedBusinessTitle?(isEn?'PRIMARY BUSINESS AREA':'ÁREA PRINCIPAL'):(isEn?'CENTRAL OPPORTUNITY PIPELINE':'CANAL CENTRAL DE OPORTUNIDADES')}</span><h1>{resolvedBusinessTitle||(isEn?'Leads Center':'Centro de Leads')}</h1><p>{resolvedBusinessTitle?(isEn?'Focused operational pipeline for this business area. Every opportunity remains connected to the shared Leads Center.':'Canal operacional enfocado en esta área. Cada oportunidad permanece conectada al Centro de Leads compartido.'):(isEn?'Capture and follow every Seven Insurance, Aesthetics and Medicine opportunity in one shared workspace.':'Registra y da seguimiento a todas las oportunidades de Seven Insurance, Estética y Medicina en un solo espacio compartido.')}</p></div><button className="primary" onClick={()=>setFormOpen(true)}><UserPlus size={17}/>{isEn?'New lead':'Nuevo lead'}</button></div>
    <div className="lead-summary"><button onClick={()=>setFilter('all')} className={filter==='all'?'active':''}><Target/><span>{isEn?'Total leads':'Total de leads'}</span><strong>{leads.length}</strong></button><button onClick={()=>setFilter('insurance')} className={filter==='insurance'?'active':''}><ShieldCheck/><span>Seven Insurance</span><strong>{counts.insurance}</strong></button><button onClick={()=>setFilter('aesthetics')} className={filter==='aesthetics'?'active':''}><Sparkles/><span>Eastern Medical Aesthetics</span><strong>{counts.aesthetics}</strong></button><button onClick={()=>setFilter('medicine')} className={filter==='medicine'?'active':''}><Stethoscope/><span>Eastern Medical</span><strong>{counts.medicine}</strong></button><button onClick={()=>setFilter('care305')} className={filter==='care305'?'active':''}><HeartPulse/><span>305 Medical Care</span><strong>{counts.care305}</strong></button></div>
    <div className="records-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={isEn?'Search name, phone, service or owner…':'Buscar nombre, teléfono, servicio o responsable…'}/></div>{!embedded&&<div className="filter-pills"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>{isEn?'All':'Todos'}</button><button className={filter==='insurance'?'active':''} onClick={()=>setFilter('insurance')}>Seven</button><button className={filter==='aesthetics'?'active':''} onClick={()=>setFilter('aesthetics')}>{isEn?'Aesthetics':'Estética'}</button><button className={filter==='medicine'?'active':''} onClick={()=>setFilter('medicine')}>{isEn?'Eastern Medical':'Eastern Medical'}</button><button className={filter==='care305'?'active':''} onClick={()=>setFilter('care305')}>305</button></div>}</div>
    {visible.length?<div className="card records-table leads-table"><div className="table-scroll"><table><thead><tr><th>{isEn?'Lead':'Lead'}</th><th>{isEn?'Contact':'Contacto'}</th><th>{isEn?'Service':'Servicio'}</th><th>{isEn?'Source / owner':'Origen / responsable'}</th><th>{isEn?'Follow-up':'Seguimiento'}</th><th>{isEn?'Status':'Estado'}</th></tr></thead><tbody>{visible.map(item=><tr key={item.id}><td><strong className="lead-name">{item.name}</strong><small>{new Date(item.createdAt).toLocaleDateString(lang==='en'?'en-US':'es-US')}</small></td><td><strong>{item.phone||item.email}</strong><small>{contactName(item.contactMethod)}{item.phone&&item.email?` · ${item.email}`:''}</small></td><td><span className={`lead-service ${item.service}`}>{serviceName(item.service)}</span><small>{item.serviceDetail||item.location||'—'}</small></td><td><strong>{item.source||'—'}</strong><small>{item.owner||(isEn?'Unassigned':'Sin asignar')}</small></td><td><strong>{item.followUp||'—'}</strong><small>{item.notes||''}</small></td><td><select className={`lead-status ${item.status}`} value={item.status} onChange={event=>updateStatus(item.id,event.target.value)} aria-label={`${isEn?'Status for':'Estado de'} ${item.name}`}><option value="new">{statusName('new')}</option><option value="contacted">{statusName('contacted')}</option><option value="qualified">{statusName('qualified')}</option><option value="scheduled">{statusName('scheduled')}</option><option value="converted">{statusName('converted')}</option><option value="closed">{statusName('closed')}</option></select></td></tr>)}</tbody></table></div></div>:<section className="leads-empty"><Target size={34}/><h2>{query||filter!=='all'?(isEn?'No matching leads':'No hay leads coincidentes'):(isEn?'No leads registered yet':'Todavía no hay leads registrados')}</h2><p>{query||filter!=='all'?(isEn?'Change the search or filter to see other opportunities.':'Cambia la búsqueda o el filtro para ver otras oportunidades.'):(isEn?'Create the first opportunity. No demo names, numbers or fictional records are shown.':'Crea la primera oportunidad. No se muestran nombres, teléfonos ni registros ficticios.')}</p>{!query&&filter==='all'&&<button className="primary" onClick={()=>setFormOpen(true)}><Plus size={16}/>{isEn?'Create first lead':'Crear primer lead'}</button>}</section>}
    {saved&&<div className="toast"><CheckCircle2 size={18}/><div><strong>{isEn?'Lead created':'Lead creado'}</strong><span>{isEn?'The opportunity is now in the shared pipeline.':'La oportunidad ya está en el canal compartido.'}</span></div></div>}
    {formOpen&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setFormOpen(false)}><form className="quick-modal lead-modal" onSubmit={createLead}><div className="modal-heading"><div><span>{isEn?'NEW OPPORTUNITY':'NUEVA OPORTUNIDAD'}</span><h2>{isEn?'Register a lead':'Registrar un lead'}</h2></div><button type="button" onClick={()=>setFormOpen(false)} aria-label={isEn?'Close':'Cerrar'}><X size={19}/></button></div><div className="lead-form-grid"><label>{isEn?'Full name':'Nombre completo'}<input required value={form.name} onChange={event=>update('name',event.target.value)} placeholder={isEn?'Client or patient name':'Nombre del cliente o paciente'}/></label><label>{isEn?'Entity':'Entidad'}<select disabled={embedded} value={form.service} onChange={event=>update('service',event.target.value)}><option value="insurance">Seven Insurance</option><option value="aesthetics">Eastern Medical Aesthetics</option><option value="medicine">Eastern Medical</option><option value="care305">305 Medical Care</option></select></label><label>{isEn?'Phone number':'Número de teléfono'}<input type="tel" value={form.phone} onChange={event=>update('phone',event.target.value)} placeholder="(305) 555-0000"/></label><label>{isEn?'Email address':'Correo electrónico'}<input type="email" value={form.email} onChange={event=>update('email',event.target.value)} placeholder="name@email.com"/></label><label>{isEn?'Preferred contact':'Forma de contacto'}<select value={form.contactMethod} onChange={event=>update('contactMethod',event.target.value)}><option value="phone">{isEn?'Phone call':'Llamada telefónica'}</option><option value="text">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">{isEn?'Email':'Correo'}</option></select></label><label>{isEn?'Specific service':'Servicio específico'}<input value={form.serviceDetail} onChange={event=>update('serviceDetail',event.target.value)} placeholder={isEn?'Plan review, Botox, Annual Physical…':'Revisión de plan, Botox, Annual Physical…'}/></label><label>{isEn?'Lead source':'Origen del lead'}<input value={form.source} onChange={event=>update('source',event.target.value)} placeholder={isEn?'Campaign, website, referral, walk-in…':'Campaña, web, referido, visita…'}/></label><label>{isEn?'Preferred location':'Sede preferida'}<select value={form.location} onChange={event=>update('location',event.target.value)}><option value="">{isEn?'Not selected':'Sin seleccionar'}</option><option>Coral Way</option><option>Hialeah</option><option>Fort Myers</option><option>{isEn?'Remote / phone':'Remoto / teléfono'}</option></select></label><label>{isEn?'Assigned owner':'Responsable asignado'}<input value={form.owner} onChange={event=>update('owner',event.target.value)} placeholder={isEn?'Employee or department':'Colaborador o departamento'}/></label><label>{isEn?'Next follow-up':'Próximo seguimiento'}<input type="date" value={form.followUp} onChange={event=>update('followUp',event.target.value)}/></label><label className="lead-notes">{isEn?'Notes':'Notas'}<textarea value={form.notes} onChange={event=>update('notes',event.target.value)} placeholder={isEn?'Need, consent, best time and next step…':'Necesidad, permiso, mejor horario y próximo paso…'}/></label></div>{error&&<p className="lead-form-error"><AlertTriangle size={15}/>{error}</p>}<div className="modal-actions"><button type="button" onClick={()=>setFormOpen(false)}>{isEn?'Cancel':'Cancelar'}</button><button className="primary" type="submit"><Plus size={16}/>{isEn?'Save lead':'Guardar lead'}</button></div></form></div>}
  </div>;
}

function Licenses({lang,initialCategory='all',licenseRowsData=licenseRows,staffRowsData=staffRows,sourceStatus=emmsoSourceStatus}) {
  return <LicenseCenter lang={lang} licenseRows={licenseRowsData} staffRows={staffRowsData} initialCategory={initialCategory} sourceStatus={sourceStatus}/>;
}

function Contracting({lang,contractRowsData=contractRows,sourceStatus=emmsoSourceStatus}) {
  const [query,setQuery]=useState(''); const [filter,setFilter]=useState('all'); const [selected,setSelected]=useState(null); const isEn=lang==='en';
  const rows=contractRowsData.filter(row=>(filter==='all'||row.status===filter)&&`${row.insurance||row.partner} ${row.products||''} ${row.notes||''}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount=contractRowsData.filter(row=>row.status==='active').length;
  const progressCount=contractRowsData.filter(row=>row.status==='progress').length;
  const attachmentCount=contractRowsData.reduce((total,row)=>total+(row.attachmentCount||row.attachments?.length||0),0);
  return <div className="page records-page contracting-page">
    <div className="page-title records-title"><div><span className="eyebrow">AIRTABLE · EM-MSO</span><h1>{isEn?'Insurance Contracting':'Contratos con Aseguradoras'}</h1><p>{isEn?'Carrier agreements, products, credentialing notes and the real contract files maintained in EM-MSO.':'Contratos por aseguradora, productos, notas de credentialing y los archivos reales administrados en EM-MSO.'}</p></div><a className="primary" href={sourceStatus.baseUrl||'https://airtable.com/appCtkLVbC33nRuh1/shrEiLgWd1FJvHWdJ'} target="_blank" rel="noreferrer">{isEn?'Open source':'Abrir fuente'}<ExternalLink size={16}/></a></div>
    <div className={`airtable-banner ${sourceStatus.state==='connected'?'connected':''}`}><div className="airtable-mark">A</div><div><strong>{sourceStatus.state==='connected'?(isEn?'Protected EM-MSO sync active':'Sincronización protegida EM-MSO activa'):(isEn?'EM-MSO source verified · API permission pending':'Fuente EM-MSO verificada · permiso API pendiente')}</strong><p>{sourceStatus.state==='connected'?`${isEn?'Last synchronized':'Última sincronización'}: ${sourceStatus.syncedAt||'—'}`:(isEn?'The public source snapshot replaces every demo contract. Grant this token access to EM-MSO to import all 38 rows and download every PDF into the backend.':'El snapshot público reemplaza todos los contratos demo. Concede al token acceso a EM-MSO para importar las 38 filas y descargar cada PDF al backend.')}</p></div><span>{sourceStatus.state==='connected'?'LIVE':'38 AIRTABLE RECORDS'}</span></div>
    <div className="license-summary"><div><ClipboardCheck/><span>{isEn?'Imported agreements':'Acuerdos importados'}</span><strong>{contractRowsData.length}</strong></div><div><CheckCircle2/><span>{isEn?'Active':'Activos'}</span><strong>{activeCount}</strong></div><div><AlertTriangle/><span>{isEn?'In progress':'En proceso'}</span><strong>{progressCount}</strong></div><div><FileText/><span>{isEn?'Source attachments':'Adjuntos fuente'}</span><strong>{attachmentCount}</strong></div></div>
    <div className="records-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={isEn?'Search carrier, product or note…':'Buscar aseguradora, producto o nota…'}/></div><div className="filter-pills"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>{isEn?'All agreements':'Todos'}</button><button className={filter==='progress'?'active':''} onClick={()=>setFilter('progress')}>{isEn?'In progress':'En proceso'}</button><button className={filter==='active'?'active':''} onClick={()=>setFilter('active')}>{isEn?'Active':'Activos'}</button><button className={filter==='inactive'?'active':''} onClick={()=>setFilter('inactive')}>{isEn?'Inactive':'Inactivos'}</button></div></div>
    <div className="card records-table"><div className="table-scroll"><table><thead><tr><th>{isEn?'Insurance carrier':'Aseguradora'}</th><th>{isEn?'Status':'Estado'}</th><th>{isEn?'Products / plans':'Productos / planes'}</th><th>{isEn?'Source files':'Archivos fuente'}</th><th></th></tr></thead><tbody>{rows.map(row=><tr className="contract-row-clickable" key={row.id||row.recordId||row.insurance} onClick={()=>setSelected(row)}><td><strong className="table-entity">{row.insurance||row.partner}</strong><small>EM-MSO · Insurance Contracts</small></td><td><span className={`record-status ${row.status==='progress'?'upcoming':row.status}`}>{row.status==='progress'?(isEn?'In progress':'En proceso'):row.status==='active'?(isEn?'Active':'Activo'):row.status==='inactive'?(isEn?'Inactive':'Inactivo'):(isEn?'Verify in source':'Verificar en fuente')}</span></td><td><span className="contract-products">{row.products||'—'}</span></td><td><strong>{row.attachmentCount||row.attachments?.length||0}</strong></td><td><button className="row-action" aria-label={`${isEn?'Open':'Abrir'} ${row.insurance||row.partner}`}><ChevronRight size={16}/></button></td></tr>)}</tbody></table></div></div>
    {selected&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setSelected(null)}><section className="quick-modal contract-detail-modal"><div className="modal-heading"><div><span>AIRTABLE · INSURANCE CONTRACTS</span><h2>{selected.insurance||selected.partner}</h2></div><button onClick={()=>setSelected(null)} aria-label={isEn?'Close':'Cerrar'}><X size={19}/></button></div><div className="contract-detail-grid"><div><small>{isEn?'STATUS':'ESTADO'}</small><strong>{selected.status||'—'}</strong></div><div><small>{isEn?'SOURCE FILES':'ARCHIVOS FUENTE'}</small><strong>{selected.attachmentCount||selected.attachments?.length||0}</strong></div></div>{selected.products&&<section><span>{isEn?'PRODUCTS / PLANS':'PRODUCTOS / PLANES'}</span><p>{selected.products}</p></section>}{selected.notes&&<section><span>{isEn?'CONTRACTING NOTES':'NOTAS DE CONTRACTING'}</span><p>{selected.notes}</p></section>}<section><span>{isEn?'CONTRACT DOCUMENTS':'DOCUMENTOS DEL CONTRATO'}</span>{selected.attachments?.length?<div className="contract-attachment-list">{selected.attachments.map((file,index)=>{const filename=typeof file==='string'?file:file.filename;const href=typeof file==='object'&&file.id?`/api/operational/airtable/attachments/${encodeURIComponent(file.id)}`:'';return href?<a key={file.id} href={href} target="_blank" rel="noreferrer"><FileText/><span>{filename}</span><ExternalLink/></a>:<div key={`${filename}-${index}`}><FileText/><span>{filename}</span><small>{isEn?'Awaiting protected import':'Pendiente de importación protegida'}</small></div>})}</div>:<p>{isEn?'No attachment name was exposed in the current snapshot. Open the verified source record to review its files.':'El snapshot actual no expuso nombres de adjuntos. Abre el registro fuente verificado para revisar sus archivos.'}</p>}</section><div className="modal-actions"><button onClick={()=>setSelected(null)}>{isEn?'Close':'Cerrar'}</button><a className="primary" href={selected.sourceRecordUrl||sourceStatus.baseUrl} target="_blank" rel="noreferrer">{isEn?'Open verified Airtable record':'Abrir registro verificado en Airtable'}<ExternalLink size={15}/></a></div></section></div>}
  </div>;
}

function UsersAdministration({lang}) {
  const isEn=lang==='en'; const [users,setUsers]=useState(()=>{try{return JSON.parse(localStorage.getItem('ema-access-users')||'[]').map(user=>({...user,permissions:{...user.permissions,'human-resources':user.permissions?.['human-resources']||user.permissions?.personnel||'none'}}))}catch{return []}}); const [inviteOpen,setInviteOpen]=useState(false); const [permissionError,setPermissionError]=useState(false); const [editingId,setEditingId]=useState(null);
  const permissionModules=[
    {id:'dashboard',label:'Dashboard'},
    {id:'entity-medical',label:'Eastern Medical'}, {id:'entity-care305',label:'305 Medical Care'}, {id:'entity-aesthetics',label:'Eastern Medical Aesthetics'},
    {id:'entity-seven',label:'Seven Insurance'}, {id:'entity-research',label:'Eastern Medical Research'},
    {id:'leads',label:isEn?'Leads Center':'Centro de Leads'}, {id:'protocols',label:isEn?'Operational Protocols':'Protocolos Operacionales'},
    {id:'licenses',label:'Licenses'}, {id:'doctor-licenses',label:isEn?'Licenses · Doctor Licenses / ACA':'Licencias · Doctores / ACA'},
    {id:'credentialing',label:isEn?'Credentialing':'Credencialización'}, {id:'contracting',label:'Contracting'}, {id:'academy',label:'Eastern Medical Academy'}, {id:'human-resources',label:isEn?'Human Resources':'Recursos Humanos'},
    {id:'admin-users',label:isEn?'Administration · Users':'Administración · Usuarios'},
    ...applicationPermissionModules,
  ];
  const initialPermissions=Object.fromEntries(permissionModules.map(module=>[module.id,'none']));
  const emptyDraft=()=>({name:'',email:'',employmentStatus:'active',accessProfile:'academy',role:'employee',permissions:initialPermissions});
  const [draft,setDraft]=useState(emptyDraft);
  const persistUsers=next=>{setUsers(next);localStorage.setItem('ema-access-users',JSON.stringify(next))};
  const closeInvite=()=>{setInviteOpen(false);setPermissionError(false);setEditingId(null);setDraft(emptyDraft())};
  const openEditor=user=>{setEditingId(user.id);setDraft({...emptyDraft(),...user,accessProfile:user.accessProfile||(user.role==='owner'?'owner':user.role==='admin'?'admin':'custom'),permissions:{...initialPermissions,...user.permissions,'human-resources':user.permissions?.['human-resources']||user.permissions?.personnel||'none'}});setInviteOpen(true)};
  const inviteUser=e=>{e.preventDefault();const ownerAccess=draft.accessProfile==='owner';const adminAccess=draft.accessProfile==='admin';const manageAll=Object.fromEntries(permissionModules.map(module=>[module.id,'manage']));const permissions=ownerAccess?{...manageAll,corporate:'manage'}:adminAccess?manageAll:draft.accessProfile==='academy'?{...initialPermissions,academy:'view'}:draft.permissions;delete permissions.personnel;const assigned=permissionModules.filter(module=>permissions[module.id]!=='none');if(!ownerAccess&&!adminAccess&&!assigned.length){setPermissionError(true);return}const record={...draft,role:ownerAccess?'owner':adminAccess?'admin':'employee',permissions,id:editingId||`user-${Date.now()}`};const next=editingId?users.map(user=>user.id===editingId?record:user):[...users,record];persistUsers(next);closeInvite()};
  const deleteCurrent=()=>{if(!editingId)return;persistUsers(users.filter(user=>user.id!==editingId));closeInvite()};
  const initials=name=>name.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('');
  return <div className="page records-page users-page">
    <div className="page-title records-title"><div><span className="eyebrow">{isEn?'ADMINISTRATION · ACCESS':'ADMINISTRACIÓN · ACCESO'}</span><h1>{isEn?'Users':'Usuarios'}</h1><p>{isEn?'Invite users and grant only the access each person needs.':'Invita usuarios y concede únicamente el acceso que cada persona necesita.'}</p></div><button className="primary" onClick={()=>setInviteOpen(true)}><UserPlus size={17}/>{isEn?'Invite user':'Invitar usuario'}</button></div>
    <div className="admin-access-grid"><div className="card access-summary"><LockKeyhole/><div><strong>{users.length}</strong><span>{isEn?'Hub users':'Usuarios del Hub'}</span></div></div><div className="card access-summary"><ShieldCheck/><div><strong>4</strong><span>{isEn?'Access profiles':'Perfiles de acceso'}</span></div></div><div className="card access-summary"><LayoutDashboard/><div><strong>{permissionModules.length+2}</strong><span>{isEn?'Controlled sections':'Secciones controladas'}</span></div></div></div>
    {!users.length?<section className="card users-empty"><div className="empty-icon"><Users size={28}/></div><span>{isEn?'ACCESS DIRECTORY':'DIRECTORIO DE ACCESO'}</span><h2>{isEn?'No users yet':'Todavía no hay usuarios'}</h2><p>{isEn?'Invite the first user, then choose View or Manage access independently for every Hub section. Roadmap is Admin-only and Corporate is Executive-only.':'Invita al primer usuario y asigna acceso View o Manage por sección. Roadmap es solo para Admin y Corporate solo para Ejecutivos.'}</p><button className="primary" onClick={()=>setInviteOpen(true)}><UserPlus size={17}/>{isEn?'Invite first user':'Invitar primer usuario'}</button></section>:<div className="card records-table"><div className="table-head"><div><h2>{isEn?'Access directory':'Directorio de acceso'}</h2><p>{isEn?'Only users created through this workflow appear here. Use Manage to change access at any time.':'Aquí aparecen únicamente los usuarios creados mediante este flujo. Usa Gestionar para cambiar accesos en cualquier momento.'}</p></div></div><div className="table-scroll"><table><thead><tr><th>{isEn?'User':'Usuario'}</th><th>{isEn?'Email':'Correo'}</th><th>{isEn?'Section permissions':'Permisos por sección'}</th><th>{isEn?'Status':'Estado'}</th><th></th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td><div className="employee-cell"><div className="avatar">{initials(user.name)}</div><strong>{user.name}</strong></div></td><td>{user.email}</td><td><div className="permission-chips">{user.role==='owner'?<span className="owner-permission"><strong>Corporate</strong>{isEn?'Executive only':'Solo ejecutivos'}</span>:user.role==='admin'?<span className="owner-permission"><strong>Admin</strong>{isEn?'All Hub sections + Roadmap':'Todas las secciones + Roadmap'}</span>:permissionModules.filter(module=>user.permissions?.[module.id]!=='none').map(module=><span key={module.id}><strong>{module.label}</strong>{user.permissions[module.id]==='manage'?'Manage':'View'}</span>)}</div></td><td><span className={`lifecycle ${user.employmentStatus==='active'?'active':'inactive'}`}>{user.employmentStatus==='active'?(isEn?'Active':'Activo'):(isEn?'Inactive':'Inactivo')}</span></td><td><button className="view-profile" onClick={()=>openEditor(user)}>{isEn?'Manage':'Gestionar'}<ArrowRight size={14}/></button></td></tr>)}</tbody></table></div></div>}
    {inviteOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&closeInvite()}><form className="quick-modal access-modal" onSubmit={inviteUser}><div className="modal-heading"><div><span>{editingId?(isEn?'ADMINISTRATION · MANAGE':'ADMINISTRACIÓN · GESTIONAR'):(isEn?'ADMINISTRATION · INVITE':'ADMINISTRACIÓN · INVITAR')}</span><h2>{editingId?(isEn?'Manage user access':'Gestionar acceso del usuario'):(isEn?'Invite a Hub user':'Invitar usuario al Hub')}</h2><p>{isEn?'Choose a restricted profile or compartmentalize access section by section.':'Elige un perfil restringido o compartimenta el acceso sección por sección.'}</p></div><button type="button" onClick={closeInvite} aria-label={isEn?'Close':'Cerrar'}><X size={19}/></button></div><div className="invite-identity"><label>{isEn?'Full name':'Nombre completo'}<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder={isEn?'Enter full name':'Escribe el nombre completo'}/></label><label>{isEn?'Work email':'Correo corporativo'}<input required type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} placeholder="name@company.com"/></label><label>{isEn?'Employment status':'Estado laboral'}<select value={draft.employmentStatus} onChange={e=>setDraft({...draft,employmentStatus:e.target.value})}><option value="active">{isEn?'Active':'Activo'}</option><option value="inactive">{isEn?'Inactive':'Inactivo'}</option></select></label><label>{isEn?'Access profile':'Perfil de acceso'}<select value={draft.accessProfile} onChange={e=>{setPermissionError(false);setDraft({...draft,accessProfile:e.target.value})}}><option value="academy">{isEn?'Academy employee':'Empleado · Solo Academy'}</option><option value="custom">{isEn?'Custom · Select sections':'Personalizado · Elegir secciones'}</option><option value="admin">{isEn?'Admin · Hub + Roadmap':'Admin · Hub + Roadmap'}</option><option value="owner">{isEn?'Executive · Corporate access':'Ejecutivo · Acceso Corporate'}</option></select></label></div>{draft.accessProfile==='owner'&&<div className="owner-access-warning"><LockKeyhole/><p><strong>{isEn?'Executive-only authority':'Autoridad exclusiva de ejecutivos'}</strong>{isEn?'This profile can enter Corporate and view confidential strategy. Assign it only after the executive identity is verified.':'Este perfil puede entrar a Corporate y ver estrategia confidencial. Asígnalo únicamente después de verificar la identidad del ejecutivo.'}</p></div>}{draft.accessProfile==='admin'&&<div className="owner-access-warning"><ShieldCheck/><p><strong>{isEn?'Administrator authority':'Autoridad de administrador'}</strong>{isEn?'This profile can access every Hub section and the Roadmap, but cannot enter the private Corporate workspace.':'Este perfil puede acceder a todas las secciones del Hub y al Roadmap, pero no puede entrar al espacio privado Corporate.'}</p></div>}{draft.accessProfile==='custom'&&<><div className="permissions-heading"><div><strong>{isEn?'Section permissions':'Permisos por sección'}</strong><span>{isEn?'Choose None, View or Manage for each area. Roadmap and Corporate are intentionally excluded.':'Selecciona None, View o Manage para cada área. Roadmap y Corporate se excluyen intencionalmente.'}</span></div><LockKeyhole size={18}/></div><div className="permission-grid">{permissionModules.map(module=><label key={module.id}><span>{module.label}</span><select value={draft.permissions[module.id]} onChange={e=>{setPermissionError(false);setDraft({...draft,permissions:{...draft.permissions,[module.id]:e.target.value}})}}><option value="none">None</option><option value="view">View</option><option value="manage">Manage</option></select></label>)}</div></>}{permissionError&&<p className="permission-error"><AlertTriangle size={14}/>{isEn?'Select View or Manage for at least one section.':'Selecciona View o Manage para al menos una sección.'}</p>}<div className="modal-actions">{editingId&&<button className="delete-access" type="button" onClick={deleteCurrent}>{isEn?'Remove user':'Eliminar usuario'}</button>}<button type="button" onClick={closeInvite}>{isEn?'Cancel':'Cancelar'}</button><button className="primary" type="submit"><Send size={16}/>{editingId?(isEn?'Save access':'Guardar acceso'):(isEn?'Create access':'Crear acceso')}</button></div></form></div>}
  </div>;
}

const roadmapPhases = [
  {phase:'01',status:'complete',title:{en:'Operational foundation',es:'Fundación operativa'},items:{en:['Operational Hub shell','Six-entity overview','Bilingual navigation','Eastern Medical Academy module'],es:['Estructura de Operational Hub','Resumen de seis entidades','Navegación bilingüe','Módulo Eastern Medical Academy']}},
  {phase:'02',status:'progress',title:{en:'Human Resources & compliance',es:'Recursos Humanos y cumplimiento'},items:{en:['EM-MSO provider mapping','Human Resources lifecycle classification','ACA readiness checklist','Human Resource base synchronization'],es:['Mapeo de proveedores EM-MSO','Clasificación del ciclo laboral en Recursos Humanos','Checklist de cumplimiento ACA','Sincronización de la base Human Resource']}},
  {phase:'03',status:'progress',title:{en:'Licenses & alerts',es:'Licencias y alertas'},items:{en:['Entity license registry','Expiration alert logic','Document attachments','Owner escalation workflow'],es:['Registro de licencias por entidad','Lógica de alertas de vencimiento','Documentos adjuntos','Flujo de escalamiento']}},
  {phase:'04',status:'planned',title:{en:'Automation & intelligence',es:'Automatización e inteligencia'},items:{en:['Live Airtable synchronization','Email and in-app notifications','Academy-to-Human-Resources activation','AI assistant with connected data'],es:['Sincronización en vivo con Airtable','Alertas por email y en la aplicación','Activación Academy → Recursos Humanos','AI Assistant con datos conectados']}},
];

function Roadmap({lang}) {
  const isEn=lang==='en'; const totals={complete:4,progress:7,planned:5};
  return <div className="page roadmap-page"><div className="page-title roadmap-title"><div><span className="eyebrow">{isEn?'PRODUCT DELIVERY':'DESARROLLO DEL PRODUCTO'}</span><h1>{isEn?'Operational Hub Roadmap':'Roadmap de Operational Hub'}</h1><p>{isEn?'A transparent view of what is live, what is being integrated and what comes next.':'Una vista transparente de lo que está listo, lo que estamos integrando y lo próximo.'}</p></div><div className="roadmap-progress"><div><strong>46%</strong><span>{isEn?'overall completion':'progreso general'}</span></div><div className="progress"><i style={{width:'46%'}}/></div></div></div><div className="roadmap-summary"><div><CheckCircle2/><strong>{totals.complete}</strong><span>{isEn?'Completed':'Completado'}</span></div><div><Clock3/><strong>{totals.progress}</strong><span>{isEn?'In progress':'En progreso'}</span></div><div><Route/><strong>{totals.planned}</strong><span>{isEn?'Planned':'Planificado'}</span></div></div><div className="roadmap-board">{roadmapPhases.map(phase=><section className={`roadmap-column ${phase.status}`} key={phase.phase}><div className="roadmap-column-head"><span>{isEn?'PHASE':'FASE'} {phase.phase}</span><b>{phase.status==='complete'?(isEn?'Complete':'Completa'):phase.status==='progress'?(isEn?'In progress':'En progreso'):(isEn?'Planned':'Planificada')}</b></div><h2>{phase.title[lang]}</h2><div className="roadmap-items">{phase.items[lang].map((item,i)=><article key={item}><span>{phase.status==='complete'?<Check size={14}/>:phase.status==='progress'&&i<2?<Clock3 size={14}/>:<CircleHelp size={14}/>}</span><p>{item}</p></article>)}</div></section>)}</div><div className="roadmap-note"><WandSparkles size={20}/><div><strong>{isEn?'Living roadmap':'Roadmap vivo'}</strong><p>{isEn?'Statuses will update as Airtable connections, notification infrastructure and production authentication are completed.':'Los estados se actualizarán al completar las conexiones de Airtable, la infraestructura de alertas y la autenticación de producción.'}</p></div></div></div>;
}

function AIAssistant({lang,onNavigate,page='hub'}) {
  return String(page).startsWith('research-') ? null : <AIAssistantPanel lang={lang} onNavigate={onNavigate} page={page}/>;
}

function AIAssistantPanel({lang,onNavigate,page='hub'}) {
  const isEn=lang==='en';
  const [open,setOpen]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);
  const [status,setStatus]=useState(null);
  const recognitionRef=useRef(null);
  const [messages,setMessages]=useState([{role:'assistant',text:isEn?'Hi Admin. I can analyze Hub data, consult current public sources and coordinate authorized integrations.':'Hola, Admin. Puedo analizar los datos del Hub, consultar fuentes públicas vigentes y coordinar integraciones autorizadas.'}]);
  useEffect(()=>{
    if(!open)return;
    fetch('/api/ai/status').then(response=>response.ok?response.json():Promise.reject()).then(setStatus).catch(()=>setStatus({configured:false,model:'gpt-5.6-sol',reasoningEffort:'high'}));
  },[open]);
  useEffect(()=>()=>recognitionRef.current?.abort?.(),[]);
  const speechSupported=typeof window!=='undefined'&&Boolean(window.SpeechRecognition||window.webkitSpeechRecognition);
  const toggleListening=()=>{
    if(listening){recognitionRef.current?.stop?.();return}
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setMessages(current=>[...current,{role:'assistant',error:true,text:isEn?'Voice dictation is not available in this browser. You can continue typing.':'El dictado por voz no está disponible en este navegador. Puedes continuar escribiendo.'}]);return}
    const recognition=new SpeechRecognition();recognitionRef.current=recognition;recognition.lang=isEn?'en-US':'es-US';recognition.continuous=true;recognition.interimResults=true;
    let finalText='';
    recognition.onstart=()=>setListening(true);
    recognition.onresult=event=>{let interim='';for(let index=event.resultIndex;index<event.results.length;index+=1){const transcript=event.results[index][0]?.transcript||'';if(event.results[index].isFinal)finalText+=`${transcript} `;else interim+=transcript}setInput(`${finalText}${interim}`.trimStart())};
    recognition.onerror=event=>{if(event.error!=='aborted')setMessages(current=>[...current,{role:'assistant',error:true,text:isEn?'I could not access the microphone. Check browser permission and try again.':'No pude acceder al micrófono. Verifica el permiso del navegador e inténtalo nuevamente.'}])};
    recognition.onend=()=>{setListening(false);recognitionRef.current=null};
    recognition.start();
  };
  const send=async(text=input)=>{
    const value=text.trim();
    if(!value||loading)return;
    const next=[...messages,{role:'user',text:value}];
    setMessages(next);setInput('');setLoading(true);
    try{
      const response=await fetch('/api/ai/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:next.map(({role,text})=>({role,text})),lang,page})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||'Operational AI unavailable');
      setMessages(current=>[...current,{role:'assistant',text:payload.text,page:payload.page,sources:payload.sources||[],model:payload.model}]);
      setStatus(current=>({...current,configured:true,connected:true,model:payload.model,reasoningEffort:payload.reasoningEffort}));
    }catch(error){
      const needsKey=/OPENAI_API_KEY|OpenAI integration key/i.test(error.message);
      setMessages(current=>[...current,{role:'assistant',error:true,text:needsKey?(isEn?'The GPT-5.6 engine is installed, but the server-side OpenAI key still needs to be configured. No key is ever stored in the browser.':'El motor GPT-5.6 está instalado, pero todavía falta configurar la llave de OpenAI en el servidor. La llave nunca se guarda en el navegador.'):(isEn?`I could not complete that request: ${error.message}`:`No pude completar esa solicitud: ${error.message}`)}]);
    }finally{setLoading(false)}
  };
  const modelLabel=status?.model||'gpt-5.6-sol';
  const engineState=status?.connected?(isEn?'GPT-5.6 tools online':'GPT-5.6 y herramientas activas'):status?.configured?(isEn?'Credential found · provider unavailable':'Credencial detectada · proveedor no disponible'):(isEn?'Engine ready · key pending':'Motor listo · falta llave');
  return <div className={`ai-assistant ${open?'open':''} ${expanded?'expanded':''}`}><button className="ai-trigger" onClick={()=>setOpen(!open)} aria-label={isEn?'Open AI Assistant':'Abrir AI Assistant'}>{open?<X size={25}/>:<img src="/app-logos/operational-ai.svg" alt=""/>}</button>{open&&<section className="ai-panel"><header><div className="ai-avatar"><img src="/app-logos/operational-ai.svg" alt=""/></div><div><strong>Operational AI</strong><span><i className={status?.connected?'connected':'pending'}/>{engineState} · {isEn?'Current section':'Sección actual'}: {page}</span></div><div className="ai-header-actions"><button onClick={()=>setExpanded(!expanded)} title={expanded?(isEn?'Restore panel':'Restaurar panel'):(isEn?'Expand panel':'Ampliar panel')} aria-label={expanded?(isEn?'Restore AI panel':'Restaurar panel de IA'):(isEn?'Expand AI panel':'Ampliar panel de IA')}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button><button onClick={()=>{setExpanded(false);setOpen(false)}} aria-label={isEn?'Close AI Assistant':'Cerrar AI Assistant'}><X size={17}/></button></div></header><div className="ai-messages">{messages.map((message,i)=><div className={`ai-message ${message.role} ${message.error?'error':''}`} key={i}><p>{message.text}</p>{message.sources?.length>0&&<div className="ai-sources">{message.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={11}/>{source.title}</a>)}</div>}{message.page&&<button onClick={()=>{onNavigate(message.page);setOpen(false)}}>{isEn?'Open related module':'Abrir módulo relacionado'}<ArrowRight size={13}/></button>}</div>)}{loading&&<div className="ai-message assistant working"><p><span/><span/><span/>{isEn?'Analyzing data and tools…':'Analizando datos y herramientas…'}</p></div>}</div><div className="ai-prompts"><button disabled={loading} onClick={()=>send(isEn?'Analyze the licenses that need attention and use the current Hub data.':'Analiza las licencias que requieren atención usando los datos actuales del Hub.')}>{isEn?'Analyze licenses':'Analizar licencias'}</button><button disabled={loading} onClick={()=>send(isEn?'What is the current ACA RPA, background screening and roster status?':'¿Cuál es el estado actual del RPA de ACA, background screening y roster?')}>{isEn?'ACA · RPA status':'ACA · Estado RPA'}</button><button disabled={loading} onClick={()=>send(isEn?'Review the current operational integration gaps and prioritize the next actions.':'Revisa las brechas actuales de integración operacional y prioriza las próximas acciones.')}>{isEn?'Integration priorities':'Prioridades'}</button></div><form onSubmit={e=>{e.preventDefault();recognitionRef.current?.stop?.();send()}}><input disabled={loading} value={input} onChange={e=>setInput(e.target.value)} placeholder={listening?(isEn?'Listening… speak your instruction':'Escuchando… dicta tu instrucción'):(isEn?'Ask or dictate to Operational AI…':'Escribe o dicta a Operational AI…')}/><button className={`ai-mic ${listening?'listening':''}`} disabled={loading||!speechSupported} type="button" onClick={toggleListening} title={speechSupported?(listening?(isEn?'Stop dictation':'Detener dictado'):(isEn?'Dictate instruction':'Dictar instrucción')):(isEn?'Voice dictation unavailable':'Dictado no disponible')} aria-pressed={listening}><Mic size={17}/></button><button disabled={loading||!input.trim()} type="submit"><Send size={16}/></button></form><small><strong>{modelLabel}</strong> · {isEn?'Voice-enabled · Section-aware · Confirmation-gated RPA':'Dictado activo · Contexto por sección · RPA con confirmación'}</small></section>}</div>;
}

function CourseCard({course,lang,onOpen,featured=false}) {
  const Icon=course.icon; const t=UI[lang];
  const openCourse=()=>onOpen(course);
  return <article className={`course-card ${featured?'featured':''}`} role="button" tabIndex="0" onClick={openCourse} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCourse()}}}>
    <div className={`course-visual ${course.tone}`}><span className="course-pattern"/><div className={`course-icon ${course.logo?'course-brand-logo':''}`}>{course.logo?<img src={course.logo} alt={`${course.title[lang]} logo`}/>:<Icon size={featured?35:27}/>}</div><span className="course-tag">{course.tag==='specialization'?t.specialization:t.required}</span></div>
    <div className="course-copy"><div className="course-meta"><span><Clock3 size={14}/>{course.duration}</span><span>{course.modules} {t.modules}</span></div><h3>{course.title[lang]}</h3><p>{course.description[lang]}</p><div className="progress-label"><span>{course.progress}% {t.complete}</span><span>{t.due} {course.due[lang]}</span></div><div className="progress"><i style={{width:`${course.progress}%`}}/></div><button onClick={event=>{event.stopPropagation();openCourse()}}>{course.progress? t.resume:(lang==='en'?'Start course':'Iniciar curso')}<ArrowRight size={17}/></button></div>
  </article>
}

const courseWithLearnerProgress=(course,academyRecord)=>{
  const events=academyRecord?.record?.events||[];const courseEvents=events.filter(event=>event.courseId===course.id);const completedCourse=courseEvents.some(event=>event.type==='course_completed');const completedLessons=new Set(courseEvents.filter(event=>event.type==='lesson_completed').map(event=>String(event.lessonIndex))).size;
  return {...course,progress:completedCourse?100:Math.min(100,Math.round((completedLessons/Math.max(1,course.modules||course.lessons?.length||1))*100))};
};

function Dashboard({lang,onOpen,setPage,session,canManageAcademy=false,academyRecord=null}) {
  const t=UI[lang];
  const displayDate=new Intl.DateTimeFormat(lang==='en'?'en-US':'es-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'}).format(new Date()).toUpperCase();
  const record=academyRecord?.record||{};const events=record.events||[];const answers=events.filter(event=>event.type==='answer');const correctAnswers=answers.filter(event=>event.correct===true).length;const totalModules=courses.reduce((sum,item)=>sum+Number(item.modules||0),0);const completedLessons=Number(record.completedLessons||0);const overallProgress=Math.min(100,Math.round((completedLessons/Math.max(1,totalModules))*100));const averageScore=answers.length?Math.round((correctAnswers/answers.length)*100):0;const personalizedCourses=courses.map(item=>courseWithLearnerProgress(item,academyRecord));const resumeCourse=personalizedCourses.find(item=>item.progress>0&&item.progress<100)||personalizedCourses[0];
  return <div className="page academy-page dashboard-page">
    <div className="welcome"><div><span className="eyebrow">{displayDate}</span><h1>{lang==='en'?`Welcome, ${session?.name||'Employee'}`:`Bienvenido, ${session?.name||'colaborador'}`} <span>👋</span></h1><p>{t.welcomeSub}</p></div><div className="welcome-badge"><ShieldCheck size={25}/><div><span>{lang==='en'?'Personal record':'Expediente personal'}</span><strong>{lang==='en'?'Private':'Privado'}</strong></div></div></div>
    <AcademyWelcomeVideo lang={lang} session={session} canManage={canManageAcademy}/>
    <div className="metrics"><Metric icon={Target} label={t.progress} value={`${overallProgress}%`} delta={lang==='en'?'From your recorded lessons':'Desde tus lecciones registradas'} tone="teal"/><Metric icon={BookOpen} label={lang==='en'?'Recorded activity':'Actividad registrada'} value={String(events.length)} delta={lang==='en'?'Only your activity':'Solo tu actividad'} tone="blue"/><Metric icon={CheckCircle2} label={t.completed} value={`${completedLessons}/${totalModules}`} delta={lang==='en'?'Completed lessons':'Lecciones completadas'} tone="green"/><Metric icon={TrendingUp} label={t.score} value={`${averageScore}%`} delta={`${answers.length} ${lang==='en'?'recorded answers':'respuestas registradas'}`} tone="amber"/></div>
    <section className="continue-section"><div className="section-heading"><div><span>{t.continue}</span><h2>{resumeCourse.progress? (lang==='en'?'Pick up where you left off':'Continúa donde lo dejaste'):(lang==='en'?'Begin your learning journey':'Comienza tu recorrido de aprendizaje')}</h2></div></div><div className="resume-banner"><div className="resume-art"><div className="pulse-ring"><Stethoscope size={39}/></div></div><div className="resume-copy"><span className="tiny-tag">{lang==='en'?'YOUR CURRENT COURSE':'TU CURSO ACTUAL'}</span><h3>{resumeCourse.title[lang]}</h3><p>{resumeCourse.description[lang]}</p><div className="resume-foot"><div className="progress large"><i style={{width:`${resumeCourse.progress}%`}}/></div><span>{resumeCourse.progress}% {t.complete}</span><button className="primary" onClick={()=>onOpen(resumeCourse)}>{resumeCourse.progress?t.resume:(lang==='en'?'Start course':'Iniciar curso')}<Play size={16} fill="currentColor"/></button></div></div></div></section>
    <div className="dashboard-grid"><section><div className="section-heading"><div><span>{t.paths}</span><h2>{lang==='en'?'Available to you':'Disponibles para ti'}</h2></div><button className="text-arrow" onClick={()=>setPage('learning')}>{t.viewAll}<ArrowRight size={16}/></button></div><div className="course-row">{personalizedCourses.slice(0,3).map(item=><CourseCard key={item.id} course={item} lang={lang} onOpen={onOpen}/>)}</div></section><aside className="right-rail"><div className="cert-ready card"><div className="cert-seal"><Award size={27}/></div><h3>{t.cert}</h3><p>{t.certSub}</p><div className="checklist"><span><Check size={15}/>{completedLessons} {lang==='en'?'lessons completed':'lecciones completadas'}</span><span><Check size={15}/>{correctAnswers} {lang==='en'?'correct answers':'respuestas correctas'}</span><span className={(record.certificates||[]).length?'':'pending'}><Clock3 size={15}/>{(record.certificates||[]).length} {lang==='en'?'certificates archived':'certificados archivados'}</span></div><button className="cert-action" onClick={()=>setPage('certificates')}>{lang==='en'?'View certificate center':'Ver centro de certificados'}<ArrowRight size={16}/></button></div></aside></div>
  </div>;
}

function Library({lang,onOpen,academyRecord=null}) {
  const t=UI[lang]; const [filter,setFilter]=useState('all'); const [query,setQuery]=useState('');
  const academyData=useAcademyBackendData();
  const connectedResources=academyData.courses.flatMap(course=>course.content);
  const connectedTables=[...new Set(academyData.courses.flatMap(course=>course.sourceTables))];
  const systemsCourse={...courses.find(course=>course.id==='systems'),id:'systems-training-center',source:'airtable',sourceName:'TRAININGS - Learning Center',title:{en:'Systems & Digital Tools',es:'Sistemas y Herramientas Digitales'},description:{en:'Complete systems training hub backed by the connected Airtable database.',es:'Hub completo de capacitación de sistemas conectado a la base de datos de Airtable.'},sourceTables:connectedTables,content:connectedResources,assetCount:academyData.sync.attachmentCount,modules:connectedResources.length,duration:`${Math.max(1,Math.ceil(connectedResources.length*.35))}h`,progress:0,due:{en:'Assigned',es:'Asignado'}};
  const academyCourses=courses.map(course=>courseWithLearnerProgress(course.id==='systems'?systemsCourse:course,academyRecord));
  const openTrackCourse=id=>{const selected=id==='systems'?systemsCourse:academyCourses.find(course=>course.id===id);if(selected)onOpen(selected)};
  const filtered=academyCourses.filter(c=>(filter==='all'||(filter==='special'?c.tag==='specialization':c.tag!=='specialization'))&&c.title[lang].toLowerCase().includes(query.toLowerCase()));
  return <div className="page">
    <div className="page-title"><div><span className="eyebrow">{lang==='en'?'GROW YOUR SKILLS':'DESARROLLA TUS HABILIDADES'}</span><h1>{t.library}</h1><p>{t.librarySub}</p></div><div className="library-summary"><div><strong>{courses.length + academyData.sync.publishedCourseCount}</strong><span>{lang==='en'?'Modules':'Módulos'}</span></div><div><strong>{academyData.sync.recordCount}</strong><span>{lang==='en'?'Airtable records':'Registros Airtable'}</span></div><div><strong>{academyData.sync.attachmentCount}</strong><span>{lang==='en'?'Attachments':'Adjuntos'}</span></div></div></div>
    <AirtableSyncPanel lang={lang} sync={academyData.sync} source={academyData.source}/>
    <DepartmentCourseMap lang={lang} onOpenCourse={openTrackCourse}/>
    <div className="library-tools"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></div><div className="filter-pills"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>{t.all}</button><button className={filter==='core'?'active':''} onClick={()=>setFilter('core')}>{t.core}</button><button className={filter==='special'?'active':''} onClick={()=>setFilter('special')}>{t.specializations}</button></div></div>
    <div className="course-grid">{filtered.map(c=><CourseCard key={c.id} course={c} lang={lang} onOpen={onOpen}/>)}</div>
    <AirtableCatalog lang={lang} onOpen={onOpen} courses={academyData.courses}/>
  </div>
}

function SystemsTraining({lang,onOpen}) {
  const isEn=lang==='en';
  const academyData=useAcademyBackendData();
  const systemIds=new Set(['airtable-clinical-systems','airtable-communications','airtable-workplace-tools','airtable-office-operations']);
  const systemCourses=academyData.courses.filter(course=>systemIds.has(course.id));
  const records=systemCourses.reduce((total,course)=>total+course.content.length,0);
  const videos=systemCourses.reduce((total,course)=>total+course.content.filter(item=>item.attachments?.some(file=>file.type?.startsWith('video/'))||/wistia|loom/i.test(item.externalUrl||'')).length,0);
  const systems=[...new Set(systemCourses.flatMap(course=>course.sourceTables))];
  return <div className="page systems-training-page">
    <section className="systems-training-hero"><div><span>{isEn?'EASTERN MEDICAL ACADEMY · SYSTEMS':'EASTERN MEDICAL ACADEMY · SISTEMAS'}</span><h1>{isEn?'Systems, software and digital workflows':'Sistemas, software y flujos digitales'}</h1><p>{isEn?'The connected training center for Practice Fusion, CRM, communications, clinical tools, secure access and everyday office systems. Videos and courses come directly from the protected Airtable catalog.':'El centro conectado de capacitación para Practice Fusion, CRM, comunicaciones, herramientas clínicas, acceso seguro y sistemas de oficina. Los videos y cursos provienen directamente del catálogo protegido de Airtable.'}</p></div><Bot size={52}/></section>
    <div className="systems-stats"><article><strong>{systemCourses.length}</strong><span>{isEn?'learning paths':'rutas de aprendizaje'}</span></article><article><strong>{systems.length}</strong><span>{isEn?'connected systems':'sistemas conectados'}</span></article><article><strong>{records}</strong><span>{isEn?'lessons & resources':'lecciones y recursos'}</span></article><article><strong>{videos}</strong><span>{isEn?'video lessons':'lecciones en video'}</span></article></div>
    <AirtableSyncPanel lang={lang} sync={academyData.sync} source={academyData.source}/>
    <section className="systems-map"><div><span>{isEn?'WHAT IS HERE':'QUÉ ENCONTRARÁS'}</span><h2>{isEn?'Four connected learning paths':'Cuatro rutas conectadas'}</h2></div><div><article><Stethoscope/><strong>{isEn?'Clinical systems & EHR':'Sistemas clínicos y EHR'}</strong><p>Practice Fusion · HMS · Availity · Nabla · Tebra · Updox</p></article><article><Headphones/><strong>{isEn?'Communications & CRM':'Comunicaciones y CRM'}</strong><p>FreshWork CRM · RingCentral · 3CX · Call reports</p></article><article><LockKeyhole/><strong>{isEn?'Workplace & security':'Trabajo y seguridad'}</strong><p>Windows · Email · Microsoft Office · Adobe · Airtable · VPN</p></article><article><Building2/><strong>{isEn?'Office operations':'Operaciones de oficina'}</strong><p>{isEn?'Inventory · supplies · services · daily office workflows':'Inventario · suministros · servicios · flujos diarios'}</p></article></div></section>
    <InternalAppsAcademy lang={lang}/>
    <AirtableCatalog lang={lang} onOpen={onOpen} courses={systemCourses}/>
  </div>;
}

const quiz = {
  en: [
    {q:'Who owns the quality of the patient journey?',a:['Only the clinical team','Every employee at every handoff','The patient services manager'],correct:1},
    {q:'Why must every employee understand all departments and services?',a:['So they can diagnose every patient','So they can recognize needs and connect qualified patients or clients to the right service','So every employee can sell every procedure'],correct:1},
    {q:'What should happen before discussing protected patient information?',a:['Verify identity and authorization','Open the CRM','Ask for a review'],correct:0},
    {q:'What is the best response when a handoff is unclear?',a:['Assume the next team will handle it','Document and confirm ownership','Wait until the patient calls back'],correct:1}
  ],
  es: [
    {q:'¿Quién es responsable de la calidad del recorrido del paciente?',a:['Solo el equipo clínico','Cada empleado en cada transición','El gerente de servicios'],correct:1},
    {q:'¿Por qué cada empleado debe conocer todos los departamentos y servicios?',a:['Para diagnosticar a todos los pacientes','Para reconocer necesidades y conectar a cada paciente o cliente que cualifique con el servicio correcto','Para que cada empleado pueda vender todos los procedimientos'],correct:1},
    {q:'¿Qué debe ocurrir antes de hablar sobre información protegida?',a:['Verificar identidad y autorización','Abrir el CRM','Pedir una reseña'],correct:0},
    {q:'¿Cuál es la mejor respuesta cuando una transición no está clara?',a:['Suponer que otro equipo lo resolverá','Documentar y confirmar quién es responsable','Esperar a que el paciente llame'],correct:1}
  ]
};

const ecosystemConnections = [
  { icon: Stethoscope, title:{en:'Medical care',es:'Atención médica'}, text:{en:'Primary care, diagnostics, specialists and preventive services.',es:'Atención primaria, diagnósticos, especialistas y servicios preventivos.'} },
  { icon: Sparkles, title:{en:'Medical aesthetics',es:'Estética médica'}, text:{en:'Consultations, skin health, body treatments and wellness.',es:'Consultas, salud de la piel, tratamientos corporales y bienestar.'} },
  { icon: ShieldCheck, title:{en:'Seven Insurance',es:'Seven Insurance'}, text:{en:'Coverage education, Marketplace enrollment and plan support.',es:'Educación sobre cobertura, inscripción en Marketplace y apoyo con planes.'} },
];

const chronicConditions = [
  {en:'Hypertension',es:'Hipertensión'}, {en:'Diabetes',es:'Diabetes'}, {en:'COPD or asthma',es:'EPOC o asma'},
  {en:'Cardiovascular disease',es:'Enfermedad cardiovascular'}, {en:'Arthritis',es:'Artritis'}, {en:'Depression',es:'Depresión'},
  {en:'Cancer',es:'Cáncer'}, {en:'Chronic kidney disease',es:'Enfermedad renal crónica'}
];

function CareModuleLesson({course,lang,onBack,onHub,setLang}) {
  const t=UI[lang]; const [active,setActive]=useState(0);
  const criteria=lang==='en'?[
    ['2+ chronic conditions','The patient generally has at least two chronic conditions.'],
    ['Expected duration','Conditions are expected to last at least 12 months or until death.'],
    ['Meaningful risk','The conditions create significant risk of death, acute exacerbation, decompensation or functional decline.'],
    ['Coverage & clinical review','Coverage, diagnoses and medical necessity must be confirmed by the authorized team; frontline staff identify candidates but do not determine final eligibility.']
  ]:[
    ['2+ condiciones crónicas','Por lo general, el paciente tiene al menos dos condiciones crónicas.'],
    ['Duración esperada','Se espera que duren al menos 12 meses o hasta el fallecimiento.'],
    ['Riesgo significativo','Las condiciones crean riesgo significativo de muerte, exacerbación aguda, descompensación o deterioro funcional.'],
    ['Cobertura y revisión clínica','El equipo autorizado confirma cobertura, diagnósticos y necesidad médica; el personal de primera línea identifica candidatos, pero no decide la elegibilidad final.']
  ];
  const workflow=lang==='en'?['Recognize a possible candidate','Ask permission to explain the program','Create the approved referral','Specialized team verifies eligibility','Initiating visit and consent when required','Care plan, outreach and monthly coordination']:['Reconocer un posible candidato','Pedir permiso para explicar el programa','Crear el referido aprobado','El equipo especializado verifica la elegibilidad','Visita inicial y consentimiento cuando corresponda','Plan de atención, contacto y coordinación mensual'];
  return <div className="lesson-page"><div className="lesson-top"><button onClick={onBack}><ArrowLeft size={18}/>{lang==='en'?'Back to learning':'Volver a aprendizaje'}</button><LanguageSelect lang={lang} setLang={setLang} className="academy-language-select"/><div><span>{t.lessonProgress}</span><div className="progress"><i style={{width:'12.5%'}}/></div><strong>1/8</strong></div></div><div className="lesson-layout"><aside className="lesson-nav"><button className="lesson-hub-return" onClick={onHub}><HubBrand compact/><span><ArrowLeft size={14}/>{lang==='en'?'Return to Operational Hub':'Regresar a Operational Hub'}</span></button><div className="lesson-cover teal"><HeartPulse size={31}/><h3>{course.title[lang]}</h3><span>8 {t.modules}</span></div><div className="lesson-list">{course.lessons.map((l,i)=><button key={i} className={i===active?'active':''} onClick={()=>setActive(i)}><i>{i+1}</i><span><small>{t.lesson} {i+1}</small>{l[lang==='en'?0:1]}</span>{i===active&&<ChevronRight size={17}/>}</button>)}</div></aside><main className="lesson-content care-content"><div className="lesson-breadcrumb"><span>{course.title[lang]}</span><ChevronRight size={14}/><span>{lang==='en'?'Program guide':'Guía del programa'}</span></div><span className="lesson-kicker"><HeartPulse size={15}/>{lang==='en'?'SPECIALIZED CARE PATHWAY':'RUTA DE ATENCIÓN ESPECIALIZADA'}</span><h1>{lang==='en'?'Identify. Explain. Connect.':'Identificar. Explicar. Conectar.'}</h1><p className="lead">{lang==='en'?'Every employee should recognize when a patient may benefit from UHQH Labs or the Chronic Care department, then make a respectful, documented handoff. The specialized team owns clinical review, eligibility confirmation, enrollment and ongoing care coordination.':'Cada empleado debe reconocer cuándo un paciente podría beneficiarse de UHQH Labs o del departamento de Chronic Care y realizar una transición respetuosa y documentada. El equipo especializado se encarga de la revisión clínica, la confirmación de elegibilidad, la inscripción y la coordinación continua.'}</p>
  <div className="care-owner"><div><Users size={28}/></div><div><span>{lang==='en'?'IMPORTANT ROLE BOUNDARY':'LÍMITE IMPORTANTE DE FUNCIONES'}</span><h2>{lang==='en'?'You identify the opportunity. The Chronic Care team confirms qualification.':'Tú identificas la oportunidad. El equipo de Chronic Care confirma si cualifica.'}</h2><p>{lang==='en'?'Never diagnose, guarantee coverage, promise enrollment or interpret results outside your authorized role.':'Nunca diagnostiques, garantices cobertura, prometas inscripción ni interpretes resultados fuera de tu función autorizada.'}</p></div></div>
  <h2>{lang==='en'?'Who may qualify for Chronic Care?':'¿Quién puede cualificar para Chronic Care?'}</h2><p>{lang==='en'?'Use these criteria as a screening signal—not a final eligibility decision. Payer rules and the patient’s clinical record must be verified.':'Usa estos criterios como señal de evaluación inicial, no como decisión final. Se deben verificar las reglas del pagador y el expediente clínico.'}</p><div className="criteria-grid">{criteria.map((item,i)=><div key={item[0]}><span>0{i+1}</span><h3>{item[0]}</h3><p>{item[1]}</p></div>)}</div>
  <div className="conditions-block"><div><span className="lesson-kicker"><Stethoscope size={15}/>{lang==='en'?'EXAMPLES, NOT A COMPLETE LIST':'EJEMPLOS, NO ES UNA LISTA COMPLETA'}</span><h2>{lang==='en'?'Conditions that may be relevant':'Condiciones que pueden ser relevantes'}</h2><p>{lang==='en'?'Two diagnoses alone do not automatically establish eligibility; duration, risk, coverage and clinical need still matter.':'Tener dos diagnósticos no establece automáticamente la elegibilidad; también importan la duración, el riesgo, la cobertura y la necesidad clínica.'}</p></div><div className="condition-tags">{chronicConditions.map(c=><span key={c.en}><CheckCircle2 size={14}/>{c[lang]}</span>)}</div></div>
  <h2>{lang==='en'?'How the program works':'Cómo funciona el programa'}</h2><div className="care-workflow">{workflow.map((step,i)=><div key={step}><i>{i+1}</i><span>{step}</span>{i<workflow.length-1&&<ChevronRight size={16}/>}</div>)}</div><div className="callout"><div><ShieldCheck size={23}/></div><p><strong>{lang==='en'?'Key program elements':'Elementos fundamentales del programa'}</strong>{lang==='en'?'A patient-centered electronic care plan, medication review, preventive care, transition management, coordinated communication and access to the care team. Patient consent and an initiating visit may be required before services begin.':'Un plan electrónico centrado en el paciente, revisión de medicamentos, prevención, manejo de transiciones, comunicación coordinada y acceso al equipo. Puede requerirse consentimiento y una visita inicial antes de comenzar.'}</p></div>
  <h2>{lang==='en'?'The right approach with the patient':'El approach correcto con el paciente'}</h2><div className="approach-grid"><div className="script-card"><MessageSquareText size={24}/><span>{lang==='en'?'SUGGESTED LANGUAGE':'LENGUAJE SUGERIDO'}</span><blockquote>{lang==='en'?'“Eastern Medical has a specialized team that supports eligible patients who live with multiple ongoing health conditions. They can review your situation, explain the program and confirm whether it may be available to you. Would you like me to connect you with that team?”':'“Eastern Medical tiene un equipo especializado que apoya a pacientes elegibles que viven con varias condiciones de salud continuas. Ellos pueden revisar su situación, explicarle el programa y confirmar si puede estar disponible para usted. ¿Le gustaría que lo conecte con ese equipo?”'}</blockquote></div><div className="do-dont"><div><strong><CheckCircle2 size={16}/>{lang==='en'?'Do':'Sí'}</strong><ul><li>{lang==='en'?'Lead with support and convenience':'Habla de apoyo y conveniencia'}</li><li>{lang==='en'?'Ask permission before referring':'Pide permiso antes de referir'}</li><li>{lang==='en'?'Set an honest expectation':'Establece expectativas honestas'}</li></ul></div><div><strong><X size={16}/>{lang==='en'?'Avoid':'Evita'}</strong><ul><li>{lang==='en'?'“You definitely qualify”':'“Usted definitivamente cualifica”'}</li><li>{lang==='en'?'Pressure or fear-based language':'Presión o lenguaje basado en miedo'}</li><li>{lang==='en'?'Discussing PHI in unapproved channels':'Hablar de PHI en canales no aprobados'}</li></ul></div></div></div>
  <h2>{lang==='en'?'Where does the information go?':'¿Dónde se pone la información?'}</h2><div className="documentation-table"><div className="doc-head"><span>{lang==='en'?'Information':'Información'}</span><span>{lang==='en'?'Approved destination':'Destino aprobado'}</span><span>{lang==='en'?'Owner':'Responsable'}</span></div>{(lang==='en'?[
    ['Diagnoses, medications, clinical risks and care plan','EHR / Practice Fusion structured fields and clinical note','Authorized clinical team'],
    ['Possible candidate, permission to contact and referral reason','Approved Chronic Care referral queue or CRM workflow','Referring employee'],
    ['Eligibility review, consent and enrollment status','EHR plus approved care-management platform','Chronic Care department'],
    ['Outreach attempts, monthly activities and follow-up','Approved care-management record','Chronic Care department'],
    ['Lab order, preparation, collection and result status','EHR and approved UHQH Labs workflow','Ordering / lab team']
  ]:[
    ['Diagnósticos, medicamentos, riesgos y plan de atención','Campos estructurados y nota clínica en EHR / Practice Fusion','Equipo clínico autorizado'],
    ['Posible candidato, permiso para contacto y motivo del referido','Cola aprobada de Chronic Care o flujo del CRM','Empleado que refiere'],
    ['Revisión de elegibilidad, consentimiento e inscripción','EHR y plataforma aprobada de manejo de atención','Departamento de Chronic Care'],
    ['Intentos de contacto, actividades mensuales y seguimiento','Registro aprobado de manejo de atención','Departamento de Chronic Care'],
    ['Orden, preparación, toma y estado del resultado de laboratorio','EHR y flujo aprobado de UHQH Labs','Equipo que ordena / laboratorio']
  ]).map(row=><div className="doc-row" key={row[0]}>{row.map(cell=><span key={cell}>{cell}</span>)}</div>)}</div><div className="warning-callout"><LockKeyhole size={22}/><div><strong>{lang==='en'?'Never place protected information in personal texts, personal email, social media or an unapproved spreadsheet.':'Nunca coloques información protegida en mensajes personales, correo personal, redes sociales ni hojas de cálculo no aprobadas.'}</strong><p>{lang==='en'?'The exact internal field names, queue and assignment rules must be confirmed by Eastern Medical before this module is released for production.':'Los nombres exactos de los campos internos, la cola y las reglas de asignación deben ser confirmados por Eastern Medical antes de publicar este módulo.'}</p></div></div>
  <h2>{lang==='en'?'UHQH Labs: staff responsibilities':'UHQH Labs: responsabilidades del personal'}</h2><div className="labs-grid">{(lang==='en'?[
    ['Confirm the order','Verify patient identity, ordering provider, requested test and date.'],['Prepare the patient','Use only approved preparation instructions; escalate clinical questions.'],['Coordinate collection','Confirm site, timing, required documents and specimen workflow.'],['Track and close the loop','Document status; route results and critical notifications only through approved clinical workflows.']
  ]:[
    ['Confirmar la orden','Verifica identidad, proveedor que ordena, prueba solicitada y fecha.'],['Preparar al paciente','Usa solamente instrucciones aprobadas; escala preguntas clínicas.'],['Coordinar la toma','Confirma sede, horario, documentos y flujo de la muestra.'],['Cerrar el ciclo','Documenta el estado; canaliza resultados y alertas críticas solo mediante flujos clínicos aprobados.']
  ]).map((item,i)=><div key={item[0]}><i>{i+1}</i><h3>{item[0]}</h3><p>{item[1]}</p></div>)}</div><div className="module-source"><FileCheck2 size={18}/><p>{lang==='en'?'Chronic Care criteria in this prototype are based on CMS guidance current through 2026. Final workflows must be reviewed by Eastern Medical’s clinical, compliance, billing and UHQH Labs leaders.':'Los criterios de Chronic Care de este prototipo se basan en la guía de CMS vigente hasta 2026. Los flujos finales deben ser revisados por los líderes clínicos, de cumplimiento, facturación y UHQH Labs de Eastern Medical.'}</p></div><div className="lesson-footer"><button disabled={active===0} onClick={()=>setActive(Math.max(0,active-1))}><ArrowLeft size={17}/>{t.previous}</button><button className="primary" onClick={()=>setActive(Math.min(7,active+1))}>{t.mark}<ArrowRight size={17}/></button></div></main></div></div>
}

function Lesson({course,lang,onBack,onHub,onCertificate,setLang}) {
  const t=UI[lang]; const [active,setActive]=useState(Math.min(4,course.lessons.length-1)); const [answers,setAnswers]=useState({}); const [submitted,setSubmitted]=useState(false);
  const questions=quiz[lang]; const score=questions.reduce((n,q,i)=>n+(answers[i]===q.correct?1:0),0); const pct=Math.round(score/questions.length*100);
  return <div className="lesson-page"><div className="lesson-top"><button onClick={onBack}><ArrowLeft size={18}/>{lang==='en'?'Back to learning':'Volver a aprendizaje'}</button><LanguageSelect lang={lang} setLang={setLang} className="academy-language-select"/><div><span>{t.lessonProgress}</span><div className="progress"><i style={{width:`${Math.round((active+1)/course.lessons.length*100)}%`}}/></div><strong>{active+1}/{course.lessons.length}</strong></div></div><div className="lesson-layout"><aside className="lesson-nav"><button className="lesson-hub-return" onClick={onHub}><HubBrand compact/><span><ArrowLeft size={14}/>{lang==='en'?'Return to Operational Hub':'Regresar a Operational Hub'}</span></button><div className={`lesson-cover ${course.tone}`}><course.icon size={31}/><h3>{course.title[lang]}</h3><span>{course.modules} {t.modules}</span></div><div className="lesson-list">{course.lessons.map((l,i)=><button key={i} className={`${i===active?'active':''} ${i<active?'done':''}`} onClick={()=>{setActive(i);setSubmitted(false);setAnswers({})}}><i>{i<active?<Check size={14}/>:i+1}</i><span><small>{t.lesson} {i+1}</small>{l[lang==='en'?0:1]}</span>{i===active&&<ChevronRight size={17}/>}</button>)}</div></aside><main className="lesson-content"><div className="lesson-breadcrumb"><span>{course.title[lang]}</span><ChevronRight size={14}/><span>{t.lesson} {active+1}</span></div><span className="lesson-kicker"><BookOpen size={15}/>{lang==='en'?'CORE LEARNING':'APRENDIZAJE CENTRAL'}</span><h1>{course.lessons[active][lang==='en'?0:1]}</h1><p className="lead">{lang==='en'?'Every interaction is part of one connected experience. This lesson shows how clear ownership, careful documentation and warm communication keep patients moving safely through their care.':'Cada interacción forma parte de una experiencia conectada. Esta lección muestra cómo la responsabilidad clara, la documentación cuidadosa y la comunicación cálida mantienen al paciente seguro durante su atención.'}</p><div className="learning-objectives"><div className="objective-icon"><Target size={22}/></div><div><h3>{lang==='en'?'By the end of this lesson, you can:':'Al finalizar esta lección, podrás:'}</h3><ul><li>{lang==='en'?'Describe the major stages of the patient journey.':'Describir las etapas principales del recorrido.'}</li><li>{lang==='en'?'Identify the owner and expected outcome of each handoff.':'Identificar al responsable y el resultado de cada transición.'}</li><li>{lang==='en'?'Recognize when a patient or client may qualify for support from another department.':'Reconocer cuándo un paciente o cliente puede cualificar para recibir apoyo de otro departamento.'}</li><li>{lang==='en'?'Document, escalate and follow up using approved workflows.':'Documentar, escalar y dar seguimiento mediante los flujos aprobados.'}</li></ul></div></div><section className="philosophy-panel"><div className="philosophy-heading"><span><Building2 size={17}/>{lang==='en'?'OUR SHARED PHILOSOPHY':'NUESTRA FILOSOFÍA COMPARTIDA'}</span><h2>{lang==='en'?'Know the whole organization. Serve the whole person.':'Conoce toda la organización. Atiende a la persona integralmente.'}</h2><p>{lang==='en'?'Every employee must have a general understanding of every department and service. A Seven Insurance client may qualify for aesthetics, medical care or a chronic care program; an aesthetics or medical patient may need insurance support. We do not diagnose or promise eligibility outside our role—we recognize needs, explain available pathways and make a warm, documented connection to the right team.':'Cada empleado debe tener un conocimiento general de todos los departamentos y servicios. Un cliente de Seven Insurance puede cualificar para estética, atención médica o un programa de condiciones crónicas; y un paciente de estética o medicina puede necesitar apoyo de seguros. No diagnosticamos ni prometemos elegibilidad fuera de nuestra función: reconocemos necesidades, explicamos las opciones disponibles y realizamos una conexión cálida y documentada con el equipo correcto.'}</p></div><div className="ecosystem-grid">{ecosystemConnections.map(({icon:Icon,title,text})=><div key={title.en}><Icon size={20}/><h3>{title[lang]}</h3><p>{text[lang]}</p></div>)}</div><div className="connection-rule"><MessageSquareText size={20}/><p><strong>{lang==='en'?'Listen → recognize → connect → document':'Escuchar → reconocer → conectar → documentar'}</strong>{lang==='en'?'The goal is coordinated service and continuity of care—not pressure or an unsupported promise.':'La meta es ofrecer un servicio coordinado y continuidad de atención, nunca ejercer presión ni hacer promesas sin sustento.'}</p></div></section><h2>{lang==='en'?'One journey, many moments':'Un recorrido, muchos momentos'}</h2><p>{lang==='en'?'Patients do not experience departments—they experience Eastern Medical. A delayed verification, an incomplete note or a missed follow-up can affect every step that comes after it. Our shared standard is simple: own the moment, confirm the handoff and leave the record clear for the next person.':'Los pacientes no experimentan departamentos: experimentan Eastern Medical. Una verificación tardía, una nota incompleta o un seguimiento perdido puede afectar cada paso posterior. Nuestro estándar es simple: responsabilízate del momento, confirma la transición y deja un registro claro.'}</p><div className="journey"><div className="journey-line"/>{patientSteps.map((s,i)=><div key={i}><i>{i<6?<Check size={12}/>:i+1}</i><span>{s[lang==='en'?0:1]}</span></div>)}</div><div className="callout"><div><ShieldCheck size={23}/></div><p><strong>{lang==='en'?'Privacy at every step':'Privacidad en cada paso'}</strong>{lang==='en'?'Access only the information needed for your role. Verify identity before disclosure and use approved systems for documentation and communication.':'Accede solo a la información necesaria para tu función. Verifica la identidad antes de divulgar datos y usa sistemas aprobados.'}</p></div><h2>{lang==='en'?'The Eastern handoff standard':'El estándar Eastern para transiciones'}</h2><div className="handoff-grid"><div><span>01</span><h3>{lang==='en'?'Confirm':'Confirmar'}</h3><p>{lang==='en'?'Verify the patient, need and next step.':'Verifica paciente, necesidad y próximo paso.'}</p></div><div><span>02</span><h3>{lang==='en'?'Document':'Documentar'}</h3><p>{lang==='en'?'Record facts clearly in the approved system.':'Registra los hechos claramente en el sistema.'}</p></div><div><span>03</span><h3>{lang==='en'?'Connect':'Conectar'}</h3><p>{lang==='en'?'Ensure the next owner receives the handoff.':'Asegura que el próximo responsable lo reciba.'}</p></div></div><section className="quiz-section"><span className="lesson-kicker"><ClipboardCheck size={16}/>{t.knowledge}</span><h2>{lang==='en'?'Check your understanding':'Comprueba lo aprendido'}</h2><p>{lang==='en'?'Score 80% or higher to complete this lesson.':'Obtén 80% o más para completar esta lección.'}</p>{questions.map((q,i)=><div className={`question ${submitted?(answers[i]===q.correct?'correct':'incorrect'):''}`} key={i}><h3><span>{i+1}</span>{q.q}</h3><div>{q.a.map((a,j)=><label key={j}><input type="radio" name={`q${i}`} checked={answers[i]===j} onChange={()=>!submitted&&setAnswers({...answers,[i]:j})}/><i>{String.fromCharCode(65+j)}</i>{a}{submitted&&j===q.correct&&<CheckCircle2 size={18}/>}</label>)}</div></div>)}{submitted?<div className={`quiz-result ${pct>=80?'pass':'fail'}`}><div><Award size={36}/></div><div><span>{t.result}</span><strong>{pct}% · {pct>=80?t.passed:t.retry}</strong><p>{pct>=80?(lang==='en'?'Excellent work. This lesson is now complete.':'Excelente trabajo. La lección está completa.'):(lang==='en'?'Review the lesson and try again.':'Repasa la lección e intenta nuevamente.')}</p></div>{pct>=80&&<button className="primary" onClick={onCertificate}>{lang==='en'?'View certificate':'Ver certificado'}<Award size={17}/></button>}</div>:<button className="primary quiz-submit" disabled={Object.keys(answers).length<questions.length} onClick={()=>setSubmitted(true)}>{t.submit}<ArrowRight size={17}/></button>}</section><div className="lesson-footer"><button disabled={active===0} onClick={()=>setActive(Math.max(0,active-1))}><ArrowLeft size={17}/>{t.previous}</button><button className="primary" onClick={()=>setActive(Math.min(course.lessons.length-1,active+1))}>{t.mark}<ArrowRight size={17}/></button></div></main></div></div>
}

function TeamProgress({lang}) {
  const t=UI[lang];
  const [selected,setSelected]=useState(null);
  const [query,setQuery]=useState('');
  const [learners,setLearners]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let active=true;setLoading(true);fetch('/api/academy/records',{cache:'no-store'}).then(async response=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Academy records unavailable');return payload.learners||[]}).then(items=>{if(active)setLearners(items)}).catch(fetchError=>{if(active){setLearners([]);setError(fetchError.message)}}).finally(()=>active&&setLoading(false));return()=>{active=false}},[]);
  const rows=learners.map(item=>{const answers=Number(item.summary?.answerCount||0);const correct=Number(item.summary?.correctAnswerCount||0);const completed=Number(item.summary?.completedCourses||0);const certificateCount=Number(item.summary?.certificateCount||0);const progress=Math.min(100,Math.round((completed/Math.max(1,courses.length))*100));return {id:item.profile.learnerId,name:item.profile.name,email:item.profile.email,initials:String(item.profile.name||'').split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(),progress,score:answers?Math.round((correct/answers)*100):0,last:item.summary?.updatedAt?new Date(item.summary.updatedAt).toLocaleDateString(lang==='en'?'en-US':'es-US'):'—',answers,completed,certificateCount,status:certificateCount?(lang==='en'?'Certified':'Certificado'):completed?(lang==='en'?'In progress':'En progreso'):(lang==='en'?'Not started':'Sin comenzar'),statusKey:certificateCount?'certified':completed?'on-track':'needs-attention'}}).filter(row=>`${row.name} ${row.email} ${row.status}`.toLowerCase().includes(query.trim().toLowerCase()));
  const averageProgress=rows.length?Math.round(rows.reduce((sum,row)=>sum+row.progress,0)/rows.length):0;const assessmentCount=rows.reduce((sum,row)=>sum+row.answers,0);const certificates=rows.reduce((sum,row)=>sum+row.certificateCount,0);
  const exportReport=()=>{const headers=lang==='en'?'Employee,Email,Progress,Score,Last Active,Status':'Empleado,Correo,Progreso,Calificación,Última actividad,Estado';const csv=[headers,...rows.map(row=>[row.name,row.email,`${row.progress}%`,`${row.score}%`,row.last,row.status].map(value=>`"${String(value||'').replaceAll('"','""')}"`).join(','))].join('\n');const anchor=document.createElement('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));anchor.href=url;anchor.download=lang==='en'?'eastern-academy-team-progress.csv':'eastern-academy-progreso-equipo.csv';anchor.click();URL.revokeObjectURL(url)};
  return <div className="page"><div className="page-title"><div><span className="eyebrow">{lang==='en'?'LEARNING OPERATIONS':'OPERACIONES DE APRENDIZAJE'}</span><h1>{t.admin}</h1><p>{lang==='en'?'Server-verified Academy records. No sample learners are shown.':'Expedientes de Academy verificados por el servidor. No se muestran estudiantes de ejemplo.'}</p></div><button className="primary" onClick={exportReport} disabled={!rows.length}><Download size={17}/>{t.export}</button></div><div className="admin-metrics"><Metric icon={Users} label={lang==='en'?'Learner records':'Expedientes de estudiantes'} value={String(learners.length)} delta={lang==='en'?'Verified identities':'Identidades verificadas'} tone="teal"/><Metric icon={GraduationCap} label={lang==='en'?'Completion rate':'Finalización'} value={`${averageProgress}%`} delta={lang==='en'?'From recorded courses':'Desde cursos registrados'} tone="green"/><Metric icon={ClipboardCheck} label={lang==='en'?'Recorded answers':'Respuestas registradas'} value={String(assessmentCount)} delta={lang==='en'?'Individual records only':'Solo expedientes individuales'} tone="blue"/><Metric icon={Award} label={lang==='en'?'Certificates':'Certificados'} value={String(certificates)} delta={lang==='en'?'Archived by employee':'Archivados por empleado'} tone="amber"/></div><section className="team-table card"><div className="table-head"><div><h2>{lang==='en'?'Employee learning status':'Estado de aprendizaje'}</h2><p>{lang==='en'?'Updated from each employee’s protected record.':'Actualizado desde el expediente protegido de cada empleado.'}</p></div><div className="search-box"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={lang==='en'?'Search employees':'Buscar empleados'}/></div></div>{loading?<div className="team-empty">{lang==='en'?'Loading protected Academy records…':'Cargando expedientes protegidos de Academy…'}</div>:error?<div className="team-empty">{error}</div>:<div className="table-scroll"><table><thead><tr><th>{t.employee}</th><th>Email</th><th>{t.progress}</th><th>{t.score}</th><th>{t.lastActive}</th><th>{t.status}</th><th/></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><div className="employee-cell"><div className="avatar">{row.initials}</div><strong>{row.name}</strong></div></td><td>{row.email||'—'}</td><td><div className="table-progress"><div className="progress"><i style={{width:`${row.progress}%`}}/></div><span>{row.progress}%</span></div></td><td><strong>{row.score}%</strong></td><td>{row.last}</td><td><span className={`status ${row.statusKey}`}>{row.status}</span></td><td><button className="icon-btn academy-row-action" onClick={()=>setSelected(row)} title={lang==='en'?'View employee':'Ver empleado'}><ChevronRight size={18}/></button></td></tr>)}{!rows.length&&<tr><td className="team-empty" colSpan="7">{lang==='en'?'No verified learner records match this search.':'Ningún expediente verificado coincide con la búsqueda.'}</td></tr>}</tbody></table></div>}</section>{selected&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setSelected(null)}><section className="quick-modal academy-profile-modal"><div className="modal-heading"><div><span>{lang==='en'?'LEARNER PROFILE':'PERFIL DEL ESTUDIANTE'}</span><h2>{selected.name}</h2></div><button onClick={()=>setSelected(null)} aria-label={lang==='en'?'Close':'Cerrar'}><X size={19}/></button></div><div className="learner-profile-grid"><div><span>Email</span><strong>{selected.email||'—'}</strong></div><div><span>{t.progress}</span><strong>{selected.progress}%</strong></div><div><span>{t.score}</span><strong>{selected.score}%</strong></div><div><span>{t.status}</span><strong>{selected.status}</strong></div></div><div className="modal-actions"><button onClick={()=>setSelected(null)}>{lang==='en'?'Close':'Cerrar'}</button></div></section></div>}</div>
}

function Certificate({lang,onBack,learner}) {
  const t=UI[lang];
  const [archive,setArchive]=useState(null);
  const normalizedLearnerId=learner?.learnerId||'unavailable';
  const courseId=localStorage.getItem(`ema-last-certified-course-${normalizedLearnerId}`)||'foundations';
  const certifiedCourse=courses.find(item=>item.id===courseId)||courses[0];
  const certificateId=`EMA-${normalizedLearnerId.toUpperCase()}-${certifiedCourse.id.toUpperCase()}`;
  const completedAt=new Date().toISOString();
  const completedLabel=new Intl.DateTimeFormat(lang==='en'?'en-US':'es-US',{year:'numeric',month:'long',day:'numeric'}).format(new Date());
  useEffect(()=>{let active=true;fetch(`/api/academy/records/${encodeURIComponent(normalizedLearnerId)}/certificates`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({certificateId,courseId:certifiedCourse.id,courseTitle:certifiedCourse.title[lang],completedAt})}).then(()=>fetch(`/api/academy/records/${encodeURIComponent(normalizedLearnerId)}`)).then(response=>response.ok?response.json():Promise.reject()).then(payload=>{if(active)setArchive(payload)}).catch(()=>null);return()=>{active=false}},[normalizedLearnerId,certificateId,certifiedCourse.id,lang]);
  const download=async()=>{let payload=archive;try{const response=await fetch(`/api/academy/records/${encodeURIComponent(normalizedLearnerId)}`);if(response.ok)payload=await response.json()}catch{}const record=payload||{profile:{learnerId:normalizedLearnerId,name:learner?.name||'Employee',email:learner?.email||''},record:{certificateId,courseId:certifiedCourse.id,courseTitle:certifiedCourse.title[lang],status:'completed'}};const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${normalizedLearnerId}-academy-record.json`;a.click();URL.revokeObjectURL(url)};
  const employeeName=archive?.profile?.name||learner?.name||'Employee';
  const photoUrl=archive?.profile?.photoUrl||`/api/academy/records/${encodeURIComponent(normalizedLearnerId)}/photo`;
  return <div className="page certificate-page"><div className="certificate-actions"><button onClick={onBack}><ArrowLeft size={17}/>{lang==='en'?'Back':'Volver'}</button><div><button onClick={download}><Download size={17}/>{t.download}</button><button className="primary" onClick={()=>window.print()}><FileCheck2 size={17}/>{t.print}</button></div></div><div className="certificate"><div className="cert-border"><div className="cert-corner tl"/><div className="cert-corner tr"/><div className="cert-corner bl"/><div className="cert-corner br"/><Brand/><img className="certificate-photo" src={photoUrl} alt={employeeName} onError={event=>{event.currentTarget.style.display='none'}}/><div className="certificate-seal"><Award size={46}/></div><span className="cert-overline">{t.certificate}</span><h1>{t.certifies}</h1><h2>{employeeName}</h2><div className="cert-line"/><p>{t.certifiedText}</p><h3>{certifiedCourse.title[lang]}</h3><div className="cert-details"><div><strong>{completedLabel}</strong><span>{lang==='en'?'Date completed':'Fecha de finalización'}</span></div><div className="seal-small"><HeartPulse size={25}/></div><div><strong>{certificateId}</strong><span>{lang==='en'?'Certificate ID':'ID del certificado'}</span></div></div><div className="signature-row"><div><i>{lang==='en'?'Training Direction':'Dirección de Capacitación'}</i><span>{lang==='en'?'Academy authorization':'Autorización de Academy'}</span></div><div><i>________________</i><span>{lang==='en'?'Supervisor approval':'Aprobación del supervisor'}</span></div></div></div></div><p className="certificate-note"><ShieldCheck size={16}/>{archive?(lang==='en'?'Archived in the employee’s individual Academy record.':'Archivado en el expediente individual de Academy del colaborador.'):(lang==='en'?'The certificate will be archived when the Academy backend is available.':'El certificado se archivará cuando el backend de Academy esté disponible.')}</p></div>
}

const emptyOperationalData=()=>({providers:[],contracts:[],licenses:[],entities:[],status:emmsoSourceStatus});

const workspaceScopeForPage = page => {
  const context = parseEntityPage(page);
  if (context) return `entity-${context.definition.key}`;
  return ({
    hub: 'hub', it: 'it', corporate: 'corporate', leads: 'leads', protocols: 'protocols',
    licenses: 'licenses', 'doctor-licenses': 'doctor-licenses', credentialing: 'credentialing',
    contracting: 'contracting', 'research-agreements': 'research', staff: 'human-resources',
    users: 'admin-users', academy: 'academy', learning: 'learning', systems: 'systems',
    certificates: 'certificates', team: 'team',
  })[page] || page;
};

const workspaceSectionLabel = (page, lang) => {
  const labels = {
    hub: ['Operational Hub', 'Operational Hub'], it: ['IT', 'IT'], corporate: ['Corporate Executive Workspace', 'Espacio Ejecutivo Corporate'],
    leads: ['Leads', 'Leads'], protocols: ['Operational Protocols', 'Protocolos Operacionales'], licenses: ['Licenses', 'Licencias'],
    'doctor-licenses': ['Doctor Licenses', 'Licencias Médicas'], credentialing: ['Credentialing', 'Credentialing'], contracting: ['Contracting', 'Contratación'],
    research: ['Eastern Medical Research', 'Eastern Medical Research'], staff: ['Human Resources', 'Recursos Humanos'], users: ['Administration', 'Administración'],
    academy: ['Academy', 'Academy'], learning: ['Learning Library', 'Biblioteca de Aprendizaje'], systems: ['Systems Training', 'Capacitación de Sistemas'],
    certificates: ['Certificates', 'Certificados'], team: ['Team Progress', 'Progreso del Equipo'],
  };
  const entity = parseEntityPage(page);
  if (entity) return entity.definition.name;
  const label = labels[workspaceScopeForPage(page)] || labels[page];
  return label ? label[lang === 'es' ? 1 : 0] : page;
};

function App(){
  const invitationToken=new URLSearchParams(globalThis.location?.search||'').get('invite')||'';
  const employeePackageToken=new URLSearchParams(globalThis.location?.search||'').get('employee_package')||'';
  const [session,setSession]=useState(null);
  const [sessionReady,setSessionReady]=useState(false);
  const activeLearner=session?{...session,learnerId:session.learnerId||`learner-${String(session.email||session.name||'employee').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)}`} : null;
  const [lang,setLang]=useState(()=>localStorage.getItem('ema-language')||'en');
  const [operationalData,setOperationalData]=useState(emptyOperationalData);
  const [academyRecord,setAcademyRecord]=useState(null);
  const academyOnly=session?.scope==='academy';
  const canAccessCorporate=canSessionAccessPage(session,'corporate');
  const canAccessAdmin=canSessionAccessPage(session,'roadmap');
  const canAccessPage=target=>canSessionAccessPage(session,target);
  const canManageUsers=canSessionManagePage(session,'users');
  const canManageAcademy=canSessionManagePage(session,'academy');
  const canManageHumanResources=canSessionManagePage(session,'staff');
  const canManageCredentialing=canSessionManagePage(session,'credentialing');
  const canManageContracting=canSessionManagePage(session,'contracting');
  const accessSignature=sessionAccessSignature(session);
  const [page,setPage]=useState(()=>{const stored=(localStorage.getItem('ema-active-page')||firstAccessiblePage(session));const normalized=stored==='aca'?'doctor-licenses':stored==='roadmap'?'it':stored;return canSessionAccessPage(session,normalized)?normalized:firstAccessiblePage(session)});
  const [appBackStack,setAppBackStack]=useState([]);
  const [appForwardStack,setAppForwardStack]=useState([]);
  const entityContext=parseEntityPage(page);
  const [course,setCourse]=useState(()=>{const activeId=sessionStorage.getItem('ema-active-course');return courses.find(item=>item.id===activeId)||null}); const [mobile,setMobile]=useState(false);
  useEffect(()=>{
    if(invitationToken){setSessionReady(true);return}
    let active=true;
    const refreshSession=()=>fetch('/api/auth/session',{cache:'no-store'}).then(async response=>{
      if(!response.ok)return null;
      const payload=await response.json();
      return payload.session||null;
    }).then(serverSession=>{
      if(!active)return;
      localStorage.removeItem('ema-session');
      if(serverSession){
        localStorage.removeItem('ema-demo-login');
        setSession(current=>sessionAccessSignature(current)===sessionAccessSignature(serverSession)?current:serverSession);
        setPage(current=>canSessionAccessPage(serverSession,current)?current:firstAccessiblePage(serverSession));
      }else{
        setSession(null);setPage('');setCourse(null);sessionStorage.removeItem('ema-active-course');
      }
    }).catch(()=>null).finally(()=>active&&setSessionReady(true));
    refreshSession();
    const interval=globalThis.setInterval(refreshSession,10000);
    const onFocus=()=>refreshSession();
    const onVisibility=()=>{if(document.visibilityState==='visible')refreshSession()};
    const onStorage=event=>{if(event.key==='operational-hub-access-updated')refreshSession()};
    globalThis.addEventListener('focus',onFocus);
    globalThis.addEventListener('storage',onStorage);
    document.addEventListener('visibilitychange',onVisibility);
    return()=>{active=false;globalThis.clearInterval(interval);globalThis.removeEventListener('focus',onFocus);globalThis.removeEventListener('storage',onStorage);document.removeEventListener('visibilitychange',onVisibility)};
  },[invitationToken]);
  useEffect(()=>{setAcademyRecord(null);if(!activeLearner?.learnerId||!canSessionAccessPage(session,'academy'))return;let active=true;fetch('/api/academy/records/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({learnerId:activeLearner.learnerId,name:activeLearner.name||'Employee',email:activeLearner.email||''})}).then(response=>{if(!response.ok)throw new Error();return fetch(`/api/academy/records/${encodeURIComponent(activeLearner.learnerId)}`,{cache:'no-store'})}).then(response=>response.ok?response.json():Promise.reject()).then(payload=>{if(active)setAcademyRecord(payload)}).catch(()=>{if(active)setAcademyRecord(null)});return()=>{active=false}},[activeLearner?.learnerId,activeLearner?.name,activeLearner?.email,accessSignature]);
  useEffect(()=>{setOperationalData(emptyOperationalData());if(!session||!['dashboard','contracting','credentialing','licenses','doctor-licenses','human-resources','entity-medical','entity-care305','entity-aesthetics','entity-seven','entity-research'].some(key=>['view','manage'].includes(session.permissions?.[key]))&&session.role!=='admin'&&session.role!=='owner'&&session.scope!=='full')return;let active=true;fetch('/api/operational/airtable/snapshot',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json()}).then(payload=>{if(!active)return;setOperationalData({providers:payload.providers||[],contracts:payload.contracts||[],licenses:payload.licenses||[],entities:payload.entities||[],status:{...emmsoSourceStatus,...payload.status}})}).catch(()=>{if(active)setOperationalData(emptyOperationalData())});return()=>{active=false}},[accessSignature]);
  const applyOperationalSnapshot=payload=>setOperationalData({providers:payload?.providers||[],contracts:payload?.contracts||[],licenses:payload?.licenses||[],entities:payload?.entities||[],status:{...emmsoSourceStatus,...payload?.status}});
  useEffect(()=>{if(!session)return;const destination=firstAccessiblePage(session);if(course&&!canSessionAccessPage(session,'academy')){sessionStorage.removeItem('ema-active-course');setCourse(null)}if(!canSessionAccessPage(session,page)&&destination){localStorage.setItem('ema-active-page',destination);setPage(destination)}},[accessSignature,page,course]);
  const setLanguage=value=>{localStorage.setItem('ema-language',value);setLang(value)};
  const login=async({email='',password='',photoDataUrl=''})=>{
    try {
      const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
      const payload=await response.json();
      if(!response.ok)return {ok:false,error:payload.error};
      const next=payload.session;
      localStorage.removeItem('ema-session');localStorage.removeItem('ema-demo-login');
      setSession(next);setPage(firstAccessiblePage(next));setSessionReady(true);
      if(photoDataUrl)fetch('/api/academy/records/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({learnerId:next.learnerId,name:next.name,email:next.email,photoDataUrl})}).catch(()=>null);
      return {ok:true};
    } catch {
      return {ok:false,error:lang==='en'?'The sign-in service is not available right now.':'El servicio de acceso no está disponible en este momento.'};
    }
  };
  const logout=async()=>{
    fetch('/api/auth/logout',{method:'POST'}).catch(()=>null);
    localStorage.removeItem('ema-session');localStorage.removeItem('ema-demo-login');localStorage.removeItem('ema-active-page');sessionStorage.removeItem('ema-active-course');
    setOperationalData(emptyOperationalData());setAcademyRecord(null);setSession(null);setCourse(null);setSessionReady(true);
  };
  const acceptInvitation=next=>{
    globalThis.history?.replaceState({},'',globalThis.location?.pathname||'/');
    localStorage.removeItem('ema-session');localStorage.removeItem('ema-demo-login');
    setSession(next);setPage(firstAccessiblePage(next));setSessionReady(true);
  };
  const openCourse=selected=>{sessionStorage.setItem('ema-active-course',selected.id);localStorage.setItem('ema-active-page','learning');setCourse(selected);setPage('learning')};
  const closeCourse=()=>{sessionStorage.removeItem('ema-active-course');setCourse(null)};
  const navigate=target=>{const requested=target==='aca'?'doctor-licenses':target==='roadmap'?'it':target;if(!canAccessPage(requested)||requested===page)return;setAppBackStack(current=>[...current,page].slice(-40));setAppForwardStack([]);sessionStorage.removeItem('ema-active-course');localStorage.setItem('ema-active-page',requested);setCourse(null);setPage(requested)};
  const moveAppHistory=direction=>{
    const source=direction<0?appBackStack:appForwardStack;
    if(!source.length)return;
    const destination=source[source.length-1];
    if(direction<0){
      setAppBackStack(current=>current.slice(0,-1));
      setAppForwardStack(current=>[...current,page].slice(-40));
    }else{
      setAppForwardStack(current=>current.slice(0,-1));
      setAppBackStack(current=>[...current,page].slice(-40));
    }
    sessionStorage.removeItem('ema-active-course');localStorage.setItem('ema-active-page',destination);setCourse(null);setPage(destination);
  };
  const returnHome=()=>{const destination=academyOnly?'academy':canAccessPage('hub')?'hub':firstAccessiblePage(session);sessionStorage.removeItem('ema-active-course');localStorage.setItem('ema-active-page',destination);setCourse(null);setPage(destination)};
  if(employeePackageToken)return <EmployeePackagePortal token={employeePackageToken} lang={lang} setLang={setLanguage}/>;
  if(invitationToken)return <InvitationSetup token={invitationToken} lang={lang} setLang={setLanguage} onAccepted={acceptInvitation}/>;
  if(!sessionReady)return <div className="invitation-shell"><section className="invitation-card"><div className="invitation-brand"><span><ShieldCheck/></span><div><strong>Operational Hub</strong><small>EM GROUP</small></div></div><div className="invitation-loading"><Clock3/><p>{lang==='en'?'Restoring your secure session…':'Restaurando tu sesión segura…'}</p></div></section></div>;
  if(!session)return <Login onLogin={login} lang={lang} setLang={setLanguage}/>;
  if(!firstAccessiblePage(session))return <div className="invitation-shell"><section className="invitation-card"><div className="invitation-brand"><span><LockKeyhole/></span><div><strong>Operational Hub</strong><small>EM GROUP</small></div></div><div className="invitation-invalid"><AlertTriangle/><h1>{lang==='en'?'No sections assigned':'No hay secciones asignadas'}</h1><p>{lang==='en'?'Your account is active but has no authorized section. Contact an administrator.':'Tu cuenta está activa, pero no tiene ninguna sección autorizada. Contacta a un administrador.'}</p><button className="invitation-submit" onClick={logout}>{lang==='en'?'Sign out':'Cerrar sesión'}</button></div></section></div>;
  if(course?.source==='airtable'&&canAccessPage('academy'))return <><AirtableCourseDetail course={course} lang={lang} setLang={setLanguage} onBack={closeCourse} onHub={returnHome} academyOnly={academyOnly} learner={activeLearner}/><AIAssistant lang={lang} page={`academy:${course.id}`} onNavigate={navigate}/></>;
  if(course&&canAccessPage('academy'))return <><AcademyLesson course={course} lang={lang} setLang={setLanguage} onBack={closeCourse} onHub={returnHome} academyOnly={academyOnly} learner={activeLearner} onCertificate={()=>{localStorage.setItem(`ema-last-certified-course-${activeLearner.learnerId}`,course.id);navigate('certificates')}}/><AIAssistant lang={lang} page={`academy:${course.id}`} onNavigate={navigate}/></>;
  if(entityContext)return <div className="app-shell">
    <Sidebar page={page} setPage={navigate} lang={lang} onLogout={logout} academyOnly={academyOnly} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} session={session}/>
    {mobile&&<><div className="mobile-overlay" onClick={()=>setMobile(false)}/><Sidebar mobile page={page} setPage={navigate} lang={lang} onLogout={logout} close={()=>setMobile(false)} academyOnly={academyOnly} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} session={session}/></>}
    <div className="main-shell"><Header lang={lang} setLang={setLanguage} onMenu={()=>setMobile(true)} onNavigate={navigate} currentPage={page} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage}/><main><AppNavigationBar lang={lang} page={page} canBack={appBackStack.length>0} canForward={appForwardStack.length>0} onBack={()=>moveAppHistory(-1)} onForward={()=>moveAppHistory(1)}/><EntityWorkspace definition={entityContext.definition} section={entityContext.section} lang={lang} onNavigate={navigate} staffRows={operationalData.providers} canAccessPage={canAccessPage} renderLeads={()=>(entityContext.definition.key==='research'?<ResearchModule lang={lang} session={session}/>:<Leads lang={lang} initialService={entityContext.definition.service} businessTitle={entityContext.definition.name} embedded/>)} />{!(entityContext.definition.key==='research'&&entityContext.section==='workspace')&&<WorkspaceResources scopeKey={workspaceScopeForPage(page)} lang={lang} sectionLabel={workspaceSectionLabel(page,lang)}/>}</main><AIAssistant lang={lang} page={page} onNavigate={navigate}/><footer className="prototype-note"><ShieldCheck size={13}/>{lang==='en'?'Operational source · Airtable EM-MSO':'Fuente operacional · Airtable EM-MSO'}</footer></div>
  </div>;
  if(page==='protocols')return <div className="app-shell">
    <Sidebar page={page} setPage={navigate} lang={lang} onLogout={logout} academyOnly={academyOnly} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} session={session}/>
    {mobile&&<><div className="mobile-overlay" onClick={()=>setMobile(false)}/><Sidebar mobile page={page} setPage={navigate} lang={lang} onLogout={logout} close={()=>setMobile(false)} academyOnly={academyOnly} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} session={session}/></>}
    <div className="main-shell"><Header lang={lang} setLang={setLanguage} onMenu={()=>setMobile(true)} onNavigate={navigate} currentPage={page} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage}/><main><AppNavigationBar lang={lang} page={page} canBack={appBackStack.length>0} canForward={appForwardStack.length>0} onBack={()=>moveAppHistory(-1)} onForward={()=>moveAppHistory(1)}/><OperationalProtocols lang={lang}/><WorkspaceResources scopeKey={workspaceScopeForPage(page)} lang={lang} sectionLabel={workspaceSectionLabel(page,lang)}/></main><AIAssistant lang={lang} page={page} onNavigate={navigate}/><footer className="prototype-note"><ShieldCheck size={13}/>{lang==='en'?'Prototype · Operational data requires final validation':'Prototipo · Los datos operativos requieren validación final'}</footer></div>
  </div>;
  return <div className="app-shell">
    <Sidebar page={page} setPage={navigate} lang={lang} onLogout={logout} academyOnly={academyOnly} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} session={session}/>
    {mobile&&<><div className="mobile-overlay" onClick={()=>setMobile(false)}/><Sidebar mobile page={page} setPage={navigate} lang={lang} onLogout={logout} close={()=>setMobile(false)} academyOnly={academyOnly} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} session={session}/></>}
    <div className="main-shell"><Header lang={lang} setLang={setLanguage} onMenu={()=>setMobile(true)} onNavigate={navigate} currentPage={page} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage}/><main>
      <AppNavigationBar lang={lang} page={page} canBack={appBackStack.length>0} canForward={appForwardStack.length>0} onBack={()=>moveAppHistory(-1)} onForward={()=>moveAppHistory(1)}/>
      {page==='hub'&&<HubDashboard lang={lang} setPage={navigate} operationalData={operationalData} canAccessCorporate={canAccessCorporate} canAccessAdmin={canAccessAdmin} canAccessPage={canAccessPage} canAccessApplication={applicationId=>canSessionAccessApplication(session,applicationId)}/>} {page==='it'&&<ITWorkspace lang={lang} session={session} canAccessAdmin={canAccessAdmin}/>} {page==='leads'&&<Leads lang={lang}/>} {page==='licenses'&&<Licenses lang={lang} licenseRowsData={operationalData.licenses} staffRowsData={operationalData.providers} sourceStatus={operationalData.status}/>} {page==='doctor-licenses'&&<Licenses lang={lang} initialCategory="doctors" licenseRowsData={operationalData.licenses} staffRowsData={operationalData.providers} sourceStatus={operationalData.status}/>} {page==='credentialing'&&<CredentialingCenter lang={lang} providers={operationalData.providers} entities={operationalData.entities} sourceStatus={operationalData.status} canManage={canManageCredentialing} onSnapshot={applyOperationalSnapshot}/>} {page==='contracting'&&<ContractingCenter lang={lang} contracts={operationalData.contracts} entities={operationalData.entities} sourceStatus={operationalData.status} canManage={canManageContracting} onSnapshot={applyOperationalSnapshot}/>} {page==='research-agreements'&&<ResearchAgreements lang={lang} session={session}/>} {page==='staff'&&<HumanResources lang={lang} employees={operationalData.providers} sourceStatus={operationalData.status} session={session} canManage={canManageHumanResources}/>} {page==='corporate'&&canAccessCorporate&&<CorporateHub lang={lang} ownerName={session?.name}/>} {page==='users'&&<ServerUsersAdministration lang={lang} session={session} canManage={canManageUsers}/>} {page==='academy'&&<Dashboard lang={lang} onOpen={openCourse} setPage={navigate} session={session} canManageAcademy={canManageAcademy} academyRecord={academyRecord}/>} {page==='learning'&&<Library lang={lang} onOpen={openCourse} academyRecord={academyRecord}/>} {page==='systems'&&<SystemsTraining lang={lang} onOpen={openCourse}/>} {page==='certificates'&&<Certificate lang={lang} learner={activeLearner} onBack={()=>navigate('academy')}/>} {page==='team'&&canManageAcademy&&<TeamProgress lang={lang}/>}
      <WorkspaceResources scopeKey={workspaceScopeForPage(page)} lang={lang} sectionLabel={workspaceSectionLabel(page,lang)}/>
    </main><AIAssistant lang={lang} page={page} onNavigate={navigate}/><footer className="prototype-note"><ShieldCheck size={13}/>{lang==='en'?'Operational source · Airtable EM-MSO':'Fuente operacional · Airtable EM-MSO'}</footer></div>
  </div>
}

const operationalHubRoot=globalThis.__operationalHubReactRoot||(globalThis.__operationalHubReactRoot=createRoot(document.getElementById('root')));
operationalHubRoot.render(<App/>);
