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

  const rosterIds = [committee.chairman_id, committee.secretary_id, ...(committee.member_ids || [])].filter(
    Boolean,
  ) as string[]

  const [{ data: roster }, { data: cases }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, avatar_url, arbiter_level").in("id", rosterIds),
    supabase
      .from("committee_cases")
      .select(`
        id, request_type, message, status, attachment_path, resolution_note, created_at, resolved_at,
        submitter:submitted_by (first_name, last_name, avatar_url)
      `)
      .eq("committee_id", committee.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("committee_documents")
      .select("*")
      .eq("committee_id", committee.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return (
    <CommitteeWorkspace
      committee={committee}
      userId={user.id}
      role={isChairman ? "Chairman" : isSecretary ? "Secretary" : "Member"}
      isOfficer={isChairman || isSecretary}
      roster={roster || []}
      cases={(cases as any) || []}
      documents={documents || []}
    />
  )
}
