import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, CheckCircle2, ChevronRight, ClipboardCheck, Lightbulb, MessageSquareText, RotateCcw, Sparkles, Target } from 'lucide-react';
import './interactive-learning.css';
import './interactive-learning-flow.css';

const foundationLabs = [
  {
    context:{en:'A caller found Eastern Medical through a campaign. She needs a primary-care appointment, says her plan may not be accepted and is also curious about a facial she saw online.',es:'Una persona llegó por una campaña. Necesita una cita de medicina primaria, indica que quizás su plan no sea aceptado y también pregunta por un facial que vio en redes.'},
    question:{en:'Which response demonstrates the two Eastern pillars?',es:'¿Cuál respuesta demuestra los dos pilares de Eastern?'},
    options:[
      {en:'Focus only on the fastest sale and promise that every service is covered.',es:'Concentrarse solamente en la venta más rápida y prometer que todos los servicios están cubiertos.'},
      {en:'Clarify the medical need first, verify the safe appointment path, ask permission to connect Seven Insurance for coverage guidance and separately offer an Aesthetics consultation.',es:'Aclarar primero la necesidad médica, verificar una ruta segura de cita, pedir permiso para conectar con Seven Insurance y ofrecer por separado una consulta de Estética.'},
      {en:'Transfer the call to a general number without documenting anything.',es:'Transferir la llamada a un número general sin documentar nada.'},
    ],correct:1,
    feedback:{en:'Correct. Patient well-being determines the safe first step; commercial discipline recognizes relevant opportunities, obtains permission and creates owned handoffs without pressure.',es:'Correcto. El bienestar del paciente determina el primer paso seguro; la disciplina comercial reconoce oportunidades pertinentes, obtiene permiso y crea transiciones con responsable sin presión.'}
  },
  {
    context:{en:'A patient says, “I always go to Eastern Medical,” but the record displays 305 Medical Care and the requested appointment is in Hialeah.',es:'Un paciente dice: “Yo siempre voy a Eastern Medical”, pero el expediente muestra 305 Medical Care y la cita solicitada es en Hialeah.'},
    question:{en:'What must the employee do before scheduling?',es:'¿Qué debe hacer el colaborador antes de agendar?'},
    options:[
      {en:'Use any Eastern entity because they are interchangeable.',es:'Usar cualquier entidad Eastern porque son intercambiables.'},
      {en:'Verify the legal entity, chart, billing identity, intended office and approved workflow before confirming.',es:'Verificar entidad legal, expediente, identidad de facturación, sede prevista y flujo aprobado antes de confirmar.'},
      {en:'Create a second chart under Eastern Medical Group automatically.',es:'Crear automáticamente otro expediente bajo Eastern Medical Group.'},
    ],correct:1,
    feedback:{en:'Correct. A connected ecosystem does not erase legal and operational distinctions. Entity, chart, authorization and location must align.',es:'Correcto. Un ecosistema conectado no elimina las diferencias legales y operativas. Entidad, expediente, autorización y sede deben coincidir.'}
  },
  {
    context:{en:'A patient says they take too many medications and asks the front-desk employee which one to stop. They also admit they rarely exercise and do not understand their diet plan.',es:'Un paciente dice que toma demasiados medicamentos y pregunta al personal de recepción cuál debe suspender. También admite que casi no hace ejercicio y no comprende su plan alimentario.'},
    question:{en:'How should “patient first” be applied?',es:'¿Cómo debe aplicarse “el paciente primero”?'},
    options:[
      {en:'Recommend stopping the medication that seems least important.',es:'Recomendar suspender el medicamento que parezca menos importante.'},
      {en:'Protect the clinical boundary, route medication concerns to the provider and help connect the patient with preventive counseling, nutrition and follow-up resources.',es:'Proteger el límite clínico, canalizar la duda de medicamentos a la proveedora y conectar al paciente con counseling preventivo, nutrición y seguimiento.'},
      {en:'Tell the patient that lifestyle does not matter if medication is available.',es:'Decir que el estilo de vida no importa si existen medicamentos.'},
    ],correct:1,
    feedback:{en:'Correct. Prevention, nutrition, movement and counseling support quality of life, while medication changes remain with licensed clinicians.',es:'Correcto. Prevención, nutrición, movimiento y counseling apoyan la calidad de vida, mientras los cambios de medicamentos corresponden al personal clínico licenciado.'}
  },
  {
    context:{en:'A new employee receives requests for allergy testing in Miami, a medical visit in Hialeah and a clinical-study question from Fort Myers.',es:'Un nuevo colaborador recibe solicitudes de pruebas de alergia en Miami, una consulta médica en Hialeah y una pregunta de investigación clínica desde Fort Myers.'},
    question:{en:'What is the correct operating habit?',es:'¿Cuál es el hábito operativo correcto?'},
    options:[
      {en:'Assume every service exists at every office.',es:'Suponer que cada servicio existe en todas las sedes.'},
      {en:'Identify the service owner, verify live availability and location, then document a warm handoff to the correct team.',es:'Identificar al responsable, verificar disponibilidad y sede vigentes y documentar una transición acompañada al equipo correcto.'},
      {en:'Give each caller the Fort Myers address.',es:'Dar a cada persona la dirección de Fort Myers.'},
    ],correct:1,
    feedback:{en:'Correct. Location is part of the service promise. Availability, payer, provider and preparation requirements must be verified live.',es:'Correcto. La sede forma parte de la promesa de servicio. Disponibilidad, pagador, proveedor y preparación deben verificarse en vivo.'}
  },
  {
    context:{en:'After an appointment request, the employee sends a private message to another department but does not enter a CRM/EHR note or confirm receipt.',es:'Después de una solicitud de cita, el colaborador envía un mensaje privado a otro departamento, pero no registra nota en CRM/EHR ni confirma recepción.'},
    question:{en:'What is missing from the patient journey?',es:'¿Qué falta en el recorrido del paciente?'},
    options:[
      {en:'Nothing; sending a message completes the work.',es:'Nada; enviar un mensaje completa el trabajo.'},
      {en:'A documented owner, accepted handoff, clear next action and follow-up expectation.',es:'Un responsable documentado, transición aceptada, próxima acción clara y expectativa de seguimiento.'},
      {en:'A promise that the appointment will happen today.',es:'Una promesa de que la cita ocurrirá hoy.'},
    ],correct:1,
    feedback:{en:'Correct. The next team must accept ownership and the patient must understand what will happen next. An untracked transfer is not continuity.',es:'Correcto. El próximo equipo debe aceptar responsabilidad y el paciente debe entender qué sucederá. Una transferencia sin seguimiento no es continuidad.'}
  },
  {
    context:{en:'A patient asks whether a laboratory result means cancer and wants an immediate answer before scheduling.',es:'Un paciente pregunta si un resultado de laboratorio significa cáncer y exige una respuesta antes de agendar.'},
    question:{en:'Which response is accurate, empathetic and within scope?',es:'¿Cuál respuesta es precisa, empática y está dentro del alcance?'},
    options:[
      {en:'“It probably is not serious.”',es:'“Probablemente no sea grave.”'},
      {en:'“I understand why you are concerned. The provider must interpret the result and evaluate your case. I can help arrange the appropriate follow-up.”',es:'“Comprendo su preocupación. La proveedora debe interpretar el resultado y valorar su caso. Puedo ayudarle a coordinar el seguimiento apropiado.”'},
      {en:'“Search the value online and call us back.”',es:'“Busque el valor en internet y vuelva a llamarnos.”'},
    ],correct:1,
    feedback:{en:'Correct. Empathy does not require speculation. A strong response acknowledges concern, protects clinical scope and creates a useful next step.',es:'Correcto. La empatía no requiere especular. Una respuesta sólida reconoce la preocupación, protege el alcance clínico y crea un próximo paso útil.'}
  },
  {
    context:{en:'A lead needs medical scheduling, insurance guidance and transportation information. Three departments are involved.',es:'Un lead necesita cita médica, orientación de seguro e información de transportación. Participan tres departamentos.'},
    question:{en:'How should the team collaborate?',es:'¿Cómo debe colaborar el equipo?'},
    options:[
      {en:'Create one vague note and send it to everyone.',es:'Crear una nota vaga y enviarla a todos.'},
      {en:'Name a primary owner, create separate trackable tasks, share only necessary information and confirm each receiving team’s next action.',es:'Nombrar responsable principal, crear tareas rastreables separadas, compartir solamente información necesaria y confirmar la próxima acción de cada equipo.'},
      {en:'Ask the patient to coordinate all departments independently.',es:'Pedir al paciente que coordine todos los departamentos por su cuenta.'},
    ],correct:1,
    feedback:{en:'Correct. Collaboration needs explicit ownership, minimum-necessary information and closed-loop communication—not a group message.',es:'Correcto. La colaboración requiere responsabilidad explícita, información mínima necesaria y comunicación de ciclo cerrado; no un mensaje grupal.'}
  },
  {
    context:{en:'During the final simulation, a caller reports chest pain, asks whether their plan is accepted and mentions interest in a wellness program.',es:'Durante la simulación final, una persona reporta dolor de pecho, pregunta si aceptamos su plan y menciona interés en un programa de bienestar.'},
    question:{en:'What determines the order of action?',es:'¿Qué determina el orden de acción?'},
    options:[
      {en:'The opportunity with the greatest revenue.',es:'La oportunidad con mayor ingreso.'},
      {en:'Safety first: direct the emergency to 911/ER, then document according to policy; routine insurance and wellness discussions do not delay emergency direction.',es:'Seguridad primero: dirigir la emergencia al 911/ER y documentar según política; las conversaciones rutinarias de seguro y bienestar no retrasan la instrucción de emergencia.'},
      {en:'Finish the insurance questionnaire before discussing symptoms.',es:'Terminar el cuestionario de seguro antes de hablar de los síntomas.'},
    ],correct:1,
    feedback:{en:'Correct. Patient safety overrides conversion and routine workflows. Scope, privacy and emergency direction are non-negotiable.',es:'Correcto. La seguridad del paciente está por encima de la conversión y los flujos rutinarios. Alcance, privacidad e instrucción de emergencia son innegociables.'}
  },
];

