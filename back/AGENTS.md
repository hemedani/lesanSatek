# LesanSatek Backend - Deno Application

## Project Overview

LesanSatek backend is a Deno + Lesan application for an organizational process management and warehouse/inventory management system. The system handles organizational hierarchies, process workflows, and a complete warehouse domain with product classification hierarchy (WareType → WareClass → WareGroup → WareModel → Ware), manufacturer management, store/seller management, and inventory (Stuff) tracking.

### Architecture

- **Backend Framework**: Lesan (MongoDB-based ODM/ORM framework for Deno)
- **Runtime**: Deno
- **Database**: MongoDB
- **File Storage**: Static file uploads managed through the backend
- **API**: REST/GraphQL API with automatic playground generation
- **Authentication**: JWT-based with multi-role support (implemented via djwt library; token in request header; each request includes `activeRoleId` in body)

### Core Technologies

- **Backend Runtime**: Deno
- **Framework**: Lesan (v0.2.3)
- **Database**: MongoDB
- **Authentication**: djwt library
- **Containerization**: Docker

## Key Features

### Backend (Lesan Framework)
- Schema-based data modeling with validation
- Automatic API generation with playground interface
- MongoDB ODM with relationship management
- CORS support for frontend integration
- File upload functionality with static file serving
- Type generation for frontend integration

### Data Models

The backend defines models across four domains: Organizational, Procurement/Purchasing, Warehouse/Inventory, and Budget/Finance.

#### Organizational Management Domain
- **User** - User authentication and authorization (first_name, last_name, gender, birth_date, mobile, email, password, is_verified, isGhost, roles, position, isActive, features, allowWareTypeIds, allowWareClassIds, allowWareGroupIds, allowWareModelIds). Relations: avatar, organization, units. *Employee was merged into User. Level was replaced by multi-role `roles` array.*
- **File** - File upload management (name, mimeType, size, type: image/video/docs/other, alt_text)
- **Tag** - Metadata categorization (name, description, color, icon)
- **Organization** - Organizations that own purchasing processes (name, enName, description, isActive)
- **Unit** - Hierarchical units/subunits in a tree (name, enName, description, isActive, organization denormalized on all units, parentUnit for nesting, head as User, features, allowWareTypeIds, allowWareClassIds, allowWareGroupIds, allowWareModelIds). Unit has a `type` enum (General|Warehouse|Logistics|Production|Administration|Expert) and optional attribute fields (address, phone, email, warehouseCapacity, hasColdStorage, fleetSize, serviceRadius). *Department was eliminated.*
- **Process** - Process builder workflow definitions (name, description, status: Draft|Active|Archived, version, isActive). Custom actions: activateProcess, duplicateProcess.
- **ProcessStep** - Individual steps within a process (name, description, stepType: Approval|Review|Notification|Action|Delivery|Receipt|Payment, order, required, groupsOperator: AND|OR, assigneeGroups: embedded array of {operator, unitIds}). *ProcessStepAssigneeGroup was eliminated — assignee groups are now embedded directly in ProcessStep.*

#### Procurement & Purchasing Domain
- **StepApproval** - Per-unit per-step approval decisions (status: pending|approved|rejected, comment, decidedAt). Relations: purchasingRequest, processStep, unit, decidedBy.
- **PurchasingRequest** - Actual purchasing requests flowing through processes (title, description, estimatedAmount, quantity, status: Draft|Pending|InProgress|Approved|Rejected|Completed|Cancelled, currentStep, history: embedded array with nested performed{by,name,at,role} + optional unit + details). Custom actions: submit, getHistory, assignStore, warehouseCheck, checkStoreAvailability. Relations: wareModel (WareModel), process, requester, requestingUnit, attachments, stepApprovals, purchaseOrderItems, tender, goodsReceipts, paymentOrders, budgetLine.
- **PurchaseOrderItem** - Line items on a purchase order (wareModelId, wareModelName, wareId?, wareName?, quantity, unitPrice?, totalPrice?, status: pending|assigned|ordered|received|cancelled). Relations: purchasingRequest, assignedFrom (store), assignedBy (user).
- **Tender** - RFP/RFQ for vendor selection (title, description, status: open|closed|awarded|cancelled, deadline). Custom actions: close, award. Relations: purchasingRequest, createdBy, assignedVendors (stores), offers (tenderOffers).
- **TenderOffer** - Vendor bid on a tender (price, deliveryTime, paymentTerms?, description?, status: submitted|accepted|rejected, submittedAt). Relations: tender, store.

