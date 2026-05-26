# TextileTrack Project Context

Last updated: 2026-05-26

## Purpose

TextileTrack is a role-based textile production tracking system for following goods from material inward entry through godown storage, dyeing/processing, dispatch, billing, and completion.

Primary requirements source:

- `/Users/brinalsavsaviya/Downloads/textile-track-dev-prompt.md`

Current project location after repo move:

- `/Users/brinalsavsaviya/Documents/Code/AI/goodtrack`
- Compatibility symlink: `/Users/brinalsavsaviya/Documents/goodtrack` -> `/Users/brinalsavsaviya/Documents/Code/AI/goodtrack`

## Current Technical Baseline

- Framework: Next.js App Router with React and TypeScript
- Styling: project CSS variables and utility classes in `src/styles/globals.css`
- Motion: Framer Motion for page/card transitions and dashboard bars
- Icons: Lucide React
- Toasts: Sonner
- Persistence: local JSON seed store at `.data/textiletrack.json`
- Auth: signed HTTP-only cookie session with 8-hour TTL
- Authorization: middleware route checks plus server-side page guards

The local JSON store intentionally mirrors the requested entities so workflows can be built and tested before swapping to PostgreSQL/Prisma.

## Demo Accounts

All seeded demo users use password `password123`.

| Role | Email | Home |
| --- | --- | --- |
| Admin | `admin@textiletrack.test` | `/dashboard` |
| Entry Operator | `entry@textiletrack.test` | `/lots/new` |
| Godown | `godown@textiletrack.test` | `/godown` |
| Processing | `process@textiletrack.test` | `/process-queue` |
| Billing | `billing@textiletrack.test` | `/billing` |

## Phase Tracker

### Phase 1: Foundation and Read-Only Factory View

Status: Completed.

Delivered:

- Project scaffold, TypeScript, lint, build config
- Typed domain models for Dealer, ProcessTemplate, Lot, LotStageUpdate, Godown, Bill, User, Alert, ActivityLog, Settings
- Seeded demo data for all roles and core factory entities
- Login flow with server-side role resolution
- Signed session cookie and logout
- Middleware route protection with real 403 for blocked roles
- Protected app shell with sidebar, topbar, global search placeholder, alert badge
- Admin dashboard with metrics, recent lots, workload bars, dealer pending, alerts, activity feed
- Read-only lots list
- Read-only lot detail page with process timeline and summary panel
- Responsive baseline and design tokens from the requirements

Verified:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Browser login to `/dashboard`
- Browser lot detail render at `/lots/lot-1024`
- Browser role block: `ENTRY_OPERATOR` opening `/dashboard` returns 403

### Phase 2: Core Workflow CRUD

Status: Completed for the thin end-to-end production path.

Scope:

- Dealer list, add form, detail summary/lots view
- Entry Operator inline access to add a missing dealer from material inward
- Godown overview and godown detail inventory
- Process template list and basic builder/edit form
- Material inward form with validation and lot number generation
- Lot create flow with first stage update, activity log, and new-lot alert
- Godown move-to-process action
- Processing queue
- Stage start/complete form and status transitions
- Role-specific action buttons on lot detail for godown and processing roles

Success criteria:

- A new lot can be created by Entry Operator or Admin
- Godown team or Admin can move that lot to process
- Processing team or Admin can start and complete active stages
- Timeline and audit feed update after each action
- Lot reaches `READY_FOR_DISPATCH` after final processing stage
- Route permissions stay enforced for all roles

Verification run:

- Created `LOT-1029` through the actual material inward server action
- Moved `LOT-1029` from godown to process through the actual move server action
- Started and completed Dyeing, Drying, Finishing, and Packing through the actual stage-update server action
- Verified `LOT-1029` reached `READY_FOR_DISPATCH`
- Created dealer `Phase Two Textiles` through the dealer server action
- Created process template `Phase Two Template` through the template server action
- Verified Entry Operator can open `/lots/new` and `/dealers/new?returnTo=/lots/new`
- Verified Entry Operator still receives 403 for `/dealers`

Deferred from this phase:

- Full drag-and-drop process template builder
- Godown add/edit/delete configuration UI
- Dealer edit form and true tabbed dealer detail UI
- Confirmation modal before stage updates

### Phase 3: Dispatch, Billing, Alerts, and Search

Status: Completed for the thin dispatch, billing, alert, and search path.

Scope:

- Billing dashboard and invoice detail
- Raise invoice flow
- Payment update flow
- Dispatch details and status transition
- Alert generation and alert history actions
- Global search dropdown and result navigation

Delivered:

- Billing dashboard with totals, dispatch queue, and invoice table
- Raise invoice route at `/lots/[id]/invoice` for ready/dispatched lots
- Live invoice total calculation in the invoice form
- Dispatch details captured while raising invoice
- Invoice detail route at `/billing/[id]`
- Payment update flow that recalculates paid amount, balance, and Pending/Partial/Paid status
- Lot status transition from `READY_FOR_DISPATCH` to `DISPATCHED` on pending/partial invoice
- Lot status transition to `COMPLETED` when invoice becomes paid
- Stage-completed alert generation when processing completes a stage
- Derived alerts for ready lots, stuck lots, and billing overdue records
- Alert history page with dismiss and mark-all-read actions
- Topbar global search wired to `/search`
- Search results grouped into Lots, Dealers, and Invoices, with role-aware invoice/dealer visibility

Success criteria:

- Ready lot can be invoiced and dispatched
- Pending, partial, and paid payment states recalculate balances correctly
- Alerts are generated for ready, stuck, overdue, new lot, and stage completed events
- Global search finds lots, dealers, and invoices

Verification run:

- Raised invoice `INV-2026-0004` for `LOT-1029` through the actual invoice server action
- Confirmed `LOT-1029` moved to `DISPATCHED` with `PARTIAL` payment and correct balance
- Recorded the remaining payment through the actual payment server action
- Confirmed invoice `INV-2026-0004` moved to `PAID`, balance became `0`, and `LOT-1029` moved to `COMPLETED`
- Completed `Drying` for `LOT-1024` through the actual stage update action
- Confirmed a `STAGE_COMPLETED` alert was created for `LOT-1024`
- Browser-render verified `/billing/bill-inv-2026-0004`, `/search?q=INV-2026-0004`, and `/alerts`

Deferred from this phase:

- True topbar dropdown suggestions before pressing Enter
- Billing table filters by date/dealer/status
- Modal presentation for payment update; current implementation uses an inline side-panel form
- Invoice print layout and export

### Phase 4: Reports, Settings, Users, Print and Export

Status: Completed for the thin admin operations path.

Scope:

- Reports hub and all 8 report views
- CSV export
- PDF or print-friendly report output
- Settings forms for company profile, alert thresholds, invoice format, lot format
- User management with add/edit/deactivate/reset password
- Print-friendly lot detail and invoice views

Delivered:

- Reports hub at `/reports` with all 8 required report types
- Individual report pages at `/reports/[type]`
- Date range filters on report pages
- CSV export route for each report at `/reports/[type]/csv`
- Print buttons on report pages, lot detail, and invoice detail
- Print stylesheet that removes app chrome and preserves report/detail content
- Settings form for company profile, alert thresholds, invoice numbering, and lot numbering
- User management list with inline edit, role change, active toggle, and password reset
- Add-user form with password hashing and role assignment
- Last-active-admin protection in the user update action

Success criteria:

- Reports honor date and entity filters
- Exports contain all visible report columns
- Settings affect generated lot and invoice numbers
- Last active admin cannot be deactivated

Verification run:

- HTTP rendered `/reports/billing-pending` with status 200
- HTTP exported `/reports/billing-pending/csv` with status 200 and expected invoice rows
- HTTP rendered `/users` and `/settings` with status 200
- Created user `phase4-smoke@textiletrack.test` through the actual add-user server action
- Saved settings through the actual settings server action
- Verified build route generation includes `/reports/[type]` and `/reports/[type]/csv`

Deferred from this phase:

- PDF generation as a first-class file export; current path uses browser print-to-PDF
- Advanced report-specific filters beyond date range
- Dedicated user edit pages; current implementation is inline on `/users`

### Phase 5: Full Lifecycle QA and Polish

Status: Pending.

Scope:

- Desktop, tablet, and mobile browser QA
- Empty/loading states across all list and data screens
- Animation pass with reduced-motion checks
- Full lifecycle end-to-end run
- Requirements checklist review

Success criteria:

- Complete run: Entry -> Godown -> Process -> Ready -> Dispatch -> Billing -> Completed
- No known route, permission, or status-transition regressions
- All 23 screens have useful production UI, not placeholders

## Current Feature Run Matrix

| Feature | Current state | E2E status | Notes |
| --- | --- | --- | --- |
| Login/logout | Implemented | Passed | Role-based home redirect works. |
| Role protection | Implemented | Passed | Middleware returns real 403 for blocked role access. |
| Admin dashboard | Implemented | Passed | Uses seeded local store and dashboard calculations. |
| Lot list | Implemented | Passed | Search/filter/pagination still pending. |
| Lot detail timeline | Implemented with workflow actions | Passed | Billing invoice action now appears for Admin/Billing on ready/dispatched lots. |
| Material inward | Implemented | Passed | Created `LOT-1029`; inline add dealer link available. |
| Godown workflow | Implemented | Passed | Overview/detail and move-to-process action done. |
| Processing queue | Implemented | Passed | Start/complete flow advances stages. |
| Templates | Basic builder implemented | Passed | Drag-to-reorder deferred. |
| Dealers | List/new/detail implemented | Passed | Edit/delete and richer tabs deferred. |
| Billing | Dashboard, invoice create/detail, payment update implemented | Passed | `LOT-1029` invoiced and paid in Phase 3 smoke. Filters/print deferred. |
| Alerts | Generation and history actions implemented | Passed | Ready, stuck, overdue, new lot, and stage completed alert paths present. |
| Reports | Hub, 8 report views, date filters, CSV export implemented | Passed | PDF is available through browser print, not a generated file. |
| Settings | Company/profile/threshold/numbering form implemented | Passed | Saved through actual server action. |
| User management | List, add, inline edit, deactivate, reset password implemented | Passed | Last active admin protection in server action. |
| Print/export | Print buttons and report CSV implemented | Passed | Lot, invoice, and report pages use print stylesheet. |
| Global search | `/search` results implemented | Passed | Topbar submits to grouped results; dropdown suggestions deferred. |

