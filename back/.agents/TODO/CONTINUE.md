You are an expert full-stack TypeScript/Deno developer working exclusively on the **LesanSatek Backend** (organizational process management + warehouse/inventory management system).

**Project Context**:
- Read `back/AGENTS.md` for complete backend architecture, conventions, Lesan framework patterns, and tech stack.
- Read root `AGENTS.md` and `.agents/TODO/TODO.md` for full project context.
- Tech: Deno + Lesan framework + MongoDB + djwt + File upload support.
- Goal: Multi-organization process management system with visual process builder, unit-tree hierarchy (Organization → Unit tree via parentUnit/subUnits), OR/AND-based process step assignment, purchasing request workflow engine, AND a full warehouse domain with product classification hierarchy (WareType → WareClass → WareGroup → WareModel → Ware), manufacturer management, store/seller management, and inventory (Stuff) tracking.

**Strict Rules**:
- ALWAYS work **one tiny step at a time** from `.agents/TODO/TODO.md`. Never jump ahead.
- After completing a step:
  1. Mark it `[x]` in `.agents/TODO/TODO.md` (add short note if needed).
  2. Run the exact Git commit procedure described in root AGENTS.md (Gitmoji + conventional commits, atomic commits, no git reset ever).
  3. Tell the user exactly what was done and what the next step is.
- Use **Deno tasks** for all commands.
- Never add unnecessary console.log, unused imports, or complex code. Follow clean architecture.
- Backend responses are wrapped in `{ success: boolean, body: data }`.
- Follow Lesan framework patterns strictly (see back/AGENTS.md for complete documentation).
- Always use proper validation with Zod-like schemas.
- Always generate type declarations for frontend after adding new models.
- **Lesan Relations are One-Direction**: Define relations only on the owning model, use `relatedRelations` for reverse relations. Avoid bidirectional definitions to prevent inconsistencies.
- Use `objectIdValidation` for ObjectId fields in validators.

**Lesan Framework Patterns** (see back/AGENTS.md for complete docs):
- Model definition with pure fields and relations (one-direction only)
- Action functions (add, get, gets, update, updateRelations, remove, count)
- Validator schemas with `set` and `get` objects
- Relationship management with `addRelation` and `removeRelation`
- Text search with MongoDB text indexes

**Current Status**:
- ✅ Phase 1 (Project Skeleton): 90% complete
- ✅ Phase 2 (Core Models): Redesigned — Employee merged into User, Department eliminated, Process redesigned with OR/AND logic
- ✅ Phase 3 (Auth & CRUD Acts): Updated to match new models — multi-role auth with activeRoleId implemented
- ✅ Phase 4 (Testing & Polish): In progress — some endpoints tested locally
- ✅ Phase 5 (Warehouse Domain): Complete (unaffected by org changes)
- ✅ Phase 8 (Multi-Role Auth): Complete
- ✅ Phase 9 (Unit Type + Attributes): Complete
- ✅ **Architectural Refactors**: Employee→User merge, Department elimination, Process OR/AND redesign, Multi-role auth system, Unit type enum + attribute fields

**Architectural Changes (Session Summary)**:

1. **Employee merged into User** — User now has `position`, `isActive`, `units` relation (no separate Employee model).
2. **Department eliminated** — Unit has `organization` directly (denormalized on all units). Organization → Unit tree via parentUnit/subUnits.
3. **Process redesigned** — Steps assigned to units via ProcessStepAssigneeGroup with OR/AND logic. Process has `assignedUnits` for scoping.
4. **StepApproval model** — Tracks per-unit, per-step approval decisions on PurchasingRequests.
5. **Multi-Role Auth System** — Replaced single `level` with `roles` array (`{ roleId, name, scopeType?, scopeId? }`). Auth via `activeRoleId` in body. Ghost is `isGhost` boolean. Added `utils/activeRole.ts`.
6. **Deleted models**: `employee.ts`, `department.ts` and their entire `src/` action directories.
7. **New models**: `processStepAssigneeGroup.ts`, `stepApproval.ts` and their action directories.
8. **New utilities**: `utils/stepEvaluator.ts` (step status eval), `utils/activeRole.ts` (activeRoleId mixin for validators).
9. **Unit Type Enum + Attribute Fields** — Added `type` enum (General|Warehouse|Logistics|Production|Administration|Expert) and optional attribute fields (address, phone, email, warehouseCapacity, hasColdStorage, fleetSize, serviceRadius) directly on `unit_pure`. No new model needed. UnitHead granted access to add/update/remove own units.

**Product Classification Hierarchy** (for reference during implementation):
1. **WareType** → top-level (e.g. "laboratory equipment")
2. **WareClass** → second-level, belongs to WareType (e.g. "hematology")
3. **WareGroup** → third-level, belongs to WareType, M:N with WareClass via ClassGroup (e.g. "kit")
4. **WareModel** → fourth-level, belongs to WareType + WareClass + WareGroup (e.g. "TSH Kit")
5. **Ware** → actual product, links to all 4 + Manufacturer (e.g. "TSH Kit ZistShimi")
6. **Stuff** → store inventory of a Ware at a Store

