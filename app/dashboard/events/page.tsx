"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Calendar, MapPin, Users, Clock, Star, Filter, Search, Plus, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Event {
  id: string
  title: string
  type: string
  category: string
  date: string
  location: string
  organizer: string
  participants: number
  registrationDeadline: string
  fee: string
  status: string
  description: string
  prizes: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: true })

      if (error) throw error

      const formattedEvents: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        type: event.event_type || "Event",
        category: event.event_type || "General",
        date: formatDateRange(event.start_date, event.end_date),
        location: [event.venue, event.city, event.state].filter(Boolean).join(", ") || "TBD",
        organizer: "NCAA",
        participants: event.current_attendees || event.max_attendees || 0,
        registrationDeadline: event.registration_deadline
          ? new Date(event.registration_deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "TBD",
        fee: event.registration_fee ? `₦${Number(event.registration_fee).toLocaleString()}` : "Free",
        status: getEventStatus(event.start_date, event.end_date),
        description: event.description || "",
        prizes: event.materials_url || "Certificates available",
      }))

      setEvents(formattedEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start

    if (now < start) return "open"
    if (now >= start && now <= end) return "ongoing"
    return "completed"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "ongoing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "closed":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      case "completed":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Tournament":
        return "bg-primary/10 text-primary"
      case "Training":
        return "bg-blue-500/10 text-blue-600"
      case "Workshop":
        return "bg-green-500/10 text-green-600"
      case "Conference":
        return "bg-purple-500/10 text-purple-600"
      case "Meeting":
        return "bg-orange-500/10 text-orange-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || event.type === typeFilter
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

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
          <h1 className="text-3xl font-bold text-balance">Events & Programs</h1>
          <p className="text-muted-foreground text-pretty">
            Discover and participate in NCAA tournaments, training programs, and special events.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Submit Event
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Events</p>
                <p className="text-2xl font-bold">{events.filter((e) => e.status === "open").length}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tournaments</p>
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "Tournament").length}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Training Programs</p>
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.type === "Training").length}
                </p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{events.reduce((sum, e) => sum + e.participants, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Tournament">Tournament</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No events found</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{event.title}</h3>
                              <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={getTypeColor(event.type)}>{event.type}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">
                              {event.description || "No description available"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{event.participants} participants</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>Deadline: {event.registrationDeadline}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Fee: {event.fee}</span>
                            <span className="text-muted-foreground">Organizer: {event.organizer}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Trophy className="w-4 h-4 inline mr-1" />
                            {event.prizes}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        {event.status === "open" && (
                          <>
                            <Button className="w-full">Register Now</Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              View Details
                            </Button>
                          </>
                        )}
                        {event.status === "ongoing" && (
                          <>
                            <Button variant="outline" className="w-full bg-transparent">
                              View Results
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Live Updates
                            </Button>
                          </>
                        )}
                        {(event.status === "closed" || event.status === "completed") && (
                          <Button variant="outline" className="w-full bg-transparent">
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-4">
          <div className="space-y-4">
            {filteredEvents.filter((e) => e.type === "Tournament").length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No tournaments found</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents
                .filter((e) => e.type === "Tournament")
                .map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{event.title}</h3>
                              <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{event.description}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{event.participants} participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-muted-foreground" />
                              <span>{event.prizes}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium">Entry Fee: {event.fee}</span>
                              <span className="text-muted-foreground">Deadline: {event.registrationDeadline}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          {event.status === "open" && (
                            <>
                              <Button className="w-full">Register</Button>
                              <Button variant="outline" className="w-full bg-transparent">
                                Tournament Info
                              </Button>
                            </>
                          )}
                          {event.status === "ongoing" && (
                            <>
                              <Button variant="outline" className="w-full bg-transparent">
                                Live Standings
                              </Button>
                              <Button variant="outline" className="w-full bg-transparent">
                                Pairings
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="space-y-4">
            {filteredEvents.filter((e) => e.type === "Training" || e.type === "Workshop")
              .length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No training programs found</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents
                .filter((e) => e.type === "Training" || e.type === "Workshop")
                .map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{event.title}</h3>
                              <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                            </div>
                            <Badge className={getTypeColor(event.type)}>{event.type}</Badge>
                            <p className="text-muted-foreground mt-3">{event.description}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{event.participants} participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-muted-foreground" />
                              <span>{event.prizes}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          {event.status === "open" && (
                            <>
                              <Button className="w-full">Register</Button>
                              <Button variant="outline" className="w-full bg-transparent">
                                Program Details
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
