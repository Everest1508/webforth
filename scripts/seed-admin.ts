/**
 * One-time seed: set a user as admin.
 * Loads TURSO_* from .env.local or .env. Run from project root:
 *   npx tsx scripts/seed-admin.ts <CLERK_USER_ID>
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/libsql";
import { userRoles } from "../src/lib/db/schema";

function loadEnv() {
  const cwd = process.cwd();
  for (const file of [".env.local", ".env"]) {
    const p = path.join(cwd, file);
    if (existsSync(p)) {
      const content = readFileSync(p, "utf-8");
      for (const line of content.split("\n")) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
      break;
    }
  }
  if (!process.env.TURSO_DATABASE_URL && existsSync(path.join(cwd, "turso-token"))) {
    const content = readFileSync(path.join(cwd, "turso-token"), "utf-8")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (content.length >= 2) {
      process.env.TURSO_DATABASE_URL = content[0].trim();
      process.env.TURSO_AUTH_TOKEN = content[1].trim();
    }
  }
}
loadEnv();

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: npx tsx scripts/seed-admin.ts <CLERK_USER_ID>");
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error(
    "TURSO_DATABASE_URL is not set. Add it to .env.local or .env, or use a turso-token file (line 1: URL, line 2: token)."
  );
  process.exit(1);
}

const db = drizzle({
  connection: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});

async function main() {
  await db
    .insert(userRoles)
    .values({ userId, role: "admin" })
    .onConflictDoUpdate({
      target: userRoles.userId,
      set: { role: "admin", updatedAt: new Date() },
    });
  console.log("Admin role set for user:", userId);
}

main().catch(console.error).finally(() => process.exit(0));
