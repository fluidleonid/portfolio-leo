export type TactileMaterial = "matte" | "lamp";

class TactileAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastKnobSoundAt = 0;
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
        // Pre-bake a smooth pink-tinted noise buffer for silky rustles & matte transients
        const length = Math.floor(this.ctx.sampleRate * 0.5);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
        }
        this.noiseBuffer = buffer;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Silky, oil-damped rotary potentiometer rustle ("шелест") for the NAV knob.
   * - "drag": soft velvet whisper while turning (throttled so it never scrapes)
   * - "glide": slightly longer airy silk rustle when knob glides to a hovered/selected position
   */
  playKnobRustle(mode: "drag" | "glide" = "drag", requireRunning = false): void {
    if (!this.enabled) return;
    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer) return;
    if (requireRunning && ctx.state !== "running") return;

    const nowMs = performance.now();
    const minInterval = mode === "drag" ? 58 : 45;
    if (nowMs - this.lastKnobSoundAt < minInterval) return;
    this.lastKnobSoundAt = nowMs;

    try {
      const now = ctx.currentTime;
      const jitter = 0.94 + Math.random() * 0.12;
      const isGlide = mode === "glide";

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      // Smooth wide-band velvet shaping (no resonant scratch/scrape!)
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(170, now);
      highpass.Q.setValueAtTime(0.5, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime((isGlide ? 780 : 680) * jitter, now);
      lowpass.Q.setValueAtTime(0.55, now);

      const gain = ctx.createGain();
      const attack = isGlide ? 0.022 : 0.012;
      const duration = isGlide ? 0.105 : 0.055;
      const peak = isGlide ? 0.032 : 0.026;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      const offset = Math.random() * 0.3;
      noise.start(now, offset, duration + 0.01);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /** Backwards-compatible alias for rotary knob rustle */
  playKnobTick(): void {
    this.playKnobRustle("drag");
  }

  /**
   * Subtle warm incandescent lamp buzz/hum inside frosted soft plastic.
   */
  private playLampHum(ctx: AudioContext, durationSec: number, peakGain: number): void {
    const now = ctx.currentTime;
    const jitter = 0.98 + Math.random() * 0.04;

    // Warm analog 108Hz + 216Hz filament hum harmonics
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "triangle";
    osc1.frequency.setValueAtTime(108 * jitter, now);
    osc2.frequency.setValueAtTime(216 * jitter, now);

    // Heavy lowpass keeps it velvety & warm (zero harsh buzzing)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(340, now);
    lowpass.Q.setValueAtTime(0.7, now);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, now);

    const masterGain = ctx.createGain();
    const attack = Math.min(0.045, durationSec * 0.28);
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(peakGain, now + attack);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(lowpass);
    osc2.connect(osc2Gain);
    osc2Gain.connect(lowpass);
    lowpass.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.01);
    osc2.stop(now + durationSec + 0.01);
  }

  /**
   * Single natural press sound for tactile hardware buttons (no double release click).
   * - "matte": dry matte-polymer microswitch click (COMM, CV, CaseLink)
   * - "lamp": soft-plastic press + subtle warm incandescent lamp hum (PET buttons)
   */
  playKeyClick(material: TactileMaterial = "matte"): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.95 + Math.random() * 0.1;
      const isLamp = material === "lamp";

      if (isLamp) {
        // 1. Soft cushioned silicone-plastic touch
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(950 * jitter, now);

        const touchGain = ctx.createGain();
        touchGain.gain.setValueAtTime(0.0001, now);
        touchGain.gain.linearRampToValueAtTime(0.022, now + 0.003);
        touchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

        noise.connect(lowpass);
        lowpass.connect(touchGain);
        touchGain.connect(ctx.destination);

        noise.start(now, Math.random() * 0.3, 0.02);

        // 2. Subtle warm lamp filament buzz/hum on press
        this.playLampHum(ctx, 0.18, 0.02);
        return;
      }

      // Matte hard-polymer microswitch click
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1260 * jitter, now);
      bandpass.Q.setValueAtTime(1.4, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(2050, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.048, now + 0.0008);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.0085);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now, Math.random() * 0.3, 0.014);

      // Dry matte housing tap
      const osc = ctx.createOscillator();
      const bodyFilter = ctx.createBiquadFilter();
      const bodyGain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(215 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.009);

      bodyFilter.type = "lowpass";
      bodyFilter.frequency.setValueAtTime(420, now);

      bodyGain.gain.setValueAtTime(0.0001, now);
      bodyGain.gain.linearRampToValueAtTime(0.013, now + 0.0008);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

      osc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.012);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /**
   * Whisper-soft hover sound when a tactile cap dips 1px or a lamp warms up on mouse hover.
   */
  playHover(material: TactileMaterial = "matte"): void {
    if (!this.enabled) return;
    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer || ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.96 + Math.random() * 0.08;

      if (material === "lamp") {
        // Gentle warm incandescent filament hum as the amber lamp lights up on hover
        this.playLampHum(ctx, 0.16, 0.014);
        return;
      }

      // Soft 1px cap depress whisper for matte buttons
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(920 * jitter, now);
      bandpass.Q.setValueAtTime(1.1, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(1450, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

      noise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now, Math.random() * 0.3, 0.014);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }
}

export const tactileAudio = new TactileAudio();
