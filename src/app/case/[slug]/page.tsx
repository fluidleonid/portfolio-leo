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
  if (caseData) {
    return {
      title: `${caseData.title} — Leo Rogov`,
      description: caseData.tagline || `${caseData.title} Case Study`,
    };
  }
  return {
    title: "Case Study — Leo Rogov",
  };
}

async function getCaseStudy(slug: string): Promise<CaseStudyData | null> {
  // 1. If user has connected their Sanity project, fetch live CMS data
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

  // 2. Fall back to high-craft seed cases from cases.pdf
  return seedCases[slug] ?? null;
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const caseData = await getCaseStudy(slug);

  if (!caseData) {
    notFound();
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-canvas px-[16px] sm:px-6 py-8 sm:py-12">
      <CaseStudyView caseData={caseData} />
    </main>
  );
}
