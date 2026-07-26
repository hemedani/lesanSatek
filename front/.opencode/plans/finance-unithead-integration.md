# Finance UnitHead — Full Budget & Payment Integration Plan

## Objective

Integrate full finance capabilities (budget management, payment execution, direct deductions, fiscal year management, reports) into the existing `/unit-head` panel when the user's scoped unit has `type: "Finance"`.

## Current State

- Unit-head layout: `PanelLayout` (top header only, no sidebar)
- Navigation: Dashboard cards -> `/unit-head/requests/*`, `/unit-head/goods-receipt`
- Finance detection: None — dashboard never checks `unit.type`
- `/finance` panel: Exists but is read-only (DataTable views), guarded by `canManageBudget`
- OrgHead payment flow: Calls `markPaid` directly, skips `sent_to_finance` step
- `budgetLine.deductDirect`: ReqType exists, no server action file
- `canIssuePaymentOrder` / `canViewBudgetReports`: Defined in permissions, not wired in frontend

## Phases

### Phase 1: Detect Finance Unit + Dashboard Cards

**File:** `src/app/unit-head/page.tsx`

- Add `getUnit` call to fetch user's unit and check `type === "Finance"`
- Show finance nav cards on dashboard when Finance unit:
  - "ردیف‌های بودجه" -> `/unit-head/finance/budget-lines`
  - "پرداخت‌ها" -> `/unit-head/finance/payment-orders`
  - "گزارش بودجه" -> `/unit-head/finance/budget-reports`
  - "سال مالی" -> `/unit-head/finance/fiscal-years`

### Phase 2: Create `budgetLine.deductDirect` Server Action

**New file:** `src/app/actions/budgetLine/deductDirect.ts`
- Standard Server Action pattern
- Wraps `ReqType["main"]["budgetLine"]["deductDirect"]`
- Returns `{ _id, totalAllocated, remainingBudget }`

### Phase 3: Budget-Line Management Pages

**New files under `src/app/unit-head/finance/`:**

| Route | Page | UX |
|-------|------|-----|
| `/finance` | `page.tsx` | Summary stat cards + nav to sub-pages |
| `/finance/budget-lines` | `budget-lines/page.tsx` | Glass-card list (code, title, allocated, remaining, fiscalYear) + add/delete via dialogs |
| `/finance/budget-lines/[id]` | `budget-lines/[id]/page.tsx` | Detail: budget line info, allocations list, encumbrances list, direct deduction form |
| `/finance/payment-orders` | `payment-orders/page.tsx` | List of `status: "sent_to_finance"` POs, each with "تأیید پرداخت" -> ConfirmDialog -> `markPaid` |
| `/finance/budget-reports` | `budget-reports/page.tsx` | Summary stat cards + budget breakdown table, optionally getBudgetReport |
| `/finance/fiscal-years` | `fiscal-years/page.tsx` | List + add form + close button per item |

**Correct field names** (per ReqType):
- `totalAllocated` (not `totalAmount`)
- `remainingBudget` (not `remainingAmount`)
- `totalEncumbered`, `totalSpent`, `remainingBudget`

### Phase 4: Fix Payment Lifecycle — OrgHead sends to Finance

**Files to change:**

| File | Change |
|------|--------|
| `src/app/orghead/requests/requests-client.tsx` | Replace `markPaid` -> `paymentOrder.update({ _id: po._id, status: "sent_to_finance" })`. Button label: "ارسال به مالی" |
| `src/app/orghead/requests/[id]/orghead-pr-detail-client.tsx` | Replace `markPaid` -> `paymentOrder.update({ _id: draftPO._id, status: "sent_to_finance" })`. Card title: "ارسال به مالی" |
| `src/app/orghead/requests/page.tsx` | No change (still fetches draft POs) |

### Phase 5: Wire Feature Flags

**File:** `src/app/finance/layout.tsx`
- Add `canIssuePaymentOrder` and `canViewBudgetReports` to `PanelGuard`
- Add `finance/layout.tsx` under unit-head route

## Files

### New (9)
1. `src/app/actions/budgetLine/deductDirect.ts`
2. `src/app/unit-head/finance/layout.tsx`
3. `src/app/unit-head/finance/page.tsx`
4. `src/app/unit-head/finance/budget-lines/page.tsx`
5. `src/app/unit-head/finance/budget-lines/[id]/page.tsx`
6. `src/app/unit-head/finance/payment-orders/page.tsx`
7. `src/app/unit-head/finance/payment-orders/[id]/page.tsx`
8. `src/app/unit-head/finance/budget-reports/page.tsx`
9. `src/app/unit-head/finance/fiscal-years/page.tsx`

### Modified (4)
1. `src/app/unit-head/page.tsx`
2. `src/app/orghead/requests/requests-client.tsx`
3. `src/app/orghead/requests/[id]/orghead-pr-detail-client.tsx`
4. `src/app/finance/layout.tsx`