**Key Patterns**:
- Denormalized hierarchy in Ware, Stuff, and Unit (wareType, wareClass, wareGroup, wareModel, organization relations) for query efficiency
- Pricing logic: Stuff uses absolute price OR percentage markup on Ware.price
- Store has all fields in one model (no separate StoreDetails), StoreHead is one-to-one with User
- Store supports WareTypes via M:N relation
- Process steps use OR/AND logic via ProcessStepAssigneeGroup + groupsOperator on ProcessStep
- Step evaluation utility: `utils/stepEvaluator.ts` (`evaluateStepStatus()`)

**Next Session Prompt**:
Continue with next unchecked step from `.agents/TODO/TODO.md`. The next tasks are: generate type declarations for frontend, write integration tests, Docker build testing, and production deployment preparation. Current backend compiles cleanly with `deno check mod.ts`. The Unit type enum and attribute fields have been added and tested locally (all endpoints passing).

**Backend Structure**:
```
back/
├── deno.json               # Deno configuration
├── mod.ts                  # Main entry point
├── Dockerfile              # Multi-stage Docker config
├── models/                 # Model definitions
│   ├── mod.ts              # Re-exports
│   ├── excludes.ts         # Field exclusion lists
│   ├── user.ts             # User model (with position, isActive, units)
│   ├── file.ts             # File model
│   ├── tag.ts              # Tag model
│   ├── organization.ts     # Organization model
│   ├── unit.ts             # Unit model (tree hierarchy, has organization directly)
│   ├── process.ts          # Process model (with assignedUnits)
│   ├── processStep.ts      # ProcessStep model (with groupsOperator)
│   ├── processStepAssigneeGroup.ts  # OR/AND group model (NEW)
│   ├── stepApproval.ts     # Per-unit approval model (NEW)
│   ├── purchasingRequest.ts # PurchasingRequest model (with stepApprovals)
│   ├── state.ts            # State model
│   ├── city.ts             # City model
│   ├── manufacturer.ts     # Manufacturer model
│   ├── wareType.ts         # WareType model
│   ├── wareClass.ts        # WareClass model
│   ├── wareGroup.ts        # WareGroup model
│   ├── classGroup.ts       # ClassGroup M:N join model
│   ├── wareModel.ts        # WareModel model
│   ├── ware.ts             # Ware model
│   ├── stuff.ts            # Stuff inventory model
│   └── store.ts            # Store model
├── src/                    # API implementations
│   ├── mod.ts              # Setup orchestrator
│   ├── user/               # User actions (12 actions)
│   ├── file/               # File actions
│   ├── tag/                # Tag actions
│   ├── organization/       # Org actions
│   ├── unit/               # Unit actions (with organizationId)
│   ├── process/            # Process actions (with assignedUnitIds)
│   ├── processStep/        # ProcessStep actions (with groupsOperator)
│   ├── processStepAssigneeGroup/  # ProcessStepAssigneeGroup actions (NEW)
│   ├── stepApproval/       # StepApproval actions (NEW)
│   ├── purchasingRequest/  # PurchasingRequest actions
│   ├── state/              # State actions
│   ├── city/               # City actions
│   ├── manufacturer/       # Manufacturer actions
│   ├── wareType/           # WareType actions
│   ├── wareClass/          # WareClass actions
│   ├── wareGroup/          # WareGroup actions
│   ├── classGroup/         # ClassGroup actions
│   ├── wareModel/          # WareModel actions
│   ├── ware/               # Ware actions
│   ├── stuff/              # Stuff actions
│   └── store/              # Store actions
├── .agents/                # Agent instructions
│   └── TODO/
│       ├── CONTINUE.md     # Session continuation prompt
│       └── TODO.md         # Task list
├── declarations/           # Generated types
├── uploads/                # File uploads
└── utils/                  # Utilities (context, grantAccess, activeRole, setToken, setUser, stepEvaluator, etc.)
```

**Important Reminders**:
- **Auth flow**: Token in `token` header → JWT decoded by `setTokens` → Full user fetched by `setUser` → `activeRoleId` read from `body.details.set` → `grantAccess` resolves the role and checks permissions.
- **`activeRoleMixin`** (from `utils/activeRole.ts`) must be spread into every authenticated action's validator `set` object.
- **Action fns** using `...rest` from `set` must include `activeRoleId` in the destructure to prevent it from reaching the DB.
- **Public endpoints** (no auth): `login`, `register`, `tempUser`. `getMe` requires auth but no `activeRoleId`.
- **Ghost bypass**: `user.isGhost === true` skips all auth checks.
- Relations are one-direction: Define on owning model, use `relatedRelations` for reverse.
- Unit tree hierarchy: parentUnit → subUnits via relatedRelations; organization is denormalized on ALL units.
- Employee was merged into User — User has position, isActive, units (no Employee model exists).
- Department was eliminated — Organization → Unit tree (no Department model exists).
- Process Steps use OR/AND logic via ProcessStepAssigneeGroup (operator) + ProcessStep.groupsOperator.
- Step evaluation: use `utils/stepEvaluator.ts:evaluateStepStatus()`.
- Process Steps ordered by `order` field ascending.
- Purchasing Requests track currentStep number and status lifecycle; approvals tracked via StepApproval model.
- Always separate pure field updates from relationship updates.
- Use `addRelation`/`removeRelation` for relationships, never manual updates.
- Product hierarchy is denormalized in Ware and Stuff for efficient querying.
- Unit.organization is denormalized (set on ALL units) for efficient querying.
- Generate type declarations after adding/modifying models.
- Follow the exact Lesan framework patterns from back/AGENTS.md.
