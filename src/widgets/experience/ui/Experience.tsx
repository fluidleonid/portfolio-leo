"use client";

import React from "react";
import { tokens } from "@/shared/config";

export interface ExperienceItem {
  id: string;
  startMonth: string;
  startYear: string;
  endDate: string;
  company: string;
  role: string;
  description: string;
}

export interface EducationItem {
  id: string;
  startYear: string;
  endYear: string;
  institution: string;
  degree: string;
}

export interface ExperienceProps extends React.HTMLAttributes<HTMLDivElement> {
  experiences?: ExperienceItem[];
  education?: EducationItem[];
}

const DEFAULT_EXPERIENCES: ExperienceItem[] = [
  {
    id: "alexfrontend",
    startMonth: "Apr",
    startYear: "2024",
    endDate: "Jul 2026",
    company: "AlexFrontEnd",
    role: "Product Designer",
    description:
      "Drove end-to-end product design across key client platforms, leading UX architecture, design systems, and delivery from 0→1 to production.",
  },
  {
    id: "quidzi",
    startMonth: "May",
    startYear: "2023",
    endDate: "Apr 2024",
    company: "Quidzi Labs",
    role: "Product Designer",
    description:
      "Owned the comprehensive interface audit and end-to-end product evolution of an active AI-driven collaboration MVP, rebuilding it into a scalable platform.",
  },
  {
    id: "butalia",
    startMonth: "Oct",
    startYear: "2021",
    endDate: "Apr 2023",
    company: "Butalia Media",
    role: "UX/UI Designer",
    description:
      "Partnered with product teams to design core experiences across B2B hospitality booking, AI accounting, AI-powered content tools, and peer-to-peer marketplaces.",
  },
  {
    id: "self-employed",
    startMonth: "Apr",
    startYear: "2015",
    endDate: "Feb 2021",
    company: "Self-Employed",
    role: "UX/UI Designer",
    description:
      "Delivered end-to-end interface and digital solutions for international commercial clients and startups.",
  },
];

const DEFAULT_EDUCATION: EducationItem[] = [
  {
    id: "spb-bonch",
    startYear: "2011 –",
    endYear: "2015",
    institution: "St. Petersburg State University of Telecommunications",
    degree: "Bachelor of Information Technology",
  },
];

export const Experience: React.FC<ExperienceProps> = ({
  experiences = DEFAULT_EXPERIENCES,
  education = DEFAULT_EDUCATION,
  className = "",
  ...props
}) => {
  return (
    <section
      id="experience"
      className={`flex w-full max-w-[564px] flex-col select-none scroll-mt-[100px] ${className}`}
      aria-label="Work Experience and Education"
      {...props}
    >
      {/* 1. Experience Block */}
      <div className="flex w-full flex-col">
        <h2 className="font-hauora text-[20px] font-medium leading-[26px] text-content-contrast tracking-normal mb-[8px]">
          Experience
        </h2>

        <div className="flex w-full flex-col">
          {experiences.map((item) => (
            <div
              key={item.id}
              className="flex w-full flex-row items-start border-b border-border-subtle py-[20px] transition-colors duration-150 hover:border-content-muted"
            >
              {/* Left Column: Start Date (Month / Year stacked) */}
              <div className="flex w-[58px] sm:w-[72px] shrink-0 flex-col font-hauora text-[12px] sm:text-[13px] leading-[18px] text-content-muted">
                <span>{item.startMonth}</span>
                <span>{item.startYear}</span>
              </div>

              {/* Center Column: Company, Role, and Header Work Summary */}
              <div className="flex flex-1 flex-col gap-[2px] pr-[12px] sm:pr-[16px]">
                <span className="font-hauora text-[15px] font-medium leading-[20px] text-content-contrast">
                  {item.company}
                </span>
                <span className="font-hauora text-[14px] leading-[20px] text-content-secondary">
                  {item.role}
                </span>
                {item.description && (
                  <p className="mt-[4px] font-hauora text-[13px] leading-[19px] text-content-muted whitespace-pre-line">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Right Column: End Date / Status */}
              <div className="w-[70px] sm:w-[84px] shrink-0 text-right font-hauora text-[12px] sm:text-[13px] leading-[20px] text-content-muted">
                {item.endDate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Education Block */}
      <div className="mt-[56px] flex w-full flex-col">
        <h2 className="font-hauora text-[20px] font-medium leading-[26px] text-content-contrast tracking-normal mb-[8px]">
          Education
        </h2>

        <div className="flex w-full flex-col">
          {education.map((item) => (
            <div
              key={item.id}
              className="flex w-full flex-row items-start border-b border-border-subtle py-[20px] transition-colors duration-150 hover:border-content-muted"
            >
              {/* Left Column: Period (Start Year – / End Year stacked) */}
              <div className="flex w-[58px] sm:w-[72px] shrink-0 flex-col font-hauora text-[12px] sm:text-[13px] leading-[18px] text-content-muted">
                <span>{item.startYear}</span>
                <span>{item.endYear}</span>
              </div>

              {/* Center Column: Institution & Degree */}
              <div className="flex flex-1 flex-col gap-[2px] pr-[12px] sm:pr-[16px]">
                <span className="font-hauora text-[15px] font-medium leading-[20px] text-content-contrast">
                  {item.institution}
                </span>
                <span className="font-hauora text-[14px] leading-[20px] text-content-secondary">
                  {item.degree}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
