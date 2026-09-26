import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GlitchShader, GlitchFX } from './glitch.js';

import { AresVehicle, VEHICLE_MODES, VEHICLE_SPECS, MODE_ORDER } from './vehicle.js';
import { WeaponSystem } from './weapons.js';
import { EnemySpawner, ENEMY_SPECS } from './enemies.js';
import { TronWorld } from './world.js';
import { TronHUD } from './hud.js';
import { PickupSystem, PICKUP_TYPES } from './pickups.js';
import { audio } from './audio.js';
import { installTouchControls } from './mobile.js';
import { OpponentDirector, OPPONENT_SPECS } from './opponents.js';
import { AutoDrive } from './autodrive.js';
import { createTutorial } from './tutorial.js';
import { Campaign, CHAPTERS } from './campaign.js';

// Rival programs share the enemy contract, so scoring, loot, ramming and
// weapons treat them exactly like the MCP constructs.
Object.assign(ENEMY_SPECS, OPPONENT_SPECS);

/**
 * GRID PROTOCOL — PROTOCOL OVERRIDE
 * Main game orchestrator: state machine (menu / playing / paused / gameover),
 * scenario rules, wave direction, scoring, adaptive quality.
 */

export const SCENARIOS = {
  SURVIVAL: {
    id: 'SURVIVAL',
    label: 'SURVIVAL COMBAT',
    desc: 'Wave-based MCP assault. Clear every wave to escalate. Every 4th wave deploys a RECOGNIZER.'
  },
  CHASE: {
    id: 'CHASE',
    label: 'HIGHWAY CHASE',
    desc: 'Endless pursuit escalation — no waves, no mercy. Survive as long as the grid allows.'
  },
  FREE: {
    id: 'FREE',
    label: 'FREE FLIGHT ROAM',
    desc: 'Sandbox patrol. No hostiles, no damage — fly all nine configurations over the grid.'
  },
  CAMPAIGN: {
    id: 'CAMPAIGN',
    label: 'CAMPAIGN — AFTER ARES',
    desc: 'Six checkpoints. A story, a choice before every run, and chassis you only earn by surviving. The Grid opens as you go.'
  },
  ARENA: {
    id: 'ARENA',
    label: 'LIGHT CYCLE ARENA',
    desc: 'Bike protocol. Rival programs ride with ribbons lit — touch any light wall, yours included, and you derezz. Last program riding wins.'
  }
};

const COMBO_WINDOW = 3.5;
const BEST_SCORE_KEY = 'tron-ares-best-score';

class TronAresGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Game state
    this.state = 'menu';                 // menu | playing | paused | gameover
    this.scenario = SCENARIOS.SURVIVAL;
    this.elapsed = 0;
    this.waveState = 'idle';             // idle | active | intermission
    this.intermissionTimer = 0;

    this.gameStats = {
      score: 0,
      kills: 0,
      wave: 1,
      playerShield: 100,
      maxShield: 100,
      rearLaserKills: 0,
      comboStreak: 0,
      comboTimer: 0,
      multiplier: 1,
      best: this.loadBestScore()
    };

    // Camera
    this.cameraModes = ['CHASE', 'COCKPIT', 'ACTION', 'HOOD'];
    this.currentCamModeIdx = 0;
    this.camShake = 0;
    this.fovTarget = 65;

    // Inputs (held states — weapons auto-repeat while held)
    this.inputs = {
      forward: false, backward: false,
      left: false, right: false,
      climb: false, dive: false,
      boost: false, fireFront: false, fireRear: false, special: false,
      beamPrimary: false, beamSecondary: false
    };

    // Damage grace (prevents contact-damage stacking from swarms)
    this.contactGrace = 0;

    // Performance governor
    this.perf = { fps: 60, tier: 0, checkTimer: 0, hudTimer: 0 };

    this.initThree();
    this.initPostProcessing();
    this.initWorld();
    this.initVehicle();
    this.initSystems();
    this.initInputListeners();
    this.initHUD();
    // initSystems runs before the HUD exists, so hand the director its panel now
    if (this.opponents) this.opponents.hud = this.hud;

    // Expose for diagnostics / automated tests
    window.__TRON__ = this;

    // Touch layer for phones / tablets (dispatches real key events)
    this.touch = installTouchControls(this);

    // Attract mode: the grid plays itself behind the menu, and nothing it
    // does counts — a demonstration, not a run.
    this.attract = false;
    this.scoringEnabled = true;
    this.attractEnabled = !/[?&]attract=0/.test(location.search);
    this.tutorial = createTutorial(this);
    this.campaign = new Campaign(this);

    // Autonomous play: ?auto=1 (PLAY-DEMO.bat) hands the machine to the
    // autopilot and lets it run — soaks, demos and screenshot passes.
    this.autoplay = /[?&]auto=1/.test(location.search) || window.__TRON_AUTOPLAY__ === true;
    if (this.autoplay) {
      this.selectScenario('SURVIVAL');
      this.autoDrive.setEnabled(true);
      this.autoDrive.setAutoFire(true);
      this.startGame();
    } else {
      this.startAttract();
    }

    // Production crash guard: never leave the player on a dead black canvas.
    window.addEventListener('error', (ev) => this.showCrash(ev.message || 'unknown error'));
    window.addEventListener('unhandledrejection', (ev) => this.showCrash(
      (ev.reason && ev.reason.message) || 'async failure'
    ));

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadBestScore() {
    try {
      return parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveBestScore(score) {
    if (score > this.gameStats.best) {
      this.gameStats.best = score;
      try { localStorage.setItem(BEST_SCORE_KEY, String(score)); } catch (e) { /* private mode */ }
    }
  }

  // ==================================================================
  //  BOOTSTRAP
  // ==================================================================
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020307);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 3400);   // 8x8 map needs the reach
    this.camera.position.set(0, 5, 12);

    // MSAA is a fill-rate luxury: phones get a clean alias-free-ish buffer by
    // rendering below native and scaling up instead.
    this.renderer = new THREE.WebGLRenderer({
      antialias: !window.__TRON_PHONE__,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // PBR environment map: without one, metallic hulls render as flat black
    // silhouettes. A quiet room probe gives the neon-lit metal actual form.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 0.38;
    pmrem.dispose();
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      if (this.composer) this.composer.setSize(width, height);
      if (this.glitchFX) this.glitchFX.setResolution(width, height);
    });

    // Robustness: survive GPU context loss
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.setState('paused');
      this.hud && this.hud.showAlert('⚠ GPU CONTEXT LOST — RELOAD THE PAGE [F5]', true);
    });
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Strength / radius / threshold. A low threshold washed the whole grid in
    // magenta bloom and hid the road markings — keep it high so only genuinely
    // bright neon bleeds.
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.15, 0.5, 0.34
    );
    this.composer.addPass(this.bloomPass);

    // Grid corruption pass (datamosh / derezz) — always last in the chain
    this.glitchPass = new ShaderPass(GlitchShader);
    this.glitchPass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    this.composer.addPass(this.glitchPass);
    this.glitchFX = new GlitchFX(this.glitchPass);
  }

  initWorld() {
    this.world = new TronWorld(this.scene);
  }

  initVehicle() {
    this.vehicle = new AresVehicle(this.scene);
  }

  initSystems() {
    this.weaponSystem = new WeaponSystem(this.scene);
    this.enemySpawner = new EnemySpawner(this.scene);
    this.pickups = new PickupSystem(this.scene);

    // Rivals need the world for structure avoidance, and they are spawned
    // through the enemy array so every existing system sees them.
    this.enemySpawner.world = this.world;
    this.opponents = new OpponentDirector(this.scene, this.enemySpawner, this.world, this.hud);
    this.enemySpawner.director = this.opponents;   // rivals read each other's walls through this

    // TouchDrive: the machine can fly itself while you shoot
    this.autoDrive = new AutoDrive(this);
  }

  initHUD() {
    this.hud = new TronHUD(this.scene, this.renderer);

    this.hud.onModeSelect = (mode) => this.requestMode(mode);

    // Camera view cycle button
    const btnCam = document.getElementById('btn-camera-view');
    if (btnCam) btnCam.addEventListener('click', () => this.cycleCamera());

    // Transform button
    const btnTransform = document.getElementById('btn-transform-action');
    if (btnTransform) {
      btnTransform.addEventListener('click', () => {
        this.vehicle.cycleMode(1);
        this.announceModeChange();
      });
    }

    // Pause button
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());

    // Start / Restart
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) btnStart.addEventListener('click', () => this.startGame());

    // Pause overlay buttons
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) btnResume.addEventListener('click', () => this.togglePause(false));
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => { this.togglePause(false); this.startGame(); });
    const btnQuit = document.getElementById('btn-quit');
    if (btnQuit) btnQuit.addEventListener('click', () => this.quitToMenu());

    // Scenario selector
    this.scenarioButtons = Array.from(document.querySelectorAll('.scenario-btn'));
    for (const btn of this.scenarioButtons) {
      btn.addEventListener('click', () => this.selectScenario(btn.dataset.scenario));
    }
    this.selectScenario('SURVIVAL');

    // Enter starts from menu
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Enter' || e.code === 'NumpadEnter') && this.state === 'menu') {
        const modal = document.getElementById('modal-screen');
        if (modal && !modal.classList.contains('hidden')) this.startGame();
      }
    });

    if (this.gameStats.best > 0) {
      const bestEl = document.getElementById('best-score');
      if (bestEl) bestEl.textContent = String(this.gameStats.best).padStart(6, '0');
    }
  }

  selectScenario(id) {
    const scenario = SCENARIOS[id] || SCENARIOS.SURVIVAL;
    this.scenario = scenario;
    this.hud.setScenarioLabel(scenario.label);
    for (const btn of this.scenarioButtons) {
      btn.classList.toggle('active', btn.dataset.scenario === scenario.id);
    }
    const descEl = document.getElementById('scenario-desc');
    if (descEl) descEl.textContent = scenario.desc;
  }

  // ==================================================================
  //  STATE MACHINE
  // ==================================================================
  setState(state) {
    this.state = state;
    this.hud && this.hud.showPause(state === 'paused');
  }

  startGame(options = {}) {
    const modalScreen = document.getElementById('modal-screen');
    if (modalScreen) modalScreen.classList.add('hidden');

    audio.init();
    audio.resume();

    this.stopAttract();

    // Reset world state
    this.gameStats.score = 0;
    this.gameStats.kills = 0;
    this.gameStats.wave = 1;
    this.gameStats.playerShield = 100;
    this.gameStats.rearLaserKills = 0;
    this.gameStats.comboStreak = 0;
    this.gameStats.comboTimer = 0;
    this.gameStats.multiplier = 1;

    this.elapsed = 0;
    this.enemySpawner.clear();
    if (this.opponents) this.opponents.clear();
    this.weaponSystem.clear();
    this.pickups.clear();
    this.vehicle.reset();
    this.gameStats.rivalKills = 0;

    this.setState('playing');

    if (this.tutorial && this.tutorial.shouldRun() && !this.attract) {
      this.tutorial.start();
    }

    if (this.autoDrive) {
      if (this.autoDrive.enabled) {
        this.hud.showAlert('◈ TOUCHDRIVE ACTIVE — PRESS V TO DRIVE IT YOURSELF', true, 3600);
      } else {
        this.hud.showAlert('◈ MANUAL FLIGHT — YOU HAVE THE CONTROLS (V = AUTOPILOT)', false, 3000);
      }
    }
    if (this.scenario.id === 'CAMPAIGN' && !options.mission) {
      // Selecting the protocol shows the briefing; launching a mission from
      // that briefing must fall through and actually start the run.
      this.startCampaignFlow();
      return;
    }

    if (this.scenario.id === 'ARENA') {
      // bike protocol: everyone rides the deck with the wall lit
      this.waveState = 'idle';
      this.opponents.arenaMode = true;
      this.vehicle.forceRibbon = true;
      if (this.vehicle.mode !== 'CYCLE') this.vehicle.setMode('CYCLE');
      this.opponents.nextSpawn = 2.0;
      this.opponents.spawnForWave(4, this.vehicle);
      this.hud.showWaveBanner('LIGHT CYCLE ARENA', 'RIBBONS LIVE — DO NOT TOUCH THE LIGHT');
      this.hud.showAlert('⚔ ARENA PROTOCOL ACTIVE // RIVAL PROGRAMS INBOUND', true, 4000);
    } else if (this.scenario.id === 'FREE') {
      this.waveState = 'idle';
      if (this.opponents) this.opponents.spawnForWave(3, this.vehicle);
      this.hud.showWaveBanner('FREE FLIGHT', 'RIVAL SPARRING PROGRAM ACTIVE — FLY ALL NINE CONFIGURATIONS');
      this.hud.showAlert('SANDBOX PATROL ACTIVE // PRESS [F] OR [1-5] TO TRANSFORM', true, 5000);
    } else {
      this.waveState = 'intermission';
      this.intermissionTimer = 1.6;
      this.hud.showWaveBanner('PROTOCOL OVERRIDE', this.scenario.label);
      this.hud.showAlert('PROTOCOL OVERRIDE ACTIVE // ELIMINATE MCP PURSUERS', true);
    }
  }

  togglePause(force) {
    if (this.state === 'playing' || force === true) {
      if (this.state !== 'playing') return;
      this.setState('paused');
      this.hud.showAlert('SIMULATION PAUSED // [ESC] RESUME');
    } else if (this.state === 'paused') {
      this.setState('playing');
      this.hud.showAlert('SIMULATION RESUMED', false, 2000);
    }
  }

  quitToMenu() {
    this.setState('menu');
    this.enemySpawner.clear();
    this.weaponSystem.clear();
    this.pickups.clear();
    this.vehicle.reset();

    const modalScreen = document.getElementById('modal-screen');
    const modalTitle = document.querySelector('.modal-title');
    const modalSubtitle = document.querySelector('.modal-subtitle');
    const btnStart = document.getElementById('btn-start-game');

    if (modalTitle) modalTitle.innerHTML = `TRON: <span class="highlight-red">ARES</span>`;
    if (modalSubtitle) modalSubtitle.textContent = 'GRID INVASION PROTOCOL // 5-MODE COMBAT SIMULATOR';
    if (btnStart && btnStart.querySelector('.btn-text')) btnStart.querySelector('.btn-text').textContent = 'ENTER THE GRID';
    if (modalScreen) modalScreen.classList.remove('hidden');
  }

  /** Enter the story: briefing card → choice → mission → checkpoint. */
  startCampaignFlow() {
    this.campaign.start();
  }

  // ==================================================================
  //  ATTRACT MODE — the grid demonstrates itself behind the menu
  // ==================================================================
  startAttract() {
    if (!this.attractEnabled || this.state !== 'menu') return;
    this.attract = true;
    this.scoringEnabled = false;

    this.enemySpawner.clear();
    this.weaponSystem.clear();
    this.pickups.clear();
    this.vehicle.reset();
    this.gameStats.score = 0;
    this.gameStats.kills = 0;
    this.gameStats.wave = 1;
    this.gameStats.comboStreak = 0;
    this.gameStats.multiplier = 1;

    // The demonstration drives itself — silently. It does NOT get to change
    // how the player plays, and it is switched back the moment they take over.
    this._prefBeforeAttract = this.autoDrive.playerPreference;
    this.autoDrive.setEnabled(true, false);
    this.autoDrive.setAutoFire(true);
    this.waveState = 'idle';
    this.enemySpawner.waveScale = 2;

    // a light hostile presence so the demo has something to chew on
    this.enemySpawner.spawnWave(2, this.vehicle);
    if (this.opponents) {
      this.opponents.arenaMode = false;
      this.opponents.spawnForWave(3, this.vehicle);
    }
    this.hud.showAlert('◈ ATTRACT MODE // DEMONSTRATION RUN — NOTHING COUNTS', false, 3200);
  }

  stopAttract() {
    if (!this.attract) return;
    this.attract = false;
    this.scoringEnabled = true;
    // hand the controls back exactly as the player left them
    const pref = this._prefBeforeAttract !== undefined
      ? this._prefBeforeAttract
      : this.autoDrive.playerPreference;
    this.autoDrive.setEnabled(pref, false);
    this.autoDrive.setAutoFire(pref ? this.autoDrive.autoFire : false);
    this.enemySpawner.clear();
    this.weaponSystem.clear();
    this.pickups.clear();
    if (this.opponents) this.opponents.clear();
    this.vehicle.reset();
  }

  /** Friendly failure instead of a dead black screen. */
  showCrash(message) {
    if (this._crashed) return;
    this._crashed = true;
    const el = document.createElement('div');
    el.id = 'crash-guard';
    const card = document.createElement('div');
    card.className = 'cg-card';
    const h = document.createElement('h2'); h.textContent = 'GRID INTERRUPT';
    const p = document.createElement('p');
    p.textContent = 'The simulation hit an unexpected state and stopped safely.';
    const c = document.createElement('code'); c.textContent = String(message).slice(0, 220);
    const b = document.createElement('button'); b.id = 'cg-reload'; b.textContent = 'RE-INITIALIZE';
    card.appendChild(h); card.appendChild(p); card.appendChild(c); card.appendChild(b);
    el.appendChild(card);
    document.body.appendChild(el);
    b.addEventListener('click', () => location.reload());
  }

  handleGameOver() {
    if (!this.scoringEnabled) return;
    if (this.autoplay) {
      // keep the demo rolling: a fresh run a few seconds after each derezz
      clearTimeout(this._autoRestart);
      this._autoRestart = setTimeout(() => { this.startGame(); }, 4500);
    }
    this.weaponSystem.clearBeam('primary');
    this.weaponSystem.clearBeam('secondary');
    if (this.hud && this.hud.setRivals) this.hud.setRivals([]);
    this.vehicle.forceRibbon = false;
    if (this.opponents) this.opponents.arenaMode = false;
    this.setState('gameover');
    audio.playExplosion();
    // Full derezz: the whole grid corrupts while the core disintegrates
    if (this.glitchFX) this.glitchFX.trigger(1.0, 3.4);
    this.deathGlitch = 1.6;
    this.hud.showAlert('CRITICAL INTEGRITY FAILURE // ARES CORE DEREZZED', true);
    this.saveBestScore(this.gameStats.score);

    const modalScreen = document.getElementById('modal-screen');
    const modalTitle = document.querySelector('.modal-title');
    const modalSubtitle = document.querySelector('.modal-subtitle');
    const btnStart = document.getElementById('btn-start-game');
    const bestEl = document.getElementById('best-score');

    if (modalTitle) modalTitle.innerHTML = `SYSTEM <span class="highlight-red">DEREZZED</span>`;
    if (modalSubtitle) {
      modalSubtitle.textContent =
        `FINAL SCORE: ${this.gameStats.score} | ENEMIES DEREZZED: ${this.gameStats.kills} | REAR-LASER KILLS: ${this.gameStats.rearLaserKills} | WAVE: ${this.gameStats.wave}`;
    }
    if (bestEl) bestEl.textContent = String(this.gameStats.best).padStart(6, '0');
    if (btnStart && btnStart.querySelector('.btn-text')) btnStart.querySelector('.btn-text').textContent = 'RE-INITIALIZE PROTOCOL';
    if (modalScreen) modalScreen.classList.remove('hidden');
  }

  // ==================================================================
  //  INPUT
  // ==================================================================
  requestMode(mode) {
    // Story gating: the Grid only builds what you have earned. (Free-play
    // protocols ignore the ladder entirely.)
    if (this.campaign && this.campaign.active && !this.campaign.isUnlocked(mode)) {
      const ch = this.campaign.chapter;
      this.hud.showAlert(`⛔ CHASSIS LOCKED // CLEAR CHECKPOINT ${String(ch.id).padStart(2, '0')} TO UNLOCK`, true, 2200);
      return false;
    }
    if (this.scenario.id === 'ARENA' && mode !== 'CYCLE') {
      this.hud.showAlert('ARENA PROTOCOL // LIGHT CYCLE ONLY', true, 1500);
      return;
    }
    if (this.state !== 'playing' && this.state !== 'paused') return;
    if (!VEHICLE_SPECS[mode] || mode === this.vehicle.mode) return;
    this.vehicle.setMode(mode);
    this.announceModeChange();
  }

  announceModeChange() {
    const target = this.vehicle.transform.active ? this.vehicle.transform.to : this.vehicle.mode;
    const spec = VEHICLE_SPECS[target];
    this.hud.showAlert(`TRANSFORMATION INITIATED → ${spec.icon} ${spec.name}`);
  }

  cycleCamera() {
    this.currentCamModeIdx = (this.currentCamModeIdx + 1) % this.cameraModes.length;
    const mode = this.cameraModes[this.currentCamModeIdx];
    const camStatusEl = document.getElementById('cam-status');
    if (camStatusEl) camStatusEl.textContent = mode;
    this.hud.showAlert(`CAMERA MODE: ${mode}`, false, 1800);
  }

  initInputListeners() {
    const modeKeyMap = {
      Digit1: 'CYCLE', Digit2: 'JET', Digit3: 'HEAVY', Digit4: 'VTOL', Digit5: 'HYPER',
      Digit6: 'JUMPJET', Digit7: 'DART', Digit8: 'SKIMMER', Digit9: 'LIGHTDRONE',
      Numpad1: 'CYCLE', Numpad2: 'JET', Numpad3: 'HEAVY', Numpad4: 'VTOL', Numpad5: 'HYPER',
      Numpad6: 'JUMPJET', Numpad7: 'DART', Numpad8: 'SKIMMER', Numpad9: 'LIGHTDRONE'
    };

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      audio.resume();

      // Global keys
      if (e.code === 'KeyM') {
        audio.init();
        const unmuted = audio.toggleMute();
        const s = document.getElementById('audio-status');
        if (s) s.textContent = unmuted ? 'ON' : 'OFF';
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
        return;
      }
      if (e.code === 'KeyH') {
        const modal = document.getElementById('modal-screen');
        if (modal && this.state !== 'playing') modal.classList.toggle('hidden');
        return;
      }

      if (this.state !== 'playing') {
        if (e.code === 'KeyR' && this.state === 'gameover') this.startGame();
        return;
      }

      switch (e.code) {
        case 'KeyW': this.inputs.forward = true; break;
        case 'ArrowUp': this.inputs.forward = true; this.inputs.climb = true; break;
        case 'KeyS': this.inputs.backward = true; break;
        case 'ArrowDown': this.inputs.backward = true; this.inputs.dive = true; break;
        case 'KeyA': case 'ArrowLeft':
          this.inputs.left = true;
          this.autoDrive && this.autoDrive.notifyManual();
          break;
        case 'KeyD': case 'ArrowRight':
          this.inputs.right = true;
          this.autoDrive && this.autoDrive.notifyManual();
          break;
        case 'KeyR': this.recallToGrid(); break;
        case 'ShiftLeft': case 'ShiftRight':
          if (!this.inputs.boost) audio.playBoost();
          this.inputs.boost = true;
          break;
        case 'Space':
          e.preventDefault();
          this.inputs.fireFront = true;
          break;
        case 'KeyE': case 'KeyX':
          e.preventDefault();
          this.inputs.fireRear = true;
          break;
        case 'KeyQ':
          this.inputs.special = true;
          this.fireSpecial();
          break;
        case 'KeyV':
          if (this.autoDrive) {
            const on = this.autoDrive.setEnabled(!this.autoDrive.enabled);
            this.hud.showAlert(on ? '◈ AUTODRIVE ENGAGED' : '◈ MANUAL FLIGHT', on, 1500);
          }
          break;
        case 'KeyB':
          if (this.autoDrive) {
            const on = this.autoDrive.setAutoFire(!this.autoDrive.autoFire);
            this.hud.showAlert(on ? '◈ AUTO-FIRE ON' : '◈ AUTO-FIRE OFF', false, 1200);
          }
          break;
        case 'KeyZ':
          // PARTICLE LAZER (sustained crimson beam)
          this.inputs.beamPrimary = true;
          audio.playBeam('primary');
          this.hud.showAlert('🔺 PARTICLE LAZER ENGAGED [Z]', true, 1500);
          break;
        case 'KeyX':
          // RIBBON CUTTER (sustained wide beam)
          this.inputs.beamSecondary = true;
          audio.playBeam('secondary');
          this.hud.showAlert('✳ RIBBON CUTTER ENGAGED [X]', false, 1500);
          break;
        case 'KeyF':
          this.vehicle.cycleMode(1);
          this.announceModeChange();
          break;
        case 'KeyC':
          this.cycleCamera();
          break;
        default:
          if (modeKeyMap[e.code]) this.requestMode(modeKeyMap[e.code]);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.inputs.forward = false; break;
        case 'ArrowUp': this.inputs.forward = false; this.inputs.climb = false; break;
        case 'KeyS': this.inputs.backward = false; break;
        case 'ArrowDown': this.inputs.backward = false; this.inputs.dive = false; break;
        case 'KeyA': case 'ArrowLeft': this.inputs.left = false; break;
        case 'KeyD': case 'ArrowRight': this.inputs.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.inputs.boost = false; break;
        case 'Space': this.inputs.fireFront = false; break;
        case 'KeyE': case 'KeyX': this.inputs.fireRear = false; break;
        case 'KeyQ': this.inputs.special = false; break;
        case 'KeyZ': this.inputs.beamPrimary = false; break;
        case 'KeyX': this.inputs.beamSecondary = false; break;
      }
    });

    // Mouse: hold to auto-fire
    window.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing') return;
      audio.resume();
      if (e.button === 0) this.inputs.fireFront = true;
      if (e.button === 2) {
        e.preventDefault();
        this.inputs.fireRear = true;
      }
      if (e.button === 1) {
        // middle mouse: Particle Lazer
        e.preventDefault();
        this.inputs.beamPrimary = true;
        audio.playBeam('primary');
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.inputs.fireFront = false;
      if (e.button === 2) this.inputs.fireRear = false;
      if (e.button === 1) this.inputs.beamPrimary = false;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Robustness: never keep keys stuck when the window loses focus
    const clearInputs = () => {
      for (const k of Object.keys(this.inputs)) this.inputs[k] = false;
    };
    window.addEventListener('blur', () => {
      clearInputs();
      if (this.state === 'playing') this.togglePause(true);
    });

    this.initTouchListeners();
  }

  recallToGrid() {
    // Stuck-recovery teleport (R)
    this.vehicle.position.set(0, this.vehicle.altitude, 0);
    this.vehicle.position.y = this.vehicle.spec.air ? Math.max(20, this.vehicle.altitude) : this.vehicle.spec.hoverHeight;
    this.vehicle.altitude = this.vehicle.position.y;
    this.vehicle.speed = 25;
    this.vehicle.invulnTimer = Math.max(this.vehicle.invulnTimer, 1.0);
    if (this.vehicle.ribbon) this.vehicle.ribbon.reset();
    this.hud.showAlert('GRID RECALL COMPLETE // POSITION RESET', false, 2200);
  }

  initTouchListeners() {
    const bindTouch = (id, onStart, onEnd) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        audio.resume();
        onStart();
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (onEnd) onEnd();
      });
    };

    bindTouch('touch-up', () => { this.inputs.forward = true; }, () => { this.inputs.forward = false; });
    bindTouch('touch-down', () => { this.inputs.backward = true; }, () => { this.inputs.backward = false; });
    bindTouch('touch-left', () => { this.inputs.left = true; }, () => { this.inputs.left = false; });
    bindTouch('touch-right', () => { this.inputs.right = true; }, () => { this.inputs.right = false; });
    bindTouch('touch-rear-laser', () => { this.inputs.fireRear = true; this.fireRearLasers(); }, () => { this.inputs.fireRear = false; });
    bindTouch('touch-front-laser', () => { this.inputs.fireFront = true; this.fireForwardLasers(); }, () => { this.inputs.fireFront = false; });
    bindTouch('touch-transform', () => { this.vehicle.cycleMode(1); this.announceModeChange(); });
    bindTouch('touch-boost', () => { this.inputs.boost = true; }, () => { this.inputs.boost = false; });
  }

  // ==================================================================
  //  COMBAT
  // ==================================================================
  fireRearLasers() {
    const salvo = this.vehicle.fireRearLaser();
    if (salvo) {
      this.weaponSystem.spawnLaserSalvo(salvo, false);
      this.camShake = Math.max(this.camShake, 0.22);
    }
  }

  fireForwardLasers() {
    const salvo = this.vehicle.fireFrontLaser();
    if (salvo) {
      this.weaponSystem.spawnLaserSalvo(salvo, false);
      this.camShake = Math.max(this.camShake, 0.12);
    }
  }

  fireSpecial() {
    const payload = this.vehicle.fireSpecial();
    if (!payload) return;

    switch (payload.kind) {
      case 'EMP':
        this.weaponSystem.spawnEMP(payload.origin, payload.radius, payload.damage);
        this.hud.showAlert('💥 EMP DISCHARGE ACTIVATED // 360° SWEEP');
        break;

      case 'SHOCKWAVE':
        this.weaponSystem.spawnShockwave(payload.origin, payload.radius, payload.damage, false, 0xcc00ff);
        this.hud.showAlert('⚡ OVERDRIVE ENGAGED // INVULNERABLE SURGE');
        break;

      case 'MISSILES':
        this.weaponSystem.spawnMissiles({
          origins: payload.origins,
          direction: payload.direction,
          targets: this.enemySpawner.enemies,
          damage: payload.damage,
          aoe: payload.aoe,
          speed: payload.speed,
          color: 0xff0838
        });
        this.hud.showAlert('🚀 HOMING MISSILE SALVO AWAY');
        break;

      case 'BOMBS':
        this.weaponSystem.spawnBombs({
          origins: payload.origins,
          direction: payload.direction,
          speed: payload.speed,
          damage: payload.damage,
          aoe: payload.aoe,
          color: 0xffaa00
        });
        this.hud.showAlert('🛩️ BOMB BAY OPEN // AREA DENIAL');
        break;

      case 'BARRAGE':
        this.weaponSystem.spawnBarrage({
          origins: payload.origins,
          direction: payload.direction,
          damage: payload.damage,
          aoe: payload.aoe,
          speed: payload.speed,
          color: 0xffaa00
        });
        this.hud.showAlert('🚁 ROCKET BARRAGE LAUNCHED');
        break;

      case 'RIBBON':
        // Jump Jet — four Light Ribbons lash forward (they derez what they touch)
        this.weaponSystem.spawnBolts({
          origins: payload.origins,
          direction: payload.direction,
          speed: payload.speed,
          damage: payload.damage,
          isEnemy: false,
          color: payload.color,
          scale: payload.scale,
          life: 3.0
        });
        this.hud.showAlert('🎏 4× LIGHT RIBBON DEPLOYED');
        break;

      case 'PLOUGH':
        this.hud.showAlert('🛡️ LIGHT RAM DEPLOYED // DRIVE THROUGH EVERYTHING');
        break;

      case 'SUBMERGE':
        this.hud.showAlert('🌊 SUBMERSIBLE CONFIGURATION // OFF THE GRID');
        break;

      case 'CLOAK':
        this.hud.showAlert('👻 PHASE CLOAK ENGAGED // MCP SENSORS BLINDED');
        break;
    }

    this.camShake = Math.max(this.camShake, 0.3);
  }

  /** Maintain or tear down the two sustained beams each frame. */
  updateBeams(delta) {
    const v = this.vehicle;
    const wantPrimary = this.inputs.beamPrimary && this.state === 'playing';
    const wantSecondary = this.inputs.beamSecondary && this.state === 'playing';

    const primarySpec = wantPrimary ? v.getBeamSpec('primary') : null;
    const secondarySpec = wantSecondary ? v.getBeamSpec('secondary') : null;

    if (primarySpec) {
      this.weaponSystem.setBeam('primary', primarySpec);
      if (!this.beamWasFiring || !this.beamWasFiring.primary) this.camShake = Math.max(this.camShake, 0.16);
    } else {
      this.weaponSystem.clearBeam('primary');
    }

    if (secondarySpec) {
      this.weaponSystem.setBeam('secondary', secondarySpec);
    } else {
      this.weaponSystem.clearBeam('secondary');
    }

    v.updateBeamCharge(delta, !!primarySpec, !!secondarySpec);
    this.beamWasFiring = { primary: !!primarySpec, secondary: !!secondarySpec };
  }

  /** Central kill handler: scoring, combo, drops. */
  onEnemyKilled(enemy, killType) {
    const spec = ENEMY_SPECS[enemy.type] || { score: 200, name: 'ENEMY' };
    if (!this.scoringEnabled) {
      // demonstration kill: the boom is real, the points are not
      this.weaponSystem.spawnExplosion(enemy.position.clone(), 0xff0838, 1.0);
      return;
    }
    let mult = 1.0;
    if (killType === 'rear') mult = 1.5;
    else if (killType === 'special') mult = 1.3;
    else if (killType === 'beam') mult = 1.4;
    else if (killType === 'ram') mult = 1.2;
    else if (killType === 'drone_detonate') mult = 0.75;

    // Combo chain
    this.gameStats.comboStreak++;
    this.gameStats.comboTimer = COMBO_WINDOW;
    this.gameStats.multiplier = Math.min(5, 1 + Math.floor(this.gameStats.comboStreak / 4));

    const gained = Math.round(spec.score * mult * this.gameStats.multiplier);
    this.gameStats.score += gained;
    this.gameStats.kills++;

    if (spec.rival) {
      this.gameStats.rivalKills = (this.gameStats.rivalKills || 0) + 1;
      this.hud.showWaveBanner(`${enemy.program || 'RIVAL'} DEREZZED`, `+${gained} PTS — ${spec.name} REMOVED FROM THE GRID`);
      audio.playExplosion();
      this.glitchFX && this.glitchFX.trigger(0.5, 0.35);
    } else if (killType === 'rear') {
      this.gameStats.rearLaserKills++;
      this.hud.showAlert(`🔴 PURSUER DEREZZED VIA REAR LASER // +${gained} PTS`, true, 1800);
    } else if (spec.boss) {
      this.hud.showWaveBanner('RECOGNIZER DEREZZED', `+${gained} PTS — GRID SECTOR SECURED`);
      audio.playExplosion();
    }

    // Loot drop
    const chance = spec.rival ? 1.0
      : enemy.type === 'RECOGNIZER' ? 1.0
      : enemy.type === 'GUNSHIP' ? 0.6
      : enemy.type === 'DRONE' ? 0.18
      : 0.3;
    this.pickups.maybeDrop(enemy.position.clone(), chance);
    if (enemy.type === 'RECOGNIZER') {
      this.pickups.maybeDrop(enemy.position.clone().add(new THREE.Vector3(4, 2, 4)), 1.0);
      this.pickups.maybeDrop(enemy.position.clone().add(new THREE.Vector3(-4, 2, -4)), 1.0);
    }
  }

  applyPlayerDamage(amount, sourcePos, kind = 'projectile') {
    if (this.state !== 'playing') return;
    if (this.scenario.id === 'FREE') return;
    if (this.vehicle.invulnTimer > 0) return;

    // Contact (ram/explosion) grace window: a pack of enemies cannot stack
    // instant damage — only one contact hit lands per grace period.
    if (kind === 'contact') {
      if (this.contactGrace > 0) return;
      this.contactGrace = 0.55;
    }

    const armor = this.vehicle.spec.armor || 0;
    const dmg = amount * (1 - armor);
    this.gameStats.playerShield = Math.max(0, this.gameStats.playerShield - dmg);
    this.hud.flashDamage();
    this.camShake = Math.max(this.camShake, 0.35);

    // hull damage tears the render
    const hurt = Math.min(1, dmg / 45);
    if (this.glitchFX) this.glitchFX.trigger(0.35 + hurt * 0.4, 0.28 + hurt * 0.3);

    if (this.gameStats.playerShield <= 0) this.handleGameOver();
  }

  // ==================================================================
  //  WORLD INTERACTION (ramps, solid architecture, plough)
  // ==================================================================
  handleRamps(delta) {
    const v = this.vehicle;
    for (const ramp of this.world.ramps) {
      const dx = v.position.x - ramp.x;
      const dz = v.position.z - ramp.z;
      const cy = Math.cos(ramp.yaw), sy = Math.sin(ramp.yaw);
      const localX = dx * cy - dz * sy;
      const localZ = dx * sy + dz * cy;

      const inside =
        Math.abs(localX) < ramp.halfW + v.spec.collisionRadius * 0.6 &&
        Math.abs(localZ) < ramp.len / 2;

      if (!inside) { ramp.used = false; continue; }
      if (v.spec.air && !v.spec.hover) continue;      // pure flight ignores ramps

      // Ramp ascends toward local +Z: entry at -len/2, lip at +len/2
      const progress = THREE.MathUtils.clamp((localZ + ramp.len / 2) / ramp.len, 0, 1);
      if (!v.airborne) {
        v.altitude = Math.max(v.altitude, v.spec.hoverHeight + ramp.height * progress);
      }

      if (progress > 0.9 && !ramp.used && Math.abs(v.speed) > 20) {
        ramp.used = true;
        const force = Math.min(48, 15 + Math.abs(v.speed) * 0.22 + ramp.height * 0.35);
        v.applyJump(force);
        this.camShake = Math.max(this.camShake, 0.14);
        audio.playBoost();
      }
    }
  }

  resolveWorldCollisions(delta) {
    const v = this.vehicle;
    if (v.isSubmerged || v.isCloaked) return;

    const radius = v.spec.collisionRadius;
    const px = v.position.x, pz = v.position.z, py = v.altitude;
    const candidates = this.world.queryColliders(px, pz, radius + 1);

    for (const c of candidates) {
      if (py - 0.4 > c.maxY || py + 1.2 < c.minY) continue;      // above / below it

      // Minkowski-expanded box vs craft circle, resolved along the nearest face.
      // (A centre-to-centre push degenerates to zero when the craft is exactly
      // centred inside a block — this never does.)
      const eMinX = c.minX - radius, eMaxX = c.maxX + radius;
      const eMinZ = c.minZ - radius, eMaxZ = c.maxZ + radius;

      if (px <= eMinX || px >= eMaxX || pz <= eMinZ || pz >= eMaxZ) continue;

      const dLeft = px - eMinX;    // positive: penetration depth from each side
      const dRight = eMaxX - px;
      const dDown = pz - eMinZ;
      const dUp = eMaxZ - pz;
      const minPen = Math.min(dLeft, dRight, dDown, dUp);

      // DART with the Light Ram deployed ploughs straight through walls
      if (v.hasPlough) {
        if (Math.abs(v.speed) > 25 && Math.random() < 0.35) {
          this.weaponSystem.spawnHitFlash(
            new THREE.Vector3(px + (dLeft < dRight ? -2 : 2), Math.max(1, py + 0.5), pz), 0xffaa00
          );
        }
        continue;
      }

      // Resolve to the face, then grind along it so contact feels like a
      // scrape instead of a dead stop.
      const grind = Math.min(9, Math.abs(v.speed) * 0.09);
      if (minPen === dLeft) {
        v.position.x = eMinX;
        v.position.z += (pz > (c.minZ + c.maxZ) / 2 ? grind : -grind) * 0.35;
      } else if (minPen === dRight) {
        v.position.x = eMaxX;
        v.position.z += (pz > (c.minZ + c.maxZ) / 2 ? grind : -grind) * 0.35;
      } else if (minPen === dDown) {
        v.position.z = eMinZ;
        v.position.x += (px > (c.minX + c.maxX) / 2 ? grind : -grind) * 0.35;
      } else {
        v.position.z = eMaxZ;
        v.position.x += (px > (c.minX + c.maxX) / 2 ? grind : -grind) * 0.35;
      }

      const impact = Math.abs(v.speed);
      v.speed *= 0.55;
      if (v.ramCooldown <= 0 && impact > 45) {
        v.ramCooldown = 0.7;
        this.camShake = Math.max(this.camShake, 0.5);
        this.weaponSystem.spawnExplosion(new THREE.Vector3(px, py + 0.6, pz), 0xffaa00, 0.7);
        this.applyPlayerDamage(Math.min(40, impact * 0.22), null, 'crash');
        if (this.glitchFX) this.glitchFX.trigger(0.5, 0.3);
        this.hud.showAlert('⚠ HULL IMPACT // OBSTRUCTION HIT', true, 1500);
      }
      break;   // one resolution per frame is enough; the next frame handles the rest
    }
  }

  applyPloughAura(delta) {
    const v = this.vehicle;
    const fwd = v.getForwardDirection();
    const damage = 120 * delta;
    for (let i = this.enemySpawner.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemySpawner.enemies[i];
      const rel = new THREE.Vector3().subVectors(enemy.position, v.position);
      const dist = rel.length();
      if (dist > 9 + enemy.hitRadius) continue;
      if (rel.clone().normalize().dot(fwd) < 0.45) continue;      // only ahead of the plough

      const dead = enemy.takeDamage(damage * (enemy.spec.boss ? 0.6 : 1));
      if (dead) {
        this.onEnemyKilled(enemy, 'ram');
        this.weaponSystem.spawnExplosion(enemy.position.clone(), 0xff0838, 1.0);
        enemy.destroy();
        this.enemySpawner.enemies.splice(i, 1);
      }
    }
  }

  /**
   * ARENA: light walls are solid death for whoever touches them — the player,
   * the rivals, anyone. This is what makes a bike duel a duel.
   */
  checkRibbonLethality() {
    if (!this.opponents || this.opponents.active.length === 0) return;
    const HIT_R2 = 2.1 * 2.1;

    // Gather every wall in play
    const walls = [];
    for (const r of this.opponents.active) {
      if (!r.dead && r.trail && r.trail.samples.length > 5) {
        walls.push({ samples: r.trail.samples, owner: r });
      }
    }

    // rivals vs walls (including each other's)
    for (const r of this.opponents.active) {
      if (r.dead) continue;
      for (const w of walls) {
        if (w.owner === r) continue;
        const arr = w.samples;
        let hit = false;
        for (let i = 0; i < arr.length - 4; i++) {
          const sp = arr[i].pos || arr[i].position || arr[i];
          if (sp.distanceToSquared(r.position) < HIT_R2) { hit = true; break; }
        }
        if (hit) {
          r.health = 0;
          r.dead = true;
          this.weaponSystem.spawnExplosion(r.position.clone(), r.spec.color, 1.3);
          this.onEnemyKilled(r, 'ram');
          break;
        }
      }
    }

    // player vs rival walls
    if (this.vehicle.invulnTimer <= 0) {
      for (const w of walls) {
        const arr = w.samples;
        for (let i = 0; i < arr.length - 3; i++) {
          const sp = arr[i].pos || arr[i].position || arr[i];
          if (sp.distanceToSquared(this.vehicle.position) < HIT_R2) {
            this.applyPlayerDamage(999, sp.clone(), 'ribbon');
            return;
          }
        }
      }
    }
  }

  // ==================================================================
  //  WAVE CONTROL
  // ==================================================================
  updateWaves(delta) {
    if (this.scenario.id === 'FREE') return;

    if (this.scenario.id === 'ARENA') {
      this.elapsed += delta;
      this.gameStats.wave = 1 + Math.floor(this.elapsed / 35);
      this.enemySpawner.waveScale = this.gameStats.wave;
      if (this.opponents) this.opponents.pollEndless(delta, this.gameStats.wave, this.vehicle);
      this.checkRibbonLethality();
      return;
    }

    if (this.scenario.id === 'CHASE') {
      this.elapsed += delta;
      this.gameStats.wave = 1 + Math.floor(this.elapsed / 30);
      this.enemySpawner.waveScale = this.gameStats.wave;
      this.enemySpawner.spawnEndless(delta, this.vehicle, this.elapsed);
      if (this.opponents) this.opponents.pollEndless(delta, this.gameStats.wave, this.vehicle);
      return;
    }

    // SURVIVAL
    if (this.waveState === 'intermission') {
      this.intermissionTimer -= delta;
      if (this.intermissionTimer <= 0) {
        this.waveState = 'active';
        this.enemySpawner.spawnWave(this.gameStats.wave, this.vehicle);
        if (this.opponents) this.opponents.spawnForWave(this.gameStats.wave, this.vehicle);
        this.hud.showWaveBanner(`WAVE ${String(this.gameStats.wave).padStart(2, '0')}`, EnemySpawner.describeWave(this.gameStats.wave));
      }
      return;
    }

    if (this.waveState === 'active' &&
        this.enemySpawner.enemies.length === 0 &&
        this.enemySpawner.queue.length === 0) {
      // Sector cleared
      this.gameStats.score += 1000;
      this.gameStats.wave++;
      this.waveState = 'intermission';
      this.intermissionTimer = 3.4;
      this.hud.showWaveBanner('SECTOR CLEARED', `+1000 PTS BONUS — WAVE ${this.gameStats.wave} INCOMING`);
      audio.playPickup();
    }
  }

  // ==================================================================
  //  CAMERA
  // ==================================================================
  updateCamera(delta) {
    const mode = this.cameraModes[this.currentCamModeIdx];
    const spec = this.vehicle.spec;
    const scale = spec.camera.scale;
    const vPos = this.vehicle.position;
    const isAir = spec.air;

    const targetCamPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    // Forward vector from the vehicle's full orientation
    const fwd = this.vehicle.getForwardDirection();

    if (mode === 'CHASE') {
      const dist = spec.camera.dist;
      const height = spec.camera.height;

      if (isAir) {
        const offset = new THREE.Vector3(0, height, dist).applyQuaternion(this.vehicle.mesh.quaternion);
        targetCamPos.copy(vPos).add(offset);
      } else {
        const fwdFlat = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.vehicle.yaw);
        targetCamPos.copy(vPos).addScaledVector(fwdFlat, dist);
        targetCamPos.y = vPos.y + height;
      }

      lookTarget.copy(vPos).addScaledVector(fwd, 11 * scale).add(new THREE.Vector3(0, 0.9 * scale, 0));
    } else if (mode === 'COCKPIT') {
      // POV rider camera — sits tight over the bars so the vehicle's nose
      // stays in frame (closer to the bike than a floating head-cam)
      targetCamPos.copy(new THREE.Vector3(0, 1.0 * scale, -0.55 * scale).applyMatrix4(this.vehicle.mesh.matrixWorld));
      lookTarget.copy(vPos).addScaledVector(fwd, 26).add(new THREE.Vector3(0, 0.75 * scale, 0));
    } else if (mode === 'ACTION') {
      targetCamPos.copy(new THREE.Vector3(2.6 * scale, 0.9 * scale, 3.2 * scale).applyMatrix4(this.vehicle.mesh.matrixWorld));
      lookTarget.copy(vPos).addScaledVector(fwd, 12);
    } else { // HOOD
      targetCamPos.copy(new THREE.Vector3(0, 0.95 * scale, -2.0 * scale).applyMatrix4(this.vehicle.mesh.matrixWorld));
      lookTarget.copy(vPos).addScaledVector(fwd, 32);
    }

    // Keep the chase camera above the grid floor
    if (targetCamPos.y < 0.6) targetCamPos.y = 0.6;

    // --- Velocity feed-forward -------------------------------------------
    // A lerped chase camera lags behind a fast craft (at 90 m/s the lag added
    // ~10 m, making the vehicle drift away on screen). Predicting the vehicle
    // position by (velocity / smoothing-rate) cancels that lag exactly, so the
    // craft keeps the intended, constant framing at full speed.
    if (!this._camPrev) {
      this._camPrev = vPos.clone();
      this._camVel = new THREE.Vector3();
    }
    const instVel = new THREE.Vector3().subVectors(vPos, this._camPrev).divideScalar(Math.max(delta, 1e-4));
    this._camPrev.copy(vPos);
    this._camVel.lerp(instVel, 0.3);

    const rate = (mode === 'COCKPIT' || mode === 'HOOD') ? 30 : (mode === 'ACTION' ? 6 : 8.5);
    targetCamPos.addScaledVector(this._camVel, 1 / rate);

    // Screen shake (recoil / impacts)
    if (this.camShake > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.camShake;
      targetCamPos.y += (Math.random() - 0.5) * this.camShake;
      targetCamPos.z += (Math.random() - 0.5) * this.camShake;
      this.camShake = Math.max(0, this.camShake - delta * 2.2);
    }

    // Frame-rate independent smoothing toward the predicted camera position
    const lerpFactor = 1 - Math.exp(-rate * delta);
    this.camera.position.lerp(targetCamPos, lerpFactor);
    this.camera.lookAt(lookTarget);

    // Dynamic FOV speed sensation
    const speedRatio = Math.min(1, Math.abs(this.vehicle.speed) / spec.maxSpeed);
    this.fovTarget = 62 + speedRatio * 7 + (this.vehicle.isBoosting ? 4 : 0) + (this.vehicle.overdriveTimer > 0 ? 5 : 0);
    if (Math.abs(this.camera.fov - this.fovTarget) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.fovTarget, delta * 3);
      this.camera.updateProjectionMatrix();
    }
  }

  // ==================================================================
  //  PERFORMANCE GOVERNOR
  // ==================================================================
  updatePerformance(delta) {
    const instFps = 1 / Math.max(delta, 0.0001);
    this.perf.fps = this.perf.fps * 0.92 + instFps * 0.08;

    this.perf.checkTimer -= delta;
    if (this.perf.checkTimer > 0) return;
    this.perf.checkTimer = 2.0;

    const fps = this.perf.fps;
    if (fps < 42 && this.perf.tier < 3) this.applyQuality(++this.perf.tier);
    else if (fps > 58 && this.perf.tier > 0) this.applyQuality(--this.perf.tier);
  }

  applyQuality(tier) {
    this.perf.tier = tier;
    if (tier === 0) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.bloomPass.enabled = true;
    } else if (tier === 1) {
      this.renderer.setPixelRatio(1.25);
      this.bloomPass.enabled = true;
    } else if (tier === 2) {
      this.renderer.setPixelRatio(1.0);
      this.bloomPass.enabled = false;
    } else {
      // Phone-class hardware: resolution below 1x and no full-screen extras
      this.renderer.setPixelRatio(0.75);
      this.bloomPass.enabled = false;
      if (this.glitchPass) this.glitchPass.enabled = false;
    }
  }

  // ==================================================================
  //  MAIN LOOP
  // ==================================================================
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(0.08, this.clock.getDelta());

    if (this.state === 'playing' || this.attract) {
      // 1. Vehicle physics & transformation
      this.vehicle.update(delta, this.inputs);

      // 2. Held-button weapon fire (cooldowns gate the rate)
      if (this.inputs.fireFront) this.fireForwardLasers();
      if (this.inputs.fireRear) this.fireRearLasers();

      // 2. Autopilot writes inputs before the vehicle reads them
      if (this.autoDrive) this.autoDrive.update(delta);

      // Transformation punch: on the first frame of a morph the camera kicks
      // and the frame corrupts — the machine breaking apart has weight.
      const tf = this.vehicle.transform;
      if (tf && tf.active && !this._morphSeen) {
        this._morphSeen = true;
        this.camShake = Math.max(this.camShake || 0, 0.6);
        if (this.glitchFX) this.glitchFX.trigger(0.32, 0.22);
      } else if (tf && !tf.active) {
        this._morphSeen = false;
      }

      // 2a. Sustained beams (Z / X) — held keys keep the lances alive
      this.updateBeams(delta);

      // 2b. Ramps (launch arcs) and solid world collisions
      this.handleRamps(delta);
      this.resolveWorldCollisions(delta);

      // 2c. DART Light Ram: bulldoze anything in the plough's path
      if (this.vehicle.hasPlough) this.applyPloughAura(delta);

      // 3. World / enemies / projectiles
      this.world.update(delta, this.vehicle.position);
      const enemyInfo = this.enemySpawner.update(delta, this.vehicle, this.weaponSystem, {
        onPlayerDamaged: (dmg, pos, kind) => this.applyPlayerDamage(dmg, pos, kind || 'contact'),
        onEnemyKilled: (enemy, killType) => this.onEnemyKilled(enemy, killType)
      });

      this.weaponSystem.update(
        delta,
        this.enemySpawner.enemies,
        this.vehicle,
        (killedEnemy, isRearLaser) => this.onEnemyKilled(killedEnemy, isRearLaser),
        (damage) => this.applyPlayerDamage(damage, null)
      );

      // 3b. Rival roster + HUD panel
      if (this.opponents) this.opponents.update(delta, this.vehicle);

      // Story campaign: mission objectives tick while the run is live
      if (this.campaign) this.campaign.update(delta);

      // Containment field: the rideable world grows checkpoint by checkpoint
      if (this.playZone) {
        const z = this.playZone;
        const p = this.vehicle.position;
        const bx = p.x, bz = p.z;
        p.x = Math.min(z.maxX - 10, Math.max(z.minX + 10, p.x));
        p.z = Math.min(z.maxZ - 10, Math.max(z.minZ + 10, p.z));
        if ((Math.abs(p.x - bx) > 0.05 || Math.abs(p.z - bz) > 0.05) &&
            performance.now() - (this._wallAt || 0) > 2600) {
          this._wallAt = performance.now();
          this.hud.showAlert('⛔ CONTAINMENT FIELD // SECTOR SEALED — ADVANCE THE STORY', true, 2200);
          this.camShake = Math.max(this.camShake || 0, 0.35);
        }
      }

      // Attract mode is a demonstration: it never ends and never scores.
      if (this.attract) {
        this.gameStats.score = 0;
        this.gameStats.kills = 0;
        this.gameStats.playerShield = Math.max(
          this.gameStats.playerShield, this.gameStats.maxShield * 0.75
        );
        this.vehicle.invulnTimer = Math.max(this.vehicle.invulnTimer, 0.4);
      }

      // 4. Pickups
      this.pickups.update(delta, this.vehicle, (type, amount) => {
        if (type === PICKUP_TYPES.SHIELD) {
          this.gameStats.playerShield = Math.min(this.gameStats.maxShield, this.gameStats.playerShield + amount);
          this.hud.showAlert('⛨ GRID ENERGY ABSORBED // +30% INTEGRITY', false, 1600);
        } else {
          this.vehicle.boostCapacitor = Math.min(100, this.vehicle.boostCapacitor + amount);
          this.hud.showAlert('⚡ THRUSTER CELL COLLECTED // BOOST REFILLED', false, 1600);
        }
      });

      // 4b. Damage grace decay
      if (this.contactGrace > 0) this.contactGrace -= delta;

      // 5. Combo decay
      if (this.gameStats.comboTimer > 0) {
        this.gameStats.comboTimer -= delta;
        if (this.gameStats.comboTimer <= 0) {
          this.gameStats.comboStreak = 0;
          this.gameStats.multiplier = 1;
        }
      }

      // 6. Shield regeneration
      if (this.gameStats.playerShield > 0 && this.gameStats.playerShield < this.gameStats.maxShield) {
        this.gameStats.playerShield = Math.min(
          this.gameStats.maxShield,
          this.gameStats.playerShield + delta * (this.scenario.id === 'CHASE' ? 2.2 : 3.5)
        );
      }

      // 7. Waves
      this.updateWaves(delta);

      // 8. Camera & HUD
      this.updateCamera(delta);
      this.hud.update(this.vehicle, this.gameStats, enemyInfo);

      // 8b. World region (sector) transitions + glitch FX
      const region = this.world.updateRegion(delta, this.vehicle.position);
      if (region && region.changed) {
        this.hud.showWaveBanner(region.name, region.tagline);
        if (this.glitchFX) this.glitchFX.trigger(0.85, 0.7);
        audio.playEMP();
      }
      if (this.glitchFX) this.glitchFX.update(delta);

      // 9. Performance governor
      this.updatePerformance(delta);
      this.perf.hudTimer -= delta;
      if (this.perf.hudTimer <= 0) {
        this.perf.hudTimer = 0.5;
        this.hud.setFps(Math.round(this.perf.fps));
      }
    } else if (this.state === 'paused' || this.state === 'gameover') {
      // Frozen simulation — keep rendering the last frame + hud state
      if (this.glitchFX) {
        if (this.deathGlitch > 0) {
          this.deathGlitch -= delta;
          this.glitchFX.trigger(0.75 + 0.25 * Math.random(), 0.25);
        }
        this.glitchFX.update(delta);
      }
      this.updateCamera(delta);
      if (this.hud) this.hud.update(this.vehicle, this.gameStats, { pursuerBehindDetected: false, activeCount: 0, boss: null });
    } else {
      // Menu: cinematic orbit around the idle vehicle
      if (this.glitchFX) this.glitchFX.update(delta);
      const t = this.clock.getElapsedTime();
      this.vehicle.update(delta, { forward: false, backward: false, left: false, right: false, climb: false, dive: false, boost: false });
      this.world.update(delta, this.vehicle.position);
      this.camera.position.x = Math.sin(t * 0.35) * 11;
      this.camera.position.z = Math.cos(t * 0.35) * 11;
      this.camera.position.y = 3.8;
      this.camera.lookAt(this.vehicle.position.x, this.vehicle.position.y + 1, this.vehicle.position.z);
      if (this.hud) this.hud.update(this.vehicle, this.gameStats, { pursuerBehindDetected: false, activeCount: 0, boss: null });
    }

    this.composer.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TronAresGame();
});
