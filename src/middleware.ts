import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuth = !!req.auth
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin")

  if ((isDashboardPage || isAdminPage) && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl.origin))
  }

  // Admin access control
  if (isAdminPage && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
