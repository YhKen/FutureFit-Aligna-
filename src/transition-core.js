import {sectorFor,tailoredPractice,tailoredResources} from './career-growth.js';
export const countries={
 MY:{label:['马来西亚','Malaysia','Malaysia'],framework:'MQF / MQA',links:[['MQA','https://www.mqa.gov.my/'],['MYFutureJobs Galaxy','https://myfuturejobs.gov.my/myfuturejobsgalaxy/']]},
 SG:{label:['新加坡','Singapore','Singapura'],framework:'Skills Framework / WSQ',links:[['Skills Framework','https://www.skillsfuture.gov.sg/skills-framework/skills-frameworks-faq/'],['SkillsFuture','https://www.skillsfuture.gov.sg/initiatives/individuals']]},
 UK:{label:['英国','United Kingdom','United Kingdom'],framework:'England / Northern Ireland: regulated qualifications',links:[['Ofqual / CCEA','https://www.gov.uk/find-a-regulated-qualification']]},
 AU:{label:['澳大利亚','Australia','Australia'],framework:'Australian VET national register',links:[['training.gov.au','https://training.gov.au/']]},
 US:{label:['美国','United States','Amerika Syarikat'],framework:'O*NET / CareerOneStop; state licensing',links:[['CareerOneStop Certification Finder','https://www.careeronestop.org/Toolkit/Training/find-certifications.aspx']]}
};
export const sdgNames={3:['健康与福祉','Good health and well-being','Kesihatan dan kesejahteraan'],4:['优质教育','Quality education','Pendidikan berkualiti'],8:['体面工作和经济增长','Decent work and economic growth','Pekerjaan layak dan pertumbuhan ekonomi'],9:['产业、创新和基础设施','Industry, innovation and infrastructure','Industri, inovasi dan infrastruktur'],12:['负责任消费和生产','Responsible consumption and production','Penggunaan dan pengeluaran bertanggungjawab'],13:['气候行动','Climate action','Tindakan iklim']};
export function sdgForSkill(item){return item.dimension==='technical'||item.dimension==='systems'?9:item.dimension==='resourceManagement'?12:item.name==='Instructing'||item.name==='Learning Strategies'||item.name==='Active Learning'?4:8;}
export function sdgForJob(job){return ({health:3,education:4,manufacturing:9,construction:9,logistics:9,science:9,agriculture:12})[sectorFor(job)]||8;}
export function transitionEvidence(items,session,job){
 const byName=new Map(items.filter(i=>i.category==='skill').map(i=>[i.name,i])),answers=new Map((session?.responses||[]).map(a=>[a.itemId,a])),cv=new Set(session?.profile?.confirmedSkills||[]);
 return Object.entries(job?.skills||{}).filter(([,v])=>Number.isFinite(v.IM)&&v.IM>=2.5).map(([name,ref])=>{const item=byName.get(name),answer=answers.get(item?.id),rating=answer?.value,hasCV=cv.has(name);return {name,item,answer,rating,hasCV,importance:ref.IM,referenceLevel:ref.LV,recorded:!!answer||hasCV,state:rating>=4?'transfer':rating<=3?'practise':'verify',priority:ref.IM*(rating===undefined?.65:(5-rating)/4),sdg:sdgForSkill(item||{})};}).sort((a,b)=>b.importance-a.importance||a.name.localeCompare(b.name));
}
export function transitionPlan(items,session,job,{months=3,hours=5,country='MY'}={}){
 if(![3,5,6,12].includes(Number(months))||(!Number.isInteger(Number(hours))||Number(hours)<1||Number(hours)>40)||!countries[country])throw Error('Invalid transition settings');
 const rows=transitionEvidence(items,session,job),priorities=rows.filter(r=>r.state!=='transfer').sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name)),weeks=Math.round(Number(months)*52/12),first=Math.max(2,Math.round(weeks*.25)),second=Math.max(first+1,Math.round(weeks*.7));
 return {job,rows,priorities,months:Number(months),hours:Number(hours),country,weeks,budget:weeks*Number(hours),recorded:rows.filter(r=>r.recorded).length,coverage:rows.length?Math.round(rows.filter(r=>r.recorded).length/rows.length*100):null,phases:[[1,first],[first+1,second],[second+1,weeks]],focus:priorities.slice(0,Number(hours)<=5?2:3),sdg:sdgForJob(job),id:`skill-transition--${job.id.replaceAll('.','_')}--${country}--${months}--${hours}`,resources:[...new Map(priorities.slice(0,3).flatMap(r=>r.item?tailoredResources(r.item,r.answer,job):[]).map(r=>[r.url,r])).values()]};
}
export function practiceFor(row,job,lang){return row.item?tailoredPractice(row.item,row.answer,job,lang):'';}
export function scenarioOrder(rows,skillName){return [...rows].map(r=>({...r,scenarioPriority:r.priority*(r.name===skillName?1.5:1)})).sort((a,b)=>b.scenarioPriority-a.scenarioPriority||a.name.localeCompare(b.name));}
