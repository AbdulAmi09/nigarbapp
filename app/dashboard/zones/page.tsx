import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ZonesPanel from "@/components/zones-panel"

export default async function ZonesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const [{ data: profile }, { data: zones }, { data: arbiters }, { data: tournaments }] = await Promise.all([
    supabase.from("profiles").select("zone, first_name, last_name").eq("id", user.id).single(),
    supabase.from("zones").select("id, name, states, description").order("name"),
    supabase.rpc("get_zone_directory"),
    supabase.from("tournaments").select("id, name, state, status, start_date").order("start_date", { ascending: false }),
  ])

  return (
    <ZonesPanel
      userId={user.id}
      userZone={profile?.zone || null}
      zones={zones || []}
      arbiters={arbiters || []}
      tournaments={tournaments || []}
    />
  )
}
