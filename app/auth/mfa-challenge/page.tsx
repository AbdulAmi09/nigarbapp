"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"

export default function MfaChallengePage() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState("")
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error || !data) {
        setError("Could not start verification. Please try signing in again.")
        setLoading(false)
        return
      }

      const totp = data.totp.find((f) => f.status === "verified")
      if (!totp) {
        // Nothing to challenge — send them on.
        router.push("/dashboard")
        return
      }

      setFactorId(totp.id)
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id })
      if (challengeError || !challenge) {
        setError("Could not start verification. Please try signing in again.")
        setLoading(false)
        return
      }

      setChallengeId(challenge.id)
      setLoading(false)
    }
    init()
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId || !challengeId) return
    setVerifying(true)
    setError(null)

    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (error) {
      setError("Invalid code. Please try again.")
      setVerifying(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Verification</h1>
          <p className="text-gray-600">Enter the code from your authenticator app</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Verify Your Identity</CardTitle>
            <CardDescription className="text-center">This account has two-factor authentication enabled</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading || verifying || code.length < 6}>
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
