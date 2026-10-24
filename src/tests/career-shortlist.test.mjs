import assert from 'node:assert/strict';
import {careerPage,interestChart} from '../career-shortlist.js';
import {careerOverviewHTML} from '../career-overview.js';
import {skillFlowHTML} from '../skill-flow.js';
const ranked=Array.from({length:13},(_,i)=>({job:{id:String(i),title:i<7?'Accountant '+i:'Teacher '+i,description:'A synthetic role',skills:{A:{IM:3}},interests:{conventional:4,social:3}},score:13-i}));
assert.deepEqual(careerPage(ranked).rows,ranked.slice(0,5));assert.deepEqual(careerPage(ranked,'',1).rows,ranked.slice(5,10));assert.equal(careerPage(ranked,'',2).rows.length,3);assert.equal(careerPage(ranked,'',999).index,2);assert.equal(careerPage(ranked,'',-1).index,0);assert.equal(careerPage(ranked,'会计').total,7);assert.equal(careerPage(ranked,'ACCOUNTANT').rows.length,5);assert.equal(careerPage(ranked,'Teacher',1).rows.length,1);assert.equal(careerPage(ranked,'nonsense').rows.length,0);
const missing={job:{id:'missing',title:'Missing skills',skills:{}},score:100};assert.equal(careerPage([missing,...ranked]).rows[0].job.id,'0');assert.equal(careerPage([missing,...ranked],'Missing skills').rows[0].job.id,'missing','explicit searches can still find occupations with missing reference data');
assert.equal(careerPage([{job:{id:'ad',title:'Advertising Manager',description:'Accountable for budgets',skills:{A:{IM:3}}}}],'会计').rows.length,0,'career-name search must not match incidental description words');
const rows=[{name:'A',label:'A <script>',i:{id:'skill-A'},cv:true,a:{value:4},rating:4,importance:3}],e={answers:[],memory:{},switching:{},practiceMinutes:10,forJob:()=>({required:rows,recorded:1})};
for(const lang of ['zh','en','ms']){
 const html=careerOverviewHTML(rows,ranked,e,lang,'0');assert.equal((html.match(/data-recommended-role=/g)||[]).length,5);assert.ok(html.includes('1/1'));assert.ok(html.includes('data-flow-skill'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('data-flow-games'));
 const flow=skillFlowHTML(rows,ranked[0].job,e,lang);assert.ok(!flow.includes('flow-node flow-additional'),'empty additional branch must be omitted');assert.equal((flow.match(/data-flow-for=/g)||[]).length,3);assert.ok(flow.includes('flow-readable'));assert.ok(!flow.includes('<script>'));
}
const chart=interestChart({'interest:a':{mean:4}},['a','b'],['A','B'],'en');assert.ok(chart.includes('width:75%'));assert.ok(chart.includes('—'));
console.log('PASS five-role paging, 3-role final group, multilingual career search, empty queries, trace visibility, no empty Sankey branch and HTML escaping.');
