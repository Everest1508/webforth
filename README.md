# Web Builder

A WordPress-like website builder built with Next.js. Users with **editor** or **admin** permissions can edit content (headings, text, images, blocks), save drafts to the database, and **publish** each draft to a new GitHub branch. Vercel deploys each branch, giving a unique preview URL per draft.

## Features

- **Permissions**: Clerk auth + role-based access (admin, editor, viewer). Only admin/editor can edit and publish.
- **Drafts**: Edits are stored in Turso (SQLite). Save as draft without touching Git.
- **Publish to branch**: "Publish" creates a new branch (e.g. `cms/preview-{draftId}`), writes `content/pages.json` and `content/global.json`, and pushes. Vercel deploys the branch.
- **Site rendering**: The live site reads from `content/*.json`. Draft preview at `/preview/[draftId]`.
- **Agent API**: `POST /api/agent/update-block` to update specific blocks in a draft by ID (for agentic AI workflows).

## Setup

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- **Clerk**: [dashboard.clerk.com](https://dashboard.clerk.com) → Create application → Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- **Turso**: Use your existing Turso DB URL and auth token (e.g. from `turso-token` or [turso.tech](https://turso.tech)).
- **GitHub**: Create a Personal Access Token (or use a GitHub App) with `repo` scope. Set `GITHUB_ACCESS_TOKEN`, `GITHUB_REPO_OWNER`, and `GITHUB_REPO_NAME` for the repo you want to push content branches to. Set `GITHUB_DEFAULT_BRANCH` (default: `main`).

### 2. Database

Push the schema to Turso:

```bash
npm run db:push
```

Seed an admin user (use the Clerk user ID from the Clerk dashboard after signing up):

```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io TURSO_AUTH_TOKEN=your-token npx tsx scripts/seed-admin.ts user_xxxx
```

### 3. Run the app

```bash
npm run dev
```

- **Public site**: [http://localhost:3000](http://localhost:3000)
- **Editor**: [http://localhost:3000/sign-in](http://localhost:3000/sign-in) → then [http://localhost:3000/dashboard](http://localhost:3000/dashboard) and [http://localhost:3000/cms](http://localhost:3000/cms)

### 4. Vercel

Connect this repo to Vercel. Enable branch deployments (default). Each publish creates a branch; Vercel will build and deploy it. The app stores a best-effort preview URL on the draft; the exact URL is also in the Vercel dashboard.

## Content model

- **Pages**: slug, title, meta description, and an ordered list of **blocks** (hero, text, cta, features, testimonials, image).
- **Global**: site name, logo URL, footer text, navigation items, optional theme.

Drafts store full site content as JSON. On publish, that JSON is written to `content/pages.json` and `content/global.json` on the new branch so the Next.js app can read it at build time.

## Agent API

`POST /api/agent/update-block` (requires editor/admin):

```json
{
  "draftId": "abc123",
  "instructions": [
    { "type": "setHeading", "blockId": "hero-1", "value": "New headline" },
    { "type": "setBody", "blockId": "text-1", "value": "New body text" }
  ]
}
```

Supported instruction types: `setHeading`, `setSubheading`, `setBody`, `setButtonLabel`, `setButtonUrl`, `setImageSrc`, `setImageAlt`. The draft is updated in the DB; the user can then click "Publish" to push to a branch.
