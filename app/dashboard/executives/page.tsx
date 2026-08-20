import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Users, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

interface Executive {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  email: string | null
  phone: string | null
  city: string | null
  bio: string | null
  arbiter_level: string | null
  role: string
}

interface Committee {
  id: string
  name: string
  slug: string
  chairman_name: string | null
  secretary_name: string | null
  member_count: number
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
}

const ROLE_ORDER: Record<string, number> = {
  superadmin: 0,
  admin: 1,
}

async function getExecutives(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Executive[]> {
  const { data } = await supabase.rpc("get_executives")
  const executives: Executive[] = data || []
  return executives.sort((a, b) => {
    const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
    if (roleDiff !== 0) return roleDiff
    return (a.first_name || "").localeCompare(b.first_name || "")
  })
}

async function getCommittees(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Committee[]> {
  const { data } = await supabase.rpc("get_committees_with_leadership")
  return data || []
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administrators</p>
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
      </div>

      <Tabs defaultValue="executives" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executives">Executive Board</TabsTrigger>
          <TabsTrigger value="committees">Committees</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="executives" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {executives.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No administrators found</p>
                </CardContent>
              </Card>
            ) : (
              executives.map((executive) => (
                <Card key={executive.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={executive.avatar_url || "/placeholder.svg"} alt={executive.first_name || ""} />
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
                            <Badge variant="default">{ROLE_LABELS[executive.role] || executive.role}</Badge>
                            {executive.arbiter_level && <Badge variant="outline">{executive.arbiter_level}</Badge>}
                          </div>
                        </div>

                        {executive.bio && <p className="text-sm text-muted-foreground">{executive.bio}</p>}

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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="committees" className="space-y-4">
          <div className="space-y-4">
            {committees.map((committee) => (
              <Card key={committee.id}>
                <CardHeader>
                  <CardTitle>{committee.name}</CardTitle>
                  <CardDescription>
                    {committee.member_count} member{committee.member_count === 1 ? "" : "s"}
                    {committee.chairman_name ? ` · Chair: ${committee.chairman_name}` : ""}
                    {committee.secretary_name ? ` · Secretary: ${committee.secretary_name}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/committee/${committee.slug}`}>View Details</Link>
                  </Button>
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
