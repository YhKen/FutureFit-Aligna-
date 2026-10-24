import {requireHiringCompany} from './hiring-company-gate.js';
import {ensureSeekerReady} from './journey.js';
import {requireAccount} from './account-gate.js';
export const jobFields=['jobTitle','salary','jobDescription','jobField','location','skills','softSkills','jobRequirements','futureSkills','employmentType','employeeCount','workingTime'];
import {validateRequirements,JOB_FIELDS} from './job-requirements.js';
import {contentVersion} from './integration-contract.js';
export {validateRequirements};
export function validateJob(data){for(const k of jobFields)if(data[k]===undefined||String(data[k]).trim()==='')throw Error('required');if(!Number.isFinite(Number(data.salary))||Number(data.salary)<0||Number(data.salary)>10000000)throw Error('salary');if(!Number.isInteger(Number(data.employeeCount))||Number(data.employeeCount)<1||Number(data.employeeCount)>100000)throw Error('count');if(!['Full-time','Part-time'].includes(data.employmentType))throw Error('type');for(const k of jobFields)if(typeof data[k]==='string'&&data[k].length>(['jobDescription','jobRequirements'].includes(k)?6000:500))throw Error('length');const base={...Object.fromEntries(jobFields.map(k=>[k,typeof data[k]==='string'?data[k].trim():data[k]])),salary:Number(data.salary),employeeCount:Number(data.employeeCount)},requirements=validateRequirements(data.requirements);return requirements?{...base,requirements}:base;}
export function jobVersionFields(previous,data){
 const requirements=data.requirements||previous.requirements;if(!requirements)return {};
 const normalized=validateRequirements(requirements),before={...Object.fromEntries(jobFields.map(k=>[k,previous[k]])),requirements:previous.requirements},after={...Object.fromEntries(jobFields.map(k=>[k,data[k]])),requirements:normalized};
 return {jobSchemaVersion:2,requirementsVersion:previous.requirementsVersion?previous.requirementsVersion+(contentVersion(before)===contentVersion(after)?0:1):1,requirements:normalized};
}
// A form keeps the revision it actually loaded. A transaction alone would still
// overwrite a colleague's changes when Firestore retries a stale form's write.
export function jobEditToken(job){return contentVersion({fields:Object.fromEntries(jobFields.map(k=>[k,job[k]])),requirements:job.requirements||null,requirementsVersion:job.requirementsVersion||0,status:job.status,companyName:job.companyName},'job-edit');}
export async function saveJobRecord(c,profile,id,raw,status,expectedToken){
 const {F,db,user}=c;if(!profile)throw Error('company');const ref=id?F.doc(db,'aligna_jobs',id):F.doc(F.collection(db,'aligna_jobs')),data=validateJob(raw);let expected;
 try{await F.runTransaction(db,async tx=>{
  const old=id?await tx.get(ref):null,previous=old?.exists()?old.data():{};
  if(id&&!old?.exists())throw Error('job-unavailable');
  if(old?.exists()&&previous.ownerUid!==user.uid)throw Error('owner');
  if(id&&(!expectedToken||jobEditToken(previous)!==expectedToken))throw Error('stale-job');
  expected={...data,...jobVersionFields(previous,data),ownerUid:user.uid,companyName:profile.companyName,status};
  tx.set(ref,{...expected,createdAt:old?.exists()?previous.createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp(),publishedAt:status==='published'?F.serverTimestamp():null});
 });}catch(error){
  // Rules can reject the outdated version before Firestore returns a retryable
  // transaction conflict. Translate only a proven revision change.
  if(id&&expectedToken&&['permission-denied','aborted','failed-precondition'].includes(error.code)){
   const latest=await F.getDocFromServer(ref);
   if(latest.exists()&&latest.data().ownerUid===user.uid&&jobEditToken(latest.data())!==expectedToken)throw Error('stale-job');
  }
  throw error;
 }
 const saved=await F.getDocFromServer(ref);if(!saved.exists()||Object.entries(expected).some(([k,v])=>contentVersion(saved.data()[k])!==contentVersion(v)))throw Error('save-not-confirmed');return {id:ref.id,...saved.data()};
}
export async function jobsClient(role){
 const c=await requireAccount(role);const companyVerification=role==='hr'?await requireHiringCompany(c):null;if(role==='seeker')await ensureSeekerReady(c);const {F,db,user}=c,profileRef=F.doc(db,'aligna_employers',user.uid);
 if(companyVerification?.access==='verified'){const old=await F.getDocFromServer(profileRef);if(old.data()?.companyName!==companyVerification.request.legalName)await F.setDoc(profileRef,{ownerUid:user.uid,companyName:companyVerification.request.legalName,createdAt:old.exists()?old.data().createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp()});}
 return {...c,companyVerification,
  async employer(){const d=await F.getDocFromServer(profileRef);return d.exists()?d.data():null;},
  async saveEmployer(companyName){if(companyVerification?.access==='verified'&&companyName.trim()!==companyVerification.request.legalName)throw Error('company');if(!companyName.trim()||companyName.trim().length>150)throw Error('company');const old=await this.employer();await F.setDoc(profileRef,{ownerUid:user.uid,companyName:companyName.trim(),createdAt:old?.createdAt||F.serverTimestamp(),updatedAt:F.serverTimestamp()});const saved=await this.employer();if(saved?.companyName!==companyName.trim())throw Error('save-not-confirmed');},
  watchMine(cb,fail){return F.onSnapshot(F.query(F.collection(db,'aligna_jobs'),F.where('ownerUid','==',user.uid)),s=>cb(s.docs.map(x=>({id:x.id,...x.data()}))),fail);},
  watchPublished(cb,fail){return F.onSnapshot(F.query(F.collection(db,'aligna_jobs'),F.where('status','==','published'),F.limit(100)),s=>cb(s.docs.map(x=>({id:x.id,...x.data()}))),fail);},
  async saveJob(id,raw,status,expectedToken){
   const saved=await saveJobRecord(c,await this.employer(),id,raw,status,expectedToken);this.lastSavedJob=saved;return saved.id;
  },
  async close(id){const profile=await this.employer();await F.updateDoc(F.doc(db,'aligna_jobs',id),{status:'closed',companyName:profile.companyName,publishedAt:null,updatedAt:F.serverTimestamp()});const saved=await F.getDocFromServer(F.doc(db,'aligna_jobs',id));if(saved.data()?.status!=='closed')throw Error('save-not-confirmed');}
 };
}
