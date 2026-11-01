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
        <div className="relative flex w-full max-w-[564px] items-center justify-center overflow-hidden">
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

        {/* 3. ROW 1: NAVIGATION (406px) + CV (124px) = 562px (fits 564px) */}
        <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-[20px] sm:gap-[32px]">
          {/* NAV Section wrapper: responsive scaling for mobile screens */}
          <div className="flex w-full sm:w-auto items-center justify-center overflow-visible">
            <div className="shrink-0 origin-center scale-[0.82] min-[390px]:scale-[0.88] min-[440px]:scale-100 transition-transform">
              <Section
                label="NAV"
                className="relative flex h-[124px] w-[406px] shrink-0 items-center justify-center p-0"
              >
                {/* 20px straight radial guide lines placed 8px from knob edge (r = 42px to 62px) */}
                <svg
                  className="pointer-events-none absolute inset-0 h-[124px] w-[406px]"
                  viewBox="0 0 406 124"
                  fill="none"
                >
                  {/* Top-left radial ray + horizontal line to "works" */}
                  <path
                    d="M167.38 39.74L155 32H100"
                    stroke={activeNav === "works" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                    strokeWidth="1"
                    className="transition-colors duration-150"
                  />

                  {/* Bottom-left radial ray + horizontal line to "index" */}
                  <path
                    d="M167.38 84.26L155 92H100"
                    stroke={activeNav === "index" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                    strokeWidth="1"
                    className="transition-colors duration-150"
                  />

                  {/* Top-right radial ray + shorter horizontal line to "experience" */}
                  <path
                    d="M238.62 39.74L251 32H286"
                    stroke={activeNav === "experience" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                    strokeWidth="1"
                    className="transition-colors duration-150"
                  />

                  {/* Bottom-right radial ray + longer horizontal line to "about" */}
                  <path
                    d="M238.62 84.26L251 92H330"
                    stroke={activeNav === "about" ? tokens.colors.signalAmber : tokens.colors.borderSubtle}
                    strokeWidth="1"
                    className="transition-colors duration-150"
                  />
                </svg>

                {/* Left Column: "works" (top, centered on y=32px) and "index" (bottom, centered on y=92px) */}
                <a
                  href="#works"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectNav("works");
                  }}
                  onMouseEnter={() => setHoveredNav("works")}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="absolute right-[314px] top-[32px] -translate-y-1/2 cursor-pointer text-right text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
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
                  className="absolute right-[314px] top-[92px] -translate-y-1/2 cursor-pointer text-right text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
                >
                  index
                </a>

                {/* Centered Rotary Knob */}
                <div className="relative z-10">
                  <Knob
                    value={knobTargetAngle}
                    snapAngles={snapAngles}
                    onSnap={handleKnobSnap}
                    aria-label="Section Navigation Knob"
                  />
                </div>

                {/* Right Column: "experience" (top, centered on y=32px) and "about" (bottom, centered on y=92px) */}
                <button
                  type="button"
                  onClick={() => handleSelectNav("experience")}
                  onMouseEnter={() => setHoveredNav("experience")}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="absolute left-[294px] top-[32px] -translate-y-1/2 cursor-pointer text-left text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
                >
                  experience
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectNav("about")}
                  onMouseEnter={() => setHoveredNav("about")}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="absolute left-[338px] top-[92px] -translate-y-1/2 cursor-pointer text-left text-[18px] leading-none font-normal text-content-primary font-stetica hover:text-content-contrast transition-colors duration-150 select-none tracking-normal"
                >
                  about
                </button>
              </Section>
            </div>
          </div>

          {/* CV Download Section (Figma node 52:1809, 124x124px) */}
          <Section
            label="CV"
            className="flex h-[124px] w-[124px] shrink-0 items-center justify-center p-0"
          >
            <ButtonDownload aria-label="Download CV" />
          </Section>
        </div>

        {/* 4. ROW 2: CONTACTS (290px) + PET PROJECTS (242px) = 564px with 32px gap */}
        <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-[20px] sm:gap-[32px]">
          {/* COMM Section (Figma node 52:1790, 290x124px) with 3 tactile pills */}
          <Section
            label="COMM"
            className="flex h-[124px] w-[290px] shrink-0 flex-row items-center justify-between px-[20px] py-0"
          >
            <a
              href="https://linkedin.com/in/leoniddmitriev"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <Button label="in" aria-label="LinkedIn Profile" />
            </a>
            <a
              href="https://t.me/leo_dmitriev"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <Button label="tg" aria-label="Telegram Channel" />
            </a>
            <a
              href="mailto:contact@leodmitriev.com"
              className="cursor-pointer"
            >
              <Button label="@" aria-label="Send Email" />
            </a>
          </Section>

          {/* PET Section (Figma node 46:1606, 242x124px) with 3 ButtonLamps */}
          <Section
            label="PET"
            className="flex h-[124px] w-[242px] shrink-0 flex-row items-center justify-between px-[20px] py-0"
          >
            <ButtonLamp label="1" aria-label="Pet Project 1" />
            <ButtonLamp label="2" aria-label="Pet Project 2" />
            <ButtonLamp label="3" aria-label="Pet Project 3" />
          </Section>
        </div>
      </header>
    );
  }
);

Hero.displayName = "Hero";
