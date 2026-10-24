import assert from 'node:assert/strict';
import {matchCandidate} from '../match-engine.js';
import {matchTraceView} from '../match-trace.js';
import {jdFlowModel} from '../jd-sankey.js';
import {jdMatchTraceView} from '../match-trace-panel.js';
const job={id:'synthetic-jd',jobTitle:'Accounts Assistant',skills:'Excel, Bookkeeping, Payroll',softSkills:'Communication, Teamwork'};
const candidate={skills:[{name:'Microsoft Excel',example:'Built a synthetic reconciled workbook.'},{name:'Communication',example:'Prepared a fictional customer handover.'}]};
const m=matchCandidate(job,candidate),flow=jdFlowModel(m);
assert.deepEqual(m.totals,{weight:8,matchedWeight:3,squareWeight:14,matchedSquareWeight:5});
assert.equal(m.coverage,38);assert.equal(m.cosinePercent,60);
for(const row of flow.rows){const input=flow.links.filter(l=>l.target==='skill-'+row.index).reduce((n,l)=>n+l.units,0),output=flow.links.filter(l=>l.source==='skill-'+row.index).reduce((n,l)=>n+l.units,0);assert.equal(input,row.weight);assert.equal(output,row.weight);}
assert.equal(flow.links.filter(l=>l.target==='recorded').reduce((n,l)=>n+l.units,0),m.totals.matchedWeight);
assert.equal(flow.links.filter(l=>l.target==='unconfirmed').reduce((n,l)=>n+l.units,0),m.totals.weight-m.totals.matchedWeight);
for(const lang of ['zh','en','ms']){
 const hr=matchTraceView(job,candidate,lang,{audience:'hr'}),seeker=matchTraceView(job,candidate,lang,{audience:'seeker'});
 for(const view of [hr,seeker]){assert.ok(view.includes('38%'));assert.ok(view.includes('60%'));assert.ok(view.includes('100%'));assert.ok(view.includes('3 / 8'));assert.ok(view.includes('√(14 × 5)'));assert.ok(view.includes('synthetic reconciled workbook'));assert.equal((view.match(/data-jd-flow-pick=/g)||[]).length,5);}
  assert.equal(hr,seeker);assert.ok(hr.includes('jd-flow-next'));assert.ok(!hr.includes('data-jd-save'));assert.ok(seeker.includes('accaglobal.com'));assert.ok(seeker.includes('open.edu'));assert.ok(hr.includes(['AI 趋势','AI outlook','Arah AI'][['zh','en','ms'].indexOf(lang)]));assert.ok(hr.includes(['趋势参考','Trend reference','Rujukan trend'][['zh','en','ms'].indexOf(lang)]));
}
assert.equal(jdFlowModel(matchCandidate({skills:''},{skills:[]})).rows.length,0);
const h02=jdMatchTraceView(job,candidate,'zh',{audience:'hr'});
assert.ok(h02.includes('证据有多完整'));
assert.ok(h02.includes('不同来源，放在一起看'));
assert.ok(h02.includes('h02-bullet-row'));
assert.ok(h02.includes('jd-evidence-provenance'));
assert.ok(h02.includes('jd-flow-list-item'));
assert.ok(h02.includes('工具 / 条件'));
const noRecords=matchCandidate(job,{skills:[]});assert.equal(noRecords.coverage,0);assert.equal(noRecords.cosinePercent,null);assert.equal(noRecords.evidenceCoverage,null);
assert.ok(!matchTraceView({skills:'<img onerror=x>'},{skills:[{name:'<img onerror=x>',example:'<script>x</script>'}]},'en').includes('<script>'));
assert.deepEqual(matchCandidate(job,candidate),matchCandidate(job,JSON.parse(JSON.stringify(candidate))),'both roles use the same shared snapshot without role-specific adjustments');
console.log('PASS shared JD Sankey: weighted conservation, per-skill contributions, 3 languages, no-record state, learning paths, HTML escaping and same-input parity.');
