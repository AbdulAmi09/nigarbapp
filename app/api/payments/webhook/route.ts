import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get("x-paystack-signature")
    const secret = process.env.PAYSTACK_SECRET_KEY

    if (!secret) {
      console.error("[v0] Paystack secret key not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(body)).digest("hex")
    if (hash !== signature) {
      console.error("[v0] Invalid Paystack signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const supabase = await createClient()

    // The webhook is called by Paystack directly with no arbiter session, so RLS
    // blocks any direct table write here. record_paystack_payment() is a
    // SECURITY DEFINER function scoped to exactly this: recording the
    // transaction, updating the payment, and notifying the arbiter atomically.
    if (body.event === "charge.success") {
      const {
        reference,
        amount,
        customer: { email } = {},
        authorization,
        metadata,
      } = body.data

      const { error: rpcError } = await supabase.rpc("record_paystack_payment", {
        p_reference: reference,
        p_payment_id: metadata?.payment_id ?? null,
        p_amount: amount / 100, // Convert from kobo to naira
        p_customer_email: email ?? null,
        p_authorization_code: authorization?.authorization_code ?? null,
        p_last_four: authorization?.last4 ?? null,
        p_channel: authorization?.channel ?? null,
        p_status: "success",
      })

      if (rpcError) {
        console.error("[v0] Error recording successful payment:", rpcError)
        return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 })
      }
    }

    if (body.event === "charge.failed") {
      const { reference, amount, customer: { email } = {}, authorization, metadata } = body.data

      const { error: rpcError } = await supabase.rpc("record_paystack_payment", {
        p_reference: reference,
        p_payment_id: metadata?.payment_id ?? null,
        p_amount: amount / 100,
        p_customer_email: email ?? null,
        p_authorization_code: authorization?.authorization_code ?? null,
        p_last_four: authorization?.last4 ?? null,
        p_channel: authorization?.channel ?? null,
        p_status: "failed",
      })

      if (rpcError) {
        console.error("[v0] Error recording failed payment:", rpcError)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
