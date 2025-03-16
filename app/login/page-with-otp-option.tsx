"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailOTPForm } from "@/components/email-otp-form"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "password")

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">Email OTP</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Login with Password</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Your existing password login form */}
                <p className="text-center py-8">Password login form goes here</p>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="w-full" onClick={() => setActiveTab("otp")}>
                  Or sign in with a one-time code
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="otp">
            <EmailOTPForm
              title="Sign in with Email"
              description="We'll send you a verification code to sign in"
              redirectUrl="/dashboard"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

