"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/widgets/hero";
import { Project } from "@/widgets/project";
import { TopBar } from "@/widgets/top-bar";
import { Experience } from "@/widgets/experience";
import type { ProjectData } from "@/entities/project";

export interface PortfolioViewProps {
  projects: ProjectData[];
  aboutParagraphs?: string[];
}

export function PortfolioView({
  projects,
  aboutParagraphs = [
    "I design data-dense B2B and B2C systems, FinTech tools, and products where every single detail matters, while keeping interfaces clean and friction-free. My workflow is built on a tight bridge between design and frontend: I don't just sketch in Figma, I build components in React, manage design tokens, and connect design directly to the codebase. I also love sharing this craft and mentoring designers along the way.",
    "AI agents are integrated into every stage of my pipeline—from brainstorming and rapid component prototyping to automation and writing custom skills. At the same time, I never blindly trust automation; every single artifact, line of code, and design decision goes through my strict manual review and refinement.",
    "Outside of design, I recharge on the badminton court, hitting mountain trails with friends, and spending time with my wife and our dog. I'm genuinely driven by building cool, lively products and connecting with passionate people.",
  ],
}: PortfolioViewProps) {
  const [activeStation, setActiveStation] = useState<string>("index");
  const [theme, setTheme] = useState<"monochrome" | "amber">("amber");

  // Synchronize active station based on viewport scroll position
  useEffect(() => {
    const sectionIds = [
      { id: "top", station: "index" },
      ...projects.map((proj, idx) => {
        const anchorId =
          proj.anchorId || (idx === 0 ? "works" : `project-${idx + 1}`);
        return { id: anchorId, station: anchorId };
      }),
      { id: "career", station: "career" },
      { id: "about", station: "about" },
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY;

      const firstProjId = projects[0]?.anchorId || "works";
      const worksEl = document.getElementById(firstProjId);
      if (worksEl) {
        const rect = worksEl.getBoundingClientRect();
        if (rect.top > 160) {
          setActiveStation("index");
          return;
        }
      } else if (scrollY < 260) {
        setActiveStation("index");
        return;
      }

      // Find section currently reached at the 160px from viewport top anchor position
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const item = sectionIds[i];
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveStation(item.station);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [projects]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] sm:px-6 py-12 sm:py-16">
      {/* 
        Full-width vintage stereo radio tuner TopBar (Reference: Solid State AM/FM Stereo Tuner Scale)
        Sticks flush to the top of the viewport with no outer border
      */}
      <TopBar
        projects={projects}
        activeStation={activeStation}
        onStationChange={(st) => setActiveStation(st)}
      />

      {/* 1:1 Complete Hero Section from Figma */}
      <Hero
        defaultNav="index"
        activeNav={
          activeStation === "career"
            ? "career"
            : activeStation === "about"
            ? "about"
            : activeStation === "index"
            ? "index"
            : "works"
        }
        onNavChange={(nav) => setActiveStation(nav)}
        theme={theme}
      />

      {/* 
        WORKS: Flagman Project Blocks loaded dynamically from Sanity CMS
        (Or falling back to seedProjects if offline/building)
      */}
      <div className="flex w-full flex-col items-center gap-[80px] sm:gap-[120px] mt-[80px] sm:mt-[100px]">
        {projects.map((proj, idx) => {
          // If anchorId is provided (e.g. "works", "project-2"), use it; otherwise assign based on index
          const anchorId = proj.anchorId || (idx === 0 ? "works" : `project-${idx + 1}`);

          return (
            <Project
              key={proj.id || anchorId}
              id={anchorId}
              title={proj.title}
              description={proj.description}
              images={proj.images && proj.images.length > 0 ? proj.images : ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
              keyAchievements={proj.keyAchievements}
              caseStudies={proj.caseStudies}
            />
          );
        })}
      </div>

      {/* Career & Education Section (FSD Career Widget formatted per reference screenshot & resume) */}
      <Experience id="career" className="mt-[100px] sm:mt-[140px]" />

      {/* About Section Anchor (Managed via Sanity Site Settings) */}
      <section
        id="about"
        className="mt-[80px] sm:mt-[100px] mb-[40px] min-h-[calc(100vh-100px)] flex w-full max-w-[564px] flex-col justify-start gap-[20px] pb-[120px] scroll-mt-[100px]"
      >
        <div className="flex flex-col gap-[16px]">
          {aboutParagraphs.map((para, idx) => (
            <p
              key={idx}
              className="font-hauora text-[18px] font-light leading-[26px] text-content-primary"
            >
              {para}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
