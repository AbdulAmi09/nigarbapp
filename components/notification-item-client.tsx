"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  action_required: boolean
  action_type?: string
  action_url?: string
  is_read: boolean
  created_at: string
  related_id?: string
}

interface NotificationItemClientProps {
  notification: Notification
  getTypeColor: (type: string) => string
  getNotificationIcon: (type: string) => React.ComponentType<any>
  formatTimeAgo: (date: string) => string
}

export default function NotificationItemClient({
  notification,
  getTypeColor,
  getNotificationIcon,
  formatTimeAgo,
}: NotificationItemClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [actionCompleted, setActionCompleted] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleAccept = async () => {
    setLoading(true)
    try {
      if (notification.action_type === "Tournament_assignment" && notification.related_id) {
        await supabase
          .from("tournament_assignments")
          .update({ assignment_status: "Accepted" })
          .eq("id", notification.related_id)

        setActionCompleted(true)
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error accepting assignment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    setLoading(true)
    try {
      if (notification.action_type === "Tournament_assignment" && notification.related_id) {
        await supabase
          .from("tournament_assignments")
          .update({ assignment_status: "Declined" })
          .eq("id", notification.related_id)

        setActionCompleted(true)
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error declining assignment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateUrl = () => {
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const IconComponent = getNotificationIcon(notification.notification_type)

  const shouldShowActions = notification.action_required

  return (
    <div className={`flex gap-4 p-4 border rounded-lg ${!notification.is_read ? "bg-muted/50" : ""}`}>
      <div className={`p-2 rounded-lg h-fit ${getTypeColor(notification.notification_type)}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeAgo(notification.created_at)}
          </span>
        </div>

        {shouldShowActions && (
          <div className="flex gap-2 mt-3">
            {notification.action_type === "Tournament_assignment" ? (
              <>
                <Button size="sm" onClick={handleAccept} disabled={loading || actionCompleted}>
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleDecline} disabled={loading || actionCompleted}>
                  Decline
                </Button>
              </>
            ) : notification.action_type === "URL" && notification.action_url ? (
              <Button size="sm" onClick={handleNavigateUrl} disabled={loading}>
                Open Link
              </Button>
            ) : null}
            {actionCompleted && <span className="text-xs text-green-600">Action completed</span>}
          </div>
        )}
      </div>
    </div>
  )
}
