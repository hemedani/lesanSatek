# Backend Changes — Summary for Frontend Agent

> **Context**: These are the changes committed to `back/` in the recent batch (commits `020baf2` through `c0f2764`, 6 commits total). They are atop all prior backend work.

---

## 1. Pagination: Default Fallback Values

**All `gets` functions** across every model now have safe defaults for `skip`/`limit`/`page` using nullish coalescing:

```ts
// Before (would break if limit/page were undefined):
const calculatedSkip = skip ?? limit * (page - 1);
pipeline.push({ $limit: limit });

// After (safe defaults):
const calculatedSkip = skip ?? (limit || 50) * ((page || 1) - 1);
pipeline.push({ $limit: limit || 50 });
```

**Impact on frontend**: All `gets` calls are now more forgiving — you can omit `limit` and/or `page` entirely and they default to `limit=50`, `page=1`. The `skip` field is still optional and takes precedence over computed skip.

**Affected models** (30 total): budgetAllocation, budgetEncumbrance, budgetLine, city, consumptionRecord, file, fiscalYear, goodsReceipt, inventory, manufacturer, organization, paymentOrder, process, processStep, purchaseOrderItem, purchasingRequest, state, stepApproval, stockMovement, store, stuff, tag, tender, tenderOffer, unit, ware, wareClass, wareGroup, wareModel, wareType.

---

## 2. Dot Notation for All Relation Queries

Every query that used a bare relation field name (e.g. `{ unit: someId }`) has been changed to use dot notation (`{ "unit._id": someId }`). This is because Lesan embeds relation subdocuments inline, so the correct filter path is `"relationName._id"`.

**Files changed** (selection):
- `back/src/stepApproval/gets/gets.fn.ts` — `purchasingRequest`, `processStep`, `unit` → `"purchasingRequest._id"`, `"processStep._id"`, `"unit._id"`
- `back/src/stepApproval/submitDecision/submitDecision.fn.ts` — Same pattern for all `$match` stages
- `back/src/inventory/transfer/transfer.fn.ts` — `unit` → `"unit._id"`
- `back/src/inventory/add/add.fn.ts` — `unit` → `"unit._id"`
- `back/src/budgetLine/getBudgetReport/getBudgetReport.fn.ts` — `fiscalYear` → `"fiscalYear._id"`, `organization` → `"organization._id"`
- `back/src/budgetLine/getYearEndReport/getYearEndReport.fn.ts` — Same
- `back/src/process/activateProcess/activateProcess.fn.ts` — `process` → `"process._id"` (in processStep queries)
- `back/src/goodsReceipt/add/add.fn.ts` — `purchasingRequest`, `processStep` → dotted
- `back/utils/inventoryManager.ts` — All `unit`, `warehouseUnit` references → dotted

**Impact on frontend**: No direct change needed — this is purely a backend fix. But note that when you request relation subdocuments in a `get` projection, they come back as embedded objects with `_id`, not as bare ObjectIds.

---

## 3. Error Throwing: Plain Objects → `new Error()`

Every `throw { error: "message" }` has been changed to `throw new Error("message")` for consistency and proper stack traces.

**Files changed**: assignStore.fn.ts, checkStoreAvailability.fn.ts, removeFromPurchase.fn.ts, warehouseCheck.fn.ts, tender/award.fn.ts, inventoryManager.ts, inventory/transfer/transfer.fn.ts, goodsReceipt/add/add.fn.ts

**Impact on frontend**: Your server action wrappers that catch errors should now handle `Error` objects properly. If you previously extracted `error.body?.error`, you may need to check `error.message` instead. However, the Lesan framework likely still wraps these in its standard response envelope.

---

## 4. Role-Based Scoping (Unit Head Verification)

### 4a. `purchasingRequest.gets` — New `unitId` filter + security

**New validator field**: `unitId` (optional ObjectId)

