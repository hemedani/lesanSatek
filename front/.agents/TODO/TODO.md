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
- [ ] Create `src/app/admin/ware-types/page.tsx` — WareType list
- [ ] Create `src/app/admin/ware-classes/page.tsx` — WareClass list (filterable by WareType)
- [ ] Create `src/app/admin/ware-groups/page.tsx` — WareGroup list (M:N with WareClass)
- [ ] Create `src/app/admin/ware-models/page.tsx` — WareModel list (filter by hierarchy)
- [ ] Create CRUD add/edit forms for each level (wareType → wareClass → wareGroup → wareModel)
- [ ] Add sidebar links for all hierarchy levels

### 9B: Manufacturer Management
- [ ] Create `src/app/admin/manufacturers/page.tsx` — manufacturer list
- [ ] Create add/edit manufacturer form
- [ ] Add sidebar link for Manufacturers

### 9C: Ware Product Management
- [ ] Create `src/app/admin/wares/page.tsx` — product list with hierarchy filters
- [ ] Create add/edit ware form (select hierarchy, manufacturer, set price)
- [ ] Add sidebar link for Products

### 9D: Store Management (Vendors/Sellers)
- [ ] Create `src/app/admin/stores/page.tsx` — store list with status filters
- [ ] Create `src/app/admin/stores/add/page.tsx` — add store form (extended fields: bank, certificates, ware types)
- [ ] Create `src/app/admin/stores/[id]/page.tsx` — edit store
- [ ] Add sidebar link for Stores

### 9E: Stuff (Store Inventory)
- [ ] Create `src/app/admin/stuff/page.tsx` — list stuff records (filter by store, ware)
- [ ] Create add/edit stuff form (ware, store, pricing modes, barcode)
- [ ] Add sidebar link for Stuff

### 9F: Inventory Management (Per-Unit Stock)
- [ ] Create `src/app/admin/inventory/page.tsx` — unit inventory list with stock movements
- [ ] Create inventory detail/adjust/transfer forms
- [ ] Add sidebar link for Inventory

## Phase 10: Admin Pages — Purchasing Request Workflow (Core Feature)

### 10A: Purchasing Request List & Dashboard
- [ ] Create `src/app/admin/purchasing-requests/page.tsx` — PR list with status filters, search
- [ ] Add sidebar link for Purchasing Requests
- [ ] Create `src/components/purchasing/request-status-badge.tsx` — colored status badges
- [ ] Create `src/components/purchasing/request-card.tsx` — PR summary card
- [ ] Create `src/components/purchasing/request-filters.tsx` — filter bar

### 10B: Create New Purchasing Request
- [ ] Create `src/app/admin/purchasing-requests/new/page.tsx` — multi-step PR creation form
  - Step 1: Select process, fill basic info (title, description, estimated amount, budget line)
  - Step 2: Select wareModel, set quantity
  - Step 3: Select requesting unit, add attachments
  - Step 4: Review and submit

### 10C: Purchasing Request Detail & Workflow View
- [ ] Create `src/app/admin/purchasing-requests/[id]/page.tsx` — PR detail page
- [ ] Create `src/components/purchasing/workflow-visualizer.tsx` — process step progress visualizer
- [ ] Create `src/components/purchasing/step-approval-panel.tsx` — current step approval actions
- [ ] Create `src/components/purchasing/history-timeline.tsx` — audit history timeline
- [ ] Create `src/components/purchasing/request-info-panel.tsx` — PR metadata sidebar

### 10D: Store Assignment Flow (Path A)
- [ ] Create `src/components/purchasing/store-selector.tsx` — browse stores with availability
- [ ] Create `src/components/purchasing/check-store-availability.tsx` — show store inventory with prices
- [ ] Create `src/components/purchasing/assign-store-dialog.tsx` — confirm store assignment
- [ ] Create `src/components/purchasing/purchase-order-item-list.tsx` — show assigned PO items

### 10E: Tender / Auction Flow (Path B)
- [ ] Create `src/components/purchasing/tender-list.tsx` — tenders related to PR
- [ ] Create `src/components/purchasing/tender-create-dialog.tsx` — create tender for PR
- [ ] Create `src/components/purchasing/tender-offer-list.tsx` — view bids
- [ ] Create `src/components/purchasing/tender-award-dialog.tsx` — select winning bid
- [ ] Create `src/components/purchasing/tender-timeline.tsx` — tender lifecycle visualizer

### 10F: Vendor (Store) Tender Response Interface
- [ ] Create `src/app/admin/tenders/page.tsx` — list open tenders for vendor users
- [ ] Create `src/app/admin/tenders/[id]/page.tsx` — tender detail + submit offer form
- [ ] Create `src/components/purchasing/submit-offer-form.tsx` — price, delivery time, terms form

