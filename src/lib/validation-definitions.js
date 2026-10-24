import {contentVersion} from '../integration-contract.js';
// Version manifest: changing a task, its translated instructions, materials or anchors
// requires a new task version. Never update these v1 fingerprints to hide a change.
export const VALIDATION_DEFINITIONS=Object.freeze({
 'formal-work-v1/resource-plan/A':'validation-definition:791606eb17916ca9',
 'formal-work-v1/resource-plan/B':'validation-definition:4eb719d309190ed7',
 'formal-work-v1/record-audit/A':'validation-definition:a6b2ec96859c49d4',
 'formal-work-v1/record-audit/B':'validation-definition:8583a466424654c0'
});
export function validationDefinitionMatches(record,task){return record.taskVersion===task.version&&record.rubricVersion===task.rubricVersion&&VALIDATION_DEFINITIONS[record.taskVersion+'/'+record.taskId+'/'+record.variant]===contentVersion(task,'validation-definition');}
