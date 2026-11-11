import type { MetadataRow } from "@/shared/ui";

export type CaseBlockType =
  | "metadataTable"
  | "sectionHeading"
  | "problemList"
  | "teamSection"
  | "discoverySection"
  | "hypothesesSection"
  | "galleryBlock"
  | "metricsBlock"
  | "textBlock"
  | "quoteCallout";

export interface MetadataTableBlock {
  _type: "metadataTable";
  _key?: string;
  title?: string;
  rows: MetadataRow[];
}

export interface SectionHeadingBlock {
  _type: "sectionHeading";
  _key?: string;
  badge?: string;
  title: string;
  description?: string;
}

export interface ProblemItem {
  title: string;
  description: string;
  metric?: string;
}

export interface ProblemListBlock {
  _type: "problemList";
  _key?: string;
  badge?: string;
  title?: string;
  items: ProblemItem[];
}

export interface TeamMember {
  role: string;
  name?: string;
  details?: string;
}

export interface TeamSectionBlock {
  _type: "teamSection";
  _key?: string;
  badge?: string;
  title?: string;
  composition: TeamMember[];
}

export interface DiscoveryFinding {
  title: string;
  description: string;
  stat?: string;
}

export interface DiscoverySectionBlock {
  _type: "discoverySection";
  _key?: string;
  badge?: string;
  title?: string;
  method?: string;
  findings: DiscoveryFinding[];
}

export interface HypothesisItem {
  title: string;
  description: string;
  expectedOutcome?: string;
}

export interface HypothesesSectionBlock {
  _type: "hypothesesSection";
  _key?: string;
  badge?: string;
  title?: string;
  items: HypothesisItem[];
}

export interface GalleryBlock {
  _type: "galleryBlock";
  _key?: string;
  title?: string;
  images: (string | { url: string; alt?: string })[];
  height?: number;
  caption?: string;
}

export interface MetricItem {
  value: string;
  label: string;
  description?: string;
}

export interface MetricsBlock {
  _type: "metricsBlock";
  _key?: string;
  badge?: string;
  title?: string;
  items: MetricItem[];
}

export interface TextBlock {
  _type: "textBlock";
  _key?: string;
  title?: string;
  content: string;
}

export interface QuoteCalloutBlock {
  _type: "quoteCallout";
  _key?: string;
  title?: string;
  quote: string;
  author?: string;
  role?: string;
}

export type CaseContentBlock =
  | MetadataTableBlock
  | SectionHeadingBlock
  | ProblemListBlock
  | TeamSectionBlock
  | DiscoverySectionBlock
  | HypothesesSectionBlock
  | GalleryBlock
  | MetricsBlock
  | TextBlock
  | QuoteCalloutBlock;

export interface CaseSection {
  _key?: string;
  anchor: string;
  title?: string;
  blocks: CaseContentBlock[];
}

export interface CaseStudyData {
  _id?: string;
  title: string;
  slug: string;
  order?: number;
  projectTag?: string;
  projectAnchor?: string;
  tagline?: string;
  coverImage?: string;
  sections?: CaseSection[];
  blocks?: CaseContentBlock[];
}
