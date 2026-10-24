const routes={hr:new Set(['employer.html','candidates.html','company.html']),seeker:new Set(['seeker.html','workspace.html','applications.html','assessment.html','games.html','jobs.html','growth.html','identity.html'])};
export function accountDestination(role,next){
 const fallback=role==='hr'?'employer.html':'seeker.html';if(typeof next!=='string'||next.length>800)return fallback;
 try{const u=new URL(next,'https://future-fit.invalid/'),path=u.pathname.slice(1);if(u.origin!=='https://future-fit.invalid'||u.username||u.password||!routes[role]?.has(path))return fallback;return path+u.search;}catch{return fallback;}
}
