// A blocked or inaccessible OAuth window must not lock the whole sign-in form.
export const AUTH_POPUP_DEADLINE_MS=45000;
export async function withAuthPopupDeadline(action,ms=AUTH_POPUP_DEADLINE_MS){
 let timer;
 try{return await Promise.race([Promise.resolve().then(action),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('Google popup did not complete'),{code:'auth/popup-timeout'})),ms);})]);}
 finally{clearTimeout(timer);}
}
