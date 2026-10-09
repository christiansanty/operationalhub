const escapeHtml=value=>String(value||'')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

export function getHrPackageEmailStatus(){
  const from=String(process.env.HR_FROM_EMAIL||process.env.INVITATION_FROM_EMAIL||'').trim();
  const configured=Boolean(process.env.RESEND_API_KEY&&from);
  return {provider:configured?'Resend':'Manual email draft',configured,from:configured?from:''};
}

export async function sendHrPackageEmail({candidateName,candidateEmail,portalUrl,dueAt,subject,message,workflowId}){
  const status=getHrPackageEmailStatus();
  if(!status.configured)return {delivered:false,provider:status.provider,previewUrl:portalUrl};
  const dueText=dueAt?` Please return it by ${dueAt}.`:'';
  const safeName=escapeHtml(candidateName);const safeUrl=escapeHtml(portalUrl);const safeMessage=escapeHtml(message);
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,'content-type':'application/json','user-agent':'Operational-Hub/1.0','idempotency-key':`operational-hub-package-${workflowId}`},
    body:JSON.stringify({
      from:status.from,to:[candidateEmail],subject:subject||'Employee Package · EM Group',
      text:`Hello ${candidateName},\n\n${message||'Human Resources has prepared an Employee Package for you.'}${dueText}\n\nOpen the secure package, download and complete the documents, then return the completed files using the same page:\n${portalUrl}\n\nThis link is personal. Do not forward it.`,
      html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17231d">
        <div style="padding:24px;border-radius:16px 16px 0 0;background:#162a21;color:white"><div style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#8fd4b6">EM GROUP · HUMAN RESOURCES</div><h1 style="margin:8px 0 0;font-size:26px">Employee Package</h1></div>
        <div style="padding:28px;border:1px solid #dce5e0;border-top:0;border-radius:0 0 16px 16px"><p>Hello ${safeName},</p><p>${safeMessage||'Human Resources has prepared an Employee Package for you.'}${escapeHtml(dueText)}</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#147a59;color:white;text-decoration:none;font-weight:700">Open my secure Employee Package</a></p><p style="font-size:13px;color:#607068">Download and complete the requested documents, then upload the completed files using the same secure page.</p><p style="font-size:12px;color:#7b8781">This link is personal. Do not forward it.</p></div>
      </div>`,
    }),
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(payload.message||'The Employee Package email could not be delivered.');error.statusCode=502;throw error}
  return {delivered:true,provider:'Resend',deliveryId:payload.id||''};
}
