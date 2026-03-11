import type { SectionStyle } from "@/lib/content-types";

const maxWidthMap = { sm: "max-w-xl", md: "max-w-3xl", lg: "max-w-5xl", full: "max-w-full" };
const paddingMap = { none: "p-0", sm: "p-4", md: "p-8", lg: "p-12" };

export function sectionStyleClasses(style?: SectionStyle | null): string {
  if (!style) return "";
  const parts: string[] = [];
  if (style.maxWidth) parts.push(maxWidthMap[style.maxWidth]);
  if (style.padding) parts.push(paddingMap[style.padding]);
  return parts.join(" ");
}

export function sectionStyleInline(style?: SectionStyle | null): React.CSSProperties {
  if (!style) return {};
  const s: React.CSSProperties = {};
  if (style.backgroundColor) s.backgroundColor = style.backgroundColor;
  if (style.textColor) s.color = style.textColor;
  if (style.minHeight) s.minHeight = style.minHeight;
  return s;
}
