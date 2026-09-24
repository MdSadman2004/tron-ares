import * as THREE from 'three';

/**
 * TRON: ARES — THE GRID (world)
 *
 * A district-based map. Vehicles drive/fly over an infinite neon grid whose
 * surface is populated by 16 procedurally-placed districts with distinct
 * architecture, solid collision volumes and launch ramps:
 *
 *   0 GRID ARENA      disc-wars platform with light columns
 *   1 MEGACITY        dense towers, spires, window bands
 *   2 DATA FARM       rows of server banks (red circuitry)
 *   3 MONOLITH FIELD  tall monolith maze
 *   4 CANYON          sheer walls forming a race canyon
 *   5 PROCESSING PLANT factory blocks + glowing chimneys
 *   6 SKY PILLARS     colossal pillars + floating hex platforms
 *   7 SEA OF SIM       reflective data sea with shore bollards
 *   8 HIGHWAY SPINE   elevated highway, pylons and TUNNELS
 *   9 SOLAR FARM      angled collector rows
 *  10 MONUMENT PLAZA  the Portal arch and obelisks
 *  11 RUINS           derezzed blocks and rubble
 *
 * Colliders are kept in a uniform spatial hash so per-frame queries stay cheap.
 */

const DISTRICT = 620;      // district footprint (world units)
const CELL = 46;           // spatial-hash cell size

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class TronWorld {
  constructor(scene) {
    this.scene = scene;
    this.rng = mulberry32(20250924);
    this.gridSize = 1000;

    // Keep-clear zones (runways): obstacles are never placed inside these
    this.keepClear = [];

    // Collision registry
    this.colliders = [];
    this.colliderGrid = new Map();
    this.ramps = [];
    this.tunnels = [];

    // Instance staging
    this._bodies = [];
    this._belts = [];
    this._ribs = [];
    this._symGlow = [];    // batched glowing road symbols
    this._symSolid = [];   // batched structure (gantry masts/beams)

    this.initLighting();
    this.initGrid();
    this.initGridOverlay();
    this.buildRunways();
    this.initDistricts();
    this.finalizeInstances();
    this.initCyberDust();
    this.initCrimsonAtmosphere();
    this.buildColliderGrid();
  }

  /**
   * Queue a box for the batched symbol meshes. Everything the roads carry
   * (divider pips, lateral bars, deck glyphs, gantry masts, sign panels)
   * collapses into two instanced draws instead of ~2000 separate meshes.
   */
  _sym(glow, x, y, z, sx, sy, sz, color, rotY) {
    (glow ? this._symGlow : this._symSolid).push({ x, y, z, sx, sy, sz, color, rotY: rotY || 0 });
  }

  addKeepClear(minX, maxX, minZ, maxZ) {
    this.keepClear.push({ minX, maxX, minZ, maxZ });
  }

  inKeepClear(x, z, halfExtent = 0) {
    for (const r of this.keepClear) {
      if (x + halfExtent > r.minX && x - halfExtent < r.maxX &&
          z + halfExtent > r.minZ && z - halfExtent < r.maxZ) return true;
    }
    return false;
  }

  r() { return this.rng(); }
  rr(a, b) { return a + this.rng() * (b - a); }
  ri(a, b) { return Math.floor(this.rr(a, b + 1)); }

  // ==================================================================
  //  SHARED BUILDING BLOCKS
  // ==================================================================
  _pushBox(x, y, z, sx, sy, sz, neonColor, opts = {}) {
    // Open runway corridors stay clear — no structure may block them
    if (this.inKeepClear(x, z, Math.max(sx, sz) * 0.5)) return;

    this._bodies.push({ x, y, z, sx, sy, sz });
    if (opts.belt !== false) {
      this._belts.push({
        x, z,
        y: y + sy / 2 - 0.35,
        sx: sx * 1.03, sz: sz * 1.03,
        color: neonColor
      });
      // Street-level skirt: every structure gets a glowing base line so
      // avenues and blocks read as a neon city at ground level.
      if (sy > 20) {
        this._belts.push({
          x, z,
          y: y - sy / 2 + 2.6,
          sx: sx * 1.04, sz: sz * 1.04,
          color: opts.baseColor !== undefined ? opts.baseColor : (this.r() < 0.5 ? 0xff0838 : 0x00f0ff)
        });
      }
    }
    const ribs = opts.ribs || 0;
    for (let i = 0; i < ribs; i++) {
      const angle = (i / ribs) * Math.PI * 2 + Math.PI / 4;
      const rx = x + Math.cos(angle) * (sx / 2 + 0.06);
      const rz = z + Math.sin(angle) * (sz / 2 + 0.06);
      this._ribs.push({ x: rx, y, z: rz, h: sy * (opts.ribHeight || 0.98), color: neonColor });
    }
    if (opts.collide !== false) {
      this.addCollider(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, Math.max(0, y - sy / 2), y + sy / 2);
    }
  }

  addCollider(minX, maxX, minZ, maxZ, minY, maxY, opts) {
    // Runways stay open: anything whose footprint reaches into a keep-clear
    // corridor is dropped unless it explicitly opts out (runway gate posts).
    if (!(opts && opts.force)) {
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const half = Math.max(maxX - minX, maxZ - minZ) / 2;
      if (this.inKeepClear(cx, cz, half)) return;
    }
    this.colliders.push({ minX, maxX, minZ, maxZ, minY, maxY });
  }

  buildColliderGrid() {
    this.colliderGrid.clear();
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      const x0 = Math.floor(c.minX / CELL), x1 = Math.floor(c.maxX / CELL);
      const z0 = Math.floor(c.minZ / CELL), z1 = Math.floor(c.maxZ / CELL);
      for (let gx = x0; gx <= x1; gx++) {
        for (let gz = z0; gz <= z1; gz++) {
          const key = gx + ',' + gz;
          let bucket = this.colliderGrid.get(key);
          if (!bucket) { bucket = []; this.colliderGrid.set(key, bucket); }
          bucket.push(i);
        }
      }
    }
  }

  /** Candidate colliders near a point (spatial-hash query). */
  queryColliders(x, z, radius = 3) {
    const out = [];
    const seen = new Set();
    const x0 = Math.floor((x - radius) / CELL), x1 = Math.floor((x + radius) / CELL);
    const z0 = Math.floor((z - radius) / CELL), z1 = Math.floor((z + radius) / CELL);
    for (let gx = x0; gx <= x1; gx++) {
      for (let gz = z0; gz <= z1; gz++) {
        const bucket = this.colliderGrid.get(gx + ',' + gz);
        if (!bucket) continue;
        for (const idx of bucket) {
          if (seen.has(idx)) continue;
          seen.add(idx);
          out.push(this.colliders[idx]);
        }
      }
    }
    return out;
  }

  // ==================================================================
  //  LIGHTING
  // ==================================================================
  initLighting() {
    this.scene.add(new THREE.AmbientLight(0x0a1020, 1.2));
    this.scene.add(new THREE.HemisphereLight(0x5a0a18, 0x08000a, 0.85));

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dirLight.position.set(100, 150, 50);
    this.scene.add(dirLight);

    const aresCoreLight = new THREE.DirectionalLight(0xff0838, 1.2);
    aresCoreLight.position.set(-80, 120, -100);
    this.scene.add(aresCoreLight);

    this.scene.fog = new THREE.FogExp2(0x0a0206, 0.0035);
  }

  // ==================================================================
  //  BASE GRID
  // ==================================================================
  initGrid() {
    const gridMajor = new THREE.GridHelper(this.gridSize, 200, 0x35f6ff, 0x11405e);
    gridMajor.position.y = 0.02;
    this.scene.add(gridMajor);
    this.gridMesh = gridMajor;

    const planeGeo = new THREE.PlaneGeometry(this.gridSize * 1.5, this.gridSize * 1.5);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x020205, roughness: 0.1, metalness: 0.95 });
    const ground = new THREE.Mesh(planeGeo, planeMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    this.groundMesh = ground;
  }

  /**
   * Procedural neon lattice drawn on the drive surface. Anti-aliased with
   * fwidth() so it stays crisp at any distance, with crimson major lines
   * every 60 units — this is what makes the Grid read as the Grid.
   */
  initGridOverlay() {
    this.gridOverlayMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCell: { value: 6.0 },
        uMajor: { value: 60.0 },
        uFade: { value: 400.0 },
        uColor: { value: new THREE.Color(0x00e8ff) },
        uMajorColor: { value: new THREE.Color(0xff0838) }
      },
      vertexShader: `
        varying vec2 vXZ;
        varying vec3 vWorld;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          vXZ = wp.xz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform float uTime, uCell, uMajor, uFade;
        uniform vec3 uColor, uMajorColor;
        varying vec2 vXZ;
        varying vec3 vWorld;
        float gridLine(vec2 coord, float size) {
          vec2 g = abs(fract(coord / size - 0.5) - 0.5) / fwidth(coord / size);
          return 1.0 - min(min(g.x, g.y), 1.0);
        }
        void main() {
          float minor = gridLine(vXZ, uCell);
          float major = gridLine(vXZ, uMajor);
          float dist = length(vWorld.xz - cameraPosition.xz);
          float fade = smoothstep(uFade, uFade * 0.22, dist);
          float pulse = 0.86 + 0.14 * sin(uTime * 1.3);
          float alpha = (minor * 0.62 + major * 1.0) * fade * pulse;
          if (alpha < 0.004) discard;
          vec3 col = uColor * minor * 0.6 + uMajorColor * major;
          gl_FragColor = vec4(col * pulse, alpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const geo = new THREE.PlaneGeometry(620, 620);
    this.gridOverlay = new THREE.Mesh(geo, this.gridOverlayMat);
    this.gridOverlay.rotation.x = -Math.PI / 2;
    this.gridOverlay.position.y = 0.14;   // above the crimson glow so it stays crisp
    this.gridOverlay.frustumCulled = false;
    this.gridOverlay.renderOrder = 2;
    this.scene.add(this.gridOverlay);
  }

  // ==================================================================
  //  RUNWAYS — long open corridors through the obstacle fields
  // ==================================================================
  buildRunways() {
    const HALF_W = 48;

    // The grid the districts sit on means their boundaries fall on ±930 etc.
    const lanes = [-930, 930];
    for (const z of lanes) {
      this._buildRunway({ minX: -2260, maxX: 2260, minZ: z - HALF_W, maxZ: z + HALF_W, axis: 'x' });
    }
    for (const x of lanes) {
      this._buildRunway({ minX: x - HALF_W, maxX: x + HALF_W, minZ: -2260, maxZ: 2260, axis: 'z' });
    }
    // Radial lanes from the arena rim out to the map edge (the arena itself
    // stays untouched): open runway -> obstacle district -> runway -> ...
    for (const dir of [-1, 1]) {
      this._buildRunway({ minX: dir * 310, maxX: dir * 2260, minZ: -HALF_W, maxZ: HALF_W, axis: 'x' });
      this._buildRunway({ minX: -HALF_W, maxX: HALF_W, minZ: dir * 310, maxZ: dir * 2260, axis: 'z' });
    }
  }

  _buildRunway(rect) {
    // Normalise the rect: radial callers pass swapped bounds for direction
    rect = {
      axis: rect.axis,
      minX: Math.min(rect.minX, rect.maxX),
      maxX: Math.max(rect.minX, rect.maxX),
      minZ: Math.min(rect.minZ, rect.maxZ),
      maxZ: Math.max(rect.minZ, rect.maxZ)
    };
    this.addKeepClear(rect.minX, rect.maxX, rect.minZ, rect.maxZ);

    const w = rect.maxX - rect.minX;
    const d = rect.maxZ - rect.minZ;
    const cx = (rect.minX + rect.maxX) / 2;
    const cz = (rect.minZ + rect.maxZ) / 2;

    // Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.5, d),
      new THREE.MeshStandardMaterial({ color: 0x0a0d13, roughness: 0.26, metalness: 0.82 })
    );
    deck.position.set(cx, 0.25, cz);
    this.scene.add(deck);

    const along = rect.axis === 'x' ? w : d;
    const cross = rect.axis === 'x' ? d : w;

    // Twin edge light bars (runway lighting)
    for (const side of [-1, 1]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(rect.axis === 'x' ? w : 1.6, 0.35, rect.axis === 'x' ? 1.6 : d),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      bar.position.set(
        cx + (rect.axis === 'x' ? 0 : side * (cross / 2 - 1.5)),
        0.55,
        cz + (rect.axis === 'x' ? side * (cross / 2 - 1.5) : 0)
      );
      this.scene.add(bar);
    }

    // Centre dashes (crimson chevrons) every 60 units
    const dashCount = Math.floor(along / 60);
    const dashGeo = new THREE.BoxGeometry(rect.axis === 'x' ? 30 : 4.0, 0.3, rect.axis === 'x' ? 4.0 : 30);
    const dashes = new THREE.InstancedMesh(dashGeo, new THREE.MeshBasicMaterial({ color: 0xff0838 }), dashCount);
    const m = new THREE.Matrix4();
    for (let i = 0; i < dashCount; i++) {
      const t = (i + 0.5) * 60 - along / 2;
      m.makeTranslation(
        cx + (rect.axis === 'x' ? t : 0),
        0.62,
        cz + (rect.axis === 'x' ? 0 : t)
      );
      dashes.setMatrixAt(i, m);
    }
    dashes.instanceMatrix.needsUpdate = true;
    this.scene.add(dashes);

    // Road markings: divider pips, lateral divider bars, deck glyphs and
    // overhead glowing symbol gantries (red / orange).
    this.addRoadFurniture(rect);

    // Threshold gates at both ends + a launch ramp just past each gate
    for (const end of [-1, 1]) {
      const gx = cx + (rect.axis === 'x' ? end * (w / 2 - 12) : 0);
      const gz = cz + (rect.axis === 'x' ? 0 : end * (d / 2 - 12));
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 16, 2.4),
          new THREE.MeshStandardMaterial({ color: 0x0d1017, roughness: 0.4, metalness: 0.7 })
        );
        post.position.set(
          gx + (rect.axis === 'x' ? 0 : side * 30),
          8,
          gz + (rect.axis === 'x' ? side * 30 : 0)
        );
        this.scene.add(post);
        this.addCollider(post.position.x - 1.6, post.position.x + 1.6,
                         post.position.z - 1.6, post.position.z + 1.6, 0, 16, { force: true });
      }
      const gateBar = new THREE.Mesh(
        new THREE.BoxGeometry(rect.axis === 'x' ? 2 : 62, 1.1, rect.axis === 'x' ? 62 : 2),
        new THREE.MeshBasicMaterial({ color: 0xff0838 })
      );
      gateBar.position.set(gx, 16.5, gz);
      this.scene.add(gateBar);

      // Launch ramp 40 m inside the runway, aimed along it
      const rampX = cx + (rect.axis === 'x' ? end * (w / 2 - 70) : 0);
      const rampZ = cz + (rect.axis === 'x' ? 0 : end * (d / 2 - 70));
      const rampYaw = rect.axis === 'x' ? (end > 0 ? -Math.PI / 2 : Math.PI / 2) : (end > 0 ? Math.PI : 0);
      this.addRamp(rampX, rampZ, rampYaw, 20, 60, 16);
    }
  }

  /**
   * ROAD SYMBOLS - divider markers along the lanes, big deck glyphs
   * (arrows / crosses / diamonds) and overhead gantries carrying glowing
   * red & orange signage.
   */
  addRoadFurniture(rect) {
    const axis = rect.axis;
    const cx = (rect.minX + rect.maxX) / 2;
    const cz = (rect.minZ + rect.maxZ) / 2;
    const along = axis === 'x' ? (rect.maxX - rect.minX) : (rect.maxZ - rect.minZ);
    const cross = axis === 'x' ? (rect.maxZ - rect.minZ) : (rect.maxX - rect.minX);
    const halfCross = cross / 2;
    const start = -along / 2;

    const RED = 0xff0838;
    const ORANGE = 0xff7a00;

    // (a) Edge divider pips every 55 m, alternating red / orange
    const pips = Math.floor(along / 55);
    for (let i = 0; i < pips; i++) {
      const t = 27 + i * 55;
      for (const side of [-1, 1]) {
        const ox = axis === 'x' ? start + t : side * (halfCross - 5);
        const oz = axis === 'x' ? side * (halfCross - 5) : start + t;
        this._sym(true, cx + ox, 1.7, cz + oz, 0.6, 3.4, 0.6, i % 2 ? ORANGE : RED);
      }
    }

    // (b) Lateral divider bars across the deck every 130 m
    const bars = Math.floor(along / 130);
    for (let i = 0; i < bars; i++) {
      const t = 65 + i * 130;
      const ox = axis === 'x' ? start + t : 0;
      const oz = axis === 'x' ? 0 : start + t;
      this._sym(
        true, cx + ox, 0.72, cz + oz,
        axis === 'x' ? 7.0 : cross * 0.66, 0.3, axis === 'x' ? cross * 0.66 : 7.0,
        i % 3 === 0 ? RED : ORANGE
      );
    }

    // (c) Deck glyphs: arrow -> cross -> diamond, repeating every 260 m
    const kinds = ['arrow', 'cross', 'diamond'];
    const glyphCount = Math.floor(along / 180);
    for (let i = 0; i < glyphCount; i++) {
      const t = 90 + i * 180;
      const ox = axis === 'x' ? start + t : 0;
      const oz = axis === 'x' ? 0 : start + t;
      this._roadGlyph(kinds[i % kinds.length], cx + ox, 0.85, cz + oz, axis, i % 2 ? ORANGE : RED);
    }

    // (d) Overhead symbol gantries every ~620 m: masts + beam + glowing sign
    //     panel. Instanced, no colliders, so the lanes stay completely open.
    const gantries = Math.floor(along / 620);
    for (let i = 0; i < gantries; i++) {
      const t = 310 + i * 620;
      const gx = cx + (axis === 'x' ? start + t : 0);
      const gz = cz + (axis === 'x' ? 0 : start + t);
      const mat = i % 2 ? ORANGE : RED;

      for (const side of [-1, 1]) {
        this._sym(false,
          gx + (axis === 'x' ? 0 : side * (halfCross + 3)),
          15,
          gz + (axis === 'x' ? side * (halfCross + 3) : 0),
          2.2, 30, 2.2, 0x0d1017);
      }
      this._sym(false, gx, 30.5, gz, axis === 'x' ? 2.4 : cross + 10, 2.6, axis === 'x' ? cross + 10 : 2.4, 0x11141c);
      this._sym(true, gx, 25.5, gz, axis === 'x' ? 1.2 : 22, 7.5, axis === 'x' ? 22 : 1.2, mat);

      for (let k = -1; k <= 1; k++) {
        this._sym(true,
          gx + 0.7 + (axis === 'x' ? 0 : k * 8),
          21.6 - Math.abs(k) * 3.2,
          gz + 0.7 + (axis === 'x' ? k * 8 : 0),
          axis === 'x' ? 1.6 : 13, 1.1, axis === 'x' ? 13 : 1.6,
          k === 0 ? ORANGE : RED);
      }
    }
  }

  /** Flat deck glyph built from glowing bars (batched). */
  _roadGlyph(kind, x, y, z, axis, color) {
    const L = 44;
    const rot = axis === 'z' ? Math.PI / 2 : 0;
    // Local bar layout, rotated as a group by `rot`
    const bars = [];
    const push = (len, thick, ox, oz, localRot) => {
      const ca = Math.cos(rot), sa = Math.sin(rot);
      bars.push({
        x: x + ox * ca + oz * sa,
        z: z - ox * sa + oz * ca,
        sx: len, sz: thick,
        rotY: rot + localRot
      });
    };

    if (kind === 'arrow') {
      push(L, 6.0, 0, 0, 0);
      push(L * 0.6, 6.0, -L * 0.36, -L * 0.32, 0.8);
      push(L * 0.6, 6.0, -L * 0.36, L * 0.32, -0.8);
    } else if (kind === 'cross') {
      push(L, 6.5, 0, 0, 0);
      push(6.5, L, 0, 0, 0);
    } else {
      push(L * 0.85, 5.5, 0, L * 0.32, 0.62);
      push(L * 0.85, 5.5, 0, -L * 0.32, -0.62);
      push(L * 0.85, 5.5, L * 0.32, 0, 0.62);
      push(L * 0.85, 5.5, -L * 0.32, 0, -0.62);
    }

    for (const b of bars) {
      this._sym(true, b.x, y, b.z, b.sx, 0.22, b.sz, color, b.rotY);
    }
  }

  // ==================================================================
  //  DISTRICTS
  // ==================================================================
  districtCenter(dx, dz) {
    return { x: (dx - 1.5) * DISTRICT, z: (dz - 1.5) * DISTRICT };
  }

  initDistricts() {
    // 4x4 layout, centre-ward districts are the reference arena
    const layout = [
      [4, 2, 3, 9],    // canyon / data farm / monoliths / solar
      [1, 0, 6, 5],    // megacity / ARENA / sky pillars / plant
      [7, 10, 11, 8],  // sea of sim / plaza / ruins / highway
      [12, 12, 3, 12]  // packed obstacle fields on the outer ring
    ];

    for (let dz = 0; dz < 4; dz++) {
      for (let dx = 0; dx < 4; dx++) {
        const type = layout[dz][dx];
        const c = this.districtCenter(dx, dz);
        switch (type) {
          case 0: this.buildArena(c); break;
          case 1: this.buildMegacity(c); break;
          case 2: this.buildDataFarm(c); break;
          case 3: this.buildMonolithField(c); break;
          case 4: this.buildCanyon(c); break;
          case 5: this.buildPlant(c); break;
          case 6: this.buildSkyPillars(c); break;
          case 7: this.buildSeaOfSim(c); break;
          case 8: this.buildHighway(c); break;
          case 9: this.buildSolarFarm(c); break;
          case 10: this.buildMonumentPlaza(c); break;
          case 11: this.buildRuins(c); break;
          case 12: this.buildObstacleField(c); break;
          default: this.buildDataFarm(c); break;
        }
      }
    }
  }

  /** 0 — GRID ARENA: disc-wars platform, light columns, boundary posts. */
  buildArena(c) {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(190, 200, 3, 48),
      new THREE.MeshStandardMaterial({ color: 0x07080d, roughness: 0.25, metalness: 0.85 })
    );
    platform.position.set(c.x, 1.5, c.z);
    this.scene.add(platform);
    this.addCollider(c.x - 190, c.x + 190, c.z - 190, c.z + 190, 0, 3);

    const ringGeo = new THREE.TorusGeometry(192, 1.1, 8, 96);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xff0838 }));
    ring.position.set(c.x, 3.2, c.z);
    this.scene.add(ring);

    // Light columns around the arena boundary
    const colGeo = new THREE.BoxGeometry(1.6, 46, 1.6);
    const colMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const columns = new THREE.InstancedMesh(colGeo, colMat, 24);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const px = c.x + Math.cos(a) * 178;
      const pz = c.z + Math.sin(a) * 178;
      m.makeTranslation(px, 23, pz);
      columns.setMatrixAt(i, m);
      this.addCollider(px - 1.4, px + 1.4, pz - 1.4, pz + 1.4, 0, 46);
    }
    this.scene.add(columns);

    // Central dais (the disc-wars disc)
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(34, 40, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.3, metalness: 0.8 })
    );
    dais.position.set(c.x, 4.2, c.z);
    this.scene.add(dais);
    const daisRing = new THREE.Mesh(new THREE.TorusGeometry(35, 0.6, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    daisRing.rotation.x = Math.PI / 2;
    daisRing.position.set(c.x, 5.4, c.z);
    this.scene.add(daisRing);
    this.addCollider(c.x - 34, c.x + 34, c.z - 34, c.z + 34, 0, 5.4);

    // Four launch ramps that fling vehicles up and onto the arena deck
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      this.addRamp(
        c.x + Math.cos(a) * 250, c.z + Math.sin(a) * 250,
        Math.atan2(-Math.cos(a), -Math.sin(a)),   // +Z aims at the arena centre
        16, 44, 7
      );
    }

    // Stands: stepped arcs
    for (let s = 0; s < 3; s++) {
      const r = 120 + s * 22;
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, 4 + s * 3, 40, 1, true, Math.PI * 0.15, Math.PI * 0.7),
        new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide })
      );
      stand.position.set(c.x, (4 + s * 3) / 2, c.z);
      this.scene.add(stand);
    }
  }

  /** 1 — MEGACITY: dense towers with spires and window bands. */
  buildMegacity(c) {
    const neonCyan = 0x00f0ff;
    const neonRed = 0xff0838;

    // Ground street lanes between the blocks (a proper city reads as a grid of
    // avenues, not free-floating pillars)
    const laneMat = new THREE.MeshBasicMaterial({ color: 0x0d4c66 });
    const laneAltMat = new THREE.MeshBasicMaterial({ color: 0x5a0a1c });
    for (let i = -3; i <= 3; i++) {
      const laneX = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 560), i % 2 ? laneAltMat : laneMat);
      laneX.position.set(c.x + i * 88, 0.16, c.z);
      this.scene.add(laneX);
      const laneZ = new THREE.Mesh(new THREE.BoxGeometry(560, 0.12, 1.1), i % 2 ? laneAltMat : laneMat);
      laneZ.position.set(c.x, 0.16, c.z + i * 88);
      this.scene.add(laneZ);
    }

    // City blocks sit BETWEEN the avenues (never on them), so every street is
    // a clean 20 m+ channel you can actually race down.
    const SPACING = 70;
    for (let gx = -4; gx <= 4; gx++) {
      for (let gz = -4; gz <= 4; gz++) {
        if (gx === 0 && gz === 0) continue;              // plaza stays open
        if (this.r() < 0.12) continue;                   // vacant lots
        // Blocks sit ON the 70-unit grid; the avenues are the gaps between
        // them (stripes are drawn at the half-offsets below).
        const x = c.x + gx * SPACING + this.rr(-4, 4);
        const z = c.z + gz * SPACING + this.rr(-4, 4);
        const w = this.rr(22, 44);
        const d = this.rr(22, 44);
        const h = this.rr(38, 240);
        const neon = this.r() < 0.45 ? neonRed : neonCyan;
        this._pushBox(x, h / 2, z, w, h, d, neon, { ribs: 2, ribHeight: 0.98 });

        if (h > 170) {
          const spire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 2.4, 44, 6),
            new THREE.MeshBasicMaterial({ color: neon })
          );
          spire.position.set(x, h + 22, z);
          this.scene.add(spire);
          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xff0838 })
          );
          beacon.position.set(x, h + 45, z);
          this.scene.add(beacon);
        }
      }
    }

    // Low-rise filler: kiosks, substations and sheds packed between the towers
    for (let i = 0; i < 96; i++) {
      const gx = this.ri(-4, 4);
      const gz = this.ri(-4, 4);
      const x = c.x + gx * SPACING + this.rr(-24, 24);
      const z = c.z + gz * SPACING + this.rr(-24, 24);
      if (Math.abs(gx) < 0.5 && Math.abs(gz) < 0.5) continue;
      const w = this.rr(9, 18);
      const d = this.rr(9, 18);
      const h = this.rr(8, 26);
      this._pushBox(x, h / 2, z, w, h, d, this.r() < 0.5 ? 0xffaa00 : 0x00f0ff, { ribs: 0 });
    }

    // Avenue divider symbols: lateral bars + red/orange pips on every avenue
    for (let i = -4; i <= 4; i++) {
      const laneX = c.x + (i + 0.5) * SPACING;
      const laneZ = c.z + (i + 0.5) * SPACING;
      for (let k = -6; k <= 6; k++) {
        const t = k * 42;
        const color = (k + i) % 2 ? 0xff7a00 : 0xff0838;
        this._sym(true, laneX + 14, 1.4, c.z + t, 0.6, 2.8, 0.6, color);
        this._sym(true, c.x + t, 1.4, laneZ + 14, 0.6, 2.8, 0.6, color);
        if (k % 3 === 0) {
          this._sym(true, laneX, 0.66, c.z + t, 3, 0.2, 18, color);
          this._sym(true, c.x + t, 0.66, laneZ, 18, 0.2, 3, color);
        }
      }
    }

    // Avenue centre stripes (bright, so the lanes read clearly)
    for (let i = -4; i <= 4; i++) {
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x1a7fa0 });
      const sx = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 620), stripeMat);
      sx.position.set(c.x + (i + 0.5) * SPACING, 0.2, c.z);
      this.scene.add(sx);
      const sz = new THREE.Mesh(new THREE.BoxGeometry(620, 0.14, 0.5), stripeMat);
      sz.position.set(c.x, 0.2, c.z + (i + 0.5) * SPACING);
      this.scene.add(sz);
    }

    // Ramps up to the elevated cross-streets
    for (const dir of [-1, 1]) {
      this.addRamp(c.x + dir * 300, c.z - 180, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 16, 52, 26);
      this.addRamp(c.x + dir * 300, c.z + 180, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 16, 52, 26);
    }

    // Elevated cross-streets through the district
    for (let i = 0; i < 3; i++) {
      const z = c.z + (i - 1) * 180;
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(560, 2, 26),
        new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.35, metalness: 0.75 })
      );
      road.position.set(c.x, 26, z);
      this.scene.add(road);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(560, 0.5, 0.7), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      edge.position.set(c.x, 27.1, z - 13);
      this.scene.add(edge);
      const edge2 = edge.clone();
      edge2.position.z = z + 13;
      this.scene.add(edge2);
    }
  }

  /** 2 — DATA FARM: rows of server banks with red circuitry. */
  buildDataFarm(c) {
    // Service aisles
    const aisleMat = new THREE.MeshBasicMaterial({ color: 0x5a0a1c });
    for (let i = -4; i <= 4; i++) {
      const aisle = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 560), aisleMat);
      aisle.position.set(c.x + i * 62, 0.16, c.z);
      this.scene.add(aisle);
    }
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 7; col++) {
        if (this.r() < 0.15) continue;
        const x = c.x + (col - 3) * 82 + this.rr(-8, 8);
        const z = c.z + (row - 6) * 46 + this.rr(-6, 6);
        const h = this.rr(12, 26);
        this._pushBox(x, h / 2, z, this.rr(52, 68), h, this.rr(24, 32), 0xff0838, { ribs: 0 });
      }
    }
    // Cooling columns
    for (let i = 0; i < 8; i++) {
      const x = c.x + this.rr(-280, 280);
      const z = c.z + this.rr(-280, 280);
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 8, 60, 12),
        new THREE.MeshStandardMaterial({ color: 0x0d1016, roughness: 0.4, metalness: 0.7 })
      );
      col.position.set(x, 30, z);
      this.scene.add(col);
      const glow = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.5, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      glow.rotation.x = Math.PI / 2;
      glow.position.set(x, 58, z);
      this.scene.add(glow);
      this.addCollider(x - 8, x + 8, z - 8, z + 8, 0, 60);
    }
  }

  /** 3 — MONOLITH FIELD: tall thin monolith maze. */
  buildMonolithField(c) {
    for (let i = 0; i < 132; i++) {
      const x = c.x + this.rr(-286, 286);
      const z = c.z + this.rr(-286, 286);
      const h = this.rr(48, 195);
      const w = this.rr(6, 14);
      this._pushBox(x, h / 2, z, w, h, this.rr(6, 14), i % 3 === 0 ? 0xffaa00 : 0xff0838, { ribs: 1, ribHeight: 1.0 });
    }
  }

  /** 4 — CANYON: sheer walls forming a race channel. */
  buildCanyon(c) {
    const gap = 74;            // channel width
    for (let side of [-1, 1]) {
      let z = c.z - 300;
      while (z < c.z + 300) {
        const len = this.rr(60, 130);
        const h = this.rr(70, 150);
        const x = c.x + side * (gap / 2 + 24);
        this._pushBox(x, h / 2, z + len / 2, 46, h, len, 0xff0838, { ribs: 2, ribHeight: 0.95 });
        z += len + this.rr(24, 70);   // gaps = side exits
      }
    }
    // Floor chevrons guiding the run
    for (let i = -6; i <= 6; i++) {
      const chev = new THREE.Mesh(
        new THREE.BoxGeometry(40, 0.3, 3),
        new THREE.MeshBasicMaterial({ color: 0xff0838 })
      );
      chev.position.set(c.x, 0.35, c.z + i * 44);
      this.scene.add(chev);
    }
  }

  /** 5 — PROCESSING PLANT: factory blocks + glowing chimneys. */
  buildPlant(c) {
    for (let i = 0; i < 36; i++) {
      const x = c.x + this.rr(-262, 262);
      const z = c.z + this.rr(-262, 262);
      const h = this.rr(24, 78);
      this._pushBox(x, h / 2, z, this.rr(32, 84), h, this.rr(32, 84), 0xffaa00, { ribs: 2 });
    }
    for (let i = 0; i < 6; i++) {
      const x = c.x + this.rr(-220, 220);
      const z = c.z + this.rr(-220, 220);
      const h = this.rr(90, 140);
      const stack = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 10, h, 12),
        new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.45, metalness: 0.7 })
      );
      stack.position.set(x, h / 2, z);
      this.scene.add(stack);
      for (let b = 0; b < 4; b++) {
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(8.5, 0.7, 6, 20),
          new THREE.MeshBasicMaterial({ color: 0xff0838 })
        );
        band.rotation.x = Math.PI / 2;
        band.position.set(x, h * (0.3 + b * 0.18), z);
        this.scene.add(band);
      }
      this.addCollider(x - 10, x + 10, z - 10, z + 10, 0, h);
    }
    // Pipe runs along the ground
    for (let i = 0; i < 10; i++) {
      const z = c.z + (i - 5) * 46;
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 420, 8),
        new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.35, metalness: 0.8 })
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(c.x, 3, z);
      this.scene.add(pipe);
    }
  }

  /** 6 — SKY PILLARS: colossal pillars with floating hex platforms. */
  buildSkyPillars(c) {
    const positions = [];
    for (let i = 0; i < 12; i++) {
      const x = c.x + this.rr(-260, 260);
      const z = c.z + this.rr(-260, 260);
      const h = this.rr(240, 380);
      const w = this.rr(24, 40);
      this._pushBox(x, h / 2, z, w, h, w, 0x00f0ff, { ribs: 4, ribHeight: 1.0 });
      positions.push({ x, z, h });
    }
    // Floating hexagonal platforms between the pillars (aerial playground)
    this.platforms = [];
    const hexGeo = new THREE.CylinderGeometry(42, 42, 2.4, 6);
    const hexMat = new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.3, metalness: 0.85 });
    const hexEdgeMat = new THREE.MeshBasicMaterial({ color: 0xff0838 });
    for (let i = 0; i < 9; i++) {
      const p = positions[i % positions.length];
      const y = 60 + (i % 4) * 46;
      const x = p.x + this.rr(-70, 70);
      const z = p.z + this.rr(-70, 70);
      const hex = new THREE.Mesh(hexGeo, hexMat);
      hex.position.set(x, y, z);
      this.scene.add(hex);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(43, 0.5, 6, 6), hexEdgeMat);
      edge.rotation.x = Math.PI / 2;
      edge.position.set(x, y + 1.4, z);
      this.scene.add(edge);
      this.platforms.push({ x, z, y, radius: 42 });
      this.addCollider(x - 42, x + 42, z - 42, z + 42, y - 1.2, y + 1.2);
    }
  }

  /** 7 — SEA OF SIMULATION: reflective data sea + shore bollards. */
  buildSeaOfSim(c) {
    const seaGeo = new THREE.PlaneGeometry(DISTRICT * 1.1, DISTRICT * 1.1);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x03060d, roughness: 0.04, metalness: 1.0,
      transparent: true, opacity: 0.96
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(c.x, 0.5, c.z);
    this.scene.add(sea);
    this.seaMesh = sea;

    // Shore lighting bollards (two rows framing a causeway)
    const bollardGeo = new THREE.CylinderGeometry(0.7, 0.9, 12, 8);
    const bollardMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const bollards = new THREE.InstancedMesh(bollardGeo, bollardMat, 40);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 40; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const along = Math.floor(i / 2) - 10;
      const x = c.x + along * 46;
      const z = c.z + side * 34;
      m.makeTranslation(x, 6, z);
      bollards.setMatrixAt(i, m);
      this.addCollider(x - 1, x + 1, z - 1, z + 1, 0, 12);
    }
    this.scene.add(bollards);

    // Mooring masts out in the sea
    for (let i = 0; i < 6; i++) {
      const x = c.x + this.rr(-240, 240);
      const z = c.z + this.rr(-240, 240);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2.4, 120, 8),
        new THREE.MeshStandardMaterial({ color: 0x0a0d13, roughness: 0.4, metalness: 0.8 })
      );
      mast.position.set(x, 60, z);
      this.scene.add(mast);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      lamp.position.set(x, 122, z);
      this.scene.add(lamp);
      this.addCollider(x - 3, x + 3, z - 3, z + 3, 0, 120);
    }
  }

  /** 8 — HIGHWAY SPINE: elevated highway with pylons and a tunnel. */
  buildHighway(c) {
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.3, metalness: 0.85 });
    const neon = new THREE.MeshBasicMaterial({ color: 0xff0838 });
    const yaw = this.r() < 0.5 ? 0 : Math.PI / 2;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(560, 3, 30), deckMat);
    deck.position.set(c.x, 30, c.z);
    deck.rotation.y = yaw;
    this.scene.add(deck);

    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(560, 1.2, 1), neon);
      const ox = s * 15;
      rail.position.set(c.x + (yaw === 0 ? 0 : ox), 31.8, c.z + (yaw === 0 ? ox : 0));
      rail.rotation.y = yaw;
      this.scene.add(rail);
    }

    // Support pylons + on-ramps
    for (let i = -6; i <= 6; i++) {
      const px = c.x + (yaw === 0 ? i * 46 : 0);
      const pz = c.z + (yaw === 0 ? 0 : i * 46);
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(7, 30, 7), deckMat);
      pylon.position.set(px, 15, pz);
      this.scene.add(pylon);
      this.addCollider(px - 4, px + 4, pz - 4, pz + 4, 0, 30);

      if (i % 2 === 0) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), neon);
        lamp.position.set(px, 34, pz);
        this.scene.add(lamp);
      }
    }

    // Access ramps up to the deck (functional launch ramps).
    // A ramp ascends toward its local -Z, so face it at the deck.
    for (const dir of [-1, 1]) {
      if (yaw === 0) {
        this.addRamp(c.x + dir * 210, c.z, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 18, 46, 30);
      } else {
        this.addRamp(c.x, c.z + dir * 210, dir > 0 ? Math.PI : 0, 18, 46, 30);
      }
    }

    // A tunnel segment (box with open ends)
    const tunnelLen = 150;
    const tunnel = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x0d1017, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(tunnelLen, 1.2, 44), shellMat);
    roof.position.y = 26;
    tunnel.add(roof);
    for (const s of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(tunnelLen, 26, 1.4), shellMat);
      wall.position.set(0, 13, s * 22);
      tunnel.add(wall);
      this.addCollider(c.x - tunnelLen / 2, c.x + tunnelLen / 2, c.z + s * 22 - 1.4, c.z + s * 22 + 1.4, 0, 26);
    }
    for (let i = -3; i <= 3; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 1), neon);
      strip.position.set(i * 22, 25.2, 0);
      tunnel.add(strip);
    }
    tunnel.position.set(c.x, 0, c.z + (yaw === 0 ? 90 : 0));
    tunnel.rotation.y = yaw;
    this.scene.add(tunnel);
    this.tunnels.push({ x: c.x, z: c.z, yaw, len: tunnelLen });
  }

  /** 9 — SOLAR FARM: angled collector rows. */
  buildSolarFarm(c) {
    const panelGeo = new THREE.BoxGeometry(46, 0.6, 26);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.15, metalness: 0.95 });
    const count = 84;
    const panels = new THREE.InstancedMesh(panelGeo, panelMat, count);
    const glowGeo = new THREE.BoxGeometry(46.4, 0.2, 0.8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const glows = new THREE.InstancedMesh(glowGeo, glowMat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.42, 0, 0));
    let i = 0;
    for (let row = 0; row < 11 && i < count; row++) {
      for (let col = 0; col < 8 && i < count; col++) {
        const x = c.x + (col - 2.5) * 88 + this.rr(-4, 4);
        const z = c.z + (row - 3) * 76 + this.rr(-4, 4);
        if (this.inKeepClear(x, z, 26)) continue;   // never block a runway
        const pos = new THREE.Vector3(x, 5, z);
        m.compose(pos, q, new THREE.Vector3(1, 1, 1));
        panels.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(x, 9.6, z - 12.4), q, new THREE.Vector3(1, 1, 1));
        glows.setMatrixAt(i, m);
        this.addCollider(x - 22, x + 22, z - 14, z + 14, 0, 9);
        i++;
      }
    }
    panels.count = i; glows.count = i;
    this.scene.add(panels);
    this.scene.add(glows);
  }

  /** 10 — MONUMENT PLAZA: the Portal arch, obelisks, open plaza. */
  buildMonumentPlaza(c) {
    // Great arch
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0e1118, roughness: 0.3, metalness: 0.85 });
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(18, 150, 26), archMat);
      leg.position.set(c.x + s * 60, 75, c.z);
      this.scene.add(leg);
      this.addCollider(c.x + s * 60 - 9, c.x + s * 60 + 9, c.z - 13, c.z + 13, 0, 150);
    }
    const span = new THREE.Mesh(new THREE.BoxGeometry(138, 22, 26), archMat);
    span.position.set(c.x, 161, c.z);
    this.scene.add(span);
    this.addCollider(c.x - 69, c.x + 69, c.z - 13, c.z + 13, 150, 172);

    const archNeon = new THREE.Mesh(new THREE.BoxGeometry(120, 1.4, 27), new THREE.MeshBasicMaterial({ color: 0xff0838 }));
    archNeon.position.set(c.x, 150.4, c.z);
    this.scene.add(archNeon);

    // Obelisk ring
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const x = c.x + Math.cos(a) * 170;
      const z = c.z + Math.sin(a) * 170;
      this._pushBox(x, 26, z, 9, 52, 9, i % 2 ? 0x00f0ff : 0xffaa00, { ribs: 1, ribHeight: 1.0 });
    }
  }

  /** 12 — OBSTACLE FIELD: packed cubic maze with a pair of clear lanes. */
  buildObstacleField(c) {
    // Two clear lanes through the middle of the field keep it raceable
    const laneHalf = 26;
    for (let i = 0; i < 190; i++) {
      const x = c.x + this.rr(-288, 288);
      const z = c.z + this.rr(-288, 288);
      if (Math.abs(x - c.x) < laneHalf || Math.abs(z - c.z) < laneHalf) continue;

      const s = this.rr(9, 34);
      const t = this.rr(9, 34);
      const h = this.rr(10, 120);
      this._pushBox(x, h / 2, z, s, h, t, this.r() < 0.5 ? 0xff0838 : 0x00f0ff, { ribs: h > 60 ? 2 : 1 });
    }
  }

  /** 11 — RUINS: derezzed blocks, rubble field. */
  buildRuins(c) {
    for (let i = 0; i < 148; i++) {
      const x = c.x + this.rr(-286, 286);
      const z = c.z + this.rr(-286, 286);
      const h = this.rr(5, 52);
      const w = this.rr(10, 46);
      // Broken, tilted slabs
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, this.rr(12, 40)),
        new THREE.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.55, metalness: 0.6 })
      );
      mesh.position.set(x, h / 2, z);
      mesh.rotation.set(this.rr(-0.2, 0.2), this.rr(0, Math.PI), this.rr(-0.2, 0.2));
      this.scene.add(mesh);
      this.addCollider(x - w / 2, x + w / 2, z - w / 2, z + w / 2, 0, h);

      if (this.r() < 0.4) {
        const spark = new THREE.Mesh(
          new THREE.BoxGeometry(3, 0.6, 3),
          new THREE.MeshBasicMaterial({ color: 0xff0838 })
        );
        spark.position.set(x, h + 1.5, z);
        this.scene.add(spark);
      }
    }
    // Derezz particle haze
    const count = 160;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = c.x + this.rr(-300, 300);
      pos[i * 3 + 1] = this.rr(1, 60);
      pos[i * 3 + 2] = c.z + this.rr(-300, 300);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const haze = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xff0838, size: 1.6, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
    }));
    this.scene.add(haze);
  }

  // ==================================================================
  //  RAMPS (functional launch ramps)
  // ==================================================================
  addRamp(x, z, yaw, halfW, len, height) {
    const group = new THREE.Group();
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x11131c, roughness: 0.3, metalness: 0.8 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2, 1.2, len), rampMat);
    deck.rotation.x = -Math.atan2(height, len);
    deck.position.y = height / 2;
    group.add(deck);

    for (let c = 0; c < 4; c++) {
      const chev = new THREE.Mesh(
        new THREE.BoxGeometry(halfW * 1.7, 0.24, 1.4),
        new THREE.MeshBasicMaterial({ color: 0xff0838 })
      );
      chev.position.set(0, 1.2 + (c / 3) * height, -len / 2 + 5 + (c / 3) * (len - 10));
      chev.rotation.x = -Math.atan2(height, len);
      group.add(chev);
    }

    group.position.set(x, 0, z);
    group.rotation.y = yaw;
    this.scene.add(group);

    this.ramps.push({ x, z, yaw, halfW, len, height, used: false, mesh: group });
  }

  initRamps() { /* ramps are placed by the highway + arena builders */ }

  // ==================================================================
  //  ATMOSPHERE
  // ==================================================================
  initCyberDust() {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 500;
      pos[i * 3 + 1] = Math.random() * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff, size: 1.2, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
    });
    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  initCrimsonAtmosphere() {
    const gradCanvas = document.createElement('canvas');
    gradCanvas.width = 4;
    gradCanvas.height = 256;
    const gctx = gradCanvas.getContext('2d');
    const grad = gctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, 'rgb(0,0,0)');
    grad.addColorStop(0.45, 'rgb(12,1,5)');
    grad.addColorStop(0.72, 'rgb(58,4,20)');
    grad.addColorStop(0.9, 'rgb(120,8,34)');
    grad.addColorStop(1.0, 'rgb(64,3,18)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 4, 256);

    const gradTex = new THREE.CanvasTexture(gradCanvas);
    gradTex.colorSpace = THREE.SRGBColorSpace;

    const domeGeo = new THREE.CylinderGeometry(1100, 1100, 620, 48, 1, true);
    const domeMat = new THREE.MeshBasicMaterial({
      map: gradTex, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0.9
    });
    this.skyDome = new THREE.Mesh(domeGeo, domeMat);
    this.skyDome.position.y = 200;
    this.skyDome.renderOrder = -1;
    this.scene.add(this.skyDome);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 512;
    const glctx = glowCanvas.getContext('2d');
    const rg = glctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    rg.addColorStop(0.0, 'rgba(255, 26, 66, 0.15)');
    rg.addColorStop(0.28, 'rgba(198, 12, 48, 0.09)');
    rg.addColorStop(0.6, 'rgba(110, 4, 26, 0.04)');
    rg.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    glctx.fillStyle = rg;
    glctx.fillRect(0, 0, 512, 512);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    glowTex.colorSpace = THREE.SRGBColorSpace;

    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.65
    });
    this.groundGlow = new THREE.Mesh(new THREE.PlaneGeometry(1150, 1150), glowMat);
    this.groundGlow.rotation.x = -Math.PI / 2;
    this.groundGlow.position.y = 0.09;
    this.groundGlow.renderOrder = 1;
    this.scene.add(this.groundGlow);

    const STREAKS = 240;
    this.streakData = [];
    const positions = new Float32Array(STREAKS * 2 * 3);
    for (let i = 0; i < STREAKS; i++) {
      this.streakData.push({
        x: (Math.random() - 0.5) * 460,
        z: (Math.random() - 0.5) * 460,
        y: Math.random() * 150,
        speed: 13 + Math.random() * 27,
        len: 3 + Math.random() * 11
      });
    }
    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.streakMat = new THREE.LineBasicMaterial({
      color: 0xff1030, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    });
    this.fallStreaks = new THREE.LineSegments(streakGeo, this.streakMat);
    this.fallStreaks.frustumCulled = false;
    this.scene.add(this.fallStreaks);
    this.streakPulse = 0;
  }

  updateStreaks(delta, playerPos) {
    if (!this.fallStreaks) return;
    this.streakPulse += delta;

    const arr = this.fallStreaks.geometry.attributes.position.array;
    for (let i = 0; i < this.streakData.length; i++) {
      const s = this.streakData[i];
      s.y -= s.speed * delta;
      if (s.y < -3) {
        s.y = 120 + Math.random() * 60;
        s.x = (Math.random() - 0.5) * 460;
        s.z = (Math.random() - 0.5) * 460;
      }
      const base = i * 6;
      const wx = playerPos.x + s.x;
      const wz = playerPos.z + s.z;
      arr[base] = wx;
      arr[base + 1] = s.y;
      arr[base + 2] = wz;
      arr[base + 3] = wx;
      arr[base + 4] = s.y + s.len;
      arr[base + 5] = wz;
    }
    this.fallStreaks.geometry.attributes.position.needsUpdate = true;

    if (this.streakMat) {
      this.streakMat.opacity = 0.32 + Math.sin(this.streakPulse * 1.1) * 0.08;
    }
    if (this.groundGlow) {
      this.groundGlow.material.opacity = 0.30 + Math.sin(this.streakPulse * 0.55) * 0.05;
    }
  }

  // ==================================================================
  //  INSTANCE FINALISATION
  // ==================================================================
  finalizeInstances() {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const zeroQ = new THREE.Quaternion();

    // Bodies
    if (this._bodies.length) {
      const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0b0e15, roughness: 0.34, metalness: 0.72 });
      const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, this._bodies.length);
      this._bodies.forEach((b, i) => {
        m.compose(new THREE.Vector3(b.x, b.y, b.z), zeroQ, new THREE.Vector3(b.sx, b.sy, b.sz));
        bodies.setMatrixAt(i, m);
      });
      bodies.instanceMatrix.needsUpdate = true;
      this.scene.add(bodies);
      this.bodiesMesh = bodies;
    }

    // Neon belts (per-instance colour: cyan or crimson)
    if (this._belts.length) {
      const beltGeo = new THREE.BoxGeometry(1, 0.55, 1);
      const beltMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const belts = new THREE.InstancedMesh(beltGeo, beltMat, this._belts.length);
      const col = new THREE.Color();
      this._belts.forEach((b, i) => {
        m.compose(new THREE.Vector3(b.x, b.y, b.z), zeroQ, new THREE.Vector3(b.sx, 1, b.sz));
        belts.setMatrixAt(i, m);
        belts.setColorAt(i, col.setHex(b.color));
      });
      belts.instanceMatrix.needsUpdate = true;
      if (belts.instanceColor) belts.instanceColor.needsUpdate = true;
      this.scene.add(belts);
    }

    // Corner ribs (vertical neon edges)
    if (this._ribs.length) {
      const ribGeo = new THREE.BoxGeometry(0.5, 1, 0.5);
      const ribMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const ribs = new THREE.InstancedMesh(ribGeo, ribMat, this._ribs.length);
      const col = new THREE.Color();
      this._ribs.forEach((rb, i) => {
        m.compose(new THREE.Vector3(rb.x, rb.h / 2, rb.z), zeroQ, new THREE.Vector3(1, rb.h, 1));
        ribs.setMatrixAt(i, m);
        ribs.setColorAt(i, col.setHex(rb.color));
      });
      ribs.instanceMatrix.needsUpdate = true;
      if (ribs.instanceColor) ribs.instanceColor.needsUpdate = true;
      this.scene.add(ribs);
    }

    // Glowing road symbols (per-instance colour)
    if (this._symGlow.length) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      const mesh = new THREE.InstancedMesh(geo, mat, this._symGlow.length);
      const col = new THREE.Color();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      this._symGlow.forEach((it, i) => {
        e.set(0, it.rotY, 0);
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx, it.sy, it.sz));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, col.setHex(it.color));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.scene.add(mesh);
    }

    // Structural road furniture (gantry masts, beams)
    if (this._symSolid.length) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x0d1017, roughness: 0.4, metalness: 0.72 });
      const mesh = new THREE.InstancedMesh(geo, mat, this._symSolid.length);
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      this._symSolid.forEach((it, i) => {
        e.set(0, it.rotY, 0);
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx, it.sy, it.sz));
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
    }

    // Free the staging arrays
    this._bodies = [];
    this._belts = [];
    this._ribs = [];
    this._symGlow = [];
    this._symSolid = [];
  }

  // ==================================================================
  //  PER-FRAME
  // ==================================================================
  update(delta, playerPos) {
    if (this.gridMesh && this.groundMesh) {
      const snapX = Math.floor(playerPos.x / 5) * 5;
      const snapZ = Math.floor(playerPos.z / 5) * 5;
      this.gridMesh.position.x = snapX;
      this.gridMesh.position.z = snapZ;
      this.groundMesh.position.x = snapX;
      this.groundMesh.position.z = snapZ;
    }

    if (this.dustParticles) {
      this.dustParticles.position.x = playerPos.x;
      this.dustParticles.position.z = playerPos.z;
    }

    if (this.skyDome) {
      this.skyDome.position.x = playerPos.x;
      this.skyDome.position.z = playerPos.z;
    }
    if (this.groundGlow) {
      this.groundGlow.position.x = Math.floor(playerPos.x / 5) * 5;
      this.groundGlow.position.z = Math.floor(playerPos.z / 5) * 5;
    }
    if (this.gridOverlay) {
      // snap to the major cell so crimson lines stay locked to the Grid
      this.gridOverlay.position.x = Math.round(playerPos.x / 60) * 60;
      this.gridOverlay.position.z = Math.round(playerPos.z / 60) * 60;
      this.gridOverlayMat.uniforms.uTime.value += delta;
    }

    if (this.seaMesh) {
      // Keep the data sea centred under the player like the grid
      this.seaMesh.position.x = Math.floor(playerPos.x / DISTRICT) * DISTRICT;
      this.seaMesh.position.z = Math.floor(playerPos.z / DISTRICT) * DISTRICT;
    }

    this.updateStreaks(delta, playerPos);
  }
}
