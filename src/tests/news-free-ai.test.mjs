import assert from 'node:assert/strict';
import {analyseArticle} from '../lib/news-ai.js';
const article={title:'Public training announcement',excerpt:'Training now includes clear written reports for accounts teams.',evidenceScope:'excerpt',source:'QA public source',date:new Date().toISOString(),url:'https://example.test/public',profile:'PRIVATE_SENTINEL',cv:'PRIVATE_SENTINEL'};
let calls=0;const never=async()=>{calls++;throw Error('unexpected request');};
const vars=['NEWS_AI_PROVIDER','GEMINI_FREE_TIER_CONFIRMED','GEMINI_FREE_MODEL','GEMINI_NEWS_API_KEY'],old=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
try{
 vars.forEach(k=>delete process.env[k]);
 await assert.rejects(analyseArticle(article,{fetcher:never}),e=>e.code==='free-ai-not-configured');assert.equal(calls,0);
 Object.assign(process.env,{NEWS_AI_PROVIDER:'gemini-free',GEMINI_FREE_TIER_CONFIRMED:'true',GEMINI_NEWS_API_KEY:'synthetic-test-key',GEMINI_FREE_MODEL:'paid-pro-model'});
 await assert.rejects(analyseArticle(article,{fetcher:never}),e=>e.code==='free-model-not-allowed');assert.equal(calls,0);
 process.env.GEMINI_FREE_MODEL='gemini-3.5-flash-lite';
 let seen;const output={summary:{zh:'合成测试',en:'Synthetic test',ms:'Ujian sintetik'},severity:'normal',reason:{zh:'培训更新',en:'Training update',ms:'Kemas kini latihan'},impacts:[]};
 const result=await analyseArticle(article,{fetcher:async(url,options)=>{calls++;seen={url,options};return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(output)}]}}],modelVersion:'gemini-3.1-flash-lite',usageMetadata:{promptTokenCount:80,candidatesTokenCount:30}});}});
 assert.equal(result.provider,'gemini-free');assert(seen.url.startsWith('https://generativelanguage.googleapis.com/'));assert(!seen.url.includes('synthetic-test-key'));assert.equal(seen.options.headers['x-goog-api-key'],'synthetic-test-key');assert(!seen.options.body.includes('PRIVATE_SENTINEL'));assert(!seen.options.body.includes('synthetic-test-key'));assert(!JSON.parse(seen.options.body).tools);assert.equal(result.usage.outputTokens,30);
 const before=calls;await assert.rejects(analyseArticle(article,{fetcher:async()=>{calls++;return Response.json({error:{}},{status:429});}}),e=>e.code==='free-ai-quota-reached');assert.equal(calls,before+1,'quota error must not retry or route to paid providers');
 await assert.rejects(analyseArticle(article,{fetcher:async()=>Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[]}}]})}),e=>e.code==='free-ai-incomplete');
 console.log('PASS free-only summary adapter: no Gateway/paid fallback, configuration gate, quota stop, secret headers, public-only prompt and structured output.');
}finally{for(const k of vars)old[k]===undefined?delete process.env[k]:process.env[k]=old[k];}
