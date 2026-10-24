import {connect} from './cloud.js';
export async function requireAccount(role='seeker'){const c=await connect();if(c.user.isAnonymous||!c.user.emailVerified){location.replace('account.html?'+new URLSearchParams({role,next:location.pathname.split('/').pop()+location.search}));throw Error('account-required');}return c;}
