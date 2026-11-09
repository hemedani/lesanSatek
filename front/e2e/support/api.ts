import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { Cookie } from "@playwright/test"

import {
  ACTIVE_ROLE_COOKIE,
  ROLE_NAME_COOKIE,
  TOKEN_COOKIE,
} from "../../src/lib/session-cookies"
import { ALL_PERSONA_KEYS, PERSONAS, type Persona, type PersonaKey } from "./personas"

export const BACKEND_URL = (
  process.env.E2E_BACKEND_URL ?? "http://localhost:1370"
).replace(/\/$/, "")

export const APP_URL = (process.env.E2E_BASE_URL ?? "http://localhost:3000")
  .replace(/\/$/, "")

export const AUTH_DIR = join(process.cwd(), "e2e", ".auth")

export interface LesanRole {
  roleId: string
  name: string
  scopeType?: string
  scopeId?: string
}

export interface LesanUser {
  _id: string
  first_name?: string
  last_name?: string
  email?: string
  roles?: LesanRole[]
  features?: { feature: string }[]
  units?: { _id?: string; name?: string }[]
  organizations?: { _id?: string; name?: string }[]
}

export interface LesanResponse<T> {
  success: boolean
  body: T | { message?: string }
}

/** Minimal Lesan RPC client — same contract the Next.js Server Actions use. */
export async function lesan<T>(
  payload: Record<string, unknown>,
  options: { token?: string } = {},
): Promise<LesanResponse<T>> {
  const response = await fetch(`${BACKEND_URL}/lesan`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.token ? { token: options.token } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(
      `Lesan call failed (${response.status}): ${await response.text()}`,
    )
  }

  return (await response.json()) as LesanResponse<T>
}

export async function loginViaApi(
  email: string,
  password: string,
): Promise<{ token: string; user: LesanUser }> {
  const result = await lesan<{ token: string; user: LesanUser }>({
    service: "main",
    model: "user",
    act: "login",
    details: {
      set: { email, password },
      get: {
        token: 1,
        user: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          roles: 1,
          features: 1,
          units: { _id: 1, name: 1 },
          organizations: { _id: 1, name: 1 },
        },
      },
    },
  })

  if (!result.success) {
    throw new Error(
      `Login failed for ${email}: ${
        (result.body as { message?: string })?.message ?? "unknown error"
      }`,
    )
  }

  return result.body as { token: string; user: LesanUser }
}

export function pickRole(user: LesanUser, roleName: string): LesanRole {
  const role = (user.roles ?? []).find((r) => r.name === roleName)

  if (!role) {
    throw new Error(
      `User ${user.email} has no "${roleName}" role (has: ${
        (user.roles ?? []).map((r) => r.name).join(", ")
      })`,
    )
  }

  return role
}

function cookiesFor(
  origin: string,
  token: string,
  role: LesanRole,
): Cookie[] {
  const url = new URL(origin)
  const base = {
    domain: url.hostname,
    path: "/",
    expires: -1,
    secure: url.protocol === "https:",
    sameSite: "Lax" as const,
  }

  return [
    { ...base, name: TOKEN_COOKIE, value: token, httpOnly: true },
    { ...base, name: ACTIVE_ROLE_COOKIE, value: role.roleId, httpOnly: false },
    { ...base, name: ROLE_NAME_COOKIE, value: role.name, httpOnly: false },
  ]
}

export interface PersonaMeta {
  userId: string
  roleNames: string[]
  featureNames: string[]
  units: string[]
  organizations: string[]
}

export interface PersonaSession {
  persona: Persona
  token: string
  role: LesanRole
  user: LesanUser
  cookies: Cookie[]
  storageStatePath: string
  meta: PersonaMeta
}

const metaOf = (user: LesanUser): PersonaMeta => ({
  userId: user._id,
  roleNames: (user.roles ?? []).map((r) => r.name),
  featureNames: (user.features ?? []).map((f) => f.feature),
  units: (user.units ?? []).map((u) => String(u._id ?? "")).filter(Boolean),
  organizations: (user.organizations ?? [])
    .map((o) => String(o._id ?? ""))
    .filter(Boolean),
})

/**
 * Authenticates through the backend API (not the UI) and persists a Playwright
 * storage state, so specs start already signed in as the right role.
 */
