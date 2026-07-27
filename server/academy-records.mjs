import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const recordsRoot=path.resolve('private','academy-records');
const allowedEventTypes=new Set(['answer','reflection','lesson_completed','course_completed','certificate']);

const httpError=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const cleanText=(value,max=500)=>String(value??'').trim().slice(0,max);
const learnerId=value=>{
  const id=cleanText(value,80);
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/.test(id))throw httpError('Invalid Academy learner identifier');
  return id;
};
const safeSegment=(value,fallback='record')=>cleanText(value,100).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||fallback;
const learnerFolder=id=>path.join(recordsRoot,learnerId(id));
const readJson=async(file,fallback)=>{try{return JSON.parse(await readFile(file,'utf8'))}catch{return fallback}};
const writeJson=(file,value)=>writeFile(file,`${JSON.stringify(value,null,2)}\n`,{mode:0o600});

async function ensureLearnerFolders(id){
  const folder=learnerFolder(id);
  await mkdir(path.join(folder,'courses'),{recursive:true,mode:0o700});
  await mkdir(path.join(folder,'certificates'),{recursive:true,mode:0o700});
  return folder;
}

const compactValue=(value,depth=0)=>{
  if(depth>4)return undefined;
  if(Array.isArray(value))return value.slice(0,100).map(item=>compactValue(item,depth+1));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).slice(0,80).map(([key,item])=>[cleanText(key,80),compactValue(item,depth+1)]));
  if(typeof value==='string')return value.slice(0,12000);
  if(['number','boolean'].includes(typeof value)||value===null)return value;
  return undefined;
};

