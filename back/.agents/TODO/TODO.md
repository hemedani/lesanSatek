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
- [x] Generate declarations/ for frontend type safety
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
- [x] ProcessStep model (with groupsOperator, assigneeGroups embedded)
- [x] ~~ProcessStepAssigneeGroup model~~ — **DELETED** (embedded into ProcessStep.assigneeGroups)
- [x] StepApproval model (per-unit per-step approval tracking)
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
- [x] ~~ProcessStepAssigneeGroup CRUD acts~~ — **DELETED** (embedded into ProcessStep)
- [x] StepApproval CRUD acts (add, get, gets)
- [x] PurchasingRequest CRUD acts (add, get, gets, update, updateRelations, remove, count)

## Phase 4: Testing & Polish (Deferred — new phases take priority)
- [ ] ~~Generate declarations/~~ — Will regenerate after all new models are stable
- [ ] ~~Test all endpoints~~ — Deferred

## Phase 5: Warehouse/Inventory Domain Models (Complete)
- [x] All WareType/WareClass/WareGroup/WareModel/Ware/Stuff/Store/State/City/Manufacturer models + actions

## Phase 6: Organizational Refactor (Complete)
- [x] Employee → User merge, Department elimination, all related changes

## Phase 7: Process Engine Redesign (Complete)
- [x] OR/AND logic, StepApproval, stepEvaluator, all related changes

## Phase 8: Multi-Role Auth System (Complete)
- [x] roles array, activeRoleId, grantAccess rewrite, all related changes

## Phase 9: Unit Type + Attribute Fields (Complete)
- [x] type enum, attribute fields on unit_pure, all related changes

## Phase 10: Workflow Automation Engine (NEW — Foundation)
### 10A: stepApproval.submitDecision Action
- [x] Create `src/stepApproval/submitDecision/submitDecision.val.ts` — validator with purchasingRequestId, processStepId, unitId, status (approved|rejected), optional comment
- [x] Create `src/stepApproval/submitDecision/submitDecision.fn.ts` — logic: (1) validate request is Pending/InProgress, (2) verify step matches currentStep, (3) verify unit is in step's assigneeGroups, (4) upsert StepApproval, (5) fetch all step approvals, (6) run evaluateStepStatus(), (7) on "approved": auto-advance currentStep, create pending approvals for next step OR mark Completed, (8) on "rejected": mark request Rejected
- [x] Create `src/stepApproval/submitDecision/mod.ts` — action setup with grantAccess
- [x] Update `src/stepApproval/mod.ts` — add submitDecisionSetup()

### 10B: purchasingRequest.submit Action
- [x] Create `src/purchasingRequest/submit/submit.val.ts` — validator (same as add minus status/currentStep)
- [x] Create `src/purchasingRequest/submit/submit.fn.ts` — create request with status=Pending, currentStep=0, fetch first step's assigneeGroups, create StepApproval(status:pending) for each unit
- [x] Create `src/purchasingRequest/submit/mod.ts` — action setup with grantAccess
- [x] Update `src/purchasingRequest/mod.ts` — add submitSetup()

### 10C: Extended Step Types
- [x] Extend `step_type_array` to include `"Delivery"`, `"Receipt"`, `"Payment"` (in addition to existing Approval/Review/Notification/Action)
- [x] Update all references (processStep_pure, processStep validators in add/update) — validators import the array directly, auto-pickup

## Phase 11: Feature/Permission System (NEW)
### 11A: Feature Definitions & Embedding
- [x] Create `models/featureConstants.ts` — define `feature_array` with all system capabilities
- [x] Embed `features` array on `user_pure`
- [x] Embed `features` array on `unit_pure`
- [x] Embed `allowWareTypeIds`, `allowWareClassIds`, `allowWareGroupIds`, `allowWareModelIds` on `user_pure`
- [x] Embed same allowWare* arrays on `unit_pure`
- [x] Create `utils/checkFeature.ts` — hasFeature(user, feature) + hasUnitFeature(unit, feature)
- [x] Create `utils/checkWareModelAccess.ts` — userCanAccessWareModel + unitCanAccessWareModel

### 11B: Update grantAccess for Features
- [x] Update `utils/grantAccess.ts` — accept optional `features: string[]` parameter alongside roles
- [x] Add `requireFeature(feature)` function as a preAct middleware

