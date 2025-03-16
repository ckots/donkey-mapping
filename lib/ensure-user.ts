import { supabase } from "@/lib/supabase"

/**
 * Ensures that a user record exists in the users table
 * This is useful when the auth user exists but the corresponding record in the users table might not
 *
 * @param userId - The user ID to check
 * @param userData - Optional user data to use when creating the user
 * @returns Object containing success status and any error
 */
export async function ensureUserExists(userId: string, userData?: any) {
  try {
    // Check if user exists in the users table
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // An error occurred that's not "not found"
      throw checkError
    }

    if (existingUser) {
      // User already exists
      return { success: true, error: null }
    }

    // Get user data from auth if not provided
    let userDetails = userData
    if (!userDetails) {
      const { data: authUser, error: authError } = await supabase.auth.getUser(userId)
      if (authError) throw authError
      userDetails = authUser.user
    }

    // Create user record
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email: userDetails.email,
      name: userDetails.user_metadata?.name || userDetails.user_metadata?.full_name || "User",
      role: userDetails.user_metadata?.role || "data_collector",
      status: "approved",
    })

    if (insertError) throw insertError

    return { success: true, error: null }
  } catch (error) {
    console.error("Error ensuring user exists:", error)
    return { success: false, error: error.message }
  }
}

