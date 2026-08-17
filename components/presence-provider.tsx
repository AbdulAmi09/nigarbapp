"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { isPushSubscribed, isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push"

interface PresenceContextValue {
  onlineIds: Set<string>
  pushSupported: boolean
  pushPermission: NotificationPermission | null
  pushSubscribed: boolean
  enablePush: () => Promise<boolean>
  disablePush: () => Promise<void>
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineIds: new Set(),
  pushSupported: false,
  pushPermission: null,
  pushSubscribed: false,
  enablePush: async () => false,
  disablePush: async () => {},
})

export function useOnlinePresence() {
  return useContext(PresenceContext)
}

export default function PresenceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userIdRef = useRef<string | null>(null)
  const pushSupported = isPushSupported()

  useEffect(() => {
    if (!pushSupported) return
    setPushPermission(Notification.permission)
    isPushSubscribed().then(setPushSubscribed)
  }, [pushSupported])

  const enablePush = async () => {
    const ok = await subscribeToPush(supabase)
    if (pushSupported) setPushPermission(Notification.permission)
    setPushSubscribed(ok)
    return ok
  }

  const disablePush = async () => {
    await unsubscribeFromPush(supabase)
    setPushSubscribed(false)
  }

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

  return (
    <PresenceContext.Provider
      value={{ onlineIds, pushSupported, pushPermission, pushSubscribed, enablePush, disablePush }}
    >
      {children}
    </PresenceContext.Provider>
  )
}
