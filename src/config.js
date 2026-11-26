/* Tuning constants: road geometry, speeds, power-up timings. Change numbers here to rebalance the game. */

export const W=360, ROAD_L=44, ROAD_R=316, ROAD_W=272, LANES=4, LANE_W=68;
export const laneX = i => ROAD_L+LANE_W*(i+.5);
export const MAXVX=520;                // keyboard / button steering speed
export const HEAL_TIME=12;             // seconds of clean driving that clear the smoke
export const SPAWN_Y=-290;             // far enough above the screen that nothing pops in, even zoomed out
export const COIN_PTS=10, HEART_PTS=100;
export const speedAt = t => 250+630*(1-Math.exp(-t/140));  // px/s, slow ramp, caps at 880
export const BOOST_T=6, BOOST_MUL=1.5, BOOST_ANIM=.9;            // speed up power-up
export const MAGNET_T=8, MAGNET_R=110;            // coin magnet power-up
export const MONSTER_T=10, MONSTER_MUL=2, MONSTER_ZOOM=.74;   // monster kart (all 3 parts)
