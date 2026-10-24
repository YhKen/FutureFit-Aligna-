import {routeKey,cleanSettings} from './seeker-records.js';
export function topologicalUnits(units){
 const byId=new Map(units.map(u=>[u.id,u]));if(byId.size!==units.length)throw Error('duplicate-unit');
 for(const u of units)if(!Number.isInteger(u.hours)||u.hours<1||!Array.isArray(u.requires)||u.requires.some(id=>!byId.has(id)))throw Error('invalid-unit');
 const pending=new Set(byId.keys()),ordered=[];
 while(pending.size){const ready=[...pending].filter(id=>byId.get(id).requires.every(dep=>!pending.has(dep))).sort();if(!ready.length)throw Error('cyclic-units');for(const id of ready){ordered.push(byId.get(id));pending.delete(id);}}
 return ordered;
}
export function scheduleUnits(units,{weeks,hours,completed=[]}){
 if(!Number.isInteger(weeks)||weeks<1||!Number.isInteger(hours)||hours<1||hours>40)throw Error('invalid-capacity');
 const ordered=topologicalUnits(units),capacity=weeks*hours,done=new Set(completed),scheduled=[],deferred=[],ends=new Map();let used=0;
 for(const u of ordered){if(done.has(u.id)){ends.set(u.id,0);continue;}const prereq=u.requires.every(id=>ends.has(id));if(!prereq||used+u.hours>capacity){deferred.push(u);continue;}let begin=Math.max(used,...u.requires.map(id=>ends.get(id)||0));if(begin+u.hours>capacity){deferred.push(u);continue;}const entry={...u,startHour:begin,endHour:begin+u.hours,startWeek:Math.floor(begin/hours)+1,endWeek:Math.ceil((begin+u.hours)/hours)};scheduled.push(entry);used=entry.endHour;ends.set(u.id,used);}
 const weekly=Array.from({length:weeks},(_,i)=>({week:i+1,hours:0,units:[]}));for(const u of scheduled)for(let h=u.startHour;h<u.endHour;h++){const w=weekly[Math.floor(h/hours)];w.hours++;if(!w.units.includes(u.id))w.units.push(u.id);}
 return {scheduled,deferred,weekly,capacity,used,remaining:capacity-used,complete:!deferred.length};
}
export function buildRoute(plan,settings,completed=[]){
 const s=cleanSettings(settings),units=[{id:'direction',kind:'direction',hours:2,requires:[]}];
 for(const r of plan.focus){const id=r.item?.id||r.name.replace(/[^a-z0-9]/gi,'_');units.push({id:id+'-baseline',kind:'baseline',skill:r.name,hours:2,requires:['direction']},{id:id+'-learn',kind:'learn',skill:r.name,hours:r.rating>=3?4:8,requires:[id+'-baseline']},{id:id+'-work',kind:'work',skill:r.name,hours:4,requires:[id+'-learn']},{id:id+'-review',kind:'review',skill:r.name,hours:2,requires:[id+'-work']});}
 units.push({id:'portfolio',kind:'portfolio',hours:3,requires:units.filter(u=>u.kind==='review').map(u=>u.id)});
 for(let round=1;round<=s.months;round++)units.push({id:'replay-'+round,kind:'replay',hours:2,requires:[round===1?'portfolio':'replay-'+(round-1)]});
 units.push({id:'interview',kind:'interview',hours:2,requires:['replay-'+s.months]});
 const scheduled=scheduleUnits(units,{weeks:plan.weeks,hours:s.hours,completed});
 return {id:routeKey(s),settings:s,units,completed:[...new Set(completed)].filter(id=>units.some(u=>u.id===id)),...scheduled};
}
