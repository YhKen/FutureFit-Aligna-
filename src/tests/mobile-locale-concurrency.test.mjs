import test from 'node:test';
import assert from 'node:assert/strict';
import bank from '../bank-v2.js';
import {copy} from '../copy-v2.js';
import {jobEditToken,saveJobRecord} from '../jobs-api.js';
import {evidenceTypeLabel} from '../jd-sankey.js';
import {saveReadBack} from '../seeker-records.js';
import {journeyProgress} from '../journey.js';

test('all question prompts, choices and skill names exist in all three locales',()=>{
 assert.equal(bank.items.length,151);
 for(const item of bank.items)for(const locale of ['zh','en','ms']){
  assert.ok(item.text[locale]?.trim(),item.id+' prompt '+locale);
  if(item.category==='skill')assert.ok(item.label[locale]?.trim(),item.id+' skill '+locale);
  for(const option of item.options||[])assert.ok(option[locale]?.trim(),item.id+' option '+locale);
 }
 for(const locale of ['zh','en','ms'])for(const key of Object.keys(copy.en))assert.ok(copy[locale][key]!==undefined,key+' '+locale);
 assert.equal(evidenceTypeLabel('work_sample','ms'),'Sampel kerja');
 assert.equal(evidenceTypeLabel('employment_history','zh'),'相关经历');
 assert.equal(evidenceTypeLabel('assessment','en'),'Assessment');
});
test('legacy assessment records cannot bypass minimum coverage by omitting routing metadata',()=>{
 const session={schemaVersion:2,status:'complete',totalQuestions:30,responses:bank.items.slice(0,30).map(i=>({itemId:i.id,value:3})),completedAt:'2026-10-21T10:00:00.000Z'};
 const games=[{version:1,type:'memory',updatedAt:'2026-10-21T11:00:00.000Z',trials:Array(6).fill({}),summary:{targets:39}},{version:1,type:'switch',updatedAt:'2026-10-21T11:00:00.000Z',trials:Array(24).fill({}),summary:{total:24}}];
 const p=journeyProgress([session],games);assert.equal(p.coverage.ready,false);assert.equal(p.assessed,false);assert.equal(p.ready,false);
});
const job={jobTitle:'Synthetic only',salary:3000,jobDescription:'Synthetic output',jobField:'Operations',location:'Kuala Lumpur',skills:'Excel',softSkills:'Communication',jobRequirements:'Synthetic brief',futureSkills:'Excel',employmentType:'Full-time',employeeCount:1,workingTime:'Weekdays',companyName:'Synthetic Studio',ownerUid:'owner',status:'draft'};
test('a stale editor cannot silently overwrite a newer job or unpublish a colleague change',async()=>{
 const newer={...job,jobDescription:'Updated by colleague'},written=[];
 const c={user:{uid:'owner'},db:{},F:{doc:()=>({}),runTransaction:async(db,fn)=>fn({get:async()=>({exists:()=>true,data:()=>newer}),set:(...args)=>written.push(args)})}};
 await assert.rejects(saveJobRecord(c,{companyName:job.companyName},'job',job,'draft',jobEditToken(job)),/stale-job/);
 assert.equal(written.length,0);
 assert.equal(jobEditToken(job),jobEditToken({...job,updatedAt:'later',id:'display-only'}));
 assert.notEqual(jobEditToken(job),jobEditToken({...job,status:'closed'}));
});
test('a version race rejected by rules is reported as stale only after a newer owned revision is read',async()=>{
 const permission=Object.assign(new Error('denied'),{code:'permission-denied'});
 let latest={...job,jobDescription:'A colleague changed it'};
 const c={user:{uid:'owner'},db:{},F:{doc:()=>({}),runTransaction:async()=>{throw permission;},getDocFromServer:async()=>({exists:()=>true,data:()=>latest})}};
 await assert.rejects(saveJobRecord(c,{companyName:job.companyName},'job',job,'draft',jobEditToken(job)),/stale-job/);
 latest={...job};await assert.rejects(saveJobRecord(c,{companyName:job.companyName},'job',job,'draft',jobEditToken(job)),e=>e===permission);
 latest={...job,ownerUid:'someone-else'};await assert.rejects(saveJobRecord(c,{companyName:job.companyName},'job',job,'draft',jobEditToken(job)),e=>e===permission);
});
test('network and stale readback failures cannot report saved; retrying an identical committed record does not rewrite it',async()=>{
 const value={version:'qa',text:'Keep this input'},snap=raw=>({exists:()=>!!raw,data:()=>raw});let raw=null,writes=0,offline=true;
 const c={db:{},user:{uid:'owner'},F:{doc:()=>({}),getDocFromServer:async()=>{if(offline)throw Error('network');return snap(raw);}},save:async(col,id,v)=>{writes++;raw=structuredClone(v);}};
 await assert.rejects(saveReadBack(c,'interview_attempts','qa',value),/network/);assert.equal(writes,0);assert.equal(value.text,'Keep this input');
 offline=false;await saveReadBack(c,'interview_attempts','qa',value);await saveReadBack(c,'interview_attempts','qa',value);assert.equal(writes,1);
 raw=null;c.save=async()=>{writes++;};await assert.rejects(saveReadBack(c,'interview_attempts','qa',value),/save-not-confirmed/);
});
