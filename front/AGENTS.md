<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LesanSatek Frontend - Next.js Application

## Project Overview

LesanSatek frontend is a Next.js 16 application for an organizational process management system. It allows organizations to define and manage their purchasing processes through a visual process builder. Each organization can create departments, assign responsible employees, and build hierarchical unit structures (organization → department → employee → units/subunits in a tree). The system provides a flexible workflow engine for defining, approving, and executing purchasing workflows.

### Key Features

- Secure JWT-based authentication with role-based access
- Visual process builder for creating and managing purchasing workflows
- Organization management with hierarchical unit tree
- Department and employee management
- Purchasing request management through defined processes
- Full Persian (RTL) language support
- Responsive, mobile-first design with dark/light theme support
- Server Actions for all backend communication (secure and efficient)

### Architecture

- **Frontend Framework**: Next.js 16 with App Router (Server Components by default)
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- **State Management**: Zustand for global state
- **Forms**: React Hook Form + Zod validation
- **RTL Layout**: Persian-only, RTL
- **Theming**: next-themes for seamless dark/light/system mode
- **API Communication**: Server Actions only (never direct client-side fetch for backend calls)
- **Type Safety**: Generated declarations from backend + strict TypeScript

## Building and Running

**IMPORTANT: This project uses `pnpm` as the package manager. Never use `npm` or `yarn`.**

**ALWAYS use the most recent stable version of dependencies.** When installing packages, prefer the latest stable release unless a specific version is required for compatibility.

```bash
# Install dependencies with pnpm (REQUIRED - do not use npm/yarn)
pnpm install

# Run the development server (uses Turbopack)
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Configuration

Key variables from `.env.frontend`:
- `NEXT_PUBLIC_BACKEND_URL` – Public backend API URL (`http://localhost:1370`)
- `NEXT_PUBLIC_APP_URL` – Public app URL (`http://localhost:3000`)

## Development Conventions

### Code Structure

```
front/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (routes)/           # Public routes
│   │   ├── admin/              # Admin panel
│   │   ├── actions/            # Server actions
│   │   │   ├── auth/           # Auth server actions
│   │   │   ├── organization/   # Organization CRUD
│   │   │   ├── department/     # Department CRUD
│   │   │   ├── employee/       # Employee CRUD
│   │   │   ├── unit/           # Unit/subunit CRUD
│   │   │   ├── process/        # Process CRUD
│   │   │   └── request/        # Purchasing request CRUD
│   │   └── globals.css         # Global styles + Tailwind
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── form/               # Reusable form components
│   │   ├── layout/             # Layout components
│   │   └── providers/          # Context providers
│   ├── stores/                 # Zustand stores
│   ├── lib/                    # Utilities
│   │   ├── utils.ts            # cn() function
│   │   └── api.ts              # Lesan API client
│   ├── types/                  # TypeScript types
│   │   └── declarations/       # Backend-generated types
│   └── hooks/                  # Custom React hooks

├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
└── next.config.ts              # Next.js configuration
```

### RTL Layout (Persian)

- **CRITICAL:** This application is **Persian (fa) only**. Never introduce English or any second language.
- **CRITICAL:** All user-facing text — labels, validation messages, notifications, tooltips, placeholders — MUST be in Persian.
- \`dir="rtl"\` is set on the \`<html>\` element for full RTL layout.
- **Never add i18n, locale switching, or multi-language support.**

#### RTL Gotchas with base-ui Components

Some `@base-ui/react` primitives may inject `dir="ltr"` by default when no explicit `dir` prop is provided. Always explicitly pass `dir="rtl"`:

```tsx
// ❌ BAD – component defaults to dir="ltr", breaking all children
<Tabs defaultValue="list" className="w-full">

