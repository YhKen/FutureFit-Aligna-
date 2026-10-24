import {verifyCaller} from '../lib/news-store.js';
import {formalStore} from '../lib/formal-work-store.js';
import {researchAction,researchContext} from '../lib/research-prototype-service.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},error=e=>Response.json({error:e.code||'prototype-unavailable'},{status:e.status||503,headers});
export async function GET(request){try{const user=await verifyCaller(request),q=new URL(request.url).searchParams;user.requestedRole=q.get('role');return Response.json(await researchContext(formalStore(user.token),user,q.get('application')),{headers});}catch(e){return error(e);}}
export async function POST(request){try{const user=await verifyCaller(request),raw=await request.text();if(raw.length>5000)throw Object.assign(Error(),{code:'prototype-request-too-large',status:413});let body;try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{throw Object.assign(Error(),{code:'invalid-json',status:400});}return Response.json(await researchAction(formalStore(user.token),user,body),{headers});}catch(e){return error(e);}}
