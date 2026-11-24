"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  /** Play a one-time choreographed scroll + progress-bar peek hint when scrolled into view */
  hintOnView?: boolean;
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
      hintOnView = false,
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

    // One-time interactive spotlight onboarding hint (scroll freeze + dark backdrop + bottom caption + keynote tap/drag)
    const [hintState, setHintState] = useState<{
      x: number;
      index: number;
      opacity: number;
      rippleProgress: number;
      dragPulse: number;
      dragRippleProgress: number;
      isPressed: boolean;
    } | null>(null);
    const [isSpotlightActive, setIsSpotlightActive] = useState(false);
    const [isGalleryElevated, setIsGalleryElevated] = useState(false);
    const [showHintText, setShowHintText] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [spotlightBannerTop, setSpotlightBannerTop] = useState<number>(24);
    const [portalMounted, setPortalMounted] = useState(false);
    const hasPlayedHintRef = useRef(false);
    const hintRafRef = useRef<number | null>(null);
    const scrollCenterRafRef = useRef<number | null>(null);
    const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const elevateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hintGraceUntilRef = useRef<number>(0);
    const lockedScrollYRef = useRef<number | null>(null);

    useEffect(() => {
      setPortalMounted(true);
      if (typeof window !== "undefined") {
        const touch =
          window.matchMedia("(pointer: coarse)").matches ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0;
        setIsTouchDevice(touch);
      }
    }, []);

    const scheduleGalleryLower = useCallback(() => {
      if (elevateTimeoutRef.current !== null) {
        clearTimeout(elevateTimeoutRef.current);
      }
      elevateTimeoutRef.current = setTimeout(() => {
        setIsGalleryElevated(false);
        elevateTimeoutRef.current = null;
      }, 900);
    }, []);

    const exitOnboarding = useCallback((force = true) => {
      if (!force && performance.now() < hintGraceUntilRef.current) {
        return;
      }
      if (hintTimeoutRef.current !== null) {
        clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
      if (textTimeoutRef.current !== null) {
        clearTimeout(textTimeoutRef.current);
        textTimeoutRef.current = null;
      }
      if (textHideTimeoutRef.current !== null) {
        clearTimeout(textHideTimeoutRef.current);
        textHideTimeoutRef.current = null;
      }
      if (scrollCenterRafRef.current !== null) {
        cancelAnimationFrame(scrollCenterRafRef.current);
        scrollCenterRafRef.current = null;
      }
      if (hintRafRef.current !== null) {
        cancelAnimationFrame(hintRafRef.current);
        hintRafRef.current = null;
      }
      lockedScrollYRef.current = null;
      setHintState(null);
      setShowHintText(false);
      setIsSpotlightActive(false);
      scheduleGalleryLower();
    }, [scheduleGalleryLower]);

    // Hard-freeze vertical page scroll while spotlight onboarding is active
    useEffect(() => {
      if (!isSpotlightActive) return;

      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyTouchAction = document.body.style.touchAction;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      const updateBannerPosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const desiredTop = Math.round(rect.bottom + 24);
        setSpotlightBannerTop(
          Math.min(window.innerHeight - 48, Math.max(16, desiredTop))
        );
      };

      updateBannerPosition();
      const posInterval = window.setInterval(updateBannerPosition, 50);

      const preventScroll = (e: Event) => {
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      const clampScroll = () => {
        if (lockedScrollYRef.current !== null) {
          window.scrollTo(0, lockedScrollYRef.current);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          exitOnboarding();
        }
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      window.addEventListener("touchmove", preventScroll, { passive: false });
      window.addEventListener("scroll", clampScroll, { passive: true });
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.clearInterval(posInterval);
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.touchAction = prevBodyTouchAction;
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("scroll", clampScroll);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [isSpotlightActive, exitOnboarding]);

    // Trigger 1-time staged onboarding: 1) Smooth overlay fade + gentle center -> 2) Code-scramble text -> 3) Tap/drag animation
    useEffect(() => {
      if (!hintOnView || normalizedImages.length <= 1) return;
      const el = containerRef.current;
      if (!el) return;

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const easeOutCubic = (t: number) =>
        1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

      const triggerSpotlight = () => {
        if (hasPlayedHintRef.current) return;
        hasPlayedHintRef.current = true;

        if (
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          return;
        }

        // 1. Capture current scrollY & smoothly glide to centered Y over 380ms (zero harsh 0ms teleport!)
        const startScrollY = window.scrollY;
        const rect = el.getBoundingClientRect();
        const targetScrollY = Math.max(
          0,
          Math.round(startScrollY + rect.top - (window.innerHeight - rect.height) / 2)
        );
        lockedScrollYRef.current = startScrollY;

        // Pre-calculate final bottom position so caption never jumps vertically
        const finalGalleryBottom = (window.innerHeight + rect.height) / 2;
        setSpotlightBannerTop(
          Math.min(window.innerHeight - 48, Math.max(16, Math.round(finalGalleryBottom + 24)))
        );

        // Step 1: Smoothly fade in dark backdrop overlay under gallery
        if (elevateTimeoutRef.current !== null) {
          clearTimeout(elevateTimeoutRef.current);
          elevateTimeoutRef.current = null;
        }
        hintGraceUntilRef.current = performance.now() + 600;
        setIsGalleryElevated(true);
        setIsSpotlightActive(true);

        const centerStart = performance.now();
        const CENTER_DURATION = 380;
        const animateCenter = (now: number) => {
          const t = Math.min(1, (now - centerStart) / CENTER_DURATION);
          const nextY = Math.round(
            startScrollY + (targetScrollY - startScrollY) * easeOutCubic(t)
          );
          lockedScrollYRef.current = nextY;
          window.scrollTo(0, nextY);
          if (t < 1) {
            scrollCenterRafRef.current = requestAnimationFrame(animateCenter);
          } else {
            scrollCenterRafRef.current = null;
          }
        };
        scrollCenterRafRef.current = requestAnimationFrame(animateCenter);

        // Step 2 (at 380ms): Smoothly fade in hint text (no scramble), hold for 1.5s max, then fade out
        textTimeoutRef.current = setTimeout(() => {
          setShowHintText(true);
          textHideTimeoutRef.current = setTimeout(() => {
            setShowHintText(false);
          }, 1500);
        }, 380);

        // Step 3 (at 820ms): Play keynote tap & drag animation
        hintTimeoutRef.current = setTimeout(() => {
          const scrollEl = scrollContainerRef.current;
          const trackEl = trackRef.current;
          if (!scrollEl || !trackEl) {
            exitOnboarding();
            return;
          }

          const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
          if (maxScroll <= 16) {
            exitOnboarding();
            return;
          }

          const peekScroll = Math.min(
            maxScroll,
            Math.max(130, Math.min(250, scrollEl.clientWidth * 0.32))
          );
          const trackW = trackEl.clientWidth || 564;
          const count = normalizedImages.length;
          const startX = (0.5 / count) * trackW;
          const targetX = (1.5 / count) * trackW;

          const PHASE_TAP = 820;
          const PHASE_DRAG = 1650;
          const PHASE_HOLD = 850;
          const PHASE_RETURN = 1280;
          const PHASE_FADE_OUT = 850;
          const T1 = PHASE_TAP;
          const T2 = T1 + PHASE_DRAG;
          const T3 = T2 + PHASE_HOLD;
          const T4 = T3 + PHASE_RETURN;
          const TOTAL = T4 + PHASE_FADE_OUT;

          const startTime = performance.now();
          let startedExitFade = false;

          const tick = (now: number) => {
            const elapsed = now - startTime;

            if (elapsed < T1) {
              const t = elapsed / PHASE_TAP;
              const fadeIn = easeOutCubic(Math.min(1, t / 0.54));
              const ripple = t > 0.22 ? Math.min(1, (t - 0.22) / 0.78) : 0;
              scrollEl.scrollLeft = 0;
              setHintState({
                x: startX,
                index: 0,
                opacity: fadeIn,
                rippleProgress: ripple,
                dragPulse: 0,
                dragRippleProgress: 0,
                isPressed: t >= 0.28,
              });
              hintRafRef.current = requestAnimationFrame(tick);
            } else if (elapsed < T2) {
              const dragElapsed = elapsed - T1;
              const t = dragElapsed / PHASE_DRAG;
              const e = easeInOutCubic(t);
              const dragPulse = 0.5 - 0.5 * Math.cos((dragElapsed / 1100) * Math.PI * 2);
              const dragRippleProgress = (dragElapsed % 1250) / 1250;
              scrollEl.scrollLeft = peekScroll * e;
              setHintState({
                x: startX + (targetX - startX) * e,
                index: t > 0.45 ? 1 : 0,
                opacity: 1,
                rippleProgress: 0,
                dragPulse,
                dragRippleProgress,
                isPressed: true,
              });
              hintRafRef.current = requestAnimationFrame(tick);
            } else if (elapsed < T3) {
              const dragElapsed = elapsed - T1;
              const dragPulse = 0.5 - 0.5 * Math.cos((dragElapsed / 1100) * Math.PI * 2);
              const dragRippleProgress = (dragElapsed % 1250) / 1250;
              scrollEl.scrollLeft = peekScroll;
              setHintState({
                x: targetX,
                index: 1,
                opacity: 1,
                rippleProgress: 0,
                dragPulse,
                dragRippleProgress,
                isPressed: true,
              });
              hintRafRef.current = requestAnimationFrame(tick);
            } else if (elapsed < T4) {
              const dragElapsed = elapsed - T1;
              const t = (elapsed - T3) / PHASE_RETURN;
              const e = easeInOutCubic(t);
              const dragPulse = 0.5 - 0.5 * Math.cos((dragElapsed / 1100) * Math.PI * 2);
              const dragRippleProgress = (dragElapsed % 1250) / 1250;
              scrollEl.scrollLeft = peekScroll * (1 - e);
              setHintState({
                x: targetX + (startX - targetX) * e,
                index: t > 0.55 ? 0 : 1,
                opacity: 1,
                rippleProgress: 0,
                dragPulse,
                dragRippleProgress,
                isPressed: true,
              });
              hintRafRef.current = requestAnimationFrame(tick);
            } else if (elapsed < TOTAL) {
              // Step 4: Velvety 850ms synchronized fade-out — gallery stays z-60 above overlay until overlay finishes fading
              if (!startedExitFade) {
                startedExitFade = true;
                setShowHintText(false);
                setIsSpotlightActive(false);
                scheduleGalleryLower();
                lockedScrollYRef.current = null;
              }
              const t = (elapsed - T4) / PHASE_FADE_OUT;
              const fadeOut = 1 - easeInOutCubic(t);
              scrollEl.scrollLeft = 0;
              setHintState({
                x: startX,
                index: 0,
                opacity: fadeOut,
                rippleProgress: 0,
                dragPulse: 0,
                dragRippleProgress: 0,
                isPressed: true,
              });
              hintRafRef.current = requestAnimationFrame(tick);
            } else {
              scrollEl.scrollLeft = 0;
              lockedScrollYRef.current = null;
              setActiveIndex(0);
              setHintState(null);
              setShowHintText(false);
              setIsSpotlightActive(false);
              hintRafRef.current = null;
            }
          };

          hintRafRef.current = requestAnimationFrame(tick);
        }, 820);
      };

      const checkPositionOnScroll = () => {
        if (hasPlayedHintRef.current) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const galleryCenter = rect.top + rect.height / 2;
        if (galleryCenter <= vh * 0.62 && galleryCenter >= vh * 0.2) {
          triggerSpotlight();
        }
      };

      window.addEventListener("scroll", checkPositionOnScroll, { passive: true });
      checkPositionOnScroll();

      return () => {
        window.removeEventListener("scroll", checkPositionOnScroll);
        if (elevateTimeoutRef.current !== null) {
          clearTimeout(elevateTimeoutRef.current);
          elevateTimeoutRef.current = null;
        }
        exitOnboarding();
      };
    }, [hintOnView, normalizedImages.length, exitOnboarding, scheduleGalleryLower]);

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

      if (isSpotlightActive) {
        if (performance.now() < hintGraceUntilRef.current) return;
        exitOnboarding(true);
      }
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

    // Pointer Down on progress bar: starts touch dragging / scrubbing (dismisses hint immediately)
    const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (isSpotlightActive) {
        exitOnboarding(true);
      }
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

    // Pointer Move on progress bar: tracks touch drag and desktop hover (dismisses hint after brief grace)
    const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (isSpotlightActive) {
        if (performance.now() < hintGraceUntilRef.current) return;
        exitOnboarding(true);
      }
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

    // Combine active user hover/scrub with one-time onboarding hint overlay
    const activeOverlayPos =
      isHoveringTrack && hoverPos ? hoverPos : hintState;
    const overlayOpacity =
      isHoveringTrack && hoverPos ? 1 : (hintState?.opacity ?? 0);

    // Tooltip position calculation with edge clamping (max-w: 240px)
    const trackWidth = trackRef.current ? trackRef.current.clientWidth : 564;
    const tooltipHalfWidth = Math.min(125, Math.max(40, trackWidth / 2 - 8));
    const clampedTooltipX = activeOverlayPos
      ? Math.max(
          tooltipHalfWidth,
          Math.min(trackWidth - tooltipHalfWidth, activeOverlayPos.x)
        )
      : 0;

    const hoveredItem =
      activeOverlayPos !== null
        ? normalizedImages[activeOverlayPos.index]
        : null;

    const spotlightPortal =
      portalMounted && hintOnView
        ? createPortal(
            <>
              {/* Dark Spotlight Overlay UNDER the elevated gallery (z-55 < gallery z-60) */}
              <div
                aria-hidden="true"
                className={`fixed inset-0 z-[55] bg-black/75 backdrop-blur-[2px] transition-opacity duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isSpotlightActive
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              />

              {/* Clean Bottom Text Hint BELOW the gallery — device-adapted, fades smoothly for 1.5s max */}
              <div
                role="status"
                aria-live="polite"
                style={{ top: `${spotlightBannerTop}px` }}
                className={`fixed left-1/2 -translate-x-1/2 z-[62] w-full max-w-[calc(100vw-32px)] text-center select-none pointer-events-none transition-opacity duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  showHintText ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="font-hauora text-[18px] sm:text-[20px] font-medium leading-[26px] text-content-primary tracking-normal">
                  {isTouchDevice
                    ? "Swipe or scrub the bar"
                    : "Drag or scrub the bar"}
                </span>
              </div>
            </>,
            document.body
          )
        : null;

    return (
      <>
      {spotlightPortal}
      <div
        ref={setRefs}
        className={`relative flex flex-col select-none overflow-hidden ${
          isGalleryElevated ? "z-[60]" : ""
        } ${
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
                    : hintState
                    ? hintState.index === idx
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

              {/* Hover / Hint Dot + Keynote Tap Ripple & Held Touch Halo (single concentric anchor, z-50 above everything) */}
              {activeOverlayPos && (
                <div
                  className="pointer-events-none absolute z-50 h-0 w-0"
                  style={{ left: `${activeOverlayPos.x}px`, top: "50%" }}
                >
                  {/* Keynote Tap/Click Expanding Ripple Ring (initial strong tap pulse) */}
                  {hintState &&
                    hintState.rippleProgress > 0 &&
                    hintState.rippleProgress < 1 && (
                      <div
                        className="absolute left-0 top-0 h-[18px] w-[18px] rounded-full border-[1.5px] border-white/85"
                        style={{
                          transform: `translate(-50%, -50%) scale(${0.65 + hintState.rippleProgress * 2.2})`,
                          opacity: (1 - hintState.rippleProgress) * 0.85,
                        }}
                      />
                    )}

                  {/* Subtle Continuous Drag Pulse Ring (softer echo of initial pulse while dragging/holding/returning) */}
                  {hintState &&
                    hintState.dragRippleProgress > 0 &&
                    hintState.dragRippleProgress < 1 && (
                      <div
                        className="absolute left-0 top-0 h-[20px] w-[20px] rounded-full border border-white/45"
                        style={{
                          transform: `translate(-50%, -50%) scale(${0.95 + hintState.dragRippleProgress * 0.95})`,
                          opacity:
                            Math.sin(hintState.dragRippleProgress * Math.PI) *
                            (1 - hintState.dragRippleProgress * 0.4) *
                            0.38 *
                            overlayOpacity,
                        }}
                      />
                    )}

                  {/* Held Virtual Pointer Halo — subtly breathes during drag and melts out smoothly */}
                  {hintState && (
                    <div
                      className="absolute left-0 top-0 h-[26px] w-[26px] rounded-full bg-white/15 border border-white/40 shadow-[0_0_14px_rgba(255,255,255,0.2)]"
                      style={{
                        transform: `translate(-50%, -50%) scale(${
                          hintState.isPressed
                            ? (0.86 + overlayOpacity * 0.14) * (1 + hintState.dragPulse * 0.12)
                            : 0.65
                        })`,
                        opacity: hintState.isPressed
                          ? overlayOpacity * (0.58 + hintState.dragPulse * 0.14)
                          : 0,
                      }}
                    />
                  )}

                  {/* Core Glowing Scrubber Dot — 70% opacity during hint so it feels soft and refined */}
                  <div
                    className="absolute left-0 top-0 h-[8px] w-[8px] rounded-full bg-content-primary shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{
                      transform: `translate(-50%, -50%) scale(${
                        hintState?.isPressed ? 1.15 + (hintState.dragPulse ?? 0) * 0.08 : 1
                      })`,
                      opacity: hintState ? overlayOpacity * 0.7 : overlayOpacity,
                    }}
                  />
                </div>
              )}

              {/* Hover / Hint Tooltip: Thumbnail preview with gentle breathe-in/out scale */}
              {activeOverlayPos && hoveredItem && (
                <div
                  className="pointer-events-none absolute z-40 bottom-[26px] flex flex-col items-center overflow-hidden rounded-[4px] border border-border-hardware bg-[#1a1a1a]/95 backdrop-blur-md p-[3px] shadow-2xl origin-bottom"
                  style={{
                    left: `${clampedTooltipX}px`,
                    opacity: overlayOpacity,
                    transform: `translateX(-50%) translateY(${(1 - overlayOpacity) * 6}px) scale(${0.94 + overlayOpacity * 0.06})`,
                  }}
                >
                  <div className="relative flex items-center justify-center overflow-hidden rounded-[2px] bg-[#121212] max-w-[240px] max-h-[280px]">
                    <img
                      src={hoveredItem.url}
                      alt={hoveredItem.alt || `Preview ${activeOverlayPos.index + 1}`}
                      className="max-w-[240px] max-h-[280px] w-auto h-auto object-contain block select-none"
                    />

                    {/* 10px Hauora Alt Text Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-[6px] pt-[14px] pb-[4px]">
                      <span className="block font-hauora text-[10px] font-normal leading-[13px] text-content-primary tracking-normal text-center truncate max-w-[228px]">
                        {hoveredItem.alt && hoveredItem.alt.trim()
                          ? hoveredItem.alt
                          : `Photo ${activeOverlayPos.index + 1}`}
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
      </>
    );
  }
);

Gallery.displayName = "Gallery";
