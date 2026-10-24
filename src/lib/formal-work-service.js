import {formalTask,FORMAL_VERSION,cleanFormalAnswers,reviewSummary} from '../formal-work-data.js';
import {checkFormalNumbers} from './formal-work-keys.js';
import {safeError} from './news-store.js';
import {contentVersion} from '../integration-contract.js';
import {applicationJob,validateRequirements} from '../job-requirements.js';
const validId=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,220}$/.test(s);
const fail=(message,status=400)=>{throw safeError(message,status);};
export async function workScope(store,user,applicationId){
 if(!validId(applicationId))fail('invalid-application');const app=await store.get('aligna_applications/'+applicationId);if(!app?.active)fail('application-sharing-closed',409);
 const role=app.employerUid===user.uid?'hr':app.seekerUid===user.uid?'seeker':null;if(!role)fail('work-not-authorized',403);
 return {app,role,applicationId};
}
function assignmentDefinition(a){const task=formalTask(a.taskId,a.variant);if(a.taskVersion!==FORMAL_VERSION||a.rubricVersion!==task.rubricVersion)fail('work-definition-unavailable',409);return task;}
export function taskLinkage(application,task){
 const job=applicationJob(application,null),requirements=job?.requirements;
 if(!requirements)fail('task-job-requirements-missing',409);
 let validated;try{validated=validateRequirements(requirements);}catch{fail('task-job-requirements-invalid',409);}
 if(Number(application.jobRequirementsVersion)!==Number(job.requirementsVersion)||!Number.isInteger(application.jobRequirementsVersion)||application.jobRequirementsVersion<1)fail('task-job-version-invalid',409);
 const taskSkillIds=new Set(task.linkedSkillIds||[]),linkedSkills=validated.skills.filter(skill=>taskSkillIds.has(skill.skillId));
 const linkedSkillIds=linkedSkills.map(skill=>skill.skillId),linkedWorkOutputs=validated.workOutputs.filter(output=>output.skillIds.some(id=>linkedSkillIds.includes(id)));
 if(!linkedSkillIds.length||!linkedWorkOutputs.length)fail('task-not-linked-to-job',409);
 return {jobRequirementsVersion:Number(job.requirementsVersion||application.jobRequirementsVersion||0),skillIds:linkedSkillIds,workOutputIds:linkedWorkOutputs.map(output=>output.id),skills:linkedSkills.map(skill=>({skillId:skill.skillId,label:skill.label})),workOutputs:linkedWorkOutputs.map(output=>({id:output.id,description:output.description}))};
}
function toolsFor(values,condition){if(!Array.isArray(values)||values.length>3||new Set(values).size!==values.length||values.some(x=>!['calculator','spreadsheet','ai'].includes(x))||condition==='independent'&&values.includes('ai'))fail('invalid-tools');return [...values].sort();}
export function cleanFormalReview(task,raw){
 if(!Array.isArray(raw)||raw.length!==4||new Set(raw.map(r=>r?.criterionId)).size!==4)fail('incomplete-review');
 return task.criteria.map(c=>{const r=raw.find(x=>x?.criterionId===c.id);if(!r||![null,1,2,3].includes(r.score)||typeof r.observation!=='string'||r.observation.length>1500||r.score!==null&&!r.observation.trim())fail('invalid-review');return {criterionId:c.id,sourceField:c.field,score:r.score,observation:r.observation.trim()};});
}
export async function workContext(store,user,applicationId){
 const scope=await workScope(store,user,applicationId),ownerField=scope.role==='hr'?'employerUid':'seekerUid',filters={applicationId,[ownerField]:user.uid};
 const assignments=await store.query('aligna_work_assignments',filters),attempts=await store.query('aligna_work_attempts',{...filters,...(scope.role==='hr'?{status:'submitted'}:{})});
 const tasks=await Promise.all(assignments.map(async a=>{const task=assignmentDefinition(a),attempt=attempts.find(x=>x.assignmentId===a.id)||null,review=attempt?.status==='submitted'?await store.get('aligna_work_reviews/'+a.id):null;let numeric=null;
  if(attempt?.status==='submitted'){numeric=checkFormalNumbers(task,cleanFormalAnswers(attempt.answers));if(scope.role!=='hr'&&!review)delete numeric.reference;}
  return {assignment:a,task,attempt,review:review?{...review,summary:reviewSummary(cleanFormalReview(task,review.ratings))}:null,numeric};
 }));
 const available=[],unavailable=[];for(const id of ['resource-plan','record-audit']){const task=formalTask(id);try{available.push({id,title:task.title,minutes:task.minutes,linkedSkillIds:task.linkedSkillIds,scenarioCases:task.scenarioCases,...taskLinkage(scope.app,task)});}catch(error){unavailable.push({id,title:task.title,minutes:task.minutes,reason:error.message});}}
 return {role:scope.role,application:{id:applicationId,jobId:scope.app.jobId,jobTitle:scope.app.jobTitle,candidateName:scope.app.candidate?.displayName||'',frozenVersion:scope.app.jobRequirementsVersion||0},available,unavailable,tasks};
}
export async function workAction(store,user,body){
 const {app,role,applicationId}=await workScope(store,user,body.applicationId);
  if(body.action==='assign'){
   if(role!=='hr')fail('work-not-authorized',403);const task=formalTask(body.taskId,body.variant);if(!['independent','ai-assisted'].includes(body.condition)||![15,20,25,30,45,60].includes(body.minutes))fail('invalid-task-conditions');
  const id=applicationId+'--'+task.id+'--'+task.variant,existing=(await store.query('aligna_work_assignments',{applicationId,employerUid:user.uid})).find(a=>a.id===id);
  if(existing){if(existing.condition!==body.condition||existing.minutes!==body.minutes)fail('assignment-already-frozen',409);return {saved:true,id,unchanged:true};}
   const links=taskLinkage(app,task),data={applicationId,employerUid:app.employerUid,seekerUid:app.seekerUid,jobId:app.jobId,jobRequirementsVersion:links.jobRequirementsVersion,skillIds:links.skillIds,workOutputIds:links.workOutputIds,taskId:task.id,variant:task.variant,taskVersion:FORMAL_VERSION,rubricVersion:task.rubricVersion,condition:body.condition,minutes:body.minutes};
   const saved=await store.write('aligna_work_assignments/'+id,data,{create:true,serverFields:['createdAt']});for(const k of Object.keys(data))if(JSON.stringify(saved[k])!==JSON.stringify(data[k]))fail('work-save-not-confirmed',503);return {saved:true,id};
 }
 if(!validId(body.assignmentId))fail('invalid-assignment');const assignment=await store.get('aligna_work_assignments/'+body.assignmentId);if(!assignment||assignment.applicationId!==applicationId)fail('work-not-authorized',403);const task=assignmentDefinition(assignment),path='aligna_work_attempts/'+assignment.id;
 if(body.action==='review'){
  if(role!=='hr'||body.confirmed!==true)fail('review-confirmation-required',403);const attempt=await store.get(path);if(attempt?.status!=='submitted')fail('submitted-work-required',409);if(body.attemptVersion!==attempt._updateTime||body.rubricVersion!==task.rubricVersion)fail('work-write-conflict',409);
  const ratings=cleanFormalReview(task,body.ratings),rpath='aligna_work_reviews/'+assignment.id,old=await store.get(rpath);if(old)fail('review-already-recorded',409);
  const data={assignmentId:assignment.id,applicationId,employerUid:app.employerUid,seekerUid:app.seekerUid,reviewerUid:user.uid,taskVersion:FORMAL_VERSION,rubricVersion:task.rubricVersion,attemptVersion:attempt._updateTime,ratings};const saved=await store.write(rpath,data,{create:true,serverFields:['createdAt']});if(contentVersion(saved.ratings)!==contentVersion(ratings))fail('work-save-not-confirmed',503);return {saved:true,id:assignment.id,summary:reviewSummary(ratings)};
 }
 if(role!=='seeker')fail('work-not-authorized',403);const old=await store.get(path);
 if(body.action==='start'){
  if(old)return {saved:true,id:assignment.id,unchanged:true};
  const data={assignmentId:assignment.id,applicationId,employerUid:app.employerUid,seekerUid:user.uid,taskId:task.id,variant:task.variant,taskVersion:FORMAL_VERSION,rubricVersion:task.rubricVersion,condition:assignment.condition,status:'in-progress',answers:{decision:'',calculation:'',reasoning:'',verification:'',claimedMaximum:'',uniqueCount:'',completedCount:'',selected:[],exceptions:[]},declaredTools:[],consentVersion:'',submittedAt:null};
  await store.write(path,data,{create:true,serverFields:['createdAt','startedAt','updatedAt']});return {saved:true,id:assignment.id};
 }
 if(!['save','submit'].includes(body.action)||!old)fail('work-not-started',409);if(old.status!=='in-progress')fail('work-already-submitted',409);if(body.attemptVersion!==old._updateTime)fail('work-write-conflict',409);
 const answers=cleanFormalAnswers(body.answers),declaredTools=toolsFor(body.declaredTools,assignment.condition);if(body.action==='submit'&&(body.consentVersion!=='work-sample-share-v1'||['decision','calculation','reasoning','verification'].some(k=>!answers[k])))fail('submission-confirmation-required');
 const submit=body.action==='submit',data={...old,answers,declaredTools,status:submit?'submitted':'in-progress',consentVersion:submit?'work-sample-share-v1':'',submittedAt:null};
 const saved=await store.write(path,data,{updateTime:old._updateTime,serverFields:['updatedAt',...(submit?['submittedAt']:[])]});if(contentVersion(saved.answers)!==contentVersion(answers)||saved.status!==data.status)fail('work-save-not-confirmed',503);return {saved:true,id:assignment.id};
}
