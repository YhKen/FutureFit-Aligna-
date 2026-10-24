import {connect} from './cloud.js';
import {journeyProgress} from './journey.js';
import {seekerCopy,esc,localMessage} from './seeker-copy.js';
import {readPrivate,updateKey,saveReceipt,mayNotify,meaningfulUpdate,validPlanContext} from './seeker-records.js';
let client,personal=null,receipt=null,dialog,button,busy=false,disposed=false,loading=false,openedFrom=null,message='',timer;
const c=()=>seekerCopy[document.documentElement.lang]||seekerCopy.en;
const key=()=>personal?.plan?updateKey(personal.plan):'';
const label=p=>p.label?.[document.documentElement.lang]||p.name;
function render(){
 if(!button)return;const w=c(),plan=validPlanContext(personal?.plan,personal?.subscription)?personal.plan:null;
 const unread=plan&&meaningfulUpdate(plan)&&!['applied','dismissed','undone'].includes(receipt?.status);
 button.setAttribute('aria-label',w.inbox+(unread?' •':''));
 button.innerHTML=`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Z"/><path d="M10 20h4"/></svg><span>${esc(w.inbox)}${unread?' •':''}</span>`;
 if(!dialog)return;dialog.setAttribute('aria-label',w.inbox);
 dialog.innerHTML=`<header class="row"><h2>${w.news}</h2><button data-close aria-label="${w.close}">×</button></header><p>${w.newsNote}</p>${plan&&meaningfulUpdate(plan)?`<h3>${esc(plan.goalTitle)}</h3><small>${esc(plan.country)} · ${new Date(plan.generatedAt).toLocaleDateString()} · ${esc(plan.newsVersion)}</small><div class="news-diff"><section><strong>${w.before}</strong><ol>${plan.baseline.slice(0,3).map(p=>`<li>${esc(label(plan.priorities.find(r=>r.name===p.name)||p))}</li>`).join('')}</ol></section><section><strong>${w.after}</strong><ol>${plan.priorities.slice(0,3).map(p=>`<li>${esc(label(p))}</li>`).join('')}</ol></section></div>${plan.priorities.filter(p=>p.evidence?.length).slice(0,3).map(p=>`<section class="news-evidence-record"><h3>${esc(label(p))}</h3><p>${esc(p.tasks[document.documentElement.lang]||p.tasks.en)}</p>${p.evidence.map(e=>`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)} ↗</a><blockquote>${esc(e.impact.quote)}</blockquote><p>${esc(e.impact.rationale[document.documentElement.lang]||e.impact.rationale.en)}</p><small>${esc(e.source)} · ${esc(e.date.slice(0,10))}</small>`).join('')}</section>`).join('')}<div class="news-update-actions"><button data-decision="${receipt?.status==='applied'?'undone':'applied'}" class="primary" ${busy?'disabled':''}>${receipt?.status==='applied'?w.undo:w.apply}</button><button data-decision="later" ${busy?'disabled':''}>${w.later}</button><button data-decision="dismissed" ${busy?'disabled':''}>${w.dismiss}</button></div><button data-mute ${busy?'disabled':''}>${w.mute}</button>`:`<p>${w.noNews}</p><a href="transition.html">${w.route} ↗</a>`}<p role="status">${esc(localMessage(message,document.documentElement.lang))}</p>`;
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>decide(b.dataset.decision));
 dialog.querySelector('[data-mute]')?.addEventListener('click',async()=>{busy=true;render();try{const r=await fetch('/api/news-plan',{method:'POST',headers:{Authorization:'Bearer '+await client.auth.currentUser.getIdToken(),'Content-Type':'application/json'},body:JSON.stringify({active:false})});if(!r.ok)throw Error();personal={subscribed:false};message='';window.dispatchEvent(new CustomEvent('futurefit-news-receipt'));}catch{message=c().newsError;}finally{busy=false;render();}});
}
async function decide(status){
 if(busy||!personal?.plan)return;busy=true;message='';render();try{receipt=await saveReceipt(client,personal.plan,status,receipt);message=c()[status==='applied'?'applied':status==='undone'?'undone':'saved'];window.dispatchEvent(new CustomEvent('futurefit-news-receipt',{detail:{key:key(),status}}));if(['later','dismissed'].includes(status))dialog.close();}catch{message=c().error;}finally{busy=false;render();}
}
async function open(){openedFrom=document.activeElement;render();if(!dialog.open)dialog.showModal();if(personal?.plan&&!receipt)await decide('viewed');}
async function load(){
 if(disposed||loading||document.hidden)return;loading=true;
 try{const r=await fetch('/api/news-plan',{headers:{Authorization:'Bearer '+await client.auth.currentUser.getIdToken()},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();personal=await r.json();receipt=personal.plan?await readPrivate(client,'news_receipts',updateKey(personal.plan)):null;message='';render();if(mayNotify(personal.plan,personal.subscription,receipt)&&!dialog.open&&!document.querySelector('dialog[open]'))await open();}catch{message=c().newsError;render();}finally{loading=false;}
}
try{
 client=await connect();if(client.user.isAnonymous||!client.user.emailVerified)throw Error('skip');
 const progress=journeyProgress(await client.recent('sessions'),await client.recent('games',50));if(!progress.ready)throw Error('skip');
 button=document.createElement('button');button.type='button';button.className='seeker-inbox-launch';document.querySelector('.unified-inner')?.append(button);
 dialog=document.createElement('dialog');dialog.className='seeker-news-dialog';dialog.setAttribute('aria-label',c().inbox);document.body.append(dialog);dialog.addEventListener('close',()=>openedFrom?.focus());button.onclick=open;
 window.addEventListener('aligna-language',render);document.addEventListener('visibilitychange',load);window.addEventListener('futurefit-news-receipt',()=>{if(!busy)load();});render();await load();timer=setInterval(load,180000);
}catch{}
window.addEventListener('pagehide',()=>{disposed=true;clearInterval(timer);});
