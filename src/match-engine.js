import {structuredMatchRows,jobRequirementsIssue} from './job-requirements.js';
import {canonical,skillLabel,skillId,norm} from './skill-catalog.js';
import {matchContext} from './integration-contract.js';
export {canonical,skillLabel,skillId};
export const MATCH_VERSION='explicit-skills-v4-input-check';
export function safeSkills(value){return (Array.isArray(value)?value:[]).filter(s=>s&&typeof s.name==='string'&&s.name.trim()).slice(0,50).map(s=>({name:s.name.trim().slice(0,100),example:typeof s.example==='string'?s.example.slice(0,500):'',...(s.sourceType==='life-experience-self-report'?{sourceType:s.sourceType}:{})}));}
export function splitSkills(text){return [...new Map(String(text||'').split(/[,，;；\n、]+/).map(x=>x.trim()).filter(Boolean).map(x=>[canonical(x),x])).values()].slice(0,50);}
export function parseEvidence(text){return String(text||'').split('\n').map(x=>{const [name,...example]=x.split('|');return {name:name.trim().slice(0,100),example:example.join('|').trim().slice(0,500)};}).filter(x=>x.name).slice(0,50);}
export function cosineSimilarity(a,b){
 if(a.length!==b.length||[...a,...b].some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid aligned skill vectors');
 const dot=a.reduce((n,x,i)=>n+x*b[i],0),na=Math.hypot(...a),nb=Math.hypot(...b);
 return na&&nb?Math.min(1,Math.max(0,dot/(na*nb))):null;
}
export function matchCandidate(job,candidate){
 const required=splitSkills(job.skills),preferred=splitSkills(job.softSkills).filter(x=>!required.some(r=>canonical(r)===canonical(x)));
 const supplied=safeSkills(candidate.skills),context=matchContext(job,supplied,MATCH_VERSION),evidence=new Map(supplied.map(x=>[canonical(x.name),x]));
 const rows=(structuredMatchRows(job)||[...required.map(name=>({name,weight:2,kind:'required'})),...preferred.map(name=>({name,weight:1,kind:'preferred'}))]).map(r=>({...r,evidence:evidence.get(canonical(r.name))||null,skillId:skillId(r.name),evidenceState:evidence.has(canonical(r.name))?'self-reported-record':'unconfirmed',trace:{recordId:context.records.find(x=>x.skillId===skillId(r.name))?.recordId||null,sourceType:evidence.get(canonical(r.name))?.sourceType||(evidence.has(canonical(r.name))?'self-report':null),jdField:r.jdField||(r.kind==='required'?'skills':'softSkills'),jdTerm:r.name,candidateIndex:supplied.findLastIndex(x=>canonical(x.name)===canonical(r.name)),canonical:canonical(r.name)}}));
 const total=rows.reduce((n,r)=>n+r.weight,0),matched=rows.filter(r=>r.evidence),gaps=rows.filter(r=>!r.evidence);
 const jdVector=rows.map(r=>r.weight),candidateVector=rows.map(r=>r.evidence?r.weight:0),cosine=cosineSimilarity(jdVector,candidateVector),denominator=Math.hypot(...jdVector)*Math.hypot(...candidateVector);
 rows.forEach((r,i)=>{r.trace.jdValue=jdVector[i];r.trace.candidateValue=candidateVector[i];r.trace.contribution=denominator?jdVector[i]*candidateVector[i]/denominator:null;});
 return {version:MATCH_VERSION,context,dataIssue:jobRequirementsIssue(job),rows,matched,gaps,totals:{weight:total,matchedWeight:matched.reduce((n,r)=>n+r.weight,0),squareWeight:jdVector.reduce((n,x)=>n+x*x,0),matchedSquareWeight:candidateVector.reduce((n,x)=>n+x*x,0)},coverage:total?Math.round(100*matched.reduce((n,r)=>n+r.weight,0)/total):null,
  cosine,cosinePercent:cosine===null?null:Math.round(cosine*100),vectors:{jd:jdVector,candidate:candidateVector,dimensions:rows.map(r=>canonical(r.name)),scope:'Job description-listed skills only; extra candidate skills are not penalised'},
  examples:matched.filter(r=>r.evidence.example).length,requirements:rows.length,
  evidenceCoverage:matched.length?Math.round(100*matched.filter(r=>r.evidence.example).length/matched.length):null,
  preference:{location:candidate.location?norm(candidate.location)===norm(job.location):null,type:candidate.employmentType?candidate.employmentType===job.employmentType:null}};
}
export function interviewPlan(job,candidate,lang='en'){
 const m=matchCandidate(job,candidate),pick=(zh,en,ms)=>({zh,en,ms}[lang]||en);
 return {common:m.rows.slice(0,6).map(r=>({skill:r.name,question:pick(`请讲一个你使用「${skillLabel(r.name,lang)}」完成工作的例子。你负责什么，怎么做，结果如何？`,`Tell us about a task where you used ${skillLabel(r.name,lang)}. What did you own, what did you do, and what changed?`,`Ceritakan tugasan yang menggunakan ${skillLabel(r.name,lang)}. Apakah peranan, tindakan dan hasil anda?`)})),
 followups:m.gaps.slice(0,3).map(r=>({skill:r.name,question:pick(`资料里还没看到「${skillLabel(r.name,lang)}」的例子。你是否有相关经历，或可以展示的作品？`,`We have no example of ${skillLabel(r.name,lang)} yet. Is there related experience or a work sample you would like to share?`,`Kami belum melihat contoh ${skillLabel(r.name,lang)}. Ada pengalaman berkaitan atau hasil kerja yang ingin dikongsi?`)})),
 exercise:pick('用一份虚构的岗位任务，给所有候选人相同的材料、时间和评分标准。先说明可以使用哪些工具，并提供合理的无障碍安排。','Use a fictional role-relevant task with the same materials, time and rubric for everyone. Explain permitted tools and offer reasonable accessibility adjustments.','Gunakan tugasan rekaan berkaitan jawatan dengan bahan, masa dan rubrik yang sama. Jelaskan alat yang dibenarkan dan sediakan penyesuaian akses.'),
 rubric:pick('1 需要指导 · 2 独立完成 · 3 能解释取舍和验证结果。没有展示机会时记为“未观察”，不要记零分。','1 Needs guidance · 2 Works independently · 3 Explains trade-offs and validates results. Use “not observed” when there was no opportunity to demonstrate.','1 Perlu bimbingan · 2 Boleh berdikari · 3 Menjelaskan pilihan dan menyemak hasil. Guna “belum diperhatikan” jika tiada peluang demonstrasi.')};
}
