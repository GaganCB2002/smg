/* ============================================================================
 * Ambient score for the invitation.
 *
 * Two modes:
 *  1. FILE  — if `music.src` is set in the config, that audio file is looped.
 *  2. GENERATED — otherwise a live Web Audio score is performed: slow silk-soft
 *     chord pads, a deep drone and occasional champagne-bright bell notes over
 *     a procedurally built reverb. Nothing to download, never repeats twice,
 *     no licensing, and it degrades to silence on unsupported browsers.
 *
 * Sound is NEVER started automatically — only from the music button.
 * ==========================================================================*/

const CHORDS = [
  [50, 54, 57, 61, 64], // Dmaj9
  [47, 50, 54, 57, 62], // Bm7 add
  [43, 47, 50, 54, 61], // Gmaj7
  [45, 49, 52, 57, 59], // A6/9
];
const BELL_SCALE = [74, 76, 78, 81, 83, 86]; // D major pentatonic, high register

const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

class AmbientScore {
  constructor() {
    this.mode = 'generated';
    this.playing = false;
    this.failed = false;
    this.ctx = null;
    this.audio = null;
    this.timer = null;
    this.nodes = new Set();
    this.volume = 0.45;
    this.nextChordAt = 0;
    this.nextBellAt = 0;
    this.chordIndex = 0;
    this.fadeRaf = 0;
  }

  /* ------------------------------------------------------------ public -- */
  async start({ src = '', volume = 0.45 } = {}) {
    this.volume = volume;
    this.mode = src ? 'file' : 'generated';
    try {
      if (this.mode === 'file') await this._startFile(src);
      else await this._startGenerated();
      this.playing = true;
      this.failed = false;
      return true;
    } catch (err) {
      this.failed = true;
      this.playing = false;
      if (import.meta.env.DEV) console.warn('[music] unable to start:', err);
      return false;
    }
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.mode === 'file' && this.audio) {
      this._fadeAudioElement(0, () => {
        try { this.audio?.pause(); } catch { /* noop */ }
        this.audio = null;
      });
      return;
    }
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = this.master;
    const now = ctx.currentTime;
    try {
      master?.gain.cancelScheduledValues(now);
      master?.gain.setValueAtTime(master.gain.value, now);
      master?.gain.linearRampToValueAtTime(0, now + 1.4);
    } catch { /* noop */ }

