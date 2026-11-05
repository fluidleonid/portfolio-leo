"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TopBar, type TunerFrame } from "@/widgets/top-bar";
import { CaseBlockRenderer } from "./CaseBlockRenderer";
import type { CaseStudyData } from "@/entities/case-study";

export interface CaseStudyViewProps {
  caseData: CaseStudyData;
}

export function CaseStudyView({ caseData }: CaseStudyViewProps) {
  const [activeStation, setActiveStation] = useState<string>("case-header");

  // Destination on the main page: back to the specific project block we came from
  const backHref = caseData.projectAnchor ? `/#${caseData.projectAnchor}` : "/";

  // Generate tuner stations from non-gallery blocks (excluding gallery blocks per user request)
  const caseStations = useMemo<TunerFrame[]>(() => {
    const list: TunerFrame[] = [
      { id: "case-header", label: "top", targetId: "case-header" },
    ];

    (caseData.blocks || []).forEach((block, idx) => {
      // Exclude horizontal breakout galleries from the tuner bar
      if (block._type === "galleryBlock") return;

      const blockId = `block-${idx}`;
      let label = "section";

      if ("badge" in block && typeof block.badge === "string" && block.badge.trim()) {
        label = block.badge.trim().toLowerCase();
      } else if (block._type === "metadataTable") {
        label = "meta";
      } else if (block._type === "textBlock") {
        label = "story";
      } else if (block._type === "quoteCallout") {
        label = "quote";
      } else {
        label = block._type
          .replace("Section", "")
          .replace("Block", "")
          .toLowerCase();
      }

      list.push({
        id: blockId,
        label,
        targetId: blockId,
      });
    });

    return list;
  }, [caseData.blocks]);

  // Synchronize active station based on scroll position within the case study
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (scrollY < 160) {
        setActiveStation("case-header");
        return;
      }

      for (let i = caseStations.length - 1; i >= 0; i--) {
        const item = caseStations[i];
        const el = document.getElementById(item.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveStation(item.id);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [caseStations]);

  const handleStationChange = (stationId: string) => {
    setActiveStation(stationId);
    const target = caseStations.find((s) => s.id === stationId);
    if (target) {
      const el = document.getElementById(target.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* 
        Full-width vintage stereo radio tuner TopBar for Case Study
        Displays non-gallery block labels in the exact same style as on the main page
      */}
      <TopBar
        stations={caseStations}
        activeStation={activeStation}
        onStationChange={handleStationChange}
      />

      <article className="relative flex w-full max-w-[564px] flex-col pb-[96px] sm:pb-[120px] select-none">
        {/* 1. TOP NAVIGATION / BACK LINK (Smooth color shift on hover, zero icon movement, returns to project anchor) */}
        <nav className="flex w-full items-center justify-start pt-[8px] sm:pt-[16px]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
          >
            <span>←</span>
            <span>back</span>
          </Link>
        </nav>

        {/* 2. CASE STUDY HEADER (Matching main page project title & description styles) */}
        <header
          id="case-header"
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

        {/* 3. MODULAR CASE BLOCKS (Strictly font-hauora matching main page typography) */}
        <div className="flex w-full flex-col">
          {caseData.blocks.map((block, idx) => (
            <CaseBlockRenderer
              key={block._key || idx}
              id={`block-${idx}`}
              block={block}
            />
          ))}
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
