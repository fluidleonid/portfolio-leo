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
  knobLowpassHz: number;
  knobHighpassHz: number;
  knobGlideGain: number;
  knobGlideDurationMs: number;
}

export const DEFAULT_TACTILE_AUDIO_PARAMS: TactileAudioParams = {
  masterGain: 1.0,

  matteClickGain: 0.048,
  matteClickFreq: 1260,
  matteClickDecayMs: 9,
  matteBodyGain: 0.013,
  matteBodyFreq: 215,
  matteHoverGain: 0.02,
  matteHoverFreq: 920,

  lampHumGain: 0.024,
  lampHoverGain: 0.017,
  lampBaseFreq: 74,
  lampDetuneHz: 4.5,
  lampLowpassHz: 255,
  lampWaveRateHz: 15.5,
  lampWaveDepth: 0.28,
  lampDurationMs: 210,
  lampTouchGain: 0.02,

  knobDragGain: 0.022,
  knobLowpassHz: 240,
  knobHighpassHz: 75,
  knobGlideGain: 0.02,
  knobGlideDurationMs: 60,
};

const PARAMS_STORAGE_KEY = "leo_tactile_audio_params_v1";

interface ActiveKnobDragVoice {
  source: AudioBufferSourceNode;
  highpass: BiquadFilterNode;
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
  public params: TactileAudioParams = { ...DEFAULT_TACTILE_AUDIO_PARAMS };

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSavedParams();
    }
  }

  public loadSavedParams(): TactileAudioParams {
    if (typeof window === "undefined") return this.params;
    try {
      const raw = window.localStorage.getItem(PARAMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TactileAudioParams>;
        this.params = { ...DEFAULT_TACTILE_AUDIO_PARAMS, ...parsed };
      }
    } catch {
      // ignore storage errors
    }
    return this.params;
  }

  public updateParams(patch: Partial<TactileAudioParams>): TactileAudioParams {
    this.params = { ...this.params, ...patch };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(this.params));
      } catch {
        // ignore storage errors
      }
    }
    return this.params;
  }

  public resetParams(): TactileAudioParams {
    this.params = { ...DEFAULT_TACTILE_AUDIO_PARAMS };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(PARAMS_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
    return this.params;
  }

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
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
        }
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
   */
  updateKnobDrag(angularSpeedDeg: number): void {
    const p = this.params;
    if (!this.enabled || p.masterGain <= 0 || p.knobDragGain <= 0 || angularSpeedDeg <= 0.15) {
      return;
    }
    const ctx = this.getContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;

      if (!this.activeDragVoice) {
        const source = ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.setValueAtTime(p.knobHighpassHz, now);
        highpass.Q.setValueAtTime(0.4, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(p.knobLowpassHz, now);
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
          highpass,
          filter,
          gain,
          idleTimer: null,
        };
      }

      const voice = this.activeDragVoice;
      const clampedSpeed = Math.min(14, angularSpeedDeg);
      const speedFactor = 0.25 + (clampedSpeed / 14) * 0.85;
      const targetGain = Math.max(0.0001, p.knobDragGain * speedFactor * p.masterGain);
      const targetCutoff = p.knobLowpassHz + clampedSpeed * 12;

      voice.highpass.frequency.setTargetAtTime(p.knobHighpassHz, now, 0.015);
      voice.filter.frequency.setTargetAtTime(targetCutoff, now, 0.015);
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(targetGain, now, 0.012);

      if (voice.idleTimer) {
        clearTimeout(voice.idleTimer);
      }
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

  /** Preview a 320ms simulated smooth knob turn from the tuner panel */
  previewKnobDrag(): void {
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      this.updateKnobDrag(7);
      if (step >= 7) {
        clearInterval(id);
        this.stopKnobDrag();
      }
    }, 35);
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
        voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
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
   */
  playKnobRustle(mode: "drag" | "glide" = "glide", requireRunning = false): void {
    const p = this.params;
    if (!this.enabled || p.masterGain <= 0) return;
    if (mode === "drag") {
      this.updateKnobDrag(5);
      return;
    }
    if (p.knobGlideGain <= 0) return;

    const ctx = this.getContext(true);
    if (!ctx || !this.noiseBuffer) return;
    if (requireRunning && ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const durSec = Math.max(0.018, p.knobGlideDurationMs / 1000);
      const peak = Math.max(0.0002, p.knobGlideGain * p.masterGain);

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
      highpass.frequency.setValueAtTime(p.knobHighpassHz, now);
      highpass.Q.setValueAtTime(0.4, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(p.knobLowpassHz * 1.2, now);
      lowpass.frequency.exponentialRampToValueAtTime(
        Math.max(40, p.knobLowpassHz * 0.72),
        now + durSec
      );
      lowpass.Q.setValueAtTime(0.35, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + Math.min(0.014, durSec * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

      noise.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      this.activeGlideGain = gain;
      noise.start(now, Math.random() * 0.8, durSec + 0.008);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  playKnobTick(): void {
    this.playKnobRustle("glide");
  }

  /**
   * Warm incandescent lamp hum with tunable pitch, filter softness, and wave undulation.
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
    osc2.frequency.setValueAtTime(baseHz + p.lampDetuneHz, now);
    oscSub.frequency.setValueAtTime(baseHz * 2, now);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(Math.max(0.5, p.lampWaveRateHz), now);

    const lfoFilterDepth = ctx.createGain();
    lfoFilterDepth.gain.setValueAtTime(p.lampLowpassHz * p.lampWaveDepth * 0.7, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(Math.max(80, p.lampLowpassHz), now);
    lowpass.Q.setValueAtTime(0.75, now);

    lfo.connect(lfoFilterDepth);
    lfoFilterDepth.connect(lowpass.frequency);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.65, now);

    const oscSubGain = ctx.createGain();
    oscSubGain.gain.setValueAtTime(0.3, now);

    const waveDepth = Math.max(0, Math.min(0.85, p.lampWaveDepth));
    const waveStage = ctx.createGain();
    waveStage.gain.setValueAtTime(1 - waveDepth * 0.5, now);
    const lfoAmpDepth = ctx.createGain();
    lfoAmpDepth.gain.setValueAtTime(waveDepth * 0.5, now);
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
        lowpass.frequency.setValueAtTime(Math.max(400, p.matteClickFreq * 1.65), now);

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
      lowpass.frequency.setValueAtTime(Math.max(400, p.matteHoverFreq * 1.6), now);

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
