import {validationDefinitionMatches} from './validation-definitions.js';
import {formalReference} from './formal-work-keys.js';
import {formalTask,FORMAL_VERSION} from '../formal-work-data.js';
import {contentVersion} from '../integration-contract.js';
import {workScope} from './formal-work-service.js';
import {followupAction,C} from './work-followup.js';
import {safeError} from './news-store.js';
import {contentValiditySummary,reliabilitySummary,VALIDATION_STATS_VERSION} from '../validation-statistics.js';

export const V={study:'aligna_validation_studies',expert:'aligna_validation_experts',opinion:'aligna_validation_opinions',credential:'aligna_validation_credentials',case:'aligna_validation_cases',participation:'aligna_validation_participation',report:'aligna_validation_reports',decision:'aligna_validation_decisions'};
const fail=(m,s=400)=>{throw safeError(m,s);};
const valid=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,220}$/.test(s);
const uid=s=>valid(s)&&s.length<=128;
const txt=(s,n,min=1)=>typeof s==='string'&&s.trim().length>=min&&s.length<=n;
const clean=s=>s.trim();
async function optional(store,path){try{return await store.get(path);}catch(e){if(e.status===403)return null;throw e;}}
function checkedTask(record){const task=formalTask(record.taskId,record.variant);if(!validationDefinitionMatches(record,task))fail('study-definition-unavailable',409);return task;}
async function ownerStudy(store,user,id){if(!valid(id))fail('invalid-study');const s=await store.get(V.study+'/'+id);if(!s||s.ownerUid!==user.uid)fail('study-not-authorized',403);const task=checkedTask(s);return {s,task};}
export function cleanExpertOpinion(task,raw){
 if(!raw||!txt(raw.background,1500,10)||!txt(raw.conflicts,1000)||!txt(raw.coverageNotes,2000,10)||!['revise','pilot-review','not-suitable'].includes(raw.recommendation)||typeof raw.synthetic!=='boolean'||typeof raw.independent!=='boolean'||!raw.synthetic&&raw.independent!==true)fail('incomplete-expert-opinion');
 if(!Array.isArray(raw.criteria)||raw.criteria.length!==4||new Set(raw.criteria.map(x=>x.criterionId)).size!==4)fail('incomplete-expert-opinion');
 const criteria=task.criteria.map(c=>{const r=raw.criteria.find(x=>x.criterionId===c.id);if(!r||['relevance','clarity','observability','fairness'].some(k=>!Number.isInteger(r[k])||r[k]<1||r[k]>4)||!txt(r.comment,1500,5))fail('incomplete-expert-opinion');return {criterionId:c.id,relevance:r.relevance,clarity:r.clarity,observability:r.observability,fairness:r.fairness,comment:clean(r.comment)};});
 return {background:clean(raw.background),conflicts:clean(raw.conflicts),coverageNotes:clean(raw.coverageNotes),recommendation:raw.recommendation,synthetic:raw.synthetic,independent:raw.independent,criteria};
}
export function independentDeclarationEligible(d){return !!d&&d.version==='rater-declaration-v1'&&d.ownWork===true&&d.noDiscussion===true&&d.aiUsed===false&&d.identityRecognized===false&&d.conflicts===''&&d.synthetic===false;}
const credentialOk=c=>!!c&&c.synthetic===false&&c.humanChecked===true;
const opinionOk=(o,c)=>o?.independent===true&&o.synthetic===false&&typeof o.conflicts==='string'&&o.conflicts.trim().toLowerCase()==='none'&&credentialOk(c);

