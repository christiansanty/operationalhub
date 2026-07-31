import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  canSessionAccessApplication, canSessionAccessPage, canSessionManagePage, firstAccessiblePage,
} from '../src/auth/accessControl.js';

const custom={id:'employee-1',role:'employee',scope:'custom',permissions:{'human-resources':'view',academy:'none','app-marketing-suite':'none'}};
assert.equal(canSessionAccessPage(custom,'staff'),true);
assert.equal(canSessionManagePage(custom,'staff'),false);
assert.equal(canSessionAccessPage(custom,'academy'),false);
assert.equal(canSessionAccessPage(custom,'hub'),false);
assert.equal(canSessionAccessApplication(custom,'marketing-suite'),false);
assert.equal(firstAccessiblePage(custom),'staff');

const academyOnly={id:'academy-employee',role:'employee',scope:'academy',permissions:{academy:'view'}};
assert.equal(canSessionAccessPage(academyOnly,'staff'),true);
assert.equal(canSessionManagePage(academyOnly,'staff'),false);
assert.equal(canSessionAccessPage(academyOnly,'team'),false);
assert.equal(firstAccessiblePage(academyOnly),'academy');
const academyManager={id:'academy-manager',role:'employee',scope:'custom',permissions:{academy:'manage'}};
assert.equal(canSessionAccessPage(academyManager,'team'),true);
assert.equal(canSessionManagePage(academyManager,'team'),true);

const appOnly={id:'employee-2',role:'employee',scope:'custom',permissions:{'app-marketing-suite':'view'}};
assert.equal(canSessionAccessPage(appOnly,'hub'),true);
assert.equal(canSessionAccessApplication(appOnly,'marketing-suite'),true);
assert.equal(canSessionAccessApplication(appOnly,'financial-hub'),false);

const admin={id:'admin',role:'admin',scope:'hub',permissions:{}};
assert.equal(canSessionAccessPage(admin,'roadmap'),true);
assert.equal(canSessionAccessPage(admin,'corporate'),false);
const owner={id:'owner',role:'owner',scope:'full',permissions:{}};
assert.equal(canSessionAccessPage(owner,'corporate'),true);

const testRoot=await mkdtemp(path.join(tmpdir(),'operational-hub-access-'));
process.env.OPERATIONAL_HUB_DATABASE_PATH=path.join(testRoot,'access.sqlite');
delete process.env.RESEND_API_KEY;delete process.env.INVITATION_FROM_EMAIL;
try{
  const access=await import(`../server/access-store.mjs?test=${Date.now()}`);
  const invited=await access.inviteAccessUser({
    name:'Access Test Employee',email:'access-test@emgroup.test',employmentStatus:'active',accessProfile:'custom',
    permissions:{'human-resources':'view',academy:'none',dashboard:'none'},
  },'http://127.0.0.1:4175','test-admin');
  const token=new URL(invited.invitation.developmentUrl).searchParams.get('invite');
  const accepted=access.acceptInvitation(token,'A-valid-test-passphrase-2026');
  assert.equal(accepted.session.permissions['human-resources'],'view');
  assert.equal(accepted.session.permissions.academy,'none');
  assert.ok(access.resolveAccessSession(accepted.sessionToken));

  const updated=access.updateAccessUser(invited.user.id,{accessProfile:'custom',permissions:{'human-resources':'none',academy:'view'}},'test-admin');
  assert.equal(updated.sessionsRevoked,1);
  assert.equal(access.resolveAccessSession(accepted.sessionToken),null);

  const hr=await import(`../server/hr-dossier-store.mjs?test=${Date.now()}`);
  const request=hr.createHrDocumentRequest(invited.user.id,{title:'Updated certification',category:'certification',dueAt:'2026-08-31'},'test-admin');
  const document=await hr.archiveHrDocument(invited.user.id,{requestId:request.id,filename:'certificate.txt',type:'text/plain',category:'certification',base64:Buffer.from('test').toString('base64')},invited.user.id);
  assert.equal(document.userId,invited.user.id);
  assert.equal(hr.listHrDocumentRequests(invited.user.id)[0].status,'received');
  const compliance=hr.updateHrComplianceItem(invited.user.id,'npi',{status:'completed',deadline:'2026-08-31'},'test-admin');
  assert.equal(compliance.status,'completed');
  const classification=hr.updateHrEmployeeClassification('provider-access-test',{workforceGroup:'clinical',accessUserId:invited.user.id},'test-admin');
  assert.equal(classification.workforceGroup,'clinical');
  assert.equal(hr.findHrEmployeeClassification(['provider-access-test',invited.user.id]).employeeKey,'provider-access-test');
  assert.equal(hr.listHrEmployeeClassifications().some(item=>item.employeeKey==='provider-access-test'),true);
  const photo=await hr.archiveHrDocument(invited.user.id,{filename:'employee-photo.jpg',type:'image/jpeg',category:'employee-photo',base64:Buffer.from('photo-test').toString('base64')},invited.user.id);
  assert.equal(photo.category,'employee-photo');
  const envelopeId='envelope-test-001';
  const packageRequestA=hr.createHrDocumentRequest(invited.user.id,{title:'Employee Package A',category:'employee-package',packageId:'package-a',deliveryMethod:'docusign',externalReference:envelopeId},'test-admin');
  hr.createHrDocumentRequest(invited.user.id,{title:'Employee Package B',category:'employee-package',packageId:'package-b',deliveryMethod:'docusign',externalReference:envelopeId},'test-admin');
  assert.equal(packageRequestA.externalReference,envelopeId);
  const returned=await hr.archiveHrDocument(invited.user.id,{filename:'completed-package.pdf',type:'application/pdf',category:'employee-package',externalReference:envelopeId,base64:Buffer.from('signed-test').toString('base64')},'docusign-connect','docusign-completed');
  assert.equal(returned.externalReference,envelopeId);
  assert.equal(hr.findHrDocumentRequestsByExternalReference(envelopeId).every(item=>item.status==='received'),true);
  assert.equal(hr.findHrDocumentByExternalReference(envelopeId).id,returned.id);

  process.env.DOCUSIGN_CONNECT_HMAC_SECRET='test-connect-secret';
  const docusign=await import(`../server/docusign.mjs?test=${Date.now()}`);const webhookBody=Buffer.from('{"event":"envelope-completed"}');
  const webhookSignature=createHmac('sha256',process.env.DOCUSIGN_CONNECT_HMAC_SECRET).update(webhookBody).digest('base64');
  assert.equal(docusign.verifyDocusignConnectSignature(webhookBody,webhookSignature),true);
  assert.equal(docusign.verifyDocusignConnectSignature(webhookBody,'invalid-signature'),false);
}finally{
  await rm(testRoot,{recursive:true,force:true});
}

console.log('Access-control and individual HR dossier tests passed.');
