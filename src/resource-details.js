const sources={
 openlearn:'https://www.open.edu/openlearn/about-openlearn/frequently-asked-questions-on-openlearn',
 hubspot:'https://academy.hubspot.com/courses/inbound-sales',
 microsoft:'https://learn.microsoft.com/en-gb/credentials/certifications/frequently-asked-questions',
 acca:'https://www.accaglobal.com/sg/en/qualifications/accountancy-career/fees/fees-charges.html'
};
export const resourceVerificationDate='2026-10-22';
export function resourceDetails(r,{country='MY',learningLanguage='en'}={}){
 let provider='Publisher',cost='unknown',kind=r.kind==='exam'?'professional-qualification':'learning-resource',prerequisite='check-provider',source=r.url;
 const u=new URL(r.url);
 if(u.hostname==='www.open.edu'&&u.pathname.startsWith('/openlearn/')){provider='The Open University';cost='free';kind='non-credit-learning';prerequisite='check-course-level';source=sources.openlearn;}
 if(u.hostname==='academy.hubspot.com'&&u.pathname.startsWith('/courses/inbound-sales')){provider='HubSpot Academy';cost='free';kind='vendor-certificate';prerequisite='free-provider-account';source=sources.hubspot;}
 if(u.hostname==='learn.microsoft.com'){provider='Microsoft';kind=r.kind==='exam'?'professional-qualification':'learning-resource';cost=r.kind==='exam'?'paid-country-dependent':'unknown';source=sources.microsoft;}
 if(u.hostname.endsWith('accaglobal.com')){provider='ACCA';cost='paid-country-dependent';kind='professional-qualification';prerequisite='education-experience-and-exams';source=sources.acca;}
 return {...r,provider,cost,kind,prerequisite,language:'en',preferredLanguage:learningLanguage,languageMatch:learningLanguage==='en',country,localEligibility:'not-confirmed',source,checkedAt:Object.values(sources).includes(source)?resourceVerificationDate:null};
}
export function resourcePlan(resources,settings){
 const all=resources.map(r=>resourceDetails(r,settings)),required=all.filter(r=>r.cost==='free'&&r.kind!=='professional-qualification');
 if(!required.length)required.push(resourceDetails({title:'OpenLearn · Free course catalogue',url:'https://www.open.edu/openlearn/free-courses/full-catalogue',kind:'learn'},settings));
 return {required,optional:all.filter(r=>!required.some(x=>x.url===r.url)),guaranteedCost:0,feesUnknown:all.some(r=>r.cost!=='free')};
}
