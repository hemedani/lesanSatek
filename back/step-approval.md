# Process & Step Approval System

## Overview

The purchasing system is built around a **process workflow engine**. A **Process** defines a series of ordered steps. A **PurchasingRequest (PR)** flows through these steps, and at each step, assigned **units** must approve/reject the request before it advances to the next step.

---

## Key Models

### Process
- Defines a workflow (Draft → Active → Archived)
- Has many **ProcessSteps** (ordered by `order` field)
- Custom actions: `activateProcess`, `duplicateProcess`

### ProcessStep
- A single step in a process
- Fields: `name`, `description`, `stepType` (Approval|Review|Notification|Action|Delivery|Receipt|Payment), `order`, `required`
- Has `groupsOperator` (AND|OR) and `assigneeGroups` — embedded array defining which units must act
- Steps must have consecutive `order` values (1, 2, 3…) with no gaps

### PurchasingRequest (PR)
- The actual purchase request flowing through a process
- Fields: `title`, `description`, `estimatedAmount`, `quantity`, `status`, `currentStep`, `history`
- Relations: `process`, `wareModel`, `requester`, `requestingUnit`, `stepApprovals`, `budgetLine`, etc.
- Custom actions: `submit`, `getHistory`, `assignStore`, `checkStoreAvailability`

### StepApproval
- Records a single unit's decision for a specific step on a PR
- Fields: `status` (pending|approved|rejected), `comment`, `decidedAt`
- Relations: `purchasingRequest`, `processStep`, `unit`, `decidedBy`
- Created automatically when a PR reaches a step

---

## The Complete Flow

### 1. PR Submission
```
Frontend calls: purchasingRequest.submit()
```

- Creates the PR with `status: "Pending"`, `currentStep: 0`
- Sets the `wareModel` relation (required)
- Optionally sets `budgetLine` relation (for budget tracking)
- Creates **StepApproval** records with `status: "pending"` for each unit in the first step's assignee groups
- Optionally creates a **BudgetEncumbrance** (reserves budget)
- Pushes `"submitted"` history entry

### 2. Unit Head Views Pending Requests
```
Frontend calls: purchasingRequest.gets({ unitId: "<unit-id>" })
```

- Returns only PRs where the unit has a **pending StepApproval** at the current step
- This uses a `$lookup` aggregation joining PR ↔ StepApproval
- The requesting user must be the **head** of that unit (or Manager/Admin)

### Alternative: View Step Approvals Directly
```
Frontend calls: stepApproval.gets({ unitId: "<unit-id>" })
```

- Returns all StepApproval records for a unit
- Each record includes the `purchasingRequest` relation (nested PR data)
- The requesting user must be the **head** of that unit (or Manager/Admin/OrgHead)

### 3. Unit Head Submits Decision
```
Frontend calls: stepApproval.submitDecision({
  purchasingRequestId: "<pr-id>",
  processStepId: "<step-id>",
  unitId: "<unit-id>",
  status: "approved" | "rejected",
  comment: "optional comment"
})
```

**Validation (in order):**
1. PR must exist and have status `"Pending"` or `"InProgress"`
2. Step must match the PR's `currentStep`
3. Unit must be in the step's `assigneeGroups`
4. User must be the **head** of that unit (unless Manager/Admin)

**On approval:**
- Upserts the StepApproval record with the decision
- Re-evaluates the step's overall status via `evaluateStepStatus()` (OR/AND logic)
- If step overall is **approved**:
  - Pushes `"step_approved"` history entry
  - If next step exists: creates pending StepApprovals for next step's units, increments `currentStep`
  - If this was the **last step**: marks PR as `"Completed"`
- If step overall is **rejected**: marks PR as `"Rejected"`

### 4. Repeat → Each step's units see and approve/reject

After each step approval, the next step's units see the PR in their `purchasingRequest.gets({ unitId: "..." })` results (because new pending StepApprovals were created).

---

## OR/AND Logic for Multi-Unit Steps

Each step has:
- **`assigneeGroups`**: array of `{ operator: "AND"|"OR", unitIds: [...] }`
- **`groupsOperator`**: how groups combine (AND|OR)

### Step-level groupsOperator = "AND"
All groups must approve. Within each group, the group's operator applies.

| assigneeGroups | groupsOperator | Meaning |
|---|---|---|
| `[{ operator: "AND", unitIds: [A] }]` | AND | A must approve |
| `[{ operator: "OR", unitIds: [U1, U2] }]` | AND | U1 **or** U2 must approve |
| `[{ operator: "AND", unitIds: [U1, U2] }]` | AND | U1 **and** U2 must approve |
| `[{ operator: "AND", unitIds: [U1] }, { operator: "AND", unitIds: [U2] }]` | AND | U1 **and** U2 must approve |

### Step-level groupsOperator = "OR"
Any one group approving is enough.

| assigneeGroups | groupsOperator | Meaning |
|---|---|---|
| `[{ operator: "AND", unitIds: [U1, U2] }, { operator: "AND", unitIds: [U3, U4] }]` | OR | (U1 and U2) **or** (U3 and U4) must approve |

### Evaluation function
Located in `utils/stepEvaluator.ts` — `evaluateStepStatus()`:
1. Evaluates each group internally (AND = all must approve; OR = any one is enough)
2. Combines groups using `groupsOperator`

---

## Status Lifecycle

