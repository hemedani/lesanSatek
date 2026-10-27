# Backend Task 02: Allow OrgHead to Update/Remove Users Inside Their Organization

## Context

The frontend OrgHead user detail page (`front/src/app/orghead/users/[id]/page.tsx`)
lets an OrgHead edit a user's profile fields and delete that user:

- `updateUser({ activeRoleId, _id, first_name, last_name, email, mobile, gender, position, isActive, is_verified })`
- `removeUser({ activeRoleId, _id })`

The same page already uses `addOrRemoveRoles` and `updateUserRelations`, which
the backend correctly permits for OrgHead with target-user scope checks.

The profile save and delete calls currently fail for OrgHead with
`You cant do this`, because their `grantAccess` checks only allow Manager/Admin
and their action functions do not verify the target user's organization.

This is a backend authorization gap: the frontend exposes org-scoped user
management, and the backend only implements global user profile management.

## Reproduction

1. Log in as an OrgHead scoped to organization `A`.
2. Open `/orghead/users/<id>` for a user that belongs to organization `A`.
3. Change the user's first name and save. The request returns:
   ```json
   { "success": false, "body": { "message": "You cant do this" } }
   ```
4. Press delete and confirm. The same error is returned.

## Root Cause

`back/src/user/updateUser/mod.ts`:

```ts
grantAccess([
  { roles: ["Manager", "Admin"] },
])
```

`back/src/user/removeUser/mod.ts`:

```ts
grantAccess([
  { roles: ["Manager"] },
])
```

Neither action has a `scope` resolver, and `updateUserFn` / `removeUserFn`
update/delete by `_id` without checking that the target user belongs to the
active OrgHead's organization or that the target is safe for an OrgHead to
modify.

## Required Behavior

### OrgHead update

An OrgHead with `scopeType: "organization"` and a valid `scopeId` may update
users that belong to that organization.

Recommended field policy:

| Field | OrgHead | Manager/Admin |
|---|---|---|
| `first_name`, `last_name`, `gender`, `birth_date` | yes | yes |
| `mobile`, `email`, `position` | yes | yes |
| `isActive`, `is_verified` | yes | yes |
| `password` | no | yes |
| `features`, `allowWareTypeIds`, `allowWareClassIds`, `allowWareGroupIds`, `allowWareModelIds` | no | yes |

If any OrgHead-forbidden field is present in the request, fail closed with
`You cant do this` (do not silently ignore it). The frontend can hide/disable
those controls for OrgHead afterwards.

### OrgHead remove

An OrgHead may remove a user only when:

- the target user is a member of the active organization
  (`user.organizations` contains `activeRole.scopeId`), and
- the target user does not hold `Manager` or `Admin` roles.

Otherwise fail closed with `You cant do this`.

If the product decision is that only Manager/Admin may delete users, then
instead the frontend must hide the delete action for OrgHead. Do not leave the
current state where the UI exposes an action that always fails.

### Manager/Admin

No change: they may update/remove any user.

## Proposed Implementation

Reuse the existing scoped target loader from
`back/src/user/shared/assignRoles.ts`:

```ts
import {
  loadUserTargetContextForActor,
} from "../shared/assignRoles.ts";

const assertOrgHeadCanManageTarget = async (
  userId: string,
  activeRole: ActiveRole,
  user: { isGhost?: boolean },
) => {
  if (isScopeBypass(activeRole, user)) return;
  if (activeRole.name !== "OrgHead") return;

  await loadUserTargetContextForActor(
    userId,
    activeRole,
    isScopeBypass(activeRole, user),
  );
};
```

`loadUserTargetContextForActor` already:

- loads the target's `organizations` and `units.organization`,
- rejects when the OrgHead's `scopeId` is not among the target's organizations,
- rejects users outside the org.

Add it to `preAct` for `updateUser` and `removeUser` after `grantAccess`, or
call it at the start of the action functions. Then add the field whitelist and
the privileged-role guard described above.

For the privileged-role guard, load the target's `roles` and reject if any role
name is `"Manager"` or `"Admin"`.

Suggested `preAct` shape:

```ts
preAct: [
  setTokens,
  setUser,
  grantAccess([
    { roles: ["Manager", "Admin"] },
    { roles: ["OrgHead"] },
  ]),
  assertOrgHeadCanUpdateOrRemoveUser,
],
```

`assertOrgHeadCanUpdateOrRemoveUser` should read `_id` from
`details.set`, call `getAuth()`, and apply the checks. Keep Manager/Admin
bypass semantics unchanged.

Do **not** widen access by trusting a client-supplied `organizationId` field.
The target user's stored relations are the source of truth.

## Tests

Add Deno tests covering:

1. Manager updates/removes any user.
2. OrgHead updates a same-org user's `first_name` → success.
3. OrgHead updates a user from another organization → `You cant do this`.
4. OrgHead removes a same-org non-privileged user → success.
5. OrgHead removes a same-org user holding `Manager` or `Admin` → `You cant do this`.
6. OrgHead removes a user from another org → `You cant do this`.
7. OrgHead attempts `password`, `features`, or `allowWare*` update → `You cant do this`.
8. Ghost user with active OrgHead role is scoped exactly like case 2-7
   (ghost status must not widen write access for a scoped active role).
9. Ghost user with active Admin role still bypasses.

Run:

```bash
cd back
deno task test
deno lint
deno fmt --check
```

## Acceptance Criteria

- OrgHead can save profile fields for a user in their own organization.
- OrgHead cannot read, update, or remove a user from another organization.
- OrgHead cannot edit/remove a user holding `Manager` or `Admin`.
- OrgHead cannot change passwords, feature flags, or ware allow-lists.
- Manager/Admin behavior is unchanged.
- `removeUser` no longer returns `You cant do this` for a valid same-org,
  non-privileged target when the OrgHead delete action is kept in the UI.
