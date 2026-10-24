import assert from 'node:assert/strict';
import {cosineSimilarity,matchCandidate} from '../match-engine.js';
import {matchTraceView} from '../match-trace.js';
import {evidenceFlow,skillFlowHTML} from '../skill-flow.js';
assert.ok(Math.abs(cosineSimilarity([2,1],[2,1])-1)<1e-12);assert.equal(cosineSimilarity([1,0],[0,1]),0);assert.equal(cosineSimilarity([1],[0]),null);assert.equal(cosineSimilarity([],[]),null);assert.throws(()=>cosineSimilarity([1],[1,2]));assert.throws(()=>cosineSimilarity([NaN],[1]));
const job={skills:'Excel, SQL',softSkills:'Communication'},candidate={skills:[{name:'Microsoft Excel',example:'Built a workbook'}]},m=matchCandidate(job,candidate);
assert.ok(Math.abs(m.cosine-2/3)<1e-12);assert.equal(m.cosinePercent,67);assert.equal(m.coverage,40);assert.equal(m.rows[0].trace.jdTerm,'Excel');assert.equal(m.rows[0].trace.candidateIndex,0);assert.equal(m.rows[1].trace.candidateIndex,-1);
assert.ok(Math.abs(m.rows.reduce((sum,r)=>sum+(r.trace.contribution||0),0)-m.cosine)<1e-12);
assert.equal(matchCandidate(job,{...candidate,skills:[...candidate.skills,{name:'Cooking'}]}).cosine,m.cosine,'unrequested extra skills are not penalised');
assert.equal(matchCandidate(job,{...candidate,age:65,gender:'female',personality:{N:1},gameScore:999}).cosine,m.cosine,'protected or irrelevant traits are excluded');
assert.equal(matchCandidate(job,{skills:[{name:'Excel'},{name:'SQL'},{name:'Communication'}]}).cosine,1);
const unsafe=matchTraceView({skills:'<script>unsafe</script>',softSkills:''},{skills:[{name:'<script>unsafe</script>',example:'<img onerror=oops>'}]},'en');assert.ok(!unsafe.includes('<script>'));assert.ok(!unsafe.includes('<img onerror'));assert.ok(unsafe.includes('&lt;img'));
const rows=[{name:'A',label:'A',cv:true,a:{value:3},rating:3,importance:4,i:{id:'a'}},{name:'B',label:'B',cv:false,a:{value:2},rating:2,importance:1,i:{id:'b'}},{name:'C',label:'C',cv:false,a:null,rating:null,importance:5,i:{id:'c'}}],flow=evidenceFlow(rows);
assert.equal(flow.rows.length,2,'unasked skills do not acquire fake evidence flows');assert.equal(flow.profileUnits,1);assert.equal(flow.questionUnits,2);
for(const row of flow.rows){const incoming=flow.links.filter(l=>l.target===row.name).reduce((n,l)=>n+l.units,0),outgoing=flow.links.filter(l=>l.source===row.name).reduce((n,l)=>n+l.units,0);assert.equal(incoming,outgoing,'Sankey evidence units conserve per skill');}
assert.equal(flow.links.filter(l=>l.target==='career').reduce((n,l)=>n+l.units,0),2);assert.equal(flow.links.filter(l=>l.target==='additional').reduce((n,l)=>n+l.units,0),1);
const mixed=Array.from({length:12},(_,i)=>({name:String(i),i:{id:String(i)},cv:i>5,a:i<6?{}:null,importance:i<6?4:0}));const preview=evidenceFlow(mixed,6);assert.ok(preview.profileUnits>=2);assert.ok(preview.questionUnits>=2,'a six-skill preview represents both CV and answers');
const html=skillFlowHTML(rows,{title:'<role>'},{memory:{},switching:{},practiceMinutes:10},'zh');assert.ok(html.includes('&lt;role&gt;'));assert.ok(html.includes('data-flow-games'));assert.ok(!flow.links.some(l=>l.source==='games'));
console.log('PASS cosine math, trace provenance, sensitive-field invariance, HTML escaping and conserved Sankey records.');
