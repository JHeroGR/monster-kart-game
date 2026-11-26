/* Monster kart: the racer on giant knobby tires with horns, roll cage and exhaust stacks. */
import { drawKart } from './kart.js';
import { S } from '../state.js';
import { rr } from '../util.js';

export function drawMonster(g,x,y,o){
  const t=S.clk, WH='#f6f6f6', BK='#0a0a0a', ph=o.phase||0;
  g.save(); g.translate(x,y+Math.sin(t*16)*1.1); g.rotate((o.tilt||0)*.7); g.scale(o.scale||1,o.scale||1); g.lineJoin='round'; g.lineCap='round';
  g.strokeStyle='rgba(255,255,255,'+(.3+.25*Math.sin(t*10))+')'; g.lineWidth=3; g.beginPath(); g.ellipse(0,2,50,58,0,0,6.283); g.stroke();   // invincibility aura
  for(const sx of [-1,1]) for(const wy of [-26,26]){
    g.strokeStyle=BK; g.lineWidth=6; g.beginPath(); g.moveTo(sx*13,wy*.55); g.lineTo(sx*28,wy); g.stroke();
    g.strokeStyle=WH; g.lineWidth=1.6; g.beginPath(); g.moveTo(sx*13,wy*.55); g.lineTo(sx*28,wy); g.stroke();
  }
  for(const sx of [-1,1]) for(const wy of [-26,26]){
    g.save(); g.translate(sx*32,wy);
    g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=2.4; rr(g,-10,-17,20,34,6); g.fill(); g.stroke();
    g.strokeStyle='#bdbdbd'; g.lineWidth=2;
    g.beginPath(); for(let i=0;i<6;i++){ const yy=((i*6+ph*.8)%34)-17; g.moveTo(-7,yy+2.4); g.lineTo(0,yy-2.4); g.lineTo(7,yy+2.4); } g.stroke();
    g.restore();
  }
  drawKart(g,0,0,{scale:1.18,noWheels:true,phase:ph});
  g.strokeStyle=WH; g.lineWidth=2.2; g.beginPath(); g.moveTo(-11,-6); g.lineTo(-11,17); g.lineTo(11,17); g.lineTo(11,-6); g.moveTo(-11,-6); g.lineTo(11,-6); g.stroke();
  g.strokeStyle=BK; g.lineWidth=.9; g.beginPath(); g.moveTo(-11,-6); g.lineTo(-11,17); g.lineTo(11,17); g.lineTo(11,-6); g.closePath(); g.stroke();
  g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1.5;
  for(const sx of [-1,1]){ g.beginPath(); g.moveTo(sx*15,-39); g.lineTo(sx*10,-54); g.lineTo(sx*5,-39); g.closePath(); g.fill(); g.stroke(); }
  for(const sx of [-1,1]){ rr(g,sx*19-2.5,18,5,17,2); g.fill(); g.stroke(); }
  g.restore();
}
