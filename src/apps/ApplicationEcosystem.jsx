import React from 'react';
import { ExternalLink, LockKeyhole } from 'lucide-react';
import { applicationRegistry } from './applicationRegistry.js';

export default function ApplicationEcosystem({
  lang,
  canAccessApplication = () => true,
}) {
  const isEn = lang === 'en';
  const applications = applicationRegistry.filter(application =>
    canAccessApplication(application.id)
  );
  const connected = applications.filter(application => application.configured).length;

  if (!applications.length) return null;

  const openApplication = application => {
    if (!application.configured) return;
    window.open(application.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="owned-applications-section">
      <div className="section-heading owned-apps-heading">
        <div>
          <span>{isEn ? 'EM GROUP APPLICATIONS' : 'APLICACIONES DE EM GROUP'}</span>
          <h2>{isEn ? 'Our application ecosystem' : 'Nuestro ecosistema de aplicaciones'}</h2>
          <p>
            {isEn
              ? 'Open an authorized application. Its own secure sign-in will protect access.'
              : 'Abre una aplicación autorizada. Su propio inicio de sesión seguro protegerá el acceso.'}
          </p>
        </div>
        <span className={`apps-template-badge ${connected ? 'connected' : ''}`}>
          {connected}/{applications.length} {isEn ? 'CONNECTED' : 'CONECTADAS'}
        </span>
      </div>

      <div className="owned-applications-grid">
        {applications.map(application => (
          <article
            className={`${application.tone} ${application.configured ? 'connected' : 'pending'}`}
            key={application.id}
          >
            <img
              className="owned-app-logo"
              src={application.logo}
              alt={`${application.name} logo`}
            />
            <div>
              <small>
                {application.configured
                  ? (isEn ? 'SECURE LINK READY' : 'ENLACE SEGURO LISTO')
                  : (isEn ? 'URL REQUIRED' : 'REQUIERE URL')}
              </small>
              <h3>{application.name}</h3>
              <p>{application.description[lang]}</p>
            </div>
            <button
              type="button"
              disabled={!application.configured}
              onClick={() => openApplication(application)}
              aria-label={
                application.configured
                  ? `${isEn ? 'Open' : 'Abrir'} ${application.name}`
                  : `${application.name} · ${isEn ? 'Connection pending' : 'Conexión pendiente'}`
              }
              title={
                application.configured
                  ? `${isEn ? 'Open' : 'Abrir'} ${application.name}`
                  : (isEn ? 'Production URL pending' : 'URL de producción pendiente')
              }
            >
              {application.configured ? <ExternalLink /> : <LockKeyhole />}
              <span>
                {application.configured
                  ? (isEn ? 'Open' : 'Abrir')
                  : (isEn ? 'Pending' : 'Pendiente')}
              </span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
