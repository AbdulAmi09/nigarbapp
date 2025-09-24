import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function getPaymentData(userId: string) {
  const supabase = await createClient()

  // Get payment summary for the user
  const { data: payments } = await supabase
    .from("payment_summary")
    .select("*")
    .eq("arbiter_id", userId)
    .order("created_at", { ascending: false })

  return payments || []
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const payments = await getPaymentData(user.id)

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
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20"
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
      case "failed":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tournament_fee":
        return "bg-primary/10 text-primary"
      case "membership":
        return "bg-blue-500/10 text-blue-600"
      case "training":
        return "bg-green-500/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const totalPaid = payments
    .filter((p) => p.payment_status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalPending = payments
    .filter((p) => p.payment_status === "pending" || p.payment_status === "processing")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalOverdue = payments
    .filter((p) => p.payment_status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const formatCurrency = (amount: number, currency = "NGN") => {
    if (currency === "NGN") {
      return `₦${amount.toLocaleString()}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
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
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Make Payment
        </Button>
      </div>

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
                <p className="text-2xl font-bold">{formatCurrency(totalPaid + totalPending + totalOverdue)}</p>
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
                <Input placeholder="Search payments..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tournament_fee">Tournament Fee</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
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
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Complete record of your payments and transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{payment.tournament_name || payment.description}</h3>
                          <Badge className={getStatusColor(payment.payment_status)}>
                            {getStatusIcon(payment.payment_status)}
                            <span className="ml-1 capitalize">{payment.payment_status}</span>
                          </Badge>
                          <Badge className={getTypeColor(payment.payment_type)}>
                            {payment.payment_type?.replace("_", " ") || "Payment"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium text-foreground">
                              {formatCurrency(Number(payment.amount), payment.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDate(payment.due_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            <span>{payment.payment_method || "Pending"}</span>
                          </div>
                          <div>
                            <span>Ref: {payment.transaction_reference || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {payment.payment_status === "pending" && <Button size="sm">Pay Now</Button>}
                        {payment.payment_status === "paid" && payment.receipt_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Receipt
                            </a>
                          </Button>
                        )}
                        {payment.payment_status === "overdue" && (
                          <Button size="sm" variant="destructive">
                            Pay Overdue
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No payment records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Payments that require your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {payments.filter(
                (p) =>
                  p.payment_status === "pending" || p.payment_status === "processing" || p.payment_status === "overdue",
              ).length > 0 ? (
                payments
                  .filter(
                    (p) =>
                      p.payment_status === "pending" ||
                      p.payment_status === "processing" ||
                      p.payment_status === "overdue",
                  )
                  .map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{payment.tournament_name || payment.description}</h3>
                            <Badge className={getStatusColor(payment.payment_status)}>
                              {getStatusIcon(payment.payment_status)}
                              <span className="ml-1 capitalize">{payment.payment_status}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium text-foreground">
                                {formatCurrency(Number(payment.amount), payment.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {formatDate(payment.due_date)}</span>
                            </div>
                            <div>
                              <span>Ref: {payment.transaction_reference || "N/A"}</span>
                            </div>
                          </div>
                          {payment.payment_status === "overdue" && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                <XCircle className="w-4 h-4 inline mr-1" />
                                Payment is overdue. Please pay immediately to avoid penalties.
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant={payment.payment_status === "overdue" ? "destructive" : "default"}>
                            Pay Now
                          </Button>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No pending payments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paid Transactions</CardTitle>
              <CardDescription>Successfully completed payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {payments.filter((p) => p.payment_status === "paid").length > 0 ? (
                payments
                  .filter((p) => p.payment_status === "paid")
                  .map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{payment.tournament_name || payment.description}</h3>
                            <Badge className={getStatusColor(payment.payment_status)}>
                              {getStatusIcon(payment.payment_status)}
                              <span className="ml-1 capitalize">{payment.payment_status}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium text-foreground">
                                {formatCurrency(Number(payment.amount), payment.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Paid: {formatDate(payment.paid_date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              <span>{payment.payment_method || "N/A"}</span>
                            </div>
                            <div>
                              <span>Ref: {payment.transaction_reference || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {payment.receipt_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                Receipt
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No completed payments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your preferred payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">Primary payment method</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Mobile Money</p>
                      <p className="text-sm text-muted-foreground">MTN Mobile Money</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Available</Badge>
                    <Button variant="outline" size="sm">
                      Setup
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure your payment preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-pay enabled</p>
                      <p className="text-sm text-muted-foreground">Automatically pay recurring fees</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment reminders</p>
                      <p className="text-sm text-muted-foreground">Get notified before due dates</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Receipt delivery</p>
                      <p className="text-sm text-muted-foreground">Email receipts automatically</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Settings
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download All Receipts
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="w-4 h-4 mr-2" />
                      Payment Calendar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
