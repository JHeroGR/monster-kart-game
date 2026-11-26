/* Portrait-only handling. */
import { SND } from '../audio.js';
import { rotateEl, vp } from '../dom.js';
import { coarse, layout } from '../layout.js';
import { drag, input, view } from '../state.js';
import { pauseGame } from './screens.js';

export function checkOrientation(){
  const land=coarse() && window.innerWidth>window.innerHeight;
  if(land!==view.blocked){
    view.blocked=land; rotateEl.hidden=!land;
    if(land){ pauseGame(); drag.active=false; input.left=input.right=false; }
    SND.sync();
  }
  layout();
}

/* Portrait only: lock where the platform allows it, and show the rotate notice everywhere else. */
export function initOrientation(){
  try{ screen.orientation && screen.orientation.lock && screen.orientation.lock('portrait').catch(()=>{}); }catch(e){}
  new ResizeObserver(checkOrientation).observe(vp);
  addEventListener('resize',checkOrientation); addEventListener('orientationchange',checkOrientation);
  checkOrientation();
}
