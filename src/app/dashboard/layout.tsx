import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserRole, canEdit } from "@/lib/auth";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";

async function isDbSetUp(): Promise<boolean> {
  try {
    await db.select().from(userRoles).limit(1);
    return true;
  } catch {
    return false;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const dbReady = await isDbSetUp();
  if (!dbReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-amber-900">Database setup required</h1>
          <p className="mt-2 text-sm text-amber-800">
            The <code className="rounded bg-amber-100 px-1">user_roles</code> table does not exist yet. Run the schema push:
          </p>
          <pre className="mt-4 overflow-x-auto rounded bg-zinc-800 p-4 text-left text-sm text-zinc-100">
            npm run db:push
          </pre>
          <p className="mt-2 text-xs text-amber-700">
            Then seed an admin: <code className="rounded bg-amber-100 px-1">npx tsx scripts/seed-admin.ts YOUR_CLERK_USER_ID</code>
          </p>
        </div>
        <div className="mt-4 flex gap-4">
          <a href="/" className="text-sm text-zinc-600 hover:underline">Back to site</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    );
  }
  const role = await getUserRole();
  if (!canEdit(role)) {
    redirect("/?error=forbidden");
  }
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-zinc-900">
              Dashboard
            </Link>
            <Link href="/cms" className="text-zinc-600 hover:text-zinc-900">
              Edit site
            </Link>
            <Link href="/" className="text-zinc-600 hover:text-zinc-900">
              View site
            </Link>
          </nav>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
