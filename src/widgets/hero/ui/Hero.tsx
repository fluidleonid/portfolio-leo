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

export type NavItem = "works" | "index" | "career" | "about" | "experience";

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
    const [navHeight, setNavHeight] = useState<number>(124);

    // Responsive dimension measurement for NAV section to adapt rays and labels to equal section height
    React.useEffect(() => {
      const updateDimensions = () => {
        if (!navContainerRef.current) return;
        setNavWidth(navContainerRef.current.clientWidth);
        if (navContainerRef.current.clientHeight > 0) {
          setNavHeight(navContainerRef.current.clientHeight);
        }
      };

      updateDimensions();
      const ro = new ResizeObserver(updateDimensions);
      if (navContainerRef.current) ro.observe(navContainerRef.current);
      window.addEventListener("resize", updateDimensions);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", updateDimensions);
      };
    }, []);

    // Exact snap angle configuration from Figma (works top-left: -58°, index bottom-left: -122°)
    const snapMap: Record<NavItem, number> = {
      works: -58,
      index: -122,
      career: 58,
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
          const el =
            document.getElementById(item) ||
            (item === "career" ? document.getElementById("experience") : null);
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

    // Calculate dynamic anchor positions for NAV rays and labels based on container dimensions
    const cx = navWidth / 2;
    const cy = navHeight / 2;
    const isDesktopNav = navHeight >= 110;

    const yOffset = isDesktopNav ? 30 : 24;
    const yTop = cy - yOffset;
    const yBottom = cy + yOffset;

    const dyExit = isDesktopNav ? 22.26 : 16;
    const dxExit = isDesktopNav ? 35.62 : 25.4;

    // Left side: lines become shorter and texts shift slightly horizontally while keeping full 18px text
    const leftLabelEnd = Math.max(48, Math.min(92, cx - 58));
    const leftRayEnd = leftLabelEnd + 6;
    const leftTurnX = Math.max(leftRayEnd + 4, cx - (isDesktopNav ? 48 : 42));

    // Right side: 'career' width ~54px, 'about' width ~44px
    const rightLabel1Start = Math.min(320, Math.max(cx + 46, navWidth - 16 - 54));
    const rightRay1End = rightLabel1Start - 6;
    const rightTurn1X = Math.min(rightRay1End - 4, cx + (isDesktopNav ? 48 : 42));

    const rightLabel2Start = Math.min(338, Math.max(cx + 46, navWidth - 16 - 44));
    const rightRay2End = rightLabel2Start - 6;
    const rightTurn2X = Math.min(rightRay2End - 4, cx + (isDesktopNav ? 48 : 42));

    return (
      <header
        id="top"
        ref={ref}
        className={`relative flex w-full max-w-[564px] flex-col gap-[12px] sm:gap-[32px] select-none ${className}`}
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
        <div className="flex w-full flex-row items-stretch justify-between gap-[12px] sm:gap-[32px]">
          {/* NAV Section */}
          <div ref={navContainerRef} className="relative flex-1 min-w-0 sm:flex-initial sm:w-[406px]">
            <Section label="NAV" className="relative flex h-[94px] sm:h-[124px] w-full sm:w-[406px] items-center justify-center p-[16px] sm:p-[20px]"
            >
              {/* Radial guide lines adaptively anchored to centered knob */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${navWidth} ${navHeight}`}
                fill="none"
              >
                {/* Top-left radial ray + horizontal line to "works" */}
                <path
                  d={`M${cx - dxExit} ${cy - dyExit} L${leftTurnX} ${yTop} H${leftRayEnd}`}
                  stroke={activeNav === "works" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />

                {/* Bottom-left radial ray + horizontal line to "index" */}
                <path
                  d={`M${cx - dxExit} ${cy + dyExit} L${leftTurnX} ${yBottom} H${leftRayEnd}`}
                  stroke={activeNav === "index" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />

                {/* Top-right radial ray + horizontal line to "career" */}
                <path
                  d={`M${cx + dxExit} ${cy - dyExit} L${rightTurn1X} ${yTop} H${rightRay1End}`}
                  stroke={activeNav === "career" || activeNav === "experience" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                  strokeWidth="1"
                  className="transition-colors duration-150"
                />

                {/* Bottom-right radial ray + horizontal line to "about" */}
                <path
                  d={`M${cx + dxExit} ${cy + dyExit} L${rightTurn2X} ${yBottom} H${rightRay2End}`}
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
                style={{ right: `${navWidth - leftLabelEnd}px`, top: `${yTop}px` }}
                className="absolute -translate-y-1/2 cursor-pointer text-right text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
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
                style={{ right: `${navWidth - leftLabelEnd}px`, top: `${yBottom}px` }}
                className="absolute -translate-y-1/2 cursor-pointer text-right text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
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

              {/* Right Column: "career" and "about" */}
              <button
                type="button"
                onClick={() => handleSelectNav("career")}
                onMouseEnter={() => setHoveredNav("career")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ left: `${rightLabel1Start}px`, top: `${yTop}px` }}
                className="absolute -translate-y-1/2 cursor-pointer text-left text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
              >
                career
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav("about")}
                onMouseEnter={() => setHoveredNav("about")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ left: `${rightLabel2Start}px`, top: `${yBottom}px` }}
                className="absolute -translate-y-1/2 cursor-pointer text-left text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
              >
                about
              </button>
            </Section>
          </div>

          {/* CV Download Section (Buttons stay 100% full 60px original size, section width adapts) */}
          <Section label="CV" className="flex h-[94px] sm:h-[124px] w-[96px] sm:w-[124px] shrink-0 items-center justify-center p-[16px] sm:p-[20px]"
          >
            <ButtonDownload aria-label="Download CV" />
          </Section>
        </div>

        {/* 4. ROW 2: CONTACTS (COMM) + PET PROJECTS (PET) in ONE SINGLE ROW (Buttons stay full 44px size) */}
        <div className="flex w-full flex-row items-stretch justify-between gap-[12px] sm:gap-[32px]">
          {/* COMM Section with 3 tactile pills (Buttons stay full 44px size) */}
          <Section label="COMM" className="flex h-[94px] sm:h-[124px] flex-1 sm:flex-initial sm:w-[290px] min-w-0 flex-row items-center justify-center gap-[8px] sm:gap-[16px] p-[16px] sm:p-[20px]"
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
          <Section label="PET" className="flex h-[94px] sm:h-[124px] flex-1 sm:flex-initial sm:w-[242px] min-w-0 flex-row items-center justify-center gap-[8px] sm:gap-[16px] p-[16px] sm:p-[20px]"
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
