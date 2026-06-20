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

The backend defines the following core models across two domains:

#### Organizational Management Domain
- **User** - User authentication and authorization (first_name, last_name, gender, birth_date, mobile, email, password, is_verified, isGhost, roles, position, isActive). Relations: avatar, organization, units. *Employee was merged into User - User now has position, isActive, and can be assigned to units directly. Level was replaced by multi-role `roles` array.*
- **File** - File upload management (name, mimeType, size, type: image/video/docs/other, alt_text)
- **Tag** - Metadata categorization (name, description, color, icon)
- **Organization** - Organizations that own purchasing processes (name, enName, description, isActive)
- **Unit** - Hierarchical units/subunits in a tree (name, enName, description, isActive, organization denormalized on all units, parentUnit for nesting, head as User). Unit has a `type` enum (General|Warehouse|Logistics|Production|Administration|Expert, defaults to "General") and optional attribute fields: address, phone, email, warehouseCapacity, hasColdStorage, fleetSize, serviceRadius. *Department was eliminated - Unit now connects directly to Organization.*
- **Process** - Process builder workflow definitions (name, description, status, version, isActive, assignedUnits for scope)
- **ProcessStep** - Individual steps within a purchasing process (name, description, stepType, order, required, groupsOperator). *Assignees are now via ProcessStepAssigneeGroup with OR/AND logic instead of direct assignedDepartment/assignedUnit/assignedUser.*
- **ProcessStepAssigneeGroup** - OR/AND grouping of units for a process step (operator: AND|OR, relations to processStep and units)
- **StepApproval** - Per-unit per-step approval decisions (status: pending|approved|rejected, comment, decidedAt, relations to purchasingRequest, processStep, unit, decidedBy)
- **PurchasingRequest** - Actual purchasing requests flowing through processes (title, description, amount, status, currentStep, stepApprovals)

#### Warehouse/Inventory Domain
- **State** - Geographic state/province (name, enName)
- **City** - Geographic city (name, enName, state relation)
- **Manufacturer** - Product manufacturer/producer (name, enName, country)
- **WareType** - Top-level ware classification (name, enName) - e.g. "laboratory equipment", "medicine"
- **WareClass** - Second-level classification (name, enName, wareType relation) - e.g. "hematology", "biochemistry"
- **WareGroup** - Third-level classification (name, enName, wareType relation) - e.g. "kit", "vial", "liquid"
- **WareModel** - Fourth-level specific model (name, enName, wareType, wareClass, wareGroup relations) - e.g. "TSH kit", "Lize 0.5 litre"
- **Ware** - The actual product (name, enName, brand, price, orderedNumber, irc, umdns, gtin, photoUrl, relations to manufacturer + all 4 hierarchy levels)
- **Stuff** - Store inventory (ware, store, inventoryNo, price, pricing mode, expiration, barcode, qrc, photoUrl, long payment pricing)
- **Store** - Seller entity (name, address, location, contact, logo, city, state, storeHead, wareTypes, ceoname, working hours, delivery info, status, score, email, storeType, economicCode, postalCode, bank info, certificate info)

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

