"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@/shared/config/tokens";

export type FunAnimationMode =
  | "squished-goofy" // Eyes and mouth assembled right together into a funny micro-face
  | "pixel-sort" // Turbulent streaming pixel sort into goofy face
  | "picasso" // Pure cubist module permutation: clean non-overlapping tile swap
  | "swap" // Eyes and mouth completely swap places
  | "rolling-ears" // Ears rolling to screen edges
  | "carnival" // Total chaos: swap + rolling ears + floating nose
  | "scatter" // Shatter apart and magnetically reassemble
  | "liquid" // Melting sinusoidal waves
  | "idle"; // Clean original portrait

export interface FunLedMatrixProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Image source path (default strictly "/portrait-2.png") */
  src?: string;
  /** Active animation mode */
  mode?: FunAnimationMode;
  /** Animation speed multiplier (default 1.0) */
  speed?: number;
  /** Displace / effect intensity 0..1 (default 1.0) */
  intensity?: number;
  /** Is animation actively running */
  isPlaying?: boolean;
  /** Manual morph progress 0..1 (optional: overrides time-based animation when set) */
  manualMorphProgress?: number;
  /** Color theme for active LED pixels: "amber" (vintage warm) or "monochrome" (studio crisp) */
  theme?: "amber" | "monochrome";
  /** Number of module columns (default 28) */
  cols?: number;
  /** Number of module rows (default 13) */
  rows?: number;
  /** Size of each module square in px (default 18) */
  pixelSize?: number;
  /** Outer gap between modules in px (default 2) */
  gap?: number;
  /** Sub-pixel size inside module in px (strictly 2) */
  subPixelSize?: number;
  /** Contrast multiplier (default 1.0) */
  contrast?: number;
  /** Interactive hover effect */
  interactive?: boolean;
  /** Trigger ignition burst */
  triggerIgnite?: boolean;
  /** Callback reporting current animation phase or mode */
  onPhaseChange?: (phase: string) => void;
}

/**
 * 10 mutual module swap pairs (20 unique modules) for Picasso Cubism.
 * Every module has a distinct partner; at morph = 1, each module lands
 * exactly in its partner's grid slot with ZERO overlapping modules.
 */
const PICASSO_MODULE_SWAPS: Array<[[number, number], [number, number]]> = [
  // Pair 1: Left eye pupil <-> Left lower jaw / beard
  [[4, 12], [7, 12]],
  // Pair 2: Left eyebrow & top lid <-> Left mid jaw
  [[3, 12], [6, 12]],
  // Pair 3: Right eye pupil <-> Upper forehead / hair
  [[4, 14], [2, 14]],
  // Pair 4: Right eyebrow & top lid <-> Hair peak
  [[3, 14], [1, 14]],
  // Pair 5: Mouth center & lips <-> Right cheek
  [[6, 13], [4, 15]],
  // Pair 6: Nose tip & mustache <-> Right temple
  [[5, 13], [3, 15]],
  // Pair 7: Right ear main body <-> Center chin
  [[4, 16], [7, 13]],
  // Pair 8: Right ear lobe <-> Center neck / collar
  [[5, 16], [8, 13]],
  // Pair 9: Nose bridge <-> Left upper forehead
  [[4, 13], [2, 12]],
  // Pair 10: Left cheek <-> Right lower beard
  [[5, 11], [6, 14]],
];

interface PicassoSwapMeta {
  targetModR: number;
  targetModC: number;
  deltaR: number; // in subpixels (9 per module)
  deltaC: number; // in subpixels
  normalR: number; // perpendicular unit vector for arced flight
  normalC: number;
  sign: number; // +1 for A, -1 for B (divergent orbits)
}

const PICASSO_SWAP_MAP = new Map<number, PicassoSwapMeta>();

PICASSO_MODULE_SWAPS.forEach(([[rA, cA], [rB, cB]]) => {
  const dr = (rB - rA) * 9;
  const dc = (cB - cA) * 9;
  const len = Math.hypot(dr, dc) || 1;
  const normR = -dc / len;
  const normC = dr / len;

  // Module A -> B
  PICASSO_SWAP_MAP.set(rA * 28 + cA, {
    targetModR: rB,
    targetModC: cB,
    deltaR: dr,
    deltaC: dc,
    normalR: normR,
    normalC: normC,
    sign: 1,
  });

  // Module B -> A
  PICASSO_SWAP_MAP.set(rB * 28 + cB, {
    targetModR: rA,
    targetModC: cA,
    deltaR: -dr,
    deltaC: -dc,
    normalR: normR,
    normalC: normC,
    sign: -1,
  });
});

