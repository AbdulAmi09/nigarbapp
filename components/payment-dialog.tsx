"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, X } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  onPaymentInitiated?: () => void
}

const PAYMENT_TYPES = [
  { id: "annual_dues", label: "Annual Dues", description: "Yearly membership fee" },
  { id: "checkoff", label: "Checkoff", description: "Checkoff fee" },
  { id: "penalty", label: "Penalty", description: "Outstanding penalties" },
  { id: "donation", label: "Donation", description: "Support the federation" },
  { id: "certification", label: "Certification", description: "Certification fees" },
]

export default function PaymentDialog({ open, onOpenChange, userEmail, onPaymentInitiated }: PaymentDialogProps) {
  const [step, setStep] = useState<"type" | "method">("type")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<"bank" | "paystack">("paystack")
  const [amount, setAmount] = useState("")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentDue, setPaymentDue] = useState<any>(null)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [userName, setUserName] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (open) {
      fetchUserData()
    }
  }, [open])

  async function fetchUserData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()

    setUserName(profile?.full_name || "")

    // Fetch payment due for this user
    const { data: dues } = await supabase.from("payment_due").select("*").eq("arbiter_id", user.id).eq("is_paid", false)

    if (dues && dues.length > 0) {
      setPaymentDue(dues[0])
    }
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const type = PAYMENT_TYPES.find((t) => t.id === typeId)
    if (typeId === "donation" || typeId === "certification") {
      setAmount("")
      setDetails("")
    } else if (paymentDue && paymentDue.payment_type === typeId) {
      setAmount(paymentDue.amount.toString())
    }
    setStep("method")
  }

  const handleBankTransferSubmit = async () => {
    if (!receipt || !selectedType || !amount) return
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Upload receipt to storage
      const fileName = `${user.id}/${Date.now()}-${receipt.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(fileName, receipt)

      if (uploadError) throw uploadError

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        arbiter_id: user.id,
        amount: Number.parseFloat(amount),
        payment_type: selectedType,
        payment_status: "pending",
        payment_method: "bank_transfer",
        receipt_url: uploadData?.path,
        description: details || PAYMENT_TYPES.find((t) => t.id === selectedType)?.label,
      })

      if (paymentError) throw paymentError

      onOpenChange(false)
      onPaymentInitiated?.()
      setStep("type")
      setSelectedType(null)
      setAmount("")
      setDetails("")
      setReceipt(null)
    } catch (error) {
      console.error("[v0] Bank transfer error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaystackSubmit = async () => {
    if (!selectedType || !amount) return
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Create payment record first
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          arbiter_id: user.id,
          amount: Number.parseFloat(amount),
          payment_type: selectedType,
          payment_status: "processing",
          description: details || PAYMENT_TYPES.find((t) => t.id === selectedType)?.label,
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          email: userEmail,
          payment_id: payment.id,
          metadata: {
            payment_type: selectedType,
            description: details,
          },
        }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        console.error("[v0] Payment initialization failed:", data.error)
      }
    } catch (error) {
      console.error("[v0] Paystack error:", error)
    } finally {
      setLoading(false)
    }
  }

  const isTypeDisabled = (typeId: string) => {
    if (typeId === "penalty" || typeId === "annual_dues" || typeId === "checkoff") {
      return !paymentDue || paymentDue.payment_type !== typeId
    }
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            {step === "type" ? "Select the type of payment you want to make" : "Choose your preferred payment method"}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {PAYMENT_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    isTypeDisabled(type.id) ? "opacity-50 cursor-not-allowed bg-muted" : "hover:bg-accent"
                  }`}
                  onClick={() => {
                    if (!isTypeDisabled(type.id)) {
                      handleTypeSelect(type.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {isTypeDisabled(type.id) && (
                      <span className="text-xs bg-muted-foreground/20 px-2 py-1 rounded">No due</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancel
            </Button>
          </div>
        )}

        {step === "method" && selectedType && (
          <div className="space-y-4">
            {(selectedType === "donation" || selectedType === "certification") && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="details">Details</Label>
                  <Input
                    id="details"
                    placeholder="Additional information"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as "bank" | "paystack")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                <TabsTrigger value="paystack">Paystack</TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-4">
                <Card className="p-4 bg-muted">
                  <p className="text-sm font-semibold mb-2">Bank Details:</p>
                  <p className="text-sm">Bank Name: Access Bank</p>
                  <p className="text-sm">Account: 1234567890</p>
                  <p className="text-sm">Reference: {userName || "Your Name"}</p>
                </Card>

                <div>
                  <Label htmlFor="receipt">Upload Receipt</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      id="receipt"
                      type="file"
                      className="hidden"
                      onChange={(e) => setReceipt(e.files?.[0] || null)}
                      accept="image/*,application/pdf"
                    />
                    {receipt ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{receipt.name}</span>
                        <button onClick={() => setReceipt(null)}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => document.getElementById("receipt")?.click()}
                        className="flex flex-col items-center gap-2"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload receipt</span>
                      </button>
                    )}
                  </div>
                </div>

                <Button onClick={handleBankTransferSubmit} disabled={loading || !receipt || !amount} className="w-full">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit
                </Button>
              </TabsContent>

              <TabsContent value="paystack" className="space-y-4">
                <Button onClick={handlePaystackSubmit} disabled={loading || !amount} className="w-full">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Pay with Paystack
                </Button>
              </TabsContent>
            </Tabs>

            <Button variant="outline" onClick={() => setStep("type")} className="w-full">
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