When `unitId` is provided AND the user's active role is NOT Manager/Admin/OrgHead:
1. The backend fetches the unit document and verifies `unit.head._id === user._id`
2. If not the unit head, a `throwError()` is raised
3. Then it does a `$lookup` joining PR → StepApproval, filtering to only PRs where:
   - `stepApproval.unit._id === unitId`
   - `stepApproval.status === "pending"`
   - The stepApproval's processStep matches the PR's `currentStep`
4. Returns only PRs that have a pending approval waiting for this unit

**Frontend usage** (UnitHead panel):
```ts
const result = await purchasingRequest.gets({
  set: { unitId: "<unit-id>", activeRoleId: "<role-id>", page: 1, limit: 20 },
  get: { _id: 1, title: 1, status: 1, estimatedAmount: 1, /* ... */ }
});
```

### 4b. `stepApproval.gets` — New `activeRoleId` + unit head security

**New validator field**: `activeRoleId` (string, from activeRoleMixin)

When `unitId` is provided and the user is NOT Manager/Admin/OrgHead:
- Verifies `unit.head._id === user._id`
- Raises error if not the unit head

All `$match` filters also use dot notation now.

### 4c. `stepApproval.submitDecision` — Unit head verification added

Before: Only checked role-based access via `grantAccess`. Now additionally:
- If user is NOT Manager/Admin: verifies `unit.head._id === user._id`
- Raises `throwError("Only the unit head can submit a decision for this unit")` if mismatch

All internal `$match` queries use dot notation.

---

## 5. Relation Management Refactor (Critical)

### 5a. `purchasingRequest.updateRelations` — Major rewrite

**New validator fields**:
| Field | Type | Notes |
|-------|------|-------|
| `tenderId` | `optional(string())` | Changed from `objectIdValidation` to `string()` — pass `""` to unset |
| `stepApprovalIds` | `optional(array(objectIdValidation))` | **New** — link step approvals |
| `goodsReceiptIds` | `optional(array(objectIdValidation))` | **New** — link goods receipts |
| `paymentOrderIds` | `optional(array(objectIdValidation))` | **New** — link payment orders |
| `budgetLineId` | `optional(string())` | **New** — set budget line; pass `""` to unset |

**Behavior changes**:

**tenderId**: Now uses child-side relation management:
- If truthy string: calls `tender.addRelation()` to set `tender.purchasingRequest._id`
- If empty/falsy string: finds the current tender linked to this PR and `$unset`s its `purchasingRequest` field

**purchaseOrderItemIds**: Now uses child-side:
- Calls `purchaseOrderItem.addRelation()` setting `purchaseOrderItem.purchasingRequest._id`
- Then updates each POI's `assignedFrom`, `wareModel`, `store` denormalized fields from the PR

**stepApprovalIds** (new): Links stepApproval records to this PR via child-side.

**goodsReceiptIds** (new): Links goods receipts. If empty array, finds and `$unset`s all linked ones.

**paymentOrderIds** (new): Links payment orders. If empty array, finds and `$unset`s all linked ones.

**budgetLineId** (new): Sets budgetLine relation on the PR. If empty string, `$unset`s it.

### 5b. `tender.updateRelations` — Rewrite

**New validator fields**:
| Field | Type | Notes |
|-------|------|-------|
| `purchasingRequestId` | `optional(string())` | Changed from `objectIdValidation` |
| `assignedVendorsId` | `optional(objectIdValidation)` | **New** — single vendor assignment |

**Behavior changes**:

**purchasingRequestId**: If truthy → `tender.addRelation()` to set purchasingRequest. If empty string → `$unset` on tender.

**assignedVendors** and **assignedVendorsId**: Unified into a single `vendorIds` array. If `assignedVendors` is provided, it's used as-is. If `assignedVendorsId` is provided (single vendor), it's wrapped in an array.

