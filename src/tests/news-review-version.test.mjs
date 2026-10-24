import {test} from 'node:test';import assert from 'node:assert/strict';
import {reviewArticle} from '../lib/news-pipeline.js';
import {articleId,moderate} from '../lib/news-policy.js';
class Store{
 constructor(){this.rows=new Map();this.n=0;}
 async get(p){return structuredClone(this.rows.get(p)||null);}
 async list(p){return [...this.rows].filter(([k])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')).map(([,v])=>structuredClone(v));}
 async set(p,v){const row={...structuredClone(v),id:p.split('/').at(-1),_updateTime:String(++this.n)};this.rows.set(p,row);return row;}
 async commit(writes){for(const w of writes){const old=this.rows.get(w.path);if(w.updateTime&&w.updateTime!==old?._updateTime||w.exists===false&&old)throw Object.assign(Error('CAS conflict'),{status:409});}for(const w of writes)await this.set(w.path,w.data);}
}
const tri=s=>({zh:s,en:s,ms:s}),a={title:'SYNTHETIC mandatory training update',source:'Synthetic test source',url:'https://example.test/training',date:new Date().toISOString(),sector:'finance',excerpt:'Training requires clear written reports and a new qualification.',evidenceScope:'excerpt'};
async function seed(){const store=new Store(),id=articleId(a),analysis=moderate(a,{summary:tri('Synthetic only'),reason:tri('Synthetic only'),severity:'major',impacts:[{skill:'Writing',quote:'clear written reports',rationale:tri('Synthetic writing practice'),confidence:'supported'}]});await store.set('aligna_news_items/'+id,{...a,id,analysis,status:'pending',createdAt:new Date().toISOString(),publishedAt:null});return {store,id};}
test('stale review displays cannot approve a different article revision',async()=>{
 const {store,id}=await seed(),old=await store.get('aligna_news_items/'+id);await store.set('aligna_news_items/'+id,{...old,excerpt:old.excerpt+' Revised source.'});
 await assert.rejects(reviewArticle(store,{id,decision:'approve',reviewerUid:'unit-only',reason:'Synthetic review',expectedUpdateTime:old._updateTime}),e=>e.status===409);
 assert.equal((await store.get('aligna_news_items/'+id)).status,'pending');assert.equal((await store.list('aligna_news_audit')).length,0);
});
test('approve, retract and re-review preserve immutable audit events and rebuild the public catalogue',async()=>{
 const {store,id}=await seed();
 const decide=async decision=>reviewArticle(store,{id,decision,reviewerUid:'unit-only',reason:'Synthetic review only',expectedUpdateTime:(await store.get('aligna_news_items/'+id))._updateTime});
 await decide('approve');assert.equal((await store.get('aligna_news_public/finance')).articles.length,1);
 await assert.rejects(decide('approve'),e=>e.status===409);
 await decide('retract');assert.equal((await store.get('aligna_news_public/finance')).articles.length,0);assert.equal((await store.get('aligna_news_items/'+id)).status,'retracted');
 await decide('approve');assert.equal((await store.get('aligna_news_public/finance')).articles.length,1);assert.deepEqual((await store.list('aligna_news_audit')).map(x=>x.decision),['approve','retract','approve']);
});

test('approval rejects irrelevant legacy queue records instead of reporting a publication that never reaches the catalogue',async()=>{const {store,id}=await seed(),old=await store.get('aligna_news_items/'+id);await store.set('aligna_news_items/'+id,{...old,title:'Climate summit trust discussion',excerpt:'Representatives discussed trust at a climate summit.'});await assert.rejects(reviewArticle(store,{id,decision:'approve',reviewerUid:'unit-only',reason:'Synthetic review only',expectedUpdateTime:(await store.get('aligna_news_items/'+id))._updateTime}),e=>e.status===422);assert.equal((await store.get('aligna_news_items/'+id)).status,'pending');assert.equal((await store.list('aligna_news_audit')).length,0);});
