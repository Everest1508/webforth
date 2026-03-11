import Link from "next/link";
import { listDrafts } from "@/app/actions/drafts";

export const dynamic = "force-dynamic";

export default async function DraftsListPage() {
  const draftsList = await listDrafts();
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Drafts</h1>
      <p className="mt-2 text-zinc-600">
        Create or open a draft, then publish to a new GitHub branch for a Vercel preview.
      </p>
      <Link
        href="/cms"
        className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
      >
        New draft
      </Link>
      <ul className="mt-6 space-y-3">
        {draftsList.length === 0 && (
          <li className="text-zinc-500">No drafts yet. Create one from the editor.</li>
        )}
        {draftsList.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
            <div>
              <Link href={`/cms?draftId=${d.id}`} className="font-medium text-zinc-900 hover:underline">
                {d.name}
              </Link>
              <p className="text-sm text-zinc-500">
                Updated {d.updatedAt instanceof Date ? d.updatedAt.toLocaleDateString() : String(d.updatedAt)}
                {d.publishedBranch && ` · Branch: ${d.publishedBranch}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/cms?draftId=${d.id}`}
                className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
              >
                Edit
              </Link>
              {d.publishedUrl && (
                <a
                  href={d.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
                >
                  Preview
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
