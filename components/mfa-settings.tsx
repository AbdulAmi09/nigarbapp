"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Shield, ShieldCheck } from "lucide-react"

export default function MfaSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    refreshStatus()
  }, [])

  async function refreshStatus() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error && data) {
      const verified = data.totp.find((f) => f.status === "verified")
      setEnrolled(!!verified)
      setFactorId(verified?.id || null)
    }
    setLoading(false)
  }

  async function handleEnroll() {
    setError(null)
    setEnrolling(true)

    // Clean up any abandoned, never-verified factors from a previous attempt.
    const { data: existing } = await supabase.auth.mfa.listFactors()
    for (const f of existing?.totp || []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id })
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" })
    if (error || !data) {
      setError(error?.message || "Could not start 2FA setup. Make sure multi-factor authentication is enabled for this project.")
      setEnrolling(false)
      return
    }
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setPendingFactorId(data.id)
  }

  function cancelEnrollment() {
    if (pendingFactorId) {
      supabase.auth.mfa.unenroll({ factorId: pendingFactorId })
    }
    setQrCode(null)
    setSecret(null)
    setPendingFactorId(null)
    setCode("")
    setEnrolling(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingFactorId) return
    setVerifying(true)
    setError(null)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: pendingFactorId,
    })
    if (challengeError || !challenge) {
      setError(challengeError?.message || "Could not verify code. Please try again.")
      setVerifying(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: challenge.id,
      code,
    })
    if (verifyError) {
      setError("Invalid code. Please check your authenticator app and try again.")
      setVerifying(false)
      return
    }

    setQrCode(null)
    setSecret(null)
    setPendingFactorId(null)
    setCode("")
    setVerifying(false)
    setEnrolling(false)
    await refreshStatus()
  }

  async function handleDisable() {
    if (!factorId) return
    setDisabling(true)
    setError(null)
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) {
      setError(error.message)
      setDisabling(false)
      return
    }
    setDisabling(false)
    await refreshStatus()
  }

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  }

  if (enrolled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <ShieldCheck className="w-4 h-4" />
          Two-factor authentication is active on your account.
        </div>
        <Button variant="outline" size="sm" onClick={handleDisable} disabled={disabling}>
          {disabling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Disable 2FA
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }

  if (pendingFactorId && qrCode) {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit
          code it shows.
        </p>
        <img src={qrCode || "/placeholder.svg"} alt="2FA QR code" className="w-40 h-40 border rounded-lg p-2 bg-white" />
        {secret && (
          <p className="text-xs text-muted-foreground">
            Can&apos;t scan? Enter this code manually: <span className="font-mono">{secret}</span>
          </p>
        )}
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="mfa-code">Verification Code</Label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={verifying || code.length < 6}>
            {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Verify &amp; Enable
          </Button>
          <Button type="button" variant="outline" onClick={cancelEnrollment}>
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={enrolling}>
        {enrolling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <Shield className="w-4 h-4 mr-2" />
        Enable 2FA
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
