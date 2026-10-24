import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture,run,partition,eligiblePeople,fitLogistic,predict,metrics,fitRasch,nextToyItem,productionGate} from '../research-prototype.js';
test('synthetic research is reproducible, incomplete and never approved',()=>{
 const a=run(fixture()),b=run(fixture());assert.deepEqual(a,b);assert.equal(a.content.sCviAverage,null);assert.equal(a.gate.allowed,false);assert.equal(a.gate.status,'prototype-only');assert.equal(a.reliability.validationStatus,'pending-human-validation');assert.ok(a.excludedPeople>0);
});
test('person-level groups contain no leakage and each person has both records',()=>{
 const groups=partition(fixture()),sets=Object.values(groups).map(r=>new Set(r.map(x=>x.personId)));
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal([...sets[i]].filter(x=>sets[j].has(x)).length,0);
 for(const rows of Object.values(groups))for(const person of new Set(rows.map(x=>x.personId)))assert.equal(rows.filter(x=>x.personId===person).length,2);
});
test('consent purposes are separate; withdrawal removes every related record',()=>{
 const d=fixture(),p=d.people.find(p=>p.consent&&!p.withdrawn),before=run(d);p.trainingConsent=false;
 assert.ok(eligiblePeople(d).has(p.personId));assert.ok(!eligiblePeople(d,'training').has(p.personId));assert.ok(!Object.values(partition(d)).flat().some(r=>r.personId===p.personId));assert.equal(run(d).reliability.n,before.reliability.n);
 p.trainingConsent=true;p.ratingConsent=false;assert.equal(run(d).reliability.n,before.reliability.n-1);
 p.withdrawn=true;assert.ok(!eligiblePeople(d).has(p.personId));assert.ok(!Object.values(partition(d)).flat().some(r=>r.personId===p.personId));assert.equal(run(d).eligiblePeople,before.eligiblePeople-1);
});
test('test outcome changes do not affect fitted coefficients',()=>{
 const d=fixture(),before=run(d),ids=new Set(partition(d).test.map(r=>r.recordId));d.records.forEach(r=>{if(ids.has(r.recordId))r.y=1-r.y;});const after=run(d);
 assert.deepEqual(after.model,before.model);assert.notDeepEqual(after.evaluation.test,before.evaluation.test);assert.deepEqual(after.rasch,before.rasch);
});
test('arithmetic and degenerate evaluation cases',()=>{
 const rows=[{y:0},{y:1}],m=metrics(rows,[.25,.75]);assert.equal(m.brier,.0625);assert.equal(m.auc,1);assert.equal(metrics(rows,[.5,.5]).auc,.5);assert.equal(metrics([{y:1}],[.8]).auc,null);assert.equal(metrics([],[]).brier,null);
 assert.throws(()=>metrics(rows,[NaN,.5]));assert.throws(()=>fitLogistic([{x:[0,0,0],y:1}]));const model=fitLogistic(partition(fixture()).train);assert.ok(predict(model,[0,0,0])>0&&predict(model,[1,1,1])<1);
});
test('Rasch is finite, centred, ordered by information and exhausts unasked items',()=>{
 const model=fitRasch(fixture().binary);assert.ok(model.difficulty.every(Number.isFinite));assert.ok(Math.abs(model.theta.reduce((s,v)=>s+v,0))<1e-8);
 const asked=[];for(let i=0;i<8;i++){const n=nextToyItem(model.difficulty,0,asked);assert.ok(!asked.includes(n.item));assert.ok(n.information>0&&n.information<=.25);asked.push(n.item);}assert.equal(nextToyItem(model.difficulty,0,asked),null);
 assert.equal(nextToyItem([-4,-3,-2,-1,0,1,2,3],0).item,4);assert.throws(()=>nextToyItem(Array(8).fill(0),NaN));
 const extremes=fitRasch(Array.from({length:6},(_,i)=>({answers:Array(8).fill(i%2)})));assert.ok([...extremes.theta,...extremes.difficulty].every(Number.isFinite));
});
test('real-labelled and malformed records cannot enter this rehearsal',()=>{
 const d=fixture();d.people[0].synthetic=false;assert.throws(()=>run(d));const e=fixture();e.experts[0].synthetic=false;assert.throws(()=>run(e));const a=fixture();a.records.push(a.records[0]);assert.throws(()=>partition(a));const b=fixture();b.records.find(r=>eligiblePeople(b).has(r.personId)).x[0]=Infinity;assert.throws(()=>run(b));
});
test('production gate cannot be promoted by simulated permission records',()=>{
 const d=fixture();d.licenses.forEach(x=>x.state='approved');d.productionAllowed=true;assert.equal(run(d).gate.allowed,false);assert.equal(productionGate({allowed:true}).allowed,false);
});
test('all withdrawals withhold model outputs instead of crashing',()=>{
 const d=fixture();d.people.forEach(p=>p.withdrawn=true);const r=run(d);assert.equal(r.model,null);assert.equal(r.rasch,null);assert.equal(r.reliability.n,0);assert.equal(r.eligiblePeople,0);assert.equal(r.evaluation.test.model.brier,null);
});
test('three-language research UI uses authenticated Firebase workflow but never promotes production models',()=>{
 const view=fs.readFileSync(new URL('../research-lab.js',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../research-cloud-client.js',import.meta.url),'utf8');assert.ok(view.includes('ms:{'));assert.ok(view.includes('en:{'));assert.ok(view.includes('zh:{'));assert.ok(!view.includes('sessionStorage'));assert.ok(client.includes('requireAccount'));assert.ok(client.includes('/api/research-prototype'));assert.ok(client.includes('getIdToken'));const engine=fs.readFileSync(new URL('../engine-v2.js',import.meta.url),'utf8');assert.ok(!engine.includes('research-prototype'));
});
