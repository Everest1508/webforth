import { getDraft } from "@/app/actions/drafts";
import { DEFAULT_SITE_CONTENT } from "@/lib/content-types";
import CmsEditor from "./cms-editor-client";

export const dynamic = "force-dynamic";

type SearchParams = { draftId?: string };

export default async function CmsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { draftId } = await searchParams;
  const draft = draftId ? await getDraft(draftId) : null;
  const initialContent =
    draft?.content ?? DEFAULT_SITE_CONTENT;
  const draftName = draft?.name ?? "Untitled draft";

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Edit site content</h1>
      <p className="mt-2 text-zinc-600">
        Change headings, text, images, and layout. Save as draft, then publish to a new GitHub branch.
      </p>
      <CmsEditor
        draftId={draft?.id ?? null}
        draftName={draftName}
        initialContent={initialContent}
      />
    </div>
  );
}
