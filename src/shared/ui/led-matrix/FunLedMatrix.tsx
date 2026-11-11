"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@/shared/config/tokens";

export type FunAnimationMode =
  | "picasso" // Pure cubist module permutation: eyes bottom, mirrored mouth top, all modules move
  | "squished-goofy" // Eyes and mouth assembled right together into a funny micro-face
  | "pixel-sort" // Turbulent streaming pixel sort into goofy face
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
 * Full-Portrait Picasso Cubism Permutation (98 active modules):
 * - Left eye: 4 modules (2x2 group) [3..4, 11..12] -> moves as an intact unit down to [6..7, 11..12]
 * - Right eye: 2 modules (2x1 group) [3..4, 14] -> moves as an intact unit down to [6..7, 14]
 * - Mouth & Nose: moves to top [1..3, 12..14] with vertical mirroring (flipY: true)
 * - Head & hair (rows 1..8): all modules permuted
 * - Collar, chest, shoulders & T-shirt (rows 8..12, cols 7..20): ALL modules cross-swapped & scrambled!
 * - Closed 1-to-1 bijection: EVERY module moves, ZERO overlaps, ZERO empty holes!
 */
interface PicassoModuleSpec {
  from: [number, number];
  to: [number, number];
  flipY: boolean;
  flipX: boolean;
  sign: number;
}

const PICASSO_SPECS: PicassoModuleSpec[] = [
  // Group 1: Left eye (4 modules 2x2) -> rows 6..7, cols 11..12 (moves down as intact eye!)
  { from: [3, 11], to: [6, 11], flipY: false, flipX: false, sign: 1 },
  { from: [3, 12], to: [6, 12], flipY: false, flipX: false, sign: 1 },
  { from: [4, 11], to: [7, 11], flipY: false, flipX: false, sign: 1 },
  { from: [4, 12], to: [7, 12], flipY: false, flipX: false, sign: 1 },

  // Group 2: Right eye (2 modules 2x1) -> rows 6..7, col 14 (moves down as intact eye!)
  { from: [3, 14], to: [6, 14], flipY: false, flipX: false, sign: -1 },
  { from: [4, 14], to: [7, 14], flipY: false, flipX: false, sign: -1 },

  // Group 3: Mouth & Nose (5 modules) -> Top rows 1..3, vertically mirrored (flipY: true)
  { from: [6, 13], to: [1, 13], flipY: true, flipX: false, sign: 1 }, // mouth inverted at top
  { from: [5, 13], to: [2, 13], flipY: true, flipX: false, sign: 1 }, // nose tip inverted
  { from: [4, 13], to: [3, 13], flipY: true, flipX: false, sign: 1 }, // nose bridge inverted
  { from: [5, 12], to: [2, 12], flipY: true, flipX: false, sign: 1 }, // mustache left inverted
  { from: [5, 14], to: [2, 14], flipY: true, flipX: false, sign: -1 }, // mustache right inverted

  // Group 4: Forehead / Hair -> Fills vacated mouth, nose, chin
  { from: [1, 12], to: [5, 12], flipY: false, flipX: false, sign: -1 },
  { from: [1, 13], to: [5, 13], flipY: false, flipX: false, sign: -1 },
  { from: [1, 14], to: [5, 14], flipY: false, flipX: false, sign: 1 },
  { from: [2, 12], to: [6, 13], flipY: false, flipX: false, sign: -1 },
  { from: [2, 13], to: [7, 13], flipY: false, flipX: false, sign: -1 },
  { from: [2, 14], to: [8, 13], flipY: false, flipX: false, sign: 1 },

  // Group 5: Hair sides & upper face -> Fills vacated left eye
  { from: [1, 15], to: [3, 11], flipY: false, flipX: false, sign: 1 },
  { from: [2, 11], to: [3, 12], flipY: false, flipX: false, sign: 1 },
  { from: [2, 15], to: [4, 11], flipY: false, flipX: false, sign: -1 },
  { from: [2, 16], to: [4, 12], flipY: false, flipX: false, sign: -1 },

  // Group 6: Right Ear [4,16], [5,16] -> Fills vacated right eye [3,14], [4,14]
  { from: [4, 16], to: [3, 14], flipY: false, flipX: false, sign: 1 },
  { from: [5, 16], to: [4, 14], flipY: false, flipX: false, sign: 1 },

  // Group 7: Cheeks & sides
  { from: [5, 11], to: [4, 16], flipY: false, flipX: false, sign: -1 },
  { from: [5, 15], to: [5, 16], flipY: false, flipX: false, sign: -1 },
  { from: [4, 15], to: [4, 13], flipY: false, flipX: false, sign: 1 },
  { from: [3, 15], to: [2, 11], flipY: false, flipX: false, sign: 1 },
  { from: [3, 13], to: [1, 14], flipY: false, flipX: false, sign: -1 },

  // Group 8: Lower beard & jaw -> Fills top hairline & sides
  { from: [6, 11], to: [1, 12], flipY: false, flipX: false, sign: -1 },
  { from: [6, 12], to: [1, 15], flipY: false, flipX: false, sign: -1 },
  { from: [7, 11], to: [2, 15], flipY: false, flipX: false, sign: 1 },
  { from: [7, 12], to: [2, 16], flipY: false, flipX: false, sign: 1 },
  { from: [7, 13], to: [3, 15], flipY: false, flipX: false, sign: 1 },
  { from: [6, 14], to: [4, 15], flipY: false, flipX: false, sign: -1 },
  { from: [7, 14], to: [5, 11], flipY: false, flipX: false, sign: 1 },
  { from: [8, 13], to: [5, 15], flipY: false, flipX: false, sign: 1 },
];

