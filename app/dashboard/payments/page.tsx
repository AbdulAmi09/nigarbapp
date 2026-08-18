"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Ban,
  ReceiptText,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PaymentDialog from "@/components/payment-dialog"

const PAGE_SIZE = 50

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  payment_type: string
  description: string
  tournament_name: string | null
  due_date: string | null
  paid_date: string | null
  payment_method: string | null
  transaction_reference: string | null
  receipt_url: string | null
  created_at: string
}

interface PaymentDue {
  id: string
  payment_type: string
  amount: number
  due_date: string | null
}

const TYPE_LABELS: Record<string, string> = {
  annual_dues: "Annual Dues",
  checkoff: "Checkoff",
  penalty: "Penalty",
  donation: "Donation",
  certification: "Certification",
  event_registration: "Event Registration",
}

export default function PaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [statsRows, setStatsRows] = useState<{ amount: number; status: string; created_at: string }[]>([])
  const [paymentDues, setPaymentDues] = useState<PaymentDue[]>([])
  const [userId, setUserId] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  function mapPayment(p: any): Payment {
    return {
      id: p.id,
      amount: Number(p.amount) || 0,
      currency: p.currency || "NGN",
      status: p.payment_status || "pending",
      payment_type: p.payment_type || "other",
      description: p.description || "",
      tournament_name: p.tournament_name,
      due_date: p.due_date,
      paid_date: p.paid_date,
      payment_method: p.payment_method,
      transaction_reference: p.transaction_reference,
      receipt_url: p.receipt_url,
      created_at: p.created_at,
    }
  }

  async function fetchAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUserId(user.id)
    setUserEmail(user.email || "")

    const [listRes, statsRes, duesRes] = await Promise.all([
      supabase
        .from("payment_summary")
        .select("*")
        .eq("arbiter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE),
      supabase.from("payments").select("amount, payment_status, created_at").eq("arbiter_id", user.id),
      supabase
        .from("payment_due")
        .select("id, payment_type, amount, due_date")
        .eq("arbiter_id", user.id)
        .eq("is_paid", false)
        .order("due_date", { ascending: true }),
    ])

    if (listRes.data) {
      setPayments(listRes.data.map(mapPayment))
      setHasMore(listRes.data.length === PAGE_SIZE)
    }
    if (statsRes.data) {
      setStatsRows(
        statsRes.data.map((r: any) => ({
          amount: Number(r.amount) || 0,
          status: r.payment_status || "pending",
          created_at: r.created_at,
        })),
      )
    }
    if (duesRes.data) {
      setPaymentDues(
        duesRes.data.map((d: any) => ({
          id: d.id,
          payment_type: d.payment_type,
          amount: Number(d.amount) || 0,
          due_date: d.due_date,
        })),
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLoadMore() {
    if (payments.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = payments[payments.length - 1].created_at
      const { data } = await supabase
        .from("payment_summary")
        .select("*")
        .eq("arbiter_id", userId)
        .lt("created_at", oldest)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

      if (data) {
        setPayments((prev) => [...prev, ...data.map(mapPayment)])
        setHasMore(data.length === PAGE_SIZE)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleViewUploadedReceipt(path: string) {
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 60)
    if (error || !data?.signedUrl) {
      console.error("[v0] Failed to sign receipt URL:", error)
      return
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  async function handlePayment(payment: Payment) {
    setProcessing(payment.id)

    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payment.id,
          metadata: {
            payment_type: payment.payment_type,
            description: payment.description,
          },
        }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        console.error("Payment initialization failed:", data.error)
      }
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "processing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "overdue":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      case "cancelled":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "processing":
        return <AlertCircle className="w-4 h-4" />
      case "overdue":
        return <XCircle className="w-4 h-4" />
      case "cancelled":
        return <Ban className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "annual_dues":
        return "bg-primary/10 text-primary"
      case "checkoff":
        return "bg-blue-500/10 text-blue-600"
      case "penalty":
        return "bg-red-500/10 text-red-600"
      case "donation":
        return "bg-green-500/10 text-green-600"
      case "certification":
        return "bg-purple-500/10 text-purple-600"
      case "event_registration":
        return "bg-orange-500/10 text-orange-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const formatCurrency = (amount: number, currency = "NGN") => {
    if (currency === "NGN") return `₦${amount.toLocaleString()}`
    return `${currency} ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== "all" && payment.status !== statusFilter) return false
    if (typeFilter !== "all" && payment.payment_type !== typeFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        payment.description?.toLowerCase().includes(query) ||
        payment.tournament_name?.toLowerCase().includes(query) ||
        payment.transaction_reference?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const { totalPaid, totalPending, totalOverdue, thisYearTotal } = useMemo(() => {
    const currentYear = new Date().getFullYear()
    let paid = 0
    let pending = 0
    let overdue = 0
    let thisYear = 0
    for (const row of statsRows) {
      if (row.status === "paid") paid += row.amount
      if (row.status === "pending" || row.status === "processing") pending += row.amount
      if (row.status === "overdue") overdue += row.amount
      if (new Date(row.created_at).getFullYear() === currentYear) thisYear += row.amount
    }
    return { totalPaid: paid, totalPending: pending, totalOverdue: overdue, thisYearTotal: thisYear }
  }, [statsRows])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Payments</h1>
          <p className="text-muted-foreground text-pretty">
            Manage your tournament fees, membership payments, and financial transactions.
          </p>
        </div>
        <Button onClick={() => setPaymentDialogOpen(true)}>Make Payment</Button>
      </div>

      {paymentDues.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">What You Owe</CardTitle>
            <CardDescription>Outstanding dues on your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentDues.map((due) => (
              <div key={due.id} className="flex items-center justify-between border rounded-lg p-3 bg-background">
                <div>
                  <p className="font-medium">{TYPE_LABELS[due.payment_type] || due.payment_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(due.amount)}
                    {due.due_date ? ` -- due ${formatDate(due.due_date)}` : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  Pay Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOverdue)}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Year</p>
                <p className="text-2xl font-bold">{formatCurrency(thisYearTotal)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search payments..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Complete record of your payments and transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => {
              const awaitingReview = payment.status === "pending" && payment.payment_method === "bank_transfer"
              const canPayNow =
                (payment.status === "pending" && !payment.payment_method) || payment.status === "overdue"

              return (
                <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{payment.tournament_name || payment.description}</h3>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1 capitalize">{payment.status}</span>
                        </Badge>
                        <Badge className={getTypeColor(payment.payment_type)}>
                          {TYPE_LABELS[payment.payment_type] || payment.payment_type?.replace("_", " ") || "Payment"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium text-foreground">
                            {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(payment.due_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {awaitingReview
                              ? "Awaiting admin review"
                              : payment.payment_method || "Not yet paid"}
                          </span>
                        </div>
                        <div>
                          <span>Ref: {payment.transaction_reference || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canPayNow && (
                        <Button
                          size="sm"
                          variant={payment.status === "overdue" ? "destructive" : "default"}
                          onClick={() => handlePayment(payment)}
                          disabled={processing === payment.id}
                        >
                          {processing === payment.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Pay Now"
                          )}
                        </Button>
                      )}
                      {payment.status === "paid" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/payments/${payment.id}/receipt`}>
                            <ReceiptText className="w-4 h-4 mr-2" />
                            Receipt
                          </Link>
                        </Button>
                      )}
                      {payment.status === "paid" && payment.receipt_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUploadedReceipt(payment.receipt_url!)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Uploaded Proof
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground text-center py-8">No payment records found</p>
          )}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Load older payments
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        userEmail={userEmail}
        onPaymentInitiated={fetchAll}
      />
    </div>
  )
}
