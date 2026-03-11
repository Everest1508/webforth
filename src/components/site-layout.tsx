import Link from "next/link";
import type { GlobalContent } from "@/lib/content-types";

type Props = { global: GlobalContent; children: React.ReactNode; editMode?: boolean };

export function SiteLayout({ global: g, children, editMode }: Props) {
  const themeStyle = g.theme
    ? {
        ...(g.theme.backgroundColor && { backgroundColor: g.theme.backgroundColor }),
        ...(g.theme.textColor && { color: g.theme.textColor }),
        ["--theme-primary"]: g.theme.primaryColor ?? "#171717",
        ["--theme-accent"]: g.theme.accentColor ?? "#2563eb",
      } as React.CSSProperties
    : undefined;
  return (
    <div className="min-h-screen bg-white text-zinc-900" style={themeStyle}>
      <header className="border-b border-zinc-200 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {editMode ? (
            <span className="text-xl font-semibold">{g.siteName}</span>
          ) : (
            <Link href="/" className="text-xl font-semibold">
              {g.siteName}
            </Link>
          )}
          <nav className="flex gap-6">
            {g.navigation.map((item) =>
              editMode ? (
                <span key={item.url} className="text-zinc-600">
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.url}
                  href={item.url}
                  className="text-zinc-600 hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      {g.footerText && (
        <footer className="border-t border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
          {g.footerText}
        </footer>
      )}
    </div>
  );
}
