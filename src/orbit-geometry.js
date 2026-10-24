export function orbitPoint(angle,width,height,nodeWidth,nodeHeight=46) {
  const rx=Math.max(0,(width-nodeWidth)/2-1);
  const ry=Math.max(0,Math.min(height*.34,(height-nodeHeight)/2-18));
  const depth=(Math.sin(angle)+1)/2;
  return {x:width/2+Math.cos(angle)*rx,y:height/2+Math.sin(angle)*ry-Math.cos(angle)*Math.min(12,rx*.08),scale:.85+depth*.15,depth,rx,ry};
}
