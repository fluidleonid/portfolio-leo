"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Section } from "@/shared/ui";
import {
  type CassetteDesignConfig,
  TDK_DEFAULT_CONFIG,
  loadSavedCassetteConfig,
  saveCassetteConfig,
} from "../model/cassetteConfig";
import { CassetteCustomizerPanel } from "./CassetteCustomizerPanel";

export interface CassettePlayerProps {
  /** Optional audio track URL from Sanity CMS (or public/) */
  audioUrl?: string;
  /** Optional track title printed on the cassette label (defaults to Figma text) */
  title?: string;
  /** Optional artist/subtitle printed on the cassette label (defaults to Figma text) */
  subtitle?: string;
  /** Optional className */
  className?: string;
}

type TransportMode = "paused" | "playing" | "rewinding" | "forwarding";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Built-in warm lo-fi analog tape synth fallback when no external/local audio file is loaded yet.
 */
class FallbackTapeSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private hissSource: AudioBufferSourceNode | null = null;
  private chordTimer: ReturnType<typeof setInterval> | null = null;
  private chordStep = 0;
  private playing = false;

  private readonly chords = [
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 349.23],
    [164.81, 196.0, 246.94, 293.66],
  ];

  start() {
    if (this.playing || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});

      const ctx = this.ctx;
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.value = 0;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.18, now + 0.35);
      master.connect(ctx.destination);
      this.masterGain = master;

      const hissLen = Math.floor(ctx.sampleRate * 2);
      const hissBuf = ctx.createBuffer(1, hissLen, ctx.sampleRate);
      const data = hissBuf.getChannelData(0);
      for (let i = 0; i < hissLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.045;
      }
      const hiss = ctx.createBufferSource();
      hiss.buffer = hissBuf;
      hiss.loop = true;

      const hissBp = ctx.createBiquadFilter();
      hissBp.type = "bandpass";
      hissBp.frequency.value = 2600;
      hissBp.Q.value = 0.7;

      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.25;

      hiss.connect(hissBp);
      hissBp.connect(hissGain);
      hissGain.connect(master);
      hiss.start(now);
      this.hissSource = hiss;

      const playChord = () => {
        if (!this.ctx || !this.masterGain || !this.playing) return;
        const c = this.ctx;
        const t = c.currentTime;
        const notes = this.chords[this.chordStep % this.chords.length];
        this.chordStep += 1;

        notes.forEach((freq, idx) => {
          const osc = c.createOscillator();
          const lp = c.createBiquadFilter();
          const g = c.createGain();

          osc.type = idx === 0 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(freq * (0.997 + Math.random() * 0.006), t);

          lp.type = "lowpass";
          lp.frequency.setValueAtTime(920, t);
          lp.frequency.exponentialRampToValueAtTime(380, t + 2.6);

          g.gain.value = 0;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(idx === 0 ? 0.22 : 0.14, t + 0.18 + idx * 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 2.9);

          osc.connect(lp);
          lp.connect(g);
          g.connect(this.masterGain!);

          osc.start(t);
          osc.stop(t + 3.0);
        });
      };

      this.playing = true;
      playChord();
      this.chordTimer = setInterval(playChord, 2800);
    } catch {
      // ignore audio errors
    }
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    if (this.chordTimer) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    try {
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.14);
      }
      if (this.hissSource) {
        const src = this.hissSource;
        this.hissSource = null;
        setTimeout(() => {
          try {
            src.stop();
          } catch {
            // ignore
          }
        }, 160);
      }
    } catch {
      // ignore
    }
  }
}

