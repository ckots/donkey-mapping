import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ensureUserExists } from "./lib/ensure-user"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth condition
  if (
    !session &&
    (req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/surveys/create"))
  ) {
    // Auth required, redirect to login
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated, ensure they exist in the users table
  if (session) {
    // Only do this for routes that require authentication
    if (
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/surveys/create")
    ) {
      try {
        // Ensure user exists in the database
        await ensureUserExists(session.user.id, session.user)
      } catch (error) {
        console.error("Error ensuring user exists:", error)
        // Continue anyway, as the page might handle this error
      }
    }

    // Check admin condition
    if (req.nextUrl.pathname.startsWith("/admin")) {
      try {
        // Get user role from database
        const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        if (error || userData.role !== "admin") {
          // Not an admin, redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", req.url))
        }
      } catch (error) {
        console.error("Error checking admin role:", error)
        // If there's an error, redirect to dashboard to be safe
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/surveys/create", "/surveys/:path*/edit"],
}

