"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { tokens } from "@/shared/config";

export interface TunerFrame {
  id: string;
  label?: string;
  targetId: string;
  isProject?: boolean;
}

export interface ProjectItemRef {
  id?: string | number;
  anchorId?: string;
  title?: string;
}

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dynamic project list from Sanity or seed data to generate tuner frames/notches */
  projects?: ProjectItemRef[];
  /** Active station or section id */
  activeStation?: string;
  /** Navigation callback */
  onStationChange?: (station: string) => void;
  /** Scroll threshold to reveal top bar in px (default: 200) */
  scrollThreshold?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  projects,
  activeStation = "index",
  onStationChange,
  scrollThreshold = 200,
  className = "",
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [needleRatio, setNeedleRatio] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamically generate tuner frames based on live projects count from Sanity
  const frames = useMemo<TunerFrame[]>(() => {
    const list: TunerFrame[] = [
      { id: "index", label: "index", targetId: "top" },
    ];

    if (projects && projects.length > 0) {
      projects.forEach((proj, idx) => {
        const anchorId =
          proj.anchorId || (idx === 0 ? "works" : `project-${idx + 1}`);
        list.push({
          id: anchorId,
          label: idx === 0 ? "works" : undefined,
          targetId: anchorId,
          isProject: true,
        });
      });
    } else {
      list.push({
        id: "works",
        label: "works",
        targetId: "works",
        isProject: true,
      });
    }

    list.push({ id: "career", label: "career", targetId: "career" });
    list.push({ id: "about", label: "about", targetId: "about" });

    return list;
  }, [projects]);

  const frameCount = frames.length;

  const defaultFractions = useMemo(() => {
    return frames.map(() => 1 / frameCount);
  }, [frames, frameCount]);

  const defaultRatios = useMemo(() => {
    let cum = 0;
    return defaultFractions.map((_, idx) => {
      if (idx === 0) return 0;
      cum += defaultFractions[idx - 1];
      return cum;
    });
  }, [defaultFractions]);

  const [frameFractions, setFrameFractions] = useState<number[]>(defaultFractions);
  const [stationRatios, setStationRatios] = useState<number[]>(defaultRatios);
  const stationRatiosRef = useRef<number[]>(defaultRatios);

  const trackRef = useRef<HTMLDivElement>(null);
  const sectionScrollsRef = useRef<number[]>([]);

  // Dynamically measure the real scroll position and proportional height of each section
  const updateSectionScrolls = useCallback(() => {
    if (typeof window === "undefined") return;

    // Align sections exactly at 100px from the top of the viewport
    const topOffset = 100;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);

    const tops: number[] = [];

    frames.forEach((frame, i) => {
      if (i === 0 || frame.targetId === "top") {
        tops.push(0);
        return;
      }
      const el =
        document.getElementById(frame.targetId) ||
        (frame.targetId === "career" ? document.getElementById("experience") : null);
      if (el) {
        const rect = el.getBoundingClientRect();
        const absTop = Math.max(0, rect.top + window.scrollY);
        tops.push(absTop);
      } else {
        // Fallback proportional position if element not yet rendered
        tops.push((i / (frameCount - 1 || 1)) * docHeight);
      }
    });

    // Compute real height extent for each frame
    const extents: number[] = [];
    for (let i = 0; i < frameCount; i++) {
      if (i < frameCount - 1) {
        extents.push(Math.max(100, tops[i + 1] - tops[i]));
      } else {
        extents.push(Math.max(100, docHeight - tops[i]));
      }
    }

    const totalExtent = extents.reduce((sum, h) => sum + h, 0);
    const fractions = extents.map((h) => h / (totalExtent || 1));

    let cum = 0;
    const ratios = fractions.map((_, idx) => {
      if (idx === 0) return 0;
      cum += fractions[idx - 1];
      return cum;
    });

    stationRatiosRef.current = ratios;
    setFrameFractions(fractions);
    setStationRatios(ratios);

    const positions: number[] = tops.map((top, i) => {
      if (i === 0) return 0;
      return Math.min(maxScroll, Math.max(0, top - topOffset));
    });

    sectionScrollsRef.current = positions;
  }, [frames, frameCount]);

  // Map real scroll position to needle ratio on the tuner dial
  const scrollYToRatio = useCallback((scrollY: number): number => {
    const scrolls = sectionScrollsRef.current;
    if (!scrolls || scrolls.length < frameCount) return 0;

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);

    // Below or at Hero
    if (scrollY <= scrolls[0]) return 0;

    const currentRatios = stationRatiosRef.current;
    const lastIdx = frameCount - 1;

    // Past the last station (about) towards maximum scroll
    if (scrollY >= scrolls[lastIdx]) {
      const lastScroll = scrolls[lastIdx];
      const extraScrollRange = maxScroll - lastScroll;
      if (extraScrollRange <= 0) return currentRatios[lastIdx];
      const t = Math.min(1, Math.max(0, (scrollY - lastScroll) / extraScrollRange));
      return currentRatios[lastIdx] + t * (1 - currentRatios[lastIdx]);
    }

    // Interpolate between stations so each section aligns at 100px when needle reaches its station mark
    for (let i = 0; i < lastIdx; i++) {
      const s1 = scrolls[i];
      const s2 = scrolls[i + 1];
      if (scrollY >= s1 && scrollY <= s2) {
        const range = s2 - s1;
        const t = range > 0 ? (scrollY - s1) / range : 0;
        return currentRatios[i] + t * (currentRatios[i + 1] - currentRatios[i]);
      }
    }

    return 1;
  }, [frameCount]);

  // Map needle ratio on the tuner dial back to real scroll position
  const ratioToScrollY = useCallback((ratio: number): number => {
    const scrolls = sectionScrollsRef.current;
    if (!scrolls || scrolls.length < frameCount) return 0;

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);

    const r = Math.max(0, Math.min(1, ratio));
    const currentRatios = stationRatiosRef.current;
    const lastIdx = frameCount - 1;

    // Right of last station (about)
    if (r >= currentRatios[lastIdx]) {
      const remainingRatio = 1 - currentRatios[lastIdx];
      if (remainingRatio <= 0) return scrolls[lastIdx];
      const t = Math.min(1, Math.max(0, (r - currentRatios[lastIdx]) / remainingRatio));
      return scrolls[lastIdx] + t * (maxScroll - scrolls[lastIdx]);
    }

    // Between stations
    for (let i = 0; i < lastIdx; i++) {
      const r1 = currentRatios[i];
      const r2 = currentRatios[i + 1];
      if (r >= r1 && r <= r2) {
        const t = (r2 - r1 > 0) ? (r - r1) / (r2 - r1) : 0;
        return scrolls[i] + t * (scrolls[i + 1] - scrolls[i]);
      }
    }

    return scrolls[lastIdx];
  }, [frameCount]);

  // Synchronize needle with actual page scroll
  useEffect(() => {
    updateSectionScrolls();

    const handleScroll = () => {
      if (isDragging) return;

      const scrollY = window.scrollY;
      const ratio = scrollYToRatio(scrollY);
      setNeedleRatio(ratio);

      // Reveal top bar when index (Hero) leaves viewport
      const hero = document.getElementById("top");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        setIsVisible(rect.bottom < 120 || scrollY > scrollThreshold);
      } else {
        setIsVisible(scrollY > scrollThreshold);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateSectionScrolls, { passive: true });
    window.addEventListener("load", updateSectionScrolls);

    if (document.fonts) {
      document.fonts.ready.then(updateSectionScrolls);
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSectionScrolls();
    });
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateSectionScrolls);
      window.removeEventListener("load", updateSectionScrolls);
      resizeObserver.disconnect();
    };
  }, [isDragging, updateSectionScrolls, scrollYToRatio, scrollThreshold]);

  // When clicking a frame on the top bar
  const handleFrameClick = (frameIdx: number) => {
    const target = frames[frameIdx];
    if (!target) return;

    if (onStationChange) {
      onStationChange(target.id);
    }

    if (target.id === "index" || target.targetId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el =
      document.getElementById(target.targetId) ||
      (target.targetId === "career" ? document.getElementById("experience") : null);
    if (el) {
      const rect = el.getBoundingClientRect();
      const topOffset = 100;
      const targetScroll = Math.max(0, rect.top + window.scrollY - topOffset);
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  // Convert horizontal clientX drag coordinates directly to needle & page scroll
  const updateScrollFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const trackWidth = rect.width;
    if (trackWidth <= 0) return;

    const rawX = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(trackWidth, rawX));
    const ratio = clampedX / trackWidth;

    setNeedleRatio(ratio);

    const targetScrollY = ratioToScrollY(ratio);
    window.scrollTo({ top: targetScrollY, behavior: "auto" });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    updateScrollFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateScrollFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      } ${className}`}
      {...props}
    >
      <nav
        aria-label="Portfolio Radio Tuner Navigation"
        className="relative w-full overflow-hidden bg-surface select-none border-none px-[16px] pt-[6px] pb-[4px]"
      >
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex h-[47px] w-full cursor-pointer flex-col overflow-visible"
        >
          {/* Row 1: Calibration dots at dynamic station boundaries */}
          <div className="relative flex h-[6px] w-full items-center">
            {frames.map((frame, idx) => {
              if (idx === 0) return null;
              const boundaryRatio = stationRatios[idx] ?? (idx / frameCount);
              const dotPositionPercent = boundaryRatio * 100;

              return (
                <div
                  key={`dot-${frame.id}`}
                  style={{ left: `${dotPositionPercent}%` }}
                  className="pointer-events-none absolute top-0 -translate-x-1/2 h-[4px] w-[4px] bg-border-subtle"
                />
              );
            })}
          </div>

          {/* Row 2: Central Frames proportional to real page block heights */}
          <div className="relative flex h-[24px] w-full flex-row items-center gap-[2px]">
            {frames.map((frame, idx) => {
              const weight = frameFractions[idx] ?? (1 / frameCount);
              return (
                <div
                  key={frame.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrameClick(idx);
                  }}
                  style={{ flex: `${weight} 1 0%` }}
                  className="relative h-[24px] min-w-0 cursor-pointer bg-black/12 hover:bg-black/20 transition-colors duration-150"
                />
              );
            })}
          </div>

          {/* Row 3: Labels row proportional to dynamic frames */}
          <div className="relative flex h-[17px] w-full flex-row items-start gap-[2px] pt-[3px]">
            {frames.map((frame, idx) => {
              const weight = frameFractions[idx] ?? (1 / frameCount);
              if (!frame.label) {
                // Empty notch for subsequent project frames
                return (
                  <div
                    key={frame.id}
                    style={{ flex: `${weight} 1 0%` }}
                    className="min-w-0"
                  />
                );
              }

              const isActive =
                activeStation === frame.id ||
                (frame.id === "works" &&
                  (activeStation.startsWith("project") ||
                    activeStation === "works"));

              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrameClick(idx);
                  }}
                  style={{ flex: `${weight} 1 0%` }}
                  className="min-w-0 text-left cursor-pointer"
                >
                  <span
                    className={`font-stetica text-[10px] leading-[14px] font-medium uppercase select-none truncate block transition-colors duration-150 ${
                      isActive
                        ? "text-content-contrast"
                        : "text-content-primary hover:text-content-contrast"
                    }`}
                  >
                    {frame.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Radial Glow */}
          <div
            style={{
              left: `${needleRatio * 100}%`,
              transition: isDragging ? "none" : "left 0.05s ease-out",
            }}
            className="pointer-events-none absolute top-[-42px] -translate-x-1/2 z-10 w-[300px] h-[135px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,170,0,0.18)_0%,rgba(255,170,0,0.05)_50%,transparent_80%)] blur-[16px]"
          />

          {/* Tuner Needle */}
          <div
            style={{
              left: `${needleRatio * 100}%`,
              transition: isDragging ? "none" : "left 0.05s ease-out",
            }}
            className="pointer-events-auto absolute top-[-6px] h-[57px] w-[2px] -translate-x-1/2 z-20 cursor-ew-resize active:cursor-grabbing bg-signal-amber shadow-[0_0_4px_rgba(255,170,0,0.6)]"
          />
        </div>
      </nav>
    </header>
  );
};
