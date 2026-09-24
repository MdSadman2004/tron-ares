import * as THREE from 'three';

/**
 * TRON: ARES — DILLINGER GRID VEHICLES (from the 2025 film)
 *
 *   JUMP JET      — Red Guard aerial combat vehicle: 4 wings, each deploying a
 *                   Light Ribbon; no cockpit, baton-rezzed. (Ares film)
 *   DART          — Dillinger Systems Amphibious Rapid Response Tank: M-1 rifle
 *                   gun + 2x M240 machine guns, 75 mph, rams through walls,
 *                   deployable Light Ram plough. (Ares film)
 *   LIGHT SKIMMER — open-topped skimmer that rides liquid surfaces and can
 *                   switch to a submersible configuration. (Ares film)
 *   LIGHT DRONE   — small baton-rezzed attack drone with ribbon emitters. (Ares film)
 *
 * All Dillinger Grid vehicles are black with red circuitry.
 */

export const ARES_VEHICLE_MODES = {
  JUMPJET: 'JUMPJET',
  DART: 'DART',
  SKIMMER: 'SKIMMER',
  LIGHTDRONE: 'LIGHTDRONE'
};

export const ARES_VEHICLE_SPECS = {
  JUMPJET: {
    id: 'JUMPJET',
    name: 'JUMP JET',
    icon: '🛫',
    desc: 'RED GUARD // RIBBON WINGS',
    key: '6',
    air: true,
    hoverHeight: 0.5,
    minCruise: 0,
    maxSpeed: 152,
    boostBonus: 60,
    accel: 52,
    brake: 70,
    drag: 14,
    turn: 1.9,
    climbRate: 46,
    armor: 0.10,
    ramDamage: 26,
    collisionRadius: 2.7,
    camera: { dist: 11.0, height: 4.4, scale: 1.2 },
    stats: { spd: 0.8, agi: 0.7, arm: 0.4 },
    weapons: {
      front: { name: 'JUMP JET PLASMA', rate: 0.13, damage: 44, speed: 230, color: 0xff0838, scale: 1.0 },
      rear: { name: 'REAR PULSE LASER', rate: 0.22, damage: 40, speed: 190, color: 0xff0838 },
      special: { name: '4× LIGHT RIBBON', key: 'Q', cd: 7.5, kind: 'RIBBON', count: 4, damage: 85, speed: 150 }
    },
    muzzles: {
      front: [[-0.62, 0.0, -2.0], [0.62, 0.0, -2.0]],
      rear: [[-0.30, 0.30, 2.4], [0.30, 0.30, 2.4]],
      ribbons: [[-1.6, 0.0, -0.4], [-0.55, 0.0, -0.4], [0.55, 0.0, -0.4], [1.6, 0.0, -0.4]]
    }
  },

  DART: {
    id: 'DART',
    name: 'DART TANK',
    icon: '🛡️',
    desc: 'AMPHIBIOUS RAPID RESPONSE',
    key: '7',
    air: false,
    hoverHeight: 1.1,
    minCruise: 10,
    maxSpeed: 120,
    boostBonus: 30,
    accel: 44,
    brake: 95,
    drag: 24,
    turn: 1.4,
    climbRate: 0,
    armor: 0.45,
    ramDamage: 95,
    collisionRadius: 3.4,
    camera: { dist: 11.5, height: 4.6, scale: 1.7 },
    stats: { spd: 0.45, agi: 0.25, arm: 1.0 },
    weapons: {
      front: { name: 'M-1 RIFLE GUN', rate: 0.55, damage: 115, speed: 185, color: 0xffaa00, scale: 2.2 },
      rear: { name: 'TWIN M240 MACHINE GUN', rate: 0.09, damage: 26, speed: 240, color: 0xff0838, scale: 0.8 },
      special: { name: 'LIGHT RAM PLOUGH', key: 'Q', cd: 9.0, kind: 'PLOUGH', duration: 4.5 }
    },
    muzzles: {
      front: [[0, 1.15, -4.1]],
      rear: [[-0.75, 1.0, 3.6], [0.75, 1.0, 3.6]]
    }
  },

  SKIMMER: {
    id: 'SKIMMER',
    name: 'LIGHT SKIMMER',
    icon: '🛶',
    desc: 'SURFACE SKIM // SUBMERSIBLE',
    key: '8',
    air: true,
    hover: true,
    hoverHeight: 1.4,
    minCruise: 0,
    maxSpeed: 132,
    boostBonus: 46,
    accel: 62,
    brake: 90,
    drag: 30,
    turn: 2.3,
    climbRate: 24,
    armor: 0.06,
    ramDamage: 24,
    collisionRadius: 2.3,
    camera: { dist: 10.5, height: 4.0, scale: 1.15 },
    stats: { spd: 0.7, agi: 0.8, arm: 0.35 },
    weapons: {
      front: { name: 'SKIM CANNON', rate: 0.12, damage: 31, speed: 235, color: 0x00f0ff, scale: 0.85 },
      rear: { name: 'REAR PULSE LASER', rate: 0.22, damage: 38, speed: 190, color: 0xff0838 },
      special: { name: 'SUBMERGE', key: 'Q', cd: 9.5, kind: 'SUBMERGE', duration: 3.6 }
    },
    muzzles: {
      front: [[-0.45, 0.85, -2.3], [0.45, 0.85, -2.3]],
      rear: [[-0.28, 1.0, 2.2], [0.28, 1.0, 2.2]]
    }
  },

  LIGHTDRONE: {
    id: 'LIGHTDRONE',
    name: 'LIGHT DRONE',
    icon: '🛸',
    desc: 'BATON-RES SMALL ATTACKER',
    key: '9',
    air: true,
    hover: true,
    hoverHeight: 0.8,
    minCruise: 0,
    maxSpeed: 168,
    boostBonus: 62,
    accel: 96,
    brake: 110,
    drag: 34,
    turn: 3.0,
    climbRate: 40,
    armor: 0.0,
    ramDamage: 20,
    collisionRadius: 1.2,
    camera: { dist: 7.2, height: 2.9, scale: 0.8 },
    stats: { spd: 0.85, agi: 1.0, arm: 0.15 },
    weapons: {
      front: { name: 'TWIN MICRO PULSE', rate: 0.09, damage: 16, speed: 260, color: 0xff0838, scale: 0.6 },
      rear: { name: 'REAR MICRO PULSE', rate: 0.2, damage: 30, speed: 200, color: 0xff0838, scale: 0.6 },
      special: { name: 'PHASE CLOAK', key: 'Q', cd: 8.0, kind: 'CLOAK', duration: 3.0 }
    },
    muzzles: {
      front: [[-0.3, 0.1, -1.2], [0.3, 0.1, -1.2]],
      rear: [[-0.22, 0.25, 1.1], [0.22, 0.25, 1.1]]
    }
  }
};

