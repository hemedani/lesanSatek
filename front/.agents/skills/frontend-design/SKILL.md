---
name: frontend-design
description: LesanSatek / AuthKit blueprint design system. Every public and marketing UI must follow the midnight glass language defined in .agents/THEME/DESIGN.md. Persian-only, RTL, no templated SaaS defaults.
---

# Frontend Design — LesanSatek (AuthKit Blueprint)

You are the design lead for **ساتک** (LesanSatek). The visual identity is already locked: **blueprint on midnight glass**. Do not invent a new palette or aesthetic.

## Non-negotiable constraints

1. **Language & direction**
   - Persian (fa) only. Never introduce English UI strings.
   - `dir="rtl"` everywhere. Use logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`). Never `left`/`right`.

2. **Canvas**
   - Sole background: Midnight Ink `#05060f`.
   - Always layer: `bg-blueprint-grid` + optional `blueprint-glow` + ambient radial orbs (GPU `blur` + `transform` only).

3. **Color roles (strict)**
   - Text hierarchy: Glacier `#d8ecf8` (headings) → Moonlight `#c7d3ea` (body) → Pebble/Fog (secondary).
   - **Electric Iris `#663af3`** is the *only* filled primary CTA color — at most one primary CTA per viewport.
   - No saturated fills on cards, banners, or backgrounds. Accent lives in borders, glows, and the single CTA.

4. **Surfaces**
   - Cards / elevated panels → `glass-card` (and `glass-card-hover` / `glass-card-active` when interaction warrants).
   - Headers → `glass-header`.
   - Never solid Graphite Plate as a full-page surface on marketing pages; reserve it for small icon tiles and form containers.

5. **Typography**
   - Body / UI: Estedad (already mapped to `--font-sans`).
   - Headings: large, restrained weight (semibold), Glacier color, tight tracking.
   - Eyebrows: small, wide tracking (`tracking-[0.12em]`), Fog color, often flanked by hairline rules.
   - Do not invent new typefaces.

6. **Radius hierarchy**
   - Buttons / inputs: `rounded-sm` (2px).
   - Cards: `rounded-xl` / `rounded-2xl` (10–16px).
   - Pills / nav links: `rounded-full`.

7. **Elevation**
   - Prefer blue-tinted *inset* hairlines and soft inner glows over drop shadows.
   - Shadows stay cool (blue/near-black), never warm.

8. **Signature element**
   - The “blueprint” feel: faint 40px grid, soft top radial wash, thin conic/gradient hairlines on hero cards, monochrome 1.5px stroke icons in Graphite tiles.
   - One memorable moment per page is enough (e.g. gradient text on the hero thesis, or a single conic-border CTA card).

## Marketing / public pages process

1. State the page’s single job in one sentence (Persian).
2. Draft structure: eyebrow → thesis headline → supporting line → primary CTA → secondary ghost → supporting sections with 120px vertical rhythm.
3. Critique against DESIGN.md Do’s/Don’ts before writing code.
4. Prefer existing utilities (`glass-card`, `bg-blueprint-grid`, `text-gradient-blueprint`, `blueprint-glow`) over new CSS.
5. Coming-soon / placeholder pages must reuse the same glass + ambient language — never a plain gray “under construction” block.

## What to avoid (anti-patterns)

- Generic SaaS: cream backgrounds, acid-green accents, heavy drop shadows, 3-column feature grids with colored icon circles.
- Multiple primary buttons competing in the same viewport.
- English labels, LTR assumptions, or `left`/`right` positioning.
- Photography or illustration — the product *is* the UI language.
- Over-animation. Ambient orbs may drift; content motion should be restrained and respect `prefers-reduced-motion`.

## When in doubt

Open and obey `.agents/THEME/DESIGN.md`. Tokens, component recipes, and Do’s/Don’ts there override any generic design instinct.
