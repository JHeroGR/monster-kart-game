/* Touch drag, on-screen arrow buttons, keyboard, and every button click. Call initInput() once at boot. */
import { SND } from '../audio.js';
import { W } from '../config.js';
import { stage } from '../dom.js';
import { drag, input, K, S, view } from '../state.js';
import { goMenu, pauseGame, resumeGame, setMode, startRace } from './screens.js';
import { $ } from '../util.js';

export function initInput(){
  function firstGesture(){
    SND.init(); SND.sync();
    if(SND.ok() && S.state==='menu') SND.startTrack('menu');
  }
  document.addEventListener('pointerdown',firstGesture,{passive:true});
  document.addEventListener('keydown',firstGesture);

  function stageX(e){ const r=stage.getBoundingClientRect(); return (e.clientX-r.left)/(r.width/W); }
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button')) return;
    if(S.mode!=='touch' || view.blocked || S.paused || S.cdFrozen) return;
    if(S.state!=='playing' && S.state!=='countdown') return;
    if(drag.active && stage.hasPointerCapture && stage.hasPointerCapture(drag.id)) return;   // a second finger never takes over the steering finger
    drag.active=true; drag.id=e.pointerId; drag.sx=drag.px=stageX(e); drag.kx=K.x;
    try{ stage.setPointerCapture(e.pointerId); }catch(_){}
  });
  stage.addEventListener('pointermove',e=>{ if(drag.active && e.pointerId===drag.id) drag.px=stageX(e); });
  const endDrag=e=>{ if(drag.active && e.pointerId===drag.id) drag.active=false; };
  stage.addEventListener('pointerup',endDrag); stage.addEventListener('pointercancel',endDrag);
  stage.addEventListener('contextmenu',e=>e.preventDefault());

  for(const [id,key] of [['btnL','left'],['btnR','right']]){
    const b=$(id);
    const on=e=>{ e.preventDefault(); if(S.paused||view.blocked||S.cdFrozen) return; input[key]=true; b.classList.add('on'); try{ b.setPointerCapture(e.pointerId); }catch(_){} };
    const off=()=>{ input[key]=false; b.classList.remove('on'); };
    b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off);
    b.addEventListener('pointercancel',off); b.addEventListener('lostpointercapture',off);
  }
  const KEYS={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
  addEventListener('keydown',e=>{
    const k=KEYS[e.code];
    if(k){ e.preventDefault(); if(!S.paused && !view.blocked && !S.cdFrozen) input[k]=true; return; }   // paused: steering keys do nothing
    if(e.code==='Escape'||e.code==='KeyP'){ S.paused?resumeGame():pauseGame(); }
    if(e.code==='Enter' && S.state==='menu' && document.activeElement===document.body) startRace();
  });
  addEventListener('keyup',e=>{ const k=KEYS[e.code]; if(k) input[k]=false; });
  addEventListener('blur',()=>{ input.left=input.right=false; drag.active=false; });
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) pauseGame(); SND.sync(); });

  $('btnStart').addEventListener('click',()=>{ SND.init(); SND.click(); startRace(); });
  $('btnAgain').addEventListener('click',()=>{ SND.init(); SND.click(); startRace(); });
  $('btnMenu').addEventListener('click',()=>{ SND.click(); SND.stopTrack(); goMenu(); });
  $('btnResume').addEventListener('click',()=>{ SND.click(); resumeGame(); });
  $('btnPauseMenu').addEventListener('click',()=>{ SND.click(); SND.stopTrack(); goMenu(); });
  $('btnPause').addEventListener('click',()=>{ SND.click(); pauseGame(); });
  $('mTouch').addEventListener('click',()=>{ setMode('touch'); SND.toggle(); });
  $('mArrows').addEventListener('click',()=>{ setMode('arrows'); SND.toggle(); });
  document.querySelectorAll('.sndBtn').forEach(b=>b.addEventListener('click',()=>{ SND.init(); SND.setMuted(!SND.muted); if(!SND.muted){ SND.sync(); SND.toggle(); if(S.state==='menu') SND.startTrack('menu'); } }));
}
