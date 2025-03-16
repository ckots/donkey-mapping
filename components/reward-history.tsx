"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Gift } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ClaimedReward {
  id: string
  reward_id: string
  reward_name: string
  points: number
  claimed_at: string
  status: "processing" | "delivered" | "cancelled"
}

export function RewardHistory() {
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClaimedRewards = async () => {
      try {
        setIsLoading(true)

        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        // Fetch claimed rewards
        const { data, error } = await supabase
          .from("claimed_rewards")
          .select(`
            id,
            reward_id,
            rewards (name),
            points,
            claimed_at,
            status
          `)
          .eq("user_id", session.user.id)
          .order("claimed_at", { ascending: false })

        if (error) throw error

        // Format the data
        const formattedData =
          data?.map((item) => ({
            id: item.id,
            reward_id: item.reward_id,
            reward_name: item.rewards.name,
            points: item.points,
            claimed_at: item.claimed_at,
            status: item.status,
          })) || []

        setClaimedRewards(formattedData)
      } catch (error) {
        console.error("Error fetching claimed rewards:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClaimedRewards()
  }, [])

  // Sample data if no data is loaded from Supabase
  const sampleClaimedRewards = [
    {
      id: "1",
      reward_id: "1",
      reward_name: "1GB Internet",
      points: 500,
      claimed_at: "2023-10-15T10:30:00Z",
      status: "delivered" as const,
    },
    {
      id: "2",
      reward_id: "2",
      reward_name: "T-Shirt",
      points: 1000,
      claimed_at: "2023-09-20T14:45:00Z",
      status: "delivered" as const,
    },
    {
      id: "3",
      reward_id: "3",
      reward_name: "Coffee Mug",
      points: 750,
      claimed_at: "2023-08-05T09:15:00Z",
      status: "delivered" as const,
    },
  ]

  const displayRewards = claimedRewards.length > 0 ? claimedRewards : sampleClaimedRewards

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Reward History
        </CardTitle>
        <CardDescription>Your previously claimed rewards</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4314]"></div>
          </div>
        ) : displayRewards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You haven't claimed any rewards yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayRewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#1A4314]/10 flex items-center justify-center mr-3">
                    <Gift className="h-5 w-5 text-[#1A4314]" />
                  </div>
                  <div>
                    <p className="font-medium">{reward.reward_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reward.claimed_at).toLocaleDateString()} • {reward.points} points
                    </p>
                  </div>
                </div>
                <Badge variant={reward.status === "delivered" ? "default" : "outline"}>
                  {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

