import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorCode = requestUrl.searchParams.get("error_code")
  const errorDescription = requestUrl.searchParams.get("error_description")

  // Handle errors
  if (error) {
    // Redirect to reset-password page with error parameters
    const redirectUrl = new URL("/reset-password", requestUrl.origin)
    redirectUrl.searchParams.set("error", error)
    if (errorCode) {
      redirectUrl.searchParams.set("error_code", errorCode)
    }
    if (errorDescription) {
      redirectUrl.searchParams.set("error_description", errorDescription)
    }
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Get the redirect URL from the query parameters or use the dashboard
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard"
  const baseUrl = requestUrl.origin

  // Create the full redirect URL
  const fullRedirectUrl = new URL(redirectTo, baseUrl).toString()

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(fullRedirectUrl)
}

