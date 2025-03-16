"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"

interface SurveyCelebrationProps {
  pointsEarned: number
  onClose: () => void
}

export function SurveyCelebration({ pointsEarned, onClose }: SurveyCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Trigger confetti effect
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 500) // Allow exit animation to complete
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass relative max-w-md mx-auto p-8 rounded-xl text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Decorative circles */}
            <div className="absolute -z-10 top-10 left-10 w-32 h-32 rounded-full bg-[#1A4314] opacity-20 blur-xl"></div>
            <div className="absolute -z-10 bottom-10 right-10 w-40 h-40 rounded-full bg-[#B7245B] opacity-20 blur-xl"></div>

            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="text-3xl font-bold mb-4">Survey Completed!</h2>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="my-8"
            >
              <div className="w-24 h-24 rounded-full bg-[#1A4314]/20 mx-auto flex items-center justify-center">
                <span className="text-3xl font-bold">+{pointsEarned}</span>
              </div>
              <p className="mt-2 text-lg">Points Earned</p>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mb-6">
              Thank you for contributing to the Donkey Mapping Initiative!
            </motion.p>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
              <Button onClick={handleClose} className="bg-[#1A4314] hover:bg-[#1A4314]/90 text-white px-8 py-2">
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

