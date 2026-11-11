"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

export interface TunerFrame {
  id: string;
  label?: string;
  targetId: string;
  sectionId?: string;
  isProject?: boolean;
}

export interface ProjectItemRef {
  id?: string | number;
  anchorId?: string;
  title?: string;
}

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unified page structure / stations list (for Case Study, custom pages, or explicit stations) */
  stations?: TunerFrame[];
  /** Optional projects list (auto-generates standard Main Page structure: index -> works -> career -> about) */
  projects?: ProjectItemRef[];
  /** Active station or section id */
  activeStation?: string;
  /** Navigation callback when station changes via click, scroll, or drag */
  onStationChange?: (station: string) => void;
  /** Inactivity delay before top bar hides (default: 1200ms) */
  hideDelay?: number;
}

/**
 * Universal Tactile Radio Tuner TopBar Component
 *
 * Single unified component for all pages (Home Page, Case Studies, Sub-pages):
 * 1. Accepts either unified `stations` directly or `projects` to generate home page frames.
 * 2. Ultra-smooth, zero-lag dragging on mobile touch devices (touch-action: none + global pointer tracking).
 * 3. Smooth dragging & scrubbing on desktop with instantaneous needle & glow response.
 * 4. Eliminates pointer-scroll jitter by guarding against scroll feedback during active drag.
 * 5. Hardware auto-hide: visible during active motion, disappears after motion ceases (default 1200ms),
 *    and immediately vanishes at the very top of the page (scrollY <= 10).
 */
