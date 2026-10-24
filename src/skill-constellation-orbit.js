import {orbitPoint} from './orbit-geometry.js';

export function attachSkillOrbit(scene) {
  const nodes=[...scene.querySelectorAll('[data-demo-skill]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase=0,frame=0,last=0,lastDraw=0,visible=false,disposed=false,touchHold=false,touchTimer;
  let width=0,height=0,nodeWidth=0,nodeHeight=0;
  const focused=()=>!!scene.querySelector(':focus-visible');
  const canRun=()=>visible&&!document.hidden&&!reduced.matches&&!scene.matches(':hover')&&!focused()&&!touchHold;
  function draw(){
    nodes.forEach((node,i)=>{
      const p=orbitPoint(-Math.PI/2+i*Math.PI*2/nodes.length+phase,width,height,nodeWidth,nodeHeight);
      node.style.left=p.x.toFixed(2)+'px';node.style.top=p.y.toFixed(2)+'px';
      node.style.setProperty('--orbit-scale',p.scale.toFixed(3));
      node.style.zIndex=p.depth<.45?'1':'5';
      node.style.setProperty('--orbit-shade',(.72+p.depth*.28).toFixed(3));
    });
  }
  function measure(){
    width=scene.clientWidth;height=scene.clientHeight;
    nodeWidth=Math.max(...nodes.map(n=>n.offsetWidth));nodeHeight=Math.max(...nodes.map(n=>n.offsetHeight));
    const p=orbitPoint(0,width,height,nodeWidth,nodeHeight);
    scene.style.setProperty('--orbit-width',p.rx*2+'px');scene.style.setProperty('--orbit-height',p.ry*2+'px');draw();
  }
  function tick(now){
    frame=0;if(disposed||!canRun()){last=0;return;}
    if(last)phase=(phase+Math.min(now-last,80)/56000*Math.PI*2)%(Math.PI*2);
    last=now;if(now-lastDraw>=32){draw();lastDraw=now;}
    frame=requestAnimationFrame(tick);
  }
  function update(){
    if(disposed)return;
    if(!canRun()){cancelAnimationFrame(frame);frame=0;last=0;}
    else if(!frame)frame=requestAnimationFrame(tick);
    if(reduced.matches){phase=0;draw();}
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.05});
  observer.observe(scene);
  const resize=new ResizeObserver(measure);resize.observe(scene);nodes.forEach(n=>resize.observe(n));
  const enter=()=>update(),leave=()=>update();
  const focus=()=>update();
  const blur=event=>{if(!scene.contains(event.relatedTarget)){cancelAnimationFrame(frame);frame=0;last=0;if(visible&&!document.hidden&&!reduced.matches&&!scene.matches(':hover')&&!touchHold)frame=requestAnimationFrame(tick);}};
  const down=event=>{if(event.pointerType==='touch'){clearTimeout(touchTimer);touchHold=true;update();}};
  const release=()=>{if(touchHold){clearTimeout(touchTimer);touchTimer=setTimeout(()=>{touchHold=false;update();},700);}};
  scene.classList.add('orbiting-skills');measure();
  scene.addEventListener('pointerenter',enter);scene.addEventListener('pointerleave',leave);scene.addEventListener('focusin',focus);scene.addEventListener('focusout',blur);scene.addEventListener('pointerdown',down,{passive:true});
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
  return()=>{
    disposed=true;cancelAnimationFrame(frame);clearTimeout(touchTimer);observer.disconnect();resize.disconnect();
    scene.removeEventListener('pointerenter',enter);scene.removeEventListener('pointerleave',leave);scene.removeEventListener('focusin',focus);scene.removeEventListener('focusout',blur);scene.removeEventListener('pointerdown',down);
    window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);reduced.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);
  };
}
