"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MessageSquare,
  Send,
  Users,
  Hash,
  Search,
  MoreVertical,
  Phone,
  Video,
  Loader2,
  FileUp,
  Mic,
  ChevronDown,
  Download,
  X,
  Plus,
  Pause,
  UsersRound,
  Check,
  CheckCheck,
  Reply,
  Trash2,
  Info,
  Pencil,
  BellOff,
  Bell,
  LogOut,
  UserMinus,
  Settings,
  Smile,
  Forward,
  History,
  PhoneMissed,
  PhoneOutgoing,
  Play,
  BellRing,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCall } from "@/components/call-provider"
import { useOnlinePresence } from "@/components/presence-provider"

interface ChatRoom {
  id: string
  name: string
  room_type: string
  description: string | null
  logo_url: string | null
  is_direct_message: boolean
  direct_message_with: string | null
  created_by: string | null
  member_count?: number
  lastMessage?: string
  lastMessageAt?: string
  lastMessageType?: string
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  sender_role: string | null
  message_type: string
  file_url?: string
  file_name?: string
  file_size?: number
  duration?: number | null
  read_by: string[]
  reply_to?: string | null
  reply_preview?: { content: string; message_type: string } | null
  is_deleted?: boolean
  is_edited?: boolean
}

interface OnlineMember {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
  groupRole?: string
}

interface SearchUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  arbiter_category: string
  fide_id: string | null
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

const MESSAGE_SELECT = `
  id,
  content,
  created_at,
  sender_id,
  message_type,
  file_url,
  file_name,
  file_size,
  duration,
  read_by,
  reply_to,
  is_deleted,
  is_edited,
  profiles:sender_id (
    first_name,
    last_name,
    avatar_url,
    arbiter_level
  ),
  reply_message:reply_to (
    content,
    message_type
  )
`

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const VOICE_BAR_COUNT = 28

