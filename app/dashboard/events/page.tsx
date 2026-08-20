"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Calendar, MapPin, Users, Clock, Search, Loader2, Check, FileText } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Event {
  id: string
  title: string
  type: string
  date: string
  location: string
  organizer: string
  participants: number
  maxAttendees: number | null
  registrationDeadline: string | null
  fee: string
  feeAmount: number
  status: string
  description: string
  materialsUrl: string | null
}

interface Registration {
  status: string
  payment_status: string
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [registrations, setRegistrations] = useState<Record<string, Registration>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || "")
      }

      const { data, error } = await supabase.rpc("get_events_with_organizer")

      if (error) throw error

      const formattedEvents: Event[] = (data || [])
        .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .map((event: any) => ({
          id: event.id,
          title: event.title,
          type: event.event_type || "Event",
          date: formatDateRange(event.start_date, event.end_date),
          location: [event.venue, event.city, event.state].filter(Boolean).join(", ") || "TBD",
          organizer: event.organizer_name || "NCAA",
          participants: event.current_attendees || 0,
          maxAttendees: event.max_attendees ?? null,
          registrationDeadline: event.registration_deadline,
          fee: event.registration_fee ? `₦${Number(event.registration_fee).toLocaleString()}` : "Free",
          feeAmount: Number(event.registration_fee) || 0,
          status: getEventStatus(event.start_date, event.end_date, event.registration_deadline),
          description: event.description || "",
          materialsUrl: event.materials_url || null,
        }))

      setEvents(formattedEvents)

      if (user) {
        const { data: regData } = await supabase
          .from("event_registrations")
          .select("event_id, status, payment_status")
          .eq("arbiter_id", user.id)

        const regMap: Record<string, Registration> = {}
        regData?.forEach((r: any) => {
          regMap[r.event_id] = { status: r.status, payment_status: r.payment_status }
        })
        setRegistrations(regMap)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (event: Event) => {
    if (!userId) {
      router.push("/auth/login")
      return
    }
    setRegistering(event.id)
    try {
      if (event.feeAmount > 0) {
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            arbiter_id: userId,
            amount: event.feeAmount,
            payment_type: "event_registration",
            payment_status: "processing",
            description: `Registration: ${event.title}`,
          })
          .select()
          .single()

        if (paymentError) throw paymentError

        const { error: regError } = await supabase.from("event_registrations").insert({
          event_id: event.id,
          arbiter_id: userId,
          status: "registered",
          payment_status: "pending",
          payment_id: payment.id,
        })

        if (regError) throw regError

        const response = await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: event.feeAmount,
            email: userEmail,
            payment_id: payment.id,
            metadata: { payment_type: "event_registration", description: event.title },
          }),
        })

        const data = await response.json()
        if (data.authorization_url) {
          window.location.href = data.authorization_url
          return
        }
        throw new Error(data.error || "Could not start payment")
      }

      const { error: regError } = await supabase.from("event_registrations").insert({
        event_id: event.id,
        arbiter_id: userId,
        status: "registered",
        payment_status: "not_required",
      })

      if (regError) throw regError

      setRegistrations((prev) => ({ ...prev, [event.id]: { status: "registered", payment_status: "not_required" } }))
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, participants: e.participants + 1 } : e)))
    } catch (error) {
      console.error("[v0] Event registration error:", error)
    } finally {
      setRegistering(null)
    }
  }

  const handleCancelRegistration = async (event: Event) => {
    if (!userId) return
    setRegistering(event.id)
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("event_id", event.id)
        .eq("arbiter_id", userId)

      if (error) throw error

      setRegistrations((prev) => {
        const next = { ...prev }
        delete next[event.id]
        return next
      })
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, participants: Math.max(e.participants - 1, 0) } : e)),
      )
    } catch (error) {
      console.error("[v0] Cancel registration error:", error)
    } finally {
      setRegistering(null)
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

  const getEventStatus = (startDate: string, endDate: string, registrationDeadline: string | null) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start

    if (now >= start && now <= end) return "ongoing"
    if (now > end) return "completed"
    if (registrationDeadline && now > new Date(registrationDeadline)) return "closed"
    return "open"
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

  const renderRegisterButton = (event: Event, label: string) => {
    const registration = registrations[event.id]
    const isRegistering = registering === event.id
    const isFull = event.maxAttendees !== null && event.participants >= event.maxAttendees

    if (registration && registration.status === "registered") {
      if (registration.payment_status === "pending") {
        return (
          <Button className="w-full" variant="outline" disabled>
            Payment Pending
          </Button>
        )
      }
      return (
        <>
          <Button className="w-full" variant="outline" disabled>
            <Check className="w-4 h-4 mr-2" />
            Registered
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => handleCancelRegistration(event)}
            disabled={isRegistering}
          >
            {isRegistering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Cancel Registration
          </Button>
        </>
      )
    }

    if (isFull) {
      return (
        <Button className="w-full" variant="outline" disabled>
          Event Full
        </Button>
      )
    }

    return (
      <Button className="w-full" onClick={() => handleRegister(event)} disabled={isRegistering}>
        {isRegistering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {label}
      </Button>
    )
  }

  const renderActions = (event: Event) => {
    if (event.status === "open") {
      return (
        <>
          {renderRegisterButton(event, "Register Now")}
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setDetailsEvent(event)}>
            View Details
          </Button>
        </>
      )
    }
    if (event.status === "closed") {
      return (
        <>
          <Button className="w-full" variant="outline" disabled>
            Registration Closed
          </Button>
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setDetailsEvent(event)}>
            View Details
          </Button>
        </>
      )
    }
    return (
      <Button variant="outline" className="w-full bg-transparent" onClick={() => setDetailsEvent(event)}>
        View Details
      </Button>
    )
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || event.type === typeFilter
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const renderEventCard = (event: Event) => (
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
                <p className="text-muted-foreground mb-3">{event.description || "No description available"}</p>
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
                <span>
                  Deadline:{" "}
                  {event.registrationDeadline
                    ? new Date(event.registrationDeadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "None"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">Fee: {event.fee}</span>
                <span className="text-muted-foreground">Organizer: {event.organizer}</span>
              </div>
              {event.materialsUrl && (
                <a
                  href={event.materialsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Materials
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:w-48">{renderActions(event)}</div>
        </div>
      </CardContent>
    </Card>
  )

  const renderList = (list: Event[], emptyMessage: string) => (
    <div className="space-y-4">
      {list.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        list.map(renderEventCard)
      )}
    </div>
  )

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
        <h1 className="text-3xl font-bold text-balance">Events & Programs</h1>
        <p className="text-muted-foreground text-pretty">
          Discover and participate in NCAA tournaments, training programs, and special events.
        </p>
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
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "Training").length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
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
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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
          {renderList(filteredEvents, "No events found")}
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-4">
          {renderList(filteredEvents.filter((e) => e.type === "Tournament"), "No tournaments found")}
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          {renderList(
            filteredEvents.filter((e) => e.type === "Training" || e.type === "Workshop"),
            "No training programs found",
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailsEvent !== null} onOpenChange={(open) => !open && setDetailsEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailsEvent?.title}</DialogTitle>
            <DialogDescription>Event details</DialogDescription>
          </DialogHeader>
          {detailsEvent && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(detailsEvent.type)}>{detailsEvent.type}</Badge>
                <Badge className={getStatusColor(detailsEvent.status)}>{detailsEvent.status}</Badge>
              </div>
              {detailsEvent.description && <p>{detailsEvent.description}</p>}
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-muted-foreground">Date</span>
                <span>{detailsEvent.date}</span>
                <span className="text-muted-foreground">Location</span>
                <span>{detailsEvent.location}</span>
                <span className="text-muted-foreground">Organizer</span>
                <span>{detailsEvent.organizer}</span>
                <span className="text-muted-foreground">Fee</span>
                <span>{detailsEvent.fee}</span>
                <span className="text-muted-foreground">Participants</span>
                <span>
                  {detailsEvent.participants}
                  {detailsEvent.maxAttendees ? ` / ${detailsEvent.maxAttendees}` : ""}
                </span>
                <span className="text-muted-foreground">Registration Deadline</span>
                <span>
                  {detailsEvent.registrationDeadline
                    ? new Date(detailsEvent.registrationDeadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "None"}
                </span>
              </div>
              {detailsEvent.materialsUrl && (
                <a
                  href={detailsEvent.materialsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View Materials
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
