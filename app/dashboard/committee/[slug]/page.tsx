import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import CommitteeWorkspace from "@/components/committee-workspace"

export default async function CommitteeWorkspacePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: committee } = await supabase
    .from("committees")
    .select(`
      id, name, slug, description, purpose, meeting_schedule, next_meeting_date, meeting_location,
      member_ids, chairman_id, secretary_id
    `)
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single()

  if (!committee) {
    notFound()
  }

  const isChairman = committee.chairman_id === user.id
  const isSecretary = committee.secretary_id === user.id
  const isMember = committee.member_ids?.includes(user.id)

  if (!isChairman && !isSecretary && !isMember) {
    redirect("/dashboard/committee")
  }

  const [{ data: roster }, { data: rawCases }, { data: documents }] = await Promise.all([
    supabase.rpc("get_committee_roster", { p_committee_id: committee.id }),
    supabase.rpc("get_committee_cases_with_submitter", { p_committee_id: committee.id, p_limit: 20 }),
    supabase
      .from("committee_documents")
      .select("*")
      .eq("committee_id", committee.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const cases = (rawCases || []).map((c: any) => ({
    id: c.id,
    request_type: c.request_type,
    message: c.message,
    status: c.status,
    attachment_path: c.attachment_path,
    resolution_note: c.resolution_note,
    created_at: c.created_at,
    resolved_at: c.resolved_at,
    submitter: {
      first_name: c.submitter_first_name,
      last_name: c.submitter_last_name,
      avatar_url: c.submitter_avatar_url,
    },
  }))

  return (
    <CommitteeWorkspace
      committee={committee}
      userId={user.id}
      role={isChairman ? "Chairman" : isSecretary ? "Secretary" : "Member"}
      isOfficer={isChairman || isSecretary}
      roster={roster || []}
      cases={cases}
      documents={documents || []}
    />
  )
}
