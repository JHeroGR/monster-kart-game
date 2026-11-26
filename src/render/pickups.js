/* Coins, hearts, power-up tokens and the magnet field. */
import { MAGNET_R } from '../config.js';
import { S } from '../state.js';
import { clamp } from '../util.js';

export function drawCoin(g,o){
  const sx=Math.max(.2,Math.abs(Math.cos(S.clk*5+o.ph)));
  g.save(); g.translate(o.x,o.y);
  g.fillStyle='rgba(255,255,255,.16)'; g.beginPath(); g.arc(0,0,16,0,6.283); g.fill();
  g.scale(sx,1);
  g.fillStyle='#fff'; g.strokeStyle='#000'; g.lineWidth=2.2; g.beginPath(); g.arc(0,0,11,0,6.283); g.fill(); g.stroke();
  g.lineWidth=1.8; g.beginPath(); g.arc(0,0,7,0,6.283); g.stroke();
  g.fillStyle='#000'; g.font='700 10px "Arial Black",Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('$',0,.6);
  g.restore();
}
export function drawHeart(g,o){
  const k=1+.12*Math.sin(S.clk*7);
  g.save(); g.translate(o.x,o.y);
  g.strokeStyle='rgba(255,255,255,'+(.25+.2*Math.sin(S.clk*7))+')'; g.lineWidth=2; g.beginPath(); g.arc(0,0,17+2*Math.sin(S.clk*7),0,6.283); g.stroke();
  g.scale(k,k);
  g.beginPath(); g.moveTo(0,8); g.bezierCurveTo(-15,-2,-9,-13,0,-6); g.bezierCurveTo(9,-13,15,-2,0,8); g.closePath();
  g.fillStyle='#fff'; g.fill(); g.strokeStyle='#000'; g.lineWidth=2.2; g.lineJoin='round'; g.stroke();
  g.fillStyle='#000'; g.fillRect(-4,-2.6,8,3.2); g.fillRect(-1.6,-5,3.2,8);
  g.restore();
}

export function drawPickup(g,o){
  const ph=S.clk*6+o.ph, part=o.type==='part';
  g.save(); g.translate(o.x,o.y);
  g.strokeStyle='rgba(255,255,255,'+(.3+.2*Math.sin(ph))+')'; g.lineWidth=2; g.beginPath(); g.arc(0,0,22+2*Math.sin(ph),0,6.283); g.stroke();
  const k=1+.08*Math.sin(ph); g.scale(k,k);
  g.fillStyle='#fff'; g.strokeStyle='#000'; g.lineWidth=2.4; g.lineJoin='round'; g.beginPath();
  if(part){ for(let i=0;i<6;i++){ const a=i/6*6.283+.5236, px=Math.cos(a)*18, py=Math.sin(a)*18; i?g.lineTo(px,py):g.moveTo(px,py); } g.closePath(); }
  else g.arc(0,0,16,0,6.283);
  g.fill(); g.stroke();
  g.fillStyle='#000'; g.strokeStyle='#000';
  if(o.type==='boost'){
    g.beginPath(); g.moveTo(3,-11); g.lineTo(-7,2); g.lineTo(-1,2); g.lineTo(-3,11); g.lineTo(7,-3); g.lineTo(1,-3); g.closePath(); g.fill();
  }else if(o.type==='magnet'){
    g.lineWidth=5; g.lineCap='butt'; g.beginPath(); g.arc(0,-1,6,Math.PI,0); g.moveTo(-6,-1); g.lineTo(-6,7); g.moveTo(6,-1); g.lineTo(6,7); g.stroke();
    g.fillStyle='#fff'; g.fillRect(-8.5,3.6,5,1.8); g.fillRect(3.5,3.6,5,1.8);
  }else if(o.idx===0){          // engine: gear
    g.beginPath(); g.arc(0,0,6,0,6.283); g.fill();
    for(let i=0;i<8;i++){ g.save(); g.rotate(i/8*6.283+S.clk); g.fillRect(-1.8,-9.4,3.6,4.2); g.restore(); }
    g.fillStyle='#fff'; g.beginPath(); g.arc(0,0,2.3,0,6.283); g.fill();
  }else if(o.idx===1){          // tire
    g.beginPath(); g.arc(0,0,9.5,0,6.283); g.fill();
    g.fillStyle='#fff'; g.beginPath(); g.arc(0,0,5,0,6.283); g.fill(); g.fillStyle='#000'; g.beginPath(); g.arc(0,0,2,0,6.283); g.fill();
    g.strokeStyle='#fff'; g.lineWidth=1.4; g.beginPath(); for(let i=0;i<8;i++){ const a=i/8*6.283; g.moveTo(Math.cos(a)*7.4,Math.sin(a)*7.4); g.lineTo(Math.cos(a)*9.3,Math.sin(a)*9.3); } g.stroke();
  }else{                        // armor: shield
    g.beginPath(); g.moveTo(-8,-9); g.lineTo(8,-9); g.lineTo(8,1); g.quadraticCurveTo(8,8,0,11); g.quadraticCurveTo(-8,8,-8,1); g.closePath(); g.fill();
    g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.moveTo(-4,-1); g.lineTo(0,3); g.lineTo(4,-1); g.stroke();
  }
  g.restore();
}
const sr=n=>{ const x=Math.sin(n*127.1+Math.floor(S.clk*20)*311.7)*43758.5453; return x-Math.floor(x); };
export function drawField(g,x,y){
  const R=MAGNET_R*.9, fade=clamp(S.magnet/1.2,0,1), a=S.magnet<2.5?(Math.floor(S.clk*10)%2?.45:1)*fade:1;
  g.save(); g.translate(x,y); g.globalAlpha=a; g.lineJoin='round'; g.lineCap='round';
  const gr=g.createRadialGradient(0,0,R*.3,0,0,R); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(255,255,255,.2)');
  g.fillStyle=gr; g.beginPath(); g.arc(0,0,R,0,6.283); g.fill();
  g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=2; g.setLineDash([9,7]); g.lineDashOffset=-S.clk*50; g.beginPath(); g.arc(0,0,R,0,6.283); g.stroke(); g.setLineDash([]);
  for(let i=0;i<5;i++){
    const a0=i/5*6.283+S.clk*1.4; g.beginPath();
    for(let j=0;j<=7;j++){ const aa=a0+.7*j/7, r=R+(j&&j<7?(sr(i*9+j)-.5)*16:0), px=Math.cos(aa)*r, py=Math.sin(aa)*r; j?g.lineTo(px,py):g.moveTo(px,py); }
    g.strokeStyle='#000'; g.lineWidth=4.5; g.stroke(); g.strokeStyle='#fff'; g.lineWidth=1.8; g.stroke();
  }
  for(let i=0;i<4;i++){
    const aa=sr(i+50)*6.283; g.beginPath(); g.moveTo(Math.cos(aa)*R*.95,Math.sin(aa)*R*.95);
    for(let j=1;j<=3;j++){ const r=R*(.95-j*.17), da=(sr(i*5+j+80)-.5)*.35; g.lineTo(Math.cos(aa+da)*r,Math.sin(aa+da)*r); }
    g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=1.4; g.stroke();
  }
  g.restore();
}
