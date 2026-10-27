# Frontend Task 02: Accounting Inside the Existing Finance Management Area

## Context

The backend now ships a complete double-entry accounting module:

- `account`, `accountingPeriod`, `costCenter`, `journalEntry`, `journalEntryLine`
- Auto-posted entries created by `goodsReceipt.add`, `consumption.add`, and `paymentOrder.markPaid`
- Reports: trial balance, general ledger, income statement
- Manual journal entry posting (`postManual`)
- Chart-of-accounts seeding (`seedDefaultChartOfAccounts`)
- Period closing (`closePeriod`)

**Product decision (already made):** accounting stays under the **same management** as budgets. Finance unit heads keep one finance area. Do **not** create a separate accounting unit, a separate role, a separate panel, or an “Accountant” role.

The accounting screens must still be a **separate information layer** inside that area: their own route group, navigation section, and pages. Do not mix journal/ledger widgets into the existing budget pages. The goal is one finance management area with two clearly separated tabs of work: **بودجه** and **حسابداری**.

The backend is authoritative for security. The frontend only hides/disables controls; it must never filter data for security or retry a denied request with different IDs.

## Preflight Reading

Read these before editing:

Backend (already implemented, do not change):

- `back/models/account.ts`, `accountingPeriod.ts`, `costCenter.ts`, `journalEntry.ts`, `journalEntryLine.ts`
- `back/utils/accountingScope.ts`, `back/utils/financeScope.ts`, `back/utils/accountingEngine.ts`
- `back/src/account/**`, `back/src/accountingPeriod/**`, `back/src/costCenter/**`, `back/src/journalEntry/**`, `back/src/journalEntryLine/**`

Frontend:

- `front/src/types/declarations/selectInp.ts` (accounting models and actions are already generated)
- `front/src/app/admin/fiscal-years/**` and `front/src/app/admin/budget-lines/**` for list/form/table conventions
- `front/src/app/unit-head/finance/**` for the finance area layout and dashboard
- `front/src/lib/nav-config.ts`, `front/src/lib/roles.ts`, `front/src/components/auth/panel-guard.tsx`
- `front/src/components/layout/sidebar-nav.tsx`, `mobile-nav-drawer.tsx`, `command-search.tsx`
- `front/src/components/ui/*` (`PageHeader`, `DataTable`, `Pagination`, `SearchField`, `FilterSelect`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `StatusBadge`, `StatCard`, `NavCard`, `JalaliDatePicker`)
- `front/src/components/form/form-jalali-date-picker.tsx`, `front/src/lib/jalali-date-lib.ts`
- `front/AGENTS.md` and `.agents/THEME/DESIGN.md`

Do not hand-edit `src/types/declarations/selectInp.ts`. The user has already synced the new declarations.

## Goals

1. A Finance UnitHead can do everything their features allow from the existing UnitHead finance area: view accounts, entries, periods, cost centers; post manual entries; close periods; run reports.
2. Manager/Admin/OrgHead can do the same from the Admin panel, scoped by the backend to the selected organization.
3. The accounting area is visually and navigationally distinct from budget pages, without adding a new panel or role.
4. Feature and scope behavior in the UI mirrors the backend, including unit-level features on the active role’s unit.

## Non-Goals

- No backend edits.
- No new accounting unit type, no new role, no new panel id, no “Accountant” role.
- No journal entry editing/deleting/reversal UI. Entries are immutable; only `postManual` creates manual entries.
- No direct browser fetch to the backend; all calls go through Server Actions.
- No accounting controls mixed into budget pages or the budget dashboard.
- No multi-language work; Persian/RTL only.

## Access Model You Must Match

Backend rules:

- Manager / Admin bypass scope and features.
- OrgHead: whole own organization.
- UnitHead: only when the scoped unit’s `type === "Finance"`. They can read/write accounting for the **whole organization** that unit belongs to.
- Employee: can read and post manual entries only if the relevant feature is present.
- Features can live on the **user** or on the **unit** the active role points at.

