import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Trophy, CreditCard, Users, Calendar, MessageSquare, Settings, CheckCheck, Trash2 } from "lucide-react"

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "assignment",
      icon: Trophy,
      title: "New Tournament Assignment",
      message: "You have been assigned as Chief Arbiter for the Lagos State Championship.",
      time: "2 hours ago",
      read: false,
      priority: "high",
    },
    {
      id: 2,
      type: "payment",
      icon: CreditCard,
      title: "Payment Processed",
      message: "Your arbitration fee for the National Youth Tournament has been processed.",
      time: "1 day ago",
      read: false,
      priority: "medium",
    },
    {
      id: 3,
      type: "system",
      icon: Settings,
      title: "System Update",
      message: "The NCAA dashboard has been updated with new features and improvements.",
      time: "3 days ago",
      read: true,
      priority: "low",
    },
    {
      id: 4,
      type: "committee",
      icon: Users,
      title: "Committee Meeting",
      message: "Monthly committee meeting scheduled for December 20th at 2:00 PM.",
      time: "5 days ago",
      read: true,
      priority: "medium",
    },
    {
      id: 5,
      type: "calendar",
      icon: Calendar,
      title: "Event Reminder",
      message: "Reminder: FIDE Arbiters Seminar starts tomorrow at 9:00 AM.",
      time: "1 week ago",
      read: true,
      priority: "high",
    },
    {
      id: 6,
      type: "chat",
      icon: MessageSquare,
      title: "New Message",
      message: "You have 3 new messages in the Zone 4.1 chat room.",
      time: "1 week ago",
      read: true,
      priority: "low",
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
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
                <p className="text-2xl font-bold">{notifications.filter((n) => n.priority === "high").length}</p>
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
                  {notifications.filter((n) => n.time.includes("day") || n.time.includes("hour")).length}
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
              {notifications.map((notification) => {
                const IconComponent = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                      !notification.read ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        {!notification.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button variant="ghost" size="sm">
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
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
              {notifications
                .filter((n) => !n.read)
                .map((notification) => {
                  const IconComponent = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className="flex items-start gap-4 p-4 border rounded-lg bg-primary/5 border-primary/20"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <Badge variant="secondary" className="text-xs">
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>

                      <Button variant="outline" size="sm">
                        Mark Read
                      </Button>
                    </div>
                  )
                })}
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
              {notifications
                .filter((n) => n.type === "assignment")
                .map((notification) => {
                  const IconComponent = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg ${
                        !notification.read ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>

                      <Badge variant={notification.priority === "high" ? "destructive" : "secondary"}>
                        {notification.priority}
                      </Badge>
                    </div>
                  )
                })}
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
              {notifications
                .filter((n) => n.type === "payment")
                .map((notification) => {
                  const IconComponent = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border rounded-lg ${
                        !notification.read ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  )
                })}
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
              {notifications
                .filter((n) => n.type === "system")
                .map((notification) => {
                  const IconComponent = notification.icon
                  return (
                    <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
