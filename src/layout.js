/* Fits the fixed 360-wide stage to any portrait screen, and reports whether the device is in landscape. */
import { W } from './config.js';
import { cv, hero, stage, vp } from './dom.js';
import { buildVignette } from './render/textures.js';
import { K, view } from './state.js';
import { clamp } from './util.js';

export const coarse = () => matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches;
export function layout(){
  const r=vp.getBoundingClientRect(), vw=Math.max(1,r.width), vh=Math.max(1,r.height);
  view.H=Math.round(clamp(vh/vw*W,620,800));
  view.scale=Math.min(vw/W,vh/view.H);
  stage.style.height=view.H+'px';
  stage.style.transform='translate(-50%,-50%) scale('+view.scale+')';
  const dpr=Math.min(window.devicePixelRatio||1,3);
  view.pxr=Math.max(1,view.scale*dpr);
  cv.width=Math.round(W*view.pxr); cv.height=Math.round(view.H*view.pxr); cv.style.width=W+'px'; cv.style.height=view.H+'px';
  view.heroPx=Math.max(1,Math.min(dpr,2)*view.scale);
  hero.width=Math.round(328*view.heroPx); hero.height=Math.round(150*view.heroPx);
  K.y=view.H-150;
  buildVignette();
}
