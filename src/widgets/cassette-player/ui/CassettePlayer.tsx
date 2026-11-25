"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Section } from "@/shared/ui";

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

  const [localTrackUrl, setLocalTrackUrl] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string>(title);
  const [trackSubtitle, setTrackSubtitle] = useState<string>(subtitle);
  const [mode, setMode] = useState<TransportMode>("paused");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [reelAngle, setReelAngle] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

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

  // Dynamic magnetic tape pack radii (left shrinks as track plays, right grows)
  const leftTapeR = 114 - progress * 44; // 114 -> 70
  const rightTapeR = 70 + progress * 44; // 70 -> 114

  // Reusable reel with TRUE see-through spindle hole (page canvas visible between the 6 white teeth!)
  const renderTdkReel = (cx: number, cy: number, maskId: string) => {
    const tapeR = cx < 280 ? leftTapeR : rightTapeR;
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        {/* Magnetic tape pack with hollow center (spindle r=33 punched out) */}
        <g mask={`url(#${maskId})`}>
          <circle cx={0} cy={0} r={tapeR} fill="#14110d" />
          <circle cx={0} cy={0} r={tapeR} fill="url(#tdkTapeRings)" opacity={0.75} />
        </g>

        {/* Rotating white toothed reel ring + amber-orange lock clip (center r=33 is 100% transparent!) */}
        <g transform={`rotate(${reelAngle})`}>
          {/* Outer white reel flange ring (annulus r=60 outer, r=33 inner — true transparent hole) */}
          <path
            d="M 60 0 A 60 60 0 1 0 -60 0 A 60 60 0 1 0 60 0 Z M 33 0 A 33 33 0 1 1 -33 0 A 33 33 0 1 1 33 0 Z"
            fill="#ffffff"
            fillRule="evenodd"
          />
          <circle cx={0} cy={0} r={59} fill="none" stroke="#d2d2d2" strokeWidth={2} />

          {/* 6 white cassette drive teeth projecting inward into the transparent spindle hole */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x={-4}
              y={-35}
              width={8}
              height={11}
              rx={1}
              fill="#ffffff"
              transform={`rotate(${deg})`}
            />
          ))}

          {/* Signature warm amber-orange (#dd7027) tape lock clip on reel rim */}
          <path
            d="M 54 -17 A 57 57 0 0 1 54 17 L 46 14 A 49 49 0 0 0 46 -14 Z"
            fill="#dd7027"
          />
        </g>
      </g>
    );
  };

  const renderTdkScrew = (cx: number, cy: number, rot = 30) => (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle cx={0} cy={0} r={8.5} fill="#0b0b0b" stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />
      <circle cx={0} cy={0} r={6.2} fill="#252527" stroke="#0d0d0d" strokeWidth={0.8} />
      <g transform={`rotate(${rot})`}>
        <rect x={-3.5} y={-0.9} width={7} height={1.8} rx={0.5} fill="#0c0c0c" />
        <rect x={-0.9} y={-3.5} width={1.8} height={7} rx={0.5} fill="#0c0c0c" />
      </g>
    </g>
  );

  return (
    <div className={`flex w-full max-w-[564px] flex-col items-center gap-[20px] sm:gap-[24px] ${className}`}>
      <audio ref={audioRef} src={effectiveAudioUrl ?? undefined} preload="metadata" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Calibrated TDK D90 Black & Amber Cassette with True See-Through Cutouts */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative w-full max-w-[490px] transition-transform duration-200 select-none ${
          isDragOver ? "scale-[1.01] ring-1 ring-[#dd7027]/60 rounded-[20px]" : ""
        }`}
      >
        <svg
          viewBox="0 0 558 342"
          className="w-full h-auto block"
          style={{ filter: "drop-shadow(0px 2px 4px rgba(18, 18, 18, 0.35))" }}
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

            {/* Translucent glass sheen over the transparent center window (0.26 opacity) */}
            <linearGradient id="tdkGlass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.065" />
            </linearGradient>

            {/* TRUE SEE-THROUGH SHELL CUTOUT MASK: punches out window, both reel holes, and 4 bottom holes */}
            <mask id="tdkShellCutouts">
              <rect x="0" y="0" width="558" height="342" fill="#ffffff" />
              {/* Center transparent window cutout */}
              <rect x="212" y="122" width="134" height="76" rx="4" fill="#000000" />
              {/* Left & right reel spindle holes */}
              <circle cx="158" cy="160" r="35" fill="#000000" />
              <circle cx="400" cy="160" r="35" fill="#000000" />
              {/* 4 bottom alignment & capstan holes */}
              <circle cx="148" cy="312" r="10" fill="#000000" />
              <circle cx="212" cy="296" r="8.5" fill="#000000" />
              <circle cx="346" cy="296" r="8.5" fill="#000000" />
              <circle cx="410" cy="312" r="10" fill="#000000" />
            </mask>

            {/* Reel spindle hole masks (local coords centered at 0,0) */}
            <mask id="reelHoleLeft">
              <rect x="-130" y="-130" width="260" height="260" fill="#ffffff" />
              <circle cx="0" cy="0" r="33" fill="#000000" />
            </mask>
            <mask id="reelHoleRight">
              <rect x="-130" y="-130" width="260" height="260" fill="#ffffff" />
              <circle cx="0" cy="0" r="33" fill="#000000" />
            </mask>

            {/* Clip for reels & tape packs visible through transparent window + reel cutouts */}
            <clipPath id="tdkWindowArea">
              <rect x="212" y="122" width="134" height="76" rx="4" />
              <circle cx="158" cy="160" r="35" />
              <circle cx="400" cy="160" r="35" />
            </clipPath>

            <clipPath id="tdkShellClip">
              <rect x="4" y="0" width="550" height="342" rx="20" />
            </clipPath>
          </defs>

          {/* Left & Right Mechanical Shell Ears */}
          <rect x="0" y="234" width="6" height="82" rx="2" fill="#171717" stroke="#2b2a2b" strokeWidth="0.8" />
          <rect x="552" y="234" width="6" height="82" rx="2" fill="#171717" stroke="#2b2a2b" strokeWidth="0.8" />

          {/* Main Shell Body with ALL 7 True See-Through Cutout Holes Punched Out */}
          <g mask="url(#tdkShellCutouts)">
            <g clipPath="url(#tdkShellClip)">
              <rect x="4" y="0" width="550" height="342" rx="20" fill="#171717" />

              {/* Subtle Recessed Top Molding */}
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
          </g>

          {/* Outer Shell Bevel Border */}
          <rect
            x="4.75"
            y="0.75"
            width="548.5"
            height="340.5"
            rx="20"
            fill="none"
            stroke="#2b2a2b"
            strokeWidth="1.5"
          />

          {/* Top Amber-White-Amber Sticker (478x72 at x=40, y=31) */}
          <g>
            <rect x="40" y="31" width="478" height="12" rx="2" fill="#dd7027" />
            <rect x="40" y="43" width="478" height="48" fill="#ffffff" />
            <rect x="40" y="91" width="478" height="12" rx="2" fill="#dd7027" />

            {/* Left 'A' Square Badge */}
            <g transform="translate(58, 55)">
              <rect x="0" y="0" width="24" height="24" rx="1.5" fill="#100f0f" />
              <text
                x="12"
                y="18"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="18"
                fontWeight="700"
                fontFamily="var(--font-hauora), sans-serif"
              >
                A
              </text>
            </g>

            {/* Acoustic Cassette & Subtitle */}
            <text
              x="90"
              y="64"
              fill="#100f0f"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-hauora), sans-serif"
            >
              Acoustic Cassette
            </text>
            <text
              x="90"
              y="78"
              fill="#100f0f"
              fontSize="9"
              opacity="0.7"
              fontFamily="var(--font-hauora), sans-serif"
            >
              {trackSubtitle.length > 22 ? `${trackSubtitle.slice(0, 21)}…` : trackSubtitle}
            </text>

            {/* Center Track Title */}
            <text
              x="279"
              y="74"
              textAnchor="middle"
              fill="#100f0f"
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
              fill="#100f0f"
              fontSize="9"
              fontWeight="500"
              fontFamily="var(--font-hauora), sans-serif"
            >
              N.R.[    ]  □In □Out
            </text>
          </g>

          {/* Spinning Reels & Dynamic Magnetic Tape Packs (visible through transparent window & reel cutouts — NO opaque backing!) */}
          <g clipPath="url(#tdkWindowArea)">
            {renderTdkReel(158, 160, "reelHoleLeft")}
            {renderTdkReel(400, 160, "reelHoleRight")}
          </g>

          {/* Subtle Molded Rims around the See-Through Reel Holes */}
          <circle cx="158" cy="160" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
          <circle cx="400" cy="160" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />

          {/* Transparent Frosted Glass Sheen over the See-Through Center Window (0.26 opacity, no dark fill behind!) */}
          <rect
            x="212"
            y="122"
            width="134"
            height="76"
            rx="4"
            fill="url(#tdkGlass)"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="1.5"
          />

          {/* Crisp White Bottom Print: TDK • Normal Bias 120µs EQ • A|90 • Made in Japan */}
          <g fill="#fafafa">
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

          {/* Subtle Inner Rim Rings around the 4 Punched-Through Bottom Holes (transparent interior!) */}
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
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.2"
            />
          ))}

          {/* 5 Precision Screws */}
          {renderTdkScrew(22, 18, 25)}
          {renderTdkScrew(536, 18, -35)}
          {renderTdkScrew(22, 324, 40)}
          {renderTdkScrew(536, 324, 15)}
          {renderTdkScrew(279, 286, -15)}
        </svg>

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
            <svg width="14" height="10" viewBox="0 0 19 12" fill="none" className={isRewinding ? "text-[#dd7027]" : "text-content-tertiary group-hover:text-content-primary transition-colors"}>
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
              <svg width="10" height="11" viewBox="0 0 10 12" fill="none" className="text-[#dd7027] drop-shadow-[0_0_6px_rgba(221,112,39,0.5)]">
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
            <svg width="14" height="10" viewBox="0 0 19 12" fill="none" className={isForwarding ? "text-[#dd7027]" : "text-content-tertiary group-hover:text-content-primary transition-colors"}>
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
  );
};
