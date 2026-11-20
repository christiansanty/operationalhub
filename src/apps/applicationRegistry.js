import { applicationCatalog } from '../data/applicationCatalog.js';

const applicationEnvUrls = {
  VITE_SEVEN_INSURANCE_URL: import.meta.env.VITE_SEVEN_INSURANCE_URL,
  VITE_SCRIBEX_HEALTH_URL: import.meta.env.VITE_SCRIBEX_HEALTH_URL,
  VITE_CARECHECK360_URL: import.meta.env.VITE_CARECHECK360_URL,
  VITE_FINANCIAL_HUB_URL: import.meta.env.VITE_FINANCIAL_HUB_URL,
  VITE_MARKETING_SUITE_URL: import.meta.env.VITE_MARKETING_SUITE_URL,
  VITE_BINIUM_URL: import.meta.env.VITE_BINIUM_URL,
  VITE_EM_CONNECT_URL: import.meta.env.VITE_EM_CONNECT_URL,
  VITE_UNIVERSAL_URL: import.meta.env.VITE_UNIVERSAL_URL,
};

const resolveApplicationUrl = (envKey, defaultUrl = '') => {
  const candidate = String(applicationEnvUrls[envKey] || defaultUrl || '').trim();
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

export const applicationRegistry = applicationCatalog.map(application => {
  const url = resolveApplicationUrl(application.envKey, application.defaultUrl);
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
