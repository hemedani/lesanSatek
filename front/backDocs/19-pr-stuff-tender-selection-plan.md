# Frontend AI Agent: PR Stuff & Tender Selection Implementation

## Overview

This document describes all backend changes and tells you exactly what needs to change in the frontend. The core change is that **UnitHead users can now add stuff OR select a tender offer while the PurchasingRequest (PR) is still in `Draft` status**. Previously this was blocked for Draft PRs.

Additionally, **tender awarding is now deferred**: when a UnitHead selects a winning tender offer, the tender stays at `"closed"` status. The actual award (tender → `"awarded"`, winning offer → `"accepted"`, other offers → `"rejected"`, stuff/store linked on PR) happens automatically when the **last approval step is completed** (PR → `"Completed"`).

A new `selectionType` field on the PR tracks whether the UnitHead has chosen the "stuff" path or the "tender" path. The PR cannot be submitted (Draft → Pending) unless this field is set.

---

## 1. Backend Model Changes

### PurchasingRequest — 2 new pure fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectionType` | `string` | `"none"` | `"none"` \| `"stuff"` \| `"tender"` — tracks what the user selected |
| `selectedTenderOfferId` | `string?` | `undefined` | The ObjectId of the chosen TenderOffer (only set when `selectionType === "tender"`) |

**How `selectionType` works:**
- When user calls `addStuff`: `selectionType` → `"stuff"`, `stuff` relation is linked
- When user calls `selectTenderOffer`: `selectionType` → `"tender"`, `selectedTenderOfferId` → tenderOfferId
- Both selections can coexist (old data stays when switching), `selectionType` always reflects the active/primary/last choice
- `removeFromPurchase` (removing stuff) resets `selectionType` to `"none"`
- `removeTenderSelection` (removing tender offer selection) resets `selectionType` to `"none"`

### All new history action values

The `history` embedded array on PurchasingRequest can now have these additional `action` values:

| `action` value | Triggered by | `details` shape |
|---|---|---|
| `"tender_created"` | `tender.add` | `{ tenderId, title, deadline, status: "open" }` |
| `"tender_offer_selected"` | `purchasingRequest.selectTenderOffer` | `{ tenderId, tenderTitle, tenderOfferId, offerPrice, offerDeliveryTime, offerPaymentTerms, storeId, storeName, wareModelId, wareModelName, quantity, estimatedAmount }` |
| `"tender_awarded"` | `stepApproval.submitDecision` (auto, on final approval) | `{ tenderId, tenderOfferId, offerPrice, storeId, stuffId, wareModelId, quantity, estimatedAmount }` |
| `"tender_offer_removed"` | `purchasingRequest.removeTenderSelection` | `{ previousTenderOfferId }` |

---

## 2. New Backend Actions

### 2a. `purchasingRequest.selectTenderOffer`

**Signature:**
```
set: { activeRoleId, _id: ObjectId, tenderOfferId: ObjectId }
get: selectStruct("purchasingRequest", 2)
```

**Access:** Manager, Admin, OrgHead, UnitHead

**Logic:**
1. Validates PR exists and status is Draft/Pending/InProgress
2. Validates TenderOffer exists and status is `"submitted"`
3. Validates the Tender linked to the offer has status `"closed"` and its `purchasingRequest._id` matches the PR
4. Sets `selectionType: "tender"`, `selectedTenderOfferId`, `estimatedAmount` (= offerPrice × quantity)
5. Pushes `"tender_offer_selected"` history entry with comprehensive details
6. Does NOT change tender status or link stuff/store (those happen at final approval)

**Error messages:**
- `"Purchasing request not found"`
- `"Can only select a tender offer for a Draft, Pending, or InProgress request"`
- `"Tender offer not found"`
- `"Only submitted offers can be selected"`
- `"Tender offer has no linked tender"`
- `"Linked tender not found"`
- `"This tender offer does not belong to this purchasing request"`
- `"Tender must be closed before selecting a winner"`

### 2b. `purchasingRequest.removeTenderSelection`

