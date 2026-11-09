# Front-end E2E suite (Playwright)

Browser tests that exercise the real Next.js app against a real backend and
MongoDB. The goal is a safety net that catches regressions on **every panel and
every route** whenever a feature lands.

## Prerequisites

| Service | Command | Port |
|---|---|---|
| MongoDB | `mongod` (already running locally) | 27017 |
| Backend | `cd back && deno task bc-dev` | 1370 |
| Frontend | `cd front && pnpm dev` | 3000 |

Playwright can boot the frontend itself (`webServer` in `playwright.config.ts`)
and the backend too:

```bash
E2E_START_BACKEND=1 pnpm test:e2e
```

## Running

```bash
cd front

pnpm test:e2e              # whole suite (setup project + chromium)
pnpm test:e2e:ui           # interactive UI mode
pnpm test:e2e:headed       # watch it happen
pnpm test:e2e:report       # open the last HTML report
```

Useful filters:

```bash
npx playwright test e2e/specs/unit-head-pending-approvals.spec.ts
npx playwright test --grep "pending approvals"
npx playwright test --project=chromium --workers=4
```

### Browsers

`pnpm test:e2e:install` downloads the bundled Chromium. If the environment
cannot download browsers, point Playwright at an installed Chrome:

```bash
PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e
```

### Mutating tests

`specs/purchasing-lifecycle.spec.ts` writes to the database (it creates a Draft
and approves a pending request). It is skipped unless explicitly enabled:

```bash
E2E_ALLOW_MUTATIONS=1 pnpm test:e2e
```

Reseed the fixture data afterwards (from the repo root):

```bash
python3 ignore-scripts/_run_e2e.py --base-url http://127.0.0.1:1370
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | App under test |
| `E2E_BACKEND_URL` | `http://localhost:1370` | Lesan API used for fixtures/cross-checks |
| `E2E_START_BACKEND` | unset | `1` boots the Deno backend via `webServer` |
| `E2E_ALLOW_MUTATIONS` | unset | `1` enables write-path specs |
| `E2E_WORKERS` | `1` | Parallelism (keep at 1 for the shared DB) |
| `PLAYWRIGHT_CHANNEL` | unset | e.g. `chrome` to use an installed browser |
| `E2E_VIDEO` | unset | `1` records video (needs the ffmpeg binary) |

## How authentication works

`setup/auth.setup.ts` signs each persona in **through the backend API**, picks
the exact role to activate, and writes `e2e/.auth/<persona>.json`
(storage state) plus `<persona>.meta.json` (roles + feature flags).

Specs then declare who they are:

```ts
test.use({ storageState: storageStateFor("unitHeadWarehouse") })
```

The real login form is still covered end-to-end in `specs/auth.spec.ts`.

Seed accounts (all use `password123`, see `support/personas.ts`):

| Persona | Email | Role |
|---|---|---|
| `manager` | `admin@lesansatek.com` | Manager |
| `orgHead` | `orghead.a@lesansatek.com` | OrgHead (سازمان آلفا) |
| `unitHeadWarehouse` | `wh.a@lesansatek.com` | UnitHead (انبار مرکزی آلفا) |
| `unitHeadFinance` | `fin.a@lesansatek.com` | UnitHead (واحد مالی آلفا) |
| `storeHead` | `store.a@lesansatek.com` | StoreHead |
| `employee` | `lab.a@lesansatek.com` | Employee (آزمایشگاه آلفا) |

## Layout

```
e2e/
├── setup/auth.setup.ts          # one storage state per persona
├── support/
│   ├── personas.ts              # seed accounts + panels
│   ├── api.ts                   # Lesan RPC client, storage state, queue helpers
│   ├── page-health.ts           # crash detection + "wait for settled content"
│   ├── domain.ts                # Persian numbers, entity counts, table lookup
│   ├── a11y.ts                  # finds form controls with no accessible name
│   └── new-request-form.ts      # selectors for the new-request form
└── specs/
    ├── auth.spec.ts                     # login / logout / guards
    ├── navigation-smoke.spec.ts         # crawls every sidebar route per persona
    ├── unit-head-pending-approvals.spec.ts  # regression: "در انتظار تأیید"
    ├── admin-master-data.spec.ts        # every admin catalogue: list/search/create/edit
    ├── accounting.spec.ts               # accounts, journals, periods, reports
    ├── inventory.spec.ts                # stock, adjustments, transfers, movements
    ├── procurement.spec.ts              # requests → tenders → receipts → payments
    ├── budget.spec.ts                   # fiscal years, budget lines, reports
    ├── panels.spec.ts                   # admin / orghead / storehead / employee data
    ├── a11y-forms.spec.ts               # every create-form control has a name
    ├── purchasing-lifecycle.spec.ts     # create draft → approve (opt-in)
    └── ui-shell.spec.ts                 # RTL, active nav, palette, mobile drawer
```

