// Shared browser/server evidence gate. A headline or article count is not demand evidence.
export const TREND_POLICY_VERSION='grounded-learning-evidence-v1';
const learning=/\b(skills?|training|upskill|reskill|learn(?:ing)?|qualifications?|competenc(?:e|ies))\b|技能|培训|学习|资格|kemahiran|latihan|pembelajaran/i;
const declining=/decreas|declin|reduc|replac|shrinking|less need|减少|降低|取代|萎缩|menurun|berkurang|digantikan/i;
const normalized=text=>String(text||'').replace(/\s+/g,' ').trim();
export function groundedLearningImpact(article,impact){
 const excerpt=normalized(article.excerpt),quote=normalized(impact.quote);
 return article.evidenceScope==='excerpt'&&impact.usable===true&&impact.confidence==='supported'&&quote.length>=8&&excerpt.includes(quote)&&learning.test(excerpt)&&!declining.test(quote+' '+Object.values(impact.rationale||{}).join(' '));
}
export function publishedLearningEvidence(articles,{country='MY',now=Date.now()}={}){
 const seen=new Set(),out=[];
 for(const a of articles||[]){
  const date=Date.parse(a.date),published=Date.parse(a.publishedAt);let url;
  try{url=new URL(a.url);if(url.protocol!=='https:'||url.username||url.password)continue;}catch{continue;}
  if(a.status!=='published'||!a.analysis||a.analysis.requiresReview&&a.review?.decision!=='approve'||a.jurisdiction&&a.jurisdiction!==country||!Number.isFinite(date)||date>now||now-date>30*86400000||!Number.isFinite(published)||published>now)continue;
  for(const impact of a.analysis.impacts||[]){
   if(!groundedLearningImpact(a,impact))continue;
   const key=url.href+'|'+impact.skill;if(seen.has(key))continue;seen.add(key);
   out.push({articleId:a.id||url.href,skill:impact.skill,quote:impact.quote,rationale:impact.rationale,url:url.href,title:a.title,source:a.source,date:a.date,publishedAt:a.publishedAt});
  }
 }
 return out;
}
