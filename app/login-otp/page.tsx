"use client"

import { EmailOTPForm } from "@/components/email-otp-form"

export default function LoginOTPPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <h1 className="text-2xl font-bold text-center mb-6">Login with OTP</h1>
        <EmailOTPForm
          title="Sign in with Email OTP"
          description="We'll send you a one-time code to verify your identity"
          redirectUrl="/dashboard"
        />
        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

