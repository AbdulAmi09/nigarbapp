import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reference } = await request.json()

    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("transaction_reference", reference)
      .eq("arbiter_id", user.id)
      .single()

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 })
    }

    const transaction = data.data

    // Route through the same SECURITY DEFINER path the webhook uses, so the
    // amount is verified against what's owed and the audit trail/
    // notification fire regardless of which path (webhook or this
    // client-triggered callback) completes first.
    const { error: rpcError } = await supabase.rpc("record_paystack_payment", {
      p_reference: reference,
      p_payment_id: payment.id,
      p_amount: transaction.amount / 100,
      p_customer_email: transaction.customer?.email ?? null,
      p_authorization_code: transaction.authorization?.authorization_code ?? null,
      p_last_four: transaction.authorization?.last4 ?? null,
      p_channel: transaction.authorization?.channel ?? null,
      p_status: transaction.status === "success" ? "success" : "failed",
    })

    if (rpcError) {
      console.error("[v0] Payment verify RPC error:", rpcError)
      return NextResponse.json({ error: "Failed to record verified payment" }, { status: 500 })
    }

    return NextResponse.json({
      success: transaction.status === "success",
      message: transaction.status === "success" ? "Payment verified successfully" : "Payment verification failed",
      transaction,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
