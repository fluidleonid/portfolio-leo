export interface TapeDspParams {
  enabled: boolean;
  /** 0 = worn dusty cassette, 100 = crisp Type IV metal tape */
  tapeQuality: number;
  /** 0 = silent / Dolby NR, 100 = heavy vintage analog hiss */
  noiseLevel: number;
  /** 0 = worn misaligned head (warm/muffled), 100 = fresh aligned head */
  headQuality: number;
  /** 0 = worn rubber belt (strong wow & flutter + motor droop), 100 = quartz direct drive */
  motorQuality: number;
  /** Playback rate multiplier during Cue/Review (2.0x - 5.0x) */
  cueSpeed: number;
  /** Mechanical motor whir loudness during FF/REW (0 - 100) */
  scrubMotorGain: number;
}

export const DEFAULT_TAPE_DSP_PARAMS: TapeDspParams = {
  enabled: true,
  tapeQuality: 70,
  noiseLevel: 39,
  headQuality: 20,
  motorQuality: 14,
  cueSpeed: 2.4,
  scrubMotorGain: 100,
};

/**
 * VintageTapeEngine
 * Real-time Web Audio API analog cassette deck processor with live-tunable:
 * - Tape Quality (HPF/LPF bandwidth + magnetic WaveShaper saturation)
 * - Noise Level (filtered analog tape hiss bed)
 * - Head Quality (240Hz head bump resonance + 2.6kHz azimuth high-shelf loss)
 * - Motor Quality (dual-LFO wow & flutter depth + start/stop motor inertia)
 * - Mechanical FF/REW motor whir + Cue/Review head-engaged playback
 */
export class VintageTapeEngine {
  private ctx: AudioContext | null = null;
  private attachedEl: HTMLAudioElement | null = null;
  private isPlayingAudio = false;
  public params: TapeDspParams = { ...DEFAULT_TAPE_DSP_PARAMS };

  // Live DSP nodes for real-time parameter tweaking
  private hpf: BiquadFilterNode | null = null;
  private headBump: BiquadFilterNode | null = null;
  private headShelf: BiquadFilterNode | null = null;
  private shaper: WaveShaperNode | null = null;
  private lpf: BiquadFilterNode | null = null;
  private wowDepth: GainNode | null = null;
  private flutterDepth: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  private hissGain: GainNode | null = null;
  private hissSource: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private scrubNodes: {
    motorOsc: OscillatorNode;
    chatterOsc: OscillatorNode;
    lfo: OscillatorNode;
    noiseSource: AudioBufferSourceNode;
    masterGain: GainNode;
  } | null = null;

  constructor(initialParams?: TapeDspParams) {
    if (initialParams) {
      this.params = { ...initialParams };
    }
  }

