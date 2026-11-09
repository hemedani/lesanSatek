export const TOKEN_COOKIE = "satek_token"
export const ACTIVE_ROLE_COOKIE = "satek_activeRoleId"
export const ROLE_NAME_COOKIE = "satek_roleName"

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export function readClientCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ""
}

export function writeClientCookie(name: string, value: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`
}