// Add collar modules (Row 8)
const ROW8_COLLAR_PAIRS: Array<[[number, number], [number, number]]> = [
  [[8, 10], [8, 16]],
  [[8, 11], [8, 15]],
  [[8, 12], [8, 14]],
];
ROW8_COLLAR_PAIRS.forEach(([a, b]) => {
  PICASSO_SPECS.push({ from: a, to: b, flipY: false, flipX: true, sign: 1 });
  PICASSO_SPECS.push({ from: b, to: a, flipY: false, flipX: true, sign: -1 });
});

// Add entire T-shirt and shoulders (rows 9..12, cols 7..20) - 56 modules cross-swapped!
for (let r = 9; r <= 12; r++) {
  for (let c = 7; c <= 13; c++) {
    const oppC = 20 - (c - 7); // cross mirror: 7 <-> 20, 8 <-> 19, etc.
    const oppR = r === 9 ? 11 : r === 11 ? 9 : r === 10 ? 12 : 10;
    const signVal = (r + c) % 2 === 0 ? 1 : -1;
    PICASSO_SPECS.push({ from: [r, c], to: [oppR, oppC], flipY: false, flipX: true, sign: signVal });
    PICASSO_SPECS.push({ from: [oppR, oppC], to: [r, c], flipY: false, flipX: true, sign: -signVal });
  }
}

interface PicassoSwapLookup {
  targetModR: number;
  targetModC: number;
  flipY: boolean;
  flipX: boolean;
  deltaR: number; // in subpixels
  deltaC: number; // in subpixels
  normalR: number;
  normalC: number;
  sign: number;
}

const PICASSO_LOOKUP = new Map<number, PicassoSwapLookup>();

PICASSO_SPECS.forEach((spec) => {
  const [rA, cA] = spec.from;
  const [rB, cB] = spec.to;
  const dr = (rB - rA) * 9;
  const dc = (cB - cA) * 9;
  const len = Math.hypot(dr, dc) || 1;
  const normR = -dc / len;
  const normC = dr / len;

  PICASSO_LOOKUP.set(rA * 28 + cA, {
    targetModR: rB,
    targetModC: cB,
    flipY: spec.flipY,
    flipX: spec.flipX,
    deltaR: dr,
    deltaC: dc,
    normalR: normR,
    normalC: normC,
    sign: spec.sign,
  });
});

