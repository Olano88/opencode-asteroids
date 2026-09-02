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

## Architecture — everything in `game.js` (495 lines)
| Section | Location | Notes |
|---------|----------|-------|
| Input | `game.js:8-24` | `keys` + `justPressed` pattern; `pressed()` consumes the event. `Space` uses one-shot, arrows use hold. |
| Utils | `game.js:26-30` | `wrap()` for toroidal space, `dist()`, `rand()`, `randInt()`. |
| `Bullet` | `game.js:32-58` | TTL `1.1s`, speed `520`, wraps on edges. |
| `Asteroid` | `game.js:60-119` | Sizes `3→1` (radii `50/30/16`, speeds `32/55/85`, points `20/50/100`). Irregular polygon, `split()` yields 2× `size-1`. |
| `Ship` | `game.js:121-207` | Thrust `260`, rotation `3.5 rad/s`, drag `0.987`. 3s invincibility on respawn (blink via `game.js:174`). Cooldown `0.2s`. |
| `Particle` | `game.js:209-239` | Explosion debris, fades by `ttl/life`. |
| `PowerUp` | `game.js:241-283` | "Velocidad": cyan pulsing chevron. Drifts `30 px/s`, TTL `12s`. On pickup sets `ship.speedTimer = 5s` (resets to 5 if already active). |
| Game state | `game.js:285-339` | Globals `ship/bullets/asteroids/particles/powerups/score/lives/level`; states `playing|dead|gameover`; `spawnAsteroids()` enforces `SAFE_DIST 130` from center. |
| Loop | `game.js:342-481` | `update(dt)` + `draw()` driven by `requestAnimationFrame`; `dt` capped at `0.05`. |

- `state` machine: `playing` → `dead` (2s timer, `game.js:337`) → `playing` respawn, or `gameover` (Space to `initGame()`).
- Speed power-up: spawned with `8%` chance per destroyed asteroid (max 3 on screen, `game.js:394`); collected by ship contact (`game.js:376-383`); doubles thrust while active (cyan ship / `VELOCIDAD X2` HUD).
- No modules/exports — all globals in window scope, `'use strict'`.

## Conventions
- Code, comments, and HUD strings are Spanish. Keep new code/messages consistent.
- Canvas coords wrap toroidally (`game.js:27`), not clamped.
- Collision: `dist < radius` for bullets, `dist < ship.radius + asteroid.radius*0.82` for ship (`game.js:404`); `dist < ship.radius + powerup.radius` for power-up pickup (`game.js:377`).

## Gotchas
- Single file — edits to game logic all target `game.js`. Don't add bundler/imports without reason.
- `justPressed` is consumed on read (`game.js:20-24`) — calling `pressed()` twice in one frame loses the second check.
- `opencode.json` / `opencode.jsonc` do not exist; no repo-local OpenCode instructions to inherit.
