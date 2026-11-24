class TactileAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
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
        // Pre-bake a short white-noise buffer once for realistic physical microswitch transients
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
   * Uses a dry 6ms filtered-noise contact impulse (no boomy synth sweep).
   */
  playKnobTick(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.94 + Math.random() * 0.12;

      // 1. Crisp-yet-muted mechanical detent transient (filtered noise, 6ms)
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
      noiseGain.gain.linearRampToValueAtTime(0.032, now + 0.001);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const offset = Math.random() * 0.18;
      noise.start(now, offset, 0.01);

      // 2. Whisper-quiet dry housing body impulse (7ms, no sub-bass boom)
      const osc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(250 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.007);

      bodyGain.gain.setValueAtTime(0.012, now);
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
   * Natural matte-hardware tactile key click (COMM / PET / CV / CaseLink).
   * Ultra-short filtered physical transient + tiny dry chassis tap — quiet & organic, never boomy.
   */
  playKeyClick(type: "down" | "up" = "down"): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.95 + Math.random() * 0.1;
      const isDown = type === "down";

      // 1. Primary tactile switch contact impulse (filtered noise burst)
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime((isDown ? 1280 : 1750) * jitter, now);
      bandpass.Q.setValueAtTime(isDown ? 1.4 : 1.7, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(isDown ? 2100 : 2500, now);

      const noiseGain = ctx.createGain();
      const peakNoise = isDown ? 0.044 : 0.022;
      const decaySec = isDown ? 0.009 : 0.006;

      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(peakNoise, now + 0.0008);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const offset = Math.random() * 0.18;
      noise.start(now, offset, decaySec + 0.004);

      // 2. Subtle dry matte-plastic chassis weight (10ms damped mid-low tap, NOT a kick drum)
      const osc = ctx.createOscillator();
      const bodyFilter = ctx.createBiquadFilter();
      const bodyGain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime((isDown ? 210 : 270) * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(isDown ? 105 : 155, now + 0.01);

      bodyFilter.type = "lowpass";
      bodyFilter.frequency.setValueAtTime(420, now);

      const peakBody = isDown ? 0.016 : 0.007;
      bodyGain.gain.setValueAtTime(peakBody, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.011);

      osc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.013);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }
}

export const tactileAudio = new TactileAudio();
