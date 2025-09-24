import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, XCircle, Filter, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function getAssignmentData(userId: string) {
  const supabase = await createClient()

  // Get assignment details for the user
  const { data: assignments } = await supabase
    .from("assignment_details")
    .select("*")
    .eq("arbiter_id", userId)
    .order("created_at", { ascending: false })

  return assignments || []
}

export default async function TournamentAssignmentPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const assignments = await getAssignmentData(user.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "assigned":
      case "available":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "declined":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      case "completed":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "assigned":
      case "available":
        return <AlertCircle className="w-4 h-4" />
      case "declined":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount?.toLocaleString() || 0}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const confirmedCount = assignments.filter(
    (a) => a.assignment_status === "accepted" || a.assignment_status === "confirmed",
  ).length
  const pendingCount = assignments.filter((a) => a.assignment_status === "pending").length
  const availableCount = assignments.filter((a) => a.assignment_status === "assigned").length
  const thisMonthCount = assignments.filter((a) => {
    const assignmentDate = new Date(a.start_date)
    const now = new Date()
    return assignmentDate.getMonth() === now.getMonth() && assignmentDate.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Tournament Assignment</h1>
          <p className="text-muted-foreground text-pretty">Manage your tournament assignments and availability.</p>
        </div>
        <Button>
          <Calendar className="w-4 h-4 mr-2" />
          View Calendar
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
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold">{availableCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
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
                <Input placeholder="Search tournaments..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="lagos">Lagos</SelectItem>
                  <SelectItem value="abuja">Abuja</SelectItem>
                  <SelectItem value="kano">Kano</SelectItem>
                  <SelectItem value="port-harcourt">Port Harcourt</SelectItem>
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
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="pending">Pending Response</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{assignment.tournament_name}</h3>
                              <Badge className={getStatusColor(assignment.assignment_status)}>
                                {getStatusIcon(assignment.assignment_status)}
                                <span className="ml-1 capitalize">{assignment.assignment_status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              Assigned by {assignment.assigned_by_name}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {assignment.city}, {assignment.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.role}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.venue}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-4 text-sm">
                            {assignment.compensation && (
                              <span className="font-medium">
                                Fee: {formatCurrency(Number(assignment.compensation))}
                              </span>
                            )}
                            {assignment.travel_allowance && (
                              <span className="text-muted-foreground">
                                Travel: {formatCurrency(Number(assignment.travel_allowance))}
                              </span>
                            )}
                            {assignment.accommodation_provided && (
                              <span className="text-green-600">Accommodation Provided</span>
                            )}
                          </div>
                        </div>

                        {assignment.notes && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">{assignment.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        {assignment.assignment_status === "assigned" && (
                          <>
                            <Button className="w-full">Accept Assignment</Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Decline
                            </Button>
                          </>
                        )}
                        {assignment.assignment_status === "pending" && (
                          <>
                            <Button className="w-full">Confirm</Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Request Changes
                            </Button>
                          </>
                        )}
                        {(assignment.assignment_status === "accepted" ||
                          assignment.assignment_status === "confirmed") && (
                          <>
                            <Button variant="outline" className="w-full bg-transparent">
                              View Details
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Contact Organizer
                            </Button>
                          </>
                        )}
                        {assignment.assignment_status === "declined" && (
                          <Button variant="outline" className="w-full bg-transparent">
                            View Details
                          </Button>
                        )}
                        {assignment.assignment_status === "completed" && (
                          <>
                            <Button variant="outline" className="w-full bg-transparent">
                              View Report
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Submit Evaluation
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No tournament assignments found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {assignments.filter((a) => a.assignment_status === "pending").length > 0 ? (
              assignments
                .filter((a) => a.assignment_status === "pending")
                .map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{assignment.tournament_name}</h3>
                                <Badge className={getStatusColor(assignment.assignment_status)}>
                                  {getStatusIcon(assignment.assignment_status)}
                                  <span className="ml-1 capitalize">{assignment.assignment_status}</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Assigned by {assignment.assigned_by_name}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {assignment.city}, {assignment.state}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-muted-foreground" />
                              <span>{assignment.role}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{assignment.venue}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Response required - Please confirm your availability
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button className="w-full">Confirm Assignment</Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Request Changes
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No pending assignments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <div className="space-y-4">
            {assignments.filter((a) => a.assignment_status === "accepted" || a.assignment_status === "confirmed")
              .length > 0 ? (
              assignments
                .filter((a) => a.assignment_status === "accepted" || a.assignment_status === "confirmed")
                .map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{assignment.tournament_name}</h3>
                                <Badge className={getStatusColor(assignment.assignment_status)}>
                                  {getStatusIcon(assignment.assignment_status)}
                                  <span className="ml-1 capitalize">{assignment.assignment_status}</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Assigned by {assignment.assigned_by_name}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {assignment.city}, {assignment.state}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-muted-foreground" />
                              <span>{assignment.role}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{assignment.venue}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Assignment confirmed
                              {assignment.compensation && ` - Fee: ${formatCurrency(Number(assignment.compensation))}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button variant="outline" className="w-full bg-transparent">
                            View Contract
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Contact Organizer
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No confirmed assignments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="space-y-4">
            {assignments.filter((a) => a.assignment_status === "assigned").length > 0 ? (
              assignments
                .filter((a) => a.assignment_status === "assigned")
                .map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{assignment.tournament_name}</h3>
                                <Badge className={getStatusColor(assignment.assignment_status)}>
                                  {getStatusIcon(assignment.assignment_status)}
                                  <span className="ml-1 capitalize">{assignment.assignment_status}</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Assigned by {assignment.assigned_by_name}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {assignment.city}, {assignment.state}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-muted-foreground" />
                              <span>{assignment.role}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{assignment.venue}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              New assignment - Please respond
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button className="w-full">Accept Assignment</Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            View Details
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">No available assignments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
