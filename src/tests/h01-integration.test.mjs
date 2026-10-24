import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRequirements,matchingBasisFromJob,snapshotJob,applicationJob} from '../job-requirements.js';
import {jobVersionFields} from '../jobs-api.js';
import {skillId,matchCandidate} from '../match-engine.js';
import {jdMatchTraceView} from '../match-trace-panel.js';
const row=(name,type='professional',requirement='entry_required')=>({skillId:skillId(name),label:{en:name,zh:name,ms:name},type,requirement,observableBehavior:'Explain a synthetic work example.',allowedEvidence:['work_sample','interview']});
const requirements=validateRequirements({skills:[row('Microsoft Excel'),row('SQL','professional','trainable'),row('Communication','collaboration')],workOutputs:[{id:'output-1',description:'Produce and explain a reconciled workbook.',skillIds:[skillId('Microsoft Excel'),skillId('Communication')]}],qualifications:[],workConditions:{location:{value:'Kuala Lumpur',status:'specified'},salary:{min:3000,max:4000,currency:'MYR',period:'monthly'},workArrangement:{mode:'hybrid',schedule:'Monday-Friday'}}});
const job={id:'h01-synthetic-job',jobTitle:'Synthetic Operations Assistant',salary:3000,jobDescription:'Synthetic only',jobField:'Operations',location:'Kuala Lumpur',skills:'Legacy ignored skill',softSkills:'Legacy ignored collaboration',jobRequirements:'Synthetic requirements',futureSkills:'Learning',employmentType:'Full-time',employeeCount:1,workingTime:'Monday-Friday',jobSchemaVersion:2,requirementsVersion:1,requirements};
const candidate={skills:[{name:'Excel',example:'Synthetic reconciled workbook.'},{name:'沟通',example:'Synthetic handover.'}]};

test('structured H01 skills drive both percentages; entry status does not change skill type weights',()=>{
 const m=matchCandidate(job,candidate);assert.equal(m.coverage,60);assert.ok(Math.abs(m.cosine-Math.sqrt(5/9))<1e-12);assert.deepEqual(m.vectors.jd,[2,2,1]);assert.equal(m.rows[1].requirementLevel,'trainable');assert.equal(m.rows[1].kind,'required');assert.equal(m.rows[2].kind,'preferred');assert.ok(m.rows.every(r=>r.trace.jdField==='requirements.skills'));
 for(const locale of ['zh','en','ms'])for(const audience of ['hr','seeker']){const html=jdMatchTraceView(job,candidate,locale,{audience});assert.ok(html.includes('60%'));assert.ok(html.includes('75%'));assert.ok(html.includes(m.context.inputVersion));assert.ok(html.includes('entry')||locale!=='en');}
 assert.equal(matchCandidate(job,{skills:[...candidate.skills,...candidate.skills]}).coverage,60);
});
test('applications freeze the complete public posting and preserve both-side calculations after edit or close',()=>{
 const app={jobId:job.id,jobSnapshot:snapshotJob(job),...matchingBasisFromJob(job)},before=matchCandidate(applicationJob(app,job),candidate);
 const edited={...job,status:'closed',requirementsVersion:2,requirements:validateRequirements({...requirements,skillTypes:undefined,entryLevels:undefined,workOutputs:[],skills:[row('Python')]})};
 for(const current of [edited,null]){const after=matchCandidate(applicationJob(app,current),candidate);assert.deepEqual(after,before);assert.ok(after.context.jobSnapshotPolicy.startsWith('frozen-at-application'));}
 assert.equal(before.rows.length,3);assert.equal(matchCandidate(edited,candidate).coverage,0);assert.notEqual(matchCandidate(edited,candidate).context.inputVersion,before.context.inputVersion);
 assert.equal(applicationJob({jobId:job.id},edited),edited);
});
test('no-op and publish-only saves keep the version; changing any public requirement increments it',()=>{
 assert.equal(jobVersionFields(job,job).requirementsVersion,1);
 assert.equal(jobVersionFields(job,{...job,status:'published'}).requirementsVersion,1);
 for(const change of [{salary:3500},{jobTitle:'Different title'},{requirements:validateRequirements({...requirements,skillTypes:undefined,entryLevels:undefined,skills:[...requirements.skills.slice(0,2),row('Communication','collaboration','trainable')]})}])assert.equal(jobVersionFields(job,{...job,...change}).requirementsVersion,2);
 assert.equal(jobVersionFields({},job).requirementsVersion,1);assert.deepEqual(jobVersionFields({},{skills:'Excel'}),{});
});
test('duplicate aliases, fabricated IDs, dangling outputs and unsupported evidence are rejected',()=>{
 assert.throws(()=>validateRequirements({...requirements,skills:[row('Excel'),row('Microsoft Excel')]}));
 assert.throws(()=>validateRequirements({...requirements,skills:[{...row('Excel'),skillId:'skill:SQL'}]}));
 assert.throws(()=>validateRequirements({...requirements,workOutputs:[{id:'bad',description:'Example',skillIds:['missing']}]}));
 assert.throws(()=>validateRequirements({...requirements,skills:[{...row('Excel'),allowedEvidence:['raw_game_trials']}]}));
 assert.throws(()=>validateRequirements({...requirements,qualifications:[{name:'Exam',issuer:'Example',region:'MY',sourceUrl:'',verificationStatus:'verified'}]}));
 assert.equal(matchCandidate({...job,requirements:{...requirements,skills:[null]}},candidate).coverage,null);
});
test('work-condition-only records do not erase legacy skills or invent entry requirements',()=>{
 const r=validateRequirements({...requirements,skillTypes:undefined,entryLevels:undefined,skills:[],workOutputs:[]}),j={...job,skills:'Excel, SQL',softSkills:'Communication',requirements:r};const basis=matchingBasisFromJob(j);
 assert.equal(basis.matchingBasis.schema,'legacy-v1');assert.equal(basis.matchingBasis.legacySkills,'Excel, SQL');assert.equal(matchCandidate(j,candidate).coverage,60);assert.equal(matchCandidate(j,candidate).rows[0].requirementLevel,undefined);
});
