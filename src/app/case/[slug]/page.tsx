import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { CaseStudyData, NextCaseStudyLink } from "@/entities/case-study";
import { CaseStudyView } from "@/widgets/case-study";
import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await client.fetch<string[]>(
      `*[_type == "caseStudy" && defined(slug.current)][].slug.current`
    );
    return (slugs || []).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [caseData, siteSettings] = await Promise.all([
      client.fetch<{
        title?: string;
        tagline?: string;
        coverImage?: string;
      }>(
        `*[_type == "caseStudy" && slug.current == $slug][0]{
          title,
          tagline,
          "coverImage": coverImage.asset->url
        }`,
        { slug }
      ),
      client.fetch<{
        siteTitle?: string;
        metaDescription?: string;
        faviconUrl?: string;
        ogImageUrl?: string;
      }>(
        `*[_type == "siteSettings"][0]{
          siteTitle,
          metaDescription,
          "faviconUrl": favicon.asset->url,
          "ogImageUrl": ogImage.asset->url
        }`
      ),
    ]);

    const title = caseData?.title || "Case Study";
    const pitch =
      caseData?.tagline ||
      siteSettings?.metaDescription ||
      "Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.";
    const ogImage =
      caseData?.coverImage || siteSettings?.ogImageUrl || "/quickaccess.png";
    const faviconUrl = siteSettings?.faviconUrl;

    return {
      title: {
        absolute: title,
      },
      description: pitch,
      icons: faviconUrl
        ? { icon: faviconUrl, apple: faviconUrl, shortcut: faviconUrl }
        : undefined,
      openGraph: {
        title,
        description: pitch,
        type: "article",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: pitch,
        images: [ogImage],
      },
    };
  } catch (err) {
    console.warn("[Sanity Case Metadata Error]:", err);
    return {
      title: {
        absolute: "Case Study",
      },
      openGraph: {
        title: "Case Study",
      },
      twitter: {
        title: "Case Study",
      },
    };
  }
}

async function getCaseStudy(slug: string): Promise<CaseStudyData | null> {
  try {
    const sanityCase = await client.fetch<CaseStudyData>(
      `*[_type == "caseStudy" && slug.current == $slug][0]{
        _id,
        title,
        "slug": slug.current,
        tagline,
        "coverImage": coverImage.asset->url,
        "projectAnchor": project->anchorId,
        sections[]{
          _key,
          anchor,
          title,
          blocks
        },
        blocks
      }`,
      { slug }
    );

    const resolveGalleryImages = (blocksList: any[]) => {
      if (!Array.isArray(blocksList)) return [];
      return blocksList.map((block: any) => {
        if (block._type === "galleryBlock" && Array.isArray(block.images)) {
          return {
            ...block,
            images: block.images
              .map((img: any) => {
                if (typeof img === "string") {
                  return { url: img, alt: "" };
                }
                const url = urlForImage(img);
                return {
                  url,
                  alt: img?.alt || "",
                };
              })
              .filter((item: any) => Boolean(item.url)),
          };
        }
        return block;
      });
    };

    if (sanityCase) {
      if (Array.isArray(sanityCase.sections)) {
        sanityCase.sections = sanityCase.sections.map((sec) => ({
          ...sec,
          blocks: resolveGalleryImages(sec.blocks),
        }));
      }
      if (Array.isArray(sanityCase.blocks)) {
        sanityCase.blocks = resolveGalleryImages(sanityCase.blocks);
      }
    }

    return sanityCase || null;
  } catch (err) {
    console.error("[Sanity Fetch Case Error]:", err);
    return null;
  }
}

async function getNextCaseStudy(currentSlug: string): Promise<NextCaseStudyLink | null> {
  try {
    const allCases = await client.fetch<
      Array<{
        _id: string;
        title?: string;
        slug?: string;
        buttonLabel?: string;
        buttonSublabel?: string;
        projectTitle?: string;
      }>
    >(
      `*[_type == "caseStudy" && defined(slug.current) && isButtonActive != false]
        | order(coalesce(project->order, 999) asc, coalesce(order, 999) asc, _createdAt asc) {
          _id,
          title,
          "slug": slug.current,
          buttonLabel,
          buttonSublabel,
          "projectTitle": project->title
        }`
    );

    if (!Array.isArray(allCases) || allCases.length <= 1) {
      return null;
    }

    const currentIdx = allCases.findIndex((c) => c.slug === currentSlug);
    const nextItem =
      currentIdx >= 0
        ? allCases[(currentIdx + 1) % allCases.length]
        : allCases.find((c) => c.slug && c.slug !== currentSlug);

    if (!nextItem || !nextItem.slug || nextItem.slug === currentSlug) {
      return null;
    }

    return {
      slug: nextItem.slug,
      label: nextItem.buttonLabel?.trim() || nextItem.title || "Next Case Study",
      sublabel: nextItem.buttonSublabel?.trim() || undefined,
      projectName: nextItem.projectTitle?.trim() || undefined,
      href: `/case/${nextItem.slug}`,
    };
  } catch (err) {
    console.warn("[Sanity Next Case Fetch Error]:", err);
    return null;
  }
}

async function CaseStudyContent({ slug }: { slug: string }) {
  const [caseData, nextCase] = await Promise.all([
    getCaseStudy(slug),
    getNextCaseStudy(slug),
  ]);

  if (!caseData) {
    notFound();
  }

  return <CaseStudyView caseData={caseData} nextCase={nextCase} />;
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] sm:px-6 py-8 sm:py-12">
      <Suspense fallback={null}>
        <CaseStudyContent slug={slug} />
      </Suspense>
    </main>
  );
}
