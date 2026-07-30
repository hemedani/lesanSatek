# `getWarehouseInventory` — Central + Unit Warehouse Inventory

## Purpose

Returns inventory records split into two groups — **central warehouse** (Warehouse-type units) and **unit warehouses** (non-Warehouse units) — scoped to the requesting UnitHead's organization.

Two use cases:
1. **PR detail page** (`/unit-head/requests/:id`) — filter by `wareModelId` to show stock before approving/rejecting
2. **Inventory listing page** (`/unit-head/inventory`) — omit `wareModelId`, use pagination + search for full inventory overview

## API Reference

| Property | Value |
|----------|-------|
| Service | `"main"` |
| Model | `"inventory"` |
| Act | `"getWarehouseInventory"` |
| Auth | UnitHead of a Warehouse-type unit |

## Request — PR Detail (filtered by wareModel)

```json
{
  "service": "main",
  "model": "inventory",
  "act": "getWarehouseInventory",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "wareModelId": "6734a1b2c3d4e5f6a7b8c9d0"
    },
    "get": {
      "_id": 1, "quantity": 1, "minQuantity": 1, "maxQuantity": 1,
      "batchNo": 1, "expirationDate": 1, "location": 1,
      "unit": { "_id": 1, "name": 1, "type": 1 },
      "ware": { "_id": 1, "name": 1 },
      "wareModel": { "_id": 1, "name": 1 }
    }
  }
}
```

## Request — Inventory Listing (paginated, all inventory)

```json
{
  "service": "main",
  "model": "inventory",
  "act": "getWarehouseInventory",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "page": 1,
      "limit": 20,
      "sortBy": "quantity",
      "sortOrder": "asc",
      "search": "TSH"
    },
    "get": {
      "_id": 1, "quantity": 1, "minQuantity": 1, "maxQuantity": 1,
      "batchNo": 1, "expirationDate": 1, "location": 1,
      "unit": { "_id": 1, "name": 1, "type": 1 },
      "ware": { "_id": 1, "name": 1 },
      "wareModel": { "_id": 1, "name": 1 }
    }
  }
}
```

### Set Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeRoleId` | string | ✅ | The active role UUID |
| `wareModelId` | ObjectId | ❌ | Filter by ware model (omit for all inventory) |
| `wareId` | ObjectId | ❌ | Filter by specific ware |
| `search` | string | ❌ | Regex search on `ware.name` / `wareModel.name` |
| `page` | number | ❌ | Page number (default: 1) |
| `limit` | number | ❌ | Items per page (default: 50) |
| `sortBy` | enum | ❌ | `createdAt` / `updatedAt` / `_id` / `quantity` (default: `_id`) |
| `sortOrder` | enum | ❌ | `asc` / `desc` (default: `desc`) |

## Response

### PR Detail (with wareModelId)

```json
{
  "wareModelId": "6734a1b2c3d4e5f6a7b8c9d0",
  "centralWarehouse": {
    "items": [
      { "_id": "inv_wh_001", "quantity": 120, "unit": { "_id": "u_wh", "name": "انبار مرکزی", "type": "Warehouse" }, "ware": { "_id": "w_001", "name": "کیت TSH" } }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  },
  "unitWarehouses": {
    "items": [
      { "_id": "inv_lab_001", "quantity": 15, "unit": { "_id": "u_lab", "name": "آزمایشگاه", "type": "Expert" }, "ware": { "_id": "w_001", "name": "کیت TSH" } }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

### Inventory Listing (without wareModelId)

```json
{
  "centralWarehouse": {
    "items": [
      { "_id": "inv_wh_001", "quantity": 120, "ware": { "name": "کیت TSH زیشیمی" }, "wareModel": { "name": "کیت TSH" } },
      { "_id": "inv_wh_002", "quantity": 50, "ware": { "name": "کیت CBC" }, "wareModel": { "name": "کیت CBC" } }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  },
  "unitWarehouses": {
    "items": [
      { "_id": "inv_lab_001", "quantity": 15, "ware": { "name": "کیت TSH زیشیمی" } },
      { "_id": "inv_lab_002", "quantity": 8, "ware": { "name": "کیت CBC" } }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

## Auth & Scoping

| Role | Access | Notes |
|------|--------|-------|
| **UnitHead** | ✅ | Only if `scopeId` unit `type === "Warehouse"` |
| Others | ❌ | Error |

Auto-scoping:
1. Verify active role is `UnitHead` with `scopeType: "unit"` and valid `scopeId`
2. Fetch the unit, verify `type === "Warehouse"`
3. Extract `organization._id` from the unit
4. Query the Unit collection for ALL units in that org (to get their IDs + types)
5. Query inventory separately for warehouse vs non-warehouse units

## Frontend Usage

### PR Detail Page

```typescript
const res = await api.call("inventory", "getWarehouseInventory", {
  set: { activeRoleId, wareModelId: pr.wareModel._id },
  get: { /* standard inventory projection */ },
});

const centralStock = res.centralWarehouse.items;
const unitStock = res.unitWarehouses.items;
const totalAvailable = [...centralStock, ...unitStock].reduce((s, i) => s + i.quantity, 0);
const isStockSufficient = totalAvailable >= pr.quantity;
```

### Inventory Listing Page

```typescript
const res = await api.call("inventory", "getWarehouseInventory", {
  set: {
    activeRoleId,
    page: 1,
    limit: 20,
    sortBy: "quantity",
    sortOrder: "desc",
    search: searchTerm || undefined,
  },
  get: { /* standard inventory projection */ },
});

// Central warehouse section
res.centralWarehouse.items   // array
res.centralWarehouse.total   // total count for pagination

// Unit warehouse section
res.unitWarehouses.items
res.unitWarehouses.total
```

### Display Priority

- **`centralWarehouse`** — prominent (card, highlight, top). Central warehouse holds bulk stock.
- **`unitWarehouses`** — secondary (smaller list, collapsible). Other units' supplementary stock.

### Edge Cases

- **Empty results**: Each group returns `{ items: [], total: 0, page, limit }`
- **No warehouse units in org**: `centralWarehouse.items` is `[]`
- **All units are warehouses**: `unitWarehouses.items` is `[]`
- **Non-Warehouse UnitHead**: Error "This endpoint is only for heads of Warehouse-type units"
