"use server";

import { getDraft } from "@/app/actions/drafts";
import { requireEditor } from "@/lib/auth";
import { publishToGitHub } from "@/lib/github-publish";

export async function publishDraft(draftId: string): Promise<{ branch: string; url: string; prUrl?: string }> {
  await requireEditor();
  const draft = await getDraft(draftId);
  if (!draft) throw new Error("Draft not found");
  return publishToGitHub(draftId, draft.content, draft.name);
}