| Capability | Manager/Admin | OrgHead | Finance UnitHead | Employee |
|---|---|---|---|---|
| View accounting | yes | own org | own org | `canViewAccounting` |
| Manage accounts / periods / cost centers | yes | own org | own org | no |
| Post manual journal entry | yes | own org | own org | `canPostManualJournalEntry` |
| Close accounting period | yes | own org | own org | no |

Features:

- `canViewAccounting` — read pages, nav visibility
- `canManageAccounting` — account/period/cost-center mutations, seeding the chart of accounts
- `canCloseAccountingPeriod` — close-period action
- `canPostManualJournalEntry` — manual entry page

### Critical frontend gap you must fix first

Today the frontend resolves features only from `user.features`:

- `src/lib/roles.ts` (`getAccessiblePanels`, `getDefaultPanel`)
- `src/components/auth/panel-guard.tsx`
- `src/components/layout/sidebar-nav.tsx`
- `src/components/layout/mobile-nav-drawer.tsx`
- `src/components/layout/command-search.tsx`

The backend also honors features attached to the active role’s unit. A Finance UnitHead whose `canViewAccounting` is set on the unit will currently get a hidden nav and a redirect loop.

Required fix:

1. Extend the `getMe` projection in `src/app/actions/auth/getMe.ts` to return:
   ```ts
   units: {
     _id: 1,
     name: 1,
     type: 1,
     organization: { _id: 1 },
     features: 1,
   }
   ```
   Keep `features: 1` and `roles: 1`.

2. Add `src/lib/features.ts`:
   ```ts
   getEffectiveFeatures(user, activeRoleId): string[]
   ```
   Mirror the backend:
   - start with `user.features`
   - resolve `role = user.roles.find(r => r.roleId === activeRoleId)`
   - if `role.scopeType === "unit"`, add features of `user.units.find(u => u._id === role.scopeId)`
   - if `role.scopeType === "organization"`, add features of every `user.units` entry whose `organization._id === role.scopeId`
   - Manager/Admin are treated as privileged by existing code; keep that behavior.
   - return unique feature names.

3. Use this helper in `PanelGuard`, `getAccessiblePanels`, `getDefaultPanel`, sidebar/mobile nav, and command search. Include `activeRoleId` in dependency arrays and cache keys; refetch after a role switch.

4. Update `src/app/unit-head/finance/layout.tsx`: its `PanelGuard` currently requires only budget features. Add `canViewAccounting` to the accepted list (`requiredFeatures` is “any of”), so an accounting-only finance head is not blocked by the budget guard.

5. Add a small `src/lib/accounting-access.ts` with helpers used by pages/components:
   ```ts
   canViewAccounting(features)
   canManageAccounting(features)
   canCloseAccountingPeriod(features)
   canPostManualJournalEntry(features)
   ```
   Super roles are handled by `PanelGuard`/nav already; the helpers are for buttons and actions.

## Server Actions to Add

Follow `front/AGENTS.md` exactly: `"use server"`, `getToken()`, `getActiveRoleId()`, `AppApi`, `activeRoleId` merged into `set`, standard error shape `{ success: false, body: { message } }`.

### `src/app/actions/account/`

| File | Action | Set fields | Response |
|---|---|---|---|
| `add.ts` | `account.add` | `code, name, enName?, description?, accountType, normalBalance, systemKey?, level?, isPostable?, isActive?, isSystem?, organizationId, parentAccountId?` | array `[account]` |
| `get.ts` | `account.get` | `_id` | array `[account]` |
| `gets.ts` | `account.gets` | `organizationId?, page, limit, skip?, sortBy?, sortOrder?, code?, name?, accountType?, systemKey?, isActive?, parentAccountId?` | array |
| `update.ts` | `account.update` | `_id` + any pure fields | array |
| `remove.ts` | `account.remove` | `_id, hardCascade?` | `{ success }` |
| `count.ts` | `account.count` | same filters as `gets` | `{ count }` |
| `seedDefaultChartOfAccounts.ts` | `account.seedDefaultChartOfAccounts` | `organizationId` | `{ success }` |

### `src/app/actions/accountingPeriod/`

