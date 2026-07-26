# Frontend Agent Prompt — OrgHead Role Implementation

Implement the **OrgHead** panel (`/orghead` route) in the Next.js frontend from scratch. OrgHead (رئیس سازمان) oversees the organization's procurement lifecycle — they finalize purchasing requests after all process steps are approved, choose between stuff and tender winners when both exist, and can add post-completion review steps.

---

## 1. OrgHead Identity Detection

Read the active role from the user's `roles` array (from `getMe` or login response):

```typescript
const orgHeadRole = user.roles.find(r => r.name === "OrgHead");
// orgHeadRole = { roleId: "<uuid>", name: "OrgHead", scopeType: "organization", scopeId: "<orgId>" }
```

Use `orgHeadRole.roleId` as `activeRoleId` in all API calls.
Use `orgHeadRole.scopeId` as the managed organization's `_id`.

---

## 2. New Backend Action: `purchasingRequest.finalize`

### Purpose
Finalizes a PurchasingRequest that has completed all its process steps (status = `"PendingFinalization"`). This is the OrgHead's primary action — it transitions the PR to `"Completed"` and handles winner selection between stuff assignments and tender offers.

### Request format

```
POST /api (or via Lesan playground)
model: purchasingRequest
act: finalize
```

**`set` fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `activeRoleId` | string | **yes** | — | The user's active role UUID |
| `_id` | string (ObjectId) | **yes** | — | The PR's `_id` |
| `finalWinner` | `"stuff"` \| `"tender"` | **conditional** | auto-detect | **Required** when the PR has BOTH a stuff assignment AND a selected tender offer. If only one exists, the backend auto-detects it. |
| `postCompletionSteps` | array | no | — | Optional extra review steps (see §4) |

**`postCompletionSteps` item fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **yes** | Step name (e.g., "بررسی کارشناسی") |
| `unitId` | string (ObjectId) | **yes** | The unit that must review |
| `description` | string | no | Description of what the step entails |
| `comment` | string | no | Pre-filled comment from OrgHead |

### Winner selection logic (backend)

| Scenario | Behavior |
|----------|----------|
| Only stuff assigned | Auto-winner = stuff. No tender to cancel. |
| Only tender offer selected | Auto-winner = tender. Awards the tender (status→"awarded"), accepts winning offer, rejects others. Links winning store/stuff on PR. |
| Both stuff AND tender exist | **Requires `finalWinner`**. If user picks "tender": awards as above. If user picks "stuff": cancels the in-progress tender (status→"cancelled"), rejects all submitted offers. |

### Response
Returns the full PR document after finalization (`status: "Completed"`, `finalizedAt`, `completedAt` set).

```typescript
type FinalizeResponse = {
  _id: string;
  status: "Completed";
  finalizedAt: string;    // ISO date
  completedAt: string;    // ISO date
  postCompletionSteps?: PostCompletionStep[];
  history: HistoryEntry[];
  // ... all other PR fields per get projection
}
```

---

## 3. New Status: `"PendingFinalization"`

The PR lifecycle now has a new intermediate status:

```
Draft → submit() → Pending → step approvals → InProgress → (last step approved) → PendingFinalization
                                                                                         ↓
                                                                              OrgHead finalize()
                                                                                         ↓
                                                                                    Completed
                                                                                         ↓
                                                                              StoreHead ships goods
```

`"PendingFinalization"` means:
- All process steps have been approved by their respective units
- The OrgHead must now review and finalize
- No unit action is needed — the PR is in the OrgHead's court

---

## 4. New Pure Fields on PurchasingRequest

### `finalizedAt` (optional date)
Set when the OrgHead (or Manager/Admin) calls `finalize()`. ISO date string.

### `postCompletionSteps` (embedded array)
Extra review steps that the OrgHead can add at finalization time. These are NOT part of the main process — they're post-completion quality checks.

```typescript
type PostCompletionStep = {
  name: string;           // e.g., "بررسی کارشناسی"
  description?: string;   // e.g., "کارشناس فنی کیفیت کالا را تأیید کند"
  unitId: string;         // Unit._id
  comment?: string;       // OrgHead's note
  status: "pending";      // Always "pending" when created
};
```

The frontend should display these steps (with their status) on the PR detail page after finalization. In the future, the assigned unit could mark them as done.

---

## 5. New Organization Relation

Every PurchasingRequest now has an `organization` relation (set at creation time). The OrgHead's `gets` calls are automatically filtered by `organization._id` matching the OrgHead's `scopeId`.

### Get projection
Include `organization: { _id: 1, name: 1, enName: 1 }` in `get` fields to display the org.

---

## 6. OrgHead Dashboard (`/orghead`)

### 6a. Tabs/Navigation

