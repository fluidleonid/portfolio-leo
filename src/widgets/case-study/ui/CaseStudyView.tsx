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
  const [activeStation, setActiveStation] = useState<string>("overview");

  // Destination on the main page: back to the specific project block we came from
  const backHref = caseData.projectAnchor ? `/#${caseData.projectAnchor}` : "/";

  // Generate tuner stations:
  // First station is always 'overview' (encompassing title, description, metadata table, and initial problem)
  // Subsequent stations are distinct major chapters, strictly excluding horizontal breakout galleries
  const caseStations = useMemo<TunerFrame[]>(() => {
    const list: TunerFrame[] = [
      { id: "overview", label: "overview", targetId: "overview" },
    ];

    const isOverviewContext = (badgeOrTitle: string) => {
      const lower = badgeOrTitle.toLowerCase();
      return (
        lower.includes("overview") ||
        lower.includes("challenge") ||
        lower.includes("problem") ||
        lower.includes("context") ||
        lower.includes("intro")
      );
    };

    let passedOverview = false;
    let lastLabel = "overview";

    (caseData.blocks || []).forEach((block, idx) => {
      // 1. Strictly exclude horizontal breakout galleries from the tuner bar
      if (block._type === "galleryBlock") return;

      // 2. Metadata table is always part of the overview block
      if (block._type === "metadataTable") return;

      // Extract candidate badge
      let rawBadge = "";
      if ("badge" in block && typeof block.badge === "string" && block.badge.trim()) {
        rawBadge = block.badge.trim();
      }

      // Check if this block is part of the introductory problem/overview
      if (!passedOverview) {
        if (
          (rawBadge && isOverviewContext(rawBadge)) ||
          block._type === "problemList"
        ) {
          return;
        }
        passedOverview = true;
      }

      // Determine clean chapter label
      let label = rawBadge.toLowerCase();
      if (!label) {
        if (block._type === "teamSection") label = "team";
        else if (block._type === "discoverySection") label = "discovery";
        else if (block._type === "hypothesesSection") label = "hypotheses";
        else if (block._type === "metricsBlock") label = "impact";
        else if (block._type === "sectionHeading" && "title" in block && typeof block.title === "string") {
          label = block.title.split(" ")[0].toLowerCase();
        } else {
          label = block._type
            .replace("Section", "")
            .replace("Block", "")
            .toLowerCase();
        }
      }

      // Avoid consecutive duplicate stations (e.g. sectionHeading "discovery" + discoverySection)
      if (label && label !== lastLabel) {
        const blockId = `block-${idx}`;
        list.push({
          id: blockId,
          label,
          targetId: blockId,
        });
        lastLabel = label;
      }
    });

    return list;
  }, [caseData.blocks]);

  // Synchronize active station based on scroll position within the case study
  useEffect(() => {
    const handleScroll = () => {
      for (let i = caseStations.length - 1; i >= 1; i--) {
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
      setActiveStation("overview");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
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

        {/* 2. CASE STUDY HEADER (Part of overview: title & description) */}
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