| File | Action | Set fields | Response |
|---|---|---|---|
| `add.ts` | `accountingPeriod.add` | `code, name, startDate, endDate, status?, organizationId, fiscalYearId?` | array |
| `get.ts` | `accountingPeriod.get` | `_id` | array |
| `gets.ts` | `accountingPeriod.gets` | `organizationId?, code?, status?, startDate?, endDate?, page, limit, sortBy?, sortOrder?` | array |
| `update.ts` | `accountingPeriod.update` | `_id, name?, startDate?, endDate?` | array |
| `remove.ts` | `accountingPeriod.remove` | `_id, hardCascade?` | `{ success }` |
| `count.ts` | `accountingPeriod.count` | same filters as `gets` | `{ count }` |
| `closePeriod.ts` | `accountingPeriod.closePeriod` | `_id` **only** (no `organizationId`) | array |

`status` is not updatable through `update`; only `closePeriod` closes a period.

### `src/app/actions/costCenter/`

| File | Action | Set fields | Response |
|---|---|---|---|
| `add.ts` | `costCenter.add` | `code, name, description?, type?, isActive?, organizationId, unitId?, responsibleUserId?` | array |
| `get.ts` | `costCenter.get` | `_id` | array |
| `gets.ts` | `costCenter.gets` | `organizationId?, code?, name?, type?, isActive?, unitId?, page, limit, sortBy?, sortOrder?` | array |
| `update.ts` | `costCenter.update` | `_id` + pure fields | array |
| `remove.ts` | `costCenter.remove` | `_id, hardCascade?` | `{ success }` |
| `count.ts` | `costCenter.count` | same filters | `{ count }` |

### `src/app/actions/journalEntry/`

| File | Action | Set fields | Response |
|---|---|---|---|
| `get.ts` | `journalEntry.get` | `_id` **only** | array `[entry]` |
| `gets.ts` | `journalEntry.gets` | `organizationId?, entryNumber?, sourceType?, status?, periodId?, startDate?, endDate?, page, limit, sortBy?, sortOrder?` | array |
| `count.ts` | `journalEntry.count` | same filters minus pagination | `{ count }` |
| `postManual.ts` | `journalEntry.postManual` | `organizationId, entryDate?, description?, reference?, idempotencyKey?, lines[]` | **array** `[entry]` |
| `getTrialBalance.ts` | `journalEntry.getTrialBalance` | `organizationId?, periodId?, startDate?, endDate?` | object (see Reports) |
| `getGeneralLedger.ts` | `journalEntry.getGeneralLedger` | `accountId, periodId?, startDate?, endDate?` **only** (no `organizationId`) | object (see Reports) |
| `getIncomeStatement.ts` | `journalEntry.getIncomeStatement` | `organizationId?, periodId?, startDate?, endDate?` | object (see Reports) |

Manual line fields: `accountId?`, `systemKey?`, `description?`, `debit?`, `credit?`, `costCenterId?`, `unitId?`, `storeId?`.

### `src/app/actions/journalEntryLine/`

| File | Action | Set fields | Response |
|---|---|---|---|
| `get.ts` | `journalEntryLine.get` | `_id` | array |
| `gets.ts` | `journalEntryLine.gets` | `organizationId?, journalEntryId?, accountId?, costCenterId?, storeId?, periodId?, startDate?, endDate?, page, limit, sortBy?, sortOrder?` | array |
| `count.ts` | `journalEntryLine.count` | same filters | `{ count }` |

Journal entry lines are read-only. Do not add add/update/remove actions or UI.

## Report Response Contracts

`getTrialBalance`:

```ts
{
  accounts: {
    accountId: string; code: string; name: string;
    accountType: string; normalBalance: string;
    debit: number; credit: number; balance: number;
  }[];
  totals: { debit: number; credit: number; difference: number };
}
```

`getGeneralLedger`:

```ts
{
  account: { _id: string; code: string; name: string; accountType: string; normalBalance: string };
  openingBalance: number;
  lines: {
    _id: string; lineNumber: number; description: string | null;
    debit: number; credit: number; runningBalance: number;
    entryId: string | null; entryNumber: string | null; entryDate: string | null;
    costCenterId: string | null; costCenterName: string | null;
    storeId: string | null; storeName: string | null;
  }[];
  totals: { debit: number; credit: number };
  closingBalance: number;
}
```

