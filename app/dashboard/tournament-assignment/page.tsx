import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, XCircle, Filter, Search } from "lucide-react"

export default function TournamentAssignmentPage() {
  const assignments = [
    {
      id: 1,
      tournament: "Lagos State Championship",
      organizer: "Lagos Chess Association",
      date: "Dec 15-17, 2024",
      location: "Lagos",
      role: "Chief Arbiter",
      status: "confirmed",
      participants: 128,
      fee: "₦50,000",
      deadline: "Dec 10, 2024",
      priority: "high",
    },
    {
      id: 2,
      tournament: "National Youth Tournament",
      organizer: "NCAA",
      date: "Jan 20-24, 2025",
      location: "Abuja",
      role: "Deputy Arbiter",
      status: "pending",
      participants: 64,
      fee: "₦35,000",
      deadline: "Jan 15, 2025",
      priority: "medium",
    },
    {
      id: 3,
      tournament: "Kano Regional Open",
      organizer: "Kano Chess Club",
      date: "Feb 5-7, 2025",
      location: "Kano",
      role: "Arbiter",
      status: "available",
      participants: 96,
      fee: "₦25,000",
      deadline: "Jan 30, 2025",
      priority: "low",
    },
    {
      id: 4,
      tournament: "Port Harcourt Masters",
      organizer: "Rivers State Chess",
      date: "Mar 10-14, 2025",
      location: "Port Harcourt",
      role: "Chief Arbiter",
      status: "declined",
      participants: 80,
      fee: "₦45,000",
      deadline: "Mar 5, 2025",
      priority: "medium",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "available":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "declined":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "available":
        return <AlertCircle className="w-4 h-4" />
      case "declined":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

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
                <p className="text-2xl font-bold">{assignments.filter((a) => a.status === "confirmed").length}</p>
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
                <p className="text-2xl font-bold">{assignments.filter((a) => a.status === "pending").length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{assignments.filter((a) => a.status === "available").length}</p>
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
                <p className="text-2xl font-bold">3</p>
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
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
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
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{assignment.tournament}</h3>
                            <Badge className={getStatusColor(assignment.status)}>
                              {getStatusIcon(assignment.status)}
                              <span className="ml-1 capitalize">{assignment.status}</span>
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(assignment.priority)}>
                              {assignment.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">Organized by {assignment.organizer}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{assignment.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{assignment.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{assignment.participants} players</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-muted-foreground" />
                          <span>{assignment.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">Fee: {assignment.fee}</span>
                          <span className="text-muted-foreground">Response by: {assignment.deadline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-48">
                      {assignment.status === "available" && (
                        <>
                          <Button className="w-full">Accept Assignment</Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Decline
                          </Button>
                        </>
                      )}
                      {assignment.status === "pending" && (
                        <>
                          <Button className="w-full">Confirm</Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Request Changes
                          </Button>
                        </>
                      )}
                      {assignment.status === "confirmed" && (
                        <>
                          <Button variant="outline" className="w-full bg-transparent">
                            View Details
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent">
                            Contact Organizer
                          </Button>
                        </>
                      )}
                      {assignment.status === "declined" && (
                        <Button variant="outline" className="w-full bg-transparent">
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {assignments
              .filter((a) => a.status === "pending")
              .map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{assignment.tournament}</h3>
                              <Badge className={getStatusColor(assignment.status)}>
                                {getStatusIcon(assignment.status)}
                                <span className="ml-1 capitalize">{assignment.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">Organized by {assignment.organizer}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.participants} players</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.role}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Response required by {assignment.deadline}
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
              ))}
          </div>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <div className="space-y-4">
            {assignments
              .filter((a) => a.status === "confirmed")
              .map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{assignment.tournament}</h3>
                              <Badge className={getStatusColor(assignment.status)}>
                                {getStatusIcon(assignment.status)}
                                <span className="ml-1 capitalize">{assignment.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">Organized by {assignment.organizer}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.participants} players</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.role}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Assignment confirmed - Fee: {assignment.fee}
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
              ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="space-y-4">
            {assignments
              .filter((a) => a.status === "available")
              .map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{assignment.tournament}</h3>
                              <Badge className={getStatusColor(assignment.status)}>
                                {getStatusIcon(assignment.status)}
                                <span className="ml-1 capitalize">{assignment.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">Organized by {assignment.organizer}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.participants} players</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <span>{assignment.role}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <AlertCircle className="w-4 h-4 inline mr-1" />
                            Open for applications - Deadline: {assignment.deadline}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        <Button className="w-full">Apply for Assignment</Button>
                        <Button variant="outline" className="w-full bg-transparent">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
