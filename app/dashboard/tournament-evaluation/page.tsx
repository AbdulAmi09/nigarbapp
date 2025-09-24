import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Star, Clock, Users, MapPin, Calendar, CheckCircle, AlertCircle } from "lucide-react"

export default function TournamentEvaluationPage() {
  const tournaments = [
    {
      id: 1,
      name: "Lagos State Championship",
      date: "Dec 15-17, 2024",
      location: "Lagos",
      status: "pending",
      role: "Chief Arbiter",
      participants: 128,
      rounds: 9,
      timeControl: "90+30",
    },
    {
      id: 2,
      name: "National Youth Tournament",
      date: "Dec 10-14, 2024",
      location: "Abuja",
      status: "completed",
      role: "Deputy Arbiter",
      participants: 64,
      rounds: 7,
      timeControl: "60+30",
      rating: 5,
      feedback: "Excellent organization and smooth execution.",
    },
    {
      id: 3,
      name: "Abuja Open",
      date: "Nov 28-30, 2024",
      location: "Abuja",
      status: "evaluated",
      role: "Arbiter",
      participants: 96,
      rounds: 8,
      timeControl: "90+30",
      rating: 4,
      feedback: "Good tournament with minor timing issues.",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "evaluated":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "evaluated":
        return <Star className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Tournament Evaluation</h1>
        <p className="text-muted-foreground text-pretty">
          Evaluate tournaments you've arbitrated and provide feedback for improvement.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Evaluation</p>
                <p className="text-2xl font-bold">{tournaments.filter((t) => t.status === "pending").length}</p>
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
                <p className="text-2xl font-bold">{tournaments.filter((t) => t.status === "completed").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
                <p className="text-2xl font-bold">{tournaments.filter((t) => t.status === "evaluated").length}</p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">4.5</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Evaluation</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="evaluated">Evaluated</TabsTrigger>
          <TabsTrigger value="new">New Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournaments Awaiting Evaluation</CardTitle>
              <CardDescription>Complete evaluations for tournaments you've arbitrated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments
                .filter((t) => t.status === "pending")
                .map((tournament) => (
                  <div key={tournament.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <Badge className={getStatusColor(tournament.status)}>
                            {getStatusIcon(tournament.status)}
                            <span className="ml-1 capitalize">{tournament.status}</span>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {tournament.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tournament.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {tournament.participants} players
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {tournament.role}
                          </div>
                        </div>
                      </div>
                      <Button>Evaluate Tournament</Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tournaments</CardTitle>
              <CardDescription>Tournaments ready for evaluation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments
                .filter((t) => t.status === "completed")
                .map((tournament) => (
                  <div key={tournament.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <Badge className={getStatusColor(tournament.status)}>
                            {getStatusIcon(tournament.status)}
                            <span className="ml-1 capitalize">{tournament.status}</span>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {tournament.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tournament.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {tournament.participants} players
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {tournament.role}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Start Evaluation</Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluated Tournaments</CardTitle>
              <CardDescription>Your completed tournament evaluations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments
                .filter((t) => t.status === "evaluated")
                .map((tournament) => (
                  <div key={tournament.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <Badge className={getStatusColor(tournament.status)}>
                            {getStatusIcon(tournament.status)}
                            <span className="ml-1 capitalize">{tournament.status}</span>
                          </Badge>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: tournament.rating || 0 }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {tournament.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tournament.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {tournament.participants} players
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {tournament.role}
                          </div>
                        </div>
                        {tournament.feedback && (
                          <p className="text-sm text-muted-foreground italic">"{tournament.feedback}"</p>
                        )}
                      </div>
                      <Button variant="outline">View Details</Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Evaluation Form</CardTitle>
              <CardDescription>Provide detailed feedback on tournament organization and execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament">Tournament Name</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lagos-championship">Lagos State Championship</SelectItem>
                      <SelectItem value="youth-tournament">National Youth Tournament</SelectItem>
                      <SelectItem value="abuja-open">Abuja Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chief">Chief Arbiter</SelectItem>
                      <SelectItem value="deputy">Deputy Arbiter</SelectItem>
                      <SelectItem value="arbiter">Arbiter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Overall Rating</h4>
                <div className="space-y-3">
                  {[
                    { category: "Organization", rating: 4 },
                    { category: "Venue Quality", rating: 5 },
                    { category: "Equipment", rating: 4 },
                    { category: "Time Management", rating: 3 },
                    { category: "Communication", rating: 5 },
                  ].map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <Label className="text-sm">{item.category}</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 cursor-pointer ${
                                i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{item.rating}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strengths">Tournament Strengths</Label>
                <Textarea
                  id="strengths"
                  placeholder="What went well during the tournament?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvements">Areas for Improvement</Label>
                <Textarea
                  id="improvements"
                  placeholder="What could be improved for future tournaments?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendations">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  placeholder="Any specific recommendations for organizers?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2">
                <Button>Submit Evaluation</Button>
                <Button variant="outline">Save Draft</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
