import React, { useMemo, useState } from 'react';
import {
  ArrowRight, Bot, CalendarCheck2, CheckCircle2, CircleDollarSign, ClipboardList,
  FileHeart, HeartPulse, LayoutDashboard, Megaphone, MessageCircle, Mic,
  ReceiptText, RotateCcw, ShieldCheck, Stethoscope, UsersRound,
} from 'lucide-react';
import './aesthetics-systems-lab.css';

const b = (en, es) => ({ en, es });

const systems = [
  {
    key: 'crm', icon: UsersRound, name: 'CRM & Calendar', role: b('Lead, relationship and appointment operations', 'Operación de leads, relaciones y citas'),
    purpose: b('Receives opportunities, preserves source and consent, assigns ownership, records every contact attempt and controls real appointment availability.', 'Recibe oportunidades, conserva origen y consentimiento, asigna responsable, registra cada contacto y controla la disponibilidad real de citas.'),
    record: b('Lead source/campaign, contact permission, service interest, owner, tasks, dispositions, live calendar appointment and confirmation status.', 'Origen/campaña, permiso de contacto, interés, responsable, tareas, disposiciones, cita en calendario activo y estado de confirmación.'),
    handoff: b('Meta Ads or another channel → assigned CRM lead → immediate contact → verified calendar slot → clinical intake.', 'Meta Ads u otro canal → lead asignado en CRM → contacto inmediato → espacio verificado → intake clínico.'),
    never: b('Never promise an appointment from memory or leave the only lead record in WhatsApp.', 'Nunca prometas una cita de memoria ni dejes el único registro en WhatsApp.'),
  },
  {
    key: 'whatsapp', icon: MessageCircle, name: 'WhatsApp Business', role: b('Approved communication channel', 'Canal aprobado de comunicación'),
    purpose: b('Supports fast first contact, approved confirmations and service communication while the CRM remains the operational record.', 'Apoya primer contacto rápido, confirmaciones y comunicación de servicio mientras el CRM conserva el registro operacional.'),
    record: b('Minimum necessary conversation, verified recipient, approved templates and the operational outcome transferred to CRM or the clinical record.', 'Conversación mínima necesaria, destinatario verificado, plantillas aprobadas y resultado transferido al CRM o expediente clínico.'),
    handoff: b('Approved account → identify need → create/update CRM → schedule or route → document outcome.', 'Cuenta aprobada → identificar necesidad → crear/actualizar CRM → agendar o canalizar → documentar resultado.'),
    never: b('Never store the only clinical concern in chat, use a personal account or request unnecessary sensitive information.', 'Nunca dejes la única inquietud clínica en el chat, uses cuenta personal ni solicites datos sensibles innecesarios.'),
  },
  {
    key: 'practice-fusion', icon: FileHeart, name: 'Practice Fusion', role: b('Authorized clinical system of record', 'Sistema clínico autorizado de registro'),
    purpose: b('Maintains the verified patient chart, clinical encounter, medications, allergies, orders, consents, procedure documentation and follow-up.', 'Mantiene expediente verificado, encuentro clínico, medicamentos, alergias, órdenes, consentimientos, procedimiento y seguimiento.'),
    record: b('Patient identity, intake, clinical assessment by qualified medical personnel, orders, treatment note, signed documents and clinical tasks.', 'Identidad, intake, evaluación del personal médico calificado, órdenes, nota de tratamiento, documentos firmados y tareas clínicas.'),
    handoff: b('Verified CRM appointment → correct chart → clinical encounter → signed documentation → billing/operational follow-up.', 'Cita verificada del CRM → expediente correcto → encuentro clínico → documentación firmada → seguimiento financiero/operacional.'),
    never: b('Never create a duplicate without searching, share credentials or let nonclinical staff enter clinical conclusions.', 'Nunca crees duplicados sin buscar, compartas credenciales ni permitas conclusiones clínicas por personal no clínico.'),
  },
  {
    key: 'tebra', icon: ReceiptText, name: 'Tebra / Kareo', role: b('Practice-management, claims and revenue-cycle platform', 'Plataforma de practice management, claims y ciclo de ingresos'),
    purpose: b('Supports charge, claim, payer, payment and billing follow-up after the authorized clinical documentation is complete.', 'Apoya cargos, claims, pagadores, pagos y seguimiento de billing después de completar la documentación clínica autorizada.'),
    record: b('Entity, patient/account reference, payer, codes authorized through the coding workflow, claim status, payment, denial and balance.', 'Entidad, referencia de paciente/cuenta, pagador, códigos autorizados por el flujo de coding, claim, pago, denial y balance.'),
    handoff: b('Signed clinical documentation → coding/charge review → claim → payer response → payment or denial work queue.', 'Documentación clínica firmada → revisión de coding/cargo → claim → respuesta del pagador → pago o cola de denial.'),
    never: b('Never invent a service or diagnosis, alter coding to force payment or assume a claim is paid without reconciliation.', 'Nunca inventes servicio o diagnóstico, alteres coding para forzar pago ni asumas que un claim fue pagado sin conciliación.'),
  },
  {
    key: 'scribex', icon: Mic, name: 'ScribeX Health', role: b('Internal clinical documentation assistant', 'Asistente interno de documentación clínica'),
    purpose: b('Captures authorized encounters and produces reviewable transcript and SOAP-note drafts for qualified medical personnel.', 'Captura encuentros autorizados y produce transcripción y borradores SOAP revisables por personal médico calificado.'),
    record: b('Correct-patient recording, transcript, draft note, quality flags, review status and approved filing pathway.', 'Grabación del paciente correcto, transcripción, borrador, alertas de calidad, estado de revisión y ruta aprobada.'),
    handoff: b('Authorized encounter → transcription → draft → quality control → medical review/sign-off → Practice Fusion.', 'Encuentro autorizado → transcripción → borrador → control de calidad → revisión/firma médica → Practice Fusion.'),
    never: b('Never treat AI output as a signed note or allow the system to invent findings, diagnoses or services.', 'Nunca trates la salida de IA como nota firmada ni permitas que invente hallazgos, diagnósticos o servicios.'),
  },
  {
    key: 'carecheck', icon: HeartPulse, name: 'CareCheck360', role: b('Chronic Care operations and monthly monitoring', 'Operación de Chronic Care y monitoreo mensual'),
    purpose: b('Coordinates eligible Chronic Care patients, consent, assessments, care-plan activity, monthly work and program alerts.', 'Coordina pacientes elegibles de Chronic Care, consentimiento, evaluaciones, plan, trabajo mensual y alertas.'),
    record: b('Enrollment status, consent, chronic conditions, monthly activity, alerts, coordination tasks and program measurements.', 'Inscripción, consentimiento, condiciones crónicas, actividad mensual, alertas, tareas y métricas del programa.'),
    handoff: b('Eligible patient → consent → assessment/care plan → monthly monitoring → documented coordination → Tebra measurement.', 'Paciente elegible → consentimiento → evaluación/plan → monitoreo mensual → coordinación documentada → medición en Tebra.'),
    never: b('Never replace clinical judgment, payer verification or required documentation in the authorized record.', 'Nunca sustituye criterio clínico, verificación del pagador ni documentación requerida en el expediente autorizado.'),
  },
  {
    key: 'marketing', icon: Megaphone, name: 'Marketing Suite', role: b('Campaign, channel and conversion intelligence', 'Inteligencia de campañas, canales y conversión'),
    purpose: b('Connects campaign spend, Meta Ads, calls, leads, CRM acceptance, appointments, conversion and performance.', 'Conecta inversión, Meta Ads, llamadas, leads, aceptación en CRM, citas, conversión y rendimiento.'),
    record: b('Campaign/channel, spend, leads, CPL, owner, appointment, conversion, revenue attribution and connector status.', 'Campaña/canal, gasto, leads, CPL, responsable, cita, conversión, atribución de ingreso y estado de conectores.'),
    handoff: b('Campaign → Meta/other channel → CRM lead → accepted owner → appointment outcome → performance report.', 'Campaña → Meta/u otro canal → lead CRM → responsable acepta → resultado de cita → reporte.'),
    never: b('Never assume a connector is working without a successful test handoff and visible CRM record.', 'Nunca asumas que una integración funciona sin prueba exitosa y registro visible en CRM.'),
  },
  {
    key: 'financial', icon: CircleDollarSign, name: 'EMG Financial & Billing', role: b('Financial reconciliation and exception management', 'Conciliación financiera y manejo de excepciones'),
    purpose: b('Compares Tebra claims/payments with deposits and surfaces underpayments, denials, missing deposits and mismatches.', 'Compara claims/pagos de Tebra con depósitos y muestra pagos bajos, denials, depósitos faltantes y diferencias.'),
    record: b('Claim/payment references, deposit matches, entity, CPT, exception owner, evidence, resolution and reporting status.', 'Referencias de claim/pago, depósitos, entidad, CPT, responsable de excepción, evidencia, resolución y estado.'),
    handoff: b('Tebra and deposit sync → reconciliation → exception queue → investigation → approved resolution → reporting.', 'Tebra y depósitos → conciliación → cola de excepciones → investigación → resolución aprobada → reporte.'),
    never: b('Never replace payer policy, coding review, accounting approval or clinical documentation.', 'Nunca sustituye política del pagador, revisión de coding, aprobación contable ni documentación clínica.'),
  },
  {
    key: 'executive', icon: Bot, name: 'Executive Assistant', role: b('Mobile conversational work assistant', 'Asistente conversacional móvil de trabajo'),
    purpose: b('Provides fast voice or text support through the approved authenticated production configuration.', 'Ofrece apoyo rápido por voz o texto mediante la configuración de producción autenticada y aprobada.'),
    record: b('Only the minimum authorized work context; access depends on role, authentication and connected-system permissions.', 'Solamente contexto laboral mínimo autorizado; el acceso depende de rol, autenticación y permisos de integraciones.'),
    handoff: b('Question or task → authorized integration → source verification → response or assigned action → audit trail where required.', 'Pregunta o tarea → integración autorizada → verificación de fuente → respuesta o acción asignada → auditoría cuando aplique.'),
    never: b('Never enter PHI, passwords or credentials unless the final approved production workflow explicitly authorizes it.', 'Nunca introduzcas PHI, contraseñas ni credenciales salvo autorización explícita del flujo final de producción.'),
  },
  {
    key: 'hub', icon: LayoutDashboard, name: 'Operational Hub', role: b('Unified operating entry point', 'Punto unificado de operación'),
    purpose: b('Provides governed access to entities, Academy, licenses, contracting, staff, protocols, leads and the internal app ecosystem.', 'Ofrece acceso gobernado a entidades, Academy, licencias, contracting, personal, protocolos, leads y aplicaciones internas.'),
    record: b('Navigation, authorized operational views, role permissions, alerts and links to the system that owns each record.', 'Navegación, vistas autorizadas, permisos, alertas y enlaces al sistema dueño de cada registro.'),
    handoff: b('Employee role → permitted Hub section → correct system of record → completed task and visible status.', 'Rol del empleado → sección permitida → sistema de registro correcto → tarea completada y estado visible.'),
    never: b('Never copy every record into the Hub when another system is the controlled source of truth.', 'Nunca copies todos los expedientes al Hub cuando otro sistema es la fuente controlada oficial.'),
  },
];

