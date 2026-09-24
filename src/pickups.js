import * as THREE from 'three';
import { audio } from './audio.js';

/**
 * TRON: ARES — GRID ENERGY CELLS
 * Collectible drops from derezzed enemies:
 *   SHIELD — restores 30% core integrity
 *   BOOST  — instantly refills the boost capacitor
 */

export const PICKUP_TYPES = {
  SHIELD: 'SHIELD',
  BOOST: 'BOOST'
};

const MAX_PICKUPS = 12;
const PICKUP_LIFETIME = 32;

export class PickupSystem {
  constructor(scene) {
    this.scene = scene;
    this.pickups = [];

    this.geo = new THREE.IcosahedronGeometry(0.7, 0);
    this.ringGeo = new THREE.TorusGeometry(1.0, 0.045, 6, 22);
    this.ringGeo.rotateX(Math.PI / 2);

    this.mats = {
      SHIELD: new THREE.MeshBasicMaterial({ color: 0x39ff88 }),
      BOOST: new THREE.MeshBasicMaterial({ color: 0xcc00ff })
    };
    this.ringMats = {
      SHIELD: new THREE.MeshBasicMaterial({ color: 0x39ff88, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending }),
      BOOST: new THREE.MeshBasicMaterial({ color: 0xcc00ff, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending })
    };
  }

  /** Roll a drop on enemy death. */
  maybeDrop(position, chance = 0.28) {
    if (this.pickups.length >= MAX_PICKUPS) return;
    if (Math.random() > chance) return;

    const type = Math.random() < 0.55 ? PICKUP_TYPES.SHIELD : PICKUP_TYPES.BOOST;

    const group = new THREE.Group();
    const core = new THREE.Mesh(this.geo, this.mats[type]);
    group.add(core);
    const ring = new THREE.Mesh(this.ringGeo, this.ringMats[type]);
    group.add(ring);

    const pos = position.clone();
    pos.y = Math.max(1.6, Math.min(pos.y, 60));

    group.position.copy(pos);
    this.scene.add(group);

    this.pickups.push({
      type,
      mesh: group,
      core,
      ring,
      life: PICKUP_LIFETIME,
      bobPhase: Math.random() * Math.PI * 2
    });
  }

  /**
   * @param {Vehicle} vehicle
   * @param {(type:string, amount:number)=>void} onCollect
   */
  update(delta, vehicle, onCollect) {
    const playerPos = vehicle.position;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= delta;

      // Idle animation
      p.bobPhase += delta * 2.2;
      p.mesh.position.y += Math.sin(p.bobPhase) * delta * 0.55;
      p.core.rotation.y += delta * 1.6;
      p.ring.rotation.z += delta * 1.1;

      // Blink before expiring
      if (p.life < 5) {
        p.mesh.visible = Math.floor(p.life * 8) % 2 === 0;
      }

      // Magnetise towards the player when close
      const dist = p.mesh.position.distanceTo(playerPos);
      if (dist < 26) {
        p.mesh.position.lerp(playerPos, Math.min(1, delta * (26 - dist) * 0.12));
      }

      if (dist < 5.0) {
        audio.playPickup();
        if (onCollect) onCollect(p.type, p.type === PICKUP_TYPES.SHIELD ? 30 : 100);
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.pickups.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.pickups = [];
  }
}
