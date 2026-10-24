import {requireAccount} from './account-gate.js';
await requireAccount('seeker');
import {makeItems,nextItem,summarize,mapCareers,areas,reviewDate} from './assessment-core.js';
import {translations,itemText} from './assessment-copy.js';
const root=document.querySelector('#assessment'),test=new URLSearchParams(location.search).has('test');
let lang=localStorage.getItem('aligna-lang')||'zh',screen='intro',items=[],session=null,index=0,choice=null,busy=false,status='loading',failure=false,db,auth,F,user,queue=Promise.resolve();
const tr=()=>translations[lang]||translations.zh;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(id,label,primary=false,disabled=false)=>`<button id="${id}" ${primary?'class="primary"':''} ${disabled?'disabled':''}>${esc(label)}</button>`;
const dateNow=()=>new Date().toISOString();
const localKey=()=>`aligna-assessment-${user.uid}`;
const methods=()=>`<details><summary>${tr().method}</summary><p>${tr().methodText}</p><p><a href="https://ipip.ori.org/MiniIPIPKey.htm" target="_blank" rel="noopener">Mini-IPIP</a> · <a href="https://www.onetcenter.org/IP.html" target="_blank" rel="noopener">O*NET Interest Profiler</a> · <a href="https://www.onetcenter.org/license_tools.html" target="_blank" rel="noopener">O*NET ${lang==='zh'?'使用许可':lang==='ms'?'lesen':'license'}</a></p></details>`;
function render(){
 const t=tr();document.documentElement.lang=lang;
 root.innerHTML=`${test?`<div class="test">${t.test}</div>`:''}<div class="row"><span class="eyebrow">FUTURE FIT / ${lang==='zh'?'职业探索':lang==='ms'?'PENEROKAAN KERJAYA':'CAREER EXPLORATION'}</span><span class="status" role="status">${t[status]||t.ready}</span></div>${failure?`<p class="error">${t.error} ${button('retry',t.retry)}</p>`:''}`;
 if(screen==='intro'){
 root.innerHTML+=`<h1>${t.title}</h1><p>${t.intro}</p><div class="card">${session?`<p class="muted">${t.history} · ${session.responses.length} / 30</p>${button('resume',session.status==='complete'?t.result:t.resume,true)}`:''}<label style="margin:20px 0"><input id="consent" type="checkbox"><span>${t.consent}</span></label>${button('start',session?t.new:t.start,true,true)}<p class="muted">${t.privacy}</p><p class="muted"><a href="library.html">${lang==='zh'?'题库与来源':lang==='en'?'Question library and sources':'Bank soalan dan sumber'}</a> · <a href="research.html">${lang==='zh'?'研究与验证方案（中文）':lang==='en'?'Research plan (Chinese)':'Pelan penyelidikan (bahasa Cina)'}</a></p>${methods()}</div>`;
 document.querySelector('#consent').onchange=e=>document.querySelector('#start').disabled=!e.target.checked||!items.length||busy;
 document.querySelector('#start').onclick=start;
 if(session)document.querySelector('#resume').onclick=()=>{screen=session.status==='complete'?'results':'quiz';index=session.responses.length;choice=null;render();};
 }else if(screen==='quiz'){
 const pick=nextItem(items,session.responses.slice(0,index),session.seed),item=pick.item,interest=item.dimension.startsWith('interest'),opts=interest?t.interestOpts:t.personalityOpts;
 root.innerHTML+=`<div class="card"><div class="row"><span class="muted">${t.progress} ${index} ${t.of} 30</span><span class="tag">${interest?'O*NET':'Mini-IPIP'}</span></div><progress max="30" value="${index}"></progress><p class="muted">${interest?t.interest:t.personality}</p><h2 id="question" tabindex="-1">${esc(itemText(item,lang))}</h2><div class="options" role="group" aria-labelledby="question">${opts.map((v,i)=>`<button class="option" data-value="${i+1}" aria-pressed="${choice===i+1}" ${busy?'disabled':''}><b>${i+1}</b>${esc(v)}</button>`).join('')}</div><div class="actions">${button('back',t.back,false,index===0||busy)}<span class="muted">${index+1} / 30</span>${button('next',index===29?t.finish:t.next,true,choice===null||busy)}</div>${index<session.responses.length?`<p class="muted">${t.edit}</p>`:''}</div>`;
 root.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{choice=Number(b.dataset.value);render();});
 document.querySelector('#back').onclick=()=>{index--;choice=session.responses[index]?.value??null;render();};
 document.querySelector('#next').onclick=()=>answer(pick);
 }else results();
 if(failure)document.querySelector('#retry').onclick=()=>{if(!items.length)init();else save();};
}
async function init(){
 status='loading';failure=false;render();
 try{
 const [A,U,D]=await Promise.all(['app','auth','firestore'].map(k=>import(`https://www.gstatic.com/firebasejs/13.0.0/firebase-${k}.js`)));
 F=D;const appName=test?'aligna-test':'[DEFAULT]';const app=A.getApps().find(a=>a.name===appName)||A.initializeApp({apiKey:'AIzaSyDzKmmTF4zK26QO5gEn2fd-srX4q6SW354',authDomain:'project-d32d7.firebaseapp.com',projectId:'project-d32d7',storageBucket:'project-d32d7.firebasestorage.app',messagingSenderId:'31008626657',appId:'1:31008626657:web:da75c66de5851ca20ba4a0'},appName);
 auth=U.getAuth(app);await U.setPersistence(auth,test?U.browserSessionPersistence:U.browserLocalPersistence);await auth.authStateReady();user=auth.currentUser||(await U.signInAnonymously(auth)).user;db=D.getFirestore(app);
 const banks=await Promise.all(['mini-ipip-en-v1','onet-mini-ip-en-v1'].map(async id=>{const d=await D.getDocFromServer(D.doc(db,'aligna_question_banks',id));if(!d.exists())throw Error('Bank missing');return JSON.parse(d.data().payload);}));
 items=makeItems(...banks);
 const records=await D.getDocsFromServer(D.query(D.collection(db,'aligna_users',user.uid,'sessions'),D.orderBy('updatedAt','desc'),D.limit(1)));
 session=records.empty?null:{...records.docs[0].data(),id:records.docs[0].id};
 let local=null;try{local=JSON.parse(localStorage.getItem(localKey()));}catch{}
 if(local&&(!session||local.updatedAt>session.updatedAt)){nextItem(items,local.responses,local.seed);session=local;status='pending';failure=true;}else status=session?'saved':'ready';
 render();
 }catch(e){console.error('Assessment connection:',e.code||e.message);failure=true;status='pending';render();}
}
function start(){
 const now=dateNow();session={id:crypto.randomUUID(),schemaVersion:1,seed:crypto.getRandomValues(new Uint32Array(1))[0],responses:[],status:'in-progress',createdAt:now,updatedAt:now,completedAt:null,nextReviewAt:null,locale:lang,bankVersions:['mini-ipip-en-v1','onet-mini-ip-en-v1'],consentVersion:'2026-10-pilot-v1',algorithmVersion:'coverage-clarification-v1',isTest:test};
 screen='quiz';index=0;choice=null;save();render();
}
function save(){
 if(!session||!user)return;
 session.updatedAt=dateNow();session.locale=lang;
 const snapshot=structuredClone(session);
 try{localStorage.setItem(localKey(),JSON.stringify(snapshot));}catch{}
 status='saving';failure=false;render();
 const {id,...data}=snapshot;
 const pending=queue.catch(()=>{}).then(()=>F.setDoc(F.doc(db,'aligna_users',user.uid,'sessions',id),data));
 queue=pending;
 let timer=setTimeout(()=>{if(session?.updatedAt===snapshot.updatedAt){failure=true;status='pending';render();}},12000);
 pending.then(()=>{clearTimeout(timer);if(session?.updatedAt===snapshot.updatedAt){status='saved';failure=false;render();}}).catch(e=>{clearTimeout(timer);console.error('Assessment save:',e.code||e.message);if(session?.updatedAt===snapshot.updatedAt){failure=true;status='pending';render();}});
}
function answer(pick){
 if(choice===null||busy)return;
 session.responses=session.responses.slice(0,index);session.responses.push({itemId:pick.item.id,value:choice,language:lang,reason:pick.reason});index++;choice=null;
 if(index===30){session.status='complete';session.completedAt=dateNow();session.nextReviewAt=reviewDate(session.completedAt.slice(0,10));screen='results';}
 save();render();document.querySelector('#question')?.focus();
}
function results(){
 const t=tr(),stats=summarize(items,session.responses),ranked=mapCareers(stats),interest=Object.values(areas),means=interest.map(k=>stats['interest:'+k].mean),neutral=Math.max(...means)-Math.min(...means)<.35,low=Math.max(...means)<3.2;
 const evidence=ids=>`<details><summary>${t.evidence}</summary>${ids.map(id=>{const i=items.find(i=>i.id===id),a=session.responses.find(a=>a.itemId===id);const opts=i.dimension.startsWith('interest')?t.interestOpts:t.personalityOpts;return `<p>${esc(itemText(i,lang))}<br><strong>${esc(opts[a.value-1])}</strong></p>`;}).join('')}</details>`;
 root.innerHTML+=`<h1>${t.resultsTitle}</h1><p>${t.resultsIntro}</p>${neutral||low?`<p class="notice">${neutral?t.neutral:t.low}</p>`:''}<h2>${t.directions}</h2><details><summary>${t.mapping}</summary><p>${t.mappingText}</p></details><div class="grid">${ranked.slice(0,neutral?7:4).map(({career:c,mean})=>{const codes=[...c[1]],ids=codes.flatMap(k=>stats['interest:'+areas[k]].evidence);return `<article class="card"><span class="tag">${codes.map(k=>t.interestNames[Object.keys(areas).indexOf(k)]).join(' · ')}</span><h3 style="margin-top:14px">${c[lang==='zh'?2:lang==='en'?3:4]}</h3><p class="muted">${t.scale} · ${mean.toFixed(1)}</p>${evidence(ids)}<a href="https://www.onetonline.org/link/summary/${c[0]}" target="_blank" rel="noopener">${t.job}</a></article>`;}).join('')}</div><div class="grid" style="margin-top:24px"><section class="card"><h3>${t.interestTitle}</h3>${interest.map((k,i)=>{const s=stats['interest:'+k];return `<div class="row"><span>${t.interestNames[i]}</span><span>${s.mean.toFixed(1)} / 5 · ${s.n} ${t.n}</span></div><div class="bar"><i style="width:${s.mean/5*100}%"></i></div>`;}).join('')}</section><section class="card"><h3>${t.personalityTitle}</h3>${['E','A','C','N','O'].map((k,i)=>{const s=stats['personality:'+k];return `<div class="row"><span>${t.personalityNames[i]}</span><span>${s.mean.toFixed(1)} / 5</span></div><p class="muted" style="margin:3px 0 12px">${s.n} ${s.n===4?t.complete:t.partial}</p>`;}).join('')}</section></div><div class="card"><div class="row"><div><h3>${t.review}</h3><strong>${session.nextReviewAt}</strong></div><span class="muted">${t.date} ${session.completedAt.slice(0,10)}</span></div><p class="muted">${t.reviewText}</p>${methods()}<div class="actions">${button('download',t.download)}${button('new',t.new,true)}</div></div>`;
 const mixed=Object.entries(stats).filter(([k,v])=>v.n>=3&&Math.max(...v.values)-Math.min(...v.values)>=3);
 if(mixed.length){const section=document.createElement('section');section.className='card';section.innerHTML='<h3>'+({zh:'值得再聊的地方',en:'Worth another look',ms:'Perkara untuk diteliti lagi'}[lang])+'</h3><p class="muted">'+({zh:'同一维度中，有些回答差异较大。不同情境、理解方式或当时状态都可能影响回答；这不代表撒谎。可以先看看自己当时想到的是什么情境。',en:'Some answers within a dimension differ. Context, interpretation or how you felt may explain this; it is not evidence of dishonesty. Think about the situations you had in mind.',ms:'Sesetengah jawapan dalam dimensi yang sama berbeza. Konteks, tafsiran atau keadaan ketika menjawab mungkin menjadi sebab; ini bukan bukti ketidakjujuran. Fikirkan situasi yang anda bayangkan.'}[lang])+'</p>'+mixed.map(([k,v])=>evidence(v.evidence)).join('');root.append(section);}
 document.querySelector('#new').onclick=()=>{screen='intro';render();};
 document.querySelector('#download').onclick=()=>{const report={...session,results:stats,careerExploration:ranked,method:t.mappingText,limitations:t.methodText};const u=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='aligna-results-'+session.completedAt.slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
}
window.addEventListener('aligna-language',e=>{lang=e.detail;render();});
window.addEventListener('online',()=>{if(session&&failure)save();});
init();
