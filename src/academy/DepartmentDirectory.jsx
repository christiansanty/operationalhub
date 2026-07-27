import React, { useMemo, useState } from 'react';
import { Building2, Check, Mail, Pencil, Phone, Plus, Search, Trash2, UserRound, Users, X } from 'lucide-react';
import './department-directory.css';

const departments = [
  ['executive','Executive & Administration','Dirección y Administración'],
  ['coral-way','Eastern Medical Center · Coral Way','Eastern Medical Center · Coral Way'],
  ['hialeah','Eastern Medical Group · Hialeah','Eastern Medical Group · Hialeah'],
  ['fort-myers','Eastern Medical Center · Fort Myers','Eastern Medical Center · Fort Myers'],
  ['305-medical','305 Medical Care','305 Medical Care'],
  ['call-center','Call Center & CRM','Call Center y CRM'],
  ['chronic-care','Chronic Care Management','Chronic Care Management'],
  ['qhs','QHS Labs & Monitoring','QHS Labs y Monitoreo'],
  ['medical','General Medicine & Clinical Team','Medicina General y Equipo Clínico'],
  ['allergy','Allergy & Immunology','Alergia e Inmunología'],
  ['telemedicine','Telemedicine Operations','Operaciones de Telemedicina'],
  ['transportation','Transportation','Transportación'],
  ['aesthetics','Eastern Medical Aesthetics','Eastern Medical Aesthetics'],
  ['research','Eastern Medical Research','Eastern Medical Research'],
  ['insurance','Seven Insurance','Seven Insurance'],
  ['billing','Billing, Referrals & Prior Authorizations','Facturación, Referidos y Autorizaciones'],
  ['hr','Human Resources & Personnel','Recursos Humanos y Personal'],
  ['it','IT, Systems & Security','IT, Sistemas y Seguridad'],
  ['pharmacy','Pharmacy Coordination','Coordinación de Farmacia'],
];

const emptyContact={name:'',role:'',extension:'',email:'',phone:''};

