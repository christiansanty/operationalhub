import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BadgeDollarSign, BookOpen, CalendarCheck2, Check, CheckCircle2,
  ChevronDown, Clock3, ExternalLink, Eye, FileImage, Images, Info, LockKeyhole,
  MessageCircle, Megaphone, PhoneCall, Plus, RotateCcw, ShieldCheck, Sparkles,
  Target, Trash2, Upload, UserRoundCheck,
} from 'lucide-react';
import './aesthetics-module-experience.css';
import './aesthetics-official-cases.css';
import './aesthetics-workflow-labs.css';

const b = (en, es) => ({ en, es });

const learningRoute = [
  b('Study the complete lesson', 'Estudiar la materia completa'),
  b('Analyze evidence and controls', 'Analizar evidencia y controles'),
  b('Practice a real decision', 'Practicar una decisión real'),
  b('Pass the knowledge check', 'Aprobar la evaluación'),
];

const visualFocus = {
  2: b('Lower face, jawline, submental area and other provider-selected treatment zones', 'Tercio inferior, mandíbula, área submentoniana y otras zonas seleccionadas por el personal médico calificado'),
  3: b('Dynamic facial lines, symmetry at rest and movement, and the documented follow-up point', 'Líneas dinámicas, simetría en reposo y movimiento y momento documentado del seguimiento'),
  4: b('Contour, proportion, symmetry and time-sensitive skin changes after treatment', 'Contorno, proporción, simetría y cambios cutáneos sensibles al tiempo después del tratamiento'),
  5: b('Provider-selected contour or biostimulatory goal, photographed at the correct interval', 'Objetivo de contorno o bioestimulación seleccionado por el personal médico calificado y fotografiado en el intervalo correcto'),
  6: b('Gradual change over the provider-directed series rather than an immediate-result comparison', 'Cambio gradual durante la serie indicada por el personal médico calificado, no una comparación de resultado inmediato'),
  7: b('Texture, tone and treatment-zone recovery documented under standardized conditions', 'Textura, tono y recuperación del área tratada bajo condiciones estandarizadas'),
  8: b('The exact Spectrum handpiece, wavelength and indication tied to the case', 'La pieza, longitud de onda e indicación exactas de Spectrum vinculadas al caso'),
  9: b('Circumference, contour or skin-quality goal without implying weight loss in pounds', 'Objetivo de circunferencia, contorno o calidad de piel sin insinuar pérdida de libras'),
  10: b('The exact PRF application, collection date and provider-directed follow-up interval', 'La aplicación exacta de PRF, fecha de extracción e intervalo de seguimiento indicado'),
  11: b('Only the verified product, route and indication approved by Clinical Leadership', 'Solamente el producto, vía e indicación verificados y aprobados por Liderazgo Clínico'),
  12: b('Vector, contour and recovery while preserving honest expectations about asymmetry and healing', 'Vector, contorno y recuperación con expectativas honestas sobre asimetría y cicatrización'),
  13: b('Longitudinal, clinician-reviewed progress using consistent measurements—not appearance alone', 'Progreso longitudinal revisado clínicamente con medidas consistentes, no solamente apariencia'),
};

const officialVisualCases = {
  2: [
    {
      title: b('Abdomen · documented 4-day comparison', 'Abdomen · comparación documentada a 4 días'),
      area: b('Abdomen · fibrosis, adhesions, laxity and texture', 'Abdomen · fibrosis, adherencias, flacidez y textura'),
      interval: b('Before → 4 days', 'Antes → 4 días'),
      image: '/aesthetics/endolift/official-abdomen-4-days.jpg',
      source: 'https://www.instagram.com/eastern_medicalgroup/p/DaEM3wOFNys/',
      lesson: b('Use this case to discuss why an early image documents one moment in recovery and cannot be presented as a final or typical result.', 'Usa este caso para explicar por qué una imagen temprana documenta un momento de recuperación y no puede presentarse como resultado final ni típico.'),
    },
    {
      title: b('Lower face · documented 3-month comparison', 'Tercio inferior facial · comparación documentada a 3 meses'),
      area: b('Lower face, jawline and submental contour', 'Tercio inferior, mandíbula y contorno submentoniano'),
      interval: b('Before → 3 months', 'Antes → 3 meses'),
      image: '/aesthetics/endolift/official-lower-face-3-months.jpg',
      source: 'https://www.instagram.com/eastern_medicalgroup/reel/DZpzLc5Nxev/',
      lesson: b('Compare head position, expression, hair, lighting and framing before describing an observable contour change. Never infer candidacy for another person.', 'Compara posición de la cabeza, expresión, cabello, iluminación y encuadre antes de describir un cambio observable. Nunca infieras candidatura para otra persona.'),
    },
    {
      title: b('Abdomen · documented 1-week comparison', 'Abdomen · comparación documentada a 1 semana'),
      area: b('Abdominal contour and skin laxity', 'Contorno abdominal y flacidez cutánea'),
      interval: b('Before → 1 week', 'Antes → 1 semana'),
      image: '/aesthetics/endolift/official-abdomen-1-week.jpg',
      source: 'https://www.instagram.com/eastern_medicalgroup/reel/DZDytUFy4RM/',
      lesson: b('This image is a real Eastern case and a short-interval observation. It is not proof that another patient will follow the same timeline or outcome.', 'Esta imagen es un caso real de Eastern y una observación de intervalo corto. No demuestra que otro paciente tendrá el mismo tiempo ni resultado.'),
    },
  ],
};

