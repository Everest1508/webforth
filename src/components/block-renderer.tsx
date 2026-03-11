import type { ContentBlock } from "@/lib/content-types";
import { sectionStyleClasses, sectionStyleInline } from "@/lib/section-styles";
import Link from "next/link";

type Props = { block: ContentBlock; editMode?: boolean };

function SectionWrap({
  block,
  children,
  defaultClass = "",
}: {
  block: ContentBlock & { style?: { maxWidth?: "sm" | "md" | "lg" | "full"; padding?: "none" | "sm" | "md" | "lg"; backgroundColor?: string; textColor?: string; minHeight?: string } };
  children: React.ReactNode;
  defaultClass?: string;
}) {
  const style = "style" in block ? block.style : undefined;
  const className = [defaultClass, sectionStyleClasses(style)].filter(Boolean).join(" ");
  const inlineStyle = sectionStyleInline(style);
  return (
    <section className={className} style={Object.keys(inlineStyle).length ? inlineStyle : undefined}>
      {children}
    </section>
  );
}

function EditableLink({
  href,
  children,
  className,
  editMode,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  editMode?: boolean;
}) {
  if (editMode) {
    return (
      <span className={className}>{children}</span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function BlockRenderer({ block, editMode }: Props) {
  switch (block.type) {
    case "hero":
      return (
        <SectionWrap block={block} defaultClass="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mx-auto w-full max-w-2xl">
            <h1 className="text-4xl font-bold">{block.heading}</h1>
            {block.subheading && <p className="mt-4 text-xl text-zinc-600">{block.subheading}</p>}
            <div className="mt-8 flex gap-4">
              {block.primaryButton && (
                <EditableLink href={block.primaryButton.url} className="rounded-lg bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-800" editMode={editMode}>
                  {block.primaryButton.label}
                </EditableLink>
              )}
              {block.secondaryButton && (
                <EditableLink href={block.secondaryButton.url} className="rounded-lg border border-zinc-900 px-6 py-3 hover:bg-zinc-100" editMode={editMode}>
                  {block.secondaryButton.label}
                </EditableLink>
              )}
            </div>
          </div>
        </SectionWrap>
      );
    case "text":
      return (
        <SectionWrap block={block} defaultClass="mx-auto max-w-2xl px-4 py-12">
          {block.heading && <h2 className="text-2xl font-semibold text-zinc-900">{block.heading}</h2>}
          <div
            className={`mt-4 text-zinc-600 prose prose-p:my-1 [&_a]:text-blue-600 [&_a]:underline ${
              block.alignment === "center" ? "text-center" : block.alignment === "right" ? "text-right" : ""
            }`}
            dangerouslySetInnerHTML={{
              __html: block.body.trim().startsWith("<") ? block.body : `<p>${block.body.replace(/\n/g, "<br />")}</p>`,
            }}
          />
        </SectionWrap>
      );
    case "cta":
      return (
        <SectionWrap
          block={{ ...block, style: { ...block.style, backgroundColor: block.style?.backgroundColor ?? block.backgroundColor ?? "#f4f4f5" } }}
          defaultClass="px-4 py-16"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-zinc-900">{block.heading}</h2>
            {block.subheading && <p className="mt-2 text-zinc-600">{block.subheading}</p>}
            <EditableLink href={block.buttonUrl} className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-800" editMode={editMode}>
              {block.buttonLabel}
            </EditableLink>
          </div>
        </SectionWrap>
      );
    case "image":
      return (
        <SectionWrap block={block} defaultClass="mx-auto max-w-4xl px-4 py-8">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.src || "https://placehold.co/800x400?text=Image"} alt={block.alt} width={block.width} height={block.height} className="w-full rounded-lg" />
            {block.caption && <figcaption className="mt-2 text-center text-sm text-zinc-500">{block.caption}</figcaption>}
          </figure>
        </SectionWrap>
      );
    case "features":
      return (
        <SectionWrap block={block} defaultClass="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-zinc-900">{block.heading}</h2>
          {block.subheading && <p className="mt-2 text-center text-zinc-600">{block.subheading}</p>}
          <div className={`mt-12 grid gap-8 ${block.columns === 2 ? "grid-cols-2" : block.columns === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {block.items.map((item, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-zinc-600">{item.description}</p>
              </div>
            ))}
          </div>
        </SectionWrap>
      );
    case "testimonials":
      return (
        <SectionWrap block={block} defaultClass="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-zinc-900">{block.heading}</h2>
          <div className="mt-12 space-y-8">
            {block.items.map((item, i) => (
              <blockquote key={i} className="rounded-lg border border-zinc-200 bg-white p-6">
                <p className="text-zinc-700">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-2 font-medium text-zinc-900">— {item.author}{item.role && `, ${item.role}`}</footer>
              </blockquote>
            ))}
          </div>
        </SectionWrap>
      );
    default:
      return null;
  }
}
