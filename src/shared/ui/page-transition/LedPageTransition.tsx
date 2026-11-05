"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface LedPageTransitionProps {
  children?: React.ReactNode;
}

interface EqualizerBand {
  currentHeight: number; // 0 to 1
  targetHeight: number;
  peakHeight: number; // 0 to 1
  peakHoldTime: number; // frames left to hold peak
  velocity: number;
}

/**
 * Hi-Fi Stereo LED Spectrum Analyzer Page Transition
 *
 * Simulates a vintage Hi-Fi graphic equalizer / player visualizer constructed
 * from square amber/orange/red LED blocks.
 *
 * Phases:
 * 1. "entering": Triggered on internal page link click. Spectrum analyzer surges with
 *    high-energy bouncing LED columns and peak meters (~300ms).
 * 2. Next.js router switches route.
 * 3. "leaving": When pathname updates, levels decay with authentic logarithmic falloff (~250ms).
 * 4. "idle": Hidden and inactive.
 */
export function LedPageTransition({ children }: LedPageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [phase, setPhase] = useState<"idle" | "entering" | "leaving">("idle");
  const [targetLabel, setTargetLabel] = useState<string>("CASE STUDY");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const bandsRef = useRef<EqualizerBand[]>([]);

  // Intercept all internal Next.js link clicks to trigger the visualizer
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links, in-page hash links, mailto/tel, or modified clicks
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

      // Check if target is a different route
      const currentPath = window.location.pathname;
      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === currentPath) return;

      // Determine label based on destination
      let label = "INITIALIZING";
      if (targetPath.startsWith("/case/")) {
        const slug = targetPath.replace("/case/", "");
        label = `TAPE // ${slug.toUpperCase().replace(/-/g, " ")}`;
      } else if (targetPath === "/") {
        label = "DECK // MAIN INDEX";
      } else {
        label = `ROUTE // ${targetPath.toUpperCase()}`;
      }

      e.preventDefault();
      setTargetLabel(label);
      setPhase("entering");
      startTimeRef.current = performance.now();

      // Navigate after quick high-energy audio burst
      setTimeout(() => {
        router.push(href);
      }, 320);
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [router]);

  // When pathname changes, transition to "leaving" phase
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (phase === "entering") {
        setPhase("leaving");
        startTimeRef.current = performance.now();
        const timer = setTimeout(() => {
          setPhase("idle");
        }, 280);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, phase]);

  // Canvas Equalizer Animation Loop
  useEffect(() => {
    if (phase === "idle") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to viewport with devicePixelRatio
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Number of frequency bands based on screen width
    const isMobile = width < 640;
    const numBands = isMobile ? 18 : 28;
    const numRows = isMobile ? 14 : 18;

    // Initialize bands if empty or resized
    if (bandsRef.current.length !== numBands) {
      bandsRef.current = Array.from({ length: numBands }, (_, i) => ({
        currentHeight: 0.1 + Math.random() * 0.2,
        targetHeight: 0.2,
        peakHeight: 0.2,
        peakHoldTime: 0,
        velocity: 0,
      }));
    }

    let running = true;
    let frame = 0;

    const render = (time: number) => {
      if (!running) return;
      frame++;

      const elapsed = time - startTimeRef.current;
      const isEntering = phase === "entering";

      // Calculate master amplitude envelope
      // In "entering": rapidly ramps from 0 to 1 within 180ms
      // In "leaving": smoothly decays from 1 to 0 within 260ms
      let masterGain = 1.0;
      if (isEntering) {
        masterGain = Math.min(1.0, elapsed / 180);
      } else {
        masterGain = Math.max(0, 1.0 - elapsed / 260);
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Semi-translucent dark background with subtle blur
      ctx.fillStyle = `rgba(12, 13, 16, ${0.92 * masterGain})`;
      ctx.fillRect(0, 0, width, height);

      // 2. Equalizer geometry calculation
      // Display in a center-aligned rack container
      const maxEqualizerWidth = Math.min(width - 32, 600);
      const blockSize = isMobile ? 10 : 14;
      const gap = isMobile ? 2 : 2.5;

      const totalBandWidth = maxEqualizerWidth / numBands;
      const cellWidth = Math.max(blockSize, totalBandWidth - gap);
      const cellHeight = isMobile ? 8 : 10;
      const rowGap = 2;

      const equalizerHeight = numRows * (cellHeight + rowGap);
      const startX = (width - numBands * (cellWidth + gap)) / 2;
      const startY = (height - equalizerHeight) / 2;

      // 3. Audio spectrum synthesis (procedural music energy)
      const bands = bandsRef.current;
      for (let i = 0; i < numBands; i++) {
        const band = bands[i];

        // Harmonic simulation: bass kick (low i) + mid snare sweeps + high hi-hat sparkle
        const bassFreq = Math.sin(time * 0.009) * 0.4 + 0.5;
        const midFreq = Math.sin(time * 0.015 + i * 0.4) * 0.35 + 0.45;
        const trebleFreq = Math.cos(time * 0.022 - i * 0.3) * 0.3 + 0.4;

        // Weight across spectrum: bass heavier on left, sparkle on right
        const freqWeight =
          i < numBands * 0.3
            ? bassFreq * 1.2
            : i < numBands * 0.7
            ? midFreq
            : trebleFreq * 0.9;

        const jitter = (Math.random() - 0.5) * 0.25;
        const target = Math.max(
          0.05,
          Math.min(0.98, (freqWeight + jitter) * masterGain)
        );

        // Smooth physics-based tracking
        band.currentHeight += (target - band.currentHeight) * 0.35;

        // Peak Hold logic (LED dot that drops with simulated gravity)
        if (band.currentHeight >= band.peakHeight) {
          band.peakHeight = band.currentHeight;
          band.peakHoldTime = 12; // hold for 12 frames
          band.velocity = 0;
        } else {
          if (band.peakHoldTime > 0) {
            band.peakHoldTime--;
          } else {
            band.velocity += 0.002; // gravity acceleration
            band.peakHeight = Math.max(0, band.peakHeight - band.velocity);
          }
        }

        // Draw individual LED square blocks for this column
        const colX = startX + i * (cellWidth + gap);
        const litBlocksCount = Math.round(band.currentHeight * numRows);
        const peakBlockIndex = Math.round(band.peakHeight * numRows);

        for (let r = 0; r < numRows; r++) {
          // Bottom-up indexing: r = 0 is bottom row, r = numRows - 1 is top peak row
          const blockY = startY + (numRows - 1 - r) * (cellHeight + rowGap);
          const isLit = r < litBlocksCount;
          const isPeak = r === peakBlockIndex && r > 0;

          // LED Color gradient:
          // Lower 60% = Classic Hi-Fi Warm Amber (#FFB000)
          // Next 25% = Warm Orange (#FF7700)
          // Top 15% = Peak Red-Orange (#FF3E00)
          const ratio = r / numRows;
          let ledColor = "#202124"; // unlit dark phosphor
          let ledGlow = false;

          if (isLit || isPeak) {
            ledGlow = true;
            if (ratio < 0.6) {
              ledColor = "#FFB000"; // warm amber
            } else if (ratio < 0.85) {
              ledColor = "#FF8000"; // amber-orange
            } else {
              ledColor = "#FF3E00"; // peak red-orange
            }
          }

          ctx.fillStyle = ledColor;
          ctx.fillRect(colX, blockY, cellWidth, cellHeight);

          // Subtle illumination glow for active LEDs
          if (ledGlow && masterGain > 0.3) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
            ctx.fillRect(colX, blockY, cellWidth, 1.5);
          }
        }
      }

      // 4. Vintage Hi-Fi status readouts (matching topbar & tuner aesthetic)
      const readoutY = startY + equalizerHeight + 32;
      ctx.textAlign = "center";

      // Equalizer Header / Status
      ctx.font = "500 11px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = `rgba(255, 176, 0, ${0.9 * masterGain})`;
      ctx.fillText("● HI-FI EQUALIZER // 28-BAND STEREO SPECTRUM", width / 2, startY - 24);

      // Destination Track Name
      ctx.font = "300 15px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = `rgba(235, 235, 235, ${0.95 * masterGain})`;
      ctx.fillText(targetLabel, width / 2, readoutY);

      // Decibel Scale markers
      ctx.font = "300 10px monospace";
      ctx.fillStyle = `rgba(140, 140, 140, ${0.75 * masterGain})`;
      ctx.fillText(
        "-24dB    -18dB    -12dB    -6dB    0dB    +3dB (PEAK)",
        width / 2,
        readoutY + 22
      );

      if (running) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, targetLabel]);

  return (
    <>
      {children}

      {/* Full-Screen LED Equalizer Overlay */}
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