**Signature:**
```
set: { activeRoleId, _id: ObjectId }
get: selectStruct("purchasingRequest", 2)
```

**Access:** Manager, Admin, OrgHead, UnitHead

**Logic:**
1. Validates PR exists and `selectionType === "tender"`
2. Resets `selectionType: "none"`, unsets `selectedTenderOfferId`
3. Pushes `"tender_offer_removed"` history

**Error messages:**
- `"Purchasing request not found"`
- `"No tender offer is currently selected"`

---

## 3. Modified Backend Actions

### 3a. `purchasingRequest.addStuff` — modified

**What changed:**
- **Status check relaxed**: Previously required Pending/InProgress. Now also allows Draft: `["Draft", "Pending", "InProgress"]`
- **`selectionType` set**: Now sets `selectionType: "stuff"` alongside `stuffStatus: "assigned"`
- **Richer history `details`**: Now includes `{ stuffId, storeId, storeName, unitPrice, pricingMode, quantity, estimatedAmount }`

**New error messages:**
- `"Can only add stuff to a Draft or active purchasing request"` (replaces the old Pending/InProgress-only message)

### 3b. `tender.add` — modified

**What changed:**
- **Status check relaxed**: Previously required Pending/InProgress. Now also allows Draft: `["Draft", "Pending", "InProgress"]`
- **Active-tender guard**: Before creating the tender, checks if the PR already has ANY tender with status `["open", "closed"]`. If so, throws error.
- **PR history**: After creating the tender, pushes `"tender_created"` history entry on the PR with tender details.

**New error messages:**
- `"Can only create tender for a Draft or active purchasing request"` (replaces old message)
- `"This purchasing request already has an active tender. Close or cancel it before creating a new one."`

### 3c. `purchasingRequest.submit` — modified

**What changed:**
- **Selection validation added**: Before transitioning Draft→Pending, checks `selectionType`:
  - If `"none"`: blocks with error "Please assign stuff or select a tender offer before submitting this request"
  - If `"stuff"`: verifies `stuff` relation actually exists on the PR
  - If `"tender"`: verifies `selectedTenderOfferId` is set

**New error messages:**
- `"Please assign stuff or select a tender offer before submitting this request"`
- `"Stuff selection is incomplete. Please re-assign stuff."`
- `"Tender offer selection is incomplete. Please re-select a tender offer."`

### 3d. `stepApproval.submitDecision` — modified

**What changed:**
- **Deferred tender award**: When the last process step is approved (PR→Completed), checks if `selectionType === "tender"` and the linked tender is still `"closed"`. If so, automatically:
  1. Sets tender status → `"awarded"`
  2. Sets winning offer → `"accepted"`
  3. Sets all other offers on that tender → `"rejected"`
  4. Finds a Stuff matching the winning store + PR's wareModel
  5. Links `stuff` and `store` relations on the PR
  6. Sets `stuffStatus: "assigned"`, `estimatedAmount` (recalculated)
  7. Pushes `"tender_awarded"` history entry
- If the tender is already `"awarded"` or `"cancelled"`, this step is silently skipped (tender status guard)

### 3e. `purchasingRequest.removeFromPurchase` — modified

**What changed:**
- Now resets `selectionType: "none"` when stuff is removed

---

## 4. Complete PR Flow After Changes

