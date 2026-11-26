/* The 3-2-1-GO start lights, used at race start and after a resume. */
import { SND } from '../audio.js';
import { cdEl } from '../dom.js';
import { S } from '../state.js';
import { $ } from '../util.js';

export function advanceCountdown(dt){
  S.cdT+=dt;
  const n=Math.floor(S.cdT);
  if(n!==S.cdShown){
    S.cdShown=n;
    const num=$('cdNum'), lights=cdEl.querySelectorAll('.lights i');
    if(n<3){
      num.classList.remove('goo'); num.textContent=String(3-n); retrigger(num);
      lights.forEach((l,i)=>l.classList.toggle('on',i<=n)); SND.beep(false);
    }else{
      num.textContent='GO!'; num.classList.add('goo'); retrigger(num);
      lights.forEach(l=>l.classList.add('on')); SND.beep(true);
      $('cdHint').hidden=true; S.goShow=.8; S.state='playing'; S.cdFrozen=false;
      if(S.cdMode==='start'){ SND.startTrack('game'); }
      SND.startEngine();
    }
  }
}
function retrigger(el){ el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
