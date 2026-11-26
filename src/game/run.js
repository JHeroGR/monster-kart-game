/* Resets the world and the kart at the start of every race. */
import { drag, input, K, S, view } from '../state.js';
import { rnd } from '../util.js';

export function resetRun(){
  Object.assign(S,{t:0,v:150,d:0,dist:0,coins:0,bonus:0,score:0,topV:0,objs:[],parts:[],smoke:[],pops:[],spawnDist:260,nextOpen:1,heartTimer:0,smokeAcc:0,shake:0,flash:0,overT:0,newBest:false,goShow:0,
    base:250,mul:1,zoom:1,boost:0,magnet:0,monster:0,pieces:[false,false,false],puT:{boost:rnd(14,22),magnet:rnd(20,30),part:rnd(9,14)},zapAcc:0,clear:0});
  Object.assign(K,{x:180,y:view.H-150,vx:0,tilt:0,damaged:false,heal:0,inv:0,alive:true,kick:0,hw:14,hh:22,morph:1});
  drag.active=false; input.left=input.right=false;
}
