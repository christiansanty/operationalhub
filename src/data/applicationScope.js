// Public application scope metadata. Each application can replace this catalog
// by sending the same shape through the IT scope sync endpoint.
export const applicationScopeCatalog = [
  {
    id: 'universal',
    name: 'Universal Master RPA',
    version: '1.0.0',
    purpose: {
      en: 'Shared orchestration and monitoring plane that connects application events, automations and verified operational signals.',
      es: 'Plano compartido de orquestación y monitoreo que conecta eventos de aplicaciones, automatizaciones y señales operativas verificadas.',
    },
    modules: [
      { id: 'orchestration', name: { en: 'Workflow orchestration', es: 'Orquestación de flujos' }, summary: { en: 'Coordinates approved work between applications and keeps each handoff traceable.', es: 'Coordina trabajo aprobado entre aplicaciones y mantiene trazable cada entrega.' }, tools: ['Workflow routing', 'Queue management', 'Retry controls'], aiRole: { en: 'Agents classify the request, select the approved route and escalate exceptions; they do not approve access or clinical decisions.', es: 'Los agentes clasifican la solicitud, seleccionan la ruta aprobada y escalan excepciones; no aprueban accesos ni decisiones clínicas.' } },
      { id: 'connectors', name: { en: 'Connectors and events', es: 'Conectores y eventos' }, summary: { en: 'Receives signed push events and publishes application status to authorized consumers.', es: 'Recibe eventos de push firmados y publica el estado de las aplicaciones a consumidores autorizados.' }, tools: ['Webhook gateway', 'Event journal', 'Connector health checks'], aiRole: { en: 'Agents summarize event health and identify missing evidence without changing source records.', es: 'Los agentes resumen la salud de los eventos e identifican evidencia faltante sin cambiar los registros fuente.' } },
      { id: 'governance', name: { en: 'Governance and audit', es: 'Gobierno y auditoría' }, summary: { en: 'Maintains contracts, versions, permissions and audit evidence for shared automations.', es: 'Mantiene contratos, versiones, permisos y evidencia de auditoría para automatizaciones compartidas.' }, tools: ['Scope manifest validation', 'Version registry', 'Audit trail'], aiRole: { en: 'Agents flag drift, stale manifests and policy conflicts for human review.', es: 'Los agentes señalan desviaciones, manifiestos vencidos y conflictos de política para revisión humana.' } },
    ],
    aiAgents: [
      { name: { en: 'Universal routing agent', es: 'Agente de enrutamiento Universal' }, function: { en: 'Routes approved events to the correct application and reports failures.', es: 'Enruta eventos aprobados a la aplicación correcta y reporta fallas.' } },
      { name: { en: 'Universal monitoring agent', es: 'Agente de monitoreo Universal' }, function: { en: 'Compares application heartbeats and scope versions, then alerts on drift.', es: 'Compara latidos y versiones de alcance de las aplicaciones y alerta sobre desviaciones.' } },
    ],
  },
  {
    id: 'em-connect',
    name: 'EM Connect',
    version: '1.0.0',
    purpose: {
      en: 'Secure connection layer for approved application events and handoffs.',
      es: 'Capa segura de conexión para eventos y entregas aprobadas entre aplicaciones.',
    },
    modules: [
      { id: 'events', name: { en: 'Application events', es: 'Eventos de aplicaciones' }, summary: { en: 'Receives and routes approved events between connected applications.', es: 'Recibe y enruta eventos aprobados entre aplicaciones conectadas.' }, tools: ['Event intake', 'Routing status', 'Delivery logs'], aiRole: { en: 'Agents summarize delivery health and flag exceptions for human review.', es: 'Los agentes resumen la salud de entregas y señalan excepciones para revisión humana.' } },
      { id: 'handoffs', name: { en: 'Secure handoffs', es: 'Entregas seguras' }, summary: { en: 'Keeps cross-application handoffs traceable and contract-aware.', es: 'Mantiene trazables y alineadas al contrato las entregas entre aplicaciones.' }, tools: ['Signed payloads', 'Connector checks', 'Audit trail'], aiRole: { en: 'Agents identify missing evidence without changing source records.', es: 'Los agentes identifican evidencia faltante sin cambiar registros fuente.' } },
    ],
    aiAgents: [{ name: { en: 'EM Connect monitoring agent', es: 'Agente de monitoreo EM Connect' }, function: { en: 'Reports connector health and delivery exceptions.', es: 'Reporta salud de conectores y excepciones de entrega.' } }],
  },
  {
    id: 'operational-hub',
    name: 'Operational Hub',
    version: '1.0.0',
    purpose: { en: 'Organization-wide workspace for operations, shared modules, application visibility and controlled access.', es: 'Espacio organizacional para operaciones, módulos compartidos, visibilidad de aplicaciones y acceso controlado.' },
    modules: [
      { id: 'operations', name: { en: 'Operational workspaces', es: 'Espacios operacionales' }, summary: { en: 'Provides shared workflows for leads, credentialing, licensing, contracting and people operations.', es: 'Provee flujos compartidos para leads, credencialización, licencias, contracting y operaciones de personal.' }, tools: ['Dashboard', 'Shared operations', 'Entity workspaces'], aiRole: { en: 'Agents help locate the right workspace and summarize non-sensitive operational status.', es: 'Los agentes ayudan a encontrar el espacio correcto y resumen estados operativos no sensibles.' } },
      { id: 'it-control-center', name: { en: 'IT control center', es: 'Centro de control de IT' }, summary: { en: 'Shows application catalog, roadmap, implementation evidence and public application scope.', es: 'Muestra el catálogo de aplicaciones, roadmap, evidencia de implementación y scope público.' }, tools: ['Application catalog', 'Roadmap', 'Scope directory', 'Push sync status'], aiRole: { en: 'Agents explain application capabilities and surface stale or incomplete scope data; administrators remain responsible for roadmap changes.', es: 'Los agentes explican capacidades y señalan datos vencidos o incompletos; los administradores siguen siendo responsables de cambiar el roadmap.' } },
      { id: 'access-audit', name: { en: 'Access and audit', es: 'Acceso y auditoría' }, summary: { en: 'Applies role-based access and records sensitive changes without exposing confidential records.', es: 'Aplica acceso por roles y registra cambios sensibles sin exponer expedientes confidenciales.' }, tools: ['Permission profiles', 'Session control', 'Audit events'], aiRole: { en: 'Agents can explain permission boundaries but cannot grant access or bypass audit controls.', es: 'Los agentes pueden explicar límites de permisos, pero no conceden acceso ni evitan controles de auditoría.' } },
    ],
    aiAgents: [
      { name: { en: 'Operational guide agent', es: 'Agente guía operacional' }, function: { en: 'Explains what each application and module does using the synchronized public scope.', es: 'Explica qué hace cada aplicación y módulo usando el scope público sincronizado.' } },
      { name: { en: 'Change visibility agent', es: 'Agente de visibilidad de cambios' }, function: { en: 'Summarizes application pushes and identifies which scope or roadmap records need review.', es: 'Resume pushes de aplicaciones e identifica qué scope o registros del roadmap requieren revisión.' } },
    ],
  },
  {
    id: 'binium',
    name: 'Binium',
    version: '1.0.0',
    purpose: { en: 'Operational application for connected workflows and coordinated work.', es: 'Aplicación operacional para flujos conectados y trabajo coordinado.' },
    modules: [
      { id: 'workflow', name: { en: 'Workflow workspace', es: 'Espacio de flujos' }, summary: { en: 'Organizes repeatable operational work into visible stages and ownership.', es: 'Organiza trabajo operacional repetible en etapas y responsables visibles.' }, tools: ['Work queues', 'Task stages', 'Ownership tracking'], aiRole: { en: 'Agents propose routing and summarize work queues; people approve the final action.', es: 'Los agentes proponen rutas y resumen colas de trabajo; las personas aprueban la acción final.' } },
      { id: 'integrations', name: { en: 'Connected operations', es: 'Operaciones conectadas' }, summary: { en: 'Exposes approved handoffs to Universal Master RPA and Operational Hub.', es: 'Expone entregas aprobadas a Universal Master RPA y Operational Hub.' }, tools: ['Application events', 'Status callbacks', 'Integration logs'], aiRole: { en: 'Agents detect missing handoffs and report integration exceptions without changing source data.', es: 'Los agentes detectan entregas faltantes y reportan excepciones sin cambiar datos fuente.' } },
      { id: 'reporting', name: { en: 'Operational reporting', es: 'Reportes operacionales' }, summary: { en: 'Makes progress, ownership and outcome signals understandable to teams.', es: 'Hace comprensibles para los equipos el progreso, los responsables y las señales de resultado.' }, tools: ['Progress views', 'Activity summaries', 'Export-ready reports'], aiRole: { en: 'Agents turn approved operational signals into plain-language summaries.', es: 'Los agentes convierten señales operativas aprobadas en resúmenes claros.' } },
    ],
    aiAgents: [{ name: { en: 'Binium workflow assistant', es: 'Asistente de flujos Binium' }, function: { en: 'Suggests the next approved step and calls attention to blocked work.', es: 'Sugiere el siguiente paso aprobado y llama la atención sobre trabajo bloqueado.' } }],
  },
  {
    id: 'seven-insurance',
    name: 'Seven Insurance',
    version: '1.0.0',
    purpose: { en: 'Insurance operations, licensed workflows and client servicing.', es: 'Operaciones de seguros, flujos licenciados y servicio al cliente.' },
    modules: [
      { id: 'client-service', name: { en: 'Client service', es: 'Servicio al cliente' }, summary: { en: 'Supports organized client follow-up and service ownership.', es: 'Apoya el seguimiento organizado y el responsable del servicio al cliente.' }, tools: ['Client queues', 'Follow-up tasks', 'Service notes'], aiRole: { en: 'Agents draft summaries and suggest follow-up reminders without making coverage decisions.', es: 'Los agentes preparan resúmenes y sugieren recordatorios sin decidir cobertura.' } },
      { id: 'licensed-workflows', name: { en: 'Licensed workflows', es: 'Flujos licenciados' }, summary: { en: 'Keeps insurance work aligned with licensed roles and documented steps.', es: 'Mantiene el trabajo de seguros alineado con roles licenciados y pasos documentados.' }, tools: ['Eligibility checklist', 'Document checklist', 'Escalation queue'], aiRole: { en: 'Agents check workflow completeness and escalate items that require a licensed person.', es: 'Los agentes revisan integridad y escalan asuntos que requieren una persona licenciada.' } },
      { id: 'renewals', name: { en: 'Renewals and maintenance', es: 'Renovaciones y mantenimiento' }, summary: { en: 'Tracks recurring service work and renewal timing.', es: 'Da seguimiento al trabajo recurrente y a los tiempos de renovación.' }, tools: ['Renewal calendar', 'Status tracking', 'Client reminders'], aiRole: { en: 'Agents identify upcoming work and summarize status for the assigned team.', es: 'Los agentes identifican trabajo próximo y resumen el estado para el equipo asignado.' } },
    ],
    aiAgents: [{ name: { en: 'Insurance operations assistant', es: 'Asistente de operaciones de seguros' }, function: { en: 'Helps licensed staff find documented steps and outstanding tasks.', es: 'Ayuda al personal licenciado a encontrar pasos documentados y tareas pendientes.' } }],
  },
  {
    id: 'scribex-health',
    name: 'ScribeX Health',
    version: '1.0.0',
    purpose: { en: 'Clinical documentation and intelligent medical scribing.', es: 'Documentación clínica y scribing médico inteligente.' },
    modules: [
      { id: 'documentation', name: { en: 'Clinical documentation', es: 'Documentación clínica' }, summary: { en: 'Supports structured documentation workflows for authorized clinical teams.', es: 'Apoya flujos de documentación estructurada para equipos clínicos autorizados.' }, tools: ['Note workspace', 'Templates', 'Documentation review'], aiRole: { en: 'Agents assist with draft organization; a qualified clinician reviews and approves the final record.', es: 'Los agentes ayudan a organizar borradores; un clínico calificado revisa y aprueba el registro final.' } },
      { id: 'quality', name: { en: 'Documentation quality', es: 'Calidad de documentación' }, summary: { en: 'Highlights missing sections and consistency issues before review.', es: 'Señala secciones faltantes y problemas de consistencia antes de revisión.' }, tools: ['Completeness checks', 'Review queue', 'Quality signals'], aiRole: { en: 'Agents identify documentation gaps without diagnosing or prescribing.', es: 'Los agentes identifican brechas de documentación sin diagnosticar ni prescribir.' } },
      { id: 'integration', name: { en: 'Clinical integrations', es: 'Integraciones clínicas' }, summary: { en: 'Coordinates approved documentation handoffs with connected systems.', es: 'Coordina entregas aprobadas de documentación con sistemas conectados.' }, tools: ['Connector status', 'Export controls', 'Audit trail'], aiRole: { en: 'Agents report connector status and formatting issues for human resolution.', es: 'Los agentes reportan estado de conectores y problemas de formato para resolución humana.' } },
    ],
    aiAgents: [{ name: { en: 'Scribe review assistant', es: 'Asistente de revisión Scribe' }, function: { en: 'Organizes and checks draft notes while preserving clinician approval boundaries.', es: 'Organiza y revisa notas borrador respetando la aprobación del clínico.' } }],
  },
  {
    id: 'carecheck360',
    name: 'CareCheck360',
    version: '1.0.0',
    purpose: { en: 'Chronic care monitoring, monthly follow-up and documented care coordination.', es: 'Monitoreo de Chronic Care, seguimiento mensual y coordinación documentada.' },
    modules: [
      { id: 'monitoring', name: { en: 'Care monitoring', es: 'Monitoreo de cuidado' }, summary: { en: 'Tracks recurring monitoring tasks and documented follow-up for authorized teams.', es: 'Da seguimiento a tareas recurrentes de monitoreo y seguimiento documentado.' }, tools: ['Monitoring queue', 'Due-date views', 'Follow-up status'], aiRole: { en: 'Agents prioritize follow-up signals for review and never replace clinical judgment.', es: 'Los agentes priorizan señales de seguimiento para revisión y nunca reemplazan el juicio clínico.' } },
      { id: 'coordination', name: { en: 'Care coordination', es: 'Coordinación de cuidado' }, summary: { en: 'Keeps handoffs and ownership visible across care operations.', es: 'Mantiene visibles las entregas y responsables en operaciones de cuidado.' }, tools: ['Assignment queue', 'Handoff notes', 'Escalation controls'], aiRole: { en: 'Agents identify incomplete handoffs and route them to authorized staff.', es: 'Los agentes identifican entregas incompletas y las enrutan al personal autorizado.' } },
      { id: 'reporting', name: { en: 'Program reporting', es: 'Reportes del programa' }, summary: { en: 'Summarizes program activity and completion signals for operations.', es: 'Resume actividad y señales de cumplimiento del programa para operaciones.' }, tools: ['Program dashboard', 'Completion summaries', 'Audit exports'], aiRole: { en: 'Agents create plain-language summaries from approved program signals.', es: 'Los agentes crean resúmenes claros a partir de señales aprobadas del programa.' } },
    ],
    aiAgents: [{ name: { en: 'Care coordination assistant', es: 'Asistente de coordinación de cuidado' }, function: { en: 'Surfaces missing follow-up and prepares non-clinical task summaries.', es: 'Señala seguimientos faltantes y prepara resúmenes de tareas no clínicas.' } }],
  },
  {
    id: 'financial-hub',
    name: 'Financial Hub',
    version: '1.0.0',
    purpose: { en: 'Financial visibility, planning and executive controls.', es: 'Visibilidad financiera, planificación y controles ejecutivos.' },
    modules: [
      { id: 'visibility', name: { en: 'Financial visibility', es: 'Visibilidad financiera' }, summary: { en: 'Presents approved financial indicators in a shared operational view.', es: 'Presenta indicadores financieros aprobados en una vista operacional compartida.' }, tools: ['KPI dashboard', 'Period views', 'Source status'], aiRole: { en: 'Agents explain trends and data freshness; they do not approve transactions.', es: 'Los agentes explican tendencias y vigencia; no aprueban transacciones.' } },
      { id: 'planning', name: { en: 'Planning and scenarios', es: 'Planificación y escenarios' }, summary: { en: 'Supports planning conversations and documented scenario assumptions.', es: 'Apoya conversaciones de planificación y supuestos documentados.' }, tools: ['Planning workspace', 'Scenario notes', 'Variance views'], aiRole: { en: 'Agents compare scenarios and identify assumptions that need confirmation.', es: 'Los agentes comparan escenarios e identifican supuestos que requieren confirmación.' } },
      { id: 'controls', name: { en: 'Executive controls', es: 'Controles ejecutivos' }, summary: { en: 'Keeps financial actions visible, owned and reviewable.', es: 'Mantiene visibles, asignadas y revisables las acciones financieras.' }, tools: ['Approval queue', 'Control checklist', 'Audit history'], aiRole: { en: 'Agents surface control exceptions for authorized reviewers.', es: 'Los agentes señalan excepciones de control para revisores autorizados.' } },
    ],
    aiAgents: [{ name: { en: 'Financial insight assistant', es: 'Asistente de análisis financiero' }, function: { en: 'Summarizes approved indicators and calls out changes that need executive review.', es: 'Resume indicadores aprobados y señala cambios que requieren revisión ejecutiva.' } }],
  },
  {
    id: 'marketing-suite',
    name: 'Marketing Suite',
    version: '1.0.0',
    purpose: { en: 'Campaign operations, CRM connections and performance.', es: 'Operaciones de campañas, conexión con CRM y rendimiento.' },
    modules: [
      { id: 'campaigns', name: { en: 'Campaign operations', es: 'Operaciones de campañas' }, summary: { en: 'Coordinates campaign planning, review and launch readiness.', es: 'Coordina planificación, revisión y preparación de campañas.' }, tools: ['Campaign board', 'Approval checklist', 'Launch calendar'], aiRole: { en: 'Agents draft campaign summaries and flag missing approvals; people approve publication.', es: 'Los agentes preparan resúmenes y señalan aprobaciones faltantes; las personas aprueban publicación.' } },
      { id: 'crm', name: { en: 'CRM connections', es: 'Conexiones CRM' }, summary: { en: 'Maintains approved lead handoffs and attribution signals.', es: 'Mantiene entregas aprobadas de leads y señales de atribución.' }, tools: ['Lead handoff', 'Attribution status', 'Connector health'], aiRole: { en: 'Agents identify incomplete handoffs and duplicate signals for review.', es: 'Los agentes identifican entregas incompletas y señales duplicadas para revisión.' } },
      { id: 'performance', name: { en: 'Performance', es: 'Rendimiento' }, summary: { en: 'Turns campaign activity into understandable performance views.', es: 'Convierte actividad de campañas en vistas de rendimiento comprensibles.' }, tools: ['Performance dashboard', 'Channel views', 'Outcome summaries'], aiRole: { en: 'Agents summarize approved metrics and suggest questions for the team.', es: 'Los agentes resumen métricas aprobadas y sugieren preguntas para el equipo.' } },
    ],
    aiAgents: [{ name: { en: 'Campaign operations assistant', es: 'Asistente de campañas' }, function: { en: 'Helps teams prepare campaigns, review readiness and explain performance.', es: 'Ayuda a preparar campañas, revisar preparación y explicar rendimiento.' } }],
  },
  {
    id: 'executive-assistant',
    name: 'Executive Assistant',
    version: '1.0.0',
    purpose: { en: 'Personal productivity, follow-up and executive coordination.', es: 'Productividad personal, seguimiento y coordinación ejecutiva.' },
    modules: [
      { id: 'priorities', name: { en: 'Priorities and tasks', es: 'Prioridades y tareas' }, summary: { en: 'Organizes action items, deadlines and ownership for executive work.', es: 'Organiza acciones, fechas y responsables del trabajo ejecutivo.' }, tools: ['Priority list', 'Task board', 'Due-date reminders'], aiRole: { en: 'Agents summarize priorities and suggest sequencing; the executive remains the decision maker.', es: 'Los agentes resumen prioridades y sugieren secuencia; el ejecutivo toma la decisión.' } },
      { id: 'follow-up', name: { en: 'Follow-up coordination', es: 'Coordinación de seguimiento' }, summary: { en: 'Keeps commitments and follow-ups visible across teams.', es: 'Mantiene visibles compromisos y seguimientos entre equipos.' }, tools: ['Follow-up queue', 'Meeting actions', 'Status reminders'], aiRole: { en: 'Agents draft reminders and identify unanswered actions without sending messages automatically.', es: 'Los agentes preparan recordatorios e identifican acciones sin respuesta sin enviar mensajes automáticamente.' } },
      { id: 'briefings', name: { en: 'Executive briefings', es: 'Resúmenes ejecutivos' }, summary: { en: 'Builds concise briefings from approved operational updates.', es: 'Construye resúmenes concisos desde actualizaciones operativas aprobadas.' }, tools: ['Briefing builder', 'Decision log', 'Source links'], aiRole: { en: 'Agents synthesize source updates and clearly label missing or stale information.', es: 'Los agentes sintetizan fuentes y etiquetan información faltante o vencida.' } },
    ],
    aiAgents: [{ name: { en: 'Executive briefing assistant', es: 'Asistente de resúmenes ejecutivos' }, function: { en: 'Prepares a concise view of priorities, blockers and decisions for human review.', es: 'Prepara una vista concisa de prioridades, bloqueos y decisiones para revisión humana.' } }],
  },
];

export const applicationScopeById = Object.fromEntries(applicationScopeCatalog.map(item => [item.id, item]));
