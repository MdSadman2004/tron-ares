import * as THREE from 'three';
import { audio } from './audio.js';

/**
 * GRID PROTOCOL — MCP ENEMY FORCES
 *
 * 5 enemy classes with distinct 3D models and combat AI:
 *   CYCLE     — MCP Pursuer lightcycle: drafts and rams, fires pulse bolts
 *   JET       — Interceptor light jet: aerial dogfight, orbit attacks
 *   DRONE     — Kamikaze swarm drone: suicide charge, packs of 3-6
 *   GUNSHIP   — Heavy hover gunship: strafes, 3-round heavy bursts
 *   RECOGNIZER— Boss: stomp shockwaves, quad barrage, deploys drones
 */

export const ENEMY_TYPES = {
  CYCLE: 'CYCLE',
  JET: 'JET',
  DRONE: 'DRONE',
  GUNSHIP: 'GUNSHIP',
  RECOGNIZER: 'RECOGNIZER'
};

export const ENEMY_SPECS = {
  CYCLE: {
    name: 'MCP PURSUER', hp: 70, speed: 56, radius: 2.0, score: 200,
    contactDamage: 13, contactRadius: 3.0, air: false
  },
  JET: {
    name: 'INTERCEPTOR', hp: 95, speed: 76, radius: 3.0, score: 280,
    contactDamage: 14, contactRadius: 3.6, air: true
  },
  DRONE: {
    name: 'KAMIKAZE DRONE', hp: 26, speed: 96, radius: 1.5, score: 140,
    contactDamage: 22, contactRadius: 9.0, air: true, kamikaze: true
  },
  GUNSHIP: {
    name: 'MCP GUNSHIP', hp: 240, speed: 34, radius: 4.3, score: 650,
    contactDamage: 26, contactRadius: 5.0, air: true
  },
  RECOGNIZER: {
    name: 'RECOGNIZER', hp: 560, speed: 24, radius: 9.0, score: 2500,
    contactDamage: 40, contactRadius: 11.0, air: true, boss: true
  }
};

const MAX_ENEMIES = 34;

// ---------------------------------------------------------------------------
//  SHARED PROTOTYPE CACHE — each enemy type is built once and cloned per spawn
// ---------------------------------------------------------------------------
const MATS = {
  carbon: new THREE.MeshStandardMaterial({ color: 0x08090d, metalness: 0.6, roughness: 0.35 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x16181f, metalness: 0.5, roughness: 0.4 }),
  cyan: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
  amber: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
  orange: new THREE.MeshBasicMaterial({ color: 0xff6a00 }),
  red: new THREE.MeshBasicMaterial({ color: 0xff0838 })
};

const PROTOTYPES = {};

function buildCycleProto() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.65, 3.2), MATS.carbon);
  body.position.y = 0.45;
  g.add(body);

  const line = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 3.0), MATS.cyan);
  line.position.y = 0.45;
  g.add(line);

  const wheelGeo = new THREE.TorusGeometry(0.42, 0.08, 8, 24);
  wheelGeo.rotateY(Math.PI / 2);
  const fWheel = new THREE.Mesh(wheelGeo, MATS.cyan);
  fWheel.position.set(0, 0.42, -1.4);
  g.add(fWheel);
  const rWheel = new THREE.Mesh(wheelGeo, MATS.cyan);
  rWheel.position.set(0, 0.45, 1.4);
  g.add(rWheel);

  const canopyGeo = new THREE.ConeGeometry(0.4, 1.2, 4);
  canopyGeo.rotateX(Math.PI / 2.3);
  const canopy = new THREE.Mesh(canopyGeo, MATS.plate);
  canopy.position.set(0, 0.7, -0.2);
  g.add(canopy);

  // MCP rider
  const rider = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.5), MATS.plate);
  rider.position.set(0, 0.95, 0.25);
  g.add(rider);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.12), MATS.amber);
  visor.position.set(0, 1.1, 0.0);
  g.add(visor);

  return g;
}

