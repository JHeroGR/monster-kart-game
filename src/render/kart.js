/* The player kart: white open-wheel racer, twin stripes, number 7, helmeted driver, split rear wing. */
import { S } from '../state.js';
import { clamp, rnd, rr } from '../util.js';

export function drawWheel(g,cx,cy,w,h,steer,ph){
  g.save(); g.translate(cx,cy); g.rotate(steer);
  g.fillStyle='#0a0a0a'; g.strokeStyle='#f6f6f6'; g.lineWidth=1.6; rr(g,-w/2,-h/2,w,h,2.6); g.fill(); g.stroke();
  g.strokeStyle='#8a8a8a'; g.lineWidth=1.3; g.beginPath();
  for(let i=0;i<3;i++){ const y=((i*h/3+ph)%h)-h/2; g.moveTo(-w/2+1.8,y); g.lineTo(w/2-1.8,y); }
  g.stroke(); g.restore();
}
/* The player kart: a white open-wheel racer with twin black stripes, number 7 roundel, helmeted driver, split rear wing. */
export function drawKart(g,x,y,o){
  o=o||{};
  const sc=o.scale||1, tilt=o.tilt||0, ph=o.phase||0, dmg=!!o.damaged;
  const WH='#f6f6f6', BK='#0a0a0a';
  g.save(); g.translate(x,y); g.rotate(tilt); g.scale(sc,sc); g.lineJoin='round'; g.lineCap='round';
  if(o.alpha!==undefined) g.globalAlpha=o.alpha;
  const steer=o.steer!==undefined?o.steer:clamp(tilt*1.6,-.4,.4), p=ph%16;   // banner kart passes steer:0 so its wheels point straight
  if(!o.noWheels){
    g.strokeStyle=BK; g.lineWidth=3.2; g.beginPath(); g.moveTo(-17,-20); g.lineTo(17,-20); g.moveTo(-19,17); g.lineTo(19,17); g.stroke();
    drawWheel(g,-18,-20,9,16,steer,p); drawWheel(g,18,-20,9,16,steer,p);
    drawWheel(g,-19.5,17,10,20,0,p); drawWheel(g,19.5,17,10,20,0,p);
  }
  // body
  g.beginPath(); g.moveTo(0,-33); g.quadraticCurveTo(5,-30,6,-22); g.lineTo(8,-10);
  g.quadraticCurveTo(14,-6,14,2); g.lineTo(14,14); g.quadraticCurveTo(14,24,10,25); g.lineTo(-10,25);
  g.quadraticCurveTo(-14,24,-14,14); g.lineTo(-14,2); g.quadraticCurveTo(-14,-6,-8,-10); g.lineTo(-6,-22);
  g.quadraticCurveTo(-5,-30,0,-33); g.closePath();
  g.fillStyle=WH; g.fill(); g.strokeStyle=BK; g.lineWidth=2; g.stroke();
  // twin stripes
  g.fillStyle=BK; g.fillRect(-4.6,-31,2.4,25); g.fillRect(2.2,-31,2.4,25); g.fillRect(-4.6,10,2.4,14.5); g.fillRect(2.2,10,2.4,14.5);
  // side vents
  for(const sx of [-1,1]){
    g.fillStyle=BK; rr(g,sx<0?-12.6:7.4,-2,5.2,15,1.4); g.fill();
    g.strokeStyle=WH; g.lineWidth=.9; g.beginPath(); for(let i=0;i<4;i++){ g.moveTo(sx<0?-12:8,1+i*3.2); g.lineTo(sx<0?-8:12,1+i*3.2); } g.stroke();
  }
  // number roundel
  g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1.7; g.beginPath(); g.arc(0,-18,6.6,0,6.283); g.fill(); g.stroke();
  g.fillStyle=BK; g.font='700 10px "Arial Black",Arial,sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('7',0,-17.6);
  // cockpit, driver
  g.fillStyle=BK; g.beginPath(); g.ellipse(0,3,7.6,10,0,0,6.283); g.fill();
  g.fillStyle='#2e2e2e'; rr(g,-8,7,16,6,2.6); g.fill();
  g.strokeStyle='#2e2e2e'; g.lineWidth=2.4; g.beginPath(); g.moveTo(-6.5,9); g.lineTo(-4.8,-2); g.moveTo(6.5,9); g.lineTo(4.8,-2); g.stroke();
  g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1; rr(g,-5.4,-4.4,10.8,2.8,1.2); g.fill(); g.stroke();
  g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1.6; g.beginPath(); g.arc(0,3,5.6,0,6.283); g.fill(); g.stroke();
  g.fillStyle=BK; g.beginPath(); g.ellipse(0,.6,3.7,2,0,0,6.283); g.fill();
  g.strokeStyle=BK; g.lineWidth=1.2; g.beginPath(); g.moveTo(0,3.6); g.lineTo(0,8.4); g.stroke();
  g.fillStyle='#fff'; g.fillRect(1.2,-.1,1.4,.9);
  // exhausts, rear wing
  g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=1.1;
  for(const sx of [-4.6,4.6]){ g.beginPath(); g.arc(sx,24.2,2.1,0,6.283); g.fill(); g.stroke(); }
  g.strokeStyle=BK; g.lineWidth=2; g.beginPath(); g.moveTo(-6,25); g.lineTo(-6,28); g.moveTo(6,25); g.lineTo(6,28); g.stroke();
  g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=1.3; rr(g,-21,27,42,7,2); g.fill(); g.stroke();
  g.strokeStyle=WH; g.lineWidth=1.6; g.beginPath(); g.moveTo(-15,30.6); g.lineTo(15,30.6); g.stroke();
  g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1; rr(g,-23,26,3,10,1); g.fill(); g.stroke(); rr(g,20,26,3,10,1); g.fill(); g.stroke();
  // front wing
  g.fillStyle=WH; g.strokeStyle=BK; g.lineWidth=1.6; rr(g,-19,-35.5,38,6,2); g.fill(); g.stroke();
  g.fillStyle=BK; g.strokeStyle=WH; g.lineWidth=1; rr(g,-21.5,-36,3,10,1); g.fill(); g.stroke(); rr(g,18.5,-36,3,10,1); g.fill(); g.stroke();
  g.fillStyle=BK; g.fillRect(-1,-35,2,4.4);
  // battle damage
  if(dmg){
    g.strokeStyle=BK; g.lineWidth=1.5; g.beginPath();
    g.moveTo(-10,-6); g.lineTo(-6,-2); g.lineTo(-9,3); g.moveTo(9,16); g.lineTo(5,19); g.lineTo(8,23);
    g.stroke();
    g.fillStyle='rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(9,-8,3.4,2.2,.5,0,6.283); g.fill();
  }
  g.restore();
}

export function drawFlame(g,x,y,len,w){
  const f=.78+.22*Math.sin(S.clk*55+x)+rnd(-.07,.07);
  g.save(); g.translate(x,y); g.lineJoin='round';
  g.fillStyle='#fff'; g.strokeStyle='#000'; g.lineWidth=1.4;
  g.beginPath(); g.moveTo(-w,0); g.quadraticCurveTo(-w*.6,len*.55*f,0,len*f); g.quadraticCurveTo(w*.6,len*.55*f,w,0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#8a8a8a'; g.beginPath(); g.moveTo(-w*.5,0); g.quadraticCurveTo(-w*.3,len*.3*f,0,len*.55*f); g.quadraticCurveTo(w*.3,len*.3*f,w*.5,0); g.closePath(); g.fill();
  g.restore();
}