// ✅ GOOD – Explicitly pass the direction
<Tabs defaultValue="list" className="w-full" dir="rtl">
```

### Styling

- **Tailwind CSS v4** as the core utility framework.
- **shadcn/ui** as the primary component library (built on base-ui + Tailwind).
  - Full RTL support (CLI generates logical properties when `rtl: true` in `components.json`).
- Dark theme using Tailwind v4 `@custom-variant dark` + **next-themes** (no FOUC).
- Mobile-first responsive design.
- **Logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) are REQUIRED for all spacing and layout. Never use `left`/`right` or physical padding/margin properties.**

### Authentication

- JWT-based with secure cookie handling.
- Token is stored in an `httpOnly` secure cookie named `token`.
- Token is sent as `token` header (no "Bearer" prefix) per Lesan convention.
- Auth state managed via React Context + Zustand where needed.

## Server Actions Architecture (Lesan Framework Integration)

### Overview

Server Actions are the exclusive method for backend communication. They provide:
- **Security**: All requests run server-side, hiding backend URLs and sensitive logic
- **Type Safety**: Full TypeScript support via auto-generated `ReqType` declarations from Lesan
- **Consistency**: Uniform CRUD pattern across all models
- **Authentication**: Automatic JWT token extraction from secure cookies
- **Selective Data Fetching**: Specify exactly which fields to return (GraphQL-like)

### Directory Structure

```
src/app/actions/
├── <model>/              # e.g., organization, department, employee, unit, process
│   ├── add.ts           # Create a single record
│   ├── get.ts           # Retrieve a single record by ID
│   ├── gets.ts          # Retrieve multiple records (with pagination/filtering)
│   ├── update.ts        # Update an existing record
│   ├── remove.ts        # Delete a record
│   └── count.ts         # Get count of records
├── auth/                # Authentication-specific actions
│   ├── login.ts
│   └── logout.ts
└── file/                # File-specific operations
    └── upload.ts
