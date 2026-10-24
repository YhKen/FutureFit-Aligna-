import fs from 'node:fs';import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,serverTimestamp} from 'firebase/firestore';
import {formalTask} from '../../formal-work-data.js';
const rules=fs.readFileSync(process.env.FUTUREFIT_RULES_PATH||new URL('../firestore.rules',import.meta.url),'utf8'),env=await initializeTestEnvironment({projectId:'demo-futurefit-h06',firestore:{host:'127.0.0.1',port:8180,rules}});
const db=u=>env.authenticatedContext(u,{email_verified:true}).firestore(),hr=db('hr'),s=db('seeker'),other=db('other');let count=0;
const pass=async p=>{await assertSucceeds(p);count++;},deny=async p=>{await assertFails(p);count++;};
const skillIds=formalTask('resource-plan').linkedSkillIds,requirements={skillIds,skills:[],workOutputs:[{id:'planning',skillIds:skillIds.slice(0,2)},{id:'reasoning',skillIds:skillIds.slice(2)}]},base={seekerUid:'seeker',employerUid:'hr',jobId:'job',jobRequirementsVersion:1,jobSnapshot:{requirementsVersion:1,requirements},active:true,status:'interview',interviewAt:'2026-10-25T01:30:00.000Z',interviewDetails:'Synthetic interview',interviewTimeZone:'Asia/Kuala_Lumpur',interviewResponse:'pending'};
const seed=async(name='seeker_job',extra={})=>env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'aligna_jobs/job'),{status:'published',requirementsVersion:2});await setDoc(doc(c.firestore(),'aligna_applications/'+name),{...base,...extra});});
const proposal={interviewResponse:'proposed',interviewProposalAt:'2026-10-26T00:30:00.000Z',interviewProposalTimeZone:'Asia/Tokyo',interviewProposalDetails:'Synthetic alternative slot',updatedAt:serverTimestamp()};
try{
 await env.clearFirestore();await seed();const app=d=>doc(d,'aligna_applications/seeker_job');
 await deny(updateDoc(app(other),proposal));await deny(updateDoc(app(hr),proposal));await deny(updateDoc(app(s),{...proposal,interviewAt:'2026-11-01T00:00:00.000Z'}));
 await deny(updateDoc(app(s),{...proposal,interviewProposalAt:''}));await deny(updateDoc(app(s),{...proposal,interviewProposalAt:'not-a-date'}));await deny(updateDoc(app(s),{...proposal,interviewProposalTimeZone:'Europe/London'}));await deny(updateDoc(app(s),{...proposal,interviewProposalDetails:'x'.repeat(1001)}));
 await pass(updateDoc(app(s),proposal));await pass(getDoc(app(hr)));await deny(updateDoc(app(s),{interviewResponse:'accepted',updatedAt:serverTimestamp()}));
 await deny(updateDoc(app(hr),{interviewAt:'2026-10-27T00:30:00.000Z',interviewResponse:'pending',updatedAt:serverTimestamp()}));
 await pass(updateDoc(app(hr),{interviewAt:'2026-10-27T00:30:00.000Z',interviewResponse:'pending',interviewProposalAt:'',interviewProposalTimeZone:'Asia/Kuala_Lumpur',interviewProposalDetails:'',updatedAt:serverTimestamp()}));
 await pass(updateDoc(app(s),{interviewResponse:'accepted',interviewProposalAt:'',interviewProposalTimeZone:'Asia/Kuala_Lumpur',interviewProposalDetails:'',updatedAt:serverTimestamp()}));
 await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'aligna_jobs/job'),{status:'closed'}));
 await deny(updateDoc(app(hr),{interviewAt:'2026-10-28T00:30:00.000Z',interviewResponse:'pending',updatedAt:serverTimestamp()}));
 await pass(updateDoc(app(hr),{status:'completed',interviewAt:'',interviewDetails:'',interviewTimeZone:'Asia/Kuala_Lumpur',interviewResponse:'pending',updatedAt:serverTimestamp()}));
 await pass(updateDoc(app(s),{active:false,status:'withdrawn',candidate:null,interviewAt:'',interviewDetails:'',interviewTimeZone:'Asia/Kuala_Lumpur',interviewResponse:'pending',interviewProposalAt:'',interviewProposalTimeZone:'Asia/Kuala_Lumpur',interviewProposalDetails:'',updatedAt:serverTimestamp()}));await deny(getDoc(app(hr)));
 await seed('legacy',{interviewTimeZone:'Asia/Kuala_Lumpur'});await pass(updateDoc(doc(s,'aligna_applications/legacy'),{active:false,status:'withdrawn',candidate:null,interviewAt:'',interviewDetails:'',interviewResponse:'pending',updatedAt:serverTimestamp()}));
 await seed();const task=formalTask('resource-plan'),id='seeker_job--resource-plan--A',assignment={applicationId:'seeker_job',jobId:'job',jobRequirementsVersion:1,skillIds,workOutputIds:['planning','reasoning'],employerUid:'hr',seekerUid:'seeker',taskId:task.id,variant:task.variant,taskVersion:task.version,rubricVersion:task.rubricVersion,condition:'independent',minutes:20,createdAt:serverTimestamp()},ref=d=>doc(d,'aligna_work_assignments/'+id);
 await deny(setDoc(ref(other),assignment));await deny(setDoc(ref(hr),{...assignment,skillIds:['skill:Programming']}));await deny(setDoc(ref(hr),{...assignment,skillIds:skillIds.slice(0,1)}));await deny(setDoc(ref(hr),{...assignment,workOutputIds:['forged']}));await deny(setDoc(ref(hr),{...assignment,workOutputIds:['planning']}));await deny(setDoc(ref(hr),{...assignment,jobRequirementsVersion:2}));
 await pass(setDoc(ref(hr),assignment));await pass(getDoc(ref(s)));await deny(updateDoc(ref(hr),{skillIds:[]}));await deny(getDoc(ref(other)));
 console.log(JSON.stringify({checks:count,allPassed:true,scope:'alternative-time privacy and validation; immutable frozen basis; closed and withdrawn boundaries; exact task skill/output links; legacy withdrawal'}));
}finally{await env.cleanup();}
