import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Calendar, Award, Users, FileText, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function getExecutives(supabase: any) {
  const { data: executives } = await supabase
    .from("profiles")
    .select("*")
    .in("arbiter_level", ["International Arbiter", "FIDE Master", "National Arbiter", "International Master"])
    .eq("is_verified", true)
    .order("created_at", { ascending: false })

  return executives || []
}

async function getCommittees(supabase: any) {
  const { data: committees } = await supabase.from("committees").select("*").order("created_at", { ascending: false })

  return committees || []
}

export default async function ExecutivesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const executives = await getExecutives(supabase)
  const committees = await getCommittees(supabase)

  const positions = [
    "President",
    "Vice President",
    "General Secretary",
    "Treasurer",
    "Technical Director",
    "Development Director",
  ]

  const getExecutiveData = (index: number, executive: any) => {
    const titleMap: { [key: number]: string } = {
      0: "President",
      1: "Vice President",
      2: "General Secretary",
      3: "Treasurer",
      4: "Technical Director",
      5: "Development Director",
    }
    return titleMap[index % 6] || "Committee Member"
  }

  const achievements = [
    { year: "2024", title: "FIDE Recognition", description: "NCAA received official recognition from FIDE." },
    {
      year: "2023",
      title: "Youth Development",
      description: "Launched youth development program reaching 10,000+ students.",
    },
    { year: "2022", title: "New Executive Board", description: "Successfully elected new executive board." },
    {
      year: "2021",
      title: "Digital Transformation",
      description: "Implemented digital systems for tournament management.",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Executives</h1>
        <p className="text-muted-foreground text-pretty">
          Meet the leadership team driving chess development across Nigeria.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Executive Members</p>
                <p className="text-2xl font-bold">{executives.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Committees</p>
                <p className="text-2xl font-bold">{committees.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Tenure</p>
                <p className="text-2xl font-bold">2022-2026</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Years of Service</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="executives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executives">Executive Board</TabsTrigger>
          <TabsTrigger value="committees">Committees</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="executives" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {executives.map((executive, index) => (
              <Card key={executive.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={executive.avatar_url || "/placeholder.svg"} alt={executive.first_name} />
                      <AvatarFallback>
                        {executive.first_name?.[0]}
                        {executive.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {executive.first_name} {executive.last_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default">{getExecutiveData(index, executive)}</Badge>
                          <Badge variant="outline">{executive.arbiter_level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Tenure: 2022-2026</p>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {executive.bio || "Chess administrator and arbiter"}
                      </p>

                      <div className="space-y-2">
                        {executive.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {executive.email}
                          </div>
                        )}
                        {executive.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {executive.phone}
                          </div>
                        )}
                        {executive.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {executive.city}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Contact
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="committees" className="space-y-4">
          <div className="space-y-4">
            {committees.map((committee) => (
              <Card key={committee.id}>
                <CardHeader>
                  <CardTitle>{committee.name}</CardTitle>
                  <CardDescription>Committee Details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Committee Members:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(committee.members || []).slice(0, 5).map((member: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Meeting Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NCAA Achievements</CardTitle>
              <CardDescription>Major milestones and accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{achievement.year}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
