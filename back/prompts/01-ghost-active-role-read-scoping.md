# Backend Task 01: Scope Ghost Users by the Selected Active Role for Reads

## Context

The frontend now relays the user's selected active role to every server action as
`details.set.activeRoleId` (injected from the `activeRoleId` cookie). The backend
resolves that id to an entry in `user.roles` via `readAuth()` and then applies read
scopes.

The current bug: when a `Ghost` user (`user.isGhost === true`) also has `Admin` and
`OrgHead` roles, selecting the `OrgHead` role still returns **all** units in the
project. The same happens for organizations, processes, purchasing requests,
inventory, etc.

This is a backend read-scoping bug. The frontend already:

- sends the selected `activeRoleId`,
- calls the scoped server actions,
- renders the returned list directly (no client-side filtering or merging).

Do **not** fix this by filtering in the frontend.

## Reproduction

1. Seed/find a user with:
   ```ts
   {
     isGhost: true,
     roles: [
       { roleId: "admin-role", name: "Admin" },
       { roleId: "orghead-role", name: "OrgHead", scopeType: "organization", scopeId: "<orgA-id>" }
     ]
   }
   ```
2. Login as that user and select the `OrgHead` role.
3. Request `/orghead/units`.
   The frontend server component calls:
   ```ts
   unit.gets({
     activeRoleId: "<orghead-role>",
     page: 1,
     limit: 50,
   })
   ```
4. With the `OrgHead` role selected, the response currently contains units from
   every organization.
5. Expected: only units whose `organization._id === "<orgA-id>"`.
6. `unit.count` returns the unscoped total as well, so list pagination and KPI
   counts are wrong too.

## Root Cause

`back/utils/readScope.ts` treats the `isGhost` flag as an unconditional read
bypass before the active role is considered:

```ts
const isBypass = (activeRole: ActiveRole, user: ScopeUser | undefined) =>
  Boolean(user?.isGhost) || isManagerLike(activeRole);
```

`isGhost` is a user-level bootstrap superuser flag, not a role. The selected
active role must remain the source of truth for scoped reads. The same
`user?.isGhost || isManagerLike(activeRole)` shortcut is duplicated in several
read-scope helpers.

## Required Behavior

The active role determines the read scope, including for ghost users:

| Active role | Read scope |
|---|---|
| `Manager`, `Admin` | Everything |
| `OrgHead` | `{ organizationIds: [activeRole.scopeId] }` |
| `UnitHead` | Own unit + descendants `{ unitIds: [...] }` |
| `StoreHead` | Store scope where the model supports it |
| `Employee`, `Ordinary` | Membership-based scopes (existing behavior) |
| Any scoped role with missing/invalid `scopeId` | Fail closed (empty result), never `"all"` |

Ghost-specific rule:

- `user.isGhost === true` may keep the bootstrap bypass **only when the active
  role has no scope** (for example, the initial `Ordinary` role created by
  `tempUser` before any organization-specific role exists).
- When the selected active role has a `scopeType`/`scopeId` (OrgHead, UnitHead,
  StoreHead, scoped Employee/Ordinary), `isGhost` must **not** widen the read.
- Manager/Admin still bypass because `isManagerLike(activeRole)` is true.

This preserves the bootstrap flow while honoring role switching for seeded
superusers.

## Proposed Implementation

Add one shared helper (placement in `back/utils/readScope.ts` or
`back/utils/authzPolicy.ts` is fine):

```ts
export const isReadScopeBypass = (
  activeRole: ActiveRole,
  user: { isGhost?: boolean } | undefined,
): boolean => {
  if (isManagerLike(activeRole)) return true;

  const hasScope = Boolean(activeRole.scopeType || activeRole.scopeId);
  return Boolean(user?.isGhost) && !hasScope;
};
```

Then replace duplicated checks in read paths with this helper:

- `back/utils/readScope.ts`
  - `isBypass`
  - `unitReadScope`
  - `organizationReadScope`
  - `assertCanReadUnit`
  - `assertCanReadOrganization`
  - `userReadFilter` (it calls `isBypass`)
- `back/utils/unitScope.ts` (local `isBypass`)
- `back/utils/financeScope.ts` (local `isBypass`)
- `back/utils/consumptionScope.ts` (`consumptionScopeMatch`)
- `back/utils/checkFinanceUnitAccess.ts`
- `back/utils/checkWareModelAccess.ts`
- `back/src/process/readScope.ts` (`processReadMatch`,
  `processMatchesReadScope`)
