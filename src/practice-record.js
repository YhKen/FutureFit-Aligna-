import {evaluateBudgetTask,evaluateHandoverTask,H03_PRACTICE_BLUEPRINTS} from './task-rules.js';
import {SEEKER_VERSION} from './seeker-records.js';
export function practiceResult(taskId,answers){
 if(taskId==='task-budget-tradeoff')return evaluateBudgetTask(answers.selected,answers.infeasible,answers.explanation,answers.followUp,answers.maximum===''?null:Number(answers.maximum));
 if(taskId==='task-delivery-handover')return evaluateHandoverTask({sum:answers.sum,mismatch:answers.mismatch,explanation:answers.explanation});
 throw Error('unknown-task');
}
export function practiceRecord({id,taskId,condition='independent',locale='en',answers,goalId='',createdAt=new Date().toISOString()}){
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(id)||!['independent','ai-assisted'].includes(condition)||!['zh','en','ms'].includes(locale)||!Number.isFinite(Date.parse(createdAt)))throw Error('invalid-practice');
 for(const key of ['explanation','verification'])if(typeof answers[key]!=='string'||answers[key].length>4000)throw Error('invalid-practice-text');
 return {version:SEEKER_VERSION,attemptId:id,taskId,formVersion:H03_PRACTICE_BLUEPRINTS.version,sourceType:'public-self-practice',verified:false,condition,locale,goalId,answers:structuredClone(answers),result:practiceResult(taskId,answers),createdAt,updatedAt:createdAt};
}
export function practiceSuggestion(record){
 const passed=record.result.numericPassed;
 return {skillName:record.taskId==='task-budget-tradeoff'?'Management of Financial Resources':'Critical Thinking',topic:record.taskId==='task-budget-tradeoff'?(passed?'explain-tradeoffs':'check-constraints'):(passed?'verify-records':'reconcile-totals'),needsHumanReview:true,skipLearning:false,changesMatchScore:false,condition:record.condition};
}
