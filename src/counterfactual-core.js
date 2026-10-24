import {matchCandidate,safeSkills} from './match-engine.js';
import {canonical} from './skill-catalog.js';
export const COUNTERFACTUAL_VERSION='single-record-preview-v1';
export function occupationRequirements(job){return {id:job.id,jobTitle:job.title,jobDescription:job.description||'',skills:Object.entries(job.skills||{}).filter(([,v])=>Number.isFinite(v.IM)&&v.IM>=2.5).map(([name])=>name).join(', '),softSkills:''};}
export function singleStepPreview(job,candidate){
 const skills=safeSkills(candidate?.skills),baseline=matchCandidate(job,{...candidate,skills});
 if(baseline.coverage===null)return {version:COUNTERFACTUAL_VERSION,baseline,best:null,reason:'no-explicit-requirements',actualRecordsChanged:false};
 const options=baseline.gaps.map(g=>{const hypothetical={...candidate,skills:[...skills,{name:g.name,example:''}]};const after=matchCandidate(job,hypothetical);return {name:g.name,skillId:g.skillId,weight:g.weight,after,gain:after.coverage-baseline.coverage};}).sort((a,b)=>b.gain-a.gain||(b.after.cosine??0)-(a.after.cosine??0)||canonical(a.name).localeCompare(canonical(b.name)));
 // The shared 50-record limit still applies; a full profile cannot be silently
 // truncated to make a hypothetical skill appear to fit.
 const best=skills.length>=50?null:options[0]||null;
 return {version:COUNTERFACTUAL_VERSION,baseline,best,reason:skills.length>=50?'profile-capacity':best?'one-self-reported-record-added':'all-explicit-skills-recorded',actualRecordsChanged:false,assumption:'skill-presence-only; not proficiency, a course outcome or hiring probability'};
}
