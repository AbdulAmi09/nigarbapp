"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Users, FileText, ArrowRight, Download, Loader2, Upload, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface Person {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

interface Committee {
  id: string
  name: string
  slug: string
  description: string | null
  purpose: string | null
  meeting_schedule: string | null
  next_meeting_date: string | null
  meeting_location: string | null
  member_ids: string[] | null
  chairman_id: string | null
  secretary_id: string | null
  request_types: string[]
  chairman: Person | null
  secretary: Person | null
}

interface CommitteeDocument {
  id: string
  committee_id: string
  title: string
  category: string
  file_path: string
  is_public: boolean
}

interface MyCase {
  id: string
  request_type: string
  message: string
  status: string
  resolution_note: string | null
  created_at: string
  committee: { name: string } | null
}

const CASE_STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  resolved: "bg-green-500/10 text-green-600",
}

function personName(p: Person | null) {
  if (!p) return null
  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim()
  return name || null
}

function initials(p: Person | null) {
  const name = personName(p)
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

function memberCount(c: Committee) {
  return (c.member_ids?.length || 0) + (c.chairman_id ? 1 : 0) + (c.secretary_id ? 1 : 0)
}

export default function CommitteeDirectoryPanel({
  userId,
  committees,
  publicDocuments,
  myCases,
}: {
  userId: string
  committees: Committee[]
  publicDocuments: CommitteeDocument[]
  myCases: MyCase[]
}) {
  const [detailsCommittee, setDetailsCommittee] = useState<Committee | null>(null)
  const [contactCommittee, setContactCommittee] = useState<Committee | null>(null)

  const myCommittees = useMemo(
    () =>
      committees.filter(
        (c) => c.chairman_id === userId || c.secretary_id === userId || c.member_ids?.includes(userId),
      ),
    [committees, userId],
  )
  const myCommitteeIds = new Set(myCommittees.map((c) => c.id))
  const otherCommittees = committees.filter((c) => !myCommitteeIds.has(c.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Committees</h1>
        <p className="text-muted-foreground text-pretty">NCAA committees, their mandates, and how to reach them.</p>
      </div>

      {myCommittees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            My Workspace
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {myCommittees.map((committee) => (
              <Card key={committee.id} className="border-primary/40 bg-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{committee.name}</CardTitle>
                      <CardDescription className="mt-1">{committee.description || committee.purpose}</CardDescription>
                    </div>
                    <Badge>
                      {committee.chairman_id === userId
                        ? "Chairman"
                        : committee.secretary_id === userId
                          ? "Secretary"
                          : "Member"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/committee/${committee.slug}`}>
                      Enter Workspace
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">All Association Committees</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {otherCommittees.length === 0 && myCommittees.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No committees found</p>
              </CardContent>
            </Card>
          ) : (
            otherCommittees.map((committee) => (
              <Card key={committee.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{committee.name}</CardTitle>
                  <CardDescription className="mt-1">{committee.description || committee.purpose}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {memberCount(committee)} active board members
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setDetailsCommittee(committee)}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {myCases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">My Requests</h2>
          <Card>
            <CardContent className="pt-6 space-y-3">
              {myCases.map((c) => (
                <div key={c.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{c.request_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.committee?.name || "Committee"} -- {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={CASE_STATUS_COLORS[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.message}</p>
                  {c.resolution_note && (
                    <p className="text-sm bg-muted rounded-md p-2">
                      <span className="font-medium">Response: </span>
                      {c.resolution_note}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <CommitteeDetailsModal
        committee={detailsCommittee}
        documents={detailsCommittee ? publicDocuments.filter((d) => d.committee_id === detailsCommittee.id) : []}
        onClose={() => setDetailsCommittee(null)}
        onContact={() => {
          setContactCommittee(detailsCommittee)
          setDetailsCommittee(null)
        }}
      />

      <ContactCommitteeModal committee={contactCommittee} onClose={() => setContactCommittee(null)} />
    </div>
  )
}

function CommitteeDetailsModal({
  committee,
  documents,
  onClose,
  onContact,
}: {
  committee: Committee | null
  documents: CommitteeDocument[]
  onClose: () => void
  onContact: () => void
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleDownload(path: string) {
    const { data } = await supabase.storage.from("committee-files").createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={!!committee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {committee && (
          <>
            <DialogHeader>
              <DialogTitle>{committee.name}</DialogTitle>
              <DialogDescription>{committee.description || committee.purpose}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Committee Officers</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { person: committee.chairman, role: "Chairman" },
                    { person: committee.secretary, role: "Secretary" },
                  ].map(({ person, role }) => (
                    <div key={role} className="flex items-center gap-3 border rounded-lg p-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={person?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{initials(person)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{personName(person) || "Position vacant"}</p>
                        <p className="text-xs text-muted-foreground">{role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Public Documents</h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No public documents available.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleDownload(doc.file_path)}
                        className="flex items-center gap-2 w-full text-left text-sm border rounded-lg p-3 hover:bg-accent"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1">{doc.title}</span>
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={onContact} className="w-full">
                Contact Committee
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ContactCommitteeModal({ committee, onClose }: { committee: Committee | null; onClose: () => void }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [requestType, setRequestType] = useState("")
  const [message, setMessage] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setRequestType("")
    setMessage("")
    setAttachment(null)
    setSubmitted(false)
    setError(null)
  }

  async function handleSubmit() {
    if (!committee || !requestType || !message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { data: caseRow, error: caseError } = await supabase
        .from("committee_cases")
        .insert({
          committee_id: committee.id,
          submitted_by: user.id,
          request_type: requestType,
          message: message.trim(),
        })
        .select("id")
        .single()

      if (caseError || !caseRow) throw caseError || new Error("Failed to submit")

      if (attachment) {
        const path = `cases/${committee.id}/${caseRow.id}/${attachment.name}`
        const { error: uploadError } = await supabase.storage.from("committee-files").upload(path, attachment)
        if (!uploadError) {
          await supabase.from("committee_cases").update({ attachment_path: path }).eq("id", caseRow.id)
        }
      }

      setSubmitted(true)
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={!!committee}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          reset()
        }
      }}
    >
      <DialogContent className="max-w-lg">
        {committee && (
          <>
            <DialogHeader>
              <DialogTitle>Contact {committee.name}</DialogTitle>
              <DialogDescription>
                This creates a private case for the committee -- it isn't a public message or email.
              </DialogDescription>
            </DialogHeader>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="font-medium">Your request has been submitted</p>
                <p className="text-sm text-muted-foreground">
                  You'll be notified here when the committee responds. Track it anytime under "My Requests" on this
                  page.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a request type" />
                    </SelectTrigger>
                    <SelectContent>
                      {committee.request_types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                    placeholder="Describe your situation..."
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
                </div>

                <div className="space-y-2">
                  <Label>Attachment (optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      id="case-attachment"
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    />
                    {attachment ? (
                      <div className="flex items-center justify-between text-sm">
                        <span>{attachment.name}</span>
                        <button onClick={() => setAttachment(null)}>Remove</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => document.getElementById("case-attachment")?.click()}
                        className="flex flex-col items-center gap-2 w-full"
                      >
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to attach a file</span>
                      </button>
                    )}
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !requestType || !message.trim()}
                  className="w-full"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