export function snapshotStatistics(value){return {...value,reliability:{...value.reliability,dimensions:value.reliability.dimensions.map(d=>({...d,matrix:{rows:d.matrix.map((cells,i)=>({category:i+1,cells}))}}))}};}
export async function studyEvidence(store,s,task,{iterations=2000}={}){
 const credentials=await Promise.all([...new Set([...s.expertUids,s.raterA,s.raterB])].map(id=>optional(store,V.credential+'/'+s.id+'--'+id))),byUid=new Map(credentials.filter(Boolean).map(c=>[c.reviewerUid,c]));
 const experts=await Promise.all(s.expertUids.map(async id=>({packet:await store.get(V.expert+'/'+s.id+'--'+id),review:await optional(store,V.opinion+'/'+s.id+'--'+id),credential:byUid.get(id)||null})));
 const humanOpinions=experts.filter(x=>x.packet?.state!=='revoked'&&opinionOk(x.review,x.credential)).map(x=>x.review),demoOpinions=experts.filter(x=>x.packet?.state!=='revoked'&&x.review?.synthetic===true).map(x=>x.review);
 const cases=[],participants=new Set();
 for(const id of s.caseIds){
  const c=await store.get(V.case+'/'+id);if(!c)fail('study-case-missing',409);
  const requests=await Promise.all([s.raterA,s.raterB].map(r=>optional(store,C.request+'/'+c.assignmentId+'--'+r)));
  const reviews=await Promise.all([s.raterA,s.raterB].map(r=>optional(store,C.independent+'/'+c.assignmentId+'--'+r)));
  const assignment=await optional(store,'aligna_work_assignments/'+c.assignmentId),attempt=await optional(store,'aligna_work_attempts/'+c.assignmentId);
  const reasons=[];if(participants.has(c.seekerUid))reasons.push('duplicate-study-participant');participants.add(c.seekerUid);
  if(!assignment||!attempt)reasons.push('sharing-closed-or-record-unavailable');
  if(requests.some(r=>r?.status!=='approved'))reasons.push('two-active-candidate-consents-required');
  if(reviews.some(r=>!r))reasons.push('two-independent-reviews-required');
  if(requests.some(r=>r&&r.attemptVersion!==c.attemptVersion)||reviews.some(r=>r&&r.attemptVersion!==c.attemptVersion)||attempt&&attempt._updateTime!==c.attemptVersion)reasons.push('attempt-version-changed');
  if(assignment&&(assignment.rubricVersion!==s.rubricVersion||assignment.condition!==s.condition||assignment.minutes!==s.minutes))reasons.push('conditions-or-rubric-differ');
  const a=reviews[0]?.ratings,b=reviews[1]?.ratings;
  const row={caseId:c.caseAlias,a:task.criteria.map(x=>a?.find(r=>r.criterionId===x.id)?.score??null),b:task.criteria.map(x=>b?.find(r=>r.criterionId===x.id)?.score??null)};
  const participation=await optional(store,V.participation+'/'+c.id);
  if(!participation?.active||participation.attemptVersion!==c.attemptVersion)reasons.push('research-consent-required');
  const humanReasons=[...reasons];if(c.languageChecked!==true)humanReasons.push('administration-language-not-checked');if(!participation?.ownHumanResponse||participation.syntheticTest!==false)humanReasons.push('synthetic-or-unconfirmed-response');
  if(![s.raterA,s.raterB].every(r=>credentialOk(byUid.get(r))))humanReasons.push('rater-credentials-not-human-checked');
  if(reviews.some(r=>!independentDeclarationEligible(r?.raterDeclaration)))humanReasons.push('missing-or-ineligible-independence-declaration');
  if(!c.redactionChecked)humanReasons.push('identity-redaction-not-checked');
  cases.push({...c,participation,reasons:humanReasons,eligible:humanReasons.length===0,demoEligible:reasons.length===0&&participation?.syntheticTest===true,row,sourceVersions:[attempt?._updateTime||'',participation?._updateTime||'',...requests.map(x=>x?._updateTime||''),...reviews.map(x=>x?._updateTime||'')]});
 }
 const ids=task.criteria.map(c=>c.id),human=reliabilitySummary(cases.filter(c=>c.eligible).map(c=>c.row),ids,{iterations}),demo=reliabilitySummary(cases.filter(c=>c.demoEligible).map(c=>c.row),ids,{iterations});
 const digest=contentVersion({protocol:s.protocol,rubric:s.rubricVersion,experts:experts.map(e=>[e.packet?._updateTime,e.review?._updateTime,e.credential?._updateTime]),credentials:credentials.filter(Boolean).map(x=>[x.reviewerUid,x._updateTime]),cases:cases.map(c=>[c.id,c.sourceVersions,c.reasons])},'validation-evidence');
 return {experts,credentials:credentials.filter(Boolean),cases,human:{content:contentValiditySummary(humanOpinions,ids),reliability:human},demonstration:{content:contentValiditySummary(demoOpinions,ids),reliability:demo,label:'SYNTHETIC SOFTWARE TEST ONLY; NOT HUMAN VALIDATION'},sourceDigest:digest,validationStatus:'pending-human-validation',criteria:ids,missingHumanCases:Math.max(0,s.protocol.targetCases-human.n),missingHumanExperts:Math.max(0,s.protocol.targetExperts-humanOpinions.length)};
}
export async function validationContext(store,user,q){
 if(q.participant){if(!valid(q.participant))fail('invalid-study-case');const c=await store.get(V.case+'/'+q.participant);if(!c||c.seekerUid!==user.uid)fail('study-not-authorized',403);return {role:'participant',case:c,task:formalTask(c.taskId,c.variant),participation:await optional(store,V.participation+'/'+c.id)};}
 if(q.expert){if(!valid(q.expert))fail('invalid-expert-packet');const p=await store.get(V.expert+'/'+q.expert);if(!p||p.expertUid!==user.uid||p.state==='revoked')fail('expert-access-closed',403);return {role:'expert',packet:p,task:checkedTask(p),reference:formalReference(p.taskId,p.variant),review:await optional(store,V.opinion+'/'+p.id)};}
 if(!q.study)return {role:'owner',studies:await store.query(V.study,{ownerUid:user.uid})};
 const {s,task}=await ownerStudy(store,user,q.study);if(s.phase==='draft')return {role:'owner',study:s,task,evidence:null,reports:[],decisions:[]};
 const evidence=await studyEvidence(store,s,task),reports=await Promise.all(s.reportIds.map(id=>store.get(V.report+'/'+id)));
 for(const r of reports){const current=r.sourceDigest===evidence.sourceDigest;r.sourceCheck=!current?'historical-sources-changed':contentVersion(r.human)===contentVersion(snapshotStatistics(evidence.human))&&contentVersion(r.demonstration)===contentVersion(snapshotStatistics(evidence.demonstration))?'matches-current-sources':'stored-statistics-mismatch';}
 return {role:'owner',study:s,task,evidence,reports,decisions:await store.query(V.decision,{studyId:s.id,ownerUid:user.uid})};
}
export async function validationAction(store,user,b){
 if(['participate','withdraw-participation'].includes(b.action)){
  if(!valid(b.caseId)||b.confirmed!==true)fail('research-confirmation-required');const c=await store.get(V.case+'/'+b.caseId);if(!c||c.seekerUid!==user.uid)fail('study-not-authorized',403);
  if(b.action==='withdraw-participation'){const old=await store.get(V.participation+'/'+c.id);if(!old||!old.active)fail('research-access-closed',409);await store.write(V.participation+'/'+c.id,{...old,active:false},{updateTime:old._updateTime,serverFields:['updatedAt','revokedAt']});return {saved:true,id:c.id};}
  await workScope(store,user,c.applicationId);if(typeof b.ownHumanResponse!=='boolean'||typeof b.syntheticTest!=='boolean')fail('research-mode-required');const attempt=await store.get('aligna_work_attempts/'+c.assignmentId);if(attempt?._updateTime!==c.attemptVersion)fail('work-write-conflict',409);
  const d={studyId:c.studyId,caseId:c.id,ownerUid:c.ownerUid,seekerUid:user.uid,attemptVersion:c.attemptVersion,active:true,ownHumanResponse:b.ownHumanResponse,syntheticTest:b.syntheticTest,consentVersion:'validation-research-share-v1',revokedAt:null};await store.write(V.participation+'/'+c.id,d,{create:true,serverFields:['createdAt','updatedAt']});return {saved:true,id:c.id};
 }
 if(b.action==='create'){
  if(!valid(b.operationId)||b.operationId.length>60||!valid(b.referenceAssignmentId)||!txt(b.title,160)||!uid(b.raterA)||!uid(b.raterB)||b.raterA===b.raterB||[b.raterA,b.raterB].includes(user.uid))fail('invalid-study-plan');
  if(!Array.isArray(b.expertUids)||!b.expertUids.length||b.expertUids.length>10||new Set(b.expertUids).size!==b.expertUids.length||b.expertUids.some(x=>!uid(x)||x===user.uid)||!Number.isInteger(b.targetCases)||b.targetCases<10||b.targetCases>60||!Number.isInteger(b.targetExperts)||b.targetExperts<2||b.targetExperts>10||!txt(b.acceptanceRule,3000,20)||!['zh','en','ms'].includes(b.language))fail('invalid-study-plan');
  const a=await store.get('aligna_work_assignments/'+b.referenceAssignmentId);if(!a)fail('assignment-required');const {app,role}=await workScope(store,user,a.applicationId);if(role!=='hr'||!app.jobSnapshot)fail('study-not-authorized',403);const task=checkedTask(a);if(a.rubricVersion!==task.rubricVersion||!app.jobSnapshot.requirements)fail('study-definition-unavailable',409);
  const id='study-'+b.operationId,existing=(await store.query(V.study,{ownerUid:user.uid})).find(s=>s.id===id);
  const d={ownerUid:user.uid,title:clean(b.title),referenceAssignmentId:a.id,jobId:app.jobId,jobRequirementsVersion:app.jobRequirementsVersion,publicJob:app.jobSnapshot,taskId:task.id,variant:task.variant,taskVersion:task.version,rubricVersion:task.rubricVersion,condition:a.condition,minutes:a.minutes,language:b.language,raterA:b.raterA,raterB:b.raterB,expertUids:b.expertUids,protocol:{targetCases:b.targetCases,targetExperts:b.targetExperts,acceptanceRule:clean(b.acceptanceRule),samplingPlan:txt(b.samplingPlan,3000,10)?clean(b.samplingPlan):'Select distinct consented participants; exclude calibration cases; no precision guarantee from sample count.'},phase:'draft',caseIds:[],reportIds:[],validationStatus:'pending-human-validation',frozenAt:null,closedAt:null};
  if(existing){const keys=['title','referenceAssignmentId','raterA','raterB','expertUids','language','protocol'];if(keys.some(k=>contentVersion(existing[k])!==contentVersion(d[k])))fail('study-write-conflict',409);return {saved:true,id,unchanged:true};}
  const saved=await store.write(V.study+'/'+id,d,{create:true,serverFields:['createdAt','updatedAt']});if(saved.title!==d.title)fail('study-save-not-confirmed',503);return {saved:true,id};
 }
 if(b.action==='expert-submit'){
  if(!valid(b.packetId)||b.confirmed!==true)fail('expert-share-confirmation-required');const p=await store.get(V.expert+'/'+b.packetId);if(!p||p.expertUid!==user.uid||p.state!=='open')fail('expert-access-closed',403);if(b.packetVersion!==p._updateTime)fail('study-write-conflict',409);const task=checkedTask(p),opinion=cleanExpertOpinion(task,b.opinion),old=await optional(store,V.opinion+'/'+p.id);if(old)fail('expert-opinion-immutable',409);
  const d={studyId:p.studyId,ownerUid:p.ownerUid,expertUid:user.uid,packetVersion:p._updateTime,rubricVersion:p.rubricVersion,...opinion,consentVersion:'expert-opinion-share-v1'};const saved=await store.write(V.opinion+'/'+p.id,d,{create:true,serverFields:['createdAt']});if(contentVersion(saved.criteria)!==contentVersion(d.criteria))fail('study-save-not-confirmed',503);return {saved:true,id:p.id};
 }
 const {s,task}=await ownerStudy(store,user,b.studyId);
 if(b.action==='report'&&valid(b.operationId)&&s.reportIds.includes(s.id+'--'+b.operationId))return {saved:true,id:s.id+'--'+b.operationId,unchanged:true};
 if(b.studyVersion!==s._updateTime)fail('study-write-conflict',409);
 if(b.action==='freeze'){
  if(s.phase!=='draft'||b.confirmed!==true)fail('study-freeze-confirmation-required');const es=s.expertUids.map(expertUid=>({path:V.expert+'/'+s.id+'--'+expertUid,data:{studyId:s.id,ownerUid:user.uid,expertUid,publicJob:s.publicJob,taskId:s.taskId,variant:s.variant,taskVersion:s.taskVersion,rubricVersion:s.rubricVersion,language:s.language,state:'open'},create:true,serverFields:['createdAt','updatedAt']}));
  await store.atomic([{path:V.study+'/'+s.id,data:{...s,phase:'collecting'},updateTime:s._updateTime,serverFields:['updatedAt','frozenAt']},...es]);return {saved:true,id:s.id};
 }
 if(b.action==='close'){
  if(s.phase!=='collecting'||b.confirmed!==true)fail('study-not-open',409);const packets=await Promise.all(s.expertUids.map(id=>store.get(V.expert+'/'+s.id+'--'+id)));await store.atomic([{path:V.study+'/'+s.id,data:{...s,phase:'closed'},updateTime:s._updateTime,serverFields:['updatedAt','closedAt']},...packets.filter(p=>p.state==='open').map(p=>({path:V.expert+'/'+p.id,data:{...p,state:'closed'},updateTime:p._updateTime,serverFields:['updatedAt']}))]);return {saved:true,id:s.id};
 }
 if(b.action==='revoke-expert'){
  if(!s.expertUids.includes(b.expertUid)||b.confirmed!==true)fail('invalid-expert');const p=await store.get(V.expert+'/'+s.id+'--'+b.expertUid);await store.write(V.expert+'/'+p.id,{...p,state:'revoked'},{updateTime:p._updateTime,serverFields:['updatedAt']});return {saved:true,id:p.id};
 }
 if(b.action==='credential'){
  if(![...s.expertUids,s.raterA,s.raterB].includes(b.reviewerUid)||!txt(b.reviewerName,120)||!txt(b.professionalRole,300)||!txt(b.verificationNote,2000,20)||b.humanChecked!==true||typeof b.synthetic!=='boolean')fail('credential-check-required');
  const id=s.id+'--'+b.reviewerUid,prior=await optional(store,V.credential+'/'+id);if(prior){if(['reviewerName','professionalRole','verificationNote','synthetic'].every(k=>prior[k]===(typeof b[k]==='string'?clean(b[k]):b[k])))return {saved:true,id,unchanged:true};fail('credential-check-immutable',409);}await store.write(V.credential+'/'+id,{studyId:s.id,ownerUid:user.uid,reviewerUid:b.reviewerUid,reviewerName:clean(b.reviewerName),professionalRole:clean(b.professionalRole),verificationNote:clean(b.verificationNote),humanChecked:true,synthetic:b.synthetic,scope:'Qualification check declared by study owner, not independently verified by the software'},{create:true,serverFields:['createdAt']});return {saved:true,id};
 }
 if(b.action==='attach-case'){
  if(s.phase!=='collecting'||s.caseIds.length>=60||!valid(b.assignmentId)||(b.redactionChecked!==true||b.languageChecked!==true))fail('invalid-study-case');const a=await store.get('aligna_work_assignments/'+b.assignmentId);if(!a)fail('assignment-required');const {app,role}=await workScope(store,user,a.applicationId);const attempt=await store.get('aligna_work_attempts/'+a.id);
  if(role!=='hr'||a.jobId!==s.jobId||app.jobRequirementsVersion!==s.jobRequirementsVersion||a.taskId!==s.taskId||a.variant!==s.variant||a.rubricVersion!==s.rubricVersion||a.condition!==s.condition||a.minutes!==s.minutes||attempt?.status!=='submitted'||[s.raterA,s.raterB].includes(a.seekerUid))fail('case-does-not-match-frozen-study',409);
  const prior=await Promise.all(s.caseIds.map(id=>store.get(V.case+'/'+id)));if(prior.some(x=>x.assignmentId===a.id||x.seekerUid===a.seekerUid))fail('duplicate-study-participant',409);
  for(const reviewerUid of [s.raterA,s.raterB])await followupAction(store,user,{action:'invite-reviewer',applicationId:a.applicationId,assignmentId:a.id,reviewerUid});
  const caseAlias='C'+String(s.caseIds.length+1).padStart(3,'0'),id=s.id+'--'+caseAlias,d={studyId:s.id,ownerUid:user.uid,studyTitle:s.title,caseAlias,assignmentId:a.id,applicationId:a.applicationId,seekerUid:a.seekerUid,attemptVersion:attempt._updateTime,profileSynthetic:app.synthetic!==false,redactionChecked:true,languageChecked:true,taskId:s.taskId,variant:s.variant,condition:s.condition,minutes:s.minutes,reviewerUids:[s.raterA,s.raterB]};
  await store.atomic([{path:V.case+'/'+id,data:d,create:true,serverFields:['createdAt']},{path:V.study+'/'+s.id,data:{...s,caseIds:[...s.caseIds,id]},updateTime:s._updateTime,serverFields:['updatedAt']}]);return {saved:true,id,caseAlias,requestIds:[s.raterA,s.raterB].map(r=>a.id+'--'+r)};
 }
 if(b.action==='report'){
  if(s.phase==='draft'||!valid(b.operationId)||b.operationId.length>60)fail('invalid-report');const id=s.id+'--'+b.operationId;if(s.reportIds.includes(id))return {saved:true,id,unchanged:true};if(s.reportIds.length>=20)fail('study-report-limit',409);
  const evidence=await studyEvidence(store,s,task);const d={studyId:s.id,ownerUid:user.uid,statisticsVersion:VALIDATION_STATS_VERSION,sourceDigest:evidence.sourceDigest,human:snapshotStatistics(evidence.human),demonstration:snapshotStatistics(evidence.demonstration),missingHumanCases:evidence.missingHumanCases,missingHumanExperts:evidence.missingHumanExperts,validationStatus:'pending-human-validation',excludedCases:evidence.cases.filter(c=>!c.eligible).map(c=>({caseId:c.caseAlias,reasons:c.reasons})),protocol:s.protocol};
  await store.atomic([{path:V.report+'/'+id,data:d,create:true,serverFields:['createdAt']},{path:V.study+'/'+s.id,data:{...s,reportIds:[...s.reportIds,id]},updateTime:s._updateTime,serverFields:['updatedAt']}]);return {saved:true,id};
 }
 if(b.action==='decision'){
  if(!['revise','pilot-only','need-more-evidence'].includes(b.decision)||!txt(b.rationale,3000,20)||!txt(b.reviewerName,120)||!s.reportIds.includes(b.reportId)||!valid(b.operationId)||typeof b.synthetic!=='boolean'||b.confirmed!==true)fail('manual-review-required');const evidence=await studyEvidence(store,s,task),report=await store.get(V.report+'/'+b.reportId);if(report.sourceDigest!==evidence.sourceDigest)fail('report-is-stale',409);if(contentVersion(report.human)!==contentVersion(snapshotStatistics(evidence.human))||contentVersion(report.demonstration)!==contentVersion(snapshotStatistics(evidence.demonstration)))fail('stored-statistics-mismatch',409);
  const id=s.id+'--'+b.operationId,old=await optional(store,V.decision+'/'+id);if(old){if(['reportId','decision','rationale','reviewerName','synthetic'].every(k=>old[k]===(typeof b[k]==='string'?clean(b[k]):b[k])))return {saved:true,id,unchanged:true};fail('study-write-conflict',409);}await store.write(V.decision+'/'+id,{studyId:s.id,ownerUid:user.uid,reportId:b.reportId,sourceDigest:report.sourceDigest,decision:b.decision,rationale:clean(b.rationale),reviewerName:clean(b.reviewerName),synthetic:b.synthetic,validationStatus:'pending-human-validation',scope:'Internal review record, not a validity certificate or hiring decision'},{create:true,serverFields:['createdAt']});return {saved:true,id};
 }
 fail('invalid-validation-action');
}