`getIncomeStatement`:

```ts
{
  revenue: { accountId: string; code: string; name: string; accountType: string; debit: number; credit: number; amount: number }[];
  expenses: { accountId: string; code: string; name: string; accountType: string; debit: number; credit: number; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}
```

## Routes

Use the existing finance area; do not add a panel or role.

### Admin (`/admin/accounting/**`)

| Route | Page | Persian title |
|---|---|---|
| `/admin/accounting` | Accounting dashboard | داشبورد حسابداری |
| `/admin/accounting/accounts` | Chart of accounts | کدینگ حساب‌ها |
| `/admin/accounting/journal-entries` | Journal entries list | اسناد حسابداری |
| `/admin/accounting/journal-entries/new` | Manual entry | ثبت سند دستی |
| `/admin/accounting/journal-entries/[id]` | Entry detail | جزئیات سند |
| `/admin/accounting/periods` | Accounting periods | دوره‌های حسابداری |
| `/admin/accounting/cost-centers` | Cost centers | مراکز هزینه |
| `/admin/accounting/reports/trial-balance` | Trial balance | تراز آزمایشی |
| `/admin/accounting/reports/general-ledger` | General ledger | دفتر کل |
| `/admin/accounting/reports/income-statement` | Income statement | صورت سود و زیان |

### UnitHead (`/unit-head/finance/accounting/**`)

Same ten screens with the same titles, under the existing finance layout. Reuse the shared components; only route files and base links differ.

### Organization context

- Admin/OrgHead: read accessible organizations with `getOrganizations`. Show an organization selector at the top of accounting pages. Persist selection in `?organizationId=`. Default to the first accessible organization; if the query value is not in the accessible list, fall back to the first.
- UnitHead: derive the organization from `getMe` → the unit matching the active role’s `scopeId` → `organization._id`. Do not show a selector.
- Always pass `organizationId` to account, period, cost-center, journal-entry list/detail-surrounding, and report calls **except** the three actions that reject it: `journalEntry.get`, `journalEntry.getGeneralLedger`, `accountingPeriod.closePeriod`.
- Do not cache accounting lists across organization or active-role changes; include both IDs in keys and reset selection on change.

## Navigation and Breadcrumbs

Add a dedicated nav **section**, not a new panel:

- Admin panel: new section «حسابداری» after «مالی و بودجه»:
  - داشبورد حسابداری (`/admin/accounting`, `BookOpen`)
  - کدینگ حساب‌ها (`/admin/accounting/accounts`, `ListTree`)
  - اسناد حسابداری (`/admin/accounting/journal-entries`, `BookText`)
  - دوره‌های حسابداری (`/admin/accounting/periods`, `CalendarRange`)
  - مراکز هزینه (`/admin/accounting/cost-centers`, `Landmark`)
  - تراز آزمایشی (`/admin/accounting/reports/trial-balance`, `Scale`)
  - دفتر کل (`/admin/accounting/reports/general-ledger`, `Library`)
  - صورت سود و زیان (`/admin/accounting/reports/income-statement`, `FileBarChart`)
- UnitHead panel: new section «حسابداری» inside the existing finance area, same items and icons under `/unit-head/finance/accounting/**`.
- Every read item uses `requiredFeature: "canViewAccounting"`.
- Do not gate the whole finance layout on budget features only (see the layout fix above).
- Add breadcrumb labels in `src/components/layout/breadcrumbs.tsx` for: `accounting`, `accounts`, `journal-entries`, `periods`, `cost-centers`, `reports`, `trial-balance`, `general-ledger`, `income-statement`, `new`.
- Optional but preferred: add help topics for the accounting screens in `src/components/help/content/finance.ts`.

## Shared Components (`src/components/accounting/`)

Build once, use from Admin and UnitHead route files.

