"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

/**
 * Server action to ensure a user exists in the database
 * This bypasses RLS policies by using the service role client
 */
export async function ensureUserExists() {
  try {
    const cookieStore = cookies()

    // Get the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_KEY // Service role key

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing environment variables:", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
      })
      throw new Error("Supabase environment variables are not configured correctly")
    }

    // First, get the user session using the anon key
    const supabase = createServerActionClient(
      { cookies: () => cookieStore },
      { supabaseUrl, supabaseKey: supabaseAnonKey },
    )

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      throw sessionError
    }

    if (!session) {
      return { success: false, error: "No authenticated session" }
    }

    // Now use the service role key to bypass RLS policies
    if (supabaseServiceKey) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })

      // Check if user already exists
      const { data: existingUser, error: checkError } = await adminSupabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking user with service role:", checkError)
        throw checkError
      }

      if (existingUser) {
        // User already exists
        return { success: true, error: null }
      }

      // Create the user record with service role
      const { error: insertError } = await adminSupabase.from("users").insert({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "User",
        role: "data_collector",
        status: "approved",
      })

      if (insertError) {
        console.error("Error creating user with service role:", insertError)
        throw insertError
      }

      return { success: true, error: null }
    } else {
      // If service key is not available, return an error
      console.error("Service role key not available")
      return {
        success: false,
        error: "Service role key not available. Cannot bypass RLS policies.",
      }
    }
  } catch (error) {
    console.error("Error in ensureUserExists:", error)
    return { success: false, error: error.message }
  }
}

