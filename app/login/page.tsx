"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { JSX } from "react"
import { signUpWithEmailOTP, signInWithEmailOTP, verifyEmailOTP, resetPassword } from "@/lib/auth-helpers"

/**
 * Login and Signup page with OTP verification
 * Handles user authentication with email OTP codes
 */

// Rate limit constants
const RATE_LIMIT_STORAGE_KEY = "email_rate_limit_until"
const DEFAULT_RATE_LIMIT_SECONDS = 60

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [signupError, setSignupError] = useState<string | JSX.Element>("")
  const [verificationStep, setVerificationStep] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [cooldownActive, setCooldownActive] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [cooldownInterval, setCooldownInterval] = useState<NodeJS.Timeout | null>(null)

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval)
      }
    }
  }, [cooldownInterval])

  // Check if we should show the signup tab by default
  const defaultTab = searchParams.get("signup") === "true" ? "signup" : "login"

  // Check for existing rate limit on component mount
  useEffect(() => {
    const checkRateLimit = () => {
      const rateLimitUntil = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)

      if (rateLimitUntil) {
        const limitTime = Number.parseInt(rateLimitUntil, 10)
        const now = Date.now()

        if (limitTime > now) {
          // Rate limit is still active
          const remainingSeconds = Math.ceil((limitTime - now) / 1000)
          setCooldownSeconds(remainingSeconds)
          setCooldownActive(true)

          // Start countdown
          startCooldownTimer(remainingSeconds)
        } else {
          // Rate limit has expired, clear it
          localStorage.removeItem(RATE_LIMIT_STORAGE_KEY)
        }
      }
    }

    checkRateLimit()

    // Clean up interval on unmount
    return () => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval)
      }
    }
  }, [])

  // Function to start the cooldown timer
  const startCooldownTimer = (seconds: number) => {
    if (cooldownInterval) clearInterval(cooldownInterval)

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCooldownActive(false)
          localStorage.removeItem(RATE_LIMIT_STORAGE_KEY)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setCooldownInterval(interval)
  }

  // Function to set rate limit
  const setRateLimit = (seconds: number = DEFAULT_RATE_LIMIT_SECONDS) => {
    const expiryTime = Date.now() + seconds * 1000
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, expiryTime.toString())

    setCooldownSeconds(seconds)
    setCooldownActive(true)
    startCooldownTimer(seconds)
  }

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting a full code
      const pastedCode = value.slice(0, 6).split("")
      const newOtp = [...otpCode]

      pastedCode.forEach((char, i) => {
        if (i < 6) newOtp[i] = char
      })

      setOtpCode(newOtp)

      // Focus the last filled input or the next empty one
      const lastFilledIndex = newOtp.findIndex((val) => val === "") - 1
      const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : 5
      inputRefs.current[focusIndex]?.focus()
    } else {
      // Normal single digit input
      const newOtp = [...otpCode]
      newOtp[index] = value
      setOtpCode(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  // Handle backspace in OTP inputs
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpCode[index] && index > 0) {
        // If current input is empty and backspace is pressed, focus previous input
        const newOtp = [...otpCode]
        newOtp[index - 1] = ""
        setOtpCode(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Login Successful",
        description: "Welcome back to the Donkey Mapping Initiative.",
      })
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setSignupError("")

    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    // Don't proceed if cooldown is active
    if (cooldownActive) {
      toast({
        title: "Please wait",
        description: `You can request another code in ${cooldownSeconds} seconds.`,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Store the signup details first
      setSignupEmail(email)
      setSignupPassword(password)
      setSignupName(name)

      // Use the improved signUpWithEmailOTP function
      const { data: signUpData, error: signUpError } = await signUpWithEmailOTP(email, password, { name })

      if (signUpError) {
        // Check if this is a rate limit error
        if (signUpError.includes("rate limit") || signUpError.includes("wait")) {
          // Set cooldown immediately to prevent further attempts
          setCooldownActive(true)
          setCooldownSeconds(60) // Default to 60 seconds
          startCooldownTimer(60)
          throw new Error(`Email rate limit exceeded. Please wait ${60} seconds before trying again.`)
        }
        throw new Error(signUpError)
      }

      // Move to verification step
      setVerificationStep(true)

      // Clear the form
      setName("")
      setEmail("")
      setPassword("")

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the 6-digit verification code. Also check your spam folder.",
      })
    } catch (error) {
      console.error("Signup error:", error)

      if (error.message.includes("already registered")) {
        setSignupError(
          <div className="flex flex-col gap-2">
            <p>This email is already registered.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.querySelector('[value="login"]')?.dispatchEvent(new MouseEvent("click"))}
            >
              Switch to Login
            </Button>
          </div>,
        )
      } else {
        setSignupError(error.message || "An error occurred during signup")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (isLoading) return

    // Don't proceed if cooldown is active
    if (cooldownActive) {
      toast({
        title: "Please wait",
        description: `You can request another code in ${cooldownSeconds} seconds.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Use the improved signInWithEmailOTP function
      const { error } = await signInWithEmailOTP(signupEmail, false)

      if (error) {
        // Check if this is a rate limit error
        if (error.includes("rate limit") || error.includes("wait")) {
          // Set cooldown immediately to prevent further attempts
          setCooldownActive(true)
          setCooldownSeconds(60) // Default to 60 seconds
          startCooldownTimer(60)
          throw new Error(`Email rate limit exceeded. Please wait ${60} seconds before trying again.`)
        }
        throw new Error(error)
      }

      toast({
        title: "Verification Code Resent",
        description: "Please check your inbox (and spam folder) for the new verification code.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)

    try {
      const code = otpCode.join("")

      if (code.length !== 6) {
        throw new Error("Please enter all 6 digits of the verification code")
      }

      // Use the improved verifyEmailOTP function
      const { data, error } = await verifyEmailOTP(signupEmail, code)

      if (error) throw new Error(error)

      // If verification successful, sign in the user
      toast({
        title: "Verification Successful",
        description: "Your account has been created. Redirecting to dashboard...",
      })

      // Clear any rate limits since verification was successful
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY)
      setCooldownActive(false)
      if (cooldownInterval) clearInterval(cooldownInterval)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Verification error:", error)
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsResetting(true)

    // Check if we're in a rate limit period
    if (cooldownActive) {
      toast({
        title: "Rate limit active",
        description: `Please wait ${cooldownSeconds} seconds before trying again.`,
        variant: "destructive",
      })
      setIsResetting(false)
      return
    }

    try {
      // Use the improved resetPassword function
      const { error } = await resetPassword(resetEmail)

      if (error) {
        // Handle rate limiting errors
        if (
          error.includes("For security purposes, you can only request this after") ||
          error.includes("email rate limit exceeded")
        ) {
          // Extract the seconds from the error message if available
          const secondsMatch = error.match(/after (\d+) seconds/)
          const waitSeconds = secondsMatch ? Number.parseInt(secondsMatch[1]) : DEFAULT_RATE_LIMIT_SECONDS

          // Set the rate limit
          setRateLimit(waitSeconds)

          throw new Error(`Email rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`)
        } else {
          throw new Error(error)
        }
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for the password reset link.",
      })
      setIsResetting(false)
      setResetEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setIsResetting(false)
    }
  }

  // If we're in the verification step
  if (verificationStep) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
          <Card className="border-none shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Verify your email</CardTitle>
              <CardDescription>
                We've sent a verification code to <strong>{signupEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Enter the 6-digit code sent to your email
                </p>
                <div className="flex justify-center gap-2">
                  {otpCode.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="w-10 h-12 text-center text-lg"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpCode.join("").length !== 6}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Verify Email
                </Button>
                <div className="flex justify-between items-center">
                  <Button variant="link" onClick={() => setVerificationStep(false)} disabled={isLoading}>
                    Back to signup
                  </Button>
                  <Button variant="link" onClick={handleResendCode} disabled={isLoading || cooldownActive}>
                    {cooldownActive ? `Resend in ${cooldownSeconds}s` : "Resend code"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        {cooldownActive && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-500">Rate limit active</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Please wait {cooldownSeconds} seconds before requesting another code.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card className="border-none shadow-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Enter your email and password to access your account</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <form onSubmit={handleLogin}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm text-muted-foreground hover:text-primary"
                          onClick={() => setIsResetting(true)}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          disabled={isLoading}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card className="border-none shadow-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>Enter your details to create a new account</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {signupError && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {typeof signupError === "string" ? signupError : signupError}
                  </div>
                )}
                <form onSubmit={handleSignup}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        disabled={isLoading || cooldownActive}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading || cooldownActive}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          disabled={isLoading || cooldownActive}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || cooldownActive}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                    </div>
                    <Button
                      disabled={isLoading || cooldownActive}
                      className={cooldownActive ? "bg-muted text-muted-foreground" : ""}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : cooldownActive ? (
                        `Wait ${cooldownSeconds}s`
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col">
                <p className="mt-2 text-xs text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Password Reset Dialog */}
        {isResetting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a password reset link</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={cooldownActive}
                    />
                  </div>
                  {cooldownActive && (
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      Please wait {cooldownSeconds} seconds before requesting another email.
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsResetting(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || cooldownActive}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Reset Link
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

