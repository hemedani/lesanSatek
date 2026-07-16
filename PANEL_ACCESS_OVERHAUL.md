# Panel Access Control Overhaul

## Overview

Restructure the frontend panel system so each user role is strictly isolated to its own panel, and every server action sends the required `activeRoleId` to the backend. Eliminate the super-user bypass, unify role/panel selection into one dropdown, and extend backend write permissions for scoped roles.

## Status Legend

- `[ ]` — pending
- `[→]` — in progress
- `[✓]` — completed

---

## Phase 1 — Fix Server Actions to Send `activeRoleId` [✓]

**Already implemented.** All 123 write action files already use `{ ...data, activeRoleId }` via `getActiveRoleId()` from `@/lib/auth`.

### 1.1 Helper utility created

**File**: `src/lib/server-action.ts` ✓

```ts
import { cookies } from "next/headers"

export async function getServerHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  return { token, activeRoleId }
}

export function withActiveRole<T extends Record<string, unknown>>(
  data: T,
  activeRoleId?: string,
): T & { activeRoleId?: string } {
  if (!activeRoleId) return data
  return { ...data, activeRoleId }
}
```

### 1.2 Update every server action

Every action file under `src/app/actions/` that calls a protected backend endpoint must:

1. Import `getServerHeaders` and `withActiveRole`
2. Read `activeRoleId` from cookies
3. Merge it into the `set` payload

**Pattern for all actions (`add`, `update`, `updateRelations`, `remove`, `submit`, `submitDecision`, etc.):**

```diff
 "use server";
 import { AppApi } from "@/lib/api";
+import { getServerHeaders, withActiveRole } from "@/lib/server-action";
 import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
-import { cookies } from "next/headers";

 export const <actionName> = async (
   data: ReqType["main"]["<model>"]["<action>"]["set"],
   getSelection?: DeepPartial<ReqType["main"]["<model>"]["<action>"]["get"]>
 ) => {
-  const cookieStore = await cookies();
-  const token = cookieStore.get("token")?.value;
+  const { token, activeRoleId } = await getServerHeaders();

   const response = await AppApi(undefined, token).send({
     service: "main",
     model: "<model>",
     act: "<action>",
     details: {
-      set: data,
+      set: withActiveRole(data, activeRoleId),
       get: getSelection || {},
     },
   });

   return response;
 };
```

**Files to update** (all files under `src/app/actions/` that call `AppApi().send`):

| Directory | Action files |
|-----------|-------------|
| `actions/auth/` | `setActiveRole.ts` |
| `actions/organization/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/process/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts`, `activateProcess.ts`, `duplicateProcess.ts` |
| `actions/unit/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/user/` | `addUser.ts`, `updateUser.ts`, `updateUserRelations.ts`, `removeUser.ts` |
| `actions/purchasingRequest/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts`, `submit.ts`, `assignStore.ts`, `warehouseCheck.ts` |
| `actions/stepApproval/` | `add.ts`, `remove.ts`, `submitDecision.ts` |
| `actions/tender/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts`, `award.ts`, `close.ts` |
| `actions/tenderOffer/` | `submit.ts`, `remove.ts` |
| `actions/inventory/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts`, `adjust.ts`, `transfer.ts` |
| `actions/budgetLine/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/budgetAllocation/` | `add.ts`, `remove.ts` |
| `actions/budgetEncumbrance/` | `add.ts`, `convertToSpend.ts`, `release.ts`, `remove.ts` |
| `actions/consumptionRecord/` | `add.ts`, `remove.ts` |
| `actions/goodsReceipt/` | `add.ts`, `update.ts`, `remove.ts` |
| `actions/paymentOrder/` | `add.ts`, `update.ts`, `remove.ts`, `markPaid.ts` |
| `actions/fiscalYear/` | `add.ts`, `update.ts`, `remove.ts`, `close.ts` |
| `actions/store/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/ware/`, `actions/wareClass/`, `actions/wareGroup/`, `actions/wareModel/`, `actions/wareType/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/manufacturer/` | `add.ts`, `update.ts`, `remove.ts` |
| `actions/city/`, `actions/state/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/tag/` | `add.ts`, `update.ts`, `remove.ts` |
| `actions/stuff/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/purchaseOrderItem/` | `add.ts`, `update.ts`, `updateRelations.ts`, `remove.ts` |
| `actions/stockMovement/` | `remove.ts` |

**N/A (read-only, `grantAccess` not enforced for writes):**
- `get.ts`, `gets.ts`, `count.ts` — generally don't need activeRoleId

---

## Phase 2 — Fix Frontend Auth Guards [✓]

### 2.1 Fix `AuthGuard` — add admin role enforcement

**File**: `src/components/auth/auth-guard.tsx`

