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
            <span
              className="text-[14px] font-normal leading-[24px] text-content-badge font-hauora uppercase tracking-normal"
              style={{ color: "var(--color-content-badge, rgba(204, 204, 204, 0.16))" }}
            >
              {b.badge}
            </span>
          )}
          <h2 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
            {b.title}
          </h2>
          {b.description && (
            <p className="text-[18px] font-light leading-[24px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
              {b.description}
            </p>
          )}
        </div>
      );
    }

    case "problemList": {
      const b = block as ProblemListBlock;
      return (
        <Section
          label={b.badge || "PROBLEM"}
          direction="column"
          className="w-full justify-start items-stretch gap-[12px] p-[16px] sm:px-[28px] sm:py-[24px]"
        >
          {b.title && (
            <h3 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
              {b.title}
            </h3>
          )}
          <div className="flex w-full flex-col gap-[12px]">
            {b.items.map((item, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px] select-none">
                <span className="shrink-0 font-hauora font-light text-[18px] leading-[24px] text-content-primary">
                  —
                </span>
                <div className="flex flex-1 flex-col gap-[2px]">
                  <div className="flex items-center justify-between gap-[8px]">
                    <span className="font-hauora font-medium text-[18px] leading-[24px] text-content-primary">
                      {item.title}
                    </span>
                    {item.metric && (
                      <span className="font-hauora font-light text-[14px] text-content-secondary shrink-0">
                        ({item.metric})
                      </span>
                    )}
                  </div>
                  <span className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "teamSection": {
      const b = block as TeamSectionBlock;
      return (
        <Section
          label={b.badge || "TEAM"}
          direction="column"
          className="w-full justify-start items-stretch gap-[12px] p-[16px] sm:px-[28px] sm:py-[24px]"
        >
          {b.title && (
            <h3 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
              {b.title}
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] w-full">
            {b.composition.map((member, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-start rounded-[8px] border border-border-hardware p-[12px]"
              >
                <span className="font-hauora text-[14px] font-normal leading-[20px] text-content-secondary uppercase">
                  {member.role}
                </span>
                <span className="font-hauora font-light text-[18px] leading-[24px] text-content-primary mt-[2px]">
                  {member.name || member.details}
                </span>
                {member.name && member.details && (
                  <span className="font-hauora font-light text-[14px] leading-[20px] text-content-secondary mt-[2px]">
                    {member.details}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "discoverySection": {
      const b = block as DiscoverySectionBlock;
      return (
        <Section
          label={b.badge || "DISCOVERY"}
          direction="column"
          className="w-full justify-start items-stretch gap-[12px] p-[16px] sm:px-[28px] sm:py-[24px]"
        >
          {b.title && (
            <h3 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
              {b.title}
            </h3>
          )}
          {b.method && (
            <p className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary">
              Method: {b.method}
            </p>
          )}
          <div className="flex w-full flex-col gap-[12px]">
            {b.findings.map((f, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px] select-none">
                <span className="shrink-0 font-hauora font-light text-[18px] leading-[24px] text-content-primary">
                  —
                </span>
                <div className="flex flex-1 flex-col gap-[2px]">
                  <div className="flex items-center justify-between gap-[8px]">
                    <span className="font-hauora font-medium text-[18px] leading-[24px] text-content-primary">
                      {f.title}
                    </span>
                    {f.stat && (
                      <span className="font-hauora font-medium text-[16px] text-content-primary shrink-0">
                        {f.stat}
                      </span>
                    )}
                  </div>
                  <span className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary">
                    {f.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "hypothesesSection": {
      const b = block as HypothesesSectionBlock;
      return (
        <Section
          label={b.badge || "HYPOTHESES"}
          direction="column"
          className="w-full justify-start items-stretch gap-[12px] p-[16px] sm:px-[28px] sm:py-[24px]"
        >
          {b.title && (
            <h3 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
              {b.title}
            </h3>
          )}
          <div className="flex w-full flex-col gap-[12px]">
            {b.items.map((hyp, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px] select-none">
                <span className="shrink-0 font-hauora font-light text-[18px] leading-[24px] text-content-primary">
                  —
                </span>
                <div className="flex flex-1 flex-col gap-[2px]">
                  <span className="font-hauora font-medium text-[18px] leading-[24px] text-content-primary">
                    {hyp.title}
                  </span>
                  <span className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary">
                    {hyp.description}
                  </span>
                  {hyp.expectedOutcome && (
                    <span className="font-hauora font-light text-[14px] text-content-secondary/80 mt-[2px]">
                      Expected outcome: {hyp.expectedOutcome}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "galleryBlock": {
      const b = block as GalleryBlock;
      return (
        <div className="w-full flex flex-col gap-[8px]">
          <Gallery
            bleed={true}
            height={b.height || 600}
            padding={28}
            gap={20}
            cornerRadius={0}
            images={b.images}
          />
          {b.caption && (
            <p className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary px-[4px]">
              {b.caption}
            </p>
          )}
        </div>
      );
    }

    case "metricsBlock": {
      const b = block as MetricsBlock;
      return (
        <div className="flex w-full flex-col gap-[12px]">
          {b.badge && (
            <span
              className="text-[14px] font-normal leading-[24px] text-content-badge font-hauora uppercase tracking-normal"
              style={{ color: "var(--color-content-badge, rgba(204, 204, 204, 0.16))" }}
            >
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
              {b.title}
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[12px] w-full">
            {b.items.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-[4px] rounded-[10px] border border-border-hardware p-[16px] bg-transparent"
              >
                <span className="font-hauora text-[28px] sm:text-[34px] font-medium leading-[34px] sm:leading-[40px] text-content-primary tracking-tight">
                  {m.value}
                </span>
                <span className="font-hauora font-medium text-[14px] leading-[20px] text-content-secondary">
                  {m.label}
                </span>
                {m.description && (
                  <span className="font-hauora font-light text-[14px] leading-[18px] text-content-secondary/80">
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
        <div className="flex w-full flex-col gap-[4px]">
          {b.content
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, idx) => (
              <p
                key={idx}
                className="text-[18px] font-light leading-[24px] text-content-primary font-hauora whitespace-pre-line tracking-normal"
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
        <div className="flex w-full flex-col gap-[8px] rounded-[10px] border border-border-hardware p-[20px] sm:p-[24px] bg-canvas-soft/30">
          <p className="font-hauora font-light italic text-[18px] leading-[24px] text-content-primary">
            &ldquo;{b.quote}&rdquo;
          </p>
          {(b.author || b.role) && (
            <div className="flex items-center gap-[6px] font-hauora text-[14px] font-normal text-content-secondary">
              {b.author && <span className="text-content-primary">{b.author}</span>}
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
