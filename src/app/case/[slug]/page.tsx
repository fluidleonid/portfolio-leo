import { Suspense } from "react";
import { notFound } from "next/navigation";
import { seedCases, type CaseStudyData } from "@/entities/case-study";
import { CaseStudyView } from "@/widgets/case-study";
import { client } from "@/sanity/lib/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(seedCases).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const caseData = seedCases[slug];
  const title = caseData?.title || "Case Study";
  const description = caseData?.tagline || `${title} — Leonid Dmitriev`;
  const image = caseData?.coverImage || "/quickaccess.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} — Leonid Dmitriev`,
      description,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Leonid Dmitriev`,
      description,
      images: [image],
    },
  };
}

async function getCaseStudy(slug: string): Promise<CaseStudyData | null> {
  if (
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "demo-project"
  ) {
    try {
      const sanityCase = await client.fetch<CaseStudyData>(
        `*[_type == "caseStudy" && slug.current == $slug][0]`,
        { slug }
      );
      if (sanityCase && sanityCase.title) {
        return sanityCase;
      }
    } catch (err) {
      console.warn("[Sanity] Fetch failed, falling back to seed cases:", err);
    }
  }

  return seedCases[slug] ?? null;
}

async function CaseStudyContent({ slug }: { slug: string }) {
  const caseData = await getCaseStudy(slug);

  if (!caseData) {
    notFound();
  }

  return <CaseStudyView caseData={caseData} />;
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const fallbackCase = seedCases[slug];

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] sm:px-6 py-8 sm:py-12">
      <Suspense fallback={fallbackCase ? <CaseStudyView caseData={fallbackCase} /> : null}>
        <CaseStudyContent slug={slug} />
      </Suspense>
    </main>
  );
}