#### Warehouse/Inventory Domain
- **State** - Geographic state/province (name, enName)
- **City** - Geographic city (name, enName, state relation)
- **Manufacturer** - Product manufacturer/producer (name, enName, country)
- **WareType** - Top-level ware classification (name, enName)
- **WareClass** - Second-level classification (name, enName, wareType relation)
- **WareGroup** - Third-level classification (name, enName, wareType relation, M:N with wareClasses)
- **WareModel** - Fourth-level specific model (name, enName, wareType, wareClass, wareGroup relations)
- **Ware** - Actual product (name, enName, brand, price, orderedNumber, irc, umdns, gtin, photoUrl, relations to manufacturer + all 4 hierarchy levels)
- **Stuff** - Store inventory (ware, store, inventoryNo, price, pricing mode, expiration, barcode, qrc, photoUrl, long payment pricing)
- **Store** - Seller entity (name, address, contact, logo, city, state, storeHead, wareTypes, status, score, bank info, certificate info, economicCode, postalCode, etc.)
- **Inventory** - Per-unit stock tracking (wareModelId, wareModelName, wareId?, wareName?, quantity, minQuantity?, maxQuantity?, batchNo?, expirationDate?, location?). Unique index on (unit, wareModelId). Relations: unit, warehouseUnit.
- **StockMovement** - Audit trail for every inventory change (wareModelId, wareModelName, quantity, balanceBefore, balanceAfter, reason: goods_receipt|goods_issue|transfer_in|transfer_out|consumption|adjustment|return|write_off, referenceType?, referenceId?). Relations: unit, createdBy. Read-only; created by system actions.
- **ConsumptionRecord** - Goods usage tracking (wareModelId, wareModelName, wareId?, wareName?, quantity, consumedAt, reason?, patientId?, notes?). Custom action: add triggers inventoryManager.removeStock. Relations: unit, consumedBy, inventory.

#### Budget & Finance Domain
- **FiscalYear** - Annual budget period (name, startDate, endDate, isActive, status: open|closed). Custom action: close.
- **BudgetLine** - Spending category (code, title, description, totalAllocated, totalEncumbered, totalSpent, remainingBudget). Relations: fiscalYear, organization, unit?, wareType?.
- **BudgetAllocation** - Funds assigned to a budget line (amount, description, allocatedAt). Custom action: add increments budgetLine.totalAllocated. Relations: budgetLine, allocatedBy.
- **BudgetEncumbrance** - Commitment tracking (amount, status: reserved|spent|released, referenceType, referenceId, description). Custom actions: add (reserves), release, convertToSpend. Relations: budgetLine, createdBy.
- **GoodsReceipt** - Incoming goods document (receiptNumber, description, receivedAt, status: pending|completed|partially_rejected, items: embedded array of {purchaseOrderItemId, wareModelId, quantityReceived/Accepted/Rejected, batchNo?, expirationDate?}). Custom action: add triggers inventory, PO status update, auto-payment, budget conversion. Relations: purchasingRequest, receivedBy, receivingUnit.
- **PaymentOrder** - Payment authorization (title, amount, description, status: draft|sent_to_finance|paid|cancelled, paidAt). Custom action: markPaid converts encumbrances to spent. Relations: purchasingRequest, issuedBy, approvedBy?, payTo (store), financialUnit.

### Organization Hierarchy

The system implements a 2-level hierarchical structure (Department was eliminated):

```
Organization
  └── Unit (top-level, has organizationId)
        └── Unit (child, linked via parentUnit)
              └── Unit (sub-child, tree continues)
```

Key points:
- **Unit** has an `organization` relation (denormalized on all units for query efficiency - set on every unit, not just top-level)
- **Unit** supports `parentUnit`/`subUnits` for infinite nesting/tree structure
- **User** is linked to org via `organization` relation and to units via `units` relation
- **User** has `position` and `isActive` fields (migrated from the eliminated Employee model)
- **Unit.head** is a User (was Employee before the merge)
- **User has a `roles` array**: Each role has `{ roleId, name, scopeType?, scopeId? }`. Roles: Manager, Admin, OrgHead, UnitHead, Employee, Ordinary. `isGhost` boolean for the bootstrap user (replaces former "Ghost" level).

### Process Builder System with OR/AND Logic

The system provides a flexible workflow engine with unit-based assignment and OR/AND logic:

1. **Process** defines a purchasing workflow (Draft → Active → Archived).
2. **ProcessStep** defines individual steps (Approval/Review/Notification/Action/Delivery/Receipt/Payment) with ordering.
3. **Assignee groups** are embedded in ProcessStep as `assigneeGroups: array({ operator, unitIds })`. Steps have a `groupsOperator` (AND/OR) that defines how groups combine. *Standalone ProcessStepAssigneeGroup model was eliminated.*
4. **StepApproval** tracks per-unit, per-step decisions (approved/rejected/pending) on each PurchasingRequest.
5. **PurchasingRequest** flows through a process, tracking `currentStep` and status via StepApprovals.

**OR/AND configuration examples:**

| Requirement | Configuration |
|------------|---------------|
| Unit A must approve | `groupsOperator: "AND"`, one group with `{ operator: "AND", units: [A] }` |
| U1 OR U2 must approve | `groupsOperator: "AND"`, one group with `{ operator: "OR", units: [U1, U2] }` |
| U1 AND U2 must approve | `groupsOperator: "AND"`, one group with `{ operator: "AND", units: [U1, U2] }` |
| (U1 AND U2) OR (U3 AND U4) | `groupsOperator: "OR"`, two groups with `{ operator: "AND" }` each |