| Tab | Description | API call |
|-----|-------------|----------|
| **در انتظار تأیید** (Pending Finalization) | PRs in `PendingFinalization` status | `purchasingRequest.gets({ status: "PendingFinalization" })` — auto-filtered to org |
| **تکمیل شده** (Completed) | All completed PRs in the org | `purchasingRequest.gets({ status: "Completed" })` |
| **همه درخواست‌ها** (All) | All PRs in the org across all statuses | `purchasingRequest.gets()` — no status filter |

### 6b. Pending Finalization List

Display as a table/card list with:

| Column | Source |
|--------|--------|
| عنوان (title) | `title` |
| واحد درخواست‌کننده | `requestingUnit.name` |
| مدل کالا | `wareModel.name` |
| مقدار | `quantity` |
| وضعیت انتخاب | Show icon/text: `stuff` (کالا), `tender` (مناقصه), or both (کالا + مناقصه) |
| مبلغ تخمینی | `estimatedAmount` — format as IRR |
| تاریخ ایجاد | `createdAt` |
| عملیات | "تأیید نهایی" button → opens finalize modal |

**Priority sorting**: Sort by `createdAt` asc (oldest first — longest waiting for finalization).

### 6c. PR Detail View

Clicking a PR from the list navigates to `/orghead/requests/[id]` showing:

1. **Basic info**: title, description, quantity, estimated amount, status, dates
2. **Organization**: `organization.name`
3. **Requester**: name from `requester`
4. **Requesting unit**: `requestingUnit.name`
5. **Ware model**: name from `wareModel`
6. **Budget line**: `budgetLine.code` + `title` + `totalAllocated` + `totalEncumbered` + `remainingBudget`
7. **Selection info**:
   - If `stuff` assigned: show store name, stuff price, pricing mode
   - If tender offer selected: show winning store name, offer price, delivery time
   - If BOTH: highlight that both exist and OrgHead must pick
8. **Process steps**: Full step history with approval statuses (from `process.steps[].approvals`)
9. **Step approvals**: Detail from `stepApprovals` array
10. **History timeline**: All entries from `history` array
11. **Goods receipts** (if any): from `goodsReceipts`
12. **Payment orders** (if any): from `paymentOrders`
13. **Tenders**: from `tenders` relation (with nested offers)
14. **Post-completion steps** (after finalization): display with status

### 6d. Finalize Modal (for PendingFinalization PRs)

Triggered by "تأیید نهایی" button. The modal should:

1. **Show summary**: PR title, ware model, quantity, estimated amount
2. **Winner selection** (only if both stuff AND tender exist):
   - Two cards side by side:
     - **Stuff option**: Store name, stuff price, effective price, quantity available
     - **Tender option**: Store name, offer price, delivery time, payment terms
   - Radio/select to pick one → sets `finalWinner`
3. **Post-completion steps** (optional):
   - "افزودن مرحله پس از تکمیل" button
   - Each step has: name (text input), unit (unit search/select), description (textarea)
   - Can add multiple steps
4. **Confirm button**: Calls `finalize` action
5. **On success**: Navigate to PR detail page showing completed status

### 6e. Completed PRs List

Same as pending list but filtered by `status: "Completed"`. Shows:
- All the same columns
- Plus `finalizedAt` and `completedAt` dates
- "مشاهده" button → navigates to PR detail

---

## 7. Key API Reference

### `purchasingRequest.gets`

For OrgHead, the backend auto-adds a filter: `{ "organization._id": <orgId> }`. OrgHead sees only PRs belonging to their organization.

| Parameter | Type | Notes |
|-----------|------|-------|
| `status` | string | Filter by status — use `"PendingFinalization"` to see pending ones |
| `page` | number | 1-based |
| `limit` | number | Default 50 |

**Recommended `get` fields for listing:**
```typescript
{
  _id: 1, title: 1, description: 1, quantity: 1, status: 1,
  estimatedAmount: 1, selectionType: 1, stuffStatus: 1,
  selectedTenderOfferId: 1, currentStep: 1,
  finalizedAt: 1, completedAt: 1, createdAt: 1, updatedAt: 1,
  organization: { _id: 1, name: 1 },
  requester: { _id: 1, first_name: 1, last_name: 1 },
  requestingUnit: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  store: { _id: 1, name: 1 },
  stuff: { _id: 1, price: 1, quantity: 1 }
}
```

### `purchasingRequest.get`

