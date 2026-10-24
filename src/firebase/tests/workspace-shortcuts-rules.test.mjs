import fs from 'node:fs';import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,serverTimestamp} from 'firebase/firestore';
const rules=fs.readFileSync(process.env.FUTUREFIT_RULES_PATH,'utf8');
const env=await initializeTestEnvironment({projectId:'demo-aligna',firestore:{host:'127.0.0.1',port:8180,rules}});
const owner=env.authenticatedContext('shortcut-owner',{email_verified:true}).firestore(),other=env.authenticatedContext('other',{email_verified:true}).firestore(),unverified=env.authenticatedContext('shortcut-owner',{email_verified:false}).firestore(),anonymous=env.unauthenticatedContext().firestore();
const path='aligna_users/shortcut-owner/preferences/workspace',ids=['jobs','growth','games','assessment'],data=()=>({version:'workspace-shortcuts-v1',ids,updatedAt:serverTimestamp()});let checks=0;
const yes=async p=>{await assertSucceeds(p);checks++;},no=async p=>{await assertFails(p);checks++;};
try{await env.clearFirestore();await yes(setDoc(doc(owner,path),data()));await yes(getDoc(doc(owner,path)));assert.deepEqual((await getDoc(doc(owner,path))).data().ids,ids);checks++;
 await yes(setDoc(doc(owner,path),{...data(),ids:['applications','transition','life-skills','study-calendar']}));
 for(const bad of [[],ids.slice(0,3),[...ids,'applications'],['jobs','jobs','growth','games'],['jobs','growth','games','evil'],['jobs','growth','games',1]])await no(setDoc(doc(owner,path),{...data(),ids:bad}));
 for(const db of [other,unverified,anonymous]){await no(getDoc(doc(db,path)));await no(setDoc(doc(db,path),data()));}
 await no(setDoc(doc(owner,path),{...data(),admin:true}));await no(setDoc(doc(owner,path),{...data(),updatedAt:'fake'}));await no(setDoc(doc(owner,path),{...data(),version:'unknown'}));await no(setDoc(doc(owner,'aligna_users/shortcut-owner/preferences/unapproved'),data()));
 console.log(JSON.stringify({passed:true,checks,scope:'Only four allowlisted personal shortcuts; no sharing or HR evidence permissions changed.'}));
}finally{await env.cleanup();}
