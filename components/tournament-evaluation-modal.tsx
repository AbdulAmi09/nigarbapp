"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface Tournament {
  id: string
  tournament_id: string
  name: string
  role: string
  start_date: string
}

interface EvaluationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournament: Tournament | null
  userId: string
  onSuccess?: () => void
}

export default function TournamentEvaluationModal({
  open,
  onOpenChange,
  tournament,
  userId,
  onSuccess,
}: EvaluationModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    organization_rating: "5",
    arbiters_coordination_rating: "5",
    venue_quality_rating: "5",
    time_management_rating: "5",
    overall_rating: "5",
    strengths: "",
    improvements: "",
    additional_comments: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!tournament) return
    setLoading(true)

    try {
      const { error } = await supabase.from("tournament_evaluations").insert({
        tournament_id: tournament.tournament_id,
        arbiter_id: userId,
        organization_rating: Number.parseInt(formData.organization_rating),
        arbiters_coordination_rating: Number.parseInt(formData.arbiters_coordination_rating),
        venue_quality_rating: Number.parseInt(formData.venue_quality_rating),
        time_management_rating: Number.parseInt(formData.time_management_rating),
        overall_rating: Number.parseInt(formData.overall_rating),
        strengths: formData.strengths,
        improvements: formData.improvements,
        additional_comments: formData.additional_comments,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert({
        recipient_id: userId,
        title: "Evaluation Submitted",
        message: `Your evaluation for ${tournament.name} has been submitted successfully.`,
        notification_type: "system",
        is_important: false,
      })

      onSuccess?.()
      onOpenChange(false)
      setFormData({
        organization_rating: "5",
        arbiters_coordination_rating: "5",
        venue_quality_rating: "5",
        time_management_rating: "5",
        overall_rating: "5",
        strengths: "",
        improvements: "",
        additional_comments: "",
      })
    } catch (error) {
      console.error("[v0] Evaluation submit error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!tournament) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluate Tournament</DialogTitle>
          <DialogDescription>{tournament.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Info - Prefilled */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Tournament Name</Label>
              <p className="font-semibold">{tournament.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Your Role</Label>
              <p className="font-semibold">{tournament.role}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tournament Date</Label>
              <p className="font-semibold">{new Date(tournament.start_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Rating Fields */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Rate the Tournament (1-5)</h3>

            {[
              { key: "organization_rating", label: "Tournament Organization" },
              { key: "arbiters_coordination_rating", label: "Arbiters Coordination" },
              { key: "venue_quality_rating", label: "Venue Quality" },
              { key: "time_management_rating", label: "Time Management" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <Label className="w-40 text-sm">{label}</Label>
                <Select
                  value={formData[key as keyof typeof formData]}
                  onValueChange={(value) => handleInputChange(key, value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="flex items-center gap-4 pt-4 border-t">
              <Label className="w-40 text-sm font-semibold">Overall Rating</Label>
              <Select
                value={formData.overall_rating}
                onValueChange={(value) => handleInputChange("overall_rating", value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="strengths">Strengths</Label>
              <Textarea
                id="strengths"
                placeholder="What went well during the tournament..."
                value={formData.strengths}
                onChange={(e) => handleInputChange("strengths", e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="improvements">Areas for Improvement</Label>
              <Textarea
                id="improvements"
                placeholder="What could be improved for future tournaments..."
                value={formData.improvements}
                onChange={(e) => handleInputChange("improvements", e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                placeholder="Any additional feedback or observations..."
                value={formData.additional_comments}
                onChange={(e) => handleInputChange("additional_comments", e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Evaluation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
