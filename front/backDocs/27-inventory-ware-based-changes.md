# Inventory Shift: WareModel-based → Ware-based

> Last updated: 2026-07-29
> Backend scope: Models, Actions, InventoryManager Utility, StockMovement, ConsumptionRecord, GoodsReceipt

## Table of Contents

1. [Overview](#1-overview)
2. [Why This Change?](#2-why-this-change)
3. [Inventory Model Changes](#3-inventory-model-changes)
4. [StockMovement Model Changes](#4-stockmovement-model-changes)
5. [ConsumptionRecord Model Changes](#5-consumptionrecord-model-changes)
6. [InventoryManager Utility Changes](#6-inventorymanager-utility-changes)
7. [Inventory `add` Action Changes](#7-inventory-add-action-changes)
8. [Inventory `transfer` Action Changes](#8-inventory-transfer-action-changes)
9. [ConsumptionRecord `add` Action Changes](#9-consumptionrecord-add-action-changes)
10. [GoodsReceipt `add` Action Changes](#10-goodsreceipt-add-action-changes)
11. [Filter Changes (gets/count)](#11-filter-changes-getscount)
12. [Role-Based Scoping Rules](#12-role-based-scoping-rules)
13. [Integration Points & Impact](#13-integration-points--impact)
14. [Frequently Asked Questions](#14-frequently-asked-questions)

---

## 1. Overview

The core change: **Inventory records are now tracked per-Ware instead of per-WareModel.**

| Aspect | Before | After |
|--------|--------|-------|
| Primary identifier | `wareModelId` | `wareId` |
| Unique index | `(unit, wareModel._id)` | `(unit, ware._id)` |
| Hierarchy on Inventory | `wareModel` (required), `ware` (optional) | `ware`, `wareModel`, `wareGroup`, `wareClass`, `wareType` (all required, auto-derived from ware) |
| Hierarchy on StockMovement | `wareModel` (required), `ware` (optional) | `ware` (optional), `wareModel`, `wareGroup`, `wareClass`, `wareType` (all optional, derived from ware) |
| Hierarchy on ConsumptionRecord | `wareModel` (required), `ware` (optional) | `ware` (optional), `wareModel`, `wareGroup`, `wareClass`, `wareType` (all optional, derived from ware) |
| Inventory add input | `wareModelId` (required) + `wareId` (optional) | `wareId` only (all hierarchy derived from ware) |
| InventoryManager primary param | `wareModelId` | `wareId` |

---

## 2. Why This Change?

Each **WareModel** can have multiple **Wares** (different brands, manufacturers, variants). For example:

```
WareModel: "کیت TSH پیشرفته" (Advanced TSH Kit)
  ├── Ware: "کیت TSH پیشرفته ZistShimi"  (ZistShimi brand, price: 2,500,000)
  ├── Ware: "کیت TSH پیشرفته Pishtaz"    (Pishtaz brand, price: 2,800,000)
  └── Ware: "کیت TSH پیشرفته IranLab"    (IranLab brand, price: 3,200,000)
```

Previously, inventory tracked stock at the **WareModel** level — you knew you had 50 "کیت TSH پیشرفته" in total, but you couldn't distinguish which brand/variant. Now inventory tracks at the **Ware** level, so you know exactly how many of each specific product are in stock.

Additionally, all four hierarchy levels (wareType, wareClass, wareGroup, wareModel) are now stored directly on inventory records. This enables efficient aggregation queries for statistics and dashboard reporting without needing to join through the ware chain.

---

## 3. Inventory Model Changes

**File:** `models/inventory.ts`

### 3.1 Pure Fields (unchanged)

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

### 3.2 Relations (changed)

| Relation | Target | Type | Optional | Reverse | Notes |
|----------|--------|------|----------|---------|-------|
| `unit` | Unit | single | no | `unit.inventories` | Unchanged |
| `warehouseUnit` | Unit | single | yes | `unit.warehouseInventories` | Unchanged |
| **`ware`** | Ware | single | **no** (was yes) | `ware.inventories` | **Now required** — primary identifier |
| **`wareModel`** | WareModel | single | no | `wareModel.inventories` | Still required but **auto-derived from ware** |
| **`wareGroup`** (NEW) | WareGroup | single | no | `wareGroup.inventories` | Auto-derived from ware |
| **`wareClass`** (NEW) | WareClass | single | no | `wareClass.inventories` | Auto-derived from ware |
| **`wareType`** (NEW) | WareType | single | no | `wareType.inventories` | Auto-derived from ware |

### 3.3 Index (changed)

| Before | After |
|--------|-------|
| Unique compound: `{ unit: 1, "wareModel._id": 1 }` | Unique compound: `{ unit: 1, "ware._id": 1 }` |

Enforces one inventory record per unit+ware combination.

---

## 4. StockMovement Model Changes

**File:** `models/stockMovement.ts`

### 4.1 Relations (changed)

| Relation | Target | Type | Optional | Notes |
|----------|--------|------|----------|-------|
| `unit` | Unit | single | no | Unchanged |
| `createdBy` | User | single | no | Unchanged |
| `store` | Store | single | yes | Unchanged |
| **`ware`** | Ware | single | yes | Was already optional, now primary |
| **`wareModel`** | WareModel | single | **yes** (was no) | Now optional — derived from ware |
| **`wareGroup`** (NEW) | WareGroup | single | yes | Auto-derived from ware |
| **`wareClass`** (NEW) | WareClass | single | yes | Auto-derived from ware |
| **`wareType`** (NEW) | WareType | single | yes | Auto-derived from ware |

All hierarchy-level relations on StockMovement are optional. They get populated when the system creates the movement via `inventoryManager` (which always has access to the ware hierarchy). They remain optional for backward compatibility with any existing records.

---

## 5. ConsumptionRecord Model Changes

**File:** `models/consumptionRecord.ts`

### 5.1 Relations (changed)

| Relation | Target | Type | Optional | Notes |
|----------|--------|------|----------|-------|
| `unit` | Unit | single | no | Unchanged |
| `consumedBy` | User | single | no | Unchanged |
| `inventory` | Inventory | single | yes | Unchanged |
| **`ware`** | Ware | single | yes | Was already optional, now primary |
| **`wareModel`** | WareModel | single | **yes** (was no) | Now optional — derived from ware |
| **`wareGroup`** (NEW) | WareGroup | single | yes | Auto-derived from ware |
| **`wareClass`** (NEW) | WareClass | single | yes | Auto-derived from ware |
| **`wareType`** (NEW) | WareType | single | yes | Auto-derived from ware |

---

## 6. InventoryManager Utility Changes

**File:** `utils/inventoryManager.ts`

### 6.1 New Helper: `getWareHierarchy(wareId)`

A new internal helper that fetches the `wareModel`, `wareGroup`, `wareClass`, `wareType` from a `Ware` document by its ID:

```typescript
async function getWareHierarchy(wareId: string): Promise<{
  wareModelId: ObjectId;
  wareGroupId: ObjectId;
  wareClassId: ObjectId;
  wareTypeId: ObjectId;
}>
```

### 6.2 Function Signature Changes

#### `addStock(unitId, wareId, quantity, reason, createdByUserId, options?)`

| Param | Before | After |
|-------|--------|-------|
| 2nd param | `wareModelId: string` | **`wareId: string`** |
| Internal logic | Looked up inventory by `(unit, wareModel._id)` | Looks up by `(unit, ware._id)` |
| Relations built | `unit`, `wareModel`, `ware` (optional) | `unit`, `ware`, `wareModel`, `wareGroup`, `wareClass`, `wareType` (all from hierarchy) |

#### `removeStock(unitId, wareId, quantity, reason, createdByUserId, options?)`

| Param | Before | After |
|-------|--------|-------|
| 2nd param | `wareModelId: string` | **`wareId: string`** |
| Inventory lookup | by `(unit, wareModel._id)` | by `(unit, ware._id)` (or `_id` if `inventoryId` provided) |
| Relations built on StockMovement | `unit`, `createdBy`, `wareModel`, `ware` (optional) | `unit`, `createdBy`, `ware`, `wareModel`, `wareGroup`, `wareClass`, `wareType` |

#### `transferStock(fromUnitId, toUnitId, wareId, quantity, createdByUserId, options?)`

| Param | Before | After |
|-------|--------|-------|
| 3rd param | `wareModelId: string` | **`wareId: string`** |

#### `getStockLevel(unitId, wareId)`

| Param | Before | After |
|-------|--------|-------|
| 2nd param | `wareModelId: string` | **`wareId: string`** |
| Query filter | `(unit._id, wareModel._id)` | `(unit._id, ware._id)` |

#### `getWarehouseDashboard(warehouseUnitId, wareModelId?, wareId?)`

| Param | New | Notes |
|-------|-----|-------|
| `warehouseUnitId` | Required | Unchanged |
| `wareModelId` | Optional (unchanged) | Filters by `wareModel._id` on inventory — useful for PR warehouse checks |
| **`wareId`** | **NEW** | Optional — filters by `ware._id` for specific ware lookups |

---

## 7. Inventory `add` Action Changes

**Files:** `src/inventory/add/add.val.ts`, `src/inventory/add/add.fn.ts`

### 7.1 Validator (input schema)

**Before:**
```
set: {
  ...activeRoleMixin,
  quantity: number() (default 0),
  minQuantity?: number,
  maxQuantity?: number,
  batchNo?: string,
  expirationDate?: Date,
  location?: string,
  lastCountedAt?: Date,
  unitId: ObjectId (required),
  warehouseUnitId?: ObjectId,
  wareModelId: ObjectId (required),   <-- was required input
  wareId?: ObjectId,                   <-- was optional input
}
```

**After:**
```
set: {
  ...activeRoleMixin,
  quantity: number() (default 0),
  minQuantity?: number,
  maxQuantity?: number,
  batchNo?: string,
  expirationDate?: Date,
  location?: string,
  lastCountedAt?: Date,
  unitId: ObjectId (required),
  warehouseUnitId?: ObjectId,
  wareId: ObjectId (required),         <-- now required, only input needed
}
```

### 7.2 Logic (fn)

**Step-by-step flow (before → after):**

| Step | Before | After |
|------|--------|-------|
| 1. Validate role | Same | Same |
| 2. Fetch hierarchy | N/A | Fetches Ware by `wareId` to get `wareModel`, `wareGroup`, `wareClass`, `wareType` |
| 3. Check existence | by `(unit._id, wareModel._id)` | by `(unit._id, ware._id)` |
| 4. If exists (update) | `$set` on pure fields | Same (no change) |
| 5. If not exists (insert) | Creates with unit + warehouseUnit + wareModel + ware (optional) | Creates with unit + warehouseUnit + ware + wareModel + wareGroup + wareClass + wareType (all derived from ware) |

---

## 8. Inventory `transfer` Action Changes

**Files:** `src/inventory/transfer/transfer.val.ts`, `src/inventory/transfer/transfer.fn.ts`

### 8.1 Validator

**Before:** `wareModelId: ObjectId (required)`
**After:** `wareId: ObjectId (required)`

### 8.2 Logic

| Aspect | Before | After |
|--------|--------|-------|
| Source lookup | by `(fromUnitId, wareModel._id)` | by `(fromUnitId, ware._id)` |
| Destination lookup | by `(toUnitId, wareModel._id)` | by `(toUnitId, ware._id)` |

---

## 9. ConsumptionRecord `add` Action Changes

**Files:** `src/consumptionRecord/add/add.val.ts`, `src/consumptionRecord/add/add.fn.ts`

### 9.1 Validator

**Before:**
```
wareModelId: ObjectId (required),
wareId?: ObjectId,
```

**After:**
```
wareId: ObjectId (required),
```

### 9.2 Logic

| Step | Before | After |
|------|--------|-------|
| Fetch ware hierarchy | N/A | Fetches Ware to get all 4 hierarchy levels |
| Build relations | unit, consumedBy, wareModel + ware (optional) + inventory (optional) | unit, consumedBy, **ware**, **wareModel**, **wareGroup**, **wareClass**, **wareType** + inventory (optional) |
| Call removeStock | `removeStock(unitId, wareModelId, ...)` with `wareId` in options | `removeStock(unitId, **wareId**, ...)` — wareId is now primary |
| History entry | logs `wareModelId` + resolved `wareModelName` | logs `wareId` + derived `wareModelName` from ware doc |

---

## 10. GoodsReceipt `add` Action Changes

**File:** `src/goodsReceipt/add/add.fn.ts`

### 10.1 Logic Change

The goods receipt items still carry `wareModelId` as a **pure field** (embedded data for documentation), but `wareId` is now required for the inventory creation to work.

**Before:**
```typescript
await addStock(
  receivingUnitId,
  item.wareModelId,   // primary was wareModelId
  item.quantityAccepted,
  "goods_receipt",
  userId,
  {
    wareId: item.wareId,      // optional
    ...
  },
);
```

**After:**
```typescript
if (item.wareId) {
  await addStock(
    receivingUnitId,
    item.wareId,              // primary is now wareId
    item.quantityAccepted,
    "goods_receipt",
    userId,
    {
      wareModelId: item.wareModelId,  // passed as reference
      ...
    },
  );
}
```

If an item does not have a `wareId`, the stock addition is **skipped** (goods receipt documents the receipt without creating inventory entries). The `totalAccepted` calculation still includes all items regardless of `wareId`.

---

## 11. Filter Changes (gets/count)

### 11.1 Inventory `gets` / `count`

**New filter field:** `wareId?: ObjectId`

```
set: {
  ...
  wareId?: ObjectId,           // NEW — filter by specific ware
  wareModelId?: ObjectId,      // kept for backward compat — filter by wareModel
  ...
}
```

MongoDB query match:
```typescript
wareId && (match["ware._id"] = new ObjectId(wareId));           // NEW
wareModelId && (match["wareModel._id"] = new ObjectId(wareModelId)); // kept
```

### 11.2 StockMovement `gets` / `count`

**New filter field:** `wareId?: ObjectId`

```
set: {
  ...
  wareId?: ObjectId,           // NEW — filter by specific ware
  wareModelId?: string,        // kept
  ...
}
```

---

## 12. Role-Based Scoping Rules

Scoping rules for inventory/stockMovement/consumptionRecord `gets` and `count` remain unchanged. The only difference is that filters now also support `wareId`.

| Role | Scope |
|------|-------|
| Manager / Admin | No auto-filter (sees all) |
| OrgHead | `unit.organization._id = scopeId` |
| UnitHead (Warehouse) | No auto-filter (sees all units) |
| UnitHead (non-Warehouse) | `unit._id = scopeId` |
| Employee / Ordinary | `unit._id = scopeId` |

---

## 13. Integration Points & Impact

### 13.1 Frontend Impact

| Feature | Impact | Action Required |
|---------|--------|----------------|
| **Inventory Add Form** | Input changed from `wareModelId` to `wareId` | Must send `wareId` instead of `wareModelId`. No need to send wareModel/wareGroup/wareClass/wareType — these are auto-derived on the backend |
| **Inventory List / Table** | Filter by `wareId` added | Can optionally add a ware filter |
| **Inventory Transfer Form** | Input changed from `wareModelId` to `wareId` | Must send `wareId` |
| **ConsumptionRecord Add** | Input changed from `wareModelId` to `wareId` | Must send `wareId` |
| **GoodsReceipt Add** | Items must include `wareId` | Must ensure `wareId` is populated in each item's data |
| **StockMovement List** | Filter by `wareId` added | Optional |
| **Dashboard / Statistics** | Can now aggregate inventory by wareType/wareClass/wareGroup | New query capabilities available |

### 13.2 API Contract Changes

| Endpoint | Before | After |
|----------|--------|-------|
| `inventory.add` set | `{ ..., wareModelId: ObjectId, wareId?: ObjectId }` | `{ ..., wareId: ObjectId }` |
| `inventory.transfer` set | `{ ..., wareModelId: ObjectId }` | `{ ..., wareId: ObjectId }` |
| `consumptionRecord.add` set | `{ ..., wareModelId: ObjectId, wareId?: ObjectId }` | `{ ..., wareId: ObjectId }` |
| `inventory.gets` set | `{ ..., wareModelId?: ObjectId }` | `{ ..., wareId?: ObjectId, wareModelId?: ObjectId }` |
| `inventory.count` set | `{ ..., wareModelId?: string }` | `{ ..., wareId?: ObjectId, wareModelId?: string }` |
| `stockMovement.gets` set | `{ ..., wareModelId?: string }` | `{ ..., wareId?: ObjectId, wareModelId?: string }` |
| `stockMovement.count` set | `{ ..., wareModelId?: string }` | `{ ..., wareId?: ObjectId, wareModelId?: string }` |

### 13.3 Inventory Response Shape

When fetching an inventory record, you can now request hierarchy relations:

```json
{
  "_id": "...",
  "quantity": 50,
  "unit": { "_id": "...", "name": "انبار مرکزی" },
  "ware": { "_id": "...", "name": "کیت TSH پیشرفته ZistShimi", "brand": "ZistShimi" },
  "wareModel": { "_id": "...", "name": "کیت TSH پیشرفته" },
  "wareGroup": { "_id": "...", "name": "کیت" },
  "wareClass": { "_id": "...", "name": "هماتولوژی" },
  "wareType": { "_id": "...", "name": "تجهیزات آزمایشگاهی" }
}
```

### 13.4 StockMovement Response Shape

```json
{
  "_id": "...",
  "quantity": 50,
  "balanceBefore": 0,
  "balanceAfter": 50,
  "reason": "goods_receipt",
  "unit": { "_id": "...", "name": "انبار مرکزی" },
  "ware": { "_id": "...", "name": "کیت TSH پیشرفته ZistShimi" },
  "wareModel": { "_id": "...", "name": "کیت TSH پیشرفته" },
  "wareGroup": { "_id": "...", "name": "کیت" },
  "wareClass": { "_id": "...", "name": "هماتولوژی" },
  "wareType": { "_id": "...", "name": "تجهیزات آزمایشگاهی" }
}
```

---

## 14. Frequently Asked Questions

### Q1: What if I still have `wareModelId` from an old integration?

The backend will reject requests to `inventory.add`, `inventory.transfer`, and `consumptionRecord.add` that send `wareModelId` as a top-level field — these validators no longer accept it. You **must** send `wareId` instead. The `wareModelId` is still accepted as an optional filter in `gets`/`count`.

### Q2: Can I send `wareModelId`, `wareGroupId`, `wareClassId`, `wareTypeId` along with `wareId` to be explicit?

**No.** The hierarchy is **always** auto-derived from the ware on the backend. Sending these fields in `inventory.add` will cause a validation error (they are not in the validator). The backend fetches the Ware document and extracts all hierarchy relations automatically.

### Q3: Is `wareId` required in `goodsReceipt.add` items?

`wareId` is optional in the item schema for backward compatibility, but the `addStock` call will only run if `wareId` is present. Without it, inventory won't be updated. **Always include `wareId`** for proper inventory tracking.

### Q4: What happens to existing inventory records?

Existing records will have the old index on `(unit, wareModel._id)` and will lack the new `wareType`, `wareClass`, `wareGroup` relations. A one-time data migration script is needed to:
1. Drop the old index
2. Create the new unique index on `(unit, ware._id)`
3. Backfill `wareType`, `wareClass`, `wareGroup` relations from each record's `ware` relation

### Q5: How does this affect the `purchasingRequest.warehouseCheck` endpoint?

It still works via `getWarehouseDashboard()` which supports both `wareModelId` and the new `wareId` filter. The PR has a `wareModel` relation (unchanged), so warehouse check can query all inventory records for that `wareModel._id` to see stock across all wares of that model.

### Q6: How do I query inventory records for all wares of a specific WareModel?

Use the `wareModelId` filter (still supported):
```
inventory.gets({ set: { wareModelId: "..." } })
```

### Q7: How do I get statistics grouped by wareType/wareClass/wareGroup?

Since these relations are now embedded on every inventory record, you can aggregate directly:
```
inventory.aggregation({
  pipeline: [
    { $group: { _id: "$wareType._id", totalQuantity: { $sum: "$quantity" } } }
  ]
})
```

### Q8: Can I still look up stock level by wareModel (across all wares)?

Use `getWarehouseDashboard(unitId, wareModelId)` which still supports the `wareModelId` parameter and will match all inventory records with that `wareModel._id`.