function decodePhoto(dataUrl){
  const match=/^data:image\/(png|jpeg|jpg|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(String(dataUrl||''));
  if(!match)throw httpError('Employee photo must be a PNG, JPEG or WebP image');
  const buffer=Buffer.from(match[2],'base64');
  if(!buffer.length||buffer.length>5*1024*1024)throw httpError('Employee photo must be smaller than 5 MB');
  const extension=match[1]==='jpg'?'jpeg':match[1];
  return {buffer,extension,type:`image/${extension}`};
}

export async function upsertAcademyLearner(payload={}){
  const id=learnerId(payload.learnerId);
  const name=cleanText(payload.name,160);
  const email=cleanText(payload.email,240).toLowerCase();
  if(!name)throw httpError('Employee name is required');
  const folder=await ensureLearnerFolders(id);
  const profilePath=path.join(folder,'profile.json');
  const current=await readJson(profilePath,{});
  let photoFile=current.photoFile||'';let photoType=current.photoType||'';
  if(payload.photoDataUrl){
    const photo=decodePhoto(payload.photoDataUrl);
    photoFile=`profile.${photo.extension}`;photoType=photo.type;
    await writeFile(path.join(folder,photoFile),photo.buffer,{mode:0o600});
  }
  const now=new Date().toISOString();
  const profile={learnerId:id,name,email,photoFile,photoType,photoUrl:photoFile?`/api/academy/records/${encodeURIComponent(id)}/photo`:'',createdAt:current.createdAt||now,updatedAt:now};
  await writeJson(profilePath,profile);
  const recordPath=path.join(folder,'record.json');
  const record=await readJson(recordPath,null);
  if(!record)await writeJson(recordPath,{learnerId:id,createdAt:now,updatedAt:now,answerCount:0,completedLessons:0,completedCourses:0,events:[],certificates:[]});
  return profile;
}

export async function recordAcademyEvent(id,payload={}){
  const normalizedId=learnerId(id);
  const type=cleanText(payload.type,40);
  if(!allowedEventTypes.has(type))throw httpError('Invalid Academy record event type');
  const folder=await ensureLearnerFolders(normalizedId);
  const profile=await readJson(path.join(folder,'profile.json'),null);
  if(!profile)throw httpError('Academy learner profile not found',404);
  const event={...compactValue(payload),id:randomUUID(),type,recordedAt:new Date().toISOString()};
  await appendFile(path.join(folder,'activity.jsonl'),`${JSON.stringify(event)}\n`,{mode:0o600});

  const recordPath=path.join(folder,'record.json');
  const record=await readJson(recordPath,{learnerId:normalizedId,createdAt:event.recordedAt,events:[],certificates:[]});
  record.events=Array.isArray(record.events)?record.events:[];
  record.events.push(event);
  record.answerCount=record.events.filter(item=>item.type==='answer').length;
  record.completedLessons=record.events.filter(item=>item.type==='lesson_completed').length;
  record.completedCourses=record.events.filter(item=>item.type==='course_completed').length;
  record.updatedAt=event.recordedAt;
  await writeJson(recordPath,record);

  const courseId=safeSegment(payload.courseId||'general','general');
  const coursePath=path.join(folder,'courses',`${courseId}.json`);
  const courseRecord=await readJson(coursePath,{courseId:payload.courseId||courseId,courseTitle:payload.courseTitle||'',createdAt:event.recordedAt,events:[]});
  courseRecord.courseTitle=cleanText(payload.courseTitle||courseRecord.courseTitle,300);
  courseRecord.events=Array.isArray(courseRecord.events)?courseRecord.events:[];
  courseRecord.events.push(event);
  courseRecord.updatedAt=event.recordedAt;
  await writeJson(coursePath,courseRecord);
  return event;
}

export async function createAcademyCertificate(id,payload={}){
  const normalizedId=learnerId(id);
  const folder=await ensureLearnerFolders(normalizedId);
  const profile=await readJson(path.join(folder,'profile.json'),null);
  if(!profile)throw httpError('Academy learner profile not found',404);
  const now=new Date().toISOString();
  const certificateId=cleanText(payload.certificateId,100)||`EMA-${normalizedId.toUpperCase()}-${Date.now()}`;
  const certificate={certificateId,learnerId:normalizedId,employeeName:profile.name,email:profile.email,photoUrl:profile.photoUrl,courseId:cleanText(payload.courseId,120),courseTitle:cleanText(payload.courseTitle,300),completedAt:cleanText(payload.completedAt,50)||now,status:'completed',createdAt:now};
  await writeJson(path.join(folder,'certificates',`${safeSegment(certificateId,'certificate')}.json`),certificate);
  const recordPath=path.join(folder,'record.json');
  const record=await readJson(recordPath,{learnerId:normalizedId,createdAt:now,events:[],certificates:[]});
  record.certificates=Array.isArray(record.certificates)?record.certificates:[];
  if(!record.certificates.some(item=>item.certificateId===certificateId))record.certificates.push(certificate);
  record.updatedAt=now;
  await writeJson(recordPath,record);
  await appendFile(path.join(folder,'activity.jsonl'),`${JSON.stringify({id:randomUUID(),type:'certificate',recordedAt:now,certificateId,courseId:certificate.courseId})}\n`,{mode:0o600});
  return certificate;
}

export async function getAcademyLearnerRecord(id){
  const normalizedId=learnerId(id);
  const folder=learnerFolder(normalizedId);
  const profile=await readJson(path.join(folder,'profile.json'),null);
  if(!profile)throw httpError('Academy learner profile not found',404);
  const record=await readJson(path.join(folder,'record.json'),{learnerId:normalizedId,events:[],certificates:[]});
  return {profile,record};
}

export async function listAcademyLearnerRecords(){
  await mkdir(recordsRoot,{recursive:true,mode:0o700});
  const entries=await readdir(recordsRoot,{withFileTypes:true});
  const learners=[];
  for(const entry of entries.filter(item=>item.isDirectory())){
    const folder=path.join(recordsRoot,entry.name);
    const profile=await readJson(path.join(folder,'profile.json'),null);
    if(!profile)continue;
    const record=await readJson(path.join(folder,'record.json'),{events:[],certificates:[]});
    learners.push({profile,summary:{answerCount:Number(record.answerCount||0),completedLessons:Number(record.completedLessons||0),completedCourses:Number(record.completedCourses||0),certificateCount:Array.isArray(record.certificates)?record.certificates.length:0,updatedAt:record.updatedAt||profile.updatedAt}});
  }
  return learners.sort((a,b)=>String(b.summary.updatedAt||'').localeCompare(String(a.summary.updatedAt||'')));
}

export async function getAcademyLearnerPhoto(id){
  const normalizedId=learnerId(id);
  const folder=learnerFolder(normalizedId);
  const profile=await readJson(path.join(folder,'profile.json'),null);
  if(!profile?.photoFile)return null;
  const filePath=path.resolve(folder,profile.photoFile);
  if(!filePath.startsWith(`${folder}${path.sep}`))return null;
  return {filePath,type:profile.photoType||'image/jpeg'};
}

export { recordsRoot as academyRecordsRoot };