const moduleFaqs = {
  2: [
    [b('Does Endolift replace a facelift?', '¿Endolift sustituye un facelift?'), b('No employee may promise equivalence to surgery. A qualified provider evaluates laxity, anatomy, goals, alternatives and whether the patient is a candidate.', 'Ningún colaborador puede prometer equivalencia con cirugía. El personal médico calificado evalúa flacidez, anatomía, objetivos, alternativas y candidatura.')],
    [b('How many sessions and how much recovery?', '¿Cuántas sesiones y cuánto tiempo de recuperación?'), b('Both vary by patient and provider plan. Explain the expected course only from the current approved plan; never guarantee one session or “no downtime.”', 'Ambos varían según el paciente y el plan del personal médico calificado. Explica la evolución solamente desde el plan aprobado vigente; nunca garantices una sesión ni “cero recuperación”.')],
    [b('What must the employee verify before the visit?', '¿Qué debe verificar el colaborador antes de la visita?'), b('Correct patient, provider, treatment area, screening, consent, standardized photographs, device/fiber readiness, aftercare and emergency pathway.', 'Paciente, personal médico calificado, área, screening, consentimiento, fotografías estandarizadas, equipo/fibra, aftercare y ruta de emergencia.')],
  ],
  3: [
    [b('Can staff quote units from a photograph?', '¿Puede el personal cotizar unidades por una foto?'), b('No. Product, dose, anatomy and injection plan belong to the qualified prescriber after assessment.', 'No. Producto, dosis, anatomía y plan de inyección corresponden al prescriptor cualificado después de evaluar.')],
    [b('Which symptoms cannot wait for routine follow-up?', '¿Qué síntomas no pueden esperar seguimiento rutinario?'), b('Difficulty swallowing, speaking or breathing, generalized weakness or another concerning systemic symptom requires immediate clinical escalation and emergency direction.', 'Dificultad para tragar, hablar o respirar, debilidad generalizada u otro síntoma sistémico preocupante requiere escalamiento clínico e instrucción de emergencia inmediata.')],
  ],
  4: [
    [b('What makes a filler concern time-sensitive?', '¿Qué hace urgente una inquietud después de filler?'), b('Severe or disproportionate pain, blanching or color change, cool skin, visual symptoms or neurologic symptoms activate the complication pathway immediately.', 'Dolor intenso o desproporcionado, palidez o cambio de color, piel fría, síntomas visuales o neurológicos activan inmediatamente la ruta de complicaciones.')],
    [b('May marketing select the filler or treatment area?', '¿Puede Marketing seleccionar el filler o el área?'), b('No. Marketing may explain the consultation pathway; the qualified provider determines candidacy, product and plan.', 'No. Marketing puede explicar la ruta de consulta; el personal médico calificado determina candidatura, producto y plan.')],
  ],
  5: [
    [b('Is Radiesse an ordinary hyaluronic-acid filler?', '¿Radiesse es un filler común de ácido hialurónico?'), b('No. It is a calcium hydroxylapatite product with product-specific behavior, indications, controls and complication planning.', 'No. Es un producto de hidroxiapatita de calcio con comportamiento, indicaciones, controles y planificación de complicaciones específicos.')],
    [b('What must photographs document?', '¿Qué deben documentar las fotografías?'), b('The provider-selected area under consistent angle, distance, expression, lighting and timing, linked to the correct chart and product record.', 'El área seleccionada bajo ángulo, distancia, expresión, iluminación y tiempo consistentes, vinculada al expediente y producto correctos.')],
  ],
  6: [
    [b('Why is Sculptra progress evaluated over time?', '¿Por qué Sculptra se evalúa con el tiempo?'), b('The plan is gradual and individualized. Staff must not promise immediate permanent volume or use an early image as a final result.', 'El plan es gradual e individualizado. El personal no debe prometer volumen inmediato y permanente ni usar una foto temprana como resultado final.')],
    [b('Who defines the series and follow-up?', '¿Quién define la serie y el seguimiento?'), b('The qualified provider, using the exact product, patient assessment, current instructions and documented response.', 'El personal médico calificado, usando producto exacto, evaluación, instrucciones vigentes y respuesta documentada.')],
  ],
  7: [
    [b('Who chooses PiXel8 RF depth and energy?', '¿Quién escoge profundidad y energía de PiXel8 RF?'), b('Only a trained, authorized operator under the current IFU, SOP and provider plan.', 'Solamente un operador entrenado y autorizado bajo IFU, SOP y plan del personal médico calificado vigentes.')],
    [b('Why document recovery images?', '¿Por qué documentar imágenes de recuperación?'), b('They help the qualified team distinguish the expected course from a concern and create an owned follow-up; employees do not diagnose from the image.', 'Ayudan al equipo cualificado a distinguir evolución esperada de una inquietud y crear seguimiento; el colaborador no diagnostica por la foto.')],
  ],
  8: [
    [b('Is Spectrum one interchangeable treatment?', '¿Spectrum es un solo tratamiento intercambiable?'), b('No. The exact handpiece, wavelength, indication, protection and parameters must match the authorized plan.', 'No. Pieza, longitud de onda, indicación, protección y parámetros exactos deben coincidir con el plan autorizado.')],
    [b('What belongs in the laser time-out?', '¿Qué pertenece al time-out del láser?'), b('Correct patient, area, device/handpiece, indication, eye protection, skin preparation, settings owner and room controls.', 'Paciente, área, equipo/pieza, indicación, protección ocular, preparación, responsable de parámetros y controles del salón.')],
  ],
  9: [
    [b('May Venus Legacy be sold as guaranteed weight loss?', '¿Puede venderse Venus Legacy como pérdida de peso garantizada?'), b('No. Explain the authorized body/skin objective and consultation; never guarantee pounds, inches, sessions or outcome.', 'No. Explica el objetivo corporal/cutáneo autorizado y la consulta; nunca garantices libras, pulgadas, sesiones ni resultado.')],
    [b('What makes a comparison valid?', '¿Qué hace válida una comparación?'), b('Same area, position, distance, lighting, measurement method and a documented interval tied to the treatment plan.', 'Misma área, posición, distancia, iluminación, método de medición e intervalo documentado vinculado al plan.')],
  ],
  10: [
    [b('Does autologous mean risk-free?', '¿Autólogo significa sin riesgo?'), b('No. Identity, collection, processing, infection control, consent, application and complication response remain controlled.', 'No. Identidad, extracción, procesamiento, control de infección, consentimiento, aplicación y respuesta a complicaciones permanecen controlados.')],
    [b('What is never acceptable with an unlabeled specimen?', '¿Qué nunca es aceptable con una muestra sin etiqueta?'), b('Guessing ownership or continuing. Stop the workflow and apply the approved specimen/incident process.', 'Adivinar a quién pertenece o continuar. Detén el flujo y aplica el proceso aprobado de muestras/incidentes.')],
  ],
  11: [
    [b('What does “salmon DNA” identify?', '¿Qué identifica “ADN de salmón”?'), b('It is a marketing phrase, not a complete product identity. Verify manufacturer, formulation, route, source, regulatory status, IFU and approved use.', 'Es un término de marketing, no una identidad completa. Verifica fabricante, formulación, vía, origen, estatus regulatorio, IFU y uso aprobado.')],
    [b('Can a vendor testimonial authorize use?', '¿Un testimonio del vendedor autoriza el uso?'), b('No. Clinical Leadership must approve the exact product and pathway from controlled evidence and policy.', 'No. Liderazgo Clínico debe aprobar producto y ruta exactos desde evidencia y política controladas.')],
  ],
  12: [
    [b('Who may correct or manipulate a protruding PDO thread?', '¿Quién puede corregir o manipular un hilo PDO expuesto?'), b('Only a qualified provider following the complication pathway—not the patient, Front Desk or an unauthorized employee.', 'Solamente el personal médico calificado según la ruta de complicaciones; no el paciente, Front Desk ni personal no autorizado.')],
    [b('Why does the photo interval matter?', '¿Por qué importa el intervalo de la foto?'), b('Immediate swelling, bruising and healing are not a final result. The case must state when each image was taken.', 'Inflamación, moretones y cicatrización inmediata no son resultado final. El caso debe indicar cuándo se tomó cada imagen.')],
  ],
  13: [
    [b('What proves progress in a weight-management program?', '¿Qué demuestra progreso en un programa de pérdida de peso?'), b('A clinician-reviewed longitudinal record may include measurements, health indicators, adherence, tolerance and individualized goals—not appearance alone.', 'Un expediente longitudinal revisado clínicamente puede incluir medidas, indicadores de salud, adherencia, tolerancia y objetivos individualizados, no solamente apariencia.')],
    [b('May staff convert medication units from memory?', '¿Puede el personal convertir unidades de medicamento de memoria?'), b('No. The licensed provider/pharmacy uses the exact prescription and concentration. Unclear dosing stops the workflow.', 'No. El personal médico calificado/farmacia usa receta y concentración exactas. Una dosis incierta detiene el flujo.')],
  ],
  17: [
    [b('Can an employee promise the payment shown in an old campaign?', '¿Puede un colaborador prometer el pago mostrado en una campaña anterior?'), b('No. A campaign is a dated example. Verify the active provider, eligible service, total financed amount, term, APR, down payment, fees and written disclosures before discussing a current option.', 'No. Una campaña es un ejemplo con fecha. Verifica proveedor de financiamiento activo, servicio elegible, monto total, plazo, APR, pago inicial, cargos y divulgaciones escritas antes de explicar una opción vigente.')],
    [b('Who decides approval, term and interest?', '¿Quién decide aprobación, plazo e interés?'), b('The authorized financing provider under its current written terms—not Eastern staff. Employees explain the process and documented options without predicting or guaranteeing approval.', 'El proveedor autorizado de financiamiento bajo sus términos escritos vigentes, no el personal de Eastern. El colaborador explica proceso y opciones documentadas sin predecir ni garantizar aprobación.')],
    [b('What must be documented after the patient applies?', '¿Qué se documenta después de que el paciente solicita?'), b('Record only the approved operational status, selected treatment estimate, authorized amount or transaction reference, responsible owner and next step. Never copy Social Security numbers, income, bank details or application screenshots into the CRM.', 'Registra solamente estado operacional aprobado, estimado del tratamiento, monto autorizado o referencia, responsable y próximo paso. Nunca copies Seguro Social, ingresos, datos bancarios ni screenshots de la solicitud al CRM.')],
  ],
};

