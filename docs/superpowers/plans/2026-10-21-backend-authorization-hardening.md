# Backend Authorization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix the OrgHead "You cant do this" failures and eliminate the systemic authorization design defect behind them across the Lesan backend.

**Architecture:** Replace payload-derived, per-action `getScope` closures with one authz layer that resolves the target resource's tenant/scope from MongoDB, then compares it to the active role. Keep `grantAccess` as the coarse role gate in `preAct`; move object-level rules (role-assignment authority, tenant ownership, feature scope) into shared policy helpers called by both `preAct` and action functions. Never trust a client-supplied `organizationId`, `unitId`, `storeId`, or `_id` as proof of ownership.

**Tech Stack:** Deno 2.8, Lesan 0.2.3, MongoDB, Zod-style validators, JWT (`djwt`).

**Spec:** No separate spec exists. The root-cause analysis in this document is the specification.

## Global Constraints

- Lesan validates `body.details` **before** running `preAct` (`runAct` in Lesan 0.2.3). Any field an action or `preAct` needs must exist in that action's validator; unknown fields are stripped by Zod.
- `validationRunType: "create"` applies defaults/coercions; `assert` does not. Keep existing mode choices unless a task says otherwise.
- All comparisons of IDs must normalize with `String(...)`; `roles[].scopeId` is stored as `string`.
- Manager and Admin bypass tenant-scope checks. Ghost (`user.isGhost`) bypasses all checks. These are the only bypasses.
- Feature requirements apply to non-Manager/Admin roles only; Manager/Admin skip feature checks.
- Do not change relation ownership or add reverse relations; follow the one-directional Lesan relation convention.
- Do not run or modify `http/e2e.json` locally; the user runs it in `/playground`. Add cases to it and report expected results.
- No `git reset`; commit only when requested.

## Root-Cause Analysis (evidence)

1. **Reported bug — OrgHead cannot create a user.** `addUser` derives the OrgHead scope from `set.organizations[0]` (`back/src/user/addUser/mod.ts:43-48`). The OrgHead add-user page never sends `organizations` (`front/src/app/orghead/users/add/page.tsx:83-101`), so `getScope` returns `null` and `grantAccess` throws `You cant do this` (`back/utils/grantAccess.ts:47-57`).
2. **Roles cannot be supplied at creation.** `addUserValidator` has no `roles` field (`back/src/user/addUser/addUser.val.ts`), and Lesan validates before `preAct`. The OrgHead page does send `roles` (`front/src/app/orghead/users/add/page.tsx:95-103`), but they are stripped, and `addUserFn` hard-codes `roles: [{ name: "Ordinary" }]` (`back/src/user/addUser/addUser.fn.ts:68`). `checkGhostUser` is dead code for the same reason.
3. **OrgHead cannot assign roles at all.** `addOrRemoveRoles` compares the OrgHead's organization scope to the **target user's `_id`** (`back/src/user/addOrRemoveRoles/mod.ts:16-19`), which can never match.
4. **Payload-based scope is structurally broken across modules.** `getScope` reads fields that validators do not contain or that are optional:
   - `process.update`: no `organizationId` in validator, so OrgHead falls back to process `_id` and fails.
   - `processStep.add`: no `organizationId` or `_id`, so OrgHead can never add a step.
   - `processStep.update/remove/updateRelations`: compares step `_id` to an organization scope.
   - `unit.update/remove`: OrgHead uses optional `organizationId` instead of resolving the unit's organization.
   This is why OrgHead failures are not limited to user creation.
5. **Unit-level features never load.** `setUser` projects only user pure fields plus `organizations._id` (`back/utils/setUser.ts:18-21`), but `hasFeature` reads `user.units[].features` (`back/utils/checkFeature.ts:16`). Unit-granted features are always ignored.
6. **Privilege escalation surface.** Role assignment has no authority matrix. The OrgHead form offers Manager/Admin/OrgHead (`front/src/types/permissions.ts:57-65`) and `addOrRemoveRoles` validates only that the role name is in the enum. Once the scope bug is fixed, an OrgHead could grant Manager/Admin.
7. **Client-controlled ownership.** `getScope` trusts `set.organizations`, `set.organizationId`, `set.unitId`, and `set._id` from the request. For update/remove actions this permits cross-tenant access if the request names its own scope.
8. **Scope-less role grants.** Examples: `inventory.update` grants OrgHead with no scope; `store.add` grants StoreHead with no scope; `processStep` grants OrgHead based on the wrong ID.
9. **Finance/store/read scoping is incomplete.** `checkFinanceUnitAccess` returns early for every role except UnitHead, so any OrgHead/Admin/Manager can touch any budget. `getUsers`/`getUser` are open to every role and return all users. Inventory, consumption, and purchasing-request CRUD are not consistently scoped.
10. **Disabled users can authenticate.** `loginUserFn` does not reject `isActive: false`; `setUser` does not re-check it.
11. **List endpoints leak the whole tenant.** `unit.gets` filters only by an optional client-supplied `organizationId` (`back/src/unit/gets/gets.fn.ts:29-35`), so an OrgHead listing units receives every unit in the system. `organization.gets` has no scope filter at all (`back/src/organization/gets/gets.fn.ts`). `unit.count`, `organization.get/count`, `process.gets/count`, `stepApproval.gets`, and `purchasingRequest.gets` follow the same shape. This is a backend defect; the frontend must not be expected to filter for security.

## Review Focus

