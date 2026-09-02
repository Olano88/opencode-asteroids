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

## Architecture — everything in `game.js` (423 lines)
| Section | Location | Notes |
|---------|----------|-------|
| Input | `game.js:9-24` | `keys` + `justPressed` pattern; `pressed()` consumes the event. `Space` uses one-shot, arrows use hold. |
| Utils | `game.js:27-30` | `wrap()` for toroidal space, `dist()`, `rand()`. |
| `Bullet` | `game.js:33-58` | TTL `1.1s`, speed `520`, wraps on edges. |
| `Asteroid` | `game.js:61-119` | Sizes `3→1` (radii `50/30/16`, speeds `32/55/85`, points `20/50/100`). Irregular polygon, `split()` yields 2× `size-1`. |
| `Ship` | `game.js:122-204` | Thrust `260`, rotation `3.5 rad/s`, drag `0.987`. 3s invincibility on respawn (blink via `game.js:174`). Cooldown `0.2s`. |
| `Particle` | `game.js:207-236` | Explosion debris, fades by `ttl/life`. |
| Game state | `game.js:239-290` | Globals `ship/bullets/asteroids/particles/score/lives/level`; states `playing|dead|gameover`; `spawnAsteroids()` enforces `SAFE_DIST 130` from center. |
| Loop | `game.js:293-423` | `update(dt)` + `draw()` driven by `requestAnimationFrame`; `dt` capped at `0.05`. |

- `state` machine: `playing` → `dead` (2s timer, `game.js:288`) → `playing` respawn, or `gameover` (Space to `initGame()`).
- No modules/exports — all globals in window scope, `'use strict'`.

## Conventions
- Code, comments, and HUD strings are Spanish. Keep new code/messages consistent.
- Canvas coords wrap toroidally (`game.js:27`), not clamped.
- Collision: `dist < radius` for bullets, `dist < ship.radius + asteroid.radius*0.82` for ship (`game.js:342`).

## Gotchas
- Single file — edits to game logic all target `game.js`. Don't add bundler/imports without reason.
- `justPressed` is consumed on read (`game.js:20-24`) — calling `pressed()` twice in one frame loses the second check.
- `opencode.json` / `opencode.jsonc` do not exist; no repo-local OpenCode instructions to inherit.
