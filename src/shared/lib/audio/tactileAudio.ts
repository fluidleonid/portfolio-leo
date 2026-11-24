export type TactileMaterial = "matte" | "lamp";

interface ActiveKnobDragVoice {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

class TactileAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeDragVoice: ActiveKnobDragVoice | null = null;
  private activeGlideGain: GainNode | null = null;
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
        // Pre-bake a seamless 1.5s brown/pink-velvet noise loop for oil-damped friction & transients
        const length = Math.floor(this.ctx.sampleRate * 1.5);
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
        // Tiny crossfade at loop seam so looping never clicks
        const fadeSamples = 256;
        for (let i = 0; i < fadeSamples; i++) {
          const t = i / fadeSamples;
          data[i] = data[i] * t + data[length - fadeSamples + i] * (1 - t);
        }
        this.noiseBuffer = buffer;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Continuous velocity-coupled oil-damped friction while rotating the NAV knob.
   * Uses a single dead-dry low-frequency voice (zero overlapping bursts, zero room echo).
   */
  updateKnobDrag(angularSpeedDeg: number): void {
    if (!this.enabled || angularSpeedDeg <= 0.15) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;

      if (!this.activeDragVoice) {
        const source = ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        // Dead-dry greased shaft band: warm low-mid (80–280Hz), zero hollow/echoey highs
        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.setValueAtTime(75, now);
        highpass.Q.setValueAtTime(0.4, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(240, now);
        filter.Q.setValueAtTime(0.35, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);

        source.connect(highpass);
        highpass.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start(now, Math.random() * 0.8);

        this.activeDragVoice = {
          source,
          filter,
          gain,
          idleTimer: null,
        };
      }

      const voice = this.activeDragVoice;
      const clampedSpeed = Math.min(14, angularSpeedDeg);
      const targetGain = Math.min(0.024, 0.004 + clampedSpeed * 0.0016);
      const targetCutoff = 210 + clampedSpeed * 12;

      voice.filter.frequency.setTargetAtTime(targetCutoff, now, 0.015);
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(targetGain, now, 0.012);

      if (voice.idleTimer) {
        clearTimeout(voice.idleTimer);
      }
      // Immediately silence when finger pauses (no lingering echo tail)
      voice.idleTimer = setTimeout(() => {
        if (!this.activeDragVoice || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.activeDragVoice.gain.gain.cancelScheduledValues(t);
        this.activeDragVoice.gain.gain.setTargetAtTime(0.0001, t, 0.014);
      }, 38);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /** Cleanly releases the continuous oil-damped knob drag voice */
  stopKnobDrag(): void {
    const voice = this.activeDragVoice;
    if (!voice) return;
    this.activeDragVoice = null;

    if (voice.idleTimer) {
      clearTimeout(voice.idleTimer);
    }
    try {
      if (this.ctx) {
        const now = this.ctx.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
        voice.source.stop(now + 0.028);
      } else {
        voice.source.stop();
      }
    } catch {
      // Ignore stop errors
    }
  }

  /**
   * Single dead-dry oiled turn when the NAV knob glides to a hovered/selected position.
   * Monophonic (cancels previous glide) so rapid hovers never overlap or echo.
   */
  playKnobRustle(mode: "drag" | "glide" = "glide", requireRunning = false): void {
    if (!this.enabled) return;
    if (mode === "drag") {
      this.updateKnobDrag(5);
      return;
    }

    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer) return;
    if (requireRunning && ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;

      // Cancel any previous glide immediately so it never echoes
      if (this.activeGlideGain) {
        try {
          this.activeGlideGain.gain.cancelScheduledValues(now);
          this.activeGlideGain.gain.setTargetAtTime(0.0001, now, 0.006);
        } catch {
          // ignore
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(75, now);
      highpass.Q.setValueAtTime(0.4, now);

      // Low, heavily damped greased-bearing filter (280Hz -> 175Hz, zero hollow air)
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(290, now);
      lowpass.frequency.exponentialRampToValueAtTime(175, now + 0.058);
      lowpass.Q.setValueAtTime(0.35, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      this.activeGlideGain = gain;
      noise.start(now, Math.random() * 0.8, 0.066);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /** Backwards-compatible alias */
  playKnobTick(): void {
    this.playKnobRustle("glide");
  }

  /**
   * Warm, lower-pitched incandescent lamp hum with gentle analog wave undulation.
   */
  private playLampHum(ctx: AudioContext, durationSec: number, peakGain: number): void {
    const now = ctx.currentTime;
    const jitter = 0.98 + Math.random() * 0.04;

    // Lower warm filament register (74Hz + detuned 78.5Hz for natural wave + 148Hz warmth)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "triangle";
    oscSub.type = "sine";

    osc1.frequency.setValueAtTime(74 * jitter, now);
    osc2.frequency.setValueAtTime(78.5 * jitter, now);
    oscSub.frequency.setValueAtTime(148 * jitter, now);

    // Gentle 15Hz LFO wave modulating filter warmth & subtle amplitude undulation ("немного волн")
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(15.5, now);

    const lfoFilterDepth = ctx.createGain();
    lfoFilterDepth.gain.setValueAtTime(52, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(255, now);
    lowpass.Q.setValueAtTime(0.75, now);

    lfo.connect(lfoFilterDepth);
    lfoFilterDepth.connect(lowpass.frequency);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.65, now);

    const oscSubGain = ctx.createGain();
    oscSubGain.gain.setValueAtTime(0.3, now);

    // Wave tremolo stage
    const waveStage = ctx.createGain();
    waveStage.gain.setValueAtTime(0.78, now);
    const lfoAmpDepth = ctx.createGain();
    lfoAmpDepth.gain.setValueAtTime(0.24, now);
    lfo.connect(lfoAmpDepth);
    lfoAmpDepth.connect(waveStage.gain);

    const masterGain = ctx.createGain();
    const attack = Math.min(0.042, durationSec * 0.25);
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(peakGain, now + attack);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(lowpass);
    osc2.connect(osc2Gain);
    osc2Gain.connect(lowpass);
    oscSub.connect(oscSubGain);
    oscSubGain.connect(lowpass);

    lowpass.connect(waveStage);
    waveStage.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);
    lfo.start(now);

    const stopAt = now + durationSec + 0.012;
    osc1.stop(stopAt);
    osc2.stop(stopAt);
    oscSub.stop(stopAt);
    lfo.stop(stopAt);
  }

  /**
   * Single natural press sound for tactile hardware buttons.
   * - "matte": dry matte-polymer microswitch click (COMM, CV, CaseLink)
   * - "lamp": soft-plastic press + lower warm undulating lamp hum (PET buttons)
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
        // 1. Soft cushioned silicone-plastic touch (lower & softer)
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(780 * jitter, now);

        const touchGain = ctx.createGain();
        touchGain.gain.setValueAtTime(0.0001, now);
        touchGain.gain.linearRampToValueAtTime(0.02, now + 0.003);
        touchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

        noise.connect(lowpass);
        lowpass.connect(touchGain);
        touchGain.connect(ctx.destination);

        noise.start(now, Math.random() * 0.8, 0.02);

        // 2. Deeper warm undulating lamp buzz/hum
        this.playLampHum(ctx, 0.22, 0.024);
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

      noise.start(now, Math.random() * 0.8, 0.014);

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
        // Deeper warm undulating filament hum on hover
        this.playLampHum(ctx, 0.2, 0.017);
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

      noise.start(now, Math.random() * 0.8, 0.014);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }
}

export const tactileAudio = new TactileAudio();
