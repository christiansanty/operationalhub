import { createHmac, timingSafeEqual } from 'node:crypto';

const clean = (value, max = 240) => String(value ?? '').trim().slice(0, max);
const validHexSignature = (payload, signature, secret) => {
  if (!signature || !secret) return false;
  const supplied = String(signature).startsWith('sha256=') ? String(signature).slice(7) : String(signature);
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  if (!/^[0-9a-f]+$/i.test(supplied) || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
};

export function emConnectStatus() {
  const secretConfigured = Boolean(process.env.RESEARCH_EM_CONNECT_WEBHOOK_SECRET?.trim());
  return {
    provider: 'em-connect',
    state: secretConfigured ? 'configured_pending_contract' : 'configuration_required',
    configured: secretConfigured,
    verified: false,
    direction: 'inbound_only',
    contract: 'contact.upserted / conversation.upserted / message.upserted HMAC envelope; Research routing field is not defined by the available contract.',
    outboundUpdates: 'blocked_pending_contract',
    missing: secretConfigured ? ['Explicit Research derivation field agreed with EM Connect', 'Live signed delivery verification'] : ['RESEARCH_EM_CONNECT_WEBHOOK_SECRET', 'Explicit Research derivation field agreed with EM Connect', 'Live signed delivery verification'],
  };
}

export function universalStatus() {
  const baseUrl = clean(process.env.RESEARCH_UNIVERSAL_BASE_URL, 500);
  const tokenConfigured = Boolean(process.env.RESEARCH_UNIVERSAL_TOKEN?.trim());
  const contractVersion = clean(process.env.RESEARCH_UNIVERSAL_CONTRACT_VERSION, 80);
  return {
    provider: 'universal',
    state: baseUrl && tokenConfigured && contractVersion ? 'configured_pending_verification' : 'configuration_required',
    configured: Boolean(baseUrl && tokenConfigured && contractVersion),
    verified: false,
    testMode: true,
    agentCapabilities: [],
    missing: [
      ...(!baseUrl ? ['RESEARCH_UNIVERSAL_BASE_URL'] : []),
      ...(!tokenConfigured ? ['RESEARCH_UNIVERSAL_TOKEN'] : []),
      ...(!contractVersion ? ['RESEARCH_UNIVERSAL_CONTRACT_VERSION'] : []),
      'Universal Research agent registry and tool contract',
      'Live health-check evidence',
    ],
    note: 'No Universal request is made and no Research or participant data is sent until an explicit contract is available and verified.',
  };
}

export function fundamentalStudyAgentStatus() {
  const base = universalStatus();
  return {
    ...base,
    module: 'fundamental-studies',
    agents: [
      { id: 'opportunity-scout', name: 'Opportunity Scout', purpose: 'Search authorized sources and return source-linked opportunities for human review.' },
      { id: 'eligibility-reviewer', name: 'Eligibility Reviewer', purpose: 'Compare criteria against approved information without inventing missing facts.' },
      { id: 'document-organizer', name: 'Document Organizer', purpose: 'Suggest document categories while preserving the original file.' },
      { id: 'paperwork-preparer', name: 'Paperwork Preparer', purpose: 'Prepare drafts and flag incomplete fields; never submit a request.' },
      { id: 'follow-up-coordinator', name: 'Follow-up Coordinator', purpose: 'Prepare status updates and reminders for the assigned owner.' },
    ],
    humanApprovalRequired: true,
    blockedActions: ['submit_application', 'accept_terms', 'certify_information', 'final_portal_submission'],
    note: base.configured
      ? 'Universal configuration exists, but live agent execution still requires an explicit Research agent registry and tool contract.'
      : 'Universal Master RPA is not configured and verified. No external request or portal action is made.',
  };
}

export function parseEmConnectResearchEvent(payloadText, signature) {
  const secret = process.env.RESEARCH_EM_CONNECT_WEBHOOK_SECRET?.trim();
  if (!secret) { const error = new Error('EM Connect Research webhook secret is not configured.'); error.statusCode = 503; throw error; }
  if (!validHexSignature(payloadText, signature, secret)) { const error = new Error('Unauthorized.'); error.statusCode = 401; throw error; }
  let payload;
  try { payload = JSON.parse(payloadText); } catch { const error = new Error('Invalid EM Connect event payload.'); error.statusCode = 400; throw error; }
  if (payload?.sourceSystem !== 'em-connect' || !clean(payload?.eventId) || !['contact.upserted', 'conversation.upserted', 'message.upserted'].includes(payload?.eventType) || !clean(payload?.entity?.id)) {
    const error = new Error('Invalid EM Connect event contract.'); error.statusCode = 400; throw error;
  }
  if (payload.eventType !== 'contact.upserted') return { ignored: true, reason: 'Only contact.upserted can create a Research lead.' };
  const route = clean(payload.entity.sourceType, 80).toLowerCase();
  if (!['research', 'clinical-research', 'research-lead'].includes(route)) {
    const error = new Error('Research derivation is not explicit in the EM Connect contract.'); error.statusCode = 422; error.code = 'research_route_required'; throw error;
  }
  return payload;
}
