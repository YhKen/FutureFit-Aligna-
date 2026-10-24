import bank from '../bank-v2.js';import occupations from '../occupations.js';import {interestKeys,mapping} from '../engine-v2.js';
import {matchCandidate} from '../match-engine.js';import {jobWeightSensitivity,careerWeightSensitivity} from '../algorithm-sensitivity.js';
const jobs=[];for(const group of ['mixed','role-only'])for(let mask=0;mask<8;mask++){
 const job={skills:group==='mixed'?'Excel, SQL':'Excel, SQL, Communication',softSkills:group==='mixed'?'Communication':''},names=['Excel','SQL','Communication'],candidate={skills:names.filter((_,i)=>mask&(1<<i)).map(name=>({name}))};
 jobs.push({group,mask,weights:group==='mixed'?['role','role','collaboration']:['role','role','role'],present:names.map((_,i)=>!!(mask&(1<<i))),expected:jobWeightSensitivity(matchCandidate(job,candidate))});
}
const skillItems=bank.items.filter(i=>i.category==='skill'),profiles=[{id:'differentiated-full',interest:[5,4,3,2,1,2],limit:35},{id:'differentiated-partial',interest:[1,2,5,4,2,3],limit:2},{id:'flat-full',interest:[3,3,3,3,3,3],limit:35}];
const careerProfiles=profiles.map(p=>{const answers=[...interestKeys.map((key,i)=>({itemId:bank.items.find(x=>x.category==='interest'&&x.dimension===key).id,value:p.interest[i]})),...skillItems.slice(0,p.limit).map((i,n)=>({itemId:i.id,value:n%5+1}))],ranked=mapping(bank.items,answers,occupations.jobs);return {id:p.id,interest:p.interest,skills:answers.filter(a=>skillItems.some(i=>i.id===a.itemId)).map(a=>({name:skillItems.find(i=>i.id===a.itemId).name,value:a.value})),expected:careerWeightSensitivity(ranked)};});
const careerJobs=occupations.jobs.map(j=>({id:j.id,title:j.title,interests:interestKeys.map(k=>j.interests[k]),skills:Object.fromEntries(Object.entries(j.skills).map(([k,v])=>[k,v.IM]))}));
console.log(JSON.stringify({jobs,careerProfiles,careerJobs}));
