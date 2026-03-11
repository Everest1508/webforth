import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Role = "admin" | "editor" | "viewer";

export async function getUserRole(): Promise<Role | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    const [row] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);
    if (row) return row.role as Role;

    const existing = await db.select().from(userRoles).limit(1);
    if (existing.length === 0) {
      await db.insert(userRoles).values({ userId, role: "admin" });
      return "admin";
    }
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no such table") || msg.includes("SQLITE_UNKNOWN")) {
      return null;
    }
    if (msg.includes("UNIQUE constraint") || msg.includes("unique")) {
      const [retry] = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userId))
        .limit(1);
      return (retry?.role as Role) ?? null;
    }
    throw err;
  }
}

export function canEdit(role: Role | null): boolean {
  return role === "admin" || role === "editor";
}

export async function requireEditor(): Promise<{ userId: string; role: Role }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = await getUserRole();
  if (!canEdit(role)) throw new Error("Forbidden: editor or admin role required");
  return { userId, role: role! };
}
