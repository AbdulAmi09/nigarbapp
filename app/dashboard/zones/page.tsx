import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Users, Trophy, Calendar, Phone, Mail, Award, TrendingUp } from "lucide-react"

export default function ZonesPage() {
  const zones = [
    {
      id: 1,
      name: "Zone 4.1 - Lagos",
      coordinator: "IA John Adebayo",
      arbiters: 45,
      tournaments: 12,
      states: ["Lagos", "Ogun", "Oyo"],
      headquarters: "Lagos",
      contact: "+234 801 234 5678",
      email: "zone41@ncaa.ng",
      active: true,
      isYourZone: true,
    },
    {
      id: 2,
      name: "Zone 4.2 - Abuja",
      coordinator: "IA Fatima Hassan",
      arbiters: 38,
      tournaments: 8,
      states: ["FCT", "Niger", "Kogi"],
      headquarters: "Abuja",
      contact: "+234 802 345 6789",
      email: "zone42@ncaa.ng",
      active: true,
      isYourZone: false,
    },
    {
      id: 3,
      name: "Zone 4.3 - Kano",
      coordinator: "IA Musa Ibrahim",
      arbiters: 32,
      tournaments: 6,
      states: ["Kano", "Kaduna", "Katsina"],
      headquarters: "Kano",
      contact: "+234 803 456 7890",
      email: "zone43@ncaa.ng",
      active: true,
      isYourZone: false,
    },
    {
      id: 4,
      name: "Zone 4.4 - Port Harcourt",
      coordinator: "IA Sarah Okoro",
      arbiters: 28,
      tournaments: 5,
      states: ["Rivers", "Bayelsa", "Cross River"],
      headquarters: "Port Harcourt",
      contact: "+234 804 567 8901",
      email: "zone44@ncaa.ng",
      active: true,
      isYourZone: false,
    },
  ]

  const zoneArbiters = [
    {
      name: "John Adebayo",
      title: "International Arbiter",
      role: "Zone Coordinator",
      tournaments: 45,
      rating: 4.9,
      location: "Lagos",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Michael Okafor",
      title: "FIDE Arbiter",
      role: "Deputy Coordinator",
      tournaments: 32,
      rating: 4.7,
      location: "Lagos",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Sarah Adebayo",
      title: "National Arbiter",
      role: "Secretary",
      tournaments: 28,
      rating: 4.8,
      location: "Ogun",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "David Ogundimu",
      title: "International Arbiter",
      role: "Training Officer",
      tournaments: 38,
      rating: 4.9,
      location: "Oyo",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const zoneActivities = [
    {
      id: 1,
      title: "Lagos State Championship",
      type: "tournament",
      date: "Dec 15-17, 2024",
      location: "Lagos Chess Center",
      participants: 128,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Zone 4.1 Arbiters Meeting",
      type: "meeting",
      date: "Dec 22, 2024",
      location: "NCAA Lagos Office",
      participants: 25,
      status: "scheduled",
    },
    {
      id: 3,
      title: "Youth Development Program",
      type: "training",
      date: "Jan 10-12, 2025",
      location: "Multiple Venues",
      participants: 60,
      status: "planning",
    },
  ]

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "tournament":
        return "bg-primary/10 text-primary"
      case "meeting":
        return "bg-blue-500/10 text-blue-600"
      case "training":
        return "bg-green-500/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-yellow-500/10 text-yellow-600"
      case "scheduled":
        return "bg-blue-500/10 text-blue-600"
      case "planning":
        return "bg-purple-500/10 text-purple-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Zones</h1>
        <p className="text-muted-foreground text-pretty">
          Explore NCAA zones, their coordinators, arbiters, and activities across Nigeria.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Zones</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Arbiters</p>
                <p className="text-2xl font-bold">{zones.reduce((sum, z) => sum + z.arbiters, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tournaments</p>
                <p className="text-2xl font-bold">{zones.reduce((sum, z) => sum + z.tournaments, 0)}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Zone</p>
                <p className="text-2xl font-bold">4.1</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Zone Overview</TabsTrigger>
          <TabsTrigger value="arbiters">Zone Arbiters</TabsTrigger>
          <TabsTrigger value="activities">Zone Activities</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {zones.map((zone) => (
              <Card key={zone.id} className={zone.isYourZone ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {zone.name}
                        {zone.isYourZone && <Badge variant="default">Your Zone</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1">Coordinator: {zone.coordinator}</CardDescription>
                    </div>
                    <Badge variant={zone.active ? "default" : "secondary"}>{zone.active ? "Active" : "Inactive"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Arbiters</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {zone.arbiters}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tournaments</p>
                      <p className="font-medium flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {zone.tournaments}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Headquarters</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {zone.headquarters}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">States</p>
                      <p className="font-medium">{zone.states.length} states</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Coverage Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {zone.states.map((state) => (
                        <Badge key={state} variant="outline" className="text-xs">
                          {state}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {zone.contact}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {zone.email}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Contact Zone
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="arbiters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone 4.1 - Lagos Arbiters</CardTitle>
              <CardDescription>Active arbiters in your zone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {zoneArbiters.map((arbiter, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={arbiter.avatar || "/placeholder.svg"} alt={arbiter.name} />
                      <AvatarFallback>
                        {arbiter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{arbiter.name}</h3>
                        <Badge variant="outline">{arbiter.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{arbiter.title}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {arbiter.tournaments} tournaments
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {arbiter.rating}/5.0 rating
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {arbiter.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone 4.1 Activities</CardTitle>
              <CardDescription>Upcoming tournaments, meetings, and training programs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {zoneActivities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{activity.title}</h3>
                        <Badge className={getActivityTypeColor(activity.type)}>{activity.type}</Badge>
                        <Badge variant="outline" className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{activity.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{activity.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{activity.participants} participants</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {activity.status === "upcoming" && <Button size="sm">Register</Button>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance</CardTitle>
                <CardDescription>Comparative statistics across zones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{zone.name}</span>
                      <span>{zone.arbiters} arbiters</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(zone.arbiters / 45) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Activity</CardTitle>
                <CardDescription>Tournament distribution by zone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{zone.tournaments}</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
