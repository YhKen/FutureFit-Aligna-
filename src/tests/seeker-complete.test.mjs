import test from 'node:test';import assert from 'node:assert/strict';
import bank from '../bank-v2.js';import occupations from '../occupations.js';
import {cleanSettings,routeKey,updateKey,receiptFor,mayNotify,appliedPlan,saveReadBack} from '../seeker-records.js';
import {topologicalUnits,scheduleUnits,buildRoute} from '../learning-route.js';
import {transitionPlan} from '../transition-core.js';import {resourcePlan,resourceDetails} from '../resource-details.js';
import {practiceRecord,practiceSuggestion} from '../practice-record.js';import {seekerCopy,localMessage} from '../seeker-copy.js';import {sdgFor} from '../future-engine.js';
test('route capacities and prerequisites are independently checked with hour slots',()=>{
 for(const hours of [1,3,4,5,8,40])for(const months of [3,5,6,12]){
  const job=occupations.jobs.find(j=>j.id==='13-2011.00'),plan=transitionPlan(bank.items,{responses:[],profile:{confirmedSkills:[]}},job,{hours,months}),route=buildRoute(plan,cleanSettings({goalId:job.id,hours,months}));
  const slots=new Set();for(const u of route.scheduled){for(let h=u.startHour;h<u.endHour;h++){assert.ok(!slots.has(h));slots.add(h);}for(const dep of u.requires)assert.ok(route.scheduled.find(x=>x.id===dep).endHour<=u.startHour);}
  assert.equal(slots.size,route.used);assert.ok(Math.max(0,...slots)<route.capacity);assert.equal(route.weekly.reduce((n,w)=>n+w.hours,0),route.used);assert.ok(route.weekly.every(w=>w.hours<=hours));
 }
 assert.throws(()=>topologicalUnits([{id:'a',hours:1,requires:['b']},{id:'b',hours:1,requires:['a']}]));
 assert.throws(()=>topologicalUnits([{id:'a',hours:1,requires:['missing']}]));
 const r=scheduleUnits([{id:'a',hours:4,requires:[]},{id:'b',hours:1,requires:['a']},{id:'c',hours:1,requires:[]}],{weeks:1,hours:3});assert.deepEqual(r.scheduled.map(u=>u.id),['c']);assert.deepEqual(r.deferred.map(u=>u.id),['a','b']);
});
test('record and receipt identities change with context, not refresh time',()=>{
 const s=cleanSettings({goalId:'13-2011.00',hours:4});assert.notEqual(routeKey(s),routeKey({...s,months:5}));assert.throws(()=>cleanSettings({hours:0}));
 const now='2026-10-22T08:00:00Z',plan={goalId:s.goalId,country:'MY',months:3,hours:4,newsVersion:'v1',subscriptionUpdatedAt:now,baseline:[{name:'A'}],priorities:[{name:'B',priority:2,baselinePriority:1,evidence:[{url:'https://example.test/e',impact:{quote:'Example'}}]}]},sub={goalId:s.goalId,country:'MY',months:3,hours:4};
 assert.equal(updateKey(plan),updateKey({...plan,generatedAt:'tomorrow'}));assert.notEqual(updateKey(plan),updateKey({...plan,country:'SG'}));
 assert.ok(mayNotify(plan,sub,null));assert.equal(mayNotify(plan,{...sub,goalId:'15-1252.00'},null),false);
 const receipt=receiptFor(plan,'later',null,now);assert.equal(mayNotify(plan,sub,receipt,Date.parse(now)+1000),false);assert.ok(mayNotify(plan,sub,receipt,Date.parse(now)+86400001));
 const accepted=receiptFor(plan,'applied',receipt,now);assert.equal(appliedPlan(plan,accepted),plan);assert.equal(appliedPlan(plan,receiptFor(plan,'undone',accepted,now)),null);assert.equal(appliedPlan({...plan,newsVersion:'v2'},accepted),null);
});
test('private practice cannot certify skills, omit tools or alter matching',()=>{
 const a={selected:['A','D'],followUp:false,infeasible:false,maximum:'',sum:'',mismatch:false,explanation:'A feasible option',verification:'Check the assumptions'};
 const r=practiceRecord({id:'test-attempt-001',taskId:'task-budget-tradeoff',answers:a,condition:'ai-assisted'});assert.equal(r.result.numericPassed,true);assert.equal(r.verified,false);assert.equal(r.sourceType,'public-self-practice');assert.equal(r.condition,'ai-assisted');assert.deepEqual(practiceSuggestion(r),{skillName:'Management of Financial Resources',topic:'explain-tradeoffs',needsHumanReview:true,skipLearning:false,changesMatchScore:false,condition:'ai-assisted'});assert.throws(()=>practiceRecord({id:'x',taskId:r.taskId,answers:a}));
});
test('zero-budget resources never treat unknown or professional exam fees as free',()=>{
 const all=[{title:'ACCA',url:'https://www.accaglobal.com/uk/en/study-with-acca/our-qualifications.html',kind:'exam'},{title:'PL-300',url:'https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/',kind:'exam'}],r=resourcePlan(all,cleanSettings());assert.ok(r.required.every(x=>x.cost==='free'&&x.kind!=='professional-qualification'));assert.equal(r.guaranteedCost,0);assert.equal(r.optional.length,2);assert.equal(resourceDetails({url:'https://example.test/unknown'}).cost,'unknown');
});
test('seeker UI copy has all keys in three languages and all occupations have meaningful SDGs',()=>{
 for(const locale of ['zh','en','ms'])assert.deepEqual(Object.keys(seekerCopy[locale]).sort(),Object.keys(seekerCopy.en).sort());
 assert.equal(localMessage(seekerCopy.zh.saved,'en'),seekerCopy.en.saved);assert.equal(localMessage(seekerCopy.en.undone,'ms'),seekerCopy.ms.undone);
 for(const job of occupations.jobs)assert.ok(Number.isInteger(sdgFor(job))&&sdgFor(job)>=1&&sdgFor(job)<=17);
});
test('cloud confirmation requires read-back and treats a retry as idempotent',async()=>{
 let data=null,writes=0;const client={user:{uid:'synthetic'},db:{},F:{doc:()=>'',getDocFromServer:async()=>({exists:()=>!!data,data:()=>data})},save:async(c,id,v)=>{data=v;writes++;}};
 await saveReadBack(client,'private','one',{value:1});await saveReadBack(client,'private','one',{value:1});assert.equal(writes,1);
 client.save=async()=>{};await assert.rejects(saveReadBack(client,'private','one',{value:2}),/save-not-confirmed/);
});
