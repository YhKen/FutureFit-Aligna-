import {coverageCandidates} from './evidence-standard.js';
export const interestKeys=['realistic','investigative','artistic','social','enterprising','conventional'];
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
export function summarize(items,answers){
 const out={};for(const a of answers){const i=items.find(i=>i.id===a.itemId);if(!i)throw Error('Unknown question');if(i.format==='choice')continue;const k=i.category+':'+i.dimension,d=out[k]??={category:i.category,dimension:i.dimension,values:[],ids:[]};d.values.push(i.key<0?6-a.value:a.value);d.ids.push(i.id);}
 for(const d of Object.values(out)){d.n=d.values.length;d.mean=mean(d.values);d.spread=Math.max(...d.values)-Math.min(...d.values);}return out;
}
export function validate(items,answers,total=30){
 if(!Array.isArray(answers)||answers.length>total||total<30||total>60)throw Error('Invalid session');
 const seen=new Set();for(const a of answers){const i=items.find(i=>i.id===a.itemId);if(!i||seen.has(i.id)||!Number.isInteger(a.value)||a.value<1||a.value>(i.format==='choice'?i.options.length:5))throw Error('Invalid answer');seen.add(i.id);}
}
export function mapping(items,answers,jobs){
 const stats=summarize(items,answers),known=interestKeys.filter(k=>stats['interest:'+k]);
 if(known.length<6)return [];
 const profile=interestKeys.map(k=>stats['interest:'+k].mean),center=mean(profile),norm=Math.sqrt(profile.reduce((s,v)=>s+(v-center)**2,0)),skillAnswers=answers.map(a=>({a,i:items.find(i=>i.id===a.itemId)})).filter(x=>x.i.category==='skill');
 return jobs.map(job=>{
  const vector=interestKeys.map(k=>job.interests[k]),m=mean(vector),n=Math.sqrt(vector.reduce((s,v)=>s+(v-m)**2,0));
  const interest=norm>.01&&n>.01?profile.reduce((s,v,k)=>s+(v-center)*(vector[k]-m),0)/(norm*n):0;
  const evidence=skillAnswers.filter(x=>job.skills[x.i.name]?.IM);
  const weight=evidence.reduce((s,x)=>s+job.skills[x.i.name].IM,0);
  const skill=weight?evidence.reduce((s,x)=>s+((x.a.value-3)/2)*job.skills[x.i.name].IM,0)/weight:0;
  return {job,interest,skill,skillCount:evidence.length,score:evidence.length>=3?interest*.8+skill*.2:interest,flat:norm<.35};
 }).sort((a,b)=>norm<.35?a.job.title.localeCompare(b.job.title):b.score-a.score||a.job.id.localeCompare(b.job.id));
}
export function next(items,answers,seed,jobs,total=30,profile={}){
 validate(items,answers,total);if(answers.length===total)return null;
 const stats=summarize(items,answers),seen=new Set(answers.map(a=>a.itemId)),counts={};
 for(const a of answers){const i=items.find(i=>i.id===a.itemId);counts[i.category]=(counts[i.category]||0)+1;}
 const core={interest:6,personality:3,skill:3,value:3,readiness:3};
 const coreCategory=Object.keys(core).filter(c=>(counts[c]||0)<core[c]).sort((a,b)=>(counts[a]||0)/core[a]-(counts[b]||0)/core[b])[0];
 const top=mapping(items,answers,jobs).slice(0,15);
 let rng=(seed+answers.length*997)>>>0;
 const followups=answers.length>=30?new Set(coverageCandidates(items,answers).map(i=>i.id)):null;
 const picks=items.filter(i=>!seen.has(i.id)&&(followups?.size?followups.has(i.id):!coreCategory||i.category===coreCategory)).map(item=>{
  const d=stats[item.category+':'+item.dimension],n=d?.n||0;
  let priority=8/(n+1)+(d?.spread||0)*1.7+(d?1-Math.abs(d.mean-3)/2:1),reason=!n?'coverage':'clarify';
  if(item.category==='skill'&&top.length){const values=top.map(r=>r.job.skills[item.name]?.IM).filter(Number.isFinite),avg=values.length?mean(values):0,spread=values.length?Math.max(...values)-Math.min(...values):0;priority+=avg+spread*2;reason='career-gap';}
  if(item.category==='skill'&&profile.confirmedSkills?.includes(item.name)){priority+=5;reason='profile';}
  if(item.category==='scenario'){const related=stats['readiness:'+item.dimension];priority=related?(related.mean<3||related.spread>=2?18:9):1;reason='context';if((counts.scenario||0)>=3)priority=-100;}
  // Prevent a category with more source items from dominating follow-ups.
  if(!coreCategory)priority-=Math.max(0,(counts[item.category]||0)-(item.category==='interest'?8:5))*4;
  if(coreCategory&&n)priority-=20;
  rng=(Math.imul(rng,1664525)+1013904223)>>>0;
  return {item,priority,reason,tie:rng};
 }).sort((a,b)=>b.priority-a.priority||a.tie-b.tie);
 return picks[0];
}
export function reviewDate(date){const d=new Date(date+'T00:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+6);d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));return d.toISOString().slice(0,10);}
