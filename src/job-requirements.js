import {canonical,skillId} from './skill-catalog.js';

export const JOB_FIELDS=['jobTitle','salary','jobDescription','jobField','location','skills','softSkills','jobRequirements','futureSkills','employmentType','employeeCount','workingTime'];
export const EVIDENCE_TYPES=['work_sample','certificate','portfolio','interview','assessment','employment_history'];
const text=(v,n,empty=false)=>typeof v==='string'&&v.trim().length<=(n)&&!!(empty||v.trim());
const strings=(v,max)=>Array.isArray(v)&&v.length<=max&&v.every(x=>text(x,120));
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
function fail(code){throw Error(code);}

// A role skill and an entry prerequisite are independent classifications.
export function validateRequirements(value){
 if(value==null)return null;
 if(!obj(value)||!Array.isArray(value.skills)||value.skills.length>30||!Array.isArray(value.workOutputs)||value.workOutputs.length>20||!Array.isArray(value.qualifications)||value.qualifications.length>10)fail('requirements');
 const skills=value.skills.map(s=>{
  if(!obj(s)||!obj(s.label)||!['en','zh','ms'].every(l=>text(s.label[l],120))||!text(s.skillId,400)||s.skillId!==skillId(s.label.en)||!['professional','collaboration'].includes(s.type)||!['entry_required','trainable'].includes(s.requirement)||!text(s.observableBehavior,1000)||!strings(s.allowedEvidence,6)||!s.allowedEvidence.length||s.allowedEvidence.some(x=>!EVIDENCE_TYPES.includes(x)))fail('skill');
  return {skillId:s.skillId,label:Object.fromEntries(['en','zh','ms'].map(l=>[l,s.label[l].trim()])),type:s.type,requirement:s.requirement,observableBehavior:s.observableBehavior.trim(),allowedEvidence:[...new Set(s.allowedEvidence)]};
 });
 const skillIds=skills.map(s=>s.skillId);if(new Set(skillIds).size!==skillIds.length)fail('skill');
 const skillTypes=Object.fromEntries(skills.map(s=>[s.skillId,s.type])),entryLevels=Object.fromEntries(skills.map(s=>[s.skillId,s.requirement]));
 for(const [key,expected] of Object.entries({skillTypes,entryLevels}))if(value[key]&&(!obj(value[key])||Object.keys(value[key]).length!==skills.length||Object.entries(expected).some(([id,v])=>value[key][id]!==v)))fail('skill');
 const ids=new Set(),workOutputs=value.workOutputs.map(o=>{
  if(!obj(o)||!text(o.id,100)||ids.has(o.id)||!text(o.description,1000)||!strings(o.skillIds,20)||!o.skillIds.length||o.skillIds.some(id=>!skillIds.includes(id)))fail('workOutput');ids.add(o.id);
  return {id:o.id,description:o.description.trim(),skillIds:[...new Set(o.skillIds)]};
 });
 const qualifications=value.qualifications.map(q=>{
  if(!obj(q)||!text(q.name,300)||!text(q.issuer,300)||!text(q.region,120)||!text(q.sourceUrl,1000,true)||!['verified','pending'].includes(q.verificationStatus))fail('qualification');
  if(q.sourceUrl&&!/^https:\/\//i.test(q.sourceUrl)||q.verificationStatus==='verified'&&!q.sourceUrl)fail('qualification');
  return {name:q.name.trim(),issuer:q.issuer.trim(),region:q.region.trim(),sourceUrl:q.sourceUrl.trim(),verificationStatus:q.verificationStatus};
 });
 const c=value.workConditions,l=c?.location,s=c?.salary,a=c?.workArrangement;
 if(!obj(c)||!obj(l)||!text(l.value,500,l.status==='unknown')||!['specified','unknown'].includes(l.status)||!obj(s)||typeof s.min!=='number'||typeof s.max!=='number'||!Number.isFinite(s.min)||!Number.isFinite(s.max)||s.min<0||s.max<s.min||s.max>10000000||!text(s.currency,10)||s.period!=='monthly'||!obj(a)||!['onsite','hybrid','remote','unknown'].includes(a.mode)||!text(a.schedule,500,true))fail('workConditions');
 return {workOutputs,skills,skillIds,skillTypes,entryLevels,qualifications,workConditions:{location:{value:l.value.trim(),status:l.status},salary:{min:s.min,max:s.max,currency:s.currency,period:'monthly'},workArrangement:{mode:a.mode,schedule:a.schedule.trim()}}};
}

export function structuredMatchRows(job){
 if(job.requirements==null)return null;
 try{const checked=validateRequirements(job.requirements);if(!checked.skills.length)return null;return checked.skills.map(s=>({name:s.label.en,skillId:s.skillId,label:s.label,weight:s.type==='professional'?2:1,kind:s.type==='professional'?'required':'preferred',skillType:s.type,requirementLevel:s.requirement,observableBehavior:s.observableBehavior,allowedEvidence:s.allowedEvidence,jdField:'requirements.skills'}));}
 catch{return [];}// Invalid imported requirements are not silently converted to fulfilled skills.
}
export function jobRequirementsIssue(job){if(job.requirements==null)return null;try{validateRequirements(job.requirements);return null;}catch{return 'invalid-structured-requirements';}}
export function snapshotJob(job){
 return {...Object.fromEntries(JOB_FIELDS.map(k=>[k,job[k]])),jobSchemaVersion:job.jobSchemaVersion||1,requirementsVersion:job.requirementsVersion||0,requirements:job.requirements||null};
}
export function matchingBasisFromJob(job){
 if(jobRequirementsIssue(job))throw Error('invalid-structured-requirements');
 const rows=structuredMatchRows(job),structured=!!rows?.length;
 return {jobRequirementsVersion:Number(job.requirementsVersion||0),matchingBasis:{schema:structured?'structured-v1':'legacy-v1',skillIds:structured?rows.map(s=>s.skillId):[],legacySkills:structured?'':String(job.skills||'').slice(0,500)}};
}
export function applicationJob(application,current){
 return application.jobSnapshot?{id:application.jobId,...application.jobSnapshot,_matchSnapshot:true}:current;
}