## Known Issues and Constraints

- Global search uses a full results page; topbar dropdown suggestions are still pending.
- Dashboard refresh is not polling yet.
- Report PDF export is currently handled via browser print-to-PDF, not a direct generated PDF file.
- `.data/textiletrack.json` may contain local smoke-test records such as `LOT-1029`, `Phase Two Textiles`, and `Phase Two Template`.
- `npm audit` could not be run because registry access would send dependency metadata externally and was blocked by policy.
- Next.js dev overlay may show stale chunk errors if `next build` runs while `next dev` is still running. Stop and restart the dev server after production builds.
- Local JSON persistence is suitable for development only. On Cloudflare Workers, the app uses in-memory seeded demo data if file writes are unavailable; D1 remains the production hardening step.

## Verification Commands

Run from project root:

```bash
npm run lint
npm run typecheck
npm run build
npm run dev
```

Browser smoke flow:

1. Open `/login`.
2. Log in as `admin@textiletrack.test` with `password123`.
3. Confirm redirect to `/dashboard`.
4. Open `/lots`.
5. Open `/lots/lot-1024`.
6. Confirm timeline renders the current seeded lot stages and right-side action panel without errors.
7. Sign out.
8. Log in as `entry@textiletrack.test`.
9. Confirm redirect to `/lots/new`.
10. Open `/dashboard` directly and confirm 403.

## Latest Verification Run

Run date: 2026-05-26, after native dashboard scroll fix and Phase 4 thin implementation

Automated checks:

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run build`: passed

Browser and HTTP checks:

- Admin login to dashboard: passed
- Dashboard panels visible: passed
- Lots list visible with seeded lots: passed
- Lot detail timeline for `LOT-1024`: passed
- Entry Operator access to `/lots/new`: passed with HTTP 200
- Entry Operator direct access to `/dashboard`: blocked with HTTP 403
- Actual server-action material inward create: passed with `LOT-1029`
- Actual server-action godown move-to-process: passed
- Actual server-action processing start/complete through final processing stage: passed
- Actual server-action dealer create: passed
- Actual server-action template create: passed
- Entry Operator access to inline dealer creation route: passed with HTTP 200
- Entry Operator access to dealer management route: blocked with HTTP 403
- Actual server-action invoice create for `LOT-1029`: passed with invoice `INV-2026-0004`
- Invoice partial payment calculation: passed with total `10858`, paid `5000`, and `LOT-1029` set to `DISPATCHED`
- Actual server-action payment update for `INV-2026-0004`: passed with paid amount `10858`, balance `0`, payment status `PAID`, and `LOT-1029` set to `COMPLETED`
- Actual server-action stage completion for `LOT-1024`: passed and generated `STAGE_COMPLETED` alert
- Browser render for `/billing/bill-inv-2026-0004`: passed
- Browser render for `/search?q=INV-2026-0004`: passed
- Browser render for `/alerts`: passed
- Dashboard native scroll fix: passed in browser. Root cause was `overflow: hidden` on the app shell and document, leaving only a nested `.page-content` scroll area. Fix removed the forced hidden overflow from the shell/content wrappers and made the topbar sticky. Verification: `/dashboard` document height exceeded viewport height, wheel scroll moved `window.scrollY` to `900`, and topbar stayed pinned at `y=0`.
- HTTP render for `/reports/billing-pending`: passed with HTTP 200
- HTTP CSV export for `/reports/billing-pending/csv`: passed with HTTP 200 and expected rows
- HTTP render for `/users`: passed with HTTP 200
- HTTP render for `/settings`: passed with HTTP 200
- Actual server-action user create: passed with `phase4-smoke@textiletrack.test`
- Actual server-action settings save: passed and recorded settings activity

Notes:

- The in-app browser automation could not type alternate login credentials because its virtual clipboard was unavailable. The role guard itself was verified through a signed-session localhost HTTP check.
- No code defects were found in the implemented Phase 3 surface during this pass.

## Continuation Notes for Codex

- Read this file first when resuming TextileTrack work.
- Treat the requirements prompt as the source of truth and this document as the current implementation ledger.
- Keep changes phase-scoped and update this file after each completed phase.
- Prefer completing a thin end-to-end workflow over building isolated screens with no data path.
- Keep server-side role checks in middleware and page-level guards.
- Preserve the seeded data shape until a database migration is introduced.
