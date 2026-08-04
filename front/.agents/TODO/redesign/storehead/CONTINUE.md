# StoreHead Panel Redesign: Master Protocol & Continuation Guide

## 📊 Progress Report
- **✅ REFERENCE STANDARD 1 (Lists)**: The `/requests` and `/unit-head` panels are the gold standards for list views. They feature: 1) KPI/Nav Cards at the top, 2) A dedicated Filter Bar (Search, FilterSelect, Reset), 3) A responsive grid of Rich List Cards with a distinct top section (icon, title, badges) and a bottom metadata section (border-t, specific icons).
- **✅ REFERENCE STANDARD 2 (Forms/Details)**: The `/admin` panel is the gold standard for forms and details. It features: Transparent glass cards, logical sections separated by soft horizontal dividers, elevated searchable dropdowns (FilterSelect), and animated blueprint-stroke modals.
- **🎯 GOAL**: Rebuild the StoreHead panel to strictly follow this **Dual-Sync Architecture**, while preserving 100% of existing business logic (e.g., pending delivery alerts, payment order displays, goods receipt actions).

---

## 🚨 ANTI-FAILURE CONSTRAINTS (READ BEFORE EVERY PAGE)
1. **🛑 NO LAZY "ICON BUMPING"**: You must actively refactor the layout. Lists MUST have the 3-part structure. Forms MUST have sectioned glass cards.
2. **🛑 DO NOT REMOVE LOGIC**: Every existing form field, button, Server Action call, and data fetch MUST remain intact. If a page has a "Pending Delivery Alert", "Payment Orders" section, or "Goods Receipt" action, keep it and style it beautifully.
3. **NO SOLID BLACK CARDS**: Cards MUST use `glass-card` and `glass-card-hover-active` classes (or equivalent: `bg-[#2f343e]/80`, `backdrop-blur-md`, `border border-[#3f4959]`, `rounded-2xl`).
4. **ZERO RAW IDs**: Resolve all foreign keys (`ware_id`, `store_id`, `user_id`, `pr_id`, `tender_id`) to human-readable Persian names via Server Actions.
5. **ZERO ENGLISH TEXT**: All UI text must be Persian (fa).

---

## 🛠️ UNIVERSAL MASTER PROMPT (Apply to the next unchecked item in TODO.md)

```text
You are redesigning the next pending StoreHead domain from `redesign/storehead/TODO.md`. 
You MUST apply the **Dual-Sync Architecture**: Lists sync with `/requests`, Forms/Details sync with `/admin`.

### 🛑 CRITICAL RULE: PRESERVE ALL LOGIC
- Do NOT remove any existing fields, buttons, Server Actions, or data-fetching logic.
- Your job is to elevate the visual presentation and enforce the correct layout structure.

### PART 1: The 3-Part Layout Architecture (Mandatory for ALL List pages)
1. **KPI / Nav Cards Section**: 
   - A grid of `StatCard` or `NavCard` components at the top of the page.
   - Display key counts (e.g., total PRs, pending deliveries, active tenders) and act as quick filters or navigation links.
   - Use specific icon backgrounds (e.g., `bg-electric-iris/10`, `text-electric-iris`, `bg-amber-400/10`, `text-amber-400`).

2. **Dedicated Filter Bar**:
   - Must include: A `SearchField` (flex-1), `FilterSelect` dropdowns for primary filters (e.g., status, store, ware type), and a "پاک کردن فیلترها" (Reset) button that only appears when filters are active.
   - Use `lucide-react` icons (≥ 20px, e.g., `ListFilter`, `RotateCcw`).

3. **Rich List Cards Grid**:
   - Replace tables or basic cards with a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
   - Each card MUST be a `Link` (if clickable) and use `glass-card glass-card-hover-active` classes with `rounded-2xl` and `p-5`.
   - **Card Top Section**: 
     - Left: An icon in a colored container (e.g., `size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20`).
     - Middle: Primary title (font-semibold, text-moonlight), followed by a flex-wrap row of small badges (e.g., tender deadline, PR step).
     - Right: Status badge.
   - **Card Bottom Section**:
     - A `border-t border-steel-border/15 pt-3 mt-auto` container.
     - Display resolved metadata in a flex-wrap row with specific icons and `text-fog`/`text-pebble` colors. 
     - Examples: `<User className="size-4"/> Requester`, `<Building2 className="size-4"/> Store Name`, `<Coins className="size-4"/> Amount`, `<CalendarDays className="size-4"/> Date.

### PART 2: Admin-Sync Architecture (Mandatory for ALL Add/Edit/Detail pages)
1. **Page Header**: Title (Persian), back button with visible icon, primary action button (if applicable).
2. **Sectioned Glass Cards**: Form fields or detail data MUST be grouped into logical sections (e.g., "اطلاعات درخواست", "سفارش‌های پرداخت", "تاریخچه") inside transparent glass cards.
3. **Soft Dividers**: Use subtle horizontal borders (`border-b border-steel-border/20 pb-4 mb-4`) to separate sections.
4. **Elevated Dropdowns**: All foreign key selects MUST use the `FilterSelect` pattern (searchable, elevated panel, resolved Persian names).
5. **Animated Modals**: Any confirmations or secondary actions must use the elevated modal with the animated blueprint stroke (1.5–2px), clear Header/Body/Footer, and 24px+ padding.

### Domain-Specific Adaptations
- **Dashboard**: Must prominently feature the "Pending Delivery Alert" (هشدار تحویل_pending) as a distinct, high-visibility glass card if data exists, alongside standard KPI nav cards.
- **Purchasing Requests**: The detail page must feature the workflow visualizer, history timeline, and a dedicated, beautifully styled "Payment Orders" (سفارش‌های پرداخت) section showing status badges and paid amounts.
- **Tenders & My Offers**: Ensure tender deadlines and associated PR links are clearly visible. Offer cards should clearly show bid amounts and statuses.
- **Stuff**: The bottom metadata row of the list cards must clearly show resolved ware names, quantities (with Persian numerals), and store location.

### Constraints
- Server Actions only; preserve existing backend contracts (Lesan framework).
- Respect `prefers-reduced-motion`.
- Reuse existing `SearchField`, `FilterSelect`, `StatCard`, `NavCard`, `Pagination`, `EmptyState`, and `glass-card` components.

### Deliverables for this Pass
1. Fully refactored List page with the 3-Part Layout Architecture (if applicable).
2. Fully refactored Detail/Edit page with Admin-Sync sectioned glass cards (if applicable).
3. A short note confirming:
   - The 3-part layout (for lists) OR sectioned glass cards (for forms) was implemented.
   - NO logic, fields, or buttons were removed (specifically mentioning alerts, payment sections, or goods receipt actions if present).
   - All foreign keys are resolved to Persian names.
   - All sub-routes were updated.

### Quality Checklist (MUST PASS)
- [ ] Lists strictly follow: KPI Cards → Filter Bar → Rich Grid Cards (with top/bottom sections).
- [ ] Forms/Details strictly follow: Sectioned transparent glass cards with soft dividers.
- [ ] ZERO logic, fields, or buttons were removed.
- [ ] Cards use transparent glass styling (NO solid black blocks).
- [ ] All sub-routes are redesigned to match.
- [ ] Zero raw IDs displayed.
- [ ] Zero English text.
