import type { SiteContent } from "./content-types";
import { DEFAULT_SITE_CONTENT } from "./content-types";
import { readFileSync, existsSync } from "fs";
import path from "path";

let cached: SiteContent | null = null;

/**
 * Load site content from content/pages.json and content/global.json (for deployed branches).
 * Falls back to DEFAULT_SITE_CONTENT if files are missing or invalid (avoids blank site).
 */
export function getContent(): SiteContent {
  if (cached) return cached;
  const contentDir = path.join(process.cwd(), "content");
  const pagesPath = path.join(contentDir, "pages.json");
  const globalPath = path.join(contentDir, "global.json");
  try {
    if (existsSync(pagesPath) && existsSync(globalPath)) {
      const pagesJson = readFileSync(pagesPath, "utf-8");
      const globalJson = readFileSync(globalPath, "utf-8");
      const parsedPages = JSON.parse(pagesJson) as { pages?: SiteContent["pages"] };
      const pages = Array.isArray(parsedPages?.pages) ? parsedPages.pages : [];
      const global = JSON.parse(globalJson) as SiteContent["global"];
      // Ensure we never return empty pages or broken global (would cause blank site)
      const safeGlobal: SiteContent["global"] = global && typeof global === "object"
        ? { ...global, siteName: global.siteName ?? "Site", navigation: Array.isArray(global.navigation) ? global.navigation : [] }
        : DEFAULT_SITE_CONTENT.global;
      if (pages.length > 0) {
        cached = { pages, global: safeGlobal };
        return cached;
      }
    }
  } catch {
    // fall through to default
  }
  cached = DEFAULT_SITE_CONTENT;
  return cached;
}
