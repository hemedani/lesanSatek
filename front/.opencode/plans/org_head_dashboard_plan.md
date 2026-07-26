# OrgHead Dashboard Implementation Plan

## Overview

Implement the dedicated OrgHead panel (`/orghead` route) in the Next.js frontend. OrgHead (رئیس سازمان) oversees the organization's procurement lifecycle — they finalize purchasing requests after all process steps are approved, choose between stuff and tender winners when both exist, and can add post-completion review steps.

**Scope**: Frontend only (backend changes are handled separately).

---

## 1. Infrastructure Changes

### 1.1 `src/middleware.ts` — Add `/orghead` to panel routes

Add `"/orghead"` to the `panelRoutes` array so unauthenticated users are redirected to login.

### 1.2 `src/lib/roles.ts` — Register the OrgHead panel

Add a new `PANEL_DEFINITIONS` entry:

```ts
{
  id: "orghead",
  path: "/orghead",
  label: "داشبورد سازمان",
  icon: Building2,
  description: "تأیید نهایی درخواست‌های خرید",
  requiredRole: ["OrgHead"],
}
```

Update `getDefaultPanel` to route OrgHead to `"/orghead"` (add an `OrgHead` check before the `["Manager", "Admin", "OrgHead"]` block):

```ts
if (roleNames.includes("OrgHead")) return "/orghead";
if (roleNames.some((r) => ["Manager", "Admin"].includes(r))) return "/admin";
```

### 1.3 `src/components/purchasing/request-status-badge.tsx` — Add `PendingFinalization`

```ts
PendingFinalization: {
  label: "در انتظار تأیید نهایی",
  className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
},
```

---

## 2. Server Action

### 2.1 `src/app/actions/purchasingRequest/finalize.ts`

Standard server action pattern. Calls `purchasingRequest.finalize` on the backend.

```ts
"use server";
import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const finalize = async (
  data: {
    _id: string;
    finalWinner?: "stuff" | "tender";
    postCompletionSteps?: { name: string; unitId: string; description?: string; comment?: string }[];
  },
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["finalize"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "finalize",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, status: 1, finalizedAt: 1, completedAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در نهایی‌سازی درخواست خرید" },
    };
  }
};
```

---

## 3. Route Structure

```
src/app/orghead/
├── layout.tsx                    # PanelGuard(OrgHead) + PanelLayout
├── loading.tsx                   # Skeleton
├── page.tsx                      # Dashboard with stats + quick links
├── requests/
│   ├── page.tsx                  # Server: fetch PRs, pass to client
│   ├── requests-client.tsx       # Client: Tabs + DataTable + FinalizeModal
│   ├── loading.tsx               # Skeleton
│   └── [id]/
│       ├── page.tsx              # Server: fetch full PR data
│       ├── orghead-pr-detail-client.tsx  # Client: full PR detail with finalize
│       └── loading.tsx           # Skeleton
```

---

## 4. Pages Detail

### 4.1 Layout (`src/app/orghead/layout.tsx`)

Simple wrapper:

```tsx
import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function OrgHeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard requiredRoles={["OrgHead"]}>
      <PanelLayout title="داشبورد سازمان" description="تأیید نهایی درخواست‌های خرید">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
```

### 4.2 Dashboard (`src/app/orghead/page.tsx`)

**Data sources** (server component, parallel fetch):
- `purchasingRequest.count({ activeRoleId, status: "PendingFinalization" })`
- `purchasingRequest.count({ activeRoleId, status: "Completed" })`
- `purchasingRequest.count({ activeRoleId })` (all)
- `getMe` to extract org info