**Step evaluation utility:** `utils/stepEvaluator.ts` contains `evaluateStepStatus()` which computes a step's overall status from individual unit approvals + the OR/AND group configuration.

### Automated Process Lifecycle

The process lifecycle is automated with guardrails at each transition:

```
Draft  ──►  activateProcess()  ──►  Active  ──►  update(status: "Archived")  ──►  Archived
```

**`activateProcess` (custom action):** Validates before activating:
1. At least one ProcessStep exists
2. Step `order` values are consecutive (1, 2, 3, ...N) with no gaps or duplicates
3. All `unitIds` in step assigneeGroups reference valid Unit documents
4. On success: sets `status: "Active"`, `isActive: true`, auto-increments `version`
5. Rejects if already Active

**`duplicateProcess` (custom action):** Clones a process and all its steps:
1. Fetches source process and all its ProcessSteps (with assigneeGroups)
2. Creates new Process (Draft, version 1, isActive: false) with same organization
3. Copies all steps with identical properties
4. Default name: `"{source name} (Copy)"`, custom name optionally passed

**Archive guard (in process.update):** Prevents archiving a process when any PurchasingRequest has status `["Pending", "InProgress", "Approved"]` for that process. Returns error with active request count.

### Automated Purchase Lifecycle (Procure-to-Pay)

The complete purchase-to-payment flow is automated:

```
PR Draft ──► submit() ──► Pending ──► submitDecision() (per step) ──► InProgress/Approved
      │                                                                    │
      │  ┌── Path A (Direct Store Assignment)                              │
      ├──► checkStoreAvailability() ──► assignStore(assignedFromId)        │
      │  └── creates PurchaseOrderItem (auto-price from Stuff)             │
      │                                                                    │
      │  ┌── Path B (Auction/Tender)                                       │
      ├──► tender.add() ──► close() ──► award(winningOfferId)              │
      │  └── creates PurchaseOrderItem (price from offer, links tenderOffer)│
      │                                                                    │
      └────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    goodsReceipt.add()
                    │  ├──► inventoryManager.addStock()
                    │  ├──► update PO item status → "received"
                    │  ├──► auto-advance workflow (Receipt/Delivery steps)
                    │  ├──► auto-create draft PaymentOrder
                    │  └──► auto-convert budget encumbrance → spent
                    │
                    ▼
              paymentOrder.markPaid()
                    │  └──► convert remaining encumbrance → spent
                    │
                    ▼
                 Completed
```

**`purchasingRequest.submit`:** Creates a request with status=Pending, currentStep=0. Sets `wareModel` relation and optionally `budgetLine` relation on the PR. Creates StepApproval(status:pending) for each unit in the first step's assigneeGroups. Optionally auto-creates BudgetEncumbrance if `budgetLineId` and `estimatedAmount` are provided (validates sufficient remaining budget first). Pushes "submitted" history entry.

**`stepApproval.submitDecision`:** Processes a unit's decision (approved/rejected):
1. Validates request is Pending/InProgress, step matches currentStep, unit is in step's assigneeGroups
2. Upserts StepApproval record (insert or update + set decidedBy via addRelation)
3. Fetches all approvals for current step, runs `evaluateStepStatus()`
4. On **approved**: auto-advances `currentStep` (creates pending approvals for next step) or marks request **Completed** if last step
5. On **rejected**: marks request **Rejected**
6. Pushes "step_approved" / "step_rejected" history entries with nested performed + unit objects

**`purchasingRequest.assignStore` (Path A):** Creates a PurchaseOrderItem from the PR's `wareModel` + `quantity`. When `assignedFromId` (Store) is provided, auto-looks up `Stuff.price` (absolute or percentage-based) for that store + wareModel and uses it as `unitPrice`. Requires `canAssignItemsToOrder` feature. Pushes "item_assigned" history entry.

**`purchasingRequest.checkStoreAvailability`:** Queries `Stuff` records for the PR's `wareModel`. Returns all stores carrying the item with their effective pricing (computed from absolute price or percentage markup). Optionally filter by `storeId`.

**`purchasingRequest.updateRelations` (tender support):** Now accepts `tenderId` to link/unlink a tender to the PR via Lesan relations (`replace: true`).

**`tender.close` → `tender.award` (Path B):** On award, winning offer is accepted, all others rejected. A single PurchaseOrderItem is created from the PR's `wareModel` + `quantity`, using `winningOffer.price` as `unitPrice`. The PO item is linked back to the winning `tenderOffer` via Lesan relation for audit trail. Pushes "item_assigned" history entry.

**`goodsReceipt.add`:** Comprehensive auto-flow:
1. Creates GoodsReceipt document
2. For each accepted item: calls `inventoryManager.addStock()` to update inventory
3. Updates PO item status to "received"
4. Collects pricing from PO items to calculate order total
5. Auto-advances workflow if current step type is "Receipt" or "Delivery" (creates auto-approved StepApproval, evaluates step status)
6. Auto-creates draft PaymentOrder from order total
7. Auto-converts budget encumbrance to spent (supports partial conversion prorated from receipt amount)
8. Pushes "goods_received" history entry with nested performed + unit objects