export const CassettePlayer: React.FC<CassettePlayerProps> = ({
  audioUrl,
  title = "Legends Never Die",
  subtitle = "League of Legends",
  className = "",
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const synthRef = useRef<FallbackTapeSynth | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const scrubIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdActiveRef = useRef<boolean>(false);

  const [config, setConfig] = useState<CassetteDesignConfig>(TDK_DEFAULT_CONFIG);
  const [localTrackUrl, setLocalTrackUrl] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string>(title);
  const [trackSubtitle, setTrackSubtitle] = useState<string>(subtitle);
  const [mode, setMode] = useState<TransportMode>("paused");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [reelAngle, setReelAngle] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    setConfig(loadSavedCassetteConfig());
  }, []);

  const handleConfigChange = (next: CassetteDesignConfig) => {
    setConfig(next);
    saveCassetteConfig(next);
  };

  const effectiveAudioUrl = localTrackUrl || audioUrl || null;
  const isUsingRealAudio = Boolean(effectiveAudioUrl);

  useEffect(() => {
    if (!localTrackUrl) {
      setTrackTitle(title);
      setTrackSubtitle(subtitle);
    }
  }, [title, subtitle, localTrackUrl]);

  useEffect(() => {
    return () => {
      if (localTrackUrl) URL.revokeObjectURL(localTrackUrl);
      synthRef.current?.stop();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);
    };
  }, [localTrackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setMode("paused");
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [effectiveAudioUrl]);

  useEffect(() => {
    if (mode === "paused") {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastFrameRef.current = performance.now();
    const tick = (now: number) => {
      const dtSec = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const speedDegPerSec =
        mode === "playing" ? 48 : mode === "forwarding" ? 260 : -260;

      setReelAngle((prev) => (prev + speedDegPerSec * dtSec) % 360);

      if (!isUsingRealAudio && mode === "playing") {
        setCurrentTime((prev) => (prev + dtSec >= duration ? 0 : prev + dtSec));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode, isUsingRealAudio, duration]);

  const startPlayback = useCallback(() => {
    if (isUsingRealAudio && audioRef.current) {
      synthRef.current?.stop();
      void audioRef.current.play().catch(() => {});
    } else {
      if (!synthRef.current) synthRef.current = new FallbackTapeSynth();
      synthRef.current.start();
    }
    setMode("playing");
  }, [isUsingRealAudio]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    synthRef.current?.stop();
    setMode("paused");
  }, []);

  const handleTogglePlay = () => {
    if (mode === "playing") {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const seekBy = useCallback(
    (deltaSec: number) => {
      if (isUsingRealAudio && audioRef.current) {
        const dur = audioRef.current.duration || duration;
        const next = Math.max(0, Math.min(dur, audioRef.current.currentTime + deltaSec));
        audioRef.current.currentTime = next;
        setCurrentTime(next);
      } else {
        setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + deltaSec)));
      }
    },
    [isUsingRealAudio, duration]
  );

  const beginHoldScrub = (direction: "rew" | "ff") => {
    const wasPlaying = mode === "playing";
    if (wasPlaying) {
      if (audioRef.current) audioRef.current.pause();
      synthRef.current?.stop();
    }
    holdActiveRef.current = false;

    setMode(direction === "rew" ? "rewinding" : "forwarding");

    if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);
    scrubIntervalRef.current = setInterval(() => {
      holdActiveRef.current = true;
      seekBy(direction === "rew" ? -1.4 : 1.4);
    }, 60);

    const stopScrub = () => {
      if (scrubIntervalRef.current) {
        clearInterval(scrubIntervalRef.current);
        scrubIntervalRef.current = null;
      }
      if (!holdActiveRef.current) {
        seekBy(direction === "rew" ? -10 : 10);
      }
      if (wasPlaying) {
        startPlayback();
      } else {
        setMode("paused");
      }
      window.removeEventListener("pointerup", stopScrub);
      window.removeEventListener("pointercancel", stopScrub);
    };

    window.addEventListener("pointerup", stopScrub);
    window.addEventListener("pointercancel", stopScrub);
  };

  const loadAudioFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)) {
        return;
      }
      synthRef.current?.stop();
      if (localTrackUrl) URL.revokeObjectURL(localTrackUrl);
      const url = URL.createObjectURL(file);
      setLocalTrackUrl(url);

      const cleanName = file.name.replace(/\.[^/.]+$/, "").trim();
      if (cleanName.includes(" - ")) {
        const [artistPart, titlePart] = cleanName.split(" - ");
        setTrackTitle(titlePart?.trim() || cleanName);
        setTrackSubtitle(artistPart?.trim() || "Custom Tape");
      } else {
        setTrackTitle(cleanName || "Custom Track");
        setTrackSubtitle("Custom Tape");
      }
      setCurrentTime(0);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          void audioRef.current.play().catch(() => {});
          setMode("playing");
        }
      }, 60);
    },
    [localTrackUrl]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadAudioFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadAudioFile(file);
  };

  const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const isPlaying = mode === "playing";
  const isRewinding = mode === "rewinding";
  const isForwarding = mode === "forwarding";

  const statusText = isRewinding
    ? `REW • ${formatTime(currentTime)}`
    : isForwarding
    ? `FF • ${formatTime(currentTime)}`
    : isPlaying
    ? `PLAY • ${formatTime(currentTime)} / ${formatTime(duration)}`
    : `TAPE • ${formatTime(currentTime)} / ${formatTime(duration)}`;

  const shadowFilter = `drop-shadow(0px ${config.shadowOffsetY}px ${config.shadowBlur}px ${hexToRgba(
    config.shadowColor,
    config.shadowOpacity
  )})`;

  // =========================================================================
  // STYLE 1: TDK D90 BLACK ACOUSTIC CASSETTE (1:1 from Figma 558x342)
  // =========================================================================
  const renderTdkCassette = () => {
    // Left reel center (158, 160), Right reel center (400, 160) in 558x342 local coords
    const leftTapeR = 114 - progress * 44; // 114 -> 70
    const rightTapeR = 70 + progress * 44; // 70 -> 114

    const renderTdkReel = (cx: number, cy: number) => (
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Multi-ring realistic magnetic tape pack */}
        <circle cx={0} cy={0} r={cx < 280 ? leftTapeR : rightTapeR} fill={config.tapeColor} />
        <circle
          cx={0}
          cy={0}
          r={cx < 280 ? leftTapeR : rightTapeR}
          fill="url(#tdkTapeRings)"
          opacity={0.75}
        />

        {/* Rotating white toothed reel + red clip */}
        <g transform={`rotate(${reelAngle})`}>
          {/* Outer white reel flange */}
          <circle cx={0} cy={0} r={60} fill={config.reelColor} stroke="#d2d2d2" strokeWidth={2.5} />
          {/* Inner cutout showing shell/window depth */}
          <circle cx={0} cy={0} r={33} fill="#141315" />

          {/* 6 precision white cassette drive teeth */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x={-4}
              y={-35}
              width={8}
              height={11}
              rx={1}
              fill={config.reelColor}
              transform={`rotate(${deg})`}
            />
          ))}

          {/* Signature red tape lock clip on reel rim */}
          {config.showRedClips && (
            <path
              d="M 54 -17 A 57 57 0 0 1 54 17 L 46 14 A 49 49 0 0 0 46 -14 Z"
              fill={config.accentColor}
            />
          )}
        </g>
      </g>
    );

    const renderTdkScrew = (cx: number, cy: number, rot = 30) => (
      <g transform={`translate(${cx}, ${cy})`}>
        <circle cx={0} cy={0} r={8.5} fill="#080808" stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />
        <circle cx={0} cy={0} r={6.2} fill="#252527" stroke="#0d0d0d" strokeWidth={0.8} />
        <g transform={`rotate(${rot})`}>
          <rect x={-3.5} y={-0.9} width={7} height={1.8} rx={0.5} fill="#0c0c0c" />
          <rect x={-0.9} y={-3.5} width={1.8} height={7} rx={0.5} fill="#0c0c0c" />
        </g>
      </g>
    );

    return (
      <svg
        viewBox="0 0 558 342"
        className="w-full h-auto block"
        style={{ filter: shadowFilter }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`TDK D90 Cassette: ${trackTitle}`}
      >
        <defs>
          <radialGradient id="tdkTapeRings" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#232323" />
            <stop offset="54%" stopColor="#0e0e0e" />
            <stop offset="58%" stopColor="#1b1a1c" />
            <stop offset="63%" stopColor="#050505" />
            <stop offset="72%" stopColor="#151517" />
            <stop offset="80%" stopColor="#070707" />
            <stop offset="90%" stopColor="#121214" />
            <stop offset="100%" stopColor="#090909" />
          </radialGradient>

          <linearGradient id="tdkGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={config.glassOpacity} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={config.glassOpacity * 0.25} />
          </linearGradient>

          <filter id="tdkGrain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
            <feColorMatrix type="saturate" values="0" in="n" result="m" />
            <feComponentTransfer in="m" result="s">
              <feFuncA type="linear" slope={config.grainOpacity} />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="s" mode="overlay" />
          </filter>

          {/* Clip for transparent center window & circular reel cutouts */}
          <clipPath id="tdkWindowArea">
            <rect x="212" y="122" width="134" height="76" rx="4" />
            <circle cx="158" cy="160" r="35" />
            <circle cx="400" cy="160" r="35" />
          </clipPath>

          <clipPath id="tdkShellClip">
            <rect x="4" y="0" width="550" height="342" rx={config.cornerRadius} />
          </clipPath>
        </defs>

        {/* Left & Right Mechanical Shell Ears */}
        <rect x="0" y="234" width="6" height="82" rx="2" fill={config.shellColor} stroke={config.shellBorderColor} strokeWidth="0.8" />
        <rect x="552" y="234" width="6" height="82" rx="2" fill={config.shellColor} stroke={config.shellBorderColor} strokeWidth="0.8" />

        {/* Main Obsidian Shell Body (550x342) */}
        <g clipPath="url(#tdkShellClip)">
          <rect
            x="4"
            y="0"
            width="550"
            height="342"
            rx={config.cornerRadius}
            fill={config.shellColor}
            filter={config.grainOpacity > 0 ? "url(#tdkGrain)" : undefined}
          />

          {/* Subtle horizontal micro-ribbed grip texture across shell */}
          {config.showTexture && (
            <g opacity={0.35}>
              {Array.from({ length: 42 }).map((_, i) => (
                <line
                  key={i}
                  x1="12"
                  y1={12 + i * 8}
                  x2="546"
                  y2={12 + i * 8}
                  stroke="#000000"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Recessed Top Frame Molding */}
          <rect
            x="24"
            y="18"
            width="510"
            height="198"
            rx="10"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />

          {/* Bottom Trapezoid Capstan Bridge */}
          <path
            d="M 102 262 H 456 L 474 342 H 84 Z"
            fill="rgba(0,0,0,0.28)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        </g>

        {/* Outer Shell Bevel Border */}
        <rect
          x="4.75"
          y="0.75"
          width="548.5"
          height="340.5"
          rx={config.cornerRadius}
          fill="none"
          stroke={config.shellBorderColor}
          strokeWidth="1.5"
        />

        {/* Top Red-White-Red Sticker (478x72 at x=40, y=31) */}
        <g>
          <rect x="40" y="31" width="478" height="12" rx="2" fill={config.accentColor} />
          <rect x="40" y="43" width="478" height="48" fill={config.labelBgColor} />
          <rect x="40" y="91" width="478" height="12" rx="2" fill={config.accentColor} />

          {/* Left 'A' Square Badge */}
          {config.showBadge && (
            <g transform="translate(58, 55)">
              <rect x="0" y="0" width="24" height="24" rx="1.5" fill={config.labelTextColor} />
              <text
                x="12"
                y="18"
                textAnchor="middle"
                fill={config.labelBgColor}
                fontSize="18"
                fontWeight="700"
                fontFamily="var(--font-hauora), sans-serif"
              >
                A
              </text>
            </g>
          )}

          {/* Acoustic Cassette label */}
          <text
            x={config.showBadge ? 90 : 58}
            y="64"
            fill={config.labelTextColor}
            fontSize="10"
            fontWeight="600"
            fontFamily="var(--font-hauora), sans-serif"
          >
            Acoustic Cassette
          </text>
          <text
            x={config.showBadge ? 90 : 58}
            y="78"
            fill={config.labelTextColor}
            fontSize="9"
            opacity="0.7"
            fontFamily="var(--font-hauora), sans-serif"
          >
            {trackSubtitle.length > 22 ? `${trackSubtitle.slice(0, 21)}…` : trackSubtitle}
          </text>

          {/* Center Title Printed Across White Band */}
          <text
            x="279"
            y="74"
            textAnchor="middle"
            fill={config.labelTextColor}
            fontSize="20"
            fontWeight="700"
            letterSpacing="-0.02em"
            fontFamily="var(--font-hauora), sans-serif"
          >
            {trackTitle.length > 22 ? `${trackTitle.slice(0, 21)}…` : trackTitle}
          </text>

          {/* Right N.R. & In/Out Marks */}
          <text
            x="404"
            y="69"
            fill={config.labelTextColor}
            fontSize="9"
            fontWeight="500"
            fontFamily="var(--font-hauora), sans-serif"
          >
            N.R.[    ]  □In □Out
          </text>
        </g>

        {/* Central Recessed Window Backing */}
        <rect
          x="212"
          y="122"
          width="134"
          height="76"
          rx="4"
          fill={config.windowBgColor}
          stroke="#060606"
          strokeWidth="1.5"
        />

        {/* Spinning Reels & Dynamic Magnetic Tape Packs clipped through window + reel hubs */}
        <g clipPath="url(#tdkWindowArea)">
          {renderTdkReel(158, 160)}
          {renderTdkReel(400, 160)}
        </g>

        {/* Left & Right White Reel Rings visible outside window cutouts (authentic TDK framing) */}
        <circle cx="158" cy="160" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <circle cx="400" cy="160" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

        {/* Frosted Glass Sheen over Central Window */}
        <rect x="212" y="122" width="134" height="76" rx="4" fill="url(#tdkGlass)" />

        {/* 7-Dash Calibration Scale at Bottom of Window */}
        {config.showWindowScale && (
          <g transform="translate(212, 189)">
            <rect x="0" y="0" width="134" height="9" fill="rgba(0,0,0,0.45)" />
            {[18, 34, 50, 66, 82, 98, 114].map((dx, i) => (
              <rect
                key={dx}
                x={dx}
                y={i === 3 ? 1 : 2.5}
                width="2"
                height={i === 3 ? 7 : 5.5}
                fill="rgba(255,255,255,0.45)"
              />
            ))}
          </g>
        )}

        {/* Crisp White Bottom Print: TDK • Normal Bias 120µs EQ • A|90 • Made in Japan */}
        {config.showBottomInfo && (
          <g fill={config.bottomPrintColor}>
            {/* TDK Iconic Diamond + Wordmark */}
            <g transform="translate(103, 224)">
              <polygon points="8,0 13,5 8,10 3,5" />
              <polygon points="3,7 8,12 3,17 -2,12" />
              <polygon points="13,7 18,12 13,17 8,12" />
              <text
                x="24"
                y="17"
                fontSize="21"
                fontWeight="800"
                letterSpacing="0.06em"
                fontFamily="var(--font-hauora), sans-serif"
              >
                TDK
              </text>
            </g>

            {/* Normal Bias 120µs EQ */}
            <text
              x="222"
              y="239"
              fontSize="12"
              fontWeight="500"
              opacity="0.92"
              fontFamily="var(--font-hauora), sans-serif"
            >
              Normal Bias 120µs EQ
            </text>

            {/* A | 90 */}
            <text
              x="362"
              y="245"
              fontSize="28"
              fontWeight="700"
              letterSpacing="-0.02em"
              fontFamily="var(--font-hauora), sans-serif"
            >
              A|90
            </text>

            {/* Made in Japan */}
            <text
              x="438"
              y="240"
              fontSize="8"
              fontWeight="500"
              opacity="0.78"
              fontFamily="var(--font-hauora), sans-serif"
            >
              Made in Japan
            </text>
          </g>
        )}

        {/* 4 Bottom Capstan / Alignment Holes */}
        {[
          { cx: 148, cy: 312, r: 10 },
          { cx: 212, cy: 296, r: 8.5 },
          { cx: 346, cy: 296, r: 8.5 },
          { cx: 410, cy: 312, r: 10 },
        ].map((h, i) => (
          <circle
            key={i}
            cx={h.cx}
            cy={h.cy}
            r={h.r}
            fill="#050505"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
          />
        ))}

        {/* 5 Precision Screws */}
        {config.showScrews && (
          <>
            {renderTdkScrew(22, 18, 25)}
            {renderTdkScrew(536, 18, -35)}
            {renderTdkScrew(22, 324, 40)}
            {renderTdkScrew(536, 324, 15)}
            {renderTdkScrew(279, 286, -15)}
          </>
        )}
      </svg>
    );
  };

  // =========================================================================
  // STYLE 2: RETRO CREAM VINTAGE CASSETTE (1:1 from first Figma 467x297)
  // =========================================================================
  const renderVintageCassette = () => {
    const leftTapeR = 54 - progress * 22;
    const rightTapeR = 32 + progress * 22;

    const renderReelHub = (cx: number, cy: number) => (
      <g transform={`translate(${cx}, ${cy})`}>
        <g transform={`rotate(${reelAngle})`}>
          <circle cx={0} cy={0} r={24.5} fill="#353235" stroke={config.reelColor} strokeWidth={4} />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x={-2.2}
              y={-22.5}
              width={4.4}
              height={7.5}
              rx={1}
              fill={config.reelColor}
              transform={`rotate(${deg})`}
            />
          ))}
          {[20, 140, 260].map((deg) => (
            <rect
              key={`tick-${deg}`}
              x={6}
              y={-0.6}
              width={8}
              height={1.2}
              fill="#8f8d90"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx={0} cy={0} r={6} fill="#6c606c" />
          <circle cx={0} cy={0} r={2.5} fill="#252225" />
        </g>
        <circle cx={0} cy={0} r={29.5} fill="url(#vintageReelGlass)" />
      </g>
    );

    const renderScrew = (cx: number, cy: number, rot = 35) => (
      <g transform={`translate(${cx}, ${cy})`}>
        <circle cx={0} cy={0} r={9.5} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />
        <circle cx={0} cy={0} r={8} fill={config.bottomPrintColor} stroke="#252021" strokeWidth={0.7} />
        <g transform={`rotate(${rot})`}>
          <rect x={-4.2} y={-1.1} width={8.4} height={2.2} rx={0.6} fill="#363336" />
          <rect x={-1.1} y={-4.2} width={2.2} height={8.4} rx={0.6} fill="#363336" />
        </g>
      </g>
    );

    return (
      <svg
        viewBox="0 0 467 297"
        className="w-full h-auto block"
        style={{ filter: shadowFilter }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Retro Cassette: ${trackTitle} — ${trackSubtitle}`}
      >
        <defs>
          <linearGradient id="topSpecLine" x1="80" y1="224" x2="389" y2="224" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="vintageReelGlass" x1="0" y1="-29.5" x2="0" y2="29.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2d2b2e" stopOpacity={config.glassOpacity} />
            <stop offset="50%" stopColor="#2d2b2e" stopOpacity={config.glassOpacity * 0.45} />
            <stop offset="100%" stopColor="#666666" stopOpacity="0" />
          </linearGradient>

          <filter id="vintageGrain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="monoNoise" />
            <feComponentTransfer in="monoNoise" result="softNoise">
              <feFuncA type="linear" slope={config.grainOpacity} />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="softNoise" mode="overlay" />
          </filter>

          <clipPath id="labelClip">
            <rect x="30" y="27" width="406" height="180" rx="12" />
          </clipPath>
          <clipPath id="windowClip">
            <rect x="193" y="106" width="82" height="28" rx="3" />
          </clipPath>
          <clipPath id="bridgeClip">
            <path d="M 76 225 H 392 L 406 294 H 62 Z" />
          </clipPath>
        </defs>

        <rect
          x="0.75"
          y="0.75"
          width="465.5"
          height="292.5"
          rx={config.cornerRadius}
          fill={config.shellColor}
          stroke={config.shellBorderColor}
          strokeWidth="1.5"
          filter={config.grainOpacity > 0 ? "url(#vintageGrain)" : undefined}
        />

        <g clipPath="url(#labelClip)">
          <rect x="30" y="27" width="406" height="180" rx="12" fill={config.labelBgColor} />

          {config.showBottomInfo && (
            <g fill={config.accentColor}>
              <rect x="30" y="178" width="406" height="29" />
              <rect x="30" y="159" width="406" height="13" />
              <rect x="30" y="143" width="406" height="10" />
              <rect x="30" y="131" width="406" height="6" />
              <rect x="30" y="121" width="406" height="4" />
              <rect x="30" y="111" width="406" height="4" />
              <rect x="30" y="103" width="406" height="2" />
              <rect x="30" y="95" width="406" height="2" />
            </g>
          )}

          <rect x="102" y="63" width="305" height="1" fill="rgba(0,0,0,0.08)" />
          <rect x="102" y="76" width="305" height="1" fill="rgba(0,0,0,0.08)" />

          {config.showBadge && (
            <>
              <rect x="44" y="41" width="42" height="42" rx="2" fill={config.labelTextColor} />
              <text x="48" y="60" fill="#ffffff" fontSize="6" fontFamily="var(--font-hauora), sans-serif" fontWeight="500">
                Legends
              </text>
              <text x="48" y="68" fill="#ffffff" fontSize="6" fontFamily="var(--font-hauora), sans-serif" fontWeight="400">
                never die
              </text>
            </>
          )}

          <text
            x={config.showBadge ? 102 : 48}
            y="58"
            fill={config.labelTextColor}
            fontSize="16"
            fontWeight="700"
            fontFamily="var(--font-hauora), sans-serif"
          >
            {trackTitle.length > 28 ? `${trackTitle.slice(0, 27)}…` : trackTitle}
          </text>
          <text
            x={config.showBadge ? 102 : 48}
            y="73"
            fill={config.labelTextColor}
            fontSize="10"
            fontWeight="400"
            fontFamily="var(--font-hauora), sans-serif"
          >
            {trackSubtitle.length > 36 ? `${trackSubtitle.slice(0, 35)}…` : trackSubtitle}
          </text>
        </g>

        <rect
          x="30"
          y="27"
          width="406"
          height="180"
          rx="12"
          fill="none"
          stroke="#252021"
          strokeOpacity="0.5"
          strokeWidth="2"
        />

        <rect
          x="122"
          y="95"
          width="224"
          height="67"
          rx="33.5"
          fill="#2d2b2e"
          stroke="#1b191c"
          strokeWidth="1.5"
        />

        <rect x="193" y="106" width="82" height="28" rx="3" fill={config.windowBgColor} />
        <g clipPath="url(#windowClip)">
          <circle cx="157" cy="128" r={leftTapeR} fill={config.tapeColor} stroke="#1e1c1f" strokeWidth="1" />
          <circle cx="312" cy="128" r={rightTapeR} fill={config.tapeColor} stroke="#1e1c1f" strokeWidth="1" />
          {config.showWindowScale &&
            [207, 220, 234, 248, 261].map((tx, idx) => (
              <line
                key={tx}
                x1={tx}
                y1={idx === 2 ? 123 : 127}
                x2={tx}
                y2={134}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
              />
            ))}
        </g>
        <rect x="193" y="106" width="82" height="28" rx="3" fill="none" stroke="#1e1c1f" strokeWidth="1" />

        {renderReelHub(157, 128.5)}
        {renderReelHub(312, 128.5)}

        <g clipPath="url(#bridgeClip)">
          <path d="M 76 225 H 392 L 406 294 H 62 Z" fill="rgba(0,0,0,0.2)" />
          {config.showTexture &&
            [231, 237, 243, 249, 255, 261, 267, 273, 279, 285, 291].map((ly) => (
              <line key={ly} x1="56" y1={ly} x2="408" y2={ly} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
            ))}
        </g>
        <path d="M 76 225 H 392 L 406 294 H 62 Z" fill="none" stroke="#1b191c" strokeWidth="1" />
        <line x1="80" y1="224.5" x2="389" y2="224.5" stroke="url(#topSpecLine)" strokeWidth="0.7" />

        {[
          { cx: 160, cy: 263 },
          { cx: 107, cy: 283 },
          { cx: 302, cy: 263 },
          { cx: 354, cy: 283 },
        ].map((hole, i) => (
          <circle key={i} cx={hole.cx} cy={hole.cy} r={8} fill="#0a080a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}

        {config.showScrews && (
          <>
            {renderScrew(16, 16, 28)}
            {renderScrew(451, 16, -32)}
            {renderScrew(16, 278, 45)}
            {renderScrew(451, 278, 12)}
            {renderScrew(234, 239, -18)}
          </>
        )}
      </svg>
    );
  };

  return (
    <>
      {/* Floating Right-Side CASSETTE LAB Customizer Panel (Staging) */}
      <CassetteCustomizerPanel config={config} onChange={handleConfigChange} />

      <div className={`flex w-full max-w-[564px] flex-col items-center gap-[20px] sm:gap-[24px] ${className}`}>
        <audio ref={audioRef} src={effectiveAudioUrl ?? undefined} preload="metadata" />
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 1. Switchable Photorealistic Cassette Shell */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{ transform: `scale(${config.scale})` }}
          className={`relative w-full max-w-[490px] origin-center transition-transform duration-200 select-none ${
            isDragOver ? "ring-1 ring-[#ffb84d]/60 rounded-[20px]" : ""
          }`}
        >
          {config.style === "tdk" ? renderTdkCassette() : renderVintageCassette()}

          {isDragOver && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[20px] bg-black/60 backdrop-blur-[2px]">
              <span className="font-stetica text-[14px] uppercase tracking-wider text-content-contrast">
                Drop audio track
              </span>
            </div>
          )}
        </div>

        {/* 2. COMM-Style Tactile Hardware Deck Controls Underneath */}
        <Section
          label={statusText}
          labelClassName="max-w-[calc(100%-32px)]"
          textClassName="truncate whitespace-nowrap"
          className="flex h-[94px] sm:h-[116px] w-full max-w-[490px] flex-row items-center justify-center gap-[14px] sm:gap-[24px] px-[16px] sm:px-[24px]"
        >
          <Button
            label="rew"
            size="responsive"
            aria-label="Rewind track"
            onPointerDown={() => beginHoldScrub("rew")}
            className="shrink-0"
          >
            <span className="flex h-full w-full items-center justify-center">
              <svg width="14" height="10" viewBox="0 0 19 12" fill="none" className={isRewinding ? "text-[#ffb84d]" : "text-content-tertiary group-hover:text-content-primary transition-colors"}>
                <path d="M9 12L0.5 6L9 0V12ZM18.5 12L10 6L18.5 0V12Z" fill="currentColor" />
              </svg>
            </span>
          </Button>

          <Button
            label={isPlaying ? "pause" : "play"}
            size="responsive"
            aria-label={isPlaying ? "Pause cassette" : "Play cassette"}
            onClick={handleTogglePlay}
            className="shrink-0"
          >
            <span className="flex h-full w-full items-center justify-center">
              {isPlaying ? (
                <svg width="10" height="11" viewBox="0 0 10 12" fill="none" className="text-[#ffb84d] drop-shadow-[0_0_6px_rgba(255,184,77,0.45)]">
                  <rect x="0.5" y="0.5" width="3" height="11" rx="0.8" fill="currentColor" />
                  <rect x="6.5" y="0.5" width="3" height="11" rx="0.8" fill="currentColor" />
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 11 14" fill="none" className="translate-x-[1px] text-content-tertiary group-hover:text-content-primary transition-colors">
                  <path d="M0.5 0.5V13.5L10.5 7L0.5 0.5Z" fill="currentColor" />
                </svg>
              )}
            </span>
          </Button>

          <Button
            label="ff"
            size="responsive"
            aria-label="Fast forward track"
            onPointerDown={() => beginHoldScrub("ff")}
            className="shrink-0"
          >
            <span className="flex h-full w-full items-center justify-center">
              <svg width="14" height="10" viewBox="0 0 19 12" fill="none" className={isForwarding ? "text-[#ffb84d]" : "text-content-tertiary group-hover:text-content-primary transition-colors"}>
                <path d="M0.5 12V0L9 6L0.5 12ZM10 12V0L18.5 6L10 12Z" fill="currentColor" />
              </svg>
            </span>
          </Button>

          <Button
            label="tape"
            size="responsive"
            aria-label="Load your own audio track"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <span className="flex h-full w-full items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-content-tertiary group-hover:text-content-primary transition-colors">
                <path d="M6 1.5L11 7H1L6 1.5ZM1 9H11V10.8H1V9Z" fill="currentColor" />
              </svg>
            </span>
          </Button>
        </Section>
      </div>
    </>
  );
};
