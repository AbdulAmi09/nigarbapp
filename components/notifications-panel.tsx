"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Trophy, Calendar, MessageSquare, CheckCheck, Loader2, Settings } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import NotificationItemClient, { type Notification } from "@/components/notification-item-client"

const PAGE_SIZE = 50

interface NotificationsPanelProps {
  userId: string
  initialNotifications: Notification[]
  initialCounts: {
    total: number
    unread: number
    actionRequired: number
    thisWeek: number
  }
}

export default function NotificationsPanel({ userId, initialNotifications, initialCounts }: NotificationsPanelProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [items, setItems] = useState(initialNotifications)
  const [counts, setCounts] = useState(initialCounts)
  const [hasMore, setHasMore] = useState(initialNotifications.length === PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const handleMarkRead = async (id: string) => {
    const target = items.find((n) => n.id === id)
    if (!target || target.is_read) return

    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read: true })
      .eq("id", id)
      .eq("recipient_id", userId)

    if (error) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)))
      setCounts((prev) => ({ ...prev, unread: prev.unread + 1 }))
    }
  }

  const handleDelete = async (id: string) => {
    const target = items.find((n) => n.id === id)
    if (!target) return

    setItems((prev) => prev.filter((n) => n.id !== id))
    setCounts((prev) => ({
      total: Math.max(0, prev.total - 1),
      unread: target.is_read ? prev.unread : Math.max(0, prev.unread - 1),
      actionRequired: target.action_required ? Math.max(0, prev.actionRequired - 1) : prev.actionRequired,
      thisWeek: prev.thisWeek,
    }))

    const { error } = await supabase.from("notifications").delete().eq("id", id).eq("recipient_id", userId)

    if (error) {
      setItems((prev) => [...prev, target].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)))
      setCounts((prev) => ({
        total: prev.total + 1,
        unread: target.is_read ? prev.unread : prev.unread + 1,
        actionRequired: target.action_required ? prev.actionRequired + 1 : prev.actionRequired,
        thisWeek: prev.thisWeek,
      }))
    }
  }

  const handleActionHandled = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, action_required: false, is_read: true } : n)))
    setCounts((prev) => ({ ...prev, actionRequired: Math.max(0, prev.actionRequired - 1) }))
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      const { error } = await supabase.rpc("mark_all_notifications_read")
      if (error) return
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setCounts((prev) => ({ ...prev, unread: 0 }))
    } finally {
      setMarkingAll(false)
    }
  }

  const handleLoadMore = async () => {
    if (items.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = items[items.length - 1].created_at
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .lt("created_at", oldest)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (error) return
      setItems((prev) => [...prev, ...(data as Notification[])])
      setHasMore((data?.length || 0) === PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

  const unread = useMemo(() => items.filter((n) => !n.is_read), [items])
  const assignments = useMemo(() => items.filter((n) => n.notification_type?.toLowerCase() === "assignment"), [items])
  const payments = useMemo(() => items.filter((n) => n.notification_type?.toLowerCase() === "payment"), [items])
  const system = useMemo(() => items.filter((n) => n.notification_type?.toLowerCase() === "system"), [items])

  const renderList = (list: Notification[], emptyLabel: string) => (
    <div className="space-y-4">
      {list.length > 0 ? (
        list.map((notification) => (
          <NotificationItemClient
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
            onActionHandled={handleActionHandled}
          />
        ))
      ) : (
        <p className="text-muted-foreground text-center py-8">{emptyLabel}</p>
      )}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Load older notifications
          </Button>
        </div>
      )}
    </div>
  )

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
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll || counts.unread === 0}>
            {markingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2" />}
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{counts.unread}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Action Required</p>
                <p className="text-2xl font-bold">{counts.actionRequired}</p>
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
                <p className="text-2xl font-bold">{counts.thisWeek}</p>
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
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
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
            <CardContent>{renderList(items, "No notifications found")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>Notifications that require your attention</CardDescription>
            </CardHeader>
            <CardContent>{renderList(unread, "No unread notifications")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Notifications</CardTitle>
              <CardDescription>Tournament assignments and related updates</CardDescription>
            </CardHeader>
            <CardContent>{renderList(assignments, "No assignment notifications")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Notifications</CardTitle>
              <CardDescription>Payment processing and financial updates</CardDescription>
            </CardHeader>
            <CardContent>{renderList(payments, "No payment notifications")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>System updates and maintenance announcements</CardDescription>
            </CardHeader>
            <CardContent>{renderList(system, "No system notifications")}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