// ---------------------------------------------------------------------------
//  BUILDERS — each returns { group, parts }
// ---------------------------------------------------------------------------

/** JUMP JET: four ribbon wings, baton-rezzed, no cockpit. */
export function buildJumpJet(v) {
  const g = new THREE.Group();
  const parts = { plumes: [], spokes: [], rotors: [], ribbonTips: [] };

  // Compact arrow fuselage (no cockpit — program rides exposed)
  const fuse = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.6, 5), v.mats.carbon);
  fuse.geometry.rotateX(-Math.PI / 2);
  fuse.position.z = -0.6;
  g.add(fuse);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 3.4), v.mats.armor);
  spine.position.set(0, -0.05, 0.6);
  g.add(spine);

  // Red circuitry lines (Dillinger signature)
  for (const sx of [-0.42, 0.42]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 3.2), v.mats.neonRed);
    line.position.set(sx, 0.28, 0.6);
    g.add(line);
  }

  // Riding program (exposed, hands on the bars)
  const rider = v.createRider();
  rider.scale.setScalar(0.8);
  rider.position.set(0, 0.28, 0.35);
  g.add(rider);

  // FOUR wings — two upper, two lower — each with a Light Ribbon emitter
  const wingDefs = [
    [-1, 1], [1, 1],   // upper pair
    [-1, -1], [1, -1]  // lower pair
  ];
  for (const [sx, sy] of wingDefs) {
    const wing = v.createWing(2.1, 0.7, 1.5, sx > 0, { thickness: 0.05 });
    wing.position.set(0.35 * sx, 0.12 * sy, 0.3);
    wing.scale.y = sy > 0 ? 0.85 : -0.85;
    g.add(wing);

    // Ribbon emitter pod at each wingtip
    const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 8), v.mats.plate);
    emitter.rotation.z = Math.PI / 2;
    emitter.position.set(1.95 * sx, 0.12 * sy, 0.1);
    g.add(emitter);

    const ribbonTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.8, 6), v.mats.neonRed);
    ribbonTip.rotation.x = -Math.PI / 2;
    ribbonTip.position.set(1.95 * sx, 0.12 * sy, -0.6);
    ribbonTip.visible = false;
    g.add(ribbonTip);
    parts.ribbonTips.push(ribbonTip);
  }

  // Twin thrusters
  for (const sx of [-0.55, 0.55]) {
    const nozzle = v.createNozzle(0.3, 0.4, v.mats.carbon, v.mats.neonRed);
    nozzle.position.set(sx, -0.05, 2.35);
    g.add(nozzle);
    const plume = v.createPlume(0.24, 1.5, v.mats.neonRed, sx, -0.05, 2.95);
    plume.scale.setScalar(0.001);
    g.add(plume);
    parts.plumes.push(plume);
  }

  // Forward cannons
  const barrel = new THREE.CylinderGeometry(0.055, 0.065, 0.9, 8);
  barrel.rotateX(Math.PI / 2);
  for (const sx of [-0.62, 0.62]) {
    const b = new THREE.Mesh(barrel, v.mats.carbon);
    b.position.set(sx, 0.0, -1.85);
    g.add(b);
    const tip = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 6, 12), v.mats.neonRed);
    tip.position.set(sx, 0.0, -2.3);
    g.add(tip);
  }

  const turret = v.createTurret(1.1);
  turret.group.position.set(0, 0.15, 2.3);
  g.add(turret.group);

  return { group: g, parts };
}

