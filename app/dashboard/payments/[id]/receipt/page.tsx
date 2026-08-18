import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import PrintReceiptButton from "@/components/print-receipt-button"

const TYPE_LABELS: Record<string, string> = {
  annual_dues: "Annual Dues",
  checkoff: "Checkoff",
  penalty: "Penalty",
  donation: "Donation",
  certification: "Certification",
  event_registration: "Event Registration",
}

function formatCurrency(amount: number, currency = "NGN") {
  if (currency === "NGN") return `₦${Number(amount).toLocaleString()}`
  return `${currency} ${Number(amount).toLocaleString()}`
}

export default async function PaymentReceiptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: payment } = await supabase
    .from("payment_summary")
    .select("*")
    .eq("id", params.id)
    .eq("arbiter_id", user.id)
    .single()

  if (!payment || payment.payment_status !== "paid") {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/payments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Link>
        </Button>
        <PrintReceiptButton />
      </div>

      <Card>
        <CardHeader className="text-center border-b space-y-2">
          <img
            src="https://bkrmltqwwonzkmlbarva.supabase.co/storage/v1/object/public/downloads/rules/ncaa%20logo.jpg"
            alt="NCAA"
            className="w-14 h-14 mx-auto rounded-md"
          />
          <p className="font-semibold tracking-wide">NIGERIA CHESS ARBITERS ASSOCIATION</p>
          <p className="text-sm text-muted-foreground">Payment Receipt</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Payment Successful</span>
          </div>

          <div className="text-center py-4 border-y">
            <p className="text-sm text-muted-foreground">Amount Paid</p>
            <p className="text-4xl font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Paid To</dt>
            <dd className="text-right font-medium">Nigeria Chess Arbiters Association</dd>

            <dt className="text-muted-foreground">Arbiter</dt>
            <dd className="text-right font-medium">{payment.arbiter_name || "--"}</dd>

            <dt className="text-muted-foreground">Payment Type</dt>
            <dd className="text-right font-medium">{TYPE_LABELS[payment.payment_type] || payment.payment_type}</dd>

            {payment.tournament_name && (
              <>
                <dt className="text-muted-foreground">Tournament</dt>
                <dd className="text-right font-medium">{payment.tournament_name}</dd>
              </>
            )}

            {payment.description && (
              <>
                <dt className="text-muted-foreground">Description</dt>
                <dd className="text-right font-medium">{payment.description}</dd>
              </>
            )}

            <dt className="text-muted-foreground">Payment Method</dt>
            <dd className="text-right font-medium capitalize">{payment.payment_method || "--"}</dd>

            <dt className="text-muted-foreground">Reference</dt>
            <dd className="text-right font-medium font-mono text-xs">{payment.transaction_reference || "--"}</dd>

            <dt className="text-muted-foreground">Date Paid</dt>
            <dd className="text-right font-medium">
              {payment.paid_date ? new Date(payment.paid_date).toLocaleString() : "--"}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
