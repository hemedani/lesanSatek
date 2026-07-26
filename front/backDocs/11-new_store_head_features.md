# StoreHead Role — Frontend Integration Guide

> **Last updated:** July 2026  
> **Backend scope:** `stuff`, `tender`, `tenderOffer`, `purchasingRequest` modules

---

## Overview

The **StoreHead** role grants a user management access to a specific store. Previously limited to store profile CRUD (name, address, bank info, etc.), StoreHead now has expanded capabilities across the procurement and inventory domains — but **strictly scoped to their own store**.

### StoreHead Identity

A StoreHead user is identified by:
- `user.roles[].name === "StoreHead"`
- `user.roles[].scopeType === "store"`
- `user.roles[].scopeId` ← the `_id` of the managed store

This is established via the `addOrRemoveRoles` action. Each StoreHead has **exactly one** managed store. The reverse relation `user.managedStore` (auto-created by Lesan from `store.storeHead`) provides a direct query path.

---

## 1. Stuff Management (Own Store Inventory)

StoreHead can perform full CRUD on **Stuff** items — but **only those belonging to their own store**. Every mutation is guarded by `checkStoreHeadAccess` which compares `activeRole.scopeId` against the target store.

### 1.1 `stuff.add`

**Access:** Manager, Admin, **StoreHead** (scoped)

**Request:**
```json
{
  "set": {
    "activeRoleId": "<uuid>",
    ...stuff_pure_fields,
    "wareId": "<wareId>",
    "storeId": "<storeId>",          // ← MUST match StoreHead's managed store
    "wareTypeId": "<wareTypeId>",
    "wareClassId": "<wareClassId>",
    "wareGroupId": "<wareGroupId>",
    "wareModelId": "<wareModelId>"
  },
  "get": "<stuff projection>"
}
```

**StoreHead restriction:** `set.storeId` must equal the StoreHead's `activeRole.scopeId`.  
**Error if violated:** `"You can only add items to your own store"`

### 1.2 `stuff.update`

**Access:** Manager, Admin, **StoreHead** (scoped)

**Request:**
```json
{
  "set": {
    "activeRoleId": "<uuid>",
    "_id": "<stuffId>",
    ...optional_stuff_pure_fields
  },
  "get": "<stuff projection>"
}
```

**StoreHead restriction:** The Stuff document's `store._id` must match the StoreHead's managed store. The backend fetches the stuff by `_id`, reads its embedded `store._id`, and compares.  
**Error if violated:** `"You can only manage stuff belonging to your own store"`

### 1.3 `stuff.remove`

**Access:** Manager, Admin, **StoreHead** (scoped)

**Request:**
```json
{
  "set": {
    "activeRoleId": "<uuid>",
    "_id": "<stuffId>",
    "hardCascade": false
  },
  "get": { "success": 1 }
}
```

**StoreHead restriction:** Same ownership check as `update` — the stuff must belong to the StoreHead's store.

### 1.4 `stuff.get` / `stuff.gets` / `stuff.count`

**Access:** All roles including **StoreHead**

**StoreHead gets behavior:** When StoreHead calls `gets`, the function **auto-injects** a `$match: { "store._id": <managedStoreId> }` filter. The StoreHead **only sees their own store's inventory** in list views. No additional `storeId` parameter is needed — the scope is automatic.

`get` (single item) is unrestricted — StoreHead can view any Stuff by `_id` if they know it.

---

## 2. Tender Browsing

StoreHead can **view** active tenders but **cannot create, close, or award** them.

### 2.1 `tender.get` / `tender.gets`

**Access:** All roles including **StoreHead** (read-only)

**Filters available in `gets`:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Text search (regex, case-insensitive) |
| `status` | enum | `open`, `closed`, `awarded`, `cancelled` |
| `purchasingRequestId` | string (ObjectId) | Filter by linked PR |
| `page`, `limit`, `skip` | pagination | Standard pagination |
| `sortBy` | enum | `createdAt`, `updatedAt`, `_id`, `title`, `deadline` |
| `sortOrder` | enum | `asc`, `desc` |

**No scope restriction** — StoreHead sees all tenders. This enables them to discover opportunities. The frontend should provide filters (e.g., `status: "open"`) to surface actionable tenders.

---

## 3. Tender Offer Submission & Viewing

StoreHead can submit bids (tender offers) **using their own store's identity** and view their own offers.

### 3.1 `tenderOffer.submit`

**Access:** Manager, Admin, OrgHead, UnitHead, Employee, Ordinary (all with `canRespondToTender` feature), **and StoreHead (no feature flag)**

**Request:**
```json
{
  "set": {
    "activeRoleId": "<uuid>",
    "price": 23000000,
    "deliveryTime": 7,
    "paymentTerms": "30 روزه",
    "description": "Optional offer description",
    "submittedAt": "2026-07-18T10:00:00.000Z",
    "tenderId": "<tenderId>",
    "storeId": "<storeId>"           // ← MUST match StoreHead's managed store
  },
  "get": "<tenderOffer projection>"
}
```

**StoreHead restriction:** `set.storeId` must equal the StoreHead's `activeRole.scopeId`.  
**Error if violated:** `"You can only add items to your own store"` (uses same `checkStoreHeadAccess("add")` utility)

**Important:** StoreHead does **not** require the `canRespondToTender` feature flag. Their permission comes from the role itself.

### 3.2 `tenderOffer.get` / `tenderOffer.gets`

**Access:** All roles including **StoreHead**

**StoreHead gets behavior:** Auto-filters by `store._id` matching the StoreHead's managed store. StoreHead only sees offers submitted by their own store.

