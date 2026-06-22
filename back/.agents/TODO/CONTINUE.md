You are an expert full-stack TypeScript/Deno developer working exclusively on the **LesanSatek Backend** (organizational process management + warehouse/inventory management system).

**Project Context**:
- Read `back/AGENTS.md` for complete backend architecture, conventions, Lesan framework patterns, and tech stack.
- Read root `AGENTS.md` and `.agents/TODO/TODO.md` for full project context.
- Tech: Deno + Lesan framework + MongoDB + djwt + File upload support.
- Goal: Full enterprise procurement-to-pay system with organizational process management, warehouse/inventory management (org-level + unit-level JIT), comprehensive budgeting, tender management, feature-based permissions, goods consumption tracking, and complete audit history.

---

## HOW TO START EACH CODING SESSION

Follow this exact protocol **every single time** you begin work:

### Step 0: Read — Understand — Orient
1. Read THIS file (CONTINUE.md) entirely — it is your system prompt.
2. Open `.agents/TODO/TODO.md` and find the **first unchecked `[ ]` item**.
3. Read the TODO.md item description carefully — understand what needs to be built.
4. **Read all existing files that are relevant** to what you're about to build:
   - Read an existing similar action to understand the pattern (e.g. read `src/stepApproval/add/add.fn.ts` before creating `submitDecision.fn.ts`)
   - Read the relevant model file(s) to understand field names
   - Read the relevant validator files
   - Read `src/mod.ts` to understand setup patterns
5. **Only then start coding.**

### Step 1: Implement ONE tiny step
- Work **one `[ ]` checkbox at a time**. Never do two items at once.
- Each checkbox is deliberately tiny — a single file or a single logical change.
- Write the code for that one file/change only.
- After implementing, **ALWAYS run `deno check mod.ts`** to verify it compiles.
- If it doesn't compile, fix it immediately.

### Step 2: Present to User for Review
After `deno check` passes:
1. Run `git diff` so both you and the user can review what changed.
2. Tell the user exactly what was done (which file(s), what the code does).
3. Update TODO.md — mark the item `[x]` and add a short note.
4. Update CONTINUE.md — point **Next Step** to the next `[ ]` item.
5. Tell the user what the **next step** is and wait for approval to proceed.

### CRITICAL RULES
- **NEVER** implement two `[ ]` items at once — present after EACH for review.
- **NEVER** skip `deno check mod.ts`. If it fails, fix before anything else.
- **NEVER** modify a file you haven't read first.
- **NEVER** skip reading existing similar code for pattern reference.
- **NEVER** write code for future phases — stay strictly on the current `[ ]` item.
- **ALWAYS** update both TODO.md AND CONTINUE.md after each item.

---

**Strict Rules**:
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
- Embedded arrays via `array(object({...}))` pattern in pure fields (see user.roles for example)

**Current Status**:
- ✅ Phase 1-9 (Existing): Complete — Project skeleton, Core models, Auth & CRUD, Warehouse domain, Org refactors, Process engine, Multi-role auth, Unit type + attributes
- Phase 10 (Workflow Automation): **NEXT — start with 10A**
- Phase 11 (Feature System): Pending
- Phase 12 (Order Items + Tendering): Pending
- Phase 13 (Full Warehousing): Pending
- Phase 14 (Goods Receipt + Procure-to-Pay): Pending
- Phase 15 (Budgeting): Pending
- Phase 16 (Consumption): Pending
- Phase 17 (History): Pending
- Phase 18 (Integration): Pending
- Phase 19 (Testing): Pending

**Architectural Changes (Session Summary)**:

1. **ProcessStepAssigneeGroup embedded into ProcessStep** — Eliminated the separate `processStepAssigneeGroup` model (22 action files). Assignee groups are now stored as `assigneeGroups: array(object({ operator, unitIds }))` directly in `processStep_pure`. The `stepEvaluator.ts` utility already expects this exact shape.

2. **Workflow Automation Engine (Phase 10)** — Two new actions planned:
   - `stepApproval.submitDecision`: Evaluates step status after each unit vote, auto-advances or rejects the purchasing request
   - `purchasingRequest.submit`: Launches a draft request into the workflow, creates StepApprovals for the first step
   - Extended step types: `Delivery`, `Receipt`, `Payment`

3. **Feature/Permission System (Phase 11)** — Adds feature-based access control alongside existing role system:
   - `features` array embedded on User and Unit models (feature enum: canRegisterPurchaseRequest, canApprovePurchaseRequest, etc.)
   - `allowWareTypeIds/ClassIds/GroupIds/ModelIds` on User and Unit for purchase scope control
   - New utilities: `checkFeature.ts`, `checkWareModelAccess.ts`
   - Updated `grantAccess.ts` with `requireFeature()` middleware

4. **Purchase Order Items + Tendering (Phase 12)**:
   - `PurchaseOrderItem` model — line items per purchasing request with status tracking
   - Embedded `items` array on PurchasingRequest
   - `Tender` model — RFP/RFQ with vendor assignment and deadline
   - `TenderOffer` model — vendor bids with pricing and delivery terms

