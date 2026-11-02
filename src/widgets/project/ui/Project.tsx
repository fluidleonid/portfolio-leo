"use client";

import React from "react";
import { Section, Button, Gallery, AchievementItem } from "@/shared/ui";
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
          cornerRadius={0}
          images={images}
        />

        {/* 2. TITLE & DESCRIPTION BLOCK (564x56px, positioned under gallery) */}
        <div className="flex w-full flex-col gap-[8px]">
          <h2 className="text-[18px] font-medium leading-[24px] text-content-primary font-hauora tracking-normal">
            {title}
          </h2>
          <p className="text-[18px] font-light leading-[24px] text-content-primary font-hauora whitespace-pre-line tracking-normal">
            {description}
          </p>
        </div>

        {/* 3. CASES ROW: Responsive (auto-height content on mobile, equalized height on desktop) */}
        <div className="flex w-full flex-col sm:flex-row items-stretch gap-[16px] sm:gap-[32px]">
          {/* Left Block: KEY - Key Achievements with Glowing Amber Indicator Lamps */}
          <Section label="KEY" direction="column" className="w-full sm:w-[266px] sm:flex-1 justify-center items-stretch gap-[8px] sm:gap-[18px] p-[16px] sm:px-[28px] sm:py-[28px]"
          >
            {resolvedAchievements.map((item, idx) => {
              const label = typeof item === "string" ? item : item.label;
              const active = typeof item === "string" ? true : item.active !== false;
              const id = typeof item === "object" && item.id ? item.id : idx;

              return (
                <AchievementItem
                  key={id}
                  label={label}
                  active={active}
                />
              );
            })}
          </Section>

          {/* Right Block: CASE - Interactive Case Study Buttons */}
          <Section label="CASE" direction="column" className="w-full sm:w-[266px] sm:flex-1 justify-center items-stretch gap-[8px] sm:gap-[16px] p-[16px] sm:px-[28px] sm:py-[28px]"
          >
            {caseStudies.map((item, idx) => {
              const btn = (
                <Button
                  key={item.id ?? idx}
                  label={item.label}
                  labelPosition="right"
                  onClick={item.onClick}
                  aria-label={item.label}
                  className="w-full"
                />
              );

              if (item.href) {
                return (
                  <a
                    key={item.id ?? idx}
                    href={item.href}
                    className="cursor-pointer w-full flex">{btn}
                  </a>
                );
              }

              return btn;
            })}
          </Section>
        </div>
      </section>
    );
  }
);

Project.displayName = "Project";
