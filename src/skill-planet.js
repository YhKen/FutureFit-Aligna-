import {loadSettings,storeSettings} from './seeker-records.js';
import {integrateEvidence} from './integrated-evidence.js';
import {sectorFor,tailoredPractice,tailoredResources,normalizeNews} from './career-growth.js';
import {profileSkills} from './profile-skills.js';
import {connect} from './cloud.js';
import {skillInsights} from './skill-insights.js';
import {skillFlowHTML,bindSkillFlow} from './skill-flow.js';
import {careerOverviewHTML} from './career-overview.js';
import {mountSkillDetail,insightStatus} from './planet-detail.js';
const groups=['essential','social','technical','complexProblemSolving','resourceManagement','systems'];
const copy={zh:{title:'我的技能与职业方向',open:'点开，看看下一步',groups:['基础','协作','技术','解题','资源','系统'],tabs:['我的记录','职业对照','下一步与动态'],close:'关闭',source:'经历 + 问卷 + 两个挑战',cv:'档案技能',questions:'问卷回答',memory:'位置回忆',switch:'规则切换',school:'段教育',work:'段经历',notYet:'待确认',fromCV:'档案记录',rating:'自评',choose:'想了解哪个职业？',known:'项相关技能有记录',gap:'可以先练这几项',learn:'加入学习路线',news:'这个行业最近在聊什么',refresh:'更新动态',loading:'正在读取…',error:'暂时连不上新闻，可继续看学习路线。',noNews:'近期没有可显示的动态。',note:'新闻是探索线索，是否调整目标由你决定。',pace:'每次先安排',minute:'分钟练习',paceNote:'根据这次游戏的准确率与超时情况安排，可在学习时自行调整；不作为职业能力评分。',evidenceNote:'职业顺序来自问卷兴趣与技能自评。档案用于确认技能、调整练习优先级；游戏用于安排练习节奏。',noScore:'未测到的技能保留为待确认。',records:'项技能有记录',goalSaved:'已同步到你的学习路线。',apply:'设为当前目标',method:'查看处理依据'},en:{title:'My skills & career directions',open:'Open your next steps',groups:['Foundations','Together','Technical','Problems','Resources','Systems'],tabs:['My evidence','Compare a role','Next steps & news'],close:'Close',source:'Experience + questions + two challenges',cv:'Profile skills',questions:'Answers',memory:'Positions recalled',switch:'Rule switching',school:'education entries',work:'experience entries',notYet:'Not assessed',fromCV:'Profile record',rating:'Self-report',choose:'Which role are you exploring?',known:'relevant skills recorded',gap:'Start with these skills',learn:'Build this learning plan',news:'What this industry is talking about',refresh:'Refresh updates',loading:'Loading…',error:'News is unavailable. Your learning plan still works.',noNews:'No recent updates to show.',note:'News offers leads. You decide whether to adjust your goal.',pace:'Start with',minute:'minutes per practice',paceNote:'Based on accuracy and timeouts in this session. Adjust as needed; this is not a career-ability score.',evidenceNote:'Career order uses questionnaire interests and skill ratings. Your profile guides skill follow-ups and practice priorities; games guide practice pacing.',noScore:'Unasked skills stay unassessed.',records:'skills recorded',goalSaved:'Your learning target is updated.',apply:'Use this target',method:'How the evidence is used'},ms:{title:'Kemahiran & arah kerjaya saya',open:'Buka langkah seterusnya',groups:['Asas','Kerjasama','Teknikal','Masalah','Sumber','Sistem'],tabs:['Rekod saya','Banding kerjaya','Langkah & berita'],close:'Tutup',source:'Pengalaman + soalan + dua cabaran',cv:'Kemahiran profil',questions:'Jawapan',memory:'Kedudukan diingati',switch:'Pertukaran arahan',school:'rekod pendidikan',work:'rekod pengalaman',notYet:'Belum dinilai',fromCV:'Rekod profil',rating:'Laporan kendiri',choose:'Kerjaya mana ingin diterokai?',known:'kemahiran berkaitan direkod',gap:'Mulakan dengan kemahiran ini',learn:'Bina pelan pembelajaran',news:'Perkembangan industri ini',refresh:'Muat semula',loading:'Memuatkan…',error:'Berita tidak tersedia. Pelan pembelajaran masih boleh digunakan.',noNews:'Tiada berita terkini.',note:'Berita memberi petunjuk. Anda tentukan sama ada mahu mengubah sasaran.',pace:'Mulakan dengan',minute:'minit setiap latihan',paceNote:'Berdasarkan ketepatan dan kehabisan masa sesi ini. Boleh diubah; bukan skor kebolehan kerjaya.',evidenceNote:'Susunan kerjaya menggunakan minat dan laporan kemahiran. Profil memandu soalan dan keutamaan latihan; permainan memandu rentak latihan.',noScore:'Kemahiran yang belum ditanya kekal belum dinilai.',records:'kemahiran direkod',goalSaved:'Sasaran pembelajaran dikemas kini.',apply:'Guna sasaran ini',method:'Cara bukti digunakan'}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function skillPlanet(container,items,session,jobs,games,lang='zh',uid=''){
 const c=copy[lang]||copy.en,e=integrateEvidence(items,session,jobs,games),key='aligna-target-'+uid;
 let tab=0,target=localStorage.getItem(key)||e.careerOptions.find(r=>e.forJob(r.job).hasSkillData)?.job.id||jobs[0].id,ticket=0,selected=null,detailCleanup=()=>{};
 e.sessionDate=session.completedAt||session.updatedAt;
 e.sessionId=session.id||'';
 const all=new Set(skillInsights(e,jobs.find(j=>j.id===target)||jobs[0],lang).filter(r=>r.cv||r.a).map(r=>r.name));
 const label=name=>items.find(i=>i.name===name)?.label?.[lang]||profileSkills.find(i=>i.name===name)?.label?.[lang]||name;
 const extraSkills=e.confirmed.filter(name=>!e.rows.some(row=>row.i.name===name));
 const tr=(zh,en,ms)=>({zh,en,ms}[lang]||en);
 container.className='skill-planet skill-evidence-workspace';
 container.innerHTML=`<div class="flow-workspace-header"><div><small>FUTURE FIT / ${tr('技能与证据','SKILLS & EVIDENCE','KEMAHIRAN & BUKTI')}</small><h2>${c.title}</h2></div><button type="button" data-full-evidence>${tr('展开技能关系图','Explore the skill connections','Lihat hubungan kemahiran')} ↗</button></div><div class="flow-workspace-body"></div><div class="flow-workspace-footer"><span>${e.answers.length} ${tr('个回答','answers','jawapan')} · ${all.size} ${c.records}</span><a href="growth.html">${tr('我的学习路线','My learning plan','Pelan pembelajaran')} ↗</a><a href="jobs.html">${tr('对照职位 Job description','Compare job descriptions','Banding huraian jawatan')} ↗</a></div><dialog class="planet-dialog" aria-label="${c.title}"><header><div><small>FUTURE FIT / ${c.source}</small><h2>${c.title}</h2></div><button data-planet-close aria-label="${c.close}">×</button></header><div class="planet-tabs" role="tablist">${c.tabs.map((name,i)=>`<button role="tab" data-planet-tab="${i}" aria-selected="${i===0}">${name}</button>`).join('')}</div><div class="planet-content"></div></dialog>`;
 const dialog=container.querySelector('dialog'),content=dialog.querySelector('.planet-content');
 const job=()=>jobs.find(j=>j.id===target)||jobs[0];
 const insights=()=>skillInsights(e,job(),lang);
 const skillButton=name=>`<button type="button" data-insight-skill="${esc(name)}">${esc(label(name))} ↗</button>`;
 function openComparison(){selected=null;tab=1;render();if(!dialog.open)dialog.showModal();}
 function showGames(){const first=insights().find(r=>r.cv||r.a);if(!first)return open();openSkill(first.name);const panel=content.querySelector('.insight-games');if(panel){panel.open=true;panel.scrollIntoView({block:'center',behavior:'instant'});}}
 function bindFlow(root){
  root.querySelectorAll('.evidence-flow-scroll').forEach(scroll=>{const text=tr('左右滑动，查看完整链路','Swipe sideways to see the full path','Leret ke sisi untuk lihat laluan penuh');scroll.tabIndex=0;scroll.setAttribute('aria-label',text);const hint=document.createElement('p');hint.className='flow-mobile-hint';hint.textContent='↔ '+text;scroll.before(hint);});
  bindSkillFlow(root,{onSkill:openSkill,onSource:source=>{const row=insights().find(r=>source==='profile'?r.cv:r.a);if(row)openSkill(row.name);else open();},onTarget:openComparison,onGames:showGames});
 }
 function updateMap(){const mount=container.querySelector('.flow-workspace-body');mount.innerHTML=careerOverviewHTML(insights(),e.careerOptions,e,lang,target);bindFlow(mount);mount.querySelectorAll('[data-recommended-role]').forEach(button=>button.onclick=()=>{target=button.dataset.recommendedRole;updateMap();openComparison();});}

 const noSkillData={zh:'这个职业暂缺技能资料，请换个职业对照，或参考具体职位 Job description。',en:'Skill data is unavailable for this role. Compare another role or a specific job description.',ms:'Data kemahiran kerjaya ini belum tersedia. Bandingkan kerjaya lain atau huraian kerja khusus.'}[lang];
 function rolePicker(){return `<label class="planet-role">${c.choose}<input list="planet-roles" value="${esc(job().title)}" data-planet-role><datalist id="planet-roles">${jobs.map(j=>`<option value="${esc(j.title)}">${esc(j.id)}</option>`).join('')}</datalist></label><button class="planet-target" data-use-target>${c.apply} ↗</button><p class="planet-target-status" role="status"></p>`;}
 function render(group=null){
  detailCleanup();detailCleanup=()=>{};
  ticket++;
  dialog.querySelectorAll('[data-planet-tab]').forEach(b=>b.setAttribute('aria-selected',String(Number(b.dataset.planetTab)===tab)));
  if(selected){
   const rows=insights(),row=rows.find(r=>r.name===selected);
   if(row){detailCleanup=mountSkillDetail(content,{row,evidence:e,job:job(),rows,lang,uid,onBack:()=>{selected=null;tab=0;render();},onSkill:openSkill,onCompare:()=>{selected=null;tab=1;render();}});return;}
   selected=null;
  }
  if(tab===0){
   const rows=group===null?e.rows:group===6?extraSkills.map(name=>({i:{name,label:{[lang]:label(name)}},a:null,cv:true})):e.rows.filter(r=>r.i.dimension===groups[group]);
   const recall=e.recall===null?'—':Math.round(e.recall*100)+'%',accuracy=e.accuracy===null?'—':Math.round(e.accuracy*100)+'%';
   content.innerHTML=`<div class="evidence-summary">${[[e.confirmed.length,c.cv],[e.answers.length,c.questions],[recall,c.memory],[accuracy,c.switch]].map(([v,l])=>`<div><strong>${v}</strong><span>${l}</span></div>`).join('')}</div><p class="planet-meta">${e.education.length} ${c.school} · ${e.experience.length} ${c.work}</p><div class="planet-skill-chips">${e.confirmed.map(skillButton).join('')}</div><details class="flow-more-records"><summary>${tr('查看全部技能记录','All skill records','Semua rekod kemahiran')}</summary><div class="planet-skill-table">${rows.map(r=>`<div>${skillButton(r.i.name)}<span>${r.cv?c.fromCV:'—'}</span><b>${r.a?c.rating+' '+r.a.value+'/5':c.notYet}</b></div>`).join('')}</div></details><p class="planet-footnote">${c.evidenceNote}</p>`;
  }else if(tab===1){
   const compared=e.forJob(job());
   content.innerHTML=rolePicker()+`<div class="comparison-heading"><h3>${esc(job().title)}</h3>${compared.hasSkillData?`<span>${compared.recorded} / ${compared.required.length} ${c.known}</span>`:''}</div>${compared.hasSkillData?`<div class="planet-skill-table">${compared.required.map(r=>`<div>${skillButton(r.i.name)}<span>${r.cv?c.fromCV:'—'}</span><b>${r.a?r.a.value+' / 5':c.notYet}</b></div>`).join('')}</div>`:`<p class="planet-footnote" role="status">${noSkillData}</p>`}<p class="planet-footnote">${c.noScore} ${c.evidenceNote}</p>`;
  }else{
   const compared=e.forJob(job()),gaps=compared.gaps;
   content.innerHTML=rolePicker()+`<div class="planet-practice-pace"><strong>${c.pace} ${e.practiceMinutes} ${c.minute}</strong><small>${c.paceNote}</small></div><h3>${c.gap}</h3>${!compared.hasSkillData?`<p class="planet-footnote" role="status">${noSkillData}</p>`:!gaps.length?`<p class="planet-footnote">${c.noScore}</p>`:``}<div class="planet-plan-cards">${gaps.map(g=>`<article><span>${g.a?c.rating+' '+g.a.value+'/5':g.cv?c.fromCV:c.notYet}</span><h4>${esc(g.i.label[lang])}</h4><p>${esc(tailoredPractice(g.i,g.a,job(),lang))}</p><a href="growth.html?target=${encodeURIComponent(target)}&skill=${encodeURIComponent(g.i.id)}">${c.learn} ↗</a>${tailoredResources(g.i,g.a,job()).slice(0,1).map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a>`).join('')}</article>`).join('')}</div><div class="planet-news-heading"><h3>${c.news}</h3><button data-planet-news>${c.refresh}</button></div><p class="planet-footnote">${c.note}</p><div class="planet-news" role="status"></div>`;
   content.querySelector('[data-planet-news]').onclick=loadNews;loadNews();
  }
  if(tab===0){content.insertAdjacentHTML('afterbegin',skillFlowHTML(insights(),job(),e,lang,6));bindFlow(content);}
  content.insertAdjacentHTML('beforeend',`<a class="planet-method" href="matching-method.html">${c.method} ↗</a>`);
  content.querySelectorAll('[data-insight-skill]').forEach(b=>b.onclick=()=>openSkill(b.dataset.insightSkill));
  content.querySelectorAll('.planet-plan-cards article').forEach((card,i)=>{const gap=e.forJob(job()).gaps[i];if(gap)card.insertAdjacentHTML('afterbegin',skillButton(gap.i.name));});
  content.querySelectorAll('.planet-plan-cards [data-insight-skill]').forEach(b=>b.onclick=()=>openSkill(b.dataset.insightSkill));
  const role=content.querySelector('[data-planet-role]');
  const applyRole=async()=>{const chosen=jobs.find(j=>j.title.toLowerCase()===role.value.trim().toLowerCase()||j.id===role.value.trim());if(!chosen){content.querySelector('.planet-target-status').textContent=({zh:'请选择列表里的职业。',en:'Choose a role from the list.',ms:'Pilih kerjaya dalam senarai.'}[lang]);return false;}try{const client=await connect();await storeSettings(client,{...await loadSettings(client),goalId:chosen.id});target=chosen.id;updateMap();render();content.querySelector('.planet-target-status').textContent=c.goalSaved;return true;}catch{content.querySelector('.planet-target-status').textContent=({zh:'目标还没保存成功，请重试。',en:'Target not saved. Please retry.',ms:'Sasaran belum disimpan. Cuba lagi.'}[lang]);return false;}};
  if(role)role.onchange=applyRole;
  const use=content.querySelector('[data-use-target]');if(use)use.onclick=applyRole;
 }
 async function loadNews(){
  const box=content.querySelector('.planet-news'),stamp=++ticket;if(!box)return;box.textContent=c.loading;
  try{
   const response=await fetch('/api/trends?sector='+encodeURIComponent(sectorFor(job())));if(!response.ok)throw Error();const data=await response.json();if(stamp!==ticket||!container.isConnected)return;
   const articles=normalizeNews(data.articles||[]),gaps=e.forJob(job()).gaps;
   box.innerHTML=articles.length?articles.map(a=>`<article><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)} ↗</a><small>${esc(a.source)} · ${esc(a.date?.slice(0,10))}</small><div class="news-plan-controls"><select aria-label="${c.gap}">${gaps.map(g=>`<option value="${esc(g.i.id)}">${esc(g.i.label[lang])}</option>`).join('')}</select><button class="news-to-plan" type="button">${c.learn} ＋</button><span role="status"></span></div></article>`).join(''):c.noNews;
   box.querySelectorAll('.news-to-plan').forEach(button=>button.onclick=async()=>{
    const controls=button.parentElement,skillId=controls.querySelector('select').value,targetId=target;
    if(!gaps.some(g=>g.i.id===skillId))return;
    button.disabled=true;
    try{
     const client=await connect();if(client.user.uid!==uid)throw Error('account-changed');
     const id=skillId+'--'+targetId.replace(/[^a-z0-9]/gi,'_'),ref=client.F.doc(client.db,'aligna_users',uid,'plans',id),existing=await client.F.getDocFromServer(ref);
     const steps=existing.exists()?existing.data().steps:[false,false,false];
     await client.save('plans',id,{skillId:id,steps,version:1,updatedAt:new Date().toISOString()});
     controls.querySelector('[role=status]').textContent=({zh:'已加入',en:'Added',ms:'Ditambah'}[lang]);
     const link=document.createElement('a');link.className='news-plan-open';link.href='growth.html?target='+encodeURIComponent(targetId)+'&skill='+encodeURIComponent(skillId);link.textContent=({zh:'打开路线 ↗',en:'Open plan ↗',ms:'Buka pelan ↗'}[lang]);button.replaceWith(link);
    }catch{controls.querySelector('[role=status]').textContent=({zh:'还没保存成功，请重试。',en:'Could not save. Retry.',ms:'Gagal disimpan. Cuba lagi.'}[lang]);button.disabled=false;}
   });
  }catch{if(stamp===ticket)box.textContent=c.error;}
 }
 const open=(group=null)=>{selected=null;tab=0;render(group);if(!dialog.open)dialog.showModal();};
 function openSkill(name){selected=name;tab=0;render();if(!dialog.open)dialog.showModal();content.scrollTop=0;dialog.scrollTop=0;}
 container.querySelector('[data-full-evidence]').onclick=()=>open();
 dialog.querySelector('[data-planet-close]').onclick=()=>dialog.close();
 dialog.querySelectorAll('[data-planet-tab]').forEach(button=>button.onclick=()=>{selected=null;tab=Number(button.dataset.planetTab);render();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 updateMap();
 return()=>{ticket++;detailCleanup();if(dialog.open)dialog.close();};
}
