"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Mic, MicOff } from "lucide-react"

interface WaveformVisualizerProps {
  isActive: boolean
  audioLevel?: number
}

export function WaveformVisualizer({ isActive, audioLevel = 0.5 }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bars = 40
    const barWidth = canvas.width / bars
    let dataArray = new Array(bars).fill(0).map(() => Math.random() * audioLevel)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
      gradient.addColorStop(1, "rgba(37, 99, 235, 0.4)")

      for (let i = 0; i < bars; i++) {
        const targetHeight = isActive
          ? Math.random() * canvas.height * audioLevel * 0.8 + canvas.height * 0.1
          : canvas.height * 0.05

        // Smooth transition
        dataArray[i] += (targetHeight - dataArray[i]) * 0.3

        const x = i * barWidth
        const height = dataArray[i]
        const y = (canvas.height - height) / 2

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth - 2, height)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, audioLevel])

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center ${
          isActive ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
        }`}
      >
        {isActive ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
      </motion.div>

      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        className="w-full max-w-md rounded-lg"
      />

      <p className={`text-sm font-medium ${isActive ? "text-red-600" : "text-muted-foreground"}`}>
        {isActive ? "Listening..." : "Inactive"}
      </p>
    </div>
  )
}
