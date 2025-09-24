import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Mail, Phone, Calendar, FileText, Award, MapPin, Clock } from "lucide-react"

export default function CommitteePage() {
  const committees = [
    {
      id: 1,
      name: "Technical Committee",
      description: "Oversees tournament regulations and technical standards",
      chairman: "Dr. Adebayo Ogundimu",
      members: 8,
      meetings: "Monthly",
      nextMeeting: "Dec 20, 2024",
      status: "active",
    },
    {
      id: 2,
      name: "Arbiters Committee",
      description: "Manages arbiter certification and development programs",
      chairman: "IA Fatima Hassan",
      members: 12,
      meetings: "Bi-monthly",
      nextMeeting: "Jan 15, 2025",
      status: "active",
    },
    {
      id: 3,
      name: "Development Committee",
      description: "Focuses on chess development and grassroots programs",
      chairman: "FM John Okafor",
      members: 10,
      meetings: "Monthly",
      nextMeeting: "Jan 5, 2025",
      status: "active",
    },
    {
      id: 4,
      name: "Finance Committee",
      description: "Manages NCAA finances and budget allocation",
      chairman: "Mrs. Sarah Adamu",
      members: 6,
      meetings: "Quarterly",
      nextMeeting: "Mar 1, 2025",
      status: "active",
    },
  ]

  const committeeMembers = [
    {
      name: "Dr. Adebayo Ogundimu",
      role: "Chairman",
      title: "International Arbiter",
      email: "adebayo@ncaa.ng",
      phone: "+234 801 234 5678",
      zone: "Zone 4.1",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "IA Fatima Hassan",
      role: "Vice Chairman",
      title: "International Arbiter",
      email: "fatima@ncaa.ng",
      phone: "+234 802 345 6789",
      zone: "Zone 4.2",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "FM John Okafor",
      role: "Secretary",
      title: "FIDE Master",
      email: "john@ncaa.ng",
      phone: "+234 803 456 7890",
      zone: "Zone 4.3",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Mrs. Sarah Adamu",
      role: "Treasurer",
      title: "National Arbiter",
      email: "sarah@ncaa.ng",
      phone: "+234 804 567 8901",
      zone: "Zone 4.4",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "IA Michael Obi",
      role: "Member",
      title: "International Arbiter",
      email: "michael@ncaa.ng",
      phone: "+234 805 678 9012",
      zone: "Zone 4.1",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const meetings = [
    {
      id: 1,
      title: "Technical Committee Meeting",
      date: "Dec 20, 2024",
      time: "2:00 PM",
      location: "NCAA Headquarters, Lagos",
      type: "In-person",
      agenda: "Tournament regulations review",
      status: "scheduled",
    },
    {
      id: 2,
      title: "Arbiters Committee Meeting",
      date: "Jan 15, 2025",
      time: "3:00 PM",
      location: "Virtual Meeting",
      type: "Virtual",
      agenda: "Certification program updates",
      status: "scheduled",
    },
    {
      id: 3,
      title: "Development Committee Meeting",
      date: "Jan 5, 2025",
      time: "10:00 AM",
      location: "Abuja Office",
      type: "In-person",
      agenda: "Grassroots program planning",
      status: "scheduled",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600"
      case "scheduled":
        return "bg-blue-500/10 text-blue-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Committee</h1>
        <p className="text-muted-foreground text-pretty">View committee information, members, and upcoming meetings.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Committees</p>
                <p className="text-2xl font-bold">{committees.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{committees.reduce((sum, c) => sum + c.members, 0)}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Meetings</p>
                <p className="text-2xl font-bold">{meetings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Committees</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="committees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="committees">Committees</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="committees" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {committees.map((committee) => (
              <Card key={committee.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{committee.name}</CardTitle>
                      <CardDescription className="mt-1">{committee.description}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(committee.status)}>{committee.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Chairman</p>
                      <p className="font-medium">{committee.chairman}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-medium">{committee.members} members</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meetings</p>
                      <p className="font-medium">{committee.meetings}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Meeting</p>
                      <p className="font-medium">{committee.nextMeeting}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Join Meeting
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Committee Members</CardTitle>
              <CardDescription>Key members across all NCAA committees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {committeeMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{member.name}</h3>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.title}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {member.zone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Scheduled committee meetings and events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <Badge className={getStatusColor(meeting.status)}>{meeting.status}</Badge>
                        <Badge variant="outline">{meeting.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{meeting.agenda}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{meeting.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{meeting.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Agenda
                      </Button>
                      <Button size="sm">Join Meeting</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
