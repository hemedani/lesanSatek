# Plan: UnitHead Stuff Assignment + Tender Selection on Draft PRs

## Overview

Allow UnitHead to assign stuff or select a tender offer while PR is still in `Draft` status.
Enforce that at least one selection must exist before the PR can be submitted (Draft → Pending).
Defer the actual tender award (status change, stuff linking) to the final approval step.

---

## 1. Backend Model — `back/models/purchasingRequest.ts`

Add two new pure fields to `purchasingRequest_pure`:

```typescript
selectionType: defaulted(string(), "none"),       // "none" | "stuff" | "tender"
selectedTenderOfferId: optional(string()),          // ObjectId of the chosen TenderOffer
```

Insert them right after `stuffStatus`:

```typescript
stuffStatus: defaulted(string(), "none"),
selectionType: defaulted(string(), "none"),          // <-- NEW
selectedTenderOfferId: optional(string()),           // <-- NEW
history: defaulted(
```

---

## 2. Backend — Modify `addStuff.fn.ts`

**File:** `back/src/purchasingRequest/addStuff/addStuff.fn.ts`

### 2a. Allow Draft in status validation

Change line 29 from:
```typescript
if (!["Pending", "InProgress"].includes(pr.status as string))
```
to:
```typescript
if (!["Draft", "Pending", "InProgress"].includes(pr.status as string))
```

### 2b. Set `selectionType: "stuff"` in the `$set` update

Change the first `findOneAndUpdate` call to also set `selectionType`:

```typescript
await purchasingRequest.findOneAndUpdate({
  filter: { _id: prId },
  update: {
    $set: {
      stuffStatus: "assigned",
      selectionType: "stuff",
      estimatedAmount,
      updatedAt: now,
    },
  },
  projection: { _id: 1 },
});
```

### 2c. Enrich the history entry

Replace the minimal `details` object:
```typescript
details: {
  stuffId,
  estimatedAmount,
},
```
with a comprehensive one:
```typescript
details: {
  stuffId,
  storeId: store._id?.toString(),
  storeName: store.name,
  unitPrice,
  pricingMode: s.hasAbsolutePrice ? "absolute" : s.pricePercentage ? "percentage" : "base",
  quantity,
  estimatedAmount,
},
```

---

## 3. Backend — New Action: `purchasingRequest.selectTenderOffer`

Create three new files:

### 3a. `back/src/purchasingRequest/selectTenderOffer/mod.ts`

```typescript
import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { selectTenderOfferFn } from "./selectTenderOffer.fn.ts";
import { selectTenderOfferValidator } from "./selectTenderOffer.val.ts";

export const selectTenderOfferSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: selectTenderOfferFn,
    actName: "selectTenderOffer",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin", "OrgHead", "UnitHead"] },
      ]),
    ],
    validator: selectTenderOfferValidator(),
  });
```

### 3b. `back/src/purchasingRequest/selectTenderOffer/selectTenderOffer.val.ts`

```typescript
import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const selectTenderOfferValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      tenderOfferId: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
```

### 3c. `back/src/purchasingRequest/selectTenderOffer/selectTenderOffer.fn.ts`

