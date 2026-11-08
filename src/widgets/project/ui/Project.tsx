"use client";

import React from "react";
import { Section, Gallery, CaseLink } from "@/shared/ui";
import type { CaseItem, Achievement } from "@/entities/project";

export interface ProjectProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main project title (default: "Project name") */
  title?: string;
  /** Project summary / pitch (default: "Project description") */
  description?: string;
  /** List of image URLs for the horizontal gallery */
  images?: string[];
  /** Key achievements list with glowing amber lamps (rendered in the left "KEY" Section) */
  keyAchievements?: (string | Achievement)[];
  /** Backwards compatibility alias for key achievements */
  keyCases?: CaseItem[];
  /** Segment types for filtering (e.g. ["B2B"], ["B2C"]) */
  projectType?: ("B2B" | "B2C" | string)[];
  /** Detailed case study items (rendered in the right "CASE" Section) */
  caseStudies?: CaseItem[];
}

/**
 * Flagman Project Section Component (FSD Widget)
 *
 * Structure:
 * 1. Horizontal Image Gallery (86:1101):
 *    - Full-bleed unclipped track (100vw, marginLeft: -leftOffset).
 *    - Inner wrapper 600px tall with 28px padding and 20px gap, scrolls together with images.
 * 2. Title Block:
 *    - Heading: "Project name", Hauora 18px / 24px medium, text-content-primary
 *    - Description: "Project description", Hauora 18px / 24px regular, text-content-primary
 * 3. Cases Row:
 *    - Left Section (KEY): achievements list with skeuomorphic amber indicator lamps
 *    - Right Section (CASE): interactive case study buttons (completely hidden if 0 cases, KEY expands to full width)
 */
export const Project = React.forwardRef<HTMLDivElement, ProjectProps>(
  (
    {
      title = "Project name",
      description = "Project description",
      images = ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
      keyAchievements,
      keyCases,
      caseStudies = [],
      projectType,
      className = "",
      ...props
    },
    ref
  ) => {
    // Resolve key achievements list (supporting both keyAchievements and keyCases)
    const resolvedAchievements: (string | Achievement)[] =
      keyAchievements ??
      keyCases ?? [
        { label: "Key achievement 1" },
        { label: "Key achievement 2" },
      ];

    const hasCases = Boolean(caseStudies && caseStudies.length > 0);

    return (
      <section
        ref={ref}
        data-project-type={projectType ? projectType.join(" ") : undefined}
        className={`relative flex w-full max-w-[564px] flex-col gap-[16px] sm:gap-[32px] select-none scroll-mt-[100px] ${className}`}
        aria-label={title}
        {...props}
      >
        {/* 1. HORIZONTAL IMAGE GALLERY (Figma node `image-scroll 86:1101`) */}
        <Gallery
          bleed={true}
          height={600}
          padding={28}
          gap={20}
          cornerRadius={0}
          images={images}
        />

        {/* 2. TITLE & DESCRIPTION BLOCK (564px, positioned under gallery) */}
        <div className="flex w-full flex-col gap-[8px]">
          <h2 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
            {title}
          </h2>
          <div className="flex flex-col gap-[8px]">
            {description
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
        </div>

        {/* 3. CASE & KEY SECTIONS (Always vertical, CASE strictly above KEY) */}
        <div className="flex w-full flex-col items-stretch gap-[20px] sm:gap-[28px]">
          {/* Top Block: CASE - Interactive Case Studies with Indicator Lamps */}
          {hasCases && (
            <Section
              label="CASE"
              direction="column"
              className="w-full justify-start items-stretch gap-[8px] sm:gap-[16px] p-[16px] sm:px-[28px] sm:py-[28px]"
            >
              {caseStudies.map((item, idx) => (
                <CaseLink
                  key={item.id ?? idx}
                  label={item.label}
                  href={item.href}
                  active={item.active}
                  onClick={item.onClick}
                  lampSize={20}
                />
              ))}
            </Section>
          )}

          {/* Bottom Block: KEY - Achievements list with dash in Hauora Light 18 */}
          <Section
            label="KEY"
            direction="column"
            className="w-full justify-start items-stretch gap-[8px] sm:gap-[16px] p-[16px] sm:px-[28px] sm:py-[28px]"
          >
            {resolvedAchievements.map((item, idx) => {
              const label = typeof item === "string" ? item : item.label;
              const id = typeof item === "object" && item.id ? item.id : idx;

              return (
                <div
                  key={id}
                  className="flex w-full flex-row items-start gap-[8px] select-none"
                >
                  <span className="shrink-0 font-hauora font-light text-[18px] leading-[24px] text-content-primary">
                    —
                  </span>
                  <span className="flex-1 min-w-0 font-hauora font-light text-[18px] leading-[24px] text-content-primary break-words whitespace-normal">
                    {label}
                  </span>
                </div>
              );
            })}
          </Section>
        </div>
      </section>
    );
  }
);

Project.displayName = "Project";
