export const COMPANY_VERSION='company-check-v1';
export const COMPANY_MAX_BYTES=2*1024*1024;
export const COMPANY_CHUNK_BYTES=240000;
export const COMPANY_STATES=['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'];
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
export const registrationKey=v=>String(v||'').toUpperCase().replace(/[\s()\-\/]/g,'');
export const companyNameKey=v=>String(v||'').normalize('NFKC').toUpperCase().replace(/[.,'’]/g,'').replace(/\s+/g,' ').trim();
const companyInput=raw=>({legalName:String(raw.legalName||'').trim(),registrationCode:String(raw.registrationCode||'').normalize('NFKC').trim().toUpperCase().replace(/[–—−]/g,'-'),country:raw.country,state:raw.state,city:String(raw.city||'').trim(),registeredAddress:String(raw.registeredAddress||'').trim(),workEmail:String(raw.workEmail||'').trim().toLowerCase(),authorityNote:String(raw.authorityNote||'').trim(),synthetic:raw.synthetic===true});
export function companyInputIssues(raw){const v=companyInput(raw),issues=[];for(const [field,max] of [['legalName',150],['city',100],['registeredAddress',500],['authorityNote',800]])if(!text(v[field],max))issues.push({field,code:v[field]?'too-long':'required'});if(!/^[A-Z0-9()\-/ ]{5,40}$/.test(v.registrationCode))issues.push({field:'registrationCode',code:'registration'});if(v.country!=='MY')issues.push({field:'country',code:'country'});if(!COMPANY_STATES.includes(v.state))issues.push({field:'state',code:'required'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.workEmail)||v.workEmail.length>180)issues.push({field:'workEmail',code:'email'});if(v.synthetic&&!v.legalName.startsWith('SYNTHETIC QA'))issues.push({field:'legalName',code:'synthetic-label-required'});return issues;}
export function cleanCompanyInput(raw){const issues=companyInputIssues(raw);if(issues.length)throw Object.assign(Error(issues[0].code==='synthetic-label-required'?'synthetic-label-required':'company-incomplete'),{issues});return companyInput(raw);}
export function companyFileIssue(file){if(!file)return 'company-file-missing';if(file.size>COMPANY_MAX_BYTES)return 'company-file-size';if(file.size<5)return 'company-file-empty';if(!/\.pdf$/i.test(file.name)||!['','application/pdf','application/octet-stream'].includes(file.type))return 'company-file-type';return '';}
export function officialRegistryURL(value){try{const u=new URL(value);return u.protocol==='https:'&&['ssm.com.my','www.ssm.com.my','ssm-einfo.my','www.ssm-einfo.my','mydata-ssm.com.my','www.mydata-ssm.com.my','ssmsearch.com','www.ssmsearch.com','safedata-ssm.com','www.safedata-ssm.com'].includes(u.hostname)&&!u.username&&!u.password;}catch{return false;}}
export function compareCompanyRegistry(input,record){
 const v=cleanCompanyInput(input),fields={name:companyNameKey(v.legalName)===companyNameKey(record.legalName),registration:registrationKey(v.registrationCode)===registrationKey(record.registrationCode),country:v.country===record.country,state:companyNameKey(v.state)===companyNameKey(record.state),city:companyNameKey(v.city)===companyNameKey(record.city),address:companyNameKey(v.registeredAddress)===companyNameKey(record.registeredAddress)};
 return {fields,allMatch:Object.values(fields).every(Boolean),registrySourceAllowed:officialRegistryURL(record.sourceURL),scope:'Field consistency only; not document authenticity or proof that the applicant represents the company'};
}
export function currentCompanyReview(request,review){return request&&review&&request.requestVersion===review.requestVersion?review:null;}
export function companyAccess(request,review,now=Date.now()){
 if(!request||!review||review.requestVersion!==request.requestVersion||!Number.isFinite(Date.parse(review.expiresAt))||Date.parse(review.expiresAt)<=now)return 'pending';
 if(review.status==='sandbox'&&request.synthetic)return 'sandbox';
 return review.status==='approved'&&!request.synthetic&&review.registryMatched===true&&review.authorityConfirmed===true&&review.documentChecked===true?'verified':'pending';
}
export async function companyFile(file){
 const issue=companyFileIssue(file);if(issue)throw Error(issue);
 const bytes=new Uint8Array(await file.arrayBuffer());if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('company-file-type');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 return {bytes,hash,name:file.name.slice(0,150),size:bytes.length};
}
