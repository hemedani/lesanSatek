# Consumption Model — Frontend Integration Guide

## Overview

The **Consumption** model tracks goods/stock usage within the system. When inventory stock is consumed (used, dispensed in a lab, etc.), a Consumption record is created which automatically decrements the corresponding Inventory record. This is the inventory-side twin of GoodsReceipt (which *adds* stock).

## Model Name (API)

| Context | Value |
|---------|-------|
| Model key | `"consumption"` |
| Service | `"main"` |
| API endpoint | `/consumption/add` (Lesan internal routing) |

## Available Actions

| Action | Method | Auth Roles | Description |
|--------|--------|------------|-------------|
| `add` | POST | Manager, Admin, OrgHead, UnitHead, Employee | Create consumption → auto-decrement inventory |
| `get` | POST | All roles (incl. Ordinary) | Get single consumption by `_id` |
| `gets` | POST | All roles (incl. Ordinary) | List consumption with filters, pagination, role-based scoping |
| `count` | POST | All roles (incl. Ordinary) | Count consumption with same filters |
| `remove` | POST | Manager, Admin only | Delete a consumption record |

## Pure Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quantity` | number | ✅ | Amount consumed (positive integer) |
| `consumedAt` | string (ISO date) | ✅ | Auto-coerced from string to Date |
| `reason` | string | ❌ | Free-text reason (e.g. "استفاده برای آزمایش بیمار") |
| `consumedFor` | string | ❌ | Person full name this consumption was for |
| `notes` | string | ❌ | Additional notes |

## Relations (populated via Lesan)

All hierarchy relations are **auto-derived from the Ware** — the frontend never sends them directly:

| Relation | Type | Required | Auto-derived? |
|----------|------|----------|---------------|
| `unit` | single | ✅ | Can be derived from activeRole if omitted |
| `consumedBy` | single (User) | ✅ | Can be derived from logged-in user if omitted |
| `inventory` | single (Inventory) | ❌ | Optional link back to the inventory record |
| `ware` | single (Ware) | ✅ | **Sent by frontend** — the master key from which all hierarchy is derived |
| `wareModel` | single | ❌ | Auto-derived from `ware` |
| `wareGroup` | single | ❌ | Auto-derived from `ware` |
| `wareClass` | single | ❌ | Auto-derived from `ware` |
| `wareType` | single | ❌ | Auto-derived from `ware` |

**Important**: Frontend only sends `wareId`. The backend fetches the Ware document and extracts `ware._id`, `wareModel._id`, `wareGroup._id`, `wareClass._id`, and `wareType._id` to build all 5 relations automatically.

## Request Examples

### `add` — Create Consumption

**Minimum request** (frontend only needs `wareId`, `quantity`, `consumedAt`):

```json
{
  "service": "main",
  "model": "consumption",
  "act": "add",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "wareId": "6734a1b2c3d4e5f6a7b8c9d0",
      "quantity": 5,
      "consumedAt": "2026-04-02"
    },
    "get": {
      "_id": 1,
      "quantity": 1,
      "consumedAt": 1,
      "reason": 1,
      "consumedFor": 1,
      "notes": 1,
      "unit": { "name": 1 },
      "consumedBy": { "first_name": 1, "last_name": 1 },
      "ware": { "name": 1, "enName": 1 },
      "wareModel": { "name": 1 },
      "wareGroup": { "name": 1 },
      "wareClass": { "name": 1 },
      "wareType": { "name": 1 },
      "inventory": { "_id": 1 },
      "createdAt": 1,
      "updatedAt": 1
    }
  }
}
```

**Full request** (with all optional fields):

```json
{
  "service": "main",
  "model": "consumption",
  "act": "add",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "wareId": "6734a1b2c3d4e5f6a7b8c9d0",
      "quantity": 5,
      "consumedAt": "2026-04-02",
      "reason": "استفاده برای آزمایش بیمار",
      "consumedFor": "علی محمدی",
      "notes": "کیت‌های شماره سریال KT-001 مصرف شدند",
      "unitId": "6734a1b2c3d4e5f6a7b8c9d1",
      "consumedById": "6734a1b2c3d4e5f6a7b8c9d2",
      "inventoryId": "6734a1b2c3d4e5f6a7b8c9d3",
      "purchasingRequestId": "6734a1b2c3d4e5f6a7b8c9d4"
    },
    "get": { "_id": 1, "quantity": 1, "reason": 1 }
  }
}
```

### `get` — Get Single Consumption

```json
{
  "service": "main",
  "model": "consumption",
  "act": "get",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "_id": "6734a1b2c3d4e5f6a7b8c9d0"
    },
    "get": { "_id": 1, "quantity": 1, "reason": 1 }
  }
}
```

### `gets` — List Consumptions

```json
{
  "service": "main",
  "model": "consumption",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "page": 1,
      "limit": 50,
      "sortBy": "consumedAt",
      "sortOrder": "desc",
      "unitId": "6734a1b2c3d4e5f6a7b8c9d1",
      "wareModelId": "6734a1b2c3d4e5f6a7b8c9d5",
      "reason": "آزمایش",
      "consumedFor": "علی"
    },
    "get": { "_id": 1, "quantity": 1, "reason": 1 }
  }
}
```

Pagination defaults: `page=1`, `limit=50`. Sortable fields: `createdAt`, `updatedAt`, `_id`, `quantity`, `consumedAt`.

### `count` — Count Consumptions

Same filters as `gets` (unitId, wareModelId, reason, consumedFor). Returns `{ "qty": number }`.

### `remove` — Delete Consumption