**`paymentOrder.markPaid`:** Sets status to "paid", records paidAt. Finds all reserved budget encumbrances linked to the same purchasingRequest and converts them to spent (decrements totalEncumbered, increments totalSpent on the budgetLine).

### History Structure

Every PurchasingRequest history entry uses nested objects instead of flat fields:

```typescript
{
  action: "submitted" | "step_approved" | "step_rejected" | "item_assigned" | "goods_received" | "goods_consumed" | "payment_ordered" | "created",
  performed: {
    by: string,          // User._id
    name: string,        // "First Last"
    at: Date,
    role: {
      id: string,        // roleId (UUID)
      name: string,      // "Manager" | "Admin" | "UnitHead" | etc.
      scopeType?: string, // "organization" | "unit"
      scopeId?: string,
    },
  },
  unit?: {
    _id: string,
    name: string,
  },
  details?: object,      // Action-specific extra fields
}
```

### Product Classification Hierarchy (Warehouse)

The system implements a 4-level product classification hierarchy:
1. **WareType** (top-level category) → e.g. "Laboratory Equipment"
2. **WareClass** (subtype of WareType) → e.g. "Hematology"
3. **WareGroup** (subtype of WareType, M:N with WareClass) → e.g. "Kit"
4. **WareModel** (specific model name, belongs to all 3 above) → e.g. "TSH Kit"
5. **Ware** (actual product, links to all 4 + Manufacturer) → e.g. "TSH Kit ZistShimi"
6. **Stuff** (store inventory of a Ware) → specific quantity and price at a Store

WareClass and WareGroup have an M:N relationship defined on **WareGroup** side (no join table — native NoSQL M:N). See "Warehouse Relation Map" below.

### Store Management

Stores are seller entities with:
- Location (city, state)
- Contact and address info
- StoreHead (User who manages the store)
- Extended info: bank, certificates, legal type, email, economic code
- Supported WareTypes (M:N)
- Delivery settings (city/state/country delivery times, fast delivery)
- Status lifecycle (NotConfirmed → Confirmed → Suspension)
- Rating and sales statistics

## Project Structure

```
lesanSatek/back/
├── deno.json               # Deno project configuration
├── mod.ts                  # Main application entry point
├── Dockerfile              # Multi-stage Docker configuration
├── declarations/           # Generated type declarations
├── models/                 # Data model definitions
│   ├── mod.ts              # Model exports
│   ├── excludes.ts         # Field exclusion lists
│   ├── *.ts                # Individual model files
│   └── utils/              # Model utilities
├── src/                    # API route and logic implementations
│   ├── mod.ts              # Functions setup module
│   ├── user/               # User actions (12 actions)
│   ├── file/               # File actions
│   ├── tag/                # Tag actions
│   ├── organization/       # Organization actions
│   ├── unit/               # Unit actions
│   ├── process/            # Process actions (+ activateProcess, duplicateProcess)
│   ├── processStep/        # ProcessStep actions
│   ├── stepApproval/       # StepApproval actions (+ submitDecision)
│   ├── purchasingRequest/  # PurchasingRequest actions (+ submit, warehouseCheck, getHistory, assignStore, checkStoreAvailability)
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
│   └── store/              # Store actions
├── uploads/                # Static file uploads directory
└── utils/                  # Utility functions (context, grantAccess, activeRole, setToken, setUser, stepEvaluator, checkFeature, checkWareModelAccess, inventoryManager, etc.)
```

## E2E Testing with JSON Files

The `http/e2e.json` and `http/e2e-with-remove.json` files are E2E test suites that get run **manually** via the Lesan playground (`/playground`) — there is no local runner script. To test: start the dev server (`deno task bc-dev`), open `/playground` in a browser, paste the JSON contents into the collection runner or execute entries one by one.

**When you encounter failures:**
- Do NOT try to run the JSON files locally — there is no runner in the repo
- The user will run the file manually and report any failures back
- Fix the issues reported by the user (field name mismatches, missing captures, wrong action names, missing `get` fields, etc.) and update the JSON file accordingly

## Building and Running

### Development Environment

```bash
cd back/
deno task bc-dev  # Runs with auto-reload for development
```

### Production Deployment

```bash
docker build --target production -t lesansatek-backend:production .
```

## Environment Configuration

- `MONGO_URI`: MongoDB connection string (defaults to "mongodb://127.0.0.1:27017/")
- `ENV`: Environment mode (development/production)
- `APP_PORT`: Application port (defaults to 1405)

## API Documentation

The backend provides an API playground accessible at `/playground` when running in development mode.

## Development Conventions

