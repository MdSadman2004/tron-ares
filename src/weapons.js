import * as THREE from 'three';
import { audio } from './audio.js';

/**
 * TRON: ARES — WEAPON & PROJECTILE SYSTEM
 *
 * Projectile kinds: LASER bolt, HEAVY bolt, MISSILE (homing), BOMB (gravity +
 * fuse), ROCKET (barrage). Plus expanding SHOCKWAVE rings (EMP / stomp /
 * overdrive), derezz explosions and hit flashes.
 *
 * Performance: shared geometries/materials, hard caps on live projectiles and
 * explosion effects, no per-bolt point lights (bloom carries the glow).
 */

const MAX_PROJECTILES = 170;
const MAX_EXPLOSIONS = 16;

export class WeaponSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
    this.explosions = [];

    // Shared geometry
    this.boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
    this.boltGeo.rotateX(Math.PI / 2);
    this.orbGeo = new THREE.IcosahedronGeometry(0.42, 1);
    this.missileGeo = new THREE.ConeGeometry(0.18, 0.9, 8);
    this.missileGeo.rotateX(-Math.PI / 2);
    this.ringGeo = new THREE.RingGeometry(1, 2, 40);
    this.ringGeo.rotateX(Math.PI / 2);
    this.sphereGeo = new THREE.SphereGeometry(1, 16, 12);

    // Material cache by colour
    this.matCache = new Map();
  }

  _mat(color, opacity = 0.95) {
    const key = `${color}_${opacity}`;
    if (!this.matCache.has(key)) {
      this.matCache.set(key, new THREE.MeshBasicMaterial({
        color, transparent: true, opacity
      }));
    }
    return this.matCache.get(key);
  }

  _addProjectile(entry) {
    if (this.projectiles.length >= MAX_PROJECTILES) {
      // Recycle the oldest projectile to keep the frame budget bounded
      const oldest = this.projectiles.shift();
      this.scene.remove(oldest.mesh);
    }
    this.projectiles.push(entry);
  }

  // ------------------------------------------------------------------
  //  PUBLIC SPAWNERS
  // ------------------------------------------------------------------

  /** Core bolt spawner. `origins` is an array of Vector3. */
  spawnBolts({ origins, direction, speed = 200, damage = 30, isEnemy = false, color = 0x00f0ff, scale = 1, life = 2.6, aoe = 0, killType = 'front' }) {
    if (!origins || origins.length === 0) return;
    const mat = this._mat(color);

    for (const origin of origins) {
      const mesh = new THREE.Mesh(this.boltGeo, mat);
      mesh.scale.setScalar(Math.max(0.5, scale));
      mesh.position.copy(origin);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
      this.scene.add(mesh);

      this._addProjectile({
        kind: 'BOLT',
        mesh,
        direction: direction.clone(),
        speed,
        damage,
        isEnemy,
        life,
        remaining: life,
        aoe,
        killType,
        color
      });
    }
  }

  /** Backwards-compatible dual salvo used by legacy call-sites. */
  spawnLaserSalvo(fireData, isEnemy = false) {
    if (!fireData) return;
    const origins = [];
    if (fireData.leftOrigin) origins.push(fireData.leftOrigin);
    if (fireData.rightOrigin) origins.push(fireData.rightOrigin);
    if (origins.length === 0 && fireData.origins) origins.push(...fireData.origins);

    const color = fireData.color || (isEnemy ? 0xffaa00 : (fireData.isRear ? 0xff0838 : 0x00f0ff));

    this.spawnBolts({
      origins,
      direction: fireData.direction,
      speed: fireData.speed || 200,
      damage: fireData.damage || 40,
      isEnemy,
      color,
      scale: fireData.scale || 1,
      killType: fireData.isRear ? 'rear' : 'front'
    });
  }

  /** Homing missiles. Targets are optional; missiles fly straight without. */
  spawnMissiles({ origins, direction, targets = [], damage = 60, aoe = 12, speed = 120, color = 0xff0838, isEnemy = false, life = 5 }) {
    if (!origins) return;

    for (let i = 0; i < origins.length; i++) {
      const origin = origins[i];
      const dir = direction.clone();
      // Slight launch spread so the salvo fans out
      const spread = (i - (origins.length - 1) / 2) * 0.18;
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
      dir.normalize();

      const group = new THREE.Group();
      const body = new THREE.Mesh(this.missileGeo, this._mat(color));
      group.add(body);
      const plume = new THREE.Mesh(this.missileGeo, this._mat(0xffaa00, 0.7));
      plume.scale.set(0.7, 1.6, 0.7);
      plume.position.z = 0.8;
      group.add(plume);

      group.position.copy(origin);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.scene.add(group);

      this._addProjectile({
        kind: 'MISSILE',
        mesh: group,
        direction: dir,
        speed,
        damage,
        isEnemy,
        aoe,
        life,
        remaining: life,
        killType: 'special',
        color,
        turnRate: 3.6,
        target: null,
        targets
      });
    }
  }

  /** Gravity bombs dropped from the bomb bay. */
  spawnBombs({ origins, direction, speed = 46, damage = 130, aoe = 30, color = 0xffaa00, isEnemy = false }) {
    if (!origins) return;

    for (const origin of origins) {
      const mesh = new THREE.Mesh(this.orbGeo, this._mat(color));
      mesh.scale.setScalar(1.25);
      mesh.position.copy(origin);
      this.scene.add(mesh);

      const vel = direction.clone().multiplyScalar(speed);
      vel.y -= 6;

      this._addProjectile({
        kind: 'BOMB',
        mesh,
        direction,
        vel,
        speed: 0,
        damage,
        isEnemy,
        aoe,
        life: 4.0,
        remaining: 4.0,
        killType: 'special',
        color,
        gravity: 34
      });
    }
  }

  /** Unguided rocket barrage (VTOL pods). */
  spawnBarrage({ origins, direction, speed = 105, damage = 45, aoe = 11, color = 0xffaa00, isEnemy = false }) {
    if (!origins) return;

    for (let i = 0; i < origins.length; i++) {
      const dir = direction.clone();
      const ang = (i / origins.length) * Math.PI * 2;
      const spread = 0.22;
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.cos(ang) * spread);
      dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(ang) * spread * 0.5);
      dir.normalize();

      const group = new THREE.Group();
      const body = new THREE.Mesh(this.missileGeo, this._mat(color));
      body.scale.setScalar(0.8);
      group.add(body);
      group.position.copy(origins[i]);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.scene.add(group);

      this._addProjectile({
        kind: 'ROCKET',
        mesh: group,
        direction: dir,
        speed,
        damage,
        isEnemy,
        aoe,
        life: 4,
        remaining: 4,
        killType: 'special',
        color
      });
    }
  }

  /** Expanding shockwave ring that damages once per entity. */
  spawnShockwave(origin, maxRadius = 60, damage = 80, isEnemy = false, color = null) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: color || (isEnemy ? 0xffaa00 : 0xcc00ff),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ringMesh = new THREE.Mesh(this.ringGeo, ringMat);
    ringMesh.position.copy(origin);
    ringMesh.position.y = Math.max(0.2, origin.y);
    this.scene.add(ringMesh);

    this.explosions.push({
      type: 'SHOCK',
      mesh: ringMesh,
      radius: 2,
      maxRadius,
      expansionSpeed: Math.max(60, maxRadius * 1.35),
      damage,
      isEnemy,
      age: 0,
      lifetime: 0.85,
      hit: new Set()
    });
  }

  spawnEMP(origin, radius = 62, damage = 85) {
    audio.playEMP();
    this.spawnShockwave(origin, radius, damage, false, 0xcc00ff);
  }

  /** Spectacular Tron derezz explosion. */
  spawnExplosion(position, color = 0xff0838, scale = 1) {
    audio.playExplosion();

    // Cap concurrent explosions (oldest gets cleaned immediately)
    while (this.explosions.length >= MAX_EXPLOSIONS) {
      const old = this.explosions.shift();
      this._cleanupExplosion(old);
    }

    const particleCount = Math.round(38 * scale);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 35 * scale,
        Math.random() * 25 * scale + 5,
        (Math.random() - 0.5) * 35 * scale
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color, size: 0.8 * scale, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    const sphereMat = new THREE.MeshBasicMaterial({
      color, wireframe: true, transparent: true, opacity: 0.8
    });
    const sphere = new THREE.Mesh(this.sphereGeo, sphereMat);
    sphere.position.copy(position);
    sphere.scale.setScalar(scale);
    this.scene.add(sphere);

    this.explosions.push({
      type: 'DEBRIS',
      particles,
      velocities,
      sphere,
      age: 0,
      lifetime: 0.8,
      scale
    });
  }

  /** Quick additive hit flash at an impact point. */
  spawnHitFlash(position, color = 0xffffff) {
    const mesh = new THREE.Mesh(this.sphereGeo, this._mat(color, 0.8));
    mesh.position.copy(position);
    mesh.scale.setScalar(1.1);
    this.scene.add(mesh);
    this.explosions.push({ type: 'FLASH', mesh, age: 0, lifetime: 0.14 });
  }

  // ------------------------------------------------------------------
  //  UPDATE
  // ------------------------------------------------------------------
  update(delta, enemies, playerVehicle, onEnemyKilled, onPlayerDamaged) {
    const playerRadius = (playerVehicle.spec ? playerVehicle.spec.collisionRadius : 2.0) + 1.0;

    // ---------------- Projectiles ----------------
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.remaining -= delta;

      // --- Movement
      if (p.kind === 'BOMB') {
        p.vel.y -= p.gravity * delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        p.mesh.rotation.x += delta * 5;
      } else {
        if (p.kind === 'MISSILE' && p.targets && p.targets.length) {
          // Acquire / update homing target (nearest live enemy)
          if (!p.target || p.target.health <= 0) {
            let best = null, bestD = 400;
            for (const e of p.targets) {
              const d = e.position.distanceTo(p.mesh.position);
              if (d < bestD) { bestD = d; best = e; }
            }
            p.target = best;
          }
          if (p.target) {
            const desired = new THREE.Vector3().subVectors(p.target.position, p.mesh.position).normalize();
            const angle = p.direction.angleTo(desired);
            if (angle > 0.001) {
              const t = Math.min(1, (p.turnRate * delta) / angle);
              p.direction.lerp(desired, t).normalize();
              p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.direction);
            }
          }
        }
        p.mesh.position.addScaledVector(p.direction, p.speed * delta);
      }

      // --- Ground / lifetime
      if (p.mesh.position.y < 0.4) {
        this._detonate(p, enemies, playerVehicle, onEnemyKilled, onPlayerDamaged);
        this._removeProjectile(i);
        continue;
      }
      if (p.remaining <= 0) {
        this._removeProjectile(i);
        continue;
      }

      // --- Collisions
      if (!p.isEnemy) {
        let hit = false;
        for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = enemies[eIdx];
          const hitR = enemy.hitRadius + (p.kind === 'BOLT' ? 0.6 : 1.2);
          if (p.mesh.position.distanceTo(enemy.position) < hitR) {
            audio.playHit();
            if (p.aoe > 0) {
              this._applyAreaDamage(enemy.position.clone(), p.aoe, p.damage, false, enemies, playerVehicle, onEnemyKilled, onPlayerDamaged);
              this.spawnExplosion(p.mesh.position, p.color || 0xffaa00, 1.0);
            } else {
              enemy.takeDamage(p.damage);
              this.spawnHitFlash(p.mesh.position, p.color || 0x00f0ff);
            }

            if (enemy.isDead()) {
              this._killEnemy(enemy, p.killType, enemies, eIdx, onEnemyKilled);
            }
            hit = true;
            break;
          }
        }
        if (hit) {
          this._removeProjectile(i);
          continue;
        }
      } else {
        // Enemy projectile vs player
        if (p.mesh.position.distanceTo(playerVehicle.position) < playerRadius) {
          audio.playHit();
          this.spawnHitFlash(p.mesh.position, 0xffaa00);
          if (onPlayerDamaged) onPlayerDamaged(p.damage, p.mesh.position.clone());
          this._removeProjectile(i);
          continue;
        }
      }
    }

    // ---------------- Explosions / shocks ----------------
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.age += delta;

      if (exp.type === 'SHOCK') {
        exp.radius += exp.expansionSpeed * delta;
        exp.mesh.scale.set(exp.radius, 1, exp.radius);
        exp.mesh.material.opacity = Math.max(0, 1 - exp.age / exp.lifetime);

        if (exp.isEnemy) {
          const d = exp.mesh.position.distanceTo(playerVehicle.position);
          if (d < exp.radius && !exp.hit.has('player')) {
            exp.hit.add('player');
            if (onPlayerDamaged) onPlayerDamaged(exp.damage, exp.mesh.position.clone());
          }
        } else {
          for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
            const enemy = enemies[eIdx];
            if (exp.hit.has(enemy)) continue;
            if (exp.mesh.position.distanceTo(enemy.position) < exp.radius + enemy.hitRadius * 0.5) {
              exp.hit.add(enemy);
              enemy.takeDamage(exp.damage);
              if (enemy.isDead()) this._killEnemy(enemy, 'special', enemies, eIdx, onEnemyKilled);
            }
          }
        }

        if (exp.age >= exp.lifetime) {
          this._cleanupExplosion(exp);
          this.explosions.splice(i, 1);
        }
        continue;
      }

      if (exp.type === 'FLASH') {
        const s = 1.1 + exp.age * 18;
        exp.mesh.scale.setScalar(s);
        exp.mesh.material.opacity = Math.max(0, 0.8 * (1 - exp.age / exp.lifetime));
        if (exp.age >= exp.lifetime) {
          this._cleanupExplosion(exp);
          this.explosions.splice(i, 1);
        }
        continue;
      }

      // DEBRIS explosion
      const posAttr = exp.particles.geometry.attributes.position;
      const positions = posAttr.array;
      for (let pIdx = 0; pIdx < exp.velocities.length; pIdx++) {
        const vel = exp.velocities[pIdx];
        positions[pIdx * 3] += vel.x * delta;
        positions[pIdx * 3 + 1] += vel.y * delta;
        positions[pIdx * 3 + 2] += vel.z * delta;
        vel.y -= 25 * delta;
        vel.multiplyScalar(0.97);
      }
      posAttr.needsUpdate = true;

      const sphereScale = (1 + exp.age * 22) * (exp.scale || 1);
      exp.sphere.scale.setScalar(sphereScale);
      exp.sphere.material.opacity = Math.max(0, 0.8 - exp.age / exp.lifetime);

      if (exp.age >= exp.lifetime) {
        this._cleanupExplosion(exp);
        this.explosions.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------------------------
  //  INTERNALS
  // ------------------------------------------------------------------
  _detonate(p, enemies, playerVehicle, onEnemyKilled, onPlayerDamaged) {
    if (p.aoe > 0) {
      this._applyAreaDamage(p.mesh.position.clone(), p.aoe, p.damage, p.isEnemy, enemies, playerVehicle, onEnemyKilled, onPlayerDamaged);
      this.spawnExplosion(p.mesh.position, p.color || 0xffaa00, 1.1);
    } else {
      this.spawnExplosion(p.mesh.position, p.color || 0x00f0ff, 0.6);
    }
  }

  _applyAreaDamage(center, radius, damage, isEnemy, enemies, playerVehicle, onEnemyKilled, onPlayerDamaged) {
    audio.playExplosion();
    if (isEnemy) {
      if (playerVehicle.position.distanceTo(center) < radius + 2) {
        if (onPlayerDamaged) onPlayerDamaged(damage, center);
      }
      return;
    }

    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const enemy = enemies[eIdx];
      if (enemy.position.distanceTo(center) < radius + enemy.hitRadius * 0.5) {
        enemy.takeDamage(damage);
        if (enemy.isDead()) this._killEnemy(enemy, 'special', enemies, eIdx, onEnemyKilled);
      }
    }
  }

  _killEnemy(enemy, killType, enemies, index, onEnemyKilled) {
    this.spawnExplosion(enemy.position.clone(), 0xff0838, enemy.spec && enemy.spec.boss ? 2.2 : 1.0);
    if (onEnemyKilled) onEnemyKilled(enemy, killType);
    enemy.destroy();
    enemies.splice(index, 1);
  }

  _removeProjectile(index) {
    const p = this.projectiles[index];
    if (!p) return;
    this.scene.remove(p.mesh);
    this.projectiles.splice(index, 1);
  }

  _cleanupExplosion(exp) {
    if (exp.type === 'SHOCK') {
      this.scene.remove(exp.mesh);
      exp.mesh.material.dispose();
    } else if (exp.type === 'FLASH') {
      this.scene.remove(exp.mesh);
    } else if (exp.type === 'DEBRIS') {
      this.scene.remove(exp.particles);
      this.scene.remove(exp.sphere);
      exp.particles.geometry.dispose();
      exp.particles.material.dispose();
      exp.sphere.material.dispose();
    }
  }

  clear() {
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    this.projectiles = [];
    for (const exp of this.explosions) this._cleanupExplosion(exp);
    this.explosions = [];
  }
}
