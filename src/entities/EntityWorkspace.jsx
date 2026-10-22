import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Building2, CheckCircle2,
  ClipboardCheck, FileText, GraduationCap, HeartPulse, MapPin, ShieldCheck,
  Sparkles, Stethoscope, Target, UserRound, UsersRound,
} from 'lucide-react';
import './entity-workspace.css';
import './research-workspace.css';

const bilingual=(en,es)=>({en,es});

export const entityDefinitions={
  seven:{
    key:'seven',name:'Seven Insurance',icon:ShieldCheck,logo:'/brand/seven-insurance.png',tone:'insurance',service:'insurance',
    eyebrow:bilingual('INSURANCE ENTITY','ENTIDAD DE SEGUROS'),
    summary:bilingual('The operational home for licensed insurance work, enrollment, renewals, client service and compliant follow-up.','El hogar operacional del trabajo de seguros licenciado, inscripciones, renovaciones, servicio al cliente y seguimiento conforme.'),
    profile:{legalName:'Seven Insurance Corporation',primaryAddress:'8900 SW 24th Street, Suite 202, Miami, FL 33165',npi:bilingual('Not applicable · insurance agency','No aplica · agencia de seguros'),taxId:bilingual('Restricted · verified source not connected','Restringido · fuente verificada no conectada')},
    structure:bilingual('Departments','Departamentos'),
    departments:[
      {name:bilingual('Sales & Enrollment','Ventas e Inscripciones'),text:bilingual('Licensed plan education, eligibility review, applications and enrollment documentation.','Educación de planes por personal licenciado, revisión de elegibilidad, solicitudes y documentación de inscripción.'),owner:bilingual('Licensed agents','Agentes licenciados')},
      {name:bilingual('Retention & Renewals','Retención y Renovaciones'),text:bilingual('Policy maintenance, renewal outreach, life-event changes and coverage continuity.','Mantenimiento de pólizas, contacto de renovaciones, cambios por eventos de vida y continuidad de cobertura.'),owner:bilingual('Retention team','Equipo de retención')},
      {name:bilingual('Client Service','Servicio al Cliente'),text:bilingual('Document requests, carrier follow-up, member questions and issue ownership.','Solicitud de documentos, seguimiento con carriers, preguntas de miembros y resolución de asuntos.'),owner:bilingual('Service team','Equipo de servicio')},
      {name:bilingual('Compliance & Licensing','Cumplimiento y Licencias'),text:bilingual('Agent licensing, Marketplace readiness, required attestations and audit controls.','Licencias de agentes, preparación para Marketplace, atestaciones requeridas y controles de auditoría.'),owner:bilingual('Compliance','Cumplimiento')},
    ],
    services:[
      {name:bilingual('Coverage review','Revisión de cobertura'),text:bilingual('Review the client’s current coverage, stated needs and available authorized options without guaranteeing eligibility or savings.','Revisar la cobertura actual, necesidades declaradas y opciones autorizadas sin garantizar elegibilidad ni ahorros.')},
      {name:bilingual('Marketplace enrollment','Inscripción en Marketplace'),text:bilingual('Collect required household information, consent and documents for a licensed enrollment workflow.','Recopilar información del hogar, consentimiento y documentos para un proceso de inscripción licenciado.')},
      {name:bilingual('Policy changes & renewals','Cambios y renovaciones'),text:bilingual('Manage qualifying changes, annual renewals and continuity follow-up through approved systems.','Gestionar cambios cualificantes, renovaciones anuales y seguimiento de continuidad en sistemas aprobados.')},
      {name:bilingual('Member support','Apoyo al miembro'),text:bilingual('Help route ID cards, carrier questions, coverage documents and service issues to the correct owner.','Canalizar tarjetas, preguntas del carrier, documentos de cobertura y asuntos de servicio al responsable correcto.')},
    ],
    roles:[bilingual('Licensed Insurance Agent','Agente de Seguros Licenciado'),bilingual('Enrollment Specialist','Especialista de Inscripciones'),bilingual('Retention Specialist','Especialista de Retención'),bilingual('Customer Service','Servicio al Cliente'),bilingual('Compliance Manager','Manager de Cumplimiento')],
    resources:[
      {page:'licenses',icon:ShieldCheck,title:bilingual('Licensing & ACA','Licencias y ACA'),text:bilingual('Agency, agent and ACA compliance records.','Registros de cumplimiento de agencia, agentes y ACA.')},
      {page:'contracting',icon:ClipboardCheck,title:bilingual('Carrier Contracting','Contratación con carriers'),text:bilingual('Appointments, agreements and renewals.','Nombramientos, acuerdos y renovaciones.')},
      {page:'academy',icon:GraduationCap,title:bilingual('Insurance Training','Capacitación de Seguros'),text:bilingual('Required Seven Insurance learning path.','Ruta formativa obligatoria de Seven Insurance.')},
    ],
  },
  aesthetics:{
    key:'aesthetics',name:'Eastern Medical Aesthetics',icon:Sparkles,tone:'aesthetics',service:'aesthetics',
    eyebrow:bilingual('AESTHETICS ENTITY','ENTIDAD DE ESTÉTICA'),
    summary:bilingual('The operational home for consultations, aesthetic services, client experience, treatment follow-up and conversion.','El hogar operacional de consultas, servicios estéticos, experiencia del cliente, seguimiento de tratamientos y conversión.'),
    profile:{legalName:'Eastern Medical Aesthetics',primaryAddress:'8900 SW 24th Street, Suite 202, Miami, FL 33165',npi:bilingual('Pending verified credentialing source','Pendiente de fuente verificada de credentialing'),taxId:bilingual('Restricted · verified source not connected','Restringido · fuente verificada no conectada')},
    structure:bilingual('Departments','Departamentos'),
    departments:[
      {name:bilingual('Consultation & Sales','Consultas y Ventas'),text:bilingual('Lead response, consultation preparation, needs discovery, approved education and follow-up.','Respuesta a leads, preparación de consulta, identificación de necesidades, educación aprobada y seguimiento.'),owner:bilingual('Aesthetics consultation team','Equipo de consultas de estética')},
      {name:bilingual('Injectables','Inyectables'),text:bilingual('Provider-led evaluation, consent, treatment documentation and post-care instructions.','Evaluación por proveedor, consentimiento, documentación del tratamiento e instrucciones posteriores.'),owner:bilingual('Licensed clinical team','Equipo clínico licenciado')},
      {name:bilingual('Skin & Device Treatments','Piel y Tratamientos con Equipos'),text:bilingual('Facials, skin-health services and device-based treatments according to approved scope.','Faciales, servicios de salud de la piel y tratamientos con equipos según el alcance aprobado.'),owner:bilingual('Aesthetics clinical team','Equipo clínico de estética')},
      {name:bilingual('Wellness & Weight Management','Bienestar y Control de Peso'),text:bilingual('Authorized wellness programs, vitamin shots and weight-management coordination.','Programas autorizados de bienestar, shots de vitaminas y coordinación de control de peso.'),owner:bilingual('Wellness team','Equipo de bienestar')},
      {name:bilingual('Client Follow-up','Seguimiento al Cliente'),text:bilingual('Post-service calls, next appointment, retention, reviews and unresolved concern ownership.','Llamadas posteriores, próxima cita, retención, reviews y atención de asuntos pendientes.'),owner:bilingual('Client experience','Experiencia del cliente')},
    ],
    services:[
      {name:bilingual('Aesthetic consultations','Consultas estéticas'),text:bilingual('Structured needs discovery and provider evaluation before recommending a treatment plan.','Identificación estructurada de necesidades y evaluación del proveedor antes de recomendar un plan.')},
      {name:bilingual('Injectables','Inyectables'),text:bilingual('Provider-authorized injectable services with consent, documentation and follow-up.','Servicios inyectables autorizados por proveedor con consentimiento, documentación y seguimiento.')},
      {name:bilingual('Skin health','Salud de la piel'),text:bilingual('Facial and skin-care services selected after an appropriate consultation.','Servicios faciales y de cuidado de la piel seleccionados después de la consulta correspondiente.')},
      {name:bilingual('Device-based treatments','Tratamientos con equipos'),text:bilingual('Energy- or device-based procedures performed only within approved clinical scope.','Procedimientos con energía o equipos realizados únicamente dentro del alcance clínico aprobado.')},
      {name:bilingual('Weight & wellness programs','Programas de peso y bienestar'),text:bilingual('Coordinated programs with clinical assessment, documented follow-up and approved education.','Programas coordinados con evaluación clínica, seguimiento documentado y educación aprobada.')},
    ],
    roles:[bilingual('Aesthetics Provider','Proveedor de Estética'),bilingual('Aesthetics Medical Assistant','Asistente Médico de Estética'),bilingual('Consultation Specialist','Especialista de Consultas'),bilingual('Client Experience Coordinator','Coordinador de Experiencia'),bilingual('Department Manager','Manager del Departamento')],
    resources:[
      {page:'protocols',icon:FileText,title:bilingual('Aesthetics Protocols','Protocolos de Estética'),text:bilingual('Informational operating standards and duties.','Estándares operacionales y responsabilidades.')},
      {page:'licenses',icon:ShieldCheck,title:bilingual('Licenses & Compliance','Licencias y Cumplimiento'),text:bilingual('Facility, provider and safety records.','Registros de centro, proveedores y seguridad.')},
      {page:'academy',icon:GraduationCap,title:bilingual('Aesthetics Training','Capacitación de Estética'),text:bilingual('Expanded course and service curriculum.','Curso ampliado y currículo de servicios.')},
    ],
  },
  care305:{
    key:'care305',name:'305 Medical Care',icon:HeartPulse,tone:'care305',service:'care305',
    eyebrow:bilingual('INDEPENDENT MEDICAL ENTITY','ENTIDAD MÉDICA INDEPENDIENTE'),
    summary:bilingual('An autonomous affiliated medical entity with its own operations, patient records, services, team, leads and compliance responsibilities.','Una entidad médica afiliada que funciona autónomamente, con sus propias operaciones, expedientes, servicios, equipo, leads y responsabilidades de cumplimiento.'),
    profile:{legalName:'305 Medical Care',primaryAddress:'8900 SW 24th Street, Miami, FL 33165',npi:bilingual('Pending verified credentialing source','Pendiente de fuente verificada de credentialing'),taxId:bilingual('Restricted · verified source not connected','Restringido · fuente verificada no conectada')},
    structure:bilingual('Departments','Departamentos'),
    departments:[
      {name:bilingual('Front Desk & Patient Access','Front Desk y Acceso del Paciente'),text:bilingual('Scheduling, check-in, insurance verification, copays, checkout and next-appointment ownership.','Citas, check-in, verificación de seguro, copagos, check-out y responsabilidad de la próxima cita.'),owner:bilingual('305 Medical Care Front Desk','Front Desk de 305 Medical Care')},
      {name:bilingual('Clinical Operations','Operaciones Clínicas'),text:bilingual('Rooming, clinical support, inventory, documentation readiness and provider workflow.','Preparación del paciente, apoyo clínico, inventario, documentación y flujo del proveedor.'),owner:bilingual('Clinical team','Equipo clínico')},
      {name:bilingual('Patient Coordination','Coordinación de Pacientes'),text:bilingual('Referrals, results routing, follow-up, transportation and continuity of care.','Referidos, canalización de resultados, seguimiento, transportación y continuidad de atención.'),owner:bilingual('Patient coordination','Coordinación de pacientes')},
      {name:bilingual('Billing & Authorizations','Facturación y Autorizaciones'),text:bilingual('Eligibility, benefits, prior authorizations, clean claims and denial follow-up.','Elegibilidad, beneficios, autorizaciones previas, claims limpios y seguimiento de denegaciones.'),owner:bilingual('Revenue cycle','Revenue cycle')},
      {name:bilingual('Quality & Office Management','Calidad y Gerencia de Oficina'),text:bilingual('Daily operations, staffing, supplies, compliance controls and unresolved issue escalation.','Operaciones diarias, personal, suministros, controles de cumplimiento y escalación de asuntos pendientes.'),owner:bilingual('Office Manager','Office Manager')},
    ],
    services:[
      {name:bilingual('Primary care','Atención primaria'),text:bilingual('Adult general medicine, preventive visits and documented follow-up under the entity’s own records.','Medicina general para adultos, visitas preventivas y seguimiento documentado bajo los expedientes de la entidad.')},
      {name:bilingual('Preventive programs','Programas preventivos'),text:bilingual('Annual Physicals, health-gap follow-up and coordinated preventive services.','Annual Physicals, seguimiento de brechas y servicios preventivos coordinados.')},
      {name:bilingual('Chronic condition follow-up','Seguimiento de condiciones crónicas'),text:bilingual('Structured continuity for eligible patients with documented clinical ownership.','Continuidad estructurada para pacientes elegibles con responsabilidad clínica documentada.')},
      {name:bilingual('Laboratory, referrals & diagnostics','Laboratorio, referidos y diagnósticos'),text:bilingual('Orders, authorizations, result routing and specialist coordination.','Órdenes, autorizaciones, canalización de resultados y coordinación de especialistas.')},
      {name:bilingual('Telemedicine & transportation','Telemedicina y transportación'),text:bilingual('Approved remote-care and transportation workflows connected to a scheduled visit.','Flujos aprobados de atención remota y transportación vinculados a una cita programada.')},
    ],
    roles:[bilingual('Medical Providers','Proveedores Médicos'),bilingual('Front Desk','Front Desk'),bilingual('Medical Assistants','Asistentes Médicos'),bilingual('Patient Coordinators','Coordinadores de Pacientes'),bilingual('Billing & Authorizations','Facturación y Autorizaciones'),bilingual('Office Manager','Office Manager')],
    resources:[
      {page:'protocols',icon:FileText,title:bilingual('Operational Protocols','Protocolos Operacionales'),text:bilingual('Office, clinical and administrative duties.','Funciones de oficina, clínicas y administrativas.')},
      {page:'licenses',icon:ShieldCheck,title:bilingual('Entity Compliance','Cumplimiento de la Entidad'),text:bilingual('Facility, occupational and safety records.','Registros de centro, ocupacionales y de seguridad.')},
      {page:'academy',icon:GraduationCap,title:bilingual('Medical Training','Capacitación Médica'),text:bilingual('Medical-office and service curriculum.','Currículo de oficina médica y servicios.')},
    ],
  },
  research:{
    key:'research',name:'Eastern Medical Research',icon:Target,tone:'research',service:'research',
    eyebrow:bilingual('CLINICAL RESEARCH ENTITY','ENTIDAD DE INVESTIGACIÓN CLÍNICA'),
    summary:bilingual('The independent research operation based in Fort Myers for sponsor studies, patient identification, pre-screening, consent, study visits and regulatory execution.','La operación independiente de investigación con sede en Fort Myers para estudios de farmacéuticas, identificación de pacientes, pre-screening, consentimiento, visitas y ejecución regulatoria.'),
    profile:{legalName:'Eastern Medical Research',primaryAddress:'19451 S. Tamiami Trail, Suites 109–110, Fort Myers, FL 33908',npi:bilingual('Applicability and identifier pending verification','Aplicabilidad e identificador pendientes de verificación'),taxId:bilingual('Restricted · verified source not connected','Restringido · fuente verificada no conectada')},
    structure:bilingual('Departments','Departamentos'),
    departments:[
      {name:bilingual('Study & Site Management','Gerencia de Estudios y Sede'),text:bilingual('Study feasibility, sponsor communication, activation, timelines, staffing and site performance.','Factibilidad, comunicación con patrocinadores, activación, calendarios, personal y desempeño del sitio.'),owner:bilingual('Research leadership','Liderazgo de Research')},
      {name:bilingual('Recruitment & Pre-screening','Reclutamiento y Pre-screening'),text:bilingual('Use only approved criteria and permissioned lists to identify possible participants.','Usar únicamente criterios aprobados y listas autorizadas para identificar posibles participantes.'),owner:bilingual('Recruitment team','Equipo de reclutamiento')},
      {name:bilingual('Clinical Research Coordination','Coordinación de Investigación Clínica'),text:bilingual('Consent, screening, study visits, protocol execution and participant follow-up.','Consentimiento, screening, visitas, ejecución del protocolo y seguimiento de participantes.'),owner:bilingual('Research coordinators','Coordinadores de Research')},
      {name:bilingual('Call Center Outreach','Contacto del Call Center'),text:bilingual('Approved scripts, documented contact attempts, permission and warm handoff to Research.','Guiones aprobados, intentos documentados, permiso y transición acompañada a Research.'),owner:bilingual('Authorized outreach team','Equipo autorizado de contacto')},
      {name:bilingual('Regulatory & Data','Regulatorio y Datos'),text:bilingual('Essential documents, protocol controls, data quality, deviations and sponsor-ready records.','Documentos esenciales, controles del protocolo, calidad de datos, desviaciones y expedientes para patrocinadores.'),owner:bilingual('Regulatory / data team','Equipo regulatorio / datos')},
    ],
    services:[
      {name:bilingual('Active clinical studies','Estudios clínicos activos'),text:bilingual('Sponsor-approved protocols operated only after site activation and staff authorization.','Protocolos aprobados por patrocinadores operados únicamente después de activar la sede y autorizar al personal.')},
      {name:bilingual('Patient identification','Identificación de pacientes'),text:bilingual('Permissioned review using protocol criteria; routine care never depends on participation.','Revisión autorizada usando criterios del protocolo; la atención rutinaria nunca depende de participar.')},
      {name:bilingual('Pre-screening','Pre-screening'),text:bilingual('Approved questions identify whether a formal screening conversation may be appropriate.','Preguntas aprobadas identifican si pudiera corresponder una conversación formal de screening.')},
      {name:bilingual('Consent & enrollment','Consentimiento e inscripción'),text:bilingual('Voluntary informed consent, protocol screening and enrollment only when all criteria are met.','Consentimiento informado voluntario, screening e inscripción solamente cuando se cumplen los criterios.')},
      {name:bilingual('Study visits & follow-up','Visitas y seguimiento del estudio'),text:bilingual('Protocol visits, documentation, safety reporting, sponsor data and final follow-up.','Visitas del protocolo, documentación, reportes de seguridad, datos del patrocinador y seguimiento final.')},
    ],
    roles:[bilingual('Principal Investigator','Investigador Principal'),bilingual('Sub-Investigator','Subinvestigador'),bilingual('Research Coordinator','Coordinador de Research'),bilingual('Recruitment Specialist','Especialista de Reclutamiento'),bilingual('Regulatory Specialist','Especialista Regulatorio'),bilingual('Data / Quality Coordinator','Coordinador de Datos / Calidad')],
    resources:[
      {page:'protocols',icon:FileText,title:bilingual('Research Protocols','Protocolos de Research'),text:bilingual('Roles, outreach and operational controls.','Funciones, contacto y controles operacionales.')},
      {page:'research-agreements',icon:ClipboardCheck,title:bilingual('Study Agreements','Acuerdos de Estudios'),text:bilingual('Research study, sponsor, vendor and site agreements.','Acuerdos de estudios, patrocinadores, vendors y sede de Research.')},
      {page:'academy',icon:GraduationCap,title:bilingual('Research Training','Capacitación de Research'),text:bilingual('Research workflow and compliance curriculum.','Currículo de flujo y cumplimiento de Research.')},
    ],
  },
  medical:{
    key:'medical',name:'Eastern Medical',icon:Stethoscope,logo:'/eastern-medical-logo.svg',tone:'medical',service:'medicine',
    eyebrow:bilingual('MEDICAL ENTITY','ENTIDAD MÉDICA'),
    summary:bilingual('One medical entity with three operating locations, shared clinical standards and location-specific teams, services and records.','Una entidad médica con tres sedes operacionales, estándares clínicos compartidos y equipos, servicios y registros específicos por sede.'),
    profile:{legalName:'Eastern Medical · Multi-location medical operations',primaryAddress:bilingual('Coral Way · Hialeah · Fort Myers','Coral Way · Hialeah · Fort Myers'),npi:bilingual('Entity/location NPIs pending verified credentialing source','NPIs de entidad/sedes pendientes de fuente verificada de credentialing'),taxId:bilingual('Restricted · verified source not connected','Restringido · fuente verificada no conectada')},
    structure:bilingual('Locations','Sedes'),
    departments:[
      {name:bilingual('Coral Way','Coral Way'),address:'8900 Coral Way, Suite 202, Miami, FL 33165',text:bilingual('Eastern Medical Center · Miami patient-care location. Service availability must be verified before scheduling.','Eastern Medical Center · Sede de atención en Miami. La disponibilidad de cada servicio debe verificarse antes de agendar.'),owner:bilingual('Coral Way Office Manager','Office Manager de Coral Way')},
      {name:bilingual('Hialeah','Hialeah'),address:'3695 W 18th Avenue, Hialeah, FL 33012',text:bilingual('Eastern Medical Group · Medical entity and Hialeah patient-care office.','Eastern Medical Group · Entidad médica y oficina de atención al paciente en Hialeah.'),owner:bilingual('Hialeah Office Manager','Office Manager de Hialeah')},
      {name:bilingual('Fort Myers','Fort Myers'),address:'19451 S. Tamiami Trail, Suites 109–110, Fort Myers, FL 33908',text:bilingual('Eastern Medical Center · Southwest Florida patient-care location and home of Eastern Medical Research operations.','Eastern Medical Center · Sede del suroeste de Florida y hogar de las operaciones de Eastern Medical Research.'),owner:bilingual('Fort Myers Office Manager','Office Manager de Fort Myers')},
    ],
    services:[
      {name:bilingual('Primary & preventive care','Atención primaria y preventiva'),text:bilingual('General medicine, Annual Physicals, prevention, follow-up and coordinated care planning.','Medicina general, Annual Physicals, prevención, seguimiento y planificación coordinada.')},
      {name:bilingual('Chronic Care','Chronic Care'),text:bilingual('Enrollment, consent and documented monthly monitoring for eligible patients with chronic conditions.','Inscripción, consentimiento y monitoreo mensual documentado para pacientes elegibles con condiciones crónicas.')},
      {name:bilingual('Allergy & immunology','Alergia e inmunología'),text:bilingual('Provider-ordered testing, safety-controlled workflows, documentation and immunotherapy coordination.','Pruebas ordenadas por proveedor, flujos con controles de seguridad, documentación y coordinación de inmunoterapia.')},
      {name:bilingual('Telemedicine','Telemedicina'),text:bilingual('CRM appointment, Practice Fusion transfer, staff contact, video visit and complete encounter documentation.','Cita en CRM, traslado a Practice Fusion, contacto del personal, videollamada y documentación completa.')},
      {name:bilingual('Transportation','Transportación'),text:bilingual('Appointment-linked pickup, driver coordination, waiting, return trip and final documentation.','Recogida vinculada a la cita, coordinación con chofer, espera, regreso y documentación final.')},
      {name:bilingual('Diagnostics, laboratory & referrals','Diagnósticos, laboratorio y referidos'),text:bilingual('Authorized testing, results routing, specialist coordination and documented follow-up.','Pruebas autorizadas, canalización de resultados, coordinación de especialistas y seguimiento documentado.')},
      {name:bilingual('Wellness programs','Programas de bienestar'),text:bilingual('Vitamin shots, immune-support and weight-management programs according to clinical eligibility.','Shots de vitaminas, apoyo al sistema inmunológico y programas de peso según elegibilidad clínica.')},
    ],
    roles:[bilingual('Medical Providers','Proveedores Médicos'),bilingual('Front Desk · Check-in','Front Desk · Check-in'),bilingual('Front Desk · Check-out','Front Desk · Check-out'),bilingual('Medical Assistants','Asistentes Médicos'),bilingual('Office Managers','Office Managers'),bilingual('Call Center','Call Center'),bilingual('Chronic Care Team','Equipo de Chronic Care')],
    resources:[
      {page:'doctor-licenses',icon:UserRound,title:bilingual('Doctor Credentials','Credenciales de Doctores'),text:bilingual('Licenses, DEA, malpractice and certifications.','Licencias, DEA, malpractice y certificaciones.')},
      {page:'protocols',icon:FileText,title:bilingual('Medical Protocols','Protocolos Médicos'),text:bilingual('Role duties and operating procedures.','Responsabilidades y procedimientos operacionales.')},
      {page:'academy',icon:GraduationCap,title:bilingual('Medical Training','Capacitación Médica'),text:bilingual('Medical office, services and systems courses.','Cursos de oficina médica, servicios y sistemas.')},
      {page:'licenses',icon:ShieldCheck,title:bilingual('Facility Compliance','Cumplimiento de Sedes'),text:bilingual('AHCA, occupational, OSHA and CLIA records.','Registros AHCA, ocupacionales, OSHA y CLIA.')},
    ],
  },
};

