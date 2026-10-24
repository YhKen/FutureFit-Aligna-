import {firestoreStore,safeError} from './news-store.js';
const base='https://firestore.googleapis.com/v1/projects/project-d32d7/databases/(default)/documents';
const pack=v=>v===null?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}):Array.isArray(v)?{arrayValue:{values:v.map(pack)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,pack(x)]))}};
export function formalStore(token){
 const own=firestoreStore(token),headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 return {...own,
  async query(collection,filters){
   const r=await fetch(base+':runQuery',{method:'POST',headers,body:JSON.stringify({structuredQuery:{from:[{collectionId:collection}],where:{compositeFilter:{op:'AND',filters:Object.entries(filters).map(([k,v])=>({fieldFilter:{field:{fieldPath:k},op:'EQUAL',value:pack(v)}}))}},limit:30}}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw safeError('work-query-failed',r.status===403?403:503);const rows=await r.json();return Promise.all(rows.filter(r=>r.document).map(r=>own.get(collection+'/'+r.document.name.split('/').pop())));
  },
  async atomic(entries){
   const writes=entries.map(({path,data,updateTime,create=false,serverFields=[]})=>({update:{name:base.replace('https://firestore.googleapis.com/v1/','')+'/'+path,fields:Object.fromEntries(Object.entries(data).filter(([k,v])=>!['id','_updateTime'].includes(k)&&!serverFields.includes(k)&&v!==undefined).map(([k,v])=>[k,['createdAt','updatedAt','answeredAt','approvedAt','revokedAt','frozenAt','closedAt'].includes(k)&&v?{timestampValue:v}:pack(v)]))},currentDocument:create?{exists:false}:{updateTime},...(serverFields.length?{updateTransforms:serverFields.map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}:{})}));
   const r=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes}),signal:AbortSignal.timeout(15000)});if(!r.ok){const status=r.status===403?403:[409,412].includes(r.status)?409:503;throw safeError(status===403?'work-write-denied':status===409?'work-write-conflict':'work-storage-unavailable',status);}return Promise.all(entries.map(e=>own.get(e.path)));
  },
  async write(path,data,{updateTime,create=false,serverFields=[]}={}){
   const fields=Object.fromEntries(Object.entries(data).filter(([k,v])=>!['id','_updateTime'].includes(k)&&!serverFields.includes(k)&&v!==undefined).map(([k,v])=>[k,['createdAt','startedAt','updatedAt','submittedAt','approvedAt','revokedAt','answeredAt','frozenAt','closedAt'].includes(k)&&v?{timestampValue:v}:pack(v)]));
   const write={update:{name:base.replace('https://firestore.googleapis.com/v1/','')+'/'+path,fields},currentDocument:create?{exists:false}:{updateTime},...(serverFields.length?{updateTransforms:serverFields.map(fieldPath=>({fieldPath,setToServerValue:'REQUEST_TIME'}))}:{})};
   const r=await fetch(base+':commit',{method:'POST',headers,body:JSON.stringify({writes:[write]}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw safeError(r.status===409||r.status===412?'work-write-conflict':'work-write-failed',r.status===403?403:409);
   const saved=await own.get(path);if(!saved)throw safeError('work-save-not-confirmed');return saved;
  }
 };
}
