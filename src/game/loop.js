/* One simulation step: speed curve, power-up timers, spawning, collisions. */
import { SND } from '../audio.js';
import { BOOST_MUL, COIN_PTS, HEART_PTS, MAGNET_R, MONSTER_MUL, MONSTER_ZOOM, speedAt, W } from '../config.js';
import { cdEl } from '../dom.js';
import { sweptHit } from './collision.js';
import { burst, emitSmoke, popup, updateParticles } from './effects.js';
import { heal, onCrash, steerKart } from './player.js';
import { activateBoost, activateMagnet, collectCoin, collectPart, endMonster } from './powerups.js';
import { moveDecor } from './scenery.js';
import { spawnWave } from './spawner.js';
import { K, S, view } from '../state.js';
import { advanceCountdown } from '../ui/countdown.js';
import { toGameOver } from '../ui/screens.js';
import { lerp, rnd } from '../util.js';

export function playStep(dt){
  S.t+=dt; S.base=speedAt(S.t); S.d=(S.base-250)/630;
  const tm=S.monster>0?MONSTER_MUL:S.boost>0?BOOST_MUL:1;
  S.mul+=(tm-S.mul)*Math.min(1,dt*3);
  S.v=S.base*S.mul; S.topV=Math.max(S.topV,S.v);
  S.zoom+=((S.monster>0?MONSTER_ZOOM:1)-S.zoom)*Math.min(1,dt*3);
  const dy=S.v*dt; S.dist+=dy/12; S.scroll+=dy;
  steerKart(dt);
  K.inv=Math.max(0,K.inv-dt); K.kick=Math.max(0,K.kick-dt); K.morph=Math.min(1,K.morph+dt/.6); K.bAnim=Math.max(0,(K.bAnim||0)-dt);
  if(S.boost>0){ S.boost-=dt; if(S.boost<=0){ S.boost=0; SND.powerDown(); } }
  if(S.magnet>0){ S.magnet-=dt; if(S.magnet<=0){ S.magnet=0; SND.powerDown(); } }
  if(S.monster>0){ S.monster-=dt; if(S.monster<=0) endMonster(); }
  S.puT.part-=dt; S.puT.boost-=dt; S.puT.magnet-=dt;
  if(S.clear>0) S.clear=Math.max(0,S.clear-dt);
  if(K.damaged){
    K.heal-=dt; S.heartTimer-=dt;
    if(K.heal<=0) heal('timer');
  }
  S.spawnDist+=dy;
  let spacing=lerp(430,270,S.d); if(S.boost>0) spacing*=1.8;   // speed up: waves are spread out
  if(S.spawnDist>=spacing){ S.spawnDist-=spacing; spawnWave(spacing); }

  for(const o of S.objs){
    const prevY=o.y;
    o.y+=S.v*o.sf*dt;
    if(o.type==='car'){ if(o.fly){ o.x+=o.vx*dt; o.rot+=o.vr*dt; } else o.x=o.bx+Math.sin(S.clk*2+o.ph)*3; }
    if(o.done||o.dead) continue;
    if(o.type==='coin' && S.magnet>0){                 // electric field pulls nearby coins in
      const dx=K.x-o.x, dy2=K.y-o.y, dd=Math.hypot(dx,dy2);
      if(dd<MAGNET_R){
        if(dd<22){ collectCoin(o); continue; }
        const st=Math.min(dd,(480+(MAGNET_R-dd)*5)*dt); o.x+=dx/dd*st; o.y+=dy2/dd*st;
        if(Math.random()<.25) S.parts.push({k:'spark',x:o.x,y:o.y,vx:rnd(-40,40),vy:rnd(-40,40),life:.25,max:.25,r:1.8,world:false});
      }
    }
    if(!sweptHit(o,prevY)) continue;
    if(o.type==='coin'){
      collectCoin(o);
    }else if(o.type==='boost'){ o.dead=true; activateBoost(o);
    }else if(o.type==='magnet'){ o.dead=true; activateMagnet(o);
    }else if(o.type==='part'){ o.dead=true; collectPart(o);
    }else if(o.type==='heart'){
      o.dead=true;
      if(K.damaged){ SND.heart(); heal('heart'); }
      else{ S.bonus+=HEART_PTS; SND.heart(); popup(o.x,o.y-14,'+'+HEART_PTS); burst(o.x,o.y,10,140,.4,true); }
    }else{
      onCrash(o);
      if(S.state!=='playing') break;
    }
  }
  S.objs=S.objs.filter(o=>!o.dead && o.y<view.H+120 && o.x>-80 && o.x<W+80);
  S.score=Math.floor(S.dist)+S.coins*COIN_PTS+S.bonus;
}

export function update(dt){
  S.clk+=dt;
  const st=S.state;
  if(st==='menu'){ S.scroll+=170*dt; moveDecor(dt,170); S.v=170; }
  else if(st==='countdown'){
    if(!S.cdFrozen){ const v=110+Math.min(S.cdT,3)*30; S.v=v; S.scroll+=v*dt; moveDecor(dt,v); }
    if(!S.cdFrozen) steerKart(dt);          // resume countdown after a pause: kart stays put
    advanceCountdown(dt);
  }
  else if(st==='playing'){
    playStep(dt); moveDecor(dt,S.v);
    if(S.magnet>0){ S.zapAcc+=dt; if(S.zapAcc>.3){ S.zapAcc=0; SND.zap(); } }
    if(S.goShow>0){ S.goShow-=dt; if(S.goShow<=0) cdEl.hidden=true; }
    if(K.damaged) emitSmoke(dt,55,K.x+Math.sin(K.tilt)*-4,K.y+K.hh+6,false);
  }
  else if(st==='exploding' || st==='gameover'){
    S.v*=Math.exp(-2.4*dt); S.scroll+=S.v*dt; moveDecor(dt,S.v);
    for(const o of S.objs){ o.y+=S.v*o.sf*dt; if(o.fly){ o.x+=o.vx*dt; o.rot+=o.vr*dt; } }
    S.overT+=dt;
    if(!K.alive && S.overT<3.5) emitSmoke(dt,30,K.x,K.y,true);
    if(st==='exploding' && S.overT>1.5) toGameOver();
  }
  updateParticles(dt);
  if(SND.eng) SND.setEngine(S.v,S.state==='playing');
}
