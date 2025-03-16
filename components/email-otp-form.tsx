"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { signInWithEmailOTP, verifyEmailOTP } from "@/lib/auth-helpers"
import { useToast } from "@/hooks/use-toast"

interface EmailOTPFormProps {
  onSuccess?: () => void
  redirectUrl?: string
  title?: string
  description?: string
}

export function EmailOTPForm({
  onSuccess,
  redirectUrl = "/dashboard",
  title = "Sign In with Email",
  description = "We'll send you a verification code to sign in",
}: EmailOTPFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [cooldownInterval, setCooldownInterval] = useState<NodeJS.Timeout | null>(null)

  // Function to start the cooldown timer
  const startCooldownTimer = (seconds: number) => {
    if (cooldownInterval) clearInterval(cooldownInterval)

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCooldownActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setCooldownInterval(interval)
    setCooldownActive(true)
    setCooldownSeconds(seconds)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Don't proceed if cooldown is active
      if (cooldownActive) {
        toast({
          title: "Please wait",
          description: `You can request another code in ${cooldownSeconds} seconds.`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const { data, error } = await signInWithEmailOTP(email)

      if (error) {
        // Check if this is a rate limit error
        if (error.includes("rate limit") || error.includes("wait")) {
          // Extract the seconds from the error message if available
          const secondsMatch = error.match(/after (\d+) seconds/)
          const waitSeconds = secondsMatch ? Number.parseInt(secondsMatch[1]) : 60

          // Set cooldown
          startCooldownTimer(waitSeconds)
          throw new Error(`Email rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`)
        }
        throw new Error(error)
      } else {
        setStep("otp")
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code. Also check your spam folder.",
        })
      }
    } catch (err) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await verifyEmailOTP(email, otp)

      if (error) {
        throw new Error(error)
      } else {
        toast({
          title: "Success",
          description: "You have successfully signed in.",
        })

        // Clear any cooldowns
        if (cooldownInterval) clearInterval(cooldownInterval)
        setCooldownActive(false)

        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        } else {
          // Otherwise redirect
          router.push(redirectUrl)
        }
      }
    } catch (err) {
      setError(err.message)
      toast({
        title: "Verification Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (loading) return

    // Don't proceed if cooldown is active
    if (cooldownActive) {
      toast({
        title: "Please wait",
        description: `You can request another code in ${cooldownSeconds} seconds.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await signInWithEmailOTP(email, true)

      if (error) {
        // Check if this is a rate limit error
        if (error.includes("rate limit") || error.includes("wait")) {
          // Extract the seconds from the error message if available
          const secondsMatch = error.match(/after (\d+) seconds/)
          const waitSeconds = secondsMatch ? Number.parseInt(secondsMatch[1]) : 60

          // Set cooldown
          startCooldownTimer(waitSeconds)
          throw new Error(`Email rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`)
        }
        throw new Error(error)
      }

      toast({
        title: "Verification Code Resent",
        description: "Please check your inbox (and spam folder) for the new verification code.",
      })
    } catch (err) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">{step === "email" ? title : "Enter Verification Code"}</CardTitle>
        <CardDescription>
          {step === "email" ? description : `We've sent a verification code to ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/15 text-destructive rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {cooldownActive && (
          <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-500">Rate limit active</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Please wait {cooldownSeconds} seconds before requesting another code.
              </p>
            </div>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading || cooldownActive}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || cooldownActive}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : cooldownActive ? (
                `Wait ${cooldownSeconds}s`
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                disabled={loading}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your email</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Code
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {step === "email" ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            We'll send a secure, one-time code to your email
          </div>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={() => setStep("email")} disabled={loading}>
              Change Email
            </Button>
            <Button type="button" variant="ghost" onClick={handleResendCode} disabled={loading || cooldownActive}>
              {cooldownActive ? `Resend in ${cooldownSeconds}s` : "Resend Code"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

