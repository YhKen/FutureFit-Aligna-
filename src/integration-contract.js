// Content identifiers are reproducibility aids, not signatures or proof of truth.
import {canonical,skillId} from './skill-catalog.js';
import {structuredMatchRows} from './job-requirements.js';
export const CONTRACT_VERSION='aligna-evidence-v1';
export function contentVersion(value,prefix='revision'){
 const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,clean(v[k])])):v;
 const text=JSON.stringify(clean(value));let a=2166136261,b=5381;
 for(const c of text){a=Math.imul(a^c.codePointAt(0),16777619)>>>0;b=(Math.imul(b,33)^c.codePointAt(0))>>>0;}
 return `${prefix}:${a.toString(16).padStart(8,'0')}${b.toString(16).padStart(8,'0')}`;
}
export function skillRecord(record,{sourceId='shared-profile',sourceType='self-report'}={}){
 const name=String(record.name||'').trim(),example=String(record.example||'').slice(0,500),id=skillId(name);
 if(record.sourceType==='life-experience-self-report'){sourceType=record.sourceType;if(sourceId==='shared-profile')sourceId='life-experience';}
 const payload={skillId:id,example,sourceId,sourceType};
 return {schemaVersion:CONTRACT_VERSION,skillId:id,name,recordId:contentVersion(payload,'evidence'),recordVersion:contentVersion(payload,'record'),sourceType,sourceId,example,verification:'not-independently-verified',scope:'Explicit record only; not proficiency or hiring probability'};
}
export function matchContext(job,skills,ruleVersion){
 // Match the legacy last-record-wins policy before versioning the actual inputs.
 const records=[...new Map(skills.map(s=>{const r=skillRecord(s);return [r.skillId,r];})).values()].sort((a,b)=>a.skillId.localeCompare(b.skillId));
 const requirements={role:[...new Set(String(job.skills||'').split(/[,，;；\n、]+/).map(s=>s.trim()).filter(Boolean).map(canonical))].sort(),collaboration:[...new Set(String(job.softSkills||'').split(/[,，;；\n、]+/).map(s=>s.trim()).filter(Boolean).map(canonical))].sort()};
 const fields=['id','jobTitle','jobDescription','jobRequirements','location','employmentType'];
 const structured=structuredMatchRows(job);const jobInput={...Object.fromEntries(fields.map(k=>[k,String(job[k]||'')])),requirements:structured?structured.slice().sort((a,b)=>a.skillId.localeCompare(b.skillId)):requirements,...(job.requirements?{requirementsVersion:job.requirementsVersion||0,workOutputs:job.requirements.workOutputs,qualifications:job.requirements.qualifications,workConditions:job.requirements.workConditions}:{})};
 return {schemaVersion:CONTRACT_VERSION,ruleVersion,jobVersion:contentVersion(jobInput,'job'),evidenceVersion:contentVersion(records.map(({name,...r})=>r),'evidence-set'),inputVersion:contentVersion({job:jobInput,records:records.map(({name,...r})=>r),ruleVersion},'match'),trendVersion:'not-used-in-job-match',scenarioVersion:'not-used-in-job-match',jobSnapshotPolicy:job._matchSnapshot?'frozen-at-application; job edits do not change this comparison':'current-job-content; not a historical frozen posting',records};
}
export function privateSessionEvidence(session,items){
 const sourceId=String(session.id||'unsaved-session'),out=[];
 for(const name of session.profile?.confirmedSkills||[])out.push(skillRecord({name},{sourceId,sourceType:'profile-confirmed-claim'}));
 for(const response of session.responses||[]){const item=items.find(i=>i.id===response.itemId);if(item?.category!=='skill'||!Number.isInteger(response.value)||response.value<1||response.value>5)continue;
  const record=skillRecord({name:item.name},{sourceId:sourceId+'/'+item.id,sourceType:'questionnaire-self-report'});
  out.push({...record,itemId:item.id,rating:response.value,recordVersion:contentVersion({record:record.recordVersion,rating:response.value},'record')});
 }
 return {schemaVersion:CONTRACT_VERSION,sourceId,records:out,evidenceVersion:contentVersion(out,'private-evidence'),sharing:'private; do not attach automatically to applications',excluded:['raw-cv','personality','game-trials']};
}