1. **Process** defines a purchasing workflow (Draft → Active → Archived). Each process has `assignedUnits` which scopes which units participate.
2. **ProcessStep** defines individual steps (Approval/Review/Notification/Action) with ordering.
3. **ProcessStepAssigneeGroup** groups units with an `operator` (AND/OR). Steps have a `groupsOperator` (AND/OR) that defines how groups combine.
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
│   ├── process/            # Process actions
│   ├── processStep/        # ProcessStep actions
│   ├── processStepAssigneeGroup/  # ProcessStepAssigneeGroup actions (new)
│   ├── stepApproval/       # StepApproval actions (new)
│   ├── purchasingRequest/  # PurchasingRequest actions
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
└── utils/                  # Utility functions (context, grantAccess, activeRole, setToken, setUser, stepEvaluator, etc.)
```

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
- Auto-generated type declarations for frontend integration
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
| **Process** | add, get, gets, update, updateRelations, remove, count | - | Mixed |
| **ProcessStep** | add, get, gets, update, updateRelations, remove, count | - | Mixed |
| **ProcessStepAssigneeGroup** | add, get, gets, update, updateRelations, remove, count | - | Mixed |
| **StepApproval** | add, get, gets | - | Mixed |
| **PurchasingRequest** | add, get, gets, update, updateRelations, remove, count | - | Mixed |

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

## Recent Architectural Changes (Session Summary)

### 1. Employee → Merged into User
- **Why**: No user would log in without having an employee role. The separation was unnecessary.
- **What moved**: `position`, `isActive`, `department` relation, `units` relation → User model.
- **Deleted**: `models/employee.ts`, `src/employee/` (entire directory).
- **Reverse relations updated**: `department.head` (user), `unit.head` (user), `department.members` (users via user.department), `unit.members` (users via user.units).

### 2. Department → Eliminated
- **Why**: Redundant since Unit already supports infinite nesting via `parentUnit`/`subUnits`. The entire hierarchy can be represented as Organization → Unit (tree).
- **Unit.organization** added (denormalized on all units for query efficiency) to replace `Unit.department`.
- **User.department** removed (User lost the department relation added during the Employee merge).
- **Organization.departments** removed.
- **User levels**: Removed `DeptHead`.
- **Deleted**: `models/department.ts`, `src/department/` (entire directory).

### 3. Process Redesign (OR/AND + Unit-Based Assignment)
- **Old approach**: ProcessStep had `assignedDepartment`, `assignedUnit`, `assignedUser` as single optional relations.
- **New approach**:
  - **Process.assignedUnits** — scopes which units participate in the process.
  - **ProcessStep.groupsOperator** (AND|OR) — how assignee groups combine.
  - **ProcessStepAssigneeGroup** — each group has an `operator` (AND|OR) and multiple `units`.
  - **StepApproval** — tracks per-unit, per-step decisions (approved/rejected/pending) on each PurchasingRequest.
- **New files**: `models/processStepAssigneeGroup.ts`, `models/stepApproval.ts`, `utils/stepEvaluator.ts`, `src/processStepAssigneeGroup/`, `src/stepApproval/`.

### 4. Multi-Role Authorization System (Implemented)

- **Why**: A user may hold multiple roles across different orgs/units (e.g., OrgHead of OrgA, UnitHead of UnitB). The old single-level system couldn't represent this.
- **What replaced `level`**: A `roles` array on User: `[{ roleId, name, scopeType?, scopeId? }]`. Each role has a UUID `roleId` for client reference.
- **Auth flow**:
  - Token in request header (`token` key) — verified by `setTokens`
  - `activeRoleId` in `body.details.set` — tells the system which role the user is acting as
  - `grantAccess` resolves the role and checks permissions + optional scope match
  - `isGhost` boolean on User bypasses all auth checks (bootstrap user)
- **`getMe`** is the only auth'd action that doesn't require `activeRoleId` — it returns the user's full profile including roles, so the client can select one.
- **Scope checking**: OrgHead can be scoped to an organization (`scopeType: "organization"`), UnitHead scoped to a unit (`scopeType: "unit"`). `grantAccess` accepts a `getScope` callback that extracts the resource's scope from the request body.
- **Read actions**: All `get`/`gets`/`count` now require authentication (previously public), with any role accepted.
- **Public endpoints** (no auth): `login`, `register`, `tempUser`.
- **New files**: `utils/activeRole.ts` — contains `activeRoleMixin` (shared validator spread) and `stripActiveRole` helper.
- **Deleted**: `user_level_array`, `user_level_emums`, old `grantAccess` with `{ levels, isOwn }` format.

### 5. Unit Type Enum + Attribute Fields (Implemented)

- **Why**: Units needed semantic categorization (Warehouse, Logistics, Expert, etc.) with type-specific attribute fields, without a separate model.
- **What was added to `unit_pure`**:
  - `type` enum field: `["General", "Warehouse", "Logistics", "Production", "Administration", "Expert"]`, defaults to `"General"`.
  - Attribute fields: `address`, `phone`, `email` (common), `warehouseCapacity`, `hasColdStorage` (warehouse), `fleetSize`, `serviceRadius` (logistics).
- **Auth updates**: UnitHead can now add/update/remove units scoped to their own unit (add requires `parentUnitId` matching their unit; update/remove/updateRelations require `_id` matching their unit).
- **New files**: None (all changes in-place on existing model/actions).
- **No new model**: Type is a simple enum on Unit — no separate UnitType model.

### 6. ClassGroup Removed + One-Directional Relations Fixed (Implemented)

- **Why**: ClassGroup was a join table from PostgreSQL — unnecessary in NoSQL. Parent models (wareType, manufacturer, store) had duplicate relation definitions that should be one-directional.
- **Deleted**: `models/classGroup.ts`, `src/classGroup/` (entire directory).
- **Fixed duplicate relations**:
  - `wareType_relations` — removed all 5 child relations (wareClasses, wareGroups, wareModels, wares, stuffs) — now empty `{}`.
  - `manufacturer_relations` — removed `wares` relation — now empty `{}`.
  - `store_relations` — removed `stuffs` relation (stuff.store already defines this via relatedRelations).
- **New M:N**: `wareGroup.wareClasses` replaces the ClassGroup join table — direct M:N with `limit: 50` (wareGroup → infinite classes → paginated) and no limit on reverse (wareClass → ~300-400 groups → all embedded).

### 7. Child Relations Removed from All Parent Models (Implemented)

- **Why**: Every parent model (wareClass, wareGroup, wareModel) had child relations (`wares`, `stuffs`, `wareModels`) explicitly defined — but these are already auto-created by Lesan via `relatedRelations` on the child models (ware, stuff, wareModel).
- **Deleted from `wareClass_relations`**: `wareModels`, `wares`, `stuffs` (only `wareType` + `wareGroups` M:N remain).
- **Deleted from `wareGroup_relations`**: `wareModels`, `wares`, `stuffs` (only `wareType` + `wareClasses` M:N remain).
- **Deleted from `wareModel_relations`**: `wares`, `stuffs` (only `wareType`, `wareClass`, `wareGroup` remain).
- **Rule**: A model should only define its own direct relations — its parents (single) and its own children (multiple). Relations of deeper descendants belong on those descendant models.

### 8. Current Relation Map (Organizational)

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
  └── assignedUnits (Unit) [multiple, optional]

ProcessStep
  ├── process (Process)
  └── assigneeGroups (ProcessStepAssigneeGroup) [multiple]

ProcessStepAssigneeGroup
  ├── processStep (ProcessStep)
  └── units (Unit) [multiple]

PurchasingRequest
  ├── process (Process)
  ├── requester (User)
  ├── requestingUnit (Unit)
  ├── attachments (File)
  └── stepApprovals (StepApproval) [multiple]

StepApproval
  ├── purchasingRequest (PurchasingRequest)
  ├── processStep (ProcessStep)
  ├── unit (Unit)
  └── decidedBy (User) [optional]
```

