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

      if (scrollY < 200) {
        setActiveStation("index");
        return;
      }

      // Find section currently reached at the 100px from viewport top anchor position
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const item = sectionIds[i];
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
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
          title="QuickAccess Ribbon Builder"
          description={"B2B SaaS visual ribbon editor & workspace configurator\nfor CAD & architectural suites."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "Configurable 3-level ribbon layout engine",
            "Reduced workspace customization time by 48%",
          ]}
          caseStudies={[
            { label: "Case 1 · Ribbon Architecture" },
            { label: "Case 2 · Usability Study" },
          ]}
        />

        {/* Project 2 */}
        <Project
          id="project-2"
          title="Scorpex Liquidity Router"
          description={"Algorithmic cross-venue order routing interface\nfor institutional digital asset trading desks."}
          images={["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"]}
          keyAchievements={[
            "Sub-millisecond visual orderbook stream",
            "Zero layout shifts during high-volatility spikes",
          ]}
          caseStudies={[
            { label: "Case 1 · Order Routing" },
            { label: "Case 2 · Latency Benchmark" },
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
            { label: "Case 1 · Agent Tracing" },
            { label: "Case 2 · State Tree Engine" },
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
            { label: "Case 1 · Spatial Canvas" },
            { label: "Case 2 · Vector Renderer" },
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
            { label: "Case 1 · Audio Synthesizer" },
            { label: "Case 2 · Physical Modeling" },
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
            { label: "Case 1 · Spatial Tokens" },
            { label: "Case 2 · System Sound" },
          ]}
        />
      </div>

      {/* Career & Education Section (FSD Career Widget formatted per reference screenshot & resume) */}
      <Experience id="career" className="mt-[100px] sm:mt-[140px] pt-[40px] border-t border-border-subtle" />

      {/* About Section Anchor */}
      <section
        id="about"
        className="mt-[80px] sm:mt-[100px] mb-[40px] min-h-[calc(100vh-100px)] flex w-full max-w-[564px] flex-col justify-start gap-[20px] border-t border-border-subtle pt-[40px] pb-[120px] scroll-mt-[100px]"
      >
        <span className="font-stetica text-[12px] uppercase tracking-widest text-content-badge">
          BIO // ABOUT
        </span>
        <h3 className="font-hauora text-[18px] font-medium text-content-primary">
          Leo Dmitriev
        </h3>
        <p className="font-hauora text-[18px] leading-[24px] text-content-primary/80">
          Product Designer with 5+ years of experience taking complex, data-heavy products from
          discovery to production across B2B SaaS, consumer apps, and AI-driven platforms.
          I specialize in turning complex AI logic into intuitive, trust-building B2C experiences and
          configurable B2B dashboards, partnering closely with engineering thanks to a hands-on
          frontend background (React/Next.js).
        </p>
      </section>
    </main>
  );
}