function VoiceBubble({ url, isOwn }: { url: string; isOwn: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [peaks, setPeaks] = useState<number[] | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadPeaks() {
      try {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
        const res = await fetch(url)
        const buf = await res.arrayBuffer()
        const ctx = new AudioCtx()
        const audioBuffer = await ctx.decodeAudioData(buf)
        const channel = audioBuffer.getChannelData(0)
        const blockSize = Math.max(1, Math.floor(channel.length / VOICE_BAR_COUNT))
        const bars: number[] = []
        for (let i = 0; i < VOICE_BAR_COUNT; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) sum += Math.abs(channel[i * blockSize + j] || 0)
          bars.push(sum / blockSize)
        }
        const max = Math.max(...bars, 0.0001)
        if (!cancelled) setPeaks(bars.map((b) => Math.max(0.18, b / max)))
        ctx.close()
      } catch {
        if (!cancelled) setPeaks(Array.from({ length: VOICE_BAR_COUNT }, (_, i) => 0.25 + ((i * 37) % 60) / 100))
      }
    }
    loadPeaks()
    return () => {
      cancelled = true
    }
  }, [url])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
  }

  const bars = peaks || Array.from({ length: VOICE_BAR_COUNT }, () => 0.3)

  return (
    <div className={`p-2.5 rounded-lg flex items-center gap-2 w-56 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setProgress(0)
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          const d = e.currentTarget.duration || duration
          if (d) setProgress(e.currentTarget.currentTime / d)
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOwn ? "bg-primary-foreground/20" : "bg-background"}`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex items-end gap-[2px] h-6">
        {bars.map((h, i) => {
          const played = i / bars.length < progress
          return (
            <div
              key={i}
              className={`flex-1 rounded-full ${played ? (isOwn ? "bg-primary-foreground" : "bg-primary") : isOwn ? "bg-primary-foreground/40" : "bg-muted-foreground/30"}`}
              style={{ height: `${Math.max(15, h * 100)}%` }}
            />
          )
        })}
      </div>
      <span className={`text-[10px] tabular-nums shrink-0 ${isOwn ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {formatDuration(playing || progress > 0 ? (audioRef.current?.currentTime ?? duration) : duration)}
      </span>
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const { startCall } = useCall()
  const { onlineIds, pushSupported, pushPermission, enablePush } = useOnlinePresence()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})
  const roomChannelRef = useRef<RealtimeChannel | null>(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [roomMembers, setRoomMembers] = useState<OnlineMember[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [searchRooms, setSearchRooms] = useState("")
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false)
  const [newMessagesCount, setNewMessagesCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showDMSearch, setShowDMSearch] = useState(false)
  const [dmSearchQuery, setDmSearchQuery] = useState("")
  const [dmSearchResults, setDmSearchResults] = useState<SearchUser[]>([])
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupSearchQuery, setGroupSearchQuery] = useState("")
  const [groupSearchResults, setGroupSearchResults] = useState<SearchUser[]>([])
  const [groupMembers, setGroupMembers] = useState<SearchUser[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const [infoMessage, setInfoMessage] = useState<Message | null>(null)
  const [readerNames, setReaderNames] = useState<string[]>([])
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [mutedRoomIds, setMutedRoomIds] = useState<Set<string>>(new Set())
  const [groupInfoName, setGroupInfoName] = useState("")
  const [groupInfoDescription, setGroupInfoDescription] = useState("")
  const [savingGroupInfo, setSavingGroupInfo] = useState(false)
  const [addMemberQuery, setAddMemberQuery] = useState("")
  const [addMemberResults, setAddMemberResults] = useState<SearchUser[]>([])
  const [reactions, setReactions] = useState<Record<string, { emoji: string; userIds: string[] }[]>>({})
  const [openReactionPickerFor, setOpenReactionPickerFor] = useState<string | null>(null)
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null)
  const [showCallLog, setShowCallLog] = useState(false)
  const [callLogEntries, setCallLogEntries] = useState<
    { id: string; peerId: string; peerName: string; call_type: string; status: string; created_at: string; outgoing: boolean }[]
  >([])
  const [loadingCallLog, setLoadingCallLog] = useState(false)
  const [showMessageSearch, setShowMessageSearch] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState("")
  const [messageSearchResults, setMessageSearchResults] = useState<
    { id: string; content: string; message_type: string; created_at: string }[]
  >([])
  const [searchingMessages, setSearchingMessages] = useState(false)
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const messageSearchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const formatMessage = (msg: any): Message => ({
    id: msg.id,
    content: msg.content || "",
    created_at: msg.created_at,
    sender_id: msg.sender_id,
    sender_name: `${msg.profiles?.first_name || ""} ${msg.profiles?.last_name || ""}`.trim() || "Unknown",
    sender_avatar: msg.profiles?.avatar_url || null,
    sender_role: msg.profiles?.arbiter_level || null,
    message_type: msg.message_type || "text",
    file_url: msg.file_url,
    file_name: msg.file_name,
    file_size: msg.file_size,
    duration: msg.duration ?? null,
    read_by: msg.read_by || [],
    reply_to: msg.reply_to,
    reply_preview: msg.reply_message ? { content: msg.reply_message.content, message_type: msg.reply_message.message_type } : null,
    is_deleted: msg.is_deleted || false,
    is_edited: msg.is_edited || false,
  })

  const getOtherUserId = useCallback(
    (room: ChatRoom, uidOverride?: string | null) => {
      const uid = uidOverride ?? currentUserId
      if (!room.is_direct_message || !uid) return null
      if (room.created_by === uid) return room.direct_message_with
      return room.created_by
    },
    [currentUserId],
  )

  const notifyPush = useCallback((roomId: string, messageId: string, preview: string) => {
    fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, messageId, preview }),
    }).catch(() => {})
  }, [])

  const refreshRoomsMeta = useCallback(
    async (rooms: ChatRoom[], userId: string) => {
      if (rooms.length === 0) return

      const roomIds = rooms.map((r) => r.id)

      const { data: unread } = await supabase.from("unread_messages").select("room_id, unread_count").eq("user_id", userId)
      const counts: Record<string, number> = {}
      unread?.forEach((u: any) => {
        counts[u.room_id] = u.unread_count
      })
      setUnreadCounts(counts)

      const { data: recent } = await supabase
        .from("chat_messages")
        .select("room_id, content, message_type, created_at, is_deleted")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false })
        .limit(300)

      const lastByRoom: Record<string, any> = {}
      recent?.forEach((m: any) => {
        if (!lastByRoom[m.room_id]) lastByRoom[m.room_id] = m
      })

      const preview = (m: any) => {
        if (!m) return { text: "No messages yet", at: null }
        if (m.is_deleted) return { text: "This message was deleted", at: m.created_at }
        switch (m.message_type) {
          case "image":
            return { text: "📷 Photo", at: m.created_at }
          case "video":
            return { text: "🎥 Video", at: m.created_at }
          case "voice":
            return { text: "🎤 Voice message", at: m.created_at }
          case "file":
            return { text: "📎 File", at: m.created_at }
          default:
            return { text: m.content, at: m.created_at }
        }
      }

      setChatRooms((prev) => {
        const updated = prev.map((r) => {
          const p = preview(lastByRoom[r.id])
          return { ...r, lastMessage: p.text, lastMessageAt: p.at || undefined }
        })
        updated.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
        return updated
      })
      setFilteredRooms((prev) => {
        const updated = prev.map((r) => {
          const p = preview(lastByRoom[r.id])
          return { ...r, lastMessage: p.text, lastMessageAt: p.at || undefined }
        })
        updated.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
        return updated
      })
    },
    [supabase],
  )

  useEffect(() => {
    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setCurrentUserId(user.id)

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      setIsSuperadmin(profile?.role === "superadmin")

      const { data: memberRooms } = await supabase
        .from("group_members")
        .select(
          `
          group_id,
          chat_rooms!inner (
            id,
            name,
            room_type,
            description,
            logo_url,
            is_direct_message,
            direct_message_with,
            created_by
          )
        `,
        )
        .eq("user_id", user.id)

      if (memberRooms && memberRooms.length > 0) {
        const rooms: ChatRoom[] = memberRooms.map((m: any) => ({
          ...m.chat_rooms,
          member_count: 0,
        }))

        setChatRooms(rooms)
        setFilteredRooms(rooms)
        await refreshRoomsMeta(rooms, user.id)

        const { data: mutedRows } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .eq("is_muted", true)
        setMutedRoomIds(new Set((mutedRows || []).map((r: any) => r.group_id)))

        if (rooms.length > 0) {
          setActiveRoom(rooms[0])
          await fetchMessages(rooms[0].id)
          await fetchRoomMembers(rooms[0])
          await fetchOtherUserLastSeen(rooms[0], user.id)
          await markRoomAsRead(rooms[0].id, user.id)
        }
      }

      setLoading(false)
    }

    initialize()
  }, [router, supabase])

  // Live signal for chat-list updates: last message + unread count changing
  // in ANY room, not just the one currently open.
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`unread-watch-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unread_messages", filter: `user_id=eq.${currentUserId}` },
        () => {
          setChatRooms((rooms) => {
            refreshRoomsMeta(rooms, currentUserId)
            return rooms
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, refreshRoomsMeta])

  useEffect(() => {
    if (!activeRoom || !currentUserId) return

    const channel = supabase
      .channel(`room_${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        async (payload) => {
          const { data } = await supabase.from("chat_messages").select(MESSAGE_SELECT).eq("id", payload.new.id).single()

          if (data) {
            const newMsg = formatMessage(data)
            setMessages((prev) => [...prev, newMsg])
            setNewMessagesCount((prev) => prev + 1)
            setShowNewMessagesButton(true)
            if (newMsg.sender_id !== currentUserId) {
              markRoomAsRead(activeRoom.id, currentUserId)
            }
          }
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        setMessages((prev) => {
          if (prev.length > 0) fetchReactions(prev.map((m) => m.id))
          return prev
        })
      })
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: { userId: string; name: string } }) => {
        if (payload.userId === currentUserId) return
        setTypingUsers((prev) => ({ ...prev, [payload.userId]: payload.name }))
        if (typingTimeoutsRef.current[payload.userId]) clearTimeout(typingTimeoutsRef.current[payload.userId])
        typingTimeoutsRef.current[payload.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev }
            delete next[payload.userId]
            return next
          })
        }, 3000)
      })
      .subscribe()

    roomChannelRef.current = channel

    return () => {
      roomChannelRef.current = null
      supabase.removeChannel(channel)
      setTypingUsers({})
    }
  }, [activeRoom, currentUserId, supabase])

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return
    const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setShowNewMessagesButton(!isAtBottom)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowNewMessagesButton(false)
    setNewMessagesCount(0)
  }

  async function fetchMessages(roomId: string) {
    const { data } = await supabase
      .from("chat_messages")
      .select(MESSAGE_SELECT)
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (data) {
      setMessages(data.map(formatMessage))
      fetchReactions(data.map((m: any) => m.id))
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  async function fetchReactions(messageIds: string[]) {
    if (messageIds.length === 0) {
      setReactions({})
      return
    }
    const { data } = await supabase.from("message_reactions").select("message_id, user_id, emoji").in("message_id", messageIds)

    const grouped: Record<string, Record<string, string[]>> = {}
    data?.forEach((r: any) => {
      grouped[r.message_id] = grouped[r.message_id] || {}
      grouped[r.message_id][r.emoji] = grouped[r.message_id][r.emoji] || []
      grouped[r.message_id][r.emoji].push(r.user_id)
    })

    const result: Record<string, { emoji: string; userIds: string[] }[]> = {}
    Object.entries(grouped).forEach(([msgId, emojiMap]) => {
      result[msgId] = Object.entries(emojiMap).map(([emoji, userIds]) => ({ emoji, userIds }))
    })
    setReactions(result)
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return
    setOpenReactionPickerFor(null)

    const existing = reactions[messageId]?.find((r) => r.emoji === emoji)
    const alreadyReacted = existing?.userIds.includes(currentUserId)

    if (alreadyReacted) {
      await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji)
      setReactions((prev) => {
        const next = { ...prev }
        next[messageId] = (next[messageId] || [])
          .map((r) => (r.emoji === emoji ? { ...r, userIds: r.userIds.filter((id) => id !== currentUserId) } : r))
          .filter((r) => r.userIds.length > 0)
        return next
      })
    } else {
      await supabase.from("message_reactions").insert({ message_id: messageId, user_id: currentUserId, emoji })
      setReactions((prev) => {
        const next = { ...prev }
        const list = next[messageId] ? [...next[messageId]] : []
        const idx = list.findIndex((r) => r.emoji === emoji)
        if (idx >= 0) list[idx] = { ...list[idx], userIds: [...list[idx].userIds, currentUserId] }
        else list.push({ emoji, userIds: [currentUserId] })
        next[messageId] = list
        return next
      })
    }
  }

  const handleForward = async (targetRoomId: string) => {
    if (!forwardingMessage || !currentUserId) return
    const { data: inserted } = await supabase
      .from("chat_messages")
      .insert({
        room_id: targetRoomId,
        sender_id: currentUserId,
        content: forwardingMessage.content,
        message_type: forwardingMessage.message_type,
        file_url: forwardingMessage.file_url || null,
        file_name: forwardingMessage.file_name || null,
        file_size: forwardingMessage.file_size || null,
        duration: forwardingMessage.duration || null,
      })
      .select("id")
      .single()
    if (inserted) notifyPush(targetRoomId, inserted.id, forwardingMessage.content)
    setForwardingMessage(null)
  }

  const openCallLog = async () => {
    setShowCallLog(true)
    if (!currentUserId) return
    setLoadingCallLog(true)

    const { data } = await supabase
      .from("calls")
      .select("id, caller_id, callee_id, call_type, status, created_at")
      .or(`caller_id.eq.${currentUserId},callee_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) {
      const peerIds = Array.from(new Set(data.map((c: any) => (c.caller_id === currentUserId ? c.callee_id : c.caller_id))))
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", peerIds)
      const nameMap: Record<string, string> = {}
      profiles?.forEach((p: any) => {
        nameMap[p.id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"
      })

      setCallLogEntries(
        data.map((c: any) => {
          const peerId = c.caller_id === currentUserId ? c.callee_id : c.caller_id
          return {
            id: c.id,
            peerId,
            peerName: nameMap[peerId] || "Unknown",
            call_type: c.call_type,
            status: c.status,
            created_at: c.created_at,
            outgoing: c.caller_id === currentUserId,
          }
        }),
      )
    }
    setLoadingCallLog(false)
  }

  const searchMessages = (query: string) => {
    setMessageSearchQuery(query)
    if (messageSearchDebounceRef.current) clearTimeout(messageSearchDebounceRef.current)
    if (!query.trim() || !activeRoom) {
      setMessageSearchResults([])
      return
    }
    messageSearchDebounceRef.current = setTimeout(async () => {
      setSearchingMessages(true)
      const { data } = await supabase
        .from("chat_messages")
        .select("id, content, message_type, created_at")
        .eq("room_id", activeRoom.id)
        .eq("is_deleted", false)
        .ilike("content", `%${query.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(20)
      setMessageSearchResults(data || [])
      setSearchingMessages(false)
    }, 300)
  }

  const closeMessageSearch = () => {
    setShowMessageSearch(false)
    setMessageSearchQuery("")
    setMessageSearchResults([])
  }

  const jumpToMessage = async (target: { id: string; created_at: string }) => {
    if (!activeRoom) return
    if (!messages.some((m) => m.id === target.id)) {
      const { data } = await supabase
        .from("chat_messages")
        .select(MESSAGE_SELECT)
        .eq("room_id", activeRoom.id)
        .lte("created_at", target.created_at)
        .order("created_at", { ascending: false })
        .limit(50)
      if (data) {
        const loaded = data.map(formatMessage).reverse()
        setMessages(loaded)
        fetchReactions(loaded.map((m) => m.id))
      }
    }
    closeMessageSearch()
    setHighlightedMessageId(target.id)
    setTimeout(() => {
      messageRefs.current[target.id]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 150)
    setTimeout(() => setHighlightedMessageId((cur) => (cur === target.id ? null : cur)), 2000)
  }

  async function fetchOtherUserLastSeen(room: ChatRoom, uidOverride?: string | null) {
    const otherId = getOtherUserId(room, uidOverride)
    if (!otherId) {
      setOtherUserLastSeen(null)
      return
    }
    const { data } = await supabase.from("profiles").select("last_seen_at").eq("id", otherId).single()
    setOtherUserLastSeen(data?.last_seen_at || null)
  }

  async function fetchRoomMembers(room: ChatRoom) {
    const { data } = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        role,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          arbiter_level
        )
      `,
      )
      .eq("group_id", room.id)
      .limit(50)

    if (data) {
      const members: OnlineMember[] = data.map((member: any) => ({
        id: member.user_id,
        name: `${member.profiles?.first_name || ""} ${member.profiles?.last_name || ""}`.trim() || "Unknown",
        role: member.profiles?.arbiter_level || null,
        avatar_url: member.profiles?.avatar_url || null,
        groupRole: member.role,
      }))
      setRoomMembers(members)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeRoom || !currentUserId) return

    const file = e.target.files?.[0]
    if (!file) return

    const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
    if (file.size > MAX_UPLOAD_BYTES) {
      alert("File is too large. Max upload size is 50MB.")
      e.target.value = ""
      return
    }

    setUploadingFile(true)

    try {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      const folder = isImage ? "images" : isVideo ? "videos" : "files"
      const fileName = `${currentUserId}/${activeRoom.id}/${folder}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName)

      const messageType = isImage ? "image" : isVideo ? "video" : "file"
      const label = isImage ? `[Image: ${file.name}]` : isVideo ? `[Video: ${file.name}]` : `[File: ${file.name}]`

      const { data: inserted } = await supabase
        .from("chat_messages")
        .insert({
          room_id: activeRoom.id,
          sender_id: currentUserId,
          content: label,
          message_type: messageType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        })
        .select("id")
        .single()

      if (inserted) notifyPush(activeRoom.id, inserted.id, label)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
    } finally {
      setUploadingFile(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      recordingStartTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await uploadVoiceMessage(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
        setRecordingDuration(0)
      }

      mediaRecorder.start()
      setIsRecording(true)

      recordingIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        setRecordingDuration(duration)
      }, 100)
    } catch (error) {
      console.error("[v0] Error accessing microphone:", error)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      audioChunksRef.current = []
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  async function uploadVoiceMessage(audioBlob: Blob) {
    if (!activeRoom || !currentUserId) return

    try {
      const fileName = `${currentUserId}/${activeRoom.id}/${Date.now()}-voice.webm`
      const { error: uploadError } = await supabase.storage.from("chat-uploads").upload(fileName, audioBlob)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("chat-uploads").getPublicUrl(fileName)

      const { data: inserted } = await supabase
        .from("chat_messages")
        .insert({
          room_id: activeRoom.id,
          sender_id: currentUserId,
          content: "[Voice Message]",
          message_type: "voice",
          file_url: urlData.publicUrl,
          file_name: "voice.webm",
          file_size: audioBlob.size,
          duration: recordingDuration,
        })
        .select("id")
        .single()

      if (inserted) notifyPush(activeRoom.id, inserted.id, "🎤 Voice message")
    } catch (error) {
      console.error("[v0] Error uploading voice message:", error)
    }
  }

  const searchUsersForDM = async (query: string) => {
    setDmSearchQuery(query)
    if (!query.trim()) {
      setDmSearchResults([])
      return
    }

    const { data } = await supabase.rpc("search_users_for_dm", { p_search_query: query, p_limit: 10 })

    if (data) {
      setDmSearchResults(data)
    }
  }

  const createDirectMessage = async (otherUserId: string) => {
    if (!currentUserId) return

    try {
      const { data: roomId } = await supabase.rpc("get_or_create_dm_room", {
        p_user_id: currentUserId,
        p_other_user_id: otherUserId,
      })

      if (roomId) {
        const { data: newRoom } = await supabase.from("chat_rooms").select("*").eq("id", roomId).single()

        if (newRoom) {
          const room: ChatRoom = {
            ...newRoom,
            member_count: 2,
          }
          setChatRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]))
          setFilteredRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]))
          setActiveRoom(room)
          await fetchMessages(room.id)
          await fetchRoomMembers(room)
          await fetchOtherUserLastSeen(room)
          await markRoomAsRead(room.id, currentUserId)
        }
      }

      setShowDMSearch(false)
      setDmSearchQuery("")
      setDmSearchResults([])
    } catch (error) {
      console.error("[v0] Error creating DM:", error)
    }
  }

  const searchUsersForGroup = async (query: string) => {
    setGroupSearchQuery(query)
    if (!query.trim()) {
      setGroupSearchResults([])
      return
    }

    const { data } = await supabase.rpc("search_users_for_dm", { p_search_query: query, p_limit: 10 })
    if (data) {
      setGroupSearchResults(data.filter((u: SearchUser) => !groupMembers.some((m) => m.id === u.id)))
    }
  }

  const addGroupMember = (user: SearchUser) => {
    setGroupMembers((prev) => [...prev, user])
    setGroupSearchResults((prev) => prev.filter((u) => u.id !== user.id))
    setGroupSearchQuery("")
  }

  const removeGroupMember = (userId: string) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== userId))
  }

  const handleCreateGroup = async () => {
    if (!currentUserId || !groupName.trim() || groupMembers.length === 0) return
    setCreatingGroup(true)

    try {
      const memberIds = [currentUserId, ...groupMembers.map((m) => m.id)]

      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          name: groupName.trim(),
          room_type: "Private",
          is_private: true,
          is_direct_message: false,
          created_by: currentUserId,
          members: memberIds,
        })
        .select()
        .single()

      if (roomError) throw roomError

      const { error: membersError } = await supabase.from("group_members").insert(
        memberIds.map((id) => ({ group_id: room.id, user_id: id, role: id === currentUserId ? "admin" : "member" })),
      )

      if (membersError) throw membersError

      const newRoom: ChatRoom = { ...room, member_count: memberIds.length }
      setChatRooms((prev) => [newRoom, ...prev])
      setFilteredRooms((prev) => [newRoom, ...prev])
      setActiveRoom(newRoom)
      await fetchMessages(newRoom.id)
      await fetchRoomMembers(newRoom)

      setShowCreateGroup(false)
      setGroupName("")
      setGroupMembers([])
      setGroupSearchQuery("")
      setGroupSearchResults([])
    } catch (error) {
      console.error("[v0] Error creating group:", error)
    } finally {
      setCreatingGroup(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeRoom || !currentUserId) return

    if (editingMessageId) {
      await handleSaveEdit()
      return
    }

    setSending(true)

    try {
      const { data: inserted, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: activeRoom.id,
          sender_id: currentUserId,
          content: newMessage.trim(),
          message_type: "text",
          reply_to: replyingTo?.id || null,
        })
        .select("id")
        .single()

      if (error) throw error

      if (inserted) notifyPush(activeRoom.id, inserted.id, newMessage.trim())

      setNewMessage("")
      setReplyingTo(null)
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const startEditMessage = (message: Message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
    setNewMessage(message.content)
    setReplyingTo(null)
  }

  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingContent("")
    setNewMessage("")
  }

  async function handleSaveEdit() {
    if (!editingMessageId || !newMessage.trim() || !currentUserId) return
    setSending(true)
    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ content: newMessage.trim(), is_edited: true, edited_at: new Date().toISOString() })
        .eq("id", editingMessageId)
        .eq("sender_id", currentUserId)

      if (error) throw error

      setMessages((prev) =>
        prev.map((m) => (m.id === editingMessageId ? { ...m, content: newMessage.trim(), is_edited: true } : m)),
      )
      cancelEditMessage()
    } catch (error) {
      console.error("[v0] Error editing message:", error)
    } finally {
      setSending(false)
    }
  }

  const toggleMuteRoom = async (roomId: string) => {
    const currentlyMuted = mutedRoomIds.has(roomId)
    const { error } = await supabase.rpc("set_group_mute", { p_group_id: roomId, p_muted: !currentlyMuted })
    if (error) {
      console.error("[v0] Error toggling mute:", error)
      return
    }
    setMutedRoomIds((prev) => {
      const next = new Set(prev)
      if (currentlyMuted) next.delete(roomId)
      else next.add(roomId)
      return next
    })
  }

  const handleLeaveGroup = async () => {
    if (!activeRoom || !currentUserId) return
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", activeRoom.id)
      .eq("user_id", currentUserId)

    if (error) {
      console.error("[v0] Error leaving group:", error)
      return
    }

    setChatRooms((prev) => prev.filter((r) => r.id !== activeRoom.id))
    setFilteredRooms((prev) => prev.filter((r) => r.id !== activeRoom.id))
    setShowGroupInfo(false)
    setActiveRoom(null)
    setMessages([])
    setRoomMembers([])
  }

  const handleRemoveMember = async (userId: string) => {
    if (!activeRoom) return
    const { error } = await supabase.from("group_members").delete().eq("group_id", activeRoom.id).eq("user_id", userId)
    if (error) {
      console.error("[v0] Error removing member:", error)
      return
    }
    setRoomMembers((prev) => prev.filter((m) => m.id !== userId))
  }

  const searchUsersToAdd = async (query: string) => {
    setAddMemberQuery(query)
    if (!query.trim()) {
      setAddMemberResults([])
      return
    }
    const { data } = await supabase.rpc("search_users_for_dm", { p_search_query: query, p_limit: 10 })
    if (data) {
      setAddMemberResults(data.filter((u: SearchUser) => !roomMembers.some((m) => m.id === u.id)))
    }
  }

  const handleAddMember = async (user: SearchUser) => {
    if (!activeRoom) return
    const { error } = await supabase.from("group_members").insert({ group_id: activeRoom.id, user_id: user.id, role: "member" })
    if (error) {
      console.error("[v0] Error adding member:", error)
      return
    }
    setAddMemberQuery("")
    setAddMemberResults([])
    await fetchRoomMembers(activeRoom)
  }

  const openGroupInfo = () => {
    if (!activeRoom) return
    setGroupInfoName(activeRoom.name)
    setGroupInfoDescription(activeRoom.description || "")
    setShowGroupInfo(true)
  }

  const handleSaveGroupInfo = async () => {
    if (!activeRoom || !groupInfoName.trim()) return
    setSavingGroupInfo(true)
    try {
      const { error } = await supabase
        .from("chat_rooms")
        .update({ name: groupInfoName.trim(), description: groupInfoDescription.trim() || null })
        .eq("id", activeRoom.id)

      if (error) throw error

      const updated = { ...activeRoom, name: groupInfoName.trim(), description: groupInfoDescription.trim() || null }
      setActiveRoom(updated)
      setChatRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)))
      setFilteredRooms((prev) => prev.map((r) => (r.id === activeRoom.id ? updated : r)))
    } catch (error) {
      console.error("[v0] Error saving group info:", error)
    } finally {
      setSavingGroupInfo(false)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    if (!activeRoom || !currentUserId || !roomChannelRef.current) return

    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now

    const myName = roomMembers.find((m) => m.id === currentUserId)?.name || "Someone"
    roomChannelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, name: myName } })
  }

  const handleDeleteMessage = async (messageId: string) => {
    await supabase
      .from("chat_messages")
      .update({ is_deleted: true, content: "", file_url: null })
      .eq("id", messageId)
      .eq("sender_id", currentUserId)

    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: "" } : m)))
  }

  const openMessageInfo = async (message: Message) => {
    setInfoMessage(message)
    const otherReaders = message.read_by.filter((id) => id !== message.sender_id)
    if (otherReaders.length === 0) {
      setReaderNames([])
      return
    }
    const { data } = await supabase.from("profiles").select("id, first_name, last_name").in("id", otherReaders)
    setReaderNames((data || []).map((p: any) => `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"))
  }

  async function handleRoomChange(room: ChatRoom) {
    setActiveRoom(room)
    setShowNewMessagesButton(false)
    setNewMessagesCount(0)
    setReplyingTo(null)
    setOpenReactionPickerFor(null)
    closeMessageSearch()
    cancelEditMessage()
    await fetchMessages(room.id)
    await fetchRoomMembers(room)
    await fetchOtherUserLastSeen(room)
    if (currentUserId) {
      await markRoomAsRead(room.id, currentUserId)
    }
  }

  async function markRoomAsRead(roomId: string, userId: string) {
    try {
      await supabase.rpc("mark_messages_as_read", { p_user_id: userId, p_room_id: roomId })
      setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }))
    } catch (error) {
      console.error("[v0] Error marking room as read:", error)
    }
  }

  const handleSearchRooms = (searchTerm: string) => {
    setSearchRooms(searchTerm)
    if (!searchTerm.trim()) {
      setFilteredRooms(chatRooms)
    } else {
      const filtered = chatRooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredRooms(filtered)
    }
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "Zone":
        return "bg-primary/10 text-primary"
      case "Committee":
        return "bg-blue-500/10 text-blue-600"
      case "General":
        return "bg-green-500/10 text-green-600"
      case "Tournament":
        return "bg-purple-500/10 text-purple-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getArbiterTitle = (level: string | null) => {
    switch (level) {
      case "International":
        return "IA"
      case "FIDE":
        return "FA"
      case "National":
        return "NA"
      case "Candidate":
        return "CA"
      default:
        return "Arbiter"
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return null
    const diffMs = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "last seen just now"
    if (mins < 60) return `last seen ${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `last seen ${hours}h ago`
    return `last seen ${new Date(dateString).toLocaleDateString()}`
  }

  const dayLabel = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })
  }

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = []
    for (const msg of messages) {
      const label = dayLabel(msg.created_at)
      const last = groups[groups.length - 1]
      if (last && last.date === label) {
        last.items.push(msg)
      } else {
        groups.push({ date: label, items: [msg] })
      }
    }
    return groups
  }, [messages])

  const activeRoomOtherUserId = activeRoom ? getOtherUserId(activeRoom) : null
  const activeRoomOnline = activeRoomOtherUserId ? onlineIds.has(activeRoomOtherUserId) : false
  const typingNames = Object.values(typingUsers)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-px flex-1 min-h-0 bg-border">
        {/* Chat Rooms Sidebar */}
        <div className="lg:col-span-1 bg-background flex flex-col min-h-0">
          <div className="p-3 border-b space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chats</h2>
              <div className="flex items-center">
                {pushSupported && pushPermission !== "granted" && (
                  <Button variant="ghost" size="icon" onClick={() => enablePush()} title="Enable message notifications">
                    <BellRing className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={openCallLog} title="Call log">
                  <History className="w-4 h-4" />
                </Button>
                {isSuperadmin && (
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(!showCreateGroup)} title="Create group">
                    <UsersRound className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setShowDMSearch(!showDMSearch)} title="Start direct message">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search chats..." className="pl-10" value={searchRooms} onChange={(e) => handleSearchRooms(e.target.value)} />
            </div>
          </div>

          {showDMSearch && (
            <div className="p-3 border-b bg-muted/50 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Input placeholder="Search by FIDE ID..." value={dmSearchQuery} onChange={(e) => searchUsersForDM(e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setShowDMSearch(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {dmSearchQuery.trim() && dmSearchResults.length === 0 && (
                <p className="text-xs text-muted-foreground px-2">No arbiter found with that FIDE ID.</p>
              )}
              {dmSearchResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {dmSearchResults.map((user) => (
                    <button key={user.id} onClick={() => createDirectMessage(user.id)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/70 text-left">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">FIDE ID: {user.fide_id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showCreateGroup && (
            <div className="p-3 border-b bg-muted/50 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <Input placeholder="Group name..." value={groupName} onChange={(e) => setGroupName(e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {groupMembers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {groupMembers.map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1">
                      {m.name}
                      <button onClick={() => removeGroupMember(m.id)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Input placeholder="Add members by FIDE ID..." value={groupSearchQuery} onChange={(e) => searchUsersForGroup(e.target.value)} />
              {groupSearchResults.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {groupSearchResults.map((user) => (
                    <button key={user.id} onClick={() => addGroupMember(user)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/70 text-left">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">FIDE ID: {user.fide_id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Button size="sm" className="w-full" onClick={handleCreateGroup} disabled={creatingGroup || !groupName.trim() || groupMembers.length === 0}>
                {creatingGroup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Group
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-1 p-2">
              {filteredRooms.map((room) => {
                const otherId = getOtherUserId(room)
                const online = otherId ? onlineIds.has(otherId) : false
                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomChange(room)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${activeRoom?.id === room.id ? "bg-primary/10" : ""}`}
                  >
                    <div className="relative shrink-0">
                      {room.logo_url ? (
                        <img src={room.logo_url || "/placeholder.svg"} alt={room.name} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${getRoomTypeColor(room.room_type)}`}>
                          {room.is_direct_message ? <MessageSquare className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                        </div>
                      )}
                      {room.is_direct_message && online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate flex items-center gap-1">
                          {room.name}
                          {mutedRoomIds.has(room.id) && <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />}
                        </p>
                        {room.lastMessageAt && <span className="text-xs text-muted-foreground shrink-0">{formatTime(room.lastMessageAt)}</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">{room.lastMessage || room.description || "No messages yet"}</p>
                        {unreadCounts[room.id] > 0 && !mutedRoomIds.has(room.id) && (
                          <Badge variant="destructive" className="text-xs shrink-0">
                            {unreadCounts[room.id]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredRooms.length === 0 && <p className="text-center text-muted-foreground py-4">No chat rooms found</p>}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-2 bg-background flex flex-col min-h-0">
          <div className="p-3 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {activeRoom?.logo_url ? (
                <img src={activeRoom.logo_url || "/placeholder.svg"} alt={activeRoom.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  {activeRoom?.is_direct_message ? <MessageSquare className="w-5 h-5 text-primary" /> : <Hash className="w-5 h-5 text-primary" />}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{activeRoom?.name || "Select a room"}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {typingNames.length > 0
                    ? `${typingNames.join(", ")} typing...`
                    : activeRoom?.is_direct_message
                      ? activeRoomOnline
                        ? "online"
                        : formatLastSeen(otherUserLastSeen) || "offline"
                      : `${roomMembers.length} members`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {activeRoom && activeRoomOtherUserId && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => activeRoomOtherUserId && startCall(activeRoomOtherUserId, activeRoom.id, "voice")} title="Voice call">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => activeRoomOtherUserId && startCall(activeRoomOtherUserId, activeRoom.id, "video")} title="Video call">
                    <Video className="w-4 h-4" />
                  </Button>
                </>
              )}
              {activeRoom && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowMessageSearch((v) => !v)
                    if (showMessageSearch) closeMessageSearch()
                  }}
                  title="Search messages"
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
              {activeRoom && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleMuteRoom(activeRoom.id)}
                  title={mutedRoomIds.has(activeRoom.id) ? "Unmute" : "Mute"}
                >
                  {mutedRoomIds.has(activeRoom.id) ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </Button>
              )}
              {activeRoom && !activeRoom.is_direct_message ? (
                <Button variant="ghost" size="icon" onClick={openGroupInfo} title="Group info">
                  <Settings className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {showMessageSearch && (
            <div className="px-3 py-2 border-b bg-muted/50 shrink-0 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  autoFocus
                  placeholder="Search in this chat..."
                  className="pl-10 pr-8"
                  value={messageSearchQuery}
                  onChange={(e) => searchMessages(e.target.value)}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={closeMessageSearch}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {messageSearchQuery.trim() && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-background shadow-sm">
                  {searchingMessages ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : messageSearchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No messages found</p>
                  ) : (
                    messageSearchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => jumpToMessage(r)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/70 border-b last:border-b-0"
                      >
                        <p className="text-sm truncate">{r.message_type === "text" ? r.content : `[${r.message_type}]`}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 space-y-1 relative min-h-0">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center my-3">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{group.date}</span>
                </div>
                {group.items.map((message) => {
                  if (message.message_type === "call") {
                    const missed = message.content.startsWith("Missed")
                    return (
                      <div
                        key={message.id}
                        ref={(el) => {
                          messageRefs.current[message.id] = el
                        }}
                        className={`flex justify-center my-2 rounded-lg transition-colors ${highlightedMessageId === message.id ? "bg-yellow-100 dark:bg-yellow-900/30" : ""}`}
                      >
                        <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          {missed ? (
                            <PhoneMissed className="w-3.5 h-3.5 text-destructive" />
                          ) : (
                            <PhoneOutgoing className="w-3.5 h-3.5" />
                          )}
                          {message.content} · {formatTime(message.created_at)}
                        </span>
                      </div>
                    )
                  }

                  const isOwn = message.sender_id === currentUserId
                  const isRead = activeRoom?.is_direct_message
                    ? !!(activeRoomOtherUserId && message.read_by.includes(activeRoomOtherUserId))
                    : message.read_by.some((id) => id !== message.sender_id)
                  const messageReactions = reactions[message.id] || []

                  return (
                    <div
                      key={message.id}
                      ref={(el) => {
                        messageRefs.current[message.id] = el
                      }}
                      className={`group flex gap-3 py-1.5 rounded-lg transition-colors ${isOwn ? "flex-row-reverse" : ""} ${highlightedMessageId === message.id ? "bg-yellow-100 dark:bg-yellow-900/30" : ""}`}
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={message.sender_avatar || ""} alt={message.sender_name} />
                        <AvatarFallback>
                          {message.sender_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 max-w-xs ${isOwn ? "text-right" : ""}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <p className="text-sm font-medium">{message.sender_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getArbiterTitle(message.sender_role)}
                          </Badge>
                        </div>

                        {message.reply_preview && (
                          <div className={`text-xs border-l-2 border-primary/50 pl-2 mb-1 text-muted-foreground truncate ${isOwn ? "ml-auto" : ""}`}>
                            {message.reply_preview.message_type === "text" ? message.reply_preview.content : `[${message.reply_preview.message_type}]`}
                          </div>
                        )}

                        <div className={`inline-flex items-end gap-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <div className={isOwn ? "ml-auto" : ""}>
                            {message.is_deleted ? (
                              <div className="p-3 rounded-lg bg-muted italic text-sm text-muted-foreground">This message was deleted</div>
                            ) : (
                              <>
                                {message.message_type === "text" && (
                                  <div className={`p-3 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                    <p className="text-sm text-left">{message.content}</p>
                                  </div>
                                )}
                                {message.message_type === "image" && message.file_url && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImageUrl(message.file_url!)}
                                    className="rounded-lg overflow-hidden block cursor-zoom-in"
                                  >
                                    <img src={message.file_url || "/placeholder.svg"} alt={message.file_name} className="max-w-xs h-auto" />
                                  </button>
                                )}
                                {message.message_type === "video" && message.file_url && (
                                  <div className="rounded-lg overflow-hidden max-w-xs">
                                    <video controls className="w-full h-auto" src={message.file_url} />
                                  </div>
                                )}
                                {message.message_type === "file" && message.file_url && (
                                  <a href={message.file_url} download className={`p-3 rounded-lg flex items-center gap-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                    <FileUp className="w-4 h-4" />
                                    <span className="text-sm truncate">{message.file_name}</span>
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                                {message.message_type === "voice" && message.file_url && (
                                  <VoiceBubble url={message.file_url} isOwn={isOwn} />
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity relative">
                            {!message.is_deleted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6"
                                onClick={() => setOpenReactionPickerFor(openReactionPickerFor === message.id ? null : message.id)}
                                title="React"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {openReactionPickerFor === message.id && (
                              <div className={`absolute top-7 z-10 bg-popover border rounded-full shadow-lg flex items-center gap-0.5 p-1 ${isOwn ? "right-0" : "left-0"}`}>
                                {REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    className="text-lg hover:scale-125 transition-transform px-0.5"
                                    onClick={() => toggleReaction(message.id, emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!message.is_deleted && (
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setReplyingTo(message)} title="Reply">
                                <Reply className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {!message.is_deleted && (
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setForwardingMessage(message)} title="Forward">
                                <Forward className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {isOwn && (
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => openMessageInfo(message)} title="Info">
                                <Info className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {isOwn && !message.is_deleted && message.message_type === "text" && (
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => startEditMessage(message)} title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {isOwn && !message.is_deleted && (
                              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleDeleteMessage(message.id)} title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {messageReactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                            {messageReactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReaction(message.id, r.emoji)}
                                className={`text-xs rounded-full px-1.5 py-0.5 border flex items-center gap-1 ${
                                  currentUserId && r.userIds.includes(currentUserId) ? "bg-primary/10 border-primary/30" : "bg-muted border-transparent"
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span className="text-muted-foreground">{r.userIds.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : ""}`}>
                          {message.is_edited && !message.is_deleted && <span className="text-xs text-muted-foreground">(edited)</span>}
                          <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                          {isOwn && !message.is_deleted && (
                            isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-muted-foreground" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>}
            <div ref={messagesEndRef} />
          </div>

          {showNewMessagesButton && (
            <button onClick={scrollToBottom} className="absolute bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 flex items-center gap-2">
              <ChevronDown className="w-5 h-5" />
              <span className="text-sm font-medium">{newMessagesCount}</span>
            </button>
          )}

          {isRecording && (
            <div className="px-4 py-3 bg-red-500/10 border-t border-red-200 flex items-center gap-3 shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-600">Recording...</span>
                  <span className="text-sm text-red-600 ml-auto">{formatDuration(recordingDuration)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={cancelRecording}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={pauseRecording}>
                  <Pause className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={stopRecording}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {editingMessageId ? (
            <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between shrink-0">
              <div className="text-xs text-muted-foreground truncate">
                <Pencil className="w-3 h-3 inline mr-1" />
                Editing message
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={cancelEditMessage}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            replyingTo && (
              <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between shrink-0">
                <div className="text-xs text-muted-foreground truncate">
                  Replying to <span className="font-medium">{replyingTo.sender_name}</span>: {replyingTo.message_type === "text" ? replyingTo.content : `[${replyingTo.message_type}]`}
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => setReplyingTo(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )
          )}

          <form onSubmit={handleSendMessage} className="p-4 border-t shrink-0">
            <div className="flex gap-2 items-end">
              <Input
                placeholder="Type your message..."
                className="flex-1"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                disabled={sending || !activeRoom || isRecording}
              />
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
              <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || !activeRoom || isRecording}>
                {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={isRecording ? stopRecording : startRecording} disabled={!activeRoom} className={isRecording ? "bg-red-500/10 text-red-600" : ""}>
                <Mic className="w-4 h-4" />
              </Button>
              <Button type="submit" size="icon" disabled={sending || !newMessage.trim() || !activeRoom || isRecording}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Members Sidebar */}
        <div className="lg:col-span-1 bg-background flex flex-col min-h-0">
          <div className="p-3 border-b shrink-0">
            <h3 className="text-lg font-semibold">{activeRoom?.is_direct_message ? "Contact" : "Members"}</h3>
            {!activeRoom?.is_direct_message && (
              <p className="text-xs text-muted-foreground">
                {roomMembers.filter((m) => onlineIds.has(m.id)).length} of {roomMembers.length} online
              </p>
            )}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 min-h-0">
            {roomMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatar_url || ""} alt={member.name} />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${onlineIds.has(member.id) ? "bg-green-500" : "bg-gray-300"}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{onlineIds.has(member.id) ? "online" : getArbiterTitle(member.role)}</p>
                </div>
              </div>
            ))}
            {roomMembers.length === 0 && <p className="text-center text-muted-foreground py-4">No members</p>}
          </div>
        </div>
      </div>

      <Dialog open={!!infoMessage} onOpenChange={(open) => !open && setInfoMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Info</DialogTitle>
            <DialogDescription>{infoMessage && formatTime(infoMessage.created_at)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted text-sm">
              {infoMessage?.message_type === "text" ? infoMessage.content : `[${infoMessage?.message_type}]`}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Seen by</p>
              {readerNames.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one else has read this yet.</p>
              ) : (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {readerNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group Info</DialogTitle>
            <DialogDescription>{roomMembers.length} members</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(() => {
              const canEditDetails = isSuperadmin && activeRoom?.created_by === currentUserId
              const canManageMembers = isSuperadmin
              return (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Group Name</p>
                    {canEditDetails ? (
                      <Input value={groupInfoName} onChange={(e) => setGroupInfoName(e.target.value)} />
                    ) : (
                      <p className="text-sm">{activeRoom?.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    {canEditDetails ? (
                      <Input
                        value={groupInfoDescription}
                        onChange={(e) => setGroupInfoDescription(e.target.value)}
                        placeholder="Add a description..."
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{activeRoom?.description || "No description"}</p>
                    )}
                  </div>

                  {canEditDetails && (
                    <Button size="sm" onClick={handleSaveGroupInfo} disabled={savingGroupInfo || !groupInfoName.trim()}>
                      {savingGroupInfo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Members</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {roomMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-2 py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={member.avatar_url || ""} alt={member.name} />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm truncate">{member.name}</p>
                              {member.groupRole === "admin" && <p className="text-xs text-muted-foreground">Admin</p>}
                            </div>
                          </div>
                          {canManageMembers && member.id !== currentUserId && (
                            <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0" onClick={() => handleRemoveMember(member.id)} title="Remove">
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {canManageMembers && (
                    <div className="space-y-2">
                      <Input placeholder="Add member by FIDE ID..." value={addMemberQuery} onChange={(e) => searchUsersToAdd(e.target.value)} />
                      {addMemberResults.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {addMemberResults.map((user) => (
                            <button key={user.id} onClick={() => handleAddMember(user)} className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/70 text-left">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">FIDE ID: {user.fide_id}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Button variant="outline" className="w-full text-destructive" onClick={handleLeaveGroup}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Group
                  </Button>
                </>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!forwardingMessage} onOpenChange={(open) => !open && setForwardingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>
              {forwardingMessage?.message_type === "text" ? forwardingMessage.content : `[${forwardingMessage?.message_type}]`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {chatRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleForward(room.id)}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted/70 text-left"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getRoomTypeColor(room.room_type)}`}>
                  {room.is_direct_message ? <MessageSquare className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                </div>
                <p className="text-sm font-medium truncate">{room.name}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCallLog} onOpenChange={setShowCallLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Log</DialogTitle>
          </DialogHeader>
          {loadingCallLog ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : callLogEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No calls yet</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {callLogEntries.map((entry) => {
                const missed = !entry.outgoing && entry.status === "missed"
                return (
                  <div key={entry.id} className="flex items-center gap-3 p-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${missed ? "bg-destructive/10" : "bg-muted"}`}>
                      {entry.call_type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${missed ? "text-destructive" : ""}`}>{entry.peerName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {entry.outgoing ? <PhoneOutgoing className="w-3 h-3" /> : <PhoneMissed className="w-3 h-3" />}
                        {new Date(entry.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const dmRoom = chatRooms.find((r) => getOtherUserId(r) === entry.peerId)
                        setShowCallLog(false)
                        startCall(entry.peerId, dmRoom?.id || null, entry.call_type as "voice" | "video")
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxImageUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxImageUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <a
            href={lightboxImageUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 text-white/80 hover:text-white"
          >
            <Download className="w-6 h-6" />
          </a>
          <img
            src={lightboxImageUrl || "/placeholder.svg"}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
