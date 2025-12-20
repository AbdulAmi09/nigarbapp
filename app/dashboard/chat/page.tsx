"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, Users, Hash, Search, MoreVertical, Phone, Video, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface ChatRoom {
  id: string
  name: string
  type: string
  description: string | null
  member_count: number
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  sender_role: string | null
}

interface OnlineMember {
  id: string
  name: string
  role: string | null
  avatar_url: string | null
  status: string
}

export default function ChatPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

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

      // Fetch chat rooms
      const { data: rooms } = await supabase.from("chat_rooms").select("*").order("name")

      if (rooms && rooms.length > 0) {
        setChatRooms(rooms)
        setActiveRoom(rooms[0])
        await fetchMessages(rooms[0].id)
        await fetchOnlineMembers(rooms[0].id)
      }

      setLoading(false)
    }

    initialize()
  }, [router, supabase])

  useEffect(() => {
    if (!activeRoom) return

    // Subscribe to new messages in the active room
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
          // Fetch the full message with sender info
          const { data } = await supabase
            .from("chat_messages")
            .select(`
              id,
              content,
              created_at,
              sender_id,
              profiles:sender_id (
                first_name,
                last_name,
                avatar_url,
                arbiter_level
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            const profile = data.profiles as any
            const newMsg: Message = {
              id: data.id,
              content: data.content,
              created_at: data.created_at,
              sender_id: data.sender_id,
              sender_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Unknown",
              sender_avatar: profile?.avatar_url || null,
              sender_role: profile?.arbiter_level || null,
            }
            setMessages((prev) => [...prev, newMsg])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeRoom, supabase])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchMessages(roomId: string) {
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        id,
        content,
        created_at,
        sender_id,
        profiles:sender_id (
          first_name,
          last_name,
          avatar_url,
          arbiter_level
        )
      `)
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (data) {
      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        sender_name: `${msg.profiles?.first_name || ""} ${msg.profiles?.last_name || ""}`.trim() || "Unknown",
        sender_avatar: msg.profiles?.avatar_url || null,
        sender_role: msg.profiles?.arbiter_level || null,
      }))
      setMessages(formattedMessages)
    }
  }

  async function fetchOnlineMembers(roomId: string) {
    // For now, fetch some recent active members
    const { data } = await supabase
      .from("chat_room_members")
      .select(`
        user_id,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          arbiter_level
        )
      `)
      .eq("room_id", roomId)
      .limit(10)

    if (data) {
      const members: OnlineMember[] = data.map((member: any) => ({
        id: member.user_id,
        name: `${member.profiles?.first_name || ""} ${member.profiles?.last_name || ""}`.trim() || "Unknown",
        role: member.profiles?.arbiter_level || null,
        avatar_url: member.profiles?.avatar_url || null,
        status: Math.random() > 0.5 ? "online" : "away", // Placeholder for actual presence
      }))
      setOnlineMembers(members)
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
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  async function handleRoomChange(room: ChatRoom) {
    setActiveRoom(room)
    await fetchMessages(room.id)
    await fetchOnlineMembers(room.id)
  }

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "zone":
        return "bg-primary/10 text-primary"
      case "role":
        return "bg-blue-500/10 text-blue-600"
      case "general":
        return "bg-green-500/10 text-green-600"
      case "training":
        return "bg-purple-500/10 text-purple-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getArbiterTitle = (level: string | null) => {
    switch (level) {
      case "international":
        return "IA"
      case "fide":
        return "FA"
      case "national":
        return "NA"
      case "candidate":
        return "CA"
      default:
        return "Arbiter"
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Chat Rooms</CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search rooms..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomChange(room)}
                    className={`flex items-center gap-3 p-3 mx-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      activeRoom?.id === room.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoomTypeColor(room.type)}`}
                    >
                      {room.type === "zone" && <Hash className="w-5 h-5" />}
                      {room.type === "role" && <Users className="w-5 h-5" />}
                      {room.type === "general" && <MessageSquare className="w-5 h-5" />}
                      {room.type === "training" && <Users className="w-5 h-5" />}
                    </div>
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
                      <p className="text-xs text-muted-foreground">{room.member_count || 0} members</p>
                    </div>
                  </div>
                ))}
                {chatRooms.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No chat rooms available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Hash className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{activeRoom?.name || "Select a room"}</h3>
                    <p className="text-sm text-muted-foreground">{activeRoom?.member_count || 0} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        <div
                          className={`p-3 rounded-lg ${isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}
                        >
                          <p className="text-sm">{message.content}</p>
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

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    className="flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending || !activeRoom}
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim() || !activeRoom}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Members Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Online Members</CardTitle>
              <CardDescription>
                {onlineMembers.filter((m) => m.status === "online").length} of {onlineMembers.length} members online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
