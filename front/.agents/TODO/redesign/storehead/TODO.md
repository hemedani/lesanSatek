# StoreHead Panel Redesign TODO

## 🔄 Autonomous Agent Workflow (STRICT)
1. **READ** this `TODO.md` to identify the next unchecked domain.
2. **READ** `redesign/storehead/CONTINUE.md` to get the exact **Dual-Sync Blueprint** (Lists = `/requests` style, Forms/Details = `/admin` style).
3. **EXECUTE** a full structural redesign for the target page and **ALL** its sub-routes (e.g., `/[id]`, `/[id]/details`). Do not just "bump icon sizes".
4. **VERIFY** against the Quality Checklist in `CONTINUE.md`. Ensure NO logic, fields, or buttons were removed.
5. **UPDATE** this file: Check the box `[x]` for the completed domain.
6. **LOOP**: Return to Step 1 for the next unchecked item.

## 📋 Domains to Redesign (Dual-Sync Architecture)

### 1. Dashboard & Core
- [x] `/storehead` (Main Dashboard: Must use `NavCard`/`StatCard` grid, including the "Pending Delivery Alert" and quick access to PRs/Tenders)
- [x] `/storehead/store` (Store settings/profile: Admin-style sectioned glass cards)

### 2. Purchasing Requests & Deliveries
- [x] `/storehead/purchasing-requests` (List: KPI cards, Filter Bar, Rich List Cards showing PR status, requester, and delivery state)
- [x] `/storehead/purchasing-requests/[id]` (Detail: Admin-style sectioned glass cards, workflow visualizer, payment orders section, goods receipt actions)

### 3. Tenders & Offers
- [x] `/storehead/tenders` (List: KPI cards, Filter Bar, Rich List Cards showing tender status, deadline, and associated PR)
- [x] `/storehead/tenders/[id]` (Detail: Admin-style sectioned glass cards, linked offers list)
- [x] `/storehead/my-offers` (List: KPI cards, Filter Bar, Rich List Cards; Detail: Admin-style sectioned glass cards)

### 4. Inventory & Stuff Management
- [x] `/storehead/stuff` (List: KPI cards, Filter Bar, Rich List Cards showing ware details, quantities, and store location)
- [x] `/storehead/stuff/[id]` (Detail: Admin-style sectioned glass cards)

---
**⚠️ CRITICAL REMINDER FOR AGENT:** 
If you output a response saying "already compliant, just bumped icon sizes", **YOU HAVE FAILED**. You must actively refactor the layout to enforce the Dual-Sync Blueprint defined in `CONTINUE.md`.
