import test from 'node:test';
import assert from 'node:assert/strict';
import {skillId} from '../skill-catalog.js';
import {contentVersion,privateSessionEvidence} from '../integration-contract.js';
import {matchCandidate} from '../match-engine.js';
import {matchTraceView} from '../match-trace.js';
import {syntheticCandidate,syntheticRoles} from '../integration-fixtures.js';
import bank from '../bank-v2.js';
import occupations from '../occupations.js';

test('stable IDs resolve explicit multilingual aliases without substring inference',()=>{
 assert.equal(skillId('EXCEL'),skillId('Microsoft Excel'));assert.equal(skillId('积极倾听'),skillId('Active Listening'));
 assert.notEqual(skillId('Not SQL'),skillId('SQL'));assert.ok(skillId('a custom craft').startsWith('custom:'));
 assert.equal(contentVersion({b:2,a:1}),contentVersion({a:1,b:2}));
});
test('same actual match inputs produce the same trace on both sides and after reload',()=>{
 for(const job of syntheticRoles){
  assert.ok(occupations.jobs.some(j=>j.id===job.id),'fixtures use actual catalogue IDs');
  const a=matchCandidate(job,syntheticCandidate),b=matchCandidate(JSON.parse(JSON.stringify(job)),JSON.parse(JSON.stringify(syntheticCandidate)));
  assert.deepEqual(a,b);assert.ok(a.rows.every(r=>r.skillId&&r.trace.recordId===null||r.skillId&&r.trace.recordId.startsWith('evidence:')));
  for(const locale of ['zh','en','ms'])for(const audience of ['hr','seeker'])assert.ok(matchTraceView(job,syntheticCandidate,locale,{audience}).includes(a.context.inputVersion));
 }
});
test('meaningful changes invalidate versions; demographics, games and aliases do not',()=>{
 const job={skills:'Excel, SQL',softSkills:'Communication'},candidate={skills:[{name:'Excel',example:'Synthetic totals check.'}]},base=matchCandidate(job,candidate);
 assert.notEqual(matchCandidate({...job,skills:'Excel, SQL, Writing'},candidate).context.jobVersion,base.context.jobVersion);
 assert.notEqual(matchCandidate(job,{skills:[{name:'Excel',example:'Different example.'}]}).context.evidenceVersion,base.context.evidenceVersion);
 assert.equal(matchCandidate(job,{...candidate,age:90,gender:'female',gameScore:9,personality:{N:1},displayName:'PRIVATE'}).context.inputVersion,base.context.inputVersion);
 assert.equal(matchCandidate(job,{skills:[{name:'EXCEL',example:'Synthetic totals check.'}]}).context.inputVersion,base.context.inputVersion);
 const dupA=matchCandidate(job,{skills:[{name:'Excel',example:'one'},{name:'excel',example:'two'}]}),dupB=matchCandidate(job,{skills:[{name:'excel',example:'two'},{name:'Excel',example:'one'}]});
 assert.notEqual(dupA.context.evidenceVersion,dupB.context.evidenceVersion,'last-record-wins changes actual evidence');
 assert.equal(matchCandidate(job,{skills:[{name:'Excel',verified:true,sourceType:'credential',example:'Claim'}]}).context.records[0].verification,'not-independently-verified');
});
test('private session evidence never promotes CV, personality or game claims into verification',()=>{
 const skill=bank.items.find(i=>i.category==='skill'),personality=bank.items.find(i=>i.category==='personality');
 const result=privateSessionEvidence({id:'fixture-session',profile:{confirmedSkills:['Excel'],experience:'PRIVATE RAW CV'},responses:[{itemId:skill.id,value:4},{itemId:personality.id,value:5}],games:{trials:['PRIVATE GAME']}},bank.items);
 assert.equal(result.records.length,2);assert.ok(!JSON.stringify(result).includes('PRIVATE'));
 assert.ok(result.records.every(r=>r.verification==='not-independently-verified'));assert.ok(result.sharing.startsWith('private'));
});
