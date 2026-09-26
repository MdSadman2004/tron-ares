import * as THREE from 'three';
import { audio } from './audio.js';
import { LightRibbon } from './vehicle.js';

/**
 * GRID PROTOCOL — RIVAL PROGRAMS (computer opponents)
 *
 * The MCP forces in enemies.js are constructs: they swarm, ram and die. These
 * are pilots. Each rival flies one of the fleet configurations, holds a
 * preferred engagement range, leads its shots, breaks off when hurt, avoids the
 * grid's structures and comes back for another pass — a duel, not a swarm.
 *
 * They are pushed into the same `enemySpawner.enemies` array so every existing
 * system (weapons, ram damage, separation, scoring, loot) applies unchanged;
 * their AI lives in update() via the same contract Enemy uses.
 */

export const OPPONENT_TYPES = {
  RIVAL_CYCLE: 'RIVAL_CYCLE',
  RIVAL_JET: 'RIVAL_JET',
  RIVAL_HEAVY: 'RIVAL_HEAVY',
  RIVAL_VTOL: 'RIVAL_VTOL'
};

/** Merged into ENEMY_SPECS at boot so scoring/loot treat rivals normally. */
export const OPPONENT_SPECS = {
  RIVAL_CYCLE: {
    name: 'RIVAL CYCLE', program: 'GRID RUNNER',
    hp: 165, speed: 82, cruise: 62, radius: 2.2, score: 700,
    contactDamage: 24, contactRadius: 3.4, air: false,
    range: [16, 44], fireRange: 130, fireRate: 0.42, boltDamage: 8, boltSpeed: 175,
    turnRate: 1.35, accel: 46, color: 0xc04bff, neon: 0xe9b8ff,
    rival: true, desc: 'DUELIST — cuts across your line'
  },
  RIVAL_JET: {
    name: 'RIVAL JET', program: 'AIR ACE',
    hp: 120, speed: 96, cruise: 74, radius: 2.6, score: 850,
    contactDamage: 18, contactRadius: 3.6, air: true,
    range: [55, 120], fireRange: 190, fireRate: 0.55, boltDamage: 9, boltSpeed: 200,
    turnRate: 0.85, accel: 40, color: 0xc04bff, neon: 0xe9b8ff,
    rival: true, desc: 'BOOM AND ZOOM — dives from above'
  },
  RIVAL_HEAVY: {
    name: 'RIVAL HEAVY', program: 'BOMBER',
    hp: 260, speed: 62, cruise: 50, radius: 3.4, score: 1100,
    contactDamage: 30, contactRadius: 4.4, air: true,
    range: [70, 150], fireRange: 210, fireRate: 0.9, boltDamage: 12, boltSpeed: 165,
    turnRate: 0.55, accel: 26, color: 0xc04bff, neon: 0xe9b8ff,
    rival: true, desc: 'GUNSHIP — broadside salvos'
  },
  RIVAL_VTOL: {
    name: 'RIVAL VTOL', program: 'STRAFER',
    hp: 190, speed: 74, cruise: 58, radius: 2.8, score: 950,
    contactDamage: 20, contactRadius: 3.8, air: true,
    range: [30, 80], fireRange: 150, fireRate: 0.36, boltDamage: 7, boltSpeed: 185,
    turnRate: 1.15, accel: 34, color: 0xc04bff, neon: 0xe9b8ff,
    rival: true, desc: 'HOVER — orbital strafing runs'
  }
};

const PROGRAM_NAMES = [
  'RINZLER', 'MARA', 'PAGO', 'SARK', 'YORI', 'KORAX',
  'ABRAXAS', 'CROM', 'TESLER', 'JAHLIA', 'BECK'
];

const TAU = Math.PI * 2;
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;

function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

