# Finance Unit, Budget Line & Goods Receipt Authority

## Overview

This release adds three interconnected features to the procurement lifecycle:

1. **Finance Unit** — A new unit type (`"Finance"`) for financial management units
2. **Budget Line Linkage** — When a Finance unit approves a process step, they must specify a BudgetLine; if insufficient budget remains, the approval is rejected
3. **Goods Receipt Authority** — Only the PR's requester or a Warehouse-type unit head can confirm goods delivery

---

## 1. Unit Type: `"Finance"`

The `unit_type_array` now includes `"Finance"`: `["General", "Warehouse", "Logistics", "Production", "Administration", "Finance", "Expert"]`

A Finance unit represents financial management (budget, treasury, accounting). When such a unit appears in a process step's `assigneeGroups`, its head must provide a `budgetLineId` when approving.

### Creating a Finance unit

Standard unit creation — just set `type: "Finance"`:

```json
{
  "model": "unit",
  "act": "add",
  "details": {
    "set": {
      "activeRoleId": "...",
      "name": "واحد مالی",
      "enName": "Finance Unit",
      "type": "Finance",
      "organizationId": "...",
      "headId": "..."
    },
    "get": { "_id": 1, "name": 1, "type": 1 }
  }
}
```

---

## 2. Budget Line in Step Approval

### `stepApproval.submitDecision` — Updated

The `submitDecision` action now accepts an optional `budgetLineId` field.

**New `set` field:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budgetLineId` | string (ObjectId) | **conditional** | **Required** when the approving unit's `type` is `"Finance"` AND `status` is `"approved"`. If missing, the backend throws: `"Budget line is required when approving from a finance unit"` |

### Request example (Finance unit approval)

```json
{
  "model": "stepApproval",
  "act": "submitDecision",
  "details": {
    "set": {
      "activeRoleId": "...",
      "purchasingRequestId": "{prId}",
      "processStepId": "{stepId}",
      "status": "approved",
      "comment": "Approved with budget allocation",
      "budgetLineId": "{budgetLineId}"
    },
    "get": {
      "_id": 1,
      "status": 1,
      "budgetLine": { "_id": 1, "code": 1, "title": 1 }
    }
  }
}
```

### Backend behavior (step by step)

1. Resolves the approving unit's `type` field
2. If `type === "Finance"` AND `status === "approved"`:
   - **Validates `budgetLineId` is present** → throws if missing
   - **Calculates estimated total** from PR's `selectionType`:
     - If `selectionType === "stuff"` → uses `Stuff.price` (absolute) or `Ware.price * (1 + pricePercentage / 100)` (percentage)
     - If `selectedTenderOfferId` → uses `TenderOffer.price`
     - `estimatedTotal = unitPrice * quantity`
   - **Fetches BudgetLine's `remainingBudget`**
   - **Checks sufficiency**: if `remainingBudget < estimatedTotal` → throws `"Insufficient budget: remaining ({remainingBudget}) is less than required ({estimatedTotal})"`
   - **Links budgetLine to StepApproval** via Lesan `addRelation` for audit trail
   - **Sets budgetLine on the PurchasingRequest** via `addRelation` with `replace: true`
   - **Includes budgetLine in history** — both `step_approved` and `all_steps_approved` entries contain:
     ```json
     "budgetLine": { "_id": "...", "code": "BL-1403-001", "title": "خرید تجهیزات" }
     ```

### Notes

- `budgetLineId` is only validated when `status === "approved"` (rejecting doesn't require it)
- Budget sufficiency is checked against the PR's current estimated amount (stuff price × quantity or tender offer price × quantity at the time of approval)
- If the unit is not Finance, `budgetLineId` is accepted but not required — other units may optionally link a budget line

---

## 3. OrgHead Budget Line Override in `finalize`

### `purchasingRequest.finalize` — Updated

The finalize action now accepts an optional `budgetLineId` field, allowing the OrgHead to change the PR's budget line at finalization time.

**New `set` field:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budgetLineId` | string (ObjectId) | no | Override the budget line assigned during step approval. If provided, checks remaining budget >= estimated amount before setting |

### Request example

```json
{
  "model": "purchasingRequest",
  "act": "finalize",
  "details": {
    "set": {
      "activeRoleId": "{orgHeadRoleId}",
      "_id": "{prId}",
      "finalWinner": "stuff",
      "budgetLineId": "{newBudgetLineId}"
    },
    "get": {
      "_id": 1,
      "status": 1,
      "budgetLine": { "_id": 1, "code": 1, "title": 1 }
    }
  }
}
```