```typescript
import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, tenderOffer, tender, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const selectTenderOfferFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id, tenderOfferId } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );
  const now = new Date();
  const prId = new ObjectId(_id as string);

  // 1. Fetch PR
  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: {
      _id: 1, status: 1, quantity: 1,
      wareModel: { _id: 1, name: 1, enName: 1 },
    },
  }) as Record<string, unknown>;

  if (!pr) { throwError("Purchasing request not found"); return; }
  if (!["Draft", "Pending", "InProgress"].includes(pr.status as string)) {
    throwError("Can only select a tender offer for a Draft/Pending/InProgress request");
    return;
  }

  // 2. Fetch the TenderOffer with its linked Tender + Store
  const offerDocs = await tenderOffer.aggregation({
    pipeline: [
      { $match: { _id: new ObjectId(tenderOfferId as string) } },
      { $limit: 1 },
    ],
    projection: {
      _id: 1, status: 1, price: 1, deliveryTime: 1, paymentTerms: 1,
      tender: { _id: 1, title: 1, status: 1 },
      store: { _id: 1, name: 1 },
    },
  }).toArray();

  if (offerDocs.length === 0) { throwError("Tender offer not found"); return; }
  const offer = offerDocs[0] as Record<string, unknown>;

  if (offer.status !== "submitted") {
    throwError("Only submitted offers can be selected");
    return;
  }

  // 3. Validate the tender is linked to this PR
  const linkedTender = offer.tender as Record<string, unknown> | undefined;
  if (!linkedTender || !linkedTender._id) {
    throwError("Tender offer has no linked tender");
    return;
  }

  // Verify the tender's purchasingRequest matches our PR
  const tenderDocs = await tender.aggregation({
    pipeline: [
      { $match: { _id: linkedTender._id as ObjectId } },
      { $limit: 1 },
    ],
    projection: {
      _id: 1, status: 1, title: 1,
      purchasingRequest: { _id: 1 },
    },
  }).toArray();

  if (tenderDocs.length === 0) { throwError("Linked tender not found"); return; }
  const t = tenderDocs[0] as Record<string, unknown>;

  const tenderPrId = (t.purchasingRequest as Record<string, unknown>)?._id?.toString();
  if (tenderPrId !== _id) {
    throwError("This tender offer does not belong to this purchasing request");
    return;
  }

  if (t.status !== "closed") {
    throwError("Tender must be closed before selecting a winner");
    return;
  }

  // 4. Calculate estimated amount
  const quantity = pr.quantity as number || 0;
  const offerPrice = offer.price as number || 0;
  const estimatedAmount = Math.round(offerPrice * quantity * 100) / 100;

  const offerStore = offer.store as Record<string, unknown> | undefined;
  const prWareModel = pr.wareModel as Record<string, unknown> | undefined;

  // 5. Update PR — set selectionType, selectedTenderOfferId, estimatedAmount
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        selectionType: "tender",
        selectedTenderOfferId: tenderOfferId,
        estimatedAmount,
        updatedAt: now,
      },
    },
    projection: { _id: 1 },
  });

  // 6. Push comprehensive history
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "tender_offer_selected",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              }
              : { id: "", name: "" },
          },
          details: {
            tenderId: linkedTender._id.toString(),
            tenderTitle: t.title,
            tenderOfferId,
            offerPrice,
            offerDeliveryTime: offer.deliveryTime,
            offerPaymentTerms: offer.paymentTerms,
            storeId: offerStore?._id?.toString(),
            storeName: offerStore?.name,
            wareModelId: prWareModel?._id?.toString(),
            wareModelName: prWareModel?.name,
            quantity,
            estimatedAmount,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({ filters: { _id: prId }, projection: get });
};
```

### 3d. Register in `back/src/purchasingRequest/mod.ts`

Add import:
```typescript
import { selectTenderOfferSetup } from "./selectTenderOffer/mod.ts";
```

Add call inside `purchasingRequestSetup()`:
```typescript
selectTenderOfferSetup();
```

---

## 4. Backend — New Action: `purchasingRequest.removeTenderSelection`

Three new files mirroring `selectTenderOffer` but for clearing the selection.

### 4a. `back/src/purchasingRequest/removeTenderSelection/mod.ts`

```typescript
import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { removeTenderSelectionFn } from "./removeTenderSelection.fn.ts";
import { removeTenderSelectionValidator } from "./removeTenderSelection.val.ts";

export const removeTenderSelectionSetup = () =>
  coreApp.acts.setAct({
    schema: "purchasingRequest",
    fn: removeTenderSelectionFn,
    actName: "removeTenderSelection",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin", "OrgHead", "UnitHead"] },
      ]),
    ],
    validator: removeTenderSelectionValidator(),
  });
```

### 4b. `back/src/purchasingRequest/removeTenderSelection/removeTenderSelection.val.ts`

```typescript
import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const removeTenderSelectionValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
```

### 4c. `back/src/purchasingRequest/removeTenderSelection/removeTenderSelection.fn.ts`

```typescript
import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const removeTenderSelectionFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, _id } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );
  const now = new Date();
  const prId = new ObjectId(_id as string);

  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: { _id: 1, status: 1, selectionType: 1, selectedTenderOfferId: 1 },
  }) as Record<string, unknown>;

  if (!pr) { throw new Error("Purchasing request not found"); }

  if (pr.selectionType !== "tender") {
    throw new Error("No tender offer is currently selected");
  }

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        selectionType: "none",
        updatedAt: now,
      },
      $unset: { selectedTenderOfferId: "" },
    },
    projection: { _id: 1 },
  });

  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $push: {
        history: {
          action: "tender_offer_removed",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              }
              : { id: "", name: "" },
          },
          details: {
            previousTenderOfferId: pr.selectedTenderOfferId,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({ filters: { _id: prId }, projection: get });
};
```

