"use client";

import React from "react";
import Link from "next/link";
import { CaseBlockRenderer } from "./CaseBlockRenderer";
import type { CaseStudyData } from "@/entities/case-study";

export interface CaseStudyViewProps {
  caseData: CaseStudyData;
}

export function CaseStudyView({ caseData }: CaseStudyViewProps) {
  return (
    <article className="relative flex w-full max-w-[564px] flex-col pb-[96px] sm:pb-[120px] select-none">
      {/* 1. TOP NAVIGATION / BACK LINK */}
      <nav className="flex w-full items-center justify-start pt-[8px] sm:pt-[16px]">
        <Link
          href="/"
          className="group inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
        >
          <span className="transition-transform duration-150 group-hover:-translate-x-1">
            ←
          </span>
          <span>back</span>
        </Link>
      </nav>

      {/* 2. CASE STUDY HEADER (Matching main page project title & description styles) */}
      <header className="flex w-full flex-col gap-[8px] mt-[40px] sm:mt-[60px]">
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
          <CaseBlockRenderer key={block._key || idx} block={block} />
        ))}
      </div>

      {/* 4. FOOTER RETURN */}
      <footer className="mt-[80px] sm:mt-[120px] flex w-full flex-col items-start gap-[12px] pt-[24px]">
        <Link
          href="/"
          className="group inline-flex items-center gap-[8px] font-hauora text-[18px] font-light leading-[24px] text-content-secondary hover:text-content-primary transition-colors duration-150"
        >
          <span className="transition-transform duration-150 group-hover:-translate-x-1">
            ←
          </span>
          <span>back</span>
        </Link>
      </footer>
    </article>
  );
}
