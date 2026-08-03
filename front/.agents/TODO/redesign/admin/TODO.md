# Admin Panel Redesign TODO

## 🔄 Autonomous Agent Workflow (STRICT)
1. **READ** this `TODO.md` file to identify the next unchecked item.
2. **READ** the `redesign/admin/CONTINUE.md` file to get the exact Master Prompt, design rules, and anti-failure constraints.
3. **EXECUTE** the redesign for the specific page and **ALL** its sub-routes (e.g., `/[id]`, `/[id]/details`, `/[id]/relations`).
4. **VERIFY** against the Quality Checklist in `CONTINUE.md` (especially card consistency, action buttons, and zero raw IDs).
5. **UPDATE** this file: Check the box `[x]` for the completed page.
6. **LOOP**: Return to Step 1 for the next unchecked item until all boxes are checked.

## 📋 Remaining Pages to Redesign

### 1. Financial & Budgeting
- [x] `/admin/fiscal-years` (List, Add, Edit, Detail)
- [x] `/admin/budget-lines` (List, Add, Edit, Relations)
- [x] `/admin/budget-reports` (Filters, Budget Report, Year-End Report)

### 2. Procurement & Requests
- [x] `/admin/purchasing-requests` (List, Add, Edit, Detail, Relations/Steps if applicable)
- [x] `/admin/tenders` (List, Add, Edit, Detail, Bids sub-route)
- [x] `/admin/goods-receipts` (List, Add, Edit, Detail, Items sub-route)
- [x] `/admin/payment-orders` (List, Add, Edit, Detail, Approvals sub-route)

### 3. Inventory & Operations
- [x] `/admin/inventory` (List, Detail, Stock levels)
- [x] `/admin/stock-movements` (List, Add, Detail, Filters)
- [x] `/admin/stuff` (List, Add, Edit, Detail)
- [x] `/admin/consumption` (List, Add, Detail, Reports)

---
**⚠️ CRITICAL REMINDER FOR AGENT:** 
Do NOT skip sub-routes. Do NOT create ugly, solid-black cards. Do NOT forget action buttons on cards. Always refer to `CONTINUE.md` before writing any code.
