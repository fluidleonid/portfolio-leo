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

  // Generate tuner stations directly from section anchors, splitting into sub-segments if blocks have anchors
  const caseStations = useMemo<TunerFrame[]>(() => {
    const list: TunerFrame[] = [];
    sections.forEach((sec) => {
      const secAnchor = sec.anchor.toLowerCase().trim();
      const anchoredBlocks = (sec.blocks || []).filter(
        (b) => "anchor" in b && typeof b.anchor === "string" && b.anchor.trim()
      );

      // Section primary station (shows label in Row 3)
      list.push({
        id: secAnchor,
        label: secAnchor,
        targetId: secAnchor,
        sectionId: secAnchor,
      });

      // Sub-segments for anchored blocks (label: undefined produces an empty notch in Row 3 with dot in Row 1 & frame in Row 2)
      anchoredBlocks.forEach((b) => {
        const blockAnchor = (b.anchor as string).toLowerCase().trim();
        if (blockAnchor && blockAnchor !== secAnchor) {
          list.push({
            id: blockAnchor,
            label: undefined,
            targetId: blockAnchor,
            sectionId: secAnchor,
          });
        }
      });
    });
    return list;
  }, [sections]);

  // Synchronize active station based on scroll position across sections and sub-blocks
  useEffect(() => {
    const handleScroll = () => {
      const topOffset = 160;
      for (let i = caseStations.length - 1; i >= 1; i--) {
        const station = caseStations[i];
        const el = document.getElementById(station.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= topOffset) {
            setActiveStation(station.id);
            return;
          }
        }
      }
      setActiveStation(caseStations[0]?.id || sections[0]?.anchor || "overview");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections, caseStations]);

  const handleStationChange = (stationId: string) => {
    setActiveStation(stationId);
    const target = caseStations.find((s) => s.id === stationId);
    if (target) {
      if (target.id === caseStations[0]?.id) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.getElementById(target.targetId);
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

      <article className="relative flex w-full max-w-[564px] flex-col pb-[96px] sm:pb-[120px]">
        {/* 1. TOP NAVIGATION / BACK LINK */}
        <nav className="flex w-full items-center justify-start pt-[8px] sm:pt-[16px]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[26px] text-content-secondary hover:text-content-primary transition-colors duration-150"
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
          <h1 className="text-[18px] font-medium leading-[26px] text-content-primary font-hauora tracking-normal">
            {caseData.title}
          </h1>
          {caseData.tagline && (
            <p className="text-[18px] font-light leading-[26px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
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
                className={`relative flex w-full flex-col scroll-mt-[100px] ${
                  isFirst ? "mt-[20px] sm:mt-[32px]" : "mt-[80px] sm:mt-[100px]"
                }`}
              >
                {/* Optional Section Heading */}
                {section.title && (
                  <h2 className="text-[18px] font-medium leading-[26px] text-content-primary font-hauora tracking-normal mb-[16px] sm:mb-[24px]">
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
            className="inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[26px] text-content-secondary hover:text-content-primary transition-colors duration-150"
          >
            <span>←</span>
            <span>back</span>
          </Link>
        </footer>
      </article>
    </>
  );
}
