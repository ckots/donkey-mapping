"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Loader2 } from "lucide-react"
import { SurveyCelebration } from "@/components/survey-celebration"
import { supabase } from "@/lib/supabase"

export default function SurveySubmitPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)

  const handleSubmitSurvey = async () => {
    try {
      setIsLoading(true)

      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // In a real implementation, you would submit the survey responses to the API
      // For now, simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Calculate points based on survey complexity (in a real app, this would come from the backend)
      const earnedPoints = Math.floor(Math.random() * 50) + 50 // Random between 50-100
      setPointsEarned(earnedPoints)

      // Update user points in the database
      const { error } = await supabase.rpc("increment_user_points", {
        user_id: session.user.id,
        points_to_add: earnedPoints,
      })

      if (error) throw error

      // Show celebration
      setShowCelebration(true)
    } catch (error) {
      console.error("Error submitting survey:", error)
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      })
      // Even on error, redirect to dashboard
      router.push("/dashboard?tab=surveys")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseCelebration = () => {
    setShowCelebration(false)
    router.push("/dashboard?tab=surveys")
  }

  return (
    <div className="container py-10">
      <div className="max-w-md mx-auto">
        <Card className="border-none shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Submit Survey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#1A4314]/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-[#1A4314]" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Ready to Submit?</h3>
              <p className="text-muted-foreground mt-2">
                You've completed all the questions. Submit your survey to earn points!
              </p>
            </div>

            <Button
              onClick={handleSubmitSurvey}
              disabled={isLoading}
              className="w-full bg-[#1A4314] hover:bg-[#1A4314]/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Survey"
              )}
            </Button>

            <Button variant="outline" onClick={() => router.back()} disabled={isLoading} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>

      {showCelebration && <SurveyCelebration pointsEarned={pointsEarned} onClose={handleCloseCelebration} />}
    </div>
  )
}

