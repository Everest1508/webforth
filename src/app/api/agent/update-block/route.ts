import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole, canEdit } from "@/lib/auth";
import { getDraft, updateDraft } from "@/app/actions/drafts";
import type { SiteContent, ContentBlock } from "@/lib/content-types";

type UpdateInstruction =
  | { type: "setHeading"; blockId: string; value: string }
  | { type: "setBody"; blockId: string; value: string }
  | { type: "setSubheading"; blockId: string; value: string }
  | { type: "setButtonLabel"; blockId: string; value: string }
  | { type: "setButtonUrl"; blockId: string; value: string }
  | { type: "setImageSrc"; blockId: string; value: string }
  | { type: "setImageAlt"; blockId: string; value: string };

function applyInstruction(
  content: SiteContent,
  instruction: UpdateInstruction
): SiteContent {
  const { blockId, type } = instruction;
  const value = "value" in instruction ? instruction.value : "";
  const updateBlock = (blocks: ContentBlock[]): ContentBlock[] =>
    blocks.map((b) => {
      if (b.id !== blockId) return b;
      switch (type) {
        case "setHeading":
          return "heading" in b ? { ...b, heading: value } : b;
        case "setSubheading":
          return "subheading" in b ? { ...b, subheading: value } : b;
        case "setBody":
          return b.type === "text" ? { ...b, body: value } : b;
        case "setButtonLabel":
          return b.type === "cta"
            ? { ...b, buttonLabel: value }
            : b.type === "hero" && b.primaryButton
              ? { ...b, primaryButton: { ...b.primaryButton, label: value } }
              : b;
        case "setButtonUrl":
          return b.type === "cta"
            ? { ...b, buttonUrl: value }
            : b.type === "hero" && b.primaryButton
              ? { ...b, primaryButton: { ...b.primaryButton, url: value } }
              : b;
        case "setImageSrc":
          return b.type === "image" ? { ...b, src: value } : b;
        case "setImageAlt":
          return b.type === "image" ? { ...b, alt: value } : b;
        default:
          return b;
      }
    });
  return {
    ...content,
    pages: content.pages.map((p) => ({ ...p, blocks: updateBlock(p.blocks) })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = await getUserRole();
    if (!canEdit(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { draftId, instructions } = body as {
      draftId: string;
      instructions: UpdateInstruction[];
    };
    if (!draftId || !Array.isArray(instructions)) {
      return NextResponse.json(
        { error: "draftId and instructions[] required" },
        { status: 400 }
      );
    }
    const draft = await getDraft(draftId);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    let content = draft.content;
    for (const inst of instructions) {
      content = applyInstruction(content, inst);
    }
    await updateDraft(draftId, draft.name, content);
    return NextResponse.json({ ok: true, draftId });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
