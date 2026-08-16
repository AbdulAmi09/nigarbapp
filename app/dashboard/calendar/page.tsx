"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ChevronLeft, ChevronRight, Trophy, Users, MapPin, Clock, Plus, Filter, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CalendarEvent {
  id: string
  title: string
  type: string
  date: string
  time: string
  location: string
  role: string
  status: string
  end_date?: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchCalendarEvents()
  }, [])

  const fetchCalendarEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch tournaments the user is assigned to
      const { data: assignments } = await supabase
        .from("tournament_assignments")
        .select(`
          id,
          role,
          assignment_status,
          tournaments:tournament_id (
            id,
            name,
            start_date,
            end_date,
            venue,
            city,
            status
          )
        `)
        .eq("arbiter_id", user.id)
        .neq("assignment_status", "Declined")

      // Fetch events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })

      // Combine and format events
      const calendarEvents: CalendarEvent[] = []

      if (assignments) {
        assignments.forEach((assignment: any) => {
          if (assignment.tournaments) {
            const tournament = assignment.tournaments
            calendarEvents.push({
              id: tournament.id,
              title: tournament.name,
              type: "tournament",
              date: new Date(tournament.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              time: "9:00 AM",
              location: tournament.city || tournament.venue || "TBD",
              role: assignment.role,
              status: assignment.assignment_status?.toLowerCase() || "pending",
              end_date: tournament.end_date,
            })
          }
        })
      }

      if (eventsData) {
        eventsData.forEach((event: any) => {
          calendarEvents.push({
            id: event.id,
            title: event.title,
            type: event.event_type || "Event",
            date: new Date(event.start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            time: new Date(event.start_date).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            location: event.city || event.venue || "TBD",
            role: "Participant",
            status: "scheduled",
          })
        })
      }

      setEvents(calendarEvents)
    } catch (error) {
      console.error("Error fetching calendar events:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "tournament":
        return "bg-primary/10 text-primary border-primary/20"
      case "Meeting":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "Training":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "Workshop":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "Conference":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "accepted":
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

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  // Get days with events
  const eventDays = events
    .map((e) => {
      const date = new Date(e.date)
      if (date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()) {
        return date.getDate()
      }
      return null
    })
    .filter(Boolean)

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
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
                <p className="text-2xl font-bold">
                  {
                    events.filter((e) => {
                      const date = new Date(e.date)
                      return (
                        date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()
                      )
                    }).length
                  }
                </p>
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
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "Meeting").length}</p>
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
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.type === "Training").length}
                </p>
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
                  <CardTitle>{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</CardTitle>
                  <CardDescription>Your tournament and meeting schedule</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
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
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="p-3" />
                ))}
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
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events scheduled</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        {event.type === "tournament" && <Trophy className="w-6 h-6 text-primary" />}
                        {event.type === "Meeting" && <Users className="w-6 h-6 text-blue-600" />}
                        {event.type === "Training" && <Clock className="w-6 h-6 text-green-600" />}
                        {!["tournament", "Meeting", "Training", "Workshop", "Conference"].includes(event.type) && (
                          <Calendar className="w-6 h-6 text-primary" />
                        )}
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
                ))
              )}
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
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming events</p>
              ) : (
                events.slice(0, 5).map((event) => (
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
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
