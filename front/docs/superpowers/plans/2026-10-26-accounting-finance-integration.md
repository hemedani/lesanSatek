# Accounting Inside Finance — Implementation Plan

**Goal:** Add the double-entry accounting information layer to the existing Admin and UnitHead finance areas, exactly as specified in `prompts/02-accounting-finance-integration.md`.

**Architecture:** Thin Server Actions per Lesan model, shared client/server accounting components, mirrored Admin/UnitHead route trees driven by shared server screen components. Effective feature resolution (`user.features` + active role unit features) feeds guards, nav, and buttons.

**Tech Stack:** Next.js 16 App Router, Server Actions, base-ui/shadcn, RHF + Zod, date-fns-jalali, Tailwind v4.

**Spec:** `prompts/02-accounting-finance-integration.md`

## Global Constraints

- Persian only, RTL, logical CSS properties.
- Server Actions only; `activeRoleId` injected server-side.
- Never send `organizationId` to `journalEntry.get`, `journalEntry.getGeneralLedger`, `accountingPeriod.closePeriod`.
- `postManual` returns an array; read `body[0]`.
- `pnpm lint` and `pnpm build` must pass.
- No backend edits, no new roles/panels/units.

## File Map

1. Foundations: `src/lib/features.ts`, `src/lib/accounting-access.ts`, `src/lib/lesan-action.ts`, `src/components/accounting/{money,labels,errors}.ts`, `src/components/accounting/server/context.ts`.
2. Actions: `src/app/actions/{account,accountingPeriod,costCenter,journalEntry,journalEntryLine}/*.ts`.
3. Auth/nav: `getMe` projection, `roles.ts`, `nav-config.ts`, `panel-guard`, `sidebar-nav`, `mobile-nav-drawer`, `command-search`, `breadcrumbs`, `authStore`, unit-head finance layout.
4. Shared components + screens under `src/components/accounting/`.
5. Routes under `src/app/admin/accounting/**` and `src/app/unit-head/finance/accounting/**`.
6. Verification: lint + build.

## Review Focus

- Feature resolution for unit-scoped roles must include unit features (otherwise nav/guard rejects valid Finance heads).
- Organization scoping must never rely on client filtering alone.
- Closed period / inactive / header-account posting errors must map to Persian and stay actionable.
- Idempotency key must survive retries so a double submit cannot duplicate entries.
- Balance invariant UI must block submit and report differences precisely.

## Tasks

### Task 1: Foundations
- Create effective feature resolver mirroring backend.
- Create accounting access helpers and Persian labels/format/error maps.
- Create action wrapper and accounting context resolver.
- Verify: `pnpm lint` on new files (or tsc at end).

### Task 2: Server Actions
- Add account, accountingPeriod, costCenter, journalEntry, journalEntryLine actions.
- Verify each compiles with generated `ReqType`.

### Task 3: Auth, Nav, Guards
- Extend `getMe`, update roles/guard/nav/mobile/search/breadcrumb/store/layout.
- Verify unit-level features show nav and do not loop.

### Task 4: Shared Components
- Build money/labels/errors, account select/tree/form, journal editor/form/table/detail, period/cost-center forms/tables, report filters/reports, dashboard, source link, org selector, page shell, denied state.

### Task 5: Admin Routes
- Add ten screens + layout + loading, organization-scoped.

### Task 6: UnitHead Routes
- Same ten screens under `/unit-head/finance/accounting/**`, derived organization, denial states.

### Task 7: Verification
- Run `pnpm lint`, `pnpm build`; fix findings.
