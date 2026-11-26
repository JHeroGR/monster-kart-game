/* The single source of truth for the game: S (world), K (player kart), input and drag. */
import { store } from './util.js';

/* Layout values that change on resize or rotation. Everything else reads them from here. */
export const view = { H:640, scale:1, pxr:1, heroPx:1, blocked:false };

/* Pre-rendered canvases (road, roadside, vignette), built by render/textures.js. */
export const tex = { road:null, field:null, vignette:null };

export const S = {
  state:'menu', paused:false, prev:null, clk:0,
  t:0, v:170, d:0, dist:0, coins:0, bonus:0, score:0, topV:0, scroll:0,
  objs:[], parts:[], smoke:[], pops:[], streaks:[], deco:[],
  spawnDist:0, nextOpen:1, heartTimer:0, smokeAcc:0,
  base:250, mul:1, zoom:1, boost:0, magnet:0, monster:0, pieces:[false,false,false], puT:{boost:18,magnet:25,part:11}, zapAcc:0, clear:0,
  shake:0, flash:0, cdT:0, cdShown:-1, cdMode:'start', cdFrozen:false, goShow:0, overT:0, newBest:false,
  mode:store.get('mk-mode','touch'), best:store.get('mk-best',{score:0,dist:0})
};
export const K = { x:180, y:490, vx:0, tilt:0, damaged:false, heal:0, inv:0, alive:true, kick:0, hw:14, hh:22, morph:1 };
export const input = { left:false, right:false };
export const drag = { active:false, id:-1, sx:0, px:0, kx:0 };
