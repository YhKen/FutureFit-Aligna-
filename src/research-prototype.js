// Isolated synthetic rehearsal. Never imported by live assessment or matching.
import {reliabilitySummary,contentValiditySummary} from './validation-statistics.js';
export const PROTOTYPE_VERSION='synthetic-research-v1';
const sigmoid=x=>1/(1+Math.exp(-x));
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};}
export const CRITERIA=['logic','evidence','priorities','communication'];
export const FEATURES=['skillCoverage','sampleAccuracy','recordCompleteness'];
export function fixture(seed=20261023){
 const next=random(seed),people=[],records=[],binary=[];
 for(let i=0;i<120;i++){
  const personId='SIM-'+String(i+1).padStart(3,'0'),consent=i%17!==0,withdrawn=i%23===0;
  people.push({personId,synthetic:true,consent,trainingConsent:consent,ratingConsent:consent,withdrawn,language:['zh','en','ms'][i%3],form:i%2?'B':'A',device:i%4<2?'mobile':'desktop'});
  for(let j=0;j<2;j++){
   const x=[next(),next(),next()],p=sigmoid(-2+2*x[0]+1.8*x[1]+.6*x[2]),y=Number(next()<p);
   records.push({recordId:personId+'-'+j,personId,x,y,synthetic:true,version:'original-toy-v1',outcome:'synthetic-task-completion'});
  }
  const theta=(next()-.5)*4;
  binary.push({personId,answers:Array.from({length:8},(_,j)=>Number(next()<sigmoid(theta-(j-3.5)*.45)))});
 }
 const cases=people.slice(0,36).map((p,i)=>{const a=CRITERIA.map(()=>1+Math.floor(next()*3));return {caseId:p.personId,personId:p.personId,a,b:a.map(v=>next()<.25?1+Math.floor(next()*3):v)};});
 cases[4].b[2]=null;
 const experts=Array.from({length:6},(_,i)=>({expertId:'SIM-EXPERT-'+(i+1),synthetic:true,conflictDeclared:true,criteria:CRITERIA.map(criterionId=>({criterionId,relevance:2+Math.floor(next()*3)}))}));
 delete experts[5].criteria[3].relevance;
 return {version:PROTOTYPE_VERSION,seed,people,records,binary,cases,experts,licenses:['DISC','CAAS','CDSE','TEIQue-SF'].map(name=>({name,state:'not-obtained',itemsIncluded:false})),events:[]};
}
export function eligiblePeople(data,purpose='research'){const field={research:'consent',training:'trainingConsent',ratings:'ratingConsent'}[purpose];if(!field)throw Error('invalid-consent-purpose');return new Set(data.people.filter(p=>p.synthetic===true&&p[field]===true&&p.withdrawn===false).map(p=>p.personId));}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function partition(data){
 const allowed=eligiblePeople(data,'training'),groups={train:[],validation:[],test:[]},seen=new Set();
 for(const r of data.records){
  if(seen.has(r.recordId))throw Error('duplicate-record');seen.add(r.recordId);
  if(!allowed.has(r.personId))continue;
  if(r.synthetic!==true||r.version!=='original-toy-v1'||r.outcome!=='synthetic-task-completion'||r.x.length!==3||r.x.some(x=>!Number.isFinite(x)||x<0||x>1)||![0,1].includes(r.y))throw Error('invalid-synthetic-record');
  const bucket=hash(r.personId)%10;groups[bucket<6?'train':bucket<8?'validation':'test'].push(r);
 }
 return groups;
}
export function fitLogistic(rows,{iterations=1500,rate=.4,penalty=.02}={}){
 if(rows.length<2||new Set(rows.map(r=>r.y)).size!==2)throw Error('training-needs-both-classes');
 let w=[0,0,0,0];
 for(let t=0;t<iterations;t++){
  const grad=[0,0,0,0];
  for(const r of rows){const x=[1,...r.x],e=sigmoid(w.reduce((s,v,j)=>s+v*x[j],0))-r.y;x.forEach((v,j)=>grad[j]+=e*v/rows.length);}
  w=w.map((v,j)=>v-rate*(grad[j]+(j?penalty*v:0)));
 }
 return {w,iterations,rate,penalty,method:'L2 logistic regression; full-batch gradient descent; intercept not penalised'};
}
export const predict=(model,x)=>sigmoid(model.w.reduce((s,v,j)=>s+v*(j?x[j-1]:1),0));
export function metrics(rows,predictions){
 if(rows.length!==predictions.length||predictions.some(p=>!Number.isFinite(p)||p<0||p>1))throw Error('invalid-predictions');
 if(!rows.length)return {n:0,brier:null,logLoss:null,auc:null,bins:[]};
 const p=predictions.map(x=>Math.max(1e-12,Math.min(1-1e-12,x))),positive=rows.filter(r=>r.y===1).length,negative=rows.length-positive;
 let concordance=0;rows.forEach((a,i)=>{if(a.y===1)rows.forEach((b,j)=>{if(b.y===0)concordance+=p[i]>p[j]?1:p[i]===p[j]?.5:0;});});
 return {n:rows.length,brier:mean(p.map((x,i)=>(x-rows[i].y)**2)),logLoss:-mean(p.map((x,i)=>rows[i].y*Math.log(x)+(1-rows[i].y)*Math.log(1-x))),auc:positive&&negative?concordance/(positive*negative):null,bins:Array.from({length:5},(_,b)=>{const ids=p.map((v,i)=>({v,i})).filter(o=>Math.min(4,Math.floor(o.v*5))===b);return {range:[b/5,(b+1)/5],n:ids.length,predicted:ids.length?mean(ids.map(o=>o.v)):null,observed:ids.length?mean(ids.map(o=>rows[o.i].y)):null};})};
}
// Regularised joint Rasch fit to eight ORIGINAL binary toy items, not Likert scales.
export function fitRasch(rows,{iterations=1200,rate=.5,penalty=.03}={}){
 if(rows.length<3||rows.some(r=>r.answers.length!==8||r.answers.some(y=>![0,1].includes(y))))throw Error('invalid-rasch-rows');
 let theta=rows.map(()=>0),difficulty=Array(8).fill(0);
 for(let t=0;t<iterations;t++){
  const gt=theta.map(v=>penalty*v),gb=difficulty.map(v=>penalty*v);
  rows.forEach((r,i)=>r.answers.forEach((y,j)=>{const e=sigmoid(theta[i]-difficulty[j])-y;gt[i]+=e/8;gb[j]-=e/rows.length;}));
  theta=theta.map((v,i)=>v-rate*gt[i]);difficulty=difficulty.map((v,j)=>v-rate*gb[j]);
  const center=mean(theta);theta=theta.map(v=>v-center);
 }
 return {theta,difficulty,iterations,penalty,method:'regularised joint Rasch toy fit; theta centred; fixed discrimination 1; research rehearsal only'};
}
export function nextToyItem(difficulty,theta,answered=[]){
 if(!Array.isArray(difficulty)||difficulty.length!==8||difficulty.some(x=>!Number.isFinite(x))||!Number.isFinite(theta)||answered.some(x=>!Number.isInteger(x)||x<0||x>7))throw Error('invalid-cat-input');
 return difficulty.map((b,item)=>{const p=sigmoid(theta-b);return {item,p,information:p*(1-p)};}).filter(x=>!answered.includes(x.item)).sort((a,b)=>b.information-a.information||a.item-b.item)[0]??null;
}
export function productionGate(){return {allowed:false,reasons:['synthetic-only','no-real-expert-attestation','no-human-outcome-validation','no-scale-permission','no-measurement-equivalence','no-approved-release'],status:'prototype-only'};}
export function run(data){
 if(data.version!==PROTOTYPE_VERSION||data.people.some(p=>p.synthetic!==true)||data.experts.some(p=>p.synthetic!==true)||new Set(data.people.map(p=>p.personId)).size!==data.people.length)throw Error('prototype-requires-unique-synthetic-people');
 const eligible=eligiblePeople(data),groups=partition(data),canTrain=groups.train.length>=2&&new Set(groups.train.map(r=>r.y)).size===2,model=canTrain?fitLogistic(groups.train):null,baseline=canTrain?mean(groups.train.map(r=>r.y)):null;
 const evaluation=Object.fromEntries(Object.entries(groups).map(([key,rows])=>[key,{model:model?metrics(rows,rows.map(r=>predict(model,r.x))):metrics([],[]),baseline:model?metrics(rows,rows.map(()=>baseline)):metrics([],[])}]));
 const ratingAllowed=eligiblePeople(data,'ratings'),trainingAllowed=eligiblePeople(data,'training');
 const cases=data.cases.filter(c=>eligible.has(c.personId)&&ratingAllowed.has(c.personId)),reliability=reliabilitySummary(cases,CRITERIA,{iterations:200}),content=contentValiditySummary(data.experts,CRITERIA);
 const raschRows=data.binary.filter(r=>trainingAllowed.has(r.personId)&&hash(r.personId)%10<6),rasch=raschRows.length>=3?fitRasch(raschRows):null;
 const conditions=['zh','en','ms'].map(language=>({language,...Object.fromEntries(['A','B'].map(form=>{const ids=new Set(data.people.filter(p=>p.language===language&&p.form===form&&eligible.has(p.personId)).map(p=>p.personId)),r=data.records.filter(r=>ids.has(r.personId));return [form,{n:ids.size,completion:r.length?mean(r.map(x=>x.y)):null}];}))}));
 return {version:PROTOTYPE_VERSION,synthetic:true,eligiblePeople:eligible.size,excludedPeople:data.people.length-eligible.size,groups:Object.fromEntries(Object.entries(groups).map(([k,r])=>[k,{people:new Set(r.map(x=>x.personId)).size,rows:r.length}])),model,evaluation,reliability,content,conditions,rasch:rasch?{...rasch,n:raschRows.length,next:nextToyItem(rasch.difficulty,0)}:null,gate:productionGate(),scope:'Synthetic workflow and arithmetic rehearsal. Not validity, real outcome prediction, scale permission, or production CAT.'};
}
