import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    // Get only approved surveys that are public
    const { data, error } = await supabase.from("surveys").select("*").eq("status", "approved").eq("is_public", true)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching surveys:", error)
    return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the request body
    if (!body.title || !body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: "Invalid survey data. Title and questions are required." }, { status: 400 })
    }

    // Get user ID from session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Insert the survey
    const { data, error } = await supabase
      .from("surveys")
      .insert({
        title: body.title,
        description: body.description,
        questions: body.questions,
        created_by: userId,
        status: "pending", // All surveys start as pending until approved by admin
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Error creating survey:", error)
    return NextResponse.json({ error: "Failed to create survey" }, { status: 500 })
  }
}

