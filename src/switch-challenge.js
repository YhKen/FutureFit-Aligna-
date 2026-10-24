export const SWITCH_PROTOCOL='adult-challenge-v3';
export const SWITCH_BLOCKS=[{name:'steady',deadlineMs:4000},{name:'quicker',deadlineMs:2800},{name:'sprint',deadlineMs:1800}];
export function paceForRound(round){return round<2?{name:'practice',deadlineMs:5000}:SWITCH_BLOCKS[Math.min(2,Math.floor((round-2)/8))];}
export function expectedResponse(rule,colour,shape,reversed){const answer=rule==='shape'?shape:colour;return reversed?3-answer:answer;}
const median=a=>{if(a.length<3)return null;const s=[...a].sort((a,b)=>a-b),n=s.length;return Math.round(n%2?s[n>>1]:(s[n/2-1]+s[n/2])/2);};
export function switchSummary(trials){
 const valid=trials.filter(t=>t.correct&&!t.reversed&&!t.timeout&&t.rtMs>=150&&t.rtMs<=t.deadlineMs);
 const repeat=median(valid.filter(t=>t.switched===false).map(t=>t.rtMs)),switched=median(valid.filter(t=>t.switched===true).map(t=>t.rtMs));
 return {protocol:SWITCH_PROTOCOL,correct:trials.filter(t=>t.correct).length,total:trials.length,repeatMedianMs:repeat,switchMedianMs:switched,switchCostMs:repeat===null||switched===null?null:switched-repeat,timingTrials:valid.length,medianMs:median(trials.filter(t=>t.correct&&!t.timeout&&t.rtMs>=150&&t.rtMs<=t.deadlineMs).map(t=>t.rtMs)),timeouts:trials.filter(t=>t.timeout).length,anticipations:trials.filter(t=>!t.timeout&&t.rtMs<150).length,reverseCorrect:trials.filter(t=>t.reversed&&t.correct).length,reverseTotal:trials.filter(t=>t.reversed).length,blocks:SWITCH_BLOCKS.map(block=>{const rows=trials.filter(t=>t.block===block.name);return {...block,total:rows.length,correct:rows.filter(t=>t.correct).length,medianMs:median(rows.filter(t=>t.correct&&!t.timeout&&t.rtMs>=150&&t.rtMs<=t.deadlineMs).map(t=>t.rtMs))};})};
}
