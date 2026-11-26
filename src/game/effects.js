/* Particles, smoke, score popups. */
import { K, S } from '../state.js';
import { rnd } from '../util.js';

export function popup(x,y,text){ S.pops.push({x,y,text,life:1,max:1}); }
export function burst(x,y,n,spd,life,world){
  for(let i=0;i<n;i++){ const a=rnd(0,6.28), s=rnd(.3,1)*spd;
    S.parts.push({k:'spark',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:life*rnd(.6,1),max:life,r:rnd(1.5,3.2),world}); }
}

export function updateParticles(dt){
  for(const p of S.parts){
    p.life-=dt;
    if(p.k==='ring'){ p.r+=p.grow*dt; continue; }
    p.x+=p.vx*dt; p.y+=p.vy*dt+(p.world?S.v*dt*.6:0);
    if(p.k==='debris'){ p.rot+=p.vr*dt; p.vx*=1-1.2*dt; p.vy*=1-1.2*dt; }
    else if(p.k==='fire'){ p.vx*=1-2.2*dt; p.vy*=1-2.2*dt; }
    else p.vy+=200*dt;
  }
  S.parts=S.parts.filter(p=>p.life>0);
  for(const s of S.smoke){ s.life-=dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.r+=26*dt; }
  S.smoke=S.smoke.filter(s=>s.life>0);
  for(const p of S.pops){ p.life-=dt; p.y-=28*dt; }
  S.pops=S.pops.filter(p=>p.life>0);
  S.shake=Math.max(0,S.shake-dt*1.6); S.flash=Math.max(0,S.flash-dt*1.8);
}
export function emitSmoke(dt,rate,x,y,heavy){
  S.smokeAcc+=dt*rate;
  while(S.smokeAcc>=1){
    S.smokeAcc-=1;
    S.smoke.push({x:x+rnd(-5,5),y:y,vx:rnd(-16,16)-K.vx*.12,vy:S.v*.78+rnd(-24,24),r:rnd(4,7)*(heavy?1.5:1),life:rnd(.55,.95),max:.95,g:Math.random()<.2?120:rnd(190,255)});
  }
}
