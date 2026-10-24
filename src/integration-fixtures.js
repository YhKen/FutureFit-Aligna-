// Explicitly synthetic fixtures for team contracts, never auto-loaded as a real profile.
import {startTask} from './work-task-contract.js';
export const fixtureVersion='team-fixtures-v1';
export const syntheticCandidate={id:'S001',synthetic:true,displayName:'S001 - synthetic career transition',skills:[{name:'Microsoft Excel',example:'Synthetic workbook: checked totals and missing rows.'},{name:'Active Listening',example:'Synthetic service handover with confirmed needs.'}]};
export const syntheticRoles=[
 {id:'43-3031.00',jobTitle:'Bookkeeping, Accounting, and Auditing Clerks',skills:'Microsoft Excel, Mathematics',softSkills:'Active Listening',reference:'https://www.onetonline.org/link/summary/43-3031.00'},
 {id:'43-4051.00',jobTitle:'Customer Service Representatives',skills:'Service Orientation',softSkills:'Active Listening, Speaking',reference:'https://www.onetonline.org/link/summary/43-4051.00'},
 {id:'13-1082.00',jobTitle:'Project Management Specialists',skills:'Time Management, Coordination',softSkills:'Active Listening',reference:'https://www.onetonline.org/link/summary/13-1082.00'}
];
export const syntheticTasks=[
 {id:'fixture-table-check',version:'synthetic-v1',synthetic:true,allowedTools:['provided synthetic table'],criteria:[{id:'check',skill:'Mathematics',anchors:['Needs help checking totals','Independently checks totals and flags missing rows','Explains checks, verifies exceptions and records limitations']}],learningRules:[{criterionId:'check',unitId:'fixture-table-check-intro',condition:'independent'}]},
 {id:'fixture-handover',version:'synthetic-v1',synthetic:true,allowedTools:['provided synthetic customer message'],criteria:[{id:'clarify',skill:'Active Listening',anchors:['Misses the requested action','Separates the request from assumptions and asks a relevant question','Confirms priorities, uncertainty and next action with reasons']}],learningRules:[{criterionId:'clarify',unitId:'fixture-needs-clarification-intro',condition:'independent'}]}
];
export const startedSyntheticTask=()=>startTask(syntheticTasks[0],{condition:'independent',startedAt:'2026-10-21T00:00:00.000Z'});
