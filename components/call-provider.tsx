"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react"

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
}

const RING_TIMEOUT_MS = 45000

type CallStatus = "idle" | "outgoing" | "incoming" | "connecting" | "connected"

interface Peer {
  id: string
  name: string
  avatar_url: string | null
}

interface CallContextValue {
  status: CallStatus
  callType: "voice" | "video" | null
  peer: Peer | null
  startCall: (calleeId: string, roomId: string | null, callType: "voice" | "video") => Promise<void>
}

const CallContext = createContext<CallContextValue | null>(null)

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error("useCall must be used within CallProvider")
  return ctx
}

type SignalPayload =
  | { kind: "ready" }
  | { kind: "offer"; data: RTCSessionDescriptionInit }
  | { kind: "answer"; data: RTCSessionDescriptionInit }
  | { kind: "ice-candidate"; data: RTCIceCandidateInit }
  | { kind: "declined" }
  | { kind: "hangup" }

export default function CallProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<CallStatus>("idle")
  const [callType, setCallType] = useState<"voice" | "video" | null>(null)
  const [peer, setPeer] = useState<Peer | null>(null)
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)

  const callIdRef = useRef<string | null>(null)
  const roleRef = useRef<"caller" | "callee" | null>(null)
  const callTypeRef = useRef<"voice" | "video" | null>(null)
  const signalChannelRef = useRef<RealtimeChannel | null>(null)
  const listenerChannelRef = useRef<RealtimeChannel | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  // Listen for incoming calls anywhere in the dashboard.
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`incoming-calls-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${userId}` },
        async (payload) => {
          const call = payload.new as any
          if (call.status !== "ringing") return
          if (callIdRef.current) return // already on a call

          const { data: callerProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", call.caller_id)
            .single()

          callIdRef.current = call.id
          roleRef.current = "callee"
          callTypeRef.current = call.call_type
          setCallType(call.call_type)
          setPeer({
            id: call.caller_id,
            name: callerProfile
              ? `${callerProfile.first_name || ""} ${callerProfile.last_name || ""}`.trim()
              : "Unknown",
            avatar_url: callerProfile?.avatar_url || null,
          })
          setStatus("incoming")

          ringTimeoutRef.current = setTimeout(() => cleanup("missed"), RING_TIMEOUT_MS)
        },
      )
      .subscribe()

    listenerChannelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  function attachSignalHandlers(channel: RealtimeChannel, pc: RTCPeerConnection) {
    channel.on("broadcast", { event: "signal" }, async ({ payload }: { payload: SignalPayload }) => {
      if (payload.kind === "ice-candidate") {
        try {
          await pc.addIceCandidate(payload.data)
        } catch (e) {
          console.error("[v0] Error adding ICE candidate:", e)
        }
      } else if (payload.kind === "declined" || payload.kind === "hangup") {
        cleanup(payload.kind === "declined" ? "declined" : "ended")
      } else if (payload.kind === "answer" && roleRef.current === "caller") {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.data))
        setStatus("connected")
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current)
      } else if (payload.kind === "ready" && roleRef.current === "caller") {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        channel.send({ type: "broadcast", event: "signal", payload: { kind: "offer", data: offer } })
      } else if (payload.kind === "offer" && roleRef.current === "callee") {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.data))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        channel.send({ type: "broadcast", event: "signal", payload: { kind: "answer", data: answer } })
        setStatus("connected")
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current)
      }
    })
  }

  function createPeerConnection(channel: RealtimeChannel, stream: MediaStream) {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: { kind: "ice-candidate", data: event.candidate.toJSON() },
        })
      }
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      // Attach to exactly one element — attaching to both would play the
      // audio track twice (video element's own audio + the hidden <audio>).
      if (callTypeRef.current === "video") {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      } else if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream
      }
    }

    return pc
  }

  const startCall = useCallback(
    async (calleeId: string, roomId: string | null, type: "voice" | "video") => {
      if (!userId || callIdRef.current) return

      const { data: calleeProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", calleeId)
        .single()

      const { data: call, error } = await supabase
        .from("calls")
        .insert({ caller_id: userId, callee_id: calleeId, room_id: roomId, call_type: type, status: "ringing" })
        .select()
        .single()

      if (error || !call) {
        console.error("[v0] Error starting call:", error)
        return
      }

      callIdRef.current = call.id
      roleRef.current = "caller"
      callTypeRef.current = type
      setCallType(type)
      setPeer({
        id: calleeId,
        name: calleeProfile ? `${calleeProfile.first_name || ""} ${calleeProfile.last_name || ""}`.trim() : "Unknown",
        avatar_url: calleeProfile?.avatar_url || null,
      })
      setStatus("outgoing")

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" })
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        const channel = supabase.channel(`call:${call.id}`, { config: { broadcast: { self: false } } })
        signalChannelRef.current = channel
        const pc = createPeerConnection(channel, stream)
        pcRef.current = pc
        attachSignalHandlers(channel, pc)
        channel.subscribe()

        ringTimeoutRef.current = setTimeout(() => cleanup("missed"), RING_TIMEOUT_MS)
      } catch (e) {
        console.error("[v0] Error accessing camera/microphone:", e)
        cleanup("ended")
      }
    },
    [userId],
  )

  const acceptCall = useCallback(async () => {
    if (!callIdRef.current) return
    setStatus("connecting")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callTypeRef.current === "video",
      })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      await supabase.from("calls").update({ status: "accepted", started_at: new Date().toISOString() }).eq(
        "id",
        callIdRef.current,
      )

      const channel = supabase.channel(`call:${callIdRef.current}`, { config: { broadcast: { self: false } } })
      signalChannelRef.current = channel
      const pc = createPeerConnection(channel, stream)
      pcRef.current = pc
      attachSignalHandlers(channel, pc)
      channel.subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          channel.send({ type: "broadcast", event: "signal", payload: { kind: "ready" } })
        }
      })

      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current)
    } catch (e) {
      console.error("[v0] Error accepting call:", e)
      cleanup("ended")
    }
  }, [callType])

  const declineCall = useCallback(() => {
    if (callIdRef.current) {
      supabase.from("calls").update({ status: "declined", ended_at: new Date().toISOString() }).eq(
        "id",
        callIdRef.current,
      )
      const channel = supabase.channel(`call:${callIdRef.current}`, { config: { broadcast: { self: false } } })
      channel.subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          channel.send({ type: "broadcast", event: "signal", payload: { kind: "declined" } })
          setTimeout(() => supabase.removeChannel(channel), 500)
        }
      })
    }
    cleanup("declined")
  }, [])

  function cleanup(reason: "ended" | "declined" | "missed") {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current)
      ringTimeoutRef.current = null
    }

    if (callIdRef.current && (reason === "ended" || reason === "missed")) {
      const statusValue = reason === "missed" ? "missed" : "ended"
      supabase
        .from("calls")
        .update({ status: statusValue, ended_at: new Date().toISOString() })
        .eq("id", callIdRef.current)
    }

    if (signalChannelRef.current && reason === "ended") {
      signalChannelRef.current.send({ type: "broadcast", event: "signal", payload: { kind: "hangup" } })
    }

    pcRef.current?.close()
    pcRef.current = null

    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null

    if (signalChannelRef.current) {
      supabase.removeChannel(signalChannelRef.current)
      signalChannelRef.current = null
    }

    callIdRef.current = null
    roleRef.current = null
    callTypeRef.current = null
    setStatus("idle")
    setCallType(null)
    setPeer(null)
    setMuted(false)
    setVideoOff(false)
  }

  const hangUp = useCallback(() => cleanup("ended"), [])

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setMuted(!track.enabled)
    }
  }

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setVideoOff(!track.enabled)
    }
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)

  return (
    <CallContext.Provider value={{ status, callType, peer, startCall }}>
      {children}

      {status !== "idle" && peer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {callType === "video" && (status === "connecting" || status === "connected") ? (
              <div className="relative bg-black aspect-video">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-3 right-3 w-24 h-16 object-cover rounded-lg border border-white/20"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 pt-10 pb-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={peer.avatar_url || ""} alt={peer.name} />
                  <AvatarFallback className="text-2xl">{initials(peer.name)}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{peer.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {status === "incoming" && `Incoming ${callType} call...`}
                  {status === "outgoing" && "Calling..."}
                  {status === "connecting" && "Connecting..."}
                  {status === "connected" && "Connected"}
                </p>
              </div>
            )}

            <audio ref={remoteAudioRef} autoPlay hidden={callType === "video"} />

            <div className="flex items-center justify-center gap-4 py-5 border-t">
              {status === "incoming" ? (
                <>
                  <Button size="icon" variant="destructive" className="rounded-full w-14 h-14" onClick={declineCall}>
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700"
                    onClick={acceptCall}
                  >
                    <Phone className="w-6 h-6" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="outline" className="rounded-full w-12 h-12" onClick={toggleMute}>
                    {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  {callType === "video" && (
                    <Button size="icon" variant="outline" className="rounded-full w-12 h-12" onClick={toggleVideo}>
                      {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </Button>
                  )}
                  <Button size="icon" variant="destructive" className="rounded-full w-14 h-14" onClick={hangUp}>
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  )
}