function genericLab(course,lesson,lang,scope){
  const title=lesson.title[lang==='en'?0:1];
  if(lesson.practice)return {
    context:lesson.practice.context[lang],
    question:lesson.practice.question[lang],
    options:lesson.practice.options.map(option=>option[lang]),
    correct:lesson.practice.correct,
    feedback:lesson.practice.feedback[lang]
  };
  if(scope?.inventory)return {
    context:scope.inventory.owner[lang],
    question:lang==='en'?'After completing the inventory and confirming what is missing, what is the correct next step?':'Después de completar el inventario y confirmar lo que falta, ¿cuál es el próximo paso correcto?',
    options:lang==='en'?['Place the order immediately and tell the manager afterward.','Create a consolidated request with exact item, usable on-hand quantity, requested quantity, priority and reason; wait for authorized manager approval before purchase.','Mention the shortage verbally and assume another employee will order it.']:['Realizar la compra inmediatamente y avisar al manager después.','Crear un pedido consolidado con artículo exacto, existencia utilizable, cantidad solicitada, prioridad y razón; esperar aprobación del manager autorizado antes de comprar.','Mencionar el faltante verbalmente y asumir que otro empleado hará el pedido.'],
    correct:1,
    feedback:lang==='en'?'Correct. The employee owns the count and request; the authorized manager owns approval. Purchase, substitution and company-fund commitment occur only after required authorization.':'Correcto. El colaborador es responsable del conteo y el pedido; el manager autorizado es responsable de aprobarlo. La compra, sustitución y compromiso de fondos ocurren solamente después de las autorizaciones requeridas.'
  };
  if(scope)return {
    context:scope.purpose[lang],
    question:lang==='en'?`Which action stays within the ${scope.title.en} scope and closes the loop?`:`¿Cuál acción respeta el scope de ${scope.title.es} y cierra el ciclo?`,
    options:lang==='en'?['Make an independent decision outside the role so the process moves faster.',`${scope.responsibilities.en[0]} Then use the documented handoff: ${scope.handoffs.en[0]}.`,'Leave the next action undocumented and assume another department will discover it.']:['Tomar una decisión independiente fuera del cargo para acelerar el proceso.',`${scope.responsibilities.es[0]} Después, usar la transición documentada: ${scope.handoffs.es[0]}.`,'Dejar la próxima acción sin documentar y asumir que otro departamento la encontrará.'],
    correct:1,
    feedback:lang==='en'?`Correct. This answer comes directly from the taught responsibilities and handoffs for ${scope.title.en}.`:`Correcto. Esta respuesta surge directamente de las responsabilidades y transiciones enseñadas para ${scope.title.es}.`
  };
  return {
    context:lang==='en'?`A real work request arrives involving “${title}”. The information is incomplete and the person expects an immediate answer.`:`Llega una solicitud real relacionada con “${title}”. La información está incompleta y la persona espera una respuesta inmediata.`,
    question:lang==='en'?'Which action reflects the Eastern operating standard?':'¿Cuál acción refleja el estándar operativo de Eastern?',
    options:lang==='en'?['Promise an outcome so the person feels reassured.','Clarify the need, verify the approved source, act within role, document the owner and explain the next step.','Forward the request without context and assume someone else will handle it.']:['Prometer un resultado para tranquilizar a la persona.','Aclarar la necesidad, verificar la fuente aprobada, actuar dentro del rol, documentar responsable y explicar el próximo paso.','Reenviar la solicitud sin contexto y suponer que alguien se encargará.'],
    correct:1,
    feedback:lang==='en'?`Correct. ${course.title.en} becomes useful only when verified knowledge produces a safe, owned and documented action.`:`Correcto. ${course.title.es} se vuelve útil cuando el conocimiento verificado produce una acción segura, documentada y con responsable.`
  };
}

