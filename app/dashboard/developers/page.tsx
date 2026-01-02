import { GitCommit, Code, Folder, Clock, Mail, Github } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function getDevelopers(supabase: any) {
  const { data: developers } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("tournaments_officiated", { ascending: false })
    .limit(10)

  return developers || []
}

export default async function DevelopersPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const developers = await getDevelopers(supabase)

  const projectStats = {
    totalCommits: 1247,
    linesOfCode: 45678,
    activeProjects: 3,
    lastUpdate: "2 hours ago",
  }

  const skillMap: { [key: string]: string[] } = {
    "International Arbiter": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    "FIDE Master": ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    "National Arbiter": ["Python", "Django", "PostgreSQL", "Docker"],
    "International Master": ["React Native", "TypeScript", "Firebase"],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Development Team</h1>
        <p className="text-muted-foreground">Meet the talented developers behind the NCAA Dashboard</p>
      </div>

      {/* Project Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GitCommit className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{projectStats.totalCommits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Commits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{projectStats.linesOfCode.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Lines of Code</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{projectStats.activeProjects}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">Live</p>
                <p className="text-xs text-muted-foreground">Last Update: {projectStats.lastUpdate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {developers.map((developer) => (
          <Card key={developer.id}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={developer.avatar_url || "/placeholder.svg"} alt={developer.first_name} />
                  <AvatarFallback>
                    {developer.first_name?.[0]}
                    {developer.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {developer.first_name} {developer.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{developer.arbiter_level}</p>
                    <Badge variant="secondary" className="mt-1">
                      Developer
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{developer.bio || "Chess arbiter and developer"}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {(skillMap[developer.arbiter_level] || ["Chess", "Arbitration"]).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <GitCommit className="h-3 w-3" />
                      <span>{developer.tournaments_officiated} contributions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Active</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center space-x-2">
                    {developer.email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${developer.email}`}>
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Github className="h-3 w-3 mr-1" />
                      GitHub
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>Technologies and tools used in building the NCAA Dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <div className="space-y-1">
                <Badge variant="outline">Next.js 14</Badge>
                <Badge variant="outline">React 18</Badge>
                <Badge variant="outline">TypeScript</Badge>
                <Badge variant="outline">Tailwind CSS</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <div className="space-y-1">
                <Badge variant="outline">Supabase</Badge>
                <Badge variant="outline">PostgreSQL</Badge>
                <Badge variant="outline">WebSocket</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Infrastructure</h4>
              <div className="space-y-1">
                <Badge variant="outline">Vercel</Badge>
                <Badge variant="outline">GitHub</Badge>
                <Badge variant="outline">Paystack</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
