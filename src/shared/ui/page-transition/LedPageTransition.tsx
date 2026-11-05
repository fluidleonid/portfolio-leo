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

/**
 * Full-Viewport Hi-Fi LED Player Wave Page Transition
 *
 * Covers 100% of the viewport (100vw x 100vh) in a tactile matrix of square LED blocks.
 *
 * Dynamic Phases:
 * 1. "entering" (Wave Surge):
 *    Pulsing player equalizer wave sweeps upward from the bottom of the screen,
 *    covering the current page in a dynamic, undulating wall of amber/orange/red LED squares.
 * 2. Route Navigation:
 *    When fully covered, router switches to the new page.
 * 3. "leaving" (Wave Recede & Reveal):
 *    The LED wave drops back down to the bottom with energetic bouncing peaks,
 *    revealing the new page underneath square-by-square.
 * 4. "idle":
 *    Completely cleared and hidden with zero DOM/pointer interference.
 */
export function LedPageTransition({ children }: LedPageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [phase, setPhase] = useState<"idle" | "entering" | "leaving">("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const peaksRef = useRef<ColumnPeak[]>([]);
  const pendingHrefRef = useRef<string | null>(null);
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
      pendingHrefRef.current = href;
      isNavigatingRef.current = true;
      startTimeRef.current = performance.now();
      setPhase("entering");

      // Once the surge reaches full screen coverage (~340ms), perform router.push
      setTimeout(() => {
        router.push(href);
      }, 340);
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

      const timer = setTimeout(() => {
        setPhase("idle");
      }, 320);

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
          setTimeout(() => setPhase("idle"), 300);
        }
      }, 1400);
      return () => clearTimeout(safetyTimer);
    }
  }, [phase]);

  // Canvas Equalizer Animation Loop
  useEffect(() => {
    if (phase === "idle") return;

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

    // Geometry of LED squares: 18px square modules with 2px gap (matching the Hero LED matrix)
    const isMobile = width < 640;
    const pixelSize = isMobile ? 12 : 16;
    const gap = 2;
    const step = pixelSize + gap;

    const cols = Math.ceil(width / step);
    const rows = Math.ceil(height / step);

    // Initialize peaks array for columns
    if (peaksRef.current.length !== cols) {
      peaksRef.current = Array.from({ length: cols }, () => ({
        peakRow: 0,
        velocity: 0,
        holdFrames: 0,
      }));
    }

    let running = true;

    const render = () => {
      if (!running) return;

      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const t = now * 0.001; // seconds

      let progress = 0;
      if (phase === "entering") {
        // Surge in: 0 to 1 in 340ms with smooth ease-in-out
        const linear = Math.min(1.0, elapsed / 340);
        progress = linear * linear * (3 - 2 * linear); // smoothstep
      } else {
        // Recede out: 1 to 0 in 300ms
        const linear = Math.min(1.0, elapsed / 300);
        const smooth = linear * linear * (3 - 2 * linear);
        progress = Math.max(0, 1.0 - smooth);
      }

      ctx.clearRect(0, 0, width, height);

      // Dark backdrop that covers the old page as the wave rises, and reveals the new page as it recedes
      const bgOpacity = Math.min(1.0, progress * 1.35);
      ctx.fillStyle = `rgba(12, 13, 16, ${bgOpacity})`;
      ctx.fillRect(0, 0, width, height);

      const peaks = peaksRef.current;

      // Draw each column of LED squares from bottom to top
      for (let c = 0; c < cols; c++) {
        const colRatio = c / cols;
        const peak = peaks[c];

        // Complex multi-harmonic player wave formula (Bass kick + mid undulating ripple + stereo panning)
        const wave1 = Math.sin(colRatio * Math.PI * 4 + t * 9) * 3.5;
        const wave2 = Math.cos(colRatio * Math.PI * 7 - t * 14) * 2.2;
        const wave3 = Math.sin(colRatio * Math.PI * 12 + t * 20) * 1.4;
        const bassThump = Math.sin(t * 11) * 1.8;
        const totalWaveOffset = wave1 + wave2 + wave3 + bassThump;

        // Target height in rows for this column
        // When progress = 1: targetRows exceeds rows, completely covering the screen
        // When progress = 0: targetRows = 0
        const rawTargetRows = progress * (rows + 6) + totalWaveOffset * Math.sin(progress * Math.PI);
        const litRowsCount = Math.max(0, Math.min(rows, Math.round(rawTargetRows)));

        // Peak Hold logic for this column
        if (litRowsCount >= peak.peakRow) {
          peak.peakRow = litRowsCount;
          peak.holdFrames = 8;
          peak.velocity = 0;
        } else {
          if (peak.holdFrames > 0) {
            peak.holdFrames--;
          } else {
            peak.velocity += 0.35; // gravity acceleration
            peak.peakRow = Math.max(0, Math.round(peak.peakRow - peak.velocity));
          }
        }

        const colX = c * step;

        // Render the column's vertical stack of LED squares from bottom up
        for (let r = 0; r < rows; r++) {
          const isLit = r < litRowsCount;
          const isPeak = r === peak.peakRow && r > 0 && r < rows;

          if (!isLit && !isPeak) continue;

          // Inverted Y: r = 0 is at screen bottom, r = rows - 1 is at screen top
          const blockY = height - (r + 1) * step;

          // LED color gradient based on height ratio
          const rowRatio = r / rows;
          let ledColor = "#FFB000"; // Lower part = Vintage Hi-Fi Amber

          if (rowRatio > 0.82) {
            ledColor = "#FF3300"; // Top peak = Signal Red-Orange
          } else if (rowRatio > 0.55) {
            ledColor = "#FF8000"; // Mid part = Vivid Orange
          }

          // Main LED square body
          ctx.fillStyle = ledColor;
          ctx.fillRect(colX, blockY, pixelSize, pixelSize);

          // Subtle tactile 3D sub-pixel highlight on top edge of each square
          ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
          ctx.fillRect(colX, blockY, pixelSize, 1.5);
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
        className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-150 ${
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
