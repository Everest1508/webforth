import { getContent } from "@/lib/get-content";
import { SiteLayout } from "@/components/site-layout";
import { BlockRenderer } from "@/components/block-renderer";

export default function HomePage() {
  const content = getContent();
  const homePage = content.pages.find((p) => p.slug === "home") ?? content.pages[0];
  if (!homePage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">No content. Add a page in the CMS.</p>
      </div>
    );
  }
  const blocks = Array.isArray(homePage.blocks) ? homePage.blocks : [];
  return (
    <SiteLayout global={content.global ?? { siteName: "Site", navigation: [] }}>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </SiteLayout>
  );
}
