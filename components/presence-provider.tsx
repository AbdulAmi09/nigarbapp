"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface PresenceContextValue {
  onlineIds: Set<string>
}

const PresenceContext = createContext<PresenceContextValue>({ onlineIds: new Set() })

export function useOnlinePresence() {
  return useContext(PresenceContext)
}

export default function PresenceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      const channel = supabase.channel("presence:online", { config: { presence: { key: user.id } } })
      channel
        .on("presence", { event: "sync" }, () => {
          setOnlineIds(new Set(Object.keys(channel.presenceState())))
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ online_at: new Date().toISOString() })
          }
        })
      channelRef.current = channel
    }
    init()

    const recordLastSeen = () => {
      if (userIdRef.current) {
        supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userIdRef.current)
      }
    }
    window.addEventListener("beforeunload", recordLastSeen)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") recordLastSeen()
    })

    return () => {
      window.removeEventListener("beforeunload", recordLastSeen)
      recordLastSeen()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  return <PresenceContext.Provider value={{ onlineIds }}>{children}</PresenceContext.Provider>
}