export const entitySections=['overview','workspace','structure','services','team','leads','resources'];

export function parseEntityPage(page){
  for(const key of Object.keys(entityDefinitions)){
    const prefix=`${key}-`;
    if(page.startsWith(prefix)){
      const section=page.slice(prefix.length);
      if(entitySections.includes(section)&&(!['workspace'].includes(section)||key==='research'))return {key,section,definition:entityDefinitions[key]};
    }
  }
  return null;
}

export function entityPage(key,section='overview'){return `${key}-${section}`}

export function entityNavItems(definition,lang){
  return [
    {id:entityPage(definition.key,'overview'),label:lang==='en'?'Overview':'Resumen',icon:Building2},
    ...(definition.key==='research'?[{id:entityPage(definition.key,'workspace'),label:lang==='en'?'Research Workspace':'Workspace de Research',icon:BriefcaseBusiness}]:[]),
    {id:entityPage(definition.key,'structure'),label:definition.structure[lang],icon:definition.key==='medical'?MapPin:BriefcaseBusiness},
    {id:entityPage(definition.key,'services'),label:lang==='en'?'Services':'Servicios',icon:HeartPulse},
    {id:entityPage(definition.key,'team'),label:lang==='en'?'People & roles':'Equipo y funciones',icon:UsersRound},
    {id:entityPage(definition.key,'leads'),label:lang==='en'?'Entity leads':'Leads de la entidad',icon:Target},
    {id:entityPage(definition.key,'resources'),label:lang==='en'?'Resources':'Recursos',icon:BookOpen},
  ];
}

