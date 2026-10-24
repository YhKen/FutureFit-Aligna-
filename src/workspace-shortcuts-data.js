export const SHORTCUT_VERSION='workspace-shortcuts-v1';
export const shortcuts=[
 {id:'assessment',url:'assessment.html?view=results',icon:'◎',label:['我的测评','My assessment','Penilaian saya']},
 {id:'games',url:'games.html',icon:'▦',label:['两个小挑战','Two challenges','Dua cabaran']},
 {id:'growth',url:'growth.html',icon:'↗',label:['我的学习路线','My learning plan','Pelan pembelajaran saya']},
 {id:'transition',url:'transition.html',icon:'⇄',label:['转行规划','Career change','Tukar kerjaya']},
 {id:'life-skills',url:'life-skills.html',icon:'◈',label:['经历里的技能','Skills in my experience','Kemahiran pengalaman']},
 {id:'career-try',url:'career-try.html',icon:'✧',label:['职业试穿','Try a career','Cuba kerjaya']},
 {id:'ai-trends',url:'ai-trends.html',icon:'◌',label:['行业与技能趋势','Industry & skill outlook','Trend industri & kemahiran']},
 {id:'study-calendar',url:'study-calendar.html',icon:'▤',label:['我的学习班表','My study schedule','Jadual belajar saya']},
 {id:'reflection',url:'application-reflection.html',icon:'↶',label:['申请复盘','Application reflection','Refleksi permohonan']},
 {id:'portfolio',url:'portfolio-careers.html',icon:'◇',label:['组合工作','Combine roles','Gabung kerja']},
 {id:'jobs',url:'jobs.html',icon:'▣',label:['找工作','Find work','Cari kerja']},
 {id:'applications',url:'applications.html',icon:'☷',label:['申请与面试','Applications & interviews','Permohonan & temu duga']}
];
export function cleanShortcutIds(ids){if(!Array.isArray(ids)||ids.length!==4||new Set(ids).size!==4||ids.some(id=>!shortcuts.some(s=>s.id===id)))throw Error('invalid-shortcuts');return [...ids];}
export function toggleShortcut(ids,id){if(!shortcuts.some(s=>s.id===id))throw Error('invalid-shortcut');return ids.includes(id)?ids.filter(x=>x!==id):ids.length<4?[...ids,id]:[...ids];}
export const shortcutRevision=value=>value?.updatedAt?.toMillis?.()??null;
export async function loadShortcuts(c){const snap=await c.F.getDocFromServer(c.F.doc(c.db,'aligna_users',c.user.uid,'preferences','workspace'));if(!snap.exists())return null;const value=snap.data();if(value.version!==SHORTCUT_VERSION)throw Error('invalid-shortcuts');cleanShortcutIds(value.ids);return value;}
export async function saveShortcuts(c,ids,expectedRevision){const next=cleanShortcutIds(ids),ref=c.F.doc(c.db,'aligna_users',c.user.uid,'preferences','workspace');await c.F.runTransaction(c.db,async tx=>{const snap=await tx.get(ref),old=snap.exists()?snap.data():null;if(shortcutRevision(old)!==expectedRevision)throw Error('shortcuts-stale');tx.set(ref,{version:SHORTCUT_VERSION,ids:next,updatedAt:c.F.serverTimestamp()});});const saved=await loadShortcuts(c);if(!saved||JSON.stringify(saved.ids)!==JSON.stringify(next))throw Error('shortcuts-not-confirmed');return saved;}
