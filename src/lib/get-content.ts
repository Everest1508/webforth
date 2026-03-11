import type { SiteContent } from "./content-types";
import { DEFAULT_SITE_CONTENT } from "./content-types";
import { readFileSync, existsSync } from "fs";
import path from "path";

let cached: SiteContent | null = null;

/**
 * Load site content from content/pages.json and content/global.json (for deployed branches).
 * Falls back to DEFAULT_SITE_CONTENT if files are missing (e.g. dev before first publish).
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
      const { pages } = JSON.parse(pagesJson) as { pages: SiteContent["pages"] };
      const global = JSON.parse(globalJson) as SiteContent["global"];
      cached = { pages, global };
      return cached;
    }
  } catch {
    // fall through to default
  }
  cached = DEFAULT_SITE_CONTENT;
  return cached;
}
