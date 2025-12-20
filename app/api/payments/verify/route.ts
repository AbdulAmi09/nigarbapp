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
      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_date: new Date().toISOString(),
          payment_method: transaction.channel,
          amount: transaction.amount / 100, // Convert from kobo
        })
        .eq("transaction_reference", reference)

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        transaction,
      })
    } else {
      await supabase.from("payments").update({ status: "failed" }).eq("transaction_reference", reference)

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