**Display**:
- Organization name banner (from active role's scope/organizations)
- 3 stat cards: در انتظار تأیید نهایی | تکمیل شده | کل درخواست‌ها
- Quick nav buttons to requests list (each tab)

### 4.3 Requests List (`src/app/orghead/requests/page.tsx` + `requests-client.tsx`)

**Server component** (`page.tsx`):
- Fetch PRs using `gets({ activeRoleId, page, limit, status: "PendingFinalization" }, projection)`
- Compute prev/next page URLs
- Pass to client

**Client component** (`requests-client.tsx`):

**Tabs**:
| Tab | Status filter |
|-----|---------------|
| در انتظار تأیید | `"PendingFinalization"` |
| تکمیل شده | `"Completed"` |
| همه درخواست‌ها | none |

**DataTable columns**:
1. عنوان (title)
2. واحد درخواست‌کننده (requestingUnit.name)
3. مدل کالا (wareModel.name)
4. مقدار (quantity)
5. وضعیت انتخاب — icon/label: کالا / مناقصه / کالا + مناقصه
6. مبلغ تخمینی (estimatedAmount, formatted as IRR)
7. تاریخ ایجاد (createdAt)
8. عملیات — conditional button

**Winner selection indicator** (column 5):
- `stuffStatus === "assigned" && !selectedTenderOfferId` → "کالا"
- `selectedTenderOfferId && stuffStatus !== "assigned"` → "مناقصه"
- `stuffStatus === "assigned" && selectedTenderOfferId` → "کالا + مناقصه"
- Otherwise → "—"

**Card view**: Custom glass card with same data.

**View toggle**: `cardView` / `onViewToggle` on DataTable.

**Action buttons**:
- PendingFinalization tab: "تأیید نهایی" button → opens FinalizeModal
- Completed tab: "مشاهده" button → navigates to detail
- All tab: "مشاهده" button (or "تأیید نهایی" if status is PendingFinalization)

**Empty state**: Each tab shows appropriate message.

### 4.4 PR Detail (`src/app/orghead/requests/[id]/page.tsx` + `orghead-pr-detail-client.tsx`)

**Server component** — fetches using the full detail projection:

```ts
get({ _id: id, activeRoleId }, {
  _id: 1, title: 1, description: 1, status: 1, currentStep: 1,
  quantity: 1, estimatedAmount: 1, selectionType: 1, stuffStatus: 1,
  selectedTenderOfferId: 1, finalizedAt: 1, completedAt: 1, createdAt: 1,
  organization: { _id: 1, name: 1 },
  requester: { _id: 1, first_name: 1, last_name: 1 },
  requestingUnit: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  budgetLine: { _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1 },
  store: { _id: 1, name: 1 },
  stuff: { _id: 1, quantity: 1, price: 1, store: { _id: 1, name: 1 } },
  process: {
    _id: 1, name: 1,
    steps: {
      _id: 1, name: 1, order: 1, stepType: 1,
      groupsOperator: 1, assigneeGroups: 1,
      approvals: { _id: 1, status: 1, comment: 1, decidedAt: 1,
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1 },
        unit: { _id: 1, name: 1, head: { _id: 1, first_name: 1, last_name: 1 } }
      }
    }
  },
  stepApprovals: { _id: 1, status: 1, comment: 1, decidedAt: 1,
    processStep: { _id: 1, name: 1 },
    unit: { _id: 1, name: 1 },
    decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1 }
  },
  goodsReceipts: { _id: 1, receiptNumber: 1, items: 1, status: 1 },
  paymentOrders: { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
  tenders: { _id: 1, title: 1, status: 1, deadline: 1,
    offers: { _id: 1, price: 1, deliveryTime: 1, status: 1, store: { _id: 1, name: 1 } }
  },
  history: 1,
  postCompletionSteps: 1,
})
```

**Client component** — 2/3 + 1/3 grid layout:

**Main content (2/3)**:
1. Header: title, status badge, back button
2. Description card (if exists)
3. WorkflowVisualizer with steps + approvals from stepApprovals
4. Selection info section (stuff vs tender)
5. Tenders section (tender cards with offers)
6. Goods receipts section
7. Payment orders section
8. Post-completion steps section (after finalization)
9. History timeline

**Sidebar (1/3)**:
1. Info cards: quantity, budgetLine, estimatedAmount, selectionType, requester, requestingUnit, wareModel, organization, createdAt, finalizedAt, completedAt
2. "تأیید نهایی" button (only when `status === "PendingFinalization"`)
3. "بازگشت" button

---

## 5. Components

### 5.1 `src/components/orghead/finalize-modal.tsx`

Props:
```ts
interface FinalizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pr: {
    _id: string;
    title?: string;
    wareModel?: { name?: string };
    quantity?: number;
    estimatedAmount?: number;
    stuff?: { quantity?: number; price?: number; store?: { name?: string } };
    selectedTenderOfferId?: string;
    tenders?: Array<{
      offers?: Array<{ _id: string; price?: number; deliveryTime?: string; status?: string; store?: { name?: string } }>
    }>;
  };
  onSuccess: () => void;
}
```

**Sections**:
1. Summary: PR title, ware model, quantity, estimated amount
2. Winner selection — conditionally shown when both stuff AND tender have a selected offer
   - Two glass cards with radio selection
   - Stuff card: store name, price, quantity
   - Tender card: store name, offer price, delivery time
   - If only one exists: show info without radio
3. Post-completion steps (optional):
   - Add step button
   - Each step: name input, unit search, description textarea, comment textarea, remove button
4. Actions: Cancel + "تأیید نهایی" (disabled when winner selection required but not made)
5. Success → close modal → fire `onSuccess` (navigate/list refresh)

### 5.2 `src/components/orghead/post-completion-steps.tsx`

Props: `{ steps: PostCompletionStep[] }`

Displays each step as a glass card showing: name, unit, description, comment, status badge.

### 5.3 `src/components/orghead/selection-info.tsx`

Props:
```ts
interface SelectionInfoProps {
  stuffStatus?: string;
  stuff?: { store?: { name?: string }; price?: number; quantity?: number };
  selectedTenderOfferId?: string;
  tenders?: Array<{
    offers?: Array<{ _id: string; price?: number; deliveryTime?: string; status?: string; store?: { name?: string } }>
  }>;
}
```

Displays selection details: stuff badge + info, tender badge + info, or both as side-by-side cards.

---

## 6. Component Reuse

| Existing Component | Usage |
|--------------------|-------|
| `RequestStatusBadge` | Status display in list + detail |
| `WorkflowVisualizer` | Detail page workflow |
| `HistoryTimeline` | Detail page timeline |
| `RequestCard` | Card view in list (template) |
| `DataTable` | List page table |
| `PageHeader` | List + detail page titles |
| `Pagination` | List page navigation |
| `EmptyState` | Empty tab states |
| `LoadingSkeleton` | Loading states |
| `Card variant="glass"` | All card wrappers |
| `Badge` | Status badges |
| `Tabs` | Tab navigation in list |
| `Dialog` (shadcn/base-ui) | Finalize modal |
| `Button` | All action buttons |
| `Input` | Post-completion step name |
| `Textarea` | Step description/comment |
| `SearchInput` + `Command` | Unit search in modal |

---

## 7. Implementation Order

| # | Task | Files |
|---|------|-------|
| 1 | Infrastructure | `middleware.ts`, `roles.ts`, `request-status-badge.tsx` |
| 2 | Server action | `actions/purchasingRequest/finalize.ts` |
| 3 | Layout + Dashboard | `orghead/layout.tsx`, `orghead/page.tsx`, `orghead/loading.tsx` |
| 4 | Requests list | `orghead/requests/page.tsx`, `requests-client.tsx`, `loading.tsx` |
| 5 | Selection info + Post-completion components | `components/orghead/selection-info.tsx`, `components/orghead/post-completion-steps.tsx` |
| 6 | PR detail page | `orghead/requests/[id]/page.tsx`, `orghead-pr-detail-client.tsx`, `loading.tsx` |
| 7 | Finalize modal | `components/orghead/finalize-modal.tsx` |

---

## 8. Key Patterns to Follow

1. **Server → Client**: Server components fetch, client components handle interactivity
2. **Server actions**: All backend via `"use server"` with typed `ReqType`
3. **Error handling**: `try...catch` in actions, error states in clients
4. **Loading states**: `loading.tsx` at each route level, `LoadingSkeleton` in client
5. **Empty states**: `EmptyState` per tab/list
6. **RTL + Persian**: All text in Persian, `dir="rtl"` from root
7. **Styling**: `glass-card`, `Card variant="glass"`, `ps-`/`pe-` logical properties
8. **Active role**: Extract from `getActiveRoleId()` or `useAuthStore` — pass as `activeRoleId` in all API calls