// ======================================================================
//  ONE RIVAL
// ======================================================================
export class Opponent {
  constructor(scene, type, position, waveScale = 1, program = null) {
    this.scene = scene;
    this.type = type;
    this.spec = OPPONENT_SPECS[type] || OPPONENT_SPECS.RIVAL_CYCLE;
    this.program = program || PROGRAM_NAMES[Math.floor(Math.random() * PROGRAM_NAMES.length)];
    this.isRival = true;

    const hpScale = 1 + (waveScale - 1) * 0.16;
    this.maxHealth = Math.round(this.spec.hp * Math.min(2.4, hpScale));
    this.health = this.maxHealth;
    this.hitRadius = this.spec.radius;
    this.damageScale = Math.min(2.0, 0.85 + (waveScale - 1) * 0.07);

    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.speed = this.spec.cruise * 0.6;
    this.yaw = Math.random() * TAU;
    this.pitch = 0;
    this.roll = 0;
    this.modelYaw = this.yaw;
    this.modelPitch = 0;

    this.fireTimer = 1.1 + Math.random() * 1.2;
    this.evadeTimer = 0;
    this.evadeDir = new THREE.Vector3(1, 0, 0);
    this.orbitSign = Math.random() < 0.5 ? -1 : 1;
    this.orbitTimer = 0;
    this.jinkTimer = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.isDirectlyBehindPlayer = false;
    this.attackRun = 0;
    this.trail = null;

    this.build();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  // ---------------------------------------------------------------- visuals
  build() {
    const neon = new THREE.MeshStandardMaterial({
      color: 0x2a0a3a, emissive: this.spec.neon, emissiveIntensity: 1.5,
      metalness: 0.6, roughness: 0.35
    });
    const hull = new THREE.MeshStandardMaterial({
      color: 0x0d0d16, metalness: 0.85, roughness: 0.32
    });
    const glow = new THREE.MeshBasicMaterial({
      color: this.spec.color, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    const g = new THREE.Group();
    const air = this.spec.air;

    // core wedge (all rivals share the family look, sizes differ)
    const coreLen = air ? 4.2 : 4.8;
    const coreGeo = new THREE.BoxGeometry(1.5, air ? 0.75 : 0.9, coreLen);
    const cp = coreGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      if (cp.getZ(i) < -coreLen * 0.3) {
        cp.setX(i, cp.getX(i) * 0.6);
        cp.setY(i, cp.getY(i) * 0.72);
      }
    }
    coreGeo.computeVertexNormals();
    g.add(new THREE.Mesh(coreGeo, hull));

    // neon spine + flanks
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, coreLen * 0.86), glow);
    spine.position.set(0, (air ? 0.44 : 0.52), 0);
    g.add(spine);
    for (const sx of [-0.78, 0.78]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, coreLen * 0.7), glow);
      strip.position.set(sx, 0.1, 0);
      g.add(strip);
    }

    // wings / rotor pods depending on configuration
    if (air) {
      for (const sx of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 1.9), hull);
        wing.position.set(sx * 1.9, 0.05, 0.35);
        wing.rotation.z = sx * (this.type === 'RIVAL_VTOL' ? 0.1 : 0.22);
        g.add(wing);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.07, 0.16), glow);
        edge.position.set(sx * 1.9, 0.1, -0.5);
        edge.rotation.z = sx * (this.type === 'RIVAL_VTOL' ? 0.1 : 0.22);
        g.add(edge);
      }
    } else {
      // wheels for the ground duelist
      for (const z of [-1.5, 1.5]) {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.19, 8, 20), hull);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(0, -0.35, z);
        g.add(wheel);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 20), glow);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(0, -0.35, z);
        g.add(ring);
      }
    }

    // engines
    const engCount = this.type === 'RIVAL_HEAVY' ? 2 : 1;
    this.plumes = [];
    for (let i = 0; i < engCount; i++) {
      const sx = engCount === 1 ? 0 : (i === 0 ? -1 : 1);
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.5, 10), hull);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(sx * 1.05, 0.05, coreLen * 0.45);
      g.add(eng);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.26, 2.0, 8), glow);
      plume.geometry.rotateX(-Math.PI / 2);
      plume.position.set(sx * 1.05, 0.05, coreLen * 0.45 + 1.6);
      g.add(plume);
      this.plumes.push(plume);
    }

    // identity halo: a violet ring that reads as "program, not construct"
    const halo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.06, 6, 28), glow);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = air ? -0.9 : -0.6;
    g.add(halo);
    this.halo = halo;

    // cockpit glass
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 10, 8, 0, TAU, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x1a0a24, metalness: 0.9, roughness: 0.15,
        emissive: this.spec.neon, emissiveIntensity: 0.35
      })
    );
    canopy.position.set(0, 0.4, -0.5);
    g.add(canopy);

    this.mesh = g;
    this.glowMat = glow;
  }

  // ---------------------------------------------------------------- damage
  takeDamage(amount) {
    if (this.dead) return false;
    this.health -= amount;
    this.hitFlash = 0.12;
    // being hurt triggers a break-off, so rivals feel alive rather than dumb
    if (this.health < this.maxHealth * 0.45 && this.evadeTimer <= 0.2) {
      this.evadeTimer = 1.6 + Math.random() * 1.6;
      const away = new THREE.Vector3(
        this.position.x - this.lastPlayerPos?.x || 0, 0,
        this.position.z - this.lastPlayerPos?.z || 0
      );
      if (away.lengthSq() < 0.01) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      this.evadeDir.copy(away.normalize());
    }
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  /** Arena protocol: this rival lays a lethal light wall behind it. */
  enableTrail() {
    if (this.trail) return;
    this.trail = new LightRibbon(this.scene, this.spec.color, 48, 0.55);
  }

  /** weapons.js asks enemies whether they died; match the contract. */
  isDead() {
    return this.dead;
  }

  destroy() {
    if (this.trail) {
      if (this.trail.mesh) this.scene.remove(this.trail.mesh);
      if (this.trail.mesh && this.trail.mesh.geometry) this.trail.mesh.geometry.dispose();
      if (this.trail.mat) this.trail.mat.dispose();
      this.trail = null;
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse((c) => {
        if (c.isMesh) {
          if (c.geometry) c.geometry.dispose();
        }
      });
      this.mesh = null;
    }
  }

  /** Pick a spawn point: on the grid, in front of the player, on the deck. */
  static spawnPoint(playerPos, vehicle, air, minDist = 190, spread = 90) {
    const angle = Math.random() * TAU;
    const dist = minDist + Math.random() * spread;
    const p = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * dist,
      air ? 22 + Math.random() * 26 : 1.2,
      playerPos.z + Math.sin(angle) * dist
    );
    return p;
  }

  // ---------------------------------------------------------------- the pilot
  update(delta, player, weaponSystem, ctx) {
    const sp = this.spec;
    this.lastPlayerPos = player.position;

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
    const dist = toPlayer.length();
    const dirToPlayer = dist > 0.001 ? toPlayer.clone().multiplyScalar(1 / dist) : new THREE.Vector3(0, 0, 1);

    // distance behind/ahead for the rear-laser HUD
    const playerFwd = player.getForwardDirection ? player.getForwardDirection() : new THREE.Vector3(0, 0, 1);
    const toRival = new THREE.Vector3().subVectors(this.position, player.position).normalize();
    this.isDirectlyBehindPlayer = toRival.dot(playerFwd) < -0.72 && dist < 60;

    // ---------------------------------------------------- decision
    this.orbitTimer -= delta;
    if (this.orbitTimer <= 0) {
      this.orbitTimer = 3.5 + Math.random() * 3;
      this.orbitSign *= -1;
    }

    let target = new THREE.Vector3();
    const lateral = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x).normalize();
    const leadTime = Math.min(1.4, dist / Math.max(20, this.speed));
    const aimPoint = player.position.clone().addScaledVector(player.velocity || new THREE.Vector3(), leadTime * 0.55);

    if (this.evadeTimer > 0) {
      this.evadeTimer -= delta;
      target = this.position.clone().addScaledVector(this.evadeDir, 70);
      target.y = sp.air ? clamp(this.position.y + 14, 12, 72) : 1.2;
    } else if (this.type === 'RIVAL_CYCLE') {
      // Duelist: cut across the player's nose rather than tail them
      const cut = aimPoint.clone().addScaledVector(playerFwd, 22).addScaledVector(lateral, this.orbitSign * 12);
      target = cut;
      target.y = 1.2;
    } else if (dist > sp.range[1]) {
      target = aimPoint;
      target.y = sp.air ? clamp(aimPoint.y + 8, 10, 70) : 1.2;
    } else if (dist < sp.range[0]) {
      target = this.position.clone()
        .addScaledVector(dirToPlayer, -46)
        .addScaledVector(lateral, this.orbitSign * 18);
      target.y = sp.air ? clamp(this.position.y + 10, 10, 70) : 1.2;
    } else {
      // in the pocket: orbit and keep the guns on the player
      target = player.position.clone()
        .addScaledVector(dirToPlayer, dist * 0.65)
        .addScaledVector(lateral, this.orbitSign * 52);
      target.y = sp.air ? clamp(player.position.y + (this.type === 'RIVAL_JET' ? 12 : 6), 10, 70) : 1.2;
    }

    // ---------------------------------------------------- structure avoidance
    const world = ctx && ctx.spawner ? ctx.spawner.world : null;
    if (world && world.queryColliders) {
      const ahead = this.position.clone().addScaledVector(dirToPlayer, 14);
      const hits = world.queryColliders(ahead.x, ahead.z, 12) || [];
      for (const c of hits) {
        const cx = (c.minX + c.maxX) / 2;
        const cz = (c.minZ + c.maxZ) / 2;
        if (this.position.y > c.maxY + 3) continue;      // flying clear over it
        const away = new THREE.Vector3(this.position.x - cx, 0, this.position.z - cz);
        if (away.lengthSq() < 0.001) away.set(1, 0, 0);
        away.normalize();
        target.addScaledVector(away, 55);
        if (sp.air) target.y = Math.max(target.y, c.maxY + 8);
      }
    }

    // ---------------------------------------------------- wall awareness
    // Arena riders must respect the light walls, or they derezz themselves and
    // each other within seconds (which is exactly what happened in testing).
    const director = ctx && ctx.spawner ? ctx.spawner.director : null;
    if (this.trail) {
      const walls = [];
      if (director) {
        for (const o of director.active) {
          if (o !== this && !o.dead && o.trail) walls.push(o.trail.samples);
        }
      }
      if (player.ribbon && player.ribbon.samples && player.ribbon.samples.length > 4) {
        walls.push(player.ribbon.samples);
      }
      for (const arr of walls) {
        for (let i = 0; i < arr.length; i += 3) {
          const sp = arr[i].pos || arr[i];
          const dxs = sp.x - this.position.x;
          const dzs = sp.z - this.position.z;
          const d2 = dxs * dxs + dzs * dzs;
          if (d2 < 225 && d2 > 0.01) {          // a 15 m bubble around every wall
            const d = Math.sqrt(d2);
            target.x -= (dxs / d) * 34;
            target.z -= (dzs / d) * 34;
          }
        }
      }
    }

    // ---------------------------------------------------- steering
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const desiredYaw = Math.atan2(dx, dz);
    const yawErr = wrapAngle(desiredYaw - this.yaw);
    const maxTurn = sp.turnRate * delta;
    const applied = clamp(yawErr, -maxTurn, maxTurn);
    this.yaw = wrapAngle(this.yaw + applied);
    this.modelYaw = this.yaw;

    // bank into the turn
    const bankTarget = clamp(-applied / Math.max(0.0001, maxTurn), -1, 1) * 0.5;
    this.roll = lerp(this.roll, bankTarget, 1 - Math.exp(-delta * 5));

    // vertical
    const dy = target.y - this.position.y;
    if (sp.air) {
      this.pitch = lerp(this.pitch, clamp(dy * 0.05, -0.5, 0.5), 1 - Math.exp(-delta * 4));
      this.position.y += clamp(dy, -26 * delta, 22 * delta);
      this.position.y = clamp(this.position.y, 8, 80);
    } else {
      this.pitch = 0;
      this.position.y = lerp(this.position.y, 1.2, 1 - Math.exp(-delta * 6));
    }
    this.modelPitch = this.pitch;

    // speed
    const wantSpeed = this.evadeTimer > 0 ? sp.speed * 1.15
      : dist > sp.range[1] ? sp.speed
      : sp.cruise;
    this.speed = lerp(this.speed, wantSpeed, 1 - Math.exp(-delta * (sp.accel / 22)));

    // integrate
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.velocity.copy(fwd).multiplyScalar(this.speed);
    this.position.addScaledVector(this.velocity, delta);

    // ---------------------------------------------------- weapons
    this.fireTimer -= delta;
    const facing = fwd.dot(dirToPlayer);
    if (this.fireTimer <= 0 && dist < sp.fireRange && facing > 0.9 && !this.dead) {
      const rate = sp.fireRate * (this.evadeTimer > 0 ? 1.6 : 1);
      this.fireTimer = rate;
      this.shoot(weaponSystem, dirToPlayer, dist);
    }

    // ---------------------------------------------------- light wall
    if (this.trail) {
      const tp = this.position.clone().addScaledVector(fwd, 2.2);
      tp.y = this.position.y - (sp.air ? 1.4 : -0.35);
      this.trail.update(tp, fwd.clone().negate(), true);
    }

    // ---------------------------------------------------- model sync
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.set(0, this.yaw, 0);
      this.mesh.rotateZ(this.roll);
      this.mesh.rotateX(this.pitch);

      const flick = 0.7 + Math.random() * 0.5;
      const thrust = 0.45 + (this.speed / sp.speed) * 0.9;
      for (const p of this.plumes) p.scale.set(thrust * flick, thrust * flick, thrust * (1 + Math.random() * 0.4));

      if (this.halo) {
        this.halo.rotation.z += delta * 2.2;
        this.halo.material.opacity = (0.45 + 0.25 * Math.sin(performance.now() * 0.004)) * (this.hitFlash > 0 ? 1.6 : 1);
      }

      if (this.hitFlash > 0) {
        this.hitFlash -= delta;
        this.glowMat.opacity = 0.75 + Math.min(1.5, this.hitFlash * 8);
      } else if (this.glowMat.opacity !== 0.75) {
        this.glowMat.opacity = 0.75;
      }
    }
  }

  shoot(weaponSystem, dirToPlayer, dist) {
    const sp = this.spec;
    // lead the shot a touch, then add deliberate scatter so it is dodgeable
    const lead = clamp(dist / sp.boltSpeed, 0, 0.9);
    const aim = dirToPlayer.clone();
    const spread = 0.035;
    aim.x += (Math.random() - 0.5) * spread;
    aim.y += (Math.random() - 0.5) * spread * 0.6;
    aim.z += (Math.random() - 0.5) * spread;
    aim.normalize();

    const origins = [];
    const count = this.type === 'RIVAL_HEAVY' ? 3 : this.type === 'RIVAL_VTOL' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 2.2;
      const side = new THREE.Vector3(-aim.z, 0, aim.x);
      const o = this.position.clone()
        .addScaledVector(aim, this.hitRadius + 1.4)
        .addScaledVector(side, off);
      o.y += 0.25;
      origins.push(o);
    }

    weaponSystem.spawnBolts({
      origins,
      direction: aim,
      speed: sp.boltSpeed,
      damage: sp.boltDamage * this.damageScale,
      isEnemy: true,
      color: sp.color,
      scale: 1.15
    });

    audio.playEnemyLaser && audio.playEnemyLaser();
    void lead;
  }
}

