/* Sound: everything is synthesized with the Web Audio API, so there are no audio files to load or license. */
import { S, view } from './state.js';
import { rnd, store } from './util.js';

export const mf = m => 440*Math.pow(2,(m-69)/12);
export const SND = {
  ctx:null, master:null, music:null, sfx:null, noise:null, muted:!!store.get('mk-muted',false),
  track:null, timer:null, nextT:0, step:0, eng:null,
  init(){
    if(this.ctx) return;
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    try{ this.ctx=new AC(); }catch(e){ this.ctx=null; return; }
    const c=this.ctx;
    this.master=c.createGain(); this.master.gain.value=this.muted?0:0.9;
    /* safety soft-clipper: transparent for normal levels, but stacked effects (explosion + music + engine) can never clip the speakers */
    const lim=c.createWaveShaper(), curve=new Float32Array(2049);
    for(let i=0;i<curve.length;i++){ const x=(i/1024-1); curve[i]=Math.tanh(x); }
    lim.curve=curve; this.master.connect(lim); lim.connect(c.destination); this.limiter=lim;
    this.music=c.createGain(); this.music.gain.value=0.55; this.music.connect(this.master);
    this.sfx=c.createGain(); this.sfx.gain.value=0.9; this.sfx.connect(this.master);
    const len=Math.floor(c.sampleRate*1.6), b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    this.noise=b;
  },
  ok(){ return this.ctx && this.ctx.state!=='closed'; },
  setMuted(m){
    this.muted=m; store.set('mk-muted',m);
    if(this.master) this.master.gain.setTargetAtTime(m?0:0.9,this.ctx.currentTime,0.03);
    document.body.classList.toggle('muted',m);
  },
  sync(){
    if(!this.ok()) return;
    const want=!(view.blocked||S.paused||document.hidden);
    try{ want ? this.ctx.resume() : this.ctx.suspend(); }catch(e){}
  },
  tone(f,t,dur,type='sine',g=0.2,dest=null,slideTo=null){
    const c=this.ctx; if(!c) return;
    const o=c.createOscillator(), a=c.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
    a.gain.setValueAtTime(0.0001,t); a.gain.exponentialRampToValueAtTime(g,t+0.012); a.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(a); a.connect(dest||this.sfx); o.start(t); o.stop(t+dur+0.05);
  },
  noiseBurst(t,dur,g,type,f0,f1,dest){
    const c=this.ctx; if(!c||!this.noise) return;
    const s=c.createBufferSource(); s.buffer=this.noise;
    const f=c.createBiquadFilter(); f.type=type; f.frequency.setValueAtTime(f0,t);
    if(f1) f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const a=c.createGain(); a.gain.setValueAtTime(g,t); a.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f); f.connect(a); a.connect(dest||this.sfx); s.start(t,Math.random()*0.15); s.stop(t+dur+0.05);
  },
  now(){ return this.ctx?this.ctx.currentTime:0; },

  /* background music: a scheduler that plays one step at a time */
  bpm(){ return this.track==='menu'?78:this.track==='over'?58:112+S.d*34+(S.mul-1)*18; },
  startTrack(name){
    this.init(); if(!this.ctx) return;
    if(this.track===name) return;
    this.stopTrack(); this.track=name; this.step=0; this.nextT=this.ctx.currentTime+0.08;
    this.timer=setInterval(()=>this.sched(),40);
  },
  stopTrack(){ if(this.timer){ clearInterval(this.timer); this.timer=null; } this.track=null; },
  sched(){
    const c=this.ctx; if(!c||!this.track) return;
    let guard=0;
    while(this.nextT<c.currentTime+0.2 && guard++<8){
      const sd=60/this.bpm()/2;
      this.trackStep(this.track,this.step,this.nextT,sd);
      this.step++; this.nextT+=sd;
    }
    if(this.nextT<c.currentTime) this.nextT=c.currentTime+0.05;
  },
  trackStep(name,step,t,sd){
    const roots=[57,53,48,55], minor=[true,false,false,false];
    const bar=Math.floor(step/8)%4, s=step%8, r=roots[bar], mn=minor[bar], M=this.music;
    if(name==='menu'){
      const arp=mn?[0,7,12,15,12,7,10,7]:[0,7,12,16,12,7,4,7];
      this.tone(mf(r+12+arp[s]),t,sd*1.7,'triangle',0.05,M);
      if(s===0) this.tone(mf(r-12),t,sd*7,'sine',0.1,M);
      if(s===4) this.tone(mf(r),t,sd*3,'sine',0.045,M);
    }else if(name==='game'){
      const arp=mn?[0,12,7,12,15,12,7,12]:[0,12,7,12,16,12,7,12];
      this.tone(mf(r+12+arp[s]),t,sd*0.95,'triangle',0.045,M);
      if(s%2===0) this.tone(mf(r-12),t,sd*0.85,'sine',0.1,M);
      if(s%2===1) this.noiseBurst(t,0.035,0.014,'highpass',6000,null,M);
      if(s===6) this.tone(mf(r+24+(mn?3:4)),t,sd*1.2,'sine',0.03,M);
    }else if(name==='over'){
      if(s===0) this.tone(mf(r-5),t,sd*7,'sine',0.08,M);
      if(s===4) this.tone(mf(r+7+(mn?3:4)),t,sd*4,'triangle',0.035,M);
    }
  },

  /* engine hum, pitch follows speed */
  startEngine(){
    this.init(); const c=this.ctx; if(!c||this.eng) return;
    const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=60;
    const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=340;
    const g=c.createGain(); g.gain.value=0.0001;
    o.connect(f); f.connect(g); g.connect(this.sfx); o.start();
    this.eng={o,f,g};
  },
  setEngine(v,on){
    if(!this.eng) return; const t=this.ctx.currentTime;
    this.eng.o.frequency.setTargetAtTime(52+v*0.085,t,0.1);
    this.eng.f.frequency.setTargetAtTime(260+v*0.35,t,0.1);
    this.eng.g.gain.setTargetAtTime(on?(S.monster>0?0.055:0.032):0.0001,t,0.12);
  },
  stopEngine(){ if(this.eng) this.eng.g.gain.setTargetAtTime(0.0001,this.ctx.currentTime,0.08); },

  /* effects */
  click(){ if(!this.ok()) return; const t=this.now(); this.tone(680,t,0.08,'square',0.05,null,340); },
  toggle(){ if(!this.ok()) return; const t=this.now(); this.tone(520,t,0.06,'triangle',0.1); this.tone(780,t+0.06,0.09,'triangle',0.1); },
  whoosh(){ if(!this.ok()) return; const t=this.now(); this.noiseBurst(t,0.45,0.25,'bandpass',300,3200); },
  beep(go){ if(!this.ok()) return; const t=this.now();
    if(go){ this.tone(1047,t,0.55,'square',0.07); this.tone(1568,t,0.55,'triangle',0.08); }
    else this.tone(440,t,0.2,'square',0.07); },
  coin(){ if(!this.ok()) return; const t=this.now(); this.tone(988,t,0.08,'square',0.05); this.tone(1319,t+0.07,0.2,'square',0.05); },
  heart(){ if(!this.ok()) return; const t=this.now(); [523,659,784,1047].forEach((f,i)=>this.tone(f,t+i*0.07,0.22,'triangle',0.13)); },
  repair(){ if(!this.ok()) return; const t=this.now(); this.tone(784,t,0.15,'sine',0.12); this.tone(1175,t+0.13,0.3,'sine',0.12); },
  hit(){ if(!this.ok()) return; const t=this.now();
    this.noiseBurst(t,0.35,0.55,'lowpass',2000,180); this.tone(130,t,0.28,'sine',0.4,null,45); },
  crumble(){ if(!this.ok()) return; const t=this.now(); this.noiseBurst(t,0.16,0.18,'bandpass',900,300); },
  explode(){ if(!this.ok()) return; const t=this.now();
    this.noiseBurst(t,1.35,0.95,'lowpass',3200,70); this.tone(78,t,1.1,'sine',0.7,null,24);
    this.noiseBurst(t+0.12,0.6,0.35,'bandpass',1800,400); this.noiseBurst(t+0.4,0.5,0.2,'highpass',2500,900); },
  boost(){ if(!this.ok()) return; const t=this.now();
    this.noiseBurst(t,.5,.3,'bandpass',500,4200); this.tone(300,t,.45,'sawtooth',.09,null,1300); this.tone(600,t+.05,.4,'square',.04,null,1900); },
  magnet(){ if(!this.ok()) return; const t=this.now();
    this.tone(110,t,.5,'sawtooth',.08,null,900); this.noiseBurst(t,.4,.22,'highpass',3000,8000);
    [880,1175,1568].forEach((f,i)=>this.tone(f,t+.12+i*.06,.12,'square',.04)); },
  /* monster kart smashing things: deep thud + crunch, with a different top layer per obstacle */
  smash(kind){ if(!this.ok()) return; const t=this.now(), k=rnd(.9,1.12);
    this.tone(105*k,t,.3,'sine',.55,null,36);
    this.noiseBurst(t,.3,.6,'lowpass',2800*k,260);
    if(kind==='car'){
      this.tone(760*k,t,.24,'square',.09,null,170); this.tone(1180*k,t+.03,.16,'triangle',.07,null,400);
      this.noiseBurst(t+.02,.35,.22,'highpass',3200,1200); this.tone(300*k,t+.12,.1,'square',.05,null,120);
    }else{
      this.noiseBurst(t+.02,.22,.32,'bandpass',1500*k,450); this.tone(210*k,t+.01,.12,'sawtooth',.1,null,70);
      this.noiseBurst(t+.14,.12,.14,'highpass',2500,900);
    } },
  stomp(){ if(!this.ok()) return; const t=this.now(), k=rnd(.9,1.1);
    this.tone(75*k,t,.22,'sine',.5,null,34); this.noiseBurst(t,.16,.28,'lowpass',950,180); },
  zap(){ if(!this.ok()) return; const t=this.now(); this.noiseBurst(t,.05,.07,'highpass',4500); if(Math.random()<.5) this.tone(rnd(900,1600),t,.04,'square',.018); },
  part(n){ if(!this.ok()) return; const t=this.now(), f=[523,659,784][n-1]||523;
    this.noiseBurst(t,.05,.12,'highpass',5000); this.tone(f,t,.14,'triangle',.14); this.tone(f*1.5,t+.08,.22,'triangle',.12); },
  transform(){ if(!this.ok()) return; const t=this.now();
    this.noiseBurst(t,1.1,.6,'lowpass',400,3800); this.tone(70,t,1.1,'sawtooth',.25,null,320); this.tone(60,t,1.3,'sine',.5,null,30);
    [262,330,392,523,659].forEach((f,i)=>this.tone(f,t+.5+i*.09,.32,'square',.07)); this.tone(131,t+.5,.9,'sawtooth',.12); },
  powerDown(){ if(!this.ok()) return; const t=this.now(); this.tone(700,t,.4,'triangle',.1,null,110); },
  gameOver(){ if(!this.ok()) return; const t=this.now();
    [440,392,349,294].forEach((f,i)=>this.tone(f,t+i*0.24,0.34,'triangle',0.13));
    this.tone(147,t+0.98,1.4,'sine',0.16); }
};
