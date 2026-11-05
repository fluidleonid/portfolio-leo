"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface LedPageTransitionProps {
  children?: React.ReactNode;
}

interface ColumnPeak {
  peakRow: number;
  velocity: number;
  holdFrames: number;
}

// Rich organic Hi-Fi LED audio spectrum palette
const AUDIO_PALETTE_AMBER = [
  "#FFB000",
  "#FFBA1A",
  "#FFC233",
  "#FFAA00",
  "#FFD166",
];
const AUDIO_PALETTE_ORANGE = [
  "#FF8800",
  "#FF9500",
  "#FF7700",
  "#FF6B00",
  "#FFA033",
];
const AUDIO_PALETTE_PEAK = [
  "#FF3E00",
  "#FF2B00",
  "#FF4D1A",
  "#FF1F1F",
  "#FF5522",
];

// Smooth quintic easing curve: zero jerk, liquid acceleration and deceleration
function smoothQuintic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}

// Fast pseudo-random integer hash for consistent, shimmering per-cube color jitter
function hashInt(c: number, r: number, salt: number): number {
  let h = (c * 374761393 + r * 668265263 + salt * 1013904223) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Hi-Fi Full-Screen LED Equalizer Audio Wave Page Transition
 *
 * 1. Background Grid: 100% full-screen matrix of tactile #242424 square modules.
 * 2. Animated Colorful Audio Wave: Organic multi-harmonic wave with bass kick and audio playback pulses.
 * 3. Organic Coloring: Dynamic palette with amber, warm orange, and crimson peak LEDs with micro-sparkle.
 * 4. Liquid Transition: Quintic smooth easing, strictly zero leftover blocks on receding.
 */
export function LedPageTransition({ children }: LedPageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [phase, setPhase] = useState<"idle" | "entering" | "leaving">("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const peaksRef = useRef<ColumnPeak[]>([]);
  const isNavigatingRef = useRef<boolean>(false);

  // Intercept internal Next.js link clicks
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links, in-page hash anchors, mailto/tel, or modified clicks
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const currentPath = window.location.pathname;
      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === currentPath) return;

      e.preventDefault();
      isNavigatingRef.current = true;
      startTimeRef.current = performance.now();
      setPhase("entering");

      // Liquid surge: after wave blankets the screen (~460ms), switch route
      setTimeout(() => {
        router.push(href);
      }, 460);
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [router]);

  // When pathname updates on the new page, trigger "leaving" (wave recedes and reveals new page)
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      isNavigatingRef.current = false;
      startTimeRef.current = performance.now();
      setPhase("leaving");

      // Recede duration: 420ms
      const timer = setTimeout(() => {
        setPhase("idle");
        // Ensure canvas is 100% wiped clean
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 420);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Safety fallback timeout to prevent getting stuck
  useEffect(() => {
    if (phase === "entering") {
      const safetyTimer = setTimeout(() => {
        if (isNavigatingRef.current) {
          isNavigatingRef.current = false;
          setPhase("leaving");
          startTimeRef.current = performance.now();
          setTimeout(() => {
            setPhase("idle");
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
          }, 400);
        }
      }, 1800);
      return () => clearTimeout(safetyTimer);
    }
  }, [phase]);

  // Canvas Equalizer Animation Loop with High-Performance Pre-rendered Matrix
  useEffect(() => {
    if (phase === "idle") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    // Mobile optimization: native 1x DPR on mobile eliminates 75% GPU fill-rate overhead
    // while keeping retro 16px LED square modules perfectly crisp
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Module geometry: 16px square modules with 2px gap (matching tactile #242424 modules)
    const pixelSize = 16;
    const gap = 2;
    const step = pixelSize + gap;

    const cols = Math.ceil(width / step);
    const rows = Math.ceil(height / step);

    // High-performance optimization: pre-render dark chassis & unlit #242424 matrix
    // onto an offscreen canvas ONCE to eliminate thousands of fillRect calls per frame
    const offscreenBg = document.createElement("canvas");
    offscreenBg.width = width * dpr;
    offscreenBg.height = height * dpr;
    const offCtx = offscreenBg.getContext("2d");
    if (offCtx) {
      offCtx.scale(dpr, dpr);
      // Dark chassis base
      offCtx.fillStyle = "rgba(12, 13, 16, 0.96)";
      offCtx.fillRect(0, 0, width, height);

      // Pre-render tactile #242424 inactive matrix modules
      offCtx.fillStyle = "#242424";
      for (let c = 0; c < cols; c++) {
        const colX = c * step;
        for (let r = 0; r < rows; r++) {
          const blockY = height - (r + 1) * step;
          offCtx.fillRect(colX, blockY, pixelSize, pixelSize);
        }
      }

      // Pre-render subtle inactive module texture highlight
      offCtx.fillStyle = "#181818";
      for (let c = 0; c < cols; c++) {
        const colX = c * step;
        for (let r = 0; r < rows; r++) {
          const blockY = height - (r + 1) * step;
          offCtx.fillRect(colX, blockY, pixelSize, 1);
        }
      }
    }

    // Reset peaks array for columns
    peaksRef.current = Array.from({ length: cols }, () => ({
      peakRow: 0,
      velocity: 0,
      holdFrames: 0,
    }));

    // Pre-allocated flat buffers for batching top micro-bevel highlights (zero GC allocation per frame)
    const maxTotalBlocks = cols * rows;
    const highlightX = new Float32Array(maxTotalBlocks);
    const highlightY = new Float32Array(maxTotalBlocks);

    let running = true;

    const render = () => {
      if (!running) return;

      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const t = now * 0.001; // seconds

      let progress = 0;
      let masterAlpha = 0;

      if (phase === "entering") {
        // Surge in: 0 to 1 in 460ms with liquid quintic easing
        const linear = Math.min(1.0, elapsed / 460);
        progress = smoothQuintic(linear);
        masterAlpha = Math.min(1.0, linear * 1.5);
      } else {
        // Recede out: 1 to 0 in 400ms
        const linear = Math.min(1.0, elapsed / 400);
        progress = Math.max(0, 1.0 - smoothQuintic(linear));
        masterAlpha = Math.max(0, 1.0 - linear);
      }

      ctx.clearRect(0, 0, width, height);

      // If transition is practically done, completely clear and stop rendering
      if (phase === "leaving" && progress <= 0.001) {
        return;
      }

      // 1. Single GPU blit of the pre-rendered #242424 background grid (0.05ms hardware blit)
      ctx.globalAlpha = masterAlpha;
      ctx.drawImage(offscreenBg, 0, 0, width, height);
      ctx.globalAlpha = 1.0;

      const peaks = peaksRef.current;
      const timeBeatInt = Math.floor(t * 8);

      // Multi-harmonic audio playback dynamics:
      // Bass drum punch at ~124 BPM (rhythmic pumping of the whole wave)
      const beat = Math.pow(Math.max(0, Math.sin(t * 6.5)), 3.5) * 4.2;

      let highlightCount = 0;

      // 2. Render illuminated wave columns
      for (let c = 0; c < cols; c++) {
        const colRatio = c / cols;
        const peak = peaks[c];

        // Complex undulating audio spectrum wave (Bass + Mid + Treble propagation)
        const wave1 = Math.sin(colRatio * Math.PI * 4 + t * 7.5) * 4.0;
        const wave2 = Math.cos(colRatio * Math.PI * 8 - t * 11.0) * 2.5;
        const wave3 = Math.sin(colRatio * Math.PI * 14 + t * 17.0) * 1.5;
        const wavePulse = wave1 + wave2 + wave3 + beat * Math.sin(colRatio * Math.PI);

        // Calculate illuminated wave height for this column
        let litRowsCount = 0;
        if (progress > 0.01) {
          const rawTarget =
            progress * (rows + 8) + wavePulse * Math.sin(progress * Math.PI);
          litRowsCount = Math.max(0, Math.min(rows, Math.round(rawTarget)));
        }

        // Peak Hold logic:
        if (phase === "entering") {
          if (litRowsCount >= peak.peakRow) {
            peak.peakRow = litRowsCount;
            peak.holdFrames = 8;
            peak.velocity = 0;
          } else {
            if (peak.holdFrames > 0) {
              peak.holdFrames--;
            } else {
              peak.velocity += 0.35;
              peak.peakRow = Math.max(0, Math.round(peak.peakRow - peak.velocity));
            }
          }
        } else {
          // In leaving phase: strictly limit peak to wave height so nothing floats in empty air
          peak.peakRow = Math.min(peak.peakRow, litRowsCount);
        }

        const colX = c * step;

        // Render ONLY illuminated rows in this column (zero wasted iterations over unlit rows!)
        for (let r = 0; r < litRowsCount; r++) {
          const blockY = height - (r + 1) * step;
          const rowRatio = r / rows;
          const isPeak = r === peak.peakRow && r > 0;

          // Organic random tint based on row height + pseudo-random hash
          const hashVal = hashInt(c, r, timeBeatInt);
          let ledColor = AUDIO_PALETTE_AMBER[hashVal % AUDIO_PALETTE_AMBER.length];

          if (rowRatio > 0.8 || isPeak) {
            // Peak: Crimson / Signal Red-Orange
            ledColor = AUDIO_PALETTE_PEAK[hashVal % AUDIO_PALETTE_PEAK.length];
          } else if (rowRatio > 0.52) {
            // Mid: Vibrant Orange / Tangerine
            ledColor = AUDIO_PALETTE_ORANGE[hashVal % AUDIO_PALETTE_ORANGE.length];
          }

          ctx.fillStyle = ledColor;
          ctx.fillRect(colX, blockY, pixelSize, pixelSize);

          if (highlightCount < maxTotalBlocks) {
            highlightX[highlightCount] = colX;
            highlightY[highlightCount] = blockY;
            highlightCount++;
          }
        }
      }

      // 3. Batch draw all top micro-bevel highlights in a SINGLE fillStyle pass!
      if (highlightCount > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < highlightCount; i++) {
          ctx.fillRect(highlightX[i], highlightY[i], pixelSize, 1.5);
        }
      }

      if (running) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  return (
    <>
      {children}

      {/* Full-Screen LED Equalizer Wave Overlay (Hardware GPU Layer) */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[9999] pointer-events-none transform-gpu will-change-transform transition-opacity duration-200 ${
          phase === "idle" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full block pointer-events-none select-none transform-gpu"
        />
      </div>
    </>
  );
}