```
Draft PR created by anyone
    │
    ├──► UnitHead assigns stuff (addStuff)
    │      selectionType → "stuff", stuff + store linked
    │
    ├──► UnitHead creates tender (tender.add)
    │      Tender status: "open"
    │      ├──► Vendors submit offers (tenderOffer.submit)
    │      ├──► UnitHead closes bidding (tender.close)
    │      │     Tender status: "closed"
    │      │     └──► UnitHead selects winner (selectTenderOffer)
    │      │           selectionType → "tender", NO tender status change
    │      │
    │      └──► UnitHead or cancels (tender.update → "cancelled")
    │
    ├──► UnitHead can SWITCH between stuff & tender:
    │      addStuff → selectionType: "stuff"
    │      selectTenderOffer → selectionType: "tender"
    │      Both selections coexist; selectionType = active one
    │
    └──► Submit PR (submit)
          Requires: selectionType !== "none"
          If stuff: stuff relation must exist
          If tender: selectedTenderOfferId must be set
          PR → "Pending", process starts...
                │
                ├──► Step approvals...
                │
                └──► Final step approved (submitDecision)
                      PR → "Completed"
                      ├──► If selectionType was "tender" & tender is "closed":
                      │     Tender → "awarded"
                      │     Winning offer → "accepted"
                      │     Other offers → "rejected"
                      │     Stuff + Store linked to PR
                      │     stuffStatus → "assigned"
                      │
                      └──► If selectionType was "stuff":
                            Nothing extra (stuff already linked)
```

---

## 5. Frontend Files Already Changed

These files have already been modified as part of this implementation. They should **not** be reverted, but the AI agent should be aware of them:

| File | Changes |
|------|---------|
| `src/app/unit-head/requests/[id]/page.tsx` | Added `selectionType: 1`, `selectedTenderOfferId: 1` to PR get query; passes `purchasingRequestId={id}` to `ActiveTenderCard` |
| `src/app/unit-head/requests/[id]/unit-head-actions.tsx` | *(was already correct — no changes needed for this feature)* |
| `src/components/purchasing/active-tender-card.tsx` | Added `purchasingRequestId: string` prop; passes it to `TenderAwardDialog`; button label → "انتخاب برنده مناقصه" |
| `src/components/purchasing/tender-award-dialog.tsx` | Now imports `selectTenderOffer` instead of `award`; calls `selectTenderOffer({ _id: purchasingRequestId, tenderOfferId })` instead of `award({ _id: tenderId, winningOfferId })`; accepts `purchasingRequestId: string` prop; dialog label → "انتخاب برنده مناقصه"; success toast → "برنده مناقصه با موفقیت انتخاب شد." |
| `src/components/purchasing/submit-pr-dialog.tsx` | Added Persian error message for: `"Please assign stuff or select a tender offer"` → `"لطفاً ابتدا کالا تخصیص دهید یا از طریق مناقصه پیشنهاد انتخاب کنید"` |
| `src/app/actions/purchasingRequest/selectTenderOffer.ts` | **(NEW FILE)** Server action for `purchasingRequest.selectTenderOffer` act |

---

## 6. Frontend Files That Need Changes

### 6.1. Remove debug logs from page.tsx

**File:** `src/app/unit-head/requests/[id]/page.tsx`

There are debug `console.log` / `console.group` / `console.info` statements (lines ~113-126) that should be removed:

```typescript
/*
 * @LOG @DEBUG @INFO
 * This log written by ::==> {{ `` }}
 *
 * Please remove your log after debugging
 */
console.log(" ============= ");
console.group("prRes ------ ");
console.log();
console.info({ prRes }, " ------ ");
console.log();
console.groupEnd();
console.log(" ============= ");
```

### 6.2. Regenerate type declarations

**Run:** `deno task bc-dev` in the `back/` directory to regenerate `front/src/types/declarations/selectInp.ts`

This will add TypeScript types for:
- `selectionType` and `selectedTenderOfferId` in `purchasingRequestSchema`
- `selectTenderOffer` and `removeTenderSelection` in the `ReqType["main"]["purchasingRequest"]` tree
- `tender_created`, `tender_offer_selected`, `tender_awarded`, `tender_offer_removed` in history action types

After regeneration, the new server action file (`selectTenderOffer.ts`) will have proper TypeScript typing for its parameters.

### 6.3. Add `selectionType` display to PR detail page

**File:** `src/app/unit-head/requests/[id]/page.tsx`

Add a visual indicator showing the current selection type. For example, in the sidebar info section near line 524 (where status is shown), add:

```tsx
{pr.selectionType && pr.selectionType !== "none" && (
  <div>
    <p className="text-xs text-fog">نحوه تأمین</p>
    <p className="text-moonlight">
      {pr.selectionType === "stuff"
        ? "تخصیص کالا"
        : pr.selectionType === "tender"
          ? "مناقصه"
          : "—"}
    </p>
  </div>
)}
```

### 6.4. Add `selectionType` to the admin PR detail page

**File:** `src/app/admin/purchasing-requests/[id]/purchasing-request-detail-client.tsx`

Add `selectionType: 1` to the PR get query and display it similarly to the unit-head page.

### 6.5. Add `selectionType` / `selectedTenderOfferId` to draft listing

**File:** `src/app/unit-head/requests/drafts/drafts-client.tsx`

Consider showing a badge or icon indicating whether each draft PR has stuff assigned or a tender offer selected, so the UnitHead knows which draft PRs are "ready to submit" vs still needing a selection.

### 6.6. Consider a `removeTenderSelection` button in the UI

**File:** `src/app/unit-head/requests/[id]/page.tsx` (or `unit-head-actions.tsx`)

When `selectionType === "tender"`, consider showing a button to clear the tender selection (calling `removeTenderSelection` action). Similarly, when `selectionType === "stuff"`, the existing `removeFromPurchase` button should be visible (already exists — part of the remove flow).

Create a new server action file:
**File:** `src/app/actions/purchasingRequest/removeTenderSelection.ts`
```typescript
"use server";
import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const removeTenderSelection = async (
  data: ReqType["main"]["purchasingRequest"]["removeTenderSelection"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["removeTenderSelection"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "removeTenderSelection",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, selectionType: 1, selectedTenderOfferId: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در لغو انتخاب مناقصه" },
    };
  }
};
```

### 6.7. Handle new history types in `HistoryTimeline`

**File:** `src/components/purchasing/history-timeline.tsx`

Add display/handling for these new history action values:
- `"tender_created"` — display "مناقصه ایجاد شد" with tender title, deadline
- `"tender_offer_selected"` — display "پیشنهاد مناقصه انتخاب شد" with store name, offer price
- `"tender_awarded"` — display "مناقصه اعطا شد" with store name, amount
- `"tender_offer_removed"` — display "انتخاب مناقصه لغو شد"

### 6.8. Handle `tender.add` error messages in `TenderCreateDialog`

**File:** `src/components/purchasing/tender-create-dialog.tsx`

The `handleCreate` function's error handling should display specific messages for:
- `"This purchasing request already has an active tender"` → "این درخواست خرید مناقصه فعال دارد. ابتدا مناقصه قبلی را تعیین تکلیف کنید."

### 6.9. Fix `completedTender` detection in page.tsx

**File:** `src/app/unit-head/requests/[id]/page.tsx`

Line 246 currently reads:
```typescript
const completedTender = tenders.find((t: any) => t.status === "awarded" || t.status === "closed")
```

In the new flow, a tender might be `"closed"` (bidding closed) without being `"awarded"` yet. The `hasCompletedTender` prop (which controls whether the "ایجاد مناقصه جدید" button shows) should also consider a tender that has a selected offer as "completed" (no new tender should be created). However, the backend already blocks new tenders on the same PR if any tender is `["open", "closed"]`, so the frontend guard is just UX polish.

Consider changing the logic to:
```typescript
const tenderWithSelection = hasSelectionType("tender"); // derived from pr.selectionType
const hasActiveTenderOrSelected = activeTender || completedTender || tenderWithSelection;
```

Or just leave it as-is — the backend will reject if there's an active tender.

---

## 7. API Action Reference Summary

### New server actions to create:

| Action file | Backend act | Parameters |
|---|---|---|
| `src/app/actions/purchasingRequest/selectTenderOffer.ts` | `purchasingRequest.selectTenderOffer` | `{ _id: prId, tenderOfferId }` |
| `src/app/actions/purchasingRequest/removeTenderSelection.ts` | `purchasingRequest.removeTenderSelection` | `{ _id: prId }` |

### Modified server actions (already handled):

