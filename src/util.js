/* Small helpers shared by every module. */

export const $ = id => document.getElementById(id);
export const clamp = (v,a,b) => v<a?a:v>b?b:v;
export const rnd = (a,b) => a+Math.random()*(b-a);
export const lerp = (a,b,t) => a+(b-a)*t;
export const pick = a => a[(Math.random()*a.length)|0];
export const store = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
};
export function rr(g,x,y,w,h,r){
  g.beginPath(); g.moveTo(x+r,y); g.lineTo(x+w-r,y); g.quadraticCurveTo(x+w,y,x+w,y+r);
  g.lineTo(x+w,y+h-r); g.quadraticCurveTo(x+w,y+h,x+w-r,y+h); g.lineTo(x+r,y+h);
  g.quadraticCurveTo(x,y+h,x,y+h-r); g.lineTo(x,y+r); g.quadraticCurveTo(x,y,x+r,y); g.closePath();
}
