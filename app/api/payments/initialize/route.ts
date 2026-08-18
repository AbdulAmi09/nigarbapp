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

    const { payment_id, metadata } = await request.json()

    // The amount to charge always comes from the payments row itself, never
    // from the client -- otherwise a tampered request could pay any amount
    // it likes for a real due. Ownership is enforced by RLS (arbiter_id).
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, amount, payment_status")
      .eq("id", payment_id)
      .eq("arbiter_id", user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.payment_status !== "pending") {
      return NextResponse.json({ error: "This payment is not awaiting payment" }, { status: 400 })
    }

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(Number(payment.amount) * 100), // Paystack expects amount in kobo
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/payments/callback`,
        metadata: {
          payment_id,
          user_id: user.id,
          ...metadata,
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 })
    }

    const { error: rpcError } = await supabase.rpc("mark_payment_processing", {
      p_payment_id: payment_id,
      p_reference: data.data.reference,
    })

    if (rpcError) {
      console.error("[v0] Payment update error:", rpcError)
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}
