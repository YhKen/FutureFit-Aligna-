import bank from './bank-v2.js';
import {profileSkills} from './profile-skills.js';
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu,' ').trim();
const contains=(text,phrase)=>{const t=norm(text),p=norm(phrase);if(!p)return false;if(/[\u3400-\u9fff]/.test(p))return t.includes(p);return (' '+t+' ').includes(' '+p+' ');};
const preferenceAliases={'培训':'training','弹性工时':'flexible hours','弹性工作时间':'flexible hours','远程':'remote','混合办公':'hybrid','latihan':'training','waktu fleksibel':'flexible hours','jarak jauh':'remote'};
const translated=s=>Object.entries(preferenceAliases).reduce((text,[from,to])=>text.replaceAll(from,' '+to+' '),String(s||'').toLowerCase());
const locationAliases=[['吉隆坡','kuala lumpur'],['槟城','penang'],['pulau pinang','penang'],['新山','johor bahru'],['柔佛新山','johor bahru'],['怡保','ipoh'],['马六甲','melaka'],['malacca','melaka'],['亚庇','kota kinabalu'],['古晋','kuching'],['布城','putrajaya'],['八打灵再也','petaling jaya']];
const locationKey=value=>norm(locationAliases.reduce((text,[from,to])=>text.replaceAll(from,' '+to+' '),norm(value)).replace(/\bkl\b/g,'kuala lumpur').replace(/\bpj\b/g,'petaling jaya'));
function explicitWish(text,wish){
 const phrase=translated(wish),lines=translated(text).split(/[\n。.]+/).filter(line=>contains(line,phrase));
 if(!lines.length)return null;
 const p=norm(phrase).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const negative=new RegExp(`(?:\\b(?:no|not|without|tidak|tiada)\\s+(?:[a-z]+\\s+)?|(?:不提供|没有|不支持|不包括)\\s*)${p}`,'i');
 if(lines.some(line=>negative.test(norm(line))))return false;
 return true;
}
export function extractJDRequirements(text){
 const lines=String(text||'').split(/[\n。!?;；]+|(?<=[a-zA-Z])\.(?:\s+|$)/).map(s=>s.trim()).filter(Boolean),found=[];
 for(const item of [...bank.items.filter(i=>i.category==='skill'),...profileSkills]){
  const line=lines.find(line=>[item.name,...Object.values(item.label||{})].some(p=>contains(line,p)));if(!line||found.some(x=>x.name===item.name))continue;
  const optional=/optional|nice.to.have|advantage|not required|无需|非必需|加分|kelebihan|tidak diwajibkan/i.test(line);
  found.push({name:item.name,label:item.label,kind:optional?'optional':'mentioned',source:line.slice(0,500)});
 }
 const experience=String(text||'').match(/\b(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\+?\s*(?:years?|tahun)|([一二三四五六七八九十\d]{1,2})\s*年/g)||[];
 return {skills:found.slice(0,35),experience:[...new Set(experience)].slice(0,3)};
}
export function preferenceFit(job,prefs){
 const rows=[];const add=(key,wanted,state)=>rows.push({key,wanted,state});
 if(prefs.location?.trim()){
  const wanted=prefs.location.split(/[,，;；]+/).map(locationKey).filter(Boolean);
  const actual=locationKey(job.location);
  add('location',prefs.location,actual?wanted.some(x=>contains(actual,x)):null);
 }
 if(prefs.minSalary>0)add('salary',prefs.minSalary,Number.isFinite(Number(job.salary))&&Number(job.salary)>=0?Number(job.salary)>=prefs.minSalary:null);
 if(prefs.employmentType)add('employmentType',prefs.employmentType,job.employmentType?job.employmentType===prefs.employmentType:null);
 if(prefs.arrangement){
  const text=[job.location,job.jobDescription,job.workingTime].join('\n');
  const checks={remote:/remote|work.from.home|远程|居家|jarak jauh|dari rumah/i,hybrid:/hybrid|混合办公|hibrid/i,onsite:/on.site|on.site|office.based|到岗|现场办公|di pejabat/i};
  const explicit=Object.entries(checks).filter(([,r])=>r.test(text)).map(([k])=>k);
  const negative=prefs.arrangement==='remote'&&/\b(?:no|not|without)\s+(?:fully\s+)?remote|不支持远程|不提供远程|非远程/i.test(text);
  add('arrangement',prefs.arrangement,negative?false:explicit.length?explicit.includes(prefs.arrangement):null);
 }
 if(prefs.companyWish?.trim()){
  for(const wish of prefs.companyWish.split(/[,，;；\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,5))add('companyWish',wish,explicitWish([job.companyName,job.jobDescription,job.jobRequirements,job.workingTime].join('\n'),wish));
 }
 const matched=rows.filter(r=>r.state===true).length,unknown=rows.filter(r=>r.state===null).length;
 return {rows,matched,unknown,total:rows.length,coverage:rows.length?Math.round(matched/rows.length*100):null};
}