**offers**: Now uses child-side:
- If non-empty array: calls `tenderOffer.addRelation()` setting `tenderOffer.tender._id`
- If empty array: finds all linked offers and `$unset`s their `tender` field

### 5c. `ware.updateRelations` — New relation fields

**New validator fields**:
| Field | Type |
|-------|------|
| `manufacturerId` | `optional(objectIdValidation)` |
| `wareTypeId` | `optional(objectIdValidation)` |
| `wareClassId` | `optional(objectIdValidation)` |
| `wareGroupId` | `optional(objectIdValidation)` |
| `wareModelId` | `optional(objectIdValidation)` |

**Behavior**: Now strips trailing `Id` suffix from the key name before passing to `addRelation()`. E.g. `manufacturerId` → relation `manufacturer`. Also properly destructures `activeRoleId` out of the set so it doesn't get iterated as a relation.

### 5d. `budgetLine.updateRelations` — New endpoint

New 3-file module at `back/src/budgetLine/updateRelations/`:
- Validator: accepts `_id` and optional `fiscalYearId`
- Function: If `fiscalYearId` is truthy → `addRelation()`. If empty string → `$unset` on the budgetLine.
- Guarded to Manager/Admin

---

## 6. New Remove Endpoints (11 models)

Every remove endpoint follows the same pattern — 3 files (mod.ts, remove.fn.ts, remove.val.ts):

```ts
// remove.val.ts
object({
  set: object({ ...activeRoleMixin, _id: objectIdValidation, hardCascade: optional(boolean()) }),
  get: object({ success: optional(enums([0, 1])) }),
})

// remove.fn.ts
return await modelName.deleteOne({
  filter: { _id: new ObjectId(_id as string) },
  hardCascade: hardCascade || false,
});
```

**New remove endpoints**:

| Model | File Path |
|-------|-----------|
| BudgetAllocation | `back/src/budgetAllocation/remove/` |
| BudgetEncumbrance | `back/src/budgetEncumbrance/remove/` |
| BudgetLine | `back/src/budgetLine/remove/` |
| ConsumptionRecord | `back/src/consumptionRecord/remove/` |
| File | `back/src/file/remove/` |
| FiscalYear | `back/src/fiscalYear/remove/` |
| GoodsReceipt | `back/src/goodsReceipt/remove/` |
| PaymentOrder | `back/src/paymentOrder/remove/` |
| StepApproval | `back/src/stepApproval/remove/` |
| StockMovement | `back/src/stockMovement/remove/` |
| TenderOffer | `back/src/tenderOffer/remove/` |

**All guarded to**: Manager, Admin roles.

**Frontend usage**:
```ts
const result = await <model>.<act>({
  set: { _id: "<id>", activeRoleId: "<role-id>", hardCascade: false },
  get: { success: 1 },
});
```

---

## 7. New `gets` Endpoint: `budgetEncumbrance.gets`

**New module** at `back/src/budgetEncumbrance/gets/`.

**Validator**: accepts pagination (`page`, `limit`, `skip`), `sortBy`/`sortOrder`, and optional `budgetLineId` (string).

**Accessible to**: all authenticated roles (no role restriction beyond being logged in).

**Frontend usage**:
```ts
const encumbrances = await budgetEncumbrance.gets({
  set: { budgetLineId: "<budget-line-id>", page: 1, limit: 50, activeRoleId: "<role-id>" },
  get: { _id: 1, amount: 1, /* ... */ }
});
```

---

## 8. Inventory System Updates

### 8a. `inventory.add` — Duplicate prevention

Now checks if an inventory record already exists for the same `(unit, wareModel)` pair. If it does, it **updates** the existing record (`$set` on quantity, minQuantity, maxQuantity, location, batchNo, expirationDate, updatedAt) instead of creating a duplicate.

### 8b. `inventory.transfer` — Refactored return value

**Before**: Returned aggregation array.
**After**: Returns an object with `{ fromUnit, toUnit, quantity }` where `fromUnit`/`toUnit` are single inventory docs and `quantity` is the transferred amount.

