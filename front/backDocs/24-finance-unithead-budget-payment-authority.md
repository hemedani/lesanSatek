# Finance Unit Head — Full Budget & Payment Authority

## Overview

This release upgrades the **UnitHead of a Finance-type unit** to a full budget and payment manager role. The Finance head can:

- Full CRUD on budget lines, allocations, encumbrances, and fiscal years
- View all payment orders within their organization
- Execute payments (mark as paid) after OrgHead authorization
- Directly deduct from a budget line (non-PR expenses)
- View budget reports

---

## Feature Flags (3 new activations)

Three previously-defined feature flags are now enforced:

| Feature | Purpose |
|---------|---------|
| `canManageBudget` | Allows creating/editing/deleting budget lines, allocations, encumbrances, fiscal years |
| `canIssuePaymentOrder` | Allows creating payment orders and marking them as paid |
| `canViewBudgetReports` | Allows viewing budget reports (getBudgetReport, getYearEndReport) |

**Assignment:** Add these to the user's `features` array on creation or via update. The Finance UnitHead user (fatemeh in E2E) and the Finance employee (maryam) both receive all three features.

---

## New Action: `budgetLine.deductDirect`

A direct budget deduction that bypasses the encumbrance/purchase lifecycle. Used for non-PR expenses (one-off payments, refunds, adjustments).

### Request Format

```json
{
  "model": "budgetLine",
  "act": "deductDirect",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "{budgetLineId}",
      "amount": 100000,
      "description": "Adjustment for returned goods"
    },
    "get": {
      "_id": 1,
      "totalAllocated": 1,
      "remainingBudget": 1
    }
  }
}
```

### Backend Behavior

1. Validates Finance unit access (for UnitHead roles) via `checkFinanceUnitAccess`
2. Validates `amount > 0`
3. Fetches budgetLine, checks `remainingBudget >= amount` → throws if insufficient
4. `$inc: { totalAllocated: -amount }`
5. Recalculates `remainingBudget = (totalAllocated - amount) - totalEncumbered - totalSpent`
6. Returns the updated budgetLine

### Authorization

| Role | Access |
|------|--------|
| Manager, Admin | Full |
| OrgHead | Full |
| UnitHead (Finance) | Only with `canIssuePaymentOrder` feature |
| Others | Denied |

---

## Updated Authorization Matrix

### Budget Line

| Action | Previously | Now |
|--------|------------|-----|
| `add` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |
| `update` | Manager, Admin | + UnitHead with `canManageBudget` |
| `updateRelations` | Manager, Admin | + UnitHead with `canManageBudget` |
| `remove` | Manager, Admin | + UnitHead with `canManageBudget` |
| `count` | Manager, Admin | **All roles** |
| `get`, `gets` | All roles (no change) | — |
| `getBudgetReport` | Manager, Admin, OrgHead, UnitHead, Employee | UnitHead/Employee now require `canViewBudgetReports` |
| `getYearEndReport` | Manager, Admin, OrgHead, UnitHead, Employee | UnitHead/Employee now require `canViewBudgetReports` |

### Budget Allocation

| Action | Previously | Now |
|--------|------------|-----|
| `add` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |
| `remove` | Manager, Admin | + UnitHead with `canManageBudget` |

### Budget Encumbrance

| Action | Previously | Now |
|--------|------------|-----|
| `add` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |
| `release` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |
| `convertToSpend` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |
| `remove` | Manager, Admin | + UnitHead with `canManageBudget` |

### Fiscal Year

| Action | Previously | Now |
|--------|------------|-----|
| `add` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |
| `update` | Manager, Admin | + UnitHead with `canManageBudget` |
| `close` | Manager, Admin, OrgHead | + UnitHead with `canManageBudget` |

### Payment Order

| Action | Previously | Now |
|--------|------------|-----|
| `add` | Manager, Admin, OrgHead, UnitHead, Employee | UnitHead needs `canIssuePaymentOrder`; Employee needs `canIssuePaymentOrder` |
| `markPaid` | Manager, Admin, OrgHead, UnitHead, Employee | Same feature gating |
| `update` | Manager, Admin | + OrgHead, + UnitHead with `canIssuePaymentOrder` |

