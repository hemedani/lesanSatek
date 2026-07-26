# `user.dashboardStatistic` — Unit Head Dashboard Data API

## Overview

A single backend action that returns all statistics needed for the `/unit-head` dashboard. Instead of making 4–5 separate `count`/`gets` calls, the frontend calls **one** endpoint with a `get` projection to request only the fields it needs.

**Model:** `user`
**Action:** `dashboardStatistic`
**Type:** `"unitHead"`

---

## Request Format

```json
{
  "model": "user",
  "act": "dashboardStatistic",
  "details": {
    "set": {
      "activeRoleId": "<uuid>",
      "type": "unitHead",
      "unitId": "<ObjectId>",
      "orgId": "<ObjectId>"
    },
    "get": {
      "unit": 1,
      "purchasingRequestCounts": 1,
      "pendingApprovalCount": 1,
      "recentApprovals": 1,
      "finance": 1,
      "receiptCount": 1,
      "fiscalYear": 1,
      "paymentOrders": 1
    }
  }
}
```

### `set` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeRoleId` | string (UUID) | **yes** | The user's active role UUID from their `roles` array |
| `type` | `"unitHead"` | **yes** | Enforced enum — currently only `"unitHead"` is supported |
| `unitId` | string (ObjectId) | no | Explicit unit scope. **For Manager/Admin/OrgHead only** — allows scoping stats to a specific unit. Ignored when the active role is `UnitHead` (unit is forced from role scope). |
| `orgId` | string (ObjectId) | no | Explicit org scope. Used when `unitId` is not provided. Scopes stats by organization. |

### `get` Fields (projection)

| Field | Type | Description |
|-------|------|-------------|
| `unit` | `0` or `1` | Return `{ _id, name, type }` of the scoped unit |
| `purchasingRequestCounts` | `0` or `1` | Return counts by status: `draft`, `pending`, `approved`, `rejected`, `total` |
| `pendingApprovalCount` | `0` or `1` | Number of stepApprovals with `status: "pending"` for this unit |
| `recentApprovals` | `0` or `1` | Last 5 pending stepApprovals (newest first), each with `{ _id, status, createdAt }` |
| `finance` | `0` or `1` | Finance-specific stats (only meaningful for Finance-type units). Returns `budgetLineCount`, `totalAllocated`, `totalSpent`, `totalRemaining`, `pendingPaymentCount` |
| `receiptCount` | `0` or `1` | Number of purchasing requests with `stuffStatus: "delivered"`. Only returned when unit type is `"Warehouse"` or when there's no unit scope (Manager/Admin global view). |
| `fiscalYear` | `0` or `1` | Fiscal year info: `{ count, active }`. Returns total count of fiscal years and the currently active one. Available to all roles but most relevant for Finance units. |
| `paymentOrders` | `0` or `1` | Payment order counts by status: `{ draft, sent_to_finance, paid, cancelled }`. Only returned when unit type is `"Finance"` or no unit scope. |

---

## Authorization

| Role | Behavior |
|------|----------|
| **UnitHead** | Unit is **forced** from `activeRole.scopeId` (must have `scopeType: "unit"`). `unitId`/`orgId` params are ignored. Throws `"UnitHead role must have a unit scope"` if scope is missing. |
| **Manager, Admin, OrgHead** | Can optionally pass `unitId` or `orgId` to scope the stats. If neither is passed, stats are **global** (all records). |

---

## Response Shape

```typescript
type DashboardResponse = {
  // Common fields (returned when requested in get projection)
  unit?: {
    _id: string;
    name: string;
    type: "General" | "Warehouse" | "Logistics" | "Production" | "Administration" | "Finance" | "Expert";
  };

  purchasingRequestCounts?: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };

  pendingApprovalCount?: number;

  recentApprovals?: Array<{
    _id: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;  // ISO date
  }>;

  // Finance-type extras (only when get.finance === 1 AND unit.type === "Finance")
  finance?: {
    budgetLineCount: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    pendingPaymentCount: number;
  };

  // Warehouse-type extras (only when get.receiptCount === 1 AND unit.type === "Warehouse")
  receiptCount?: number;

  // Fiscal year info (available to all)
  fiscalYear?: {
    count: number;
    active: {
      _id: string;
      name: string;
      startDate: string;  // ISO date
      endDate: string;    // ISO date
      isActive: boolean;
      status: "open" | "closed";
    } | null;
  };

  // Payment order counts by status (Finance-type extras)
  paymentOrders?: {
    draft: number;
    sent_to_finance: number;
    paid: number;
    cancelled: number;
  };
};
```

### Response Logic Summary

| `get` field | Required unit type | Returned when |
|-------------|-------------------|---------------|
| `unit` | any | `get.unit === 1` + unit resolved |
| `purchasingRequestCounts` | any | Always (if requested) |
| `pendingApprovalCount` | any | Always (if requested) |
| `recentApprovals` | any | Always (if requested). Empty array `[]` if none found. |
| `finance` | `"Finance"` | Only if unit type is Finance, OR no unit scope (Manager/Admin global). Otherwise silently omitted. |
| `receiptCount` | `"Warehouse"` | Only if unit type is Warehouse, OR no unit scope. Otherwise silently omitted. |
| `fiscalYear` | any | Always (if requested). Active fiscal year is `null` if none set. |
| `paymentOrders` | `"Finance"` | Only if unit type is Finance, OR no unit scope. Otherwise silently omitted. |

---

## Scoping Behavior per Statistic

