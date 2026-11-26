/* Asphalt, curbs, lane dashes, roadside props, speed streaks. */
import { LANE_W, LANES, ROAD_L, ROAD_R, W } from '../config.js';
import { S, tex, view } from '../state.js';
import { clamp } from '../util.js';

export function drawRoad(g){
  const top=-420, bot=view.H+260;            // drawn past the screen so the zoom-out has road to show
  g.fillStyle='#ececec'; g.fillRect(-200,top,W+400,bot-top);
  const off256=S.scroll%256;
  for(let y=-512+off256;y<bot;y+=256){
    g.drawImage(tex.field,0,y); g.drawImage(tex.field,W-34,y); g.drawImage(tex.road,ROAD_L,y);
    g.drawImage(tex.field,-34,y); g.drawImage(tex.field,-68,y); g.drawImage(tex.field,W,y); g.drawImage(tex.field,W+34,y);
  }
  for(const d of S.deco){
    const x=d.side<0?17:W-17;
    if(d.kind==='tire'){
      g.fillStyle='#0a0a0a'; g.beginPath(); g.arc(x,d.y,9,0,6.283); g.fill();
      g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.arc(x,d.y,5.2,0,6.283); g.stroke();
      g.fillStyle='#0a0a0a'; g.beginPath(); g.arc(x,d.y,2.6,0,6.283); g.fill();
    }else if(d.kind==='cone'){
      g.fillStyle='#0a0a0a'; g.beginPath(); g.moveTo(x,d.y-10); g.lineTo(x+8,d.y+8); g.lineTo(x-8,d.y+8); g.closePath(); g.fill();
      g.fillStyle='#fff'; g.fillRect(x-4.6,d.y-1,9.2,3.2);
    }else{
      g.fillStyle='#2a2a2a'; g.beginPath(); g.arc(x-3,d.y,7,0,6.283); g.arc(x+4,d.y+3,6,0,6.283); g.fill();
      g.fillStyle='#777'; g.beginPath(); g.arc(x-5,d.y-2,2.6,0,6.283); g.fill();
    }
  }
  const o40=S.scroll%40;
  for(let y=-320+o40;y<bot;y+=40){
    g.fillStyle='#000'; g.fillRect(ROAD_L-10,y,10,20); g.fillRect(ROAD_R,y,10,20);
    g.fillStyle='#fff'; g.fillRect(ROAD_L-10,y+20,10,20); g.fillRect(ROAD_R,y+20,10,20);
  }
  g.fillStyle='#f0f0f0'; g.fillRect(ROAD_L+5,top,3,bot-top); g.fillRect(ROAD_R-8,top,3,bot-top);
  const o80=S.scroll%80;
  g.fillStyle='rgba(255,255,255,.82)';
  for(let i=1;i<LANES;i++){ const x=ROAD_L+LANE_W*i-1.5; for(let y=-320+o80;y<bot;y+=80) g.fillRect(x,y,3,38); }
  const sa=clamp((S.v-350)/450,0,1)*.22;
  if(sa>0){ g.fillStyle='rgba(255,255,255,'+sa+')'; for(const s of S.streaks) g.fillRect(s.x,s.y-s.len*(S.v/600),1.6,s.len*(S.v/600)*s.a); }
}
