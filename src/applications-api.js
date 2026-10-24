import {requireHiringCompany} from './hiring-company-gate.js';
import {ensureSeekerReady} from './journey.js';
import {requireAccount} from './account-gate.js';
import {safeSkills} from './match-engine.js';
export const CONSENT='application-share-v1';
import {matchingBasisFromJob,snapshotJob} from './job-requirements.js';
export {matchingBasisFromJob};
import {DEFAULT_TIME_ZONE,INTERVIEW_TIME_ZONES,validTimeZone,canonicalInstant} from './interview-time.js';
export {DEFAULT_TIME_ZONE,INTERVIEW_TIME_ZONES};
import {contentVersion} from './integration-contract.js';
import {saveInterviewRecord,readInterviewRecord} from './interview-record-store.js';export {saveInterviewRecord};
export const invitationToken=a=>contentVersion({active:a.active,status:a.status,at:a.interviewAt||'',details:a.interviewDetails||'',zone:a.interviewTimeZone||DEFAULT_TIME_ZONE},'interview');
export function cleanCandidate(c){
 const out={};for(const [key,max] of Object.entries({displayName:120,summary:2000,education:1500,experience:3000,location:150,employmentType:30,portfolio:500})){out[key]=String(c[key]||'').trim().slice(0,max);}
 out.skills=safeSkills(c.skills);
 if(!out.displayName||!out.skills.length)throw Error('profile-required');
 out.synthetic=true;return out;
}
export async function stageApplicationRecord({F,db},id,status,interviewAt='',interviewDetails='',interviewTimeZone=DEFAULT_TIME_ZONE,expectedToken){
 if(!['submitted','reviewing','interview','completed','not-progressing'].includes(status))throw Error('invalid-stage');
 if(!validTimeZone(interviewTimeZone))throw Error('invalid-time-zone');
 const details=status==='interview'?String(interviewDetails||'').trim().slice(0,2000):'',at=status==='interview'?interviewAt:'',zone=status==='interview'?interviewTimeZone:DEFAULT_TIME_ZONE;
 if(status==='interview'){if(!at||!details)throw Error('interview-details-required');canonicalInstant(at);}
 return F.runTransaction(db,async tx=>{
  const ref=F.doc(db,'aligna_applications',id),snapshot=await tx.get(ref),old=snapshot.data();if(!snapshot.exists()||!old?.active)throw Error('withdrawn');
  if(old.status===status&&(old.interviewAt||'')===at&&(old.interviewDetails||'')===details&&(old.interviewTimeZone||DEFAULT_TIME_ZONE)===zone)return false;
  if(expectedToken&&expectedToken!==invitationToken(old))throw Error('interview-changed');
  if(status==='interview'){const job=await tx.get(F.doc(db,'aligna_jobs',old.jobId));if(!job.exists()||job.data()?.status!=='published')throw Error('job-closed');}
  tx.update(ref,{status,interviewAt:at,interviewDetails:details,interviewTimeZone:zone,interviewResponse:'pending',interviewProposalAt:'',interviewProposalTimeZone:DEFAULT_TIME_ZONE,interviewProposalDetails:'',updatedAt:F.serverTimestamp()});return true;
 });
}
export async function respondApplicationRecord({F,db},id,response,proposalAt='',proposalDetails='',proposalTimeZone=DEFAULT_TIME_ZONE,expectedToken){
 if(!['accepted','declined','proposed'].includes(response)||!validTimeZone(proposalTimeZone))throw Error('invalid-response');
 const details=String(proposalDetails||'').trim().slice(0,1000),at=String(proposalAt||'');
 if(response==='proposed'){try{canonicalInstant(at);}catch{throw Error('proposal-time-required');}}
 return F.runTransaction(db,async tx=>{
  const ref=F.doc(db,'aligna_applications',id),snapshot=await tx.get(ref),old=snapshot.data();if(!snapshot.exists()||!old?.active)throw Error('withdrawn');
  if(expectedToken&&expectedToken!==invitationToken(old))throw Error('interview-changed');
  const next={interviewResponse:response,interviewProposalAt:response==='proposed'?at:'',interviewProposalTimeZone:response==='proposed'?proposalTimeZone:DEFAULT_TIME_ZONE,interviewProposalDetails:response==='proposed'?details:''};
  if(old.status==='interview'&&Object.entries(next).every(([k,v])=>(old[k]??(k==='interviewProposalTimeZone'?DEFAULT_TIME_ZONE:''))===v))return false;
  if(old.status!=='interview'||old.interviewResponse!=='pending')throw Error('response-not-pending');
  const job=await tx.get(F.doc(db,'aligna_jobs',old.jobId));if(!job.exists()||job.data()?.status!=='published')throw Error('job-closed');
  tx.update(ref,{...next,updatedAt:F.serverTimestamp()});return true;
 });
}
async function confirmApplication(c,id,check){const snap=await c.F.getDocFromServer(c.F.doc(c.db,'aligna_applications',id));if(!snap.exists()||!check(snap.data()))throw Error('save-not-confirmed');}
export async function saveStageConfirmed(c,id,status,at='',details='',zone=DEFAULT_TIME_ZONE,expectedToken){const changed=await stageApplicationRecord(c,id,status,at,details,zone,expectedToken);await confirmApplication(c,id,d=>d.active===true&&d.status===status&&(d.interviewAt||'')===(status==='interview'?at:'')&&(d.interviewDetails||'')===(status==='interview'?String(details).trim().slice(0,2000):'')&&(d.interviewTimeZone||DEFAULT_TIME_ZONE)===(status==='interview'?zone:DEFAULT_TIME_ZONE)&&(!changed||d.interviewResponse==='pending'));return changed;}
export async function saveResponseConfirmed(c,id,response,at='',details='',zone=DEFAULT_TIME_ZONE,expectedToken){const changed=await respondApplicationRecord(c,id,response,at,details,zone,expectedToken);await confirmApplication(c,id,d=>d.active===true&&d.interviewResponse===response&&(d.interviewProposalAt||'')===(response==='proposed'?at:'')&&(d.interviewProposalDetails||'')===(response==='proposed'?String(details||'').trim().slice(0,1000):'')&&(d.interviewProposalTimeZone||DEFAULT_TIME_ZONE)===(response==='proposed'?zone:DEFAULT_TIME_ZONE));return changed;}
export async function applyJobRecord(c,job,candidate){
 const {F,db,user}=c,id=user.uid+'_'+job.id,ref=F.doc(db,'aligna_applications',id),jobRef=F.doc(db,'aligna_jobs',job.id);
 const duplicate=()=>F.getDocsFromServer(F.query(F.collection(db,'aligna_applications'),F.where('seekerUid','==',user.uid),F.where('jobId','==',job.id),F.limit(1)));
 if(!(await duplicate()).empty)throw Error('already-applied');
  try{await F.runTransaction(db,async tx=>{const current=await tx.get(jobRef);if(!current.exists()||current.data().status!=='published')throw Error('job-unavailable');const source=current.data(),snapshot=matchingBasisFromJob(source);tx.set(ref,{seekerUid:user.uid,employerUid:source.ownerUid,jobId:job.id,jobTitle:source.jobTitle,companyName:source.companyName,...snapshot,jobSnapshot:snapshotJob(source),candidate:cleanCandidate(candidate),consentVersion:CONSENT,synthetic:true,active:true,status:'submitted',interviewAt:'',interviewTimeZone:DEFAULT_TIME_ZONE,interviewDetails:'',interviewResponse:'pending',interviewProposalAt:'',interviewProposalTimeZone:DEFAULT_TIME_ZONE,interviewProposalDetails:'',createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp()});});}
 catch(error){if(['permission-denied','aborted','failed-precondition'].includes(error.code)&&!(await duplicate()).empty)throw Error('already-applied');throw error;}
 const saved=await F.getDocFromServer(ref);if(!saved.exists())throw Error('save-not-confirmed');return id;
}
export async function applicationClient(role='seeker'){
 const c=await requireAccount(role);if(role==='hr')await requireHiringCompany(c);if(role==='seeker')await ensureSeekerReady(c);const {F,db,user}=c;
 const ref=id=>F.doc(db,'aligna_applications',id);
 return {...c,
 watch(cb,fail){return F.onSnapshot(F.query(F.collection(db,'aligna_applications'),F.where(role==='hr'?'employerUid':'seekerUid','==',user.uid),...(role==='hr'?[F.where('active','==',true)]:[])),s=>cb(s.docs.map(d=>{const x=d.data();return {id:d.id,...x,candidate:x.candidate?{...x.candidate,skills:safeSkills(x.candidate.skills)}:null};})),fail);},
 async apply(job,candidate){return applyJobRecord(c,job,candidate);},
  async withdraw(id){await F.updateDoc(ref(id),{active:false,status:'withdrawn',candidate:null,interviewAt:'',interviewTimeZone:DEFAULT_TIME_ZONE,interviewDetails:'',interviewResponse:'pending',interviewProposalAt:'',interviewProposalTimeZone:DEFAULT_TIME_ZONE,interviewProposalDetails:'',updatedAt:F.serverTimestamp()});const saved=await F.getDocFromServer(ref(id));if(!saved.exists()||saved.data().active!==false||saved.data().status!=='withdrawn')throw Error('save-not-confirmed');},
 async stage(id,status,at='',details='',zone=DEFAULT_TIME_ZONE,token){return saveStageConfirmed(c,id,status,at,details,zone,token);},
 async respond(id,response,at='',details='',zone=DEFAULT_TIME_ZONE,token){return saveResponseConfirmed(c,id,response,at,details,zone,token);},
 async note(id,text){await F.setDoc(F.doc(db,'aligna_application_notes',id),{employerUid:user.uid,text:text.slice(0,6000),updatedAt:F.serverTimestamp()});},
 async getNote(id){const d=await F.getDoc(F.doc(db,'aligna_application_notes',id));return d.exists()?d.data().text:'';},
 async getInterviewRecord(id){return readInterviewRecord(c,id);},
 async saveInterviewRecord(id,job,raw){return saveInterviewRecord(c,id,job,raw);},
 async getInterviewFeedback(id){return readInterviewRecord(c,id,true);},
 watchJob(id,cb,fail){return F.onSnapshot(F.doc(db,'aligna_jobs',id),d=>cb(d.exists()?{id:d.id,...d.data()}:null),fail);},
 async getJob(id){const d=await F.getDocFromServer(F.doc(db,'aligna_jobs',id));return d.exists()?{id:d.id,...d.data()}:null;}
 };
}
