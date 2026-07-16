# Comprehensive Testing Guide — LesanSatek Frontend

## Prerequisites

### 1. Start the Backend (Deno)
```bash
cd /Users/syd/work/sitak/lesanSatek/back
deno task bc-dev
```
The API playground is at `http://localhost:1370/playground`.  
(Frontend `.env.local` expects backend on port 1370.)

### 2. Start the Frontend (Next.js)
```bash
cd /Users/syd/work/sitak/lesanSatek/front
pnpm dev
```
The app is at `http://localhost:3000`.

### 3. Seed the Database

Run the `e2e.json` test suite via the playground at `http://localhost:1370/playground`.  
Paste each entry from `back/http/e2e.json` sequentially, or use the collection runner.

The suite creates **116 records** spanning the full lifecycle. Below is the complete reference.

---

## Table of Contents

1. [Seed Data Map](#1-seed-data-map)
2. [User Accounts — Login, Role & Panel Mapping](#2-user-accounts--login-role--panel-mapping)
3. [Test the Admin Panel](#3-test-the-admin-panel)
4. [Test the PR Flow (Direct Store Purchase)](#4-test-the-pr-flow-direct-store-purchase)
5. [Test the Tender Flow](#5-test-the-tender-flow)
6. [Test the UnitHead Panel](#6-test-the-unithead-panel)
7. [Test the Employee/Requester Panel](#7-test-the-employeerequester-panel)
8. [Test the Finance Panel](#8-test-the-finance-panel)
9. [Test the Vendor Panel](#9-test-the-vendor-panel)
10. [Test Inventory & Stock Management](#10-test-inventory--stock-management)
11. [Test Budget & Reporting](#11-test-budget--reporting)
12. [Test Process Builder & Archiving](#12-test-process-builder--archiving)
13. [Test Extended Features](#13-test-extended-features)
14. [Test Panel Switching & Role Routing](#14-test-panel-switching--role-routing)
15. [Test Edge Cases](#15-test-edge-cases)
16. [Verification Checklist](#16-verification-checklist)
17. [Appendix — Complete Test Data Reference](#17-appendix--complete-test-data-reference)

---

## 1. Seed Data Map

The `e2e.json` suite creates the following entities in order.

### 1a. Bootstrap & Geographic

| Entry | Creates | Captured As |
|-------|---------|-------------|
| `setup-tempuser` | Ghost Admin (Admin System, admin@lesansatek.com) | `{ghostId}`, `{ghostEmail}` |
| `gen-login` | Login session, JWT token | `{token}`, `{userId}`, `{roleId}` |
| `gen-state` | State: تهران (Tehran) | `{stateId}` |
| `gen-city` | City: تهران (Tehran) | `{cityId}` |
| `gen-org` | Organization: سازمان نمونه (Sample Organization) | `{orgId}` |

### 1b. Users Created

| Entry | User | Role | Purpose |
|-------|------|------|---------|
| `gen-prod-head` | علی محمدی (ali@lesansatek.com) | Manager | Production Unit Head |
| `gen-log-head` | محمد رضایی (mohammad@lesansatek.com) | Manager | Logistics Unit Head |
| `gen-it-head` | زهرا احمدی (zahra@lesansatek.com) | Manager | IT Unit Head |
| `gen-hr-head` | نرگس کریمی (narges@lesansatek.com) | Manager | HR Unit Head |
| `gen-legal-head` | فرهاد نوروزی (farhad@lesansatek.com) | Manager | Legal Unit Head |
| `gen-rd-head` | پریسا صادقی (parisa@lesansatek.com) | Manager | R&D Unit Head |
| `gen-unithead-user` | رضا احمدی (reza@lesansatek.com) | UnitHead (scope: Procurement) | Unit Head Panel |
| `gen-warehouse-head` | حسین کاظمی (hossein@lesansatek.com) | UnitHead (scope: Warehouse) | Warehouse Unit Head |
| `gen-finance-head` | فاطمه موسوی (fatemeh@lesansatek.com) | UnitHead (scope: Finance) | Finance Unit Head |
| `gen-finance-user` | مریم حسینی (maryam@lesansatek.com) | Ordinary + canManageBudget | Finance Panel |
| `gen-vendor-user` | سارا کریمی (sara@lesansatek.com) | Ordinary + canRespondToTender | Vendor Panel |

### 1c. Units (15 total)

| Entry | Unit Name (fa) | Type | Parent Unit |
|-------|---------------|------|-------------|
| `gen-unit-procurement` | واحد خرید (Procurement) | General | — |
| `gen-unit-warehouse` | انبار مرکزی (Central Warehouse) | Warehouse | — |
| `gen-unit-finance` | واحد مالی (Finance) | Administration | — |
| `gen-unit-production` | واحد تولید (Production) | Production | — |
| `gen-unit-logistics` | واحد لجستیک (Logistics) | Logistics | — |
| `gen-unit-it` | واحد فناوری اطلاعات (IT) | Expert | — |
| `gen-unit-hr` | واحد منابع انسانی (HR) | Administration | — |
| `gen-unit-legal` | واحد حقوقی (Legal) | General | — |
| `gen-unit-rd` | واحد تحقیق و توسعه (R&D) | Expert | — |
| `gen-unit-hemato-lab` | آزمایشگاه هماتولوژی (Hematology Lab) | Expert | → Procurement |
| `gen-unit-micro-lab` | آزمایشگاه میکروبیولوژی (Microbiology Lab) | Expert | → Procurement |
| `gen-unit-patho-lab` | آزمایشگاه پاتولوژی (Pathology Lab) | Expert | → Procurement |
| `gen-unit-cold-store` | انبار سرد (Cold Storage) | Warehouse | → Warehouse |
| `gen-unit-internal-proc` | واحد تدارکات داخلی (Internal Procurement) | Logistics | → Procurement |
| `gen-unit-qa` | واحد تضمین کیفیت (Quality Assurance) | General | → Production |
| `gen-unit-tech-support` | واحد پشتیبانی فنی (Technical Support) | General | → IT |
| `gen-unit-internal-audit` | واحد حسابرسی داخلی (Internal Audit) | Administration | → Finance |

**Standard captures**: `{unitId}` (Procurement), `{warehouseUnitId}`, `{financeUnitId}`, `{prodUnitId}`, `{logisticsUnitId}`, `{itUnitId}`, `{hrUnitId}`, `{legalUnitId}`, `{rdUnitId}`, `{hematolabUnitId}`, `{microlabUnitId}`, `{patholabUnitId}`, `{coldstoreUnitId}`, `{internalprocUnitId}`, `{qaUnitId}`, `{techsupportUnitId}`, `{internalauditUnitId}`

### 1d. Product Hierarchy

| Entry | Entity | Value (fa) | Value (en) |
|-------|--------|-----------|------------|
| `gen-mfr` | Manufacturer | تولیدکننده نمونه | Sample Manufacturer |
| `gen-wareType` | WareType | تجهیزات آزمایشگاهی | Laboratory Equipment |
| `gen-wareClass` | WareClass | هماتولوژی | Hematology |
| `gen-wareGroup` | WareGroup | کیت | Kit |
| `gen-wareGroup-relations` | M:N link | Links WareGroup ↔ WareClass | — |
| `gen-wareModel` | WareModel | کیت TSH | TSH Kit |
| `gen-ware` | Ware | کیت TSH زیشیمی (2,500,000 IRR) | TSH Kit ZistShimi |
| `gen-store` | Store | فروشگاه نمونه | Sample Store |
| `gen-stuff` | Stuff | inventoryNo=1001, price=2,800,000 | Absolute price |

**Captures**: `{wareTypeId}`, `{wareClassId}`, `{wareGroupId}`, `{wareModelId}`, `{wareId}`, `{warePrice}`, `{storeId}`, `{stuffId}`, `{stuffPrice}`

### 1e. Processes — 8 Scoped Processes

#### Process #1 — General (Org-Wide) `{processGeneralId}`
فرآیند خرید عمومی سازمان | Steps: 3 (تأیید درخواست → تأیید انبار → تأیید مالی)

#### Process #2 — Unit-Scoped (Procurement) `{processUnitId}`
فرآیند خرید واحد خرید | Steps: 3 (تأیید درخواست → تأیید انبار → تأیید مالی)  
**Scope**: `unitId: {unitId}`

#### Process #3 — Unit-Scoped (Warehouse) `{processWarehouseId}`
فرآیند خرید انبار مرکزی | Steps: 2 (تأیید انبار → تأیید مالی)  
**Scope**: `unitId: {warehouseUnitId}`

#### Process #4 — Unit-Scoped (Finance) `{processFinanceId}`
فرآیند خرید واحد مالی | Steps: 1 (تأیید مالی)  
**Scope**: `unitId: {financeUnitId}`

#### Process #5 — WareType-Scoped `{processWaretypeId}`
فرآیند خرید تجهیزات آزمایشگاهی | Steps: 2 (تأیید درخواست → تأیید مالی)  
**Scope**: `wareTypeId: {wareTypeId}`

#### Process #6 — WareClass-Scoped `{processWareclassId}`
فرآیند خرید هماتولوژی | Steps: 1 (تأیید درخواست)  
**Scope**: `wareClassId: {wareClassId}`

#### Process #7 — WareGroup-Scoped `{processWaregroupId}`
فرآیند خرید کیت | Steps: 3 (تأیید درخواست → تأیید انبار → تأیید مالی)  
**Scope**: `wareGroupId: {wareGroupId}`

#### Process #8 — WareModel-Scoped `{processWaremodelId}`
فرآیند خرید کیت TSH | Steps: 2 (تأیید درخواست → تأیید مالی)  
**Scope**: `wareModelId: {wareModelId}`

All processes are **activated** via `activateProcess`.

### 1f. Budget

| Entry | Entity | Value |
|-------|--------|-------|
| `gen-fiscalYear` | FiscalYear | سال مالی 1405 (2026-03-21 → 2027-03-20) |
| `gen-budgetLine` | BudgetLine | BUD-001 — بودجه خرید تجهیزات |
| `gen-budgetAllocation` | BudgetAllocation | 100,000,000 IRR allocated |

### 1g. PR #1 — Direct Store Purchase

- **Auto-resolved process**: Process #2 (unit-scoped, Procurement)
- **Flow**: Submit → Check Store Availability → Assign Store → Step 1 (Procurement approve) → Warehouse Check → Step 2 (Warehouse approve) → Step 3 (Finance approve) → Goods Receipt → Auto Payment → Mark Paid
- `{prId}`, `{poItemId}`, `{goodsReceiptId}`, `{paymentOrderId}`

### 1h. PR #2 — Tender Purchase

- **Auto-resolved process**: Process #2 (unit-scoped, Procurement)
- **Flow**: Submit → Tender Add → Assign Vendor → Submit Offer → Close Tender → Award
- `{prTenderId}`, `{tenderId}`, `{offerId}`

### 1i. Inventory

| Entry | Action | Value |
|-------|--------|-------|
| `gen-inventory-add` | Initial stock | 50 units, Shelf A-12 |
| `gen-inventory-adjust` | Adjust to 45 | Manual: 5 damaged |
| `gen-consumption` | Consume 5 | Routine lab testing |
| `gen-inventory-transfer` | Transfer 10 | Warehouse → Procurement |

### 1j. Extended Coverage

| Entry | What It Tests |
|-------|---------------|
| `gen-tag` | Create tag (فوری, #FF0000) |
| `gen-duplicate-process` | Clone general process (name + "(Copy)") |
| `gen-budget-report` | Budget line report |
| `gen-update-admin-roles` | Add Manager role to admin |
| `gen-pr-pending` | 3rd PR (25M, qty=5) stays Pending for approval flow test |
| `gen-get-me` | User profile endpoint |
| `gen-store-update-score` | Store score update (4.5, 15M sales) |
| `gen-stepApproval-gets` | Filtered approval records |
| `gen-budgetLine-gets` | Budget lines by fiscal year |
| `gen-tenderOffer-gets` | Winning offer details |
| `gen-consumption-with-pr` | Consumption linked to PR |
| `gen-archive-process` | Archive duplicate process |
| `gen-add-removable-tag` | Tag for deletion test (موقت, #00FF00) |
| `gen-remove-tag` | Delete that tag |
| `gen-ware-update-relations` | Update ware's manufacturer relation |

---

## 2. User Accounts — Login, Role & Panel Mapping

| Panel | User | Email | Password | Role | Notes |
|-------|------|-------|----------|------|-------|
| **Admin** | Admin System | admin@lesansatek.com | password123 | Manager + Ordinary | Bootstrap ghost, full access |
| **UnitHead** | رضا احمدی | reza@lesansatek.com | password123 | UnitHead (Procurement) | Approves PRs for Procurement Unit |
| **Finance** | مریم حسینی | maryam@lesansatek.com | password123 | Ordinary + canManageBudget | Budget management, payment orders |
| **Vendor** | سارا کریمی | sara@lesansatek.com | password123 | Ordinary + canRespondToTender | Tender offer submission |
| **Employee** | علی محمدی | ali@lesansatek.com | password123 | Manager | Can also act as requester |
| **Warehouse** | حسین کاظمی | hossein@lesansatek.com | password123 | UnitHead (Warehouse) | Warehouse operations |

---

## 3. Test the Admin Panel

**Login:** `admin@lesansatek.com` / `password123`
**Redirect:** `/admin` dashboard

### 3.1 Dashboard & Navigation

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.1.1 | Navigate to `/login`, enter credentials, click "ورود" | Redirect to `/admin` dashboard |
| 3.1.2 | Dashboard loads | KPI cards: سازمان‌ها, کاربران, درخواست‌های خرید, فرآیندهای فعال, مناقصات, فروشگاه‌ها |
| 3.1.3 | **Role banner** | Purple banner: "شما نقش‌های متعددی دارید…" (extra panels available) |
| 3.1.4 | **Slidebar feature-gating** | All sections visible (admin has all features) |

### 3.2 Organizational Management

| # | Test Case | Data to Check |
|---|-----------|---------------|
| 3.2.1 | **سازمان‌ها** — click sidebar | List shows "سازمان نمونه" with city/state |
| 3.2.2 | Click "سازمان جدید" → create, then edit/delete | CRUD works |
| 3.2.3 | **Users** — click sidebar | All 11 users visible; search/filter by role |
| 3.2.4 | Click any user → detail page with roles, features, units | Edit roles, toggle isActive |
| 3.2.5 | **Units** — click sidebar | Tree view: 15 units with nesting: Hematology Lab → Procurement, Cold Storage → Warehouse, etc. |
| 3.2.6 | Click a unit → edit name, type, head, parent | Update works |

### 3.3 Geographic & Product Hierarchy

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.3.1 | **استان‌ها** — CRUD | "تهران" listed, can add/edit/delete |
| 3.3.2 | **شهرها** — CRUD | "تهران" listed, linked to state |
| 3.3.3 | **تولیدکنندگان** — CRUD | "تولیدکننده نمونه" (Iran) |
| 3.3.4 | **انواع کالا** → **کلاس کالا** → **گروه کالا** → **مدل کالا** | Navigate hierarchy: تجهیزات آزمایشگاهی → هماتولوژی → کیت → کیت TSH |
| 3.3.5 | **کالاها** — list/create | کیت TSH زیشیمی (2,500,000 IRR), brand=ZistShimi |
| 3.3.6 | Click ware → detail with manufacturer, hierarchy breadcrumbs | Update relations (manufacturer link) |

### 3.4 Store & Inventory

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.4.1 | **فروشگاه‌ها** — click sidebar | "فروشگاه نمونه" with city/state, score, contact |
| 3.4.2 | Click store → edit name, address, score | Store update works |
| 3.4.3 | **موجودی فروشگاه** (Stuff) | inventoryNo=1001, 2,800,000 IRR, absolute price |
| 3.4.4 | **انبارها** (Inventory) | TSH Kit: qty=45 (after adjust), Shelf A-12 |
| 3.4.5 | **حرکات انبار** (Stock Movements) | List of all movements: addStock, adjust, consumption, transfer |

### 3.5 Process Builder

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.5.1 | **فرآیندها** — click sidebar | 8 processes listed |
| 3.5.2 | Click "فرآیند خرید عمومی سازمان" | 3 steps visible (تأیید درخواست → تأیید انبار → تأیید مالی) |
| 3.5.3 | Click the unit-scoped process | Shows "واحد خرید" as scope |
| 3.5.4 | Click a hierarchy-scoped process (e.g. waretype) | Shows "تجهیزات آزمایشگاهی" as scope |
| 3.5.5 | **فرآیند تکراری** | "فرآیند خرید عمومی سازمان (Copy)" — Draft, version 1 |
| 3.5.6 | Click duplicate → edit name, activate | Works |
| 3.5.7 | **برچسب‌ها** (Tags) | "فوری" (#FF0000) listed; CRUD works |

### 3.6 Budget & Finance

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.6.1 | **سال‌های مالی** — click | "سال مالی 1405" (2026-03-21 → 2027-03-20), status=open |
| 3.6.2 | **ردیف‌های بودجه** — click | BUD-001, totalAllocated=100M |
| 3.6.3 | Click BUD-001 → detail with allocations, encumbrances, spending | Allocations: 100M |
| 3.6.4 | **گزارش بودجه** — click | Budget report with surplus/deficit/utilization |

### 3.7 Purchasing Requests

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.7.1 | **درخواست‌های خرید** — click | 3 PRs listed (direct store + tender + pending) |
| 3.7.2 | Click completed PR → full details | Workflow visualizer all steps done, history timeline, payment info |
| 3.7.3 | Click the pending PR (25M, qty=5) | Current step highlighted, no decision yet |

### 3.8 Tenders

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.8.1 | **مناقصات** — click | Tender "مناقصه خرید کیت TSH" listed, status=awarded |
| 3.8.2 | Click tender → detail | Awarded to فروشگاه نمونه (2,500,000 IRR), offer details |

---

## 4. Test the PR Flow (Direct Store Purchase)

This is the core business flow: **PR submit → UnitHead approves step-by-step → Goods Receipt → Payment**.

### 4a. Create a PR as Employee

1. **Log out**, login as `ali@lesansatek.com` / `password123` (or as `admin@lesansatek.com` if the Employee panel routes differently)
2. Navigate to the PR creation form
3. Fill in:
   - عنوان: `خرید کیت TSH` (or any custom title)
   - توضیحات: `Urgent request for TSH kits`
   - مبلغ تخمینی: `50000000`
   - تعداد: `10`
   - مدل کالا: Search for `کیت TSH` and select it
   - واحد درخواست‌کننده: `واحد خرید`
   - **No process field** — the backend auto-resolves to Process #2 (unit-scoped, Procurement)
4. Click "ثبت درخواست"
5. **Verify:**
   - Toast: "درخواست خرید با موفقیت ثبت شد"
   - PR appears with status **"در انتظار تایید"**
   - Process name shows "فرآیند خرید واحد خرید" (auto-resolved)
   - Step 1 highlighted in workflow visualizer

### 4b. Check Store Availability (Admin/Procurement)

This step calls `checkStoreAvailability` to see which stores carry the ware model.  
In the frontend this would be a UI action to preview available stores and their pricing.

### 4c. Assign Store (Admin/Procurement)

1. Navigate to the PR detail
2. Assign "فروشگاه نمونه" as the supplier
3. **Verify:**
   - Purchase order item created (qty=10, unitPrice auto-calculated from Stuff)
   - History shows "item_assigned" entry

### 4d. Approve Step 1 — Procurement Unit

1. **Log in as** `reza@lesansatek.com` / `password123` (UnitHead of Procurement)
2. Navigate to the UnitHead panel → pending requests
3. Click the PR
4. **Verify:**
   - Step Approval Panel shows "تأیید درخواست"
   - Comment textarea + "تایید" / "رد" buttons
5. Type comment: `تایید شد.`
6. Click "تایید" → confirm dialog → "تایید"
7. **Verify:**
   - Toast: "درخواست با موفقیت تایید شد"
   - Step 1 marked complete, Step 2 "تأیید انبار" highlighted as current
   - History shows "step_approved" entry

### 4e. Warehouse Check (Admin/Warehouse)

1. Navigate to the PR detail
2. Run warehouse check (confirms stock status from Central Warehouse)
3. **Verify:** Status still InProgress, step remains at 2

### 4f. Approve Step 2 — Warehouse Unit

1. **Log in as** `hossein@lesansatek.com` / `password123` (UnitHead of Warehouse)
2. Navigate to UnitHead panel → pending requests
3. Approve Step 2 "تأیید انبار"
4. **Verify:** Step 3 "تأیید مالی" highlighted as current

### 4g. Approve Step 3 — Finance Unit

1. **Log in as** `fatemeh@lesansatek.com` / `password123` (UnitHead of Finance)
2. Navigate to UnitHead panel → pending requests
3. Approve Step 3 "تأیید مالی"
4. **Verify:**
   - PR status → **"تکمیل شده" (Completed)**
   - All steps complete in visualizer
   - History shows full timeline

### 4h. Goods Receipt (Admin/Warehouse)

1. Navigate to goods receipt creation
2. Create receipt: GR-001, 10 units received, 10 accepted, 0 rejected
3. **Verify:**
   - Inventory updated (+10 units from goods receipt)
   - PO item status → "received"
   - Auto-created draft PaymentOrder with payTo=فروشگاه نمونه, financialUnit=Central Warehouse
   - Budget encumbrance converted to spent
   - History shows "goods_received" entry

### 4i. Mark Payment Paid (Finance/Admin)

1. Navigate to payment orders
2. Find the auto-created payment order
3. Click "markPaid"
4. **Verify:**
   - PaymentOrder status → "paid"
   - Budget encumbrance fully converted to spent
   - History shows payment entry

---

## 5. Test the Tender Flow

### 5a. Create the Tender PR

1. Login as `admin@lesansatek.com`
2. Create PR: title "خرید کیت TSH - مناقصه", qty=20, no store assignment
3. **Verify:** Status = Pending, process auto-resolved to Process #2

### 5b. Create & Configure Tender

1. Create tender: "مناقصه خرید کیت TSH", deadline=2026-05-01
2. Link to PR #2
3. Assign vendor: add "فروشگاه نمونه" as assigned vendor

### 5c. Vendor Submits Offer

1. **Log in as** `sara@lesansatek.com` / `password123` (Vendor)
2. Navigate to open tenders
3. Find the tender → click "ثبت پیشنهاد"
4. Fill: price=2,500,000, delivery=7 days, terms="30 days"
5. Submit
6. **Verify:** Offer status = "submitted"

### 5d. Close & Award

1. **Log in as** `admin@lesansatek.com`
2. Close the tender
3. Award to the submitted offer (winningOfferId)
4. **Verify:**
   - Tender status → "awarded"
   - Winning offer status → "accepted", others → "rejected"
   - PurchaseOrderItem created from tender (qty=20, unitPrice=2,500,000)
   - History "item_assigned" entry

---

## 6. Test the UnitHead Panel

**Login:** `reza@lesansatek.com` / `password123`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 6.1 | Login redirect | Lands on `/unit-head` dashboard |
| 6.2 | Dashboard | Pending approvals count, active PRs, decided counts |
| 6.3 | "درخواست‌های نیازمند تایید" → `/unit-head/requests` | PRs filtered by this unit, pending approvals only |
| 6.4 | PR detail page | Step approval panel, workflow visualizer, history timeline |
| 6.5 | Approve/Reject | Confirmation dialog before submitting |
| 6.6 | Loading state | Skeleton loaders on initial load |
| 6.7 | Empty state | If no PRs pending, Persian empty state with icon |
| 6.8 | Pagination | Prev/next buttons, page indicator |
| 6.9 | Error boundary | Invalid PR ID → error page with "تلاش مجدد" |

---

## 7. Test the Employee/Requester Panel

**Login:** `ali@lesansatek.com` / `password123` (or any user with canRegisterPurchaseRequest)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 7.1 | Login redirect | Lands on `/requests` dashboard |
| 7.2 | Dashboard KPIs | Total PRs, pending, approved, rejected |
| 7.3 | "درخواست جدید" → `/requests/new` | Form with: title, description, amount, quantity, ware model, unit (NO process selector) |
| 7.4 | Form validation | Empty title → "عنوان الزامی است"; negative amount → error |
| 7.5 | Submit → success | Toast, redirect to `/requests/my-requests` |
| 7.6 | My PRs list | DataTable with all PRs by this user |
| 7.7 | PR detail (read-only) | No approve/reject buttons; status badge; workflow visualizer |
| 7.8 | Pending PR view | Shows current step, greyed-out future steps |
| 7.9 | Empty state | "شما هنوز هیچ درخواست خریدی ثبت نکرده‌اید" with action button |

---

## 8. Test the Finance Panel

**Login:** `maryam@lesansatek.com` / `password123`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 8.1 | Login redirect | Lands on `/finance` dashboard |
| 8.2 | Dashboard KPIs | Total budget, remaining, pending payment orders, budget lines count |
| 8.3 | Budget lines (`/finance/budget-lines`) | BUD-001 with allocation, remaining, color-coded |
| 8.4 | Payment orders (`/finance/payment-orders`) | PR #1 payment order, status=paid, amount |
| 8.5 | Budget reports (`/finance/budget-reports`) | KPI summary + breakdown with utilization % |
| 8.6 | Empty states | Persian empty state when no data |
| 8.7 | **Access control** | Try `/admin` → redirect to `/finance` (no admin role) |

---

## 9. Test the Vendor Panel

**Login:** `sara@lesansatek.com` / `password123`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 9.1 | Login redirect | Lands on `/vendor` dashboard |
| 9.2 | Dashboard KPIs | Open tenders, my offers, awarded count, win rate |
| 9.3 | Open tenders (`/vendor/tenders`) | DataTable with title, deadline, status; "ثبت پیشنهاد" for open |
| 9.4 | Submit offer form | Fields: price, delivery time, terms, notes |
| 9.5 | My offers (`/vendor/my-offers`) | The submitted offer (2,500,000, 7 days, status=submitted) |
| 9.6 | Empty states | Persian empty state when no data |

---

## 10. Test Inventory & Stock Management

**Login as:** `admin@lesansatek.com`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 10.1 | **موجودی انبار** (Inventory list) | TSH Kit: qty=45 (after adjust), min=10, max=200, Shelf A-12 |
| 10.2 | Click inventory → adjust qty | Can update quantity |
| 10.3 | **حرکات انبار** (Stock Movements list) | Chronological list: addStock(50) → adjust(45) → consumption(-5) → goodsReceipt(+10) → transfer(-10) → consumption(-3) |
| 10.4 | Click any movement | Detail with balanceBefore, balanceAfter, reason, reference |
| 10.5 | **مصرف کالا** (Consumption Records) | 2 records: qty=5 (routine lab testing), qty=3 (quality control, linked to PR) |

---

## 11. Test Budget & Reporting

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 11.1 | Fiscal years list | "سال مالی 1405", open, active |
| 11.2 | Budget lines list | BUD-001 with allocations, spending, remaining |
| 11.3 | Click budget line | Detail: 100M allocated, encumbrances converted to spent, remaining |
| 11.4 | Budget report | Total allocated, spent, surplus/deficit, utilization % |
| 11.5 | Budget reports by fiscal year | Filter to 1405 → same data |

---

## 12. Test Process Builder & Archiving

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 12.1 | **Create process** | Form with name, description, optional scoping (unit / wareType / wareClass / wareGroup / wareModel) |
| 12.2 | **Create step** | Form with name, type, order, assignee groups (unit selector + AND/OR operator) |
| 12.3 | **Activate process** | Validates consecutive order, auto-increments version, status=Active |
| 12.4 | **Duplicate process** | Creates Draft copy with "(Copy)" suffix |
| 12.5 | **Archive process** | Set status=Archived on duplicate (no active PRs for that process) |
| 12.6 | **Archive guard** | Cannot archive a process with active PRs → error message |

---

## 13. Test Extended Features

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 13.1 | **getMe** | Any user, navigate to profile | Returns user profile with roles, features |
| 13.2 | **Store score update** | Admin → edit store | score=4.5, totalSoldAmount=15,000,000, totalSoldNum=5 |
| 13.3 | **Step approval gets** | UnitHead → PR detail → approvals tab | 3 approval records (one per step), with unit and step names |
| 13.4 | **Tender offer gets** | Vendor → my offers | Winning offer: 2,500,000, 7 days, store name |
| 13.5 | **Tag CRUD** | Admin → tags | Create فوری (#FF0000), create موقت (#00FF00), delete موقت |
| 13.6 | **Ware update relations** | Admin → ware detail → edit | Link/unlink manufacturer |
| 13.7 | **Consumption with PR** | Admin → consumption records | qty=3, "Quality control testing", linked to PR #1 |
| 13.8 | **Role update** | Admin → edit admin user | Manager role added alongside Ordinary |

---

## 14. Test Panel Switching & Role Routing

### 14a. Multi-Role Panel Switching

1. Login as **admin@lesansatek.com** — has Manager + Ordinary roles, all features
2. **PanelSelector** — in admin header, click the LayoutDashboard icon
3. **Verify:** Dropdown shows: مدیریت, پنل واحد, درخواست‌ها, مالی, فروشندگان
4. Click **"پنل واحد"** → redirects to `/unit-head`
5. Header changes to simpler PanelLayout (no sidebar)
6. Click PanelSelector → switch back to **"مدیریت"** → back to `/admin`

### 14b. User Menu Panel Links

1. Click avatar → user menu opens
2. **Verify:** "پنل‌ها" section shows accessible panels
3. Click any panel → redirects

### 14c. Direct URL Access Control

| URL | Login as | Expected |
|-----|----------|----------|
| `/admin` | `reza@lesansatek.com` | Allowed (sidebar may be filtered) |
| `/unit-head` | `ali@lesansatek.com` | Redirect to default panel (`/requests`) |
| `/finance` | `ali@lesansatek.com` | Redirect to default panel |
| `/vendor` | `ali@lesansatek.com` | Redirect to default panel |
| `/admin` | unauthenticated | Redirect to `/login` |
| `/unit-head` | unauthenticated | Redirect to `/login` |

---

## 15. Test Edge Cases

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.1 | **Empty lists** | Visit panel with no data (e.g., no PRs for a new user) | Persian empty state with icon + description |
| 15.2 | **Loading skeletons** | Hard refresh any list page | Brief skeleton loaders, then data |
| 15.3 | **Form double-submit** | Click submit button rapidly | Button disabled after first click (Loader2 spinner) |
| 15.4 | **Invalid route** | Navigate to `/nonexistent` | Next.js 404 page |
| 15.5 | **Error boundary** | Invalid PR ID in URL | Error page with "تلاش مجدد" button |
| 15.6 | **RTL text** | Inspect any page | All text right-aligned, headings end with colon (:) |
| 15.7 | **RTL icons** | Check arrows, breadcrumbs | Arrows point right (← instead of →) |
| 15.8 | **Responsive — mobile** | Resize < 768px | Sidebar hidden, hamburger menu, DataTable → card view |
| 15.9 | **Responsive — tablet** | Resize 768-1024px | Layout adapts, grid columns reduce |
| 15.10 | **Concurrent approval** | Two tabs, same UnitHead, approve same PR | Second submission → appropriate error |
| 15.11 | **Backend down** | Stop Deno backend while using app | Error toasts, error boundaries catch failures |
| 15.12 | **PR with no auto-resolve** | Create unit with no matching process | Error: "No active process found for this organization" |
| 15.13 | **Rejection on any step** | UnitHead rejects a PR | Status=Rejected, workflow stops, all steps marked incomplete |
| 15.14 | **Tender before close** | Vendor tries to submit offer after deadline | Validation error |

---

## 16. Verification Checklist

### Authentication & Routing
- [ ] Login with each user (5 panel users) redirects to correct panel
- [ ] Unauthenticated users redirect to `/login`
- [ ] PanelSelector shows correct panels per user
- [ ] Direct URL access blocked for unauthorized roles

### Admin Panel
- [ ] All sidebar sections render (11 entities)
- [ ] CRUD operations work for all entities
- [ ] Feature-gated sections hide correctly

### PR Flow (Core)
- [ ] Employee creates PR with ware model, unit, budget line — NO process selector
- [ ] Process auto-resolves (shown in response/detail)
- [ ] PR status = "در انتظار تایید" after submission
- [ ] UnitHead sees PR in pending list
- [ ] Step approval panel with comment + approve/reject
- [ ] Approve advances to next step
- [ ] Reject changes PR status to "رد شده"
- [ ] All steps approved → "تکمیل شده"
- [ ] Workflow visualizer reflects current step
- [ ] History timeline captures all events (submitted, step_approved, item_assigned, goods_received)
- [ ] Employee view is read-only (no approve/reject)

### Tender Flow
- [ ] Can create tender linked to PR
- [ ] Can assign vendors
- [ ] Vendor can submit offer
- [ ] Close tender → award → PO item created
- [ ] Audit trail complete

### Inventory
- [ ] Initial stock add works
- [ ] Adjust qty works
- [ ] Consumption reduces stock
- [ ] Transfer between units works
- [ ] Stock movements list shows all changes

### Budget & Finance
- [ ] Fiscal year CRUD
- [ ] Budget line CRUD with allocations
- [ ] Payment order auto-created on goods receipt
- [ ] Mark paid updates budget encumbrance
- [ ] Budget report shows summaries

### Panel Layouts
- [ ] Admin: sidebar + header + PanelSelector
- [ ] UnitHead: PanelLayout (simple header)
- [ ] Employee: PanelLayout (simple header)
- [ ] Finance: PanelLayout (simple header)
- [ ] Vendor: PanelLayout (simple header)

### UI/UX
- [ ] All text in Persian (no English strings)
- [ ] RTL layout everywhere
- [ ] Loading skeletons on all list pages
- [ ] Empty states on all list pages
- [ ] Error boundaries on all panels
- [ ] Dark theme (Midnight Ink background)
- [ ] Glass card styling on surfaces
- [ ] Responsive on mobile

### Error Handling
- [ ] Form validation shows Persian error messages
- [ ] API errors show toast notifications
- [ ] Error boundaries have "تلاش مجدد" button
- [ ] Loading states prevent double submission

---

## 17. Standard Workflow Examples

### 17a. Organization & User Quick Reference

| User | Login | Panel | Can Submit PR | Can Approve Steps |
|------|-------|-------|--------------|-------------------|
| **Admin System** | admin@lesansatek.com / password123 | `/admin` or `/employee` | ✓ (Employee role) | ✓ (Manager role) |
| **علی محمدی** (prodHead) | ali@lesansatek.com / password123 | `/admin` | ✓ (Employee role) | ✓ (Manager role) |
| **رضا احمدی** (unitheadUser) | reza@lesansatek.com / password123 | `/unit-head` | ✓ (Employee role) | ✓ (UnitHead role) |
| **حسین کاظمی** (warehouseHead) | hossein@lesansatek.com / password123 | `/unit-head` | ✓ (Employee role) | ✓ (UnitHead role) |
| **فاطمه موسوی** (finHead) | fatemeh@lesansatek.com / password123 | `/unit-head` | ✓ (Employee role) | ✓ (UnitHead role) |
| **مریم حسینی** (financeUser) | maryam@lesansatek.com / password123 | `/finance` | ✓ (Employee role) | ✗ (Ordinary) |
| **سارا کریمی** (vendorUser) | sara@lesansatek.com / password123 | `/vendor` | ✓ (Employee role) | ✗ (Ordinary) |

**All unit heads** (علی محمدی through فاطمه موسوی) work via `/admin` panel — they have Manager role.  
**UnitHead users** (رضا احمدی, حسین کاظمی, فاطمه موسوی) work via `/unit-head` panel — they see only their unit's data. This is the most common approval panel.

---

### 17b. Simple Workflow (1-Step: Finance Unit)

**Objective:** Single-step approval flow with one submitter and one approver.

| Detail | Value |
|--------|-------|
| **Process** | Process #4 — فرآیند خرید واحد مالی (unit-scoped to Finance Unit) |
| **Submitter** | **فاطمه موسوی** — fatemeh@lesansatek.com — UnitHead of Finance |
| **Step 1** | تأیید مالی → assigned to Finance Unit |
| **Approver** | Any user with a role at Finance Unit: **Admin System** works best (Manager role) |
| **Comment** | "تأیید شد" or leave blank |

#### Step-by-Step Frontend Walkthrough

**Phase 1 — Submit the PR (as Submitter)**
1. **Login** as فاطمه موسوی (fatemeh@lesansatek.com / password123)
   - If using `/unit-head` panel → you'll see Finance Unit data only
   - If using `/employee` panel → generic employee view
2. Navigate to **"درخواست خرید جدید"** (New Purchase Request)
3. Fill in the form:
   - **عنوان (Title):** "تجهیزات آزمایشگاه هماتولوژی"
   - **توضیحات (Description):** "درخواست خرید کیت TSH برای آزمایشگاه"
   - **مدل کالا (Ware Model):** select "کیت TSH" (the ware model from seed data)
   - **تعداد (Quantity):** `5`
   - **مبلغ تخمینی (Estimated Amount):** `25000000` (25,000,000)
   - **واحد درخواست‌کننده (Requesting Unit):** **"واحد مالی"** (Finance Unit) ← REQUIRED for org detection
   - **بودجه (Budget Line):** select "BUD-001" (if budget line field is shown)
4. Click **"ثبت درخواست"** (Submit Request)
5. ✅ Expected result: PR created with status **"در انتظار تایید"** (Pending)
6. The process auto-resolves to **Process #4** (1 step: تأیید مالی)
7. Note the PR number/ID for approval step

**Phase 2 — Approve the PR (as Approver)**
1. **Logout** and **Login** as **Admin System** (admin@lesansatek.com / password123) via `/admin` panel
   - Or any user who has Manager role and access to Finance unit approvals
2. Navigate to **"درخواست‌های خرید"** (Purchase Requests) list
3. Find the PR you just created (should show status "در انتظار تایید")
4. Click on the PR to view details
5. You should see **Step 1: تأیید مالی** highlighted as current step
6. Click **"تأیید"** (Approve)
   - **توضیحات (Comment):** type "تأیید شد. لطفاً به مرحله بعد منتقل شود." or leave blank
7. ✅ Expected result: PR status changes to **"تکمیل شده"** (Completed)

---

### 17c. Complex Workflow (3-Step: Procurement → Warehouse → Finance)

**Objective:** Full multi-approver chain. Three different users approve across three units, demonstrating OR/AND step logic and role switching.

| Detail | Value |
|--------|-------|
| **Process** | Process #2 — فرآیند خرید واحد خرید (unit-scoped to Procurement Unit) |
| **Submitter** | **رضا احمدی** — reza@lesansatek.com — UnitHead of Procurement |
| **Step 1** | **تأیید درخواست** → Procurement Unit (approver: has role at Procurement) |
| **Step 2** | **تأیید انبار** → Central Warehouse (approver: has role at Warehouse) |
| **Step 3** | **تأیید مالی** → Finance Unit (approver: has role at Finance) |

**Approver Mapping:**

| Step | Approver | Login | Panel | Role Used | Suggested Comment |
|------|----------|-------|-------|-----------|-------------------|
| 1 | **Admin System** | admin@lesansatek.com | `/admin` | Manager | "درخواست تأیید شد. به انبار ارسال شود." |
| 2 | **حسین کاظمی** | hossein@lesansatek.com | `/unit-head` | UnitHead | "موجودی انبار کافی است. تأیید شد." |
| 3 | **فاطمه موسوی** | fatemeh@lesansatek.com | `/unit-head` | UnitHead | "بودجه کافی است. تأیید نهایی." |

#### Step-by-Step Frontend Walkthrough

**Phase 1 — Submit the PR (as رضا احمدی)**
1. **Login** as **رضا احمدی** (reza@lesansatek.com / password123) via `/unit-head` panel
2. Navigate to **"درخواست خرید جدید"**
3. Fill in:
   - **عنوان:** "کیت آزمایشگاهی — خرید عمده"
   - **توضیحات:** "خرید ۱۰ عدد کیت TSH برای آزمایشگاه هماتولوژی"
   - **مدل کالا:** "کیت TSH"
   - **تعداد:** `10`
   - **مبلغ تخمینی:** `50000000` (50,000,000)
   - **واحد درخواست‌کننده:** **"واحد خرید"** (Procurement Unit)
   - **بودجه:** select BUD-001 if shown
4. Click **"ثبت درخواست"**
5. ✅ PR status: **"در انتظار تایید"**
6. The process auto-resolves to **Process #2** (3 steps)

**Phase 2 — Approve Step 1 (تأیید درخواست)**
1. **Logout** and **Login** as **Admin System** (admin@lesansatek.com) via `/admin` panel
2. Go to **"درخواست‌های خرید"** list
3. Find the PR (still in "در انتظار تایید", Step 1 active)
4. Click to view details → see **Step 1: تأیید درخواست** is current
5. Click **"تأیید"**
   - **توضیحات:** "درخواست تأیید شد. به انبار ارسال شود."
6. ✅ PR advances to **Step 2 (تأیید انبار)**

**Phase 3 — Approve Step 2 (تأیید انبار)**
1. **Logout** and **Login** as **حسین کاظمی** (hossein@lesansatek.com / password123) via `/unit-head` panel
2. He is the UnitHead of Central Warehouse
3. Go to **"درخواست‌های خرید"** list
4. Find the PR — status should still be "در انتظار تایید" but **Step 2** is now active
   - The unit-head panel filters to show PRs pending for Central Warehouse
5. Click to view details → **Step 2: تأیید انبار** is current
6. Click **"تأیید"**
   - **توضیحات:** "موجودی انبار بررسی شد. کافی است. تأیید شد."
7. ✅ PR advances to **Step 3 (تأیید مالی)**

**Phase 4 — Approve Step 3 (تأیید مالی)**
1. **Logout** and **Login** as **فاطمه موسوی** (fatemeh@lesansatek.com / password123) via `/unit-head` panel
2. She is UnitHead of Finance Unit
3. Go to **"درخواست‌های خرید"** list
4. Find the PR — **Step 3** is now active
5. Click **"تأیید"**
   - **توضیحات:** "بودجه کافی است. تأیید نهایی."
6. ✅ PR status: **"تکمیل شده"** (Completed)

---

### 17d. Alternative Workflow: Direct Store Purchase

**Objective:** After the 3-step approval above, test store assignment, goods receipt, and payment using the completed PR.

| Step | Action | User | Login |
|------|--------|------|-------|
| 1 | Assign Store to PO | Admin | admin@lesansatek.com |
| 2 | Record Goods Receipt | Admin | admin@lesansatek.com |
| 3 | Mark Payment | حسین کاظمی | hossein@lesansatek.com |

**Frontend flow:**
1. After PR is Completed, find it in the Admin panel
2. Click **"اختصاص فروشنده"** (Assign Store) → select the vendor store from seed data
3. A PurchaseOrderItem is auto-created
4. Click **"دریافت کالا"** (Goods Receipt) → fill in receipt details, quantity received
5. System auto-creates a draft PaymentOrder
6. Login as حسین کاظمی (warehouse) or Admin → navigate to Payment Orders
7. Click **"پرداخت شد"** (Mark Paid)

### 17e. Workflow: Tender / Vendor Selection

**Objective:** PR that goes through tender/auction instead of direct store assignment.

| Step | Action | User | Login |
|------|--------|------|-------|
| 1 | Submit PR | رضا احمدی | reza@lesansatek.com |
| 2 | Create Tender | Admin | admin@lesansatek.com |
| 3 | Assign Vendor | Admin | admin@lesansatek.com |
| 4 | Submit Offer | سارا کریمی | sara@lesansatek.com |
| 5 | Close Tender | Admin | admin@lesansatek.com |
| 6 | Award Winner | Admin | admin@lesansatek.com |

**Frontend flow (from Procurement perspective):**
1. رضا احمدی submits a new PR (requesting from Procurement Unit)
2. Admin creates a Tender linked to this PR, sets deadline
3. Admin assigns the seed vendor to the tender
4. سارا کریمی logs into `/vendor` panel, sees the tender, submits an offer (price, delivery time)
5. Admin closes the tender (no more offers accepted)
6. Admin awards the tender to سارا کریمی's store
7. PurchaseOrderItem is auto-created with the winning offer's price
8. PR can now proceed to goods receipt

---

### 17f. Role Switching Reference

| Action | Allowed Roles | Which Role to Use | Admin's Available RoleId |
|--------|--------------|-------------------|--------------------------|
| `purchasingRequest.submit` | `Manager`, `Admin`, `OrgHead`, `UnitHead`, `Employee` | **Employee** (all users have it) | `{employeeRoleId}` |
| `stepApproval.submitDecision` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **Manager** (org-wide) or **UnitHead** (scoped) | `{managerRoleId}` or `{adminUnitHeadProcRoleId}` / `{adminUnitHeadWhRoleId}` / `{adminUnitHeadFinRoleId}` |
| `purchasingRequest.assignStore` | Feature: `canAssignItemsToOrder` | Any | Any |
| `goodsReceipt.add` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **Manager** | `{managerRoleId}` |
| `paymentOrder.markPaid` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **Manager** or **UnitHead** | `{managerRoleId}` or unit-specific |

**Key rule:** submit → **Employee** role; approval/CRUD → **Manager** (for org-wide) or **UnitHead** (for unit-specific).

**Admin's full role set:**
- `{roleId}` → Ordinary (default, not used for submit/approve)
- `{managerRoleId}` → Manager (org-wide, for all approvals)
- `{employeeRoleId}` → Employee (for PR submit)
- `{adminUnitHeadProcRoleId}` → UnitHead at Procurement Unit
- `{adminUnitHeadWhRoleId}` → UnitHead at Central Warehouse
- `{adminUnitHeadFinRoleId}` → UnitHead at Finance Unit

### 17g. Troubleshooting Common Issues

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| "You cant do this" | `activeRoleId` resolves to `Ordinary` role, or role has no `roleId` UUID | Use Employee/Manager/UnitHead roleId; re-run `gen-update-admin-roles` to regenerate roles with proper UUIDs |
| "Could not determine organization" | `requestingUnitId` not sent or user/unit missing org relation | Send `requestingUnitId` in submit; ensure user has `organization` relation |
| PR stuck on step 1 | No StepApproval created for the unit | Check process step assigneeGroups — units must match the requesting unit's process |
| Goods Receipt fails | PR not completed or PO item missing | Complete store assignment first; ensure PR is in Completed status |

---

## 18. Appendix — Complete Test Data Reference

This appendix provides the full field-level reference for all test data created by the `e2e.json` suite. Use it when verifying data in the frontend UI.

### 18a. User Info

#### TempUser (Bootstrap Ghost)

| Field | Value |
|-------|-------|
| `first_name` | Admin |
| `last_name` | System |
| `email` | admin@lesansatek.com |
| `password` | password123 |
| `mobile` | 09120000000 |
| `gender` | Male |

#### Login Credentials

| Field | Value |
|-------|-------|
| `email` | admin@lesansatek.com |
| `password` | password123 |

**Captured values:**
- `ghostId` → runtime `_id` from tempUser response
- `ghostEmail` → runtime `email` from tempUser response
- `token` → runtime JWT from login response
- `userId` → runtime `user._id` from login response
- `roleId` → runtime `user.roles[0].roleId` from login response

---

#### Complete Users List (All 12 Users)

| # | Captured ID | Name | Email | Password | Mobile | Gender | Roles | Can Submit PR | Heads These Units | Purpose |
|---|-------------|------|-------|----------|--------|--------|-------|-------------|-------------------|---------|
| 1 | `{userId}` | Admin System | admin@lesansatek.com | password123 | 09120000000 | Male | **Ordinary**, **Manager**, **UnitHead**×3, **Employee** | ✓ (Employee) | Procurement, Warehouse, Finance | Bootstrap admin; all panels |
| 2 | `{prodHeadId}` | علی محمدی | ali@lesansatek.com | password123 | 09120000004 | Male | Manager + Employee | ✓ (Employee) | Production, QA | Head of Production |
| 3 | `{logHeadId}` | محمد رضایی | mohammad@lesansatek.com | password123 | 09120000005 | Male | Manager + Employee | ✓ (Employee) | Logistics, Internal Procurement | Head of Logistics |
| 4 | `{itHeadId}` | زهرا احمدی | zahra@lesansatek.com | password123 | 09120000006 | Male | Manager + Employee | ✓ (Employee) | IT, Technical Support | Head of IT |
| 5 | `{hrHeadId}` | نرگس کریمی | narges@lesansatek.com | password123 | 09120000007 | Male | Manager + Employee | ✓ (Employee) | HR | Head of HR |
| 6 | `{legalHeadId}` | فرهاد نوروزی | farhad@lesansatek.com | password123 | 09120000008 | Male | Manager + Employee | ✓ (Employee) | Legal | Head of Legal |
| 7 | `{rdHeadId}` | پریسا صادقی | parisa@lesansatek.com | password123 | 09120000009 | Male | Manager + Employee | ✓ (Employee) | R&D | Head of R&D |
| 8 | `{unitheadUserId}` | رضا احمدی | reza@lesansatek.com | password123 | 09120000001 | Male | UnitHead (Procurement) + Employee | ✓ (Employee) | Hematology/Micro/Pathology Labs | `/unit-head` panel |
| 9 | `{warehouseHeadId}` | حسین کاظمی | hossein@lesansatek.com | password123 | 09120000010 | Male | UnitHead (Warehouse) + Employee | ✓ (Employee) | Cold Storage | Head of Warehouse |
| 10 | `{finHeadId}` | فاطمه موسوی | fatemeh@lesansatek.com | password123 | 09120000011 | Female | UnitHead (Finance) + Employee | ✓ (Employee) | Internal Audit | Head of Finance |
| 11 | `{financeUserId}` | مریم حسینی | maryam@lesansatek.com | password123 | 09120000002 | Female | Ordinary + Employee + `canManageBudget` | ✓ (Employee) | — | `/finance` panel |
| 12 | `{vendorUserId}` | سارا کریمی | sara@lesansatek.com | password123 | 09120000003 | Female | Ordinary + Employee + `canRespondToTender` | ✓ (Employee) | — | `/vendor` panel |

**Notes:**
- Every user now has the **`Employee` role** as their secondary role, which is allowed by `grantAccess` for `purchasingRequest.submit`. Use `activeRoleId: {employeeRoleId}` (or each user's own Employee roleId) when submitting PRs.
- Users 2–7 (unit heads) have `isActive: true`, `is_verified: true`, `organization: {orgId}`.
- User 1 starts with a single role added at tempUser creation (`roles: [{name: "Ordinary"}]`). The `gen-update-admin-roles` entry appends `{name: "Manager"}` and `{name: "Employee"}` so the admin can use `/admin` and submit PRs via the employee panel.
- Users 8–10 are scoped UnitHeads — they manage a specific unit and see only that unit's data in their panels. They can also submit PRs using their Employee role.
- Users 11–12 are feature-gated Ordinary users — they can now also submit PRs because `Employee` is in their roles.
- **Role switching pattern:** `submit` → `Employee` role, `approve` → `Manager`/`UnitHead` role.

---

### 17b. Geographic Data

#### State

| Field | Value |
|-------|-------|
| `name` | تهران |
| `enName` | Tehran |

#### City

| Field | Value |
|-------|-------|
| `name` | تهران |
| `enName` | Tehran |

---

### 17c. Organizational Structure

#### Organization

| Field | Value |
|-------|-------|
| `name` | سازمان نمونه |
| `enName` | Sample Organization |
| `description` | Test organization for E2E |

**Relations:** `state`, `city`

#### Units

| Unit | `name` | `enName` | `description` | `type` | Extra Fields |
|------|--------|----------|---------------|--------|-------------|
| **Procurement Unit** | واحد خرید | Procurement Unit | Main purchasing unit | General | — |
| **Central Warehouse** | انبار مرکزی | Central Warehouse | Main warehouse | Warehouse | `warehouseCapacity`: 5000, `hasColdStorage`: true |
| **Finance Unit** | واحد مالی | Finance Unit | Financial management unit | Administration | — |
| **Production Unit** | واحد تولید | Production Unit | Production management | Production | — |
| **Logistics Unit** | واحد لجستیک | Logistics Unit | Logistics management | Logistics | — |
| **IT Unit** | واحد فناوری اطلاعات | IT Unit | Information technology | Expert | — |
| **HR Unit** | واحد منابع انسانی | HR Unit | Human resources | Administration | — |
| **Legal Unit** | واحد حقوقی | Legal Unit | Legal affairs | General | — |
| **R&D Unit** | واحد تحقیق و توسعه | R&D Unit | Research and development | Expert | — |
| **Hematology Lab** | آزمایشگاه هماتولوژی | Hematology Lab | Hematology testing | Expert | `parentUnitId`: Procurement |
| **Microbiology Lab** | آزمایشگاه میکروبیولوژی | Microbiology Lab | Microbiology testing | Expert | `parentUnitId`: Procurement |
| **Pathology Lab** | آزمایشگاه پاتولوژی | Pathology Lab | Pathology testing | Expert | `parentUnitId`: Procurement |
| **Cold Storage** | انبار سرد | Cold Storage | Cold storage facility | Warehouse | `parentUnitId`: Warehouse |
| **Internal Procurement** | واحد تدارکات داخلی | Internal Procurement | Internal procurement | Logistics | `parentUnitId`: Procurement |
| **Quality Assurance** | واحد تضمین کیفیت | Quality Assurance | Quality assurance | General | `parentUnitId`: Production |
| **Technical Support** | واحد پشتیبانی فنی | Technical Support | Technical support | General | `parentUnitId`: IT |
| **Internal Audit** | واحد حسابرسی داخلی | Internal Audit | Internal audit | Administration | `parentUnitId`: Finance |

**All units have:** `organizationId` → org

#### Unit-Head Mapping

| Unit | `name` | Head User | Head Captured ID |
|------|--------|-----------|------------------|
| Procurement Unit | واحد خرید | Admin System | `{userId}` |
| Central Warehouse | انبار مرکزی | Admin System | `{userId}` |
| Finance Unit | واحد مالی | Admin System | `{userId}` |
| Production Unit | واحد تولید | علی محمدی | `{prodHeadId}` |
| Logistics Unit | واحد لجستیک | محمد رضایی | `{logHeadId}` |
| IT Unit | واحد فناوری اطلاعات | زهرا احمدی | `{itHeadId}` |
| HR Unit | واحد منابع انسانی | نرگس کریمی | `{hrHeadId}` |
| Legal Unit | واحد حقوقی | فرهاد نوروزی | `{legalHeadId}` |
| R&D Unit | واحد تحقیق و توسعه | پریسا صادقی | `{rdHeadId}` |
| Hematology Lab | آزمایشگاه هماتولوژی | رضا احمدی | `{unitheadUserId}` |
| Microbiology Lab | آزمایشگاه میکروبیولوژی | رضا احمدی | `{unitheadUserId}` |
| Pathology Lab | آزمایشگاه پاتولوژی | رضا احمدی | `{unitheadUserId}` |
| Cold Storage | انبار سرد | حسین کاظمی | `{warehouseHeadId}` |
| Internal Procurement | واحد تدارکات داخلی | محمد رضایی | `{logHeadId}` |
| Quality Assurance | واحد تضمین کیفیت | علی محمدی | `{prodHeadId}` |
| Technical Support | واحد پشتیبانی فنی | زهرا احمدی | `{itHeadId}` |
| Internal Audit | واحد حسابرسی داخلی | فاطمه موسوی | `{finHeadId}` |

---

### 17d. Product Hierarchy

#### Manufacturer

| Field | Value |
|-------|-------|
| `name` | تولیدکننده نمونه |
| `enName` | Sample Manufacturer |
| `country` | Iran |

#### Level 1 — WareType

| Field | Value |
|-------|-------|
| `name` | تجهیزات آزمایشگاهی |
| `enName` | Laboratory Equipment |

#### Level 2 — WareClass

| Field | Value |
|-------|-------|
| `name` | هماتولوژی |
| `enName` | Hematology |

#### Level 3 — WareGroup

| Field | Value |
|-------|-------|
| `name` | کیت |
| `enName` | Kit |

#### Level 4 — WareModel

| Field | Value |
|-------|-------|
| `name` | کیت TSH |
| `enName` | TSH Kit |

#### Ware (Concrete Product)

| Field | Value |
|-------|-------|
| `name` | کیت TSH زیشیمی |
| `enName` | TSH Kit ZistShimi |
| `brand` | ZistShimi |
| `price` | 2,500,000 |

#### Hierarchy Diagram

```
WareType (تجهیزات آزمایشگاهی)
  └── WareClass (هماتولوژی)
        └── WareGroup (کیت) ── M:N ── WareClass
              └── WareModel (کیت TSH)
                    └── Ware (کیت TSH زیشیمی, price=2,500,000)
                          └── Stuff (price=2,800,000)
```

**WareGroup relation update:** links `wareClassIds: ["{wareClassId}"]` to establish M:N.

---

### 17e. Store & Stuff

#### Store

| Field | Value |
|-------|-------|
| `name` | فروشگاه نمونه |
| `address` | Tehran, Iran |
| `economicCode` | 123456789 |
| `postalCode` | 1234567890 |

**Relations:** `cityId`, `stateId`, `storeHeadId` → user

#### Stuff (Store Inventory)

| Field | Value |
|-------|-------|
| `inventoryNo` | 1001 |
| `price` | 2,800,000 |
| `hasAbsolutePrice` | true |

**Denormalized relations:** `wareId`, `storeId`, `wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId`

Pricing: **Absolute** (not percentage) — `hasAbsolutePrice: true`, actual price = 2,800,000.

---

### 17f. Process & Steps — 8 Scoped Processes

The E2E suite creates **8 processes** covering every scope form. PR creation auto-resolves the correct process via `resolveProcessForPR()`.

**Resolution priority** (first match wins):
1. Unit-scoped (`process.unit._id === requestingUnitId`)
2. Ware-scoped (`process.ware._id === wareId`)
3. WareModel-scoped → WareGroup → WareClass → WareType
4. Org-wide general (unscoped) — fallback

#### Process #1: General (Org-Wide) — `{processGeneralId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید عمومی سازمان |
| `description` | General org-wide procurement workflow |
| **Scope** | None (unscoped — applies to all PRs with no more specific match) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit (`{unitId}`) |
| 2 | تأیید انبار | 2 | Central Warehouse (`{warehouseUnitId}`) |
| 3 | تأیید مالی | 3 | Finance Unit (`{financeUnitId}`) |

#### Process #2: Unit-Scoped (Procurement) — `{processUnitId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید واحد خرید |
| **Scope** | `unitId: {unitId}` (Procurement Unit) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید انبار | 2 | Central Warehouse |
| 3 | تأیید مالی | 3 | Finance Unit |

#### Process #3: Unit-Scoped (Warehouse) — `{processWarehouseId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید انبار مرکزی |
| **Scope** | `unitId: {warehouseUnitId}` (Central Warehouse) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید انبار | 1 | Central Warehouse |
| 2 | تأیید مالی | 2 | Finance Unit |

#### Process #4: Unit-Scoped (Finance) — `{processFinanceId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید واحد مالی |
| **Scope** | `unitId: {financeUnitId}` (Finance Unit) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید مالی | 1 | Finance Unit |

#### Process #5: WareType-Scoped — `{processWaretypeId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید تجهیزات آزمایشگاهی |
| **Scope** | `wareTypeId: {wareTypeId}` (تجهیزات آزمایشگاهی) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید مالی | 2 | Finance Unit |

#### Process #6: WareClass-Scoped — `{processWareclassId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید هماتولوژی |
| **Scope** | `wareClassId: {wareClassId}` (هماتولوژی) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |

#### Process #7: WareGroup-Scoped — `{processWaregroupId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید کیت |
| **Scope** | `wareGroupId: {wareGroupId}` (کیت) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید انبار | 2 | Central Warehouse |
| 3 | تأیید مالی | 3 | Finance Unit |

#### Process #8: WareModel-Scoped — `{processWaremodelId}`

| Field | Value |
|-------|-------|
| `name` | فرآیند خرید کیت TSH |
| **Scope** | `wareModelId: {wareModelId}` (کیت TSH) |

| Step | `name` | `order` | Assignee Unit |
|------|--------|---------|---------------|
| 1 | تأیید درخواست | 1 | Procurement Unit |
| 2 | تأیید مالی | 2 | Finance Unit |

#### Assignee Logic (All Processes)

Each step has a single group with `operator: "AND"` — the single unit in the group must approve. `groupsOperator: "AND"` (only 1 group per step).

#### Activation

Every process is activated via `activateProcess` (validates consecutive step order, auto-increments version, sets `status: Active`, `isActive: true`).

#### Duplicate

The general process is duplicated via `duplicateProcess` (creates Draft copy named "فرآیند خرید عمومی سازمان (Copy)", captured as `{dupProcessId}`).

---

### 17g. Tag

| Field | Value |
|-------|-------|
| `name` | فوری |
| `color` | #FF0000 |
| `description` | Urgent items |

---

### 17h. Budget

#### FiscalYear

| Field | Value |
|-------|-------|
| `name` | سال مالی 1405 |
| `startDate` | 2026-03-21 |
| `endDate` | 2027-03-20 |
| `isActive` | true |

Status defaults to `"open"`.

#### BudgetLine

| Field | Value |
|-------|-------|
| `code` | BUD-001 |
| `title` | بودجه خرید تجهیزات |
| `description` | Laboratory equipment budget |

#### BudgetAllocation

| Field | Value |
|-------|-------|
| `amount` | 100,000,000 |
| `description` | Annual allocation for lab equipment |
| `allocatedAt` | 2026-03-21 |

---

### 17i. Purchasing Requests

#### PR #1 — Direct Store Purchase

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH |
| `description` | Urgent request for TSH kits |
| `estimatedAmount` | 50,000,000 |
| `quantity` | 10 |

**Relations (no processId — auto-resolved):** `wareModelId`, `requestingUnitId` → Procurement Unit, `budgetLineId`

**Auto-resolve:** requestingUnit=`{unitId}` → matches Process #2 (unit-scoped, Procurement) → resolves `{processUnitId}`

**Flow:** Submit → Check Store Availability → Assign Store → Step 1 Decision (approved) → Warehouse Check → Step 2 Decision (approved) → Step 3 Decision (approved) → Goods Receipt → Auto Payment

#### PR #2 — Tender-Based Purchase

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH - مناقصه |
| `description` | Tender-based procurement |
| `quantity` | 20 |

**Relations (no processId — auto-resolved):** `wareModelId`, `requestingUnitId` → Procurement Unit, `budgetLineId`

**Auto-resolve:** requestingUnit=`{unitId}` → matches Process #2 (unit-scoped, Procurement) → resolves `{processUnitId}`

#### PR #3 — Pending (for approval flow test)

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH - در انتظار |
| `description` | Pending PR for approval flow test |
| `estimatedAmount` | 25,000,000 |
| `quantity` | 5 |

**Stays in `Pending` status** — no decisions submitted.

---

### 17j. Tender

| Field | Value |
|-------|-------|
| `title` | مناقصه خرید کیت TSH |
| `description` | Open tender for TSH kits |
| `deadline` | 2026-05-01 |

#### TenderOffer (by the store)

| Field | Value |
|-------|-------|
| `price` | 2,500,000 |
| `deliveryTime` | 7 days |
| `paymentTerms` | 30 days |
| `submittedAt` | 2026-04-10 |

**Tender vendor assignment:** Store is assigned via `updateRelations` (`assignedVendorsId`).

**Tender flow:** Add → UpdateRelations (assign vendor) → Submit Offer → Close Tender → Award

---

### 17k. Goods Receipt

| Field | Value |
|-------|-------|
| `receiptNumber` | GR-001 |
| `description` | First goods receipt |
| `receivedAt` | 2026-04-01 |
| `items` | `[{purchaseOrderItemId, wareModelId, quantityReceived: 10, quantityAccepted: 10, quantityRejected: 0}]` |

**Relations:** `purchasingRequestId` → PR #1, `receivedById` → user, `receivingUnitId` → Central Warehouse

---

### 17l. Inventory & Stock

#### Inventory (Initial)

| Field | Value |
|-------|-------|
| `quantity` | 50 |
| `minQuantity` | 10 |
| `maxQuantity` | 200 |
| `location` | Shelf A-12 |

**Relations:** `wareModelId` → TSH Kit, `unitId` → Central Warehouse

#### Inventory Adjust

| Field | Value |
|-------|-------|
| `quantity` | 45 |
| `description` | Manual adjustment: found 5 damaged units |

#### Consumption Record

| Field | Value |
|-------|-------|
| `quantity` | 5 |
| `consumedAt` | 2026-04-02 |
| `reason` | Routine lab testing |

**Relations:** `wareModelId`, `unitId` → Procurement Unit, `consumedById` → user, `inventoryId`

#### Consumption Record (with PR link)

| Field | Value |
|-------|-------|
| `quantity` | 3 |
| `consumedAt` | 2026-04-03 |
| `reason` | Quality control testing |

**Relations:** `wareModelId`, `unitId` → Procurement Unit, `consumedById` → user, `inventoryId`, `purchasingRequestId` → PR #1

#### Inventory Transfer

| Field | Value |
|-------|-------|
| `quantity` | 10 |
| `description` | Transfer to procurement for testing |

**From:** Central Warehouse → **To:** Procurement Unit

---

### 17m. Role Management (Frontend Panel Users)

| # | ID | Purpose | Captures |
|---|-----|---------|----------|
| 51 | `gen-update-admin-roles` | Adds `"Manager"` role to admin (alongside `"Ordinary"`) for `/admin` panel | — |
| 52 | `gen-unithead-user` | Creates **رضا احمدی** (`reza@lesansatek.com` / `password123`) with `UnitHead` role scoped to Procurement Unit | `{unitheadUserId}` |
| 53 | `gen-finance-user` | Creates **مریم حسینی** (`maryam@lesansatek.com` / `password123`) with `canManageBudget` feature | `{financeUserId}` |
| 54 | `gen-vendor-user` | Creates **سارا کریمی** (`sara@lesansatek.com` / `password123`) with `canRespondToTender` feature | `{vendorUserId}` |
| 55 | `gen-pr-pending` | Submits a 3rd PR (25,000,000, qty=5, TSH Kit) that stays in `Pending` status | `{prPendingId}` |

#### Panel-to-User Mapping

| Panel | User | Role/Feature | Credentials |
|-------|------|-------------|-------------|
| `/admin` | Admin System (existing) | `Manager` + `Ordinary` | admin@lesansatek.com / password123 |
| `/unit-head` | رضا احمدی | `UnitHead` (scope: Procurement Unit) | reza@lesansatek.com / password123 |
| `/finance` | مریم حسینی | `Ordinary` + `canManageBudget` | maryam@lesansatek.com / password123 |
| `/vendor` | سارا کریمی | `Ordinary` + `canRespondToTender` | sara@lesansatek.com / password123 |
| `/employee` | Admin System (existing) | `Ordinary` | admin@lesansatek.com / password123 |

#### Complete Captured Variables

| Variable | Source | Value |
|----------|--------|-------|
| `{unitheadUserId}` | gen-unithead-user | _id of رضا احمدی (UnitHead) |
| `{financeUserId}` | gen-finance-user | _id of مریم حسینی (Finance) |
| `{vendorUserId}` | gen-vendor-user | _id of سارا کریمی (Vendor) |
| `{prPendingId}` | gen-pr-pending | _id of the pending PR (25M, qty=5) |
| `{subUnitId}` | gen-unit-child | _id of Hematology Lab sub-unit |
| `{tempTagId}` | gen-add-removable-tag | _id of the temporary tag |
| `{managerRoleId}` | gen-update-admin-roles | roleId of the `Manager` role (for submitDecision etc.) |
| `{employeeRoleId}` | gen-update-admin-roles | roleId of the `Employee` role (for submit, warehouseCheck, etc.) |

---

### 17n. Extended E2E Coverage

| # | ID | What It Tests | Data Added |
|---|-----|---------------|------------|
| 56 | `gen-get-me` | Authenticated `user/getMe` endpoint | Returns admin profile with roles |
| 57 | `gen-unit-child` | Unit tree nesting (`parentUnit`) | Hematology Lab (Expert) under Procurement Unit, head=رضا احمدی |
| 58 | `gen-store-update-score` | Pure field update on store | score=4.5, totalSoldAmount=15,000,000, totalSoldNum=5 |
| 59 | `gen-stepApproval-gets` | Filtered `stepApproval/gets` | Returns 3 approval records (one per step) for completed PR #1 |
| 60 | `gen-budgetLine-gets` | Filtered `budgetLine/gets` by fiscal year | Returns BUD-001 with allocation/spent/remaining |
| 61 | `gen-tenderOffer-gets` | Filtered `tenderOffer/gets` by tender | Returns the winning offer (2,500,000, 7 day delivery) |
| 62 | `gen-consumption-with-pr` | Consumption linked to PR (history push) | qty=3, Quality control testing, linked to PR #1 |
| 63 | `gen-archive-process` | Archive guard — uses dupProcessId (no active PRs) | Duplicate process status → Archived |
| 64 | `gen-add-removable-tag` | Tag creation for deletion test | name="موقت", color=#00FF00 |
| 65 | `gen-remove-tag` | `tag/remove` action | Deletes the temporary tag |
| 66 | `gen-ware-update-relations` | Update ware's manufacturer relation | Links ware to manufacturer via `manufacturerId` |

---

### 17o. Complete Data Flow Summary

```
Setup Phase:
  tempUser (Admin/System) → login → capture token
  state (Tehran) → city (Tehran) → org (Sample Organization)
  ↓
  15 units (7 type=General, 2 Warehouse, 2 Administration, 4 Logistics/Production, 5 Expert-labs)
  8 unit heads + 3 panel users
  Manufacturer → WareType → WareClass → WareGroup → WareModel → Ware → Stuff
  Store → link to city/state
  ↓
  8 Processes (1 general + 3 unit-scoped + 4 hierarchy-scoped)
  All activated with consecutive steps
  ↓
  Budget:
    FiscalYear (1405) → BudgetLine (BUD-001) → Allocation (100,000,000)
  ↓

E2E Flow #1 — Direct Store Purchase (auto-resolved → Process #2, unit-scoped):
  PR Submit (TSH Kit, qty=10, est=50M, requestingUnit=Procurement) → Pending
    Auto-resolve: requestingUnit matches Process #2 (unit-scoped, Procurement)
  Check Store Availability → Assign Store → PO Item created
  Step 1 (Procurement Unit): approve → advances to step 2
  Warehouse Check → Step 2 (Warehouse): approve → advances to step 3
  Step 3 (Finance): approve → Completed
  Goods Receipt (GR-001, qty=10 accepted) → auto-inventory, auto-payment
  Payment Order: gets existing PO → markPaid
  ↓

E2E Flow #2 — Inventory Management:
  Inventory add (Shelf A-12, qty=50)
  Adjust (qty=45, 5 damaged)
  Consumption (qty=5, routine lab testing)
  Stock Movements (gets all)
  Inventory Transfer (10 units, Warehouse → Procurement)
  ↓

E2E Flow #3 — Tender Purchase (auto-resolved → Process #2, unit-scoped):
  PR Submit (TSH Kit, qty=20, requestingUnit=Procurement) → Pending
  Tender add (deadline: 2026-05-01)
  Assign vendor (Store) to tender via updateRelations
  Vendor submits Offer (price=2,500,000, 7 day delivery)
  Close tender → Award to winning offer
  ↓

Utility:
  Tag (فوری, red)
  Duplicate general process
  Budget report (gets budget line report)
  ↓

E2E Flow #4 — Role Management:
  Admin role update (add Manager)
  UnitHead user (رضا احمدی)
  Finance user (مریم حسینی, canManageBudget)
  Vendor user (سارا کریمی, canRespondToTender)
  Pending PR (25M, qty=5, for approval flow test)
  ↓

E2E Flow #5 — Extended Coverage:
  getMe (profile check)
  Store score update (4.5, 15M sales)
  StepApproval gets (3 records for PR #1)
  BudgetLine gets (filtered by fiscal year)
  TenderOffer gets (winning offer details)
  Consumption with PR link (qty=3, history push)
  Archive duplicate process (Archived status)
  Add removable tag (موقت) → Remove tag
  Ware update relations (manufacturer link)
```
