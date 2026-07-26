# New Role Management System

> This document describes the refactored role/relation system for frontend developers.
> The `headedUnit` and `headedOrganization` fields no longer exist on the User model.
> The `organization` field (single relation) was replaced by `organizations` (multiple relation).
> All role mutations go through a single `addOrRemoveRoles` action.

---

## Table of Contents

1. [Conceptual Changes](#1-conceptual-changes)
2. [Model Structure](#2-model-structure)
3. [The Single Source of Truth: `addOrRemoveRoles`](#3-the-single-source-of-truth-addorremoveroles)
4. [How to Assign a Unit Head](#4-how-to-assign-a-unit-head)
5. [How to Assign an Org Head](#5-how-to-assign-an-org-head)
6. [How to Remove a Unit Head](#6-how-to-remove-a-unit-head)
7. [How to Change an Org Head](#7-how-to-change-an-org-head)
8. [How to Manage Regular Unit Membership](#8-how-to-manage-regular-unit-membership)
9. [How to Fetch Current User Info](#9-how-to-fetch-current-user-info)
10. [How to Query Which Units a User Heads](#10-how-to-query-which-units-a-user-heads)
11. [Available User Actions](#11-available-user-actions)
12. [Migration Guide (Frontend)](#12-migration-guide-frontend)

---

## 1. Conceptual Changes

### Before (Old System)

The old system had **duplicated role management** scattered across multiple actions:

| Action | What it did |
|--------|-------------|
| `unit.add` | Set `unit.head` + called `addUnitHeadRole` helper |
| `unit.updateRelations` | Set `unit.head` + managed UnitHead role on user |
| `organization.add` | Set `org.head` + called `addOrgHeadRole` helper |
| `organization.updateRelations` | Set `org.head` + managed OrgHead role on user |
| `user.addUser` / `user.updateUser` | Set user's `roles` array directly |
| `user.updateUserRelations` | Set `user.organization` (single) and `user.units` |

Problems:
- `headedUnit` was `type: "single"` on User (auto-generated reverse of `unit.head`), but a user can head **multiple** units
- `headedOrganization` was `type: "single"` on User (auto-generated reverse of `org.head`), same issue
- Role logic was duplicated across 4+ action handlers

### After (New System)

**One action to rule all role changes:** `user.addOrRemoveRoles`

| Action | What it does now |
|--------|------------------|
| `unit.add` | **Only** sets `unit.head` relation — no role management |
| `unit.updateRelations` | **No longer accepts** `headId` — head changes go through `addOrRemoveRoles` |
| `organization.add` | **Only** sets `org.head` relation — no role management |
| `organization.updateRelations` | **No longer accepts** `head` / `removeHead` — head changes go through `addOrRemoveRoles` |
| `user.addOrRemoveRoles` | **The single source of truth** — manages roles + units + organizations in one call |
| `user.addUser` | Accepts `organizations` (array) and `units` (array) |
| `user.updateUserRelations` | Accepts `organizations` (array) |

**Key principle:** The `roles` array on User and the `units`/`organizations` relations on User are **always in sync**. When you add a `UnitHead` role with `scopeId`, the corresponding unit is automatically added to `user.units`. When you remove it, it's removed.

---

## 2. Model Structure

### User (relevant fields)

```typescript
// Pure fields
roles: [{
  roleId: string,           // UUID, auto-generated if not provided
  name: "Manager" | "Admin" | "OrgHead" | "UnitHead" | "Employee" | "Ordinary",
  scopeType?: "organization" | "unit",
  scopeId?: string,         // ObjectId of the org or unit
}]

// Relations (auto-embedded in user document)
units: Unit[]               // M:N — units the user belongs to
organizations: Organization[]  // M:N — organizations the user belongs to
```

### Unit

```typescript
// Unit still has `head` pointing to User — but NO reverse on User
head: { _id, first_name, last_name, ... }
// Reverse: NOTHING — no `headedUnit` on User anymore
// To find headed units: query `unit.gets` with filter `"head._id": userId`
```

### Organization

```typescript
// Organization still has `head` pointing to User — but NO reverse on User
head: { _id, first_name, last_name, ... }
// Reverse: NOTHING — no `headedOrganization` on User anymore
// To find headed orgs: query `organization.gets` with filter `"head._id": userId`
```

---

## 3. The Single Source of Truth: `addOrRemoveRoles`

### Action Name

`user.addOrRemoveRoles`

### Endpoint

```http
POST /api/main/user/addOrRemoveRoles
```

### Request Body

```json
{
  "service": "main",
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "uuid-of-active-role",
      "_id": "object-id-of-user-to-modify",
      "addRoles": [
        {
          "name": "UnitHead",
          "scopeType": "unit",
          "scopeId": "object-id-of-unit"
        }
      ],
      "removeRoles": [
        {
          "name": "UnitHead",
          "scopeType": "unit",
          "scopeId": "object-id-of-unit"
        }
      ]
    },
    "get": {
      "_id": 1,
      "first_name": 1,
      "last_name": 1,
      "roles": 1,
      "units": { "_id": 1, "name": 1 },
      "organizations": { "_id": 1, "name": 1 }
    }
  }
}
```

### What Happens Inside (per role entry)

| Role name | On Add | On Remove |
|-----------|--------|-----------|
| **Any role** | `$push` to `user.roles` (dedup by name+scopeType+scopeId, adds UUID `roleId` if missing) | `$pull` from `user.roles` |
| **With `scopeType: "unit"`** | `user.addRelation({ units: [scopeId] })` — appends unit to user's units | `user.removeRelation({ units: [scopeId] })` — removes unit from user's units |
| **With `scopeType: "organization"`** | `user.addRelation({ organizations: [scopeId] })` — appends org to user's orgs | `user.removeRelation({ organizations: [scopeId] })` — removes org from user's orgs |
| **`UnitHead`** additionally | `unit.addRelation({ head: [userId] })` with `replace: true` — sets this user as the unit's head | Checks if current `unit.head` matches this user, then `unit.removeRelation({ head: [userId] })` — clears the head |
| **`OrgHead`** additionally | `organization.addRelation({ head: [userId] })` with `replace: true` — sets this user as the org's head | Checks if current `org.head` matches this user, then `org.removeRelation({ head: [userId] })` — clears the head |

### Validation Rules

| Field | Type | Required |
|-------|------|----------|
| `activeRoleId` | `string` | Yes |
| `_id` | `ObjectId` | Yes (the target user) |
| `addRoles` | `array` | No (but at least one of add/remove required) |
| `removeRoles` | `array` | No (but at least one of add/remove required) |
| `addRoles[].roleId` | `string` (UUID) | Optional (auto-generated if missing) |
| `addRoles[].name` | enum | Yes |
| `addRoles[].scopeType` | `"organization" \| "unit"` | Optional |
| `addRoles[].scopeId` | `string` | Optional |

### Authorization

- **Manager**: Can modify any user's roles
- **Admin**: Can modify any user's roles
- **OrgHead**: Can modify roles of users within their own organization (scope check against `_id`)

---

## 4. How to Assign a Unit Head

This is now a **two-step** process (was previously one step in `unit.add`/`unit.updateRelations`):

### Step 1: Set the head relation on the Unit

Use `unit.updateRelations` (or `unit.add` if creating a new unit):

```json
{
  "model": "unit",
  "act": "updateRelations",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "unit-object-id",
      "organizationId": "org-object-id"
    },
    "get": { "_id": 1, "name": 1, "head": { "_id": 1, "first_name": 1 } }
  }
}
```

> **Note:** `unit.updateRelations` no longer accepts `headId`.  
> **Note:** `unit.add` still accepts `headId` (sets head on creation), but does **not** manage roles.

### Step 2: Assign the UnitHead role + add user to the unit

Use `user.addOrRemoveRoles`:

```json
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "user-object-id",
      "addRoles": [{
        "name": "UnitHead",
        "scopeType": "unit",
        "scopeId": "unit-object-id"
      }]
    },
    "get": { "_id": 1, "roles": 1, "units": { "_id": 1, "name": 1 } }
  }
}
```

This single call:
1. Adds `{ name: "UnitHead", scopeType: "unit", scopeId: "..." }` to `user.roles`
2. Adds the unit to `user.units`
3. Sets `unit.head` to this user

---

## 5. How to Assign an Org Head

Same pattern as unit head:

### Step 1: Set the head on the Organization (optional — `org.add` also accepts `headId`)

```json
{
  "model": "organization",
  "act": "updateRelations",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "org-object-id"
    },
    "get": { "_id": 1, "name": 1 }
  }
}
```

> **Note:** `org.updateRelations` no longer accepts `head` / `removeHead`.

### Step 2: Assign the OrgHead role + add user to the org

```json
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "user-object-id",
      "addRoles": [{
        "name": "OrgHead",
        "scopeType": "organization",
        "scopeId": "org-object-id"
      }]
    },
    "get": { "_id": 1, "roles": 1 }
  }
}
```

---

## 6. How to Remove a Unit Head

### Single call to `addOrRemoveRoles`:

```json
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "user-object-id",
      "removeRoles": [{
        "name": "UnitHead",
        "scopeType": "unit",
        "scopeId": "unit-object-id"
      }]
    },
    "get": { "_id": 1, "roles": 1 }
  }
}
```

This single call:
1. Removes the `UnitHead` role from `user.roles`
2. Removes the unit from `user.units`
3. Clears `unit.head` (only if current head matches this user)

---

## 7. How to Change an Org Head

Make two `addOrRemoveRoles` calls:

```json
// Step 1: Remove old head
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "old-head-user-id",
      "removeRoles": [{
        "name": "OrgHead",
        "scopeType": "organization",
        "scopeId": "org-object-id"
      }]
    }
  }
}

// Step 2: Add new head
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "new-head-user-id",
      "addRoles": [{
        "name": "OrgHead",
        "scopeType": "organization",
        "scopeId": "org-object-id"
      }]
    }
  }
}
```

---

## 8. How to Manage Regular Unit Membership

For non-head unit membership (Employee, Ordinary, etc.):

### Add user to a unit

Use `user.addOrRemoveRoles` with or without a role that has `scopeType: "unit"`:

```json
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "user-object-id",
      "addRoles": [{
        "name": "Employee",
        "scopeType": "unit",
        "scopeId": "unit-object-id"
      }]
    }
  }
}
```

Or use `user.updateUserRelations` for bulk operations:

```json
{
  "model": "user",
  "act": "updateUserRelations",
  "details": {
    "set": {
      "activeRoleId": "...",
      "_id": "user-object-id",
      "organizations": ["org-id-1", "org-id-2"],
      "units": ["unit-id-1", "unit-id-2"]
    },
    "get": { "_id": 1 }
  }
}
```

> **Warning:** `updateUserRelations` **replaces** the entire `organizations` and/or `units` array (uses `replace: true`). Use `addOrRemoveRoles` for granular add/remove.

---

## 9. How to Fetch Current User Info

`getMe` works as before. Request the fields you need:

```json
{
  "model": "user",
  "act": "getMe",
  "details": {
    "set": {},
    "get": {
      "_id": 1,
      "first_name": 1,
      "last_name": 1,
      "email": 1,
      "roles": 1,
      "units": { "_id": 1, "name": 1, "head": { "_id": 1 } },
      "organizations": { "_id": 1, "name": 1 }
    }
  }
}
```

**What changed in `getMe`:**
- ❌ `headedUnit` — no longer available (was `type: "single"`, incorrectly limited to one unit)
- ❌ `headedOrganization` — no longer available
- ✅ `units` — stays the same (M:N relation, all units the user belongs to)
- ✅ `organizations` — **new!** replaces `organization` (now M:N instead of single)

> **How to know which units a user heads?**  
> Option A: Parse `user.roles` for entries with `name === "UnitHead"` and read `scopeId`.  
> Option B: Fetch `unit.gets` with filter `{ "head._id": userId }`.

---

## 10. How to Query Which Units a User Heads

Since `headedUnit` is gone, use one of these approaches:

### Option A: From the roles array (client-side, no extra request)

```typescript
const headedUnitIds = currentUser.roles
  .filter(r => r.name === "UnitHead" && r.scopeType === "unit")
  .map(r => r.scopeId);
```

### Option B: Query units (server-side)

```json
{
  "model": "unit",
  "act": "gets",
  "details": {
    "set": {
      "activeRoleId": "...",
      "filter": { "head._id": { "$eq": "user-object-id" } }
    },
    "get": { "_id": 1, "name": 1, "enName": 1 }
  }
}
```

---

## 11. Available User Actions

| Action | What it does | Role Management? |
|--------|-------------|------------------|
| `user.addUser` | Create user with roles, organizations, units, features, etc. | ✅ Sets initial roles + auto-adds orgs/units from role scopeIds |
| `user.updateUser` | Update pure fields (name, email, roles array, etc.) | ⚠️ Can update `roles` array directly but does NOT sync units/orgs |
| `user.updateUserRelations` | Update relations (avatar, organizations, units, state, city) | ❌ Just manages relations |
| **`user.addOrRemoveRoles`** | **Add/remove roles + auto-sync units/orgs/head** | ✅ **THE single source of truth** |
| `user.getMe` | Get current user with all fields | ❌ |
| `user.getUser` | Get one user by ID | ❌ |
| `user.getUsers` | List users | ❌ |
| `user.removeUser` | Delete user | ❌ |
| `user.countUsers` | Count users | ❌ |
| `user.login` | Authenticate | ❌ |
| `user.register` | Self-register | ❌ |
| `user.tempUser` | Create temp user | ❌ |
| `user.dashboardStatistic` | Dashboard stats | ❌ |

---

## 12. Migration Guide (Frontend)

### What to search & replace in your codebase

| Old field | New field | Action |
|-----------|-----------|--------|
| `user.organization` (single object) | `user.organizations` (array) | Update all type definitions, API calls, and UI rendering |
| `user.organization._id` | `user.organizations[0]._id` (or loop) | Update references |
| `user.headedUnit` | Parse from `user.roles` or query `unit.gets` | Update all references |
| `user.headedOrganization` | Parse from `user.roles` or query `org.gets` | Update all references |
| `"organization": "{orgId}"` in `addUser`/`updateUserRelations` | `"organizations": ["{orgId}"]` | Update API request bodies |
| `act: "updateRelations"` on unit with `headId` | `act: "addOrRemoveRoles"` on user instead | Replace API call |
| `act: "updateRelations"` on org with `head` | `act: "addOrRemoveRoles"` on user instead | Replace API call |

### Quick checklist

- [ ] Replace `user.organization` → `user.organizations` in all TypeScript types and interfaces
- [ ] Replace `user.organization && user.organization._id` → `user.organizations?.[0]?._id` or iterate
- [ ] Replace `user.headedUnit` → compute from `user.roles`
- [ ] Replace `user.headedOrganization` → compute from `user.roles`
- [ ] Update forms that assign unit heads to use two-step flow: `unit.updateRelations` (or `unit.add`) + `user.addOrRemoveRoles`
- [ ] Update forms that assign org heads same way
- [ ] Update `addUser` payloads: `"organization": "id"` → `"organizations": ["id"]`
- [ ] Update `updateUserRelations` payloads: `"organization": "id"` → `"organizations": ["id"]`
- [ ] Remove any code that references `headedUnit` or `headedOrganization` from select/query projections

### Example: Before & After

**Before (old API call to set unit head):**
```json
{
  "model": "unit",
  "act": "updateRelations",
  "details": {
    "set": {
      "_id": "unit-id",
      "headId": "user-id"
    }
  }
}
```
*(This no longer works — `headId` was removed)*

**After (new two-step flow):**
```json
// Step 1: Set head on unit
{ "model": "unit", "act": "updateRelations", "details": { "set": { "_id": "unit-id" } } }

// Step 2: Grant role & sync relations
{
  "model": "user",
  "act": "addOrRemoveRoles",
  "details": {
    "set": {
      "_id": "user-id",
      "addRoles": [{ "name": "UnitHead", "scopeType": "unit", "scopeId": "unit-id" }]
    }
  }
}
```
