import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, TrendingUp, Clock, MapPin, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  // Get dashboard statistics
  const { data: stats } = await supabase.rpc("get_arbiter_activity_summary", { arbiter_uuid: userId }).single()

  // Get recent assignments
  const { data: assignments } = await supabase
    .from("assignment_details")
    .select("*")
    .eq("arbiter_id", userId)
    .order("created_at", { ascending: false })
    .limit(3)

  // Get recent notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(3)

  return { profile, stats, assignments, notifications }
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

  const { profile, stats, assignments, notifications } = await getDashboardData(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Welcome back, {profile?.first_name || "Arbiter"}</h1>
        <p className="text-muted-foreground text-pretty">
          Here's what's happening with your arbitration activities today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_rating || "0.0"}</div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tournament Assignments</CardTitle>
            <CardDescription>Your latest arbitration assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments && assignments.length > 0 ? (
              assignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.tournament_name}</p>
                      <p className="text-sm text-muted-foreground">{assignment.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
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
                      {new Date(assignment.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent assignments</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Submit Tournament Report
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              View NCAA Calendar
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Check Assignment Status
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              Find Zone Information
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Stay updated with the latest announcements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
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
