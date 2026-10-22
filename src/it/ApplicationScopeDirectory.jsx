import React, { useState } from 'react';
import { Bot, Boxes, ChevronDown, GitCommitHorizontal, Globe2, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';

const text = (value, lang) => value?.[lang] || value?.en || value?.es || String(value || '');

function syncLabel(value, isEn) {
  if (value === 'PUSH_RECEIVED') return isEn ? 'Synced from push' : 'Sincronizado por push';
  return isEn ? 'Catalog definition' : 'Definición del catálogo';
}

function formatDate(value, isEn) {
  if (!value) return isEn ? 'Not synchronized yet' : 'Aún no sincronizado';
  return new Date(value).toLocaleString(isEn ? 'en-US' : 'es-US');
}

export default function ApplicationScopeDirectory({ scopes = [], lang = 'en', loading = false, onRefresh }) {
  const isEn = lang === 'en';
  const [openApplicationId, setOpenApplicationId] = useState(null);
  const [openModuleKey, setOpenModuleKey] = useState(null);

  return <section className="it-card it-scope-card">
    <header className="it-section-heading">
      <div>
        <span>{isEn ? 'PUBLIC APPLICATION SCOPE' : 'SCOPE PÚBLICO POR APLICACIÓN'}</span>
        <h2>{isEn ? 'What each application does' : 'Qué hace cada aplicación'}</h2>
        <p>{isEn ? 'Everyone with access to IT can open an application, inspect its modules and understand its tools, AI-agent role and synchronization status.' : 'Toda persona con acceso a IT puede abrir una aplicación, revisar sus módulos y entender sus herramientas, función de los agentes de IA y estado de sincronización.'}</p>
      </div>
      <div className="it-scope-heading-actions"><span className="it-permission-badge"><Globe2 size={14}/>{isEn ? 'Visible to IT users' : 'Visible para usuarios de IT'}</span><button className="icon-btn" onClick={onRefresh} title={isEn ? 'Refresh scope' : 'Actualizar scope'} disabled={loading}><RefreshCw size={16}/></button></div>
    </header>
    {loading ? <div className="it-empty"><RefreshCw/><p>{isEn ? 'Loading application scope…' : 'Cargando scope de aplicaciones…'}</p></div> : <div className="it-scope-directory">{scopes.map(scope => {
      const open = openApplicationId === scope.applicationId;
      return <article className={`it-scope-application ${open ? 'open' : ''}`} key={scope.applicationId}>
        <button className="it-scope-application-toggle" onClick={() => setOpenApplicationId(open ? null : scope.applicationId)} aria-expanded={open}>
          <span className="it-scope-app-icon"><Boxes size={19}/></span><span className="it-scope-app-title"><strong>{scope.applicationName}</strong><small>{text(scope.purpose, lang)}</small></span><span className="it-scope-app-status"><b className={scope.syncState === 'PUSH_RECEIVED' ? 'synced' : ''}>{syncLabel(scope.syncState, isEn)}</b><small>{scope.modules.length} {isEn ? (scope.modules.length === 1 ? 'module' : 'modules') : (scope.modules.length === 1 ? 'módulo' : 'módulos')}</small></span><ChevronDown className="it-scope-chevron" size={18}/>
        </button>
        {open && <div className="it-scope-application-detail">
          <div className="it-scope-facts"><span><b>{isEn ? 'Version' : 'Versión'}</b>{scope.version}</span><span><b>{isEn ? 'Last sync' : 'Última sincronización'}</b>{formatDate(scope.lastSyncedAt, isEn)}</span><span><b>{isEn ? 'Commit' : 'Commit'}</b>{scope.commitSha || (isEn ? 'Catalog seed' : 'Catálogo inicial')}</span><span><b>{isEn ? 'Repository' : 'Repositorio'}</b>{scope.repository || (isEn ? 'Not connected' : 'Sin conexión')}</span></div>
          <div className="it-scope-purpose"><ShieldCheck size={16}/><div><b>{isEn ? 'Application purpose' : 'Propósito de la aplicación'}</b><p>{text(scope.purpose, lang)}</p></div></div>
          <div className="it-scope-modules"><div className="it-scope-subheading"><Wrench size={16}/><strong>{isEn ? 'Modules and tools' : 'Módulos y herramientas'}</strong></div>{scope.modules.map(module => {
            const moduleKey = `${scope.applicationId}:${module.id}`;
            const moduleOpen = openModuleKey === moduleKey;
            return <div className={`it-scope-module ${moduleOpen ? 'open' : ''}`} key={module.id}>
              <button className="it-scope-module-toggle" onClick={() => setOpenModuleKey(moduleOpen ? null : moduleKey)} aria-expanded={moduleOpen}><span><strong>{text(module.name, lang)}</strong><small>{module.tools.length} {isEn ? (module.tools.length === 1 ? 'tool' : 'tools') : (module.tools.length === 1 ? 'herramienta' : 'herramientas')}</small></span><ChevronDown size={16}/></button>
              {moduleOpen && <div className="it-scope-module-detail"><p>{text(module.summary, lang)}</p><div className="it-scope-tool-list">{module.tools.map(tool => <span key={tool}><Wrench size={12}/>{tool}</span>)}</div><div className="it-scope-ai-role"><Bot size={15}/><div><b>{isEn ? 'AI-agent function' : 'Función del agente de IA'}</b><p>{text(module.aiRole, lang)}</p></div></div></div>}
            </div>;
          })}</div>
          {!!scope.aiAgents?.length && <div className="it-scope-agents"><div className="it-scope-subheading"><Bot size={16}/><strong>{isEn ? 'AI agents in this application' : 'Agentes de IA en esta aplicación'}</strong></div>{scope.aiAgents.map(agent => <div className="it-scope-agent" key={agent.id || text(agent.name, lang)}><strong>{text(agent.name, lang)}</strong><p>{text(agent.function, lang)}</p></div>)}</div>}
        </div>}
      </article>;
    })}{!scopes.length && <div className="it-empty"><Boxes/><p>{isEn ? 'No application scope has been synchronized yet.' : 'Todavía no hay scope de aplicaciones sincronizado.'}</p></div>}</div>}
  </section>;
}
