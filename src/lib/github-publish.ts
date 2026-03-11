import { db } from "@/lib/db";
import { drafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SiteContent } from "@/lib/content-types";

const GITHUB_API = "https://api.github.com";

function getAuthHeaders(): HeadersInit {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  if (!token) throw new Error("GITHUB_ACCESS_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function publishToGitHub(
  draftId: string,
  content: SiteContent,
  _draftName: string
): Promise<{ branch: string; url: string }> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  if (!owner || !repo) throw new Error("GITHUB_REPO_OWNER and GITHUB_REPO_NAME must be set");

  const branchName = `cms/preview-${draftId}`;

  // Resolve default branch: use env or fetch from repo (handles main vs master)
  let defaultBranch = process.env.GITHUB_DEFAULT_BRANCH;
  if (!defaultBranch) {
    const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: getAuthHeaders(),
    });
    if (!repoRes.ok) {
      const err = await repoRes.text();
      if (repoRes.status === 404) {
        throw new Error(
          `Repo not found: ${owner}/${repo}. Check GITHUB_REPO_OWNER and GITHUB_REPO_NAME, and that your token has access.`
        );
      }
      throw new Error(`Failed to get repo: ${repoRes.status} ${err}`);
    }
    const repoData = (await repoRes.json()) as { default_branch: string };
    defaultBranch = repoData.default_branch ?? "main";
  }

  // Get default branch SHA
  const refRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
    { headers: getAuthHeaders() }
  );
  if (!refRes.ok) {
    const err = await refRes.text();
    if (refRes.status === 404) {
      throw new Error(
        `Branch "${defaultBranch}" not found in ${owner}/${repo}. Set GITHUB_DEFAULT_BRANCH to your default branch (e.g. main or master).`
      );
    }
    throw new Error(`Failed to get ref: ${refRes.status} ${err}`);
  }
  const { object } = (await refRes.json()) as { object: { sha: string } };
  const baseSha = object.sha;

  // Create new branch
  const createRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  });
  if (!createRefRes.ok) {
    const err = await createRefRes.text();
    if (err.includes("Reference already exists")) {
      // Branch exists; we'll update it by creating a new commit and updating the ref
    } else {
      throw new Error(`Failed to create branch: ${createRefRes.status} ${err}`);
    }
  }

  // Content files: write content/pages.json and content/global.json (ensure serializable)
  const contentDir = "content";
  const safeGlobal = content.global ?? { siteName: "", navigation: [] };
  const safePages = content.pages ?? [];
  let pagesJson: string;
  let globalJson: string;
  try {
    pagesJson = JSON.stringify({ pages: safePages }, null, 2);
    globalJson = JSON.stringify(safeGlobal, null, 2);
  } catch (e) {
    throw new Error("Content could not be serialized to JSON. Check for invalid or circular data.");
  }

  // Get tree SHA for base (we need the latest commit tree)
  const commitRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/commits/${baseSha}`,
    { headers: getAuthHeaders() }
  );
  if (!commitRes.ok) {
    const err = await commitRes.text();
    throw new Error(`Failed to get base commit: ${commitRes.status} ${err}`);
  }
  const { tree } = (await commitRes.json()) as { tree: { sha: string } };
  const baseTreeSha = tree.sha;

  // Create blobs for our files (GitHub accepts utf-8; surface API errors)
  const createBlob = async (rawContent: string, label: string): Promise<string> => {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ content: rawContent, encoding: "utf-8" }),
    });
    const errText = await res.text();
    if (!res.ok) {
      throw new Error(`Failed to create blob (${label}): ${res.status} ${errText}`);
    }
    let data: { sha?: string };
    try {
      data = JSON.parse(errText) as { sha: string };
    } catch {
      throw new Error(`Failed to create blob (${label}): unexpected response`);
    }
    if (!data.sha) throw new Error(`Failed to create blob (${label}): no sha in response`);
    return data.sha;
  };

  const pagesBlob = await createBlob(pagesJson, "pages.json");
  const globalBlob = await createBlob(globalJson, "global.json");

  // Create tree with new files
  const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: [
        { path: `${contentDir}/pages.json`, mode: "100644", type: "blob", sha: pagesBlob },
        { path: `${contentDir}/global.json`, mode: "100644", type: "blob", sha: globalBlob },
      ],
    }),
  });
  if (!treeRes.ok) {
    const err = await treeRes.text();
    throw new Error(`Failed to create tree: ${treeRes.status} ${err}`);
  }
  const { sha: newTreeSha } = (await treeRes.json()) as { sha: string };

  // Get current ref for branch (in case it already existed)
  const refRes2 = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`,
    { headers: getAuthHeaders() }
  );
  let parentSha = baseSha;
  if (refRes2.ok) {
    const refData = (await refRes2.json()) as { object: { sha: string } };
    parentSha = refData.object.sha;
  }

  // Create commit
  const commitRes2 = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `CMS publish: draft ${draftId}`,
      tree: newTreeSha,
      parents: [parentSha],
    }),
  });
  if (!commitRes2.ok) {
    const err = await commitRes2.text();
    throw new Error(`Failed to create commit: ${commitRes2.status} ${err}`);
  }
  const { sha: newCommitSha } = (await commitRes2.json()) as { sha: string };

  // Update branch ref
  const updateRefRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`,
    {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommitSha, force: true }),
    }
  );
  if (!updateRefRes.ok && updateRefRes.status !== 404) {
    const createAgain = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: newCommitSha }),
    });
    if (!createAgain.ok) {
      const err = await createAgain.text();
      throw new Error(`Failed to update ref: ${createAgain.status} ${err}`);
    }
  } else if (!updateRefRes.ok && updateRefRes.status === 404) {
    const createRefAgain = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: newCommitSha }),
    });
    if (!createRefAgain.ok) {
      const err = await createRefAgain.text();
      throw new Error(`Failed to create ref: ${createRefAgain.status} ${err}`);
    }
  }

  const previewUrl =
    process.env.VERCEL_URL && process.env.VERCEL_ENV !== "production"
      ? `https://${process.env.VERCEL_PROJECT_ID}-git-${branchName.replace(/\//g, "-")}-${process.env.VERCEL_TEAM_ID?.slice(0, 6) ?? "preview"}.vercel.app`
      : `https://${branchName.replace(/\//g, "-")}.vercel.app`;

  const vercelPreviewUrl = process.env.VERCEL_PROJECT_ID
    ? `https://${branchName.replace(/\//g, "-")}-${process.env.VERCEL_PROJECT_ID}.vercel.app`
    : previewUrl;

  await db
    .update(drafts)
    .set({
      publishedBranch: branchName,
      publishedUrl: vercelPreviewUrl,
      publishedAt: new Date(),
    })
    .where(eq(drafts.id, draftId));

  return { branch: branchName, url: vercelPreviewUrl };
}
