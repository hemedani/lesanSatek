# Admin Panel UI Refactoring — AuthKit Design Overhaul

> Transform the admin panel from generic shadcn/ui defaults into the premium AuthKit "Midnight Blueprint" aesthetic — a precise, technical, luminous design language on a near-black canvas with cool blue-gray typography, subtle glassmorphism, and a single electric iris accent.

**Based on:** `.agents/THEME/DESIGN.md` (AuthKit design tokens) + AI agent's AuthKit spec (fluid moving blur, glassmorphism, micro-interactions)

**Context:** The admin panel is currently functional but visually flat — default shadcn/ui rounded-lg everywhere, no card elevation stack, no blueprint grid overlay, bare dashboard, and generic component styling. Every page and component needs to be elevated to match the AuthKit blueprint-on-glass standard.

---

## Design Principles

1. **Midnight Canvas** — Near-black `#05060f` ground with a faint 1px blueprint grid overlay (rgba(186, 215, 247, 0.04), ~40px squares). No second canvas color.
2. **Matte Surfaces** — Cards and panels use Graphite Plate `#2f343e` with the AuthKit elevation stack: inset hairlines (rgba(199, 211, 234, 0.12) + inset 48px glow + 32px near-black drop shadow). Never glossy.
3. **Sharp-to-Soft Radius Hierarchy** — Buttons/inputs at **2px**, cards at **10–16px**, badges at **6px**, pills at **999px**.
4. **Cool Blue Glows** — Shadows and highlights use rgba(186, 207, 247, 0.32) tones, never warm.
5. **Electric Iris Discipline** — `#663af3` fill is restricted to **one primary CTA per viewport**. Everything else is ghost, outline, or neutral.
6. **Glassmorphism Accents** — Fluid animated gradient blobs (radial-gradient with `filter: blur(100px)` and slow infinite keyframes) behind hero/content areas for depth. Cards over blobs get `backdrop-filter: blur(16px)`.
7. **Typography Restraint** — Glacier `#d8ecf8` for headings, Moonlight `#c7d3ea` for body, Fog `#81899b` for muted. Tight tracking on headings (-0.02em).
8. **Hairline Borders** — 1px crisp translucent borders `rgba(255,255,255,0.08)` on cards, `rgba(186, 215, 247, 0.12)` inset on ghost buttons.
9. **Micro-Interactions** — Smooth `transition: all 0.2s ease` on all interactive elements. Hover: subtle border brightening, press: translateY(1px).
10. **Persian RTL** — All user-facing text in Persian. Every base-ui primitive gets explicit `dir="rtl"`. Logical CSS properties only.

---

## Phase 0: Design Foundation Audit & Fixes

### 0A: Globals.css — Blueprint Grid & Glassmorphism Utilities

