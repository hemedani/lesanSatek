# LesanSatek Backend TODO.md

**Project**: LesanSatek Backend – Organizational Process Management + Warehouse/Inventory System
**Goal**: Deno + Lesan backend with MongoDB for organizational process management and warehouse/inventory management
**Tech stack**: Deno + Lesan framework + MongoDB + JWT auth + File upload support

**Workflow rules**:
- Always read `.agents/TODO/CONTINUE.md` first as your system prompt.
- Work **one step at a time** from this TODO.md.
- After finishing a step: mark it `[x]`, add any notes, then run the exact git commit procedure described in root AGENTS.md.
- Never skip steps. Never use `git reset`.
- Update this TODO.md and commit after every single step.
- Use **Deno tasks** for all commands.
- Follow Lesan framework patterns and best practices from back/AGENTS.md.
- Relations are one-direction: Define relations only on the owning model, use `relatedRelations` for reverse relations.

## Phase 1: Project Skeleton
- [x] Create `back/` directory structure (models, src, utils, declarations, uploads)
- [x] Create `deno.json` with Lesan dependencies
- [x] Create `mod.ts` entry point with MongoDB connection and server config
- [x] Create `utils/` (context, grantAccess, setToken, setUser, throwError, createUpdateAt, pagination)
- [x] Create `models/` with all core models
- [x] Create `src/` action modules for all models
- [x] Create Dockerfile for backend
- [x] Create `.agents/TODO/CONTINUE.md` and `.agents/TODO/TODO.md`
- [ ] Generate declarations/ for frontend type safety
- [ ] Test backend locally with `deno task bc-dev`
- [ ] Verify API playground access

## Phase 2: Core Models (Refactored)
- [x] User model (with auth, JWT, bcrypt, unique email index, position, isActive, units)
- [x] File model (for attachments, type-based directory routing)
- [x] Tag model (with registrar relation, color, icon)
- [x] Organization model (with logo, creator — departments relation removed)
- [x] ~~Department model~~ — **DELETED** (redundant; Unit has organization directly)
- [x] ~~Employee model~~ — **DELETED** (merged into User; User has position, isActive, units)
- [x] Unit model (with organization, parentUnit for tree, head as User)
- [x] Process model (with organization, createdBy, assignedUnits for scope)
- [x] ProcessStep model (with groupsOperator, assigneeGroups via ProcessStepAssigneeGroup)
- [x] ProcessStepAssigneeGroup model (NEW — OR/AND grouping of units per step)
- [x] StepApproval model (NEW — per-unit per-step approval tracking)
- [x] PurchasingRequest model (with process, requester, unit, attachments, stepApprovals, status tracking)

## Phase 3: Auth & CRUD Acts
- [x] User auth acts (login, register, tempUser, getMe)
- [x] User CRUD acts (addUser, getUser, getUsers, updateUser, updateUserRelations, removeUser, countUsers, dashboardStatistic)
- [x] File CRUD acts (uploadFile, get, gets, getFiles, update)
- [x] Tag CRUD acts (add, get, gets, update, remove, count)
- [x] Organization CRUD acts (add, get, gets, update, updateRelations, remove, count)
- [x] ~~Department CRUD acts~~ — **DELETED** (model eliminated)
- [x] ~~Employee CRUD acts~~ — **DELETED** (merged into User)
- [x] Unit CRUD acts (add, get, gets, update, updateRelations, remove, count)
- [x] Process CRUD acts (add, get, gets, update, updateRelations, remove, count)
- [x] ProcessStep CRUD acts (add, get, gets, update, updateRelations, remove, count)
- [x] ProcessStepAssigneeGroup CRUD acts (add, get, gets, update, updateRelations, remove, count) — NEW
- [x] StepApproval CRUD acts (add, get, gets) — NEW
- [x] PurchasingRequest CRUD acts (add, get, gets, update, updateRelations, remove, count)

## Phase 4: Testing & Polish
- [ ] Test all endpoints locally with `deno task bc-dev`
- [ ] Write integration tests for core workflows
- [ ] Test relation management (add/remove relations)
- [ ] Test file upload functionality
- [ ] Docker build testing
- [ ] Production deployment preparation
- [ ] Generate type declarations

