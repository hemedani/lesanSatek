# StoreHead Delivery → Requester Receipt → OrgHead Payment

## Overview

This release completes the procurement-to-payment lifecycle with a clear separation of duties:

1. **StoreHead** handles physical delivery progression (assigned → ready_to_ship → shipped → delivered)
2. **Requester or Warehouse Head** confirms goods receipt (inventory addition + auto-payment order creation)
3. **OrgHead** authorizes final payment (budget deduction from budget line)

Combined with the Finance unit budget encumbrance (introduced in `22-finance-unit-budget-line-goods-receipt.md`), the full lifecycle is:

```
PR Submitted → Unit Approvals → Finance Approves (budget encumbered)
  → OrgHead Finalizes (stuffStatus = "assigned")
  → StoreHead: ready_to_ship → shipped → delivered
  → Requester/Warehouse: goodsReceipt.add (stuffStatus = "received", inventory added)
  → OrgHead: paymentOrder.markPaid (budget deducted)
```

---

## 1. New Action: `purchasingRequest.updateStuffStatus`

A new action that lets StoreHeads progress the physical delivery of assigned goods through 4 stages.

### Access

- **Manager**, **Admin** — full access
- **StoreHead** — can only update PRs assigned to their own store (validated via `activeRole.scopeId` matching `pr.store._id`)

### Request Format

```json
{
  "model": "purchasingRequest",
  "act": "updateStuffStatus",
  "details": {
    "set": {
      "activeRoleId": "{storeHeadRoleId}",
      "_id": "{prId}",
      "stuffStatus": "ready_to_ship"
    },
    "get": { "_id": 1, "stuffStatus": 1 }
  }
}
```

### `set` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeRoleId` | string (UUID) | yes | Must be a StoreHead role scoped to a store |
| `_id` | string (ObjectId) | yes | The PR to update |
| `stuffStatus` | enum | yes | One of: `"assigned"`, `"ready_to_ship"`, `"shipped"`, `"delivered"` |

### Status Lifecycle

The 4 stages reflect the physical delivery flow. **No order validation is enforced** — any of the 4 values can be set in any sequence. The convention is:

```
assigned  (set automatically by finalize)
   ↓
ready_to_ship  (StoreHead prepares the shipment)
   ↓
shipped        (StoreHead dispatches)
   ↓
delivered      (StoreHead confirms delivery to destination)
```

However, the API does NOT block skipping or re-ordering them, so the frontend should enforce the progression order in the UI.

### StoreHead Authorization (detailed)

1. Extracts `activeRole` from user's roles by matching `activeRoleId`
2. If `activeRole.name === "StoreHead"`:
   - **Validates scope**: `scopeType` must be `"store"` and `scopeId` must be present
   - **Matches store**: checks `pr.store._id === scopeId`
   - If either check fails → throws `"StoreHead role must have a store scope"` or `"You can only update stuff status for PRs assigned to your store"`
3. Manager/Admin bypass all store-scope checks

### Backend Behavior

- Validates `stuffStatus` is one of the 4 enum values
- Fetches the PR (throws 404 if not found)
- Runs StoreHead authorization (see above)
- Updates `purchasingRequest.stuffStatus` to the new value
- Pushes a `stuff_status_updated` history entry with the performed-by object and `details.stuffStatus`
- **No inventory changes** — `delivered` does NOT call `addStock` or decrement store quantity. Inventory is managed solely by `goodsReceipt.add`

### History Entry Shape

```json
{
  "action": "stuff_status_updated",
  "performed": {
    "by": "userObjectId",
    "name": "Sara Store",
    "at": "2026-04-01T10:00:00.000Z",
    "role": {
      "id": "storehead-uuid",
      "name": "StoreHead",
      "scopeType": "store",
      "scopeId": "storeObjectId"
    }
  },
  "details": {
    "stuffStatus": "ready_to_ship"
  }
}
```

---

## 2. `stuffStatus` Filter on `purchasingRequest.gets`

The `gets` action now accepts an optional `stuffStatus` filter so frontends can show PRs filtered by delivery stage.

