import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  MessageSquare,
  Banknote,
  Wallet,
  CalendarClock,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

interface ArbiterStats {
  total_assignments: number
  completed_assignments: number
  pending_assignments: number
  total_earnings: number
  pending_payments: number
  average_rating: number
  tournaments_this_month: number
  next_assignment_date: string | null
}

async function getDashboardData(userId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const [{ data: profile }, { data: stats }, { data: upcoming }, { data: notifications }, { data: unreadRows }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.rpc("get_arbiter_activity_summary", { arbiter_uuid: userId }).single<ArbiterStats>(),
      supabase
        .from("assignment_details")
        .select("*")
        .eq("arbiter_id", userId)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(5),
      supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("unread_messages").select("unread_count").eq("user_id", userId),
    ])

  let assignments = upcoming || []
  let assignmentsMode: "upcoming" | "recent" = "upcoming"

  if (assignments.length === 0) {
    const { data: recent } = await supabase
      .from("assignment_details")
      .select("*")
      .eq("arbiter_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
    assignments = recent || []
    assignmentsMode = "recent"
  }

  const unreadChatCount = (unreadRows || []).reduce((sum, r: any) => sum + (r.unread_count || 0), 0)

  return { profile, stats, assignments, assignmentsMode, notifications, unreadChatCount }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getArbiterTitle(level: string | null) {
  switch (level) {
    case "International":
      return "IA"
    case "FIDE":
      return "FA"
    case "National":
      return "NA"
    case "Candidate":
      return "CA"
    default:
      return "Arbiter"
  }
}

function formatCurrency(amount: number) {
  return `₦${Math.round(amount || 0).toLocaleString()}`
}

function daysUntil(dateString: string) {
  const diffMs = new Date(dateString).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.round(diffMs / 86400000)
}

function formatCountdown(dateString: string) {
  const days = daysUntil(dateString)
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days < 0) return new Date(dateString).toLocaleDateString()
  return `In ${days} days`
}

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { profile, stats, assignments, assignmentsMode, notifications, unreadChatCount } = await getDashboardData(
    user.id,
  )

  const displayName = profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : "Arbiter"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-balance">
              {getGreeting()}, {displayName}!
            </h1>
            <Badge variant="outline">{getArbiterTitle(profile?.arbiter_level)}</Badge>
          </div>
          <p className="text-muted-foreground text-pretty">
            {profile?.zone ? `${profile.zone} Zone · ` : ""}
            Here's what's happening with your arbitration activities today.
          </p>
        </div>
      </div>

      {profile && !profile.is_active && (
        <Alert className="border-amber-500/30 bg-amber-500/5 [&>svg]:text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-amber-700">Your account is currently inactive</AlertTitle>
          <AlertDescription>
            <span>
              You retain your {getArbiterTitle(profile.arbiter_level)} title, but you'll need to complete a
              refresher course to become active again and receive assignments.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your response</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings snapshot */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_earnings || 0)}</div>
            <p className="text-xs text-muted-foreground">From paid assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.pending_payments || 0)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tournaments_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">Tournaments this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{assignmentsMode === "upcoming" ? "Upcoming Assignments" : "Recent Assignments"}</CardTitle>
              <CardDescription>
                {assignmentsMode === "upcoming" ? "What's next on your schedule" : "Your latest arbitration activity"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tournament-assignment">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments && assignments.length > 0 ? (
              assignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{assignment.tournament_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {assignment.role}
                        {assignment.venue ? ` · ${assignment.venue}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant={
                        assignment.assignment_status === "Completed"
                          ? "default"
                          : assignment.assignment_status === "Accepted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {assignment.assignment_status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {assignmentsMode === "upcoming" && assignment.start_date
                        ? formatCountdown(assignment.start_date)
                        : new Date(assignment.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No assignments yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/tournament-evaluation">
                <FileText className="mr-2 h-4 w-4" />
                Submit Tournament Report
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                View NCAA Calendar
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/tournament-assignment">
                <Clock className="mr-2 h-4 w-4" />
                Check Assignment Status
                {(stats?.pending_assignments || 0) > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats!.pending_assignments}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/zones">
                <MapPin className="mr-2 h-4 w-4" />
                Find Zone Information
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Make a Payment
                {(stats?.pending_payments || 0) > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {formatCurrency(stats!.pending_payments)}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/dashboard/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Chat Room
                {unreadChatCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadChatCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Stay updated with the latest announcements</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/notifications">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notification.is_read ? "bg-muted-foreground/30" : "bg-primary"}`}
                ></div>
                <div className="min-w-0">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent notifications</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
