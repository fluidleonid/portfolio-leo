"use client";

import { useState, useEffect, useRef } from "react";
import { Hero } from "@/widgets/hero";
import { Project } from "@/widgets/project";
import { TopBar } from "@/widgets/top-bar";
import { Experience } from "@/widgets/experience";
import type { ProjectData } from "@/entities/project";

export interface SiteSettingsData {
  heroName?: string;
  heroBio?: string;
  ledImages?: string[];
  siteTitle?: string;
  metaDescription?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  aboutParagraphs?: string[];
}

export interface HomePageClientProps {
  initialProjects: ProjectData[];
  siteSettings: SiteSettingsData | null;
}

export function HomePageClient({
  initialProjects,
  siteSettings,
}: HomePageClientProps) {
  const [activeStation, setActiveStation] = useState<string>("index");
  const [theme, setTheme] = useState<"monochrome" | "amber">("amber");
  const [projects] = useState<ProjectData[]>(initialProjects);
  const isInitialScrollDone = useRef(false);

  // Helper to safely synchronize hash in browser address bar without jarring navigation
  const syncAddressBarHash = (station: string) => {
    if (typeof window === "undefined") return;
    const targetHash = station === "index" ? "" : `#${station}`;
    const currentHash = window.location.hash;
    if (currentHash !== targetHash) {
      const newUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // 1. Initial hash scroll support (e.g. landing on #works or #about directly)
  useEffect(() => {
    if (isInitialScrollDone.current || typeof window === "undefined") return;
    const initialHash = window.location.hash.replace("#", "");
    if (initialHash) {
      const el = document.getElementById(initialHash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setActiveStation(initialHash);
        isInitialScrollDone.current = true;
      }
    }
  }, [projects]);

  // 2. Synchronize active station and address bar URL hash based on viewport scroll position
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
          syncAddressBarHash("index");
          return;
        }
      } else if (scrollY < 260) {
        setActiveStation("index");
        syncAddressBarHash("index");
        return;
      }

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const item = sectionIds[i];
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveStation(item.station);
            syncAddressBarHash(item.station);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [projects]);

  const aboutParagraphs = siteSettings?.aboutParagraphs || [];

  const handleStationClick = (st: string) => {
    setActiveStation(st);
    syncAddressBarHash(st);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] sm:px-6 py-12 sm:py-16">
      {/* 
        Full-width vintage stereo radio tuner TopBar (Reference: Solid State AM/FM Stereo Tuner Scale)
        Sticks flush to the top of the viewport with no outer border
      */}
      <TopBar
        projects={projects}
        activeStation={activeStation}
        onStationChange={handleStationClick}
      />

      {/* 1:1 Complete Hero Section from Figma (Values 100% sourced from Sanity) */}
      <Hero
        name={siteSettings?.heroName}
        bio={siteSettings?.heroBio}
        ledImages={siteSettings?.ledImages?.filter(Boolean)}
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
        onNavChange={handleStationClick}
        theme={theme}
      />

      {/* 
        WORKS: Flagman Project Blocks loaded dynamically and purely from Sanity CMS
      */}
      <div className="flex w-full flex-col items-center gap-[80px] sm:gap-[120px] mt-[80px] sm:mt-[100px]">
        {projects.map((proj, idx) => {
          const anchorId =
            proj.anchorId || (idx === 0 ? "works" : `project-${idx + 1}`);

          return (
            <Project
              key={proj.id || anchorId}
              id={anchorId}
              title={proj.title}
              projectType={proj.projectType}
              description={proj.description}
              images={
                proj.images && proj.images.length > 0
                  ? proj.images
                  : ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]
              }
              keyAchievements={proj.keyAchievements}
              caseStudies={proj.caseStudies}
            />
          );
        })}
      </div>

      {/* Career & Education Section (FSD Career Widget formatted per reference screenshot & resume) */}
      <Experience id="career" className="mt-[100px] sm:mt-[140px]" />

      {/* About Section Anchor (Exclusively rendered from Sanity) */}
      {aboutParagraphs.length > 0 && (
        <section
          id="about"
          className="mt-[80px] sm:mt-[100px] mb-[40px] min-h-[calc(100vh-100px)] flex w-full max-w-[564px] flex-col justify-start gap-[20px] pb-[120px] scroll-mt-[100px]"
        >
          <div className="flex flex-col gap-[16px]">
            {aboutParagraphs.map((para, idx) => (
              <p
                key={idx}
                className="font-hauora text-[18px] font-light leading-[24px] text-content-primary whitespace-pre-line"
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
