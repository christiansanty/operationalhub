import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, Check,
  ChevronDown, ChevronRight, CircleAlert, Clock3, ExternalLink, FileCheck2, FileText, FolderOpen,
  IdCard, Link2, Mail, Paperclip, PenTool, Search, Send, ShieldCheck, Trash2, Upload, UserRound, Users,
} from 'lucide-react';
import './human-resources.css';

const fileGroups = {
  package: /agreement|contract|expediente|employment|employee|offer|cv|resume/i,
  signed: /signed|signature|agreement|contract|consent|acknowledg/i,
  license: /license|licencia|dea|npi|caqh|medicare|medicaid|credential/i,
};

function classifyFiles(employee) {
  const files = employee.sourceAttachments || [];
  const by = (key) => files.filter((file) => file.category === key || fileGroups[key].test(file.filename || ''));
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
    {files.length ? <div className="hr-file-list">{files.map((file, index) => { const href=file.id?`/api/operational/airtable/attachments/${encodeURIComponent(file.id)}`:''; const content=<><FileText/><div><strong>{file.filename}</strong><span>{file.category || (lang === 'en' ? 'Mapped source document' : 'Documento mapeado en la fuente')}</span></div>{href?<span className="hr-file-open"><Link2/>{lang==='en'?'Open':'Abrir'}</span>:<Status ready lang={lang}/>}</>; return href?<a key={file.id} href={href} target="_blank" rel="noreferrer">{content}</a>:<article key={`${file.filename}-${index}`}>{content}</article>})}</div> : <div className="hr-file-empty"><FolderOpen/><span>{lang === 'en' ? 'No document is currently exposed by the connected source.' : 'La fuente conectada no expone documentos actualmente en esta sección.'}</span></div>}
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

async function syncPackageTemplate(template) {
  if (template.serverId || !template.blob) return template;
  const response = await fetch('/api/hr/packages', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ clientId:template.id, filename:template.name, type:template.type, base64:await blobBase64(template.blob) }) });
  if (!response.ok) throw new Error('Package synchronization failed');
  const payload = await response.json();
  return { ...template, serverId:payload.package.id };
}