// ======================================================================
//  DIRECTOR — wave/endless spawning + HUD feed
// ======================================================================
export class OpponentDirector {
  constructor(scene, spawner, world, hud) {
    this.scene = scene;
    this.spawner = spawner;
    this.world = world;
    this.hud = hud;
    this.active = [];
    this.nextSpawn = Infinity;
    this.spawnedThisWave = 0;
    this.maxActive = 2;
    this.kills = 0;
    this.arenaMode = false;      // Light Cycle Arena: bikes only, ribbons live
  }

  clear() {
    for (const r of this.active) r.destroy();
    this.arenaMode = false;
    this.active.length = 0;
    this.spawnedThisWave = 0;
    this.nextSpawn = Infinity;
  }

  /** Called when a new wave starts. Wave 2 introduces the first rival. */
  spawnForWave(wave, vehicle) {
    this.spawnedThisWave = 0;
    if (wave < 2) return;
    this.maxActive = wave >= 6 ? 3 : 2;
    const count = this.arenaMode ? 3 : wave >= 4 ? 2 : 1;
    for (let i = 0; i < count; i++) this.spawnOne(wave, vehicle, i * 2.5);
  }

  /** Endless modes: keep a rival in play with a cooldown. */
  pollEndless(delta, wave, vehicle) {
    this.nextSpawn -= delta;
    const want = this.arenaMode ? 3 : Math.min(3, 1 + Math.floor(wave / 3));
    if (this.active.length < want && this.nextSpawn <= 0) {
      this.spawnOne(wave, vehicle, 0);
      this.nextSpawn = this.arenaMode ? 7 + Math.random() * 5 : 26 + Math.random() * 18;
    }
  }

