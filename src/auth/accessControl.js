const entityKeys = ['medical', 'care305', 'aesthetics', 'seven', 'research'];
const permissionLevels = new Set(['view', 'manage']);
export const researchPermissionKeys = [
  'research-leads:view', 'research-leads:manage', 'research-leads:contact:view',
  'research-studies:view', 'research-studies:manage', 'research-sync:manage',
  'research-fundamental-studies:view', 'research-fundamental-studies:manage',
];

export const pagePermissionKey = page => {
  const entityKey = entityKeys.find(key => String(page || '').startsWith(`${key}-`));
  if (entityKey) return `entity-${entityKey}`;
  if (['academy', 'learning', 'systems', 'certificates', 'team'].includes(page)) return 'academy';
  return ({
    hub:'dashboard', leads:'leads', protocols:'protocols', licenses:'licenses',
    aca:'doctor-licenses', 'doctor-licenses':'doctor-licenses', contracting:'contracting', 'research-agreements':'research-studies', credentialing:'credentialing',
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

export const explicitPermissionLevel = (session, permissionKey) => {
  if (!session || !permissionKey) return 'none';
  const value = session.permissions?.[permissionKey];
  return permissionLevels.has(value) ? value : 'none';
};

export const canExplicitResearchPermission = (session, permissionKey, required = 'view') => {
  if (permissionKey === 'entity-research') return permissionLevels.has(explicitPermissionLevel(session, permissionKey));
  if (!researchPermissionKeys.includes(permissionKey)) return false;
  const rank = { none:0, view:1, manage:2 };
  return rank[explicitPermissionLevel(session, permissionKey)] >= rank[required];
};

export const canSessionAccessPage = (session, page) => {
  if (!session) return false;
  if (page === 'corporate') return session.role === 'owner' || session.scope === 'full';
  if (page === 'roadmap') return session.role === 'admin' || session.role === 'owner' || session.scope === 'full';
  if (page === 'team') return permissionLevel(session, 'academy') === 'manage';
  if (page === 'staff') return true;
  if (page === 'it') return Object.values(session.permissions || {}).some(value => permissionLevels.has(value));
  if (page === 'research-agreements' && !canExplicitResearchPermission(session, 'entity-research')) return false;
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
  if (page === 'it') return session.permissions?.['it:manage'] === 'manage';
  return permissionLevel(session, pagePermissionKey(page)) === 'manage';
};

export const canSessionAccessApplication = (session, applicationId) =>
  permissionLevels.has(permissionLevel(session, `app-${applicationId}`));

export const accessiblePages = [
  'hub', 'medical-overview', 'care305-overview', 'aesthetics-overview', 'seven-overview',
  'research-overview', 'leads', 'protocols', 'licenses', 'doctor-licenses', 'credentialing', 'contracting',
  'staff', 'academy', 'users', 'roadmap', 'it',
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
