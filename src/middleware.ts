import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth")) {
          return true
        }
        // Require token for protected routes
        if (
          req.nextUrl.pathname.startsWith("/dashboard") ||
          req.nextUrl.pathname.startsWith("/profile") ||
          req.nextUrl.pathname.startsWith("/admin")
        ) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ]
}