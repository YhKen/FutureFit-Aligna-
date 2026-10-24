import {test} from 'node:test';import assert from 'node:assert/strict';
import {stageApplicationRecord,respondApplicationRecord} from '../applications-api.js';
const context=(old,job={status:'published',requirementsVersion:1})=>({db:{},current:()=>old,F:{doc:(_,collection,id)=>({collection,id}),serverTimestamp:()=>123,runTransaction:async(_,fn)=>fn({get:async ref=>ref.collection==='aligna_jobs'?{exists:()=>!!job,data:()=>job}:{exists:()=>true,data:()=>old},update:(_,value)=>{old={...old,...value};}})}});
test('duplicate invitation saves retain accepted/declined replies; genuine rescheduling requests a new reply',async()=>{
 for(const reply of ['accepted','declined','pending']){
  let old={active:true,jobId:'job',status:'interview',interviewAt:'2026-10-25T07:00:00.000Z',interviewDetails:'Synthetic test interview',interviewResponse:reply},writes=0;
  const c=context(old);c.F.runTransaction=async(_,fn)=>fn({get:async ref=>ref.collection==='aligna_jobs'?{exists:()=>true,data:()=>({status:'published',requirementsVersion:1})}:{exists:()=>true,data:()=>old},update:(_,value)=>{writes++;old={...old,...value};}});
  assert.equal(await stageApplicationRecord(c,'test',old.status,old.interviewAt,old.interviewDetails),false);assert.equal(writes,0);assert.equal(old.interviewResponse,reply);
  assert.equal(await stageApplicationRecord(c,'test','interview','2026-10-26T07:00:00.000Z',old.interviewDetails),true);assert.equal(writes,1);assert.equal(old.interviewResponse,'pending');
  old.active=false;await assert.rejects(stageApplicationRecord(c,'test','reviewing'),/withdrawn/);assert.equal(writes,1);
 }
});
test('candidate can propose one alternative time and closed postings are blocked while frozen application versions remain unchanged',async()=>{
 let old={active:true,jobId:'job',jobRequirementsVersion:1,status:'interview',interviewAt:'2026-10-25T07:00:00.000Z',interviewDetails:'Synthetic test interview',interviewResponse:'pending',interviewProposalAt:'',interviewProposalTimeZone:'Asia/Kuala_Lumpur',interviewProposalDetails:''},job={status:'published',requirementsVersion:1},c=context(old,job);
 assert.equal(await respondApplicationRecord(c,'test','proposed','2026-10-26T02:00:00.000Z','Need a different slot','Asia/Tokyo'),true);assert.equal(c.current().interviewResponse,'proposed');assert.equal(c.current().interviewProposalTimeZone,'Asia/Tokyo');assert.equal(c.current().interviewProposalDetails,'Need a different slot');
 await assert.rejects(respondApplicationRecord(c,'test','accepted'),/response-not-pending/);
 c.current().interviewResponse='pending';job.status='closed';await assert.rejects(respondApplicationRecord(c,'test','accepted'),/job-closed/);
 job.status='published';job.requirementsVersion=2;assert.equal(await stageApplicationRecord(c,'test','interview',old.interviewAt,old.interviewDetails),false);assert.equal(c.current().jobRequirementsVersion,1); // The application remains pinned to its own snapshot.
});
test('invalid stages and incomplete invitations do not write',async()=>{
 await assert.rejects(stageApplicationRecord({},'x','invalid'),/invalid-stage/);
 await assert.rejects(stageApplicationRecord({},'x','interview','',''),/interview-details-required/);
});