5. **Full Warehousing System (Phase 13)**:
   - `Inventory` model — tracks stock per (unit, wareModel) with JIT min/max levels
   - `StockMovement` model — every inventory change logged with balance snapshots
   - `inventoryManager.ts` utility — addStock, removeStock, transferStock, getStockLevel, getWarehouseDashboard
   - Warehouse dashboard for keeper: shows org warehouse + all unit stock levels per wareModel

6. **Goods Receipt + Procure-to-Pay (Phase 14)**:
   - `GoodsReceipt` model — captures incoming goods with quality acceptance/rejection
   - `PaymentOrder` model — management-to-finance payment authorization
   - Integration with inventory: accepted goods auto-increment inventory

7. **Budgeting System (Phase 15)**:
   - `FiscalYear` — annual budget period
   - `BudgetLine` — spending categories with allocation/encumbrance/spent tracking
   - `BudgetAllocation` — funds assigned to budget lines
   - `BudgetEncumbrance` — commitment tracking (reserve → spend → release)
   - Year-end reporting with surplus/deficit analysis

8. **Goods Consumption (Phase 16)**:
   - `ConsumptionRecord` — tracks inventory usage by units, decrements inventory
   - PatientId field for future HIS integration

9. **History & Audit Trail (Phase 17)**:
   - Embedded `history` array on PurchasingRequest — every action logged with performer + details
   - Filterable history queries

**Product Classification Hierarchy** (for reference during implementation):
1. **WareType** → top-level (e.g. "laboratory equipment")
2. **WareClass** → second-level, belongs to WareType (e.g. "hematology")
3. **WareGroup** → third-level, belongs to WareType, M:N with WareClass (e.g. "kit")
4. **WareModel** → fourth-level, belongs to WareType + WareClass + WareGroup (e.g. "TSH Kit")
5. **Ware** → actual product, links to all 4 + Manufacturer (e.g. "TSH Kit ZistShimi")
6. **Stuff** → store inventory of a Ware at a Store

**Key Patterns**:
- Denormalized hierarchy in Ware, Stuff, and Unit for query efficiency
- Pricing logic: Stuff uses absolute price OR percentage markup on Ware.price
- Store has all fields in one model, StoreHead one-to-one with User
- Process steps use OR/AND logic via embedded assigneeGroups + groupsOperator on ProcessStep
- Step evaluation: `utils/stepEvaluator.ts:evaluateStepStatus()`
- **Embedding pattern**: `array(object({...}))` in pure fields (User.roles, ProcessStep.assigneeGroups)
- **Feature check pattern**: `requireFeature("canRegisterPurchaseRequest")` as preAct middleware
- **Inventory manager pattern**: Centralized utility for all stock operations (no direct inventory mutation)
- **Budget lifecycle pattern**: Allocation → Encumbrance(reserved) → ConvertToSpend → Year-end report

