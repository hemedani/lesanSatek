# New Role Management System — Migration TODO

> Based on `new_role_management.md` — sync frontend with refactored backend role/relation system.

## Checklist

### Phase 1 — New Server Action
- [ ] Create `src/app/actions/user/addOrRemoveRoles.ts`

### Phase 2 — Fix Field Selections in Server Actions
- [ ] `auth/getMe.ts` — `organization`→`organizations`, remove `headedUnit`
- [ ] `auth/login.ts` — `organization`→`organizations`, remove `headedUnit`
- [ ] `user/getUser.ts` — `organization`→`organizations`
- [ ] `user/getUsers.ts` — `organization`→`organizations`

### Phase 3 — Auth Store
- [ ] `stores/authStore.ts` — Remove `headedUnit`, `organization`→`organizations`

### Phase 4 — Layout: Role Selector
- [ ] `components/layout/role-selector.tsx` — Use `user.organizations[]` + roles parsing

### Phase 5 — Layout: Panel Context
- [ ] `components/layout/panel-context.tsx` — Remove `headedUnit`, use `organizations`

### Phase 6 — Add User Form
- [ ] `admin/users/add/page.tsx` — Fix payload to send `organizations: [...]`

### Phase 7 — User Relations Page
- [ ] `admin/users/[id]/relations/page.tsx` — `organization`→`organizations` array

### Phase 8 — Edit User Page
- [ ] `admin/users/[id]/page.tsx` — Remove roles section, add link to `/roles`

### Phase 9 — New Roles Management Page
- [ ] Create `admin/users/[id]/roles/page.tsx`

### Phase 10 — User List
- [ ] `admin/users/page.tsx` — `organization`→`organizations`
- [ ] `admin/users/users-client.tsx` — `organization`→`organizations`

### Phase 11 — Unit Relations (Two-Step Head)
- [ ] `admin/units/[id]/relations/page.tsx` — Two-step via `addOrRemoveRoles`

### Phase 12 — Verify
- [ ] TypeScript check
- [ ] Lint