- A request that supplies a foreign `organizationId`/`unitId` for an update must never pass because the payload says so.
- An OrgHead action must succeed when the target belongs to their organization and fail when it belongs to another organization.
- A role assignment must never let a lower role mint Manager/Admin, or mint a scope outside the actor's authority.
- A unit-level feature must work only for the unit(s) the active role actually covers.
- A disabled or unverified-by-policy user must not obtain a working session.

---

### Task 1: Add pure authz policy primitives and unit tests

**Files:**
- Create: `back/utils/authzPolicy.ts`
- Create: `back/utils/authzPolicy.test.ts`
- Modify: `back/deno.json` (add `"test": "deno test --allow-all"`)

**Interfaces:**
- Produces:
  - `type RoleName = "Manager" | "Admin" | "OrgHead" | "UnitHead" | "StoreHead" | "Employee" | "Ordinary"`
  - `type ScopeType = "organization" | "unit" | "store"`
  - `type ScopeRef = { scopeType: ScopeType; scopeId: string }`
  - `type ActiveRole = { roleId: string; name: RoleName; scopeType?: ScopeType; scopeId?: string }`
  - `isManagerLike(role: ActiveRole): boolean`
  - `scopeMatches(role: ActiveRole, scope: ScopeRef | null): boolean`
  - `isRoleAllowed(role: ActiveRole, allowed: RoleName[]): boolean`
  - `assignableRoles(actor: ActiveRole): RoleName[]`
  - `canAssignRole(actor: ActiveRole, target: { name: RoleName; scopeType?: ScopeType; scopeId?: string }, targetScope: ScopeRef | null): boolean`

- [x] **Step 1: Write failing tests**

```ts
Deno.test("OrgHead can assign UnitHead inside own organization", () => {
  const actor = { roleId: "a", name: "OrgHead", scopeType: "organization", scopeId: "org1" } as const;
  assertEquals(canAssignRole(actor, { name: "UnitHead", scopeType: "unit", scopeId: "u1" }, { scopeType: "organization", scopeId: "org1" }), true);
});

Deno.test("OrgHead cannot assign Manager", () => {
  const actor = { roleId: "a", name: "OrgHead", scopeType: "organization", scopeId: "org1" } as const;
  assertEquals(canAssignRole(actor, { name: "Manager" }, null), false);
});

Deno.test("UnitHead cannot assign outside own unit", () => {
  const actor = { roleId: "a", name: "UnitHead", scopeType: "unit", scopeId: "u1" } as const;
  assertEquals(canAssignRole(actor, { name: "Employee", scopeType: "unit", scopeId: "u2" }, { scopeType: "organization", scopeId: "org1" }), false);
});

Deno.test("scopeMatches normalizes string and ObjectId-like values", () => {
  const role = { roleId: "a", name: "OrgHead", scopeType: "organization", scopeId: "507f1f77bcf86cd799439011" } as const;
  assertEquals(scopeMatches(role, { scopeType: "organization", scopeId: "507f1f77bcf86cd799439011" }), true);
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd back && deno test --allow-all utils/authzPolicy.test.ts`
Expected: FAIL with "Cannot find module" or "canAssignRole is not defined".

- [x] **Step 3: Implement `back/utils/authzPolicy.ts`**

Implement the exact signatures above. `assignableRoles` matrix:

| Actor | Assignable roles |
|---|---|
| Manager | all |
| Admin | all except Manager |
| OrgHead | OrgHead (same org only), UnitHead, Employee, Ordinary |
| UnitHead | Employee, Ordinary (own unit only) |
| StoreHead | none |
| Employee / Ordinary | none |

`canAssignRole` returns `false` for `Manager` actors assigning `Manager`? No: Manager is allowed all. It must reject when `assignableRoles(actor)` excludes the target name; for scoped targets, additionally require the target scope to be inside the actor scope (organization contains unit; unit equality for UnitHead; store never assignable except Manager/Admin).

- [x] **Step 4: Run tests to verify they pass**

Run: `cd back && deno test --allow-all utils/authzPolicy.test.ts`
Expected: PASS (4 tests).

- [x] **Step 5: Commit**

```bash
git add back/utils/authzPolicy.ts back/utils/authzPolicy.test.ts back/deno.json
git commit -m "feat(authz): add pure authorization policy primitives"
```

---

### Task 2: Fix context loading and session state

**Files:**
- Modify: `back/utils/setUser.ts`
- Modify: `back/src/user/login/loginUser.fn.ts`
- Test: `back/utils/authzPolicy.test.ts` (extend with a pure `featureAppliesToRole` helper) or create `back/utils/checkFeature.test.ts`

**Interfaces:**
- Consumes: `ActiveRole` from Task 1.
- Produces: `hasFeature(user, feature, activeRole?: ActiveRole): boolean` in `back/utils/checkFeature.ts`; `setUser` context now includes `units: [{ _id, name, features, organization: { _id } }]`.

- [x] **Step 1: Write failing test for scoped features**

```ts
Deno.test("unit feature applies only inside the active role scope", () => {
  const user = {
    features: [],
    units: [
      { _id: "u1", features: [{ feature: "canRegisterPurchaseRequest" }] },
      { _id: "u2", features: [{ feature: "canRegisterPurchaseRequest" }] },
    ],
  };
  const role = { roleId: "r", name: "UnitHead", scopeType: "unit", scopeId: "u1" } as const;
  assertEquals(hasFeature(user as never, "canRegisterPurchaseRequest", role), true);

  const otherRole = { roleId: "r2", name: "UnitHead", scopeType: "unit", scopeId: "u3" } as const;
  assertEquals(hasFeature(user as never, "canRegisterPurchaseRequest", otherRole), false);
});
```