/**
 * Process HTMLImageElement into downsampled sub-pixel arrays with unsharp mask and contrast
 */
function processImageToSubPixels(
  img: HTMLImageElement,
  totalSubCols: number,
  totalSubRows: number,
  contrast: number
): { active: Uint8Array; norm: Float32Array; drawW: number; drawH: number; startCol: number; startRow: number } | null {
  const imgAspect = img.width / img.height;
  const targetAspect = totalSubCols / totalSubRows;

  let drawW = totalSubCols;
  let drawH = totalSubRows;
  let startCol = 0;
  let startRow = 0;

  if (targetAspect > imgAspect) {
    drawW = Math.round(totalSubRows * imgAspect);
    startCol = Math.round((totalSubCols - drawW) / 2);
  } else {
    drawH = Math.round(totalSubCols / imgAspect);
    startRow = Math.round((totalSubRows - drawH) / 2);
  }

  const offCanvas = document.createElement("canvas");
  offCanvas.width = img.width;
  offCanvas.height = img.height;
  const offCtx = offCanvas.getContext("2d");
  if (!offCtx) return null;

  offCtx.drawImage(img, 0, 0);
  const imgData = offCtx.getImageData(0, 0, img.width, img.height).data;

  const cellW = img.width / drawW;
  const cellH = img.height / drawH;

  const activeArr = new Uint8Array(totalSubCols * totalSubRows);
  const normArr = new Float32Array(totalSubCols * totalSubRows);
  const rawBri = new Float32Array(totalSubCols * totalSubRows);

  for (let sr = 0; sr < totalSubRows; sr++) {
    for (let sc = 0; sc < totalSubCols; sc++) {
      const idx = sr * totalSubCols + sc;

      if (
        sc < startCol ||
        sc >= startCol + drawW ||
        sr < startRow ||
        sr >= startRow + drawH
      ) {
        continue;
      }

      const imgX = Math.floor((sc - startCol) * cellW);
      const imgY = Math.floor((sr - startRow) * cellH);
      const pIdx = (imgY * img.width + imgX) * 4;

      const r = imgData[pIdx];
      const g = imgData[pIdx + 1];
      const b = imgData[pIdx + 2];
      const a = imgData[pIdx + 3] / 255;

      // Perceptual luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      rawBri[idx] = lum * a;
    }
  }

  // 3x3 unsharp mask filter
  for (let sr = 0; sr < totalSubRows; sr++) {
    for (let sc = 0; sc < totalSubCols; sc++) {
      const idx = sr * totalSubCols + sc;
      const center = rawBri[idx];
      if (center <= 0) continue;

      let blur = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = sr + dy;
          const nx = sc + dx;
          if (ny >= 0 && ny < totalSubRows && nx >= 0 && nx < totalSubCols) {
            blur += rawBri[ny * totalSubCols + nx];
            count++;
          }
        }
      }
      blur /= count;

      const sharp = center + 0.35 * (center - blur);
      const adjusted = Math.pow(Math.max(0, Math.min(1, sharp)), 1 / contrast);

      const threshold = 0.08;
      if (adjusted > threshold) {
        activeArr[idx] = 1;
        normArr[idx] = Math.min(1, Math.max(0, (adjusted - threshold) / (1 - threshold)));
      }
    }
  }

  return {
    active: activeArr,
    norm: normArr,
    drawW,
    drawH,
    startCol,
    startRow,
  };
}

