import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    // Get the environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_KEY // Service role key

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured correctly" },
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
      return NextResponse.json({ error: sessionError.message }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: "No authenticated session" }, { status: 401 })
    }

    // Default values if we can't get the data
    const defaultStats = {
      points: 0,
      surveys_completed: 0,
    }

    // If we have a service role key, use it to bypass RLS
    if (supabaseServiceKey) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })

      // Get user stats
      const { data, error } = await adminSupabase
        .from("users")
        .select("points, surveys_completed")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.error("Error fetching user stats:", error)
        return NextResponse.json(defaultStats)
      }

      return NextResponse.json(data || defaultStats)
    }

    // If no service role key, return default values
    return NextResponse.json(defaultStats)
  } catch (error) {
    console.error("Error in user stats API:", error)
    return NextResponse.json({ points: 0, surveys_completed: 0 })
  }
}

