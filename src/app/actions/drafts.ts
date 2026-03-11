"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { drafts } from "@/lib/db/schema";
import { requireEditor } from "@/lib/auth";
import type { SiteContent } from "@/lib/content-types";
import { eq, desc } from "drizzle-orm";

export async function saveDraft(name: string, content: SiteContent) {
  const { userId } = await requireEditor();
  const id = nanoid(10);
  await db.insert(drafts).values({
    id,
    name,
    content: JSON.stringify(content) as unknown as typeof drafts.content,
    createdBy: userId,
  });
  revalidatePath("/cms");
  revalidatePath("/cms/drafts");
  return { id };
}

export async function updateDraft(id: string, name: string, content: SiteContent) {
  await requireEditor();
  await db
    .update(drafts)
    .set({
      name,
      content: JSON.stringify(content) as unknown as typeof drafts.content,
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, id));
  revalidatePath("/cms");
  revalidatePath("/cms/drafts");
  return { id };
}

export async function getDraft(id: string) {
  const [row] = await db.select().from(drafts).where(eq(drafts.id, id)).limit(1);
  if (!row) return null;
  const raw = row.content as unknown;
  const r = raw as SiteContent | null | undefined;
  const content: SiteContent = {
    pages: Array.isArray(r?.pages) ? r.pages : [],
    global:
      r?.global && typeof r.global === "object"
        ? { ...r.global, siteName: r.global.siteName ?? "Site", navigation: Array.isArray(r.global.navigation) ? r.global.navigation : [] }
        : { siteName: "Site", navigation: [] },
  };
  return { ...row, content };
}

export async function listDrafts() {
  const rows = await db
    .select()
    .from(drafts)
    .orderBy(desc(drafts.updatedAt))
    .limit(50);
  return rows.map((r) => ({
    ...r,
    content: r.content as unknown as SiteContent,
  }));
}

export async function deleteDraft(id: string) {
  await requireEditor();
  await db.delete(drafts).where(eq(drafts.id, id));
  revalidatePath("/cms/drafts");
}