const captureChecklist = [
  b('Documented authorization for training use; no patient name or identifiers', 'Autorización documentada para capacitación; sin nombre ni identificadores'),
  b('Same angle, distance, framing, expression, lighting and background', 'Mismo ángulo, distancia, encuadre, expresión, iluminación y fondo'),
  b('Exact treatment, anatomical area and provider-approved case label', 'Tratamiento, área anatómica y etiqueta del caso aprobada por el personal médico calificado'),
  b('Date or interval for both images; immediate recovery is not a final result', 'Fecha o intervalo de ambas imágenes; recuperación inmediata no es resultado final'),
  b('No filters, retouching, makeup changes or selective cropping that distort comparison', 'Sin filtros, retoque, cambios de maquillaje ni recortes que distorsionen la comparación'),
  b('Outcome is individual and never used as a guarantee of another patient’s result', 'El resultado es individual y nunca se usa como garantía para otro paciente'),
];

const blankCase = { label: '', area: '', interval: '', before: '', after: '', notes: '', consent: false };

function paragraphs(text) {
  const sentences = String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 3) return [text];
  const groups = [];
  for (let index = 0; index < sentences.length; index += 2) groups.push(sentences.slice(index, index + 2).join(' '));
  return groups;
}

function sectionKind(title, lang) {
  if (/safety|warning|contra|emergen|seguridad|alerta|riesgo/i.test(title)) return lang === 'en' ? 'SAFETY' : 'SEGURIDAD';
  if (/consent|screen|document|privacy|control|financ|trazabilidad/i.test(title)) return lang === 'en' ? 'CONTROL' : 'CONTROL';
  if (/follow|after|recovery|seguimiento|recuper|aftercare/i.test(title)) return lang === 'en' ? 'CONTINUITY' : 'CONTINUIDAD';
  return lang === 'en' ? 'CORE KNOWLEDGE' : 'CONOCIMIENTO CLAVE';
}

function fileToTrainingImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('invalid'));
    if (file.size > 12 * 1024 * 1024) return reject(new Error('large'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('image'));
      image.onload = () => {
        const scale = Math.min(1, 1100 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function VisualEvidenceLab({ moduleIndex, lessonTitle, lang }) {
  const isEn = lang === 'en';
  const storageKey = `ema-aesthetics-approved-cases-v1-${moduleIndex}`;
  const [cases, setCases] = useState(() => { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; } });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankCase);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState('');
  const officialCases = officialVisualCases[moduleIndex] || [];
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const loadFile = async (field, file) => {
    setError('');
    try { update(field, await fileToTrainingImage(file)); }
    catch (fileError) { setError(fileError.message === 'large' ? (isEn ? 'The image exceeds 12 MB.' : 'La imagen supera 12 MB.') : (isEn ? 'Use a valid JPG, PNG or WebP image.' : 'Usa una imagen JPG, PNG o WebP válida.')); }
  };
  const save = () => {
    if (!form.before || !form.after || !form.area.trim() || !form.interval.trim() || !form.consent) {
      setError(isEn ? 'Before, after, area, interval and authorization confirmation are required.' : 'Se requieren before, after, área, intervalo y confirmación de autorización.');
      return;
    }
    const next = [...cases, { ...form, label: form.label.trim() || `${lessonTitle} · ${cases.length + 1}`, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }];
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setCases(next); setForm(blankCase); setFormOpen(false); setError('');
    } catch {
      setError(isEn ? 'This image pair is too large for local training storage. Use smaller images.' : 'El par es demasiado grande para el almacenamiento local. Usa imágenes más pequeñas.');
    }
  };
  const remove = (id) => {
    if (pendingDelete !== id) { setPendingDelete(id); return; }
    const next = cases.filter((item) => item.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(next)); setCases(next); setPendingDelete('');
  };
  return <section className="aesthetics-visual-lab">
    <header><div><span><Images size={16}/>{isEn ? 'BEFORE & AFTER EVIDENCE LAB' : 'LABORATORIO DE EVIDENCIA BEFORE & AFTER'}</span><h2>{isEn ? 'Learn to read a result without turning it into a promise' : 'Aprende a interpretar un resultado sin convertirlo en promesa'}</h2><p>{visualFocus[moduleIndex]?.[lang]}</p></div><aside><strong>{officialCases.length + cases.length}</strong><span>{isEn ? 'training cases available' : 'casos de capacitación disponibles'}</span></aside></header>
    <div className="visual-governance"><ShieldCheck size={22}/><div><strong>{isEn ? 'Clinical and privacy control' : 'Control clínico y de privacidad'}</strong><p>{isEn ? 'Use only de-identified images with documented authorization for training. A visual comparison supports education; it does not establish candidacy, diagnosis or a guaranteed outcome.' : 'Usa solamente imágenes desidentificadas con autorización documentada para capacitación. La comparación apoya la enseñanza; no establece candidatura, diagnóstico ni garantiza resultados.'}</p></div></div>
    <div className="capture-standard"><div><span>{isEn ? 'STANDARDIZED CAPTURE' : 'CAPTURA ESTANDARIZADA'}</span><h3>{isEn ? 'Six controls before publishing a pair' : 'Seis controles antes de publicar un par'}</h3></div><ul>{captureChecklist.map((item) => <li key={item.en}><CheckCircle2 size={15}/>{item[lang]}</li>)}</ul></div>
    {!!officialCases.length && <section className="official-case-library"><header><div><span>{isEn ? 'OFFICIAL EASTERN MEDICAL CASES' : 'CASOS OFICIALES DE EASTERN MEDICAL'}</span><h3>{isEn ? 'Published Endolift comparisons' : 'Comparaciones publicadas de Endolift'}</h3></div><small><ShieldCheck size={14}/>{isEn ? 'Source: official @eastern_medicalgroup profile' : 'Fuente: perfil oficial @eastern_medicalgroup'}</small></header><div>{officialCases.map((item, index) => <article key={item.source}><div className="official-case-image"><img src={item.image} alt={`${item.title[lang]} · Before and after`}/><span>{isEn ? 'OFFICIAL CASE' : 'CASO OFICIAL'} {String(index + 1).padStart(2, '0')}</span></div><div className="official-case-copy"><span>{item.interval[lang]}</span><h3>{item.title[lang]}</h3><strong>{item.area[lang]}</strong><p>{item.lesson[lang]}</p><div><ShieldCheck size={16}/><small>{isEn ? 'Individual case · not a typical or guaranteed result' : 'Caso individual · no es resultado típico ni garantizado'}</small></div><a href={item.source} target="_blank" rel="noreferrer"><Sparkles size={14}/>{isEn ? 'View original publication' : 'Ver publicación original'}</a></div></article>)}</div></section>}
    {cases.length ? <div className="approved-case-grid">{cases.map((item) => <article key={item.id}><header><div><span>{isEn ? 'APPROVED TRAINING CASE' : 'CASO APROBADO DE CAPACITACIÓN'}</span><h3>{item.label}</h3></div><button onClick={() => remove(item.id)} className={pendingDelete === item.id ? 'confirm' : ''}><Trash2 size={15}/>{pendingDelete === item.id ? (isEn ? 'Confirm remove' : 'Confirmar') : (isEn ? 'Remove' : 'Eliminar')}</button></header><div className="before-after-pair"><figure><span>BEFORE</span><img src={item.before} alt={`${item.label} before`}/></figure><figure><span>AFTER</span><img src={item.after} alt={`${item.label} after`}/></figure></div><dl><div><dt>{isEn ? 'Area' : 'Área'}</dt><dd>{item.area}</dd></div><div><dt>{isEn ? 'Documented interval' : 'Intervalo documentado'}</dt><dd>{item.interval}</dd></div></dl>{item.notes && <p>{item.notes}</p>}<details><summary><Eye size={15}/>{isEn ? 'Guided visual analysis' : 'Análisis visual guiado'}<ChevronDown size={16}/></summary><ul><li>{isEn ? 'Are position, lighting, framing and expression truly comparable?' : '¿Posición, luz, encuadre y expresión son realmente comparables?'}</li><li>{isEn ? 'What can be observed objectively, and what still requires provider interpretation?' : '¿Qué puede observarse objetivamente y qué requiere interpretación del personal médico calificado?'}</li><li>{isEn ? 'Does the interval match the expected phase of treatment and recovery?' : '¿El intervalo corresponde a la fase esperada de tratamiento y recuperación?'}</li><li>{isEn ? 'Which statement would be accurate without implying a typical or guaranteed result?' : '¿Qué frase sería precisa sin insinuar un resultado típico o garantizado?'}</li></ul></details><small><LockKeyhole size={13}/>{isEn ? 'Stored locally for this training preview; never enter patient identifiers.' : 'Guardado localmente para este preview; nunca introduzcas identificadores del paciente.'}</small></article>)}</div> : !officialCases.length ? <div className="visual-empty"><div className="empty-pair"><div><FileImage size={30}/><span>BEFORE</span></div><div><FileImage size={30}/><span>AFTER</span></div></div><div><strong>{isEn ? 'No approved image pair has been loaded yet' : 'Todavía no se ha cargado un par aprobado'}</strong><p>{isEn ? 'The visual lab is ready. Add the original, authorized pair from the Eastern Medical catalog—never a downloaded competitor image or an AI-generated result.' : 'El laboratorio está listo. Añade el par original y autorizado del catálogo de Eastern Medical; nunca una imagen descargada de otra clínica ni un resultado generado con IA.'}</p></div></div> : null}
    <div className="visual-actions"><a href="https://www.instagram.com/eastern_medicalgroup/" target="_blank" rel="noreferrer"><Sparkles size={16}/>{isEn ? 'Open official Eastern profile' : 'Abrir perfil oficial de Eastern'}</a><button onClick={() => setFormOpen((current) => !current)}><Plus size={17}/>{formOpen ? (isEn ? 'Close case form' : 'Cerrar formulario') : (isEn ? 'Add approved image pair' : 'Añadir par aprobado')}</button></div>
    {formOpen && <div className="visual-case-form"><header><div><span>{isEn ? 'AUTHORIZED MEDIA ONLY' : 'SOLAMENTE MATERIAL AUTORIZADO'}</span><h3>{isEn ? 'Create a controlled training case' : 'Crear un caso controlado de capacitación'}</h3></div><Info size={21}/></header><div className="case-fields"><label>{isEn ? 'Case label' : 'Nombre del caso'}<input value={form.label} onChange={(event) => update('label', event.target.value)} placeholder={`${lessonTitle} · 01`}/></label><label>{isEn ? 'Treatment area *' : 'Área tratada *'}<input value={form.area} onChange={(event) => update('area', event.target.value)} placeholder={isEn ? 'Example: lower face / jawline' : 'Ejemplo: tercio inferior / mandíbula'}/></label><label>{isEn ? 'Documented interval *' : 'Intervalo documentado *'}<input value={form.interval} onChange={(event) => update('interval', event.target.value)} placeholder={isEn ? 'Example: baseline → 12 weeks' : 'Ejemplo: baseline → 12 semanas'}/></label><label>{isEn ? 'Teaching note' : 'Nota didáctica'}<input value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder={isEn ? 'What should the employee learn?' : '¿Qué debe aprender el colaborador?'}/></label></div><div className="case-image-inputs">{['before', 'after'].map((field) => <label key={field} className={form[field] ? 'loaded' : ''}><span>{field.toUpperCase()}</span>{form[field] ? <img src={form[field]} alt={`${field} preview`}/> : <FileImage size={32}/>}<strong><Upload size={15}/>{isEn ? `Choose ${field} image` : `Seleccionar imagen ${field}`}</strong><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => loadFile(field, event.target.files?.[0])}/></label>)}</div><label className="case-authorization"><input type="checkbox" checked={form.consent} onChange={(event) => update('consent', event.target.checked)}/><span><strong>{isEn ? 'I confirm documented authorization and de-identification' : 'Confirmo autorización documentada y desidentificación'}</strong>{isEn ? 'The images contain no patient name, chart number, date of birth or other unnecessary identifier.' : 'Las imágenes no contienen nombre, número de expediente, fecha de nacimiento ni otro identificador innecesario.'}</span></label>{error && <p className="case-error">{error}</p>}<button className="save-case" onClick={save}><Check size={17}/>{isEn ? 'Save approved training pair' : 'Guardar par aprobado'}</button></div>}
  </section>;
}

