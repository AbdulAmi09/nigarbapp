"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Pencil,
  Users,
  FileText,
  Download,
  Trash2,
  Upload,
  Loader2,
  Paperclip,
} from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  arbiter_level?: string | null
}

interface CommitteeCase {
  id: string
  request_type: string
  message: string
  status: string
  attachment_path: string | null
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
  submitter: Profile | null
}

interface CommitteeDoc {
  id: string
  title: string
  category: string
  file_path: string
  is_public: boolean
  created_at: string
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
  chairman_id: string | null
  secretary_id: string | null
}

function name(p: Profile | null) {
  if (!p) return "Unknown"
  return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"
}

function initials(p: Profile | null) {
  const n = name(p)
  return n
    .split(" ")
    .map((x) => x[0])
    .join("")
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  resolved: "bg-green-500/10 text-green-600",
}

const CATEGORY_LABELS: Record<string, string> = {
  minutes: "Minutes",
  agenda: "Agenda",
  guideline: "Guideline",
  other: "Other",
}

export default function CommitteeWorkspace({
  committee,
  userId,
  role,
  isOfficer,
  roster,
  cases: initialCases,
  documents: initialDocuments,
}: {
  committee: Committee
  userId: string
  role: "Chairman" | "Secretary" | "Member"
  isOfficer: boolean
  roster: Profile[]
  cases: CommitteeCase[]
  documents: CommitteeDoc[]
}) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [cases, setCases] = useState(initialCases)
  const [documents, setDocuments] = useState(initialDocuments)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  async function handleDownloadDoc(path: string) {
    const { data } = await supabase.storage.from("committee-files").createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  async function handleDownloadAttachment(path: string) {
    const { data } = await supabase.storage.from("committee-files").createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  async function handleDeleteDoc(doc: CommitteeDoc) {
    await supabase.storage.from("committee-files").remove([doc.file_path])
    await supabase.from("committee_documents").delete().eq("id", doc.id)
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
  }

  async function handleStatusChange(caseId: string, status: string) {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status } : c)))
    await supabase
      .from("committee_cases")
      .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
      .eq("id", caseId)
  }

  const chairman = roster.find((p) => p.id === committee.chairman_id)
  const secretary = roster.find((p) => p.id === committee.secretary_id)
  const members = roster.filter((p) => p.id !== committee.chairman_id && p.id !== committee.secretary_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/dashboard/committee">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Committees
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-balance">{committee.name}</h1>
          <p className="text-muted-foreground text-pretty">{committee.description || committee.purpose}</p>
        </div>
        <Badge className="text-sm">{role}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Next Meeting</CardTitle>
              {isOfficer && (
                <Button variant="ghost" size="sm" onClick={() => setMeetingDialogOpen(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {committee.next_meeting_date
                  ? new Date(committee.next_meeting_date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Not scheduled"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{committee.meeting_location || "TBD"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{committee.meeting_schedule || "No set cadence"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roster</CardTitle>
            <CardDescription>{roster.length} people</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">Cases ({cases.filter((c) => c.status !== "resolved").length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          {cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No cases submitted yet</p>
              </CardContent>
            </Card>
          ) : (
            cases.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={c.submitter?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{initials(c.submitter)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{c.request_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {name(c.submitter)} -- {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {isOfficer ? (
                      <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v)}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={STATUS_COLORS[c.status]}>{c.status.replace("_", " ")}</Badge>
                    )}
                  </div>
                  <p className="text-sm">{c.message}</p>
                  {c.attachment_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAttachment(c.attachment_path!)}
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      View Attachment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {isOfficer && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
          <Card>
            <CardContent className="pt-6 space-y-2">
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                    <button
                      onClick={() => handleDownloadDoc(doc.file_path)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[doc.category] || doc.category}
                          {doc.is_public ? " -- Public" : ""}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadDoc(doc.file_path)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      {isOfficer && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              {[
                chairman && { p: chairman, role: "Chairman" },
                secretary && { p: secretary, role: "Secretary" },
                ...members.map((p) => ({ p, role: "Member" })),
              ]
                .filter(Boolean)
                .map((entry: any) => (
                  <div key={entry.p.id} className="flex items-center gap-3 border rounded-lg p-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.p.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{initials(entry.p)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{name(entry.p)}</p>
                      <p className="text-xs text-muted-foreground">{entry.role}</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MeetingInfoDialog
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
        committee={committee}
        onSaved={() => router.refresh()}
      />
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        committeeId={committee.id}
        userId={userId}
        onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])}
      />
    </div>
  )
}

function toLocalDatetimeInput(value: string | null) {
  if (!value) return ""
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function MeetingInfoDialog({
  open,
  onOpenChange,
  committee,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  committee: Committee
  onSaved: () => void
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [date, setDate] = useState(toLocalDatetimeInput(committee.next_meeting_date))
  const [location, setLocation] = useState(committee.meeting_location || "")
  const [schedule, setSchedule] = useState(committee.meeting_schedule || "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await supabase.rpc("update_committee_meeting_info", {
        p_committee_id: committee.id,
        p_next_meeting_date: date ? new Date(date).toISOString() : null,
        p_meeting_location: location || null,
        p_meeting_schedule: schedule || null,
      })
      onOpenChange(false)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meeting Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Next Meeting Date & Time</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. NCAA Secretariat, Lagos" />
          </div>
          <div className="space-y-2">
            <Label>Meeting Cadence</Label>
            <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Monthly - Third Monday" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UploadDocumentDialog({
  open,
  onOpenChange,
  committeeId,
  userId,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  committeeId: string
  userId: string
  onUploaded: (doc: CommitteeDoc) => void
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("minutes")
  const [isPublic, setIsPublic] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  function reset() {
    setTitle("")
    setCategory("minutes")
    setIsPublic(false)
    setFile(null)
  }

  async function handleUpload() {
    if (!file || !title.trim()) return
    setUploading(true)
    try {
      const path = `docs/${committeeId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from("committee-files").upload(path, file)
      if (uploadError) throw uploadError

      const { data: doc, error: insertError } = await supabase
        .from("committee_documents")
        .insert({
          committee_id: committeeId,
          title: title.trim(),
          category,
          file_path: path,
          file_type: file.type,
          is_public: isPublic,
          uploaded_by: userId,
        })
        .select()
        .single()

      if (insertError) throw insertError

      onUploaded(doc as CommitteeDoc)
      onOpenChange(false)
      reset()
    } catch (e) {
      console.error("[v0] Document upload failed:", e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. March 2026 Minutes" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
                <SelectItem value="guideline">Guideline</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="doc-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="doc-public" className="font-normal cursor-pointer">
              Make visible to non-members (e.g. public guidelines/rules)
            </Label>
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()}>
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
