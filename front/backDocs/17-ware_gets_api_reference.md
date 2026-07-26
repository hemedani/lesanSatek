# Ware & `ware.gets` — API Reference for Frontend

## Overview

Ware is the concrete product entity — the final node in the 4-level classification hierarchy (WareType → WareClass → WareGroup → WareModel → Ware). Each Ware represents a specific product with a brand, manufacturer, base price, and regulatory IDs (IRC, UMDNS, GTIN).

**Use cases:**
- Search products by name/brand when creating an add-stuff form
- List all wares for a specific `wareModelId` when a vendor submits a tender offer
- Filter by hierarchy, manufacturer, brand, or price range for procurement research
- Look up regulatory identifiers (IRC/GTIN) for compliance

---

## Data Model

### Pure Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | — | Persian name (e.g. "کیت TSH پیشرفته ZistShimi") |
| `enName` | `string?` | — | English name (e.g. "Advanced TSH Kit ZistShimi") |
| `brand` | `string?` | — | Brand name (e.g. "ZistShimi") |
| `price` | `number` | — | System base price per unit (ریال) |
| `orderedNumber` | `number` | `0` | Number of units already ordered |
| `irc` | `string?` | — | IRC code (regulatory ID) |
| `umdns` | `number?` | — | UMDNS code (medical device nomenclature) |
| `gtin` | `number?` | — | GTIN (barcode for trade items) |
| `photoUrl` | `string?` | — | Product photo URL |

### Relations

| Relation | Type | Reverse on target | Description |
|----------|------|-------------------|-------------|
| `creator` | single | — | The user who created this ware |
| `manufacturer` | single | `manufacturer.wares` | The manufacturer/producer |
| `wareType` | single | `wareType.wares` | Top-level classification |
| `wareClass` | single | `wareClass.wares` | Second-level classification |
| `wareGroup` | single | `wareGroup.wares` | Third-level classification |
| `wareModel` | single | `wareModel.wares` | Specific model (SKU-level) |

### Query-Filterable Fields (denormalized in documents)

All hierarchy relations are **embedded** in the ware document (Lesan single relations), so you can filter directly on:
- `wareModel._id`
- `wareClass._id`
- `wareGroup._id`
- `wareType._id`
- `manufacturer._id`

---

## Action: `ware.gets`

Fetches a paginated, filterable, sortable list of wares.

### Request

```json
{
  "service": "main",
  "model": "ware",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "string (required)",
      "page": 1,
      "limit": 20,
      "...filters": "...",
      "sortBy": "name",
      "sortOrder": "asc"
    },
    "get": {
      "_id": 1,
      "name": 1,
      "enName": 1,
      "brand": 1,
      "price": 1
    }
  }
}
```

---

## Filter Fields (all optional)

### Hierarchy (ObjectId filters — match on denormalized embedded docs)

| Field | MongoDB Match | Use Case |
|-------|---------------|----------|
| `wareModelId` | `ware.wareModel._id == value` | **Get all wares for a specific model** (e.g. tender offer submission) |
| `wareClassId` | `ware.wareClass._id == value` | Filter by subcategory |
| `wareGroupId` | `ware.wareGroup._id == value` | Filter by group |
| `wareTypeId` | `ware.wareType._id == value` | Filter by top-level type |
| `manufacturerId` | `ware.manufacturer._id == value` | Filter by manufacturer |

### Brand & Identifiers

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `brand` | `string` | case-insensitive regex | Brand search (partial match) |
| `irc` | `string` | exact match | IRC code lookup |
| `umdns` | `number` | exact match | UMDNS code lookup |
| `gtin` | `number` | exact match | GTIN/barcode lookup |

### Price Range

| Field | Type | MongoDB Match | Use Case |
|-------|------|---------------|----------|
| `priceMin` | `number` | `ware.price >= value` | Cheapest options |
| `priceMax` | `number` | `ware.price <= value` | Budget filter |

### Full-Text Search

| Field | Type | MongoDB Match |
|-------|------|---------------|
| `search` | `string` | `$text` search on `name` and `enName` text index |

Use `search` for free-form product lookup. For structured filters (hierarchy, brand, etc.), use the dedicated fields above.

---

## Pagination

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | 1-indexed page number |
| `limit` | `number` | `50` | Items per page |
| `skip` | `number` | computed | Overrides page if provided |

---

## Sort

| `sortBy` value | Sorts by | Use Case |
|----------------|----------|----------|
| `"createdAt"` | Creation date | Default |
| `"updatedAt"` | Last update | Recently updated |
| `"name"` | Name | Alphabetical listing |
| `"price"` | Price | Cheapest first |
| `"brand"` | Brand | Brand grouping |
| `"relevance"` | Text score | Only when `search` is provided |

`sortOrder`: `"asc"` (default) or `"desc"`

---

## Response

