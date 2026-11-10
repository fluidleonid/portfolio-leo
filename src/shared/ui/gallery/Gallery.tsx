"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tokens } from "@/shared/config/tokens";

export interface GalleryImageItem {
  url: string;
  alt?: string;
}

export type GalleryItem = string | GalleryImageItem;

export interface GalleryProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of image URLs or items with alt text to display */
  images?: GalleryItem[];
  /** Outer container max-width in px when bleed=false (default 564) */
  maxWidth?: number;
  /** Whether the gallery should bleed out across the full viewport (default true) */
  bleed?: boolean;
  /** Wrapper fixed height in px (default 600) */
  height?: number;
  /** Wrapper inner padding in px (default 28) */
  padding?: number;
  /** Gap between images in px (default 20) */
  gap?: number;
  /** Wrapper corner radius in px (default 0) */
  cornerRadius?: number;
  /** Wrapper background color token (default tokens.colors.surface) */
  wrapperBg?: string;
  /** Custom children to render inside the wrapper */
  children?: React.ReactNode;
}

/**
 * Tactile Horizontal Gallery Component (FSD Shared UI Primitive)
 *
 * Features:
 * 1. Horizontal Breakout Track: Full-bleed unclipped track (100vw, marginLeft: -leftOffset).
 * 2. Inner Wrapper (image-scroll): #242424 tactile background, 28px padding, 0px corner radius.
 * 3. Interaction: Drag-to-scroll & Touch/Trackpad Swipe with smooth kinetic momentum.
 * 4. Segmented Progress Bar:
 *    - Number of segments corresponds to image count.
 *    - Active segment: text-content-secondary (#8C8C8C).
 *    - Inactive segments: text-content-secondary with 20% opacity.
 *    - On hover: a round dot follows cursor X along the segment line.
 *    - Tooltip above dot: aspect-ratio-preserved thumbnail + 10px Hauora alt text.
 *    - Click segment: jumps smoothly to that image.
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
    const trackRef = useRef<HTMLDivElement | null>(null);
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

    const [leftOffset, setLeftOffset] = useState<number | null>(null);
    const [viewportWidth, setViewportWidth] = useState<number | null>(null);

    // Normalize images list into uniform { url, alt } objects
    const normalizedImages = useMemo<GalleryImageItem[]>(() => {
      const list =
        images && images.length > 0
          ? images
          : ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"];

      return list.map((item, idx) => {
        if (typeof item === "string") {
          return { url: item, alt: "" };
        }
        return {
          url: item.url || "",
          alt: item.alt || "",
        };
      });
    }, [images]);

    // Active photo index tracked during horizontal scrolling
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Hover & Scrub states on the segmented progress bar
    const [isHoveringTrack, setIsHoveringTrack] = useState(false);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [hoverPos, setHoverPos] = useState<{
      x: number;
      index: number;
    } | null>(null);

    // Ref to track latest hover/scrub position without state lag on pointerup
    const currentHoverPosRef = useRef<{ x: number; index: number } | null>(null);

    // Calculate breakout dimensions so wrapper bleeds cleanly across full viewport width
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

    // Update active index based on horizontal scroll position
    const handleScroll = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      if (scrollLeft <= 5) {
        setActiveIndex(0);
        return;
      }
      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        setActiveIndex(normalizedImages.length - 1);
        return;
      }

      // Focal center of the visible track
      const focalPoint = scrollLeft + clientWidth / 2;
      let closestIndex = 0;
      let minDistance = Infinity;

      imageRefs.current.forEach((img, idx) => {
        if (!img) return;
        const imgCenter = img.offsetLeft + img.offsetWidth / 2;
        const distance = Math.abs(imgCenter - focalPoint);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      });

      setActiveIndex(closestIndex);
    }, [normalizedImages.length]);

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

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

    // Smoothly scroll to a specific image when clicking on a segment
    const scrollToImage = useCallback(
      (index: number) => {
        const container = scrollContainerRef.current;
        const targetEl = imageRefs.current[index];
        if (!container || !targetEl) return;

        cancelMomentum();
        const targetScroll =
          targetEl.offsetLeft - (container.clientWidth - targetEl.offsetWidth) / 2;

        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: "smooth",
        });
        setActiveIndex(index);
      },
      [cancelMomentum]
    );

    // Calculate position and target image index from client coordinate
    const calculateScrubPos = useCallback(
      (clientX: number) => {
        const track = trackRef.current;
        if (!track) return null;
        const rect = track.getBoundingClientRect();
        const localX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const percent = rect.width > 0 ? localX / rect.width : 0;
        const index = Math.min(
          normalizedImages.length - 1,
          Math.max(0, Math.floor(percent * normalizedImages.length))
        );
        return { x: localX, index };
      },
      [normalizedImages.length]
    );

    // Pointer Down on progress bar: starts touch dragging / scrubbing
    const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const pos = calculateScrubPos(e.clientX);
      if (!pos) return;

      currentHoverPosRef.current = pos;
      setHoverPos(pos);
      setIsHoveringTrack(true);
      setIsScrubbing(true);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    // Pointer Move on progress bar: tracks touch drag and desktop hover
    const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const pos = calculateScrubPos(e.clientX);
      if (!pos) return;

      currentHoverPosRef.current = pos;
      setHoverPos(pos);
      setIsHoveringTrack(true);
    };

    // Pointer Up on progress bar: scrolls gallery to the selected photo on tap / scrub release
    const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      setIsScrubbing(false);

      const targetPos = currentHoverPosRef.current;
      if (targetPos) {
        scrollToImage(targetPos.index);
      }

      // On mobile touch: keep preview visible briefly for confirmation before fading out
      if (e.pointerType === "touch") {
        setTimeout(() => {
          setIsHoveringTrack(false);
          setHoverPos(null);
          currentHoverPosRef.current = null;
        }, 350);
      }
    };

    const handleTrackPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsScrubbing(false);
      setIsHoveringTrack(false);
      setHoverPos(null);
      currentHoverPosRef.current = null;
    };

    const handleTrackMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isScrubbing) {
        setIsHoveringTrack(false);
        setHoverPos(null);
        currentHoverPosRef.current = null;
      }
    };

    const isMobile = viewportWidth !== null ? viewportWidth <= 640 : false;
    const effectivePadding = isMobile ? 24 : padding;
    const wrapperPaddingBottom = effectivePadding * 2 + 4;
    const innerHeight = height - effectivePadding - wrapperPaddingBottom;
    const desktopLeftPadding =
      leftOffset !== null
        ? `${leftOffset}px`
        : "calc((100vw - 564px) / 2)";
    const desktopRightPadding =
      leftOffset !== null
        ? `${Math.max(28, leftOffset)}px`
        : "calc((100vw - 564px) / 2)";
    const desktopMarginLeft =
      leftOffset !== null
        ? `-${leftOffset}px`
        : "calc(-1 * ((100vw - 564px) / 2))";

    // Tooltip position calculation with edge clamping (max-w: 240px)
    const trackWidth = trackRef.current ? trackRef.current.clientWidth : 564;
    const tooltipHalfWidth = Math.min(125, Math.max(40, trackWidth / 2 - 8));
    const clampedTooltipX = hoverPos
      ? Math.max(
          tooltipHalfWidth,
          Math.min(trackWidth - tooltipHalfWidth, hoverPos.x)
        )
      : 0;

    const hoveredItem =
      hoverPos !== null ? normalizedImages[hoverPos.index] : null;

    return (
      <div
        ref={setRefs}
        className={`relative flex flex-col select-none overflow-hidden ${
          isMobile
            ? "w-[calc(100%+32px)] -ml-[16px] -mr-[16px] max-w-[100vw]"
            : bleed
            ? "w-screen max-w-[100vw]"
            : "w-full max-w-full"
        } ${className}`}
        style={{
          height: `${height}px`,
          width:
            !isMobile && bleed
              ? viewportWidth !== null
                ? `${viewportWidth}px`
                : "100vw"
              : undefined,
          marginLeft: !isMobile && bleed ? desktopMarginLeft : undefined,
          maxWidth: !isMobile && bleed ? "100vw" : undefined,
          ...style,
        }}
        {...props}
      >
        {/* 
          1. Horizontal scroll track spanning the full screen width:
          - overflow-x-auto: Allows natural horizontal trackpad two-finger swipe, wheel, and drag.
          - [scrollbar-width:none]: Keeps scrollbar completely invisible across all browsers.
          - touch-pan-y: Lets vertical touch scroll page naturally, while horizontal gestures swipe gallery.
        */}
        <div
          ref={scrollContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative flex h-full w-full overflow-x-auto overflow-y-hidden select-none touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isPointerDown ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            touchAction: "pan-y",
            paddingLeft: isMobile ? "16px" : bleed ? desktopLeftPadding : undefined,
            paddingRight: isMobile ? "16px" : bleed ? desktopRightPadding : undefined,
          }}
        >
          {/* Inner Wrapper (image-scroll): The #242424 rounded container itself advances/scrolls horizontally */}
          <div
            className="flex w-max shrink-0 flex-row items-start select-none"
            style={{
              height: `${height}px`,
              paddingTop: `${effectivePadding}px`,
              paddingBottom: `${wrapperPaddingBottom}px`,
              paddingLeft: `${effectivePadding}px`,
              paddingRight: `${effectivePadding}px`,
              gap: `${gap}px`,
              borderRadius: `${cornerRadius}px`,
              backgroundColor: wrapperBg,
            }}
          >
            {children
              ? children
              : normalizedImages.map((item, idx) => (
                  <img
                    key={idx}
                    ref={(el) => {
                      imageRefs.current[idx] = el;
                    }}
                    src={item.url}
                    alt={item.alt || `Gallery Image ${idx + 1}`}
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

        {/* 
          2. Segmented Progress Bar (absolutely positioned between image bottom and #242424 wrapper bottom):
          - Number of segments matches photo count.
          - Active segment: text-content-secondary (#8C8C8C).
          - Inactive segments: text-content-secondary with 20% opacity.
          - On hover: a round dot appears at cursor X, with a thumbnail preview + 10px Hauora alt text.
          - Strictly equidistant: distance from wrapper bottom to 4px segment and from segment to image bottom both equal sidePadding (effectivePadding).
          - Wrapper bottom padding = effectivePadding * 2 + 4px.
        */}
        {normalizedImages.length > 1 && (
          <div
            className="pointer-events-none absolute left-0 right-0 w-full z-20 flex flex-col items-center select-none"
            style={{
              bottom: `${effectivePadding + 2}px`,
              transform: "translateY(50%)",
            }}
          >
            <div
              className="w-full max-w-[564px] mx-auto px-[40px] sm:px-[32px] pointer-events-auto select-none"
            >
              <div
                ref={trackRef}
                onPointerDown={handleTrackPointerDown}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
                onPointerCancel={handleTrackPointerCancel}
                onMouseLeave={handleTrackMouseLeave}
                className="relative flex w-full items-center gap-[4px] sm:gap-[6px] cursor-pointer touch-none select-none py-[8px]"
                style={{ touchAction: "none" }}
              >
              {normalizedImages.map((_, idx) => {
                const isActive =
                  isScrubbing && hoverPos
                    ? hoverPos.index === idx
                    : activeIndex === idx;
                return (
                  <div
                    key={idx}
                    className="group relative flex-1 py-[6px] cursor-pointer"
                  >
                    <div
                      className={`h-[4px] w-full rounded-full transition-colors duration-150 ${
                        isActive
                          ? "bg-content-secondary"
                          : "bg-content-secondary/20"
                      }`}
                    />
                  </div>
                );
              })}

              {/* Hover Dot: Round circle appearing at exact cursor X on the segment line */}
              {isHoveringTrack && hoverPos && (
                <div
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full bg-content-primary shadow-[0_0_8px_rgba(204,204,204,0.5)] z-20"
                  style={{ left: `${hoverPos.x}px` }}
                />
              )}

              {/* Hover Tooltip: Thumbnail preview preserving aspect ratio (max-w: 240px, max-h: 280px) + 10px Hauora Alt Text */}
              {isHoveringTrack && hoverPos && hoveredItem && (
                <div
                  className="pointer-events-none absolute z-40 -translate-x-1/2 bottom-[26px] flex flex-col items-center overflow-hidden rounded-[4px] border border-border-hardware bg-[#1a1a1a]/95 backdrop-blur-md p-[3px] shadow-2xl transition-opacity duration-150 animate-in fade-in"
                  style={{ left: `${clampedTooltipX}px` }}
                >
                  <div className="relative flex items-center justify-center overflow-hidden rounded-[2px] bg-[#121212] max-w-[240px] max-h-[280px]">
                    <img
                      src={hoveredItem.url}
                      alt={hoveredItem.alt || `Preview ${hoverPos.index + 1}`}
                      className="max-w-[240px] max-h-[280px] w-auto h-auto object-contain block select-none"
                    />

                    {/* 10px Hauora Alt Text Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-[6px] pt-[14px] pb-[4px]">
                      <span className="block font-hauora text-[10px] font-normal leading-[13px] text-content-primary tracking-normal text-center truncate max-w-[228px]">
                        {hoveredItem.alt && hoveredItem.alt.trim()
                          ? hoveredItem.alt
                          : `Photo ${hoverPos.index + 1}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
);

Gallery.displayName = "Gallery";
