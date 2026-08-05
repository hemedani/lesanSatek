<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LesanSatek Frontend — Next.js Application

## Project Overview

LesanSatek frontend is a **Next.js 16** application for an organizational process management system. Organizations define and manage purchasing processes through a visual process builder. Each organization has a hierarchical **unit tree** (Organization → Unit → sub-units). **There is no Department model.** Users belong to organizations and units via **roles** (`roles[]`) and M:N membership relations (`units[]`, `organizations[]`). The system provides a flexible workflow engine for defining, approving, and executing purchasing workflows, with role scopes at organization, unit, and store level.

### Key Features

- Secure JWT-based authentication with role-based access (scopes: organization / unit / store)
- Visual process builder with **auto process resolution** (no manual `processId` on submit)
- Organization management with hierarchical unit tree and org-chart API
- StoreHead panel for managing store inventory (stuff, wares, offers)
- Purchasing requests: `Draft → Pending → step approvals → Completed` lifecycle, with `stuff` and `tender` selection modes
- Tender offers, budget lines/allocations/encumbrances, goods receipts, payment orders, inventory, stock movements, consumption
- Full Persian (fa) RTL support, dark/light/system theme
- Server Actions for all backend communication

## Core Domain Concepts

| Concept | Description |
|---|---|
| Organization | Root entity. Owns units, users (M:N via `organizations[]`), processes, stores, wares. Scope type `organization`. |
| Unit | Hierarchical tree node under an organization (parent/children). Types include `General`, `Warehouse`, `Logistics`, `Production`, `Administration`, `Finance`, `Expert`. |
| User | People with `roles[]` plus M:N `units[]` and `organizations[]` membership. Roles are the single source of access truth. |
| Role / Scope | `{ roleId, name, scopeType?, scopeId? }`. `scopeType` ∈ `organization` \| `unit` \| `store`. `scopeId` points to the record the role governs. |
| Store | Physical store belonging to an organization; governed by a StoreHead (`scopeType: "store"`). Has `location` / `geoLocation` (GeoJSON). |
| Stuff | Concrete store inventory item referencing a Ware; has `quantity`, `price`, `hasAbsolutePrice`, `pricePercentage`, `expiration`, `barcode`, `qrc`, payment-percentage fields (twoMonth…twentyFourMonth). |
| Ware | Concrete product (5th node of ware hierarchy). Fields: `name`, `enName`, `brand`, `price`, `orderedNumber`, `irc`, `umdns`, `gtin`, `photoUrl`. |
| PurchasingRequest | (PR) Flows through the process lifecycle. `selectionType`: `none` \| `stuff` \| `tender`. |
| TenderOffer | Supplier offer for a PR tender. Lifecycle `submitted → accepted/rejected`. |
| Process | Workflow definition; auto-resolved from scope chain for a PR. |
| BudgetLine / BudgetEncumbrance / BudgetAllocation | Budget tracking; encumbrance auto-created on PR submit when `budgetLineId` + `estimatedAmount` present. |
| GoodsReceipt / PaymentOrder | Post-finalization: goods receipt adds inventory and auto-creates a payment order. |
| Inventory / StockMovement / Consumption | Ware-based inventory (`unit + ware` unique), system-created movements, consumption records. |

## Roles

Roles live on the User model via `roles: Role[]`. Each role:

```ts
{ roleId: string, name: string, scopeType?: "organization" | "unit" | "store", scopeId?: string }
```

**Single source of truth is `user.addOrRemoveRoles`.** Never assign access by mutating unit/user relations — always use `addOrRemoveRoles`. The old `headedUnit` / `headedOrganization` fields are **removed**; `organization` single relation is replaced by M:N `organizations[]`.

| Role | Typical access |
|---|---|
| Manager | Global; manages users, units, org-wide everything. |
| Admin | Global-ish; same high-level access as Manager. |
| OrgHead | Scoped to one organization (`scopeType: "organization"`). Finalizes PRs, sees org analytics/org-chart. |
| UnitHead | Scoped to one unit (`scopeType: "unit"`). Approves steps, registers PRs, **accepts (submits) Draft PRs**, dashboard statistics. |
| StoreHead | Scoped to one store (`scopeType: "store"`). Manages stuff and offers for that store only. |
| Employee | Can register PRs as **Drafts only** (cannot submit/accept). |
| Ordinary | Read-only; cannot submit PRs. |

Submit (`Draft → Pending`) is **UnitHead-only** (plus privileged Manager/Admin/OrgHead). A Draft cannot be submitted until a `selectionType` is set: stuff assigned (`addStuff`) **or** a tender offer selected (`selectTenderOffer`).