function Overview({definition,lang,onNavigate,staffRows}){
  const items=entityNavItems(definition,lang).filter(item=>!item.id.endsWith('-overview'));
  const linkedStaff=definition.key==='medical'?staffRows.filter(row=>row.lifecycle==='active'):staffRows.filter(row=>String(row.entity||'').toLowerCase().includes(definition.name.toLowerCase()));
  const profile=definition.profile;
  const address=typeof profile.primaryAddress==='string'?profile.primaryAddress:profile.primaryAddress[lang];
  return <>
    <section className="entity-intro-card"><div><span>{lang==='en'?'ENTITY HOME':'INICIO DE LA ENTIDAD'}</span><h2>{lang==='en'?'Everything for this operation, in one place':'Todo para esta operación, en un solo lugar'}</h2><p>{definition.summary[lang]}</p></div><CheckCircle2/></section>
    <section className="entity-profile-summary"><header><div><span>{lang==='en'?'GENERAL ENTITY PROFILE':'FICHA GENERAL DE LA ENTIDAD'}</span><h2>{lang==='en'?'Identity, identifiers and assigned team':'Identidad, identificadores y equipo asignado'}</h2></div><button onClick={()=>onNavigate(entityPage(definition.key,'team'))}>{lang==='en'?'Open Human Resources':'Abrir Recursos Humanos'}<ArrowRight/></button></header><div className="entity-profile-grid"><article><small>{lang==='en'?'LEGAL / OPERATING NAME':'NOMBRE LEGAL / OPERACIONAL'}</small><strong>{profile.legalName}</strong><span>{lang==='en'?'Entity profile':'Perfil de entidad'}</span></article><article><small>NPI</small><strong>{profile.npi[lang]}</strong><span className="pending">{lang==='en'?'Verification status':'Estado de verificación'}</span></article><article><small>{lang==='en'?'TAX ID / EIN':'TAX ID / EIN'}</small><strong>{profile.taxId[lang]}</strong><span className="protected">{lang==='en'?'Protected corporate identifier':'Identificador corporativo protegido'}</span></article><article><small>{lang==='en'?'PRIMARY ADDRESS / COVERAGE':'DIRECCIÓN PRINCIPAL / COBERTURA'}</small><strong>{address}</strong><span>{definition.structure[lang]} · {definition.departments.length}</span></article><article><small>{lang==='en'?'PEOPLE LINKED FROM HUMAN RESOURCES':'PERSONAS CONECTADAS DESDE RECURSOS HUMANOS'}</small><strong>{linkedStaff.length}</strong><span>{linkedStaff.length?(lang==='en'?'Active verified profiles':'Perfiles activos verificados'):(lang==='en'?'Entity assignment source pending':'Fuente de asignación por entidad pendiente')}</span></article><article><small>{lang==='en'?'OPERATING ROLES':'FUNCIONES OPERACIONALES'}</small><strong>{definition.roles.length}</strong><span>{lang==='en'?'Defined department roles':'Funciones departamentales definidas'}</span></article></div>{linkedStaff.length?<div className="entity-profile-staff"><div>{linkedStaff.slice(0,5).map(row=><i key={row.name} title={row.name}>{row.initials}</i>)}</div><p><strong>{lang==='en'?'Linked Human Resources snapshot':'Resumen conectado de Recursos Humanos'}</strong>{linkedStaff.slice(0,3).map(row=>row.name).join(' · ')}{linkedStaff.length>3?` · +${linkedStaff.length-3}`:''}</p></div>:<div className="entity-profile-staff empty"><UsersRound/><p><strong>{lang==='en'?'No verified names assigned yet':'Aún no hay nombres verificados asignados'}</strong>{lang==='en'?'The roles are defined, but Human Resources does not yet identify employees by this legal entity.':'Las funciones están definidas, pero Recursos Humanos todavía no identifica empleados por esta entidad legal.'}</p></div>}</section>
    <section className="entity-room-section"><header><span>{lang==='en'?'ENTER A WORK AREA':'ENTRA A UN ÁREA DE TRABAJO'}</span><h2>{lang==='en'?'Choose what you need inside this entity':'Elige lo que necesitas dentro de esta entidad'}</h2></header><div className="entity-room-grid">{items.map(({id,label,icon:Icon})=><button key={id} onClick={()=>onNavigate(id)}><Icon/><span><strong>{label}</strong><small>{lang==='en'?'Open this area':'Abrir esta área'}</small></span><ArrowRight/></button>)}</div></section>
    <section className="entity-boundary"><ShieldCheck/><div><strong>{lang==='en'?'Clear ownership boundary':'Límite claro de responsabilidad'}</strong><p>{lang==='en'?'Information shown here belongs to this entity. Shared Hub tools are linked only when the workflow truly crosses the organization.':'La información mostrada aquí pertenece a esta entidad. Las herramientas compartidas del Hub se enlazan solamente cuando el flujo realmente cruza la organización.'}</p></div></section>
  </>;
}