/** DART: armoured amphibious tank — M-1 rifle gun, twin M240s, Light Ram plough. */
export function buildDart(v) {
  const g = new THREE.Group();
  const parts = { plumes: [], spokes: [], rotors: [], plough: null, wheels: [] };

  // Hull: big, boxy, heavy
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.3, 6.4), v.mats.carbon);
  hull.position.y = 0.85;
  g.add(hull);

  // Bevel the nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.0, 1.4), v.mats.armor);
  nose.position.set(0, 0.8, -3.4);
  nose.rotation.x = -0.12;
  g.add(nose);

  // Skirt armour plates
  for (const sx of [-1.75, 1.75]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 5.6), v.mats.plate);
    skirt.position.set(sx, 0.6, 0);
    g.add(skirt);
    const skirtNeon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 5.4), v.mats.neonRed);
    skirtNeon.position.set(sx * 1.06, 0.95, 0);
    g.add(skirtNeon);
  }

  // Six heavy road wheels per side (it can drive through walls)
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.42, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const sx of [-1.5, 1.5]) {
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(wheelGeo, v.mats.plate);
      w.position.set(sx, 0.55, -2.0 + i * 2.0);
      g.add(w);
      parts.wheels.push(w);
      const hub = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 14), v.mats.neonRed);
      hub.rotation.y = Math.PI / 2;
      hub.position.set(sx * 1.12, 0.55, -2.0 + i * 2.0);
      g.add(hub);
    }
  }

  // Turret with long M-1 rifle gun
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.7, 12), v.mats.armor);
  turretBase.position.set(0, 1.85, 0.2);
  g.add(turretBase);
  const turretNeon = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 6, 20), v.mats.neonRed);
  turretNeon.rotation.x = Math.PI / 2;
  turretNeon.position.set(0, 2.2, 0.2);
  g.add(turretNeon);

  const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 3.4, 10), v.mats.carbon);
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 1.95, -2.6);
  g.add(gunBarrel);
  const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.5, 10), v.mats.plate);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.set(0, 1.95, -4.15);
  g.add(muzzleBrake);

  // Twin M240 machine guns on the turret sides
  const mgGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.5, 8);
  mgGeo.rotateX(Math.PI / 2);
  for (const sx of [-0.78, 0.78]) {
    const mg = new THREE.Mesh(mgGeo, v.mats.carbon);
    mg.position.set(sx, 1.6, 1.3);
    g.add(mg);
  }

  // Crew hatch + antenna array
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.16, 10), v.mats.plate);
  hatch.position.set(-0.9, 2.4, 1.4);
  g.add(hatch);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), v.mats.carbon);
  antenna.position.set(1.2, 3.2, 2.4);
  g.add(antenna);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), v.mats.neonRed);
  antennaTip.position.set(1.2, 4.3, 2.4);
  g.add(antennaTip);

  // Rear engine block + exhausts
  const engine = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.9), v.mats.plate);
  engine.position.set(0, 1.0, 3.4);
  g.add(engine);
  for (const sx of [-1.0, 0, 1.0]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.6, 8), v.mats.carbon);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(sx, 1.65, 3.6);
    g.add(pipe);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 6, 12), v.mats.neonRed);
    glow.position.set(sx, 1.65, 3.9);
    g.add(glow);
  }

  // Deployable LIGHT RAM plough (hidden until the special fires)
  const plough = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(3.6, 1.5, 0.35);
  const blade = new THREE.Mesh(bladeGeo, v.mats.armor);
  blade.rotation.x = 0.35;
  plough.add(blade);
  const bladeEdge = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.18, 0.42), v.mats.neonRed);
  bladeEdge.position.set(0, -0.72, 0.2);
  bladeEdge.rotation.x = 0.35;
  plough.add(bladeEdge);
  // Ram tines
  for (const sx of [-1.5, -0.5, 0.5, 1.5]) {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.5), v.mats.neonRed);
    tine.position.set(sx, -0.55, -0.85);
    plough.add(tine);
  }
  plough.position.set(0, 0.9, -4.3);
  plough.visible = false;
  g.add(plough);
  parts.plough = plough;

  return { group: g, parts };
}

