# Comprehensive Testing Guide — LesanSatek Frontend

This guide matches the current **two-organization** E2E suite: `back/http/e2e.json`
(**412 entries**). It covers the complete procure-to-pay workflow, inventory,
budgeting, double-entry accounting, accounting periods, and cross-organization
isolation for both **Alpha** and **Beta** organizations.

---

## Prerequisites

### 1. Start the backend (Deno)

```bash
cd /Users/syd/work/sitak/lesanSatek/back
deno task bc-dev
```

Playground: `http://localhost:1370/playground`

### 2. Start the frontend (Next.js)

```bash
cd /Users/syd/work/sitak/lesanSatek/front
pnpm dev
```

App: `http://localhost:3000`

### 3. Seed against an empty user collection

`user.tempUser` only works when the **user collection is empty**. For repeatable
runs, use a dedicated database:

```bash
cd /Users/syd/work/sitak/lesanSatek/back
MONGO_DB=lesanSatek_e2e APP_PORT=1370 ENV=development deno run --allow-all mod.ts
```

Then run `back/http/e2e.json` in the playground collection runner (or entry by
entry). The suite is stateful — run it top to bottom on a fresh DB.

Expected result of a full run:

- **369 entries succeed**
- **43 entries are intentional failures** (`iso-*`, `authz-*`, `neg-*`)
- **0 unexpected failures**

Each intentional failure carries an `expectedFailure: { "message": ... }`
field, so the playground E2E runner counts a matching rejection as a pass and
shows it in the Expected Failures panel. A success — or a different error
message — is reported as a real failure. When driving the suite from a script,
`ignore-scripts/_run_e2e.py` applies the same matching logic.

---

## Table of Contents

