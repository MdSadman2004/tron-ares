// Shared, deterministic handling primitives; no browser or renderer dependency.
export const PHYSICS_STEP = 1 / 120;
export const damp = (value, target, rate, dt) => target + (value - target) * Math.exp(-rate * dt);

export class PilotAxes {
  constructor() { this.reset(); }
  reset() { this.steer = 0; this.lift = 0; }
  update(input, dt) {
    const target = Number(!!input.left) - Number(!!input.right);
    // Fast counter-steer, progressive turn-in, decisive return to centre.
    const rate = target === 0 ? 18 : Math.sign(target) !== Math.sign(this.steer) ? 16 : 11;
    this.steer = damp(this.steer, target, rate, dt);
    this.lift = damp(this.lift, Number(!!input.climb) - Number(!!input.dive), 10, dt);
    if (!target && Math.abs(this.steer) < 0.001) this.steer = 0;
    return this;
  }
}

export function steeringGain(spec, speed) {
  const ratio = Math.min(1, Math.abs(speed) / spec.maxSpeed);
  if (spec.air) return spec.hover ? 0.95 : 0.8 + ratio * 0.16;
  // Preserve low-speed manoeuvrability; less twitch at highway/boost speed.
  return Math.min(1, Math.max(0.3, Math.abs(speed) / 24)) * (1 - ratio * 0.34);
}

export function qualityProfile(tier, dpr = 1) {
  const scales = [1.5, 1, 0.85, 0.7];
  const index = Math.max(0, Math.min(3, tier));
  return { ratio: Math.min(dpr, scales[index]), bloom: index < 2, glitch: index < 3 };
}
