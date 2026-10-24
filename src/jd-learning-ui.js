import {exposureHTML} from './ai-exposure.js';
import {jdLearningPlan} from './jd-learning-data.js';
import {matchCandidate} from './match-engine.js';
import {tr,esc,lang} from './recruitment-ui.js';
const stores=new WeakMap(),bound=new WeakSet(),loads=new WeakMap();
export function jobLearningView(job,candidate,{savedOnly=false,savedIds=[]}={}){
 const plans=jdLearningPlan(job,candidate,lang(),savedIds).filter(p=>!savedOnly||savedIds.includes(p.id));
 if(!matchCandidate(job,candidate).rows.length)return `<p class="jd-learning-boundary">${tr('Job description 尚未列出有效技能，先向 HR 确认要求。','The Job description has no valid listed skills. Ask HR to clarify requirements first.','Job description belum menyenaraikan kemahiran sah. Minta HR menjelaskan keperluan dahulu.')}</p>`;
 if(savedOnly&&!plans.length)return `<p class="jd-learning-boundary">${tr('这份 Job description 的技能要求已调整，当前没有对应的学习项目；已保存的进度仍会保留。','The Job description skill requirements changed; no current learning item matches. Your saved progress is retained.','Keperluan kemahiran Job description telah berubah; tiada item pembelajaran semasa sepadan. Kemajuan disimpan kekal.')}</p>`;
 if(!plans.length)return `<section class="jd-learning-block"><h3>${tr('技能都有记录，下一步准备作品。','Skills are recorded. Prepare your examples next.','Kemahiran direkodkan. Sediakan contoh seterusnya.')}</h3><p>${tr('用这份 Job description 的任务整理作品与成果；资料覆盖不代表已通过岗位评估。','Prepare work samples for this Job description. Recorded coverage does not mean you have passed a role assessment.','Sediakan sampel kerja untuk Job description ini. Liputan rekod tidak bermakna anda lulus penilaian jawatan.')}</p></section>`;
 const view=(plan,n)=>`<details class="jd-skill-route" ${n===0?'open':''} data-plan-id="${esc(plan.id||'')}"><summary><span><small>${plan.recorded?tr('已记录 · 继续巩固','Recorded · keep practising','Direkodkan · terus berlatih'):plan.kind==='required'?tr('专业技能','Role skill','Kemahiran jawatan'):tr('沟通与协作','Working with others','Kerjasama')}</small><strong>${esc(plan.label)}</strong></span><span class="jd-route-arrow">⌄</span></summary><div class="jd-route-body">${exposureHTML(plan.skill,lang(),{compact:true})}<div><h4>${tr('学什么','Learn','Belajar')}</h4><p>${esc(plan.topics)}</p><a href="${esc(plan.resource.url)}" target="_blank" rel="noopener noreferrer">${esc(plan.resource.title)} ↗</a></div><div><h4>${tr('做一个什么作品','Make a work sample','Hasilkan sampel kerja')}</h4><p>${esc(plan.task)}</p></div><div><h4>${tr('怎样检验进步','Check your progress','Semak kemajuan')}</h4><p>${esc(plan.review)}</p></div><div class="jd-credential"><h4>${plan.credential?plan.credential.kind==='exam'?tr('可考虑的考试','Optional exam','Peperiksaan pilihan'):tr('可考虑的资格 / 课程证书','Optional qualification / course certificate','Kelayakan / sijil kursus pilihan'):tr('要考证吗？','Do I need a certificate?','Perlukah sijil?')}</h4>${plan.credential?`<a href="${esc(plan.credential.url)}" target="_blank" rel="noopener noreferrer">${esc(plan.credential.title)} ↗</a><p>${esc(plan.credentialNote)}</p>`:`<p>${esc(plan.noExam)}</p>`}</div>${plan.id?`<div class="jd-plan-controls"><div class="jd-plan-progress" hidden>${[tr('已学基础','Studied the basics','Asas dipelajari'),tr('已做样本','Made a work sample','Sampel kerja disediakan'),tr('已拿到反馈','Got feedback','Maklum balas diterima')].map((label,i)=>`<label><input type="checkbox" data-jd-step="${i}">${label}</label>`).join('')}</div><button type="button" data-jd-save>${tr('加入学习清单','Add to my learning list','Tambah ke senarai pembelajaran')}</button><span data-jd-status role="status"></span></div>`:''}</div></details>`;
 return `<section class="jd-learning-block"><div class="jd-learning-heading"><h3>${savedOnly?tr('我的学习清单','My learning list','Senarai pembelajaran saya'):tr('这份 Job description，接下来补什么','What to work on for this Job description','Apa perlu dilatih untuk Job description ini')}</h3><span>${plans.length} ${savedOnly?tr('项在学习','being practised','sedang dilatih'):tr('项待补充','to explore','untuk diterokai')}</span></div><p class="jd-learning-boundary">${savedOnly?tr('按这份 Job description 保留的练习项目，学习和复核后记下进度。','Practice items saved for this Job description. Record your progress after learning and review.','Item latihan disimpan untuk Job description ini. Rekod kemajuan selepas belajar dan semakan.'):tr('这些技能还没出现在你的资料中。会的话先补充例子；想学的话，从下面开始。','These skills are not recorded yet. Add an example if you already use them, or start with a route below.','Kemahiran ini belum direkodkan. Tambah contoh jika sudah digunakan, atau mulakan laluan di bawah.')}</p><div class="jd-plan-grid">${plans.slice(0,3).map(view).join('')}</div>${plans.length>3?`<details class="jd-more-plans"><summary>${tr('其余','More','Lagi')} ${plans.length-3} ${tr('项','skills','kemahiran')}</summary><div class="jd-plan-grid">${plans.slice(3).map((p,i)=>view(p,i+3)).join('')}</div></details>`:''}<small class="jd-plan-note">${tr('学习进度只对你可见。完成清单不会自动提高匹配分；新增经历需在申请前核对并主动分享。','Learning progress is private. Checking steps does not raise your match score; review and share new experience when applying.','Kemajuan pembelajaran peribadi. Menanda langkah tidak menaikkan skor; semak dan kongsi pengalaman baharu apabila memohon.')}</small></section>`;
}
export function bindJobLearning(root,api){
 if(!api)return;
 let store=stores.get(api);if(!store){store=new Map();stores.set(api,store);}
 const paint=(route,state)=>{
  if(!state?.steps)return;
  route.querySelector('.jd-plan-progress').hidden=false;
  route.querySelectorAll('[data-jd-step]').forEach(input=>input.checked=state.steps[Number(input.dataset.jdStep)]);
  route.querySelector('[data-jd-save]').textContent=tr('保存进度','Save progress','Simpan kemajuan');
 };
 if(!loads.has(api))loads.set(api,api.recent('plans',200).catch(()=>[]));
 loads.get(api).then(records=>{for(const p of records)if(p.skillId?.startsWith('skill-jd-')&&!store.has(p.skillId))store.set(p.skillId,{steps:[...p.steps]});if(root.isConnected)root.querySelectorAll('[data-plan-id]').forEach(route=>paint(route,store.get(route.dataset.planId)));});
 root.querySelectorAll('[data-plan-id]').forEach(route=>paint(route,store.get(route.dataset.planId)));
 if(bound.has(root))return;bound.add(root);
 root.addEventListener('change',event=>{const input=event.target.closest('[data-jd-step]');if(!input)return;const route=input.closest('[data-plan-id]'),state=store.get(route.dataset.planId);if(state?.steps){state.steps[Number(input.dataset.jdStep)]=input.checked;route.querySelector('[data-jd-status]').textContent=tr('有未保存的修改','Unsaved changes','Perubahan belum disimpan');}});
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-jd-save]');if(!button||!root.contains(button))return;
  const route=button.closest('[data-plan-id]'),id=route.dataset.planId,status=route.querySelector('[data-jd-status]');
  if(!id)return;let state=store.get(id);if(state?.busy)return;
  state=state||{};state.busy=true;store.set(id,state);button.disabled=true;route.querySelectorAll('[data-jd-step]').forEach(input=>input.disabled=true);status.textContent=tr('正在保存…','Saving…','Menyimpan…');
  try{
   if(!state.steps){const ref=api.F.doc(api.db,'aligna_users',api.user.uid,'plans',id),doc=await api.F.getDocFromServer(ref);state.steps=doc.exists()&&Array.isArray(doc.data().steps)?[...doc.data().steps]:[false,false,false];}
   const snapshot=[...state.steps];await api.save('plans',id,{skillId:id,steps:snapshot,version:1,updatedAt:new Date().toISOString()});
   window.dispatchEvent(new CustomEvent('aligna-jd-plan-saved',{detail:{id,steps:snapshot}}));
   if(route.isConnected){paint(route,state);status.textContent=tr('已保存到我的学习清单','Saved to my learning list','Disimpan ke senarai pembelajaran');}
  }catch{if(route.isConnected)status.textContent=tr('还没保存成功，请重试。','Could not save. Please retry.','Gagal disimpan. Cuba lagi.');}
  finally{state.busy=false;if(button.isConnected){button.disabled=false;route.querySelectorAll('[data-jd-step]').forEach(input=>input.disabled=false);}}
 });
}
