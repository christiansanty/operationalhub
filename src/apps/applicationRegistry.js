import { applicationCatalog } from '../data/applicationCatalog.js';

const resolveApplicationUrl = envKey => {
  const candidate = String(import.meta.env[envKey] || '').trim();
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

export const applicationRegistry = applicationCatalog.map(application => {
  const url = resolveApplicationUrl(application.envKey);
  return {
    ...application,
    url,
    configured: Boolean(url),
    permissionKey: `app-${application.id}`,
  };
});

export const applicationPermissionModules = applicationRegistry.map(application => ({
  id: application.permissionKey,
  label: `App · ${application.name}`,
}));
