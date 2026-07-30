# OrgHead Management Feature Expansion

## Overview
Add full management capabilities to the OrgHead panel: org chart, units CRUD, users CRUD, processes + steps CRUD, and organization settings. Currently OrgHead has read-only dashboard views (inventory, consumption, stock-movements, requests). This adds full CRUD for the core organizational entities.

## Architectures
- **Sidebar**: New `OrgHeadSidebar` replaces header-only navigation. Slim collapsible sidebar with sections: Dashboard, Organization (Org Chart, Units, Users), Processes, Warehouse (Inventory, Consumption, Stock Movements), Settings.
- **Layout**: Modified `/orghead/layout.tsx` — wraps `PanelLayout` + `OrgHeadSidebar`.
- **Separate add/edit pages** (full-page forms, not inline dialogs).
- **Visual SVG tree** for org chart (rounded cards + bezier curves, pan/zoom, collapsible branches).
- All existing routes preserved and included in sidebar.

## Routes

```
/orghead/
├── page.tsx                    # Dashboard (unchanged)
├── org-chart/                  # Visual SVG org tree (NEW)
│   ├── page.tsx
│   └── org-chart-client.tsx
├── units/                      # Unit CRUD (NEW)
│   ├── page.tsx
│   ├── units-client.tsx
│   ├── add/page.tsx
│   └── [id]/page.tsx
├── users/                      # User CRUD (NEW)
│   ├── page.tsx
│   ├── users-client.tsx
│   ├── add/page.tsx
│   └── [id]/page.tsx
├── processes/                  # Process CRUD (NEW)
│   ├── page.tsx
│   ├── processes-client.tsx
│   ├── add/page.tsx
│   └── [id]/page.tsx           # Includes step builder
├── settings/                   # Organization settings (NEW)
│   ├── page.tsx
│   └── settings-client.tsx
├── requests/                   # (unchanged)
├── inventory/                  # (unchanged)
├── consumption/                # (unchanged)
└── stock-movements/            # (unchanged)
```

## Implementation Order

### Phase 1: Layout + Sidebar
**Files:** `src/app/orghead/layout.tsx` (modify), `src/components/layout/orghead-sidebar.tsx` (new)

- Extract current layout logic into `OrgHeadSidebar` component
- Sidebar sections: Dashboard, Organization, Processes, Warehouse, Settings
- Collapsible (narrow/wide) with localStorage persistence
- Active route highlighting
- Responsive: sheet drawer on mobile
- Ambient background + glass styling consistent with admin

### Phase 2: Org Chart
**Files:** `src/app/orghead/org-chart/page.tsx`, `org-chart-client.tsx` (new)

- **Data:** Fetch units via `unit/gets` with `parentUnit`, `head`, `organization`, `subUnits`
- **SVG Tree Component:**
  - Nodes: glass cards with unit name, type badge, head name
  - Edges: bezier curves SVG paths
  - Collapsible via chevron per node
  - Pan: drag empty space
  - Zoom: Ctrl+scroll or pinch
  - Color-coded by unit type
  - Click node → navigate to `/orghead/units/[id]`
- **Legend:** small key showing unit type colors
- **Empty state:** "سازمانی فاقد واحد است"

### Phase 3: Units CRUD
**Files:** `src/app/orghead/units/page.tsx`, `units-client.tsx`, `add/page.tsx`, `[id]/page.tsx` (new)

**List page:**
- Toggle between Org Chart view and DataTable
- DataTable columns: name, type, parent unit, head, isActive, created date
- Card view: rich glass card with unit detail
- Delete with confirm dialog

**Add/Edit form fields:**
- name (required), enName
- type (select: General/Warehouse/Logistics/Production/Administration/Finance/Expert)
- parentUnit (SearchSelect — filter units within org)
- head (SearchSelect — filter users with unit access)
- description (textarea), address, phone, email
- isActive (checkbox)
- Warehouse-specific: warehouseCapacity, hasColdStorage (conditional on type=Warehouse)
- Logistics-specific: fleetSize, serviceRadius (conditional on type=Logistics)

**Relations:** On edit page, bottom section for parentUnit (replace + remove) and head.

**Server actions used:** `unit/gets`, `unit/get`, `unit/add`, `unit/update`, `unit/updateRelations`, `unit/remove`, `unit/count`

### Phase 4: Users CRUD
**Files:** `src/app/orghead/users/page.tsx`, `users-client.tsx`, `add/page.tsx`, `[id]/page.tsx` (new)

**List page:**
- DataTable: first_name, last_name, email, mobile, position, role badges, isActive
- Card view with contact detail
- Search by name/email
- Delete with confirm