/**
 * Process HTMLImageElement into downsampled sub-pixel arrays with unsharp mask,
 * box area sampling, and gamma 2.2 tone mapping (prevents overexposure / засвет)
 */
function processImageToSubPixels(
  img: HTMLImageElement,
  totalSubCols: number,
  totalSubRows: number,
  contrast: number
): { active: Uint8Array; norm: Float32Array } | null {
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
        activeArr[idx] = 0;
        rawBri[idx] = 0;
        continue;
      }

      const imgX = sc - startCol;
      const imgY = sr - startRow;

      const sx = Math.floor(imgX * cellW);
      const ex = Math.floor((imgX + 1) * cellW);
      const sy = Math.floor(imgY * cellH);
      const ey = Math.floor((imgY + 1) * cellH);

      let sumBri = 0;
      let sumAlpha = 0;
      let count = 0;

      for (let y = sy; y < ey; y++) {
        for (let x = sx; x < ex; x++) {
          const pIdx = (y * img.width + x) * 4;
          sumAlpha += imgData[pIdx + 3];
          if (imgData[pIdx + 3] > 20) {
            sumBri +=
              imgData[pIdx] * 0.299 +
              imgData[pIdx + 1] * 0.587 +
              imgData[pIdx + 2] * 0.114;
            count++;
          }
        }
      }

      const total = (ex - sx) * (ey - sy) || 1;
      const avgAlpha = sumAlpha / total;
      const avgBri = count > 0 ? sumBri / count : 0;

      rawBri[idx] = avgBri;
      activeArr[idx] = avgAlpha >= 25 ? 1 : 0;
    }
  }

  // High-Contrast Tone Mapping with gamma 2.2 curve (strictly eliminates засвет)
  for (let sr = 0; sr < totalSubRows; sr++) {
    for (let sc = 0; sc < totalSubCols; sc++) {
      const idx = sr * totalSubCols + sc;
      if (activeArr[idx] === 0) {
        normArr[idx] = 0;
        continue;
      }

      const b = rawBri[idx];
      const left = sc > 0 && activeArr[idx - 1] ? rawBri[idx - 1] : b;
      const right = sc < totalSubCols - 1 && activeArr[idx + 1] ? rawBri[idx + 1] : b;
      const up = sr > 0 && activeArr[idx - totalSubCols] ? rawBri[idx - totalSubCols] : b;
      const down = sr < totalSubRows - 1 && activeArr[idx + totalSubCols] ? rawBri[idx + totalSubCols] : b;

      const localAvg = (left + right + up + down) / 4;
      const delta = b - localAvg;
      const sharpened = Math.max(0, Math.min(255, b + delta * 1.3));

      let x = (sharpened - 45) / (242 - 45);
      x = Math.max(0, Math.min(1, x));

      const gamma = 2.2 * contrast;
      const norm = Math.pow(x, gamma);
      normArr[idx] = norm;
    }
  }

  return { active: activeArr, norm: normArr };
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
            setAnimPhase("settled");
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

      // Color conversion with true contrast curves
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

          // Calculate morph progress (0 = normal face, 1 = fully scrambled Picasso pose)
          let morph = 0;
          if (typeof manualMorphProgress === "number") {
            morph = Math.max(0, Math.min(1, manualMorphProgress));
          } else if (isPlaying && mode !== "idle") {
            const cyclePeriod = 6.2;
            const cycle = (tSec % cyclePeriod) / cyclePeriod;

            if (cycle < 0.25) {
              morph = 0;
            } else if (cycle < 0.45) {
              const localT = (cycle - 0.25) / 0.2;
              morph = 0.5 - 0.5 * Math.cos(localT * Math.PI); // smooth sine ease in
            } else if (cycle < 0.75) {
              morph = 1; // fully settled in Picasso / funny pose!
            } else if (cycle < 0.95) {
              const localT = (cycle - 0.75) / 0.2;
              morph = 0.5 + 0.5 * Math.cos(localT * Math.PI); // smooth return
            } else {
              morph = 0;
            }
          }

          const effectiveMorph = morph * intensity;
          const streamTurbulence = Math.sin(morph * Math.PI) * intensity;

          const baseActive = base.active;
          const baseNorm = base.norm;

          // -------------------------------------------------------------
          // 1. RE-SORTING PIXEL MAP ENGINE
          // -------------------------------------------------------------
          if (mode === "picasso") {
            // FULL PORTRAIT CUBIST PERMUTATION (EVERY ACTIVE MODULE SCRAMBLES!)
            // Pass 1: Background empty modules (outside the 98 figure modules)
            for (let r = 0; r < totalSubRows; r++) {
              const modR = Math.floor(r / subPerModule);
              for (let c = 0; c < totalSubCols; c++) {
                const modC = Math.floor(c / subPerModule);
                if (PICASSO_LOOKUP.has(modR * cols + modC)) continue;

                const srcIdx = r * totalSubCols + c;
                if (baseActive[srcIdx] === 0) continue;

                activeBuf[srcIdx] = baseActive[srcIdx];
                normBuf[srcIdx] = baseNorm[srcIdx];
              }
            }

            // Pass 2: All 98 modules of the portrait (head, eyes, mouth, neck, shoulders, T-shirt)
            for (let r = 0; r < totalSubRows; r++) {
              const modR = Math.floor(r / subPerModule);
              const subR = r % subPerModule;

              for (let c = 0; c < totalSubCols; c++) {
                const modC = Math.floor(c / subPerModule);
                const subC = c % subPerModule;
                const spec = PICASSO_LOOKUP.get(modR * cols + modC);
                if (!spec) continue;

                const srcIdx = r * totalSubCols + c;
                if (baseActive[srcIdx] === 0) continue;

                // Stream jitter during flight
                let jitterR = 0;
                let jitterC = 0;
                if (streamTurbulence > 0.001) {
                  const noiseAngle = r * 0.28 + c * 0.22 + tSec * 6;
                  const mag = streamTurbulence * 3;
                  jitterR = Math.sin(noiseAngle) * mag;
                  jitterC = Math.cos(noiseAngle * 1.2) * mag;
                }

                // Mirrored coordinates inside the module
                const targetSubR = spec.flipY ? 8 - subR : subR;
                const targetSubC = spec.flipX ? 8 - subC : subC;

                const startR = r;
                const startC = c;
                const endR = spec.targetModR * subPerModule + targetSubR;
                const endC = spec.targetModC * subPerModule + targetSubC;

                const dR = endR - startR;
                const dC = endC - startC;

                // Divergent arced flight so modules bypass each other cleanly
                const arcDist = 12 * Math.sin(effectiveMorph * Math.PI) * intensity;
                const arcR = spec.normalR * arcDist * spec.sign;
                const arcC = spec.normalC * arcDist * spec.sign;

                const finalR = Math.round(startR + dR * effectiveMorph + arcR + jitterR);
                const finalC = Math.round(startC + dC * effectiveMorph + arcC + jitterC);

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
                    const dr = 13;
                    const dc = (121 - c) * 0.15;
                    targetR = r + dr;
                    targetC = c + dc;
                  } else if (isInside(r, c, mouthBox)) {
                    const dr = -5;
                    const dc = (c - 121) * 0.28;
                    targetR = r + dr;
                    targetC = c + dc;
                  } else if (isInside(r, c, noseBox)) {
                    const dr = -24;
                    targetR = r + dr;
                    targetC = c;
                  } else if (isInside(r, c, rightEarBox)) {
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
