# LesanSatek Frontend TODO.md

**Project**: LesanSatek Frontend – Organizational Process Management + Warehouse/Inventory System
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

## Phase 4: Server Actions — Organizational Domain

### 4A: Organization Server Actions
- [x] Create `src/app/actions/organization/add.ts`
- [x] Create `src/app/actions/organization/get.ts`
- [x] Create `src/app/actions/organization/gets.ts`
- [x] Create `src/app/actions/organization/update.ts`
- [x] Create `src/app/actions/organization/updateRelations.ts`
- [x] Create `src/app/actions/organization/remove.ts`
- [x] Create `src/app/actions/organization/count.ts`

### 4B: User Server Actions
- [x] Create `src/app/actions/user/addUser.ts`
- [x] Create `src/app/actions/user/getUser.ts`
- [x] Create `src/app/actions/user/getUsers.ts` (named `getUsers` not `gets` per backend)
- [x] Create `src/app/actions/user/updateUser.ts` (named `updateUser` per backend)
- [x] Create `src/app/actions/user/updateUserRelations.ts` (named `updateUserRelations` per backend)
- [x] Create `src/app/actions/user/removeUser.ts` (named `removeUser` per backend)
- [x] Create `src/app/actions/user/countUsers.ts` (named `countUsers` per backend)

### 4C: Unit Server Actions
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

### 4E: ProcessStep Server Actions
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

## Phase 5: Admin Pages — Organizational Management

### 5A: Organization Management
- [x] Create `src/app/admin/organizations/page.tsx` — list organizations with data table
- [x] Create `src/app/admin/organizations/orgs-client.tsx` — client component with search, table, pagination
- [x] Create `src/app/admin/organizations/add/page.tsx` — add organization form
- [x] Create `src/app/admin/organizations/[id]/page.tsx` — edit/view organization with delete
- [x] Create `src/app/admin/organizations/loading.tsx` — skeleton loading state
- [x] Sidebar link already exists in AdminSidebar

### 5B: User Management
- [ ] Create `src/app/admin/users/page.tsx` — list users with table, search, filters
- [ ] Create `src/app/admin/users/add/page.tsx` — add user form with roles, features
- [ ] Create `src/app/admin/users/[id]/page.tsx` — edit/view user (including role assignment, features)
- [ ] Add sidebar link for Users

### 5C: Unit Management (Tree Structure)
- [ ] Create `src/app/admin/units/page.tsx` — tree view of all units in organization
- [ ] Create `src/components/unit/unit-tree.tsx` — recursive tree component
- [ ] Create `src/app/admin/units/add/page.tsx` — add unit form (with parent selection)
- [ ] Create `src/app/admin/units/[id]/page.tsx` — edit/view unit (type, attributes, head, features)
- [ ] Add sidebar link for Units

### 5D: Tag Management
- [ ] Create `src/app/admin/tags/page.tsx` — tag list with color/icon display
- [ ] Create tag add/edit modal
- [ ] Add sidebar link for Tags

### 5E: Process Builder
- [ ] Create `src/app/admin/processes/page.tsx` — list all processes (filter by status)
- [ ] Create `src/app/admin/processes/add/page.tsx` — create process with steps
- [ ] Create `src/components/process/process-builder.tsx` — step builder with drag-and-drop ordering
- [ ] Create `src/components/process/process-step-card.tsx` — step configuration card
- [ ] Create `src/components/process/assignee-group-editor.tsx` — OR/AND group editor
- [ ] Create `src/app/admin/processes/[id]/page.tsx` — view/edit process, activate/duplicate
- [ ] Add sidebar link for Processes

## Phase 6: Admin Pages — Warehouse & Inventory

### 6A: Product Classification Hierarchy
- [ ] Create `src/app/admin/ware-types/page.tsx` — WareType list
- [ ] Create `src/app/admin/ware-classes/page.tsx` — WareClass list (filterable by WareType)
- [ ] Create `src/app/admin/ware-groups/page.tsx` — WareGroup list (M:N with WareClass)
- [ ] Create `src/app/admin/ware-models/page.tsx` — WareModel list (filter by hierarchy)
- [ ] Create CRUD add/edit forms for each level (wareType → wareClass → wareGroup → wareModel)
- [ ] Add sidebar links for all hierarchy levels

