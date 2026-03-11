import { getDraft } from "@/app/actions/drafts";
import { DEFAULT_SITE_CONTENT } from "@/lib/content-types";
import VisualEditor from "../visual-editor-client";

export const dynamic = "force-dynamic";

type SearchParams = { draftId?: string };

export default async function CmsEditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { draftId } = await searchParams;
  const draft = draftId ? await getDraft(draftId) : null;
  const initialContent = draft?.content ?? DEFAULT_SITE_CONTENT;
  const draftName = draft?.name ?? "Untitled draft";

  return (
    <VisualEditor
      draftId={draft?.id ?? null}
      draftName={draftName}
      initialContent={initialContent}
    />
  );
}
