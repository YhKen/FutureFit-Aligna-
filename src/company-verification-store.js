import {COMPANY_VERSION,COMPANY_CHUNK_BYTES,cleanCompanyInput,companyFile} from './company-verification-core.js';
import {contentVersion} from './integration-contract.js';
function companyWait(promise){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error('deadline-exceeded'),{code:'deadline-exceeded'})),20000);})]).finally(()=>clearTimeout(timer));}
export async function companyState(c,uid=c.user.uid){const {F,db}=c,[a,b]=await companyWait(Promise.all([F.getDocFromServer(F.doc(db,'aligna_company_requests',uid)),F.getDocFromServer(F.doc(db,'aligna_company_reviews',uid))]));return {request:a.exists()?a.data():null,review:b.exists()?{...b.data(),expiresAt:b.data().expiresAt?.toDate?.().toISOString()||b.data().expiresAt}:null};}
export async function submitCompany(c,input,file){
 const details=cleanCompanyInput(input),f=await companyFile(file),chunks=[];
 for(let start=0;start<f.bytes.length;start+=COMPANY_CHUNK_BYTES){let binary='';for(const b of f.bytes.slice(start,start+COMPANY_CHUNK_BYTES))binary+=String.fromCharCode(b);chunks.push(btoa(binary));}
 const data={version:COMPANY_VERSION,ownerUid:c.user.uid,...details,fileHash:f.hash,fileName:f.name,fileBytes:f.size,fileChunks:chunks.length,requestVersion:contentVersion({details,fileHash:f.hash},'company'),status:'submitted',createdAt:c.F.serverTimestamp(),updatedAt:c.F.serverTimestamp()},batch=c.F.writeBatch(c.db);
 batch.set(c.F.doc(c.db,'aligna_company_requests',c.user.uid),data);
 chunks.forEach((body,i)=>batch.set(c.F.doc(c.db,'aligna_company_requests',c.user.uid,'documents',String(i)),{ownerUid:c.user.uid,fileHash:f.hash,index:i,body,createdAt:c.F.serverTimestamp()}));
 const confirmed=saved=>saved.request?.requestVersion===data.requestVersion&&saved.request?.fileHash===f.hash&&saved.request?.fileBytes===f.size&&saved.request?.fileChunks===chunks.length;
 const prior=await companyState(c);if(confirmed(prior))return prior;
 if(prior.request&&!(prior.review?.status==='needs_changes'&&prior.review.requestVersion===prior.request.requestVersion))throw Error('company-already-submitted');
 try{await companyWait(batch.commit());const saved=await companyState(c);if(!confirmed(saved))throw Error('save-not-confirmed');return saved;}catch(error){
  // A response can be lost after the atomic write succeeds. Read the exact version
  // back before offering another submission; never claim success for a different file.
  try{const saved=await companyState(c);if(confirmed(saved))return saved;}catch{}
  throw error;
 }
}
export async function loadCompanyPDF(c,uid,request){const chunks=await Promise.all(Array.from({length:request.fileChunks},(_,i)=>c.F.getDocFromServer(c.F.doc(c.db,'aligna_company_requests',uid,'documents',String(i)))));if(chunks.some(s=>!s.exists()||s.data().fileHash!==request.fileHash))throw Error('file-not-confirmed');const bytes=Uint8Array.from(chunks.map(s=>atob(s.data().body)).join(''),c=>c.charCodeAt(0)),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==request.fileHash||bytes.length!==request.fileBytes)throw Error('file-not-confirmed');return new Blob([bytes],{type:'application/pdf'});}
