import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CommitteeDirectoryPanel from "@/components/committee-directory-panel"

export default async function CommitteePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const [{ data: committees }, { data: publicDocs }] = await Promise.all([
    supabase
      .from("committees")
      .select(`
        id, name, slug, description, purpose, meeting_schedule, next_meeting_date, meeting_location,
        member_ids, chairman_id, secretary_id, request_types,
        chairman:chairman_id (first_name, last_name, avatar_url),
        secretary:secretary_id (first_name, last_name, avatar_url)
      `)
      .eq("is_active", true)
      .order("name"),
    supabase.from("committee_documents").select("*").eq("is_public", true).order("created_at", { ascending: false }),
  ])

  return (
    <CommitteeDirectoryPanel
      userId={user.id}
      committees={(committees as any) || []}
      publicDocuments={publicDocs || []}
    />
  )
}
