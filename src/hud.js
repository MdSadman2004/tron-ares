import * as THREE from 'three';
import { VEHICLE_MODES, VEHICLE_SPECS, MODE_ORDER } from './vehicle.js';
import { audio } from './audio.js';

/**
 * TRON: ARES — TACTICAL HUD
 * Full cockpit: mode selector, weapon loadout, wave banners, combo meter,
 * boss integrity bar, damage vignette, rear tactical camera and pause overlay.
 */
export class TronHUD {
  constructor(scene, mainRenderer) {
    this.scene = scene;
    this.mainRenderer = mainRenderer;
    this.onModeSelect = null;   // wired by main
    this.bannerTimer = null;
    this.vignette = 0;
    this.lastModeUI = null;
    this.alertTimer = null;

    const $ = (id) => document.getElementById(id);
    this.el = {
      killCount: $('kill-count'),
      waveNumber: $('wave-number'),
      scoreDisplay: $('score-display'),
      comboValue: $('combo-value'),
      comboPill: $('combo-pill'),
      speedDigits: $('speed-digits'),
      altDigits: $('alt-digits'),
      shieldBar: $('shield-bar-fill'),
      shieldValText: $('shield-val-text'),
      boostBar: $('boost-bar-fill'),
      boostValText: $('boost-val-text'),
      frontName: $('front-name'),
      frontBar: $('front-laser-bar'),
      rearName: $('rear-name'),
      rearBar: $('rear-laser-bar'),
      specialName: $('special-name'),
      specialKey: $('special-key'),
      specialBar: $('special-bar'),
      specialNote: $('special-note'),
      beamBar: $('beam-charge-bar'),
      beamBar2: $('beam-charge-bar-2'),
      alertText: $('alert-text'),
      rearThreatWarning: $('rear-threat-warning'),
      artificialHorizon: $('artificial-horizon'),
      camStatus: $('cam-status'),
      audioStatus: $('audio-status'),
      activeVehicleName: $('active-vehicle-name'),
      vehicleRoleText: $('vehicle-role-text'),
      vstatSpd: $('vstat-spd'),
      vstatAgi: $('vstat-agi'),
      vstatArm: $('vstat-arm'),
      waveBanner: $('wave-banner'),
      waveBannerTitle: $('wave-banner-title'),
      waveBannerSub: $('wave-banner-sub'),
      damageVignette: $('damage-vignette'),
      bossBar: $('boss-bar'),
      bossName: $('boss-name'),
      bossFill: $('boss-fill'),
      fpsCounter: $('fps-counter'),
      modeCards: Array.from(document.querySelectorAll('.mode-card'))
    };

    this.initRearCamera();
    this.initUIButtons();
  }

  // ------------------------------------------------------------------
  initRearCamera() {
    this.rearCanvas = document.getElementById('rear-canvas');
    if (!this.rearCanvas) return;

    this.rearRenderer = new THREE.WebGLRenderer({
      canvas: this.rearCanvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.rearRenderer.setSize(280, 120);
    this.rearRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.rearCamera = new THREE.PerspectiveCamera(70, 280 / 120, 0.5, 380);
  }

  initUIButtons() {
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        audio.init();
        audio.resume();
        const unmuted = audio.toggleMute();
        if (this.el.audioStatus) this.el.audioStatus.textContent = unmuted ? 'ON' : 'OFF';
      });
    }

    const btnHelp = document.getElementById('btn-help-toggle');
    const modalScreen = document.getElementById('modal-screen');
    if (btnHelp && modalScreen) {
      btnHelp.addEventListener('click', () => {
        modalScreen.classList.toggle('hidden');
      });
    }

