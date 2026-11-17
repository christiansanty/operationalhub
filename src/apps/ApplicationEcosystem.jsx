import React from 'react';
import { ExternalLink } from 'lucide-react';
import { applicationRegistry } from './applicationRegistry.js';

export default function ApplicationEcosystem({
  lang,
  canAccessApplication = () => true,
}) {
  const isEn = lang === 'en';
  const applications = applicationRegistry.filter(application =>
    canAccessApplication(application.id)
  );
  if (!applications.length) return null;

  return (
    <section className="owned-applications-section">
      <div className="section-heading owned-apps-heading">
        <div>
          <span>{isEn ? 'EM GROUP APPLICATIONS' : 'APLICACIONES DE EM GROUP'}</span>
          <h2>{isEn ? 'Our applications' : 'Nuestras aplicaciones'}</h2>
        </div>
      </div>

      <div className="owned-applications-grid">
        {applications.map(application => {
          const content = <>
            <img className="owned-app-logo" src={application.logo} alt={`${application.name} logo`} />
            <span className="owned-app-copy"><strong>{application.name}</strong><small>{application.description[lang]}</small></span>
            {application.configured && <ExternalLink className="owned-app-link-icon" aria-hidden="true" />}
          </>;
          return application.configured
            ? <a className={`owned-app-link ${application.tone}`} href={application.url} target="_blank" rel="noreferrer" key={application.id}>{content}</a>
            : <div className={`owned-app-link unavailable ${application.tone}`} aria-label={`${application.name} · ${isEn ? 'Link pending' : 'Enlace pendiente'}`} key={application.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
