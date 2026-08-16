import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { reference } = await request.json()

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

    if (transaction.status === "success") {
      // Update payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update({
          payment_status: "paid",
          paid_date: new Date().toISOString(),
          payment_method: transaction.channel,
        })
        .eq("transaction_reference", reference)
        .select("id")
        .single()

      if (updateError) {
        console.error("[v0] Payment verify update error:", updateError)
        return NextResponse.json({ error: "Failed to record verified payment" }, { status: 500 })
      }

      if (updatedPayment) {
        await supabase
          .from("event_registrations")
          .update({ payment_status: "paid" })
          .eq("payment_id", updatedPayment.id)
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        transaction,
      })
    } else {
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payments")
        .update({ payment_status: "cancelled" })
        .eq("transaction_reference", reference)
        .select("id")
        .single()

      if (updateError) {
        console.error("[v0] Payment verify update error:", updateError)
      }

      if (updatedPayment) {
        await supabase
          .from("event_registrations")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("payment_id", updatedPayment.id)
      }

      return NextResponse.json({
        success: false,
        message: "Payment verification failed",
      })
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
