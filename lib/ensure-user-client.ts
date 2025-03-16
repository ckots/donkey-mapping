import { supabase } from "@/lib/supabase"

/**
 * Client-side helper to ensure a user exists by calling the server API
 */
export async function ensureUserExistsClient() {
  try {
    // First try the API route
    const response = await fetch("/api/users/ensure", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json()
      return { success: data.success, error: data.error }
    }

    // If API route fails, try direct check and fallback to server action
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "No authenticated session" }
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single()

    if (!checkError && existingUser) {
      return { success: true, error: null }
    }

    // If we get here, we need to create the user but can't do it directly
    // Return an error that suggests using the server action
    return {
      success: false,
      error: "User record does not exist. Please use the server action to create it.",
    }
  } catch (error) {
    console.error("Error ensuring user exists (client):", error)
    return { success: false, error: error.message }
  }
}

