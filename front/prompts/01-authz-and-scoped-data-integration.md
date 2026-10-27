# Frontend Task 01: Align UI with Hardened Backend Authorization and Scoped Reads

## Context

The backend is being hardened on branch `feat/authz-hardening`. The goal is to make authorization and tenant isolation server-side concerns. The frontend's job is to integrate with the new behavior, not to enforce security by hiding or filtering data in the browser.

Read these backend changes before editing:

- `grantAccess` now enforces role + tenant scope from MongoDB, not from request payload IDs.
- `addUser` now accepts a `roles` array. An OrgHead does **not** need to send `organizations`; the backend assigns the actor's organization automatically.
- `addOrRemoveRoles` now enforces a role-authority matrix.
- Read/list endpoints (`unit.gets`, `unit.get`, `unit.count`, `organization.gets`, `organization.get`, `organization.count`, `getUsers`, `getUser`, `countUsers`, `process.gets`, `processStep.gets`, `stepApproval.gets`, `purchasingRequest.gets`, `inventory.gets`) now return only the active role's scoped data.
- Disabled users are rejected at login and by `setUser`.

The active role ID is already injected by the server actions (`getActiveRoleId`). Keep using those actions; do not send a different role scope or a client-chosen `organizationId` as a permission claim.

## Non-Negotiable Rules

1. **Do not implement security filtering in the client.** Hiding a row or filtering an array after `getUnits`/`getOrganizations` is a UX measure only. The backend is the boundary.
2. **Never "fix" a 403 by changing the payload.** If the backend returns `You cant do this`, show a clear message. Do not retry with another `organizationId`, `unitId`, `storeId`, or role.
3. **Do not cache scoped lists across active-role changes.** If a list is stored in Zustand, React Query, or a module-level cache, include `activeRoleId` in the cache key or clear/refetch it when the active role changes.
4. **Do not assume a list is global.** `getUnits()` and `getOrganizations()` may now return one item, a subtree, or an empty list depending on the active role.

## Required Changes

### 1. OrgHead add-user page

Files: `src/app/orghead/users/add/page.tsx`, `src/app/actions/user/addUser.ts`

- Keep sending `roles` to `addUser`; the backend now accepts them.
- Stop sending `organizations` from this page. The backend assigns the OrgHead's organization.
- If the page currently has an organization picker, remove it for OrgHead or lock it to the active organization. Do not let an OrgHead choose another organization.
- Restrict the role picker to roles an OrgHead may assign:
  - allowed: `OrgHead`, `UnitHead`, `Employee`, `Ordinary`
  - hidden/disabled: `Manager`, `Admin`, `StoreHead`
