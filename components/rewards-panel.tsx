"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Gift, Award, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Reward {
  id: string
  name: string
  description: string
  points: number
  image: string
}

export function RewardsPanel() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [surveysCompleted, setSurveysCompleted] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          // Use sample data if not authenticated
          setRewards(sampleRewards)
          setIsLoading(false)
          return
        }

        // First try to get user data directly from auth metadata
        // This avoids querying the users table which might have RLS issues
        const userMetadata = session.user.user_metadata || {}
        const pointsFromMetadata = userMetadata.points || 0
        const surveysFromMetadata = userMetadata.surveys_completed || 0

        // Set initial values from metadata
        setUserPoints(pointsFromMetadata)
        setSurveysCompleted(surveysFromMetadata)

        // Try to fetch rewards without depending on user data
        const { data: rewardsData, error: rewardsError } = await supabase
          .from("rewards")
          .select("*")
          .order("points", { ascending: true })

        if (rewardsError) throw rewardsError

        setRewards(rewardsData || [])

        // Only try to fetch user data if we successfully got rewards
        try {
          // Use a direct query with service role if possible
          const response = await fetch("/api/user/stats", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUserPoints(userData.points || 0)
            setSurveysCompleted(userData.surveys_completed || 0)
          }
        } catch (userError) {
          console.warn("Could not fetch user stats:", userError)
          // Continue with metadata values
        }
      } catch (error) {
        console.error("Error fetching rewards data:", error)
        setError("Failed to load rewards data. Using sample data instead.")
        // Fall back to sample data
        setRewards(sampleRewards)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRewardsData()
  }, [])

  // For now, use sample data if no data is loaded from Supabase
  const sampleRewards = [
    {
      id: "1",
      name: "1GB Internet",
      description: "1GB of mobile data for your phone",
      points: 500,
      image: "/rewards/internet.png",
    },
    {
      id: "2",
      name: "T-Shirt",
      description: "Donkey Mapping Initiative T-shirt",
      points: 1000,
      image: "/rewards/tshirt.png",
    },
    {
      id: "3",
      name: "Coffee Mug",
      description: "Branded coffee mug",
      points: 750,
      image: "/rewards/mug.png",
    },
  ]

  const displayRewards = rewards.length > 0 ? rewards : sampleRewards

  const handleClaimReward = async (reward: Reward) => {
    try {
      if (userPoints < reward.points) {
        toast({
          title: "Not enough points",
          description: `You need ${reward.points - userPoints} more points to claim this reward.`,
          variant: "destructive",
        })
        return
      }

      // In a real implementation, you would call an API to claim the reward
      // For now, just show a success message
      toast({
        title: "Reward Claimed!",
        description: `You have successfully claimed: ${reward.name}`,
      })

      // Show celebration modal
      showCelebration(reward)
    } catch (error) {
      console.error("Error claiming reward:", error)
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      })
    }
  }

  const showCelebration = (reward: Reward) => {
    // This would be implemented with a modal in a real application
    // For now, we'll just create a temporary element
    const celebrationDiv = document.createElement("div")
    celebrationDiv.className = "fixed inset-0 flex items-center justify-center z-50"
    celebrationDiv.innerHTML = `
      <div class="glass p-8 rounded-xl text-center max-w-md mx-auto">
        <h2 class="text-2xl font-bold mb-4">Congrats!</h2>
        <p class="mb-6">You have just claimed ${reward.name}!</p>
        <div class="flex justify-center space-x-4">
          <button class="bg-[#1A4314] text-white px-4 py-2 rounded-md">DOWNLOAD NOW</button>
          <button class="border border-white bg-transparent px-4 py-2 rounded-md">CLOSE</button>
        </div>
      </div>
    `
    document.body.appendChild(celebrationDiv)

    // Add glassmorphism effect with dynamic circles
    const circles = ["#1A4314", "#B7245B", "#4A90E2"]
    circles.forEach((color, i) => {
      const circle = document.createElement("div")
      circle.className = "absolute rounded-full opacity-30 animate-pulse"
      circle.style.backgroundColor = color
      circle.style.width = `${100 + i * 50}px`
      circle.style.height = `${100 + i * 50}px`
      circle.style.top = `${Math.random() * 100}%`
      circle.style.left = `${Math.random() * 100}%`
      circle.style.zIndex = "-1"
      celebrationDiv.firstElementChild?.appendChild(circle)
    })

    // Remove after 5 seconds
    setTimeout(() => {
      document.body.removeChild(celebrationDiv)
    }, 5000)

    // Add click event to close button
    const closeButton = celebrationDiv.querySelector("button:last-child")
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        document.body.removeChild(celebrationDiv)
      })
    }
  }

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#1A4314] to-[#B7245B] text-white">
        <CardTitle className="flex items-center">
          <Award className="mr-2 h-5 w-5" />
          Rewards Center
        </CardTitle>
        <CardDescription className="text-white/80">Complete surveys to earn points and claim rewards</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-sm text-muted-foreground">Your Points</p>
            <p className="text-3xl font-bold">{userPoints}</p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm text-muted-foreground">Surveys Completed</p>
            <p className="text-3xl font-bold">{surveysCompleted}</p>
          </div>
        </div>

        <h3 className="font-medium text-lg mb-4">Available Rewards</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayRewards.map((reward) => (
            <motion.div
              key={reward.id}
              className="glass rounded-lg p-4 flex flex-col items-center text-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#1A4314]/10 flex items-center justify-center mb-3">
                <Gift className="h-8 w-8 text-[#1A4314]" />
              </div>
              <h4 className="font-medium">{reward.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
              <p className="font-bold text-[#1A4314] mb-4">{reward.points} points</p>
              <Button
                onClick={() => handleClaimReward(reward)}
                disabled={userPoints < reward.points}
                className="w-full bg-[#1A4314] hover:bg-[#1A4314]/90"
              >
                {userPoints >= reward.points ? "Claim Reward" : `Need ${reward.points - userPoints} more points`}
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

