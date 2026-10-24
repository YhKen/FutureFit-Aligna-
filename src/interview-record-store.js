import {cleanInterviewRecord,shareableInterviewFeedback,sameInterviewRecord,packInterviewRecord,packSharedInterview,unpackInterviewRecord} from './interview-record.js';import {contentVersion} from './integration-contract.js';
export async function readInterviewRecord(c,id,shared=false){const {F,db}=c,col=shared?'aligna_interview_feedback':'aligna_interview_records',snap=await F.getDocFromServer(F.doc(db,col,id));if(!snap.exists())return null;const app=await F.getDocFromServer(F.doc(db,'aligna_applications',id)),job=app.data()?.jobSnapshot,raw=unpackInterviewRecord(snap.data());if(shared){if(raw.items.some(v=>!v.share||!['partial','sufficient','not_applicable'].includes(v.status)||typeof v.quote!=='string'||v.quote.length>1800||typeof v.observation!=='string'||v.observation.length>1800||['partial','sufficient'].includes(v.status)&&!v.quote.trim())||raw.followups.some(v=>!v.share||v.status!=='answered'||!v.response?.trim()))throw Error('record-invalid');return shareableInterviewFeedback(raw,job);}const clean=cleanInterviewRecord(raw,job);if(!clean||!sameInterviewRecord(raw,clean))throw Error('record-invalid');return {...raw,...clean};}
export async function saveInterviewRecord(c,id,job,raw){
 const {F,db,user}=c,appRef=F.doc(db,'aligna_applications',id),ref=F.doc(db,'aligna_interview_records',id),feedbackRef=F.doc(db,'aligna_interview_feedback',id);let record,feedback;
 await F.runTransaction(db,async tx=>{
  const snapshot=await tx.get(appRef),old=await tx.get(ref),application=snapshot.data();
  if(!snapshot.exists()||!application?.active||application.employerUid!==user.uid)throw Error('interview-not-authorized');
  const frozen={...application.jobSnapshot,requirementsVersion:application.jobRequirementsVersion};
  if(job&&contentVersion(job.requirements)!==contentVersion(frozen.requirements))throw Error('job-version-changed');
  record=cleanInterviewRecord(raw,frozen);if(!record)throw Error('invalid-interview-record');feedback=shareableInterviewFeedback({...record,items:record.items.filter(v=>v.share&&v.status!=='unobserved'),followups:record.followups.filter(v=>v.share&&v.status==='answered')},frozen);
  const ids={applicationId:id,employerUid:user.uid,seekerUid:application.seekerUid,jobId:application.jobId,jobRequirementsVersion:application.jobRequirementsVersion||0,evaluatorUid:user.uid};
  tx.set(ref,{...ids,...packInterviewRecord(record),createdAt:old.exists()?old.data().createdAt:F.serverTimestamp(),updatedAt:F.serverTimestamp()});
  const {toolCondition,...projection}=packSharedInterview(record);tx.set(feedbackRef,{applicationId:id,employerUid:user.uid,seekerUid:application.seekerUid,...projection,updatedAt:F.serverTimestamp()});
 });
 const [saved,shared]=await Promise.all([readInterviewRecord(c,id),readInterviewRecord(c,id,true)]);if(!sameInterviewRecord(saved,record)||contentVersion(shared.items)!==contentVersion(feedback.items)||contentVersion(shared.followups)!==contentVersion(feedback.followups))throw Error('save-not-confirmed');return {saved:true,record:saved};
}
