/* The player kart: steering, taking damage, healing and exploding. */
import { SND } from '../audio.js';
import { HEAL_TIME, MAXVX, ROAD_L, ROAD_R } from '../config.js';
import { burst, popup } from './effects.js';
import { crumble } from './objects.js';
import { smash } from './powerups.js';
import { drag, input, K, S } from '../state.js';
import { clamp, pick, rnd } from '../util.js';

export function steerKart(dt){
  let target=null; const lim=Math.max(16,K.hw+4);
  if(S.mode==='touch' && drag.active) target=drag.kx+(drag.px-drag.sx)*1.2/S.zoom;
  if(target!==null){
    target=clamp(target,ROAD_L+lim,ROAD_R-lim);
    K.vx=clamp((target-K.x)*18,-720,720);
  }else{
    const dir=(input.left?-1:0)+(input.right?1:0);
    K.vx+=(dir*MAXVX-K.vx)*Math.min(1,dt*14);
  }
  K.x+=K.vx*dt;
  if(K.x<ROAD_L+lim){ K.x=ROAD_L+lim; K.vx=0; } else if(K.x>ROAD_R-lim){ K.x=ROAD_R-lim; K.vx=0; }
  K.tilt+=(clamp(K.vx/600,-1,1)*.22-K.tilt)*Math.min(1,dt*12);
}

export function heal(kind){
  K.damaged=false; K.heal=0;
  popup(K.x,K.y-40,kind==='heart'?'REPAIRED':'SMOKE CLEARED');
  burst(K.x,K.y,18,160,.6,false); SND.repair();
}

export function onCrash(o){
  o.done=true;
  if(S.monster>0){ smash(o); return; }               // invincible
  if(K.inv>0){ crumble(o); return; }          // two obstacles touching in the same instant count once
  K.inv=.18; K.kick=.35; S.shake=Math.max(S.shake,.5); S.flash=Math.max(S.flash,.25);
  if(K.damaged){ crumble(o); explode(); return; }
  K.damaged=true; K.heal=HEAL_TIME; S.heartTimer=1.5;
  SND.hit(); popup(K.x,K.y-40,'HIT!'); crumble(o); burst(K.x,K.y-10,14,200,.45,true);
}
export function explode(){
  S.state='exploding'; S.overT=0; K.alive=false; K.damaged=false; drag.active=false;
  SND.stopTrack(); SND.stopEngine(); SND.explode();
  S.shake=1.3; S.flash=1;
  for(let i=0;i<46;i++){ const a=rnd(0,6.28), s=rnd(30,300);
    S.parts.push({k:'fire',x:K.x+rnd(-8,8),y:K.y+rnd(-10,10),vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:rnd(.5,1.2),max:1.2,r:rnd(7,20),world:true}); }
  for(let i=0;i<20;i++){ const a=rnd(0,6.28), s=rnd(120,460);
    S.parts.push({k:'debris',x:K.x,y:K.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(1,1.7),max:1.7,r:rnd(3,8),rot:rnd(0,6),vr:rnd(-12,12),c:pick(['#f6f6f6','#0a0a0a','#8a8a8a']),wheel:i<4,world:true}); }
  S.parts.push({k:'ring',x:K.x,y:K.y,r:10,life:.6,max:.6,grow:420});
  S.parts.push({k:'ring',x:K.x,y:K.y,r:4,life:.9,max:.9,grow:240});
}
