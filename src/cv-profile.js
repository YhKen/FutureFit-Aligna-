import {profileEntries,serializeEntries} from './profile-fields.js';
import {profileSkills} from './profile-skills.js';

const headings={
  education:['education','academic qualifications','academic background','qualifications','education and training','教育背景','教育经历','教育','学历','pendidikan','kelayakan akademik'],
  experience:['work experience','professional experience','employment history','experience','projects','work and projects','工作与项目经历','工作经历','项目经历','实习经历','经历','pengalaman kerja','pengalaman','projek'],
  skills:['technical skills','key skills','core skills','skills','competencies','技能','专业技能','技能与证书','kemahiran teknikal','kemahiran'],
  goal:['career objective','career objectives','objective','career goal','job preferences','求职意向','职业目标','目标职位','matlamat kerjaya','objektif kerjaya'],
  other:['summary','profile','professional summary','about me','certifications','certificates','languages','interests','references','个人简介','证书','语言','兴趣','profil','ringkasan','sijil','bahasa','rujukan']
};
const clean=s=>s.normalize('NFKC').replace(/[\u200b-\u200d\ufeff]/g,'').trim();
const comparable=s=>clean(s).toLowerCase().replace(/\s*&\s*/g,' and ').replace(/\s+/g,' ');
const hasText=(text,phrase)=>{
  const p=comparable(phrase),s=comparable(text),at=s.indexOf(p);
  if(at<0)return false;
  if(/[\u3400-\u9fff]/.test(p))return true;
  return new RegExp(`(^|[^\\p{L}\\p{N}])${p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}($|[^\\p{L}\\p{N}])`,'u').test(s);
};
const toolAliases={
  'Microsoft Excel':['excel','microsoft excel','ms excel','电子表格'],SQL:['sql'],Python:['python'],
  'Power BI':['power bi','powerbi'],Tableau:['tableau'],JavaScript:['javascript'],Java:['java'],
  'C++':['c++'],Figma:['figma'],Photoshop:['photoshop'],AutoCAD:['autocad'],
  Accounting:['accounting','会计','perakaunan'],'Data analysis':['data analysis','数据分析','analisis data'],
  'Project management':['project management','项目管理','pengurusan projek'],
  Communication:['communication','沟通表达','沟通','komunikasi'],Teamwork:['teamwork','团队合作','kerjasama'],
  'Customer service':['customer service','客户服务','客服','khidmat pelanggan'],
  'Digital marketing':['digital marketing','数字营销','pemasaran digital'],Sales:['sales','销售','jualan']
};
const sectionKeys={education:['institution','qualification','year'],experience:['title','company','period','details'],goal:['role','location','type']};
const labelled=(lines,keys)=>{for(const line of lines){for(const key of keys){const m=line.match(new RegExp(`^${key}\\s*[:：]\\s*(.+)$`,'i'));if(m)return m[1].trim();}}return '';};
const institution=/university|universiti|college|polytechnic|institute|学院|大学|中学|sekolah|kolej/i;
const qualification=/bachelor|master|diploma|degree|ph\.?d|bsc|msc|beng|mba|stpm|spm|sijil|ijazah|学士|硕士|博士|文凭|本科|大专|高中/i;
const company=/sdn\.?\s*bhd\.?|berhad|\bbhd\b|\b(?:inc|ltd|llc|corp|company|group)\b|公司|集团|syarikat/i;
const role=/analyst|engineer|assistant|manager|designer|developer|executive|intern|accountant|specialist|officer|teacher|consultant|coordinator|representative|technician|分析师|工程师|助理|经理|设计师|专员|实习|会计|教师|主管|pengurus|pembantu|jurutera|penganalisis|eksekutif/i;
const dateRange=/(?:\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}(?:[./年-]\d{1,2}月?)?\s*(?:[-–—至到]|\bto\b|\bhingga\b)\s*(?:(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}(?:[./年-]\d{1,2}月?)?|present|current|now|至今|现在|kini|sekarang)/i;

