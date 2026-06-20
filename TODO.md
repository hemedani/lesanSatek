# LesanSatek Project TODO.md
**Project**: LesanSatek – Organizational Process Management System
**Goal**: Multi-organization web app with visual process builder for defining and managing purchasing workflows, hierarchical org structures, and request tracking.
**Tech stack**: Deno + Lesan backend, Next.js (latest) frontend, MongoDB, Docker, multi-lang (fa/en/ar/zh/pt/es/nl/tr/ru), JWT auth, shadcn/ui.

**Workflow rules**:
- Always read `CONTINUE.md` first as your system prompt.
- Work **one step at a time** from this TODO.md.
- After finishing a step: mark it `[x]`, add any notes, then run the exact git commit procedure described in root AGENTS.md.
- Never skip steps. Never use `git reset`.
- Update this TODO.md and commit after every single step.
- When stuck, ask for clarification.

## Phase 0: Project Skeleton
- [x] `git init` in root
- [x] Create `.gitignore` (standard for Deno + Next.js + Docker)
- [x] Create root `AGENTS.md`
- [x] Create root `TODO.md`
- [x] Create root `CONTINUE.md`
- [x] Create `back/` folder with full Deno + Lesan backend
  - [x] deno.json, mod.ts, Dockerfile
  - [x] models/ (User, File, Tag, Organization, Department, Employee, Unit, Process, ProcessStep, PurchasingRequest)
  - [x] src/ (all CRUD action modules for each model)
  - [x] utils/ (context, auth, pagination, error handling)
  - [x] back/AGENTS.md, TODO.md, CONTINUE.md
- [ ] Create `front/` folder with Next.js + shadcn/ui skeleton
- [ ] Create `.env.backend` and `.env.frontend` templates
- [ ] Create empty `docker-compose.dev.yml` and `docker-compose.yml`
- [ ] Commit the skeleton

## Phase 1: Backend Completion
- [ ] Generate type declarations for frontend
- [ ] Test backend locally with `deno task bc-dev`
- [ ] Verify playground access and API exploration

## Phase 2: Frontend Skeleton (Next.js + shadcn/ui)
- [ ] Create Next.js app with TypeScript, Tailwind, ESLint
- [ ] Install dependencies (next-intl, zustand, react-hook-form, zod, jose, shadcn/ui)
- [ ] Setup next-intl with RTL/LTR support (fa/en/ar/zh/pt/es/nl/tr/ru)
- [ ] Setup shadcn/ui component library
- [ ] Create folder structure (src/app, src/components, src/stores, src/actions)
- [ ] Setup auth context + JWT cookie handling
- [ ] Create front Dockerfile
- [ ] Update docker-compose files

## Phase 3: Core User-Facing Pages
- [ ] Public landing page
- [ ] Login / Register page
- [ ] Organization management (create, list, update)
- [ ] Department management within organizations
- [ ] Employee management (create, assign to departments)
- [ ] Unit tree management (create hierarchy)
- [ ] Visual process builder (create processes with ordered steps)
- [ ] Purchasing request submission and tracking

## Phase 4: Advanced Admin Panel
- [ ] Protected admin routes
- [ ] Dashboard overview with statistics
- [ ] Full CRUD management for all models
- [ ] User management with role assignment

## Phase 5: Polish & Production
- [ ] Full i18n on all pages
- [ ] Responsive + mobile perfect
- [ ] Form validation (Zod + React Hook Form)
- [ ] Error handling & loading states
- [ ] Security audit
- [ ] Docker Compose full dev + prod setup
- [ ] Deploy-ready
- [ ] Final tests + cleanup

**How to proceed**: Open `CONTINUE.md`, tell the AI agent: "Continue with next unchecked step from TODO.md". After each step the agent must update TODO.md and commit.
