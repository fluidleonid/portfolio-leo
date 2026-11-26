"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section } from "@/shared/ui";
import { tactileAudio } from "@/shared/lib/audio";
import {
  DEFAULT_TAPE_DSP_PARAMS,
  type TapeDspParams,
  VintageTapeEngine,
  loadSavedTapeDspParams,
  saveTapeDspParams,
} from "../model/vintageTapeEngine";
import { TapeDspTunerPanel } from "./TapeDspTunerPanel";

export interface CassettePlayerProps {
  /** Optional single audio track URL from Sanity CMS */
  audioUrl?: string;
  /** Optional track title printed on the cassette label (default: "Working Mix") */
  title?: string;
  /** Optional className */
  className?: string;
}

const DEFAULT_MIXTAPE_TRACKS = [
  "/audio/mix/1.mp3",
  "/audio/mix/2.mp3",
  "/audio/mix/3.mp3",
  "/audio/mix/4.mp3",
];

type TransportMode = "paused" | "playing" | "rewinding" | "forwarding";

/**
 * CV-Sized (60x60px) Square Tactile Hardware Button matching ButtonDownload 1:1
 */
interface DeckButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

const DeckButton: React.FC<DeckButtonProps> = ({
  active = false,
  className = "",
  onPointerEnter,
  onPointerDown,
  onKeyDown,
  children,
  ...props
}) => (
  <button
    type="button"
    onPointerEnter={(e) => {
      if (e.pointerType === "mouse") tactileAudio.playHover("matte");
      onPointerEnter?.(e);
    }}
    onPointerDown={(e) => {
      if (e.button === 0) tactileAudio.playKeyClick("matte");
      onPointerDown?.(e);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") tactileAudio.playKeyClick("matte");
      onKeyDown?.(e);
    }}
    className={`group relative inline-flex h-[52px] w-[52px] sm:h-[60px] sm:w-[60px] shrink-0 cursor-pointer select-none items-center justify-center rounded-[14px] sm:rounded-[16px] bg-black/15 p-[4px] pt-[3px] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25),inset_0_-1px_1px_rgba(255,255,255,0.02)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${className}`}
    {...props}
  >
    <span
      className={`relative flex h-[44px] w-[44px] sm:h-[52px] sm:w-[52px] items-center justify-center rounded-[10px] sm:rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.20)] transition-all duration-150 ease-out group-hover:translate-y-[1px] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] group-active:translate-y-[1px] group-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_-1px_0_rgba(0,0,0,0.25),0_1px_1px_rgba(0,0,0,0.15)] ${
        active ? "translate-y-[1px]" : ""
      }`}
      style={{
        background:
          "linear-gradient(175deg, var(--color-surface-pill, #2c2c2c) 0%, var(--color-surface, #242424) 100%)",
      }}
    >
      {children}
    </span>
  </button>
);