function buildJetProto() {
  const g = new THREE.Group();

  const fuseGeo = new THREE.ConeGeometry(0.65, 4.2, 5);
  fuseGeo.rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(fuseGeo, MATS.carbon));

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2.4, -0.8);
  wingShape.lineTo(2.0, -1.6);
  wingShape.lineTo(0, -0.6);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
  wingGeo.rotateX(Math.PI / 2);

  const rightWing = new THREE.Mesh(wingGeo, MATS.carbon);
  rightWing.position.set(0.3, 0, 0.5);
  g.add(rightWing);
  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  leftWing.position.x = -0.3;
  g.add(leftWing);

  const wingGlowGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6);
  wingGlowGeo.rotateZ(0.4);
  wingGlowGeo.rotateX(Math.PI / 2);
  const rightGlow = new THREE.Mesh(wingGlowGeo, MATS.amber);
  rightGlow.position.set(1.2, 0, 0);
  g.add(rightGlow);
  const leftGlow = new THREE.Mesh(wingGlowGeo, MATS.amber);
  leftGlow.rotation.z = -0.4;
  leftGlow.rotation.x = Math.PI / 2;
  leftGlow.position.set(-1.2, 0, 0);
  g.add(leftGlow);

  const plumeGeo = new THREE.ConeGeometry(0.18, 0.8, 8);
  plumeGeo.rotateX(-Math.PI / 2);
  for (const sx of [-0.35, 0.35]) {
    const plume = new THREE.Mesh(plumeGeo, MATS.amber);
    plume.position.set(sx, 0, 2.1);
    g.add(plume);
  }

  return g;
}

function buildDroneProto() {
  const g = new THREE.Group();

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), MATS.carbon);
  g.add(core);

  const ringGeo = new THREE.TorusGeometry(0.85, 0.05, 6, 20);
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, MATS.orange);
  ring.name = 'spinRing';
  g.add(ring);

  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), MATS.red);
  eye.position.set(0, 0, -0.7);
  g.add(eye);

  // 4 mini stabiliser fins
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.5), MATS.plate);
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    fin.position.set(Math.cos(ang) * 0.7, 0, Math.sin(ang) * 0.7);
    fin.rotation.y = -ang;
    g.add(fin);
  }

  return g;
}

function buildGunshipProto() {
  const g = new THREE.Group();

  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 5.2), MATS.carbon);
  g.add(hull);

  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 4.0), MATS.plate);
  topPlate.position.y = 0.62;
  g.add(topPlate);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 4.6), MATS.amber);
  spine.position.y = 0.7;
  g.add(spine);

  // Side pods / thrusters
  for (const sx of [-1.7, 1.7]) {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 2.6, 10), MATS.plate);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(sx, -0.15, 0.6);
    g.add(nacelle);

    const plumeGeo = new THREE.ConeGeometry(0.26, 1.1, 8);
    plumeGeo.rotateX(-Math.PI / 2);
    const plume = new THREE.Mesh(plumeGeo, MATS.orange);
    plume.position.set(sx, -0.15, 2.2);
    g.add(plume);
  }

  // Rotor-ish hover pads
  for (const sx of [-1.7, 1.7]) {
    for (const sz of [-1.4, 1.9]) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 12), MATS.plate);
      pad.position.set(sx, -0.62, sz);
      g.add(pad);
      const padGlow = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 18), MATS.amber);
      padGlow.rotation.x = Math.PI / 2;
      padGlow.position.set(sx, -0.66, sz);
      g.add(padGlow);
    }
  }

  // Chin cannon cluster
  const gunGeo = new THREE.CylinderGeometry(0.11, 0.13, 1.4, 8);
  gunGeo.rotateX(Math.PI / 2);
  const gun = new THREE.Mesh(gunGeo, MATS.carbon);
  gun.position.set(0, -0.35, -3.0);
  g.add(gun);
  const gunTip = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 12), MATS.orange);
  gunTip.position.set(0, -0.35, -3.7);
  g.add(gunTip);

  // Cockpit eye
  const eye = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.3), MATS.red);
  eye.position.set(0, 0.2, -2.66);
  g.add(eye);

  return g;
}