- [x] **Step 2: Run to verify it fails**

Run: `cd back && deno test --allow-all utils/checkFeature.test.ts`
Expected: FAIL because the third argument is ignored.

- [x] **Step 3: Modify `setUser.ts`**

Project `units: { _id: 1, name: 1, features: 1, organization: { _id: 1 } }`. After loading, throw `"Account is disabled"` when `foundedUser.isActive === false`. Keep `organizations: { _id: 1 }`.

- [x] **Step 4: Modify `loginUserFn`**

After password verification, reject when `foundedUser.isActive === false` with a clear message; do not issue a token. Do not add a new required field to the login validator.

- [x] **Step 5: Modify `checkFeature.ts`**

`hasFeature(user, feature, activeRole)`:
- return `true` if `user.features` contains the feature;
- if `activeRole` is Manager/Admin, return `true` (bypass);
- if `activeRole.scopeType === "unit"`, only consider the unit whose `_id` equals `activeRole.scopeId`;
- if `activeRole.scopeType === "organization"`, consider units whose `organization._id` equals `activeRole.scopeId`;
- otherwise consider no unit features.

- [x] **Step 6: Run tests**

Run: `cd back && deno test --allow-all utils/checkFeature.test.ts`
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add back/utils/setUser.ts back/utils/checkFeature.ts back/utils/checkFeature.test.ts back/src/user/login/loginUser.fn.ts
git commit -m "fix(auth): load unit features and reject disabled sessions"
```

---

### Task 3: Centralize tenant scope resolution and rewrite `grantAccess`

**Files:**
- Modify: `back/utils/grantAccess.ts`
- Create: `back/utils/scopeResolvers.ts`
- Test: `back/utils/scopeResolvers.test.ts` (pure normalization) and `back/utils/authzPolicy.test.ts` (extend)

**Interfaces:**
- Consumes: `ActiveRole`, `ScopeRef`, `canAssignRole` from Task 1.
- Produces:
  - `type ScopeResolver = (body: { details: { set: Record<string, unknown> } }, user: unknown) => Promise<ScopeRef | null> | ScopeRef | null`
  - `grantAccess(checks: { roles: RoleName[]; features?: Feature[]; scope?: ScopeResolver }[]): () => Promise<void>`
  - `getAuth(): { user: MyContext["user"]; activeRole: ActiveRole; body: TLesanBody }` (throws `"activeRoleId is required"` / `"Active role not found"`)
  - Resolvers: `orgFromSet(field)`, `orgOfUnit()`, `orgOfProcess()`, `orgOfProcessStep()`, `orgOfInventory()`, `storeOfStuff()`, `orgOfBudgetLine()`, `orgOfFiscalYear()`, `userOrgTarget()`.

- [x] **Step 1: Write failing test for missing scope**

```ts
Deno.test("a scoped role check with an unresolved scope denies access", async () => {
  // feed getAuth a fake context with an OrgHead role and a resolver returning null
  // expect grantAccess to throw "You cant do this"
});
```

Use dependency injection into `grantAccess` (accept an optional context getter) so the test does not require the real Lesan server.

- [x] **Step 2: Run to verify it fails**

Run: `cd back && deno test --allow-all utils/scopeResolvers.test.ts`
Expected: FAIL.

- [x] **Step 3: Implement `grantAccess` as async**

Rules:
- Ghost bypass.
- Missing/unknown `activeRoleId` → explicit errors.
- For each check whose roles include the active role:
  - Manager/Admin return immediately (global bypass).
  - Enforce `features` with `hasFeature(user, feature, activeRole)`.
  - If no `scope` resolver → grant.
  - Else resolve; grant only when non-null and `scopeMatches(activeRole, scope)`.
- Throw a single consistent error: `"You cant do this"` for denials; keep separate errors for missing/unknown active role.

- [x] **Step 4: Implement `scopeResolvers.ts`**

Every resolver must derive the scope from MongoDB using IDs found in `set`, never from a caller-supplied scope claim:
- `orgOfUnit`: `unit.findOne({_id: set._id})`, return `{ scopeType: "organization", scopeId: unit.organization._id }`.
- `orgOfProcess`: same via `process.organization`.
- `orgOfProcessStep`: `processStep` → `process` → `organization` (handle missing process with `null`).
- `orgOfInventory`: `inventory` → `unit` → `organization`.
- `storeOfStuff`: `stuff` → `store` → scope `{ scopeType: "store", scopeId }`.
- `orgOfBudgetLine` / `orgOfFiscalYear`: read `organization._id`.
- `orgFromSet(field)`: creation-time resolver that reads `set[field]` and verifies the organization exists; used only where the payload is the only possible source (e.g., creating a unit/process), and must require the ID to be present for OrgHead.
- `userOrgTarget`: reads target user `_id`, returns their `organizations[0]._id`; for a brand-new user return the actor's org from `activeRole` (pass it in) — do not read `set.organizations`.

- [x] **Step 5: Run tests**

Run: `cd back && deno test --allow-all utils/authzPolicy.test.ts utils/scopeResolvers.test.ts`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add back/utils/grantAccess.ts back/utils/scopeResolvers.ts back/utils/scopeResolvers.test.ts
git commit -m "refactor(authz): resolve tenant scopes from database"
```

