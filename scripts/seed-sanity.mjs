import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ayuyyagq";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error("Error: SANITY_API_TOKEN is required to write to Sanity.");
  console.error("Please add SANITY_API_TOKEN to .env.local or pass it as an environment variable.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const initialCases = [
  {
    _id: "case-ribbon-builder",
    _type: "caseStudy",
    title: "Zero-Code Ribbon Builder",
    slug: { _type: "slug", current: "ribbon-builder" },
    projectTag: "ORKESTRA / 2024",
    tagline:
      "Visual drag-and-drop ribbon constructor replacing manual C# and XML toolbar coding across Autodesk Revit ecosystems.",
    blocks: [
      {
        _key: "b-meta",
        _type: "metadataTable",
        rows: [
          { _key: "r1", label: "Client", value: "Orkestra (BIM Enterprise)" },
          { _key: "r2", label: "My Role", value: "Lead Product Designer: Visual Editor, Design System, UX Architecture" },
          { _key: "r3", label: "Delivered", value: "Zero-code ribbon builder, drag-and-drop canvas, live XML compiler, multi-tenant UI kit" },
          { _key: "r4", label: "Team", value: "1 Product Designer (me), 1 Tech Lead, 3 Full-stack Engineers, 1 BIM Consultant" },
          { _key: "r5", label: "Industry", value: "AEC / Architecture / BIM Software" },
          { _key: "r6", label: "Type", value: "B2B SaaS / Enterprise Workflow Tool" },
          { _key: "r7", label: "Status", value: "Shipped to enterprise architectural firms worldwide" },
        ],
      },
      {
        _key: "b-head-1",
        _type: "sectionHeading",
        badge: "OVERVIEW",
        title: "The Problem with Enterprise BIM Customization",
        description:
          "Architectural firms maintain hundreds of automation scripts. Deploying them into Revit required manual C# coding, XML manifest editing, and local workstation restarts. It was slow, fragile, and required senior developers for routine toolbar changes.",
      },
      {
        _key: "b-prob-1",
        _type: "problemList",
        badge: "CHALLENGES",
        title: "Key Friction Points Discovered",
        items: [
          {
            title: "Manual XML Syntax Errors",
            description: "A single misplaced tag crashed Revit ribbon startup on firm-wide deployments.",
            metric: "0 tolerance",
          },
          {
            title: "Days to Deploy a Button",
            description: "Adding one Dynamo script button took up to 3 days of coordination between BIM managers and IT.",
            metric: "3 days avg",
          },
          {
            title: "Zero Visual Feedback",
            description: "Designers couldn't see how icon sizes, flyout menus, or split-buttons would look before launching the heavy 15GB CAD suite.",
          },
        ],
      },
      {
        _key: "b-gallery-1",
        _type: "galleryBlock",
        height: 540,
        images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
        caption: "Orkestra Visual Ribbon Builder — tactile canvas with instantaneous CAD ribbon preview.",
      },
      {
        _key: "b-head-2",
        _type: "sectionHeading",
        badge: "DISCOVERY",
        title: "Research & Mental Model Alignment",
        description:
          "We shadowed 14 BIM managers across 6 international architectural studios to understand how they categorize commands by project stage.",
      },
      {
        _key: "b-disc-1",
        _type: "discoverySection",
        method: "Contextual inquiry, workflow mapping, and live Figma prototype testing with 14 BIM managers.",
        findings: [
          {
            title: "Spatial Grouping Over Alphabetical",
            description: "Users naturally group commands into 3-tier clusters: High Frequency (large icon), Contextual (stacked small), and Overflow (split-button dropdown).",
            stat: "92% preference",
          },
          {
            title: "Live Error Prevention",
            description: "Validating icon dimensions (16x16 vs 32x32) at drop-time eliminated 100% of runtime render bugs.",
            stat: "100% bug drop",
          },
        ],
      },
      {
        _key: "b-metrics-1",
        _type: "metricsBlock",
        badge: "IMPACT",
        title: "Measurable Business Outcomes",
        items: [
          { value: "15 min", label: "Toolbar Setup", description: "Down from 3 days of manual coding" },
          { value: "0", label: "Runtime Crashes", description: "Thanks to pre-flight schema validation" },
          { value: "70%", label: "Faster Rollouts", description: "Across 4,000+ enterprise CAD seats" },
        ],
      },
    ],
  },
  {
    _id: "case-payment-routing",
    _type: "caseStudy",
    title: "Emergency Payment Fallbacks & Routing Engine",
    slug: { _type: "slug", current: "payment-routing" },
    projectTag: "SCORPEX / 2024",
    tagline:
      "Zero-downtime multi-acquirer transaction routing engine with automated failovers and real-time ledger recovery.",
    blocks: [
      {
        _key: "b-meta",
        _type: "metadataTable",
        rows: [
          { _key: "r1", label: "Client", value: "Scorpex (FinTech Global Infrastructure)" },
          { _key: "r2", label: "My Role", value: "Lead Product Designer: Incident UX, Flow Logic, Observability" },
          { _key: "r3", label: "Delivered", value: "Visual rule matrix, emergency circuit-breaker UI, transaction cascade graph" },
          { _key: "r4", label: "Team", value: "1 Lead Designer (me), 1 VP of Product, 4 Distributed Systems Engineers" },
          { _key: "r5", label: "Industry", value: "FinTech / High-Frequency Payments" },
          { _key: "r6", label: "Type", value: "Enterprise Infrastructure Console" },
          { _key: "r7", label: "Status", value: "Live processing $120M+ monthly volume" },
        ],
      },
      {
        _key: "b-head-1",
        _type: "sectionHeading",
        badge: "THE CHALLENGE",
        title: "When Acquirers Drop at Peak Volume",
        description:
          "During major sales peaks (Black Friday, flash sales), payment gateways frequently degrade with 30s timeouts. Without real-time circuit breakers, thousands of transactions fail silently, destroying consumer trust and generating chargebacks.",
      },
      {
        _key: "b-metrics-1",
        _type: "metricsBlock",
        badge: "RESULTS",
        title: "Key Metrics",
        items: [
          { value: "99.98%", label: "Approval Rate", description: "Maintained during peak outages" },
          { value: "<400ms", label: "Failover Latency", description: "Zero drop in checkout UX" },
          { value: "$2.4M", label: "Rescued Revenue", description: "Per single gateway outage event" },
        ],
      },
    ],
  },
  {
    _id: "case-ai-workflow",
    _type: "caseStudy",
    title: "Multimodal AI Workspace & Intent Classifier",
    slug: { _type: "slug", current: "ai-workflow" },
    projectTag: "QUIDZI / 2024",
    tagline:
      "Interactive workspace orchestrating multi-agent LLM pipelines, prompt tracing, and contextual artifact trees.",
    blocks: [
      {
        _key: "b-meta",
        _type: "metadataTable",
        rows: [
          { _key: "r1", label: "Client", value: "Quidzi (AI Developer Tools)" },
          { _key: "r2", label: "My Role", value: "Principal Product Designer: Generative UI, Tracing Canvas, Interaction Model" },
          { _key: "r3", label: "Delivered", value: "Interactive agent debugger, step-by-step token inspect canvas, schema builder" },
          { _key: "r4", label: "Team", value: "1 Designer (me), 2 ML Engineers, 2 Frontend Specialists" },
          { _key: "r5", label: "Industry", value: "Artificial Intelligence / Developer Tools" },
          { _key: "r6", label: "Type", value: "Web App & Desktop Tool" },
          { _key: "r7", label: "Status", value: "Private Beta with 500+ AI engineers" },
        ],
      },
    ],
  },
  {
    _id: "case-dangdi",
    _type: "caseStudy",
    title: "Dangdi Social Commerce Experience",
    slug: { _type: "slug", current: "dangdi" },
    projectTag: "DANGDI / 2024",
    tagline:
      "Mobile-first social commerce application bridging livestream shopping, localized curation, and tactile 3D assets.",
    blocks: [
      {
        _key: "b-meta",
        _type: "metadataTable",
        rows: [
          { _key: "r1", label: "Client", value: "Dangdi (Zupersoft ApS, Denmark), pitch by Basa Solutions" },
          { _key: "r2", label: "My Role", value: "Product Designer: UX Review, UI Design, Visual Direction" },
          { _key: "r3", label: "Delivered", value: "Home screen, Chinese version, custom 3D assets, full process in Figma" },
          { _key: "r4", label: "Team", value: "Solo" },
          { _key: "r5", label: "Industry", value: "Social Commerce" },
          { _key: "r6", label: "Type", value: "Design Concept" },
          { _key: "r7", label: "Status", value: "Pitch, not selected" },
        ],
      },
    ],
  },
];