export default function InteractiveLearning({course,lesson,active,lang,scope,learnerKey='anonymous',onPracticeChange,onRecord}){
  const isEn=lang==='en'; const courseKey=course.id==='aesthetics'?'aesthetics-certification-v1':course.id; const key=`${learnerKey}-${courseKey}-${active}`;
  const [tab,setTab]=useState('explore');
  const [answer,setAnswer]=useState(()=>{const saved=localStorage.getItem(`ema-practice-${key}`);return saved===null?null:Number(saved)});
  const [validated,setValidated]=useState(()=>localStorage.getItem(`ema-validated-${key}`)==='true');
  const [notes,setNotes]=useState(()=>localStorage.getItem(`ema-notes-${key}`)||'');
  const [commitment,setCommitment]=useState(()=>localStorage.getItem(`ema-commitment-${key}`)||'');
  const [confidence,setConfidence]=useState(()=>Number(localStorage.getItem(`ema-confidence-${key}`)||0));
  const lab=useMemo(()=>course.id==='foundations'&&foundationLabs[active]?foundationLabs[active]:genericLab(course,lesson,lang,scope),[course,lesson,active,lang,scope]);
  const cards=lesson.sections.slice(0,3);
  const [revealedCards,setRevealedCards]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem(`ema-revealed-${key}`)||'[]'))}catch{return new Set()}});
  const correct=validated&&answer===lab.correct;
  const exploreComplete=cards.length===0||revealedCards.size===cards.length;
  const reflectComplete=confidence>0;
  const studioComplete=exploreComplete&&correct&&reflectComplete;
  useEffect(()=>onPracticeChange?.(studioComplete),[studioComplete,onPracticeChange]);
  const choose=index=>{setAnswer(index);setValidated(false);localStorage.setItem(`ema-practice-${key}`,String(index));localStorage.removeItem(`ema-validated-${key}`)};
  const validate=()=>{if(answer===null)return;setValidated(true);localStorage.setItem(`ema-validated-${key}`,'true');const question=course.id==='foundations'?lab.question[lang]:lab.question;const options=course.id==='foundations'?lab.options.map(option=>option[lang]):lab.options;onRecord?.({type:'answer',source:'interactive_learning',question,options,selectedIndex:answer,selectedAnswer:options[answer],correctIndex:lab.correct,correct:answer===lab.correct})};
  const toggleCard=index=>setRevealedCards(current=>{const next=new Set(current);next.has(index)?next.delete(index):next.add(index);localStorage.setItem(`ema-revealed-${key}`,JSON.stringify([...next]));return next});
  const saveText=(type,value,setter)=>{setter(value);localStorage.setItem(`ema-${type}-${key}`,value)};
  const reset=()=>{setAnswer(null);setValidated(false);localStorage.removeItem(`ema-practice-${key}`);localStorage.removeItem(`ema-validated-${key}`);onPracticeChange?.(false)};
  return <section className="learning-studio">
    <header className="studio-header"><div><span><Sparkles size={16}/>{isEn?'INTERACTIVE LEARNING STUDIO':'ESTUDIO DE APRENDIZAJE INTERACTIVO'}</span><h2>{isEn?'Learn it. Apply it. Make it yours.':'Apréndelo. Aplícalo. Hazlo tuyo.'}</h2><p>{isEn?'Follow the guided route: review the three cards, validate your decision and record your confidence.':'Sigue la ruta guiada: revisa las tres tarjetas, valida tu decisión y registra tu nivel de confianza.'}</p></div><div className="studio-score"><strong>{[exploreComplete,correct,reflectComplete].filter(Boolean).length}/3</strong><span>{isEn?'completed steps':'pasos completados'}</span></div></header>
    <nav className="studio-tabs" aria-label={isEn?'Learning modes':'Modos de aprendizaje'}><button className={`${tab==='explore'?'active ':''}${exploreComplete?'complete':''}`} onClick={()=>setTab('explore')}><BookOpen size={17}/><span>{exploreComplete?<Check size={14}/>:<>01</>}</span>{isEn?'Explore':'Explorar'}{exploreComplete&&<CheckCircle2 size={15}/>}</button><button className={`${tab==='practice'?'active ':''}${correct?'complete':''}`} onClick={()=>setTab('practice')}><Target size={17}/><span>{correct?<Check size={14}/>:<>02</>}</span>{isEn?'Practice':'Practicar'}{correct&&<CheckCircle2 size={15}/>}</button><button className={`${tab==='reflect'?'active ':''}${reflectComplete?'complete':''}`} onClick={()=>setTab('reflect')}><MessageSquareText size={17}/><span>{reflectComplete?<Check size={14}/>:<>03</>}</span>{isEn?'Reflect':'Reflexionar'}{reflectComplete&&<CheckCircle2 size={15}/>}</button></nav>
    {tab==='explore'&&<div className="studio-panel explore-panel"><div className="studio-instruction"><Lightbulb size={20}/><div><strong>{isEn?'Step 1 · Open all three cards':'Paso 1 · Abre las tres tarjetas'}</strong><p>{isEn?'Tap once to check a reviewed card. Tap it again to uncheck it.':'Toca una vez para marcar una tarjeta revisada. Tócala nuevamente para desmarcarla.'}</p></div></div><div className="recall-grid">{cards.map((section,index)=>{const open=revealedCards.has(index);return <button key={section[0]} className={open?'revealed':''} aria-pressed={open} aria-label={`${section[isEn?0:1]}. ${open?(isEn?'Checked; tap to uncheck':'Marcada; toca para desmarcar'):(isEn?'Unchecked; tap to check':'Sin marcar; toca para marcar')}`} onClick={()=>toggleCard(index)}><span>{open?<Check size={17}/>:String(index+1).padStart(2,'0')}</span><h3>{section[isEn?0:1]}</h3>{open?<><p>{section[isEn?2:3]}</p><small className="recall-toggle-hint">{isEn?'Checked · Tap again to uncheck':'Marcada · Toca nuevamente para desmarcar'}</small></>:<small>{isEn?'Think first · Tap to check':'Piensa primero · Toca para marcar'}</small>}{open?<CheckCircle2 size={19}/>:<ChevronRight size={18}/>}</button>})}</div><div className="studio-step-action"><span>{exploreComplete?(isEn?'All cards reviewed':'Tres tarjetas revisadas'):(isEn?`${revealedCards.size} of ${cards.length} reviewed`:`${revealedCards.size} de ${cards.length} revisadas`)}</span><button disabled={!exploreComplete} onClick={()=>setTab('practice')}>{isEn?'Continue to practice':'Continuar a práctica'}<ChevronRight size={17}/></button></div><div className="objective-mission"><ClipboardCheck size={20}/><div><strong>{isEn?'Your mission in this lesson':'Tu misión en esta lección'}</strong><ul>{lesson.objectives.map(item=><li key={item[0]}><Check size={14}/>{item[isEn?0:1]}</li>)}</ul></div></div></div>}
    {tab==='practice'&&<div className="studio-panel practice-panel"><div className="simulation-label"><span>{isEn?'STEP 2 · DECISION SIMULATION':'PASO 2 · SIMULACIÓN DE DECISIÓN'}</span><strong>{isEn?'Select one answer, then validate it':'Selecciona una respuesta y después valídala'}</strong></div><p className="simulation-context">{course.id==='foundations'?lab.context[lang]:lab.context}</p><h3>{course.id==='foundations'?lab.question[lang]:lab.question}</h3><div className="simulation-options">{(course.id==='foundations'?lab.options.map(option=>option[lang]):lab.options).map((option,index)=>{const selected=answer===index;const resultClass=validated&&selected?(index===lab.correct?'correct':'incorrect'):'';return <button key={option} aria-pressed={selected} className={`${selected?'selected ':''}${resultClass}`} onClick={()=>choose(index)}><i>{selected?<Check size={18}/>:String.fromCharCode(65+index)}</i><span>{option}</span>{selected&&!validated&&<small>{isEn?'Selected':'Seleccionada'}</small>}{validated&&selected&&(index===lab.correct?<CheckCircle2 size={20}/>:<strong>×</strong>)}</button>})}</div><div className="studio-step-action"><span>{answer===null?(isEn?'Choose the answer you consider correct.':'Elige la respuesta que consideras correcta.'):(validated?(correct?(isEn?'Correct answer validated.':'Respuesta correcta validada.'):(isEn?'Review the feedback and try again.':'Revisa la explicación e inténtalo nuevamente.')):(isEn?'Your selection is marked. Validate it to continue.':'Tu selección está marcada. Valídala para continuar.'))}</span>{correct?<button onClick={()=>setTab('reflect')}>{isEn?'Continue to reflection':'Continuar a reflexión'}<ChevronRight size={17}/></button>:<button disabled={answer===null} onClick={validate}>{isEn?'Check answer':'Comprobar respuesta'}<CheckCircle2 size={17}/></button>}</div>{validated&&<div className={`simulation-feedback ${correct?'correct':'incorrect'}`}><div>{correct?<CheckCircle2 size={22}/>:<RotateCcw size={22}/>}</div><p><strong>{correct?(isEn?'Strong decision':'Decisión sólida'):(isEn?'Not yet. Reconsider the standard.':'Todavía no. Reconsidera el estándar.')}</strong>{correct?(course.id==='foundations'?lab.feedback[lang]:lab.feedback):(isEn?'Review safety, role boundaries, verification, ownership and follow-up. Then try again.':'Revisa seguridad, límites del rol, verificación, responsabilidad y seguimiento. Después inténtalo nuevamente.')}</p>{!correct&&<button onClick={reset}>{isEn?'Try again':'Intentar de nuevo'}</button>}</div>}</div>}
    {tab==='reflect'&&<div className="studio-panel reflect-panel"><div className="studio-instruction"><MessageSquareText size={20}/><div><strong>{isEn?'Step 3 · Reflect and confirm':'Paso 3 · Reflexiona y confirma'}</strong><p>{isEn?'Notes are optional. Select your confidence level to finish the activity and unlock the lesson button.':'Las notas son opcionales. Selecciona tu nivel de confianza para finalizar la actividad y habilitar el botón de la lección.'}</p></div></div><div className="reflection-grid"><label><span>{isEn?'MY NOTES':'MIS NOTAS'}</span><strong>{isEn?'Explain the lesson in your own words':'Explica la lección con tus propias palabras'}</strong><textarea value={notes} onChange={event=>saveText('notes',event.target.value,setNotes)} placeholder={isEn?'What is the key idea? What could go wrong? What will you remember?':'¿Cuál es la idea clave? ¿Qué podría salir mal? ¿Qué vas a recordar?'}/><small>{isEn?'Optional · Saved automatically on this device':'Opcional · Guardado automáticamente en este dispositivo'}</small></label><label><span>{isEn?'ACTION COMMITMENT':'COMPROMISO DE ACCIÓN'}</span><strong>{isEn?'What will you do differently at work?':'¿Qué harás diferente en el trabajo?'}</strong><textarea value={commitment} onChange={event=>saveText('commitment',event.target.value,setCommitment)} placeholder={isEn?'The next time this happens, I will…':'La próxima vez que esto ocurra, voy a…'}/><small>{isEn?'Optional · Use it as a personal reminder':'Opcional · Úsalo como recordatorio personal'}</small></label></div><div className="confidence-check"><div><span>{isEn?'CONFIDENCE CHECK':'NIVEL DE CONFIANZA'}</span><strong>{isEn?'Could you apply this without help?':'¿Podrías aplicar esto sin ayuda?'}</strong></div><div>{[1,2,3,4,5].map(value=><button key={value} aria-pressed={confidence===value} className={confidence===value?'active':''} onClick={()=>{setConfidence(value);localStorage.setItem(`ema-confidence-${key}`,String(value));onRecord?.({type:'reflection',source:'interactive_learning',confidence:value,notes,commitment})}}><b>{value}</b><small>{value===1?(isEn?'Need help':'Necesito ayuda'):value===5?(isEn?'Can coach':'Puedo enseñar'):''}</small></button>)}</div></div><div className={`studio-completion-message ${studioComplete?'ready':''}`}>{studioComplete?<CheckCircle2 size={22}/>:<Lightbulb size={22}/>}<div><strong>{studioComplete?(isEn?'Activity complete':'Actividad completada'):(isEn?'Select a confidence level':'Selecciona un nivel de confianza')}</strong><p>{studioComplete?(isEn?'“Mark complete & continue” is now enabled below.':'El botón “Completar y continuar” ya está habilitado abajo.'):(isEn?'This final check unlocks the lesson completion button.':'Esta última confirmación habilita el botón para completar la lección.')}</p></div></div></div>}
    <footer className="studio-footer"><div><span style={{width:`${Math.round(([exploreComplete,correct,reflectComplete].filter(Boolean).length/3)*100)}%`}}/></div><p>{studioComplete?(isEn?'All three steps are complete. Continue below to the next lesson.':'Los tres pasos están completos. Continúa abajo hacia la próxima lección.'):tab==='explore'?(isEn?'Open all three cards to continue.':'Abre las tres tarjetas para continuar.'):tab==='practice'?(isEn?'Select and validate the correct response.':'Selecciona y valida la respuesta correcta.'):(isEn?'Select your confidence level to finish.':'Selecciona tu nivel de confianza para terminar.')}</p></footer>
  </section>;
}