### 4d. Register in `back/src/purchasingRequest/mod.ts`

Add import and call similar to `selectTenderOffer`.

**Also update** `removeFromPurchase.fn.ts` to reset `selectionType` to `"none"` when the stuff is removed (add `selectionType: "none"` to the `$set` in its first `findOneAndUpdate`).

---

## 5. Backend — Modify `tender.add.fn.ts`

**File:** `back/src/tender/add/add.fn.ts`

### 5a. Allow Draft in status validation

Change:
```typescript
if (!["Pending", "InProgress"].includes(pr.status as string))
```
to:
```typescript
if (!["Draft", "Pending", "InProgress"].includes(pr.status as string))
```

### 5b. Check for active tender on the same PR

After the status check, before creating the tender, add:

```typescript
// Check: no active tender already exists for this PR
const existingActiveTender = await tender.aggregation({
  pipeline: [
    {
      $match: {
        "purchasingRequest._id": new ObjectId(purchasingRequestId as string),
        status: { $in: ["open", "closed"] },
      },
    },
    { $limit: 1 },
  ],
  projection: { _id: 1, title: 1, status: 1 },
}).toArray();

if (existingActiveTender.length > 0) {
  throwError(
    "This purchasing request already has an active tender. Close or cancel it before creating a new one.",
  );
}
```

### 5c. Push comprehensive history entry on the PR

After the `tender.insertOne()` call succeeds, get the insert result's `_id` and push history:

```typescript
// After the tender is created, push history on the PR
const createdTender = result as Record<string, unknown>;
const tenderId = createdTender._id?.toString();

await purchasingRequest.findOneAndUpdate({
  filter: { _id: new ObjectId(purchasingRequestId as string) },
  update: {
    $push: {
      history: {
        action: "tender_created",
        performed: {
          by: user._id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          at: now,
          role: activeRole
            ? {
              id: activeRole.roleId,
              name: activeRole.name,
              scopeType: activeRole.scopeType,
              scopeId: activeRole.scopeId,
            }
            : { id: "", name: "" },
        },
        details: {
          tenderId,
          title: rest.title,
          deadline: rest.deadline,
          status: "open",
        },
      },
    },
  },
  projection: { _id: 1 },
});
```

---

## 6. Backend — Modify `submit.fn.ts`

**File:** `back/src/purchasingRequest/submit/submit.fn.ts`

Add a **selection validation step** after the existing Draft-status check and before the process resolution (around line 56).

Fetch PR with selection fields:
```typescript
// 2.5 Validate that a selection has been made
const prForSelection = await purchasingRequest.findOne({
  filters: { _id: prId },
  projection: { _id: 1, selectionType: 1, stuff: { _id: 1 }, selectedTenderOfferId: 1 },
}) as Record<string, unknown>;

const selectionType = prForSelection?.selectionType as string || "none";

if (selectionType === "none") {
  throwError(
    "Please assign stuff or select a tender offer before submitting this request",
  );
  return;
}

if (selectionType === "stuff") {
  const prStuff = prForSelection?.stuff as Record<string, unknown> | undefined;
  if (!prStuff?._id) {
    throwError("Stuff selection is incomplete. Please re-assign stuff.");
    return;
  }
}

if (selectionType === "tender") {
  if (!prForSelection?.selectedTenderOfferId) {
    throwError("Tender offer selection is incomplete. Please re-select a tender offer.");
    return;
  }
}
```

(Add `selectionType: 1` and `selectedTenderOfferId: 1` to the projection in the initial `findOne` too, so we can reuse the same fetch, or do a second fetch — either way works.)

---

## 7. Backend — Modify `submitDecision.fn.ts`

**File:** `back/src/stepApproval/submitDecision/submitDecision.fn.ts`

### 7a. Fetch additional PR fields needed for deferred award

