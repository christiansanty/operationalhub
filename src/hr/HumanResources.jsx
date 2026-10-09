import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, Check,
  Camera, ChevronDown, ChevronRight, CircleAlert, ClipboardCopy, Clock3, ExternalLink, FileCheck2, FileText, FolderOpen,
  IdCard, Inbox, Link2, Paperclip, PenTool, Search, Send, ShieldCheck, Trash2, Upload, UserRound, Users,
} from 'lucide-react';
import './human-resources.css';

const fileGroups = {
  package: /agreement|contract|expediente|employment|employee|offer|cv|resume/i,
  signed: /signed|signature|agreement|contract|consent|acknowledg/i,
  license: /license|licencia|dea|npi|caqh|medicare|medicaid|credential/i,
};

function classifyFiles(employee) {
  const returned=(employee.hrDossier?.documents||[]).map(document=>({...document,filename:document.filename,returned:true}));
  const files = [...(employee.sourceAttachments || []),...returned];
  const aliases={package:['package','employee-package'],signed:['signed','signed-document'],license:['license','credential','certification']};
  const by = (key) => files.filter((file) => aliases[key].includes(file.category) || fileGroups[key].test(file.filename || ''));
  return { all: files, package: by('package'), signed: by('signed'), license: by('license') };
}

function completeness(employee, files) {
  const checks = [employee.name, employee.role, employee.entity, files.package.length, files.license.length, files.signed.length];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

function Status({ ready, lang }) {
  return <span className={`hr-check-status ${ready ? 'ready' : 'missing'}`}>{ready ? <Check/> : <CircleAlert/>}{ready ? (lang === 'en' ? 'On file' : 'En expediente') : (lang === 'en' ? 'Pending' : 'Pendiente')}</span>;
}

function FileList({ title, subtitle, files, icon: Icon, lang }) {
  return <section className="hr-file-section">
    <header><span className="hr-file-icon"><Icon/></span><div><h3>{title}</h3><p>{subtitle}</p></div><b>{files.length}</b></header>
    {files.length ? <div className="hr-file-list">{files.map((file, index) => { const href=file.fileUrl||(file.id?`/api/operational/airtable/attachments/${encodeURIComponent(file.id)}`:''); const content=<><FileText/><div><strong>{file.filename}</strong><span>{file.category || (lang === 'en' ? 'Mapped source document' : 'Documento mapeado en la fuente')}</span></div>{href?<span className="hr-file-open"><Link2/>{lang==='en'?'Open':'Abrir'}</span>:<Status ready lang={lang}/>}</>; return href?<a key={file.id} href={href} target="_blank" rel="noreferrer">{content}</a>:<article key={`${file.filename}-${index}`}>{content}</article>})}</div> : <div className="hr-file-empty"><FolderOpen/><span>{lang === 'en' ? 'No document is currently exposed by the connected source.' : 'La fuente conectada no expone documentos actualmente en esta sección.'}</span></div>}
  </section>;
}

function HumanResourcesFiles({ employees, lang }) {
  const isEn = lang === 'en';
  const packages = employees.map(employee => ({ employee, files: classifyFiles(employee).package }));
  const blankDocuments = employees.flatMap(employee => (employee.sourceAttachments || []).map(file => ({ ...file, employeeName: employee.name }))).filter(file => file.category === 'blank' || /blank|template|plantilla|formulario|unsigned|sin firmar/i.test(file.filename || ''));
  const openFile = file => file.id ? `/api/operational/airtable/attachments/${encodeURIComponent(file.id)}` : '';
  return <div className="hr-files-hub">
    <section className="hr-files-library">
      <header><span><BriefcaseBusiness/></span><div><small>EMPLOYEE PACKAGES</small><h2>{isEn ? 'Packages by employee' : 'Packages por empleado'}</h2><p>{isEn ? 'Employment and onboarding documents grouped under each employee record.' : 'Documentos laborales y de onboarding agrupados bajo cada expediente.'}</p></div><b>{packages.reduce((total, item) => total + item.files.length, 0)}</b></header>
      <div className="hr-package-list">{packages.map(({ employee, files }) => <article key={employee.recordId || employee.name}><div className="hr-package-person"><span className="hr-directory-avatar">{employee.initials}</span><div><strong>{employee.name}</strong><small>{employee.role || (isEn ? 'Position pending' : 'Puesto pendiente')}</small></div></div><div className="hr-package-documents">{files.length ? files.map((file, index) => { const href = openFile(file); const content = <><FileText/><span>{file.filename}</span>{href && <Link2/>}</>; return href ? <a key={file.id || index} href={href} target="_blank" rel="noreferrer">{content}</a> : <div key={`${file.filename}-${index}`}>{content}</div>; }) : <span className="hr-package-empty"><CircleAlert/>{isEn ? 'Package pending' : 'Package pendiente'}</span>}</div></article>)}</div>
    </section>
    <section className="hr-files-library hr-blank-library">
      <header><span><FileCheck2/></span><div><small>{isEn ? 'SIGNATURE LIBRARY' : 'BIBLIOTECA DE FIRMAS'}</small><h2>{isEn ? 'Blank documents for signature' : 'Documentos en blanco para firma'}</h2><p>{isEn ? 'Master forms that every applicable employee must review and sign.' : 'Formularios maestros que cada empleado aplicable debe revisar y firmar.'}</p></div><b>{blankDocuments.length}</b></header>
      {blankDocuments.length ? <div className="hr-blank-documents">{blankDocuments.map((file, index) => { const href = openFile(file); const content = <><span className="hr-file-icon"><FileText/></span><div><strong>{file.filename}</strong><small>{isEn ? `Source: ${file.employeeName}` : `Fuente: ${file.employeeName}`}</small></div>{href && <span className="hr-file-open"><Link2/>{isEn ? 'Open' : 'Abrir'}</span>}</>; return href ? <a key={file.id || index} href={href} target="_blank" rel="noreferrer">{content}</a> : <article key={`${file.filename}-${index}`}>{content}</article>; })}</div> : <div className="hr-blank-empty"><FolderOpen/><div><strong>{isEn ? 'No blank master documents connected yet' : 'Todavía no hay documentos maestros en blanco conectados'}</strong><p>{isEn ? 'When templates are added to the Human Resource source, they will appear here without mixing them with signed employee copies.' : 'Cuando se añadan plantillas a la fuente de Human Resource, aparecerán aquí sin mezclarse con las copias firmadas de empleados.'}</p></div></div>}
    </section>
  </div>;
}

const packageDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('operational-hub-human-resources', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('blank-packages', { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function packageStore(mode, operation) {
  const database = await packageDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('blank-packages', mode);
    const request = operation(transaction.objectStore('blank-packages'));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

const blobBase64 = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

const clinicalPattern=/\b(md|do|doctor|physician|provider|aprn|pa-c|nurse|rn|lpn|medical assistant|clinical|clinician)\b/i;
const isClinicalEmployee=employee=>employee.workforceGroup?employee.workforceGroup==='clinical':String(employee.source||'').includes('ROSTER - PROVIDERS')||clinicalPattern.test([employee.role,employee.degree,employee.credentialed,employee.license].filter(Boolean).join(' '));
const isDoctorEmployee=employee=>/\b(md|do|doctor|physician)\b|psychiatr/i.test([employee.role,employee.degree,employee.credentialed,employee.license].filter(Boolean).join(' '));
const suggestedDeadline=(employee,days=30)=>{
  const expiration=employee.expiresOn||employee.expirationDate;
  if(expiration){const date=new Date(expiration);if(!Number.isNaN(date.valueOf())){date.setDate(date.getDate()-90);return date.toISOString().slice(0,10)}}
  const date=new Date();date.setDate(date.getDate()+days);return date.toISOString().slice(0,10);
};
const doctorRequirements=(employee,isEn)=>[
  {key:'fl-medical-license',title:isEn?'Active Florida medical license':'Licencia médica activa de Florida',detail:isEn?'Required to practice medicine in Florida; track renewal, profile, CME and financial-responsibility declarations.':'Requerida para ejercer medicina en Florida; controla renovación, perfil, CME y declaración de responsabilidad financiera.',required:isEn?'Required':'Obligatorio',auto:Boolean(employee.licenseNumber),source:'https://flboardofmedicine.gov/renewals/'},
  {key:'npi',title:'NPI · NPPES',detail:isEn?'Individual NPI and current NPPES identity/practice information.':'NPI individual e información vigente de identidad y práctica en NPPES.',required:isEn?'Required for standard transactions and Medicare enrollment':'Requerido para transacciones estándar e inscripción Medicare',auto:Boolean(employee.npi),source:'https://www.cms.gov/medicare/enrollment-renewal/providers-suppliers'},
  {key:'pecos',title:'PECOS · Medicare enrollment',detail:isEn?'Approved Medicare enrollment, reassignment and practice-location information when the physician bills, orders or certifies for Medicare.':'Inscripción Medicare aprobada, reasignación e información de sedes cuando el médico factura, ordena o certifica para Medicare.',required:isEn?'Conditional · Medicare participation/order/certification':'Condicional · participación/órdenes/certificación Medicare',auto:Boolean(employee.medicare),source:'https://www.cms.gov/medicare/enrollment-renewal/providers-suppliers/chain-ownership-system-pecos'},
  {key:'dea',title:'DEA registration',detail:isEn?'Active registration and expiration tracking when the physician prescribes, administers or dispenses controlled substances.':'Registro activo y control de vencimiento cuando el médico prescribe, administra o dispensa sustancias controladas.',required:isEn?'Conditional · controlled substances':'Condicional · sustancias controladas',auto:Boolean(employee.dea),source:'https://www.dea.gov/drug-information/csa'},
  {key:'financial-responsibility',title:isEn?'Malpractice / financial responsibility':'Malpractice / responsabilidad financiera',detail:isEn?'Evidence of the applicable Florida financial-responsibility method or documented exemption.':'Evidencia del método aplicable de responsabilidad financiera en Florida o exención documentada.',required:isEn?'Required or documented exemption':'Obligatorio o exención documentada',auto:(employee.sourceAttachments||[]).some(file=>/malpractice|liability|financial responsibility/i.test(file.filename||'')),source:'https://flboardofmedicine.gov/medical-doctor/'},
  {key:'caqh',title:'CAQH Provider Data Portal',detail:isEn?'Attested credentialing profile and current supporting documents for participating payers.':'Perfil de credentialing atestiguado y documentos vigentes para pagadores participantes.',required:isEn?'Conditional · payer credentialing':'Condicional · credentialing de pagadores',auto:Boolean(employee.caqh),source:'https://www.caqh.org/solutions/caqh-provider-data'},
  {key:'payer-credentialing',title:isEn?'Payer credentialing and rosters':'Credentialing y rosters de pagadores',detail:isEn?'Approved participation, effective dates and roster linkage for each contracted plan and entity.':'Participación aprobada, fechas efectivas y enlace al roster para cada plan y entidad contratada.',required:isEn?'Required for each billed payer/entity':'Requerido por cada pagador/entidad facturada',auto:Boolean(employee.payerCredentialing),source:''},
  {key:'oig-leie',title:'OIG · LEIE screening',detail:isEn?'Document exclusion screening at onboarding and on the organization’s recurring monitoring cadence.':'Documenta la verificación de exclusiones al contratar y en la frecuencia recurrente de la organización.',required:isEn?'Required compliance control':'Control de cumplimiento requerido',auto:Boolean(employee.oigScreening),source:'https://oig.hhs.gov/exclusions/'},
  {key:'cme-ce-broker',title:'CME · CE Broker',detail:isEn?'Required continuing education recorded and ready before the Florida renewal window.':'Educación médica continua registrada y lista antes de la ventana de renovación de Florida.',required:isEn?'Required for renewal':'Requerido para renovación',auto:Boolean(employee.cmeComplete),source:'https://flboardofmedicine.gov/continuing-education-ce/'},
];
const clinicalStaffRequirements=(employee,isEn)=>[
  {key:'professional-credential',title:isEn?'Active professional credential':'Credencial profesional activa',detail:isEn?'Current license, registration or certification required for the assigned clinical role.':'Licencia, registro o certificación vigente requerida para la función clínica asignada.',required:isEn?'Role dependent':'Según la función',auto:Boolean(employee.licenseNumber||employee.license),source:'https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders'},
  {key:'oig-leie',title:'OIG · LEIE screening',detail:isEn?'Document the exclusion check at onboarding and the organization’s recurring cadence.':'Documenta la verificación de exclusiones al contratar y en la frecuencia recurrente de la organización.',required:isEn?'Required compliance control':'Control de cumplimiento requerido',auto:Boolean(employee.oigScreening),source:'https://oig.hhs.gov/exclusions/'},
  {key:'academy-role-training',title:isEn?'Required Academy training':'Capacitación requerida de Academy',detail:isEn?'Role-specific courses, assessments and certificates archived in this employee record.':'Cursos, evaluaciones y certificados por función archivados en este expediente.',required:isEn?'Required by role':'Requerido por función',auto:Number(employee.hrDossier?.academy?.record?.completedCourses||0)>0,source:''},
  {key:'bls-cpr',title:'BLS / CPR',detail:isEn?'Maintain current life-support certification when required by the assigned clinical duties.':'Mantén vigente la certificación de soporte vital cuando las funciones clínicas asignadas la requieran.',required:isEn?'Conditional · role and duties':'Condicional · función y responsabilidades',auto:(employee.sourceAttachments||[]).some(file=>/\b(bls|cpr)\b/i.test(file.filename||'')),source:''},
];

async function syncPackageTemplate(template) {
  if (template.serverId || !template.blob) return template;
  const response = await fetch('/api/hr/packages', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ clientId:template.id, filename:template.name, type:template.type, base64:await blobBase64(template.blob) }) });
  if (!response.ok) throw new Error('Package synchronization failed');
  const payload = await response.json();
  return { ...template, serverId:payload.package.id };
}

function EmployeePackageLibrary({ employees, lang, onRefresh }) {
  const isEn = lang === 'en';
  const eligibleEmployees = employees.filter(employee => employee.accessUserId || employee.recordId);
  const [templates, setTemplates] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [templateUrls, setTemplateUrls] = useState({});
  const [candidateName,setCandidateName]=useState('');
  const [candidateEmail,setCandidateEmail]=useState('');
  const [dueAt,setDueAt]=useState('');
  const [deliveryMethod,setDeliveryMethod]=useState('portal');
  const [subject,setSubject]=useState(isEn?'Employee Package · EM Group':'Employee Package · EM Group');
  const [note,setNote]=useState(isEn?'Human Resources has prepared your onboarding documents. Please complete and return them using the secure link.':'Recursos Humanos preparó tus documentos de onboarding. Complétalos y devuélvelos usando el enlace seguro.');
  const [workflows,setWorkflows]=useState([]);
  const [emailStatus,setEmailStatus]=useState({configured:false,provider:'Manual email draft'});
  const [docusignStatus,setDocusignStatus]=useState({connected:false,webhookReady:false,environment:'demo'});
  const [busy,setBusy]=useState(false);
  const [latestPortalUrl,setLatestPortalUrl]=useState('');
  const loadWorkflows=async()=>{const response=await fetch('/api/hr/package-workflows',{cache:'no-store'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Workflow loading failed');setWorkflows(payload.workflows||[]);setEmailStatus(payload.email||{});setDocusignStatus(payload.docusign||{})};
  useEffect(() => { packageStore('readonly', store => store.getAll()).then(async rows => {
    const synchronized = await Promise.all(rows.map(row => syncPackageTemplate(row).catch(() => row)));
    await Promise.all(synchronized.filter(row => row.serverId).map(row => packageStore('readwrite', store => store.put(row))));
    const remoteResponse = await fetch('/api/hr/packages').catch(() => null);
    const remotePayload = remoteResponse?.ok ? await remoteResponse.json() : { packages:[] };
    const known = new Set(synchronized.map(row => row.serverId).filter(Boolean));
    const remoteOnly = (remotePayload.packages || []).filter(row => !known.has(row.id)).map(row => ({ id:`server-${row.id}`, serverId:row.id, name:row.filename, type:row.type, size:row.size, updatedAt:row.createdAt }));
    setTemplates([...synchronized, ...remoteOnly].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));await loadWorkflows();
  }).catch(() => setError(isEn ? 'This browser could not open the package library.' : 'Este navegador no pudo abrir la biblioteca de packages.')); }, [isEn]);
  useEffect(() => {
    const next = Object.fromEntries(templates.filter(template => template.blob).map(template => [template.id, URL.createObjectURL(template.blob)]));
    setTemplateUrls(next);
    return () => Object.values(next).forEach(url => URL.revokeObjectURL(url));
  }, [templates]);
  const upload = async event => {
    const incoming = [...event.target.files];
    if (!incoming.length) return;
    const rows = incoming.map(file => ({ id: `${Date.now()}-${crypto.randomUUID()}`, name: file.name, type: file.type, size: file.size, updatedAt: new Date().toISOString(), blob: file }));
    try {
      const synchronized = await Promise.all(rows.map(row => syncPackageTemplate(row).catch(() => row)));
      await Promise.all(synchronized.map(row => packageStore('readwrite', store => store.put(row))));
      setTemplates(current => [...synchronized, ...current]);
      setSelectedFiles(current => [...new Set([...current, ...synchronized.map(row => row.id)])]);
      setError('');
    } catch { setError(isEn ? 'The files could not be saved in this browser.' : 'No se pudieron guardar los archivos en este navegador.'); }
    event.target.value = '';
  };
  const removeTemplate = async template => {
    if (template.serverId) await fetch(`/api/hr/packages/${encodeURIComponent(template.serverId)}`, { method:'DELETE' }).catch(() => null);
    await packageStore('readwrite', store => store.delete(template.id));
    setTemplates(current => current.filter(item => item.id !== template.id));
    setSelectedFiles(current => current.filter(id => id !== template.id));
  };
  const sendPackage = async event => {
    event.preventDefault();
    const files = templates.filter(template => selectedFiles.includes(template.id));
    if (!candidateName.trim() || !candidateEmail.trim() || !files.length) { setError(isEn ? 'Enter the future employee name and email, then choose at least one blank document.' : 'Escribe el nombre y correo del futuro empleado y elige al menos un documento en blanco.'); return; }
    if (files.some(file => !file.serverId)) { setError(isEn ? 'Wait until every selected document is synchronized with the protected server.' : 'Espera a que todos los documentos seleccionados se sincronicen con el servidor protegido.'); return; }
    setBusy(true);setMessage('');setError('');setLatestPortalUrl('');
    try {
      const response=await fetch('/api/hr/package-workflows',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({candidateName:candidateName.trim(),candidateEmail:candidateEmail.trim(),packageIds:files.map(file=>file.serverId),deliveryMethod,dueAt,subject,message:note})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Employee Package delivery failed');
      if(payload.portalUrl){setLatestPortalUrl(payload.portalUrl);if(!payload.delivery?.delivered){const body=`${note}\n\n${isEn?'Open, complete and return your secure Employee Package here:':'Abre, completa y devuelve tu Employee Package seguro aquí:'}\n${payload.portalUrl}`;window.location.href=`mailto:${encodeURIComponent(candidateEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}}
      setMessage(deliveryMethod==='docusign'?(isEn?'DocuSign draft created and linked to the onboarding inbox. Open DocuSign, place the required fields and send it.':'Borrador de DocuSign creado y vinculado a la bandeja de onboarding. Abre DocuSign, coloca los campos requeridos y envíalo.'):(payload.delivery?.delivered?(isEn?'Secure Employee Package sent successfully.':'Employee Package seguro enviado correctamente.'):(isEn?'Secure package created. Your email application opened with the personal return link.':'Package seguro creado. Tu aplicación de correo abrió con el enlace personal de devolución.')));
      setCandidateName('');setCandidateEmail('');setDueAt('');setSelectedFiles([]);await loadWorkflows();
    } catch(requestError){setError(requestError.message|| (isEn?'The package could not be sent.':'No se pudo enviar el package.'))}finally{setBusy(false)}
  };
  const copyLatest=async()=>{if(!latestPortalUrl)return;await navigator.clipboard.writeText(latestPortalUrl);setMessage(isEn?'Secure link copied.':'Enlace seguro copiado.')};
  const assignWorkflow=async(workflow,employeeKey)=>{if(!employeeKey){setError(isEn?'Select the employee record that owns this returned package.':'Selecciona el expediente al que pertenece este package devuelto.');return}setBusy(true);setError('');setMessage('');try{const response=await fetch(`/api/hr/package-workflows/${encodeURIComponent(workflow.id)}/assign`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({employeeKey})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Assignment failed');setMessage(isEn?'The complete package was transferred to the selected employee record.':'El package completo fue transferido al expediente seleccionado.');await Promise.all([loadWorkflows(),onRefresh?.()])}catch(assignError){setError(assignError.message)}finally{setBusy(false)}};
  const awaitingAssignment=workflows.filter(workflow=>workflow.returns.some(item=>item.status!=='assigned'));
  const docusignReady=docusignStatus.connected&&docusignStatus.webhookReady;
  return <div className="hr-package-workspace">
    <section className="hr-package-master">
      <header><span><FileCheck2/></span><div><small>MASTER EMPLOYEE PACKAGE</small><h2>{isEn ? 'Blank package documents' : 'Employee Package en blanco'}</h2><p>{isEn ? 'Upload the master forms employees must complete and sign.' : 'Carga los formularios maestros que los empleados deben completar y firmar.'}</p></div><label><Upload/>{isEn ? 'Upload files' : 'Subir archivos'}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={upload}/></label></header>
      {templates.length ? <div className="hr-master-files">{templates.map(template => { const href=template.serverId ? `/api/hr/packages/${encodeURIComponent(template.serverId)}/file` : templateUrls[template.id] || '#'; return <article key={template.id}><div className="hr-master-file-main"><label className="hr-master-check"><input aria-label={isEn ? `Select ${template.name}` : `Seleccionar ${template.name}`} type="checkbox" checked={selectedFiles.includes(template.id)} onChange={event => setSelectedFiles(current => event.target.checked ? [...current, template.id] : current.filter(id => id !== template.id))}/></label><a className="hr-master-file-link" href={href} target="_blank" rel="noreferrer" title={isEn ? `Open ${template.name}` : `Abrir ${template.name}`}><span className="hr-file-icon"><FileText/></span><div><strong>{template.name}</strong><small>{Math.max(1, Math.round(template.size / 1024))} KB · {new Date(template.updatedAt).toLocaleDateString(isEn ? 'en-US' : 'es-US')}</small></div><Link2/></a></div><a href={href} download={template.name}>{isEn ? 'Download' : 'Descargar'}</a><button className="delete" onClick={() => removeTemplate(template)} aria-label={isEn ? `Delete ${template.name}` : `Eliminar ${template.name}`}><Trash2/></button></article>; })}</div> : <div className="hr-package-upload-empty"><Upload/><strong>{isEn ? 'Upload the first blank Employee Package' : 'Sube el primer Employee Package en blanco'}</strong><p>{isEn ? 'PDF and Office documents are stored in this browser until a protected document service is connected.' : 'Los archivos PDF y Office se guardan en este navegador hasta conectar un servicio documental protegido.'}</p></div>}
    </section>
    <form className="hr-package-email hr-package-send" onSubmit={sendPackage}>
      <header><span><Send/></span><div><small>{isEn ? 'FUTURE EMPLOYEE DELIVERY' : 'ENVÍO AL FUTURO EMPLEADO'}</small><h2>{isEn ? 'Send without creating the employee record first' : 'Enviar sin crear primero el expediente'}</h2><p>{isEn ? 'The completed package returns to the onboarding inbox. Human Resources assigns it to the correct employee afterward.' : 'El package completado regresa a la bandeja de onboarding. Recursos Humanos lo asigna después al empleado correcto.'}</p></div></header>
      <label>{isEn ? 'Future employee name' : 'Nombre del futuro empleado'}<input required value={candidateName} onChange={event=>setCandidateName(event.target.value)} placeholder={isEn?'Full legal name':'Nombre legal completo'}/></label>
      <label>{isEn ? 'Recipient email' : 'Correo del destinatario'}<input type="email" required value={candidateEmail} onChange={event => setCandidateEmail(event.target.value)} placeholder="candidate@email.com"/></label>
      <label>{isEn?'Return deadline':'Fecha límite de devolución'}<input type="date" value={dueAt} onChange={event=>setDueAt(event.target.value)}/></label>
      <label>{isEn?'Delivery and completion method':'Método de envío y completado'}<select value={deliveryMethod} onChange={event=>setDeliveryMethod(event.target.value)}><option value="portal">{isEn?'Secure portal link':'Enlace de portal seguro'} · {emailStatus.provider}</option><option value="docusign" disabled={!docusignReady}>DocuSign eSignature {!docusignReady?(isEn?'· configuration required':'· requiere configuración'):''}</option></select></label>
      <label>{isEn?'Email subject':'Asunto del correo'}<input value={subject} onChange={event=>setSubject(event.target.value)} maxLength={140} required/></label>
      <label>{isEn?'Instructions':'Instrucciones'}<textarea value={note} onChange={event=>setNote(event.target.value)} rows={4}/></label>
      <div className="hr-email-selection"><span>{isEn ? 'Documents selected' : 'Documentos seleccionados'}</span><strong>{selectedFiles.length}</strong></div>
      <p className="hr-email-note"><ShieldCheck/>{deliveryMethod==='docusign'?(isEn?'The completed DocuSign PDF returns automatically to this onboarding inbox.':'El PDF completado en DocuSign regresa automáticamente a esta bandeja de onboarding.'):(emailStatus.configured?(isEn?'The app sends a personal secure link. The candidate downloads and returns documents through that same page.':'La app envía un enlace seguro personal. El candidato descarga y devuelve los documentos desde esa misma página.'):(isEn?'The secure portal is ready. Until server email is configured, the app opens a manual email draft containing the personal link.':'El portal seguro está listo. Hasta configurar el correo del servidor, la app abre un borrador manual con el enlace personal.'))}</p>
      {error && <p className="hr-package-error">{error}</p>}{message && <p className="hr-package-success"><Check/>{message}</p>}
      {latestPortalUrl&&<div className="hr-package-link"><input readOnly value={latestPortalUrl}/><button type="button" onClick={copyLatest}><ClipboardCopy/>{isEn?'Copy link':'Copiar enlace'}</button></div>}
      <button className="hr-open-email" type="submit" disabled={busy}><Send/>{busy?(isEn?'Preparing…':'Preparando…'):deliveryMethod==='docusign'?(isEn?'Create tracked DocuSign draft':'Crear borrador DocuSign rastreado'):(emailStatus.configured?(isEn?'Send secure package':'Enviar package seguro'):(isEn?'Create link and open email':'Crear enlace y abrir correo'))}</button>
    </form>
    <section className="hr-package-inbox">
      <header><span><Inbox/></span><div><small>{isEn?'ONBOARDING INBOX':'BANDEJA DE ONBOARDING'}</small><h2>{isEn?'Returned packages awaiting assignment':'Packages devueltos pendientes de asignación'}</h2><p>{isEn?'Review the returned files, select the matching employee and transfer the complete package into Employees.':'Revisa los archivos devueltos, selecciona el empleado correcto y transfiere el package completo a Empleados.'}</p></div><b>{awaitingAssignment.length}</b></header>
      {awaitingAssignment.length?<div className="hr-package-inbox-list">{awaitingAssignment.map(workflow=><article key={workflow.id}><div className="hr-package-inbox-person"><span>{String(workflow.candidateName||'').split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</span><div><strong>{workflow.candidateName}</strong><small>{workflow.candidateEmail} · {workflow.deliveryMethod}</small></div><b>{isEn?'Received':'Recibido'}</b></div><div className="hr-package-inbox-files">{workflow.returns.map(document=><a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><FileText/><span><strong>{document.filename}</strong><small>{new Date(document.receivedAt).toLocaleString(isEn?'en-US':'es-US')}</small></span><ExternalLink/></a>)}</div><form className="hr-package-assign" onSubmit={event=>{event.preventDefault();const employeeKey=event.currentTarget.querySelector('select[name="employeeKey"]')?.value||'';assignWorkflow(workflow,employeeKey)}}><label>{isEn?'Assign package to employee':'Asignar package al empleado'}<select name="employeeKey" defaultValue=""><option value="">{isEn?'Select employee record':'Seleccionar expediente'}</option>{eligibleEmployees.map(employee=>{const key=employee.accessUserId||employee.recordId;return <option key={key} value={key}>{employee.name} · {employee.role||employee.entity}</option>})}</select></label><button type="submit" disabled={busy}><ArrowRight/>{isEn?'Transfer to Employees':'Transferir a Empleados'}</button></form></article>)}</div>:<div className="hr-package-inbox-empty"><Inbox/><strong>{isEn?'No returned package is waiting':'No hay packages devueltos pendientes'}</strong><p>{isEn?'When a future employee returns files or finishes DocuSign, the package will appear here.':'Cuando un futuro empleado devuelva archivos o complete DocuSign, el package aparecerá aquí.'}</p></div>}
    </section>
    <section className="hr-package-tracker">
      <header><span><Clock3/></span><div><small>{isEn?'DELIVERY TRACKER':'RASTREO DE ENVÍOS'}</small><h2>{isEn?'Every Employee Package workflow':'Todos los flujos de Employee Package'}</h2></div><b>{workflows.length}</b></header>
      {workflows.length?<div>{workflows.map(workflow=><article key={workflow.id}><div><strong>{workflow.candidateName}</strong><small>{workflow.candidateEmail}</small></div><span>{workflow.packages.length} {isEn?'documents':'documentos'}</span><span>{workflow.deliveryMethod==='docusign'?'DocuSign':(emailStatus.configured?'Secure email':'Secure link')}</span><b className={workflow.status}>{workflow.status}</b><time>{new Date(workflow.createdAt).toLocaleDateString(isEn?'en-US':'es-US')}</time></article>)}</div>:<p className="hr-package-inbox-empty">{isEn?'No package has been sent yet.':'Todavía no se ha enviado ningún package.'}</p>}
    </section>
  </div>;
}

function DocuSignWorkspace({ employees, lang }) {
  const isEn = lang === 'en';
  const eligibleEmployees = employees.filter(employee => employee.accessUserId);
  const [connection, setConnection] = useState({ connected:false, environment:'demo' });
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [subject, setSubject] = useState(isEn ? 'Employee Package for signature' : 'Employee Package para firma');
  const [note, setNote] = useState(isEn ? 'Please review and sign the attached Human Resources documents.' : 'Por favor revisa y firma los documentos adjuntos de Recursos Humanos.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [envelope, setEnvelope] = useState(null);

  const loadDocuments = async () => {
    const response = await fetch('/api/hr/packages');
    const payload = response.ok ? await response.json() : { packages:[] };
    setDocuments(payload.packages || []);
  };
  useEffect(() => {
    Promise.all([
      fetch('/api/integrations/docusign/status').then(response => response.ok ? response.json() : null),
      fetch('/api/hr/packages').then(response => response.ok ? response.json() : { packages:[] }),
    ]).then(([status, packagePayload]) => {
      if (status) setConnection(status);
      setDocuments(packagePayload.packages || []);
    }).catch(() => setError(isEn ? 'The DocuSign workspace could not be loaded.' : 'No se pudo cargar el espacio de DocuSign.'));
  }, [isEn]);

  const chooseEmployee = event => {
    const id = event.target.value;
    const employee = eligibleEmployees.find(item => item.accessUserId === id);
    setEmployeeId(id);
    setSignerEmail(employee?.email || '');
    setEnvelope(null);
    setError('');
  };
  const upload = async event => {
    const files = [...event.target.files];
    if (!files.length) return;
    setBusy(true); setError('');
    try {
      await Promise.all(files.map(async file => {
        const response = await fetch('/api/hr/packages', {
          method:'POST', headers:{'content-type':'application/json'},
          body:JSON.stringify({ clientId:`docusign-${Date.now()}-${crypto.randomUUID()}`, filename:file.name, type:file.type || 'application/octet-stream', base64:await blobBase64(file) }),
        });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Upload failed');
      }));
      await loadDocuments();
    } catch (uploadError) {
      setError(uploadError.message || (isEn ? 'The document could not be uploaded.' : 'No se pudo subir el documento.'));
    } finally { setBusy(false); event.target.value=''; }
  };
  const createEnvelope = async event => {
    event.preventDefault();
    const employee = eligibleEmployees.find(item => item.accessUserId === employeeId);
    if (!employee || !signerEmail.trim() || !selectedIds.length) {
      setError(isEn ? 'Select an employee, recipient email and at least one document.' : 'Selecciona un empleado, el correo del destinatario y al menos un documento.');
      return;
    }
    setBusy(true); setError(''); setEnvelope(null);
    try {
      const response = await fetch('/api/integrations/docusign/envelopes', {
        method:'POST', headers:{'content-type':'application/json'},
        body:JSON.stringify({ packageIds:selectedIds, employeeUserId:employee.accessUserId, signerName:employee.name, signerEmail:signerEmail.trim(), emailSubject:subject, emailBlurb:note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'DocuSign request failed');
      setEnvelope(payload.envelope);
    } catch (requestError) {
      setError(requestError.message || (isEn ? 'The envelope could not be created.' : 'No se pudo crear el sobre.'));
    } finally { setBusy(false); }
  };
  const docusignUrl = connection.environment === 'production' ? 'https://app.docusign.com/' : 'https://appdemo.docusign.com/';
  const workflowReady=connection.connected&&connection.webhookReady;
  return <div className="hr-docusign-workspace">
    <section className="hr-docusign-hero">
      <div className="hr-docusign-mark"><PenTool/></div>
      <div><small>DOCUSIGN ESIGNATURE</small><h2>{isEn ? 'Electronic signature envelopes' : 'Sobres de firma electrónica'}</h2><p>{isEn ? 'Send Employee Package documents to DocuSign as a draft, place the required signature fields and deliver them to the employee.' : 'Envía los documentos del Employee Package a DocuSign como borrador, coloca los campos de firma requeridos y entrégalos al empleado.'}</p></div>
      <span className={workflowReady ? 'connected' : 'pending'}>{workflowReady ? <Check/> : <CircleAlert/>}{workflowReady ? (isEn ? 'Send + automatic return ready' : 'Envío + retorno automático listo') : connection.connected ? (isEn ? 'Return webhook required' : 'Falta webhook de retorno') : (isEn ? 'Connection required' : 'Conexión requerida')}</span>
    </section>
    <div className="hr-docusign-grid">
      <section className="hr-docusign-documents">
        <header><div><small>{isEn ? 'ENVELOPE DOCUMENTS' : 'DOCUMENTOS DEL SOBRE'}</small><h3>{isEn ? 'Choose what the employee must sign' : 'Elige lo que debe firmar el empleado'}</h3><p>{isEn ? 'Documents come from the protected Employee Package library.' : 'Los documentos provienen de la biblioteca protegida de Employee Package.'}</p></div><label><Upload/>{busy ? (isEn ? 'Working…' : 'Procesando…') : (isEn ? 'Upload document' : 'Subir documento')}<input type="file" multiple accept=".pdf,.doc,.docx" onChange={upload} disabled={busy}/></label></header>
        {documents.length ? <div className="hr-docusign-file-list">{documents.map(document => <label key={document.id} className={selectedIds.includes(document.id) ? 'selected' : ''}><input type="checkbox" checked={selectedIds.includes(document.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, document.id] : current.filter(id => id !== document.id))}/><span><FileText/></span><div><strong>{document.filename}</strong><small>{Math.max(1, Math.round(document.size / 1024))} KB · {new Date(document.createdAt).toLocaleDateString(isEn ? 'en-US' : 'es-US')}</small></div><a href={`/api/hr/packages/${encodeURIComponent(document.id)}/file`} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}><ExternalLink/>{isEn ? 'Open' : 'Abrir'}</a></label>)}</div> : <div className="hr-docusign-empty"><Upload/><strong>{isEn ? 'Upload the first document for DocuSign' : 'Sube el primer documento para DocuSign'}</strong><p>{isEn ? 'PDF and Word documents can be added here before the envelope is created.' : 'Puedes añadir documentos PDF y Word antes de crear el sobre.'}</p></div>}
      </section>
      <form className="hr-docusign-envelope" onSubmit={createEnvelope}>
        <header><span><Send/></span><div><small>{isEn ? 'NEW ENVELOPE' : 'NUEVO SOBRE'}</small><h3>{isEn ? 'Prepare for signature' : 'Preparar para firma'}</h3></div></header>
        <label>{isEn ? 'Employee / signer' : 'Empleado / firmante'}<select value={employeeId} onChange={chooseEmployee} required><option value="">{isEn ? 'Select an employee with access' : 'Selecciona un empleado con acceso'}</option>{eligibleEmployees.map(employee => <option key={employee.accessUserId} value={employee.accessUserId}>{employee.name} · {employee.role}</option>)}</select></label>
        <label>{isEn ? 'Signer email' : 'Correo del firmante'}<input type="email" value={signerEmail} onChange={event => setSignerEmail(event.target.value)} placeholder="employee@company.com" required/></label>
        <label>{isEn ? 'Email subject' : 'Asunto del correo'}<input value={subject} onChange={event => setSubject(event.target.value)} maxLength={100} required/></label>
        <label>{isEn ? 'Message' : 'Mensaje'}<textarea value={note} onChange={event => setNote(event.target.value)} rows={4}/></label>
        <div className="hr-docusign-count"><FileCheck2/><span>{isEn ? 'Selected documents' : 'Documentos seleccionados'}</span><strong>{selectedIds.length}</strong></div>
        {!workflowReady && <div className="hr-docusign-warning"><CircleAlert/><p><strong>{isEn ? 'Complete the secure DocuSign workflow before creating an envelope' : 'Completa el flujo seguro de DocuSign antes de crear un sobre'}</strong><span>{connection.connected?(isEn?'Configure the DocuSign Connect callback URL and HMAC secret so every completed PDF returns to the correct employee record.':'Configura la URL de callback de DocuSign Connect y el secreto HMAC para que cada PDF completado regrese al expediente correcto.'):(isEn?'The server needs the DocuSign account ID, OAuth access token, Connect callback URL and HMAC secret.':'El servidor necesita el account ID, access token OAuth, URL de callback de Connect y secreto HMAC de DocuSign.')}</span></p></div>}
        {error && <p className="hr-package-error">{error}</p>}
        {envelope && <div className="hr-docusign-success"><Check/><div><strong>{isEn ? 'Draft linked to the employee record' : 'Borrador vinculado al expediente del empleado'}</strong><span>{envelope.envelopeId}</span><small>{isEn ? 'Place the signature fields and send it. When DocuSign reports completion, the signed PDF will be archived automatically.' : 'Coloca los campos de firma y envíalo. Cuando DocuSign reporte la finalización, el PDF firmado se archivará automáticamente.'}</small></div></div>}
        <button type="submit" disabled={!workflowReady || busy}><PenTool/>{busy ? (isEn ? 'Creating envelope…' : 'Creando sobre…') : (isEn ? 'Create tracked DocuSign draft' : 'Crear borrador DocuSign rastreado')}</button>
        <a className="hr-open-docusign" href={docusignUrl} target="_blank" rel="noreferrer"><ExternalLink/>{isEn ? 'Open DocuSign' : 'Abrir DocuSign'}</a>
        <p className="hr-docusign-flow"><Clock3/>{isEn ? 'Draft first: position signature fields in DocuSign, review the recipient, then send.' : 'Primero borrador: coloca los campos de firma en DocuSign, revisa el destinatario y luego envía.'}</p>
      </form>
    </div>
  </div>;
}

function AcademyDossier({academy,lang}){
  const isEn=lang==='en';const record=academy?.record||{};const answers=(record.events||[]).filter(event=>event.type==='answer').slice().reverse();const certificates=record.certificates||[];
  return <section className="hr-academy-dossier" data-search-entry><header><BadgeCheck/><div><span>EASTERN MEDICAL ACADEMY</span><h2>{isEn?'Learning record and certifications':'Expediente de aprendizaje y certificaciones'}</h2><p>{isEn?'Results are linked automatically to this employee identity.':'Los resultados se enlazan automáticamente con la identidad de este empleado.'}</p></div></header><div className="hr-academy-metrics"><div><strong>{Number(record.completedCourses||0)}</strong><span>{isEn?'Courses completed':'Cursos completados'}</span></div><div><strong>{Number(record.completedLessons||0)}</strong><span>{isEn?'Lessons completed':'Lecciones completadas'}</span></div><div><strong>{Number(record.answerCount||0)}</strong><span>{isEn?'Answers recorded':'Respuestas registradas'}</span></div><div><strong>{certificates.length}</strong><span>{isEn?'Certificates':'Certificados'}</span></div></div>{certificates.length?<div className="hr-certificate-list">{certificates.map(certificate=><article key={certificate.certificateId}><BadgeCheck/><div><strong>{certificate.courseTitle||certificate.courseId}</strong><span>{certificate.certificateId}</span><small>{new Date(certificate.completedAt||certificate.createdAt).toLocaleDateString(isEn?'en-US':'es-US')}</small></div></article>)}</div>:<p className="hr-dossier-empty"><CircleAlert/>{isEn?'No Academy certificate has been issued yet.':'Todavía no se ha emitido ningún certificado de Academy.'}</p>}{answers.length>0&&<details className="hr-answer-history"><summary>{isEn?'View recorded questions and answers':'Ver preguntas y respuestas registradas'}<ChevronDown/></summary><div>{answers.map(answer=><article key={answer.id}><div><strong>{answer.question||answer.lessonTitle||answer.courseTitle}</strong><span>{answer.courseTitle} · {answer.lessonTitle}</span></div><b className={answer.correct?'correct':'incorrect'}>{answer.selectedAnswer||String(answer.selectedIndex??'—')}</b></article>)}</div></details>}</section>;
}

function EmployeeRequiredRecords({employee,lang,canManage,onRefresh}){
  const isEn=lang==='en';const dossier=employee.hrDossier||{};const saved=Object.fromEntries((dossier.compliance||[]).map(item=>[item.key,item]));const documents=dossier.documents||[];const [busyKey,setBusyKey]=useState('');
  const eVerifyDeadline=()=>{const start=employee.hireDate||employee.startDate;if(!start)return '';const date=new Date(`${start}T12:00:00`);if(Number.isNaN(date.valueOf()))return '';let added=0;while(added<3){date.setDate(date.getDate()+1);if(date.getDay()!==0&&date.getDay()!==6)added+=1}return date.toISOString().slice(0,10)};
  const sourceRecords={
    'background-screening':dossier.aca?.background||[],
    'aca-roster':dossier.aca?.roster||[],
    'e-verify':[],
  };
  const definitions=[
    {key:'background-screening',icon:ShieldCheck,title:'Background Screening',description:isEn?'Florida screening status, verification date, expiration and supporting evidence.':'Estatus del screening de Florida, fecha de verificación, vencimiento y evidencia.',source:'https://flhealthsource.gov/background-screening/'},
    {key:'aca-roster',icon:Users,title:'ACA Roster',description:isEn?'Employee roster inclusion, assigned facility, status and latest authorized verification.':'Inclusión del empleado en el roster, sede asignada, estatus y última verificación autorizada.',source:''},
    {key:'e-verify',icon:BadgeCheck,title:'E-Verify',description:isEn?'Employment-authorization case after Form I-9, including case number, result and closure evidence.':'Caso de autorización laboral posterior al Form I-9, incluyendo número de caso, resultado y evidencia de cierre.',source:'https://www.e-verify.gov/node/2768'},
  ];
  const update=async(definition,status,deadline)=>{if(!employee.accessUserId)return;setBusyKey(definition.key);try{const response=await fetch(`/api/hr/employees/${encodeURIComponent(employee.accessUserId)}/compliance/${encodeURIComponent(definition.key)}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({status,deadline})});if(!response.ok)throw new Error();await onRefresh?.()}finally{setBusyKey('')}};
  return <section className="hr-required-records" data-search-entry><header><FileCheck2/><div><span>{isEn?'MANDATORY EMPLOYEE CONTROLS':'CONTROLES OBLIGATORIOS DEL EMPLEADO'}</span><h2>{isEn?'Background, ACA roster and E-Verify':'Background Screening, ACA Roster y E-Verify'}</h2><p>{isEn?'These controls remain visible in every employee record and retain their own evidence and deadline.':'Estos controles permanecen visibles en cada expediente y conservan su propia evidencia y deadline.'}</p></div></header><div className="hr-required-record-grid">{definitions.map(definition=>{const records=sourceRecords[definition.key];const evidence=documents.filter(document=>document.category===definition.key);const stored=saved[definition.key];const sourceReady=records.some(record=>/active|eligible|approved|clear|complete|current|authorized/i.test(record.status||''));const status=stored?.status||(sourceReady?'completed':records.length?'in-progress':'pending');const deadline=stored?.deadline||records.find(record=>record.expiresOn)?.expiresOn||(definition.key==='e-verify'?eVerifyDeadline():suggestedDeadline(employee,30));const Icon=definition.icon;return <article key={definition.key} className={status}><div className="hr-required-record-heading"><span><Icon/></span><div><h3>{definition.title}</h3><p>{definition.description}</p></div><b>{status==='completed'?(isEn?'Completed':'Completado'):status==='in-progress'?(isEn?'In progress':'En progreso'):(isEn?'Pending':'Pendiente')}</b></div><div className="hr-required-record-facts"><span>{isEn?'Matched records':'Registros vinculados'}<strong>{records.length}</strong></span><span>{isEn?'Evidence files':'Archivos de evidencia'}<strong>{evidence.length}</strong></span><span>Deadline<strong>{deadline||(isEn?'Hire date required':'Requiere fecha de contratación')}</strong></span></div>{records.slice(0,2).map(record=><div className="hr-required-source-record" key={record.id}><strong>{record.subject}</strong><span>{record.facility|| (isEn?'Facility pending':'Sede pendiente')} · {record.status|| (isEn?'Status pending':'Estatus pendiente')}</span><small>{record.lastVerifiedAt||record.syncedAt}</small></div>)}{evidence.length>0&&<div className="hr-required-evidence">{evidence.map(document=><a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><FileText/>{document.filename}<ExternalLink/></a>)}</div>}{canManage&&employee.accessUserId&&<div className="hr-required-controls"><select value={status} disabled={busyKey===definition.key} onChange={event=>update(definition,event.target.value,deadline)}><option value="pending">{isEn?'Pending':'Pendiente'}</option><option value="in-progress">{isEn?'In progress':'En progreso'}</option><option value="completed">{isEn?'Completed':'Completado'}</option><option value="not-applicable">{isEn?'Not applicable':'No aplica'}</option></select><input aria-label={`Deadline ${definition.title}`} type="date" defaultValue={deadline} onBlur={event=>event.target.value&&event.target.value!==deadline&&update(definition,status,event.target.value)}/></div>}{definition.source&&<a className="hr-required-official" href={definition.source} target="_blank" rel="noreferrer">{isEn?'Official guidance':'Guía oficial'}<ExternalLink/></a>}</article>})}</div></section>;
}

function EmployeeWorkflowDocuments({employee,lang,canManage,selfService,onRefresh}){
  const isEn=lang==='en';const dossier=employee.hrDossier||{};const requests=dossier.requests||[];const documents=dossier.documents||[];const [title,setTitle]=useState('');const [category,setCategory]=useState('signed-document');const [dueAt,setDueAt]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const createRequest=async event=>{event.preventDefault();if(!employee.accessUserId||!title.trim())return;setBusy(true);setMessage('');try{const response=await fetch(`/api/hr/employees/${encodeURIComponent(employee.accessUserId)}/document-requests`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title,category,dueAt})});if(!response.ok)throw new Error((await response.json()).error);setTitle('');setDueAt('');setMessage(isEn?'Document request created.':'Solicitud de documento creada.');await onRefresh?.()}catch(error){setMessage(error.message)}finally{setBusy(false)}};
  const upload=async(event,request=null)=>{const file=event.target.files?.[0];if(!file)return;setBusy(true);setMessage('');try{const response=await fetch('/api/hr/me/documents',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:request?.id||'',category:request?.category||category,filename:file.name,type:file.type,base64:await blobBase64(file)})});if(!response.ok)throw new Error((await response.json()).error);setMessage(isEn?'Document received and archived in your Human Resources record.':'Documento recibido y archivado en tu expediente de Recursos Humanos.');await onRefresh?.()}catch(error){setMessage(error.message)}finally{setBusy(false);event.target.value=''}};
  return <section className="hr-workflow-documents" data-search-entry><header><FileCheck2/><div><span>{isEn?'DOCUMENT WORKFLOW':'FLUJO DOCUMENTAL'}</span><h2>{isEn?'Requested and returned documents':'Documentos solicitados y devueltos'}</h2><p>{isEn?'Every returned file is archived under this employee identity.':'Cada archivo devuelto queda archivado bajo la identidad de este empleado.'}</p></div></header>{canManage&&employee.accessUserId&&<form className="hr-request-form" onSubmit={createRequest}><label>{isEn?'Document needed':'Documento requerido'}<input value={title} onChange={event=>setTitle(event.target.value)} placeholder={isEn?'Example: Updated medical license':'Ejemplo: Licencia médica actualizada'} required/></label><label>{isEn?'Category':'Categoría'}<select value={category} onChange={event=>setCategory(event.target.value)}><option value="employee-package">Employee Package</option><option value="certification">{isEn?'Certification':'Certificación'}</option><option value="background-screening">Background Screening</option><option value="aca-roster">ACA Roster</option><option value="e-verify">E-Verify</option><option value="medical-exam">{isEn?'Medical exam':'Examen médico'}</option><option value="signed-document">{isEn?'Signed document':'Documento firmado'}</option><option value="credential">{isEn?'Credential / license':'Credencial / licencia'}</option><option value="course">{isEn?'Course evidence':'Evidencia de curso'}</option><option value="other">{isEn?'Other':'Otro'}</option></select></label><label>Deadline<input type="date" value={dueAt} onChange={event=>setDueAt(event.target.value)}/></label><button disabled={busy}><Send/>{isEn?'Request':'Solicitar'}</button></form>}{requests.length?<div className="hr-request-list">{requests.map(request=><article key={request.id}><span className={`hr-request-status ${request.status}`}>{request.status==='received'?<Check/>:<Clock3/>}{request.status}</span><div><strong>{request.title}</strong><small>{request.category}{request.deliveryMethod?` · ${request.deliveryMethod}`:''}{request.dueAt?` · Deadline ${request.dueAt}`:''}</small></div>{selfService&&request.packageId&&<a className="hr-assigned-document" href={`/api/hr/me/document-requests/${encodeURIComponent(request.id)}/template`} target="_blank" rel="noreferrer"><FileText/>{isEn?'Open assigned document':'Abrir documento asignado'}</a>}{selfService&&request.status!=='received'&&<label><Upload/>{isEn?'Return completed document':'Devolver documento completado'}<input type="file" onChange={event=>upload(event,request)} disabled={busy}/></label>}</article>)}</div>:<p className="hr-dossier-empty"><CircleAlert/>{isEn?'No documents have been requested yet.':'Todavía no se han solicitado documentos.'}</p>}{selfService&&<div className="hr-unsolicited-upload"><div><strong>{isEn?'Add another document to my record':'Añadir otro documento a mi expediente'}</strong><span>{isEn?'Certifications, licenses, medical exams or signed forms.':'Certificaciones, licencias, exámenes médicos o formularios firmados.'}</span></div><label><Upload/>{isEn?'Choose file':'Elegir archivo'}<input type="file" onChange={event=>upload(event)} disabled={busy}/></label></div>}{documents.length>0&&<div className="hr-returned-list">{documents.map(document=><a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer"><FileText/><div><strong>{document.filename}</strong><span>{document.category} · {new Date(document.createdAt).toLocaleDateString(isEn?'en-US':'es-US')}</span></div><ExternalLink/></a>)}</div>}{message&&<p className="hr-document-message">{message}</p>}</section>;
}

function ClinicalCompliance({employee,lang,canManage,onRefresh}){
  const isEn=lang==='en';const doctor=isDoctorEmployee(employee);const saved=Object.fromEntries((employee.hrDossier?.compliance||[]).map(item=>[item.key,item]));const requirements=doctor?doctorRequirements(employee,isEn):clinicalStaffRequirements(employee,isEn);const [busyKey,setBusyKey]=useState('');
  const update=async(requirement,status,deadline)=>{if(!employee.accessUserId)return;setBusyKey(requirement.key);try{const response=await fetch(`/api/hr/employees/${encodeURIComponent(employee.accessUserId)}/compliance/${encodeURIComponent(requirement.key)}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({status,deadline})});if(!response.ok)throw new Error();await onRefresh?.()}finally{setBusyKey('')}};
  return <section className="hr-clinical-compliance" data-search-entry><header><ShieldCheck/><div><span>{isEn?'CLINICAL CREDENTIAL READINESS':'PREPARACIÓN DE CREDENCIALES CLÍNICAS'}</span><h2>{doctor?(isEn?'Physician requirements checklist':'Checklist de requisitos del médico'):(isEn?'Clinical personnel requirements checklist':'Checklist de requisitos del personal clínico')}</h2><p>{isEn?'“Conditional” means the requirement depends on duties, payer participation or services. Deadlines shown without a source date are internal follow-up deadlines.':'“Condicional” significa que depende de funciones, pagadores o servicios. Los deadlines sin fecha fuente son fechas internas de seguimiento.'}</p></div></header><div className="hr-compliance-list">{requirements.map(requirement=>{const stored=saved[requirement.key];const status=stored?.status||(requirement.auto?'completed':'pending');const deadline=stored?.deadline||suggestedDeadline(employee,requirement.key==='oig-leie'?30:45);return <article key={requirement.key} className={status}><span className="hr-compliance-check">{status==='completed'?<Check/>:<Clock3/>}</span><div><strong>{requirement.title}</strong><p>{requirement.detail}</p><small>{requirement.required}</small>{requirement.source&&<a href={requirement.source} target="_blank" rel="noreferrer">{isEn?'Official source':'Fuente oficial'}<ExternalLink/></a>}</div><aside><b>{status==='completed'?(isEn?'Completed':'Completado'):status==='not-applicable'?(isEn?'Not applicable':'No aplica'):status==='in-progress'?(isEn?'In progress':'En progreso'):(isEn?'Pending':'Pendiente')}</b><span>Deadline: {deadline}</span>{canManage&&employee.accessUserId&&<div><select value={status} disabled={busyKey===requirement.key} onChange={event=>update(requirement,event.target.value,deadline)}><option value="pending">{isEn?'Pending':'Pendiente'}</option><option value="in-progress">{isEn?'In progress':'En progreso'}</option><option value="completed">{isEn?'Completed':'Completado'}</option><option value="not-applicable">{isEn?'Not applicable':'No aplica'}</option></select><input aria-label={`Deadline ${requirement.title}`} type="date" defaultValue={deadline} onBlur={event=>event.target.value&&event.target.value!==deadline&&update(requirement,status,event.target.value)}/></div>}</aside></article>})}</div></section>;
}

function EmployeePhotoControl({employee,lang,canManage,selfService,onRefresh}){
  const isEn=lang==='en';const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const photo=(employee.hrDossier?.documents||[]).find(document=>document.category==='employee-photo');
  const upload=async event=>{const file=event.target.files?.[0];if(!file)return;setBusy(true);setMessage('');try{const target=selfService?'/api/hr/me/documents':`/api/hr/employee-records/${encodeURIComponent(employee.accessUserId||employee.recordId)}/documents`;const response=await fetch(target,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({filename:file.name,type:file.type||'image/jpeg',category:'employee-photo',base64:await blobBase64(file)})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Photo upload failed');setMessage(isEn?'Photo saved in this employee record.':'Foto guardada en este expediente.');await onRefresh?.()}catch(error){setMessage(error.message)}finally{setBusy(false);event.target.value=''}};
  return <section className="hr-photo-card"><header><Camera/><div><h3>{isEn?'Employee photo':'Foto del empleado'}</h3><p>{isEn?'Protected identity image stored in this record.':'Imagen protegida de identidad guardada en este expediente.'}</p></div></header><div className="hr-photo-preview">{photo?<img src={photo.fileUrl} alt={employee.name}/>:<span>{employee.initials||String(employee.name||'').split(/\s+/).slice(0,2).map(part=>part[0]).join('')}</span>}</div>{(canManage||selfService)&&<label className="hr-photo-upload"><Camera/>{busy?(isEn?'Saving…':'Guardando…'):(isEn?'Take or upload photo':'Tomar o subir foto')}<input type="file" accept="image/*" capture="user" onChange={upload} disabled={busy}/></label>}{message&&<small className="hr-photo-message">{message}</small>}</section>;
}

function EmployeeRecord({ employee, lang, sourceStatus, onBack, employmentStatus, onStatusChange, onClassificationChange, canManage=false, selfService=false, onDossierRefresh }) {
  const isEn = lang === 'en';
  const files = classifyFiles(employee);
  const completion = completeness(employee, files);
  const employeePhoto=(employee.hrDossier?.documents||[]).find(document=>document.category==='employee-photo');
  const pecosCompliance=(employee.hrDossier?.compliance||[]).find(item=>item.key==='pecos');
  const credentials = [
    ['Professional license', 'Licencia profesional', employee.licenseNumber || employee.license],
    ['NPI', 'NPI', employee.npi], ['DEA', 'DEA', employee.dea], ['CAQH', 'CAQH', employee.caqh],
    ['Medicare', 'Medicare', employee.medicare], ['Medicaid', 'Medicaid', employee.medicaid],
    ...(isClinicalEmployee(employee)?[['PECOS','PECOS',employee.pecos||(pecosCompliance?.status==='completed'?(isEn?'Completed':'Completado'):'')]]:[]),
  ];
  return <div className="hr-record-page">
    <div className="hr-record-top">{onBack&&<button onClick={onBack}><ArrowLeft/>{isEn ? 'Back to Human Resources' : 'Volver a Recursos Humanos'}</button>}<span><ShieldCheck/> {employee.source || 'Human Resources'}</span></div>
    <div className="hr-record-shell">
      <section className="hr-record-hero">
        <div className="hr-record-avatar">{employeePhoto?<img src={employeePhoto.fileUrl} alt={employee.name}/>:employee.initials || employee.name?.split(' ').map(part => part[0]).slice(0, 2).join('')}</div>
        <div className="hr-record-identity"><span>{isEn ? 'EMPLOYEE RECORD' : 'EXPEDIENTE DEL EMPLEADO'}</span><h1>{employee.name}</h1><p>{employee.role || (isEn ? 'Position pending' : 'Puesto pendiente')} · {employee.entity || (isEn ? 'Entity pending' : 'Entidad pendiente')}</p><div><b className={employmentStatus}>{employmentStatus === 'active' ? (isEn ? 'Active' : 'Activo') : (isEn ? 'Inactive' : 'Inactivo')}</b><span>{employee.workMode === 'onsite' ? (isEn ? 'On-site' : 'Presencial') : employee.workMode || (isEn ? 'Work mode pending' : 'Modalidad pendiente')}</span></div></div>
        <div className="hr-completion"><strong>{completion}%</strong><span>{isEn ? 'record complete' : 'expediente completo'}</span><div><i style={{ width: `${completion}%` }}/></div></div>
      </section>

      <div className="hr-record-layout">
        <main>
          <section className="hr-summary-card">
            <div><BriefcaseBusiness/><span>{isEn ? 'Position' : 'Posición'}</span><strong>{employee.role || (isEn ? 'Pending' : 'Pendiente')}</strong></div>
            <div><Building2/><span>{isEn ? 'Entity' : 'Entidad'}</span><strong>{employee.entity || (isEn ? 'Pending' : 'Pendiente')}</strong></div>
            <div><IdCard/><span>{isEn ? 'Record ID' : 'ID del expediente'}</span><strong>{employee.recordId || (isEn ? 'Pending' : 'Pendiente')}</strong></div>
          </section>
          <FileList title="Employee package" subtitle={isEn ? 'Employment agreements, résumé, onboarding and Human Resources file.' : 'Acuerdos laborales, résumé, onboarding y expediente de Recursos Humanos.'} files={files.package} icon={BriefcaseBusiness} lang={lang}/>
          <FileList title={isEn ? 'Signed documents' : 'Documentos firmados'} subtitle={isEn ? 'Agreements, acknowledgements, consents and signed forms.' : 'Acuerdos, acuses, consentimientos y formularios firmados.'} files={files.signed} icon={FileCheck2} lang={lang}/>
          <FileList title={isEn ? 'Attachments' : 'Adjuntos'} subtitle={isEn ? 'Every source attachment connected to this employee.' : 'Todos los adjuntos de origen conectados a este empleado.'} files={files.all} icon={Paperclip} lang={lang}/>
          <AcademyDossier academy={employee.hrDossier?.academy} lang={lang}/>
          <EmployeeRequiredRecords employee={employee} lang={lang} canManage={canManage} onRefresh={onDossierRefresh}/>
          {isClinicalEmployee(employee)&&<ClinicalCompliance employee={employee} lang={lang} canManage={canManage} onRefresh={onDossierRefresh}/>}
          <EmployeeWorkflowDocuments employee={employee} lang={lang} canManage={canManage} selfService={selfService} onRefresh={onDossierRefresh}/>
        </main>
        <aside>
          <EmployeePhotoControl employee={employee} lang={lang} canManage={canManage} selfService={selfService} onRefresh={onDossierRefresh}/>
          <section className="hr-classification-card"><header><BriefcaseBusiness/><div><h3>{isEn?'Employee classification':'Clasificación del empleado'}</h3><p>{isEn?'Manual Human Resources assignment overrides automatic classification.':'La selección manual de Recursos Humanos reemplaza la clasificación automática.'}</p></div></header>{canManage?<select value={isClinicalEmployee(employee)?'clinical':'operational'} onChange={event=>onClassificationChange?.(event.target.value)}><option value="operational">{isEn?'Operational employee':'Empleado operacional'}</option><option value="clinical">{isEn?'Clinical employee':'Empleado clínico'}</option></select>:<strong>{isClinicalEmployee(employee)?(isEn?'Clinical employee':'Empleado clínico'):(isEn?'Operational employee':'Empleado operacional')}</strong>}</section>
          <section className="hr-checklist-card"><header><BadgeCheck/><div><h3>{isEn ? 'Employee package checklist' : 'Checklist del employee package'}</h3><p>{isEn ? 'Current source readiness' : 'Disponibilidad en la fuente actual'}</p></div></header>{[
            [isEn ? 'Identity and position' : 'Identidad y posición', employee.name && employee.role],
            [isEn ? 'Primary entity' : 'Entidad principal', employee.entity],
            [isEn ? 'Employment status' : 'Estado laboral', employee.lifecycle || employee.status],
            ['Employee package', files.package.length],
            [isEn ? 'Licenses and credentials' : 'Licencias y credenciales', files.license.length],
            [isEn ? 'Signed documents' : 'Documentos firmados', files.signed.length],
            [isEn ? 'Source attachments' : 'Adjuntos de origen', files.all.length],
          ].map(([label, ready]) => <div key={label}><span>{label}</span><Status ready={!!ready} lang={lang}/></div>)}</section>
          <section className="hr-credential-card"><header><IdCard/><div><h3>{isEn ? 'Licenses & credentials' : 'Licencias y credenciales'}</h3><p>{isEn ? 'Identifiers currently mapped' : 'Identificadores actualmente mapeados'}</p></div></header>{credentials.map(([en, es, value]) => <div key={en}><span>{isEn ? en : es}</span><strong>{value || (isEn ? 'Pending from source' : 'Pendiente de fuente')}</strong></div>)}{files.license.length > 0 && <div className="hr-license-files"><small>{isEn ? 'CONNECTED FILES' : 'ARCHIVOS CONECTADOS'}</small>{files.license.map((file, index) => <span key={`${file.filename}-${index}`}><Paperclip/>{file.filename}</span>)}</div>}</section>
          <section className="hr-dates-card"><header><BadgeCheck/><div><h3>{isEn ? 'Dates & record status' : 'Fechas y estatus del expediente'}</h3><p>{isEn ? 'Effective dates shown only when exposed by the source' : 'Fechas mostradas únicamente cuando la fuente las expone'}</p></div></header><div className="hr-manual-status"><span>{isEn?'Employment status':'Estado laboral'}<small>{isEn?'Human Resources controlled':'Controlado por Recursos Humanos'}</small></span>{canManage?<button className={employmentStatus} onClick={() => onStatusChange(employmentStatus === 'active' ? 'inactive' : 'active')}><span>{employmentStatus === 'active' ? (isEn?'Active':'Activo') : (isEn?'Inactive':'Inactivo')}</span>{employmentStatus === 'active' ? (isEn?'Mark inactive':'Marcar inactivo') : (isEn?'Mark active':'Marcar activo')}</button>:<strong>{employmentStatus==='active'?(isEn?'Active':'Activo'):(isEn?'Inactive':'Inactivo')}</strong>}</div><div><span>{isEn?'Hire / effective date':'Fecha de contratación / vigencia'}</span><strong>{employee.hireDate||employee.startDate||(isEn?'Pending from source':'Pendiente de fuente')}</strong></div><div><span>{isEn?'Credential expiration':'Vencimiento de credencial'}</span><strong>{employee.expiresOn||employee.expirationDate||(isEn?'Pending from source':'Pendiente de fuente')}</strong></div><div><span>{isEn?'Last protected synchronization':'Última sincronización protegida'}</span><strong>{sourceStatus?.syncedAt||(isEn?'Pending protected sync':'Sincronización protegida pendiente')}</strong></div></section>
          {employee.sourceRecordUrl && <a className="hr-source-link" href={employee.sourceRecordUrl} target="_blank" rel="noreferrer"><Link2/>{isEn ? 'Open source record' : 'Abrir registro de origen'}<ArrowRight/></a>}
        </aside>
      </div>
    </div>
  </div>;
}

export default function HumanResources({ lang, employees:sourceEmployees = [], sourceStatus, session, canManage=false }) {
  const isEn = lang === 'en';
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('all');
  const [selected, setSelected] = useState(null);
  const [section, setSection] = useState('employees');
  const [workforce,setWorkforce]=useState('operational');
  const [dossiers,setDossiers]=useState([]);
  const [recordDossiers,setRecordDossiers]=useState([]);
  const [classifications,setClassifications]=useState([]);
  const [loadingDossiers,setLoadingDossiers]=useState(true);
  const [dossierError,setDossierError]=useState('');
  const [statusOverrides, setStatusOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('operational-hub-employee-status') || '{}'); } catch { return {}; }
  });
  const employeeKey = employee => employee.accessUserId || employee.recordId || employee.name;
  const loadDossiers=async()=>{setLoadingDossiers(true);setDossierError('');try{const response=await fetch(canManage?'/api/hr/dossiers':'/api/hr/me/dossier');const payload=await response.json();if(!response.ok)throw new Error(payload.error);setDossiers(canManage?(payload.dossiers||[]):payload.dossier?[payload.dossier]:[]);setRecordDossiers(canManage?(payload.recordDossiers||[]):[]);setClassifications(canManage?(payload.classifications||[]):payload.dossier?.classification?[payload.dossier.classification]:[])}catch(error){setDossierError(error.message|| (isEn?'The employee record could not be loaded.':'No se pudo cargar el expediente.'))}finally{setLoadingDossiers(false)}};
  useEffect(()=>{loadDossiers()},[session?.id,canManage,isEn]);
  const employees=useMemo(()=>{
    const byEmail=new Map(dossiers.map(dossier=>[String(dossier.user?.email||'').toLowerCase(),dossier]));const byRecord=new Map(recordDossiers.map(dossier=>[dossier.recordId,dossier]));const classificationByKey=new Map(classifications.map(item=>[item.employeeKey,item]));const matched=new Set();
    const roster=sourceEmployees.map(employee=>{const dossier=byEmail.get(String(employee.email||'').toLowerCase());const recordDossier=byRecord.get(employee.recordId);if(dossier)matched.add(dossier.user.id);const combinedDossier=dossier||recordDossier||null;const classification=classificationByKey.get(employee.recordId)||classificationByKey.get(dossier?.user?.id)||combinedDossier?.classification;return {...employee,workforceGroup:classification?.workforceGroup||'',...(combinedDossier?{hrDossier:combinedDossier}:{}),...(dossier?{name:dossier.user.name||employee.name,email:dossier.user.email||employee.email,accessUserId:dossier.user.id}: {})}});
    const accountOnly=dossiers.filter(dossier=>!matched.has(dossier.user.id)).map(dossier=>{const recordId=dossier.provider?.recordId||`access-${dossier.user.id}`;const classification=classificationByKey.get(recordId)||classificationByKey.get(dossier.user.id)||dossier.classification;return {...dossier.provider,recordId,accessUserId:dossier.user.id,name:dossier.user.name,email:dossier.user.email,initials:dossier.provider?.initials||String(dossier.user.name||'').split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(),role:dossier.provider?.role||(isEn?'Operational employee':'Personal operacional'),entity:dossier.provider?.entity||(isEn?'Entity pending':'Entidad pendiente'),degree:dossier.provider?.degree||'',lifecycle:dossier.user.employmentStatus==='inactive'?'inactive':'active',status:dossier.user.employmentStatus,sourceAttachments:dossier.provider?.sourceAttachments||[],source:dossier.provider?.source||'Operational Hub · Identity',hrDossier:dossier,workforceGroup:classification?.workforceGroup||''}});
    if(!canManage&&dossiers[0]){const own=[...roster,...accountOnly].find(employee=>employee.accessUserId===dossiers[0].user.id);return own?[own]:accountOnly}
    return [...roster,...accountOnly];
  },[sourceEmployees,dossiers,recordDossiers,classifications,canManage,isEn]);
  useEffect(()=>{if(!selected)return;const refreshed=employees.find(employee=>employeeKey(employee)===employeeKey(selected));if(refreshed&&refreshed!==selected)setSelected(refreshed)},[employees]);
  const getStatus = employee => statusOverrides[employeeKey(employee)] || (employee.lifecycle === 'inactive' ? 'inactive' : 'active');
  const setEmployeeStatus = (employee, status) => {
    const next = { ...statusOverrides, [employeeKey(employee)]: status };
    setStatusOverrides(next);
    localStorage.setItem('operational-hub-employee-status', JSON.stringify(next));
  };
  const setEmployeeClassification=async(employee,workforceGroup)=>{const key=employee.recordId||employee.accessUserId;if(!key)return;const response=await fetch(`/api/hr/employee-classifications/${encodeURIComponent(key)}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({workforceGroup,accessUserId:employee.accessUserId||''})});const payload=await response.json();if(!response.ok){setDossierError(payload.error|| (isEn?'The classification could not be saved.':'No se pudo guardar la clasificación.'));return}setClassifications(current=>[payload.classification,...current.filter(item=>item.employeeKey!==payload.classification.employeeKey)]);setSelected(current=>current?{...current,workforceGroup}:current)};
  const workforceEmployees=useMemo(()=>employees.filter(employee=>workforce==='clinical'?isClinicalEmployee(employee):!isClinicalEmployee(employee)),[employees,workforce]);
  const positions = useMemo(() => [...new Set(workforceEmployees.map(employee => employee.role).filter(Boolean))].sort(), [workforceEmployees]);
  const filtered = useMemo(() => workforceEmployees.filter(employee => {
    const matchesPosition = position === 'all' || employee.role === position;
    const haystack = [employee.name, employee.role, employee.entity, employee.degree].filter(Boolean).join(' ').toLowerCase();
    return matchesPosition && haystack.includes(query.trim().toLowerCase());
  }), [workforceEmployees, position, query]);
  const groups = useMemo(() => Object.entries(filtered.reduce((acc, employee) => { const key = employee.role || (isEn ? 'Position pending' : 'Puesto pendiente'); (acc[key] ||= []).push(employee); return acc; }, {})).sort(([a], [b]) => a.localeCompare(b)), [filtered, isEn]);
  if(loadingDossiers)return <div className="page hr-page"><div className="hr-no-results"><Clock3/><h2>{isEn?'Loading your protected employee record…':'Cargando tu expediente protegido…'}</h2></div></div>;
  if(!canManage){const employee=employees[0];if(!employee)return <div className="page hr-page"><div className="hr-no-results"><CircleAlert/><h2>{isEn?'Your employee record is not available':'Tu expediente laboral no está disponible'}</h2><p>{dossierError}</p></div></div>;return <EmployeeRecord employee={employee} lang={lang} sourceStatus={sourceStatus} employmentStatus={getStatus(employee)} onStatusChange={()=>{}} canManage={false} selfService onDossierRefresh={loadDossiers}/>}
  if (selected) return <EmployeeRecord employee={selected} lang={lang} sourceStatus={sourceStatus} onBack={() => setSelected(null)} employmentStatus={getStatus(selected)} onStatusChange={status => setEmployeeStatus(selected, status)} onClassificationChange={workforceGroup=>setEmployeeClassification(selected,workforceGroup)} canManage onDossierRefresh={loadDossiers}/>;
  const attached = employees.reduce((total, employee) => total + (employee.sourceAttachments?.length || 0), 0);
  return <div className="page hr-page">
    <div className="page-title hr-title"><div><span className="eyebrow">{isEn ? 'HUMAN RESOURCES · EMPLOYEE RECORDS' : 'RECURSOS HUMANOS · EXPEDIENTES'}</span><h1>{isEn?'Human Resources':'Recursos Humanos'}</h1><p>{isEn ? 'Employees organized by position with their complete Human Resources record, employee package, licenses and signed documents.' : 'Empleados organizados por posición con su expediente de Recursos Humanos, employee package, licencias y documentos firmados.'}</p></div><span className="hr-source-badge"><ShieldCheck/><strong>{sourceStatus?.source || 'EM-MSO · Human Resource'}</strong><small>{sourceStatus?.state==='connected'?(isEn?'Protected sync active':'Sincronización protegida activa'):(isEn?'Human Resource permission pending':'Permiso de Human Resource pendiente')}</small></span></div>
    {dossierError&&<p className="hr-document-message">{dossierError}</p>}
    <div className="hr-metrics"><div><Users/><strong>{employees.length}</strong><span>{isEn ? 'Employee records' : 'Expedientes'}</span></div><div><BriefcaseBusiness/><strong>{positions.length}</strong><span>{isEn ? 'Positions in current group' : 'Posiciones del grupo actual'}</span></div><div><Paperclip/><strong>{attached}</strong><span>{isEn ? 'Connected files' : 'Archivos conectados'}</span></div></div>
    <nav className="hr-section-tabs"><button className={section === 'employees' ? 'active' : ''} onClick={() => setSection('employees')}><Users/>{isEn ? 'Employees' : 'Empleados'}</button><button className={section === 'files' ? 'active' : ''} onClick={() => setSection('files')}><FolderOpen/>{isEn ? 'Files' : 'Archivos'}</button><button className={section === 'package' ? 'active' : ''} onClick={() => setSection('package')}><FileCheck2/>Employee Package</button><button className={section === 'docusign' ? 'active' : ''} onClick={() => setSection('docusign')}><PenTool/>DocuSign</button></nav>
    {section === 'docusign' ? <DocuSignWorkspace employees={employees} lang={lang}/> : section === 'package' ? <EmployeePackageLibrary employees={employees} lang={lang} onRefresh={loadDossiers}/> : section === 'files' ? <HumanResourcesFiles employees={employees} lang={lang}/> : <>
    <nav className="hr-workforce-tabs"><button className={workforce==='operational'?'active':''} onClick={()=>{setWorkforce('operational');setPosition('all')}}><BriefcaseBusiness/><span><strong>{isEn?'Operational personnel':'Personal operacional'}</strong><small>{employees.filter(employee=>!isClinicalEmployee(employee)).length} {isEn?'employees':'empleados'}</small></span></button><button className={workforce==='clinical'?'active':''} onClick={()=>{setWorkforce('clinical');setPosition('all')}}><IdCard/><span><strong>{isEn?'Clinical personnel':'Personal clínico'}</strong><small>{employees.filter(isClinicalEmployee).length} {isEn?'employees':'empleados'}</small></span></button></nav>
    <div className="hr-toolbar"><label><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={isEn ? 'Search employee, position or entity…' : 'Buscar empleado, posición o entidad…'}/></label><label className="hr-position-select"><BriefcaseBusiness/><select value={position} onChange={event => setPosition(event.target.value)}><option value="all">{isEn ? 'All positions' : 'Todas las posiciones'}</option>{positions.map(item => <option key={item} value={item}>{item}</option>)}</select><ChevronDown/></label></div>
    <div className="hr-position-groups">{groups.map(([role, members]) => <section key={role}><header><div><span>{isEn ? 'POSITION' : 'POSICIÓN'}</span><h2>{role}</h2></div><b>{members.length} {members.length === 1 ? (isEn ? 'employee' : 'empleado') : (isEn ? 'employees' : 'empleados')}</b></header><div>{members.map(employee => { const files = classifyFiles(employee); const percent = completeness(employee, files); const employmentStatus = getStatus(employee); return <article className="hr-directory-row" key={employeeKey(employee)}><button className="hr-directory-open" onClick={() => setSelected(employee)}><span className="hr-directory-avatar">{employee.initials}</span><div className="hr-directory-person"><strong>{employee.name}</strong><span>{employee.entity || (isEn ? 'Entity pending' : 'Entidad pendiente')} · {employee.degree || employee.license || (isEn ? 'Credential pending' : 'Credencial pendiente')}</span></div><div className="hr-directory-files"><Paperclip/><strong>{files.all.length}</strong><span>{isEn ? 'files' : 'archivos'}</span></div><div className="hr-directory-progress"><strong>{percent}%</strong><div><i style={{ width: `${percent}%` }}/></div></div><ChevronRight/></button><button className={`hr-status-button ${employmentStatus}`} onClick={() => setEmployeeStatus(employee, employmentStatus === 'active' ? 'inactive' : 'active')}><span>{employmentStatus === 'active' ? (isEn ? 'Active' : 'Activo') : (isEn ? 'Inactive' : 'Inactivo')}</span>{employmentStatus === 'active' ? (isEn ? 'Mark inactive' : 'Marcar inactivo') : (isEn ? 'Mark active' : 'Marcar activo')}</button></article>})}</div></section>)}{!groups.length && <div className="hr-no-results"><UserRound/><h2>{isEn ? 'No employees match these filters' : 'Ningún empleado coincide con los filtros'}</h2><p>{isEn ? 'Adjust the search or position filter.' : 'Ajusta la búsqueda o el filtro de posición.'}</p></div>}</div>
    </>}
  </div>;
}