### Backend (Deno/Lesan)
- Uses Lesan framework for API generation and data modeling
- TypeScript with strict typing
- Zod-like validation syntax for schema definitions
- Auto-generated type declarations for frontend integration (`typeGeneration: true` in `coreApp.runServer()` — run `deno task bc-dev` to regenerate `declarations/` folder)
- MongoDB ODM with relationship support
- Relations are one-directional (define on owning model only)
- Separate pure field updates from relation updates
- Product hierarchy is denormalized in Ware and Stuff for query efficiency
- Unit.organization is denormalized (set on all units, not just top-level) for query efficiency
- Prefer deleting redundant models rather than maintaining them (Employee → merged into User, Department → deleted entirely)

## Lesan Framework Patterns

### Model Definition
```typescript
export const model_pure = {
  name: string(),
  description: optional(string()),
  ...createUpdateAt,
};

export const model_relations = {
  relationName: {
    schemaName: "targetModel",
    type: "single" as RelationDataType,
    optional: true,
    excludes: target_excludes,
    relatedRelations: {
      reverseRelation: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const modelFactory = () =>
  coreApp.odm.newModel("modelName", model_pure, model_relations);
```

### Action Pattern
Each action has 3 files in a subdirectory:
- `mod.ts` - Registers the action with Lesan
- `[action].fn.ts` - Function implementation
- `[action].val.ts` - Validator definition

```typescript
// add/mod.ts
export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "modelName",
    fn: addFn,
    actName: "add",
    preAct: [setTokens, setUser, grantAccess([{ roles: ["Manager"] }])],
    validator: addValidator(),
    validationRunType: "create",
  });

// add/add.val.ts
export const addValidator = () => object({
  set: object({ ...activeRoleMixin, ...model_pure, relationId: objectIdValidation }),
  get: selectStruct("modelName", 1),
});

// add/add.fn.ts
export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, ...rest } = set;
  return await model.insertOne({
    doc: rest,
    projection: get,
    relations: { relationName: { _ids: [new ObjectId(set.relationId)] } },
  });
};
```

### One-Directional Relations — Never Duplicate

Relations are strictly one-directional. When Model A defines a relation to Model B with `relatedRelations`, Lesan automatically creates and manages the reverse on Model B. **Never define the same relation on both models.**

**✅ Correct pattern — define relation on the "child" only:**
```typescript
// models/child.ts — THIS IS CORRECT
export const child_relations = {
  parent: {
    schemaName: "parent",
    type: "single",
    optional: false,
    relatedRelations: {
      // Lesan auto-creates parent.children from this
      children: {
        type: "multiple",
        limit: 50,
        sort: { field: "_id", order: "desc" },
      },
    },
  },
};
```

```typescript
// models/parent.ts — Just define its own relations
export const parent_relations = {
  // No "children" relation here — Lesan handles it automatically
};
```

**❌ Wrong pattern — never define reverse on the parent:**
```typescript
// models/parent.ts — DON'T DO THIS
export const parent_relations = {
  children: {  // ❌ This creates duplicates and errors
    schemaName: "child",
    type: "multiple",
    relatedRelations: { parent: ... },
  },
};
```

**Key rule:** The model that "belongs to" another model (has the foreign key) defines the relation. The parent model stays clean — Lesan embeds the reverse automatically.

**Examples in this codebase:**
- `wareClass.ts` defines `wareType` with `relatedRelations: { wareClasses: {...} }` → Lesan auto-creates `wareType.wareClasses`
- `wareGroup.ts` defines `wareType` with `relatedRelations: { wareGroups: {...} }` → Lesan auto-creates `wareType.wareGroups`
- `wareGroup.ts` defines `wareClasses` (M:N) with `relatedRelations: { wareGroups: {...} }` → Lesan auto-creates `wareClass.wareGroups`
- `wareModel.ts` defines `wareType`, `wareClass`, `wareGroup` with proper `relatedRelations`
- `ware.ts` defines `manufacturer`, `wareType`, `wareClass`, `wareGroup`, `wareModel`, `stuffs` — all ware's own relations
- `stuff.ts` defines `ware`, `store`, `wareType`, `wareClass`, `wareGroup`, `wareModel` — all stuff's own relations

**What NOT to define on parent models (❌ Wrong — fixed):**
- `wareType` should NOT define `wareClasses`, `wareGroups`, `wareModels`, `wares`, `stuffs` (these are child relations)
- `manufacturer` should NOT define `wares` (ware already defines `manufacturer`)
- `store` should NOT define `stuffs` (stuff already defines `store`)

### Lesan Relation Storage Model — Single Relations Are Embedded

Lesan **embeds** single-type relations directly in the parent document as an inline subdocument containing the full related object (all pure fields + `_id`). This means:

- **No performance penalty**: A `type: "single"` relation is just a nested object in the same document. Reading it requires zero additional queries or joins.
- **Fully indexable**: You can create MongoDB indexes on relation sub-fields like `relatedModel._id` or `relatedModel.name` just as you would on any top-level field.
- **No denormalization needed for performance**: Storing `relatedModelId` and `relatedModelName` as separate pure fields provides no query or speed advantage over a single Lesan relation — the data lives in the same document either way.