### 11C: Update User/Unit Actions
- [x] Update `models/user.ts` — add features and allowWare*Id arrays to pure fields, update excludes
- [x] Update `src/user/add/add.val.ts` — add optional features/allowWare fields to validator
- [x] Update `src/user/add/add.fn.ts` — pass features/allowWare through
- [x] Update `src/user/update/update.val.ts` — add optional features/allowWare fields
- [x] Update `src/user/update/update.fn.ts` — handle features/allowWare in update merge
- [x] Update `models/unit.ts` — add features and allowWare*Id arrays to pure fields
- [x] Update `src/unit/add/add.val.ts` — add optional features/allowWare fields
- [x] Update `src/unit/add/add.fn.ts` — pass through
- [x] Update `src/unit/update/update.val.ts` — add optional features/allowWare fields
- [x] Update `src/unit/update/update.fn.ts` — handle in update merge

## Phase 12: Purchase Order Items + Tendering System (NEW)
### 12A: PurchaseOrderItem Model
- [x] Create `models/purchaseOrderItem.ts` — model with pure fields + relations
- [x] Add purchaseOrderItems relation to purchasingRequest_relations
- [x] Update `models/excludes.ts` — add purchaseOrderItem_excludes
- [x] Update `models/mod.ts` — export purchaseOrderItem
- [x] Create full action directory `src/purchaseOrderItem/` — add, get, gets, update, updateRelations, remove, count
- [x] Update `src/mod.ts` — add purchaseOrderItemSetup()
- [x] Update `mod.ts` — add purchaseOrderItem model initialization

### 12B: Embedded Items Array on PurchasingRequest
- [x] Add embedded `items` to `purchasingRequest_pure`
- [x] Update `src/purchasingRequest/add/add.val.ts` — add optional items array to validator
- [x] Update `src/purchasingRequest/update/update.val.ts` — add optional items array
- [x] Update `src/purchasingRequest/update/update.fn.ts` — handle items in update

### 12C: Tender Model
- [x] Create `models/tender.ts` — pure: title(string), description?(string), status(open|closed|awarded|cancelled), deadline(date); relations: purchasingRequest(single,required), createdBy(user,single), assignedVendors(store — multiple), offers(tenderOffer — multiple)
- [x] Add tender relation to purchasingRequest_relations
- [x] Update `models/excludes.ts` — add tender_excludes
- [x] Update `models/mod.ts` — export tender
- [x] Create actions: `src/tender/add/`, `get/`, `gets/`, `update/`, `updateRelations/`, `remove/`, `count/`, `close/` (custom), `award/` (custom)
- [x] Update `src/mod.ts` — add tenderSetup()

### 12D: TenderOffer Model
- [x] Create `models/tenderOffer.ts` — pure: price(number), deliveryTime(number — days), paymentTerms?(string), description?(string), status(submitted|accepted|rejected), submittedAt(date); relations: tender(single,required), store(single,required)
- [x] Update `models/excludes.ts` — add tenderOffer_excludes
- [x] Update `models/mod.ts` — export tenderOffer
- [x] Create actions: `src/tenderOffer/submit/` (custom — vendors submit offers), `get/`, `gets/`
- [x] Update `src/mod.ts` — add tenderOfferSetup()

## Phase 13: Full Warehousing System (NEW)
### 13A: Inventory Model
- [x] Create `models/inventory.ts` — pure: wareModelId(string), wareModelName(string), wareId?(string), wareName?(string), quantity(number), minQuantity?(number — JIT reorder point), maxQuantity?(number — JIT capacity), batchNo?(string), expirationDate?(date), location?(string), lastCountedAt?(date); relations: unit(single,required — inventory owner), warehouseUnit?(unit,single — if org warehouse stock)
- [x] Add unique compound index on (unit._id, wareModelId) — one inventory record per unit per wareModel
- [x] Update `models/excludes.ts` — add inventory_excludes
- [x] Update `models/mod.ts` — export inventory
- [x] Create actions: `src/inventory/` — add, get, gets, update(quantity), adjust(custom), transfer(custom), count
- [x] Update `src/mod.ts` — add inventorySetup()