function buildRecognizerProto() {
  const g = new THREE.Group();

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 5), MATS.carbon);
  topBar.position.y = 12;
  g.add(topBar);

  const eye = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 5.2), MATS.amber);
  eye.position.set(0, 12, 0);
  g.add(eye);

  const legGeo = new THREE.BoxGeometry(2.5, 12, 4);
  for (const sx of [-5.5, 5.5]) {
    const leg = new THREE.Mesh(legGeo, MATS.carbon);
    leg.position.set(sx, 6, 0);
    g.add(leg);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 5.5), MATS.plate);
    foot.position.set(sx, 0.6, 0);
    g.add(foot);

    // Leg neon trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 11, 0.14), MATS.red);
    trim.position.set(sx + (sx > 0 ? 1.3 : -1.3), 6, -2.1);
    g.add(trim);

    // Under-leg cannons
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.6, 8), MATS.plate);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(sx, 3.4, -2.4);
    g.add(cannon);
    const cannonTip = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 14), MATS.orange);
    cannonTip.position.set(sx, 3.4, -3.2);
    g.add(cannonTip);
  }

  const trim = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.1, 5.1), MATS.amber);
  trim.position.set(0, 13.3, 0);
  g.add(trim);

  return g;
}

function getPrototype(type) {
  if (!PROTOTYPES[type]) {
    switch (type) {
      case ENEMY_TYPES.CYCLE: PROTOTYPES[type] = buildCycleProto(); break;
      case ENEMY_TYPES.JET: PROTOTYPES[type] = buildJetProto(); break;
      case ENEMY_TYPES.DRONE: PROTOTYPES[type] = buildDroneProto(); break;
      case ENEMY_TYPES.GUNSHIP: PROTOTYPES[type] = buildGunshipProto(); break;
      case ENEMY_TYPES.RECOGNIZER: PROTOTYPES[type] = buildRecognizerProto(); break;
      default: PROTOTYPES[type] = buildCycleProto();
    }
  }
  return PROTOTYPES[type];
}

// ---------------------------------------------------------------------------
//  ENEMY
// ---------------------------------------------------------------------------
export class Enemy {
  constructor(scene, type, position, waveScale = 1) {
    this.scene = scene;
    this.type = type;
    this.spec = ENEMY_SPECS[type] || ENEMY_SPECS.CYCLE;

    this.position = position.clone();
    this.mesh = getPrototype(type).clone();
    this.mesh.position.copy(this.position);

    // Health scales with wave number
    const hpScale = 1 + (waveScale - 1) * 0.09;
    this.maxHealth = Math.round(this.spec.hp * hpScale);
    this.health = this.maxHealth;
    this.hitRadius = this.spec.radius;
    this.damageScale = 1 + (waveScale - 1) * 0.05;

    this.speed = this.spec.speed * Math.min(1.3, 1 + (waveScale - 1) * 0.015);
    this.yaw = Math.random() * Math.PI * 2;
    this.pitch = 0;
    this.shootTimer = 0.6 + Math.random() * 1.8;
    this.burstTimer = 0;
    this.burstShots = 0;
    this.abilityTimer = 6 + Math.random() * 6;
    this.deployTimer = 12 + Math.random() * 5;
    this.contactCooldown = 0;
    this.age = 0;

    // AI state
    this.isPursuing = false;
    this.isDirectlyBehindPlayer = false;
    this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    this.strafeTimer = 3 + Math.random() * 4;
    this.weavePhase = Math.random() * Math.PI * 2;

    // Hit flash overlay (shared material, per-instance visibility)
    const flashGeo = new THREE.SphereGeometry(this.hitRadius * 1.05, 10, 8);
    this.flashTimer = 0;
    this.flashMesh = new THREE.Mesh(flashGeo, Enemy.flashMat);
    this.flashMesh.visible = false;
    this.mesh.add(this.flashMesh);

    // Named-child lookup survives clone() (userData object refs do not)
    this.droneRing = this.mesh.getObjectByName('spinRing') || null;

    this.scene.add(this.mesh);
    this._tmp = new THREE.Vector3();
  }

  takeDamage(amount) {
    this.health -= amount;
    this.flashTimer = 0.09;
    this.flashMesh.visible = true;
    return this.health <= 0;
  }

  isDead() {
    return this.health <= 0;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }

  /** Relocate a far-away enemy behind the player so fights stay active. */
  _reposition(player) {
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
    const behind = fwd.clone().multiplyScalar(-1);
    const lateral = new THREE.Vector3(-behind.z, 0, behind.x).multiplyScalar((Math.random() - 0.5) * 90);

    this.position.copy(player.position)
      .addScaledVector(behind, 150 + Math.random() * 60)
      .add(lateral);

    if (this.spec.air) {
      this.position.y = player.position.y + 10 + Math.random() * 45;
      if (this.type === ENEMY_TYPES.RECOGNIZER) this.position.y = 24;
    } else {
      this.position.y = 0.5;
    }
    this.mesh.position.copy(this.position);
  }

