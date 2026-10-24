import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {formalTask,emptyFormalAnswers,reviewSummary,formalWords} from '../formal-work-data.js';
import {formalReference,checkFormalNumbers} from '../lib/formal-work-keys.js';
import {workContext,workAction} from '../lib/formal-work-service.js';
const taskSkillNames=['Mathematics','Management of Financial Resources','Judgment and Decision Making','Critical Thinking','Quality Control Analysis','Complex Problem Solving'];
const jobSnapshot={jobTitle:'Synthetic operations role',requirementsVersion:1,requirements:{skills:taskSkillNames.map((name,i)=>({skillId:'skill:'+name.replaceAll(' ','%20'),label:{en:name,zh:name,ms:name},type:i%2?'collaboration':'professional',requirement:'entry_required',observableBehavior:'Synthetic observable behavior.',allowedEvidence:['work_sample']})),workOutputs:[{id:'output-operations',description:'Plan and verify synthetic operations work.',skillIds:taskSkillNames.map(name=>'skill:'+name.replaceAll(' ','%20'))}],qualifications:[],workConditions:{location:{value:'Synthetic',status:'specified'},salary:{min:1,max:2,currency:'MYR',period:'monthly'},workArrangement:{mode:'onsite',schedule:'Synthetic'}}}};
class Store{
 constructor(){this.rows=new Map([['aligna_applications/seeker_job',{active:true,seekerUid:'seeker',employerUid:'hr',jobId:'job',jobTitle:'Synthetic operations role',jobRequirementsVersion:1,jobSnapshot,candidate:{displayName:'Synthetic person'}}]]);this.n=0;}
 async get(p){return this.rows.has(p)?structuredClone(this.rows.get(p)):null;}
 async query(c,f){return [...this.rows].filter(([p,x])=>p.startsWith(c+'/')&&Object.entries(f).every(([k,v])=>x[k]===v)).map(([p,x])=>({...structuredClone(x),id:p.split('/').pop()}));}
 async write(p,data,{create,updateTime,serverFields=[]}={}){const old=this.rows.get(p);if(create&&old||!create&&old?._updateTime!==updateTime)throw Error('write-conflict');const row={...structuredClone(data),id:p.split('/').pop(),_updateTime:'t'+(++this.n)};for(const k of serverFields)row[k]='2026-10-22T00:00:'+String(this.n).padStart(2,'0')+'.000Z';this.rows.set(p,row);return structuredClone(row);}
}
const good=(task,v)=>({...emptyFormalAnswers(),decision:'A declared synthetic decision with owners and next actions.',calculation:'A reproducible synthetic calculation.',reasoning:'A comparison of alternatives and changed assumptions.',verification:'Independently recalculate, keep source rows and resolve exceptions.',...(task==='resource-plan'?{selected:v==='A'?['A','C','D']:['A','B','E'],claimedMaximum:v==='A'?'120':'116'}:{uniqueCount:'6',completedCount:v==='A'?'3':'2',exceptions:v==='A'?['P102','P103','P106']:['Q202','Q203','Q204','Q206']})});
test('four original forms have declared anchors and numerical reference answers, separate from public practice',()=>{
 for(const id of ['resource-plan','record-audit'])for(const variant of ['A','B']){const t=formalTask(id,variant),r=formalReference(id,variant);assert.equal(t.criteria.length,4);assert.ok(t.criteria.every(c=>c.anchors.length===3&&c.anchors.every(a=>['zh','en','ms'].every(l=>a[l]))));assert.equal(checkFormalNumbers(t,good(id,variant)).passed,true);if(id==='resource-plan'){assert.equal(r.combinations,64);assert.equal(r.maximum,variant==='A'?120:116);}else{assert.equal(r.uniqueCount,6);assert.equal(r.completedCount,variant==='A'?3:2);assert.equal(r.duplicateRows,1);}}
 const base=Object.keys(formalWords.en).sort();for(const l of ['zh','ms'])assert.deepEqual(Object.keys(formalWords[l]).sort(),base);
});
test('formal tasks expose scenario coverage and persist links to H01 job requirements',async()=>{
 const store=new Store(),result=await workAction(store,{uid:'hr'},{applicationId:'seeker_job',action:'assign',taskId:'resource-plan',variant:'A',condition:'independent',minutes:25}),assignment=await store.get('aligna_work_assignments/'+result.id),context=await workContext(store,{uid:'hr'},'seeker_job');
 assert.deepEqual(assignment.skillIds,taskSkillNames.slice(0,4).map(name=>'skill:'+name.replaceAll(' ','%20')));
 assert.deepEqual(assignment.workOutputIds,['output-operations']);
 assert.equal(context.available.find(x=>x.id==='resource-plan').scenarioCases.length,3);
 assert.deepEqual(context.available.find(x=>x.id==='resource-plan').scenarioCases.map(x=>x.id),['normal','insufficient-information','error']);
});
test('formal task roundtrip freezes conditions, hides drafts and references, and saves anchored human review',async()=>{
 const store=new Store(),hr={uid:'hr'},seeker={uid:'seeker'},app={applicationId:'seeker_job'};
 for(const taskId of ['resource-plan','record-audit'])for(const variant of ['A','B']){
  const a=await workAction(store,hr,{...app,action:'assign',taskId,variant,condition:'independent',minutes:25}),id=a.id;
  assert.equal((await workAction(store,hr,{...app,action:'assign',taskId,variant,condition:'independent',minutes:25})).unchanged,true);
  await assert.rejects(workAction(store,hr,{...app,action:'assign',taskId,variant,condition:'ai-assisted',minutes:25}),/already-frozen/);
  await workAction(store,seeker,{...app,action:'start',assignmentId:id});assert.equal((await workContext(store,hr,app.applicationId)).tasks.find(t=>t.assignment.id===id).attempt,null);
  let old=await store.get('aligna_work_attempts/'+id);const request={...app,assignmentId:id,attemptVersion:old._updateTime,answers:good(taskId,variant),declaredTools:['calculator']};
  await assert.rejects(workAction(store,seeker,{...request,action:'submit'}),/confirmation-required/);
  await assert.rejects(workAction(store,seeker,{...request,action:'save',declaredTools:['ai']}),/invalid-tools/);
  await workAction(store,seeker,{...request,action:'save'});await assert.rejects(workAction(store,seeker,{...request,action:'save'}),/conflict/);
  old=await store.get('aligna_work_attempts/'+id);await workAction(store,seeker,{...request,attemptVersion:old._updateTime,action:'submit',consentVersion:'work-sample-share-v1'});
  await assert.rejects(workAction(store,seeker,{...request,action:'save'}),/already-submitted/);
  let sc=(await workContext(store,seeker,app.applicationId)).tasks.find(t=>t.assignment.id===id),hc=(await workContext(store,hr,app.applicationId)).tasks.find(t=>t.assignment.id===id);
  assert.equal(sc.numeric.passed,true);assert.equal(sc.numeric.reference,undefined);assert.ok(hc.numeric.reference);assert.deepEqual(sc.attempt,hc.attempt);
  const ratings=hc.task.criteria.map((c,i)=>({criterionId:c.id,score:i===3?null:2,observation:i===3?'':'Observed in the submitted response field.'}));
  const review={...app,assignmentId:id,action:'review',confirmed:true,attemptVersion:hc.attempt._updateTime,rubricVersion:hc.task.rubricVersion,ratings};
  await assert.rejects(workAction(store,seeker,review),/confirmation-required/);
  await workAction(store,hr,review);await assert.rejects(workAction(store,hr,review),/already-recorded/);
  sc=(await workContext(store,seeker,app.applicationId)).tasks.find(t=>t.assignment.id===id);assert.equal(sc.review.summary.percent,67);assert.equal(sc.review.summary.observed,3);assert.ok(sc.numeric.reference);assert.equal(sc.review.reviewerUid,'hr');
 }
 await assert.rejects(workContext(store,{uid:'other'},app.applicationId),/not-authorized/);store.rows.get('aligna_applications/seeker_job').active=false;await assert.rejects(workContext(store,hr,app.applicationId),/sharing-closed/);
});
test('unknown observations do not become zero or hiring scores and answer key stays server-side',()=>{
 assert.deepEqual(reviewSummary(Array.from({length:4},()=>({score:null}))),{observed:0,totalCriteria:4,points:0,maxPoints:0,percent:null,notObserved:4,scope:'Observed criteria in this work sample only; not job-match score'});
 const ui=fs.readFileSync(new URL('../formal-work.js',import.meta.url),'utf8');assert.ok(!ui.includes('formal-work-keys'));assert.ok(!ui.includes('work-task-reviewer-role'));
 const rules=fs.readFileSync(new URL('../firebase/firestore.rules',import.meta.url),'utf8');for(const id of ['resource-plan','record-audit'])for(const variant of ['A','B'])assert.ok(rules.includes(formalTask(id,variant).rubricVersion));
 const wrong=good('resource-plan','A');wrong.selected=['B','C','E'];assert.equal(checkFormalNumbers(formalTask('resource-plan'),wrong).passed,false);
});
