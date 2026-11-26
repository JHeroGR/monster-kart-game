/* Menu, race start, pause, resume and game over. */
import { SND } from '../audio.js';
import { cdEl, ctrls, hud, menu, over, pauseEl } from '../dom.js';
import { resetRun } from '../game/run.js';
import { seedDecor } from '../game/scenery.js';
import { drag, input, K, S } from '../state.js';
import { cache } from './hud.js';
import { $, store } from '../util.js';

export function toGameOver(){
  S.state='gameover';
  const b=S.best; let nb=false;
  if(S.score>b.score){ b.score=S.score; nb=true; }
  if(S.dist>b.dist){ b.dist=S.dist; nb=true; }
  S.newBest=nb; store.set('mk-best',b);
  $('oDist').textContent=Math.floor(S.dist).toLocaleString('en-US');
  $('oScore').textContent=S.score.toLocaleString('en-US');
  $('oCoins').textContent=S.coins;
  $('oSpeed').textContent=Math.round(S.topV*.3)+' km/h';
  $('oBest').textContent=Math.floor(b.dist).toLocaleString('en-US')+' m';
  $('newBest').hidden=!nb;
  hud.hidden=true; ctrls.hidden=true; over.hidden=false;
  SND.gameOver(); setTimeout(()=>{ if(S.state==='gameover') SND.startTrack('over'); },1700);
}

export function setMode(m){
  S.mode=m; store.set('mk-mode',m);
  $('mTouch').setAttribute('aria-pressed',String(m==='touch'));
  $('mArrows').setAttribute('aria-pressed',String(m==='arrows'));
}
export function showHud(on){
  hud.hidden=!on; ctrls.hidden=!(on && S.mode==='arrows');
}
export function goMenu(){
  resetRun(); seedDecor();
  S.state='menu'; S.paused=false; S.cdFrozen=false;
  menu.hidden=false; over.hidden=true; pauseEl.hidden=true; cdEl.hidden=true; showHud(false);
  const b=S.best; $('mBest').textContent=b.dist>0?'BEST  '+Math.floor(b.dist).toLocaleString('en-US')+' M':'';
  SND.stopEngine(); SND.startTrack('menu'); SND.sync();
}
export function startRace(){
  SND.init();
  resetRun(); seedDecor();
  SND.stopTrack(); SND.whoosh();
  S.state='countdown'; S.cdMode='start'; S.cdFrozen=false; S.cdT=0; S.cdShown=-1; S.paused=false;
  menu.hidden=true; over.hidden=true; pauseEl.hidden=true; cdEl.hidden=false;
  $('cdHint').hidden=false; $('cdHint').textContent=S.mode==='touch'?'Drag to steer':'Use the arrow buttons';
  cdEl.querySelectorAll('.lights i').forEach(l=>l.classList.remove('on'));
  $('cdNum').textContent=''; showHud(true); cache.s=cache.d=cache.v=cache.c=undefined;
  SND.sync();
}
export function pauseGame(){
  if(S.paused) return;
  if(S.state!=='playing' && S.state!=='countdown') return;
  S.prev=S.state; S.paused=true; drag.active=false; input.left=input.right=false; K.vx=0;
  $('btnL').classList.remove('on'); $('btnR').classList.remove('on');
  pauseEl.hidden=false; SND.stopEngine(); SND.sync();
}
export function resumeGame(){
  if(!S.paused) return;
  S.paused=false; pauseEl.hidden=true;
  drag.active=false; input.left=input.right=false;
  if(S.prev==='playing'){      // brief 3-2-1 so a fast race doesn't restart under the player's thumb
    S.state='countdown'; S.cdMode='resume'; S.cdFrozen=true; S.cdT=0; S.cdShown=-1; cdEl.hidden=false;
    $('cdHint').hidden=true; cdEl.querySelectorAll('.lights i').forEach(l=>l.classList.remove('on')); $('cdNum').textContent='';
  }
  SND.sync();
}