```json
{
  "service": "main",
  "model": "consumption",
  "act": "remove",
  "details": {
    "set": {
      "activeRoleId": "role-uuid-here",
      "_id": "6734a1b2c3d4e5f6a7b8c9d0",
      "hardCascade": false
    },
    "get": { "success": 1 }
  }
}
```

## Auto-Derivation Rules for `add`

The `add` action has smart defaults — here's how `unitId` and `consumedById` are resolved:

### `unitId`
1. If explicitly provided in set → use as-is
2. If omitted but activeRole has `scopeType: "unit"` → use `activeRole.scopeId`
3. If still empty → **error**: "unitId is required and cannot be derived from active role"

### `consumedById`
1. If explicitly provided in set → use as-is
2. If omitted → use `user._id` (the currently logged-in user)

## Role-Based Scoping (gets / count)

When listing or counting consumptions, the backend applies auto-scoping based on the user's active role:

| Active Role | Scope Logic |
|-------------|-------------|
| **Manager, Admin** | See ALL consumptions across all orgs/units |
| **OrgHead** | Scoped to unit's organization: `match["unit.organization._id"] = orgId` |
| **UnitHead** (non-Warehouse) | Scoped to own unit: `match["unit._id"] = unitId` |
| **UnitHead** (Warehouse type) | **No scoping** — sees all (Warehouse heads oversee cross-unit consumption) |
| **Employee, Ordinary** | Scoped to own unit: `match["unit._id"] = unitId` |

**Additional manual filters** can override/enhance scoping:
- `unitId` — filter by specific unit
- `wareModelId` — filter by wareModel
- `reason` — regex match (case-insensitive)
- `consumedFor` — regex match (case-insensitive)

**Important for frontend UX**: When a non-Manager/Admin user calls `gets` or `count`, the response is already scoped server-side. Do NOT additionally filter by `activeRole.scopeId` on the frontend.

## Side Effects of `add`

### 1. Stock Decrement
The `add` action calls `inventoryManager.removeStock()` which:
- Decrements the matching Inventory record's `quantity` for the given `unit` + `ware`
- Creates a **StockMovement** record with:
  - `reason: "consumption"`
  - `referenceType: "consumption"`
  - `referenceId: <new consumption _id>`
  - `balanceBefore` / `balanceAfter` for audit trail

### 2. PurchasingRequest History (optional)
If `purchasingRequestId` is provided, the action pushes a `goods_consumed` entry into the PR's `history` array:

```json
{
  "action": "goods_consumed",
  "performed": {
    "by": "<consumedById or current user _id>",
    "name": "FirstName LastName",
    "at": "<now>",
    "role": { "id": "<roleId>", "name": "<roleName>" }
  },
  "details": {
    "consumptionId": "<new consumption _id>",
    "wareId": "<wareId>",
    "wareModelName": "<derived from ware>",
    "quantity": <consumed quantity>
  }
}
```

## Hierarchy Auto-Derivation from Ware

The 4-level hierarchy (wareModel, wareGroup, wareClass, wareType) is fetched from the Ware document and stored as Lesan relations. The frontend **never** sends these IDs — only `wareId`. This means:

- **Consumption list queries** can filter by any hierarchy level (e.g. `wareModelId` in `gets`)
- **Stats/reports** can aggregate consumption by wareType, wareClass, etc. without joins
- **Changing hierarchy on a Ware** is retroactively visible on new consumption records (old records keep the stale relation, which is correct audit behavior)

## Feature Gate

The `canCreateConsumptionRecord` feature constant exists in `models/featureConstants.ts` for frontend UI gating. Check `user.features` array before showing the "Create Consumption" button.

```typescript
const canCreate = user.features?.some(f => f.feature === "canCreateConsumptionRecord");
```

## E2E Test Example

From `http/e2e.json` (consumption add entry):

```json
{
  "id": "gen-consumption",
  "bodyHeaders": {
    "headers": { "Content-Type": "application/json", "token": "{token}" },
    "body": {
      "service": "main",
      "model": "consumption",
      "act": "add",
      "details": {
        "set": {
          "wareId": "{wareId}",
          "quantity": 5,
          "consumedAt": "2026-04-02",
          "reason": "تست روتین آزمایشگاه",
          "unitId": "{unitId}",
          "consumedById": "{userId}",
          "inventoryId": "{inventoryId}",
          "activeRoleId": "{roleId}"
        },
        "get": { "_id": 1, "quantity": 1, "reason": 1 }
      }
    }
  }
}
```

## Key Differences from Old `consumptionRecord` Model

| Aspect | Old (`consumptionRecord`) | New (`consumption`) |
|--------|--------------------------|---------------------|
| API model key | `"consumptionRecord"` | `"consumption"` |
| Patient field | `patientId` (string, HIS ref) | `consumedFor` (string, person full name) |
| Hierarchy | Manual (send wareModelId) | Auto-derived from `wareId` |
| API endpoint | `/consumptionRecord/add` | `/consumption/add` |
| Reverse relation key | `consumptionRecords` | `consumptions` |
| Import name | `consumptionRecords` | `consumptions` or `consumption` |

## Summary for Frontend Devs

1. **Always send `wareId`** — never send wareModelId/wareGroupId/wareClassId/wareTypeId for consumption
2. **`unitId` and `consumedById` are optional** — smart defaults from activeRole/current user
3. **`purchasingRequestId` is optional** — if provided, consumption is recorded in the PR's history
4. **`consumedFor` replaces `patientId`** — it's now a free-text person name, not an ID
5. **Role-based scoping is server-enforced** for `gets`/`count` — no frontend scope filtering needed
6. **Stock is auto-decremented** — no separate inventory update call is needed
7. **StockMovement is auto-created** — audit trail is generated transparently
