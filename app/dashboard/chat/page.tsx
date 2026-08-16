"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useCall } from "@/components/call-provider"

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
}

interface OnlineMember {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
  status: string
}

interface SearchUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  arbiter_category: string
  fide_id: string | null
}

export default function ChatPage() {
  const router = useRouter()
  const { startCall } = useCall()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<number>(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([])
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
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

      // Fetch only rooms where user is a member
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

        if (rooms.length > 0) {
          setActiveRoom(rooms[0])
          await fetchMessages(rooms[0].id)
          await fetchOnlineMembers(rooms[0].id)
          await markRoomAsRead(rooms[0].id, user.id)
        }
      }

      setLoading(false)
    }

    initialize()
  }, [router, supabase])

  useEffect(() => {
    if (!activeRoom) return

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
          const { data } = await supabase
            .from("chat_messages")
            .select(
              `
              id,
              content,
              created_at,
              sender_id,
              message_type,
              file_url,
              file_name,
              file_size,
              profiles:sender_id (
                first_name,
                last_name,
                avatar_url,
                arbiter_level
              )
            `,
            )
            .eq("id", payload.new.id)
            .single()

          if (data) {
            const profile = data.profiles as any
            const newMsg: Message = {
              id: data.id,
              content: data.content || "",
              created_at: data.created_at,
              sender_id: data.sender_id,
              sender_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Unknown",
              sender_avatar: profile?.avatar_url || null,
              sender_role: profile?.arbiter_level || null,
              message_type: data.message_type || "text",
              file_url: data.file_url,
              file_name: data.file_name,
              file_size: data.file_size,
            }
            setMessages((prev) => [...prev, newMsg])
            setNewMessagesCount((prev) => prev + 1)
            setShowNewMessagesButton(true)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeRoom, supabase])

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
      .select(
        `
        id,
        content,
        created_at,
        sender_id,
        message_type,
        file_url,
        file_name,
        file_size,
        profiles:sender_id (
          first_name,
          last_name,
          avatar_url,
          arbiter_level
        )
      `,
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (data) {
      const formattedMessages: Message[] = data.map((msg: any) => ({
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
      }))
      setMessages(formattedMessages)
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  async function fetchOnlineMembers(roomId: string) {
    const { data } = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          arbiter_level
        )
      `,
      )
      .eq("group_id", roomId)
      .limit(10)

    if (data) {
      const members: OnlineMember[] = data.map((member: any) => ({
        id: member.user_id,
        name: `${member.profiles?.first_name || ""} ${member.profiles?.last_name || ""}`.trim() || "Unknown",
        role: member.profiles?.arbiter_level || null,
        avatar_url: member.profiles?.avatar_url || null,
        status: Math.random() > 0.5 ? "online" : "away",
      }))
      setOnlineMembers(members)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeRoom || !currentUserId) return

    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)

    try {
      const isImage = file.type.startsWith("image/")
      const folder = isImage ? "images" : "files"
      const fileName = `${currentUserId}/${activeRoom.id}/${folder}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName)

      const messageType = isImage ? "image" : "file"

      await supabase.from("chat_messages").insert({
        room_id: activeRoom.id,
        sender_id: currentUserId,
        content: isImage ? `[Image: ${file.name}]` : `[File: ${file.name}]`,
        message_type: messageType,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
      })

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

      // Update recording duration
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

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
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

      await supabase.from("chat_messages").insert({
        room_id: activeRoom.id,
        sender_id: currentUserId,
        content: "[Voice Message]",
        message_type: "voice",
        file_url: urlData.publicUrl,
        file_name: "voice.webm",
        file_size: audioBlob.size,
        duration: recordingDuration,
      })
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
        // Fetch the new room data
        const { data: newRoom } = await supabase.from("chat_rooms").select("*").eq("id", roomId).single()

        if (newRoom) {
          const room: ChatRoom = {
            ...newRoom,
            member_count: 2,
          }
          setChatRooms((prev) => [room, ...prev])
          setFilteredRooms((prev) => [room, ...prev])
          setActiveRoom(room)
          await fetchMessages(room.id)
          await fetchOnlineMembers(room.id)
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
          room_type: "Group",
          is_private: true,
          is_direct_message: false,
          created_by: currentUserId,
          members: memberIds,
        })
        .select()
        .single()

      if (roomError) throw roomError

      const { error: membersError } = await supabase.from("group_members").insert(
        memberIds.map((id) => ({ group_id: room.id, user_id: id, role: id === currentUserId ? "owner" : "member" })),
      )

      if (membersError) throw membersError

      const newRoom: ChatRoom = { ...room, member_count: memberIds.length }
      setChatRooms((prev) => [newRoom, ...prev])
      setFilteredRooms((prev) => [newRoom, ...prev])
      setActiveRoom(newRoom)
      await fetchMessages(newRoom.id)
      await fetchOnlineMembers(newRoom.id)

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

    setSending(true)

    try {
      const { error } = await supabase.from("chat_messages").insert({
        room_id: activeRoom.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        message_type: "text",
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  async function handleRoomChange(room: ChatRoom) {
    setActiveRoom(room)
    setShowNewMessagesButton(false)
    setNewMessagesCount(0)
    await fetchMessages(room.id)
    await fetchOnlineMembers(room.id)
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

  const getOtherUserId = (room: ChatRoom) => {
    if (!room.is_direct_message || !currentUserId) return null
    if (room.created_by === currentUserId) return room.direct_message_with
    return room.created_by
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Chat Room</h1>
        <p className="text-muted-foreground text-pretty">
          Connect and communicate with fellow arbiters across different zones and committees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Rooms Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Chat Rooms</CardTitle>
                <div className="flex items-center">
                  {isSuperadmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCreateGroup(!showCreateGroup)}
                      title="Create group"
                    >
                      <UsersRound className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDMSearch(!showDMSearch)}
                    title="Start direct message"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search rooms..."
                  className="pl-10"
                  value={searchRooms}
                  onChange={(e) => handleSearchRooms(e.target.value)}
                />
              </div>
            </CardHeader>

            {showDMSearch && (
              <div className="p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder="Search by FIDE ID..."
                    value={dmSearchQuery}
                    onChange={(e) => searchUsersForDM(e.target.value)}
                    className="flex-1"
                  />
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
                      <button
                        key={user.id}
                        onClick={() => createDirectMessage(user.id)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/70 text-left"
                      >
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
              <div className="p-3 border-b bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1"
                  />
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

                <Input
                  placeholder="Add members by FIDE ID..."
                  value={groupSearchQuery}
                  onChange={(e) => searchUsersForGroup(e.target.value)}
                />
                {groupSearchResults.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {groupSearchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addGroupMember(user)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted/70 text-left"
                      >
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

                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !groupName.trim() || groupMembers.length === 0}
                >
                  {creatingGroup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Group
                </Button>
              </div>
            )}

            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="space-y-1">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomChange(room)}
                    className={`flex items-center gap-3 p-3 mx-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      activeRoom?.id === room.id ? "bg-primary/10" : ""
                    }`}
                  >
                    {room.logo_url ? (
                      <img
                        src={room.logo_url || "/placeholder.svg"}
                        alt={room.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoomTypeColor(room.room_type)}`}
                      >
                        {room.is_direct_message ? <MessageSquare className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{room.name}</p>
                        {unreadCounts[room.id] > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {unreadCounts[room.id]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{room.description || "No description"}</p>
                    </div>
                  </div>
                ))}
                {filteredRooms.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No chat rooms found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeRoom?.logo_url ? (
                    <img
                      src={activeRoom.logo_url || "/placeholder.svg"}
                      alt={activeRoom.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {activeRoom?.is_direct_message ? (
                        <MessageSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Hash className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{activeRoom?.name || "Select a room"}</h3>
                    <p className="text-sm text-muted-foreground">{onlineMembers.length} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeRoom && getOtherUserId(activeRoom) && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const otherId = getOtherUserId(activeRoom)
                          if (otherId) startCall(otherId, activeRoom.id, "voice")
                        }}
                        title="Voice call"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const otherId = getOtherUserId(activeRoom)
                          if (otherId) startCall(otherId, activeRoom.id, "video")
                        }}
                        title="Video call"
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Messages Container - Proper scroll containment */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              >
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUserId
                  return (
                    <div key={message.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-8 h-8">
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
                          <p className="text-xs text-muted-foreground">{formatTime(message.created_at)}</p>
                        </div>
                        <div className={`${isOwn ? "ml-auto" : ""}`}>
                          {message.message_type === "text" && (
                            <div
                              className={`p-3 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )}
                          {message.message_type === "image" && message.file_url && (
                            <div className={`rounded-lg overflow-hidden ${isOwn ? "ml-auto" : ""}`}>
                              <img
                                src={message.file_url || "/placeholder.svg"}
                                alt={message.file_name}
                                className="max-w-xs h-auto"
                              />
                            </div>
                          )}
                          {message.message_type === "file" && message.file_url && (
                            <a
                              href={message.file_url}
                              download
                              className={`p-3 rounded-lg flex items-center gap-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                            >
                              <FileUp className="w-4 h-4" />
                              <span className="text-sm truncate">{message.file_name}</span>
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {message.message_type === "voice" && message.file_url && (
                            <div
                              className={`p-3 rounded-lg ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                            >
                              <audio controls className="w-full max-w-xs h-8">
                                <source src={message.file_url} type="audio/webm" />
                              </audio>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {showNewMessagesButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  <ChevronDown className="w-5 h-5" />
                  <span className="text-sm font-medium">{newMessagesCount}</span>
                </button>
              )}

              {isRecording && (
                <div className="px-4 py-3 bg-red-500/10 border-t border-red-200 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-red-600">Recording...</span>
                      <span className="text-sm text-red-600 ml-auto">{formatDuration(recordingDuration)}</span>
                    </div>
                    <div className="mt-2 h-6 bg-red-200/50 rounded flex items-center overflow-hidden">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-full bg-red-500 mx-0.5"
                          style={{
                            opacity: Math.random() * 0.5 + 0.5,
                            animation: `pulse 0.3s ease-in-out ${i * 0.05}s infinite`,
                          }}
                        ></div>
                      ))}
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

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Type your message..."
                    className="flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending || !activeRoom || isRecording}
                  />
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || !activeRoom || isRecording}
                  >
                    {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!activeRoom}
                    className={isRecording ? "bg-red-500/10 text-red-600" : ""}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !newMessage.trim() || !activeRoom || isRecording}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Members Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Online Members</CardTitle>
              <CardDescription>
                {onlineMembers.filter((m) => m.status === "online").length} of {onlineMembers.length} members online
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 overflow-y-auto">
              {onlineMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar_url || ""} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                        member.status === "online" ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{getArbiterTitle(member.role)}</p>
                  </div>
                </div>
              ))}
              {onlineMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No members online</p>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Users className="w-4 h-4 mr-2" />
                    View All Members
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Room Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
