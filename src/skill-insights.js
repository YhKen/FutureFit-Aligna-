import {canonical,skillLabel} from './match-engine.js';
import {learningRoute} from './jd-learning-data.js';
import {tailoredPractice} from './career-growth.js';
const topics={
 'Active Listening':['开放式提问、复述确认、澄清需求','Open questions, paraphrasing and clarifying needs','Soalan terbuka, parafrasa dan penjelasan keperluan'],
 Mathematics:['比例与百分比、均值、变化率和公式核对','Ratios, percentages, averages, rates of change and formula checks','Nisbah, peratusan, purata, kadar perubahan dan semakan formula'],
 'Reading Comprehension':['抓住主旨、提取约束条件、区分事实和推论','Main ideas, constraints, facts and inferences','Idea utama, kekangan, fakta dan inferens'],
 Science:['提出假设、设计对照、记录观察和解释局限','Hypotheses, comparisons, observations and limitations','Hipotesis, perbandingan, pemerhatian dan batasan'],
 Speaking:['组织重点、按听众调整表达、确认下一步','Structuring key points, adapting to listeners and confirming actions','Menyusun isi, menyesuaikan penyampaian dan mengesahkan tindakan'],
 Writing:['工作说明、信息结构、简洁表达和校对','Work briefs, information structure, concise writing and editing','Taklimat kerja, struktur maklumat, penulisan ringkas dan penyuntingan'],
 'Active Learning':['发现知识缺口、检索资料、把新知识用在任务里','Learning gaps, finding resources and applying new knowledge','Jurang pengetahuan, mencari bahan dan menggunakan pengetahuan baharu'],
 'Critical Thinking':['论据、假设、反例、来源可靠性和结论边界','Evidence, assumptions, counterexamples, source quality and limits','Bukti, andaian, contoh balas, mutu sumber dan batasan'],
 'Learning Strategies':['回忆练习、间隔复习、理解检查和方法调整','Retrieval practice, spaced review, understanding checks and adjustments','Latihan mengingat, ulang kaji berselang, semakan kefahaman dan pelarasan'],
 Monitoring:['质量标准、检查点、偏差记录和改进复盘','Quality criteria, checkpoints, deviations and improvement reviews','Kriteria kualiti, titik semakan, perbezaan dan ulasan penambahbaikan'],
 'Complex Problem Solving':['问题拆解、原因假设、小规模验证和方案比较','Problem breakdown, causal hypotheses, small tests and option comparison','Pecahan masalah, hipotesis punca, ujian kecil dan perbandingan pilihan'],
 'Judgment and Decision Making':['比较方案、成本收益、不确定性和决策记录','Options, costs and benefits, uncertainty and decision records','Pilihan, kos dan faedah, ketidakpastian dan rekod keputusan'],
 'Systems Analysis':['流程依赖、瓶颈、边界条件和变更影响','Process dependencies, bottlenecks, boundaries and change effects','Kebergantungan proses, kesesakan, sempadan dan kesan perubahan'],
 'Systems Evaluation':['选择指标、建立基线、比较结果和纠正措施','Metrics, baselines, outcome comparisons and corrective actions','Metrik, garis dasar, perbandingan hasil dan tindakan pembetulan'],
 'Time Management':['任务估时、优先级、缓冲时间和实际用时复盘','Task estimates, priorities, buffers and reviewing actual time','Anggaran tugas, keutamaan, masa penampan dan semakan masa sebenar']
};
const groupTopics={
 social:['需求澄清、分工交接、沟通练习和反馈','Clarifying needs, handovers, communication practice and feedback','Penjelasan keperluan, serahan, latihan komunikasi dan maklum balas'],
 technical:['工具原理、操作步骤、安全边界、故障与质量检查','Tool principles, procedures, safety boundaries, faults and quality checks','Prinsip alat, prosedur, had keselamatan, kerosakan dan semakan kualiti'],
 resourceManagement:['资源需求、预算或排期、异常处理和记录核对','Resource needs, budgets or schedules, exceptions and reconciliation','Keperluan sumber, belanjawan atau jadual, pengecualian dan penyelarasan'],
 systems:['系统边界、依赖关系、性能指标和变更复核','System boundaries, dependencies, performance measures and change reviews','Sempadan sistem, kebergantungan, ukuran prestasi dan semakan perubahan']
};

// A source inventory, not a calibrated ability model. Never turn missing answers
// or game performance into an inferred professional-skill score.
export function skillInsights(evidence,job,lang='en'){
 const byName=new Map(evidence.rows.map(r=>[canonical(r.i.name),{...r,cv:false}]));
 for(const name of evidence.confirmed){const key=canonical(name),existing=byName.get(key);if(existing)existing.cv=true;else byName.set(key,{i:{name,id:null,label:{[lang]:skillLabel(name,lang)}},a:null,cv:true});}
 return [...byName.values()].map(r=>{
  const importance=Number(job?.skills?.[r.i.name]?.IM)||null;
  const rating=r.a&&Number.isInteger(r.a.value)&&r.a.value>=1&&r.a.value<=5?r.a.value:null;
  const status=rating!==null?(rating<4?'practice':'recorded'):r.cv?'confirm':'unknown';
  const route=learningRoute(r.i.name,{jobTitle:job?.title||'',skills:r.i.name},lang);
  const topic=topics[r.i.name]||(!route.specific&&groupTopics[r.i.dimension]);
  if(topic)route.topics=topic[lang==='zh'?0:lang==='ms'?2:1];
  // Bank skills already have a subject-specific exercise even when there is no
  // curated course route. CV-only skills use the curated applied-skill route.
  const task=r.i.id?tailoredPractice(r.i,r.a,job,lang):route.task;
  const review=r.i.id?({zh:'保留作品和操作步骤；请熟悉这项工作的同伴，按准确、完整和能否实际使用逐项反馈，修改后再对照一次。',en:'Keep your work and steps. Ask someone familiar with the task to check accuracy, completeness and usability; revise and compare both versions.',ms:'Simpan hasil dan langkah kerja. Minta rakan yang memahami tugas menyemak ketepatan, kelengkapan dan kegunaan; baiki dan bandingkan kedua-dua versi.'}[lang]||route.review):route.review;
  return {...r,name:r.i.name,label:skillLabel(r.i.name,lang),rating,importance,status,route:{...route,review},task,
   planId:r.i.id?r.i.id+'--'+job.id.replace(/[^a-z0-9]/gi,'_'):'skill-planet-'+encodeURIComponent(canonical(r.i.name))+'--'+job.id.replace(/[^a-z0-9]/gi,'_')};
 });
}
export function planetSelection(rows){
 // Keep the person's own skills visible, then add important unassessed skills.
 const recorded=rows.filter(r=>r.cv||r.a),gaps=rows.filter(r=>!r.cv&&!r.a&&r.importance>=2.5).sort((a,b)=>b.importance-a.importance);
 return [...recorded,...gaps];
}
