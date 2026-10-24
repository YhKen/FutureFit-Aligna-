import {createHash} from 'node:crypto';
import {z} from 'zod';
import bank from '../bank-v2.js';
import {groundedLearningImpact} from '../trend-evidence.js';
export const skillNames=bank.items.filter(i=>i.category==='skill').map(i=>i.name);
const translations=z.object({zh:z.string().min(1).max(650),en:z.string().min(1).max(650),ms:z.string().min(1).max(650)});
export const analysisSchema=z.object({summary:translations,severity:z.enum(['normal','major','uncertain']),reason:translations,impacts:z.array(z.object({skill:z.enum(skillNames),quote:z.string().min(8).max(220),rationale:translations,confidence:z.enum(['supported','tentative'])})).max(4)});
export const majorWords=/\b(layoffs?|redundan(?:t|cy)|job cuts?|mass unemployment|ban(?:ned)?|mandatory|new licen[cs]|licen[cs]ing requirements?|new regulation|regulatory change|industry[- ]wide|replace.{0,25}(jobs|workers))\b|裁员|强制|禁令|执业资格|行业重组|替代.{0,8}(岗位|工作)|pemecatan|diberhentikan|peraturan baharu/i;
export const careerRelevant=article=>/\b(skills?|training|workforce|employment|jobs?|labour|labor|vocational|upskill|reskill|career|qualifications?)\b|技能|培训|就业|岗位|职业|kemahiran|latihan|pekerjaan/i.test((article.title||'')+' '+(article.excerpt||''));
const learningEvidence=article=>/\b(skills?|training|upskill|reskill|learn(?:ing)?|qualifications?|competenc(?:e|ies))\b|技能|培训|学习|资格|kemahiran|latihan|pembelajaran/i.test(article.excerpt||'');
const decliningImpact=impact=>/decreas|declin|reduc|replac|shrinking|less need|减少|降低|取代|萎缩|menurun|berkurang|digantikan/i.test(impact.quote+' '+Object.values(impact.rationale||{}).join(' '));
export const usableImpact=groundedLearningImpact;
export function articleId(article){return createHash('sha256').update([article.title.toLowerCase().replace(/\s+/g,' ').trim(),article.source,article.date.slice(0,10)].join('|')).digest('hex');}
export function versionOf(items){return createHash('sha256').update('career-grounding-v2|'+items.map(i=>i.id+':'+i.publishedAt).sort().join('|')).digest('hex').slice(0,20);}
export function moderate(article,raw){const analysis=analysisSchema.parse(raw),text=(article.excerpt||article.title).replace(/\s+/g,' '),impacts=analysis.impacts.filter(i=>text.includes(i.quote.replace(/\s+/g,' '))).map(i=>({...i,usable:article.evidenceScope==='excerpt'&&i.confidence==='supported'&&learningEvidence(article)&&!decliningImpact(i)}));const requiresReview=analysis.severity!=='normal'||majorWords.test(article.title+' '+article.excerpt);return {...analysis,impacts,requiresReview,severity:requiresReview?'major':'normal',evidenceScope:article.evidenceScope};}
export function publishable(article){return careerRelevant(article)&&article.status==='published'&&!!article.analysis&&!!article.publishedAt&&(!article.analysis.requiresReview||article.review?.decision==='approve');}
export function routineDue(last,now){return !last||Date.parse(now)-Date.parse(last)>=3*86400000;}
export function relevantFactors(rows,articles){return rows.map(row=>{const sources=articles.filter(a=>publishable(a)&&a.analysis.impacts.some(i=>usableImpact(a,i)&&i.skill===row.name)).map(a=>({id:a.id,title:a.title,url:a.url,source:a.source,date:a.date,publishedAt:a.publishedAt,summary:a.analysis.summary,impact:a.analysis.impacts.find(i=>i.usable&&i.skill===row.name)}));const factor=1+Math.min(.3,sources.length*.1);return {...row,trendFactor:factor,adjustedPriority:row.priority*factor,trendEvidence:sources.slice(0,3)};}).sort((a,b)=>b.adjustedPriority-a.adjustedPriority||a.name.localeCompare(b.name));}
