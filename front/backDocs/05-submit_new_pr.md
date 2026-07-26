# Submitting a New Purchasing Request (PR)

## API Action

**`purchasingRequest.submit`** — Creates a PR in `Pending` status with server-side process auto-resolution.

## Allowed Roles (grantAccess)

The submit action requires one of these roles as `activeRoleId`:

- `Manager`
- `Admin`
- `OrgHead`
- `UnitHead`
- `Employee`

If the user's `activeRoleId` resolves to `Ordinary`, the backend returns `"You cant do this"`. The employee panel must use the `Employee` role (not `Ordinary`). In the E2E seed data, the admin user is given `Employee` as a third role (alongside `Ordinary` and `Manager`) via the `gen-update-admin-roles` entry. The captured `{employeeRoleId}` should be used as `activeRoleId` when submitting PRs from the employee panel.

## Required Fields (Validator)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `activeRoleId` | UUID string | yes | Must match a role with name in allowed list |
| `title` | string | yes | PR title (Persian) |
| `quantity` | number | yes | Requested quantity |
| `wareModelId` | ObjectId string | yes | The WareModel being requested |

## Optional Fields

| Field | Type | Notes |
|-------|------|-------|
| `description` | string | Persian description |
| `estimatedAmount` | number | Budget estimate; if both this and `budgetLineId` are provided, the backend auto-creates a `BudgetEncumbrance` (reserved status) after validating sufficient remaining budget |
| `requestingUnitId` | ObjectId | The unit making the request. If omitted, uses the user's org context |
| `attachmentIds` | ObjectId[] | File attachment document IDs |
| `budgetLineId` | ObjectId | Links to a BudgetLine; enables auto-encumbrance |
| `storeId` | ObjectId | Pre-selects a store |
| `wareId` | ObjectId | Specific concrete product (Ware) |
| `wareTypeId` | ObjectId | Override hierarchy — auto-resolved from wareModel if omitted |
| `wareClassId` | ObjectId | Same |
| `wareGroupId` | ObjectId | Same |

**Do NOT send:** `processId`, `status`, `currentStep`, `requestedAt`, `history` — these are set server-side.

## Process Auto-Resolution (`resolveProcessForPR`)

The backend selects an Active process using this priority (first match wins):

1. **Unit-scoped** — `process.unit._id === requestingUnitId`
2. **Ware-scoped** — `process.ware._id === wareId`
3. **WareModel-scoped** — `process.wareModel._id === wareModelId`
4. **WareGroup-scoped** — `process.wareGroup._id === wareGroupId`
5. **WareClass-scoped** — `process.wareClass._id === wareClassId`
6. **WareType-scoped** — `process.wareType._id === wareTypeId`
7. **General (unscoped)** — process with no scope relations and `status: "Active"`
8. **Fallback** — If no process matches, the action throws: `"No active process found for this organization. Please create and activate a process first."`

The frontend should NOT send `processId` — the resolve is entirely server-side.

## Organization Resolution

The organization is resolved in this order:
1. From the authenticated user's embedded `organization` relation
2. From the `requestingUnitId`'s organization (if user has no org)
3. If neither resolves, throws: `"Could not determine organization. Please ensure you belong to an organization."`

## Server-Side Side Effects

When `submit` succeeds, the backend also:

1. **Sets `status: "Pending"`, `currentStep: 0`, `requestedAt: now`** on the PR.
2. **Creates StepApproval records** (status: `pending`) for every unit in the first process step's `assigneeGroups`.
3. **Pushes a `"submitted"` history entry** with the user's performed info (by, name, at, role) and optionally the requesting unit's current inventory snapshot (quantity, minQuantity, maxQuantity, wareModelId/name).
4. **Auto-creates BudgetEncumbrance** if both `budgetLineId` and `estimatedAmount` are provided (validates `remainingBudget >= estimatedAmount` first).

## Error Cases

| Error Message | Cause |
|---------------|-------|
| `"You cant do this"` | The `activeRoleId` resolves to a role NOT in [Manager, Admin, OrgHead, UnitHead, Employee] |
| `"activeRoleId is required"` | Missing `activeRoleId` in the request body |
| `"Active role not found"` | The `activeRoleId` UUID doesn't match any role on the user |
| `"Could not determine organization..."` | User has no org and no requestingUnitId was provided |
| `"No active process found..."` | No matching Active process for the org/scope chain |
| `"Insufficient remaining budget"` | `estimatedAmount` exceeds the BudgetLine's `remainingBudget` |
| `"Failed to create purchasing request"` | MongoDB insert failed |
| Lesan validation errors | Field type mismatches, missing required fields |

## History Entry Structure (pushed on submit)

```typescript
{
  action: "submitted",
  performed: {
    by: string,          // user._id
    name: string,        // "First Last"
    at: Date,
    role: {
      id: string,        // roleId (UUID)
      name: string,      // role display name
      scopeType?: string,
      scopeId?: string,
    },
  },
  details: {
    status: "Pending",
    currentStep: 0,
    requestingUnitInventory?: {   // only if requestingUnitId + wareModelId
      quantity: number,
      minQuantity: number,
      maxQuantity: number,
      wareModelId: string,
      wareModelName: string,
    },
  },
}
```

## Complete Request Example

```json
{
  "service": "main",
  "model": "purchasingRequest",
  "act": "submit",
  "details": {
    "set": {
      "activeRoleId": "<employeeRoleId>",
      "title": "خرید کیت TSH",
      "description": "تامین کیت آزمایشگاهی",
      "estimatedAmount": 50000000,
      "quantity": 10,
      "wareModelId": "<wareModelId>",
      "requestingUnitId": "<unitId>",
      "budgetLineId": "<budgetLineId>"
    },
    "get": {
      "_id": 1,
      "title": 1,
      "status": 1,
      "currentStep": 1,
      "process": { "_id": 1, "name": 1 },
      "stepApprovals": { "_id": 1, "status": 1, "processStep": { "_id": 1 }, "unit": { "_id": 1 } }
    }
  }
}
```

## Response

Returns the created PR with the requested `get` projection. The `process` relation will be populated with the auto-resolved process, and `stepApprovals` will contain the pending approvals for the first step.

## Key Constraints

- **One PR per submit** — each call creates exactly one PR for one WareModel.
- **Quantity is required** — even for services/non-physical items.
- **`estimatedAmount` is optional** for the schema but recommended for budget tracking.
- **`processId` is NEVER sent** — the server resolves it automatically.
- **Auto-encumbrance** only triggers when both `budgetLineId` and `estimatedAmount` are present AND the BudgetLine has sufficient `remainingBudget`.
- **Role must be `Employee`, `Manager`, `Admin`, `OrgHead`, or `UnitHead`** — `Ordinary` is NOT allowed for submit (allowed only for read/gets/list actions).
