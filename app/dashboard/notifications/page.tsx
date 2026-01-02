import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Trophy, CreditCard, Users, Calendar, MessageSquare, Settings, CheckCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NotificationItem from "@/components/notification-item"

async function getNotifications(userId: string) {
  const supabase = await createClient()

  // Get all notifications for the user
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })

  return notifications || []
}

async function markAsRead(notificationId: string) {
  const supabase = await createClient()

  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)
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

  const getPriorityColor = (isImportant: boolean) => {
    return isImportant ? "bg-red-500" : "bg-blue-500"
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "assignment":
        return "bg-primary/10 text-primary"
      case "payment":
        return "bg-green-500/10 text-green-600"
      case "system":
        return "bg-blue-500/10 text-blue-600"
      case "committee":
        return "bg-purple-500/10 text-purple-600"
      case "calendar":
        return "bg-orange-500/10 text-orange-600"
      case "chat":
        return "bg-pink-500/10 text-pink-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return Trophy
      case "payment":
        return CreditCard
      case "system":
        return Settings
      case "committee":
        return Users
      case "calendar":
        return Calendar
      case "chat":
        return MessageSquare
      default:
        return Bell
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

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
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    getTypeColor={getTypeColor}
                    getNotificationIcon={getNotificationIcon}
                    formatTimeAgo={formatTimeAgo}
                    onActionComplete={() => {
                      // Refresh notifications
                      location.reload()
                    }}
                  />
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
                  .map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      getTypeColor={getTypeColor}
                      getNotificationIcon={getNotificationIcon}
                      formatTimeAgo={formatTimeAgo}
                      onActionComplete={() => {
                        // Refresh notifications
                        location.reload()
                      }}
                    />
                  ))
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
                  .map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      getTypeColor={getTypeColor}
                      getNotificationIcon={getNotificationIcon}
                      formatTimeAgo={formatTimeAgo}
                      onActionComplete={() => {
                        // Refresh notifications
                        location.reload()
                      }}
                    />
                  ))
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
                  .map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      getTypeColor={getTypeColor}
                      getNotificationIcon={getNotificationIcon}
                      formatTimeAgo={formatTimeAgo}
                      onActionComplete={() => {
                        // Refresh notifications
                        location.reload()
                      }}
                    />
                  ))
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
                  .map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      getTypeColor={getTypeColor}
                      getNotificationIcon={getNotificationIcon}
                      formatTimeAgo={formatTimeAgo}
                      onActionComplete={() => {
                        // Refresh notifications
                        location.reload()
                      }}
                    />
                  ))
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
