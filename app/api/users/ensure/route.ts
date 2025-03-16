import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Get the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_KEY // Service role key

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing environment variables in API route:", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
      })
      return NextResponse.json(
        { success: false, error: "Supabase environment variables are not configured correctly" },
        { status: 500 },
      )
    }

    // First, get the user session using the anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error in API route:", sessionError)
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "No authenticated session" }, { status: 401 })
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
        console.error("Error checking user in API route:", checkError)
        return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
      }

      if (existingUser) {
        // User already exists
        return NextResponse.json({ success: true })
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
        console.error("Error creating user in API route:", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } else {
      // If service key is not available, return an error
      console.error("Service role key not available in API route")
      return NextResponse.json(
        { success: false, error: "Service role key not available. Cannot bypass RLS policies." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in ensure user API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

