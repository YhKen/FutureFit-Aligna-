import assert from 'node:assert/strict';
import bank from '../bank-v2.js';import occupations from '../occupations.js';
import {next} from '../engine-v2.js';import {evidenceStandard} from '../evidence-standard.js';import {journeyProgress} from '../journey.js';
for(const seed of [0,1,23,104,999,4294967295])for(const style of ['middle','mixed']){
 const answers=[];let total=30;
 while(true){while(answers.length<total){const pick=next(bank.items,answers,seed,occupations.jobs,total,{confirmedSkills:['Mathematics']});assert.ok(pick);assert.ok(!answers.some(a=>a.itemId===pick.item.id));answers.push({itemId:pick.item.id,value:pick.item.format==='choice'?1:style==='middle'?3:answers.length%2?5:1,routingVersion:'coverage-v1'});}
 const q=evidenceStandard(bank.items,answers);if(q.ready||q.atLimit){assert.ok(q.ready,`${seed}/${style} did not reach coverage at 60`);break;}assert.ok(q.nextTotal>total&&q.nextTotal<=60);total=q.nextTotal;
 }assert.ok(answers.length>=40);assert.ok(evidenceStandard(bank.items,answers).ready);
}
const one=bank.items[0],duplicate=Array.from({length:60},()=>({itemId:one.id,value:3}));assert.equal(evidenceStandard(bank.items,duplicate).atLimit,false);assert.equal(evidenceStandard(bank.items,duplicate).ready,false);
const incomplete={schemaVersion:2,status:'complete',totalQuestions:30,responses:Array.from({length:30},(_,i)=>({itemId:bank.items[i].id,value:3,routingVersion:'coverage-v1'})),completedAt:'2026-10-20T00:00:00Z'};assert.equal(journeyProgress([incomplete],[]).assessed,false,'new-policy sessions cannot bypass missing coverage');
console.log('Adaptive follow-ups reach all minimums; duplicates cannot satisfy the standard; gates enforce the policy.');
