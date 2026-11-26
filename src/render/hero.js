/* The animated kart banner on the menu. */
import { hctx } from '../dom.js';
import { drawKart } from './kart.js';
import { S, view } from '../state.js';
import { rr } from '../util.js';

export function drawHero(){
  const g=hctx, w=328, h=150;
  g.setTransform(view.heroPx,0,0,view.heroPx,0,0); g.clearRect(0,0,w,h);
  g.save(); rr(g,0,0,w,h,4); g.clip();
  g.fillStyle='#141414'; g.fillRect(0,0,w,h);
  const t=S.clk, o40=(t*220)%40;
  for(let x=-40+o40;x<w;x+=40){
    g.fillStyle='#fff'; g.fillRect(x,0,20,10); g.fillRect(x+20,h-10,20,10);
    g.fillStyle='#000'; g.fillRect(x+20,0,20,10); g.fillRect(x,h-10,20,10);
  }
  const o90=(t*300)%90; g.fillStyle='rgba(255,255,255,.75)';
  for(let x=-90+o90;x<w;x+=90) g.fillRect(x,h/2-2,44,4);
  g.fillStyle='rgba(255,255,255,.18)';
  for(let i=0;i<9;i++){ const sx=((i*97+ (t*520)%w*1)%(w+60))*1, y=18+((i*37)%(h-36)); g.fillRect(w-((sx+i*61)%(w+60)),y,46+(i%3)*18,1.6); }
  // exhaust puffs trailing behind
  for(let i=0;i<7;i++){
    const k=((t*1.6+i/7)%1), px=118-k*115, py=75+Math.sin(i*2.3+t*3)*5;
    g.fillStyle='rgba(235,235,235,'+(0.55*(1-k))+')'; g.beginPath(); g.arc(px,py,4+k*14,0,6.283); g.fill();
  }
  drawKart(g,196,75+Math.sin(t*3)*2.2,{scale:1.72,tilt:Math.PI/2+Math.sin(t*1.7)*.035,steer:0,phase:t*90});
  g.restore();
  g.strokeStyle='#f6f6f6'; g.lineWidth=2; rr(g,1,1,w-2,h-2,4); g.stroke();
}