### Backend behavior

- Fetches the new BudgetLine's `remainingBudget` and compares against `estimatedAmount`
- If insufficient → throws error
- Links the new budgetLine to the PR via `addRelation` with `replace: true`
- Includes `budgetLine` in the `finalized` history entry details

---

## 4. Budget Line Deduction on Payment

### `paymentOrder.markPaid` — Updated

When a payment order is marked as paid, the budget line's `totalAllocated` is **permanently reduced** by the payment amount.

### Backend behavior

After converting reserved encumbrances to spent:
1. Fetches the PR linked to the payment order
2. Reads the `budgetLine._id` from the PR
3. If budgetLine exists:
   - `$inc: { totalAllocated: -paymentAmount }`
   - Recalculates: `remainingBudget = (totalAllocated - paymentAmount) - totalEncumbered - totalSpent`

This ensures the budget line's effective capacity decreases when money is actually paid out, preventing re-allocation of the same funds.

---

## 5. Goods Receipt Authority

### `goodsReceipt.add` — Authorization Change

Goods delivery confirmation is now restricted to two authorized parties:
- **The PR's requester** (the user who created the purchasing request)
- **The head of a Warehouse-type unit** (any unit where the user is `head` and `type === "Warehouse"`)

### Request format (unchanged)

```json
{
  "model": "goodsReceipt",
  "act": "add",
  "details": {
    "set": {
      "activeRoleId": "...",
      "receiptNumber": "GR-1403-001",
      "receivedAt": "2024-06-20T10:00:00Z",
      "purchasingRequestId": "{prId}",
      "receivedById": "{userId}",
      "receivingUnitId": "{unitId}",
      "items": [...]
    },
    "get": { "_id": 1 }
  }
}
```

### Backend authorization flow

1. **Fetches the PR** with `requester._id` and `requestingUnit._id`
2. **Resolves who is receiving** (identity-based; client-supplied `receivingUnitId` is **ignored** for routing):
   - `isRequester` — `pr.requester._id === user._id`
   - `isRequestingUnitHead` — the PR's `requestingUnit.head._id === user._id`
   - `isWarehouseHead` — the user heads a unit with `type: "Warehouse"` (via `unit.aggregation({ $match: { type: "Warehouse", "head._id": user._id } })`)
3. **Authorization:** if none of the three → throws `"Only the requester, the requesting unit head, or the central warehouse head can confirm goods delivery"`
4. **Receiving unit is derived** from identity:
   - central warehouse head → the warehouse unit they head (central warehouse)
   - otherwise (requester / requesting unit head / requesting-unit employee) → the PR's `requestingUnit`
5. **Guard:** if the PR has no `requestingUnit` → throws `"Purchasing request has no requesting unit to receive goods into"`

### Frontend UX implications

- The goods receipt pages should be available to:
  - The PR requester and requesting-unit head/employee in their PR detail view (inventory → their requesting unit)
  - Central warehouse head on the goods-receipt page (inventory → central warehouse; sees all org-delivered PRs)
- If the current user matches none of the three identities, the receive button should be hidden
- The frontend still sends a syntactically valid `receivingUnitId` (e.g. the PR's `requestingUnit._id` or the warehouse id) because `add.val.ts` requires an ObjectId, even though the backend ignores its value for routing

---

## Summary of New/Changed API Fields

| Action | New Field | Type | Condition |
|--------|-----------|------|-----------|
| `stepApproval.submitDecision` | `budgetLineId` | ObjectId | Required when Finance unit approves |
| `purchasingRequest.finalize` | `budgetLineId` | ObjectId | Optional — overrides budget line |
| `paymentOrder.markPaid` | *(no new fields)* | — | Auto-deducts budget line `totalAllocated` |
| `goodsReceipt.add` | *(no new fields)* | — | Authorization checks requester / requesting unit head / warehouse head; receiving unit derived from identity |

## Response Enrichments

| History Action | New Field in `details` |
|----------------|----------------------|
| `step_approved` | `budgetLine: { _id, code, title }` |
| `all_steps_approved` | `budgetLine: { _id, code, title }` |
| `finalized` | `budgetLine: { _id, code, title }` |

## StepApproval Enrichment

The `stepApproval` model now has a `budgetLine` single relation (optional → BudgetLine). When fetching a stepApproval, request `budgetLine: { _id: 1, code: 1, title: 1 }` to see which budget line was assigned at which step.
