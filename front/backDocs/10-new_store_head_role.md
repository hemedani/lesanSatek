# StoreHead Role — Frontend Implementation Guide

## Overview

A new `StoreHead` role has been added to the backend. This allows users to be designated as the head of a store, giving them permission to view, update, and manage that specific store. This document describes the complete backend implementation so the frontend team can implement the corresponding UI, routing, permission checks, and API calls.

---

## 1. Role Definition

### Backend `role_array` (in `models/user.ts`)

The role now includes `"StoreHead"`:

```
["Manager", "Admin", "OrgHead", "UnitHead", "StoreHead", "Employee", "Ordinary"]
```

### Scope Type

A new scope type `"store"` was added alongside existing `"organization"` and `"unit"`:

```
scopeType: "organization" | "unit" | "store"
```

### Role Object Shape (in `user.roles[]`)

```typescript
{
  roleId: string;      // crypto.randomUUID()
  name: "StoreHead";   // literal
  scopeType: "store";  // required for StoreHead
  scopeId: string;     // the Store._id this user manages
}
```

### User Model (`models/user.ts:82-94`)

- `role_array` updated to include `"StoreHead"`
- `role_scope_type_emums` updated to include `"store"`

---

## 2. Store Model Changes

### Reverse Relation on User (`models/store.ts:119-132`)

The `storeHead` relation on Store now defines `managedStore` as a reverse relation on `User`. This means:

- **Lesan auto-creates** `user.managedStore` as a single optional relation pointing back to `Store`
- The frontend can read `user.managedStore` to get the store that a StoreHead manages

```typescript
// Store side (models/store.ts)
storeHead: {
  schemaName: "user",
  type: "single",
  optional: true,
  relatedRelations: {
    managedStore: {        // ← NEW: auto-creates user.managedStore
      type: "single",
      optional: true,
      relatedRelations: {},
    },
  },
}
```

This means when querying a user, you can include `managedStore` in the projection to get the store they manage.

---

## 3. Action Access Control

### `store.add` — Create Store

**File:** `src/store/add/mod.ts`

```typescript
grantAccess([
  { roles: ["Manager", "Admin"] },
  { roles: ["StoreHead"] },         // ← NEW
])
```

| Role | Can create a store? |
|------|-------------------|
| Manager | ✅ Yes |
| Admin | ✅ Yes |
| StoreHead | ✅ Yes |
| Others | ❌ No |

### `store.update` — Update Store Fields

**File:** `src/store/update/mod.ts`

```typescript
grantAccess([
  { roles: ["Manager", "Admin"] },
  { roles: ["StoreHead"], getScope: (b) => ({
    scopeType: "store",
    scopeId: b?.details?.set?._id,    // ← must match activeRole.scopeId
  })},
])
```

| Role | Can update any store? | Can update own store? |
|------|-----------------------|----------------------|
| Manager | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes |
| StoreHead | ❌ No | ✅ Only if `_id` in request matches their `scopeId` |

**Scope matching logic** (in `utils/grantAccess.ts`):
- `activeRole.scopeType === "store"` and `activeRole.scopeId === store._id` → allowed
- Otherwise → "You cant do this" error

### `store.updateRelations` — Update Store Relations

**File:** `src/store/updateRelations/mod.ts`

Same pattern as `update` — Manager/Admin full access, StoreHead scoped to their own store.

### `store.get` / `store.gets` — Read Stores

**File:** `src/store/get/mod.ts`, `src/store/gets/mod.ts`

All authenticated roles including `StoreHead` can read stores.

### `store.remove` — Delete Store

**Not changed.** Only `["Manager", "Admin"]` — StoreHead **cannot** delete their own store.

---

## 4. addOrRemoveRoles — StoreHead Role Assignment

**File:** `src/user/addOrRemoveRoles/addOrRemoveRoles.fn.ts`

When a `StoreHead` role is added or removed, the backend automatically manages the `store.storeHead` relation:

### On `addRoles` with `{ name: "StoreHead", scopeType: "store", scopeId: "<storeId>" }`:

1. Sets `store.storeHead` to the user via `store.addRelation({ replace: true })`
2. Pushes the role into `user.roles[]`

### On `removeRoles` with `{ name: "StoreHead", scopeType: "store", scopeId: "<storeId>" }`:

1. Fetches the store, verifies the current `storeHead` matches the user
2. Clears `store.storeHead` via `store.removeRelation`
3. Pulls the role from `user.roles[]`

### Example API Call

```json
{
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "<manager-or-admin-roleId>",
      "_id": "<target-user-id>",
      "addRoles": [
        {
          "name": "StoreHead",
          "scopeType": "store",
          "scopeId": "<store-id>"
        }
      ]
    },
    "get": { ... }
  }
}
```

**Access for addOrRemoveRoles:** `["Manager", "Admin"]` or `["OrgHead"]` (scoped to organization).

---

## 5. Frontend Implementation Guide

### 5.1 Regenerate Types

Run `deno task bc-dev` in the `back/` directory. This regenerates `declarations/` which feeds into `front/src/types/declarations/selectInp.ts`.

Key type changes expected:

- `user.roles[].name` enum gains `"StoreHead"`:
  ```typescript
  name: ("Manager" | "Admin" | "OrgHead" | "UnitHead" | "StoreHead" | "Employee" | "Ordinary");
  ```
- `user.roles[].scopeType` enum gains `"store"`:
  ```typescript
  scopeType?: ("organization" | "unit" | "store");
  ```