export function parseCVProfile(text,items=[]) {
  const lines=String(text||'').slice(0,50000).split(/\r?\n/).map(clean).filter(Boolean);
  const sections={education:[],experience:[],skills:[],goal:[],other:[],header:[]};
  let current='header';
  for(const line of lines){
    let matched=false;
    for(const [key,variants] of Object.entries(headings)){
      for(const heading of variants){
        const normalized=comparable(line).replace(/[:：]\s*$/,'');
        const h=comparable(heading);
        if(normalized===h){current=key;matched=true;break;}
        const prefix=comparable(line).match(/^([^:：]+)[:：]\s*(.+)$/);
        if(prefix&&prefix[1]===h){current=key;sections[key].push(line.slice(line.search(/[:：]/)+1).trim());matched=true;break;}
      }if(matched)break;
    }
    if(!matched)sections[current].push(line);
  }
  let name=labelled(lines,['name','full name','姓名','名字','nama','nama penuh']);
  if(!name)name=sections.header.find(line=>{
    if(line.length<2||line.length>70||/@|https?:|www\.|\d|[|:：]/i.test(line)||/resume|curriculum vitae|简历|履历|contact|email|phone|address|linkedin|portfolio|简述|联系方式/i.test(line)||role.test(line)||institution.test(line)||qualification.test(line))return false;
    return /^[\p{L}\p{M} .'-]+$/u.test(line)&&line.split(/\s+/).length<=7;
  })||'';
  const edu=sections.education.flatMap(x=>x.split(/\s*[|·]\s*/)),exp=sections.experience;
  const education={institution:labelled(edu,['school','institution','university','学校','院校','机构','institusi'])||edu.find(x=>institution.test(x))||'',qualification:labelled(edu,['qualification','degree','学历','课程','kelayakan'])||edu.find(x=>qualification.test(x))||'',year:''};
  const eduYears=edu.join(' ').match(/\b(?:19|20)\d{2}\b/g);
  education.year=labelled(edu,['graduation year','毕业年份','tahun tamat'])||(eduYears?.at(-1)||'');
  // Keep all experience below; the compact first-role fields never invent an employer.
  const fragments=exp.flatMap(x=>x.split(/\s+[|·]\s+|\s+[-–—]\s+(?=[A-Z\p{Script=Han}])/u)).map(clean);
  const experience={title:labelled(exp,['job title','position','职位','岗位','jawatan'])||fragments.find(x=>role.test(x)&&!company.test(x))||'',company:labelled(exp,['company','employer','公司','组织','syarikat','majikan'])||fragments.find(x=>company.test(x))||'',period:exp.join(' ').match(dateRange)?.[0]||'',details:exp.join('\n')};
  const goal={role:labelled(lines,['target role','preferred role','desired position','目标职位','期望职位','求职意向','jawatan pilihan'])||sections.goal.join(' '),location:labelled(lines,['preferred location','desired location','期望工作地点','期望地点','lokasi pilihan']),type:labelled(lines,['employment type','job type','工作类型','jenis pekerjaan'])};
  const skills=[];
  for(const item of items.filter(x=>x.category==='skill'))if([item.name,...Object.values(item.label||{})].some(label=>hasText(text,label)))skills.push(item.name);
  for(const item of profileSkills)if([item.name,...Object.values(item.label)].some(label=>hasText(text,label))&&!skills.includes(item.name))skills.push(item.name);
  for(const [name,aliases] of Object.entries(toolAliases))if(aliases.some(alias=>hasText(text,alias))&&!skills.includes(name))skills.push(name);
  // Retain explicit tool lines in the editable profile, even when not in the taxonomy.
  const explicitSkills=sections.skills.join('\n');
  if(explicitSkills)experience.details+=[experience.details?'\n\n':'','Skills: ',explicitSkills].join('');
  for(const skill of sections.skills.flatMap(x=>x.split(/[,，;；、|•]+/)).map(clean).filter(x=>x.length>=2&&x.length<=60)){
    if(!skills.some(x=>comparable(x)===comparable(skill)))skills.push(skill);
  }
  const educationEntries=[];
  for(const line of edu){
    if(institution.test(line))educationEntries.push({institution:line,qualification:'',year:''});
    else if(educationEntries.length){const entry=educationEntries.at(-1);if(qualification.test(line))entry.qualification=line;const years=line.match(/\b(?:19|20)\d{2}\b/g);if(years)entry.year=years.at(-1);}
  }
  if(educationEntries.length<=1)educationEntries.splice(0,educationEntries.length,education);
  const experienceEntries=[];
  for(const line of exp){
    if(role.test(line)&&(!experienceEntries.length||/^[-•*]/.test(line)===false)&&line.length<170&&!/^(?:managed|developed|built|led|负责|完成|开发|mengurus|membangun)\b/i.test(line)){
      const parts=line.split(/\s*[|·]\s*/);experienceEntries.push({title:parts.find(x=>role.test(x)&&!company.test(x))||line,company:parts.find(x=>company.test(x))||'',period:line.match(dateRange)?.[0]||'',details:''});
    }else if(experienceEntries.length){const entry=experienceEntries.at(-1);if(company.test(line)&&!entry.company)entry.company=line;else if(dateRange.test(line)&&!entry.period)entry.period=line.match(dateRange)[0];else entry.details+=(entry.details?'\n':'')+line;}
  }
  if(experienceEntries.length<=1)experienceEntries.splice(0,experienceEntries.length,experience);
  else if(explicitSkills)experienceEntries.at(-1).details+='\nSkills: '+explicitSkills;
  return {name:name.slice(0,200),education,experience,educationEntries:educationEntries.slice(0,8),experienceEntries:experienceEntries.slice(0,8),goal,skills:skills.slice(0,35),hasText:lines.join('').length>=20};
}

export function applyCVProfile(profile,parsed,previous=null) {
  const changed=[],snapshot={confirmedSkills:[]};
  const replaceable=(value,old)=>!String(value||'').trim() || (old!==undefined && value===old);
  if(parsed.name&&replaceable(profile.name,previous?.name)){profile.name=parsed.name;snapshot.name=parsed.name;changed.push('name');}
  for(const [section,keys] of Object.entries(sectionKeys)){
    const entries=profileEntries(profile[section],section),old=previous?.[section]?profileEntries(previous[section],section):[];
    const incoming=parsed[section+'Entries']||[parsed[section]],written=[];
    let updated=false;
    incoming.forEach((item,n)=>{
      if(n>=8)return;const fields=entries[n]||(entries[n]={}),record={};
      for(const key of keys){if(item[key]&&replaceable(fields[key],old[n]?.[key])){const max=key==='details'?1800:key==='year'?20:150;fields[key]=String(item[key]).slice(0,max);record[key]=fields[key];updated=true;}}
      written.push(record);
    });
    if(updated){profile[section]=serializeEntries(entries);snapshot[section]=serializeEntries(written);changed.push(section);}
  }
  const manuallyKept=(profile.confirmedSkills||[]).filter(x=>!previous?.confirmedSkills?.includes(x));
  profile.confirmedSkills=[...new Set([...manuallyKept,...parsed.skills])].slice(0,35);
  snapshot.confirmedSkills=parsed.skills.filter(x=>profile.confirmedSkills.includes(x));
  if(parsed.skills.length)changed.push('skills');
  return {changed,snapshot,missing:missingCVFields(profile)};
}
export function missingCVFields(profile) {
  const background=[...profileEntries(profile.experience,'experience').flatMap(x=>[x.title,x.details]),...profileEntries(profile.education,'education').flatMap(x=>[x.institution,x.qualification])];
  return [!profile.name?.trim()?'name':null,!background.some(x=>String(x||'').trim())?'background':null,!profile.confirmedSkills?.length?'skills':null].filter(Boolean);
}
