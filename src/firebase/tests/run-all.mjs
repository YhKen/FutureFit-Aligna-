// Rule-loading suites must run sequentially against the same local emulator.
import {spawnSync} from 'node:child_process';import path from 'node:path';import {fileURLToPath} from 'node:url';
const directory=process.env.FUTUREFIT_RULE_TEST_DIRECTORY||path.dirname(fileURLToPath(import.meta.url));
for(const file of ['rules.test.mjs','applications.test.mjs','h01-rules.test.mjs','seeker-rules.test.mjs','news-rules.test.mjs','formal-work-rules.test.mjs','work-followup-rules.test.mjs','h06-rules.test.mjs','validation-rules.test.mjs','exploration-rules.test.mjs','career-tools-rules.test.mjs','company-interview-rules.test.mjs','workspace-shortcuts-rules.test.mjs','research-prototype-rules.test.mjs']){
 const result=spawnSync(process.execPath,[path.join(directory,file)],{cwd:directory,env:process.env,stdio:'inherit'});
 if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
console.log('All fourteen Firestore rule suites passed.');