function LeadResponseLab({ lang }) {
  const isEn = lang === 'en';
  const [answer, setAnswer] = useState(null);
  const stages = [
    { icon: Megaphone, title: b('Meta Ads', 'Meta Ads'), body: b('Preserve campaign, source, requested service, timestamp and consent.', 'Conserva campaña, origen, servicio solicitado, hora y consentimiento.') },
    { icon: MessageCircle, title: b('WhatsApp + CRM', 'WhatsApp + CRM'), body: b('WhatsApp carries the conversation; the CRM owns the record, task and named employee.', 'WhatsApp lleva la conversación; el CRM conserva registro, tarea y responsable.') },
    { icon: Clock3, title: b('Immediate contact', 'Contacto inmediato'), body: b('Respond without avoidable delay and document each call or message outcome.', 'Responde sin demora evitable y documenta el resultado de cada llamada o mensaje.') },
    { icon: PhoneCall, title: b('Qualify the need', 'Calificar la necesidad'), body: b('Understand goal, area, location and timing without diagnosing or promising treatment.', 'Comprende objetivo, área, sede y disponibilidad sin diagnosticar ni prometer tratamiento.') },
    { icon: CalendarCheck2, title: b('Live availability', 'Disponibilidad real'), body: b('Verify provider, location, appointment type, duration, blocks and resources in the live CRM calendar.', 'Verifica personal médico calificado, sede, tipo, duración, bloqueos y recursos en el calendario activo del CRM.') },
    { icon: UserRoundCheck, title: b('Book and close', 'Agendar y cerrar'), body: b('Save the appointment, repeat details, send confirmation and create the next task.', 'Guarda la cita, repite los detalles, confirma y crea la próxima tarea.') },
  ];
  const options = [
    b('Confirm 3:00 p.m. in WhatsApp now and enter it in the CRM later.', 'Confirmar 3:00 p. m. por WhatsApp y después introducirlo en el CRM.'),
    b('Open the live CRM calendar, verify the correct provider, location, consultation type and duration, save the appointment, then send confirmation.', 'Abrir el calendario activo del CRM, verificar la disponibilidad del personal médico calificado, la sede, tipo de consulta y duración, guardar la cita y después enviar confirmación.'),
    b('Send the lead to a group chat and assume someone will schedule it.', 'Enviar el lead a un chat grupal y asumir que alguien lo agendará.'),
  ];
  return <section className="lead-response-lab">
    <header><div><span><Megaphone size={16}/>{isEn ? 'LEAD RESPONSE COMMAND CENTER' : 'CENTRO DE RESPUESTA A LEADS'}</span><h2>{isEn ? 'From Meta Ads to a verified CRM appointment' : 'De Meta Ads a una cita verificada en el CRM'}</h2><p>{isEn ? 'Speed matters, but a fast promise without real calendar availability creates a broken patient experience.' : 'La rapidez importa, pero una promesa sin disponibilidad real crea una mala experiencia para el paciente.'}</p></div><strong>{isEn ? 'WHATSAPP IS A CHANNEL · CRM IS THE RECORD' : 'WHATSAPP ES EL CANAL · CRM ES EL REGISTRO'}</strong></header>
    <div className="lead-response-flow">{stages.map((stage, index) => { const Icon = stage.icon; return <React.Fragment key={stage.title.en}><article><i><Icon size={19}/></i><span>{String(index + 1).padStart(2, '0')}</span><h3>{stage.title[lang]}</h3><p>{stage.body[lang]}</p></article>{index < stages.length - 1 && <ArrowRight className="lead-flow-arrow" size={18}/>}</React.Fragment>; })}</div>
    <div className="lead-nonnegotiables"><div><CheckCircle2 size={18}/><p><strong>{isEn ? 'Immediate owner' : 'Responsable inmediato'}</strong>{isEn ? 'The first employee owns the lead until a named teammate accepts the CRM handoff.' : 'El primer colaborador responde por el lead hasta que otro empleado acepte la transición en el CRM.'}</p></div><div><CheckCircle2 size={18}/><p><strong>{isEn ? 'Real availability' : 'Disponibilidad real'}</strong>{isEn ? 'No time is offered from memory, a personal calendar or an unverified opening.' : 'No se ofrece una hora de memoria, calendario personal ni espacio sin verificar.'}</p></div><div><CheckCircle2 size={18}/><p><strong>{isEn ? 'Closed loop' : 'Ciclo cerrado'}</strong>{isEn ? 'If it is not saved and confirmed in the CRM, it is not a confirmed appointment.' : 'Si no está guardada y confirmada en el CRM, no es una cita confirmada.'}</p></div></div>
    <div className="lead-decision"><header><span>{isEn ? 'LIVE DECISION DRILL' : 'SIMULACIÓN DE DECISIÓN'}</span><h3>{isEn ? 'A Meta lead requests Endolift today. WhatsApp appears to show 3:00 p.m. available. What do you do?' : 'Un lead de Meta pide Endolift hoy. WhatsApp parece indicar 3:00 p. m. disponible. ¿Qué haces?'}</h3></header><div>{options.map((option, index) => <button key={option.en} className={answer === index ? (index === 1 ? 'correct' : 'incorrect') : ''} onClick={() => setAnswer(answer === index ? null : index)}><i>{answer === index ? <Check size={16}/> : String.fromCharCode(65 + index)}</i><span>{option[lang]}</span></button>)}</div>{answer !== null && <footer className={answer === 1 ? 'correct' : 'incorrect'}><strong>{answer === 1 ? (isEn ? 'Correct: verify first, then promise.' : 'Correcto: primero verifica, después promete.') : (isEn ? 'Not yet: WhatsApp cannot confirm calendar capacity.' : 'Todavía no: WhatsApp no confirma capacidad del calendario.')}</strong><p>{answer === 1 ? (isEn ? 'The CRM must show real provider, location, appointment-type and duration availability before the time is offered and saved.' : 'El CRM debe mostrar disponibilidad real del personal médico calificado, sede, tipo de cita y duración antes de ofrecer y guardar la hora.') : (isEn ? 'Choose the path that verifies the live CRM calendar, saves the appointment and closes the confirmation loop.' : 'Selecciona la ruta que verifica el calendario activo del CRM, guarda la cita y cierra el ciclo de confirmación.')}</p><button onClick={() => setAnswer(null)}><RotateCcw size={14}/>{isEn ? 'Try again' : 'Intentar de nuevo'}</button></footer>}</div>
  </section>;
}

