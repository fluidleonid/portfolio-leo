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
  /** Active navigation selection (controlled from parent) */
  activeNav?: NavItem;
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
      activeNav: controlledActiveNav,
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
    const isProgrammaticScrollRef = React.useRef<boolean>(false);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [navWidth, setNavWidth] = useState<number>(406);
    const [navHeight, setNavHeight] = useState<number>(124);

    const worksRef = React.useRef<HTMLAnchorElement | null>(null);
    const indexRef = React.useRef<HTMLAnchorElement | null>(null);
    const careerRef = React.useRef<HTMLButtonElement | null>(null);
    const aboutRef = React.useRef<HTMLButtonElement | null>(null);

    const [labelWidths, setLabelWidths] = useState({
      works: 46,
      index: 42,
      career: 50,
      about: 42,
    });

    // Responsive dimension measurement for NAV section to adapt rays and labels to equal section height
    React.useEffect(() => {
      const updateDimensions = () => {
        if (!navContainerRef.current) return;
        setNavWidth(navContainerRef.current.clientWidth);
        if (navContainerRef.current.clientHeight > 0) {
          setNavHeight(navContainerRef.current.clientHeight);
        }
        if (worksRef.current && worksRef.current.offsetWidth > 0) {
          setLabelWidths({
            works: worksRef.current.offsetWidth,
            index: indexRef.current?.offsetWidth || 42,
            career: careerRef.current?.offsetWidth || 50,
            about: aboutRef.current?.offsetWidth || 42,
          });
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

    // Return knob to "index" when user scrolls back to the top of the page
    React.useEffect(() => {
      const handleScroll = () => {
        if (isProgrammaticScrollRef.current) return;
        // When scroll reaches near top (< 120px), return rotary knob to "index"
        if (window.scrollY < 120) {
          setSelectedNav((prev) => (prev !== "index" ? "index" : prev));
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, []);

    // Synchronize with controlled activeNav prop from parent
    React.useEffect(() => {
      if (controlledActiveNav === "index" && !isProgrammaticScrollRef.current) {
        setSelectedNav("index");
      }
    }, [controlledActiveNav]);

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
    const knobTargetAngle = snapMap[selectedNav];

    const handleSelectNav = (item: NavItem) => {
      setSelectedNav(item);
      onNavChange?.(item);

      if (typeof window !== "undefined") {
        if (item === "index") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          isProgrammaticScrollRef.current = true;
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 1000);

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

    const getShortestDelta = (from: number, to: number): number => {
      let a = (to - from) % 360;
      if (a > 180) a -= 360;
      if (a <= -180) a += 360;
      return a;
    };

    const handleKnobChange = (angle: number) => {
      let nearest: NavItem = "index";
      let minDiff = Infinity;

      (Object.keys(snapMap) as NavItem[]).forEach((key) => {
        const diff = Math.abs(getShortestDelta(angle, snapMap[key]));
        if (diff < minDiff) {
          minDiff = diff;
          nearest = key;
        }
      });

      setHoveredNav(nearest);
    };

    const handleKnobSnap = (angle: number) => {
      let nearest: NavItem = "index";
      let minDiff = Infinity;

      (Object.keys(snapMap) as NavItem[]).forEach((key) => {
        const diff = Math.abs(getShortestDelta(angle, snapMap[key]));
        if (diff < minDiff) {
          minDiff = diff;
          nearest = key;
        }
      });

      setHoveredNav(null);
      handleSelectNav(nearest);
    };

    // Calculate dynamic anchor positions for NAV rays and labels based on container dimensions
    const cx = navWidth / 2;
    const cy = navHeight / 2;
    const isDesktopNav = navHeight >= 110;

    const yOffset = isDesktopNav ? 30 : 25;
    const yTop = cy - yOffset;
    const yBottom = cy + yOffset;

    // Diagonal ray exit coordinates from knob center:
    // Knob well radius is 34px. Exit at radius ~40px provides a comfortable ~6px clearance from knob well.
    // 32° radial ray maintains its exact angled slope and length as container adapts.
    const dxExit = isDesktopNav ? 35.62 : 36.0;
    const dyExit = isDesktopNav ? 22.26 : 17.5;

    const pad = isDesktopNav ? 20 : 16;

    // Label widths and target points where rays connect (with 6px gap to text):
    const leftTarget1 = pad + (labelWidths.works || (isDesktopNav ? 52 : 46)) + 6;
    const leftTarget2 = pad + (labelWidths.index || (isDesktopNav ? 47 : 42)) + 6;

    const rightTarget1 = navWidth - pad - (labelWidths.career || (isDesktopNav ? 58 : 50)) - 6;
    const rightTarget2 = navWidth - pad - (labelWidths.about || (isDesktopNav ? 50 : 42)) - 6;

    // Knee turns: diagonal ray comes out from knob at 32° to cx ± 48.
    // As container adapts, the diagonal segment stays fixed as-is, and the horizontal line H compresses/stretches.
    const leftTurn1 = Math.max(leftTarget1 + 4, cx - 48);
    const leftTurn2 = Math.max(leftTarget2 + 4, cx - 48);
    const rightTurn1 = Math.min(rightTarget1 - 4, cx + 48);
    const rightTurn2 = Math.min(rightTarget2 - 4, cx + 48);

    const pathWorks = `M ${(cx - dxExit).toFixed(1)} ${(cy - dyExit).toFixed(1)} L ${leftTurn1.toFixed(1)} ${yTop.toFixed(1)} H ${leftTarget1.toFixed(1)}`;
    const pathIndex = `M ${(cx - dxExit).toFixed(1)} ${(cy + dyExit).toFixed(1)} L ${leftTurn2.toFixed(1)} ${yBottom.toFixed(1)} H ${leftTarget2.toFixed(1)}`;
    const pathCareer = `M ${(cx + dxExit).toFixed(1)} ${(cy - dyExit).toFixed(1)} L ${rightTurn1.toFixed(1)} ${yTop.toFixed(1)} H ${rightTarget1.toFixed(1)}`;
    const pathAbout = `M ${(cx + dxExit).toFixed(1)} ${(cy + dyExit).toFixed(1)} L ${rightTurn2.toFixed(1)} ${yBottom.toFixed(1)} H ${rightTarget2.toFixed(1)}`;

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
          <p className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
            Product Designer · Frontend-fluent{"\n"}
            4+ years at B2B(2C) across FinTech,{"\n"}
            Productivity, Entertainment & AI products
          </p>
        </div>

        {/* 2. INTERACTIVE IMAGE / LED MATRIX (Figma node 46:1646, 564x258px) */}
        <div className="relative flex w-full max-w-[564px] h-[258px] my-[8px] sm:my-0 items-center justify-center overflow-hidden">
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
              {/* Radial guide lines adaptively anchored to centered knob (always constant borderSubtle color) */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${navWidth} ${navHeight}`}
                fill="none"
              >
                {/* Top-left: works */}
                <path
                  d={pathWorks}
                  stroke={tokens.colors.borderSubtle}
                  strokeWidth="1"
                />

                {/* Bottom-left: index */}
                <path
                  d={pathIndex}
                  stroke={tokens.colors.borderSubtle}
                  strokeWidth="1"
                />

                {/* Top-right: career */}
                <path
                  d={pathCareer}
                  stroke={tokens.colors.borderSubtle}
                  strokeWidth="1"
                />

                {/* Bottom-right: about */}
                <path
                  d={pathAbout}
                  stroke={tokens.colors.borderSubtle}
                  strokeWidth="1"
                />
              </svg>

              {/* Left Column: "works" and "index" - always aligned to left edge */}
              <a
                ref={worksRef}
                href="#works"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectNav("works");
                }}
                onMouseEnter={() => setHoveredNav("works")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ top: `${yTop}px` }}
                className={`absolute left-[16px] sm:left-[20px] -translate-y-1/2 cursor-pointer text-left text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "works"
                    ? "text-content-contrast"
                    : "text-content-secondary hover:text-content-contrast"
                }`}
              >
                works
              </a>

              <a
                ref={indexRef}
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectNav("index");
                }}
                onMouseEnter={() => setHoveredNav("index")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ top: `${yBottom}px` }}
                className={`absolute left-[16px] sm:left-[20px] -translate-y-1/2 cursor-pointer text-left text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "index"
                    ? "text-content-contrast"
                    : "text-content-secondary hover:text-content-contrast"
                }`}
              >
                index
              </a>

              {/* Centered Rotary Knob - 100% full original size without scaling */}
              <div
                style={{ left: `${cx}px`, touchAction: "none" }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 touch-none"
              >
                <Knob
                  value={knobTargetAngle}
                  snapAngles={snapAngles}
                  onChange={handleKnobChange}
                  onSnap={handleKnobSnap}
                  aria-label="Section Navigation Knob"
                />
              </div>

              {/* Right Column: "career" and "about" - always aligned to right edge */}
              <button
                ref={careerRef}
                type="button"
                onClick={() => handleSelectNav("career")}
                onMouseEnter={() => setHoveredNav("career")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ top: `${yTop}px` }}
                className={`absolute right-[16px] sm:right-[20px] -translate-y-1/2 cursor-pointer text-right text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "career" || activeNav === "experience"
                    ? "text-content-contrast"
                    : "text-content-secondary hover:text-content-contrast"
                }`}
              >
                career
              </button>

              <button
                ref={aboutRef}
                type="button"
                onClick={() => handleSelectNav("about")}
                onMouseEnter={() => setHoveredNav("about")}
                onMouseLeave={() => setHoveredNav(null)}
                style={{ top: `${yBottom}px` }}
                className={`absolute right-[16px] sm:right-[20px] -translate-y-1/2 cursor-pointer text-right text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "about"
                    ? "text-content-contrast"
                    : "text-content-secondary hover:text-content-contrast"
                }`}
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
