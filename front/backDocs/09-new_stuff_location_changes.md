# Backend Changes for Frontend — New `addStuff` Action + Geographic Coordinates

This document explains all backend changes so the frontend AI agent knows exactly what needs to change on the UI/API layer.

---

## 1. Executive Summary

Two major changes were made to the backend:

### A. `PurchaseOrderItem` model was **eliminated entirely**

Previously, when a unit head "assigned a store" to a PurchasingRequest, the system created a `PurchaseOrderItem` record (a full Lesan model with its own CRUD endpoints). This was unnecessary overhead because each PR is for a single `wareModel` + `quantity`. All the data POI carried (pricing, store reference, status) now lives directly on the `PurchasingRequest` document.

**What replaced it:** A new `addStuff` action that takes a `stuffId` instead of a `storeId`. The store is now **hidden from the unit head** — they only see the product (Stuff) name and price. The store behind the Stuff is recorded internally (for auto-payment and goods receipt) but never exposed in unit-head-facing API responses.

### B. Geographic coordinates added to 3 models

`Store`, `Unit`, and `Organization` now have a `location`/`geoLocation` field (GeoJSON `{type: "Point", coordinates: [lng, lat]}`) for proximity-based search.

---

## 2. Complete Purchasing Request Flow (New)

### 2.1 Create Draft PR

**Action:** `purchasingRequest.add`

**Request:** `{ title, description, quantity, wareModelId }`

**Behavior (unchanged):**
- Creates a Draft PR with `status: "Draft"`, `stuffStatus: "none"`
- Links `requester`, `wareModel`, `requestingUnit`
- No process is assigned yet
- No pricing or store involvement

---

### 2.2 Submit PR (Simplified)

**Action:** `purchasingRequest.submit`

**Request:** `{ _id, requestingUnitId? }`

**What was removed:**
- ❌ `storeId` parameter (previously allowed inline store assignment during submit)
- ❌ All `PurchaseOrderItem` creation logic
- ❌ Tender check (was redundant — tender can be created after submit)

**Behavior (simplified):**
1. Validates Draft status
2. Resolves the appropriate process via `resolveProcessForPR()` (scoped by org/unit/wareModel hierarchy)
3. Links the resolved process to the PR
4. Creates `StepApproval` records for the first process step
5. Sets `status: "Pending"`, `currentStep: 0`
6. Pushes `"submitted"` history entry

**Important:** `stuffStatus` remains `"none"` after submit. The stuff is assigned later via `addStuff` or `tender.award`.

---

### 2.3 Add Stuff to PR (New — replaces `assignStore`)

**Action:** `purchasingRequest.addStuff` (NEW — replaces `assignStore`)

**Request:**
```json
{
  "activeRoleId": "<uuid>",
  "_id": "<purchasingRequestId>",
  "stuffId": "<stuffId>"
}
```

**What the unit head sees:**
- A search UI where they browse available **Stuff** records (product listings)
- They see: product name, brand, price — **NOT the store name or identity**
- They select a Stuff

**What happens server-side:**
1. Validates PR is in `Pending` or `InProgress` status
2. Validates the Stuff's `wareModel` matches the PR's `wareModel`
3. Computes price:
   - If `stuff.hasAbsolutePrice` → `unitPrice = stuff.price`
   - If `stuff.pricePercentage` → `unitPrice = ware.price * (1 + pricePercentage/100)`
   - Otherwise → `unitPrice = stuff.price`
4. Sets `estimatedAmount = unitPrice * quantity` on the PR
5. Sets `stuffStatus = "assigned"`
6. Links PR's `stuff` relation → the selected Stuff
7. Links PR's `store` relation → the Stuff's store (**hidden from unit head**)
8. Pushes `"stuff_assigned"` history entry (only includes `stuffId` + `estimatedAmount`, **no store info**)

**Response (get struct):** Uses `selectStruct("purchasingRequest", 2)` — the frontend should **NOT** include `store` in its get struct for unit-head calls. The `stuff` relation IS included and exposes the product info.

---

### 2.4 Tender Flow (Purchase via Auction) — Unchanged structure, adapted

#### Create Tender

**Action:** `tender.add` — links to the PR, assigns vendors (stores)

**Request:** `{ purchasingRequestId, title, description, deadline, assignedVendorIds }`

#### Close Tender

**Action:** `tender.close` — transitions from `open` → `closed` (no more bids)

#### Award Tender

**Action:** `tender.award` — **now sets PR fields directly instead of creating POI**

