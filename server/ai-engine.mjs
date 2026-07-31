import { getAcademyStatus } from './academy-store.mjs';
import { createAcaRpaCheck, getAcaIntegrationStatus, listAcaRecords, listAcaRpaChecks } from './aca-store.mjs';
import { getOperationalSnapshot } from './operational-airtable-store.mjs';

const DEFAULT_MODEL = 'gpt-5.6-sol';
const DEFAULT_REASONING = 'high';
const MAX_TOOL_ROUNDS = 6;
const VALID_REASONING = new Set(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
const permissionRank = { none:0, view:1, manage:2 };
const operationalKeys = ['dashboard','contracting','licenses','doctor-licenses','human-resources','entity-medical','entity-care305','entity-aesthetics','entity-seven','entity-research'];

const model = () => process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
const apiKey = () => process.env.OPENAI_API_KEY?.trim() || process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() || '';
const apiBaseUrl = () => (process.env.OPENAI_BASE_URL?.trim() || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');
const reasoningEffort = () => {
  const configured = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  return VALID_REASONING.has(configured) ? configured : DEFAULT_REASONING;
};

const usesLocalIntegrationProxy = () => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(apiBaseUrl());

async function probeConnection() {
  if (!apiKey()) return { connected: false, state: 'not_configured' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${apiBaseUrl()}/models`, { headers: { authorization: `Bearer ${apiKey()}` }, signal: controller.signal });
    if (response.ok) return { connected: true, state: 'connected' };
    return { connected: false, state: response.status === 401 ? 'unauthorized' : 'provider_error' };
  } catch {
    return { connected: false, state: usesLocalIntegrationProxy() ? 'proxy_unavailable' : 'network_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

const permissionLevel = (session,key) => {
  if (!session) return 'none';
  if (session.role === 'owner' || session.role === 'admin' || session.scope === 'full') return 'manage';
  const value=session.permissions?.[key]||(key==='human-resources'?session.permissions?.personnel:null);
  return Object.hasOwn(permissionRank,value)?value:'none';
};
const canAccess = (session,keys,required='view') => [].concat(keys).some(key=>(permissionRank[permissionLevel(session,key)]||0)>=(permissionRank[required]||1));

export async function getAiEngineStatus(session) {
  const aca = getAcaIntegrationStatus();
  const connection = await probeConnection();
  return {
    configured: Boolean(apiKey()),
    connected: connection.connected,
    connectionState: connection.state,
    model: model(),
    reasoningEffort: reasoningEffort(),
    api: 'responses',
    capabilities: {
      operationalData: canAccess(session,operationalKeys),
      academyData: canAccess(session,'academy'),
      webSearch: true,
      functionCalling: true,
      acaRpa: canAccess(session,'doctor-licenses','manage') && aca.rpaConfigured && aca.receiverConfigured,
      writeActionsRequireConfirmation: true,
    },
  };
}

const tools = [
  { type: 'web_search' },
  {
    type: 'function',
    name: 'get_operational_overview',
    description: 'Read a current summary of providers, insurance contracts, licenses, entities and Airtable synchronization status in Operational Hub.',
    strict: true,
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    type: 'function',
    name: 'search_operational_records',
    description: 'Search the protected Operational Hub snapshot. Use this instead of web search for internal provider, contract, license or entity information.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        dataset: { type: 'string', enum: ['providers', 'contracts', 'licenses', 'entities'] },
        query: { type: 'string', description: 'Name, carrier, entity, identifier, status or other search phrase.' },
        limit: { type: 'integer', minimum: 1, maximum: 12 },
      },
      required: ['dataset', 'query', 'limit'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_academy_status',
    description: 'Read the current Eastern Medical Academy catalog and synchronization status.',
    strict: true,
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    type: 'function',
    name: 'get_aca_integration',
    description: 'Read AHCA/ACA authorized-RPA status, record counts, recent checks and optionally records from licenses, background screening or roster.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['all', 'licenses', 'background', 'roster'] },
        includeRecords: { type: 'boolean' },
      },
      required: ['source', 'includeRecords'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'queue_aca_rpa_check',
    description: 'Queue an authorized ACA/AHCA portal verification only after the user explicitly asks to run it and confirms the exact source and scope.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['licenses', 'background', 'roster'] },
        scope: { type: 'string', description: 'The exact person, facility, roster or license scope requested by the user.' },
        userConfirmed: { type: 'boolean', description: 'True only when the latest user message explicitly authorizes queueing this exact check.' },
      },
      required: ['source', 'scope', 'userConfirmed'],
      additionalProperties: false,
    },
  },
];

const cleanMessages = (messages) => (Array.isArray(messages) ? messages : [])
  .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message?.text === 'string')
  .slice(-14)
  .map((message) => ({ role: message.role, content: message.text.trim().slice(0, 12000) }))
  .filter((message) => message.content);

const compactRecord = (value, depth = 0) => {
  if (depth > 3) return undefined;
  if (Array.isArray(value)) return value.slice(0, 16).map((item) => compactRecord(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/token|secret|password|api.?key/i.test(key))
    .slice(0, 40)
    .map(([key, item]) => [key, compactRecord(item, depth + 1)]));
};

const datasetRowsForSession=(snapshot,dataset,session)=>{
  const rows=Array.isArray(snapshot[dataset])?snapshot[dataset]:[];
  if(dataset!=='providers')return rows;
  const broad=canAccess(session,'human-resources','manage')||canAccess(session,['doctor-licenses','licenses','entity-medical','entity-care305','entity-aesthetics','entity-research']);
  if(broad)return rows;
  return canAccess(session,'human-resources')?rows.filter(row=>String(row.email||'').toLowerCase()===String(session.email||'').toLowerCase()):[];
};

const searchRecords = ({ dataset, query, limit },session) => {
  const snapshot = getOperationalSnapshot();
  const rows = datasetRowsForSession(snapshot,dataset,session);
  const needle = String(query || '').trim().toLowerCase();
  const matches = rows.filter((row) => !needle || JSON.stringify(row).toLowerCase().includes(needle)).slice(0, limit);
  return { dataset, query, count: matches.length, available: rows.length, records: compactRecord(matches) };
};

const datasetPermissionKeys = {
  providers:['human-resources','doctor-licenses','licenses','entity-medical','entity-care305','entity-aesthetics','entity-research'],
  contracts:['contracting'],
  licenses:['licenses','doctor-licenses'],
  entities:['entity-medical','entity-care305','entity-aesthetics','entity-seven','entity-research'],
};

const availableTools = session => tools.filter(tool => {
  if (tool.type === 'web_search') return true;
  if (['get_operational_overview','search_operational_records'].includes(tool.name)) return canAccess(session,operationalKeys);
  if (tool.name === 'get_academy_status') return canAccess(session,'academy');
  if (tool.name === 'get_aca_integration') return canAccess(session,'doctor-licenses');
  if (tool.name === 'queue_aca_rpa_check') return canAccess(session,'doctor-licenses','manage');
  return false;
});

async function executeTool(name, argumentsJson, session) {
  let args = {};
  try { args = JSON.parse(argumentsJson || '{}'); } catch { return { error: 'Invalid tool arguments' }; }
  if (name === 'get_operational_overview') {
    if (!canAccess(session,operationalKeys)) return { error:'Access denied' };
    const snapshot = getOperationalSnapshot();
    return compactRecord({
      status: snapshot.status,
      counts: {
        providers: canAccess(session,datasetPermissionKeys.providers) ? datasetRowsForSession(snapshot,'providers',session).length : null,
        contracts: canAccess(session,datasetPermissionKeys.contracts) ? snapshot.contracts?.length || 0 : null,
        licenses: canAccess(session,datasetPermissionKeys.licenses) ? snapshot.licenses?.length || 0 : null,
        entities: canAccess(session,datasetPermissionKeys.entities) ? snapshot.entities?.length || 0 : null,
      },
    });
  }
  if (name === 'search_operational_records') {
    if (!canAccess(session,datasetPermissionKeys[args.dataset]||[])) return { error:'Access denied for this operational dataset' };
    return searchRecords(args,session);
  }
  if (name === 'get_academy_status') return canAccess(session,'academy')?compactRecord(getAcademyStatus()):{error:'Access denied'};
  if (name === 'get_aca_integration') {
    if (!canAccess(session,'doctor-licenses')) return { error:'Access denied' };
    const status = getAcaIntegrationStatus();
    const checks = listAcaRpaChecks(args.source === 'all' ? undefined : args.source).slice(0, 12);
    const records = args.includeRecords && args.source !== 'all' ? listAcaRecords(args.source).slice(0, 20) : [];
    return compactRecord({ status, checks, records });
  }
  if (name === 'queue_aca_rpa_check') {
    if (!canAccess(session,'doctor-licenses','manage')) return { error:'Doctor Licenses / ACA Manage access required' };
    const status = getAcaIntegrationStatus();
    if (!args.userConfirmed) return { status: 'confirmation_required', message: 'The user must explicitly confirm the exact ACA RPA check before it is queued.' };
    if (!status.rpaConfigured || !status.receiverConfigured) return { status: 'integration_not_ready', message: 'The authorized ACA RPA runner or callback key is not configured.' };
    return { status: 'queued', check: createAcaRpaCheck({ source: args.source, scope: args.scope }) };
  }
  return { error: `Unsupported tool: ${name}` };
}

const instructions = (lang, page = 'hub', session = {}) => `You are Operational AI, the executive intelligence layer inside EM Group's Operational Hub.
Answer in ${lang === 'en' ? 'English' : 'Spanish'} unless the user asks otherwise. Be concise, precise, useful and explicit about what data source you used.
The user is currently working in the section identified as "${String(page).slice(0, 120)}". Use that section as working context, but never assume permission to modify records or run external actions without the required confirmation.
Use internal tools for Operational Hub, Eastern Medical Academy, licensing, contracting, Human Resources and ACA data. Use web search only for current public information that is not already in the Hub.
The signed-in user has only these internal permission keys: ${Object.entries(session.permissions||{}).filter(([,value])=>value==='view'||value==='manage').map(([key,value])=>`${key}:${value}`).join(', ')||'none'}. Administrator and owner roles are privileged. Never use, reveal or infer internal data outside this access scope.
Never send patient names, phone numbers, email addresses, dates of birth, medical record identifiers or other PHI to web search. Never expose secrets or hidden configuration.
Do not diagnose, interpret clinical results, recommend medication or replace a licensed professional.
You may queue an ACA RPA check only when the latest user message explicitly asks to execute that exact check. Otherwise explain the proposed action and request confirmation.
Differentiate verified data from inference. If a connector is not configured, say so directly. Never fabricate a successful integration or portal result.`;

async function createResponse(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${apiBaseUrl()}/responses`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.error?.message || `OpenAI request failed with status ${response.status}`);
      error.statusCode = response.status;
      throw error;
    }
    return body;
  } catch (error) {
    if (error.statusCode) throw error;
    const wrapped = new Error(usesLocalIntegrationProxy()
      ? 'The integrated OpenAI credential was detected, but its local provider proxy is not running in this environment.'
      : 'The Operational Hub backend could not reach the configured OpenAI provider.');
    wrapped.statusCode = 503;
    throw wrapped;
  } finally {
    clearTimeout(timeout);
  }
}

