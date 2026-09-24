import * as THREE from 'three';
import { audio } from './audio.js';
import { ARES_VEHICLE_SPECS, ARES_VEHICLE_MODES, ARES_BUILDERS } from './ares-vehicles.js';

/**
 * TRON: ARES — MULTI-MODE TRANSFORMABLE VEHICLE SYSTEM
 * 5 transformable configurations, each with its own 3D model, flight/ground
 * physics profile, weapon loadout and special ability:
 *
 *   1. LIGHTCYCLE   — ground interceptor (drift, light ribbon)
 *   2. LIGHT JET    — aerial dogfighter (homing missiles)
 *   3. HEAVY JET    — heavy gunship / bomber (bombs, heavy cannons, armour)
 *   4. VTOL         — hovering gunship (minigun, rocket barrage, hover strafe)
 *   5. HYPER        — ultra-fast grid speeder (overdrive shockwave, ram damage)
 */

export const VEHICLE_MODES = {
  CYCLE: 'CYCLE',
  JET: 'JET',
  HEAVY: 'HEAVY',
  VTOL: 'VTOL',
  HYPER: 'HYPER',
  // Dillinger Grid vehicles from TRON: Ares (2025)
  JUMPJET: 'JUMPJET',
  DART: 'DART',
  SKIMMER: 'SKIMMER',
  LIGHTDRONE: 'LIGHTDRONE'
};

export const MODE_ORDER = [
  VEHICLE_MODES.CYCLE,
  VEHICLE_MODES.JET,
  VEHICLE_MODES.HEAVY,
  VEHICLE_MODES.VTOL,
  VEHICLE_MODES.HYPER,
  VEHICLE_MODES.JUMPJET,
  VEHICLE_MODES.DART,
  VEHICLE_MODES.SKIMMER,
  VEHICLE_MODES.LIGHTDRONE
];

// Vehicles introduced in the film TRON: Ares live in ares-vehicles.js
export const ARES_MODES = [
  VEHICLE_MODES.JUMPJET,
  VEHICLE_MODES.DART,
  VEHICLE_MODES.SKIMMER,
  VEHICLE_MODES.LIGHTDRONE
];

export const VEHICLE_SPECS = {
  CYCLE: {
    id: 'CYCLE',
    name: 'LIGHTCYCLE',
    icon: '🏍️',
    desc: 'GRID COMBAT & DRIFT',
    key: '1',
    air: false,
    hoverHeight: 0.5,
    minCruise: 16,
    maxSpeed: 92,
    boostBonus: 50,
    accel: 60,
    brake: 100,
    drag: 30,
    turn: 2.6,
    climbRate: 0,
    armor: 0.05,
    ramDamage: 30,
    collisionRadius: 1.9,
    camera: { dist: 6.0, height: 2.7, scale: 1.0 },
    stats: { spd: 0.55, agi: 0.85, arm: 0.45 },
    weapons: {
      front: { name: 'PULSE LASER', rate: 0.16, damage: 40, speed: 215, color: 0x00f0ff, scale: 1.0 },
      rear: { name: 'REAR PULSE LASER', rate: 0.22, damage: 40, speed: 190, color: 0xff0838 },
      special: { name: 'EMP DISCHARGE', key: 'Q', cd: 6.0, kind: 'EMP' }
    },
    muzzles: {
      front: [[-0.28, 0.45, -2.1], [0.28, 0.45, -2.1]],
      rear: [[-0.25, 0.65, 2.25], [0.25, 0.65, 2.25]]
    }
  },

  JET: {
    id: 'JET',
    name: 'LIGHT JET',
    icon: '✈️',
    desc: 'AERIAL DOGFIGHT',
    key: '2',
    air: true,
    hoverHeight: 0.5,
    minCruise: 0,
    maxSpeed: 142,
    boostBonus: 58,
    accel: 50,
    brake: 70,
    drag: 15,
    turn: 1.8,
    climbRate: 44,
    armor: 0.08,
    ramDamage: 22,
    collisionRadius: 2.6,
    camera: { dist: 11.8, height: 4.5, scale: 1.25 },
    stats: { spd: 0.75, agi: 0.65, arm: 0.45 },
    weapons: {
      front: { name: 'TWIN PLASMA', rate: 0.14, damage: 45, speed: 225, color: 0x00f0ff, scale: 1.0 },
      rear: { name: 'REAR PULSE LASER', rate: 0.22, damage: 40, speed: 190, color: 0xff0838 },
      special: { name: 'HOMING MISSILES', key: 'Q', cd: 7.0, kind: 'MISSILES', count: 4, damage: 70, aoe: 14, speed: 125 }
    },
    muzzles: {
      front: [[-0.75, 0.05, -2.3], [0.75, 0.05, -2.3]],
      rear: [[-0.32, 0.35, 2.6], [0.32, 0.35, 2.6]],
      racks: [[-1.15, -0.05, 0.4], [1.15, -0.05, 0.4]]
    }
  },

  HEAVY: {
    id: 'HEAVY',
    name: 'HEAVY JET',
    icon: '🛩️',
    desc: 'BOMBER // GUNSHIP',
    key: '3',
    air: true,
    hoverHeight: 0.5,
    minCruise: 0,
    maxSpeed: 108,
    boostBonus: 40,
    accel: 36,
    brake: 55,
    drag: 12,
    turn: 1.15,
    climbRate: 30,
    armor: 0.30,
    ramDamage: 40,
    collisionRadius: 3.6,
    camera: { dist: 16.5, height: 6.2, scale: 1.9 },
    stats: { spd: 0.5, agi: 0.35, arm: 0.92 },
    weapons: {
      front: { name: 'HEAVY CANNON', rate: 0.5, damage: 95, speed: 165, color: 0xffaa00, scale: 2.0 },
      rear: { name: 'REAR HEAVY CANNON', rate: 0.5, damage: 70, speed: 160, color: 0xff0838, scale: 1.7 },
      special: { name: 'GRID BOMB SALVO', key: 'Q', cd: 8.0, kind: 'BOMBS', count: 3, damage: 130, aoe: 30, speed: 46 }
    },
    muzzles: {
      front: [[-0.55, 0.15, -3.0], [0.55, 0.15, -3.0]],
      rear: [[-0.5, 0.5, 3.1], [0.5, 0.5, 3.1]],
      bay: [[0, -0.55, 0.6], [0, -0.55, 0.0], [0, -0.55, -0.6]]
    }
  },

  VTOL: {
    id: 'VTOL',
    name: 'VTOL GUNSHIP',
    icon: '🚁',
    desc: 'HOVER // STRAFE',
    key: '4',
    air: true,
    hover: true,
    hoverHeight: 0.5,
    minCruise: 0,
    maxSpeed: 80,
    boostBonus: 36,
    accel: 58,
    brake: 95,
    drag: 40,
    turn: 2.2,
    climbRate: 36,
    armor: 0.20,
    ramDamage: 26,
    collisionRadius: 2.9,
    camera: { dist: 12.6, height: 5.0, scale: 1.4 },
    stats: { spd: 0.45, agi: 0.9, arm: 0.6 },
    weapons: {
      front: { name: 'GRID MINIGUN', rate: 0.075, damage: 17, speed: 250, color: 0x00f0ff, scale: 0.7 },
      rear: { name: 'REAR PULSE LASER', rate: 0.22, damage: 38, speed: 190, color: 0xff0838 },
      special: { name: 'ROCKET BARRAGE', key: 'Q', cd: 6.5, kind: 'BARRAGE', count: 8, damage: 45, aoe: 11, speed: 105 }
    },
    muzzles: {
      front: [[-0.4, -0.25, -1.9]],
      rear: [[-0.3, 0.35, 1.9], [0.3, 0.35, 1.9]],
      pods: [[-1.5, -0.2, 0.5], [1.5, -0.2, 0.5]]
    }
  },

  HYPER: {
    id: 'HYPER',
    name: 'HYPER SPEEDER',
    icon: '⚡',
    desc: 'ULTRA-FAST INTERCEPT',
    key: '5',
    air: false,
    hoverHeight: 0.9,
    minCruise: 24,
    maxSpeed: 195,
    boostBonus: 72,
    accel: 88,
    brake: 125,
    drag: 26,
    turn: 1.5,
    climbRate: 0,
    armor: 0.12,
    ramDamage: 65,
    collisionRadius: 2.2,
    camera: { dist: 9.2, height: 3.5, scale: 1.1 },
    stats: { spd: 1.0, agi: 0.55, arm: 0.4 },
    weapons: {
      front: { name: 'ION MINIGUN', rate: 0.08, damage: 21, speed: 265, color: 0x00f0ff, scale: 0.75 },
      rear: { name: 'REAR ION LASER', rate: 0.2, damage: 45, speed: 200, color: 0xff0838 },
      special: { name: 'OVERDRIVE SHOCKWAVE', key: 'Q', cd: 10.0, kind: 'OVERDRIVE', duration: 4.5, damage: 120, radius: 48 }
    },
    muzzles: {
      front: [[-0.42, 0.32, -2.0], [0.42, 0.32, -2.0]],
      rear: [[-0.28, 0.5, 2.3], [0.28, 0.5, 2.3]]
    }
  },

  // ---- TRON: Ares (2025) Dillinger Grid vehicles ----
  ...ARES_VEHICLE_SPECS
};