/** LIGHT SKIMMER: open-topped surface skimmer with submersible configuration. */
export function buildSkimmer(v) {
  const g = new THREE.Group();
  const parts = { plumes: [], spokes: [], rotors: [], wake: null };

  // Low, curved hull
  const hullGeo = new THREE.BoxGeometry(2.2, 0.6, 5.0);
  const hp = hullGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    const z = hp.getZ(i);
    if (z < -1.4) { hp.setX(i, hp.getX(i) * 0.55); hp.setY(i, hp.getY(i) * 0.8); }
    if (z > 1.6) { hp.setX(i, hp.getX(i) * 0.8); }
  }
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, v.mats.carbon);
  hull.position.y = 0.55;
  g.add(hull);

  // Prow wing
  const prow = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.2), v.mats.armor);
  prow.position.set(0, 0.5, -2.4);
  prow.rotation.x = 0.18;
  g.add(prow);
  const prowNeon = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.16), v.mats.neonRed);
  prowNeon.position.set(0, 0.46, -2.95);
  g.add(prowNeon);

  // Open cockpit: windscreen + exposed seats
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.08), v.mats.glass);
  screen.position.set(0, 1.05, -1.3);
  screen.rotation.x = -0.25;
  g.add(screen);
  for (const sx of [-0.42, 0.42]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.7), v.mats.plate);
    seat.position.set(sx, 0.9, -0.35);
    g.add(seat);
  }
  const rider = v.createRider();
  rider.scale.setScalar(0.85);
  rider.position.set(-0.42, 0.95, -0.3);
  g.add(rider);

  // Side sponsons with red circuitry
  for (const sx of [-1.15, 1.15]) {
    const sponson = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 3.6), v.mats.plate);
    sponson.position.set(sx, 0.65, 0.2);
    g.add(sponson);
    const neon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 3.4), v.mats.neonRed);
    neon.position.set(sx * 1.12, 0.82, 0.2);
    g.add(neon);
  }

  // Rear hydro-jets
  for (const sx of [-0.75, 0.75]) {
    const nozzle = v.createNozzle(0.26, 0.35, v.mats.carbon, v.mats.neonCyan);
    nozzle.position.set(sx, 0.6, 2.5);
    g.add(nozzle);
    const plume = v.createPlume(0.22, 1.3, v.mats.neonCyan, sx, 0.6, 3.05);
    plume.scale.setScalar(0.001);
    g.add(plume);
    parts.plumes.push(plume);
  }

  // Skeg fins under the hull
  for (const sz of [-1.4, 0.6]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.8), v.mats.plate);
    fin.position.set(0, 0.15, sz);
    g.add(fin);
  }

  // Hydro-lift pads (the "skimming" surfaces)
  for (const sx of [-1.0, 1.0]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.10, 3.2), v.mats.neonCyan);
    pad.position.set(sx, 0.22, 0.2);
    g.add(pad);
  }

  // Wake ribbon (visible while skimming fast)
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7), new THREE.MeshBasicMaterial({
    color: 0xff0838, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, depthWrite: false
  }));
  wake.rotation.x = -Math.PI / 2;
  wake.position.set(0, 0.12, 4.2);
  g.add(wake);
  parts.wake = wake;

  const turret = v.createTurret(0.9);
  turret.group.position.set(0, 1.05, 2.0);
  g.add(turret.group);

  return { group: g, parts };
}

