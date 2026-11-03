import { Suspense } from "react";
import { client } from "@/sanity/lib/client";
import { seedProjects, type ProjectData } from "@/entities/project";
import { PortfolioView } from "@/widgets/portfolio-view";

async function getProjects(): Promise<ProjectData[]> {
  try {
    const query = `*[_type == "project"] | order(order asc) {
      _id,
      title,
      anchorId,
      order,
      description,
      roleDescription,
      "images": images[]{
        "url": coalesce(asset->url, @)
      }.url,
      keyAchievements,
      caseStudies[]{
        _key,
        label,
        active,
        externalUrl,
        "caseSlug": caseStudy->slug.current
      }
    }`;
    const sanityProjects = await client.fetch(query);
    if (sanityProjects && Array.isArray(sanityProjects) && sanityProjects.length > 0) {
      return sanityProjects.map((p: any) => ({
        id: p.anchorId || p._id,
        anchorId: p.anchorId,
        order: p.order,
        title: p.title,
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
      }));
    }
  } catch (err) {
    console.warn("[Sanity] Projects fetch fallback:", err);
  }
  return seedProjects;
}

async function getSiteSettings(): Promise<{ aboutParagraphs?: string[] } | null> {
  try {
    return await client.fetch(`*[_type == "siteSettings"][0]{ aboutParagraphs }`);
  } catch {
    return null;
  }
}

async function PortfolioContent() {
  const [projects, siteSettings] = await Promise.all([
    getProjects(),
    getSiteSettings(),
  ]);

  return (
    <PortfolioView
      projects={projects}
      aboutParagraphs={siteSettings?.aboutParagraphs}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PortfolioView projects={seedProjects} />}>
      <PortfolioContent />
    </Suspense>
  );
}