function EmployeePackageLibrary({ employees, lang }) {
  const isEn = lang === 'en';
  const [templates, setTemplates] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [templateUrls, setTemplateUrls] = useState({});
  useEffect(() => { packageStore('readonly', store => store.getAll()).then(async rows => {
    const synchronized = await Promise.all(rows.map(row => syncPackageTemplate(row).catch(() => row)));
    await Promise.all(synchronized.filter(row => row.serverId).map(row => packageStore('readwrite', store => store.put(row))));
    const remoteResponse = await fetch('/api/hr/packages').catch(() => null);
    const remotePayload = remoteResponse?.ok ? await remoteResponse.json() : { packages:[] };
    const known = new Set(synchronized.map(row => row.serverId).filter(Boolean));
    const remoteOnly = (remotePayload.packages || []).filter(row => !known.has(row.id)).map(row => ({ id:`server-${row.id}`, serverId:row.id, name:row.filename, type:row.type, size:row.size, updatedAt:row.createdAt }));
    setTemplates([...synchronized, ...remoteOnly].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }).catch(() => setError(isEn ? 'This browser could not open the package library.' : 'Este navegador no pudo abrir la biblioteca de packages.')); }, [isEn]);
  useEffect(() => {
    const next = Object.fromEntries(templates.filter(template => template.blob).map(template => [template.id, URL.createObjectURL(template.blob)]));
    setTemplateUrls(next);
    return () => Object.values(next).forEach(url => URL.revokeObjectURL(url));
  }, [templates]);
  const selectedEmployee = employees.find(employee => (employee.recordId || employee.name) === employeeId);
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
  const chooseEmployee = event => {
    const id = event.target.value;
    const employee = employees.find(item => (item.recordId || item.name) === id);
    setEmployeeId(id); setRecipient(employee?.email || ''); setMessage(''); setError('');
  };
  const openEmail = event => {
    event.preventDefault();
    const files = templates.filter(template => selectedFiles.includes(template.id));
    if (!employeeId || !recipient.trim() || !files.length) { setError(isEn ? 'Select an employee, enter an email and choose at least one blank document.' : 'Selecciona un empleado, escribe su correo y elige al menos un documento en blanco.'); return; }
    const subject = isEn ? 'Employee Package — documents for signature' : 'Employee Package — documentos para firma';
    const fileList = files.map(file => `• ${file.name}`).join('\n');
    const body = isEn ? `Hello ${selectedEmployee?.name || ''},\n\nPlease review, complete and sign the following Employee Package documents:\n${fileList}\n\nPlease return the completed documents to Human Resources.\n\nThank you.` : `Hola ${selectedEmployee?.name || ''},\n\nPor favor revisa, completa y firma los siguientes documentos del Employee Package:\n${fileList}\n\nDevuelve los documentos completados a Human Resources.\n\nGracias.`;
    window.location.href = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMessage(isEn ? 'Email draft opened. Attach the selected files shown in this package before sending.' : 'Se abrió el borrador del email. Adjunta los archivos seleccionados de este package antes de enviarlo.');
    setError('');
  };
  return <div className="hr-package-workspace">
    <section className="hr-package-master">
      <header><span><FileCheck2/></span><div><small>MASTER EMPLOYEE PACKAGE</small><h2>{isEn ? 'Blank package documents' : 'Employee Package en blanco'}</h2><p>{isEn ? 'Upload the master forms employees must complete and sign.' : 'Carga los formularios maestros que los empleados deben completar y firmar.'}</p></div><label><Upload/>{isEn ? 'Upload files' : 'Subir archivos'}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={upload}/></label></header>
      {templates.length ? <div className="hr-master-files">{templates.map(template => { const href=template.serverId ? `/api/hr/packages/${encodeURIComponent(template.serverId)}/file` : templateUrls[template.id] || '#'; return <article key={template.id}><div className="hr-master-file-main"><label className="hr-master-check"><input aria-label={isEn ? `Select ${template.name}` : `Seleccionar ${template.name}`} type="checkbox" checked={selectedFiles.includes(template.id)} onChange={event => setSelectedFiles(current => event.target.checked ? [...current, template.id] : current.filter(id => id !== template.id))}/></label><a className="hr-master-file-link" href={href} target="_blank" rel="noreferrer" title={isEn ? `Open ${template.name}` : `Abrir ${template.name}`}><span className="hr-file-icon"><FileText/></span><div><strong>{template.name}</strong><small>{Math.max(1, Math.round(template.size / 1024))} KB · {new Date(template.updatedAt).toLocaleDateString(isEn ? 'en-US' : 'es-US')}</small></div><Link2/></a></div><a href={href} download={template.name}>{isEn ? 'Download' : 'Descargar'}</a><button className="delete" onClick={() => removeTemplate(template)} aria-label={isEn ? `Delete ${template.name}` : `Eliminar ${template.name}`}><Trash2/></button></article>; })}</div> : <div className="hr-package-upload-empty"><Upload/><strong>{isEn ? 'Upload the first blank Employee Package' : 'Sube el primer Employee Package en blanco'}</strong><p>{isEn ? 'PDF and Office documents are stored in this browser until a protected document service is connected.' : 'Los archivos PDF y Office se guardan en este navegador hasta conectar un servicio documental protegido.'}</p></div>}
    </section>
    <form className="hr-package-email" onSubmit={openEmail}>
      <header><span><Mail/></span><div><small>{isEn ? 'EMAIL DELIVERY' : 'ENVÍO POR EMAIL'}</small><h2>{isEn ? 'Send package to an employee' : 'Enviar package a un empleado'}</h2><p>{isEn ? 'Choose the employee and the blank documents to prepare the email.' : 'Elige el empleado y los documentos en blanco para preparar el correo.'}</p></div></header>
      <label>{isEn ? 'Employee' : 'Empleado'}<select value={employeeId} onChange={chooseEmployee} required><option value="">{isEn ? 'Select an employee' : 'Selecciona un empleado'}</option>{employees.map(employee => <option key={employee.recordId || employee.name} value={employee.recordId || employee.name}>{employee.name} · {employee.role}</option>)}</select></label>
      <label>{isEn ? 'Recipient email' : 'Correo del destinatario'}<input type="email" required value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="employee@company.com"/></label>
      <div className="hr-email-selection"><span>{isEn ? 'Documents selected' : 'Documentos seleccionados'}</span><strong>{selectedFiles.length}</strong></div>
      <p className="hr-email-note"><CircleAlert/>{isEn ? 'For security, the app opens a draft in your email application. Review the recipient and attach the selected files before pressing Send.' : 'Por seguridad, la app abre un borrador en tu aplicación de correo. Revisa el destinatario y adjunta los archivos seleccionados antes de presionar Enviar.'}</p>
      {error && <p className="hr-package-error">{error}</p>}{message && <p className="hr-package-success"><Check/>{message}</p>}
      <button className="hr-open-email" type="submit"><Send/>{isEn ? 'Open email draft' : 'Abrir borrador de email'}</button>
    </form>
  </div>;
}

function DocuSignWorkspace({ employees, lang }) {
  const isEn = lang === 'en';
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
    const employee = employees.find(item => (item.recordId || item.name) === id);
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
    const employee = employees.find(item => (item.recordId || item.name) === employeeId);
    if (!employee || !signerEmail.trim() || !selectedIds.length) {
      setError(isEn ? 'Select an employee, recipient email and at least one document.' : 'Selecciona un empleado, el correo del destinatario y al menos un documento.');
      return;
    }
    setBusy(true); setError(''); setEnvelope(null);
    try {
      const response = await fetch('/api/integrations/docusign/envelopes', {
        method:'POST', headers:{'content-type':'application/json'},
        body:JSON.stringify({ packageIds:selectedIds, signerName:employee.name, signerEmail:signerEmail.trim(), emailSubject:subject, emailBlurb:note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'DocuSign request failed');
      setEnvelope(payload.envelope);
    } catch (requestError) {
      setError(requestError.message || (isEn ? 'The envelope could not be created.' : 'No se pudo crear el sobre.'));
    } finally { setBusy(false); }
  };
  const docusignUrl = connection.environment === 'production' ? 'https://app.docusign.com/' : 'https://appdemo.docusign.com/';
  return <div className="hr-docusign-workspace">
    <section className="hr-docusign-hero">
      <div className="hr-docusign-mark"><PenTool/></div>
      <div><small>DOCUSIGN ESIGNATURE</small><h2>{isEn ? 'Electronic signature envelopes' : 'Sobres de firma electrónica'}</h2><p>{isEn ? 'Send Employee Package documents to DocuSign as a draft, place the required signature fields and deliver them to the employee.' : 'Envía los documentos del Employee Package a DocuSign como borrador, coloca los campos de firma requeridos y entrégalos al empleado.'}</p></div>
      <span className={connection.connected ? 'connected' : 'pending'}>{connection.connected ? <Check/> : <CircleAlert/>}{connection.connected ? (isEn ? 'Connected' : 'Conectado') : (isEn ? 'Connection required' : 'Conexión requerida')}</span>
    </section>
    <div className="hr-docusign-grid">
      <section className="hr-docusign-documents">
        <header><div><small>{isEn ? 'ENVELOPE DOCUMENTS' : 'DOCUMENTOS DEL SOBRE'}</small><h3>{isEn ? 'Choose what the employee must sign' : 'Elige lo que debe firmar el empleado'}</h3><p>{isEn ? 'Documents come from the protected Employee Package library.' : 'Los documentos provienen de la biblioteca protegida de Employee Package.'}</p></div><label><Upload/>{busy ? (isEn ? 'Working…' : 'Procesando…') : (isEn ? 'Upload document' : 'Subir documento')}<input type="file" multiple accept=".pdf,.doc,.docx" onChange={upload} disabled={busy}/></label></header>
        {documents.length ? <div className="hr-docusign-file-list">{documents.map(document => <label key={document.id} className={selectedIds.includes(document.id) ? 'selected' : ''}><input type="checkbox" checked={selectedIds.includes(document.id)} onChange={event => setSelectedIds(current => event.target.checked ? [...current, document.id] : current.filter(id => id !== document.id))}/><span><FileText/></span><div><strong>{document.filename}</strong><small>{Math.max(1, Math.round(document.size / 1024))} KB · {new Date(document.createdAt).toLocaleDateString(isEn ? 'en-US' : 'es-US')}</small></div><a href={`/api/hr/packages/${encodeURIComponent(document.id)}/file`} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}><ExternalLink/>{isEn ? 'Open' : 'Abrir'}</a></label>)}</div> : <div className="hr-docusign-empty"><Upload/><strong>{isEn ? 'Upload the first document for DocuSign' : 'Sube el primer documento para DocuSign'}</strong><p>{isEn ? 'PDF and Word documents can be added here before the envelope is created.' : 'Puedes añadir documentos PDF y Word antes de crear el sobre.'}</p></div>}
      </section>
      <form className="hr-docusign-envelope" onSubmit={createEnvelope}>
        <header><span><Send/></span><div><small>{isEn ? 'NEW ENVELOPE' : 'NUEVO SOBRE'}</small><h3>{isEn ? 'Prepare for signature' : 'Preparar para firma'}</h3></div></header>
        <label>{isEn ? 'Employee / signer' : 'Empleado / firmante'}<select value={employeeId} onChange={chooseEmployee} required><option value="">{isEn ? 'Select an employee' : 'Selecciona un empleado'}</option>{employees.map(employee => <option key={employee.recordId || employee.name} value={employee.recordId || employee.name}>{employee.name} · {employee.role}</option>)}</select></label>
        <label>{isEn ? 'Signer email' : 'Correo del firmante'}<input type="email" value={signerEmail} onChange={event => setSignerEmail(event.target.value)} placeholder="employee@company.com" required/></label>
        <label>{isEn ? 'Email subject' : 'Asunto del correo'}<input value={subject} onChange={event => setSubject(event.target.value)} maxLength={100} required/></label>
        <label>{isEn ? 'Message' : 'Mensaje'}<textarea value={note} onChange={event => setNote(event.target.value)} rows={4}/></label>
        <div className="hr-docusign-count"><FileCheck2/><span>{isEn ? 'Selected documents' : 'Documentos seleccionados'}</span><strong>{selectedIds.length}</strong></div>
        {!connection.connected && <div className="hr-docusign-warning"><CircleAlert/><p><strong>{isEn ? 'Connect DocuSign before creating an envelope' : 'Conecta DocuSign antes de crear un sobre'}</strong><span>{isEn ? 'The server needs the DocuSign account ID and OAuth access token. Credentials remain server-side.' : 'El servidor necesita el ID de la cuenta y el access token OAuth de DocuSign. Las credenciales permanecen en el servidor.'}</span></p></div>}
        {error && <p className="hr-package-error">{error}</p>}
        {envelope && <div className="hr-docusign-success"><Check/><div><strong>{isEn ? 'Draft created in DocuSign' : 'Borrador creado en DocuSign'}</strong><span>{envelope.envelopeId}</span><small>{isEn ? 'Open DocuSign to place signature fields and send it.' : 'Abre DocuSign para colocar los campos de firma y enviarlo.'}</small></div></div>}
        <button type="submit" disabled={!connection.connected || busy}><PenTool/>{busy ? (isEn ? 'Creating envelope…' : 'Creando sobre…') : (isEn ? 'Create DocuSign draft' : 'Crear borrador en DocuSign')}</button>
        <a className="hr-open-docusign" href={docusignUrl} target="_blank" rel="noreferrer"><ExternalLink/>{isEn ? 'Open DocuSign' : 'Abrir DocuSign'}</a>
        <p className="hr-docusign-flow"><Clock3/>{isEn ? 'Draft first: position signature fields in DocuSign, review the recipient, then send.' : 'Primero borrador: coloca los campos de firma en DocuSign, revisa el destinatario y luego envía.'}</p>
      </form>
    </div>
  </div>;
}

function EmployeeRecord({ employee, lang, sourceStatus, onBack, employmentStatus, onStatusChange }) {
  const isEn = lang === 'en';
  const files = classifyFiles(employee);
  const completion = completeness(employee, files);
  const credentials = [
    ['Professional license', 'Licencia profesional', employee.licenseNumber || employee.license],
    ['NPI', 'NPI', employee.npi], ['DEA', 'DEA', employee.dea], ['CAQH', 'CAQH', employee.caqh],
    ['Medicare', 'Medicare', employee.medicare], ['Medicaid', 'Medicaid', employee.medicaid],
  ];
  return <div className="hr-record-page">
    <div className="hr-record-top"><button onClick={onBack}><ArrowLeft/>{isEn ? 'Back to Human Resources' : 'Volver a Recursos Humanos'}</button><span><ShieldCheck/> {employee.source || 'Human Resources'}</span></div>
    <div className="hr-record-shell">
      <section className="hr-record-hero">
        <div className="hr-record-avatar">{employee.initials || employee.name?.split(' ').map(part => part[0]).slice(0, 2).join('')}</div>
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
        </main>
        <aside>
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
          <section className="hr-dates-card"><header><BadgeCheck/><div><h3>{isEn ? 'Dates & record status' : 'Fechas y estatus del expediente'}</h3><p>{isEn ? 'Effective dates shown only when exposed by the source' : 'Fechas mostradas únicamente cuando la fuente las expone'}</p></div></header><div className="hr-manual-status"><span>{isEn?'Employment status':'Estado laboral'}<small>{isEn?'Manual app setting':'Configuración manual en la app'}</small></span><button className={employmentStatus} onClick={() => onStatusChange(employmentStatus === 'active' ? 'inactive' : 'active')}><span>{employmentStatus === 'active' ? (isEn?'Active':'Activo') : (isEn?'Inactive':'Inactivo')}</span>{employmentStatus === 'active' ? (isEn?'Mark inactive':'Marcar inactivo') : (isEn?'Mark active':'Marcar activo')}</button></div><div><span>{isEn?'Hire / effective date':'Fecha de contratación / vigencia'}</span><strong>{employee.hireDate||employee.startDate||(isEn?'Pending from source':'Pendiente de fuente')}</strong></div><div><span>{isEn?'Credential expiration':'Vencimiento de credencial'}</span><strong>{employee.expiresOn||employee.expirationDate||(isEn?'Pending from source':'Pendiente de fuente')}</strong></div><div><span>{isEn?'Last protected synchronization':'Última sincronización protegida'}</span><strong>{sourceStatus?.syncedAt||(isEn?'Pending protected sync':'Sincronización protegida pendiente')}</strong></div></section>
          {employee.sourceRecordUrl && <a className="hr-source-link" href={employee.sourceRecordUrl} target="_blank" rel="noreferrer"><Link2/>{isEn ? 'Open source record' : 'Abrir registro de origen'}<ArrowRight/></a>}
        </aside>
      </div>
    </div>
  </div>;
}

export default function HumanResources({ lang, employees = [], sourceStatus }) {
  const isEn = lang === 'en';
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('all');
  const [selected, setSelected] = useState(null);
  const [section, setSection] = useState('employees');
  const [statusOverrides, setStatusOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('operational-hub-employee-status') || '{}'); } catch { return {}; }
  });
  const employeeKey = employee => employee.recordId || employee.name;
  const getStatus = employee => statusOverrides[employeeKey(employee)] || (employee.lifecycle === 'inactive' ? 'inactive' : 'active');
  const setEmployeeStatus = (employee, status) => {
    const next = { ...statusOverrides, [employeeKey(employee)]: status };
    setStatusOverrides(next);
    localStorage.setItem('operational-hub-employee-status', JSON.stringify(next));
  };
  const positions = useMemo(() => [...new Set(employees.map(employee => employee.role).filter(Boolean))].sort(), [employees]);
  const filtered = useMemo(() => employees.filter(employee => {
    const matchesPosition = position === 'all' || employee.role === position;
    const haystack = [employee.name, employee.role, employee.entity, employee.degree].filter(Boolean).join(' ').toLowerCase();
    return matchesPosition && haystack.includes(query.trim().toLowerCase());
  }), [employees, position, query]);
  const groups = useMemo(() => Object.entries(filtered.reduce((acc, employee) => { const key = employee.role || (isEn ? 'Position pending' : 'Puesto pendiente'); (acc[key] ||= []).push(employee); return acc; }, {})).sort(([a], [b]) => a.localeCompare(b)), [filtered, isEn]);
  if (selected) return <EmployeeRecord employee={selected} lang={lang} sourceStatus={sourceStatus} onBack={() => setSelected(null)} employmentStatus={getStatus(selected)} onStatusChange={status => setEmployeeStatus(selected, status)}/>;
  const attached = employees.reduce((total, employee) => total + (employee.sourceAttachments?.length || 0), 0);
  return <div className="page hr-page">
    <div className="page-title hr-title"><div><span className="eyebrow">{isEn ? 'HUMAN RESOURCES · EMPLOYEE RECORDS' : 'RECURSOS HUMANOS · EXPEDIENTES'}</span><h1>{isEn?'Human Resources':'Recursos Humanos'}</h1><p>{isEn ? 'Employees organized by position with their complete Human Resources record, employee package, licenses and signed documents.' : 'Empleados organizados por posición con su expediente de Recursos Humanos, employee package, licencias y documentos firmados.'}</p></div><span className="hr-source-badge"><ShieldCheck/><strong>{sourceStatus?.source || 'EM-MSO · Human Resource'}</strong><small>{sourceStatus?.state==='connected'?(isEn?'Protected sync active':'Sincronización protegida activa'):(isEn?'Human Resource permission pending':'Permiso de Human Resource pendiente')}</small></span></div>
    <div className="hr-metrics"><div><Users/><strong>{employees.length}</strong><span>{isEn ? 'Employee records' : 'Expedientes'}</span></div><div><BriefcaseBusiness/><strong>{positions.length}</strong><span>{isEn ? 'Positions' : 'Posiciones'}</span></div><div><Paperclip/><strong>{attached}</strong><span>{isEn ? 'Connected files' : 'Archivos conectados'}</span></div></div>
    <nav className="hr-section-tabs"><button className={section === 'employees' ? 'active' : ''} onClick={() => setSection('employees')}><Users/>{isEn ? 'Employees' : 'Empleados'}</button><button className={section === 'files' ? 'active' : ''} onClick={() => setSection('files')}><FolderOpen/>{isEn ? 'Files' : 'Archivos'}</button><button className={section === 'package' ? 'active' : ''} onClick={() => setSection('package')}><FileCheck2/>Employee Package</button><button className={section === 'docusign' ? 'active' : ''} onClick={() => setSection('docusign')}><PenTool/>DocuSign</button></nav>
    {section === 'docusign' ? <DocuSignWorkspace employees={employees} lang={lang}/> : section === 'package' ? <EmployeePackageLibrary employees={employees} lang={lang}/> : section === 'files' ? <HumanResourcesFiles employees={employees} lang={lang}/> : <>
    <div className="hr-toolbar"><label><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={isEn ? 'Search employee, position or entity…' : 'Buscar empleado, posición o entidad…'}/></label><label className="hr-position-select"><BriefcaseBusiness/><select value={position} onChange={event => setPosition(event.target.value)}><option value="all">{isEn ? 'All positions' : 'Todas las posiciones'}</option>{positions.map(item => <option key={item} value={item}>{item}</option>)}</select><ChevronDown/></label></div>
    <div className="hr-position-groups">{groups.map(([role, members]) => <section key={role}><header><div><span>{isEn ? 'POSITION' : 'POSICIÓN'}</span><h2>{role}</h2></div><b>{members.length} {members.length === 1 ? (isEn ? 'employee' : 'empleado') : (isEn ? 'employees' : 'empleados')}</b></header><div>{members.map(employee => { const files = classifyFiles(employee); const percent = completeness(employee, files); const employmentStatus = getStatus(employee); return <article className="hr-directory-row" key={employeeKey(employee)}><button className="hr-directory-open" onClick={() => setSelected(employee)}><span className="hr-directory-avatar">{employee.initials}</span><div className="hr-directory-person"><strong>{employee.name}</strong><span>{employee.entity || (isEn ? 'Entity pending' : 'Entidad pendiente')} · {employee.degree || employee.license || (isEn ? 'Credential pending' : 'Credencial pendiente')}</span></div><div className="hr-directory-files"><Paperclip/><strong>{files.all.length}</strong><span>{isEn ? 'files' : 'archivos'}</span></div><div className="hr-directory-progress"><strong>{percent}%</strong><div><i style={{ width: `${percent}%` }}/></div></div><ChevronRight/></button><button className={`hr-status-button ${employmentStatus}`} onClick={() => setEmployeeStatus(employee, employmentStatus === 'active' ? 'inactive' : 'active')}><span>{employmentStatus === 'active' ? (isEn ? 'Active' : 'Activo') : (isEn ? 'Inactive' : 'Inactivo')}</span>{employmentStatus === 'active' ? (isEn ? 'Mark inactive' : 'Marcar inactivo') : (isEn ? 'Mark active' : 'Marcar activo')}</button></article>})}</div></section>)}{!groups.length && <div className="hr-no-results"><UserRound/><h2>{isEn ? 'No employees match these filters' : 'Ningún empleado coincide con los filtros'}</h2><p>{isEn ? 'Adjust the search or position filter.' : 'Ajusta la búsqueda o el filtro de posición.'}</p></div>}</div>
    </>}
  </div>;
}
