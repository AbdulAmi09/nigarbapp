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

  const [{ data: committees }, { data: publicDocs }, { data: myCases }] = await Promise.all([
    supabase.rpc("get_committees_with_leadership"),
    supabase.from("committee_documents").select("*").eq("is_public", true).order("created_at", { ascending: false }),
    supabase
      .from("committee_cases")
      .select(`
        id, request_type, message, status, resolution_note, created_at,
        committee:committee_id (name)
      `)
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const sortedCommittees = [...(committees || [])].sort((a: any, b: any) => a.name.localeCompare(b.name))

  return (
    <CommitteeDirectoryPanel
      userId={user.id}
      committees={sortedCommittees}
      publicDocuments={publicDocs || []}
      myCases={(myCases as any) || []}
    />
  )
}
