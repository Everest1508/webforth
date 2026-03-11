"use client";

import type { PageContent, ContentBlock } from "@/lib/content-types";

type Props = {
  page: PageContent;
  onChange: (page: PageContent) => void;
};

function updateBlock(blocks: ContentBlock[], index: number, updater: (b: ContentBlock) => ContentBlock): ContentBlock[] {
  return blocks.map((b, i) => (i === index ? updater(b) : b));
}

export default function PageEditor({ page, onChange }: Props) {
  function setBlocks(blocks: PageContent["blocks"]) {
    onChange({ ...page, blocks });
  }

  function setBlock(index: number, block: ContentBlock) {
    setBlocks(updateBlock(page.blocks, index, () => block));
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-zinc-200 bg-white p-4">
        <label className="block text-sm font-medium text-zinc-700">Page title</label>
        <input
          value={page.title}
          onChange={(e) => onChange({ ...page, title: e.target.value })}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
        />
        <label className="mt-2 block text-sm font-medium text-zinc-700">Slug</label>
        <input
          value={page.slug}
          onChange={(e) => onChange({ ...page, slug: e.target.value })}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
        />
        <label className="mt-2 block text-sm font-medium text-zinc-700">Meta description</label>
        <input
          value={page.metaDescription ?? ""}
          onChange={(e) => onChange({ ...page, metaDescription: e.target.value })}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
        />
      </div>

      {page.blocks.map((block, index) => (
        <div key={block.id} className="rounded border border-zinc-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase text-zinc-500">{block.type}</p>
          {block.type === "hero" && (
            <>
              <input
                placeholder="Heading"
                value={block.heading}
                onChange={(e) => setBlock(index, { ...block, heading: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
              <input
                placeholder="Subheading"
                value={block.subheading ?? ""}
                onChange={(e) => setBlock(index, { ...block, subheading: e.target.value })}
                className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
              />
              {block.primaryButton && (
                <>
                  <input
                    placeholder="Button label"
                    value={block.primaryButton.label}
                    onChange={(e) =>
                      setBlock(index, {
                        ...block,
                        primaryButton: { ...block.primaryButton!, label: e.target.value, url: block.primaryButton!.url },
                      })
                    }
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
                  />
                  <input
                    placeholder="Button URL"
                    value={block.primaryButton.url}
                    onChange={(e) =>
                      setBlock(index, {
                        ...block,
                        primaryButton: { ...block.primaryButton!, label: block.primaryButton!.label, url: e.target.value },
                      })
                    }
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
                  />
                </>
              )}
            </>
          )}
          {block.type === "text" && (
            <>
              <input
                placeholder="Heading"
                value={block.heading ?? ""}
                onChange={(e) => setBlock(index, { ...block, heading: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
              <textarea
                placeholder="Body"
                value={block.body}
                onChange={(e) => setBlock(index, { ...block, body: e.target.value })}
                className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
                rows={4}
              />
            </>
          )}
          {block.type === "cta" && (
            <>
              <input
                placeholder="Heading"
                value={block.heading}
                onChange={(e) => setBlock(index, { ...block, heading: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
              <input
                placeholder="Button label"
                value={block.buttonLabel}
                onChange={(e) => setBlock(index, { ...block, buttonLabel: e.target.value })}
                className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
              />
              <input
                placeholder="Button URL"
                value={block.buttonUrl}
                onChange={(e) => setBlock(index, { ...block, buttonUrl: e.target.value })}
                className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
              />
            </>
          )}
          {block.type === "image" && (
            <>
              <input
                placeholder="Image URL"
                value={block.src}
                onChange={(e) => setBlock(index, { ...block, src: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
              <input
                placeholder="Alt text"
                value={block.alt}
                onChange={(e) => setBlock(index, { ...block, alt: e.target.value })}
                className="mt-2 w-full rounded border border-zinc-300 px-3 py-2"
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
