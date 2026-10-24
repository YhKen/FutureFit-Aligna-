import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {budgetReference,evaluateBudgetTask,evaluateHandoverTask} from '../task-rules.js';
import {journeyProgress,completedChallenge} from '../journey.js';
test('public budget practice independently checks all 16 combinations',()=>{
 const options=[['A',60,20,30],['B',45,40,45],['C',90,10,40],['D',120,80,70]];
 let subsets=[[]];for(const item of options)subsets=[...subsets,...subsets.map(s=>s.concat([item]))];
 for(const s of subsets){const total=i=>s.reduce((v,o)=>v+o[i],0);const expected=total(1)<=240&&total(2)<=120&&total(3)>=100;assert.equal(evaluateBudgetTask(s.map(o=>o[0])).numericPassed,expected);}
 assert.deepEqual(budgetReference().feasible.map(s=>s.ids.join('')).sort(),['ABC','AD','BD','CD']);
 assert.equal(budgetReference(true).maxReach,115);assert.equal(budgetReference(true).feasible.length,0);
});
test('clicking infeasible or adding a number keyword cannot certify reasoning',()=>{
 assert.equal(evaluateBudgetTask([],true,'115',true).numericPassed,false);
 assert.equal(evaluateBudgetTask([],true,'anything',true,115).numericPassed,true);
 assert.equal(evaluateBudgetTask([],true,'115',false,115).numericPassed,false);
 for(const value of [evaluateBudgetTask(['A','D']),evaluateBudgetTask([],true,'',true,115),evaluateHandoverTask({sum:29,mismatch:true,explanation:'arbitrary'})]){assert.equal(value.reviewRequired,true);assert.equal(value.recommendedAdjustment,null);assert.equal(value.verification,'public-practice-unverified');}
 for(const ids of [['A','A','B','C'],['A','D','X']])assert.equal(evaluateBudgetTask(ids).numericPassed,false);
 assert.equal(evaluateHandoverTask('29 duplicate timestamp verify').numericPassed,false);
 assert.equal(evaluateHandoverTask({sum:26,mismatch:true}).numericPassed,false);
});
test('fresh applicants and old games cannot qualify for the workspace',()=>{
 assert.equal(journeyProgress([],[]).ready,false);
 const session={createdAt:'2026-10-22T00:00:00Z',completedAt:'2026-10-22T01:00:00Z'};
 assert.equal(completedChallenge({type:'memory',version:1,updatedAt:'2026-10-22T00:30:00Z',trials:Array(6),summary:{targets:39}},session),false);
 assert.equal(completedChallenge({type:'memory',version:1,updatedAt:'invalid',trials:Array(6),summary:{targets:39}},session),false);
});
test('no silent offline identity, fabricated result or unapproved news is shipped',()=>{
 const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
 assert.doesNotMatch(read('cloud.js'),/uid:\s*['"]S001|isOffline:\s*true|return localStore/);
 assert.doesNotMatch(read('journey.js'),/mockSession|if\(isTest/);
 assert.doesNotMatch(read('assessment-v2.js'),/S001-session/);
 assert.doesNotMatch(read('news-alert.js'),/CURATED_NEWS_ALERTS|isVerified:\s*true/);
 assert.doesNotMatch(read('practice-page.js'),/client\.save\(['"]plans|client\.save\(['"]tasks/);
 assert.match(read('shared.js'),/Future Fit/);
 assert.match(read('account-screen.js'),/Future Fit/);
 assert.doesNotMatch(read('skill-flow.js'),/5-\(5-r\.rating\)/);
});
