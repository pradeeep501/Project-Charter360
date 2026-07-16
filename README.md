# Project Charter Builder

A RACI-style **project charter tool**. Start from a goal and a target date, let AI
generate the tasks, owners, and RACI assignments, drag rows to reorder, then copy
the whole thing into Outlook.

- **AI generate on every field** — a ✨ button drafts objective, scope, success
  criteria, task descriptions, and RACI (Responsible / Accountable / Consulted /
  Informed). One big button generates the whole charter from the goal + date.
- **RACI table** with a team roster that autocompletes into the R/A/C/I columns.
- **Drag-and-drop** to reorder tasks (⠿ handle).
- **Outlook export** — copy a formatted rich table (paste into an email or Word),
  open a pre-filled email draft, or download a `.csv` for Excel.
- **Storage** — Supabase when configured, otherwise your browser (localStorage).

Built with Next.js (App Router) + React, deployable on Vercel.

---

## Run locally

```bash
npm install
cp .env.local.example .env.local   # optional: fill in keys
npm run dev
```

Open http://localhost:3000. **It works with zero configuration** — no API key and
no database required. In that mode AI uses a built-in mock generator and charters
save to your browser.

## Turn on real AI (Claude)

1. Get a key at [console.anthropic.com](https://console.anthropic.com).
2. Put it in `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
The key lives **server-side only** (used in `src/app/api/generate/route.js`) and is
never sent to the browser. Default model: `claude-opus-4-8`.

## Turn on cloud storage (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

> The starter RLS policy is open (anyone with the anon key can read/write). Tighten
> it before storing anything sensitive.

---

## Deploy to Vercel via GitHub

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Project charter builder"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Vercel auto-detects Next.js; no build settings needed.
3. In the project’s **Settings → Environment Variables**, add the same keys as
   `.env.local` (`ANTHROPIC_API_KEY`, and the Supabase vars if you use them).
4. **Deploy.** Every push to `main` redeploys automatically.

---

## How it works

| Piece | File |
|---|---|
| AI route (Claude, structured JSON, mock fallback) | `src/app/api/generate/route.js` |
| Storage abstraction (Supabase ↔ localStorage) | `src/lib/store.js` |
| Outlook / Excel export helpers | `src/lib/export.js` |
| Charter editor UI | `src/components/CharterEditor.jsx` |
| Drag-and-drop RACI task table | `src/components/TaskList.jsx` |
