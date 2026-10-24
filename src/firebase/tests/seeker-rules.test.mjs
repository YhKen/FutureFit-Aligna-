import fs from 'node:fs';import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc} from 'firebase/firestore';
import {practiceRecord} from '../../practice-record.js';
import {cleanSettings,routeKey,receiptFor} from '../../seeker-records.js';
const rules=fs.readFileSync(process.env.FUTUREFIT_RULES_PATH||new URL('../firestore.rules',import.meta.url),'utf8');
const env=await initializeTestEnvironment({projectId:'demo-aligna',firestore:{host:'127.0.0.1',port:8180,rules}});
const a=env.authenticatedContext('seeker-a',{email_verified:true}).firestore(),b=env.authenticatedContext('hr-b',{email_verified:true}).firestore(),u=env.authenticatedContext('unverified',{email_verified:false}).firestore(),anon=env.unauthenticatedContext().firestore();
let count=0;const yes=async p=>{await assertSucceeds(p);count++;},no=async p=>{await assertFails(p);count++;},path=(col,id)=>'aligna_users/seeker-a/'+col+'/'+id;
try{
 await env.clearFirestore();const settings=cleanSettings({goalId:'13-2011.00',hours:4});const value={version:'seeker-private-v1',...settings,updatedAt:new Date().toISOString()};
 await yes(setDoc(doc(a,path('seeker_state','settings')),value));await yes(getDoc(doc(a,path('seeker_state','settings'))));
 await no(setDoc(doc(a,path('seeker_state','settings')),{...value,hours:0}));await no(setDoc(doc(a,path('seeker_state','settings')),{...value,budget:-1}));await no(setDoc(doc(a,path('seeker_state','settings')),{...value,admin:true}));
 const record=practiceRecord({id:'private-practice-001',taskId:'task-budget-tradeoff',answers:{selected:['A','D'],followUp:false,infeasible:false,maximum:'',sum:'',mismatch:false,explanation:'Synthetic explanation',verification:'Check source records'}});
 await yes(setDoc(doc(a,path('practice_attempts',record.attemptId)),record));await yes(getDoc(doc(a,path('practice_attempts',record.attemptId))));
 await no(updateDoc(doc(a,path('practice_attempts',record.attemptId)),{verified:true}));await no(setDoc(doc(a,path('practice_attempts','fake-verified')),{...record,attemptId:'fake-verified',verified:true}));
 const action={version:'seeker-private-v1',sourceAttemptId:record.attemptId,taskId:record.taskId,goalId:'',skillName:'Management of Financial Resources',topic:'explain-tradeoffs',state:'pending',sourceType:'self-practice-reflection',createdAt:record.createdAt,updatedAt:record.createdAt};
 await yes(setDoc(doc(a,path('learning_actions',record.attemptId)),action));await yes(updateDoc(doc(a,path('learning_actions',record.attemptId)),{state:'done',updatedAt:new Date().toISOString()}));await no(updateDoc(doc(a,path('learning_actions',record.attemptId)),{skillName:'Programming'}));await no(setDoc(doc(a,path('learning_actions','missing')),{...action,sourceAttemptId:'missing'}));
 const route={version:'seeker-private-v1',settings,completed:['direction'],unitVersion:'work-sample-route-v1',updatedAt:record.createdAt};await yes(setDoc(doc(a,path('learning_routes',routeKey(settings))),route));await no(setDoc(doc(a,path('learning_routes',routeKey(settings))),{...route,verified:true}));
 const plan={goalId:'13-2011.00',newsVersion:'published-test',country:'MY',months:3,hours:4,baseline:[{name:'A'}],priorities:[{name:'B',priority:2,baselinePriority:1,evidence:[]}]},receipt=receiptFor(plan,'viewed',null,record.createdAt);
 await yes(setDoc(doc(a,path('news_receipts',receipt.key)),receipt));await yes(setDoc(doc(a,path('news_receipts',receipt.key)),receiptFor(plan,'applied',receipt,new Date().toISOString())));await no(updateDoc(doc(a,path('news_receipts',receipt.key)),{after:['forged']}));await no(updateDoc(doc(a,path('news_receipts',receipt.key)),{status:'approved-news'}));
 const interview={version:'seeker-private-v1',attemptId:'interview-one',formVersion:'public-interview-v1-0',sourceType:'interview-self-practice',verified:false,goalId:'13-2011.00',locale:'en',answers:['one','two','three'],checks:[true,false,false],createdAt:record.createdAt,updatedAt:record.createdAt};await yes(setDoc(doc(a,path('interview_attempts',interview.attemptId)),interview));await no(updateDoc(doc(a,path('interview_attempts',interview.attemptId)),{verified:true}));
 for(const [col,id] of [['seeker_state','settings'],['practice_attempts',record.attemptId],['learning_actions',record.attemptId],['learning_routes',routeKey(settings)],['news_receipts',receipt.key],['interview_attempts',interview.attemptId]]){
  await no(getDoc(doc(b,path(col,id))));await no(getDoc(doc(anon,path(col,id))));await no(getDocs(collection(b,'aligna_users/seeker-a/'+col)));await yes(getDocs(collection(a,'aligna_users/seeker-a/'+col)));
 }
 await no(setDoc(doc(u,'aligna_users/unverified/seeker_state/settings'),value));await no(setDoc(doc(b,path('seeker_state','settings')),value));
 assert.equal((await getDoc(doc(a,path('practice_attempts',record.attemptId)))).data().verified,false);
 console.log('PASS '+count+' seeker rules checks: owner-only persistence, immutable attempts, no self-verification, tool conditions, learning actions, settings, routes and news receipts.');
}finally{await env.cleanup();}
