import {mapping,summarize} from './engine-v2.js';
import {profileEntries} from './profile-fields.js';
import {priorities} from './career-growth.js';
import {completedChallenge} from './journey.js';
export function integrateEvidence(items,session,jobs,games=[]){
 const answers=session?.responses||[],profile=session?.profile||{},skills=items.filter(i=>i.category==='skill');
 const confirmed=new Set(profile.confirmedSkills||[]),stats=summarize(items,answers);
 const completed=games.filter(g=>completedChallenge(g,session));
 const latest=type=>completed.filter(g=>g.type===type).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]||null;
 const memory=latest('memory'),switching=latest('switch');
 const recall=memory?memory.summary.hits/Math.max(1,memory.summary.targets):null;
 const accuracy=switching?switching.summary.correct/24:null;
 const timeouts=switching?.summary.timeouts||0;
 const slowerPractice=(recall!==null&&recall<.75)||(accuracy!==null&&accuracy<.75)||timeouts>=3;
 const rows=skills.map(i=>({i,a:answers.find(a=>a.itemId===i.id)||null,cv:confirmed.has(i.name)}));
 return {profile,answers,rows,confirmed:[...confirmed],education:profileEntries(profile.education,'education').filter(x=>Object.values(x).some(Boolean)),experience:profileEntries(profile.experience,'experience').filter(x=>Object.values(x).some(Boolean)),stats,careerOptions:mapping(items,answers,jobs),memory,switching,recall,accuracy,practiceMinutes:slowerPractice?10:20,
 forJob(job){
  const required=rows.filter(x=>job.skills[x.i.name]?.IM>=2.5).sort((a,b)=>job.skills[b.i.name].IM-job.skills[a.i.name].IM).slice(0,8);
  const gaps=priorities(items,answers,job).map(g=>({...g,cv:confirmed.has(g.i.name),priority:g.priority * (confirmed.has(g.i.name) && !g.a ? 0.9 : 1)}));
  // A CV claim can guide follow-up, but never substitutes for a rated answer.
  return {required,hasSkillData:required.length>0,recorded:required.filter(x=>x.cv||x.a).length,gaps:gaps.sort((a,b)=>b.priority-a.priority).slice(0,3)};
 }};
}
