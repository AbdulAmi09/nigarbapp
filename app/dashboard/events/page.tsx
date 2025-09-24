import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Calendar, MapPin, Users, Clock, Star, Filter, Search, Plus } from "lucide-react"

export default function EventsPage() {
  const events = [
    {
      id: 1,
      title: "National Chess Championship 2025",
      type: "tournament",
      category: "national",
      date: "Mar 15-22, 2025",
      location: "Abuja International Conference Centre",
      organizer: "NCAA",
      participants: 200,
      registrationDeadline: "Feb 28, 2025",
      fee: "₦15,000",
      status: "open",
      description: "The premier chess tournament in Nigeria featuring the country's top players.",
      prizes: "₦500,000 total prize fund",
    },
    {
      id: 2,
      title: "FIDE Arbiters Seminar",
      type: "training",
      category: "education",
      date: "Jan 5-7, 2025",
      location: "Lagos Chess Academy",
      organizer: "FIDE/NCAA",
      participants: 50,
      registrationDeadline: "Dec 25, 2024",
      fee: "₦25,000",
      status: "open",
      description: "International arbiters certification seminar conducted by FIDE officials.",
      prizes: "FIDE Arbiter Certificate",
    },
    {
      id: 3,
      title: "Youth Development Program",
      type: "program",
      category: "youth",
      date: "Jan 10-12, 2025",
      location: "Multiple Venues",
      organizer: "NCAA Development Committee",
      participants: 150,
      registrationDeadline: "Jan 5, 2025",
      fee: "Free",
      status: "open",
      description: "Comprehensive chess development program for young players across Nigeria.",
      prizes: "Training materials and certificates",
    },
    {
      id: 4,
      title: "Lagos State Championship",
      type: "tournament",
      category: "state",
      date: "Dec 15-17, 2024",
      location: "Lagos Chess Center",
      organizer: "Lagos Chess Association",
      participants: 128,
      registrationDeadline: "Dec 10, 2024",
      fee: "₦8,000",
      status: "ongoing",
      description: "Annual Lagos State Chess Championship with strong local participation.",
      prizes: "₦200,000 total prize fund",
    },
    {
      id: 5,
      title: "Women in Chess Conference",
      type: "conference",
      category: "special",
      date: "Feb 8-9, 2025",
      location: "Port Harcourt",
      organizer: "NCAA Women's Committee",
      participants: 80,
      registrationDeadline: "Jan 30, 2025",
      fee: "₦5,000",
      status: "open",
      description: "Conference focused on promoting women's participation in chess.",
      prizes: "Networking and development opportunities",
    },
  ]

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
      case "tournament":
        return "bg-primary/10 text-primary"
      case "training":
        return "bg-blue-500/10 text-blue-600"
      case "program":
        return "bg-green-500/10 text-green-600"
      case "conference":
        return "bg-purple-500/10 text-purple-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "national":
        return "bg-yellow-500/10 text-yellow-600"
      case "state":
        return "bg-blue-500/10 text-blue-600"
      case "youth":
        return "bg-green-500/10 text-green-600"
      case "education":
        return "bg-purple-500/10 text-purple-600"
      case "special":
        return "bg-pink-500/10 text-pink-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
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
                <p className="text-sm font-medium text-muted-foreground">Training Programs</p>
                <p className="text-2xl font-bold">{events.filter((e) => e.type === "training").length}</p>
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
                <Input placeholder="Search events..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
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
          <TabsTrigger value="programs">Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {events.map((event) => (
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
                            <Badge variant="outline" className={getCategoryColor(event.category)}>
                              {event.category}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{event.description}</p>
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
                      {event.status === "closed" && (
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

        <TabsContent value="tournaments" className="space-y-4">
          <div className="space-y-4">
            {events
              .filter((e) => e.type === "tournament")
              .map((event) => (
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
                              <Badge variant="outline" className={getCategoryColor(event.category)}>
                                {event.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{event.description}</p>
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
              ))}
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="space-y-4">
            {events
              .filter((e) => e.type === "training")
              .map((event) => (
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
                              <Badge variant="outline" className={getCategoryColor(event.category)}>
                                {event.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{event.description}</p>
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
                            <Star className="w-4 h-4 text-muted-foreground" />
                            <span>{event.prizes}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Fee: {event.fee}</span>
                            <span className="text-muted-foreground">Deadline: {event.registrationDeadline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        {event.status === "open" && (
                          <>
                            <Button className="w-full">Enroll Now</Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Course Details
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <div className="space-y-4">
            {events
              .filter((e) => e.type === "program" || e.type === "conference")
              .map((event) => (
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
                              <Badge variant="outline" className={getCategoryColor(event.category)}>
                                {event.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{event.description}</p>
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
                            <Star className="w-4 h-4 text-muted-foreground" />
                            <span>{event.prizes}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Fee: {event.fee}</span>
                            <span className="text-muted-foreground">Deadline: {event.registrationDeadline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        {event.status === "open" && (
                          <>
                            <Button className="w-full">Join Program</Button>
                            <Button variant="outline" className="w-full bg-transparent">
                              Learn More
                            </Button>
                          </>
                        )}
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
