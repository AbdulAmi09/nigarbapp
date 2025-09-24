import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ChevronLeft, ChevronRight, Trophy, Users, MapPin, Clock, Plus, Filter } from "lucide-react"

export default function CalendarPage() {
  const events = [
    {
      id: 1,
      title: "Lagos State Championship",
      type: "tournament",
      date: "Dec 15-17, 2024",
      time: "9:00 AM",
      location: "Lagos",
      role: "Chief Arbiter",
      status: "confirmed",
    },
    {
      id: 2,
      title: "NCAA Monthly Meeting",
      type: "meeting",
      date: "Dec 20, 2024",
      time: "2:00 PM",
      location: "Virtual",
      role: "Member",
      status: "scheduled",
    },
    {
      id: 3,
      title: "FIDE Arbiters Seminar",
      type: "training",
      date: "Jan 5-7, 2025",
      time: "10:00 AM",
      location: "Abuja",
      role: "Participant",
      status: "registered",
    },
    {
      id: 4,
      title: "National Youth Tournament",
      type: "tournament",
      date: "Jan 20-24, 2025",
      time: "9:00 AM",
      location: "Abuja",
      role: "Deputy Arbiter",
      status: "pending",
    },
    {
      id: 5,
      title: "Zone 4.1 Committee Meeting",
      type: "meeting",
      date: "Feb 1, 2025",
      time: "3:00 PM",
      location: "Lagos",
      role: "Committee Member",
      status: "scheduled",
    },
  ]

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "tournament":
        return "bg-primary/10 text-primary border-primary/20"
      case "meeting":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "training":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600"
      case "scheduled":
        return "bg-blue-500/10 text-blue-600"
      case "registered":
        return "bg-purple-500/10 text-purple-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  // Mock calendar grid for December 2024
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const eventDays = [15, 16, 17, 20] // Days with events

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">NCAA Calendar</h1>
          <p className="text-muted-foreground text-pretty">View and manage your tournament schedule and NCAA events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tournaments</p>
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "tournament").length}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meetings</p>
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "meeting").length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Training</p>
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "training").length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>December 2024</CardTitle>
                  <CardDescription>Your tournament and meeting schedule</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => (
                  <div
                    key={day}
                    className={`p-3 text-center text-sm border rounded-lg cursor-pointer hover:bg-muted/50 ${
                      eventDays.includes(day) ? "bg-primary/10 border-primary/20" : ""
                    }`}
                  >
                    <div className="font-medium">{day}</div>
                    {eventDays.includes(day) && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>Complete list of your scheduled events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {event.type === "tournament" && <Trophy className="w-6 h-6 text-primary" />}
                      {event.type === "meeting" && <Users className="w-6 h-6 text-blue-600" />}
                      {event.type === "training" && <Clock className="w-6 h-6 text-green-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                        <Badge variant="outline" className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{event.date}</span>
                        <span>{event.time}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                        <span>{event.role}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events scheduled for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events
                .filter((event) => event.date.includes("Dec") || event.date.includes("Jan"))
                .map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
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
