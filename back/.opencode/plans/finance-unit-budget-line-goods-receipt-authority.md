# Finance Unit, Budget Line, Goods Receipt Authority

## Changes Overview

### 1. `models/unit.ts` — Add `"Finance"` type
- Add `"Finance"` to `unit_type_array` on line 74

### 2. `models/stepApproval.ts` — Add `budgetLine` relation
- Import `budgetLine_excludes`
- Add: `budgetLine` (single, optional → BudgetLine)

### 3. `src/stepApproval/submitDecision/submitDecision.val.ts`
- Add `budgetLineId: optional(objectIdValidation())` to `set`

### 4. `src/stepApproval/submitDecision/submitDecision.fn.ts`
- Import `budgetLine`
- After unit head check, before approval lookup:
  - Fetch unit's `type` field from `unit.aggregation`
  - If `unit.type === "Finance"` AND `status === "approved"`:
    - If no `budgetLineId` → throw `"Budget line is required when approving from a finance unit"`
    - Fetch BudgetLine's `remainingBudget`
    - Calculate estimated total from PR: `price * quantity`
    - If `remainingBudget < estimatedTotal` → throw `"Insufficient budget"`
    - Fetch BudgetLine doc for code/title
    - Link `budgetLine` to StepApproval via `addRelation`
    - Set `budgetLine` on PR via `addRelation` with `replace: true`
    - Include `budgetLine: { _id, code, title }` in history details
- Update PR aggregation projection to include `stuff: { _id: 1 }`, `selectionType`, `selectedTenderOfferId`, `quantity`, `wareModel: { _id: 1, name: 1, enName: 1 }`

### 5. `src/purchasingRequest/finalize/finalize.val.ts`
- Add `budgetLineId: optional(objectIdValidation())` to `set`

### 6. `src/purchasingRequest/finalize/finalize.fn.ts`
- Import `budgetLine`
- If `budgetLineId` provided:
  - Fetch BudgetLine doc for code/title
  - Update PR's `budgetLine` via `addRelation` with `replace: true`
  - Check remaining budget >= estimated amount
  - Include `budgetLine: { _id, code, title }` in finalized history details

### 7. `src/paymentOrder/markPaid/markPaid.fn.ts` — Budget deduction
- Import `purchasingRequest`, `budgetLine`
- After encumbrance conversion:
  - Fetch PR via `order.purchasingRequest._id`
  - Get `budgetLine._id` from PR
  - If budgetLine exists, `$inc: { totalAllocated: -order.amount }`
  - Recalculate `remainingBudget`

### 8. `src/goodsReceipt/add/` — Authority change
- **`add.fn.ts`**: Add authorization check after fetching PR:
  - Fetch PR's `requester._id` + `requestingUnit._id`
  - Check A: `user._id === pr.requester._id`
  - Check B: user is head of any unit with `type === "Warehouse"`
  - If neither → throw error
  - Validate `receivingUnitId` matches appropriate unit
- **`add.mod.ts`**: grantAccess unchanged, fn.ts handles restriction

### 9. E2E updates
- Finance unit creation
- Budget line creation
- Process steps with finance unit
- submitDecision without budgetLineId → error
- submitDecision with budgetLineId → success
- submitDecision with insufficient budget → error
- finalize with budgetLineId override
- goods receipt by requester vs warehouse head
- markPaid budget deduction