### 9. Warehouse Relation Map

```
Manufacturer
  └── (wares via relatedRelations from ware.manufacturer) [multiple]

WareType
  └── (wareClasses via relatedRelations from wareClass.wareType) [multiple]
  └── (wareGroups via relatedRelations from wareGroup.wareType) [multiple]
  └── (wareModels via relatedRelations from wareModel.wareType) [multiple]
  └── (wares via relatedRelations from ware.wareType) [multiple]
  └── (stuffs via relatedRelations from stuff.wareType) [multiple]

WareClass
  ├── wareType (WareType) [single]
  ├── wareGroups (WareGroup) [multiple, M:N via wareGroup.wareClasses]
  ├── wareModels (WareModel) [multiple]
  ├── wares (Ware) [multiple]
  └── stuffs (Stuff) [multiple]

WareGroup
  ├── wareType (WareType) [single]
  ├── wareClasses (WareClass) [multiple, M:N, limit: 50]
  ├── wareModels (WareModel) [multiple]
  ├── wares (Ware) [multiple]
  └── stuffs (Stuff) [multiple]

WareModel
  ├── wareType (WareType) [single]
  ├── wareClass (WareClass) [single]
  ├── wareGroup (WareGroup) [single]
  ├── wares (Ware) [multiple]
  └── stuffs (Stuff) [multiple]

Ware
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
```
