import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || userData.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get pending surveys
    const { data, error } = await supabase
      .from("surveys")
      .select(`
        *,
        users:created_by (name, email)
      `)
      .eq("status", "pending")

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching pending surveys:", error)
    return NextResponse.json({ error: "Failed to fetch pending surveys" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    // Validate the request body
    if (!body.id || !body.status || !["approved", "rejected"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid data. Survey ID and status (approved/rejected) are required." },
        { status: 400 },
      )
    }

    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (userError || userData.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the survey status
    const { data, error } = await supabase
      .from("surveys")
      .update({
        status: body.status,
        approved_by: session.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error updating survey status:", error)
    return NextResponse.json({ error: "Failed to update survey status" }, { status: 500 })
  }
}

