# LesanSatek Design System
> blueprint on midnight glass

**Theme:** dark  
**Direction:** RTL (Persian only)  
**Language:** Persian (fa) ONLY — never introduce English or any second-language UI text.  
**Framework:** Next.js 16 + Tailwind CSS v4 + shadcn/ui (base-ui) + next-themes

---

## North Star

LesanSatek uses a midnight blueprint language: near-black canvas, cool blue-gray typography, and a single Electric Iris purple that marks the only thing the user should press. Surfaces are matte and flat — no glossy gradients, no heavy drop shadows. Instead, soft blue glows and 1–2 px inset hairline strokes create the feeling of an interface drawn in light on dark paper. The result is technical, precise, and quietly luminous.

Every screen must feel like a luminous blueprint panel that belongs to the same visual family.

---

## 1. Tokens — Colors

| Name            | Value                          | Token                     | Role |
|-----------------|--------------------------------|---------------------------|------|
| Midnight Ink    | `#05060f`                      | `--color-midnight-ink`    | Page canvas / primary surface |
| Graphite Plate  | `#2f343e`                      | `--color-graphite-plate`  | Elevated cards, modals, panels |
| Steel Border    | `#3f4959`                      | `--color-steel-border`    | Hairline borders & dividers |
| Fog             | `#81899b`                      | `--color-fog`             | Helper / secondary metadata |
| Pebble          | `#9da7ba`                      | `--color-pebble`          | Muted body / disabled text |
| Moonlight       | `#c7d3ea`                      | `--color-moonlight`       | Primary body & icon color |
| Ice             | `#d1e4fa`                      | `--color-ice`             | Strong secondary labels / badges |
| Glacier         | `#d8ecf8`                      | `--color-glacier`         | Headings & section titles |
| Frost Link      | `#b6d9fc`                      | `--color-frost-link`      | Active links / accent text |
| Electric Iris   | `#663af3`                      | `--color-electric-iris`   | Primary CTA & current-step accent |
| Ember           | `#e46d4c`                      | `--color-ember`           | Warning / destructive accent |
| Azure           | `#027dea`                      | `--color-azure`           | Informational accent |
| Cipher Mint     | `#269684`                      | `--color-cipher-mint`     | Success accent |
| Blueprint Glow  | `linear-gradient(0deg, #d8ecf8 0%, #98c0ef 100%)` | `--color-blueprint-glow` | Soft highlight gradient |

**Rule:** Almost all decorative color lives in shadows and strokes, not in fills.

---

## 2. Tokens — Typography

- **Workhorse:** Untitled Sans (or Inter) — 400/500/600/700  
- **Display (rare):** aeonikPro / Aeonik — only for large section headlines  
- **Eyebrow / label:** dotDigital / JetBrains Mono — 15 px, 0.1 em tracking, `tnum`

### Type Scale

| Role        | Size | Line-height | Token              |
|-------------|------|-------------|--------------------|
| caption     | 12px | 1.5         | `--text-caption`   |
| body-sm     | 14px | 1.43        | `--text-body-sm`   |
| body        | 16px | 1.5         | `--text-body`      |
| subheading  | 18px | 1.33        | `--text-subheading`|
| heading-sm  | 24px | 1.2         | `--text-heading-sm`|
| heading     | 28px | 1.17        | `--text-heading`   |
| display     | 48px | 1.14        | `--text-display`   |

Letter-spacing for UI text: `-0.01em`.

---

## 3. Tokens — Spacing, Radius, Shadows

**Base unit:** 4 px  
**Density:** comfortable

### Spacing Scale
4, 8, 12, 16, 20, 24, 32, 36, 40, 48, 56, 100, 120, 200 px

### Border Radius
| Element   | Value   |
|-----------|---------|
| Cards     | 10–16 px|
| Modals    | 12–16 px|
| Pills     | 999 px  |
| Badges    | 6 px    |
| Inputs    | 2 px    |
| Buttons   | 2 px    |

### Shadows (preferred)
- Soft outer blue glow: `rgba(186, 207, 247, 0.32) 0 0 6–12px`
- Inset hairlines: `rgba(186, 215, 247, 0.06–0.12) 0 0 0 1px inset`
- Never heavy black drop shadows.