## Phase 5: Warehouse/Inventory Domain Models (Complete)
### 5A: Model Definitions
- [x] Create `models/state.ts` - State/province model
- [x] Create `models/city.ts` - City model with state relation
- [x] Create `models/manufacturer.ts` - Manufacturer model
- [x] Create `models/wareType.ts` - Top-level classification model
- [x] Create `models/wareClass.ts` - Second-level classification model
- [x] Create `models/wareGroup.ts` - Third-level classification model
- [x] Create `models/classGroup.ts` - M:N join between WareClass and WareGroup
- [x] Create `models/wareModel.ts` - Fourth-level classification model
- [x] Create `models/ware.ts` - Actual product model
- [x] Create `models/stuff.ts` - Store inventory model
- [x] Create `models/store.ts` - Store/seller model (merged with StoreDetails)
- [x] Update `models/excludes.ts` with all new model excludes
- [x] Update `models/mod.ts` to export all new models

### 5B: CRUD Action Modules
- [x] Create `src/state/` actions (add, get, gets, update, remove, count)
- [x] Create `src/city/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/manufacturer/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/wareType/` actions (add, get, gets, update, remove, count)
- [x] Create `src/wareClass/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/wareGroup/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/classGroup/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/wareModel/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/ware/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/stuff/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Create `src/store/` actions (add, get, gets, update, updateRelations, remove, count)
- [x] Update `src/mod.ts` to initialize all new action setups

### 5C: Integration
- [x] Update `mod.ts` to initialize all new models
- [x] Merge `StoreDetails` fields into `Store` model (eliminated separate model)
- [x] Fix pre-existing import bugs in model files
- [x] Verify project compiles with `deno check mod.ts`
- [ ] Generate type declarations
- [ ] Test all new endpoints

## Phase 6: Organizational Refactor (Complete)
- [x] Merge Employee into User (User now has position, isActive, units)
- [x] Delete Employee model and all Employee actions
- [x] Eliminate Department (Unit has organization directly, denormalized)
- [x] Delete Department model and all Department actions
- [x] Remove `DeptHead` from user levels

## Phase 7: Process Engine Redesign (Complete)
- [x] Create ProcessStepAssigneeGroup model (OR/AND grouping of units per step)
- [x] Create StepApproval model (per-unit per-step tracking)
- [x] Update ProcessStep: remove assignedDepartment/assignedUnit/assignedUser, add groupsOperator
- [x] Update Process: add assignedUnits
- [x] Update PurchasingRequest: add stepApprovals relation
- [x] Create stepEvaluator utility (`utils/stepEvaluator.ts`)
- [x] Create all CRUD actions for ProcessStepAssigneeGroup and StepApproval
- [x] Update process/processStep/purchasingRequest actions

## Phase 8: Multi-Role Auth System (Complete)
- [x] Replace single `level` with `roles` array on User model (`{ roleId, name, scopeType?, scopeId? }`)
- [x] Add `isGhost` boolean (replaces former "Ghost" level)
- [x] Create `utils/activeRole.ts` with `activeRoleMixin` validator spread + `stripActiveRole` helper
- [x] Rewrite `utils/grantAccess.ts` for multi-role with `activeRoleId` + scope support
- [x] Update `utils/setToken.ts` to include `roles` in JWT payload
- [x] Update `utils/context.ts` to remove unused `isInFeatures`/`isInLevels`
- [x] Update all user actions (login, register, tempUser, addUser, updateUser, etc.)
- [x] Remove `"DeptHead"` references from unit, purchasingRequest, stepApproval actions
- [x] Add auth + `activeRoleMixin` to all read actions (get/gets/count) across all models
- [x] Add `activeRoleMixin` to all write action validators
- [x] Strip `activeRoleId` from all action fns that spread/pass `set` to DB
- [x] Verify clean compile with `deno check mod.ts`
- [x] Verifiy all endpoints (unit CRUD with type + attributes, type filter, count, sorted gets, update) locally

## Phase 9: Unit Type + Attribute Fields (Complete)
- [x] Add `type` enum to `unit_pure` (General|Warehouse|Logistics|Production|Administration|Expert)
- [x] Add attribute fields to `unit_pure` (address, phone, email, warehouseCapacity, hasColdStorage, fleetSize, serviceRadius)
- [x] Update all unit action validators to accept `type` + attributes
- [x] Update all unit action fns to handle `type` + attributes
- [x] Add `type` filter/sort to gets/count
- [x] Add UnitHead to grantAccess for add/update/updateRelations/remove/count (scoped on unit _id)
- [x] Test all endpoints locally (add, get, gets, update, count with type filter/sort)
