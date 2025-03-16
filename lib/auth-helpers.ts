import { supabase } from "@/lib/supabase"

/**
 * Two-step signup with OTP verification
 *
 * This function first creates a user with password, then requests an OTP code.
 * This approach ensures we get OTP codes instead of magic links.
 *
 * @param email - User's email address
 * @param password - User's password
 * @param userData - Additional user data (name, etc.)
 * @returns Object containing data and error properties
 */
export const signUpWithEmailOTP = async (email, password, userData = {}) => {
  try {
    // First, create the user with password
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: null, // Explicitly disable email confirmation URL
      },
    })

    if (signUpError) throw signUpError

    // Now explicitly request an OTP code
    const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // User already created above
        channel: "email", // Explicitly request email channel
        emailRedirectTo: null, // Force OTP by setting this to null
      },
    })

    if (otpError) throw otpError

    return { data: signUpData, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

/**
 * Email OTP Sign-in Function
 *
 * This function sends a one-time password (OTP) to the provided email address.
 * It explicitly sets emailRedirectTo to null to force OTP delivery instead of magic links.
 *
 * @param email - The email address to send the OTP to
 * @param shouldCreateUser - Whether to create a new user if one doesn't exist (default: true)
 * @returns Object containing data and error properties
 */
export const signInWithEmailOTP = async (email, shouldCreateUser = true) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: shouldCreateUser,
        emailRedirectTo: null, // Force OTP by setting this to null
        channel: "email", // Explicitly request email channel
      },
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

/**
 * Email OTP Verification Function
 *
 * This function verifies the OTP entered by the user.
 *
 * @param email - The email address the OTP was sent to
 * @param token - The OTP token entered by the user
 * @returns Object containing data and error properties
 */
export const verifyEmailOTP = async (email, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: "email",
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

/**
 * Password Reset Request Function
 *
 * This function sends a password reset email.
 *
 * @param email - The email address to send the reset link to
 * @returns Object containing data and error properties
 */
export const resetPassword = async (email) => {
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