Use Lesan relations by default for single-model references. Only resort to pure-field IDs/names when the referenced model may be deleted and you need the reference to survive (orphan resilience), or when the data must be an immutable snapshot that should not track source-of-truth updates.

### `hardCascade` in Lesan `deleteOne`

Lesan's `deleteOne` method accepts an optional `hardCascade` boolean. Understanding its behavior is critical for correct deletion order in E2E tests and production code.

**Without `hardCascade` (default — safe):**
- Deleting a **child** removes it from the parent's embedded reverse array **automatically**. No manual cleanup needed.
- Deleting a **parent** is **blocked** if children still reference it via a reverse relation. Lesan returns an error telling you to handle children first.
- This ensures data integrity — you can always delete children safely, but you cannot accidentally orphan them.

**With `hardCascade: true` (dangerous):**
- Deleting a **parent** **cascade-deletes all children** that reference it via the reverse relation.
- Use only when you are certain you want to delete entire trees of data.
- Inadvisable for routine use — a wrong `hardCascade` can silently wipe large amounts of related data.

**Practical example — Country → City:**

```typescript
// models/city.ts (child defines the relation)
city_relations = {
  country: {
    schemaName: "country",
    type: "single",
    optional: false,
    relatedRelations: {
      // Lesan auto-creates country.cities from this
      cities: { type: "multiple", limit: 999, sort: { field: "_id", order: "desc" } },
    },
  },
};

// models/country.ts (pure fields only — no cities relation here)
country_pure = { name: string(), code: string(), ...createUpdateAt };
```

| Action | `hardCascade` | Result |
|--------|---------------|--------|
| `city.deleteOne({ filter })` | not passed / `false` | ✅ City deleted. Country's embedded `cities` array auto-cleaned. |
| `country.deleteOne({ filter })` | not passed / `false` | ❌ Blocked: "please clear cities relation before deletion" |
| `country.deleteOne({ filter, hardCascade: true })` | `true` | ✅ Country deleted. **All its cities cascade-deleted**. |

**Pattern in remove functions (this codebase):**
```typescript
// Every remove.fn.ts follows this exact pattern:
return await modelName.deleteOne({
  filter: { _id: new ObjectId(_id as string) },
  hardCascade: hardCascade || false,  // default: no cascade
});
```

Setting `hardCascade: false` explicitly means "use default safe behavior" — child deletion auto-cleanup works, parent deletion is blocked. Do NOT change this to a conditional (only pass `hardCascade` when true), because `hardCascade: false` and omitting `hardCascade` are semantically identical in Lesan — both mean "default safe mode."

**Bottom line:** Always delete children first, never rely on `hardCascade` for routine cleanup. The E2E remove order MUST delete from leaf nodes upward (children before parents).

### Denormalized Hierarchy Pattern
Ware and Stuff models use denormalized relations to WareType, WareClass, WareGroup, and WareModel. Unit.organization is also denormalized. This enables:
- Filtering by any level of the hierarchy without joins
- Querying all items in a category efficiently
- Consistent hierarchy traversal

## Complete Model & API Reference

### Organizational Models

| Model | Acts | Special Endpoints | Auth Required |
|-------|------|-------------------|---------------|
| **User** | addUser, get, gets, update, updateRelations, remove, count | login, register, tempUser, getMe, dashboardStatistic | Mixed (login/register/tempUser: public; getMe: auth only; all others: auth + activeRoleId) |
| **File** | get, gets, getFiles, update, uploadFile | - | Mixed |
| **Tag** | add, get, gets, update, remove, count | - | Mixed |
| **Organization** | add, get, gets, update, updateRelations, remove, count | - | Mixed |
| **Unit** | add, get, gets, update, updateRelations, remove, count | type filter in gets/count; UnitHead can CRUD their own units | Mixed |
| **Process** | add, get, gets, update, updateRelations, remove, count | activateProcess, duplicateProcess | Mixed |
| **ProcessStep** | add, get, gets, update, updateRelations, remove, count | auto-reorders on add/remove/update | Mixed |

### Procurement & Purchasing Models

| Model | Acts | Custom Actions | Auth Required |
|-------|------|----------------|---------------|
| **StepApproval** | add, get, gets | submitDecision | Mixed |
| **PurchasingRequest** | add, get, gets, update, updateRelations, remove, count | submit, getHistory, assignStore, warehouseCheck, checkStoreAvailability | Mixed |
| **PurchaseOrderItem** | add, get, gets, update, updateRelations, remove, count | - | Mixed |
| **Tender** | add, get, gets, update, updateRelations, remove, count | close, award | Mixed |
| **TenderOffer** | get, gets | submit (by vendors) | Mixed |

### Warehouse/Inventory Models