- `userInp` gains `managedStore` relation field:
  ```typescript
  managedStore?: number | storeInp;     // Optional single relation
  ```
- `storeInp` fields remain unchanged.

### 5.2 Permissions / Role Checking

The frontend already uses pattern like this to find the active role:

```typescript
// From the logged-in user object
const activeRole = user.roles?.find((r) => r.roleId === activeRoleId);
// activeRole.name === "StoreHead"
// activeRole.scopeType === "store"
// activeRole.scopeId === "<some-store-id>"
```

**Use cases for StoreHead permission checks in UI:**

| Scenario | Check |
|----------|-------|
| Show "Edit Store" button | `activeRole.name === "StoreHead" && activeRole.scopeId === store._id` **or** `activeRole.name` is `Manager`/`Admin` |
| Show "Edit Store" for any store | `activeRole.name === "Manager" \|\| activeRole.name === "Admin"` |
| Show "Delete Store" button | Only `Manager` or `Admin` (StoreHead never sees it) |
| Show Store Management nav item | `activeRole.name === "StoreHead" \|\| activeRole.name === "Manager" \|\| activeRole.name === "Admin"` |
| Redirect to StoreHead's own store | If `activeRole.name === "StoreHead"`, load store with `_id = activeRole.scopeId` |
| Show "Add Store" button | `activeRole.name === "Manager" \|\| activeRole.name === "Admin" \|\| activeRole.name === "StoreHead"` |

### 5.3 StoreHead-Specific UI Flows

#### A. StoreHead Dashboard / Store Management Page

- StoreHead should see a dedicated section for managing their store
- The store is identified by `activeRole.scopeId` (which is the Store's `_id`)
- Fetch the store: `get({ _id: activeRole.scopeId })`
- Allow editing name, address, contact, bank info, certificate info, working hours, delivery settings, etc.
- **Not allowed:** Delete store, change `storeHead` relation (those stay Manager/Admin)

#### B. Store Form (Add / Edit)

The `store.add` API accepts:

```json
{
  "act": "store.add",
  "details": {
    "set": {
      "activeRoleId": "...",
      "name": "Store Name",
      "address": "...",
      "contact": "...",
      "storeHeadId": "<user-id>",       // Optional — sets the storeHead relation
      "cityId": "<city-id>",            // Optional
      "stateId": "<state-id>",          // Optional
      "wareTypeIds": ["<wt-id>", ...],  // Optional
      // ... all other store_pure fields
    },
    "get": { ... }
  }
}
```

The `store.update` API accepts:

```json
{
  "act": "store.update",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "<store-id>",
      "name": "Updated Name",
      // ... any other fields to update
    },
    "get": { ... }
  }
}
```

#### C. Store List View

All roles (including StoreHead) can call `store.gets`. If the current user is a StoreHead, you may optionally filter or highlight their own store.

```json
{
  "act": "store.gets",
  "details": {
    "set": {
      "activeRoleId": "...",
      "page": 1,
      "limit": 50
    },
    "get": { ... }
  }
}
```

### 5.4 Navigation / Routing Suggestions

| Route | Access |
|-------|--------|
| `/admin/stores` | Manager, Admin, StoreHead |
| `/admin/stores/add` | Manager, Admin, StoreHead |
| `/admin/stores/[id]` | Manager, Admin, StoreHead (but StoreHead can only edit their own store) |
| `/admin/stores/[id]/edit` | Manager, Admin OR StoreHead where `id === activeRole.scopeId` |

### 5.5 User Management — Assigning StoreHead

The `addOrRemoveRoles` action is used to assign/revoke the StoreHead role. The UI for user management (roles section) should include a "StoreHead" option in the role dropdown.

When "StoreHead" is selected:
- Show a store selector (only stores without an existing StoreHead? Or allow any?)
- The selected store's `_id` becomes the `scopeId`
- The `scopeType` is automatically `"store"`

```json
{
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "<admin-active-role-id>",
      "_id": "<target-user-id>",
      "addRoles": [
        {
          "name": "StoreHead",
          "scopeType": "store",
          "scopeId": "<store-id>"
        }
      ]
    },
    "get": { ... }
  }
}
```

---

## 6. Error Handling

When a StoreHead tries to update a store that is not theirs, the backend returns:

```
"You cant do this"
```

This is thrown by `grantAccess` when the scope check fails. The frontend should handle this gracefully (e.g., show a "permission denied" message).

---

## 7. Summary of All Changes

| Backend File | Change |
|---|---|
| `models/user.ts:82-94` | Added `"StoreHead"` to `role_array`, `"store"` to `role_scope_type_emums` |
| `models/store.ts:119-132` | Added `managedStore` reverse relation on `storeHead` |
| `src/user/addOrRemoveRoles/addOrRemoveRoles.fn.ts` | Added StoreHead add/remove blocks to manage `store.storeHead` relation |
| `src/store/add/mod.ts` | Added `{ roles: ["StoreHead"] }` to grantAccess |
| `src/store/update/mod.ts` | Added scoped `{ roles: ["StoreHead"], getScope }` |
| `src/store/updateRelations/mod.ts` | Added scoped `{ roles: ["StoreHead"], getScope }` |
| `src/store/get/mod.ts` | Added `"StoreHead"` to read roles |
| `src/store/gets/mod.ts` | Added `"StoreHead"` to read roles |

No changes to: `store.remove`, `store.count`, `stuff.*`, `tender.*` — these remain Manager/Admin only.
