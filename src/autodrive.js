import * as THREE from 'three';
import { MODE_ORDER } from './vehicle.js';

/**
 * GRID PROTOCOL — AUTODRIVE (TouchDrive-style)
 *
 * The machine flies itself: it picks a heading, follows the grid, steers around
 * structures, holds altitude and keeps the nose on the nearest hostile. The
 * player only taps — lane changes, weapons, boost. Touch the stick and the
 * pilot yields instantly, then takes over again a moment later.
 *
 * Desktop keeps it too (V = drive, B = auto-fire), which makes testing easy.
 */

const wrapAngle = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

export class AutoDrive {
  constructor(game) {
    this.game = game;
    // Phones start in TouchDrive; desktop starts MANUAL and only switches if
    // the player asks for it. (v2 key: the v1 value was written by attract
    // mode and tutorial runs, which must never decide how you play.)
    let saved = null;
    try { saved = localStorage.getItem('gp:autodrive:v2'); } catch (e) { /* ignore */ }
    this.enabled = saved === null ? !!window.__TRON_PHONE__ : saved === '1';
    this.playerPreference = this.enabled;
    this.autoFire = true;
    this.manualUntil = 0;                     // player override window
    this.headingTimer = 0;
    this.heading = null;                      // desired yaw in radians
    this.laneBias = 0;                        // -1 / +1 from lane taps
    this._firedAuto = false;
    this._steerSign = null;
    this.hoverHeight = 24;
    this.lastNudge = 0;

    // --- showcase pilot (autoplay only) ---
    this.demoIndex = 0;
    this.demoTransform = 8;
    this.demoAction = 6;
  }

  /**
   * @param on   enable the autopilot
   * @param persist  false for demonstrations: attract mode and the showcase
   *                 may drive the machine, but they must never overwrite the
   *                 player's own choice of how to play.
   */
  setEnabled(on, persist = true) {
    this.enabled = !!on;
    if (persist) {
      this.playerPreference = this.enabled;
      try { localStorage.setItem('gp:autodrive:v2', this.enabled ? '1' : '0'); } catch (e) { /* ignore */ }
    }
    if (!this.enabled) {
      // hand the controls back cleanly
      const inp = this.game.inputs;
      inp.left = inp.right = false;
      if (this._firedAuto) { inp.fireFront = false; this._firedAuto = false; }
    } else {
      this.heading = null;
    }
    return this.enabled;
  }

  setAutoFire(on) {
    this.autoFire = !!on;
    if (!this.autoFire && this._firedAuto) {
      this.game.inputs.fireFront = false;
      this._firedAuto = false;
    }
    return this.autoFire;
  }

  /** Lane tap from the touch pad: swing the autopilot ±45°. */
  nudge(dir) {
    if (!this.enabled) return;
    const v = this.game.vehicle;
    const base = this.heading === null ? v.yaw : this.heading;
    this.heading = wrapAngle(base + dir * Math.PI * 0.25);
    this.headingTimer = 5.0;
    this.lastNudge = performance.now();
  }

  /** Called whenever the human touches steering — autopilot steps aside. */
  notifyManual(seconds = 1.1) {
    this.manualUntil = performance.now() + seconds * 1000;
  }

  get isDriving() {
    return this.enabled && this.game.state === 'playing' && performance.now() >= this.manualUntil;
  }

