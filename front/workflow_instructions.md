# Comprehensive Testing Guide — LesanSatek Frontend

## Prerequisites

### 1. Start the Backend (Deno)
```bash
cd /Users/syd/work/sitak/lesanSatek/back
deno task bc-dev
```
The API playground becomes available at `http://localhost:1370/playground`.  
(Per `front/.env.local`, the frontend expects the backend on port 1370.)

### 2. Start the Frontend (Next.js)
```bash
cd /Users/syd/work/sitak/lesanSatek/front
pnpm dev
```
The app becomes available at `http://localhost:3000`.

---

## Table of Contents

1. [Seed Test Data](#1-seed-test-data)
2. [Test the Admin Panel](#2-test-the-admin-panel)
3. [Test the PR Flow (Most Important)](#3-test-the-pr-flow-most-important)
4. [Test the UnitHead Panel](#4-test-the-unithead-panel)
5. [Test the Employee/Requester Panel](#5-test-the-employeerequester-panel)
6. [Test the Finance Panel](#6-test-the-finance-panel)
7. [Test the Vendor Panel](#7-test-the-vendor-panel)
8. [Test Panel Switching & Role Routing](#8-test-panel-switching--role-routing)
9. [Test Edge Cases](#9-test-edge-cases)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. Seed Test Data

Use the backend playground (`http://localhost:1370/playground`) or a REST client (Bruno, Postman, Insomnia) to create the following records. Each step gives you IDs you need for subsequent steps — keep them handy.

### 1a. Create an Organization

```json
POST /api/main/organization/add
{
  "set": { "name": "سازمان نمونه", "isActive": true },
  "get": { "_id": 1, "name": 1 }
}
```

> **Keep** `ORG_ID` from the response.

---

### 1b. Create a Unit with a Head

```json
POST /api/main/unit/add
{
  "set": {
    "name": "واحد فناوری اطلاعات",
    "type": "General",
    "isActive": true,
    "organizationId": "ORG_ID"
  },
  "get": { "_id": 1, "name": 1 }
}
```

> **Keep** `UNIT_ID` from the response.

---

### 1c. Create 5 Test Users

Use the playground to create each user one by one. Replace `ORG_ID` and `UNIT_ID` with the actual values from previous steps.

**User 1 — Admin** (full access to everything):

```json
POST /api/main/user/addUser
{
  "set": {
    "first_name": "مدیر",
    "last_name": "سیستم",
    "mobile": "09120000001",
    "email": "admin@test.com",
    "password": "123456",
    "is_verified": true,
    "isActive": true,
    "gender": "Male",
    "roles": [{ "name": "Admin" }],
    "features": [
      { "feature": "canManageBudget" },
      { "feature": "canViewWarehouse" },
      { "feature": "canApprovePurchaseRequest" },
      { "feature": "canRespondToTender" },
      { "feature": "canRegisterPurchaseRequest" },
      { "feature": "canCreateTender" }
    ],
    "organization": "ORG_ID"
  },
  "get": { "_id": 1, "first_name": 1, "roles": 1 }
}
```

> **Keep** `USER1_ID` (Admin ID).

**User 2 — UnitHead** (approves/rejects PRs for their unit):

```json
POST /api/main/user/addUser
{
  "set": {
    "first_name": "رئیس",
    "last_name": "واحد",
    "mobile": "09120000002",
    "email": "head@test.com",
    "password": "123456",
    "is_verified": true,
    "isActive": true,
    "gender": "Male",
    "roles": [{
      "name": "UnitHead",
      "scopeType": "unit",
      "scopeId": "UNIT_ID"
    }],
    "features": [
      { "feature": "canApprovePurchaseRequest" },
      { "feature": "canRegisterPurchaseRequest" }
    ],
    "organization": "ORG_ID"
  },
  "get": { "_id": 1, "first_name": 1, "roles": 1 }
}
```

> **Keep** `USER2_ID` (UnitHead ID).

**User 3 — Employee** (creates PRs):

```json
POST /api/main/user/addUser
{
  "set": {
    "first_name": "کارمند",
    "last_name": "خرید",
    "mobile": "09120000003",
    "email": "emp@test.com",
    "password": "123456",
    "is_verified": true,
    "isActive": true,
    "gender": "Male",
    "roles": [{ "name": "Employee" }],
    "features": [{ "feature": "canRegisterPurchaseRequest" }],
    "organization": "ORG_ID"
  },
  "get": { "_id": 1, "first_name": 1, "roles": 1 }
}
```

> **Keep** `USER3_ID` (Employee ID).

**User 4 — Finance** (manages budget lines, views payment orders):

```json
POST /api/main/user/addUser
{
  "set": {
    "first_name": "مالی",
    "last_name": "سازمان",
    "mobile": "09120000004",
    "email": "finance@test.com",
    "password": "123456",
    "is_verified": true,
    "isActive": true,
    "gender": "Female",
    "roles": [{ "name": "Employee" }],
    "features": [
      { "feature": "canManageBudget" },
      { "feature": "canViewBudgetReports" },
      { "feature": "canIssuePaymentOrder" }
    ],
    "organization": "ORG_ID"
  },
  "get": { "_id": 1, "first_name": 1, "roles": 1 }
}
```

> **Keep** `USER4_ID` (Finance ID).

**User 5 — Vendor** (responds to tenders):

```json
POST /api/main/user/addUser
{
  "set": {
    "first_name": "فروشنده",
    "last_name": "نمونه",
    "mobile": "09120000005",
    "email": "vendor@test.com",
    "password": "123456",
    "is_verified": true,
    "isActive": true,
    "gender": "Male",
    "roles": [{ "name": "Ordinary" }],
    "features": [{ "feature": "canRespondToTender" }]
  },
  "get": { "_id": 1, "first_name": 1, "roles": 1 }
}
```

> **Keep** `USER5_ID` (Vendor ID).

---

### 1d. Set UnitHead on the Unit

Connect `USER2_ID` as the head of the unit created in 1b:

```json
POST /api/main/unit/updateRelations
{
  "set": { "_id": "UNIT_ID", "headId": "USER2_ID" },
  "get": { "_id": 1, "head": { "_id": 1, "first_name": 1 } }
}
```

---

### 1e. Create a Process

A process defines the approval workflow that PRs will follow:

```json
POST /api/main/process/add
{
  "set": {
    "name": "فرآیند خرید ساده",
    "description": "مسیر تایید دو مرحله‌ای",
    "isActive": false,
    "organizationId": "ORG_ID"
  },
  "get": { "_id": 1, "name": 1 }
}
```

> **Keep** `PROCESS_ID`.

---

### 1f. Create Process Steps

Create two steps. Steps must have consecutive `order` values (1, 2, 3…).

**Step 1 — تایید واحد:**

```json
POST /api/main/processStep/add
{
  "set": {
    "name": "تایید واحد",
    "description": "بررسی درخواست توسط رئیس واحد",
    "stepType": "Approval",
    "order": 1,
    "required": true,
    "groupsOperator": "AND",
    "assigneeGroups": [{ "operator": "AND", "unitIds": ["UNIT_ID"] }],
    "processId": "PROCESS_ID"
  },
  "get": { "_id": 1, "name": 1, "order": 1 }
}
```

> **Keep** `STEP1_ID`.

**Step 2 — تایید نهایی:**

```json
POST /api/main/processStep/add
{
  "set": {
    "name": "تایید نهایی",
    "description": "تصویب نهایی درخواست",
    "stepType": "Approval",
    "order": 2,
    "required": true,
    "groupsOperator": "AND",
    "assigneeGroups": [{ "operator": "AND", "unitIds": ["UNIT_ID"] }],
    "processId": "PROCESS_ID"
  },
  "get": { "_id": 1, "name": 1, "order": 1 }
}
```

> **Keep** `STEP2_ID`.

---

### 1g. Activate the Process

The process must be activated before PRs can use it. Activation validates step ordering and locks the definition:

```json
POST /api/main/process/activateProcess
{
  "set": { "_id": "PROCESS_ID" },
  "get": { "_id": 1, "status": 1, "isActive": 1 }
}
```

Expected response: `isActive: true`, `status: "active"`.

---

### 1h. Create a WareType

A top-level product classification:

```json
POST /api/main/wareType/add
{
  "set": { "name": "کالای دیجیتال", "isActive": true },
  "get": { "_id": 1, "name": 1 }
}
```

> **Keep** `WARE_TYPE_ID`.

---

### 1i. Create a WareModel

A specific product model under the ware type:

```json
POST /api/main/wareModel/add
{
  "set": {
    "name": "لپ‌تاپ",
    "isActive": true,
    "wareTypeId": "WARE_TYPE_ID"
  },
  "get": { "_id": 1, "name": 1 }
}
```

> **Keep** `WARE_MODEL_ID`.

---

> **✅ Seed data complete.** You should now have 1 org, 1 unit, 5 users, 1 process with 2 steps, 1 ware type, and 1 ware model.

---

## 2. Test the Admin Panel

**Login:** `admin@test.com` / `123456`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 2.1 | Navigate to `http://localhost:3000/login`, enter credentials, click "ورود" | Redirect to `/admin` dashboard |
| 2.2 | Dashboard loads | 6 KPI cards visible: سازمان‌ها, کاربران, درخواست‌های خرید, فرآیندهای فعال, مناقصات, فروشگاه‌ها |
| 2.3 | **Role banner** | If the admin has access to other panels, a purple banner appears: "شما نقش‌های متعددی دارید…" |
| 2.4 | **Organizations** — click sidebar link | List page, click "سازمان جدید" → create another org, then edit/delete |
| 2.5 | **Users** — click sidebar link | See all 5 users; click "کاربر جدید" → create a temp user; edit any user |
| 2.6 | **Units** — click sidebar link | Tree view showing "واحد فناوری اطلاعات"; click to edit |
| 2.7 | **Processes** — click sidebar link | See "فرآیند خرید ساده"; click to view steps |
| 2.8 | **Tags** — click sidebar link | Add/edit/delete tags inline |
| 2.9 | **استان‌ها / شهرها** — CRUD states and cities | |
| 2.10 | **انواع کالا → کلاس کالا → گروه کالا → مدل کالا** — hierarchy CRUD | Navigate through each level |
| 2.11 | **کالاها** — create a product linked to ware model | |
| 2.12 | **انبارها** — add a store (vendor/seller) | |
| 2.13 | **موجودی انبار** — add inventory | |
| 2.14 | **سال‌های مالی** → **ردیف‌های بودجه** → **گزارش بودجه** | Create fiscal year, add budget line, view report |
| 2.15 | **Purchasing Requests** — click sidebar | Empty list (no PRs yet) |
| 2.16 | **PanelSelector** — click the LayoutDashboard icon in the header | Dropdown showing all accessible panels |
| 2.17 | **User menu** — click avatar → click any panel name | Redirects to that panel |
| 2.18 | **Logout** — click "خروج" | Redirect to `/login` |

> **Sidebar feature-gating** — if the admin user does NOT have `canViewWarehouse`, the انبار section is hidden. If they do NOT have `canManageBudget`, the بودجه section is hidden. The admin user created above has all features, so all sections appear.

---

## 3. Test the PR Flow (Most Important)

This is the core business flow: **Employee creates PR → UnitHead approves step-by-step → PR completes**.

---

### 3a. Create a PR as Employee

1. **Log out** (if logged in) and navigate to `/login`
2. **Login as** `emp@test.com` / `123456`
3. **Verify redirect** to `/requests` (Employee Panel)
4. **Dashboard** — 4 KPI cards: کل درخواست‌ها = 0, در انتظار = 0, تایید شده = 0, رد شده = 0
5. Click **"درخواست جدید"** button

| Field | Value |
|-------|-------|
| عنوان | `خرید لپ‌تاپ` |
| توضیحات | `لپ‌تاپ برای واحد فناوری اطلاعات` |
| مبلغ تخمینی | `50000000` |
| تعداد | `2` |
| مدل کالا | Search for `لپ‌تاپ` and select it |
| فرآیند | Search for `فرآیند خرید ساده` and select it |

6. Click **"ثبت درخواست"**
7. **Verify:**
   - Toast message: "درخواست خرید با موفقیت ثبت شد"
   - Redirect to `/requests/my-requests`
   - The PR "خرید لپ‌تاپ" appears in the DataTable with status **"در انتظار تایید"**
8. Click the PR title to open the detail page (`/requests/<PR_ID>`)
9. **Verify (read-only view):**
   - PR info panel with all fields
   - Workflow visualizer showing 2 steps — Step 1 highlighted
   - History timeline with "submitted" entry
   - Right sidebar: Status badge, requester info, date
   - **No approve/reject buttons** (this is the employee's read-only view)

---

### 3b. Approve Step 1 as UnitHead

1. **Log out**, login as `head@test.com` / `123456`
2. **Verify redirect** to `/unit-head` (UnitHead Panel)
3. **Dashboard:**
   - "در انتظار تایید" should show `1`
   - "درخواست‌های فعال" should show at least `1`
4. Click **"مشاهده درخواست‌ها"** or navigate to `/unit-head/requests`
5. **Verify:** The PR "خرید لپ‌تاپ" appears in the list
6. Click the PR title → detail page (`/unit-head/requests/<PR_ID>`)
7. **Verify:**
   - PR info panel (title, amount, quantity, requester, ware model, date, process)
   - Workflow visualizer — Step 1 "تایید واحد" highlighted as **current**
   - History timeline with "submitted" entry
   - **Step Approval Panel** in the right sidebar:
     - Step name: "تایید واحد"
     - Description: "بررسی درخواست توسط رئیس واحد"
     - Comment textarea
     - Two buttons: **"تایید"** (iris) and **"رد"** (red)
8. Type a comment: `تایید شد.`
9. Click **"تایید"**
10. **Verify confirmation dialog:** "آیا از تایید این درخواست اطمینان دارید؟" → click "تایید"
11. **Verify:**
    - Toast: "درخواست با موفقیت تایید شد"
    - Approval panel shows: "این درخواست توسط شما تایید شده است"
    - Buttons are replaced by a green info banner
    - Workflow visualizer — Step 1 marked completed, Step 2 "تایید نهایی" highlighted as current
    - History shows new "step_approved" entry

---

### 3c. Approve Step 2 as UnitHead

1. On the same page (or refresh) — the PR advanced to Step 2 automatically
2. **Verify:** Step Approval Panel now shows "تایید نهایی" (Step 2)
3. Click **"تایید"** again (with or without comment)
4. **Verify:**
   - Toast: "درخواست با موفقیت تایید شد"
   - After the second approval, since there are no more steps:
     - PR status should advance to **"تکمیل شده" (Completed)**
     - Workflow visualizer shows both steps as complete
     - History shows both step approvals

---

### 3d. Verify the Completed PR as Employee

1. Log out, login as `emp@test.com` / `123456`
2. Navigate to `/requests/my-requests`
3. **Verify:** PR status is now **"تکمیل شده"** (green badge)
4. Click into the detail page
5. **Verify:** Workflow visualizer shows both steps completed, history shows full timeline

---

### 3e. Test Rejection Flow (Optional but Recommended)

1. Login as `emp@test.com`, create **another PR** (e.g. "خرید مانیتور")
2. Login as `head@test.com`, navigate to the new PR
3. Add comment: `نیاز به توجیه بیشتر دارد`
4. Click **"رد"** → confirm dialog → click "رد"
5. **Verify:**
   - Toast: "درخواست رد شد"
   - PR status becomes **"رد شده" (Rejected)**
   - Both employee (in their panel) and admin (in admin panel) can see the rejection

---

## 4. Test the UnitHead Panel

**Login:** `head@test.com` / `123456`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 4.1 | Login redirect | Lands on `/unit-head` dashboard |
| 4.2 | Dashboard KPI cards | Shows pending approvals count, active PRs, decided counts |
| 4.3 | Quick action link | "درخواست‌های نیازمند تایید" → `/unit-head/requests` |
| 4.4 | Requests list | DataTable with PRs filtered by this unit; columns: title, amount, status, requester, step, date |
| 4.5 | Empty state | If no PRs pending, shows Persian empty state with ShoppingCart icon |
| 4.6 | Pagination | Prev/next buttons, page indicator |
| 4.7 | PR detail | Full PR info + WorkflowVisualizer + HistoryTimeline + StepApprovalPanel |
| 4.8 | Approve/Reject with confirmation | Dialog appears before submitting decision |
| 4.9 | Loading state | Skeleton loaders on initial load |
| 4.10 | Error boundary | Navigate to an invalid PR ID → error page with "تلاش مجدد" button |

---

## 5. Test the Employee/Requester Panel

**Login:** `emp@test.com` / `123456`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 5.1 | Login redirect | Lands on `/requests` dashboard |
| 5.2 | Dashboard KPI cards | Total PRs, pending, approved, rejected |
| 5.3 | "درخواست جدید" button | Navigates to `/requests/new` |
| 5.4 | New PR form | Fields: title, description, estimated amount, quantity, ware model, process |
| 5.5 | Form validation | Empty title → error "عنوان الزامی است"; negative amount → validation error |
| 5.6 | Form submission | Toast success, redirect to `/requests/my-requests` |
| 5.7 | My PRs list | DataTable with all PRs created by this user |
| 5.8 | PR detail (read-only) | No approve/reject buttons; status badge prominent; workflow visualizer showing progress |
| 5.9 | Empty state | If no PRs exist: "شما هنوز هیچ درخواست خریدی ثبت نکرده‌اید" with action button |
| 5.10 | Loading state | Skeleton loaders |

---

## 6. Test the Finance Panel

**Login:** `finance@test.com` / `123456`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 6.1 | Login redirect | Lands on `/finance` dashboard |
| 6.2 | Dashboard KPI cards | Total budget, remaining, pending payment orders, budget lines count |
| 6.3 | Quick links | 3 cards linking to budget lines, payment orders, reports |
| 6.4 | Budget lines list (`/finance/budget-lines`) | DataTable with code, description, total amount, remaining (color-coded), status |
| 6.5 | Payment orders (`/finance/payment-orders`) | DataTable with PR reference, amount, status badge, date |
| 6.6 | Budget reports (`/finance/budget-reports`) | KPI summary cards + budget line breakdown table with consumption rate |
| 6.7 | Empty states | All pages show Persian empty state when no data |
| 6.8 | **Access control** | Try `/admin` → should redirect to `/finance` (no admin role) |

---

## 7. Test the Vendor Panel

**Login:** `vendor@test.com` / `123456`

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 7.1 | Login redirect | Lands on `/vendor` dashboard |
| 7.2 | Dashboard KPI cards | Open tenders, my offers, awarded count, win rate |
| 7.3 | Quick actions | "مناقصات باز" and "پیشنهادهای من" buttons |
| 7.4 | Open tenders (`/vendor/tenders`) | DataTable with title, deadline, status; "ثبت پیشنهاد" button for open tenders |
| 7.5 | Submit offer form (`/vendor/tenders/<ID>/offer`) | Fields: price, delivery time, terms, notes; submits via `tenderOffer.submit()` |
| 7.6 | My offers (`/vendor/my-offers`) | DataTable with tender, price, status badge, date |
| 7.7 | Empty states | All pages show Persian empty state when no data |

---

## 8. Test Panel Switching & Role Routing

### 8a. Multi-Role Panel Switching

1. Login as **admin@test.com** — has all features/roles
2. **PanelSelector** — in admin header, click the LayoutDashboard icon
3. **Verify:** Dropdown shows: مدیریت, پنل واحد, درخواست‌ها, مالی, فروشندگان
4. Click **"پنل واحد"** → should redirect to `/unit-head`
5. Verify the header changes to the simpler PanelLayout (no sidebar)
6. Click PanelSelector again → switch back to **"مدیریت"** → back to `/admin`

### 8b. User Menu Panel Links

1. Click the avatar → user menu opens
2. **Verify:** "پنل‌ها" section shows all accessible panels
3. Click any panel → redirects

### 8c. Direct URL Access Control

| URL | Login as | Expected |
|-----|----------|----------|
| `/admin` | `head@test.com` | Allowed (AuthGuard passes, sidebar may be filtered) |
| `/unit-head` | `emp@test.com` | Redirect to default panel (Employee → `/requests`) |
| `/finance` | `emp@test.com` | Redirect to default panel (`/requests`) |
| `/vendor` | `emp@test.com` | Redirect to default panel |
| `/admin` | unauthenticated | Redirect to `/login` |
| `/unit-head` | unauthenticated | Redirect to `/login` |

---

## 9. Test Edge Cases

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 9.1 | **Empty lists** | Visit any panel with no data | Persian empty state with icon + description |
| 9.2 | **Loading skeletons** | Hard refresh any list page | Brief skeleton loaders, then data appears |
| 9.3 | **Form double-submit** | Click submit button rapidly | Button disabled after first click (Loader2 spinner) |
| 9.4 | **Invalid route** | Navigate to `/nonexistent` | Next.js 404 page |
| 9.5 | **Error boundary** | Force an error (e.g., invalid PR ID in URL) | Error page with "تلاش مجدد" button |
| 9.6 | **RTL text** | Inspect any page | All text aligned right, headings end with colon (:) |
| 9.7 | **RTL icons** | Check arrow icons, breadcrumb separators | Arrows point right (← instead of →) |
| 9.8 | **Responsive — mobile** | Resize browser < 768px | Sidebar hidden, hamburger menu appears, DataTable switches to card view |
| 9.9 | **Responsive — tablet** | Resize 768-1024px | Layout adapts, grid columns reduce |
| 9.10 | **Concurrent approval** | Login as head@test.com in two tabs, approve same PR | Second submission shows appropriate error |
| 9.11 | **Backend down** | Stop the Deno backend while using the app | Error toasts, error boundaries catch failures |

---

## 10. Verification Checklist

Use this checklist to sign off on each area:

### Authentication & Routing
- [ ] Login with each user redirects to correct panel
- [ ] Unauthenticated users are redirected to `/login`
- [ ] PanelSelector shows correct panels per user
- [ ] Direct URL access is blocked for unauthorized roles

### Admin Panel
- [ ] All sidebar sections render
- [ ] CRUD operations work for all entities
- [ ] Feature-gated sections hide correctly

### PR Flow (Core)
- [ ] Employee can create PR with all required fields
- [ ] PR status = "در انتظار تایید" after submission
- [ ] UnitHead sees the PR in their pending list
- [ ] Step approval panel shows correctly
- [ ] Approve advances to next step
- [ ] Reject changes PR status to "رد شده"
- [ ] All steps approved → PR status = "تکمیل شده"
- [ ] Workflow visualizer reflects current state
- [ ] History timeline captures all events
- [ ] Employee view is read-only (no approve/reject)

### Panel Layouts
- [ ] Admin: sidebar + header + PanelSelector
- [ ] UnitHead: PanelLayout (simple header)
- [ ] Employee: PanelLayout (simple header)
- [ ] Finance: PanelLayout (simple header)
- [ ] Vendor: PanelLayout (simple header)

### UI/UX
- [ ] All text is in Persian (no English strings)
- [ ] RTL layout everywhere
- [ ] Loading skeletons on all list pages
- [ ] Empty states on all list pages
- [ ] Error boundaries on all panels
- [ ] Dark theme (Midnight Ink background)
- [ ] Glass card styling on surfaces
- [ ] Responsive design works on mobile

### Error Handling
- [ ] Form validation shows Persian error messages
- [ ] API errors show toast notifications
- [ ] Error boundaries have "تلاش مجدد" button
- [ ] Loading states prevent double submission
