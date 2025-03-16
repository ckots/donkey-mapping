import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Get the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_KEY // Service role key

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Supabase environment variables are not configured correctly" },
        { status: 500 },
      )
    }

    // Get request body
    const body = await request.json()
    const { userId, email, name, role = "data_collector" } = body

    if (!userId || !email) {
      return NextResponse.json({ success: false, error: "User ID and email are required" }, { status: 400 })
    }

    // Create admin client with service role key
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    // Check if user already exists
    const { data: existingUser, error: checkError } = await adminSupabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking user:", checkError)
      return NextResponse.json({ success: false, error: checkError.message }, { status: 500 })
    }

    if (existingUser) {
      // User already exists
      return NextResponse.json({ success: true, exists: true })
    }

    // Create the user record with service role
    const { error: insertError } = await adminSupabase.from("users").insert({
      id: userId,
      email: email,
      name: name || "User",
      role: role,
      status: "approved",
    })

    if (insertError) {
      console.error("Error creating user:", insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, created: true })
  } catch (error) {
    console.error("Error in direct-create API:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