**Validator change**: `get` now accepts:
```ts
get: object({
  fromUnit: optional(object({ _id: optional(number()) })),
  toUnit: optional(object({ _id: optional(number()) })),
  quantity: optional(number()),
})
```

### 8c. `inventoryManager.ts` — Key changes

- **Dot notation**: All queries use `"unit._id"`, `"warehouseUnit._id"` instead of bare field names
- **`inventoryId` option** in `removeStock()`: If `options.inventoryId` is provided, looks up inventory by `_id` directly instead of by `(unitId, wareModelId)` pair. This is used by `consumptionRecord.add` to reference specific inventory.
- **Error handling**: All `throw { error: ... }` → `throw new Error(...)`

**Frontend impact**: `consumptionRecord.add` now passes `inventoryId` to the stock removal function. If you have a specific inventory record ID, you can pass it as the relation.

---

## 9. Goods Receipt — Payment Order Enhancement

`goodsReceipt.add` now creates payment orders with additional relations:

**New relations on auto-created PaymentOrder**:
- `payTo`: Links to the **store** that was assigned in the purchase order item (resolved from `purchaseOrderItem.assignedFrom`)
- `financialUnit`: Links to the `receivingUnitId` (the unit that received the goods)
- (Existing: `purchasingRequest`, `issuedBy` remain)

Also fixed: `$match` queries use dot notation for `purchasingRequest._id` and `processStep._id`.

---

## 10. Model Changes

### Why These Relations Were Removed (Root Cause)

