import {test} from 'node:test';import assert from 'node:assert/strict';
import {localToIso,localValue,INTERVIEW_TIME_ZONES} from '../interview-time.js';
import {stageApplicationRecord,respondApplicationRecord,saveStageConfirmed,saveResponseConfirmed,invitationToken} from '../applications-api.js';
import {formalTask,emptyFormalAnswers} from '../formal-work-data.js';
import {resourceReference,recordsReference,checkFormalNumbers} from '../lib/formal-work-keys.js';
import {taskLinkage} from '../lib/formal-work-service.js';
import {validateRequirements} from '../job-requirements.js';
function context(){const state={app:{active:true,status:'interview',jobId:'j',jobRequirementsVersion:1,interviewAt:'2026-10-25T07:00:00.000Z',interviewTimeZone:'Asia/Kuala_Lumpur',interviewDetails:'Synthetic interview',interviewResponse:'pending'},job:{status:'published',requirementsVersion:2},writes:0};const snap=data=>({exists:()=>!!data,data:()=>structuredClone(data)});const c={db:{},F:{doc:(_,collection,id)=>({collection,id}),serverTimestamp:()=>123,getDocFromServer:async()=>snap(state.app),runTransaction:async(_,fn)=>fn({get:async ref=>snap(ref.collection==='aligna_jobs'?state.job:state.app),update:(_,value)=>{Object.assign(state.app,value);state.writes++;}})}};return {state,c};}
test('all four advertised time zones roundtrip independently of the browser or host time zone',()=>{
 const expected=['2026-10-25T01:30:00.000Z','2026-10-25T01:30:00.000Z','2026-10-25T00:30:00.000Z','2026-10-25T09:30:00.000Z'];
 INTERVIEW_TIME_ZONES.forEach((zone,i)=>{assert.equal(localToIso('2026-10-25T09:30',zone),expected[i]);assert.equal(localValue(expected[i],zone),'2026-10-25T09:30');});
 for(const value of ['2026-02-29T09:00','2026-02-31T09:00','2026-00-01T09:00','2026-10-25T24:00','2026-10-25T09:60'])assert.throws(()=>localToIso(value,'UTC'),/invalid-interview-time/);
 assert.throws(()=>localToIso('2026-10-25T09:30','Europe/London'),/invalid-time-zone/);
});
test('confirmed no-op saves retain accepted or proposed responses without falsely reporting a failed save',async()=>{
 for(const response of ['accepted','declined','proposed']){const {state,c}=context();state.app.interviewResponse=response;const before=structuredClone(state.app);assert.equal(await saveStageConfirmed(c,'a','interview',before.interviewAt,before.interviewDetails,before.interviewTimeZone),false);assert.deepEqual(state.app,before);assert.equal(state.writes,0);}
});
test('a candidate cannot accept a different invitation from the one shown and retries do not duplicate writes',async()=>{
 const {state,c}=context(),old=invitationToken(state.app);await stageApplicationRecord(c,'a','interview','2026-10-26T07:00:00.000Z','Revised arrangement','Asia/Tokyo',old);
 await assert.rejects(saveResponseConfirmed(c,'a','accepted','','','UTC',old),/interview-changed/);assert.equal(state.app.interviewResponse,'pending');
 const token=invitationToken(state.app);assert.equal(await saveResponseConfirmed(c,'a','proposed','2026-10-27T02:00:00.000Z','  Another slot  ','Asia/Tokyo',token),true);const writes=state.writes;
 assert.equal(await saveResponseConfirmed(c,'a','proposed','2026-10-27T02:00:00.000Z','Another slot','Asia/Tokyo',token),false);assert.equal(state.writes,writes);
 await assert.rejects(respondApplicationRecord(c,'a','accepted','','','UTC',token),/response-not-pending/);
 state.app.active=false;await assert.rejects(respondApplicationRecord(c,'a','declined'),/withdrawn/);
});
test('leaving interview stage clears schedule fields and closed jobs still allow completing existing applications',async()=>{
 const {state,c}=context();state.job.status='closed';await assert.rejects(stageApplicationRecord(c,'a','interview','2026-10-27T02:00:00.000Z','New invitation'),/job-closed/);
 await saveStageConfirmed(c,'a','completed','ignored time','ignored details','Asia/Tokyo');assert.equal(state.app.interviewAt,'');assert.equal(state.app.interviewDetails,'');assert.equal(state.app.interviewTimeZone,'Asia/Kuala_Lumpur');assert.equal(state.app.jobRequirementsVersion,1);
});
test('metadata additions preserve the four existing task rubric versions and link only frozen job skills and outputs',()=>{
 const expected=['28dae21ed97d0656','aea0ea2e72bdca7c','7b57b5c3a72b980f','2d5526ad706e17fb'];let i=0;
 for(const id of ['resource-plan','record-audit'])for(const variant of ['A','B'])assert.equal(formalTask(id,variant).rubricVersion,'formal-rubric:'+expected[i++]);
 const requirements=validateRequirements({skills:[{skillId:'skill:Mathematics',label:{en:'Mathematics',zh:'数学应用',ms:'Matematik'},type:'professional',requirement:'entry_required',observableBehavior:'Check totals',allowedEvidence:['work_sample']}],workOutputs:[{id:'totals',description:'Verify totals',skillIds:['skill:Mathematics']}],qualifications:[],workConditions:{location:{value:'Synthetic',status:'specified'},salary:{min:1,max:2,currency:'MYR',period:'monthly'},workArrangement:{mode:'onsite',schedule:''}}});
 const application={jobRequirementsVersion:1,jobSnapshot:{requirementsVersion:1,requirements}};assert.deepEqual(taskLinkage(application,formalTask('resource-plan')).skillIds,['skill:Mathematics']);assert.deepEqual(taskLinkage(application,formalTask('record-audit')).workOutputIds,['totals']);
 assert.throws(()=>taskLinkage({...application,jobRequirementsVersion:2},formalTask('resource-plan')),/task-job-version-invalid/);
 assert.throws(()=>taskLinkage({jobRequirementsVersion:1,jobSnapshot:{requirementsVersion:1,requirements:{...requirements,workOutputs:[]}}},formalTask('resource-plan')),/task-not-linked-to-job/);
});
test('incomplete, infeasible and conflicting materials never produce a fabricated numerical pass',()=>{
 const resource=formalTask('resource-plan'),missing=structuredClone(resource.materials);delete missing.options[0].cost;assert.throws(()=>resourceReference(missing),/insufficient-task-materials/);
 assert.throws(()=>resourceReference({...resource.materials,budget:0}),/no-feasible-task-plan/);
 const changed=structuredClone(resource);changed.materials.budget=0;assert.throws(()=>checkFormalNumbers(changed,{...emptyFormalAnswers(),selected:['A','B','E'],claimedMaximum:'120'}),/no-feasible-task-plan/);
 const record=formalTask('record-audit','B');assert.equal(recordsReference(record.materials).conflicts.includes('Q204'),true);
 assert.throws(()=>recordsReference({events:[{eventId:'x',deliveryId:'p',status:'delivered'}]}),/insufficient-task-materials/);
 assert.throws(()=>recordsReference({events:[{eventId:'x',deliveryId:'p',time:'bad-date',status:'delivered'}]}),/invalid-task-materials/);
 assert.throws(()=>recordsReference({events:[{eventId:'x',deliveryId:'p',time:'2026-10-22T00:00:00Z',status:'pending'},{eventId:'x',deliveryId:'p',time:'2026-10-22T00:00:00Z',status:'delivered'}]}),/ambiguous-event-definition/);
});
