/* Coins, speed boost, coin magnet, kart parts and the monster kart. */
import { SND } from '../audio.js';
import { BOOST_ANIM, BOOST_T, MAGNET_T, MONSTER_T } from '../config.js';
import { burst, popup } from './effects.js';
import { crumble } from './objects.js';
import { K, S } from '../state.js';
import { rnd } from '../util.js';

export function collectCoin(o){
  o.dead=true; S.coins++; SND.coin();
  burst(o.x,o.y,6,110,.35,true);
}
export function activateBoost(o){
  S.boost=BOOST_T; K.bAnim=BOOST_ANIM; SND.boost(); burst(o.x,o.y,14,220,.5,true); S.flash=Math.max(S.flash,.2);
  S.parts.push({k:'ring',x:K.x,y:K.y+10,r:10,life:.45,max:.45,grow:340});
  S.parts.push({k:'ring',x:K.x,y:K.y+10,r:4,life:.7,max:.7,grow:200});
  burst(K.x,K.y+30,16,260,.5,false);
}
export function activateMagnet(o){
  S.magnet=MAGNET_T; SND.magnet(); popup(K.x,K.y-50,'MAGNET'); burst(o.x,o.y,14,220,.5,true);
  S.parts.push({k:'ring',x:K.x,y:K.y,r:8,life:.5,max:.5,grow:260});
}
export function collectPart(o){
  if(S.monster>0){ S.bonus+=25; SND.coin(); popup(o.x,o.y-14,'+25'); return; }
  S.pieces[o.idx]=true;
  const n=S.pieces.filter(Boolean).length;
  SND.part(n); popup(K.x,K.y-50,'PART '+n+'/3'); burst(o.x,o.y,12,180,.5,true);
  if(n===3) startMonster();
}
export function startMonster(){
  S.monster=MONSTER_T; S.pieces=[false,false,false]; S.boost=0; S.puT.part=rnd(14,20);
  K.morph=0; K.hw=30; K.hh=40; K.damaged=false; K.heal=0; K.inv=0;       // the transformation also repairs the kart
  S.flash=1; S.shake=.7; SND.transform();
  popup(K.x,K.y-70,'MONSTER KART!');
  S.parts.push({k:'ring',x:K.x,y:K.y,r:10,life:.7,max:.7,grow:520});
  S.parts.push({k:'ring',x:K.x,y:K.y,r:4,life:1,max:1,grow:300});
  burst(K.x,K.y,26,320,.8,false);
}
export function endMonster(){
  S.monster=0; K.hw=14; K.hh=22; K.inv=1.4; K.morph=1; S.flash=.6; SND.powerDown();
  S.clear=10;                                     // 10 seconds with no obstacles; anything already on the track is wiped
  for(const o of S.objs) if(o.type==='rock'||o.type==='pothole'||o.type==='car'){ o.dead=true; burst(o.x,o.y,5,120,.4,true); }
  S.objs=S.objs.filter(o=>!o.dead);
  S.parts.push({k:'ring',x:K.x,y:K.y,r:10,life:.5,max:.5,grow:380});
}
export function smash(o){
  S.shake=Math.max(S.shake,.3);
  if(o.type==='pothole'){ SND.stomp(); burst(o.x,o.y,6,120,.35,true); return; }
  SND.smash(o.type); crumble(o); S.bonus+=10; popup(o.x,o.y-16,'SMASH +10');
}