The backend also enforces **feature flags** in roles/features, e.g. `canRegisterPurchaseRequest`, `canSubmitPurchaseRequest`, `canManageBudget`, `canIssuePaymentOrder`, `canViewBudgetReports`.

## Architecture

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Server Components by default) |
| Styling | Tailwind CSS v4 + shadcn/ui (**base-ui primitives** — not Radix) |
| Design System | `.agents/THEME/DESIGN.md` — "blueprint on midnight glass" (AuthKit). Mandatory for all public/marketing AND admin UI. |
| State | Zustand |
| Forms | React Hook Form + Zod |
| RTL | Persian-only (fa), full RTL |
| Theming | next-themes |
| API | Server Actions only (never direct client fetch to backend) |
| Auth | JWT in `httpOnly` cookie named `token`; sent as header `token` (no "Bearer" prefix) |
| Types | Generated declarations (`src/types/declarations/selectInp`) + strict TS |
| Package manager | **pnpm only** (never npm/yarn) |

## Design System (Mandatory)

Every page MUST follow `.agents/THEME/DESIGN.md`. Non-negotiable rules:

- Canvas: **Midnight Ink** `#05060f`
- Card surfaces: **Graphite Plate** `#2f343e`
- **Electric Iris** `#663af3` — exactly **one** primary CTA per viewport
- Icons ≥ 20–24 px
- Persian (fa) only, RTL only
- No templated SaaS defaults; no generic gradients/shadows outside the blueprint
- Dark/light via Tailwind v4 `@custom-variant dark` + next-themes (no FOUC)
- Logical CSS properties (`ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`) are REQUIRED. Never use `left`/`right` or physical padding/margin.

## Building and Running

```bash
pnpm install      # pnpm REQUIRED
pnpm dev          # Next.js dev (Turbopack)
```

App runs at `http://localhost:3000`. Backend must be running at `http://localhost:1370` (`cd back && deno task bc-dev`). Backend playground: `http://localhost:1370/playground`.

## Environment Configuration

Variables live in **`.env.local`** (the actual repo file — not `.env.frontend`):

- `NEXT_PUBLIC_BACKEND_URL` – Public backend URL (`http://localhost:1370`)
- `NEXT_PUBLIC_APP_URL` – Public app URL (`http://localhost:3000`)

## Code Structure

```
src/
├── app/                      # App Router
│   ├── (marketing routes)/   # about, blog, changelog, contact, docs, faq, pricing, privacy, register, terms, coming-soon
│   ├── admin/                # Full admin panel (all models)
│   ├── requests/             # Request center (my-requests, new, [id], consumption, inventory, stock-movements)
│   ├── storehead/            # StoreHead panel (store, stuff, tenders, my-offers, purchasing-requests)
│   ├── orghead/              # OrgHead panel (requests, processes, units, users, org-chart, settings, consumption, inventory, stock-movements)
│   ├── unit-head/            # UnitHead panel (requests, finance, goods-receipt, consumption, inventory, stock-movements)
│   ├── ordinary/             # Ordinary user home
│   ├── login/                # Login page
│   ├── actions/              # Server Actions (one folder per model)
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components (base-ui primitives)
│   ├── form/                 # Reusable form components
│   ├── layout/               # Layout components
│   └── providers/
├── stores/                   # Zustand stores
├── lib/                      # api.ts, auth.ts, roles.ts, server-action.ts, process-scope.ts, client-active-role.ts, ...
├── types/declarations/       # selectInp.ts → ReqType / DeepPartial
└── hooks/
```

## RTL & Persian

- **Persian (fa) only.** Never introduce English UI text or i18n/multi-language support.
- All user-facing text — labels, validation messages, notifications, tooltips, placeholders — MUST be Persian.
- `dir="rtl"` is set on `<html>`.
- **RTL gotcha:** some `@base-ui/react` primitives default to `dir="ltr"`. Always pass `dir="rtl"` explicitly:
  ```tsx
  <Tabs defaultValue="list" className="w-full" dir="rtl" />
  ```

## Authentication

- JWT stored in `httpOnly` cookie named `token`.
- Token sent as header `token` (no "Bearer" prefix) — Lesan convention.
- `activeRoleId` is required by most actions and is injected server-side from the `activeRoleId` cookie.
- Helpers in `@/lib/auth`: `getToken()`, `getActiveRoleId()`. Also `@/lib/server-action.ts` (`getServerHeaders`, `withActiveRole`, `isSecureRequest`) and `@/lib/roles.ts` (`getAccessiblePanels`, `getDefaultPanel`, `getPanelForRole`, `getHighestRole`).

## Server Actions Architecture (Lesan Framework)

