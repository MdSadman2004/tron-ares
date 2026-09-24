# TRON: ARES - PROTOCOL OVERRIDE

A 9-vehicle transformable grid combat simulator built with Three.js + Vite.
Playable in any desktop browser with keyboard + mouse.

## Play (Windows)

Double-click **PLAY.bat** (installs deps if needed, starts the dev server, opens the game).

```bash
npm install
npm run dev          # dev server -> http://127.0.0.1:5173
npm run build        # production build -> dist/
npm run preview      # serve the production build
```

## The Fleet (9 configurations)

Keys `1`-`9` select directly, `F` cycles. Every chassis carries articulated
manipulator arms that fold in and snap out during a swap, with staged
counter-twisting plates - a proper mechanical transformation, not a scale pop.

**One machine, nine poses.** The craft is a single morphing chassis: core, nose,
canopy, wheels, two wing pairs, five engines, turret, Light Ram plough, four VTOL
rotor pods, hydrofoils, ion ring, wake and two articulated arms (22 parts).
Every mode is a POSE TABLE over those parts, and a transformation physically
travels each part to its new place with its own stagger - wheels tuck first,
wings unfold and flare wide mid-morph, engines slide back, the turret locks last.
Nothing is swapped or cross-faded.

| # | Vehicle | Role | Special (Q) |
|---|---------|------|-------------|
| 1 | Lightcycle | ground combat & drift, light-ribbon trail | EMP discharge |
| 2 | Light Jet | aerial dogfight | 4x homing missiles |
| 3 | Heavy Jet | armoured bomber gunship | gravity bomb salvo |
| 4 | VTOL Gunship | hover & strafe | 8-rocket barrage |
| 5 | Hyper Speeder | ultra-fast interceptor (195 m/s) | invulnerable overdrive |
| 6 | **Jump Jet** *(TRON: Ares)* | Red Guard, four ribbon wings | 4x Light Ribbon lash |
| 7 | **DART** *(TRON: Ares)* | Amphibious Rapid Response Tank, M-1 + 2x M240 | Light Ram plough (drives through walls) |
| 8 | **Light Skimmer** *(TRON: Ares)* | open-topped surface skimmer | Submersible mode (untargetable) |
| 9 | **Light Drone** *(TRON: Ares)* | baton-rezzed attacker | Phase cloak |

The Ares vehicles are modelled from the film's Dillinger Grid designs: black
chassis with red circuitry, baton-rezzed, no cockpits. The DART's Light Ram
genuinely ploughs through solid walls, exactly as in the film.

## The Grid (36 districts, 9 sectors)

A 6x6 district map: grid arena, megacity with avenues, data farm, monolith
field, canyon race channel, processing plant, sky pillars with floating hex
platforms, the Sea of Simulation, elevated highway with tunnels, solar farm,
monument plaza, derezzed ruins and packed obstacle fields.

* **Open runways vs obstacle fields** - 12 runway corridors (ring + radial) are
  enforced keep-clear lanes: nothing ever spawns on them. The layout alternates
  dense obstacle zones and open runway, so you can breathe between fights.
* **Road symbols** - divider pips, lateral divider bars, deck glyphs
  (arrow / cross / diamond) and overhead gantry signs, all glowing red & orange.
* **52 launch ramps** with real jump physics (airborne arcs + landing).
* **Solid architecture** - 1259 colliders in a spatial hash: towers, walls and
  monoliths stop you, with a grind along the face instead of a dead stop.
* **Sector palettes** - the map is divided into 9 sectors with their own sky,
  fog and ground-glow palette (Core Grid, Cyan Suburb, Amber Works, Violet
  Deep, Ice Grid, Ember Zone, Green Dataforest, Rust Flats, The Void). Crossing
  a boundary re-skins the world and announces the new region.

## Glitch / derezz FX

A full-screen corruption pass (block displacement, RGB split, scanlines, grain,
magenta corruption bands and derezz pixelation):

* ambient grid corruption fires every ~12-34 s on its own
* every hull hit and hard impact tears the render
* **death slams it to full and holds** while the core disintegrates

## Enemy Forces (MCP)

Pursuer cycles (draft and ram), air interceptors, kamikaze drone swarms, hover
gunships with 3-round bursts, and the **Recognizer** boss every 4th wave - stomp
shockwaves, quad barrage and drone deployment. Waves scale health, damage and
speed.

## Controls

| Key | Action |
|-----|--------|
| `W` / `S` | Throttle / brake (air modes: throttle) |
| `A` / `D` | Steer / bank |
| `Up` / `Down` | Climb / dive (flight modes) |
| `SPACE` / Left-click | Fire forward weapon (hold to auto-fire) |
| `E` / Right-click | Rear lasers (1.5x score) |
| `Q` | Special ability |
| `1`-`9` / `F` | Direct select / cycle vehicles |
| `SHIFT` | Boost thruster |
| `C` / `H` / `M` / `R` | Camera / help / mute / grid recall (unstick) |
| `ESC` / `P` | Pause |

Scenarios: SURVIVAL COMBAT, HIGHWAY CHASE, FREE FLIGHT ROAM.
