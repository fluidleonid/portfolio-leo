"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Button,
  ButtonLamp,
  ButtonDownload,
  Knob,
  Section,
  LedMatrix,
} from "@/shared/ui";
import { tokens } from "@/shared/config";
import {
  type PetProjectData,
  DEFAULT_PET_PROJECTS,
} from "@/entities/pet-project";
import { PetProjectSheet } from "./PetProjectSheet";

export type NavItem = "works" | "index" | "career" | "about" | "experience";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+/";

export interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onNavChange"> {
  /** Name displayed in the hero title block (default: "Leonid Dmitriev") */
  name?: string;
  /** Bio text displayed in the hero title block */
  bio?: string;
  /** Images (WebP/PNG/CDN) for the LED matrix slideshow */
  ledImages?: string[];
  /** Pet projects managed in Sanity for the PET section */
  petProjects?: PetProjectData[];
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
      name = "Leonid Dmitriev",
      bio = "Product Designer · Frontend-fluent\n4+ years at B2B(2C) across FinTech,\nProductivity, Entertainment & AI products",
      ledImages,
      petProjects,
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
    const [toastVisible, setToastVisible] = useState<boolean>(false);
    const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const navContainerRef = React.useRef<HTMLDivElement | null>(null);
    const isProgrammaticScrollRef = React.useRef<boolean>(false);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [navWidth, setNavWidth] = useState<number>(406);
    const [navHeight, setNavHeight] = useState<number>(124);

    // PET Projects state & 2-second code-scramble ticker
    const resolvedPetProjects = useMemo(() => {
      const list =
        petProjects && petProjects.length > 0
          ? petProjects.filter((p) => p.isActive !== false)
          : DEFAULT_PET_PROJECTS;
      return list.length > 0 ? list : DEFAULT_PET_PROJECTS;
    }, [petProjects]);

    const [petTickerIndex, setPetTickerIndex] = useState<number>(0);
    const [hoveredPetIndex, setHoveredPetIndex] = useState<number | null>(null);
    const [activePetProject, setActivePetProject] =
      useState<PetProjectData | null>(null);

    const displayedPet =
      activePetProject ??
      resolvedPetProjects[
        (hoveredPetIndex !== null ? hoveredPetIndex : petTickerIndex) %
          resolvedPetProjects.length
      ];
    const targetPetName = (
      displayedPet?.shortName ||
      displayedPet?.title ||
      "PROJECT"
    )
      .trim()
      .toUpperCase();

    const [scrambledPetName, setScrambledPetName] =
      useState<string>(targetPetName);
    const hasMountedPetRef = useRef(false);

    // Rotate active pet project label every 2 seconds (pauses on hover or open sheet)
    useEffect(() => {
      if (
        resolvedPetProjects.length <= 1 ||
        hoveredPetIndex !== null ||
        activePetProject !== null
      ) {
        return;
      }
      const intervalId = window.setInterval(() => {
        setPetTickerIndex((prev) => (prev + 1) % resolvedPetProjects.length);
      }, 2000);
      return () => window.clearInterval(intervalId);
    }, [resolvedPetProjects.length, hoveredPetIndex, activePetProject]);

    // Code-cracking / scramble-decode animation whenever targetPetName changes
    useEffect(() => {
      if (!hasMountedPetRef.current) {
        hasMountedPetRef.current = true;
        setScrambledPetName(targetPetName);
        return;
      }

      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setScrambledPetName(targetPetName);
        return;
      }

      let frame = 0;
      const totalFrames = Math.max(12, targetPetName.length * 2 + 4);
      const timerId = window.setInterval(() => {
        frame += 1;
        const lockedCount = Math.floor(
          (frame / totalFrames) * targetPetName.length
        );

        const nextText = targetPetName
          .split("")
          .map((ch, idx) => {
            if (ch === " ") return " ";
            if (idx < lockedCount) return ch;
            return SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          })
          .join("");

        setScrambledPetName(nextText);

        if (frame >= totalFrames) {
          window.clearInterval(timerId);
          setScrambledPetName(targetPetName);
        }
      }, 32);

      return () => window.clearInterval(timerId);
    }, [targetPetName]);

    // Responsive dimension measurement for NAV section on resize
    React.useEffect(() => {
      const updateDimensions = () => {
        if (!navContainerRef.current) return;
        const w = navContainerRef.current.clientWidth;
        const h = navContainerRef.current.clientHeight;
        if (w > 0 && w !== navWidth) setNavWidth(w);
        if (h > 0 && h !== navHeight) setNavHeight(h);
      };

      const ro = new ResizeObserver(updateDimensions);
      if (navContainerRef.current) ro.observe(navContainerRef.current);
      window.addEventListener("resize", updateDimensions);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", updateDimensions);
      };
    }, [navWidth, navHeight]);

    // Return knob to "index" when user scrolls back to the top of the page
    React.useEffect(() => {
      const handleScroll = () => {
        if (isProgrammaticScrollRef.current) return;
        // When scroll reaches near top (< 260px), return rotary knob to "index"
        if (window.scrollY < 260) {
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
      if (controlledActiveNav && !isProgrammaticScrollRef.current) {
        setSelectedNav(controlledActiveNav);
      }
    }, [controlledActiveNav]);

    // Cleanup toast timer on unmount
    React.useEffect(() => {
      return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      };
    }, []);

    // Copy email address to clipboard with feedback
    const handleCopyEmail = (e: React.MouseEvent) => {
      e.preventDefault();
      const email = "leodm.uxui@gmail.com";

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(email).catch(() => {
          const textArea = document.createElement("textarea");
          textArea.value = email;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        });
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setToastVisible(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToastVisible(false);
      }, 2600);
    };

    // Exact snap angle configuration from Figma (works top-left: -58°, index bottom-left: -122°)
    const snapMap: Record<NavItem, number> = {
      works: -58,
      index: -122,
      career: 58,
      experience: 58,
      about: 122,
    };

    const snapAngles = [-122, -58, 58, 122];

    const activeNav = hoveredNav ?? (controlledActiveNav ?? selectedNav);
    const knobTargetAngle = snapMap[activeNav];

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

    // Fixed Figma-spec label widths & connection points (zero re-render shift on reload)
    const leftTarget1 = pad + (isDesktopNav ? 50 : 44) + 6; // works
    const leftTarget2 = pad + (isDesktopNav ? 45 : 40) + 6; // index

    const rightTarget1 = navWidth - pad - (isDesktopNav ? 55 : 48) - 6; // career
    const rightTarget2 = navWidth - pad - (isDesktopNav ? 50 : 44) - 6; // about

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
          <h1 className="text-[20px] font-semibold leading-[28px] text-content-primary font-hauora tracking-normal">
            {name}
          </h1>
          <p className="text-[20px] font-semibold leading-[28px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
            {bio}
          </p>
        </div>

        {/* 2. INTERACTIVE IMAGE / LED MATRIX (Figma node 46:1646, 564x258px) */}
        <div className="relative flex w-full max-w-[564px] h-[258px] my-[8px] sm:my-0 items-center justify-center overflow-hidden">
          <LedMatrix
            images={
              ledImages && ledImages.length > 0
                ? ledImages
                : ["/portrait.png", "/portrait-2.png"]
            }
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

              {/* Left Column: "works" and "index" - pure CSS positioning prevents layout jump on reload */}
              <a
                href="#works"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectNav("works");
                }}
                onMouseEnter={() => setHoveredNav("works")}
                onMouseLeave={() => setHoveredNav(null)}
                className={`absolute left-[16px] sm:left-[20px] top-[22px] sm:top-[32px] -translate-y-1/2 cursor-pointer text-left text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "works"
                    ? "text-content-primary"
                    : "text-content-tertiary hover:text-content-primary"
                }`}
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
                className={`absolute left-[16px] sm:left-[20px] top-[72px] sm:top-[92px] -translate-y-1/2 cursor-pointer text-left text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "index"
                    ? "text-content-primary"
                    : "text-content-tertiary hover:text-content-primary"
                }`}
              >
                index
              </a>

              {/* Centered Rotary Knob - 100% full original size without scaling, pure CSS centering prevents load jumps */}
              <div
                style={{ touchAction: "none" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 touch-none"
              >
                <Knob
                  value={knobTargetAngle}
                  snapAngles={snapAngles}
                  onChange={handleKnobChange}
                  onSnap={handleKnobSnap}
                  aria-label="Section Navigation Knob"
                />
              </div>

              {/* Right Column: "career" and "about" - pure CSS positioning prevents layout jump on reload */}
              <button
                type="button"
                onClick={() => handleSelectNav("career")}
                onMouseEnter={() => setHoveredNav("career")}
                onMouseLeave={() => setHoveredNav(null)}
                className={`absolute right-[16px] sm:right-[20px] top-[22px] sm:top-[32px] -translate-y-1/2 cursor-pointer text-right text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "career" || activeNav === "experience"
                    ? "text-content-primary"
                    : "text-content-tertiary hover:text-content-primary"
                }`}
              >
                career
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav("about")}
                onMouseEnter={() => setHoveredNav("about")}
                onMouseLeave={() => setHoveredNav(null)}
                className={`absolute right-[16px] sm:right-[20px] top-[72px] sm:top-[92px] -translate-y-1/2 cursor-pointer text-right text-[16px] sm:text-[18px] leading-none font-normal font-stetica select-none tracking-normal transition-colors duration-150 ${
                  activeNav === "about"
                    ? "text-content-primary"
                    : "text-content-tertiary hover:text-content-primary"
                }`}
              >
                about
              </button>
            </Section>
          </div>

          {/* CV Download Section (Buttons stay 100% full 60px original size, section width adapts) */}
          <Section label="CV" className="flex h-[94px] sm:h-[124px] w-[96px] sm:w-[124px] shrink-0 items-center justify-center p-[16px] sm:p-[20px]"
          >
            <a
              href="/cv.pdf"
              download="Leo_Dmitriev_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download CV"
              className="cursor-pointer"
            >
              <ButtonDownload aria-label="Download CV" />
            </a>
          </Section>
        </div>

        {/* 4. ROW 2: CONTACTS (COMM) + PET PROJECTS (PET) in ONE SINGLE ROW (Buttons stay full 44px size) */}
        <div className="flex w-full flex-row items-stretch justify-between gap-[12px] sm:gap-[32px]">
          {/* COMM Section with 3 tactile pills (Buttons stay full 44px size) */}
          <Section label="COMM" className="flex h-[94px] sm:h-[124px] flex-1 sm:flex-initial sm:w-[290px] min-w-0 flex-row items-center justify-center gap-[8px] sm:gap-[16px] p-[16px] sm:p-[20px]"
          >
            <a
              href="https://www.linkedin.com/in/leo-dmitriev/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer shrink-0"
            >
              <Button label="in" size="responsive" aria-label="LinkedIn Profile" />
            </a>
            <a
              href="https://t.me/hi2leo"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer shrink-0"
            >
              <Button label="tg" size="responsive" aria-label="Telegram Channel" />
            </a>
            <Button
              label="@"
              size="responsive"
              aria-label="Copy Email Address"
              onClick={handleCopyEmail}
              className="cursor-pointer shrink-0"
            />
          </Section>

          {/* PET Section with dynamic ButtonLamps & 2-second scrambled project name */}
          <Section
            label={`PET • ${scrambledPetName}`}
            labelClassName="max-w-[calc(100%-24px)] sm:max-w-[calc(100%-40px)]"
            textClassName="truncate whitespace-nowrap"
            className="flex h-[94px] sm:h-[124px] flex-1 sm:flex-initial sm:w-[242px] min-w-0 flex-row items-center justify-center gap-[8px] sm:gap-[16px] p-[16px] sm:p-[20px]"
          >
            {resolvedPetProjects.slice(0, 3).map((pet, idx) => (
              <ButtonLamp
                key={pet.id || idx}
                label={pet.buttonLabel || String(pet.order ?? idx + 1)}
                size="responsive"
                active={activePetProject?.id === pet.id}
                aria-label={`Open pet project: ${pet.title}`}
                onMouseEnter={() => setHoveredPetIndex(idx)}
                onMouseLeave={() => setHoveredPetIndex(null)}
                onFocus={() => setHoveredPetIndex(idx)}
                onBlur={() => setHoveredPetIndex(null)}
                onClick={() => setActivePetProject(pet)}
              />
            ))}
          </Section>
        </div>

        {/* Responsive Pet Project Embed Sheet (Right Sheet on Desktop, Bottom Sheet on Mobile) */}
        <PetProjectSheet
          project={activePetProject}
          onClose={() => setActivePetProject(null)}
        />

        {/* Soft Toast Notification: 56px height, 12px radius, bg-surface background, no border, font-hauora */}
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-[24px] sm:bottom-[32px] left-1/2 -translate-x-1/2 z-50 flex h-[56px] w-auto max-w-[calc(100vw-32px)] items-center justify-center rounded-[12px] bg-surface px-[24px] shadow-[0_12px_36px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out select-none ${
            toastVisible
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-[12px] scale-95 pointer-events-none"
          }`}
        >
          <span className="font-hauora text-[15px] sm:text-[16px] font-normal leading-none text-content-contrast whitespace-nowrap">
            Email copied to clipboard
          </span>
        </div>
      </header>
    );
  }
);

Hero.displayName = "Hero";
