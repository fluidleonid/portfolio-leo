"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/widgets/hero";
import { Project } from "@/widgets/project";
import { TopBar } from "@/widgets/top-bar";
import { Experience } from "@/widgets/experience";
import { client } from "@/sanity/lib/client";
import { seedProjects, type ProjectData } from "@/entities/project";

interface SiteSettingsData {
  heroName?: string;
  heroBio?: string;
  siteTitle?: string;
  metaDescription?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  aboutParagraphs?: string[];
}

export default function Home() {
  const [activeStation, setActiveStation] = useState<string>("index");
  const [theme, setTheme] = useState<"monochrome" | "amber">("amber");
  const [projects, setProjects] = useState<ProjectData[]>(seedProjects);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData | null>(null);

  // 1. Fetch live projects and site settings from Sanity Cloud
  useEffect(() => {
    let isMounted = true;

    async function loadSanityContent() {
      try {
        const [sanityProjects, sanitySettings] = await Promise.all([
          client.fetch(`*[_type == "project"] | order(order asc) {
            _id,
            title,
            anchorId,
            order,
            projectType,
            description,
            roleDescription,
            "images": images[]{
              "url": coalesce(asset->url, url, @)
            }.url,
            keyAchievements,
            caseStudies[]{
              _key,
              label,
              active,
              externalUrl,
              "caseSlug": caseStudy->slug.current
            }
          }`),
          client.fetch(`*[_type == "siteSettings"][0]{
            heroName,
            heroBio,
            siteTitle,
            metaDescription,
            "faviconUrl": favicon.asset->url,
            "ogImageUrl": ogImage.asset->url,
            aboutParagraphs
          }`),
        ]);

        if (isMounted) {
          if (sanityProjects && Array.isArray(sanityProjects) && sanityProjects.length > 0) {
            setProjects(
              sanityProjects.map((p: any) => ({
                id: p.anchorId || p._id,
                anchorId: p.anchorId,
                order: p.order,
                title: p.title,
                projectType: Array.isArray(p.projectType)
                  ? p.projectType
                  : p.projectType
                  ? [p.projectType]
                  : ["B2B"],
                description: p.description,
                roleDescription: p.roleDescription,
                images:
                  p.images && p.images.length > 0
                    ? p.images.filter(Boolean)
                    : ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
                keyAchievements: p.keyAchievements || [],
                caseStudies: (p.caseStudies || []).map((cs: any) => ({
                  label: cs.label,
                  active: cs.active !== false,
                  href: cs.caseSlug ? `/case/${cs.caseSlug}` : cs.externalUrl,
                })),
              }))
            );
          }

          if (sanitySettings) {
            setSiteSettings(sanitySettings);

            // Update document title and favicon dynamically from Sanity
            if (sanitySettings.siteTitle) {
              document.title = sanitySettings.siteTitle;
            }
            if (sanitySettings.faviconUrl) {
              let link: HTMLLinkElement | null =
                document.querySelector("link[rel*='icon']");
              if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
              }
              link.href = sanitySettings.faviconUrl;
            }
          }
        }
      } catch (err) {
        console.warn("[Sanity] Client sync fallback:", err);
      }
    }

    loadSanityContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronize active station based on viewport scroll position
  useEffect(() => {
    const sectionIds = [
      { id: "top", station: "index" },
      { id: "works", station: "works" },
      { id: "project-2", station: "project-2" },
      { id: "project-3", station: "project-3" },
      { id: "project-4", station: "project-4" },
      { id: "project-5", station: "project-5" },
      { id: "project-6", station: "project-6" },
      { id: "career", station: "career" },
      { id: "about", station: "about" },
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY;

      const worksEl = document.getElementById("works");
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
  }, []);

  const defaultAboutParagraphs = [
    "I design data-dense B2B and B2C systems, FinTech tools, and products where every single detail matters, while keeping interfaces clean and friction-free. My workflow is built on a tight bridge between design and frontend: I don't just sketch in Figma, I build components in React, manage design tokens, and connect design directly to the codebase. I also love sharing this craft and mentoring designers along the way.",
    "AI agents are integrated into every stage of my pipeline—from brainstorming and rapid component prototyping to automation and writing custom skills. At the same time, I never blindly trust automation; every single artifact, line of code, and design decision goes through my strict manual review and refinement.",
    "Outside of design, I recharge on the badminton court, hitting mountain trails with friends, and spending time with my wife and our dog. I'm genuinely driven by building cool, lively products and connecting with passionate people.",
  ];

  const aboutParagraphs =
    siteSettings?.aboutParagraphs && siteSettings.aboutParagraphs.length > 0
      ? siteSettings.aboutParagraphs
      : defaultAboutParagraphs;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] sm:px-6 py-12 sm:py-16">
      {/* 
        Full-width vintage stereo radio tuner TopBar (Reference: Solid State AM/FM Stereo Tuner Scale)
        Sticks flush to the top of the viewport with no outer border
      */}
      <TopBar
        activeStation={activeStation}
        onStationChange={(st) => setActiveStation(st)}
      />

      {/* 1:1 Complete Hero Section from Figma */}
      <Hero
        name={siteSettings?.heroName}
        bio={siteSettings?.heroBio}
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
        WORKS: 6 Flagman Project Blocks loaded dynamically from Sanity CMS
      */}
      <div className="flex w-full flex-col items-center gap-[80px] sm:gap-[120px] mt-[80px] sm:mt-[100px]">
        {projects.map((proj, idx) => {
          const anchorId = proj.anchorId || (idx === 0 ? "works" : `project-${idx + 1}`);

          return (
            <Project
              key={proj.id || anchorId}
              id={anchorId}
              title={proj.title}
              projectType={proj.projectType}
              description={proj.description}
              roleDescription={proj.roleDescription}
              images={proj.images && proj.images.length > 0 ? proj.images : ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
              keyAchievements={proj.keyAchievements}
              caseStudies={proj.caseStudies}
            />
          );
        })}
      </div>

      {/* Career & Education Section (FSD Career Widget formatted per reference screenshot & resume) */}
      <Experience id="career" className="mt-[100px] sm:mt-[140px]" />

      {/* About Section Anchor */}
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
    </main>
  );
}