  private ensureContext(): AudioContext | null {
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
        const len = Math.floor(this.ctx.sampleRate * 2);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0;
        let b1 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.995 * b0 + w * 0.055;
          b1 = 0.96 * b1 + w * 0.14;
          data[i] = (b0 + b1 + w * 0.35) * 0.35;
        }
        this.noiseBuffer = buf;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private makeTapeSaturationCurve(drive: number): Float32Array<ArrayBuffer> {
    const samples = 1024;
    const curve = new Float32Array(new ArrayBuffer(samples * 4));
    const safeDrive = Math.max(0.5, drive);
    const norm = Math.tanh(safeDrive);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh((x + 0.035 * x * x) * safeDrive) / norm;
    }
    return curve;
  }

  public attachAudioElement(audioEl: HTMLAudioElement): void {
    if (this.attachedEl === audioEl) {
      this.ensureContext();
      this.applyParams(this.params);
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const source = ctx.createMediaElementSource(audioEl);

      // Parallel dry/wet routing for instant click-free A/B bypass
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      dryGain.connect(ctx.destination);
      wetGain.connect(ctx.destination);

      source.connect(dryGain);

      // 1. Tape quality HPF
      const hpf = ctx.createBiquadFilter();
      hpf.type = "highpass";
      hpf.Q.value = 0.65;

      // 2. Head bump resonance (240Hz)
      const headBump = ctx.createBiquadFilter();
      headBump.type = "peaking";
      headBump.frequency.value = 240;
      headBump.Q.value = 0.85;

      // 3. Head azimuth high-shelf damping (2.6kHz)
      const headShelf = ctx.createBiquadFilter();
      headShelf.type = "highshelf";
      headShelf.frequency.value = 2600;

      // 4. Magnetic tape saturation
      const shaper = ctx.createWaveShaper();
      shaper.oversample = "2x";

      // 5. Tape quality HF roll-off LPF
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.Q.value = 0.65;

      // 6. Motor quality wow & flutter DelayNode
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 0.01;

      const wowLfo = ctx.createOscillator();
      wowLfo.type = "sine";
      wowLfo.frequency.value = 0.55;
      const wowDepth = ctx.createGain();
      wowLfo.connect(wowDepth);
      wowDepth.connect(delay.delayTime);

      const flutterLfo = ctx.createOscillator();
      flutterLfo.type = "sine";
      flutterLfo.frequency.value = 4.8;
      const flutterDepth = ctx.createGain();
      flutterLfo.connect(flutterDepth);
      flutterDepth.connect(delay.delayTime);

      wowLfo.start();
      flutterLfo.start();

      source.connect(hpf);
      hpf.connect(headBump);
      headBump.connect(headShelf);
      headShelf.connect(shaper);
      shaper.connect(lpf);
      lpf.connect(delay);
      delay.connect(wetGain);

      // 7. Analog tape hiss bed
      if (this.noiseBuffer) {
        const hissSrc = ctx.createBufferSource();
        hissSrc.buffer = this.noiseBuffer;
        hissSrc.loop = true;

        const hissHp = ctx.createBiquadFilter();
        hissHp.type = "highpass";
        hissHp.frequency.value = 950;

        const hissBp = ctx.createBiquadFilter();
        hissBp.type = "bandpass";
        hissBp.frequency.value = 3100;
        hissBp.Q.value = 0.65;

        const hissGain = ctx.createGain();
        hissGain.gain.value = 0;

        hissSrc.connect(hissHp);
        hissHp.connect(hissBp);
        hissBp.connect(hissGain);
        hissGain.connect(ctx.destination);
        hissSrc.start();

        this.hissSource = hissSrc;
        this.hissGain = hissGain;
      }

      this.hpf = hpf;
      this.headBump = headBump;
      this.headShelf = headShelf;
      this.shaper = shaper;
      this.lpf = lpf;
      this.wowDepth = wowDepth;
      this.flutterDepth = flutterDepth;
      this.dryGain = dryGain;
      this.wetGain = wetGain;
      this.attachedEl = audioEl;

      this.applyParams(this.params);
    } catch {
      // Fallback gracefully if MediaElementSource cannot attach
    }
  }

  /** Live-updates every analog cassette DSP parameter in real time while playing */
  public applyParams(next: TapeDspParams): void {
    this.params = { ...next };
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const tapeQ = Math.max(0, Math.min(100, next.tapeQuality)) / 100;
      const headQ = Math.max(0, Math.min(100, next.headQuality)) / 100;
      const motorQ = Math.max(0, Math.min(100, next.motorQuality)) / 100;

      // Bypass / Enabled crossfade
      if (this.dryGain && this.wetGain) {
        this.dryGain.gain.setTargetAtTime(next.enabled ? 0 : 1, now, 0.02);
        this.wetGain.gain.setTargetAtTime(next.enabled ? 0.94 : 0, now, 0.02);
      }

      // 1. Tape Quality: bandwidth (LPF 2100..9800Hz, HPF 110..38Hz) & saturation drive (3.3..1.05)
      const hpfHz = 110 - tapeQ * 72;
      const lpfHz = 2100 + Math.pow(tapeQ, 1.35) * 7700;
      const drive = 3.3 - tapeQ * 2.25;

      if (this.hpf) this.hpf.frequency.setTargetAtTime(hpfHz, now, 0.025);
      if (this.lpf) this.lpf.frequency.setTargetAtTime(lpfHz, now, 0.025);
      if (this.shaper) this.shaper.curve = this.makeTapeSaturationCurve(drive);

      // 2. Head Quality: worn head bump (+5.5dB -> +0.4dB) & azimuth treble damping (-10dB -> 0dB)
      const bumpDb = (1 - headQ) * 5.2 + 0.4;
      const shelfDb = -(1 - headQ) * 10;
      if (this.headBump) this.headBump.gain.setTargetAtTime(bumpDb, now, 0.025);
      if (this.headShelf) this.headShelf.gain.setTargetAtTime(shelfDb, now, 0.025);

      // 3. Motor Quality: wow (0..2.2ms) & flutter (0..0.55ms)
      const wowSec = Math.pow(1 - motorQ, 1.5) * 0.0022;
      const flutterSec = Math.pow(1 - motorQ, 1.5) * 0.00055;
      if (this.wowDepth) this.wowDepth.gain.setTargetAtTime(wowSec, now, 0.03);
      if (this.flutterDepth) this.flutterDepth.gain.setTargetAtTime(flutterSec, now, 0.03);

      // 4. Noise Level: tape hiss gain (active only when playing & DSP enabled)
      this.updateHissGain();
    } catch {
      // ignore
    }
  }

  private updateHissGain(): void {
    if (!this.ctx || !this.hissGain) return;
    try {
      const now = this.ctx.currentTime;
      const noiseNorm = Math.max(0, Math.min(100, this.params.noiseLevel)) / 100;
      const target =
        this.isPlayingAudio && this.params.enabled ? noiseNorm * 0.062 : 0;
      this.hissGain.gain.setTargetAtTime(target, now, 0.04);
    } catch {
      // ignore
    }
  }

  public setTapeHiss(active: boolean): void {
    this.isPlayingAudio = active;
    this.updateHissGain();
  }

  /**
   * Starts mechanical cassette FF / REW motor & tape-head whir.
   * When `headEngaged` is true (Cue/Review while playing), keeps the motor subtler so the
   * high-pitched accelerated song takes center stage!
   */
  public startScrubSound(direction: "rew" | "ff", headEngaged = false): void {
    this.stopScrubSound(true);
    const motorLevel = Math.max(0, Math.min(100, this.params.scrubMotorGain)) / 100;
    if (motorLevel <= 0.01) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const isFf = direction === "ff";

      const masterGain = ctx.createGain();
      const targetMaster = (headEngaged ? 0.52 : 0.85) * motorLevel;
      masterGain.gain.value = 0;
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(targetMaster, now + 0.055);
      masterGain.connect(ctx.destination);

      // 1. High-speed DC motor + reel gear whirr
      const motorOsc = ctx.createOscillator();
      motorOsc.type = "sawtooth";
      const baseMotorHz = isFf ? 168 : 146;
      motorOsc.frequency.setValueAtTime(baseMotorHz * 0.78, now);
      motorOsc.frequency.exponentialRampToValueAtTime(baseMotorHz, now + 0.12);

      const motorLp = ctx.createBiquadFilter();
      motorLp.type = "lowpass";
      motorLp.frequency.value = 360;
      motorLp.Q.value = 1.1;

      const motorGain = ctx.createGain();
      motorGain.gain.value = 0.032;

      motorOsc.connect(motorLp);
      motorLp.connect(motorGain);
      motorGain.connect(masterGain);

      // 2. High-speed tape sliding noise
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;

      const tapeBp = ctx.createBiquadFilter();
      tapeBp.type = "bandpass";
      tapeBp.frequency.value = isFf ? 2450 : 2100;
      tapeBp.Q.value = 2.0;

      const tapeGain = ctx.createGain();
      tapeGain.gain.value = headEngaged ? 0.025 : 0.044;

      noiseSource.connect(tapeBp);
      tapeBp.connect(tapeGain);
      tapeGain.connect(masterGain);

      // 3. Subtle head chatter (stronger only when disengaged; when engaged, real audio supplies the squeal!)
      const chatterOsc = ctx.createOscillator();
      chatterOsc.type = "triangle";
      chatterOsc.frequency.value = isFf ? 1280 : 1080;

      const chatterBp = ctx.createBiquadFilter();
      chatterBp.type = "bandpass";
      chatterBp.frequency.value = 1600;
      chatterBp.Q.value = 3.0;

      const chatterGain = ctx.createGain();
      chatterGain.gain.value = headEngaged ? 0.002 : 0.009;

      chatterOsc.connect(chatterBp);
      chatterBp.connect(chatterGain);
      chatterGain.connect(masterGain);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = isFf ? 22 : 18.5;

      const lfoToTapeBp = ctx.createGain();
      lfoToTapeBp.gain.value = 640;
      lfo.connect(lfoToTapeBp);
      lfoToTapeBp.connect(tapeBp.frequency);

      const lfoToChatter = ctx.createGain();
      lfoToChatter.gain.value = 320;
      lfo.connect(lfoToChatter);
      lfoToChatter.connect(chatterOsc.frequency);

      const lfoToMotor = ctx.createGain();
      lfoToMotor.gain.value = 10;
      lfo.connect(lfoToMotor);
      lfoToMotor.connect(motorOsc.frequency);

      motorOsc.start(now);
      chatterOsc.start(now);
      lfo.start(now);
      noiseSource.start(now, Math.random() * 0.9);

      this.scrubNodes = {
        motorOsc,
        chatterOsc,
        lfo,
        noiseSource,
        masterGain,
      };
    } catch {
      // ignore
    }
  }

  public stopScrubSound(immediate = false): void {
    const nodes = this.scrubNodes;
    if (!nodes) return;
    this.scrubNodes = null;

    try {
      if (this.ctx) {
        const now = this.ctx.currentTime;
        const fadeSec = immediate ? 0.02 : 0.11;
        const currentGain = Math.max(0, nodes.masterGain.gain.value);

        nodes.masterGain.gain.cancelScheduledValues(now);
        nodes.masterGain.gain.setValueAtTime(currentGain, now);
        nodes.masterGain.gain.linearRampToValueAtTime(0, now + fadeSec);

        if (!immediate) {
          nodes.motorOsc.frequency.cancelScheduledValues(now);
          nodes.motorOsc.frequency.setValueAtTime(nodes.motorOsc.frequency.value, now);
          nodes.motorOsc.frequency.exponentialRampToValueAtTime(65, now + fadeSec);
        }

        const stopAt = now + fadeSec + 0.02;
        nodes.motorOsc.stop(stopAt);
        nodes.chatterOsc.stop(stopAt);
        nodes.lfo.stop(stopAt);
        nodes.noiseSource.stop(stopAt);
      } else {
        nodes.motorOsc.stop();
        nodes.chatterOsc.stop();
        nodes.lfo.stop();
        nodes.noiseSource.stop();
      }
    } catch {
      // ignore
    }
  }

  public dispose(): void {
    this.stopScrubSound(true);
    this.setTapeHiss(false);
    try {
      this.hissSource?.stop();
    } catch {
      // ignore
    }
  }
}