**Request:** `{ _id: tenderId, winningOfferId }`

**What changed:**
- ❌ No longer creates a `PurchaseOrderItem`
- ✅ Now directly sets PR fields:
  1. Sets `estimatedAmount = offerPrice * quantity`
  2. Sets `stuffStatus = "assigned"`
  3. Links PR's `stuff` (auto-finds Stuff matching winning store + PR's wareModel)
  4. Links PR's `store` to the winning offer's store
  5. Rejects all other offers
  6. Pushes `"stuff_assigned"` history entry (with `storeId`, `stuffId`, `tenderOfferId`)
  7. Updates tender status to `"awarded"`

**Note:** The `store` is linked for internal use (auto-payment, goods receipt) but remains hidden from the unit head's view.

---

### 2.5 Goods Receipt (Goods Receipt) — Adapted

**Action:** `goodsReceipt.add`

**Request:** Items no longer include `purchaseOrderItemId`:
```json
{
  "items": [{
    "wareModelId": "...",
    "wareModelName": "...",
    "wareId": "...",
    "wareName": "...",
    "quantityReceived": 100,
    "quantityAccepted": 98,
    "quantityRejected": 2,
    "batchNo": "BATCH-001",
    "expirationDate": "2025-06-01"
  }]
}
```

**What changed:**
- ❌ `purchaseOrderItemId` removed from items (it was a plain string, not a Lesan relation)
- ✅ Added `wareModelName`, `wareId`, `wareName` (optional — for display/traceability)
- ✅ Pricing now reads from PR's `estimatedAmount` → prorated: `orderTotal = (estimatedAmount / quantity) * totalAccepted`
- ✅ Instead of updating POI status → updates PR's `stuffStatus = "received"`
- ✅ Instead of reading POI's `assignedFrom` for `payTo` → reads PR's `store` relation directly
- ✅ Stock movement `storeId` still comes from PR's `store`

---

### 2.6 Remove Stuff from PR (Adapted)

**Action:** `purchasingRequest.removeFromPurchase`

**Request (simplified):** `{ _id: purchasingRequestId }` — no longer needs `purchaseOrderItemId`

**What changed:**
- ❌ `purchaseOrderItemId` parameter removed
- ✅ Now clears PR's `stuffStatus = "cancelled"`, unlinks `stuff` and `store` relations, unsets `estimatedAmount`
- ✅ Pushes `"stuff_removed"` history entry

---

### 2.7 Payment Order — Unchanged

**Action:** `paymentOrder.markPaid`

No changes needed. The payment order already:
- Reads `payTo` from the PR's `store` relation (which is now populated by `addStuff` or `tender.award`)
- Converts budget encumbrances linked via `purchasingRequest` reference

---

### 2.8 `updateRelations` — POI block removed

**Action:** `purchasingRequest.updateRelations`

**What changed:**
- ❌ `purchaseOrderItemIds` parameter removed from both validator and fn
- ❌ `hasFeature("canAssignItemsToOrder")` check removed (was only used for POI)

All other relation fields (`requestingUnitId`, `attachmentIds`, `tenderId`, `stepApprovalIds`, `goodsReceiptIds`, `paymentOrderIds`, `budgetLineId`, `storeId`, `wareId`, `wareTypeId`, `wareClassId`, `wareGroupId`) remain unchanged.

---

## 3. New Fields on PurchasingRequest

### Pure Fields

```typescript
stuffStatus: "none" | "assigned" | "received" | "cancelled"
  // Lifecycle: none (initial) → assigned (via addStuff/tender.award) → received (via goodsReceipt) → cancelled (via removeFromPurchase)
```

### Relations

```typescript
stuff: {
  schemaName: "stuff",
  type: "single",
  optional: true,
  // Links to the specific Stuff record (product listing) selected by unit head or awarded via tender
  // The Stuff record inherently belongs to a Store, but the Store identity is hidden from the unit head
}
```

**Existing relation that is now system-managed:**
```typescript
store: {
  schemaName: "store",
  type: "single",
  optional: true,
  // Populated automatically by addStuff or tender.award
  // Used internally for auto-payment (payTo) and goods receipt traceability
  // NOT exposed in unit-head-facing get structs
}
```

---

## 4. Deleted Model: PurchaseOrderItem

**Model file:** `models/purchaseOrderItem.ts` — deleted
**All action files:** `src/purchaseOrderItem/` — entire directory deleted

