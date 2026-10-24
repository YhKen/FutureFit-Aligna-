export const CAREER_PAGE_SIZE=5;
export const hasSkillReference=job=>Object.values(job?.skills||{}).some(skill=>Number(skill?.IM)>=2.5);
const searchAliases=[[/会计|记账|perakaunan|akaun/gi,'account'],[/教育|教学|pendidikan|mengajar/gi,'teach'],[/医疗|护理|kesihatan|penjagaan/gi,'nurs'],[/销售|jualan/gi,'sales'],[/设计|reka bentuk/gi,'design'],[/工程|kejuruteraan/gi,'engineer'],[/财务|金融|kewangan/gi,'financ'],[/人力|招聘|sumber manusia/gi,'human resources'],[/物流|logistik/gi,'logistic'],[/餐饮|厨师|tukang masak/gi,'cook'],[/酒店|hospitaliti/gi,'hotel'],[/数据|data/gi,'data']];
export function careerPage(ranked,query='',page=0){
 const original=String(query||'').trim().toLowerCase(),expanded=searchAliases.reduce((s,[re,to])=>s.replace(re,to),original),terms=expanded.split(/\s+/).filter(Boolean);
 const filtered=original?ranked.filter(r=>{const hay=[r.job.title,r.job.id].join(' ').toLowerCase();return hay.includes(original)||terms.every(term=>hay.includes(term));}):ranked.filter(r=>hasSkillReference(r.job));
 const pages=Math.max(1,Math.ceil(filtered.length/CAREER_PAGE_SIZE)),index=Math.min(Math.max(0,Number.isInteger(page)?page:0),pages-1),start=index*CAREER_PAGE_SIZE;
 return {rows:filtered.slice(start,start+CAREER_PAGE_SIZE),total:filtered.length,index,pages,start,end:Math.min(start+CAREER_PAGE_SIZE,filtered.length)};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function interestChart(stats,keys,names,lang='en'){
 const tr=(zh,en,ms)=>({zh,en,ms}[lang]||en);
 return `<section class="interest-chart"><div><h2>${tr('你的兴趣线索','Your interest signals','Petunjuk minat anda')}</h2><span>${tr('回答均值 · 1–5','Answer averages · 1–5','Purata jawapan · 1–5')}</span></div><div class="interest-chart-grid">${keys.map((key,i)=>{const value=stats['interest:'+key]?.mean;return `<div class="interest-chart-row"><span>${esc(names[i])}</span><div class="interest-track"><i style="width:${value?Math.max(0,Math.min(100,(value-1)/4*100)):0}%"></i></div><b>${value?.toFixed(1)||'—'}</b></div>`;}).join('')}</div></section>`;
}