/** LIGHT DRONE: small baton-rezzed attacker (what the Recognizer ejects). */
export function buildLightDrone(v) {
  const g = new THREE.Group();
  const parts = { plumes: [], spokes: [], rotors: [], ring: null, eye: null };

  // Central core
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), v.mats.carbon);
  g.add(core);
  const coreNeon = new THREE.Mesh(new THREE.OctahedronGeometry(0.88, 0), v.mats.neonRed);
  coreNeon.scale.setScalar(0.99);
  coreNeon.visible = false;
  g.add(coreNeon);

  // Gyro ring (spins)
  const ringGeo = new THREE.TorusGeometry(1.05, 0.07, 8, 26);
  const ring = new THREE.Mesh(ringGeo, v.mats.neonRed);
  g.add(ring);
  parts.ring = ring;
  const ring2 = new THREE.Mesh(ringGeo, v.mats.plate);
  ring2.rotation.x = Math.PI / 2;
  ring2.scale.setScalar(1.08);
  g.add(ring2);

  // Four stabiliser fins with micro ribbon emitters
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.85), v.mats.plate);
    fin.position.set(Math.cos(ang) * 0.95, 0, Math.sin(ang) * 0.95);
    fin.rotation.y = -ang;
    g.add(fin);
    const emitter = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 6), v.mats.neonRed);
    emitter.rotation.x = -Math.PI / 2;
    emitter.position.set(Math.cos(ang) * 1.35, 0, Math.sin(ang) * 1.35);
    g.add(emitter);
    parts.ribbonTips = parts.ribbonTips || [];
    parts.ribbonTips.push(emitter);
  }

  // Sensor eye
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), v.mats.neonAmber);
  eye.position.set(0, 0, -0.85);
  g.add(eye);
  parts.eye = eye;

  // Twin micro thrusters
  for (const sx of [-0.35, 0.35]) {
    const plume = v.createPlume(0.14, 0.8, v.mats.neonRed, sx, 0, 1.0);
    plume.scale.setScalar(0.001);
    g.add(plume);
    parts.plumes.push(plume);
  }

  // Riding program (small, leaning)
  const rider = v.createRider();
  rider.scale.setScalar(0.62);
  rider.position.set(0, 0.5, 0.1);
  g.add(rider);

  return { group: g, parts };
}

export const ARES_BUILDERS = {
  JUMPJET: buildJumpJet,
  DART: buildDart,
  SKIMMER: buildSkimmer,
  LIGHTDRONE: buildLightDrone
};