| Component | Responsibility |
|---|---|
| `account-select.tsx` | Searchable select of postable, active accounts scoped to the organization; groups by `accountType`; shows `code — name`. |
| `account-tree.tsx` | Parent/child tree or grouped table for the chart of accounts, with system/header badges. |
| `account-form.tsx` | RHF + Zod form for add/edit. |
| `journal-lines-editor.tsx` | Dynamic lines array: account, description, debit, credit, cost center, unit; add/remove; totals and balance indicator. |
| `journal-entry-form.tsx` | Header (Jalali date, description, reference) + lines editor + submit. |
| `journal-entry-table.tsx` | List with expandable preview of `lineSnapshot` or a details link. |
| `journal-entry-detail.tsx` | Header, status/balance badges, lines table, source link, totals. |
| `period-form.tsx`, `period-table.tsx` | Period create/edit and list with close action. |
| `cost-center-form.tsx`, `cost-center-table.tsx` | Cost center CRUD. |
| `report-filters.tsx` | Organization (admin), period, Jalali date range, account (GL), presets. |
| `trial-balance-report.tsx` | Grouped by account type; debit/credit/balance; totals and difference badge. |
| `general-ledger-report.tsx` | Opening balance, running balance, totals, closing balance. |
| `income-statement-report.tsx` | Revenue/expense sections, totals, net income. |
| `accounting-dashboard.tsx` | KPI cards, quick actions, recent entries. |
| `source-link.tsx` | Map `sourceType/sourceId` to an existing detail route when available. |
| `money.ts` | `formatRial`, `formatAmount`, `parseAmount` (fa-IR, no decimals for display). |
| `labels.ts` | Persian labels for account types, normal balances, entry status/source, period status, cost-center type, system keys. |
| `errors.ts` | Backend-message → Persian message mapping. |

### Dashboard content

- KPIs for the selected organization and current month/period: total debit, total credit, net income, posted entry count, open periods.
- Quick links: کدینگ حساب‌ها، اسناد حسابداری، تراز آزمایشی، دوره‌ها.
- Primary CTA: «ثبت سند دستی» only when `canPostManualJournalEntry`; exactly one primary CTA per viewport.
- Latest 5–10 entries with entry number, date, source, amount, status.
- If the organization has no accounts yet, show an onboarding card: «کدینگ حساب‌های پیش‌فرض را راه‌اندازی کنید» with a confirm dialog calling `seedDefaultChartOfAccounts`.

## Screen Requirements

### Chart of accounts

- Views: tree/grouped list with search and filters for type, system key, active.
- Columns/cards: code, name, type, normal balance, level, postable, system badge, active.
- Add/edit: code, name, enName (optional), description, type, normal balance, parent account, postable, active. `systemKey` is advanced: only show it in an “advanced” disclosure and lock it for non-system accounts.
- Delete: disabled for `isSystem`, accounts with children, and accounts with journal lines. Surface the backend error when attempted.
- Seeding: only offer when the list is empty and `canManageAccounting`.

### Journal entries list

- Filters: entry number (search), source type, status, period, Jalali date range.
- Columns: entry number (LTR), date, source type, description/reference, debit, credit, status, balanced badge.
- Default sort: `entryDate desc`.
- Clicking a row opens the detail route.
- No edit/delete actions.

### Journal entry detail

- Header: entry number, Jalali date, status, source type, description, reference.
- Totals: debit, credit, balanced/unbalanced.
- Lines table: line number, account `code — name`, description, cost center, unit, store, debit, credit.
- If `lineSnapshot` exists, render it as the audit snapshot; if current `lines` differ, show a subtle «اسناد اصلی تغییر کرده‌اند» note with both available (snapshot is the posted truth).
- Source link: `goodsReceipt`, `consumption`, `paymentOrder` to their detail pages when one exists in the current panel; otherwise render source type + ID as plain text.
- Manual entries: `sourceType: "manual"`, effective date, no edit.

### Manual entry form

- Jalali date picking via `FormJalaliDatePicker`; default today. Convert to ISO string for the action. Backend rejects dates in closed periods — show the mapped Persian error.
- Header fields: description, reference (optional), idempotency key generated once with `crypto.randomUUID()` when the form mounts; keep it across retries to make retries safe.
- Lines: at least 2. Each line requires either a postable, active account (`accountId`) or a `systemKey` (advanced, resolves the org’s mapped default account), and exactly one of debit/credit > 0. Debit/credit inputs are mutually exclusive in the UI.
- Show live totals and a balance state; submit disabled while `|debit - credit| > 0.01`.
- Optional cost center, unit, and store selectors; unit options come from scoped `getUnits()` for the organization; cost centers from the selected organization; store is only relevant for store-scoped sources and may be omitted for manual entries.
- On success, `postManual` returns an array — take `body[0]` — then toast and navigate to the entry detail.
- Prevent double submit; show a loading state on the button.