**Add/Edit form fields:**
- first_name (required), last_name (required)
- email (required), mobile (pattern)
- gender (Male/Female select)
- position, birth_date
- isActive, isVerified
- password (add only, with FormPasswordInput)

**Role assignment (inline section):**
- Dynamic role list (add/remove role rows)
- Per role: name selector (dropdown), scopeType (organization/unit/store), scopeId (SearchSelect)
- Organization assignment auto-set to current org

**Server actions used:** `user/getUsers`, `user/getUser`, `user/addUser`, `user/updateUser`, `user/removeUser`, `user/updateUserRelations`

### Phase 5: Processes CRUD + Steps
**Files:** `src/app/orghead/processes/page.tsx`, `processes-client.tsx`, `add/page.tsx`, `[id]/page.tsx` (new)

**List page:**
- DataTable: name, status (Draft/Active/Archived badges), unit scope, step count, created date
- Card view with process info
- Search by name
- Bulk actions: none

**Add/Edit form fields:**
- name (required), description
- unit (SearchSelect — scope to a unit)
- ware/wareModel/wareGroup/wareClass/wareType (SearchSelect — scope to classification)
- status (select: Draft/Active/Archived — via `activateProcess` for Draft → Active)
- isActive

**Process detail page (`[id]`):**
- Top section: process info + status badge + Activate button
- Tabs or sections:
  1. **Edit Info** — pure fields form
  2. **Steps** — inline ProcessBuilder component (reuse from admin)
  3. **Relations** — unit, ware classification via SearchSelect

**Step management:** Reuse `src/components/process/process-builder.tsx` (admin's existing component). Already supports:
- Drag-to-reorder
- Inline name/type editing
- Assignee group configuration
- Add/remove steps

**Server actions used:** `process/gets`, `process/get`, `process/add`, `process/update`, `process/updateRelations`, `process/remove`, `process/activateProcess`, `processStep/*`

### Phase 6: Organization Settings
**Files:** `src/app/orghead/settings/page.tsx`, `settings-client.tsx` (new)

**Single-page form:**
- **Info card at top:** org name, logo, stats (unit count, user count, process count)
- **Pure fields section:** name, enName, description
- **Relations section:** logo (file upload), head (SearchSelect → user), state (SearchSelect), city (SearchSelect)
- **Location section:** lat/lng inputs (GeoJSON)

**Delete section:** Danger zone with confirm dialog (soft delete via isActive=false or full remove)

**Server actions used:** `organization/get`, `organization/update`, `organization/updateRelations`

## Shared Components to Build

| Component | Purpose |
|-----------|---------|
| `src/components/orghead/orghead-sidebar.tsx` | Sidebar for orghead routes |
| `src/components/orghead/org-chart-tree.tsx` | SVG visual tree with bezier edges |
| `src/components/orghead/org-chart-node.tsx` | Individual node card in the tree |

## Shared Components to Reuse (already exist)

| Component | Import |
|-----------|--------|
| `DataTable`, `Column` | `@/components/ui/data-table` |
| `PageHeader` | `@/components/ui/page-header` |
| `Pagination` | `@/components/ui/pagination` |
| `FilterBar` | `@/components/ui/filter-bar` |
| `ConfirmDialog` | `@/components/ui/confirm-dialog` |
| `FormInput` | `@/components/form/form-input` |
| `FormTextarea` | `@/components/form/form-textarea` |
| `FormCheckbox` | `@/components/form/form-checkbox` |
| `FormSelect` | `@/components/form/form-select` |
| `FormSearchSelect`, `SearchSelect` | `@/components/form/form-search-select` |
| `FormPasswordInput` | `@/components/form/form-password-input` |
| `FormCard` | `@/components/form/form-card` |
| `FormSection` | `@/components/form/form-section` |
| `StatusBadge` | `@/components/ui/status-badge` |
| `ErrorState` | `@/components/ui/error-state` |
| `LoadingSkeleton` | `@/components/ui/loading-skeleton` |
| `ProcessBuilder` | `@/components/process/process-builder` |

## UI/UX Notes
- All text Persian-only (consistent with existing pattern)
- Dark theme with AuthKit glass styling
- Cards use `variant="glass"` or `className="glass-card glass-card-hover-active"`
- Input focus rings: `focus:border-ring focus:ring-3 focus:ring-ring/50`
- Logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`) for RTL
- All forms use `react-hook-form` + `zodV4Resolver` + Zod schemas
- Server actions wrapped in try/catch with Persian error messages
- Responsive: sidebar → sheet on mobile, tables → cards on mobile

## Estimated Effort
- ~15 new files
- ~2,500–3,000 lines total
- No new npm dependencies (pure SVG, reuse existing component library)
