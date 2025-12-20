"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setStatus("failed")
      setMessage("No payment reference found")
      return
    }

    async function verifyPayment() {
      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        })

        const data = await response.json()

        if (data.success) {
          setStatus("success")
          setMessage("Your payment has been processed successfully!")
        } else {
          setStatus("failed")
          setMessage(data.message || "Payment verification failed")
        }
      } catch (error) {
        setStatus("failed")
        setMessage("An error occurred while verifying your payment")
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <CardTitle className="mt-4">Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <CardTitle className="mt-4 text-green-600">Payment Successful!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === "failed" && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500" />
              <CardTitle className="mt-4 text-red-600">Payment Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/dashboard/payments">Back to Payments</Link>
          </Button>
          {status === "failed" && (
            <Button variant="outline" onClick={() => router.back()}>
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