### Accounting periods

- List: code (`YYYY-MM`, LTR), name, Jalali start/end, status badge, closed by/at, entry count if available.
- Create: code prefills from the selected start month as `YYYY-MM` (Gregorian, matching backend period resolution) and is editable with a warning; name defaults to «دوره YYYY-MM»; start/end default to the month bounds in UTC. Fiscal year is optional from `getFiscalYears`.
- Edit: only name and dates; disabled for `closed`/`locked`.
- Close: confirm dialog; disabled unless `canCloseAccountingPeriod` and status is `open`. On success refresh the list.
- Delete: only `open` periods with zero entries; confirm and surface backend errors.

### Cost centers

- List/cards: code, name, type, unit, responsible user, active.
- Add/edit: code, name, description, type (`cost`/`profit`), unit (optional, scoped), responsible user (optional), active.
- Delete blocked when lines reference it; surface the backend error.

### Reports

Common filters: organization (admin), period, Jalali date range with presets «این ماه»، «ماه گذشته»، «امسال»، «بازه دلخواه». Reports use the accounting actions directly; no client-side recomputation beyond formatting.

- **Trial balance**: table grouped by `accountType` with subtotals; columns code, name, debit, credit, balance; footer totals and a balanced/unbalanced badge using `totals.difference`. Empty state when no posted entries in range.
- **General ledger**: required account selector (searchable, active accounts), optional period/date range; show opening balance, lines with running balance, entry number/date links, cost center, debit/credit; footer totals and closing balance. Do not send `organizationId` to this action.
- **Income statement**: revenue and expense sections, amount per account, total revenue, total expenses, net income (positive/negative styling). It accepts `organizationId`; pass it for admin/OrgHead.
- All report pages must be server-rendered for initial data where possible, with client filter components that push search params and refresh.

## Formatting and UX Rules