| Statistic | unitId scope | orgId scope | No scope (Manager/Admin) |
|-----------|-------------|-------------|--------------------------|
| `purchasingRequestCounts` | `requestingUnit._id` | `organization._id` | All PRs |
| `receiptCount` | `requestingUnit._id` + `stuffStatus:"delivered"` | `organization._id` + `stuffStatus:"delivered"` | All PRs with delivered stuff |
| `pendingApprovalCount` | `unit._id` | **Not available** (no org relation on stepApproval) | All stepApprovals |
| `recentApprovals` | `unit._id` | **Not available** | All stepApprovals (last 5 pending) |
| `finance.budgetLine` | **Finance unit**: `organization._id` (org-wide budget). **Other units**: `unit._id`. | `organization._id` | All budgetLines |
| `finance.paymentOrder` | `financialUnit._id` + `status:"sent_to_finance"` | **Not available** (no org relation on paymentOrder) | All sent_to_finance paymentOrders |
| `fiscalYear` | None (fiscalYear has no unit scope) | `organization._id` | All fiscal years |
| `paymentOrders` | `financialUnit._id` (grouped by status) | **Not available** | All payment orders (grouped by status) |

---

## Performance Notes

- Stats are computed via **MongoDB aggregation `$facet`** — multiple stats share a single DB round-trip within each model.
- Maximum 5 DB calls when all 8 `get` fields are requested:
  1. **Unit fetch** (sequential — needed to decide type-specific extras)
  2. **PurchasingRequest `$facet`** (PR counts + receipt count)
  3. **StepApproval `$facet`** (pending count + recent approvals)
  4. **If Finance type**: budgetLine `$group` + paymentOrder `$count` (parallel)
  5. **fiscalYear `$facet`** (active year + total count)
  6. **paymentOrders `$facet`** (counts by status)
- All aggregation tasks run in parallel via `Promise.all` after the unit fetch.

---

## Frontend Usage Examples

### UnitHead (own unit)

```typescript
const unitHeadRole = user.roles.find(r => r.name === "UnitHead");

const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: unitHeadRole.roleId,
        type: "unitHead",
        // unitId NOT passed — backend forces from scopeId
      },
      get: {
        unit: 1,
        purchasingRequestCounts: 1,
        pendingApprovalCount: 1,
        recentApprovals: 1,
        receiptCount: 1,  // only returned if unit.type === "Warehouse"
      },
    },
  }),
});

const data = await response.json();
// data.unit — the user's unit info
// data.purchasingRequestCounts.draft — drafts count
// data.purchasingRequestCounts.pending — pending count
// data.purchasingRequestCounts.total — all PRs count
// data.pendingApprovalCount — pending approvals
// data.recentApprovals — last 5 pending approvals
// data.receiptCount — only if Warehouse unit
```

### Manager/Admin viewing a specific unit

```typescript
const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: managerRole.roleId,
        type: "unitHead",
        unitId: "665a1b2c3d4e5f6a7b8c9d0e",  // any unit
      },
      get: { unit: 1, purchasingRequestCounts: 1 },
    },
  }),
});
```

### Manager/Admin org-wide view

```typescript
const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: managerRole.roleId,
        type: "unitHead",
        orgId: "665a1b2c3d4e5f6a7b8c9d0f",  // org scope
      },
      get: { purchasingRequestCounts: 1, finance: 1 },
    },
  }),
});
// PR counts scoped to org
// Finance stats scoped to org (budgetLine) + all sent_to_finance (paymentOrder)
```

### Finance UnitHead (full dashboard with fiscal years + payment orders)

```typescript
const financeHeadRole = user.roles.find(
  r => r.name === "UnitHead" && r.scopeId === financeUnitId
);

const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: financeHeadRole.roleId,
        type: "unitHead",
      },
      get: {
        unit: 1,
        purchasingRequestCounts: 1,
        pendingApprovalCount: 1,
        recentApprovals: 1,
        finance: 1,           // budgetLineCount, totalAllocated/Spent/Remaining, pendingPaymentCount
        fiscalYear: 1,        // { count, active: { name, startDate, endDate, status } }
        paymentOrders: 1,     // { draft, sent_to_finance, paid, cancelled }
      },
    },
  }),
});

const data = await response.json();
// data.unit — { _id, name, type: "Finance" }
// data.finance.budgetLineCount — total budget lines in the org
// data.finance.totalAllocated / totalSpent / totalRemaining — org-wide budget sums
// data.finance.pendingPaymentCount — payment orders awaiting payment
// data.fiscalYear.count — total fiscal years
// data.fiscalYear.active — the currently active fiscal year (or null)
// data.paymentOrders.draft / sent_to_finance / paid / cancelled — counts by status
```

### Manager/Admin global view (no scope)

```typescript
const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: adminRole.roleId,
        type: "unitHead",
        // no unitId, no orgId — global scope
      },
      get: {
        purchasingRequestCounts: 1,
        pendingApprovalCount: 1,
        recentApprovals: 1,
        finance: 1,
        receiptCount: 1,
      },
    },
  }),
});
```

---

## Replaces Previous Inefficient Pattern

Before this action, the frontend made 5 separate API calls to get dashboard data:

```typescript
// ❌ OLD: 5 separate calls (all failing because gets doesn't accept these filters)
purchasingRequest.gets({ unitId, status: "Draft" }, { limit: 1 })
stepApproval.gets({ unitId, status: "pending" }, { limit: 1 })
purchasingRequest.gets({ unitId }, { limit: 1 })
purchasingRequest.gets({ unitId: warehouseUnitId, stuffStatus: "delivered" }, { limit: 1 })
stepApproval.gets({ unitId }, { limit: 5 })
```

Now replaced by a single call:

```typescript
// ✅ NEW: Single call with get projection
user.dashboardStatistic({
  activeRoleId: unitHeadRole.roleId,
  type: "unitHead",
}, {
  unit: 1,
  purchasingRequestCounts: 1,
  pendingApprovalCount: 1,
  recentApprovals: 1,
  receiptCount: 1,
})
```
