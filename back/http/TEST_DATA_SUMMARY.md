# E2E Test Data Summary

> Extracted from `http/e2e.json` — all static `set` values with Unicode Persian text decoded.

---

## 1. User Info

### TempUser (Bootstrap Ghost)

| Field | Value |
|-------|-------|
| `first_name` | Admin |
| `last_name` | System |
| `email` | admin@lesansatek.com |
| `password` | password123 |
| `mobile` | 09120000000 |
| `gender` | Male |

### Login Credentials

| Field | Value |
|-------|-------|
| `email` | admin@lesansatek.com |
| `password` | password123 |

**Captured values:**
- `ghostId` → runtime `_id` from tempUser response
- `ghostEmail` → runtime `email` from tempUser response  
- `token` → runtime JWT from login response
- `userId` → runtime `user._id` from login response
- `roleId` → runtime `user.roles[0].roleId` from login response

---

## 2. Geographic Data

### State

| Field | Value |
|-------|-------|
| `name` | تهران |
| `enName` | Tehran |

### City

| Field | Value |
|-------|-------|
| `name` | تهران |
| `enName` | Tehran |

---

## 3. Organizational Structure

### Organization

| Field | Value |
|-------|-------|
| `name` | سازمان نمونه |
| `enName` | Sample Organization |
| `description` | Test organization for E2E |

**Relations:** `state`, `city`

### Units

| Unit | `name` | `enName` | `description` | `type` | Extra Fields |
|------|--------|----------|---------------|--------|-------------|
| **Procurement Unit** | واحد خرید | Procurement Unit | Main purchasing unit | General | — |
| **Central Warehouse** | انبار مرکزی | Central Warehouse | Main warehouse | Warehouse | `warehouseCapacity`: 5000, `hasColdStorage`: true |
| **Finance Unit** | واحد مالی | Finance Unit | Financial management unit | Administration | — |

**All units have:** `headId` → user, `organizationId` → org

---

## 4. Product Hierarchy

### Manufacturer

| Field | Value |
|-------|-------|
| `name` | تولیدکننده نمونه |
| `enName` | Sample Manufacturer |
| `country` | Iran |

### Level 1 — WareType

| Field | Value |
|-------|-------|
| `name` | تجهیزات آزمایشگاهی |
| `enName` | Laboratory Equipment |

### Level 2 — WareClass

| Field | Value |
|-------|-------|
| `name` | هماتولوژی |
| `enName` | Hematology |

### Level 3 — WareGroup

| Field | Value |
|-------|-------|
| `name` | کیت |
| `enName` | Kit |

### Level 4 — WareModel

| Field | Value |
|-------|-------|
| `name` | کیت TSH |
| `enName` | TSH Kit |

### Ware (Concrete Product)

| Field | Value |
|-------|-------|
| `name` | کیت TSH زیشیمی |
| `enName` | TSH Kit ZistShimi |
| `brand` | ZistShimi |
| `price` | 2,500,000 |

### Hierarchy Relations

```
WareType (تجهیزات آزمایشگاهی)
  └── WareClass (هماتولوژی)
        └── WareGroup (کیت) ── M:N ── WareClass
              └── WareModel (کیت TSH)
                    └── Ware (کیت TSH زیشیمی, price=2,500,000)
                          └── Stuff (price=2,800,000)
```

**WareGroup relation update:** links `wareClassIds: ["{wareClassId}"]` to establish M:N.

---

## 5. Store & Stuff

### Store

| Field | Value |
|-------|-------|
| `name` | فروشگاه نمونه |
| `address` | Tehran, Iran |
| `economicCode` | 123456789 |
| `postalCode` | 1234567890 |

**Relations:** `cityId`, `stateId`, `storeHeadId` → user

### Stuff (Store Inventory)

| Field | Value |
|-------|-------|
| `inventoryNo` | 1001 |
| `price` | 2,800,000 |
| `hasAbsolutePrice` | true |

**Denormalized relations:** `wareId`, `storeId`, `wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId`

Pricing: Absolute (not percentage) — `hasAbsolutePrice: true`, actual price = 2,800,000.

---

## 6. Process & Steps — 8 Scoped Processes

The E2E suite creates **8 processes** covering every scope form. PR creation auto-resolves the correct process via `resolveProcessForPR()` (see `back/utils/resolveProcess.ts`).

**Resolution priority** (first match wins):
1. Unit-scoped (`process.unit._id === requestingUnitId`)
2. Ware-scoped (`process.ware._id === wareId`)
3. WareModel-scoped → WareGroup → WareClass → WareType
4. Org-wide general (unscoped) — fallback

