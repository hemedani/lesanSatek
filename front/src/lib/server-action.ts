import { cookies } from "next/headers"

export async function getServerHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  return { token, activeRoleId }
}

export function withActiveRole<T extends Record<string, unknown>>(
  data: T,
  activeRoleId?: string,
): T & { activeRoleId?: string } {
  if (!activeRoleId) return data
  return { ...data, activeRoleId }
}
