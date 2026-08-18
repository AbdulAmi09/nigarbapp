"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, Trophy, CreditCard, Settings, Users, Calendar, Megaphone, Bell, Trash2 } from "lucide-react"

export interface Notification {
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
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onActionHandled: (id: string) => void
}

function getTypeColor(type: string) {
  switch (type?.toLowerCase()) {
    case "assignment":
      return "bg-primary/10 text-primary"
    case "payment":
      return "bg-green-500/10 text-green-600"
    case "system":
      return "bg-blue-500/10 text-blue-600"
    case "committee":
      return "bg-purple-500/10 text-purple-600"
    case "tournament":
      return "bg-orange-500/10 text-orange-600"
    case "admin_message":
      return "bg-indigo-500/10 text-indigo-600"
    default:
      return "bg-gray-500/10 text-gray-600"
  }
}

function getNotificationIcon(type: string): React.ComponentType<any> {
  switch (type?.toLowerCase()) {
    case "assignment":
      return Trophy
    case "payment":
      return CreditCard
    case "system":
      return Settings
    case "committee":
      return Users
    case "tournament":
      return Calendar
    case "admin_message":
      return Megaphone
    default:
      return Bell
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export default function NotificationItemClient({
  notification,
  onMarkRead,
  onDelete,
  onActionHandled,
}: NotificationItemClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError(data.error || "Couldn't update this assignment. Please try again.")
        return
      }
      onActionHandled(notification.id)
      router.refresh()
    } catch {
      setError("Couldn't reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = () => {
    if (!notification.is_read) onMarkRead(notification.id)
    if (notification.action_url) router.push(notification.action_url)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  const IconComponent = getNotificationIcon(notification.notification_type)
  const isClickable = Boolean(notification.action_url)
  const showAssignmentActions = notification.action_required && notification.action_type === "Tournament_assignment"

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleCardClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter") handleCardClick()
            }
          : undefined
      }
      className={`group flex gap-4 p-4 border rounded-lg ${!notification.is_read ? "bg-muted/50" : ""} ${
        isClickable ? "cursor-pointer hover:border-primary/40" : ""
      }`}
    >
      <div className={`p-2 rounded-lg h-fit ${getTypeColor(notification.notification_type)}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {!notification.is_read && <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />}
            <div>
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTimeAgo(notification.created_at)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={handleDeleteClick}
              aria-label="Delete notification"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showAssignmentActions && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                respondToAssignment("Accepted")
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                respondToAssignment("Declined")
              }}
              disabled={loading}
            >
              Decline
            </Button>
            {error && <span className="text-xs text-destructive self-center">{error}</span>}
          </div>
        )}

        {!notification.is_read && !isClickable && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notification.id)
            }}
            className="text-xs text-primary mt-2 hover:underline"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  )
}