### Layout
- Page max-width: 1200 px (content areas may be wider when needed)
- Card padding: 24 px (comfortable)
- Element gap: 8–16 px
- Always use **logical properties** (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`). Never `left`/`right`.

---

## 4. Core UI Rules (learned from production redesign)

### 4.1 Icons
- Minimum visible size: **20–24 px** effective.
- Stroke weight consistent across the page.
- Never use 12–14 px icons that disappear on dark backgrounds.
- Icon color: Moonlight by default; Electric Iris for active/current state.
- Leading page-header icons must match the same scale as all other icons on the page.

### 4.2 Cards
- Background: Graphite Plate
- Radius: 10–16 px
- Padding: 24 px
- Soft inset hairline + optional subtle blue glow
- Prefer **cards / stacked sections** over dense tables for any list that must work on mobile.
- Tables are allowed only when the data is truly tabular **and** a responsive card fallback exists.

### 4.3 Process Progress / Stepper
- Must be the most scannable element on any workflow page.
- Horizontal on desktop, vertical on mobile.
- Current step: Electric Iris + soft glow.
- Completed: muted but readable.
- Future: de-emphasized.
- Labels, actor, and timestamp must be legible without hovering.

### 4.4 History / Timeline
- Vertical timeline with clear dots + connecting line.
- Each entry: actor, action title, relative/absolute time, optional comment.
- Expandable details.
- **Never show raw MongoDB / object IDs.**  
  When an ID appears, resolve it via the existing Server Action for that model and display the human-readable name.  
  While loading → small non-blocking spinner.  
  On failure → short Persian fallback (“اطلاعات در دسترس نیست”).

### 4.5 Modals / Dialogs (elevated treatment)
Every modal must follow this structure:

```
┌─────────────────────────────────────────┐
│  HEADER  (title + optional subtitle + ✕) │  ← soft bottom divider
├─────────────────────────────────────────┤
│                                         │
│  BODY   (generous 24–32 px padding)     │  ← soft internal dividers
│                                         │
├─────────────────────────────────────────┤
│  FOOTER (actions)                       │  ← soft top divider
└─────────────────────────────────────────┘
```

**Required visual treatment:**
- Surface: Graphite Plate
- Radius: 12–16 px
- **Animated border stroke** (1.5–2 px) using Blueprint-glow blue.  
  Slow, elegant travel or pulse.  
  Respects `prefers-reduced-motion` → static thicker hairline.
- Comfortable outer margin from viewport edges (never edge-to-edge).
- Soft outer glow so the modal lifts off the dimmed backdrop.
- Backdrop: stronger dim + optional subtle blur.
- Entrance: short scale + fade or slight upward slide (GPU-friendly).
- Close button: large hit area, Moonlight icon, subtle hover glow.
- Primary button = Electric Iris, secondary = Ghost.
- All text Persian-only.

### 4.6 Buttons
- **Primary CTA:** Electric Iris fill, white text, 2 px radius, used at most once per viewport.
- **Ghost:** transparent + inset hairline, Moonlight text.
- **Pill / nav:** 999 px radius for top-bar links.
- Padding: 10 px 16 px minimum.
- Focus-visible ring required.

### 4.7 Persian-only rule
- Every user-facing string (labels, badges, statuses, empty states, tooltips, validation, history actions, button text) **must** be Persian.
- Backend enums or English keys must be mapped through a Persian filter/layer before render.
- No English UI text is ever acceptable.

### 4.8 Accessibility & Motion
- Interactive elements need clear `focus-visible` rings.
- All animations must respect `prefers-reduced-motion`.
- Prefer `transform` + `opacity` for animations (GPU-composited).
- Color contrast must remain readable on Midnight Ink.

### 4.9 Background System (admin & main app shells)
- Static Aurora Canvas: Midnight Ink + subtle SVG dot-grid.
- Ambient Orb Layer: 3 large soft orbs (Electric Iris / Frost / Graphite blend), slow drift, `will-change: transform`, frozen under reduced-motion.
- Optional faint geometric outline shapes for blueprint structure.

---

## 5. Component Inventory (shadcn + extensions)

Use existing shadcn/ui primitives and extend only with Tailwind utilities that match the tokens above:

- Card, Badge, Button, Dialog, Separator, Avatar, Tabs, Select, Input, Textarea, Form, Table (with card fallback), Skeleton, Tooltip, DropdownMenu, etc.

New or extended patterns that must be reused:
- Animated-stroke Modal
- Process Stepper
- History Timeline (with ID resolution)
- Status Badge (Persian mapped)
- Icon container (consistent 20–24 px scale)

---

## 6. Development Conventions

- Package manager: **pnpm** only.
- Server Actions only for backend communication.
- Logical CSS properties exclusively.
- Mobile-first.
- Never introduce new third-party UI libraries without explicit approval.
- When adding any new page, the first question is: “Does this follow the same visual language as the already-redesigned request detail page?”

---

## 7. Quick Checklist for Any New Page

- [ ] All icons ≥ 20 px and consistent
- [ ] Cards preferred over tables where mobile matters
- [ ] Process / status progress is the most prominent element (if applicable)
- [ ] History / activity resolves IDs to human names
- [ ] Every modal uses the elevated animated-stroke treatment
- [ ] Zero English UI strings
- [ ] Soft blue glows + hairlines, no heavy shadows
- [ ] Comfortable spacing & logical properties
- [ ] Reduced-motion respected
- [ ] Persian RTL throughout
