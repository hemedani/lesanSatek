# PR Add / Submit Refactor Plan

## Problem
- `add` function was doing too much: process resolution, estimatedAmount, complex relations
- `submit` function was duplicating add logic instead of transitioning an existing Draft PR
- `estimatedAmount` no longer needed (price determined at submission/vendor assignment)
- Need proper role separation: anyone can register a need (`add`), unit head approves (`submit`)

## Files to change

### 1. `models/featureConstants.ts`
- Add `"canSubmitPurchaseRequest"` to `feature_array`

### 2. `models/purchasingRequest.ts`
- Make `process` relation optional (`optional: false` → `optional: true`)

### 3. `src/purchasingRequest/add/add.val.ts`
- Remove: `estimatedAmount`, `requestingUnitId`, `attachmentIds`, `storeId`, `wareId`, `wareTypeId`, `wareClassId`, `wareGroupId`, `status`, `currentStep`, `requestedAt`, `completedAt`
- Keep: `activeRoleId`, `title`, `description`, `quantity`, `wareModelId`

### 4. `src/purchasingRequest/add/add.fn.ts`
- Remove: `estimatedAmount`, process resolution (`resolveProcessForPR` + process relation), hierarchy/ware relations, budgetLine
- Simplify: create Draft PR with only `requester`, `wareModel`, `requestingUnit` (from activeRole.scopeId)
- Derive `requestingUnitId` from activeRole.scopeId
- Derive `organizationId` from user.organizations (not stored on PR, just for validation)
- History: `action: "created"` with performed role info

### 5. `src/purchasingRequest/add/mod.ts`
- Update `grantAccess`:
```typescript
grantAccess([
  { roles: ["Manager", "Admin"] },
  { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canRegisterPurchaseRequest"] },
])
```

### 6. `src/purchasingRequest/submit/submit.val.ts`
- Replace creation fields with `_id: objectIdValidation` (target Draft PR)
- Remove: `title`, `description`, `estimatedAmount`, `quantity`, `wareModelId`, `budgetLineId`, `attachmentIds`, `wareId`, `wareTypeId`, `wareClassId`, `wareGroupId`
- Keep: `activeRoleId`, `_id`, `storeId` (optional), `requestingUnitId` (optional override)

### 7. `src/purchasingRequest/submit/submit.fn.ts`
Complete rewrite:
1. Fetch Draft PR by `_id`, validate `status === "Draft"`
2. Derive `organizationId` from user.organizations
3. Derive `requestingUnitId` from activeRole.scopeId (or override from set)
4. Validate submitter's unit matches PR's requestingUnit
5. **Tender check**: Query `tender` by `purchasingRequest._id` → if exists and not "awarded", block
6. **Store assignment** (if storeId): lookup Stuff pricing, create PurchaseOrderItem, push history
7. Resolve process via `resolveProcessForPR`
8. Link process to PR via `addRelation`
9. Create StepApprovals for first step
10. Update PR: `status: "Pending"`, push `submitted` history
11. Return updated PR

### 8. `src/purchasingRequest/submit/mod.ts`
- Update `grantAccess`:
```typescript
grantAccess([
  { roles: ["Manager", "Admin"] },
  { roles: ["OrgHead", "UnitHead", "Employee"], features: ["canSubmitPurchaseRequest"] },
])
```
- Unit matching validated inline in fn.ts

## Edge Cases
- Draft PR with process=null → submit links it
- Draft PR with existing unawarded tender → submit blocks
- Draft PR with existing awarded tender → submit allows (PO item already exists from award)
- Draft PR with storeId → submit creates PO item
- Draft PR without storeId or tender → submit just transitions to Pending
- Submitter's unit != PR's requestingUnit → block
