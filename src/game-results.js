const words={
 zh:{session:'本次挑战',memory:'记忆挑战结果',switch:'规则切换结果',hit:'位置命中',accuracy:'作答正确率',more:'记录与统计规则',scope:'两项挑战仅记录本次具体任务的表现，不是 IQ、心理诊断或整体工作能力结论，不作为职位录用依据。',private:'记录保存在你的私人账户，招聘方不能直接读取。',preDeclare:'预先声明的排除规则：反应时间小于 150 ms 的过快作答视作提前预判予以排除，不计入中位用时统计；超时作答单独计数。中位数仅在符合预定条件的正确题中计算。设备与浏览器延迟可能影响计时。'},
 en:{session:'SESSION COMPLETE',memory:'Memory results',switch:'Rule-switching results',hit:'Positions recalled',accuracy:'Response accuracy',more:'Calculation & rules',scope:'These challenges record performance in this session only. They are not IQ, a psychological diagnosis, or a conclusion of work ability, and are not hiring criteria.',private:'Saved to your private account. Employers cannot access raw scores.',preDeclare:'Pre-declared exclusion rule: responses under 150 ms are treated as anticipations and excluded from median response time calculations. Timeouts are counted separately. Medians are calculated solely from valid correct trials. Device and browser latency may affect timing.'},
 ms:{session:'SESI SELESAI',memory:'Keputusan ingatan',switch:'Keputusan pertukaran peraturan',hit:'Kedudukan diingati',accuracy:'Ketepatan jawapan',more:'Peraturan pengiraan',scope:'Cabaran ini hanya merekod prestasi sesi tertentu. Bukan IQ, diagnosis psikologi atau kesimpulan kebolehan kerja, dan bukan kriteria pengambilan pekerja.',private:'Disimpan dalam akaun peribadi anda. Majikan tidak boleh mengakses skor mentah.',preDeclare:'Peraturan pengecualian dinyatakan awal: jawapan di bawah 150 ms dianggap jangkaan awal dan dikecualikan daripada pengiraan median masa respons. Kehabisan masa dikira berasingan. Median hanya dikira daripada percubaan betul yang sah.'}
};
const number=n=>n!==null&&n!==undefined&&n!==''&&Number.isFinite(Number(n))?Number(n):null;
export function gameResultCard(mode,result,t,lang,saveState,trialCount){
 const w=words[lang]||words.en,n=number,total=n(result.total)||trialCount||24,rate=mode==='memory'?(n(result.hits)||0)/Math.max(1,n(result.targets)||0):(n(result.correct)||0)/total;
 const percent=Math.round(Math.max(0,Math.min(1,rate))*100);
 const rows=mode==='memory'?[
   [({zh:'完全还原轮次',en:'Rounds fully recalled',ms:'Pusingan diingati sepenuhnya'}[lang]||t[20]),`${n(result.exactRounds)||0} / ${trialCount||6}`],
   [({zh:'位置命中数',en:'Positions recalled',ms:'Kedudukan diingati'}[lang]||t[21]),`${n(result.hits)||0} / ${n(result.targets)||0}`],
   [({zh:'误选位置数',en:'Extra / false selections',ms:'Pilihan tambahan'}[lang]||t[22]),n(result.falseSelections)||0],
   [({zh:'遗漏位置数',en:'Omissions',ms:'Petak tertinggal'}[lang]||t[23]),n(result.omissions)||0]
 ]:[
   [({zh:'答对题目',en:'Correct trials',ms:'Jawapan betul'}[lang]||t[24]),`${n(result.correct)||0} / ${total}`],
   [({zh:'重复规则中位用时',en:'Repeat-rule median',ms:'Median arahan berulang'}[lang]||t[25]),n(result.repeatMedianMs)===null?t[28]:`${n(result.repeatMedianMs)} ms`],
   [({zh:'切换规则中位用时',en:'Switch-rule median',ms:'Median arahan bertukar'}[lang]||t[26]),n(result.switchMedianMs)===null?t[28]:`${n(result.switchMedianMs)} ms`],
   [({zh:'切换耗时差',en:'Switch cost',ms:'Perbezaan masa tukar'}[lang]||t[27]),n(result.switchCostMs)===null?t[28]:`${n(result.switchCostMs)} ms`]
 ];
 if(mode==='switch'){
  if(result.reverseTotal)rows.push([({zh:'反向题正确率',en:'Reverse accuracy',ms:'Ketepatan songsang'}[lang]),`${n(result.reverseCorrect)||0} / ${n(result.reverseTotal)||0}`]);
  rows.push(
    [({zh:'有效题反应中位数',en:'Valid response median',ms:'Median respons sah'}[lang]),n(result.medianMs)===null?t[28]:`${n(result.medianMs)} ms`],
    [({zh:'超时次数',en:'Timed out count',ms:'Bilangan kehabisan masa'}[lang]),n(result.timeouts)||0],
    [({zh:'排除数 (< 150ms)',en:'Excluded trials (< 150ms)',ms:'Dikecualikan (< 150ms)'}[lang]),n(result.anticipations)||0]
  );
 }
 const pending={zh:'尚未保存。点击保存后，记录只存入你的私人账号。',en:'Not saved yet. Save this result to your private account.',ms:'Belum disimpan. Simpan keputusan ini ke akaun peribadi anda.'},saving={zh:'正在保存到你的私人账号…',en:'Saving to your private account…',ms:'Sedang menyimpan ke akaun peribadi anda…'},failed={zh:'还没保存成功，请重试。',en:'This result was not saved. Please retry.',ms:'Keputusan belum disimpan. Cuba lagi.'};
 const saveNote=saveState==='saved'?w.private:(saveState==='saving'?saving:saveState==='error'?failed:pending)[lang]||(saveState==='saving'?saving:saveState==='error'?failed:pending).en;
 const blocks=mode==='switch'&&Array.isArray(result.blocks)?`<div class="result-blocks">${result.blocks.slice(0,3).map(block=>`<div><span>${(n(block.deadlineMs)||0)/1000} s</span><strong>${n(block.correct)||0} / ${n(block.total)||0}</strong><small>${n(block.medianMs)===null?t[28]:`${n(block.medianMs)} ms`}</small></div>`).join('')}</div>`:'';
 return `<section class="card challenge-result"><div class="result-top"><div><h2>${w[mode]}</h2></div><div class="result-ring" style="--result-arc:${percent*3.6}deg"><div><strong>${percent}<small>%</small></strong><span>${mode==='memory'?w.hit:w.accuracy}</span></div></div></div><div class="result-metrics">${rows.map(([label,value],i)=>`<div class="result-metric"><span class="metric-mark">${String(i+1).padStart(2,'0')}</span><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>${blocks}<details class="result-explanation" open><summary>${w.more}</summary><p>${w.preDeclare}</p><p class="muted">${t[38]}</p><small>${result.protocol||'adult-challenge-v3'}</small></details><p class="result-scope">${w.scope}</p><div class="result-save"><button class="primary" id="save" ${saveState==='saved'||saveState==='saving'?'disabled':''}>${t[saveState==='saved'?31:saveState==='saving'?40:saveState==='error'?32:30]} <span>→</span></button><small role="status" data-game-save="${saveState||'unsaved'}">${saveNote}</small></div></section>`;
}