In the initial PR aggregation (around line 36), add to the projection:
```
selectionType: 1,
selectedTenderOfferId: 1,
quantity: 1,
wareModel: { _id: 1, name: 1, enName: 1 },
```

### 7b. Add deferred award logic in the "last step approved" branch

Inside the `else` block at line 240 (where `status: "Completed"` is set), **after** the existing code:

```typescript
// --- Deferred Tender Award ---
// If the PR used the tender path and has a selected offer, award the tender now
if (req.selectionType === "tender" && req.selectedTenderOfferId) {
  const selectedTenderOfferId = req.selectedTenderOfferId as string;
  const prQuantity = req.quantity as number || 0;
  const prWareModel = req.wareModel as Record<string, unknown> | undefined;
  const wareModelId = prWareModel?._id?.toString();

  // Fetch the winning offer + its tender
  const offerDocs = await tenderOffer.aggregation({
    pipeline: [{ $match: { _id: new ObjectId(selectedTenderOfferId) } }, { $limit: 1 }],
    projection: {
      _id: 1, price: 1, store: { _id: 1, name: 1 },
      tender: { _id: 1, title: 1, status: 1 },
    },
  }).toArray();

  if (offerDocs.length > 0) {
    const winningOffer = offerDocs[0] as Record<string, unknown>;
    const tenderRef = winningOffer.tender as Record<string, unknown> | undefined;
    const tenderId = tenderRef?._id as ObjectId;
    const winningStoreId = (winningOffer.store as Record<string, unknown>)?._id?.toString();
    const offerPrice = winningOffer.price as number || 0;

    // Set tender status to "awarded"
    await tender.findOneAndUpdate({
      filter: { _id: tenderId },
      update: { $set: { status: "awarded", updatedAt: now } },
      projection: { _id: 1 },
    });

    // Accept winning offer
    await tenderOffer.findOneAndUpdate({
      filter: { _id: new ObjectId(selectedTenderOfferId) },
      update: { $set: { status: "accepted", updatedAt: now } },
      projection: { _id: 1 },
    });

    // Reject all other offers on this tender
    const otherOffers = await tenderOffer.aggregation({
      pipeline: [
        { $match: { "tender._id": tenderId, _id: { $ne: new ObjectId(selectedTenderOfferId) } } },
      ],
      projection: { _id: 1 },
    }).toArray();

    for (const o of otherOffers) {
      await tenderOffer.findOneAndUpdate({
        filter: { _id: o._id as ObjectId },
        update: { $set: { status: "rejected", updatedAt: now } },
        projection: { _id: 1 },
      });
    }

    // Find a Stuff matching winning store + PR's wareModel
    let stuffId: string | undefined;
    if (winningStoreId && wareModelId) {
      const stuffDocs = await stuff.aggregation({
        pipeline: [
          { $match: { "store._id": new ObjectId(winningStoreId), "wareModel._id": new ObjectId(wareModelId) } },
          { $limit: 1 },
        ],
        projection: { _id: 1 },
      }).toArray();
      if (stuffDocs.length > 0) {
        stuffId = stuffDocs[0]._id.toString();
      }
    }

    const estimatedAmount = Math.round(offerPrice * prQuantity * 100) / 100;

    // Link stuff + store on the PR
    const prRel: Record<string, unknown> = {};
    if (stuffId) {
      prRel.stuff = { _ids: new ObjectId(stuffId), relatedRelations: { purchasingRequests: true } };
    }
    if (winningStoreId) {
      prRel.store = { _ids: new ObjectId(winningStoreId), relatedRelations: { purchasingRequests: true } };
    }
    if (Object.keys(prRel).length > 0) {
      await purchasingRequest.addRelation({
        filters: { _id: prId },
        relations: prRel,
        projection: { _id: 1 },
        replace: true,
      });
    }

    await purchasingRequest.findOneAndUpdate({
      filter: { _id: prId },
      update: {
        $set: { stuffStatus: "assigned", estimatedAmount, updatedAt: now },
        $push: {
          history: {
            action: "tender_awarded",
            performed: {
              by: user._id.toString(),
              name: `${user.first_name} ${user.last_name}`,
              at: now,
              role: activeRole
                ? { id: activeRole.roleId, name: activeRole.name, scopeType: activeRole.scopeType, scopeId: activeRole.scopeId }
                : { id: "", name: "" },
            },
            details: {
              tenderId: tenderId.toString(),
              tenderOfferId: selectedTenderOfferId,
              offerPrice,
              storeId: winningStoreId,
              stuffId,
              wareModelId,
              quantity: prQuantity,
              estimatedAmount,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }
}
```

