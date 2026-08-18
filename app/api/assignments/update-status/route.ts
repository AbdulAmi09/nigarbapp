import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assignmentId, status } = await request.json()

    if (!["Accepted", "Declined"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const { data: assignment, error: fetchError } = await supabase
      .from("tournament_assignments")
      .select("*")
      .eq("id", assignmentId)
      .eq("arbiter_id", user.id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("tournament_assignments")
      .update({ assignment_status: status })
      .eq("id", assignmentId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Clear the Accept/Decline prompt on the originating notification so it
    // doesn't keep showing (and being re-clickable) after it's been handled.
    await supabase
      .from("notifications")
      .update({ action_required: false })
      .eq("related_id", assignmentId)
      .eq("action_type", "Tournament_assignment")
      .eq("recipient_id", user.id)

    // Create notification for the action
    await supabase.from("notifications").insert({
      recipient_id: user.id,
      title: `Assignment ${status}`,
      message: `You have ${status.toLowerCase()} the tournament assignment.`,
      notification_type: "assignment",
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("[v0] Assignment update error:", error)
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
  }
}
