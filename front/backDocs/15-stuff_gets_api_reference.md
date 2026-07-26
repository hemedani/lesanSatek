# `stuff.gets` — API Reference for Frontend

## Overview

Fetches a paginated, filterable, sortable list of Stuff (store inventory items). Supports filtering by product hierarchy, pricing mode, long payment plans, stock quantity, expiration date, barcode, and full-text search.

---

## Request

**Action:** `gets` on model `stuff`

**Endpoint:** `POST {BACKEND_URL}/lesan`

### Body

```json
{
  "service": "main",
  "model": "stuff",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "page": 1,
      "limit": 20,
      "...filters": "...",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    },
    "get": {
      "_id": 1,
      "quantity": 1,
      "...": 1
    }
  }
}
```

### Server Action (Recommended)

```typescript
// src/app/actions/stuff/gets.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["stuff"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["stuff"]["gets"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "stuff",
    act: "gets",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || { _id: 1, quantity: 1, price: 1, ware: { _id: 1, name: 1 } },
    },
  });
  return result;
};
```

---

## Filter Fields (all optional)

### Product Hierarchy (ObjectId filters)

| Field | MongoDB Match | Use Case |
|-------|---------------|----------|
| `wareModelId` | `stuff.wareModel._id == value` | Find stores carrying a specific product model (for PR store availability) |
| `wareId` | `stuff.ware._id == value` | Filter by exact product variant |
| `storeId` | `stuff.store._id == value` | Filter by a specific store |
| `wareTypeId` | `stuff.wareType._id == value` | Top-level category filter |
| `wareClassId` | `stuff.wareClass._id == value` | Second-level category filter |
| `wareGroupId` | `stuff.wareGroup._id == value` | Third-level category filter |

All hierarchy filters use **denormalized embedded docs** (e.g. `"wareModel._id"`), so no joins needed.

**Note for StoreHead role:** `storeId` is automatically overridden to the StoreHead's managed store — they can only see their own store's stuff. Other filters combine freely within that scope.

### Price & Stock

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `priceMin` | `number` | `stuff.price >= value` | Min price filter |
| `priceMax` | `number` | `stuff.price <= value` | Max price filter |
| `quantityMin` | `number` | `stuff.quantity >= value` | Only show stores with at least this many in stock (e.g. PR quantity) |
| `hasAbsolutePrice` | `boolean` | `stuff.hasAbsolutePrice == value` | Filter by pricing mode (absolute vs percentage) |

### Long Payment Filters

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `hasLongPayment` | `boolean` | `$or` across all 14 `*PricePercent` fields (`$exists: true, $ne: null`) | Stores that offer any long-term payment plan |
| `availableLongPayment` | `string` | `stuff.availableLongPayment` case-insensitive regex match | Text search in payment plan description (e.g. "۱۲ ماهه") |
| `minLongPaymentMonth` | `enum` | The specific month's `*PricePercent` field must exist | Stores offering at least N-month payment |

**`minLongPaymentMonth` accepted values:**

| Value | MongoDB Field Checked |
|-------|----------------------|
| `"two"` | `twoMonthPricePercent` |
| `"three"` | `threeMonthPricePercent` |
| `"four"` | `fourMonthPricePercent` |
| `"five"` | `fiveMonthPricePercent` |
| `"six"` | `sixMonthPricePercent` |
| `"seven"` | `sevenMonthPricePercent` |
| `"eight"` | `eightMonthPricePercent` |
| `"nine"` | `nineMonthPricePercent` |
| `"ten"` | `tenMonthPricePercent` |
| `"eleven"` | `elevenMonthPricePercent` |
| `"twelve"` | `twelveMonthPricePercent` |
| `"eighteen"` | `eighteenMonthPricePercent` |
| `"twentyFour"` | `twentyFourMonthPricePercent` |

### Expiration & Barcode

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `expirationBefore` | ISO date string | `stuff.expiration <= value` | Items expiring before a given date |
| `expirationAfter` | ISO date string | `stuff.expiration >= value` | Items expiring after a given date |
| `isExpirationNear` | `boolean` | `stuff.isExpirationNear == value` | Quick filter for near-expiry items |
| `barcode` | `number` | `stuff.barcode == value` | Exact barcode lookup |

### Full-Text Search

| Field | Type | MongoDB Match |
|-------|------|---------------|
| `search` | `string` | `$text` search on text index (covers name, barcode, description if indexed) |

Use `search` when the user types a free-form query. For structured filters (hierarchy, price, etc.), use the dedicated fields above.

---

## Pagination Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number (1-indexed) |
| `limit` | `number` | `50` | Items per page |
| `skip` | `number` | computed from `page`+`limit` | Raw skip count (overrides page if provided) |

---

## Sort Fields

