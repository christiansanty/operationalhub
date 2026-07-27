import { readFile } from 'node:fs/promises';
import { getHrPackage } from './hr-package-store.mjs';

function configuration() {
  const accountId = String(process.env.DOCUSIGN_ACCOUNT_ID || '').trim();
  const accessToken = String(process.env.DOCUSIGN_ACCESS_TOKEN || '').trim();
  const basePath = String(process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi').replace(/\/$/, '');
  const environment = basePath.includes('demo.docusign.net') ? 'demo' : 'production';
  return { accountId, accessToken, basePath, environment, connected: Boolean(accountId && accessToken) };
}

export function getDocusignStatus() {
  const config = configuration();
  return {
    provider: 'DocuSign eSignature',
    connected: config.connected,
    environment: config.environment,
    accountConfigured: Boolean(config.accountId),
    authenticationConfigured: Boolean(config.accessToken),
  };
}

export async function createDocusignEnvelope(payload = {}) {
  const config = configuration();
  if (!config.connected) {
    const error = new Error('DocuSign is not connected. Configure the account ID and OAuth access token on the server.');
    error.statusCode = 503;
    throw error;
  }

  const packageIds = Array.isArray(payload.packageIds) ? [...new Set(payload.packageIds.map(String))].slice(0, 10) : [];
  const signerName = String(payload.signerName || '').trim();
  const signerEmail = String(payload.signerEmail || '').trim();
  const emailSubject = String(payload.emailSubject || 'Employee Package for signature').trim().slice(0, 100);
  const emailBlurb = String(payload.emailBlurb || '').trim().slice(0, 10000);
  if (!packageIds.length || !signerName || !signerEmail) {
    const error = new Error('At least one document, signer name and signer email are required.');
    error.statusCode = 400;
    throw error;
  }

  const documents = [];
  for (const [index, packageId] of packageIds.entries()) {
    const record = await getHrPackage(packageId);
    if (!record) {
      const error = new Error(`Employee Package document not found: ${packageId}`);
      error.statusCode = 404;
      throw error;
    }
    documents.push({
      documentBase64: (await readFile(record.filePath)).toString('base64'),
      documentId: String(index + 1),
      fileExtension: record.filename.split('.').pop()?.slice(0, 10) || 'pdf',
      name: record.filename,
    });
  }

  const response = await fetch(`${config.basePath}/v2.1/accounts/${encodeURIComponent(config.accountId)}/envelopes`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.accessToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      documents,
      emailSubject,
      emailBlurb,
      recipients: { signers: [{ email: signerEmail, name: signerName, recipientId: '1', routingOrder: '1' }] },
      status: 'created',
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || result.errorCode || 'DocuSign could not create the envelope draft.');
    error.statusCode = response.status;
    throw error;
  }
  return {
    envelopeId: result.envelopeId,
    status: result.status || 'created',
    signerName,
    signerEmail,
    documentCount: documents.length,
    environment: config.environment,
    createdAt: new Date().toISOString(),
  };
}
