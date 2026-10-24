import assert from 'node:assert/strict';
import test from 'node:test';
import {cleanInterviewRecord,compareInterviewRecords,interviewRubricVersion,shareableInterviewFeedback} from '../interview-record.js';

const job={requirements:{skills:[
  {skillId:'excel',label:{zh:'Excel',en:'Excel',ms:'Excel'},type:'professional',requirement:'entry_required',observableBehavior:'核对并解释记录',allowedEvidence:['work_sample','interview']},
  {skillId:'communication',label:{zh:'沟通',en:'Communication',ms:'Komunikasi'},type:'collaboration',requirement:'trainable',observableBehavior:'说明交接和下一步',allowedEvidence:['interview']}
]}};
const base={interviewAt:'2026-10-23T02:00:00.000Z',interviewTimeZone:'Asia/Kuala_Lumpur',toolCondition:'电子表格可用；25 分钟；提供合理无障碍安排。',items:[
  {skillId:'excel',status:'sufficient',quote:'我先核对唯一记录，再解释异常。',observation:'指出了输入、限制和复核步骤。',share:true},
  {skillId:'communication',status:'unobserved',quote:'',observation:'',share:false}
],followups:[{skillId:'excel',question:'请说明相关经历。',status:'not_applicable',response:'',share:false}]};

test('structured interview record requires four explicit states and concrete evidence for observed states',()=>{
  const record=cleanInterviewRecord(base,job);
  assert.ok(record);
  assert.equal(record.rubricVersion,interviewRubricVersion(job));
  assert.equal(cleanInterviewRecord({...base,items:base.items.map(x=>x.skillId==='excel'?{...x,quote:''}:x)},job),null);
  assert.equal(cleanInterviewRecord({...base,items:base.items.map(x=>x.skillId==='excel'?{...x,status:'not_applicable',quote:''}:x)},job).items[0].status,'not_applicable');
});

test('shared feedback only contains explicitly shared observations and disagreement stays descriptive',()=>{
  const record=cleanInterviewRecord(base,job),feedback=shareableInterviewFeedback(record,job);
  assert.equal(feedback.items.length,1);
  assert.equal(feedback.items[0].skillId,'excel');
  const second=cleanInterviewRecord({...base,items:base.items.map(x=>x.skillId==='excel'?{...x,status:'partial',quote:'需要补充一个例子。'}:x)},job);
  const comparison=compareInterviewRecords(record,second);
  assert.equal(comparison.comparable,1);
  assert.equal(comparison.agreements,0);
  assert.match(comparison.scope,/not honesty/);
});