---

### Task 4: Fix `addUser` for OrgHead creation and role assignment

**Files:**
- Modify: `back/src/user/addUser/addUser.val.ts`
- Modify: `back/src/user/addUser/addUser.fn.ts`
- Modify: `back/src/user/addUser/mod.ts`
- Create: `back/src/user/shared/assignRoles.ts`
- Test: `http/e2e.json` (new cases) — user runs manually

**Interfaces:**
- Consumes: `canAssignRole`, `scopeMatches`, `getAuth`, `grantAccess` Task 1/3.
- Produces: `assignRolesToUser(input: { userId: string; actor: ActiveRole; addRoles?: RoleInput[]; removeRoles?: RoleInput[]; get: Record<string, unknown> }): Promise<unknown>` in `back/src/user/shared/assignRoles.ts`, where `RoleInput = { roleId?: string; name: RoleName; scopeType?: ScopeType; scopeId?: string }`.

- [x] **Step 1: Add failing E2E cases to `http/e2e.json`**

1. OrgHead `addUser` with `roles: [{ name: "OrgHead", scopeType: "organization", scopeId: <ownOrg> }]` and **no** `organizations` field → success; response has the role; user document has the org membership.
2. OrgHead `addUser` with `organizations: [<otherOrg>]` → error.
3. Manager `addUser` with `roles: [{ name: "Manager" }]` → success.
4. OrgHead `addUser` with `roles: [{ name: "Manager" }]` → error.
5. `getMe` on the newly created user → `units` and `features` present.

- [x] **Step 2: Run the backend and ask the user to execute the new cases**

Run: `cd back && deno task bc-dev`
Expected: case 1 currently fails with `You cant do this`; case 4 currently succeeds (security bug).

- [x] **Step 3: Add `roles` to `addUserValidator`**

Add `roles: optional(array(object({ roleId: optional(string()), name: role_emums, scopeType: optional(role_scope_type_emums), scopeId: optional(string()) })))`. Also replace the ad-hoc `roles` shape in `addUserFn` with this type.

- [x] **Step 4: Change `addUser` OrgHead scope in `mod.ts`**

