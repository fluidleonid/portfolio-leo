"use client";

import React, { useState } from "react";
import {
  Button,
  ButtonLamp,
  ButtonDownload,
  Knob,
  Section,
  LedMatrix,
} from "@/shared/ui";
import { tokens } from "@/shared/config";

export type NavItem = "works" | "index" | "experience" | "about";

export interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onNavChange"> {
  /** Initial navigation selection (default "index") */
  defaultNav?: NavItem;
  /** Callback on navigation change */
  onNavChange?: (nav: NavItem) => void;
  /** Active theme for LED matrix */
  theme?: "monochrome" | "amber";
}

/**
 * 1:1 Complete Hero Section from Figma Node `hero (46:1455)`
 * Fully organized as an FSD Widget with Design Tokens
 */
export const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      defaultNav = "index",
      onNavChange,
      theme = "amber",
      className = "",
      ...props
    },
    ref
  ) => {
    const [selectedNav, setSelectedNav] = useState<NavItem>(defaultNav);
    const [hoveredNav, setHoveredNav] = useState<NavItem | null>(null);
    const navContainerRef = React.useRef<HTMLDivElement | null>(null);
    const [navWidth, setNavWidth] = useState<number>(406);

    // Responsive width measurement for NAV section to adjust padding/ray offsets without scaling buttons
    React.useEffect(() => {
      const updateWidth = () => {
        if (!navContainerRef.current) return;
        setNavWidth(navContainerRef.current.clientWidth);
      };

      updateWidth();
      const ro = new ResizeObserver(updateWidth);
      if (navContainerRef.current) ro.observe(navContainerRef.current);
      window.addEventListener("resize", updateWidth);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", updateWidth);
      };
    }, []);

    // Exact snap angle configuration from Figma (works top-left: -58°, index bottom-left: -122°)
    const snapMap: Record<NavItem, number> = {
      works: -58,
      index: -122,
      experience: 58,
      about: 122,
    };

    const snapAngles = [-122, -58, 58, 122];

    const activeNav = hoveredNav ?? selectedNav;
    const knobTargetAngle = snapMap[activeNav];

    const handleSelectNav = (item: NavItem) => {
      setSelectedNav(item);
      onNavChange?.(item);

      if (typeof window !== "undefined") {
        if (item === "index") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const el = document.getElementById(item);
          if (el) {
            const rect = el.getBoundingClientRect();
            const targetScroll = Math.max(0, rect.top + window.scrollY - 100);
            window.scrollTo({ top: targetScroll, behavior: "smooth" });
          }
        }
      }
    };

    const handleKnobSnap = (angle: number) => {
      let nearest: NavItem = "index";
      let minDiff = Infinity;

      (Object.keys(snapMap) as NavItem[]).forEach((key) => {
        const diff = Math.abs(snapMap[key] - angle);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = key;
        }
      });

      handleSelectNav(nearest);
    };

    // Calculate dynamic anchor positions for NAV rays and labels based on container width
    const cx = navWidth / 2;
    // Left side: lines become shorter and texts shift slightly horizontally while keeping full 18px text
    const leftLabelEnd = Math.max(48, Math.min(92, cx - 58));
    const leftRayEnd = leftLabelEnd + 6;
    const leftTurnX = Math.max(leftRayEnd + 4, cx - 48);

    // Right side: 'experience' width ~82px, 'about' width ~44px
    const rightLabel1Start = Math.min(294, Math.max(cx + 46, navWidth - 16 - 78));
    const rightRay1End = rightLabel1Start - 6;
    const rightTurn1X = Math.min(rightRay1End - 4, cx + 48);

    const rightLabel2Start = Math.min(338, Math.max(cx + 46, navWidth - 16 - 44));
    const rightRay2End = rightLabel2Start - 6;
    const rightTurn2X = Math.min(rightRay2End - 4, cx + 48);

    return (
      <header
        id="top"
        ref={ref}
        className={`relative flex w-full max-w-[564px] flex-col gap-[24px] sm:gap-[32px] select-none ${className}`}
        aria-label="Portfolio Introduction"
        {...props}
      >
        {/* 1. TITLE BLOCK (Figma node 46:1454, 564x104px) */}
        <div className="flex w-full flex-col gap-[8px]">
          <h1 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
            Leonid Dmitriev
          </h1>
          <p className="text-[16px] sm:text-[18px] font-medium leading-[22px] sm:leading-[24px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
            Product Designer · Frontend-fluent{"\n"}
            4+ years at B2B(2C) across FinTech,{"\n"}
            Productivity, Entertainment & AI products
          </p>
        </div>

        {/* 2. INTERACTIVE IMAGE / LED MATRIX (Figma node 46:1646, 564x258px) */}
        <div className="relative flex w-full max-w-[564px] h-[258px] items-center justify-center overflow-hidden">
          <LedMatrix
            images={["/portrait.png", "/portrait-2.png"]}
            interval={8000}
            cols={28}
            rows={13}
            pixelSize={18}
            gap={2}
            subPixelSize={2}
            theme={theme}
            fit="contain"
          />
        </div>

        {/* 3. ROW 1: NAVIGATION + CV in ONE SINGLE ROW (Preserves 2-row layout, buttons stay full 1:1 size) */}
        <div className="flex w-full flex-row items-center justify-between gap-[8px] sm:gap-[32px]">
          {/* NAV Section */}
          <div ref={navContainerRef} className="relative flex-1 min-w-0 sm:flex-initial sm:w-[406px]">
            <Section label="NAV" className="relative flex h-[124px] w-full sm:w-[406px] items-center justify-center p-[16px]"
            >
              {/* Radial guide lines adaptively anchored to centered knob */}
              <svg
                className="pointer-events-none absolute inset-0 h-[124px] w-full"
                viewBox={`0 0 ${navWidth} 124`}
                fill="none"
              >
                {/* Top-left radial ray + horizontal line to "works" */}
                <path
                  d={`M${cx - 35.62} 39.74 L${leftTurnX} 32 H${leftRayEnd}`}
                  stroke={activeNav === "works" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />

                {/* Bottom-left radial ray + horizontal line to "index" */}
                <path
                  d={`M${cx - 35.62} 84.26 L${leftTurnX} 92 H${leftRayEnd}`}
                  stroke={activeNav === "index" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />

                {/* Top-right radial ray + horizontal line to "experience" */}
                <path
                  d={`M${cx + 35.62} 39.74 L${rightTurn1X} 32 H${rightRay1End}`}
                  stroke={activeNav === "experience" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />

                {/* Bottom-right radial ray + horizontal line to "about" */}
                <path
                  d={`M${cx + 35.62} 84.26 L${rightTurn2X} 92 H${rightRay2End}`}
                  stroke={activeNav === "about" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />
              </svg>

              {/* Left Column: "works" and "index" */}
              <a
                href="#works"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectNav("works");
                }}
                onMouseEnter={() => setHoveredNav("works")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ right: `${navWidth - leftLabelEnd}px` }}
                className="absolute top-[32px] -translate-y-1/2 cursor-pointer text-right text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
              >
                works
              </a>

              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectNav("index");
                }}
                onMouseEnter={() => setHoveredNav("index")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ right: `${navWidth - leftLabelEnd}px` }}
                className="absolute top-[92px] -translate-y-1/2 cursor-pointer text-right text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
              >
                index
              </a>

              {/* Centered Rotary Knob - 100% full original size without scaling */}
              <div
                style={{ left: `${cx}px` }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <Knob
                  value={knobTargetAngle}
                  snapAngles={snapAngles}
                  onSnap={handleKnobSnap}
                  aria-label="Section Navigation Knob"
                />
              </div>

              {/* Right Column: "experience" and "about" */}
              <button
                type="button"
                onClick={() => handleSelectNav("experience")}
                onMouseEnter={() => setHoveredNav("experience")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ left: `${rightLabel1Start}px` }}
                className="absolute top-[32px] -translate-y-1/2 cursor-pointer text-left text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
              >
                experience
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav("about")}
                onMouseEnter={() => setHoveredNav("about")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ left: `${rightLabel2Start}px` }}
                className="absolute top-[92px] -translate-y-1/2 cursor-pointer text-left text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
              >
                about
              </button>
            </Section>
          </div>

          {/* CV Download Section (Buttons stay 100% full 60px original size, section width adapts) */}
          <Section label="CV" className="flex h-[124px] w-[96px] sm:w-[124px] shrink-0 items-center justify-center p-[16px]"
          >
            <ButtonDownload aria-label="Download CV" />
          </Section>
        </div>

        {/* 4. ROW 2: CONTACTS (COMM) + PET PROJECTS (PET) in ONE SINGLE ROW (Buttons stay full 44px size) */}
        <div className="flex w-full flex-row items-center justify-between gap-[8px] sm:gap-[32px]">
          {/* COMM Section with 3 tactile pills (Buttons stay full 44px size) */}
          <Section label="COMM" className="flex h-[124px] flex-1 sm:flex-initial sm:w-[290px] min-w-0 flex-row items-center justify-center gap-[8px] sm:gap-[16px] p-[16px]"
          >
            <a
              href="https://linkedin.com/in/leoniddmitriev"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer shrink-0"
            >
              <Button label="in" size="responsive" aria-label="LinkedIn Profile" />
            </a>
            <a
              href="https://t.me/leo_dmitriev"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer shrink-0"
            >
              <Button label="tg" size="responsive" aria-label="Telegram Channel" />
            </a>
            <a
              href="mailto:contact@leodmitriev.com"
              className="cursor-pointer shrink-0"
            >
              <Button label="@" size="responsive" aria-label="Send Email" />
            </a>
          </Section>

          {/* PET Section with 3 ButtonLamps (Buttons stay full 44px size) */}
          <Section label="PET" className="flex h-[124px] flex-1 sm:flex-initial sm:w-[242px] min-w-0 flex-row items-center justify-center gap-[8px] sm:gap-[16px] p-[16px]"
          >
            <ButtonLamp label="1" size="responsive" aria-label="Pet Project 1" />
            <ButtonLamp label="2" size="responsive" aria-label="Pet Project 2" />
            <ButtonLamp label="3" size="responsive" aria-label="Pet Project 3" />
          </Section>
        </div>
      </header>
    );
  }
);

Hero.displayName = "Hero";