export default function DepartmentDirectory({lang='es', departmentsOverride=departments, storageKey='ema-department-directory', seedContacts=[]}) {
  const isEn=lang==='en';
  const [contacts,setContacts]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');return [...new Map([...seedContacts,...saved].map(item=>[item.id,item])).values()]}catch{return seedContacts}});
  const [query,setQuery]=useState('');
  const [activeDepartment,setActiveDepartment]=useState(null);
  const [editingId,setEditingId]=useState(null);
  const [draft,setDraft]=useState(emptyContact);
  const persist=next=>{setContacts(next);localStorage.setItem(storageKey,JSON.stringify(next))};
  const visible=useMemo(()=>{const needle=query.trim().toLowerCase();return departmentsOverride.filter(department=>!needle||`${department[1]} ${department[2]} ${contacts.filter(item=>item.department===department[0]).map(item=>`${item.name} ${item.role} ${item.extension} ${item.email}`).join(' ')}`.toLowerCase().includes(needle))},[query,contacts,departmentsOverride]);
  const openCreate=department=>{setActiveDepartment(department);setEditingId(null);setDraft(emptyContact)};
  const openEdit=contact=>{setActiveDepartment(contact.department);setEditingId(contact.id);setDraft({name:contact.name,role:contact.role,extension:contact.extension,email:contact.email,phone:contact.phone})};
  const close=()=>{setActiveDepartment(null);setEditingId(null);setDraft(emptyContact)};
  const save=event=>{event.preventDefault();const clean={...draft,name:draft.name.trim(),role:draft.role.trim(),extension:draft.extension.trim(),email:draft.email.trim(),phone:draft.phone.trim()};if(editingId){persist(contacts.map(item=>item.id===editingId?{...item,...clean}:item))}else{persist([...contacts,{...clean,id:`department-contact-${Date.now()}`,department:activeDepartment}])}close()};
  const remove=contact=>{if(window.confirm(isEn?`Remove ${contact.name} from the directory?`:`¿Eliminar a ${contact.name} del directorio?`))persist(contacts.filter(item=>item.id!==contact.id))};
  const populated=departmentsOverride.filter(department=>contacts.some(item=>item.department===department[0])).length;
  return <section className="department-directory">
    <header><div><span>{isEn?'VERIFIED INTERNAL DIRECTORY':'DIRECTORIO INTERNO VERIFICADO'}</span><h2>{isEn?'Departments, people and direct contacts':'Departamentos, personal y contactos directos'}</h2><p>{isEn?'Find the correct owner, extension and company email before transferring a patient or task. Only verified contacts added through this directory are displayed.':'Encuentra responsable, extensión y correo corporativo antes de transferir un paciente o tarea. Solo se muestran contactos verificados añadidos mediante este directorio.'}</p></div><div className="directory-meter"><Users/><strong>{populated}/{departmentsOverride.length}</strong><span>{isEn?'departments populated':'departamentos completados'}</span></div></header>
    <div className="directory-toolbar"><div><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={isEn?'Search department, person, extension or email…':'Buscar departamento, persona, extensión o correo…'}/></div><span>{contacts.length} {isEn?'verified contacts':'contactos verificados'}</span></div>
    <div className="department-grid">{visible.map(department=>{const people=contacts.filter(item=>item.department===department[0]);return <article key={department[0]} className={people.length?'populated':'empty'}><div className="department-heading"><i><Building2/></i><div><span>{isEn?'DEPARTMENT':'DEPARTAMENTO'}</span><h3>{department[isEn?1:2]}</h3></div><button onClick={()=>openCreate(department[0])} title={isEn?'Add contact':'Añadir contacto'}><Plus/></button></div>{people.length?<div className="department-people">{people.map(person=><div key={person.id}><div className="person-identity"><i><UserRound/></i><div><strong>{person.name}</strong><span>{person.role|| (isEn?'Role pending':'Cargo pendiente')}</span></div></div><div className="person-channels"><span><Phone/>{person.extension?(isEn?'Ext. ':'Ext. ')+person.extension:(isEn?'No extension':'Sin extensión')}</span>{person.phone&&<span><Phone/>{person.phone}</span>}<span><Mail/>{person.email||(isEn?'No email':'Sin correo')}</span></div><div className="person-actions"><button onClick={()=>openEdit(person)}><Pencil/>{isEn?'Edit':'Editar'}</button><button onClick={()=>remove(person)}><Trash2/>{isEn?'Remove':'Eliminar'}</button></div></div>)}</div>:<div className="department-empty"><UserRound/><strong>{isEn?'Contact pending verification':'Contacto pendiente de verificación'}</strong><p>{isEn?'No names, extensions or emails have been confirmed for this department.':'No se han confirmado nombres, extensiones ni correos para este departamento.'}</p><button onClick={()=>openCreate(department[0])}><Plus/>{isEn?'Add verified contact':'Añadir contacto verificado'}</button></div>}</article>})}</div>
    <div className="directory-standard"><Check/><p><strong>{isEn?'Publication standard':'Estándar de publicación'}</strong>{isEn?' Confirm the employee’s current department, role, company email and extension with Administration before publishing. Remove or update the record immediately when employment or responsibilities change.':' Confirma con Administración el departamento, cargo, correo corporativo y extensión vigentes antes de publicar. Elimina o actualiza el registro de inmediato cuando cambie el empleo o las responsabilidades.'}</p></div>
    {activeDepartment&&<div className="directory-modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&close()}><form className="directory-modal" onSubmit={save}><header><div><span>{editingId?(isEn?'EDIT VERIFIED CONTACT':'EDITAR CONTACTO VERIFICADO'):(isEn?'NEW VERIFIED CONTACT':'NUEVO CONTACTO VERIFICADO')}</span><h3>{departmentsOverride.find(item=>item[0]===activeDepartment)?.[isEn?1:2]}</h3></div><button type="button" onClick={close}><X/></button></header><div><label>{isEn?'Full name':'Nombre completo'}<input required value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></label><label>{isEn?'Role / title':'Cargo / función'}<input required value={draft.role} onChange={event=>setDraft({...draft,role:event.target.value})}/></label><label>{isEn?'Extension':'Extensión'}<input value={draft.extension} onChange={event=>setDraft({...draft,extension:event.target.value})} placeholder="000"/></label><label>{isEn?'Company email':'Correo corporativo'}<input required type="email" value={draft.email} onChange={event=>setDraft({...draft,email:event.target.value})} placeholder="name@company.com"/></label><label>{isEn?'Direct phone (optional)':'Teléfono directo (opcional)'}<input type="tel" value={draft.phone} onChange={event=>setDraft({...draft,phone:event.target.value})}/></label></div><footer><button type="button" onClick={close}>{isEn?'Cancel':'Cancelar'}</button><button className="save" type="submit"><Check/>{editingId?(isEn?'Save changes':'Guardar cambios'):(isEn?'Publish contact':'Publicar contacto')}</button></footer></form></div>}
  </section>;
}
