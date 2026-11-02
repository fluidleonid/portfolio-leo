"use client";

import React from "react";
import { Gallery, MetadataTable, Section } from "@/shared/ui";
import type {
  CaseContentBlock,
  MetadataTableBlock,
  SectionHeadingBlock,
  ProblemListBlock,
  TeamSectionBlock,
  DiscoverySectionBlock,
  HypothesesSectionBlock,
  GalleryBlock,
  MetricsBlock,
  TextBlock,
  QuoteCalloutBlock,
} from "@/entities/case-study";

export interface CaseBlockRendererProps {
  block: CaseContentBlock;
}

export function CaseBlockRenderer({ block }: CaseBlockRendererProps) {
  switch (block._type) {
    case "metadataTable": {
      const b = block as MetadataTableBlock;
      return (
        <div className="w-full">
          <MetadataTable rows={b.rows} />
        </div>
      );
    }

    case "sectionHeading": {
      const b = block as SectionHeadingBlock;
      return (
        <div className="flex w-full flex-col gap-[8px] pt-[8px]">
          {b.badge && (
            <span className="font-hauora text-[13px] font-medium tracking-[0.06em] uppercase text-content-secondary">
              {b.badge}
            </span>
          )}
          <h2 className="font-hauora text-[20px] sm:text-[22px] font-medium leading-[28px] text-content-primary">
            {b.title}
          </h2>
          {b.description && (
            <p className="font-hauora text-[16px] sm:text-[18px] font-light leading-[24px] text-content-primary">
              {b.description}
            </p>
          )}
        </div>
      );
    }

    case "problemList": {
      const b = block as ProblemListBlock;
      return (
        <div className="flex w-full flex-col gap-[16px]">
          {b.badge && (
            <span className="font-hauora text-[13px] font-medium tracking-[0.06em] uppercase text-content-secondary">
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="font-hauora text-[18px] sm:text-[20px] font-medium leading-[26px] text-content-primary">
              {b.title}
            </h3>
          )}
          <div className="flex flex-col gap-[16px]">
            {b.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-[6px] border-l-2 border-border-hardware pl-[16px] py-[2px]"
              >
                <div className="flex items-center justify-between gap-[12px]">
                  <h4 className="font-hauora text-[16px] sm:text-[18px] font-medium text-content-primary leading-[24px]">
                    {item.title}
                  </h4>
                  {item.metric && (
                    <span className="font-hauora text-[12px] px-[8px] py-[2px] rounded-[4px] border border-border-hardware text-content-secondary shrink-0 select-none">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="font-hauora text-[15px] sm:text-[16px] font-light text-content-secondary leading-[22px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "teamSection": {
      const b = block as TeamSectionBlock;
      return (
        <div className="flex w-full flex-col gap-[16px]">
          {b.badge && (
            <span className="font-hauora text-[13px] font-medium tracking-[0.06em] uppercase text-content-secondary">
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="font-hauora text-[18px] sm:text-[20px] font-medium leading-[26px] text-content-primary">
              {b.title}
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] w-full">
            {b.composition.map((member, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-[14px] rounded-[8px] border border-border-hardware bg-transparent"
              >
                <span className="font-hauora text-[12px] text-content-secondary uppercase tracking-wider">
                  {member.role}
                </span>
                <span className="font-hauora text-[15px] sm:text-[16px] font-medium text-content-primary mt-[4px]">
                  {member.name || member.details}
                </span>
                {member.name && member.details && (
                  <span className="font-hauora text-[13px] text-content-secondary mt-[2px]">
                    {member.details}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "discoverySection": {
      const b = block as DiscoverySectionBlock;
      return (
        <div className="flex w-full flex-col gap-[16px]">
          {b.badge && (
            <span className="font-hauora text-[13px] font-medium tracking-[0.06em] uppercase text-content-secondary">
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="font-hauora text-[18px] sm:text-[20px] font-medium leading-[26px] text-content-primary">
              {b.title}
            </h3>
          )}
          {b.method && (
            <div className="font-hauora text-[14px] text-content-secondary">
              <span className="text-content-secondary/70">Method: </span>
              {b.method}
            </div>
          )}
          <div className="flex flex-col gap-[12px]">
            {b.findings.map((f, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-[4px] border-b border-border-hardware pb-[14px]"
              >
                <div className="flex items-baseline justify-between gap-[12px]">
                  <span className="font-hauora text-[15px] sm:text-[16px] font-medium text-content-primary">
                    {f.title}
                  </span>
                  {f.stat && (
                    <span className="font-hauora text-[14px] font-medium text-content-primary shrink-0">
                      {f.stat}
                    </span>
                  )}
                </div>
                <p className="font-hauora text-[14px] sm:text-[15px] font-light text-content-secondary leading-[22px]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "hypothesesSection": {
      const b = block as HypothesesSectionBlock;
      return (
        <div className="flex w-full flex-col gap-[16px]">
          {b.badge && (
            <span className="font-hauora text-[13px] font-medium tracking-[0.06em] uppercase text-content-secondary">
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="font-hauora text-[18px] sm:text-[20px] font-medium leading-[26px] text-content-primary">
              {b.title}
            </h3>
          )}
          <div className="flex flex-col gap-[12px]">
            {b.items.map((hyp, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-[4px] p-[16px] rounded-[10px] border border-border-hardware bg-transparent"
              >
                <span className="font-hauora text-[15px] sm:text-[16px] font-medium text-content-primary">
                  {hyp.title}
                </span>
                <p className="font-hauora text-[14px] sm:text-[15px] font-light text-content-secondary leading-[22px]">
                  {hyp.description}
                </p>
                {hyp.expectedOutcome && (
                  <div className="mt-[4px] font-hauora text-[13px] text-content-secondary flex items-center gap-[6px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-content-secondary inline-block" />
                    <span>{hyp.expectedOutcome}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "galleryBlock": {
      const b = block as GalleryBlock;
      return (
        <div className="w-full flex flex-col gap-[10px]">
          <Gallery
            bleed={true}
            height={b.height || 540}
            padding={28}
            gap={20}
            cornerRadius={0}
            images={b.images}
          />
          {b.caption && (
            <span className="font-hauora text-[14px] font-light text-content-secondary italic px-[4px]">
              {b.caption}
            </span>
          )}
        </div>
      );
    }

    case "metricsBlock": {
      const b = block as MetricsBlock;
      return (
        <div className="flex w-full flex-col gap-[16px]">
          {b.badge && (
            <span className="font-hauora text-[13px] font-medium tracking-[0.06em] uppercase text-content-secondary">
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="font-hauora text-[18px] sm:text-[20px] font-medium leading-[26px] text-content-primary">
              {b.title}
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[14px] w-full">
            {b.items.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-[4px] p-[16px] rounded-[10px] border border-border-hardware bg-transparent"
              >
                <span className="font-hauora text-[26px] sm:text-[32px] font-medium leading-[32px] sm:leading-[38px] text-content-primary tracking-tight">
                  {m.value}
                </span>
                <span className="font-hauora text-[13px] sm:text-[14px] font-medium text-content-secondary">
                  {m.label}
                </span>
                {m.description && (
                  <span className="font-hauora text-[12px] text-content-secondary/70 leading-[16px]">
                    {m.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "textBlock": {
      const b = block as TextBlock;
      return (
        <div className="flex w-full flex-col gap-[8px]">
          {b.content
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, idx) => (
              <p
                key={idx}
                className="font-hauora text-[16px] sm:text-[18px] font-light leading-[24px] sm:leading-[26px] text-content-primary whitespace-pre-line"
              >
                {para}
              </p>
            ))}
        </div>
      );
    }

    case "quoteCallout": {
      const b = block as QuoteCalloutBlock;
      return (
        <div className="flex w-full flex-col gap-[8px] p-[20px] sm:p-[24px] rounded-[10px] border border-border-hardware bg-canvas-soft/30">
          <p className="font-hauora text-[16px] sm:text-[18px] font-normal italic leading-[24px] sm:leading-[26px] text-content-primary">
            &ldquo;{b.quote}&rdquo;
          </p>
          {(b.author || b.role) && (
            <div className="flex items-center gap-[6px] font-hauora text-[13px] text-content-secondary">
              {b.author && <span className="font-medium text-content-primary">{b.author}</span>}
              {b.author && b.role && <span>·</span>}
              {b.role && <span>{b.role}</span>}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
