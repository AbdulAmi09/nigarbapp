"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Trophy, MessageCircle, Award } from "lucide-react"
import Link from "next/link"

interface Zone {
  id: string
  name: string
  states: string[]
  description: string | null
}

interface Arbiter {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  zone: string | null
  arbiter_level: string | null
}

interface Tournament {
  id: string
  name: string
  state: string | null
  status: string | null
  start_date: string | null
}

export default function ZonesPanel({
  userId,
  userZone,
  zones,
  arbiters,
  tournaments,
}: {
  userId: string
  userZone: string | null
  zones: Zone[]
  arbiters: Arbiter[]
  tournaments: Tournament[]
}) {
  const [tab, setTab] = useState("overview")
  const [selectedZone, setSelectedZone] = useState<string>(userZone || zones[0]?.name || "")
  const [detailsZone, setDetailsZone] = useState<Zone | null>(null)

  const zoneStats = useMemo(() => {
    const map = new Map<
      string,
      { arbiterCount: number; tournamentCount: number }
    >()
    for (const zone of zones) {
      const arbiterCount = arbiters.filter((a) => a.zone === zone.name).length
      const tournamentCount = tournaments.filter((t) => t.state && zone.states.includes(t.state)).length
      map.set(zone.name, { arbiterCount, tournamentCount })
    }
    return map
  }, [zones, arbiters, tournaments])

  const unassignedArbiters = arbiters.filter((a) => !a.zone).length
  const activeTournaments = tournaments.filter((t) => t.status && t.status !== "completed").length
  const arbitersInSelectedZone = arbiters.filter((a) => a.zone === selectedZone)

  const initials = (first: string | null, last: string | null) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "?"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Zones</h1>
        <p className="text-muted-foreground text-pretty">
          Explore NCAA zones, coverage areas, and arbiters across Nigeria.
        </p>
      </div>

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
                <p className="text-2xl font-bold">{arbiters.length}</p>
                {unassignedArbiters > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{unassignedArbiters} without a zone set</p>
                )}
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
                <p className="text-2xl font-bold">{activeTournaments}</p>
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
                <p className="text-2xl font-bold">{userZone || "Not set"}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Zone Overview</TabsTrigger>
          <TabsTrigger value="arbiters">Zone Arbiters</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {zones.map((zone) => {
              const stats = zoneStats.get(zone.name)
              const isYourZone = zone.name === userZone
              return (
                <Card key={zone.id} className={isYourZone ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {zone.name}
                          {isYourZone && <Badge variant="default">Your Zone</Badge>}
                        </CardTitle>
                        {zone.description && <CardDescription className="mt-1">{zone.description}</CardDescription>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Arbiters</p>
                        <p className="font-medium flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {stats?.arbiterCount ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tournaments</p>
                        <p className="font-medium flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {stats?.tournamentCount ?? 0}
                        </p>
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

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent" onClick={() => setDetailsZone(zone)}>
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => {
                          setSelectedZone(zone.name)
                          setTab("arbiters")
                        }}
                      >
                        View Arbiters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="arbiters" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Zone Arbiters</CardTitle>
                  <CardDescription>Browse arbiters by zone</CardDescription>
                </div>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.name}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {arbitersInSelectedZone.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No arbiters found in this zone</p>
              ) : (
                arbitersInSelectedZone.map((arbiter) => {
                  const name = `${arbiter.first_name || ""} ${arbiter.last_name || ""}`.trim() || "Unknown"
                  const isYou = arbiter.id === userId
                  return (
                    <div key={arbiter.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={arbiter.avatar_url || "/placeholder.svg"} alt={name} />
                          <AvatarFallback>{initials(arbiter.first_name, arbiter.last_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{name}</h3>
                            {isYou && <Badge variant="outline">You</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{arbiter.arbiter_level || "Arbiter"}</p>
                        </div>
                      </div>
                      {!isYou && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/dashboard/chat">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message in Chat
                          </Link>
                        </Button>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance</CardTitle>
                <CardDescription>Arbiter distribution across zones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {zones.map((zone) => {
                  const stats = zoneStats.get(zone.name)
                  const maxArbiters = Math.max(...zones.map((z) => zoneStats.get(z.name)?.arbiterCount ?? 0), 1)
                  return (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{zone.name}</span>
                        <span>{stats?.arbiterCount ?? 0} arbiters</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${((stats?.arbiterCount ?? 0) / maxArbiters) * 100}%` }}
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
                <CardDescription>Tournaments tracked by zone (matched by state)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {zones.map((zone) => {
                  const stats = zoneStats.get(zone.name)
                  return (
                    <div key={zone.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <span className="text-sm">{zone.name}</span>
                      </div>
                      <span className="text-sm font-medium">{stats?.tournamentCount ?? 0}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailsZone} onOpenChange={(open) => !open && setDetailsZone(null)}>
        <DialogContent>
          {detailsZone && (
            <>
              <DialogHeader>
                <DialogTitle>{detailsZone.name}</DialogTitle>
                {detailsZone.description && <DialogDescription>{detailsZone.description}</DialogDescription>}
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Arbiters</p>
                    <p className="font-medium">{zoneStats.get(detailsZone.name)?.arbiterCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tournaments</p>
                    <p className="font-medium">{zoneStats.get(detailsZone.name)?.tournamentCount ?? 0}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">States covered ({detailsZone.states.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {detailsZone.states.map((state) => (
                      <Badge key={state} variant="outline" className="text-xs">
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedZone(detailsZone.name)
                    setTab("arbiters")
                    setDetailsZone(null)
                  }}
                >
                  View Arbiters in This Zone
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
