"use client";

import { useState, useTransition } from "react";
import { saveDraft, updateDraft } from "@/app/actions/drafts";
import { publishDraft } from "@/app/actions/publish";
import type { SiteContent } from "@/lib/content-types";
import PageEditor from "./page-editor";

type Props = {
  draftId: string | null;
  draftName: string;
  initialContent: SiteContent;
};

export default function CmsEditor({ draftId, draftName, initialContent }: Props) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [name, setName] = useState(draftName);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [publishStatus, setPublishStatus] = useState<{ branch?: string; url?: string; error?: string } | null>(null);

  const currentPage = content.pages[selectedPageIndex];

  function handleSave() {
    startTransition(async () => {
      if (currentDraftId) {
        await updateDraft(currentDraftId, name, content);
      } else {
        const { id } = await saveDraft(name, content);
        setCurrentDraftId(id);
        window.history.replaceState(null, "", `/cms?draftId=${id}`);
      }
    });
  }

  const effectiveDraftId = currentDraftId;

  function handlePublish() {
    if (!effectiveDraftId) {
      setPublishStatus({ error: "Save the draft first, then publish." });
      return;
    }
    startTransition(async () => {
      setPublishStatus(null);
      try {
        const result = await publishDraft(effectiveDraftId);
        setPublishStatus({ branch: result.branch, url: result.url });
      } catch (e) {
        setPublishStatus({ error: e instanceof Error ? e.message : "Publish failed" });
      }
    });
  }

  function updatePage(index: number, updater: (page: typeof currentPage) => typeof currentPage) {
    setContent((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) => (i === index ? updater(p) : p)),
    }));
  }

  function updateGlobal(updater: (g: typeof content.global) => typeof content.global) {
    setContent((prev) => ({ ...prev, global: updater(prev.global) }));
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
          placeholder="Draft name"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save draft"}
        </button>
        <button
          onClick={handlePublish}
          disabled={isPending || !effectiveDraftId}
          className="rounded-lg border border-zinc-900 px-4 py-2 hover:bg-zinc-100 disabled:opacity-50"
        >
          {isPending ? "Publishing…" : "Publish to branch"}
        </button>
      </div>

      {publishStatus?.error && (
        <p className="text-red-600">{publishStatus.error}</p>
      )}
      {publishStatus?.url && (
        <p className="text-green-700">
          Published to branch <code className="rounded bg-zinc-200 px-1">{publishStatus.branch}</code>.{" "}
          <a href={publishStatus.url} target="_blank" rel="noopener noreferrer" className="underline">
            Open preview
          </a>
        </p>
      )}

      <div className="flex gap-4 border-t border-zinc-200 pt-6">
        <aside className="w-48 shrink-0 space-y-1">
          <p className="font-medium text-zinc-700">Pages</p>
          {content.pages.map((p, i) => (
            <button
              key={p.slug}
              onClick={() => setSelectedPageIndex(i)}
              className={`block w-full rounded px-2 py-1 text-left text-sm ${i === selectedPageIndex ? "bg-zinc-200" : "hover:bg-zinc-100"}`}
            >
              {p.title}
            </button>
          ))}
          <p className="mt-4 font-medium text-zinc-700">Global</p>
          <div className="rounded border border-zinc-200 bg-white p-3 text-sm">
            <label className="block text-zinc-500">Site name</label>
            <input
              value={content.global.siteName}
              onChange={(e) => updateGlobal((g) => ({ ...g, siteName: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
            />
            <label className="mt-2 block text-zinc-500">Footer text</label>
            <input
              value={content.global.footerText ?? ""}
              onChange={(e) => updateGlobal((g) => ({ ...g, footerText: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1"
            />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {currentPage && (
            <PageEditor
              page={currentPage}
              onChange={(page) => updatePage(selectedPageIndex, () => page)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
