import {attachCardMotion} from './landing-card-motion.js';
import {mountLandingSkills} from './landing-chapters.js';
export function animateLanding(lang) {
  const root=document.querySelector('#landing');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const label={zh:'换个图案',en:'Try another pattern',ms:'Cuba corak lain'}[lang]||'Try another pattern';
  const syncMotion=()=>root.classList.toggle('motion-paused',reduce.matches);
  syncMotion();
  reduce.addEventListener('change',syncMotion);
  const cleanStudio=mountLandingSkills(root.querySelector('#skills'),lang);
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('section-arrived');observer.unobserve(e.target);}
  }),{threshold:.08});
  root.querySelectorAll('.long-section,.landing-journey,.landing-last').forEach(s=>{
    s.classList.add('motion-section');observer.observe(s);
  });
  const tiles=root.querySelector('.mini-tiles'),button=document.createElement('button');
  button.className='pattern-button';button.type='button';button.textContent=label;
  let pattern=0;
  button.onclick=()=>{pattern++;tiles.querySelectorAll('i').forEach((t,i)=>t.classList.toggle('glow',(i*7+pattern*3)%25<6));};
  tiles.parentElement.lastElementChild.append(button);
  const cleanCards=attachCardMotion(root);

  return()=>{observer.disconnect();reduce.removeEventListener('change',syncMotion);cleanCards();cleanStudio();};
}
