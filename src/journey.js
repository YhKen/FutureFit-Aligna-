import bank from './bank-v2.js';
import {evidenceStandard} from './evidence-standard.js';
export function completedChallenge(record,session){
 if(!session?.completedAt||record?.version!==1||!Array.isArray(record.trials)||Date.parse(record.updatedAt)<Date.parse(session.completedAt))return false;
 if(!Number.isFinite(Date.parse(record.updatedAt))||!Number.isFinite(Date.parse(session.completedAt)))return false;
 return record.type==='memory'?record.trials.length===6&&record.summary?.targets===39:record.type==='switch'?record.trials.length===24&&record.summary?.total===24:false;
}
export function journeyProgress(sessions,games=[]){
 const session=sessions.find(s=>s.schemaVersion===2);
 const assessed=session?.status==='complete'&&session.responses?.length===session.totalQuestions&&session.totalQuestions>=30;
 const coverage=evidenceStandard(bank.items,session?.responses||[]);
 // Legacy records also need the published coverage standard. Missing routing
 // metadata must not provide a bypass for an incomplete older assessment.
 const covered=coverage.ready||coverage.atLimit;
 const done=new Set(assessed?['memory','switch'].filter(type=>games.some(g=>g.type===type&&completedChallenge(g,session))):[]);
 return {session,assessed:assessed&&covered,coverage,done,ready:assessed&&covered&&done.size===2};
}
export async function ensureSeekerReady(client){
 const sessions=await client.recent('sessions');
 const progress=journeyProgress(sessions,await client.recent('games',50));
 if(!progress.ready){location.replace(progress.assessed?'games.html?onboarding=1':'assessment.html?onboarding=1');throw Error('journey-required');}
 return progress;
}
