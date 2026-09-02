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

## Architecture — everything in `game.js` (566 lines)
| Section | Location | Notes |
|---------|----------|-------|
| Input | `game.js:8-24` | `keys` + `justPressed` pattern; `pressed()` consumes the event. `Space` uses one-shot, arrows use hold. |
| Utils | `game.js:26-30` | `wrap()` for toroidal space, `dist()`, `rand()`, `randInt()`. |
| `Bullet` | `game.js:32-58` | TTL `1.1s`, speed `520`, wraps on edges. |
| `Asteroid` | `game.js:60-120` | Sizes `3→1` (radii `50/30/16`, speeds `32/55/85`, points `20/50/100`). Irregular polygon, `split()` yields 2× `size-1`. |
| `ShootingStar` | `game.js:122-185` | Extends `Asteroid`. Speed ~3×, TTL `8s`, points doubled. Orange (`#f90`) with comet trail. Fades out in last 2s; `split()` returns `[]`. 20% chance per spawn slot, max 2 on screen. |
| `Ship` | `game.js:187-273` | Thrust `260`, rotation `3.5 rad/s`, drag `0.987`. 3s invincibility on respawn (blink via `game.js:243`). Cooldown `0.2s`. |
| `Particle` | `game.js:275-305` | Explosion debris, fades by `ttl/life`. |
| `PowerUp` | `game.js:307-349` | "Velocidad": cyan pulsing chevron. Drifts `30 px/s`, TTL `12s`. On pickup sets `ship.speedTimer = 5s` (resets to 5 if already active). |
| Game state | `game.js:351-410` | Globals `ship/bullets/asteroids/particles/powerups/score/lives/level`; states `playing|dead|gameover`; `spawnAsteroids()` enforces `SAFE_DIST 130` from center. |
| Loop | `game.js:412-566` | `update(dt)` + `draw()` driven by `requestAnimationFrame`; `dt` capped at `0.05`. |

- `state` machine: `playing` → `dead` (2s timer, `game.js:408`) → `playing` respawn, or `gameover` (Space to `initGame()`).
- Speed power-up: spawned with `8%` chance per destroyed asteroid (max 3 on screen, `game.js:465`); excluded from `ShootingStar` drops; collected by ship contact (`game.js:447-454`); doubles thrust while active (cyan ship / `VELOCIDAD X2` HUD).
- No modules/exports — all globals in window scope, `'use strict'`.

## Conventions
- Code, comments, and HUD strings are Spanish. Keep new code/messages consistent.
- Canvas coords wrap toroidally (`game.js:27`), not clamped.
- Collision: `dist < radius` for bullets, `dist < ship.radius + asteroid.radius*0.82` for ship (`game.js:477`); `dist < ship.radius + powerup.radius` for power-up pickup (`game.js:449`).

## Gotchas
- Single file — edits to game logic all target `game.js`. Don't add bundler/imports without reason.
- `justPressed` is consumed on read (`game.js:20-24`) — calling `pressed()` twice in one frame loses the second check.
- `opencode.json` / `opencode.jsonc` do not exist; no repo-local OpenCode instructions to inherit.
