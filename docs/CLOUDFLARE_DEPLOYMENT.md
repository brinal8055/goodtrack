# Cloudflare Deployment Handoff

Last updated: 2026-05-26

## Short Answer

Use **Cloudflare Workers**, not a plain static **Cloudflare Pages** deployment, for the production app.

Reason: TextileTrack is a full-stack Next.js App Router application with server components, middleware, server actions, auth cookies, route handlers, and write-heavy workflows. Cloudflare's current Next.js guidance points full-stack SSR apps to Workers using the OpenNext adapter. Pages is only appropriate for static Next.js exports, and this app is not static.

Official references:

- Cloudflare Next.js Workers guide: `https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/`
- Cloudflare Pages Next.js overview: `https://developers.cloudflare.com/pages/framework-guides/nextjs/`
- Cloudflare D1 overview: `https://developers.cloudflare.com/d1/`

## Current App Status

The app currently runs correctly as a local Next.js Node app:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Important production constraint:

- Current persistence is `.data/textiletrack.json`.
- That is fine for local demos, but it is not a durable production data layer on Cloudflare.
- Before client production use on Cloudflare, move persistence to a database.

## Recommended Cloudflare Architecture

| Layer | Recommended choice | Notes |
| --- | --- | --- |
| App hosting | Cloudflare Workers + OpenNext | Supports full-stack Next.js features, including server actions and middleware. |
| Database | Cloudflare D1 for first production version | Fits the current relational workflow tables and runs close to Workers. |
| File storage | R2 only if later exports/uploads are stored | Not required for the current thin app. |
| Secrets | Cloudflare Workers secrets / build variables | Use for session secret, database binding names, and future integrations. |
| Custom domain | Workers route/custom domain | Attach after first successful deployment. |

## What To Click In Cloudflare

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages**.
3. Choose **Create application**.
4. For this app, prefer the **Workers** path for full-stack Next.js.
5. Connect the GitHub repository:
   - Repository: `brinal8055/goodtrack`
   - Branch: `main`
6. Configure build/deploy after OpenNext setup is added:
   - Build command: `npm run deploy` for direct deploy, or the Workers Builds command configured after adding OpenNext.
   - Environment variables: add production session/database secrets.
7. Add a D1 database binding after the data layer migration:
   - Suggested binding name: `DB`
   - Suggested database name: `goodtrack-prod`

## Why Not Pages Right Now

Do not choose Pages with the static Next.js preset for this current app.

Pages static export expects a static build output such as `out`. TextileTrack needs server runtime behavior for login, role checks, server actions, billing/payment writes, reports, CSV routes, and alerts. A static export would remove or break those workflows.

Pages can still be useful later only if we build a separate read-only marketing or demo site.

## Production Migration Checklist

1. Add OpenNext Cloudflare adapter and Wrangler config.
2. Replace local JSON persistence with D1-backed queries/mutations.
3. Create SQL schema for users, dealers, lots, lot stage updates, godowns, process templates, bills, alerts, activity logs, and settings.
4. Add migration/seed scripts for demo and production data.
5. Move session secret to Cloudflare secrets.
6. Run `npm run preview` in the Workers runtime before first deploy.
7. Deploy to Workers.
8. Smoke test login, lot creation, godown move, stage completion, invoice creation, payment update, reports, CSV export, and role blocks.
9. Add custom domain after the smoke test passes.

## GitHub Repo Setup

Remote:

```bash
git remote add origin git@github.com:brinal8055/goodtrack.git
git branch -M main
git push -u origin main
```

Suggested GitHub repository description:

```text
TextileTrack: role-based textile goods tracking from material inward through godown, processing, dispatch, billing, reports, and alerts. Built with Next.js for a Cloudflare Workers + D1 production path.
```

Suggested repository topics:

```text
nextjs, react, typescript, textile, production-tracking, cloudflare-workers, d1
```
