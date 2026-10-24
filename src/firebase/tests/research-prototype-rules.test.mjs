import fs from 'node:fs';import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,deleteDoc,serverTimestamp,writeBatch,getDocs,collection} from 'firebase/firestore';
import {fixture} from '../../research-prototype.js';
const env=await initializeTestEnvironment({projectId:'demo-futurefit-prototype-cloud',firestore:{host:'127.0.0.1',port:8180,rules:fs.readFileSync(process.env.FUTUREFIT_RULES_PATH||new URL('../firestore.rules',import.meta.url),'utf8')}});
const db=(uid,verified=true)=>env.authenticatedContext(uid,{email_verified:verified}).firestore(),hr=db('hr'),s=db('seeker'),other=db('other'),worker=db('I03hRbRU9khcQMws8YbdAyjTwSv1'),anon=env.unauthenticatedContext().firestore(),unverified=db('hr',false);let count=0;
const ok=async p=>{await assertSucceeds(p);count++;},no=async p=>{await assertFails(p);count++;},path=(d,c,id='seeker_job')=>doc(d,'aligna_research_prototype'+c,id);
const run=(d=hr)=>path(d,'s'),consent=(d=s)=>path(d,'_consents'),report=(d=hr,id='seeker_job--one')=>path(d,'_reports',id);
const rd={applicationId:'seeker_job',ownerUid:'hr',seekerUid:'seeker',jobRequirementsVersion:1,basisVersion:'prototype-basis:test',version:'synthetic-research-v1',synthetic:true,linkedPerson:'SIM-002',sourceJson:JSON.stringify(fixture()),stateJson:'{}',revision:1,lastReportId:'',events:[],createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
const cd={applicationId:'seeker_job',ownerUid:'hr',seekerUid:'seeker',version:1,synthetic:true,research:true,training:true,ratings:false,withdrawn:false,theta:0,asked:[],consentVersion:'prototype-linked-consent-v1',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
const pd={applicationId:'seeker_job',ownerUid:'hr',seekerUid:'seeker',version:'synthetic-research-v1',synthetic:true,runRevision:1,consentRevision:1,sourceDigest:'prototype-evidence:test',payload:'{"synthetic":true,"gate":{"allowed":false}}',productionEnabled:false,createdAt:serverTimestamp()};
async function snap(d=hr,extra={},id='seeker_job--one'){const b=writeBatch(d);b.set(report(d,id),{...pd,...extra});b.update(run(d),{lastReportId:id,updatedAt:serverTimestamp()});return b.commit();}
try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();await setDoc(doc(d,'aligna_applications/seeker_job'),{active:true,synthetic:true,seekerUid:'seeker',employerUid:'hr',jobRequirementsVersion:1});await setDoc(doc(d,'aligna_users/seeker/sessions/private'),{privateAnswers:true});});
 for(const d of [s,other,worker,anon,unverified])await no(setDoc(run(d),rd));
 for(const extra of [{synthetic:false},{ownerUid:'other'},{seekerUid:'other'},{revision:2},{sourceJson:'short'},{version:'passed'},{linkedPerson:'other'},{privateCV:'bad'},{lastReportId:'forged'}])await no(setDoc(run(),{...rd,...extra}));
 await ok(setDoc(run(),rd));await ok(getDoc(run()));await ok(getDoc(run(s)));for(const d of [other,worker,anon,unverified])await no(getDoc(run(d)));
 await no(getDocs(collection(hr,'aligna_research_prototypes')));await no(updateDoc(run(s),{stateJson:'forged',updatedAt:serverTimestamp()}));await no(updateDoc(run(),{sourceJson:rd.sourceJson+' ',updatedAt:serverTimestamp()}));await no(deleteDoc(run()));
 for(const d of [hr,other,worker,anon])await no(setDoc(consent(d),cd));
 for(const extra of [{synthetic:false},{version:2},{consentVersion:'no'},{ownerUid:'other'},{asked:[1,1]},{asked:[8]},{theta:3},{rawCV:'bad'}])await no(setDoc(consent(),{...cd,...extra}));
 await ok(setDoc(consent(),cd));await ok(getDoc(consent(hr)));await ok(getDoc(consent(s)));for(const d of [other,worker,anon])await no(getDoc(consent(d)));
 await no(updateDoc(consent(hr),{training:false,version:2,updatedAt:serverTimestamp()}));await no(updateDoc(consent(s),{training:false,version:1,updatedAt:serverTimestamp()}));await no(deleteDoc(consent()));
 await no(setDoc(report(),pd));for(const d of [s,other,worker])await no(snap(d));for(const extra of [{productionEnabled:true},{synthetic:false},{runRevision:2},{consentRevision:2},{ownerUid:'other'},{rawCV:'bad'}])await no(snap(hr,extra));
 await ok(snap());await ok(getDoc(report()));await ok(getDoc(report(s)));await no(getDoc(report(other)));await no(updateDoc(report(),{payload:'replace'}));await no(deleteDoc(report()));
 await ok(updateDoc(consent(),{training:false,version:2,updatedAt:serverTimestamp()}));await no(getDoc(report()));await no(getDoc(report(s)));await no(snap(hr,{},'seeker_job--stale'));
 await ok(snap(hr,{consentRevision:2},'seeker_job--two'));
 await ok(updateDoc(consent(),{asked:[1],theta:1,updatedAt:serverTimestamp()}));await ok(getDoc(report(hr,'seeker_job--two')));await no(updateDoc(consent(),{ratings:true,asked:[1,2],updatedAt:serverTimestamp()}));
 const event={sequence:1,actor:'hr',action:'expert',subject:'0',synthetic:true};await no(updateDoc(run(),{stateJson:'new',revision:1,events:[event],lastReportId:'',updatedAt:serverTimestamp()}));await no(updateDoc(run(),{stateJson:'new',revision:2,events:[{...event,actor:'seeker'}],lastReportId:'',updatedAt:serverTimestamp()}));
 await ok(updateDoc(run(),{stateJson:'new',revision:2,events:[event],lastReportId:'',updatedAt:serverTimestamp()}));await no(getDoc(report(hr,'seeker_job--two')));await no(updateDoc(run(),{stateJson:'new2',revision:3,events:[{...event,sequence:2}],lastReportId:'',updatedAt:serverTimestamp()}));
 await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'aligna_applications/seeker_job'),{active:false}));await no(getDoc(run(hr)));await no(getDoc(run(s)));await no(getDoc(consent(hr)));await ok(getDoc(consent(s)));await ok(updateDoc(consent(),{withdrawn:true,version:3,updatedAt:serverTimestamp()}));await no(updateDoc(consent(),{withdrawn:false,version:4,updatedAt:serverTimestamp()}));
 await no(getDoc(doc(hr,'aligna_users/seeker/sessions/private')));await no(getDoc(doc(worker,'aligna_users/seeker/sessions/private')));
 console.log(JSON.stringify({checks:count,passed:true,scope:'paired synthetic source; candidate-only purpose consent; HR-only editing; current immutable snapshots; stale-report and application withdrawal denial; no raw assessment access'}));
}finally{await env.cleanup();}
