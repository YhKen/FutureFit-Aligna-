import bank from './bank-v2.js';
import {profileSkills} from './profile-skills.js';
export const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}+#.]+/gu,' ').trim();
const aliases=new Map();
for(const item of bank.items.filter(x=>x.category==='skill')){
 const names=[item.name,...Object.values(item.label||{})];
 for(const name of names)if(name)aliases.set(norm(name),item.name);
}
for(const item of profileSkills)for(const name of [item.name,...Object.values(item.label)])aliases.set(norm(name),item.name);
for(const group of [
 ['Microsoft Excel','excel','ms excel','电子表格','微软excel'],
 ['Data analysis','数据分析','analisis data'],['Project management','项目管理','pengurusan projek'],
 ['Communication','沟通','沟通表达','komunikasi'],['Customer service','客服','客户服务','khidmat pelanggan'],
 ['SQL','sql'],['Python','python'],['Accounting','会计','perakaunan'],
 ['Power BI','powerbi','power bi'],['Digital marketing','数字营销','pemasaran digital'],
 ['Teamwork','团队合作','kerjasama'],['Sales','销售','jualan'],
 ['Programming','编程','pengaturcaraan'],['Writing','书面表达','penulisan'],
 ['Active Listening','积极倾听','mendengar secara aktif'],['Critical Thinking','批判性思考','pemikiran kritis']
])for(const name of group)aliases.set(norm(name),group[0]);
export function canonical(name){return aliases.get(norm(name))||norm(name);}
export function skillLabel(name,lang='en'){const key=canonical(name),item=[...profileSkills,...bank.items.filter(i=>i.category==='skill')].find(i=>canonical(i.name)===key);return item?.label?.[lang]||name;}
export function skillId(name){const key=canonical(name);return (aliases.has(norm(name))?'skill:':'custom:')+encodeURIComponent(key);}