**Recommended `get` fields for detail page:**
```typescript
{
  organization: { _id: 1, name: 1, enName: 1 },
  stuff: { _id: 1, quantity: 1, price: 1 },
  requester: { _id: 1, first_name: 1, last_name: 1 },
  requestingUnit: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  budgetLine: { _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1 },
  store: { _id: 1, name: 1, address: 1 },
  process: {
    _id: 1, name: 1,
    steps: {
      _id: 1, name: 1, order: 1, stepType: 1,
      groupsOperator: 1, assigneeGroups: 1,
      approvals: {
        _id: 1, status: 1, comment: 1, decidedAt: 1,
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1 },
        unit: { _id: 1, name: 1, head: { _id: 1, first_name: 1, last_name: 1 } }
      }
    }
  },
  stepApprovals: {
    _id: 1, status: 1, comment: 1, decidedAt: 1,
    processStep: { _id: 1, name: 1 },
    unit: { _id: 1, name: 1 },
    decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1 }
  },
  goodsReceipts: { _id: 1, receiptNumber: 1, items: 1, status: 1 },
  paymentOrders: { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
  tenders: {
    _id: 1, title: 1, status: 1, deadline: 1,
    offers: { _id: 1, price: 1, deliveryTime: 1, status: 1, store: { _id: 1, name: 1 } }
  },
  history: 1
}
```

### `purchasingRequest.finalize`

```
act: "finalize"
set: { activeRoleId, _id, finalWinner?, postCompletionSteps? }
get: { ... standard PR fields ... }
```

---

## 8. Route Design

| Route | Component | Description |
|-------|-----------|-------------|
| `/orghead` | Dashboard | Overview with stats + pending PRs list (default tab) |
| `/orghead/requests` | PRsList | All PRs with tab filters (PendingFinalization / Completed / All) |
| `/orghead/requests/[id]` | PRDetail | Full PR detail with finalize button |
| `/orghead/requests/[id]/finalize` | FinalizeModal (or inline) | Finalize confirmation with winner selection + post-completion steps |

---

## 9. Post-Completion Steps (Post-Finalization)

After the PR is finalized (status = "Completed"), the `postCompletionSteps` array is stored on the PR document. These are optional quality review steps that the OrgHead can assign to specific units.

### Display
- In the PR detail page, show a section "مراحل پس از تکمیل"
- Each step shows: name, description, assigned unit, comment, status
- Status is always "pending" initially

### Future extension (not implemented yet)
- The assigned unit could mark their step as completed
- This would create a new StepApproval-like flow

---

## 10. Data Flow Example

### Stuff-only PR (simple case)
```
1. User creates PR (Draft)
2. User assigns stuff (selectionType = "stuff", stuffStatus = "assigned")
3. User submits PR → (Pending)
4. Process steps are approved one by one
5. Last step approved → (PendingFinalization)
6. OrgHead opens dashboard → sees PR in "در انتظار تأیید" tab
7. OrgHead clicks "تأیید نهایی"
8. Modal: shows stuff info, no winner selection needed (only stuff exists)
9. OrgHead clicks confirm → finalize() called
10. PR status = "Completed", finalizedAt set
11. StoreHead can now see the PR and ship goods
```

### Tender + Stuff coexistence (OrgHead decides)
```
1. User creates PR (Draft)
2. User starts tender, gets offers, selects best offer (selectionType = "tender")
3. User also assigns a direct stuff (stuffStatus = "assigned") — both exist!
4. User submits PR → (Pending)
5. Process steps approved
6. Last step approved → (PendingFinalization)
7. OrgHead opens dashboard → sees PR in "در انتظار تأیید" tab
8. OrgHead clicks "تأیید نهایی"
9. Modal: two cards side by side — stuff option vs tender option
10. OrgHead selects the better option, adds optional post-completion step
11. OrgHead clicks confirm → finalize({ finalWinner: "tender" }) called
12. Tender is awarded, other offers rejected, winning store linked
13. PR status = "Completed"
14. Winning StoreHead ships goods
```

---

## 11. E2E Test Account

| Role | Name | Email | Password | Notes |
|------|------|-------|----------|-------|
| OrgHead | دکتر احمدی | `dr.ahmadi@lesansatek.com` | `password123` | `scopeType: "organization"`, `scopeId: <orgId>` |

---

## 12. Implementation Checklist

- [ ] Add route `/orghead` with role guard (only OrgHead, Manager, Admin)
- [ ] Detect OrgHead role from `getMe` response, extract `scopeId` as org ID
- [ ] Create dashboard page with PR stats (total, pending finalization, completed counts)
- [ ] Create PR list page with tab filters (PendingFinalization / Completed / All)
- [ ] Build PR detail page with all info sections
- [ ] Build finalize modal with:
  - Winner selection UI (when both stuff + tender exist)
  - Post-completion steps adder
  - Confirm action calling `purchasingRequest.finalize`
- [ ] Display post-completion steps on PR detail after finalization
- [ ] Handle loading, empty, and error states throughout
- [ ] Use Persian (fa) locale with RTL layout
- [ ] Test with E2E flow: create PR → submit → approve steps → finalize
