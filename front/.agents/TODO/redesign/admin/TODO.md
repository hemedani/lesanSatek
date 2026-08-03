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
- [ ] `/admin/fiscal-years` (List, Add, Edit, Detail)
- [ ] `/admin/budget-lines` (List, Add, Edit, Detail)
- [ ] `/admin/budget-reports` (List, Filters, Detail views)

### 2. Procurement & Requests
- [ ] `/admin/purchasing-requests` (List, Add, Edit, Detail, Relations/Steps if applicable)
- [ ] `/admin/tenders` (List, Add, Edit, Detail, Bids sub-route)
- [ ] `/admin/goods-receipts` (List, Add, Edit, Detail, Items sub-route)
- [ ] `/admin/payment-orders` (List, Add, Edit, Detail, Approvals sub-route)

### 3. Inventory & Operations
- [ ] `/admin/inventory` (List, Detail, Stock levels)
- [ ] `/admin/stock-movements` (List, Add, Detail, Filters)
- [ ] `/admin/stuff` (List, Add, Edit, Detail)
- [ ] `/admin/consumption` (List, Add, Detail, Reports)

---
**⚠️ CRITICAL REMINDER FOR AGENT:** 
Do NOT skip sub-routes. Do NOT create ugly, solid-black cards. Do NOT forget action buttons on cards. Always refer to `CONTINUE.md` before writing any code.
