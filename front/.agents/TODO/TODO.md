# LesanSatek Frontend TODO.md

**Project**: LesanSatek Frontend – Organizational Process Management + Warehouse/Inventory + Budget/Finance System
**Goal**: Beautiful, functional, Persian (RTL) Next.js 16 frontend with shadcn/ui components, a full admin panel, and the complete procure-to-pay purchasing workflow
**Tech stack**: Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui (base-ui) + Zustand + React Hook Form + Zod + Lucide icons
**Design**: AuthKit-inspired dark theme — Midnight Ink canvas, Graphite Plate surfaces, Electric Iris accent, Estedad typography (see ../THEME/DESIGN.md)

**Workflow rules for AI agent**:
- **CRITICAL: Persian (fa) is the only language. All text, labels, validation messages, and notifications MUST be in Persian — never introduce English or second-language text.**
- **CRITICAL: RTL layout is non-negotiable. Every component must respect `dir="rtl"`. Never hardcode LTR values. Use logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) exclusively instead of physical ones.**
- Always read `CONTINUE.md` first as your system prompt.
- Work **one step at a time** from this TODO.md.
- After finishing a step: mark it `[x]`, add any notes.
- Never skip steps.
- Use **pnpm** for all commands.
- Use **Server Actions** for all backend communication (never direct client fetch).
- All UI must follow the AuthKit-inspired dark theme from ../THEME/DESIGN.md.
- All text and labels are in Persian (fa) — RTL layout.
- After each step, run `pnpm lint` and confirm no TypeScript errors.

## Phase 1: Project Setup & Configuration

### 1A: Next.js + shadcn/ui Scaffold (Done)
- [x] Next.js 16 app scaffolded with TypeScript, Tailwind v4, App Router
- [x] Install core dependencies (zustand, react-hook-form, zod, clsx, cva, tailwind-merge)
- [x] Install shadcn/ui with base-ui primitives (already: button, card, dialog, input, label, select)
- [x] Configure components.json with `"rtl": true`, `"style": "base-nova"`
- [x] Create `src/lib/utils.ts` with `cn()` utility
- [x] Setup Tailwind v4 globals.css with shadcn integration

## Phase 1 Complete ✅

### 1B: AuthKit Dark Theme Implementation
- [x] Apply AuthKit design tokens to `globals.css` — Midnight Ink, Graphite Plate, Electric Iris, etc.
- [x] Configure `@theme` block with all ../THEME/DESIGN.md color tokens
- [x] Add CSS custom properties for typography (Untitled Sans substitute, type scale)
- [x] Add CSS custom properties for spacing, border radius, shadows
- [x] Install next-themes for dark mode toggle
- [x] Create `src/components/providers/theme-provider.tsx`
- [x] Wire theme provider into root layout (lang=fa, dir=rtl, dark default)
- [x] Set dark mode as default (defaultTheme="dark", enableSystem=false)

### 1C: Environment & API Client
- [x] Create `.env.local` with `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_APP_URL`
- [x] Create `src/lib/api.ts` — Lesan AppApi client wrapping `lesanApi` from declarations
- [x] Add `token` header extraction from cookies in AppApi
- [x] Use type-safe `lesanApi` from `selectInp.ts` for full autocomplete

### 1D: Type Declarations from Backend
- [x] Copy `back/declarations/` to `src/types/declarations/`
- [x] `selectInp.ts` already includes `ReqType`, `DeepPartial`, and `lesanApi` — no separate index.ts needed
- [x] Verify type imports work (import from `@/types/declarations/selectInp`)

### 1E: Zustand Auth Store
- [x] Create `src/stores/authStore.ts` — Zustand store with user state, token handling, login/logout actions
- [x] Create `src/lib/auth.ts` — server-side auth helpers (getToken)

