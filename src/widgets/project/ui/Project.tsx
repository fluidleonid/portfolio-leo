"use client";

import React from "react";
import { Section, Gallery, Lamp } from "@/shared/ui";
import type { CaseItem, Achievement } from "@/entities/project";

export interface ProjectProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main project title (default: "Project name") */
  title?: string;
  /** Project summary / pitch (default: "Project description") */
  description?: string;
  /** Role contribution summary (optional) */
  roleDescription?: string;
  /** List of image URLs for the horizontal gallery */
  images?: string[];
  /** Key achievements list with glowing amber lamps (rendered in the left "KEY" Section) */
  keyAchievements?: (string | Achievement)[];
  /** Backwards compatibility alias for key achievements */
  keyCases?: CaseItem[];
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
 *    - Left Section (KEY): 266x154px, list of key achievements with skeuomorphic amber indicator lamps
 *    - Right Section (CASE): 266x154px, interactive case study buttons
 */
export const Project = React.forwardRef<HTMLDivElement, ProjectProps>(
  (
    {
      title = "Project name",
      description = "Project description",
      roleDescription,
      images = ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
      keyAchievements,
      keyCases,
      caseStudies = [{ label: "Case 1" }, { label: "Case 2" }],
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

    return (
      <section
        ref={ref}
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
          cornerRadius={12}
          images={images}
        />

        {/* 2. TITLE & DESCRIPTION BLOCK (564px, positioned under gallery) */}
        <div className="flex w-full flex-col gap-[8px]">
          <h2 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
            {title}
          </h2>
          <div className="flex flex-col gap-[4px]">
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

        {/* 3. CASES ROW: Responsive (auto-height content on mobile, equalized height on desktop) */}
        <div className="flex w-full flex-col sm:flex-row items-stretch gap-[16px] sm:gap-[32px]">
          {/* Left Block: KEY - Achievements list with dash in Hauora Light 18 */}
          <Section
            label="KEY"
            direction="column"
            className="w-full sm:w-[266px] sm:flex-1 justify-start items-stretch gap-[8px] sm:gap-[16px] p-[16px] sm:px-[28px] sm:py-[28px]"
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

          {/* Right Block: CASE - Interactive Case Studies with Small Indicator Lamps in Hauora Light 18 */}
          <Section
            label="CASE"
            direction="column"
            className="w-full sm:w-[266px] sm:flex-1 justify-start items-stretch gap-[8px] sm:gap-[16px] p-[16px] sm:px-[28px] sm:py-[28px]"
          >
            {caseStudies.map((item, idx) => {
              const isAvailable = item.active !== false;
              const key = item.id ?? idx;

              const content = (
                <div
                  className={`group flex w-full flex-row items-center gap-[10px] select-none transition-colors duration-150 ${
                    isAvailable ? "cursor-pointer" : "cursor-default opacity-50"
                  }`}
                >
                  {/* Small Indicator Lamp (Jewel LED) */}
                  <div className="shrink-0 flex items-center justify-center">
                    <Lamp size={10} active={isAvailable} />
                  </div>

                  {/* Case Title with Hauora Light 18, color #CCCCCC, whiter on hover */}
                  <span
                    className={`flex-1 min-w-0 font-hauora font-light text-[18px] leading-[24px] ${
                      isAvailable
                        ? "text-content-primary group-hover:text-content-contrast"
                        : "text-content-muted"
                    } transition-colors duration-150 break-words whitespace-normal`}
                  >
                    {item.label}
                  </span>
                </div>
              );

              if (item.href && isAvailable) {
                return (
                  <a
                    key={key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex"
                  >
                    {content}
                  </a>
                );
              }

              if (item.onClick && isAvailable) {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={item.onClick}
                    className="w-full flex text-left cursor-pointer bg-transparent border-0 p-0"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div key={key} className="w-full flex">
                  {content}
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
