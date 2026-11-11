"use client";

import React from "react";
import { Gallery, MetadataTable } from "@/shared/ui";
import type {
  CaseContentBlock,
  MetadataTableBlock,
  SectionHeadingBlock,
  ProblemListBlock,
  CardsBlock,
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
  id?: string;
}

export function CaseBlockRenderer({ block, id }: CaseBlockRendererProps) {
  const blockDomId =
    "anchor" in block && typeof block.anchor === "string" && block.anchor.trim()
      ? block.anchor.trim().toLowerCase()
      : id;

  switch (block._type) {
    case "metadataTable": {
      const b = block as MetadataTableBlock;
      return (
        <div id={blockDomId} className="w-full flex flex-col gap-[12px] scroll-mt-[100px]">
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
          <MetadataTable rows={b.rows} />
        </div>
      );
    }

    case "sectionHeading": {
      const b = block as SectionHeadingBlock;
      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[8px] scroll-mt-[100px]">
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
        <div id={blockDomId} className="flex w-full flex-col gap-[12px] scroll-mt-[100px]">
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
          <div className="flex w-full flex-col gap-[8px]">
            {b.items.map((item, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px]">
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
        </div>
      );
    }

    case "cardsBlock": {
      const b = block as CardsBlock;
      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[12px] scroll-mt-[100px]">
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
          {b.description && (
            <p className="text-[16px] sm:text-[18px] font-light leading-[22px] sm:leading-[24px] text-content-secondary font-hauora whitespace-pre-line tracking-normal">
              {b.description}
            </p>
          )}
          <div className="flex w-full flex-col gap-[12px] sm:gap-[16px] mt-[4px]">
            {(b.items || []).map((card, idx) => (
              <div
                key={card._key || idx}
                className="flex w-full flex-col gap-[6px] sm:gap-[8px] rounded-[12px] bg-[#242424] p-[16px] sm:p-[20px]"
              >
                <div className="flex items-center justify-between gap-[8px]">
                  {card.title && (
                    <h4 className="font-hauora font-medium text-[16px] sm:text-[18px] leading-[22px] sm:leading-[24px] text-content-primary">
                      {card.title}
                    </h4>
                  )}
                  {card.tag && (
                    <span className="font-hauora font-light text-[14px] text-content-secondary shrink-0">
                      ({card.tag})
                    </span>
                  )}
                </div>
                {card.description && (
                  <p className="font-hauora font-light text-[14px] sm:text-[15px] leading-[20px] sm:leading-[22px] text-content-secondary whitespace-pre-line">
                    {card.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "teamSection": {
      const b = block as TeamSectionBlock;
      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[12px] scroll-mt-[100px]">
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
          <div className="flex w-full flex-col gap-[8px]">
            {b.composition.map((member, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px]">
                <span className="shrink-0 font-hauora font-light text-[18px] leading-[24px] text-content-primary">
                  —
                </span>
                <div className="flex flex-1 flex-row flex-wrap items-baseline gap-[8px]">
                  <span className="font-hauora text-[18px] font-medium leading-[24px] text-content-primary">
                    {member.role}:
                  </span>
                  <span className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary">
                    {member.name || member.details}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "discoverySection": {
      const b = block as DiscoverySectionBlock;
      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[12px] scroll-mt-[100px]">
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
          {b.method && (
            <p className="font-hauora font-light text-[18px] leading-[24px] text-content-secondary">
              Method: {b.method}
            </p>
          )}
          <div className="flex w-full flex-col gap-[8px]">
            {b.findings.map((f, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px]">
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
        </div>
      );
    }

    case "hypothesesSection": {
      const b = block as HypothesesSectionBlock;
      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[12px] scroll-mt-[100px]">
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
          <div className="flex w-full flex-col gap-[8px]">
            {b.items.map((hyp, idx) => (
              <div key={idx} className="flex w-full flex-row items-start gap-[8px]">
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
        </div>
      );
    }

    case "galleryBlock": {
      const b = block as GalleryBlock;

      const spacingClass =
        b.spacing === "tight"
          ? "-mt-[10px] sm:-mt-[16px]"
          : b.spacing === "flush"
          ? "-mt-[20px] sm:-mt-[32px]"
          : b.spacing === "relaxed"
          ? "mt-[16px] sm:mt-[24px]"
          : "";

      const customMarginTop =
        typeof b.marginTopOffset === "number" && !isNaN(b.marginTopOffset)
          ? `${b.marginTopOffset}px`
          : undefined;

      return (
        <div
          id={blockDomId}
          className={`w-full flex flex-col gap-[8px] scroll-mt-[100px] ${spacingClass}`}
          style={customMarginTop ? { marginTop: customMarginTop } : undefined}
        >
          {b.badge && (
            <span
              className="text-[14px] font-normal leading-[24px] text-content-badge font-hauora uppercase tracking-normal"
              style={{ color: "var(--color-content-badge, rgba(204, 204, 204, 0.16))" }}
            >
              {b.badge}
            </span>
          )}
          {b.title && (
            <h3 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal px-[4px]">
              {b.title}
            </h3>
          )}
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
      const count = b.items?.length || 0;
      const gridCols =
        count === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : count === 4
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-3";

      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[12px] scroll-mt-[100px]">
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
          <div className={`grid ${gridCols} gap-[12px] sm:gap-[16px] w-full`}>
            {b.items.map((m, idx) => (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-[12px] border border-border-hardware bg-transparent p-[16px] sm:p-[20px] gap-[8px]"
              >
                <span className="font-hauora text-[28px] sm:text-[34px] font-medium leading-[34px] sm:leading-[40px] text-content-primary tracking-tight">
                  {m.value}
                </span>
                <div className="flex flex-col gap-[2px]">
                  <span className="font-hauora font-light text-[14px] leading-[20px] text-content-primary">
                    {m.label}
                  </span>
                  {m.description && (
                    <span className="font-hauora font-light text-[14px] leading-[20px] text-content-secondary">
                      {m.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "textBlock": {
      const b = block as TextBlock;
      return (
        <div id={blockDomId} className="flex w-full flex-col gap-[8px] scroll-mt-[100px]">
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
        <div id={blockDomId} className="flex w-full flex-col gap-[8px] scroll-mt-[100px]">
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
