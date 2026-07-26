# TenderOffer — Full API Reference for Frontend

## Overview

TenderOffer represents a vendor's bid on a tender. The system provides two read actions:

| Action | Returns | Use Case |
|--------|---------|----------|
| `tenderOffer.get` | Single offer by `_id` | View full details of one specific offer |
| `tenderOffer.gets` | Paginated, filtered list | Browse/submit offer page, check existing offers |

---

## StoreHead Auto-Scoping (Critical)

When a **StoreHead** user calls either `get` or `gets`, the backend **automatically filters** by their managed store using `store._id`. This means:

- A StoreHead **can only see their own offers** — never other vendors' offers
- No `storeId` parameter is needed in the request (it's auto-injected from the role's `scopeId`)
- If the StoreHead hasn't submitted any offers for a given tender, the result is an empty array

**For other roles** (Manager, Admin, OrgHead, UnitHead): No auto-scoping — they see all offers and can filter by `storeId` explicitly.

---

## Action: `tenderOffer.get`

Fetch a single tender offer by its `_id`.

### Request

```json
{
  "service": "main",
  "model": "tenderOffer",
  "act": "get",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "_id": "objectId"
    },
    "get": {
      "_id": 1,
      "price": 1,
      "status": 1,
      "ware": { "_id": 1, "name": 1, "brand": 1 },
      "store": { "_id": 1, "name": 1 },
      "tender": { "_id": 1, "title": 1 }
    }
  }
}
```

### Server Action

```typescript
// src/app/actions/tenderOffer/get.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["tenderOffer"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tenderOffer"]["get"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "tenderOffer",
    act: "get",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || { _id: 1, price: 1, status: 1, ware: { _id: 1, name: 1 } },
    },
  });
  return result;
};
```

---

## Action: `tenderOffer.gets`

Fetch a paginated, filterable, sortable list of offers.

### Request

```json
{
  "service": "main",
  "model": "tenderOffer",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "page": 1,
      "limit": 20,
      "...filters": "...",
      "sortBy": "submittedAt",
      "sortOrder": "desc"
    },
    "get": {
      "_id": 1,
      "price": 1,
      "status": 1,
      "ware": { "_id": 1, "name": 1, "brand": 1 },
      "store": { "_id": 1, "name": 1 }
    }
  }
}
```

### Server Action

```typescript
// src/app/actions/tenderOffer/gets.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["tenderOffer"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tenderOffer"]["gets"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "tenderOffer",
    act: "gets",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || { _id: 1, price: 1, status: 1, ware: { _id: 1, name: 1 } },
    },
  });
  return result;
};
```

---

## Filter Fields — `tenderOffer.gets`

### Exact Match Filters

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `tenderId` | `string` (ObjectId) | `tender._id` | Get all offers for a specific tender |
| `storeId` | `string` (ObjectId) | `store._id` | Get all offers from a specific vendor (Manager/Admin only) |
| `wareId` | `ObjectId` | `ware._id` | Filter by offered ware |
| `status` | `enum` | exact match | `"submitted"` / `"accepted"` / `"rejected"` |
| `paymentTerms` | `string` | case-insensitive regex | e.g. `"30 روزه"` |

### Range Filters

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `priceMin` / `priceMax` | `number` | `price $gte/$lte` | Budget range |
| `deliveryTimeMin` / `deliveryTimeMax` | `number` | `deliveryTime $gte/$lte` | Fastest delivery filter |
| `submittedAtBefore` / `submittedAtAfter` | ISO date | `submittedAt $lte/$gte` | Date range |

### Full-Text Search

| Field | Type | MongoDB Match |
|-------|------|---------------|
| `search` | `string` | `$text` search on description |

---

## Pagination

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | 1-indexed page |
| `limit` | `number` | `50` | Items per page |
| `skip` | `number` | computed | Overrides page if provided |

---

## Sort

| `sortBy` value | Sorts by |
|----------------|----------|
| `"createdAt"` | Creation date |
| `"updatedAt"` | Last update |
| `"_id"` | Mongo ID (default) |
| `"price"` | Offer price |
| `"deliveryTime"` | Delivery time |
| `"submittedAt"` | Submission date |
| `"relevance"` | Text score (only with `search`) |

`sortOrder`: `"asc"` or `"desc"` (default: `"desc"`)

---

## Response Format

Both `get` and `gets` return:

```json
{
  "success": true,
  "body": [ /* array */ ]
}
```

**`get`** returns an array with 0 or 1 element.
**`gets`** returns an array with 0 to `limit` elements.

Check `result.body.length` to determine if data exists.

---

## How a StoreHead Views Their Own Offers