```json
{
  "success": true,
  "body": [
    {
      "_id": "objectId",
      "name": "کیت TSH پیشرفته ZistShimi",
      "enName": "Advanced TSH Kit ZistShimi",
      "brand": "ZistShimi",
      "price": 250000,
      "orderedNumber": 500,
      "irc": "1234567890",
      "umdns": 12345,
      "gtin": 9876543210123,
      "manufacturer": { "_id": "objectId", "name": "ZistShimi Co." },
      "wareModel": { "_id": "objectId", "name": "TSH Kit" },
      "wareType": { "_id": "objectId", "name": "آزمایشگاهی" },
      "wareClass": { "_id": "objectId", "name": "هماتولوژی" },
      "wareGroup": { "_id": "objectId", "name": "کیت" }
    }
  ]
}
```

Body is always an **array**. Use `ware.count` for total count.

---

## Server Action

```typescript
// src/app/actions/ware/gets.ts
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["ware"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["ware"]["gets"]["get"]>
) => {
  const token = await getToken();
  const activeRoleId = await getActiveRoleId();
  const result = await AppApi(undefined, token).send({
    service: "main",
    model: "ware",
    act: "gets",
    details: {
      set: { ...data, activeRoleId },
      get: getSelection || { _id: 1, name: 1, enName: 1, brand: 1, price: 1 },
    },
  });
  return result;
};
```

---

## Common Usage Patterns

### 1. Tender Offer — Load wares for a wareModel

When a StoreHead is submitting a tender offer, show the wares that match the tender's PR wareModel:

```typescript
const result = await gets(
  {
    activeRoleId,
    wareModelId: "6a5b8c9716b15588c2350c4d",
    page: 1,
    limit: 100,
    sortBy: "price",
    sortOrder: "asc",
  },
  {
    _id: 1,
    name: 1,
    enName: 1,
    brand: 1,
    price: 1,
    manufacturer: { _id: 1, name: 1 },
  },
)
```

Each result represents a selectable product variant — display `name`, `brand`, `manufacturer`, and `price` in the dropdown.

### 2. Add Stuff — Ware search dropdown

When adding new stuff to a store, let the user search for a ware:

```typescript
const result = await gets(
  {
    activeRoleId,
    search: query,
    page: 1,
    limit: 20,
  },
  {
    _id: 1,
    name: 1,
    enName: 1,
    brand: 1,
    price: 1,
    wareType: { _id: 1 },
    wareClass: { _id: 1 },
    wareGroup: { _id: 1 },
    wareModel: { _id: 1 },
  },
)
```

On selection, auto-fill the hierarchy IDs (`wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId`) from the returned relations.

### 3. Filter by brand + price range

```typescript
const result = await gets(
  {
    activeRoleId,
    brand: "ZistShimi",
    priceMin: 100000,
    priceMax: 500000,
    sortBy: "price",
    sortOrder: "asc",
  },
  { _id: 1, name: 1, brand: 1, price: 1 },
)
```

### 4. Lookup by regulatory ID

```typescript
const result = await gets(
  {
    activeRoleId,
    gtin: 9876543210123,
  },
  { _id: 1, name: 1, brand: 1, gtin: 1, irc: 1 },
)
```

### 5. Full hierarchy drill-down

```typescript
const result = await gets(
  {
    activeRoleId,
    wareTypeId: typeId,
    wareClassId: classId,
    wareGroupId: groupId,
    manufacturerId: mfrId,
  },
  { _id: 1, name: 1, brand: 1, price: 1 },
)
```

---

## Classification Hierarchy (for context)

```
WareType (e.g. "تجهیزات آزمایشگاهی")
  └── WareClass (e.g. "هماتولوژی")
        ├── WareGroup (e.g. "کیت")
        │     ├── WareModel (e.g. "TSH Kit")
        │     │     ├── Ware (e.g. "TSH Kit ZistShimi")
        │     │     ├── Ware (e.g. "TSH Kit Pishtaz")
        │     │     └── Ware (e.g. "TSH Kit Padtan Teb")
        │     └── WareModel (e.g. "ESR Kit")
        │           └── ...
        └── WareGroup (e.g. "دستگاه")
              └── ...
```

All 4 hierarchy levels are **denormalized** on each Ware document, so filtering by any level is a single `$match` on the embedded `._id` field — no joins needed.

---

## Pipeline Execution Order

1. **Equality match** — hierarchy IDs, brand (regex), irc, umdns, gtin
2. **Range match** — price ($gte/$lte)
3. **Full-text search** — $text search (separate $match stage)
4. **Text score** — $addFields (only when search + relevance sort)
5. **Sort** — $sort
6. **Skip** — $skip
7. **Limit** — $limit

All filters are **additive** — `wareModelId` + `manufacturerId` + `priceMin` returns wares matching ALL three.
