(()=>{
 const page=document.body.dataset.page;
 if(page!=='employer')return;
 const tr=window.alignaText;
 const translations={
 'EMPLOYER WORKSPACE / 企业工作台':'招聘需求',
 '创建职位需求':'填写招聘需求',
 '让合适的人，遇见合适的机会。完善岗位信息，明确技能与成长方向。':'填写工作内容、技能要求和工作安排。草稿会自动保存。',
 '本地体验版 · 职位信息仅保存在当前浏览器中，不会发布或发送给求职者。':'填写时保留本机备份。云端草稿仅自己可见，点击发布后求职者才能看到。',
 '填入示例职位':'填入示例',
 '导出职位 JSON':'下载职位资料',
 '支持保存后继续编辑':'下载为 JSON 文件',
 'Role details':'职位信息','Start with the essentials of this position.':'职位、地点和薪资，是大家最先想了解的。',
 'Job title':'职位名称','Salary':'每月薪资','Job description':'主要做什么','Job field':'所属领域','Location':'工作地点',
 'Use the title candidates will see in the listing.':'用大家熟悉的名称，方便求职者找到。','Enter the monthly salary budget.':'填写每月预算，单位为马来西亚令吉（RM）。',
 'Candidate requirements':'岗位要求','Describe the skills and experience that matter most.':'先写真正需要的技能，不必面面俱到。',
 'Skills':'专业技能','Soft skills':'沟通与协作','Job requirements':'经验与其他要求','Future required skills':'未来需要的技能',
 'Separate multiple skills with commas.':'比如 SQL、Excel；多项之间用逗号隔开。','List behaviours that support success in the role.':'比如能清楚表达想法、愿意和团队讨论。','Add one requirement per line for easier reading.':'一行写一项，读起来更清楚。','Mention skills that may become important for this role.':'填写这个岗位未来可能需要的技能。',
 'Work arrangement':'工作安排','Set expectations for the working schedule.':'把人数、时间和用工方式说明白。',
 'Employment type':'用工方式','Full-time':'全职','Part-time':'兼职','Regular working hours':'固定工作安排','Flexible working hours':'部分时段工作',
 'Number of employees':'计划招聘人数','Time':'工作时间','Include the expected working days or hours.':'比如周一到周五，上午 9 点到下午 6 点。',
 'Required fields':'这些项目需要填写','Save job requirement':'保存职位资料',
 'Job requirement saved':'职位资料已保存。',
 'Saved in this browser. No job has been published.':'内容保存在当前浏览器，职位还没有发布。'
 };
 const english={
 'EMPLOYER WORKSPACE / 企业工作台':'Hiring',
 '创建职位需求':'Create a job brief',
 '让合适的人，遇见合适的机会。完善岗位信息，明确技能与成长方向。':'Describe the work, requirements and schedule. Your draft is saved automatically.',
 '本地体验版 · 职位信息仅保存在当前浏览器中，不会发布或发送给求职者。':'A local backup is kept while editing. Cloud drafts are private; Publish makes the role visible to job seekers.',
 '填入示例职位':'Use a sample','导出职位 JSON':'Download job details','支持保存后继续编辑':'Downloads a JSON file',
 'Job requirement saved':'Job details saved.','Saved in this browser. No job has been published.':'Saved in this browser. The role has not been published.',
 'Future required skills':'Future skill requirements','Time':'Working hours','Number of employees':'Number of openings',
 'Save job requirement':'Save job details',
 'Start with the essentials of this position.':'Add the title, location and monthly pay.',
 'Describe the skills and experience that matter most.':'List the skills someone needs to do this job.',
 'Set expectations for the working schedule.':'Add the number of openings and working hours.',
 'Use the title candidates will see in the listing.':'Use a job title applicants will recognise.',
 'List behaviours that support success in the role.':'For example, clear communication or working well in a team.',
 'Mention skills that may become important for this role.':'Include skills this role may require in the future.',
 'Include the expected working days or hours.':'For example, Monday to Friday, 9 am to 6 pm.'
 };
 const malay={'EMPLOYER WORKSPACE / 企业工作台':'Pengambilan pekerja','创建职位需求':'Isi keperluan jawatan','让合适的人，遇见合适的机会。完善岗位信息，明确技能与成长方向。':'Nyatakan tugas, keperluan dan jadual kerja. Draf disimpan secara automatik.','本地体验版 · 职位信息仅保存在当前浏览器中，不会发布或发送给求职者。':'Salinan setempat disimpan semasa menyunting. Draf awan peribadi; Terbitkan memaparkan jawatan kepada pencari kerja.','填入示例职位':'Guna contoh','导出职位 JSON':'Muat turun maklumat','支持保存后继续编辑':'Fail JSON','Role details':'Maklumat jawatan','Start with the essentials of this position.':'Mulakan dengan maklumat asas jawatan.','Job title':'Nama jawatan','Salary':'Gaji bulanan','Job description':'Tugas utama','Job field':'Bidang','Location':'Lokasi','Use the title candidates will see in the listing.':'Gunakan nama jawatan yang mudah dikenali.','Enter the monthly salary budget.':'Masukkan bajet gaji bulanan dalam RM.','Candidate requirements':'Keperluan calon','Describe the skills and experience that matter most.':'Nyatakan kemahiran dan pengalaman yang diperlukan.','Skills':'Kemahiran teknikal','Soft skills':'Komunikasi dan kerjasama','Job requirements':'Pengalaman dan keperluan lain','Future required skills':'Kemahiran diperlukan pada masa hadapan','Separate multiple skills with commas.':'Pisahkan kemahiran dengan koma.','List behaviours that support success in the role.':'Contohnya komunikasi jelas dan kerjasama.','Add one requirement per line for easier reading.':'Tulis satu keperluan pada setiap baris.','Mention skills that may become important for this role.':'Nyatakan kemahiran yang mungkin diperlukan pada masa hadapan.','Work arrangement':'Aturan kerja','Set expectations for the working schedule.':'Nyatakan bilangan pekerja, masa dan jenis pekerjaan.','Employment type':'Jenis pekerjaan','Full-time':'Sepenuh masa','Part-time':'Separuh masa','Regular working hours':'Jadual tetap','Flexible working hours':'Sebahagian waktu kerja','Number of employees':'Bilangan kekosongan','Time':'Waktu kerja','Include the expected working days or hours.':'Nyatakan hari dan waktu bekerja.','Required fields':'Medan wajib','Save job requirement':'Simpan maklumat jawatan','Job requirement saved':'Maklumat jawatan disimpan.','Saved in this browser. No job has been published.':'Disimpan dalam pelayar ini. Jawatan belum diterbitkan.'};
 const staticNodes=[];
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while(n=walker.nextNode()){
  if(['SCRIPT','STYLE'].includes(n.parentElement.tagName))continue;
  const value=n.textContent.trim();if(translations[value])staticNodes.push({node:n,key:value});
 }
 const form=document.querySelector('#job-form');
 const fields=[...form.querySelectorAll('input:not([type=radio]),textarea')];
 fields.forEach(el=>{const error=form.querySelector(`[data-error-for="${el.id}"]`);if(error){error.id=el.id+'-error';el.setAttribute('aria-describedby',error.id);}});
 const placeholders={'job-title':'例如：数据分析师','salary':'例如：6500','job-description':'这个岗位平时会做什么？可以举两三个具体例子。','job-field':'例如：数据分析、市场营销','location':'例如：吉隆坡 / 可远程','skills':'例如：SQL、Excel、Python','soft-skills':'例如：清楚表达、团队协作','job-requirements':'哪些经验是必需的？哪些是加分项？','future-skills':'例如：数据可视化、流程自动化','employee-count':'例如：2','working-time':'例如：周一至周五，9:00–18:00'};
 const originalPlaceholders={'job-title':'e.g. Data Analyst','salary':'e.g. 6500','job-description':'Describe two or three things this person will do.','job-field':'e.g. Data, Marketing','location':'e.g. Kuala Lumpur / Remote','skills':'e.g. SQL, Excel, Python','soft-skills':'e.g. Communication, Teamwork','job-requirements':'Which experience is essential, and what is optional?','future-skills':'e.g. Data visualisation, Automation','employee-count':'e.g. 2','working-time':'e.g. Mon–Fri, 9:00 AM–6:00 PM'};
 const msPlaceholders={'job-title':'Contoh: Penganalisis Data','salary':'Contoh: 6500','job-description':'Nyatakan dua atau tiga tugas utama.','job-field':'Contoh: Data, Pemasaran','location':'Contoh: Kuala Lumpur / Jarak jauh','skills':'Contoh: SQL, Excel, Python','soft-skills':'Contoh: Komunikasi, Kerjasama','job-requirements':'Apakah pengalaman yang diperlukan?','future-skills':'Contoh: Visualisasi data','employee-count':'Contoh: 2','working-time':'Contoh: Isnin–Jumaat, 9:00–18:00'};
 const card=document.createElement('article');card.className='completed-job-sheet';card.hidden=true;card.setAttribute('aria-label',tr('完整职位说明','Full job description','Butiran jawatan lengkap'));form.after(card);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const progress=document.querySelector('.completion-note');progress.setAttribute('role','status');
 const savedStatus=document.createElement('span');savedStatus.className='save-status';savedStatus.setAttribute('role','status');document.querySelector('.draft-tools').append(savedStatus);
 const apply=data=>Object.entries(data).forEach(([k,v])=>{const control=form.elements.namedItem(k);if(control)control.value=v;});
 try{const draft=JSON.parse(localStorage.getItem(window.alignaDraftKey||'aligna-job-draft'));if(draft)apply(draft);}catch(e){}
 const text=(id,value)=>document.getElementById(id).textContent=value;
 let saveState='';
 const sampleText={
  jobTitle:['数据分析师','Data Analyst','Penganalisis Data'],
  jobDescription:['分析业务数据，制作报表，并与产品团队一起研究改进方向。','Analyse business data, build reports and work with the product team to identify improvements.','Analisis data perniagaan, sediakan laporan dan bekerjasama dengan pasukan produk untuk mengenal pasti penambahbaikan.'],
  jobField:['数据与技术','Data & Technology','Data dan Teknologi'],
  location:['吉隆坡','Kuala Lumpur','Kuala Lumpur'],
  softSkills:['沟通、批判性思考','Communication, Critical thinking','Komunikasi, Pemikiran kritis'],
  jobRequirements:['具备数据分析与 SQL 基础。\n能清楚表达分析结果，并关注数据质量。','Basic data analysis and SQL skills.\nAble to explain findings clearly and check data quality.','Asas analisis data dan SQL.\nMampu menerangkan dapatan dengan jelas dan menjaga kualiti data.'],
  futureSkills:['数据可视化、流程自动化','Data visualisation, Automation','Visualisasi data, Automasi'],
  workingTime:['周一至周五，9:00–18:00','Mon–Fri, 9:00 AM–6:00 PM','Isnin–Jumaat, 9:00–18:00']
 };
 const legacy={jobTitle:'Data Analyst / 数据分析师',jobDescription:'分析业务数据，构建清晰的可视化报表，并与产品团队合作发现增长机会。',jobRequirements:'具备数据分析与 SQL 基础。\n能够清晰沟通分析结果，并关注数据质量。',futureSkills:'AI-assisted analytics, Automation'};
 const translateSample=()=>{for(const [name,values]of Object.entries(sampleText)){const el=form.elements.namedItem(name);if(values.includes(el.value)||el.value===legacy[name])el.value=tr(...values);}};
 const render=()=>{
  translateSample();
  card.setAttribute('aria-label',tr('完整职位说明','Full job description','Butiran jawatan lengkap'));
  staticNodes.forEach(({node,key})=>node.textContent=tr(translations[key],english[key]||key,malay[key]||key));
  for(const id of Object.keys(placeholders))document.getElementById(id).placeholder=tr(placeholders[id],originalPlaceholders[id],msPlaceholders[id]);
  savedStatus.textContent=saveState==='saving'?tr('正在保留本机备份…','Keeping a browser backup…','Menyimpan salinan pelayar…'):saveState==='saved'?tr('已保留本机备份','Browser backup kept','Salinan pelayar disimpan'):saveState==='error'?tr('本机备份失败，请下载备份。','Browser backup failed. Download a copy instead.','Salinan pelayar gagal. Muat turun salinan.'):'';
  const data=Object.fromEntries(new FormData(form));
  const complete=fields.filter(el=>el.value.trim()).length+(data.employmentType?1:0);
  progress.textContent=tr(`已填写 ${complete} / 12 项`,`${complete} of 12 completed`,`${complete} daripada 12 diisi`);
  progress.style.setProperty('--completion',`${complete/12*100}%`);
  card.hidden=complete<12||!form.checkValidity();
  if(!card.hidden){const company=document.querySelector('#hiring-company')?.value||'';card.innerHTML=`<header><p>${safe(company)}</p><h2>${safe(data.jobTitle)}</h2><div>${safe(data.location)} · RM ${Number(data.salary).toLocaleString()} / ${tr('月','month','bulan')} · ${data.employmentType==='Full-time'?tr('全职','Full-time','Sepenuh masa'):tr('兼职','Part-time','Sambilan')}</div></header><div class="jd-facts"><span>${safe(data.jobField)}</span><span>${safe(data.workingTime)}</span><span>${tr('招聘','Openings','Kekosongan')} ${Number(data.employeeCount)}</span></div>${[['jobDescription',tr('工作内容','Responsibilities','Tanggungjawab')],['skills',tr('专业技能','Skills','Kemahiran')],['softSkills',tr('协作与沟通','Collaboration','Kerjasama')],['jobRequirements',tr('任职要求','Requirements','Keperluan')],['futureSkills',tr('发展方向','Skills to grow','Kemahiran masa hadapan')]].map(([key,label])=>`<section><h3>${label}</h3><p>${safe(data[key])}</p></section>`).join('')}`;}
 };
 let timer;const changed=()=>{
  clearTimeout(timer);
  try{localStorage.setItem(window.alignaDraftKey||'aligna-job-draft',JSON.stringify(Object.fromEntries(new FormData(form))));saveState='saving';timer=setTimeout(()=>{saveState='saved';render();},300);}
  catch(e){saveState='error';}
  render();translateErrors();
 };
 form.addEventListener('input',changed);form.addEventListener('change',changed);document.addEventListener('input',e=>{if(e.target.id==='hiring-company')render();});document.addEventListener('aligna-employer-profile',render);
 document.getElementById('sample-job').addEventListener('click',changed);
 const errors={
 'Job title is required.':'请输入职位名称。','Salary is required.':'请填一下每月薪资预算。','Job description is required.':'简单说说这份工作会做什么。','Job field is required.':'请填写所属领域。','Location is required.':'请输入工作地点。','Skills is required.':'请填写至少一项技能。','Soft skills is required.':'写一项你看重的沟通或协作方式。','Job requirements is required.':'说说需要什么经验，没有特别要求也可以写明。','Future required skills is required.':'写一项可以入职后学习的技能。','Number of employees is required.':'请输入招聘人数。','Time is required.':'请填写工作时间。','Employment type is required.':'选一下全职还是兼职。','Enter a valid salary amount.':'请填写不小于 0 的薪资数额。','Enter a whole number of at least 1.':'人数请填写 1 或更大的整数。'
 };
 const translateErrors=()=>form.querySelectorAll('.error-message').forEach(el=>{
 if(!el.textContent)return;
 const source=el.dataset.source||Object.keys(errors).find(k=>errors[k]===el.textContent)||el.textContent;
 el.dataset.source=source;el.textContent=tr(errors[source]||'请检查此项。',source,source.includes('required')?'Sila isi medan ini.':source.includes('whole')?'Masukkan nombor bulat sekurang-kurangnya 1.':'Masukkan nilai yang sah.');
 });
 window.addEventListener('aligna-locale-render',()=>{render();translateErrors();});
 form.addEventListener('submit',()=>{
  form.querySelectorAll('.error-message').forEach(el=>{if(el.textContent){el.dataset.source=el.textContent;el.textContent=tr(errors[el.textContent]||el.textContent,el.textContent,'Sila semak medan ini.');}});
  const radioError=form.querySelector('[data-error-for="employment-type"]');
  if(radioError.textContent&&!form.querySelector('[aria-invalid=true]'))form.querySelector('input[type=radio]').focus();
 });
 render();
})();
