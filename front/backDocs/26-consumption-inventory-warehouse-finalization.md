# Consumption, Inventory & Warehouse Finalization

> Last updated: 2026-07-28
> Backend scope: Models, Actions, Role Scoping, InventoryManager Utility

## Table of Contents

1. [Overview](#1-overview)
2. [Inventory Model & API](#2-inventory-model--api)
3. [ConsumptionRecord Model & API](#3-consumptionrecord-model--api)
4. [StockMovement Model & API](#4-stockmovement-model--api)
5. [InventoryManager Utility](#5-inventorymanager-utility)
6. [Role-Based Scoping Rules](#6-role-based-scoping-rules)
7. [Integration Points](#7-integration-points)
8. [Frequently Asked Questions](#8-frequently-asked-questions)

---

## 1. Overview

Three models form the warehouse/inventory management core:

| Model | Purpose | Created By | Modifiable |
|-------|---------|------------|------------|
| **Inventory** | Per-unit stock tracking of a WareModel | Manual (`inventory.add`), System (`inventoryManager.addStock` during goods receipt) | Yes (add, adjust, transfer, update, remove) |
| **ConsumptionRecord** | Log of goods usage/consumption | Manual (`consumptionRecord.add`), triggers inventory decrement | No (add/remove only) |
| **StockMovement** | Audit trail for every inventory change | System-only (`inventoryManager` functions) | Read-only (get/gets/count only) |

**Key Design Decisions:**
- Inventory has a **unique compound index** on `(unit, wareModel._id)` → one record per unit+model combo. `inventory.add` upserts (update if exists, insert if not).
- ConsumptionRecord calls `inventoryManager.removeStock` which decrements inventory AND auto-creates a StockMovement entry.
- StockMovement is **never written by user actions** — always created internally by `addStock`/`removeStock`/`adjustStock`/`transferStock`.
- All three models have **role-based auto-scoping** in `gets`/`count` (see section 6).

---

## 2. Inventory Model & API

### 2.1 Model Definition

**File:** `models/inventory.ts`

**Pure Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `quantity` | number | no | 0 | Current stock quantity |
| `minQuantity` | number | no | — | Alert threshold (low stock warning) |
| `maxQuantity` | number | no | — | Overstock threshold |
| `batchNo` | string | no | — | Batch/lot number |
| `expirationDate` | Date | no | — | Expiration date |
| `location` | string | no | — | Physical location (e.g. "قفسه A، ردیف ۳") |
| `lastCountedAt` | Date | no | — | Last physical count timestamp |
| `createdAt` | Date | auto | — | Creation timestamp |
| `updatedAt` | Date | auto | — | Last update timestamp |

**Relations:**

| Relation | Target | Type | Optional | Reverse |
|----------|--------|------|----------|---------|
| `unit` | Unit | single | no | `unit.inventories` |
| `warehouseUnit` | Unit | single | yes | `unit.warehouseInventories` |
| `wareModel` | WareModel | single | no | `wareModel.inventories` |
| `ware` | Ware | single | yes | `ware.inventories` |

**Index:**
- Unique compound: `{ unit: 1, "wareModel._id": 1 }` — enforces one record per unit+model.

### 2.2 Actions

#### `inventory.add` — Create or update inventory

**Validator** (`src/inventory/add/add.val.ts`):
```
set: {
  ...activeRoleMixin,
  quantity: number() (default 0),
  minQuantity?: number,
  maxQuantity?: number,
  batchNo?: string,
  expirationDate?: Date (coerced from string),
  location?: string,
  lastCountedAt?: Date (coerced from string),
  unitId: ObjectId (required),
  warehouseUnitId?: ObjectId,
  wareModelId: ObjectId (required),
  wareId?: ObjectId,
}
get: selectStruct("inventory", 1)
```

**Logic** (`src/inventory/add/add.fn.ts`):
1. **Scope validation**: If activeRole is not Manager/Admin, `unitId` must match `activeRole.scopeId`.
2. **Upsert**: Checks for existing inventory with same `unit._id` + `wareModel._id`. If found, updates quantity/minQuantity/maxQuantity/etc. If not, inserts new document.
3. Returns the created/updated inventory doc.

#### `inventory.gets` — List with role scoping + filters

**Validator** (`src/inventory/gets/gets.val.ts`):
```
set: {
  ...activeRoleMixin,
  ...pagination,
  sortBy?: enums(["createdAt", "updatedAt", "_id", "quantity"]),
  sortOrder?: enums(["asc", "desc"]),
  search?: string,              // text search on wareModel.name / ware.name
  wareModelId?: ObjectId,
  unitId?: string,
  warehouseUnitId?: string,
  organizationId?: string,      // filters by unit.organization._id
}
get: selectStruct("inventory", 2)
```

**Logic** (`src/inventory/gets/gets.fn.ts`):
1. Resolves active role from `user.roles`.
2. Applies role-based auto-scoping (see Section 6).
3. Applies explicit filters (search, wareModelId, unitId, warehouseUnitId, organizationId).
4. Explicit filters **override** role scoping (e.g., passing `unitId` bypasses the auto-scope).
5. Returns paginated + sorted results.

**Important parameter notes:**
- `search` performs `$or` regex match on `wareModel.name` and `ware.name` fields.
- All relation filters MUST use dot-notation: `"unit._id"`, `"warehouseUnit._id"`, `"unit.organization._id"`, `"wareModel._id"`. See FAQ in Section 8 for why.

#### `inventory.adjust` — Set exact quantity

**Validator** (`src/inventory/adjust/adjust.val.ts`):
```
set: {
  ...activeRoleMixin,
  _id: ObjectId (required),
  quantity: number (required),
  description?: string,
}
get: selectStruct("inventory", 2)
```

**Logic** (`src/inventory/adjust/adjust.fn.ts`):
1. Fetches the inventory doc by `_id`.
2. **Scope validation**: If not Manager/Admin, the inventory's `unit._id` must match `activeRole.scopeId`.
3. Sets `quantity` directly (overwrites, not increment).
4. Sets `updatedAt` to now.

⚠️ This action does NOT create a StockMovement entry. For proper audit trail, the frontend should call `inventoryManager.adjustStock` or create a StockMovement separately if needed.

#### `inventory.transfer` — Move quantity between units

**Validator** (`src/inventory/transfer/transfer.val.ts`):
```
set: {
  ...activeRoleMixin,
  fromUnitId: ObjectId (required),
  toUnitId: ObjectId (required),
  wareModelId: ObjectId (required),
  quantity: number (required),
  description?: string,
}
get: { fromUnit?: { _id?: 1 }, toUnit?: { _id?: 1 }, quantity?: 1 }
```

**Logic** (`src/inventory/transfer/transfer.fn.ts`):
1. **Scope validation**: `fromUnitId` must match `activeRole.scopeId` (unless Manager/Admin).
2. Finds source inventory by `fromUnitId` + `wareModelId`. Throws if not found or insufficient quantity.
3. Decrements source: `$inc: { quantity: -quantity }`.
4. Finds or creates destination inventory by `toUnitId` + `wareModelId`. Increments: `$inc: { quantity: +quantity }`.
5. Returns `{ fromUnit, toUnit, quantity }`.

⚠️ Does NOT create StockMovement entries. Should be wrapped with `inventoryManager.transferStock()` for audit trail, or the frontend should call `transferStock` instead of raw `transfer`.

#### `inventory.count` — Count documents

**Validator** (`src/inventory/count/count.val.ts`):
```
set: {
  ...activeRoleMixin,
  wareModelId?: string,
  unitId?: string,
  warehouseUnitId?: string,
}
```

Same role-based scoping logic as `gets`. Returns `{ qty: number }`.

#### Other actions
- **`inventory.get`**: Standard single-document fetch by `_id`.
- **`inventory.update`**: Update pure fields by `_id`.
- **`inventory.updateRelations`**: Update relations by `_id`.
- **`inventory.remove`**: Delete by `_id` (guarded to Manager/Admin).

### 2.3 Usage Patterns

**Add Inventory (Manager/Admin):**
```json
{
  "set": {
    "activeRoleId": "...",
    "unitId": "UNIT_ID",
    "wareModelId": "WAREMODEL_ID",
    "quantity": 100,
    "minQuantity": 10,
    "maxQuantity": 200,
    "batchNo": "BATCH-001",
    "location": "قفسه A"
  },
  "get": { "_id": 1, "quantity": 1, "unit": { "_id": 1, "name": 1 } }
}
```

**Get Inventory (UnitHead — auto-scoped):**
```json
{
  "set": {
    "activeRoleId": "...",
    "page": 1,
    "limit": 30
  },
  "get": {
    "_id": 1, "quantity": 1, "batchNo": 1, "location": 1,
    "unit": { "_id": 1, "name": 1 },
    "wareModel": { "_id": 1, "name": 1 }
  }
}
```

**Get Inventory (OrgHead — scoped to org):**
Same as above — backend adds `"unit.organization._id"` filter automatically.

---

## 3. ConsumptionRecord Model & API

### 3.1 Model Definition

**File:** `models/consumptionRecord.ts`

**Pure Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | number | yes | Quantity consumed |
| `consumedAt` | Date | yes | When consumption occurred |
| `reason` | string | no | Reason for consumption |
| `patientId` | string | no | Healthcare patient identifier |
| `notes` | string | no | Additional notes |
| `createdAt` | Date | auto | Creation timestamp |
| `updatedAt` | Date | auto | Last update timestamp |

**Relations:**

| Relation | Target | Type | Optional | Reverse |
|----------|--------|------|----------|---------|
| `unit` | Unit | single | no | `unit.consumptionRecords` |
| `consumedBy` | User | single | no | `user.consumptionRecords` |
| `inventory` | Inventory | single | yes | `inventory.consumptionRecords` |
| `wareModel` | WareModel | single | no | `wareModel.consumptionRecords` |
| `ware` | Ware | single | yes | `ware.consumptionRecords` |

### 3.2 Actions

#### `consumptionRecord.add` — Record consumption + remove from inventory

**Validator** (`src/consumptionRecord/add/add.val.ts`):
```
set: {
  ...activeRoleMixin,
  wareModelId: ObjectId (required),
  wareId?: ObjectId,
  quantity: number (required),
  consumedAt: Date (required, coerced from string),
  reason?: string,
  patientId?: string,
  notes?: string,
  unitId?: ObjectId,          // OPTIONAL — auto-derived from activeRole
  consumedById?: ObjectId,    // OPTIONAL — auto-derived from user._id
  inventoryId?: ObjectId,     // OPTIONAL — specific inventory to decrement
  purchasingRequestId?: ObjectId, // OPTIONAL — link to PR for history
}
get: selectStruct("consumptionRecord", 2)
```

**Logic** (`src/consumptionRecord/add/add.fn.ts`):
1. **Auto-derive `unitId`**: If not provided, uses `activeRole.scopeId` when `scopeType === "unit"`. Throws error if still undefined.
2. **Auto-derive `consumedById`**: If not provided, uses `user._id`.
3. Creates the ConsumptionRecord document with all relations.
4. Calls `inventoryManager.removeStock()` for the given unit+wareModel+quantity, which:
   - Decrements inventory quantity
   - Creates a StockMovement entry with `reason: "consumption"` and `referenceType: "consumptionRecord"`
5. If `purchasingRequestId` is provided, pushes a `"goods_consumed"` history entry on the PR with nested `performed` + `details` objects.
6. Returns the created ConsumptionRecord.

**Important:** `unitId` was previously required in the validator but is now **optional**. The frontend should still pass it for explicit control, but it's no longer mandatory. If the frontend is used within a scoped role (UnitHead, Employee), they can omit `unitId` and it will be derived. For Manager/Admin with no unit scope, `unitId` is still required.

#### `consumptionRecord.gets` — List with role scoping

**Validator** (`src/consumptionRecord/gets/gets.val.ts`):
```
set: {
  ...activeRoleMixin,
  ...pagination,
  sortBy?: enums(["createdAt", "updatedAt", "_id", "quantity", "consumedAt"]),
  sortOrder?: enums(["asc", "desc"]),
  unitId?: string,
  wareModelId?: string,
  reason?: string,        // regex match
  patientId?: string,     // regex match
}
get: selectStruct("consumptionRecord", 2)
```

Same role-based scoping as inventory.gets (Section 6). Explicit `unitId` overrides auto-scope.

#### `consumptionRecord.count` — Count with role scoping

Same role-based scoping. Filters: `unitId`, `wareModelId`, `reason`, `patientId`.

#### Other actions
- **`consumptionRecord.get`**: Standard single-document fetch.
- **`consumptionRecord.remove`**: Delete by `_id` (guarded to Manager/Admin).

### 3.3 Usage Patterns

**Record Consumption (UnitHead — auto-scoped):**
```json
{
  "set": {
    "activeRoleId": "...",
    "wareModelId": "WAREMODEL_ID",
    "quantity": 5,
    "consumedAt": "2026-07-28T10:00:00.000Z",
    "reason": "آزمایش بیمار"
  },
  "get": { "_id": 1, "quantity": 1 }
}
```
→ `unitId` is derived from `activeRole.scopeId`, `consumedById` from `user._id`.

**Record Consumption (Admin — explicit unit):**
```json
{
  "set": {
    "activeRoleId": "...",
    "wareModelId": "WAREMODEL_ID",
    "quantity": 5,
    "consumedAt": "2026-07-28T10:00:00.000Z",
    "unitId": "UNIT_ID",
    "consumedById": "USER_ID"
  },
  "get": { "_id": 1, "quantity": 1 }
}
```

---

## 4. StockMovement Model & API

### 4.1 Model Definition

**File:** `models/stockMovement.ts`

**Pure Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `quantity` | number | yes | — | Quantity changed (positive = increase, negative = decrease) |
| `balanceBefore` | number | yes | — | Quantity before the change |
| `balanceAfter` | number | yes | — | Quantity after the change |
| `reason` | enum | no | "adjustment" | One of: `goods_receipt`, `goods_issue`, `transfer_in`, `transfer_out`, `consumption`, `adjustment`, `return`, `write_off` |
| `referenceType` | string | no | — | Type of triggering document (e.g. "goodsReceipt", "consumptionRecord") |
| `referenceId` | string | no | — | ID of triggering document |
| `description` | string | no | — | Optional description |
| `createdAt` | Date | auto | — | Creation timestamp |
| `updatedAt` | Date | auto | — | Last update timestamp |

**Reason enum values:** `goods_receipt`, `goods_issue`, `transfer_in`, `transfer_out`, `consumption`, `adjustment`, `return`, `write_off`

**Relations:**

| Relation | Target | Type | Optional | Reverse |
|----------|--------|------|----------|---------|
| `unit` | Unit | single | no | `unit.stockMovements` |
| `createdBy` | User | single | no | `user.createdStockMovements` |
| `store` | Store | single | yes | `store.stockMovements` |
| `wareModel` | WareModel | single | no | `wareModel.stockMovements` |
| `ware` | Ware | single | yes | `ware.stockMovements` |

### 4.2 Actions

#### `stockMovement.gets` — List with role scoping

**Validator** (`src/stockMovement/gets/gets.val.ts`):
```
set: {
  ...activeRoleMixin,
  ...pagination,
  sortBy?: enums(["createdAt", "updatedAt", "_id", "quantity", "reason"]),
  sortOrder?: enums(["asc", "desc"]),
  unitId?: string,
  wareModelId?: string,
  reason?: stockMovement_reason_emums,   // exact match (not regex)
  referenceType?: string,                // exact match
  referenceId?: string,                  // exact match
}
get: selectStruct("stockMovement", 2)
```

Same role-based scoping as inventory.gets (Section 6).

#### `stockMovement.count` — Count with role scoping

Same filters and scoping. Returns `{ qty: number }`.

#### Other actions
- **`stockMovement.get`**: Standard single-document fetch.
- **`stockMovement.remove`**: Delete by `_id` (guarded to Manager/Admin — use with extreme caution, destroys audit trail).

### 4.3 Usage Patterns

**Get Stock Movements (UnitHead — auto-scoped to unit):**
```json
{
  "set": {
    "activeRoleId": "...",
    "page": 1,
    "limit": 50
  },
  "get": {
    "_id": 1, "quantity": 1, "balanceBefore": 1, "balanceAfter": 1,
    "reason": 1, "description": 1, "createdAt": 1,
    "wareModel": { "_id": 1, "name": 1 },
    "unit": { "_id": 1, "name": 1 }
  }
}
```

---

## 5. InventoryManager Utility

**File:** `utils/inventoryManager.ts`

A set of internal functions used by GoodsReceipt, ConsumptionRecord, and other system actions. These functions handle the dual operation of modifying Inventory + creating StockMovement entries atomically.

### `addStock(unitId, wareModelId, quantity, reason, createdByUserId, options?)`

**Purpose:** Add stock to a unit's inventory. Used by GoodsReceipt.

**Parameters:**
- `unitId: string` — Unit to add stock to
- `wareModelId: string` — WareModel being stocked
- `quantity: number` — Positive quantity to add
- `reason: string` — StockMovement reason (e.g. "goods_receipt")
- `createdByUserId: string` — User performing the action
- `options?: StockOptions` — Optional:
  - `wareId?: string` — Specific Ware variant
  - `wareName?: string`
  - `referenceType?: string` — e.g. "goodsReceipt"
  - `referenceId?: string` — ID of triggering document
  - `description?: string`
  - `storeId?: string` — For store-related movements
  - `inventoryId?: string` — Specific inventory record to update

**Behavior:**
1. Finds existing inventory by `(unitId, wareModelId)` or creates new one.
2. Increments quantity.
3. Creates StockMovement entry with `balanceBefore`, `balanceAfter`, `quantity`.

### `removeStock(unitId, wareModelId, quantity, reason, createdByUserId, options?)`

**Purpose:** Remove stock from inventory. Used by ConsumptionRecord.

**Parameters:** Same as `addStock` (quantity is positive, function negates it).

**Behavior:**
1. Finds inventory by `(unitId, wareModelId)` or by `options.inventoryId` (if provided).
2. Throws if not found or insufficient quantity.
3. Decrements quantity.
4. Creates StockMovement entry (negative quantity).

### `transferStock(fromUnitId, toUnitId, wareModelId, quantity, createdByUserId, options?)`

**Purpose:** Move stock between units.

**Behavior:**
1. Calls `removeStock()` from source unit (reason: "transfer_out").
2. Calls `addStock()` to destination unit (reason: "transfer_in").
3. Both have cross-references in `referenceId`.

### `getStockLevel(unitId, wareModelId)`

**Purpose:** Get current stock level for a unit+model.
**Returns:** Inventory document or `{ quantity: 0 }` if not found.

### `getWarehouseDashboard(warehouseUnitId, wareModelId?)`

**Purpose:** Get a consolidated view of all inventory related to a warehouse unit (both owned by and warehoused at).
**Behavior:**
1. Finds inventories where `unit._id === warehouseUnitId` OR `warehouseUnit._id === warehouseUnitId`.
2. `$lookup` join with Unit collection to resolve unit name/type.
3. Sorted by wareModel name.

---

## 6. Role-Based Scoping Rules

All three models (`inventory`, `consumptionRecord`, `stockMovement`) follow the **same** auto-scoping logic in `gets` and `count`:

### Logic (pseudocode)

```
function applyScoping(activeRole):
  if role is Manager or Admin:
    NO scope restriction (sees all)

  if role is Employee or Ordinary:
    if scopeType == "unit" and scopeId exists:
      match["unit._id"] = scopeId

  if role is UnitHead:
    isWarehouseHead = (unit.type == "Warehouse")
    if isWarehouseHead:
      NO scope restriction (sees all units)
    else:
      match["unit._id"] = scopeId

  if role is OrgHead:
    if scopeType == "organization" and scopeId exists:
      match["unit.organization._id"] = scopeId  // org-dotted down to unit
```

### Scoping Table

| Role | Inventory Scope | Consumption Scope | StockMovement Scope |
|------|----------------|-------------------|---------------------|
| Manager | All | All | All |
| Admin | All | All | All |
| OrgHead | Own org (`unit.organization._id`) | Own org | Own org |
| UnitHead (General) | Own unit | Own unit | Own unit |
| UnitHead (Warehouse) | All units | All units | All units |
| Employee | Own unit | Own unit | Own unit |
| Ordinary | Own unit | Own unit | Own unit |

### Explicit Filter Override

When an explicit filter is provided (e.g. `unitId` in gets), it **replaces** (not AND) the auto-scope filter for that field. This allows:
- Manager/Admin to query any unit.
- UnitHead to narrow further within their scope.
- OrgHead to filter by any unit within their org.

### How `isWarehouseHead` is Determined

```typescript
const isWarehouseHead = await (async () => {
  if (activeRole.name !== "UnitHead") return false;
  if (activeRole.scopeType !== "unit" || !activeRole.scopeId) return false;
  const u = await unit.findOne({
    filters: { _id: new ObjectId(activeRole.scopeId) },
    projection: { type: 1 },
  });
  return u?.type === "Warehouse";
})();
```

This runs on every gets/count call. The unit type is looked up from the database each time. Unit types are defined in `models/unit.ts`:
```
unit_type_array = ["General", "Warehouse", "Logistics", "Production", "Administration", "Finance", "Expert"]
```

---

## 7. Integration Points

### GoodsReceipt → Inventory (addStock)

`goodsReceipt.add` creates a GoodsReceipt document, then for each accepted item:
1. Calls `inventoryManager.addStock()` to create/update inventory and log StockMovement.
2. Updates PurchaseOrderItem status to "received".
3. Auto-advances workflow if current step is "Receipt" or "Delivery".
4. Auto-creates draft PaymentOrder.
5. Auto-converts budget encumbrance to spent.

Relevant front action: `goodsReceipt/add/add.fn.ts` (in back, not front).

### ConsumptionRecord → Inventory (removeStock)

`consumptionRecord.add`:
1. Creates ConsumptionRecord.
2. Calls `inventoryManager.removeStock()` (decrements inventory + StockMovement with `reason: "consumption"`).
3. Optionally pushes history on linked PurchasingRequest.

### Transfer → Inventory (transferStock)

`inventory.transfer` is the raw DB operation. The `inventoryManager.transferStock()` is the system-level function that wraps it with StockMovement logging. Currently `transfer` does NOT call `transferStock` — it only moves quantities. The frontend/future actions should consider wrapping it.

### PurchasingRequest History

When `consumptionRecord.add` receives a `purchasingRequestId`:
```typescript
{
  action: "goods_consumed",
  performed: {
    by: consumedById,
    name: `${user.first_name} ${user.last_name}`,
    at: new Date(),
    role: { id, name, scopeType, scopeId }
  },
  details: {
    consumptionRecordId: result._id,
    wareModelId,
    wareModelName: resolvedWareModelName,
    quantity
  }
}
```

### Dashboard Statistic Integration

The `dashboardStatistic` action (in `src/user/dashboardStatistic.ts`) returns:
- `unit` — user's unit info
- `purchasingRequestCounts` — count of PRs by status
- `pendingApprovalCount`, `recentApprovals`
- `receiptCount` — for warehouse units
- `finance` — budget summary for finance units

The dashboard statistic does NOT yet expose inventory summaries (total stock, low stock alerts, recent movements). If the frontend needs a warehouse dashboard, either extend `dashboardStatistic` or query directly.

---

## 8. Frequently Asked Questions

### Why dot-notation for relation filters?

All MongoDB queries use dot-notation (e.g. `"unit._id"` not `unit`) because Lesan embeds single-type relations as full subdocuments. The field `unit` in MongoDB contains `{ _id: ObjectId, name: "..." }`. Querying with `unit: ObjectId(...)` would try to match the entire object against an ObjectId — which fails silently. Always use:

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `match.unit = ObjectId(id)` | `match["unit._id"] = ObjectId(id)` |
| `match.warehouseUnit = id` | `match["warehouseUnit._id"] = ObjectId(id)` |
| `match.unit = id` (string) | `match["unit._id"] = new ObjectId(id)` |

### How does the compound index work?

The unique index on `{ unit: 1, "wareModel._id": 1 }` means you can have:
- One inventory record per unit+wareModel combo.
- Different units can each have their own record for the same WareModel.
- Same unit can have the same WareModel with different Ware variants (but this violates the index — only one record per unit+model).
- Ware-specific inventory (different Ware, same WareModel) in the same unit is not supported by the index.

### Why doesn't `inventory.adjust` create a StockMovement?

For simplicity. The frontend or a future wrapper action should call `inventoryManager.adjustStock()` if audit trail is needed. The current `adjust` is a raw quantity overwrite.

### Can StockMovement be manually created?

No — there is no `add` action registered for StockMovement. It is read-only via API. Records are created exclusively by `inventoryManager` functions.

### What happens if multiple units have the same WareModel from different Wares?

The unique index `{ unit: 1, "wareModel._id": 1 }` prohibits multiple records for the same unit+wareModel. If you need ware-level granularity (same model, different manufacturer/formulation), the index should be changed to `{ unit: 1, "wareModel._id": 1, "ware._id": 1 }`. This is a known limitation.

### How should the frontend handle the `isWarehouseHead` bypass?

For UnitHead users whose unit.type is "Warehouse", inventory/consumption/stockMovement gets return ALL units' data (not just their own). The frontend should:
- **Display** the `unit` field so the user knows which unit each record belongs to.
- Optionally allow filtering by `unitId` to narrow down.
- Consider adding a unit badge/column showing the unit name.

### What projection fields are available for each model?

Use the `selectStruct` function in the validators to get the typed selection. Alternatively, request these common fields:

**Inventory:** `_id`, `quantity`, `minQuantity`, `maxQuantity`, `batchNo`, `expirationDate`, `location`, `lastCountedAt`, `createdAt`, `updatedAt`, `unit: { _id, name }`, `warehouseUnit: { _id, name }`, `wareModel: { _id, name }`, `ware: { _id, name }`

**ConsumptionRecord:** `_id`, `quantity`, `consumedAt`, `reason`, `patientId`, `notes`, `createdAt`, `unit: { _id, name }`, `consumedBy: { _id, first_name, last_name }`, `wareModel: { _id, name }`, `ware: { _id, name }`, `inventory: { _id, quantity }`

**StockMovement:** `_id`, `quantity`, `balanceBefore`, `balanceAfter`, `reason`, `referenceType`, `referenceId`, `description`, `createdAt`, `unit: { _id, name }`, `createdBy: { _id, first_name, last_name }`, `wareModel: { _id, name }`, `ware: { _id, name }`, `store: { _id, name }`

### Where is the `inventory.add` upsert behavior important?

When creating inventory via `inventory.add`:
- If a record for `(unitId, wareModelId)` already exists, it **updates** the fields (quantity, minQuantity, etc.).
- If not, it **inserts** a new record.
- This means calling `inventory.add` with the same unit+model twice will NOT create a duplicate — it will update the quantity.

For system-level stock operations (goods receipt), `inventoryManager.addStock` has similar behavior but uses `$inc` instead of `$set` so quantities accumulate correctly.
