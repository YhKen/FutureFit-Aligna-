import {verifyCaller,safeError} from '../lib/news-store.js';
import {formalStore} from '../lib/formal-work-store.js';
import {workContext,workAction} from '../lib/formal-work-service.js';
const reply=value=>Response.json(value,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function failure(e){console.error('futurefit-work-samples',e.code||e.name);return Response.json({error:e.code||'work-unavailable'},{status:e.status||503,headers:{'Cache-Control':'no-store'}});}
export async function GET(request){try{const user=await verifyCaller(request);return reply(await workContext(formalStore(user.token),user,new URL(request.url).searchParams.get('application')));}catch(e){return failure(e);}}
export async function POST(request){try{const user=await verifyCaller(request),text=await request.text();if(text.length>24000)throw safeError('work-request-too-large',413);let body;try{body=JSON.parse(text);}catch{throw safeError('invalid-json',400);}return reply(await workAction(formalStore(user.token),user,body));}catch(e){return failure(e);}}
