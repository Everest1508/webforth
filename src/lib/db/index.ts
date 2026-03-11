import { drizzle } from "drizzle-orm/libsql";
import { readFileSync, existsSync } from "fs";
import path from "path";
import * as schema from "./schema";

function loadTursoTokenFromFile() {
  if (process.env.TURSO_DATABASE_URL) return;
  const tokenPath = path.join(process.cwd(), "turso-token");
  if (!existsSync(tokenPath)) return;
  try {
    const content = readFileSync(tokenPath, "utf-8").trim().split(/\r?\n/).filter(Boolean);
    if (content.length >= 2) {
      process.env.TURSO_DATABASE_URL = content[0].trim();
      process.env.TURSO_AUTH_TOKEN = content[1].trim();
    }
  } catch {
    // ignore
  }
}

function createDb() {
  if (process.env.NODE_ENV !== "production") {
    loadTursoTokenFromFile();
  }
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to .env.local, or in development place a turso-token file (line 1: URL, line 2: auth token)."
    );
  }
  return drizzle({
    connection: {
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
    schema,
  });
}

let _db: ReturnType<typeof createDb> | null = null;
export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});
export * from "./schema";