---

## Finance Unit Validation (`checkFinanceUnitAccess`)

A new utility (`utils/checkFinanceUnitAccess.ts`) runs at the start of every budget/payment action that a UnitHead can call.

**Behavior:**

1. Extracts `activeRoleId` from the request body
2. Finds the active role in the user's roles
3. If the role is NOT `UnitHead` → skip check (Manager, Admin, OrgHead pass through)
4. If the role IS `UnitHead`:
   - Validates `scopeType === "unit"` and `scopeId` is present
   - Fetches the unit from DB
   - Checks `unit.type === "Finance"` → throws if not

**Error messages:**
- `"Finance unit head must have a unit scope"` — if scope is missing/invalid
- `"Only the head of a Finance unit can manage budgets and payments"` — if unit type is not Finance

---

## Payment Order Org Scoping

`paymentOrder.gets` now scopes results by the active role's organization, so the Finance head only sees payment orders within their org.

### Scoping Logic

| Role | Scope |
|------|-------|
| Manager, Admin | No filter (see all) |
| OrgHead | `financialUnit.organization._id` = their org scope |
| UnitHead | Resolves the scoped unit's `organization._id` and filters by it |
| Other roles | No org filter |

The scoping filters by `financialUnit.organization._id` — since Lesan embeds single relations, the payment order document contains the full unit subdocument (including its organization relation).

---

## Payment Lifecycle (Updated)

The full procure-to-pay flow now includes the Finance head review:

```
PR Submitted → Unit Approvals → Finance Approves (budget encumbered)
  → OrgHead Finalizes → StoreHead delivers
  → Requester goodsReceipt (auto-creates draft PaymentOrder)
  → OrgHead updates paymentOrder → status: "sent_to_finance"
  → Finance Head marks paid → budget deducted
```

**Step-by-step:**

| Step | Who | Action | Result |
|------|-----|--------|--------|
| 1 | System (goodsReceipt) | Auto-create | PaymentOrder created as `"draft"` |
| 2 | OrgHead | `paymentOrder.update` | Sets `status: "sent_to_finance"` |
| 3 | Finance UnitHead | `paymentOrder.markPaid` | Sets `status: "paid"`, converts encumbrances, deducts budget |

---

## Frontend Usage

### Finance Dashboard

The Finance UnitHead needs a dashboard with:

1. **Budget overview** — budgetLine.gets with org filter, showing totalAllocated/remainingBudget per line
2. **Budget line detail** — linked allocations and encumbrances
3. **Payment orders** — paymentOrder.gets with `status: "sent_to_finance"` filter
4. **Payment action** — markPaid button on eligible payment orders
5. **Create allocation** — budgetAllocation.add form
6. **Direct deduction** — budgetLine.deductDirect form for non-PR expenses
7. **Fiscal year management** — add/close fiscal years
8. **Budget reports** — getBudgetReport, getYearEndReport

### Available Filters on `paymentOrder.gets`

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `draft`, `sent_to_finance`, `paid`, `cancelled` |
| `financialUnitId` | ObjectId | Filter by financial unit |
| `purchasingRequestId` | ObjectId | Filter by PR |

No changes to the gets validator — org scoping is automatic from the active role.

---

## Summary of API Changes

### New Actions

| Model | Action | Access |
|-------|--------|--------|
| `budgetLine` | `deductDirect` | Manager, Admin, OrgHead, UnitHead (with `canIssuePaymentOrder`) |

### Authorization Changes Only (no new fields)

All budget/payment models have updated `grantAccess` in their `mod.ts` files. No changes to validators, response shapes, or model schemas.

### New Internal Utility

| File | Purpose |
|------|---------|
| `utils/checkFinanceUnitAccess.ts` | Validates UnitHead's scoped unit is Finance type |
