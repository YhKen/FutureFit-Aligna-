// Fixed two-rater design. Descriptive/calculation results never certify validity.
export const VALIDATION_STATS_VERSION='validation-statistics-v1';
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const score=x=>x===null||Number.isInteger(x)&&x>=1&&x<=3;
export function ordinalAgreement(pairs){
 if(!Array.isArray(pairs)||pairs.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!score(x))))throw Error('invalid-rating-pairs');
 const paired=pairs.filter(p=>p.every(x=>x!==null)),n=paired.length,matrix=Array.from({length:3},()=>[0,0,0]);
 for(const [a,b] of paired)matrix[a-1][b-1]++;
 if(!n)return {n:0,missing:pairs.length,matrix,exact:null,meanAbsoluteDifference:null,meanSignedDifference:null,kappa:null,reason:'no-paired-ratings'};
 const a=matrix.map(r=>r.reduce((s,x)=>s+x,0)/n),b=[0,1,2].map(j=>matrix.reduce((s,r)=>s+r[j],0)/n);
 const observed=paired.reduce((s,[x,y])=>s+Math.abs(x-y)/2,0)/n;
 const expected=a.reduce((s,x,i)=>s+b.reduce((t,y,j)=>t+x*y*Math.abs(i-j)/2,0),0);
 return {n,missing:pairs.length-n,matrix,exact:paired.filter(([x,y])=>x===y).length/n,meanAbsoluteDifference:observed*2,meanSignedDifference:mean(paired.map(([x,y])=>y-x)),kappa:expected>1e-12?1-observed/expected:null,reason:expected>1e-12?null:'zero-expected-disagreement',weights:'linear ordinal disagreement |a-b|/2; categories fixed at 1,2,3'};
}
export function absoluteIcc(rows){
 if(!Array.isArray(rows)||rows.some(r=>!Array.isArray(r)||r.length!==2||r.some(x=>!Number.isFinite(x))))throw Error('invalid-icc-matrix');
 const n=rows.length,k=2;
 if(n<3)return {n,value:null,reason:'fewer-than-three-complete-cases'};
 const rowMeans=rows.map(mean),columnMeans=[mean(rows.map(r=>r[0])),mean(rows.map(r=>r[1]))],grand=mean(rowMeans);
 const ssRow=k*rowMeans.reduce((s,x)=>s+(x-grand)**2,0),ssColumn=n*columnMeans.reduce((s,x)=>s+(x-grand)**2,0);
 const ssError=rows.reduce((s,r,i)=>s+r.reduce((t,x,j)=>t+(x-rowMeans[i]-columnMeans[j]+grand)**2,0),0);
 const msRow=ssRow/(n-1),msColumn=ssColumn/(k-1),msError=ssError/((n-1)*(k-1));
 const denominator=msRow+(k-1)*msError+k*(msColumn-msError)/n;
 const value=denominator>1e-12?(msRow-msError)/denominator:null;
 return {n,value,reason:value===null?'zero-variance-or-undefined':null,msRow,msColumn,msError,model:'ICC(A,1): two-way absolute agreement, single rating; fixed selected pair; no generalisation to all raters'};
}
function random(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const quantile=(a,p)=>{const i=(a.length-1)*p,j=Math.floor(i);return a[j]+(a[Math.min(j+1,a.length-1)]-a[j])*(i-j);};
export function bootstrapInterval(rows,statistic,{iterations=2000,seed=20261023}={}){
 if(!Number.isInteger(iterations)||iterations<200||iterations>5000)throw Error('invalid-bootstrap-iterations');
 if(rows.length<10)return {lower:null,upper:null,reason:'fewer-than-ten-cases',valid:0,iterations,method:'case-level percentile bootstrap; 95%'};
 const next=random(seed),values=[];
 for(let b=0;b<iterations;b++){const sample=Array.from({length:rows.length},()=>rows[Math.floor(next()*rows.length)]),v=statistic(sample);if(v!==null&&Number.isFinite(v))values.push(v);}
 if(values.length<iterations*.8)return {lower:null,upper:null,reason:'too-many-undefined-resamples',valid:values.length,iterations,method:'case-level percentile bootstrap; 95%'};
 values.sort((a,b)=>a-b);return {lower:quantile(values,.025),upper:quantile(values,.975),reason:null,valid:values.length,iterations,method:'case-level percentile bootstrap; 95%; seed '+seed};
}
export function reliabilitySummary(cases,criteria,{iterations=2000}={}){
 if(new Set(cases.map(c=>c.caseId)).size!==cases.length)throw Error('duplicate-case');
 if(cases.some(c=>c.a.length!==criteria.length||c.b.length!==criteria.length||[...c.a,...c.b].some(x=>!score(x))))throw Error('invalid-study-scores');
 const dimensions=criteria.map((criterionId,i)=>{const pairs=cases.map(c=>[c.a[i],c.b[i]]),summary=ordinalAgreement(pairs),complete=pairs.filter(p=>p.every(x=>x!==null));return {criterionId,...summary,interval:bootstrapInterval(complete,r=>ordinalAgreement(r).kappa,{iterations,seed:20261023+i})};});
 const totals=cases.filter(c=>[...c.a,...c.b].every(x=>x!==null)).map(c=>[c.a.reduce((s,x)=>s+x,0),c.b.reduce((s,x)=>s+x,0)]),icc=absoluteIcc(totals);
 return {version:VALIDATION_STATS_VERSION,n:cases.length,dimensions,totals:{...icc,missing:cases.length-totals.length,interval:bootstrapInterval(totals,r=>absoluteIcc(r).value,{iterations,seed:20261101})},validationStatus:'pending-human-validation',scope:'Each dimension is analysed across cases; dimensions are not pooled as independent people. Null is missing, not zero. Negative coefficients are retained. No automatic pass.'};
}
export function contentValiditySummary(reviews,criteria){
 const dimensions=criteria.map(id=>{const values=reviews.map(r=>r.criteria.find(c=>c.criterionId===id)?.relevance).filter(x=>x!==null&&x!==undefined);if(values.some(x=>!Number.isInteger(x)||x<1||x>4))throw Error('invalid-expert-relevance');const relevant=values.filter(x=>x>=3).length;return {criterionId:id,n:values.length,missing:reviews.length-values.length,relevant,iCvi:values.length?relevant/values.length:null};});
 const complete=dimensions.every(d=>d.n===reviews.length&&d.n>0),sCviAverage=complete?mean(dimensions.map(d=>d.iCvi)):null,sCviUniversal=complete?dimensions.filter(d=>d.iCvi===1).length/dimensions.length:null;
 return {n:reviews.length,dimensions,sCviAverage,sCviUniversal,validationStatus:'pending-human-validation',scope:'Relevance 1-4; 3/4 counts as relevant. Expert opinion is one source of content evidence, not a validity percentage or proof of predictive performance. Missing reviews are reported.'};
}
