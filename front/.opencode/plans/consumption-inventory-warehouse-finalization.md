# Consumption, Inventory & Warehouse Finalization + Panel Consolidation

> Created: 2026-07-28
> Status: Implementation in progress

## Objectives

1. **Delete** `/finance/` and `/vendor/` panels (features redistributed to other panels)
2. **Add** Inventory, Consumption, Stock Movements pages to `/requests/`, `/unit-head/`, `/orghead/`
3. **Enhance** Admin inventory: Transfer UI, Stock Movements page, Consumption rewrite
4. **Unit-type conditional visibility** — `/requests/` and `/unit-head/` show features based on `unit.type` (Finance, Warehouse, General, etc.)
5. **PR ↔ Inventory integration** — show available stock during PR creation

---

## Part 1: Delete

| Directory | Reason | Replaced By |
|-----------|--------|-------------|
| `src/app/finance/` (7 files) | Duplicate; richer version in `/unit-head/finance/` | `/requests/finance/` + `/orghead/finance/` |
| `src/app/vendor/` (8 files) | Fully duplicated in `/storehead/` | Already exists at `/storehead/` |

---

## Part 2: Routes to Create

### `/admin/` — New/Enhanced

| Route | Action |
|-------|--------|
| `stock-movements/` | 🆕 3 files (page, client, loading) |
| `inventory/inventory-client.tsx` | ✏️ Add Transfer dialog |
| `consumption/page.tsx` | ✏️ Rewrite to server component + client |
| `consumption/loading.tsx` | 🆕 Create |

### `/requests/` — Employee Panel (new sub-routes)

| Route | Source |
|-------|--------|
| `consumption/` | 🆕 3 files |
| `stock-movements/` | 🆕 3 files |
| `finance/page.tsx` | 🆕 Dashboard |
| `finance/budget-lines/page.tsx` | 🆕 List |
| `finance/budget-lines/[id]/page.tsx` | 🆕 Detail |
| `finance/budget-reports/page.tsx` | 🆕 Reports |
| `finance/payment-orders/page.tsx` | 🆕 List |
| `finance/payment-orders/[id]/page.tsx` | 🆕 Detail |
| `finance/fiscal-years/page.tsx` | 🆕 Fiscal years management |

### `/unit-head/` — Unit Head Panel (new sub-routes)

| Route | Source |
|-------|--------|
| `inventory/` | 🆕 3 files |
| `consumption/` | 🆕 3 files |
| `stock-movements/` | 🆕 3 files |
| `transfer/` | 🆕 3 files — warehouse head only |

### `/orghead/` — Org Head Panel (new sub-routes)

| Route | Source |
|-------|--------|
| `inventory/` | 🆕 3 files (read-only, org-scoped) |
| `consumption/` | 🆕 3 files (read-only, org-scoped) |
| `stock-movements/` | 🆕 3 files (read-only, org-scoped) |
| `finance/page.tsx` | 🆕 Org budget overview |
| `finance/budget-lines/page.tsx` | 🆕 Org budget lines |
| `finance/budget-reports/page.tsx` | 🆕 Org budget reports |
| `finance/payment-orders/page.tsx` | 🆕 Org payment orders |

---

## Part 3: Files to Modify

| File | Change |
|------|--------|
| `unit-head/page.tsx` | Add Inventory, Consumption, StockMovements, Transfer nav cards (conditionally) |
| `requests/page.tsx` | Add unit-type-conditional nav cards |
| `orghead/page.tsx` | Add inventory/consumption/stock-movements/finance links |
| `admin/inventory/inventory-client.tsx` | Add Transfer dialog |
| `admin/consumption/page.tsx` | Rewrite to server component + client pattern |
| `admin/purchasing-requests/new/form.tsx` | Show inventory availability for selected wareModel |
| `components/layout/admin-sidebar.tsx` | Add Stock Movement entry |
| `components/layout/breadcrumbs.tsx` | Add `stock-movements` label |
| `middleware.ts` | Remove `/finance` and `/vendor` from panel routes |
| `actions/consumptionRecord/add.ts` | Pass wareModelId properly |
| `actions/inventory/transferWithAudit.ts` | Create wrapper (transfer + StockMovement) |

---

## Part 4: Unit-Type Conditional Visibility

### `/requests/` Dashboard

| Unit Type | Shows Additional Features |
|-----------|--------------------------|
| General | Default (PRs, Inventory, Consumption, StockMovements) |
| Warehouse | All General + Goods Receipt |
| Finance | All General + Budget Lines, Budget Reports, Payment Orders, Fiscal Years |

### `/unit-head/` Dashboard

| Unit Type | Shows Additional Features |
|-----------|--------------------------|
| General | Default (PRs, Inventory, Consumption, StockMovements) |
| Warehouse | All General + Goods Receipt, Transfer |
| Finance | All General + Budget Lines, Budget Reports, Payment Orders, Fiscal Years |

---

## Part 5: Implementation Order

| Step | Description |
|------|-------------|
| **1** | Delete `/finance/` and `/vendor/` directories + clean middleware |
| **2** | Create transferWithAudit action + enhance consumptionRecord action |
| **3** | Admin: Stock Movement page, Consumption rewrite, Transfer UI |
| **4** | `/unit-head/`: Inventory, Consumption, StockMovements, Transfer pages |
| **5** | `/requests/`: Consumption, StockMovements, Finance pages + dashboard |
| **6** | `/orghead/`: Inventory, Consumption, StockMovements, Finance pages + dashboard |
| **7** | PR ↔ Inventory integration |
| **8** | Sidebar, breadcrumbs, permission-gating final pass |
