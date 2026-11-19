import { MISSIONS, applyHazard, clamp, missionIndex, missionProgress, rankFromScore, scoreSignal, validateHazard } from './src/engine.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');
const keys = new Set();

const ui = Object.fromEntries(['score','integrity','coverage','insight','combo','mission','mission-progress'].map(id => [id, document.querySelector('#'+id)]));
const hazards = ['NULL','DUPLICATE','BUG','API 500'];
const colors = { signal:'#67e8f9', hazard:'#fb7185', pulse:'#a78bfa', rescue:'#2dd4bf' };

let state;
let entities = [];
let particles = [];
let pulses = [];
let running = false;
let paused = false;
let last = 0;
let spawnClock = 0;

function reset() {
  state = { score:0, integrity:100, coverage:0, insight:0, combo:1, elapsed:0, high:Number(localStorage.getItem('msr-high')||0) };
  entities = []; particles = []; pulses = [];
  player.x = 150; player.y = canvas.height/2; player.vx = 0; player.vy = 0;
  updateHud();
}

const player = { x:150, y:270, vx:0, vy:0, r:15, angle:0 };

function spawn() {
  const mission = missionIndex(state.score);
  const isHazard = Math.random() < .28 + mission * .025;
  const isRescue = mission >= 3 && Math.random() < .13;
  entities.push({
    type: isRescue ? 'rescue' : isHazard ? 'hazard' : 'signal',
    label: isHazard ? hazards[Math.floor(Math.random()*hazards.length)] : isRescue ? 'HIGH RISK' : ['SQL','API','CX','VALID'][Math.floor(Math.random()*4)],
    x: canvas.width + 40,
    y: 70 + Math.random()*(canvas.height-140),
    r: isRescue ? 18 : isHazard ? 17 : 11,
    speed: 115 + Math.random()*70 + mission*10,
    phase: Math.random()*Math.PI*2
  });
}

function emitPulse() {
  if (!running || paused || pulses.length) return;
  pulses.push({ x:player.x, y:player.y, r:8, life:1 });
}

function burst(x,y,color,count=12) {
  for(let i=0;i<count;i++) particles.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,life:1,color});
}

function collide(a,b){ return Math.hypot(a.x-b.x,a.y-b.y) < a.r+b.r; }