function FinancingKnowledgeLab({ lang }) {
  const isEn = lang === 'en';
  const [answer, setAnswer] = useState(null);
  const verification = [
    b('Active financing provider and approved application link', 'Proveedor de financiamiento activo y enlace aprobado para solicitar'),
    b('Eligible service, total treatment estimate and amount financed', 'Servicio elegible, estimado total y monto financiado'),
    b('Term, APR, down payment, fees and minimum payment', 'Plazo, APR, pago inicial, cargos y pago mínimo'),
    b('Expiration date, refund path and provider support contact', 'Vigencia, proceso de reembolso y contacto de soporte'),
  ];
  const options = [
    b('Promise the same $30 payment because it appeared in an Eastern post.', 'Prometer el mismo pago de $30 porque apareció en una publicación de Eastern.'),
    b('Identify it as a prior published example, then verify today’s active program and show the patient the exact written terms before applying.', 'Identificarlo como ejemplo publicado anteriormente, verificar el programa activo de hoy y mostrar los términos escritos exactos antes de solicitar.'),
    b('Estimate an approval and interest rate based on the patient’s appearance.', 'Estimar aprobación e interés según la apariencia del paciente.'),
  ];
  return <section className="financing-knowledge-lab">
    <header><div><span><BadgeDollarSign size={17}/>{isEn ? 'FINANCING PROGRAM KNOWLEDGE' : 'CONOCIMIENTO DE PROGRAMAS DE FINANCIAMIENTO'}</span><h2>{isEn ? 'Know the offer. Verify the terms. Never invent the approval.' : 'Conoce la oferta. Verifica los términos. Nunca inventes la aprobación.'}</h2><p>{isEn ? 'Employees learn the exact control points that turn financing into a transparent option instead of a sales promise.' : 'El colaborador aprende los controles que convierten el financiamiento en una opción transparente, no en una promesa de venta.'}</p></div><ShieldCheck size={30}/></header>
    <div className="financing-program-grid"><article className="published-program"><span>{isEn ? 'OFFICIAL PUBLISHED EXAMPLE' : 'EJEMPLO OFICIAL PUBLICADO'}</span><h3>{isEn ? 'Eastern Endolift financing campaign' : 'Campaña de financiamiento para Endolift'}</h3><dl><div><dt>{isEn ? 'Published starting payment' : 'Pago inicial publicado'}</dt><dd>{isEn ? 'From $30 per month' : 'Desde $30 al mes'}</dd></div><div><dt>{isEn ? 'Published maximum term' : 'Plazo máximo publicado'}</dt><dd>{isEn ? 'Up to 24 months' : 'Hasta 24 meses'}</dd></div><div><dt>{isEn ? 'Campaign language' : 'Lenguaje de campaña'}</dt><dd>{isEn ? 'No-interest / no-credit-required language was used' : 'Se utilizó lenguaje de sin intereses / sin necesidad de crédito'}</dd></div></dl><div><Info size={17}/><p>{isEn ? 'Historical campaign evidence—not an automatically active quote. Revalidate provider, eligibility and current written terms before repeating it.' : 'Evidencia histórica de campaña, no una cotización automáticamente vigente. Revalida el proveedor de financiamiento, la elegibilidad y términos escritos antes de repetirla.'}</p></div><a href="https://www.instagram.com/eastern_medicalgroup/reel/DA4hOAvuuAQ/" target="_blank" rel="noreferrer"><ExternalLink size={14}/>{isEn ? 'View official publication' : 'Ver publicación oficial'}</a></article><article className="program-verification"><span>{isEn ? 'BEFORE PRESENTING ANY PROGRAM' : 'ANTES DE PRESENTAR CUALQUIER PROGRAMA'}</span><h3>{isEn ? 'Four-point current-program verification' : 'Verificación del programa vigente en cuatro puntos'}</h3><ul>{verification.map((item) => <li key={item.en}><CheckCircle2 size={16}/>{item[lang]}</li>)}</ul><p><LockKeyhole size={15}/>{isEn ? 'The patient completes financial data in the approved provider channel. Staff never copy sensitive application data into WhatsApp or CRM notes.' : 'El paciente completa datos financieros en el canal aprobado del proveedor de financiamiento. El personal nunca copia datos sensibles en WhatsApp ni notas del CRM.'}</p></article></div>
    <div className="financing-decision"><span>{isEn ? 'KNOWLEDGE CHECK' : 'EVALUACIÓN DE CONOCIMIENTO'}</span><h3>{isEn ? 'A patient shows the older Eastern campaign and asks, “Will my payment definitely be $30 with no interest?”' : 'Una paciente muestra la campaña anterior y pregunta: “¿Mi pago definitivamente será $30 sin intereses?”'}</h3><div>{options.map((option, index) => <button key={option.en} className={answer === index ? (index === 1 ? 'correct' : 'incorrect') : ''} onClick={() => setAnswer(answer === index ? null : index)}><i>{answer === index ? <Check size={16}/> : String.fromCharCode(65 + index)}</i><span>{option[lang]}</span></button>)}</div>{answer !== null && <p className={answer === 1 ? 'correct' : 'incorrect'}>{answer === 1 ? (isEn ? 'Correct. Published examples open the conversation; only the active written disclosure establishes the patient’s real terms.' : 'Correcto. Los ejemplos publicados abren la conversación; solamente la divulgación escrita vigente establece los términos reales del paciente.') : (isEn ? 'Review the active program and written disclosure. Staff cannot guarantee payment, approval, APR or term.' : 'Revisa el programa activo y la divulgación escrita. El personal no garantiza pago, aprobación, APR ni plazo.')}</p>}</div>
  </section>;
}