| Model | Acts | Pure Fields | Auth Required |
|-------|------|-------------|---------------|
| **State** | add, get, gets, update, remove, count | name, enName | Mixed |
| **City** | add, get, gets, update, updateRelations, remove, count | name, enName | Mixed |
| **Manufacturer** | add, get, gets, update, updateRelations, remove, count | name, enName, country | Mixed |
| **WareType** | add, get, gets, update, remove, count | name, enName | Mixed |
| **WareClass** | add, get, gets, update, updateRelations, remove, count | name, enName | Mixed |
| **WareGroup** | add, get, gets, update, updateRelations, remove, count | name, enName | Mixed |
| **WareModel** | add, get, gets, update, updateRelations, remove, count | name, enName | Mixed |
| **Ware** | add, get, gets, update, updateRelations, remove, count | name, enName, brand, price, orderedNumber, irc, umdns, gtin, photoUrl | Mixed |
| **Stuff** | add, get, gets, update, updateRelations, remove, count | inventoryNo, price, hasAbsolutePrice, pricePercentage, expiration, barcode, qrc, isBarcodeSet, isQrcSet, isExpirationNear, photoUrl, apiId, apiLink, availableLongPayment, month price fields | Mixed |
| **Store** | add, get, gets, update, updateRelations, remove, count | name, address, location, contact, logoUrl, ceoname, workingHours, delivery times, fastDelivery, isAvailableInHolidays, status, score, totalSoldAmount, totalSoldNum, email, storeType, economicCode, postalCode, certificateUrl, bankCardNumber, shebaNumber, nameOfAccountHolder, bankName, certificateNumber, registerNumber, certificateExpireDate, legalPerson, nationalId | Mixed |
| **Inventory** | add, get, gets, update, count | adjust, transfer (custom) | Mixed |
| **StockMovement** | get, gets, count | read-only (created by system) | Mixed |
| **ConsumptionRecord** | add, get, gets, count | add triggers removeStock | Mixed |

### Budget & Finance Models

| Model | Acts | Custom Actions | Auth Required |
|-------|------|----------------|---------------|
| **FiscalYear** | add, get, gets, update | close | Mixed |
| **BudgetLine** | add, get, gets, update, count | getBudgetReport, getYearEndReport | Mixed |
| **BudgetAllocation** | add, get, gets | add increments totalAllocated | Mixed |
| **BudgetEncumbrance** | add, get, gets | release, convertToSpend | Mixed |
| **GoodsReceipt** | add, get, gets, update | add triggers inventory + auto-flows | Mixed |
| **PaymentOrder** | add, get, gets, update | markPaid | Mixed |

### User Roles
- Manager, Admin, OrgHead, UnitHead, Employee, Ordinary
- `isGhost` boolean replaces the former "Ghost" level (bootstrap user bypass).
- Each role has a unique `roleId` (UUID), `name`, optional `scopeType` ("organization" | "unit"), and optional `scopeId`.
- *DeptHead was removed when Department model was eliminated.*
- *Level was fully replaced by the `roles` array. Single-level no longer exists.*

### Pricing Logic (Stuff)
1. **Ware.price** is the system base price.
2. **Stuff** can be priced:
   - **Absolute**: `hasAbsolutePrice = true`, uses `Stuff.price` directly.
   - **Percentage**: `pricePercentage` is applied to `Ware.price` → `stuffPrice = warePrice * (1 + pricePercentage/100)`.
3. **Long payment prices**: For each month, if a `{month}MonthPricePercent` is set, the price = `ware.price * (1 + percent/100)` (or `stuffPrice` if `isExpirationNear`).

## Complete Relation Maps

### Organizational Relation Map

```
User
  ├── avatar (File)
  ├── organization (Organization) [optional]
  └── units (Unit) [multiple, optional]

Organization
  ├── logo (File)
  ├── creator (User)
  └── (departments removed)

Unit
  ├── organization (Organization) [optional, denormalized on all units]
  ├── parentUnit (Unit) [optional, self-referential for tree]
  ├── head (User) [optional]
  └── type: enum (General|Warehouse|Logistics|Production|Administration|Expert)
  └── attributes: address, phone, email, warehouseCapacity, hasColdStorage, fleetSize, serviceRadius (optional)

Process
  ├── organization (Organization)
  ├── createdBy (User)


ProcessStep
  ├── process (Process)
  └── assigneeGroups [embedded: array({ operator, unitIds })]

PurchasingRequest
  ├── process (Process)
  ├── requester (User)
  ├── requestingUnit (Unit)
  ├── attachments (File)
  ├── stepApprovals (StepApproval) [multiple]
  ├── purchaseOrderItems (PurchaseOrderItem) [multiple]
  ├── tender (Tender) [single, optional]
  ├── goodsReceipts (GoodsReceipt) [multiple]
  ├── paymentOrders (PaymentOrder) [multiple]
  └── budgetLine (BudgetLine) [single, optional]

StepApproval
  ├── purchasingRequest (PurchasingRequest)
  ├── processStep (ProcessStep)
  ├── unit (Unit)
  └── decidedBy (User) [optional]

StepApproval
  ├── purchasingRequest (PurchasingRequest)
  ├── processStep (ProcessStep)
  ├── unit (Unit)
  └── decidedBy (User) [optional]
```

