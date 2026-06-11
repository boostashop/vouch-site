import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

let authHost = ""
if (process.env.AUTH_URL) {
  try {
    authHost = new URL(process.env.AUTH_URL).hostname
  } catch {}
}

// Hosts that are the main app (not custom domains)
function isMainHost(hostname: string): boolean {
  if (hostname.startsWith("localhost")) return true
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+/)) return true // IP addresses
  const appHost = process.env.NEXT_PUBLIC_APP_HOST
  if (appHost && hostname === appHost) return true
  if (authHost && hostname === authHost) return true
  if (authHost && hostname === `www.${authHost}`) return true
  return false
}

export default auth((req: NextRequest & { auth?: unknown }) => {
  const hostname = req.headers.get("host")?.split(":")[0] ?? ""

  // Custom domain: rewrite to /_domain/[host] route
  if (
    !isMainHost(hostname) &&
    !req.nextUrl.pathname.startsWith("/_domain") &&
    !req.nextUrl.pathname.startsWith("/_next") &&
    !req.nextUrl.pathname.startsWith("/api") &&
    !req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js)$/)
  ) {
    const url = req.nextUrl.clone()
    url.pathname = `/_domain/${hostname}`
    return NextResponse.rewrite(url)
  }

  // Auth protection
  const isAuth = !!(req as any).auth
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin")

  // Redirect logged-in users off the landing page to avoid the "Sign In" flash
  // and the blank-page symptom from stale ISR cache.
  if (req.nextUrl.pathname === "/" && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  if ((isDashboardPage || isAdminPage) && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl.origin))
  }

  if (isAdminPage && (req as any).auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