export const FunLedMatrix = React.memo(
  React.forwardRef<HTMLDivElement, FunLedMatrixProps>(
    (
      {
        src = "/portrait-2.png",
        mode = "picasso",
        speed = 1.0,
        intensity = 1.0,
        isPlaying = true,
        manualMorphProgress,
        theme = "amber",
        cols = 28,
        rows = 13,
        pixelSize = 18,
        gap = 2,
        subPixelSize = 2,
        contrast = 1.0,
        interactive = true,
        triggerIgnite = false,
        onPhaseChange,
        className,
        style,
        ...rest
      },
      ref
    ) => {
      const canvasRef = useRef<HTMLCanvasElement | null>(null);

      const subPerModule = Math.floor(pixelSize / subPixelSize); // 9
      const totalSubCols = cols * subPerModule; // 252
      const totalSubRows = rows * subPerModule; // 117

      const totalWidth = cols * pixelSize + (cols - 1) * gap; // 558px
      const totalHeight = rows * pixelSize + (rows - 1) * gap; // 258px

      // Original base image processed buffers
      const baseBufferRef = useRef<{
        active: Uint8Array;
        norm: Float32Array;
        drawW: number;
        drawH: number;
        startCol: number;
        startRow: number;
      } | null>(null);

      // Dynamic frame buffer passed to renderer
      const frameActiveRef = useRef<Uint8Array>(new Uint8Array(totalSubCols * totalSubRows));
      const frameNormRef = useRef<Float32Array>(new Float32Array(totalSubCols * totalSubRows));

      // Module seeds
      const moduleSeedsRef = useRef<Float32Array | null>(null);

      // Ignition animation
      const [animPhase, setAnimPhase] = useState<"idle" | "igniting" | "settled">("settled");
      const animStartTimeRef = useRef<number | null>(null);
      const [hoveredModule, setHoveredModule] = useState<{ r: number; c: number } | null>(null);

      // Scatter particles state
      const scatterParticlesRef = useRef<
        Array<{
          modR: number;
          modC: number;
          dx: number;
          dy: number;
          targetDx: number;
          targetDy: number;
        }>
      >([]);

      // Initialize seeds & scatter particles
      useEffect(() => {
        const seeds = new Float32Array(rows * cols);
        const particles: typeof scatterParticlesRef.current = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
            seeds[i] = x - Math.floor(x);

            const angle = Math.atan2(r - rows / 2, c - cols / 2) + (seeds[i] - 0.5) * 0.8;
            const dist = 30 + seeds[i] * 60;
            particles.push({
              modR: r,
              modC: c,
              dx: 0,
              dy: 0,
              targetDx: Math.cos(angle) * dist,
              targetDy: Math.sin(angle) * dist,
            });
          }
        }
        moduleSeedsRef.current = seeds;
        scatterParticlesRef.current = particles;
      }, [rows, cols]);

      // Load & process target single photo (/portrait-2.png)
      useEffect(() => {
        let isMounted = true;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;

        img.onload = () => {
          if (!isMounted) return;
          const processed = processImageToSubPixels(
            img,
            totalSubCols,
            totalSubRows,
            contrast
          );
          if (processed) {
            baseBufferRef.current = processed;
            frameActiveRef.current.set(processed.active);
            frameNormRef.current.set(processed.norm);
            setAnimPhase("igniting");
            animStartTimeRef.current = performance.now();
          }
        };

        return () => {
          isMounted = false;
        };
      }, [src, totalSubCols, totalSubRows, contrast]);

      // Trigger ignition on prop change
      useEffect(() => {
        if (triggerIgnite) {
          setAnimPhase("igniting");
          animStartTimeRef.current = performance.now();
        }
      }, [triggerIgnite]);

      // Color conversion
      const getLuminanceColor = (norm: number, colorTheme: "monochrome" | "amber") => {
        if (colorTheme === "amber") {
          if (norm > 0.85) return { r: 255, g: 226, b: 138 };
          if (norm > 0.68) return { r: 255, g: 174, b: 43 };
          if (norm > 0.48) return { r: 224, g: 140, b: 30 };
          if (norm > 0.30) return { r: 184, g: 107, b: 29 };
          if (norm > 0.16) return { r: 135, g: 72, b: 28 };
          if (norm > 0.07) return { r: 85, g: 46, b: 22 };
          return { r: 48, g: 26, b: 14 };
        }

        // Monochrome studio LED
        if (norm > 0.85) return { r: 255, g: 255, b: 255 };
        if (norm > 0.68) return { r: 222, g: 222, b: 222 };
        if (norm > 0.48) return { r: 175, g: 175, b: 175 };
        if (norm > 0.30) return { r: 125, g: 125, b: 125 };
        if (norm > 0.16) return { r: 85, g: 85, b: 85 };
        if (norm > 0.07) return { r: 58, g: 58, b: 58 };
        return { r: 42, g: 42, b: 42 };
      };

      // Render loop with dynamic feature warp engine
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        canvas.width = totalWidth * dpr;
        canvas.height = totalHeight * dpr;
        ctx.scale(dpr, dpr);

        let animId: number;

        // Anatomical bounding boxes extracted directly from portrait-2.png on 252x117 subpixels:
        const leftEyeBox = { minR: 26, maxR: 44, minC: 104, maxC: 119, centerR: 35, centerC: 112 };
        const rightEyeBox = { minR: 26, maxR: 44, minC: 122, maxC: 137, centerR: 35, centerC: 129 };
        const eyesAllBox = { minR: 26, maxR: 44, minC: 104, maxC: 137, centerR: 35, centerC: 121 };
        const noseBox = { minR: 38, maxR: 52, minC: 114, maxC: 127, centerR: 45, centerC: 121 };
        const mouthBox = { minR: 50, maxR: 66, minC: 104, maxC: 137, centerR: 58, centerC: 121 };
        const rightEarBox = { minR: 36, maxR: 54, minC: 142, maxC: 158, centerR: 45, centerC: 150 };

        const isInside = (r: number, c: number, b: typeof eyesAllBox) =>
          r >= b.minR && r <= b.maxR && c >= b.minC && c <= b.maxC;

        const render = (time: number) => {
          const base = baseBufferRef.current;
          const seeds = moduleSeedsRef.current;

          if (!base) {
            animId = requestAnimationFrame(render);
            return;
          }

          const activeBuf = frameActiveRef.current;
          const normBuf = frameNormRef.current;

          activeBuf.fill(0);
          normBuf.fill(0);

          const tSec = (time / 1000) * speed;

          // Calculate morph progress (0 = normal face, 1 = funny re-sorted face)
          let morph = 0;
          if (typeof manualMorphProgress === "number") {
            morph = Math.max(0, Math.min(1, manualMorphProgress));
          } else if (isPlaying && mode !== "idle") {
            // Smooth cycle: 1.8s at normal, 1.2s smooth morph, 2.0s at funny face, 1.2s smooth return
            const cyclePeriod = 6.2;
            const cycle = (tSec % cyclePeriod) / cyclePeriod;

            if (cycle < 0.25) {
              morph = 0;
            } else if (cycle < 0.45) {
              const localT = (cycle - 0.25) / 0.2;
              morph = 0.5 - 0.5 * Math.cos(localT * Math.PI); // smooth sine ease in
            } else if (cycle < 0.75) {
              morph = 1; // fully scrambled and together!
            } else if (cycle < 0.95) {
              const localT = (cycle - 0.75) / 0.2;
              morph = 0.5 + 0.5 * Math.cos(localT * Math.PI); // smooth return
            } else {
              morph = 0;
            }
          }

          const effectiveMorph = morph * intensity;

          // Turbulent pixel-sorting streaming trail during transition
          const streamTurbulence = Math.sin(morph * Math.PI) * intensity;

          const baseActive = base.active;
          const baseNorm = base.norm;

          // -------------------------------------------------------------
          // 1. RE-SORTING PIXEL MAP ENGINE
          // -------------------------------------------------------------
          if (mode === "picasso") {
            // PURE NON-OVERLAPPING CUBIST PERMUTATION
            // Pass 1: Stationary background modules (never overlap, stay locked to their cells)
            for (let r = 0; r < totalSubRows; r++) {
              const modR = Math.floor(r / subPerModule);
              for (let c = 0; c < totalSubCols; c++) {
                const modC = Math.floor(c / subPerModule);
                if (PICASSO_SWAP_MAP.has(modR * cols + modC)) continue;

                const srcIdx = r * totalSubCols + c;
                if (baseActive[srcIdx] === 0) continue;

                activeBuf[srcIdx] = baseActive[srcIdx];
                normBuf[srcIdx] = baseNorm[srcIdx];
              }
            }

            // Pass 2: The 20 mutually swapped modules (10 pairs)
            // They fly along divergent arced orbits so they never collide mid-air,
            // and at morph = 1 each lands with 100% precision into its partner's vacated cell.
            for (let r = 0; r < totalSubRows; r++) {
              const modR = Math.floor(r / subPerModule);
              for (let c = 0; c < totalSubCols; c++) {
                const modC = Math.floor(c / subPerModule);
                const swap = PICASSO_SWAP_MAP.get(modR * cols + modC);
                if (!swap) continue;

                const srcIdx = r * totalSubCols + c;
                if (baseActive[srcIdx] === 0) continue;

                // Stream jitter during transition
                let jitterR = 0;
                let jitterC = 0;
                if (streamTurbulence > 0.001) {
                  const noiseAngle = r * 0.28 + c * 0.22 + tSec * 6;
                  const mag = streamTurbulence * 4;
                  jitterR = Math.sin(noiseAngle) * mag;
                  jitterC = Math.cos(noiseAngle * 1.2) * mag;
                }

                // Smooth divergent arced flight: peaks at morph = 0.5, returns to exactly 0 at morph = 1
                const arcDist = 14 * Math.sin(effectiveMorph * Math.PI) * intensity;
                const arcR = swap.normalR * arcDist * swap.sign;
                const arcC = swap.normalC * arcDist * swap.sign;

                const finalR = Math.round(r + swap.deltaR * effectiveMorph + arcR + jitterR);
                const finalC = Math.round(c + swap.deltaC * effectiveMorph + arcC + jitterC);

                if (finalR >= 0 && finalR < totalSubRows && finalC >= 0 && finalC < totalSubCols) {
                  const destIdx = finalR * totalSubCols + finalC;
                  activeBuf[destIdx] = baseActive[srcIdx];
                  normBuf[destIdx] = baseNorm[srcIdx];
                }
              }
            }
          } else {
            // General deformation modes (squished-goofy, pixel-sort, swap, rolling-ears, carnival, etc.)
            for (let r = 0; r < totalSubRows; r++) {
              for (let c = 0; c < totalSubCols; c++) {
                const srcIdx = r * totalSubCols + c;
                if (baseActive[srcIdx] === 0) continue;

                let targetR = r;
                let targetC = c;

                // Stream jitter during transit
                let jitterR = 0;
                let jitterC = 0;
                if (streamTurbulence > 0.001) {
                  const noiseAngle = r * 0.24 + c * 0.18 + tSec * 5;
                  const mag = streamTurbulence * (mode === "pixel-sort" ? 22 : 9);
                  jitterR = Math.sin(noiseAngle) * mag;
                  jitterC = Math.cos(noiseAngle * 1.3) * mag * 1.4;
                }

                if (mode === "squished-goofy" || mode === "pixel-sort") {
                  if (isInside(r, c, eyesAllBox)) {
                    // EYES: Pulled DOWN by +13 rows to meet the mouth!
                    const dr = 13;
                    const dc = (121 - c) * 0.15;
                    targetR = r + dr;
                    targetC = c + dc;
                  } else if (isInside(r, c, mouthBox)) {
                    // MOUTH: Pulled UP by -5 rows
                    const dr = -5;
                    const dc = (c - 121) * 0.28;
                    targetR = r + dr;
                    targetC = c + dc;
                  } else if (isInside(r, c, noseBox)) {
                    // NOSE: Moved UP to forehead
                    const dr = -24;
                    targetR = r + dr;
                    targetC = c;
                  } else if (isInside(r, c, rightEarBox)) {
                    // RIGHT EAR: Slides to head crown
                    const dr = -28;
                    const dc = -24;
                    targetR = r + dr;
                    targetC = c + dc;
                  } else if (r >= 12 && r <= 78 && c >= 90 && c <= 150) {
                    const distToCenter = Math.hypot(r - 50, c - 121);
                    if (distToCenter > 18) {
                      const factor = Math.sin((distToCenter - 18) * 0.08) * 4;
                      targetR = r + factor;
                    }
                  }
                } else if (mode === "swap") {
                  const deltaR = mouthBox.centerR - eyesAllBox.centerR; // ~23 rows
                  if (isInside(r, c, eyesAllBox)) {
                    targetR = r + deltaR;
                    targetC = c + Math.sin((r / 10) * Math.PI) * 6;
                  } else if (isInside(r, c, mouthBox)) {
                    targetR = r - deltaR;
                    targetC = c - Math.sin((r / 10) * Math.PI) * 6;
                  }
                } else if (mode === "rolling-ears") {
                  if (isInside(r, c, rightEarBox)) {
                    const earWave = Math.sin(tSec * 2.5);
                    targetC = c + Math.abs(earWave) * 44;
                    targetR = r + Math.sin(tSec * 5) * 12;
                  } else if (c >= 55 && c <= 82 && r >= 38 && r <= 80) {
                    const earWave = Math.sin(tSec * 2.5);
                    targetC = c - Math.abs(earWave) * 44;
                    targetR = r - Math.sin(tSec * 5) * 12;
                  }
                } else if (mode === "carnival") {
                  if (isInside(r, c, eyesAllBox)) {
                    targetR = r + 13 + Math.sin(tSec * 3) * 4;
                    targetC = c + Math.cos(tSec * 2) * 6;
                  } else if (isInside(r, c, mouthBox)) {
                    targetR = r - 5 - Math.sin(tSec * 3) * 4;
                    targetC = c - Math.cos(tSec * 2) * 6;
                  } else if (isInside(r, c, noseBox)) {
                    targetR = r - 24 + Math.sin(tSec * 6) * 5;
                  } else if (isInside(r, c, rightEarBox)) {
                    targetC = c + Math.sin(tSec * 2.5) * 40;
                    targetR = r + Math.cos(tSec * 3) * 14;
                  }
                } else if (mode === "liquid") {
                  const wave = Math.round(
                    Math.sin(r * 0.18 + tSec * 3) * 16 * intensity +
                      Math.cos(r * 0.08 - tSec * 2) * 8 * intensity
                  );
                  targetC = c + wave;
                } else if (mode === "scatter") {
                  const modR = Math.floor(r / subPerModule);
                  const modC = Math.floor(c / subPerModule);
                  const modIdx = modR * cols + modC;
                  const p = scatterParticlesRef.current[modIdx];
                  const cycleT = 0.5 + 0.5 * Math.sin(tSec * 1.5);
                  targetR = r + Math.round((p ? p.targetDy : 0) * cycleT * intensity);
                  targetC = c + Math.round((p ? p.targetDx : 0) * cycleT * intensity);
                }

                const finalR = Math.round(r + (targetR - r) * effectiveMorph + jitterR);
                const finalC = Math.round(c + (targetC - c) * effectiveMorph + jitterC);

                if (finalR >= 0 && finalR < totalSubRows && finalC >= 0 && finalC < totalSubCols) {
                  const destIdx = finalR * totalSubCols + finalC;
                  activeBuf[destIdx] = baseActive[srcIdx];
                  normBuf[destIdx] = baseNorm[srcIdx];
                }
              }
            }
          }

          // -------------------------------------------------------------
          // 2. CANVAS RENDER LOOP (18x18px modules with 2x2px micro-pixels)
          // -------------------------------------------------------------
          ctx.clearRect(0, 0, totalWidth, totalHeight);

          const now = performance.now();
          const ignitionWindow = 600;
          const sparkPeakDuration = 220;
          const decayDuration = 500;
          const totalAnimDuration = ignitionWindow + sparkPeakDuration + decayDuration;

          let isIgniting = false;
          let elapsed = 0;

          if (animPhase === "igniting" && animStartTimeRef.current !== null) {
            elapsed = now - animStartTimeRef.current;
            if (elapsed < totalAnimDuration) {
              isIgniting = true;
            } else {
              setAnimPhase("settled");
            }
          }

          for (let r = 0; r < rows; r++) {
            const modY = r * (pixelSize + gap);

            for (let c = 0; c < cols; c++) {
              const modX = c * (pixelSize + gap);
              const modIdx = r * cols + c;
              const modSeed = seeds ? seeds[modIdx] : 0.5;
              const isHovered = hoveredModule && hoveredModule.r === r && hoveredModule.c === c;

              const modIgniteTime = modSeed * ignitionWindow;
              const modAge = elapsed - modIgniteTime;

              ctx.fillStyle = isHovered ? tokens.colors.surfacePill : tokens.colors.surface;
              ctx.fillRect(modX, modY, pixelSize, pixelSize);

              for (let subR = 0; subR < subPerModule; subR++) {
                const globalR = r * subPerModule + subR;
                const py = modY + subR * subPixelSize;

                for (let subC = 0; subC < subPerModule; subC++) {
                  const globalC = c * subPerModule + subC;
                  const px = modX + subC * subPixelSize;

                  const idx = globalR * totalSubCols + globalC;
                  const isActive = activeBuf[idx] === 1;
                  const normVal = normBuf[idx];

                  const microJitter = ((subR * 5 + subC * 11) % 9) * 12;
                  const pixelAge = modAge - microJitter;

                  if (animPhase === "settled" && !isActive && !isHovered) {
                    continue;
                  }

                  let finalR = 36;
                  let finalG = 36;
                  let finalB = 36;

                  if (isActive) {
                    const targetCol = getLuminanceColor(normVal, theme);
                    finalR = targetCol.r;
                    finalG = targetCol.g;
                    finalB = targetCol.b;
                  }

                  if (animPhase === "igniting") {
                    if (pixelAge < 0) {
                      finalR = 36;
                      finalG = 36;
                      finalB = 36;
                    } else if (pixelAge < sparkPeakDuration) {
                      const sparkProgress = pixelAge / sparkPeakDuration;
                      const twinkle = 0.85 + 0.15 * Math.sin(pixelAge * 0.08);
                      const flare = Math.sin(sparkProgress * Math.PI) * twinkle;

                      const peakR = theme === "amber" ? 255 : 250;
                      const peakG = theme === "amber" ? 245 : 250;
                      const peakB = theme === "amber" ? 220 : 250;

                      finalR = Math.round(36 + (peakR - 36) * flare);
                      finalG = Math.round(36 + (peakG - 36) * flare);
                      finalB = Math.round(36 + (peakB - 36) * flare);
                    } else {
                      const decayProgress = Math.min(1, (pixelAge - sparkPeakDuration) / decayDuration);
                      const ease = 1 - Math.pow(1 - decayProgress, 2.5);

                      const flashResidualR = 180;
                      const flashResidualG = 180;
                      const flashResidualB = 180;

                      const targetR = isActive ? finalR : 36;
                      const targetG = isActive ? finalG : 36;
                      const targetB = isActive ? finalB : 36;

                      finalR = Math.round(flashResidualR + (targetR - flashResidualR) * ease);
                      finalG = Math.round(flashResidualG + (targetG - flashResidualG) * ease);
                      finalB = Math.round(flashResidualB + (targetB - flashResidualB) * ease);
                    }
                  }

                  if (isHovered && isActive) {
                    finalR = Math.min(255, Math.round(finalR * 1.30));
                    finalG = Math.min(255, Math.round(finalG * 1.30));
                    finalB = Math.min(255, Math.round(finalB * 1.30));
                  }

                  ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
                  ctx.fillRect(px, py, subPixelSize, subPixelSize);
                }
              }
            }
          }

          animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);

        return () => {
          cancelAnimationFrame(animId);
        };
      }, [
        cols,
        rows,
        pixelSize,
        gap,
        subPixelSize,
        totalWidth,
        totalHeight,
        totalSubCols,
        totalSubRows,
        theme,
        speed,
        intensity,
        isPlaying,
        manualMorphProgress,
        mode,
        animPhase,
        hoveredModule,
      ]);

      // Hover handler
      const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
          if (!interactive) return;
          const canvas = canvasRef.current;
          if (!canvas) return;

          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const c = Math.floor(x / (pixelSize + gap));
          const r = Math.floor(y / (pixelSize + gap));

          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            setHoveredModule({ r, c });
          } else {
            setHoveredModule(null);
          }
        },
        [interactive, pixelSize, gap, rows, cols]
      );

      const handleMouseLeave = useCallback(() => {
        setHoveredModule(null);
      }, []);

      return (
        <div
          ref={ref}
          className={`relative inline-flex items-center justify-center ${className || ""}`}
          style={style}
          {...rest}
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              width: `${totalWidth}px`,
              height: `${totalHeight}px`,
              display: "block",
            }}
          />
        </div>
      );
    }
  )
);

FunLedMatrix.displayName = "FunLedMatrix";