Lesan's **one-directional rule**: When Model A defines a relation to Model B with `relatedRelations`, Lesan **auto-creates** the reverse on Model B. You must never also define that reverse on Model B explicitly — that creates a **circular duplicate** that breaks Lesan's integrity checks (e.g., `deleteOne` can't determine which definition to trust when cleaning parent reverse arrays).

The bug surfaced during E2E cleanup: `deleteOne` calls on parent models kept failing with "please clear below relations" — not because real data existed, but because the duplicate definitions confused Lesan's cascade logic. Example error:

```
please clear below relations status before deletion:
  [{ schemaName: purchasingRequest, type: single, fieldName: tender, collection: tender, ... }]
```

This was triggered because `purchasingRequest.tender` (explicit) conflicted with the auto-created reverse from `tender.purchasingRequest`.

### 10a. `purchasingRequest` model — Removed relations

The following relations were **removed** from the `purchasingRequest` model:
- `stepApprovals` (was `type: "multiple"` on `stepApproval`)
- `purchaseOrderItems` (was `type: "multiple"` on `purchaseOrderItem`)
- `tender` (was `type: "single"` on `tender`)

These are now managed **child-side** — the child document (stepApproval, purchaseOrderItem, tender) holds the reference to the parent purchasingRequest. The `budgetLine` relation remains on the purchasingRequest model.

**Frontend impact**: When you request a PR's details, you can no longer get `stepApprovals`, `purchaseOrderItems`, or `tender` directly from the PR's projection. Instead, use the child model's `gets` with the PR's `_id` as a filter, or fetch these separately. However, the `updateRelations` function on purchasingRequest still manages these links — it just does so by updating the child documents.

### 10b. `tender` model — Removed relation

- `offers` (was `type: "multiple"` on `tenderOffer`) — **removed**

Now managed child-side on `tenderOffer`.

---

## 11. `purchasingRequest.getHistory` — Projection Fix

Changed from `projection: {}` (returns everything) to explicit projection:
```ts
projection: { action: 1, performed: 1, unit: 1, details: 1 },
```

This ensures only the history array fields are returned, not the entire PR document.

---

## 12. Step Approval Submit Decision — Enhanced Validation

Added step-by-step validation in order:
1. PR exists and has status "Pending" or "InProgress"
2. Step matches the PR's `currentStep`
3. Unit is in the step's `assigneeGroups`
4. **New**: User must be the unit head (unless Manager/Admin)
5. Checks for existing approval (prevents double decision)
6. Upserts the decision
7. Re-evaluates step status via `evaluateStepStatus()` (OR/AND logic)
8. Auto-advances to next step or completes/rejects the PR

---

## 13. `processStep.gets` — New `processId` Filter

**New validator field**: `processId` (optional ObjectId)

When provided, filters steps by `"process._id": new ObjectId(processId)`.

---

## 14. E2E Test Suite

Located at `back/http/`:

- **`e2e.hurl`**: Hurl-formatted end-to-end test covering full procurement lifecycle (setup → PR flow → tender → inventory → cleanup)
- **`e2e.json` / `e2e-with-remove.json`**: JSON test configs for custom test runner
- **`_tests__/`**: Split JSON test files (00-init through 09-misc) covering: user registration, org setup, product hierarchy, store/stuff, process/budget, PR flow, inventory, tender, miscellaneous
- **`upload/`**: File upload test with sample images/PDFs
- **`vars.env`**: `serverAddress=http://localhost:1370`
- **`TEST_DATA_SUMMARY.md`**: Human-readable reference of all seed data
- **`Configdata.json`**: Legacy single-file version

Run with: `hurl --test back/http/e2e.hurl` (from project root) or use the custom JSON test runner.

---

## 15. Documentation

- **`back/step-approval.md`**: Comprehensive architecture document explaining the Process & Step Approval system — key models, submission flow, OR/AND logic for multi-unit steps, status lifecycle, history structure, frontend API reference with role requirements, unit head security verification. Essential reading for anyone working on the approval flow.
- **`back/AGENTS.md`**: Updated with `hardCascade` documentation explaining Lesan's `deleteOne` behavior and safe deletion patterns.

---

## Summary: What Frontend Should Update

| Area | Action Required |
|------|----------------|
| **`purchasingRequest.updateRelations`** | New fields: `stepApprovalIds`, `goodsReceiptIds`, `paymentOrderIds`, `budgetLineId`. `tenderId` now accepts string (pass `""` to unset). |
| **`tender.updateRelations`** | New field: `assignedVendorsId` (single vendor). `purchasingRequestId` now accepts string. `offers` uses child-side logic. |
| **`ware.updateRelations`** | New fields: `manufacturerId`, `wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId`. |
| **`purchasingRequest.gets`** | New filter: `unitId` (for UnitHead panel). Returns only PRs with pending approvals for that unit. |
| **`stepApproval.gets`** | Requires `activeRoleId`. Unit head verification on `unitId` filter. |
| **`stepApproval.submitDecision`** | Requires `activeRoleId`. Unit head verification added. |
| **Error handling** | Errors are now `new Error()` objects instead of plain `{ error: string }`. |
| **Pagination** | All `gets` calls can omit `limit`/`page` — defaults to 50/1. |
| **PR history** | `getHistory` returns only `{ action, performed, unit, details }` fields. |
| **Inventory add** | Now idempotent — updates existing inventory for same (unit, wareModel) pair. |
| **Inventory transfer** | Returns `{ fromUnit, toUnit, quantity }` object instead of array. |
| **Remove endpoints** | Available for 11 models — standard `deleteOne` with optional `hardCascade`. |
| **Budget encumbrance gets** | New endpoint — list with optional `budgetLineId` filter. |
| **Budget line updateRelations** | New endpoint — set/unset `fiscalYearId`. |
| **PR model** | `stepApprovals`, `purchaseOrderItems`, `tender` no longer accessible as PR relations — fetch via child model gets instead. |
| **Tender model** | `offers` no longer accessible as tender relation — fetch via tenderOffer.gets. |
| **Goods receipt add** | Auto-created PaymentOrders now include `payTo` (store) and `financialUnit` relations. |
| **processStep.gets** | New filter: `processId`. |