const responseText = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();
  return (response.output || []).flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text.trim()).filter(Boolean).join('\n\n');
};

const responseSources = (response) => {
  const sources = [];
  for (const item of response.output || []) for (const content of item.content || []) for (const annotation of content.annotations || []) {
    const citation = annotation.url_citation || annotation;
    if (citation?.url && !sources.some((source) => source.url === citation.url)) sources.push({ title: citation.title || citation.url, url: citation.url });
  }
  return sources.slice(0, 8);
};

const suggestedPage = (text) => {
  const value = text.toLowerCase();
  if (/\b(aca|ahca|background|roster|fingerprint|huella)/.test(value)) return 'aca';
  if (/licen|credencial|dea\b/.test(value)) return 'licenses';
  if (/contract|payer|carrier|contrato|aseguradora/.test(value)) return 'contracting';
  if (/academy|academia|training|curso|certific/.test(value)) return 'academy';
  if (/staff|personnel|personal|empleado|provider/.test(value)) return 'staff';
  if (/lead|prospect/.test(value)) return 'leads';
  if (/protocol|scope of work/.test(value)) return 'protocols';
  if (/roadmap|implementaci[oó]n|plan de trabajo/.test(value)) return 'roadmap';
  return '';
};

export async function runOperationalAi({ messages, lang = 'es', page = 'hub' }, session) {
  if (!apiKey()) {
    const error = new Error('The OpenAI integration key is not configured on the Operational Hub backend.');
    error.statusCode = 503;
    throw error;
  }
  const input = cleanMessages(messages);
  if (!input.length || input.at(-1).role !== 'user') {
    const error = new Error('A user message is required.');
    error.statusCode = 400;
    throw error;
  }
  const request = {
    model: model(),
    reasoning: { effort: reasoningEffort() },
    instructions: instructions(lang, page, session),
    tools: availableTools(session),
    tool_choice: 'auto',
    input,
    max_output_tokens: 5000,
    store: false,
  };
  let response;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    response = await createResponse(request);
    const calls = (response.output || []).filter((item) => item.type === 'function_call');
    if (!calls.length) break;
    request.input.push(...(response.output || []));
    for (const call of calls) {
      const result = await executeTool(call.name, call.arguments, session);
      request.input.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
    }
  }
  const text = responseText(response);
  if (!text) throw new Error('Operational AI completed without a text response.');
  return {
    text,
    page: suggestedPage(input.at(-1).content),
    sources: responseSources(response),
    model: model(),
    reasoningEffort: reasoningEffort(),
  };
}