const initialProjects = [
  {
    _id: "project-orkestra",
    _type: "project",
    title: "Orkestra",
    anchorId: "works",
    order: 1,
    projectType: ["B2B"],
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
        _key: "cs1",
        label: "Zero-Code Ribbon Builder",
        caseStudy: { _type: "reference", _ref: "case-ribbon-builder" },
        active: true,
      },
      {
        _key: "cs2",
        label: "Enterprise Design System",
        active: false,
      },
    ],
  },
  {
    _id: "project-nda",
    _type: "project",
    title: "NDA",
    anchorId: "project-2",
    order: 2,
    projectType: ["B2C"],
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
        _key: "cs1",
        label: "Highlight Detection Engine",
        externalUrl: "https://leodmitriev.framer.website/work/vlog-editor",
        active: true,
      },
      {
        _key: "cs2",
        label: "Transcript-Based Editing",
        active: false,
      },
    ],
  },
  {
    _id: "project-trace-ai",
    _type: "project",
    title: "Trace AI Console",
    anchorId: "project-3",
    order: 3,
    projectType: ["B2B"],
    description:
      "Generative UI observability & prompt debugger\nwith real-time state tree inspection.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Visual token graph & agent decision tree",
      "Interactive step-by-step diff playback",
    ],
    caseStudies: [
      {
        _key: "cs1",
        label: "Agent Tracing Console",
        caseStudy: { _type: "reference", _ref: "case-ai-workflow" },
        active: true,
      },
      {
        _key: "cs2",
        label: "State Tree Engine",
        active: false,
      },
    ],
  },
  {
    _id: "project-scorpex",
    _type: "project",
    title: "Scorpex",
    anchorId: "project-4",
    order: 4,
    projectType: ["B2B"],
    description:
      "Zero-downtime multi-acquirer transaction routing engine with automated failovers and real-time ledger recovery.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Sub-400ms failover latency during peak acquirer outages",
      "99.98% authorization approval rate across $120M+ monthly volume",
    ],
    caseStudies: [
      {
        _key: "cs1",
        label: "Emergency Payment Fallbacks",
        caseStudy: { _type: "reference", _ref: "case-payment-routing" },
        active: true,
      },
      {
        _key: "cs2",
        label: "Circuit Breaker Console",
        active: false,
      },
    ],
  },
  {
    _id: "project-dangdi",
    _type: "project",
    title: "Dangdi",
    anchorId: "project-5",
    order: 5,
    projectType: ["B2C"],
    description:
      "Mobile-first social commerce application bridging livestream shopping, localized curation, and tactile 3D assets.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Custom 3D asset pipeline for tactile product cards",
      "End-to-end interactive purchase flow in Figma",
    ],
    caseStudies: [
      {
        _key: "cs1",
        label: "Social Commerce Experience",
        caseStudy: { _type: "reference", _ref: "case-dangdi" },
        active: true,
      },
      {
        _key: "cs2",
        label: "Livestream Interface",
        active: false,
      },
    ],
  },
  {
    _id: "project-aether",
    _type: "project",
    title: "Aether OS Interface",
    anchorId: "project-6",
    order: 6,
    projectType: ["B2B", "B2C"],
    description:
      "Spatial operating system design system\nwith responsive depth hierarchy and micro-acoustics.",
    images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
    keyAchievements: [
      "Unified light-source specular tokens",
      "Haptic audio feedback system integration",
    ],
    caseStudies: [
      {
        _key: "cs1",
        label: "Spatial Tokens",
        active: true,
      },
      {
        _key: "cs2",
        label: "System Sound",
        active: false,
      },
    ],
  },
];