### Scenario: StoreHead visits `/storehead/tenders/{tenderId}/offer`

The page needs to check if the **current StoreHead has already submitted an offer** for this tender. This is a two-step flow:

#### Step 1: Check existing offers

```typescript
const existingOffers = await gets(
  {
    activeRoleId,
    tenderId,                    // filter by this tender
    // NO storeId — auto-scoped by backend to StoreHead's managed store
    page: 1,
    limit: 10,
    sortBy: "submittedAt",
    sortOrder: "desc",
  },
  {
    _id: 1,
    price: 1,
    deliveryTime: 1,
    paymentTerms: 1,
    status: 1,
    submittedAt: 1,
    ware: { _id: 1, name: 1, brand: 1 },
  },
)
```

#### Step 2: Branch UI based on result

```typescript
if (existingOffers.success && existingOffers.body.length > 0) {
  // Already submitted — show existing offer details
  // Disable the submit button, show "شما قبلاً پیشنهاد داده‌اید"
  const myOffer = existingOffers.body[0]
  // Display myOffer.price, myOffer.deliveryTime, myOffer.status, etc.
} else {
  // No offer yet — show the submit form
  // Enable the submit button
}
```

### What happens behind the scenes (backend)

When a StoreHead calls `tenderOffer.gets`:

1. Backend extracts the StoreHead's role from `activeRoleId`
2. Finds `scopeType: "store"` and `scopeId` (the managed store's ObjectId)
3. Injects `match["store._id"] = scopeId` into the pipeline
4. This combines with any `tenderId` filter you send
5. Result: **only offers from this store for this tender**

No `storeId` parameter is needed — the backend handles it automatically. You cannot override this — a StoreHead can never see another vendor's offers.

### For other roles (Manager/Admin/UnitHead)

These roles have no auto-scoping. To view offers for a specific tender:

```typescript
// Manager viewing ALL offers for a tender
const allOffers = await gets(
  {
    activeRoleId,
    tenderId,
    page: 1,
    limit: 50,
  },
  { _id: 1, price: 1, status: 1, store: { _id: 1, name: 1 }, ware: { _id: 1, name: 1 } },
)

// Manager viewing only accepted offers
const acceptedOffers = await gets(
  {
    activeRoleId,
    tenderId,
    status: "accepted",
  },
  { _id: 1, price: 1, store: { _id: 1, name: 1 } },
)
```

---

## Full Page Example — Check + Submit Offer

```typescript
"use client"

import { useState, useEffect } from "react"
import { gets } from "@/app/actions/tenderOffer/gets"
import { submit } from "@/app/actions/tenderOffer/submit"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { useAuthStore } from "@/stores/authStore"

export default function OfferPage({ params }: { params: { id: string } }) {
  const { user, activeRoleId } = useAuthStore()
  const [myOffer, setMyOffer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const storeId = user?.roles
    ?.find(r => r.roleId === activeRoleId)
    ?.scopeId

  // Step 1: Check existing offers for this tender
  useEffect(() => {
    (async () => {
      const res = await gets(
        { activeRoleId, tenderId: params.id, page: 1, limit: 10 },
        { _id: 1, price: 1, deliveryTime: 1, status: 1, submittedAt: 1, ware: { _id: 1, name: 1, brand: 1 } },
      )
      if (res.success && res.body.length > 0) {
        setMyOffer(res.body[0])
      }
      setLoading(false)
    })()
  }, [params.id])

  if (loading) return <div>Loading...</div>

  if (myOffer) {
    return (
      <div>
        <h2>پیشنهاد شما</h2>
        <p>وضعیت: {myOffer.status}</p>
        <p>قیمت: {myOffer.price}</p>
        <p>زمان تحویل: {myOffer.deliveryTime} روز</p>
        {myOffer.ware && <p>کالا: {myOffer.ware.name} ({myOffer.ware.brand})</p>}
        {/* Submit button disabled — already submitted */}
      </div>
    )
  }

  // No offer yet — show submit form
  return (
    <div>
      <h2>ثبت پیشنهاد جدید</h2>
      {/* Form fields: ware selection, price, deliveryTime, etc. */}
      {/* Submit calls tenderOffer.submit with { tenderId, storeId, wareId, price, deliveryTime, ... } */}
    </div>
  )
}
```

---

## Pipeline Execution Order (gets)

1. **StoreHead auto-scope** — `store._id` injected from role
2. **Equality match** — tenderId, storeId, wareId, status, paymentTerms
3. **Range match** — price, deliveryTime, submittedAt
4. **Full-text search** — $text search
5. **Text score** — $addFields (optional)
6. **Sort** — $sort
7. **Skip** — $skip
8. **Limit** — $limit
