"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@/shared/config/tokens";

export interface LedMatrixProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Single image source path (e.g. "/portrait.png") */
  src?: string;
  /** Array of image source paths for slideshow (e.g. ["/portrait.png", "/portrait-2.png"]) */
  images?: string[];
  /** Interval in milliseconds between image switches (default 8000ms) */
  interval?: number;
  /** Number of 18x18px module columns (default 28) */
  cols?: number;
  /** Number of 18x18px module rows (default 13 for 564x260 hero slot, or 24) */
  rows?: number;
  /** Size of each pseudo-matrix module square in px (default 18) */
  pixelSize?: number;
  /** Outer gap between 18x18px modules in px (default 2) */
  gap?: number;
  /** Size of each micro-pixel inside the 18px module in px (strictly 2) */
  subPixelSize?: number;
  /** Default inactive module color (default "#242424") */
  defaultColor?: string;
  /** Color theme for active image pixels: "monochrome" (crisp studio LED) or "amber" (vintage warm LED) */
  theme?: "monochrome" | "amber";
  /** Contrast multiplier for portrait shadows (default 1.0) */
  contrast?: number;
  /** Image fitting mode: "contain" (preserves natural portrait proportions) or "cover" */
  fit?: "contain" | "cover";
  /** Whether the user can interact/hover over pixels */
  interactive?: boolean;
  /** Auto-start the boot-up scan animation on load */
  autoAnimate?: boolean;
}

/**
 * Helper to process an HTMLImageElement into downsampled, high-contrast sub-pixel arrays.
 */
function processImageToSubPixels(
  img: HTMLImageElement,
  totalSubCols: number,
  totalSubRows: number,
  fit: "contain" | "cover",
  contrast: number
): { active: Uint8Array; norm: Float32Array } | null {
  const imgAspect = img.width / img.height;
  const targetAspect = totalSubCols / totalSubRows;

  let drawW = totalSubCols;
  let drawH = totalSubRows;
  let startCol = 0;
  let startRow = 0;

  if (fit === "contain") {
    if (targetAspect > imgAspect) {
      drawW = Math.round(totalSubRows * imgAspect);
      startCol = Math.round((totalSubCols - drawW) / 2);
    } else {
      drawH = Math.round(totalSubCols / imgAspect);
      startRow = Math.round((totalSubRows - drawH) / 2);
    }
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

  // High-Contrast Tone Mapping (applied strictly to active portrait pixels)
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
      let norm = Math.pow(x, gamma);
      normArr[idx] = norm;
    }
  }

  return { active: activeArr, norm: normArr };
}

/**
 * Tactile LED Matrix Component
 * - Pure Flat Inactive Modules: Inactive 18x18px modules are 100% flat #242424 with ZERO shadows,
 *   zero bevels, and zero artificial textures.
 * - High Contrast on Illuminated Pixels: Sculptural facial shadows and highlights are applied
 *   STRICTLY to the active portrait pixels (unsharp mask 1.3x + S-curve gamma 2.2).
 * - 2x2px Micro-Pixel Sub-Matrix: 9x9 grid of 2x2px micro-pixels inside each 18px module.
 * - Proportional Sampling: Aspect ratio is strictly preserved across any cols x rows (e.g. 28x13 in Hero).
 * - Spark Ignition: Organic random ignition & decay where background sparks cleanly fade to flat #242424.
 * - Multi-Photo Slideshow: Supports preloaded rotation between photos every N seconds with spark transitions.
 */
