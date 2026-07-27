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

const applicationDefinitions = [
  {
    id: 'seven-insurance',
    name: 'Seven Insurance',
    logo: '/brand/seven-insurance.png',
    tone: 'seven',
    envKey: 'VITE_SEVEN_INSURANCE_URL',
    description: {
      en: 'Insurance operations, licensed workflows and client servicing.',
      es: 'Operaciones de seguros, flujos licenciados y servicio al cliente.',
    },
  },
  {
    id: 'scribex-health',
    name: 'ScribeX Health',
    logo: '/app-logos/scribex.svg',
    tone: 'scribex',
    envKey: 'VITE_SCRIBEX_HEALTH_URL',
    description: {
      en: 'Clinical documentation and intelligent medical scribing.',
      es: 'Documentación clínica y scribing médico inteligente.',
    },
  },
  {
    id: 'carecheck360',
    name: 'CareCheck360',
    logo: '/app-logos/carecheck360.svg',
    tone: 'carecheck',
    envKey: 'VITE_CARECHECK360_URL',
    description: {
      en: 'Chronic Care monitoring, monthly follow-up and documented care coordination.',
      es: 'Monitoreo de Chronic Care, seguimiento mensual y coordinación documentada.',
    },
  },
  {
    id: 'financial-hub',
    name: 'Financial Hub',
    logo: '/app-logos/financial-hub.svg',
    tone: 'financial',
    envKey: 'VITE_FINANCIAL_HUB_URL',
    description: {
      en: 'Financial visibility, planning and executive controls.',
      es: 'Visibilidad financiera, planificación y controles ejecutivos.',
    },
  },
  {
    id: 'marketing-suite',
    name: 'Marketing Suite',
    logo: '/app-logos/marketing-suite.svg',
    tone: 'marketing',
    envKey: 'VITE_MARKETING_SUITE_URL',
    description: {
      en: 'Campaign operations, CRM connections and performance.',
      es: 'Operaciones de campañas, conexión con CRM y rendimiento.',
    },
  },
  {
    id: 'executive-assistant',
    name: 'Executive Assistant',
    logo: '/app-logos/executive-assistant.svg',
    tone: 'executive',
    envKey: 'VITE_EXECUTIVE_ASSISTANT_URL',
    description: {
      en: 'Personal productivity, follow-up and executive coordination.',
      es: 'Productividad personal, seguimiento y coordinación ejecutiva.',
    },
  },
];

export const applicationRegistry = applicationDefinitions.map(application => {
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
