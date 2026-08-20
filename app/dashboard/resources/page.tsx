"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Download, Search, Filter, FileText, Video, Link, Calendar, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Resource {
  id: string
  title: string
  type: string
  category: string
  description: string
  format: string
  size: string
  downloads: number
  date: string
  featured: boolean
  url: string
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedResources: Resource[] = (data || []).map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        type: getResourceType(resource.file_type),
        category: resource.category || "general",
        description: resource.description || "",
        format: resource.file_type ? resource.file_type.toUpperCase() : "Unknown",
        size: formatFileSize(resource.file_size),
        downloads: resource.download_count || 0,
        date: new Date(resource.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        featured: resource.is_featured || false,
        url: resource.file_url || "#",
      }))

      setResources(formattedResources)
    } catch (error) {
      console.error("Error fetching resources:", error)
    } finally {
      setLoading(false)
    }
  }

  const getResourceType = (fileType: string) => {
    if (!fileType) return "document"
    const type = fileType.toLowerCase()
    if (type.includes("video") || type === "mp4" || type === "mov") return "video"
    if (type === "link" || type === "url") return "link"
    return "document"
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "N/A"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

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
      "Rules & Regulations": "bg-primary/10 text-primary",
      "Training Materials": "bg-blue-500/10 text-blue-600",
      "Forms & Documents": "bg-green-500/10 text-green-600",
      Guidelines: "bg-purple-500/10 text-purple-600",
      Software: "bg-orange-500/10 text-orange-600",
      Videos: "bg-pink-500/10 text-pink-600",
      Articles: "bg-yellow-500/10 text-yellow-600",
    }
    return categoryMap[category] || "bg-gray-500/10 text-gray-600"
  }

  const categories = useMemo(() => {
    const names = Array.from(new Set(resources.map((r) => r.category).filter(Boolean))).sort()
    return names.map((name) => ({
      name,
      count: resources.filter((r) => r.category === name).length,
      color: getCategoryColor(name),
    }))
  }, [resources])

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || resource.type === typeFilter
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const hasFile = (resource: Resource) => Boolean(resource.url) && resource.url !== "#"

  const handleDownload = async (resource: Resource) => {
    if (!hasFile(resource)) return
    // Increment download count (RPC bypasses the author-only RLS restriction)
    await supabase.rpc("increment_resource_downloads", { p_resource_id: resource.id })
    window.open(resource.url, "_blank")
  }

  const renderDownloadButton = (resource: Resource, label = "Download") => {
    if (!hasFile(resource)) {
      return (
        <Button size="sm" variant="outline" disabled>
          Not Available Yet
        </Button>
      )
    }
    return (
      <Button size="sm" onClick={() => handleDownload(resource)}>
        <Download className="w-4 h-4 mr-2" />
        {label}
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Resources</h1>
        <p className="text-muted-foreground text-pretty">
          Access official documents, training materials, and educational resources for chess arbiters.
        </p>
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
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer hover:opacity-80 ${category.color}`}
                onClick={() => setCategoryFilter(category.name)}
              >
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
                <Input
                  placeholder="Search resources..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setTypeFilter("all")
                  setCategoryFilter("all")
                  setSearchTerm("")
                }}
              >
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
            {filteredResources.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No resources found</p>
                </CardContent>
              </Card>
            ) : (
              filteredResources.map((resource) => (
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
                            <p className="text-sm text-muted-foreground">
                              {resource.description || "No description available"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
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
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Updated: {resource.date}</span>
                        </div>
                        <div className="flex gap-2">{renderDownloadButton(resource)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredResources.filter((r) => r.featured).length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No featured resources</p>
                </CardContent>
              </Card>
            ) : (
              filteredResources
                .filter((r) => r.featured)
                .map((resource) => (
                  <Card key={resource.id} className="border-primary/20">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
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

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Updated: {resource.date}</span>
                          </div>
                          <div className="flex gap-2">{renderDownloadButton(resource)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredResources.filter((r) => r.type === "document").length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No documents found</p>
                </CardContent>
              </Card>
            ) : (
              filteredResources
                .filter((r) => r.type === "document")
                .map((resource) => (
                  <Card key={resource.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{resource.title}</h3>
                            <Badge variant="outline" className={getCategoryColor(resource.category)}>
                              {resource.category}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            {resource.format} - {resource.size}
                          </div>
                          {renderDownloadButton(resource)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredResources.filter((r) => r.type === "video").length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">No videos found</p>
                </CardContent>
              </Card>
            ) : (
              filteredResources
                .filter((r) => r.type === "video")
                .map((resource) => (
                  <Card key={resource.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-500/10 text-red-600">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{resource.title}</h3>
                            <Badge variant="outline" className={getCategoryColor(resource.category)}>
                              {resource.category}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            {resource.format} - {resource.size}
                          </div>
                          {renderDownloadButton(resource, "Watch")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
