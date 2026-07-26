## New Backend Action: `purchasingRequest.getPendingByUnit`

### Purpose
Replace the current approach of calling `stepApproval.gets` with `unitId` + `status: "pending"` to find purchasing requests that a unit head needs to approve. The old approach returned stepApproval records (not PRs) and missed PRs where no StepApproval document had been created yet for that unit.

The new action returns **full PurchasingRequest documents** that are pending action from a specific unit at the current workflow step.

### How it works (backend logic)
For each PR that is not Completed/Rejected/Cancelled:
1. Finds the process step at index `currentStep`
2. Checks if the given `unitId` appears in that step's `assigneeGroups[].unitIds`
3. Checks if a StepApproval exists for that PR + step + unit
4. Returns the PR only if no StepApproval exists yet, or the existing one has `status: "pending"`

The `unitId` is automatically derived from the authenticated user's active role (if the role has `scopeType: "unit"`), so the frontend should NOT pass `unitId` in most cases — the backend resolves it from the JWT/role context.

### Request format

```
POST /api (or via Lesan playground)
model: purchasingRequest
act: getPendingByUnit
```

**`set` fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `activeRoleId` | string | **yes** | — | The user's active role UUID (standard for all actions) |
| `unitId` | string (ObjectId) | no | derived from activeRole | Override the unit ID (only needed for Manager/Admin who lack unit scope) |
| `page` | number | no | `1` | Page number for pagination |
| `limit` | number | no | `50` | Items per page |
| `search` | string | no | — | Full-text search on PR `title` and `description` fields |

**`get` field:**
Same as standard `purchasingRequest.gets` — use `selectStruct("purchasingRequest", 2)` depth. This returns the full PR document with all relations: `stuff`, `requester`, `requestingUnit`, `wareModel`, `budgetLine`, `store`, `process` (with nested `steps` + `approvals` + `unit.head` + `decidedBy`), `stepApprovals`, `goodsReceipts`, `paymentOrders`, `tenders` (with nested `offers` + `store`), `history`, etc.

### Response format
Returns an **array** of PurchasingRequest documents (consistent with `gets`):

```typescript
type GetPendingByUnitResponse = PurchasingRequest[]  // sorted by createdAt desc, paginated
```

### Example usage (frontend)

```typescript
// Before (old approach — DO NOT USE):
const approvals = await api.call("stepApproval", "gets", {
  set: { activeRoleId, unitId, status: "pending" },
  get: { purchasingRequest: { _id: 1, title: 1, status: 1 } },
});
// Returns stepApproval records, not PRs. Misses PRs without stepApproval docs.

// After (new approach):
const pendingRequests = await api.call("purchasingRequest", "getPendingByUnit", {
  set: { activeRoleId, page: 1, limit: 20 },
  get: {
    _id: 1, title: 1, description: 1, quantity: 1, status: 1,
    currentStep: 1, createdAt: 1, updatedAt: 1, selectionType: 1,
    requester: { _id: 1, first_name: 1, last_name: 1 },
    wareModel: { _id: 1, name: 1 },
    requestingUnit: { _id: 1, name: 1 },
    process: {
      _id: 1, name: 1,
      steps: {
        _id: 1, name: 1, order: 1, stepType: 1,
        assigneeGroups: 1,
        approvals: {
          _id: 1, status: 1, comment: 1, decidedAt: 1,
          unit: { _id: 1, name: 1, head: { _id: 1, first_name: 1, last_name: 1 } },
          decidedBy: { _id: 1, first_name: 1, last_name: 1 },
        },
      },
    },
    stepApprovals: {
      _id: 1, status: 1, comment: 1,
      processStep: { _id: 1, name: 1 },
      unit: { _id: 1, name: 1 },
      decidedBy: { _id: 1, first_name: 1, last_name: 1 },
    },
  },
});
// Returns full PR documents directly — all data needed for the approval UI in one call
```

### Migration from the old approach

**What to replace:**
- Any call to `stepApproval.gets` with filter `{ unitId, status: "pending" }` that was used to find pending approvals.
- Any logic that iterated over stepApproval results to extract the related PR.

**What stays:**
- `stepApproval.gets` is still used for **other** filtering needs (e.g., viewing the approval history of a specific step, or checking if a user has already voted).
- The `purchasingRequest.get` single-detail page (which already includes `stepApprovals` as a nested relation) remains the same.

### Key advantages
1. **One call instead of two**: No need to fetch approvals then fetch each PR separately.
2. **Complete PR data**: Each result is a full PR with all relations already embedded.
3. **Correct semantics**: Returns PRs where the unit **has not yet acted**, including PRs where the StepApproval record hasn't been created yet (because the PR just advanced to the current step).
4. **No stale PRs**: Only PRs at a step where the unit is actually an assignee are returned.
5. **Pagination built-in**: Standard page/limit pagination with descending `createdAt` sort.
