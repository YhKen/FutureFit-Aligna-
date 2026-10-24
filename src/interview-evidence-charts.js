import {interviewStatusLabel} from './interview-record-ui.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function interviewSkillEvidenceHTML(record,skillId,lang='en',shared=false){
 const tr=(a,b,c)=>({zh:a,en:b,ms:c}[lang]||b),v=record?.items?.find(r=>r.skillId===skillId);if(!v)return '';
 const feedback=shared?v.feedback:v.observation,quote=shared?'':v.quote;
 return `<section class="jd-interview-evidence"><h5>${shared?tr('HR 已分享的面试反馈','Interview feedback shared by HR','Maklum balas temu duga dikongsi HR'):tr('本账号的面试记录','Your hiring account’s interview record','Rekod temu duga akaun anda')}</h5><span class="pill">${esc(interviewStatusLabel(v.status,tr))}</span><p>${esc(record.interviewAt||'—')} · ${esc(record.interviewTimeZone||'—')}</p>${quote?`<blockquote>${esc(quote)}</blockquote>`:''}${feedback?`<p>${esc(feedback)}</p>`:''}<small>${tr('工具与条件','Tools & conditions','Alat & syarat')}: ${esc(shared?tr('未在这份反馈中分享','Not shared in this feedback','Tidak dikongsi dalam maklum balas ini'):record.toolCondition||'—')}</small><small>${tr('标准版本','Rubric version','Versi rubrik')}: ${esc(record.rubricVersion||'—')}</small><small>${tr('面试记录不改写申请时的技能覆盖分；不代表独立能力认证。','Interview notes do not change the application’s skill coverage; they are not independent certification.','Nota temu duga tidak mengubah liputan kemahiran permohonan; ini bukan pengesahan bebas.')}</small></section>`;
}
export function updateInterviewEvidenceCharts(scope,record,lang='en',shared=false){
 const tr=(a,b,c)=>({zh:a,en:b,ms:c}[lang]||b),items=new Map((record?.items||[]).map(r=>[r.skillId,r]));
 scope.querySelectorAll('[data-jd-flow-panel]').forEach(panel=>{panel.querySelector('.jd-interview-evidence')?.remove();const html=interviewSkillEvidenceHTML(record,panel.dataset.skillId,lang,shared);if(html)panel.insertAdjacentHTML('beforeend',html);});
 scope.querySelectorAll('.h02-visuals').forEach(chart=>{const cells=[...chart.querySelectorAll('[data-interview-skill]')],sources=new Set((chart.dataset.selfSources||'').split('|').filter(Boolean));let dates=0,conditions=0,basis=0;
  for(const cell of cells){const v=items.get(cell.dataset.interviewSkill),observed=v&&['partial','sufficient'].includes(v.status)&&(shared?v.feedback?.trim():v.quote?.trim());cell.textContent=v?interviewStatusLabel(v.status,tr):tr('尚未记录','Not recorded yet','Belum direkodkan');if(observed){sources.add(v.skillId);if(record.interviewAt)dates++;if(!shared&&record.toolCondition)conditions++;basis++;}}
  const values=[sources.size,dates,conditions,basis],denominator=cells.length*4,percent=denominator?Math.round(values.reduce((a,b)=>a+b,0)/denominator*100):null;
  chart.querySelectorAll('[data-completeness-value]').forEach(el=>el.textContent=percent===null?'—':percent+'%');chart.querySelector('.h02-ring-gauge')?.style.setProperty('--h02-complete',(percent||0)+'%');chart.querySelectorAll('[data-completeness-count]').forEach((el,i)=>el.textContent=values[i]+'/'+cells.length);
 });
}
