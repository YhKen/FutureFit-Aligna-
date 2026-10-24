import {fixture,run,nextToyItem,CRITERIA,PROTOTYPE_VERSION} from '../research-prototype.js';
import {contentVersion} from '../integration-contract.js';
import {workScope} from './formal-work-service.js';
import {applicationJob} from '../job-requirements.js';
import {matchCandidate} from '../match-engine.js';
import {safeError} from './news-store.js';
export const RP={run:'aligna_research_prototypes',consent:'aligna_research_prototype_consents',report:'aligna_research_prototype_reports'};
const linkedPerson='SIM-002',fail=(code,status=400)=>{throw safeError(code,status);};
const uid=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,220}$/.test(x);
async function checkedWrite(store,path,data,options){try{return await store.write(path,data,options);}catch(e){if(options?.updateTime&&[403,409].includes(e.status)){let latest;try{latest=await store.get(path);}catch{}if(latest&&latest._updateTime!==options.updateTime)fail('prototype-conflict',409);}throw e;}}
const basis=a=>contentVersion({job:a.jobSnapshot,candidate:a.candidate,version:a.jobRequirementsVersion},'prototype-basis');
function material(a){const d=fixture(),m=matchCandidate(applicationJob(a,null),a.candidate);for(const r of d.records)if(r.personId===linkedPerson)r.x[0]=(m.coverage||0)/100;const p=d.people.find(p=>p.personId===linkedPerson);p.consent=p.trainingConsent=p.ratingConsent=false;return d;}
const initialState=()=>({people:{},experts:{},ratings:{},cat:{theta:0,asked:[]}});
const initialConsent=(a)=>({applicationId:a.id,ownerUid:a.employerUid,seekerUid:a.seekerUid,version:1,synthetic:true,research:false,training:false,ratings:false,withdrawn:false,theta:0,asked:[],consentVersion:'prototype-linked-consent-v1'});
async function scope(store,user,id){const s=await workScope(store,user,id);if(s.app.synthetic!==true||!s.app.jobSnapshot)fail('synthetic-application-required',409);return s;}
function checkedState(raw){let s;try{s=JSON.parse(raw);}catch{fail('prototype-state-invalid',409);}const base=initialState();
 if(!s||Object.keys(s).sort().join()!==Object.keys(base).sort().join())fail('prototype-state-invalid',409);
 for(const [personId,v] of Object.entries(s.people)){if(!/^SIM-\d{3}$/.test(personId)||personId===linkedPerson||!fixture().people.some(p=>p.personId===personId)||Object.keys(v).sort().join()!=='consent,ratingConsent,trainingConsent,withdrawn'||Object.values(v).some(x=>typeof x!=='boolean'))fail('prototype-state-invalid',409);}
 for(const [key,value] of Object.entries(s.experts)){const [expert,criterion]=key.split(':').map(Number);if(!Number.isInteger(expert)||expert<0||expert>5||!Number.isInteger(criterion)||criterion<0||criterion>3||![null,1,2,3,4].includes(value))fail('prototype-state-invalid',409);}
 for(const [key,value] of Object.entries(s.ratings)){if(!/^(0|[1-9]|[12][0-9]|3[0-5])$/.test(key)||![null,1,2,3].includes(value))fail('prototype-state-invalid',409);}
 if(![-2,-1,0,1,2].includes(s.cat.theta)||!Array.isArray(s.cat.asked)||s.cat.asked.length>8||new Set(s.cat.asked).size!==s.cat.asked.length||s.cat.asked.some(v=>!Number.isInteger(v)||v<0||v>7))fail('prototype-state-invalid',409);
 return s;
}
function derive(app,row,consent){
 if(row.version!==PROTOTYPE_VERSION||row.synthetic!==true||row.basisVersion!==basis(app)||row.sourceJson!==JSON.stringify(material(app)))fail('prototype-source-changed',409);
 const data=JSON.parse(row.sourceJson),state=checkedState(row.stateJson);
 for(const [id,values] of Object.entries(state.people))Object.assign(data.people.find(p=>p.personId===id),values);
 for(const [key,value] of Object.entries(state.experts)){const [i,j]=key.split(':').map(Number);data.experts[i].criteria[j].relevance=value;}
 for(const [key,value] of Object.entries(state.ratings))data.cases[Number(key)].b[0]=value;
 const own=data.people.find(p=>p.personId===linkedPerson);Object.assign(own,{consent:!!consent?.research,trainingConsent:!!consent?.training,ratingConsent:!!consent?.ratings,withdrawn:!!consent?.withdrawn});
 const report=run(data),sourceDigest=contentVersion({basis:row.basisVersion,revision:row.revision,state:row.stateJson,consent:consent?{version:consent.version,research:consent.research,training:consent.training,ratings:consent.ratings,withdrawn:consent.withdrawn}:null},'prototype-evidence');
 return {data,state,report,sourceDigest};
}
export async function researchContext(store,user,applicationId){
 if(!applicationId){const apps=await store.query('aligna_applications',{[user.requestedRole==='hr'?'employerUid':'seekerUid']:user.uid,active:true});return {applications:apps.filter(a=>a.synthetic===true&&a.jobSnapshot).map(a=>({id:a.id,jobTitle:a.jobTitle,candidateName:a.candidate?.displayName})),role:user.requestedRole==='hr'?'hr':'seeker'};}
 const {app,role}=await scope(store,user,applicationId),row=await store.get(RP.run+'/'+applicationId),consent=row?await store.get(RP.consent+'/'+applicationId):null;
 const application={id:app.id,jobId:app.jobId,jobTitle:app.jobTitle,jobRequirementsVersion:app.jobRequirementsVersion,jobSnapshot:app.jobSnapshot,candidate:app.candidate,companyName:app.companyName};
 if(!row)return {role,application,exists:false};
 const derived=derive(app,row,consent);let savedReport=null;
 if(row.lastReportId){try{const saved=await store.get(RP.report+'/'+row.lastReportId);if(saved&&saved.sourceDigest===derived.sourceDigest&&saved.payload===JSON.stringify(derived.report))savedReport={id:saved.id,createdAt:saved.createdAt,verified:true};}catch(e){if(e.status!==403)throw e;}}
 return {role,application,exists:true,linkedPerson,data:derived.data,report:derived.report,sourceDigest:derived.sourceDigest,revision:row.revision,recordVersion:row._updateTime,consent:consent?{research:consent.research,training:consent.training,ratings:consent.ratings,withdrawn:consent.withdrawn,version:consent.version,recordVersion:consent._updateTime,theta:consent.theta,asked:consent.asked}:null,cat:role==='hr'?derived.state.cat:{theta:consent?.theta||0,asked:consent?.asked||[]},savedReport,events:row.events,cloudPaths:{source:RP.run+'/'+applicationId,consent:RP.consent+'/'+applicationId,report:row.lastReportId?RP.report+'/'+row.lastReportId:null}};
}
export async function researchAction(store,user,b){
 const {app,role}=await scope(store,user,b.applicationId),path=RP.run+'/'+b.applicationId;let row=await store.get(path);
 if(b.action==='create'){
  if(role!=='hr')fail('prototype-hr-only',403);
  if(!row){await store.write(path,{applicationId:app.id,ownerUid:app.employerUid,seekerUid:app.seekerUid,jobRequirementsVersion:app.jobRequirementsVersion,basisVersion:basis(app),version:PROTOTYPE_VERSION,synthetic:true,linkedPerson,sourceJson:JSON.stringify(material(app)),stateJson:JSON.stringify(initialState()),revision:1,lastReportId:'',events:[]},{create:true,serverFields:['createdAt','updatedAt']});}
  return researchContext(store,user,b.applicationId);
 }
 if(!row)fail('prototype-not-created',409);const consent=await store.get(RP.consent+'/'+app.id),derived=derive(app,row,consent);
 if(b.action==='consent'){
  if(role!=='seeker'||b.confirmed!==true||['research','training','ratings','withdrawn'].some(k=>typeof b[k]!=='boolean'))fail('prototype-seeker-consent-required',403);
  if((consent?._updateTime||'')!==(b.consentVersion||''))fail('prototype-conflict',409);
  const d={...initialConsent(app),...(consent||{}),research:b.research,training:b.training,ratings:b.ratings,withdrawn:b.withdrawn,version:(consent?.version||0)+1};
  await checkedWrite(store,RP.consent+'/'+app.id,d,{...(consent?{updateTime:consent._updateTime}:{create:true}),serverFields:consent?['updatedAt']:['createdAt','updatedAt']});
  return researchContext(store,user,b.applicationId);
 }
 if(b.action==='item'||b.action==='clear-items'){
  const cat=role==='hr'?derived.state.cat:{theta:consent?.theta||0,asked:consent?.asked||[]};
  if(role==='seeker'&&!consent)fail('prototype-consent-record-required',409);
  if(b.action==='item'){if(![-2,-1,0,1,2].includes(b.theta))fail('invalid-theta');if(!derived.report.rasch)fail('prototype-not-enough-data',409);const next=nextToyItem(derived.report.rasch.difficulty,b.theta,cat.asked);if(!next)fail('prototype-items-exhausted',409);cat.theta=b.theta;cat.asked=[...cat.asked,next.item];}else{cat.theta=0;cat.asked=[];}
  if(role==='seeker'){if(b.consentVersion!==consent._updateTime)fail('prototype-conflict',409);await checkedWrite(store,RP.consent+'/'+app.id,{...consent,...cat},{updateTime:consent._updateTime,serverFields:['updatedAt']});return researchContext(store,user,app.id);}
 }
 if(role!=='hr')fail('prototype-hr-only',403);
 if(b.recordVersion!==row._updateTime)fail('prototype-conflict',409);
 if(b.action==='report'){
  if(!uid(b.operationId)||b.operationId.length>60)fail('invalid-operation');const id=app.id+'--'+b.operationId,existing=await store.get(RP.report+'/'+id);
  if(existing){if(existing.sourceDigest!==derived.sourceDigest)fail('prototype-conflict',409);return researchContext(store,user,app.id);}
  try{await store.atomic([{path:RP.report+'/'+id,data:{applicationId:app.id,ownerUid:app.employerUid,seekerUid:app.seekerUid,version:PROTOTYPE_VERSION,synthetic:true,runRevision:row.revision,consentRevision:consent?.version||0,sourceDigest:derived.sourceDigest,payload:JSON.stringify(derived.report),productionEnabled:false},create:true,serverFields:['createdAt']},{path,data:{...row,lastReportId:id},updateTime:row._updateTime,serverFields:['updatedAt']}]);}catch(e){if([403,409].includes(e.status)){let latest,latestConsent;try{latest=await store.get(path);latestConsent=await store.get(RP.consent+'/'+app.id);}catch{}if(latest&&latest._updateTime!==row._updateTime||(latestConsent?.version||0)!==(consent?.version||0))fail('prototype-conflict',409);}throw e;}
  const context=await researchContext(store,user,app.id);if(!context.savedReport?.verified)fail(context.sourceDigest!==derived.sourceDigest?'prototype-conflict':'prototype-report-not-confirmed',context.sourceDigest!==derived.sourceDigest?409:503);return context;
 }
 if(b.action==='person'){
  if(b.personId===linkedPerson)fail('prototype-candidate-controls-consent',403);if(!derived.data.people.some(p=>p.personId===b.personId)||['consent','trainingConsent','ratingConsent','withdrawn'].some(k=>typeof b[k]!=='boolean'))fail('invalid-simulated-person');
  derived.state.people[b.personId]=Object.fromEntries(['consent','trainingConsent','ratingConsent','withdrawn'].map(k=>[k,b[k]]));
 }else if(b.action==='expert'){
  if(!Number.isInteger(b.expert)||b.expert<0||b.expert>5||!Number.isInteger(b.criterion)||b.criterion<0||b.criterion>3||![null,1,2,3,4].includes(b.value))fail('invalid-simulated-expert');derived.state.experts[b.expert+':'+b.criterion]=b.value;
 }else if(b.action==='rating'){
  if(!Number.isInteger(b.index)||b.index<0||b.index>35||![null,1,2,3].includes(b.value))fail('invalid-simulated-rating');derived.state.ratings[String(b.index)]=b.value;
 }else if(!['item','clear-items'].includes(b.action))fail('invalid-prototype-action');
 if(row.events.length>=100)fail('prototype-event-limit',409);
 const event={sequence:row.events.length+1,actor:'hr',action:b.action,subject:b.personId||String(b.expert??b.index??''),synthetic:true};
 await checkedWrite(store,path,{...row,stateJson:JSON.stringify(derived.state),revision:row.revision+1,events:[...row.events,event],lastReportId:''},{updateTime:row._updateTime,serverFields:['updatedAt']});
 return researchContext(store,user,app.id);
}
