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

  // Canvas Equalizer Animation Loop
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Module geometry: 16px square modules with 2px gap (matching tactile #242424 modules)
    const isMobile = width < 640;
    const pixelSize = isMobile ? 12 : 16;
    const gap = 2;
    const step = pixelSize + gap;

    const cols = Math.ceil(width / step);
    const rows = Math.ceil(height / step);

    // Reset peaks array for columns
    peaksRef.current = Array.from({ length: cols }, () => ({
      peakRow: 0,
      velocity: 0,
      holdFrames: 0,
    }));

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

      // 1. Dark chassis underlay that covers the page
      ctx.fillStyle = `rgba(12, 13, 16, ${0.94 * masterAlpha})`;
      ctx.fillRect(0, 0, width, height);

      const peaks = peaksRef.current;
      const timeBeatInt = Math.floor(t * 8);

      // Multi-harmonic audio playback dynamics:
      // Bass drum punch at ~124 BPM (rhythmic pumping of the whole wave)
      const beat = Math.pow(Math.max(0, Math.sin(t * 6.5)), 3.5) * 4.2;

      // 2. Render all columns of the LED grid from bottom to top
      for (let c = 0; c < cols; c++) {
        const colRatio = c / cols;
        const peak = peaks[c];

        // Complex undulating audio spectrum wave (Bass + Mid + Treble propagation)
        const wave1 = Math.sin(colRatio * Math.PI * 4 + t * 7.5) * 4.0;
        const wave2 = Math.cos(colRatio * Math.PI * 8 - t * 11.0) * 2.5;
        const wave3 = Math.sin(colRatio * Math.PI * 14 + t * 17.0) * 1.5;
        const wavePulse = wave1 + wave2 + wave3 + beat * Math.sin(colRatio * Math.PI);

        // Calculate illuminated wave height for this column
        // When progress = 1: targetRows reaches rows + 8, fully submerging the screen
        // When progress = 0: strictly 0
        let litRowsCount = 0;
        if (progress > 0.01) {
          const rawTarget =
            progress * (rows + 8) + wavePulse * Math.sin(progress * Math.PI);
          litRowsCount = Math.max(0, Math.min(rows, Math.round(rawTarget)));
        }

        // Peak Hold logic:
        // When entering, peaks rise with the wave.
        // When leaving, peaks strictly follow the wave downwards so ZERO cubes ever linger!
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

        // Render vertical column
        for (let r = 0; r < rows; r++) {
          const blockY = height - (r + 1) * step;
          const isLit = r < litRowsCount;
          const isPeak =
            phase === "entering" && r === peak.peakRow && r > 0 && r < rows;

          if (isLit || isPeak) {
            // Illuminated Audio Wave LED Cube:
            // Organic random tint based on row height + pseudo-random hash
            const rowRatio = r / rows;
            const hashVal = hashInt(c, r, timeBeatInt);

            let ledColor = AUDIO_PALETTE_AMBER[hashVal % AUDIO_PALETTE_AMBER.length];

            if (rowRatio > 0.8 || isPeak) {
              // Peak: Crimson / Signal Red-Orange
              ledColor = AUDIO_PALETTE_PEAK[hashVal % AUDIO_PALETTE_PEAK.length];
            } else if (rowRatio > 0.52) {
              // Mid: Vibrant Orange / Tangerine
              ledColor = AUDIO_PALETTE_ORANGE[hashVal % AUDIO_PALETTE_ORANGE.length];
            }

            // Draw vibrant illuminated LED square
            ctx.fillStyle = ledColor;
            ctx.fillRect(colX, blockY, pixelSize, pixelSize);

            // Tactile top micro-bevel highlight (3D tactile feel)
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.fillRect(colX, blockY, pixelSize, 1.5);
          } else {
            // Unlit Background Cube: Strictly #242424 with master alpha
            ctx.fillStyle = `rgba(36, 36, 36, ${0.88 * masterAlpha})`;
            ctx.fillRect(colX, blockY, pixelSize, pixelSize);

            // Subtle inactive matrix texture
            ctx.fillStyle = `rgba(18, 18, 18, ${0.45 * masterAlpha})`;
            ctx.fillRect(colX, blockY, pixelSize, 1);
          }
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

      {/* Full-Screen LED Equalizer Wave Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-200 ${
          phase === "idle" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full block pointer-events-none select-none"
        />
      </div>
    </>
  );
}