Server Actions are the **exclusive** method for backend communication.

### Directory Structure

```
src/app/actions/
├── <model>/              # e.g., organization, unit, user, store, stuff, ware, ...
│   ├── add.ts            # Create
│   ├── get.ts            # Single by ID
│   ├── gets.ts           # List (pagination/filtering)
│   ├── update.ts         # Pure fields
│   ├── updateRelations.ts# Relations (replace: true semantics)
│   ├── remove.ts
│   └── count.ts
├── auth/                 # login.ts, logout.ts
└── file/                 # upload.ts
```

### Standard Action Pattern

```ts
"use server";
import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const add = async (
  data: ReqType["main"]["<model>"]["add"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["<model>"]["add"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "<model>",
      act: "<action>",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || {},
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در انجام عملیات" },
    };
  }
};
```

### Action Types

| Action | Notes |
|---|---|
| `add` | Create a record |
| `get` | Single record by `_id` — body is an array (`body[0]`) |
| `gets` | List with `{ page, limit, filter, ... }`; default `limit=50`, `page=1` |
| `update` | Pure fields only |
| `updateRelations` | Relation updates, `replace: true` semantics; supports `remove*` boolean flags; camelCase IDs in set |
| `remove` | Delete |
| `count` | `{ count: 1 }` in get |

### Field Selection (`get`)

```ts
{ _id: 1, name: 1 }                          // specific fields
{ _id: 1, organization: { _id: 1, name: 1 } } // nested relations (NOT 'organizationId')
{}                                            // all fields — avoid
```

### Field Naming Conventions

1. **`get` projections:** nested objects for relations — `organization: { _id: 1, name: 1 }`, NOT `organizationId`.
2. **`set` in add/update:** camelCase IDs — `organizationId: "123..."`.
3. **Backend filters (`filter`/`sort`):** dot notation for nested relations — `"unit._id"`.

### Response Structure

All Lesan actions return `{ success: boolean, body: any }`.

- Standard `act: "get"` → `body` is an **array**; access `response.body[0]`.
- Custom-named actions (`getMe`, `getPendingByUnit`, `dashboardStatistic`, `getOrgChart`, …) → `body` is a **single object** (or custom shape).

### The AppApi Client

`AppApi(lesanUrl?, token?)` in `@/lib/api.ts` wraps the auto-generated `lesanApi` from `@/types/declarations/selectInp` for full type safety and auto-completion.

### Best Practices

1. Always use Server Actions; never fetch backend directly from client components.
2. Be explicit with field selection (no `{}`).
3. Handle null returns — check `success`/`body` before accessing properties.
4. Type with `ReqType` + `DeepPartial` from `@/types/declarations/selectInp`.
5. Keep actions thin; put business logic in Server Components.
6. Validate on both sides (client UX + server security).
7. Wrap every action in `try…catch(error: unknown)` returning `{ success: false, body: { message } }`.

## Role Management (Critical)

- Roles are stored on the User model: `roles: [{ roleId, name, scopeType?, scopeId? }]`.
- **Single source of truth:** `user.addOrRemoveRoles`. Frontend action at `src/app/actions/user/addOrRemoveRoles.ts`.
- Users also have M:N `units[]` and `organizations[]` (managed via `updateUserRelations`).
- `scopeType`: `organization` | `unit` | `store`.
- StoreHead reverse relation: `user.managedStore`.

## Important Models

`user`, `organization`, `unit`, `store`, `stuff`, `ware`, `wareType`, `wareClass`, `wareGroup`, `wareModel`, `manufacturer`, `tag`, `state`, `city`, `process`, `processStep`, `stepApproval`, `purchasingRequest`, `tender`, `tenderOffer`, `budgetLine`, `budgetAllocation`, `budgetEncumbrance`, `fiscalYear`, `goodsReceipt`, `paymentOrder`, `stockMovement`, `inventory`, `consumption` (model key is `consumption`), `file`.

There is **no** `department` and **no** `purchaseOrderItem` model (PurchaseOrderItem was eliminated).

## Purchasing Request Lifecycle

`add` (Draft) → `submit` (UnitHead-only, requires `selectionType`; auto `processId` resolution + optional auto BudgetEncumbrance) → unit step approvals → Finance unit approval (`budgetLineId` required) → `Approved` → (Stuff assigned / tender awarded) → OrgHead `finalize` (PendingFinalization → Completed) → StoreHead delivery (`updateStuffStatus`: `assigned → ready_to_ship → shipped → delivered`) → `goodsReceipt.add` (adds inventory, auto-creates payment order) → `paymentOrder.markPaid`.

