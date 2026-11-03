import type { ProjectData } from "./types";

export const seedProjects: ProjectData[] = [
  {
    id: "project-orkestra",
    anchorId: "works",
    order: 1,
    title: "Orkestra",
    description:
      "Modular B2B SaaS platform for enterprise architectural firms and BIM teams to orchestrate and deploy CAD ribbons and custom computational scripts.\n\nAs Product Designer, I designed the visual no-code Ribbon Builder, structured data-dense analytics dashboards, and built the design system from scratch.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Cut CAD toolbar setup from days of manual coding to 15 minutes",
      "Eliminated configuration errors to zero via visual layout validation",
      "Real-time script versioning and execution observability",
    ],
    caseStudies: [
      {
        label: "Zero-Code Ribbon Builder",
        href: "/case/ribbon-builder",
        active: true,
      },
      {
        label: "Enterprise Design System",
        active: false,
      },
    ],
  },
  {
    id: "project-nda",
    anchorId: "project-2",
    order: 2,
    title: "NDA",
    description:
      "Mobile-first AI video editor turning raw match footage\ninto ready-to-publish vertical vlogs with auto-highlights.",
    images: [
      "/aivlog/Projects.png",
      "/aivlog/Projects-1.png",
      "/aivlog/Projects-2.png",
      "/aivlog/Projects-3.png",
      "/aivlog/Projects-4.png",
      "/aivlog/Projects-5.png",
    ],
    keyAchievements: [
      "Auto-cut highlight detection from raw footage by audio peaks",
      "Bi-directional transcript editing trimming pauses directly from text",
    ],
    caseStudies: [
      {
        label: "Highlight Detection Engine",
        href: "https://leodmitriev.framer.website/work/vlog-editor",
        active: true,
      },
      {
        label: "Transcript-Based Editing",
        active: false,
      },
    ],
  },
  {
    id: "project-trace-ai",
    anchorId: "project-3",
    order: 3,
    title: "Trace AI Console",
    description:
      "Generative UI observability & prompt debugger\nwith real-time state tree inspection.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Visual token graph & agent decision tree",
      "Interactive step-by-step diff playback",
    ],
    caseStudies: [
      {
        label: "Agent Tracing Console",
        href: "/case/ai-workflow",
        active: true,
      },
      {
        label: "State Tree Engine",
        active: false,
      },
    ],
  },
  {
    id: "project-scorpex",
    anchorId: "project-4",
    order: 4,
    title: "Scorpex",
    description:
      "Zero-downtime multi-acquirer transaction routing engine with automated failovers and real-time ledger recovery.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Sub-400ms failover latency during peak acquirer outages",
      "99.98% authorization approval rate across $120M+ monthly volume",
    ],
    caseStudies: [
      {
        label: "Emergency Payment Fallbacks",
        href: "/case/payment-routing",
        active: true,
      },
      {
        label: "Circuit Breaker Console",
        active: false,
      },
    ],
  },
  {
    id: "project-dangdi",
    anchorId: "project-5",
    order: 5,
    title: "Dangdi",
    description:
      "Mobile-first social commerce application bridging livestream shopping, localized curation, and tactile 3D assets.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Custom 3D asset pipeline for tactile product cards",
      "End-to-end interactive purchase flow in Figma",
    ],
    caseStudies: [
      {
        label: "Social Commerce Experience",
        href: "/case/dangdi",
        active: true,
      },
      {
        label: "Livestream Interface",
        active: false,
      },
    ],
  },
  {
    id: "project-aether",
    anchorId: "project-6",
    order: 6,
    title: "Aether OS Interface",
    description:
      "Spatial operating system design system\nwith responsive depth hierarchy and micro-acoustics.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Unified light-source specular tokens",
      "Haptic audio feedback system integration",
    ],
    caseStudies: [
      {
        label: "Spatial Tokens",
        active: true,
      },
      {
        label: "System Sound",
        active: false,
      },
    ],
  },
];