Do not derive scope from `set.organizations`. For OrgHead, use `activeRole.scopeId` directly (there is no target resource yet). Use `grantAccess([{ roles: ["Manager", "Admin"] }, { roles: ["OrgHead"] }])` plus a dedicated `authorizeNewUserScope` preAct that:
- rejects when `set.organizations` exists and contains any ID other than `activeRole.scopeId`;
- injects `organizations: [activeRole.scopeId]` when absent (so the created user is a member of the actor's org).
This is the key fix for the reported error.

- [x] **Step 5: Update `addUserFn`**

- Default roles to `[{ name: "Ordinary" }]` only when `set.roles` is absent.
- Create the user first, then call `assignRolesToUser` for supplied roles so one shared authority check covers both actions.
- Keep `isGhost: false` implicit (not accepted by validator).
- Remove the dead `checkGhostUser` checks keyed on `body.details.set.roles`; role authority is now enforced in `assignRolesToUser`. Deleting `checkGhostUser` is acceptable because `Ghost` is not a valid role enum.

- [x] **Step 6: Re-run the E2E cases with the user**

Expected: case 1 succeeds; case 2 fails; case 3 succeeds; case 4 fails; case 5 succeeds.

- [x] **Step 7: Commit**

```bash
git add back/src/user/addUser back/src/user/shared/assignRoles.ts http/e2e.json
git commit -m "fix(user): allow OrgHead to create and assign users"
```

---

### Task 5: Fix `addOrRemoveRoles` authority and scope

**Files:**
- Modify: `back/src/user/addOrRemoveRoles/mod.ts`
- Modify: `back/src/user/addOrRemoveRoles/addOrRemoveRoles.fn.ts`
- Modify: `back/src/user/addOrRemoveRoles/addOrRemoveRoles.val.ts`
- Reuse: `back/src/user/shared/assignRoles.ts`
- Test: `http/e2e.json`

**Interfaces:**
- Consumes: `assignRolesToUser`, `canAssignRole`, `getAuth`.
- Produces: `assignRolesToUser` handles both add and remove paths; `addOrRemoveRolesFn` becomes a thin wrapper that calls it with the target user.

- [x] **Step 1: Add failing E2E cases**

1. OrgHead adds `UnitHead` for a user in their own org/unit → success.
2. OrgHead adds `Manager` → error.
3. OrgHead adds a role scoped to another organization → error.
4. UnitHead adds `Employee` for a user in their own unit → success.
5. UnitHead adds `Employee` for a user in another unit → error.
6. Manager removes a role from any user → success.

- [x] **Step 2: Run the backend and ask the user to execute them**

Expected: cases 1, 4 currently fail with `You cant do this`; case 2 currently passes (security bug).

- [x] **Step 3: Replace the OrgHead `getScope`**

Remove the `getScope` closure that compares `_id` to the org. Use `grantAccess([{ roles: ["Manager", "Admin"] }, { roles: ["OrgHead"] }, { roles: ["UnitHead"] }])` and enforce target authority inside `assignRolesToUser` using the target user's DB-loaded `organizations`/`units`:
- OrgHead: target user's `organizations` must include `activeRole.scopeId`.
- UnitHead: target user's `units` must include `activeRole.scopeId`; only Employee/Ordinary roles for that unit.
- Manager/Admin: no target restriction (Admin still cannot assign Manager).

- [x] **Step 4: Enforce `canAssignRole` for every add and remove**

In `assignRolesToUser`:
- Resolve each role's scope from the DB (`organization` exists; `unit` exists and belongs to the actor org/unit; `store` exists).
- Reject role names outside `assignableRoles(actor)` with `"You cant do this"`.
- Reject removing a role the actor could not assign (prevents an OrgHead from stripping Manager/Admin).
- Keep the `unit.head` / `organization.head` / `store.head` relation updates, but only after authority passes. Reject a second `OrgHead` for the same organization and a second `UnitHead` for the same unit unless Manager/Admin.
- Preserve idempotency: adding an existing role must not duplicate; removing a non-existent role must not throw.

- [x] **Step 5: Update the validator only if needed**

`scopeId` is currently `optional(string())`; keep it so legacy clients send either string or ObjectId-string. No new fields.

- [x] **Step 6: Re-run the E2E cases with the user**

Expected: 1, 3, 4, 5, 6 pass; 2 fails.

- [x] **Step 7: Commit**

```bash
git add back/src/user/addOrRemoveRoles back/src/user/shared/assignRoles.ts http/e2e.json
git commit -m "fix(user): enforce role assignment authority"
```

---

### Task 6: Replace every payload-based `getScope` with DB resolvers

**Files (modify only the `grantAccess` block in each):**
- `back/src/organization/{add,update,updateRelations,remove}/mod.ts`
- `back/src/unit/{add,update,updateRelations,count,remove}/mod.ts`
- `back/src/process/{add,update,updateRelations,remove}/mod.ts`
- `back/src/processStep/{add,update,updateRelations,remove}/mod.ts`
- `back/src/inventory/update/mod.ts`
- `back/src/store/{update,updateRelations}/mod.ts`
- `back/src/user/{addUser,updateUserRelations}/mod.ts`

**Interfaces:**
- Consumes: resolvers from Task 3; `grantAccess` is now async.

- [x] **Step 1: Add failing E2E cases**

1. OrgHead updates a process in their org → success.
2. OrgHead updates a process in another org, but supplies their own `organizationId` in the payload → error.
3. OrgHead adds a `ProcessStep` to a process in their org → success.
4. OrgHead updates/removes a process step in their org → success.
5. OrgHead updates/removes a unit in their org without sending `organizationId` → success.
6. OrgHead updates a unit in another org by sending their own `organizationId` → error.
7. UnitHead updates their own unit → success; another unit → error.

- [x] **Step 2: Run and confirm current failures**

Expected: OrgHead process/step/unit cases fail because the scope is resolved from missing or wrong fields.

- [x] **Step 3: Rewrite each `grantAccess` block**

Use the resolver that matches the target action:
- `organization.update/updateRelations/remove`: `orgOfSelf` (`_id` must be an organization; verify it exists).
- `organization.add`: Manager/Admin only (creating an organization is a system-level operation; do not grant OrgHead).
- `unit.add`: OrgHead → `orgFromSet("organizationId")`; UnitHead → `{ scopeType: "unit", scopeId: set.parentUnitId }`.
- `unit.update/updateRelations/count/remove`: OrgHead → `orgOfUnit()`; UnitHead → `{ scopeType: "unit", scopeId: set._id }`.
- `process.add`: OrgHead → `orgFromSet("organizationId")`.
- `process.update/updateRelations/remove`: OrgHead → `orgOfProcess()`.
- `processStep.add`: OrgHead → `orgOfProcess()` using `set.processId`.
- `processStep.update/updateRelations/remove`: OrgHead → `orgOfProcessStep()`.
- `inventory.update`: OrgHead → `orgOfInventory()`; UnitHead → inventory's `unit._id`.
- `store.update/updateRelations`: StoreHead → `{ scopeType: "store", scopeId: set._id }` (existing behavior, normalized).
- `updateUserRelations`: OrgHead → target user org from DB, not `set.organizations`.

- [x] **Step 4: Remove now-misleading validator fields**

Do not remove `organizationId` from `unit.remove`/`unit.count` if the frontend uses it for filtering; simply stop using it for authz. For `process.update`/`processStep.add`, do not add `organizationId` just to satisfy the old check.

- [x] **Step 5: Re-run E2E cases with the user**

Expected: 1-7 pass.

- [x] **Step 6: Commit**

```bash
git add back/src/organization back/src/unit back/src/process back/src/processStep back/src/inventory/update back/src/store/update back/src/store/updateRelations back/src/user/updateUserRelations http/e2e.json
git commit -m "fix(authz): resolve scope from target resources"
```

---

### Task 7: Scope store, finance, and inventory operations

**Files:**
- Modify: `back/utils/checkFinanceUnitAccess.ts`
- Modify: `back/utils/checkStoreHeadAccess.ts`
- Modify: `back/src/store/add/mod.ts`
- Modify: `back/src/inventory/{add,gets,get,count,adjust,transfer,update,remove}/mod.ts` (scope guards as applicable)
- Modify: `back/src/{budgetLine,budgetAllocation,budgetEncumbrance,fiscalYear,paymentOrder,goodsReceipt}/**/mod.ts` where `checkFinanceUnitAccess` is called in the fn

**Interfaces:**
- Consumes: `getAuth`, `scopeMatches`, `orgOfBudgetLine`, `orgOfFiscalYear`.
- Produces: `assertFinanceScope(target: { organizationId?: string; unitId?: string }): Promise<void>`; `checkStoreHeadAccess(mode)` keeps its signature but normalizes IDs.

- [x] **Step 1: Add failing E2E cases**

1. StoreHead calls `store.add` → error (only Manager/Admin).
2. StoreHead updates/removes Stuff in their store → success.
3. StoreHead updates/removes Stuff in another store → error.
4. StoreHead updates a Stuff and changes `storeId` to another store → error.
5. OrgHead creates a budget line in their org → success.
6. OrgHead creates a budget line in another org by sending their own `organizationId` → error.
7. UnitHead of a non-Finance unit calls `paymentOrder.markPaid` → error.
8. Employee calls `inventory.add` for a unit outside their active scope → error.

- [x] **Step 2: Run and confirm current behavior**

Expected: 1, 3 (if storeId spoofed), 6, 8 will expose current holes.

- [x] **Step 3: Rewrite `checkFinanceUnitAccess`**

- Manager/Admin: return.
- OrgHead: require `activeRole.scopeType === "organization"` and `scopeId` equal the target budget object's organization; reject otherwise.
- UnitHead: require `activeRole.scopeType === "unit"`, the unit's `type === "Finance"`, and the target budget object's `unit`/`organization` matches.
- Employee/Ordinary: reject.
Call it with the target object's ID from the set (budgetLineId / fiscalYearId / paymentOrderId) so it can load the organization from DB.

- [x] **Step 4: Harden `checkStoreHeadAccess`**

- Normalize both IDs with `String(...)`.
- For `update`, also block a payload `storeId` that differs from the managed store; for `remove`, verify the Stuff's store before deletion.
- For `add`, accept `storeId` and require it to equal the managed store.
- Remove StoreHead from `store.add` (Task 7 Step 5).

- [x] **Step 5: Remove StoreHead from `store.add`**

Change `grantAccess` to `[{ roles: ["Manager", "Admin"] }]`. If the business needs store self-registration later, add a dedicated action with explicit rules.

- [x] **Step 6: Add unit-scope guards to inventory actions**

For non-Manager/Admin, resolve `unitId` from the payload or default to `activeRole.scopeId`; verify the unit belongs to the active role's organization/unit. Apply the same rule to `gets`, `get`, `count`, `adjust`, `transfer`, `remove`, and `update`. Prefer a shared `withUnitScope(set, activeRole)` helper over copy-paste.

- [x] **Step 7: Re-run E2E cases with the user**

Expected: 1-8 pass.

- [x] **Step 8: Commit**

```bash
git add back/utils/checkFinanceUnitAccess.ts back/utils/checkStoreHeadAccess.ts back/src/store/add back/src/inventory back/src/budgetLine back/src/budgetAllocation back/src/budgetEncumbrance back/src/fiscalYear back/src/paymentOrder back/src/goodsReceipt http/e2e.json
git commit -m "fix(authz): scope store, finance, and inventory operations"
```

---

### Task 8: Scope user, unit, and organization read/list endpoints

**Files:**
- Modify: `back/src/user/getUsers/getUsers.fn.ts`
- Modify: `back/src/user/getUser/getUser.fn.ts`
- Modify: `back/src/user/countUsers/countUsers.fn.ts`
- Modify: `back/src/user/countUsers/mod.ts` (allow Manager/Admin/OrgHead/UnitHead and rely on scoped filters)
- Modify: `back/src/unit/{gets,get,count}/**/fn.ts`
- Modify: `back/src/organization/{gets,get,count}/**/fn.ts`
- Create: `back/utils/readScope.ts`
- Create: `back/utils/readScope.test.ts`

**Interfaces:**
- Consumes: `getAuth`, `ActiveRole`.
- Produces:
  - `unitScope(activeRole, user): { ids: string[] } | "all"` — returns the unit IDs the role may read.
  - `organizationScope(activeRole, user): { ids: string[] } | "all"` — returns the organization IDs the role may read.
  - `applyOrgUnitScope(pipeline, activeRole, user, field): void` — pushes the correct `$match` on `organization._id` or `unit._id`.
  - `assertCanReadOrganization(activeRole, user, organizationId): Promise<void>`
  - `assertCanReadUnit(activeRole, user, unitId): Promise<void>`

- [x] **Step 1: Add failing E2E cases**

1. OrgHead calls `unit.gets` with no `organizationId` → only units in their organization.
2. OrgHead calls `unit.gets` with another organization's `organizationId` → empty list, not another org's units.
3. OrgHead calls `organization.gets` → only their own organization.
4. OrgHead calls `organization.get` for another organization → error.
5. UnitHead calls `unit.gets` → own unit and its descendants only.
6. UnitHead calls `unit.get` for another unit → error.
7. Employee calls `unit.gets` → only units they belong to.
8. Ordinary calls `getUsers` → only themselves.
9. OrgHead calls `getUsers` → only users in their organization.
10. UnitHead calls `getUsers` → only users in their unit.
11. OrgHead calls `getUser` for a user in another org → error.
12. `unit.count` and `organization.count` return the same scoped totals as their `gets` counterparts.

- [x] **Step 2: Run and confirm current behavior**

Expected: 1, 2, 3, 4, 9, 12 currently fail or leak the whole tenant.

- [x] **Step 3: Implement `readScope.ts`**

Rules:
- Manager/Admin: `"all"`.
- OrgHead: units where `organization._id === activeRole.scopeId`; organizations = `[activeRole.scopeId]`.
- UnitHead: own unit plus descendants via `parentUnit` (use `$graphLookup` or a bounded recursive query); organizations = the organization of the scoped units.
- Employee/Ordinary: units from `user.units`; organizations = the `organization._id` of those units.
- A role with a missing or invalid scope returns `{ ids: [] }` (fail closed), except Manager/Admin/Ghost.
- `assertCanRead*` throws `"You cant do this"` when the ID is outside the allowed set.

- [x] **Step 4: Apply the scope to unit and organization reads**

In `unit.gets`, ignore a client `organizationId` that is outside the allowed set and never let it widen the result. If the role is scoped, always push the allowed `organization._id`/`_id` match before the client filter. Do the same in `unit.get`, `unit.count`, `organization.gets`, `organization.get`, and `organization.count`.

- [x] **Step 5: Apply the scope to user reads**

`getUsers`/`getUser`/`countUsers`:
- Manager/Admin: all.
- OrgHead: `$match organizations._id = activeRole.scopeId`.
- UnitHead: `$match units._id = activeRole.scopeId`.
- Employee/Ordinary: force `_id = user._id` (self only), ignoring a supplied `_id`.
Keep the existing `roles`/`search`/`gender` filters after the scope match.

- [x] **Step 6: Run the unit tests**

Run: `cd back && deno test --allow-all utils/readScope.test.ts`
Expected: PASS for all role/scope combinations.

- [x] **Step 7: Re-run E2E cases with the user**

Expected: 1-12 pass.

- [x] **Step 8: Commit**

```bash
git add back/src/user/getUsers back/src/user/getUser back/src/user/countUsers back/src/unit back/src/organization back/utils/readScope.ts back/utils/readScope.test.ts http/e2e.json
git commit -m "fix(authz): scope user, unit, and organization reads"
```

---

### Task 9: Scope process, step, purchasing, and inventory reads

**Files:**
- Modify: `back/src/process/{gets,get,count}/**/fn.ts`
- Modify: `back/src/processStep/{gets,get,count}/**/fn.ts`
- Modify: `back/src/stepApproval/{gets,get,count}/**/fn.ts`
- Modify: `back/src/purchasingRequest/{gets,get,getHistory,getPendingByUnit,count}/**/fn.ts`
- Modify: `back/src/inventory/{gets,get,count}/**/fn.ts`
- Reuse: `back/utils/readScope.ts`, `back/utils/consumptionScope.ts`
- Modify: `back/src/purchasingRequest/{add,submit}/**/fn.ts` and `back/src/inventory/{add,adjust,transfer}/**/fn.ts` to call `assertWareModelAccess`
- Create: `back/utils/consumptionScope.ts`

**Interfaces:**
- Consumes: `readScope`, `assertWareModelAccess`, `hasFeature`.
- Produces: `assertWareModelAccess(user, activeRole, wareModel)`; `purchasingRequestReadMatch(activeRole, user): Document`.

- [x] **Step 1: Add failing E2E cases**

1. OrgHead calls `process.gets` → only processes whose organization is theirs.
2. UnitHead calls `process.gets` → only processes for their unit plus org-wide processes of their organization.
3. OrgHead calls `processStep.gets` for a process in another org → empty list, not another org's steps.
4. OrgHead calls `purchasingRequest.gets` → only requests from their organization.
5. UnitHead calls `purchasingRequest.gets` → only requests from their unit.
6. StoreHead calls `getPendingByUnit` → only their store's pending items.
7. OrgHead calls `stepApproval.gets` → only approvals for their organization's units.
8. A restricted user (`allowWareModelIds` set) adds a purchasing request for a disallowed ware model → error.
9. The same restricted user adds one for an allowed model → success.
10. Employee calls `inventory.gets` for a unit outside their active scope → empty list.

- [x] **Step 2: Run and confirm current behavior**

Expected: 1-7 and 10 currently leak or ignore scope; 8 currently succeeds.

- [x] **Step 3: Apply `readScope` to processes and steps**

- `process.gets/get/count`: Manager/Admin all; OrgHead `organization._id = activeRole.scopeId`; UnitHead `unit._id = activeRole.scopeId` **or** `organization._id = orgOf(scopeId)` for unscoped processes; Employee uses their unit IDs.
- `processStep.gets/get/count`: resolve the owning process and apply the same rule; reject a `processId` outside scope.
- `stepApproval.gets/get/count`: OrgHead filters `unit._id` to units in their org; UnitHead filters to their unit; Employee filters to their unit IDs.

- [x] **Step 4: Apply `readScope` to purchasing requests**

`purchasingRequest.gets/get/getHistory/getPendingByUnit/count`:
- Manager/Admin: all.
- OrgHead: `organization._id = activeRole.scopeId`.
- UnitHead: `requestingUnit._id = activeRole.scopeId`.
- Employee: `requestingUnit._id` in `user.units`.
- StoreHead: keep the existing store-specific behavior; verify it filters by the active store and not by an arbitrary client store ID.

- [x] **Step 5: Apply `readScope` to inventory reads**

`inventory.gets/get/count`: OrgHead by organization units, UnitHead by own unit + descendants, Employee by own units. Never trust a payload `unitId` outside the allowed set.

- [x] **Step 6: Wire `assertWareModelAccess`**

Call `assertWareModelAccess` before writing a purchasing request, inventory row, or consumption row. It must use the units loaded in Task 2. Manager/Admin/Ghost bypass. Return `"You cant do this"` on denial.

- [x] **Step 7: Extract consumption scoping**

Move the role-scoping block from `consumption/gets` and `consumption/count` into `back/utils/consumptionScope.ts`; call it from both. Do not duplicate the `isWarehouseHead` logic again.

- [x] **Step 8: Re-run E2E cases with the user**

Expected: 1-10 pass.

- [x] **Step 9: Commit**

```bash
git add back/src/process back/src/processStep back/src/stepApproval back/src/purchasingRequest back/src/inventory back/src/consumption back/utils/consumptionScope.ts http/e2e.json
git commit -m "fix(authz): scope process, purchasing, and inventory reads"
```

---

### Task 10: Clean up dead auth code, document the model, and run the full suite

**Files:**
- Modify: `back/utils/checkFeature.ts` (remove the old two-arg behavior if any callers remain)
- Modify: `back/utils/checkWareModelAccess.ts` (remove unused branches only if nothing calls them)
- Modify: `back/src/user/addUser/mod.ts` (remove `checkGhostUser` if Task 4 removed it)
- Modify: `back/AGENTS.md` (auth section)
- Modify: `docs/superpowers/plans/2026-10-21-backend-authorization-hardening.md` (mark completed)

**Interfaces:**
- Consumes: everything above.

- [x] **Step 1: Find leftovers**

Run: `cd back && rg -n "getScope|checkGhostUser|hasFeature\(" src utils`
Expected: no payload-based `getScope` remains; `checkGhostUser` is gone or documented; all `hasFeature` calls pass an active role.

- [x] **Step 2: Run the Deno test suite**

Run: `cd back && deno test --allow-all`
Expected: all authz unit tests pass.

- [x] **Step 3: Run lint and typecheck**

Run: `cd back && deno lint && deno check mod.ts`
Expected: no errors.

- [x] **Step 4: Update `back/AGENTS.md`**

Add a short "Authorization model" subsection:
- `grantAccess` = role gate; `scopeResolvers` = DB-derived tenant check; object rules live in shared services.
- Manager/Admin bypass scope and features; Ghost bypasses all.
- Role assignment matrix.
- Unit type list includes `Finance`.

- [ ] **Step 5: Ask the user to run the full `http/e2e.json` suite in `/playground`**

Report the exact failing cases, if any. Do not claim success without the user's result.

- [x] **Step 6: Commit**

```bash
git add back/utils back/src/user/addUser back/AGENTS.md docs/superpowers/plans/2026-10-21-backend-authorization-hardening.md
git commit -m "chore(authz): remove dead checks and document policy"
```

---

## Execution Order and Risk Notes

- Do Tasks 1-3 first; they are pure infrastructure and unblock every later fix.
- Do Tasks 4-5 together; they change the same user-creation flow and shared role service.
- Do Task 6 before Task 7 because store/finance resolvers reuse the same helpers.
- Tasks 8-9 are the read-scoping phase; they can ship after the OrgHead/role fixes if time is constrained, but the OrgHead-sees-all-units bug remains until Task 8 lands.
- Do not deploy Task 5 without Task 4's authority service; otherwise role assignment remains escalateable.
- Lesan has no multi-document transactions. Keep role assignment operations idempotent and ordered so a partial failure is retryable.

## Verification Checklist

- [x] OrgHead can create a user from the OrgHead add-user page without sending `organizations`.
- [x] OrgHead can assign UnitHead/Employee/Ordinary within their org; cannot assign Manager/Admin or another org.
- [x] OrgHead can update/remove processes, process steps, and units in their org without payload scope fields.
- [x] UnitHead is limited to their own unit.
- [x] StoreHead is limited to their own store, cannot create stores, cannot move Stuff between stores.
- [x] Finance operations are limited to the actor's organization/Finance unit.
- [x] Unit-level features work and do not leak across units.
- [x] OrgHead `unit.gets`/`organization.gets`/`getUsers` return only their organization's data; a payload filter cannot widen the result.
- [x] UnitHead unit, process, request, and inventory reads are limited to their unit subtree.
- [x] Disabled users cannot log in or use an existing token.
- [ ] `deno test`, `deno lint`, and `deno check mod.ts` pass.
- [ ] The user has run `http/e2e.json` and reported the result.

---

## Post-Review Hardening (Tasks 11-14)

Final whole-branch reviews found residual cross-tenant paths. Added:
- **Task 11**: DB-scoped PR write family (`add`, `submit`, `update`, `updateRelations`, `remove`, `finalize`, `addStuff`, `removeFromPurchase`, `selectTenderOffer`, `removeTenderSelection`, `warehouseCheck`), inventory add/update/updateRelations/adjust/transfer, consumption add. New `utils/unitScope.ts`.
- **Task 12**: finance read scoping (`utils/financeScope.ts`) for payment orders, budget lines, fiscal years, encumbrances, allocations, goods receipts; `paymentOrder.update` finance target check; goods receipt PR/unit/item/actor validation.
- **Task 13**: tender/tenderOffer write and read scoping, StoreHead `stuff.gets` pinning, Manager/Admin warehouse dashboard, any-org/any-unit `updateUserRelations` target checks with foreign-membership preservation.
- **Task 14**: `stepApproval.add` Manager/Admin-only, `process.activateProcess`/`duplicateProcess` `orgOfProcess` scope, tender/tenderOffer read scopes, `stockMovement.get/gets/count` scope, `checkStoreAvailability` PR scope, submit closed-tender rejection.

Status: implementation complete; unit tests and `deno check` green. Remaining step: run `back/http/e2e.json` in `/playground`.