Terminal states: `Completed`, `Rejected`, `Cancelled`.

PR has `selectionType` (`none` | `stuff` | `tender`) + `selectedTenderOfferId`; UnitHead may add stuff or select a tender offer while the PR is in Draft. Tender award is deferred until the last approval step completes.

## Route Groups

| Route | Purpose |
|---|---|
| `/admin` | Full admin panel (all models) |
| `/requests` | Request center: `my-requests`, `new`, `[id]`, `consumption`, `inventory`, `stock-movements` |
| `/storehead` | StoreHead panel |
| `/orghead` | OrgHead panel (requests, processes, units, users, org-chart, settings) |
| `/unit-head` | UnitHead panel (requests, finance, goods-receipt, consumption, inventory, stock-movements) |
| `/ordinary` | Ordinary user home |
| `/login` | Login |
| marketing | about, blog, changelog, coming-soon, contact, docs, faq, pricing, privacy, register, terms |

## Backend Docs for Frontend Agents

Source of truth: `backDocs/` at the frontend repo root. Read the relevant doc before touching a feature area.

| # | Doc | Summary |
|---|---|---|
| 01 | ADMIN_UI_TODO | AuthKit "Midnight Blueprint" admin redesign; base on `.agents/THEME/DESIGN.md`. |
| 02 | workflow_instructions | Dev/test guide: backend `deno task bc-dev` (1370), frontend `pnpm dev` (3000), 126-record e2e seed in `back/http/e2e.json`. |
| 03 | new_backend_changes | `gets` pagination defaults (`limit=50`, `page=1`); dot-notation relation filters; 30 affected models. |
| 04 | update_process | Auto process resolution `resolveProcessForPR()`; scope priority `unit → ware → wareModel → wareGroup → wareClass → wareType → org-wide`. |
| 05 | submit_new_pr | `purchasingRequest.submit`; allowed roles; required/optional fields; auto BudgetEncumbrance. |
| 06 | new_role_management | Role refactor; `addOrRemoveRoles`; `roles[]` shape; `organizations` M:N; `headedUnit`/`headedOrganization` removed. |
| 07 | new_role_todo | Frontend TODO for role system migration. |
| 08 | new_add_submit_pr | Split `add` (Draft) / `submit` (Pending); feature flags; `requestingUnitId` auto-derived. |
| 09 | new_stuff_location_changes | PurchaseOrderItem **eliminated**; `addStuff` uses `stuffId`; geoLocation on Store/Unit/Organization. |
| 10 | new_store_head_role | StoreHead role; `scopeType: "store"`; `managedStore` reverse relation. |
| 11 | new_store_head_features | StoreHead feature list. |
| 12 | store_features | Stuff fields + denormalized ware hierarchy relations. |
| 13 | storehead_frontend_prompt | `/storehead` panel plan. |
| 14 | storehead_stuff_workflow_prompt | StoreHead CRUD stuff workflow. |
| 15 | stuff_gets_api_reference | `stuff.gets` API + auth pattern. |
| 16 | tender_offer_api_reference | TenderOffer model/API. |
| 17 | ware_gets_api_reference | Ware model + hierarchy + gets. |
| 18 | tenderOffer_api_reference | `tenderOffer.get/gets`. |
| 19 | pr-stuff-tender-selection-plan | PR `selectionType` + deferred tender award. |
| 20 | getPendingByUnit | `purchasingRequest.getPendingByUnit`. |
| 21 | orghead_dashboard | `/orghead` route; `finalize`; `finalWinner` (`stuff`/`tender`). |
| 22 | finance-unit-budget-line-goods-receipt | Unit type `Finance`; `stepApproval.submitDecision` `budgetLineId`; goods-receipt rules. |
| 23 | storehead-delivery-requester-receipt-orghead-payment | `updateStuffStatus` stages; full lifecycle; payment order. |
| 24 | finance-unithead-budget-payment-authority | Budget/payment authority; feature flags; `budgetLine.deductDirect`. |
| 25 | unithead-dashboard-statistic | `user.dashboardStatistic` type `unitHead`. |
| 26 | consumption-inventory-warehouse-finalization | Inventory + StockMovement + InventoryManager; PR finalization. |
| 27 | inventory-ware-based-changes | Inventory now per-**Ware** (unique `unit + ware`). |
| 28 | consumption-model-docs | Consumption model (key `consumption`): add/get/gets/count/remove. |
| 29 | getWarehouseInventory | `inventory.getWarehouseInventory` (central + unit warehouses). |
| 30 | purchasingRequest-gets-count | PR `gets`/`count` full reference (filters, sorts, role scoping). |
| 31 | orghead-dashboard-analytics | `dashboardStatistic` type `orgHead` + 14 analytics facets. |
| 32 | unit-getOrgChart-api | `unit.getOrgChart` (OrgHead auto-resolved from `scopeId`). |
| 33 | warehouse-hierarchy-models-and-multi-select-dropdown | Ware hierarchy `WareType → WareClass → WareGroup → WareModel → Ware → Stuff`; M:N multi-select dropdowns. |

