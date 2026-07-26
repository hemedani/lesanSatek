# PR Add / Submit — New Flow (Backend Changes)

## Overview

The purchasing request flow has been split into two distinct phases:

1. **`add`** — Anyone with `canRegisterPurchaseRequest` feature can register a purchase need (Draft). No process, no price, no vendor.
2. **`submit`** — UnitHead or someone with `canSubmitPurchaseRequest` feature transitions a Draft PR to Pending, linking it to a process, optionally assigning a vendor, and checking for tenders.

---

## 1. `add` — Register a Purchase Request (Draft)

### Endpoint
`purchasingRequest.add`

### Who Can Call
- `Manager`, `Admin` — always
- `OrgHead`, `UnitHead`, `Employee` — **only if they have the `canRegisterPurchaseRequest` feature**

### Required Fields (send in `set`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeRoleId` | string | ✅ | The active role UUID |
| `title` | string | ✅ | Purchase title |
| `description` | string | ❌ | Optional description |
| `quantity` | number | ✅ | How many units |
| `wareModelId` | ObjectId | ✅ | The WareModel being requested |

### Auto-Derived Fields (do NOT send)
The backend automatically extracts these from the active role:

- **`requestingUnitId`** — taken from `activeRole.scopeId` (the role's associated unit). The caller MUST have a unit-scoped role (e.g. `UnitHead` or `Employee` with `scopeType: "unit"`).
- **Organization** — taken from the first entry in the user's `organizations` array (used for permission validation only).

### Response
Returns the created Draft PR document (with relations populated per `get` projection).  
The PR will have `status: "Draft"` and **no `process` relation** (it's `null`).

### Example Request
```json
{
  "set": {
    "activeRoleId": "46cf3cd8-3787-4301-a5c4-cc34e5b049be",
    "title": " خرید کیت آزمایشگاهی",
    "description": "کیت TSH برای آزمایشگاه",
    "quantity": 100,
    "wareModelId": "6a58993d1d03a6b5f74cae91"
  },
  "get": { "_id": 1, "title": 1, "status": 1, "quantity": 1, "wareModel": { "name": 1 }, "requestingUnit": { "name": 1 } }
}
```

---

## 2. `submit` — Submit a Draft PR (Pending + Process Linking)

### Endpoint
`purchasingRequest.submit`

### Who Can Call
- `Manager`, `Admin` — always
- `OrgHead`, `UnitHead`, `Employee` — **only if they have the `canSubmitPurchaseRequest` feature**

Additionally, the backend validates:
- The caller's active role's `scopeId` (unit) must match the Draft PR's `requestingUnit`.

### Required Fields (send in `set`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeRoleId` | string | ✅ | The active role UUID |
| `_id` | ObjectId | ✅ | The **existing Draft PR** `_id` to submit |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `storeId` | ObjectId | If provided, immediately creates a PurchaseOrderItem from this store's Stuff inventory for the PR's wareModel. The price is auto-computed (absolute price from Stuff, or percentage markup on Ware base price). Also links the store to the PR. |
| `requestingUnitId` | ObjectId | Override the requesting unit (rare; normally derived from activeRole). Only useful for users submitting on behalf of another unit. |

### What the Backend Does (in order)

1. **Fetch Draft PR** — Validates it exists and `status === "Draft"`
2. **Unit validation** — Checks `activeRole.scopeId` matches the PR's `requestingUnit._id`. Throws error if mismatch.
3. **Tender check** — Queries for a `tender` linked to this PR. If a tender exists but its `status` is NOT `"awarded"`, the submit is **blocked** with an error message (e.g. "the linked tender is open. It must be awarded first.")
4. **Store assignment** (optional) — If `storeId` provided:
   - Looks up `Stuff` for that store + the PR's wareModel
   - Computes price (absolute or percentage)
   - Creates a `PurchaseOrderItem` with `status: "assigned"`
   - Links the store to the PR via `addRelation`
   - Pushes `item_assigned` history entry
5. **Process resolution** — Calls `resolveProcessForPR()` to find an active process matching the organization + unit + wareModel
6. **Link process** — Sets the `process` relation on the PR
7. **Create StepApprovals** — For the first step's assignee groups, creates pending approval records for each unit
8. **Transition PR** — Sets `status: "Pending"`, `currentStep: 0`, `requestedAt: now`, pushes `submitted` history entry
9. **Return** — The updated PR with all relations

### Example Request (direct store assignment)

```json
{
  "set": {
    "activeRoleId": "46cf3cd8-3787-4301-a5c4-cc34e5b049be",
    "_id": "5f8d9a1b2c3d4e5f6a7b8c9d",
    "storeId": "6b7c8d9e0f1a2b3c4d5e6f7a"
  },
  "get": { "_id": 1, "title": 1, "status": 1, "process": { "name": 1 }, "purchaseOrderItems": { "status": 1, "unitPrice": 1 } }
}
```

### Example Request (no vendor — just submit to workflow)

```json
{
  "set": {
    "activeRoleId": "46cf3cd8-3787-4301-a5c4-cc34e5b049be",
    "_id": "5f8d9a1b2c3d4e5f6a7b8c9d"
  },
  "get": { "_id": 1, "title": 1, "status": 1, "currentStep": 1 }
}
```

### Example Request (with tender already awarded)
No special params needed. The backend auto-detects the awarded tender. Just:
```json
{
  "set": {
    "activeRoleId": "46cf3cd8-3787-4301-a5c4-cc34e5b049be",
    "_id": "5f8d9a1b2c3d4e5f6a7b8c9d"
  }
}
```

---

## 3. Complete Flow Diagrams

### Direct Vendor Assignment
```
[add] → Draft PR (no process, no price)
  ↓
[submit] with storeId → process linked, PO item created from Stuff pricing
  ↓
PR: Pending, with process + purchaseOrderItems[0] (status: "assigned")
```

### Tender (Auction) Flow
```
[add] → Draft PR (no process, no price)
  ↓
[tender.add] → Create tender linked to Draft PR
  ↓
[tender.close] → Stop accepting offers
  ↓
[tender.award] → Select winner → PO item created from winning offer price
  ↓
[submit] (tender check passes: status="awarded") → process linked
  ↓
PR: Pending, with process + purchaseOrderItems[0] (from tender)
```

### No Vendor / Later Assignment
```
[add] → Draft PR
  ↓
[submit] without storeId → process linked, no PO item
  ↓
PR: Pending, with process but no purchaseOrderItems yet
  ↓
Later: [assignStore] or [tender.create → close → award] adds items
```

---

## 4. Error Scenarios (Frontend Should Handle)

| Error | Cause | Suggested UX |
|-------|-------|-------------|
| `"Your active role does not have an associated unit."` | User's active role has no unit scope | Show: "Your current role is not linked to any unit" |
| `"Could not determine organization."` | User has no organizations | Show: "You don't belong to any organization" |
| `"Only Draft purchasing requests can be submitted"` | PR already submitted/completed | Show: "This request has already been submitted" |
| `"You can only submit purchase requests for your own unit"` | Submitter's unit != PR's unit | Show: "You can only submit requests from your own unit" |
| `"Cannot submit: the linked tender is {status}. It must be awarded first."` | Tender exists but not awarded | Show: "This request has an active tender. Award it before submitting." |
| `"Purchasing request not found"` | Invalid/removed PR _id | Show: "Request not found" |
| `"No active process found for this organization"` | No matching active process | Show: "No active purchase process exists. Contact your admin." |

---

## 5. Feature Flags

Two features control access:

| Feature | Controls | Assigned To |
|---------|----------|-------------|
| `canRegisterPurchaseRequest` | Ability to call `add` | Employees who can initiate purchases |
| `canSubmitPurchaseRequest` | Ability to call `submit` | Unit heads / managers who approve purchases |

These are assigned to Users (`user.features`) or Units (`unit.features`) and checked via `grantAccess` middleware.

---

## 6. Changed Model

### `purchasingRequest.process` — Now Optional

The `process` relation is now `optional: true`. Draft PRs will have `process: null`. After `submit`, the process is linked via `addRelation`.

Frontend code should handle:
- Draft PR detail pages showing "No process assigned yet"
- Filtering/lists that reference `pr.process._id` — use optional chaining
- Displaying "Draft" vs "In Process" status appropriately

---

## 7. Removed Fields

### From `add` (no longer accepted)
- `estimatedAmount` — removed entirely. Price determined at submit time (via store assignment or tender award).
- `requestingUnitId` — auto-derived from active role. No need to send.
- `attachmentIds`, `storeId`, `wareId`, `wareTypeId`, `wareClassId`, `wareGroupId` — all removed from add. These can be set at submit time or later via updateRelations.
- `status`, `currentStep`, `requestedAt`, `completedAt` — system-managed.

### From `submit` (no longer accepted)
- `estimatedAmount` — removed entirely.
- `budgetLineId` — removed. Budget encumbrance is handled later in the workflow (after goods receipt / payment order).
- `title`, `description`, `quantity`, `wareModelId` — these are now set via `add`. `submit` takes an `_id` of an existing Draft PR.
- `attachmentIds`, `wareId`, `wareTypeId`, `wareClassId`, `wareGroupId` — these should be set via `updateRelations` after submit if needed.

---

## 8. Key Implementation Details for API Calls

### Getting Unit ID for a User
The user's active role contains the unit in `scopeId`:
```typescript
const activeRole = user.roles.find(r => r.roleId === activeRoleId);
// activeRole.scopeType === "unit"
// activeRole.scopeId === ObjectId of the unit
```

### PR Status Lifecycle (Updated)
```
Draft → (submit) → Pending → (step approvals) → InProgress → Approved
  ↑                                                     ↓
  └──── (cancelled) ←────── Rejected ←──────────────────┘
                                                         ↓
                                                    Completed
```

- **Draft**: Initial state after `add`. No process linked. Can be edited, deleted, or have tenders created.
- **Pending**: After `submit`. Process linked, step approvals created, moving through workflow.
