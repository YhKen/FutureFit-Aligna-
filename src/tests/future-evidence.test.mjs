import test from 'node:test';import assert from 'node:assert/strict';
import {rankFutures} from '../future-engine.js';import {publishedLearningEvidence} from '../trend-evidence.js';
import bank from '../bank-v2.js';import occupations from '../occupations.js';
const now=Date.now(),date=new Date(now-3600000).toISOString(),excerpt='Workforce training now includes clear written reports for accounts teams.';
const article={id:'synthetic-trend',status:'published',title:'Synthetic workforce training',url:'https://example.test/grounded',source:'Synthetic source',date,publishedAt:date,evidenceScope:'excerpt',excerpt,analysis:{requiresReview:true,impacts:[{skill:'Writing',quote:'clear written reports',confidence:'supported',usable:true,rationale:{en:'Practise written reporting.'}}]},review:{decision:'approve'}};
const answers=['realistic','investigative','artistic','social','enterprising','conventional'].map((dimension,i)=>({itemId:bank.items.find(q=>q.category==='interest'&&q.dimension===dimension).id,value:[2,3,2,5,4,4][i]}));
test('only current published, approved, grounded, jurisdiction-relevant learning evidence passes',()=>{
 assert.equal(publishedLearningEvidence([article,article],{now}).length,1);
 for(const change of [{status:'pending'},{evidenceScope:'headline-only'},{jurisdiction:'US'},{review:{decision:'reject'}},{date:'2020-01-01'},{url:'javascript:bad'},{excerpt:'Unrelated excerpt'},{date:new Date(now+3600000).toISOString()}])assert.equal(publishedLearningEvidence([{...article,...change}],{now,country:'MY'}).length,0);
 assert.equal(publishedLearningEvidence([{...article,jurisdiction:'US'}],{country:'US',now}).length,1);
});
test('article volume never boosts occupation ranks or personal ability; supported evidence adjusts only relevant practice',()=>{
 const roles=occupations.jobs.filter(j=>j.id==='13-2011.00'||j.id==='43-4051.00'||j.id==='13-1082.00'),baseline=rankFutures(bank.items,answers,roles,{now}),headline=rankFutures(bank.items,answers,roles,{signals:Array.from({length:10},(_,i)=>({...article,id:String(i),evidenceScope:'headline-only'})),now}),changed=rankFutures(bank.items,answers,roles,{signals:[article],country:'MY',newsVersion:'synthetic-v2',now});
 assert.deepEqual(headline.map(r=>[r.job.id,r.total,r.base]),baseline.map(r=>[r.job.id,r.total,r.base]));
 assert.deepEqual(changed.map(r=>[r.job.id,r.total,r.base]),baseline.map(r=>[r.job.id,r.total,r.base]));
 assert.ok(changed.flatMap(r=>r.gaps).some(g=>g.i.name==='Writing'&&g.trendFactor===1.1));
 assert.ok(changed.flatMap(r=>r.gaps).filter(g=>g.i.name!=='Writing').every(g=>g.trendFactor===1));
 assert.ok(changed.every(r=>r.newsAdjustment===0&&r.context.trendVersion==='synthetic-v2'));
 const accelerated=rankFutures(bank.items,answers,roles,{scenario:'accelerated',now});assert.ok(accelerated.every(r=>r.scenarioAdjustment===0),'Missing self-reports must not invent adaptability');
 const supportedAnswers=answers.concat(['Active Learning','Critical Thinking'].map(name=>({itemId:bank.items.find(q=>q.name===name).id,value:5})));
 assert.ok(rankFutures(bank.items,supportedAnswers,roles,{scenario:'accelerated',now}).some(r=>r.scenarioAdjustment>0));
 const flatAnswers=answers.map(a=>({...a,value:3})).concat(supportedAnswers.slice(-2));assert.ok(rankFutures(bank.items,flatAnswers,roles,{scenario:'accelerated',now}).every(r=>r.scenarioAdjustment===0));
 assert.throws(()=>rankFutures(bank.items,answers,roles,{scenario:'unknown'}));
});