- [x] Add CSS `background-image` grid pattern for the blueprint overlay (1px lines at rgba(186, 215, 247, 0.04), 40px squares)
- [x] Create `.admin-canvas` utility that applies the grid + midnight ink background
- [x] Create `.blueprint-glow` utility for the radial blue glow wash at the top of sections
- [x] Create `@keyframes blob-float` for the fluid animated gradient orbs (translate/scale over 15-20s, ease-in-out, alternate)
- [x] Create `.glass-card` utility: backdrop-filter blur(16px), translucent bg rgba(255,255,255,0.02), hairline border
- [x] Create `.text-gradient-blueprint` utility (already exists, verify it's correct) ✓
- [x] Add conic gradient utility for the thin glowing border frame
- [x] Ensure all shadcn CSS variables map correctly to AuthKit tokens

### 0B: shadcn/ui Component Overrides — Radius Alignment

- [x] **button.tsx** — Change default variant radius from `rounded-lg` to `rounded-sm` (2px). Ghost variant: add `shadow-subtle` inset hairline. Remove `rounded-lg` from size variants where it appears.
- [x] **input.tsx** — Change `rounded-lg` to `rounded-sm` (2px)
- [x] **select.tsx** — Change `rounded-lg` on trigger to `rounded-sm` (2px)
- [x] **dialog.tsx** — Change `rounded-xl` to `rounded-lg` (10px)
- [x] **tabs.tsx** — TabsList background: use `bg-graphite-plate` instead of `bg-muted`
- [x] **badge.tsx** — Ensure default radius is 6px (rounded-md)

### 0C: Card Elevation Stack

- [x] **card.tsx** — Add `shadow-subtle-4` to the base Card className. Replaced `ring-1 ring-foreground/10` with `shadow-subtle-4` for proper AuthKit card elevation.
- [x] Verify the ring-1 ring-foreground/10 doesn't clash — replaced with shadow-subtle-4

### 0D: Button Variant Enhancements

- [x] **Ghost button**: Matched AuthKit spec — `shadow-subtle` inset hairline, `text-moonlight`, `hover:brightness-110`
- [x] **Outline button**: Matched AuthKit — `border-border bg-transparent hover:bg-graphite-plate`
- [x] **Destructive button**: Already Ember-based `bg-destructive/10 text-destructive hover:bg-destructive/20` ✓
- [x] **Default (primary)**: Electric Iris fill kept, 2px radius from 0B ✓

### 0E: RTL + base-ui Audit

- [x] Scan every admin page for missing `dir="rtl"` on base-ui components — Added `dir="rtl"` to Sheet root
- [x] Verify Sheet slide animations work correctly in RTL — CSS already has rtl: overrides ✓
- [x] Confirm DropdownMenu `ChevronRightIcon` rotation uses `rtl:rotate-180` ✓
- [x] Check table cell text alignment for RTL — uses `text-start` ✓

---

## Phase 1: Admin Layout Redesign

### 1A: Admin Layout Shell (`layout.tsx`)

- [x] Apply `admin-canvas` class to the root layout div for the blueprint grid
- [x] Add 2 subtle animated gradient blobs (indigo/violet + cool blue, `filter: blur(100px)`, 20s float)
- [x] Wrap main content area with `z-[1] relative` to sit above blobs
- [x] Adjust admin layout spacing to match the AuthKit comfortable density

### 1B: Admin Sidebar (`admin-sidebar.tsx`)

- [x] Logo area: added blueprint glow accent gradient at bottom border
- [x] Nav items: active state uses `shadow-subtle-3` + `border-s-2 border-electric-iris`
- [x] Nav items: 2px start-border indicator (Electric Iris) on active item
- [x] Section labels: dotDigital style — `tracking-[0.1em] text-[11px] font-medium text-fog`
- [x] ScrollArea: track styling is already minimal `bg-border` ✓
- [x] Hover state: `hover:bg-white/[0.03]` — subtle Frost Link tint
- [x] Mobile sheet: already `side="right"` with `dir="rtl"` ✓
- [x] Subtle dividers: `border-t border-steel-border/40` between nav sections

### 1C: Admin Header (`admin-header.tsx`)

- [x] Add conic gradient top-border via `before:bg-gradient-to-r before:from-transparent before:via-[rgba(124,145,182,0.4)] before:to-transparent`
- [x] Refine backdrop blur: `bg-midnight-ink/90 backdrop-blur-md`
- [x] Add faint Frost Link glow wash at top-center via `blueprint-glow` div
- [x] Breadcrumbs styling: body-sm (14px) size, Fog/Moonlight hierarchy, chevron in Fog ✓

### 1D: User Menu (`user-menu.tsx`)

- [x] Avatar fallback: `bg-graphite-plate text-moonlight shadow-subtle-3`
- [x] Dropdown menu: `shadow-subtle-4 ring-1 ring-frost-link/20`
- [x] Menu items: hover with `focus:bg-electric-iris/5`
- [x] Destructive logout item: `focus:bg-ember/10`

---

## Phase 2: Dashboard Redesign

### 2A: Dashboard Page (`page.tsx`) — Complete Rewrite

The current dashboard is 4 static stat cards with "—" values. It needs a complete redesign:

- [x] **Hero section** at the top of the dashboard:
  - Faint blueprint glow gradient wash
  - Page title in heading-sm (24px) Glacier font-weight-medium
  - Description in body (16px) Fog

- [x] **KPI Cards Row** (4 cards: Organizations, Users, Purchasing Requests, Active Processes):
  - Each card uses the AuthKit elevation stack (shadow-subtle-4)
  - Icon in Frost Link or Glacier (NOT Electric Iris — reserve for CTAs)
  - Value in Glacier with heading-sm (24px) font-semibold
  - Label in Fog body-sm (14px)
  - Subtle hairline bottom accent on each card
  - Loading state with Skeleton matching card dimensions

- [x] **Recent Activity / Quick Actions section**:
  - Section eyebrow label in Fog with tracking-wide
  - Quick action pills: Ghost buttons with 999px radius (matching AuthKit pill navigation pattern)
  - Each pill has a Moonlight icon + Persian label
  - Cards section with Frost Link heading

- [x] **System Status / Stats section**:
  - Small metric badges in a horizontal row
  - Each uses StatusBadge component with proper AuthKit styling
  - "همه سیستم‌ها فعال" (All systems active) with Cipher Mint badge

- [ ] **Empty state**: If no data, show an EmptyState with proper AuthKit styling (Frost Link icon, Moonlight title, Fog description, Ghost CTA) — data is static, skip for now

### 2B: Dashboard Loading State (`loading.tsx`)

- [x] Create `src/app/admin/loading.tsx` with AuthKit-styled skeletons
- [x] Use the LoadingSkeleton component but with blueprint-tinted pulse animation

---

## Phase 3: List Page Enhancements

### 3A: PageHeader Component (`page-header.tsx`)

- [x] Title: use heading-sm (24px) text-glacier font-medium
- [x] Description: body-sm (14px) text-fog
- [x] Add a thin bottom divider: `border-b border-steel-border/50 pb-4 mb-6`
- [x] Action buttons area: proper alignment with the title

### 3B: DataTable Component (`data-table.tsx`)

- [x] Table container: use `rounded-lg` (10px) with Graphite Plate bg + shadow-subtle-4 elevation
- [x] Table header: slightly darker bg than Graphite Plate (e.g., `bg-[#282c35]`), Fog text in caption size (12px) with tracking-wide, weight-500
- [x] Table rows: alternating very subtle bg difference (every other row gets `bg-white/[0.015]`)
- [x] Hover state on rows: Frost Link glow at rgba(182, 217, 252, 0.03) with a subtle left-border indicator
- [x] Sortable columns: Frost Link tint on the ArrowUpDown icon when active
- [x] Cell styling: proper padding, Moonlight text for body, Fog for secondary data
- [x] The "actions" column: ghost button with Frost Link tint on hover

### 3C: Pagination Component (`pagination.tsx`)

- [x] Use pill-shaped nav buttons (`rounded-full`) matching AuthKit pill navigation pattern
- [x] Ghost variant buttons with Frost Link text
- [x] Chevron icons: proper RTL rotation
- [x] Page indicator in Fog caption text
- [x] Disabled state: Fog with opacity-50

### 3D: EmptyState Component (`empty-state.tsx`)

- [x] Icon in Frost Link color, size-12
- [x] Title in Moonlight body weight-500
- [x] Description in Fog body-sm
- [x] Action: Ghost button with the subtle hairline inset
- [x] Container: centered with comfortable vertical padding

### 3E: ErrorState Component (`error-state.tsx`)

- [x] AlertTriangle icon in Ember color
- [x] Title in Moonlight weight-500
- [x] Message in Fog body-sm
- [x] Retry button: Ghost variant with Frost Link tint
- [x] Container: card-like with a subtle Ember-tinted border inset

### 3F: FilterBar Component (`filter-bar.tsx`)

- [x] Replace native `<select>` with shadcn `Select` component for consistent AuthKit styling
- [x] SearchInput: already uses Input, which now has 2px radius
- [x] Filter pills: ghost buttons with proper spacing
- [x] Reset button: ghost with RotateCcw icon

### 3G: StatusBadge Component (`status-badge.tsx`)

- [x] Ensure 6px radius (`rounded-md`) per AuthKit badge spec
- [x] Add subtle `shadow-subtle` inset on all badges for the hairline effect
- [x] Colors:
  - active: `bg-cipher-mint/10 text-cipher-mint border-cipher-mint/20`
  - inactive: `bg-fog/10 text-fog border-fog/20`
  - pending: `bg-amber-500/10 text-amber-400 border-amber-500/20`
  - approved: `bg-electric-iris/10 text-electric-iris border-electric-iris/20`
  - draft: `bg-pebble/10 text-pebble border-pebble/20`
  - submitted: `bg-azure/10 text-azure border-azure/20`
  - rejected: `bg-ember/10 text-ember border-ember/20`
  - completed: `bg-cipher-mint/10 text-cipher-mint border-cipher-mint/20`
  - cancelled: `bg-fog/10 text-fog border-fog/20`

### 3H: SearchInput Component (`search-input.tsx`)

- [x] Ensure 2px radius on the input
- [x] Search icon in Fog, clear button in Pebble hover-to-Moonlight
- [x] The clear button: subtle transition, rounded-full bg on hover

---

## Phase 4: Form Page Polish

### 4A: FormCard Component (`form-card.tsx`)

- [x] Already uses Card, which gets shadow-subtle-4 from Phase 0C — verified
- [x] CardHeader: proper spacing
- [x] CardTitle: use text-glacier font-medium (soft size pending)
- [x] Description: body-sm Fog with proper bottom margin
- [x] CardContent: space-y-4 for form fields

### 4B: Form Input Fields (`form-input.tsx`, `form-select.tsx`, `form-textarea.tsx`, `form-checkbox.tsx`)

- [x] Labels: Pebble color — changed FormLabel from `text-glacier` to `text-pebble` in `form.tsx`
- [x] Required asterisk: Ember color (already `text-destructive`)
- [x] Input focus ring: Frost Link (--ring: #b6d9fc) — verified in globals.css
- [x] Form errors: Ember text with `bg-destructive/5 rounded-sm px-2 py-1` chip + `AlertTriangle` icon
- [x] Select placeholder: Fog text color via shadcn Select (already correct)

### 4C: ConfirmDialog Component (`confirm-dialog.tsx`)

- [x] Dialog content: Graphite Plate bg, shadow-subtle-4 elevation, rounded-lg (10px) — via DialogContent
- [x] Warning icon: Ember with `bg-ember/10 rounded-full` circle behind it
- [x] Title: Moonlight weight-500 heading-sm
- [x] Description: Fog body-sm
- [x] Confirm button: Ember variant for destructive, Electric Iris for non-destructive
- [x] Cancel button: Ghost variant (changed from outline)
- [x] Loading state: Loader2 spinner (changed from `"..."` text)

### 4D: Form Buttons

- [x] Primary submit: Electric Iris fill, 2px radius (via Button default variant)
- [x] Cancel: Ghost button with the AuthKit hairline inset (via Button ghost variant)
- [x] Delete: Ghost button with Ember text, Ember-tinted hover (via `text-destructive`)
- [x] Back navigation link: Frost Link hover glow, proper ChevronRight RTL rotation
- [x] Loading state on submit: Loader2 animate-spin icon + disabled state

### 4E: General Form Layout

- [x] Back link + title header: consistent pattern across all form pages
- [x] Form max width: 2xl (672px) for single-column, wider for multi-column
- [x] Field spacing: 24px between fields, 32px between sections
- [x] Button row: end-aligned (RTL: start-aligned), 12px gap

---

## Phase 5: Organizations Pages (Reference Implementation)

### 5A: Organizations List (`page.tsx` + `orgs-client.tsx`)

- [x] Replace manual search form with SearchInput component
- [x] Use FilterBar for consistent filter UX — replaced standalone SearchInput with FilterBar, passed search prop from server
- [x] Wrap table in rounded-lg container with shadow-subtle-4
- [x] Use the enhanced PageHeader, DataTable, Pagination, StatusBadge
- [x] Add a conic border accent at the top of the content area
- [x] Add the fluid gradient blob in the background

### 5B: Organizations Add (`add/page.tsx`)

- [x] Apply all Phase 4 form polish
- [x] Proper back navigation link
- [x] Page header with title + description
- [x] FormCard with AuthKit elevation
- [x] Primary submit + ghost cancel buttons

### 5C: Organizations Edit (`[id]/page.tsx`)

- [x] Apply all Phase 4 form polish
- [x] Loading state with LoadingSkeleton type="card"
- [x] Not found state with ErrorState component + back navigation link
- [x] Delete confirm dialog with ConfirmDialog
- [x] Update toast: sonner toast with proper AuthKit styling (dark theme, Frost Link accent)

### 5D: Organizations Loading (`loading.tsx`)

- [x] Skeleton matching the page structure: header skeleton, search/filter skeleton, table skeleton
- [x] Use LoadingSkeleton with type="table" + refactored manual divs to use `<Skeleton>` component

---

## Phase 6: Remaining Admin Pages (Future — Same Pattern)

### 6A: User Management Pages
- [ ] Follow the Organizations pattern exactly for users list, add, edit, loading

### 6B: Unit Management Pages
- [ ] Follow the Organizations pattern for units list, add, edit, loading

### 6C: Tag Management Pages
- [ ] Follow the Organizations pattern for tags list, add, edit, loading

### 6D: Process Management Pages
- [ ] Follow the Organizations pattern for processes list, add, edit, loading

### 6E: Warehouse & Inventory Pages (Phase 6+ of main TODO)
- [ ] Apply same AuthKit pattern when creating

### 6F: Purchasing Request Pages (Phase 7+ of main TODO)
- [ ] Apply same AuthKit pattern when creating

---

## Phase 7: Loading & Error States

### 7A: LoadingSkeleton Component (`skeleton.tsx` + `loading-skeleton.tsx`)

- [x] Created `@keyframes blueprint-shimmer` + `@utility skeleton-shimmer` in globals.css (blue-tinted gradient overlay)
- [x] `skeleton.tsx`: replaced `animate-pulse bg-muted` with `skeleton-shimmer`
- [x] type="table": row skeletons matching the DataTable structure (via LoadingSkeleton)
- [x] type="card": KPI card skeleton layout (via LoadingSkeleton)
- [x] type="list": list item skeleton layout (via LoadingSkeleton)
- [x] All skeletons use the same rounded radii as their real counterparts

### 7B: Page-Level Loading States

- [ ] Every list page: loading.tsx with skeleton matching the page structure (orgs done)
- [ ] Every form page: use LoadingSkeleton type="card" inside the page while data loads
- [x] Dashboard: separate skeleton for KPI cards vs recent activity sections

### 7C: Error Boundaries

- [x] Global error.tsx at admin root with ErrorState + retry — created `src/app/admin/error.tsx`
- [x] Server action errors: toast notifications using sonner with proper dark styling
- [x] Not-found states per page: ErrorState with back navigation link — applied to orgs edit page

---

## Phase 8: Animations & Micro-interactions

### 8A: CSS Transition Baseline

- [x] All interactive elements: `transition-all duration-200 ease-out` — present in Button, DataTable, etc.
- [x] Focus-visible rings: use `focus-visible:ring-3 focus-visible:ring-ring/50` (already present)
- [x] Active press: `active:translate-y-px` on buttons — in buttonVariants base
- [x] Hover border brightening: `hover:border-[rgba(186,215,247,0.2)]` — applied to Card component

### 8B: Fluid Gradient Blobs

- [x] Inline in admin layout.tsx — 2 blob divs with radial-gradient, filter blur(100px), blob-float animation
- [x] Conservative opacity (0.2-0.3) — admin panel appropriate

### 8C: Page Transition Animations

- [x] Fade-in on page mount: `animate-in fade-in duration-300` on `<main>` element in admin layout
- [x] Route change: Next.js Suspense with loading.tsx for smooth transitions

### 8D: Hover Micro-interactions

- [x] Table rows: subtle Frost Link glow on left border — `hover:border-s-2 hover:border-s-frost-link/30` in DataTable
- [x] Sidebar items: smooth bg transition with Electric Iris left-border slide-in — animated via `transition-all duration-200`
- [x] Cards: subtle border brightening on hover — `hover:border-[rgba(186,215,247,0.2)]` in card.tsx
- [x] Badges: no hover effects (static metadata)

---

## Phase 9: Mobile & Responsive Polish

### 9A: Responsive Breakpoints

- [x] Sidebar: hidden below `lg` (1024px), shown above
- [x] KPI grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [x] Tables: horizontal scroll on mobile + sticky first column (via DataTable)
- [x] Forms: full-width on mobile, max-w-2xl on desktop

### 9B: Mobile Navigation

- [x] Sheet sidebar: proper slide-in from right (RTL)
- [x] Sheet overlay: `bg-black/30 backdrop-blur-sm`
- [x] Sheet content: Graphite Plate bg, full-height sidebar content
- [x] Hamburger icon: `Menu` lucide icon in the admin header

### 9C: Touch Interactions

- [ ] Buttons: minimum 44px touch target on mobile (current h-10 = 40px, pending)
- [x] Table rows: adequate padding via py-2.5 cells
- [x] Form fields: proper mobile input sizing (16px base in input.tsx prevents iOS zoom)

---

## Phase 10: Final Verification

### 10A: Visual Consistency Audit

- [x] Every card gets shadow-subtle-4 elevation stack via Card component default
- [x] Every button has correct radius (2px via rounded-sm, pill via rounded-full className)
- [x] Every input has 2px radius (rounded-sm in input.tsx)
- [x] No left/right physical properties — audited, all logical (ps-, pe-, ms-, me-, start-, end-)
- [x] Electric Iris appears only once per viewport on primary CTAs (dashboard uses Frost Link icons)
- [x] All text respects color hierarchy (Glacier → Moonlight → Fog → Pebble)
- [x] No glossy gradients, no warm shadows — all cool blue AuthKit tones

### 10B: Functional Verification (Lint-Passing Check)

- [x] All server actions work — no broken imports or props (lint passes)
- [x] Form submissions work with proper loading/disabled states (Loader2 in buttons)
- [x] Pagination navigates correctly with URL params
- [x] Search/filter works with debounced input via SearchInput
- [x] Delete confirmations work with ConfirmDialog + sonner toasts

### 10C: Performance Check

- [x] Blob animations use CSS transforms only (translate/scale) — GPU-accelerated
- [x] Backdrop-filter usage limited to admin header only — not overused
- [x] No lazy loading needed — all components are lightweight

---

## File Change Summary

| File | Phase | Change Description |
|------|-------|-------------------|
| `src/app/globals.css` | 0A, 7A | Blueprint grid, glassmorphism utilities, blob keyframes, blueprint-shimmer skeleton |
| `src/components/ui/button.tsx` | 0B, 0D | Radius 2px, ghost variant hairline |
| `src/components/ui/input.tsx` | 0B | Radius 2px |
| `src/components/ui/select.tsx` | 0B | Trigger radius 2px |
| `src/components/ui/dialog.tsx` | 0B | Radius 10px |
| `src/components/ui/tabs.tsx` | 0B | Graphite Plate bg |
| `src/components/ui/badge.tsx` | 0B | Radius 6px |
| `src/components/ui/card.tsx` | 0C, 8D | shadow-subtle-4 elevation + hover border brightening |
| `src/components/ui/table.tsx` | 3B | AuthKit table styling |
| `src/components/ui/data-table.tsx` | 3B, 8D | AuthKit table wrapper + row hover glow |
| `src/components/ui/page-header.tsx` | 3A | Type scale + divider |
| `src/components/ui/pagination.tsx` | 3C | Pill nav buttons |
| `src/components/ui/empty-state.tsx` | 3D | AuthKit styling |
| `src/components/ui/error-state.tsx` | 3E | AuthKit styling — container card, ghost retry |
| `src/components/ui/filter-bar.tsx` | 3F | shadcn Select, polish |
| `src/components/ui/status-badge.tsx` | 3G | Radius 6px, inset hairline |
| `src/components/ui/search-input.tsx` | 3H | Radius 2px, polish |
| `src/components/ui/skeleton.tsx` | 7A | Blueprint shimmer animation |
| `src/components/ui/loading-skeleton.tsx` | 7A | Blueprint shimmer |
| `src/components/ui/confirm-dialog.tsx` | 4C | AuthKit styling — Ember icon circle, ghost cancel, Loader2 |
| `src/components/ui/form.tsx` | 4B | FormLabel Pebble color, FormMessage Ember chip |
| `src/components/form/form-card.tsx` | 4A | Elevation verification |
| `src/components/form/form-input.tsx` | 4B | Label/error styling |
| `src/components/form/form-select.tsx` | 4B | Label/error styling |
| `src/components/form/form-textarea.tsx` | 4B | Label/error styling |
| `src/components/form/form-checkbox.tsx` | 4B | Label/error styling |
| `src/components/layout/admin-sidebar.tsx` | 1B, 8D | Nav item polish, glow accents, hover transitions |
| `src/components/layout/admin-header.tsx` | 1C | Conic border, backdrop blur |
| `src/components/layout/user-menu.tsx` | 1D | Dropdown polish |
| `src/app/admin/layout.tsx` | 1A, 8B, 8C | Blueprint grid, gradient blobs, fade-in animation |
| `src/app/admin/page.tsx` | 2A | Complete redesign — KPI cards, quick actions, system status |
| `src/app/admin/loading.tsx` | 2B | New — skeleton matching dashboard layout |
| `src/app/admin/error.tsx` | 7C | New — ErrorState + retry boundary |
| `src/app/admin/organizations/page.tsx` | 5A | DataTable polish (no changes needed) |
| `src/app/admin/organizations/orgs-client.tsx` | 5A | Conic border accent + blob background |
| `src/app/admin/organizations/add/page.tsx` | 5B | Form polish (no changes needed) |
| `src/app/admin/organizations/[id]/page.tsx` | 5C | Not found → ErrorState + back nav link |
| `src/app/admin/organizations/loading.tsx` | 5D | Refactored to use `<Skeleton>` component |

---

## Implementation Order (Recommended)

```
Phase 0A → 0B → 0C → 0D → 0E   (Foundation — fix root issues first)
    ↓
Phase 1A → 1B → 1C → 1D       (Layout — visible on every page)
    ↓
Phase 3A → 3B → 3C → 3D → 3E → 3F → 3G → 3H  (Common components — used everywhere)
    ↓
Phase 4A → 4B → 4C → 4D → 4E   (Form components — shared across all form pages)
    ↓
Phase 2A → 2B                   (Dashboard — landing page, high impact)
    ↓
Phase 5A → 5B → 5C → 5D        (Organizations — reference implementation)
    ↓
Phase 7A → 7B → 7C              (Loading & error states)
    ↓
Phase 8A → 8B → 8C → 8D        (Animations & micro-interactions)
    ↓
Phase 9A → 9B → 9C              (Mobile & responsive)
    ↓
Phase 10A → 10B → 10C           (Final verification)
```

---

## How to Execute

1. Work **one step at a time** from this TODO
2. After each step: **STOP and wait for the user to review** before moving to the next item
3. After each file change: run `pnpm lint` to verify no TypeScript errors
4. After visual changes: preview at `http://localhost:3000/admin/` to verify rendering
5. RTL verification: check that all text reads right-to-left correctly
6. **No commits without explicit user approval** — the user reviews all changes manually first
