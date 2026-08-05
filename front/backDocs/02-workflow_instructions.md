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

The suite creates **126 records** spanning the full lifecycle. Below is the complete reference.

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
9. [Test the Vendor / Store Head Panel](#9-test-the-vendor--store-head-panel)
10. [Test the OrgHead Panel](#10-test-the-orghead-panel)
11. [Test the Store Panel (StoreHead)](#11-test-the-store-panel-storehead)
12. [Test Inventory & Stock Management](#12-test-inventory--stock-management)
13. [Test Budget & Reporting](#13-test-budget--reporting)
14. [Test Process Builder & Archiving](#14-test-process-builder--archiving)
15. [Test Extended Features](#15-test-extended-features)
16. [Test Panel Switching & Role Routing](#16-test-panel-switching--role-routing)
17. [Test Edge Cases](#17-test-edge-cases)
18. [Verification Checklist](#18-verification-checklist)
19. [Standard Workflow Examples](#19-standard-workflow-examples)
20. [Appendix — Complete Test Data Reference](#20-appendix--complete-test-data-reference)

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
| `gen-vendor-user` | سارا کریمی (sara@lesansatek.com) | Manager + Ordinary + Employee + canRespondToTender + canAssignItemsToOrder | Vendor / Store Head |
| `gen-orghead-user` | دکتر احمدی (dr.ahmadi@lesansatek.com) | OrgHead (scope: organization) | OrgHead Panel |

### 1c. Units (17 total)

| Entry | Unit Name (fa) | Type | Parent Unit |
|-------|---------------|------|-------------|
| `gen-unit-procurement` | واحد خرید (Procurement) | General | — |
| `gen-unit-warehouse` | انبار مرکزی (Central Warehouse) | Warehouse | — |
| `gen-unit-finance` | واحد مالی (Finance) | Finance | — |
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
- **Flow**: Submit → Check Store Availability → Add Stuff (via `addStuff`) → Step 1 (Procurement approve) → Warehouse Check → Step 2 (Warehouse approve) → Step 3 (Finance approve, requires `budgetLineId` + budget sufficiency check) → PendingFinalization → OrgHead finalize (`finalize` action, `["Manager","Admin","OrgHead"]`) → Completed → Goods Receipt → Auto Payment (draft) → Mark Paid (deducts `totalAllocated` from budget line)
- `{prId}`, `{goodsReceiptId}`, `{paymentOrderId}`

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
| `gen-sara-login` | Login as Sara (StoreHead), captures `saraToken`, `saraRoleId` |
| `storehead-stuff-gets` | StoreHead views their store's stuff (auto-filtered by `store._id`) |
| `storehead-store-gets` | StoreHead views store list |
| `storehead-tender-gets` | StoreHead browses open tenders |
| `storehead-tenderOffer-gets` | StoreHead views offers for a tender |
| `storehead-pr-gets` | StoreHead views PRs assigned to their store |
| `storehead-update-stuff-status` | StoreHead sets `stuffStatus` to `ready_to_ship` |
| `storehead-verify-stuff-status` | Confirm `stuffStatus` update via `get` |

---

## 2. User Accounts — Login, Role & Panel Mapping

| Panel | User | Email | Password | Role | Notes |
|-------|------|-------|----------|------|-------|
| **Admin** | Admin System | admin@lesansatek.com | password123 | Manager + Ordinary | Bootstrap ghost, full access |
| **UnitHead** | رضا احمدی | reza@lesansatek.com | password123 | UnitHead (Procurement) | Approves PRs for Procurement Unit |
| **Finance** | مریم حسینی | maryam@lesansatek.com | password123 | Ordinary + canManageBudget | Budget management, payment orders |
| **Vendor / Store Head** | سارا کریمی | sara@lesansatek.com | password123 | Manager + Ordinary + Employee + canRespondToTender + canAssignItemsToOrder | Store manager, tender offer submission, can add stuff to store |
| **Employee** | علی محمدی | ali@lesansatek.com | password123 | Manager | Can also act as requester |
| **Warehouse** | حسین کاظمی | hossein@lesansatek.com | password123 | UnitHead (Warehouse) | Warehouse operations |
| **OrgHead** | دکتر احمدی | dr.ahmadi@lesansatek.com | password123 | OrgHead (Organization) | Organization-level oversight, tender finalization |

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
| 3.7.1 | **درخواست‌های خرید** — click sidebar | 3+ PRs listed across statuses (Draft, Pending, PendingFinalization, Completed) |
| 3.7.2 | Click completed PR → full details | Workflow visualizer all steps done, history timeline (`stuff_assigned`, `step_approved`, `all_steps_approved`, `finalized`, `goods_received`), payment info |
| 3.7.3 | Click a Draft PR | Shows `selectionType` = "none" or "stuff"/"tender". No process linked. "ارسال درخواست" button available. |
| 3.7.4 | Click the pending PR (25M, qty=5) | Current step highlighted, no decision yet |

### 3.8 Tenders

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.8.1 | **مناقصات** — click | Tender "مناقصه خرید کیت TSH" listed, status=awarded |
| 3.8.2 | Click tender → detail | Awarded to فروشگاه نمونه (2,500,000 IRR), offer details |

---

## 4. Test the PR Flow (Direct Store Purchase)

This is the core business flow: **PR Draft → addStuff/submit → UnitHead approves step-by-step → OrgHead Finalizes → StoreHead delivers → Goods Receipt → Payment**.

### 4a. Create a Draft PR (Requester)

1. **Log out**, login as `ali@lesansatek.com` / `password123`
2. Navigate to the PR creation form
3. Fill in:
   - عنوان: `خرید کیت TSH` (or any custom title)
   - توضیحات: `Urgent request for TSH kits`
   - تعداد: `10`
   - مدل کالا: Search for `کیت TSH` and select it
   - **No `estimatedAmount`, `budgetLineId`, `processId`, or `storeId`** — these are set later or auto-resolved
   - **No `requestingUnit` field in `add`** — auto-derived from the active role's scope
4. Click "ثبت پیشنویس درخواست"
5. **Verify:**
   - Toast: "پیش‌نویس درخواست خرید با موفقیت ثبت شد"
   - PR appears with status **"Draft"** (پیش‌نویس)
   - No process linked yet
   - `selectionType` is `"none"`
   - `stuffStatus` is `"none"`

### 4b. Assign Stuff to PR (UnitHead/Admin)

1. Navigate to the Draft PR detail
2. Click **"تخصیص کالا"** (Add Stuff) — this calls `purchasingRequest.addStuff`
3. Browse available **Stuff** records (product listings) — store name is **NOT shown** to unit head
4. Select the TSH Kit stuff (فروشگاه نمونه's inventory at 2,800,000 IRR)
5. **Verify:**
   - `selectionType` → `"stuff"`
   - `stuffStatus` → `"assigned"`
   - `estimatedAmount` set to stuff price × quantity
   - History shows `"stuff_assigned"` entry (replaces old `"item_assigned"`)

### 4c. Submit the PR (Draft → Pending)

1. From the Draft PR detail, click **"ارسال درخواست"** (Submit)
2. **Verify:**
   - Toast: "درخواست خرید با موفقیت ارسال شد"
   - PR status → **"در انتظار تایید" (Pending)**
   - Process name shows "فرآیند خرید واحد خرید" (auto-resolved)
   - Step 1 highlighted in workflow visualizer

**Note:** Submit requires `selectionType !== "none"`. If no stuff is assigned and no tender offer is selected, the backend rejects with: `"Please assign stuff or select a tender offer before submitting this request"`.

### 4d. Approve Step 1 — Procurement Unit

1. **Log in as** `reza@lesansatek.com` / `password123` (UnitHead of Procurement)
2. The UnitHead panel now uses **`getPendingByUnit`** (not `stepApproval.gets`) to find pending PRs
3. Navigate to the UnitHead panel → pending requests
4. Click the PR
5. **Verify:**
   - Step Approval Panel shows "تأیید درخواست"
   - Comment textarea + "تایید" / "رد" buttons
6. Type comment: `تایید شد.`
7. Click "تایید" → confirm dialog → "تایید"
8. **Verify:**
   - Toast: "درخواست با موفقیت تایید شد"
   - Step 1 marked complete, Step 2 "تأیید انبار" highlighted as current
   - History shows "step_approved" entry

### 4e. Approve Step 2 — Warehouse Unit

1. **Log in as** `hossein@lesansatek.com` / `password123` (UnitHead of Warehouse)
2. Navigate to UnitHead panel → pending requests
3. Approve Step 2 "تأیید انبار"
4. **Verify:** Step 3 "تأیید مالی" highlighted as current

### 4f. Approve Step 3 — Finance Unit (with Budget Line + Auto-Encumbrance)

1. **Log in as** `fatemeh@lesansatek.com` / `password123` (UnitHead of Finance)
2. Navigate to UnitHead panel → pending requests
3. Approve Step 3 "تأیید مالی" — **must provide a budget line** (select BUD-001 from the budget line picker)
4. **Verify:**
   - PR status → **"در انتظار نهایی‌سازی" (PendingFinalization)**
   - All steps complete in visualizer
   - History shows "all_steps_approved" entry with budget line info
   - Budget line linked to the PR
   - **Auto-created BudgetEncumbrance** (reserves the estimated amount on the budget line)
   - Budget line's `totalEncumbered` increased, `remainingBudget` reduced accordingly

### 4g. OrgHead Finalize (PendingFinalization → Completed)

1. **Log in as** `dr.ahmadi@lesansatek.com` / `password123` (OrgHead)
2. Navigate to **OrgHead panel** (`/orghead`) → "در انتظار تأیید" tab
3. Click the PR → Click **"تأیید نهایی"** (Finalize)
4. If both stuff AND tender exist: pick the winner (stuff or tender)
5. Optionally add **post-completion steps** (quality review steps for specific units)
6. **Verify:**
   - PR status → **"تکمیل شده" (Completed)**
   - `finalizedAt` timestamp set
   - `stuffStatus` → `"assigned"`
   - History shows "finalized" entry
   - If tender was selected: tender → `"awarded"`, winning offer → `"accepted"`, other offers → `"rejected"`

### 4h. StoreHead Delivery (assigned → ready_to_ship → shipped → delivered)

1. **Log in as** `sara@lesansatek.com` / `password123` (StoreHead)
2. Navigate to **Store panel** (`/store`) → purchasing requests list
3. Find the PR (stuffStatus = "assigned")
4. Click **"آماده ارسال"** → status → `"ready_to_ship"`
5. Click **"ارسال شد"** → status → `"shipped"`
6. Click **"تحویل داده شد"** → status → `"delivered"`
7. **Verify:**
   - `stuffStatus` progresses: assigned → ready_to_ship → shipped → delivered
   - History shows "stuff_status_updated" entries for each stage

### 4i. Goods Receipt (Requester, Requesting Unit Head, or Warehouse Head)

> **Authority check:** The PR's requester, the requesting unit's head, or a Warehouse-type unit head can confirm delivery.
> `receivingUnitId` is derived from identity: warehouse heads → their warehouse unit; otherwise → the PR's `requestingUnit`. The client-supplied value is ignored (but must still be a valid ObjectId).

1. Log in as the PR requester (e.g. Admin, who submitted the PR)
2. Navigate to goods receipt creation
3. Create receipt: GR-001, 10 units received, 10 accepted, 0 rejected, receiving unit = requesting unit
4. **Verify:**
   - Inventory updated (+10 units from goods receipt)
   - PR's `stuffStatus` → `"received"`
   - Auto-created draft PaymentOrder with payTo=فروشگاه نمونه, financialUnit=requestingUnit
   - Budget encumbrance auto-converted to spent
   - History shows "goods_received" entry

### 4j. Payment Lifecycle (OrgHead → Finance UnitHead)

**Step 1 — OrgHead sends to Finance:**
1. **Log in as** `dr.ahmadi@lesansatek.com` / `password123` (OrgHead)
2. Navigate to payment orders → find the draft auto-created payment order
3. Update status → `"sent_to_finance"`

**Step 2 — Finance UnitHead marks Paid:**
1. **Log in as** `fatemeh@lesansatek.com` / `password123` (Finance UnitHead)
2. Navigate to Finance panel → payment orders filtered by `status: "sent_to_finance"`
3. Click **"پرداخت شد"** (Mark Paid)
4. **Verify:**
   - PaymentOrder status → `"paid"`, `paidAt` timestamp recorded
   - Budget line's `totalAllocated` deducted by the payment amount
   - `remainingBudget` recalculated accordingly
   - History shows payment entry

---

## 5. Test the Tender Flow

### 5a. Create the Tender PR (Draft)

1. Login as `admin@lesansatek.com`
2. Create PR: title "خرید کیت TSH - مناقصه", qty=20 — this creates a **Draft** PR
3. **Verify:** Status = Draft, `selectionType` = "none", no process linked

### 5b. Create & Configure Tender (on Draft PR)

1. From the Draft PR, create tender: "مناقصه خرید کیت TSH", deadline=2026-05-01
2. The PR remains in Draft status (tender can be created on Draft PRs)
3. Assign vendor: add "فروشگاه نمونه" as assigned vendor via `tender.updateRelations`

### 5c. Vendor Submits Offer

1. **Log in as** `sara@lesansatek.com` / `password123` (Vendor/StoreHead)
2. Navigate to open tenders
3. Find the tender → click "ثبت پیشنهاد"
4. Fill: price=2,500,000, delivery=7 days, terms="30 days", **select a specific Ware** (required)
5. Submit
6. **Verify:** Offer status = "submitted"

### 5d. Close Tender & Select Winning Offer (Deferred Award)

1. **Log in as** `admin@lesansatek.com`
2. Close the tender (no more offers accepted)
3. **Select the winning offer** via `purchasingRequest.selectTenderOffer` (NOT `tender.award`)
4. **Verify:**
   - `selectionType` → `"tender"`
   - `selectedTenderOfferId` → the chosen offer's `_id`
   - `estimatedAmount` set to winning price × quantity
   - Tender status **remains `"closed"`** (not awarded yet)
   - History shows `"tender_offer_selected"` entry
   - All offers still `"submitted"` (none accepted/rejected yet)

### 5e. Submit PR & Complete Approvals (Auto-Award)

1. Submit the Draft PR → status `"Pending"`, process linked
2. Complete all process step approvals (same as 4d-4f)
3. When the **last step is approved**, the backend auto-awards the tender:
   - Tender status → `"awarded"`
   - Winning offer → `"accepted"`, others → `"rejected"`
   - PR's `stuffStatus` → `"assigned"`, store/stuff linked
   - History shows `"tender_awarded"` entry
4. PR status → `"PendingFinalization"`

**Note:** If the OrgHead directly calls `finalize` and the tender is still `"closed"` (not yet auto-awarded), the `finalize` action handles the award automatically as part of winner selection.

---

## 6. Test the UnitHead Panel

**Login:** `reza@lesansatek.com` / `password123`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 6.1 | Login redirect | Lands on `/unit-head` dashboard |
| 6.2 | Dashboard uses **`dashboardStatistic`** (single call replaces 5 separate calls) | Shows: unit info, PR counts (draft/pending/approved/rejected/total), pending approval count, recent approvals. If Warehouse unit → receipt count. If Finance unit → budget stats + payment order counts + fiscal year info. |
| 6.3 | "درخواست‌های نیازمند تایید" → uses **`getPendingByUnit`** (not `stepApproval.gets`) | Returns full PR documents pending action for this unit — includes PRs where StepApproval record hasn't been created yet |
| 6.4 | PR detail page | Step approval panel, workflow visualizer, history timeline. Shows `selectionType` badge. If tender offer selected, shows offer details. |
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

**Login:** `maryam@lesansatek.com` / `password123` (Finance Employee, `canManageBudget` + `canIssuePaymentOrder`)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 8.1 | Login redirect | Lands on `/finance` dashboard |
| 8.2 | Dashboard KPIs | Total budget, remaining, pending payment orders, budget lines count, fiscal year info |
| 8.3 | Budget lines (`/finance/budget-lines`) | BUD-001 with allocation, remaining, color-coded |
| 8.4 | Budget line CRUD | Can create/edit/delete budget lines (with `canManageBudget` feature) |
| 8.5 | Budget allocations | Can create/remove allocations within a budget line |
| 8.6 | Fiscal year management | Can create, update, and close fiscal years |
| 8.7 | Payment orders (`/finance/payment-orders`) | PR #1 payment order, status=paid, amount. Filterable by `status: "sent_to_finance"` |
| 8.8 | Mark payment as paid | Click "پرداخت شد" → PaymentOrder status → "paid", budget line's `totalAllocated` deducted |
| 8.9 | Budget reports (`/finance/budget-reports`) | KPI summary + breakdown with utilization % |
| 8.10 | **Direct deduction** (`budgetLine.deductDirect`) | Non-PR expense: directly deduct from a budget line's `totalAllocated` with `canIssuePaymentOrder` |
| 8.11 | Empty states | Persian empty state when no data |
| 8.12 | **Access control** | Try `/admin` → redirect to `/finance` (no admin role) |

**Also test as Finance UnitHead:** Login as `fatemeh@lesansatek.com` / `password123`
- Same Finance dashboard but with UnitHead role scope
- Can manage budgets for the organization (UnitHead with Finance scope)
- Payment orders scoped to organization
- `dashboardStatistic` returns finance-specific stats (budgetLineCount, totalAllocated, totalSpent, pendingPaymentCount)

---

## 9. Test the Vendor / Store Head Panel

**Login:** `sara@lesansatek.com` / `password123`

Sara is the **vendor** (canRespondToTender), the **StoreHead** of فروشگاه نمونه (`scopeType: "store"`, `scopeId: {storeId}`), and has **Manager** role (`/admin` panel access). She also has `canAssignItemsToOrder` feature for inventory management.

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 9.1 | Login redirect | Lands on `/vendor` dashboard (default for her role set) |
| 9.2 | Dashboard KPIs | Open tenders, my offers, awarded count, win rate |
| 9.3 | Open tenders (`/vendor/tenders`) | DataTable with title, deadline, status; "ثبت پیشنهاد" for open |
| 9.4 | Submit offer form | Fields: `wareId` (required — specific ware being offered), price, delivery time, terms, notes. `storeId` auto-derived from `activeRole.scopeId` |
| 9.5 | My offers (`/vendor/my-offers`) | The submitted offer (2,500,000, 7 days, status=submitted) |
| 9.6 | Empty states | Persian empty state when no data |
| 9.7 | **Manager role** | Also has `/admin` panel access (PanelSelector shows مدیریت) |
| 9.8 | **Store management** | Can add/edit Stuff (store inventory) via admin panel or designated store UI |

### Adding Stuff to Store Manually

Sara (as store head with Manager role) can add inventory items to her store:

1. Login as `sara@lesansatek.com` / `password123`
2. Switch to **Admin panel** via PanelSelector (or navigate to store management page)
3. Go to stores section → find **فروشگاه نمونه**
4. Add new Stuff entry with:
   - Ware: کیت TSH زیشیمی
   - Price: 2,800,000 (absolute) or any valid price
   - Quantity: 50
   - Denormalized hierarchy: wareTypeId, wareClassId, wareGroupId, wareModelId, **wareId** (required)
5. **Or** use the Vendor panel's store inventory management feature to add new stock items
6. **Verify:** New Stuff record appears in the store's inventory list

---

## 10. Test the OrgHead Panel

**Login:** `dr.ahmadi@lesansatek.com` / `password123`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 10.1 | Login redirect | Lands on `/orghead` dashboard |
| 10.2 | Dashboard KPIs | Pending finalization count, completed PRs count, total PRs |
| 10.3 | **"در انتظار تأیید" tab** (`/orghead/requests?tab=pending`) | PRs in `PendingFinalization` status, sorted by oldest first |
| 10.4 | Click a PR → detail page | Shows all info: requester, requesting unit, ware model, budget line, selection type (stuff/tender/both), process steps, step approvals, history timeline, tenders, goods receipts, payment orders |
| 10.5 | Click **"تأیید نهایی"** (Finalize) | If only stuff exists → auto-finalizes. If both stuff+tender → modal with winner selection |
| 10.6 | Winner selection modal (both paths) | Two cards side-by-side: stuff option vs tender option. Pick one → sets `finalWinner` |
| 10.7 | Post-completion steps | Can add optional review steps: name + unit + description |
| 10.8 | After finalize | PR status → `"Completed"`, `finalizedAt` set. If tender was picked → auto-awarded. |
| 10.9 | **"تکمیل شده" tab** | Completed PRs with finalizedAt dates |
| 10.10 | **"همه درخواست‌ها" tab** | All PRs in the org across all statuses |
| 10.11 | Role guard | Try `/orghead` as non-OrgHead → redirect to default panel |

---

## 11. Test the Store Panel (StoreHead)

**Login:** `sara@lesansatek.com` / `password123`

Sara has a **StoreHead** role with `scopeType: "store"` and `scopeId: {storeId}` (فروشگاه نمونه). This gives her a dedicated `/store` panel for managing her store.

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 11.1 | Login redirect → `/store` dashboard (or via PanelSelector) | Lands on `/store` dashboard with store info and KPIs |
| 11.2 | Dashboard shows store overview | Store name (فروشگاه نمونه), address, contact, score, total sales |
| 11.3 | **Edit store info** – update name, address, contact, bank info | `store.update` succeeds (scope check: `_id` matches `activeRole.scopeId`) |
| 11.4 | **Cannot edit another store** – try to access a non-existent or different store ID | Backend returns "You cant do this" (scope mismatch) |
| 11.5 | **Cannot delete store** – delete button hidden or disabled | Remove restricted to Manager/Admin only |
| 11.6 | **View store inventory (Stuff list)** – list all Stuff items for this store | All stuff entries for فروشگاه نمونه visible (quantity, price, ware info). Uses `quantity` field (replaces old `inventoryNo`) |
| 11.7 | **Add Stuff to store** – add new inventory item to own store | `stuff.add` succeeds (scope check: `storeId` matches `activeRole.scopeId`). Requires `quantity`, `price`, `wareId`, hierarchy IDs |
| 11.8 | **Update Stuff** – edit price, quantity of own store's stuff | `stuff.update` succeeds (scope check: fetched `store._id` matches `activeRole.scopeId`) |
| 11.9 | **Remove Stuff** – delete own store's stuff | `stuff.remove` succeeds (scope check: fetched `store._id` matches `activeRole.scopeId`) |
| 11.10 | **Store settings** – manage delivery settings, working hours, status | Update pure fields works within scope |
| 11.11 | **Can also access `/admin`** via PanelSelector (has Manager role) | PanelSelector shows مدیریت and فروشگاه options |
| 11.12 | **View open tenders** – browse tenders with status `open` | `tender.gets` returns open tenders; StoreHead can view offers |
| 11.13 | **Submit tender offer** – submit a bid on an open tender | `tenderOffer.submit` succeeds (scope check: `storeId` matches `activeRole.scopeId`). **Requires `wareId`** (specific ware being offered) |
| 11.14 | **View PRs assigned to store** – list PRs where `store._id` matches own store | `purchasingRequest.gets` auto-filters by `store._id`; shows ALL PRs (not just Completed) |
| 11.15 | **Update stuff status flow** – progress fulfillment: assigned → ready_to_ship → shipped → delivered | Each `purchasingRequest.updateStuffStatus` call advances status. Confirmation dialog before each step. **No inventory changes on delivery** (goods receipt handles inventory) |
| 11.16 | **View submitted tender offers** – browse own offers | `tenderOffer.gets` auto-filters by `store._id`; StoreHead only sees their own store's offers |
| 11.17 | **Offer exists check** – visit tender page with existing offer | Shows "شما قبلاً پیشنهاد داده‌اید" with offer details instead of submit form |

### StoreHead Scope Rules

- **`store.update`**: Only if `_id` in request matches `activeRole.scopeId` (i.e., Sara can only edit her own store)
- **`store.updateRelations`**: Same scope rule as update
- **`store.get` / `store.gets`**: Any authenticated user, including StoreHead
- **`store.add`**: Allowed for StoreHead (creates a new store)
- **`store.remove` / `store.count`**: Manager/Admin only — StoreHead cannot delete
- **`stuff.add`**: Allowed for StoreHead; `storeId` must match `activeRole.scopeId`
- **`stuff.update`**: Allowed for StoreHead; the Stuff document's `store._id` must match `activeRole.scopeId`
- **`stuff.remove`**: Allowed for StoreHead; the Stuff document's `store._id` must match `activeRole.scopeId`
- **`stuff.gets`**: Allowed for StoreHead; auto-filtered by `store._id` = `activeRole.scopeId`
- **`tender.gets`**: Allowed for StoreHead; returns all tenders (no store filter)
- **`tenderOffer.submit`**: Allowed for StoreHead; `storeId` must match `activeRole.scopeId`. StoreHead does NOT need `canRespondToTender` feature flag.
- **`tenderOffer.gets`**: Allowed for StoreHead; auto-filtered by `store._id` = `activeRole.scopeId`
- **`purchasingRequest.gets`**: Allowed for StoreHead; auto-filtered by `store._id` = `activeRole.scopeId` (all statuses, not just Completed)
- **`purchasingRequest.updateStuffStatus`**: Allowed for StoreHead; the PR's `store._id` must match `activeRole.scopeId`

### PanelSelector Behavior for Sara

Sara has **3 roles** with different panels:
| Role | Panel | Access |
|------|-------|--------|
| Manager | `/admin` | Full admin panel |
| StoreHead | `/store` | Store management panel |
| Employee | `/employee` | PR submission panel |

The PanelSelector should show all 3 options for role switching.

---

## 12. Test Inventory & Stock Management

**Login as:** `admin@lesansatek.com`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 12.1 | **موجودی انبار** (Inventory list) | TSH Kit: qty=45 (after adjust), min=10, max=200, Shelf A-12 |
| 12.2 | Click inventory → adjust qty | Can update quantity |
| 12.3 | **حرکات انبار** (Stock Movements list) | Chronological list: addStock(50) → adjust(45) → consumption(-5) → goodsReceipt(+10) → transfer(-10) → consumption(-3) |
| 12.4 | Click any movement | Detail with balanceBefore, balanceAfter, reason, reference |
| 12.5 | **مصرف کالا** (Consumption Records) | 2 records: qty=5 (routine lab testing), qty=3 (quality control, linked to PR) |

---

## 13. Test Budget & Reporting

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 13.1 | Fiscal years list | "سال مالی 1405", open, active |
| 13.2 | Budget lines list | BUD-001 with allocations, spending, remaining |
| 13.3 | Click budget line | Detail: 100M allocated, encumbrances converted to spent, remaining |
| 13.4 | Budget report | Total allocated, spent, surplus/deficit, utilization % |
| 13.5 | Budget reports by fiscal year | Filter to 1405 → same data |

---

## 14. Test Process Builder & Archiving

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 14.1 | **Create process** | Form with name, description, optional scoping (unit / wareType / wareClass / wareGroup / wareModel) |
| 14.2 | **Create step** | Form with name, type, order, assignee groups (unit selector + AND/OR operator) |
| 14.3 | **Activate process** | Validates consecutive order, auto-increments version, status=Active |
| 14.4 | **Duplicate process** | Creates Draft copy with "(Copy)" suffix |
| 14.5 | **Archive process** | Set status=Archived on duplicate (no active PRs for that process) |
| 14.6 | **Archive guard** | Cannot archive a process with active PRs → error message |

---

## 15. Test Extended Features

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 15.1 | **getMe** | Any user, navigate to profile | Returns user profile with roles, features |
| 15.2 | **Store score update** | Admin → edit store | score=4.5, totalSoldAmount=15,000,000, totalSoldNum=5 |
| 15.3 | **Step approval gets** | UnitHead → PR detail → approvals tab | 3 approval records (one per step), with unit and step names |
| 15.4 | **Tender offer gets** | Vendor → my offers | Winning offer: 2,500,000, 7 days, store name |
| 15.5 | **Tag CRUD** | Admin → tags | Create فوری (#FF0000), create موقت (#00FF00), delete موقت |
| 15.6 | **Ware update relations** | Admin → ware detail → edit | Link/unlink manufacturer |
| 15.7 | **Consumption with PR** | Admin → consumption records | qty=3, "Quality control testing", linked to PR #1 |
| 15.8 | **Role update** | Admin → edit admin user | Manager role added alongside Ordinary |

---

## 16. Test Panel Switching & Role Routing

### 16a. Multi-Role Panel Switching

1. Login as **admin@lesansatek.com** — has Manager + Ordinary roles, all features
2. **PanelSelector** — in admin header, click the LayoutDashboard icon
3. **Verify:** Dropdown shows: مدیریت, پنل واحد, درخواست‌ها, مالی, فروشندگان, فروشگاه, مدیریت سازمان
4. Click **"پنل واحد"** → redirects to `/unit-head`
5. Header changes to simpler PanelLayout (no sidebar)
6. Click PanelSelector → switch back to **"مدیریت"** → back to `/admin`

### 16b. User Menu Panel Links

1. Click avatar → user menu opens
2. **Verify:** "پنل‌ها" section shows accessible panels
3. Click any panel → redirects

### 16c. Direct URL Access Control

| URL | Login as | Expected |
|-----|----------|----------|
| `/admin` | `reza@lesansatek.com` | Allowed (sidebar may be filtered) |
| `/unit-head` | `ali@lesansatek.com` | Redirect to default panel (`/requests`) |
| `/finance` | `ali@lesansatek.com` | Redirect to default panel |
| `/vendor` | `ali@lesansatek.com` | Redirect to default panel |
| `/store` | `ali@lesansatek.com` | Redirect to default panel |
| `/store` | `sara@lesansatek.com` | Allowed (StoreHead role) |
| `/orghead` | `dr.ahmadi@lesansatek.com` | Allowed (OrgHead role) |
| `/orghead` | `ali@lesansatek.com` | Redirect to default panel |
| `/admin` | unauthenticated | Redirect to `/login` |
| `/unit-head` | unauthenticated | Redirect to `/login` |

---

## 17. Test Edge Cases

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 16.1 | **Empty lists** | Visit panel with no data (e.g., no PRs for a new user) | Persian empty state with icon + description |
| 16.2 | **Loading skeletons** | Hard refresh any list page | Brief skeleton loaders, then data |
| 16.3 | **Form double-submit** | Click submit button rapidly | Button disabled after first click (Loader2 spinner) |
| 16.4 | **Invalid route** | Navigate to `/nonexistent` | Next.js 404 page |
| 16.5 | **Error boundary** | Invalid PR ID in URL | Error page with "تلاش مجدد" button |
| 16.6 | **RTL text** | Inspect any page | All text right-aligned, headings end with colon (:) |
| 16.7 | **RTL icons** | Check arrows, breadcrumbs | Arrows point right (← instead of →) |
| 16.8 | **Responsive — mobile** | Resize < 768px | Sidebar hidden, hamburger menu, DataTable → card view |
| 16.9 | **Responsive — tablet** | Resize 768-1024px | Layout adapts, grid columns reduce |
| 16.10 | **Concurrent approval** | Two tabs, same UnitHead, approve same PR | Second submission → appropriate error |
| 16.11 | **Backend down** | Stop Deno backend while using app | Error toasts, error boundaries catch failures |
| 16.12 | **PR with no auto-resolve** | Create unit with no matching process | Error: "No active process found for this organization" |
| 16.13 | **Rejection on any step** | UnitHead rejects a PR | Status=Rejected, workflow stops, all steps marked incomplete |
| 16.14 | **Tender before close** | Vendor tries to submit offer after deadline | Validation error |

---

## 18. Verification Checklist

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
- [ ] Employee creates Draft PR via `add` — no process, no pricing, no budget line
- [ ] `selectionType` = "none" after Draft creation
- [ ] UnitHead/Admin adds Stuff to Draft PR via `addStuff` → `selectionType` = "stuff", `stuffStatus` = "assigned"
- [ ] OR UnitHead creates tender on Draft PR, closes it, selects winning offer via `selectTenderOffer` → `selectionType` = "tender"
- [ ] **Cannot submit without a selection** — error: "لطفاً ابتدا کالا تخصیص دهید یا از طریق مناقصه پیشنهاد انتخاب کنید"
- [ ] Submit Draft PR (Draft → Pending) — process auto-resolves
- [ ] UnitHead sees pending PRs via `getPendingByUnit` (new action)
- [ ] Step approval panel with comment + approve/reject
- [ ] Approve advances to next step
- [ ] Reject changes PR status to "رد شده"
- [ ] Finance step approval requires budget line — auto-creates BudgetEncumbrance
- [ ] All steps approved → "در انتظار نهایی‌سازی" (PendingFinalization)
- [ ] OrgHead finalizes (if both stuff+tender exist, must pick winner) → "تکمیل شده" (Completed)
- [ ] `stuffStatus` automatically set to "assigned" on finalize (or auto-awarded for tender)
- [ ] StoreHead progresses delivery: assigned → ready_to_ship → shipped → delivered
- [ ] Requester/Warehouse Head creates goods receipt → `stuffStatus` = "received", auto-creates PaymentOrder
- [ ] OrgHead sends PaymentOrder to Finance → Finance UnitHead marks paid → budget deducted
- [ ] History timeline captures: created, submitted, step_approved/rejected, stuff_assigned, stuff_status_updated, goods_received, tender_created, tender_offer_selected, tender_awarded, finalized
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
- [ ] Mark paid deducts `totalAllocated` from budget line
- [ ] `remainingBudget` recalculated after payment deduction
- [ ] Finance unit step approval requires budget line ID + budget sufficiency check
- [ ] Budget report shows summaries

### Finalization (OrgHead)
- [ ] PR goes to "در انتظار نهایی‌سازی" after all steps approved
- [ ] Only Manager/Admin/OrgHead can access the finalize action
- [ ] Finalize sets Completed + finalizedAt timestamp
- [ ] History shows "finalized" entry

### Store Panel (StoreHead)
- [ ] StoreHead can view their store dashboard (`/store`)
- [ ] StoreHead can edit their own store (name, address, contact, bank info, delivery settings)
- [ ] StoreHead cannot edit another store (scope check returns "You cant do this")
- [ ] StoreHead cannot delete their store
- [ ] StoreHead can view store inventory (Stuff list) — auto-filtered by their store
- [ ] StoreHead can add new Stuff to their store (`storeId` validated against `activeRole.scopeId`)
- [ ] StoreHead can update existing Stuff in their store (scope check on stuff's `store._id`)
- [ ] StoreHead can delete Stuff from their store (scope check on stuff's `store._id`)
- [ ] StoreHead can view open tenders and browse them
- [ ] StoreHead can submit a tender offer for their store (`storeId` validated against `activeRole.scopeId`)
- [ ] StoreHead can view offers submitted by their store
- [ ] StoreHead can view PRs assigned to their store — auto-filtered by `store._id`
- [ ] StoreHead can update `stuffStatus` on PRs assigned to their store (ready_to_ship → shipped → delivered)
- [ ] PanelSelector shows فروشگاه option for StoreHead users

### Panel Layouts
- [ ] Admin: sidebar + header + PanelSelector
- [ ] UnitHead: PanelLayout (simple header)
- [ ] Employee: PanelLayout (simple header)
- [ ] Finance: PanelLayout (simple header)
- [ ] Vendor: PanelLayout (simple header)
- [ ] Store: PanelLayout (simple header)

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

## 19. Standard Workflow Examples

### 19a. Organization & User Quick Reference

| User | Login | Panel(s) | Can Submit PR | Can Approve Steps |
|------|-------|----------|--------------|-------------------|
| **Admin System** | admin@lesansatek.com / password123 | `/admin` or `/employee` | ✓ (Employee role) | ✓ (Manager role) |
| **علی محمدی** (prodHead) | ali@lesansatek.com / password123 | `/admin` | ✓ (Employee role) | ✓ (Manager role) |
| **رضا احمدی** (unitheadUser) | reza@lesansatek.com / password123 | `/unit-head` | ✓ (Employee role) | ✓ (UnitHead role) |
| **حسین کاظمی** (warehouseHead) | hossein@lesansatek.com / password123 | `/unit-head` | ✓ (Employee role) | ✓ (UnitHead role) |
| **فاطمه موسوی** (finHead) | fatemeh@lesansatek.com / password123 | `/unit-head` | ✓ (Employee role) | ✓ (UnitHead role) |
| **مریم حسینی** (financeUser) | maryam@lesansatek.com / password123 | `/finance` | ✓ (Employee role) | ✗ (Ordinary) |
| **سارا کریمی** (vendorUser) | sara@lesansatek.com / password123 | `/vendor`, `/admin`, or `/store` | ✓ (Employee/Manager role) | ✓ (Manager role) |
| **دکتر احمدی** (orgHeadUser) | dr.ahmadi@lesansatek.com / password123 | `/orghead` | ✓ (Employee role) | ✓ (OrgHead role) |

**All unit heads** (علی محمدی through فاطمه موسوی) work via `/admin` panel — they have Manager role.  
**UnitHead users** (رضا احمدی, حسین کاظمی, فاطمه موسوی) work via `/unit-head` panel — they see only their unit's data. This is the most common approval panel.  
**StoreHead user** (سارا کریمی) works via `/store` panel — manages فروشگاه نمونه with StoreHead role.

---

### 19b. Simple Workflow (1-Step: Finance Unit)

**Objective:** Single-step approval flow with one submitter and one approver.

| Detail | Value |
|--------|-------|
| **Process** | Process #4 — فرآیند خرید واحد مالی (unit-scoped to Finance Unit) |
| **Submitter** | **فاطمه موسوی** — fatemeh@lesansatek.com — UnitHead of Finance |
| **Step 1** | تأیید مالی → assigned to Finance Unit |
| **Approver** | Any user with a role at Finance Unit: **Admin System** works best (Manager role) |
| **Comment** | "تأیید شد" or leave blank |

#### Step-by-Step Frontend Walkthrough

**Phase 1 — Create Draft PR (as Submitter)**
1. **Login** as فاطمه موسوی (fatemeh@lesansatek.com / password123)
   - If using `/unit-head` panel → you'll see Finance Unit data only
   - If using `/employee` panel → generic employee view
2. Navigate to **"ایجاد پیش‌نویس درخواست خرید"** (New Draft Purchase Request)
3. Fill in the form:
   - **عنوان (Title):** "تجهیزات آزمایشگاه هماتولوژی"
   - **توضیحات (Description):** "درخواست خرید کیت TSH برای آزمایشگاه"
   - **مدل کالا (Ware Model):** select "کیت TSH" (the ware model from seed data)
   - **تعداد (Quantity):** `5`
   - **No `estimatedAmount`, `budgetLineId`, or `requestingUnit`** — auto-derived or set later
4. Click **"ثبت پیش‌نویس"** (Create Draft)
5. ✅ PR status: **"Draft" (پیش‌نویس)**, `selectionType` = "none", no process linked

**Phase 2 — Assign Stuff & Submit**
1. From the Draft PR detail, click **"تخصیص کالا"** (Add Stuff) → select TSH Kit stuff
2. ✅ `selectionType` → `"stuff"`, `stuffStatus` → `"assigned"`
3. Click **"ارسال درخواست"** (Submit Request)
4. ✅ The process auto-resolves to **Process #4** (1 step: تأیید مالی)
5. PR status → **"در انتظار تایید"** (Pending)
6. Note the PR number/ID for approval step

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

### 19c. Complex Workflow (3-Step: Procurement → Warehouse → Finance)

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

**Phase 1a — Create Draft PR (as رضا احمدی)**
1. **Login** as **رضا احمدی** (reza@lesansatek.com / password123) via `/unit-head` panel
2. Navigate to **"ایجاد پیش‌نویس درخواست خرید"**
3. Fill in:
   - **عنوان:** "کیت آزمایشگاهی — خرید عمده"
   - **توضیحات:** "خرید ۱۰ عدد کیت TSH برای آزمایشگاه هماتولوژی"
   - **مدل کالا:** "کیت TSH"
   - **تعداد:** `10`
   - **No `estimatedAmount`, `budgetLineId`, `storeId`** — these are set later
   - **No `requestingUnit`** — auto-derived from active role scope
4. Click **"ثبت پیش‌نویس"**
5. ✅ PR status: **"Draft" (پیش‌نویس)**
6. The PR has no process linked yet, `selectionType` = "none"

**Phase 1b — Add Stuff to Draft PR**
1. From the Draft PR detail, click **"تخصیص کالا"**
2. Browse available Stuff records → select the TSH Kit stuff
3. ✅ `selectionType` → `"stuff"`, `stuffStatus` → `"assigned"`, `estimatedAmount` set

**Phase 1c — Submit the PR**
1. Click **"ارسال درخواست"**
2. ✅ PR status: **"در انتظار تایید" (Pending)**
3. The process auto-resolves to **Process #2** (3 steps)

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

**Phase 4 — Approve Step 3 (تأیید مالی) with Budget Line**
1. **Logout** and **Login** as **فاطمه موسوی** (fatemeh@lesansatek.com / password123) via `/unit-head` panel
2. She is UnitHead of Finance Unit
3. Go to **"درخواست‌های خرید"** list
4. Find the PR — **Step 3** is now active
5. Select a budget line (e.g. BUD-001) from the budget line picker
6. Click **"تأیید"**
   - **توضیحات:** "بودجه کافی است. تأیید نهایی."
7. ✅ PR status: **"در انتظار نهایی‌سازی"** (PendingFinalization)

**Phase 4b — OrgHead Finalizes the PR**
1. **Logout** and **Login** as **دکتر احمدی** (dr.ahmadi@lesansatek.com / password123) or Admin via `/admin` panel
2. Find the PR — status is "در انتظار نهایی‌سازی"
3. Click **"نهایی‌سازی"** (Finalize)
4. ✅ PR status: **"تکمیل شده"** (Completed)

---

### 19d. Alternative Workflow: Direct Store Purchase

**Objective:** After the 3-step approval above, test store assignment (via `addStuff`), goods receipt, and payment.

| Step | Action | User | Login |
|------|--------|------|-------|
| 1 | Add Stuff to Draft PR | Admin | admin@lesansatek.com |
| 2 | Submit & complete approvals | Admin | admin@lesansatek.com |
| 3 | StoreHead delivers | سارا کریمی | sara@lesansatek.com |
| 4 | Record Goods Receipt | Admin | admin@lesansatek.com |
| 5 | Payment | دکتر احمدی → فاطمه موسوی | dr.ahmadi@lesansatek.com → fatemeh@lesansatek.com |

**Frontend flow:**
1. After Draft PR is created, click **"تخصیص کالا"** (Add Stuff) → select the stuff item from store's inventory
   - Store identity is **NOT shown** to the assigning user — only product name, brand, price
2. PR's `selectionType` → `"stuff"`, `stuffStatus` → `"assigned"`, `estimatedAmount` updated with pricing
3. Submit the Draft PR (Draft → Pending), complete all step approvals
4. OrgHead finalizes (PendingFinalization → Completed)
5. StoreHead progresses delivery: assigned → ready_to_ship → shipped → delivered
6. Click **"دریافت کالا"** (Goods Receipt) → fill in receipt details, items WITHOUT `purchaseOrderItemId`
   - **Authority:** Only the PR's requester or a Warehouse-type unit head can confirm delivery
7. System auto-creates a draft PaymentOrder
8. OrgHead sets PaymentOrder status → `"sent_to_finance"`
9. Finance UnitHead clicks **"پرداخت شد"** (Mark Paid) → budget line's `totalAllocated` deducted

### 19e. Workflow: Tender / Vendor Selection (Deferred Award)

**Objective:** PR that goes through tender/auction with **deferred award** — the winner is selected before submission, but the actual award happens when the last approval step completes.

| Step | Action | User | Login |
|------|--------|------|-------|
| 1 | Create Draft PR | رضا احمدی | reza@lesansatek.com |
| 2 | Create Tender (on Draft) | Admin | admin@lesansatek.com |
| 3 | Assign Vendor | Admin | admin@lesansatek.com |
| 4 | Submit Offer (with wareId) | سارا کریمی | sara@lesansatek.com |
| 5 | Close Tender | Admin | admin@lesansatek.com |
| 6 | **Select Winner** (selectTenderOffer) | Admin | admin@lesansatek.com |
| 7 | Submit PR | رضا احمدی | reza@lesansatek.com |
| 8 | Complete step approvals | Various | — |
| 9 | **Auto-award** on final approval | Backend | — |

**Frontend flow (from Procurement perspective):**
1. رضا احمدی creates a **Draft** PR (requesting from Procurement Unit)
2. Admin creates a Tender linked to this Draft PR, sets deadline
3. Admin assigns vendors to the tender
4. سارا کریمی logs into `/vendor` panel, sees the tender, submits an offer (price, delivery time, **wareId**)
5. Admin closes the tender (no more offers accepted)
6. Admin **selects the winning offer** via `purchasingRequest.selectTenderOffer` (NOT `tender.award`)
   - `selectionType` → `"tender"`, tender stays `"closed"`
7. رضا احمدی submits the Draft PR (Draft → Pending, process linked)
8. Step approvals begin — after last step approval, the backend **auto-awards**:
   - Tender → `"awarded"`, winning offer → `"accepted"`, others → `"rejected"`
   - PR's `stuffStatus` → `"assigned"`, store+stuff linked, pricing recorded
9. PR can proceed to PendingFinalization → OrgHead finalizes → delivery → goods receipt → payment

---

### 19f. Role Switching Reference

| Action | Allowed Roles | Which Role to Use | Admin's Available RoleId |
|--------|--------------|-------------------|--------------------------|
| `purchasingRequest.add` | `Manager`, `Admin`, `OrgHead`, `UnitHead`, `Employee` (with `canRegisterPurchaseRequest`) | **Employee** | `{employeeRoleId}` |
| `purchasingRequest.submit` | `Manager`, `Admin`, `OrgHead`, `UnitHead`, `Employee` (with `canSubmitPurchaseRequest`) | **Employee** (all users have it) | `{employeeRoleId}` |
| `stepApproval.submitDecision` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **Manager** (org-wide) or **UnitHead** (scoped) | `{managerRoleId}` or `{adminUnitHeadProcRoleId}` / `{adminUnitHeadWhRoleId}` / `{adminUnitHeadFinRoleId}` |
| `stepApproval.submitDecision` (Finance step) | `Manager`, `Admin`, `OrgHead`, `UnitHead` | Must provide `budgetLineId` when the unit type is `Finance`; system validates `remainingBudget >= estimatedTotal`. Auto-creates BudgetEncumbrance. | Any role with access + a valid budget line ID |
| `purchasingRequest.finalize` | `Manager`, `Admin`, `OrgHead` | **OrgHead** (org-level) or **Manager**. Handles winner selection if both stuff+tender exist. Optional `budgetLineId` override. | `{orgHeadRoleId}` or `{managerRoleId}` |
| `purchasingRequest.addStuff` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **UnitHead** (during Draft/Pending/InProgress). Sets `selectionType: "stuff"`. | `{managerRoleId}` or any unit head role |
| `purchasingRequest.selectTenderOffer` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **UnitHead** on closed tenders (Draft/Pending/InProgress). Sets `selectionType: "tender"`. Does NOT award yet. | `{managerRoleId}` or unit-specific |
| `purchasingRequest.removeTenderSelection` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **UnitHead** - clears tender offer selection | `{managerRoleId}` or unit-specific |
| `purchasingRequest.updateStuffStatus` | `Manager`, `Admin`, `StoreHead` (scoped) | **StoreHead** (own store's PRs only). Progresses: assigned → ready_to_ship → shipped → delivered. | `{storeHeadRoleId}` |
| `purchasingRequest.getPendingByUnit` | `Manager`, `Admin`, `UnitHead` | **UnitHead** (unit derived from activeRole). Returns full PR docs pending unit approval. | Any unit head role |
| `user.dashboardStatistic` | `Manager`, `Admin`, `UnitHead`, `OrgHead` | **UnitHead** (scope from role). Single call returns all dashboard KPIs. | Any |
| `goodsReceipt.add` | `Manager`, `Admin`, `OrgHead`, `UnitHead` | **Requester or Warehouse Head** (authority check). Auto-creates draft PaymentOrder. | `{managerRoleId}` |
| `paymentOrder.markPaid` | `Manager`, `Admin`, `OrgHead`, `UnitHead` (with `canIssuePaymentOrder`) | **Finance UnitHead** or **Manager**. Deducts budget line's `totalAllocated`. | `{managerRoleId}` or `{adminUnitHeadFinRoleId}` |
| `paymentOrder.update` | `Manager`, `Admin`, `OrgHead`, `UnitHead` (with `canIssuePaymentOrder`) | **OrgHead** (to send to finance) or **Finance UnitHead** | `{orgHeadRoleId}` or unit-specific |
| `stuff.add` | `Manager`, `Admin`, `StoreHead` (scoped) | **Manager** (any store) or **StoreHead** (own store only) | `{managerRoleId}` or `{storeHeadRoleId}` |
| `stuff.update` | `Manager`, `Admin`, `StoreHead` (scoped) | **Manager** (any store) or **StoreHead** (own store only) | `{managerRoleId}` or `{storeHeadRoleId}` |
| `stuff.remove` | `Manager`, `Admin`, `StoreHead` (scoped) | **Manager** (any store) or **StoreHead** (own store only) | `{managerRoleId}` or `{storeHeadRoleId}` |
| `stuff.gets` | `Manager`, `Admin`, `StoreHead` (scoped filter) | **StoreHead** (auto-filtered) | `{storeHeadRoleId}` |
| `store.add` | `Manager`, `Admin`, `StoreHead` | **Manager** or **StoreHead** | `{managerRoleId}` or `{storeHeadRoleId}` |
| `store.update` | `Manager`, `Admin`, `StoreHead` (scoped) | **Manager** (any store) or **StoreHead** (own store only) | `{managerRoleId}` or `{storeHeadRoleId}` |
| `store.updateRelations` | `Manager`, `Admin`, `StoreHead` (scoped) | **Manager** (any store) or **StoreHead** (own store only) | `{managerRoleId}` or `{storeHeadRoleId}` |
| `tender.gets` | `Manager`, `Admin`, `StoreHead` | **StoreHead** | `{storeHeadRoleId}` |
| `tenderOffer.submit` | `Manager`, `Admin`, `StoreHead` (scoped) | **StoreHead** (own store only, no feature flag needed) | `{storeHeadRoleId}` |
| `tenderOffer.gets` | `Manager`, `Admin`, `StoreHead` (scoped filter) | **StoreHead** (auto-filtered) | `{storeHeadRoleId}` |
| `purchasingRequest.gets` | `Manager`, `Admin`, `OrgHead`, `UnitHead`, `Employee`, `StoreHead` (scoped filter) | **StoreHead** (auto-filtered by store, all statuses). **OrgHead** (auto-filtered by org). | `{storeHeadRoleId}` or `{orgHeadRoleId}` |
| `budgetLine.deductDirect` | `Manager`, `Admin`, `OrgHead`, `UnitHead` (with `canIssuePaymentOrder`) | **Finance UnitHead** (non-PR expense deduction) | `{adminUnitHeadFinRoleId}` |
| `budgetLine.*` (CRUD) | `Manager`, `Admin`, `OrgHead`, `UnitHead` (with `canManageBudget`) | **Finance UnitHead** (budget line management) | `{adminUnitHeadFinRoleId}` |
| `budgetAllocation.*` (CRUD) | `Manager`, `Admin`, `OrgHead`, `UnitHead` (with `canManageBudget`) | **Finance UnitHead** | `{adminUnitHeadFinRoleId}` |
| `fiscalYear.*` (CRUD) | `Manager`, `Admin`, `OrgHead`, `UnitHead` (with `canManageBudget`) | **Finance UnitHead** | `{adminUnitHeadFinRoleId}` |

**Key rule:** submit → **Employee** role; approval/CRUD → **Manager** (for org-wide) or **UnitHead** (for unit-specific); store management → **StoreHead** (own store only).

**Admin's full role set:**
- `{roleId}` → Ordinary (default, not used for submit/approve)
- `{managerRoleId}` → Manager (org-wide, for all approvals)
- `{employeeRoleId}` → Employee (for PR submit)
- `{adminUnitHeadProcRoleId}` → UnitHead at Procurement Unit
- `{adminUnitHeadWhRoleId}` → UnitHead at Central Warehouse
- `{adminUnitHeadFinRoleId}` → UnitHead at Finance Unit

**سارا کریمی's (Store Head) role set:**
- She has **Manager** role (added at user creation) → can access `/admin` panel and call `purchasingRequest.addStuff`, etc.
- She has **StoreHead** role with `scopeType: "store"` and `scopeId: {storeId}` → can access `/store` panel and manage فروشگاه نمونه:
  - `stuff.add` / `stuff.update` / `stuff.remove` (scoped to own store)
  - `stuff.gets` (auto-filtered to own store)
  - `tender.gets` / `tenderOffer.submit` / `tenderOffer.gets`
  - `purchasingRequest.gets` (auto-filtered by store)
  - `purchasingRequest.updateStuffStatus`
- She has **Ordinary** + **Employee** roles → can submit PRs and view the employee panel
- She has `canRespondToTender` → can submit tender offers via `/vendor` panel
- She has `canAssignItemsToOrder` → can assign store inventory to purchase requests

### 19g. Troubleshooting Common Issues

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| "You cant do this" | `activeRoleId` resolves to `Ordinary` role, or role has no `roleId` UUID | Use Employee/Manager/UnitHead roleId; re-run `gen-update-admin-roles` to regenerate roles with proper UUIDs |
| "Your active role does not have an associated unit" | User's active role has no unit `scopeId` | Select a role with `scopeType: "unit"` (e.g. UnitHead or scoped Employee) |
| "Could not determine organization" | User has no organizations or missing org relation | Ensure user belongs to an organization via `addOrRemoveRoles` |
| "Please assign stuff or select a tender offer before submitting this request" | `selectionType` is `"none"` when calling `submit` | Call `addStuff` or `selectTenderOffer` first to set `selectionType` |
| "This purchasing request already has an active tender" | Tender already exists on this PR with status `open`/`closed` | Close/cancel existing tender before creating a new one, or remove tender selection |
| "Can only select a tender offer for a Draft, Pending, or InProgress request" | PR is already Completed/Rejected/Cancelled | Only open PRs can accept tender offer selections |
| "Tender must be closed before selecting a winner" | Tender is still `open` — bids are still being accepted | Call `tender.close` first, then `selectTenderOffer` |
| "Only submitted offers can be selected" | Offer status is not `"submitted"` (already accepted/rejected) | Check offer status — only submitted offers are eligible |
| PR stuck on step 1 | No StepApproval created for the unit | Check process step assigneeGroups — units must match the requesting unit's process |
| Goods Receipt fails | PR not completed or stuff not assigned | Ensure PR status is Completed and `stuffStatus` is `"delivered"` |
| "Stuff not found" | `addStuff` called with invalid `stuffId` | Verify the stuff document exists for the given wareModel and store |
| "Budget line is required when approving from a finance unit" | Step approval for a Finance-type unit without providing `budgetLineId` | Pass a valid budget line ID with sufficient `remainingBudget` |
| "Insufficient budget: remaining is less than required" | The budget line's `remainingBudget` is less than `estimatedTotal` (unitPrice × quantity) | Choose a different budget line or increase allocation |
| "Only the requester, the requesting unit head, or the central warehouse head can confirm goods delivery" | A user who is neither the PR requester, the requesting unit's head, nor a Warehouse head tries to create a goods receipt | Ensure the logged-in user is the PR requester, the requesting unit's head, or heads a Warehouse-type unit |
| "Purchasing request has no requesting unit to receive goods into" | The PR has no `requestingUnit` to route the received goods into | Ensure the PR has a requesting unit |
| PR stuck at PendingFinalization | All steps approved but no OrgHead/Manager has finalized | Call `purchasingRequest.finalize` as Manager/Admin/OrgHead |
| "You can only add items to your own store" | StoreHead calls `stuff.add` with `storeId` not matching their scope | Use `activeRole.scopeId` as `storeId` |
| "Invalid stuffStatus" | Called `updateStuffStatus` with wrong enum value | Use one of: assigned, ready_to_ship, shipped, delivered |
| "Can only add stuff to a Draft or active purchasing request" | Called `addStuff` on a non-Draft/non-active PR | Only Draft, Pending, or InProgress PRs can accept stuff assignments |

---

## 20. Appendix — Complete Test Data Reference

This appendix provides the full field-level reference for all test data created by the `e2e.json` suite. Use it when verifying data in the frontend UI.

### 20a. User Info

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
| 12 | `{vendorUserId}` | سارا کریمی | sara@lesansatek.com | password123 | 09120000003 | Female | **Manager** + **StoreHead** (scope: فروشگاه نمونه) + Ordinary + Employee + `canRespondToTender` + `canAssignItemsToOrder` | ✓ (Employee) or ✓ (Manager) | فروشگاه نمونه (store head via StoreHead role) | `/vendor`, `/admin` (Manager), `/store` (StoreHead) |

**Notes:**
- Every user now has the **`Employee` role** as their secondary role, which is allowed by `grantAccess` for `purchasingRequest.submit`. Use `activeRoleId: {employeeRoleId}` (or each user's own Employee roleId) when submitting PRs.
- Users 2–7 (unit heads) have `isActive: true`, `is_verified: true`, `organization: {orgId}`.
- User 1 starts with a single role added at tempUser creation (`roles: [{name: "Ordinary"}]`). The `gen-update-admin-roles` entry appends `{name: "Manager"}` and `{name: "Employee"}` so the admin can use `/admin` and submit PRs via the employee panel.
- Users 8–10 are scoped UnitHeads — they manage a specific unit and see only that unit's data in their panels. They can also submit PRs using their Employee role.
- Users 11–12 are feature-gated Ordinary users — they can now also submit PRs because `Employee` is in their roles.
- User 12 (سارا کریمی) also has **StoreHead** role with `scopeType: "store"` and `scopeId: {storeId}` — this gives her the `/store` panel for managing فروشگاه نمونه.
- **Role switching pattern:** `submit` → `Employee` role, `approve` → `Manager`/`UnitHead` role, `store management` → `StoreHead` role.

---

### 20b. Geographic Data

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

### 20c. Organizational Structure

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
| **Finance Unit** | واحد مالی | Finance Unit | Financial management unit | Finance | — |
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

#### Store Head Mapping

| Store | `name` | Head User | Head Captured ID | Role |
|-------|--------|-----------|------------------|------|
| Sample Store | فروشگاه نمونه | سارا کریمی | `{vendorUserId}` | `StoreHead` (scope: فروشگاه نمونه) |

---

### 20d. Product Hierarchy

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

### 20e. Store & Stuff

#### Store

| Field | Value |
|-------|-------|
| `name` | فروشگاه نمونه |
| `address` | Tehran, Iran |
| `economicCode` | 123456789 |
| `postalCode` | 1234567890 |

**Relations:** `cityId`, `stateId`, `storeHeadId` → **سارا کریمی** (`{vendorUserId}`)

#### Stuff (Store Inventory)

| Field | Value |
|-------|-------|
| `quantity` | 50 (replaces old `inventoryNo`) |
| `price` | 2,800,000 |
| `hasAbsolutePrice` | true |
| `pricePercentage` | null (not used when `hasAbsolutePrice` is true) |

**Denormalized relations:** `wareId`, `storeId`, `wareTypeId`, `wareClassId`, `wareGroupId`, `wareModelId`

Pricing: **Absolute** (not percentage) — `hasAbsolutePrice: true`, actual price = 2,800,000.  
If `hasAbsolutePrice = false`, price would be computed as `Ware.price * (1 + pricePercentage/100)`.

---

### 20f. Process & Steps — 8 Scoped Processes

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

### 20g. Tag

| Field | Value |
|-------|-------|
| `name` | فوری |
| `color` | #FF0000 |
| `description` | Urgent items |

---

### 20h. Budget

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

### 20i. Purchasing Requests

**New/Changed Model Fields:**
- `selectionType`: `"none"` | `"stuff"` | `"tender"` — tracks whether user has assigned stuff or selected tender offer
- `selectedTenderOfferId`: string (ObjectId, optional) — set when `selectionType === "tender"`
- `finalizedAt`: date (optional) — set when OrgHead calls `finalize()`
- `postCompletionSteps`: array (optional) — post-finalization quality review steps added by OrgHead
- `stuffStatus`: `"none"` | `"assigned"` | `"ready_to_ship"` | `"shipped"` | `"delivered"` | `"received"` | `"cancelled"`

**PR Status Lifecycle (Updated):**
```
Draft → (submit) → Pending → (step approvals) → InProgress → (last step approved) → PendingFinalization
  ↑                                                                                          ↓
  └── (cancelled) ←── Rejected ←────────────────────────────────────────────────────────┘  OrgHead finalize()
                                                                                             ↓
                                                                                        Completed
```

- **Draft**: Initial state after `add`. No process linked. `addStuff`/`selectTenderOffer`/`tender.add` all allowed
- **Pending**: After `submit`. Process linked, step approvals created
- **PendingFinalization**: All steps approved. OrgHead must review and finalize
- **Completed**: Finalized by OrgHead. `stuffStatus = "assigned"`. Proceeds to delivery/goods receipt/payment

#### PR #1 — Direct Store Purchase (New Flow)

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH |
| `description` | Urgent request for TSH kits |
| `estimatedAmount` | 50,000,000 |
| `quantity` | 10 |

**Relations (no processId — auto-resolved):** `wareModelId`, `requestingUnitId` → Procurement Unit

**Flow:** Draft → `addStuff` (selectionType="stuff") → Submit → Step 1 → Step 2 → Step 3 (Finance approves with budgetLineId, auto-encumbrance) → PendingFinalization → OrgHead finalizes → Completed → StoreHead delivers (assigned→ready_to_ship→shipped→delivered) → Goods Receipt → Auto Payment

#### PR #2 — Tender-Based Purchase (New Flow)

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH - مناقصه |
| `description` | Tender-based procurement |
| `quantity` | 20 |

**Flow:** Draft → `tender.add` → `tender.close` → `selectTenderOffer` (selectionType="tender") → Submit → Step approvals → Last step approved → Auto-awards tender → PendingFinalization → OrgHead finalize → Completed

#### PR #3 — Pending (for approval flow test)

| Field | Value |
|-------|-------|
| `title` | خرید کیت TSH - در انتظار |
| `description` | Pending PR for approval flow test |
| `estimatedAmount` | 25,000,000 |
| `quantity` | 5 |

**Stays in `Pending` status** — no decisions submitted.

---

### 20j. Tender

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

### 20k. Goods Receipt

| Field | Value |
|-------|-------|
| `receiptNumber` | GR-001 |
| `description` | First goods receipt |
| `receivedAt` | 2026-04-01 |
| `items` | `[{wareModelId, wareModelName, wareId, wareName, quantityReceived: 10, quantityAccepted: 10, quantityRejected: 0, batchNo, expirationDate}]` |

**Relations:** `purchasingRequestId` → PR #1, `receivedById` → user (must be the PR requester, the requesting unit head, or a Warehouse unit head), `receivingUnitId` → derived from identity (warehouse head → warehouse; otherwise → requesting unit)  
**Pricing:** Reads `estimatedAmount` from PR (prorated by accepted qty). No `purchaseOrderItemId` needed — `PurchaseOrderItem` model was deleted. `payTo` resolved from PR's `store` relation.  
**Authority:** The PR requester, the requesting unit head, or a Warehouse-type unit head can confirm delivery; `receivingUnitId` is derived from identity.

---

### 20l. Inventory & Stock

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

### 20m. Role Management (Frontend Panel Users)

> **Roles are ONLY managed via `addOrRemoveRoles`** — `addUser` no longer accepts a `roles` field. All users are created with a default `[{name: "Ordinary"}]` role, and their full role set is applied via `addOrRemoveRoles` calls.
>
> **Key model changes:**
> - `user.organization` (single relation) → `user.organizations` (multiple relation, array)
> - `user.headedUnit` / `user.headedOrganization` — **removed**. To find headed units: parse `user.roles` for `UnitHead` entries or query `unit.gets` with `{ "head._id": userId }`
> - **Two-step unit head assignment:** `unit.updateRelations` sets the head relation, then `user.addOrRemoveRoles` adds the `UnitHead` role + syncs `user.units`
> - **OrgHead role:** `scopeType: "organization"`, `scopeId: <orgId>`
> - **StoreHead role:** `scopeType: "store"`, `scopeId: <storeId>`

| # | ID | Purpose | Captures |
|---|-----|---------|----------|
| 51 | `gen-update-admin-roles` | Adds `Manager`, scoped `Employee`, and scoped `UnitHead`×3 roles to admin for `/admin` panel | — |
| 52 | `gen-unithead-user` | Creates **رضا احمدی** (`reza@lesansatek.com` / `password123`) | `{unitheadUserId}` |
| 53 | `gen-finance-user` | Creates **مریم حسینی** (`maryam@lesansatek.com` / `password123`) with `canManageBudget` + `canIssuePaymentOrder` + `canViewBudgetReports` features | `{financeUserId}` |
| 54 | `gen-vendor-user` | Creates **سارا کریمی** (`sara@lesansatek.com` / `password123`) with `canRespondToTender` + `canAssignItemsToOrder` features. Also serves as **store head** of فروشگاه نمونه. | `{vendorUserId}` |
| 55 | `gen-roles-sara` | Adds `Manager` + scoped `Employee` (Procurement unit) to سارا کریمی | — |
| 56 | `gen-roles-sara-storehead` | Adds **StoreHead** role (`scopeType: "store"`, `scopeId: {storeId}`) to سارا کریمی for managing فروشگاه نمونه | `{storeHeadRoleId}` |
| 57 | `gen-roles-ali` | Adds `Manager` + scoped `Employee` (Production) + `UnitHead` (Production, QA) to علی محمدی | — |
| 58 | `gen-roles-mohammad` | Adds `Manager` + scoped `Employee` (Logistics) + `UnitHead` (Logistics, Internal Procurement) to محمد رضایی | — |
| 59 | `gen-roles-zahra` | Adds `Manager` + scoped `Employee` (IT) + `UnitHead` (IT, Technical Support) to زهرا احمدی | — |
| 60 | `gen-roles-narges` | Adds `Manager` + scoped `Employee` (HR) + `UnitHead` (HR) to نرگس کریمی | — |
| 61 | `gen-roles-farhad` | Adds `Manager` + scoped `Employee` (Legal) + `UnitHead` (Legal) to فرهاد نوروزی | — |
| 62 | `gen-roles-parisa` | Adds `Manager` + scoped `Employee` (R&D) + `UnitHead` (R&D) to پریسا صادقی | — |
| 63 | `gen-roles-reza` | Adds `UnitHead` (Procurement) + scoped `Employee` (Procurement) + `UnitHead` (Hematology/Micro/Pathology labs) to رضا احمدی | — |
| 64 | `gen-roles-hossein` | Adds `UnitHead` (Warehouse) + scoped `Employee` (Warehouse) + `UnitHead` (Cold Storage) to حسین کاظمی | — |
| 65 | `gen-roles-fatemeh` | Adds `UnitHead` (Finance) + scoped `Employee` (Finance) + `UnitHead` (Internal Audit) + `canManageBudget` + `canIssuePaymentOrder` + `canViewBudgetReports` features to فاطمه موسوی | — |
| 66 | `gen-roles-maryam` | Adds scoped `Employee` (Finance unit) to مریم حسینی | — |
| 67 | `gen-pr-pending` | Submits a 3rd PR (25,000,000, qty=5, TSH Kit) that stays in `Pending` status | `{prPendingId}` |

**Note:** All users are created with only `[{name: "Ordinary"}]` by `addUser`. Their full role set (Manager, UnitHead, OrgHead, StoreHead, scoped Employee, etc.) is applied immediately after via `addOrRemoveRoles`. This enforces a single source of truth for role management.

#### Panel-to-User Mapping

| Panel | User | Role/Feature | Credentials |
|-------|------|-------------|-------------|
| `/admin` | Admin System (existing) | `Manager` + `Ordinary` | admin@lesansatek.com / password123 |
| `/unit-head` | رضا احمدی | `UnitHead` (scope: Procurement Unit) | reza@lesansatek.com / password123 |
| `/finance` | مریم حسینی | `Ordinary` + `canManageBudget` | maryam@lesansatek.com / password123 |
| `/vendor` | سارا کریمی | `Manager` + `Ordinary` + `Employee` + `canRespondToTender` + `canAssignItemsToOrder` | sara@lesansatek.com / password123 |
| `/store` | سارا کریمی | `StoreHead` (scope: فروشگاه نمونه) | sara@lesansatek.com / password123 |
| `/admin` | سارا کریمی | `Manager` (via role switching) | sara@lesansatek.com / password123 |
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

### 20n. Extended E2E Coverage

| # | ID | What It Tests | Data Added |
|---|-----|---------------|------------|
| 67 | `gen-get-me` | Authenticated `user/getMe` endpoint | Returns admin profile with roles |
| 68 | `gen-unit-child` | Unit tree nesting (`parentUnit`) | Hematology Lab (Expert) under Procurement Unit, head=رضا احمدی |
| 69 | `gen-store-update-score` | Pure field update on store | score=4.5, totalSoldAmount=15,000,000, totalSoldNum=5 |
| 70 | `gen-stepApproval-gets` | Filtered `stepApproval/gets` | Returns 3 approval records (one per step) for completed PR #1 |
| 71 | `gen-budgetLine-gets` | Filtered `budgetLine/gets` by fiscal year | Returns BUD-001 with allocation/spent/remaining |
| 72 | `gen-tenderOffer-gets` | Filtered `tenderOffer/gets` by tender | Returns the winning offer (2,500,000, 7 day delivery) |
| 73 | `gen-consumption-with-pr` | Consumption linked to PR (history push) | qty=3, Quality control testing, linked to PR #1 |
| 74 | `gen-archive-process` | Archive guard — uses dupProcessId (no active PRs) | Duplicate process status → Archived |
| 75 | `gen-add-removable-tag` | Tag creation for deletion test | name="موقت", color=#00FF00 |
| 76 | `gen-remove-tag` | `tag/remove` action | Deletes the temporary tag |
| 77 | `gen-ware-update-relations` | Update ware's manufacturer relation | Links ware to manufacturer via `manufacturerId` |

---

### 20o. Complete Data Flow Summary

```
Setup Phase:
  tempUser (Admin/System) → login → capture token
  state (Tehran) → city (Tehran) → org (Sample Organization)
  ↓
   17 units (4 General, 2 Warehouse, 1 Finance, 2 Administration, 2 Logistics, 1 Production, 5 Expert)
  8 unit heads + 3 panel users
  Manufacturer → WareType → WareClass → WareGroup → WareModel → Ware → Stuff
  Store → link to city/state → StoreHead role assigned to سارا کریمی
  ↓
  8 Processes (1 general + 3 unit-scoped + 4 hierarchy-scoped)
  All activated with consecutive steps
  ↓
  Budget:
    FiscalYear (1405) → BudgetLine (BUD-001) → Allocation (100,000,000)
  ↓

E2E Flow #1 — Direct Store Purchase (New Lifecycle):
  PR Draft via `add` (TSH Kit, qty=10, requestingUnit=Procurement) → Draft
    No process, no pricing, selectionType="none"
  Add Stuff via `addStuff({stuffId})` → selectionType="stuff", stuffStatus="assigned", estimatedAmount set
  Submit PR via `submit` → Pending (process auto-resolved to Process #2)
  Step 1 (Procurement Unit): approve → advances to step 2
  Step 2 (Warehouse Unit): approve → advances to step 3
  Step 3 (Finance Unit): approve with `budgetLineId` → budget check → auto-encumbrance → PendingFinalization
  OrgHead finalize (`finalize` action) → Completed, stuffStatus="assigned"
  StoreHead delivery: `updateStuffStatus` → assigned→ready_to_ship→shipped→delivered
  Goods Receipt (GR-001, qty=10 accepted) → stuffStatus="received", auto-inventory, auto-payment
    Authority: requester, requesting unit head, or warehouse head; receivingUnit derived from identity (warehouse → warehouse, else → requestingUnit)
  Payment Order: OrgHead sends to finance → Finance UnitHead markPaid (budget deducted)
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
  Close tender → Award to winning offer → `stuffStatus=assigned` on PR
  ↓

Utility:
  Tag (فوری, red)
  Duplicate general process
  Budget report (gets budget line report)
  ↓

E2E Flow #4 — Role Management (all via `addOrRemoveRoles`):
  Admin role update (add Manager + UnitHead scopes via `addOrRemoveRoles`)
  All users created with only `[{name: "Ordinary"}]` — roles applied after via `addOrRemoveRoles`
  UnitHead user (رضا احمدی)
  Finance user (مریم حسینی, canManageBudget)
  Vendor user / Store head (سارا کریمی, canRespondToTender + canAssignItemsToOrder + store head of فروشگاه نمونه)
  12x `addOrRemoveRoles` calls — Manager + scoped Employee + UnitHead for all unit-head users + finance user + sara (+ StoreHead for sara)
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