```

### Standard Action Pattern

```ts
"use server";
import { AppApi } from "@/lib/api";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const <actionName> = async (
  data: ReqType["main"]["<model>"]["<action>"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["<model>"]["<action>"]["get"]>
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const response = await AppApi(undefined, token).send({
    service: "main",
    model: "<model>",
    act: "<action>",
    details: {
      set: data,
      get: getSelection || {},
    },
  });

  return response;
};
```

### Action Types

#### add - Create a Record
```ts
const newOrg = await add(
  { name: "Org Name", ... },
  { _id: 1, name: 1 },
);
```

#### get - Retrieve a Single Record
```ts
const org = await get(
  { _id: "507f1f77bcf86cd799439011" },
  { _id: 1, name: 1, departments: { _id: 1, name: 1 } },
);
```

#### gets - Retrieve Multiple Records
```ts
const orgs = await gets(
  { page: 1, limit: 20, filter: { /* ... */ } },
  { _id: 1, name: 1 },
);
```

#### update - Modify a Record
```ts
const updated = await update(
  { _id: "...", name: "Updated Name" },
  { _id: 1, name: 1 },
);
```

#### remove - Delete a Record
```ts
const result = await remove(
  { _id: "..." },
  { _id: 1 },
);
```

#### count - Get Record Count
```ts
const total = await count({ filter: { isActive: true } }, { count: 1 });
```

### Field Selection (`get` Parameter)

```ts
// Return only specific fields
{ _id: 1, name: 1, email: 1 }

// Include nested relations
{
  _id: 1,
  name: 1,
  departments: { _id: 1, name: 1, head: { _id: 1, first_name: 1 } }
}

// Return all fields (not recommended for performance)
{}
```

**Best Practices:**
- Always specify fields explicitly (never use `{}` unless necessary)
- Only request fields you actually need
- Use nested selections for related data (avoids N+1 queries)

### Field Naming Conventions

#### 1. Field Projections in `get` Parameter
Use nested objects to fetch related data, NOT camelCase IDs:
```ts
const departments = await gets(
  { page: 1, limit: 20 },
  {
    _id: 1,
    name: 1,
    organization: { _id: 1, name: 1 },  // NOT 'organizationId'
    head: { _id: 1, first_name: 1 },     // NOT 'headId'
  }
);
```

#### 2. Set Parameters in `add` and `update` Actions
Use camelCase IDs when creating or updating records:
```ts
const newDept = await add(
  {
    name: "Department Name",
    organizationId: "123...",  // camelCase ID
    headId: "456...",          // camelCase ID
  },
  { _id: 1, name: 1 }
);
```

#### 3. Update Relations Separately
```ts
// Update basic fields
await update({ _id: deptId, name: "New Name" }, { _id: 1 });

// Update relations separately
await updateRelations({ _id: deptId, organization: newOrgId }, { _id: 1 });
```

### Response Structure

All Lesan actions return a standardized response:
```ts
{ success: boolean, body: any }
```

#### Response Body Format
- **`act: "get"`** (standard) → `response.body` is an **array** with one element. Access via `response.body[0]`.
- **Custom-named actions** (e.g., `getUser`, `getMe`) → `response.body` is a **single object**.

```ts
// Standard get — returns array
const response = await get({ _id: id }, { name: 1 });
const entity = response.body[0];

// Custom get — returns single object
const response = await getUser({ _id: id }, { first_name: 1 });
const user = response.body;
```

### The AppApi Client (Type-Safe)

The `AppApi` function (in `@/lib/api.ts`) wraps the auto-generated `lesanApi` from backend declarations for full type safety:

```ts
import { lesanApi } from "@/types/declarations/selectInp";

export const AppApi = (lesanUrl?: string, token?: string) => {
  return lesanApi({
    URL: lesanUrl || getLesanUrl(),
    baseHeaders: {
      connection: "keep-alive",
      ...(token ? { token } : {}), // No "Bearer" prefix!
    },
  });
};
```

The `lesanApi` client provides a fully typed `send()` method that auto-suggests service, model, and action names with their corresponding `set`/`get` types from `ReqType`. You get intelligent autocompletion for all available actions and their parameters.

### Environment Configuration

Server actions rely on:
- `NEXT_PUBLIC_BACKEND_URL` – Public backend URL (`http://localhost:1370`, client-side)
- Server-side uses internal URL resolution automatically via `AppApi`

### Best Practices

1. **Always use Server Actions**: Never fetch backend APIs directly from client components
2. **Be explicit with field selection**: Only request fields you need
3. **Handle null returns**: Actions return `null` on failure — always check before accessing properties
4. **Use TypeScript**: Leverage `ReqType` and `DeepPartial` from `@/types/declarations/selectInp` for complete type safety
5. **Keep actions thin**: Actions should only handle API calls — put business logic in Server Components
6. **Group related actions**: Keep model-specific actions in dedicated folders
7. **Validate on both sides**: Client-side validation for UX, server-side for security
8. **Return consistent shapes**: Standard actions return `body`, custom actions may return full response

## Admin Panel Best Practices

### Admin Background & Card Conventions

**Background layers (bottom → top):**

1. **Static canvas** — Midnight Ink (`#05060f`) + 60px dot-grid SVG overlay at 3% opacity. `z-[-10]`, GPU-composited, no animation. This is the fixed base layer.

2. **Faint outline shapes** — 4 large thin-stroke SVG geometric shapes (circle, hexagon, rounded-rect, sweeping arc) using Steel Border / Frost Link hairline tones at 0.06–0.10 opacity. `fill="none"`, `strokeWidth="1"`. Sized to mostly bleed off-screen for an architectural blueprint feel. Fully static — no animation. Rendered before the orbs so orbs paint on top.

3. **Ambient orbs** — `<AmbientBackground />` component renders 3 radial-gradient orbs (55vw/48vw/40vw, `filter: blur(100-130px)`, opacity 0.08–0.18) that drift in figure-eight paths using only `transform: translate() scale()` animation. Each orb is its own GPU composited layer (`will-change: transform`). `z-0`, `pointer-events: none`. Respects `prefers-reduced-motion: reduce` by freezing at static offsets. Mounted once in `admin/layout.tsx` so the animation persists across page navigation without restarting.

4. **Content** — sidebar, header, main content at `z-[1]` and above.

```tsx
// admin/layout.tsx — the three-layer stack
<div className="relative flex h-screen overflow-hidden bg-[#05060f]">
  {/* Layer 1: static canvas */}
  <div className="fixed inset-0 -z-10 bg-[#05060f]" aria-hidden="true">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] bg-[length:60px_60px] opacity-40" />
  </div>
  {/* Layer 2: ambient orbs */}
  <AmbientBackground />
  {/* Layer 3: content */}
  <AdminSidebar />
  ...
</div>
```

**Card styling in admin:** Use `<Card variant="glass">` in the admin route. This applies the glass elevation stack AND the `glass-card-hover-active` conic-border animation — on hover, a 1px Electric Iris → Frost Link conic-gradient border fades in (opacity 0→1) and rotates 360° over 4s. Never use `bg-card` or `shadow-subtle-4` directly on card wrappers. For non-Card elements (e.g., card-view divs in DataTable), use `className="glass-card glass-card-hover-active"`.

This ensures the glass backdrop-blur works (parent must have `relative` stacking context) and prevents generic shadcn defaults from overriding the AuthKit elevation.

**Input focus state in admin:** The Input component uses `focus:border-ring focus:ring-3 focus:ring-ring/50` — a Frost Link cool-blue glow unified with button `focus-visible` rings. Also adds `hover:border-frost-link/20` for hover brightening. All form controls share the same interaction language: rest `border-steel-border/60`, hover brightens to Frost Link, focus shows Frost Link glow ring.

### Standard Page Pattern (Server Component)

Every admin listing page follows this structure:
```
src/app/admin/<entity>/
├── page.tsx              # Server Component: fetch data, pass to client
├── <entity>-client.tsx   # Client component: view toggle (table/cards), pagination, actions
└── loading.tsx           # Skeleton loading state
```

**`page.tsx`** — Fetches data, computes pagination URLs, passes to client:
```tsx
export default async function AdminPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const result = await gets(setQuery, projection);
  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/<entity>?page=${page - 1}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/<entity>?page=${page + 1}` : "";
  return <AdminClient items={items} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} />;
}
```

**Responsive DataTable Pattern (`<entity>-client.tsx`)**:
The `DataTable` component supports both table and card views. On desktop, a traditional table renders; on mobile (or via toggle), items render as stacked glass cards. Use `cardView`/`onViewToggle` state + `renderCard` prop:
```tsx
const [cardView, setCardView] = useState(false);

