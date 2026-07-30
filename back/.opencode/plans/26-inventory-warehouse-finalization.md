# 26 — Inventory & Warehouse Finalization Plan

## Overview

Finalize the inventory and warehouse management features across the full stack. The backend inventory/consumption/stockMovement actions exist but lack proper role-based scoping. The frontend has gaps in UnitHead inventory management, consumption UI, stock movements display, and OrgHead warehouse visibility.

---

## Phase 1 — Backend: Role-Based Access & Scoping for Inventory

### 1a. `inventory.gets` — Add role-based auto-scoping + fix dot-notation

**File:** `src/inventory/gets/gets.fn.ts`

**Changes:**
- Fix `match.unit = new ObjectId(...)` → `match["unit._id"] = new ObjectId(...)` (dot-notation)
- Add auto-scoping based on active role:
  - **UnitHead**: auto-filter by `"unit._id"` = `activeRole.scopeId`
  - **Employee**: auto-filter by `"unit._id"` = `activeRole.scopeId` (with `scopeType: "unit"`)
  - **OrgHead**: auto-filter by `"unit.organization._id"` = `activeRole.scopeId`
  - **Warehouse head (UnitHead with Warehouse unit type)**: NO auto-scope — can see all units' inventory
  - **Manager/Admin**: no auto-scope
- Add `organizationId` filter param for explicit org filtering

### 1b. `inventory.add` — Scope validation for UnitHead/Employee

**File:** `src/inventory/add/add.fn.ts`

When the active role is NOT Manager/Admin:
- Validate `unitId` matches `activeRole.scopeId` (if `scopeType === "unit"`)
- If a Warehouse-type unit head, allow adding inventory to any unit they head

### 1c. `inventory.adjust` — Same scope validation

**File:** `src/inventory/adjust/adjust.fn.ts`

Fetch the inventory doc first, check `unit._id` matches the user's scoped unit (unless Manager/Admin).

### 1d. `inventory.transfer` — fromUnit must be user's own unit

**File:** `src/inventory/transfer/transfer.fn.ts`

Validate `fromUnitId` is the user's own unit (unless Manager/Admin). `toUnitId` can be any unit.

### 1e. `inventory.gets` validator — Add organizationId

**File:** `src/inventory/gets/gets.val.ts`

Add optional `organizationId: string()` param.

---

## Phase 2 — Backend: ConsumptionRecord Scoping & Auto-Derivation

### 2a. `consumptionRecord.add` — Auto-derive unitId from activeRole

**File:** `src/consumptionRecord/add/add.fn.ts`

When `unitId` is not provided and the active role has `scopeType: "unit"`, auto-derive `unitId` from `activeRole.scopeId`.
When `consumedById` is not provided, auto-derive from `user._id`.

### 2b. `consumptionRecord.gets` — Add role-based scoping

**File:** `src/consumptionRecord/gets/gets.fn.ts`

Same pattern as inventory.gets:
- **UnitHead**: auto-filter by `"unit._id"` = own scoped unit
- **Employee**: auto-filter by own unit
- **OrgHead**: auto-filter by org
- **Manager/Admin**: no filter
- Add `organizationId` filter

### 2c. `consumptionRecord.add` validator — Make unitId optional

**File:** `src/consumptionRecord/add/add.val.ts`

Make `unitId` and `consumedById` optional (backend derives from active role).

---

## Phase 3 — Backend: StepApproval + PurchasingRequest Enhancements

### 3a. `warehouseCheck` — Org-wide inventory snapshot for approval

**File:** `src/purchasingRequest/warehouseCheck/warehouseCheck.fn.ts`

Already exists. Confirm it works and returns all units' inventory for a given PR's wareModel.

### 3b. Step approval warehouse view

No backend change needed — the frontend will call `inventory.gets({ wareModelId })` without unit filter during warehouse step approval. The Warehouse head bypasses auto-scoping (from Phase 1a).

---

## Phase 4 — Frontend: Stock Movements Page

### 4a. Create `/admin/stock-movements/` page

