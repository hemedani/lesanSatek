# OrgHead Dashboard Redesign TODO

## 🔄 Autonomous Agent Workflow (STRICT)
1. **READ** this `TODO.md` to identify the next unchecked domain.
2. **READ** `redesign/orghead/CONTINUE.md` to get the **exact structural blueprint** (KPI Cards + Filter Bar + Rich List Cards) inspired by the `/requests` panel.
3. **EXECUTE** a full structural redesign for the target page and **ALL** its sub-routes. Do not just "bump icon sizes". You must implement the full layout architecture.
4. **VERIFY** against the Quality Checklist in `CONTINUE.md`. Ensure NO logic, fields, or buttons were removed.
5. **UPDATE** this file: Check the box `[x]` for the completed domain.
6. **LOOP**: Return to Step 1 for the next unchecked item.

## 📋 Domains to Redesign (Inspired by `/requests` panel)

### 1. Dashboard & Core
- [x] `/orghead` (Main Dashboard: Must use `NavCard`/`StatCard` grid for quick access and KPIs, matching `/requests` home)
- [x] `/orghead/org-chart` (Interactive SVG tree: style nodes as glass cards with Electric Iris glow on selection)
- [x] `/orghead/settings` (Organization settings: clean, sectioned glass cards)

### 2. Organizational Structure
- [x] `/orghead/units` (List, `add`, `[id]`)
- [x] `/orghead/users` (List, `add`, `[id]` with role/scope management)

### 3. Processes & Workflows
- [x] `/orghead/processes` (List, `add`, `[id]`, `[id]/graph`, `[id]/steps`, `[id]/relations`)
  - *Requirement*: The list must have KPI stat cards (e.g., Active, Draft), a Filter Bar, and rich process cards showing scope chain chips and creator.

### 4. Requests & Operations
- [x] `/orghead/requests` (List and `[id]` detail)
  - *Requirement*: Must perfectly mirror the `/requests` panel architecture: KPI summary cards, `FilterBar` (search, status, process), and rich `RequestListItem` cards with bottom metadata rows (requester, unit, amount, date). Preserve the "ارسال به مالی" action.

### 5. Inventory & Logistics
- [x] `/orghead/inventory` (List)
- [x] `/orghead/consumption` (List)
- [x] `/orghead/stock-movements` (List)
  - *Requirement for all 3*: KPI summary cards, Filter Bar/Sort, and rich cards showing resolved ware names, quantities, and directional indicators (ورود/خروج) with specific icons, exactly like the employee requests panel.

---
**⚠️ CRITICAL REMINDER FOR AGENT:** 
If you output a response saying "already compliant, just bumped icon sizes", **YOU HAVE FAILED**. You must actively refactor the layout to include the KPI cards, Filter Bar, and Rich List Cards as defined in `CONTINUE.md`.
