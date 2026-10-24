import {orbitPoint} from './orbit-geometry.js';

// Labels stay upright. Drag the sphere, or use the keyboard/arrow controls.
export function attachPlanetMotion(scene){
 const nodes=[...scene.querySelectorAll('[data-orbit-skill]')],core=scene.querySelector('.planet-core');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let phase=0,frame=0,last=0,visible=false,drag=null,moved=false,disposed=false,w=0,h=0,nw=0,nh=0;
 function draw(){nodes.forEach((node,i)=>{const p=orbitPoint(-Math.PI/2+i*Math.PI*2/nodes.length+phase,w,h,nw,nh);node.style.left=p.x+'px';node.style.top=p.y+'px';node.style.scale=String(p.scale);node.style.zIndex=p.depth<.4?'1':'5';node.style.opacity=String(.77+p.depth*.23);});scene.style.setProperty('--planet-turn',phase+'rad');}
 function measure(){w=scene.clientWidth;h=scene.clientHeight;nw=Math.max(0,...nodes.map(n=>n.offsetWidth));nh=Math.max(0,...nodes.map(n=>n.offsetHeight));draw();}
 const canRun=()=>visible&&!document.hidden&&!reduce.matches&&!drag&&!scene.matches(':hover')&&!scene.querySelector(':focus-visible');
 function tick(now){frame=0;if(disposed||!canRun()){last=0;return;}if(last)phase+=(Math.min(now-last,80)/65000)*Math.PI*2;last=now;draw();frame=requestAnimationFrame(tick);}
 function update(){if(disposed)return;if(!canRun()){cancelAnimationFrame(frame);frame=0;last=0;}else if(!frame)frame=requestAnimationFrame(tick);}
 function turn(amount){phase+=amount;draw();}
 const down=e=>{if(e.button!==0)return;drag={x:e.clientX,phase};moved=false;core.setPointerCapture(e.pointerId);scene.classList.add('planet-dragging');update();};
 const move=e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5)moved=true;phase=drag.phase+dx/Math.max(w,1)*Math.PI*2;draw();};
 const up=()=>{drag=null;scene.classList.remove('planet-dragging');update();};
 const click=e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;}};
 const key=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowLeft'?-.3:.3);}};
 core.addEventListener('pointerdown',down);core.addEventListener('pointermove',move);core.addEventListener('pointerup',up);core.addEventListener('pointercancel',up);core.addEventListener('lostpointercapture',up);core.addEventListener('click',click,true);core.addEventListener('keydown',key);
 const events=['pointerenter','pointerleave','focusin','focusout'];events.forEach(n=>scene.addEventListener(n,update));
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();});observer.observe(scene);
 const resize=new ResizeObserver(measure);resize.observe(scene);nodes.forEach(n=>resize.observe(n));reduce.addEventListener('change',update);document.addEventListener('visibilitychange',update);measure();
 return {turn,dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();events.forEach(n=>scene.removeEventListener(n,update));reduce.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);core.removeEventListener('pointerdown',down);core.removeEventListener('pointermove',move);core.removeEventListener('pointerup',up);core.removeEventListener('pointercancel',up);core.removeEventListener('lostpointercapture',up);core.removeEventListener('click',click,true);core.removeEventListener('keydown',key);}};
}