- `back/src/processStep/readScope.ts`
- `back/src/tenderOffer/readScope.ts` (`tenderOfferReadMatch`,
  `tenderOfferMatchesReadScope`)
- `back/src/purchasingRequest/readScope.ts` (`purchasingRequestReadMatch`,
  `purchasingRequestMatchesReadScope`)

Search for direct bypasses outside these helpers and route them through the
same rule:

```bash
rg -n "isGhost \\|\\| isManagerLike|isManagerLike\\(activeRole\\)|user\\?\\.isGhost|user\\.isGhost" back/src back/utils
```

Also audit direct `get` functions that implement their own ghost bypass, for
example:

- `back/src/fiscalYear/get/get.fn.ts`
- `back/src/budgetLine/get/get.fn.ts`
- `back/src/tenderOffer/get/get.fn.ts`
- `back/src/purchasingRequest/get/get.fn.ts`
- `back/src/purchasingRequest/getHistory/getHistory.fn.ts`
- `back/src/user/getUser/getUser.fn.ts`

These must apply the same active-role-aware rule.

### Important: request filters must not widen scope

Existing request filters such as `set.organizationId` must keep intersecting
with the computed scope. Do not replace the scope filter with a caller-supplied
`organizationId`. A ghost OrgHead passing a foreign `organizationId` must get an
empty result, not the foreign organization.

## Tests

Update and extend the Deno tests. The current test
`readScope.test.ts` → `"Ghost reads everything"` encodes the buggy behavior.
Replace it with cases that cover active-role semantics:

1. Ghost + Manager/Admin active role → `"all"`.
2. Ghost + OrgHead (`scopeType: "organization"`, `scopeId: ORG_OWN`) →
   `{ organizationIds: [ORG_OWN] }`.
3. Ghost + UnitHead (`scopeType: "unit"`, `scopeId: UNIT_OWN`) → own unit +
   descendants.
4. Ghost + OrgHead without scope → `{ organizationIds: [] }` (fail closed).
5. Ghost + Ordinary without scope → `"all"` (bootstrap compatibility).
6. `assertCanReadUnit` for ghost OrgHead:
   - own-org unit resolves,
   - foreign-org unit rejects with `You cant do this`.
7. `organizationReadScope` mirror cases.
8. Ghost OrgHead `userReadFilter` returns only users in the active organization.

Add equivalent coverage for:

- `back/utils/unitScope.test.ts`
- `back/utils/financeScope.test.ts`
- `back/src/tenderOffer/readScope.test.ts`
- process, processStep, purchasing request, consumption, and inventory read
  scopes if their helpers were changed.

Run:

```bash
cd back
deno task test
deno lint
deno fmt --check
```

## Acceptance Criteria

- A ghost user with both `Admin` and `OrgHead` roles sees all data while the
  `Admin` role is active.
- Switching to the `OrgHead` role makes `unit.gets` / `unit.count` return only
  units belonging to that organization.
- `unit.get` on a unit from another organization returns `You cant do this`.
- The same active-role scoping applies to organizations, processes, process
  steps, purchasing requests, tender offers, inventory, consumption, finance,
  and stock movements.
- Missing or invalid role scopes fail closed, not open.
- Bootstrap ghost users with no scoped role keep their existing unrestricted
  behavior.
- Non-ghost users retain the existing scoped behavior.
- `deno task test`, `deno lint`, and `deno fmt --check` pass.

## Related Consistency Work (Decide Explicitly)

Read scoping is the reported bug and is required for this task. The following
areas still bypass based on `user.isGhost` even when a scoped role is active:

- Authorization: `back/utils/grantAccess.ts` returns early for ghost users
  before resolving the active role.
- Write scope: `back/utils/writeScope.ts` bypasses for ghost users.
- Role assignment: `back/src/user/shared/assignRoles.ts`,
  `addUser/addUser.fn.ts`, and `addOrRemoveRoles/addOrRemoveRoles.fn.ts` use
  ghost bypass.
- Other direct checks found by the `rg` command above.

Decide with product whether a ghost user acting as `OrgHead` should also be
blocked from cross-organization writes and role changes. If yes, apply the same
`isReadScopeBypass` rule there and add regression tests for bootstrap flows. If
not, leave those paths unchanged and document the intentional superuser exception
in the PR description.

## Out of Scope

- Frontend changes (already implemented; it sends `activeRoleId` and does not
  filter client-side).
- Changing the role authority matrix.
- Removing the ghost bootstrap flow.
- Allowing clients to choose a scope via request payload.
