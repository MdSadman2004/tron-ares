# GRID PROTOCOL — HANDOFF

Neon grid-combat game. Three.js + Vite. Nine transformable machines, lethal
ribbon walls, rival programs, a story campaign. PC (browser) + Android (WebView).

Repo root: `E:/Tron ares` · source private: `github.com/MdSadman20040812/tron-ares`
Binary dist (public, APK): `github.com/MdSadman20040812/grid-protocol`
Last commit: `66f71f3`

---

## 1. State of play

| Area | Status |
|---|---|
| PC build | Production bundle works. `dist/` = 810 KB. 60 FPS desktop (median frame 16.7 ms, p95 33.4 ms) |
| Android | APK 1.75 MB, `com.ares.grid`, signed, installed & tested on SM-A075F / Android 16 |
| Public release | v1.0.1 live on the public repo, APK hash-verified (`0cb2b6c9…`) |
| Play Store | Signed AAB + all assets ready. **Human gates**: $25 account, ID verification, 12 testers × 14 days |
| Servers | **Shut down** on request. Restart: `PLAY-PRODUCTION.bat` (:8777) or `PLAY.bat` (:5173 dev) |

## 2. Systems map (`src/`)

- **chassis.js** — one machine, 22 articulated parts, 9 pose tables. Morph has
  anticipation wind-up, whip rotation, snap overshoot and a hull glow pulse.
  Measured **0.795 s** (0.62 ground / 0.78 air, was 0.95–1.15).
- **vehicle.js** — 9 specs (CYCLE/JET/HEAVY/VTOL/HYPER/JUMPJET/DART/SKIMMER/
  LIGHTDRONE), physics, weapons, `LightRibbon` (exported).
- **campaign.js** — "AFTER ARES": 6 checkpoints, story beats, a choice per
  chapter that changes the run, chassis + world-zone unlocks, story-mode assist.
- **enemies.js** — MCP roster + **PURGE SENTINEL** (w3+) and **SECTOR WARDEN** (w5+).
- **opponents.js** — rival programs (CYCLE/JET/HEAVY/VTOL): engagement ranges,
  lead shots, break-offs, wall awareness when in arena mode. Satisfies the enemy
  contract: `takeDamage / isDead / destroy / hitRadius / spec / position`.
- **autodrive.js** — TouchDrive: lane taps, auto-fire, yields to the human.
  Demo/showcase director for `?auto=1`. Preference key `gp:autodrive:v2`.
- **tutorial.js** — 7-step playback lesson, once per install (`gp:tutorialDone`).
- **world.js** — 6×6 districts, 12 sectors (9 + OUTLANDS/ARES RIFT/I/O TOWER),
  road symbols, runways, ramps, containment field (`setPlayZone`).
- **mobile.js** — touch layer dispatching real KeyboardEvents; DRIVE/AIM/LANE
  chips, haptics, phone render profile.
- **main.js** — orchestrator: states, scenarios, waves, scoring, attract mode,
  crash guard, quality tiers, campaign/zone wiring.
- **weapons.js**, **glitch.js**, **pickups.js**, **hud.js**, **audio.js**, **ares-vehicles.js**

## 3. Controls

`W A S D` drive · `Shift` boost · `Space`/L-click fire · `Z` Particle Lazer ·
`X` Ribbon Cutter · `Q` special · `1–9` chassis · `F` morph · **`V` autopilot** ·
`B` auto-fire · `C` camera · `P`/`Esc` pause · `R` restart (game over)

## 4. Commands

```bash
# PC
npm run dev            # :5173 dev, live reload
npm run build          # -> dist/
PLAY-PRODUCTION.bat    # build + serve dist on :8777 + app window
PLAY-DEMO.bat          # same, with ?auto=1 (self-playing showcase)

# Android
rm -rf android/app/src/main/assets && mkdir -p android/app/src/main/assets
cp -r dist/* android/app/src/main/assets/
cd android && JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot" \
  ANDROID_HOME="D:/Android/SDK" "D:/Apps/gradle-8.9/bin/gradle.bat" assembleRelease
"D:/Studio/platform-tools/adb.exe" -s R87YA00YSAD install -r app/build/outputs/apk/release/app-release.apk
bash android/tools/release.sh      # keystore + signed AAB
bash android/tools/final-qa.sh     # install + hands-free soak
```

## 5. Outstanding work (the next four asks, not started)

1. **Map extension** — OUTLANDS are palettes + a containment wall only. No new
   geometry: no buildings, landmarks, or district generator out there yet.
2. **Smoother user control** — needs a real pass: input ramping (steer is
   binary today), sub-stepped physics at speed, camera interpolation. Only
   measurement done so far.
3. **Gameplay optimisation** — biggest levers: district prop density, far plane,
   draw-call batching. Phone sits ~30 FPS at quality tier 3.
4. **Overhaul** — undefined; needs scoping with the user.

Also open: chapters 4–6 never played end-to-end; sentinel/warden borrow
jet/gunship behaviour instead of bespoke AI; the renamed APK was never
re-verified on the phone (it disconnected mid-install).

## 6. Traps that cost real cycles

- **Gradle**: daemon OOMs on a loaded box → `kotlin.compiler.execution.strategy=in-process`,
  `-Xmx1536m`, `parallel=false`. Two Gradle jobs in one project deadlock on the lock.
- **androidx.webkit**: `AssetsPathHandler(Context, String)` is package-private —
  use the 1-arg form and put the web build at the **assets root**.
- **`jarsigner -verify`** reports "no manifest" on v2/v3-signed APKs — that is
  not a failure; use `apksigner verify`.
- **`/tmp` is invisible to native Windows Python** from git-bash — use a real path.
- **Playwright MCP** can die mid-session; and its page keeps running the OLD
  bundle after you rebuild — always navigate again after a build.
- **`git rm -r --cached`** aborts wholesale if any path in the list is untracked.
- **Autopilot leaks**: attract mode / tutorials must never persist the player's
  driving preference (`setEnabled(on, persist=false)`).

## 7. Credentials & assets

- Upload keystore: `android/keystore/` (git-ignored) + `KEYSTORE-CREDENTIALS.txt`
  — **back this up**, it is required for every future update.
- Store art, listing copy, privacy policy, Play checklist: `D:/Outputs/TronAres-Play/`
- Distribution bundle: `D:/Outputs/GridProtocol-Distribution/`
