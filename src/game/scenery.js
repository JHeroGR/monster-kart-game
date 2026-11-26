/* Roadside props and speed streaks that scroll past. */
import { ROAD_L, ROAD_R } from '../config.js';
import { S, view } from '../state.js';
import { pick, rnd } from '../util.js';

export function seedDecor(){
  S.deco=[]; for(let i=0;i<16;i++) S.deco.push({side:i%2?1:-1,y:-300+i*((view.H+540)/16)+rnd(0,30),kind:pick(['tire','tire','cone','bush'])});
  S.streaks=[]; for(let i=0;i<18;i++) S.streaks.push({x:rnd(ROAD_L+8,ROAD_R-8),y:rnd(-300,view.H+200),len:rnd(30,90),a:rnd(.4,1)});
}

export /* ambient motion that runs outside of play */
function moveDecor(dt,v){
  for(const d of S.deco){ d.y+=v*dt; if(d.y>view.H+240){ d.y=-300-rnd(0,60); d.side=Math.random()<.5?-1:1; d.kind=pick(['tire','tire','cone','bush']); } }
  for(const s of S.streaks){ s.y+=v*1.3*dt; if(s.y>view.H+220){ s.y=-rnd(60,320); s.x=rnd(ROAD_L+8,ROAD_R-8); s.len=rnd(30,90); } }
}