export async function createPersonaSession(
  key: PersonaKey,
): Promise<PersonaSession> {
  const persona = PERSONAS[key]
  const { token, user } = await loginViaApi(persona.email, persona.password)
  const role = pickRole(user, persona.roleName)
  const cookies = cookiesFor(APP_URL, token, role)
  const meta = metaOf(user)

  mkdirSync(AUTH_DIR, { recursive: true })
  const storageStatePath = join(AUTH_DIR, `${key}.json`)

  writeFileSync(
    storageStatePath,
    JSON.stringify({ cookies, origins: [] }, null, 2),
    "utf8",
  )
  writeFileSync(
    join(AUTH_DIR, `${key}.meta.json`),
    JSON.stringify(meta, null, 2),
    "utf8",
  )

  return { persona, token, role, user, cookies, storageStatePath, meta }
}

/** Role names / feature flags captured during setup (no network needed). */
export function readPersonaMeta(key: PersonaKey): PersonaMeta {
  const path = join(AUTH_DIR, `${key}.meta.json`)

  try {
    return JSON.parse(readFileSync(path, "utf8")) as PersonaMeta
  } catch {
    throw new Error(
      `Missing ${path}. Run the setup project first (pnpm test:e2e).`,
    )
  }
}

/** Path to the storage state written by `e2e/setup/auth.setup.ts`. */
export function storageStateFor(key: PersonaKey): string {
  return join(AUTH_DIR, `${key}.json`)
}

/** Reads the backend token captured in a persona's storage state. */
export function tokenFor(key: PersonaKey): string {
  const path = storageStateFor(key)
  const state = JSON.parse(readFileSync(path, "utf8")) as {
    cookies: { name: string; value: string }[]
  }
  const cookie = state.cookies.find((c) => c.name === TOKEN_COOKIE)

  if (!cookie) {
    throw new Error(
      `No auth token in ${path}. Did the setup project run? (pnpm test:e2e)`,
    )
  }

  return cookie.value
}

/** Active role id captured in a persona's storage state. */
export function activeRoleIdFor(key: PersonaKey): string {
  const path = storageStateFor(key)
  const state = JSON.parse(readFileSync(path, "utf8")) as {
    cookies: { name: string; value: string }[]
  }
  const cookie = state.cookies.find((c) => c.name === ACTIVE_ROLE_COOKIE)

  if (!cookie) {
    throw new Error(`No activeRoleId in ${path}. Did the setup project run?`)
  }

  return cookie.value
}

export async function callAs<T>(
  key: PersonaKey,
  payload: Record<string, unknown>,
): Promise<LesanResponse<T>> {
  return lesan<T>(payload, { token: tokenFor(key) })
}

/**
 * `purchasingRequest.getPendingByUnit` for a persona — the exact query the
 * "در انتظار تأیید" page runs, used to cross-check what the UI renders.
 */
export async function pendingApprovalsFor(key: PersonaKey) {
  const result = await callAs<
    { _id: string; title?: string; status?: string }[]
  >(key, {
    service: "main",
    model: "purchasingRequest",
    act: "getPendingByUnit",
    details: {
      set: { activeRoleId: activeRoleIdFor(key), page: 1, limit: 50 },
      get: { _id: 1, title: 1, status: 1 },
    },
  })

  if (!result.success) {
    throw new Error(
      `getPendingByUnit failed: ${
        (result.body as { message?: string })?.message ?? "unknown"
      }`,
    )
  }

  return result.body as { _id: string; title?: string; status?: string }[]
}

/** `user.dashboardStatistic` pending badge for a unit-head persona. */
export async function pendingBadgeCountFor(key: PersonaKey): Promise<number> {
  const result = await callAs<{ pendingApprovalCount?: number }>(key, {
    service: "main",
    model: "user",
    act: "dashboardStatistic",
    details: {
      set: { activeRoleId: activeRoleIdFor(key), type: "unitHead" },
      get: { pendingApprovalCount: 1 },
    },
  })

  if (!result.success) return -1

  return (result.body as { pendingApprovalCount?: number })
    .pendingApprovalCount ?? 0
}

export { ALL_PERSONA_KEYS }
