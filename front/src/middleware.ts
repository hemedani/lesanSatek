import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/login", "/register"]

const panelRoutes = [
  "/admin",
  "/ordinary",
  "/unit-head",
  "/requests",
  "/storehead",
  "/orghead",
]

const rolePanelMap: Record<string, string> = {
  OrgHead: "/orghead",
  Manager: "/admin",
  Admin: "/admin",
  UnitHead: "/unit-head",
  StoreHead: "/storehead",
  Employee: "/requests",
  Ordinary: "/ordinary",
}

export function middleware(request: NextRequest) {
  // Server Functions (Server Actions) are POST requests to the route where
  // they are used. Redirecting them here breaks the client (e.g. "An
  // unexpected response was received from the server"), and auth is enforced
  // inside each action anyway. Never redirect POSTs.
  if (request.method === "POST") {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  if (publicRoutes.includes(pathname)) {
    if (token) {
      const roleName = request.cookies.get("roleName")?.value
      const target = (roleName && rolePanelMap[roleName]) || "/admin"
      return NextResponse.redirect(new URL(target, request.url))
    }
    return NextResponse.next()
  }

  const isPanelRoute = panelRoutes.some((prefix) => pathname.startsWith(prefix))
  if (isPanelRoute) {
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