| Action file | Backend act | What changed |
|---|---|---|
| `src/app/actions/purchasingRequest/addStuff.ts` | `purchasingRequest.addStuff` | No change needed — parameters same, backend now allows Draft |
| `src/app/actions/purchasingRequest/submit.ts` | `purchasingRequest.submit` | No change needed — parameters same, backend now validates selection |
| `src/app/actions/tender/add.ts` | `tender.add` | No change needed — parameters same, backend now allows Draft + checks active tender |
| `src/app/actions/tender/close.ts` | `tender.close` | No change needed |
| `src/app/actions/tender/award.ts` | `tender.award` | **Still exists** for admin direct use, but unitHead should use `selectTenderOffer` instead |
| `src/app/actions/stepApproval/submitDecision.ts` | `stepApproval.submitDecision` | No change needed — backend auto-awards tenders on final approval |

---

## 8. Error Message Map (English → Persian)

### `purchasingRequest.addStuff`

| Backend error | Persian message |
|---|---|
| `"Can only add stuff to a Draft or active purchasing request"` | "تنها می‌توانید به درخواست‌های پیش‌نویس یا در حال انجام کالا تخصیص دهید" |

### `purchasingRequest.selectTenderOffer`

| Backend error | Persian message |
|---|---|
| `"Tender offer not found"` | "پیشنهاد مناقصه یافت نشد" |
| `"Only submitted offers can be selected"` | "فقط پیشنهادهای ارسال شده قابل انتخاب هستند" |
| `"This tender offer does not belong to this purchasing request"` | "این پیشنهاد متعلق به این درخواست خرید نیست" |
| `"Tender must be closed before selecting a winner"` | "برای انتخاب برنده، ابتدا مناقصه را ببندید" |

### `tender.add`

| Backend error | Persian message |
|---|---|
| `"Can only create tender for a Draft or active purchasing request"` | "تنها می‌توانید برای درخواست‌های پیش‌نویس یا فعال مناقصه ایجاد کنید" |
| `"This purchasing request already has an active tender..."` | "این درخواست خرید مناقصه فعال دارد. ابتدا مناقصه قبلی را تعیین تکلیف کنید." |

### `purchasingRequest.submit`

| Backend error | Persian message |
|---|---|
| `"Please assign stuff or select a tender offer before submitting this request"` | "لطفاً ابتدا کالا تخصیص دهید یا از طریق مناقصه پیشنهاد انتخاب کنید" |
| `"Stuff selection is incomplete..."` | "انتخاب کالا ناقص است. لطفاً مجدداً کالا تخصیص دهید." |
| `"Tender offer selection is incomplete..."` | "انتخاب مناقصه ناقص است. لطفاً مجدداً پیشنهاد مناقصه را انتخاب کنید." |

---

## 9. Testing Checklist

After implementing, verify:

- [ ] UnitHead can `addStuff` on a Draft PR (not blocked)
- [ ] UnitHead can create a tender on a Draft PR
- [ ] Creating a second tender on the same PR (while first is open/closed) is blocked
- [ ] UnitHead can `selectTenderOffer` on a closed tender — tender stays `"closed"`
- [ ] After selecting tender offer, PR detail shows `selectionType: "tender"`
- [ ] Switching between stuff and tender updates `selectionType`
- [ ] Submitting a Draft PR without any selection shows the error message
- [ ] Submitting a Draft PR with stuff assigned succeeds
- [ ] Submitting a Draft PR with tender offer selected succeeds
- [ ] After all approval steps complete, the tender is automatically awarded
- [ ] Winning offer → `"accepted"`, other offers → `"rejected"`
- [ ] `stuffStatus` → `"assigned"`, `estimatedAmount` is set
- [ ] History entries: `tender_created`, `tender_offer_selected`, `tender_awarded`
- [ ] Removing stuff clears `selectionType`
- [ ] `removeTenderSelection` clears selectedTenderOfferId
- [ ] Admin can still directly use `tender.award` (bypass flow)