- After successful `getMe()`, verify user has Manager/Admin/OrgHead role
- If not, redirect to their correct panel (computed via `getDefaultPanel(user)`)
- Remove the fallback that sets `activeRoleId` to `roles[0]` — use the cookie value or let the login flow handle it

### 2.2 Fix `PanelGuard` — remove super-user bypass

**File**: `src/components/auth/panel-guard.tsx`

- Remove `isSuper` check — a Manager must NOT access `/requests` or `/unit-head`
- Authorization = `requiredRoles` match OR `requiredFeatures` match only
- On unauthorized: redirect via `getDefaultPanel(user)`

### 2.3 Fix `middleware.ts` — verify `activeRoleId` cookie for panel routes

**File**: `src/middleware.ts`

- For panel routes, check that `activeRoleId` cookie exists (not just `token`)
- If `activeRoleId` missing but `token` exists → redirect to `/admin` (the first panel will prompt role selection)

### 2.4 Fix `PanelGuard` — remove redundant role fallback

**File**: `src/components/auth/panel-guard.tsx`

- Remove logic that sets `activeRoleId` to `preferredRole` or `roles[0]`
- The activeRoleId is already set from login/auth-guard — PanelGuard should respect it, not override

---

## Phase 3 — Unify Role/Panel Selection UI [✓]

### 3.1 Create unified role-selector component

**File**: `src/components/layout/role-selector.tsx` (new)

- Single dropdown showing all user roles (from `user.roles`)
- Each item shows: role name, scope (if applicable)
- Selecting a role:
  1. Sets `activeRoleId` cookie via client-side `document.cookie`
  2. Sets store via `setActiveRoleId()`
  3. Calls `setActiveRole()` server action (returns `targetPanel`)
  4. Redirects to `targetPanel`
- If user has only 1 role, don't show the dropdown
- If user has 0 roles — redirect to login

### 3.2 Remove `PanelSelector`

**File**: Delete `src/components/layout/panel-selector.tsx`

- Remove all imports of `PanelSelector`
- Remove `<PanelSelector />` from `panel-layout.tsx`

### 3.3 Simplify `UserMenu`

**File**: `src/components/layout/user-menu.tsx`

- Remove the "پنل‌ها" section (panel listing)
- Keep the role section but simplify: show active role name + RoleSelector link
- Keep logout button

### 3.4 Update `PanelLayout`

**File**: `src/components/layout/panel-layout.tsx`

- Replace `<PanelSelector />` with `<RoleSelector />`

### 3.5 Remove `RoleBanner`

**File**: Delete `src/components/layout/role-banner.tsx`

- Remove all imports from admin dashboard page

---

## Phase 4 — Backend: Extend Write Permissions for Scoped Roles [✓]

### 4.1 OrgHead scoped write access

Allow OrgHead (with scope match) to perform these operations within their organization:

| Action | Current | Change |
|--------|---------|--------|
| `organization/update` | Manager, Admin | + OrgHead (scope: org match) |
| `organization/updateRelations` | Manager, Admin | + OrgHead (scope: org match) |
| `organization/remove` | Manager, Admin | + OrgHead (scope: org match) |
| `process/add` | Manager, Admin | + OrgHead (scope: org match) |
| `process/update` | Manager, Admin | + OrgHead (scope: org match) |
| `process/updateRelations` | Manager, Admin | + OrgHead (scope: org match) |
| `process/remove` | Manager, Admin | + OrgHead (scope: org match) |
| `process/activateProcess` | — | + OrgHead (scope: org match) |
| `process/duplicateProcess` | — | + OrgHead (scope: org match) |
| `unit/add` | Manager, Admin | + OrgHead (scope: org match) |
| `unit/update` | Manager, Admin | + OrgHead (scope: org match) |
| `unit/updateRelations` | Manager, Admin | + OrgHead (scope: org match) |
| `unit/remove` | Manager, Admin | + OrgHead (scope: org match) |
| `tender/add` | Manager, Admin | + OrgHead (scope: org match) |
| `tender/award` | Manager, Admin | + OrgHead (scope: org match) |
| `tender/close` | Manager, Admin | + OrgHead (scope: org match) |
| `user/addUser` | Manager, Admin | + OrgHead (scope: org match) |
| `user/updateUser` | Manager, Admin | + OrgHead (scope: org match) |
| `user/updateUserRelations` | Manager, Admin | + OrgHead (scope: org match) |

### 4.2 UnitHead scoped write access

Allow UnitHead (with scope match) within their unit:

