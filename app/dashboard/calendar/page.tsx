"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, ChevronLeft, ChevronRight, Trophy, Users, MapPin, Clock, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CalendarEvent {
  id: string
  title: string
  type: string
  startDate: Date
  endDate: Date | null
  hasTime: boolean
  location: string
  role: string
  status: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    fetchCalendarEvents()
  }, [])

  const fetchCalendarEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

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

      const { data: eventsData } = await supabase.from("events").select("*").order("start_date", { ascending: true })

      const calendarEvents: CalendarEvent[] = []

      assignments?.forEach((assignment: any) => {
        const tournament = assignment.tournaments
        if (!tournament?.start_date) return
        calendarEvents.push({
          id: `tournament-${assignment.id}`,
          title: tournament.name,
          type: "tournament",
          startDate: new Date(tournament.start_date),
          endDate: tournament.end_date ? new Date(tournament.end_date) : null,
          hasTime: false,
          location: [tournament.venue, tournament.city].filter(Boolean).join(", ") || "TBD",
          role: assignment.role,
          status: assignment.assignment_status?.toLowerCase() || "pending",
        })
      })

      eventsData?.forEach((event: any) => {
        if (!event.start_date) return
        calendarEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          type: event.event_type || "Event",
          startDate: new Date(event.start_date),
          endDate: event.end_date ? new Date(event.end_date) : null,
          hasTime: true,
          location: [event.venue, event.city].filter(Boolean).join(", ") || "TBD",
          role: "Participant",
          status: "scheduled",
        })
      })

      calendarEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
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

  const formatDateLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatTimeLabel = (e: CalendarEvent) =>
    e.hasTime ? e.startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "All day"

  const typeOptions = useMemo(() => Array.from(new Set(events.map((e) => e.type))).sort(), [events])
  const statusOptions = useMemo(() => Array.from(new Set(events.map((e) => e.status))).sort(), [events])

  const filteredEvents = events.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false
    if (statusFilter !== "all" && e.status !== statusFilter) return false
    return true
  })

  const monthEvents = filteredEvents.filter(
    (e) => e.startDate.getMonth() === currentMonth.getMonth() && e.startDate.getFullYear() === currentMonth.getFullYear(),
  )
  const thisMonthCount = monthEvents.length
  const tournamentsCount = monthEvents.filter((e) => e.type === "tournament").length
  const meetingsCount = monthEvents.filter((e) => e.type === "Meeting").length
  const trainingCount = monthEvents.filter((e) => e.type === "Training").length

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in30Days = new Date(startOfToday)
  in30Days.setDate(in30Days.getDate() + 30)
  const upcomingEvents = filteredEvents.filter((e) => e.startDate >= startOfToday && e.startDate <= in30Days)

  const dayEvents = selectedDay
    ? filteredEvents.filter(
        (e) =>
          e.startDate.getDate() === selectedDay.getDate() &&
          e.startDate.getMonth() === selectedDay.getMonth() &&
          e.startDate.getFullYear() === selectedDay.getFullYear(),
      )
    : []

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

  const eventDays = new Set(monthEvents.map((e) => e.startDate.getDate()))

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const openEvent = (e: CalendarEvent) => {
    setSelectedDay(null)
    setSelectedEvent(e)
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
        <Button variant="outline" asChild>
          <Link href="/dashboard/events">Browse Events</Link>
        </Button>
      </div>

      {/* Summary Cards -- all scoped to the currently viewed month */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{thisMonthCount}</p>
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
                <p className="text-2xl font-bold">{tournamentsCount}</p>
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
                <p className="text-2xl font-bold">{meetingsCount}</p>
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
                <p className="text-2xl font-bold">{trainingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "tournament" ? "Tournament" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
                  <button
                    type="button"
                    key={day}
                    onClick={() =>
                      eventDays.has(day) &&
                      setSelectedDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                    }
                    className={`p-3 text-center text-sm border rounded-lg ${
                      eventDays.has(day) ? "bg-primary/10 border-primary/20 cursor-pointer hover:bg-primary/20" : ""
                    }`}
                  >
                    <div className="font-medium">{day}</div>
                    {eventDays.has(day) && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                      </div>
                    )}
                  </button>
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
              {filteredEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events scheduled</p>
              ) : (
                filteredEvents.map((event) => (
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
                          <span>{formatDateLabel(event.startDate)}</span>
                          <span>{formatTimeLabel(event)}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                          <span>{event.role}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEvent(event)}>
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
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => (
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
                            {formatDateLabel(event.startDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimeLabel(event)}
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
                      <Button variant="outline" size="sm" onClick={() => openEvent(event)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Day dialog */}
      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDay && formatDateLabel(selectedDay)}</DialogTitle>
            <DialogDescription>Events on this day</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <button
                type="button"
                key={event.id}
                onClick={() => openEvent(event)}
                className="w-full text-left flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.title}</span>
                    <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatTimeLabel(event)}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event details dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event details</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={getEventTypeColor(selectedEvent.type)}>{selectedEvent.type}</Badge>
                <Badge variant="outline" className={getStatusColor(selectedEvent.status)}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDateLabel(selectedEvent.startDate)}</span>
                <span className="text-muted-foreground">Time</span>
                <span>{formatTimeLabel(selectedEvent)}</span>
                <span className="text-muted-foreground">Location</span>
                <span>{selectedEvent.location}</span>
                <span className="text-muted-foreground">Role</span>
                <span>{selectedEvent.role}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
