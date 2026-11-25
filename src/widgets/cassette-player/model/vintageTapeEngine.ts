/**
 * VintageTapeEngine
 * Real-time Web Audio API analog cassette deck processor:
 * 1. Connects to an HTMLAudioElement and applies Type I 120µs Normal Bias tape coloring:
 *    - Sub-bass trim (68Hz HPF) + warm head bump (260Hz +2.5dB)
 *    - Soft-clipping magnetic saturation (WaveShaper tanh)
 *    - Warm HF roll-off (4.4kHz LPF)
 *    - Subtle analog wow & flutter (dual-LFO modulated DelayNode)
 *    - Continuous analog tape hiss bed when playing
 * 2. Synthesizes realistic mechanical FF / REW high-speed tape-head whir & motor sound.
 */
export class VintageTapeEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private attachedEl: HTMLAudioElement | null = null;

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

  private makeTapeSaturationCurve(drive = 2.0): Float32Array<ArrayBuffer> {
    const samples = 1024;
    const curve = new Float32Array(new ArrayBuffer(samples * 4));
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Gentle asymmetric warm magnetic tape saturation
      curve[i] = Math.tanh((x + 0.04 * x * x) * drive) / Math.tanh(drive);
    }
    return curve;
  }

  /**
   * Attaches the vintage cassette signal chain to an <audio> element once.
   */
  public attachAudioElement(audioEl: HTMLAudioElement): void {
    if (this.attachedEl === audioEl) {
      this.ensureContext();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const source = ctx.createMediaElementSource(audioEl);

      // 1. Sub-bass trim (cassette tape naturally rolls off below ~68Hz)
      const hpf = ctx.createBiquadFilter();
      hpf.type = "highpass";
      hpf.frequency.value = 68;
      hpf.Q.value = 0.65;

      // 2. Analog head bump warmth around 260Hz
      const headBump = ctx.createBiquadFilter();
      headBump.type = "peaking";
      headBump.frequency.value = 260;
      headBump.Q.value = 0.85;
      headBump.gain.value = 2.6;

      // 3. Gentle tape saturation
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeTapeSaturationCurve(1.85);
      shaper.oversample = "2x";

      // 4. Warm Type I 120µs high-frequency roll-off (~4.4kHz)
      const lpf = ctx.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 4400;
      lpf.Q.value = 0.65;

      // 5. Subtle analog wow & flutter via micro-modulated DelayNode
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 0.008;

      const wowLfo = ctx.createOscillator();
      wowLfo.type = "sine";
      wowLfo.frequency.value = 0.55;
      const wowDepth = ctx.createGain();
      wowDepth.gain.value = 0.00042;
      wowLfo.connect(wowDepth);
      wowDepth.connect(delay.delayTime);

      const flutterLfo = ctx.createOscillator();
      flutterLfo.type = "sine";
      flutterLfo.frequency.value = 4.6;
      const flutterDepth = ctx.createGain();
      flutterDepth.gain.value = 0.0001;
      flutterLfo.connect(flutterDepth);
      flutterDepth.connect(delay.delayTime);

      wowLfo.start();
      flutterLfo.start();

      // Slight makeup gain so processed tape sits at a comfortable level
      const outGain = ctx.createGain();
      outGain.gain.value = 0.92;

      source.connect(hpf);
      hpf.connect(headBump);
      headBump.connect(shaper);
      shaper.connect(lpf);
      lpf.connect(delay);
      delay.connect(outGain);
      outGain.connect(ctx.destination);

      // 6. Continuous analog tape hiss bed (muted when paused, softly present while playing)
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

      this.sourceNode = source;
      this.attachedEl = audioEl;
    } catch {
      // If MediaElementAudioSourceNode fails (e.g. CORS or already connected), let native audio play cleanly
    }
  }

  /** Smoothly fades analog tape hiss in when playing or out when paused */
  public setTapeHiss(active: boolean): void {
    if (!this.ctx || !this.hissGain) return;
    try {
      const now = this.ctx.currentTime;
      const current = this.hissGain.gain.value;
      this.hissGain.gain.cancelScheduledValues(now);
      this.hissGain.gain.setValueAtTime(current, now);
      this.hissGain.gain.linearRampToValueAtTime(
        active ? 0.017 : 0,
        now + (active ? 0.18 : 0.12)
      );
    } catch {
      // ignore
    }
  }

  /**
   * Starts realistic mechanical cassette FF / REW sound:
   * - Mechanical latch clunk
   * - DC reel motor & plastic gear whirr (~145–165Hz with flutter)
   * - High-speed magnetic tape sliding over the playhead (swept chatter & subtle squeal)
   */
  public startScrubSound(direction: "rew" | "ff"): void {
    this.stopScrubSound(true);
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    try {
      const now = ctx.currentTime;
      const isFf = direction === "ff";

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.85, now + 0.055);
      masterGain.connect(ctx.destination);

      // 1. High-speed DC motor + reel gear whirr
      const motorOsc = ctx.createOscillator();
      motorOsc.type = "sawtooth";
      const baseMotorHz = isFf ? 168 : 146;
      motorOsc.frequency.setValueAtTime(baseMotorHz * 0.78, now);
      motorOsc.frequency.exponentialRampToValueAtTime(baseMotorHz, now + 0.12);

      const motorLp = ctx.createBiquadFilter();
      motorLp.type = "lowpass";
      motorLp.frequency.value = 380;
      motorLp.Q.value = 1.2;

      const motorGain = ctx.createGain();
      motorGain.gain.value = 0.028;

      motorOsc.connect(motorLp);
      motorLp.connect(motorGain);
      motorGain.connect(masterGain);

      // 2. High-speed tape-head sliding noise ("shhh-fzz-shhh" with fast reel flutter)
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;

      const tapeBp = ctx.createBiquadFilter();
      tapeBp.type = "bandpass";
      tapeBp.frequency.value = isFf ? 2450 : 2100;
      tapeBp.Q.value = 2.2;

      const tapeGain = ctx.createGain();
      tapeGain.gain.value = 0.042;

      noiseSource.connect(tapeBp);
      tapeBp.connect(tapeGain);
      tapeGain.connect(masterGain);

      // 3. Subtle "chipmunk" magnetic tape chatter across the head
      const chatterOsc = ctx.createOscillator();
      chatterOsc.type = "triangle";
      chatterOsc.frequency.value = isFf ? 1280 : 1080;

      const chatterBp = ctx.createBiquadFilter();
      chatterBp.type = "bandpass";
      chatterBp.frequency.value = 1600;
      chatterBp.Q.value = 3.0;

      const chatterGain = ctx.createGain();
      chatterGain.gain.value = 0.009;

      chatterOsc.connect(chatterBp);
      chatterBp.connect(chatterGain);
      chatterGain.connect(masterGain);

      // Fast LFO driving reel rotation flutter & tape chatter pitch modulation
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = isFf ? 22 : 18.5;

      const lfoToTapeBp = ctx.createGain();
      lfoToTapeBp.gain.value = 680;
      lfo.connect(lfoToTapeBp);
      lfoToTapeBp.connect(tapeBp.frequency);

      const lfoToChatter = ctx.createGain();
      lfoToChatter.gain.value = 340;
      lfo.connect(lfoToChatter);
      lfoToChatter.connect(chatterOsc.frequency);

      const lfoToMotor = ctx.createGain();
      lfoToMotor.gain.value = 11;
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

  /** Plays a short realistic tape-whir burst on quick skip taps */
  public playShortScrubBurst(direction: "rew" | "ff", durationMs = 175): void {
    this.startScrubSound(direction);
    setTimeout(() => {
      this.stopScrubSound();
    }, durationMs);
  }

  /** Winds down and stops the FF / REW motor & tape-whir cleanly */
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

        // Wind motor pitch down as the reel brakes
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
