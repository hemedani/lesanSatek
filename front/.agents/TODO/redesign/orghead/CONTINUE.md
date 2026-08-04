# OrgHead Dashboard Redesign: Master Protocol & Continuation Guide

## 📊 Progress Report
- **✅ REFERENCE STANDARD**: The `/requests` panel (employee view) is the gold standard. It features: 1) KPI/Nav Cards at the top, 2) A dedicated Filter Bar (Search, FilterSelect, Reset), 3) A responsive grid of Rich List Cards with a distinct top section (icon, title, badges) and a bottom metadata section (border-t, specific icons for unit, amount, date).
- **🔄 CURRENT STATE**: The OrgHead panel currently has inconsistent, lazy "glass cards" that lack the structured hierarchy of the `/requests` panel.
- **🎯 GOAL**: Rebuild the OrgHead list pages to exactly match the `/requests` panel's 3-part architecture, while preserving 100% of existing business logic.

---

## 🚨 ANTI-FAILURE CONSTRAINTS (READ BEFORE EVERY PAGE)
1. **🛑 NO LAZY "ICON BUMPING"**: You must actively refactor the layout. If a page is a list, it MUST be restructured into: KPI Cards → Filter Bar → Rich Grid Cards.
2. **🛑 DO NOT REMOVE LOGIC**: Every existing form field, button, Server Action call, and data fetch MUST remain intact. If a page has a "duplicate" button or "send to finance" action, keep it and style it beautifully.
3. **NO SOLID BLACK CARDS**: Cards MUST use `glass-card` and `glass-card-hover-active` classes (or equivalent: `bg-[#2f343e]/80`, `backdrop-blur-md`, `border border-[#3f4959]`, `rounded-2xl`).
4. **ZERO RAW IDs**: Resolve all foreign keys (`unit_id`, `user_id`, `ware_id`) to human-readable Persian names.
5. **ZERO ENGLISH TEXT**: All UI text must be Persian (fa).

---

## 🛠️ UNIVERSAL MASTER PROMPT (Apply to the next unchecked item in TODO.md)

```text
You are redesigning the next pending OrgHead domain from `redesign/orghead/TODO.md`. 
You MUST restructure the list pages to exactly match the high-quality architecture of the `/requests` panel.

### 🛑 CRITICAL RULE: PRESERVE ALL LOGIC
- Do NOT remove any existing fields, buttons, Server Actions, or data-fetching logic.
- Your job is to elevate the visual presentation and enforce the 3-part layout structure.

### The 3-Part Layout Architecture (Mandatory for all List pages)
1. **KPI / Nav Cards Section**: 
   - A grid of `StatCard` or `NavCard` components at the top of the page.
   - These should display key counts (e.g., total, active, pending) and act as quick filters or navigation links.
   - Use specific icon backgrounds (e.g., `bg-electric-iris/10`, `text-electric-iris`).

2. **Dedicated Filter Bar**:
   - Create or use a dedicated Filter Bar component (like `RequestsFilterBar`).
   - Must include: A `SearchField` (flex-1), `FilterSelect` dropdowns for primary filters (e.g., status, unit, process), and a "پاک کردن فیلترها" (Reset) button that only appears when filters are active.
   - Use `lucide-react` icons (≥ 20px, e.g., `ListFilter`, `GitBranch`, `RotateCcw`).

3. **Rich List Cards Grid**:
   - Replace tables or basic cards with a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
   - Each card MUST be a `Link` (if clickable) and use `glass-card glass-card-hover-active` classes with `rounded-2xl` and `p-5`.
   - **Card Top Section**: 
     - Left: An icon in a colored container (e.g., `size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20`).
     - Middle: Primary title (font-semibold, text-moonlight), followed by a flex-wrap row of small badges (e.g., process name, current step, scope).
     - Right: Status badge.
   - **Card Bottom Section**:
     - A `border-t border-steel-border/15 pt-3 mt-auto` container.
     - Display resolved metadata in a flex-wrap row with specific icons and `text-fog`/`text-pebble` colors. 
     - Examples: `<User className="size-4"/> Requester Name`, `<Building2 className="size-4"/> Unit Name`, `<Coins className="size-4"/> Amount`, `<CalendarDays className="size-4"/> Date`.

### Domain-Specific Adaptations
- **Processes**: The KPI cards should show counts by status. The rich card must show the scope chain chips and organization badge. Preserve the table/card toggle if it exists, but make the table equally beautiful.
- **Requests**: Must perfectly mirror the employee `/requests` panel. Ensure the "ارسال به مالی" action is prominent in the detail view.
- **Inventory / Consumption / Stock Movements**: The bottom metadata row of the cards must clearly show resolved ware names, quantities (with Persian numerals), and directional indicators (e.g., `ArrowDown` for ورود in emerald, `ArrowUp` for خروج in ember).

### Constraints
- Server Actions only; preserve existing backend contracts (Lesan framework).
- Respect `prefers-reduced-motion`.
- Reuse existing `SearchField`, `FilterSelect`, `StatCard`, `NavCard`, `Pagination`, and `EmptyState` components.

### Deliverables for this Pass
1. Fully refactored List page with the 3-Part Layout Architecture.
2. Redesigned Add/Edit/Detail sub-routes with transparent, sectioned glass cards.
3. A short note confirming:
   - The 3-part layout (KPI, Filter Bar, Rich Cards) was implemented.
   - NO logic, fields, or buttons were removed.
   - All foreign keys are resolved to Persian names.
   - All sub-routes were updated.

### Quality Checklist (MUST PASS)
- [ ] Layout strictly follows: KPI Cards → Filter Bar → Rich Grid Cards.
- [ ] Rich cards have the distinct top section (icon + title + badges) and bottom section (border-t + metadata with icons).
- [ ] ZERO logic, fields, or buttons were removed.
- [ ] Cards use transparent glass styling (NO solid black blocks).
- [ ] All sub-routes are redesigned to match.
- [ ] Zero raw IDs displayed.
- [ ] Zero English text.