**Fields that no longer exist anywhere:**
- `purchaseOrderItem.purchaseOrderItemId` (in goodsReceipt items) — removed
- `purchaseOrderItem.quantity` — already exists on PR
- `purchaseOrderItem.unitPrice` → replaced by PR's `estimatedAmount` (total = `unitPrice * quantity`)
- `purchaseOrderItem.totalPrice` → same PR's `estimatedAmount`
- `purchaseOrderItem.status` → replaced by PR's `stuffStatus`
- `purchaseOrderItem.assignedFrom` (Store) → replaced by PR's `store` relation
- `purchaseOrderItem.assignedBy` (User) → tracked in PR history
- `purchaseOrderItem.tenderOffer` → no longer needed (PR is linked to tender directly)
- `purchaseOrderItem.wareModel` → already on PR

**Deleted API endpoints:**
- `purchaseOrderItem.add`
- `purchaseOrderItem.get`
- `purchaseOrderItem.gets`
- `purchaseOrderItem.update`
- `purchaseOrderItem.updateRelations`
- `purchaseOrderItem.remove`
- `purchaseOrderItem.count`

---

## 5. Geographic Coordinates

### Store

```typescript
// New field in store_pure:
geoLocation: {
  type: "Point",          // Always "Point" for a single location
  coordinates: [lng, lat] // longitude first, then latitude (GeoJSON standard)
}

// Existing field (unchanged, used for text address):
location: string          // e.g., "Tehran, Valiasr Street"
```

**Frontend implications:**
- `geoLocation` is optional
- When creating/updating a store, frontend can send `geoLocation: { type: "Point", coordinates: [51.3890, 35.6892] }`
- Used for proximity search: "find stores near this unit"

### Unit

```typescript
// New field in unit_pure:
location: {
  type: "Point",
  coordinates: [lng, lat]
}
```

- Optional
- Can be set during unit creation or update
- Used for proximity-based warehouse/unit search

### Organization

```typescript
// New field in organization_pure:
location: {
  type: "Point",
  coordinates: [lng, lat]
}
```

- Optional
- Represents the organization's headquarters location

---

## 6. History Actions — Updated List

The `history` array on PurchasingRequest can now contain these action values:

| Action | Triggered By | Details Shape |
|---|---|---|
| `"created"` | `purchasingRequest.add` | `{}` |
| `"submitted"` | `purchasingRequest.submit` | `{ status, currentStep, processId }` |
| `"step_approved"` | `stepApproval.submitDecision` | `{ stepName, stepIndex, stepType, unitId, comment? }` |
| `"step_rejected"` | `stepApproval.submitDecision` | `{ stepName, stepIndex, stepType, unitId, comment? }` |
| `"stuff_assigned"` | `purchasingRequest.addStuff` or `tender.award` | `{ stuffId, estimatedAmount }` (from `addStuff`) or `{ wareModelId, wareModelName, quantity, unitPrice, storeId, stuffId, tenderOfferId }` (from award) |
| `"stuff_removed"` | `purchasingRequest.removeFromPurchase` | `{ previousStuffId, previousStoreId }` |
| `"goods_received"` | `goodsReceipt.add` | `{ goodsReceiptId, itemCount, receivingUnitId }` |
| `"payment_ordered"` | System (during markPaid) | — |

**Note:** `"item_assigned"` and `"item_removed"` no longer appear — replaced by `"stuff_assigned"` and `"stuff_removed"`.

---

## 7. Frontend Changes Required

### 7.1 Remove All PurchaseOrderItem References

- Delete any frontend code that calls `purchaseOrderItem.*` API endpoints
- Remove `purchaseOrderItem` from TypeScript types/interfaces
- Remove any UI components that display purchase order items as separate entities

### 7.2 UI: Replace "Assign Store" with "Add Stuff"

**Old flow:** Unit head sees a list of stores → selects a store → `assignStore` creates a POI
**New flow:** Unit head sees a list of **Stuff** records (product name + price only) → selects a Stuff → `addStuff` sets pricing on PR

**Unit head's "Add Stuff" UI:**
- Search/filter available Stuff records (product listings)
- Display columns: product name, brand, price (per unit), total price
- Do NOT display store name or store info
- User selects one Stuff → calls `purchasingRequest.addStuff` with `stuffId`

**Available Stuff query:** Use `stuff.gets` to list Stuff records. Filter by `wareModelId` to match the PR's wareModel. The response includes `ware.name`, `wareModel.name`, `price`, but also includes `store` relation — **do not display the store to the unit head**.

