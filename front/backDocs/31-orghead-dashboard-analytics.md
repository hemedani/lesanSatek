# OrgHead Dashboard Analytics — Backend API Reference

> Last updated: 2026-07-30
> Backend scope: `user.dashboardStatistic` extended with `type: "orgHead"` + 14 new analytics facets

## Table of Contents

1. [Overview](#1-overview)
2. [Request Format](#2-request-format)
3. [Authorization](#3-authorization)
4. [Get Projection Fields](#4-get-projection-fields)
5. [Response Shape](#5-response-shape)
6. [Facet Details & Response Examples](#6-facet-details--response-examples)
7. [Usage Scenarios](#7-usage-scenarios)
8. [Performance Notes](#8-performance-notes)

---

## 1. Overview

The `user.dashboardStatistic` action has been extended with a new `type: "orgHead"` and **14 new analytics facets** that give the OrgHead a comprehensive, chart-ready view of their entire organization.

**What changed:**

| Aspect | Before | After |
|--------|--------|-------|
| `type` enum | `["unitHead"]` | `["unitHead", "orgHead"]` |
| `get` projection fields | 8 fields | **22 fields** (8 original + 14 new) |
| Models queried | PR, StepApproval, BudgetLine, PaymentOrder, FiscalYear | + Inventory, Consumption, StockMovement |
| OrgHead auto-scoping | Only via `orgId` param (manual) | **Auto-forced** from OrgHead role's `scopeId` |

**The 14 new facets:**

| # | Facet | Purpose | Chart Type |
|---|-------|---------|------------|
| 1 | `prStatusDistribution` | Full PR count by ALL 8 statuses | Donut/pie chart |
| 2 | `prMonthlyTrend` | PR creation volume over last 12 months | Bar/line chart |
| 3 | `prCycleTime` | Average approval cycle time | KPI metric |
| 4 | `budgetLineBreakdown` | Per-budget-line financial status | Table / horizontal bar |
| 5 | `budgetBurnDown` | Org-wide budget summary | KPI metrics |
| 6 | `inventorySummary` | Total stock + breakdown by wareType | Stacked bar chart |
| 7 | `inventoryLowStock` | Items below reorder threshold | Alert list |
| 8 | `consumptionTrend` | Monthly consumption over 12 months | Area chart |
| 9 | `consumptionByUnit` | Top 5 consuming units | Horizontal bar |
| 10 | `consumptionByCategory` | Consumption by wareType | Pie chart |
| 11 | `procurementByStore` | Total PR spending per store | Bar chart |
| 12 | `selectionBreakdown` | Stuff vs Tender selection ratio | Pie chart |
| 13 | `stockMovementSummary` | Total in/out by reason | Waterfall/combo |
| 14 | `stepBottleneck` | Avg approval hours per step type | Bar chart |

---

## 2. Request Format

### 2.1 Minimal OrgHead Request (all analytics)

```json
{
  "service": "main",
  "model": "user",
  "act": "dashboardStatistic",
  "details": {
    "set": {
      "activeRoleId": "<orgHeadRoleId>",
      "type": "orgHead"
    },
    "get": {
      "prStatusDistribution": 1,
      "prMonthlyTrend": 1,
      "prCycleTime": 1,
      "budgetLineBreakdown": 1,
      "budgetBurnDown": 1,
      "inventorySummary": 1,
      "inventoryLowStock": 1,
      "consumptionTrend": 1,
      "consumptionByUnit": 1,
      "consumptionByCategory": 1,
      "procurementByStore": 1,
      "selectionBreakdown": 1,
      "stockMovementSummary": 1,
      "stepBottleneck": 1
    }
  }
}
```

### 2.2 Minimal OrgHead Request (just KPI metrics)

```json
{
  "service": "main",
  "model": "user",
  "act": "dashboardStatistic",
  "details": {
    "set": {
      "activeRoleId": "<orgHeadRoleId>",
      "type": "orgHead"
    },
    "get": {
      "purchasingRequestCounts": 1,
      "prCycleTime": 1,
      "budgetBurnDown": 1,
      "inventoryLowStock": 1,
      "fiscalYear": 1
    }
  }
}
```

### 2.3 Manager/Admin viewing a specific org's analytics

```json
{
  "service": "main",
  "model": "user",
  "act": "dashboardStatistic",
  "details": {
    "set": {
      "activeRoleId": "<managerRoleId>",
      "type": "orgHead",
      "orgId": "<targetOrgId>"
    },
    "get": {
      "prStatusDistribution": 1,
      "budgetBurnDown": 1,
      "inventorySummary": 1,
      "consumptionTrend": 1
    }
  }
}
```

### 2.4 `set` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `activeRoleId` | string (UUID) | **yes** | The user's active role UUID from their `roles` array |
| `type` | `"unitHead"` \| `"orgHead"` | **yes** | `"orgHead"` for org-wide analytics |
| `orgId` | string (ObjectId) | no | **For Manager/Admin only** — explicit org scope when not using OrgHead role. Ignored when type is `"orgHead"` and the active role IS OrgHead (scope is forced from role). |

---

## 3. Authorization

| Role | `type: "orgHead"` behavior |
|------|---------------------------|
| **OrgHead** | Organization scope is **auto-forced** from `activeRole.scopeId`. Must have `scopeType: "organization"` and valid `scopeId`. |
| **Manager, Admin** | Can optionally pass `orgId` to scope analytics to a specific org. If neither `orgId` nor role scope is present, analytics are **global** (across all orgs). |
| **Others** | Denied by `grantAccess` (only Manager, Admin, OrgHead, UnitHead). |

**Error messages:**
- `"OrgHead role must have an organization scope"` — when `type: "orgHead"` is used without an org scope and no explicit `orgId` is passed

---

## 4. Get Projection Fields

### 4.1 Original Fields (still available)

| Field | Type | Description |
|-------|------|-------------|
| `unit` | `0` or `1` | Unit info `{ _id, name, type }` |
| `purchasingRequestCounts` | `0` or `1` | PR counts: `{ draft, pending, approved, rejected, total }` |
| `pendingApprovalCount` | `0` or `1` | Number of pending step approvals |
| `recentApprovals` | `0` or `1` | Last 5 pending step approvals |
| `finance` | `0` or `1` | Budget summary: `{ budgetLineCount, totalAllocated, totalSpent, totalRemaining, pendingPaymentCount }` |
| `receiptCount` | `0` or `1` | PRs with `stuffStatus: "delivered"` |
| `fiscalYear` | `0` or `1` | `{ count, active: { name, startDate, endDate, status } }` |
| `paymentOrders` | `0` or `1` | Payment order counts by status |

### 4.2 New OrgHead Analytics Fields

| Field | Type | Description |
|-------|------|-------------|
| `prStatusDistribution` | `0` or `1` | PR counts by ALL 8 statuses (incl. InProgress, PendingFinalization) |
| `prMonthlyTrend` | `0` or `1` | Monthly PR creation volume (last 12 months) |
| `prCycleTime` | `0` or `1` | Average/min/max approval cycle days |
| `budgetLineBreakdown` | `0` or `1` | Per-budget-line financial status array |
| `budgetBurnDown` | `0` or `1` | Org-wide budget totals |
| `inventorySummary` | `0` or `1` | Stock totals + breakdown by wareType |
| `inventoryLowStock` | `0` or `1` | Low-stock alerts (items below minQuantity) |
| `consumptionTrend` | `0` or `1` | Monthly consumption (last 12 months) |
| `consumptionByUnit` | `0` or `1` | Top 5 consuming units |
| `consumptionByCategory` | `0` or `1` | Consumption grouped by wareType |
| `procurementByStore` | `0` or `1` | PR spending totals per store |
| `selectionBreakdown` | `0` or `1` | Stuff vs Tender selection counts |
| `stockMovementSummary` | `0` or `1` | Total stock in/out by reason |
| `stepBottleneck` | `0` or `1` | Average approval time per step |

---

## 5. Response Shape

### Full Response (all 14 + 8 original fields)

```typescript
type OrgHeadDashboardResponse = {
  // ── Original fields ──
  unit?: { _id: string; name: string; type: string };
  purchasingRequestCounts?: {
    draft: number; pending: number; approved: number;
    rejected: number; total: number;
  };
  pendingApprovalCount?: number;
  recentApprovals?: Array<{ _id: string; status: string; createdAt: string }>;
  finance?: {
    budgetLineCount: number; totalAllocated: number;
    totalSpent: number; totalRemaining: number;
    pendingPaymentCount: number;
  };
  receiptCount?: number;
  fiscalYear?: {
    count: number;
    active: {
      _id: string; name: string; startDate: string;
      endDate: string; isActive: boolean; status: "open" | "closed";
    } | null;
  };
  paymentOrders?: {
    draft: number; sent_to_finance: number;
    paid: number; cancelled: number;
  };

  // ── NEW analytics fields ──
  prStatusDistribution?: {
    draft: number; pending: number; inProgress: number;
    approved: number; pendingFinalization: number;
    rejected: number; completed: number; cancelled: number;
  };

  prMonthlyTrend?: Array<{
    year: number; month: number;
    count: number; totalEstimatedAmount: number;
  }>;

  prCycleTime?: {
    averageDays: number; minDays: number;
    maxDays: number; totalCompleted: number;
  };

  budgetLineBreakdown?: Array<{
    _id: string; code: string; title: string;
    totalAllocated: number; totalEncumbered: number;
    totalSpent: number; remainingBudget: number;
  }>;

  budgetBurnDown?: {
    totalAllocated: number; totalEncumbered: number;
    totalSpent: number; totalRemaining: number;
  };

  inventorySummary?: {
    totalItems: number; totalQuantity: number;
    byWareType: Array<{
      _id: string; name: string; enName?: string;
      count: number; totalQuantity: number;
    }>;
  };

  inventoryLowStock?: {
    count: number;
    items: Array<{
      _id: string; quantity: number; minQuantity: number;
      ware: { _id: string; name: string };
      unit: { _id: string; name: string };
      wareModel: { _id: string; name: string };
    }>;
  };

  consumptionTrend?: Array<{
    year: number; month: number;
    totalQuantity: number; count: number;
  }>;

  consumptionByUnit?: Array<{
    _id: string; unitName: string;
    totalQuantity: number; count: number;
  }>;

  consumptionByCategory?: Array<{
    _id: string; name: string; enName?: string;
    totalQuantity: number; count: number;
  }>;

  procurementByStore?: Array<{
    _id: string; storeName: string;
    totalPRs: number; totalEstimatedAmount: number;
  }>;

  selectionBreakdown?: {
    stuff: number; tender: number; none: number;
  };

  stockMovementSummary?: {
    totalIn: number; totalOut: number;
    byReason: Array<{
      _id: string;          // reason enum value
      totalQuantity: number;
      count: number;
    }>;
  };

  stepBottleneck?: Array<{
    stepName: string; stepType: string;
    avgHours: number; minHours: number;
    maxHours: number; count: number;
  }>;
};
```

---

## 6. Facet Details & Response Examples

### 6.1 `prStatusDistribution` — Full PR Status Breakdown

**Backend query:** Single `$group` on all 8 status values, scoped by `organization._id`.

**Response example:**
```json
{
  "prStatusDistribution": {
    "draft": 12,
    "pending": 5,
    "inProgress": 8,
    "approved": 3,
    "pendingFinalization": 2,
    "rejected": 4,
    "completed": 45,
    "cancelled": 1
  }
}
```

**Use case:** Donut/pie chart showing the full PR lifecycle distribution. The `pendingFinalization` count is the OrgHead's action queue.

**Difference from `purchasingRequestCounts`:** The original field only has `{ draft, pending, approved, rejected, total }`. The new field adds `inProgress`, `pendingFinalization`, `completed`, `cancelled` — all 8 statuses.

---

### 6.2 `prMonthlyTrend` — PR Creation Over Time

**Backend query:** Groups PRs by `{ year, month }` for the last 12 months, scoped by org. Sums both count and `estimatedAmount`.

**Response example:**
```json
{
  "prMonthlyTrend": [
    { "year": 2025, "month": 8, "count": 5, "totalEstimatedAmount": 125000000 },
    { "year": 2025, "month": 9, "count": 3, "totalEstimatedAmount": 45000000 },
    { "year": 2025, "month": 10, "count": 7, "totalEstimatedAmount": 210000000 },
    { "year": 2026, "month": 7, "count": 9, "totalEstimatedAmount": 380000000 }
  ]
}
```

**Use case:** Bar/line chart showing PR volume and estimated budget over time.

**Notes:**
- Does NOT filter by status — all PRs (including Draft) are counted
- Months with zero PRs are NOT included (the array may have gaps)
- Frontend should fill gaps with `{ count: 0, totalEstimatedAmount: 0 }` for months with no data
- The 12-month window is `createdAt >= today - 12 months`

---

### 6.3 `prCycleTime` — Approval Cycle Time

**Backend query:** Filters completed PRs that have both `requestedAt` and `completedAt`. Computes `cycleDays = (completedAt - requestedAt) / 86400000`. Groups to get avg/min/max.

**Response example:**
```json
{
  "prCycleTime": {
    "averageDays": 14.53,
    "minDays": 2.0,
    "maxDays": 45.0,
    "totalCompleted": 45
  }
}
```

**Use case:** KPI metric cards showing process efficiency.

**Notes:**
- Only PRs with `status: "Completed"` that have both timestamps are included
- Values rounded to 2 decimal places
- If no completed PRs exist, returns `{ averageDays: 0, minDays: 0, maxDays: 0, totalCompleted: 0 }`

---

### 6.4 `budgetLineBreakdown` — Per-Budget-Line Detail

**Backend query:** Fetches all budget lines for the org, sorted by `totalAllocated` descending.

**Response example:**
```json
{
  "budgetLineBreakdown": [
    {
      "_id": "665a...",
      "code": "BL-1403-001",
      "title": "خرید تجهیزات آزمایشگاهی",
      "totalAllocated": 500000000,
      "totalEncumbered": 150000000,
      "totalSpent": 80000000,
      "remainingBudget": 350000000
    },
    {
      "_id": "665b...",
      "code": "BL-1403-002",
      "title": "ملزومات اداری",
      "totalAllocated": 200000000,
      "totalEncumbered": 50000000,
      "totalSpent": 30000000,
      "remainingBudget": 150000000
    }
  ]
}
```

**Use case:** Table with horizontal bar charts showing budget utilization per line.

**Notes:**
- `remainingBudget = totalAllocated - totalEncumbered - totalSpent` (computed by the system)
- Use `remainingBudget / totalAllocated * 100` for utilization percentage
- Empty array `[]` if no budget lines exist

---

### 6.5 `budgetBurnDown` — Org-Wide Budget Summary

**Backend query:** Sums all budget lines for the org.

**Response example:**
```json
{
  "budgetBurnDown": {
    "totalAllocated": 1200000000,
    "totalEncumbered": 350000000,
    "totalSpent": 180000000,
    "totalRemaining": 850000000
  }
}
```

**Use case:** KPI row showing the big-picture budget health.

**Notes:**
- This is a snapshot — it does NOT track burn-down over time
- For a full budget burn-down chart over months, the frontend should:
  1. Fetch all `budgetAllocation` records for the org's budget lines (via `budgetAllocation.gets`)
  2. Fetch all `budgetEncumbrance` records with `convertToSpend` timestamps
  3. Compute monthly aggregates client-side

---

### 6.6 `inventorySummary` — Stock Overview by WareType

**Backend query:** Two `$facet` sub-pipelines: one `$group` for totals, one `$group` by `wareType._id`.

**Response example:**
```json
{
  "inventorySummary": {
    "totalItems": 156,
    "totalQuantity": 28450,
    "byWareType": [
      { "_id": "wt_lab", "name": "تجهیزات آزمایشگاهی", "enName": "Lab Equipment", "count": 45, "totalQuantity": 12000 },
      { "_id": "wt_office", "name": "ملزومات اداری", "enName": "Office Supplies", "count": 32, "totalQuantity": 8500 },
      { "_id": "wt_chem", "name": "مواد شیمیایی", "enName": "Chemicals", "count": 28, "totalQuantity": 4300 }
    ]
  }
}
```

**Use case:** Stacked bar chart or treemap showing what categories the organization's stock is in.

**Notes:**
- `totalItems` = number of unique inventory records (each is one unit+ware combo)
- `totalQuantity` = sum of all quantities across all records
- `byWareType` sorted by `totalQuantity` descending
- Only inventory records with a valid `wareType` relation are included in `byWareType`
- Records without `wareType` are still counted in `totalItems`/`totalQuantity`

---

### 6.7 `inventoryLowStock` — Low Stock Alerts

**Backend query:** Filters inventory where both conditions are met:
1. `minQuantity` exists and is not null
2. `quantity < minQuantity` (via `$expr`)

Returns count + top 20 items sorted by quantity ascending.

**Response example:**
```json
{
  "inventoryLowStock": {
    "count": 7,
    "items": [
      {
        "_id": "inv_001",
        "quantity": 2,
        "minQuantity": 10,
        "ware": { "_id": "w_001", "name": "کیت TSH پیشرفته ZistShimi" },
        "unit": { "_id": "u_lab", "name": "آزمایشگاه هماتولوژی" },
        "wareModel": { "_id": "wm_001", "name": "کیت TSH پیشرفته" }
      }
    ]
  }
}
```

**Use case:** Alert list/banner on the dashboard showing items that need reordering.

**Notes:**
- Items appear in order of severity (lowest quantity first, capped at 20)
- Only items with `minQuantity` set are checked — items without a threshold are ignored
- `count` is the TOTAL count of low-stock items (not limited to 20)
- The `items` array is limited to 20 to keep response size manageable

---

### 6.8 `consumptionTrend` — Monthly Consumption Volume

**Backend query:** Groups consumption records by `{ year, month }` for the last 12 months, scoped by org.

**Response example:**
```json
{
  "consumptionTrend": [
    { "year": 2025, "month": 9, "totalQuantity": 45, "count": 3 },
    { "year": 2025, "month": 10, "totalQuantity": 120, "count": 8 },
    { "year": 2026, "month": 7, "totalQuantity": 200, "count": 12 }
  ]
}
```

**Use case:** Area chart showing consumption trends. Can be paired with `prMonthlyTrend` on the same chart to show procurement vs consumption correlation.

**Notes:**
- 12-month window uses `consumedAt` (not `createdAt`)
- Months with zero consumption are omitted
- All units within the org are aggregated

---

### 6.9 `consumptionByUnit` — Top 5 Consuming Units

**Backend query:** Groups by `unit._id`, sums quantity, sorts descending, limits to 5.

**Response example:**
```json
{
  "consumptionByUnit": [
    { "_id": "u_lab", "unitName": "آزمایشگاه مرکزی", "totalQuantity": 850, "count": 45 },
    { "_id": "u_warehouse", "unitName": "انبار مرکزی", "totalQuantity": 320, "count": 18 },
    { "_id": "u_rad", "unitName": "رادیولوژی", "totalQuantity": 150, "count": 7 }
  ]
}
```

**Use case:** Horizontal bar chart identifying the org's heaviest consumers.

---

### 6.10 `consumptionByCategory` — Consumption by WareType

**Backend query:** Groups consumption by `wareType._id`, sums quantity.

**Response example:**
```json
{
  "consumptionByCategory": [
    { "_id": "wt_lab", "name": "تجهیزات آزمایشگاهی", "enName": "Lab Equipment", "totalQuantity": 980, "count": 52 },
    { "_id": "wt_chem", "name": "مواد شیمیایی", "enName": "Chemicals", "totalQuantity": 450, "count": 23 }
  ]
}
```

**Use case:** Pie/donut chart showing what categories are being consumed most.

---

### 6.11 `procurementByStore` — Store Procurement Totals

**Backend query:** Groups completed/approved PRs by `store._id`, sums `estimatedAmount`.

**Response example:**
```json
{
  "procurementByStore": [
    { "_id": "s_001", "storeName": "تجهیزات پزشکی زیشیمی", "totalPRs": 12, "totalEstimatedAmount": 850000000 },
    { "_id": "s_002", "storeName": "فروشگاه لوازم اداری پارس", "totalPRs": 8, "totalEstimatedAmount": 320000000 }
  ]
}
```

**Use case:** Bar chart showing which stores receive the most business.

**Notes:**
- Only PRs with `status: "Completed"` or `"Approved"` AND a linked `store` are included
- `estimatedAmount` is used (not actual paid amount)

---

### 6.12 `selectionBreakdown` — Stuff vs Tender Ratio

**Backend query:** Groups PRs by `selectionType` value.

**Response example:**
```json
{
  "selectionBreakdown": {
    "stuff": 23,
    "tender": 12,
    "none": 5
  }
}
```

**Use case:** Pie chart showing the organization's preference for direct purchase vs tender.

---

### 6.13 `stockMovementSummary` — Stock In/Out by Reason

**Backend query:** Groups stock movements by `reason`, sums `quantity`.

**Response example:**
```json
{
  "stockMovementSummary": {
    "totalIn": 5000,
    "totalOut": 2300,
    "byReason": [
      { "_id": "goods_receipt", "totalQuantity": 5000, "count": 15 },
      { "_id": "consumption", "totalQuantity": -1800, "count": 45 },
      { "_id": "adjustment", "totalQuantity": -500, "count": 3 }
    ]
  }
}
```

**Use case:** Waterfall chart or KPI showing net stock position.

**Notes:**
- `totalIn` = sum of all positive `totalQuantity` values across reasons
- `totalOut` = sum of absolute values of negative `totalQuantity` values
- `byReason` includes the raw signed quantities (positive for inbound, negative for outbound)
- Reason enum values: `goods_receipt`, `goods_issue`, `transfer_in`, `transfer_out`, `consumption`, `adjustment`, `return`, `write_off`

---

### 6.14 `stepBottleneck` — Approval Time by Step

**Backend query:** Filters step approvals with a `decidedAt` timestamp. Computes `hours = (decidedAt - createdAt) / 3600000`. Groups by step name + type.

**Response example:**
```json
{
  "stepBottleneck": [
    { "stepName": "تأیید مالی", "stepType": "Approval", "avgHours": 72.5, "minHours": 2.0, "maxHours": 240.0, "count": 15 },
    { "stepName": "بررسی انبار", "stepType": "Review", "avgHours": 48.0, "minHours": 1.0, "maxHours": 168.0, "count": 22 },
    { "stepName": "تأیید واحد", "stepType": "Approval", "avgHours": 24.0, "minHours": 0.5, "maxHours": 96.0, "count": 30 }
  ]
}
```

**Use case:** Bar chart identifying which steps take the longest (bottlenecks).

**Notes:**
- Sorted by `avgHours` descending (worst bottleneck first)
- Hours are rounded to 1 decimal place
- Only includes approvals that have been decided (`decidedAt` exists)
- Step name and type come from the embedded `processStep` relation on StepApproval

---

## 7. Usage Scenarios

### 7.1 Full OrgHead Dashboard (13-section page)

```typescript
const orgHeadRole = user.roles.find(r => r.name === "OrgHead");

const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    service: "main",
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: orgHeadRole.roleId,
        type: "orgHead",
      },
      get: {
        // KPI row
        purchasingRequestCounts: 1,
        prCycleTime: 1,
        budgetBurnDown: 1,
        inventoryLowStock: 1,
        fiscalYear: 1,

        // Charts
        prStatusDistribution: 1,
        prMonthlyTrend: 1,
        budgetLineBreakdown: 1,
        inventorySummary: 1,
        consumptionTrend: 1,
        consumptionByUnit: 1,
        consumptionByCategory: 1,
        procurementByStore: 1,
        selectionBreakdown: 1,
        stockMovementSummary: 1,
        stepBottleneck: 1,
      },
    },
  }),
});
```

### 7.2 Lightweight Dashboard (just KPI metrics)

For a quick overview without charts:

```typescript
const response = await fetch("/api", {
  method: "POST",
  body: JSON.stringify({
    service: "main",
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: {
        activeRoleId: orgHeadRole.roleId,
        type: "orgHead",
      },
      get: {
        purchasingRequestCounts: 1,
        prCycleTime: 1,
        budgetBurnDown: 1,
        inventoryLowStock: 1,
        fiscalYear: 1,
      },
    },
  }),
});
```

### 7.3 Progressive Loading Strategy

Since `dashboardStatistic` can return up to 22 fields, consider a progressive loading pattern on the frontend:

1. **First call (critical KPI):** `purchasingRequestCounts`, `prCycleTime`, `budgetBurnDown`, `inventoryLowStock`, `fiscalYear` — shows immediately
2. **Second call (charts):** `prStatusDistribution`, `prMonthlyTrend`, `selectionBreakdown`, `stockMovementSummary` — medium priority
3. **Third call (detail):** `budgetLineBreakdown`, `inventorySummary`, `consumptionTrend`, `procurementByStore`, `stepBottleneck` — low priority, scroll-triggered

Alternatively, make a single call with all fields — the backend runs all queries in parallel via `Promise.all` so the response time is limited by the slowest single query (typically the inventory or consumption aggregation).

---

## 8. Performance Notes

### 8.1 Parallel Execution

All 14 new facets run **in parallel** via `Promise.all` — independent of each other and independent of the 8 original facets. Total response time = `max(slowest_query)`, not `sum(all_queries)`.

Typical slowest queries:
- `inventorySummary` (depends on inventory count — fast for <10k records)
- `consumptionTrend` (depends on consumption count — fast for <10k records)
- `stepBottleneck` (depends on step approval count — fast for <5k records)

### 8.2 No `$lookup` Joins

All 14 facets use **direct field queries** on the source collection:
- PR-based facets: direct `organization._id` filter
- Budget facets: direct `organization._id` filter
- Inventory/Consumption/StockMovement facets: `unit.organization._id` filter (embedded)

No `$lookup` cross-collection joins are used, keeping queries efficient.

### 8.3 No Text Index Queries

No `$text` search or regex operations are used — all queries use exact `$match` on indexed fields (`_id`, `organization._id`, `unit._id`, `status`).

### 8.4 Response Size

Maximum estimated response size with all 22 fields:
- PR distribution: ~200 bytes
- Monthly trend: ~500 bytes (12 months)
- Cycle time: ~100 bytes
- Budget breakdown: ~500 bytes (per 5 budget lines)
- Inventory summary: ~1KB (per 10 wareTypes)
- Low stock items: ~2KB (20 items × 100 bytes)
- Consumption trend: ~500 bytes
- Consumption by unit: ~300 bytes (5 units)
- Procurement by store: ~500 bytes (per 5 stores)
- Stock movement: ~300 bytes
- Step bottleneck: ~500 bytes

**Total estimate: ~6-8KB** — well within typical API response limits.

### 8.5 Caching Strategy

Since this is a **snapshot** endpoint, consider:
- **No caching** if real-time data is critical
- **30-60 second cache** for the dashboard page (set `Cache-Control: private, max-age=30`)
- Client-side refresh button to invalidate cache
- Poll every 60 seconds for active dashboards

---

## 9. Quick Reference: All 22 Get Fields

| # | Field | Original/New | Category | DB Collections Queried |
|---|-------|-------------|----------|------------------------|
| 1 | `unit` | Original | Identity | unit |
| 2 | `purchasingRequestCounts` | Original | PR | purchasingRequest |
| 3 | `pendingApprovalCount` | Original | Approvals | stepApproval |
| 4 | `recentApprovals` | Original | Approvals | stepApproval |
| 5 | `finance` | Original | Budget | budgetLine, paymentOrder |
| 6 | `receiptCount` | Original | PR | purchasingRequest |
| 7 | `fiscalYear` | Original | Budget | fiscalYear |
| 8 | `paymentOrders` | Original | Budget | paymentOrder |
| 9 | `prStatusDistribution` | **NEW** | PR | purchasingRequest |
| 10 | `prMonthlyTrend` | **NEW** | PR | purchasingRequest |
| 11 | `prCycleTime` | **NEW** | PR | purchasingRequest |
| 12 | `budgetLineBreakdown` | **NEW** | Budget | budgetLine |
| 13 | `budgetBurnDown` | **NEW** | Budget | budgetLine |
| 14 | `inventorySummary` | **NEW** | Inventory | inventory |
| 15 | `inventoryLowStock` | **NEW** | Inventory | inventory |
| 16 | `consumptionTrend` | **NEW** | Inventory | consumption |
| 17 | `consumptionByUnit` | **NEW** | Inventory | consumption |
| 18 | `consumptionByCategory` | **NEW** | Inventory | consumption |
| 19 | `procurementByStore` | **NEW** | Procurement | purchasingRequest |
| 20 | `selectionBreakdown` | **NEW** | Procurement | purchasingRequest |
| 21 | `stockMovementSummary` | **NEW** | Inventory | stockMovement |
| 22 | `stepBottleneck` | **NEW** | Approvals | stepApproval |
