import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/login", "/register"]

const panelRoleMap: Record<string, string[]> = {
  "/admin": ["Manager", "Admin", "OrgHead"],
  "/unit-head": ["UnitHead"],
  "/requests": ["Employee", "Ordinary"],
}

const panelFeatureMap: Record<string, string[]> = {
  "/finance": ["canManageBudget"],
  "/vendor": ["canRespondToTender"],
}

function inferRoleFromRoute(pathname: string): string | null {
  for (const [prefix] of Object.entries(panelRoleMap)) {
    if (pathname.startsWith(prefix)) return prefix
  }
  for (const [prefix] of Object.entries(panelFeatureMap)) {
    if (pathname.startsWith(prefix)) return prefix
  }
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  if (publicRoutes.includes(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  const panelPrefix = inferRoleFromRoute(pathname)
  if (panelPrefix) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
