# AGENTS.md — 03-asteroids

## Stack
- Vanilla HTML5 Canvas + single-file ES6+ JavaScript. No frameworks, bundler, dependencies, `package.json`, or build step.
- `index.html:1` loads `game.js:1` via plain `<script>` tag. Canvas is fixed `800×600` (`index.html:23`, `game.js:5`).

## Run
- No install. Open `index.html` directly in browser, or:
  ```bash
  npx serve .
  # http://localhost:3000
  ```
- No tests, lint, formatter, or typecheck configured. Verification is manual in-browser.

## Architecture — everything in `game.js` (717 lines)
| Section | Location | Notes |
|---------|----------|-------|
| Input | `game.js:8-24` | `keys` + `justPressed` pattern; `pressed()` consumes the event. `Space` uses one-shot, arrows use hold. |
| Utils | `game.js:26-30` | `wrap()` for toroidal space, `dist()`, `rand()`, `randInt()`. |
| `Bullet` | `game.js:32-58` | TTL `1.1s`, speed `520`, wraps on edges. |
| `Asteroid` | `game.js:60-120` | Sizes `3→1` (radii `50/30/16`, speeds `32/55/85`, points `20/50/100`). Irregular polygon, `split()` yields 2× `size-1`. |
| `ShootingStar` | `game.js:122-185` | Extends `Asteroid`. Speed ~3×, TTL `8s`, points doubled. Orange (`#f90`) with comet trail. Fades out in last 2s; `split()` returns `[]`. 20% chance per spawn slot, max 2 on screen. |
| Skins | `game.js:187-232` | `SKINS` array (5 skins: `clasica`, `aguijon`, `delta`, `fenix`, `vibora`). `skinIndex` persisted via `localStorage`. `cycleSkin()` on `S` key. |
| `Ship` | `game.js:234-350` | Thrust `260`, rotation `3.5 rad/s`, drag `0.987`. 3s invincibility on respawn (blink via `game.js:251`). Cooldown `0.2s`. Draws shield ring when `shieldTimer > 0` (`game.js:265`). Silhouette from active `SKINS[skinIndex]`. |
| `Particle` | `game.js:352-382` | Explosion debris, fades by `ttl/life`. |
| `PowerUp` | `game.js:384-454` | Three types: `velocidad` (cyan chevron), `escudo` (blue shield), `triple` (magenta bars). Colors via `PU_COLORS:384`. Drifts `30 px/s`, TTL `12s`. Pickup sets matching `ship.*Timer = 5s`. |
| Game state | `game.js:456-517` | Globals `ship/bullets/asteroids/particles/powerups/score/lives/level`; states `playing|dead|gameover`; `spawnAsteroids()` enforces `SAFE_DIST 130` from center. |
| Loop | `game.js:519-717` | `update(dt)` + `draw()` driven by `requestAnimationFrame`; `dt` capped at `0.05`. |

- `state` machine: `playing` → `dead` (2s timer, `game.js:514`) → `playing` respawn, or `gameover` (Space to `initGame()`).
- Speed power-up (`velocidad`): independent 8% spawn per destroyed asteroid (max 3 on screen per type, `game.js:502`); excluded from `ShootingStar` drops; doubles thrust while active (cyan ship / `VELOCIDAD X2` HUD).
- Shield power-up (`escudo`): independent 8% spawn per type (max 3 on screen, `game.js:506`); while `ship.shieldTimer > 0` a blue ring (`#39f`) around the ship absorbs asteroid impacts — the asteroid is destroyed with score + split instead of `killShip()` (`game.js:556`). Blinks in last 1s; HUD `ESCUDO`.
- Triple-shot power-up (`triple`): independent 8% spawn per type (max 3 on screen, `game.js:510`); while `ship.tripleTimer > 0` fires 3 bullets (center + 2 perpendicular) (`game.js:296`). Magenta ship / `TRIPLE SHOT` HUD.
- Skins: 5 ship silhouettes selectable with `S` key during gameplay. Persisted via `localStorage`. Cycles skin name flash on HUD (`game.js:698`).
- No modules/exports — all globals in window scope, `'use strict'`.

## Conventions
- Code, comments, and HUD strings are Spanish. Keep new code/messages consistent.
- Canvas coords wrap toroidally (`game.js:27`), not clamped.
- Collision: `dist < radius` for bullets, `dist < ship.radius + asteroid.radius*0.82` for ship (`game.js:555`); `dist < ship.radius + powerup.radius` for power-up pickup (`game.js:491`).

## CI — triaje automático de issues
- `.github/workflows/issue-triage.yml` se dispara en cada issue abierto (`on: issues [opened]`).
- Detecta la categoría del issue por keywords en título+cuerpo (`bug` / `feature` / `mejora` / `pregunta`, fallback `otros`), crea las labels faltantes vía API y aplica la detectada.
- Concatena al final del cuerpo (sin alterar el texto del autor) una sección `⚙️ Información de revisión`: tipo detectado, archivos relevantes (`game.js`, `index.html`), rama, commit y checklist para el revisor. Guarda contra duplicados re-checkando si la sección ya existe.
- Implementado con `actions/github-script@v7`; requiere permiso `issues: write`. No depende del workflow `opencode.yml`.

## Gotchas
- Single file — edits to game logic all target `game.js`. Don't add bundler/imports without reason.
- `justPressed` is consumed on read (`game.js:20-24`) — calling `pressed()` twice in one frame loses the second check.
- Three power-ups each roll independently 8% per asteroid → up to 24% chance of *any* drop per destroyed asteroid.
- Ship skin line color is overridden by active power-up colors: speed → `#0ff`, triple → `#f0f`. Flame follows same priority.
- `opencode.json` / `opencode.jsonc` do not exist; no repo-local OpenCode instructions to inherit.