  update(delta, player, weaponSystem, ctx) {
    this.age += delta;
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) this.flashMesh.visible = false;
    }
    if (this.contactCooldown > 0) this.contactCooldown -= delta;

    const toPlayer = this._tmp.subVectors(player.position, this.position);
    const distToPlayer = toPlayer.length();
    if (distToPlayer < 0.001) return;

    // Behind-player detection (drives the rear-laser HUD warning)
    const playerRearDir = player.getRearDirection();
    const toEnemyFromPlayer = new THREE.Vector3().subVectors(this.position, player.position).normalize();
    const dotRear = playerRearDir.dot(toEnemyFromPlayer);
    this.isDirectlyBehindPlayer = dotRear > 0.65 && distToPlayer < 95;

    // Far away → MCP re-instantiate closer to the fight
    if (distToPlayer > 720) {
      this._reposition(player);
      return;
    }

    // Sensor denial: a cloaked drone or a submerged skimmer cannot be locked
    this._fireBlocked = !!(player.isCloaked || player.isSubmerged);

    switch (this.type) {
      case ENEMY_TYPES.CYCLE: this._updateCycle(delta, player, weaponSystem, distToPlayer, toPlayer, ctx); break;
      case ENEMY_TYPES.JET: this._updateJet(delta, player, weaponSystem, distToPlayer, toPlayer); break;
      case ENEMY_TYPES.DRONE: this._updateDrone(delta, player, distToPlayer, toPlayer); break;
      case ENEMY_TYPES.GUNSHIP: this._updateGunship(delta, player, weaponSystem, distToPlayer, toPlayer); break;
      case ENEMY_TYPES.RECOGNIZER: this._updateRecognizer(delta, player, weaponSystem, distToPlayer, toPlayer, ctx); break;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(this.pitch, this.yaw, this.mesh.rotation.z, 'YXZ');

    // Spin the drone ring for life
    if (this.droneRing) {
      this.droneRing.rotation.z += delta * 4;
    }
  }

  _aimYaw(targetPos, delta, rate) {
    const targetAngle = Math.atan2(-(targetPos.x - this.position.x), -(targetPos.z - this.position.z));
    let diff = targetAngle - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, delta * rate);
    return diff;
  }

  _fwd(speedMult = 1) {
    return new THREE.Vector3(0, 0, -1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
      .multiplyScalar(this.speed * speedMult);
  }

  _fireAt(weaponSystem, player, speed, damage, color, spread = 0.35, count = 2) {
    if (this._fireBlocked) return;
    const origin = this.position.clone();
    const dir = new THREE.Vector3().subVectors(player.position, this.position).normalize();

    const origins = [];
    for (let i = 0; i < count; i++) {
      const lateral = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(spread * (i - (count - 1) / 2));
      origins.push(origin.clone().add(lateral).add(new THREE.Vector3(0, 0.2, 0)));
    }

    weaponSystem.spawnBolts({
      origins,
      direction: dir,
      speed,
      damage: damage * this.damageScale,
      isEnemy: true,
      color,
      scale: 1
    });
  }

  // ---------------------------------------------------------------- CYCLE
  _updateCycle(delta, player, weaponSystem, distToPlayer, toPlayer, ctx) {
    this.position.y = 0.5;
    this.pitch = 0;

    // Lead the target slightly
    const lead = player.position.clone().addScaledVector(player.getForwardDirection(), distToPlayer * 0.12);
    this._aimYaw(lead, delta, 3.0);

    let speed = this.speed;
    if (this.isDirectlyBehindPlayer) {
      speed = Math.abs(player.speed) * 1.06 + 12;      // draft & ram
      const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.position.addScaledVector(fwd, speed * delta);
    } else {
      if (distToPlayer > 140) speed *= 1.5;              // hyperspeed catch-up
      const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.position.addScaledVector(fwd, speed * delta);
    }

    // Fire pulse bolts when facing the player
    this.shootTimer -= delta;
    const facing = this._facingDot(player);
    if (this.shootTimer <= 0 && distToPlayer < 85 && facing > 0.86) {
      this.shootTimer = 1.5 + Math.random() * 0.9;
      this._fireAt(weaponSystem, player, 130, 12, 0xffaa00, 0.5);
    }
  }

  // ------------------------------------------------------------------ JET
  _updateJet(delta, player, weaponSystem, distToPlayer, toPlayer) {
    const targetY = Math.max(14, player.position.y + 14);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, delta * 1.8);

    let aimPos = player.position.clone();
    // Orbit/strafe when too close
    if (distToPlayer < 48) {
      const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize().multiplyScalar(45);
      aimPos = player.position.clone().add(perp);
    }
    const diff = this._aimYaw(aimPos, delta, 2.4);
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -diff * 1.4, delta * 4);

    let speed = this.speed;
    if (distToPlayer > 170) speed *= 1.5;
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.position.addScaledVector(fwd, speed * delta);

    this.shootTimer -= delta;
    const facing = this._facingDot(player);
    if (this.shootTimer <= 0 && distToPlayer < 135 && facing > 0.78) {
      this.shootTimer = 2.0 + Math.random() * 1.2;
      this._fireAt(weaponSystem, player, 150, 13, 0xffaa00, 1.0);
    }
  }

  // ---------------------------------------------------------------- DRONE
  _updateDrone(delta, player, distToPlayer, toPlayer) {
    // Hover just above the player's level
    const targetY = Math.max(1.2, player.position.y + 1.0);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, delta * 2.4);

    // Swarm weave
    const weave = Math.sin(this.age * 3.2 + this.weavePhase) * 7;
    const dir = toPlayer.clone().normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(weave * 0.06);
    this._aimYaw(player.position.clone().add(perp), delta, 3.4);

    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    let speed = this.speed * (distToPlayer < 40 ? 1.25 : 1.0);
    this.position.addScaledVector(fwd, speed * delta);

    this.mesh.rotation.z += delta * 6;
  }

  // -------------------------------------------------------------- GUNSHIP
  _updateGunship(delta, player, weaponSystem, distToPlayer, toPlayer) {
    const targetY = Math.max(12, player.position.y + 11);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, delta * 1.4);

    this.strafeTimer -= delta;
    if (this.strafeTimer <= 0) {
      this.strafeDir *= -1;
      this.strafeTimer = 4 + Math.random() * 4;
    }

    // Keep a stand-off distance, strafing sideways
    let aimPos;
    if (distToPlayer < 48) {
      aimPos = this.position.clone().addScaledVector(toPlayer.clone().normalize(), -30);
    } else if (distToPlayer > 100) {
      aimPos = player.position.clone();
    } else {
      const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize().multiplyScalar(this.strafeDir * 60);
      aimPos = player.position.clone().add(perp);
    }
    const diff = this._aimYaw(aimPos, delta, 1.6);
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -diff * 0.8, delta * 3);

    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.position.addScaledVector(fwd, this.speed * delta);

    // 3-round burst
    if (this.burstShots > 0) {
      this.burstTimer -= delta;
      if (this.burstTimer <= 0) {
        this.burstShots--;
        this.burstTimer = 0.14;
        this._fireAt(weaponSystem, player, 135, 15, 0xff6a00, 0.7, 1);
        audio.playForwardLaser();
      }
    } else {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0 && distToPlayer < 130) {
        this.shootTimer = 3.0 + Math.random() * 1.2;
        this.burstShots = 3;
        this.burstTimer = 0;
      }
    }
  }

  // ------------------------------------------------------------ RECOGNIZER
  _updateRecognizer(delta, player, weaponSystem, distToPlayer, toPlayer, ctx) {
    this.position.y = 24;
    this._aimYaw(player.position, delta, 0.7);

    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    this.position.addScaledVector(fwd, this.speed * delta);

    // Heavy stomp shockwave when the player flies close
    const flatDist = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
    if (flatDist < 62 && this.abilityTimer <= 0 && !this._fireBlocked) {
      this.abilityTimer = 6.5;
      const stompOrigin = new THREE.Vector3(this.position.x, 1.0, this.position.z);
      weaponSystem.spawnShockwave(stompOrigin, 68, 45 * this.damageScale, true);
      audio.playExplosion();
    }

    this.abilityTimer -= delta;

    // Quad barrage
    this.shootTimer -= delta;
    if (this.shootTimer <= 0 && distToPlayer < 180 && !this._fireBlocked) {
      this.shootTimer = 3.0;
      const origins = [];
      for (const sx of [-5.5, 5.5]) {
        for (const sz of [-2.4, 2.0]) {
          origins.push(new THREE.Vector3(this.position.x + sx, this.position.y + 3.4, this.position.z + sz));
        }
      }
      const dir = new THREE.Vector3().subVectors(player.position, this.position).normalize();
      weaponSystem.spawnBolts({
        origins,
        direction: dir,
        speed: 115,
        damage: 15 * this.damageScale,
        isEnemy: true,
        color: 0xffaa00,
        scale: 1.4
      });
    }

    // Deploy drones
    this.deployTimer -= delta;
    if (this.deployTimer <= 0) {
      this.deployTimer = 15;
      if (ctx && ctx.spawner) ctx.spawner.spawnDronesNear(this.position, 2);
    }
  }

  _facingDot(player) {
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position).normalize();
    return fwd.dot(toPlayer);
  }
}

