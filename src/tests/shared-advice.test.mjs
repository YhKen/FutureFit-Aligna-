import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchCandidate,skillId} from '../match-engine.js';
import {snapshotJob,applicationJob,validateRequirements} from '../job-requirements.js';
import {jdMatchTraceView} from '../match-trace-panel.js';
import {learningRoute,jdLearningPlan} from '../jd-learning-data.js';
const row=(name,type='professional')=>({skillId:skillId(name),label:{en:name,zh:name,ms:name},type,requirement:'entry_required',observableBehavior:'Explain and check a synthetic work output.',allowedEvidence:['work_sample','interview']});
const requirements=validateRequirements({skills:[row('Microsoft Excel'),row('SQL'),row('Communication','collaboration')],workOutputs:[],qualifications:[],workConditions:{location:{value:'Kuala Lumpur',status:'specified'},salary:{min:3000,max:4000,currency:'MYR',period:'monthly'},workArrangement:{mode:'hybrid',schedule:''}}});
const job={id:'parity-fixture',jobTitle:'Synthetic Operations Assistant',skills:'',softSkills:'',requirements,requirementsVersion:1};
test('every shared skill, arithmetic contribution and learning panel is identical for both audiences in each language',()=>{
 for(let mask=0;mask<8;mask++){
  const candidate={skills:requirements.skills.filter((_,i)=>mask&(1<<i)).map(s=>({name:s.label.en,example:'Synthetic example for '+s.label.en}))};
  const m=matchCandidate(job,candidate),w=[2,2,1],present=w.map((n,i)=>mask&(1<<i)?n:0),sum=present.reduce((a,b)=>a+b,0),squares=present.reduce((a,b)=>a+b*b,0);
  assert.equal(m.coverage,Math.round(sum/5*100));assert.equal(m.cosinePercent,squares?Math.round(Math.sqrt(squares/9)*100):null);
  assert.ok(Math.abs(m.rows.reduce((s,r)=>s+(r.trace.contribution||0),0)-(m.cosine||0))<1e-12);
  for(const locale of ['zh','en','ms']){
   const hr=jdMatchTraceView(job,candidate,locale,{audience:'hr'}),seeker=jdMatchTraceView(job,candidate,locale,{audience:'seeker'});
   assert.equal(hr,seeker);assert.equal((hr.match(/data-shared-learning=/g)||[]).length,3);
   assert.ok(!hr.includes('data-jd-save'));assert.ok(!hr.includes('data-jd-step'));
   for(const r of m.rows)assert.ok(hr.includes(learningRoute(r.name,job,locale).reference));
  }
 }
});
test('learning references are language independent and frozen with application job context',()=>{
 const candidate={skills:[{name:'Excel',example:'Synthetic workbook.'}]},app={jobId:job.id,jobSnapshot:snapshotJob(job)},changed={...job,jobTitle:'Synthetic Accounting Assistant',requirementsVersion:2,requirements:validateRequirements({...requirements,skillTypes:undefined,entryLevels:undefined,skills:[row('Bookkeeping')]})};
 const frozen=applicationJob(app,changed),baseline=jdLearningPlan(applicationJob(app,null),candidate);
 assert.deepEqual(jdLearningPlan(frozen,candidate),baseline);
 for(const skill of ['SQL','Communication','Bookkeeping'])assert.equal(learningRoute(skill,job,'zh').reference,learningRoute(skill,job,'ms').reference);
 assert.notDeepEqual(jdLearningPlan(changed,candidate),baseline);
 assert.notEqual(learningRoute('Bookkeeping',job).reference,learningRoute('Bookkeeping',changed).reference);
});
test('structured-only job gets a learning route and unknown skills stay explicitly generic',async()=>{
 globalThis.window={alignaText:(zh,en)=>en};globalThis.document={documentElement:{lang:'en'}};
 const {jobLearningView}=await import('../jd-learning-ui.js');
 const html=jobLearningView(job,{skills:[]});assert.ok(html.includes('What to work on'));assert.ok(html.includes('Transact-SQL'));
 const unknown=learningRoute('Unlisted synthetic skill',job);assert.equal(unknown.specific,false);assert.equal(unknown.credential,null);assert.ok(unknown.noExam.includes('no exam'));
 delete globalThis.window;delete globalThis.document;
});