### New `set` Field

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stuffStatus` | enum (optional) | no | Filter by current delivery stage: `"none"`, `"assigned"`, `"ready_to_ship"`, `"shipped"`, `"delivered"`, `"received"`, `"cancelled"` |

### Request Example

```json
{
  "model": "purchasingRequest",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "...",
      "stuffStatus": "delivered"
    },
    "get": { "_id": 1, "stuffStatus": 1 }
  }
}
```

### Frontend Usage

- **Requester/Warehouse**: filter `stuffStatus: "delivered"` to find PRs ready for goods receipt
- **StoreHead**: filter `stuffStatus: "assigned"` to see PRs awaiting shipment preparation
- **OrgHead**: filter `stuffStatus: "received"` to find PRs with completed receipt, ready for payment

### StoreHead Gets Filtering (reverted)

Previously, StoreHeads were restricted to only seeing `Completed` + `finalizedAt` PRs. This has been **reverted** — StoreHeads now see all PRs assigned to their store (filtered solely by `"store._id": activeRole.scopeId`), regardless of status. This allows StoreHeads to see PRs as soon as they're finalized and assigned (status `"Completed"`, `stuffStatus: "assigned"`).

---

## 3. Budget Encumbrance on Finance Approval

When a Finance unit approves a process step with a budget line, the backend now **automatically creates a budget encumbrance** to reserve funds.

### Trigger

`stepApproval.submitDecision` when both conditions are met:
1. `unitType === "Finance"`
2. `status === "approved"` and budget sufficiency passes

### Backend Behavior

**Step 1 — Create `budgetEncumbrance` document:**
```json
{
  "amount": 15000000,
  "status": "reserved",
  "referenceType": "purchasingRequest",
  "referenceId": "{prId}",
  "description": "Auto-reserved from Finance step approval"
}
```
- Links to `budgetLine` (adds to `budgetLine.encumbrances`)
- Links to `createdBy` (the current user who submitted the decision)

**Step 2 — Update `budgetLine` totals:**
```
$inc: { totalEncumbered: +estimatedTotal }
$set: { remainingBudget: totalAllocated - (totalEncumbered + estimatedTotal) - totalSpent }
```

### Effect on Budget Line Bookkeeping

| Field | Before Finance Approval | After Encumbrance |
|-------|------------------------|-------------------|
| `totalAllocated` | 100,000,000 | 100,000,000 (unchanged) |
| `totalEncumbered` | 20,000,000 | 35,000,000 (inc by 15M) |
| `totalSpent` | 0 | 0 (unchanged) |
| `remainingBudget` | 80,000,000 | 65,000,000 (reduced) |

### Later — Encumbrance Released/Converted

- On `goodsReceipt.add`: auto-converts encumbrance to spent (prorated by receipt amount)
- On `paymentOrder.markPaid`: any remaining reserved encumbrance for that PR is converted to spent
- Budget deduction (`totalAllocated` decrement) happens in `markPaid`, not in the encumbrance step

---

## 4. `goodsReceipt.add` — Authority Rules (no change)

As documented in `22-finance-unit-budget-line-goods-receipt.md`, only two roles can create goods receipts:
- **The PR requester** (goods go to the requesting unit)
- **A Warehouse-type unit head** (goods go to the warehouse)

The `stuffStatus` is automatically set to `"received"` when `goodsReceipt.add` succeeds (this happens inside the goods receipt logic, via the PR update that sets `status: "Completed"` flows).

### Auto-Flows on Goods Receipt (no changes)

When `goodsReceipt.add` succeeds:
1. `inventoryManager.addStock()` — adds to receiving unit's inventory
2. PurchaseOrderItem status → `"received"`
3. Auto-advances workflow (if current step is Receipt/Delivery type)
4. Auto-creates draft `PaymentOrder` for the order total
5. Auto-converts budget encumbrances → spent (prorated)
6. PR gets `stuffStatus: "received"` and status `"Completed"` (if all steps done)

---

## 5. Full End-to-End Lifecycle (Updated)

```
1. PR Created (Draft)
2. PR Submitted (Pending)
3. Unit Approvals (InProgress)
   ├── Step 1: Unit Head A approves (no budget needed)
   ├── Step 2: Unit Head B approves (no budget needed)
   └── Step 3: Finance unit approves (budgetLineId required)
       ├── Checks remainingBudget >= estimatedTotal
       ├── Links budgetLine to StepApproval + PR
       └── Creates budgetEncumbrance (reserves amount)
