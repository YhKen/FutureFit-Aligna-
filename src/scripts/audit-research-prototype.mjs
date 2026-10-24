import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fixture,run} from '../research-prototype.js';
const data=fixture(),report=run(data),input={data,report};
const check=spawnSync(process.env.PYTHON_BINARY||'python',[fileURLToPath(new URL('../tests/research-prototype-independent.py',import.meta.url))],{input:JSON.stringify(input),encoding:'utf8'});
if(check.status!==0){process.stderr.write(check.stderr||check.stdout||'Independent checker failed');process.exit(1);}
const proof={version:report.version,synthetic:true,testedAt:new Date().toISOString(),...JSON.parse(check.stdout),eligiblePeople:report.eligiblePeople,groups:report.groups,model:report.model,evaluation:report.evaluation,rasch:report.rasch,professionalValidation:'pending',productionEnabled:false};
fs.writeFileSync(new URL('../docs/acceptance/research-prototype-proof.json',import.meta.url),JSON.stringify(proof,null,2)+'\n');
fs.writeFileSync(new URL('../docs/acceptance/research-prototype-SYNTHETIC.json',import.meta.url),JSON.stringify(input,null,2)+'\n');
console.log(JSON.stringify({passed:proof.passed,comparisons:proof.comparisons,eligiblePeople:proof.eligiblePeople,groups:proof.groups,synthetic:true,productionEnabled:false}));
