import * as THREE from 'three';

/**
 * GRID PROTOCOL — MORPHING CHASSIS RIG
 *
 * One physical machine that reconfigures itself. Every mode is a POSE TABLE
 * over the same articulated parts — nothing is swapped or cross-faded. During
 * a transformation each part travels to its new place with its own stagger
 * (wheels tuck first, wings unfold, engines slide back, turret locks), flaring
 * outward mid-morph before settling, exactly like a Transformer conversion.
 *
 * Parts: core, nose, canopy, wheelF, wheelR, wingUL/UR, wingLL/LR, engL/R,
 *        engXL/XR, engC, turret, plough, rotorPods, foils, ring, wake, arms.
 */

const P = (x, y, z) => [x, y, z];
const R = (x, y, z) => [x, y, z];
const S = (x, y, z) => [x, y, z];

export class ChassisRig {
  constructor(vehicle) {
    this.v = vehicle;
    this.mats = vehicle.mats;
    this.parts = {};
    this.root = new THREE.Group();
    this.root.rotation.order = 'YXZ';
    vehicle.mesh.add(this.root);

    this.build();
    this.morph = null;
    this.mode = 'CYCLE';
    this.time = 0;
  }

  // ------------------------------------------------------------------
  //  BUILD THE SHARED MACHINE
  // ------------------------------------------------------------------
  build() {
    const m = this.mats;

    // --- core fuselage -------------------------------------------------
    const coreGeo = new THREE.BoxGeometry(1.1, 0.7, 3.6);
    const cp = coreGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const z = cp.getZ(i);
      if (z < -1.0) { cp.setX(i, cp.getX(i) * 0.72); cp.setY(i, cp.getY(i) * 0.8); }
      if (z > 1.2) { cp.setX(i, cp.getX(i) * 0.9); }
    }
    coreGeo.computeVertexNormals();
    const core = new THREE.Group();
    core.add(new THREE.Mesh(coreGeo, m.carbon));
    for (const sx of [-0.52, 0.52]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 3.3), m.neonRed);
      strip.position.set(sx, 0.2, 0);
      core.add(strip);
    }
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 3.1), m.neonCyan);
    spine.position.set(0, 0.37, 0);
    core.add(spine);
    this.register('core', core);

    // --- nose ----------------------------------------------------------
    const nose = new THREE.Group();
    const noseGeo = new THREE.ConeGeometry(0.46, 1.5, 5);
    noseGeo.rotateX(-Math.PI / 2);
    nose.add(new THREE.Mesh(noseGeo, m.armor));
    const noseNeon = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 14), m.neonCyan);
    noseNeon.position.z = -0.6;
    nose.add(noseNeon);
    this.register('nose', nose);

    // --- canopy --------------------------------------------------------
    const canopy = new THREE.Group();
    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.glass
    );
    canopy.add(glass);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 18, Math.PI), m.neonRed);
    seam.rotation.x = Math.PI / 2;
    canopy.add(seam);
    this.register('canopy', canopy);

    // --- wheels --------------------------------------------------------
    for (const [name, z] of [['wheelF', -1.5], ['wheelR', 1.45]]) {
      const g = new THREE.Group();
      const rimGeo = new THREE.TorusGeometry(0.45, 0.14, 12, 32);
      rimGeo.rotateY(Math.PI / 2);
      g.add(new THREE.Mesh(rimGeo, m.plate));
      const neon = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 8, 32), m.neonRed);
      neon.rotation.y = Math.PI / 2;
      g.add(neon);
      const spokes = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.76, 0.04), m.neonRed);
        s.geometry.rotateX((i * Math.PI) / 4);
        spokes.add(s);
      }
      g.add(spokes);
      g.userData.spokes = spokes;
      g.position.set(0, 0.45, z);
      this.register(name, g);
    }

    // --- wings (upper + lower pairs) -----------------------------------
    const wingPoses = [
      ['wingUL', -1, 1], ['wingUR', 1, 1],
      ['wingLL', -1, -1], ['wingLR', 1, -1]
    ];
    for (const [name, sx, sy] of wingPoses) {
      const g = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(2.4 * sx, -0.8);
      shape.lineTo(2.0 * sx, -1.7);
      shape.lineTo(0, -0.6);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
      geo.rotateX(Math.PI / 2);
      g.add(new THREE.Mesh(geo, m.armor));
      const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.5, 6), m.neonRed);
      edge.rotation.z = sx > 0 ? -0.32 : 0.32;
      edge.rotation.x = Math.PI / 2;
      edge.position.set(1.15 * sx, 0, -0.35);
      g.add(edge);
      const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.5), m.neonRed);
      winglet.position.set(2.25 * sx, 0.2, -1.0);
      g.add(winglet);
      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.44, 8), m.plate);
      emitter.rotation.z = Math.PI / 2;
      emitter.position.set(2.15 * sx, 0, 0.1);
      g.add(emitter);
      g.scale.y = sy > 0 ? 1 : -1;
      this.register(name, g);
    }

    // --- engines -------------------------------------------------------
    for (const [name, sx] of [['engL', -1], ['engR', 1]]) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 2.4, 12), m.plate);
      body.rotation.x = Math.PI / 2;
      g.add(body);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.4, 12), m.carbon);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.z = 1.3;
      g.add(nozzle);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.05, 8, 16), m.neonRed);
      ring.position.z = 1.5;
      g.add(ring);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.6, 10), m.neonRed);
      plume.geometry.rotateX(-Math.PI / 2);
      plume.position.z = 1.9;
      plume.scale.setScalar(0.001);
      g.add(plume);
      g.userData.plume = plume;
      this.register(name, g);
    }
    for (const [name, sx] of [['engXL', -1], ['engXR', 1]]) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 2.2, 12), m.plate);
      body.rotation.x = Math.PI / 2;
      g.add(body);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.5, 10), m.neonRed);
      plume.geometry.rotateX(-Math.PI / 2);
      plume.position.z = 1.8;
      plume.scale.setScalar(0.001);
      g.add(plume);
      g.userData.plume = plume;
      this.register(name, g);
    }
    {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 2.2, 12), m.plate);
      body.rotation.x = Math.PI / 2;
      g.add(body);
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.8, 10), m.neonRed);
      plume.geometry.rotateX(-Math.PI / 2);
      plume.position.z = 1.8;
      plume.scale.setScalar(0.001);
      g.add(plume);
      g.userData.plume = plume;
      this.register('engC', g);
    }

    // --- rear turret ----------------------------------------------------
    const turret = new THREE.Group();
    turret.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.48), m.armor));
    const barrelGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.7, 12);
    barrelGeo.rotateX(-Math.PI / 2);
    turret.userData.flashes = [];
    for (const sx of [-0.25, 0.25]) {
      const barrel = new THREE.Mesh(barrelGeo, m.carbon);
      barrel.position.set(sx, 0.02, 0.3);
      turret.add(barrel);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 16), m.neonRed);
      ring.position.set(sx, 0.02, 0.6);
      turret.add(ring);
      const flash = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 8), m.neonRed);
      flash.geometry.rotateX(-Math.PI / 2);
      flash.position.set(sx, 0.02, 0.86);
      flash.visible = false;
      turret.add(flash);
      turret.userData.flashes.push(flash);
    }
    this.register('turret', turret);

    // --- Light Ram plough (DART) ----------------------------------------
    const plough = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 0.32), m.armor);
    blade.rotation.x = 0.35;
    plough.add(blade);
    const bladeEdge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.18, 0.4), m.neonRed);
    bladeEdge.position.set(0, -0.68, 0.22);
    bladeEdge.rotation.x = 0.35;
    plough.add(bladeEdge);
    for (const sx of [-1.4, -0.5, 0.5, 1.4]) {
      const tine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.4), m.neonRed);
      tine.position.set(sx, -0.5, -0.8);
      plough.add(tine);
    }
    this.register('plough', plough);

    // --- VTOL rotor pods -------------------------------------------------
    const rotors = new THREE.Group();
    rotors.userData.rotors = [];
    for (const [x, z] of [[-1.9, -0.9], [1.9, -0.9], [-1.9, 1.1], [1.9, 1.1]]) {
      const pod = new THREE.Group();
      pod.position.set(x, 0.9, z);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x) * 0.9, 0.16, 0.42), m.armor);
      arm.position.set(-x * 0.45, -0.2, 0);
      pod.add(arm);
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 12), m.plate);
      pod.add(housing);
      const rotor = new THREE.Group();
      rotor.position.y = 0.3;
      rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), m.carbon));
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.025, 0.14), m.plate);
        blade.rotation.y = (b * Math.PI * 2) / 3;
        blade.position.x = Math.cos((b * Math.PI * 2) / 3) * 0.75;
        blade.position.z = -Math.sin((b * Math.PI * 2) / 3) * 0.75;
        rotor.add(blade);
      }
      rotor.add(new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.02, 6, 24), m.neonCyan));
      pod.add(rotor);
      rotors.add(pod);
      rotors.userData.rotors.push(rotor);
    }
    this.register('rotorPods', rotors);

    // --- hydrofoils (SKIMMER) -------------------------------------------
    for (const [name, sx] of [['foilL', -1], ['foilR', 1]]) {
      const g = new THREE.Group();
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 3.0), m.neonCyan);
      g.add(pad);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.8), m.plate);
      fin.position.set(0, -0.3, 0.4);
      g.add(fin);
      this.register(name, g);
    }

    // --- ion ring (HYPER gyro / drone) ----------------------------------
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.05, 8, 40), m.neonCyan);
    ring.rotation.x = Math.PI / 2;
    this.register('ring', ring);

    // --- wake (SKIMMER) --------------------------------------------------
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7), new THREE.MeshBasicMaterial({
      color: 0xff0838, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false
    }));
    wake.rotation.x = -Math.PI / 2;
    this.register('wake', wake);

    // --- shoulders: the articulated arms (reuse the vehicle's builder) ---
    this.armGroups = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.20, 0.20), m.plate);
      upper.position.x = side * 0.26;
      arm.add(upper);
      const elbow = new THREE.Group();
      elbow.position.x = side * 0.52;
      arm.add(elbow);
      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.15, 0.15), m.carbon);
      forearm.position.x = side * 0.34;
      elbow.add(forearm);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), m.neonRed);
      edge.position.set(side * 0.36, 0.11, 0);
      elbow.add(edge);
      const emitter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), m.neonCyan);
      emitter.position.x = side * 0.7;
      elbow.add(emitter);
      this.root.add(arm);
      this.armGroups.push({ group: arm, elbow, side });
    }
  }

  register(name, obj) {
    obj.position.set(0, 0, 0);
    this.root.add(obj);
    this.parts[name] = obj;
    return obj;
  }

  // ------------------------------------------------------------------
  //  MODE POSE TABLES  (position / rotation / scale per part)
  // ------------------------------------------------------------------
  static POSES = {
    CYCLE: {
      core:     { p: P(0, 0.55, 0),     r: R(0, 0, 0),          s: S(1, 0.95, 1) },
      nose:     { p: P(0, 0.5, -2.05),  r: R(0, 0, 0),          s: S(1, 0.9, 1) },
      canopy:   { p: P(0, 0.86, -0.45), r: R(0, 0, 0),          s: S(1, 0.8, 1.5) },
      wheelF:   { p: P(0, 0.45, -1.5),  r: R(0, 0, 0),          s: S(1, 1, 1) },
      wheelR:   { p: P(0, 0.48, 1.45),  r: R(0, 0, 0),          s: S(1, 1, 1) },
      wingUL:   { p: P(-0.42, 0.6, 0.2), r: R(0, 0, -1.15),     s: S(0.6, 1, 0.6) },
      wingUR:   { p: P(0.42, 0.6, 0.2),  r: R(0, 0, 1.15),      s: S(0.6, 1, 0.6) },
      wingLL:   { p: P(-0.42, 0.5, 0.2), r: R(0, 0, -1.15),     s: S(0.6, 1, 0.6) },
      wingLR:   { p: P(0.42, 0.5, 0.2),  r: R(0, 0, 1.15),      s: S(0.6, 1, 0.6) },
      engL:     { p: P(-0.3, 0.5, 1.6),  r: R(0, 0, 0),         s: S(0.55, 0.55, 0.6) },
      engR:     { p: P(0.3, 0.5, 1.6),   r: R(0, 0, 0),         s: S(0.55, 0.55, 0.6) },
      engXL:    { p: P(-0.55, 0.35, 1.9), r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(0.55, 0.35, 1.9),  r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.45, 1.9),     r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 0.68, 1.65),  r: R(0, 0, 0),         s: S(1, 1, 1) },
      plough:   { p: P(0, 0.5, -2.3),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-0.9, 0.3, 0.2), r: R(0, 0, -1.3),      s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(0.9, 0.3, 0.2),  r: R(0, 0, 1.3),       s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.4, 0.9),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.12, 4.2),   r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(0.62, 0.72, 0.30), r: R(0, 0, 0),       s: S(1, 1, 1), spread: 1.0 },
      rider:    { p: P(0, 0.55, 0.15),  r: R(0, 0, 0),         s: S(1, 1, 1) }
    },

    JET: {
      core:     { p: P(0, 0.72, 0.1),   r: R(0, 0, 0),          s: S(0.95, 0.85, 1.2) },
      nose:     { p: P(0, 0.62, -2.45), r: R(0, 0, 0),          s: S(0.95, 0.95, 1.35) },
      canopy:   { p: P(0, 0.88, -0.35), r: R(0, 0, 0),          s: S(1, 0.75, 1.85) },
      wheelF:   { p: P(0, 0.95, -0.85), r: R(1.35, 0, 0),       s: S(0.3, 0.3, 0.3) },
      wheelR:   { p: P(0, 0.95, 0.95),  r: R(1.35, 0, 0),       s: S(0.3, 0.3, 0.3) },
      wingUL:   { p: P(-0.75, 0.68, 0.55), r: R(0, 0.05, 0.12), s: S(1.3, 1, 1.25) },
      wingUR:   { p: P(0.75, 0.68, 0.55),  r: R(0, -0.05, -0.12), s: S(1.3, 1, 1.25) },
      wingLL:   { p: P(-0.75, 0.55, 0.6),  r: R(0, 0, -0.5),    s: S(0.8, 1, 0.8) },
      wingLR:   { p: P(0.75, 0.55, 0.6),   r: R(0, 0, 0.5),     s: S(0.8, 1, 0.8) },
      engL:     { p: P(-0.85, 0.62, 1.2), r: R(0, 0, 0),        s: S(1, 1, 1.15) },
      engR:     { p: P(0.85, 0.62, 1.2),  r: R(0, 0, 0),        s: S(1, 1, 1.15) },
      engXL:    { p: P(-1.6, 0.5, 1.2),   r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(1.6, 0.5, 1.2),    r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.62, 1.9),     r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 0.85, 2.1),   r: R(0, 0, 0),         s: S(1.1, 1.1, 1.1) },
      plough:   { p: P(0, 0.6, -2.4),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-0.9, 0.4, 0.4), r: R(0, 0, -1.3),      s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(0.9, 0.4, 0.4),  r: R(0, 0, 1.3),       s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.6, 1.0),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.3, 4.0),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(0.92, 0.60, 0.30), r: R(0, 0, 0),       s: S(1, 1, 1), spread: 1.0 },
      rider:    { p: P(0, 0.45, 0.1),   r: R(-0.35, 0, 0),     s: S(0.62, 0.62, 0.62) }
    },

    HEAVY: {
      core:     { p: P(0, 0.98, 0.2),   r: R(0, 0, 0),          s: S(1.75, 1.5, 1.85) },
      nose:     { p: P(0, 0.85, -3.1),  r: R(0, 0, 0),          s: S(1.5, 1.25, 1.1) },
      canopy:   { p: P(0, 1.15, -1.4),  r: R(0, 0, 0),          s: S(1.25, 0.7, 1.9) },
      wheelF:   { p: P(0, 1.1, -1.2),   r: R(1.4, 0, 0),        s: S(0.3, 0.3, 0.3) },
      wheelR:   { p: P(0, 1.1, 1.3),    r: R(1.4, 0, 0),        s: S(0.3, 0.3, 0.3) },
      wingUL:   { p: P(-1.3, 0.95, 1.1), r: R(0, 0.06, 0.1),    s: S(1.9, 1.2, 1.6) },
      wingUR:   { p: P(1.3, 0.95, 1.1),  r: R(0, -0.06, -0.1),  s: S(1.9, 1.2, 1.6) },
      wingLL:   { p: P(-1.3, 0.75, 1.2), r: R(0, 0, -0.45),     s: S(1.1, 1, 1.0) },
      wingLR:   { p: P(1.3, 0.75, 1.2),  r: R(0, 0, 0.45),      s: S(1.1, 1, 1.0) },
      engL:     { p: P(-1.35, 0.72, 1.6), r: R(0, 0, 0),        s: S(1.35, 1.35, 1.3) },
      engR:     { p: P(1.35, 0.72, 1.6),  r: R(0, 0, 0),        s: S(1.35, 1.35, 1.3) },
      engXL:    { p: P(-2.6, 0.72, 1.6),  r: R(0, 0, 0),        s: S(1.2, 1.2, 1.2) },
      engXR:    { p: P(2.6, 0.72, 1.6),   r: R(0, 0, 0),        s: S(1.2, 1.2, 1.2) },
      engC:     { p: P(0, 0.9, 2.2),      r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 1.15, 2.9),   r: R(0, 0, 0),         s: S(1.7, 1.7, 1.7) },
      plough:   { p: P(0, 0.9, -3.4),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-1.4, 0.6, 0.6), r: R(0, 0, -1.3),      s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(1.4, 0.6, 0.6),  r: R(0, 0, 1.3),       s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.9, 1.2),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.4, 4.4),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(1.4, 0.95, 0.55), r: R(0, 0, 0),        s: S(1, 1, 1), spread: 1.35 },
      rider:    { p: P(0, 1.0, 0.2),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) }
    },

    VTOL: {
      core:     { p: P(0, 0.8, 0),      r: R(0, 0, 0),          s: S(1.35, 1.2, 1.3) },
      nose:     { p: P(0, 0.75, -2.2),  r: R(0, 0, 0),          s: S(1.15, 1, 1.0) },
      canopy:   { p: P(0, 1.05, -1.0),  r: R(0, 0, 0),          s: S(1.2, 0.8, 1.6) },
      wheelF:   { p: P(0, 1.0, -1.0),   r: R(1.35, 0, 0),       s: S(0.28, 0.28, 0.28) },
      wheelR:   { p: P(0, 1.0, 1.1),    r: R(1.35, 0, 0),       s: S(0.28, 0.28, 0.28) },
      wingUL:   { p: P(-1.0, 0.85, 0.1), r: R(0, 0.05, 0.08),   s: S(1.05, 1, 1.0) },
      wingUR:   { p: P(1.0, 0.85, 0.1),  r: R(0, -0.05, -0.08), s: S(1.05, 1, 1.0) },
      wingLL:   { p: P(-1.0, 0.7, 0.2),  r: R(0, 0, -1.2),      s: S(0.45, 1, 0.45) },
      wingLR:   { p: P(1.0, 0.7, 0.2),   r: R(0, 0, 1.2),       s: S(0.45, 1, 0.45) },
      engL:     { p: P(-0.95, 0.68, 1.5), r: R(0, 0, 0),        s: S(0.85, 0.85, 0.9) },
      engR:     { p: P(0.95, 0.68, 1.5),  r: R(0, 0, 0),        s: S(0.85, 0.85, 0.9) },
      engXL:    { p: P(-1.8, 0.6, 1.4),   r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(1.8, 0.6, 1.4),    r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.8, 1.9),      r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 1.0, 1.85),   r: R(0, 0, 0),         s: S(1.25, 1.25, 1.25) },
      plough:   { p: P(0, 0.7, -2.6),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0.15, 0),     r: R(0, 0, 0),         s: S(1, 1, 1) },
      foilL:    { p: P(-0.95, 0.45, 0.4), r: R(0, 0, -1.3),    s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(0.95, 0.45, 0.4),  r: R(0, 0, 1.3),     s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.7, 1.0),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.3, 4.0),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(1.0, 0.9, 0.2),  r: R(0, 0, 0),         s: S(1, 1, 1), spread: 1.15 },
      rider:    { p: P(0, 0.7, 0.1),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) }
    },

    HYPER: {
      core:     { p: P(0, 0.5, 0),      r: R(0, 0, 0),          s: S(1.5, 0.62, 1.35) },
      nose:     { p: P(0, 0.42, -2.5),  r: R(0, 0, 0),          s: S(1.4, 0.7, 1.2) },
      canopy:   { p: P(0, 0.72, -0.6),  r: R(0, 0, 0),          s: S(1.1, 0.6, 1.8) },
      wheelF:   { p: P(0, 0.42, -1.3),  r: R(0, 0, 0),          s: S(0.95, 0.95, 0.95) },
      wheelR:   { p: P(0, 0.45, 1.3),   r: R(0, 0, 0),          s: S(0.95, 0.95, 0.95) },
      wingUL:   { p: P(-1.05, 0.55, -0.5), r: R(0, 0.55, -0.25), s: S(0.85, 0.75, 0.8) },
      wingUR:   { p: P(1.05, 0.55, -0.5),  r: R(0, -0.55, 0.25), s: S(0.85, 0.75, 0.8) },
      wingLL:   { p: P(-1.05, 0.45, -0.5), r: R(0, 0, -1.3),     s: S(0.4, 1, 0.4) },
      wingLR:   { p: P(1.05, 0.45, -0.5),  r: R(0, 0, 1.3),      s: S(0.4, 1, 0.4) },
      engL:     { p: P(-0.6, 0.45, 2.2), r: R(0, 0, 0),         s: S(0.95, 0.95, 1.1) },
      engR:     { p: P(0.6, 0.45, 2.2),  r: R(0, 0, 0),         s: S(0.95, 0.95, 1.1) },
      engXL:    { p: P(-1.3, 0.4, 2.0),  r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(1.3, 0.4, 2.0),   r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.45, 2.35),   r: R(0, 0, 0),         s: S(0.95, 0.95, 1.1) },
      turret:   { p: P(0, 0.6, 2.0),    r: R(0, 0, 0),         s: S(0.95, 0.95, 0.95) },
      plough:   { p: P(0, 0.5, -2.9),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-1.0, 0.3, 0.2), r: R(0, 0, -1.3),      s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(1.0, 0.3, 0.2),  r: R(0, 0, 1.3),       s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.42, 0.9),   r: R(Math.PI / 2, 0, 0), s: S(0.9, 0.9, 0.9) },
      wake:     { p: P(0, 0.12, 4.2),   r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(1.2, 0.55, -0.15), r: R(0, 0, 0),       s: S(1, 1, 1), spread: 1.2 },
      rider:    { p: P(0, 0.5, -0.2),   r: R(-0.5, 0, 0),      s: S(0.85, 0.85, 0.85) }
    },

    JUMPJET: {
      core:     { p: P(0, 0.7, 0.05),   r: R(0, 0, 0),          s: S(1.05, 0.85, 1.15) },
      nose:     { p: P(0, 0.6, -2.2),   r: R(0, 0, 0),          s: S(1, 0.9, 1.25) },
      canopy:   { p: P(0, 0.85, -0.5),  r: R(0, 0, 0),          s: S(1, 0.7, 1.6) },
      wheelF:   { p: P(0, 0.9, -0.9),   r: R(1.35, 0, 0),       s: S(0.26, 0.26, 0.26) },
      wheelR:   { p: P(0, 0.9, 0.95),   r: R(1.35, 0, 0),       s: S(0.26, 0.26, 0.26) },
      wingUL:   { p: P(-0.6, 0.95, 0.3), r: R(0, 0.05, 0.42),   s: S(1.0, 1, 1.0) },
      wingUR:   { p: P(0.6, 0.95, 0.3),  r: R(0, -0.05, -0.42), s: S(1.0, 1, 1.0) },
      wingLL:   { p: P(-0.6, 0.5, 0.35), r: R(0, 0, -0.42),     s: S(0.9, 1, 0.9) },
      wingLR:   { p: P(0.6, 0.5, 0.35),  r: R(0, 0, 0.42),      s: S(0.9, 1, 0.9) },
      engL:     { p: P(-0.55, 0.65, 1.7), r: R(0, 0, 0),        s: S(0.9, 0.9, 1.0) },
      engR:     { p: P(0.55, 0.65, 1.7),  r: R(0, 0, 0),        s: S(0.9, 0.9, 1.0) },
      engXL:    { p: P(-1.1, 0.55, 1.5),  r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(1.1, 0.55, 1.5),   r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.7, 2.0),      r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 0.8, 2.25),   r: R(0, 0, 0),         s: S(1.1, 1.1, 1.1) },
      plough:   { p: P(0, 0.6, -2.6),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-0.9, 0.4, 0.3), r: R(0, 0, -1.3),      s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(0.9, 0.4, 0.3),  r: R(0, 0, 1.3),       s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.6, 0.9),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.3, 4.0),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(0.85, 0.75, 0.25), r: R(0, 0, 0),       s: S(1, 1, 1), spread: 1.0 },
      rider:    { p: P(0, 0.62, 0.2),   r: R(-0.3, 0, 0),      s: S(0.8, 0.8, 0.8) }
    },

    DART: {
      core:     { p: P(0, 1.0, 0),      r: R(0, 0, 0),          s: S(2.05, 1.7, 1.85) },
      nose:     { p: P(0, 0.95, -2.9),  r: R(0, 0, 0),          s: S(1.7, 1.35, 0.9) },
      canopy:   { p: P(0, 1.35, -1.6),  r: R(0, 0, 0),          s: S(1, 0.7, 1.4) },
      wheelF:   { p: P(0, 0.62, -2.0),  r: R(0, 0, 0),          s: S(1.5, 1.5, 1.5) },
      wheelR:   { p: P(0, 0.62, 2.0),   r: R(0, 0, 0),          s: S(1.5, 1.5, 1.5) },
      wingUL:   { p: P(-1.6, 0.95, 0.9), r: R(0, 0, -0.55),     s: S(1.6, 1.3, 1.85) },
      wingUR:   { p: P(1.6, 0.95, 0.9),  r: R(0, 0, 0.55),      s: S(1.6, 1.3, 1.85) },
      wingLL:   { p: P(-1.6, 0.75, 1.0), r: R(0, 0, -1.15),     s: S(1.35, 1.2, 1.7) },
      wingLR:   { p: P(1.6, 0.75, 1.0),  r: R(0, 0, 1.15),      s: S(1.35, 1.2, 1.7) },
      engL:     { p: P(-0.95, 0.95, 3.1), r: R(0, 0, 0),        s: S(1.15, 1.15, 1.0) },
      engR:     { p: P(0.95, 0.95, 3.1),  r: R(0, 0, 0),        s: S(1.15, 1.15, 1.0) },
      engXL:    { p: P(-1.9, 0.9, 2.9),   r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(1.9, 0.9, 2.9),    r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 1.0, 3.2),      r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 1.95, 0.3),   r: R(0, 0, 0),         s: S(1.8, 1.8, 1.8) },
      plough:   { p: P(0, 0.95, -3.6),  r: R(0, 0, 0),         s: S(1.05, 1.05, 1.05) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-1.2, 0.5, 0.5), r: R(0, 0, -1.3),      s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(1.2, 0.5, 0.5),  r: R(0, 0, 1.3),       s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 1.0, 1.0),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.3, 4.6),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(1.85, 1.15, 0.6), r: R(0, 0, 0),        s: S(1.35, 1.35, 1.35), spread: 1.5 },
      rider:    { p: P(0, 1.2, 0),      r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) }
    },

    SKIMMER: {
      core:     { p: P(0, 0.65, 0.2),   r: R(0, 0, 0),          s: S(1.4, 0.75, 1.4) },
      nose:     { p: P(0, 0.58, -2.3),  r: R(0.18, 0, 0),       s: S(1.25, 0.7, 1.0) },
      canopy:   { p: P(0, 0.95, -0.9),  r: R(0, 0, 0),          s: S(1, 0.6, 1.4) },
      wheelF:   { p: P(0, 0.8, -0.9),   r: R(1.3, 0, 0),        s: S(0.22, 0.22, 0.22) },
      wheelR:   { p: P(0, 0.8, 1.0),    r: R(1.3, 0, 0),        s: S(0.22, 0.22, 0.22) },
      wingUL:   { p: P(-0.95, 0.75, 0.1), r: R(0, 0.1, 0.15),   s: S(0.8, 0.9, 0.9) },
      wingUR:   { p: P(0.95, 0.75, 0.1),  r: R(0, -0.1, -0.15), s: S(0.8, 0.9, 0.9) },
      wingLL:   { p: P(-0.95, 0.6, 0.4),  r: R(0, 0, -1.25),    s: S(0.5, 1, 0.5) },
      wingLR:   { p: P(0.95, 0.6, 0.4),   r: R(0, 0, 1.25),     s: S(0.5, 1, 0.5) },
      engL:     { p: P(-0.75, 0.62, 1.9), r: R(0, 0, 0),        s: S(0.85, 0.85, 0.9) },
      engR:     { p: P(0.75, 0.62, 1.9),  r: R(0, 0, 0),        s: S(0.85, 0.85, 0.9) },
      engXL:    { p: P(-1.4, 0.5, 1.8),   r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(1.4, 0.5, 1.8),    r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.65, 2.1),     r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 1.05, 2.0),   r: R(0, 0, 0),         s: S(1, 1, 1) },
      plough:   { p: P(0, 0.65, -2.7),  r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-1.05, 0.32, 0.3), r: R(0, 0, -1.25),    s: S(1, 1, 1) },
      foilR:    { p: P(1.05, 0.32, 0.3),  r: R(0, 0, 1.25),     s: S(1, 1, 1) },
      ring:     { p: P(0, 0.6, 1.0),    r: R(Math.PI / 2, 0, 0), s: S(0.001, 0.001, 0.001) },
      wake:     { p: P(0, 0.14, 4.4),   r: R(0, 0, 0),         s: S(1, 1, 1) },
      arms:     { p: P(1.05, 0.85, 0.35), r: R(0, 0, 0),       s: S(1, 1, 1), spread: 1.05 },
      rider:    { p: P(-0.42, 0.95, -0.3), r: R(-0.2, 0, 0),   s: S(0.85, 0.85, 0.85) }
    },

    LIGHTDRONE: {
      core:     { p: P(0, 0.55, 0),     r: R(0, 0, 0),          s: S(0.62, 0.62, 0.62) },
      nose:     { p: P(0, 0.5, -1.2),   r: R(0, 0, 0),          s: S(0.6, 0.6, 0.6) },
      canopy:   { p: P(0, 0.75, -0.3),  r: R(0, 0, 0),          s: S(0.5, 0.5, 0.6) },
      wheelF:   { p: P(0, 0.6, -0.6),   r: R(1.2, 0, 0),        s: S(0.001, 0.001, 0.001) },
      wheelR:   { p: P(0, 0.6, 0.6),    r: R(1.2, 0, 0),        s: S(0.001, 0.001, 0.001) },
      wingUL:   { p: P(-0.5, 0.72, 0.1), r: R(0, 0.2, 0.65),    s: S(0.5, 0.7, 0.55) },
      wingUR:   { p: P(0.5, 0.72, 0.1),  r: R(0, -0.2, -0.65),  s: S(0.5, 0.7, 0.55) },
      wingLL:   { p: P(-0.5, 0.4, 0.15), r: R(0, 0, -0.75),     s: S(0.42, 0.7, 0.5) },
      wingLR:   { p: P(0.5, 0.4, 0.15),  r: R(0, 0, 0.75),      s: S(0.42, 0.7, 0.5) },
      engL:     { p: P(-0.35, 0.55, 0.85), r: R(0, 0, 0),       s: S(0.45, 0.45, 0.45) },
      engR:     { p: P(0.35, 0.55, 0.85),  r: R(0, 0, 0),       s: S(0.45, 0.45, 0.45) },
      engXL:    { p: P(-0.7, 0.5, 0.8),   r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engXR:    { p: P(0.7, 0.5, 0.8),    r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      engC:     { p: P(0, 0.6, 1.0),      r: R(0, 0, 0),        s: S(0.001, 0.001, 0.001) },
      turret:   { p: P(0, 0.72, 1.0),   r: R(0, 0, 0),         s: S(0.7, 0.7, 0.7) },
      plough:   { p: P(0, 0.6, -1.4),   r: R(1.35, 0, 0),      s: S(0.001, 0.001, 0.001) },
      rotorPods:{ p: P(0, 0, 0),        r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      foilL:    { p: P(-0.6, 0.35, 0.2), r: R(0, 0, -1.3),     s: S(0.001, 0.001, 0.001) },
      foilR:    { p: P(0.6, 0.35, 0.2),  r: R(0, 0, 1.3),      s: S(0.001, 0.001, 0.001) },
      ring:     { p: P(0, 0.55, 0.2),   r: R(Math.PI / 2, 0, 0), s: S(0.85, 0.85, 0.85) },
      wake:     { p: P(0, 0.2, 2.2),    r: R(0, 0, 0),         s: S(0.001, 0.001, 0.001) },
      arms:     { p: P(0.55, 0.6, 0.1), r: R(0, 0, 0),         s: S(0.7, 0.7, 0.7), spread: 0.85 },
      rider:    { p: P(0, 0.5, 0.1),    r: R(-0.4, 0, 0),      s: S(0.62, 0.62, 0.62) }
    }
  };

  static RIDER = { p: [0, 0.55, 0.15], r: [0, 0, 0], s: [1, 1, 1] };

  /** Rider is a shared part too (props on some craft, hidden on others). */
  setRider(riderGroup) {
    this.rider = riderGroup;
    this.root.add(riderGroup);
    this.parts.rider = riderGroup;
  }

  // ------------------------------------------------------------------
  //  MORPH ENGINE
  // ------------------------------------------------------------------
  /** Order in which parts move: early = tucks/unfolds first. */
  static STAGGER = {
    wheelF: 0.00, wheelR: 0.04,
    arms: 0.06,
    wingLL: 0.16, wingLR: 0.16, wingUL: 0.22, wingUR: 0.22,
    engL: 0.30, engR: 0.30, engXL: 0.36, engXR: 0.36, engC: 0.34,
    canopy: 0.42,
    nose: 0.46,
    core: 0.50,
    turret: 0.56,
    rotorPods: 0.60, foilL: 0.60, foilR: 0.60, ring: 0.62, wake: 0.62,
    plough: 0.66, rider: 0.10
  };

  static FLARE = {
    wingUL: 0.55, wingUR: 0.55, wingLL: 0.45, wingLR: 0.45,
    engL: 0.3, engR: 0.3, engXL: 0.3, engXR: 0.3,
    foilL: 0.4, foilR: 0.4, rotorPods: 0.35, plough: 0.5, arms: 0.4
  };

  setModeImmediate(mode) {
    this.mode = mode;
    const pose = ChassisRig.POSES[mode] || ChassisRig.POSES.CYCLE;
    for (const name of Object.keys(this.parts)) {
      const part = this.parts[name];
      if (!part) continue;
      const t = pose[name];
      if (!t) continue;
      this.applyPose(part, t, 1);
    }
    // arms pose
    const armPose = pose.arms || {};
    if (armPose.p) {
      for (const a of this.armGroups) {
        a.group.position.set(a.side * armPose.p[0], armPose.p[1], armPose.p[2]);
        a.group.scale.setScalar((armPose.s && armPose.s[0]) || 1);
        a.group.rotation.set(0, -a.side * 0.35, a.side * -0.2);
        a.elbow.rotation.z = a.side * 0.4;
      }
    }
  }

  applyPose(part, t, k) {
    part.position.set(t.p[0], t.p[1], t.p[2]);
    part.rotation.set(t.r[0], t.r[1], t.r[2]);
    part.scale.set(t.s[0], t.s[1], t.s[2]);
  }

  /** Begin a transformation: every part travels to the new pose. */
  startMorph(fromMode, toMode, duration = 1.05) {
    const from = ChassisRig.POSES[fromMode] || ChassisRig.POSES.CYCLE;
    const to = ChassisRig.POSES[toMode] || ChassisRig.POSES.CYCLE;
    this.morph = {
      from, to, duration, t: 0,
      start: {}   // live snapshot of current transforms (so re-morphs are seamless)
    };
    for (const name of Object.keys(this.parts)) {
      const part = this.parts[name];
      if (!part) continue;
      this.morph.start[name] = {
        p: part.position.toArray(),
        r: part.rotation.toArray().slice(0, 3),
        s: part.scale.toArray()
      };
    }
    this.morph.armStart = this.armGroups.map(a => ({
      p: a.group.position.toArray(),
      s: a.group.scale.x,
      rz: a.group.rotation.z,
      ez: a.elbow.rotation.z
    }));
    this.morph.armFrom = from.arms || {};
    this.morph.armTo = to.arms || {};
  }

  easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /** @returns progress 0..1 */
  update(delta) {
    this.time += delta;
    if (!this.morph) { this.animateLive(delta); return 1; }

    const m = this.morph;
    m.t = Math.min(1, m.t + delta / m.duration);
    const prog = m.t;

    for (const name of Object.keys(this.parts)) {
      const part = this.parts[name];
      if (!part) continue;
      const a = m.from[name];
      const b = m.to[name];
      const start = m.start[name];
      if (!b || !start) continue;

      const delay = ChassisRig.STAGGER[name] !== undefined ? ChassisRig.STAGGER[name] : 0.4;
      const local = THREE.MathUtils.clamp((prog - delay) / Math.max(0.15, 1 - delay), 0, 1);
      const e = this.easeInOut(local);

      // travel from where we actually were → target pose
      const px = THREE.MathUtils.lerp(start.p[0], b.p[0], e);
      const py = THREE.MathUtils.lerp(start.p[1], b.p[1], e);
      const pz = THREE.MathUtils.lerp(start.p[2], b.p[2], e);
      const rx = THREE.MathUtils.lerp(start.r[0], b.r[0], e);
      const ry = THREE.MathUtils.lerp(start.r[1], b.r[1], e);
      const rz = THREE.MathUtils.lerp(start.r[2], b.r[2], e);
      const sx = THREE.MathUtils.lerp(start.s[0], b.s[0], e);
      const sy = THREE.MathUtils.lerp(start.s[1], b.s[1], e);
      const sz = THREE.MathUtils.lerp(start.s[2], b.s[2], e);

      // mid-morph flare: parts swing wide before locking in
      const flare = (ChassisRig.FLARE[name] !== undefined ? ChassisRig.FLARE[name] : 0);
      const swing = Math.sin(local * Math.PI) * flare;
      part.position.set(px, py + swing * 0.35, pz);
      part.rotation.set(rx, ry, rz + (name.startsWith('wing') ? swing * 0.5 : swing * 0.25));
      part.scale.set(sx, sy, sz);
    }

    // arms travel with the body, folding through the middle of the swap
    const armA = m.armFrom.p || [0.9, 0.7, 0.3];
    const armB = m.armTo.p || [0.9, 0.7, 0.3];
    const armE = this.easeInOut(THREE.MathUtils.clamp((prog - 0.06) / 0.8, 0, 1));
    const fold = Math.sin(THREE.MathUtils.clamp(prog, 0, 1) * Math.PI);
    for (let i = 0; i < this.armGroups.length; i++) {
      const a = this.armGroups[i];
      const st = m.armStart[i];
      const scaleTarget = ((m.armTo.s && m.armTo.s[0]) || 1);
      a.group.position.set(
        a.side * THREE.MathUtils.lerp(st.p[0], armB[0], armE),
        THREE.MathUtils.lerp(st.p[1], armB[1], armE),
        THREE.MathUtils.lerp(st.p[2], armB[2], armE)
      );
      a.group.scale.setScalar(THREE.MathUtils.lerp(st.s, scaleTarget, armE));
      a.group.rotation.z = a.side * (-0.2 - fold * 1.05);
      a.elbow.rotation.z = a.side * (0.4 + fold * 0.75);
      a.group.rotation.y = -a.side * (0.35 * (1 - fold));
    }

    this.animateLive(delta);

    if (m.t >= 1) {
      this.mode = m.to === ChassisRig.POSES.CYCLE ? 'CYCLE' : this.morphMode || this.mode;
      this.morph = null;
      return 1;
    }
    return prog;
  }

  /** Continuous animation of live parts (wheels, plumes, rotors, ring, wake). */
  animateLive(delta) {
    const spec = this.v.spec;
    const speedRatio = Math.min(1, Math.abs(this.v.speed) / (spec.maxSpeed || 1));
    const boosting = this.v.isBoosting;
    const overdrive = this.v.overdriveTimer > 0;

    const wheelSpin = (this.v.speed / 0.45) * delta;
    for (const name of ['wheelF', 'wheelR']) {
      const wheel = this.parts[name];
      if (wheel && wheel.userData.spokes && wheel.scale.x > 0.05) {
        wheel.userData.spokes.rotation.x -= wheelSpin;
      }
    }

    const plumeBase = spec.air ? 0.35 + speedRatio * 0.9 : 0.05 + speedRatio * 0.35;
    const plumeScale = plumeBase + (boosting ? 0.85 : 0) + (overdrive ? 0.6 : 0);
    for (const name of ['engL', 'engR', 'engXL', 'engXR', 'engC']) {
      const e = this.parts[name];
      if (!e || !e.userData.plume) continue;
      const visible = e.scale.x > 0.05;
      const flicker = 1 + Math.random() * 0.25;
      e.userData.plume.scale.set(plumeScale * flicker, plumeScale, plumeScale * (1.1 + Math.random() * 0.3));
      e.userData.plume.visible = visible;
    }

    const rotors = this.parts.rotorPods;
    if (rotors && rotors.scale.x > 0.05) {
      const spinRate = 14 + speedRatio * 26 + (boosting ? 14 : 0);
      for (const r of rotors.userData.rotors) r.rotation.y += spinRate * delta;
    }

    const ring = this.parts.ring;
    if (ring && ring.scale.x > 0.05) ring.rotation.z += delta * (1.5 + speedRatio * 4);

    const wake = this.parts.wake;
    if (wake) {
      wake.material.opacity = (this.v.isSubmerged ? 0 : Math.max(0, (speedRatio - 0.25) * 0.7));
    }

    // idle arm sway
    if (!this.morph) {
      const idle = Math.sin(this.time * 1.4) * 0.05;
      for (const a of this.armGroups) {
        a.group.rotation.z = THREE.MathUtils.lerp(a.group.rotation.z, a.side * -0.2 + idle * a.side, delta * 4);
        a.elbow.rotation.z = THREE.MathUtils.lerp(a.elbow.rotation.z, a.side * 0.4, delta * 4);
      }
    }
  }

  /** World-space muzzle positions for forward firing. */
  muzzlesWorld(list) {
    if (!list) return [];
    const core = this.parts.core;
    core.updateWorldMatrix(true, false);
    return list.map((arr) => new THREE.Vector3(arr[0], arr[1], arr[2]).applyMatrix4(this.v.mesh.matrixWorld));
  }

  flashTurret() {
    const t = this.parts.turret;
    if (!t || !t.userData.flashes) return;
    for (const f of t.userData.flashes) {
      f.visible = true;
      setTimeout(() => { f.visible = false; }, 60);
    }
  }
}
