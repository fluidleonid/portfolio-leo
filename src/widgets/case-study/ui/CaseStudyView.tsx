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
    <article className="relative flex w-full max-w-[564px] flex-col gap-[32px] sm:gap-[44px] pb-[96px] sm:pb-[120px] select-none">
      {/* 1. TOP NAVIGATION / BACK LINK */}
      <nav className="flex w-full items-center justify-between pt-[8px] sm:pt-[16px] pb-[8px]">
        <Link
          href="/"
          className="group inline-flex items-center gap-[8px] font-hauora text-[15px] sm:text-[16px] font-normal text-content-secondary hover:text-content-primary transition-colors duration-150"
        >
          <span className="transition-transform duration-150 group-hover:-translate-x-1">
            ←
          </span>
          <span>Leo Rogov / Works</span>
        </Link>

        {caseData.projectTag && (
          <span className="font-hauora text-[12px] sm:text-[13px] tracking-[0.08em] uppercase text-content-secondary">
            {caseData.projectTag}
          </span>
        )}
      </nav>

      {/* 2. CASE STUDY HEADER */}
      <header className="flex w-full flex-col gap-[12px] border-b border-border-hardware pb-[24px]">
        <h1 className="font-hauora text-[26px] sm:text-[32px] font-medium leading-[32px] sm:leading-[40px] text-content-primary tracking-tight">
          {caseData.title}
        </h1>
        {caseData.tagline && (
          <p className="font-hauora text-[17px] sm:text-[19px] font-light leading-[25px] sm:leading-[27px] text-content-secondary">
            {caseData.tagline}
          </p>
        )}
      </header>

      {/* 3. MODULAR CASE BLOCKS (Universal layout engine) */}
      <div className="flex w-full flex-col gap-[32px] sm:gap-[44px]">
        {caseData.blocks.map((block, idx) => (
          <CaseBlockRenderer key={block._key || idx} block={block} />
        ))}
      </div>

      {/* 4. FOOTER RETURN & CONTACT */}
      <footer className="mt-[24px] flex w-full flex-col items-start gap-[16px] border-t border-border-hardware pt-[32px]">
        <Link
          href="/"
          className="group inline-flex items-center gap-[8px] font-hauora text-[16px] font-medium text-content-primary hover:text-white transition-colors duration-150"
        >
          <span className="transition-transform duration-150 group-hover:-translate-x-1">
            ←
          </span>
          <span>Back to all works</span>
        </Link>
        <span className="font-hauora text-[13px] text-content-secondary">
          Crafted with Next.js, Sanity Studio & Figma MCP
        </span>
      </footer>
    </article>
  );
}