const siteSettingsDoc = {
  _id: "siteSettings",
  _type: "siteSettings",
  title: "Portfolio Settings",
  heroName: "Leonid Dmitriev",
  heroBio:
    "Product Designer · Frontend-fluent\n4+ years at B2B(2C) across FinTech,\nProductivity, Entertainment & AI products",
  ledImages: [
    { _key: "led1", _type: "imagePath", url: "/portrait.png" },
    { _key: "led2", _type: "imagePath", url: "/portrait-2.png" },
  ],
  siteTitle: "Leonid Dmitriev — Product Designer",
  metaDescription:
    "Portfolio of Leonid Dmitriev: Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
  siteUrl: "https://leo-portfolio-orpin.vercel.app",
  keywords: [
    "Leonid Dmitriev",
    "Leo Dmitriev",
    "Product Designer",
    "Design Systems",
    "B2B SaaS",
    "UX Architecture",
    "FinTech",
    "Revit CAD",
  ],
  aboutParagraphs: [
    "I design data-dense B2B and B2C systems, FinTech tools, and products where every single detail matters, while keeping interfaces clean and friction-free. My workflow is built on a tight bridge between design and frontend: I don't just sketch in Figma, I build components in React, manage design tokens, and connect design directly to the codebase. I also love sharing this craft and mentoring designers along the way.",
    "AI agents are integrated into every stage of my pipeline—from brainstorming and rapid component prototyping to automation and writing custom skills. At the same time, I never blindly trust automation; every single artifact, line of code, and design decision goes through my strict manual review and refinement.",
    "Outside of design, I recharge on the badminton court, hitting mountain trails with friends, and spending time with my wife and our dog. I'm genuinely driven by building cool, lively products and connecting with passionate people.",
  ],
};

async function seed() {
  console.log(`[Sanity Seed] Connecting to project: ${projectId}, dataset: ${dataset}...`);

  // 1. Seed Case Studies
  for (const doc of initialCases) {
    try {
      const res = await client.createOrReplace(doc);
      console.log(`✓ Case Study: ${res.title} (slug: ${res.slug?.current})`);
    } catch (err) {
      console.error(`✗ Error creating case ${doc.title}:`, err.message);
    }
  }

  // 2. Seed Main Page Projects (with references to Case Studies)
  for (const doc of initialProjects) {
    try {
      const res = await client.createOrReplace(doc);
      console.log(`✓ Main Page Project: ${res.title} (anchor: #${res.anchorId})`);
    } catch (err) {
      console.error(`✗ Error creating project ${doc.title}:`, err.message);
    }
  }

  // 3. Seed Site Settings / About text
  try {
    const res = await client.createOrReplace(siteSettingsDoc);
    console.log(`✓ Site Settings & About created successfully`);
  } catch (err) {
    console.error(`✗ Error creating siteSettings:`, err.message);
  }

  console.log("[Sanity Seed] Entire portfolio content synced with Sanity Cloud!");
}

seed();