export default function AestheticsModuleExperience({ lesson, moduleIndex, lang }) {
  const isEn = lang === 'en';
  const sections = useMemo(() => lesson.sections.filter((section) => !/approval standard/i.test(section[0])), [lesson]);
  const storageKey = `ema-aesthetics-sections-v1-${moduleIndex}`;
  const [reviewed, setReviewed] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { return new Set(); } });
  const [openSection, setOpenSection] = useState(0);
  const faqs = moduleFaqs[moduleIndex] || [];
  const progress = sections.length ? Math.round((reviewed.size / sections.length) * 100) : 0;
  const toggleReviewed = (index) => {
    const next = new Set(reviewed);
    next.has(index) ? next.delete(index) : next.add(index);
    setReviewed(next); localStorage.setItem(storageKey, JSON.stringify([...next]));
  };
  return <section className="aesthetics-module-experience">
    <header className="aesthetics-module-map"><div><span><Sparkles size={16}/>{isEn ? 'CORPORATE CERTIFICATION EXPERIENCE' : 'EXPERIENCIA DE CERTIFICACIÓN CORPORATIVA'}</span><h2>{isEn ? 'Teaching first. Practice after. Approval with evidence.' : 'Primero enseñanza. Después práctica. Aprobación con evidencia.'}</h2><p>{isEn ? 'This module follows the complete corporate-learning sequence requested for Eastern Medical Aesthetics.' : 'Este módulo sigue la secuencia completa de aprendizaje corporativo solicitada para Eastern Medical Aesthetics.'}</p></div><aside><strong>{String(moduleIndex + 1).padStart(2, '0')}</strong><span>{isEn ? 'of 20 modules' : 'de 20 módulos'}</span></aside></header>
    <div className="aesthetics-learning-route">{learningRoute.map((step, index) => <div key={step.en} className={index === 0 ? 'active' : ''}><i>{index + 1}</i><span>{step[lang]}</span>{index === 0 && <CheckCircle2 size={16}/>}</div>)}</div>
    <section className="aesthetics-masterclass"><header><div><span><BookOpen size={16}/>{isEn ? 'COMPLETE MASTERCLASS' : 'MASTERCLASS COMPLETA'}</span><h2>{isEn ? 'Open every chapter and study the complete standard' : 'Abre cada capítulo y estudia el estándar completo'}</h2><p>{isEn ? 'The assessment appears only after the teaching material. Marking a chapter reviewed can be undone at any time.' : 'La evaluación aparece solamente después de la materia. Puedes marcar o desmarcar un capítulo en cualquier momento.'}</p></div><div className="masterclass-progress"><strong>{reviewed.size}/{sections.length}</strong><span>{isEn ? 'chapters reviewed' : 'capítulos revisados'}</span><div><i style={{ width: `${progress}%` }}/></div><b>{progress}%</b></div></header><div className="aesthetics-chapter-list">{sections.map((section, index) => { const open = openSection === index; const done = reviewed.has(index); return <article key={section[0]} className={`${open ? 'open' : ''} ${done ? 'reviewed' : ''}`}><button className="chapter-heading" onClick={() => setOpenSection(open ? -1 : index)}><i>{done ? <Check size={16}/> : String(index + 1).padStart(2, '0')}</i><div><span>{sectionKind(section[isEn ? 0 : 1], lang)}</span><h3>{section[isEn ? 0 : 1]}</h3></div><em>{open ? (isEn ? 'Close' : 'Cerrar') : (isEn ? 'Study chapter' : 'Estudiar')}</em><ChevronDown size={19}/></button>{open && <div className="chapter-content"><div className="chapter-reading">{paragraphs(section[isEn ? 2 : 3]).map((paragraph, paragraphIndex) => <p key={`${section[0]}-${paragraphIndex}`}>{paragraph}</p>)}</div><div className="chapter-application"><Target size={20}/><div><strong>{isEn ? 'Apply the concept' : 'Aplicar el concepto'}</strong><p>{isEn ? 'Identify the responsible role, the stop point and the documentation or handoff required before moving forward.' : 'Identifica el rol responsable, el punto de detención y la documentación o transición requerida antes de avanzar.'}</p></div></div><button className={`chapter-review-button ${done ? 'done' : ''}`} onClick={() => toggleReviewed(index)}>{done ? <CheckCircle2 size={17}/> : <Check size={17}/>} {done ? (isEn ? 'Reviewed · click to uncheck' : 'Revisado · clic para desmarcar') : (isEn ? 'Mark chapter reviewed' : 'Marcar capítulo como revisado')}</button></div>}</article>; })}</div></section>
    {!!faqs.length && <section className="aesthetics-faq"><header><span><Info size={16}/>{isEn ? 'OFFICIAL RESPONSE PRACTICE' : 'PRÁCTICA DE RESPUESTA OFICIAL'}</span><h2>{isEn ? 'Frequently asked questions' : 'Preguntas frecuentes'}</h2><p>{isEn ? 'Open each answer and practice explaining it without diagnosing, selecting treatment or guaranteeing a result.' : 'Abre cada respuesta y practica explicarla sin diagnosticar, seleccionar tratamiento ni garantizar resultados.'}</p></header><div>{faqs.map(([question, answer], index) => <details key={question.en}><summary><i>{String(index + 1).padStart(2, '0')}</i><strong>{question[lang]}</strong><ChevronDown size={18}/></summary><p>{answer[lang]}</p></details>)}</div></section>}
    {moduleIndex === 1 && <LeadResponseLab lang={lang}/>}
    {moduleIndex === 17 && <FinancingKnowledgeLab lang={lang}/>}
    {visualFocus[moduleIndex] && <VisualEvidenceLab moduleIndex={moduleIndex} lessonTitle={lesson.title[isEn ? 0 : 1]} lang={lang}/>}
    <footer className="aesthetics-module-standard"><ShieldCheck size={23}/><div><span>{isEn ? 'CORPORATE LEARNING STANDARD' : 'ESTÁNDAR DE APRENDIZAJE CORPORATIVO'}</span><strong>{isEn ? 'Knowledge is taught, applied, tested and supervised before clinical privilege.' : 'El conocimiento se enseña, aplica, evalúa y supervisa antes del privilegio clínico.'}</strong><p>{isEn ? 'Academy completion documents learning; it never replaces a license, current IFU/SOP, observed competency or written procedure-specific authorization.' : 'Completar Academy documenta aprendizaje; nunca sustituye licencia, IFU/SOP vigente, competencia observada ni autorización escrita específica del procedimiento.'}</p></div></footer>
  </section>;
}