  update(delta) {
    const g = this.game;
    const v = g.vehicle;
    if (!v || g.state !== 'playing') return;

    // ---------------------------------------------------------- auto fire
    if (this.autoFire && g.enemySpawner) {
      const fwd = v.getForwardDirection();
      let target = null;
      let bestDist = Infinity;
      const toTarget = new THREE.Vector3();
      for (const e of g.enemySpawner.enemies) {
        if (e.dead) continue;
        toTarget.subVectors(e.position, v.position);
        const dist = toTarget.length();
        if (dist > 230 || dist < 1) continue;
        if (toTarget.normalize().dot(fwd) < 0.9) continue;     // ~25 degree cone
        if (dist < bestDist) { bestDist = dist; target = e; }
      }
      if (target) {
        g.inputs.fireFront = true;
        this._firedAuto = true;
      } else if (this._firedAuto) {
        g.inputs.fireFront = false;
        this._firedAuto = false;
      }
    } else if (this._firedAuto) {
      g.inputs.fireFront = false;
      this._firedAuto = false;
    }

    // ---------------------------------------------------------- showcase
    // Autonomous play is a demo: the machine must survive long enough to be
    // worth watching, and it must actually show off every configuration.
    if (g.autoplay) {
      this.demoTransform -= delta;
      if (this.demoTransform <= 0 && MODE_ORDER && MODE_ORDER.length) {
        this.demoTransform = 9 + Math.random() * 4;
        this.demoIndex = (this.demoIndex + 1) % MODE_ORDER.length;
        const want = MODE_ORDER[this.demoIndex];
        if (want && want !== v.mode) g.requestMode(want);
      }
      this.demoAction -= delta;
      if (this.demoAction <= 0) {
        this.demoAction = 7 + Math.random() * 5;
        if (g.fireSpecial) g.fireSpecial();
        g.inputs.boost = true;
        setTimeout(() => { g.inputs.boost = false; }, 1400);
      }
      // keep the demo alive — a showcase that derezzes every ten seconds
      // shows nothing
      if (g.gameStats) {
        g.gameStats.playerShield = Math.max(g.gameStats.playerShield, g.gameStats.maxShield * 0.72);
      }
      v.invulnTimer = Math.max(v.invulnTimer, 0.5);
    }

    if (!this.isDriving) return;

    const inp = g.inputs;
    const spec = v.spec;

    // ---------------------------------------------------------- heading
    this.headingTimer -= delta;
    const world = g.world;
    const bounds = 1450;

    // steer back inside the grid before anything else
    const edge = Math.max(Math.abs(v.position.x), Math.abs(v.position.z));
    if (edge > bounds || this.headingTimer <= 0 || this.heading === null) {
      if (this.heading === null || edge > bounds) {
        // aim for the map centre with a little scatter so it is not a straight line
        const toCentre = Math.atan2(-v.position.x, -v.position.z);
        this.heading = wrapAngle(toCentre + (Math.random() - 0.5) * 0.6);
      } else {
        this.heading = wrapAngle(this.heading + (Math.random() < 0.5 ? -1 : 1) * Math.PI * 0.25);
      }
      this.headingTimer = 4 + Math.random() * 4;
    }

    let desired = this.heading;

    // ---------------------------------------------------------- structure avoidance
    if (world && world.queryColliders) {
      const probeDist = spec.air ? 26 : 20;
      const ahead = v.position.clone().add(new THREE.Vector3(
        Math.sin(desired) * probeDist, 0, Math.cos(desired) * probeDist
      ));
      const hits = world.queryColliders(ahead.x, ahead.z, spec.air ? 16 : 12) || [];
      for (const c of hits) {
        if (v.position.y > c.maxY + 4) continue;          // clear overhead
        const cx = (c.minX + c.maxX) / 2;
        const cz = (c.minZ + c.maxZ) / 2;
        const away = new THREE.Vector3(v.position.x - cx, 0, v.position.z - cz);
        if (away.lengthSq() < 1e-4) away.set(Math.cos(desired), 0, -Math.sin(desired));
        away.normalize();
        // partial turn toward the escape vector, enough to slide past the face
        const escapeYaw = Math.atan2(away.x, away.z);
        const blend = wrapAngle(escapeYaw - desired);
        desired = wrapAngle(desired + THREE.MathUtils.clamp(blend, -0.9, 0.9));
      }
    }

    // ---------------------------------------------------------- steering
    const err = wrapAngle(desired - v.yaw);
    const turn = 0.06;
    inp.left = err > turn;
    inp.right = err < -turn;

    // ---------------------------------------------------------- throttle
    inp.forward = true;
    inp.backward = false;

    // ---------------------------------------------------------- altitude (air only)
    if (spec.air) {
      const goal = THREE.MathUtils.clamp(v.altitude === undefined ? this.hoverHeight : this.hoverHeight, 10, 70);
      const dy = goal - v.position.y;
      inp.climb = dy > 3;
      inp.dive = dy < -3;
    } else {
      inp.climb = false;
      inp.dive = false;
    }
  }
}
