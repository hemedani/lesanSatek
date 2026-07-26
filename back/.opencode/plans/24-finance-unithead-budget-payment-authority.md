# Finance Unit Head Full Budget & Payment Authority

## Objective
Give the UnitHead of a Finance-type unit full CRUD control over budgets (lines, allocations, encumbrances, fiscal years), visibility of all payment orders in their org, ability to mark payments as paid, and a new direct budget deduction action.

## Design Decisions
- Use existing (but unused) feature flags `canManageBudget`, `canIssuePaymentOrder`, `canViewBudgetReports` as the activation gate
- New `checkFinanceUnitAccess` utility validates the UnitHead's scoped unit has `type: "Finance"`
- `paymentOrder.gets` scopes by `financialUnit.organization._id` inferred from `activeRoleId`
- No model schema changes — all existing fields and relations reused

## File Changes

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `utils/checkFinanceUnitAccess.ts` | Utility to validate Finance unit scope for UnitHead |
| 2-4 | `src/budgetLine/deductDirect/{mod,fn,val}.ts` | New direct budget deduction action |

### Modified Files — GrantAccess Only (mod.ts)
| # | File | Change |
|---|------|--------|
| 5 | `src/budgetLine/add/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 6 | `src/budgetLine/update/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 7 | `src/budgetLine/updateRelations/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 8 | `src/budgetLine/remove/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 9 | `src/budgetLine/count/mod.ts` | Widen to all roles |
| 10 | `src/budgetLine/getBudgetReport/mod.ts` | + `features: [canViewBudgetReports]` on UnitHead/Employee |
| 11 | `src/budgetLine/getYearEndReport/mod.ts` | same |
| 12 | `src/budgetAllocation/add/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 13 | `src/budgetAllocation/remove/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 14 | `src/budgetEncumbrance/add/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 15 | `src/budgetEncumbrance/release/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 16 | `src/budgetEncumbrance/convertToSpend/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 17 | `src/budgetEncumbrance/remove/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 18 | `src/fiscalYear/add/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 19 | `src/fiscalYear/update/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 20 | `src/fiscalYear/close/mod.ts` | + `{ UnitHead, canManageBudget }` |
| 21 | `src/paymentOrder/add/mod.ts` | Restructure: `[Manager,Admin],[OrgHead],[UnitHead,canIssuePaymentOrder],[Employee,canIssuePaymentOrder]` |
| 22 | `src/paymentOrder/markPaid/mod.ts` | same restructure |
| 23 | `src/paymentOrder/update/mod.ts` | + `{ OrgHead }` |
| 24 | `src/budgetLine/mod.ts` | Register deductDirect |

### Modified Files — Fn Logic (fn.ts)
| # | File | Change |
|---|------|--------|
| 25 | `src/budgetLine/add/add.fn.ts` | + checkFinanceUnitAccess |
| 26 | `src/budgetLine/update/update.fn.ts` | + checkFinanceUnitAccess |
| 27 | `src/budgetLine/updateRelations/updateRelations.fn.ts` | + checkFinanceUnitAccess |
| 28 | `src/budgetLine/remove/remove.fn.ts` | + checkFinanceUnitAccess |
| 29 | `src/budgetAllocation/add/add.fn.ts` | + checkFinanceUnitAccess |
| 30 | `src/budgetAllocation/remove/remove.fn.ts` | + checkFinanceUnitAccess |
| 31 | `src/budgetEncumbrance/add/add.fn.ts` | + checkFinanceUnitAccess |
| 32 | `src/budgetEncumbrance/release/release.fn.ts` | + checkFinanceUnitAccess |
| 33 | `src/budgetEncumbrance/convertToSpend/convertToSpend.fn.ts` | + checkFinanceUnitAccess |
| 34 | `src/budgetEncumbrance/remove/remove.fn.ts` | + checkFinanceUnitAccess |
| 35 | `src/fiscalYear/add/add.fn.ts` | + checkFinanceUnitAccess |
| 36 | `src/fiscalYear/update/update.fn.ts` | + checkFinanceUnitAccess |
| 37 | `src/fiscalYear/close/close.fn.ts` | + checkFinanceUnitAccess |
| 38 | `src/paymentOrder/add/add.fn.ts` | + checkFinanceUnitAccess |
| 39 | `src/paymentOrder/markPaid/markPaid.fn.ts` | + checkFinanceUnitAccess |
| 40 | `src/paymentOrder/gets/gets.fn.ts` | Add org-scoping by activeRoleId |

### Other Modified Files
| # | File | Change |
|---|------|--------|
| 41 | `http/e2e.json` | Add 3 features to fatemeh, add deductDirect test |
| 42 | `http/e2e-with-remove.json` | same |
| 43 | `front/backDocs/24-finance-unithead-budget-payment-authority.md` | NEW — frontend doc |

## Implementation Order
1. Create `checkFinanceUnitAccess.ts`
2. Create `deductDirect` action files
3. Edit all mod.ts grantAccess (batch)
4. Edit all fn.ts logic (batch)
5. Edit paymentOrder gets fn
6. Edit budgetLine mod.ts to register deductDirect
7. Update e2e JSONs
8. Create frontend doc
9. Verify compilation
