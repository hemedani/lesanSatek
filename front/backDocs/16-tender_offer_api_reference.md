# TenderOffer — API Reference for Frontend

## Overview

TenderOffer represents a vendor's bid on a tender. A store submits an offer specifying which **Ware** (specific product variant) they are offering, along with pricing and delivery terms. Each offer links to its tender, the submitting store, and the specific ware.

**TenderOffer Lifecycle**: `submitted` → `accepted` / `rejected`

---

## Data Model

### Pure Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `price` | `number` | — | Bid price per unit (ریال) |
| `deliveryTime` | `number` | — | Estimated delivery time in days |
| `paymentTerms` | `string?` | — | Payment terms (e.g. "30 روزه") |
| `description` | `string?` | — | Additional description |
| `status` | `enum` | `"submitted"` | `"submitted"` / `"accepted"` / `"rejected"` |
| `submittedAt` | `Date` | — | When the offer was submitted |

### Relations

| Relation | Type | Reverse on target | Description |
|----------|------|-------------------|-------------|
| `tender` | single | `tender.offers` | The tender this offer belongs to |
| `store` | single | `store.tenderOffers` | The vendor submitting the offer |
| `ware` | single | `ware.tenderOffers` | The specific ware being offered |

### Why `ware` is required

A tender is created for a PurchasingRequest, which references a **WareModel** (e.g. "TSH Kit"). But a WareModel can have multiple **Wares** — different brands, manufacturers, or variants (e.g. "TSH Kit ZistShimi", "TSH Kit Pishtaz"). The vendor must specify which exact ware they are offering.

---

## Action: `tenderOffer.submit`

Creates a new TenderOffer from a vendor (StoreHead).

### Request

```json
{
  "service": "main",
  "model": "tenderOffer",
  "act": "submit",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "price": 23000000,
      "deliveryTime": 7,
      "paymentTerms": "30 روزه",
      "description": "قیمت هر کیت ۲۳,۰۰۰,۰۰۰ ریال، تحویل ۷ روزه",
      "submittedAt": "2026-07-26T16:09:00.000Z",
      "tenderId": "objectId",
      "storeId": "objectId",
      "wareId": "objectId"
    },
    "get": {
      "_id": 1,
      "price": 1,
      "status": 1,
      "ware": { "_id": 1, "name": 1, "brand": 1 }
    }
  }
}
```

### Request Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `price` | ✅ | `number` | Bid price per unit |
| `deliveryTime` | ✅ | `number` | Days until delivery |
| `paymentTerms` | — | `string` | e.g. "30 روزه", "نقدی" |
| `description` | — | `string` | Free text description |
| `submittedAt` | ✅ | ISO date string | When the offer is submitted |
| `tenderId` | ✅ | ObjectId | The tender being bid on |
| `storeId` | ✅ | ObjectId | The submitting vendor store |
| `wareId` | ✅ | ObjectId | The specific ware being offered |

**Status note**: `status` is NOT user-provided — the model defaults to `"submitted"` automatically.

### Response

```json
{
  "success": true,
  "body": {
    "_id": "objectId",
    "price": 23000000,
    "deliveryTime": 7,
    "paymentTerms": "30 روزه",
    "description": "قیمت هر کیت ۲۳,۰۰۰,۰۰۰ ریال، تحویل ۷ روزه",
    "status": "submitted",
    "submittedAt": "2026-07-26T16:09:00.000Z",
    "ware": { "_id": "objectId", "name": "TSH Kit ZistShimi", "brand": "ZistShimi" },
    "store": { "_id": "objectId", "name": "شرکت زیست شیمی" },
    "tender": { "_id": "objectId", "title": "مناقصه کیت TSH" }
  }
}
```

### Server Action

```typescript
// src/app/actions/tenderOffer/submit.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const submit = async (
  data: ReqType["main"]["tenderOffer"]["submit"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tenderOffer"]["submit"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "tenderOffer",
    act: "submit",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || { _id: 1, price: 1, status: 1, ware: { _id: 1, name: 1 } },
    },
  });
  return result;
};
```

---

## Frontend Integration — Full Flow

### Step 1: Load available wares for the tender's PR wareModel

When the StoreHead opens the submit-offer dialog, first fetch the wares that match the tender's wareModel:

```typescript
// Get tender details to find its PR's wareModel
const tenderRes = await getTender(
  { activeRoleId, _id: tenderId },
  {
    _id: 1,
    purchasingRequest: {
      _id: 1,
      wareModel: { _id: 1, name: 1 },
    },
  },
)
const wareModelId = tenderRes.body?.[0]?.purchasingRequest?.wareModel?._id

// Fetch wares matching that wareModel
const waresRes = await getWares(
  { activeRoleId, wareModelId, page: 1, limit: 100 },
  { _id: 1, name: 1, enName: 1, brand: 1, manufacturer: { _id: 1, name: 1 }, price: 1 },
)
// waresRes.body → array of { _id, name, enName, brand, manufacturer, price }
```

### Step 2: Show ware selection to the vendor

Display a searchable dropdown of wares filtered by the wareModel. Each ware shows:
- Name + English name
- Brand
- Manufacturer
- System base price (for reference)

### Step 3: Submit the offer

```typescript
const result = await submit(
  {
    activeRoleId: getActiveRoleIdFromStore(),
    price: Number(formData.price),
    deliveryTime: Number(formData.deliveryTime),
    paymentTerms: formData.paymentTerms || undefined,
    description: formData.description || undefined,
    submittedAt: new Date().toISOString(),
    tenderId,
    storeId,  // from the StoreHead's managed store scope
    wareId: formData.wareId,
  },
  { _id: 1, price: 1, status: 1, ware: { _id: 1, name: 1, brand: 1 } },
)
```

### Step 4: Handle response

```typescript
if (result.success) {
  toast.success("پیشنهاد شما با موفقیت ثبت شد")
  router.refresh()  // Refresh to show new offer
} else {
  toast.error(result.body?.message || "خطا در ثبت پیشنهاد")
}
```

---

## Permission & Scope

Only **StoreHead** role can submit tender offers. The `storeId` must match the StoreHead's managed store scope. The backend's `submit` preAct enforces this via `checkStoreHeadAccess("submit")`.

---

## Related Actions

### `tender.close` (by UnitHead/Manager)
Closes the tender to new offers. All existing offers remain as `"submitted"`.

### `tender.award` (by UnitHead/Manager)
Winners are chosen:
1. Winning offer → `status: "accepted"`
2. All other offers → `status: "rejected"`
3. PR gets `stuffStatus: "assigned"` with the winning store, ware, and price

### `purchasingRequest.assignStore` (alternative to tender)
Direct store assignment without going through a tender workflow.

---

## Relation Map

```
Tender (has many TenderOffers)
  └── TenderOffer
        ├── tender → Tender (reverse: tender.offers)
        ├── store → Store (reverse: store.tenderOffers)
        └── ware → Ware (reverse: ware.tenderOffers)
                └── wareModel → WareModel (the PR's wareModel)
```
