"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { CheckCheck, Loader2 } from "lucide-react"

interface MarkAllReadButtonProps {
  userId: string
}

export default function MarkAllReadButton({ userId }: MarkAllReadButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.rpc("mark_all_notifications_read", { user_id: userId })
      if (error) {
        console.error("[v0] Error marking all notifications read:", error)
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2" />}
      Mark All Read
    </Button>
  )
}
