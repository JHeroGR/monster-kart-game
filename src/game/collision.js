/* Swept collision: tests the whole distance an object travelled this step, so nothing can tunnel through the kart at high speed. */
import { K } from '../state.js';

export function sweptHit(o,prevY){
  if(K.x+K.hw<o.x-o.hw || K.x-K.hw>o.x+o.hw) return false;
  const a=Math.min(prevY,o.y)-o.hh, b=Math.max(prevY,o.y)+o.hh;   // whole path travelled this step
  return !(b<K.y-K.hh || a>K.y+K.hh);
}
