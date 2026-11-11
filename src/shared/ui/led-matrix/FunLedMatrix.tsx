"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@/shared/config/tokens";

export type FunAnimationMode =
  | "swap" // Eyes and Mouth swap places
  | "rolling-ears" // Ears roll around to the edges
  | "carnival" // Total chaos: swap + rolling ears + floating nose
  | "scatter" // Shatter apart and magnetically reassemble
  | "liquid" // Melting sinusoidal horizontal slices
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

  // Tone mapping and unsharp mask
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
      normArr[idx] = Math.pow(x, gamma);
    }
  }

  return { active: activeArr, norm: normArr, drawW, drawH, startCol, startRow };
}

/**
 * Fun variant of LedMatrix with kinetic facial feature manipulation (eyes/mouth swap, rolling ears, scatter)
 */
export const FunLedMatrix = React.forwardRef<HTMLDivElement, FunLedMatrixProps>(
  (
    {
      src = "/portrait-2.png",
      mode = "swap",
      speed = 1.0,
      intensity = 1.0,
      isPlaying = true,
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
      className = "",
      ...props
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
        vx: number;
        vy: number;
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

          // Angle and velocity for scatter explosion
          const angle = Math.atan2(r - rows / 2, c - cols / 2) + (seeds[i] - 0.5) * 0.8;
          const dist = 30 + seeds[i] * 60;
          particles.push({
            modR: r,
            modC: c,
            dx: 0,
            dy: 0,
            vx: Math.cos(angle) * (1.5 + seeds[i] * 2),
            vy: Math.sin(angle) * (1.5 + seeds[i] * 2),
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
          // Initial copy to frame
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

      // Define anatomical feature bounding boxes in sub-pixel coordinates
      // In portrait-2.png with drawW=141, drawH=117, startCol=55, startRow=0:
      const eyesBox = { minR: 30, maxR: 58, minC: 86, maxC: 164, centerR: 44, centerC: 125 };
      const mouthBox = { minR: 74, maxR: 102, minC: 98, maxC: 152, centerR: 88, centerC: 125 };
      const leftEarBox = { minR: 38, maxR: 80, minC: 55, maxC: 82, centerR: 59, centerC: 68 };
      const rightEarBox = { minR: 38, maxR: 80, minC: 168, maxC: 196, centerR: 59, centerC: 182 };
      const noseBox = { minR: 54, maxR: 74, minC: 114, maxC: 136, centerR: 64, centerC: 125 };

      const isInside = (r: number, c: number, b: typeof eyesBox) =>
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

        // Reset frame buffer to clean 0
        activeBuf.fill(0);
        normBuf.fill(0);

        // Normalized time for animation loops
        const tSec = (time / 1000) * speed;

        // 1. COMPUTE FEATURE OFFSETS BASED ON ACTIVE MODE
        let eyesOffset = { dr: 0, dc: 0 };
        let mouthOffset = { dr: 0, dc: 0 };
        let leftEarOffset = { dr: 0, dc: 0 };
        let rightEarOffset = { dr: 0, dc: 0 };
        let noseOffset = { dr: 0, dc: 0 };

        const deltaSwapR = mouthBox.centerR - eyesBox.centerR; // ~44px distance

        if (isPlaying && mode !== "idle") {
          if (mode === "swap") {
            // Smooth ping-pong cycle: stays normal for 2s, smoothly swaps over 1.2s, stays swapped for 2s, swaps back
            const cycle = (tSec % 6) / 6; // 0..1 over 6 seconds
            let swapProgress = 0;

            if (cycle < 0.25) {
              swapProgress = 0; // normal
            } else if (cycle < 0.45) {
              // smooth transition 0 -> 1 with sine curve
              const localT = (cycle - 0.25) / 0.2;
              swapProgress = 0.5 - 0.5 * Math.cos(localT * Math.PI);
            } else if (cycle < 0.75) {
              swapProgress = 1; // fully swapped!
            } else if (cycle < 0.95) {
              // smooth transition 1 -> 0
              const localT = (cycle - 0.75) / 0.2;
              swapProgress = 0.5 + 0.5 * Math.cos(localT * Math.PI);
            } else {
              swapProgress = 0;
            }

            // Curve outwards slightly during flight
            const arcOut = Math.sin(swapProgress * Math.PI) * 12 * intensity;

            eyesOffset.dr = swapProgress * deltaSwapR * intensity;
            eyesOffset.dc = arcOut;

            mouthOffset.dr = -swapProgress * deltaSwapR * intensity;
            mouthOffset.dc = -arcOut;
          } else if (mode === "rolling-ears") {
            // Ears skate outward and roll up & down like little roller-skates
            const earWave = Math.sin(tSec * 2);
            const rollOutDist = 38 * intensity; // slide way out toward borders

            leftEarOffset.dc = -Math.abs(earWave) * rollOutDist;
            leftEarOffset.dr = Math.sin(tSec * 4) * 12 * intensity;

            rightEarOffset.dc = Math.abs(earWave) * rollOutDist;
            rightEarOffset.dr = -Math.sin(tSec * 4) * 12 * intensity;
          } else if (mode === "carnival") {
            // ALL TOGETHER: Swapped eyes/mouth + rolling ears + floating nose + wobbling brows!
            const swapWave = 0.5 + 0.5 * Math.sin(tSec * 1.8);
            eyesOffset.dr = swapWave * deltaSwapR * intensity;
            eyesOffset.dc = Math.cos(tSec * 2) * 8 * intensity;

            mouthOffset.dr = -swapWave * deltaSwapR * intensity;
            mouthOffset.dc = -Math.cos(tSec * 2) * 8 * intensity;

            const earWave = Math.sin(tSec * 2.5);
            leftEarOffset.dc = -Math.abs(earWave) * 42 * intensity;
            leftEarOffset.dr = Math.cos(tSec * 3) * 14 * intensity;

            rightEarOffset.dc = Math.abs(earWave) * 42 * intensity;
            rightEarOffset.dr = -Math.cos(tSec * 3) * 14 * intensity;

            noseOffset.dr = Math.sin(tSec * 5) * 6 * intensity;
            noseOffset.dc = Math.sin(tSec * 3) * 10 * intensity;
          }
        }

        // 2. COMPOSE BASE HEAD & MASKED FEATURES INTO FRAME BUFFER
        const baseActive = base.active;
        const baseNorm = base.norm;

        for (let r = 0; r < totalSubRows; r++) {
          for (let c = 0; c < totalSubCols; c++) {
            const idx = r * totalSubCols + c;
            if (baseActive[idx] === 0) continue;

            // Check if pixel belongs to a dynamic feature
            const inEyes = isInside(r, c, eyesBox);
            const inMouth = isInside(r, c, mouthBox);
            const inLeftEar = isInside(r, c, leftEarBox);
            const inRightEar = isInside(r, c, rightEarBox);
            const inNose = isInside(r, c, noseBox);

            if (mode === "liquid") {
              // Melting wavy liquid distortion across horizontal lines
              const waveOffset = Math.round(
                Math.sin(r * 0.18 + tSec * 3) * 16 * intensity +
                  Math.cos(r * 0.08 - tSec * 2) * 8 * intensity
              );
              const targetC = c + waveOffset;
              if (targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = r * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[idx];
                normBuf[targetIdx] = baseNorm[idx];
              }
              continue;
            }

            if (mode === "scatter") {
              // Modules scatter outwards
              const modR = Math.floor(r / subPerModule);
              const modC = Math.floor(c / subPerModule);
              const modIdx = modR * cols + modC;
              const p = scatterParticlesRef.current[modIdx];

              const cycleT = 0.5 + 0.5 * Math.sin(tSec * 1.5);
              const currentDx = Math.round((p ? p.targetDx : 0) * cycleT * intensity);
              const currentDy = Math.round((p ? p.targetDy : 0) * cycleT * intensity);

              const targetR = r + currentDy;
              const targetC = c + currentDx;

              if (targetR >= 0 && targetR < totalSubRows && targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = targetR * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[idx];
                normBuf[targetIdx] = baseNorm[idx];
              }
              continue;
            }

            // Static base face background (contour, hair, chin)
            if (!inEyes && !inMouth && !inLeftEar && !inRightEar && !inNose) {
              activeBuf[idx] = baseActive[idx];
              normBuf[idx] = baseNorm[idx];
            } else if (mode === "idle") {
              activeBuf[idx] = baseActive[idx];
              normBuf[idx] = baseNorm[idx];
            }
          }
        }

        // Draw animated feature layers on top if not liquid or scatter
        if (mode !== "liquid" && mode !== "scatter" && mode !== "idle") {
          // A. Draw Eyes
          for (let r = eyesBox.minR; r <= eyesBox.maxR; r++) {
            for (let c = eyesBox.minC; c <= eyesBox.maxC; c++) {
              const srcIdx = r * totalSubCols + c;
              if (baseActive[srcIdx] === 0) continue;

              const targetR = Math.round(r + eyesOffset.dr);
              const targetC = Math.round(c + eyesOffset.dc);

              if (targetR >= 0 && targetR < totalSubRows && targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = targetR * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[srcIdx];
                normBuf[targetIdx] = baseNorm[srcIdx];
              }
            }
          }

          // B. Draw Mouth
          for (let r = mouthBox.minR; r <= mouthBox.maxR; r++) {
            for (let c = mouthBox.minC; c <= mouthBox.maxC; c++) {
              const srcIdx = r * totalSubCols + c;
              if (baseActive[srcIdx] === 0) continue;

              const targetR = Math.round(r + mouthOffset.dr);
              const targetC = Math.round(c + mouthOffset.dc);

              if (targetR >= 0 && targetR < totalSubRows && targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = targetR * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[srcIdx];
                normBuf[targetIdx] = baseNorm[srcIdx];
              }
            }
          }

          // C. Draw Left Ear
          for (let r = leftEarBox.minR; r <= leftEarBox.maxR; r++) {
            for (let c = leftEarBox.minC; c <= leftEarBox.maxC; c++) {
              const srcIdx = r * totalSubCols + c;
              if (baseActive[srcIdx] === 0) continue;

              const targetR = Math.round(r + leftEarOffset.dr);
              const targetC = Math.round(c + leftEarOffset.dc);

              if (targetR >= 0 && targetR < totalSubRows && targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = targetR * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[srcIdx];
                normBuf[targetIdx] = baseNorm[srcIdx];
              }
            }
          }

          // D. Draw Right Ear
          for (let r = rightEarBox.minR; r <= rightEarBox.maxR; r++) {
            for (let c = rightEarBox.minC; c <= rightEarBox.maxC; c++) {
              const srcIdx = r * totalSubCols + c;
              if (baseActive[srcIdx] === 0) continue;

              const targetR = Math.round(r + rightEarOffset.dr);
              const targetC = Math.round(c + rightEarOffset.dc);

              if (targetR >= 0 && targetR < totalSubRows && targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = targetR * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[srcIdx];
                normBuf[targetIdx] = baseNorm[srcIdx];
              }
            }
          }

          // E. Draw Nose
          for (let r = noseBox.minR; r <= noseBox.maxR; r++) {
            for (let c = noseBox.minC; c <= noseBox.maxC; c++) {
              const srcIdx = r * totalSubCols + c;
              if (baseActive[srcIdx] === 0) continue;

              const targetR = Math.round(r + noseOffset.dr);
              const targetC = Math.round(c + noseOffset.dc);

              if (targetR >= 0 && targetR < totalSubRows && targetC >= 0 && targetC < totalSubCols) {
                const targetIdx = targetR * totalSubCols + targetC;
                activeBuf[targetIdx] = baseActive[srcIdx];
                normBuf[targetIdx] = baseNorm[srcIdx];
              }
            }
          }
        }

        // 3. CANVAS RENDER LOOP (18x18px modules with 2x2px micro-pixels)
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

            // Flat module ground
            ctx.fillStyle = isHovered ? tokens.colors.surfacePill : tokens.colors.surface;
            ctx.fillRect(modX, modY, pixelSize, pixelSize);

            // Render 9x9 micro-pixels
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

        // Loop continuously when playing or igniting
        if (isPlaying || isIgniting) {
          animId = requestAnimationFrame(render);
        }
      };

      animId = requestAnimationFrame(render);

      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    }, [
      mode,
      speed,
      intensity,
      isPlaying,
      theme,
      animPhase,
      hoveredModule,
      cols,
      rows,
      pixelSize,
      gap,
      subPixelSize,
      subPerModule,
      totalSubCols,
      totalSubRows,
      totalWidth,
      totalHeight,
    ]);

    // Handle interactive hover over 18x18px modules
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * totalWidth;
      const y = ((e.clientY - rect.top) / rect.height) * totalHeight;

      const c = Math.floor(x / (pixelSize + gap));
      const r = Math.floor(y / (pixelSize + gap));

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (!hoveredModule || hoveredModule.r !== r || hoveredModule.c !== c) {
          setHoveredModule({ r, c });
        }
      } else {
        if (hoveredModule !== null) {
          setHoveredModule(null);
        }
      }
    };

    const handlePointerLeave = () => {
      setHoveredModule(null);
    };

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{
          width: totalWidth,
          height: totalHeight,
        }}
        {...props}
      >
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="block h-full w-full cursor-crosshair touch-none"
          style={{
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
            backgroundColor: "transparent",
          }}
          aria-label="Interactive Kinetic LED Matrix Screen"
        />
      </div>
    );
  }
);

FunLedMatrix.displayName = "FunLedMatrix";