**Backend Structure**:
```
back/
├── deno.json               # Deno configuration
├── mod.ts                  # Main entry point
├── Dockerfile              # Multi-stage Docker config
├── models/                 # Model definitions
│   ├── mod.ts              # Re-exports
│   ├── excludes.ts         # Field exclusion lists
│   ├── featureConstants.ts # Feature enum constants (NEW)
│   ├── user.ts             # User model (with features, allowWareModels — NEW)
│   ├── file.ts             # File model
│   ├── tag.ts              # Tag model
│   ├── organization.ts     # Organization model
│   ├── unit.ts             # Unit model (with features, allowWareModels — NEW)
│   ├── process.ts          # Process model
│   ├── processStep.ts      # ProcessStep (with embedded assigneeGroups)
│   ├── stepApproval.ts     # Per-unit approval model
│   ├── purchasingRequest.ts # PurchasingRequest (with items, history — NEW)
│   ├── purchaseOrderItem.ts # Line items for purchase orders (NEW)
│   ├── tender.ts            # Tender/RFQ model (NEW)
│   ├── tenderOffer.ts       # Vendor offer/bid model (NEW)
│   ├── inventory.ts         # Per-unit inventory tracking (NEW)
│   ├── stockMovement.ts     # Inventory transaction audit log (NEW)
│   ├── goodsReceipt.ts      # Goods receipt document (NEW)
│   ├── paymentOrder.ts      # Payment authorization (NEW)
│   ├── fiscalYear.ts        # Budget fiscal year (NEW)
│   ├── budgetLine.ts        # Budget spending line (NEW)
│   ├── budgetAllocation.ts  # Budget allocation transaction (NEW)
│   ├── budgetEncumbrance.ts # Budget commitment tracking (NEW)
│   ├── consumptionRecord.ts # Goods usage/consumption (NEW)
│   ├── state.ts             # State model
│   ├── city.ts              # City model
│   ├── manufacturer.ts      # Manufacturer model
│   ├── wareType.ts          # WareType model
│   ├── wareClass.ts         # WareClass model
│   ├── wareGroup.ts         # WareGroup model
│   ├── wareModel.ts         # WareModel model
│   ├── ware.ts              # Ware product model
│   ├── stuff.ts             # Store inventory model
│   └── store.ts             # Store/seller model
├── src/                    # API implementations
│   ├── mod.ts              # Setup orchestrator
│   ├── user/               # User actions (features, allowWare — NEW)
│   ├── unit/               # Unit actions (features, allowWare — NEW)
│   ├── process/            # Process actions
│   ├── processStep/        # ProcessStep actions
│   ├── stepApproval/       # StepApproval + submitDecision (NEW)
│   ├── purchasingRequest/  # PurchasingRequest + submit (NEW) + warehouseCheck (NEW)
│   ├── purchaseOrderItem/  # PurchaseOrderItem CRUD (NEW)
│   ├── tender/             # Tender CRUD + close + award (NEW)
│   ├── tenderOffer/        # TenderOffer submit + get (NEW)
│   ├── inventory/          # Inventory CRUD + adjust + transfer (NEW)
│   ├── stockMovement/      # StockMovement read-only (NEW)
│   ├── goodsReceipt/       # GoodsReceipt CRUD (NEW)
│   ├── paymentOrder/       # PaymentOrder CRUD + markPaid (NEW)
│   ├── fiscalYear/         # FiscalYear CRUD + close (NEW)
│   ├── budgetLine/         # BudgetLine CRUD + reports (NEW)
│   ├── budgetAllocation/   # BudgetAllocation add + get (NEW)
│   ├── budgetEncumbrance/  # BudgetEncumbrance add + release + convert (NEW)
│   ├── consumptionRecord/  # ConsumptionRecord CRUD (NEW)
│   ├── state/              # State actions
│   ├── city/               # City actions
│   ├── manufacturer/       # Manufacturer actions
│   ├── wareType/           # WareType actions
│   ├── wareClass/          # WareClass actions
│   ├── wareGroup/          # WareGroup actions
│   ├── wareModel/          # WareModel actions
│   ├── ware/               # Ware actions
│   ├── stuff/              # Stuff actions
│   ├── file/               # File actions
│   ├── tag/                # Tag actions
│   ├── organization/       # Org actions
│   └── store/              # Store actions
├── .agents/                # Agent instructions
│   └── TODO/
│       ├── CONTINUE.md     # Session continuation prompt
│       └── TODO.md         # Task list
├── declarations/           # Generated types
├── uploads/                # File uploads
└── utils/                  # Utilities
    ├── mod.ts              # Lib exports
    ├── context.ts, grantAccess.ts, setToken.ts, setUser.ts, activeRole.ts
    ├── stepEvaluator.ts    # Step evaluation logic
    ├── checkFeature.ts     # Feature checking (NEW)
    ├── checkWareModelAccess.ts  # WareModel access check (NEW)
    └── inventoryManager.ts # Inventory operations (NEW)
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
- Process Steps use OR/AND logic via embedded assigneeGroups (operator) + ProcessStep.groupsOperator.
- Step evaluation: use `utils/stepEvaluator.ts:evaluateStepStatus()`.
- Process Steps ordered by `order` field ascending.
- Purchasing Requests track currentStep number and status lifecycle; approvals tracked via StepApproval model.
- Always separate pure field updates from relationship updates.
- Use `addRelation`/`removeRelation` for relationships, never manual updates.
- Product hierarchy is denormalized in Ware and Stuff for efficient querying.
- Unit.organization is denormalized (set on ALL units) for efficient querying.
- Generate type declarations after adding/modifying models.
- Follow the exact Lesan framework patterns from back/AGENTS.md.
- **Embedding pattern**: Use `array(object({...}))` for embedded subdocuments (e.g. ProcessStep.assigneeGroups, PurchasingRequest.items, PurchasingRequest.history, User.features, User.roles).
- **Feature/permission pattern**: Check features via `requireFeature("...")` middleware; check wareModel access via `checkWareModelAccess.ts` utility. Both roles AND features gate actions.
- **Inventory pattern**: Never mutate inventory directly. Always use `inventoryManager.ts` functions which atomically create StockMovement + update Inventory.
- **Budget lifecycle**: FiscalYear → BudgetLine → BudgetAllocation (adds funds) → BudgetEncumbrance (reserves on purchase) → ConvertToSpend (on receipt/payment) → Release (on cancellation). Year-end reports compare allocated vs spent.
- **History pattern**: Every action on a PurchasingRequest pushes a history entry with action type, performer, timestamp, and context details. Use the embedded `history` array.
- **Phase ordering**: Follow phases sequentially. Each phase has dependency on previous phases. Phase 10 (workflow automation) must be done first as the base upon which all other phases build.

---

## Current Next Step

Phase 19, second item:
> Write integration tests: full purchase flow, tender flow, inventory flow, budget flow, feature access

**Status check:**
- ✅ All Phases 1-18 code written and compiled (`deno check mod.ts` passes)
- ✅ Type declarations generated (75K line `declarations/selectInp.ts` covers all models)
- ❌ Integration tests not yet written
- ❌ Docker build not yet tested
- ❌ AGENTS.md not updated with new model documentation
- ❌ Production deployment not prepared

**Before starting:**
1. Review existing test patterns (if any) in the codebase
2. Determine testing approach (deno test? manual script? postman collection?)
3. Ask user for preferences on testing approach