function DetailDirectory({definition,lang,type}){
  const items=type==='services'?definition.services:definition.departments;
  const [selected,setSelected]=useState(items[0]);
  const heading=type==='services'?(lang==='en'?`Services inside ${definition.name}`:`Servicios dentro de ${definition.name}`):(lang==='en'?`Explore ${definition.structure.en.toLowerCase()}`:`Explora ${definition.structure.es.toLowerCase()}`);
  return <section className="entity-directory-view">
    <header><span>{type==='services'?(lang==='en'?'ENTITY SERVICES':'SERVICIOS DE LA ENTIDAD'):(lang==='en'?definition.structure.en.toUpperCase():definition.structure.es.toUpperCase())}</span><h2>{heading}</h2><p>{type==='services'?(lang==='en'?'Select a service to understand its purpose before entering its operational workflow.':'Selecciona un servicio para comprender su propósito antes de entrar en su flujo operacional.'):(lang==='en'?'Each area has its own owner, responsibilities and information.':'Cada área tiene su propio responsable, funciones e información.')}</p></header>
    <div className="entity-directory-layout"><div className="entity-directory-list">{items.map((item,index)=><button key={item.name.en} className={selected.name.en===item.name.en?'active':''} onClick={()=>setSelected(item)}><i>{String(index+1).padStart(2,'0')}</i><span><strong>{item.name[lang]}</strong><small>{item.address||item.owner?.[lang]||''}</small></span><ChevronArrow/></button>)}</div><article className="entity-directory-detail"><span>{type==='services'?(lang==='en'?'SERVICE PROFILE':'PERFIL DEL SERVICIO'):(lang==='en'?'AREA PROFILE':'PERFIL DEL ÁREA')}</span><h3>{selected.name[lang]}</h3>{selected.address&&<div className="entity-detail-address"><MapPin/><strong>{selected.address}</strong></div>}<p>{selected.text[lang]}</p>{selected.owner&&<div className="entity-detail-owner"><UserRound/><div><small>{lang==='en'?'OPERATIONAL OWNER':'RESPONSABLE OPERACIONAL'}</small><strong>{selected.owner[lang]}</strong></div></div>}<div className="entity-detail-next"><CheckCircle2/><p><strong>{lang==='en'?'Next level':'Próximo nivel'}</strong>{lang==='en'?'This profile is the correct place for location- or department-specific staff, documents, schedules, KPIs and workflows as those verified records are connected.':'Este perfil es el lugar correcto para personal, documentos, horarios, KPIs y flujos específicos de la sede o departamento cuando se conecten esos registros verificados.'}</p></div></article></div>
  </section>;
}

