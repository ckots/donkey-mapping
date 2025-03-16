"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RewardsPanel } from "@/components/rewards-panel"
import { RewardHistory } from "@/components/reward-history"

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("available")

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Rewards Program</h1>

      <Tabs defaultValue="available" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid">
          <TabsTrigger value="available">Available Rewards</TabsTrigger>
          <TabsTrigger value="history">Reward History</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-8">
          <RewardsPanel />
        </TabsContent>

        <TabsContent value="history" className="space-y-8">
          <RewardHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

