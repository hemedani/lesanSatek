# Frontend Agent Prompt — StoreHead Role Implementation

Implement the **StoreHead** panel (`/store` route) in the Next.js frontend. StoreHead manages a specific store (فروشگاه نمونه) with access to store inventory, tenders, offers, and purchasing requests assigned to their store.

---

## 1. StoreHead Identity Detection

Read the active role from the user's `roles` array (from `getMe` or login response):

```typescript
const storeHeadRole = user.roles.find(r => r.name === "StoreHead");
// storeHeadRole = { roleId: "<uuid>", name: "StoreHead", scopeType: "store", scopeId: "<storeId>" }
```

Use `storeHeadRole.roleId` as `activeRoleId` in all API calls.
Use `storeHeadRole.scopeId` as the managed store's `_id` when needed for mutations.

---

## 2. Dashboard (`/store`)

Display store overview with KPIs:

| KPI | Source |
|-----|--------|
| Store name, address, contact, score | `store.get({ _id: scopeId })` |
| Inventory count | `stuff.gets` (auto-filtered by backend) |
| Active PRs count | `purchasingRequest.gets` with status filter |
| Open tenders count | `tender.gets({ status: "open" })` |

---

## 3. Store Inventory — Stuff CRUD (`/store/inventory`)

### Model
Stuff now has `quantity` (replaced old `inventoryNo`). Always display & use `quantity`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quantity` | number | **yes** | Units in stock |
| `price` | number | **yes** | Unit price in IRR |
| `hasAbsolutePrice` | boolean | default `false` | If true → `price` is final. If false → `pricePercentage` is applied to Ware's base price. |
| `pricePercentage` | number? | optional | Markup % over Ware.price |
| `expiration` | date? | optional | |
| `barcode` | number? | optional | |

### List (`gets`)
Backend **auto-filters** by `store._id` when StoreHead calls `stuff.gets`. No `storeId` param needed.

```json
// Request
{ "activeRoleId": "<storeHeadRoleId>" }
// Response
[{ "_id": "...", "quantity": 50, "price": 2800000, "hasAbsolutePrice": true, ... }]
```

**Display:** Table with quantity, price, ware info, expiration.

### Add
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "quantity": 50,
  "price": 2800000,
  "hasAbsolutePrice": true,
  "wareId": "<wareId>",
  "storeId": "<storeHeadRole.scopeId>",
  "wareTypeId": "<wareTypeId>",
  "wareClassId": "<wareClassId>",
  "wareGroupId": "<wareGroupId>",
  "wareModelId": "<wareModelId>"
}
```

**Rule:** `storeId` must match `activeRole.scopeId`. Backend rejects with "You can only add items to your own store" if mismatch.

**UI flow:**
1. Select Ware (fetches hierarchy: wareType → wareClass → wareGroup → wareModel → ware)
2. Auto-populate hierarchy IDs from the selected ware
3. Auto-set `storeId` from `scopeId` (hidden)
4. User fills: quantity, price, pricing mode (absolute/percentage)

### Update
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "_id": "<stuffId>",
  "quantity": 45,
  "price": 3000000
}
```

**Rule:** Backend checks the Stuff's `store._id` matches `scopeId` before allowing.

### Delete
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "_id": "<stuffId>",
  "hardCascade": false
}
```

**Rule:** Same store ownership check. Show confirmation dialog before delete.

---

## 4. Tenders (`/store/tenders`)

### Browse open tenders (`tender.gets`)
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "status": "open"
}
```

**Read-only.** No create/edit/close/award buttons.

**Display:** Table with title, deadline, status. Filterable by status.

### Submit Offer (`tenderOffer.submit`)
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "tenderId": "<tenderId>",
  "storeId": "<scopeId>",
  "price": 23000000,
  "deliveryTime": 7,
  "paymentTerms": "30 روزه",
  "description": "Optional"
}
```

**Rule:** `storeId` must match `scopeId`. StoreHead does NOT need `canRespondToTender` feature flag — role alone grants permission.

**UI flow:**
1. From tender detail page, click "ثبت پیشنهاد"
2. Modal/form with: price, delivery time (days), payment terms, description
3. Auto-set `storeId` from `scopeId`

### View My Offers (`tenderOffer.gets`)
Backend **auto-filters** by `store._id`. StoreHead only sees offers from their store.

```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "tenderId": "<tenderId>"  // optional filter
}
```

**Display:** Table with price, delivery time, status (submitted/accepted/rejected).

---

## 5. Purchasing Requests (`/store/requests`)

### List (`gets`)
Backend **auto-filters** by `store._id`. StoreHead only sees PRs where their store was assigned as supplier.

```json
{ "activeRoleId": "<storeHeadRoleId>" }
```

**Display:** Table with title, quantity, stuffStatus, estimatedAmount.

### Status Visual
Each PR has a `stuffStatus` field (enum):