### 4G: Manufacturer & Ware Server Actions (from warehouse domain)
- [ ] Create `src/app/actions/manufacturer/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/wareType/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/wareClass/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/wareGroup/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/wareModel/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/ware/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/stuff/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/store/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/state/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/city/add.ts` (and all CRUD)

### 6B: Ware Product Management
- [ ] Create `src/app/admin/wares/page.tsx` — product list with hierarchy filters
- [ ] Create add/edit ware form (select hierarchy, manufacturer, set price)
- [ ] Add sidebar link for Products

### 6C: Store Management (Vendors)
- [ ] Create `src/app/admin/stores/page.tsx` — store list with status filters
- [ ] Create `src/app/admin/stores/add/page.tsx` — add store form (extended fields)
- [ ] Create `src/app/admin/stores/[id]/page.tsx` — edit store (bank info, certificates, ware types)
- [ ] Add sidebar link for Stores

### 6D: Stuff (Store Inventory)
- [ ] Create `src/app/admin/stuff/page.tsx` — list stuff records (filter by store, ware)
- [ ] Create add/edit stuff form (ware, store, pricing, barcode)
- [ ] Add sidebar link for Stuff

### 6E: Inventory Management
- [ ] Create `src/app/admin/inventory/page.tsx` — unit inventory list
- [ ] Create inventory detail/adjust form
- [ ] Add sidebar link for Inventory

## Phase 7: Purchasing Request Workflow (Core Feature)

### 7A: Purchasing Request Server Actions
- [ ] Create `src/app/actions/purchasingRequest/add.ts`
- [ ] Create `src/app/actions/purchasingRequest/get.ts`
- [ ] Create `src/app/actions/purchasingRequest/gets.ts`
- [ ] Create `src/app/actions/purchasingRequest/update.ts`
- [ ] Create `src/app/actions/purchasingRequest/updateRelations.ts`
- [ ] Create `src/app/actions/purchasingRequest/remove.ts`
- [ ] Create `src/app/actions/purchasingRequest/count.ts`
- [ ] Create `src/app/actions/purchasingRequest/submit.ts` — submit PR for approval
- [ ] Create `src/app/actions/purchasingRequest/assignStore.ts` — link store to PR
- [ ] Create `src/app/actions/purchasingRequest/checkStoreAvailability.ts`
- [ ] Create `src/app/actions/purchasingRequest/removeFromPurchase.ts`
- [ ] Create `src/app/actions/purchasingRequest/getHistory.ts`
- [ ] Create `src/app/actions/purchasingRequest/warehouseCheck.ts`

### 7B: StepApproval Server Actions
- [ ] Create `src/app/actions/stepApproval/add.ts`
- [ ] Create `src/app/actions/stepApproval/get.ts`
- [ ] Create `src/app/actions/stepApproval/gets.ts`
- [ ] Create `src/app/actions/stepApproval/submitDecision.ts` — approve/reject step

### 7C: Tender Server Actions
- [ ] Create `src/app/actions/tender/add.ts`
- [ ] Create `src/app/actions/tender/get.ts`
- [ ] Create `src/app/actions/tender/gets.ts`
- [ ] Create `src/app/actions/tender/update.ts`
- [ ] Create `src/app/actions/tender/updateRelations.ts`
- [ ] Create `src/app/actions/tender/close.ts`
- [ ] Create `src/app/actions/tender/award.ts`
- [ ] Create `src/app/actions/tender/remove.ts`
- [ ] Create `src/app/actions/tender/count.ts`

### 7D: TenderOffer Server Actions
- [ ] Create `src/app/actions/tenderOffer/submit.ts`
- [ ] Create `src/app/actions/tenderOffer/get.ts`
- [ ] Create `src/app/actions/tenderOffer/gets.ts`

### 7E: PurchaseOrderItem Server Actions
- [ ] Create `src/app/actions/purchaseOrderItem/add.ts`
- [ ] Create `src/app/actions/purchaseOrderItem/get.ts`
- [ ] Create `src/app/actions/purchaseOrderItem/gets.ts`
- [ ] Create `src/app/actions/purchaseOrderItem/update.ts`
- [ ] Create `src/app/actions/purchaseOrderItem/updateRelations.ts`
- [ ] Create `src/app/actions/purchaseOrderItem/remove.ts`
- [ ] Create `src/app/actions/purchaseOrderItem/count.ts`

