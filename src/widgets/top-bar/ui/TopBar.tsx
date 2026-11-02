"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { tokens } from "@/shared/config";

export interface TunerFrame {
  id: string;
  label?: string;
  targetId: string;
  isProject?: boolean;
}

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active station or section id */
  activeStation?: string;
  /** Navigation callback */
  onStationChange?: (station: string) => void;
  /** Scroll threshold to reveal top bar in px (default: 200) */
  scrollThreshold?: number;
}

// Exactly 9 Frames 1:1 from Figma Node `Header (Portfolio) (98:1373)`:
// index -> works (Project 1) -> 5 additional projects without labels -> experience -> about
const FRAMES: TunerFrame[] = [
  { id: "index", label: "index", targetId: "top" },
  { id: "works", label: "works", targetId: "works", isProject: true },
  { id: "project-2", targetId: "project-2", isProject: true },
  { id: "project-3", targetId: "project-3", isProject: true },
  { id: "project-4", targetId: "project-4", isProject: true },
  { id: "project-5", targetId: "project-5", isProject: true },
  { id: "project-6", targetId: "project-6", isProject: true },
  { id: "career", label: "career", targetId: "career" },
  { id: "about", label: "about", targetId: "about" },
];

const FRAME_COUNT = FRAMES.length; // 9
// Station anchor ratio of each frame on the tuner dial: exactly aligns section arrival with frame start
const STATION_RATIOS = FRAMES.map((_, i) => i / FRAME_COUNT);