function ChevronArrow(){return <ArrowRight/>}

function TeamView({definition,lang,staffRows,onNavigate}){
  const medicalProviders=useMemo(()=>definition.key==='medical'?staffRows.filter(row=>row.license&&row.role):[],[definition.key,staffRows]);
  return <section className="entity-team-view"><header><span>{lang==='en'?'PEOPLE & OWNERSHIP':'EQUIPO Y RESPONSABILIDAD'}</span><h2>{lang==='en'?`Teams inside ${definition.name}`:`Equipos dentro de ${definition.name}`}</h2><p>{lang==='en'?'Roles are organized here without inventing employees. Verified records remain sourced from Human Resources.':'Las funciones se organizan aquí sin inventar empleados. Los expedientes verificados permanecen conectados a Recursos Humanos.'}</p></header><div className="entity-role-grid">{definition.roles.map((role,index)=><article key={role.en}><span>{String(index+1).padStart(2,'0')}</span><UsersRound/><strong>{role[lang]}</strong><small>{lang==='en'?'Department role':'Función del departamento'}</small></article>)}</div>{definition.key==='medical'&&<section className="entity-provider-list"><div><span>{lang==='en'?'VERIFIED PROVIDER DIRECTORY':'DIRECTORIO VERIFICADO DE PROVEEDORES'}</span><h3>{lang==='en'?'Doctors and clinical providers':'Doctores y proveedores clínicos'}</h3></div><div>{medicalProviders.slice(0,8).map(row=><article key={row.name}><i>{row.initials}</i><span><strong>{row.name}</strong><small>{row.role} · {row.entity}</small></span></article>)}</div><button onClick={()=>onNavigate('doctor-licenses')}>{lang==='en'?'Open complete credentials and documents':'Abrir credenciales y documentos completos'}<ArrowRight/></button></section>}</section>;
}

