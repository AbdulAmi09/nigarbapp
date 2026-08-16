import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Only allow arbiters to edit their own self-service fields; credentials
    // like arbiter_level, license_number, is_verified must stay admin-only.
    const EDITABLE_FIELDS = [
      "first_name",
      "last_name",
      "phone",
      "date_of_birth",
      "gender",
      "address",
      "city",
      "state",
      "country",
      "zone",
      "bio",
      "avatar_url",
      "years_experience",
      "fide_id",
    ] as const

    const updates: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field]
    }

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