export const LedMatrix = React.forwardRef<HTMLDivElement, LedMatrixProps>(
  (
    {
      src = "/portrait.png",
      images = ["/portrait.png", "/portrait-2.png"],
      interval = 8000,
      cols = 28,
      rows = 13,
      pixelSize = 18,
      gap = 2,
      subPixelSize = 2,
      defaultColor = tokens.colors.surface,
      theme = "amber",
      contrast = 1.0,
      fit = "contain",
      interactive = true,
      autoAnimate = true,
      className = "",
      ...props
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Number of 2x2px micro-pixels inside each 18px module: 18 / 2 = 9
    const subPerModule = Math.floor(pixelSize / subPixelSize); // 9
    const totalSubCols = cols * subPerModule; // 28 * 9 = 252
    const totalSubRows = rows * subPerModule; // 13 * 9 = 117

    // Total matrix dimensions in CSS px
    const totalWidth = cols * pixelSize + (cols - 1) * gap; // 558px
    const totalHeight = rows * pixelSize + (rows - 1) * gap; // 258px

    // Active sub-pixel buffer
    const subPixelsRef = useRef<{
      active: Uint8Array;
      norm: Float32Array;
    } | null>(null);

    // Cache of processed image data for zero-delay switching
    const imageCacheRef = useRef<Map<string, { active: Uint8Array; norm: Float32Array }>>(new Map());

    // Module-level random ignition seeds (0..1)
    const moduleSeedsRef = useRef<Float32Array | null>(null);

    // Animation state
    const [animPhase, setAnimPhase] = useState<"idle" | "igniting" | "settled">("idle");
    const animStartTimeRef = useRef<number | null>(null);
    const [hoveredModule, setHoveredModule] = useState<{ r: number; c: number } | null>(null);

    // Current image index for multi-image slideshow
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const imageList = images && images.length > 0 ? images : [src];

    // Initialize pseudo-random seeds for each of the modules
    useEffect(() => {
      const seeds = new Float32Array(rows * cols);
      for (let i = 0; i < seeds.length; i++) {
        const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
        seeds[i] = x - Math.floor(x);
      }
      moduleSeedsRef.current = seeds;
    }, [rows, cols]);

    // Trigger spark-ignition animation
    const triggerIgnitionAnimation = useCallback(() => {
      setAnimPhase("igniting");
      animStartTimeRef.current = performance.now();
    }, []);

    // Preload & process all images in imageList
    useEffect(() => {
      let isMounted = true;

      imageList.forEach((url, idx) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        img.onload = () => {
          if (!isMounted) return;
          const processed = processImageToSubPixels(
            img,
            totalSubCols,
            totalSubRows,
            fit,
            contrast
          );
          if (processed) {
            imageCacheRef.current.set(url, processed);
            // If this is the current active image (or first image loaded), mount it immediately
            if (idx === 0 && !subPixelsRef.current) {
              subPixelsRef.current = processed;
              if (autoAnimate) {
                triggerIgnitionAnimation();
              } else {
                setAnimPhase("settled");
              }
            }
          }
        };
      });

      return () => {
        isMounted = false;
      };
    }, [imageList, totalSubCols, totalSubRows, fit, contrast, autoAnimate, triggerIgnitionAnimation]);

    // Slideshow interval timer (every `interval` ms, default 3000ms = 3s)
    useEffect(() => {
      if (imageList.length <= 1) return;

      const timer = setInterval(() => {
        setCurrentImageIndex((prevIdx) => {
          const nextIdx = (prevIdx + 1) % imageList.length;
          const nextUrl = imageList[nextIdx];
          const cached = imageCacheRef.current.get(nextUrl);
          if (cached) {
            subPixelsRef.current = cached;
            triggerIgnitionAnimation();
          }
          return nextIdx;
        });
      }, interval);

      return () => clearInterval(timer);
    }, [imageList, interval, triggerIgnitionAnimation]);

    // Color conversion helper for active portrait pixels
    const getLuminanceColor = (norm: number, theme: "monochrome" | "amber") => {
      if (theme === "amber") {
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

    // Render loop on canvas
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

      const render = () => {
        const subData = subPixelsRef.current;
        const seeds = moduleSeedsRef.current;

        // Clear canvas — gaps between 18x18px modules show the clean #292929 background
        ctx.clearRect(0, 0, totalWidth, totalHeight);

        const now = performance.now();
        const ignitionWindow = 600;
        const sparkPeakDuration = 220;
        const decayDuration = 500;
        const totalAnimDuration = ignitionWindow + sparkPeakDuration + decayDuration;

        let isAnimating = false;
        let elapsed = 0;

        if (animPhase === "igniting" && animStartTimeRef.current !== null) {
          elapsed = now - animStartTimeRef.current;
          if (elapsed < totalAnimDuration) {
            isAnimating = true;
          } else {
            setAnimPhase("settled");
          }
        }

        // Render each 18x18px module
        for (let r = 0; r < rows; r++) {
          const modY = r * (pixelSize + gap);

          for (let c = 0; c < cols; c++) {
            const modX = c * (pixelSize + gap);
            const modIdx = r * cols + c;
            const modSeed = seeds ? seeds[modIdx] : 0.5;
            const isHovered = hoveredModule && hoveredModule.r === r && hoveredModule.c === c;

            // Module ignition timeline
            const modIgniteTime = modSeed * ignitionWindow;
            const modAge = elapsed - modIgniteTime;

            // Draw clean, completely flat base for every module from surface token (ZERO shadows, ZERO bevels)
            ctx.fillStyle = isHovered ? tokens.colors.surfacePill : tokens.colors.surface;
            ctx.fillRect(modX, modY, pixelSize, pixelSize);

            // Render 9x9 micro-pixels of 2x2px inside this module
            for (let subR = 0; subR < subPerModule; subR++) {
              const globalR = r * subPerModule + subR;
              const py = modY + subR * subPixelSize;

              for (let subC = 0; subC < subPerModule; subC++) {
                const globalC = c * subPerModule + subC;
                const px = modX + subC * subPixelSize;

                const idx = globalR * totalSubCols + globalC;
                const isActive = subData ? subData.active[idx] === 1 : false;
                const normVal = subData ? subData.norm[idx] : 0;

                const microJitter = ((subR * 5 + subC * 11) % 9) * 12;
                const pixelAge = modAge - microJitter;

                // When settled and inactive: the module is already flat #242424, skip drawing to stay 100% flat
                if (animPhase === "settled" && !isActive && !isHovered) {
                  continue;
                }

                // Default flat inactive color: strictly #242424 (RGB 36, 36, 36)
                let finalR = 36;
                let finalG = 36;
                let finalB = 36;

                // High-contrast portrait color strictly for active pixels
                if (isActive) {
                  const targetCol = getLuminanceColor(normVal, theme);
                  finalR = targetCol.r;
                  finalG = targetCol.g;
                  finalB = targetCol.b;
                }

                // If ignition animation is running:
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

                // Hover brightness boost
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

        if (isAnimating) {
          animId = requestAnimationFrame(render);
        }
      };

      render();

      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    }, [
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
      theme,
      currentImageIndex,
    ]);

    // Handle interactive hover over 18x18px modules
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const c = Math.floor(x / (pixelSize + gap));
      const r = Math.floor(y / (pixelSize + gap));

      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        setHoveredModule({ r, c });
      } else {
        setHoveredModule(null);
      }
    };

    const handlePointerLeave = () => {
      setHoveredModule(null);
    };

    return (
      <div
        ref={ref}
        className={`relative inline-flex w-full max-w-[558px] flex-col items-center justify-center select-none bg-transparent p-0 border-0 shadow-none ${className}`}
        {...props}
      >
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="rounded-[2px] shadow-none max-w-full h-auto object-contain"
          style={{
            width: "100%",
            maxWidth: `${totalWidth}px`,
            aspectRatio: `${totalWidth} / ${totalHeight}`,
            display: "block",
            cursor: interactive ? "crosshair" : "default",
          }}
        />
      </div>
    );
  }
);

LedMatrix.displayName = "LedMatrix";