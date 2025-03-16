"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { AlertCircle, Loader2 } from "lucide-react"

export function ErrorHandler() {
  const router = useRouter()
  const { toast } = useToast()
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorDetails, setErrorDetails] = useState({ error: "", error_code: "", error_description: "" })
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check for error in URL hash
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.includes("error=")) {
        // Parse the hash parameters
        const hashParams = new URLSearchParams(hash.substring(1))
        const error = hashParams.get("error")
        const errorCode = hashParams.get("error_code")
        const errorDescription = hashParams.get("error_description")

        // Store error details
        setErrorDetails({
          error: error || "",
          error_code: errorCode || "",
          error_description: errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, " ")) : "",
        })

        // Show error modal for OTP expired errors
        if (errorCode === "otp_expired") {
          setShowErrorModal(true)
          // Clear the hash
          window.history.replaceState(null, "", window.location.pathname)
          return
        }

        // Build the redirect URL with query parameters instead of hash
        const redirectUrl = new URL("/reset-password", window.location.origin)
        if (error) redirectUrl.searchParams.set("error", error)
        if (errorCode) redirectUrl.searchParams.set("error_code", errorCode)
        if (errorDescription) redirectUrl.searchParams.set("error_description", errorDescription)

        // Clear the hash and redirect
        window.location.hash = ""
        router.push(redirectUrl.toString())
      }
    }

    // Run once on mount
    handleHashChange()

    // Also listen for hash changes
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [router])

  const handleRequestNewLink = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get the current site URL
      const siteUrl = window.location.origin

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      })

      if (error) throw error

      toast({
        title: "New Link Sent",
        description: "Please check your email for the new link.",
      })
      setShowErrorModal(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!showErrorModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Link Expired
          </CardTitle>
          <CardDescription>{errorDetails.error_description || "Your link has expired or is invalid."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestNewLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowErrorModal(false)
                  router.push("/login")
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request New Link
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