### Process #1: General (Org-Wide) — `{processGeneralId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید عمومی سازمان |
| `description` | General org-wide procurement workflow |
| **Scope** | None (unscoped — applies to all PRs with no more specific match) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit (`{unitId}`) |
| 2 | تأیید انبار | 2 | Central Warehouse (`{warehouseUnitId}`) |
| 3 | تأیید مالی | 3 | Finance Unit (`{financeUnitId}`) |

### Process #2: Unit-Scoped (Procurement) — `{processUnitId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید واحد خرید |
| **Scope** | `unitId: {unitId}` (Procurement Unit) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید انبار | 2 | Central Warehouse |
| 3 | تأیید مالی | 3 | Finance Unit |

### Process #3: Unit-Scoped (Warehouse) — `{processWarehouseId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید انبار مرکزی |
| **Scope** | `unitId: {warehouseUnitId}` (Central Warehouse) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید انبار | 1 | Central Warehouse |
| 2 | تأیید مالی | 2 | Finance Unit |

### Process #4: Unit-Scoped (Finance) — `{processFinanceId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید واحد مالی |
| **Scope** | `unitId: {financeUnitId}` (Finance Unit) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید مالی | 1 | Finance Unit |

### Process #5: WareType-Scoped — `{processWaretypeId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید تجهیزات آزمایشگاهی |
| **Scope** | `wareTypeId: {wareTypeId}` (تجهیزات آزمایشگاهی) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید مالی | 2 | Finance Unit |

### Process #6: WareClass-Scoped — `{processWareclassId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید هماتولوژی |
| **Scope** | `wareClassId: {wareClassId}` (هماتولوژی) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |

### Process #7: WareGroup-Scoped — `{processWaregroupId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید کیت |
| **Scope** | `wareGroupId: {wareGroupId}` (کیت) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید انبار | 2 | Central Warehouse |
| 3 | تأیید مالی | 3 | Finance Unit |

### Process #8: WareModel-Scoped — `{processWaremodelId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید کیت TSH |
| **Scope** | `wareModelId: {wareModelId}` (کیت TSH) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید مالی | 2 | Finance Unit |

### Assignee Logic (All Processes)

Each step has a single group with `operator: "AND"` — the single unit in the group must approve. `groupsOperator: "AND"` (only 1 group per step).

### Activation

Every process is activated via `activateProcess` (validates consecutive step order, auto-increments version, sets `status: Active`, `isActive: true`).

### Duplicate

The general process is duplicated via `duplicateProcess` (creates Draft copy named "فرآیند خرید عمومی سازمان (Copy)", captured as `{dupProcessId}`).

---

## 7. Tag

| Field | Value |
|-------|-------|
| `name` | فوری |
| `color` | #FF0000 |
| `description` | Urgent items |

---

## 8. Budget

### FiscalYear

| Field | Value |
|-------|-------|
| `name` | سال مالی 1405 |
| `startDate` | 2026-03-21 |
| `endDate` | 2027-03-20 |
| `isActive` | true |

Status defaults to `"open"`.

### BudgetLine

| Field | Value |
|-------|-------|
| `code` | BUD-001 |
| `title` | بودجه خرید تجهیزات |
| `description` | Laboratory equipment budget |

### BudgetAllocation

| Field | Value |
|-------|-------|
| `amount` | 100,000,000 |
| `description` | Annual allocation for lab equipment |
| `allocatedAt` | 2026-03-21 |

---

## 9. Purchasing Requests

### PR #1 — Direct Store Purchase (via Process #2: Unit-Scoped Procurement)

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH |
| `description` | Urgent request for TSH kits |
| `estimatedAmount` | 50,000,000 |
| `quantity` | 10 |

**Relations (no processId — auto-resolved):** `wareModelId`, `requestingUnitId` → Procurement Unit, `budgetLineId`

**Auto-resolve:** requestingUnit=`{unitId}` → matches Process #2 (unit-scoped, Procurement) → resolves `{processUnitId}`

**Flow:** Submit (auto-resolves process) → Check Store Availability → Assign Store → Step 1 Decision (approved) → Warehouse Check → Step 2 Decision (approved) → Step 3 Decision (approved) → Goods Receipt → Auto Payment

### PR #2 — Tender-Based Purchase (via Process #2: Unit-Scoped Procurement)

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH - مناقصه |
| `description` | Tender-based procurement |
| `quantity` | 20 |

**Relations (no processId — auto-resolved):** `wareModelId`, `requestingUnitId` → Procurement Unit, `budgetLineId`

**Auto-resolve:** requestingUnit=`{unitId}` → matches Process #2 (unit-scoped, Procurement) → resolves `{processUnitId}`

---

## 10. Tender

### Tender

| Field | Value |
|-------|-------|
| `title` | مناقصه خرید کیت TSH |
| `description` | Open tender for TSH kits |
| `deadline` | 2026-05-01 |

### TenderOffer (by the store)