### 7.3 PR Detail View Updates

- Replace `purchaseOrderItems` in the get struct with `stuff`
- Display: stuff name, price, quantity, total estimated amount
- Do NOT display store info (unless user is Admin/Manager with permission)
- Display `stuffStatus` badge: none / assigned / received / cancelled

### 7.4 Goods Receipt Form

- Remove `purchaseOrderItemId` from the goods receipt item form
- The form now only needs: `wareModelId`, `quantityReceived`, `quantityAccepted`, `quantityRejected`, `batchNo`, `expirationDate`
- Optionally include `wareModelName`, `wareId`, `wareName` for display

### 7.5 Tender Award Flow

- No changes needed on the tender offer/bid UI
- When awarding, the backend now directly sets PR fields instead of creating a POI
- The frontend just calls `tender.award` with `winningOfferId` as before — nothing changes on the call

### 7.6 PR Submit Form

- Remove the `storeId` field from the submit form (if it existed)
- Submit is now a pure Draft→Pending transition

### 7.7 Geographic Coordinates

- **Store create/update form:** Add optional geo-location picker (map or lat/lng input) for `geoLocation`
- **Unit create/update form:** Add optional geo-location picker for `location`
- **Organization create/update form:** Add optional geo-location picker for `location`
- These fields can be used later for proximity-based search (e.g., "find stores within 50 km of this unit")

---

## 8. API Endpoint Reference (New/Changed)

### New Endpoints

| Action | Schema | Method | Request Body |
|---|---|---|---|
| `addStuff` | purchasingRequest | Custom | `{ activeRoleId, _id: PR_ID, stuffId: STUFF_ID }` |

### Changed Endpoints (signature change)

| Action | Schema | What Changed |
|---|---|---|
| `submit` | purchasingRequest | Removed `storeId` param |
| `removeFromPurchase` | purchasingRequest | Removed `purchaseOrderItemId` param |
| `updateRelations` | purchasingRequest | Removed `purchaseOrderItemIds` param |
| `goodsReceipt.add` | goodsReceipt | Items no longer have `purchaseOrderItemId`; added `wareModelName`, `wareId`, `wareName` (optional) |

### Deleted Endpoints

| Action | Schema | Notes |
|---|---|---|
| `add` | purchaseOrderItem | Entire model deleted |
| `get` | purchaseOrderItem | — |
| `gets` | purchaseOrderItem | — |
| `update` | purchaseOrderItem | — |
| `updateRelations` | purchaseOrderItem | — |
| `remove` | purchaseOrderItem | — |
| `count` | purchaseOrderItem | — |
| `assignStore` | purchasingRequest | Replaced by `addStuff` |

### Unchanged Endpoints (relevant to the flow)

| Action | Schema | Notes |
|---|---|---|
| `award` | tender | Behavior changed internally (sets PR fields instead of creating POI), but API signature unchanged |
| `add` | goodsReceipt | Items schema changed (see above) |
| `markPaid` | paymentOrder | No changes |

---

## 9. Error Handling Notes

- `addStuff` throws if PR not in `Pending`/`InProgress` state
- `addStuff` throws if Stuff's `wareModel` doesn't match PR's `wareModel`
- `addStuff` throws if Stuff has no associated store (data integrity)
- `removeFromPurchase` throws if `stuffStatus` is already `"none"` or `"cancelled"`
- `tender.award` works even if no Stuff is found for the winning store+wareModel combination (the `stuff` relation is just not linked, but `store` and pricing are still set)

---

## 10. Migration Notes for Existing Data

### Existing PurchaseOrderItems

Any existing `PurchaseOrderItem` records in the MongoDB database will NOT be deleted by this change. They will remain as orphaned documents:
- Collection: `purchaseOrderItem` (will remain in MongoDB but no Lesan model maps to it)
- The `purchasingRequest` documents that had `purchaseOrderItems` relations will still have those embedded references
- These can be safely ignored or cleaned up manually

### Existing GoodsReceipt Items

Existing `goodsReceipt` documents with `purchaseOrderItemId` in their items array will remain as-is. The validator change only affects new goods receipts.

### Stuff Status on Existing PRs

Existing PRs will have `stuffStatus` defaulted to `"none"` (the default value in the schema). If they had an assigned store via the old `assignStore`, the `estimatedAmount` field may or may not be set. A data migration could be run to backfill `stuffStatus: "assigned"` for PRs that have a `store` relation, but this is optional.