### 7F: Purchasing Request List & Dashboard
- [ ] Create `src/app/admin/purchasing-requests/page.tsx` — PR list with status filters, search
- [ ] Add sidebar link for Purchasing Requests
- [ ] Create `src/components/purchasing/request-status-badge.tsx` — colored status badges
- [ ] Create `src/components/purchasing/request-card.tsx` — PR summary card
- [ ] Create `src/components/purchasing/request-filters.tsx` — filter bar

### 7G: Purchasing Request Detail & Workflow View
- [ ] Create `src/app/admin/purchasing-requests/[id]/page.tsx` — PR detail page
- [ ] Create `src/components/purchasing/workflow-visualizer.tsx` — process step progress visualizer
- [ ] Create `src/components/purchasing/step-approval-panel.tsx` — current step approval actions
- [ ] Create `src/components/purchasing/history-timeline.tsx` — audit history timeline
- [ ] Create `src/components/purchasing/request-info-panel.tsx` — PR metadata sidebar

### 7H: Create New Purchasing Request
- [ ] Create `src/app/admin/purchasing-requests/new/page.tsx` — multi-step PR creation form
  - Step 1: Select process, fill basic info (title, description, estimated amount)
  - Step 2: Select wareModel, set quantity
  - Step 3: Select requesting unit, add attachments
  - Step 4: Review and submit

### 7I: Store Assignment Flow (Path A)
- [ ] Create `src/components/purchasing/store-selector.tsx` — browse stores with availability
- [ ] Create `src/components/purchasing/check-store-availability.tsx` — show store inventory with prices
- [ ] Create `src/components/purchasing/assign-store-dialog.tsx` — confirm store assignment
- [ ] Create `src/components/purchasing/purchase-order-item-list.tsx` — show assigned PO items
- [ ] Create `src/components/purchasing/replace-store-dialog.tsx` — replace existing store assignment

### 7J: Tender / Auction Flow (Path B)
- [ ] Create `src/components/purchasing/tender-list.tsx` — tenders related to PR
- [ ] Create `src/components/purchasing/tender-create-dialog.tsx` — create tender for PR
- [ ] Create `src/components/purchasing/tender-offer-list.tsx` — view bids
- [ ] Create `src/components/purchasing/tender-award-dialog.tsx` — select winning bid
- [ ] Create `src/components/purchasing/tender-timeline.tsx` — tender lifecycle visualizer

### 7K: Vendor (Store) Tender Response Interface
- [ ] Create `src/app/admin/tenders/page.tsx` — list open tenders for vendor users
- [ ] Create `src/app/admin/tenders/[id]/page.tsx` — tender detail + submit offer form
- [ ] Create `src/components/purchasing/submit-offer-form.tsx` — price, delivery time, terms form

## Phase 8: Goods Receipt & Payment

### 8A: Goods Receipt Server Actions
- [ ] Create `src/app/actions/goodsReceipt/add.ts`
- [ ] Create `src/app/actions/goodsReceipt/get.ts`
- [ ] Create `src/app/actions/goodsReceipt/gets.ts`
- [ ] Create `src/app/actions/goodsReceipt/update.ts`

### 8B: Payment Order Server Actions
- [ ] Create `src/app/actions/paymentOrder/add.ts`
- [ ] Create `src/app/actions/paymentOrder/get.ts`
- [ ] Create `src/app/actions/paymentOrder/gets.ts`
- [ ] Create `src/app/actions/paymentOrder/update.ts`
- [ ] Create `src/app/actions/paymentOrder/markPaid.ts`

### 8C: Goods Receipt Interface
- [ ] Create `src/app/admin/goods-receipts/page.tsx` — list goods receipts
- [ ] Create `src/app/admin/goods-receipts/new/page.tsx` — create goods receipt from PO items
- [ ] Create `src/components/purchasing/goods-receipt-form.tsx` — accept/reject items form
- [ ] Add goods receipt link in PR detail page

### 8D: Payment Order Interface
- [ ] Create `src/app/admin/payment-orders/page.tsx` — list payment orders
- [ ] Create payment order view/detail page
- [ ] Create `src/components/purchasing/mark-paid-dialog.tsx` — confirm payment
- [ ] Add payment order link in PR detail page

## Phase 9: Budget & Finance

