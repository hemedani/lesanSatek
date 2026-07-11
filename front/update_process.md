# Process Scoping & Auto-Resolve — Changes for Frontend

## What Changed

### 1. PR Creation No Longer Needs `processId`

**Before**: Frontend had to pass a `processId` when creating a PurchasingRequest.
**After**: The backend **auto-resolves** the correct process using `resolveProcessForPR()` based on:
- `requestingUnitId` — matches a unit-scoped process
- `wareModelId` / `wareId` / `wareTypeId` / `wareClassId` / `wareGroupId` — matches a hierarchy-scoped process
- Falls back to the org-wide unscoped process if nothing more specific matches

**Priority resolution chain** (first match wins):
1. Unit-scoped process (`process.unit._id === requestingUnitId`)
2. Ware-scoped process (`process.ware._id === wareId`)
3. WareModel-scoped process (`process.wareModel._id === wareModelId`)
4. WareGroup-scoped process
5. WareClass-scoped process
6. WareType-scoped process
7. Org-wide general process (no scope fields set)

**PR submit now accepts** (new optional fields):
- `storeId` — pre-select store (link as relation)
- `wareId` — specific product (link as relation)
- `wareTypeId`, `wareClassId`, `wareGroupId` — hierarchy relations (auto-resolved from wareModel if omitted)

### 2. Process Model — New Scoping Relations

The `process` model now has **5 optional single relations** for scoping:

| Field | Type | Purpose |
|-------|------|---------|
| `unit` | single, optional | Unit-scoped process (belongs to a specific unit) |
| `wareType` | single, optional | Hierarchy-scoped: applies only to this WareType |
| `wareClass` | single, optional | Hierarchy-scoped: applies only to this WareClass |
| `wareGroup` | single, optional | Hierarchy-scoped: applies only to this WareGroup |
| `wareModel` | single, optional | Hierarchy-scoped: applies only to this WareModel |
| `ware` | single, optional | Hierarchy-scoped: applies only to this specific Ware |

**When frontend creates a process**, you can now pass any of these as relation IDs. Example:
```ts
// Unit-scoped process (only PRs from this unit will use it)
process.add({
  set: { name: "فرآیند خرید واحد خرید", organizationId: "{orgId}", unitId: "{unitId}", ... }
});

// WareType-scoped process (only PRs for this ware type will use it)
process.add({
  set: { name: "فرآیند خرید تجهیزات آزمایشگاهی", organizationId: "{orgId}", wareTypeId: "{wareTypeId}", ... }
});
```

### 3. Frontend UI Implications

| Context | What Frontend Should Do |
|---------|------------------------|
| **PR Create form** | Remove `processId`/`process` selector. The process is resolved automatically. User just picks unit, ware model, budget line, etc. |
| **Process Create form** | Add optional scoping selectors: `unit` (single), optionally hierarchy levels (wareType → wareClass → wareGroup → wareModel). If none selected → general org-wide process. |
| **Process List / Detail** | Show scoping info for each process (which unit or hierarchy level it targets). An unscoped process has no scope fields set. |
| **PR Detail** | Show the auto-resolved process name (returned in `submit` response as `process: { _id, name }`). |

### 4. New Utility: `resolveProcess.ts`

File: `back/utils/resolveProcess.ts`

```ts
interface ResolveProcessParams {
  organizationId: string;
  requestingUnitId?: string;
  wareModelId: string;
  wareId?: string;
  wareTypeId?: string;
  wareClassId?: string;
  wareGroupId?: string;
}
```

Called on PR `submit` to auto-resolve process. If no match found at any scope level, throws `"No active process found for this organization"`.

### 5. New Utility: `checkWareModelAccess.ts`

File: `back/utils/checkWareModelAccess.ts`

Checks if a user or unit can access a ware model based on `allowWareTypeIds`, `allowWareClassIds`, `allowWareGroupIds`, `allowWareModelIds` fields on User and Unit models.

```ts
unitCanAccessWareModel(holder: AllowWareHolder, wareModel: WareModelRef): boolean
userCanAccessWareModel(user: UserWithUnits, wareModel: WareModelRef): boolean
```

Both User and Unit now have these optional fields:
- `allowWareTypeIds?: string[]`
- `allowWareClassIds?: string[]`
- `allowWareGroupIds?: string[]`
- `allowWareModelIds?: string[]`

If all fields are empty/undefined, access is granted (no restriction). If any field is set, the user/unit is restricted to only those IDs.

### 6. Test Data — 8 Processes Documenting All Scope Forms

See `back/http/TEST_DATA_SUMMARY.md` section 6 for complete reference. The E2E tests create 8 processes covering every scope scenario.

### 7. PR Submit Validator — New Optional Fields

The `submit` validator now accepts:
- `wareModelId` — **required** (was already there)
- `requestingUnitId` — optional
- `storeId` — optional (NEW)
- `wareId` — optional (NEW)
- `wareTypeId` — optional (NEW)
- `wareClassId` — optional (NEW)
- `wareGroupId` — optional (NEW)
- `budgetLineId` — optional (existing)
- `attachmentIds` — optional (existing)
