export type TactileMaterial = "matte" | "lamp";

export interface TactileAudioParams {
  masterGain: number;

  // 1. Matte buttons (COMM / CV / CaseLink)
  matteClickGain: number;
  matteClickFreq: number;
  matteClickDecayMs: number;
  matteBodyGain: number;
  matteBodyFreq: number;
  matteHoverGain: number;
  matteHoverFreq: number;

  // 2. Lamp buttons (PET 1 / 2 / 3)
  lampHumGain: number;
  lampHoverGain: number;
  lampBaseFreq: number;
  lampDetuneHz: number;
  lampLowpassHz: number;
  lampWaveRateHz: number;
  lampWaveDepth: number;
  lampDurationMs: number;
  lampTouchGain: number;

  // 3. Rotary NAV Knob
  knobDragGain: number;
  knobAttackMs: number;
  knobReleaseMs: number;
  knobSpeedSens: number;
  knobLowpassHz: number;
  knobHighpassHz: number;
  knobSnapGain: number;
  knobGlideGain: number;
  knobGlideAttackMs: number;
  knobGlideDurationMs: number;
}

export const DEFAULT_TACTILE_AUDIO_PARAMS: TactileAudioParams = {
  masterGain: 0.55,

  matteClickGain: 0.048,
  matteClickFreq: 740,
  matteClickDecayMs: 15,
  matteBodyGain: 0.055,
  matteBodyFreq: 215,
  matteHoverGain: 0.08,
  matteHoverFreq: 300,

  lampHumGain: 0.018,
  lampHoverGain: 0.014,
  lampBaseFreq: 72,
  lampDetuneHz: 0,
  lampLowpassHz: 165,
  lampWaveRateHz: 22,
  lampWaveDepth: 0,
  lampDurationMs: 500,
  lampTouchGain: 0.001,

  knobDragGain: 0.012,
  knobAttackMs: 200,
  knobReleaseMs: 20,
  knobSpeedSens: 0.95,
  knobLowpassHz: 60,
  knobHighpassHz: 30,
  knobSnapGain: 0,
  knobGlideGain: 0.108,
  knobGlideAttackMs: 98,
  knobGlideDurationMs: 145,
};

