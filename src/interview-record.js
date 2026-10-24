import {contentVersion} from './integration-contract.js';

export const INTERVIEW_RECORD_VERSION='interview-record-v1';
export const INTERVIEW_STATUSES=['unobserved','partial','sufficient','not_applicable'];
export const FOLLOWUP_STATUSES=['pending','answered','not_applicable'];
export const INTERVIEW_TIME_ZONES=['Asia/Kuala_Lumpur','Asia/Singapore','Asia/Tokyo','UTC'];

const text=(value,max)=>typeof value==='string'&&value.trim().length<=max;
const nonEmpty=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const same=(a,b)=>contentVersion(a)===contentVersion(b);

export function interviewRequirements(job){
  const rows=job?.requirements?.skills;
  if(!Array.isArray(rows))return [];
  return rows.map(row=>({
    skillId:row.skillId,
    label:row.label,
    requirement:row.requirement,
    type:row.type,
    observableBehavior:row.observableBehavior
  }));
}

export function interviewRubricVersion(job){
  return contentVersion({
    version:INTERVIEW_RECORD_VERSION,
    requirements:interviewRequirements(job).map(({skillId,label,requirement,type,observableBehavior})=>({skillId,label,requirement,type,observableBehavior}))
  },'interview-rubric');
}

function cleanItems(items,requirements){
  if(!Array.isArray(items)||items.length!==requirements.length)return null;
  const byId=new Map(requirements.map(row=>[row.skillId,row]));
  const seen=new Set();
  const out=[];
  for(const item of items){
    if(!item||typeof item.skillId!=='string'||seen.has(item.skillId)||!byId.has(item.skillId)||!INTERVIEW_STATUSES.includes(item.status))return null;
    if(!text(item.quote,1800)||!text(item.observation,1800)||typeof item.share!=='boolean')return null;
    if(['partial','sufficient'].includes(item.status)&&!nonEmpty(item.quote,1800))return null;
    seen.add(item.skillId);
    out.push({skillId:item.skillId,status:item.status,quote:item.quote.trim(),observation:item.observation.trim(),share:item.share});
  }
  return requirements.map(row=>out.find(item=>item.skillId===row.skillId));
}

function cleanFollowups(followups,requirements){
  if(!Array.isArray(followups)||followups.length>10)return null;
  const allowed=new Set(requirements.map(row=>row.skillId));
  return followups.map(item=>{
    if(!item||typeof item.skillId!=='string'||!allowed.has(item.skillId)||!nonEmpty(item.question,600)||!FOLLOWUP_STATUSES.includes(item.status)||!text(item.response,1800)||typeof item.share!=='boolean'||item.status==='answered'&&!nonEmpty(item.response,1800))return null;
    return item;
  }).every(Boolean)&&new Set(followups.map(i=>i.skillId)).size===followups.length?followups.map(item=>({skillId:item.skillId,question:item.question.trim(),status:item.status,response:item.response.trim(),share:item.share})):null;
}

export function cleanInterviewRecord(raw,job){
  const requirements=interviewRequirements(job),items=cleanItems(raw?.items,requirements),followups=cleanFollowups(raw?.followups,requirements);
  if(!requirements.length||!items||!followups)return null;
  if(typeof raw?.interviewAt!=='string'||!Number.isFinite(Date.parse(raw.interviewAt)))return null;
  if(!INTERVIEW_TIME_ZONES.includes(raw.interviewTimeZone)||!nonEmpty(raw.toolCondition,500))return null;
  const rubricVersion=interviewRubricVersion(job);
  if(raw.rubricVersion&&raw.rubricVersion!==rubricVersion)return null;
  return {version:INTERVIEW_RECORD_VERSION,rubricVersion,interviewAt:raw.interviewAt,interviewTimeZone:raw.interviewTimeZone,toolCondition:raw.toolCondition.trim(),items,followups};
}

export function shareableInterviewFeedback(record,job){
  const requirements=new Map(interviewRequirements(job).map(row=>[row.skillId,row]));
  return {
    version:INTERVIEW_RECORD_VERSION,
    rubricVersion:record.rubricVersion,
    interviewAt:record.interviewAt,
    interviewTimeZone:record.interviewTimeZone,
    items:record.items.map((item,sourceIndex)=>({...item,sourceIndex})).filter(item=>item.share&&item.status!=='unobserved').map(item=>({
      sourceIndex:item.sourceIndex,
      skillId:item.skillId,
      label:requirements.get(item.skillId)?.label||null,
      status:item.status,
      feedback:item.observation||item.quote
    })),
    followups:record.followups.map((item,sourceIndex)=>({...item,sourceIndex})).filter(item=>item.share===true&&item.status==='answered').map(item=>({sourceIndex:item.sourceIndex,skillId:item.skillId,question:item.question,response:item.response}))
  };
}

export function compareInterviewRecords(first,second){
  if(!first?.rubricVersion||first.rubricVersion!==second?.rubricVersion)return {dimensions:[],comparable:0,agreements:0,scope:'Different rubric versions; no comparison. Not honesty, ability or hiring probability'};
  const secondById=new Map((second?.items||[]).map(item=>[item.skillId,item]));
  const dimensions=(first?.items||[]).map(item=>({skillId:item.skillId,first:item.status,second:secondById.get(item.skillId)?.status||null,agree:item.status===secondById.get(item.skillId)?.status}));
  const observed=new Set(['partial','sufficient']),comparable=dimensions.filter(item=>observed.has(item.first)&&observed.has(item.second));
  return {dimensions,comparable:comparable.length,agreements:comparable.filter(item=>item.agree).length,scope:'Descriptive comparison of two interview records only; not honesty, ability or hiring probability'};
}

export function sameInterviewRecord(a,b){
  const fields=['version','rubricVersion','interviewAt','interviewTimeZone','toolCondition'];
  return same(a?.items,b?.items)&&same(a?.followups,b?.followups)&&fields.every(k=>a?.[k]===b?.[k]);
}
export function packInterviewRecord(record){
 const {items,followups,...meta}=record,columns=(rows,fields)=>Object.fromEntries(fields.map(key=>[key,Object.fromEntries(rows.map(r=>[r.skillId,r[key]]))]));
 return {...meta,skillIds:items.map(r=>r.skillId),skillData:columns(items,['status','quote','observation','share']),followupIds:followups.map(r=>r.skillId),followupData:columns(followups,['question','status','response','share'])};
}
export function unpackInterviewRecord(value){
 const {skillIds,skillData,followupIds,followupData,...meta}=value;
 const rows=(ids,data,keys)=>ids.map(skillId=>({skillId,...Object.fromEntries(keys.map(k=>[k,data[k][skillId]]))}));
 return {...meta,items:rows(skillIds,skillData,['status','quote','observation','share']),followups:rows(followupIds,followupData,['question','status','response','share'])};
}
export function packSharedInterview(record){return packInterviewRecord({...record,items:record.items.filter(v=>v.share&&v.status!=='unobserved'),followups:record.followups.filter(v=>v.share&&v.status==='answered')});}
