import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Calendar, Award, Users, FileText, ExternalLink } from "lucide-react"

export default function ExecutivesPage() {
  const executives = [
    {
      id: 1,
      name: "Dr. Adebayo Ogundimu",
      position: "President",
      title: "International Arbiter",
      tenure: "2022 - 2026",
      email: "president@ncaa.ng",
      phone: "+234 801 234 5678",
      location: "Lagos",
      bio: "Experienced chess administrator with over 15 years in chess development and arbitration.",
      achievements: ["FIDE Arbiter", "NCAA Founder Member", "Chess Development Award 2020"],
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      name: "IA Fatima Hassan",
      position: "Vice President",
      title: "International Arbiter",
      tenure: "2022 - 2026",
      email: "vp@ncaa.ng",
      phone: "+234 802 345 6789",
      location: "Abuja",
      bio: "Leading advocate for women's chess and youth development programs across Nigeria.",
      achievements: ["International Arbiter", "Women's Chess Champion", "Youth Development Award"],
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 3,
      name: "FM John Okafor",
      position: "General Secretary",
      title: "FIDE Master",
      tenure: "2022 - 2026",
      email: "secretary@ncaa.ng",
      phone: "+234 803 456 7890",
      location: "Enugu",
      bio: "Former national champion with extensive experience in tournament organization.",
      achievements: ["FIDE Master", "National Champion 2018", "Tournament Director Certification"],
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 4,
      name: "Mrs. Sarah Adamu",
      position: "Treasurer",
      title: "National Arbiter",
      tenure: "2022 - 2026",
      email: "treasurer@ncaa.ng",
      phone: "+234 804 567 8901",
      location: "Kano",
      bio: "Financial expert with strong background in non-profit organization management.",
      achievements: ["CPA Certification", "Financial Management Award", "Transparency Award 2021"],
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 5,
      name: "IA Michael Obi",
      position: "Technical Director",
      title: "International Arbiter",
      tenure: "2022 - 2026",
      email: "technical@ncaa.ng",
      phone: "+234 805 678 9012",
      location: "Port Harcourt",
      bio: "Technical expert specializing in chess regulations and arbitration standards.",
      achievements: ["International Arbiter", "Technical Excellence Award", "FIDE Lecturer"],
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 6,
      name: "Dr. Amina Bello",
      position: "Development Director",
      title: "WIM",
      tenure: "2022 - 2026",
      email: "development@ncaa.ng",
      phone: "+234 806 789 0123",
      location: "Kaduna",
      bio: "Education specialist focused on chess in schools and grassroots development.",
      achievements: ["Women's International Master", "Education Excellence Award", "PhD in Education"],
      avatar: "/placeholder.svg?height=80&width=80",
    },
  ]

  const committees = [
    {
      name: "Executive Committee",
      members: ["Dr. Adebayo Ogundimu", "IA Fatima Hassan", "FM John Okafor", "Mrs. Sarah Adamu"],
      responsibilities: ["Strategic planning", "Policy decisions", "Budget approval", "Executive oversight"],
    },
    {
      name: "Technical Committee",
      members: ["IA Michael Obi", "Dr. Adebayo Ogundimu", "IA Fatima Hassan"],
      responsibilities: [
        "Tournament regulations",
        "Arbitration standards",
        "Technical guidelines",
        "Rules interpretation",
      ],
    },
    {
      name: "Development Committee",
      members: ["Dr. Amina Bello", "FM John Okafor", "IA Fatima Hassan"],
      responsibilities: ["Youth programs", "School chess", "Grassroots development", "Training initiatives"],
    },
  ]

  const achievements = [
    {
      year: "2024",
      title: "FIDE Recognition",
      description: "NCAA received official recognition from FIDE as the governing body for chess in Nigeria.",
    },
    {
      year: "2023",
      title: "Youth Development Program",
      description: "Launched comprehensive youth development program reaching over 10,000 students.",
    },
    {
      year: "2022",
      title: "New Executive Board",
      description: "Successfully elected new executive board with diverse representation across Nigeria.",
    },
    {
      year: "2021",
      title: "Digital Transformation",
      description: "Implemented digital systems for tournament management and member registration.",
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
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="executives" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {executives.map((executive) => (
              <Card key={executive.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={executive.avatar || "/placeholder.svg"} alt={executive.name} />
                      <AvatarFallback className="text-lg">
                        {executive.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{executive.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default">{executive.position}</Badge>
                          <Badge variant="outline">{executive.title}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Tenure: {executive.tenure}</p>
                      </div>

                      <p className="text-sm text-muted-foreground">{executive.bio}</p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {executive.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {executive.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {executive.location}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Key Achievements:</p>
                        <div className="flex flex-wrap gap-1">
                          {executive.achievements.map((achievement, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {achievement}
                            </Badge>
                          ))}
                        </div>
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
            {committees.map((committee, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{committee.name}</CardTitle>
                  <CardDescription>{committee.members.length} members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Committee Members:</h4>
                    <div className="flex flex-wrap gap-2">
                      {committee.members.map((member, memberIndex) => (
                        <Badge key={memberIndex} variant="outline">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Responsibilities:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {committee.responsibilities.map((responsibility, respIndex) => (
                        <li key={respIndex}>{responsibility}</li>
                      ))}
                    </ul>
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
              <CardDescription>Major milestones and accomplishments under current leadership</CardDescription>
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

        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>NCAA Headquarters</CardTitle>
                <CardDescription>Main office and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">123 Chess Avenue, Victoria Island, Lagos, Nigeria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">+234 1 234 5678</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">info@ncaa.ng</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Office Hours:</h4>
                  <p className="text-sm text-muted-foreground">Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p className="text-sm text-muted-foreground">Saturday: 10:00 AM - 2:00 PM</p>
                  <p className="text-sm text-muted-foreground">Sunday: Closed</p>
                </div>

                <Button className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Offices</CardTitle>
                <CardDescription>Zone offices across Nigeria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Zone 4.2 - Abuja Office</h4>
                    <p className="text-sm text-muted-foreground">Plot 456, Central Business District, Abuja</p>
                    <p className="text-sm text-muted-foreground">+234 9 876 5432</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Zone 4.3 - Kano Office</h4>
                    <p className="text-sm text-muted-foreground">789 Ahmadu Bello Way, Kano</p>
                    <p className="text-sm text-muted-foreground">+234 64 123 456</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Zone 4.4 - Port Harcourt Office</h4>
                    <p className="text-sm text-muted-foreground">321 Aba Road, Port Harcourt</p>
                    <p className="text-sm text-muted-foreground">+234 84 987 654</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Regional Office
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
