import {ordinalAgreement,absoluteIcc,bootstrapInterval,contentValiditySummary} from '../validation-statistics.js';import fs from 'node:fs';
let seed=741;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},fixtures=[];
for(let i=0;i<160;i++){const n=3+Math.floor(rnd()*50),pairs=Array.from({length:n},()=>[1+Math.floor(rnd()*3),1+Math.floor(rnd()*3)]),totals=Array.from({length:n},()=>[4+Math.floor(rnd()*9),4+Math.floor(rnd()*9)]);fixtures.push({pairs,totals,k:ordinalAgreement(pairs),icc:absoluteIcc(totals)});}
const rows=Array.from({length:36},(_,i)=>[4+i%9,4+(i*7+3)%9]),boot=bootstrapInterval(rows,r=>absoluteIcc(r).value,{iterations:2000,seed:20261023});
console.log(JSON.stringify({fixtures,rows,boot}));