  spawnOne(wave, vehicle, delay = 0) {
    const roll = Math.random();
    const type = this.arenaMode ? OPPONENT_TYPES.RIVAL_CYCLE
      : roll < 0.4 ? OPPONENT_TYPES.RIVAL_CYCLE
      : roll < 0.68 ? OPPONENT_TYPES.RIVAL_VTOL
      : roll < 0.88 ? OPPONENT_TYPES.RIVAL_JET
      : OPPONENT_TYPES.RIVAL_HEAVY;
    const spec = OPPONENT_SPECS[type];
    // Arena duels start in your mirrors; the open grid gets a longer approach.
    const pos = this.arenaMode
      ? Opponent.spawnPoint(vehicle.position, vehicle, false, 60, 55)
      : Opponent.spawnPoint(vehicle.position, vehicle, spec.air);
    const rival = new Opponent(this.scene, type, pos, wave, null);
    if (this.arenaMode) {
      rival.enableTrail();
      // bikes fight on the deck, so put them there
      rival.position.y = 1.2;
    }
    this.spawner.enemies.push(rival);
    this.active.push(rival);
    this.spawnedThisWave++;
    if (this.hud) {
      this.hud.showAlert(`⚔ RIVAL PROGRAM ONLINE // ${rival.program} — ${spec.name}`, true, 2600);
    }
    audio.playAlert && audio.playAlert();
  }

  /** Keep the roster in sync; drives the HUD panel. */
  update(delta, vehicle) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const r = this.active[i];
      if (r.dead || !r.mesh) {
        this.active.splice(i, 1);
        const idx = this.spawner.enemies.indexOf(r);
        if (idx >= 0) this.spawner.enemies.splice(idx, 1);
        const timeout = setTimeout(() => r.destroy(), 0);
        void timeout;
      }
    }
    if (this.hud && this.hud.setRivals) {
      this.hud.setRivals(this.active.map((r) => ({
        name: r.program,
        craft: r.spec.name,
        hp: Math.max(0, r.health / r.maxHealth),
        dist: r.position.distanceTo(vehicle.position),
        dead: r.dead
      })));
    }
  }
}
