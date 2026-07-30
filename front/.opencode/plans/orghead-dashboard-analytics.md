# OrgHead Dashboard & Analytics Implementation Plan

> Created: 2026-07-30
> Status: Approved
> Backend API Reference: `backDocs/31-orghead-dashboard-analytics.md`

## Overview

Rewrite the OrgHead dashboard (`/orghead`) from 7 raw `count`/`gets` calls to a single `dashboardStatistic({ type: "orgHead" })` call with 22 analytics fields. Add 14 chart components using **recharts** for a comprehensive analytical dashboard.

## What Currently Exists

- `src/app/orghead/page.tsx` — Simple dashboard with 4 stat cards + recent PRs list (does NOT use `dashboardStatistic`)
- `src/app/orghead/layout.tsx` — `PanelGuard<OrgHead>` + `PanelLayout`
- `src/app/orghead/loading.tsx` — Basic skeleton
- `src/app/actions/user/dashboardStatistic.ts` — Server action already supports `type: "orgHead"` with 22 fields
- Backend doc confirms all 14 analytics fields are implemented

## What's NOT Changing

- Existing sub-routes: `/orghead/requests`, `/orghead/inventory`, `/orghead/consumption`, `/orghead/stock-movements`
- `PanelLayout` wrapper pattern (no sidebar for OrgHead)
- Persian-only, RTL, dark theme
- No auth changes (`PanelGuard<OrgHead>` stays)

## Chart Library: recharts

**Why recharts**:
- Pure React components (no wrapper lib needed)
- Lightweight, tree-shakable, no heavy deps
- Good RTL support
- Native SVG output (works with SSR)
- Covers all needed chart types: Bar, Line, Area, Pie (donut), ResponsiveContainer

## Color Palette

Using existing `@theme` colors from `globals.css` + CSS `--chart-*` variables:

| CSS Variable | Color | Hex |
|-------------|-------|-----|
| `--chart-1` | electric-iris | `#663af3` |
| `--chart-2` | azure | `#027dea` |
| `--chart-3` | cipher-mint | `#269684` |
| `--chart-4` | ember | `#e46d4c` |
| `--chart-5` | ice | `#d1e4fa` |
| — | frost-link | `#b6d9fc` |
| — | moonlight | `#c7d3ea` |
| — | fog | `#81899b` |
| — | emerald-400 | `#34d399` |
| — | amber-400 | `#fbbf24` |

Extended 8-color cycle for PR statuses:
```
chart-1 (iris), chart-2 (azure), chart-3 (mint), chart-4 (ember),
chart-5 (ice), frost-link, emerald-400, amber-400
```

## File Structure

```
src/
├── app/orghead/
│   ├── page.tsx                    # REWRITE — Server Component calls dashboardStatistic
│   ├── dashboard-client.tsx        # NEW — Client component with all sections
│   └── loading.tsx                 # REWRITE — Skeleton for chart-heavy layout
├── components/orghead/
│   └── charts/                     # NEW — All chart components
│       ├── kpi-metric-card.tsx             # Reusable KPI card
│       ├── pr-status-donut.tsx             # Donut chart (8 statuses)
│       ├── pr-monthly-bar.tsx              # Bar chart (12-month trend)
│       ├── selection-breakdown-pie.tsx     # Stuff vs Tender pie
│       ├── budget-burn-kpi.tsx             # Budget burn-down KPI cluster
│       ├── budget-line-breakdown.tsx       # Horizontal budget bar table
│       ├── inventory-summary-bar.tsx       # Stacked bar by wareType
│       ├── inventory-low-stock.tsx         # Low stock alert list
│       ├── consumption-trend-area.tsx      # Area chart (12 months)
│       ├── consumption-by-unit-bar.tsx     # Horizontal bar (top 5)
│       ├── consumption-by-category-pie.tsx # Pie chart by wareType
│       ├── procurement-by-store-bar.tsx    # Bar chart per store
│       ├── stock-movement-chart.tsx        # In/out combo bars
│       └── step-bottleneck-bar.tsx         # Bar chart (avg hours)
```

## Dashboard Sections Layout

