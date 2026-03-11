"use client";

import { useState, useTransition, useEffect } from "react";
import { nanoid } from "nanoid";
import { saveDraft, updateDraft } from "@/app/actions/drafts";
import { publishDraft } from "@/app/actions/publish";
import type { SiteContent, ContentBlock } from "@/lib/content-types";
import { SiteLayout } from "@/components/site-layout";
import { BlockRenderer } from "@/components/block-renderer";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SectionStyleFields } from "./section-style-fields";
import Link from "next/link";

const BLOCK_TYPES: { type: ContentBlock["type"]; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "text", label: "Text" },
  { type: "cta", label: "Call to action" },
  { type: "image", label: "Image" },
  { type: "features", label: "Features" },
  { type: "testimonials", label: "Testimonials" },
];

function createBlock(type: ContentBlock["type"]): ContentBlock {
  const id = nanoid(8);
  switch (type) {
    case "hero":
      return { type: "hero", id, heading: "New section", subheading: "", layout: "center" };
    case "text":
      return { type: "text", id, body: "<p>New text block.</p>", alignment: "left" };
    case "cta":
      return { type: "cta", id, heading: "Call to action", buttonLabel: "Click", buttonUrl: "#" };
    case "image":
      return { type: "image", id, src: "https://placehold.co/800x400?text=Image", alt: "Image" };
    case "features":
      return { type: "features", id, heading: "Features", items: [{ title: "Feature", description: "Description" }], columns: 3 };
    case "testimonials":
      return { type: "testimonials", id, heading: "Testimonials", items: [{ quote: "Quote", author: "Author" }] };
    default:
      return { type: "text", id, body: "<p></p>", alignment: "left" };
  }
}

