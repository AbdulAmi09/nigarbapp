"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Trophy, MapPin, Calendar, Star, Clock, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  arbiter_level: string | null
  city: string | null
  state: string | null
  created_at: string
  zone: string | null
  license_number: string | null
  license_expiry: string | null
  is_active: boolean
  years_experience: number | null
  bio: string | null
  phone: string | null
}

interface Stats {
  total_assignments: number
  completed_assignments: number
}

interface Assignment {
  id: string
  tournament_name: string
  role: string
  assignment_status: string
  start_date: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tournamentEvaluations, setTournamentEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchProfileData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      // Get performance metrics
      const { data: statsData } = await supabase.rpc("get_arbiter_activity_summary", { arbiter_uuid: user.id }).single()

      // Get tournament history
      const { data: assignmentsData } = await supabase
        .from("assignment_details")
        .select("*")
        .eq("arbiter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      // Get evaluations for ratings
      const { data: evaluationsData } = await supabase
        .from("tournament_evaluations")
        .select("overall_rating, submitted_at")
        .eq("evaluator_id", user.id)
        .order("submitted_at", { ascending: false })

      setProfile(profileData)
      setStats(statsData)
      setAssignments(assignmentsData || [])
      setTournamentEvaluations(evaluationsData || [])
      setLoading(false)
    }

    fetchProfileData()
  }, [router, supabase])

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)

    try {
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop()
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath])
        }
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
    } catch (error) {
      console.error("Error uploading photo:", error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return <div className="text-center py-8">Profile not found</div>
  }

  // Calculate completion rate
  const completionRate =
    stats?.total_assignments && stats.total_assignments > 0
      ? Math.round((stats.completed_assignments / stats.total_assignments) * 100)
      : 0

  // Calculate average rating
  const avgRating =
    tournamentEvaluations && tournamentEvaluations.length > 0
      ? tournamentEvaluations.reduce((sum: number, evalData: any) => sum + evalData.overall_rating, 0) /
        tournamentEvaluations.length
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Profile</h1>
        <p className="text-muted-foreground text-pretty">Manage your arbiter profile and view your achievements.</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={profile.avatar_url || "/chess-arbiter-avatar.jpg"}
                  alt={`${profile.first_name} ${profile.last_name}`}
                />
                <AvatarFallback>
                  {profile.first_name?.[0]}
                  {profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Change Photo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-muted-foreground">{profile.arbiter_level} Arbiter</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {profile.city}, {profile.state || "Nigeria"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Member since {new Date(profile.created_at).getFullYear()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{stats?.total_assignments || 0} Assignments</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{profile.arbiter_level} Arbiter</Badge>
                {profile.license_number && <Badge variant="secondary">Licensed</Badge>}
                {profile.zone && <Badge variant="outline">Zone {profile.zone}</Badge>}
                <Badge variant={profile.is_active ? "outline" : "destructive"}>
                  {profile.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">Tournament History</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Your arbitration performance overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tournament Completion Rate</span>
                    <span>{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Rating</span>
                    <span>{avgRating.toFixed(1)}/5.0</span>
                  </div>
                  <Progress value={(avgRating / 5) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Years Experience</span>
                    <span>{profile.years_experience || 0} years</span>
                  </div>
                  <Progress value={Math.min((profile.years_experience || 0) * 10, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest arbitration activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments && assignments.length > 0 ? (
                  assignments.slice(0, 3).map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{assignment.tournament_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats?.total_assignments >= 100 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold">Century Club</h3>
                    <p className="text-sm text-muted-foreground">Arbitrated 100+ tournaments</p>
                    <Badge variant="default">Achieved</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {avgRating >= 4.5 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">Excellence Award</h3>
                    <p className="text-sm text-muted-foreground">Maintained 4.5+ rating</p>
                    <Badge variant="default">Achieved</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {completionRate >= 95 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold">Reliability Pro</h3>
                    <p className="text-sm text-muted-foreground">95%+ completion rate</p>
                    <Badge variant="default">Achieved</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament History</CardTitle>
              <CardDescription>Complete record of your arbitration assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments && assignments.length > 0 ? (
                  assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assignment.tournament_name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            assignment.assignment_status === "Completed"
                              ? "default"
                              : assignment.assignment_status === "Accepted"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {assignment.assignment_status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(assignment.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No tournament history available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Certifications</CardTitle>
                <CardDescription>Your current valid certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.license_number && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{profile.arbiter_level} Arbiter License</p>
                      <p className="text-sm text-muted-foreground">License: {profile.license_number}</p>
                      {profile.license_expiry && (
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(profile.license_expiry).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        profile.license_expiry && new Date(profile.license_expiry) > new Date()
                          ? "default"
                          : "destructive"
                      }
                    >
                      {profile.license_expiry && new Date(profile.license_expiry) > new Date() ? "Active" : "Expired"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Additional profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.bio && (
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Bio</p>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {profile.phone && (
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Contact</p>
                    <p className="text-sm text-muted-foreground">{profile.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
