import type { CaseStudyData } from "./types";

export const seedCases: Record<string, CaseStudyData> = {
  "ribbon-builder": {
    slug: "ribbon-builder",
    title: "Zero-Code Ribbon Builder",
    projectTag: "ORKESTRA",
    tagline: "Streamlining custom computational script distribution and CAD toolbar assembly for enterprise AEC firms.",
    blocks: [
      {
        _type: "metadataTable",
        rows: [
          { label: "Client", value: "Orkestra (Modular AEC Automation Platform)" },
          { label: "My Role", value: "Product Designer & Design Systems Lead: UX Architecture, UI Design, Design System" },
          { label: "Delivered", value: "Visual Drag-and-Drop Ribbon Builder, high-density analytics consoles, enterprise design system" },
          { label: "Team", value: "Lead Product Designer (Solo), 2 Senior Backend Engineers, 1 BIM Domain Consultant" },
          { label: "Industry", value: "Enterprise AEC Software / Computational BIM" },
          { label: "Type", value: "B2B Enterprise SaaS Platform" },
          { label: "Status", value: "Production Live" },
        ],
      },
      {
        _type: "sectionHeading",
        badge: "OVERVIEW",
        title: "From Days of Manual Script Coding to 15-Minute Visual Deployment",
        description:
          "Orkestra acts as a centralized hub for enterprise architectural firms to deploy computational scripts, plugins, and custom toolbars across hundreds of designer workstations.",
      },
      {
        _type: "galleryBlock",
        images: ["/quickaccess.png", "/quickaccess.png", "/quickaccess.png"],
        height: 600,
        caption: "Tactile Ribbon Builder canvas with live layout validation and dynamic tab orchestration.",
      },
      {
        _type: "problemList",
        badge: "PROBLEMS",
        title: "Key Bottlenecks in Legacy Workflows",
        items: [
          {
            title: "Manual XML & Path Configuration",
            description: "BIM managers spent days manually authoring XML configurations, managing local file dependencies, and troubleshooting crashes on individual engineer machines.",
            metric: "Days of manual setup",
          },
          {
            title: "Zero Centralized Version Visibility",
            description: "No real-time observability into which script versions were active in production, causing silent failures during critical architectural deliveries.",
            metric: "High error rates",
          },
          {
            title: "High Support Ticket Load",
            description: "Computational designers had to file dev tickets for simple button re-arrangements, creating bottlenecks across cross-functional teams.",
            metric: "Overloaded sprints",
          },
        ],
      },
      {
        _type: "discoverySection",
        badge: "DISCOVERY",
        title: "Deep-Dive Field Interviews with 14 BIM Directors",
        method: "Ops observation, Revit environment constraint audits & workflow mapping",
        findings: [
          {
            title: "Visual Drag & Drop is Mandatory",
            description: "Managers overwhelmingly requested a visual canvas that mirrors the CAD ribbon layout with 1:1 fidelity.",
            stat: "92%",
          },
          {
            title: "Instant Pre-flight Layout Validation",
            description: "Detecting missing dependencies and invalid script commands before deployment eliminated toolbar runtime crashes entirely.",
            stat: "0 Errors",
          },
        ],
      },
      {
        _type: "hypothesesSection",
        badge: "HYPOTHESES",
        title: "Designing the No-Code Assembly Engine",
        items: [
          {
            title: "Direct WYSIWYG Ribbon Manipulation",
            description: "If users compose toolbars via tactile drag-and-drop tiles rather than editing raw code, configuration time will plummet.",
            expectedOutcome: "Cut setup time by >60%",
          },
          {
            title: "Automated Package Versioning",
            description: "Binding scripts to an immutable version registry guarantees every workstation executes identical validated code.",
            expectedOutcome: "Zero runtime divergence",
          },
        ],
      },
      {
        _type: "metricsBlock",
        badge: "RESULTS",
        title: "Measured Impact on Enterprise Operations",
        items: [
          {
            value: "15 min",
            label: "Setup Time",
            description: "Cut corporate CAD toolbar configuration from days of manual coding down to 15 minutes via UI.",
          },
          {
            value: "0",
            label: "Config Errors",
            description: "Standardized visual layout validation drove toolbar runtime crashes down to absolute zero.",
          },
          {
            value: "100%",
            label: "Observability",
            description: "Real-time visibility into script execution success rates, version histories, and permissions.",
          },
        ],
      },
      {
        _type: "quoteCallout",
        quote: "The Ribbon Builder turned what used to be a week of frantic manual file syncs into a calm 15-minute drag-and-drop exercise for our entire global team.",
        author: "BIM Director",
        role: "Top 50 Global Architectural Firm",
      },
    ],
  },

  "payment-routing": {
    slug: "payment-routing",
    title: "High-Throughput Payment Routing Engine",
    projectTag: "SCORPEX",
    tagline: "Combining internal operations tooling with merchant dashboards for seamless transaction routing.",
    blocks: [
      {
        _type: "metadataTable",
        rows: [
          { label: "Client", value: "Scorpex FinTech Engine" },
          { label: "My Role", value: "Lead Product Designer: Core Experience, Routing Logic, Design Tokens" },
          { label: "Delivered", value: "Rule routing canvas, emergency fallback console, real-time analytics data tables" },
          { label: "Team", value: "1 Lead Product Designer, 3 Payment Systems Engineers, 1 Product Manager" },
          { label: "Industry", value: "FinTech & Payment Infrastructure" },
          { label: "Type", value: "Mission-Critical Enterprise Console" },
          { label: "Status", value: "Production Live" },
        ],
      },
      {
        _type: "sectionHeading",
        badge: "OVERVIEW",
        title: "Speeding Up Payment Routing Delivery Without Losing Flexibility",
        description: "Designing a fail-safe routing interface that lets operations teams establish fallback gateways in seconds during live network outages.",
      },
      {
        _type: "problemList",
        badge: "PROBLEMS",
        title: "Critical Inefficiencies in Gateway Routing",
        items: [
          {
            title: "High Transaction Drop-Offs",
            description: "Failed payments had no automatic failover to alternative gateways, causing immediate drops and lost revenue.",
            metric: "Direct revenue loss",
          },
          {
            title: "4+ Minute Emergency Response Time",
            description: "Rerouting traffic during bank outages required engineering hotfixes and manual deployment tickets.",
            metric: "4+ min lag",
          },
        ],
      },
      {
        _type: "metricsBlock",
        badge: "RESULTS",
        title: "Key Achievements & Velocity",
        items: [
          {
            value: "<30s",
            label: "Time-to-Task",
            description: "Reduced from 4+ minutes (legacy workflow and dev tickets) down to under 30 seconds for emergency fallbacks.",
          },
          {
            value: "+18%",
            label: "Authorization Rate",
            description: "Cascaded smart retries recaptured previously failed international credit transactions.",
          },
        ],
      },
    ],
  },

  "ai-workflow": {
    slug: "ai-workflow",
    title: "Contextual AI Workspace Integration",
    projectTag: "QUIDZI",
    tagline: "Turning multimodal AI assistance into an effortless, friction-free productivity canvas.",
    blocks: [
      {
        _type: "metadataTable",
        rows: [
          { label: "Client", value: "Quidzi (AI Workspace Engine)" },
          { label: "My Role", value: "Senior Product Designer: User Research, Interaction Flow, UI Design" },
          { label: "Delivered", value: "AI Drive Controller, prompt debugging console, contextual action triggers" },
          { label: "Team", value: "1 Product Designer, 2 Machine Learning Engineers, 1 Founder" },
          { label: "Industry", value: "Productivity / AI Collaboration" },
          { label: "Type", value: "Web Application" },
          { label: "Status", value: "Beta Release" },
        ],
      },
      {
        _type: "sectionHeading",
        badge: "OVERVIEW",
        title: "Eliminating Prompt Fatigue via Ambient Intent Classification",
        description: "Replacing static chatbot sidebars with direct in-canvas operational agents that understand user document context automatically.",
      },
      {
        _type: "metricsBlock",
        badge: "RESULTS",
        title: "Validated Metrics",
        items: [
          {
            value: "2.5x",
            label: "Workflow Speed",
            description: "Users accomplished multi-step analysis without manually switching between tools.",
          },
          {
            value: "76%",
            label: "Adoption Surge",
            description: "Massive lift in weekly active AI agent usage after removing model selection friction.",
          },
        ],
      },
    ],
  },

  "dangdi": {
    slug: "dangdi",
    title: "Social Commerce Interactive Experience",
    projectTag: "DANGDI",
    tagline: "Next-generation mobile social commerce concept bridging live video shopping with tactile interactive cards.",
    blocks: [
      {
        _type: "metadataTable",
        rows: [
          { label: "Client", value: "Dangdi (Zupersoft ApS, Denmark), pitch by Basa Solutions" },
          { label: "My Role", value: "Product Designer: UX Review, UI Design, Visual Direction" },
          { label: "Delivered", value: "Home screen, Chinese version, custom 3D assets, full process in Figma" },
          { label: "Team", value: "Solo" },
          { label: "Industry", value: "Social Commerce" },
          { label: "Type", value: "Design Concept" },
          { label: "Status", value: "Pitch, not selected" },
        ],
      },
      {
        _type: "sectionHeading",
        badge: "OVERVIEW",
        title: "Bridging Interactive Live Streams with Instant 1-Tap Purchase",
        description: "Crafting a unified visual design language tailored for cross-border Chinese social shopping with custom 3D assets and high-contrast typography.",
      },
      {
        _type: "problemList",
        badge: "PROBLEMS",
        title: "Identified Friction Points",
        items: [
          {
            title: "Disjointed Stream Browsing",
            description: "Users were forced to navigate out of live video streams to inspect product specs or checkout, disrupting the emotional impulse.",
          },
          {
            title: "Information Overload",
            description: "Standard Asian e-commerce interfaces cluttered the viewport with flashing badges, obscuring product imagery.",
          },
        ],
      },
      {
        _type: "hypothesesSection",
        badge: "HYPOTHESES",
        title: "Tactile Bottom Sheet & Spatial Overlay Architecture",
        items: [
          {
            title: "Persistent Live Video PIP",
            description: "Keeping the host audio/video stream anchored in a compact tactile frame while users explore variants prevents session drop-off.",
          },
          {
            title: "Localized Typography Scale",
            description: "Balancing Chinese typographic weight with clean skeuomorphic indicators elevates perceptual trust.",
          },
        ],
      },
    ],
  },
};
