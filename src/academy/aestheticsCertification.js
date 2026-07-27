const b = (en, es) => [en, es];
const section = (title, body) => [title[0], title[1], body[0], body[1]];
const practice = (context, question, options, correct, feedback) => ({
  context: { en: context[0], es: context[1] },
  question: { en: question[0], es: question[1] },
  options: options.map(option => ({ en: option[0], es: option[1] })),
  correct,
  feedback: { en: feedback[0], es: feedback[1] },
});

const approval = b(
  'Complete the learning studio and decision check. Clinical personnel must also demonstrate the applicable internal SOP and manufacturer IFU under direct supervision before independent practice.',
  'Completa el estudio de aprendizaje y la evaluación de decisión. El personal clínico también debe demostrar el SOP interno y el IFU del fabricante aplicables bajo supervisión directa antes de trabajar independientemente.',
);

const operationalApproval = b(
  'Complete the learning studio and decision check, then demonstrate the workflow in a supervised role-play with accurate documentation and a closed-loop handoff.',
  'Completa el estudio de aprendizaje y la evaluación de decisión; después demuestra el flujo en un role-play supervisado con documentación correcta y una transición de ciclo cerrado.',
);

export const aestheticsLessons = [
  {
    title: b('Institutional identity', 'Identidad institucional'),
    intro: b(
      'Eastern Medical Aesthetics is a medical-aesthetics entity inside the broader Eastern ecosystem. This opening module defines the promise employees represent: sophisticated service, clinical judgment, truthful expectations and long-term patient relationships.',
      'Eastern Medical Aesthetics es una entidad de estética médica dentro del ecosistema Eastern. Este módulo inicial define la promesa que representa cada colaborador: servicio sofisticado, criterio clínico, expectativas veraces y relaciones duraderas con el paciente.',
    ),
    objectives: [
      b('Explain the identity and purpose of Eastern Medical Aesthetics', 'Explicar la identidad y el propósito de Eastern Medical Aesthetics'),
      b('Connect patient well-being with ethical company growth', 'Conectar el bienestar del paciente con el crecimiento ético de la compañía'),
      b('Distinguish hospitality, operational and clinical responsibilities', 'Distinguir responsabilidades de hospitalidad, operación y clínica'),
    ],
    sections: [
      section(b('Who we are', 'Quiénes somos'), b(
        'Eastern Medical Aesthetics combines aesthetic medicine, skin health and wellness within a medically governed experience. It is not a beauty counter and it is not a place where a campaign decides treatment. Every contact should feel warm and elevated, while candidacy, product choice, procedure and follow-up remain controlled by qualified professionals.',
        'Eastern Medical Aesthetics integra medicina estética, salud de la piel y bienestar dentro de una experiencia gobernada clínicamente. No es un mostrador de belleza ni un lugar donde una campaña decide un tratamiento. Cada contacto debe sentirse cálido y elevado, mientras la candidatura, el producto, el procedimiento y el seguimiento permanecen bajo profesionales cualificados.',
      )),
      section(b('The two-pillar promise', 'La promesa de dos pilares'), b(
        'Patient well-being and company well-being reinforce each other when the team identifies a real need, recommends a relevant consultation, communicates honestly and follows through. Growth must come from trust, excellent outcomes management and continuity—not pressure, fear, invented scarcity or unnecessary clinical services.',
        'El bienestar del paciente y el bienestar de la compañía se refuerzan cuando el equipo identifica una necesidad real, recomienda una consulta pertinente, comunica con honestidad y cumple el seguimiento. El crecimiento debe surgir de la confianza, el manejo excelente de resultados y la continuidad; nunca de presión, miedo, escasez inventada ni servicios clínicos innecesarios.',
      )),
      section(b('One team, clear scopes', 'Un equipo, alcances claros'), b(
        'Front desk and coordinators welcome, schedule, collect approved information, explain the process and close handoffs. Licensed clinicians assess, diagnose when applicable, select treatment, perform procedures and manage complications. Marketing may generate interest but cannot determine candidacy or promise a result. Every employee must know when to stop and escalate.',
        'Front desk y coordinadores reciben, agendan, recopilan información autorizada, explican el proceso y cierran transiciones. Los profesionales licenciados evalúan, diagnostican cuando corresponde, seleccionan tratamientos, realizan procedimientos y manejan complicaciones. Marketing puede generar interés, pero no decide candidatura ni promete resultados. Cada colaborador debe saber cuándo detenerse y escalar.',
      )),
      section(b('The Eastern service standard', 'El estándar de servicio Eastern'), b(
        'Use the patient name, listen before recommending, confirm understanding, avoid assumptions, protect dignity and explain what happens next. A premium experience is not decoration: it is punctual communication, a clean environment, privacy, accurate records, coordinated follow-up and ownership when something does not go as planned.',
        'Usa el nombre del paciente, escucha antes de recomendar, confirma comprensión, evita suposiciones, protege la dignidad y explica el próximo paso. Una experiencia premium no es decoración: es comunicación puntual, ambiente limpio, privacidad, expediente correcto, seguimiento coordinado y responsabilidad cuando algo no sale como se esperaba.',
      )),
      section(b('Truthful representation', 'Representación veraz'), b(
        'Employees describe only current services, verified credentials, approved promotions and realistic treatment pathways. Never call a device or product “FDA approved” when it is only cleared for a specific indication; never extend an indication to every patient; and never turn before-and-after content into a guarantee.',
        'El personal describe únicamente servicios vigentes, credenciales verificadas, promociones aprobadas y rutas realistas. Nunca se llama “aprobado por FDA” a un dispositivo que solamente tiene autorización 510(k) para una indicación específica; nunca se extiende una indicación a todo paciente ni se convierte un antes y después en garantía.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled sources: Eastern Medical Academy operating philosophy and current corporate service brief.', 'Fuentes controladas: filosofía operacional de Eastern Medical Academy y brief corporativo vigente de servicios.'),
    approval: operationalApproval,
    practice: practice(
      b('A lead says she wants “the strongest treatment” because an influencer guaranteed a dramatic result in one visit.', 'Una prospecto dice que quiere “el tratamiento más fuerte” porque una influencer garantizó un resultado dramático en una visita.'),
      b('What response best represents Eastern Medical Aesthetics?', '¿Qué respuesta representa mejor a Eastern Medical Aesthetics?'),
      [
        b('Confirm the guarantee so the lead books immediately.', 'Confirmar la garantía para que reserve de inmediato.'),
        b('Acknowledge her goal, explain that a qualified provider must evaluate candidacy and offer a consultation without promising a device, session count or result.', 'Reconocer su objetivo, explicar que el personal médico calificado debe evaluar la candidatura y ofrecer una consulta sin prometer dispositivo, cantidad de sesiones ni resultado.'),
        b('Recommend the most expensive package before asking any questions.', 'Recomendar el paquete más costoso antes de hacer preguntas.'),
      ],
      1,
      b('Correct. Eastern earns trust by matching a real need to a clinically appropriate pathway with truthful expectations.', 'Correcto. Eastern gana confianza al conectar una necesidad real con una ruta clínicamente apropiada y expectativas veraces.'),
    ),
  },
  {
    title: b('The complete patient journey', 'El recorrido completo del paciente'),
    intro: b(
      'A successful aesthetic experience is a chain of owned moments, not only the procedure. Learn the full path from first inquiry through consultation, treatment readiness, recovery, follow-up and retention.',
      'Una experiencia estética exitosa es una cadena de momentos con responsable, no solamente el procedimiento. Aprende la ruta completa desde la primera consulta hasta la evaluación, preparación, recuperación, seguimiento y retención.',
    ),
    objectives: [
      b('Map every stage and its owner', 'Mapear cada etapa y su responsable'),
      b('Capture the right information without diagnosing', 'Capturar la información correcta sin diagnosticar'),
      b('Close every handoff and follow-up', 'Cerrar cada transición y seguimiento'),
    ],
    sections: [
      section(b('1 · Inquiry and permission', '1 · Consulta inicial y permiso'), b(
        'Record name, preferred contact, source, stated concern, desired timing and consent to be contacted in the approved CRM. Do not collect a full medical history in social media or a casual message. Confirm the next action and who owns it.',
        'Registra nombre, contacto preferido, origen, preocupación expresada, fecha deseada y permiso de contacto en el CRM aprobado. No recolectes una historia clínica completa por redes sociales o un mensaje casual. Confirma el próximo paso y quién es responsable.',
      )),
      section(b('2 · Meta Ads lead response: WhatsApp, CRM and immediate ownership', '2 · Respuesta a leads de Meta Ads: WhatsApp, CRM y responsabilidad inmediata'), b(
        'A lead generated by a Meta advertisement may begin the conversation in WhatsApp, but WhatsApp is only the communication channel: the CRM is the operational source of truth. As soon as the lead arrives, create or verify the CRM record, preserve the Meta campaign/source, timestamp, requested service, preferred contact and consent, assign one named owner and begin contact without avoidable delay under the current response-time standard. The first employee owns the lead until another person accepts the handoff in the CRM. Never leave the only record in a chat, personal phone, screenshot or unassigned inbox.',
        'Un lead generado por un anuncio de Meta puede comenzar la conversación en WhatsApp, pero WhatsApp es solamente el canal de comunicación: el CRM es la fuente operacional oficial. Tan pronto llega, crea o verifica el registro en el CRM, conserva campaña/origen de Meta, hora de entrada, servicio solicitado, contacto preferido y consentimiento, asigna un responsable con nombre e inicia el contacto sin demora evitable según el estándar vigente. El primer colaborador conserva la responsabilidad hasta que otra persona acepte la transición en el CRM. Nunca dejes el único registro en un chat, teléfono personal, screenshot o inbox sin asignar.',
      )),
      section(b('3 · First-contact conversation and qualification', '3 · Conversación inicial y calificación'), b(
        'Introduce Eastern Medical Aesthetics and yourself, confirm the person’s name, acknowledge the service or concern from the campaign and ask concise discovery questions: what the person hopes to improve, preferred location, timing, whether this is a first visit and the best method to continue. Nonclinical staff qualify the opportunity and route the consultation; they do not diagnose, determine candidacy, select a device, quote a dose or promise an outcome. Record the exact outcome of every call or WhatsApp attempt and create the next CRM task before ending the interaction.',
        'Preséntate con Eastern Medical Aesthetics, confirma el nombre, reconoce el servicio o inquietud de la campaña y formula preguntas breves: qué desea mejorar, sede preferida, disponibilidad, si es primera visita y mejor canal para continuar. El personal no clínico califica la oportunidad y canaliza la consulta; no diagnostica, decide candidatura, selecciona equipo, cotiza dosis ni promete resultados. Registra el resultado exacto de cada llamada o intento por WhatsApp y crea la próxima tarea en el CRM antes de terminar la interacción.',
      )),
      section(b('4 · Verify real availability before offering an appointment', '4 · Verificar disponibilidad real antes de ofrecer una cita'), b(
        'Never offer a time from memory, a text message, a personal calendar or an assumed opening. While the lead is engaged, open the live CRM calendar and verify the correct location, appointment type, provider, date, duration and any required room or resource. Confirm that the provider is actually scheduled, the slot is not blocked or double-booked and the duration is sufficient for the consultation. If availability is uncertain, do not improvise: place the lead on a documented hold, identify who will verify the calendar and give a specific callback time.',
        'Nunca ofrezcas una hora de memoria, desde un mensaje, un calendario personal o un espacio supuesto. Mientras el lead está conectado, abre el calendario activo del CRM y verifica sede, tipo de cita, personal médico calificado, fecha, duración y cualquier salón o recurso requerido. Confirma que el personal médico calificado realmente esté programado, que el espacio no esté bloqueado ni duplicado y que la duración alcance para la consulta. Si la disponibilidad es incierta, no improvises: deja el lead en espera documentada, identifica quién verificará el calendario y ofrece una hora específica para devolver la llamada.',
      )),
      section(b('5 · Book, confirm and close the loop in the CRM', '5 · Agendar, confirmar y cerrar el ciclo en el CRM'), b(
        'An appointment is not real until it is saved in the CRM calendar under the correct patient or lead, location, service or consultation type, provider, duration and owner. Read the date, time, location and purpose back to the patient, send the approved confirmation and preparation message, and document how the confirmation was delivered. If the person does not book, select the accurate disposition and schedule the next follow-up task. Never mark a lead complete merely because a message was sent.',
        'Una cita no es real hasta quedar guardada en el calendario del CRM bajo el paciente o lead correcto, sede, servicio o tipo de consulta, personal médico calificado, duración y responsable. Repite al paciente fecha, hora, sede y propósito, envía la confirmación e instrucciones aprobadas y documenta cómo se entregaron. Si la persona no agenda, selecciona la disposición correcta y programa la próxima tarea. Nunca marques un lead como completado solamente porque se envió un mensaje.',
      )),
      section(b('6 · Consultation preparation', '6 · Preparación de la consulta'), b(
        'Create or verify the correct patient record, appointment type and location. Send approved preparation and intake instructions, explain that treatment is not guaranteed the same day, and identify language, accessibility or scheduling needs before arrival.',
        'Crea o verifica el expediente correcto, tipo de cita y sede. Envía instrucciones aprobadas de preparación e intake, explica que el tratamiento el mismo día no está garantizado e identifica necesidades de idioma, accesibilidad o agenda antes de la llegada.',
      )),
      section(b('7 · Clinical consultation', '7 · Consulta clínica'), b(
        'The qualified provider reviews goals, medical history, medications, allergies, prior procedures, examination findings, alternatives, contraindications and realistic outcomes. Standardized photographs and informed consent follow the approved privacy and clinical workflow. Staff never pre-select a treatment for the provider.',
        'El personal médico calificado revisa objetivos, historia médica, medicamentos, alergias, procedimientos previos, hallazgos, alternativas, contraindicaciones y resultados realistas. Las fotografías estandarizadas y el consentimiento siguen el flujo clínico y de privacidad aprobado. El personal nunca preselecciona el tratamiento por el personal médico calificado.',
      )),
      section(b('8 · Treatment readiness', '8 · Preparación para tratamiento'), b(
        'Before treatment, confirm identity, signed procedure-specific consent, correct product or device, lot and expiration controls where applicable, photographs, approved plan, room readiness and responsible provider. A mismatch, missing document or unresolved clinical question stops the workflow.',
        'Antes del tratamiento, confirma identidad, consentimiento específico firmado, producto o dispositivo correcto, lote y vencimiento cuando aplique, fotografías, plan aprobado, salón listo y personal médico calificado responsable. Una discrepancia, documento faltante o duda clínica sin resolver detiene el flujo.',
      )),
      section(b('9 · Recovery and red flags', '9 · Recuperación y señales de alerta'), b(
        'Give only the approved written aftercare for the performed service, confirm teach-back and provide the correct contact route. Staff must distinguish expected instructions from urgent red flags and escalate symptoms immediately according to the emergency or complication policy—never reassure by guessing.',
        'Entrega únicamente el aftercare escrito aprobado para el servicio realizado, confirma comprensión y ofrece la vía correcta de contacto. El personal distingue instrucciones esperadas de señales urgentes y escala síntomas inmediatamente según la política de emergencia o complicaciones; nunca tranquiliza adivinando.',
      )),
      section(b('10 · Follow-up, loyalty and learning', '10 · Seguimiento, lealtad y aprendizaje'), b(
        'Schedule the clinically appropriate follow-up before closing the encounter, document outreach attempts and record outcome in the approved system. Ask for feedback without pressuring for a positive review. A concern is owned until accepted by the right clinician or manager and the patient knows the next step.',
        'Agenda el seguimiento clínicamente apropiado antes de cerrar el encuentro, documenta intentos de contacto y registra el resultado en el sistema aprobado. Solicita feedback sin presionar por una reseña positiva. Una preocupación conserva responsable hasta que la acepte el clínico o manager correcto y el paciente conozca el próximo paso.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled source: Eastern Medical patient-experience and closed-loop handoff standards.', 'Fuente controlada: estándares Eastern Medical de experiencia del paciente y transición de ciclo cerrado.'),
    approval: operationalApproval,
    practice: practice(
      b('A patient completed a procedure, received verbal instructions and left without a follow-up appointment. The coordinator assumes the provider will call.', 'Una paciente completó un procedimiento, recibió instrucciones verbales y se fue sin cita de seguimiento. La coordinadora asume que el personal médico calificado llamará.'),
      b('What must happen now?', '¿Qué debe ocurrir ahora?'),
      [
        b('Nothing; the procedure is complete.', 'Nada; el procedimiento terminó.'),
        b('Create a documented follow-up task, confirm the responsible owner, deliver the approved written aftercare and tell the patient when and how contact will occur.', 'Crear una tarea documentada de seguimiento, confirmar el responsable, entregar aftercare escrito aprobado y decirle a la paciente cuándo y cómo será contactada.'),
        b('Send an informal message to several employees without assigning an owner.', 'Enviar un mensaje informal a varios empleados sin asignar responsable.'),
      ],
      1,
      b('Correct. A procedure is not operationally complete until aftercare, ownership and follow-up are documented and understood.', 'Correcto. Un procedimiento no está operacionalmente completo hasta que aftercare, responsabilidad y seguimiento estén documentados y comprendidos.'),
    ),
  },
  {
    title: b('Endolift · complete course', 'Endolift · curso completo'),
    intro: b(
      'Study Endolift as a provider-led, minimally invasive laser pathway—not as a social-media promise. This module covers scientific principles, candidacy, consent, operational readiness, recovery, follow-up and the limits of employee communication.',
      'Estudia Endolift como una ruta láser mínimamente invasiva dirigida por personal médico calificado, no como una promesa de redes sociales. Este módulo cubre principios científicos, candidatura, consentimiento, preparación operacional, recuperación, seguimiento y límites de comunicación.',
    ),
    objectives: [
      b('Explain the 1470 nm laser and fiber concept without teaching unsupervised technique', 'Explicar el concepto del láser de 1470 nm y la fibra sin enseñar técnica no supervisada'),
      b('Recognize screening, consent and escalation requirements', 'Reconocer requisitos de screening, consentimiento y escalamiento'),
      b('Set realistic expectations and protect provider-only decisions', 'Establecer expectativas realistas y proteger decisiones exclusivas del personal médico calificado'),
    ],
    sections: [
      section(b('History and treatment category', 'Historia y categoría del tratamiento'), b(
        'Endolift belongs to the family of interstitial laser procedures developed around fine optical fibers and wavelength-specific tissue interaction. The brand and device must be verified before each use. Employees should understand the category and patient journey, but never substitute online descriptions for the current manufacturer labeling, internal credentialing or direct clinical supervision.',
        'Endolift pertenece a la familia de procedimientos láser intersticiales desarrollados alrededor de fibras ópticas finas e interacción tisular específica por longitud de onda. La marca y el dispositivo deben verificarse antes de cada uso. El personal comprende la categoría y el recorrido, pero nunca sustituye el etiquetado vigente, credencialización interna o supervisión clínica por descripciones de internet.',
      )),
      section(b('Physical principles', 'Principios físicos'), b(
        'The LASEmaR 1500 platform uses a 1470 nm diode wavelength with affinity for water and fat. Controlled energy delivered through an optical fiber can create thermal effects associated with tissue contraction, collagen remodeling and, in selected plans, localized adipose interaction. Effect depends on anatomy, tissue, device parameters and technique; more energy is not automatically better.',
        'La plataforma LASEmaR 1500 utiliza una longitud de onda de diodo de 1470 nm con afinidad por agua y grasa. La energía controlada mediante fibra óptica puede producir efectos térmicos asociados con contracción tisular, remodelación de colágeno y, en planes seleccionados, interacción adiposa localizada. El efecto depende de anatomía, tejido, parámetros y técnica; más energía no significa automáticamente mejor.',
      )),
      section(b('How the optical fiber works', 'Cómo funciona la fibra óptica'), b(
        'The fiber carries laser energy from the device to the treatment plane selected by the qualified provider. Fiber choice, insertion plane, movement, energy and endpoint are clinical competencies—not settings to memorize from this course. The team verifies the correct sterile component, integrity, traceability and disposal under the approved SOP.',
        'La fibra transporta energía láser desde el dispositivo hasta el plano seleccionado por el personal médico calificado. La fibra, plano de inserción, movimiento, energía y endpoint son competencias clínicas, no parámetros para memorizar en este curso. El equipo verifica componente estéril correcto, integridad, trazabilidad y desecho según SOP aprobado.',
      )),
      section(b('Indications and patient selection', 'Indicaciones y selección del paciente'), b(
        'A consultation may explore laxity, contour or selected localized concerns, but only the provider decides whether the exact device indication and patient anatomy support treatment. Screening includes goals, prior procedures, medications, implanted devices when relevant, healing history, active skin conditions, infection, pregnancy status, photosensitivity factors and realistic expectations.',
        'Una consulta puede explorar flacidez, contorno o preocupaciones localizadas, pero solamente el personal médico calificado decide si la indicación exacta del dispositivo y la anatomía permiten tratamiento. El screening incluye objetivos, procedimientos previos, medicamentos, implantes cuando corresponda, cicatrización, condiciones activas de piel, infección, embarazo, factores de fotosensibilidad y expectativas realistas.',
      )),
      section(b('Contraindications and stop points', 'Contraindicaciones y puntos de detención'), b(
        'Use the current IFU and internal medical screening form; do not rely on a generic list. Active infection, unresolved medical risk, incompatible medication or device history, impaired healing, unrealistic expectations, missing consent or uncertainty about candidacy requires provider review and may require deferral. Staff do not override a stop point to preserve a sale.',
        'Utiliza el IFU vigente y el formulario médico interno; no dependas de una lista genérica. Infección activa, riesgo médico sin resolver, medicamento o implante incompatible, cicatrización comprometida, expectativas irreales, consentimiento faltante o duda de candidatura requiere revisión y puede exigir aplazamiento. El personal no ignora un stop point para conservar una venta.',
      )),
      section(b('Preparation and consent', 'Preparación y consentimiento'), b(
        'Confirm identity, provider plan, procedure-specific consent, photography authorization, pre-care compliance, sterile supplies, device maintenance status, emergency readiness and product traceability. Consent must explain the proposed benefit, alternatives, expected recovery, material risks, possibility of incomplete or asymmetric improvement and need for further care. A signature is not a substitute for comprehension.',
        'Confirma identidad, plan del personal médico calificado, consentimiento específico, autorización de fotografías, cumplimiento de preparación, suministros estériles, mantenimiento del equipo, preparación de emergencia y trazabilidad. El consentimiento explica beneficio propuesto, alternativas, recuperación, riesgos materiales, posibilidad de mejoría incompleta o asimétrica y necesidad de atención adicional. Una firma no sustituye comprensión.',
      )),
      section(b('Recovery and follow-up', 'Recuperación y seguimiento'), b(
        'Provide the approved written aftercare and scheduled clinical follow-up. The patient must know how to report unexpected pain, progressive swelling, color change, blistering, drainage, fever, neurologic symptoms or any rapidly worsening concern. Staff document exact words and timing, notify the provider promptly and activate emergency policy when indicated.',
        'Entrega aftercare escrito aprobado y seguimiento clínico programado. El paciente debe saber cómo reportar dolor inesperado, inflamación progresiva, cambio de color, ampollas, secreción, fiebre, síntomas neurológicos o empeoramiento rápido. El personal documenta palabras exactas y hora, notifica al personal médico calificado y activa la política de emergencia cuando corresponde.',
      )),
      section(b('What never to promise', 'Qué nunca prometer'), b(
        'Never promise “one session,” “no downtime,” “no anesthesia,” “scar-free,” permanent lifting, a specific percentage of tightening or the same result as another patient. Never describe Endolift as a substitute for surgery for every person. Use: “The provider will assess whether this option fits your anatomy and goals and will explain expected recovery and alternatives.”',
        'Nunca prometas “una sesión”, “sin downtime”, “sin anestesia”, “sin cicatriz”, lifting permanente, porcentaje específico de tensión ni el mismo resultado de otra persona. Nunca presentes Endolift como sustituto universal de cirugía. Usa: “El personal médico calificado evaluará si esta opción corresponde a su anatomía y objetivos y explicará recuperación y alternativas”.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: Eufoton LASEmaR 1500 manufacturer information, current device IFU and Eastern Medical procedure-specific SOP.', 'Fuentes controladas: información del fabricante Eufoton LASEmaR 1500, IFU vigente del dispositivo y SOP específico de Eastern Medical.'),
    approval,
    practice: practice(
      b('A caller asks whether Endolift will replace a facelift, require no recovery and work in one session.', 'Una persona pregunta si Endolift sustituirá un facelift, no tendrá recuperación y funcionará en una sesión.'),
      b('Which response is correct?', '¿Cuál respuesta es correcta?'),
      [
        b('Confirm all three claims because the manufacturer page uses similar language.', 'Confirmar las tres afirmaciones porque la página del fabricante usa lenguaje parecido.'),
        b('Explain that candidacy, expected recovery, alternatives and likely treatment plan require a provider assessment; do not guarantee sessions or outcome.', 'Explicar que candidatura, recuperación, alternativas y plan probable requieren evaluación del personal médico calificado; no garantizar sesiones ni resultado.'),
        b('Tell the caller to choose the treatment based on social-media photos.', 'Decir que escoja el tratamiento basado en fotos de redes sociales.'),
      ],
      1,
      b('Correct. Manufacturer marketing never replaces patient-specific assessment, labeling or truthful expectations.', 'Correcto. El marketing del fabricante nunca sustituye evaluación individual, etiquetado ni expectativas veraces.'),
    ),
  },
  {
    title: b('Botox · complete course', 'Botox · curso completo'),
    intro: b(
      'Botox Cosmetic is a prescription botulinum toxin product with product-specific labeling, dosing and safety controls. Learn mechanism, consultation, chain of custody, consent, follow-up and urgent escalation without crossing into unsupervised injection technique.',
      'Botox Cosmetic es un producto de toxina botulínica con receta y etiquetado, dosificación y controles de seguridad específicos. Aprende mecanismo, consulta, cadena de custodia, consentimiento, seguimiento y escalamiento urgente sin entrar en técnica de inyección no supervisada.',
    ),
    objectives: [
      b('Explain neuromodulation and product specificity', 'Explicar neuromodulación y especificidad del producto'),
      b('Recognize contraindications, warnings and urgent symptoms', 'Reconocer contraindicaciones, advertencias y síntomas urgentes'),
      b('Manage documentation, expectations and follow-up', 'Manejar documentación, expectativas y seguimiento'),
    ],
    sections: [
      section(b('Mechanism and product identity', 'Mecanismo e identidad del producto'), b(
        'Botulinum toxin type A temporarily reduces signaling at targeted neuromuscular junctions. Botox units are product-specific and are not interchangeable with units of another toxin. Only authentic product from an authorized source, stored, reconstituted and used according to current labeling and policy, enters the workflow.',
        'La toxina botulínica tipo A reduce temporalmente la señal en uniones neuromusculares seleccionadas. Las unidades de Botox son específicas y no se intercambian con unidades de otra toxina. Solamente producto auténtico de fuente autorizada, almacenado, reconstituido y utilizado según etiquetado y política vigentes entra al flujo.',
      )),
      section(b('Consultation and indication', 'Consulta e indicación'), b(
        'The provider identifies the concern, examines facial dynamics and anatomy, reviews prior toxin response and confirms whether the requested area falls within current labeling or an appropriately governed clinical plan. Employees never quote a dose or select injection points from photographs.',
        'El personal médico calificado identifica la preocupación, examina dinámica facial y anatomía, revisa respuesta previa y confirma si el área corresponde al etiquetado vigente o a un plan clínico gobernado. El personal nunca cotiza dosis ni selecciona puntos de inyección por fotografías.',
      )),
      section(b('Screening and consent', 'Screening y consentimiento'), b(
        'Screen for allergy to botulinum toxin product components, infection at proposed sites, relevant neuromuscular history, swallowing or breathing problems, medications and prior toxin products and dates. Consent addresses temporary effect, asymmetry, eyelid or brow effects, dry eye, headache and other material risks from current labeling.',
        'Realiza screening de alergia a componentes, infección en sitios propuestos, historia neuromuscular, problemas al tragar o respirar, medicamentos y toxinas previas con fecha. El consentimiento aborda efecto temporal, asimetría, efectos en párpado o ceja, ojo seco, cefalea y otros riesgos materiales del etiquetado vigente.',
      )),
      section(b('Safety and boxed warning', 'Seguridad y boxed warning'), b(
        'The prescribing information warns that toxin effects may spread beyond the injection site. Difficulty swallowing, speaking or breathing, generalized weakness or other concerning systemic symptoms require immediate clinical escalation and emergency direction. Staff do not wait for a routine follow-up slot.',
        'La información de prescripción advierte que los efectos pueden extenderse más allá del sitio de inyección. Dificultad para tragar, hablar o respirar, debilidad generalizada u otros síntomas sistémicos preocupantes requieren escalamiento clínico inmediato e instrucción de emergencia. El personal no espera una cita rutinaria.',
      )),
      section(b('Documentation and follow-up', 'Documentación y seguimiento'), b(
        'Document the product, lot, expiration, treatment record, responsible provider, consent, standardized photographs and aftercare in the approved chart. Explain that onset and duration vary; schedule the provider-directed review and route concerns without promising a free correction or independent touch-up.',
        'Documenta producto, lote, vencimiento, registro de tratamiento, personal médico calificado responsable, consentimiento, fotografías estandarizadas y aftercare en el expediente aprobado. Explica que inicio y duración varían; agenda revisión indicada y canaliza dudas sin prometer corrección gratis ni retoque independiente.',
      )),
      section(b('Frequent errors', 'Errores frecuentes'), b(
        'Errors include treating brand names as interchangeable, using unverified product, skipping prior-toxin history, promising a frozen or perfectly symmetric result, letting sales language choose dose and failing to escalate swallowing or breathing symptoms. Every one of these errors breaks a clinical control.',
        'Los errores incluyen tratar marcas como intercambiables, usar producto no verificado, omitir historia de toxinas, prometer resultado congelado o perfectamente simétrico, permitir que ventas determine dosis y no escalar síntomas al tragar o respirar. Cada error rompe un control clínico.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: current FDA-approved Botox Cosmetic prescribing information and Eastern Medical injectable SOP.', 'Fuentes controladas: información de prescripción de Botox Cosmetic aprobada por FDA y SOP de inyectables de Eastern Medical.'),
    approval,
    practice: practice(
      b('A patient messages after Botox reporting new difficulty swallowing.', 'Una paciente escribe después de Botox reportando nueva dificultad para tragar.'),
      b('What is the correct first action?', '¿Cuál es la primera acción correcta?'),
      [
        b('Reassure her that it is normal and wait until tomorrow.', 'Asegurarle que es normal y esperar hasta mañana.'),
        b('Immediately escalate to the provider and direct emergency evaluation according to policy; document exact symptoms and timing.', 'Escalar inmediatamente al personal médico calificado e indicar evaluación de emergencia según política; documentar síntomas exactos y hora.'),
        b('Offer a discount on the next visit.', 'Ofrecer descuento en la próxima visita.'),
      ],
      1,
      b('Correct. Swallowing or breathing symptoms are not a sales or routine scheduling issue.', 'Correcto. Los síntomas al tragar o respirar no son un asunto de ventas ni de agenda rutinaria.'),
    ),
  },
  {
    title: b('Dermal fillers · complete course', 'Fillers · curso completo'),
    intro: b(
      'Dermal fillers are medical implants used for specific labeled indications. This module teaches filler categories, assessment, informed consent, product traceability, vascular-emergency recognition and ethical expectation setting.',
      'Los fillers son implantes médicos utilizados para indicaciones específicas. Este módulo enseña categorías, evaluación, consentimiento informado, trazabilidad, reconocimiento de emergencia vascular y expectativas éticas.',
    ),
    objectives: [
      b('Distinguish filler categories and indication-specific use', 'Distinguir categorías de filler y uso por indicación'),
      b('Recognize vascular and visual red flags', 'Reconocer señales vasculares y visuales de alarma'),
      b('Apply traceability, consent and follow-up controls', 'Aplicar controles de trazabilidad, consentimiento y seguimiento'),
    ],
    sections: [
      section(b('What a filler is', 'Qué es un filler'), b(
        'FDA-approved dermal fillers are injectable implants approved for particular uses, patient populations and anatomical areas. Common materials include hyaluronic acid, calcium hydroxylapatite and poly-L-lactic acid, but they do not behave the same way. The exact product label—not the generic word “filler”—controls the indication and precautions.',
        'Los fillers aprobados por FDA son implantes inyectables aprobados para usos, poblaciones y áreas anatómicas específicas. Los materiales comunes incluyen ácido hialurónico, hidroxiapatita de calcio y ácido poli-L-láctico, pero no se comportan igual. El etiquetado exacto, no la palabra genérica “filler”, controla indicación y precauciones.',
      )),
      section(b('Assessment and selection', 'Evaluación y selección'), b(
        'The provider evaluates anatomy, skin quality, volume pattern, movement, prior filler, goals and alternatives. Screening includes allergies, infection, inflammatory or bleeding history, medications, dental or medical timing when relevant and prior complications. Staff do not choose a product based only on price or promotion.',
        'El personal médico calificado evalúa anatomía, piel, patrón de volumen, movimiento, filler previo, objetivos y alternativas. El screening incluye alergias, infección, historia inflamatoria o de sangrado, medicamentos, procedimientos dentales o médicos cuando correspondan y complicaciones previas. El personal no escoge producto solamente por precio o promoción.',
      )),
      section(b('Consent and realistic outcomes', 'Consentimiento y resultados realistas'), b(
        'Consent explains temporary or gradual effects depending on product, possible swelling, bruising, tenderness, nodules, asymmetry, infection and the rare but severe risk of unintended intravascular injection. A patient must understand alternatives and that correction may be limited or product-dependent.',
        'El consentimiento explica efectos temporales o graduales según producto, inflamación, moretones, sensibilidad, nódulos, asimetría, infección y el riesgo raro pero grave de inyección intravascular no intencional. El paciente comprende alternativas y que la corrección puede ser limitada o depender del producto.',
      )),
      section(b('Vascular emergency recognition', 'Reconocimiento de emergencia vascular'), b(
        'Unusual or severe pain, blanching, dusky or mottled color, cool skin, delayed capillary refill, visual change, severe headache or neurologic symptom after filler demands immediate activation of the clinic complication pathway. Vision symptoms and neurologic signs are emergencies. Staff document and escalate; they do not diagnose over text.',
        'Dolor inusual o intenso, palidez, color oscuro o moteado, piel fría, llenado capilar retrasado, cambio visual, cefalea intensa o síntoma neurológico después de filler exige activar inmediatamente la ruta de complicaciones. Síntomas visuales y neurológicos son emergencias. El personal documenta y escala; no diagnostica por mensaje.',
      )),
      section(b('Product controls', 'Controles del producto'), b(
        'Use only sealed, authentic product from an authorized source. Verify correct patient, product, lot, expiration and treatment record; retain labels according to SOP. Needle-free filler devices are not FDA approved. Product substitution or transfer between patients is prohibited.',
        'Utiliza solamente producto sellado y auténtico de fuente autorizada. Verifica paciente, producto, lote, vencimiento y registro; conserva etiquetas según SOP. Los dispositivos de filler sin aguja no están aprobados por FDA. Se prohíbe sustituir producto o transferirlo entre pacientes.',
      )),
      section(b('Aftercare and common errors', 'Aftercare y errores comunes'), b(
        'Deliver product-appropriate written aftercare, the escalation number and scheduled review. Frequent failures are vague consent, no baseline photographs, missing lot traceability, promising perfect symmetry, minimizing pain or color change, and allowing social media to replace a clinical assessment.',
        'Entrega aftercare escrito apropiado al producto, número de escalamiento y revisión agendada. Fallas frecuentes: consentimiento vago, ausencia de fotos iniciales, lote no rastreado, prometer simetría perfecta, minimizar dolor o cambio de color y permitir que redes sociales sustituyan evaluación clínica.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: FDA Dermal Fillers guidance, exact product labeling and Eastern Medical complication protocol.', 'Fuentes controladas: guía de Dermal Fillers de FDA, etiquetado exacto del producto y protocolo de complicaciones de Eastern Medical.'),
    approval,
    practice: practice(
      b('Minutes after filler, a patient reports severe pain and the skin looks pale and mottled.', 'Minutos después de filler, una paciente reporta dolor intenso y la piel se ve pálida y moteada.'),
      b('What should the employee do?', '¿Qué debe hacer el colaborador?'),
      [
        b('Tell her to massage it at home and send a photo tomorrow.', 'Decirle que lo masajee en casa y envíe foto mañana.'),
        b('Activate the clinic vascular-complication pathway and notify the qualified provider immediately.', 'Activar la ruta de complicación vascular y notificar inmediatamente al personal médico calificado.'),
        b('Wait for the color to normalize before documenting.', 'Esperar que el color se normalice antes de documentar.'),
      ],
      1,
      b('Correct. Severe pain and color change after filler are time-sensitive warning signs.', 'Correcto. Dolor intenso y cambio de color después de filler son señales sensibles al tiempo.'),
    ),
  },
  {
    title: b('Radiesse · complete course', 'Radiesse · curso completo'),
    intro: b(
      'Radiesse is a calcium hydroxylapatite-based injectable implant with product- and indication-specific labeling. Learn its scaffold concept, patient selection, consent, traceability and boundaries without assuming it behaves like hyaluronic acid filler.',
      'Radiesse es un implante inyectable basado en hidroxiapatita de calcio con etiquetado específico por producto e indicación. Aprende su concepto de soporte, selección, consentimiento, trazabilidad y límites sin asumir que funciona como un filler de ácido hialurónico.',
    ),
    objectives: [
      b('Explain the CaHA mechanism and product differences', 'Explicar el mecanismo de CaHA y diferencias del producto'),
      b('Apply indication-specific screening and consent', 'Aplicar screening y consentimiento según indicación'),
      b('Recognize complications and escalation needs', 'Reconocer complicaciones y necesidades de escalamiento'),
    ],
    sections: [
      section(b('Material and mechanism', 'Material y mecanismo'), b(
        'Radiesse contains calcium hydroxylapatite microspheres in a gel carrier. It can provide immediate correction from the carrier while the CaHA scaffold is associated with collagen and elastin production over time. It is not a hyaluronic acid gel and should never be described as simply reversible in the same way.',
        'Radiesse contiene microesferas de hidroxiapatita de calcio en un gel portador. Puede ofrecer corrección inicial por el gel mientras el soporte de CaHA se asocia con producción de colágeno y elastina con el tiempo. No es un gel de ácido hialurónico ni debe describirse como simplemente reversible de la misma forma.',
      )),
      section(b('Current indication controls', 'Controles de indicación vigente'), b(
        'The team must verify the exact current Radiesse product and indication before communication or treatment. Indications have expanded over time and differ by formulation and market. Employees do not generalize a hand, jawline or décolleté indication to every area or patient.',
        'El equipo verifica producto Radiesse e indicación exacta vigente antes de comunicar o tratar. Las indicaciones han cambiado y difieren por formulación y mercado. El personal no generaliza una indicación de manos, jawline o escote a toda área o paciente.',
      )),
      section(b('Selection and exclusions', 'Selección y exclusiones'), b(
        'The provider assesses anatomy, tissue quality, desired correction, prior implants and alternatives. Active infection, severe allergy history, bleeding risk, inappropriate anatomy, unrealistic expectations or any contraindication in current labeling requires deferral or another plan. Dilution and technique are provider competencies governed by current protocols.',
        'El personal médico calificado evalúa anatomía, calidad tisular, corrección deseada, implantes previos y alternativas. Infección activa, historia de alergia grave, riesgo de sangrado, anatomía inapropiada, expectativas irreales o contraindicación vigente exige aplazamiento u otro plan. Dilución y técnica son competencias del personal médico calificado gobernadas por protocolos vigentes.',
      )),
      section(b('Consent and never-promises', 'Consentimiento y promesas prohibidas'), b(
        'Discuss bruising, swelling, pain, nodules, asymmetry, infection and vascular risks as applicable to the exact use. Never promise immediate final results, permanent collagen, no nodules, universal skin tightening or easy dissolution. Explain that response and longevity vary.',
        'Explica moretones, inflamación, dolor, nódulos, asimetría, infección y riesgos vasculares según el uso exacto. Nunca prometas resultado final inmediato, colágeno permanente, ausencia de nódulos, tensión universal ni disolución sencilla. Explica que respuesta y duración varían.',
      )),
      section(b('Traceability and follow-up', 'Trazabilidad y seguimiento'), b(
        'Record exact product, lot, expiration, amount documented by the provider, site record, consent and photographs. Give written aftercare and a defined follow-up. Persistent nodules, escalating pain, color change, fever, drainage, visual or neurologic symptoms require prompt escalation under the complication plan.',
        'Registra producto exacto, lote, vencimiento, cantidad documentada por el personal médico calificado, sitios, consentimiento y fotos. Entrega aftercare escrito y seguimiento definido. Nódulos persistentes, dolor creciente, cambio de color, fiebre, secreción, síntomas visuales o neurológicos requieren escalamiento según protocolo.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: current Radiesse patient guide/eIFU and Eastern Medical injectable SOP.', 'Fuentes controladas: guía del paciente/eIFU vigente de Radiesse y SOP de inyectables de Eastern Medical.'),
    approval,
    practice: practice(
      b('A coordinator tells a patient that Radiesse can always be dissolved like a hyaluronic acid filler.', 'Una coordinadora dice que Radiesse siempre se puede disolver como un filler de ácido hialurónico.'),
      b('What is the correct correction?', '¿Cuál es la corrección adecuada?'),
      [
        b('Leave the statement because all fillers are equivalent.', 'Dejar la afirmación porque todos los fillers son equivalentes.'),
        b('Correct the misinformation, explain that CaHA is a different material and route product-specific questions to the provider.', 'Corregir la información, explicar que CaHA es un material diferente y canalizar preguntas específicas al personal médico calificado.'),
        b('Promise that any complication disappears on its own.', 'Prometer que cualquier complicación desaparece sola.'),
      ],
      1,
      b('Correct. Material differences are clinically important and must be communicated accurately.', 'Correcto. Las diferencias de material son clínicamente importantes y deben comunicarse con precisión.'),
    ),
  },
  {
    title: b('Sculptra · complete course', 'Sculptra · curso completo'),
    intro: b(
      'Sculptra is a poly-L-lactic acid injectable implant designed for gradual correction under its current labeling. Learn the biostimulatory concept, staged expectations, preparation controls, consent and follow-up.',
      'Sculptra es un implante inyectable de ácido poli-L-láctico diseñado para corrección gradual según su etiquetado. Aprende el concepto bioestimulador, expectativas por etapas, controles de preparación, consentimiento y seguimiento.',
    ),
    objectives: [
      b('Describe gradual PLLA tissue response', 'Describir la respuesta gradual de PLLA'),
      b('Set accurate treatment-course expectations', 'Establecer expectativas correctas del proceso'),
      b('Recognize nodules, inflammation and escalation needs', 'Reconocer nódulos, inflamación y necesidad de escalamiento'),
    ],
    sections: [
      section(b('PLLA and gradual correction', 'PLLA y corrección gradual'), b(
        'Sculptra is based on poly-L-lactic acid particles and is used through a provider-designed treatment plan. Initial fluid-related fullness is not the final result; change develops gradually. Employees must distinguish gradual biostimulation from an immediate volumizing promise.',
        'Sculptra se basa en partículas de ácido poli-L-láctico y se usa mediante un plan diseñado por personal médico calificado. El volumen inicial relacionado con líquido no es el resultado final; el cambio se desarrolla gradualmente. El personal distingue bioestimulación gradual de una promesa de volumen inmediato.',
      )),
      section(b('Selection and treatment planning', 'Selección y planificación'), b(
        'The provider reviews anatomy, tissue quality, desired pace, prior treatments, immune and inflammatory history, medications and ability to follow aftercare. The number and timing of sessions are individualized; staff never guarantee a package before clinical assessment.',
        'El personal médico calificado revisa anatomía, calidad tisular, ritmo deseado, tratamientos previos, historia inmune e inflamatoria, medicamentos y capacidad de seguir aftercare. Cantidad y tiempo de sesiones se individualizan; el personal nunca garantiza paquete antes de evaluación.',
      )),
      section(b('Product preparation controls', 'Controles de preparación'), b(
        'Reconstitution, storage, timing and administration follow the current eIFU and internal SOP exactly. Authorized staff document lot, expiration, preparation time and chain of custody as required. Internet shortcuts and outdated recipes are not acceptable controlled instructions.',
        'Reconstitución, almacenamiento, tiempo y administración siguen exactamente eIFU vigente y SOP interno. Personal autorizado documenta lote, vencimiento, hora de preparación y cadena de custodia. Atajos de internet y recetas antiguas no son instrucciones controladas.',
      )),
      section(b('Consent and follow-up', 'Consentimiento y seguimiento'), b(
        'Consent covers gradual response, need for a series or maintenance when clinically appropriate, swelling, bruising, tenderness, asymmetry, papules or nodules and other label risks. Provide current aftercare, confirm understanding and schedule the planned assessment.',
        'El consentimiento cubre respuesta gradual, posible serie o mantenimiento clínicamente apropiado, inflamación, moretones, sensibilidad, asimetría, pápulas o nódulos y otros riesgos. Entrega aftercare vigente, confirma comprensión y agenda evaluación.',
      )),
      section(b('Common errors', 'Errores frecuentes'), b(
        'Common failures are selling a guaranteed session count, presenting initial swelling as the outcome, using outdated preparation instructions, failing to document traceability, promising permanent collagen or dismissing a persistent lump without provider review.',
        'Fallas comunes: vender cantidad garantizada de sesiones, presentar inflamación inicial como resultado, usar preparación desactualizada, omitir trazabilidad, prometer colágeno permanente o ignorar un bulto persistente sin revisión.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: current Sculptra eIFU/FDA labeling and Eastern Medical injectable SOP.', 'Fuentes controladas: eIFU/etiquetado FDA vigente de Sculptra y SOP de inyectables de Eastern Medical.'),
    approval,
    practice: practice(
      b('A patient calls the next day upset because the initial fullness decreased.', 'Una paciente llama al día siguiente molesta porque disminuyó el volumen inicial.'),
      b('What should the coordinator explain?', '¿Qué debe explicar la coordinadora?'),
      [
        b('The treatment failed and must be repeated immediately.', 'El tratamiento falló y debe repetirse inmediatamente.'),
        b('Sculptra is designed for a gradual response; document the concern and follow the provider-directed assessment schedule without promising the final outcome.', 'Sculptra está diseñado para respuesta gradual; documentar la preocupación y seguir la evaluación indicada sin prometer resultado final.'),
        b('The initial swelling was the permanent result.', 'La inflamación inicial era el resultado permanente.'),
      ],
      1,
      b('Correct. Accurate expectation setting prevents confusion and supports safe follow-up.', 'Correcto. Expectativas precisas evitan confusión y apoyan seguimiento seguro.'),
    ),
  },
  {
    title: b('PiXel8 RF · complete course', 'PiXel8 RF · curso completo'),
    intro: b(
      'PiXel8 RF combines microneedle delivery with radiofrequency energy. Learn device-indication discipline, patient screening, sterile consumable controls, energy safety, recovery and complication escalation.',
      'PiXel8 RF combina microagujas con energía de radiofrecuencia. Aprende disciplina de indicaciones, screening, controles de consumibles estériles, seguridad energética, recuperación y escalamiento de complicaciones.',
    ),
    objectives: [
      b('Explain fractional RF principles and labeling boundaries', 'Explicar principios de RF fraccionada y límites del etiquetado'),
      b('Prepare a safe, traceable device workflow', 'Preparar un flujo seguro y rastreable del equipo'),
      b('Recognize expected recovery versus concerning symptoms', 'Reconocer recuperación esperada frente a síntomas preocupantes'),
    ],
    sections: [
      section(b('Technology and intended use', 'Tecnología y uso previsto'), b(
        'PiXel8 RF uses a microneedle array to deliver radiofrequency energy at provider-selected parameters. Manufacturer indications include dermatologic and general surgical procedures for electrocoagulation and hemostasis. Marketing terms such as tightening, texture or scar improvement must be tied to current clearance, evidence and the provider plan.',
        'PiXel8 RF utiliza un arreglo de microagujas para entregar radiofrecuencia con parámetros seleccionados por el personal médico calificado. Las indicaciones del fabricante incluyen procedimientos dermatológicos y quirúrgicos para electrocoagulación y hemostasia. Términos como tensión, textura o cicatrices deben vincularse a autorización vigente, evidencia y plan del personal médico calificado.',
      )),
      section(b('Screening', 'Screening'), b(
        'The provider evaluates skin condition, infection, wound-healing history, medications, recent procedures, implanted electronic or metal devices when relevant, pigmentation risk and treatment goals. Exact contraindications come from the current IFU; a promotion never overrides screening.',
        'El personal médico calificado evalúa piel, infección, cicatrización, medicamentos, procedimientos recientes, dispositivos electrónicos o metálicos cuando corresponda, riesgo de pigmentación y objetivos. Las contraindicaciones exactas vienen del IFU vigente; una promoción nunca sustituye screening.',
      )),
      section(b('Room and consumable control', 'Control del salón y consumibles'), b(
        'Confirm device maintenance status, correct single-use sterile tip, intact package, lot/expiration if applicable, grounding or return requirements, clean room, eye and sharps controls, emergency readiness and approved photographs. Reusing a single-use tip or bypassing a device alert is prohibited.',
        'Confirma mantenimiento, punta estéril de un uso, empaque intacto, lote/vencimiento cuando aplique, requisitos de retorno, salón limpio, controles oculares y de punzantes, emergencia y fotos. Reutilizar una punta de un uso o ignorar una alerta está prohibido.',
      )),
      section(b('Provider-only parameters', 'Parámetros exclusivos del personal médico calificado'), b(
        'Needle depth, energy, pulse pattern, passes, endpoint and treatment zones are selected by trained personnel using the current IFU, internal protocol and patient assessment. This Academy does not authorize a person to operate the device. Competency requires hands-on manufacturer training and supervised validation.',
        'Profundidad, energía, patrón de pulso, pases, endpoint y zonas son seleccionados por personal entrenado usando IFU, protocolo y evaluación. Esta Academia no autoriza operar el equipo. La competencia requiere entrenamiento práctico del fabricante y validación supervisada.',
      )),
      section(b('Recovery and escalation', 'Recuperación y escalamiento'), b(
        'Give approved aftercare for cleansing, sun protection and product restrictions. Escalate severe or increasing pain, blistering, unexpected burns, drainage, fever, marked swelling, delayed healing or pigment concerns. Never tell a patient that every reaction is normal without clinical review.',
        'Entrega aftercare aprobado sobre limpieza, protección solar y restricciones. Escala dolor severo o creciente, ampollas, quemaduras inesperadas, secreción, fiebre, inflamación marcada, cicatrización tardía o pigmentación. Nunca digas que toda reacción es normal sin revisión clínica.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: Rohrer Aesthetics current indications for use, device IFU and Eastern Medical energy-device SOP.', 'Fuentes controladas: indicaciones vigentes de Rohrer Aesthetics, IFU del equipo y SOP de dispositivos de energía de Eastern Medical.'),
    approval,
    practice: practice(
      b('The device displays an alert, but the schedule is running late and the patient is already numbed.', 'El equipo muestra una alerta, pero la agenda está atrasada y la paciente ya está preparada.'),
      b('What is the correct action?', '¿Cuál es la acción correcta?'),
      [
        b('Bypass the alert and lower the energy.', 'Ignorar la alerta y bajar energía.'),
        b('Stop, preserve the patient condition, notify the qualified operator and follow the device troubleshooting/service policy before proceeding.', 'Detenerse, proteger a la paciente, notificar al operador cualificado y seguir la política de troubleshooting/servicio antes de continuar.'),
        b('Ask the patient whether she accepts the risk.', 'Preguntar a la paciente si acepta el riesgo.'),
      ],
      1,
      b('Correct. Schedule pressure never authorizes bypassing a device safety control.', 'Correcto. La presión de agenda nunca autoriza ignorar un control de seguridad.'),
    ),
  },
  {
    title: b('Spectrum Laser · complete course', 'Spectrum Laser · curso completo'),
    intro: b(
      'Spectrum is a multi-application laser and light platform. The central competency is not memorizing a menu—it is matching the exact handpiece, wavelength, indication, patient screening and safety controls to the provider-approved plan.',
      'Spectrum es una plataforma de láser y luz con múltiples aplicaciones. La competencia central no es memorizar un menú, sino conectar pieza de mano, longitud de onda, indicación, screening y controles con el plan aprobado.',
    ),
    objectives: [
      b('Differentiate handpiece-specific indications', 'Distinguir indicaciones específicas por pieza de mano'),
      b('Apply laser safety and skin-risk screening', 'Aplicar seguridad láser y screening de riesgo cutáneo'),
      b('Prevent wrong-device and wrong-setting events', 'Prevenir eventos de equipo o parámetros incorrectos'),
    ],
    sections: [
      section(b('A platform, not one treatment', 'Una plataforma, no un tratamiento'), b(
        'Spectrum can support different applications through distinct laser or light components. Hair reduction, pigment, vascular, tattoo and resurfacing pathways are not interchangeable. Each has an exact cleared indication, wavelength, handpiece, eye protection, parameter range and patient-selection standard.',
        'Spectrum puede apoyar aplicaciones diferentes mediante componentes de láser o luz. Depilación, pigmento, vascular, tatuaje y resurfacing no son intercambiables. Cada una tiene indicación autorizada, longitud de onda, pieza, protección ocular, parámetros y selección propios.',
      )),
      section(b('The laser time-out', 'El time-out del láser'), b(
        'Before activation, verbally confirm patient, treatment, body area, handpiece, wavelength, approved parameters, skin assessment, photographs, consent, eye protection for everyone, plume control when applicable and room signage. If any element differs from the plan, stop.',
        'Antes de activar, confirma verbalmente paciente, tratamiento, área, pieza de mano, longitud de onda, parámetros aprobados, evaluación de piel, fotos, consentimiento, protección ocular de todos, control de plume cuando aplique y señalización. Si algo difiere del plan, detente.',
      )),
      section(b('Screening and test strategy', 'Screening y estrategia de prueba'), b(
        'The provider or authorized operator reviews skin type, tan or sun exposure, medications and photosensitizers, prior reactions, active lesions, infection, healing and pigment history. Test spots, cooling and treatment timing follow the exact IFU and internal SOP; they are not improvised from memory.',
        'El personal médico calificado u operador autorizado revisa tipo de piel, bronceado o sol, medicamentos y fotosensibilizantes, reacciones previas, lesiones activas, infección, cicatrización y pigmentación. Test spots, enfriamiento y tiempos siguen IFU y SOP; no se improvisan de memoria.',
      )),
      section(b('Communication by application', 'Comunicación por aplicación'), b(
        'Explain that different targets respond differently and multiple sessions may be considered, but never promise permanent removal, complete pigment clearance, scarless tattoo removal or uniform response. The provider explains alternatives and risks such as burns, blistering, scarring or pigment change.',
        'Explica que distintos objetivos responden diferente y pueden considerarse varias sesiones, pero nunca prometas eliminación permanente, desaparición total de pigmento, tatuaje sin cicatriz ni respuesta uniforme. El personal médico calificado explica alternativas y riesgos como quemadura, ampolla, cicatriz o cambio pigmentario.',
      )),
      section(b('Post-treatment controls', 'Controles posteriores'), b(
        'Document device and handpiece, parameters entered by the authorized operator, treatment area, endpoint, photographs and aftercare. Severe pain, blistering, progressive swelling, drainage, fever, unexpected whitening or darkening, visual symptoms or delayed healing requires prompt provider review.',
        'Documenta equipo y pieza, parámetros registrados por operador autorizado, área, endpoint, fotos y aftercare. Dolor severo, ampollas, inflamación progresiva, secreción, fiebre, aclaramiento u oscurecimiento inesperado, síntomas visuales o cicatrización tardía requiere revisión rápida.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: Rohrer Spectrum current indications, device IFU, laser safety policy and Eastern Medical SOP.', 'Fuentes controladas: indicaciones vigentes de Rohrer Spectrum, IFU, política de seguridad láser y SOP de Eastern Medical.'),
    approval,
    practice: practice(
      b('The room is ready for laser hair reduction, but one employee is not wearing wavelength-appropriate eye protection.', 'El salón está listo para depilación láser, pero una empleada no tiene protección ocular apropiada.'),
      b('What happens next?', '¿Qué ocurre ahora?'),
      [
        b('Proceed if the employee looks away.', 'Continuar si la empleada mira hacia otro lado.'),
        b('Do not activate the laser until every person has the required protection and the time-out is complete.', 'No activar el láser hasta que toda persona tenga protección requerida y se complete el time-out.'),
        b('Ask the patient to accept responsibility.', 'Pedir a la paciente que acepte responsabilidad.'),
      ],
      1,
      b('Correct. Laser eye protection is a room control, not an optional personal choice.', 'Correcto. La protección ocular láser es un control del salón, no una elección opcional.'),
    ),
  },
  {
    title: b('Venus Legacy · complete course', 'Venus Legacy · curso completo'),
    intro: b(
      'Venus Legacy is a noninvasive energy platform with indication-specific applicators. Learn how radiofrequency, pulsed electromagnetic fields and tissue-pulsing technology fit within a truthful consultation and a controlled treatment series.',
      'Venus Legacy es una plataforma no invasiva con aplicadores específicos por indicación. Aprende cómo radiofrecuencia, campos electromagnéticos pulsados y pulsación tisular encajan en una consulta veraz y una serie controlada.',
    ),
    objectives: [
      b('Explain the device concept and exact indication boundaries', 'Explicar el equipo y límites exactos de indicación'),
      b('Screen for device-related risks and comfort', 'Realizar screening de riesgos y confort'),
      b('Manage series expectations and treatment records', 'Manejar expectativas de serie y registros'),
    ],
    sections: [
      section(b('Technology and clearance', 'Tecnología y autorización'), b(
        'Venus Legacy combines multipolar radiofrequency, pulsed electromagnetic fields and applicator-dependent tissue pulsing. Current FDA-cleared indications are specific; they include selected noninvasive wrinkle/rhytid and temporary cellulite-appearance uses with defined applicators and populations. “Body contouring” must not become a weight-loss claim.',
        'Venus Legacy combina radiofrecuencia multipolar, campos electromagnéticos pulsados y pulsación tisular según aplicador. Las indicaciones 510(k) son específicas e incluyen usos seleccionados no invasivos para arrugas y apariencia temporal de celulitis con aplicadores y poblaciones definidas. “Contorno corporal” no debe convertirse en promesa de pérdida de peso.',
      )),
      section(b('Screening and expectations', 'Screening y expectativas'), b(
        'Review current IFU contraindications, pregnancy status, implanted electrical devices, relevant metal, active skin issues, sensation and medical history. Explain that response varies and a series may be recommended after assessment; never guarantee inches lost, permanent cellulite removal or a surgical-equivalent result.',
        'Revisa contraindicaciones del IFU, embarazo, implantes eléctricos, metal relevante, problemas activos de piel, sensibilidad e historia médica. Explica variabilidad y posible serie después de evaluación; nunca garantiza pulgadas perdidas, eliminación permanente de celulitis ni resultado equivalente a cirugía.',
      )),
      section(b('Treatment readiness', 'Preparación para tratamiento'), b(
        'Confirm correct applicator, indication, treatment area, device status, consent, photos, approved settings and patient feedback plan. Temperature and comfort monitoring follow manufacturer and internal protocols. The operator stops for unexpected pain, heat or device alert.',
        'Confirma aplicador, indicación, área, estado del equipo, consentimiento, fotos, parámetros aprobados y plan de feedback. Temperatura y confort se monitorean según fabricante y protocolos. El operador se detiene por dolor, calor inesperado o alerta.',
      )),
      section(b('Experience and follow-up', 'Experiencia y seguimiento'), b(
        'A noninvasive service still requires privacy, clean technique, accurate treatment records and aftercare. Document session number, applicator, area, operator, settings according to role, patient tolerance and next assessment. Escalate burns, blistering, persistent pain or unexpected skin change.',
        'Un servicio no invasivo requiere privacidad, técnica limpia, registro preciso y aftercare. Documenta número de sesión, aplicador, área, operador, parámetros según rol, tolerancia y próxima evaluación. Escala quemaduras, ampollas, dolor persistente o cambio inesperado.',
      )),
      section(b('Common errors', 'Errores frecuentes'), b(
        'Frequent errors include calling it a weight-loss device, using the wrong applicator, skipping implant screening, guaranteeing a number of inches, treating without a baseline record and continuing despite patient pain or an equipment alert.',
        'Errores frecuentes: llamarlo equipo de pérdida de peso, usar aplicador incorrecto, omitir screening de implantes, garantizar pulgadas, tratar sin registro inicial y continuar pese a dolor o alerta.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: current Venus Legacy manufacturer information, FDA 510(k) indication and Eastern Medical device SOP.', 'Fuentes controladas: información vigente de Venus Legacy, indicación 510(k) de FDA y SOP de Eastern Medical.'),
    approval,
    practice: practice(
      b('A lead asks how many pounds Venus Legacy will make her lose.', 'Una prospecto pregunta cuántas libras le hará perder Venus Legacy.'),
      b('What is the best response?', '¿Cuál es la mejor respuesta?'),
      [
        b('Estimate pounds based on photos.', 'Estimar libras según fotos.'),
        b('Clarify that it is not a weight-loss treatment; offer an assessment for its current aesthetic indications and discuss the separate medical weight-management pathway if relevant.', 'Aclarar que no es tratamiento de pérdida de peso; ofrecer evaluación para indicaciones estéticas vigentes y explicar por separado el programa médico si corresponde.'),
        b('Guarantee one clothing size per session.', 'Garantizar una talla por sesión.'),
      ],
      1,
      b('Correct. Device indication and medical weight management are separate pathways.', 'Correcto. La indicación del equipo y el control médico de peso son rutas separadas.'),
    ),
  },
  {
    title: b('PRF · complete course', 'PRF · curso completo'),
    intro: b(
      'Platelet-rich fibrin is an autologous blood-derived preparation. Learn the biological concept, identity and specimen controls, phlebotomy safety, consent, documentation and the limit between operational support and provider-only use.',
      'La fibrina rica en plaquetas es una preparación autóloga derivada de sangre. Aprende concepto biológico, controles de identidad y muestra, seguridad de flebotomía, consentimiento, documentación y el límite entre apoyo operacional y uso exclusivo del personal médico calificado.',
    ),
    objectives: [
      b('Explain autologous PRF without unapproved regeneration claims', 'Explicar PRF autólogo sin afirmaciones no aprobadas de regeneración'),
      b('Protect patient/specimen identity and timing', 'Proteger identidad y tiempo de paciente/muestra'),
      b('Apply bloodborne-pathogen and documentation controls', 'Aplicar controles de patógenos y documentación'),
    ],
    sections: [
      section(b('What PRF is', 'Qué es PRF'), b(
        'PRF is prepared from the patient’s own blood using a validated collection and processing workflow intended to concentrate platelets and fibrin components. Its exact clinical use and evidence depend on the protocol. Staff must not call it stem-cell therapy, guarantee tissue regeneration or imply FDA approval for every aesthetic use.',
        'PRF se prepara de la propia sangre del paciente mediante un flujo validado para concentrar plaquetas y fibrina. Su uso y evidencia dependen del protocolo. El personal no lo llama terapia de células madre, garantiza regeneración ni implica aprobación FDA para todo uso estético.',
      )),
      section(b('Identity and chain of custody', 'Identidad y cadena de custodia'), b(
        'Use two patient identifiers at collection, label at the patient side according to policy and maintain one-patient-at-a-time processing. Record collection and preparation timing, kit or tube information and responsible personnel. An unlabeled, delayed, mixed or questionable specimen is never guessed—it is stopped and escalated.',
        'Utiliza dos identificadores al recolectar, etiqueta junto al paciente según política y procesa un paciente a la vez. Registra hora, kit o tubos y personal responsable. Una muestra sin etiqueta, tardía, mezclada o dudosa nunca se adivina: se detiene y escala.',
      )),
      section(b('Screening and consent', 'Screening y consentimiento'), b(
        'The provider reviews goals, medical and bleeding history, medications, infection, prior reactions and protocol-specific eligibility. Consent separates blood draw risks from the proposed aesthetic use and explains uncertainty, alternatives, expected course and possible need for more than one visit.',
        'El personal médico calificado revisa objetivos, historia médica y de sangrado, medicamentos, infección, reacciones previas y elegibilidad. El consentimiento separa riesgos de extracción del uso estético y explica incertidumbre, alternativas, evolución y posible necesidad de más de una visita.',
      )),
      section(b('Safety and processing', 'Seguridad y procesamiento'), b(
        'Only trained, authorized staff perform phlebotomy and device processing under the approved SOP, standard precautions and sharps controls. Centrifuge setup, balance, tubes, time and handling follow the validated system; this Academy does not supply substitute parameters.',
        'Solamente personal autorizado y entrenado realiza flebotomía y procesamiento bajo SOP, precauciones estándar y control de punzantes. Centrífuga, balance, tubos, tiempo y manejo siguen el sistema validado; esta Academia no ofrece parámetros sustitutos.',
      )),
      section(b('Follow-up and escalation', 'Seguimiento y escalamiento'), b(
        'Document the procedure record and approved aftercare. Escalate fainting or draw complications during collection and later signs such as increasing pain, marked swelling, infection, color change, visual or neurologic symptoms. Autologous does not mean risk-free.',
        'Documenta procedimiento y aftercare. Escala desmayo o complicaciones durante extracción y después dolor creciente, inflamación marcada, infección, cambio de color, síntomas visuales o neurológicos. Autólogo no significa sin riesgo.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: exact PRF preparation-system instructions, OSHA bloodborne-pathogen controls and Eastern Medical PRF SOP.', 'Fuentes controladas: instrucciones del sistema exacto de PRF, controles OSHA de patógenos y SOP de PRF de Eastern Medical.'),
    approval,
    practice: practice(
      b('Two PRF tubes are on the counter and one label is incomplete.', 'Hay dos tubos de PRF y una etiqueta está incompleta.'),
      b('What is the only safe action?', '¿Cuál es la única acción segura?'),
      [
        b('Identify it by its position on the counter.', 'Identificarlo por su posición en la mesa.'),
        b('Stop the workflow, quarantine the questionable specimen and follow the identification/incident policy; never use it based on assumption.', 'Detener el flujo, separar la muestra dudosa y seguir política de identificación/incidente; nunca usarla por suposición.'),
        b('Ask both patients which tube looks like theirs.', 'Preguntar a ambos pacientes cuál tubo parece suyo.'),
      ],
      1,
      b('Correct. Autologous-product identity is an absolute safety control.', 'Correcto. La identidad del producto autólogo es un control absoluto de seguridad.'),
    ),
  },
  {
    title: b('Salmon DNA / polynucleotides', 'ADN de salmón / polinucleótidos'),
    intro: b(
      '“Salmon DNA” is a marketing phrase that may refer to PDRN or polynucleotide products with different formulations and regulatory status. This module teaches the team to verify the exact product before making any claim or creating a clinical pathway.',
      '“ADN de salmón” es un término de marketing que puede referirse a PDRN o polinucleótidos con distintas formulaciones y estatus regulatorio. Este módulo enseña a verificar el producto exacto antes de afirmar beneficios o crear una ruta clínica.',
    ),
    objectives: [
      b('Replace vague category claims with product verification', 'Sustituir afirmaciones vagas por verificación de producto'),
      b('Distinguish evidence, labeling and marketing', 'Distinguir evidencia, etiquetado y marketing'),
      b('Protect consent, sourcing and allergy screening', 'Proteger consentimiento, origen y screening de alergias'),
    ],
    sections: [
      section(b('Name the exact product', 'Nombra el producto exacto'), b(
        'PDRN and polynucleotides are not a single interchangeable treatment. Before training, advertising, purchasing or use, Clinical Leadership must document the exact manufacturer, formulation, route, source material, lot controls, U.S. regulatory status and intended use. “Popular in another country” is not U.S. authorization.',
        'PDRN y polinucleótidos no son un tratamiento único e intercambiable. Antes de entrenar, anunciar, comprar o usar, Liderazgo Clínico documenta fabricante, formulación, vía, material de origen, lote, estatus regulatorio en EE. UU. y uso. “Popular en otro país” no es autorización en EE. UU.',
      )),
      section(b('Regulatory and evidence boundary', 'Límite regulatorio y de evidencia'), b(
        'Do not describe an injectable product as FDA approved unless the exact product and indication can be verified in an official source. Do not convert preliminary research into guarantees of collagen, healing, pore reduction or rejuvenation. Approved messaging must identify what is known, what remains uncertain and what alternatives exist.',
        'No describas un inyectable como aprobado por FDA sin verificar producto e indicación exactos en fuente oficial. No conviertas investigación preliminar en garantías de colágeno, cicatrización, poros o rejuvenecimiento. El mensaje aprobado identifica lo conocido, incierto y alternativas.',
      )),
      section(b('Selection and allergy history', 'Selección e historia de alergia'), b(
        'The provider reviews allergies—especially relevant source or fish history—medical conditions, pregnancy status, active infection, inflammatory history, medications, skin status and previous reactions. An employee never reassures a patient that purification eliminates every allergy or inflammatory risk.',
        'El personal médico calificado revisa alergias, especialmente historia relevante de pescado o fuente, condiciones, embarazo, infección, inflamación, medicamentos, piel y reacciones previas. El personal nunca asegura que la purificación elimina todo riesgo alérgico o inflamatorio.',
      )),
      section(b('Sourcing and consent', 'Origen y consentimiento'), b(
        'Only a product approved by Clinical Leadership and supplied through a verified channel may enter inventory. Document lot, expiration, storage and chain of custody. Consent must use the exact product name and accurately describe regulatory status, proposed use, alternatives, uncertainty and material risks.',
        'Solamente producto aprobado por Liderazgo Clínico y de canal verificado entra al inventario. Documenta lote, vencimiento, almacenamiento y cadena. El consentimiento usa nombre exacto y describe estatus regulatorio, uso propuesto, alternativas, incertidumbre y riesgos.',
      )),
      section(b('Current Academy status', 'Estado actual en Academy'), b(
        'This module is an education and governance pathway, not authorization to inject or market a product. The clinical technique lesson remains locked until the exact product dossier, medical-director approval, Florida scope review, IFU, consent and complication protocol are attached and version-controlled.',
        'Este módulo es una ruta educativa y de gobernanza, no autorización para inyectar o anunciar. La técnica clínica permanece bloqueada hasta adjuntar y controlar dossier exacto, aprobación del director médico, revisión de scope en Florida, IFU, consentimiento y protocolo de complicaciones.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources required before clinical release: exact manufacturer dossier, official U.S. regulatory record, IFU and Eastern Medical approved SOP.', 'Fuentes requeridas antes de publicación clínica: dossier exacto del fabricante, registro regulatorio oficial de EE. UU., IFU y SOP aprobado de Eastern Medical.'),
    approval,
    practice: practice(
      b('A vendor says its imported “salmon DNA” injectable is FDA approved but provides no product-specific record.', 'Un vendedor dice que su inyectable importado de “ADN de salmón” está aprobado por FDA, pero no entrega registro específico.'),
      b('What should the team do?', '¿Qué debe hacer el equipo?'),
      [
        b('Advertise it while the paperwork arrives.', 'Anunciarlo mientras llega el documento.'),
        b('Hold purchasing, marketing and clinical use until the exact product, indication, regulatory record, sourcing and medical approval are verified.', 'Detener compra, marketing y uso hasta verificar producto, indicación, registro, origen y aprobación médica.'),
        b('Use the vendor testimonial as the controlled source.', 'Usar el testimonio del vendedor como fuente controlada.'),
      ],
      1,
      b('Correct. A category nickname and vendor claim are not regulatory evidence.', 'Correcto. Un apodo de categoría y una afirmación comercial no son evidencia regulatoria.'),
    ),
  },
  {
    title: b('PDO threads · complete course', 'Hilos PDO · curso completo'),
    intro: b(
      'PDO thread procedures place absorbable material through tissue and require advanced anatomy, sterile technique, product verification and complication readiness. Learn the complete operational and safety pathway without reducing the procedure to a “lunchtime lift.”',
      'Los procedimientos con hilos PDO colocan material absorbible a través de tejido y requieren anatomía avanzada, técnica estéril, verificación y preparación para complicaciones. Aprende la ruta operacional y de seguridad sin reducirlo a un “lifting rápido”.',
    ),
    objectives: [
      b('Explain thread categories and realistic purpose', 'Explicar categorías de hilos y propósito realista'),
      b('Recognize sterile, anatomical and product controls', 'Reconocer controles estériles, anatómicos y de producto'),
      b('Escalate asymmetry, infection, extrusion and neurovascular concerns', 'Escalar asimetría, infección, extrusión y preocupación neurovascular'),
    ],
    sections: [
      section(b('Procedure category', 'Categoría del procedimiento'), b(
        'Threads may differ in material, design, length and intended mechanical or tissue-response role. The exact product and labeling must be verified. A thread procedure is minimally invasive but not risk-free, and it cannot be represented as equivalent to surgical lifting for every patient.',
        'Los hilos difieren en material, diseño, longitud y función mecánica o tisular. Se verifica producto y etiquetado exactos. Es mínimamente invasivo, pero no libre de riesgo, y no se representa como equivalente a cirugía para todo paciente.',
      )),
      section(b('Selection and anatomy', 'Selección y anatomía'), b(
        'The qualified provider assesses tissue quality, laxity pattern, symmetry, prior procedures, scars, medical and healing history, infection, medications and expectations. Vector, entry point, plane, thread selection and number are provider-only anatomical decisions validated through hands-on competency.',
        'El personal médico calificado evalúa tejido, flacidez, simetría, procedimientos previos, cicatrices, historia médica y de cicatrización, infección, medicamentos y expectativas. Vector, entrada, plano, hilo y cantidad son decisiones anatómicas exclusivas validadas con práctica supervisada.',
      )),
      section(b('Consent and sterile readiness', 'Consentimiento y preparación estéril'), b(
        'Consent includes pain, bruising, swelling, dimpling, palpability, asymmetry, migration, extrusion, infection, nerve or vessel injury, incomplete correction and possible removal or further care. Verify sterile package, product and lot, room readiness, photographs and emergency supplies before opening.',
        'El consentimiento incluye dolor, moretón, inflamación, hoyuelos, palpabilidad, asimetría, migración, extrusión, infección, lesión nerviosa o vascular, corrección incompleta y posible remoción. Verifica empaque estéril, producto/lote, salón, fotos y emergencia antes de abrir.',
      )),
      section(b('Recovery and follow-up', 'Recuperación y seguimiento'), b(
        'Deliver the current written restrictions and scheduled provider review. Staff document concerns such as increasing pain, warmth, drainage, fever, progressive asymmetry, visible or protruding material, color change, motor or sensory change and escalate them promptly. They never cut, reposition or remove a thread.',
        'Entrega restricciones escritas vigentes y revisión programada. El personal documenta dolor creciente, calor, secreción, fiebre, asimetría progresiva, material visible, cambio de color, motor o sensorial y escala rápidamente. Nunca corta, reposiciona ni retira un hilo.',
      )),
      section(b('Frequent errors', 'Errores frecuentes'), b(
        'Common errors are trivializing the procedure, promising an instant surgical result, treating without verified product labeling, inadequate sterile controls, omitting baseline asymmetry from documentation and asking nonclinical staff to manage post-procedure complications.',
        'Errores comunes: trivializar, prometer resultado quirúrgico instantáneo, tratar sin etiquetado verificado, controles estériles insuficientes, omitir asimetría inicial y pedir a personal no clínico manejar complicaciones.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: exact thread manufacturer IFU, Florida professional-scope review and Eastern Medical thread/complication SOP.', 'Fuentes controladas: IFU del fabricante exacto, revisión de scope profesional en Florida y SOP de hilos/complicaciones de Eastern Medical.'),
    approval,
    practice: practice(
      b('A patient sends a photo of a thread protruding through the skin and asks the receptionist to trim it.', 'Una paciente envía foto de un hilo saliendo de la piel y pide a recepción que lo corte.'),
      b('What is the correct response?', '¿Cuál es la respuesta correcta?'),
      [
        b('Tell her to trim it with clean scissors.', 'Decirle que lo corte con tijeras limpias.'),
        b('Tell her not to manipulate it, document the report and arrange prompt qualified-provider assessment under the complication pathway.', 'Indicar que no lo manipule, documentar y coordinar evaluación rápida con personal médico calificado según protocolo.'),
        b('Wait until the next routine appointment.', 'Esperar hasta la próxima cita rutinaria.'),
      ],
      1,
      b('Correct. Protruding material requires clinical evaluation; nonclinical staff never manipulate it.', 'Correcto. Material expuesto requiere evaluación clínica; personal no clínico nunca lo manipula.'),
    ),
  },
  {
    title: b('Medical weight management', 'Programa médico de pérdida de peso'),
    intro: b(
      'Weight management is a longitudinal medical program, not an injection sale. Learn intake, provider evaluation, medication governance, lifestyle support, monitoring, inventory safety and retention through genuine clinical value.',
      'El control de peso es un programa médico longitudinal, no una venta de inyecciones. Aprende intake, evaluación, gobernanza de medicamentos, apoyo de hábitos, monitoreo, seguridad de inventario y retención mediante valor clínico.',
    ),
    objectives: [
      b('Describe the complete longitudinal program', 'Describir el programa longitudinal completo'),
      b('Protect prescribing, dosing and product-source boundaries', 'Proteger límites de prescripción, dosis y origen'),
      b('Recognize monitoring and urgent escalation needs', 'Reconocer monitoreo y escalamiento urgente'),
    ],
    sections: [
      section(b('Program, not product', 'Programa, no producto'), b(
        'The pathway begins with goals, history, examination and provider assessment; it may include nutrition, movement, behavior, sleep, labs, medication when appropriate and scheduled monitoring. Employees never advertise a prescription as universally appropriate or reduce success to a single scale number.',
        'La ruta comienza con objetivos, historia, examen y evaluación; puede incluir nutrición, movimiento, conducta, sueño, laboratorios, medicamento cuando corresponda y monitoreo. El personal nunca anuncia receta universal ni reduce éxito a un número en la balanza.',
      )),
      section(b('Intake and eligibility', 'Intake y elegibilidad'), b(
        'Collect the approved history and route it to the provider: current conditions, medications, allergies, prior weight treatments, relevant personal/family history, pregnancy or plans, eating patterns, symptoms, goals and barriers. Staff do not calculate candidacy or recommend medication from BMI alone.',
        'Recopila historia aprobada y canaliza: condiciones, medicamentos, alergias, tratamientos previos, historia relevante personal/familiar, embarazo o planes, alimentación, síntomas, metas y barreras. El personal no calcula candidatura ni recomienda medicamento por BMI solamente.',
      )),
      section(b('Medication governance', 'Gobernanza de medicamentos'), b(
        'A licensed provider selects an FDA-approved medication and label-appropriate plan when indicated. Compounded drugs are not FDA approved and should never be promoted as identical or generic equivalents. Product source, pharmacy license, storage, prescription, concentration and patient-specific instructions must be controlled; staff do not convert doses between “units,” milligrams and milliliters independently.',
        'El personal médico calificado selecciona medicamento aprobado e indicación apropiada cuando corresponde. Los compuestos no están aprobados por FDA y nunca se promocionan como idénticos o genéricos. Origen, licencia de farmacia, almacenamiento, receta, concentración e instrucciones se controlan; el personal no convierte dosis entre “unidades”, miligramos y mililitros por cuenta propia.',
      )),
      section(b('Monitoring and coaching', 'Monitoreo y coaching'), b(
        'At each scheduled check, capture provider-approved measures, adherence, nutrition and activity progress, medication access, adverse symptoms and next goal. Coaching uses specific, achievable behavior changes and respectful language. Plateaus trigger reassessment—not shame, unauthorized dose changes or an automatic upsell.',
        'En cada control registra medidas aprobadas, adherencia, nutrición/actividad, acceso a medicamento, síntomas y próxima meta. El coaching usa cambios específicos y respetuosos. Un plateau exige reevaluación, no vergüenza, cambios de dosis no autorizados ni venta automática.',
      )),
      section(b('Safety and urgent escalation', 'Seguridad y escalamiento urgente'), b(
        'Use the exact medication label and internal triage policy. Severe or persistent vomiting, dehydration, severe abdominal pain, allergic symptoms, confusion, fainting, symptoms of hypoglycemia or any rapidly worsening condition requires immediate clinical escalation and emergency direction when indicated.',
        'Utiliza etiqueta exacta y política interna. Vómito severo o persistente, deshidratación, dolor abdominal intenso, alergia, confusión, desmayo, síntomas de hipoglucemia o empeoramiento rápido exige escalamiento inmediato e instrucción de emergencia cuando corresponda.',
      )),
      section(b('Ethical promises and retention', 'Promesas éticas y retención'), b(
        'Never guarantee pounds, speed, permanent results, absence of side effects or insurance coverage. Retention is earned through access to the provider, reliable medication controls, useful coaching, regular follow-up and a plan for maintenance or discontinuation—not dependency created by fear.',
        'Nunca garantiza libras, velocidad, resultado permanente, ausencia de efectos ni cobertura. La retención se gana con acceso al personal médico calificado, control de medicamento, coaching útil, seguimiento y plan de mantenimiento o suspensión; no creando dependencia por miedo.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), approval),
    ],
    source: b('Controlled sources: current FDA-approved medication labels, FDA compounded GLP-1 safety communications and Eastern Medical weight-management SOP.', 'Fuentes controladas: etiquetas vigentes aprobadas por FDA, comunicaciones FDA sobre GLP-1 compuestos y SOP de control de peso de Eastern Medical.'),
    approval,
    practice: practice(
      b('A patient using a compounded GLP-1 vial is confused because the syringe says “units” but the prescription is in milligrams.', 'Una paciente con vial GLP-1 compuesto está confundida porque la jeringa dice “unidades” y la receta miligramos.'),
      b('What must staff do?', '¿Qué debe hacer el personal?'),
      [
        b('Estimate the conversion from memory.', 'Estimar la conversión de memoria.'),
        b('Do not calculate independently; verify the exact product, concentration and prescription with the licensed provider/pharmacy and deliver only approved patient-specific instructions.', 'No calcular independientemente; verificar producto, concentración y receta con personal médico calificado/farmacia y entregar solamente instrucciones aprobadas para esa paciente.'),
        b('Tell the patient all compounded vials have the same concentration.', 'Decir que todos los viales compuestos tienen la misma concentración.'),
      ],
      1,
      b('Correct. FDA has reported serious dosing errors from concentration and unit confusion.', 'Correcto. FDA ha reportado errores graves por confusión de concentración y unidades.'),
    ),
  },
  {
    title: b('Exceptional patient care', 'Atención excepcional al paciente'),
    intro: b(
      'Patient experience in aesthetics combines emotional intelligence, clinical boundaries and operational ownership. Learn how to guide a person before, during and after a service—including delays, fear, disappointment and complaints.',
      'La experiencia en estética combina inteligencia emocional, límites clínicos y responsabilidad operacional. Aprende a guiar antes, durante y después, incluyendo retrasos, miedo, decepción y quejas.',
    ),
    objectives: [
      b('Use empathetic, precise and non-defensive communication', 'Usar comunicación empática, precisa y no defensiva'),
      b('De-escalate concerns without making clinical promises', 'Desescalar preocupaciones sin promesas clínicas'),
      b('Own complaints through resolution and learning', 'Asumir quejas hasta resolución y aprendizaje'),
    ],
    sections: [
      section(b('Before the visit', 'Antes de la visita'), b(
        'Confirm the correct appointment, location, preparation, parking or arrival guidance, expected length and what the consultation can and cannot guarantee. Ask the preferred name and communication method. A prepared patient arrives with less uncertainty and the clinic operates more predictably.',
        'Confirma cita, sede, preparación, estacionamiento o llegada, duración estimada y qué puede o no garantizar la consulta. Pregunta nombre preferido y contacto. Un paciente preparado llega con menos incertidumbre y la clínica funciona mejor.',
      )),
      section(b('During the experience', 'Durante la experiencia'), b(
        'Greet promptly, protect privacy, narrate reasonable waits and never discuss another patient. Notice anxiety and tell the provider rather than minimizing it. Use teach-back: ask the patient to explain the plan or aftercare in their own words so the team can correct misunderstanding.',
        'Recibe puntualmente, protege privacidad, explica retrasos y nunca discute a otro paciente. Identifica ansiedad y avisa al personal médico calificado en vez de minimizarla. Usa teach-back: pide explicar plan o aftercare con sus palabras para corregir malentendidos.',
      )),
      section(b('When expectations differ', 'Cuando difieren las expectativas'), b(
        'Do not argue with a disappointed patient or decide that the result is normal. Acknowledge the concern, document exact observations and timeline, compare the request with the documented plan only within your role, obtain photographs through the approved channel and arrange qualified review.',
        'No discutas con un paciente decepcionado ni decidas que el resultado es normal. Reconoce, documenta observaciones y tiempo, compara con plan solamente dentro del rol, obtiene fotos por canal aprobado y coordina revisión cualificada.',
      )),
      section(b('Complaint recovery', 'Recuperación de una queja'), b(
        'Use Listen—Acknowledge—Clarify—Own—Act—Close. Never promise a refund, free treatment or clinical correction without authority. Give a named owner and response time, update the patient if the timeline changes and document the final resolution and prevention action.',
        'Usa Escuchar—Reconocer—Aclarar—Asumir—Actuar—Cerrar. Nunca prometas reembolso, tratamiento gratis o corrección sin autoridad. Da responsable y plazo, actualiza si cambia y documenta resolución y prevención.',
      )),
      section(b('Dignity and inclusion', 'Dignidad e inclusión'), b(
        'Avoid comments that create shame about age, body, weight, skin, gender expression or finances. Ask what the patient wants to change and why rather than inventing flaws. Respect a decision not to proceed. Accessibility, language support and informed choice are part of premium care.',
        'Evita comentarios que generen vergüenza sobre edad, cuerpo, peso, piel, género o finanzas. Pregunta qué desea cambiar y por qué, sin inventar defectos. Respeta no proceder. Accesibilidad, idioma y elección informada son atención premium.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled source: Eastern Medical patient-first philosophy, service recovery and communication standards.', 'Fuente controlada: filosofía de paciente primero, recuperación de servicio y comunicación de Eastern Medical.'),
    approval: operationalApproval,
    practice: practice(
      b('A patient says, “I hate the result and nobody cares.” The coordinator believes the swelling is probably normal.', 'Una paciente dice: “Odio el resultado y a nadie le importa”. La coordinadora cree que la inflamación probablemente es normal.'),
      b('Which response is best?', '¿Cuál respuesta es mejor?'),
      [
        b('“It is normal. You signed the consent.”', '“Es normal. Usted firmó consentimiento”.'),
        b('“I’m sorry this has been worrying. I’m going to document exactly what you are experiencing and arrange the appropriate clinical review. I will confirm the next step and timing with you.”', '“Lamento que esto le preocupe. Voy a documentar exactamente lo que está experimentando y coordinar la revisión clínica apropiada. Le confirmaré el próximo paso y el tiempo”.'),
        b('“Post a photo publicly so we can decide.”', '“Publique una foto para que decidamos”.'),
      ],
      1,
      b('Correct. Empathy, scope and owned escalation can coexist in one clear response.', 'Correcto. Empatía, alcance y escalamiento con responsable pueden coexistir.'),
    ),
  },
  {
    title: b('Ethical recommendations', 'Ventas éticas'),
    intro: b(
      'The goal is not to “sell a procedure.” It is to understand a person’s priority, clarify options and recommend an appropriate next step without pressure. Ethical recommendation protects both the patient and sustainable company growth.',
      'El objetivo no es “vender un procedimiento”. Es comprender la prioridad, aclarar opciones y recomendar el próximo paso apropiado sin presión. La recomendación ética protege al paciente y el crecimiento sostenible.',
    ),
    objectives: [
      b('Conduct a needs-based discovery conversation', 'Realizar una conversación basada en necesidades'),
      b('Present options, costs and uncertainty transparently', 'Presentar opciones, costos e incertidumbre con transparencia'),
      b('Recognize coercion, overpromising and scope violations', 'Reconocer presión, sobrepromesa y violación de alcance'),
    ],
    sections: [
      section(b('Discover before recommending', 'Descubrir antes de recomendar'), b(
        'Ask what the patient notices, what outcome matters, timing, prior experiences, tolerance for recovery and budget context. Reflect the need back before offering a consultation. Never manufacture insecurity by listing flaws the patient did not raise.',
        'Pregunta qué nota, qué resultado importa, tiempo, experiencias previas, tolerancia a recuperación y contexto de presupuesto. Refleja la necesidad antes de ofrecer consulta. Nunca fabriques inseguridad enumerando defectos que no mencionó.',
      )),
      section(b('Recommend a pathway, not a verdict', 'Recomendar una ruta, no un veredicto'), b(
        'Nonclinical staff recommend the next appropriate conversation—usually a consultation—not a diagnosis, product, dose or device setting. Qualified providers may present clinically appropriate options, alternatives and the choice to do nothing. The patient decides without pressure.',
        'Personal no clínico recomienda la próxima conversación apropiada, normalmente consulta, no diagnóstico, producto, dosis o parámetro. El personal médico calificado presenta opciones apropiadas, alternativas y no hacer nada. El paciente decide sin presión.',
      )),
      section(b('Transparent value', 'Valor transparente'), b(
        'Explain what is included, what is separate, total estimated cost, promotion conditions, expiration, follow-up and refund or cancellation policy using current approved materials. Never hide required fees, imply financing approval, create fake scarcity or say a price is available only if consent is signed immediately.',
        'Explica inclusiones, separaciones, costo estimado total, condiciones, vencimiento, seguimiento y política de cancelación/reembolso con materiales vigentes. Nunca ocultes cargos, impliques aprobación de crédito, inventes escasez ni condiciones precio a firmar de inmediato.',
      )),
      section(b('Handle objections as information', 'Manejar objeciones como información'), b(
        '“I need to think” is not a failure. Clarify the unanswered question, offer written information and a follow-up time, then respect the answer. If the concern is clinical, return it to the provider. If it is cost, present approved options without shaming or steering based on medical vulnerability.',
        '“Necesito pensarlo” no es fracaso. Aclara pregunta pendiente, ofrece información escrita y seguimiento, y respeta respuesta. Si es clínico, vuelve al personal médico calificado. Si es costo, presenta opciones aprobadas sin vergüenza ni aprovechar vulnerabilidad médica.',
      )),
      section(b('Conversion with integrity', 'Conversión con integridad'), b(
        'Measure response time, consultation attendance, appropriate conversion, follow-up completion, satisfaction and complaint quality together. A high sales number built on cancellations, unsafe selection, refunds or broken trust is not success. Incentives never override clinical judgment.',
        'Mide tiempo de respuesta, asistencia, conversión apropiada, seguimiento, satisfacción y quejas en conjunto. Una venta alta con cancelaciones, selección insegura, reembolsos o pérdida de confianza no es éxito. Incentivos nunca sustituyen criterio clínico.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled source: Eastern Medical ethical-growth standard and approved pricing/promotion policies.', 'Fuente controlada: estándar de crecimiento ético Eastern Medical y políticas aprobadas de precios/promociones.'),
    approval: operationalApproval,
    practice: practice(
      b('A patient says she needs time to compare options. A monthly sales goal is due today.', 'Una paciente necesita tiempo para comparar opciones. La meta mensual vence hoy.'),
      b('What is the ethical next step?', '¿Cuál es el próximo paso ético?'),
      [
        b('Say the medical result will be worse if she waits until tomorrow.', 'Decir que el resultado médico será peor si espera a mañana.'),
        b('Clarify her remaining questions, provide approved information, agree on a respectful follow-up and document the decision without pressure.', 'Aclarar preguntas, entregar información aprobada, acordar seguimiento respetuoso y documentar sin presión.'),
        b('Add an unapproved discount and require immediate payment.', 'Añadir descuento no aprobado y exigir pago inmediato.'),
      ],
      1,
      b('Correct. Ethical conversion protects informed choice and earns durable trust.', 'Correcto. La conversión ética protege elección informada y gana confianza duradera.'),
    ),
  },
  {
    title: b('Practice Fusion · complete workflow', 'Practice Fusion · flujo completo'),
    intro: b(
      'Practice Fusion is the clinical system of record for authorized workflows. Learn the end-to-end aesthetics visit from correct patient and appointment through intake, encounter support, documents, orders, aftercare and closed follow-up.',
      'Practice Fusion es el sistema clínico de registro para flujos autorizados. Aprende la visita estética completa desde paciente y cita correctos hasta intake, apoyo al encuentro, documentos, órdenes, aftercare y seguimiento cerrado.',
    ),
    objectives: [
      b('Navigate the complete visit without duplicate charts', 'Navegar la visita completa sin expedientes duplicados'),
      b('Place each document in the correct controlled record', 'Colocar cada documento en el expediente correcto'),
      b('Protect role-based access, signatures and follow-up', 'Proteger acceso por rol, firmas y seguimiento'),
    ],
    sections: [
      section(b('1 · Find before creating', '1 · Buscar antes de crear'), b(
        'Search using approved identifiers and verify name, date of birth, contact information and existing record before creating a patient. Never create a duplicate because the spelling differs. If identity or duplicate status is uncertain, stop and follow the merge/records process.',
        'Busca con identificadores aprobados y verifica nombre, fecha de nacimiento, contacto y expediente antes de crear. Nunca dupliques por diferencia de escritura. Si hay duda de identidad o duplicado, detente y sigue proceso de records/merge.',
      )),
      section(b('2 · Appointment and intake', '2 · Cita e intake'), b(
        'Create the correct appointment type, provider, location, date and duration; link the appointment to the correct patient. Send approved intake forms where configured and review submission status. Confirm required consents and documents without copying protected data into an unapproved CRM note.',
        'Crea tipo de cita, personal médico calificado asignado, sede, fecha y duración correctos; vincula al paciente. Envía intake aprobado y revisa estado. Confirma consentimientos/documentos sin copiar información protegida a notas no aprobadas del CRM.',
      )),
      section(b('3 · Pre-visit chart review', '3 · Revisión previa'), b(
        'Authorized staff review demographics, allergies, medication and history fields within their role, attach or route documents to the correct chart area and flag missing information for the provider. Never overwrite prior clinical information without the approved correction process.',
        'Personal autorizado revisa demografía, alergias, medicamentos e historia dentro de su rol, adjunta o canaliza documentos al área correcta y marca faltantes para personal médico calificado. Nunca sobreescribe información previa sin proceso de corrección.',
      )),
      section(b('4 · Encounter and provider ownership', '4 · Encuentro y responsabilidad del personal médico calificado'), b(
        'Open the encounter linked to the appointment and use the approved aesthetics template. Staff enter only authorized objective or administrative information; the provider owns assessment, diagnosis when applicable, treatment plan, orders, medication decisions, procedure note and signature. Never sign for another user.',
        'Abre encuentro vinculado y usa plantilla aprobada. Personal ingresa solamente información objetiva/administrativa autorizada; personal médico calificado es responsable de evaluación, diagnóstico, plan, órdenes, medicamentos, nota de procedimiento y firma. Nunca firmes por otra persona.',
      )),
      section(b('5 · Documents, photographs and traceability', '5 · Documentos, fotos y trazabilidad'), b(
        'Upload signed procedure-specific consent, approved photographs, product/device record, lot labels and external documents to the correct patient and date using standardized names. Verify every upload before saving. Photographs remain in approved clinical storage, not personal phones or casual messages.',
        'Sube consentimiento específico, fotos aprobadas, registro de producto/equipo, etiquetas y documentos al paciente y fecha correctos con nombres estándar. Verifica antes de guardar. Fotos permanecen en almacenamiento clínico aprobado, no teléfonos personales ni mensajes casuales.',
      )),
      section(b('6 · Close the encounter', '6 · Cerrar el encuentro'), b(
        'Confirm provider signature, aftercare delivery, orders or prescriptions routed correctly, patient questions assigned and follow-up appointment or task created. An encounter is not closed by clicking a status alone; every pending item has an owner and due date.',
        'Confirma firma del personal médico calificado, aftercare, órdenes/recetas canalizadas, preguntas asignadas y cita o tarea de seguimiento. Un encuentro no se cierra solo con un status; cada pendiente tiene responsable y fecha.',
      )),
      section(b('7 · Privacy and correction', '7 · Privacidad y corrección'), b(
        'Use unique credentials, minimum necessary access and secure workstations. Never share passwords or export a chart for convenience. Correct errors through the approved amendment process so the audit trail remains intact, and report wrong-patient access or disclosure immediately.',
        'Usa credenciales únicas, acceso mínimo y estación segura. Nunca compartas contraseñas ni exportes por conveniencia. Corrige mediante enmienda para conservar auditoría y reporta acceso/divulgación a paciente equivocado inmediatamente.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled sources: current Practice Fusion help center, Eastern Medical access policy and aesthetics charting SOP.', 'Fuentes controladas: Help Center vigente de Practice Fusion, política de acceso Eastern Medical y SOP de charting estético.'),
    approval: operationalApproval,
    practice: practice(
      b('A coordinator cannot find a patient because the last name is misspelled and wants to create a new chart quickly.', 'Una coordinadora no encuentra a la paciente porque el apellido está mal escrito y quiere crear otro expediente.'),
      b('What should happen?', '¿Qué debe ocurrir?'),
      [
        b('Create a new chart and merge it later.', 'Crear otro expediente y unirlo después.'),
        b('Search with approved alternate identifiers, verify the existing record and use the duplicate/records workflow if uncertainty remains.', 'Buscar con identificadores alternos aprobados, verificar expediente existente y usar flujo de duplicado/records si persiste duda.'),
        b('Use another patient’s chart temporarily.', 'Usar temporalmente el expediente de otra paciente.'),
      ],
      1,
      b('Correct. “Find before creating” prevents wrong-patient and duplicate-record harm.', 'Correcto. “Buscar antes de crear” previene daño por paciente equivocado o duplicado.'),
    ),
  },
  {
    title: b('Financing and payment options', 'Financiamiento y opciones de pago'),
    intro: b(
      'Financing can improve access, but it creates a separate financial decision that must remain transparent and voluntary. Learn how to present total cost, lender terms, consent, privacy, denials, refunds and the boundary between staff and creditor.',
      'El financiamiento puede mejorar acceso, pero crea una decisión financiera separada que debe ser transparente y voluntaria. Aprende costo total, términos, consentimiento, privacidad, denegación, reembolso y límites entre personal y acreedor.',
    ),
    objectives: [
      b('Present financing without pressure or hidden cost', 'Presentar financiamiento sin presión ni costo oculto'),
      b('Separate clinical recommendations from credit decisions', 'Separar recomendación clínica de decisión crediticia'),
      b('Explain next steps without guaranteeing approval', 'Explicar próximos pasos sin garantizar aprobación'),
    ],
    sections: [
      section(b('Start with the treatment estimate', 'Comienza con el estimado'), b(
        'Provide an itemized, current estimate showing planned service, deposits, what is included, possible future services and refund/cancellation rules. Financing does not replace informed treatment consent and should not be introduced as if it makes an unnecessary service medically appropriate.',
        'Entrega estimado detallado vigente con servicio, depósitos, inclusiones, servicios futuros y reglas de reembolso/cancelación. Financiamiento no sustituye consentimiento ni hace médicamente apropiado un servicio innecesario.',
      )),
      section(b('Know the Eastern programs currently being offered', 'Conocer los programas que Eastern ofrece actualmente'), b(
        'Before each shift, the responsible coordinator must review the approved financing registry—not memory or an old social post. The registry must identify every active program by financing company or internal campaign name, eligible services, minimum and maximum amount, available term, APR or no-interest condition, down payment, fees, credit-check language, application link, expiration date, refund path and support contact. If any field is missing or expired, pause the quote and ask the authorized manager to validate it. Only a program marked active in the current registry may be presented as available.',
        'Antes de cada turno, el coordinador responsable debe revisar el registro aprobado de financiamiento, no la memoria ni una publicación antigua. El registro debe identificar cada programa activo por nombre de la compañía financiera o campaña interna, servicios elegibles, monto mínimo y máximo, plazo disponible, APR o condición sin intereses, pago inicial, cargos, lenguaje sobre verificación de crédito, enlace de solicitud, fecha de vigencia, ruta de reembolso y contacto de soporte. Si falta un dato o está vencido, pausa la cotización y solicita validación al manager autorizado. Solamente un programa marcado como activo en el registro vigente puede presentarse como disponible.',
      )),
      section(b('Eastern published example · Endolift financing', 'Ejemplo publicado por Eastern · financiamiento de Endolift'), b(
        'Eastern Medical published an Endolift campaign describing payments starting at $30 per month, terms up to 24 months and no-interest/no-credit-required language. This is useful evidence of a program Eastern has promoted, but it is not a permanent quote and does not establish the terms for a specific patient. Staff must open the current approved program, confirm that the campaign is still active and show the exact written disclosure before repeating any payment, term, interest or eligibility statement.',
        'Eastern Medical publicó una campaña de Endolift que describía pagos desde $30 al mes, plazos de hasta 24 meses y lenguaje de sin intereses/sin necesidad de crédito. Es evidencia útil de un programa que Eastern ha promocionado, pero no es una cotización permanente ni establece los términos de un paciente específico. Antes de repetir cualquier pago, plazo, interés o condición de elegibilidad, el personal debe abrir el programa aprobado vigente, confirmar que la campaña continúe activa y mostrar la divulgación escrita exacta.',
      )),
      section(b('How to explain the available program', 'Cómo explicar el programa disponible'), b(
        'Use a four-part explanation: first, state the complete treatment estimate; second, name the active financing program and clarify that it is optional; third, show the patient where the financing company discloses term, APR, payment, down payment and fees; fourth, explain the next operational step without predicting approval. Say: “This program may divide the approved amount into payments. The financing company—not Eastern staff—determines your approval and exact terms. Let us review the current written options together.”',
        'Utiliza una explicación de cuatro partes: primero, presenta el estimado completo del tratamiento; segundo, nombra el programa activo y aclara que es opcional; tercero, muestra dónde la compañía financiera divulga plazo, APR, pago, pago inicial y cargos; cuarto, explica el próximo paso sin predecir aprobación. Di: “Este programa puede dividir el monto aprobado en pagos. La compañía financiera, no el personal de Eastern, determina su aprobación y términos exactos. Revisemos juntos las opciones escritas vigentes”.',
      )),
      section(b('Application workflow from estimate to confirmation', 'Flujo de solicitud desde el estimado hasta la confirmación'), b(
        'Confirm the clinically appropriate estimate and patient identity, then open only the approved financing link or QR. The patient enters personal and financial information directly and reviews disclosures before accepting. Staff may explain navigation but do not choose answers, income, term or payment for the patient. After the financing company returns a decision, document only the permitted operational status and transaction reference, reconcile the authorized amount with the exact treatment estimate, issue the required receipt and coordinate the clinical appointment. A financing approval never replaces clinical candidacy, consent or real calendar availability.',
        'Confirma el estimado clínicamente apropiado y la identidad; después abre solamente el enlace o QR aprobado. El paciente introduce directamente su información personal y financiera y revisa las divulgaciones antes de aceptar. El personal puede explicar la navegación, pero no escoge respuestas, ingreso, plazo ni pago por el paciente. Cuando la compañía financiera emite la decisión, documenta únicamente el estado operacional permitido y la referencia, concilia el monto autorizado con el estimado exacto, entrega el recibo requerido y coordina la cita clínica. Una aprobación financiera nunca sustituye candidatura clínica, consentimiento ni disponibilidad real del calendario.',
      )),
      section(b('Describe, do not advise', 'Describe, no aconsejes'), b(
        'Use approved provider materials to explain that an external lender or program determines eligibility, credit limit, APR, promotional period, fees, minimum payment and consequences of late or deferred-interest terms. Staff do not estimate approval odds or tell a patient which credit product is best.',
        'Usa materiales aprobados para explicar que un acreedor externo determina elegibilidad, límite, APR, promoción, cargos, pago mínimo y consecuencias. El personal no estima aprobación ni dice qué crédito es mejor.',
      )),
      section(b('Voluntary application and privacy', 'Solicitud voluntaria y privacidad'), b(
        'The patient completes the application through the approved channel and reviews lender disclosures before accepting. Do not enter income, Social Security number or answers on the patient’s behalf unless the authorized process specifically permits assistance. Never keep application data in a local note, text or photograph.',
        'El paciente completa solicitud por canal aprobado y revisa divulgaciones antes de aceptar. No ingreses ingreso, Seguro Social ni respuestas por el paciente salvo proceso autorizado. Nunca guardes datos en nota local, texto o foto.',
      )),
      section(b('No coercion or clinical leverage', 'Sin presión ni palanca clínica'), b(
        'Do not use fear about appearance, a medical vulnerability, sedation, time pressure or a provider relationship to push credit. The patient may pause, use another payment method or decline treatment. A credit denial is handled privately and never changes respect or clinical communication.',
        'No uses miedo sobre apariencia, vulnerabilidad médica, sedación, presión de tiempo ni relación con personal médico calificado para impulsar crédito. El paciente puede pausar, usar otro método o no tratarse. Una denegación se maneja en privado y no cambia el respeto.',
      )),
      section(b('Payment, refund and reconciliation', 'Pago, reembolso y conciliación'), b(
        'Collect only after the patient authorizes the correct amount and the treatment/payment milestone meets policy. Provide receipt, document tender and reconcile the transaction. Refunds, disputes or treatment changes follow written policy and management authorization; never promise that lender interest or fees will automatically reverse.',
        'Cobra solamente después de autorización del monto correcto y cumplimiento de política. Entrega recibo, documenta y concilia. Reembolsos, disputas o cambios siguen política y autorización; nunca prometas reversión automática de intereses o cargos.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled sources: current lender disclosures, CFPB medical-financing guidance and Eastern Medical payment/refund policy.', 'Fuentes controladas: divulgaciones vigentes del acreedor, guía CFPB de financiamiento médico y política Eastern Medical de pagos/reembolsos.'),
    approval: operationalApproval,
    practice: practice(
      b('A patient asks whether a “no interest” promotion means she can make any payment and never owe interest.', 'Una paciente pregunta si “sin interés” significa pagar cualquier monto y nunca tener interés.'),
      b('What should staff say?', '¿Qué debe decir el personal?'),
      [
        b('Yes, all promotions work that way.', 'Sí, todas las promociones funcionan así.'),
        b('Review the exact lender disclosure with her and explain that APR, minimum payments, promotional deadlines and deferred-interest consequences come from the creditor; do not reinterpret or guarantee them.', 'Revisar divulgación exacta y explicar que APR, mínimos, fechas y consecuencias vienen del acreedor; no reinterpretar ni garantizar.'),
        b('Tell her to sign first and read it later.', 'Decir que firme primero y lea después.'),
      ],
      1,
      b('Correct. Financing terms must come from the current written disclosure, not a verbal shortcut.', 'Correcto. Los términos vienen de divulgación escrita vigente, no un atajo verbal.'),
    ),
  },
  {
    title: b('WhatsApp patient conversations', 'Conversaciones por WhatsApp'),
    intro: b(
      'WhatsApp can support first contact and approved communication, but convenience does not remove privacy, documentation or clinical boundaries. Practice realistic, de-identified conversations and learn when to move the exchange into the secure clinical workflow.',
      'WhatsApp puede apoyar primer contacto y comunicación aprobada, pero conveniencia no elimina privacidad, documentación ni límites clínicos. Practica conversaciones realistas y desidentificadas y aprende cuándo mover al flujo clínico seguro.',
    ),
    objectives: [
      b('Use approved scripts naturally rather than mechanically', 'Usar guiones aprobados con naturalidad'),
      b('Protect minimum-necessary information and identity', 'Proteger información mínima e identidad'),
      b('Recognize clinical red flags and move to the right channel', 'Reconocer alertas clínicas y mover al canal correcto'),
    ],
    sections: [
      section(b('The opening message', 'Mensaje inicial'), b(
        'Introduce Eastern Medical Aesthetics and yourself, confirm the person’s preferred name and ask how you can help. For a new lead, capture only the minimum needed to create an approved CRM follow-up. Do not request identification, full medical history or intimate photographs before confirming the approved secure path.',
        'Presenta Eastern Medical Aesthetics y tu nombre, confirma cómo prefiere ser llamada y pregunta cómo ayudar. Para lead nuevo, captura mínimo para seguimiento CRM. No solicites identificación, historia completa ni fotos íntimas antes de ruta segura aprobada.',
      )),
      section(b('Meta Ads lead · from WhatsApp to a verified appointment', 'Lead de Meta Ads · de WhatsApp a una cita verificada'), b(
        'Lead: “I saw the Endolift ad and want an appointment.” Employee: “Thank you for contacting Eastern Medical Aesthetics. I’m [name]. May I confirm your full name, the area you would like to discuss and your preferred location? I am creating your request in our CRM now. I will check the live calendar before I offer a time so we confirm real availability with the correct provider and consultation duration.” The employee then records source as Meta Ads, assigns ownership, checks the CRM calendar, offers only verified times, saves the selected appointment and sends the approved confirmation while the lead is still engaged. A WhatsApp agreement without the saved CRM appointment is not a confirmed appointment.',
        'Lead: “Vi el anuncio de Endolift y quiero una cita”. Colaborador: “Gracias por contactar Eastern Medical Aesthetics. Soy [nombre]. ¿Me confirma su nombre completo, el área que desea consultar y la sede preferida? Estoy creando su solicitud en el CRM ahora. Antes de ofrecerle una hora revisaré el calendario activo para confirmar disponibilidad real con el personal médico calificado y la duración correcta de la consulta”. Luego registra Meta Ads como origen, asigna responsable, revisa el calendario del CRM, ofrece solamente horarios verificados, guarda la cita seleccionada y envía la confirmación aprobada mientras el lead sigue conectado. Un acuerdo por WhatsApp sin la cita guardada en el CRM no es una cita confirmada.',
      )),
      section(b('Synthetic dialogue · price inquiry', 'Diálogo sintético · precio'), b(
        'Patient: “How much is Botox for my forehead?” Employee: “I can share our current consultation and pricing structure. The exact treatment and amount are determined after the provider evaluates your goals, anatomy and history. Would you like me to find a consultation time?” This is realistic training—not a real patient transcript.',
        'Paciente: “¿Cuánto cuesta Botox en la frente?” Empleado: “Puedo compartir la estructura vigente de consulta y precios. El tratamiento y cantidad exactos se determinan después de que el personal médico calificado evalúe objetivos, anatomía e historia. ¿Desea que busque una consulta?” Es práctica sintética, no transcripción real.',
      )),
      section(b('Synthetic dialogue · candidacy', 'Diálogo sintético · candidatura'), b(
        'Patient: “I am pregnant; can I still do it?” Employee: “Thank you for telling me. I cannot determine candidacy by message. I will document your question and have the qualified clinical team guide the appropriate next step. We will not confirm treatment until that review is complete.”',
        'Paciente: “Estoy embarazada; ¿puedo hacerlo?” Empleado: “Gracias por decirlo. No puedo determinar candidatura por mensaje. Documentaré su pregunta y el equipo clínico indicará el próximo paso. No confirmaremos tratamiento hasta completar esa revisión”.',
      )),
      section(b('Synthetic dialogue · urgent symptom', 'Diálogo sintético · síntoma urgente'), b(
        'Patient: “After filler I have severe pain and my vision is blurry.” Employee: “This may require emergency attention. Call 911 or go to the nearest emergency department now. I am notifying the clinical team immediately according to our emergency policy.” Do not continue routine texting or wait for more photos.',
        'Paciente: “Después del filler tengo dolor intenso y visión borrosa”. Empleado: “Esto puede requerir atención de emergencia. Llame al 911 o vaya a Emergencias ahora. Notificaré inmediatamente al equipo clínico según política”. No continúes mensaje rutinario ni esperes más fotos.',
      )),
      section(b('Privacy and documentation', 'Privacidad y documentación'), b(
        'Use only the company-approved account and device controls. Verify the recipient before sharing information, disclose the minimum necessary and follow the patient’s approved communication preference. Transfer relevant content into the appropriate CRM/EHR record; never leave the only clinical report buried in a chat or forward it to personal accounts.',
        'Usa cuenta aprobada y controles del equipo. Verifica destinatario, comparte mínimo y sigue preferencia. Transfiere contenido relevante a CRM/EHR; nunca dejes el único reporte clínico enterrado en chat ni lo envíes a cuentas personales.',
      )),
      section(b('Tone and closure', 'Tono y cierre'), b(
        'Write complete, calm messages without slang, judgment or unsupported certainty. Confirm the action, owner and timing: “I have sent this to the clinical team; Maria owns the follow-up and will contact you by 3:00 p.m. If symptoms worsen, follow the emergency instruction above.” Then document completion.',
        'Escribe mensajes completos y calmados sin jerga, juicio ni certeza sin soporte. Confirma acción, responsable y tiempo: “Lo envié al equipo clínico; María dará seguimiento antes de 3:00 p. m. Si empeora, siga instrucción de emergencia”. Luego documenta cierre.',
      )),
      section(b('Approval standard', 'Criterio de aprobación'), operationalApproval),
    ],
    source: b('Controlled sources: HHS HIPAA electronic-communication safeguards, Eastern Medical privacy policy and approved WhatsApp/CRM workflow.', 'Fuentes controladas: salvaguardas HHS HIPAA de comunicación electrónica, política de privacidad Eastern Medical y flujo aprobado WhatsApp/CRM.'),
    approval: operationalApproval,
    practice: practice(
      b('A patient sends a post-filler message reporting blurred vision and asks whether she should wait for the provider to reply.', 'Una paciente reporta visión borrosa después de filler y pregunta si espera al personal médico calificado.'),
      b('What is the correct message?', '¿Cuál es el mensaje correcto?'),
      [
        b('“Please wait; the provider usually replies within 24 hours.”', '“Espere; el personal médico calificado suele responder en 24 horas”.'),
        b('“Call 911 or go to the nearest emergency department now. I am activating our clinical emergency notification process immediately.”', '“Llame al 911 o vaya a Emergencias ahora. Activaré inmediatamente la notificación clínica de emergencia”.'),
        b('“Send more photos before we decide.”', '“Envíe más fotos antes de decidir”.'),
      ],
      1,
      b('Correct. Vision change after filler is time-sensitive and routine messaging must not delay emergency care.', 'Correcto. Cambio visual después de filler es sensible al tiempo y el mensaje no debe retrasar emergencia.'),
    ),
  },
  {
    title: b('Interactive clinical cases and certification', 'Casos clínicos interactivos y certificación'),
    intro: b(
      'Integrate the entire certification through mixed cases that test safety, ethics, systems, patient experience and closed-loop ownership. Passing the digital course is one component; clinical privileges require separate documented competency.',
      'Integra toda la certificación mediante casos mixtos que evalúan seguridad, ética, sistemas, experiencia y responsabilidad. Aprobar el curso digital es un componente; los privilegios clínicos requieren competencia documentada separada.',
    ),
    objectives: [
      b('Prioritize safety when commercial and schedule pressures compete', 'Priorizar seguridad frente a presión comercial o de agenda'),
      b('Select the correct owner, system and escalation path', 'Seleccionar responsable, sistema y ruta de escalamiento'),
      b('Understand final certification and clinical-privilege criteria', 'Comprender criterios de certificación y privilegio clínico'),
    ],
    sections: [
      section(b('Case 1 · The promotional treatment', 'Caso 1 · Tratamiento promocional'), b(
        'A lead wants a discounted device session today, but intake reveals recent sun exposure, a new medication and no provider assessment. Correct response: hold treatment, preserve the promotional conversation without guaranteeing eligibility and route to qualified screening. Revenue does not erase a contraindication check.',
        'Una prospecto quiere sesión promocional hoy, pero reporta sol reciente, nuevo medicamento y sin evaluación. Respuesta: detener tratamiento, conservar conversación sin garantizar elegibilidad y canalizar a screening. Ingreso no elimina control de contraindicaciones.',
      )),
      section(b('Case 2 · The wrong chart', 'Caso 2 · Expediente equivocado'), b(
        'Two patients share a similar name. A consent and photograph appear under the wrong record before treatment. Correct response: stop, prevent use or further disclosure, notify privacy/clinical leadership, follow correction and incident policy, reverify identity and do not proceed until the record is safe.',
        'Dos pacientes tienen nombre similar. Consentimiento y foto aparecen en expediente equivocado antes del tratamiento. Respuesta: detener, prevenir uso/divulgación, notificar liderazgo, seguir corrección/incidente, reverificar identidad y no proceder hasta seguridad.',
      )),
      section(b('Case 3 · The vascular warning', 'Caso 3 · Alerta vascular'), b(
        'After filler, the patient reports disproportionate pain and color change. Correct response: activate the complication pathway immediately, bring the qualified provider to the patient and document time, symptoms and actions. Do not discharge, massage on your own or wait for a routine call.',
        'Después de filler, paciente reporta dolor desproporcionado y cambio de color. Respuesta: activar protocolo inmediatamente, involucrar de inmediato al personal médico calificado y documentar hora, síntomas y acciones. No dar alta, masajear por cuenta propia ni esperar llamada rutinaria.',
      )),
      section(b('Case 4 · The financing pressure', 'Caso 4 · Presión financiera'), b(
        'A patient is unsure about treatment and does not understand deferred interest. Correct response: pause the transaction, separate the clinical decision from credit, provide the exact written disclosure and let the patient decide. A sales target never justifies financial coercion.',
        'Una paciente duda y no comprende interés diferido. Respuesta: pausar, separar decisión clínica de crédito, entregar divulgación exacta y permitir decisión. Una meta nunca justifica presión financiera.',
      )),
      section(b('Case 5 · The social-media symptom', 'Caso 5 · Síntoma por redes'), b(
        'A patient comments publicly about a possible complication. Correct response: do not confirm patient status or discuss details publicly. Provide a neutral urgent contact direction, move to the approved private/clinical route, verify identity, assess urgency within role and document the handoff.',
        'Una paciente comenta públicamente posible complicación. Respuesta: no confirmar estado ni detalles. Ofrecer instrucción neutral de contacto urgente, mover a ruta privada/clínica, verificar identidad, evaluar urgencia dentro del rol y documentar transición.',
      )),
      section(b('Digital certification criterion', 'Criterio de certificación digital'), b(
        'Complete all 20 modules, all guided learning steps and every decision check. The Academy completion record confirms knowledge exposure and assessment; it does not by itself authorize a clinical procedure. Supervisors review missed concepts and assign remediation before final sign-off.',
        'Completa 20 módulos, actividades guiadas y evaluaciones. El registro confirma exposición y evaluación; no autoriza por sí solo un procedimiento. Supervisores revisan conceptos fallados y asignan remediación antes de firma final.',
      )),
      section(b('Clinical privilege criterion', 'Criterio de privilegio clínico'), b(
        'For each procedure performed, the employee must hold the required license/scope, complete manufacturer and internal training, review current IFU/SOP, pass an observed simulation and supervised cases, demonstrate complication response and receive written privilege from authorized clinical leadership. Privilege is procedure- and device-specific and may expire or be suspended.',
        'Para cada procedimiento, el empleado debe tener licencia/scope requerido, completar entrenamiento de fabricante e interno, revisar IFU/SOP, aprobar simulación y casos supervisados, demostrar respuesta a complicaciones y recibir privilegio escrito. El privilegio es específico y puede vencer o suspenderse.',
      )),
      section(b('Final standard', 'Estándar final'), b(
        'Certification means the employee can explain the patient pathway, communicate truthfully, recognize stop points, protect privacy, use approved systems and obtain the correct help. Mastery is demonstrated by safe judgment under pressure—not by memorizing marketing claims.',
        'Certificación significa explicar recorrido, comunicar con verdad, reconocer stop points, proteger privacidad, usar sistemas y obtener ayuda correcta. Maestría se demuestra con juicio seguro bajo presión, no memorizando marketing.',
      )),
    ],
    source: b('Controlled source: entire Eastern Medical Aesthetics certification, current policies, IFUs and procedure-specific competency records.', 'Fuente controlada: certificación completa, políticas vigentes, IFUs y registros de competencia por procedimiento.'),
    approval: b('Complete every module and decision check. Final clinical authorization is granted only through a separate signed, procedure-specific competency record.', 'Completa cada módulo y evaluación. La autorización clínica final se concede solamente mediante registro separado, firmado y específico por procedimiento.'),
    practice: practice(
      b('A top-performing coordinator pressures an unscreened patient to complete financing and receive a promoted laser treatment today. The patient reports a new photosensitizing medication.', 'Una coordinadora presiona a una paciente sin screening para financiar y recibir láser hoy. La paciente reporta nuevo medicamento fotosensibilizante.'),
      b('What action demonstrates certification-level judgment?', '¿Qué acción demuestra juicio de nivel certificación?'),
      [
        b('Proceed because the coordinator has strong sales results.', 'Proceder porque la coordinadora vende bien.'),
        b('Stop treatment and financing pressure, document the medication, route to qualified clinical screening and preserve the patient relationship with a clear next step.', 'Detener tratamiento y presión financiera, documentar medicamento, canalizar a screening cualificado y preservar relación con próximo paso claro.'),
        b('Ask the patient to waive the risk in writing.', 'Pedir que renuncie al riesgo por escrito.'),
      ],
      1,
      b('Correct. Safety, informed choice and owned follow-through define Eastern-level judgment.', 'Correcto. Seguridad, elección informada y seguimiento con responsable definen el juicio Eastern.'),
    ),
  },
];

export const aestheticsChecks = [
  { q: b('What is Eastern Medical Aesthetics selling first?', '¿Qué ofrece primero Eastern Medical Aesthetics?'), options: [b('A guaranteed procedure', 'Un procedimiento garantizado'), b('A trustworthy, clinically governed pathway matched to a real need', 'Una ruta confiable y gobernada clínicamente según necesidad real'), b('The highest-price package', 'El paquete más caro')], correct: 1 },
  { q: b('When is the patient journey complete?', '¿Cuándo está completo el recorrido?'), options: [b('When payment clears', 'Cuando entra el pago'), b('When procedure ends', 'Cuando termina procedimiento'), b('When aftercare, owner, next step and follow-up are documented and understood', 'Cuando aftercare, responsable, próximo paso y seguimiento están documentados y comprendidos')], correct: 2 },
  { q: b('What may staff promise about Endolift?', '¿Qué puede prometer el personal sobre Endolift?'), options: [b('One session and no downtime', 'Una sesión y sin downtime'), b('Provider assessment and a truthful explanation of options, risks and expected course', 'Evaluación del personal médico calificado y explicación veraz de opciones, riesgos y evolución'), b('A surgical-equivalent result', 'Resultado equivalente a cirugía')], correct: 1 },
  { q: b('Which post-Botox symptom requires urgent escalation?', '¿Qué síntoma post-Botox requiere escalamiento urgente?'), options: [b('Difficulty swallowing or breathing', 'Dificultad para tragar o respirar'), b('Question about parking', 'Pregunta de estacionamiento'), b('Request for receipt', 'Solicitud de recibo')], correct: 0 },
  { q: b('Which filler report is time-sensitive?', '¿Qué reporte de filler es sensible al tiempo?'), options: [b('Severe pain with blanching or visual change', 'Dolor intenso con palidez o cambio visual'), b('Price question before consultation', 'Pregunta de precio antes de consulta'), b('Request to reschedule', 'Solicitud de cambiar cita')], correct: 0 },
  { q: b('Why is Radiesse not described as ordinary HA filler?', '¿Por qué Radiesse no se describe como HA común?'), options: [b('It is CaHA with different behavior and product controls', 'Es CaHA con comportamiento y controles diferentes'), b('It contains no implant material', 'No contiene material de implante'), b('Every filler is identical', 'Todo filler es idéntico')], correct: 0 },
  { q: b('What expectation is central to Sculptra?', '¿Qué expectativa es central en Sculptra?'), options: [b('Immediate permanent volume', 'Volumen permanente inmediato'), b('Gradual, individualized response under a provider plan', 'Respuesta gradual e individualizada bajo plan del personal médico calificado'), b('No follow-up needed', 'No requiere seguimiento')], correct: 1 },
  { q: b('Who selects PiXel8 RF depth and energy?', '¿Quién selecciona profundidad y energía de PiXel8 RF?'), options: [b('The marketing coordinator', 'Coordinador de marketing'), b('A trained authorized operator under current IFU/SOP and provider plan', 'Operador autorizado bajo IFU/SOP y plan'), b('The patient from a menu', 'Paciente desde menú')], correct: 1 },
  { q: b('What must happen before Spectrum laser activation?', '¿Qué debe ocurrir antes de activar Spectrum?'), options: [b('Complete handpiece/wavelength/area/eye-protection time-out', 'Completar time-out de pieza/longitud/área/protección'), b('Only collect payment', 'Solamente cobrar'), b('Turn off room signage', 'Apagar señalización')], correct: 0 },
  { q: b('What must never be claimed for Venus Legacy?', '¿Qué nunca debe afirmarse de Venus Legacy?'), options: [b('It has applicator-specific indications', 'Tiene indicaciones por aplicador'), b('It guarantees weight loss in pounds', 'Garantiza pérdida de libras'), b('It requires screening', 'Requiere screening')], correct: 1 },
  { q: b('What is absolute in PRF processing?', '¿Qué es absoluto en procesamiento PRF?'), options: [b('Patient/specimen identity and one-patient controlled workflow', 'Identidad paciente/muestra y flujo controlado de un paciente'), b('Guessing an unlabeled tube', 'Adivinar tubo sin etiqueta'), b('Calling it stem-cell therapy', 'Llamarlo terapia de células madre')], correct: 0 },
  { q: b('What is required before marketing a “salmon DNA” injectable?', '¿Qué se requiere antes de anunciar un inyectable “ADN de salmón”?'), options: [b('A vendor testimonial', 'Testimonio del vendedor'), b('Exact product, regulatory status, source, IFU and clinical approval', 'Producto exacto, estatus, origen, IFU y aprobación clínica'), b('Social-media popularity', 'Popularidad en redes')], correct: 1 },
  { q: b('Who may manipulate a protruding PDO thread?', '¿Quién puede manipular un hilo PDO expuesto?'), options: [b('Front desk', 'Front desk'), b('The patient at home', 'Paciente en casa'), b('A qualified provider following the complication pathway', 'Personal médico calificado según protocolo')], correct: 2 },
  { q: b('Who converts a compounded GLP-1 dose between units and milligrams?', '¿Quién convierte dosis GLP-1 entre unidades y miligramos?'), options: [b('Staff from memory', 'Personal de memoria'), b('The licensed provider/pharmacy using the exact concentration and prescription', 'Personal médico calificado/farmacia usando concentración y receta exactas'), b('The patient using an online chart', 'Paciente con tabla de internet')], correct: 1 },
  { q: b('What is the first response to a disappointed patient?', '¿Cuál es la primera respuesta a paciente decepcionado?'), options: [b('Defend the clinic', 'Defender la clínica'), b('Acknowledge, clarify, document and create qualified review', 'Reconocer, aclarar, documentar y crear revisión cualificada'), b('Promise a refund', 'Prometer reembolso')], correct: 1 },
  { q: b('What does ethical recommendation protect?', '¿Qué protege la recomendación ética?'), options: [b('Informed choice and clinically appropriate next steps', 'Elección informada y próximos pasos apropiados'), b('Immediate conversion at any cost', 'Conversión inmediata a cualquier costo'), b('Unapproved scarcity tactics', 'Escasez no aprobada')], correct: 0 },
  { q: b('What prevents a duplicate Practice Fusion chart?', '¿Qué previene un duplicado en Practice Fusion?'), options: [b('Find and verify before creating', 'Buscar y verificar antes de crear'), b('Create first and check later', 'Crear primero y revisar después'), b('Share another user’s login', 'Compartir login')], correct: 0 },
  { q: b('Who determines credit approval and terms?', '¿Quién determina aprobación y términos de crédito?'), options: [b('The aesthetic provider', 'Personal médico calificado de Estética'), b('The lender under its written disclosures', 'Acreedor según divulgaciones escritas'), b('The front-desk employee', 'Empleado de front desk')], correct: 1 },
  { q: b('How should WhatsApp handle a filler-related vision change?', '¿Cómo maneja WhatsApp un cambio visual después de filler?'), options: [b('Wait for more photos', 'Esperar más fotos'), b('Immediate emergency direction and clinical escalation, then documentation', 'Instrucción de emergencia y escalamiento inmediato, luego documentación'), b('Delete the chat', 'Borrar el chat')], correct: 1 },
  { q: b('Does Academy completion alone authorize clinical procedures?', '¿Completar Academy autoriza por sí solo procedimientos?'), options: [b('Yes, every procedure', 'Sí, todo procedimiento'), b('No; procedure-specific license, training, observed competency and written privilege are also required', 'No; también se requiere licencia, entrenamiento, competencia observada y privilegio escrito'), b('Only when the schedule is busy', 'Solo cuando la agenda está llena')], correct: 1 },
];