function Resources({definition,lang,onNavigate,canAccessPage=()=>true}){
  const resources=definition.resources.filter(({page})=>canAccessPage(page));
  return <section className="entity-resources"><header><span>{lang==='en'?'ENTITY RESOURCES':'RECURSOS DE LA ENTIDAD'}</span><h2>{lang==='en'?'Connected records without duplicate screens':'Registros conectados sin pantallas duplicadas'}</h2><p>{lang==='en'?'These links open the shared source of truth only when the record belongs to a Hub-wide control.':'Estos enlaces abren la fuente compartida únicamente cuando el registro pertenece a un control general del Hub.'}</p></header>{resources.length?<div>{resources.map(({page,icon:Icon,title,text})=><button key={page} onClick={()=>onNavigate(page)}><Icon/><span><strong>{title[lang]}</strong><small>{text[lang]}</small></span><ArrowRight/></button>)}</div>:<div className="entity-resources-empty"><ShieldCheck size={20}/><p>{lang==='en'?'No shared resources are assigned to this account.':'No hay recursos compartidos asignados a esta cuenta.'}</p></div>}</section>;
}

function ResearchWorkspace({lang,onNavigate,canAccessPage=()=>true}){
  const isEn=lang==='en';
  const areas=[
    {page:'research-agreements',icon:ClipboardCheck,title:isEn?'Study Agreements':'Acuerdos de Estudios',text:isEn?'Manually register study, sponsor, vendor and site agreements.':'Registra manualmente acuerdos de estudios, patrocinadores, vendors y sedes.',status:isEn?'Manual register':'Registro manual'},
    {page:'protocols',icon:FileText,title:isEn?'Protocols & Controls':'Protocolos y Controles',text:isEn?'Keep approved roles, outreach boundaries and operating procedures visible.':'Mantén visibles los roles aprobados, límites de contacto y procedimientos.',status:isEn?'Shared control':'Control compartido'},
    {page:'research-leads',icon:Target,title:isEn?'Recruitment & Leads':'Reclutamiento y Leads',text:isEn?'Route permissioned opportunities into Research pre-screening and follow-up.':'Canaliza oportunidades autorizadas hacia pre-screening y seguimiento de Research.',status:isEn?'Research pipeline':'Pipeline de Research'},
    {page:'academy',icon:GraduationCap,title:isEn?'Research Training':'Capacitación de Research',text:isEn?'Give coordinators and support teams the approved Research workflow curriculum.':'Ofrece al equipo el currículo aprobado del flujo de Research.',status:isEn?'Learning path':'Ruta de aprendizaje'},
  ];
  return <section className="research-workspace-view">
    <header className="research-workspace-heading"><div><span>{isEn?'RESEARCH OPERATIONS WORKSPACE':'WORKSPACE DE OPERACIONES DE RESEARCH'}</span><h2>{isEn?'One workspace for every Research handoff':'Un workspace para cada transición de Research'}</h2><p>{isEn?'A focused operating room for studies, recruitment, agreements, protocols and training. Participation remains voluntary and every clinical decision stays with the authorized Research team.':'Un espacio de trabajo enfocado en estudios, reclutamiento, acuerdos, protocolos y capacitación. La participación es voluntaria y toda decisión clínica permanece con el equipo autorizado de Research.'}</p></div><button className="research-workspace-back" onClick={()=>onNavigate('research-overview')}><ArrowLeft size={16}/>{isEn?'Entity overview':'Resumen de la entidad'}</button></header>
    <div className="research-workspace-status"><div><CheckCircle2 size={20}/><span><strong>{isEn?'Workspace ready':'Workspace listo'}</strong><small>{isEn?'Connected to the Eastern Medical Research entity':'Conectado a la entidad Eastern Medical Research'}</small></span></div><div><ShieldCheck size={20}/><span><strong>{isEn?'Permissioned workflow':'Flujo autorizado'}</strong><small>{isEn?'Use approved criteria, scripts and records only':'Usa únicamente criterios, guiones y registros aprobados'}</small></span></div><div><UsersRound size={20}/><span><strong>{isEn?'Shared ownership':'Responsabilidad compartida'}</strong><small>{isEn?'Study, coordination, regulatory and data teams':'Equipos de estudios, coordinación, regulatorio y datos'}</small></span></div></div>
    <div className="research-workspace-grid">{areas.filter(area=>canAccessPage(area.page)).map(({page,icon:Icon,title,text,status})=><button key={page} className="research-workspace-card" onClick={()=>onNavigate(page)}><span className="research-workspace-card-icon"><Icon size={22}/></span><span className="research-workspace-card-copy"><small>{status}</small><strong>{title}</strong><em>{text}</em></span><ArrowRight size={17}/></button>)}</div>
    <section className="research-workspace-flow"><header><span>{isEn?'OPERATING SEQUENCE':'SECUENCIA OPERACIONAL'}</span><h3>{isEn?'How work moves through Research':'Cómo se mueve el trabajo en Research'}</h3></header><div><article><b>01</b><strong>{isEn?'Identify':'Identificar'}</strong><p>{isEn?'Permissioned outreach using active protocol criteria.':'Contacto autorizado usando criterios del protocolo activo.'}</p></article><article><b>02</b><strong>{isEn?'Pre-screen':'Pre-screen'}</strong><p>{isEn?'Approved questions and documented outcome.':'Preguntas aprobadas y resultado documentado.'}</p></article><article><b>03</b><strong>{isEn?'Coordinate':'Coordinar'}</strong><p>{isEn?'Consent, screening, visits and safety follow-up.':'Consentimiento, screening, visitas y seguimiento de seguridad.'}</p></article><article><b>04</b><strong>{isEn?'Close the record':'Cerrar el expediente'}</strong><p>{isEn?'Sponsor-ready documents and clear ownership.':'Documentos listos para patrocinador y responsabilidad clara.'}</p></article></div></section>
    <div className="research-workspace-boundary"><ShieldCheck size={19}/><p><strong>{isEn?'Research boundary':'Límite de Research'}</strong>{isEn?'This workspace does not include insurance contracting. Study agreements are research records for new studies and are maintained separately from insurance contracts.':'Este workspace no incluye contratación de seguros. Los acuerdos de estudios son registros de Research para nuevos estudios y se mantienen separados de los contratos de seguros.'}</p></div>
  </section>;
}

