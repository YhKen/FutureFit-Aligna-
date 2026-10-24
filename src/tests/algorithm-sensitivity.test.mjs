import test from 'node:test';import assert from 'node:assert/strict';
import {matchCandidate} from '../match-engine.js';import {validateRequirements,matchingBasisFromJob} from '../job-requirements.js';
import {jobWeightSensitivity,careerWeightSensitivity} from '../algorithm-sensitivity.js';import {matchSensitivityView} from '../match-sensitivity-view.js';
import {jdMatchTraceView} from '../match-trace-panel.js';
const job={skills:'Excel, SQL',softSkills:'Communication'},candidate={skills:[{name:'Excel'},{name:'SQL'}]};
test('malformed empty structured requirements cannot silently receive a legacy score or application basis',()=>{
 for(const requirements of [{},{skills:[]},{skills:''},{skills:null},{skills:'Excel'}]){const j={...job,requirements},m=matchCandidate(j,candidate);assert.equal(m.coverage,null);assert.equal(m.cosine,null);assert.equal(m.dataIssue,'invalid-structured-requirements');assert.equal(m.rows.length,0);assert.throws(()=>matchingBasisFromJob(j),/invalid-structured-requirements/);assert.equal(jobWeightSensitivity(m).available,false);}
 assert.equal(matchCandidate(job,candidate).coverage,80);
 const valid=validateRequirements({skills:[],workOutputs:[],qualifications:[],workConditions:{location:{value:'',status:'unknown'},salary:{min:0,max:0,currency:'MYR',period:'monthly'},workArrangement:{mode:'unknown',schedule:''}}});assert.equal(matchCandidate({...job,requirements:valid},candidate).coverage,80,'valid work-condition-only compatibility is preserved');
});
test('predeclared job sensitivity preserves the baseline and is not a calibrated uncertainty interval',()=>{
 const m=matchCandidate(job,candidate),before=structuredClone(m),r=jobWeightSensitivity(m);assert.deepEqual(m,before);assert.deepEqual(r.scenarios.map(s=>s.coveragePercent),[67,80,86]);const current=r.scenarios.find(s=>s.id==='current');assert.equal(current.coveragePercent,m.coverage);assert.equal(current.cosinePercent,m.cosinePercent);assert(Math.abs(r.coverageRange.spread-(600/7-200/3))<1e-10);assert.match(r.scope,/not confidence intervals/);
 const reverse=jobWeightSensitivity(matchCandidate({skills:'SQL, Excel',softSkills:'Communication'},candidate));assert.deepEqual(reverse.scenarios,r.scenarios);
 const extra=jobWeightSensitivity(matchCandidate(job,{skills:[...candidate.skills,{name:'Cooking'}],age:99,gameScore:900}));assert.deepEqual(extra.scenarios,r.scenarios);
});
test('zero records, no targets and a single skill group preserve mathematical edge cases',()=>{
 const zero=jobWeightSensitivity(matchCandidate(job,{skills:[]}));assert(zero.scenarios.every(s=>s.coverage===0&&s.cosine===null));assert.equal(zero.cosineRange,null);
 assert.equal(jobWeightSensitivity(matchCandidate({skills:'',softSkills:''},candidate)).available,false);
 const one=jobWeightSensitivity(matchCandidate({skills:'Excel, SQL',softSkills:''},{skills:[{name:'Excel'}]}));assert(one.scenarios.every(s=>s.coverage===50&&Math.abs(s.cosine-Math.sqrt(.5))<1e-12));
});
test('career sensitivity keeps insufficient skill evidence and flat-interest safeguards',()=>{
 const rows=[{job:{id:'b',title:'Beta'},interest:.8,skill:-.8,skillCount:3,flat:false},{job:{id:'a',title:'Alpha'},interest:.7,skill:.7,skillCount:2,flat:false}];const result=careerWeightSensitivity(rows,1);assert.equal(result.scenarios[0].top[0].id,'b');assert.equal(result.scenarios.find(x=>x.id==='current').top[0].id,'a');assert(result.scenarios.every(s=>s.ranked.find(r=>r.id==='a').score===.7));assert.equal(result.scenarios[0].jaccard,0);
 assert(careerWeightSensitivity(rows.map(r=>({...r,flat:true}))).scenarios.every(s=>s.top[0].id==='a'));
 assert.throws(()=>careerWeightSensitivity([rows[0],rows[0]]));assert.throws(()=>careerWeightSensitivity(rows,0));assert.equal(careerWeightSensitivity([]).available,false);
});
test('both audiences use the same sensitivity panel and translated invalid-input notice',()=>{
 const m=matchCandidate(job,candidate);for(const locale of ['zh','en','ms']){const panel=matchSensitivityView(m,locale);assert(panel.includes('1:1')&&panel.includes('2:1')&&panel.includes('3:1'));for(const audience of ['hr','seeker'])assert(jdMatchTraceView(job,candidate,locale,{audience}).includes(panel));const invalid=matchSensitivityView(matchCandidate({...job,requirements:{}},candidate),locale);assert(invalid.includes('role="status"'));assert(!invalid.includes('80%'));const full=jdMatchTraceView({...job,requirements:{}},candidate,locale);assert(full.includes(invalid));assert(!/NaN|Infinity/.test(full));}
});
