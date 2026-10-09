import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const testRoot=await mkdtemp(path.join(tmpdir(),'operational-hub-package-flow-'));
const databasePath=path.join(testRoot,'operational-hub.sqlite');
const packageRoot=path.join(testRoot,'package-templates');
const port=4198;const baseUrl=`http://127.0.0.1:${port}`;
process.env.OPERATIONAL_HUB_DATABASE_PATH=databasePath;process.env.HR_PACKAGE_STORAGE_ROOT=packageRoot;
delete process.env.RESEND_API_KEY;delete process.env.INVITATION_FROM_EMAIL;delete process.env.HR_FROM_EMAIL;

let server;
const waitForServer=async()=>{for(let attempt=0;attempt<50;attempt+=1){try{const response=await fetch(`${baseUrl}/api/health`);if(response.ok)return}catch{}await new Promise(resolve=>setTimeout(resolve,100))}throw new Error('Package workflow test server did not start')};
const createUser=async(access,name,email,profile,password)=>{const invited=await access.inviteAccessUser({name,email,employmentStatus:'active',accessProfile:profile,permissions:profile==='custom'?{'human-resources':'view'}:undefined},baseUrl,'test-owner');const token=new URL(invited.invitation.developmentUrl).searchParams.get('invite');access.acceptInvitation(token,password);return invited.user};
const login=async(email,password)=>{const response=await fetch(`${baseUrl}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0]};
const requestJson=async(pathname,options={})=>{const response=await fetch(`${baseUrl}${pathname}`,options);return {status:response.status,payload:await response.json()}};

try{
  const access=await import(`../server/access-store.mjs?package-flow=${Date.now()}`);
  const owner=await createUser(access,'HR Owner','hr-owner@emgroup.test','owner','Owner-valid-passphrase-2026');
  const employee=await createUser(access,'Future Employee','future-employee@emgroup.test','custom','Employee-valid-passphrase-2026');
  const templates=await import(`../server/hr-package-store.mjs?package-flow=${Date.now()}`);
  const template=await templates.createHrPackage({clientId:'package-flow-template',filename:'employee-package.pdf',type:'application/pdf',base64:Buffer.from('blank-employee-package').toString('base64')});
  server=spawn(process.execPath,['server/index.mjs'],{cwd:path.resolve('.'),env:{...process.env,PORT:String(port),NODE_ENV:'production',APP_PUBLIC_URL:baseUrl},stdio:'ignore'});await waitForServer();
  const ownerCookie=await login(owner.email,'Owner-valid-passphrase-2026');
  const created=await requestJson('/api/hr/package-workflows',{method:'POST',headers:{cookie:ownerCookie,'content-type':'application/json'},body:JSON.stringify({candidateName:'Future Employee',candidateEmail:'future-employee@emgroup.test',packageIds:[template.id],deliveryMethod:'portal',subject:'Employee Package test'})});
  assert.equal(created.status,201);assert.equal(created.payload.delivery.delivered,false);assert.ok(created.payload.portalUrl.includes('employee_package='));
  const token=new URL(created.payload.portalUrl).searchParams.get('employee_package');
  const publicPackage=await requestJson(`/api/hr/package-portal/${encodeURIComponent(token)}`);assert.equal(publicPackage.status,200);assert.equal(publicPackage.payload.workflow.packages[0].filename,'employee-package.pdf');
  const returned=await requestJson(`/api/hr/package-portal/${encodeURIComponent(token)}/returns`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({filename:'completed-employee-package.pdf',type:'application/pdf',base64:Buffer.from('signed-return').toString('base64')})});assert.equal(returned.status,201);
  const queue=await requestJson('/api/hr/package-workflows',{headers:{cookie:ownerCookie}});assert.equal(queue.status,200);assert.equal(queue.payload.workflows[0].status,'received');
  const assigned=await requestJson(`/api/hr/package-workflows/${encodeURIComponent(created.payload.workflow.id)}/assign`,{method:'POST',headers:{cookie:ownerCookie,'content-type':'application/json'},body:JSON.stringify({employeeKey:employee.id})});assert.equal(assigned.status,200);assert.equal(assigned.payload.workflow.status,'assigned');
  const hr=await import(`../server/hr-dossier-store.mjs?package-flow=${Date.now()}`);assert.deepEqual(hr.listHrDossierDocuments(employee.id).map(item=>item.filename),['completed-employee-package.pdf']);
  const employeeCookie=await login(employee.email,'Employee-valid-passphrase-2026');
  assert.equal((await requestJson('/api/hr/package-workflows',{headers:{cookie:employeeCookie}})).status,403);
  console.log('Future-employee package delivery, return and assignment tests passed.');
}finally{
  if(server?.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve))}
  await rm(testRoot,{recursive:true,force:true});
}
