/**
 * GRID PROTOCOL - PROCEDURAL AUDIO ENGINE
 * 100% Web Audio API synthesized soundtrack & SFX (Zero external asset dependencies)
 * Generates Daft Punk / Nine Inch Nails style Tron dark synthwave music + reactive SFX
 */

class TronAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isPlayingMusic = false;
    
    // Master Bus
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Engine Sound Synth
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineFilter = null;
    this.engineGain = null;

    // Music Sequencer State
    this.bpm = 126;
    this.step = 0;
    this.musicTimer = null;
    this.bassNotes = [
      73.42, 73.42, 146.83, 73.42,  // D2, D2, D3, D2
      87.31, 87.31, 174.61, 87.31,  // F2, F2, F3, F2
      65.41, 65.41, 130.81, 65.41,  // C2, C2, C3, C2
      55.00, 55.00, 110.00, 73.42   // A1, A1, A2, D2
    ];
    this.arpNotes = [
      293.66, 349.23, 440.00, 523.25, // D4, F4, A4, C5
      349.23, 440.00, 523.25, 587.33, // F4, A4, C5, D5
      261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
      220.00, 293.66, 349.23, 440.00  // A3, D4, F4, A4
    ];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.initEngineSynth();
    this.startMusic();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // --- Dynamic Vehicle Engine Sound ---
  initEngineSynth() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(65, now);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(32.5, now);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(220, now);
    this.engineFilter.Q.setValueAtTime(3.0, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, now);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start(now);
    this.engineSubOsc.start(now);
  }

  updateEngine(speedNormalized, isJetMode = false, isBoosting = false) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter) return;
    const now = this.ctx.currentTime;

    // Pitch rises with velocity
    const baseFreq = isJetMode ? 110 : 65;
    const maxFreq = isJetMode ? 380 : 260;
    const targetFreq = baseFreq + (maxFreq - baseFreq) * speedNormalized + (isBoosting ? 60 : 0);
    
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);

    const filterTarget = 200 + speedNormalized * 1400 + (isBoosting ? 800 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterTarget, now, 0.08);

    const targetGain = Math.max(0.05, Math.min(0.25, 0.08 + speedNormalized * 0.15 + (isBoosting ? 0.08 : 0)));
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  // --- Sound Effects (SFX) ---

  /**
   * REAR LASER CANNON SOUND (User specifically requested feature!)
   * Distinctive high-energy backward pulse blast with metallic punch & punchy bass
   */
  playRearLaser() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Dual oscillator pulse: one sub thump + one descending laser zap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.18);
    filter.Q.setValueAtTime(4.5, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.24);

    // Sub thump for heavy recoil
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.18);
  }

  /**
   * FORWARD PLASMA LASER SOUND
   */
  playForwardLaser() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * VEHICLE TRANSFORMATION (Cycle <-> Jet)
   * Mechanical servos, wing hydraulic deployment, and turbine spin-up
   */
  playTransform(toJet = true) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Servo sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    if (toJet) {
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.45);
    } else {
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.45);
    }

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);

    // Hydraulic whoosh
    this.playNoiseBurst(0.4, 800, 1800, 0.22);
  }

  /**
   * EXPLOSION (Disintegrating Lightcycle or Sky Jet)
   */
  playExplosion() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Low-end impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(180, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.45);
    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.52);

    // Disintegration digital debris noise
    this.playNoiseBurst(0.55, 400, 2200, 0.5);
  }

  /**
   * BOOST THRUSTER ENGAGED
   */
  playBoost() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);

    this.playNoiseBurst(0.35, 1200, 3000, 0.25);
  }

  /**
   * EMP DISCHARGE
   */
  playEMP() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  /**
   * HIT CONFIRMATION BEEP
   */
  playHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(1800, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * SUSTAINED BEAM IGNITION — Particle Lazer (deep) / Ribbon Cutter (bright)
   */
  playBeam(kind = 'primary') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const base = kind === 'primary' ? 140 : 320;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = kind === 'primary' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.5, now + 0.25);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(kind === 'primary' ? 700 : 1600, now);
    filter.Q.setValueAtTime(2.4, now);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
    osc.start(now); osc.stop(now + 0.62);

    this.playNoiseBurst(0.5, kind === 'primary' ? 300 : 900, 2600, 0.16);
  }

  playNoiseBurst(duration, lowCut, highCut, volume) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((lowCut + highCut) / 2, now);
    filter.Q.setValueAtTime(1.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration + 0.01);
  }

  // --- TRON SYNTHWAVE SOUNDTRACK SEQUENCER ---
  startMusic() {
    if (this.isPlayingMusic || !this.ctx) return;
    this.isPlayingMusic = true;
    this.step = 0;

    const stepTime = (60 / this.bpm) / 4; // 16th note interval

    this.musicTimer = setInterval(() => {
      if (this.ctx && this.ctx.state === 'running' && !this.isMuted) {
        this.stepMusicTick();
      }
    }, stepTime * 1000);
  }

  stepMusicTick() {
    const now = this.ctx.currentTime;
    const s = this.step % 16;
    const bar = Math.floor(this.step / 16) % 4;

    // 1. Cyber Kick Drum (Steps 0, 4, 8, 12)
    if (s % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(135, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
      kickGain.gain.setValueAtTime(0.35, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.15);
    }

    // 2. Cyber Snare / Clap (Steps 4, 12)
    if (s === 4 || s === 12) {
      this.playNoiseBurst(0.12, 1000, 4000, 0.12);
    }

    // 3. Hi-Hat (Every odd 16th note)
    if (s % 2 !== 0) {
      this.playNoiseBurst(0.03, 5000, 10000, 0.05);
    }

    // 4. Bassline Arpeggio
    const bassFreq = this.bassNotes[s];
    if (bassFreq) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = (s % 2 === 0) ? 'sawtooth' : 'square';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassFilter.type = 'lowpass';
      const cutoff = (s % 4 === 0) ? 650 : 380;
      bassFilter.frequency.setValueAtTime(cutoff, now);
      bassFilter.Q.setValueAtTime(3.5, now);

      bassGain.gain.setValueAtTime(0.2, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.12);
    }

    // 5. Tron Neon Arp Lead
    if (this.step % 2 === 0) {
      const arpIdx = (this.step / 2) % this.arpNotes.length;
      const arpFreq = this.arpNotes[arpIdx];
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'sawtooth';
      leadOsc.frequency.setValueAtTime(arpFreq, now);

      leadGain.gain.setValueAtTime(0.08, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(now);
      leadOsc.stop(now + 0.2);
    }

    this.step++;
  }

  /**
   * HOMING MISSILE / ROCKET LAUNCH — whoosh + rising turbine
   */
  playMissile() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.52);

    this.playNoiseBurst(0.45, 600, 3200, 0.22);
  }

  /**
   * BOMB DEPLOYED / DETONATION — deep clunk
   */
  playBomb() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'square';
    sub.frequency.setValueAtTime(240, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.3);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.36);

    this.playNoiseBurst(0.3, 150, 900, 0.3);
  }

  /**
   * ENERGY CELL COLLECTED — bright ascending double chime
   */
  playPickup() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.09;
      osc.frequency.setValueAtTime(i === 0 ? 880 : 1320, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }
}

export const audio = new TronAudioEngine();
