"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [userName, setUserName] = useState("")
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Check if this is the user's first login
        const { data: userData } = await supabase
          .from("users")
          .select("name, last_login")
          .eq("id", session.user.id)
          .single()

        if (userData) {
          setUserName(userData.name.split(" ")[0])

          // If last_login is null, this is the first login
          if (!userData.last_login) {
            setIsFirstLogin(true)
            setIsVisible(true)

            // Update the last_login field
            await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", session.user.id)
          }
        }
      }
    }

    checkUserStatus()
  }, [])

  if (!isVisible || !isFirstLogin) return null

  return (
    <motion.div
      className="relative mb-6 rounded-lg bg-gradient-to-r from-[#1A4314] to-[#B7245B] p-0.5 shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-md bg-background p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium sm:text-xl">Welcome to DonkeyMap, {userName}! 👋</h3>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Thank you for joining our community. Your account has been created successfully and you can now start
              contributing to the Donkey Mapping Initiative.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-[#1A4314] hover:bg-[#1A4314]/90"
                onClick={() => (window.location.href = "/surveys/create")}
              >
                Create Your First Survey
              </Button>
              <Button size="sm" variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                Explore Dashboard
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

