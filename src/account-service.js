export const EMAIL_RETRY_MS=60000;
export function verificationSettings(role){return {url:'https://aligna-two.vercel.app/account.html?role='+(role==='hr'?'hr':'seeker')+'&verified=1',handleCodeInApp:false};}
export function authIssue(error){
 const code=String(error?.code||'');
 if(/too-many-requests|quota-exceeded/.test(code))return 'limited';
 if(/popup/.test(code))return 'popup';
 if(/network-request-failed|timeout/.test(code))return 'network';
 if(/unauthorized-continue-uri|invalid-continue-uri|missing-continue-uri|operation-not-allowed/.test(code))return 'configuration';
 if(/invalid-credential|wrong-password|user-not-found/.test(code))return 'credentials';
 if(/email-already-in-use/.test(code))return 'exists';
 if(/weak-password/.test(code))return 'password';
 if(/user-token-expired|invalid-user-token|requires-recent-login/.test(code))return 'expired';
 return 'other';
}
export async function sendVerification(client,user,lang,role){
 if(!user||user.isAnonymous||client.auth.currentUser?.uid!==user.uid)throw Object.assign(Error('Sign in again'),{code:'auth/user-token-expired'});
 client.auth.languageCode=({zh:'zh-CN',en:'en',ms:'ms'}[lang]||'en');
 await client.U.sendEmailVerification(user,verificationSettings(role));
 return {sentAt:Date.now()};
}
export async function confirmVerification(client,user){
 if(!user||client.auth.currentUser?.uid!==user.uid)return false;
 await client.U.reload(user);
 if(!user.emailVerified||client.auth.currentUser?.uid!==user.uid)return false;
 await client.U.getIdToken(user,true);
 return true;
}