**New files:**
- `src/app/admin/stock-movements/page.tsx` — Server component
- `src/app/admin/stock-movements/stock-movements-client.tsx` — Client component with DataTable
- `src/app/admin/stock-movements/loading.tsx`

**Features:**
- List all stock movements with pagination
- Filters: unit, wareModel, reason type, date range
- Display: wareModel name, quantity (+/-), balanceBefore, balanceAfter, reason, timestamp, unit name

### 4b. Add sidebar link

Add "گردش انبار" to admin sidebar under the Warehouse section.

---

## Phase 5 — Frontend: UnitHead Inventory Management

### 5a. Create `/unit-head/inventory/` page

**New files:**
- `src/app/unit-head/inventory/page.tsx`
- `src/app/unit-head/inventory/inventory-client.tsx`
- `src/app/unit-head/inventory/loading.tsx`
- `src/app/unit-head/inventory/error.tsx`

**Features:**
- List inventory items for the user's unit (auto-filtered by backend)
- Add inventory button (opens modal)
- Edit inventory (inline or modal)
- Adjust quantity (modal with description)
- Transfer stock (button → transfer form/modal)
- Delete inventory (with confirmation)

### 5b. Create transfer UI

A modal or page component within the inventory page for transferring stock to another unit.

---

## Phase 6 — Frontend: Consumption UI

### 6a. Create `/unit-head/consumption/` page

**New files:**
- `src/app/unit-head/consumption/page.tsx`
- `src/app/unit-head/consumption/consumption-client.tsx`

**Features:**
- List consumption records for the unit
- Add new consumption (select wareModel, enter quantity, reason, notes)
- UnitId and consumedBy auto-derived from active role

### 6b. Create `/requests/consumption/` page

**New files:**
- `src/app/requests/consumption/page.tsx`
- `src/app/requests/consumption/consumption-client.tsx`

**Features:**
- Same as UnitHead but for Employee role
- Auto-derives unit from active role scope

### 6c. Add consumption button to Employee inventory view

In `src/app/requests/inventory/inventory-client.tsx`, add a "مصرف" button per inventory item that opens a consumption form.

---

## Phase 7 — Frontend: Warehouse Stock Visibility During PR

### 7a. Show stock level in PR creation form

In `src/app/requests/new/page.tsx`, after selecting a wareModel, show current inventory level:
```
موجودی فعلی در واحد شما: X عدد
```
Uses `inventory.gets({ unitId, wareModelId })`.

### 7b. Show org-wide stock in warehouse approval

In `src/components/purchasing/` or the unit-head actions component, when the current unit head is of a Warehouse type, display a panel showing all units' inventory for the PR's wareModel.

---

## Phase 8 — Frontend: OrgHead Warehouse Views

### 8a. Add inventory route to OrgHead

- `src/app/orghead/inventory/page.tsx` — Org-wide inventory view
- `src/app/orghead/consumption/page.tsx` — Org-wide consumption view
- `src/app/orghead/stock-movements/page.tsx` — Org-wide stock movements view

### 8b. Add OrgHead sidebar or tab navigation

Add tabs or sub-navigation in the OrgHead panel for inventory, consumption, stock movements.

---

## Phase 9 — Dot-notation Fixes & Validation

### 9a. Fix inventory.gets query

The `match.unit = new ObjectId(unitId)` should be `match["unit._id"] = new ObjectId(unitId)` (Phase 1a already covers this).

### 9b. Fix consumptionRecord.gets query

The `match.unit = new ObjectId(unitId)` should be `match["unit._id"] = new ObjectId(unitId)`.

### 9c. Regenerate type declarations

Run `deno task bc-dev` after all backend changes.

---

## Execution Order

```
Phase 1 (Backend scoping) → Phase 2 (Backend consumption scoping) → Phase 3 (Backend warehouse check)
    → deno task bc-dev (regenerate types)
    → Phase 4 (Stock movements UI)
    → Phase 5 (UnitHead inventory UI)
    → Phase 6 (Consumption UI)
    → Phase 7 (PR warehouse visibility)
    → Phase 8 (OrgHead warehouse views)
    → Phase 9 (Final fixes)
```
