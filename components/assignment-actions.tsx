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

  const respond = async (status: "Accepted" | "Declined") => {
    setLoading(status)
    try {
      const response = await fetch("/api/assignments/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, status }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error("[v0] Failed to update assignment status:", data.error)
        return
      }
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
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
    </>
  )
}
