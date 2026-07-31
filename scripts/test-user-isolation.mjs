import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const testRoot=await mkdtemp(path.join(tmpdir(),'operational-hub-isolation-'));
const databasePath=path.join(testRoot,'operational-hub.sqlite');
const port=4197;
const baseUrl=`http://127.0.0.1:${port}`;
process.env.OPERATIONAL_HUB_DATABASE_PATH=databasePath;
delete process.env.RESEND_API_KEY;delete process.env.INVITATION_FROM_EMAIL;

let server;
const waitForServer=async()=>{
  for(let attempt=0;attempt<40;attempt+=1){
    try{const response=await fetch(`${baseUrl}/api/health`);if(response.ok)return}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Isolation test server did not start');
};
const createEmployee=async(access,name,email,password)=>{
  const invited=await access.inviteAccessUser({name,email,employmentStatus:'active',accessProfile:'custom',permissions:{'human-resources':'view',academy:'view',dashboard:'none'}},baseUrl,'test-admin');
  const token=new URL(invited.invitation.developmentUrl).searchParams.get('invite');
  access.acceptInvitation(token,password);
  return invited.user;
};
const login=async(email,password)=>{
  const response=await fetch(`${baseUrl}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
  assert.equal(response.status,200);
  return response.headers.get('set-cookie').split(';')[0];
};
const getJson=async(pathname,cookie='')=>{
  const response=await fetch(`${baseUrl}${pathname}`,{headers:cookie?{cookie}:{}});
  return {status:response.status,payload:await response.json()};
};

try{
  const access=await import(`../server/access-store.mjs?isolation=${Date.now()}`);
  const hr=await import(`../server/hr-dossier-store.mjs?isolation=${Date.now()}`);
  const employeeA=await createEmployee(access,'Isolation Employee A','isolation-a@emgroup.test','A-valid-passphrase-2026');
  const employeeB=await createEmployee(access,'Isolation Employee B','isolation-b@emgroup.test','B-valid-passphrase-2026');
  await hr.archiveHrDocument(employeeA.id,{filename:'employee-a.txt',type:'text/plain',category:'certification',base64:Buffer.from('employee-a-private').toString('base64')},employeeA.id);
  await hr.archiveHrDocument(employeeB.id,{filename:'employee-b.txt',type:'text/plain',category:'certification',base64:Buffer.from('employee-b-private').toString('base64')},employeeB.id);

  server=spawn(process.execPath,['server/index.mjs'],{cwd:path.resolve('.'),env:{...process.env,PORT:String(port),NODE_ENV:'production',OPERATIONAL_HUB_DATABASE_PATH:databasePath},stdio:'ignore'});
  await waitForServer();

  const noSession=await getJson('/api/hr/me/dossier');assert.equal(noSession.status,401);
  const cookieA=await login(employeeA.email,'A-valid-passphrase-2026');
  const cookieB=await login(employeeB.email,'B-valid-passphrase-2026');
  const dossierA=await getJson('/api/hr/me/dossier',cookieA);const dossierB=await getJson('/api/hr/me/dossier',cookieB);
  assert.equal(dossierA.status,200);assert.equal(dossierB.status,200);
  assert.equal(dossierA.payload.dossier.user.id,employeeA.id);assert.equal(dossierB.payload.dossier.user.id,employeeB.id);
  assert.deepEqual(dossierA.payload.dossier.documents.map(item=>item.filename),['employee-a.txt']);
  assert.deepEqual(dossierB.payload.dossier.documents.map(item=>item.filename),['employee-b.txt']);
  assert.equal(JSON.stringify(dossierA.payload).includes('employee-b.txt'),false);
  assert.equal(JSON.stringify(dossierB.payload).includes('employee-a.txt'),false);
  assert.equal((await getJson('/api/hr/dossiers',cookieA)).status,403);
  assert.equal((await getJson('/api/academy/records',cookieA)).status,403);
  console.log('Authenticated user isolation tests passed.');
}finally{
  if(server?.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve))}
  await rm(testRoot,{recursive:true,force:true});
}
