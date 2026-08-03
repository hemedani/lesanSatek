# Admin Panel Redesign: Master Protocol & Continuation Guide

## 📊 Progress Report
- **✅ COMPLETED & APPROVED**: `/admin/processes` (all sub-routes), `/admin/ware*` (types, classes, groups, models, wares, manufacturers), `/admin/stores`, `/admin/states`, `/admin/cities`, `/admin/fiscal-years`, `/admin/budget-lines`, `/admin/budget-reports` (Filters, Budget Report, Year-End Report).
- **🔄 REMAINING**: 8 core domains (Purchasing Requests, Tenders, Goods Receipts, Payment Orders, Inventory, Stock Movements, Stuff, Consumption).
- **🎯 GOAL**: Complete all remaining pages with **zero deviations** from the established "Authkit / Midnight Glass" design system.

---

## 🚨 ANTI-FAILURE CONSTRAINTS (READ BEFORE EVERY PAGE)
The AI agent has previously failed on these specific points. **You must strictly adhere to these rules:**

1. **CARD CONSISTENCY IS MANDATORY**: 
   - Cards MUST NOT be solid black blocks. 
   - Cards MUST use: `bg-[#2f343e]/80` (Graphite Plate with transparency), `backdrop-blur-md`, `border border-[#3f4959]`, `shadow-[0_0_15px_rgba(102,58,243,0.05)]` (soft blue glow), and `rounded-xl`.
   - Backgrounds of containers MUST be transparent/seamless to let the underlying Midnight Ink (`#05060f`) grid/gradient show through.
2. **NO MISSING ACTION BUTTONS**: Every single list card MUST have visible Edit and Delete buttons. Icons must be ≥ 20–24px. Delete must trigger the elevated animated-stroke modal.
3. **NO FORGOTTEN SUB-ROUTES**: If a page has `/[id]`, `/[id]/details`, `/[id]/relations`, or `/[id]/steps`, you MUST redesign them in the same pass. Do not leave legacy UI on sub-routes.
4. **ZERO RAW IDs**: Never display `_id` or `objectId`. Resolve all foreign keys (e.g., `budget_line_id`, `fiscal_year_id`, `requester_id`) to human-readable Persian names via Server Actions.
5. **ZERO ENGLISH TEXT**: All labels, placeholders, toasts, validation errors, and empty states MUST be in Persian (fa).

---

## 🛠️ UNIVERSAL MASTER PROMPT (Apply to the next unchecked item in TODO.md)

```text
You are redesigning the next pending admin domain from `redesign/admin/TODO.md`. 
Apply this exact protocol to the target page and ALL its sub-routes.

### Design System (Non-Negotiable)
- Persian only, full RTL, logical CSS properties only (`start`/`end`, `ps`/`pe`).
- Colors: Midnight Ink `#05060f` (base canvas), Graphite Plate `#2f343e` (cards), Steel Border `#3f4959`, Electric Iris `#663af3` (primary), Ember `#e15858` (destructive).
- Cards: Transparent/seamless backgrounds (`bg-[#2f343e]/80` + `backdrop-blur`), 1px inset hairlines, soft blue glows, `rounded-xl`. NO solid black blocks.
- Icons: ≥ 20–24 px, clear stroke weight. Every action button MUST have a visible icon.
- Typography: Moonlight/Ice/Glacier hierarchy.

### Layout Requirements
1. **Page Header**: Title (Persian), count badge (e.g., «۱۲ مورد»), primary «افزودن» button with visible icon, back button if in a sub-route.
2. **List View**: Card-based responsive grid/stack. NO dense tables. Each card must show:
   - Primary entity name (prominent).
   - Resolved foreign key names (e.g., "نام سال مالی", "نام درخواست‌کننده").
   - Status badges.
   - **Action Buttons**: Edit (Ghost/Electric Iris) and Delete (Ember) with visible icons ≥ 20px.
3. **Add/Edit Forms**: Graphite Plate cards with transparent backgrounds, soft horizontal dividers between logical sections, searchable elevated dropdowns (FilterSelect pattern) for all foreign keys.
4. **Modals**: Elevated animated blueprint stroke (1.5–2px), clear Header/Body/Footer, 24px+ padding.
5. **Empty States**: On-brand, Persian message, subtle icon, prominent CTA.

### Domain-Specific Notes (Adapt based on current TODO item)
- **Fiscal Years / Budget Lines**: Focus on clear date formatting (Persian calendar), resolved organization/unit names, and hierarchical budget line display.
- **Purchasing Requests / Tenders / Goods Receipts / Payment Orders**: These are complex. Ensure the detail views (`/[id]`) have organized sections (Identity, Items, Approvals, History) using the transparent glass cards. Resolve all user/unit IDs to names.
- **Inventory / Stock Movements / Stuff / Consumption**: Focus on clear numeric data display (quantities, prices) with Persian formatting, resolved ware/manufacturer names, and clear directional indicators for movements (e.g., ورود / خروج).

### Constraints
- Server Actions only; preserve existing backend contracts (Lesan framework).
- Respect `prefers-reduced-motion`.
- Reuse existing `SearchSelect`, `Button`, `Modal`, `Badge`, and `Card` components from the already-approved pages.

### Deliverables for this Pass
1. Redesigned List, Add, Edit, and ALL sub-routes for the target domain.
2. Short note confirming:
   - Which foreign keys were resolved.
   - Confirmation that card transparency and action buttons were applied.
   - Confirmation that all sub-routes were checked and updated.

### Quality Checklist (MUST PASS)
- [ ] Cards use transparent Graphite Plate + backdrop blur + soft glow (NO solid black).
- [ ] Every card has visible Edit/Delete buttons with ≥ 20px icons.
- [ ] All sub-routes (details, relations, etc.) are redesigned.
- [ ] Zero raw IDs displayed.
- [ ] Zero English text.
- [ ] RTL logical properties used throughout.
