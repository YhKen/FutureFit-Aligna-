import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {formalTask,emptyFormalAnswers} from '../formal-work-data.js';
import {workAction,workContext} from '../lib/formal-work-service.js';
import {stageApplicationRecord,respondApplicationRecord} from '../applications-api.js';
import {skillId} from '../skill-catalog.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const uid={hr:'h06-hr',seeker:'h06-seeker',otherHr:'h06-other-hr'};
const applicationId='h06-synthetic-application';

function jobSnapshot(){
 const task=formalTask('resource-plan');
 const skills=task.criteria.map(c=>({
  skillId:skillId(c.skill),
  label:{en:c.skill,zh:c.skill,ms:c.skill},
  type:'professional',
  requirement:'entry_required',
  observableBehavior:`Can demonstrate ${c.skill} in the synthetic role.`,
  allowedEvidence:['work_sample','interview']
 }));
 return {
  jobTitle:'Synthetic operations role',requirementsVersion:1,
  requirements:{skills,workOutputs:[{id:'output-operations',description:'Plan and verify synthetic operations work.',skillIds:skills.map(s=>s.skillId)}],qualifications:[],
   workConditions:{location:{value:'Synthetic',status:'specified'},salary:{min:1,max:2,currency:'MYR',period:'monthly'},workArrangement:{mode:'onsite',schedule:'Synthetic'}}}
 };
}

class Store{
 constructor(){
  this.n=0;
  this.rows=new Map([['aligna_applications/'+applicationId,{active:true,seekerUid:uid.seeker,employerUid:uid.hr,jobId:'h06-job',jobTitle:'Synthetic operations role',jobRequirementsVersion:1,jobSnapshot:jobSnapshot(),candidate:{displayName:'Synthetic candidate'}}]]);
 }
 async get(path){return this.rows.has(path)?structuredClone(this.rows.get(path)):null;}
 async query(collection,filters){
  return [...this.rows].filter(([path,row])=>path.startsWith(collection+'/')&&Object.entries(filters).every(([key,value])=>row[key]===value)).map(([path,row])=>({...structuredClone(row),id:path.split('/').pop()}));
 }
 async write(path,data,{create,updateTime,serverFields=[]}={}){
  const old=this.rows.get(path);
  if(create?old:!old||old._updateTime!==updateTime)throw Error('write-conflict');
  const saved={...structuredClone(data),id:path.split('/').pop(),_updateTime:'t'+(++this.n)};
  for(const field of serverFields)saved[field]='2026-10-22T12:00:00.000Z';
  this.rows.set(path,saved);
  return structuredClone(saved);
 }
}

function ratings(task){return task.criteria.map(c=>({criterionId:c.id,score:2,observation:`Observed ${c.field} in the submitted synthetic response.`}));}

function interviewContext(state){
 const F={
  doc:(_db,collection,id)=>({collection,id}),
  serverTimestamp:()=> 'server-time',
  runTransaction:async(_db,callback)=>callback({
   get:async ref=>ref.collection==='aligna_jobs'?{exists:()=>true,data:()=>state.job}:{exists:()=>!!state.application,data:()=>state.application},
   update:(_ref,value)=>Object.assign(state.application,value)
  })
 };
 return {F,db:{}};
}

test('H06 acceptance evidence names the real boundary and preserves limitations',()=>{
 const dir=path.join(root,'docs','acceptance');
 const required=['formal-work-live-proof.json','formal-work-live-boundary-proof.json','interview-stage-live-proof.json','shared-jd-live-proof.json','responsive-language-proof.json','mobile-interaction-proof.json'];
 for(const name of required){
  const file=path.join(dir,name);
  assert.equal(fs.existsSync(file),true,`missing acceptance evidence: ${name}`);
  const value=JSON.parse(fs.readFileSync(file,'utf8'));
  if('syntheticOnly' in value)assert.equal(value.syntheticOnly,true,`${name} must remain synthetic-only`);
 }
 const release=JSON.parse(fs.readFileSync(path.join(dir,'release.json'),'utf8'));
 assert.equal(release.secretsIncluded,false);
 assert.match(fs.readFileSync(path.join(dir,'README.md'),'utf8'),/实体 iPhone、Android、Safari/);
});

test('H06 completes one synthetic HR flow with save, readback, invitation and withdrawal',async()=>{
 const store=new Store(),app={applicationId};
 const assigned=await workAction(store,{uid:uid.hr},{...app,action:'assign',taskId:'resource-plan',variant:'A',condition:'independent',minutes:20});
 const assignment={...app,assignmentId:assigned.id};
 const seeker=await workAction(store,{uid:uid.seeker},{...assignment,action:'start'});
 assert.equal(seeker.saved,true);
 const attempt=await store.get('aligna_work_attempts/'+assigned.id);
 await workAction(store,{uid:uid.seeker},{...assignment,action:'submit',attemptVersion:attempt._updateTime,answers:{...emptyFormalAnswers(),decision:'Choose A',calculation:'30+35',reasoning:'Compare constraints',verification:'Recheck source records'},declaredTools:[],consentVersion:'work-sample-share-v1'});
 const hrContext=await workContext(store,{uid:uid.hr},applicationId);
 assert.equal(hrContext.tasks[0].attempt.status,'submitted');
 await workAction(store,{uid:uid.hr},{...assignment,action:'review',attemptVersion:hrContext.tasks[0].attempt._updateTime,rubricVersion:hrContext.tasks[0].task.rubricVersion,confirmed:true,ratings:ratings(hrContext.tasks[0].task)});
 const reviewed=await workContext(store,{uid:uid.hr},applicationId);
 assert.equal(reviewed.tasks[0].review.summary.observed,4);
 await assert.rejects(workContext(store,{uid:uid.otherHr},applicationId),/work-not-authorized/);

 const state={application:{active:true,status:'submitted',jobId:'h06-job',jobRequirementsVersion:1},job:{status:'published',requirementsVersion:1}};
 const c=interviewContext(state);
 await stageApplicationRecord(c,'ignored','interview','2026-10-25T07:00:00.000Z','Synthetic interview','Asia/Kuala_Lumpur');
 assert.equal(state.application.interviewResponse,'pending');
 await respondApplicationRecord(c,'ignored','accepted');
 assert.equal(state.application.interviewResponse,'accepted');
 const unchanged=await stageApplicationRecord(c,'ignored','interview','2026-10-25T07:00:00.000Z','Synthetic interview','Asia/Kuala_Lumpur');
 assert.equal(unchanged,false);
 assert.equal(state.application.interviewResponse,'accepted');
 state.application.active=false;
 await assert.rejects(stageApplicationRecord(c,'ignored','interview','2026-10-26T07:00:00.000Z','New interview','Asia/Kuala_Lumpur'),/withdrawn/);
});

test('H06 evidence covers three languages and the smallest mobile viewport without claiming device certification',()=>{
 const responsive=JSON.parse(fs.readFileSync(path.join(root,'docs','acceptance','responsive-language-proof.json'),'utf8'));
 const locales=new Set(responsive.views.map(view=>view.locale));
 assert.deepEqual([...locales].sort(),['en','ms','zh']);
 assert.equal(responsive.views.every(view=>view.passed===true),true);
 const mobile=JSON.parse(fs.readFileSync(path.join(root,'docs','acceptance','mobile-interaction-proof.json'),'utf8'));
 assert.equal(mobile.viewportWidth,320);
 assert.equal(mobile.partialChallengeNotSaved,true);
 assert.match(responsive.scope,/not physical iOS\/Android testing/);
});
