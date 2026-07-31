const entityKeys = ['medical', 'care305', 'aesthetics', 'seven', 'research'];
const permissionLevels = new Set(['view', 'manage']);

export const pagePermissionKey = page => {
  const entityKey = entityKeys.find(key => String(page || '').startsWith(`${key}-`));
  if (entityKey) return `entity-${entityKey}`;
  if (['academy', 'learning', 'systems', 'certificates', 'team'].includes(page)) return 'academy';
  return ({
    hub:'dashboard', leads:'leads', protocols:'protocols', licenses:'licenses',
    aca:'doctor-licenses', 'doctor-licenses':'doctor-licenses', contracting:'contracting',
    staff:'human-resources', users:'admin-users',
  })[page] || null;
};

export const permissionLevel = (session, permissionKey) => {
  if (!session || !permissionKey) return 'none';
  if (session.role === 'owner' || session.scope === 'full') return 'manage';
  if (session.role === 'admin') return 'manage';
  const value = session.permissions?.[permissionKey]
    || (permissionKey === 'human-resources' ? session.permissions?.personnel : null);
  return permissionLevels.has(value) ? value : 'none';
};

export const canSessionAccessPage = (session, page) => {
  if (!session) return false;
  if (page === 'corporate') return session.role === 'owner' || session.scope === 'full';
  if (page === 'roadmap') return session.role === 'admin' || session.role === 'owner' || session.scope === 'full';
  if (page === 'team') return permissionLevel(session, 'academy') === 'manage';
  if (page === 'staff') return true;
  const key = pagePermissionKey(page);
  if (!key) return false;
  if (key === 'dashboard' && Object.entries(session.permissions || {}).some(([permissionKey, value]) =>
    permissionKey.startsWith('app-') && permissionLevels.has(value))) return true;
  return permissionLevels.has(permissionLevel(session, key));
};

export const canSessionManagePage = (session, page) => {
  if (!canSessionAccessPage(session, page)) return false;
  if (page === 'corporate') return session.role === 'owner' || session.scope === 'full';
  if (page === 'roadmap') return session.role === 'admin' || session.role === 'owner' || session.scope === 'full';
  return permissionLevel(session, pagePermissionKey(page)) === 'manage';
};

export const canSessionAccessApplication = (session, applicationId) =>
  permissionLevels.has(permissionLevel(session, `app-${applicationId}`));

export const accessiblePages = [
  'hub', 'medical-overview', 'care305-overview', 'aesthetics-overview', 'seven-overview',
  'research-overview', 'leads', 'protocols', 'licenses', 'doctor-licenses', 'contracting',
  'staff', 'academy', 'users', 'roadmap',
];

export const firstAccessiblePage = session => {
  if(session?.scope==='academy'&&canSessionAccessPage(session,'academy'))return 'academy';
  return accessiblePages.find(page => canSessionAccessPage(session, page)) || '';
};

export const sessionAccessSignature = session => JSON.stringify({
  id:session?.id || '', role:session?.role || '', scope:session?.scope || '',
  accessProfile:session?.accessProfile || '', updatedAt:session?.updatedAt || '',
  permissions:session?.permissions || {},
});
