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

## Laser beams (separate controls)

Two sustained lances with their own keys and a shared capacitor:

| Key | Weapon | Behaviour |
|---|---|---|
| **Z** / **middle-click** | **Particle Lazer** | Crimson lance from the nose guns. 195 dps, cuts through hulls, 380 m reach. |
| **X** | **Ribbon Cutter** | Amber sweep beam from the wing emitter, angled outward. 120 dps, 300 m. |

Each beam renders as three layers — white-hot core, coloured body, wide halo — and
terminates on whatever it touches first (enemy, structure or ground), spawning
impact flashes. The capacitor (100) drains at 42/s (lazer) + 26/s (cutter) and
regenerates at 17/s; at zero the beams cut out. Beam kills score at 1.4x.

## Rival programs (computer opponents)

`src/opponents.js` — pilots, not constructs. Each rival flies a fleet
configuration (CYCLE duelist / JET ace / HEAVY bomber / VTOL strafer), holds a
preferred engagement range, leads its shots with deliberate scatter, orbits when
it has the angle, backs off when hurt, and steers around the grid's structures.
They join from **wave 2** in Survival, periodically in Highway Chase, and one
spars with you in Free Flight. They live in the same enemy array as the MCP
forces, so weapons, ramming, scoring and loot all apply to them unchanged.
The purple roster panel shows who is hunting you and how hurt they are.

## LIGHT CYCLE ARENA (bike protocol)

Bikes only. You and three rival programs ride with your light walls lit — touch
any ribbon, **including your own**, and you derezz. The rivals steer around walls
(they derezzed themselves constantly before that was added), and they die on
your ribbon just as you die on theirs. Transformations are locked in this
protocol: `F` and `1-9` will be refused. Last program riding wins.

## TouchDrive (autopilot)

Asphalt-style touch driving: the machine flies itself, you just tap.

| Control | Action |
|---|---|
| **V** / ◈ DRIVE chip | toggle autopilot (on by default on phones) |
| **B** / ◈ AIM chip | auto-fire at any hostile inside the nose cone |
| ◀ LANE / LANE ▶ | swing the autopilot 45° left/right (lane change) |
| touch the stick | the pilot yields instantly, resumes ~1 s after you let go |

Autopilot navigates the grid, avoids structures, holds altitude in flight modes
and keeps the map edge from ending your run.

## Play Store release

```bash
bash android/tools/release.sh     # keystore (first run) + signed .aab + verification
bash android/tools/final-qa.sh    # installs the release build and runs a hands-free soak
```

Outputs: `android/app/build/outputs/bundle/release/app-release.aab` (Play) and
`android/app/build/outputs/apk/release/app-release.apk` (sideload).
The upload keystore lives in `android/keystore/` — **git-ignored, back it up**.

Store art, listing copy, privacy policy and the step-by-step Play checklist:
`D:/Outputs/TronAres-Play/`.

## Android build (phone)

The game ships as a native Android app: a WebView shell (`android/`) that serves
the built Vite bundle out of the APK's own assets over the `appassets` virtual
origin, so ES modules and absolute asset paths resolve exactly as they do on the
web. No network needed at runtime.

```bash
# 1. build the web bundle and hand it to the Android project
npm run build
rm -rf android/app/src/main/assets && mkdir -p android/app/src/main/assets
cp -r dist/* android/app/src/main/assets/

# 2. build the APK (JDK 17 + Android SDK; Gradle 8.9 crashes on JBR 25)
cd android
JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot" \
ANDROID_HOME="D:/Android/SDK" \
"D:/Apps/gradle-8.9/bin/gradle.bat" assembleDebug

# 3. install on an attached phone
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.ares.grid/com.ares.grid.MainActivity
```

**Touch controls** (`src/mobile.js`): a virtual throttle/steer stick with
climb/dive pads, FIRE / LAZER / CUTTER / BOOST hold buttons and SPECIAL /
MORPH / CAM / PAUSE taps. They dispatch real `KeyboardEvent`s, so the touch path
and the keyboard path are literally the same code. The layer hides itself
outside gameplay so the native menus own the taps.

**Phone profile:** fixed 1280-wide logical viewport, no MSAA, no rear-camera
PIP (that is a second WebGL renderer), a reduced-resolution quality tier, 10 s
spawn protection, and HUD panels that overlap the pads are retired
automatically (modal screens are exempt).

**Observability:** the shell forwards page errors and a 3 s
`state/mode/wave/fps/tier` probe to logcat — `adb logcat -s TRONARES:*`.

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
