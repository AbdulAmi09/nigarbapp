"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react"

interface NotificationItemProps {
  notification: any
  getTypeColor: (type: string) => string
  getNotificationIcon: (type: string) => any
  formatTimeAgo: (date: string) => string
  onActionComplete?: () => void
}

export default function NotificationItem({
  notification,
  getTypeColor,
  getNotificationIcon,
  formatTimeAgo,
  onActionComplete,
}: NotificationItemProps) {
  const [loading, setLoading] = useState(false)
  const IconComponent = getNotificationIcon(notification.notification_type)

  const handleAssignmentAction = async (status: "Accepted" | "Declined") => {
    setLoading(true)
    try {
      const response = await fetch("/api/assignments/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: notification.related_id,
          status,
        }),
      })

      if (response.ok) {
        onActionComplete?.()
      }
    } catch (error) {
      console.error("[v0] Error updating assignment:", error)
    } finally {
      setLoading(false)
    }
  }

  const isAssignmentAction = notification.notification_type === "assignment" && notification.related_id

  return (
    <div
      className={`flex items-start gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
        !notification.is_read ? "bg-primary/5 border-primary/20" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.notification_type)}`}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{notification.title}</p>
          {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
      </div>

      <div className="flex items-center gap-2">
        {isAssignmentAction && (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAssignmentAction("Accepted")}
              disabled={loading}
              className="gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAssignmentAction("Declined")}
              disabled={loading}
              className="gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Decline
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
