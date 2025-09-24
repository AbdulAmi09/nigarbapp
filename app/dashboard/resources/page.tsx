import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Download, Search, Filter, FileText, Video, Link, Star, Calendar, Eye } from "lucide-react"

export default function ResourcesPage() {
  const resources = [
    {
      id: 1,
      title: "FIDE Laws of Chess 2023",
      type: "document",
      category: "rules",
      description: "Official FIDE Laws of Chess with latest updates and amendments.",
      format: "PDF",
      size: "2.5 MB",
      downloads: 1250,
      rating: 4.9,
      date: "Jan 2023",
      featured: true,
      url: "#",
    },
    {
      id: 2,
      title: "Arbiters Manual 2024",
      type: "document",
      category: "arbitration",
      description: "Comprehensive guide for chess arbiters covering all aspects of tournament arbitration.",
      format: "PDF",
      size: "8.2 MB",
      downloads: 890,
      rating: 4.8,
      date: "Mar 2024",
      featured: true,
      url: "#",
    },
    {
      id: 3,
      title: "Tournament Pairing Systems",
      type: "video",
      category: "training",
      description: "Video tutorial explaining Swiss system and round-robin pairing methods.",
      format: "MP4",
      size: "125 MB",
      downloads: 456,
      rating: 4.7,
      date: "Jun 2024",
      featured: false,
      url: "#",
    },
    {
      id: 4,
      title: "NCAA Constitution & Bylaws",
      type: "document",
      category: "governance",
      description: "Official NCAA constitution and bylaws governing chess in Nigeria.",
      format: "PDF",
      size: "1.8 MB",
      downloads: 678,
      rating: 4.6,
      date: "Feb 2024",
      featured: false,
      url: "#",
    },
    {
      id: 5,
      title: "Digital Chess Clock Usage",
      type: "video",
      category: "training",
      description: "Complete guide to using digital chess clocks in tournaments.",
      format: "MP4",
      size: "89 MB",
      downloads: 234,
      rating: 4.5,
      date: "Aug 2024",
      featured: false,
      url: "#",
    },
    {
      id: 6,
      title: "Anti-Cheating Guidelines",
      type: "document",
      category: "rules",
      description: "Guidelines for preventing and handling cheating incidents in chess tournaments.",
      format: "PDF",
      size: "3.1 MB",
      downloads: 567,
      rating: 4.8,
      date: "May 2024",
      featured: false,
      url: "#",
    },
    {
      id: 7,
      title: "FIDE Rating System Explained",
      type: "link",
      category: "education",
      description: "External link to FIDE's comprehensive rating system documentation.",
      format: "Web Link",
      size: "N/A",
      downloads: 345,
      rating: 4.4,
      date: "Jul 2024",
      featured: false,
      url: "https://fide.com",
    },
    {
      id: 8,
      title: "Tournament Report Templates",
      type: "document",
      category: "forms",
      description: "Standard templates for tournament reports and evaluation forms.",
      format: "DOCX",
      size: "0.5 MB",
      downloads: 789,
      rating: 4.7,
      date: "Apr 2024",
      featured: false,
      url: "#",
    },
  ]

  const categories = [
    { name: "Rules & Regulations", count: 2, color: "bg-primary/10 text-primary" },
    { name: "Arbitration", count: 1, color: "bg-blue-500/10 text-blue-600" },
    { name: "Training", count: 2, color: "bg-green-500/10 text-green-600" },
    { name: "Governance", count: 1, color: "bg-purple-500/10 text-purple-600" },
    { name: "Education", count: 1, color: "bg-orange-500/10 text-orange-600" },
    { name: "Forms & Templates", count: 1, color: "bg-pink-500/10 text-pink-600" },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />
      case "video":
        return <Video className="w-5 h-5" />
      case "link":
        return <Link className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-500/10 text-blue-600"
      case "video":
        return "bg-red-500/10 text-red-600"
      case "link":
        return "bg-green-500/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getCategoryColor = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      rules: "bg-primary/10 text-primary",
      arbitration: "bg-blue-500/10 text-blue-600",
      training: "bg-green-500/10 text-green-600",
      governance: "bg-purple-500/10 text-purple-600",
      education: "bg-orange-500/10 text-orange-600",
      forms: "bg-pink-500/10 text-pink-600",
    }
    return categoryMap[category] || "bg-gray-500/10 text-gray-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Resources</h1>
          <p className="text-muted-foreground text-pretty">
            Access official documents, training materials, and educational resources for chess arbiters.
          </p>
        </div>
        <Button>
          <BookOpen className="w-4 h-4 mr-2" />
          Request Resource
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{resources.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{resources.filter((r) => r.type === "document").length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold">{resources.filter((r) => r.type === "video").length}</p>
              </div>
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">
                  {resources.reduce((sum, r) => sum + r.downloads, 0).toLocaleString()}
                </p>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Categories</CardTitle>
          <CardDescription>Browse resources by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category, index) => (
              <div key={index} className={`p-3 rounded-lg cursor-pointer hover:opacity-80 ${category.color}`}>
                <p className="font-medium text-sm">{category.name}</p>
                <p className="text-xs opacity-75">{category.count} resources</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search resources..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="link">Links</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="rules">Rules</SelectItem>
                  <SelectItem value="arbitration">Arbitration</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="forms">Forms</SelectItem>
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
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(resource.type)}`}
                        >
                          {getTypeIcon(resource.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{resource.title}</h3>
                            {resource.featured && <Badge variant="default">Featured</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                            <Badge variant="outline" className={getCategoryColor(resource.category)}>
                              {resource.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Format:</span> {resource.format}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {resource.size}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{resource.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{resource.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Updated: {resource.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {resources
              .filter((r) => r.featured)
              .map((resource) => (
                <Card key={resource.id} className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(resource.type)}`}
                          >
                            {getTypeIcon(resource.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{resource.title}</h3>
                              <Badge variant="default">Featured</Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                              <Badge variant="outline" className={getCategoryColor(resource.category)}>
                                {resource.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Format:</span> {resource.format}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {resource.size}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{resource.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Updated: {resource.date}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {resources
              .filter((r) => r.type === "document")
              .map((resource) => (
                <Card key={resource.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(resource.type)}`}
                          >
                            {getTypeIcon(resource.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{resource.title}</h3>
                              {resource.featured && <Badge variant="default">Featured</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                              <Badge variant="outline" className={getCategoryColor(resource.category)}>
                                {resource.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Format:</span> {resource.format}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {resource.size}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{resource.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Updated: {resource.date}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {resources
              .filter((r) => r.type === "video")
              .map((resource) => (
                <Card key={resource.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(resource.type)}`}
                          >
                            {getTypeIcon(resource.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{resource.title}</h3>
                              {resource.featured && <Badge variant="default">Featured</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                              <Badge variant="outline" className={getCategoryColor(resource.category)}>
                                {resource.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Format:</span> {resource.format}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {resource.size}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{resource.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{resource.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Updated: {resource.date}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Watch
                          </Button>
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
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