### Procurement Relation Map

```
PurchaseOrderItem
  ├── purchasingRequest (PurchasingRequest) [single]
  ├── assignedFrom (Store) [single, optional]
  ├── assignedBy (User) [single, optional]
  └── tenderOffer (TenderOffer) [single, optional]

Tender
  ├── purchasingRequest (PurchasingRequest) [single]
  ├── createdBy (User) [single]
  ├── assignedVendors (Store) [multiple, optional]
  └── offers (TenderOffer) [multiple, optional]

TenderOffer
  ├── tender (Tender) [single]
  ├── store (Store) [single]
  └── purchaseOrderItem (PurchaseOrderItem) [single, optional]
```

### Warehouse & Inventory Relation Map

```
Manufacturer
  └── (wares via relatedRelations from ware.manufacturer) [multiple]

WareType
  ├── creator (User) [single]
  └── (wareClasses via relatedRelations from wareClass.wareType) [multiple]
  └── (wareGroups via relatedRelations from wareGroup.wareType) [multiple]
  └── (wareModels via relatedRelations from wareModel.wareType) [multiple]
  └── (wares via relatedRelations from ware.wareType) [multiple]
  └── (stuffs via relatedRelations from stuff.wareType) [multiple]

WareClass
  ├── creator (User) [single]
  ├── wareType (WareType) [single]
  ├── wareGroups (WareGroup) [multiple, M:N via wareGroup.wareClasses]
  ├── wareModels (WareModel) [multiple]
  ├── wares (Ware) [multiple]
  └── stuffs (Stuff) [multiple]

WareGroup
  ├── creator (User) [single]
  ├── wareType (WareType) [single]
  ├── wareClasses (WareClass) [multiple, M:N, limit: 50]
  ├── wareModels (WareModel) [multiple]
  ├── wares (Ware) [multiple]
  └── stuffs (Stuff) [multiple]

WareModel
  ├── creator (User) [single]
  ├── wareType (WareType) [single]
  ├── wareClass (WareClass) [single]
  ├── wareGroup (WareGroup) [single]
  ├── wares (Ware) [multiple]
  └── stuffs (Stuff) [multiple]

Ware
  ├── creator (User) [single]
  ├── manufacturer (Manufacturer) [single, optional]
  ├── wareType (WareType) [single]
  ├── wareClass (WareClass) [single]
  ├── wareGroup (WareGroup) [single]
  ├── wareModel (WareModel) [single]
  └── stuffs (Stuff) [multiple]

Stuff
  ├── ware (Ware) [single]
  ├── store (Store) [single]
  ├── wareType (WareType) [single, denormalized]
  ├── wareClass (WareClass) [single, denormalized]
  ├── wareGroup (WareGroup) [single, denormalized]
  └── wareModel (WareModel) [single, denormalized]

Store
  ├── storeHead (User) [single, optional]
  ├── city (City) [single, optional]
  ├── state (State) [single, optional]
  └── wareTypes (WareType) [multiple, M:N]
  └── (purchaseOrderItems auto-generated from purchaseOrderItem.assignedFrom via Lesan) [multiple, optional]

Inventory
  ├── unit (Unit) [single — inventory owner]
  ├── warehouseUnit (Unit) [single, optional — org warehouse]
  ├── wareModel (WareModel) [single]
  └── ware (Ware) [single, optional]

StockMovement
  ├── unit (Unit) [single]
  ├── createdBy (User) [single]
  └── store (Store) [single, optional]

ConsumptionRecord
  ├── unit (Unit) [single]
  ├── consumedBy (User) [single]
  ├── inventory (Inventory) [single, optional]
  ├── wareModel (WareModel) [single]
  └── ware (Ware) [single, optional]
```

### Budget & Finance Relation Map

```
FiscalYear
  └── budgetLines (BudgetLine) [multiple]

BudgetLine
  ├── fiscalYear (FiscalYear) [single]
  ├── organization (Organization) [single]
  ├── unit (Unit) [single, optional]
  ├── wareType (WareType) [single, optional]
  ├── allocations (BudgetAllocation) [multiple]
  ├── encumbrances (BudgetEncumbrance) [multiple]
  └── (purchasingRequests auto-generated from purchasingRequest.budgetLine via Lesan) [multiple, optional]

BudgetAllocation
  ├── budgetLine (BudgetLine) [single]
  └── allocatedBy (User) [single]

BudgetEncumbrance
  ├── budgetLine (BudgetLine) [single]
  └── createdBy (User) [single]

GoodsReceipt
  ├── purchasingRequest (PurchasingRequest) [single]
  ├── receivedBy (User) [single]
  └── receivingUnit (Unit) [single]

PaymentOrder
  ├── purchasingRequest (PurchasingRequest) [single]
  ├── issuedBy (User) [single]
  ├── approvedBy (User) [single, optional]
  ├── payTo (Store) [single]
  └── financialUnit (Unit) [single]
```
