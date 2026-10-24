export function makeItems(mini,onet){
 const items=[...mini.items.map(i=>({...i,dimension:'personality:'+i.factor,bank:mini.id})),...onet.data.question.map(i=>({id:'onet-'+i.index,text:i.text,key:1,dimension:'interest:'+i.area,bank:onet.id}))];
 if(items.length!==50||new Set(items.map(i=>i.id)).size!==50)throw Error('Invalid banks');
 return items;
}
export function nextItem(items,responses,seed){
 const seen=new Set(),stats={}; let x=(seed+responses.length*997)>>>0;
 for(const a of responses){const i=items.find(i=>i.id===a.itemId);if(!i||seen.has(i.id)||!Number.isInteger(a.value)||a.value<1||a.value>5)throw Error('Invalid answers');seen.add(i.id);(stats[i.dimension]??=[]).push(i.key<0?6-a.value:a.value);}
 if(responses.length>=30)return null;
 return items.filter(i=>!seen.has(i.id)).map(item=>{const v=stats[item.dimension]||[],n=v.length,m=n?v.reduce((a,b)=>a+b)/n:3;const variance=n?v.reduce((a,b)=>a+(b-m)**2,0)/n:0;x=(Math.imul(x,1664525)+1013904223)>>>0;return {item,score:n<2?100-n*20:10/(n+1)+variance+1-Math.abs(m-3)/2,tie:x,reason:n<2?'dimension-coverage':'clarify-mixed-or-neutral-responses'};}).sort((a,b)=>b.score-a.score||a.tie-b.tie)[0];
}
export function summarize(items,responses){
 const out={};for(const a of responses){const i=items.find(i=>i.id===a.itemId);if(!i)throw Error('Unknown item');const d=out[i.dimension]??={values:[],evidence:[]};d.values.push(i.key<0?6-a.value:a.value);d.evidence.push(a.itemId);}
 for(const d of Object.values(out)){d.n=d.values.length;d.mean=d.values.reduce((a,b)=>a+b)/d.n;}return out;
}
export function reviewDate(date){const d=new Date(date+'T00:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+6);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString().slice(0,10);}
export const careers=[
 ['15-2051.00','IC','数据科学家','Data scientist','Saintis data'],
 ['15-1252.00','IC','软件开发人员','Software developer','Pembangun perisian'],
 ['27-1024.00','AC','平面设计师','Graphic designer','Pereka grafik'],
 ['13-1151.00','SI','培训与发展专员','Training and development specialist','Pakar latihan dan pembangunan'],
 ['13-2011.00','CEI','会计与审计人员','Accountant or auditor','Akauntan atau juruaudit'],
 ['47-2111.00','RC','电工','Electrician','Juruelektrik'],
 ['11-2022.00','EC','销售经理','Sales manager','Pengurus jualan']
];
export const areas={R:'realistic',I:'investigative',A:'artistic',S:'social',E:'enterprising',C:'conventional'};
export function mapCareers(stats){return careers.map(c=>({career:c,mean:[...c[1]].reduce((s,k)=>s+(stats['interest:'+areas[k]]?.mean??3),0)/c[1].length})).sort((a,b)=>b.mean-a.mean);}