## Phase 11: Admin Pages — Goods Receipt & Payment

### 11A: Goods Receipt Interface
- [ ] Create `src/app/admin/goods-receipts/page.tsx` — list goods receipts
- [ ] Create `src/app/admin/goods-receipts/new/page.tsx` — create goods receipt from PO items
- [ ] Create `src/components/purchasing/goods-receipt-form.tsx` — accept/reject items form
- [ ] Add goods receipt link in PR detail page

### 11B: Payment Order Interface
- [ ] Create `src/app/admin/payment-orders/page.tsx` — list payment orders
- [ ] Create payment order view/detail page
- [ ] Create `src/components/purchasing/mark-paid-dialog.tsx` — confirm payment
- [ ] Add payment order link in PR detail page

## Phase 12: Admin Pages — Budget & Finance

### 12A: Fiscal Year Management
- [ ] Create `src/app/admin/fiscal-years/page.tsx` — list fiscal years
- [ ] Create add/edit fiscal year form
- [ ] Create close fiscal year dialog
- [ ] Add sidebar link for Fiscal Years

### 12B: Budget Line Management
- [ ] Create `src/app/admin/budget-lines/page.tsx` — list budget lines
- [ ] Create `src/app/admin/budget-lines/[id]/page.tsx` — budget line detail with allocation/encumbrance
- [ ] Create `src/components/budget/budget-allocation-form.tsx` — add allocation
- [ ] Create `src/components/budget/budget-encumbrance-view.tsx` — encumbrance tracking
- [ ] Add sidebar link for Budget Lines

### 12C: Budget Reports
- [ ] Create `src/app/admin/budget-reports/page.tsx` — budget vs actual reports
- [ ] Create `src/components/budget/budget-chart.tsx` — spending visualization
- [ ] Create `src/components/budget/budget-summary-cards.tsx` — KPI cards (total allocated, spent, remaining)
- [ ] Add sidebar link for Budget Reports

## Phase 13: Admin Pages — Consumption & Inventory Tracking

### 13A: Consumption Interface
- [ ] Create `src/app/admin/consumption/page.tsx` — list consumption records
- [ ] Create `src/components/inventory/consumption-form.tsx` — record goods usage
- [ ] Add consumption link in PR detail / inventory pages

## Phase 14: Dashboard & Home Page

### 14A: Public Landing Page
- [ ] Create `src/app/page.tsx` — landing page with AuthKit design
  - Hero section with product description (process management system)
  - Features section
  - Login/Register CTA

### 14B: Admin Dashboard
- [ ] Enhance `src/app/admin/page.tsx` — admin home with stats
  - KPI cards: active PRs, pending approvals, total stores, open tenders
  - Recent PRs list
  - Pending approvals summary
  - Budget overview chart

## Phase 15: Polish, Testing & Deployment

### 15A: Error Handling & Loading States
- [ ] Add global error boundary `src/app/error.tsx`
- [ ] Add admin error boundary `src/app/admin/error.tsx`
- [ ] Add loading skeletons for all list pages (loading.tsx)
- [ ] Add loading spinners for all async actions
- [ ] Handle empty states across all pages

### 15B: Responsive Design & RTL Polish
- [ ] Audit all pages for mobile responsiveness (320px+)
- [ ] Audit all pages for RTL layout correctness
- [ ] Ensure all base-ui components receive explicit `dir="rtl"`
- [ ] Test touch-friendly interactions on mobile

### 15C: Performance & Security
- [ ] Image optimization with next/image
- [ ] Code splitting with next/dynamic for heavy components
- [ ] Verify httpOnly cookie settings for JWT
- [ ] Verify all server actions have proper error handling
- [ ] Add loading states to prevent form double-submission

### 15D: Final Build & Deployment
- [ ] TypeScript strict mode check (`pnpm lint`)
- [ ] Production build test (`pnpm build`)
- [ ] Docker configuration (update Dockerfile for frontend)
- [ ] Update README.md
- [ ] Verify all environment variables
- [ ] Production deployment preparation

## Known Issues & Technical Debt

- [ ] Backend type declarations (`declarations/`) need to be regenerated after model changes
- [ ] Some base-ui components may need custom RTL styling for Persian
- [ ] Server action error responses need consistent format
- [ ] Verify all Lucide icons render correctly in RTL

**How to proceed**: Open `CONTINUE.md`, tell the AI agent: "Continue with next unchecked step from TODO.md". After each step the agent must wait for you to review the changes before proceeding.
