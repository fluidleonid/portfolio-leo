"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Same Hi-Fi LED audio spectrum palette as LedPageTransition
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

// Clean 5x7 industrial LED matrix glyphs for "4 0 4" (total 17x7 logical units)
const GLYPH_4 = [
  "10010",
  "10010",
  "10010",
  "11111",
  "00010",
  "00010",
  "00010",
];

const GLYPH_0 = [
  "01110",
  "10001",
  "10011",
  "10101",
  "11001",
  "10001",
  "01110",
];

const PATTERN_404 = GLYPH_4.map(
  (row, idx) => `${row}0${GLYPH_0[idx]}0${GLYPH_4[idx]}`
); // 7 rows x 17 cols

function smoothQuintic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

function hashInt(c: number, r: number, salt: number): number {
  let h = (c * 374761393 + r * 668265263 + salt * 1013904223) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [buttonTopPx, setButtonTopPx] = useState<number | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId = 0;
    let running = true;
    const startTime = performance.now();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = width < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const pixelSize = 16;
    const gap = 2;
    const step = pixelSize + gap;

    let cols = 0;
    let rows = 0;
    let offscreenBg: HTMLCanvasElement;
    let mask404: Uint8Array;
    let extinguishDelay: Float32Array;
    let highlightX: Float32Array;
    let highlightY: Float32Array;
    let glyphBottomRowFromTop = 0;
    let glyphTopRowFromTop = 0;

    const rebuildGrid = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = width < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / step);
      rows = Math.ceil(height / step);

      // Pre-render dark chassis & inactive #242424 LED modules (identical to LedPageTransition)
      offscreenBg = document.createElement("canvas");
      offscreenBg.width = width * dpr;
      offscreenBg.height = height * dpr;
      const offCtx = offscreenBg.getContext("2d");
      if (offCtx) {
        offCtx.scale(dpr, dpr);
        offCtx.fillStyle = "rgba(12, 13, 16, 1)";
        offCtx.fillRect(0, 0, width, height);

        offCtx.fillStyle = "#242424";
        for (let c = 0; c < cols; c++) {
          const colX = c * step;
          for (let r = 0; r < rows; r++) {
            const blockY = height - (r + 1) * step;
            offCtx.fillRect(colX, blockY, pixelSize, pixelSize);
          }
        }

        offCtx.fillStyle = "#181818";
        for (let c = 0; c < cols; c++) {
          const colX = c * step;
          for (let r = 0; r < rows; r++) {
            const blockY = height - (r + 1) * step;
            offCtx.fillRect(colX, blockY, pixelSize, 1);
          }
        }
      }

      // Compute massive almost-full-width integer scale for 17x7 "404" pattern
      const patW = 17;
      const patH = 7;
      const maxScaleW = Math.floor((cols * 0.86) / patW);
      const maxScaleH = Math.floor((rows * 0.56) / patH);
      const scale = Math.max(1, Math.min(maxScaleW, maxScaleH));

      const glyphW = patW * scale;
      const glyphH = patH * scale;
      const startCol = Math.floor((cols - glyphW) / 2);
      // Center slightly above vertical midpoint so button sits comfortably beneath 404
      const startRowFromTop = Math.max(
        2,
        Math.floor((rows - glyphH) * 0.42)
      );

      glyphTopRowFromTop = startRowFromTop;
      glyphBottomRowFromTop = startRowFromTop + glyphH;

      // Position "back to site" button cleanly below the 404 glyph
      const bottomY = Math.min(
        height - 96,
        Math.round(glyphBottomRowFromTop * step + (width < 640 ? 32 : 44))
      );
      setButtonTopPx(bottomY);

      const total = cols * rows;
      mask404 = new Uint8Array(total);
      extinguishDelay = new Float32Array(total);
      highlightX = new Float32Array(total);
      highlightY = new Float32Array(total);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          // r is measured from BOTTOM (matching LedPageTransition), convert to rowFromTop
          const rowFromTop = rows - 1 - r;
          const idx = c * rows + r;

          // Check if (c, rowFromTop) falls inside the scaled "404" glyph
          const localC = c - startCol;
          const localR = rowFromTop - startRowFromTop;
          if (
            localC >= 0 &&
            localC < glyphW &&
            localR >= 0 &&
            localR < glyphH
          ) {
            const patC = Math.floor(localC / scale);
            const patR = Math.floor(localR / scale);
            if (PATTERN_404[patR]?.[patC] === "1") {
              mask404[idx] = 1;
            }
          }

          // Deterministic organic scatter timing for background squares extinguishing
          const rand01 = (hashInt(c, r, 7919) % 1000) / 1000;
          const distFromCenter = Math.hypot(
            (c - cols / 2) / Math.max(1, cols / 2),
            (rowFromTop - (glyphTopRowFromTop + glyphH / 2)) /
              Math.max(1, rows / 2)
          );
          // Outer squares extinguish slightly earlier, creating a natural focus pull into 404
          extinguishDelay[idx] = Math.max(
            0,
            Math.min(1, rand01 * 0.78 + (1 - Math.min(1, distFromCenter)) * 0.22)
          );
        }
      }
    };

    rebuildGrid();
    window.addEventListener("resize", rebuildGrid);

    // Reveal button right as the 404 finishes carving out of the loader wave
    const btnTimer = window.setTimeout(
      () => setShowButton(true),
      prefersReducedMotion ? 100 : 1250
    );

    const PHASE_SURGE = 580; // Loader audio-wave surges up to fill screen
    const PHASE_CARVE = 1150; // Background squares flicker & extinguish, leaving massive 404 lit

    const render = () => {
      if (!running) return;

      const now = performance.now();
      const elapsed = prefersReducedMotion
        ? PHASE_SURGE + PHASE_CARVE + 1000
        : now - startTime;
      const t = now * 0.001;

      ctx.drawImage(offscreenBg, 0, 0, width, height);

      const surgeLinear = Math.min(1, elapsed / PHASE_SURGE);
      const surgeProgress = smoothQuintic(surgeLinear);

      const carveLinear = Math.max(
        0,
        Math.min(1, (elapsed - PHASE_SURGE) / PHASE_CARVE)
      );
      const carveProgress = smoothQuintic(carveLinear);

      const timeBeatInt = Math.floor(t * 7);
      const idleShimmerBeat = Math.floor(t * 4);
      const beat = Math.pow(Math.max(0, Math.sin(t * 6.5)), 3.5) * 4.2;

      let highlightCount = 0;
      const maxBlocks = cols * rows;

      for (let c = 0; c < cols; c++) {
        const colRatio = c / Math.max(1, cols);
        const colX = c * step;

        // During surge, use the exact multi-harmonic audio wave from LedPageTransition
        let litRowsLimit = rows;
        if (surgeProgress < 1) {
          const wave1 = Math.sin(colRatio * Math.PI * 4 + t * 7.5) * 4.0;
          const wave2 = Math.cos(colRatio * Math.PI * 8 - t * 11.0) * 2.5;
          const wave3 = Math.sin(colRatio * Math.PI * 14 + t * 17.0) * 1.5;
          const wavePulse =
            wave1 + wave2 + wave3 + beat * Math.sin(colRatio * Math.PI);
          litRowsLimit = Math.max(
            0,
            Math.min(
              rows,
              Math.round(
                surgeProgress * (rows + 8) +
                  wavePulse * Math.sin(surgeProgress * Math.PI)
              )
            )
          );
        }

        for (let r = 0; r < litRowsLimit; r++) {
          const idx = c * rows + r;
          const isGlyph = mask404[idx] === 1;

          let cubeAlpha = 1;

          if (!isGlyph) {
            if (carveProgress >= 1) {
              continue; // Extinguished!
            }
            if (carveProgress > 0) {
              const threshold = extinguishDelay[idx];
              const diff = carveProgress - threshold;
              if (diff > 0.12) {
                continue; // Fully extinguished
              }
              if (diff > 0) {
                // Brief organic LED flicker right before turning off
                const flicker = (hashInt(c, r, timeBeatInt) % 3) === 0 ? 0.35 : 0.85;
                cubeAlpha = Math.max(0, (1 - diff / 0.12) * flicker);
              }
            }
          }

          const blockY = height - (r + 1) * step;
          const rowRatio = r / Math.max(1, rows);

          // Rich Hi-Fi LED color selection
          const hashVal = hashInt(
            c,
            r,
            carveProgress >= 1 ? idleShimmerBeat : timeBeatInt
          );
          let ledColor =
            AUDIO_PALETTE_AMBER[hashVal % AUDIO_PALETTE_AMBER.length];

          if (isGlyph && carveProgress > 0.4) {
            // Inside the carved "404": rich amber-gold with warm orange accents & subtle vertical warmth
            const rowFromTop = rows - 1 - r;
            const localGlyphRatio =
              (rowFromTop - glyphTopRowFromTop) /
              Math.max(1, glyphBottomRowFromTop - glyphTopRowFromTop);
            if (localGlyphRatio < 0.22 && hashVal % 4 === 0) {
              ledColor = AUDIO_PALETTE_PEAK[hashVal % AUDIO_PALETTE_PEAK.length];
            } else if (localGlyphRatio < 0.48 && hashVal % 2 === 0) {
              ledColor =
                AUDIO_PALETTE_ORANGE[hashVal % AUDIO_PALETTE_ORANGE.length];
            }
          } else {
            if (rowRatio > 0.8) {
              ledColor = AUDIO_PALETTE_PEAK[hashVal % AUDIO_PALETTE_PEAK.length];
            } else if (rowRatio > 0.52) {
              ledColor =
                AUDIO_PALETTE_ORANGE[hashVal % AUDIO_PALETTE_ORANGE.length];
            }
          }

          if (cubeAlpha < 0.99) {
            ctx.globalAlpha = cubeAlpha;
            ctx.fillStyle = ledColor;
            ctx.fillRect(colX, blockY, pixelSize, pixelSize);
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = ledColor;
            ctx.fillRect(colX, blockY, pixelSize, pixelSize);

            if (highlightCount < maxBlocks) {
              highlightX[highlightCount] = colX;
              highlightY[highlightCount] = blockY;
              highlightCount++;
            }
          }
        }
      }

      // Batch draw crisp top micro-bevel highlights on fully lit LED modules
      if (highlightCount > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        for (let i = 0; i < highlightCount; i++) {
          ctx.fillRect(highlightX[i], highlightY[i], pixelSize, 2);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      running = false;
      window.clearTimeout(btnTimer);
      window.removeEventListener("resize", rebuildGrid);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#0c0d10] select-none">
      {/* Full-screen LED Matrix Canvas */}
      <canvas
        ref={canvasRef}
        aria-label="404 — Page not found"
        className="block h-full w-full"
      />

      {/* Screen-reader accessible heading */}
      <h1 className="sr-only">404 — Page Not Found</h1>

      {/* Crisp White "back to site" Button positioned directly beneath the massive LED 404 */}
      {buttonTopPx !== null && (
        <div
          style={{ top: `${buttonTopPx}px` }}
          className={`fixed left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-out ${
            showButton
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-[10px] pointer-events-none"
          }`}
        >
          <Link
            href="/"
            className="inline-flex h-[48px] items-center justify-center rounded-[12px] bg-white px-[24px] font-hauora text-[16px] font-medium leading-none text-[#1a1a1a] shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-all duration-150 hover:bg-[#e5e5e5] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 whitespace-nowrap"
          >
            back to site
          </Link>
        </div>
      )}
    </main>
  );
}
