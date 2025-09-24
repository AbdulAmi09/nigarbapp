import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send, Users, Hash, Search, MoreVertical, Phone, Video } from "lucide-react"

export default function ChatPage() {
  const chatRooms = [
    {
      id: 1,
      name: "Zone 4.1 - Lagos",
      type: "zone",
      members: 24,
      unread: 3,
      lastMessage: "Tournament schedule updated",
      lastTime: "2 min ago",
      active: true,
    },
    {
      id: 2,
      name: "Chief Arbiters",
      type: "role",
      members: 12,
      unread: 0,
      lastMessage: "New evaluation forms available",
      lastTime: "1 hour ago",
      active: false,
    },
    {
      id: 3,
      name: "NCAA General",
      type: "general",
      members: 248,
      unread: 7,
      lastMessage: "Welcome new members!",
      lastTime: "3 hours ago",
      active: false,
    },
    {
      id: 4,
      name: "Training & Development",
      type: "training",
      members: 56,
      unread: 1,
      lastMessage: "FIDE seminar registration open",
      lastTime: "1 day ago",
      active: false,
    },
  ]

  const messages = [
    {
      id: 1,
      sender: "John Adebayo",
      role: "Chief Arbiter",
      message: "Good morning everyone! The Lagos State Championship schedule has been updated.",
      time: "9:15 AM",
      avatar: "/placeholder.svg?height=32&width=32",
      isOwn: false,
    },
    {
      id: 2,
      sender: "You",
      role: "International Arbiter",
      message: "Thanks for the update, John. I've reviewed the new schedule.",
      time: "9:18 AM",
      avatar: "/chess-arbiter-avatar.jpg",
      isOwn: true,
    },
    {
      id: 3,
      sender: "Sarah Okafor",
      role: "FIDE Arbiter",
      message: "Are there any changes to the venue arrangements?",
      time: "9:20 AM",
      avatar: "/placeholder.svg?height=32&width=32",
      isOwn: false,
    },
    {
      id: 4,
      sender: "John Adebayo",
      role: "Chief Arbiter",
      message: "No changes to the venue. Everything remains at the Lagos Chess Center.",
      time: "9:22 AM",
      avatar: "/placeholder.svg?height=32&width=32",
      isOwn: false,
    },
  ]

  const onlineMembers = [
    { name: "John Adebayo", role: "Chief Arbiter", status: "online" },
    { name: "Sarah Okafor", role: "FIDE Arbiter", status: "online" },
    { name: "Michael Obi", role: "National Arbiter", status: "away" },
    { name: "Fatima Hassan", role: "International Arbiter", status: "online" },
  ]

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
                    className={`flex items-center gap-3 p-3 mx-3 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      room.active ? "bg-primary/10" : ""
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
                        {room.unread > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {room.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                      <p className="text-xs text-muted-foreground">{room.lastTime}</p>
                    </div>
                  </div>
                ))}
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
                    <h3 className="font-semibold">Zone 4.1 - Lagos</h3>
                    <p className="text-sm text-muted-foreground">24 members</p>
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
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.sender} />
                      <AvatarFallback>
                        {message.sender
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-xs ${message.isOwn ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{message.sender}</p>
                        <Badge variant="outline" className="text-xs">
                          {message.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{message.time}</p>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.isOwn ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input placeholder="Type your message..." className="flex-1" />
                  <Button size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Online Members</CardTitle>
              <CardDescription>4 of 24 members online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {onlineMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt={member.name} />
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
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}

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