- Persian-only, RTL. Use logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`). Never use `left`/`right`.
- Use `JalaliDatePicker`/`FormJalaliDatePicker` for every date. Never render a native date input or an English date.
- Numbers: `toLocaleString("fa-IR")`. Currency: «ریال». Entry numbers and account codes: `dir="ltr"` with end alignment where needed.
- Status/source/type labels must be Persian via `labels.ts`:
  - accountType: asset=دارایی، liability=بدهی، equity=حقوق صاحبان سهام، revenue=درآمد، expense=هزینه
  - normalBalance: debit=بدهکار، credit=بستانکار
  - entry status: draft=پیش‌نویس، posted=ثبت‌شده، reversed=برگشت‌خورده
  - sourceType: goodsReceipt=رسید کالا، consumption=مصرف، paymentOrder=دستور پرداخت، budget=بودجه، manual=دستی، adjustment=تعدیل، opening=افتتاحیه، reversal=برگشت
  - period status: open=باز، closed=بسته، locked=قفل
  - cost-center type: cost=هزینه، profit=سود
- Use `StatusBadge`/`Badge` with semantically consistent colors for the above; do not invent a second status palette.
- Lists: server-side pagination with `Pagination`; search with `SearchField`; filters with `FilterSelect`; counts via `count` actions, never by fetching everything.
- Loading: add `loading.tsx` skeletons per route group.
- Empty: `EmptyState` with a clear next action (seed accounts, post first entry, create period).
- Errors: `ErrorState` or toast with the mapped Persian message. Authorization failures are not retried.
- After every mutation: `router.refresh()` and, where relevant, re-fetch the list. Do not optimistically merge stale accounting data.
- Confirm destructive actions with `ConfirmDialog`.
- One primary CTA per viewport (Electric Iris).
- Follow `.agents/THEME/DESIGN.md`; reuse `glass-card`, `PageHeader`, `StatCard`, `NavCard`.

## Backend Error Mapping (minimum)

| Backend message | Persian |
|---|---|
| `Journal entry is not balanced: debit X != credit Y` | «سند تراز نیست؛ جمع بدهکار و بستانکار باید برابر باشد.» |
| `Accounting period YYYY-MM is closed` / `is locked` | «دوره حسابداری بسته/قفل است و امکان ثبت در آن وجود ندارد.» |
| `Account is inactive` | «حساب انتخاب‌شده غیرفعال است.» |
| `Account is a header account and cannot be posted to` | «حساب کل/گروهی قابل ثبت نیست؛ یک حساب قابل ثبت انتخاب کنید.» |
| `No active account mapped for ...` | «حساب پیش‌فرض برای این نوع عملیات تعریف نشده است.» |
| `System accounts cannot be deleted` | «حساب‌های سیستمی قابل حذف نیستند.» |
| `Delete child accounts first` | «ابتدا حساب‌های زیرمجموعه را حذف کنید.» |
| `Account has journal entries and cannot be deleted` | «این حساب در اسناد استفاده شده و قابل حذف نیست.» |
| `Cost center has journal entries and cannot be deleted` | «این مرکز هزینه در اسناد استفاده شده و قابل حذف نیست.» |
| `Period has journal entries and cannot be deleted` | «این دوره سند دارد و قابل حذف نیست.» |
| `Closed or locked periods cannot be deleted` | «دوره بسته یا قفل‌شده قابل حذف نیست.» |
| `Resolve draft journal entries before closing the period` | «ابتدا اسناد پیش‌نویس این دوره را تعیین تکلیف کنید.» |
| `Only the head of a Finance unit can manage budgets and payments` | «دسترسی حسابداری فقط برای سرپرست واحد مالی مجاز است.» |
| `You cant do this` | «شما دسترسی لازم برای این عملیات را ندارید.» |
| `Active role not found` / `activeRoleId is required` | «نقش فعال معتبر نیست؛ دوباره وارد شوید یا نقش را تغییر دهید.» |

Show unknown backend messages as-is if Persian is unavailable; never replace them with a generic network error.

## File Map

New server actions:

```
src/app/actions/account/{add,get,gets,update,remove,count,seedDefaultChartOfAccounts}.ts
src/app/actions/accountingPeriod/{add,get,gets,update,remove,count,closePeriod}.ts
src/app/actions/costCenter/{add,get,gets,update,remove,count}.ts
src/app/actions/journalEntry/{get,gets,count,postManual,getTrialBalance,getGeneralLedger,getIncomeStatement}.ts
src/app/actions/journalEntryLine/{get,gets,count}.ts
```

New shared code:

```
src/lib/features.ts
src/lib/accounting-access.ts
src/lib/accounting-format.ts        (or components/accounting/money.ts + labels.ts)
src/components/accounting/**
```

New routes:

```
src/app/admin/accounting/{page.tsx,loading.tsx,layout.tsx}
src/app/admin/accounting/accounts/**
src/app/admin/accounting/journal-entries/**
src/app/admin/accounting/periods/**
src/app/admin/accounting/cost-centers/**
src/app/admin/accounting/reports/**
src/app/unit-head/finance/accounting/{page.tsx,loading.tsx,layout.tsx}
src/app/unit-head/finance/accounting/accounts/**
src/app/unit-head/finance/accounting/journal-entries/**
src/app/unit-head/finance/accounting/periods/**
src/app/unit-head/finance/accounting/cost-centers/**
src/app/unit-head/finance/accounting/reports/**
```

Modified:

```
src/app/actions/auth/getMe.ts
src/lib/nav-config.ts
src/lib/roles.ts
src/components/auth/panel-guard.tsx
src/components/layout/sidebar-nav.tsx
src/components/layout/mobile-nav-drawer.tsx
src/components/layout/command-search.tsx
src/components/layout/breadcrumbs.tsx
src/app/unit-head/finance/layout.tsx
src/components/help/content/finance.ts   (optional help topics)
```

## Edge Cases and Guardrails

- Manager/Admin without an organization selected: do not show a mixed-organization list. Require an organization selection and pass it to all actions that accept it.
- OrgHead selecting another organization: impossible via the selector; still handle backend denial.
- UnitHead of a non-Finance unit whose unit has accounting features: backend returns empty lists/denials. Show a Persian empty state explaining accounting is limited to Finance unit heads; do not loop or retry.
- UnitHead without `canViewAccounting`: nav hidden; direct URL shows the panel redirect or a clear no-access state.
- `postManual` returns an array, not a single object. Read `body[0]`.
- `journalEntry.get`, `journalEntry.getGeneralLedger`, `accountingPeriod.closePeriod`: never send `organizationId`; they reject it.
- Manual entry idempotency: keep the same `idempotencyKey` on retry; a successful retry returns the existing entry (`created: false` internally) with the same `_id`.
- Auto-generated entries are immutable; do not offer edit/delete/reversal.
- Closed periods: disable create/edit/delete/manual entry affordances when the selected period/date is closed.
- If a system account is missing (empty CoA), direct users to seed the chart of accounts before posting.
- Do not compute balances or net income on the client for the official reports; render backend totals exactly.

## Acceptance Criteria

1. A Finance UnitHead with unit-level `canViewAccounting`, `canManageAccounting`, `canCloseAccountingPeriod`, `canPostManualJournalEntry` sees a «حسابداری» nav section and can:
   - seed the default chart of accounts,
   - list/create/edit accounts and cost centers,
   - post a balanced manual entry and open its detail,
   - list/count entries and lines, filter by period/date,
   - run trial balance, GL, and income statement,
   - close an open period.
2. The same UnitHead without `canViewAccounting` does not see the nav and cannot open the pages; no redirect loop.
3. A UnitHead of a non-Finance unit gets a clear Persian denial/empty state, not a blank page.
4. Manager/Admin/OrgHead can use the Admin accounting pages; the organization selector scopes every list and report; OrgHead cannot see another organization’s data.
5. Budget pages and budget navigation are unchanged apart from the finance layout guard accepting accounting features.
6. No request sends `organizationId` to `journalEntry.get`, `journalEntry.getGeneralLedger`, or `accountingPeriod.closePeriod`.
7. Manual entry submit is blocked until debits and credits are within 0.01, and the same idempotency key is reused on retry.
8. System accounts cannot be deleted from the UI; used accounts/cost centers/periods show the mapped backend error.
9. Auto-posted entries from goods receipt, consumption, and payment order appear with correct source labels and links where a detail route exists.
10. All dates render in Jalali, all text is Persian, layout is RTL, `pnpm lint` passes, and `pnpm build` passes.

## Verification Scenario

1. Start backend and frontend. Log in as a Manager.
2. Create an organization and a `Finance` unit. Put the four accounting features on that unit.
3. Create a UnitHead scoped to that unit, log in, switch to the UnitHead role.
4. Confirm the accounting nav section is visible.
5. Seed the chart of accounts; confirm 16 accounts including the header account.
6. Create a cost center tied to the Finance unit.
7. Post a manual entry: operating expense debit 75 with the cost center, cash credit 75, date today.
8. Open the entry detail; confirm balanced, lines, cost center, and source «دستی».
9. Re-submit the same form payload (same idempotency key) from a second tab; confirm no duplicate entry.
10. Open reports: trial balance shows the two accounts and zero difference; GL for cash shows the credit line with running balance; income statement shows the expense and negative net income.
11. Close the current open period; confirm status «بسته» and that posting another entry dated in that period fails with the mapped message.
12. Remove the accounting features from the unit, reload; confirm the nav disappears and direct URLs do not loop.
13. Log in as a UnitHead of a `General` unit with the same features; confirm the accounting pages show the Persian “Finance unit only” state.
14. Log in as OrgHead; open Admin → accounting; confirm the organization selector is limited to the OrgHead’s organization and lists are scoped.

## Out of Scope

- Backend changes or type regeneration.
- New roles, units, panels, or an “Accountant” role.
- Journal reversal, entry editing, audit exports beyond optional CSV.
- Budget page redesign or merging accounting widgets into budget dashboards.
- Multi-language/i18n work.