/**
 * Light ribbon trail (the signature Tron light-wall ribbon) used by
 * ground vehicles. Additive-blended, fades with age.
 */
class LightRibbon {
  constructor(scene, color = 0xff0838, segments = 56, width = 0.6) {
    this.segments = segments;
    this.width = width;
    this.samples = [];

    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(segments * 2 * 3);
    this.colors = new Float32Array(segments * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const idx = [];
    for (let i = 0; i < segments - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      idx.push(a, b, c, b, d, c);
    }
    geo.setIndex(idx);

    this.mat = new THREE.MeshBasicMaterial({
      color,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 5;
    scene.add(this.mesh);
  }

  reset() {
    this.samples.length = 0;
    this.mesh.visible = false;
  }

  update(position, forward, active) {
    if (!active) {
      // Drain the tail for a graceful fade-out
      if (this.samples.length > 0) this.samples.shift();
      if (this.samples.length === 0) {
        this.mesh.visible = false;
        return;
      }
    } else {
      const fwd = forward.clone().normalize();
      const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), fwd).normalize();
      const last = this.samples[this.samples.length - 1];
      // Sample at ~1.4 m spacing so ribbon length is speed-independent
      if (!last || last.pos.distanceToSquared(position) > 1.96) {
        this.samples.push({ pos: position.clone(), side });
      }
      while (this.samples.length > this.segments) this.samples.shift();
      if (!last && this.samples.length < 2) {
        this.mesh.visible = false;
        return;
      }
    }

    const n = this.samples.length;
    if (n < 2) {
      this.mesh.visible = false;
      return;
    }

    const posArr = this.positions;
    const colArr = this.colors;
    for (let k = 0; k < this.segments; k++) {
      const s = this.samples[Math.min(k, n - 1)];
      const fade = (k + 1) / this.segments;
      const halfW = this.width * 0.5 * (0.55 + fade * 0.45);
      const iL = k * 6;
      posArr[iL] = s.pos.x + s.side.x * halfW;
      posArr[iL + 1] = s.pos.y + s.side.y * halfW;
      posArr[iL + 2] = s.pos.z + s.side.z * halfW;
      posArr[iL + 3] = s.pos.x - s.side.x * halfW;
      posArr[iL + 4] = s.pos.y - s.side.y * halfW;
      posArr[iL + 5] = s.pos.z - s.side.z * halfW;

      const intensity = fade * fade;
      colArr[iL] = intensity; colArr[iL + 1] = intensity * 0.08; colArr[iL + 2] = intensity * 0.3;
      colArr[iL + 3] = intensity; colArr[iL + 4] = intensity * 0.08; colArr[iL + 5] = intensity * 0.3;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
    this.mesh.visible = true;
  }
}

export class AresVehicle {
  constructor(scene) {
    this.scene = scene;
    this.mode = VEHICLE_MODES.CYCLE;

    // Movement & Physics
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.speed = 25;
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.altitude = 0.5;
    this.maxAltitude = 330;

    // Boost & Energy
    this.boostCapacitor = 100;
    this.isBoosting = false;

    // Weapon cooldowns
    this.frontCooldown = 0;
    this.rearCooldown = 0;
    this.specialCooldown = 0;

    // Defensive / special states
    this.invulnTimer = 1.2;     // brief spawn protection
    this.overdriveTimer = 0;
    this.ramCooldown = 0;
    this.ploughTimer = 0;       // DART Light Ram
    this.submergeTimer = 0;     // SKIMMER submersible mode
    this.cloakTimer = 0;        // LIGHT DRONE phase cloak

    // Ramp jump physics
    this.jumpVy = 0;
    this.airborne = false;
    this.landingFlash = 0;

    // Transformation state machine
    this.transform = { active: false, t: 0, dur: 0.62, from: null, to: null };
    this.oldMode = this.mode;

    // Visual engine state
    this.leanAngle = 0;
    this.nozzleTemp = 0;

    // Shared materials
    this.mats = {
      carbon: new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.35, metalness: 0.6 }),
      armor: new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 0.28, metalness: 0.55 }),
      plate: new THREE.MeshStandardMaterial({ color: 0x1d2129, roughness: 0.40, metalness: 0.5 }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x22050b, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85
      }),
      neonRed: new THREE.MeshBasicMaterial({ color: 0xff0838 }),
      neonCyan: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      neonAmber: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
      neonGreen: new THREE.MeshBasicMaterial({ color: 0x39ff88 })
    };

    // Root mesh + per-mode models
    this.mesh = new THREE.Group();
    this.mesh.rotation.order = 'YXZ';
    this.models = {};
    this.buildAllModels();
    this.scene.add(this.mesh);

    // Transformation FX ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.07, 8, 40);
    ringGeo.rotateX(Math.PI / 2);
    this.fxRingMat = new THREE.MeshBasicMaterial({
      color: 0xff0838, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.fxRing = new THREE.Mesh(ringGeo, this.fxRingMat);
    this.fxRing.visible = false;
    this.mesh.add(this.fxRing);

    // Ground light-ribbon trail
    this.ribbon = new LightRibbon(scene, 0xff0838, 56, 0.62);

    // Soft chase-fill light: lifts the hull detail out of the black grid so
    // the craft's design reads clearly in the third-person view.
    this.fillLight = new THREE.PointLight(0xffd9c9, 2.2, 50, 1.6);
    this.fillLight.position.set(0, 4.2, 4.5); // above + behind (chase-camera side)
    this.mesh.add(this.fillLight);

    // Phase-cloak halo (LIGHT DRONE special) — shown while cloaked
    this.phaseHaloMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.phaseHalo = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), this.phaseHaloMat);
    this.phaseHalo.visible = false;
    this.mesh.add(this.phaseHalo);

    // Submersible shield bubble (SKIMMER special) — shown while submerged
    this.shieldBubbleMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.shieldBubble = new THREE.Mesh(new THREE.SphereGeometry(3.4, 18, 12), this.shieldBubbleMat);
    this.shieldBubble.visible = false;
    this.mesh.add(this.shieldBubble);

    this.applyModeVisibility();
  }

  // ------------------------------------------------------------------
  //  MODEL REGISTRY
  // ------------------------------------------------------------------
  _registerModel(mode, group, parts) {
    group.visible = false;
    this.mesh.add(group);

    // Every chassis carries a pair of articulated manipulator arms that fold
    // in and snap out during a transformation (Transformer-style staging).
    const ARM_MOUNTS = {
      CYCLE: [0.62, 0.72, 0.30],
      JET: [0.92, 0.12, 0.30],
      HEAVY: [1.40, 0.30, 0.55],
      VTOL: [1.00, 0.42, 0.20],
      HYPER: [1.20, 0.42, -0.15],
      JUMPJET: [0.85, 0.10, 0.25],
      DART: [1.85, 0.95, 0.60],
      SKIMMER: [1.05, 0.70, 0.35],
      LIGHTDRONE: [0.95, 0.15, 0.15]
    };
    const mount = ARM_MOUNTS[mode] || [1.0, 0.4, 0.3];
    parts.arms = [];
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * mount[0], mount[1], mount[2]);

      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.20, 0.20), this.mats.plate);
      upper.position.x = side * 0.26;
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.x = side * 0.52;
      shoulder.add(elbow);

      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.15, 0.15), this.mats.carbon);
      forearm.position.x = side * 0.34;
      elbow.add(forearm);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), this.mats.neonRed);
      edge.position.set(side * 0.36, 0.11, 0);
      elbow.add(edge);

      const emitter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), this.mats.neonCyan);
      emitter.position.x = side * 0.70;
      elbow.add(emitter);

      group.add(shoulder);
      parts.arms.push({ shoulder, elbow, side, restZ: 0, restElbow: 0 });
    }

    this.models[mode] = { group, parts };
    return this.models[mode];
  }

  /** Staged deploy/retract of the manipulator arms during a transformation. */
  animateArms(progress, delta) {
    const model = this.activeModel;
    if (!model || !model.parts || !model.parts.arms) return;
    for (let i = 0; i < model.parts.arms.length; i++) {
      const arm = model.parts.arms[i];
      // stagger each arm slightly for a mechanical, sequenced feel
      const local = THREE.MathUtils.clamp((progress - i * 0.07) / (1 - i * 0.07), 0, 1);
      // fold in at mid-transition, snap out at the end (double action)
      const fold = Math.sin(local * Math.PI);
      const deploy = 1 - fold * 0.95;

      const shoulderTarget = arm.side * (-1.35 + deploy * 1.15);   // tucked → out
      const elbowTarget = arm.side * (1.25 - deploy * 0.85);       // folded → extended
      arm.shoulder.rotation.z = THREE.MathUtils.lerp(arm.shoulder.rotation.z, shoulderTarget, delta * 14);
      arm.elbow.rotation.z = THREE.MathUtils.lerp(arm.elbow.rotation.z, elbowTarget, delta * 14);
      arm.shoulder.rotation.y = THREE.MathUtils.lerp(arm.shoulder.rotation.y, -arm.side * 0.35 * deploy, delta * 12);
    }
  }

  get spec() {
    return VEHICLE_SPECS[this.mode];
  }

  get activeModel() {
    return this.models[this.mode];
  }

  buildAllModels() {
    this.buildCycleModel();
    this.buildJetModel();
    this.buildHeavyJetModel();
    this.buildVtolModel();
    this.buildHyperModel();

    // Dillinger Grid vehicles (TRON: Ares)
    for (const mode of ARES_MODES) {
      const built = ARES_BUILDERS[mode](this);
      this._registerModel(mode, built.group, built.parts);
    }
  }

  get isSubmerged() {
    return this.submergeTimer > 0;
  }

  get isCloaked() {
    return this.cloakTimer > 0;
  }

  get hasPlough() {
    return this.ploughTimer > 0;
  }

  applyModeVisibility() {
    for (const key of MODE_ORDER) {
      const m = this.models[key];
      if (!m) continue;
      m.group.visible = (key === this.mode);
      m.group.scale.setScalar(key === this.mode ? 1 : 0.001);
    }
  }

  // ------------------------------------------------------------------
  //  SHARED PART BUILDERS
  // ------------------------------------------------------------------
  createTronWheel(radius = 0.44, rimMat = null, neonMat = null) {
    const group = new THREE.Group();
    rimMat = rimMat || new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.35, metalness: 0.8 });
    neonMat = neonMat || this.mats.neonRed;

    const rimGeo = new THREE.TorusGeometry(radius, radius * 0.32, 12, 32);
    rimGeo.rotateY(Math.PI / 2);
    group.add(new THREE.Mesh(rimGeo, rimMat));

    const neonRingGeo = new THREE.TorusGeometry(radius * 0.95, radius * 0.08, 8, 32);
    neonRingGeo.rotateY(Math.PI / 2);
    group.add(new THREE.Mesh(neonRingGeo, neonMat));

    const spokeGroup = new THREE.Group();
    const spokeLen = radius * 1.7;
    for (let i = 0; i < 4; i++) {
      const spokeGeo = new THREE.BoxGeometry(radius * 0.09, spokeLen, radius * 0.09);
      spokeGeo.rotateX((i * Math.PI) / 4);
      spokeGroup.add(new THREE.Mesh(spokeGeo, neonMat));
    }
    group.add(spokeGroup);
    group.userData.spokes = spokeGroup;
    return group;
  }

  createRider() {
    const rider = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x08090e, roughness: 0.3, metalness: 0.8 });

    const helmetGeo = new THREE.SphereGeometry(0.22, 16, 16);
    helmetGeo.scale(0.85, 1.1, 1.2);
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.set(0, 0.52, -0.15);
    rider.add(helmet);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.18), this.mats.neonRed);
    visor.position.set(0, 0.52, -0.3);
    rider.add(visor);

    const torsoGeo = new THREE.BoxGeometry(0.48, 0.55, 0.7);
    torsoGeo.rotateX(-0.55);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 0.2, 0.15);
    rider.add(torso);

    const discGeo = new THREE.TorusGeometry(0.14, 0.025, 8, 24);
    discGeo.rotateX(0.55);
    const disc = new THREE.Mesh(discGeo, this.mats.neonRed);
    disc.position.set(0, 0.35, 0.48);
    rider.add(disc);

    return rider;
  }

  createPlume(radius, length, mat, x, y, z) {
    const geo = new THREE.ConeGeometry(radius, length, 10);
    geo.rotateX(-Math.PI / 2); // point backwards (+Z)
    const plume = new THREE.Mesh(geo, mat);
    plume.position.set(x, y, z);
    return plume;
  }

  createNozzle(radius, length, mat, neonMat) {
    const g = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius * 1.15, length, 12);
    geo.rotateX(Math.PI / 2);
    g.add(new THREE.Mesh(geo, mat));
    const ringGeo = new THREE.TorusGeometry(radius * 1.1, radius * 0.18, 8, 20);
    const ring = new THREE.Mesh(ringGeo, neonMat);
    ring.position.z = length * 0.45;
    g.add(ring);
    return g;
  }

  createTurret(scale = 1) {
    // Dual rear-facing cannons returning { group, barrels: [l, r], flashes: [l, r] }
    const group = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 0.18 * scale, 0.45 * scale), this.mats.armor);
    group.add(housing);

    const barrelGeo = new THREE.CylinderGeometry(0.045 * scale, 0.055 * scale, 0.65 * scale, 12);
    barrelGeo.rotateX(-Math.PI / 2);

    const barrels = [];
    const flashes = [];
    const ringGeo = new THREE.TorusGeometry(0.055 * scale, 0.015 * scale, 8, 16);
    const flashGeo = new THREE.ConeGeometry(0.12 * scale, 0.5 * scale, 8);
    flashGeo.rotateX(-Math.PI / 2);

    for (const sx of [-0.25 * scale, 0.25 * scale]) {
      const barrel = new THREE.Mesh(barrelGeo, this.mats.carbon);
      barrel.position.set(sx, 0.02 * scale, 0.3 * scale);
      group.add(barrel);
      barrels.push(barrel);

      const ring = new THREE.Mesh(ringGeo, this.mats.neonRed);
      ring.position.set(sx, 0.02 * scale, 0.58 * scale);
      group.add(ring);

      const flash = new THREE.Mesh(flashGeo, this.mats.neonRed);
      flash.position.set(sx, 0.02 * scale, 0.85 * scale);
      flash.visible = false;
      group.add(flash);
      flashes.push(flash);
    }

    return { group, barrels, flashes };
  }

  createWing(span, chordA, chordB, isRight, opts = {}) {
    const wingGroup = new THREE.Group();
    const sign = isRight ? 1 : -1;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(span * sign, -chordA);
    shape.lineTo(span * 0.92 * sign, -chordB);
    shape.lineTo(0, -chordB * 0.55);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: opts.thickness || 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01
    });
    geo.rotateX(Math.PI / 2);
    wingGroup.add(new THREE.Mesh(geo, opts.material || this.mats.armor));

    // Glowing leading edge
    const edgeGeo = new THREE.CylinderGeometry(0.022, 0.022, span * 1.05, 6);
    edgeGeo.rotateZ(isRight ? -0.32 : 0.32);
    edgeGeo.rotateX(Math.PI / 2);
    const edge = new THREE.Mesh(edgeGeo, opts.neon || this.mats.neonRed);
    edge.position.set(span * 0.5 * sign, 0, -chordA * 0.4);
    wingGroup.add(edge);

    // Winglet
    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.5), opts.neon || this.mats.neonRed);
    winglet.position.set(span * 0.95 * sign, 0.18, -chordB * 0.6);
    wingGroup.add(winglet);

    return wingGroup;
  }

  // ------------------------------------------------------------------
  //  1. LIGHTCYCLE
  // ------------------------------------------------------------------
  buildCycleModel() {
    const g = new THREE.Group();
    const parts = { spokes: [], plumes: [], wings: [] };

    const hullGeo = new THREE.BoxGeometry(0.85, 0.7, 3.4);
    const hullPos = hullGeo.attributes.position;
    for (let i = 0; i < hullPos.count; i++) {
      const z = hullPos.getZ(i);
      if (z < -0.8) {
        hullPos.setX(i, hullPos.getX(i) * 0.7);
        hullPos.setY(i, hullPos.getY(i) * 0.75);
      }
      if (z > 0.8) hullPos.setX(i, hullPos.getX(i) * 0.85);
    }
    hullGeo.computeVertexNormals();
    const hull = new THREE.Mesh(hullGeo, this.mats.carbon);
    hull.position.y = 0.45;
    g.add(hull);

    const canopyGeo = new THREE.ConeGeometry(0.48, 1.6, 4);
    canopyGeo.rotateX(Math.PI / 2.3);
    const canopy = new THREE.Mesh(canopyGeo, this.mats.glass);
    canopy.position.set(0, 0.75, -0.3);
    g.add(canopy);

    const seamGeo = new THREE.TorusGeometry(0.42, 0.025, 8, 16, Math.PI);
    seamGeo.rotateX(Math.PI / 2);
    const seam = new THREE.Mesh(seamGeo, this.mats.neonRed);
    seam.position.set(0, 0.82, -0.35);
    g.add(seam);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.04, 3.2), this.mats.neonRed);
    stripe.position.set(0, 0.45, 0);
    g.add(stripe);

    const frontWheel = this.createTronWheel();
    frontWheel.position.set(0, 0.45, -1.5);
    g.add(frontWheel);
    parts.spokes.push(frontWheel.userData.spokes);

    const rearWheel = this.createTronWheel();
    rearWheel.position.set(0, 0.48, 1.45);
    g.add(rearWheel);
    parts.spokes.push(rearWheel.userData.spokes);

    const turret = this.createTurret(1);
    turret.group.position.set(0, 0.65, 1.7);
    g.add(turret.group);

    const fwdBarrelGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.45, 8);
    fwdBarrelGeo.rotateX(Math.PI / 2);
    for (const sx of [-0.28, 0.28]) {
      const barrel = new THREE.Mesh(fwdBarrelGeo, this.mats.neonRed);
      barrel.position.set(sx, 0.35, -1.8);
      g.add(barrel);
    }

    // Retracted wings (extend slightly for aero look)
    for (const isRight of [false, true]) {
      const wing = this.createWing(1.6, 0.6, 1.1, isRight);
      wing.position.set(0.3 * (isRight ? 1 : -1), 0.45, 0.1);
      wing.scale.set(0.34, 1, 0.5);
      g.add(wing);
      parts.wings.push({ mesh: wing, base: 0.34 });
    }

    // Small tail thrusters
    for (const sx of [-0.25, 0.25]) {
      const plume = this.createPlume(0.14, 0.9, this.mats.neonRed, sx, 0.45, 1.75);
      plume.scale.setScalar(0.001);
      g.add(plume);
      parts.plumes.push(plume);
    }

    const rider = this.createRider();
    rider.position.set(0, 0.55, 0.15);
    g.add(rider);

    this._registerModel(VEHICLE_MODES.CYCLE, g, parts);
  }

  // ------------------------------------------------------------------
  //  2. LIGHT JET
  // ------------------------------------------------------------------
  buildJetModel() {
    const g = new THREE.Group();
    const parts = { plumes: [], spokes: [], rotors: [] };

    // Needle fuselage
    const fuseGeo = new THREE.ConeGeometry(0.62, 4.6, 6);
    fuseGeo.rotateX(-Math.PI / 2);
    const fuse = new THREE.Mesh(fuseGeo, this.mats.carbon);
    fuse.position.z = -0.5;
    g.add(fuse);

    const bodyGeo = new THREE.BoxGeometry(1.0, 0.62, 3.2);
    const body = new THREE.Mesh(bodyGeo, this.mats.armor);
    body.position.set(0, 0, 1.1);
    g.add(body);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mats.glass);
    canopy.scale.set(1, 0.75, 1.9);
    canopy.position.set(0, 0.28, -0.5);
    g.add(canopy);

    // Spine neon
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 4.4), this.mats.neonRed);
    spine.position.set(0, 0.42, 0.4);
    g.add(spine);

    // Delta wings (large, swept)
    for (const isRight of [false, true]) {
      const wing = this.createWing(3.0, 1.0, 2.0, isRight, { thickness: 0.06 });
      wing.position.set(0.4 * (isRight ? 1 : -1), -0.05, 1.0);
      g.add(wing);
    }

    // Dorsal fins
    for (const sx of [-0.35, 0.35]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.9), this.mats.armor);
      fin.position.set(sx, 0.5, 1.9);
      fin.rotation.z = sx > 0 ? -0.25 : 0.25;
      g.add(fin);
    }

    // Twin engine nacelles + nozzles + plumes
    for (const sx of [-0.85, 0.85]) {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 3.4, 12), this.mats.plate);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(sx, -0.05, 0.9);
      g.add(nacelle);

      const nozzle = this.createNozzle(0.3, 0.4, this.mats.carbon, this.mats.neonRed);
      nozzle.position.set(sx, -0.05, 2.65);
      g.add(nozzle);

      const plume = this.createPlume(0.24, 1.6, this.mats.neonRed, sx, -0.05, 3.3);
      plume.scale.setScalar(0.001);
      g.add(plume);
      parts.plumes.push(plume);
    }

    // Forward cannons under nose
    const barrelGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.8, 10);
    barrelGeo.rotateX(Math.PI / 2);
    for (const sx of [-0.75, 0.75]) {
      const barrel = new THREE.Mesh(barrelGeo, this.mats.carbon);
      barrel.position.set(sx, -0.05, -1.9);
      g.add(barrel);
      const tip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 14), this.mats.neonCyan);
      tip.position.set(sx, -0.05, -2.28);
      g.add(tip);
    }

    // Missile racks (visible under wings)
    for (const sx of [-1.15, 1.15]) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 1.1), this.mats.plate);
      rack.position.set(sx, -0.22, 0.5);
      g.add(rack);
    }

    // Rear turret
    const turret = this.createTurret(1.15);
    turret.group.position.set(0, 0.15, 2.75);
    g.add(turret.group);

    // Cockpit pilot glow
    const pilot = this.createRider();
    pilot.scale.setScalar(0.55);
    pilot.position.set(0, -0.2, -0.35);
    g.add(pilot);

    this._registerModel(VEHICLE_MODES.JET, g, parts);
  }

  // ------------------------------------------------------------------
  //  3. HEAVY JET (bigger jet)
  // ------------------------------------------------------------------
  buildHeavyJetModel() {
    const g = new THREE.Group();
    const parts = { plumes: [], spokes: [], rotors: [] };

    // Fat armoured fuselage
    const hullGeo = new THREE.BoxGeometry(2.0, 1.15, 6.4);
    const hp = hullGeo.attributes.position;
    for (let i = 0; i < hp.count; i++) {
      const z = hp.getZ(i);
      if (z < -1.6) { hp.setX(i, hp.getX(i) * 0.62); hp.setY(i, hp.getY(i) * 0.7); }
      if (z > 2.2) { hp.setX(i, hp.getX(i) * 0.85); }
    }
    hullGeo.computeVertexNormals();
    g.add(new THREE.Mesh(hullGeo, this.mats.carbon));

    // Armour plating top & bottom
    const plateTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 4.6), this.mats.plate);
    plateTop.position.set(0, 0.62, 0.4);
    g.add(plateTop);
    const plateBot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 3.6), this.mats.plate);
    plateBot.position.set(0, -0.6, 0.5);
    g.add(plateBot);

    // Wide bubble cockpit
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mats.glass);
    canopy.scale.set(1.1, 0.7, 1.5);
    canopy.position.set(0, 0.5, -2.0);
    g.add(canopy);

    // Spine + hull rib neon
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 6.0), this.mats.neonAmber);
    spine.position.set(0, 0.72, 0.4);
    g.add(spine);
    for (const sx of [-0.9, 0.9]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 5.4), this.mats.neonRed);
      rib.position.set(sx, 0.3, 0.4);
      g.add(rib);
    }

    // Big wings
    for (const isRight of [false, true]) {
      const wing = this.createWing(4.6, 1.4, 2.8, isRight, { thickness: 0.1 });
      wing.position.set(0.9 * (isRight ? 1 : -1), -0.1, 1.6);
      g.add(wing);
      // Engine pylon under each wing
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.6), this.mats.armor);
      pylon.position.set(2.2 * (isRight ? 1 : -1), -0.4, 1.7);
      g.add(pylon);
    }

    // FOUR engines (2 per side)
    for (const sx of [-2.6, -1.35, 1.35, 2.6]) {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 3.0, 12), this.mats.plate);
      nacelle.rotation.x = Math.PI / 2;
      nacelle.position.set(sx, -0.35, 1.4);
      g.add(nacelle);

      const nozzle = this.createNozzle(0.44, 0.5, this.mats.carbon, this.mats.neonRed);
      nozzle.position.set(sx, -0.35, 2.95);
      g.add(nozzle);

      const plume = this.createPlume(0.32, 1.8, this.mats.neonRed, sx, -0.35, 3.7);
      plume.scale.setScalar(0.001);
      g.add(plume);
      parts.plumes.push(plume);
    }

    // Twin tail fins
    for (const sx of [-0.8, 0.8]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 1.4), this.mats.armor);
      fin.position.set(sx, 1.1, 2.6);
      fin.rotation.z = sx > 0 ? -0.28 : 0.28;
      g.add(fin);
      const finNeon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.45, 0.1), this.mats.neonAmber);
      finNeon.position.set(sx * 1.06, 1.1, 2.05);
      finNeon.rotation.z = sx > 0 ? -0.28 : 0.28;
      g.add(finNeon);
    }

    // Heavy forward cannons (2 chin + 2 cheek)
    const heavyBarrel = new THREE.CylinderGeometry(0.09, 0.11, 1.3, 10);
    heavyBarrel.rotateX(Math.PI / 2);
    for (const sx of [-0.55, 0.55]) {
      const b = new THREE.Mesh(heavyBarrel, this.mats.carbon);
      b.position.set(sx, -0.45, -2.9);
      g.add(b);
      const tip = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 14), this.mats.neonAmber);
      tip.position.set(sx, -0.45, -3.5);
      g.add(tip);
    }
    for (const sx of [-1.25, 1.25]) {
      const b = new THREE.Mesh(heavyBarrel, this.mats.carbon);
      b.position.set(sx, 0.1, -2.4);
      g.add(b);
    }

    // Bomb bay doors
    for (const sx of [-0.45, 0.45]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 1.8), this.mats.plate);
      door.position.set(sx, -0.7, 0.5);
      g.add(door);
      const doorNeon = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 1.6), this.mats.neonAmber);
      doorNeon.position.set(sx, -0.76, 0.5);
      g.add(doorNeon);
    }

    // Big rear turret
    const turret = this.createTurret(1.6);
    turret.group.position.set(0, 0.3, 3.3);
    g.add(turret.group);

    this._registerModel(VEHICLE_MODES.HEAVY, g, parts);
  }

  // ------------------------------------------------------------------
  //  4. VTOL GUNSHIP
  // ------------------------------------------------------------------
  buildVtolModel() {
    const g = new THREE.Group();
    const parts = { plumes: [], spokes: [], rotors: [] };

    // Central pod
    const podGeo = new THREE.BoxGeometry(1.5, 0.95, 4.0);
    const pp = podGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const z = pp.getZ(i);
      if (z < -0.9) { pp.setX(i, pp.getX(i) * 0.7); pp.setY(i, pp.getY(i) * 0.8); }
    }
    podGeo.computeVertexNormals();
    g.add(new THREE.Mesh(podGeo, this.mats.carbon));

    // Glass cockpit
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mats.glass);
    canopy.scale.set(1.15, 0.8, 1.5);
    canopy.position.set(0, 0.45, -1.5);
    g.add(canopy);

    // Neon belly
    const belly = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 3.2), this.mats.neonCyan);
    belly.position.set(0, -0.5, 0);
    g.add(belly);

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 3.4), this.mats.neonCyan);
    spine.position.set(0, 0.55, 0.2);
    g.add(spine);

    // Stub wings / arms with tilt-rotor pods
    const rotorPositions = [
      [-2.1, 0.15, -0.9], [2.1, 0.15, -0.9],
      [-2.1, 0.15, 1.1], [2.1, 0.15, 1.1]
    ];
    for (const [x, y, z] of rotorPositions) {
      // Arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x), 0.16, 0.5), this.mats.armor);
      arm.position.set(x * 0.55, y, z);
      g.add(arm);

      // Tilt pod (rotates with pitch in flight)
      const pod = new THREE.Group();
      pod.position.set(x, y, z);
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 12), this.mats.plate);
      pod.add(housing);

      const rotor = new THREE.Group();
      rotor.position.y = 0.3;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), this.mats.carbon);
      rotor.add(hub);
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.025, 0.14), this.mats.plate);
        blade.rotation.y = (b * Math.PI * 2) / 3;
        blade.position.x = Math.cos((b * Math.PI * 2) / 3) * 0.75;
        blade.position.z = -Math.sin((b * Math.PI * 2) / 3) * 0.75;
        rotor.add(blade);
      }
      rotor.add(new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.02, 6, 24), this.mats.neonCyan));
      pod.add(rotor);
      parts.rotors.push({ rotor, pod });
      g.add(pod);
    }

    // Rocket pods
    for (const sx of [-1.5, 1.5]) {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.5, 10), this.mats.armor);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(sx, -0.28, 0.6);
      g.add(pod);
      // tube ends
      for (let t = 0; t < 6; t++) {
        const ang = (t / 6) * Math.PI * 2;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 8), this.mats.neonAmber);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(sx + Math.cos(ang) * 0.14, -0.28 + Math.sin(ang) * 0.14, 1.38);
        g.add(tube);
      }
    }

    // Chin minigun
    const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 10), this.mats.carbon);
    mg.rotation.x = Math.PI / 2;
    mg.position.set(0, -0.42, -2.0);
    g.add(mg);
    const mgTip = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 14), this.mats.neonCyan);
    mgTip.position.set(0, -0.42, -2.55);
    g.add(mgTip);

    // Skids
    for (const sx of [-0.85, 0.85]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.0), this.mats.plate);
      skid.position.set(sx, -0.85, 0.2);
      g.add(skid);
      for (const sz of [-1.0, 1.1]) {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), this.mats.armor);
        strut.position.set(sx, -0.6, sz);
        g.add(strut);
      }
    }

    const turret = this.createTurret(1.2);
    turret.group.position.set(0, 0.25, 1.9);
    g.add(turret.group);

    this._registerModel(VEHICLE_MODES.VTOL, g, parts);
  }

  // ------------------------------------------------------------------
  //  5. HYPER SPEEDER (ultra-fast)
  // ------------------------------------------------------------------
  buildHyperModel() {
    const g = new THREE.Group();
    const parts = { plumes: [], spokes: [], rotors: [], underglow: null };

    // Low wide wedge body
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.55, 5.2);
    const bp = bodyGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const z = bp.getZ(i);
      if (z < -1.4) { bp.setX(i, bp.getX(i) * 0.55); bp.setY(i, bp.getY(i) * 0.7); }
      if (z > 1.6) { bp.setX(i, bp.getX(i) * 0.9); }
    }
    bodyGeo.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeo, this.mats.carbon);
    body.position.y = 0.3;
    g.add(body);

    // Forward splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.0), this.mats.plate);
    splitter.position.set(0, 0.05, -2.6);
    g.add(splitter);
    const splitterNeon = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.16), this.mats.neonRed);
    splitterNeon.position.set(0, 0.05, -3.05);
    g.add(splitterNeon);

    // Cockpit
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mats.glass);
    canopy.scale.set(1, 0.6, 1.9);
    canopy.position.set(0, 0.55, -0.7);
    g.add(canopy);

    // Speed stripes
    for (const sx of [-0.75, 0.75]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 4.6), this.mats.neonRed);
      stripe.position.set(sx, 0.6, 0.2);
      g.add(stripe);
    }

    // Forward-swept side fins
    for (const isRight of [false, true]) {
      const sign = isRight ? 1 : -1;
      const finGeo = new THREE.BoxGeometry(1.5, 0.06, 0.9);
      const fin = new THREE.Mesh(finGeo, this.mats.armor);
      fin.position.set(1.15 * sign, 0.25, -0.9);
      fin.rotation.y = 0.5 * sign;
      g.add(fin);
      const finNeon = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.12), this.mats.neonRed);
      finNeon.position.set(1.15 * sign, 0.28, -1.28);
      finNeon.rotation.y = 0.5 * sign;
      g.add(finNeon);
    }

    // Ion ring (signature detail)
    const ringGeo = new THREE.TorusGeometry(1.35, 0.05, 8, 40);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.mats.neonCyan);
    ring.position.set(0, 0.32, 0.9);
    g.add(ring);
    parts.ring = ring;

    // Triple afterburners
    for (const sx of [-0.6, 0, 0.6]) {
      const nozzle = this.createNozzle(0.33, 0.42, this.mats.carbon, this.mats.neonRed);
      nozzle.position.set(sx, 0.32, 2.7);
      g.add(nozzle);
      const plume = this.createPlume(0.26, 1.9, this.mats.neonRed, sx, 0.32, 3.4);
      plume.scale.setScalar(0.001);
      g.add(plume);
      parts.plumes.push(plume);
    }

    // Underglow strip
    const underglow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 4.4), this.mats.neonCyan);
    underglow.position.set(0, 0.02, 0);
    g.add(underglow);
    parts.underglow = underglow;

    // Forward ion cannons
    const barrelGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.7, 8);
    barrelGeo.rotateX(Math.PI / 2);
    for (const sx of [-0.42, 0.42]) {
      const barrel = new THREE.Mesh(barrelGeo, this.mats.carbon);
      barrel.position.set(sx, 0.32, -2.0);
      g.add(barrel);
    }

    const turret = this.createTurret(0.95);
    turret.group.position.set(0, 0.5, 2.2);
    g.add(turret.group);

    const rider = this.createRider();
    rider.scale.set(0.9, 0.9, 0.9);
    rider.position.set(0, 0.55, -0.25);
    g.add(rider);

    this._registerModel(VEHICLE_MODES.HYPER, g, parts);
  }

  // ------------------------------------------------------------------
  //  TRANSFORMATION
  // ------------------------------------------------------------------
  setMode(mode) {
    if (!VEHICLE_SPECS[mode] || mode === this.mode || this.transform.active) return false;
    this.transform.active = true;
    this.transform.t = 0;
    this.transform.from = this.mode;
    this.transform.to = mode;
    this.oldMode = this.mode;

    this.models[mode].group.visible = true;
    this.models[mode].group.scale.setScalar(0.02);
    this.models[this.mode].group.visible = true;

    this.fxRing.visible = true;
    this.fxRingMat.opacity = 0.95;
    this.fxRing.scale.setScalar(0.6);

    if (this.ribbon) this.ribbon.reset();

    audio.playTransform(VEHICLE_SPECS[mode].air);
    this.invulnTimer = Math.max(this.invulnTimer, 0.7);
    return true;
  }

  cycleMode(dir = 1) {
    const idx = MODE_ORDER.indexOf(this.mode);
    const next = MODE_ORDER[(idx + dir + MODE_ORDER.length) % MODE_ORDER.length];
    return this.setMode(next);
  }

  // Backwards-compatible alias (old code called toggleMode())
  toggleMode() {
    return this.cycleMode(1);
  }

  _finishTransform() {
    const t = this.transform;
    this.mode = t.to;
    t.active = false;

    this.models[t.from].group.visible = false;
    this.models[t.from].group.scale.setScalar(1);
    this.models[t.from].group.rotation.set(0, 0, 0);
    this.models[t.to].group.scale.setScalar(1);
    this.models[t.to].group.rotation.set(0, 0, 0);
    this.fxRing.visible = false;
    this.fxRingMat.opacity = 0;

    // VTOL transitions into a hover; ground modes land automatically.
    if (this.spec.air && this.altitude < 6) this.altitude = Math.max(this.altitude, 6);
  }

  // ------------------------------------------------------------------
  //  UPDATE
  // ------------------------------------------------------------------
  update(delta, input) {
    const spec = this.spec;

    // --- Cooldown timers -------------------------------------------------
    if (this.frontCooldown > 0) this.frontCooldown -= delta;
    if (this.rearCooldown > 0) this.rearCooldown -= delta;
    if (this.specialCooldown > 0) this.specialCooldown -= delta;
    if (this.invulnTimer > 0) this.invulnTimer -= delta;
    if (this.ramCooldown > 0) this.ramCooldown -= delta;
    if (this.overdriveTimer > 0) this.overdriveTimer -= delta;
    if (this.ploughTimer > 0) this.ploughTimer -= delta;
    if (this.submergeTimer > 0) this.submergeTimer -= delta;
    if (this.cloakTimer > 0) this.cloakTimer -= delta;
    if (this.landingFlash > 0) this.landingFlash -= delta;

    // --- Transformation animation ---------------------------------------
    if (this.transform.active) {
      this.transform.t = Math.min(1, this.transform.t + delta / this.transform.dur);
      const t = this.transform.t;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const from = this.models[this.transform.from].group;
      const to = this.models[this.transform.to].group;
      from.scale.setScalar(Math.max(0.02, 1 - ease));
      to.scale.setScalar(Math.max(0.02, ease));
      // arms on BOTH chassis fold inward mid-swap
      const srcParts = this.models[this.transform.from].parts;
      const dstParts = this.models[this.transform.to].parts;
      const foldAmt = Math.sin(ease * Math.PI);
      for (const set of [srcParts, dstParts]) {
        if (!set || !set.arms) continue;
        for (const arm of set.arms) {
          arm.shoulder.rotation.z = arm.side * (-0.20 - foldAmt * 1.05);
          arm.elbow.rotation.z = arm.side * (0.40 + foldAmt * 0.75);
        }
      }

      this.fxRing.scale.setScalar(0.6 + ease * 3.4);
      this.fxRingMat.opacity = 0.95 * (1 - ease);
      this.fxRing.rotation.y += delta * 6;

      // mechanical staging: arms fold through the swap and both chassis
      // counter-twist while the plates trade places
      this.animateArms(t, delta);
      const twist = Math.sin(ease * Math.PI) * 0.45;
      from.rotation.y = twist;
      to.rotation.y = -twist;
      from.rotation.z = twist * 0.4;
      to.rotation.z = -twist * 0.4;

      if (t >= 1) this._finishTransform();
    }

    // --- Boost capacitor --------------------------------------------------
    const boosting = input.boost && (this.boostCapacitor > 6 || this.overdriveTimer > 0);
    this.isBoosting = boosting;
    if (boosting && this.overdriveTimer <= 0) {
      this.boostCapacitor = Math.max(0, this.boostCapacitor - delta * 22);
    } else if (!boosting) {
      this.boostCapacitor = Math.min(100, this.boostCapacitor + delta * (this.overdriveTimer > 0 ? 45 : 14));
    }

    // --- Speed physics ------------------------------------------------------
    const maxSpeed =
      spec.maxSpeed +
      (this.isBoosting ? spec.boostBonus : 0) +
      (this.overdriveTimer > 0 ? spec.boostBonus * 0.5 : 0);

    if (input.forward) {
      this.speed = Math.min(maxSpeed, this.speed + spec.accel * (this.isBoosting ? 1.7 : 1.0) * delta);
    } else if (input.backward) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - spec.brake * delta);
      } else {
        this.speed = Math.max(-14, this.speed - spec.drag * delta);
      }
    } else {
      // Natural drag toward the mode's idle speed. Ground vehicles never fully
      // stop — a lightcycle always keeps carving through the grid (Tron rule),
      // so their floor is minCruise instead of zero.
      const drag = spec.drag * (spec.hover ? 1.6 : 0.75);
      const floor = (!spec.air && !input.backward) ? (spec.minCruise || 0) : 0;
      if (this.speed > floor) {
        this.speed = Math.max(floor, this.speed - drag * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + drag * delta);
      } else if (this.speed < floor) {
        this.speed = Math.min(floor, this.speed + 16 * delta);
      }
    }

    // --- Steering ------------------------------------------------------------
    const speedRatio = Math.max(0, Math.min(1, Math.abs(this.speed) / spec.maxSpeed));
    let turnMultiplier;
    if (spec.air) {
      turnMultiplier = 0.8 + speedRatio * 0.25;
    } else {
      turnMultiplier = Math.max(0.45, Math.min(1.2, Math.abs(this.speed) / 26));
    }
    const yawDelta = spec.turn * turnMultiplier * delta;

    let leanTarget = 0;
    if (input.left) {
      this.yaw += yawDelta;
      leanTarget = spec.air ? 0.85 : 0.55;
    } else if (input.right) {
      this.yaw -= yawDelta;
      leanTarget = spec.air ? -0.85 : -0.55;
    }
    const leanLerp = spec.air ? 3.0 : 6.0;
    this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, leanTarget, delta * leanLerp);

    // --- Altitude / flight model --------------------------------------------
    let pitchTarget = 0;
    if (this.isSubmerged) {
      // Submersible configuration: flush with the grid surface, shielded
      this.altitude = THREE.MathUtils.lerp(this.altitude, 0.35, delta * 4);
      pitchTarget = 0;
    } else if (spec.air) {
      if (input.climb) {
        this.altitude = Math.min(this.maxAltitude, this.altitude + spec.climbRate * delta);
        pitchTarget = spec.hover ? 0.18 : 0.42;
      } else if (input.dive) {
        const floor = spec.hover ? 2.2 : 5;
        this.altitude = Math.max(floor, this.altitude - spec.climbRate * delta);
        pitchTarget = spec.hover ? -0.18 : -0.42;
      } else if (this.speed > 60) {
        pitchTarget = -0.06;
      }
      // Gentle auto-lift when flying low (safe take-off assist)
      if (this.altitude < 8) {
        this.altitude = Math.min(8, this.altitude + delta * 14);
      }
    } else {
      // Ground vehicles: pinned to hover height, with ramp-jump arcs
      const target = spec.hoverHeight;
      if (this.airborne) {
        this.jumpVy -= 62 * delta;                 // grid gravity
        this.altitude += this.jumpVy * delta;
        pitchTarget = Math.max(-0.28, Math.min(0.28, -this.jumpVy * 0.008));
        if (this.altitude <= target) {
          this.altitude = target;
          this.airborne = false;
          if (this.jumpVy < -18) this.landingFlash = 0.3;   // hard landing puff
          this.jumpVy = 0;
        }
      } else if (this.altitude > target + 0.05) {
        this.altitude = Math.max(target, this.altitude - 58 * delta);
        pitchTarget = -0.22 / (1 + Math.max(0, 30 - this.altitude));
      } else {
        this.altitude = THREE.MathUtils.lerp(this.altitude, target, delta * 10);
      }
    }
    this.pitch = THREE.MathUtils.lerp(this.pitch, pitchTarget, delta * 4);
    this.roll = this.leanAngle;

    // --- Integrate position ---------------------------------------------------
    const forwardVec = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.position.x += forwardVec.x * this.speed * delta;
    this.position.z += forwardVec.z * this.speed * delta;
    this.position.y = this.altitude;

    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    this.mesh.updateMatrixWorld(true);

    // Arms breathe with the chassis (idle sway) and deploy during transforms
    const armModel = this.activeModel;
    if (armModel && armModel.parts && armModel.parts.arms) {
      const idle = Math.sin((this.clock_t || 0) * 1.4) * 0.05;
      for (const arm of armModel.parts.arms) {
        const base = arm.side * (-0.20 + idle * arm.side);
        const baseElbow = arm.side * 0.40;
        if (!this.transform.active) {
          arm.shoulder.rotation.z = THREE.MathUtils.lerp(arm.shoulder.rotation.z, base, delta * 4);
          arm.elbow.rotation.z = THREE.MathUtils.lerp(arm.elbow.rotation.z, baseElbow, delta * 4);
        }
      }
      this.clock_t = (this.clock_t || 0) + delta;
    }

    // --- Special-state visuals ---------------------------------------------------
    const model = this.activeModel;
    if (model) {
      // Phase cloak (LIGHT DRONE): the craft phases out of the grid
      if (this.isCloaked && !this.transform.active) {
        model.group.visible = false;
        this.phaseHalo.visible = true;
        this.phaseHalo.rotation.y += delta * 2.5;
        this.clock_t = (this.clock_t || 0) + delta * 6;
        this.phaseHalo.scale.setScalar(0.85 + Math.sin(this.clock_t) * 0.06);
      } else if (this.phaseHalo.visible) {
        this.phaseHalo.visible = false;
        if (!this.transform.active) model.group.visible = true;
      }
      // Submersible shield bubble (LIGHT SKIMMER)
      this.shieldBubble.visible = this.isSubmerged;
      if (this.isSubmerged) {
        this.shieldBubble.rotation.y += delta * 1.2;
        this.shieldBubbleMat.opacity = 0.16 + Math.sin((this.clock_t || 0) * 3) * 0.06;
      }
      // Light Ram plough (DART)
      const plough = model.parts && model.parts.plough;
      if (plough) plough.visible = this.hasPlough;
      // Skimmer wake
      const wake = model.parts && model.parts.wake;
      if (wake) {
        const speedRatioW = Math.min(1, Math.abs(this.speed) / spec.maxSpeed);
        wake.material.opacity = this.isSubmerged ? 0 : Math.max(0, (speedRatioW - 0.25) * 0.7);
      }
    }

    // --- Animated model parts ---------------------------------------------------
    this.animateActiveModel(delta, spec);

    // --- Light ribbon trail ------------------------------------------------------
    const ribbonActive = !spec.air && Math.abs(this.speed) > 26;
    if (this.ribbon) {
      const trailPos = this.position.clone().addScaledVector(forwardVec, 2.0);
      trailPos.y += 0.15;
      this.ribbon.update(trailPos, forwardVec.clone().negate(), ribbonActive);
    }

    // --- Engine audio --------------------------------------------------------------
    audio.updateEngine(Math.abs(this.speed) / 200, spec.air, this.isBoosting);
  }

  animateActiveModel(delta, spec) {
    const model = this.activeModel;
    if (!model) return;
    const parts = model.parts;
    const speedRatio = Math.abs(this.speed) / spec.maxSpeed;

    // Wheels spin (ground modes)
    if (parts.spokes && parts.spokes.length) {
      const spin = (this.speed / 0.44) * delta;
      for (const spoke of parts.spokes) spoke.rotation.x -= spin;
    }

    // Thruster plumes scale with throttle
    if (parts.plumes && parts.plumes.length) {
      const base = spec.air ? 0.35 + speedRatio * 0.9 : 0.02 + speedRatio * 0.35;
      const scale = base + (this.isBoosting ? 0.85 : 0) + (this.overdriveTimer > 0 ? 0.6 : 0);
      const flicker = 1 + Math.random() * 0.25;
      for (const plume of parts.plumes) {
        plume.scale.set(scale * flicker, scale, scale * (1.1 + Math.random() * 0.3));
      }
    }

    // VTOL rotors
    if (parts.rotors && parts.rotors.length) {
      const spinRate = 14 + speedRatio * 26 + (this.isBoosting ? 14 : 0);
      for (const { rotor, pod } of parts.rotors) {
        rotor.rotation.y += spinRate * delta;
        // Tilt pods forward with speed, down when hovering
        const tilt = spec.hover ? Math.max(0, (speedRatio - 0.15) * 0.9) : 0.5;
        pod.rotation.x = THREE.MathUtils.lerp(pod.rotation.x, tilt, delta * 3);
      }
    }

    // Light Drone gyro ring
    if (parts.ring && model && model.group === this.models[VEHICLE_MODES.LIGHTDRONE]?.group) {
      parts.ring.rotation.x += delta * (6 + speedRatio * 10);
      parts.ring.rotation.z += delta * 3;
    }

    // Hyper ion ring spin + colour shift on overdrive
    if (parts.ring && (!model || model.group !== this.models[VEHICLE_MODES.LIGHTDRONE]?.group)) {
      parts.ring.rotation.z += delta * (1.5 + speedRatio * 4);
    }
    if (parts.underglow) {
      parts.underglow.material = this.overdriveTimer > 0 ? this.mats.neonAmber : this.mats.neonCyan;
    }
  }

  // ------------------------------------------------------------------
  //  WEAPONS
  // ------------------------------------------------------------------
  _muzzleWorlds(list) {
    this.mesh.updateMatrixWorld(true);
    if (!list) return [];
    return list.map((arr) => new THREE.Vector3(arr[0], arr[1], arr[2]).applyMatrix4(this.mesh.matrixWorld));
  }

  get canFire() {
    return !this.transform.active && !this.isSubmerged;
  }

  /** Ramp launch: gives ground vehicles a real jump arc. */
  applyJump(force = 26) {
    if (this.spec.air && !this.spec.hover) return;
    this.jumpVy = Math.max(this.jumpVy, force);
    this.airborne = true;
  }

  fireFrontLaser() {
    if (this.frontCooldown > 0 || !this.canFire) return null;
    const w = this.spec.weapons.front;
    this.frontCooldown = w.rate;
    audio.playForwardLaser();

    return {
      origins: this._muzzleWorlds(this.spec.muzzles.front),
      direction: this.getForwardDirection(),
      speed: w.speed,
      damage: w.damage,
      color: w.color,
      scale: w.scale || 1,
      isRear: false
    };
  }

  fireRearLaser() {
    if (this.rearCooldown > 0 || !this.canFire) return null;
    const w = this.spec.weapons.rear;
    this.rearCooldown = w.rate;
    audio.playRearLaser();

    // Muzzle flash on the turret group if present
    const model = this.activeModel;
    if (model && model.group) {
      model.group.traverse((c) => {
        if (c.isMesh && c.geometry && c.geometry.type === 'ConeGeometry' && c.visible === false) {
          c.visible = true;
          setTimeout(() => { c.visible = false; }, 60);
        }
      });
    }

    return {
      origins: this._muzzleWorlds(this.spec.muzzles.rear),
      direction: this.getRearDirection(),
      speed: w.speed,
      damage: w.damage,
      color: w.color,
      scale: w.scale || 1,
      isRear: true,
      isRearLaser: true
    };
  }

  fireSpecial() {
    if (this.specialCooldown > 0 || !this.canFire) return null;
    const sp = this.spec.weapons.special;
    this.specialCooldown = sp.cd;

    switch (sp.kind) {
      case 'EMP':
        audio.playEMP();
        return { kind: 'EMP', origin: this.position.clone(), radius: 62, damage: 85 };

      case 'MISSILES':
        audio.playMissile();
        return {
          kind: 'MISSILES',
          origins: this._muzzleWorlds(this.spec.muzzles.racks).concat(this._muzzleWorlds(this.spec.muzzles.front)),
          direction: this.getForwardDirection(),
          damage: sp.damage,
          aoe: sp.aoe,
          speed: sp.speed,
          color: 0xff0838
        };

      case 'BOMBS':
        audio.playBomb();
        return {
          kind: 'BOMBS',
          origins: this._muzzleWorlds(this.spec.muzzles.bay),
          direction: this.getForwardDirection(),
          speed: sp.speed,
          damage: sp.damage,
          aoe: sp.aoe,
          color: 0xffaa00
        };

      case 'BARRAGE':
        audio.playMissile();
        return {
          kind: 'BARRAGE',
          origins: this._muzzleWorlds(this.spec.muzzles.pods).concat(this._muzzleWorlds(this.spec.muzzles.front)),
          direction: this.getForwardDirection(),
          damage: sp.damage,
          aoe: sp.aoe,
          speed: sp.speed,
          color: 0xffaa00
        };

      case 'OVERDRIVE': {
        audio.playEMP();
        this.overdriveTimer = sp.duration;
        this.invulnTimer = Math.max(this.invulnTimer, sp.duration);
        this.boostCapacitor = 100;
        return { kind: 'SHOCKWAVE', origin: this.position.clone(), radius: sp.radius, damage: sp.damage };
      }

      case 'RIBBON':
        // Jump Jet: four Light Ribbons lash out from the wingtip emitters
        audio.playMissile();
        return {
          kind: 'RIBBON',
          origins: this._muzzleWorlds(this.spec.muzzles.ribbons),
          direction: this.getForwardDirection(),
          damage: sp.damage,
          speed: sp.speed,
          color: 0xff0838,
          scale: 3.0
        };

      case 'PLOUGH':
        // DART: deploy the Light Ram and bulldoze everything ahead
        audio.playBomb();
        this.ploughTimer = sp.duration;
        this.invulnTimer = Math.max(this.invulnTimer, 0.8);
        return { kind: 'PLOUGH' };

      case 'SUBMERGE':
        // Skimmer: drop into submersible configuration
        audio.playEMP();
        this.submergeTimer = sp.duration;
        this.invulnTimer = Math.max(this.invulnTimer, sp.duration + 0.4);
        return { kind: 'SUBMERGE' };

      case 'CLOAK':
        // Light Drone: phase out of the grid
        audio.playPickup();
        this.cloakTimer = sp.duration;
        this.invulnTimer = Math.max(this.invulnTimer, sp.duration);
        return { kind: 'CLOAK' };

      default:
        return null;
    }
  }

  // ------------------------------------------------------------------
  //  HUD HELPERS
  // ------------------------------------------------------------------
  get frontCooldownPct() {
    const rate = this.spec.weapons.front.rate;
    return Math.max(0, Math.min(1, 1 - this.frontCooldown / rate));
  }

  get rearCooldownPct() {
    const rate = this.spec.weapons.rear.rate;
    return Math.max(0, Math.min(1, 1 - this.rearCooldown / rate));
  }

  get specialCooldownPct() {
    const cd = this.spec.weapons.special.cd;
    return Math.max(0, Math.min(1, 1 - this.specialCooldown / cd));
  }

  getSpeedKmh() {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  getForwardDirection() {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion).normalize();
  }

  getRearDirection() {
    return new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
  }

  reset() {
    this.mode = VEHICLE_MODES.CYCLE;
    this.transform.active = false;
    this.transform.t = 0;
    this.position.set(0, 0.5, 0);
    this.speed = 30;
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.leanAngle = 0;
    this.altitude = 0.5;
    this.boostCapacitor = 100;
    this.isBoosting = false;
    this.frontCooldown = 0;
    this.rearCooldown = 0;
    this.specialCooldown = 0;
    this.invulnTimer = 1.5;
    this.overdriveTimer = 0;
    this.ramCooldown = 0;
    this.ploughTimer = 0;
    this.submergeTimer = 0;
    this.cloakTimer = 0;
    this.jumpVy = 0;
    this.airborne = false;
    this.phaseHalo.visible = false;
    this.shieldBubble.visible = false;
    if (this.ribbon) this.ribbon.reset();
    this.applyModeVisibility();

    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0, 'YXZ');
    this.mesh.updateMatrixWorld(true);
  }
}