4. All steps complete → PendingFinalization
5. OrgHead Finalizes (finalize action)
   ├── Sets status = "Completed"
   ├── Sets finalizedAt = now
   ├── Sets stuffStatus = "assigned"
   └── Optional: budgetLine override
---------------------  NEW FLOW BELOW  ---------------------
6. StoreHead: updateStuffStatus("ready_to_ship")
   └── stuffStatus = "ready_to_ship"
7. StoreHead: updateStuffStatus("shipped")
   └── stuffStatus = "shipped"
8. StoreHead: updateStuffStatus("delivered")
   └── stuffStatus = "delivered"
9. Requester/Warehouse: goodsReceipt.add()
   ├── stuffStatus = "received"
   ├── addStock → inventory
   ├── Auto-creates draft PaymentOrder
   └── Converts encumbrance → spent
10. OrgHead: paymentOrder.markPaid()
    └── Deducts budget (totalAllocated -= amount)
```

### Visualization by Role

| Step | Role | Action | stuffStatus |
|------|------|--------|-------------|
| Finalize | OrgHead | `finalize` | assigned |
| Prepare shipment | StoreHead | `updateStuffStatus` | ready_to_ship |
| Dispatch | StoreHead | `updateStuffStatus` | shipped |
| Delivered | StoreHead | `updateStuffStatus` | delivered |
| Goods receipt | Requester/Warehouse Head | `goodsReceipt.add` | received |
| Payment | OrgHead | `paymentOrder.markPaid` | — |

---

## 6. History Actions

| History `action` | When | Set By |
|------------------|------|--------|
| `stuff_status_updated` | Every call to `updateStuffStatus` | StoreHead / Manager / Admin |
| `goods_received` | `goodsReceipt.add` | Requester / Warehouse Head |

The `stuff_status_updated` entry includes `details.stuffStatus` showing which stage was set.

---

## 7. Key Design Decisions

### Why no inventory management on delivery?

`delivered` no longer calls `addStock` or decrements store quantity. This prevents double-counting with `goodsReceipt.add`, which is the single source of truth for inventory additions. StoreHead's responsibility ends at marking the goods as physically delivered; inventory tracking begins when the requester/warehouse confirms receipt.

### Why no progression validation?

The `updateStuffStatus` action accepts all 4 enum values without enforcing order. This gives flexibility for edge cases (e.g., a StoreHead might skip "ready_to_ship" if the process allows direct dispatch). The frontend should enforce the progression visually.

### Budget encumbrance vs budget deduction

- **Encumbrance** (on Finance approval): reserves the amount so it can't be re-allocated to another PR
- **Deduction** (on markPaid): permanently reduces `totalAllocated` when money actually leaves the organization
- **Conversion** (on goodsReceipt + markPaid): moves encumbered amount into `totalSpent`

---

## 8. Summary of API Changes

### New Actions

| Model | Action | Access |
|-------|--------|--------|
| `purchasingRequest` | `updateStuffStatus` | Manager, Admin, StoreHead |

### New/Changed Fields

| Action | Field | Type | Condition |
|--------|-------|------|-----------|
| `purchasingRequest.updateStuffStatus` | `_id` | ObjectId | Required |
| `purchasingRequest.updateStuffStatus` | `stuffStatus` | enum | Required: `assigned / ready_to_ship / shipped / delivered` |
| `purchasingRequest.gets` | `stuffStatus` | enum (optional) | Filter: `none / assigned / ready_to_ship / shipped / delivered / received / cancelled` |
| `stepApproval.submitDecision` | *(no new fields)* | — | Auto-creates budgetEncumbrance when Finance approves |

### New Model Fields (already existed, now used actively)

| Model | Field | Type | Default |
|-------|-------|------|---------|
| `purchasingRequest` | `stuffStatus` | string | `"none"` |

### New Auto-created Documents

| Document | Trigger | Created By |
|----------|---------|------------|
| `budgetEncumbrance` (reserved) | Finance approves step with budgetLine | Backend (submitDecision) |