### 13B: StockMovement Model (Audit Trail for Inventory)
- [x] Create `models/stockMovement.ts` — pure: wareModelId(string), wareModelName(string), wareId?(string), wareName?(string), quantity(number — positive=in, negative=out), balanceBefore(number), balanceAfter(number), reason(enums: goods_receipt|goods_issue|transfer_in|transfer_out|consumption|adjustment|return|write_off), referenceType?(string), referenceId?(string), description?(string); relations: unit(single,required), createdBy(user,single)
- [x] Update `models/excludes.ts` — add stockMovement_excludes
- [x] Update `models/mod.ts` — export stockMovement
- [x] Create actions: `src/stockMovement/` — get, gets, count (read-only; created by system actions)

### 13C: Inventory Manager Utility
- [x] Create `utils/inventoryManager.ts` with functions:
  - `addStock(unitId, wareModelId, quantity, reason, reference?, description?)` — creates/updates Inventory, creates StockMovement
  - `removeStock(unitId, wareModelId, quantity, reason, reference?, description?)` — decrements Inventory, creates StockMovement
  - `transferStock(fromUnitId, toUnitId, wareModelId, quantity, reason?, reference?)` — transfers between units
  - `getStockLevel(unitId, wareModelId)` — returns current quantity
  - `getWarehouseDashboard(warehouseUnitId, wareModelId)` — returns org warehouse + all unit stocks for a wareModel

### 13D: Warehouse Dashboard Action
- [x] Create `src/purchasingRequest/warehouseCheck/` (custom action) — warehouse keeper sees org warehouse stock + requesting unit's inventory for each wareModel on the order, then can approve/reject with conditions logged

## Phase 14: Goods Receipt & Procure-to-Pay (NEW)
### 14A: GoodsReceipt Model
- [x] Create `models/goodsReceipt.ts` — pure: receiptNumber(string — auto-generated), description?(string), receivedAt(date), status(pending|completed|partially_rejected), notes?(string); relations: purchasingRequest(single,required), receivedBy(user,single), receivingUnit(unit,single); embedded items: array(object({ purchaseOrderItemId(string), wareModelId(string), quantityReceived(number), quantityAccepted(number), quantityRejected(number), batchNo?(string), expirationDate?(date) }))
- [x] Update `models/excludes.ts` — add goodsReceipt_excludes
- [x] Update `models/mod.ts` — export goodsReceipt
- [x] Create actions: `src/goodsReceipt/` — add(triggers inventoryManager.addStock for each accepted item), get, gets, update
- [x] Update `src/mod.ts` — add goodsReceiptSetup()

### 14B: PaymentOrder Model
- [x] Create `models/paymentOrder.ts` — pure: title(string), amount(number), description?(string), status(draft|sent_to_finance|paid|cancelled), paidAt?(date); relations: purchasingRequest(single,required), issuedBy(user,single), approvedBy(user?,single — management approval), payTo(store,single), financialUnit(unit,single)
- [x] Update `models/excludes.ts` — add paymentOrder_excludes
- [x] Update `models/mod.ts` — export paymentOrder
- [x] Create actions: `src/paymentOrder/` — add(creates encumbrance release), get, gets, update, markPaid(custom)
- [x] Update `src/mod.ts` — add paymentOrderSetup()

### 14C: Workflow Integration
- [x] Update `stepApproval.submitDecision` to handle "Delivery", "Receipt", "Payment" step types differently (trigger the appropriate next-phase action instead of just advancing)
- [x] After goods receipt is confirmed → auto-advance to next step
- [x] After payment order is issued → auto-advance

## Phase 15: Budgeting System (NEW)
### 15A: FiscalYear Model
- [x] Create `models/fiscalYear.ts` — pure: name(string — e.g. "1404"), startDate(date), endDate(date), isActive(boolean), status(open|closed)
- [x] Update `models/excludes.ts`, `models/mod.ts`
- [x] Create `src/fiscalYear/` — add, get, gets, update, close(custom)
- [x] Update `src/mod.ts`

### 15B: BudgetLine Model
- [x] Create `models/budgetLine.ts` — pure: code(string — e.g. "OP-1404-LAB-001"), title(string), description?(string), totalAllocated(number,defaults 0), totalEncumbered(number,defaults 0), totalSpent(number,defaults 0), remainingBudget(number — computed); relations: fiscalYear(single,required), organization(single,required), unit?(single), wareType?(single)
- [x] Update `models/excludes.ts`, `models/mod.ts`
- [x] Create `src/budgetLine/` — add, get, gets, update(code/title only), count
- [x] Update `src/mod.ts`