```
Draft ──► submit() ──► Pending ──► submitDecision() (per step)
  │                                    │
  │                        ┌───────────┴────────────┐
  │                        ▼                        ▼
  │                   (all steps done)          (any rejection)
  │                        │                        │
  │                        ▼                        ▼
  │                    Completed                 Rejected
  │                                                │
  │                                    (can be cancelled anytime)
  │                                                │
  └──────────────────────────────────────────► Cancelled (manual)
```

---

## History Structure

Every PR action is recorded in the embedded `history` array:

```typescript
{
  action: "submitted" | "step_approved" | "step_rejected" | "item_assigned"
        | "goods_received" | "payment_ordered" | "goods_consumed" | "created",
  performed: {
    by: string,           // User._id
    name: string,         // "First Last"
    at: Date,
    role: {
      id: string,         // roleId (UUID)
      name: string,       // "Manager" | "Admin" | "UnitHead" | etc.
      scopeType?: string, // "organization" | "unit"
      scopeId?: string,
    },
  },
  unit?: {
    _id: string,
    name: string,
  },
  details?: object,       // Action-specific extra fields
}
```

### View History
```
Frontend calls: purchasingRequest.getHistory({
  _id: "<pr-id>",
  action?: "submitted" | "step_approved" | ...,  // optional filter
  performer?: "<user-id>",                        // optional filter
  fromDate?: "2024-01-01", toDate?: "2024-12-31" // optional date range
})
```

Returns an array of history entries, newest first.

---

## Frontend API Reference

### Actions Available

| Action | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `purchasingRequest.submit` | POST | Auth + Role | Submit a new PR (Draft → Pending, creates StepApprovals) |
| `purchasingRequest.gets` | POST | Auth + Role | List PRs (supports `unitId` filter for pending-by-unit) |
| `purchasingRequest.get` | POST | Auth + Role | Get single PR details |
| `purchasingRequest.getHistory` | POST | Auth + Role | Get PR history entries |
| `stepApproval.submitDecision` | POST | Auth + Role | Approve/reject a step |
| `stepApproval.gets` | POST | Auth + Role | List step approvals (supports `unitId` filter) |
| `stepApproval.get` | POST | Auth + Role | Get single step approval |
| `process.gets` | POST | Auth + Role | List processes |
| `processStep.gets` | POST | Auth + Role | List steps for a process |

### Role Requirements

| Action | Allowed Roles |
|--------|--------------|
| `purchasingRequest.gets` (with `unitId`) | **UnitHead** (own unit), **Manager**, **Admin**, **OrgHead** |
| `stepApproval.gets` (with `unitId`) | **UnitHead** (own unit), **Manager**, **Admin**, **OrgHead** |
| `stepApproval.submitDecision` | **UnitHead** (own unit), **Manager**, **Admin**, **OrgHead** |

### Typical Frontend Flow

```typescript
// 1. UnitHead logs in and sets activeRoleId to their UnitHead role
// 2. Fetch pending PRs for their unit
const pendingPRs = await purchasingRequest.gets({
  set: {
    unitId: "<their-unit-id>",
    status: "Pending",
    page: 1,
    limit: 20,
  },
  get: { _id: 1, title: 1, description: 1, estimatedAmount: 1, quantity: 1, ... }
});

// 3. Click on a PR to see details, including current step info
const prDetail = await purchasingRequest.get({
  set: { _id: "<pr-id>", activeRoleId: "..." },
  get: { _id: 1, title: 1, description: 1, status: 1, currentStep: 1,
         process: { name: 1, ... },
         stepApprovals: { status: 1, unit: { name: 1, ... }, ... },
         history: { action: 1, performed: { by: 1, name: 1, at: 1 }, ... },
         wareModel: { name: 1, ... },
         ... }
});

// 4. Submit approval/rejection
const result = await stepApproval.submitDecision({
  set: {
    purchasingRequestId: "<pr-id>",
    processStepId: "<current-step-id>",
    unitId: "<their-unit-id>",
    status: "approved", // or "rejected"
    comment: "Approved by warehouse manager",
  },
  get: { _id: 1, status: 1, ... }
});
```

---

## Security: Unit Head Verification

When a request includes a `unitId` parameter and the user's active role is **not** Manager/Admin/OrgHead, the backend verifies:

1. The unit document exists
2. The user's `_id` matches `unit.head._id`

If the user is not the head of that unit, the request is rejected with an error message.

This applies to:
- `purchasingRequest.gets` (when `unitId` is provided)
- `stepApproval.gets` (when `unitId` is provided)
- `stepApproval.submitDecision` (always checks against the `unitId` in the request)

---

## Notes for Frontend Implementation

1. **`activeRoleId` is required** in every request body's `set` object — it identifies which role the user is acting as
2. **Page numbers are 1-indexed** in pagination
3. **Relations are embedded** — e.g., `stepApproval.purchasingRequest` contains the full PR subdocument (pure fields + `_id`), not just an ID
4. **After submitting a decision**, the frontend should refresh the PR list — the PR may have advanced to the next step or completed
5. **The `history` array** on a PR contains the full audit trail. Use `getHistory` for filtered views
6. **Process Steps must be consecutive** (1, 2, 3…) — validated by `activateProcess`
7. **When showing the current step to a UnitHead**, use the PR's `currentStep` index to find the matching step in the process's step list
