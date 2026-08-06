# E2E Test Suite — Users & Processes

This document describes the actors and workflow processes defined in [`http/e2e.json`](../e2e.json). The suite is executed manually via the Lesan playground (`/playground`) after starting the dev server.

## Organization Context

One organization ("سازمان نمونه") is created. All 18 units belong to it. Product catalog: one WareType (تجهیزات آزمایشگاهی), WareClass (هماتولوژی), WareGroup (کیت), WareModel (کیت TSH), and Ware (کیت TSH زیشیمی). A second WareModel (بتادین) is used by the short purchase process.

## Users

| User | Email | Roles (scope) | Notes |
|------|-------|---------------|-------|
| ادمین سیستم (ghost) | admin@lesansatek.com | Ordinary + Manager + Employee(واحد خرید) + UnitHead(واحد خرید) + UnitHead(انبار مرکزی) + UnitHead(واحد مالی) + Employee(آزمایشگاه میکروبیولوژی) | Bootstrap user. Primary actor for setup and most admin-level calls (`roleId` = Ordinary, `employeeRoleId`, `microEmployeeRoleId`). |
| رضا احمدی | reza@lesansatek.com | UnitHead(واحد خرید) + Employee(واحد خرید) + UnitHead(۳ آزمایشگاه) | Head of purchase unit and the three labs. |
| حسین کاظمی | hossein@lesansatek.com | UnitHead + Employee(انبار مرکزی) + UnitHead(انبار سرد) | Head of central warehouse and cold store. |
| فاطمه موسوی | fatemeh@lesansatek.com | UnitHead + Employee(واحد مالی) + UnitHead(حسابرسی داخلی) | Budget/payment features (`canManageBudget`, `canIssuePaymentOrder`, `canViewBudgetReports`). |
| مریم حسینی | maryam@lesansatek.com | Employee(واحد مالی) | Same budget features as the finance head. |
| سارا کریمی | sara@lesansatek.com | StoreHead(فروشگاه نمونه) | Store head; logs in separately (`saraToken`) to drive store shipping flow. Tender features (`canRespondToTender`, `canAssignItemsToOrder`). |
| علی محمدی | ali@lesansatek.com | Manager + Employee/UnitHead(واحد تولید) + UnitHead(تضمین کیفیت) | Production head. |
| محمد رضایی | mohammad@lesansatek.com | Manager + Employee/UnitHead(واحد لجستیک) + UnitHead(تدارکات داخلی) | Logistics head; also heads واحد تدارکات (procurement unit). |
| زهرا احمدی | zahra@lesansatek.com | Manager + Employee/UnitHead(فناوری اطلاعات) + UnitHead(پشتیبانی فنی) | IT head. |
| نرگس کریمی | narges@lesansatek.com | Manager + Employee/UnitHead(منابع انسانی) | HR head. |
| فرهاد نوروزی | farhad@lesansatek.com | Manager + Employee/UnitHead(حقوقی) | Legal head. |
| پریسا صادقی | parisa@lesansatek.com | Manager + Employee/UnitHead(تحقیق و توسعه) | R&D head. |
| دکتر احمدی | dr.ahmadi@lesansatek.com | OrgHead (organization) | Logs in separately (`orgHeadToken`); finalizes completed requests. |

All non-ghost users share the password `password123`.

## Processes

Nine processes are created and activated. Scope fields are optional; a scoped process only applies to matching requests.

| Process | Scope | Steps (in order) | Length |
|---------|-------|------------------|--------|
| فرآیند خرید عمومی سازمان | org-wide | تأیید درخواست (واحد خرید) → تأیید انبار → تأیید مالی → تأیید تدارکات | 4 |
| فرآیند خرید واحد خرید | واحد خرید | تأیید انبار → تأیید انبار سرد → تأیید مالی → تأیید تدارکات | 4 |
| فرآیند خرید انبار مرکزی | انبار مرکزی | تأیید انبار → تأیید مالی → تأیید تدارکات | 3 |
| فرآیند خرید واحد مالی | واحد مالی | تأیید مالی → تأیید تدارکات | 2 |
| فرآیند خرید تجهیزات آزمایشگاهی | WareType | تأیید درخواست (واحد خرید) → تأیید مالی → تأیید تدارکات | 3 |
| فرآیند خرید هماتولوژی | WareClass | تأیید درخواست (واحد خرید) → تأیید تدارکات | 2 |
| فرآیند خرید کیت | WareGroup | تأیید درخواست (واحد خرید) → تأیید انبار → تأیید مالی → تأیید تدارکات | 4 |
| فرآیند خرید کیت TSH | WareModel | تأیید درخواست (واحد خرید) → تأیید مالی → تأیید تدارکات | 3 |
| فرآیند کوتاه خرید بتادین | WareModel (بتادین) | تأیید انبار → تأیید مالی → تأیید تدارکات | 3 |

### Resolution logic
Processes are matched by **priority**: unit-scoped → ware → wareModel → wareGroup → wareClass → wareType → org-wide. This is why the two test requests take different routes:

- **خرید کیت TSH** — requested from واحد خرید (`employeeRoleId`) → matches the **unit-scoped** long process (انبار → انبار سرد → مالی → تدارکات). Kit purchases are intentionally routed through the cold store as a mid-step, while the purchase unit never approves its own request.
- **خرید بتادین** — requested from آزمایشگاه میکروبیولوژی (`microEmployeeRoleId`), which has no unit process → falls through to the **wareModel-scoped** betadine process (short: انبار → مالی → تدارکات).

Every process ends with تأیید تدارکات (procurement unit, واحد تدارکات headed by محمد رضایی) as the final approval step.
