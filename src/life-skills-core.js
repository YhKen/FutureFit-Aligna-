import bank from './bank-v2.js';
import {profileSkills} from './profile-skills.js';
import {canonical,skillId} from './skill-catalog.js';
export const LIFE_VERSION='life-evidence-v2';
const catalog=[...profileSkills,...bank.items.filter(i=>i.category==='skill')];
const rules=[
 ['Inventory management',['盘点库存','清点库存','检查库存','管理库存','stocktake','counted stock','checked inventory','managed inventory','kira stok','semak stok','urus inventori']],
 ['Management of Material Resources',['盘点库存','管理库存','采购物资','managed inventory','ordered supplies','urus inventori','beli bekalan']],
 ['Bookkeeping',['记账','核对收款','现金对账','对账','reconciled cash','recorded expenses','bookkeeping','reconcile cash','rekod perbelanjaan','simpan kira','semak tunai']],
 ['Mathematics',['核对收款','现金对账','计算收入','算成本','reconciled cash','calculated costs','counted takings','kira kos','kira hasil','semak tunai']],
 ['Budgeting',['家庭预算','管理预算','编制预算','安排预算','family budget','managed a budget','planned a budget','household budget','bajet keluarga','urus bajet','rancang bajet']],
 ['Management of Financial Resources',['家庭预算','管理预算','安排预算','family budget','managed a budget','household budget','bajet keluarga','urus bajet']],
 ['Customer service',['招呼客人','接待顾客','回答顾客','服务顾客','served customers','helped customers','answered customers','layan pelanggan','bantu pelanggan']],
 ['Complaint handling',['处理投诉','处理客诉','安抚顾客','handled complaints','resolved complaints','urus aduan','kendali aduan']],
 ['Sales',['摆摊','卖东西','卖商品','sold products','ran a stall','selling at a market','jual barang','berniaga di pasar','jual di gerai']],
 ['Scheduling',['安排日程','排班','安排看诊','预约看诊','安排训练','scheduled appointments','arranged appointments','planned shifts','scheduled training','atur janji temu','susun jadual','jadual latihan']],
 ['Time Management',['安排日程','排班','安排训练','scheduled appointments','planned shifts','scheduled training','susun jadual','jadual latihan']],
 ['Event planning',['筹办活动','策划活动','组织活动','organised an event','organized an event','planned events','organised events','anjur acara','rancang acara']],
 ['Coordination',['协调志愿者','协调队员','安排分工','协调活动','coordinated volunteers','assigned roles','coordinated a team','selaras sukarelawan','bahagi tugas']],
 ['Management of Personnel Resources',['安排分工','带队训练','分配任务','assigned roles','allocated tasks','led team training','bahagi tugas','agih tugas']],
 ['Instructing',['辅导功课','教队员','教小朋友','教别人','tutored','taught children','taught teammates','ajar kanak','ajar rakan','bimbing pelajaran']],
 ['Record keeping',['记录出勤','整理记录','整理档案','记录支出','kept attendance','organised records','organized records','recorded expenses','rekod kehadiran','susun rekod','rekod perbelanjaan']],
 ['Writing',['写活动报告','撰写报告','写通知','wrote reports','wrote notices','drafted reports','tulis laporan','tulis notis']],
 ['Negotiation',['协商价格','谈价格','与供应商议价','negotiated prices','negotiated with suppliers','runding harga','tawar harga']],
 ['Troubleshooting',['排查故障','检查故障原因','troubleshot','diagnosed a fault','checked fault causes','cari punca kerosakan','kenal pasti punca kerosakan']],
 ['Microsoft Excel',['用excel','使用excel','excel表格','used excel','using excel','guna excel']],
 ['Social media management',['管理社交媒体','运营社交账号','managed social media','urus media sosial']],
 ['Food preparation',['准备餐点','准备饭菜','备餐','prepared meals','meal preparation','sediakan makanan','penyediaan makanan']]
];
const boundary=s=>/[A-Za-z0-9]/.test(s),bad=/没有|没做|不会|未曾|从未|不负责|不懂|想学|希望学|想要学|想做|计划学|想成为|(?:\b(?:not|never|cannot|can't|don’t|don't|didn’t|didn't|want to|hope to|learning to|would like to)\b)|\b(?:tidak|belum|bukan|ingin belajar|mahu belajar|tak pernah)\b/iu;
function termIndex(text,term){let at=text.toLowerCase().indexOf(term.toLowerCase());while(at>=0){const before=text[at-1]||'',after=text[at+term.length]||'';if(!boundary(term[0])||(!boundary(before)&&!boundary(after)))return at;at=text.toLowerCase().indexOf(term.toLowerCase(),at+1);}return -1;}
export function extractLifeSkills(text){
 if(typeof text!=='string'||text.trim().length<8||text.length>4000)throw Error('invalid-experience');
 const results=new Map();for(const match of text.matchAll(/[^。！？!?\n;；]+[。！？!?;；]?/gu)){const quote=match[0].trim(),start=match.index+match[0].indexOf(quote);if(bad.test(quote))continue;
  for(const [name,terms] of rules){if(results.has(canonical(name))||!terms.some(term=>termIndex(quote,term)>=0))continue;const item=catalog.find(i=>canonical(i.name)===canonical(name));if(!item)continue;results.set(canonical(name),{skillId:skillId(item.name),name:item.name,evidenceQuote:quote,start,end:start+quote.length,confidence:'explicit-action',sourceType:'life-experience-self-report',verified:false});}
 }return [...results.values()].slice(0,12);
}
export function validLifeClaim(text,c){return !!c&&typeof text==='string'&&Number.isInteger(c.start)&&Number.isInteger(c.end)&&c.start>=0&&c.end>c.start&&text.slice(c.start,c.end)===c.evidenceQuote&&catalog.some(i=>i.name===c.name&&skillId(i.name)===c.skillId)&&c.sourceType==='life-experience-self-report'&&c.verified===false;}
export function lifeRecord({id,text,type='other',locale='en',claims,selected,now=new Date().toISOString()}){
 const allowed=extractLifeSkills(text),ids=new Set(selected),accepted=claims.filter(c=>ids.has(c.skillId)&&validLifeClaim(text,c)&&allowed.some(a=>JSON.stringify(a)===JSON.stringify(c)));
 if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!['zh','en','ms'].includes(locale)||!['care','market','club','sport','part-time','community','other'].includes(type)||!accepted.length||accepted.length!==ids.size||!Number.isFinite(Date.parse(now)))throw Error('invalid-life-record');
 return {version:LIFE_VERSION,experienceId:id,text,type,locale,claims:accepted.map(({skillId,start,end})=>({skillId,start,end})),active:true,sourceType:'life-experience-self-report',verified:false,createdAt:now,updatedAt:now};
}
export function lifeClaims(record){
 if(!record||!['life-evidence-v1',LIFE_VERSION].includes(record.version)||record.verified!==false||record.sourceType!=='life-experience-self-report'||typeof record.text!=='string'||record.text.length<8||record.text.length>4000)return [];
 const grounded=extractLifeSkills(record.text);return (record.claims||[]).flatMap(c=>{const g=grounded.find(g=>g.skillId===c.skillId&&g.start===c.start&&g.end===c.end);return g&&(record.version===LIFE_VERSION||validLifeClaim(record.text,c))?[g]:[];});
}
export function confirmedLifeSkills(records=[]){const found=new Map();for(const r of records)if(r.active===true)for(const c of lifeClaims(r))if(!found.has(canonical(c.name)))found.set(canonical(c.name),{...c,experienceId:r.experienceId});return [...found.values()];}
export function publicLifeSkills(records,locale='en'){return confirmedLifeSkills(records).map(c=>({name:c.name,example:'',sourceType:'life-experience-self-report'}));}
export function mergeLifeSkills(skills=[],records=[],locale='en'){const merged=new Map(skills.map(s=>[canonical(s.name),s]));for(const s of publicLifeSkills(records,locale))if(!merged.has(canonical(s.name)))merged.set(canonical(s.name),s);return [...merged.values()].slice(0,50);}