```
Section 1: Org Banner (glass card, gradient bg)
Section 2: KPI Row (5 columns → 3 → 2 on mobile)
  ├── purchasingRequestCounts.total
  ├── purchasingRequestCounts.pendingFinalization
  ├── prCycleTime.averageDays
  ├── budgetBurnDown (remaining/allocated %)
  └── inventoryLowStock.count
Section 3: PR Overview (3 columns → 1 on mobile)
  ├── [Donut] prStatusDistribution
  ├── [Bar]   prMonthlyTrend
  └── [Pie]   selectionBreakdown
Section 4: Budget (2 columns → 1 on mobile)
  ├── [KPI]   budgetBurnDown (allocated, spent, remaining, encumbered)
  └── [Table] budgetLineBreakdown (horizontal bars per line)
Section 5: Inventory (2 columns → 1 on mobile)
  ├── [Bar]   inventorySummary (by wareType)
  └── [Alerts] inventoryLowStock (severity-coded items)
Section 6: Consumption (3 columns → 1 on mobile)
  ├── [Area]  consumptionTrend (12 months)
  ├── [Bar]   consumptionByUnit (top 5)
  └── [Pie]   consumptionByCategory
Section 7: Procurement & Process (3 columns → 1 on mobile)
  ├── [Bar]   procurementByStore
  ├── [Bar]   stepBottleneck
  └── [Combo] stockMovementSummary
Section 8: Quick Actions (existing button row)
```

## Data Flow

```
Server Component (page.tsx)
  │
  ├── getMe() → gets user + roles
  ├── Finds OrgHead role to get activeRoleId
  ├── dashboardStatistic({ type: "orgHead" }, { all 22 fields: 1 })
  │
  └── Passes response to:
        └── dashboard-client.tsx (Client Component, "use client")
              ├── Extracts all 22 fields from response
              ├── Passes each section to chart components
              └── Manages responsive grid layout
```

### Single Call Strategy

Make ONE call with all 22 fields:
- Backend runs all queries in parallel via `Promise.all`
- Response time = max(slowest query), not sum
- Estimated response: ~6-8KB
- No progressive loading needed

## Chart Component Contract

Each chart component receives typed props matching the API response shape:

```typescript
// Example props
interface PrStatusDonutProps {
  data: {
    draft: number; pending: number; inProgress: number;
    approved: number; pendingFinalization: number;
    rejected: number; completed: number; cancelled: number;
  };
}
```

All charts render inside `<Card variant="glass">` with a title header.
All charts use `ResponsiveContainer` for mobile responsiveness.
All Persian labels use locale strings directly (no i18n).

## Implementation Order

1. Install recharts
2. Create the charts directory
3. Build KPI metric card (base reusable component)
4. Build all 14 chart components (can parallelize in batches of 3-4)
5. Rewrite page.tsx (server component)
6. Create dashboard-client.tsx (orchestrator)
7. Rewrite loading.tsx
8. Verify with `pnpm lint` and TypeScript

## Key Implementation Patterns

### Glass Card Wrapping (every chart section)
```tsx
<Card variant="glass" className="overflow-hidden">
  <CardHeader className="pb-2">
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-frost-link" />
      <CardTitle className="text-sm font-medium text-fog">
        Persian Title
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <ChartComponent data={data} />
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### RTL-aware Tooltips & Labels
```tsx
// Persian month names for X-axis
const monthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر",
  "مرداد", "شهریور", "مهر", "آبان",
  "آذر", "دی", "بهمن", "اسفند",
];

// Numbers formatted for Persian locale
value.toLocaleString("fa-IR")
```

### Theme-Aware Chart Colors
Reference Tailwind theme colors via hardcoded hex values matching `globals.css` to avoid SSR mismatch:

```typescript
const CHART_COLORS = {
  iris: "#663af3",
  azure: "#027dea",
  mint: "#269684",
  ember: "#e46d4c",
  ice: "#d1e4fa",
  frost: "#b6d9fc",
  emerald: "#34d399",
  amber: "#fbbf24",
  moonlight: "#c7d3ea",
  fog: "#81899b",
};
```

### No `"use client"` at page level
- `page.tsx` remains a Server Component
- Only `dashboard-client.tsx` is `"use client"`
- Chart components are client components (they use recharts hooks)

## Status Names (Persian)

| Key | Persian |
|-----|---------|
| draft | پیش‌نویس |
| pending | در انتظار بررسی |
| inProgress | در حال انجام |
| approved | تأیید شده |
| pendingFinalization | در انتظار تأیید نهایی |
| rejected | رد شده |
| completed | تکمیل شده |
| cancelled | لغو شده |
| stuff | خرید مستقیم |
| tender | مناقصه |
| none | تعیین نشده |
