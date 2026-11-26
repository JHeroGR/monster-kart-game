/* Decides what appears next. Every row keeps at least one open lane, and difficulty rises with speed. */
import { SPAWN_Y } from '../config.js';
import { spawnObj } from './objects.js';
import { K, S } from '../state.js';
import { clamp, pick, rnd } from '../util.js';

export function spawnWave(spacing){
  const d=S.d, maxB=d<.15?1:d<.45?2:3;
  let n=1; if(Math.random()<.3+d*.5) n++; if(Math.random()<d*.6) n++; n=Math.min(n,maxB);
  if(S.boost>0) n=1;                       // speed up: fewer obstacles
  const open=S.nextOpen;
  const cand=[0,1,2,3].filter(l=>l!==open).sort(()=>Math.random()-.5);
  const carChance=.18+d*.25;
  for(let i=0;i<(S.clear>0?0:n);i++){          // road stays clear after the monster kart
    const r=Math.random();
    spawnObj(r<carChance?'car':(r<carChance+(1-carChance)*.5?'rock':'pothole'),cand[i],SPAWN_Y);
  }
  // next wave's open lane is never more than one lane away, so every pattern stays passable
  const no=clamp(open+pick([-1,0,0,1]),0,3); S.nextOpen=no;
  const lane=Math.random()<.5?open:no, midY=SPAWN_Y-spacing*.5;
  if(K.damaged && S.heartTimer<=0 && !S.objs.some(o=>o.type==='heart')){
    spawnObj('heart',lane,midY); S.heartTimer=5.5;
  }else if(Math.random()<.4){
    const c=Math.random()<.1?5:3;
    for(let i=0;i<c;i++) spawnObj('coin',lane,midY-(i-(c-1)/2)*34);
  }
  // power-ups ride in the next row's open lane, so they never sit behind an obstacle. One per wave.
  const puY=SPAWN_Y-spacing, T=S.puT;
  const missing=[0,1,2].filter(i=>!S.pieces[i] && !S.objs.some(o=>o.type==='part'&&o.idx===i));
  if(S.monster<=0 && T.part<=0 && missing.length){
    const o=spawnObj('part',no,puY); o.idx=pick(missing); T.part=rnd(12,18);
  }else if(S.monster<=0 && S.boost<=0 && T.boost<=0){
    spawnObj('boost',no,puY); T.boost=rnd(26,38);
  }else if(S.magnet<=0 && T.magnet<=0){
    spawnObj('magnet',no,puY); T.magnet=rnd(30,42);
  }
}
