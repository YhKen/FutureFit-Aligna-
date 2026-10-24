import {workScope,cleanFormalReview} from './formal-work-service.js';
import {formalTask,reviewSummary} from '../formal-work-data.js';
import {contentVersion} from '../integration-contract.js';
import {safeError} from './news-store.js';
export const C={head:'aligna_work_review_heads',correction:'aligna_work_corrections',clarification:'aligna_work_clarifications',request:'aligna_work_review_requests',independent:'aligna_work_independent_reviews'};
const fail=(c,s=400)=>{throw safeError(c,s);},valid=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,220}$/.test(s),text=(s,max=3000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
const summarize=(task,r)=>r?{...r,summary:reviewSummary(cleanFormalReview(task,r.ratings))}:null;
export function cleanRaterDeclaration(d){
 if(!d||d.version!=='rater-declaration-v1'||['ownWork','noDiscussion','aiUsed','identityRecognized','synthetic'].some(k=>typeof d[k]!=='boolean')||typeof d.conflicts!=='string'||d.conflicts.length>1000)fail('invalid-rater-declaration');
 return {version:d.version,ownWork:d.ownWork,noDiscussion:d.noDiscussion,aiUsed:d.aiUsed,identityRecognized:d.identityRecognized,conflicts:d.conflicts.trim(),synthetic:d.synthetic};
}
export function compareRatings(first,second){
 const dimensions=first.map(a=>{const b=second.find(x=>x.criterionId===a.criterionId),paired=a.score!==null&&b?.score!==null&&b?.score!==undefined;return {criterionId:a.criterionId,first:a.score,second:b?.score??null,paired,difference:paired?b.score-a.score:null};}),paired=dimensions.filter(x=>x.paired),exact=paired.filter(x=>x.difference===0).length;
 return {dimensions,paired:paired.length,exact,agreementPercent:paired.length?Math.round(exact/paired.length*100):null,meanAbsoluteDifference:paired.length?paired.reduce((s,x)=>s+Math.abs(x.difference),0)/paired.length:null,scope:'Descriptive agreement for this task only; not inter-rater reliability, ability or hiring probability',reliabilityStatus:'requires-independent-human-sample-by-criterion-and-equivalent-conditions'};
}
async function assignmentScope(store,user,body){const scope=await workScope(store,user,body.applicationId);if(!valid(body.assignmentId))fail('invalid-assignment');const a=await store.get('aligna_work_assignments/'+body.assignmentId);if(!a||a.applicationId!==body.applicationId)fail('work-not-authorized',403);const task=formalTask(a.taskId,a.variant),attempt=await store.get('aligna_work_attempts/'+a.id),original=await store.get('aligna_work_reviews/'+a.id);if(attempt?.status!=='submitted'||!original)fail('review-required',409);return {...scope,a,task,attempt,original};}
async function history(store,a,original){const head=await store.get(C.head+'/'+a.id),rows=[];let id=head?.correctionId||'';for(let n=0;id&&n<20;n++){const r=await store.get(C.correction+'/'+id);if(!r||r.assignmentId!==a.id)fail('review-history-incomplete',409);rows.push(r);id=r.previousId;}if(id)fail('review-history-incomplete',409);return {head,corrections:rows,current:rows[0]||original,currentRef:rows[0]?.id||'original'};}
export async function followupContext(store,user,applicationId){
 const scope=await workScope(store,user,applicationId),filter={applicationId,[scope.role==='hr'?'employerUid':'seekerUid']:user.uid};
 const [assignments,requests,clarifications]=await Promise.all([store.query('aligna_work_assignments',filter),store.query(C.request,filter),store.query(C.clarification,filter)]);
 const rows=await Promise.all(assignments.map(async a=>{const task=formalTask(a.taskId,a.variant),original=await store.get('aligna_work_reviews/'+a.id);if(!original)return null;const h=await history(store,a,original),invitations=await Promise.all(requests.filter(x=>x.assignmentId===a.id).map(async r=>{const independent=await store.get(C.independent+'/'+r.id);return {...r,independent:summarize(task,independent),comparison:independent?compareRatings(original.ratings,independent.ratings):null,currentComparison:independent?compareRatings(h.current.ratings,independent.ratings):null};}));return {assignment:a,task,original:summarize(task,original),current:summarize(task,h.current),currentRef:h.currentRef,head:h.head,corrections:h.corrections.map(r=>summarize(task,r)),clarifications:clarifications.filter(x=>x.assignmentId===a.id),invitations};}));
 return {role:scope.role,applicationId,rows:rows.filter(Boolean)};
}
export async function reviewerContext(store,user,id){
 if(id&&!valid(id))fail('invalid-review');const requests=id?[await store.get(C.request+'/'+id)]:[],rows=[];
 for(const r of requests){if(!r||r.status!=='approved'||r.reviewerUid!==user.uid)fail('review-access-closed',403);const a=await store.get('aligna_work_assignments/'+r.assignmentId),attempt=await store.get('aligna_work_attempts/'+r.assignmentId);if(attempt?.status!=='submitted'||attempt._updateTime!==r.attemptVersion)fail('work-write-conflict',409);const task=formalTask(a.taskId,a.variant),review=await store.get(C.independent+'/'+r.id);rows.push({request:{id:r.id,attemptVersion:r.attemptVersion,rubricVersion:r.rubricVersion,status:r.status},assignment:{id:a.id,condition:a.condition,minutes:a.minutes},task,attempt:{answers:attempt.answers,declaredTools:attempt.declaredTools,submittedAt:attempt.submittedAt},review:summarize(task,review)});}
 return {role:'reviewer',rows};
}
export async function followupAction(store,user,b){
 if(b.action==='independent-review'){
  if(!valid(b.requestId)||b.confirmed!==true)fail('review-confirmation-required');const r=await store.get(C.request+'/'+b.requestId);if(!r||r.status!=='approved'||r.reviewerUid!==user.uid||user.uid===r.employerUid||user.uid===r.seekerUid)fail('review-access-closed',403);
  const a=await store.get('aligna_work_assignments/'+r.assignmentId),attempt=await store.get('aligna_work_attempts/'+r.assignmentId);if(attempt._updateTime!==r.attemptVersion||b.attemptVersion!==r.attemptVersion)fail('work-write-conflict',409);const task=formalTask(a.taskId,a.variant),ratings=cleanFormalReview(task,b.ratings),path=C.independent+'/'+r.id,old=await store.get(path);if(old)fail('review-already-recorded',409);
  const d={requestId:r.id,assignmentId:r.assignmentId,applicationId:r.applicationId,employerUid:r.employerUid,seekerUid:r.seekerUid,reviewerUid:user.uid,attemptVersion:r.attemptVersion,rubricVersion:r.rubricVersion,ratings,blindReview:true,...(b.raterDeclaration?{raterDeclaration:cleanRaterDeclaration(b.raterDeclaration)}:{})};const saved=await store.write(path,d,{create:true,serverFields:['createdAt']});if(contentVersion(saved.ratings)!==contentVersion(ratings))fail('work-save-not-confirmed',503);return {saved:true,id:r.id};
 }
 const scope=await assignmentScope(store,user,b),{role,a,task,attempt,original}=scope;
 const base={assignmentId:a.id,applicationId:a.applicationId,employerUid:a.employerUid,seekerUid:a.seekerUid};
 if(b.action==='correct'){
  if(role!=='hr'||b.confirmed!==true)fail('review-confirmation-required',403);if(!text(b.reason))fail('correction-reason-required');const h=await history(store,a,original);if(b.baseRef!==h.currentRef||b.headVersion!==(h.head?._updateTime||''))fail('work-write-conflict',409);const ratings=cleanFormalReview(task,b.ratings);if(contentVersion(ratings)===contentVersion(h.current.ratings))fail('correction-unchanged',409);const revision=(h.head?.revision||0)+1;if(revision>20)fail('review-history-limit',409);const id=a.id+'--r'+revision,d={...base,reviewerUid:user.uid,revision,previousId:h.head?.correctionId||'',reason:b.reason.trim(),attemptVersion:attempt._updateTime,rubricVersion:task.rubricVersion,ratings};
  const head={...base,correctionId:id,revision};const [saved,savedHead]=await store.atomic([{path:C.correction+'/'+id,data:d,create:true,serverFields:['createdAt']},{path:C.head+'/'+a.id,data:head,...(h.head?{updateTime:h.head._updateTime}:{create:true}),serverFields:['updatedAt']}]);if(contentVersion(saved.ratings)!==contentVersion(ratings)||savedHead.correctionId!==id)fail('work-save-not-confirmed',503);return {saved:true,id,revision};
 }
 if(b.action==='clarify'){
  if(role!=='seeker'||b.confirmed!==true)fail('clarification-confirmation-required',403);if(!text(b.message)||!['overall',...task.criteria.map(x=>x.id)].includes(b.criterionId)||!valid(b.operationId)||b.operationId.length>80)fail('invalid-clarification');const h=await history(store,a,original);if(b.reviewRef!==h.currentRef)fail('work-write-conflict',409);const id=a.id+'--q'+b.operationId,path=C.clarification+'/'+id,old=(await store.query(C.clarification,{assignmentId:a.id,seekerUid:user.uid})).find(x=>x.id===id);if(old){if(old.message!==b.message.trim()||old.criterionId!==b.criterionId||old.reviewRef!==b.reviewRef)fail('work-write-conflict',409);return {saved:true,id,unchanged:true};}
  await store.write(path,{...base,reviewRef:b.reviewRef,criterionId:b.criterionId,message:b.message.trim(),status:'open',response:'',resolution:'',correctionId:'',answeredAt:null,respondedBy:'',consentVersion:'work-clarification-share-v1'},{create:true,serverFields:['createdAt','updatedAt']});return {saved:true,id};
 }
 if(b.action==='respond'){
  if(role!=='hr'||!valid(b.clarificationId)||!text(b.response)||!['explain','corrected','need-info'].includes(b.resolution))fail('invalid-response');const path=C.clarification+'/'+b.clarificationId,r=await store.get(path);if(!r||r.assignmentId!==a.id||r.status!=='open'||b.recordVersion!==r._updateTime)fail('work-write-conflict',409);if(b.resolution==='corrected'){const correction=valid(b.correctionId)?await store.get(C.correction+'/'+b.correctionId):null;const prior=r.reviewRef==='original'?0:(await store.get(C.correction+'/'+r.reviewRef))?.revision;if(correction?.assignmentId!==a.id||correction.revision<=prior)fail('correction-required');}
  await store.write(path,{...r,status:'answered',response:b.response.trim(),resolution:b.resolution,correctionId:b.resolution==='corrected'?b.correctionId:'',respondedBy:user.uid},{updateTime:r._updateTime,serverFields:['updatedAt','answeredAt']});return {saved:true,id:r.id};
 }
 if(b.action==='invite-reviewer'){
  if(role!=='hr'||!valid(b.reviewerUid)||b.reviewerUid.length>128||[a.employerUid,a.seekerUid].includes(b.reviewerUid))fail('different-reviewer-required');const id=a.id+'--'+b.reviewerUid,path=C.request+'/'+id,old=(await store.query(C.request,{applicationId:a.applicationId,assignmentId:a.id,employerUid:user.uid})).find(x=>x.id===id);if(old)return {saved:true,id,unchanged:true};
  await store.write(path,{...base,reviewerUid:b.reviewerUid,attemptVersion:attempt._updateTime,taskVersion:task.version,rubricVersion:task.rubricVersion,status:'pending',consentVersion:'',approvedAt:null,revokedAt:null},{create:true,serverFields:['createdAt','updatedAt']});return {saved:true,id};
 }
 if(b.action==='review-consent'){
  if(role!=='seeker'||!valid(b.requestId)||!['approve','revoke'].includes(b.decision)||b.confirmed!==true)fail('review-consent-required');const path=C.request+'/'+b.requestId,r=await store.get(path);if(!r||r.assignmentId!==a.id||r._updateTime!==b.recordVersion||r.status==='revoked'||b.decision==='approve'&&r.status!=='pending')fail('work-write-conflict',409);
  await store.write(path,{...r,status:b.decision==='approve'?'approved':'revoked',consentVersion:b.decision==='approve'?'independent-task-share-v1':r.consentVersion},{updateTime:r._updateTime,serverFields:['updatedAt',b.decision==='approve'?'approvedAt':'revokedAt']});return {saved:true,id:r.id};
 }
 fail('invalid-action');
}