## Ware Hierarchy

```
WareType (1) → WareClass (2, requires wareType) → WareGroup (3, has wareClasses M:N)
            → WareModel (4, requires wareType/wareClass/wareGroup) → Ware (5, concrete) → Stuff (store inventory w/ price+qty)
```

- Warehouse is a `Unit` whose `unit_type` is `"Warehouse"`.
- Inventory is **Ware-based**: unique compound key `(unit, ware._id)`; the hierarchy fields (`wareModel`, `wareGroup`, `wareClass`, `wareType`) are auto-derived from `ware`.
- WareModel is the SKU-ish reference used on `PurchasingRequest`.

## Admin Panel Best Practices

### Background Layers (bottom → top)

1. **Static canvas** — Midnight Ink `#05060f` + 60px dot-grid SVG overlay at 3% opacity. `z-[-10]`, no animation.
2. **Faint outline shapes** — 4 large thin-stroke SVGs (circle, hexagon, rounded-rect, sweeping arc), `fill="none"`, `strokeWidth="1"`, opacity 0.06–0.10, static.
3. **Ambient orbs** — `<AmbientBackground />` (3 radial-gradient orbs, `blur(100-130px)`, opacity 0.08–0.18, `transform: translate() scale()` only). `z-0`, `pointer-events: none`, respects `prefers-reduced-motion`. Mounted once in `admin/layout.tsx`.
4. **Content** — sidebar, header, main at `z-[1]`+.

```tsx
<div className="relative flex h-screen overflow-hidden bg-[#05060f]">
  <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden="true">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] bg-[length:60px_60px] opacity-40" />
  </div>
  <AmbientBackground />
  <AdminSidebar />
  ...
</div>
```

- Cards: use `<Card variant="glass">` (or `className="glass-card glass-card-hover-active"` on non-Card wrappers). Never `bg-card`/`shadow-subtle-4` directly. This gives the conic-border Electric Iris → Frost Link hover animation and keeps backdrop-blur working (`relative` stacking context required).
- Inputs: `focus:border-ring focus:ring-3 focus:ring-ring/50` (Frost Link glow), `hover:border-frost-link/20`. Rest `border-steel-border/60`.

### Standard Admin Page Pattern

```
src/app/admin/<entity>/
├── page.tsx              # Server Component: fetch data, compute prev/next page URLs
├── <entity>-client.tsx   # Client: DataTable + card view toggle + pagination + actions
└── loading.tsx           # Skeleton loading
```

`DataTable` supports table + card views (`cardView`/`onViewToggle`/`renderCard`, `hideOnCard` on columns). Relations managed on `/admin/<entity>/:id/relations` via standalone `SearchSelect` (not `FormSearchSelect`).

### Loading & Error Handling

- `Skeleton` for lists, `loading.tsx` route files, `Loader2` + `animate-spin` in submitting buttons.
- Error boundaries (`error.tsx`, `global-error.tsx`) with a "تلاش مجدد" (Try again) reset button.

## Accessibility & Motion

- Focus rings on all interactive elements: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
- Respect `prefers-reduced-motion: reduce` (orbs freeze; no decorative animation).
- `next/image` for images; lazy-load heavy client components with `next/dynamic`.

## Git / Commit Conventions

See the root `AGENTS.md` for the full convention. Summary:

- When asked to `git commit`: use **Gitmoji + conventional commits** (e.g. `:sparkles: feat(ui): ...`, `:bug: fix(auth): ...`).
- Group changes into logical, atomic commits (UI vs fix vs chore).
- **Never** use `git reset` (data-loss risk).

## Quick Agent Checklist

1. Read `backDocs/` doc(s) relevant to the feature before coding.
2. Follow `.agents/THEME/DESIGN.md` for every UI change.
3. Persian (fa) only, RTL, logical CSS properties, explicit `dir="rtl"` on base-ui primitives.
4. Server Actions only; type with `ReqType`/`DeepPartial`; inject `activeRoleId`; wrap in try/catch.
5. Use `pnpm`, not npm/yarn. `Next.js 16` — consult `node_modules/next/dist/docs/` on any doubt.
6. No Department model. No PurchaseOrderItem. Roles via `user.addOrRemoveRoles`.
