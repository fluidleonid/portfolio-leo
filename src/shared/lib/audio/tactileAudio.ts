export type TactileMaterial = "matte" | "lamp";

class TactileAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  public enabled = true;

  private getContext(allowCreate = true): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        if (!allowCreate) return null;
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {});
      }
      if (!this.noiseBuffer) {
        // Pre-bake a short white-noise buffer once for realistic physical transients
        const length = Math.floor(this.ctx.sampleRate * 0.25);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Subtle, natural mechanical detent tick for the rotary NAV knob.
   */
  playKnobTick(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.94 + Math.random() * 0.12;

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1050 * jitter, now);
      bandpass.Q.setValueAtTime(1.8, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(1900, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.03, now + 0.001);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const offset = Math.random() * 0.18;
      noise.start(now, offset, 0.01);

      const osc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(250 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.007);

      bodyGain.gain.setValueAtTime(0.011, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      osc.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.01);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /**
   * Single natural press sound for tactile hardware buttons (no double release click).
   * - "matte": dry matte-polymer microswitch click (COMM, CV, CaseLink)
   * - "lamp": cushioned soft-plastic / silicone diffuser dome press (PET lamp buttons)
   */
  playKeyClick(material: TactileMaterial = "matte"): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.95 + Math.random() * 0.1;
      const isLamp = material === "lamp";

      // 1. Primary tactile contact impulse (filtered noise)
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime((isLamp ? 740 : 1260) * jitter, now);
      bandpass.Q.setValueAtTime(isLamp ? 1.15 : 1.45, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(isLamp ? 1280 : 2050, now);

      const noiseGain = ctx.createGain();
      const attack = isLamp ? 0.0022 : 0.0008;
      const decay = isLamp ? 0.013 : 0.0085;
      const peakNoise = isLamp ? 0.036 : 0.042;

      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(peakNoise, now + attack);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const offset = Math.random() * 0.18;
      noise.start(now, offset, decay + 0.004);

      // 2. Subtle dry chassis body (soft silicone cushion for lamp vs dry matte housing)
      const osc = ctx.createOscillator();
      const bodyFilter = ctx.createBiquadFilter();
      const bodyGain = ctx.createGain();

      osc.type = isLamp ? "sine" : "triangle";
      osc.frequency.setValueAtTime((isLamp ? 185 : 215) * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(
        isLamp ? 115 : 110,
        now + (isLamp ? 0.012 : 0.009)
      );

      bodyFilter.type = "lowpass";
      bodyFilter.frequency.setValueAtTime(isLamp ? 320 : 420, now);

      bodyGain.gain.setValueAtTime(0.0001, now);
      bodyGain.gain.linearRampToValueAtTime(isLamp ? 0.014 : 0.014, now + (isLamp ? 0.002 : 0.0008));
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + (isLamp ? 0.014 : 0.01));

      osc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + (isLamp ? 0.016 : 0.012));
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /**
   * Whisper-soft hover depress sound when a tactile cap dips 1px on mouse hover.
   * Silently skips if AudioContext is not yet unlocked by a user gesture.
   */
  playHover(material: TactileMaterial = "matte"): void {
    if (!this.enabled) return;
    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer || ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.96 + Math.random() * 0.08;
      const isLamp = material === "lamp";

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime((isLamp ? 620 : 920) * jitter, now);
      bandpass.Q.setValueAtTime(isLamp ? 1.1 : 1.3, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(isLamp ? 1100 : 1480, now);

      const gain = ctx.createGain();
      const attack = isLamp ? 0.0025 : 0.0015;
      const decay = isLamp ? 0.011 : 0.0075;
      const peak = isLamp ? 0.015 : 0.016;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      const offset = Math.random() * 0.18;
      noise.start(now, offset, decay + 0.004);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }
}

export const tactileAudio = new TactileAudio();
