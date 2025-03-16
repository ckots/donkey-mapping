import { supabase } from "@/lib/supabase"

/**
 * Creates a user record in the users table if it doesn't already exist
 * This is a fallback in case the database trigger doesn't work
 */
export async function createUserIfNotExists() {
  try {
    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("No active session:", sessionError)
      return { success: false, error: "No active session" }
    }

    // Check if user already exists - use a more reliable query
    const { count, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("id", session.user.id)

    if (countError) {
      console.error("Error checking if user exists:", countError)
      // Continue to try the API route as a fallback
    } else if (count && count > 0) {
      // User already exists
      return { success: true, exists: true }
    }

    // Try the API route first since it uses the service role
    try {
      const apiResult = await createUserViaApi(
        session.user.id,
        session.user.email,
        session.user.user_metadata?.name || session.user.user_metadata?.full_name || "User",
      )

      if (apiResult.success) {
        return apiResult
      }
    } catch (apiError) {
      console.warn("API route failed, falling back to direct insert:", apiError)
    }

    // As a last resort, try direct insert with ON CONFLICT DO NOTHING
    const { error: insertError } = await supabase.rpc("create_user_if_not_exists", {
      user_id: session.user.id,
      user_email: session.user.email,
      user_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "User",
      user_role: "data_collector",
    })

    if (insertError) {
      console.error("Error creating user via RPC:", insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, created: true }
  } catch (error) {
    console.error("Error in createUserIfNotExists:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Creates a user via the API route (uses service role)
 */
async function createUserViaApi(userId, email, name) {
  try {
    const response = await fetch("/api/users/direct-create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        email,
        name,
        role: "data_collector",
      }),
    })

    return await response.json()
  } catch (error) {
    console.error("Error creating user via API:", error)
    return { success: false, error: error.message }
  }
}

