# `unit.getOrgChart` — Custom Action for Org Chart Data

## Overview

A performant, single-call backend action designed to fetch **all data needed for the organization chart** in one request. Replaces the previous approach of calling `unit.gets` (paginated, unfiltered by org, unnecessary `$skip`/`$limit` overhead).

Built using the same **flag-based bundling pattern** as `dashboardStatistic`.

## Key Design Decisions

### Org Resolution Logic (in `getOrgChart.fn.ts`)

| Role | How Org is Determined |
|---|---|
| `OrgHead` | Automatically resolved from the user's `activeRoleId` — reads the OrgHead role's `scopeId` (which is the organization `_id`) |
| `Manager` / `Admin` | Must pass `orgId` explicitly in the request body. Errors if omitted. |
| Any other role | Rejected (action is gated to Manager, Admin, OrgHead) |

### Performance Characteristics

| Aspect | Old (`unit.gets`) | New (`unit.getOrgChart`) |
|---|---|---|
| Backend calls needed | 1 | **1** (same, but better) |
| Org scoping | None — returns **ALL** orgs' units | **Scoped** to one org |
| Pagination | `$skip` + `$limit` overhead | **None** — returns all units as a flat array |
| Extensibility | Fixed `get` shape | **Flag-based sections** — add more data without new API calls |
| Data included | Units only | Units + count + optional org metadata |

## API Contract

### Request (POST `/lesan`)

```json
{
  "service": "main",
  "model": "unit",
  "act": "getOrgChart",
  "details": {
    "set": {
      "activeRoleId": "a-uuid-string",
      "orgId": "optional-objectid-for-manager-admin"
    },
    "get": {
      "units": 1,
      "organization": 1
    }
  }
}
```

#### `set` Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `activeRoleId` | `string` (UUID) | **Yes** | The active role ID from the user's roles array. For OrgHead, `scopeId` is used to find the org. |
| `orgId` | `string` (ObjectId) | *Conditional* | Required for Manager/Admin roles. Ignored for OrgHead. |

#### `get` Flags

| Flag | Value | Description |
|---|---|---|
| `units` | `0` or `1` | Returns `{ units: Unit[], totalCount: number }` |
| `organization` | `0` or `1` | Returns `{ organization: { _id, name, enName, description, isActive, logo } }` |

At minimum, always set `"units": 1`.

### Response (Success)

```json
{
  "success": true,
  "body": {
    "totalCount": 12,
    "units": [
      {
        "_id": "objectid",
        "name": "انبار مرکزی",
        "enName": "Central Warehouse",
        "description": "انبار اصلی تجهیزات پزشکی",
        "isActive": true,
        "type": "Warehouse",
        "head": {
          "_id": "objectid",
          "first_name": "دکتر",
          "last_name": "احمدی"
        },
        "parentUnit": {
          "_id": "objectid",
          "name": "بیمارستان شهید بهشتی"
        }
      }
    ],
    "organization": {
      "_id": "objectid",
      "name": "بیمارستان شهید بهشتی",
      "enName": "Shahid Beheshti Hospital",
      "description": "بیمارستان تخصصی و فوق تخصصی",
      "isActive": true,
      "logo": {
        "_id": "objectid",
        "name": "beheshti_logo.png"
      }
    }
  }
}
```

#### Unit Object Fields

| Field | Type | Description |
|---|---|---|
| `_id` | `string` (ObjectId) | Unit ID |
| `name` | `string` | Unit name (Persian) |
| `enName` | `string?` | Unit name (English, optional) |
| `description` | `string?` | Description |
| `isActive` | `boolean` | Active status (default: `true`) |
| `type` | `enum` | One of: `General`, `Warehouse`, `Logistics`, `Production`, `Administration`, `Finance`, `Expert` |
| `head` | `{ _id, first_name, last_name }?` | Embedded unit head (User). Present only if a head is assigned. |
| `parentUnit` | `{ _id, name }?` | Embedded parent Unit. `null` or absent for root units. |