### 15C: BudgetAllocation Model
- [x] Create `models/budgetAllocation.ts` — pure: amount(number), description?(string), allocatedAt(date); relations: budgetLine(single,required), allocatedBy(user,single)
- [x] Update `models/excludes.ts`, `models/mod.ts`
- [x] Create `src/budgetAllocation/` — add(increments budgetLine.totalAllocated), get, gets
- [x] Update `src/mod.ts`

### 15D: BudgetEncumbrance Model
- [x] Create `models/budgetEncumbrance.ts` — pure: amount(number), status(reserved|spent|released), referenceType(string — "purchasingRequest"), referenceId(string), description?(string); relations: budgetLine(single,required), createdBy(user,single)
- [x] Update `models/excludes.ts`, `models/mod.ts`
- [x] Create `src/budgetEncumbrance/` — add(reserves — increments totalEncumbered), release(custom), convertToSpend(custom)
- [x] Update `src/mod.ts`

### 15E: Budget Reports
- [x] Create `src/budgetLine/getBudgetReport` (custom action) — per fiscalYear/organization: each budget line with allocated vs encumbered vs spent vs remaining + percentage
- [x] Create `src/budgetLine/getYearEndReport` (custom action) — surplus/deficit per line, total organization budget performance

## Phase 16: Goods Consumption System (NEW)
### 16A: ConsumptionRecord Model
- [x] Create `models/consumptionRecord.ts` — pure: wareModelId(string), wareModelName(string), wareId?(string), wareName?(string), quantity(number), consumedAt(date), reason?(string — e.g. "patient_test", "maintenance", "general_use"), patientId?(string — future HIS), notes?(string); relations: unit(single,required), consumedBy(user,single), inventory?(single)
- [x] Update `models/excludes.ts`, `models/mod.ts`
- [x] Create `src/consumptionRecord/` — add(triggers inventoryManager.removeStock), get, gets, count
- [x] Update `src/mod.ts`

## Phase 17: History & Audit Trail (NEW)
### 17A: Embedded History on PurchasingRequest
- [x] Add `history` embedded array to `purchasingRequest_pure`: `defaulted(array(object({ action(string), performedBy(string — userId), performedByName(string), performedAt(date), details?(object — freeform) })), [])`
- [x] Update `src/purchasingRequest/add/add.fn.ts` — push initial "created" history entry
- [x] Update `stepApproval.submitDecision` — push "step_approved" / "step_rejected" with details (stepName, unitName, warehouseStock)
- [x] Update `purchasingRequest.submit` — push "submitted" entry
- [x] Update `goodsReceipt.add` — push "goods_received" entry
- [x] Update `paymentOrder.add` — push "payment_ordered" entry
- [x] Update `consumptionRecord.add` — push "goods_consumed" entry

### 17B: History Queries
- [x] Create `getHistory` custom action on purchasingRequest — returns ordered history with all details
- [x] Add history filter to `purchasingRequest.gets` — filter by action type

## Phase 18: Complete Integration & Auto-Flows
- [x] Auto-inventory on goods receipt (`goodsReceipt.add` → `inventoryManager.addStock`) — done in Phase 14A
- [x] Auto-budget encumbrance on request submit (`purchasingRequest.submit` → create BudgetEncumbrance)
- [x] Auto-convert encumbrance to spend on payment (`paymentOrder.markPaid` → convert reserved→spent)
- [x] Auto-create draft payment order on goods receipt complete (`goodsReceipt.add` → `paymentOrder.insertOne` with draftPaymentOrderTitle/Amount)

## Phase 19: Type Declarations, Testing & Polish
- [x] Generate type declarations for all new models — 75K lines, all models included
- [ ] Write integration tests: full purchase flow, tender flow, inventory flow, budget flow, feature access
- [ ] Test all endpoints with `deno task bc-dev`
- [ ] Docker build testing
- [x] Update AGENTS.md with all new models/patterns — comprehensive rewrite, 674 lines
- [ ] Production deployment preparation
