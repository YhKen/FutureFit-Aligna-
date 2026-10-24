import {mapping} from './engine-v2.js';
import {priorities,sectorFor} from './career-growth.js';
import {publishedLearningEvidence,TREND_POLICY_VERSION} from './trend-evidence.js';
import {contentVersion} from './integration-contract.js';
export function rankFutures(items,answers,jobs,{scenario='steady',signals=[],country='MY',newsVersion='none',now=Date.now()}={}){
 if(!['steady','accelerated'].includes(scenario))throw Error('invalid-future-scenario');
 const supported=publishedLearningEvidence(signals,{country,now}),baseline=mapping(items,answers,Array.isArray(jobs)?jobs:jobs.jobs),pool=new Set(baseline.filter(r=>Object.values(r.job.skills||{}).some(s=>s.IM>=2.5)).slice(0,20).map(r=>r.job.id));
 const support=name=>{const item=items.find(i=>i.category==='skill'&&i.name===name),answer=answers.find(a=>a.itemId===item?.id);return answer?Math.max(0,(answer.value-3)/2):0;};
 return baseline.map(r=>{
 const base=Math.max(0,Math.min(100,(r.score+1)*50));
 const adaptability=((r.job.skills['Active Learning']?.IM||0)*support('Active Learning')+(r.job.skills['Critical Thinking']?.IM||0)*support('Critical Thinking'))/10;
 const scenarioAdjustment=scenario==='accelerated'&&!r.flat&&pool.has(r.job.id)?adaptability*6:0;
 const gaps=priorities(items,answers,r.job).map(g=>{const evidence=supported.filter(e=>e.skill===g.i.name),trendFactor=1+Math.min(.3,evidence.length*.1);return {...g,trendEvidence:evidence,trendFactor,baselinePriority:g.priority,priority:g.priority*trendFactor};}).sort((a,b)=>b.priority-a.priority);
 // Published learning evidence can reprioritise practice, not establish occupation demand.
 const newsAdjustment=0,evidenceCount=new Set(gaps.flatMap(g=>g.trendEvidence.map(e=>e.articleId))).size;
 return {...r,base,scenarioAdjustment,newsAdjustment,evidenceCount,total:base+scenarioAdjustment,gaps,context:{scenarioVersion:'future-assumptions-v3:'+scenario,trendPolicy:TREND_POLICY_VERSION,trendVersion:newsVersion,evidenceVersion:contentVersion(supported,'trend-evidence'),country,newsAffects:'learning-priority-only',scenarioAssumption:scenario==='accelerated'?'User-selected hypothesis within the baseline top 20: role importance × positive self-report above 3, up to 6 points. Flat interests or absent relevant self-reports add zero. Not a forecast.':'Baseline interests and self-reported skills; not a forecast.'}};
 }).sort((a,b)=>b.total-a.total||a.job.id.localeCompare(b.job.id));
}
export function learningSchedule(gaps,hours=4){let elapsed=0;return gaps.slice(0,3).map(g=>{const effort=g.a&&g.a.value>=3?4:8,start=elapsed;elapsed+=effort;return {...g,hours:effort,startWeek:Math.floor(start/hours)+1,endWeek:Math.ceil(elapsed/hours)};});}
export function sdgFor(job){const name=job.title.toLowerCase(),sector=sectorFor(job);if(/climate|environment|conservation|ecolog/.test(name))return 13;if(/teacher|education|historian|librarian|instruction/.test(name))return 4;if(/medical|health|clinical|bioinformatic/.test(name))return 3;if(/probation|correctional|lawyer|legal/.test(name))return 16;if(/social|community|residential advisor/.test(name))return 10;return ({health:3,education:4,technology:9,manufacturing:9,construction:11,logistics:9,agriculture:2,legal:16})[sector]||8;}