function update(dt) {
  state.elapsed += dt;
  spawnClock -= dt;
  if (spawnClock <= 0) { spawn(); spawnClock = .48 + Math.random()*.45; }

  const boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const accel = boost ? 720 : 520;
  const dx = (keys.has('ArrowRight')||keys.has('KeyD')?1:0) - (keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
  const dy = (keys.has('ArrowDown')||keys.has('KeyS')?1:0) - (keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  player.vx += dx*accel*dt; player.vy += dy*accel*dt;
  player.vx *= Math.pow(.0009,dt); player.vy *= Math.pow(.0009,dt);
  player.x = clamp(player.x+player.vx*dt,28,canvas.width-28);
  player.y = clamp(player.y+player.vy*dt,40,canvas.height-40);
  player.angle = Math.atan2(player.vy,Math.max(70,player.vx+120));

  entities.forEach(e => { e.x -= e.speed*dt; e.phase += dt*3; e.y += Math.sin(e.phase)*10*dt; });
  pulses.forEach(p => { p.r += 460*dt; p.life -= 1.2*dt; });
  particles.forEach(p => { p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.97; p.vy*=.97; p.life-=1.5*dt; });

  for(const pulse of pulses){
    for(const e of entities){
      if(e.dead || e.type!=='hazard') continue;
      if(Math.hypot(e.x-pulse.x,e.y-pulse.y)<pulse.r+e.r && Math.hypot(e.x-pulse.x,e.y-pulse.y)>pulse.r-34){
        e.dead=true; state=validateHazard(state,1); burst(e.x,e.y,colors.pulse,18);
      }
    }
  }

  for(const e of entities){
    if(e.dead || !collide(player,e)) continue;
    e.dead=true;
    if(e.type==='signal'){ state=scoreSignal(state,1); burst(e.x,e.y,colors.signal); }
    else if(e.type==='rescue'){ state=scoreSignal({...state,insight:state.insight+3},1.7); burst(e.x,e.y,colors.rescue,22); }
    else { state=applyHazard(state,1); burst(e.x,e.y,colors.hazard,18); }
  }

  entities = entities.filter(e=>!e.dead && e.x>-60);
  pulses = pulses.filter(p=>p.life>0);
  particles = particles.filter(p=>p.life>0);
  if(state.integrity<=0) endGame();
  updateHud();
}

function drawGrid(t){
  ctx.fillStyle='#020817'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='rgba(34,211,238,.08)'; ctx.lineWidth=1;
  const offset=(t*.025)%40;
  for(let x=-40+offset;x<canvas.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
  for(let y=20;y<canvas.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
  const gradient=ctx.createRadialGradient(canvas.width*.6,canvas.height*.45,10,canvas.width*.6,canvas.height*.45,440);gradient.addColorStop(0,'rgba(37,99,235,.14)');gradient.addColorStop(1,'transparent');ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,canvas.height);
}

function drawPlayer(){
  ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);ctx.shadowBlur=25;ctx.shadowColor=colors.signal;
  ctx.fillStyle='#dffcff';ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-14,-12);ctx.lineTo(-7,0);ctx.lineTo(-14,12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#22d3ee';ctx.fillRect(-20,-3,15,6);ctx.restore();
}

function drawEntity(e){
  ctx.save();ctx.translate(e.x,e.y);ctx.shadowBlur=18;ctx.shadowColor=colors[e.type];
  if(e.type==='hazard'){ctx.strokeStyle=colors.hazard;ctx.rotate(e.phase*.25);ctx.strokeRect(-e.r,-e.r,e.r*2,e.r*2);ctx.rotate(-e.phase*.25);}
  else {ctx.strokeStyle=colors[e.type];ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,e.r*.55,0,Math.PI*2);ctx.fillStyle=colors[e.type];ctx.globalAlpha=.38;ctx.fill();}
  ctx.globalAlpha=1;ctx.fillStyle=e.type==='hazard'?'#fecdd3':'#ccfbf1';ctx.font='10px ui-monospace,Consolas,monospace';ctx.textAlign='center';ctx.fillText(e.label,0,e.r+17);ctx.restore();
}

function draw(t){
  drawGrid(t); entities.forEach(drawEntity);
  for(const p of pulses){ctx.strokeStyle=`rgba(167,139,250,${p.life})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
  drawPlayer();
  const mission=MISSIONS[missionIndex(state.score)];ctx.fillStyle=mission.color;ctx.font='10px ui-monospace,Consolas,monospace';ctx.fillText('MISSION // '+mission.name.toUpperCase(),24,28);
}

function updateHud(){
  ui.score.textContent=String(state.score).padStart(5,'0');ui.integrity.textContent=Math.round(state.integrity)+'%';ui.coverage.textContent=Math.round(state.coverage)+'%';ui.insight.textContent=state.insight;ui.combo.textContent='×'+state.combo;
  const mission=MISSIONS[missionIndex(state.score)];ui.mission.textContent=mission.name;ui['mission-progress'].style.width=missionProgress(state.score)+'%';ui['mission-progress'].style.background=`linear-gradient(90deg,#22d3ee,${mission.color})`;
}

function endGame(){
  running=false;state.high=Math.max(state.high,state.score);localStorage.setItem('msr-high',state.high);overlay.classList.remove('hidden');document.querySelector('#overlay-title').textContent=rankFromScore(state.score);document.querySelector('#overlay-copy').textContent=`Mission complete. Score ${state.score}. High signal ${state.high}. Re-enter to improve integrity, coverage and insight.`;startButton.textContent='RE-ENTER MULTIVERSE';
}

function loop(t){
  const dt=Math.min((t-last)/1000,.034)||0;last=t;if(running&&!paused)update(dt);draw(t);requestAnimationFrame(loop);
}

startButton.addEventListener('click',()=>{reset();running=true;paused=false;overlay.classList.add('hidden');pauseButton.textContent='PAUSE';});
pauseButton.addEventListener('click',()=>{if(!running)return;paused=!paused;pauseButton.textContent=paused?'RESUME':'PAUSE';});
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space')emitPulse();if(e.code==='KeyP')pauseButton.click();});
window.addEventListener('keyup',e=>keys.delete(e.code));
document.querySelectorAll('[data-key]').forEach(btn=>{const code=btn.dataset.key;const down=e=>{e.preventDefault();keys.add(code);if(code==='Space')emitPulse();};const up=e=>{e.preventDefault();keys.delete(code);};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);});

reset();requestAnimationFrame(loop);
