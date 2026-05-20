import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuth = !!req.auth
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")

  if (isDashboardPage && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*"],
}
