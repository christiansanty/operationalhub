import React, { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardCheck, LockKeyhole, Plus, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { canExplicitResearchPermission } from '../auth/accessControl.js';

const agreementTypes = [
  ['clinical_trial_agreement', 'Clinical trial agreement', 'Acuerdo de ensayo clínico'],
  ['budget_agreement', 'Study budget agreement', 'Acuerdo de presupuesto del estudio'],
  ['vendor_agreement', 'Research vendor agreement', 'Acuerdo con vendor de Research'],
  ['site_agreement', 'Site agreement', 'Acuerdo de sede'],
  ['other', 'Other Research agreement', 'Otro acuerdo de Research'],
];

const statuses = ['draft', 'review', 'approved', 'executed', 'expired', 'blocked'];
const initialForm = { studyId: '', agreementType: 'clinical_trial_agreement', counterparty: '', status: 'draft', effectiveAt: '', sourceReference: '', notes: '' };

const displayType = (value, isEn) => {
  const match = agreementTypes.find(item => item[0] === value);
  return match ? match[isEn ? 1 : 2] : value;
};

export default function ResearchAgreements({ lang = 'en', session }) {
  const isEn = lang === 'en';
  const canView = canExplicitResearchPermission(session, 'research-studies:view') || canExplicitResearchPermission(session, 'research-studies:manage');
  const canManage = canExplicitResearchPermission(session, 'research-studies:manage', 'manage');
  const [agreements, setAgreements] = useState([]);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const load = async () => {
    if (!canView) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [agreementResponse, studyResponse] = await Promise.all([
        fetch('/api/research/agreements', { cache: 'no-store' }),
        fetch('/api/research/studies', { cache: 'no-store' }),
      ]);
      const agreementPayload = await agreementResponse.json();
      const studyPayload = await studyResponse.json();
      if (!agreementResponse.ok) throw new Error(agreementPayload.error || (isEn ? 'Research agreements are not available.' : 'Los acuerdos de Research no están disponibles.'));
      if (!studyResponse.ok) throw new Error(studyPayload.error || (isEn ? 'Research studies are not available.' : 'Los estudios de Research no están disponibles.'));
      setAgreements(agreementPayload.agreements || []);
      setStudies(studyPayload.studies || []);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [canView]);

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const saveAgreement = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/research/agreements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isEn ? 'Agreement could not be saved.' : 'No se pudo guardar el acuerdo.'));
      setForm(initialForm); setFormOpen(false); await load();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };

  if (!canView) return <section className="research-module research-agreements-page"><div className="research-empty"><LockKeyhole size={24}/><strong>{isEn ? 'Research study agreement permission required' : 'Se requiere permiso para acuerdos de estudios de Research'}</strong><p>{isEn ? 'Ask an administrator for research-studies:view or research-studies:manage. Insurance Contracting access does not grant access to Research agreements.' : 'Solicita research-studies:view o research-studies:manage. El acceso a Contratos de seguros no concede acceso a acuerdos de Research.'}</p></div></section>;

  return <section className="research-module research-agreements-page">
    <header className="research-module-header">
      <div><span className="eyebrow">{isEn ? 'RESEARCH-ONLY RESOURCE' : 'RECURSO EXCLUSIVO DE RESEARCH'}</span><h2>{isEn ? 'Research Study Agreements' : 'Acuerdos de Estudios de Research'}</h2><p>{isEn ? 'Manual register for the agreements Research creates for new studies. This workspace is separate from Insurance Contracting.' : 'Registro manual de los acuerdos que Research crea para nuevos estudios. Este espacio está separado de Contratos de seguros.'}</p></div>
      <button className="icon-btn" onClick={load} title={isEn ? 'Refresh' : 'Actualizar'}><RefreshCw size={17}/></button>
    </header>
    <div className="research-boundary research-agreement-boundary"><ShieldCheck size={18}/><span><strong>{isEn ? 'Scope boundary' : 'Límite de alcance'}</strong>{isEn ? ' Study agreements belong to Eastern Medical Research. Insurance carrier contracting remains in the shared Contracting module.' : 'Los acuerdos de estudios pertenecen a Eastern Medical Research. La contratación con carriers permanece en el módulo compartido de Contratos.'}</span></div>
    {error && <div className="research-error"><AlertTriangle size={15}/>{error}</div>}
    <div className="research-section-heading"><div><span>{isEn ? 'MANUAL REGISTER' : 'REGISTRO MANUAL'}</span><h3>{isEn ? 'Study agreements' : 'Acuerdos de estudios'}</h3></div>{canManage && <button className="primary" onClick={() => setFormOpen(true)}><Plus size={16}/>{isEn ? 'Add agreement' : 'Añadir acuerdo'}</button>}</div>
    {loading ? <div className="research-empty"><RefreshCw/><p>{isEn ? 'Loading Research agreements…' : 'Cargando acuerdos de Research…'}</p></div> : <div className="research-table-wrap"><table className="research-table research-agreements-table"><thead><tr><th>{isEn ? 'Study' : 'Estudio'}</th><th>{isEn ? 'Agreement' : 'Acuerdo'}</th><th>{isEn ? 'Counterparty' : 'Contraparte'}</th><th>{isEn ? 'Status' : 'Estado'}</th><th>{isEn ? 'Effective' : 'Vigencia'}</th><th>{isEn ? 'Reference' : 'Referencia'}</th></tr></thead><tbody>{agreements.map(row => <tr key={row.id}><td><strong>{row.studyCode || '—'}</strong><small>{row.studyTitle || '—'}</small></td><td>{displayType(row.agreementType, isEn)}</td><td>{row.counterparty}</td><td><span className={`record-status ${row.status === 'executed' || row.status === 'approved' ? 'active' : 'upcoming'}`}>{row.status}</span></td><td>{row.effectiveAt || '—'}</td><td>{row.sourceReference || '—'}</td></tr>)}{!agreements.length && <tr><td colSpan="6" className="research-table-empty">{isEn ? 'No Research study agreements have been entered manually.' : 'No se han ingresado manualmente acuerdos de estudios de Research.'}</td></tr>}</tbody></table></div>}
    {canManage && formOpen && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setFormOpen(false)}><form className="quick-modal research-agreement-modal" onSubmit={saveAgreement}><div className="modal-heading"><div><span>{isEn ? 'MANUAL RESEARCH RECORD' : 'REGISTRO MANUAL DE RESEARCH'}</span><h2>{isEn ? 'Add study agreement' : 'Añadir acuerdo de estudio'}</h2></div><button type="button" onClick={() => setFormOpen(false)}>×</button></div><div className="lead-form-grid"><label>{isEn ? 'Research study' : 'Estudio de Research'}<select required value={form.studyId} onChange={event => update('studyId', event.target.value)}><option value="">{isEn ? 'Select a study' : 'Selecciona un estudio'}</option>{studies.map(study => <option key={study.id} value={study.id}>{study.studyCode} · {study.title}</option>)}</select></label><label>{isEn ? 'Agreement type' : 'Tipo de acuerdo'}<select value={form.agreementType} onChange={event => update('agreementType', event.target.value)}>{agreementTypes.map(([value, en, es]) => <option key={value} value={value}>{isEn ? en : es}</option>)}</select></label><label>{isEn ? 'Counterparty' : 'Contraparte'}<input required value={form.counterparty} onChange={event => update('counterparty', event.target.value)} placeholder={isEn ? 'Sponsor, site or Research vendor' : 'Patrocinador, sede o vendor de Research'}/></label><label>{isEn ? 'Status' : 'Estado'}<select value={form.status} onChange={event => update('status', event.target.value)}>{statuses.map(status => <option key={status} value={status}>{status}</option>)}</select></label><label>{isEn ? 'Effective date' : 'Fecha de vigencia'}<input type="date" value={form.effectiveAt} onChange={event => update('effectiveAt', event.target.value)}/></label><label>{isEn ? 'Source reference' : 'Referencia fuente'}<input value={form.sourceReference} onChange={event => update('sourceReference', event.target.value)} placeholder={isEn ? 'Internal file or source ID' : 'Archivo interno o ID de fuente'}/></label><label className="research-agreement-notes">{isEn ? 'Notes' : 'Notas'}<textarea rows="3" value={form.notes} onChange={event => update('notes', event.target.value)}/></label></div><p className="research-form-note"><ClipboardCheck size={15}/>{isEn ? 'Manual entry only for now. No insurance contracting records are copied into this register.' : 'Por ahora, solo ingreso manual. No se copian registros de Contratos de seguros a este registro.'}</p><div className="modal-actions"><button type="button" onClick={() => setFormOpen(false)}>{isEn ? 'Cancel' : 'Cancelar'}</button><button className="primary" disabled={saving || !studies.length} type="submit"><Save size={16}/>{saving ? (isEn ? 'Saving…' : 'Guardando…') : (isEn ? 'Save agreement' : 'Guardar acuerdo')}</button></div></form></div>}
  </section>;
}
