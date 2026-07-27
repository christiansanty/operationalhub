const escapeHtml = value => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function getAccessEmailStatus() {
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.INVITATION_FROM_EMAIL);
  return {
    provider: configured ? 'Resend' : 'Development preview',
    configured,
    from: configured ? process.env.INVITATION_FROM_EMAIL : '',
  };
}

export async function sendAccessInvitation({ email, name, inviteUrl, expiresAt, invitationId }) {
  const status = getAccessEmailStatus();
  if (!status.configured) {
    return { delivered: false, provider: status.provider, previewUrl: inviteUrl };
  }

  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(inviteUrl);
  const expiration = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
      'user-agent': 'Operational-Hub/1.0',
      'idempotency-key': `operational-hub-invite-${invitationId}`,
    },
    body: JSON.stringify({
      from: process.env.INVITATION_FROM_EMAIL,
      to: [email],
      subject: 'You have been invited to Operational Hub',
      text: `Hello ${name},\n\nYou have been invited to Operational Hub. Create your account using this secure link:\n${inviteUrl}\n\nThis invitation expires ${expiration}.\n\nIf you were not expecting this invitation, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17231d">
        <div style="padding:24px;border-radius:16px 16px 0 0;background:#162a21;color:white">
          <div style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#8fd4b6">EM GROUP</div>
          <h1 style="margin:8px 0 0;font-size:26px">Operational Hub invitation</h1>
        </div>
        <div style="padding:28px;border:1px solid #dce5e0;border-top:0;border-radius:0 0 16px 16px">
          <p>Hello ${safeName},</p>
          <p>You have been invited to Operational Hub. Use the secure button below to create your password and activate your account.</p>
          <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#147a59;color:white;text-decoration:none;font-weight:700">Create my account</a></p>
          <p style="font-size:13px;color:#607068">This one-time invitation expires ${escapeHtml(expiration)}.</p>
          <p style="font-size:12px;color:#7b8781">If you were not expecting this invitation, you can ignore this email.</p>
        </div>
      </div>`,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'The invitation email could not be delivered.');
    error.statusCode = 502;
    throw error;
  }
  return { delivered: true, provider: 'Resend', deliveryId: payload.id || '' };
}
