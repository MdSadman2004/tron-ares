# TRON: ARES — PROTOCOL OVERRIDE

A 5-mode transformable grid combat simulator built with Three.js + Vite.
Playable in any desktop browser — keyboard + mouse.

## Play (Windows)

Double-click **PLAY.bat** (installs deps if needed, starts the dev server, opens the game).

Manual:

```bash
npm install
npm run dev          # dev server -> http://127.0.0.1:5173
npm run build        # production build -> dist/
npm run preview      # serve the production build
```

## Controls

| Key | Action |
|-----|--------|
| `W` / `S` | Throttle / brake (ground) — throttle (air) |
| `A` / `D` | Steer / bank turn |
| `↑` / `↓` | Climb / dive (flight modes) |
| `SPACE` or Left-click | Fire forward weapon (hold to auto-fire) |
| `E` or Right-click | **Fire rear lasers** (anti-pursuer, 1.5× score) |
| `Q` | Special ability (per vehicle, see below) |
| `1` – `5` | Direct vehicle select |
| `F` | Cycle all five configurations |
| `SHIFT` | Overdrive boost thruster |
| `C` | Cycle camera (CHASE / COCKPIT / ACTION / HOOD) |
| `R` | Grid recall — teleports you out if stuck |
| `H` / `M` / `ESC` | Help / mute / pause |

## The Five Configurations

| # | Vehicle | Speed | Armour | Special (`Q`) |
|---|---------|-------|--------|----------------|
| 1 | 🏍️ LIGHTCYCLE | 92 | 5% | EMP discharge (360°, 85 dmg) |
| 2 | ✈️ LIGHT JET | 142 | 8% | 4× homing missiles (70 dmg + AoE) |
| 3 | 🛩️ HEAVY JET | 108 | 30% | 3× gravity bombs (130 dmg, 30 m AoE) |
| 4 | 🚁 VTOL GUNSHIP | 80 | 20% | 8-rocket spread barrage |
| 5 | ⚡ HYPER SPEEDER | 195 | 12% | Invulnerable overdrive + shockwave |

Each craft is a distinct 3D model with its own physics profile, weapon loadout and animation set.
Ground vehicles lay a fading light-ribbon trail and ram enemies at speed for damage.

## Enemy Forces (MCP)

| Enemy | Behaviour |
|-------|-----------|
| **Pursuer cycle** | Drafts behind you and rams; fires pulse bolts when facing |
| **Interceptor jet** | Aerial dogfight, orbits when close, hyperspeed catch-up |
| **Kamikaze drone** | Swarms in packs of 2–6 and detonates on contact |
| **MCP gunship** | Hover-strafes at 50–100 m, fires 3-round heavy bursts |
| **RECOGNIZER** | Boss every 4th wave — stomp shockwaves, quad barrage, deploys drones |

Waves scale health, damage and speed; enemies relocate themselves if they fall too far behind.

## Scenarios

- **SURVIVAL COMBAT** — wave-based; clear a wave to escalate, +1000 bonus per sector.
- **HIGHWAY CHASE** — endless pursuit escalation, no wave clears.
- **FREE FLIGHT ROAM** — sandbox; no hostiles, no damage (fly all five craft).

## Systems

- Combo scoring: chain kills within 3.5 s for up to **×5**; rear-laser kills score 1.5×.
- Drops: shield cells (+30% integrity) and thruster cells (boost refill) from derezzed enemies.
- Damage grace window prevents swarm contact damage from stacking instantly.
- Adaptive quality governor steps pixel ratio / bloom down if FPS drops below 42.
- Robustness: window-blur auto-pause, input clearing on focus loss, GPU context-loss handling,
  projectile/explosion caps, best score persisted to localStorage.

## Look

Crimson atmosphere: a gradient sky dome bleeding red out of the black horizon, a diffuse
crimson light pool on the drive surface, and falling crimson light streaks over the grid —
all following the player so the effect holds across the infinite grid.
