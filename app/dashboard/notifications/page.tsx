import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NotificationsPanel from "@/components/notifications-panel"

const PAGE_SIZE = 50

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [{ data: notifications }, totalRes, unreadRes, actionRequiredRes, thisWeekRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("action_required", true),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .gte("created_at", weekAgo.toISOString()),
  ])

  return (
    <NotificationsPanel
      userId={user.id}
      initialNotifications={notifications || []}
      initialCounts={{
        total: totalRes.count || 0,
        unread: unreadRes.count || 0,
        actionRequired: actionRequiredRes.count || 0,
        thisWeek: thisWeekRes.count || 0,
      }}
    />
  )
}