| `sortBy` value | Sorts by | Use Case |
|----------------|----------|----------|
| `"createdAt"` | Creation date (default) | Default listing |
| `"updatedAt"` | Last update date | Recently updated |
| `"name"` | Name | Alphabetical listing |
| `"price"` | Price | Cheapest/most expensive first |
| `"quantity"` | Stock quantity | Well-stocked/low-stock first |
| `"expiration"` | Expiration date | Expiring soon |
| `"barcode"` | Barcode number | Barcode-based sorting |
| `"twoMonth"` | 2-month long payment price | Compare short-term pricing |
| `"twelveMonth"` | 12-month long payment price | Standard long-term comparison |
| `"twentyFourMonth"` | 24-month long payment price | Max-term comparison |
| `"relevance"` | Text search relevance score | Only when `search` is provided |

**`sortOrder`**: `"asc"` or `"desc"` (default: `"desc"`)

---

## Response

```json
{
  "success": true,
  "body": [
    {
      "_id": "objectId",
      "quantity": 50,
      "price": 2800000,
      "hasAbsolutePrice": true,
      "pricePercentage": null,
      "expiration": "2026-07-26T00:00:00.000Z",
      "barcode": 123456789,
      "qrc": "QR-CODE",
      "isBarcodeSet": true,
      "isQrcSet": true,
      "isExpirationNear": false,
      "availableLongPayment": "۱۲ ماهه",
      "twoMonthPricePercent": 5,
      "twelveMonthPricePercent": 15,
      "twoMonth": 2940000,
      "twelveMonth": 3220000,
      "ware": { "_id": "objectId", "name": "TSH Kit", "brand": "ZistShimi", "price": 2500000 },
      "store": { "_id": "objectId", "name": "فروشگاه نمونه" },
      "wareModel": { "_id": "objectId", "name": "TSH Kit ZistShimi" },
      // ... more ware/wareType/wareClass/wareGroup fields as requested in `get` projection
    }
  ]
}
```

The response `body` is always an **array** (even if empty). Pagination metadata (total count) is not included — use the `count` action for totals.

---

## Common Usage Patterns

### 1. Find stores carrying a specific wareModel for PR assignment

```typescript
const result = await gets(
  {
    activeRoleId,
    wareModelId: "6a5b8c9716b15588c2350c4d",
    quantityMin: prQuantity,  // only stores with enough stock
    page: 1,
    limit: 50,
    sortBy: "price",
    sortOrder: "asc",
  },
  {
    _id: 1,
    quantity: 1,
    price: 1,
    hasAbsolutePrice: 1,
    pricePercentage: 1,
    store: { _id: 1, name: 1, address: 1 },
    ware: { _id: 1, name: 1, brand: 1 },
    availableLongPayment: 1,
  },
)
```

### 2. Find stores with long payment options for a wareModel

```typescript
const result = await gets(
  {
    activeRoleId,
    wareModelId: "6a5b8c9716b15588c2350c4d",
    hasLongPayment: true,
    minLongPaymentMonth: "twelve",
    sortBy: "twelveMonth",
    sortOrder: "asc",
  },
  {
    _id: 1,
    store: { _id: 1, name: 1 },
    availableLongPayment: 1,
    twelveMonth: 1,
    twelveMonthPricePercent: 1,
  },
)
```

### 3. StoreHead viewing their own store's inventory

No `storeId` needed — StoreHead role auto-scopes to their store.

```typescript
const result = await gets(
  {
    activeRoleId,
    search: "tsh",  // full-text search
    sortBy: "quantity",
    sortOrder: "asc",  // low-stock first
    page: 1,
    limit: 20,
  },
  {
    _id: 1,
    quantity: 1,
    price: 1,
    expiration: 1,
    ware: { _id: 1, name: 1, brand: 1 },
    wareModel: { _id: 1, name: 1 },
  },
)
```

### 4. Search by barcode or expiration range

```typescript
const result = await gets(
  {
    activeRoleId,
    barcode: 1234567890123,
    // OR
    expirationBefore: "2026-12-31T00:00:00.000Z",
    expirationAfter: "2026-01-01T00:00:00.000Z",
  },
  { _id: 1, quantity: 1, expiration: 1 },
)
```

---

## Pipeline Execution Order (for debugging)

1. **Role scoping** — StoreHead auto-filters by `store._id`
2. **Equality match** — hierarchy IDs, barcode, hasAbsolutePrice, isExpirationNear, availableLongPayment regex, hasLongPayment ($or), minLongPaymentMonth ($exists)
3. **Range match** — price, quantity, expiration ($gte/$lte)
4. **Full-text search** — $text search (separate $match stage)
5. **Text score** — $addFields (only when search + relevance sort)
6. **Sort** — $sort
7. **Skip** — $skip
8. **Limit** — $limit

All filters are **additive** — specifying `wareModelId` + `quantityMin` + `hasLongPayment` returns stuff matching ALL three conditions.
