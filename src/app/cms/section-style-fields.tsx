"use client";

import type { SectionStyle } from "@/lib/content-types";

const MAX_WIDTH_OPTIONS: { value: SectionStyle["maxWidth"]; label: string }[] = [
  { value: "sm", label: "Narrow" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Wide" },
  { value: "full", label: "Full width" },
];
const PADDING_OPTIONS: { value: SectionStyle["padding"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export function SectionStyleFields({
  style,
  onChange,
}: {
  style?: SectionStyle | null;
  onChange: (s: SectionStyle) => void;
}) {
  const s = style ?? {};
  return (
    <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">Section size &amp; style</p>
      <div>
        <label className="block text-xs text-zinc-600">Width</label>
        <select
          value={s.maxWidth ?? ""}
          onChange={(e) => onChange({ ...s, maxWidth: (e.target.value || undefined) as SectionStyle["maxWidth"] })}
          className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
        >
          <option value="">Default</option>
          {MAX_WIDTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-600">Padding</label>
        <select
          value={s.padding ?? ""}
          onChange={(e) => onChange({ ...s, padding: (e.target.value || undefined) as SectionStyle["padding"] })}
          className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
        >
          <option value="">Default</option>
          {PADDING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-600">Background</label>
        <div className="mt-0.5 flex gap-1">
          <input
            type="color"
            value={s.backgroundColor ?? "#ffffff"}
            onChange={(e) => onChange({ ...s, backgroundColor: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-zinc-300"
          />
          <input
            type="text"
            value={s.backgroundColor ?? ""}
            onChange={(e) => onChange({ ...s, backgroundColor: e.target.value || undefined })}
            placeholder="#ffffff"
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-600">Text color</label>
        <div className="mt-0.5 flex gap-1">
          <input
            type="color"
            value={s.textColor ?? "#171717"}
            onChange={(e) => onChange({ ...s, textColor: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-zinc-300"
          />
          <input
            type="text"
            value={s.textColor ?? ""}
            onChange={(e) => onChange({ ...s, textColor: e.target.value || undefined })}
            placeholder="#171717"
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