### 9A: Budget Server Actions
- [ ] Create `src/app/actions/fiscalYear/add.ts` (and all CRUD + close)
- [ ] Create `src/app/actions/budgetLine/add.ts` (and all CRUD)
- [ ] Create `src/app/actions/budgetAllocation/add.ts`
- [ ] Create `src/app/actions/budgetEncumbrance/add.ts` (and release, convertToSpend)

### 9B: Fiscal Year Management
- [ ] Create `src/app/admin/fiscal-years/page.tsx` — list fiscal years
- [ ] Create add/edit fiscal year form
- [ ] Create close fiscal year dialog
- [ ] Add sidebar link for Fiscal Years

### 9C: Budget Line Management
- [ ] Create `src/app/admin/budget-lines/page.tsx` — list budget lines
- [ ] Create `src/app/admin/budget-lines/[id]/page.tsx` — budget line detail with allocation/encumbrance
- [ ] Create `src/components/budget/budget-allocation-form.tsx` — add allocation
- [ ] Create `src/components/budget/budget-encumbrance-view.tsx` — encumbrance tracking
- [ ] Add sidebar link for Budget Lines

### 9D: Budget Reports
- [ ] Create `src/app/admin/budget-reports/page.tsx` — budget vs actual reports
- [ ] Create `src/components/budget/budget-chart.tsx` — spending visualization
- [ ] Create `src/components/budget/budget-summary-cards.tsx` — KPI cards (total allocated, spent, remaining)
- [ ] Add sidebar link for Budget Reports

## Phase 10: Consumption & Inventory

### 10A: Consumption Server Actions
- [ ] Create `src/app/actions/consumptionRecord/add.ts`
- [ ] Create `src/app/actions/consumptionRecord/get.ts`
- [ ] Create `src/app/actions/consumptionRecord/gets.ts`
- [ ] Create `src/app/actions/consumptionRecord/count.ts`

### 10B: Consumption Interface
- [ ] Create `src/app/admin/consumption/page.tsx` — list consumption records
- [ ] Create `src/components/inventory/consumption-form.tsx` — record goods usage
- [ ] Add consumption link in PR detail / inventory pages

## Phase 11: Dashboard & Home Page

### 11A: Public Landing Page
- [ ] Create `src/app/[locale]/page.tsx` — landing page with AuthKit design
  - Hero section with product description (process management system)
  - Features section
  - Login/Register CTA
- [ ] Create `src/app/[locale]/layout.tsx` — public layout with header/footer

### 11B: Admin Dashboard
- [ ] Create `src/app/admin/dashboard/page.tsx` — admin home with stats
  - KPI cards: active PRs, pending approvals, total stores, open tenders
  - Recent PRs list
  - Pending approvals summary
  - Budget overview chart
- [ ] Add redirect from `/admin` to `/admin/dashboard`

### 11C: User Dashboard (PR requester view)
- [ ] Create `src/app/[locale]/dashboard/page.tsx` — per-user dashboard
  - My requests list
  - Pending my approval list
  - Quick submit PR button

## Phase 12: Internationalization (Persian Translations)

### 12A: Complete fa.json
- [ ] Add translations for admin panel navigation labels
- [ ] Add translations for all form labels and validation messages
- [ ] Add translations for purchasing workflow terms
- [ ] Add translations for warehouse/inventory terms
- [ ] Add translations for budget/finance terms
- [ ] Add translations for status labels (all enums from backend)
- [ ] Add translations for error messages and notifications
- [ ] Add translations for dashboard and statistics

## Phase 13: Polish, Testing & Deployment

### 13A: Error Handling & Loading States
- [ ] Add global error boundary `src/app/error.tsx`
- [ ] Add admin error boundary `src/app/admin/error.tsx`
- [ ] Add loading skeletons for all list pages (loading.tsx)
- [ ] Add loading spinners for all async actions
- [ ] Handle empty states across all pages

### 13B: Responsive Design & RTL Polish
- [ ] Audit all pages for mobile responsiveness (320px+)
- [ ] Audit all pages for RTL layout correctness
- [ ] Ensure all Radix/base-ui components receive explicit `dir="rtl"`
- [ ] Test touch-friendly interactions on mobile

### 13C: Performance & Security
- [ ] Image optimization with next/image
- [ ] Code splitting with next/dynamic for heavy components
- [ ] Verify httpOnly cookie settings for JWT
- [ ] Verify all server actions have proper error handling
- [ ] Add loading states to prevent form double-submission

### 13D: Final Build & Deployment
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