interface ActiveKnobDragVoice {
  source: AudioBufferSourceNode;
  highpass: BiquadFilterNode;
  highpass2: BiquadFilterNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

class TactileAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeDragVoice: ActiveKnobDragVoice | null = null;
  private activeGlideGain: GainNode | null = null;
  private smoothedSpeed = 0;
  private dragCooldownUntil = 0;
  public isKnobDragging = false;
  public enabled = true;
  public params: TactileAudioParams = { ...DEFAULT_TACTILE_AUDIO_PARAMS };

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
        const length = Math.floor(this.ctx.sampleRate * 1.5);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        let sum = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          const sample = (b0 + b1 + b2 + white * 0.1848) * 0.18;
          data[i] = sample;
          sum += sample;
        }
        // Zero mean removes DC-offset envelope thumps
        const mean = sum / length;
        for (let i = 0; i < length; i++) {
          data[i] -= mean;
        }
        // Smooth cosine crossfade at loop seam
        const fadeSamples = 1024;
        for (let i = 0; i < fadeSamples; i++) {
          const t = 0.5 - 0.5 * Math.cos((i / fadeSamples) * Math.PI);
          data[i] = data[i] * t + data[length - fadeSamples + i] * (1 - t);
        }
        this.noiseBuffer = buffer;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private smoothParam(param: AudioParam, target: number, now: number, timeConstantSec: number): void {
    const current = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(current, now);
    param.setTargetAtTime(target, now, Math.max(0.008, timeConstantSec));
  }

  /** Marks knob drag start and silences any active hover glide so crossing NAV items never thumps */
  startKnobDrag(): void {
    this.isKnobDragging = true;
    this.smoothedSpeed = 0;
    if (this.activeGlideGain && this.ctx) {
      try {
        this.smoothParam(this.activeGlideGain.gain, 0.00001, this.ctx.currentTime, 0.012);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Continuous velocity-coupled oil-damped friction while rotating the NAV knob.
   * Uses EMA-smoothed deg/16ms speed & steady filter cutoff so crossing NAV items never causes a thump.
   */
  updateKnobDrag(normalizedSpeedDegPerFrame: number): void {
    this.isKnobDragging = true;
    const p = this.params;
    if (
      !this.enabled ||
      p.masterGain <= 0 ||
      p.knobDragGain <= 0 ||
      normalizedSpeedDegPerFrame <= 0.05
    ) {
      return;
    }
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const hpFreq = Math.max(25, p.knobHighpassHz);
      const lpFreq = Math.max(hpFreq + 20, p.knobLowpassHz);

      if (!this.activeDragVoice) {
        const source = ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.setValueAtTime(hpFreq, now);
        highpass.Q.setValueAtTime(0.5, now);

        const highpass2 = ctx.createBiquadFilter();
        highpass2.type = "highpass";
        highpass2.frequency.setValueAtTime(hpFreq, now);
        highpass2.Q.setValueAtTime(0.5, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(lpFreq, now);
        filter.Q.setValueAtTime(0.4, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.00001, now);

        source.connect(highpass);
        highpass.connect(highpass2);
        highpass2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start(now, Math.random() * 0.8);

        this.activeDragVoice = {
          source,
          highpass,
          highpass2,
          filter,
          gain,
          idleTimer: null,
        };
      }

      const voice = this.activeDragVoice;
      // Heavy EMA smoothing eliminates any 1-frame velocity spike when crossing NAV items
      const rawClamped = Math.min(8, normalizedSpeedDegPerFrame);
      this.smoothedSpeed = this.smoothedSpeed * 0.78 + rawClamped * 0.22;

      const sens = Math.max(0, Math.min(1, p.knobSpeedSens));
      const speedFactor = (1 - sens) + sens * Math.min(1.15, 0.25 + (this.smoothedSpeed / 7) * 0.9);
      const targetGain = Math.max(0.00005, p.knobDragGain * speedFactor * p.masterGain);

      // Safe envelope floor (>= 28ms on sub-bass) prevents waveform-chop thumps at 60Hz
      const attackTau = Math.max(0.015, (p.knobAttackMs / 1000) * 0.45);
      const releaseTau = Math.max(0.028, (p.knobReleaseMs / 1000) * 0.45);

      this.smoothParam(voice.highpass.frequency, hpFreq, now, 0.03);
      this.smoothParam(voice.highpass2.frequency, hpFreq, now, 0.03);
      // Keep lowpass rock-steady at lpFreq (no frequency-jump "wah" thump!)
      this.smoothParam(voice.filter.frequency, lpFreq, now, 0.04);
      this.smoothParam(
        voice.gain.gain,
        targetGain,
        now,
        targetGain >= voice.gain.gain.value ? attackTau : releaseTau
      );

      if (voice.idleTimer) {
        clearTimeout(voice.idleTimer);
      }
      voice.idleTimer = setTimeout(() => {
        if (!this.activeDragVoice || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.smoothedSpeed = 0;
        const tau = Math.max(0.028, (this.params.knobReleaseMs / 1000) * 0.45);
        this.smoothParam(this.activeDragVoice.gain.gain, 0.00001, t, tau);
      }, 95);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /** Cleanly releases the continuous oil-damped knob drag voice without any pop/thump */
  stopKnobDrag(): void {
    this.isKnobDragging = false;
    this.smoothedSpeed = 0;
    this.dragCooldownUntil = typeof performance !== "undefined" ? performance.now() + 220 : 0;

    const voice = this.activeDragVoice;
    if (!voice) return;
    this.activeDragVoice = null;

    if (voice.idleTimer) {
      clearTimeout(voice.idleTimer);
    }
    try {
      if (this.ctx) {
        const now = this.ctx.currentTime;
        const relSec = Math.max(0.045, this.params.knobReleaseMs / 1000);
        const currentVal = Math.max(0.00001, voice.gain.gain.value);
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(currentVal, now);
        voice.gain.gain.linearRampToValueAtTime(0.00001, now + relSec);
        voice.source.stop(now + relSec + 0.02);
      } else {
        voice.source.stop();
      }
    } catch {
      // Ignore stop errors
    }
  }

  /** Optional soft detent sound on pointer release snap (default 0 = silent) */
  playKnobSnap(): void {
    const p = this.params;
    if (!this.enabled || p.masterGain <= 0 || p.knobSnapGain <= 0.0001) return;
    this.playGlideBurst(p.knobSnapGain * p.masterGain, false);
  }

  /**
   * Single dead-dry oiled turn when the NAV knob glides to a hovered/selected position.
   * Strictly suppressed during active knob drag and post-drag cooldown so hitting NAV items never thumps!
   */
  playKnobRustle(mode: "drag" | "glide" = "glide", requireRunning = false): void {
    const p = this.params;
    if (!this.enabled || p.masterGain <= 0) return;
    if (mode === "drag") {
      this.updateKnobDrag(4);
      return;
    }
    // Never fire hover/glide burst while dragging the knob or releasing over a NAV label
    if (
      this.isKnobDragging ||
      (typeof performance !== "undefined" && performance.now() < this.dragCooldownUntil)
    ) {
      return;
    }
    if (p.knobGlideGain <= 0.0001) return;
    this.playGlideBurst(p.knobGlideGain * p.masterGain, requireRunning);
  }

  private playGlideBurst(peak: number, requireRunning: boolean): void {
    const p = this.params;
    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer) return;
    if (requireRunning && ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const durSec = Math.max(0.02, p.knobGlideDurationMs / 1000);
      const attackSec = Math.min(durSec * 0.68, Math.max(0.008, p.knobGlideAttackMs / 1000));
      const hpFreq = Math.max(25, p.knobHighpassHz);
      const lpFreq = Math.max(hpFreq + 20, p.knobLowpassHz);

      if (this.activeGlideGain) {
        try {
          this.smoothParam(this.activeGlideGain.gain, 0.00001, now, 0.015);
        } catch {
          // ignore
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(hpFreq, now);
      highpass.Q.setValueAtTime(0.5, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(lpFreq * 1.15, now);
      lowpass.frequency.exponentialRampToValueAtTime(
        Math.max(40, lpFreq * 0.8),
        now + durSec
      );
      lowpass.Q.setValueAtTime(0.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.00001, now);
      gain.gain.linearRampToValueAtTime(peak, now + attackSec);
      gain.gain.linearRampToValueAtTime(0.00001, now + durSec);

      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      this.activeGlideGain = gain;
      noise.start(now, Math.random() * 0.8, durSec + 0.02);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  playKnobTick(): void {
    this.playKnobRustle("glide");
  }

  /**
   * Warm incandescent lamp hum with calibrated low-frequency warmth.
   */
  private playLampHum(ctx: AudioContext, durationSec: number, rawPeakGain: number): void {
    const p = this.params;
    const peakGain = rawPeakGain * p.masterGain;
    if (peakGain <= 0.0001) return;

    const now = ctx.currentTime;
    const jitter = 0.98 + Math.random() * 0.04;
    const baseHz = Math.max(30, p.lampBaseFreq) * jitter;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "triangle";
    oscSub.type = "sine";

    osc1.frequency.setValueAtTime(baseHz, now);
    osc2.frequency.setValueAtTime((baseHz + p.lampDetuneHz), now);
    oscSub.frequency.setValueAtTime(baseHz * 2, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(Math.max(80, p.lampLowpassHz), now);
    lowpass.Q.setValueAtTime(0.75, now);

    let lfo: OscillatorNode | null = null;
    const waveDepth = Math.max(0, Math.min(0.85, p.lampWaveDepth));
    const waveStage = ctx.createGain();

    if (waveDepth > 0.001) {
      lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(Math.max(0.5, p.lampWaveRateHz), now);

      const lfoFilterDepth = ctx.createGain();
      lfoFilterDepth.gain.setValueAtTime(p.lampLowpassHz * waveDepth * 0.7, now);
      lfo.connect(lfoFilterDepth);
      lfoFilterDepth.connect(lowpass.frequency);

      waveStage.gain.setValueAtTime(1 - waveDepth * 0.5, now);
      const lfoAmpDepth = ctx.createGain();
      lfoAmpDepth.gain.setValueAtTime(waveDepth * 0.5, now);
      lfo.connect(lfoAmpDepth);
      lfoAmpDepth.connect(waveStage.gain);
    } else {
      waveStage.gain.setValueAtTime(1, now);
    }

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.65, now);

    const oscSubGain = ctx.createGain();
    oscSubGain.gain.setValueAtTime(0.3, now);

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
    lfo?.start(now);

    const stopAt = now + durationSec + 0.012;
    osc1.stop(stopAt);
    osc2.stop(stopAt);
    oscSub.stop(stopAt);
    lfo?.stop(stopAt);
  }

  /**
   * Single natural press sound for tactile hardware buttons.
   */
  playKeyClick(material: TactileMaterial = "matte"): void {
    const p = this.params;
    if (!this.enabled || p.masterGain <= 0) return;
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.95 + Math.random() * 0.1;

      if (material === "lamp") {
        const touchPeak = p.lampTouchGain * p.masterGain;
        if (touchPeak > 0.0001) {
          const noise = ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;

          const lowpass = ctx.createBiquadFilter();
          lowpass.type = "lowpass";
          lowpass.frequency.setValueAtTime(780 * jitter, now);

          const touchGain = ctx.createGain();
          touchGain.gain.setValueAtTime(0.0001, now);
          touchGain.gain.linearRampToValueAtTime(touchPeak, now + 0.003);
          touchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

          noise.connect(lowpass);
          lowpass.connect(touchGain);
          touchGain.connect(ctx.destination);

          noise.start(now, Math.random() * 0.8, 0.02);
        }

        const durSec = Math.max(0.04, p.lampDurationMs / 1000);
        this.playLampHum(ctx, durSec, p.lampHumGain);
        return;
      }

      // Matte hard-polymer microswitch click
      const clickPeak = p.matteClickGain * p.masterGain;
      const decaySec = Math.max(0.003, p.matteClickDecayMs / 1000);

      if (clickPeak > 0.0001) {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(p.matteClickFreq * jitter, now);
        bandpass.Q.setValueAtTime(1.4, now);

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(Math.max(250, p.matteClickFreq * 1.65), now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(clickPeak, now + 0.0008);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);

        noise.connect(bandpass);
        bandpass.connect(lowpass);
        lowpass.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(now, Math.random() * 0.8, decaySec + 0.005);
      }

      const bodyPeak = p.matteBodyGain * p.masterGain;
      if (bodyPeak > 0.0001) {
        const osc = ctx.createOscillator();
        const bodyFilter = ctx.createBiquadFilter();
        const bodyGain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(p.matteBodyFreq * jitter, now);
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(45, p.matteBodyFreq * 0.5),
          now + 0.009
        );

        bodyFilter.type = "lowpass";
        bodyFilter.frequency.setValueAtTime(Math.max(200, p.matteBodyFreq * 2), now);

        bodyGain.gain.setValueAtTime(0.0001, now);
        bodyGain.gain.linearRampToValueAtTime(bodyPeak, now + 0.0008);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.011);

        osc.connect(bodyFilter);
        bodyFilter.connect(bodyGain);
        bodyGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.013);
      }
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /**
   * Whisper-soft hover sound when a tactile cap dips 1px or a lamp warms up on mouse hover.
   */
  playHover(material: TactileMaterial = "matte", forceUnlock = false): void {
    const p = this.params;
    if (!this.enabled || p.masterGain <= 0) return;
    if (this.isKnobDragging) return;
    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer) return;
    if (!forceUnlock && ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const jitter = 0.96 + Math.random() * 0.08;

      if (material === "lamp") {
        const durSec = Math.max(0.04, (p.lampDurationMs * 0.9) / 1000);
        this.playLampHum(ctx, durSec, p.lampHoverGain);
        return;
      }

      const hoverPeak = p.matteHoverGain * p.masterGain;
      if (hoverPeak <= 0.0001) return;

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(p.matteHoverFreq * jitter, now);
      bandpass.Q.setValueAtTime(1.1, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(Math.max(180, p.matteHoverFreq * 1.6), now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(hoverPeak, now + 0.002);
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
