// Shared integration contract. Production task content and reviewer UI are separate deliverables.
import {contentVersion,CONTRACT_VERSION} from './integration-contract.js';
import {skillId} from './skill-catalog.js';
export const TASK_POLICY_VERSION='bounded-work-task-v1';
const conditions=['independent','ai-assisted'];
export function startTask(definition,{condition,startedAt=new Date().toISOString()}={}){
 if(!definition?.id||!definition.version||!conditions.includes(condition)||!Number.isFinite(Date.parse(startedAt)))throw Error('invalid-task-start');
 if(!Array.isArray(definition.criteria)||!definition.criteria.length||definition.criteria.length>8||new Set(definition.criteria.map(c=>c.id)).size!==definition.criteria.length)throw Error('invalid-task-criteria');
 for(const criterion of definition.criteria)if(!criterion.id||!criterion.skill||!Array.isArray(criterion.anchors)||criterion.anchors.length!==3||criterion.anchors.some(a=>typeof a!=='string'||!a.trim()))throw Error('invalid-task-anchors');
 if(!Array.isArray(definition.learningRules)||definition.learningRules.some(r=>!r.unitId||!definition.criteria.some(c=>c.id===r.criterionId)||!conditions.includes(r.condition)))throw Error('invalid-learning-rules');
 const frozen=JSON.parse(JSON.stringify({schemaVersion:CONTRACT_VERSION,policyVersion:TASK_POLICY_VERSION,taskId:definition.id,taskVersion:definition.version,condition,startedAt,allowedTools:definition.allowedTools||[],criteria:definition.criteria.map(c=>({...c,skillId:skillId(c.skill)})),learningRules:definition.learningRules}));
 return {...frozen,rubricVersion:contentVersion(frozen,'task-start')};
}
export function evaluateTask(start,{rubricVersion,ratings,reviewerRole,reviewerId,reviewedAt=new Date().toISOString()}={}){
 const {rubricVersion:stored,...frozen}=start||{};
 if(stored!==rubricVersion||stored!==contentVersion(frozen,'task-start'))throw Error('rubric-changed');
 if(!['human-reviewer','self-review'].includes(reviewerRole)||!reviewerId||!Number.isFinite(Date.parse(reviewedAt))||Date.parse(reviewedAt)<Date.parse(start.startedAt))throw Error('invalid-task-reviewer');
 if(!Array.isArray(ratings)||ratings.length!==start.criteria.length||new Set(ratings.map(r=>r.criterionId)).size!==ratings.length)throw Error('incomplete-task-review');
 const evidence=start.criteria.map(c=>{const r=ratings.find(r=>r.criterionId===c.id);if(!r||![1,2,3,null].includes(r.score)||typeof r.observation!=='string'||(r.score!==null&&!r.observation.trim())||r.observation.length>1500)throw Error('invalid-task-rating');return {skillId:c.skillId,criterionId:c.id,score:r.score,observation:r.observation,sourceType:'work-task-review',condition:start.condition,reviewerRole,reviewerId,verification:reviewerRole==='human-reviewer'?'reviewer-reported-observation':'self-reviewed-not-independent',taskId:start.taskId,taskVersion:start.taskVersion,rubricVersion:stored,reviewedAt};});
 const actions=start.learningRules.map(rule=>{const r=evidence.find(e=>e.criterionId===rule.criterionId),supported=reviewerRole==='human-reviewer'&&r.score!==null&&r.score>=2&&rule.condition===start.condition;return {unitId:rule.unitId,skillId:r.skillId,action:supported?'eligible-to-skip-matched-intro-practice':'retain-and-clarify',reason:r.score===null?'not-observed':reviewerRole==='self-review'?'self-review-needs-confirmation':rule.condition!==start.condition?'tool-condition-not-covered':supported?'criterion-demonstrated-in-this-task':'practice-needed',evidenceId:contentVersion(r,'task-evidence'),requiresUserConfirmation:true,scope:'This named practice unit only; no qualification or hiring decision'};});
 return {schemaVersion:CONTRACT_VERSION,policyVersion:TASK_POLICY_VERSION,rubricVersion:stored,evidence,actions,changesJobMatchScore:false,changesGameOrPersonalityScores:false};
}