export const TopBar: React.FC<TopBarProps> = ({
  activeStation = "index",
  onStationChange,
  scrollThreshold = 200,
  className = "",
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [needleRatio, setNeedleRatio] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const sectionScrollsRef = useRef<number[]>([]);

  // Dynamically measure the real scroll position corresponding to each marker/section
  const updateSectionScrolls = useCallback(() => {
    if (typeof window === "undefined") return;

    // Align sections exactly at 100px from the top of the viewport
    const topOffset = 100;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);

    const positions: number[] = [];

    FRAMES.forEach((frame, i) => {
      if (i === 0 || frame.targetId === "top") {
        positions.push(0);
        return;
      }
      const el =
        document.getElementById(frame.targetId) ||
        (frame.targetId === "career" ? document.getElementById("experience") : null);
      if (el) {
        const rect = el.getBoundingClientRect();
        const absTop = rect.top + window.scrollY;
        const targetScroll = Math.min(maxScroll, Math.max(0, absTop - topOffset));
        positions.push(targetScroll);
      } else {
        // Fallback proportional position if element not yet rendered
        positions.push((i / (FRAME_COUNT - 1)) * maxScroll);
      }
    });

    sectionScrollsRef.current = positions;
  }, []);

  // Map real scroll position to needle ratio on the tuner dial:
  // Each station i arrives at 100px from viewport top when needle reaches STATION_RATIOS[i] = i / 9
  const scrollYToRatio = useCallback((scrollY: number): number => {
    const scrolls = sectionScrollsRef.current;
    if (!scrolls || scrolls.length < FRAME_COUNT) return 0;

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);

    // Below or at Hero
    if (scrollY <= scrolls[0]) return 0;

    // Past the last station (about) towards maximum scroll
    const lastIdx = FRAME_COUNT - 1;
    if (scrollY >= scrolls[lastIdx]) {
      const lastScroll = scrolls[lastIdx];
      const extraScrollRange = maxScroll - lastScroll;
      if (extraScrollRange <= 0) return STATION_RATIOS[lastIdx];
      const t = Math.min(1, Math.max(0, (scrollY - lastScroll) / extraScrollRange));
      return STATION_RATIOS[lastIdx] + t * (1 - STATION_RATIOS[lastIdx]);
    }

    // Interpolate between stations so each section aligns at 100px when needle reaches its station mark
    for (let i = 0; i < lastIdx; i++) {
      const s1 = scrolls[i];
      const s2 = scrolls[i + 1];
      if (scrollY >= s1 && scrollY <= s2) {
        const range = s2 - s1;
        const t = range > 0 ? (scrollY - s1) / range : 0;
        return STATION_RATIOS[i] + t * (STATION_RATIOS[i + 1] - STATION_RATIOS[i]);
      }
    }

    return 1;
  }, []);

  // Map needle ratio on the tuner dial back to real scroll position
  const ratioToScrollY = useCallback((ratio: number): number => {
    const scrolls = sectionScrollsRef.current;
    if (!scrolls || scrolls.length < FRAME_COUNT) return 0;

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - winHeight);

    const r = Math.max(0, Math.min(1, ratio));

    // Right of last station (about)
    const lastIdx = FRAME_COUNT - 1;
    if (r >= STATION_RATIOS[lastIdx]) {
      const remainingRatio = 1 - STATION_RATIOS[lastIdx];
      if (remainingRatio <= 0) return scrolls[lastIdx];
      const t = Math.min(1, Math.max(0, (r - STATION_RATIOS[lastIdx]) / remainingRatio));
      return scrolls[lastIdx] + t * (maxScroll - scrolls[lastIdx]);
    }

    // Between stations
    for (let i = 0; i < lastIdx; i++) {
      const r1 = STATION_RATIOS[i];
      const r2 = STATION_RATIOS[i + 1];
      if (r >= r1 && r <= r2) {
        const t = (r2 - r1 > 0) ? (r - r1) / (r2 - r1) : 0;
        return scrolls[i] + t * (scrolls[i + 1] - scrolls[i]);
      }
    }

    return scrolls[lastIdx];
  }, []);

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
  }, [scrollThreshold, isDragging, updateSectionScrolls, scrollYToRatio]);

  // Navigate to target section smoothly when clicking a frame/label
  const handleFrameClick = useCallback(
    (frameIndex: number) => {
      updateSectionScrolls();
      const frame = FRAMES[frameIndex];
      onStationChange?.(frame.id);

      const scrolls = sectionScrollsRef.current;
      const targetScroll = scrolls[frameIndex] ?? 0;

      if (typeof window !== "undefined") {
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    },
    [onStationChange, updateSectionScrolls]
  );

  // Dragging logic: smooth continuous scrubbing of page scroll mapped to real sections
  const updateScrollFromClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relativeX / rect.width));
      setNeedleRatio(ratio);

      const targetScrollY = ratioToScrollY(ratio);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: targetScrollY, behavior: "instant" as ScrollBehavior });
      }
    },
    [ratioToScrollY]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    updateSectionScrolls();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
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
      {/* 
        1:1 Figma Node `Header (Portfolio) (98:1373)` / `Navigation - Portfolio Radio Tuner Navigation (98:1374)`
        - Dimensions: 100% width, height 57px
        - Padding: px-[8px] pt-[6px] pb-[4px]
        - Background: SOLID #242424 (op: 1) -> bg-surface
        - Border: none, Shadow: none (flush with surface per user request)
        - CLIPPING: overflow-hidden clips the internal radial glow cleanly inside the 57px bar
      */}
      <nav
        aria-label="Portfolio Radio Tuner Navigation"
        className="relative w-full overflow-hidden bg-surface select-none border-none px-[16px] pt-[6px] pb-[4px]"
      >
        {/* Container (98:1375): height 47px */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex h-[47px] w-full cursor-pointer flex-col overflow-visible"
        >
          {/* Row 1: Container (98:1376) - Upper dots row (height 6px): 8 dots sitting between the 9 frames (Figma: SOLID #484848) */}
          <div className="relative flex h-[6px] w-full items-center">
            {FRAMES.map((frame, idx) => {
              if (idx === 0) return null; // No dot before the first frame (index)

              // Exact dot position centered in the 2px gap between frame[idx - 1] and frame[idx]
              const dotPositionPercent = (idx / FRAME_COUNT) * 100;

              return (
                <div
                  key={`dot-${frame.id}`}
                  style={{ left: `${dotPositionPercent}%` }}
                  className="pointer-events-none absolute top-0 -translate-x-1/2 h-[4px] w-[4px] bg-border-subtle"
                />
              );
            })}
          </div>

          {/* Row 2: Container (98:1385) - 9 Central Frames (height 24px, Figma: SOLID #000000 op: 0.12, gap 2px) */}
          <div className="relative flex h-[24px] w-full flex-row items-center gap-[2px]">
            {FRAMES.map((frame, idx) => {
              return (
                <div
                  key={frame.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrameClick(idx);
                  }}
                  className="relative h-[24px] flex-1 cursor-pointer bg-black/12 hover:bg-black/20 transition-colors duration-150"
                />
              );
            })}
          </div>

          {/* Row 3: Container (98:1395) - Labels row (height 17px, Figma: 10px Medium AA Stetica, SOLID #cccccc op: 1) */}
          <div className="relative flex h-[17px] w-full flex-row items-start gap-[2px] pt-[3px]">
            {FRAMES.map((frame, idx) => {
              if (!frame.label) {
                // Empty container (98:1403-1407) under project frames 2..6 (no labels)
                return <div key={frame.id} className="flex-1" />;
              }

              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrameClick(idx);
                  }}
                  className="flex-1 text-left cursor-pointer"
                >
                  <span className="font-stetica text-[10px] leading-[14px] font-medium uppercase text-content-primary select-none truncate block hover:text-content-contrast transition-colors duration-150">
                    {frame.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 
            Figma Node `Container (98:1415)`: Radial Glow
            - Dimensions: width 300px, height 135px, y = -42px
            - Stops 1:1 from Figma:
              rgba(255, 170, 0, 0.18) @ 0% -> rgba(255, 170, 0, 0.05) @ 50% -> transparent @ 80%
            - Layer Blur: radius 16px (blur-[16px])
            - Contained cleanly inside nav via overflow-hidden
          */}
          <div
            style={{
              left: `${needleRatio * 100}%`,
              transition: isDragging ? "none" : "left 0.05s ease-out",
            }}
            className="pointer-events-none absolute top-[-42px] -translate-x-1/2 z-10 w-[300px] h-[135px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,170,0,0.18)_0%,rgba(255,170,0,0.05)_50%,transparent_80%)] blur-[16px]"
          />

          {/* 
            Figma Node `Container (98:1416)`: Needle / Grabber
            - Dimensions: width 2px, height 57px (full height of the 57px navigation bar)
            - Position: y = -6px (top-[-6px] to cover full 57px height flush)
            - Drop Shadow 1:1 from Figma: radius 4px, color rgba(255, 170, 0, 0.6)
            - Color: solid #FFAA00 (signalAmber)
          */}
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
