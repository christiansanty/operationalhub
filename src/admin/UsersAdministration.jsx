import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, BadgeCheck, Check, CheckCircle2, Clock3, Copy, Eye,
  EyeOff, KeyRound, LockKeyhole, Mail, MoreHorizontal, RefreshCw, Send, ShieldCheck,
  Trash2, UserCheck, UserPlus, UserRound, Users, X,
} from 'lucide-react';
import { applicationPermissionModules } from '../apps/applicationRegistry.js';
import './users-administration.css';

const baseModules = isEn => [
  { id:'dashboard', label:'Dashboard', group:isEn ? 'Workspace' : 'Espacio de trabajo' },
  { id:'entity-medical', label:'Eastern Medical', group:isEn ? 'Organizations' : 'Organizaciones' },
  { id:'entity-care305', label:'305 Medical Care', group:isEn ? 'Organizations' : 'Organizaciones' },
  { id:'entity-aesthetics', label:'Eastern Medical Aesthetics', group:isEn ? 'Organizations' : 'Organizaciones' },
  { id:'entity-seven', label:'Seven Insurance', group:isEn ? 'Organizations' : 'Organizaciones' },
  { id:'entity-research', label:'Eastern Medical Research', group:isEn ? 'Organizations' : 'Organizaciones' },
  { id:'leads', label:isEn ? 'Leads Center' : 'Centro de Leads', group:isEn ? 'Operations' : 'Operaciones' },
  { id:'protocols', label:isEn ? 'Operational Protocols' : 'Protocolos Operacionales', group:isEn ? 'Operations' : 'Operaciones' },
  { id:'licenses', label:'Licenses', group:isEn ? 'Operations' : 'Operaciones' },
  { id:'doctor-licenses', label:isEn ? 'Doctor Licenses / ACA' : 'Licencias de doctores / ACA', group:isEn ? 'Operations' : 'Operaciones' },
  { id:'credentialing', label:isEn ? 'Credentialing' : 'Credencialización', group:isEn ? 'Operations' : 'Operaciones' },
  { id:'contracting', label:'Contracting', group:isEn ? 'Operations' : 'Operaciones' },
  { id:'academy', label:'Eastern Medical Academy', group:isEn ? 'People' : 'Personas' },
  { id:'human-resources', label:isEn ? 'Human Resources' : 'Recursos Humanos', group:isEn ? 'People' : 'Personas' },
  { id:'admin-users', label:isEn ? 'Administration · Users' : 'Administración · Usuarios', group:isEn ? 'Administration' : 'Administración' },
  ...applicationPermissionModules.map(module => ({ ...module, group:isEn ? 'Connected applications' : 'Aplicaciones conectadas' })),
];

