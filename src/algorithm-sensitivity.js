// Diagnostic scenarios only. These policies never replace the production score.
export const SENSITIVITY_VERSION='weight-sensitivity-v1';
export const JOB_WEIGHT_POLICIES=Object.freeze([
 Object.freeze({id:'equal',role:1,collaboration:1}),
 Object.freeze({id:'current',role:2,collaboration:1}),
 Object.freeze({id:'role-emphasis',role:3,collaboration:1})
]);
export const CAREER_WEIGHT_POLICIES=Object.freeze([
 Object.freeze({id:'interest-only',interest:1,skill:0}),
 Object.freeze({id:'interest-90',interest:.9,skill:.1}),
 Object.freeze({id:'current',interest:.8,skill:.2}),
 Object.freeze({id:'skill-30',interest:.7,skill:.3})
]);
export function jobWeightSensitivity(match){
 if(match.dataIssue||!match.rows.length)return {version:SENSITIVITY_VERSION,available:false,reason:match.dataIssue||'no-skill-requirements',scenarios:[],coverageRange:null,cosineRange:null};
 const scenarios=JOB_WEIGHT_POLICIES.map(policy=>{
  let total=0,matched=0,squares=0,matchedSquares=0;
  for(const row of match.rows){const weight=(row.skillType?row.skillType==='professional':row.kind==='required')?policy.role:policy.collaboration;total+=weight;squares+=weight*weight;if(row.evidence){matched+=weight;matchedSquares+=weight*weight;}}
  const coverage=100*matched/total,cosine=matchedSquares?Math.sqrt(matchedSquares/squares):null;
  return {...policy,coverage,coveragePercent:Math.round(coverage),cosine,cosinePercent:cosine===null?null:Math.round(cosine*100)};
 });
 const bounds=values=>values.length?{min:Math.min(...values),max:Math.max(...values),spread:Math.max(...values)-Math.min(...values)}:null;
 return {version:SENSITIVITY_VERSION,available:true,baseline:'current',inputVersion:match.context?.inputVersion,scenarios,coverageRange:bounds(scenarios.map(s=>s.coverage)),cosineRange:bounds(scenarios.filter(s=>s.cosine!==null).map(s=>s.cosine*100)),scope:'Three deterministic weight scenarios, not confidence intervals, calibration or independent ability evidence. Production weights and ranking are unchanged.'};
}
export function careerWeightSensitivity(rows,topK=5){
 if(!Number.isInteger(topK)||topK<1||topK>20||new Set(rows.map(r=>r.job?.id)).size!==rows.length||rows.some(r=>!r.job?.id||typeof r.job.title!=='string'||!Number.isFinite(r.interest)||!Number.isFinite(r.skill)||!Number.isInteger(r.skillCount)||r.skillCount<0))throw Error('invalid-career-sensitivity-input');
 if(!rows.length)return {version:SENSITIVITY_VERSION,available:false,reason:'no-career-inputs',scenarios:[]};
 const flat=rows.every(r=>r.flat),order=policy=>rows.map(r=>({id:r.job.id,title:r.job.title,score:r.skillCount>=3?r.interest*policy.interest+r.skill*policy.skill:r.interest})).sort((a,b)=>flat?a.title.localeCompare(b.title)||a.id.localeCompare(b.id):b.score-a.score||a.id.localeCompare(b.id));
 const baseline=order(CAREER_WEIGHT_POLICIES.find(p=>p.id==='current')),baseTop=baseline.slice(0,topK),baseSet=new Set(baseTop.map(r=>r.id)),baseRank=new Map(baseline.map((r,i)=>[r.id,i+1]));
 return {version:SENSITIVITY_VERSION,available:true,flatInterests:flat,baseline:'current',topK:Math.min(topK,rows.length),scenarios:CAREER_WEIGHT_POLICIES.map(policy=>{
  const ranked=order(policy),top=ranked.slice(0,topK),overlap=top.filter(r=>baseSet.has(r.id)).length,union=new Set([...baseSet,...top.map(r=>r.id)]).size;
  return {...policy,overlap,jaccard:union?overlap/union:null,top:top.map((r,i)=>({...r,rank:i+1,baselineRank:baseRank.get(r.id)})),ranked};
 }),scope:'Predeclared sensitivity scenarios; fewer than three relevant skill answers retain interest-only scoring. Flat interests retain alphabetical presentation. Rank ties use deterministic identifiers. No policy is selected as optimal.'};
}