## What the domain suites assert

Breadth comes from `navigation-smoke` (every sidebar route renders). The domain
suites add the arithmetic and the cross-view consistency that a smoke test
cannot see:

| Suite | Key invariants |
|---|---|
| `admin-master-data` | list count agrees with rendered cards; search reaches the URL and filters; edit forms arrive prefilled; delete asks first |
| `accounting` | every journal entry balances (debit === credit); entry totals equal the sum of their lines; trial balance grand total balances and equals the sum of leaf accounts; quick ranges resolve to the **Jalali** month; non-finance units are denied |
| `inventory` | received = accepted + rejected per receipt line; consumption of N units leaves a −N movement; a unit with no stock shows the empty state instead of another unit's rows |
| `procurement` | every tender lists its offers; every receipt has line items; receipts and payment orders are 1:1; store-head counters match the rows below them |
| `budget` | remaining = allocated − committed − consumed per line; summaries equal the sum of lines; utilisation stays within 0–100% |

## Conventions

- **Prefer role/label selectors** (`getByRole`, `getByLabel`) over CSS.
- **Never hard-code record ids** — fetch them from the API helpers so the suite
  survives reseeding.
- **Cross-check the UI against the API** where it matters (e.g. the pending list
  length must equal `pendingApprovalCount`); that is how the empty-queue bug was
  caught.
- **Use `waitForMainText`** before asserting on streamed server components;
  `loading.tsx` skeletons render an empty `<main>`.
- **Use `waitForStableMain`** on client-fetched pages (dashboards, the unit-head
  finance pages). They render KPI cards full of zeroes before the `useEffect`
  request resolves, so a naive read sees `0` where the real value is 319,600,000.
- **Use `expectHealthyPage`** at the end of a flow: it fails on uncaught
  exceptions, error boundaries, and fatal console errors.
- A new sidebar entry is crawled automatically — no test needs to be added for
  it, but its page must render real content.

## Known issues surfaced by this suite

1. `FormLabel`/`FormControl` pointed `htmlFor` at the wrapper `<div>`, so no form
   control had an accessible name (fixed: the id now lands on the control).
2. The command palette filtered on the route href only, so it was unsearchable
   by its Persian label (fixed).
3. Panel root links stayed highlighted on every child route (fixed).
4. Backend error messages are surfaced verbatim and are English
   (e.g. `Your password is incorrect!`) — the login form shows English text in
   an otherwise Persian UI. Not fixed; needs a message map.
5. The location picker's longitude/latitude inputs and the role editor on
   `/orghead/users/add` used raw `<label>` + `<input>`/`<select>` without
   `htmlFor`/`id` (fixed — guarded by `specs/a11y-forms.spec.ts`).
6. The accounting search box had a placeholder but no accessible name
   (`AccountingFilters` never passed `ariaLabel`) — fixed.
7. The accounting "این ماه / ماه گذشته / امسال" quick ranges were computed with
   **Gregorian** month boundaries in an entirely Jalali product, so an entry on
   ۴ آبان fell outside "this month". Fixed: `monthBounds`/`startOfYearIso` now
   use `date-fns-jalali` (guarded by `specs/accounting.spec.ts`).
8. `tender.count` granted only Manager/Admin while `tender.gets` granted every
   role, so the store-head tender page rendered its KPI cards as 0 above two
   real rows. Fixed: `count` now uses the same roles **and** the same
   `tenderReadMatch` scope as `gets`.
9. `/storehead/tenders` passed `activeRoleId: ""` to every API call instead of
   reading the cookie — fixed (the backend rejects an empty role).
10. **Still open:** roughly 40 other hand-rolled `<label>` elements (dialogs for
    inventory adjust/transfer, tender creation, process relations, org settings,
    step approval) are not bound to their control. They live inside modals, which
    `a11y-forms.spec.ts` does not crawl yet. Worth a dedicated sweep.
