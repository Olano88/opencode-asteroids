'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead   = false;
    this.points = POINTS[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella Fugaz (asteroide especial) ────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y, size = 3) {
    super(x, y, size);
    this.shootingStar = true;
    this.ttl     = 8;
    this.points  = POINTS[size] * 2;

    // Velocidad ~3×
    const speed = SPEEDS[size] * 3 + rand(15, 35);
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 6);
      return;
    }
    super.update(dt);
  }

  split() { return []; }

  draw() {
    const fadeAlpha = this.ttl < 2 ? Math.max(this.ttl / 2, 0) : 1;

    // Estela de cometa: 4 segmentos hacia atrás
    ctx.save();
    for (let i = 1; i <= 4; i++) {
      const t  = i * 0.028;
      const tx = wrap(this.x - this.vx * t, W);
      const ty = wrap(this.y - this.vy * t, H);
      const a  = fadeAlpha * (1 - i / 5) * 0.5;
      ctx.strokeStyle = `rgba(255,170,0,${a.toFixed(2)})`;
      ctx.lineWidth   = 3.5 - i * 0.6;
      ctx.beginPath();
      ctx.arc(tx, ty, this.radius * (1 - i * 0.12), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Núcleo
    ctx.globalAlpha = fadeAlpha;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#f90';
    ctx.lineWidth   = 1.8;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── Skins de nave ─────────────────────────────────────────────────────────────
const SKINS = [
  {
    id: 'clasica', name: 'Clásica', line: '#fff',
    flame: 'rgba(255,130,0,0.85)',
    points: [[20,0],[-12,-9],[-7,0],[-12,9]],
    exhaust: -8, exhaustHalf: 4,
  },
  {
    id: 'aguijon', name: 'Aguijón', line: '#0ff',
    flame: 'rgba(0,255,255,0.85)',
    points: [[26,0],[-4,-6],[-14,0],[-4,6]],
    exhaust: -8, exhaustHalf: 3,
  },
  {
    id: 'delta', name: 'Ala Delta', line: '#fc0',
    flame: 'rgba(255,200,0,0.85)',
    points: [[22,0],[2,-16],[-10,0],[2,16]],
    exhaust: -6, exhaustHalf: 5,
  },
  {
    id: 'fenix', name: 'Fénix', line: '#f55',
    flame: 'rgba(255,80,80,0.85)',
    points: [[24,0],[4,-10],[-14,-6],[-6,0],[-14,6],[4,10]],
    exhaust: -8, exhaustHalf: 4,
  },
  {
    id: 'vibora', name: 'Víbora', line: '#4f4',
    flame: 'rgba(120,255,120,0.85)',
    points: [[22,0],[6,-8],[-8,-4],[-12,0],[-8,4],[6,8]],
    exhaust: -6, exhaustHalf: 3,
  },
];

let skinIndex = (() => {
  const saved = localStorage.getItem('asteroids-skin');
  const i = SKINS.findIndex(s => s.id === saved);
  return i >= 0 ? i : 0;
})();
let skinFlashTimer = 0;

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  localStorage.setItem('asteroids-skin', SKINS[skinIndex].id);
  skinFlashTimer = 2;
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.shieldTimer   = 0;
    this.tripleTimer   = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;
    const THRUST = 260;
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const boost = this.speedTimer > 0 ? 2 : 1;
      this.vx += Math.cos(this.angle) * THRUST * boost * dt;
      this.vy += Math.sin(this.angle) * THRUST * boost * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      const OFFSET = 8;
      const perpX = -Math.sin(this.angle) * OFFSET;
      const perpY =  Math.cos(this.angle) * OFFSET;
      return [
        new Bullet(ox + perpX, oy + perpY, this.angle),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox - perpX, oy - perpY, this.angle),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    // Escudo protector
    if (this.shieldTimer > 0) {
      const blink = this.shieldTimer < 1 && Math.floor(this.shieldTimer * 10) % 2 === 0;
      if (!blink) {
        const SHIELD_R = 22;
        ctx.save();
        ctx.strokeStyle = 'rgba(80,160,255,0.75)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, SHIELD_R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(50,140,255,0.15)';
        ctx.fill();
        ctx.restore();
      }
    }

    const skin = SKINS[skinIndex];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.speedTimer > 0 ? '#0ff' : this.tripleTimer > 0 ? '#f0f' : skin.line;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    ctx.beginPath();
    ctx.moveTo(skin.points[0][0], skin.points[0][1]);
    for (let i = 1; i < skin.points.length; i++)
      ctx.lineTo(skin.points[i][0], skin.points[i][1]);
    ctx.closePath();
    ctx.stroke();

    if (this.thrusting && Math.random() > 0.35) {
      const ex = skin.exhaust;
      const ey = skin.exhaustHalf;
      ctx.beginPath();
      ctx.moveTo(ex, -ey);
      ctx.lineTo(ex - rand(6, 14), 0);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = this.speedTimer > 0 ? 'rgba(0,255,255,0.85)' : this.tripleTimer > 0 ? 'rgba(255,0,255,0.85)' : skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-Ups ────────────────────────────────────────────────────────────────
const PU_COLORS = {
  velocidad: '#0ff',
  escudo:    '#39f',
  triple:    '#f0f',
};
const PU_FILLS = {
  velocidad: 'rgba(0,255,255,0.15)',
  escudo:    'rgba(50,140,255,0.15)',
  triple:    'rgba(255,0,255,0.15)',
};

class PowerUp {
  constructor(x, y, type = 'velocidad') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    this.ttl = 12;
    this.dead = false;
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * 30;
    this.vy = Math.sin(angle) * 30;
  }

  update(dt) {
    this.x  = wrap(this.x + this.vx * dt, W);
    this.y  = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.006);
    const alpha = this.ttl < 3 ? this.ttl / 3 : 1;
    const col  = PU_COLORS[this.type];
    const fill = PU_FILLS[this.type];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = alpha * pulse;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    if (this.type === 'triple') {
      ctx.beginPath();
      ctx.moveTo(-5, -5); ctx.lineTo(5, -5);
      ctx.moveTo(-5,  0); ctx.lineTo(5,  0);
      ctx.moveTo(-5,  5); ctx.lineTo(5,  5);
      ctx.stroke();
    } else if (this.type === 'escudo') {
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(6, -2); ctx.lineTo(5, 5);
      ctx.lineTo(0, 7); ctx.lineTo(-5, 5); ctx.lineTo(-6, -2); ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-3, -5); ctx.lineTo(5, 0); ctx.lineTo(-3, 5);
      ctx.moveTo(-1, -5); ctx.lineTo(7, 0); ctx.lineTo(-1, 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  const MAX_FUGACES = 2;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    const fugaces = asteroids.filter(a => a.shootingStar).length;
    if (fugaces < MAX_FUGACES && Math.random() < 0.2)
      asteroids.push(new ShootingStar(x, y, 3));
    else
      asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  ship.skin     = skinIndex;
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  ship.skin = skinIndex;
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (skinFlashTimer > 0) skinFlashTimer -= dt;

  if (pressed('KeyS') && state !== 'gameover') cycleSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); ship.skin = skinIndex; }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Nave recoge power-up
  for (const p of powerups) {
    if (dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'velocidad') ship.speedTimer = 5;
      else if (p.type === 'escudo') ship.shieldTimer = 5;
      else if (p.type === 'triple') ship.tripleTimer = 5;
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        if (!a.shootingStar) {
          if (powerups.filter(p => p.type === 'velocidad').length < 3 && Math.random() < 0.08)
            powerups.push(new PowerUp(a.x, a.y, 'velocidad'));
          if (powerups.filter(p => p.type === 'escudo').length < 3 && Math.random() < 0.08)
            powerups.push(new PowerUp(a.x, a.y, 'escudo'));
          if (powerups.filter(p => p.type === 'triple').length < 3 && Math.random() < 0.08)
            powerups.push(new PowerUp(a.x, a.y, 'triple'));
        }
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldTimer > 0) {
          a.dead = true;
          score += a.points;
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
        } else {
          killShip();
          break;
        }
      }
    }
    asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = SKINS[skinIndex].line;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  let hudY = 48;
  if (ship.speedTimer > 0) {
    ctx.fillStyle = '#0ff';
    ctx.font      = 'bold 15px monospace';
    ctx.fillText(`VELOCIDAD X2 — ${ship.speedTimer.toFixed(1)}s`, W / 2, hudY);
    ctx.fillStyle = '#fff';
    hudY += 18;
  }
  if (ship.tripleTimer > 0) {
    ctx.fillStyle = '#f0f';
    ctx.font      = 'bold 15px monospace';
    ctx.fillText(`TRIPLE SHOT — ${ship.tripleTimer.toFixed(1)}s`, W / 2, hudY);
    ctx.fillStyle = '#fff';
    hudY += 18;
  }
  if (ship.shieldTimer > 0) {
    ctx.fillStyle = '#39f';
    ctx.font      = 'bold 15px monospace';
    ctx.fillText(`ESCUDO — ${ship.shieldTimer.toFixed(1)}s`, W / 2, hudY);
    ctx.fillStyle = '#fff';
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (skinFlashTimer > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = SKINS[skinIndex].line;
    ctx.font = 'bold 13px monospace';
    ctx.globalAlpha = Math.min(skinFlashTimer, 1);
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name}`, W / 2, H - 20);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