const initials = name => String(name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
const blankPermissions = modules => Object.fromEntries(modules.map(module => [module.id, 'none']));
const permissionsForProfile = (profile, modules, current = {}) => {
  if (profile === 'academy') return { ...blankPermissions(modules), academy:'view' };
  if (profile === 'admin') return Object.fromEntries(modules.map(module => [module.id, 'manage']));
  if (profile === 'owner') return { ...Object.fromEntries(modules.map(module => [module.id, 'manage'])), corporate:'manage' };
  return { ...blankPermissions(modules), ...current };
};

const accessLabel = (profile, isEn) => ({
  academy:isEn ? 'Academy only' : 'Solo Academy',
  custom:isEn ? 'Custom access' : 'Acceso personalizado',
  admin:isEn ? 'Administrator' : 'Administrador',
  owner:isEn ? 'Executive' : 'Ejecutivo',
})[profile] || profile;

const statusLabel = (status, isEn) => ({
  invited:isEn ? 'Invitation pending' : 'Invitación pendiente',
  active:isEn ? 'Active account' : 'Cuenta activa',
  disabled:isEn ? 'Disabled' : 'Desactivada',
})[status] || status;

function apiHeaders(session, json = false) {
  return {
    ...(json ? { 'content-type':'application/json' } : {}),
    ...(session?.demo ? { 'x-operational-demo-admin':'true' } : {}),
  };
}

function PermissionSelector({ modules, permissions, onChange, onChangeAll, disabled, isEn }) {
  const groups = [...new Set(modules.map(module => module.group))];
  const selectedCount = modules.filter(module => ['view','manage'].includes(permissions[module.id])).length;
  return <div className="users-custom-permissions">
    <section className="users-permission-summary" aria-live="polite">
      <div><strong>{selectedCount}</strong><span>{selectedCount === 1 ? (isEn ? 'section selected' : 'sección seleccionada') : (isEn ? 'sections selected' : 'secciones seleccionadas')}</span><small>{isEn ? 'Custom access can include multiple sections.' : 'El acceso personalizado puede incluir varias secciones.'}</small></div>
      <div><button type="button" disabled={disabled} onClick={() => onChangeAll('view')}>{isEn ? 'Select all as View' : 'Seleccionar todas para Ver'}</button><button type="button" disabled={disabled || !selectedCount} onClick={() => onChangeAll('none')}>{isEn ? 'Clear selection' : 'Quitar selección'}</button></div>
    </section>
    <div className="users-permission-groups">{groups.map(group => <section key={group}>
    <header><span>{group}</span><small>{isEn ? 'None · View · Manage' : 'Ninguno · Ver · Gestionar'}</small></header>
    <div>{modules.filter(module => module.group === group).map(module => {
      const selected = ['view','manage'].includes(permissions[module.id]);
      return <article key={module.id} className={selected ? 'selected' : ''}>
        <label className="permission-checkbox"><input type="checkbox" checked={selected} disabled={disabled} onChange={event => onChange(module.id, event.target.checked ? 'view' : 'none')}/><span><strong>{module.label}</strong><small>{module.id==='human-resources'?(permissions[module.id]==='manage'?(isEn?'All employee records':'Todos los expedientes'):(isEn?'Personal record is always available':'El expediente propio siempre está disponible')):selected ? (permissions[module.id] === 'manage' ? (isEn ? 'Can manage' : 'Puede gestionar') : (isEn ? 'Can view' : 'Puede ver')) : (isEn ? 'No access' : 'Sin acceso')}</small></span></label>
        <div className="permission-segmented" aria-label={`${module.label} · ${isEn ? 'permission level' : 'nivel de permiso'}`}>{['view','manage'].map(value => <button type="button" key={value} disabled={disabled || !selected} className={permissions[module.id] === value ? 'active' : ''} onClick={() => onChange(module.id, value)}>{value === 'view' ? (isEn ? 'View' : 'Ver') : (isEn ? 'Manage' : 'Gestionar')}</button>)}</div>
      </article>;
    })}</div>
  </section>)}</div>
  </div>;
}

export function InvitationSetup({ token, lang, setLang, onAccepted }) {
  const isEn = lang === 'en';
  const [invitation, setInvitation] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/auth/invitations/${encodeURIComponent(token)}`).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setInvitation(payload);
    }).catch(requestError => setError(requestError.message || (isEn ? 'This invitation is not available.' : 'Esta invitación no está disponible.'))).finally(() => setLoading(false));
  }, [token, isEn]);

  const accept = async event => {
    event.preventDefault();
    if (password.length < 12) { setError(isEn ? 'Use at least 12 characters.' : 'Usa al menos 12 caracteres.'); return }
    if (password !== confirm) { setError(isEn ? 'The passwords do not match.' : 'Las contraseñas no coinciden.'); return }
    setSubmitting(true); setError('');
    try {
      const response = await fetch(`/api/auth/invitations/${encodeURIComponent(token)}/accept`, {
        method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      onAccepted(payload.session);
    } catch (requestError) {
      setError(requestError.message || (isEn ? 'The account could not be activated.' : 'No se pudo activar la cuenta.'));
    } finally { setSubmitting(false) }
  };

  const allowed = invitation ? Object.entries(invitation.user.permissions || {}).filter(([, value]) => value === 'view' || value === 'manage') : [];
  return <div className="invitation-shell">
    <button className="invitation-language" onClick={() => setLang(isEn ? 'es' : 'en')}>{isEn ? 'Español' : 'English'}</button>
    <section className="invitation-card">
      <div className="invitation-brand"><span><ShieldCheck/></span><div><strong>Operational Hub</strong><small>EM GROUP</small></div></div>
      {loading ? <div className="invitation-loading"><RefreshCw/><p>{isEn ? 'Checking your secure invitation…' : 'Verificando tu invitación segura…'}</p></div> : error && !invitation ? <div className="invitation-invalid"><AlertTriangle/><h1>{isEn ? 'Invitation unavailable' : 'Invitación no disponible'}</h1><p>{error}</p><a href="/">{isEn ? 'Return to sign in' : 'Regresar al inicio'}</a></div> : <form onSubmit={accept}>
        <span className="invitation-kicker"><Mail/>{isEn ? 'YOU HAVE BEEN INVITED' : 'HAS SIDO INVITADO'}</span>
        <h1>{isEn ? `Welcome, ${invitation.user.name}` : `Bienvenido, ${invitation.user.name}`}</h1>
        <p>{isEn ? 'Create your password to activate your Operational Hub account.' : 'Crea tu contraseña para activar tu cuenta de Operational Hub.'}</p>
        <div className="invitation-access-summary"><UserCheck/><div><strong>{accessLabel(invitation.user.accessProfile, isEn)}</strong><span>{allowed.length} {isEn ? 'assigned sections' : 'secciones asignadas'}</span></div></div>
        <label>{isEn ? 'Create password' : 'Crear contraseña'}<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => { setPassword(event.target.value); setError('') }} autoComplete="new-password" required/><button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff/> : <Eye/>}</button></div><small>{isEn ? 'Use a passphrase of at least 12 characters.' : 'Usa una frase de al menos 12 caracteres.'}</small></label>
        <label>{isEn ? 'Confirm password' : 'Confirmar contraseña'}<input type={showPassword ? 'text' : 'password'} value={confirm} onChange={event => { setConfirm(event.target.value); setError('') }} autoComplete="new-password" required/></label>
        {error && <p className="invitation-error"><AlertTriangle/>{error}</p>}
        <button className="invitation-submit" disabled={submitting}><KeyRound/>{submitting ? (isEn ? 'Activating account…' : 'Activando cuenta…') : (isEn ? 'Activate my account' : 'Activar mi cuenta')}</button>
        <small className="invitation-expiration"><Clock3/>{isEn ? 'This is a one-time link. It expires ' : 'Este enlace es de un solo uso. Vence el '}{new Date(invitation.expiresAt).toLocaleString(isEn ? 'en-US' : 'es-US')}</small>
      </form>}
    </section>
  </div>;
}

export default function UsersAdministration({ lang, session, canManage = true }) {
  const isEn = lang === 'en';
  const modules = useMemo(() => baseModules(isEn), [isEn]);
  const emptyDraft = () => ({ name:'', email:'', employmentStatus:'active', accessProfile:'academy', permissions:permissionsForProfile('academy', modules) });
  const [users, setUsers] = useState([]);
  const [system, setSystem] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [menuId, setMenuId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', { headers:apiHeaders(session) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setUsers(payload.users || []);
      setSystem(payload.system);
    } catch (requestError) {
      setError(requestError.message || (isEn ? 'Users could not be loaded.' : 'No se pudieron cargar los usuarios.'));
    } finally { setLoading(false) }
  };
  useEffect(() => { load() }, [session?.id, session?.demo, isEn]);

  const openInvite = () => { setEditingId(''); setDraft(emptyDraft()); setError(''); setFieldErrors({}); setModal(true) };
  const openEditor = user => {
    setEditingId(user.id);
    setDraft({ name:user.name, email:user.email, employmentStatus:user.employmentStatus, accessProfile:user.accessProfile, permissions:{ ...blankPermissions(modules), ...user.permissions } });
    setError(''); setFieldErrors({}); setMenuId(''); setModal(true);
  };
  const closeModal = () => { if (!saving) { setModal(false); setEditingId(''); setError(''); setFieldErrors({}) } };
  const changeProfile = profile => {
    setError('');
    setDraft(current => ({
      ...current,
      accessProfile:profile,
      permissions:profile === 'custom'
        ? (current.accessProfile === 'custom' ? current.permissions : blankPermissions(modules))
        : permissionsForProfile(profile, modules, current.permissions),
    }));
  };
  const changePermission = (id, value) => { setError(''); setDraft(current => ({ ...current, permissions:{ ...current.permissions, [id]:value } })) };
  const changeAllPermissions = value => { setError(''); setDraft(current => ({ ...current, permissions:{ ...current.permissions, ...Object.fromEntries(modules.map(module => [module.id, value])) } })) };
  const save = async event => {
    event.preventDefault();
    const normalizedName = draft.name.trim();
    const normalizedEmail = draft.email.trim().toLowerCase();
    const nextFieldErrors = {
      ...(!normalizedName ? { name:isEn ? 'Enter the user’s full name.' : 'Escribe el nombre completo del usuario.' } : {}),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? { email:isEn ? 'Enter a valid work email.' : 'Escribe un correo corporativo válido.' } : {}),
    };
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError(isEn ? 'Complete the highlighted fields before saving the custom profile.' : 'Completa los campos marcados antes de guardar el perfil personalizado.');
      return;
    }
    const permissions = permissionsForProfile(draft.accessProfile, modules, draft.permissions);
    if (draft.accessProfile === 'custom' && !modules.some(module => ['view','manage'].includes(permissions[module.id]))) {
      setError(isEn ? 'Select at least one section before saving.' : 'Selecciona al menos una sección antes de guardar.');
      return;
    }
    setSaving(true); setError(''); setFieldErrors({}); setNotice(null);
    try {
      const response = await fetch(editingId ? `/api/admin/users/${encodeURIComponent(editingId)}` : '/api/admin/invitations', {
        method:editingId ? 'PATCH' : 'POST',
        headers:apiHeaders(session, true),
        body:JSON.stringify({ ...draft, name:normalizedName, email:normalizedEmail, permissions }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      if (!editingId) {
        setNotice({
          type:payload.invitation.delivery.delivered ? 'sent' : 'preview',
          email:payload.user.email,
          url:payload.invitation.developmentUrl,
          expiresAt:payload.invitation.expiresAt,
        });
      } else {
        setNotice({ type:'updated', email:draft.email, sessionsRevoked:payload.sessionsRevoked });
      }
      localStorage.setItem('operational-hub-access-updated',String(Date.now()));
      setModal(false); setEditingId('');
      await load();
    } catch (requestError) {
      setError(requestError.message || (isEn ? 'The user could not be saved.' : 'No se pudo guardar el usuario.'));
    } finally { setSaving(false) }
  };
  const resend = async user => {
    setMenuId(''); setError(''); setNotice(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/resend-invitation`, { method:'POST', headers:apiHeaders(session) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setNotice({ type:payload.invitation.delivery.delivered ? 'sent' : 'preview', email:user.email, url:payload.invitation.developmentUrl, expiresAt:payload.invitation.expiresAt });
      await load();
    } catch (requestError) { setError(requestError.message) }
  };
  const remove = async user => {
    setMenuId('');
    if (!globalThis.confirm(isEn ? `Remove ${user.name} from Operational Hub?` : `¿Eliminar a ${user.name} de Operational Hub?`)) return;
    const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { method:'DELETE', headers:apiHeaders(session) });
    if (response.ok) await load(); else setError((await response.json()).error);
  };
  const copyLink = async url => {
    try { await navigator.clipboard.writeText(url); setNotice(current => ({ ...current, copied:true })) }
    catch { setError(isEn ? 'Copy the invitation URL manually.' : 'Copia manualmente el URL de invitación.') }
  };

  const active = users.filter(user => user.accountStatus === 'active').length;
  const pending = users.filter(user => user.accountStatus === 'invited').length;
  const selectedPermissions = modules.filter(module => ['view','manage'].includes(permissionsForProfile(draft.accessProfile, modules, draft.permissions)[module.id]));
  const identityReady = Boolean(draft.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()));
  return <div className="page users-admin-page">
    <header className="users-admin-title"><div><span>ADMINISTRATION · IDENTITY & ACCESS</span><h1>{isEn ? 'Users & access' : 'Usuarios y accesos'}</h1><p>{isEn ? 'Invite employees, control every section and monitor account activation from one secure directory.' : 'Invita empleados, controla cada sección y supervisa la activación de cuentas desde un directorio seguro.'}</p></div>{canManage && <button onClick={openInvite}><UserPlus/>{isEn ? 'Invite user' : 'Invitar usuario'}</button>}</header>
    <section className="users-system-strip"><div className={system?.email.configured ? 'ready' : 'preview'}>{system?.email.configured ? <CheckCircle2/> : <Mail/>}<span><strong>{system?.email.configured ? (isEn ? 'Automatic email delivery active' : 'Envío automático activo') : (isEn ? 'Email provider not connected' : 'Proveedor de email no conectado')}</strong><small>{system?.email.configured ? `${system.email.provider} · ${system.email.from}` : (isEn ? 'Invitations provide a development link until Resend is configured.' : 'Las invitaciones muestran un enlace de desarrollo hasta configurar Resend.')}</small></span></div><div><ShieldCheck/><span><strong>{isEn ? 'Server-verified access' : 'Acceso verificado por el servidor'}</strong><small>{isEn ? 'Passwords, sessions and permissions are no longer stored in the browser.' : 'Contraseñas, sesiones y permisos ya no se guardan en el navegador.'}</small></span></div></section>
    <section className="users-admin-metrics"><article><Users/><div><strong>{users.length}</strong><span>{isEn ? 'Total users' : 'Usuarios totales'}</span></div></article><article><UserCheck/><div><strong>{active}</strong><span>{isEn ? 'Active accounts' : 'Cuentas activas'}</span></div></article><article><Mail/><div><strong>{pending}</strong><span>{isEn ? 'Pending invitations' : 'Invitaciones pendientes'}</span></div></article><article><LockKeyhole/><div><strong>{modules.length}</strong><span>{isEn ? 'Controlled sections' : 'Secciones controladas'}</span></div></article></section>
    {notice && <section className={`users-invite-notice ${notice.type}`}><span>{notice.type === 'sent' ? <Send/> : notice.type === 'updated' ? <Check/> : <KeyRound/>}</span><div><strong>{notice.type === 'sent' ? (isEn ? 'Invitation email sent' : 'Email de invitación enviado') : notice.type === 'updated' ? (isEn ? 'Access updated' : 'Acceso actualizado') : notice.copied ? (isEn ? 'Invitation link copied' : 'Enlace copiado') : (isEn ? 'Development invitation ready' : 'Invitación de desarrollo lista')}</strong><p>{notice.type === 'preview' ? (isEn ? `Email delivery is not configured. Share this one-time link with ${notice.email}.` : `El envío de email no está configurado. Comparte este enlace de un solo uso con ${notice.email}.`) : notice.type === 'updated' && notice.sessionsRevoked ? (isEn ? `${notice.email} must sign in again with the newly assigned access.` : `${notice.email} deberá iniciar sesión nuevamente con los accesos recién asignados.`) : notice.email}</p>{notice.url && <div><input readOnly value={notice.url}/><button onClick={() => copyLink(notice.url)}><Copy/>{isEn ? 'Copy' : 'Copiar'}</button></div>}</div><button className="notice-close" onClick={() => setNotice(null)}><X/></button></section>}
    {error && !modal && <p className="users-admin-error"><AlertTriangle/>{error}</p>}
    <section className="users-directory-card">
      <header><div><span>{isEn ? 'ACCESS DIRECTORY' : 'DIRECTORIO DE ACCESO'}</span><h2>{isEn ? 'Operational Hub accounts' : 'Cuentas de Operational Hub'}</h2><p>{isEn ? 'Account status, invitation delivery and effective section access.' : 'Estado de cuenta, entrega de invitación y acceso efectivo por sección.'}</p></div><button onClick={load}><RefreshCw/>{isEn ? 'Refresh' : 'Actualizar'}</button></header>
      {loading ? <div className="users-directory-loading"><RefreshCw/><span>{isEn ? 'Loading users…' : 'Cargando usuarios…'}</span></div> : !users.length ? <div className="users-directory-empty"><UserRound/><h3>{isEn ? 'No server users yet' : 'Todavía no hay usuarios en el servidor'}</h3><p>{isEn ? 'Invite the first person and assign only the sections required for their role.' : 'Invita a la primera persona y asigna únicamente las secciones necesarias para su función.'}</p>{canManage && <button onClick={openInvite}><UserPlus/>{isEn ? 'Invite first user' : 'Invitar primer usuario'}</button>}</div> : <div className="users-directory-list">{users.map(user => {
        const granted = modules.filter(module => ['view','manage'].includes(user.permissions?.[module.id]));
        return <article key={user.id}><div className="users-person"><span>{initials(user.name)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div><div className={`users-account-status ${user.accountStatus}`}><i/>{statusLabel(user.accountStatus, isEn)}<small>{user.accountStatus === 'invited' ? (user.deliveryStatus === 'sent' ? (isEn ? 'Email sent' : 'Email enviado') : (isEn ? 'Development link' : 'Enlace de desarrollo')) : user.lastLoginAt ? `${isEn ? 'Last login' : 'Último acceso'} ${new Date(user.lastLoginAt).toLocaleDateString(isEn ? 'en-US' : 'es-US')}` : ''}</small></div><div className="users-access-cell"><strong>{accessLabel(user.accessProfile, isEn)}</strong><span>{granted.length} {isEn ? 'sections' : 'secciones'}</span><div>{granted.slice(0, 3).map(module => <small key={module.id}>{module.label}</small>)}{granted.length > 3 && <small>+{granted.length - 3}</small>}</div></div>{canManage && <div className="users-row-actions"><button onClick={() => openEditor(user)}>{isEn ? 'Manage' : 'Gestionar'}<ArrowRight/></button><button className="users-more" onClick={() => setMenuId(menuId === user.id ? '' : user.id)}><MoreHorizontal/></button>{menuId === user.id && <div className="users-action-menu">{user.accountStatus === 'invited' && <button onClick={() => resend(user)}><RefreshCw/>{isEn ? 'Resend invitation' : 'Reenviar invitación'}</button>}<button className="danger" onClick={() => remove(user)}><Trash2/>{isEn ? 'Remove user' : 'Eliminar usuario'}</button></div>}</div>}</article>;
      })}</div>}
    </section>
    {modal && <div className="users-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeModal()}><form className="users-access-modal" onSubmit={save} noValidate>
      <header><div><span>{editingId ? (isEn ? 'MANAGE ACCOUNT' : 'GESTIONAR CUENTA') : (isEn ? 'NEW INVITATION' : 'NUEVA INVITACIÓN')}</span><h2>{editingId ? (isEn ? 'Edit user access' : 'Editar acceso del usuario') : (isEn ? 'Invite a user' : 'Invitar un usuario')}</h2><p>{isEn ? 'Choose an access profile, then review the effective permissions before saving.' : 'Elige un perfil y revisa los permisos efectivos antes de guardar.'}</p></div><button type="button" onClick={closeModal}><X/></button></header>
      <div className="users-modal-body">
        <section className="users-identity-fields"><label>{isEn ? 'Full name' : 'Nombre completo'}<input value={draft.name} aria-invalid={Boolean(fieldErrors.name)} onChange={event => { setDraft({ ...draft, name:event.target.value }); setFieldErrors(current => ({ ...current, name:'' })); setError('') }} required/>{fieldErrors.name && <small className="users-field-error">{fieldErrors.name}</small>}</label><label>{isEn ? 'Work email' : 'Correo corporativo'}<input type="email" value={draft.email} aria-invalid={Boolean(fieldErrors.email)} onChange={event => { setDraft({ ...draft, email:event.target.value }); setFieldErrors(current => ({ ...current, email:'' })); setError('') }} disabled={Boolean(editingId)} required/>{fieldErrors.email && <small className="users-field-error">{fieldErrors.email}</small>}</label><label>{isEn ? 'Employment status' : 'Estado laboral'}<select value={draft.employmentStatus} onChange={event => setDraft({ ...draft, employmentStatus:event.target.value })}><option value="active">{isEn ? 'Active' : 'Activo'}</option><option value="inactive">{isEn ? 'Inactive · disable sign-in' : 'Inactivo · desactivar acceso'}</option></select></label></section>
        <section className="users-profile-picker"><header><strong>{isEn ? 'Access profile' : 'Perfil de acceso'}</strong><span>{isEn ? 'Choose one profile. Custom lets you combine multiple sections.' : 'Elige un perfil. Personalizado permite combinar varias secciones.'}</span></header><div>{[
          ['academy', GraduationIcon, isEn ? 'Academy only' : 'Solo Academy', isEn ? 'Learning and certificates.' : 'Aprendizaje y certificados.'],
          ['custom', SlidersIcon, isEn ? 'Custom' : 'Personalizado', isEn ? 'Select each section.' : 'Selecciona cada sección.'],
          ['admin', ShieldCheck, isEn ? 'Administrator' : 'Administrador', isEn ? 'All Hub sections + Roadmap.' : 'Todo el Hub + Roadmap.'],
          ['owner', KeyRound, isEn ? 'Executive' : 'Ejecutivo', isEn ? 'Includes private Corporate.' : 'Incluye Corporate privado.'],
        ].map(([value, Icon, title, description]) => <button type="button" key={value} className={draft.accessProfile === value ? 'active' : ''} onClick={() => changeProfile(value)}><Icon/><strong>{title}</strong><span>{description}</span>{draft.accessProfile === value && <Check/>}</button>)}</div></section>
        {draft.accessProfile === 'custom' ? <PermissionSelector modules={modules} permissions={draft.permissions} onChange={changePermission} onChangeAll={changeAllPermissions} disabled={saving} isEn={isEn}/> : <section className="users-preset-summary"><BadgeCheck/><div><strong>{accessLabel(draft.accessProfile, isEn)}</strong><p>{draft.accessProfile === 'academy' ? (isEn ? 'View access to Eastern Medical Academy only.' : 'Acceso de lectura únicamente a Eastern Medical Academy.') : draft.accessProfile === 'admin' ? (isEn ? 'Manage access to all Hub sections and Roadmap. Corporate remains excluded.' : 'Gestiona todas las secciones y Roadmap. Corporate permanece excluido.') : (isEn ? 'Full executive access, including Corporate.' : 'Acceso ejecutivo completo, incluido Corporate.')}</p></div></section>}
        {error && <p className="users-modal-error"><AlertTriangle/>{error}</p>}
      </div>
      <footer><div className={`users-save-summary ${identityReady ? '' : 'incomplete'}`}>{identityReady ? <CheckCircle2/> : <AlertTriangle/>}<span><strong>{selectedPermissions.length} {selectedPermissions.length === 1 ? (isEn ? 'section' : 'sección') : (isEn ? 'sections' : 'secciones')}</strong><small>{identityReady ? (isEn ? 'Your selections are saved when you press the blue button.' : 'Tus selecciones se guardan al presionar el botón azul.') : (isEn ? 'Full name and a valid work email are required to save.' : 'Se requiere nombre completo y un correo válido para guardar.')}</small></span></div><div><button type="button" onClick={closeModal}>{isEn ? 'Cancel' : 'Cancelar'}</button><button type="submit" className="primary-action" disabled={saving}><Send/>{saving ? (isEn ? 'Saving…' : 'Guardando…') : editingId ? (isEn ? 'Save selected access' : 'Guardar accesos seleccionados') : (isEn ? 'Save access & send invitation' : 'Guardar accesos y enviar invitación')}</button></div></footer>
    </form></div>}
  </div>;
}

function GraduationIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="m2 10 10-5 10 5-10 5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>;
}

function SlidersIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/></svg>;
}
