let connection;
function timeout(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error("firebase-timeout"),{code:"cloud/timeout"})),ms);})]).finally(()=>clearTimeout(timer));}
export function connect(test=false){
 return connection??= timeout((async()=>{
 const [A,U,F]=await Promise.all(['app','auth','firestore'].map(k=>import(`https://www.gstatic.com/firebasejs/13.0.0/firebase-${k}.js`)));
 const name=test?'aligna-test':'[DEFAULT]',app=A.getApps().find(a=>a.name===name)||A.initializeApp({apiKey:'AIzaSyDzKmmTF4zK26QO5gEn2fd-srX4q6SW354',authDomain:'project-d32d7.firebaseapp.com',projectId:'project-d32d7',appId:'1:31008626657:web:da75c66de5851ca20ba4a0'},name);
 const auth=U.getAuth(app);await U.setPersistence(auth,test?U.browserSessionPersistence:U.browserLocalPersistence);await auth.authStateReady();const user=auth.currentUser||(await U.signInAnonymously(auth)).user,db=F.getFirestore(app);
 return {user,F,db,auth,U,async bank(id){const d=await F.getDocFromServer(F.doc(db,'aligna_question_banks',id));if(!d.exists())throw Error('missing-bank');return JSON.parse(d.data().payload);},async save(collection,id,data){return F.setDoc(F.doc(db,'aligna_users',user.uid,collection,id),data);},async recent(collection,max=20){const d=await F.getDocsFromServer(F.query(F.collection(db,'aligna_users',user.uid,collection),F.orderBy('updatedAt','desc'),F.limit(max)));return d.docs.map(x=>({id:x.id,...x.data()}));}};
 })(),20000).catch(e=>{connection=null;throw e;});
}