Enemy.flashMat = new THREE.MeshBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false
});

// ---------------------------------------------------------------------------
//  SPAWNER
// ---------------------------------------------------------------------------
export class EnemySpawner {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.queue = [];          // staggered spawn queue: {type, position, delay, waveScale}
    this.wave = 1;
    this.endlessTimer = 0;
    this.endlessJetTimer = 12;
    this.endlessGunshipTimer = 40;
    this.endlessBossTimer = 100;
  }

  get activeCount() {
    return this.enemies.length;
  }

  /** Composition table for a survival wave. */
  static describeWave(n) {
    const parts = [];
    parts.push('PURSUER PACK');
    if (n >= 2) parts.push('DRONE SWARM');
    if (n >= 3) parts.push('AIR INTERCEPTORS');
    if (n >= 4) parts.push('GUNSHIP ESCORT');
    if (n % 4 === 0) parts.push('★ RECOGNIZER');
    return parts.join(' + ');
  }

  spawnWave(waveNumber, player) {
    this.wave = waveNumber;
    const pPos = player.position;
    const pYaw = player.yaw;
    const rotY = (v, ang) => v.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);

    const queue = [];
    const scale = waveNumber;

    // --- Ground pursuers: always spawn directly behind the player ---------
    const cycleCount = Math.min(8, 2 + Math.ceil(waveNumber * 1.1));
    for (let i = 0; i < cycleCount; i++) {
      const local = new THREE.Vector3((Math.random() - 0.5) * 20, 0, 34 + i * 13 + Math.random() * 8);
      rotY(local, pYaw);
      queue.push({
        type: ENEMY_TYPES.CYCLE,
        position: pPos.clone().add(local).setY(0.5),
        delay: i * 0.22,
        yaw: pYaw
      });
    }

    // --- Drone packs from wave 2 ------------------------------------------
    if (waveNumber >= 2) {
      const packs = Math.min(3, 1 + Math.floor(waveNumber / 3));
      for (let p = 0; p < packs; p++) {
        const side = p % 2 === 0 ? 1 : -1;
        const local = new THREE.Vector3(side * (30 + Math.random() * 20), 0, -(30 + p * 20));
        rotY(local, pYaw);
        const packCenter = pPos.clone().add(local);
        const count = Math.min(6, 2 + waveNumber);
        for (let i = 0; i < count; i++) {
          queue.push({
            type: ENEMY_TYPES.DRONE,
            position: packCenter.clone().add(new THREE.Vector3((Math.random() - 0.5) * 26, 2 + Math.random() * 8, (Math.random() - 0.5) * 26)),
            delay: 1.0 + p * 0.5 + i * 0.12
          });
        }
      }
    }

    // --- Air interceptors from wave 3 --------------------------------------
    if (waveNumber >= 3) {
      const jetCount = Math.min(6, 1 + Math.floor(waveNumber / 2));
      for (let i = 0; i < jetCount; i++) {
        const angle = pYaw + (i / jetCount) * Math.PI * 2;
        const radius = 75 + Math.random() * 45;
        queue.push({
          type: ENEMY_TYPES.JET,
          position: pPos.clone().add(new THREE.Vector3(Math.cos(angle) * radius, 26 + Math.random() * 34, Math.sin(angle) * radius)),
          delay: 1.2 + i * 0.3
        });
      }
    }

    // --- Gunship escort from wave 4 -----------------------------------------
    if (waveNumber >= 4) {
      const gunCount = Math.min(3, Math.floor((waveNumber - 2) / 2));
      for (let i = 0; i < gunCount; i++) {
        const local = new THREE.Vector3((i % 2 === 0 ? 1 : -1) * (70 + Math.random() * 30), 24 + Math.random() * 14, -(40 + i * 25));
        rotY(local, pYaw);
        queue.push({ type: ENEMY_TYPES.GUNSHIP, position: pPos.clone().add(local), delay: 1.6 + i * 0.4 });
      }
    }

    // --- Recognizer boss every 4th wave --------------------------------------
    if (waveNumber % 4 === 0) {
      const local = new THREE.Vector3(0, 24, -(120 + waveNumber * 4));
      rotY(local, pYaw);
      queue.push({ type: ENEMY_TYPES.RECOGNIZER, position: pPos.clone().add(local), delay: 2.2 });
    }

    this.queue = queue;
    this.waveScale = scale;
  }

  spawnDronesNear(position, count) {
    for (let i = 0; i < count; i++) {
      if (this.enemies.length + this.queue.length >= MAX_ENEMIES) return;
      const pos = position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 30, -18 - Math.random() * 8, (Math.random() - 0.5) * 30
      ));
      pos.y = Math.max(1.2, pos.y);
      this.queue.push({ type: ENEMY_TYPES.DRONE, position: pos, delay: 0.2 });
    }
  }

  /** Continuous spawn mode for the HIGHWAY CHASE scenario. */
  spawnEndless(delta, player, elapsed) {
    const pPos = player.position;
    const pYaw = player.yaw;
    const rotY = (v, ang) => v.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);

    this.endlessTimer -= delta;
    this.endlessJetTimer -= delta;
    this.endlessGunshipTimer -= delta;
    this.endlessBossTimer -= delta;

    if (this.endlessTimer <= 0) {
      this.endlessTimer = Math.max(1.6, 4.2 - elapsed * 0.012);
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const local = new THREE.Vector3((Math.random() - 0.5) * 26, 0, 40 + Math.random() * 30);
        rotY(local, pYaw);
        this.queue.push({ type: ENEMY_TYPES.CYCLE, position: pPos.clone().add(local).setY(0.5), delay: i * 0.25 });
      }
      // Drone harassment grows over time
      if (elapsed > 25 && Math.random() < 0.6) {
        const local = new THREE.Vector3((Math.random() - 0.5) * 40, 4, -(25 + Math.random() * 30));
        rotY(local, pYaw);
        this.spawnDronesNear(pPos.clone().add(local), 2 + Math.floor(Math.random() * 2));
      }
    }

    if (this.endlessJetTimer <= 0) {
      this.endlessJetTimer = 18 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      this.queue.push({
        type: ENEMY_TYPES.JET,
        position: pPos.clone().add(new THREE.Vector3(Math.cos(angle) * 90, 28 + Math.random() * 30, Math.sin(angle) * 90)),
        delay: 0.4
      });
    }

    if (this.endlessGunshipTimer <= 0) {
      this.endlessGunshipTimer = 45 + Math.random() * 15;
      const local = new THREE.Vector3((Math.random() < 0.5 ? 1 : -1) * 80, 30, -50);
      rotY(local, pYaw);
      this.queue.push({ type: ENEMY_TYPES.GUNSHIP, position: pPos.clone().add(local), delay: 0.5 });
    }

    if (this.endlessBossTimer <= 0) {
      this.endlessBossTimer = 120;
      const local = new THREE.Vector3(0, 24, -150);
      rotY(local, pYaw);
      this.queue.push({ type: ENEMY_TYPES.RECOGNIZER, position: pPos.clone().add(local), delay: 1.0 });
    }
  }

  /**
   * @returns {{pursuerBehindDetected:boolean, activeCount:number, boss:object|null, nearestThreat:number}}
   */
  update(delta, vehicle, weaponSystem, hooks = {}) {
    // 1. Process staggered spawn queue
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const item = this.queue[i];
      item.delay -= delta;
      if (item.delay <= 0) {
        if (this.enemies.length < MAX_ENEMIES) {
          const enemy = new Enemy(this.scene, item.type, item.position, this.waveScale || 1);
          if (item.yaw !== undefined) enemy.yaw = item.yaw;
          this.enemies.push(enemy);
        }
        this.queue.splice(i, 1);
      }
    }

    // 2. Update enemies
    let pursuerBehindDetected = false;
    let nearestThreat = Infinity;
    let boss = null;

    for (const enemy of this.enemies) {
      const ctx = { spawner: this };
      enemy.update(delta, vehicle, weaponSystem, ctx);

      if (enemy.isDirectlyBehindPlayer) pursuerBehindDetected = true;
      const d = enemy.position.distanceTo(vehicle.position);
      if (d < nearestThreat) nearestThreat = d;
      if (enemy.spec.boss && !boss) boss = { name: enemy.spec.name, hp: enemy.health, maxHp: enemy.maxHealth };
    }

    // 3. Separation (keeps formations from clumping)
    const n = this.enemies.length;
    for (let i = 0; i < n; i++) {
      const a = this.enemies[i];
      if (a.type === ENEMY_TYPES.RECOGNIZER) continue;
      for (let j = i + 1; j < n; j++) {
        const b = this.enemies[j];
        if (b.type === ENEMY_TYPES.RECOGNIZER) continue;
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dz = b.position.z - a.position.z;
        const dsq = dx * dx + dy * dy + dz * dz;
        const minDist = a.hitRadius + b.hitRadius + 2.5;
        if (dsq < minDist * minDist && dsq > 0.0001) {
          const d = Math.sqrt(dsq);
          const push = (minDist - d) * 0.5;
          const nx = dx / d, ny = dy / d, nz = dz / d;
          a.position.x -= nx * push; a.position.y -= ny * push * 0.4; a.position.z -= nz * push;
          b.position.x += nx * push; b.position.y += ny * push * 0.4; b.position.z += nz * push;
        }
      }
    }

    // 4. Player contact / ramming
    const playerRadius = vehicle.spec ? vehicle.spec.collisionRadius : 2.0;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dist = enemy.position.distanceTo(vehicle.position);
      const contactDist = enemy.spec.contactRadius + playerRadius;

      // Off the grid = nothing to ram
      if (vehicle.isSubmerged) continue;

      if (dist < contactDist) {
        if (enemy.type === ENEMY_TYPES.DRONE) {
          // Kamikaze detonation
          if (hooks.onEnemyKilled) hooks.onEnemyKilled(enemy, 'drone_detonate');
          weaponSystem.spawnExplosion(enemy.position.clone(), 0xff6a00, 1.1);
          if (hooks.onPlayerDamaged) hooks.onPlayerDamaged(enemy.spec.contactDamage * enemy.damageScale, enemy.position, 'contact');
          this.enemies.splice(i, 1);
          enemy.destroy();
          continue;
        }

        if (enemy.contactCooldown <= 0) {
          enemy.contactCooldown = 1.3;
          if (hooks.onPlayerDamaged) hooks.onPlayerDamaged(enemy.spec.contactDamage * enemy.damageScale, enemy.position, 'contact');

          // Player rams the enemy: damage dealt scales with speed and vehicle class
          const ramSpeed = Math.abs(vehicle.speed);
          const ramMult = vehicle.spec ? vehicle.spec.ramDamage / 30 : 1;
          const ramDamage = ramSpeed * 0.55 * ramMult;
          if (ramSpeed > 28) {
            const killed = enemy.takeDamage(ramDamage);
            if (killed) {
              if (hooks.onEnemyKilled) hooks.onEnemyKilled(enemy, 'ram');
              weaponSystem.spawnExplosion(enemy.position.clone(), 0xff0838, 0.9);
              this.enemies.splice(i, 1);
              enemy.destroy();
            }
          }
        }
      }
    }

    // Drop dead boss deploy trackers

    return {
      pursuerBehindDetected,
      activeCount: this.enemies.length,
      boss,
      nearestThreat: isFinite(nearestThreat) ? nearestThreat : -1
    };
  }

  removeAt(index) {
    const e = this.enemies[index];
    if (e) {
      e.destroy();
      this.enemies.splice(index, 1);
    }
  }

  clear() {
    for (const enemy of this.enemies) enemy.destroy();
    this.enemies = [];
    this.queue = [];
  }
}
