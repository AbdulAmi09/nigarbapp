import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Trophy, Calendar, MessageSquare, Settings, CheckCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NotificationItemClient from "@/components/notification-item-client"

async function getNotifications(userId: string) {
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })

  return notifications || []
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const notifications = await getNotifications(user.id)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Notifications</h1>
          <p className="text-muted-foreground text-pretty">
            Stay updated with your latest activities and announcements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.is_important).length}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {
                    notifications.filter((n) => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(n.created_at) > weekAgo
                    }).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>Complete list of your notifications and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationItemClient key={notification.id} notification={notification} />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No notifications found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>Notifications that require your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.filter((n) => !n.is_read).length > 0 ? (
                notifications
                  .filter((n) => !n.is_read)
                  .map((notification) => <NotificationItemClient key={notification.id} notification={notification} />)
              ) : (
                <p className="text-muted-foreground text-center py-8">No unread notifications</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Notifications</CardTitle>
              <CardDescription>Tournament assignments and related updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.filter((n) => n.notification_type === "assignment").length > 0 ? (
                notifications
                  .filter((n) => n.notification_type === "assignment")
                  .map((notification) => <NotificationItemClient key={notification.id} notification={notification} />)
              ) : (
                <p className="text-muted-foreground text-center py-8">No assignment notifications</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Notifications</CardTitle>
              <CardDescription>Payment processing and financial updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.filter((n) => n.notification_type === "payment").length > 0 ? (
                notifications
                  .filter((n) => n.notification_type === "payment")
                  .map((notification) => <NotificationItemClient key={notification.id} notification={notification} />)
              ) : (
                <p className="text-muted-foreground text-center py-8">No payment notifications</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>System updates and maintenance announcements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.filter((n) => n.notification_type === "system").length > 0 ? (
                notifications
                  .filter((n) => n.notification_type === "system")
                  .map((notification) => <NotificationItemClient key={notification.id} notification={notification} />)
              ) : (
                <p className="text-muted-foreground text-center py-8">No system notifications</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
