# StoreHead Role — Frontend Implementation Plan

> **Based on:** `new_store_head_features.md`  
> **Backend scope:** `stuff`, `tender`, `tenderOffer`, `purchasingRequest` modules  
> **Goal:** A dedicated `/storehead/` panel (patterned after the `/vendor/` panel) for StoreHead users.

---

## Overview

A **dedicated `/storehead/` panel** replaces the current behavior of redirecting StoreHead to `/admin/stores`. It provides a focused, role-specific experience for:

1. **Stuff (Inventory)** — Full CRUD on their own store's stuff
2. **Tenders** — Browse all active tenders (read-only)
3. **Tender Offers** — Submit offers and view their own offers
4. **Purchasing Requests** — View PRs assigned to their store, update stuffStatus
5. **Store Profile** — Edit their own store's profile

---

## Phases

### Phase 1 — Server Action & Type Updates

| Task | Files | Description |
|------|-------|-------------|
| 1a | `src/app/actions/purchasingRequest/updateStuffStatus.ts` | New server action calling `purchasingRequest.updateStuffStatus` |
| 1b | `src/stores/authStore.ts` | Add `managedStore` to `User` interface (already fetched in `getMe`) |

### Phase 2 — Panel Infrastructure

| Task | Files | Description |
|------|-------|-------------|
| 2a | `src/app/storehead/layout.tsx` | `<PanelGuard requiredRoles={["StoreHead"]}>` + `<PanelLayout>` |
| 2b | `src/app/storehead/loading.tsx` | Skeleton loaders |
| 2c | `src/app/storehead/error.tsx` | Error boundary with reset |

### Phase 3 — Dashboard

| Task | Files | Description |
|------|-------|-------------|
| 3a | `src/app/storehead/page.tsx` | Stats overview + quick-action buttons |

### Phase 4 — Stuff Management

| Task | Files | Description |
|------|-------|-------------|
| 4a | `src/app/storehead/stuff/page.tsx` | DataTable of their store's stuff |
| 4b | `src/app/storehead/stuff/add/page.tsx` | Add stuff form (auto-injects `storeId` from `scopeId`) |
| 4c | `src/app/storehead/stuff/[id]/page.tsx` | Edit/delete stuff |

### Phase 5 — Tenders & Offers

| Task | Files | Description |
|------|-------|-------------|
| 5a | `src/app/storehead/tenders/page.tsx` | Browse open tenders with "ثبت پیشنهاد" button |
| 5b | `src/app/storehead/tenders/[id]/offer/page.tsx` | Offer submission form |
| 5c | `src/app/storehead/my-offers/page.tsx` | View submitted offers (DataTable) |

### Phase 6 — Purchasing Requests

| Task | Files | Description |
|------|-------|-------------|
| 6a | `src/app/storehead/purchasing-requests/page.tsx` | PRs assigned to their store |
| 6b | `src/app/storehead/purchasing-requests/[id]/page.tsx` | PR detail + stuff status stepper |

### Phase 7 — Store Profile

| Task | Files | Description |
|------|-------|-------------|
| 7a | `src/app/storehead/store/page.tsx` | Edit their own store's profile |

### Phase 8 — Role Router

| Task | Files | Description |
|------|-------|-------------|
| 8a | `src/lib/roles.ts` | Change `getDefaultPanel` StoreHead redirect → `/storehead` |
| 8b | `src/lib/roles.ts` | Add StoreHead panel definition |
| 8c | `src/components/layout/admin-sidebar.tsx` | (Optional) Update sidebar for StoreHead fallback |

---

## Key Technical Details

| Detail | Approach |
|--------|----------|
| **StoreHead identity** | `activeRole.name === "StoreHead"` + `activeRole.scopeId` = managed store `_id` |
| **Auto-filling storeId** | In `stuff/add`, `tenderOffer/submit`: read `scopeId` from active role, pass as `storeId` |
| **Auto-filtered list views** | `stuff/gets`, `purchasingRequest/gets`, `tenderOffer/gets` — backend handles; no `storeId` param needed |
| **Ownership checks** | `stuff/update`, `stuff/remove`, `updateStuffStatus` — backend checks; frontend just passes `_id` |
| **Tender submission** | StoreHead does NOT need `canRespondToTender` feature |
| **Stuff status enum** | New values: `assigned` → `ready_to_ship` → `shipped` → `delivered` |
| **Panel pattern** | Follow `/vendor/` panel pattern: `PanelLayout` (no sidebar), server component pages, DataTable |
