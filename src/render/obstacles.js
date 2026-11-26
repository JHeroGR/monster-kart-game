/* Rival cars (3 designs), rocks and potholes. */
import { drawWheel } from './kart.js';
import { S } from '../state.js';
import { rr } from '../util.js';

export function drawRival(g,o){
  g.save(); g.translate(o.x,o.y); g.rotate(o.rot); g.lineJoin='round';
  const WH='#f6f6f6', BK='#0a0a0a';
  const wheels=(x,fy,ry)=>{ drawWheel(g,-x,fy,9,15,0,S.scroll*.35); drawWheel(g,x,fy,9,15,0,S.scroll*.35); drawWheel(g,-x,ry,9,17,0,S.scroll*.35); drawWheel(g,x,ry,9,17,0,S.scroll*.35); };
  g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=1.8;
  if(o.variant===0){            // open-wheel: black with white nose cone and wing
    wheels(17,-19,18);
    g.beginPath(); g.moveTo(0,-30); g.quadraticCurveTo(5,-27,6,-18); g.lineTo(11,-4); g.lineTo(11,16); g.quadraticCurveTo(11,24,7,25); g.lineTo(-7,25); g.quadraticCurveTo(-11,24,-11,16); g.lineTo(-11,-4); g.lineTo(-6,-18); g.quadraticCurveTo(-5,-27,0,-30); g.closePath(); g.fill(); g.stroke();
    g.fillStyle=WH; g.fillRect(-2.2,-29,4.4,54);
    g.beginPath(); g.arc(0,-6,5.4,0,6.283); g.fill(); g.fillStyle=BK; g.font='700 8px "Arial Black",Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(o.num%10,0,-5.7);
    g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1.2; rr(g,-18,26,36,6,2); g.fill(); g.stroke();
  }else if(o.variant===1){      // wide kart: boxy, checkered nose
    wheels(17,-20,19);
    rr(g,-14,-27,28,53,6); g.fillStyle=BK; g.fill(); g.strokeStyle=WH; g.lineWidth=1.8; g.stroke();
    for(let r=0;r<2;r++) for(let c=0;c<6;c++){ g.fillStyle=((r+c)%2)?BK:WH; g.fillRect(-12+c*4,-25+r*4,4,4); }
    g.fillStyle=WH; g.beginPath(); g.arc(0,2,8,0,6.283); g.fill();
    g.fillStyle=BK; g.font='700 11px "Arial Black",Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(o.num%10,0,2.4);
    g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=1.2; rr(g,-14,22,28,5,2); g.fill(); g.stroke();
  }else{                        // coupe: roof and glass
    wheels(16,-19,19);
    rr(g,-15,-30,30,60,9); g.fillStyle=BK; g.fill(); g.strokeStyle=WH; g.lineWidth=1.8; g.stroke();
    g.fillStyle=WH; rr(g,-10,-16,20,9,2); g.fill();
    g.fillStyle='#444'; rr(g,-10,10,20,8,2); g.fill();
    g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=1.2; rr(g,-10,-5,20,13,3); g.fill(); g.stroke();
    g.fillStyle=WH; g.fillRect(-12,-29,6,2.4); g.fillRect(6,-29,6,2.4);
    g.fillStyle='#777'; g.fillRect(-12,26.5,6,2.4); g.fillRect(6,26.5,6,2.4);
  }
  g.restore();
}
export function drawRock(g,o){
  g.save(); g.translate(o.x,o.y); g.scale(o.sz,o.sz);
  g.fillStyle='rgba(0,0,0,.55)'; g.beginPath(); g.ellipse(3,6,22,14,0,0,6.283); g.fill();
  const gr=g.createLinearGradient(-18,-16,18,16); gr.addColorStop(0,'#dcdcdc'); gr.addColorStop(.55,'#8d8d8d'); gr.addColorStop(1,'#3a3a3a');
  g.beginPath(); o.poly.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath();
  g.fillStyle=gr; g.fill(); g.strokeStyle='#000'; g.lineWidth=2.2; g.lineJoin='round'; g.stroke();
  g.strokeStyle='rgba(0,0,0,.6)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(o.poly[1][0]*.2,o.poly[1][1]*.2); g.lineTo(o.poly[4][0]*.7,o.poly[4][1]*.7); g.moveTo(o.poly[6][0]*.1,o.poly[6][1]*.1); g.lineTo(o.poly[7][0]*.8,o.poly[7][1]*.8); g.stroke();
  g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-12,-7); g.lineTo(-4,-12); g.lineTo(2,-8); g.lineTo(-6,-3); g.closePath(); g.fill();
  g.restore();
}
export function drawPothole(g,o){
  g.save(); g.translate(o.x,o.y); g.scale(o.sz,o.sz);
  const path=k=>{ g.beginPath(); o.poly.forEach((p,i)=>i?g.lineTo(p[0]*k,p[1]*k):g.moveTo(p[0]*k,p[1]*k)); g.closePath(); };
  path(1.18); g.fillStyle='rgba(255,255,255,.08)'; g.fill();
  path(1); g.fillStyle='#000'; g.fill(); g.strokeStyle='#a8a8a8'; g.lineWidth=3; g.lineJoin='round'; g.stroke();
  path(.62); g.fillStyle='#1d1d1d'; g.fill();
  g.strokeStyle='#8a8a8a'; g.lineWidth=1.3; g.lineCap='round'; g.beginPath();
  for(const c of o.cracks){ const sx=Math.cos(c.a)*24, sy=Math.sin(c.a)*15; g.moveTo(sx,sy); g.lineTo(sx+Math.cos(c.a+.4)*c.l,sy+Math.sin(c.a+.4)*c.l*.7); }
  g.stroke();
  g.restore();
}
