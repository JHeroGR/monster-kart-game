/* Builds the road, roadside and vignette canvases once, so each frame only has to draw them. */
import { ROAD_W, W } from '../config.js';
import { tex, view } from '../state.js';
import { rnd } from '../util.js';

export function buildVignette(){
  tex.vignette=document.createElement('canvas'); tex.vignette.width=W; tex.vignette.height=view.H;
  const g=tex.vignette.getContext('2d'), gr=g.createRadialGradient(W/2,view.H*0.55,view.H*0.25,W/2,view.H*0.55,view.H*0.85);
  gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,.5)');
  g.fillStyle=gr; g.fillRect(0,0,W,view.H);
}
export function makeTiles(){
  tex.road=document.createElement('canvas'); tex.road.width=ROAD_W; tex.road.height=256;
  let g=tex.road.getContext('2d'); g.fillStyle='#161616'; g.fillRect(0,0,ROAD_W,256);
  for(let i=0;i<1100;i++){
    g.fillStyle=Math.random()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.4)';
    g.fillRect(Math.random()*ROAD_W,Math.random()*256,rnd(1,2.6),rnd(1,2.6));
  }
  g.strokeStyle='rgba(255,255,255,.05)'; g.lineWidth=1;
  for(let i=0;i<6;i++){ g.beginPath(); let x=rnd(0,ROAD_W),y=rnd(0,256); g.moveTo(x,y); for(let j=0;j<4;j++){ x+=rnd(-14,14); y+=rnd(6,22); g.lineTo(x,y);} g.stroke(); }
  tex.field=document.createElement('canvas'); tex.field.width=34; tex.field.height=256;
  g=tex.field.getContext('2d'); g.fillStyle='#ececec'; g.fillRect(0,0,34,256);
  g.strokeStyle='#222'; g.lineWidth=1.6; g.lineCap='round';
  for(let i=0;i<26;i++){ const x=rnd(3,31),y=rnd(0,256); g.beginPath(); g.moveTo(x,y); g.lineTo(x-2,y-5); g.moveTo(x,y); g.lineTo(x+2,y-5); g.stroke(); }
  g.fillStyle='#bdbdbd'; for(let i=0;i<30;i++) g.fillRect(rnd(0,34),rnd(0,256),2,2);
}
