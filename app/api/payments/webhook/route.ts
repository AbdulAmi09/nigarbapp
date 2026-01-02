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

    if (body.event === "charge.success") {
      const {
        reference,
        amount,
        customer: { email } = {},
        authorization,
      } = body.data

      const { data: transaction, error: txnError } = await supabase
        .from("paystack_transactions")
        .insert({
          reference,
          amount: amount / 100, // Convert from kobo to naira
          customer_email: email,
          status: "success",
          authorization_code: authorization?.authorization_code,
          last_four: authorization?.last4,
          channel: authorization?.channel,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (txnError) {
        console.error("[v0] Error inserting transaction:", txnError)
        return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 })
      }

      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .update({
          payment_status: "paid",
          paid_date: new Date().toISOString(),
          payment_method: "paystack",
          transaction_reference: reference,
        })
        .eq("id", transaction?.payment_id)
        .select()
        .single()

      if (paymentError) {
        console.error("[v0] Error updating payment:", paymentError)
      }

      if (payment) {
        await supabase.from("notifications").insert({
          recipient_id: payment.arbiter_id,
          title: "Payment Successful",
          message: `Your payment of ₦${(amount / 100).toLocaleString()} has been received successfully.`,
          notification_type: "payment",
          is_important: false,
        })
      }
    }

    if (body.event === "charge.failed") {
      const { reference } = body.data

      await supabase.from("paystack_transactions").update({ status: "failed" }).eq("reference", reference)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
