"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Trophy, CreditCard, Settings, Users, Calendar, MessageSquare, Bell } from "lucide-react"

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
}

export default function NotificationItemClient({ notification }: NotificationItemClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [actionCompleted, setActionCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
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

  const getNotificationIcon = (type: string): React.ComponentType<any> => {
    switch (type?.toLowerCase()) {
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

  const respondToAssignment = async (status: "Accepted" | "Declined") => {
    if (notification.action_type !== "Tournament_assignment" || !notification.related_id) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/assignments/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: notification.related_id, status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error("[v0] Failed to update assignment status:", data.error)
        setError(data.error || "Couldn't update this assignment. Please try again.")
        return
      }
      setActionCompleted(true)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error responding to assignment:", err)
      setError("Couldn't reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => respondToAssignment("Accepted")
  const handleDecline = () => respondToAssignment("Declined")

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
            {error && <span className="text-xs text-destructive">{error}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
