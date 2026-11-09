import { cookies, headers } from "next/headers"

import { ACTIVE_ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/session-cookies"

export async function getServerHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_COOKIE)?.value
  const activeRoleId = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value
  return { token, activeRoleId }
}

export function withActiveRole<T extends Record<string, unknown>>(
  data: T,
  activeRoleId?: string,
): T & { activeRoleId?: string } {
  if (!activeRoleId) return data
  return { ...data, activeRoleId }
}

export async function isSecureRequest(): Promise<boolean> {
  const headersList = await headers();
  const proto = headersList.get("x-forwarded-proto") || headersList.get("x-forwarded-scheme");
  return proto === "https";
}
