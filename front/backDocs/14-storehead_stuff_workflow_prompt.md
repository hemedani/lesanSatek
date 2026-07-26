# Frontend Agent Prompt — StoreHead: Add Stuff & Delivery Workflow

Implement two StoreHead features: (1) the **add new stuff** form with the new `quantity` field, and (2) the **stuff fulfillment workflow** (assigned → ready_to_ship → shipped → delivered) with inventory reduction on delivery.

---

## 1. Add New Stuff Form

### Stuff Pure Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quantity` | `number` | **yes** | Replaces old `inventoryNo`. Units in stock. |
| `price` | `number` | **yes** | Unit price in IRR |
| `hasAbsolutePrice` | `boolean` | default `false` | `true` → `price` is the final price. `false` → `pricePercentage` is applied over the Ware's base price. |
| `pricePercentage` | `number?` | optional | Markup % applied on `Ware.price` when `hasAbsolutePrice = false` |
| `expiration` | `date?` | optional | Expiration date |
| `barcode` | `number?` | optional | Barcode number |
| `qrc` | `string?` | optional | QR code string |
| `availableLongPayment` | `string?` | optional | e.g. "۱۲ ماهه" |
| Month price percents | `number?` | optional | `twoMonthPricePercent` through `twentyFourMonthPricePercent` |
| Month prices | `number?` | optional | `twoMonth` through `twentyFourMonth` |

### Relation fields (required — denormalized hierarchy)

| Field | Source |
|-------|--------|
| `wareId` | Selected Ware's `_id` |
| `storeId` | StoreHead's `scopeId` (auto-set, hidden) |
| `wareTypeId` | From hierarchy (auto-filled when ware selected) |
| `wareClassId` | From hierarchy |
| `wareGroupId` | From hierarchy |
| `wareModelId` | From hierarchy |

### API Request
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "quantity": 50,
  "price": 2800000,
  "hasAbsolutePrice": true,
  "wareId": "<wareId>",
  "storeId": "<scopeId>",
  "wareTypeId": "<wareTypeId>",
  "wareClassId": "<wareClassId>",
  "wareGroupId": "<wareGroupId>",
  "wareModelId": "<wareModelId>"
}
```

### Form UI Flow

1. **Ware selector** — User picks a Ware. This auto-populates `wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId` from the Ware's denormalized hierarchy.

2. **Pricing mode** — Toggle between:
   - **Absolute price** (`hasAbsolutePrice: true`) → user enters final `price` directly
   - **Percentage markup** (`hasAbsolutePrice: false`) → user enters `pricePercentage`, system calculates: `finalPrice = Ware.price * (1 + pricePercentage/100)`

   Show a read-only computed price preview below.

3. **Quantity** — Simple number input.

4. Optional fields: expiration, barcode, QR code, long payment settings.

---

## 2. Stuff Fulfillment Workflow

Each PR assigned to this store has a `stuffStatus` field. StoreHead advances it sequentially.

### Status Progression

```
assigned  ──►  ready_to_ship  ──►  shipped  ──►  delivered
```

### UI Pattern — Conditional Action Button

Show one button at a time based on current `stuffStatus`. Disable/hide the button if status doesn't match.

| Current Status | Button Label | Next Status |
|----------------|-------------|-------------|
| `assigned` | "آماده ارسال" | `ready_to_ship` |
| `ready_to_ship` | "ارسال شد" | `shipped` |
| `shipped` | "تحویل داده شد" | `delivered` |
| `delivered` | (no button — terminal state) | — |

Show a **confirmation dialog** before each status change.

### API Call
```json
{
  "activeRoleId": "<storeHeadRoleId>",
  "_id": "<purchasingRequestId>",
  "stuffStatus": "ready_to_ship"
}
```

### Backend Side-Effects (automatic, no frontend action needed)

When `stuffStatus` reaches **`delivered`**:

1. **Store stuff quantity decremented** — `stuff.quantity` reduced by `pr.quantity`
2. **Receiving unit's warehouse gets stock** — inventory created/updated for the requesting unit via `addStock()`
3. **StockMovement audit trail** created for both sides

These happen server-side. Frontend just shows a success toast.

### Visual Status Badge

| Status | Persian Label | Color |
|--------|--------------|-------|
| `assigned` | تخصیص داده شده | Blue |
| `ready_to_ship` | آماده ارسال | Orange |
| `shipped` | ارسال شده | Purple |
| `delivered` | تحویل داده شده | Green |

---

## 3. Edge Cases & States

| Case | Behavior |
|------|----------|
| **Quantity = 0 on add** | Allowed (backlog/backorder). Appears in list but `checkStoreAvailability` won't return it for assignment (filtered: `quantity < pr.quantity`). |
| **Quantity < PR quantity in availability check** | Backend filters out — StoreHead won't see this stuff as available for that PR |
| **Deliver with quantity = 0** | No inventory reduction happens (`Math.max(0, currentQty - 0) = 0`) |
| **Loading** | Button shows spinner while API call is in-flight, disabled to prevent double-submit |
| **API error** | Persian error toast, button re-enabled, status unchanged |

---

## 4. Error Handling

| Error Message | Cause | UI |
|---------------|-------|-----|
| "You can only add items to your own store" | `storeId` doesn't match StoreHead's scope | Toast: "شما فقط می‌توانید به فروشگاه خود کالا اضافه کنید" |
| "Invalid stuffStatus. Must be one of: assigned, ready_to_ship, shipped, delivered" | Wrong enum value sent | Toast with valid options in Persian |
| "Purchasing request not found" | PR deleted or invalid `_id` | Toast: "درخواست خرید یافت نشد" |

---

## 5. TypeScript Types

```typescript
interface AddStuffPayload {
  activeRoleId: string;
  quantity: number;
  price: number;
  hasAbsolutePrice: boolean;
  pricePercentage?: number;
  expiration?: string;
  barcode?: number;
  qrc?: string;
  wareId: string;
  storeId: string;
  wareTypeId: string;
  wareClassId: string;
  wareGroupId: string;
  wareModelId: string;
  [key: string]: unknown; // for optional month fields
}

type StuffStatus = "assigned" | "ready_to_ship" | "shipped" | "delivered";

interface UpdateStuffStatusPayload {
  activeRoleId: string;
  _id: string;
  stuffStatus: StuffStatus;
}
```
