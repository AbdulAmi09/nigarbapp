import { GitCommit, Code, Folder, Clock, Mail, Github, MessageSquare } from "lucide-react"
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

export default function DevelopersPage() {
  const developers = [
    {
      id: 1,
      name: "Adebayo Ogundimu",
      role: "Lead Developer",
      title: "Full Stack Engineer",
      email: "adebayo.dev@ncaa.ng",
      github: "adebayo-dev",
      avatar: "/placeholder.svg?height=60&width=60",
      bio: "Lead developer with 8+ years experience in web development and chess technology.",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
      contributions: 245,
      joined: "Jan 2022",
    },
    {
      id: 2,
      name: "Fatima Hassan",
      role: "Frontend Developer",
      title: "UI/UX Engineer",
      email: "fatima.dev@ncaa.ng",
      github: "fatima-ui",
      avatar: "/placeholder.svg?height=60&width=60",
      bio: "Frontend specialist focused on creating intuitive user experiences for chess applications.",
      skills: ["React", "TypeScript", "Tailwind CSS", "Figma", "Next.js"],
      contributions: 189,
      joined: "Mar 2022",
    },
    {
      id: 3,
      name: "Chukwuma Okoro",
      role: "Backend Developer",
      title: "API Engineer",
      email: "chukwuma.dev@ncaa.ng",
      github: "chukwuma-api",
      avatar: "/placeholder.svg?height=60&width=60",
      bio: "Backend specialist with expertise in scalable API development and database optimization.",
      skills: ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
      contributions: 156,
      joined: "Jun 2022",
    },
    {
      id: 4,
      name: "Aisha Abdullahi",
      role: "Mobile Developer",
      title: "React Native Engineer",
      email: "aisha.dev@ncaa.ng",
      github: "aisha-mobile",
      avatar: "/placeholder.svg?height=60&width=60",
      bio: "Mobile app developer creating cross-platform solutions for chess arbiters on the go.",
      skills: ["React Native", "TypeScript", "Expo", "Firebase", "iOS/Android"],
      contributions: 98,
      joined: "Sep 2022",
    },
  ]

  const projectStats = {
    totalCommits: 1247,
    linesOfCode: 45678,
    activeProjects: 3,
    lastUpdate: "2 hours ago",
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
                  <AvatarImage src={developer.avatar || "/placeholder.svg"} alt={developer.name} />
                  <AvatarFallback>
                    {developer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">{developer.name}</h3>
                    <p className="text-sm text-muted-foreground">{developer.title}</p>
                    <Badge variant="secondary" className="mt-1">
                      {developer.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{developer.bio}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {developer.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <GitCommit className="h-3 w-3" />
                      <span>{developer.contributions} contributions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Joined {developer.joined}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${developer.email}`}>
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://github.com/${developer.github}`} target="_blank" rel="noopener noreferrer">
                        <Github className="h-3 w-3 mr-1" />
                        GitHub
                      </a>
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
                <Badge variant="outline">shadcn/ui</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <div className="space-y-1">
                <Badge variant="outline">Node.js</Badge>
                <Badge variant="outline">PostgreSQL</Badge>
                <Badge variant="outline">Prisma ORM</Badge>
                <Badge variant="outline">Redis</Badge>
                <Badge variant="outline">WebSocket</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Infrastructure</h4>
              <div className="space-y-1">
                <Badge variant="outline">Vercel</Badge>
                <Badge variant="outline">AWS</Badge>
                <Badge variant="outline">Docker</Badge>
                <Badge variant="outline">GitHub Actions</Badge>
                <Badge variant="outline">Cloudflare</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Development Team */}
      <Card>
        <CardHeader>
          <CardTitle>Need Technical Support?</CardTitle>
          <CardDescription>Get in touch with our development team for technical assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild>
              <a href="mailto:dev-team@ncaa.ng">
                <Mail className="h-4 w-4 mr-2" />
                Email Development Team
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com/ncaa-ng/dashboard/issues" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                Report Issue on GitHub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Join Developer Chat
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
