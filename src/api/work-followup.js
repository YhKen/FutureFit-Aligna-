import {verifyCaller} from '../lib/news-store.js';
import {formalStore} from '../lib/formal-work-store.js';
import {followupContext,reviewerContext,followupAction} from '../lib/work-followup.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const error=e=>Response.json({error:e.code||'work-unavailable'},{status:e.status||503,headers});
export async function GET(request){try{const user=await verifyCaller(request),q=new URL(request.url).searchParams,store=formalStore(user.token);return Response.json(q.has('reviewer')?await reviewerContext(store,user,q.get('request')):await followupContext(store,user,q.get('application')),{headers});}catch(e){return error(e);}}
export async function POST(request){try{const user=await verifyCaller(request),raw=await request.text();if(raw.length>24000)return Response.json({error:'work-request-too-large'},{status:413,headers});let body;try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return Response.json({error:'invalid-json'},{status:400,headers});}return Response.json(await followupAction(formalStore(user.token),user,body),{headers});}catch(e){return error(e);}}