### 1F: Complete shadcn/ui Component Library
- [x] Added via shadcn CLI: Textarea, Checkbox, Table, Tabs, Badge, Avatar, DropdownMenu, Separator, Skeleton, Sheet, Command, ScrollArea, Tooltip, Progress, Switch
- [x] Added sonner (toast replacement) + created manual Form component (base-nova didn't include Form in registry)

### 1G: Reusable Form Components
- [x] Create `src/components/form/form-input.tsx` — Input with label, validation, error display
- [x] Create `src/components/form/form-select.tsx` — Select with label, validation
- [x] Create `src/components/form/form-textarea.tsx` — Textarea with label, validation
- [x] Create `src/components/form/form-checkbox.tsx` — Checkbox with label, validation
- [x] Create `src/components/form/form-card.tsx` — Grouped form section card

### 1H: Root Layout & Providers
- [x] Create `src/components/providers/index.tsx` — combine all providers (Theme, Tooltip)
- [x] Update root layout with proper RTL structure, Inter font loading (substitute for Untitled Sans)
- [x] Create root loading.tsx with Skeleton component
- [x] Create root page.tsx with proper Persian welcome page
- [x] Add Toaster (sonner) to root layout

## Phase 2: Authentication

### 2A: Auth Server Actions
- [x] Create `src/app/actions/auth/login.ts` — login with email + password, stores token as httpOnly cookie
- [x] Create `src/app/actions/auth/register.ts` — register new user via registerUser action
- [x] Create `src/app/actions/auth/logout.ts` — clear token cookie (no backend call needed)
- [x] Create `src/app/actions/auth/getMe.ts` — fetch current user with token from cookie
- [x] Create `src/app/actions/auth/tempUser.ts` — create temporary user (for ghost), stores token

### 2B: Auth Pages
- [x] Create login page `/login/page.tsx` with AuthKit design, shadcn form, Zod validation
- [x] Create register page `/register/page.tsx` with AuthKit design
- [x] Create `src/components/auth/login-form.tsx` — login form component (email + password)
- [x] Create `src/components/auth/register-form.tsx` — register form component (first_name, last_name, email, mobile, password)
- [x] All user-facing strings in Persian, no i18n

### 2C: Auth Guard Middleware
- [x] Create `src/middleware.ts` — Next.js middleware protecting /admin routes, redirecting to /login
- [x] Public routes: /login, /register; redirect to /admin if already authenticated
- [x] Create `src/components/auth/auth-guard.tsx` — client-side auth check wrapper using getMe + Zustand store

## Phase 3: Layout Components

### 3A: Header / Navigation
- [x] Create `src/components/layout/header.tsx` — top navigation bar with logo, user menu
- [x] Create `src/components/layout/user-menu.tsx` — dropdown user menu (profile, logout, admin link)
- [x] Create `src/components/layout/logo.tsx` — LesanSatek brand wordmark

### 3B: Admin Layout
- [x] Create `src/app/admin/layout.tsx` — admin panel layout with sidebar + AuthGuard
- [x] Create `src/components/layout/admin-sidebar.tsx` — sidebar with main/purchasing/warehouse/finance nav sections + mobile sheet nav
- [x] Create `src/components/layout/admin-header.tsx` — admin header with breadcrumbs + mobile nav trigger
- [x] Create `src/components/layout/breadcrumbs.tsx` — breadcrumb navigation with Persian route labels
- [x] Create `src/app/admin/page.tsx` — dashboard page with stat cards

### 3C: Common Admin Components
- [x] Create `src/components/ui/data-table.tsx` — reusable data table with sort, loading, empty state
- [x] Create `src/components/ui/pagination.tsx` — prev/next pagination with page indicator
- [x] Create `src/components/ui/empty-state.tsx` — empty state with icon, title, description, action
- [x] Create `src/components/ui/error-state.tsx` — error state with retry button
- [x] Create `src/components/ui/loading-skeleton.tsx` — skeleton loaders for table/card/list
- [x] Create `src/components/ui/search-input.tsx` — debounced search input with clear button
- [x] Create `src/components/ui/status-badge.tsx` — colored status badge for active/pending/approved/etc
- [x] Create `src/components/ui/page-header.tsx` — page title + description + actions bar
- [x] Create `src/components/ui/confirm-dialog.tsx` — confirmation dialog for destructive actions
- [x] Create `src/components/ui/filter-bar.tsx` — reusable filter bar with search, status select, reset

## Phase 4: Server Actions — Organizational Domain (Done)

### 4A: Organization Server Actions
- [x] Create `src/app/actions/organization/add.ts`
- [x] Create `src/app/actions/organization/get.ts`
- [x] Create `src/app/actions/organization/gets.ts`
- [x] Create `src/app/actions/organization/update.ts`
- [x] Create `src/app/actions/organization/updateRelations.ts`
- [x] Create `src/app/actions/organization/remove.ts`
- [x] Create `src/app/actions/organization/count.ts`

### 4B: User Server Actions (Employee merged into User)
- [x] Create `src/app/actions/user/addUser.ts`
- [x] Create `src/app/actions/user/getUser.ts`
- [x] Create `src/app/actions/user/getUsers.ts` (named `getUsers` not `gets` per backend)
- [x] Create `src/app/actions/user/updateUser.ts` (named `updateUser` per backend)
- [x] Create `src/app/actions/user/updateUserRelations.ts` (named `updateUserRelations` per backend)
- [x] Create `src/app/actions/user/removeUser.ts` (named `removeUser` per backend)
- [x] Create `src/app/actions/user/countUsers.ts` (named `countUsers` per backend)

### 4C: Unit Server Actions (Department eliminated — Unit is the only org node)
- [x] Create `src/app/actions/unit/add.ts`
- [x] Create `src/app/actions/unit/get.ts`
- [x] Create `src/app/actions/unit/gets.ts`
- [x] Create `src/app/actions/unit/update.ts`
- [x] Create `src/app/actions/unit/updateRelations.ts`
- [x] Create `src/app/actions/unit/remove.ts`
- [x] Create `src/app/actions/unit/count.ts`

### 4D: Process Server Actions
- [x] Create `src/app/actions/process/add.ts`
- [x] Create `src/app/actions/process/get.ts`
- [x] Create `src/app/actions/process/gets.ts`
- [x] Create `src/app/actions/process/update.ts`
- [x] Create `src/app/actions/process/updateRelations.ts`
- [x] Create `src/app/actions/process/remove.ts`
- [x] Create `src/app/actions/process/count.ts`
- [x] Create `src/app/actions/process/activateProcess.ts`
- [x] Create `src/app/actions/process/duplicateProcess.ts`

### 4E: ProcessStep Server Actions (assigneeGroups embedded, no ProcessStepAssigneeGroup)
- [x] Create `src/app/actions/processStep/add.ts`
- [x] Create `src/app/actions/processStep/get.ts`
- [x] Create `src/app/actions/processStep/gets.ts`
- [x] Create `src/app/actions/processStep/update.ts`
- [x] Create `src/app/actions/processStep/updateRelations.ts`
- [x] Create `src/app/actions/processStep/remove.ts`
- [x] Create `src/app/actions/processStep/count.ts`

### 4F: Tag Server Actions
- [x] Create `src/app/actions/tag/add.ts`
- [x] Create `src/app/actions/tag/get.ts`
- [x] Create `src/app/actions/tag/gets.ts`
- [x] Create `src/app/actions/tag/update.ts`
- [x] Create `src/app/actions/tag/remove.ts`
- [x] Create `src/app/actions/tag/count.ts`

### 4G: File Server Actions
- [x] Create `src/app/actions/file/uploadFile.ts`
- [x] Create `src/app/actions/file/get.ts`
- [x] Create `src/app/actions/file/gets.ts`
- [x] Create `src/app/actions/file/getFiles.ts` (batch file get)
- [x] Create `src/app/actions/file/update.ts`

## Phase 5: Server Actions — Warehouse & Inventory Domain

### 5A: Geographic (State/City)
- [x] Create `src/app/actions/state/add.ts` (and get, gets, update, remove, count)
- [x] Create `src/app/actions/city/add.ts` (and get, gets, update, updateRelations, remove, count)

### 5B: Product Classification Hierarchy (WareType → WareClass → WareGroup → WareModel)
- [x] Create `src/app/actions/wareType/add.ts` (and get, gets, update, remove, count)
- [x] Create `src/app/actions/wareClass/add.ts` (and get, gets, update, updateRelations, remove, count)
- [x] Create `src/app/actions/wareGroup/add.ts` (and get, gets, update, updateRelations, remove, count)
- [x] Create `src/app/actions/wareModel/add.ts` (and get, gets, update, updateRelations, remove, count)

### 5C: Product & Inventory
- [x] Create `src/app/actions/manufacturer/add.ts` (and get, gets, update, remove, count — no updateRelations in backend)
- [x] Create `src/app/actions/ware/add.ts` (and get, gets, update, updateRelations, remove, count)
- [x] Create `src/app/actions/stuff/add.ts` (and get, gets, update, updateRelations, remove, count)
- [x] Create `src/app/actions/store/add.ts` (and get, gets, update, updateRelations, remove, count)
- [x] Create `src/app/actions/inventory/add.ts` (and get, gets, update, updateRelations, remove, count — + custom: adjust, transfer)
- [x] Create `src/app/actions/stockMovement/get.ts` and `gets.ts` (read-only)

### 5D: Consumption
- [x] Create `src/app/actions/consumptionRecord/add.ts` (and get, gets, count)

## Phase 6: Server Actions — Procurement & Purchasing Domain

### 6A: PurchasingRequest
- [x] Create `src/app/actions/purchasingRequest/add.ts`
- [x] Create `src/app/actions/purchasingRequest/get.ts`
- [x] Create `src/app/actions/purchasingRequest/gets.ts`
- [x] Create `src/app/actions/purchasingRequest/update.ts`
- [x] Create `src/app/actions/purchasingRequest/updateRelations.ts`
- [x] Create `src/app/actions/purchasingRequest/remove.ts`
- [x] Create `src/app/actions/purchasingRequest/count.ts`
- [x] Create `src/app/actions/purchasingRequest/submit.ts` — submit PR for approval
- [x] Create `src/app/actions/purchasingRequest/assignStore.ts` — link store to PR
- [x] Create `src/app/actions/purchasingRequest/checkStoreAvailability.ts`
- [x] Create `src/app/actions/purchasingRequest/getHistory.ts`
- [x] Create `src/app/actions/purchasingRequest/warehouseCheck.ts`

### 6B: StepApproval
- [x] Create `src/app/actions/stepApproval/add.ts`
- [x] Create `src/app/actions/stepApproval/get.ts`
- [x] Create `src/app/actions/stepApproval/gets.ts`
- [x] Create `src/app/actions/stepApproval/submitDecision.ts` — approve/reject step

### 6C: Tender & TenderOffer
- [x] Create `src/app/actions/tender/add.ts` (and get, gets, update, updateRelations, remove, count, close, award)
- [x] Create `src/app/actions/tenderOffer/submit.ts` (and get, gets)

### 6D: PurchaseOrderItem
- [x] Create `src/app/actions/purchaseOrderItem/add.ts` (and get, gets, update, updateRelations, remove, count)

### 6E: GoodsReceipt
- [x] Create `src/app/actions/goodsReceipt/add.ts` (and get, gets, update)

### 6F: PaymentOrder
- [x] Create `src/app/actions/paymentOrder/add.ts` (and get, gets, update, markPaid)

## Phase 7: Server Actions — Budget & Finance Domain

### 7A: FiscalYear
- [x] Create `src/app/actions/fiscalYear/add.ts` (and get, gets, update, close)

### 7B: BudgetLine
- [x] Create `src/app/actions/budgetLine/add.ts` (and get, gets, update, count, getBudgetReport, getYearEndReport)

### 7C: BudgetAllocation
- [x] Create `src/app/actions/budgetAllocation/add.ts` (and get, gets)

### 7D: BudgetEncumbrance
- [x] Create `src/app/actions/budgetEncumbrance/add.ts` (and get, gets, release, convertToSpend)

## Phase 8: Admin Pages — Organizational Management

### 8A: Organization Management
- [x] Create `src/app/admin/organizations/page.tsx` — list organizations with data table
- [x] Create `src/app/admin/organizations/orgs-client.tsx` — client component with search, table, pagination
- [x] Create `src/app/admin/organizations/add/page.tsx` — add organization form
- [x] Create `src/app/admin/organizations/[id]/page.tsx` — edit/view organization with delete
- [x] Create `src/app/admin/organizations/loading.tsx` — skeleton loading state
- [x] Sidebar link already exists in AdminSidebar

### 8B: User Management (Employee merged into User)
- [x] Create `src/app/admin/users/page.tsx` — list users with table, search, filters
- [x] Create `src/app/admin/users/add/page.tsx` — add user form with roles, features
- [x] Create `src/app/admin/users/[id]/page.tsx` — edit/view user (including role assignment, features, allowWare*Ids)
- [x] Sidebar link for Users already exists

### 8C: Unit Management (Tree Structure — Department eliminated)
- [x] Create `src/app/admin/units/page.tsx` — tree view of all units in organization
- [x] Create `src/components/unit/unit-tree.tsx` — recursive tree component
- [x] Create `src/app/admin/units/add/page.tsx` — add unit form (type, attributes, parent selection)
- [x] Create `src/app/admin/units/[id]/page.tsx` — edit/view unit (type, attributes, head)
- [x] Add sidebar link for Units (already existed)
- [x] Create `src/app/admin/units/[id]/relations/page.tsx` — unit relations management

### 8D: Tag Management
- [x] Create `src/app/admin/tags/page.tsx` — tag list with color/icon display
- [x] Create tag add/edit modal (inline dialog)
- [x] Add sidebar link for Tags (already existed)

### 8E: Process Builder
- [x] Create `src/app/admin/processes/page.tsx` — list all processes
- [x] Create `src/app/admin/processes/add/page.tsx` — create process with steps
- [x] Create `src/components/process/process-builder.tsx` — step builder with reordering
- [x] Create `src/components/process/process-step-card.tsx` — step configuration card (assigneeGroups embedded)
- [x] Create `src/components/process/assignee-group-editor.tsx` — OR/AND group editor (inline in step card)
- [x] Create `src/app/admin/processes/[id]/page.tsx` — view/edit process, activate/duplicate
- [x] Add sidebar link for Processes (already existed)
- [x] Create `src/app/admin/processes/[id]/relations/page.tsx` — process relations

### 8F: Geographic Reference (State/City) — Prerequisite for Organization, User, Unit forms
- [x] Create `src/app/admin/states/page.tsx` — state list with add/edit inline dialog
- [x] Create `src/app/admin/states/states-client.tsx` — DataTable, dialog, cards, delete confirm
- [x] Create `src/app/admin/states/loading.tsx` — skeleton loader
- [x] Create `src/app/admin/cities/page.tsx` — city list (fetch states for filter dropdown)
- [x] Create `src/app/admin/cities/cities-client.tsx` — DataTable with state filter, FormSearchSelect for state
- [x] Create `src/app/admin/cities/loading.tsx` — skeleton loader
- [x] Add sidebar links for States (`Map` icon) and Cities (`MapPin` icon)

## Phase 9: Admin Pages — Warehouse & Inventory

### 9A: Product Classification Hierarchy
- [x] Create `src/app/admin/ware-types/page.tsx` — WareType list with inline add/edit dialog
- [x] Create `src/app/admin/ware-classes/page.tsx` — WareClass list (filterable by WareType) with inline add/edit dialog
- [x] Create `src/app/admin/ware-groups/page.tsx` — WareGroup list (filterable by WareType) with inline dialog
- [x] Create `src/app/admin/ware-models/page.tsx` — WareModel list (filterable by WareType) with inline dialog
- [x] CRUD add/edit forms for each level with inline dialogs (FormSearchSelect for relations)
- [x] Sidebar links already existed for all hierarchy levels

### 9B: Manufacturer Management
- [x] Create `src/app/admin/manufacturers/page.tsx` — manufacturer list with inline CRUD
- [x] Add/edit manufacturer form with name, enName, country fields
- [x] Added sidebar link for Manufacturers (Factory icon, before Stores)

### 9C: Ware Product Management
- [x] Create `src/app/admin/wares/page.tsx` — product list with hierarchy filters (wareType)
- [x] Add/edit ware form (hierarchy cascade + manufacturer + brand, price, orderedNumber)
- [x] Sidebar link already existed for Products

### 9D: Store Management (Vendors/Sellers)
- [x] Create `src/app/admin/stores/page.tsx` — store list with status badges
- [x] Inline add/edit dialog for stores (name, address, city, score, status)
- [x] Create dedicated `src/app/admin/stores/add/page.tsx` and `[id]/page.tsx` for extended fields
- [x] Sidebar link already existed for Stores

### 9E: Stuff (Store Inventory)
- [x] Create `src/app/admin/stuff/page.tsx` — stuff list with ware/store display
- [x] Inline add/edit stuff form (inventoryNo, price, hasAbsolutePrice, pricePercentage, ware, store)
- [x] Sidebar link already existed for Stuff

### 9F: Inventory Management (Per-Unit Stock)
- [x] Create `src/app/admin/inventory/page.tsx` — unit inventory list with quantity/unit/wareModel
- [x] Inline add/edit inventory form (unit, warehouseUnit, wareModel, ware, quantity, min/max, batchNo, location)
- [x] Add inventory adjust dialog (inline in inventory-client.tsx via adjust action) + RotateCcw button per row
- [x] Added sidebar link for Inventory (Warehouse icon, between Stores and Stuff)

## Phase 10: Admin Pages — Purchasing Request Workflow (Core Feature)

### 10A: Purchasing Request List & Dashboard
- [x] Create `src/app/admin/purchasing-requests/page.tsx` — PR list with status filters, search
- [x] Sidebar link already existed for Purchasing Requests
- [x] Create `src/components/purchasing/request-status-badge.tsx` — colored status badges
- [x] Create `src/components/purchasing/request-card.tsx` — PR summary card
- [x] Create `src/components/purchasing/request-filters.tsx` — filter bar

### 10B: Create New Purchasing Request
- [x] Create `src/app/admin/purchasing-requests/new/page.tsx` — single-page PR creation form
  - Section 1: Basic info (title, description, estimated amount, quantity)
  - Section 2: WareModel selection via FormSearchSelect
  - Section 3: Process selection via FormSearchSelect + unit note
  - Submits via `submit` action (creates + triggers workflow)
- [ ] TODO: Add requestingUnit FormSearchSelect when unit gets action is available
- [ ] TODO: Add attachment upload

### 10C: Purchasing Request Detail & Workflow View
- [x] Create `src/app/admin/purchasing-requests/[id]/page.tsx` — PR detail page
- [x] Create `src/components/purchasing/workflow-visualizer.tsx` — process step progress visualizer
- [x] Create `src/components/purchasing/history-timeline.tsx` — audit history timeline
- [ ] TODO: Create `src/components/purchasing/step-approval-panel.tsx` — current step approval actions
- [ ] TODO: Create `src/components/purchasing/request-info-panel.tsx` — PR metadata sidebar (inline in detail page)

### 10D: Store Assignment Flow (Path A)
- [x] Create `src/components/purchasing/assign-store-dialog.tsx` — search+browse stores, check availability, confirm assignment
- [x] Add "تخصیص فروشگاه" button in PR detail page sidebar
- [ ] TODO: Create `src/components/purchasing/purchase-order-item-list.tsx` — show assigned PO items

### 10E: Tender / Auction Flow (Path B)
- [x] Create `src/components/purchasing/tender-create-dialog.tsx` — create tender for PR
- [x] Create `src/components/purchasing/tender-award-dialog.tsx` — select winning bid
- [x] Add "ایجاد مناقصه" button in PR detail page sidebar
- [ ] TODO: Create `src/components/purchasing/tender-offer-list.tsx` — view bids (inline in tender detail page)

### 10F: Vendor (Store) Tender Response Interface
- [x] Create `src/app/admin/tenders/page.tsx` — list open tenders
- [x] Create `src/app/admin/tenders/[id]/page.tsx` — tender detail with offers view + award button
- [ ] TODO: Create `src/components/purchasing/submit-offer-form.tsx` — price, delivery time, terms form for vendors

## Phase 11: Admin Pages — Goods Receipt & Payment

### 11A: Goods Receipt Interface
- [x] Create `src/app/admin/goods-receipts/page.tsx` — list goods receipts
- [x] Create `src/app/admin/goods-receipts/new/page.tsx` + `goods-receipt-form.tsx` — create goods receipt
- [ ] TODO: Add items array form for goods receipt (PO items + batch tracking)
- [ ] TODO: Add goods receipt link in PR detail page

### 11B: Payment Order Interface
- [x] Create `src/app/admin/payment-orders/page.tsx` — list payment orders
- [x] Add inline mark-paid ConfirmDialog with `markPaid` action
- [ ] TODO: Create payment order view/detail page
- [ ] TODO: Add payment order link in PR detail page

## Phase 12: Admin Pages — Budget & Finance

### 12A: Fiscal Year Management
- [x] Create `src/app/admin/fiscal-years/page.tsx` — list + add/edit inline dialog
- [x] Sidebar link already existed for Fiscal Years

### 12B: Budget Line Management
- [x] Create `src/app/admin/budget-lines/page.tsx` — list budget lines with remaining budget colors
- [x] Create `src/app/admin/budget-lines/[id]/page.tsx` — detail page with KPI cards
- [x] Sidebar link already existed for Budget Lines
- [ ] TODO: Add allocation/encumbrance form components

### 12C: Budget Reports
- [x] Create `src/app/admin/budget-reports/page.tsx` — summary with KPI cards + budget line table
- [x] Sidebar link already existed for Budget Reports

## Phase 13: Admin Pages — Consumption & Inventory Tracking

### 13A: Consumption Interface
- [x] Create `src/app/admin/consumption/page.tsx` — list + inline add dialog with inventory selection
- [x] Sidebar link already existed for Consumption

## Phase 14: Dashboard & Home Page

### 14A: Public Landing Page
- [x] Enhance `src/app/page.tsx` — full landing page with hero, features grid, CTA, AuthKit ambient bg

### 14B: Admin Dashboard
- [x] Enhance `src/app/admin/page.tsx` — 6 KPI cards with real data fetching, quick actions, system status

## Phase 15: Polish, Testing & Deployment

### 15A: Error Handling & Loading States
- [ ] Add global error boundary `src/app/error.tsx`
- [ ] Add admin error boundary `src/app/admin/error.tsx`
- [x] Loading skeletons for all list pages (loading.tsx created for each)
- [x] Loading spinners for all async form submissions
- [x] Empty states across all DataTable pages
- [ ] TODO: Add global error boundary pages

### 15B: Responsive Design & RTL Polish
- [ ] TODO: Run `pnpm lint` and fix any TypeScript errors
- [ ] TODO: Run `pnpm build` to verify production build

### 15C: Performance & Security
- [x] All server actions have proper error handling (try/catch)
- [x] Loading states prevent form double-submission

### 15D: Final Build & Deployment
- [ ] TODO: Run `pnpm build --no-lint` to check for build errors
- [ ] TODO: Docker configuration updates if needed

## Known Issues & Technical Debt

- [ ] Backend type declarations (`declarations/`) need to be regenerated after model changes
- [ ] Some base-ui components may need custom RTL styling for Persian
- [ ] Server action error responses need consistent format
- [ ] Verify all Lucide icons render correctly in RTL

**How to proceed**: Open `CONTINUE.md`, tell the AI agent: "Continue with next unchecked step from TODO.md". After each step the agent must wait for you to review the changes before proceeding.

## Phase 16: Role-Based Panel Architecture (CRITICAL)

**Overview:** Currently only an `/admin` panel exists. The system must route users to role-appropriate panels based on their active role and features. This phase creates 4 new route groups (`/unit-head`, `/requests`, `/finance`, `/vendor`) plus core infrastructure for role-based routing, panel switching, and feature-gated UI.

**Role → Panel mapping:**
| Role | Panel Route | Purpose |
|------|-------------|---------|
| Manager, Admin, OrgHead | `/admin` | Full system management (existing) |
| UnitHead | `/unit-head` | Approve/reject purchasing requests for their unit |
| Employee, Ordinary | `/requests` | Create and track purchasing requests |
| Finance (users with `canManageBudget`) | `/finance` | Budget lines, payment orders, reports |
| Vendor/Store (users with `canRespondToTender`) | `/vendor` | View open tenders, submit offers |

### 16A: Core Infrastructure — Roles, Routing, Panels

- [ ] Create `src/lib/roles.ts` — Role-to-route mapping, role/feature-based panel resolution:
  - `PanelDef` interface: `{ id, path, label, icon, description }`
  - `getPanelForRole(roleName, features): string | null`
  - `getAccessiblePanels(user): PanelDef[]`
  - `getDefaultPanel(user): string`
  - Map: UnitHead → `/unit-head`, Employee/Ordinary → `/requests`, canManageBudget → `/finance`, canRespondToTender → `/vendor`
  - Export panel definitions as a config array with role/feature requirements

- [ ] Create `src/components/layout/role-router.tsx` — Client component that reads `activeRoleId` from cookie/store, maps to panel via `getDefaultPanel()`, and redirects. Used after login and role switch.

- [ ] Create `src/components/layout/panel-selector.tsx` — DropdownButton in header showing all accessible panels. Click switches `activeRoleId` cookie + redirects to target panel. Replaces hardcoded "پنل مدیریت" menu item.

- [ ] Create `src/components/feature-guard.tsx` — Wrapper that conditionally renders children based on user features:
  ```tsx
  <FeatureGuard feature="canApprovePurchaseRequest" fallback={<AccessDenied />}>
    <ApproveButton />
  </FeatureGuard>
  ```

- [ ] Update `src/stores/authStore.ts` — Add:
  - `accessiblePanels: PanelDef[]` (derived from user roles/features)
  - `activePanel: string` (current panel path like `/admin`)
  - `isFeatureEnabled(feature: string): boolean`
  - `getActiveRoleName(): string | undefined`
  - `getActiveScope(): { type, id } | undefined`

- [ ] Update `src/middleware.ts` — Protect new route groups by reading `activeRoleId` cookie:
  - `/admin` → requires Manager/Admin/OrgHead role
  - `/unit-head` → requires UnitHead role
  - `/requests` → requires Employee/Ordinary role
  - `/finance` → requires `canManageBudget` feature
  - `/vendor` → requires `canRespondToTender` feature
  - If unauthorized, redirect to `/login` or default accessible panel
  - Fetch user data server-side via `getMe` if needed for feature checks

- [ ] Update `src/components/auth/login-form.tsx` — After login, redirect to `getDefaultPanel(user)` instead of hardcoded `/admin`.

- [ ] Update `src/components/auth/auth-guard.tsx` — After auth check, validate panel access and redirect to default panel if current route is unauthorized for the active role.

- [ ] Update `src/app/actions/auth/setActiveRole.ts` — Return target panel path so client can redirect after role switch.

### 16B: Panel Layouts & Navigation

- [ ] Create `src/components/layout/panel-layout.tsx` — Shared layout for all non-admin panels:
  - Same midnight-ink canvas + ambient bg as admin (reuse `AmbientBackground`)
  - Simple top header: logo/brand on right, page title center, `PanelSelector` + `UserMenu` on left
  - No sidebar — clean, focused UI for non-admin users
  - Props: `title`, `description?`, `children`, `actions?`
  - RTL, AuthKit design tokens

- [ ] Create `src/app/unit-head/layout.tsx` — Wraps `PanelLayout` with `"پنل واحد"` context, `PanelGuard` for UnitHead role.

- [ ] Create `src/app/requests/layout.tsx` — Wraps `PanelLayout` with `"درخواست‌های خرید"` context, `PanelGuard` for Employee/Ordinary roles.

- [ ] Create `src/app/finance/layout.tsx` — Wraps `PanelLayout` with `"پنل مالی"` context, `PanelGuard` for `canManageBudget` feature.

- [ ] Create `src/app/vendor/layout.tsx` — Wraps `PanelLayout` with `"پنل فروشندگان"` context, `PanelGuard` for `canRespondToTender` feature.

- [ ] Update `src/components/layout/admin-header.tsx` — Add `<PanelSelector />` between breadcrumbs and UserMenu so admin users can switch panels.

- [ ] Update `src/components/layout/user-menu.tsx` — Replace hardcoded "پنل مدیریت" with dynamic list of accessible panels from `useAuthStore`.

### 16C: UnitHead Panel Pages (`/unit-head/`)

- [ ] Create `src/app/unit-head/page.tsx` — Dashboard:
  - KPI cards: pending approvals count, total active PRs, recently decided
  - Quick action link: "درخواست‌های نیازمند تایید"
  - Recent step approvals activity feed

- [ ] Create `src/app/unit-head/requests/page.tsx` — PR list filtered by unit:
  - Fetch via `purchasingRequest.gets({ unitId: "<unit-id>" })` server action
  - DataTable: title, status badge, estimated amount, requester, current step, date
  - Search, pagination, empty state with Persian message

- [ ] Create `src/app/unit-head/requests/[id]/page.tsx` — PR detail with approve/reject:
  - PR info panel: title, description, amounts, wareModel, requester, timeline
  - Workflow visualizer (`WorkflowVisualizer`) with current step highlighted
  - History timeline (`HistoryTimeline`)
  - Step approval panel with: step name, description, assignee groups, comment textarea
  - "تایید" (iris/green) and "رد" (ember/red) buttons
  - Calls `stepApproval.submitDecision()`, shows toast, refreshes
  - Read-only after decision

- [ ] Create `src/components/purchasing/step-approval-panel.tsx` — Reusable approval component:
  - Props: `purchasingRequest`, `processStep`, `unitId`, `onDecision` callback
  - Shows step info, existing approvals from other units in same step group
  - Approve/reject with confirm dialog, loading state during submission

- [ ] Create `src/app/unit-head/loading.tsx` — Skeleton loading
- [ ] Create `src/app/unit-head/requests/loading.tsx` — Skeleton loading

### 16D: Employee/Requester Panel Pages (`/requests/`)

- [ ] Create `src/app/requests/page.tsx` — Dashboard:
  - KPI cards: total PRs, pending, approved, rejected
  - Quick action: "ثبت درخواست خرید جدید"
  - Recent PRs list (last 5)

- [ ] Create `src/app/requests/new/page.tsx` — Create new PR (simplified):
  - Basic info: title, description, estimated amount, quantity
  - WareModel search-select (`FormSearchSelect`)
  - Process selection (only active processes)
  - Requesting unit auto-filled or selectable from user's units
  - Submit via `purchasingRequest.submit()`, redirect on success

- [ ] Create `src/app/requests/my-requests/page.tsx` — My PRs list:
  - Fetch PRs where `requester._id` matches current user
  - DataTable: status, amount, wareModel, current step, date
  - Filter tabs: all / pending / approved / rejected

- [ ] Create `src/app/requests/[id]/page.tsx` — PR detail (read-only):
  - PR info, workflow visualizer, history timeline
  - No edit/approve/reject — requester view only
  - Status badge prominent at top

- [ ] Create `src/app/requests/loading.tsx` — Skeleton loading

### 16E: Finance Panel Pages (`/finance/`)

- [ ] Create `src/app/finance/page.tsx` — Dashboard:
  - KPI cards: total budget (current FY), remaining budget, pending payment orders, PRs awaiting finance step
  - Quick actions: "ردیف‌های بودجه", "دستورات پرداخت", "گزارش بودجه"

- [ ] Create `src/app/finance/budget-lines/page.tsx` — Budget lines list (read-only):
  - Fetch via `budgetLine.gets()` with fiscal year filter
  - DataTable: fiscal year, total amount, remaining (color-coded), status

- [ ] Create `src/app/finance/payment-orders/page.tsx` — Payment orders list:
  - Fetch via `paymentOrder.gets()`
  - DataTable: PR ref, amount, status badge, date

- [ ] Create `src/app/finance/budget-reports/page.tsx` — Budget report summary:
  - KPI summary cards + budget line breakdown table

- [ ] Create `src/app/finance/loading.tsx` — Skeleton loading

### 16F: Vendor Panel Pages (`/vendor/`)

- [ ] Create `src/app/vendor/page.tsx` — Dashboard:
  - KPI cards: open tenders, my offers count, awarded tenders
  - Quick action: "مناقصات باز"

- [ ] Create `src/app/vendor/tenders/page.tsx` — Open tenders list:
  - Fetch via `tender.gets()` filtered by status=open
  - DataTable: title, deadline, PR reference, "ثبت پیشنهاد" button

- [ ] Create `src/app/vendor/tenders/[id]/offer/page.tsx` — Submit offer:
  - Form: price, delivery time, terms, notes, optional attachment
  - Submit via `tenderOffer.submit()`, redirect on success

- [ ] Create `src/app/vendor/my-offers/page.tsx` — My offers list:
  - Fetch via `tenderOffer.gets()` filtered by this store/vendor
  - DataTable: tender, price, status badge, date

- [ ] Create `src/app/vendor/loading.tsx` — Skeleton loading

### 16G: Admin Sidebar & Navigation (Role-Aware)

- [ ] Update `src/components/layout/admin-sidebar.tsx` — Conditional sections based on features:
  - Hide "بودجه" section if user lacks `canManageBudget`
  - Hide "انبار" section if user lacks `canViewWarehouse`
  - Manager/Admin always see all sections
  - Add feature-based tooltips on hidden/collapsed sections

- [ ] Update `src/app/admin/page.tsx` — Add role-aware banner:
  - If user has multiple roles: "شما نقش‌های متعددی دارید. برای دسترسی به پنل‌های دیگر از منوی کاربری استفاده کنید."
  - Quick-switch links to other accessible panels

## Phase 17: Error Handling, Polish & Final Steps

### 17A: Error Boundaries

- [ ] Create `src/app/error.tsx` — Global error boundary with retry button (Persian)
- [ ] Create `src/app/admin/error.tsx` — Admin-specific error boundary
- [ ] Create error boundaries for each new panel (`/unit-head/error.tsx`, `/requests/error.tsx`, `/finance/error.tsx`, `/vendor/error.tsx`)

### 17B: PanelGuard & Access Denied

- [ ] Create `src/components/auth/panel-guard.tsx` — Wraps AuthGuard + validates role/feature access for the panel; redirects to default panel if unauthorized
- [ ] Create `src/components/auth/access-denied.tsx` — Styled Persian access denied page: "شما دسترسی به این بخش را ندارید" with link to default panel

### 17C: Final Build & Verification

- [ ] Run `pnpm lint` and fix all TypeScript errors
- [ ] Run `pnpm build --no-lint` to verify production build
- [ ] Verify all Persian text — no English strings remain in new panels
- [ ] Verify RTL rendering in all new panels
- [ ] Verify role-based routing: login as different role types, confirm correct redirect

## Known Issues & Technical Debt

- [ ] Backend type declarations (`declarations/`) need to be regenerated after model changes
- [ ] Some base-ui components may need custom RTL styling for Persian
- [ ] Server action error responses need consistent format
- [ ] Verify all Lucide icons render correctly in RTL
- [ ] `activeRoleId` cookie is non-httpOnly — middleware reads it client-side; consider server-side session validation for security
- [ ] Some panel pages share form logic with admin equivalents — consider extracting shared form components (e.g., PR creation form reused in `/requests/new` and `/admin/purchasing-requests/new`)

## Quick-Reference: Panel → Route Mapping

| Role / Feature | Route | Layout | Guard |
|---|---|---|---|
| Manager, Admin, OrgHead | `/admin/*` | Sidebar + Header | AuthGuard |
| UnitHead | `/unit-head/*` | PanelLayout (simple header) | PanelGuard(UnitHead) |
| Employee, Ordinary | `/requests/*` | PanelLayout (simple header) | PanelGuard(Employee, Ordinary) |
| canManageBudget | `/finance/*` | PanelLayout (simple header) | PanelGuard(canManageBudget) |
| canRespondToTender | `/vendor/*` | PanelLayout (simple header) | PanelGuard(canRespondToTender) |

**How to proceed**: Open `CONTINUE.md`, tell the AI agent: "Continue with next unchecked step from TODO.md". After each step the agent must wait for you to review the changes before proceeding.
