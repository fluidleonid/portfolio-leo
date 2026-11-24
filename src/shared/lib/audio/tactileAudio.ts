class TactileAudio {
  private ctx: AudioContext | null = null;
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
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Soft low-pitched mechanical detent tick for rotary NAV knob */
  playKnobTick(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "triangle";
      const baseFreq = 260 + Math.random() * 35;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.022);

      // Cut harsh highs above 500 Hz for a warm, velvety mechanical click
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }

  /** Soft low-pitched key press & release thock for tactile buttons (COMM / PET / CV / CaseLink) */
  playKeyClick(type: "down" | "up" = "down"): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      const startFreq = type === "down" ? 140 : 175;
      const endFreq = type === "down" ? 42 : 65;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.035);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(380, now);

      gain.gain.setValueAtTime(type === "down" ? 0.09 : 0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore Web Audio scheduling errors
    }
  }
}

export const tactileAudio = new TactileAudio();
