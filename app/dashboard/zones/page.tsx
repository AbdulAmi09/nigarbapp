"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Users, Trophy, Phone, Mail, Award, TrendingUp, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Zone {
  id: string
  name: string
  coordinator: string
  arbiters: number
  tournaments: number
  states: string[]
  headquarters: string
  contact: string
  email: string
  active: boolean
  isYourZone: boolean
}

interface ZoneArbiter {
  id: string
  name: string
  title: string
  role: string
  tournaments: number
  rating: number
  location: string
  avatar: string
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [zoneArbiters, setZoneArbiters] = useState<ZoneArbiter[]>([])
  const [userZone, setUserZone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Get user's zone
      let currentUserZone = null
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("zone").eq("id", user.id).single()

        currentUserZone = profile?.zone
        setUserZone(currentUserZone)
      }

      // Fetch zones from database
      const { data: zonesData } = await supabase.from("zones").select("*").order("name")

      if (zonesData && zonesData.length > 0) {
        // Count arbiters per zone
        const { data: arbiterCounts } = await supabase.from("profiles").select("zone")

        const zoneCounts: { [key: string]: number } = {}
        arbiterCounts?.forEach((a: any) => {
          if (a.zone) {
            zoneCounts[a.zone] = (zoneCounts[a.zone] || 0) + 1
          }
        })

        const formattedZones: Zone[] = zonesData.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          coordinator: zone.coordinator_name || "TBD",
          arbiters: zoneCounts[zone.name] || 0,
          tournaments: zone.tournament_count || 0,
          states: zone.states || [],
          headquarters: zone.headquarters || zone.name,
          contact: zone.contact_phone || "",
          email: zone.contact_email || "",
          active: zone.is_active !== false,
          isYourZone: zone.name === currentUserZone,
        }))

        setZones(formattedZones)
      } else {
        // Use default zones if none in database
        const defaultZones = [
          { name: "North Central", states: ["FCT", "Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau"] },
          { name: "North East", states: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"] },
          { name: "North West", states: ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"] },
          { name: "South East", states: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"] },
          { name: "South South", states: ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"] },
          { name: "South West", states: ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"] },
        ]

        // Count arbiters per zone
        const { data: arbiterCounts } = await supabase.from("profiles").select("zone")

        const zoneCounts: { [key: string]: number } = {}
        arbiterCounts?.forEach((a: any) => {
          if (a.zone) {
            zoneCounts[a.zone] = (zoneCounts[a.zone] || 0) + 1
          }
        })

        const formattedZones: Zone[] = defaultZones.map((zone, index) => ({
          id: `zone-${index}`,
          name: zone.name,
          coordinator: "TBD",
          arbiters: zoneCounts[zone.name] || 0,
          tournaments: 0,
          states: zone.states,
          headquarters: zone.states[0] || zone.name,
          contact: "",
          email: "",
          active: true,
          isYourZone: zone.name === currentUserZone,
        }))

        setZones(formattedZones)
      }

      // Fetch arbiters for user's zone
      if (currentUserZone) {
        const { data: arbiters } = await supabase.from("profiles").select("*").eq("zone", currentUserZone).limit(10)

        if (arbiters) {
          const formattedArbiters: ZoneArbiter[] = arbiters.map((arbiter: any) => ({
            id: arbiter.id,
            name: `${arbiter.first_name || ""} ${arbiter.last_name || ""}`.trim() || "Unknown",
            title: arbiter.arbiter_level || "Arbiter",
            role: "Member",
            tournaments: arbiter.tournaments_officiated || 0,
            rating: Number(arbiter.rating) || 0,
            location: arbiter.state || arbiter.city || "",
            avatar: arbiter.avatar_url || "",
          }))
          setZoneArbiters(formattedArbiters)
        }
      }
    } catch (error) {
      console.error("Error fetching zones:", error)
    } finally {
      setLoading(false)
    }
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
                <p className="text-2xl font-bold">{userZone || "N/A"}</p>
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
                      {zone.states.slice(0, 5).map((state) => (
                        <Badge key={state} variant="outline" className="text-xs">
                          {state}
                        </Badge>
                      ))}
                      {zone.states.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{zone.states.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(zone.contact || zone.email) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {zone.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {zone.contact}
                        </span>
                      )}
                      {zone.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {zone.email}
                        </span>
                      )}
                    </div>
                  )}

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
              <CardTitle>{userZone || "Your Zone"} Arbiters</CardTitle>
              <CardDescription>Active arbiters in your zone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {zoneArbiters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No arbiters found in your zone</p>
              ) : (
                zoneArbiters.map((arbiter) => (
                  <div key={arbiter.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                          {arbiter.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {arbiter.location}
                            </span>
                          )}
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
                ))
              )}
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
                {zones.map((zone) => {
                  const maxArbiters = Math.max(...zones.map((z) => z.arbiters), 1)
                  return (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{zone.name}</span>
                        <span>{zone.arbiters} arbiters</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(zone.arbiters / maxArbiters) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
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
