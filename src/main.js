/* Monster Kart entry point: boot, main loop, service worker, and an opt-in debug hook for the test suite. */
import * as cfg from './config.js';
import { SND } from './audio.js';
import { sweptHit } from './game/collision.js';
import { update } from './game/loop.js';
import { spawnObj } from './game/objects.js';
import { explode, heal } from './game/player.js';
import { startMonster } from './game/powerups.js';
import { spawnWave } from './game/spawner.js';
import { drawHero } from './render/hero.js';
import { render } from './render/scene.js';
import { makeTiles } from './render/textures.js';
import { drag, input, K, S, view } from './state.js';
import { updateHud } from './ui/hud.js';
import { initInput } from './ui/input.js';
import { initOrientation } from './ui/orientation.js';
import { goMenu, pauseGame, resumeGame, setMode, startRace, toGameOver } from './ui/screens.js';

let last = 0;
let manual = false;     // test hook: stop the real-time simulation so a test can step it by hand

function frame(ts){
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (ts - last) / 1000 || 0); last = ts;
  if(!view.blocked && !S.paused && !manual){
    let rem = dt;
    while(rem > 0){ const h = Math.min(rem, 1 / 120); update(h); rem -= h; }   // fixed sub-steps; swept collision does the rest
  }
  render();
  if(S.state === 'menu') drawHero();
  updateHud();
}

function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  if(window.Capacitor || location.protocol === 'capacitor:' || location.protocol === 'file:') return;   // native shells ship the files themselves
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(!secure) return;
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/* ---------- boot ---------- */
makeTiles();
document.body.classList.toggle('muted', SND.muted);
setMode(S.mode === 'arrows' ? 'arrows' : 'touch');
initInput();
initOrientation();          // runs the first layout, so it must come before goMenu()
goMenu();
requestAnimationFrame(frame);
registerServiceWorker();

/* The debug hook only exists when a page opts in (?debug in the URL, or window.__MK_DEBUG set before load). */
if(window.__MK_DEBUG || /[?&]debug\b/.test(location.search)){
  window.__mono = {
    S, K, view, input, drag, cfg, SND,
    update, render, spawnObj, spawnWave, sweptHit, startRace, goMenu, pauseGame, resumeGame, toGameOver,
    explode, heal, startMonster, updateHud, speedAt: cfg.speedAt,
    setManual(v){ manual = !!v; },
  };
}