| Action | Current | Change |
|--------|---------|--------|
| `stepApproval/submitDecision` | UnitHead (scoped) ✓ | No change |
| `consumptionRecord/add` | Manager, Admin | + UnitHead (scope: unit match) |
| `inventory/update` | Manager, Admin | + UnitHead (scope: unit match) |
| `purchasingRequest/update` | Manager, Admin | + UnitHead (scope: unit match) |
| `purchasingRequest/updateRelations` | Manager, Admin | + UnitHead (scope: unit match) |

### 4.3 Employee scoped write access

| Action | Current | Change |
|--------|---------|--------|
| `purchasingRequest/submit` | Employee ✓ | No change |
| `purchasingRequest/checkStoreAvailability` | Employee ✓, OrgHead, UnitHead | No change |

---

## Phase 5 — Cleanup & Bug Fixes [→] (parts done)

### 5.1 Fix `logout.ts` — also delete `activeRoleId`

```diff
export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("token");
+ cookieStore.delete("activeRoleId");
  return { success: true, body: { message: "با موفقیت خارج شدید" } };
};
```

### 5.2 Fix `setActiveRole.ts` — remove unnecessary `getUser()` call

- Currently re-fetches the user from backend just to determine the panel
- Instead: use a RoleName → PanelPath map (the same as `getPanelForRole` on client)
- The server action just sets the cookie and returns the panel

### 5.3 Handle Ordinary role gracefully

- Ordinary users get redirected to `/ordinary` placeholder
- Create `src/app/ordinary/page.tsx` with a "به زودی" message

### 5.4 Update `PANEL_DEFINITIONS` — remove Ordinary from `/requests`

**File**: `src/lib/roles.ts`

- Remove `"Ordinary"` from `/requests` `requiredRole`
- `/requests` should only require `["Employee"]`
- This prevents Ordinary users from being redirected to `/requests`

---

## Phase 6 — Verification [✓]

### 6.1 TypeScript check
```bash
cd front && pnpm typecheck
```

### 6.2 Build check
```bash
cd front && pnpm build
```

### 6.3 Test scenarios

| Scenario | Expected behavior |
|----------|------------------|
| User with Manager role only | Redirected to `/admin`, cannot access `/requests` |
| User with Employee role only | Redirected to `/requests`, cannot access `/admin` |
| User with UnitHead role only | Redirected to `/unit-head` |
| User with Manager + Employee | Can switch via RoleSelector, redirects to correct panel per role |
| User with canManageBudget | Can access `/finance` |
| User with canRespondToTender | Can access `/vendor` |
| User with Ordinary only | Redirected to `/ordinary` placeholder |
| Unauthenticated user | Redirected to `/login` |
| Submit PR from Employee panel | Backend receives `activeRoleId`, PR created |
| Logout | Both `token` and `activeRoleId` cookies deleted |
| Cross-panel URL paste | Blocked by PanelGuard, redirected to correct panel |

---

## File Change Summary

### New files
- `src/lib/server-action.ts` ✓
- `src/components/layout/role-selector.tsx` ✓
- `src/app/ordinary/page.tsx` ✓

### Modified files (frontend)
- All `add/update/updateRelations/remove/submit/decision` action files — add activeRoleId
- `src/components/auth/auth-guard.tsx`
- `src/components/auth/panel-guard.tsx`
- `src/middleware.ts`
- `src/components/layout/user-menu.tsx`
- `src/components/layout/panel-layout.tsx`
- `src/app/actions/auth/logout.ts`
- `src/app/actions/auth/setActiveRole.ts`
- `src/app/requests/layout.tsx`
- `src/lib/roles.ts`

### Deleted files
- `src/components/layout/panel-selector.tsx` ✓
- `src/components/layout/role-banner.tsx` ✓

### Modified files (backend)
- `back/src/organization/update/mod.ts`
- `back/src/organization/updateRelations/mod.ts`
- `back/src/organization/remove/mod.ts`
- `back/src/process/add/mod.ts`
- `back/src/process/update/mod.ts`
- `back/src/process/updateRelations/mod.ts`
- `back/src/process/remove/mod.ts`
- `back/src/process/activateProcess/mod.ts`
- `back/src/process/duplicateProcess/mod.ts`
- `back/src/unit/add/mod.ts`
- `back/src/unit/update/mod.ts`
- `back/src/unit/updateRelations/mod.ts`
- `back/src/unit/remove/mod.ts`
- `back/src/user/addUser/mod.ts`
- `back/src/user/updateUser/mod.ts`
- `back/src/user/updateUserRelations/mod.ts`
- `back/src/tender/add/mod.ts`
- `back/src/tender/award/mod.ts`
- `back/src/tender/close/mod.ts`
- `back/src/consumptionRecord/add/mod.ts`
- `back/src/inventory/update/mod.ts`
- `back/src/purchasingRequest/update/mod.ts`
- `back/src/purchasingRequest/updateRelations/mod.ts`
