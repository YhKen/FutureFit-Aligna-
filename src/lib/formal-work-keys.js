// Server-only reference implementation; never included in the browser asset build.
import {formalTask} from '../formal-work-data.js';
export function resourceReference(materials){
 if(!materials||!Array.isArray(materials.options)||!materials.options.length||['budget','timeLimit','safeguardsRequired'].some(k=>materials[k]==null)||materials.options.some(o=>!o||['id','cost','minutes','reach','safeguard'].some(k=>o[k]==null)))throw Error('insufficient-task-materials');
 if(materials.options.length>12||new Set(materials.options.map(o=>o.id)).size!==materials.options.length||!Number.isInteger(materials.safeguardsRequired)||materials.safeguardsRequired<0||['budget','timeLimit'].some(k=>!Number.isFinite(materials[k])||materials[k]<0)||materials.options.some(o=>typeof o.id!=='string'||!o.id||typeof o.safeguard!=='boolean'||['cost','minutes','reach'].some(k=>!Number.isFinite(o[k])||o[k]<0)))throw Error('invalid-task-materials');
 const all=[];for(let mask=0;mask<2**materials.options.length;mask++){const selected=materials.options.filter((_,i)=>mask&(1<<i)),sum=selected.reduce((s,r)=>({cost:s.cost+r.cost,minutes:s.minutes+r.minutes,reach:s.reach+r.reach,safeguards:s.safeguards+Number(r.safeguard)}),{cost:0,minutes:0,reach:0,safeguards:0});all.push({selected:selected.map(r=>r.id),...sum,feasible:sum.cost<=materials.budget&&sum.minutes<=materials.timeLimit&&sum.safeguards>=materials.safeguardsRequired});}
 const feasible=all.filter(r=>r.feasible);if(!feasible.length)throw Error('no-feasible-task-plan');const maximum=Math.max(...feasible.map(r=>r.reach));return {method:'Exhaustive 0/1 subset enumeration',combinations:all.length,maximum,optimal:feasible.filter(r=>r.reach===maximum),all};
}
export function recordsReference(materials){
 if(!materials||!Array.isArray(materials.events)||!materials.events.length||materials.events.some(r=>!r||['eventId','deliveryId','time','status'].some(k=>typeof r[k]!=='string'||!r[k].trim())))throw Error('insufficient-task-materials');
 if(materials.events.length>2000||materials.events.some(r=>!Number.isFinite(Date.parse(r.time))||!['pending','delivered','returned'].includes(r.status)))throw Error('invalid-task-materials');
 const unique=new Map();for(const row of materials.events){const old=unique.get(row.eventId);if(old&&JSON.stringify(old)!==JSON.stringify(row))throw Error('ambiguous-event-definition');unique.set(row.eventId,row);}
 const groups=Map.groupBy([...unique.values()],r=>r.deliveryId),states=[...groups].map(([deliveryId,rows])=>{const time=Math.max(...rows.map(r=>Date.parse(r.time))),latest=rows.filter(r=>Date.parse(r.time)===time),statuses=[...new Set(latest.map(r=>r.status))];return {deliveryId,latestTime:new Date(time).toISOString(),status:statuses.length===1?statuses[0]:'conflict',eventIds:latest.map(r=>r.eventId)};}).sort((a,b)=>a.deliveryId.localeCompare(b.deliveryId));
 const completed=states.filter(r=>r.status==='delivered');return {method:'Exact event deduplication and latest-state grouping',rawRows:materials.events.length,uniqueEvents:unique.size,duplicateRows:materials.events.length-unique.size,uniqueCount:states.length,completedCount:completed.length,rate:completed.length/states.length,exceptions:states.filter(r=>r.status!=='delivered').map(r=>r.deliveryId),conflicts:states.filter(r=>r.status==='conflict').map(r=>r.deliveryId),states};
}
export function formalReference(taskId,variant){const task=formalTask(taskId,variant);return taskId==='resource-plan'?resourceReference(task.materials):recordsReference(task.materials);}
export function checkFormalNumbers(task,answers){
 const reference=task.id==='resource-plan'?resourceReference(task.materials):recordsReference(task.materials);let checks;
 if(task.id==='resource-plan'){
  const selected=task.materials.options.filter(r=>answers.selected.includes(r.id)),idsValid=answers.selected.every(id=>task.materials.options.some(r=>r.id===id)),sum=selected.reduce((s,r)=>({cost:s.cost+r.cost,minutes:s.minutes+r.minutes,reach:s.reach+r.reach,safeguards:s.safeguards+Number(r.safeguard)}),{cost:0,minutes:0,reach:0,safeguards:0});
  checks=[{key:'valid-selection',passed:idsValid},{key:'budget',passed:idsValid&&sum.cost<=task.materials.budget},{key:'time',passed:idsValid&&sum.minutes<=task.materials.timeLimit},{key:'safeguard',passed:idsValid&&sum.safeguards>=task.materials.safeguardsRequired},{key:'optimal-selection',passed:idsValid&&reference.optimal.some(r=>r.selected.join('|')===answers.selected.join('|'))},{key:'maximum',passed:answers.claimedMaximum!==''&&Number(answers.claimedMaximum)===reference.maximum}];
  return {checks,passed:checks.every(r=>r.passed),candidateTotals:sum,checked:checks.length,correct:checks.filter(r=>r.passed).length,reference};
 }
 checks=[{key:'unique-count',passed:answers.uniqueCount!==''&&Number(answers.uniqueCount)===reference.uniqueCount},{key:'completed-count',passed:answers.completedCount!==''&&Number(answers.completedCount)===reference.completedCount},{key:'follow-up-set',passed:[...answers.exceptions].sort().join('|')===reference.exceptions.join('|')}];
 return {checks,passed:checks.every(r=>r.passed),checked:checks.length,correct:checks.filter(r=>r.passed).length,reference};
}
