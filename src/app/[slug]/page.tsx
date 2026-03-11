import { getContent } from "@/lib/get-content";
import { SiteLayout } from "@/components/site-layout";
import { BlockRenderer } from "@/components/block-renderer";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "sign-in" || slug === "sign-up" || slug === "dashboard" || slug === "cms") {
    notFound();
  }
  const content = getContent();
  const page = content.pages.find((p) => p.slug === slug);
  if (!page) notFound();
  const blocks = Array.isArray(page.blocks) ? page.blocks : [];
  return (
    <SiteLayout global={content.global ?? { siteName: "Site", navigation: [] }}>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </SiteLayout>
  );
}
