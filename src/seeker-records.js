import {contentVersion} from './integration-contract.js';
export const SEEKER_VERSION='seeker-private-v1';
export const defaultSettings={goalId:'',country:'MY',months:3,hours:5,budget:0,learningLanguage:'en'};
export function cleanSettings(value={}){
 const s={...defaultSettings,...value};
 if(typeof s.goalId!=='string'||s.goalId.length>20||!['MY','SG','UK','AU','US'].includes(s.country)||![3,5,6,12].includes(s.months)||!Number.isInteger(s.hours)||s.hours<1||s.hours>40||!Number.isFinite(s.budget)||s.budget<0||s.budget>1000000||!['zh','en','ms'].includes(s.learningLanguage))throw Error('invalid-settings');
 return Object.fromEntries(Object.keys(defaultSettings).map(k=>[k,s[k]]));
}
export function routeKey(settings){return contentVersion(cleanSettings(settings),'route');}
export function updateKey(plan){return contentVersion({goalId:plan.goalId,country:plan.country,months:plan.months,hours:plan.hours,subscriptionUpdatedAt:plan.subscriptionUpdatedAt||'',newsVersion:plan.newsVersion,priorities:plan.priorities?.map(p=>({name:p.name,priority:p.priority,evidence:p.evidence?.map(e=>({id:e.articleId||e.id||e.url,quote:e.impact?.quote}))}))},'news');}
export function validPlanContext(plan,subscription){return !!plan&&!!subscription&&subscription.goalId===plan.goalId&&subscription.country===plan.country&&subscription.months===plan.months&&subscription.hours===plan.hours;}
export function meaningfulUpdate(plan){return !!plan&&!plan.unchanged&&plan.priorities?.some(p=>p.evidence?.length&&p.priority!==p.baselinePriority);}
export function appliedPlan(plan,receipt){return receipt?.version===SEEKER_VERSION&&receipt.key===updateKey(plan)&&receipt.status==='applied'?plan:null;}
export function receiptFor(plan,status,previous,now=new Date().toISOString()){
 if(!['viewed','later','applied','dismissed','undone'].includes(status)||!Number.isFinite(Date.parse(now)))throw Error('invalid-receipt');
 const key=updateKey(plan);if(previous&&previous.key!==key)throw Error('stale-update');
 return {version:SEEKER_VERSION,key,goalId:plan.goalId,newsVersion:plan.newsVersion,status,before:(plan.baseline||[]).slice(0,6).map(p=>p.name),after:(plan.priorities||[]).slice(0,6).map(p=>p.name),createdAt:previous?.createdAt||now,updatedAt:now,snoozeUntil:status==='later'?new Date(Date.parse(now)+86400000).toISOString():''};
}
export function mayNotify(plan,subscription,receipt,now=Date.now()){
 if(!validPlanContext(plan,subscription)||!meaningfulUpdate(plan))return false;
 if(!receipt)return true;
 return receipt.status==='later'&&Date.parse(receipt.snoozeUntil)<=now;
}
export async function readPrivate(client,collection,id){
 const snap=await client.F.getDocFromServer(client.F.doc(client.db,'aligna_users',client.user.uid,collection,id));return snap.exists()?snap.data():null;
}
export async function saveReadBack(client,collection,id,value){
 const previous=await readPrivate(client,collection,id);if(previous&&contentVersion(previous)===contentVersion(value))return previous;
 await client.save(collection,id,value);const saved=await readPrivate(client,collection,id);
 if(!saved||contentVersion(saved)!==contentVersion(value))throw Error('save-not-confirmed');return saved;
}
export async function saveReceipt(client,plan,status,previous){const next=receiptFor(plan,status,previous);return saveReadBack(client,'news_receipts',next.key,next);}
export async function loadSettings(client){return cleanSettings(await readPrivate(client,'seeker_state','settings')||{});}
export async function storeSettings(client,settings){const clean=cleanSettings(settings);await saveReadBack(client,'seeker_state','settings',{version:SEEKER_VERSION,...clean,updatedAt:new Date().toISOString()});if(typeof window!=='undefined'){try{localStorage.setItem('aligna-target-'+client.user.uid,clean.goalId);}catch{}window.dispatchEvent(new CustomEvent('futurefit-target',{detail:{goalId:clean.goalId}}));}return clean;}