    // Full teardown once the fade is done: no orphaned nodes, no CPU burn.
    setTimeout(() => {
      this.nodes.forEach((n) => {
        try { n.stop?.(); } catch { /* noop */ }
        try { n.disconnect(); } catch { /* noop */ }
      });
      this.nodes.clear();
      if (this.ctx === ctx) {
        try { ctx.close(); } catch { /* noop */ }
        this.ctx = null;
        this.master = null;
        this.bus = null;
        this.filter = null;
        this.reverb = null;
      }
    }, 1600);
  }

  setVolume(v) {
    this.volume = v;
    if (this.playing && this.mode === 'file' && this.audio) this.audio.volume = v;
    if (this.playing && this.mode === 'generated' && this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.4);
    }
  }

  dispose() {
    this.stop();
    if (this.fadeRaf) cancelAnimationFrame(this.fadeRaf);
  }

  /* ------------------------------------------------------------- file --- */
  async _startFile(src) {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.crossOrigin = 'anonymous';
    await audio.play();
    this.audio = audio;
    this._fadeAudioElement(this.volume);
  }

  _fadeAudioElement(target, done) {
    if (!this.audio) return done?.();
    const from = this.audio.volume;
    const steps = 24;
    let i = 0;
    cancelAnimationFrame(this.fadeRaf);
    const step = () => {
      i += 1;
      const t = Math.min(1, i / steps);
      this.audio.volume = from + (target - from) * t;
      if (t < 1) this.fadeRaf = requestAnimationFrame(step);
      else done?.();
    };
    this.fadeRaf = requestAnimationFrame(step);
  }

  /* -------------------------------------------------------- generated --- */
  async _startGenerated() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('Web Audio unavailable');

    const ctx = this.ctx || new AudioCtx();
    this.ctx = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const bus = ctx.createGain();
    bus.gain.value = 0.5;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 950;
    filter.Q.value = 0.7;

    const reverb = ctx.createConvolver();
    reverb.buffer = this._impulse(ctx, 3.8, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.62;
    const dry = ctx.createGain();
    dry.gain.value = 0.5;

    filter.connect(bus);
    bus.connect(dry);
    bus.connect(reverb);
    reverb.connect(wet);
    dry.connect(master);
    wet.connect(master);

    // Slow breathing of the filter — the "silk" movement.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 320;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Deep drone: two sines a fifth apart, barely there.
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.055;
    droneGain.connect(bus);
    [36.71, 55].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 1 : 0.45;
      o.connect(g);
      g.connect(droneGain);
      o.start();
      this.nodes.add(o);
      this.nodes.add(g);
    });

    this.master = master;
    this.bus = bus;
    this.filter = filter;
    this.reverb = reverb;
    this.nodes.add(master);
    this.nodes.add(bus);
    this.nodes.add(filter);
    this.nodes.add(reverb);
    this.nodes.add(wet);
    this.nodes.add(dry);
    this.nodes.add(lfo);
    this.nodes.add(lfoGain);
    this.nodes.add(droneGain);

    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 3);

    this.nextChordAt = ctx.currentTime + 0.15;
    this.nextBellAt = ctx.currentTime + 4;
    this.timer = setInterval(() => this._tick(), 250);
    this._tick();
  }

  _tick() {
    const ctx = this.ctx;
    if (!ctx || !this.playing) return;
    const now = ctx.currentTime;
    const horizon = now + 2.5;

    while (this.nextChordAt < horizon) {
      this._chord(this.nextChordAt, CHORDS[this.chordIndex % CHORDS.length]);
      this.chordIndex += 1;
      this.nextChordAt += 12; // one chord every 12s
    }
    while (this.nextBellAt < horizon) {
      if (Math.random() > 0.25) this._bell(this.nextBellAt);
      this.nextBellAt += 4 + Math.random() * 7;
    }
  }

  _chord(t, notes) {
    const ctx = this.ctx;
    const duration = 13.5;
    notes.forEach((midi, i) => {
      const freq = midiToFreq(midi);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.06 / (1 + i * 0.35), t + 4.5);
      env.gain.setValueAtTime(0.06 / (1 + i * 0.35), t + duration - 6);
      env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      env.connect(this.filter);

      const detunes = [-4, 5];
      detunes.forEach((cents, k) => {
        const osc = ctx.createOscillator();
        osc.type = k === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = cents + (Math.random() * 4 - 2);
        const g = ctx.createGain();
        g.gain.value = k === 0 ? 1 : 0.35;
        osc.connect(g);
        g.connect(env);
        osc.start(t);
        osc.stop(t + duration + 0.2);
        osc.onended = () => {
          try { osc.disconnect(); g.disconnect(); } catch { /* noop */ }
          this.nodes.delete(osc);
          this.nodes.delete(g);
        };
        this.nodes.add(osc);
        this.nodes.add(g);
      });

      this.nodes.add(env);
      setTimeout(() => {
        try { env.disconnect(); } catch { /* noop */ }
        this.nodes.delete(env);
      }, (t - ctx.currentTime + duration + 0.5) * 1000);
    });
  }

  _bell(t) {
    const ctx = this.ctx;
    const midi = BELL_SCALE[Math.floor(Math.random() * BELL_SCALE.length)];
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = midiToFreq(midi);

    const partial = ctx.createOscillator();
    partial.type = 'sine';
    partial.frequency.value = midiToFreq(midi + 12);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);

    const partialGain = ctx.createGain();
    partialGain.gain.value = 0.28;

    osc.connect(env);
    partial.connect(partialGain);
    partialGain.connect(env);
    env.connect(this.bus);

    osc.start(t);
    partial.start(t);
    osc.stop(t + 4.4);
    partial.stop(t + 4.4);
    osc.onended = () => {
      try {
        osc.disconnect(); partial.disconnect(); partialGain.disconnect(); env.disconnect();
      } catch { /* noop */ }
      [osc, partial, partialGain, env].forEach((n) => this.nodes.delete(n));
    };
    [osc, partial, partialGain, env].forEach((n) => this.nodes.add(n));
  }

  _impulse(ctx, seconds = 3.5, decay = 2.4) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        // Smooth noise tail → a soft hall, not a bright plate.
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * 0.55;
      }
    }
    return buffer;
  }
}

let instance = null;
export function getAudioEngine() {
  if (!instance) instance = new AmbientScore();
  return instance;
}

export function audioSupported() {
  return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext || window.Audio);
}
