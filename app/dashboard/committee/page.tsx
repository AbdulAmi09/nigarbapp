"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Mail, Phone, Calendar, FileText, Award, MapPin, Clock, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Committee {
  id: string
  name: string
  description: string
  chairman: string
  members: number
  meetings: string
  nextMeeting: string
  status: string
}

interface CommitteeMember {
  id: string
  name: string
  role: string
  title: string
  email: string
  phone: string
  zone: string
  avatar: string
}

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  location: string
  type: string
  agenda: string
  status: string
}

export default function CommitteePage() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [userCommitteeCount, setUserCommitteeCount] = useState(0)

  useEffect(() => {
    fetchCommitteeData()
  }, [])

  const fetchCommitteeData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Fetch committees
      const { data: committeesData } = await supabase
        .from("committees")
        .select(`
          *,
          chairman:chairman_id (first_name, last_name),
          secretary:secretary_id (first_name, last_name)
        `)
        .eq("is_active", true)
        .order("name")

      if (committeesData) {
        const formattedCommittees: Committee[] = committeesData.map((committee: any) => ({
          id: committee.id,
          name: committee.name,
          description: committee.description || committee.purpose || "",
          chairman: committee.chairman ? `${committee.chairman.first_name} ${committee.chairman.last_name}` : "TBD",
          members: committee.members?.length || committee.member_ids?.length || 0,
          meetings: committee.meeting_schedule || "Monthly",
          nextMeeting: committee.next_meeting_date
            ? new Date(committee.next_meeting_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "TBD",
          status: "active",
        }))

        setCommittees(formattedCommittees)

        // Check user's committee membership
        if (user) {
          const userMembershipCount = committeesData.filter(
            (c: any) =>
              c.members?.includes(user.id) ||
              c.member_ids?.includes(user.id) ||
              c.chairman_id === user.id ||
              c.secretary_id === user.id,
          ).length
          setUserCommitteeCount(userMembershipCount)
        }
      }

      // Fetch committee members (excos)
      const { data: excosData } = await supabase.from("excos").select("*").eq("is_active", true).order("order_index")

      if (excosData) {
        const formattedMembers: CommitteeMember[] = excosData.map((exco: any) => ({
          id: exco.id,
          name: exco.name,
          role: exco.role,
          title: exco.bio?.split(" ")[0] || "Committee Member",
          email: exco.email || "",
          phone: exco.phone || "",
          zone: "",
          avatar: exco.photo_url || exco.image_url || "",
        }))
        setCommitteeMembers(formattedMembers)
      }

      // Fetch upcoming meetings from events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("event_type", "meeting")
        .gte("start_date", new Date().toISOString())
        .order("start_date")
        .limit(5)

      if (eventsData) {
        const formattedMeetings: Meeting[] = eventsData.map((event: any) => ({
          id: event.id,
          title: event.title,
          date: new Date(event.start_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          time: new Date(event.start_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          location: event.venue || event.city || "TBD",
          type: event.is_public ? "In-person" : "Virtual",
          agenda: event.description || "",
          status: "scheduled",
        }))
        setMeetings(formattedMeetings)
      }
    } catch (error) {
      console.error("Error fetching committee data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
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
                <p className="text-2xl font-bold">{userCommitteeCount}</p>
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
            {committees.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No committees found</p>
                </CardContent>
              </Card>
            ) : (
              committees.map((committee) => (
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
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Committee Members</CardTitle>
              <CardDescription>Key members across all NCAA committees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {committeeMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No committee members found</p>
              ) : (
                committeeMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                          {member.zone && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {member.zone}
                            </span>
                          )}
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
                ))
              )}
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
              {meetings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming meetings scheduled</p>
              ) : (
                meetings.map((meeting) => (
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