export const TopBar: React.FC<TopBarProps> = ({
  stations,
  projects,
  activeStation,
  onStationChange,
  hideDelay = 1200,
  className = "",
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [needleRatio, setNeedleRatio] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafScrollRef = useRef<number | null>(null);

  // Unified page structure resolution
  const frames = useMemo<TunerFrame[]>(() => {
    if (stations && stations.length > 0) {
      return stations;
    }

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
  }, [stations, projects]);

  const frameCount = frames.length;

  const defaultFractions = useMemo(() => {
    return frames.map(() => 1 / Math.max(1, frameCount));
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
  const sectionScrollsRef = useRef<number[]>([]);

  // Shows top bar during active motion (scroll, mouse move, drag) and hides with a delay after motion ceases
  const triggerActivity = useCallback(
    (delay = hideDelay) => {
      setIsVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setIsVisible(false);
        }
      }, delay);
    },
    [hideDelay]
  );

  // Dynamically measure the real scroll position and proportional extent of each section in the DOM
  const updateSectionScrolls = useCallback(() => {
    if (typeof window === "undefined") return;

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
        tops.push((i / Math.max(1, frameCount - 1)) * docHeight);
      }
    });

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
  const scrollYToRatio = useCallback(
    (scrollY: number): number => {
      const scrolls = sectionScrollsRef.current;
      if (!scrolls || scrolls.length < frameCount) return 0;

      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(0, docHeight - winHeight);

      if (scrollY <= scrolls[0]) return 0;

      const currentRatios = stationRatiosRef.current;
      const lastIdx = frameCount - 1;

      if (scrollY >= scrolls[lastIdx]) {
        const lastScroll = scrolls[lastIdx];
        const extraScrollRange = maxScroll - lastScroll;
        if (extraScrollRange <= 0) return currentRatios[lastIdx];
        const t = Math.min(1, Math.max(0, (scrollY - lastScroll) / extraScrollRange));
        return currentRatios[lastIdx] + t * (1 - currentRatios[lastIdx]);
      }

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
    },
    [frameCount]
  );

  // Map needle ratio on the tuner dial back to real scroll position
  const ratioToScrollY = useCallback(
    (ratio: number): number => {
      const scrolls = sectionScrollsRef.current;
      if (!scrolls || scrolls.length < frameCount) return 0;

      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(0, docHeight - winHeight);

      const r = Math.max(0, Math.min(1, ratio));
      const currentRatios = stationRatiosRef.current;
      const lastIdx = frameCount - 1;

      if (r >= currentRatios[lastIdx]) {
        const remainingRatio = 1 - currentRatios[lastIdx];
        if (remainingRatio <= 0) return scrolls[lastIdx];
        const t = Math.min(1, Math.max(0, (r - currentRatios[lastIdx]) / remainingRatio));
        return scrolls[lastIdx] + t * (maxScroll - scrolls[lastIdx]);
      }

      for (let i = 0; i < lastIdx; i++) {
        const r1 = currentRatios[i];
        const r2 = currentRatios[i + 1];
        if (r >= r1 && r <= r2) {
          const t = r2 - r1 > 0 ? (r - r1) / (r2 - r1) : 0;
          return scrolls[i] + t * (scrolls[i + 1] - scrolls[i]);
        }
      }

      return scrolls[lastIdx];
    },
    [frameCount]
  );

  // Page scroll listener: drives needle position ONLY when not actively dragging
  useEffect(() => {
    updateSectionScrolls();

    const handleScroll = () => {
      // While dragging, drag pointer coordinates drive the needle strictly with zero scroll-event interference
      if (isDraggingRef.current) return;

      const scrollY = window.scrollY;

      // When hitting the very top of the page, immediately disappear without delay
      if (scrollY <= 10) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        setIsVisible(false);
        setNeedleRatio(0);
        return;
      }

      const ratio = scrollYToRatio(scrollY);
      setNeedleRatio(ratio);
      triggerActivity();
    };

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
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateSectionScrolls);
      window.removeEventListener("load", updateSectionScrolls);
      resizeObserver.disconnect();
    };
  }, [updateSectionScrolls, scrollYToRatio, triggerActivity]);

  // Convert horizontal clientX pointer coordinate smoothly into needle ratio & throttled scroll position
  const updateFromPointerX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      if (trackWidth <= 0) return;

      const rawX = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(trackWidth, rawX));
      const ratio = clampedX / trackWidth;

      // 1. Instantaneous needle & glow update for 0ms input latency on mobile touch & desktop pointer
      setNeedleRatio(ratio);

      // 2. Synchronize active station label highlight
      if (onStationChange && frames.length > 0) {
        const ratios = stationRatiosRef.current;
        let closestIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < frames.length; i++) {
          const stationMark = ratios[i] ?? (i / Math.max(1, frames.length - 1));
          const diff = Math.abs(stationMark - ratio);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
        if (frames[closestIdx]) {
          onStationChange(frames[closestIdx].id);
        }
      }

      // 3. RAF-throttled scroll dispatch: prevents 120Hz/240Hz touch sampling from bogging down the main thread
      if (rafScrollRef.current) {
        cancelAnimationFrame(rafScrollRef.current);
      }
      rafScrollRef.current = requestAnimationFrame(() => {
        const targetScrollY = ratioToScrollY(ratio);
        window.scrollTo({ top: targetScrollY, behavior: "auto" });
      });
    },
    [frames, onStationChange, ratioToScrollY]
  );

  // Global window pointer listeners active only during drag: prevents dropped touches if finger strays outside track
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      updateFromPointerX(e.clientX);
    };

    const handleGlobalPointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      if (rafScrollRef.current) {
        cancelAnimationFrame(rafScrollRef.current);
        rafScrollRef.current = null;
      }
      triggerActivity();
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [isDragging, updateFromPointerX, triggerActivity]);

  // Pointer down initiation on the track or needle
  const handlePointerDown = (e: React.PointerEvent) => {
    // Left-click / touch only
    if (e.button !== 0 && e.pointerType === "mouse") return;

    isDraggingRef.current = true;
    setIsDragging(true);
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture not supported
    }

    updateFromPointerX(e.clientX);
  };

  // Click on a specific station frame or label
  const handleFrameClick = (frameIdx: number) => {
    const target = frames[frameIdx];
    if (!target) return;

    triggerActivity(1500);

    if (onStationChange) {
      onStationChange(target.id);
    }

    if (target.id === "index" || target.targetId === "top") {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setIsVisible(false);
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

  const currentActiveStation =
    activeStation ?? (stations && stations.length > 0 ? stations[0].id : "index");

  return (
    <header
      onMouseEnter={() => triggerActivity()}
      onMouseMove={() => triggerActivity()}
      onMouseLeave={() => triggerActivity(600)}
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-out select-none touch-none ${
        isVisible || isDragging
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      } ${className}`}
      {...props}
    >
      <nav
        aria-label="Portfolio Radio Tuner Navigation"
        className="relative w-full overflow-hidden bg-surface select-none border-none px-[16px] pt-[6px] pb-[4px] touch-none"
        style={{ touchAction: "none" }}
      >
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          className="relative flex h-[47px] w-full cursor-ew-resize flex-col overflow-visible select-none touch-none"
          style={{ touchAction: "none" }}
        >
          {/* Row 1: Calibration dots at dynamic station boundaries */}
          <div className="relative flex h-[6px] w-full items-center pointer-events-none select-none">
            {frames.map((frame, idx) => {
              if (idx === 0) return null;
              const boundaryRatio = stationRatios[idx] ?? (idx / frameCount);
              const dotPositionPercent = boundaryRatio * 100;

              return (
                <div
                  key={`dot-${frame.id}`}
                  style={{ left: `${dotPositionPercent}%` }}
                  className="pointer-events-none absolute top-0 -translate-x-1/2 h-[4px] w-[4px] bg-border-subtle select-none"
                />
              );
            })}
          </div>

          {/* Row 2: Central Frames proportional to real page block heights */}
          <div className="relative flex h-[24px] w-full flex-row items-center gap-[2px] select-none">
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
                  className="relative h-[24px] min-w-0 cursor-pointer bg-black/12 hover:bg-black/20 transition-colors duration-150 select-none"
                />
              );
            })}
          </div>

          {/* Row 3: Labels row with dynamic extent relative to adjacent anchors */}
          <div className="relative h-[17px] w-full select-none">
            {frames.map((frame, idx) => {
              if (!frame.label) return null;

              // Find the next frame that has a label
              let nextLabeledIdx = -1;
              for (let j = idx + 1; j < frameCount; j++) {
                if (frames[j].label) {
                  nextLabeledIdx = j;
                  break;
                }
              }

              const leftRatio = stationRatios[idx] ?? (idx / frameCount);
              const leftPercent = leftRatio * 100;

              let maxWidthStyle: string;
              if (nextLabeledIdx !== -1) {
                const nextRatio = stationRatios[nextLabeledIdx] ?? (nextLabeledIdx / frameCount);
                const spanPercent = Math.max(0, (nextRatio - leftRatio) * 100);
                // Keep the exact same gap between anchors as between segments (2px)
                maxWidthStyle = `calc(${spanPercent}% - 2px)`;
              } else {
                // Last labeled anchor: expands to the container/screen boundary
                const remainingPercent = Math.max(0, (1 - leftRatio) * 100);
                maxWidthStyle = `${remainingPercent}%`;
              }

              const activeFrame = frames.find((f) => f.id === currentActiveStation);
              const activeSectionId = activeFrame?.sectionId || currentActiveStation;

              const isActive =
                currentActiveStation === frame.id ||
                frame.id === activeSectionId ||
                (!stations &&
                  frame.id === "works" &&
                  (currentActiveStation.startsWith("project") ||
                    currentActiveStation === "works"));

              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFrameClick(idx);
                  }}
                  style={{
                    left: `${leftPercent}%`,
                    maxWidth: maxWidthStyle,
                  }}
                  className="absolute top-0 pt-[3px] text-left cursor-pointer select-none"
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

          {/* Radial Amber Glow: instantaneous 0ms tracking during drag, smooth easing during scroll */}
          <div
            style={{
              left: `${needleRatio * 100}%`,
              transition: isDragging ? "none" : "left 0.08s ease-out",
            }}
            className="pointer-events-none absolute top-[-42px] -translate-x-1/2 z-10 w-[300px] h-[135px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,170,0,0.18)_0%,rgba(255,170,0,0.05)_50%,transparent_80%)] blur-[16px] select-none"
          />

          {/* Tuner Needle with generous 36px touch hit area for effortless mobile drag */}
          <div
            style={{
              left: `${needleRatio * 100}%`,
              transition: isDragging ? "none" : "left 0.08s ease-out",
            }}
            className="pointer-events-auto absolute top-[-10px] bottom-[-10px] w-[36px] -translate-x-1/2 z-20 flex items-center justify-center cursor-ew-resize active:cursor-grabbing touch-none select-none"
          >
            <div className="h-[57px] w-[2px] bg-signal-amber shadow-[0_0_4px_rgba(255,170,0,0.6)] pointer-events-none select-none" />
          </div>
        </div>
      </nav>
    </header>
  );
};