<DataTable
  columns={columns}
  data={items}
  keyExtractor={(item) => item._id}
  cardView={cardView}
  onViewToggle={() => setCardView((v) => !v)}
  renderCard={(item) => (
    <div className="glass-card glass-card-hover-active rounded-xl p-4 space-y-3">
      {/* Card content matching column structure */}
    </div>
  )}
/>
```
Use `hideOnCard: true` on column definitions to exclude fields from the auto-generated card view when no custom `renderCard` is provided.

### Loading States
- Use `shadcn/ui` `Skeleton` component for data lists while loading.
- Use `loading.tsx` in Next.js App Router to automatically wrap Server Components with skeleton loaders.
- Use the `Loader2` icon from `lucide-react` with `animate-spin` inside buttons during form submission.

### Error Handling
- All Server Actions **must** be wrapped in `try...catch(error: unknown)` and safely return `{ success: false, body: { message: error instanceof Error ? error.message : "Unknown error" } }`.
- Use Next.js Error Boundaries (`error.tsx` and `global-error.tsx`).
- Always provide user-friendly error messages and a "Try again" (reset) button.

### Performance & Security
- **Images**: Always use `next/image` (`<Image />`) instead of standard `<img>` tags.
- **Code Splitting**: Lazy load heavy client components using `next/dynamic`.
- **Cookies**: Authentication JWT tokens are stored in `httpOnly` secure cookies via Next.js Server Actions.
- **Accessibility**: Interactive elements must have proper focus rings: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