1. [Seed Data Map](#1-seed-data-map)
2. [Accounts, Roles & Panels](#2-accounts-roles--panels)
3. [Admin Panel Checks](#3-admin-panel-checks)
4. [Direct Purchase Flow](#4-direct-purchase-flow)
5. [Tender Flow](#5-tender-flow)
6. [Reject & Archive Flows](#6-reject--archive-flows)
7. [Accounting & Period Close](#7-accounting--period-close)
8. [Inventory, Transfer & Consumption](#8-inventory-transfer--consumption)
9. [Cross-Organization Isolation](#9-cross-organization-isolation)
10. [Authorization (Role) Negative Tests](#10-authorization-role-negative-tests)
11. [Verification Checklist](#11-verification-checklist)
12. [Appendix — Captured Keys](#12-appendix--captured-keys)

---

## 1. Seed Data Map

### 1a. Bootstrap & global catalog

| Entry | Creates | Captures |
|-------|---------|----------|
| `setup-tempuser` | Ghost bootstrap admin `admin@lesansatek.com` | `{ghostId}`, `{ghostEmail}` |
| `gen-login` | Admin login | `{token}`, `{userId}`, `{roleId}` |
| `gen-add-manager-role` | Adds `Manager` role to the ghost user | `{managerRoleId}` |
| `gen-state` / `gen-city` | Tehran state + city | `{stateId}`, `{cityId}` |
| `gen-mfr-1` / `gen-mfr-2` | Manufacturers: Zist Shimi / Daroupakhsh | `{mfr1Id}`, `{mfr2Id}` |

Product hierarchy (shared catalog):

| Product | WareType | WareClass | WareGroup | WareModel | Ware base price |
|---------|----------|-----------|-----------|-----------|-----------------|
| TSH | تجهیزات آزمایشگاهی | هماتولوژی | کیت | کیت TSH | 2,500,000 |
| Betadine | مواد ضدعفونی | محلول ضدعفونی | بتادین | بتادین ۱۰٪ | 500,000 |
| Gauze | پانسمان | گاز | استریل | گاز استریل | 120,000 |

Stores and Stuff (shared catalog):

| Store | StoreHead | Stuff | Quantity | Price |
|-------|-----------|-------|----------|-------|
| فروشگاه آلفا | سارا کریمی (`store.a@lesansatek.com`) | TSH | 100 | 2,800,000 |
| فروشگاه آلفا | سارا کریمی | Betadine | 200 | 560,000 |
| فروشگاه آلفا | سارا کریمی | Gauze | 500 | 130,000 |
| فروشگاه بتا | بهنام رستمی (`store.b@lesansatek.com`) | TSH | 100 | 2,650,000 |

Captured keys: `{storeaId}`, `{storebId}`, `{stuffTshAId}`, `{stuffTshBId}`,
`{stuffBetadineAId}`, `{stuffGauzeAId}`.

### 1b. Organizations and units

Two organizations are created: **سازمان آلفا** (`a`) and **سازمان بتا** (`b`).
Each organization has the same 7-unit tree:

```
مدیریت {org}                 (General, root)
├── آزمایشگاه {org}          (Expert)
│   └── تضمین کیفیت {org}     (Expert)
├── انبار مرکزی {org}         (Warehouse)
│   └── انبار سرد {org}       (Warehouse)
├── واحد مالی {org}           (Finance)
└── واحد تدارکات {org}        (Logistics)
```

Captured unit keys use the org prefix: `{aHqUnitId}`, `{aLabUnitId}`,
`{aWhUnitId}`, `{aColdUnitId}`, `{aFinUnitId}`, `{aProcUnitId}`, `{aQaUnitId}`
and the same with `b`.

### 1c. Users per organization

| Key | Name (Alpha) | Email | Role | Scope |
|-----|--------------|-------|------|-------|
| `orgHead` | رضا آلفایی | `orghead.a@lesansatek.com` | OrgHead | organization |
| `labEmp` | علی آزمایشگاهی | `lab.a@lesansatek.com` | Employee | Lab unit |
| `whHead` | محمد انباری | `wh.a@lesansatek.com` | UnitHead | Warehouse unit |
| `coldHead` | حسن سردخانه | `cold.a@lesansatek.com` | UnitHead | Cold Storage unit |
| `finHead` | فاطمه مالی | `fin.a@lesansatek.com` | UnitHead | Finance unit |
| `procHead` | پریسا تدارکات | `proc.a@lesansatek.com` | UnitHead | Procurement unit |
| `qaHead` | کیان کیفیت | `qa.a@lesansatek.com` | UnitHead | QA unit |

Beta uses the same keys and roles with `.b` emails and Beta names.
All users have password `password123`.

Relevant features:

| User | Features |
|------|----------|
| OrgHead | budget, accounting, payment, tender, PR, receipt, consumption, history |
| labEmp | create/submit PR, assign items, tender, consumption, warehouse view, receipt, history |
| whHead / coldHead | warehouse view, unit inventory, goods receipt, history |
| finHead | budget, accounting, payment, period close, manual JE, history |
| procHead | warehouse view, tender, assign items, history |
| qaHead | create/submit PR, assign items, consumption, warehouse view, history |

### 1d. Processes per organization

| Process | Name | Scope | Steps |
|---------|------|-------|-------|
| `gen` | فرآیند عمومی — {org} | none (org-wide) | تأیید انبار → تأیید مالی → بررسی تدارکات |
| `lab` | فرآیند آزمایشگاه — {org} | Lab unit | تأیید انبار → تأیید انبار سرد → تأیید مالی → بررسی تدارکات |
| `bet` | فرآیند بتادین — {org} | Betadine WareModel | تأیید انبار → تأیید مالی |

All steps use `groupsOperator: "AND"` and one assignee group per step.
All three processes are activated with `activateProcess`.

Capture keys: `{aProcessGenId}`, `{aProcessLabId}`, `{aProcessBetId}`,
`{aStepGen1Id}`, `{aStepLab1Id}`, `{aStepBet1Id}`, etc.

### 1e. Budget

| Entry | Entity | Value |
|-------|--------|-------|
| `{p}-fiscal-year` | FiscalYear | 2026-04-01 → 2027-03-31, open |
| `{p}-budget-line-1` | BudgetLine | BUD-{P}-001 — TSH — 100,000,000 |
| `{p}-budget-line-2` | BudgetLine | BUD-{P}-002 — Betadine — 50,000,000 |
| `{p}-budget-line-3` | BudgetLine | BUD-{P}-003 — Gauze — 200,000,000 |
| `{p}-budget-line-4` | BudgetLine | BUD-{P}-004 — Tender — 100,000,000 |

Each line gets an initial allocation equal to its full amount.

### 1f. Accounting

| Entry | Creates | Captures |
|-------|---------|----------|
| `{p}-seed-coa` | Default chart of accounts | — |
| `{p}-account-get-inventory` | Inventory account 1200 | `{aInventoryAccountId}` |
| `{p}-account-get-accountspayable` | Accounts Payable 2100 | `{aPayableAccountId}` |
| `{p}-account-get-cogs` | COGS 5100 | `{aCogsAccountId}` |
| `{p}-account-get-bank` | Bank 1020 | `{aBankAccountId}` |
| `{p}-account-get-operatingexpense` | Operating Expenses 5300 | `{aOperatingExpenseAccountId}` |
| `{p}-account-transport` | Custom shipping expense 5400 | `{aTransportAccountId}` |
| `{p}-accounting-period` | Period `1405-04` (April 2026), open | `{aPeriodId}` |
| `{p}-cost-center` | Procurement cost center | `{aCostCenterId}` |

`seedDefaultChartOfAccounts` also ensures monthly periods and cost centers.

### 1g. Purchasing requests per organization

| PR | Requester | WareModel | Qty | Price | Process | Final status |
|----|-----------|-----------|-----|-------|---------|--------------|
| `tsh` | labEmp | TSH | 10 | 2,800,000 | `lab` | Completed |
| `bet` | qaHead | Betadine | 20 | 560,000 | `bet` | Completed |
| `gauze` | qaHead | Gauze | 100 | 130,000 | `gen` (unscoped fallback) | Completed |
| `tender` | labEmp | TSH | 5 | 2,600,000 (winning offer) | `lab` | Completed |
| `reject` | labEmp | Gauze | 1 | 130,000 | `lab` | Rejected |
| `archive` | qaHead | Gauze | 2 | 130,000 | `gen` | Pending (left in-flight) |

Capture keys are lowercase by tag: `{aPrtshId}`, `{aPrbetId}`,
`{aPrgauzeId}`, plus `{aPrTenderId}`, `{aPrRejectId}`, `{aPrArchiveId}`.

### 1h. Receipts, inventory, payments, journal entries per organization

- Goods receipts: `GR-{P}-TSH`, `GR-{P}-BET`, `GR-{P}-GAUZE`, `GR-{P}-TENDER`.
  Receiving unit is the central warehouse (`{p}WhUnitId`).
- Inventory after the suite (Alpha):
  - Warehouse: TSH **12** (10 direct + 5 tender − 3 transfer), Betadine **20**, Gauze **100**.
  - Lab: TSH **1** (3 transferred − 2 consumed).
- Transfer: 3 TSH warehouse → lab, then consumption of 2 TSH at the lab.
- Payment orders: one per completed PR, auto-created as `draft` on goods receipt,
  then marked `paid` (28,000,000 / 11,200,000 / 13,000,000 / 13,000,000).
- Manual JE: 1,000,000 Dr Transportation Expense / Cr Bank (per org).
- Automatically posted JEs: goods receipts, consumption, payments.
- Period `1405-04` is closed at the end; posting into it must fail.

---

## 2. Accounts, Roles & Panels

| Panel | Alpha user | Beta user | Password | Role |
|-------|------------|-----------|----------|------|
| Admin | `admin@lesansatek.com` | — | `password123` | Manager + Ordinary |
| OrgHead | `orghead.a@lesansatek.com` | `orghead.b@lesansatek.com` | `password123` | OrgHead |
| Employee / Requester | `lab.a@lesansatek.com` | `lab.b@lesansatek.com` | `password123` | Employee |
| UnitHead (Warehouse) | `wh.a@lesansatek.com` | `wh.b@lesansatek.com` | `password123` | UnitHead |
| UnitHead (Cold) | `cold.a@lesansatek.com` | `cold.b@lesansatek.com` | `password123` | UnitHead |
| UnitHead (Finance) | `fin.a@lesansatek.com` | `fin.b@lesansatek.com` | `password123` | UnitHead |
| UnitHead (Procurement) | `proc.a@lesansatek.com` | `proc.b@lesansatek.com` | `password123` | UnitHead |
| UnitHead (QA) | `qa.a@lesansatek.com` | `qa.b@lesansatek.com` | `password123` | UnitHead |
| StoreHead | `store.a@lesansatek.com` | `store.b@lesansatek.com` | `password123` | StoreHead |

Every login request must send the JWT in the **`token`** header and the selected
role in `activeRoleId` inside `details.set`.

---

## 3. Admin Panel Checks

| # | Check | Expected |
|---|-------|----------|
| 3.1 | Organizations list | Exactly Alpha and Beta |
| 3.2 | Users list | 3 global users (admin + 2 store heads) + 14 org users |
| 3.3 | Units tree | 7 units per org, correct parent nesting |
| 3.4 | Product hierarchy | 3 WareTypes, 3 WareClasses, 3 WareGroups, 3 WareModels, 3 Wares |
| 3.5 | Stores | فروشگاه آلفا and فروشگاه بتا |
| 3.6 | Stuff | 4 records with the quantities/prices in 1a |
| 3.7 | Processes | 3 per org; general, lab-scoped, betadine-scoped |
| 3.8 | Fiscal years | One per org |
| 3.9 | Budget lines | 4 per org (8 total) |
| 3.10 | Chart of accounts | Seeded per org; custom 5400 transport account |
| 3.11 | Accounting periods | 1405-04 (closed) + current open period per org |
| 3.12 | Journal entries | 10 per org: 4 receipts + 1 consumption + 1 manual + 4 payments |
| 3.13 | Payment orders | 4 per org, all `paid` |
| 3.14 | Tenders | One per org, `awarded` |
| 3.15 | PR list | 6 per org: 4 Completed, 1 Rejected, 1 Pending |

---

## 4. Direct Purchase Flow

Use **Alpha** for the walkthrough. The same steps run automatically for Beta.

### 4a. Create the PR (lab employee)

1. Login as `lab.a@lesansatek.com`.
2. Create a PR:
   - title: `خرید tsh — A`
   - quantity: `10`
   - WareModel: `کیت TSH`
   - requesting unit: `آزمایشگاه آلفا`
3. Expected: status `Draft`, no process yet.

### 4b. Warehouse check and stuff assignment

1. Call `purchasingRequest.warehouseCheck` with the requester role and the
   central warehouse unit.
2. Call `purchasingRequest.addStuff` with `{stuffTshAId}`.
3. Expected:
   - `selectionType = "stuff"`
   - `estimatedAmount = 28,000,000`
   - history: `stuff_assigned`

### 4c. Submit and auto-resolve process

1. Submit the PR.
2. Expected:
   - status `Pending`
   - process = `فرآیند آزمایشگاه — سازمان آلفا` (lab-scoped wins)
   - `currentStep = 0`
   - pending StepApproval created for the warehouse unit

### 4d. Approve all steps

| Step | User | Unit | Action | Notes |
|------|------|------|--------|-------|
| 1 | `wh.a@lesansatek.com` | Warehouse | approve | |
| 2 | `cold.a@lesansatek.com` | Cold Storage | approve | |
| 3 | `fin.a@lesansatek.com` | Finance | approve | **must pass `budgetLineId` = BUD-A-001** |
| 4 | `proc.a@lesansatek.com` | Procurement | approve | final step |

After step 4:

- PR status → `PendingFinalization`
- history: `all_steps_approved`
- budget line linked; encumbrance reserved

### 4e. OrgHead finalize

Login as `orghead.a@lesansatek.com`, call `purchasingRequest.finalize`.

Expected:

- status `Completed`, `finalizedAt` set
- winner = `stuff` (store A)
- store/stuff linked
- history: `finalized`

### 4f. StoreHead delivery

Login as `store.a@lesansatek.com` and advance `stuffStatus`:

```
assigned → ready_to_ship → shipped → delivered
```

Each call is `purchasingRequest.updateStuffStatus`; history records
`stuff_status_updated`.

### 4g. Goods receipt

Login as `wh.a@lesansatek.com` (warehouse head) and call `goodsReceipt.add`:

- receipt number `GR-A-TSH`
- 10 received / 10 accepted / 0 rejected
- receiving unit = central warehouse

Expected side effects:

- inventory +10 in warehouse
- PR `stuffStatus = "received"`
- draft PaymentOrder `Payment for goods receipt GR-A-TSH` (28,000,000)
- budget encumbrance converted to spent
- journal entry: **Dr Inventory / Cr Accounts Payable**
- history: `goods_received`

### 4h. Payment

1. `paymentOrder.gets` (manager/admin bypass) finds the draft order.
2. `paymentOrder.markPaid` as OrgHead.

Expected:

- payment status `paid`, `paidAt` set
- budget line `totalAllocated` reduced by 28,000,000;
  `totalEncumbered` → 0, `totalSpent` → 28,000,000
- journal entry: **Dr Accounts Payable / Cr Bank**

### 4i. Betadine and Gauze

The same flow runs for:

- `bet` — QA requests 20 Betadine (560,000) → `bet` process (2 steps) →
  completed; payment 11,200,000
- `gauze` — QA requests 100 Gauze (130,000) → general process (3 steps,
  unscoped fallback) → completed; payment 13,000,000

---

## 5. Tender Flow

Per organization:

1. `labEmp` creates a Draft PR for 5 TSH.
2. A tender is created on the PR; `assignedVendors` = both stores via
   `tender.updateRelations` (Manager/Admin).
3. Store A submits 2,700,000 and Store B submits 2,600,000
   (`tenderOffer.submit`).
4. The lab process is approved (warehouse → cold → finance with BUD-4 →
   procurement).
5. OrgHead finalizes with the **winning tender offer B** selected
   (`selectTenderOffer`).
6. Expected:
   - tender `awarded`
   - offer B `accepted`, offer A `rejected`
   - PR completed, `estimatedAmount = 13,000,000`
   - goods receipt `GR-A-TENDER` from Store B (5 TSH)
   - payment 13,000,000; budget line 4 spent 13,000,000
   - inventory warehouse +5 TSH

Capture keys: `{aTenderId}`, `{aTenderOfferAId}`, `{aTenderOfferBId}`.

---

## 6. Reject & Archive Flows

### 6a. Rejection

- `labEmp` creates a Gauze PR, assigns gauze stuff, submits.
- Warehouse head submits `status: "rejected"` with comment `موجودی کافی نیست`.
- Expected: PR status `Rejected`; history `step_rejected`.

### 6b. Archive guard

- `qaHead` creates a Gauze PR via the **general** process and leaves it `Pending`.
- OrgHead tries to archive that general process.
- Expected failure:
  `Cannot archive process: 1 purchasing request(s) are still in progress...`

The negative entry id is `neg-a-archive-blocked` / `neg-b-archive-blocked`.

---

## 7. Accounting & Period Close

### 7a. Automatic entries

| Source | Debit | Credit | Amount |
|--------|-------|--------|--------|
| Goods receipt TSH | Inventory | Accounts Payable | 28,000,000 |
| Goods receipt Betadine | Inventory | Accounts Payable | 11,200,000 |
| Goods receipt Gauze | Inventory | Accounts Payable | 13,000,000 |
| Goods receipt Tender | Inventory | Accounts Payable | 13,000,000 |
| Consumption (2 TSH) | COGS | Inventory | based on receipt unit cost |
| Payment TSH | Accounts Payable | Bank | 28,000,000 |
| Payment Betadine | Accounts Payable | Bank | 11,200,000 |
| Payment Gauze | Accounts Payable | Bank | 13,000,000 |
| Payment Tender | Accounts Payable | Bank | 13,000,000 |

Each automatic entry carries an idempotency key derived from its source
(receipt id, consumption id, payment id), so replaying the same event does not
double-post.

### 7b. Manual entry

`journalEntry.postManual` posts:

```
Dr Transportation Expense (5400)  1,000,000
Cr Bank (1020)                    1,000,000
```

The suite sends an explicit `idempotencyKey` (`MAN-A-001` / `MAN-B-001`) so
Alpha and Beta each create their own entry.

### 7c. Reports

After posting, verify:

- `journalEntry.gets` — all entries for the organization
- `journalEntryLine.gets` — debit/credit lines
- `journalEntry.getTrialBalance` — debits = credits
- `journalEntry.getIncomeStatement` — COGS and operating expenses
- `journalEntry.getGeneralLedger` — inventory account movements

### 7d. Period close

`accountingPeriod.closePeriod` closes `1405-04` (id `{aPeriodId}` / `{bPeriodId}`).

Then attempt to post a manual entry dated **2026-04-20**:

- Expected failure: `Accounting period 1405-04 is closed`
- Entry ids: `neg-a-post-to-closed-period`, `neg-b-post-to-closed-period`

---

## 8. Inventory, Transfer & Consumption

| Step | Action | Result |
|------|--------|--------|
| Goods receipt | `inventoryManager.addStock` | Warehouse TSH +10 |
| Tender receipt | `inventoryManager.addStock` | Warehouse TSH +5 |
| Transfer | 3 TSH warehouse → lab | Warehouse −3, Lab +3 |
| Consumption | 2 TSH at lab | Lab −2, COGS journal entry |
| Final Alpha | Warehouse TSH 12, Lab TSH 1 | |
| Betadine receipt | +20 in warehouse | |
| Gauze receipt | +100 in warehouse | |

Consumption record: 2 units, reason `مصرف tsh`, created by the lab employee.
Goods receipt and consumption each create a `StockMovement` entry with
`balanceBefore` / `balanceAfter`.

---

## 9. Cross-Organization Isolation

All entries below use an **Alpha actor** against **Beta** data and **must fail**.

### 9a. Cross-org reads

| Test id | Actor | Target |
|---------|-------|--------|
| `iso-a-read-org-b` | Alpha OrgHead | Beta organization |
| `iso-a-read-unit-b` | Alpha OrgHead | Beta Lab unit |
| `iso-a-read-process-b` | Alpha OrgHead | Beta lab process |
| `iso-a-read-pr-b` | Alpha OrgHead | Beta TSH PR |
| `iso-a-read-budget-b` | Alpha Finance head | Beta budget line |
| `iso-a-read-fiscal-b` | Alpha Finance head | Beta fiscal year |
| `iso-a-read-account-b` | Alpha Finance head | Beta bank account |
| `iso-a-read-period-b` | Alpha Finance head | Beta accounting period |
| `iso-a-read-costcenter-b` | Alpha Finance head | Beta cost center |
| `iso-a-read-payment-b` | Alpha OrgHead | Beta payment order |
| `iso-a-read-receipt-b` | Alpha OrgHead | Beta goods receipt |
| `iso-a-read-journal-b` | Alpha Finance head | Beta manual journal entry |

### 9b. Cross-org writes

| Test id | Actor | Attempt |
|---------|-------|---------|
| `iso-a-org-update-b` | Alpha OrgHead | rename Beta org |
| `iso-a-unit-update-b` | Alpha OrgHead | rename Beta lab |
| `iso-a-process-update-b` | Alpha OrgHead | rename Beta process |
| `iso-a-process-add-b` | Alpha OrgHead | add process to Beta |
| `iso-a-pr-add-b` | Alpha OrgHead | create PR in Beta lab |
| `iso-a-pr-update-b` | Alpha OrgHead | edit Beta PR |
| `iso-a-pr-submit-b` | Alpha OrgHead | submit Beta pending PR |
| `iso-a-budget-update-b` | Alpha Finance head | edit Beta budget line |
| `iso-a-fiscal-update-b` | Alpha Finance head | edit Beta fiscal year |
| `iso-a-account-update-b` | Alpha Finance head | edit Beta account |
| `iso-a-period-update-b` | Alpha Finance head | edit Beta period |
| `iso-a-costcenter-update-b` | Alpha Finance head | edit Beta cost center |
| `iso-a-budget-allocation-b` | Alpha Finance head | allocate to Beta line |
| `iso-a-budget-encumbrance-b` | Alpha Finance head | encumber Beta line |
| `iso-a-period-close-b` | Alpha Finance head | close Beta period |
| `iso-a-account-seed-b` | Alpha Finance head | seed Beta chart of accounts |
| `iso-a-post-manual-b` | Alpha Finance head | post JE to Beta |
| `iso-a-goodsreceipt-b` | Alpha Warehouse head | receive Beta PR |
| `iso-a-step-decision-b` | Alpha Warehouse head | approve Beta step |
| `iso-a-consumption-b` | Alpha Employee | consume Beta inventory |
| `iso-a-inventory-adjust-b` | Alpha Warehouse head | adjust Beta inventory |
| `iso-a-inventory-transfer-b` | Alpha Warehouse head | transfer from Beta warehouse |
| `iso-a-payment-paid-b` | Alpha OrgHead | pay Beta payment order |

Expected failure messages are typically `You cant do this`; step approval may
return `Only the unit head can submit a decision for this unit`.

---

## 10. Authorization (Role) Negative Tests

| Test id | Actor | Attempted action | Expected |
|---------|-------|------------------|----------|
| `authz-employee-post-manual` | Alpha Employee | post manual JE | rejected — missing role/feature |
| `authz-employee-close-period` | Alpha Employee | close accounting period | rejected |
| `authz-whhead-post-manual` | Alpha Warehouse head | post manual JE | rejected |
| `authz-storehead-tender-update` | Store A head | update tender relations | rejected (Manager/Admin only) |

Also verify in the UI:

- Employees cannot see finance or accounting panels.
- UnitHeads only see their unit's pending approvals.
- StoreHeads only see their own store, stuff, offers, and assigned PRs.
- Only Manager/Admin can call `tender.updateRelations` and `tender.remove`.

---

## 11. Verification Checklist

- [ ] Full suite on a fresh DB: 369 success + 43 expected failures
- [ ] Alpha and Beta each have 6 PRs (4 Completed, 1 Rejected, 1 Pending)
- [ ] 4 goods receipts and 4 paid payment orders per org
- [ ] Warehouse inventory: TSH 12, Betadine 20, Gauze 100; Lab TSH 1
- [ ] Budget lines 1–4 show allocated minus paid, spent = payment amount
- [ ] Journal entries: 10 per org; trial balance balanced
- [ ] Closed period rejects new April postings
- [ ] Archive of the general process is blocked while the archive PR is pending
- [ ] Every `iso-*` and `authz-*` entry fails
- [ ] No cross-org data appears in any `gets` list for a scoped user

---

## 12. Appendix — Captured Keys

Global:

```
ghostId, token, userId, roleId, managerRoleId, stateId, cityId
mfr1Id, mfr2Id
tshWareTypeId, tshWareClassId, tshWareGroupId, tshWareModelId, tshWareId
betadineWareTypeId, betadineWareClassId, betadineWareGroupId, betadineWareModelId, betadineWareId
gauzeWareTypeId, gauzeWareClassId, gauzeWareGroupId, gauzeWareModelId, gauzeWareId
storeaId, storebId, storeaUserId, storebUserId, storeaHeadRoleId, storebHeadRoleId
storeaHeadToken, storebHeadToken
stuffTshAId, stuffTshBId, stuffBetadineAId, stuffGauzeAId
```

Per organization (`p` = `a` or `b`):

```
{p}OrgId
{p}HqUnitId, {p}LabUnitId, {p}WhUnitId, {p}ColdUnitId,
{p}FinUnitId, {p}ProcUnitId, {p}QaUnitId
{p}OrgHeadUserId, {p}OrgHeadRoleId, {p}OrgHeadToken
{p}LabEmpUserId, {p}LabEmpRoleId, {p}LabEmpToken
{p}WhHeadUserId, {p}WhHeadRoleId, {p}WhHeadToken
{p}ColdHeadUserId, {p}ColdHeadRoleId, {p}ColdHeadToken
{p}FinHeadUserId, {p}FinHeadRoleId, {p}FinHeadToken
{p}ProcHeadUserId, {p}ProcHeadRoleId, {p}ProcHeadToken
{p}QaHeadUserId, {p}QaHeadRoleId, {p}QaHeadToken
{p}ProcessGenId, {p}ProcessLabId, {p}ProcessBetId
{p}StepGen1Id..3, {p}StepLab1Id..4, {p}StepBet1Id..2
{p}FiscalYearId, {p}BudgetLine1Id..4
{p}InventoryAccountId, {p}PayableAccountId, {p}CogsAccountId,
{p}BankAccountId, {p}OperatingExpenseAccountId, {p}TransportAccountId
{p}PeriodId, {p}CostCenterId
{p}PrtshId, {p}PrbetId, {p}PrgauzeId, {p}PrTenderId, {p}PrRejectId, {p}PrArchiveId
{p}TenderId, {p}TenderOfferAId, {p}TenderOfferBId
{p}ReceiptTshId, {p}ReceiptBetId, {p}ReceiptGauzeId, {p}ReceiptTenderId
{p}WhInventoryTshId, {p}UnitInventoryTshId, {p}ConsumptionTshId
{p}PaymentTshId, {p}PaymentBetId, {p}PaymentGauzeId, {p}PaymentTenderId
{p}ManualEntryId
```
