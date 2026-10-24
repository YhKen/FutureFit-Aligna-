import {companyState} from './company-verification-store.js';import {companyAccess} from './company-verification-core.js';
export async function requireHiringCompany(c){const state=await companyState(c),access=companyAccess(state.request,state.review);if(access==='pending'){location.replace('company.html');throw Error('company-required');}return {...state,access};}
