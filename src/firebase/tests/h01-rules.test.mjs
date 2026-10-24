import fs from 'node:fs';import assert from 'node:assert/strict';
import {seedCompanyFixture} from './company-fixture.mjs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,updateDoc,serverTimestamp} from 'firebase/firestore';
import {validateRequirements,snapshotJob,matchingBasisFromJob} from '../../job-requirements.js';
import {skillId} from '../../skill-catalog.js';
const env=await initializeTestEnvironment({projectId:'demo-aligna-h01',firestore:{host:'127.0.0.1',port:8180,rules:fs.readFileSync(process.env.FUTUREFIT_RULES_PATH||new URL('../firestore.rules',import.meta.url),'utf8')}}),db=id=>env.authenticatedContext(id,{email_verified:true}).firestore(),hr=db('hr'),seeker=db('seeker'),other=db('other');let count=0;
const pass=async p=>{await assertSucceeds(p);count++;},deny=async p=>{await assertFails(p);count++;};
const row=(n,type='professional')=>({skillId:skillId(n),label:{en:n,zh:n,ms:n},type,requirement:'entry_required',observableBehavior:'Synthetic observable example.',allowedEvidence:['work_sample']});
const requirements=validateRequirements({skills:[row('Microsoft Excel'),row('SQL'),row('Communication','collaboration')],workOutputs:[],qualifications:[],workConditions:{location:{value:'KL',status:'specified'},salary:{min:3000,max:4000,currency:'MYR',period:'monthly'},workArrangement:{mode:'hybrid',schedule:'Monday-Friday'}}});
const job={ownerUid:'hr',companyName:'SYNTHETIC QA ONLY',jobTitle:'Synthetic operations assistant',salary:3000,jobDescription:'Synthetic only',jobField:'Operations',location:'KL',skills:'Excel, SQL',softSkills:'Communication',jobRequirements:'Synthetic requirements',futureSkills:'Learning',employmentType:'Full-time',employeeCount:1,workingTime:'Monday-Friday',jobSchemaVersion:2,requirementsVersion:1,requirements,status:'published',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),publishedAt:serverTimestamp()};
const app={seekerUid:'seeker',employerUid:'hr',jobId:'h01',jobTitle:job.jobTitle,companyName:job.companyName,...matchingBasisFromJob(job),jobSnapshot:snapshotJob(job),candidate:{displayName:'SYNTHETIC S002',summary:'Synthetic',education:'',experience:'',location:'',employmentType:'',portfolio:'',skills:[{name:'Excel',example:'Synthetic workbook.'}],synthetic:true},consentVersion:'application-share-v1',synthetic:true,active:true,status:'submitted',interviewAt:'',interviewDetails:'',interviewResponse:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
try{
 await env.clearFirestore();await seedCompanyFixture(env,'hr',job.companyName);await pass(setDoc(doc(hr,'aligna_employers/hr'),{ownerUid:'hr',companyName:job.companyName,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await pass(setDoc(doc(hr,'aligna_jobs/h01'),job));await pass(getDoc(doc(seeker,'aligna_jobs/h01')));
 await deny(setDoc(doc(other,'aligna_jobs/forged'),job));
 await deny(updateDoc(doc(hr,'aligna_jobs/h01'),{requirementsVersion:3,updatedAt:serverTimestamp(),publishedAt:serverTimestamp()}));
 await deny(updateDoc(doc(hr,'aligna_jobs/h01'),{jobTitle:'Changed without version',updatedAt:serverTimestamp(),publishedAt:serverTimestamp()}));
 await deny(updateDoc(doc(hr,'aligna_jobs/h01'),{requirements:{...requirements,skillTypes:{...requirements.skillTypes,[skillId('SQL')]:'forged'}},requirementsVersion:2,updatedAt:serverTimestamp(),publishedAt:serverTimestamp()}));
 await deny(updateDoc(doc(hr,'aligna_jobs/h01'),{requirements:{...requirements,skillIds:['bad','bad','bad']},requirementsVersion:2,updatedAt:serverTimestamp(),publishedAt:serverTimestamp()}));
 await pass(updateDoc(doc(hr,'aligna_jobs/h01'),{updatedAt:serverTimestamp(),publishedAt:serverTimestamp()}));
 const path='aligna_applications/seeker_h01';
 await deny(setDoc(doc(seeker,path),{...app,jobSnapshot:{...app.jobSnapshot,skills:'Forged snapshot'}}));
 await deny(setDoc(doc(seeker,path),{...app,jobRequirementsVersion:0}));
 await deny(setDoc(doc(seeker,path),{...app,matchingBasis:{...app.matchingBasis,skillIds:[]}}));
 await pass(setDoc(doc(seeker,path),app));await deny(setDoc(doc(seeker,path),app));
 await pass(getDoc(doc(hr,path)));await pass(getDoc(doc(seeker,path)));await deny(getDoc(doc(other,path)));
 await deny(updateDoc(doc(hr,path),{jobRequirementsVersion:2,updatedAt:serverTimestamp()}));
 await pass(updateDoc(doc(hr,'aligna_jobs/h01'),{jobTitle:'Updated posting v2',requirementsVersion:2,updatedAt:serverTimestamp(),publishedAt:serverTimestamp()}));
 const saved=(await getDoc(doc(hr,path))).data();assert.equal(saved.jobSnapshot.jobTitle,job.jobTitle);assert.equal(saved.jobRequirementsVersion,1);count++;
 await pass(updateDoc(doc(hr,'aligna_jobs/h01'),{status:'closed',publishedAt:null,updatedAt:serverTimestamp()}));await pass(getDoc(doc(hr,path)));await deny(getDoc(doc(seeker,'aligna_jobs/h01')));
 await deny(updateDoc(doc(hr,path),{status:'interview',interviewAt:'2026-11-01T02:00:00.000Z',interviewDetails:'SYNTHETIC QA ONLY',interviewResponse:'pending',updatedAt:serverTimestamp()}));
 await pass(updateDoc(doc(hr,'aligna_jobs/h01'),{status:'published',publishedAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await pass(updateDoc(doc(hr,path),{status:'interview',interviewAt:'2026-11-01T02:00:00.000Z',interviewDetails:'SYNTHETIC QA ONLY; no real appointment.',interviewResponse:'pending',updatedAt:serverTimestamp()}));
 await pass(updateDoc(doc(seeker,path),{interviewResponse:'accepted',updatedAt:serverTimestamp()}));
 await pass(updateDoc(doc(seeker,path),{active:false,status:'withdrawn',candidate:null,interviewAt:'',interviewDetails:'',interviewResponse:'pending',updatedAt:serverTimestamp()}));await deny(getDoc(doc(hr,path)));
 const max=validateRequirements({...requirements,skillTypes:undefined,entryLevels:undefined,skills:Array.from({length:30},(_,i)=>row('Synthetic Skill '+i)),workOutputs:Array.from({length:20},(_,i)=>({id:'out-'+i,description:'Synthetic output.',skillIds:[skillId('Synthetic Skill '+i)]})),qualifications:Array.from({length:10},(_,i)=>({name:'Synthetic '+i,issuer:'Test source',region:'MY',sourceUrl:'https://example.test/source',verificationStatus:'pending'}))});
 await pass(setDoc(doc(hr,'aligna_jobs/max-boundary'),{...job,requirements:max}));
 console.log('PASS '+count+' H01 production-contract rule checks.');
}catch(e){console.log("Checks completed before failure:",count);throw e;}finally{await env.cleanup();}