You'll also need to add imports at the top:
```typescript
import { tender, tenderOffer, stuff } from "../../../mod.ts";
```

---

## 8. Frontend — New Server Action

**File:** `front/src/app/actions/purchasingRequest/selectTenderOffer.ts`

```typescript
"use server";
import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const selectTenderOffer = async (
  data: ReqType["main"]["purchasingRequest"]["selectTenderOffer"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["selectTenderOffer"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "selectTenderOffer",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, selectionType: 1, selectedTenderOfferId: 1, estimatedAmount: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در انتخاب پیشنهاد مناقصه" },
    };
  }
};
```

---

## 9. Frontend — Modify `tender-award-dialog.tsx`

**File:** `front/src/components/purchasing/tender-award-dialog.tsx`

- Change import from `award` to `selectTenderOffer`
- Change the call from `award(...)` to `selectTenderOffer({ _id: tenderId, tenderOfferId: selectedOfferId }, ...)`
- Change button label from "اعطای مناقصه" to "انتخاب برنده مناقصه"
- Change success message from "مناقصه با موفقیت اعطا شد" to "برنده مناقصه با موفقیت انتخاب شد"
- Change dialog title from "اعطای مناقصه" to "انتخاب برنده مناقصه"

---

## 10. Frontend — Modify `active-tender-card.tsx`

**File:** `front/src/components/purchasing/active-tender-card.tsx`

- Change button label from "انتخاب برنده و اعطای مناقصه" to "انتخاب برنده مناقصه"

---

## 11. Frontend — Modify `submit-pr-dialog.tsx`

**File:** `front/src/components/purchasing/submit-pr-dialog.tsx`

Add new error-handling branch for the "Please assign stuff or select a tender offer" error message:

```typescript
} else if (msg.includes("Please assign stuff or select a tender offer")) {
  toast.error("لطفاً ابتدا کالا تخصیص دهید یا از طریق مناقصه پیشنهاد انتخاب کنید");
```

---

## Summary of All Files Changed/Created

| # | Action | File Path |
|---|--------|-----------|
| 1 | **Edit** | `back/models/purchasingRequest.ts` — add `selectionType`, `selectedTenderOfferId` |
| 2 | **Edit** | `back/src/purchasingRequest/addStuff/addStuff.fn.ts` — allow Draft, set selectionType, richer history |
| 3 | **Create** | `back/src/purchasingRequest/selectTenderOffer/mod.ts` |
| 4 | **Create** | `back/src/purchasingRequest/selectTenderOffer/selectTenderOffer.val.ts` |
| 5 | **Create** | `back/src/purchasingRequest/selectTenderOffer/selectTenderOffer.fn.ts` |
| 6 | **Edit** | `back/src/purchasingRequest/mod.ts` — register new actions |
| 7 | **Create** | `back/src/purchasingRequest/removeTenderSelection/mod.ts` |
| 8 | **Create** | `back/src/purchasingRequest/removeTenderSelection/removeTenderSelection.val.ts` |
| 9 | **Create** | `back/src/purchasingRequest/removeTenderSelection/removeTenderSelection.fn.ts` |
| 10 | **Edit** | `back/src/purchasingRequest/removeFromPurchase/removeFromPurchase.fn.ts` — reset selectionType |
| 11 | **Edit** | `back/src/tender/add/add.fn.ts` — allow Draft, active-tender check, PR history |
| 12 | **Edit** | `back/src/purchasingRequest/submit/submit.fn.ts` — validate selectionType |
| 13 | **Edit** | `back/src/stepApproval/submitDecision/submitDecision.fn.ts` — deferred tender award |
| 14 | **Create** | `front/src/app/actions/purchasingRequest/selectTenderOffer.ts` |
| 15 | **Edit** | `front/src/components/purchasing/tender-award-dialog.tsx` — use selectTenderOffer |
| 16 | **Edit** | `front/src/components/purchasing/active-tender-card.tsx` — button label |
| 17 | **Edit** | `front/src/components/purchasing/submit-pr-dialog.tsx` — error message |