The `parentUnit` field is the key for **tree construction** on the client. If a unit has `parentUnit._id`, find the parent in the array and nest it as a child. Units without `parentUnit` (or whose `parentUnit._id` doesn't match any unit in the array) are **roots**.

### Response (Error)

```json
{
  "success": false,
  "body": {
    "message": "Active role not found"
  }
}
```

| Error Message | When |
|---|---|
| `Active role not found` | The `activeRoleId` doesn't match any of the user's roles |
| `orgId is required for Manager/Admin role` | Manager/Admin didn't provide `orgId` |
| `Role must have an organization scope or orgId must be provided` | OrgHead without org scope, or unknown role |

## Frontend Integration Steps

### Step 1: Start the Backend

Run `deno task bc-dev`. This triggers Lesan's `typeGeneration: true`, which regenerates the file `front/src/types/declarations/selectInp.ts` with the new `getOrgChart` action's TypeScript types. Without this step, the `ReqType` generics won't include the new action.

### Step 2: Create Server Action

**File:** `front/src/app/actions/unit/getOrgChart.ts`

```typescript
"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const getOrgChart = async (
  data: { orgId?: string; activeRoleId?: string },
  getSelection: { units?: number; organization?: number } = { units: 1 },
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "unit",
      act: "getOrgChart",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection,
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت اطلاعات نمودار سازمانی" },
    };
  }
};
```

> **Optional:** After the backend regenerates declarations, you can replace the loose types with the auto-generated `ReqType` imports for full type safety:
> ```typescript
> import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
>
> export const getOrgChart = async (
>   data: Omit<ReqType["main"]["unit"]["getOrgChart"]["set"], "activeRoleId"> & { activeRoleId?: string },
>   getSelection?: DeepPartial<ReqType["main"]["unit"]["getOrgChart"]["get"]>
> ) => { ... }
> ```

### Step 3: Update `page.tsx`

**File:** `front/src/app/orghead/org-chart/page.tsx`

```typescript
import { getOrgChart } from "@/app/actions/unit/getOrgChart"
import { OrgChartClient } from "./org-chart-client"

export default async function OrgHeadOrgChartPage() {
  const result = await getOrgChart(
    {},
    { units: 1, organization: 1 },
  )

  const items = result.success && result.body?.units ? result.body.units : []
  const organization = result.success ? result.body?.organization ?? null : null

  return <OrgChartClient units={items} organization={organization} />
}
```

Key differences from the old `gets()` call:
- **No** `page`, `limit`, or pagination params
- Response body is `{ units: [...], totalCount, organization }` — not a flat array
- Org is scoped automatically (no org filter needed)
- Optional `organization` data available for header

### Step 4: Accept `organization` in `OrgChartClient`

**File:** `front/src/app/orghead/org-chart/org-chart-client.tsx`

```typescript
interface OrgChartClientProps {
  units: UnitNode[]
  organization?: { _id: string; name?: string; enName?: string } | null
}

export function OrgChartClient({ units, organization }: OrgChartClientProps) {
  // ... use organization.name in PageHeader or elsewhere
}
```

### Important: `parentUnit` Changes

The org chart tree builder (`buildTree` in `org-chart-client.tsx`) matches units by their `parentUnit._id`. The new API returns `parentUnit` with `{ _id, name }` — **exactly the same shape** as the old `unit.gets`. The tree construction logic requires **zero changes**.

## Testing the Action

### Via Backend Playground

1. Start the server: `deno task bc-dev`
2. Open `http://localhost:1370/playground`
3. Select model `unit`, action `getOrgChart`
4. Set body:
   ```json
   {
     "set": { "activeRoleId": "<your-orghead-role-uuid>" },
     "get": { "units": 1, "organization": 1 }
   }
   ```
5. Submit — you should receive all units scoped to your org

### Via Curl

```bash
curl -X POST http://localhost:1370/lesan \
  -H "Content-Type: application/json" \
  -H "token: <jwt-token>" \
  -d '{
    "service": "main",
    "model": "unit",
    "act": "getOrgChart",
    "details": {
      "set": { "activeRoleId": "<uuid>" },
      "get": { "units": 1 }
    }
  }'
```

## Future Extensibility

The action is designed to grow. To add more data sections:

1. **Add a flag** in `getOrgChart.val.ts`:
   ```typescript
   get: object({
     units: optional(enums([0, 1])),
     organization: optional(enums([0, 1])),
     unitStats: optional(enums([0, 1])),  // new
   })
   ```

2. **Add a query block** in `getOrgChart.fn.ts`:
   ```typescript
   if (get.unitStats === 1) {
     tasks.push(
       someModel.aggregation({ ... }).toArray().then((arr) => {
         result.unitStats = arr;
       }),
     );
   }
   ```

3. **Update the frontend** to request the new flag.

No new API calls, no breaking changes. All sections run in parallel via `Promise.all`.

## Comparison: Old vs New

| | Old `unit.gets` | New `unit.getOrgChart` |
|---|---|---|
| Call shape | `gets({ page: 1, limit: 500 }, { ... })` | `getOrgChart({}, { units: 1 })` |
| Resp body | Flat array `Unit[]` | `{ units: Unit[], totalCount, organization? }` |
| Org filter | Must pass `organizationId` manually | Auto-resolved for OrgHead |
| Pagination | `$skip`/`$limit` (wasted for tree) | None (all units at once) |
| Extra data | None | Optional org info |