| Value | Meaning | UI Badge |
|-------|---------|----------|
| `none` | No stuff assigned yet | Not visible to StoreHead (filtered out) |
| `assigned` | Manager assigned this store as supplier | **تخصیص داده شده** (blue) |
| `ready_to_ship` | Store prepared goods | **آماده ارسال** (orange) |
| `shipped` | Goods dispatched | **ارسال شده** (purple) |
| `delivered` | Goods received by requesting unit | **تحویل داده شده** (green) |

**Note:** `stuffStatus = "none"` PRs are auto-filtered out by backend — StoreHead won't see them.

### Update Stuff Status (`updateStuffStatus`)
StoreHead can advance `stuffStatus` along the chain: `assigned → ready_to_ship → shipped → delivered`

```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "_id": "<purchasingRequestId>",
  "stuffStatus": "ready_to_ship"
}
```

**Workflow buttons (conditional on current status):**

```
assigned  →  [آماده ارسال]  →  ready_to_ship
ready_to_ship  →  [ارسال شد]  →  shipped
shipped  →  [تحویل داده شد]  →  delivered
```

**Backend side-effects on `delivered`:**
1. Decrements `stuff.quantity` by `pr.quantity`
2. Adds stock to **requesting unit's warehouse** via `inventoryManager.addStock()`
3. Creates StockMovement audit entry

These happen automatically — frontend just shows success.

---

## 6. Store Profile (`/store/settings`)

### View & Edit Own Store
```json
// get
{ "activeRoleId": "<storeHeadRoleId>", "_id": "<scopeId>" }
// update
{ "activeRoleId": "<storeHeadRoleId>", "_id": "<scopeId>", "name": "...", "address": "..." }
```

### Cannot Delete Store
Hide/disable delete button. Manager/Admin only.

---

## 7. Panel Routing

### PanelSelector for Sara (سارا کریمی)

Sara has 3 roles → 3 panels:

| Role | Panel | Route |
|------|-------|-------|
| Manager | `/admin` | Full admin panel |
| StoreHead | `/store` | Store management (NEW — implement this) |
| Employee | `/employee` | PR submission |

PanelSelector should show all 3. StoreHead panel is new.

### Route Guards

| Route | Role Required | Redirect if Unauthorized |
|-------|---------------|--------------------------|
| `/store` | `roles[].name === "StoreHead"` | `/login` or default panel |

---

## 8. Error Handling

| Error | Cause | UI |
|-------|-------|-----|
| "You can only add items to your own store" | `storeId` doesn't match `scopeId` | Toast with error message |
| "You can only manage stuff belonging to your own store" | Tried to update/delete another store's stuff | Toast with error message |
| "You can only update stuff status for PRs assigned to your store" | PR's store doesn't match scope | Toast with error message |
| "Invalid stuffStatus" | Sent wrong enum value | Toast with valid options |
| Network/server error | Backend down | Error boundary + "تلاش مجدد" button |

---

## 9. Empty States

All list pages must have Persian empty state messages:

| Page | Persian Message |
|------|----------------|
| `/store/inventory` | "هیچ کالایی در فروشگاه شما ثبت نشده است" |
| `/store/tenders` | "هیچ مناقصه‌ای یافت نشد" |
| `/store/requests` | "هیچ درخواست خرابی به فروشگاه شما اختصاص داده نشده است" |
| `/store/tenders/offers` | "هنوز پیشنهادی ثبت نکرده‌اید" |

---

## 10. API Reference Summary

| Action | Method | StoreHead? | Auto-Filtered? | Scope Check? |
|--------|--------|------------|----------------|--------------|
| `stuff.gets` | reads list | ✅ | ✅ by `store._id` | — |
| `stuff.get` | read one | ✅ | ❌ (by `_id`) | — |
| `stuff.add` | create | ✅ | — | ✅ `set.storeId` |
| `stuff.update` | update | ✅ | — | ✅ doc's `store._id` |
| `stuff.remove` | delete | ✅ | — | ✅ doc's `store._id` |
| `tender.gets` | reads list | ✅ | ❌ (all tenders) | — |
| `tenderOffer.submit` | create | ✅ | — | ✅ `set.storeId` |
| `tenderOffer.gets` | reads list | ✅ | ✅ by `store._id` | — |
| `purchasingRequest.gets` | reads list | ✅ | ✅ by `store._id` | — |
| `purchasingRequest.updateStuffStatus` | update | ✅ | — | ✅ PR's `store._id` |
| `store.get` | read one | ✅ | — | — |
| `store.update` | update | ✅ | — | ✅ `_id` == `scopeId` |

---

## 11. State Management

Use Zustand store for current StoreHead context:

```typescript
interface StoreHeadStore {
  managedStoreId: string | null;
  storeHeadRoleId: string | null;
  setStoreHeadContext: (role: { roleId: string; scopeId: string }) => void;
  clear: () => void;
}
```

Initialize on login / getMe response when a StoreHead role is found.

---

## 12. Loading & Error States

Every page must handle:
- **Loading:** Skeleton loaders on initial fetch
- **Error:** Persian error toast for API failures, error boundary for crashes
- **Empty:** Persian empty state with relevant icon
- **Success:** Persian success toast on mutations
