import type { CaseStudyData, CaseSection } from "./types";

/**
 * Normalizes case study content into a structured list of CaseSections.
 *
 * 1. If explicit `sections` are defined in Sanity, returns them directly.
 * 2. If only legacy flat `blocks` exist, automatically groups them into clean sections
 *    so existing content renders perfectly without data loss.
 */
export function normalizeCaseSections(caseData: CaseStudyData): CaseSection[] {
  // 1. Primary: Use explicit sections defined by user
  if (Array.isArray(caseData.sections) && caseData.sections.length > 0) {
    return caseData.sections.map((sec, idx) => ({
      ...sec,
      anchor: (sec.anchor || `section-${idx + 1}`).toLowerCase().trim(),
      blocks: Array.isArray(sec.blocks) ? sec.blocks : [],
    }));
  }

  // 2. Backward compatibility fallback: group legacy flat blocks into sections
  const legacyBlocks = caseData.blocks || [];
  if (legacyBlocks.length === 0) {
    return [
      {
        anchor: "overview",
        title: undefined,
        blocks: [],
      },
    ];
  }

  const sections: CaseSection[] = [];
  let currentSection: CaseSection = {
    anchor: "overview",
    title: undefined,
    blocks: [],
  };

  const isOverviewBadge = (badge?: string) => {
    if (!badge) return false;
    const lower = badge.toLowerCase();
    return (
      lower.includes("overview") ||
      lower.includes("challenge") ||
      lower.includes("problem") ||
      lower.includes("context") ||
      lower.includes("intro")
    );
  };

  let passedOverview = false;

  legacyBlocks.forEach((block) => {
    let rawBadge = "";
    if ("badge" in block && typeof block.badge === "string" && block.badge.trim()) {
      rawBadge = block.badge.trim();
    }

    if (!passedOverview) {
      if (
        block._type === "metadataTable" ||
        block._type === "metricsBlock" ||
        block._type === "problemList" ||
        (rawBadge && isOverviewBadge(rawBadge))
      ) {
        currentSection.blocks.push(block);
        return;
      }

      // New distinct chapter begins
      passedOverview = true;
      if (currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }

      let anchor = rawBadge ? rawBadge.toLowerCase() : "";
      if (!anchor) {
        if (block._type === "discoverySection") anchor = "discovery";
        else if (block._type === "hypothesesSection") anchor = "hypotheses";
        else if (block._type === "teamSection") anchor = "team";
        else anchor = "details";
      }

      currentSection = {
        anchor,
        title: "title" in block && typeof block.title === "string" ? block.title : undefined,
        blocks: [block],
      };
      return;
    }

    // Subsequent section headings create new section anchors
    if (block._type === "sectionHeading" && rawBadge && rawBadge.toLowerCase() !== currentSection.anchor) {
      if (currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        anchor: rawBadge.toLowerCase(),
        title: "title" in block && typeof block.title === "string" ? block.title : undefined,
        blocks: [block],
      };
      return;
    }

    currentSection.blocks.push(block);
  });

  if (currentSection.blocks.length > 0) {
    sections.push(currentSection);
  }

  // Guarantee the first section is always 'overview'
  if (sections.length > 0 && !sections.some((s) => s.anchor === "overview")) {
    sections[0].anchor = "overview";
  }

  return sections;
}
