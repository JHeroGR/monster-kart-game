/* Draws one frame of the race in painter order. */
import { BOOST_ANIM, W } from '../config.js';
import { gfx } from '../dom.js';
import { drawFlame, drawKart } from './kart.js';
import { drawMonster } from './monster.js';
import { drawPothole, drawRival, drawRock } from './obstacles.js';
import { drawCoin, drawField, drawHeart, drawPickup } from './pickups.js';
import { drawRoad } from './road.js';
import { K, S, tex, view } from '../state.js';
import { clamp, rnd, rr } from '../util.js';

export function render(){
  const g=gfx; g.setTransform(view.pxr,0,0,view.pxr,0,0);
  g.save();
  if(S.shake>0){ const m=S.shake*5; g.translate(rnd(-m,m),rnd(-m,m)); }
  if(S.zoom<.9995){ g.translate(W/2,K.y); g.scale(S.zoom,S.zoom); g.translate(-W/2,-K.y); }   // monster kart zoom-out
  drawRoad(g);
  const st=S.state, showKart=(st==='countdown'||st==='playing'||st==='exploding'&&K.alive);
  // potholes sit under everything
  for(const o of S.objs) if(o.type==='pothole') drawPothole(g,o);
  // exhaust smoke trail
  for(const s of S.smoke){
    const a=clamp(s.life/s.max,0,1)*.78;
    g.fillStyle='rgba('+(s.g|0)+','+(s.g|0)+','+(s.g|0)+','+a+')'; g.beginPath(); g.arc(s.x,s.y,s.r,0,6.283); g.fill();
  }
  for(const o of S.objs){ if(o.type==='coin') drawCoin(g,o); else if(o.type==='heart') drawHeart(g,o); else if(o.type==='boost'||o.type==='magnet'||o.type==='part') drawPickup(g,o); }
  for(const o of S.objs){ if(o.type==='rock') drawRock(g,o); else if(o.type==='car') drawRival(g,o); }
  // wreck scorch mark
  if(!K.alive && (st==='exploding'||st==='gameover')){
    g.fillStyle='rgba(0,0,0,.85)'; g.beginPath(); g.ellipse(K.x,K.y,30,24,.3,0,6.283); g.fill();
    g.strokeStyle='#666'; g.lineWidth=2; g.stroke();
  }
  if(showKart){
    const blink=K.inv>0 && Math.floor(S.clk*20)%2===0;
    const kx=K.x+(K.kick>0?rnd(-1.5,1.5):0);
    const ba=Math.max(0,K.bAnim||0)/BOOST_ANIM;      // speed-up launch animation, 1 -> 0
    if(S.boost>0||S.monster>0){
      const big=S.monster>0; const ln=big?46:30+34*ba, w=big?5:3.2;
      for(const sx of [-4.6,4.6]) drawFlame(g,kx+sx*(big?3.4:1),K.y+(big?42:26),ln,w);
    }
    if(S.monster>0){
      const e=K.morph*K.morph*(3-2*K.morph);
      drawMonster(g,kx,K.y,{scale:.55+.45*e,tilt:K.tilt,phase:S.scroll*.45});
    }else if(ba>0){                                   // lurch back, stretch, afterimages trailing behind
      for(let i=3;i>=1;i--) drawKart(g,kx,K.y+i*17,{scale:1,tilt:K.tilt,phase:S.scroll*.45,alpha:.3*ba*(1-i*.22)});
      g.save(); g.translate(kx,K.y+10*ba); g.scale(1-.08*ba,1+.24*ba); g.translate(-kx,-K.y);
      drawKart(g,kx,K.y,{scale:1,tilt:K.tilt+Math.sin(S.clk*60)*.04*ba,phase:S.scroll*.9,damaged:K.damaged,alpha:blink?.45:1});
      g.restore();
    }else drawKart(g,kx,K.y,{scale:1,tilt:K.tilt,phase:S.scroll*.45,damaged:K.damaged,alpha:blink?.45:1});
    if(S.magnet>0) drawField(g,kx,K.y);
  }
  // particles
  for(const p of S.parts){
    const t=1-p.life/p.max;
    if(p.k==='fire'){
      const r=p.r*(1-t*.55)+t*4, col=t<.3?'#ffffff':t<.65?'#bdbdbd':'#5a5a5a';
      g.globalAlpha=clamp(p.life/p.max*1.4,0,1); g.fillStyle=col; g.strokeStyle='#000'; g.lineWidth=2;
      g.beginPath(); g.arc(p.x,p.y,r,0,6.283); g.fill(); g.stroke(); g.globalAlpha=1;
    }else if(p.k==='debris'){
      g.save(); g.translate(p.x,p.y); g.rotate(p.rot); g.globalAlpha=clamp(p.life/p.max*1.6,0,1);
      if(p.wheel){ g.fillStyle='#0a0a0a'; g.strokeStyle='#fff'; g.lineWidth=1.6; rr(g,-4,-7,8,14,2); g.fill(); g.stroke(); }
      else{ g.fillStyle=p.c; g.strokeStyle=p.c==='#0a0a0a'?'#fff':'#000'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-p.r,-p.r*.6); g.lineTo(p.r,-p.r*.3); g.lineTo(p.r*.4,p.r); g.closePath(); g.fill(); g.stroke(); }
      g.restore();
    }else if(p.k==='ring'){
      g.globalAlpha=clamp(p.life/p.max,0,1); g.strokeStyle='#fff'; g.lineWidth=1+4*p.life/p.max; g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.stroke(); g.globalAlpha=1;
    }else{
      g.globalAlpha=clamp(p.life/p.max*1.5,0,1); g.fillStyle='#fff'; g.beginPath(); g.arc(p.x,p.y,p.r,0,6.283); g.fill(); g.globalAlpha=1;
    }
  }
  // popups
  g.textAlign='center'; g.textBaseline='middle'; g.font='700 18px "Barlow Semi Condensed",Arial,sans-serif'; g.lineJoin='round';
  for(const p of S.pops){
    g.globalAlpha=clamp(p.life*2,0,1); g.lineWidth=4; g.strokeStyle='#000'; g.strokeText(p.text,p.x,p.y); g.fillStyle='#fff'; g.fillText(p.text,p.x,p.y);
  }
  g.globalAlpha=1;
  g.restore();
  if(tex.vignette) g.drawImage(tex.vignette,0,0);
  if(S.flash>0){ g.fillStyle='rgba(255,255,255,'+clamp(S.flash,0,1)*.85+')'; g.fillRect(0,0,W,view.H); }
  if(K.damaged && S.state==='playing'){          // soft warning edge while smoking
    const a=.12+.08*Math.sin(S.clk*8); g.fillStyle='rgba(255,255,255,'+a+')'; g.fillRect(0,0,5,view.H); g.fillRect(W-5,0,5,view.H);
  }
}
