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

async function seed() {
  console.log(`[Sanity Seed] Connecting to project: ${projectId}, dataset: ${dataset}...`);
  for (const doc of initialCases) {
    try {
      const res = await client.createOrReplace(doc);
      console.log(`✓ Created/Updated case: ${res.title} (slug: ${res.slug?.current})`);
    } catch (err) {
      console.error(`✗ Error creating ${doc.title}:`, err.message);
    }
  }
  console.log("[Sanity Seed] All cases seeded successfully!");
}

seed();