**Manual filter example** (for other roles):
```json
{
  "set": {
    "activeRoleId": "<uuid>",
    "tenderId": "<tenderId>",
    "storeId": "<optionalStoreFilter>",
    "status": "submitted"
  },
  "get": "<projection>"
}
```

---

## 4. Purchasing Request Visibility & Fulfillment

StoreHead can view purchasing requests **where their store has been selected** (via `pr.store` relation, set by Manager/Admin during `addStuff`) and update the fulfillment status.

### 4.1 `purchasingRequest.gets`

**Access:** All roles including **StoreHead**

**StoreHead gets behavior:** Auto-injects `$match: { "store._id": <managedStoreId> }`. StoreHead only sees PRs where their store has been assigned as the supplier.

**How assignment happens (for context):**
1. Manager/Admin selects a Stuff item from a store via `purchasingRequest.addStuff`
2. This sets `pr.store` → that Store's `_id`
3. Also sets `pr.stuff` → the selected Stuff item
4. Also sets `pr.stuffStatus = "assigned"`
5. The PR now appears in the StoreHead's `gets` results

### 4.2 `purchasingRequest.get`

**Access:** All roles including **StoreHead** (unrestricted — can view any PR by `_id`)

### 4.3 `purchasingRequest.updateStuffStatus` (NEW)

**Schema:** `purchasingRequest`  
**Action name:** `updateStuffStatus`

**Access:** Manager, Admin, **StoreHead** (scoped)

**Purpose:** Update the fulfillment status of a PR's assigned stuff. StoreHead can progress the status along the shipping workflow.

**Valid status values (enum):**
| Value | Meaning |
|-------|---------|
| `assigned` | Initial — set by the system when Manager/Admin calls `addStuff`. StoreHead cannot set this manually. |
| `ready_to_ship` | Store has prepared the goods for shipment |
| `shipped` | Goods have been dispatched |
| `delivered` | Goods have been received by the requesting unit |

**Request:**
```json
{
  "set": {
    "activeRoleId": "<uuid>",
    "_id": "<purchasingRequestId>",
    "stuffStatus": "ready_to_ship"
  },
  "get": "<purchasingRequest projection>"
}
```

**StoreHead restriction:** The PR's `store._id` must match the StoreHead's managed store.  
**Error if violated:** `"You can only update stuff status for PRs assigned to your store"`

**Error if invalid status:** `"Invalid stuffStatus. Must be one of: assigned, ready_to_ship, shipped, delivered"`

**Side effects:**
- Updates `pr.stuffStatus` to the new value
- Pushes a `history` entry with action `"stuff_status_updated"`, including the performer's identity and the new status value
- The `pr.updatedAt` is refreshed

**Frontend workflow recommendation:**

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌───────────┐
│ assigned │ ──► │ ready_to_ship│ ──► │ shipped  │ ──► │ delivered  │
│          │     │              │     │          │     │           │
│ (system) │     │ Store clicks │     │ Store    │     │ Store     │
│          │     │ "Prepare"    │     │ ships it │     │ confirms  │
└──────────┘     └──────────────┘     └──────────┘     └───────────┘
```

---

## 5. Store Profile Management (Already Existed)

StoreHead's original access — unchanged, but included here for completeness:

| Action | Scope |
|--------|-------|
| `store.add` | ✅ Can create a store (with themselves as head) |
| `store.update` | ✅ Only their own store (via `getScope`) |
| `store.updateRelations` | ✅ Only their own store (via `getScope`) |
| `store.get` | ✅ Can read any store |
| `store.gets` | ✅ Can list all stores |
| `store.remove` | ❌ Manager/Admin only |
| `store.count` | ❌ Manager/Admin only |

---

## 6. Things StoreHead Still CANNOT Do

| Action | Why |
|--------|-----|
| `tender.add` / `tender.close` / `tender.award` | Only Manager/Admin/feature-gated roles |
| `purchasingRequest.add` / `submit` / `addStuff` | Only org-internal roles |
| `purchasingRequest.updateRelations` | Only org-internal roles |
| `stepApproval.submitDecision` | Only unit/org roles |
| `goodsReceipt.*`, `paymentOrder.*`, `budget*.*` | Finance/warehouse domain — not store-facing |
| `inventory.*`, `consumptionRecord.*` | Internal inventory management |
| `user.*` (except login/register) | User management is org-internal |

---

## 7. Summary of New StoreHead Capabilities

| Domain | Read | Write | Notes |
|--------|------|-------|-------|
| **Store profile** | ✅ All stores | ✅ Own store only | Pre-existing |
| **Stuff (inventory)** | ✅ Own store only | ✅ Own store only | `gets` auto-filters by store |
| **Tenders** | ✅ All tenders | ❌ Cannot create/modify | Read-only |
| **Tender offers** | ✅ Own offers only | ✅ Submit own offers | `gets` auto-filters by store |
| **Purchasing requests** | ✅ Own store's PRs | ✅ Update `stuffStatus` only | `gets` auto-filters by store |

---

## 8. Checking StoreHead Identity in Frontend

To determine if the current user is a StoreHead and find their managed store:

```typescript
// From getMe response
const storeHeadRole = user.roles.find(r => r.name === "StoreHead");
if (storeHeadRole) {
  const managedStoreId = storeHeadRole.scopeId; // string (ObjectId)
  // managedStoreId can be used as storeId in subsequent requests
}

// Or via the Lesan relation:
// getMe with get: { managedStore: { _id: 1, name: 1 } }
```

When StoreHead is the active role, the frontend should:
1. Read the `scopeId` from the active role to get the managed store's `_id`
2. Pass this as `storeId` when calling `stuff.add` or `tenderOffer.submit`
3. For list views (`gets`), no storeId param is needed — the backend auto-filters
4. For `updateStuffStatus`, pass the PR `_id` — the backend checks store ownership automatically
