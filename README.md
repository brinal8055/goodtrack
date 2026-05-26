# TextileTrack

Role-based textile production tracking for material inward, godown movement, dyeing/processing, dispatch, billing, alerts, reports, settings, and users.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Demo accounts use `password123`:

| Role | Email |
| --- | --- |
| Admin | `admin@textiletrack.test` |
| Entry Operator | `entry@textiletrack.test` |
| Godown | `godown@textiletrack.test` |
| Processing | `process@textiletrack.test` |
| Billing | `billing@textiletrack.test` |

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment Notes

See [docs/CLOUDFLARE_DEPLOYMENT.md](docs/CLOUDFLARE_DEPLOYMENT.md) before deploying. This app is a full-stack Next.js app and currently uses local JSON persistence for the development demo, so the recommended Cloudflare target is Workers with OpenNext after migrating persistence to a production database such as Cloudflare D1.

## Project Context

The development ledger and phase tracker live in [docs/TEXTILETRACK_PROJECT_CONTEXT.md](docs/TEXTILETRACK_PROJECT_CONTEXT.md).
