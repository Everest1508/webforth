import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        You have editor access. Click the button below to edit your website.
      </p>

      <div className="mt-8 rounded-xl border-2 border-zinc-200 bg-white p-8 text-center">
        <p className="text-lg font-medium text-zinc-700">Ready to edit?</p>
        <Link
          href="/cms/edit"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-lg font-medium text-white hover:bg-zinc-800"
        >
          Start editing website
        </Link>
        <p className="mt-3 text-sm text-zinc-500">
          Edit on the page like WordPress or Wix — click any section to change it.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/cms/edit"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50"
        >
          Visual editor
        </Link>
        <Link
          href="/cms"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50"
        >
          Form view
        </Link>
        <Link
          href="/cms/drafts"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50"
        >
          View drafts
        </Link>
      </div>
    </div>
  );
}
