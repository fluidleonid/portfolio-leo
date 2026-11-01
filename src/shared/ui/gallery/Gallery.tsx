"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@/shared/config/tokens";

export interface GalleryProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of image URLs to display */
  images?: string[];
  /** Outer container max-width in px when bleed=false (default 564) */
  maxWidth?: number;
  /** Whether the gallery should bleed out to the right screen edge without being clipped by the parent container (default true) */
  bleed?: boolean;
  /** Wrapper fixed height in px (default 600) */
  height?: number;
  /** Wrapper inner padding in px (default 28) */
  padding?: number;
  /** Gap between images in px (default 20) */
  gap?: number;
  /** Wrapper corner radius in px (default 0 - sharp rectangular) */
  cornerRadius?: number;
  /** Wrapper background color token (default tokens.colors.surface) */
  wrapperBg?: string;
  /** Custom children to render inside the wrapper */
  children?: React.ReactNode;
}

/**
 * Tactile Horizontal Gallery Component (FSD Shared UI Primitive)
 *
 * Structure:
 * 1. Outer Container: Full-bleed unclipped track (100vw, marginLeft: -leftOffset)
 * 2. Inner Wrapper (image-scroll): Height 600px, 28px padding, 0px corner radius, and surface background.
 *    Expands to hold all images and scrolls together with them.
 * 3. Images: Pure images only, filling the 544px inner height while strictly preserving aspect ratio.
 *    Zero shadows, zero texts/captions, zero border radiuses.
 * 4. Interaction: Drag-to-scroll & Touch Swipe ONLY (mouse drag, trackpad click-drag, touch swipe with momentum).
 *    Mouse wheel scroll is completely decoupled from gallery so vertical page scrolling flows naturally.
 */
export const Gallery = React.forwardRef<HTMLDivElement, GalleryProps>(
  (
    {
      images,
      maxWidth = tokens.geometry.containerWidth,
      bleed = true,
      height = tokens.geometry.galleryHeight,
      padding = tokens.geometry.galleryPadding,
      gap = tokens.geometry.galleryGap,
      cornerRadius = 0,
      wrapperBg = tokens.colors.surface,
      className = "",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [leftOffset, setLeftOffset] = useState<number | null>(null);
    const [viewportWidth, setViewportWidth] = useState<number | null>(null);

    // Calculate breakout dimensions so wrapper is never clipped on left or right by 564px parent
    useEffect(() => {
      if (!bleed) return;

      const updateDimensions = () => {
        if (!containerRef.current) return;
        const parent = containerRef.current.parentElement;
        const parentRect = parent
          ? parent.getBoundingClientRect()
          : containerRef.current.getBoundingClientRect();
        const clientW = document.documentElement.clientWidth;
        const offset = Math.max(0, parentRect.left);
        setLeftOffset(offset);
        setViewportWidth(clientW);
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }, [bleed]);

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    // Drag-to-scroll & Touch Swipe interaction states
    const [isPointerDown, setIsPointerDown] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Physics refs
    const startXRef = useRef<number>(0);
    const startScrollLeftRef = useRef<number>(0);
    const lastXRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const velocityRef = useRef<number>(0);
    const momentumRafRef = useRef<number | null>(null);

    // Cancel active momentum animation
    const cancelMomentum = useCallback(() => {
      if (momentumRafRef.current !== null) {
        cancelAnimationFrame(momentumRafRef.current);
        momentumRafRef.current = null;
      }
    }, []);

    // Pointer Down: Start tracking drag / swipe
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      cancelMomentum();

      setIsPointerDown(true);
      setIsDragging(false);

      startXRef.current = e.clientX;
      startScrollLeftRef.current = container.scrollLeft;
      lastXRef.current = e.clientX;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;

      container.setPointerCapture(e.pointerId);
    };

    // Pointer Move: Drag / swipe container horizontally
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const currentX = e.clientX;
      const deltaX = currentX - startXRef.current;

      if (Math.abs(deltaX) > 4) {
        setIsDragging(true);
      }

      container.scrollLeft = startScrollLeftRef.current - deltaX;

      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 10) {
        velocityRef.current = (currentX - lastXRef.current) / dt;
        lastXRef.current = currentX;
        lastTimeRef.current = now;
      }
    };

    // Pointer Up: End drag and apply smooth momentum flick
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDown) return;

      const container = scrollContainerRef.current;
      if (container) {
        try {
          container.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }

      setIsPointerDown(false);

      // Apply kinetic momentum flick
      const initialVelocity = velocityRef.current;
      if (Math.abs(initialVelocity) > 0.15 && container) {
        let vel = -initialVelocity * 14;
        const decay = () => {
          if (!container || Math.abs(vel) < 0.3) {
            momentumRafRef.current = null;
            return;
          }
          container.scrollLeft += vel;
          vel *= 0.93;
          momentumRafRef.current = requestAnimationFrame(decay);
        };
        momentumRafRef.current = requestAnimationFrame(decay);
      }

      setTimeout(() => {
        setIsDragging(false);
      }, 50);
    };

    const innerHeight = height - padding * 2;

    const displayImages =
      images && images.length > 0
        ? images
        : ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"];

    const isMobile = viewportWidth !== null ? viewportWidth <= 640 : false;

    return (
      <div
        ref={setRefs}
        className={`relative flex select-none overflow-hidden ${
          isMobile
            ? "w-[calc(100%+32px)] -ml-[16px] -mr-[16px] max-w-[100vw]"
            : "w-full max-w-full"
        } ${className}`}
        style={{
          width:
            !isMobile && bleed && viewportWidth && leftOffset !== null
              ? `${Math.max(maxWidth, viewportWidth - leftOffset)}px`
              : undefined,
          maxWidth:
            !isMobile && bleed && viewportWidth && leftOffset !== null
              ? `${viewportWidth - leftOffset}px`
              : undefined,
          ...style,
        }}
        {...props}
      >
        {/* 
          Horizontal scroll container:
          - Wheel events: NOT intercepted (page scrolls normally without getting trapped).
          - overflow-x-hidden: Prevents accidental trackpad wheel translation, allowing ONLY drag/swipe.
          - touch-action: pan-y: Lets vertical touch scroll page naturally, while horizontal touch swipes gallery.
        */}
        <div
          ref={scrollContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative flex h-full w-full overflow-x-hidden overflow-y-hidden select-none touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isPointerDown ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            touchAction: "pan-y",
            paddingLeft: isMobile ? "16px" : undefined,
            paddingRight: isMobile ? "16px" : undefined,
          }}
        >
          {/* Inner Wrapper (image-scroll) */}
          <div
            className="flex w-max shrink-0 flex-row items-center select-none"
            style={{
              height: `${height}px`,
              padding: `${padding}px`,
              gap: `${gap}px`,
              borderRadius: `${cornerRadius}px`,
              backgroundColor: wrapperBg,
            }}
          >
            {children
              ? children
              : displayImages.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Gallery Image ${idx + 1}`}
                    draggable={false}
                    className="pointer-events-none shrink-0 rounded-none object-cover select-none"
                    style={{
                      height: `${innerHeight}px`,
                      width: "auto",
                      boxShadow: "none",
                      filter: "none",
                      borderRadius: 0,
                    }}
                  />
                ))}
          </div>
        </div>
      </div>
    );
  }
);

Gallery.displayName = "Gallery";
