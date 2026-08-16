"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Star, Clock, Users, MapPin, Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import TournamentEvaluationModal from "@/components/tournament-evaluation-modal"

interface Tournament {
  id: string
  tournament_id: string
  name: string
  start_date: string
  end_date: string
  venue: string
  city: string
  state: string
  num_participants: number
  role: string
  assignment_status: string
}

interface Evaluation {
  id: string
  tournament_id: string
  tournament_name: string
  overall_rating: number
  start_date: string
  city: string
  created_at: string
}

export default function TournamentEvaluationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [userId, setUserId] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Fetch completed tournaments
      const { data: tournamentsData } = await supabase
        .from("tournament_assignments")
        .select(`
          id,
          tournament_id,
          role,
          assignment_status,
          tournaments (
            id,
            name,
            start_date,
            end_date,
            venue,
            city,
            state,
            max_participants
          )
        `)
        .eq("arbiter_id", user.id)
        .eq("assignment_status", "Completed")
        .order("created_at", { ascending: false })

      if (tournamentsData) {
        setTournaments(
          tournamentsData.map((t: any) => ({
            id: t.id,
            tournament_id: t.tournament_id,
            name: t.tournaments?.name,
            start_date: t.tournaments?.start_date,
            end_date: t.tournaments?.end_date,
            venue: t.tournaments?.venue,
            city: t.tournaments?.city,
            state: t.tournaments?.state,
            num_participants: t.tournaments?.max_participants,
            role: t.role,
            assignment_status: t.assignment_status,
          })),
        )
      }

      // Fetch evaluations
      const { data: evaluationsData } = await supabase
        .from("tournament_evaluations")
        .select(`
          id,
          tournament_id,
          overall_rating,
          submitted_at,
          tournaments (
            name,
            city,
            start_date
          )
        `)
        .eq("evaluator_id", user.id)
        .order("submitted_at", { ascending: false })

      if (evaluationsData) {
        setEvaluations(
          evaluationsData.map((e: any) => ({
            id: e.id,
            tournament_id: e.tournament_id,
            tournament_name: e.tournaments?.name,
            overall_rating: e.overall_rating,
            start_date: e.tournaments?.start_date,
            city: e.tournaments?.city,
            created_at: e.submitted_at,
          })),
        )
      }

      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "evaluated":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "evaluated":
        return <Star className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const pendingCount = tournaments.filter((t) => !evaluations.some((e) => e.tournament_id === t.tournament_id)).length
  const completedCount = tournaments.filter((t) =>
    evaluations.some((e) => e.tournament_id === t.tournament_id && !e.overall_rating),
  ).length
  const evaluatedCount = evaluations.filter((e) => e.overall_rating).length

  const handleEvaluateClick = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setShowEvaluationModal(true)
  }

  const handleEvaluationSuccess = () => {
    // Refresh evaluations
    fetchEvaluations()
  }

  async function fetchEvaluations() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: evaluationsData } = await supabase
      .from("tournament_evaluations")
      .select(`
        id,
        tournament_id,
        overall_rating,
        submitted_at,
        tournaments (
          name,
          city,
          start_date
        )
      `)
      .eq("evaluator_id", user.id)
      .order("submitted_at", { ascending: false })

    if (evaluationsData) {
      setEvaluations(
        evaluationsData.map((e: any) => ({
          id: e.id,
          tournament_id: e.tournament_id,
          tournament_name: e.tournaments?.name,
          overall_rating: e.overall_rating,
          start_date: e.tournaments?.start_date,
          city: e.tournaments?.city,
          created_at: e.submitted_at,
        })),
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Tournament Evaluation</h1>
        <p className="text-muted-foreground text-pretty">
          Evaluate tournaments you have arbitrated to help improve future events.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Evaluation</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
                <p className="text-2xl font-bold">{evaluatedCount}</p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">
                  {evaluations.length > 0
                    ? (evaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / evaluations.length).toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Evaluation ({pendingCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          <TabsTrigger value="evaluated">Evaluated ({evaluatedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournaments Awaiting Evaluation</CardTitle>
              <CardDescription>Complete evaluations for tournaments you have arbitrated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments.filter((t) => !evaluations.some((e) => e.tournament_id === t.tournament_id)).length > 0 ? (
                tournaments
                  .filter((t) => !evaluations.some((e) => e.tournament_id === t.tournament_id))
                  .map((tournament) => (
                    <div key={tournament.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tournament.name}</h3>
                            <Badge className="bg-yellow-500/10 text-yellow-600">
                              <Clock className="w-4 h-4 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(tournament.start_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {tournament.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {tournament.num_participants} players
                            </div>
                            <div>
                              <span>Role: {tournament.role}</span>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => handleEvaluateClick(tournament)}>Evaluate Tournament</Button>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No tournaments pending evaluation</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Evaluations</CardTitle>
              <CardDescription>Tournaments with evaluations in progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournaments.filter((t) =>
                evaluations.some((e) => e.tournament_id === t.tournament_id && !e.overall_rating),
              ).length > 0 ? (
                tournaments
                  .filter((t) => evaluations.some((e) => e.tournament_id === t.tournament_id && !e.overall_rating))
                  .map((tournament) => (
                    <div key={tournament.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tournament.name}</h3>
                            <Badge className="bg-blue-500/10 text-blue-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              In Progress
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(tournament.start_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {tournament.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {tournament.num_participants} players
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => handleEvaluateClick(tournament)}>
                          Continue Evaluation
                        </Button>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No evaluations in progress</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Evaluations</CardTitle>
              <CardDescription>Your completed tournament evaluations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {evaluations.filter((e) => e.overall_rating).length > 0 ? (
                evaluations
                  .filter((e) => e.overall_rating)
                  .map((evaluation) => (
                    <div key={evaluation.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{evaluation.tournament_name}</h3>
                            <Badge className="bg-green-500/10 text-green-600">
                              <Star className="w-4 h-4 mr-1" />
                              Evaluated
                            </Badge>
                            <div className="flex items-center gap-1 ml-2">
                              {Array.from({ length: evaluation.overall_rating || 0 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(evaluation.start_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {evaluation.city}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Submitted: {new Date(evaluation.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No evaluated tournaments yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evaluation Modal */}
      <TournamentEvaluationModal
        open={showEvaluationModal}
        onOpenChange={setShowEvaluationModal}
        tournament={selectedTournament}
        userId={userId}
        onSuccess={handleEvaluationSuccess}
      />
    </div>
  )
}