| Field | Value |
|-------|-------|
| `price` | 2,500,000 |
| `deliveryTime` | 7 days |
| `paymentTerms` | 30 days |
| `submittedAt` | 2026-04-10 |

**Tender vendor assignment:** Store is assigned via `updateRelations` (`assignedVendorsId`).

**Tender flow:** Add → UpdateRelations (assign vendor) → Submit Offer → Close Tender → Award (winning offer: the submitted offer).

---

## 11. Goods Receipt

| Field | Value |
|-------|-------|
| `receiptNumber` | GR-001 |
| `description` | First goods receipt |
| `receivedAt` | 2026-04-01 |
| `items` | `[{purchaseOrderItemId, wareModelId, quantityReceived: 10, quantityAccepted: 10, quantityRejected: 0}]` |

**Relations:** `purchasingRequestId` → PR #1, `receivedById` → user, `receivingUnitId` → Central Warehouse

---

## 12. Inventory & Stock

### Inventory (Initial)

| Field | Value |
|-------|-------|
| `quantity` | 50 |
| `minQuantity` | 10 |
| `maxQuantity` | 200 |
| `location` | Shelf A-12 |

**Relations:** `wareModelId` → TSH Kit, `unitId` → Central Warehouse

### Inventory Adjust

| Field | Value |
|-------|-------|
| `quantity` | 45 |
| `description` | Manual adjustment: found 5 damaged units |

### Consumption Record

| Field | Value |
|-------|-------|
| `quantity` | 5 |
| `consumedAt` | 2026-04-02 |
| `reason` | Routine lab testing |

**Relations:** `wareModelId`, `unitId` → Procurement Unit, `consumedById` → user, `inventoryId`

### Inventory Transfer

| Field | Value |
|-------|-------|
| `quantity` | 10 |
| `description` | Transfer to procurement for testing |

**From:** Central Warehouse → **To:** Procurement Unit

---

## 13. Complete Data Flow Summary

