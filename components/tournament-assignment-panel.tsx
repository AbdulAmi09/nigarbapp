"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trophy, Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, XCircle, X, Search } from "lucide-react"
import Link from "next/link"
import AssignmentActions from "@/components/assignment-actions"

interface Assignment {
  id: string
  tournament_id: string
  role: string
  assignment_status: string
  assigned_by_name: string | null
  notes: string | null
  compensation: number | null
  travel_allowance: number | null
  accommodation_provided: boolean | null
  tournament_name: string
  start_date: string
  end_date: string
  venue: string
  city: string
  state: string | null
}

function getStatusColor(status: string) {
  switch (status) {
    case "Accepted":
      return "bg-green-500/10 text-green-600 border-green-500/20"
    case "Pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "Declined":
      return "bg-red-500/10 text-red-600 border-red-500/20"
    case "Completed":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Accepted":
    case "Completed":
      return <CheckCircle className="w-4 h-4" />
    case "Pending":
      return <Clock className="w-4 h-4" />
    case "Declined":
      return <XCircle className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

function formatCurrency(amount: number) {
  return `₦${amount?.toLocaleString() || 0}`
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString()
}

function escapeIcs(text: string) {
  return text.replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n")
}

function buildIcsHref(a: Assignment) {
  const dtStart = a.start_date?.replaceAll("-", "")
  const endBase = new Date(a.end_date || a.start_date)
  endBase.setDate(endBase.getDate() + 1)
  const dtEnd = endBase.toISOString().slice(0, 10).replaceAll("-", "")
  const location = [a.venue, a.city, a.state].filter(Boolean).join(", ")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NCAA//Tournament Assignment//EN",
    "BEGIN:VEVENT",
    `UID:${a.id}@ncaaweb.com.ng`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcs(`${a.tournament_name} (${a.role})`)}`,
    location && `LOCATION:${escapeIcs(location)}`,
    a.notes && `DESCRIPTION:${escapeIcs(a.notes)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"))
}

export default function TournamentAssignmentPanel({ assignments }: { assignments: Assignment[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [detailsAssignment, setDetailsAssignment] = useState<Assignment | null>(null)

  const locationOptions = useMemo(() => {
    const set = new Set<string>()
    assignments.forEach((a) => a.state && set.add(a.state))
    return Array.from(set).sort()
  }, [assignments])

  const filtersActive = search.trim() !== "" || statusFilter !== "all" || locationFilter !== "all"

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setLocationFilter("all")
  }

  const matchesFilters = (a: Assignment) => {
    const q = search.trim().toLowerCase()
    if (
      q &&
      !(
        a.tournament_name?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.venue?.toLowerCase().includes(q)
      )
    ) {
      return false
    }
    if (locationFilter !== "all" && a.state !== locationFilter) return false
    return true
  }

  const confirmedCount = assignments.filter((a) => a.assignment_status === "Accepted").length
  const pendingCount = assignments.filter((a) => a.assignment_status === "Pending").length
  const completedCount = assignments.filter((a) => a.assignment_status === "Completed").length
  const thisMonthCount = assignments.filter((a) => {
    const assignmentDate = new Date(a.start_date)
    const now = new Date()
    return assignmentDate.getMonth() === now.getMonth() && assignmentDate.getFullYear() === now.getFullYear()
  }).length

  const visibleAll = assignments
    .filter(matchesFilters)
    .filter((a) => statusFilter === "all" || a.assignment_status === statusFilter)
  const visiblePending = assignments.filter((a) => a.assignment_status === "Pending").filter(matchesFilters)
  const visibleConfirmed = assignments.filter((a) => a.assignment_status === "Accepted").filter(matchesFilters)
  const visibleCompleted = assignments.filter((a) => a.assignment_status === "Completed").filter(matchesFilters)

  const renderActions = (a: Assignment) => {
    switch (a.assignment_status) {
      case "Pending":
        return <AssignmentActions assignmentId={a.id} />
      case "Accepted":
        return (
          <>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setDetailsAssignment(a)}>
              View Details
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/chat">Message Organizer</Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a href={buildIcsHref(a)} download={`${(a.tournament_name || "tournament").replace(/\s+/g, "-")}.ics`}>
                Add to Calendar
              </a>
            </Button>
          </>
        )
      case "Declined":
        return (
          <Button variant="outline" className="w-full bg-transparent" onClick={() => setDetailsAssignment(a)}>
            View Details
          </Button>
        )
      case "Completed":
        return (
          <>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setDetailsAssignment(a)}>
              View Details
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/tournament-evaluation">Submit Evaluation</Link>
            </Button>
          </>
        )
      default:
        return null
    }
  }

  const renderBanner = (a: Assignment) => {
    switch (a.assignment_status) {
      case "Pending":
        return (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <Clock className="w-4 h-4 inline mr-1" />
              Response required - Please confirm your availability
            </p>
          </div>
        )
      case "Accepted":
        return (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Assignment confirmed
              {a.compensation ? ` - Fee: ${formatCurrency(Number(a.compensation))}` : ""}
            </p>
          </div>
        )
      case "Completed":
        return (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Tournament completed
              {a.compensation ? ` - Fee: ${formatCurrency(Number(a.compensation))}` : ""}
            </p>
          </div>
        )
      default:
        return null
    }
  }

  const renderCard = (a: Assignment) => (
    <Card key={a.id}>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{a.tournament_name}</h3>
                  <Badge className={getStatusColor(a.assignment_status)}>
                    {getStatusIcon(a.assignment_status)}
                    <span className="ml-1 capitalize">{a.assignment_status}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Assigned by {a.assigned_by_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {formatDate(a.start_date)} - {formatDate(a.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {a.city}
                  {a.state ? `, ${a.state}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span>{a.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{a.venue}</span>
              </div>
            </div>

            {renderBanner(a)}

            {a.assignment_status === "Accepted" && a.travel_allowance ? (
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                <span>Travel: {formatCurrency(Number(a.travel_allowance))}</span>
                {a.accommodation_provided && <span className="text-green-600">Accommodation Provided</span>}
              </div>
            ) : null}

            {a.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{a.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:w-48">{renderActions(a)}</div>
        </div>
      </CardContent>
    </Card>
  )

  const renderList = (list: Assignment[], emptyMessage: string) =>
    list.length > 0 ? (
      <div className="space-y-4">{list.map(renderCard)}</div>
    ) : (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        </CardContent>
      </Card>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Tournament Assignment</h1>
          <p className="text-muted-foreground text-pretty">Manage your tournament assignments and availability.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/calendar">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{confirmedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{thisMonthCount}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
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
                  placeholder="Search tournaments..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {locationOptions.length > 0 && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locationOptions.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="icon" onClick={clearFilters} disabled={!filtersActive} title="Clear filters">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="pending">Pending Response</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderList(visibleAll, "No tournament assignments found")}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {renderList(visiblePending, "No pending assignments")}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {renderList(visibleConfirmed, "No confirmed assignments")}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {renderList(visibleCompleted, "No completed assignments")}
        </TabsContent>
      </Tabs>

      <Dialog open={detailsAssignment !== null} onOpenChange={(open) => !open && setDetailsAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailsAssignment?.tournament_name}</DialogTitle>
            <DialogDescription>Assignment details</DialogDescription>
          </DialogHeader>
          {detailsAssignment && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(detailsAssignment.assignment_status)}>
                  {getStatusIcon(detailsAssignment.assignment_status)}
                  <span className="ml-1 capitalize">{detailsAssignment.assignment_status}</span>
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-muted-foreground">Dates</span>
                <span>
                  {formatDate(detailsAssignment.start_date)} - {formatDate(detailsAssignment.end_date)}
                </span>
                <span className="text-muted-foreground">Venue</span>
                <span>{detailsAssignment.venue}</span>
                <span className="text-muted-foreground">Location</span>
                <span>
                  {detailsAssignment.city}
                  {detailsAssignment.state ? `, ${detailsAssignment.state}` : ""}
                </span>
                <span className="text-muted-foreground">Role</span>
                <span>{detailsAssignment.role}</span>
                <span className="text-muted-foreground">Assigned by</span>
                <span>{detailsAssignment.assigned_by_name || "N/A"}</span>
                {detailsAssignment.compensation ? (
                  <>
                    <span className="text-muted-foreground">Fee</span>
                    <span>{formatCurrency(Number(detailsAssignment.compensation))}</span>
                  </>
                ) : null}
                {detailsAssignment.travel_allowance ? (
                  <>
                    <span className="text-muted-foreground">Travel Allowance</span>
                    <span>{formatCurrency(Number(detailsAssignment.travel_allowance))}</span>
                  </>
                ) : null}
                <span className="text-muted-foreground">Accommodation</span>
                <span>{detailsAssignment.accommodation_provided ? "Provided" : "Not provided"}</span>
              </div>
              {detailsAssignment.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Notes</p>
                  <p>{detailsAssignment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
