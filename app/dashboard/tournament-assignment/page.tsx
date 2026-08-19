import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TournamentAssignmentPanel from "@/components/tournament-assignment-panel"

async function getAssignmentData(userId: string) {
  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from("assignment_details")
    .select("*")
    .eq("arbiter_id", userId)
    .order("created_at", { ascending: false })

  return assignments || []
}

export default async function TournamentAssignmentPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const assignments = await getAssignmentData(user.id)

  return <TournamentAssignmentPanel assignments={assignments} />
}
