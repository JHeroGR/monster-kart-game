/* Factory for everything that travels down the road: rocks, potholes, rival cars, coins, hearts, power-ups. */
import { SND } from '../audio.js';
import { laneX } from '../config.js';
import { K, S } from '../state.js';
import { pick, rnd } from '../util.js';

export function spawnObj(type,lane,y){
  const o={type,x:laneX(lane),bx:laneX(lane),y,sf:1,hw:14,hh:14,done:false,dead:false,ph:Math.random()*6.28,rot:0,vx:0,vr:0,fly:false};
  if(type==='rock'){ o.hw=17; o.hh=14; o.sz=rnd(.9,1.15); o.poly=blob(9,21,17,.22); }
  else if(type==='pothole'){ o.hw=21; o.hh=11; o.sz=rnd(.9,1.1); o.poly=blob(13,27,17,.14); o.cracks=[0,1,2,3].map(()=>({a:rnd(0,6.28),l:rnd(8,16)})); }
  else if(type==='car'){ o.hw=16; o.hh=27; o.sf=.8; o.variant=(Math.random()*3)|0; o.num=1+((Math.random()*98)|0); }
  else if(type==='coin'){ o.hw=13; o.hh=13; }
  else if(type==='heart'){ o.hw=14; o.hh=13; }
  else if(type==='boost'||type==='magnet'||type==='part'){ o.hw=16; o.hh=16; }
  S.objs.push(o); return o;
}

function blob(n,rx,ry,j){ const p=[]; for(let i=0;i<n;i++){ const a=i/n*6.283, k=1+rnd(-j,j); p.push([Math.cos(a)*rx*k,Math.sin(a)*ry*k]); } return p; }

export function crumble(o){
  if(o.type==='rock'){
    o.dead=true; SND.crumble();
    for(let i=0;i<9;i++) S.parts.push({k:'debris',x:o.x,y:o.y,vx:rnd(-160,160),vy:rnd(-200,60),life:rnd(.5,.9),max:.9,r:rnd(2.5,6),rot:rnd(0,6),vr:rnd(-9,9),c:pick(['#cfcfcf','#8a8a8a','#4a4a4a']),world:true});
  }else if(o.type==='car'){
    o.fly=true; o.vx=(o.x<K.x?-1:1)*rnd(180,300); o.vr=(o.x<K.x?-1:1)*rnd(4,8);
  }
}
