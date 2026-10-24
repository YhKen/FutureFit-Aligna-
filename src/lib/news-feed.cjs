const sectors={technology:'technology software',finance:'finance accounting',health:'healthcare',education:'education teaching',manufacturing:'manufacturing',construction:'construction',logistics:'logistics transport',hospitality:'hospitality tourism',creative:'creative design media',sales:'retail sales marketing',agriculture:'agriculture farming',legal:'legal services',science:'science environment',service:'community social services',business:'business management'};
const xmlText=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function parseArticles(xml,sector,now=Date.now()){
 const get=(s,k)=>xmlText(s.match(new RegExp('<'+k+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+k+'>'))?.[1]||'');
 const seen=new Set();return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>({title:get(m[1],'title'),url:get(m[1],'link'),source:get(m[1],'source'),date:get(m[1],'pubDate'),sector})).filter(a=>{let u;try{u=new URL(a.url);}catch{return false;}const key=a.title.toLowerCase().trim();if(!key||u.protocol!=='https:'||!Number.isFinite(Date.parse(a.date))||now-Date.parse(a.date)>30*86400000||Date.parse(a.date)>now||seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,6).map(a=>({...a,date:new Date(a.date).toISOString(),excerpt:a.title,evidenceScope:'headline-only'}));
}
function createFeedService(fetcher=fetch){
 const cache=new Map(),pending=new Map();
 return async function trends(sector){
  if(!Object.hasOwn(sectors,sector))throw Error('invalid-sector');
  const old=cache.get(sector);if(old&&Date.now()-old.at<900000)return old.data;
  if(pending.has(sector))return pending.get(sector);
  const task=(async()=>{
   const url='https://news.google.com/rss/search?'+new URLSearchParams({q:sectors[sector]+' (skills OR training OR workforce) when:30d',hl:'en-MY',gl:'MY',ceid:'MY:en'});
   const r=await fetcher(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('source-unavailable');
   const xml=await r.text();if(xml.length>1500000)throw Error('feed-too-large');
   const data={articles:parseArticles(xml,sector),retrievedAt:new Date().toISOString(),source:'Google News public RSS; publisher links retained',query:sectors[sector]};cache.set(sector,{at:Date.now(),data});return data;
  })().finally(()=>pending.delete(sector));pending.set(sector,task);return task;
 };
}
module.exports={sectors,parseArticles,createFeedService};
