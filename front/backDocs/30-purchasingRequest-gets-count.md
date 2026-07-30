# `purchasingRequest.gets` & `purchasingRequest.count` — API Reference for Frontend

> Last updated: 2026-07-30
> Covers all filter fields, role scoping, sort, pagination, and response format.

## Table of Contents

1. [Overview](#1-overview)
2. [Model Fields (for `get` projection)](#2-model-fields-for-get-projection)
3. [`gets` Method](#3-gets-method)
   - [Request Format](#31-request-format)
   - [Filter Fields](#32-filter-fields)
   - [Sort Fields](#33-sort-fields)
   - [Pagination](#34-pagination)
   - [Role-Based Scoping](#35-role-based-scoping)
   - [Pipeline Execution Order](#36-pipeline-execution-order)
   - [Common Usage Patterns](#37-common-usage-patterns)
4. [`count` Method](#4-count-method)
   - [Request Format](#41-request-format)
   - [Filter Fields](#42-filter-fields)
   - [Role-Based Scoping](#43-role-based-scoping)
   - [Date Range Filter](#44-date-range-filter)
5. [Frontend Action Helpers](#5-frontend-action-helpers)

---

## 1. Overview

`purchasingRequest` is the core procurement document. Each PR represents a request to purchase a specific `wareModel` in a given `quantity`. It flows through a configurable process workflow (Process → ProcessSteps → StepApprovals) and has an end-to-end lifecycle:

```
Draft → submit() → Pending → (step approvals) → InProgress → Approved
    → (tender/award or direct store assignment) → goodsReceipt → Completed
```

Rejection at any step sets status to `Rejected`. Cancellation sets status to `Cancelled`.

The `gets` method returns a paginated, filterable, sortable list of PRs. The `count` method returns the total count matching the same filters (for pagination display).

---

## 2. Model Fields (for `get` projection)

### Pure Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `title` | string | PR title / description of requested item |
| `description` | string (optional) | Detailed description |
| `estimatedAmount` | number (optional) | Estimated total cost |
| `quantity` | number | Requested quantity |
| `status` | enum | Current status (see below) |
| `currentStep` | number | Current process step index (0-based) |
| `stuffStatus` | string | Inventory status: `none` / `assigned` / `ready_to_ship` / `shipped` / `delivered` / `received` / `cancelled` |
| `selectionType` | string | `none` / `store` / `tender` |
| `selectedTenderOfferId` | string (optional) | If tender was used, the winning offer ID |
| `postCompletionSteps` | array | Post-completion approval steps (see AGENTS.md for detail) |
| `requestedAt` | ISO date (optional) | When the PR was submitted |
| `completedAt` | ISO date (optional) | When the PR was completed |
| `finalizedAt` | ISO date (optional) | When the PR was finalized by OrgHead |
| `history` | array | Timeline of actions (see structure below) |
| `createdAt` | ISO date | Creation timestamp |
| `updatedAt` | ISO date | Last update timestamp |

**`status` enum values:**

| Status | Meaning |
|--------|---------|
| `Draft` | Initial state, not yet submitted |
| `Pending` | Submitted, awaiting first step approval |
| `InProgress` | At least one step approved, workflow ongoing |
| `Approved` | All steps approved, ready for procurement action |
| `PendingFinalization` | Goods received, awaiting OrgHead finalization |
| `Rejected` | Rejected at some step |
| `Completed` | Fully completed and finalized |
| `Cancelled` | Cancelled |

**`history` entry structure:**

```json
{
  "action": "created | submitted | step_approved | step_rejected | all_steps_approved | finalized | item_assigned | goods_received | payment_ordered | goods_consumed",
  "performed": {
    "by": "user._id",
    "name": "First Last",
    "at": "ISO date",
    "role": { "id": "roleId", "name": "Manager | ...", "scopeType": "organization | unit", "scopeId": "..." }
  },
  "unit": { "_id": "...", "name": "..." },
  "details": {}
}
```

### Relations (Single-type — embedded in document)

| Field | Target Model | Optional | Reverse on Target |
|-------|-------------|----------|-------------------|
| `process` | Process | yes | `process.requests` |
| `requester` | User | no | `user.requests` |
| `requestingUnit` | Unit | yes | `unit.purchaseRequests` |
| `organization` | Organization | yes | `organization.purchaseRequests` |
| `budgetLine` | BudgetLine | yes | `budgetLine.purchasingRequests` |
| `wareModel` | WareModel | no | `wareModel.purchasingRequests` |
| `ware` | Ware | yes | `ware.purchasingRequests` |
| `wareType` | WareType | yes | `wareType.purchasingRequests` |
| `wareClass` | WareClass | yes | `wareClass.purchasingRequests` |
| `wareGroup` | WareGroup | yes | `wareGroup.purchasingRequests` |
| `store` | Store | yes | `store.purchasingRequests` |
| `stuff` | Stuff | yes | `stuff.purchasingRequests` |

### Relations (Multiple-type — separate collection, accessed via Lesan reverse)

| Field | Target Model | Description |
|-------|-------------|-------------|
| `stepApprovals` | StepApproval | Approval decisions per step+unit |
| `purchaseOrderItems` | PurchaseOrderItem | PO line items |
| `goodsReceipts` | GoodsReceipt | Goods receipt documents |
| `paymentOrders` | PaymentOrder | Payment order documents |
| `tender` | Tender | Tender / RFP document |
| `attachments` | File | Uploaded files |

**Important:** Multiple-type relations (`paymentOrders`, `goodsReceipts`, `purchaseOrderItems`, `stepApprovals`, `attachments`) are stored in their own collections. They are NOT embedded in the PR document. To access them, include them in the `get` projection (Lesan fetches them via lookup internally). For filtering by these related fields (e.g. `paymentOrders.status`), the `gets` method provides explicit filter parameters (see below).

---

## 3. `gets` Method

**Action:** `gets` on model `purchasingRequest`

**Endpoint:** `POST {BACKEND_URL}/lesan`

### 3.1 Request Format

```json
{
  "service": "main",
  "model": "purchasingRequest",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "page": 1,
      "limit": 20,
      "search": "...",
      "status": "Pending",
      "processId": "objectId",
      "requesterId": "objectId",
      "unitId": "objectId",
      "storeId": "objectId",
      "wareId": "objectId",
      "wareTypeId": "objectId",
      "wareClassId": "objectId",
      "wareGroupId": "objectId",
      "stuffStatus": "...",
      "paymentOrderStatus": "...",
      "filterByAction": "...",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    },
    "get": {
      "_id": 1,
      "title": 1,
      "status": 1,
      "quantity": 1,
      "wareModel": { "_id": 1, "name": 1 },
      "requester": { "_id": 1, "first_name": 1, "last_name": 1 },
      "requestingUnit": { "_id": 1, "name": 1 },
      "process": { "_id": 1, "name": 1 },
      "paymentOrders": { "_id": 1, "status": 1, "amount": 1 }
    }
  }
}
```

### 3.2 Filter Fields

All filter fields are **optional** and **additive** — combining multiple filters narrows results (AND logic).

#### A. Core Text & Status Filters

| Field | Type | MongoDB Match | Description |
|-------|------|---------------|-------------|
| `search` | string | `$text` search on `title` and `description` (text index) | Free-form full-text search (Persian and English) |
| `status` | enum | `status == value` | Filter by PR lifecycle status |
| `filterByAction` | enum | `history.action == value` | Find PRs that have a specific action in their history |

**`status` accepted values:** `Draft`, `Pending`, `InProgress`, `Approved`, `PendingFinalization`, `Rejected`, `Completed`, `Cancelled`

**`filterByAction` accepted values:** `created`, `submitted`, `step_approved`, `step_rejected`, `all_steps_approved`, `finalized`, `goods_received`, `payment_ordered`, `goods_consumed`

#### B. Relation ID Filters (ObjectId)

| Field | MongoDB Match | Use Case |
|-------|---------------|----------|
| `processId` | `process._id == value` | PRs in a specific process |
| `requesterId` | `requester._id == value` | PRs created by a specific user |
| `unitId` | `requestingUnit._id == value` | PRs from a specific unit |
| `storeId` | `store._id == value` | PRs with a specific assigned store |
| `wareId` | `ware._id == value` | PRs for a specific ware (product variant) |
| `wareTypeId` | `wareType._id == value` | PRs for a top-level category |
| `wareClassId` | `wareClass._id == value` | PRs for a second-level category |
| `wareGroupId` | `wareGroup._id == value` | PRs for a third-level category |

All hierarchy filters use **denormalized embedded docs** (`wareType._id`, `wareClass._id`, etc.) — they filter on the denormalized fields stored directly in the PR document at submission time.

#### C. Inventory / Stuff Status

| Field | Type | MongoDB Match | Description |
|-------|------|---------------|-------------|
| `stuffStatus` | enum | `stuffStatus == value` | Filter by inventory fulfillment status |

**`stuffStatus` accepted values:** `none`, `assigned`, `ready_to_ship`, `shipped`, `delivered`, `received`, `cancelled`

#### D. Payment Order Status

| Field | Type | MongoDB Match | Description |
|-------|------|---------------|-------------|
| `paymentOrderStatus` | enum | via `$lookup` join | PRs filtered by their payment order status |

**Accepted values:**

| Value | MongoDB Match | Meaning |
|-------|---------------|---------|
| `"none"` | `paymentOrders` array has `$size: 0` | PRs with **no** payment orders at all |
| `"draft"` | `paymentOrders.status == "draft"` | PRs with at least one draft payment order |
| `"sent_to_finance"` | `paymentOrders.status == "sent_to_finance"` | PRs sent to finance for payment |
| `"paid"` | `paymentOrders.status == "paid"` | PRs with a paid payment order |
| `"cancelled"` | `paymentOrders.status == "cancelled"` | PRs with a cancelled payment order |

**Technical note:** Works via a `$lookup` aggregation stage that joins the `paymentOrder` collection on `paymentOrder.purchasingRequest._id == purchasingRequest._id`. For non-`"none"` values, a PR matches if ANY of its payment orders has the matching status. The `"none"` value specifically filters for PRs that have zero payment orders (the `$lookup` array is empty).

**Use cases:**

*Find PRs with payment orders sent to finance:*
```json
{ "paymentOrderStatus": "sent_to_finance" }
```

*Find PRs that have NOT yet been sent to finance (no payment orders at all):*
```json
{ "paymentOrderStatus": "none" }
```

#### E. Goods Receipt Status

| Field | Type | MongoDB Match | Description |
|-------|------|---------------|-------------|
| `goodsReceiptStatus` | enum | via `$lookup` join | PRs filtered by their goods receipt status |

**Accepted values:**

| Value | MongoDB Match | Meaning |
|-------|---------------|---------|
| `"none"` | `goodsReceipts` array has `$size: 0` | PRs with **no** goods receipts at all |
| `"pending"` | `goodsReceipts.status == "pending"` | PRs with at least one pending goods receipt |
| `"completed"` | `goodsReceipts.status == "completed"` | PRs with at least one completed goods receipt |
| `"partially_rejected"` | `goodsReceipts.status == "partially_rejected"` | PRs with a partially rejected goods receipt |

Same `$lookup` mechanism as `paymentOrderStatus`. Use `"none"` to find PRs that have never received goods (awaiting delivery).

**Use cases:**

*Find PRs that have had goods delivered successfully:*
```json
{ "goodsReceiptStatus": "completed" }
```

*Find PRs awaiting delivery (no goods receipts yet):*
```json
{ "goodsReceiptStatus": "none" }
```

### 3.3 Sort Fields

| `sortBy` value | Sorts by | Use Case |
|----------------|----------|----------|
| `"createdAt"` | Creation date (default) | Default listing |
| `"updatedAt"` | Last update date | Recently updated |
| `"title"` | Name | Alphabetical |
| `"status"` | Status | Group by lifecycle stage |
| `"amount"` | `estimatedAmount` | Budget-based sorting |
| `"currentStep"` | Current step index | Workflow progress |
| `"requestedAt"` | Submission date | When it was submitted |
| `"completedAt"` | Completion date | Recently completed |
| `"relevance"` | Text search score | Only effective when `search` is provided |

**`sortOrder`**: `"asc"` or `"desc"` (default: `"desc"`)

When `sortBy` is not specified, defaults to `"_id"` (reverse insertion order).

### 3.4 Pagination

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 50 | Items per page |
| `skip` | number | computed from `page`+`limit` | Raw skip count (overrides page if provided) |

The response `body` is always an **array** of PR documents. Metadata (total count) is NOT included — use `count` action with the same filters to get the total.

### 3.5 Role-Based Scoping

Each role has automatic scoping rules that are applied as `$match` stages BEFORE user-specified filters:

| Active Role | Auto-Scoping Filter | Description |
|-------------|--------------------|-------------|
| **Manager** | none | Sees all PRs |
| **Admin** | none | Sees all PRs |
| **OrgHead** | `organization._id == scopeId` | Sees PRs for their organization |
| **UnitHead** | `requestingUnit._id == scopeId` | Sees PRs from their specific unit |
| **Employee** | `requester._id == user._id` | Sees only their own PRs |
| **Ordinary** | `requester._id == user._id` | Sees only their own PRs |
| **StoreHead** | `store._id == scopeId` AND `finalizedAt` exists | Sees PRs assigned to their store that have been finalized |

**Extra security for `unitId` filter:** When a non-Manager/Admin/OrgHead user provides `unitId`, the system checks that the user is the head of that unit. If not, an error is thrown (`"You can only view requests for your own unit"`).

### 3.6 Pipeline Execution Order

The MongoDB aggregation pipeline executes in this order:

1. **Role scoping** — Role-based `$match` (user identity restrictions)
2. **Full-text search** — `$match` with `$text` (if `search` provided)
3. **Status filter** — `$match` on `status`
4. **Relation ID filters** — `$match` on `process._id`, `requester._id`, etc.
5. **History action filter** — `$match` on `history.action`
6. **Hierarchy filters** — `$match` on `wareType._id`, `wareClass._id`, etc.
7. **stuffStatus filter** — `$match` on `stuffStatus`
8. **Payment order lookup** — `$lookup` + `$match` on `paymentOrder` collection (only if `paymentOrderStatus` is set; handles `"none"` via `$size: 0`)
9. **Goods receipt lookup** — `$lookup` + `$match` on `goodsReceipt` collection (only if `goodsReceiptStatus` is set; handles `"none"` via `$size: 0`)
10. **Unit guard + filter** — Head-of-unit security check + `$match` on `requestingUnit._id`
11. **Text score** — `$addFields` (only if search + relevance sort)
12. **Sort** — `$sort`
13. **Skip** — `$skip`
14. **Limit** — `$limit`

### 3.7 Common Usage Patterns

#### 3.7.1 Dashboard: Pending PRs for UnitHead

```typescript
const result = await gets(
  {
    activeRoleId,
    status: "Pending",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  },
  {
    _id: 1, title: 1, status: 1, quantity: 1, estimatedAmount: 1,
    createdAt: 1, requestedAt: 1,
    wareModel: { _id: 1, name: 1 },
    requester: { _id: 1, first_name: 1, last_name: 1 },
    process: { _id: 1, name: 1 },
    currentStep: 1,
  },
)
```

#### 3.7.2 Finance: PRs with sent_to_finance payment orders

```typescript
const result = await gets(
  {
    activeRoleId,
    paymentOrderStatus: "sent_to_finance",
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: 1,
    limit: 50,
  },
  {
    _id: 1, title: 1, estimatedAmount: 1, quantity: 1,
    paymentOrders: { _id: 1, amount: 1, status: 1, createdAt: 1 },
    store: { _id: 1, name: 1 },
    requester: { _id: 1, first_name: 1, last_name: 1 },
  },
)
```

#### 3.7.3 Search by title/description

```typescript
const result = await gets(
  {
    activeRoleId,
    search: "کیت TSH",
    sortBy: "relevance",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  },
  {
    _id: 1, title: 1, status: 1, quantity: 1,
    wareModel: { _id: 1, name: 1 },
  },
)
```

#### 3.7.4 Filter by category hierarchy (warehouse view)

```typescript
const result = await gets(
  {
    activeRoleId,
    wareTypeId: "6a...",
    status: "Approved",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  },
  {
    _id: 1, title: 1, quantity: 1,
    wareModel: { _id: 1, name: 1 },
    wareType: { _id: 1, name: 1 },
  },
)
```

#### 3.7.5 Filter by history action (find recently received goods)

```typescript
const result = await gets(
  {
    activeRoleId,
    filterByAction: "goods_received",
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  },
  {
    _id: 1, title: 1, quantity: 1, updatedAt: 1,
    history: 1,
  },
)
```

---

## 4. `count` Method

**Action:** `count` on model `purchasingRequest`

Returns `{ qty: number }` — the total number of PRs matching the given filters.

### 4.1 Request Format

```json
{
  "service": "main",
  "model": "purchasingRequest",
  "act": "count",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "status": "Pending",
      "processId": "objectId",
      "requesterId": "objectId",
      "unitId": "objectId",
      "storeId": "objectId",
      "wareId": "objectId",
      "wareTypeId": "objectId",
      "wareClassId": "objectId",
      "wareGroupId": "objectId",
      "createdBy": "objectId",
      "stuffStatus": "...",
      "paymentOrderStatus": "...",
      "fromDate": "ISO string",
      "toDate": "ISO string",
      "search": "..."
    },
    "get": { "qty": 1 }
  }
}
```

### 4.2 Filter Fields

Same as `gets`, with the addition of date range + `createdBy` filters:

| Field | Type | MongoDB Match | Description |
|-------|------|---------------|-------------|
| `search` | string | `$text` search | Same as `gets` |
| `status` | enum | `status == value` | Same as `gets` |
| `processId` | ObjectId | `process._id == value` | Same as `gets` |
| `requesterId` | ObjectId | `requester._id == value` | Same as `gets` |
| `unitId` | ObjectId | `requestingUnit._id == value` | Same as `gets` |
| `storeId` | ObjectId | `store._id == value` | Same as `gets` |
| `wareId` | ObjectId | `ware._id == value` | Same as `gets` |
| `wareTypeId` | ObjectId | `wareType._id == value` | Same as `gets` |
| `wareClassId` | ObjectId | `wareClass._id == value` | Same as `gets` |
| `wareGroupId` | ObjectId | `wareGroup._id == value` | Same as `gets` |
| `createdBy` | ObjectId | `requester._id == value` | Alias for `requesterId` |
| `stuffStatus` | enum | `stuffStatus == value` | Same as `gets` |
| `paymentOrderStatus` | enum | via `$lookup` | Same as `gets` (including `"none"`) |
| `goodsReceiptStatus` | enum | via `$lookup` | Same as `gets` (including `"none"`) |
| `fromDate` | ISO string | `createdAt >= value` | Created on or after this date |
| `toDate` | ISO string | `createdAt <= value` | Created on or before this date |

### 4.3 Role-Based Scoping

Same as `gets`:

| Active Role | Auto-Scoping |
|-------------|-------------|
| Manager/Admin | None (counts all) |
| OrgHead | `organization._id == scopeId` |
| UnitHead | `requestingUnit._id == scopeId` (only if `unitId` not provided) |
| Employee/Ordinary | `requester._id == user._id` |
| StoreHead | `store._id == scopeId` AND `finalizedAt` exists |

### 4.4 Date Range Filter

`fromDate` and `toDate` filter by `createdAt`. Both are optional — use one or both:

```json
{
  "fromDate": "2026-01-01T00:00:00.000Z",
  "toDate": "2026-12-31T23:59:59.999Z"
}
```

---

## 5. Frontend Action Helpers

### Server Action for `gets`

```typescript
// src/app/actions/purchasingRequest/gets.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["purchasingRequest"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["gets"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "purchasingRequest",
    act: "gets",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || {
        _id: 1,
        title: 1,
        status: 1,
        quantity: 1,
        estimatedAmount: 1,
        wareModel: { _id: 1, name: 1 },
        requester: { _id: 1, first_name: 1, last_name: 1 },
      },
    },
  });
  return result;
};
```

### Server Action for `count`

```typescript
// src/app/actions/purchasingRequest/count.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const count = async (
  data: ReqType["main"]["purchasingRequest"]["count"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["count"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "purchasingRequest",
    act: "count",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || { qty: 1 },
    },
  });
  return result;
};
```

---

## Quick Reference: Filter + Count Parity

| Filter | Available in `gets` | Available in `count` |
|--------|:-------------------:|:--------------------:|
| `search` | ✅ | ✅ |
| `status` | ✅ | ✅ |
| `processId` | ✅ | ✅ |
| `requesterId` | ✅ | ✅ |
| `unitId` | ✅ | ✅ |
| `storeId` | ✅ | ✅ |
| `wareId` | ✅ | ✅ |
| `wareTypeId` | ✅ | ✅ |
| `wareClassId` | ✅ | ✅ |
| `wareGroupId` | ✅ | ✅ |
| `stuffStatus` | ✅ | ✅ |
| `paymentOrderStatus` | ✅ | ✅ |
| `goodsReceiptStatus` | ✅ | ✅ |
| `filterByAction` | ✅ | ❌ |
| `createdBy` | ❌ | ✅ (alias for requesterId) |
| `fromDate` / `toDate` | ❌ | ✅ |
| `sortBy` / `sortOrder` | ✅ | ❌ |
| `page` / `limit` / `skip` | ✅ | ❌ |

---

## Important Notes for Frontend

1. **Empty body = no results**: `gets` returns `{ body: [], success: true }` when no PRs match. `count` returns `{ body: { qty: 0 }, success: true }`.

2. **Role scoping is automatic**: You don't need to add role-based filters manually — just pass the correct `activeRoleId` and the backend applies scoping.

3. **`paymentOrderStatus` and `goodsReceiptStatus` trigger `$lookup`**: These are the only filters that require a database join. Each may be slightly slower than embedded-field filters. Use them only when needed.

4. **Text search and relevance sorting**: When you use `search`, pass `sortBy: "relevance"` and `sortOrder: "desc"` to get the most relevant results first. The text index covers `title` and `description` in both Persian and English.

5. **Always use `count` for pagination**: The `gets` response does not include total count. Make a parallel `count` call with the same filters to display page numbers. Use debouncing to avoid excessive count calls during rapid filter changes.

6. **`filterByAction` uses `history.action`**: It searches within the embedded `history` array. A PR matches if ANY history entry has the specified action. For example, `filterByAction: "goods_received"` returns all PRs that have EVER had goods received (even if they were later cancelled).
