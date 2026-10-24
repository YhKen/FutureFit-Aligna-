/* Shared tactile surfaces. Dynamic views keep their own content and handlers. */
const surfaces='.card,.panel,.home-tile,.role-card,.application-card,.form-card,.hiring-cloud,.target-panel,.job-preferences,.workspace-module,.planet-plan-cards article,.evidence-summary>div,.planet-practice-pace,.jd-skill-route';

function mountSurfaces() {
  if(document.body.dataset.page==='landing')return()=>{};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=matchMedia('(hover: hover) and (pointer: fine)');
  const cards=new Map(),moving=new Set(),timers=new Map();
  let frame=0,scanFrame=0,last=0,active=null,disposed=false;
  const enabled=()=>!reduced.matches&&pointer.matches&&!document.hidden;
  const draw=c=>{
    const [x,y,rx,ry]=c.current;
    c.el.style.setProperty('--depth-x',x.toFixed(3)+'px');
    c.el.style.setProperty('--depth-y',y.toFixed(3)+'px');
    c.el.style.setProperty('--depth-rx',rx.toFixed(3)+'deg');
    c.el.style.setProperty('--depth-ry',ry.toFixed(3)+'deg');
  };
  const wake=()=>{if(!frame&&enabled()&&moving.size)frame=requestAnimationFrame(tick);};
  function tick(now){
    frame=0;if(disposed||!enabled())return;
    const dt=last?Math.min(40,now-last):16;last=now;
    const ease=1-Math.exp(-dt/95);
    for(const c of moving){
      let settled=true;
      c.current=c.current.map((v,i)=>{const d=c.target[i]-v;if(Math.abs(d)>.002)settled=false;return Math.abs(d)<.002?c.target[i]:v+d*ease;});
      draw(c);if(settled)moving.delete(c);
    }
    if(moving.size)wake();else last=0;
  }
  function reset(c,instant=false){
    if(!c)return;c.target.fill(0);c.el.classList.remove('depth-hover');
    if(instant){c.current.fill(0);moving.delete(c);draw(c);}else moving.add(c);
    wake();
  }
  const visible=new IntersectionObserver(entries=>{
    for(const entry of entries){const c=cards.get(entry.target);if(!c)continue;c.visible=entry.isIntersecting;if(!c.visible)reset(c,true);}
  },{rootMargin:'40px'});
  const sizing=new ResizeObserver(entries=>{for(const entry of entries){const c=cards.get(entry.target);if(c)c.rect=null;}});
  function reconcile(){
    scanFrame=0;if(disposed)return;
    for(const [el,c] of cards)if(!el.isConnected){visible.unobserve(el);sizing.unobserve(el);moving.delete(c);cards.delete(el);if(active===c)active=null;clearTimeout(timers.get(el));timers.delete(el);}
    document.querySelectorAll(surfaces).forEach(el=>{
      if(cards.has(el)||el.closest('#landing')||el.parentElement?.closest(surfaces))return;
      el.classList.add('depth-surface');
      const c={el,current:[0,0,0,0],target:[0,0,0,0],visible:false,rect:null};
      cards.set(el,c);visible.observe(el);sizing.observe(el);
    });
  }
  const changes=new MutationObserver(records=>{
    const elementsChanged=records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1));
    if(elementsChanged&&!scanFrame)scanFrame=requestAnimationFrame(reconcile);
  });
  changes.observe(document.body,{childList:true,subtree:true});
  function move(event){
    if(!enabled()||event.pointerType==='touch')return;
    const el=event.target.closest('.depth-surface'),c=cards.get(el);
    if(active!==c){reset(active);active=c||null;if(c){c.rect=c.el.getBoundingClientRect();}}
    if(!c||!c.visible||c.el.classList.contains('depth-editing'))return;
    const r=c.rect||(c.rect=c.el.getBoundingClientRect());
    const nx=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));
    const ny=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));
    const strength=Math.min(1,400/Math.max(r.width,r.height));
    c.target=[nx*2*strength,ny*1.5*strength,-ny*2.1*strength,nx*2.6*strength];
    el.style.setProperty('--depth-light-x',((nx+1)*50).toFixed(2)+'%');
    el.style.setProperty('--depth-light-y',((ny+1)*50).toFixed(2)+'%');
    el.classList.add('depth-hover');moving.add(c);wake();
  }
  function leave(){reset(active);active=null;}
  function focus(event){
    const el=event.target.closest('.depth-surface');if(!el)return;
    el.classList.add('depth-focused');
    if(event.target.matches('input,textarea,select,[contenteditable=true]')){el.classList.add('depth-editing');reset(cards.get(el),true);}
  }
  function blur(event){
    const el=event.target.closest('.depth-surface');if(!el)return;
    if(!el.contains(event.relatedTarget)){el.classList.remove('depth-focused','depth-editing');}
    else if(!event.relatedTarget?.matches('input,textarea,select,[contenteditable=true]'))el.classList.remove('depth-editing');
  }
  function press(event){
    if(reduced.matches||event.button!==0||event.target.closest('input,textarea,select,[contenteditable=true]'))return;
    const el=event.target.closest('.depth-surface');if(!el||!cards.has(el))return;
    clearTimeout(timers.get(el));el.classList.remove('depth-tapped');void el.offsetWidth;el.classList.add('depth-tapped');
    timers.set(el,setTimeout(()=>{el.classList.remove('depth-tapped');timers.delete(el);},360));
  }
  function suspend(){
    for(const c of cards.values()){c.rect=null;reset(c,true);}active=null;cancelAnimationFrame(frame);frame=0;last=0;
  }
  const onVisibility=()=>{if(document.hidden)suspend();};
  const onCapability=()=>{if(!enabled())suspend();};
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerdown',press,{passive:true});
  document.addEventListener('focusin',focus);document.addEventListener('focusout',blur);
  document.documentElement.addEventListener('pointerleave',leave);
  window.addEventListener('blur',suspend);window.addEventListener('scroll',suspend,{passive:true,capture:true});window.addEventListener('resize',suspend,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',onCapability);pointer.addEventListener('change',onCapability);
  reconcile();
  return()=>{
    disposed=true;suspend();cancelAnimationFrame(scanFrame);changes.disconnect();visible.disconnect();sizing.disconnect();
    timers.forEach(clearTimeout);cards.forEach(c=>c.el.classList.remove('depth-tapped','depth-focused','depth-editing'));
    document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',press);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',blur);
    document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',suspend);window.removeEventListener('scroll',suspend,true);window.removeEventListener('resize',suspend);
    document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onCapability);pointer.removeEventListener('change',onCapability);
  };
}
let cleanup=mountSurfaces();
window.addEventListener('pagehide',()=>{cleanup?.();cleanup=null;});
window.addEventListener('pageshow',event=>{if(event.persisted&&!cleanup)cleanup=mountSurfaces();});
