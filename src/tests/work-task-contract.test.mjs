import test from 'node:test';import assert from 'node:assert/strict';
import {startTask,evaluateTask} from '../work-task-contract.js';
import {syntheticTasks,startedSyntheticTask} from '../integration-fixtures.js';
const review=(start,overrides={})=>evaluateTask(start,{rubricVersion:start.rubricVersion,ratings:[{criterionId:'check',score:2,observation:'Checked totals and flagged a missing synthetic row.'}],reviewerRole:'human-reviewer',reviewerId:'synthetic-reviewer',reviewedAt:'2026-10-21T01:00:00.000Z',...overrides});
test('predeclared rubric is copied and edits invalidate a started task',()=>{
 const definition=structuredClone(syntheticTasks[0]),start=startTask(definition,{condition:'independent',startedAt:'2026-10-21T00:00:00Z'});
 definition.criteria[0].anchors[0]='changed';assert.notEqual(start.criteria[0].anchors[0],'changed');
 assert.throws(()=>review({...start,condition:'ai-assisted'}),/rubric-changed/);
 assert.throws(()=>review({...start,learningRules:[{...start.learningRules[0],unitId:'another-unit'}]}),/rubric-changed/);
});
test('only bounded matched practice can change; score and job match remain unchanged',()=>{
 const start=startedSyntheticTask(),result=review(start);
 assert.equal(result.actions.length,1);assert.equal(result.actions[0].unitId,'fixture-table-check-intro');assert.equal(result.actions[0].action,'eligible-to-skip-matched-intro-practice');assert.equal(result.actions[0].requiresUserConfirmation,true);
 assert.equal(result.changesJobMatchScore,false);assert.equal(result.changesGameOrPersonalityScores,false);
 assert.deepEqual(result,review(JSON.parse(JSON.stringify(start))));
});
test('unknown, low score, self-review and different tools retain the unit',()=>{
 const start=startedSyntheticTask();
 for(const score of [null,1])assert.equal(review(start,{ratings:[{criterionId:'check',score,observation:score?'Needed help':''}]}).actions[0].action,'retain-and-clarify');
 assert.equal(review(start,{reviewerRole:'self-review'}).actions[0].action,'retain-and-clarify');
 const assisted=startTask(syntheticTasks[0],{condition:'ai-assisted',startedAt:'2026-10-21T00:00:00Z'});
 assert.equal(review(assisted).actions[0].reason,'tool-condition-not-covered');
 assert.throws(()=>review(start,{ratings:[]}),/incomplete-task-review/);
 assert.throws(()=>review(start,{ratings:[{criterionId:'check',score:3,observation:''}]}),/invalid-task-rating/);
 assert.throws(()=>review(start,{reviewerRole:'model-generated'}),/invalid-task-reviewer/);
});