```
Setup Phase:
  tempUser (Admin/System) → login → capture token
  state (Tehran) → city (Tehran) → org (Sample Organization)
  ↓
  15 units (7 type=General, 2 Warehouse, Administrative, 5 Expert-labs)
  8 unit heads + 3 panel users
  Manufacturer → WareType → WareClass → WareGroup → WareModel → Ware → Stuff
  Store → link to city/state
  ↓
  8 Processes (1 general + 3 unit-scoped + 4 hierarchy-scoped)
  All activated with consecutive steps
  ↓
  Budget:
    FiscalYear (1405) → BudgetLine (BUD-001) → Allocation (100,000,000)
  ↓

E2E Flow #1 — Direct Store Purchase (auto-resolved → Process #2, unit-scoped):
  PR Submit (TSH Kit, qty=10, est=50M, requestingUnit=Procurement) → Pending
    Auto-resolve: requestingUnit matches Process #2 (unit-scoped, Procurement)
  Check Store Availability → Assign Store → PO Item created
  Step 1 (Procurement Unit): approve → advances to step 2
  Warehouse Check → Step 2 (Warehouse): approve → advances to step 3
  Step 3 (Finance): approve → Completed
  Goods Receipt (GR-001, qty=10 accepted) → auto-inventory, auto-payment
  Payment Order: gets existing PO → markPaid
  ↓

E2E Flow #2 — Inventory Management:
  Inventory add (Shelf A-12, qty=50)
  Adjust (qty=45, 5 damaged)
  Consumption (qty=5, routine lab testing)
  Stock Movements (gets all)
  Inventory Transfer (10 units, Warehouse → Procurement)
  ↓

E2E Flow #3 — Tender Purchase (auto-resolved → Process #2, unit-scoped):
  PR Submit (TSH Kit, qty=20, requestingUnit=Procurement) → Pending
  Tender add (deadline: 2026-05-01)
  Assign vendor (Store) to tender via updateRelations
  Vendor submits Offer (price=2,500,000, 7 day delivery)
  Close tender → Award to winning offer
  ↓

Utility:
  Tag (فوری, red)
  Duplicate general process
  Budget report (gets budget line report)
  ↓

E2E Flow #4 — Role Management (New Batch 1):
  Admin role update (add Manager) → UnitHead user (رضا احمدی)
  → Finance user (مریم حسینی, canManageBudget)
  → Vendor user (سارا کریمی, canRespondToTender)
  → Pending PR (25M, qty=5, for approval flow test)
  ↓

E2E Flow #5 — Extended Coverage (New Batch 2):
  getMe (profile check) → Store score update (4.5, 15M sales)
  → StepApproval gets (3 records for PR #1)
  → BudgetLine gets (filtered by fiscal year)
  → TenderOffer gets (winning offer details)
  → Consumption with PR link (qty=3, history push)
  → Archive duplicate process (Archived status)
  → Add removable tag (موقت) → Remove tag
  → Ware update relations (manufacturer link)

## 14. Role Management (Frontend Panel Users)

The first batch of 5 new entries creates users for the 5 frontend panels and a pending PR for testing approval flow.

| # | ID | Purpose | Captures |
|---|-----|---------|----------|
| 51 | `gen-update-admin-roles` | Adds `"Manager"` role to admin (alongside `"Ordinary"`) for `/admin` panel | — |
| 52 | `gen-unithead-user` | Creates **رضا احمدی** (`reza@lesansatek.com` / `password123`) with `UnitHead` role scoped to Procurement Unit for `/unit-head` panel | `{unitheadUserId}` |
| 53 | `gen-finance-user` | Creates **مریم حسینی** (`maryam@lesansatek.com` / `password123`) with `canManageBudget` feature for `/finance` panel | `{financeUserId}` |
| 54 | `gen-vendor-user` | Creates **سارا کریمی** (`sara@lesansatek.com` / `password123`) with `canRespondToTender` feature for `/vendor` panel | `{vendorUserId}` |
| 55 | `gen-pr-pending` | Submits a 3rd PR (25,000,000, qty=5, TSH Kit) that stays in `Pending` status for testing approval flow | `{prPendingId}` |

### Panel-to-User Mapping

| Panel | User | Role/Feature | Credentials |
|-------|------|-------------|-------------|
| `/admin` | Admin System (existing) | `Manager` + `Ordinary` | admin@lesansatek.com / password123 |
| `/unit-head` | رضا احمدی | `UnitHead` (scope: Procurement Unit) | reza@lesansatek.com / password123 |
| `/finance` | مریم حسینی | `Ordinary` + `canManageBudget` | maryam@lesansatek.com / password123 |
| `/vendor` | سارا کریمی | `Ordinary` + `canRespondToTender` | sara@lesansatek.com / password123 |
| `/employee` | Admin System (existing) | `Ordinary` | admin@lesansatek.com / password123 |

### New Captured Variables (Batch 1)

| Variable | Source | Value |
|----------|--------|-------|
| `{unitheadUserId}` | gen-unithead-user | _id of رضا احمدی |
| `{financeUserId}` | gen-finance-user | _id of مریم حسینی |
| `{vendorUserId}` | gen-vendor-user | _id of سارا کریمی |
| `{prPendingId}` | gen-pr-pending | _id of the pending PR |

---

## 15. Appendix — Extended E2E Coverage

| # | ID | What It Tests | Data Added |
|---|-----|---------------|------------|
| 56 | `gen-get-me` | Authenticated `user/getMe` endpoint | Returns admin profile with roles |
| 57 | `gen-unit-child` | Unit tree nesting (`parentUnit`) | Hematology Lab (Expert) under Procurement Unit, head=رضا احمدی |
| 58 | `gen-store-update-score` | Pure field update on store | score=4.5, totalSoldAmount=15,000,000, totalSoldNum=5 |
| 59 | `gen-stepApproval-gets` | Filtered `stepApproval/gets` | Returns 3 approval records (one per step) for completed PR #1 |
| 60 | `gen-budgetLine-gets` | Filtered `budgetLine/gets` by fiscal year | Returns BUD-001 with allocation/spent/remaining |
| 61 | `gen-tenderOffer-gets` | Filtered `tenderOffer/gets` by tender | Returns the winning offer (2,500,000, 7 day delivery) |
| 62 | `gen-consumption-with-pr` | Consumption linked to PR (history push) | qty=3, Quality control testing, linked to PR #1 |
| 63 | `gen-archive-process` | Archive guard — uses dupProcessId (no active PRs) | Duplicate process status → Archived |
| 64 | `gen-add-removable-tag` | Tag creation for deletion test | name="موقت", color=#00FF00 |
| 65 | `gen-remove-tag` | `tag/remove` action | Deletes the temporary tag |
| 66 | `gen-ware-update-relations` | Update ware's manufacturer relation | Links ware to manufacturer via `manufacturerId` |

### New Captured Variables (Complete)

| Variable | Source | Value |
|----------|--------|-------|
| `{unitheadUserId}` | gen-unithead-user | _id of رضا احمدی (UnitHead) |
| `{financeUserId}` | gen-finance-user | _id of مریم حسینی (Finance) |
| `{vendorUserId}` | gen-vendor-user | _id of سارا کریمی (Vendor) |
| `{prPendingId}` | gen-pr-pending | _id of the pending PR (25M, qty=5) |
| `{subUnitId}` | gen-unit-child | _id of Hematology Lab sub-unit |
| `{tempTagId}` | gen-add-removable-tag | _id of the temporary tag |

### Validator Fix Applied

`src/ware/updateRelations/updateRelations.val.ts` — added optional relation fields (`manufacturerId`, `wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId`) so the `updateRelations` action accepts relation updates.
```
