import * as THREE from 'three';

/**
 * GRID PROTOCOL — GLITCH / DEREZZ FX
 *
 * A full-screen corruption pass: block displacement, RGB split, scanlines,
 * grain and heavy magenta corruption bands. Intensity is driven by a small
 * controller so it can:
 *   - fire on its own at random intervals (ambient grid corruption)
 *   - spike on player damage / hard impacts
 *   - slam to full and hold when the rider derezzes
 */

export const GlitchShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float I = uIntensity;

      // --- horizontal block displacement (rows tear sideways) ---------------
      float rows = 26.0;
      float blockY = floor(uv.y * rows);
      float n = rand(vec2(blockY, floor(uTime * 14.0)));
      uv.x += (n - 0.5) * 0.10 * I * step(0.68, n);

      // --- chromatic split --------------------------------------------------
      float split = 0.0075 * I;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + vec2(split, 0.0)).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - vec2(split, 0.0)).b;

      // --- scanlines + grain ------------------------------------------------
      float scan = 0.93 + 0.07 * sin(uv.y * uResolution.y * 1.35 + uTime * 26.0);
      col *= scan;
      float grain = rand(uv * uResolution.xy * 0.5 + uTime);
      col += (grain - 0.5) * 0.16 * I;

      // --- corruption bands on heavy glitches ------------------------------
      if (I > 0.35) {
        float bandRow = floor(uv.y * 34.0);
        float b = step(0.94 - I * 0.10, rand(vec2(bandRow, floor(uTime * 9.0))));
        vec3 corruption = vec3(1.0, 0.06, 0.24) * (0.55 + 0.45 * grain);
        col = mix(col, corruption, b * I * 0.9);

        // derezz pixelation: quantise a moving slab when nearly dead
        if (I > 0.62) {
          float slab = step(0.6, rand(vec2(floor(uv.y * 18.0), floor(uTime * 4.0))));
          vec2 q = floor(uv * vec2(140.0, 90.0)) / vec2(140.0, 90.0);
          col = mix(col, texture2D(tDiffuse, q).rgb, slab * (I - 0.62) * 1.4);
        }
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

export class GlitchFX {
  constructor(pass) {
    this.pass = pass;
    this.level = 0;        // current intensity 0..1
    this.hold = 0;         // seconds left at the triggered level
    this.peak = 0;
    this.nextAmbient = 10 + Math.random() * 14;
    this.time = 0;
  }

  /** Fire a glitch burst. */
  trigger(amount, duration) {
    this.peak = Math.max(this.peak, amount);
    this.hold = Math.max(this.hold, duration);
    this.level = Math.max(this.level, amount);
  }

  /** Called every frame from the render loop. */
  update(delta) {
    this.time += delta;

    // ambient grid corruption
    this.nextAmbient -= delta;
    if (this.nextAmbient <= 0) {
      this.trigger(0.22 + Math.random() * 0.28, 0.22 + Math.random() * 0.45);
      this.nextAmbient = 12 + Math.random() * 22;
    }

    if (this.hold > 0) {
      this.hold -= delta;
      // jitter around the peak while holding (derezz stutter)
      this.level = this.peak * (0.65 + 0.35 * Math.abs(Math.sin(this.time * 23.0)));
    } else {
      this.peak = Math.max(0, this.peak - delta * 1.6);
      this.level = Math.max(0, this.level - delta * 2.4);
    }

    if (this.pass) {
      this.pass.uniforms.uIntensity.value = Math.min(1, this.level);
      this.pass.uniforms.uTime.value = this.time;
    }
  }

  setResolution(w, h) {
    if (this.pass) this.pass.uniforms.uResolution.value.set(w, h);
  }
}