- For `scopeType: "unit"`, populate `scopeId` only from `getUnits()` (which is now scoped to the OrgHead's organization) and pass the selected unit ID. Do not fetch units with an arbitrary organization filter.
- For `scopeType: "organization"`, preselect the active organization; do not offer other organizations.
- Show the backend error message on failure. The expected failure for a forbidden role is `You cant do this`.

### 2. OrgHead edit-user / roles page

Files: `src/app/orghead/users/[id]/page.tsx`

- Replace the hardcoded all-roles `roleOptions` with a role list derived from the active role:
  - OrgHead may add: `OrgHead`, `UnitHead`, `Employee`, `Ordinary`
  - OrgHead may remove: only roles they are allowed to assign
- The scope picker must use scoped `getOrganizations()` and `getUnits()` results. For OrgHead, the organization scope is the active organization, not a free choice.
- Do not show a role/scope combination the backend will reject. If the user picks a unit scope, only list units returned by `getUnits()`.
- After a successful `addOrRemoveRoles`, refresh the user and the scoped lists. Do not merge the old list with the new one.
- Preserve the existing confirmation dialog for role removal.

### 3. Admin user-role UI

Files: `src/app/admin/users/[id]/roles/user-roles-client.tsx`, `src/app/admin/users/[id]/page.tsx`, `src/app/admin/users/add/page.tsx`

- Admin cannot assign or remove the `Manager` role. Hide `Manager` from the assignable options for an Admin actor and show the backend error if it is attempted.
- Manager keeps the full role list.
- Keep Manager/Admin organization-wide scope selection; scoped reads still return all organizations for these roles.
- Do not add Manager to an Admin's own roles through this UI.

### 4. OrgHead unit and process pages

Files: `src/app/orghead/units/**`, `src/app/orghead/processes/**`, `src/components/process/**`

- `getUnits()` now returns only units the active role may read. Use the returned list directly.
- Do not call `getUnits()` with another organization's `organizationId` to build a picker. If a page needs an organization filter, use the active organization for OrgHead.
- For `processStep` assignee pickers, list only units returned by `getUnits()`; the backend rejects units outside the process's organization.
- If the page shows a unit tree, build it from the scoped list. Do not merge in a previously cached global list after switching roles.
- If the page has an "add organization" action for OrgHead, remove or disable it: organization creation is Manager/Admin only.

### 5. Counts and list headers

Files: `src/app/orghead/users/page.tsx` and any page calling `countUsers`/`unit.count`/`organization.count`

- Remove hardcoded `activeRoleId: ""` from count calls; the server action already injects the real active role. If a caller bypasses the server action, pass the active role ID explicitly.
- Counts must use the same scoped backend results as the lists. Do not compute counts from a client-side full list.
- If a count returns empty/zero because the role has no scope, show zero; do not fall back to an unscoped request.

### 6. Role switching

Files: wherever the header role selector lives (`src/components/**`, `src/lib/client-active-role*`)

- After an active-role change, force a refetch of:
  - units
  - organizations
  - users
  - processes
  - purchasing requests
  - inventory
- If lists are cached outside the page component, include `activeRoleId` in the key or clear the cache on role change.
- A user with both Manager and OrgHead roles must see Manager data after selecting Manager and scoped OrgHead data after selecting OrgHead.

### 7. Error handling

- Treat `You cant do this`, `Active role not found`, and `activeRoleId is required` as authorization failures.
- Show a localized toast/inline error, not a generic "network error".
- Do not retry authorization failures automatically.
- If the backend returns a scope-specific message (`Only the head of a Finance unit...`, `You can only manage stuff belonging to your own store`, etc.), surface it as-is or map it to a localized message.

## Out of Scope

- Do not change backend files in this task.
- Do not add client-side permission tables that duplicate the backend role matrix beyond the UI options listed above.
- Do not regenerate or hand-edit `src/types/declarations/selectInp.ts` unless the backend generated types require it. If regeneration is needed, run the backend type-generation flow and sync the declarations rather than editing them manually.
- Do not change unrelated styling or page layouts.

## Acceptance Criteria

- OrgHead creates a user with `OrgHead`, `UnitHead`, `Employee`, or `Ordinary` role without an `organizations` field → success.
- OrgHead cannot select `Manager`, `Admin`, or `StoreHead` in the add/edit user UI, and a forced request returns a visible error.
- OrgHead `getUnits()`/`getOrganizations()`/`getUsers()` pages show only their organization's data.
- UnitHead unit/process/request/inventory pages show only their unit subtree.
- Admin role UI does not offer `Manager`.
- Switching active roles refetches scoped lists; no stale cross-role data remains.
- 403 responses show a clear message and never trigger a payload-changing retry.
- `pnpm lint` passes. Run `pnpm build` if the change touches generated types or page boundaries.

## Verification Notes

- The backend must be running on the hardened branch for manual verification.
- Test with at least three accounts/roles: Manager, OrgHead (with an organization scope), and UnitHead (with a unit scope).
- Verify the OrgHead add-user flow end to end: create user → assign unit scope → reload → confirm roles and org membership.
- Report any backend response that does not match the expected scoped behavior; do not patch around it in the frontend.
