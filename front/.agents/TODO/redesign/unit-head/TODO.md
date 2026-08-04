# Unit-Head Panel Redesign TODO

## 🔄 Autonomous Agent Workflow (STRICT)
1. **READ** this `TODO.md` to identify the next unchecked domain.
2. **READ** `redesign/unit-head/CONTINUE.md` to get the exact **Dual-Sync Blueprint** (Lists = `/requests` style, Forms/Details = `/admin` style).
3. **EXECUTE** a full structural redesign for the target page and **ALL** its sub-routes (e.g., `/[id]`, `/[id]/details`). Do not just "bump icon sizes".
4. **VERIFY** against the Quality Checklist in `CONTINUE.md`. Ensure NO logic, fields, or buttons were removed.
5. **UPDATE** this file: Check the box `[x]` for the completed domain.
6. **LOOP**: Return to Step 1 for the next unchecked item.

## 📋 Domains to Redesign (Dual-Sync Architecture)

### 1. Dashboard & Core
- [x] `/unit-head` (Main Dashboard: Must use `NavCard`/`StatCard` grid for quick access to requests, inventory, etc., matching `/requests` home)

### 2. Requests & Approvals
- [x] `/unit-head/requests` (List: KPI cards, Filter Bar, Rich List Cards)
- [x] `/unit-head/requests/[id]` (Detail: Admin-style sectioned glass cards, workflow visualizer, "ثبت نهایی" / Submit action, history timeline)

### 3. Inventory & Logistics (Unit Warehouse)
- [x] `/unit-head/inventory` (List: KPI cards, Filter Bar, Rich Cards showing resolved ware names and quantities)
- [x] `/unit-head/inventory/[id]` (Detail: Admin-style sectioned glass cards)
- [x] `/unit-head/consumption` (List: KPI cards, Filter Bar, Rich Cards with directional indicators)
- [x] `/unit-head/consumption/[id]` (Detail: Admin-style sectioned glass cards)
- [x] `/unit-head/stock-movements` (List: KPI cards, Filter Bar, Rich Cards with ورود/خروج indicators)
- [x] `/unit-head/stock-movements/[id]` (Detail: Admin-style sectioned glass cards)

### 4. Finance & Goods Receipt
- [x] `/unit-head/finance` (List/Detail: Budget line approvals, financial actions, Admin-style forms)
- [x] `/unit-head/goods-receipt` (List: KPI cards, Filter Bar, Rich Cards; Detail: Admin-style sectioned glass cards, linked PO items)

---
**⚠️ CRITICAL REMINDER FOR AGENT:** 
If you output a response saying "already compliant, just bumped icon sizes", **YOU HAVE FAILED**. You must actively refactor the layout to enforce the Dual-Sync Blueprint defined in `CONTINUE.md`.