const workflow = [
  { icon: Megaphone, label: b('Meta Ads', 'Meta Ads') },
  { icon: UsersRound, label: b('CRM lead', 'Lead CRM') },
  { icon: MessageCircle, label: b('Contact', 'Contacto') },
  { icon: CalendarCheck2, label: b('Verified appointment', 'Cita verificada') },
  { icon: Stethoscope, label: b('Practice Fusion', 'Practice Fusion') },
  { icon: ReceiptText, label: b('Tebra', 'Tebra') },
  { icon: CircleDollarSign, label: b('Reconciliation', 'Conciliación') },
];

export default function AestheticsSystemsLab({ lang = 'es' }) {
  const isEn = lang === 'en';
  const [active, setActive] = useState('crm');
  const [reviewed, setReviewed] = useState(new Set());
  const selected = useMemo(() => systems.find((system) => system.key === active), [active]);
  const SelectedIcon = selected.icon;
  const toggleReviewed = () => setReviewed((current) => {
    const next = new Set(current);
    next.has(active) ? next.delete(active) : next.add(active);
    return next;
  });
  return <section className="aesthetics-systems-lab">
    <header><div><span><ClipboardList size={17}/>{isEn ? 'SYSTEMS OPERATIONS LAB' : 'LABORATORIO DE OPERACIÓN DE SISTEMAS'}</span><h2>{isEn ? 'One patient journey. Multiple systems. One controlled record in each stage.' : 'Un recorrido del paciente. Varios sistemas. Un registro controlado en cada etapa.'}</h2><p>{isEn ? 'Learn which application owns each piece of work and how information moves without duplication, abandoned leads or unsafe shortcuts.' : 'Aprende qué aplicación responde por cada trabajo y cómo fluye la información sin duplicados, leads abandonados ni atajos inseguros.'}</p></div><aside><strong>{reviewed.size}/{systems.length}</strong><span>{isEn ? 'systems reviewed' : 'sistemas estudiados'}</span></aside></header>
    <div className="systems-end-to-end"><span>{isEn ? 'AESTHETICS END-TO-END FLOW' : 'FLUJO DE ESTÉTICA DE PRINCIPIO A FIN'}</span><div>{workflow.map((step, index) => { const Icon = step.icon; return <React.Fragment key={step.label.en}><article><Icon size={18}/><strong>{step.label[lang]}</strong></article>{index < workflow.length - 1 && <ArrowRight size={17}/>}</React.Fragment>; })}</div></div>
    <div className="systems-learning-layout"><nav>{systems.map((system) => { const Icon = system.icon; return <button key={system.key} className={`${active === system.key ? 'active' : ''} ${reviewed.has(system.key) ? 'reviewed' : ''}`} onClick={() => setActive(system.key)}><Icon size={19}/><span><strong>{system.name}</strong><small>{system.role[lang]}</small></span>{reviewed.has(system.key) ? <CheckCircle2 size={17}/> : <ArrowRight size={17}/>}</button>; })}</nav><article className="system-detail"><header><i><SelectedIcon size={25}/></i><div><span>{selected.role[lang]}</span><h3>{selected.name}</h3><p>{selected.purpose[lang]}</p></div></header><dl><div><dt>{isEn ? 'What belongs here' : 'Qué se registra aquí'}</dt><dd>{selected.record[lang]}</dd></div><div><dt>{isEn ? 'Operational handoff' : 'Transición operacional'}</dt><dd>{selected.handoff[lang]}</dd></div></dl><div className="system-stop-point"><ShieldCheck size={20}/><p><strong>{isEn ? 'Never do this' : 'Nunca hagas esto'}</strong>{selected.never[lang]}</p></div><button className={reviewed.has(active) ? 'reviewed' : ''} onClick={toggleReviewed}>{reviewed.has(active) ? <RotateCcw size={16}/> : <CheckCircle2 size={16}/>} {reviewed.has(active) ? (isEn ? 'Reviewed · click to uncheck' : 'Estudiado · clic para desmarcar') : (isEn ? 'Mark system reviewed' : 'Marcar sistema como estudiado')}</button></article></div>
  </section>;
}
