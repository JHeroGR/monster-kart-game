/* Score, distance, coins, parts tray and power-up timers. */
import { MAGNET_T, MONSTER_T } from '../config.js';
import { ctrls, hud } from '../dom.js';
import { S } from '../state.js';
import { $, clamp } from '../util.js';

export const cache={};
function setT(k,el,v){ if(cache[k]!==v){ cache[k]=v; el.textContent=v; } }
const hScore=$('hScore'), hDist=$('hDist'), hCoins=$('hCoins');
const slots=[$('sl0'),$('sl1'),$('sl2')];
const chips=[['chMagnet','tMagnet','bMagnet',()=>S.magnet,MAGNET_T],['chMonster','tMonster','bMonster',()=>S.monster,MONSTER_T]].map(c=>({el:$(c[0]),t:$(c[1]),b:$(c[2]),val:c[3],max:c[4],k:c[0]}));
export function updateHud(){
  if(hud.hidden) return;
  ctrls.classList.toggle('locked',S.paused||(S.state==='countdown'&&S.cdFrozen));
  setT('s',hScore,S.score.toLocaleString('en-US'));
  setT('d',hDist,Math.floor(S.dist).toLocaleString('en-US')+' m');
  setT('c',hCoins,String(S.coins));
  for(let i=0;i<3;i++){ const on=!!S.pieces[i]; if(cache['p'+i]!==on){ cache['p'+i]=on; slots[i].classList.toggle('on',on); } }
  for(const c of chips){
    const v=c.val(), on=v>0; if(c.el.hidden===on) c.el.hidden=!on;
    if(on){ setT(c.k,c.t,String(Math.ceil(v))); c.b.style.width=clamp(v/c.max,0,1)*100+'%'; }
  }
}
