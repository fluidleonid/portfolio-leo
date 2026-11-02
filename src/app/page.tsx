"use client";

import { useState, useEffect } from "react";
import { Hero, type NavItem } from "@/widgets/hero";
import { Project } from "@/widgets/project";
import { TopBar } from "@/widgets/top-bar";
import { Experience } from "@/widgets/experience";

export default function Home() {
  const [activeStation, setActiveStation] = useState<string>("index");
  // Default to amber theme; monochrome mode logic preserved
  const [theme, setTheme] = useState<"monochrome" | "amber">("amber");

  // Synchronize active station based on viewport scroll position
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

      // When works has not reached the top yet, or scroll is near top, active station is "index"
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
  }, []);

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
        WORKS: 6 Flagman Project Blocks
        (1 initial project + 5 additional projects matching the 6 project scale blocks in the tuner)
      */}
      <div className="flex w-full flex-col items-center gap-[80px] sm:gap-[120px] mt-[80px] sm:mt-[100px]">
        {/* Project 1 (Works Flagship) */}
        <Project
          id="works"
          title="Orkestra"
          description={"Modular B2B SaaS platform for enterprise architectural firms and BIM teams to orchestrate and deploy CAD ribbons and custom computational scripts.\nAs Product Designer, I designed the visual no-code Ribbon Builder, structured data-dense analytics dashboards, and built the design system from scratch."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "Cut CAD toolbar setup from days of manual coding to 15 minutes",
            "Eliminated configuration errors to zero via visual layout validation",
            "Real-time script versioning and execution observability",
          ]}
          caseStudies={[
            { label: "Zero-Code Ribbon Builder" },
            { label: "Enterprise Design System", active: false },
          ]}
        />

        {/* Project 2 (NDA: AI Vlog Editor) */}
        <Project
          id="project-2"
          title="NDA"
          description={"Mobile-first AI video editor turning raw match footage\ninto ready-to-publish vertical vlogs with auto-highlights."}
          images={[
            "/aivlog/Projects.png",
            "/aivlog/Projects-1.png",
            "/aivlog/Projects-2.png",
            "/aivlog/Projects-3.png",
            "/aivlog/Projects-4.png",
            "/aivlog/Projects-5.png",
          ]}
          keyAchievements={[
            "Auto-cut highlight detection from raw footage by audio peaks",
            "Bi-directional transcript editing trimming pauses directly from text",
          ]}
          caseStudies={[
            {
              label: "Highlight Detection Engine",
              href: "https://leodmitriev.framer.website/work/vlog-editor",
            },
            {
              label: "Transcript-Based Editing",
              active: false,
            },
          ]}
        />

        {/* Project 3 */}
        <Project
          id="project-3"
          title="Trace AI Console"
          description={"Generative UI observability & prompt debugger\nwith real-time state tree inspection."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "Visual token graph & agent decision tree",
            "Interactive step-by-step diff playback",
          ]}
          caseStudies={[
            { label: "Agent Tracing Console" },
            { label: "State Tree Engine", active: false },
          ]}
        />

        {/* Project 4 */}
        <Project
          id="project-4"
          title="Kite Canvas Engine"
          description={"Low-latency collaborative spatial whiteboard\nwith infinite zoom and tactile vector primitives."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "60 FPS hardware-accelerated canvas",
            "Instant undo/redo tree persistence",
          ]}
          caseStudies={[
            { label: "Spatial Canvas Engine" },
            { label: "Vector Renderer", active: false },
          ]}
        />

        {/* Project 5 */}
        <Project
          id="project-5"
          title="VibeSync Studio"
          description={"Tactile DSP audio synthesizer & modular patch matrix\nwith physical skeuomorphic controls."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "WebAudio virtual analog filter modeling",
            "Rotary knob angle interpolation at 120 Hz",
          ]}
          caseStudies={[
            { label: "Audio Synthesizer" },
            { label: "Physical Modeling", active: false },
          ]}
        />

        {/* Project 6 */}
        <Project
          id="project-6"
          title="Aether OS Interface"
          description={"Spatial operating system design system\nwith responsive depth hierarchy and micro-acoustics."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "Unified light-source specular tokens",
            "Haptic audio feedback system integration",
          ]}
          caseStudies={[
            { label: "Spatial Tokens" },
            { label: "System Sound", active: false },
          ]}
        />
      </div>

      {/* Career & Education Section (FSD Career Widget formatted per reference screenshot & resume) */}
      <Experience id="career" className="mt-[100px] sm:mt-[140px]" />

      {/* About Section Anchor */}
      <section
        id="about"
        className="mt-[80px] sm:mt-[100px] mb-[40px] min-h-[calc(100vh-100px)] flex w-full max-w-[564px] flex-col justify-start gap-[20px] pb-[120px] scroll-mt-[100px]"
      >
        <div className="flex flex-col gap-[16px]">
          <p className="font-hauora text-[18px] font-light leading-[24px] text-content-primary">
            I design data-dense B2B and B2C systems, FinTech tools, and products where every single detail matters, while keeping interfaces clean and friction-free. My workflow is built on a tight bridge between design and frontend: I don't just sketch in Figma, I build components in React, manage design tokens, and connect design directly to the codebase. I also love sharing this craft and mentoring designers along the way.
          </p>
          <p className="font-hauora text-[18px] font-light leading-[24px] text-content-primary">
            AI agents are integrated into every stage of my pipeline—from brainstorming and rapid component prototyping to automation and writing custom skills. At the same time, I never blindly trust automation; every single artifact, line of code, and design decision goes through my strict manual review and refinement.
          </p>
          <p className="font-hauora text-[18px] font-light leading-[24px] text-content-primary">
            Outside of design, I recharge on the badminton court, hitting mountain trails with friends, and spending time with my wife and our dog. I'm genuinely driven by building cool, lively products and connecting with passionate people.
          </p>
        </div>
      </section>
    </main>
  );
}
