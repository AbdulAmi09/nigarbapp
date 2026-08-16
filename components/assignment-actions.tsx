"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AssignmentActionsProps {
  assignmentId: string
}

export default function AssignmentActions({ assignmentId }: AssignmentActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"Accepted" | "Declined" | null>(null)
  const [error, setError] = useState<string | null>(null)

  const respond = async (status: "Accepted" | "Declined") => {
    setLoading(status)
    setError(null)
    try {
      const response = await fetch("/api/assignments/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error("[v0] Failed to update assignment status:", data.error)
        setError(data.error || "Couldn't update this assignment. Please try again.")
        return
      }
      router.refresh()
    } catch (err) {
      console.error("[v0] Failed to update assignment status:", err)
      setError("Couldn't reach the server. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2 w-full">
      <Button className="w-full" onClick={() => respond("Accepted")} disabled={loading !== null}>
        {loading === "Accepted" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Accept Assignment
      </Button>
      <Button
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => respond("Declined")}
        disabled={loading !== null}
      >
        {loading === "Declined" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Decline
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