function AddSectionDropdown({ onSelect, label }: { onSelect: (type: ContentBlock["type"]) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative py-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded border border-dashed border-zinc-300 bg-zinc-50 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100"
      >
        {label}
      </button>
      {open && (
        <>
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded border border-zinc-200 bg-white py-1 shadow-lg">
            {BLOCK_TYPES.map(({ type, label: l }) => (
              <button
                key={type}
                type="button"
                onClick={() => { onSelect(type); setOpen(false); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
              >
                {l}
              </button>
            ))}
          </div>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
        </>
      )}
    </div>
  );
}

type Props = {
  draftId: string | null;
  draftName: string;
  initialContent: SiteContent;
};

type Selection = { pageIndex: number; blockIndex: number } | null;

export default function VisualEditor({
  draftId,
  draftName,
  initialContent,
}: Props) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [name, setName] = useState(draftName);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selection, setSelection] = useState<Selection>(null);
  const [isPending, startTransition] = useTransition();
  const [publishStatus, setPublishStatus] = useState<{
    branch?: string;
    url?: string;
    error?: string;
  } | null>(null);

  const pages = content.pages ?? [];
  const safePageIndex = pages.length > 0 ? Math.max(0, Math.min(selectedPageIndex, pages.length - 1)) : 0;

  useEffect(() => {
    if (selectedPageIndex !== safePageIndex) setSelectedPageIndex(safePageIndex);
  }, [safePageIndex, selectedPageIndex]);

  const currentPage = pages[safePageIndex] ?? null;
  const selectedBlock: ContentBlock | null =
    selection !== null && currentPage && currentPage.blocks
      ? currentPage.blocks[selection.blockIndex] ?? null
      : null;

  function updateBlock(blockIndex: number, updater: (b: ContentBlock) => ContentBlock) {
    if (!currentPage) return;
    setContent((prev) => ({
      ...prev,
      pages: (prev.pages ?? []).map((p, i) =>
        i === safePageIndex
          ? {
              ...p,
              blocks: p.blocks.map((b, j) =>
                j === blockIndex ? updater(b) : b
              ),
            }
          : p
      ),
    }));
  }

  const defaultGlobal: SiteContent["global"] = { siteName: "", navigation: [] };

  function updateGlobal(updater: (g: SiteContent["global"]) => SiteContent["global"]) {
    setContent((prev) => ({ ...prev, global: updater(prev.global ?? defaultGlobal) }));
  }

  function insertBlock(atIndex: number, blockType: ContentBlock["type"]) {
    if (!currentPage) return;
    const newBlock = createBlock(blockType);
    setContent((prev) => ({
      ...prev,
      pages: (prev.pages ?? []).map((p, i) =>
        i === safePageIndex
          ? { ...p, blocks: [...(p.blocks ?? []).slice(0, atIndex), newBlock, ...(p.blocks ?? []).slice(atIndex)] }
          : p
      ),
    }));
    setSelection({ pageIndex: safePageIndex, blockIndex: atIndex });
  }

  function moveBlock(fromIndex: number, direction: "up" | "down") {
    if (!currentPage?.blocks) return;
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentPage.blocks.length) return;
    const blocks = [...currentPage.blocks];
    [blocks[fromIndex], blocks[toIndex]] = [blocks[toIndex], blocks[fromIndex]];
    setContent((prev) => ({
      ...prev,
      pages: (prev.pages ?? []).map((p, i) =>
        i === safePageIndex ? { ...p, blocks } : p
      ),
    }));
    setSelection({ pageIndex: safePageIndex, blockIndex: toIndex });
  }

  function duplicateBlock(blockIndex: number) {
    if (!currentPage?.blocks) return;
    const block = currentPage.blocks[blockIndex];
    if (!block) return;
    const newBlock = { ...block, id: nanoid(8) } as ContentBlock;
    setContent((prev) => ({
      ...prev,
      pages: (prev.pages ?? []).map((p, i) =>
        i === safePageIndex
          ? { ...p, blocks: [...p.blocks.slice(0, blockIndex + 1), newBlock, ...p.blocks.slice(blockIndex + 1)] }
          : p
      ),
    }));
    setSelection({ pageIndex: safePageIndex, blockIndex: blockIndex + 1 });
  }

  function deleteBlock(blockIndex: number) {
    if (!currentPage?.blocks || currentPage.blocks.length <= 1) return;
    setContent((prev) => ({
      ...prev,
      pages: (prev.pages ?? []).map((p, i) =>
        i === safePageIndex
          ? { ...p, blocks: p.blocks.filter((_, j) => j !== blockIndex) }
          : p
      ),
    }));
    setSelection(selection !== null && selection.blockIndex === blockIndex
      ? (blockIndex > 0 ? { pageIndex: safePageIndex, blockIndex: blockIndex - 1 } : { pageIndex: safePageIndex, blockIndex: 0 })
      : selection !== null && selection.blockIndex > blockIndex
        ? { pageIndex: safePageIndex, blockIndex: selection.blockIndex - 1 }
        : null
    );
  }

  function getBlockLabel(block: ContentBlock): string {
    switch (block.type) {
      case "hero": return block.heading || "Hero";
      case "text": return block.heading || "Text";
      case "cta": return block.heading || "CTA";
      case "image": return block.alt || "Image";
      case "features": return block.heading || "Features";
      case "testimonials": return block.heading || "Testimonials";
      default: return "Section";
    }
  }

  function addPage() {
    const title = window.prompt("New page title:", "New page");
    if (!title?.trim()) return;
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setContent((prev) => {
      const prevPages = prev.pages ?? [];
      return {
        ...prev,
        pages: [
          ...prevPages,
          {
            slug: slug || `page-${prevPages.length + 1}`,
            title: title.trim(),
            blocks: [{ type: "text", id: nanoid(8), body: "<p>Start editing.</p>", alignment: "left" }],
          },
        ],
      };
    });
    setSelectedPageIndex(pages.length);
    setSelection(null);
  }

  function handleSave() {
    startTransition(async () => {
      if (currentDraftId) {
        await updateDraft(currentDraftId, name, content);
      } else {
        const { id } = await saveDraft(name, content);
        setCurrentDraftId(id);
        window.history.replaceState(null, "", `/cms/edit?draftId=${id}`);
      }
    });
  }

  function handlePublish() {
    if (!currentDraftId) {
      setPublishStatus({ error: "Save the draft first, then publish." });
      return;
    }
    startTransition(async () => {
      setPublishStatus(null);
      try {
        const result = await publishDraft(currentDraftId);
        setPublishStatus({ branch: result.branch, url: result.url });
      } catch (e) {
        setPublishStatus({
          error: e instanceof Error ? e.message : "Publish failed",
        });
      }
    });
  }

  const isSelected = (blockIndex: number) =>
    selection !== null && selection.blockIndex === blockIndex;

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-100">
      {/* Toolbar */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Dashboard
          </Link>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-40 rounded border border-zinc-300 px-2 py-1.5 text-sm"
            placeholder="Draft name"
          />
          <select
            value={safePageIndex}
            onChange={(e) => {
              setSelectedPageIndex(Number(e.target.value));
              setSelection(null);
            }}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {pages.map((p, i) => (
              <option key={p.slug} value={i}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addPage}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            + New page
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPending || !currentDraftId}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Publish
          </button>
          <a
            href={currentDraftId ? `/preview/${currentDraftId}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-600 hover:underline disabled:pointer-events-none"
          >
            Preview
          </a>
          <Link
            href={currentDraftId ? `/cms?draftId=${currentDraftId}` : "/cms"}
            className="text-sm text-zinc-600 hover:underline"
          >
            Form view
          </Link>
        </div>
      </header>

      {publishStatus?.error && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-700">
          {publishStatus.error}
        </div>
      )}
      {publishStatus?.url && (
        <div className="bg-green-50 px-4 py-2 text-sm text-green-800">
          Published.{" "}
          <a
            href={publishStatus.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Open preview
          </a>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Left: Layers panel (Figma / Android Studio style) */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
          <div className="border-b border-zinc-200 px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Layers</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {pages.map((page, pageIdx) => (
              <div key={page.slug} className="mb-2">
                <button
                  type="button"
                  onClick={() => { setSelectedPageIndex(pageIdx); setSelection(null); }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium ${
                    safePageIndex === pageIdx ? "bg-zinc-200 text-zinc-900" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="text-zinc-400">📄</span>
                  {page.title}
                </button>
                {safePageIndex === pageIdx && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-zinc-200 pl-2">
                    {(page.blocks ?? []).map((block, blockIdx) => (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => setSelection({ pageIndex: pageIdx, blockIndex: blockIdx })}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                          selection?.pageIndex === pageIdx && selection?.blockIndex === blockIdx
                            ? "bg-blue-100 text-blue-900"
                            : "text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <span className="text-zinc-400">
                          {block.type === "hero" ? "▣" : block.type === "text" ? "T" : block.type === "cta" ? "◉" : block.type === "image" ? "🖼" : "▤"}
                        </span>
                        <span className="min-w-0 truncate">{getBlockLabel(block)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="mx-auto min-h-full max-w-5xl">
            <SiteLayout global={content.global ?? defaultGlobal} editMode>
              {currentPage?.blocks.map((block, blockIndex) => (
                <div key={block.id} className="relative">
                  <AddSectionDropdown onSelect={(type) => insertBlock(blockIndex, type)} label="+ Add section above" />
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelection({ pageIndex: selectedPageIndex, blockIndex });
                    }}
                    className={`relative cursor-pointer transition-all ${
                      isSelected(blockIndex)
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "hover:ring-1 hover:ring-zinc-300 hover:ring-offset-2"
                    }`}
                  >
                    {isSelected(blockIndex) && (
                      <span className="absolute left-2 top-2 z-10 rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                        Edit
                      </span>
                    )}
                    <BlockRenderer block={block} editMode />
                  </div>
                </div>
              ))}
              {currentPage && (
                <AddSectionDropdown
                  onSelect={(type) => insertBlock(currentPage.blocks.length, type)}
                  label="+ Add section"
                />
              )}
            </SiteLayout>
          </div>
        </div>

        {/* Right: Properties panel */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-4">
          {selectedBlock && selection !== null ? (
            <BlockEditSidebar
              block={selectedBlock}
              blockIndex={selection.blockIndex}
              totalBlocks={currentPage?.blocks.length ?? 0}
              onChange={(updated) => updateBlock(selection.blockIndex, () => updated)}
              onClose={() => setSelection(null)}
              onMoveUp={() => moveBlock(selection.blockIndex, "up")}
              onMoveDown={() => moveBlock(selection.blockIndex, "down")}
              onDuplicate={() => duplicateBlock(selection.blockIndex)}
              onDelete={() => deleteBlock(selection.blockIndex)}
            />
          ) : (
            <div className="text-center text-sm text-zinc-500">
              Click a section on the page to edit it.
            </div>
          )}
          {/* Global fields always visible */}
          <div className="mt-6 border-t border-zinc-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Site settings</p>
            <label className="block text-sm text-zinc-700">Site name</label>
            <input
              value={(content.global ?? defaultGlobal).siteName}
              onChange={(e) => updateGlobal((g) => ({ ...g, siteName: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <label className="mt-2 block text-sm text-zinc-700">Footer text</label>
            <input
              value={(content.global ?? defaultGlobal).footerText ?? ""}
              onChange={(e) => updateGlobal((g) => ({ ...g, footerText: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <p className="mt-3 text-xs font-semibold uppercase text-zinc-500">Color palette</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["primaryColor", "secondaryColor", "backgroundColor", "textColor", "accentColor"] as const).map((key) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-600">{key.replace(/([A-Z])/g, " $1").trim()}</label>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={(content.global ?? defaultGlobal).theme?.[key] ?? "#000000"}
                      onChange={(e) =>
                        updateGlobal((g) => ({
                          ...g,
                          theme: { ...(g.theme ?? {}), [key]: e.target.value },
                        }))
                      }
                      className="h-7 w-8 cursor-pointer rounded border border-zinc-300"
                    />
                    <input
                      type="text"
                      value={(content.global ?? defaultGlobal).theme?.[key] ?? ""}
                      onChange={(e) =>
                        updateGlobal((g) => ({
                          ...g,
                          theme: { ...(g.theme ?? {}), [key]: e.target.value || undefined },
                        }))
                      }
                      className="min-w-0 flex-1 rounded border border-zinc-300 px-1.5 py-1 text-xs"
                      placeholder="#"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BlockEditSidebar({
  block,
  blockIndex,
  totalBlocks,
  onChange,
  onClose,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: {
  block: ContentBlock;
  blockIndex: number;
  totalBlocks: number;
  onChange: (b: ContentBlock) => void;
  onClose: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-zinc-500">{block.type}</span>
        <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label="Close">
          ×
        </button>
      </div>
      {/* Section actions: reorder, duplicate, delete (Figma/IDE style) */}
      <div className="mb-3 flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={blockIndex === 0}
          className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
          title="Move up"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={blockIndex >= totalBlocks - 1}
          className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
          title="Move down"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button type="button" onClick={onDuplicate} className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200" title="Duplicate">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        <button type="button" onClick={onDelete} className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40" title="Delete" disabled={totalBlocks <= 1}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
      {block.type === "hero" && (
        <>
          <label className="block text-sm text-zinc-700">Heading</label>
          <input
            value={block.heading}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <label className="mt-2 block text-sm text-zinc-700">Subheading</label>
          <input
            value={block.subheading ?? ""}
            onChange={(e) => onChange({ ...block, subheading: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          {block.primaryButton && (
            <>
              <label className="mt-2 block text-sm text-zinc-700">Button label</label>
              <input
                value={block.primaryButton.label}
                onChange={(e) => onChange({ ...block, primaryButton: { ...block.primaryButton!, label: e.target.value } })}
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
              />
              <label className="mt-2 block text-sm text-zinc-700">Button URL</label>
              <input
                value={block.primaryButton.url}
                onChange={(e) => onChange({ ...block, primaryButton: { ...block.primaryButton!, url: e.target.value } })}
                className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </>
          )}
          <SectionStyleFields
            style={"style" in block ? block.style : undefined}
            onChange={(s) => onChange({ ...block, style: s })}
          />
        </>
      )}
      {block.type === "text" && (
        <>
          <label className="block text-sm text-zinc-700">Heading</label>
          <input
            value={block.heading ?? ""}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <label className="mt-2 block text-sm text-zinc-700">Body (rich text)</label>
          <RichTextEditor
            value={block.body}
            onChange={(html) => onChange({ ...block, body: html })}
            minHeight="140px"
            className="mt-1"
          />
          <SectionStyleFields
            style={"style" in block ? block.style : undefined}
            onChange={(s) => onChange({ ...block, style: s })}
          />
        </>
      )}
      {block.type === "cta" && (
        <>
          <label className="block text-sm text-zinc-700">Heading</label>
          <input
            value={block.heading}
            onChange={(e) => onChange({ ...block, heading: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <label className="mt-2 block text-sm text-zinc-700">Button label</label>
          <input
            value={block.buttonLabel}
            onChange={(e) => onChange({ ...block, buttonLabel: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <label className="mt-2 block text-sm text-zinc-700">Button URL</label>
          <input
            value={block.buttonUrl}
            onChange={(e) => onChange({ ...block, buttonUrl: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <SectionStyleFields
            style={"style" in block ? block.style : undefined}
            onChange={(s) => onChange({ ...block, style: s })}
          />
        </>
      )}
      {block.type === "image" && (
        <>
          <label className="block text-sm text-zinc-700">Image URL</label>
          <input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          {block.src && (
            <div className="mt-1 overflow-hidden rounded border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="h-24 w-full object-cover" />
            </div>
          )}
          <label className="mt-2 block text-sm text-zinc-700">Alt text</label>
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
          />
          <SectionStyleFields
            style={"style" in block ? block.style : undefined}
            onChange={(s) => onChange({ ...block, style: s })}
          />
        </>
      )}
      {(block.type === "features" || block.type === "testimonials") && (
        <p className="text-sm text-zinc-500">
          Edit this block in Form view for now.
        </p>
      )}
    </div>
  );
}