export const CassettePlayer: React.FC<CassettePlayerProps> = ({
  audioUrl,
  title = "Working Mix",
  className = "",
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const engineRef = useRef<VintageTapeEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const rateRafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const scrubIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdActiveRef = useRef<boolean>(false);

  const [dspParams, setDspParams] = useState<TapeDspParams>(DEFAULT_TAPE_DSP_PARAMS);
  const dspParamsRef = useRef<TapeDspParams>(DEFAULT_TAPE_DSP_PARAMS);

  const [localTrackUrl, setLocalTrackUrl] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string>(title);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [mode, setMode] = useState<TransportMode>("paused");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [reelAngle, setReelAngle] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    const saved = loadSavedTapeDspParams();
    setDspParams(saved);
    dspParamsRef.current = saved;
    engineRef.current?.applyParams(saved);
  }, []);

  const handleDspChange = (next: TapeDspParams) => {
    setDspParams(next);
    dspParamsRef.current = next;
    saveTapeDspParams(next);
    engineRef.current?.applyParams(next);
  };

  const playlist = useMemo(() => {
    if (localTrackUrl) return [localTrackUrl];
    if (audioUrl) return [audioUrl];
    return DEFAULT_MIXTAPE_TRACKS;
  }, [localTrackUrl, audioUrl]);

  const currentSrc = playlist[trackIndex % playlist.length];

  useEffect(() => {
    if (!localTrackUrl) setTrackTitle(title);
  }, [title, localTrackUrl]);

  useEffect(() => {
    setTrackIndex(0);
  }, [localTrackUrl, audioUrl]);

  useEffect(() => {
    return () => {
      if (localTrackUrl) URL.revokeObjectURL(localTrackUrl);
      engineRef.current?.dispose();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (rateRafRef.current !== null) cancelAnimationFrame(rateRafRef.current);
      if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);
    };
  }, [localTrackUrl]);

  const ensureEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new VintageTapeEngine(dspParamsRef.current);
    }
    if (audioRef.current) {
      engineRef.current.attachAudioElement(audioRef.current);
    }
    return engineRef.current;
  }, []);

  /** Smoothly glides audio playbackRate with pitch-shift enabled (preservesPitch = false) */
  const glidePlaybackRate = useCallback(
    (audio: HTMLAudioElement, fromRate: number, toRate: number, durationMs: number) => {
      if (rateRafRef.current !== null) {
        cancelAnimationFrame(rateRafRef.current);
        rateRafRef.current = null;
      }
      try {
        (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
        if (durationMs <= 10) {
          audio.playbackRate = toRate;
          return;
        }
        audio.playbackRate = fromRate;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          audio.playbackRate = fromRate + (toRate - fromRate) * eased;
          if (t < 1) {
            rateRafRef.current = requestAnimationFrame(step);
          } else {
            audio.playbackRate = toRate;
            rateRafRef.current = null;
          }
        };
        rateRafRef.current = requestAnimationFrame(step);
      } catch {
        audio.playbackRate = toRate;
      }
    },
    []
  );

  const startPlayback = useCallback(
    (withMotorSpinUp = true) => {
      const audio = audioRef.current;
      if (!audio) return;
      const engine = ensureEngine();
      engine.setTapeHiss(true);

      const p = dspParamsRef.current;
      if (withMotorSpinUp && p.enabled) {
        const motorWear = (100 - p.motorQuality) / 100;
        const spinDur = Math.round(80 + motorWear * 260);
        const startRate = Math.max(0.75, 0.94 - motorWear * 0.14);
        glidePlaybackRate(audio, startRate, 1.0, spinDur);
      } else {
        glidePlaybackRate(audio, 1.0, 1.0, 0);
      }

      void audio.play().catch(() => {});
      setMode("playing");
    },
    [ensureEngine, glidePlaybackRate]
  );

  const pausePlayback = useCallback(() => {
    if (rateRafRef.current !== null) {
      cancelAnimationFrame(rateRafRef.current);
      rateRafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.playbackRate = 1.0;
    }
    engineRef.current?.setTapeHiss(false);
    setMode("paused");
  }, []);

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
      if (playlist.length > 1) {
        const nextIdx = (trackIndex + 1) % playlist.length;
        setTrackIndex(nextIdx);
        setCurrentTime(0);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            startPlayback(false);
          }
        }, 40);
      } else {
        setMode("paused");
        setCurrentTime(0);
        audio.currentTime = 0;
        engineRef.current?.setTapeHiss(false);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSrc, playlist.length, trackIndex, startPlayback]);

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
        mode === "playing" ? 48 : mode === "forwarding" ? 290 : -290;

      setReelAngle((prev) => (prev + speedDegPerSec * dtSec) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode]);

  const handleTogglePlay = () => {
    if (mode === "playing") {
      pausePlayback();
    } else {
      startPlayback(true);
    }
  };

  const seekBy = useCallback(
    (deltaSec: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
      if (dur <= 0) return;
      const next = Math.max(0, Math.min(dur, audio.currentTime + deltaSec));
      audio.currentTime = next;
      setCurrentTime(next);
    },
    [duration]
  );

  const switchTrack = useCallback(
    (delta: -1 | 1, resumePlay: boolean) => {
      if (playlist.length <= 1) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
        }
        return;
      }
      const nextIdx = (trackIndex + delta + playlist.length) % playlist.length;
      setTrackIndex(nextIdx);
      setCurrentTime(0);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (resumePlay) {
            startPlayback(true);
          }
        }
      }, 50);
    },
    [playlist.length, trackIndex, startPlayback]
  );

  /**
   * Cue & Review Tape Scrub:
   * - When PLAYING: engages the tape head against the fast-moving tape!
   *   - FF: accelerates real audio playbackRate to `cueSpeed` (default 3.4x) with pitch shift ON!
   *   - REW: plays high-pitched micro-slices while stepping backwards through the track!
   * - When PAUSED: disengages head and plays pure mechanical reel motor whir while scrubbing time.
   * - Short tap (<200ms): jumps to next/previous track (or restarts track on REW).
   */
  const beginHoldScrub = (direction: "rew" | "ff") => {
    const audio = audioRef.current;
    const wasPlaying = mode === "playing";
    const engine = ensureEngine();
    const cueRate = Math.max(2.0, Math.min(5.0, dspParamsRef.current.cueSpeed));

    holdActiveRef.current = false;
    setMode(direction === "rew" ? "rewinding" : "forwarding");
    engine.startScrubSound(direction, wasPlaying);

    if (wasPlaying && audio) {
      // Head engaged! Keep audio playing and pitch-shift it up to cueRate
      glidePlaybackRate(audio, audio.playbackRate || 1.0, cueRate, 130);
    }

    const holdStartedAt = performance.now();
    if (scrubIntervalRef.current) clearInterval(scrubIntervalRef.current);

    scrubIntervalRef.current = setInterval(() => {
      if (performance.now() - holdStartedAt >= 180) {
        holdActiveRef.current = true;

        if (wasPlaying && audio) {
          if (direction === "rew") {
            // Step backwards while playing high-pitched slices (authentic Cue/Review reverse squeal!)
            const next = Math.max(0, audio.currentTime - 0.55);
            audio.currentTime = next;
            setCurrentTime(next);
          } else {
            // For FF, the accelerated playbackRate itself advances currentTime cleanly!
            setCurrentTime(audio.currentTime);
          }
        } else {
          // Paused: silent head, mechanical scrub through timeline
          seekBy(direction === "rew" ? -1.8 : 1.8);
        }
      }
    }, 85);

    const stopScrub = () => {
      if (scrubIntervalRef.current) {
        clearInterval(scrubIntervalRef.current);
        scrubIntervalRef.current = null;
      }

      if (!holdActiveRef.current) {
        // Short tap: quick skip track with brief mechanical whir
        setTimeout(() => engine.stopScrubSound(), 100);
        if (wasPlaying && audio) {
          audio.playbackRate = 1.0;
        }
        if (playlist.length > 1) {
          if (direction === "rew" && (audio?.currentTime ?? 0) > 3) {
            if (audio) audio.currentTime = 0;
            setCurrentTime(0);
            if (wasPlaying) startPlayback(true);
            else setMode("paused");
          } else {
            switchTrack(direction === "rew" ? -1 : 1, wasPlaying);
            if (!wasPlaying) setMode("paused");
          }
        } else {
          seekBy(direction === "rew" ? -10 : 10);
          if (wasPlaying) startPlayback(true);
          else setMode("paused");
        }
      } else {
        engine.stopScrubSound();
        if (wasPlaying && audio) {
          // Smoothly pinch capstan back down from high-pitched cueRate -> 1.0x!
          glidePlaybackRate(audio, audio.playbackRate || cueRate, 1.0, 180);
          void audio.play().catch(() => {});
          setMode("playing");
        } else {
          setMode("paused");
        }
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
      if (localTrackUrl) URL.revokeObjectURL(localTrackUrl);
      const url = URL.createObjectURL(file);
      setLocalTrackUrl(url);

      const cleanName = file.name.replace(/\.[^/.]+$/, "").trim();
      setTrackTitle(cleanName || "Custom Mix");
      setCurrentTime(0);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          startPlayback(true);
        }
      }, 60);
    },
    [localTrackUrl, startPlayback]
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

  const trackProgress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const overallProgress =
    playlist.length > 1
      ? (trackIndex + trackProgress) / playlist.length
      : trackProgress;

  const isPlaying = mode === "playing";
  const isRewinding = mode === "rewinding";
  const isForwarding = mode === "forwarding";

  const leftTapeR = 114 - overallProgress * 44;
  const rightTapeR = 70 + overallProgress * 44;

  const renderTdkReel = (cx: number, cy: number, maskId: string) => {
    const tapeR = cx < 280 ? leftTapeR : rightTapeR;
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <g mask={`url(#${maskId})`}>
          <circle cx={0} cy={0} r={tapeR} fill="#14110d" />
          <circle cx={0} cy={0} r={tapeR} fill="url(#tdkTapeRings)" opacity={0.75} />
        </g>

        <g transform={`rotate(${reelAngle})`}>
          <path
            d="M 60 0 A 60 60 0 1 0 -60 0 A 60 60 0 1 0 60 0 Z M 33 0 A 33 33 0 1 1 -33 0 A 33 33 0 1 1 33 0 Z"
            fill="#ffffff"
            fillRule="evenodd"
          />
          <circle cx={0} cy={0} r={59} fill="none" stroke="#d2d2d2" strokeWidth={2} />

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
    <>
      {/* Staging Tape DSP Control Panel on Right Side */}
      <TapeDspTunerPanel params={dspParams} onChange={handleDspChange} />

      <div className={`flex w-full max-w-[564px] flex-col items-center gap-[20px] sm:gap-[24px] ${className}`}>
        <audio
          ref={audioRef}
          src={currentSrc}
          crossOrigin="anonymous"
          preload="metadata"
        />
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
          className={`relative w-full transition-transform duration-200 select-none ${
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

              <linearGradient id="tdkGlass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.065" />
              </linearGradient>

              <mask id="tdkShellCutouts">
                <rect x="0" y="0" width="558" height="342" fill="#ffffff" />
                <rect x="212" y="122" width="134" height="76" rx="4" fill="#000000" />
                <circle cx="158" cy="160" r="35" fill="#000000" />
                <circle cx="400" cy="160" r="35" fill="#000000" />
                <circle cx="148" cy="312" r="10" fill="#000000" />
                <circle cx="212" cy="296" r="8.5" fill="#000000" />
                <circle cx="346" cy="296" r="8.5" fill="#000000" />
                <circle cx="410" cy="312" r="10" fill="#000000" />
              </mask>

              <mask id="reelHoleLeft">
                <rect x="-130" y="-130" width="260" height="260" fill="#ffffff" />
                <circle cx="0" cy="0" r="33" fill="#000000" />
              </mask>
              <mask id="reelHoleRight">
                <rect x="-130" y="-130" width="260" height="260" fill="#ffffff" />
                <circle cx="0" cy="0" r="33" fill="#000000" />
              </mask>

              <clipPath id="tdkWindowArea">
                <rect x="212" y="122" width="134" height="76" rx="4" />
                <circle cx="158" cy="160" r="35" />
                <circle cx="400" cy="160" r="35" />
              </clipPath>

              <clipPath id="tdkShellClip">
                <rect x="4" y="0" width="550" height="342" rx="20" />
              </clipPath>
            </defs>

            <rect x="0" y="234" width="6" height="82" rx="2" fill="#171717" stroke="#2b2a2b" strokeWidth="0.8" />
            <rect x="552" y="234" width="6" height="82" rx="2" fill="#171717" stroke="#2b2a2b" strokeWidth="0.8" />

            <g mask="url(#tdkShellCutouts)">
              <g clipPath="url(#tdkShellClip)">
                <rect x="4" y="0" width="550" height="342" rx="20" fill="#171717" />
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
                <path
                  d="M 102 262 H 456 L 474 342 H 84 Z"
                  fill="rgba(0,0,0,0.28)"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              </g>
            </g>

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

            {/* Top Amber-White-Amber Sticker */}
            <g>
              <rect x="40" y="31" width="478" height="12" rx="2" fill="#dd7027" />
              <rect x="40" y="43" width="478" height="48" fill="#ffffff" />
              <rect x="40" y="91" width="478" height="12" rx="2" fill="#dd7027" />

              <g opacity="0.72">
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

                <text
                  x="90"
                  y="62.5"
                  fill="#100f0f"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="var(--font-hauora), sans-serif"
                >
                  ACOUSTIC CASSETTE
                </text>

                <text
                  x="432"
                  y="62.5"
                  textAnchor="end"
                  fill="#100f0f"
                  fontSize="10"
                  fontWeight="500"
                  fontFamily="var(--font-hauora), sans-serif"
                  style={{ whiteSpace: "pre" }}
                >
                  {"N.R.[                     ]"}
                </text>

                <rect x="441" y="55.2" width="7.2" height="7.2" fill="none" stroke="#100f0f" strokeWidth="1" />
                <text x="451" y="62.5" fill="#100f0f" fontSize="10" fontWeight="500" fontFamily="var(--font-hauora), sans-serif">
                  IN
                </text>

                <rect x="468.5" y="55.2" width="7.2" height="7.2" fill="none" stroke="#100f0f" strokeWidth="1" />
                <text x="478.5" y="62.5" fill="#100f0f" fontSize="10" fontWeight="500" fontFamily="var(--font-hauora), sans-serif">
                  OUT
                </text>
              </g>

              <text
                x="279"
                y="67"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#100f0f"
                fontSize="20"
                fontWeight="400"
                fontFamily="var(--font-rock-salt), 'Rock Salt', cursive"
              >
                {trackTitle.length > 22 ? `${trackTitle.slice(0, 21)}…` : trackTitle}
              </text>
            </g>

            <g clipPath="url(#tdkWindowArea)">
              {renderTdkReel(158, 160, "reelHoleLeft")}
              {renderTdkReel(400, 160, "reelHoleRight")}
            </g>

            <circle cx="158" cy="160" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
            <circle cx="400" cy="160" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />

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

            <g fill="#fafafa">
              <g transform="translate(103, 224)">
                <polygon points="8,0 13,5 8,10 3,5" />
                <polygon points="3,7 8,12 3,17 -2,12" />
                <polygon points="13,7 18,12 13,17 8,12" />
                <text x="24" y="17" fontSize="21" fontWeight="800" letterSpacing="0.06em" fontFamily="var(--font-hauora), sans-serif">
                  TDK
                </text>
              </g>
              <text x="222" y="239" fontSize="12" fontWeight="500" opacity="0.92" fontFamily="var(--font-hauora), sans-serif">
                Normal Bias 120µs EQ
              </text>
              <text x="362" y="245" fontSize="28" fontWeight="700" letterSpacing="-0.02em" fontFamily="var(--font-hauora), sans-serif">
                A|90
              </text>
              <text x="438" y="240" fontSize="8" fontWeight="500" opacity="0.78" fontFamily="var(--font-hauora), sans-serif">
                Made in Japan
              </text>
            </g>

            {[
              { cx: 148, cy: 312, r: 10 },
              { cx: 212, cy: 296, r: 8.5 },
              { cx: 346, cy: 296, r: 8.5 },
              { cx: 410, cy: 312, r: 10 },
            ].map((h, i) => (
              <circle key={i} cx={h.cx} cy={h.cy} r={h.r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
            ))}

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

        {/* 2. CV-Sized (60x60px) Square Tactile Hardware Deck Controls */}
        <Section
          label="TAPE"
          className="flex h-[94px] sm:h-[124px] w-full flex-row items-center justify-center gap-[16px] sm:gap-[28px] px-[16px] sm:px-[24px]"
        >
          <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
            <defs>
              <linearGradient id="tapeDeckLampGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF8C4" />
                <stop offset="35%" stopColor="#FFDF64" />
                <stop offset="65%" stopColor="#FFC438" />
                <stop offset="85%" stopColor="#F59820" />
                <stop offset="100%" stopColor="#E57810" />
              </linearGradient>
              <filter id="tapeDeckLampGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="contourBlur" />
                <feFlood floodColor="#E58E1A" floodOpacity="0.28" result="amberFlood" />
                <feComposite in="amberFlood" in2="contourBlur" operator="in" result="coloredOutline" />
                <feMerge>
                  <feMergeNode in="coloredOutline" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <DeckButton
            active={isRewinding}
            aria-label="Rewind or previous track"
            onPointerDown={() => beginHoldScrub("rew")}
          >
            <svg width="22" height="15" viewBox="0 0 19 12" fill="none" className="overflow-visible">
              <path
                d="M9 12L0.5 6L9 0V12ZM18.5 12L10 6L18.5 0V12Z"
                fill="var(--color-border-hardware, #383838)"
                className={`transition-opacity duration-200 ease-out ${
                  isRewinding ? "opacity-0" : "group-hover:opacity-0 group-active:opacity-0"
                }`}
              />
              <path
                d="M9 12L0.5 6L9 0V12ZM18.5 12L10 6L18.5 0V12Z"
                fill="url(#tapeDeckLampGrad)"
                filter="url(#tapeDeckLampGlow)"
                className={`transition-opacity duration-200 ease-out ${
                  isRewinding ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-active:opacity-100"
                }`}
              />
            </svg>
          </DeckButton>

          <DeckButton
            active={isPlaying}
            aria-label={isPlaying ? "Pause cassette" : "Play cassette"}
            onClick={handleTogglePlay}
          >
            {isPlaying ? (
              <svg width="16" height="18" viewBox="0 0 10 12" fill="none" className="overflow-visible">
                <g fill="url(#tapeDeckLampGrad)" filter="url(#tapeDeckLampGlow)">
                  <rect x="0.5" y="0.5" width="3" height="11" rx="0.8" />
                  <rect x="6.5" y="0.5" width="3" height="11" rx="0.8" />
                </g>
              </svg>
            ) : (
              <svg width="17" height="20" viewBox="0 0 11 14" fill="none" className="translate-x-[1.5px] overflow-visible">
                <path
                  d="M0.5 0.5V13.5L10.5 7L0.5 0.5Z"
                  fill="var(--color-border-hardware, #383838)"
                  className="transition-opacity duration-200 ease-out group-hover:opacity-0 group-active:opacity-0"
                />
                <path
                  d="M0.5 0.5V13.5L10.5 7L0.5 0.5Z"
                  fill="url(#tapeDeckLampGrad)"
                  filter="url(#tapeDeckLampGlow)"
                  className="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-active:opacity-100"
                />
              </svg>
            )}
          </DeckButton>

          <DeckButton
            active={isForwarding}
            aria-label="Fast forward or next track"
            onPointerDown={() => beginHoldScrub("ff")}
          >
            <svg width="22" height="15" viewBox="0 0 19 12" fill="none" className="overflow-visible">
              <path
                d="M0.5 12V0L9 6L0.5 12ZM10 12V0L18.5 6L10 12Z"
                fill="var(--color-border-hardware, #383838)"
                className={`transition-opacity duration-200 ease-out ${
                  isForwarding ? "opacity-0" : "group-hover:opacity-0 group-active:opacity-0"
                }`}
              />
              <path
                d="M0.5 12V0L9 6L0.5 12ZM10 12V0L18.5 6L10 12Z"
                fill="url(#tapeDeckLampGrad)"
                filter="url(#tapeDeckLampGlow)"
                className={`transition-opacity duration-200 ease-out ${
                  isForwarding ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-active:opacity-100"
                }`}
              />
            </svg>
          </DeckButton>

          <DeckButton
            aria-label="Load your own audio track"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="19" height="19" viewBox="0 0 12 12" fill="none" className="overflow-visible">
              <path
                d="M6 1.5L11 7H1L6 1.5ZM1 9H11V10.8H1V9Z"
                fill="var(--color-border-hardware, #383838)"
                className="transition-opacity duration-200 ease-out group-hover:opacity-0 group-active:opacity-0"
              />
              <path
                d="M6 1.5L11 7H1L6 1.5ZM1 9H11V10.8H1V9Z"
                fill="url(#tapeDeckLampGrad)"
                filter="url(#tapeDeckLampGlow)"
                className="opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-active:opacity-100"
              />
            </svg>
          </DeckButton>
        </Section>
      </div>
    </>
  );
};
