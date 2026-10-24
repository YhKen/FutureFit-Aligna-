// Enrichify-inspired pointer lighting with a shared, sleeping spring loop.
export function attachCardMotion(root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let frame=0, last=0, destroyed=false;
  const cards=[...root.querySelectorAll('.landing-art,.chapter-card,.skill-demo,.cv-preview,.challenge-preview article,#plan-example,.journey-steps article,.faq-section details,.landing-last')].map((el,index)=>{
    el.classList.add('pointer-card');
    const sheen=document.createElement('span');
    sheen.className='card-sheen';sheen.setAttribute('aria-hidden','true');el.append(sheen);
    el.style.setProperty('--motion-phase',`${index*-.7}s`);
    if(el.matches('.cv-preview'))el.style.setProperty('--card-rest','3deg');
    return {el,visible:false,rect:null,current:[0,0,0,0,0],target:[0,0,0,0,0]};
  });
  const enabled=()=>!reduce.matches && fine.matches && !root.classList.contains('motion-paused');
  function draw(card) {
    const [x,y,rx,ry,glow]=card.current;
    const values={'--follow-x':`${x.toFixed(3)}px`,'--follow-y':`${y.toFixed(3)}px`,'--rotate-x':`${rx.toFixed(3)}deg`,'--rotate-y':`${ry.toFixed(3)}deg`,'--card-light':glow.toFixed(3),'--layer-x':`${(x*1.8).toFixed(3)}px`,'--layer-y':`${(y*1.8).toFixed(3)}px`};
    Object.entries(values).forEach(([key,value])=>card.el.style.setProperty(key,value));
  }
  function reset(immediate=false) {
    cards.forEach(card=>{card.target.fill(0);card.el.classList.remove('pointer-active');if(immediate){card.current.fill(0);draw(card);}});
    if(immediate){cancelAnimationFrame(frame);frame=0;last=0;}else wake();
  }
  function tick(now) {
    frame=0;
    if(destroyed || !enabled())return;
    const dt=last?Math.min(now-last,40):16;last=now;
    const easing=1-Math.exp(-dt/105);
    let moving=false;
    cards.forEach(card=>{
      card.current.forEach((value,i)=>{const delta=card.target[i]-value;card.current[i]=Math.abs(delta)<.002?card.target[i]:value+delta*easing;if(Math.abs(delta)>=.002)moving=true;});
      draw(card);
    });
    if(moving)frame=requestAnimationFrame(tick);else last=0;
  }
  function wake(){if(!frame && !destroyed && enabled())frame=requestAnimationFrame(tick);}
  function measure() {
    cards.forEach(card=>{const r=card.el.getBoundingClientRect();card.rect={left:r.left-card.current[0],top:r.top-card.current[1],width:card.el.offsetWidth,height:card.el.offsetHeight};});
  }
  function move(event) {
    if(!enabled() || event.pointerType==='touch')return;
    cards.forEach(card=>{
      if(!card.visible || !card.rect)return;
      const r=card.rect,hero=card.el.matches('.landing-art');
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const edge=Math.hypot(Math.max(0,Math.abs(event.clientX-cx)-r.width/2),Math.max(0,Math.abs(event.clientY-cy)-r.height/2));
      const strength=Math.max(0,1-edge/(hero?430:140));
      const nx=Math.max(-1,Math.min(1,(event.clientX-cx)/(r.width/2)));
      const ny=Math.max(-1,Math.min(1,(event.clientY-cy)/(r.height/2)));
      card.target=[nx*(hero?9:4)*strength,ny*(hero?7:3)*strength,-ny*(hero?5:3)*strength,nx*(hero?7:4)*strength,strength];
      card.el.style.setProperty('--light-x',`${((event.clientX-r.left)/r.width*100).toFixed(2)}%`);
      card.el.style.setProperty('--light-y',`${((event.clientY-r.top)/r.height*100).toFixed(2)}%`);
      card.el.classList.toggle('pointer-active',edge===0);
    });wake();
  }
  const visibility=new IntersectionObserver(entries=>{
    entries.forEach(e=>{const card=cards.find(c=>c.el===e.target);card.visible=e.isIntersecting;card.el.classList.toggle('card-visible',e.isIntersecting);if(!card.visible){card.target.fill(0);card.current.fill(0);draw(card);}});measure();
  },{rootMargin:'100px'});
  cards.forEach(card=>visibility.observe(card.el));
  const resize=new ResizeObserver(measure);resize.observe(root);
  const capability=()=>{if(!enabled())reset(true);};
  const settings=new MutationObserver(capability);settings.observe(root,{attributes:true,attributeFilter:['class']});
  const leave=()=>reset();
  const onScroll=()=>{reset(true);measure();};
  const onHidden=()=>{if(document.hidden)reset(true);};
  const tapTimers=new Set();
  function press(event){
    if(reduce.matches||root.classList.contains('motion-paused'))return;
    const card=event.target.closest('.pointer-card');if(!card)return;
    card.classList.remove('card-pressed');void card.offsetWidth;card.classList.add('card-pressed');
    const timer=setTimeout(()=>{card.classList.remove('card-pressed');tapTimers.delete(timer);},450);tapTimers.add(timer);
  }
  const focus=event=>event.target.closest('.pointer-card')?.classList.add('card-focused');
  const unfocus=event=>{const card=event.target.closest('.pointer-card');if(card&&!card.contains(event.relatedTarget))card.classList.remove('card-focused');};
  let scene=0;
  const ambient=setInterval(()=>{
    if(document.hidden||reduce.matches||root.classList.contains('motion-paused'))return;
    const preview=cards.find(c=>c.el.matches('.challenge-preview article'));
    if(preview?.visible){scene++;preview.el.querySelectorAll('.mini-tiles i').forEach((tile,i)=>tile.classList.toggle('glow',(i*7+scene*3)%25<6));}
  },3600);
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',leave);
  root.addEventListener('pointerdown',press,{passive:true});root.addEventListener('focusin',focus);root.addEventListener('focusout',unfocus);
  window.addEventListener('blur',leave);window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',onHidden);reduce.addEventListener('change',capability);fine.addEventListener('change',capability);
  measure();
  return ()=>{
    destroyed=true;cancelAnimationFrame(frame);clearInterval(ambient);tapTimers.forEach(clearTimeout);visibility.disconnect();resize.disconnect();settings.disconnect();
    root.removeEventListener('pointerdown',press);root.removeEventListener('focusin',focus);root.removeEventListener('focusout',unfocus);
    root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);
    document.removeEventListener('visibilitychange',onHidden);reduce.removeEventListener('change',capability);fine.removeEventListener('change',capability);
  };
}