    // Mode selector cards
    for (const card of this.el.modeCards) {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        if (this.onModeSelect && mode) this.onModeSelect(mode);
      });
    }
  }

  // ------------------------------------------------------------------
  renderRearView(vehicle) {
    if (!this.rearRenderer || !this.rearCamera) return;

    // The rear mirror is a small 280x120 viewport — rendering it every third
    // frame halves the scene's draw load with no visible difference.
    this.rearFrame = ((this.rearFrame || 0) + 1) % 3;
    if (this.rearFrame !== 0) return;

    const scale = vehicle.spec && vehicle.spec.camera ? Math.max(1, vehicle.spec.camera.scale) : 1;
    const camOffset = new THREE.Vector3(0, 1.3 * scale, 2.0 * scale).applyMatrix4(vehicle.mesh.matrixWorld);
    this.rearCamera.position.copy(camOffset);

    const target = new THREE.Vector3(0, 1.1 * scale, 60 * scale).applyMatrix4(vehicle.mesh.matrixWorld);
    this.rearCamera.lookAt(target);

    this.rearRenderer.render(this.scene, this.rearCamera);
  }

  // ------------------------------------------------------------------
  update(player, gameStats, enemyInfo) {
    const el = this.el;
    const spec = player.spec;

    // --- Top stats
    if (el.killCount) el.killCount.textContent = String(gameStats.kills).padStart(2, '0');
    if (el.waveNumber) el.waveNumber.textContent = String(gameStats.wave).padStart(2, '0');
    if (el.scoreDisplay) el.scoreDisplay.textContent = String(gameStats.score).padStart(6, '0');

    // --- Combo
    if (el.comboValue) {
      el.comboValue.textContent = `×${gameStats.multiplier || 1}`;
    }
    if (el.comboPill) {
      if ((gameStats.comboStreak || 0) >= 2) {
        el.comboPill.classList.add('combo-hot');
        if (el.comboValue) el.comboValue.textContent = `×${gameStats.multiplier} ⚡${gameStats.comboStreak}`;
      } else {
        el.comboPill.classList.remove('combo-hot');
      }
    }

    // --- Speed & altitude
    if (el.speedDigits) el.speedDigits.textContent = String(player.getSpeedKmh()).padStart(3, '0');
    if (el.altDigits) el.altDigits.textContent = String(Math.round(player.altitude)).padStart(3, '0');

    // --- Shield / boost
    if (el.shieldBar) {
      const shieldPct = Math.max(0, Math.min(100, gameStats.playerShield));
      el.shieldBar.style.width = `${shieldPct}%`;
      if (el.shieldValText) el.shieldValText.textContent = `${Math.round(shieldPct)}%`;
      el.shieldBar.classList.toggle('low', shieldPct < 30);
    }
    if (el.boostBar) {
      el.boostBar.style.width = `${Math.max(0, player.boostCapacitor)}%`;
      if (el.boostValText) {
        el.boostValText.textContent = player.overdriveTimer > 0
          ? 'OVERDRIVE'
          : (player.boostCapacitor > 20 ? 'READY' : 'RECHARGING');
      }
    }

    // --- Weapon panel (per vehicle spec)
    const weapons = spec.weapons;
    if (el.frontName) el.frontName.textContent = weapons.front.name;
    if (el.frontBar) el.frontBar.style.width = `${player.frontCooldownPct * 100}%`;
    if (el.rearName) el.rearName.textContent = weapons.rear.name;
    if (el.rearBar) el.rearBar.style.width = `${player.rearCooldownPct * 100}%`;
    if (el.specialName) el.specialName.textContent = weapons.special.name;
    if (el.specialKey) el.specialKey.textContent = `[${weapons.special.key}]`;
    if (el.specialBar) {
      const pct = player.specialCooldownPct * 100;
      el.specialBar.style.width = `${pct}%`;
      el.specialBar.classList.toggle('ready', pct >= 100);
    }
    if (el.specialNote) el.specialNote.textContent = this.specialNoteFor(spec.id);

    // beam capacitor readouts (both slots share the capacitor)
    const charge = Math.max(0, Math.min(100, player.beamCharge));
    if (el.beamBar) el.beamBar.style.width = `${charge}%`;
    if (el.beamBar2) el.beamBar2.style.width = `${charge}%`;
    const beamReady = charge > 10;
    if (el.beamBar) el.beamBar.classList.toggle('low', !beamReady);
    if (el.beamBar2) el.beamBar2.classList.toggle('low', !beamReady);

    // --- Mode selector (only touch DOM when the mode changes)
    const shownMode = player.transform.active ? player.transform.to : player.mode;
    if (this.lastModeUI !== shownMode) {
      this.lastModeUI = shownMode;
      for (const card of el.modeCards) {
        card.classList.toggle('active', card.dataset.mode === shownMode);
      }
      const shownSpec = VEHICLE_SPECS[shownMode];
      if (el.activeVehicleName) el.activeVehicleName.textContent = `${shownSpec.icon} ${shownSpec.name}`;
      if (el.vehicleRoleText) el.vehicleRoleText.textContent = shownSpec.desc;
      if (el.vstatSpd) el.vstatSpd.style.width = `${shownSpec.stats.spd * 100}%`;
      if (el.vstatAgi) el.vstatAgi.style.width = `${shownSpec.stats.agi * 100}%`;
      if (el.vstatArm) el.vstatArm.style.width = `${shownSpec.stats.arm * 100}%`;
      if (el.artificialHorizon) el.artificialHorizon.classList.toggle('hidden', !shownSpec.air);
    } else if (el.artificialHorizon) {
      el.artificialHorizon.classList.toggle('hidden', !VEHICLE_SPECS[shownMode].air);
    }

    // --- Rear threat warning
    if (el.rearThreatWarning) {
      if (enemyInfo && enemyInfo.pursuerBehindDetected) {
        el.rearThreatWarning.classList.add('visible');
      } else {
        el.rearThreatWarning.classList.remove('visible');
      }
    }

    // --- Boss integrity bar
    if (el.bossBar) {
      const boss = enemyInfo && enemyInfo.boss;
      if (boss) {
        el.bossBar.classList.add('visible');
        if (el.bossName) el.bossName.textContent = boss.name;
        if (el.bossFill) el.bossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
      } else {
        el.bossBar.classList.remove('visible');
      }
    }

    // --- Damage vignette decay
    if (el.damageVignette) {
      if (this.vignette > 0) {
        this.vignette = Math.max(0, this.vignette - 0.035);
        el.damageVignette.style.opacity = this.vignette.toFixed(3);
      }
    }

    // --- Rear camera feed
    this.renderRearView(player);
  }

  specialNoteFor(modeId) {
    switch (modeId) {
      case 'CYCLE': return '360° PURSUER DISRUPTION';
      case 'JET': return 'TARGET-SEEKING SALVO ×4';
      case 'HEAVY': return 'GROUND-ERASING AREA BOMBS';
      case 'VTOL': return '8-ROCKET SPREAD BARRAGE';
      case 'HYPER': return 'INVULNERABLE SPEED SURGE + SHOCKWAVE';
      default: return '';
    }
  }

  flashDamage() {
    this.vignette = Math.min(1, this.vignette + 0.55);
    const el = this.el.damageVignette;
    if (el) el.style.opacity = this.vignette.toFixed(3);
  }

  showWaveBanner(title, sub = '') {
    const { waveBanner, waveBannerTitle, waveBannerSub } = this.el;
    if (!waveBanner) return;
    if (waveBannerTitle) waveBannerTitle.textContent = title;
    if (waveBannerSub) waveBannerSub.textContent = sub;
    waveBanner.classList.remove('hidden');
    waveBanner.classList.add('show');
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      waveBanner.classList.remove('show');
      setTimeout(() => waveBanner.classList.add('hidden'), 600);
    }, 2600);
  }

  showAlert(message, isRed = false, holdMs = 0) {
    const el = this.el.alertText;
    if (!el) return;
    el.innerHTML = isRed ? `<span class="highlight-red">${message}</span>` : message;

    if (holdMs > 0) {
      if (this.alertTimer) clearTimeout(this.alertTimer);
      this.alertTimer = setTimeout(() => {
        el.innerHTML = 'PROTOCOL OVERRIDE ACTIVE // ELIMINATE MCP PURSUERS';
      }, holdMs);
    }
  }

  setFps(value) {
    if (this.el.fpsCounter) this.el.fpsCounter.textContent = `${value} FPS`;
  }

  showPause(visible) {
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.classList.toggle('hidden', !visible);
  }

  setScenarioLabel(label) {
    const el = document.getElementById('current-mode-label');
    if (el) el.textContent = label;
  }
}
