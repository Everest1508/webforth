import { getDraft } from "@/app/actions/drafts";
import { SiteLayout } from "@/components/site-layout";
import { BlockRenderer } from "@/components/block-renderer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ draftId: string }> };

export default async function DraftPreviewPage({ params }: Props) {
  const { draftId } = await params;
  const draft = await getDraft(draftId);
  if (!draft) notFound();
  const content = draft.content;
  const homePage = content.pages.find((p) => p.slug === "home") ?? content.pages[0];
  if (!homePage) {
    return (
      <SiteLayout global={content.global}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-zinc-500">No content in this draft.</p>
        </div>
      </SiteLayout>
    );
  }
  return (
    <SiteLayout global={content.global}>
      {homePage.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
      <p className="py-4 text-center text-sm text-zinc-500">Draft preview</p>
    </SiteLayout>
  );
}
