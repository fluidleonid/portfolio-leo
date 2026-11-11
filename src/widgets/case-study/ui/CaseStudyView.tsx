"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TopBar, type TunerFrame } from "@/widgets/top-bar";
import { CaseBlockRenderer } from "./CaseBlockRenderer";
import {
  type CaseStudyData,
  normalizeCaseSections,
} from "@/entities/case-study";

export interface CaseStudyViewProps {
  caseData: CaseStudyData;
}

export function CaseStudyView({ caseData }: CaseStudyViewProps) {
  // Resolve sections (using explicit sections if defined, or auto-grouping legacy blocks)
  const sections = useMemo(() => {
    return normalizeCaseSections(caseData);
  }, [caseData]);

  const [activeStation, setActiveStation] = useState<string>(
    sections[0]?.anchor || "overview"
  );

  // Destination on the main page: back to the specific project block we came from
  const backHref = caseData.projectAnchor ? `/#${caseData.projectAnchor}` : "/";

  // Generate tuner stations directly from section anchors
  const caseStations = useMemo<TunerFrame[]>(() => {
    return sections.map((sec) => ({
      id: sec.anchor,
      label: sec.anchor.toLowerCase(),
      targetId: sec.anchor,
    }));
  }, [sections]);

  // Synchronize active station based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const topOffset = 160;
      for (let i = sections.length - 1; i >= 1; i--) {
        const item = sections[i];
        const el = document.getElementById(item.anchor);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= topOffset) {
            setActiveStation(item.anchor);
            return;
          }
        }
      }
      setActiveStation(sections[0]?.anchor || "overview");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const handleStationChange = (stationId: string) => {
    setActiveStation(stationId);
    const target = sections.find((s) => s.anchor === stationId);
    if (target) {
      if (target.anchor === sections[0]?.anchor) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(target.anchor);
      if (el) {
        const rect = el.getBoundingClientRect();
        const targetScroll = Math.max(0, rect.top + window.scrollY - 100);
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* 
        Full-width vintage stereo radio tuner TopBar for Case Study
        Displays section anchors in the exact same style as on the main page
      */}
      <TopBar
        stations={caseStations}
        activeStation={activeStation}
        onStationChange={handleStationChange}
      />

      <article className="relative flex w-full max-w-[564px] flex-col pb-[96px] sm:pb-[120px] select-none">
        {/* 1. TOP NAVIGATION / BACK LINK */}
        <nav className="flex w-full items-center justify-start pt-[8px] sm:pt-[16px]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
          >
            <span>←</span>
            <span>back</span>
          </Link>
        </nav>

        {/* 2. CASE STUDY HEADER (Title & Pitch) */}
        <header
          id="overview"
          className="flex w-full flex-col gap-[8px] mt-[40px] sm:mt-[60px] scroll-mt-[100px]"
        >
          <h1 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
            {caseData.title}
          </h1>
          {caseData.tagline && (
            <p className="text-[18px] font-light leading-[24px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
              {caseData.tagline}
            </p>
          )}
        </header>

        {/* 3. STRUCTURED SECTIONS */}
        <div className="flex w-full flex-col">
          {sections.map((section, sectionIdx) => {
            const isFirst = sectionIdx === 0;
            return (
              <section
                key={section._key || section.anchor || sectionIdx}
                id={section.anchor}
                className={`relative flex w-full flex-col scroll-mt-[100px] select-none ${
                  isFirst ? "mt-[32px] sm:mt-[48px]" : "mt-[80px] sm:mt-[100px]"
                }`}
              >
                {/* Optional Section Heading */}
                {section.title && (
                  <h2 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal mb-[16px] sm:mb-[24px]">
                    {section.title}
                  </h2>
                )}

                {/* Vertical stack of blocks: gap 32px on desktop, 20px on mobile */}
                <div className="flex w-full flex-col gap-[20px] sm:gap-[32px]">
                  {section.blocks.map((block, blockIdx) => (
                    <CaseBlockRenderer
                      key={block._key || blockIdx}
                      id={`${section.anchor}-block-${blockIdx}`}
                      block={block}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* 4. FOOTER RETURN */}
        <footer className="mt-[80px] sm:mt-[120px] flex w-full flex-col items-start gap-[12px] pt-[24px]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
          >
            <span>←</span>
            <span>back</span>
          </Link>
        </footer>
      </article>
    </>
  );
}