export default function EntityWorkspace({definition,section,lang,onNavigate,staffRows=[],renderLeads,canAccessPage=()=>true}){
  const Icon=definition.icon;
  return <div className={`entity-workspace ${definition.tone}`}>
    <header className="entity-workspace-hero"><button onClick={()=>onNavigate('hub')}><ArrowLeft/>{lang==='en'?'Operational Hub':'Operational Hub'}</button><div><span>{definition.eyebrow[lang]}</span><h1>{definition.name}</h1><p>{definition.summary[lang]}</p></div>{definition.logo?<img className="entity-workspace-logo" src={definition.logo} alt={`${definition.name} logo`}/>:<Icon/>}</header>
    <div className="entity-workspace-content">
      {section==='overview'&&<Overview definition={definition} lang={lang} onNavigate={onNavigate} staffRows={staffRows}/>}
      {section==='workspace'&&definition.key==='research'&&<ResearchWorkspace lang={lang} onNavigate={onNavigate} canAccessPage={canAccessPage}/>}
      {section==='structure'&&<DetailDirectory definition={definition} lang={lang} type="structure"/>}
      {section==='services'&&<DetailDirectory definition={definition} lang={lang} type="services"/>}
      {section==='team'&&<TeamView definition={definition} lang={lang} staffRows={staffRows} onNavigate={onNavigate}/>}
      {section==='leads'&&renderLeads()}
      {section==='resources'&&<Resources definition={definition} lang={lang} onNavigate={onNavigate} canAccessPage={canAccessPage}/>}
    </div>
  </div>;
}
