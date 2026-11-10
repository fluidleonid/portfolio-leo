import type { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { HomePageClient, type SiteSettingsData } from "./HomePageClient";
import type { ProjectData } from "@/entities/project";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await client.fetch(`*[_type == "siteSettings"][0]{
      siteTitle,
      metaDescription,
      "faviconUrl": favicon.asset->url,
      "ogImageUrl": ogImage.asset->url
    }`);

    if (settings) {
      return {
        title: settings.siteTitle || "Leonid Dmitriev — Product Designer",
        description: settings.metaDescription,
        icons: settings.faviconUrl
          ? { icon: settings.faviconUrl, apple: settings.faviconUrl }
          : undefined,
        openGraph: {
          title: settings.siteTitle,
          description: settings.metaDescription,
          images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
        },
      };
    }
  } catch (err) {
    console.warn("[Metadata] Error fetching siteSettings from Sanity:", err);
  }

  return {
    title: "Leonid Dmitriev — Product Designer",
  };
}

export default async function Home() {
  let projects: ProjectData[] = [];
  let siteSettings: SiteSettingsData | null = null;

  try {
    const [sanityProjects, sanitySettings] = await Promise.all([
      client.fetch(`*[_type == "project"] | order(order asc) {
        _id,
        title,
        anchorId,
        order,
        projectType,
        description,
        "images": images[]{
          "url": coalesce(asset->url, url, @),
          "alt": coalesce(alt, asset->altText, asset->originalFilename, "")
        },
        keyAchievements,
        "caseStudies": *[_type == "caseStudy" && (project._ref == ^._id || references(^._id))] | order(order asc, _createdAt asc) {
          _id,
          title,
          order,
          "caseSlug": slug.current,
          buttonLabel,
          isButtonActive,
          externalUrl
        },
        "legacyCaseStudy": caseStudy->{
          _id,
          title,
          "caseSlug": slug.current,
          buttonLabel,
          isButtonActive,
          externalUrl
        },
        isCaseActive,
        customCaseLabel,
        customCaseUrl,
        secondCaseTitle,
        secondCaseActive,
        "legacySecondCaseStudy": secondCaseStudy->{
          _id,
          title,
          "caseSlug": slug.current
        }
      }`),
      client.fetch(`*[_type == "siteSettings"][0]{
        heroName,
        heroBio,
        siteTitle,
        metaDescription,
        "faviconUrl": favicon.asset->url,
        "ogImageUrl": ogImage.asset->url,
        aboutParagraphs,
        "ledImages": ledImages[]{
          "url": coalesce(asset->url, url, @)
        }.url
      }`),
    ]);

    if (Array.isArray(sanityProjects)) {
      projects = sanityProjects.map((p: any) => ({
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
        images:
          p.images && p.images.length > 0
            ? p.images
                .map((img: any) => {
                  if (typeof img === "string") return { url: img, alt: "" };
                  if (img && typeof img === "object") {
                    return {
                      url: img.url || "",
                      alt: img.alt || "",
                    };
                  }
                  return null;
                })
                .filter((item: any) => item && Boolean(item.url))
            : [
                { url: "/quickaccess.png", alt: "Quick Access Preview" },
                { url: "/quickaccess.png", alt: "Quick Access Preview" },
                { url: "/quickaccess.png", alt: "Quick Access Preview" },
              ],
        keyAchievements: p.keyAchievements || [],
        caseStudies: (() => {
          const list = (p.caseStudies || []).map((cs: any) => {
            const label = cs.buttonLabel?.trim() || cs.title || "Case Study";
            const href =
              cs.externalUrl || (cs.caseSlug ? `/case/${cs.caseSlug}` : undefined);
            const active = cs.isButtonActive !== false;
            return {
              id: cs._id,
              label,
              href: active ? href : undefined,
              active,
            };
          });

          // If no direct caseStudies matched, fallback to legacy primary case study binding
          if (list.length === 0 && p.legacyCaseStudy) {
            const label =
              p.customCaseLabel?.trim() ||
              p.legacyCaseStudy.buttonLabel?.trim() ||
              p.legacyCaseStudy.title ||
              "Case Study";
            const href =
              p.customCaseUrl ||
              (p.legacyCaseStudy.caseSlug
                ? `/case/${p.legacyCaseStudy.caseSlug}`
                : undefined);
            const active = p.isCaseActive !== false;
            list.push({
              id: p.legacyCaseStudy._id,
              label,
              href: active ? href : undefined,
              active,
            });
          }

          // If project has secondCaseTitle defined, include it as second slot
          if (p.secondCaseTitle) {
            const active = p.secondCaseActive === true;
            const href = p.legacySecondCaseStudy?.caseSlug
              ? `/case/${p.legacySecondCaseStudy.caseSlug}`
              : undefined;
            list.push({
              id: `${p._id}-second-case`,
              label: p.secondCaseTitle,
              href: active ? href : undefined,
              active,
            });
          }

          return list;
        })(),
      }));
    }

    if (sanitySettings) {
      siteSettings = sanitySettings;
    }
  } catch (err) {
    console.error("[Sanity Server Fetch Error]:", err);
  }

  return (
    <HomePageClient
      initialProjects={projects}
      siteSettings={siteSettings}
    />
  );
}
