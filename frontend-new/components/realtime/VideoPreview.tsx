"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Video as VideoIcon, VideoOff } from "lucide-react"


interface VideoPreviewProps {
  isActive: boolean
  videoElement?: HTMLVideoElement | null
}

export function VideoPreview({ isActive, videoElement }: VideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let videoEl: HTMLVideoElement | null = null;
    async function startCamera() {
      if (isActive && containerRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          streamRef.current = stream
          videoEl = document.createElement('video')
          videoEl.className = "w-full h-full object-cover"
          videoEl.srcObject = stream
          videoEl.autoplay = true
          videoEl.playsInline = true
          videoEl.muted = true
          containerRef.current.innerHTML = ""
          containerRef.current.appendChild(videoEl)
        } catch (err) {
          containerRef.current.innerHTML = "<div class='text-xs text-red-500 p-2'>Camera access denied</div>"
        }
      } else if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [isActive])

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[90vw] max-w-[600px] h-[80vh] max-h-[600px] rounded-[10px] bg-muted flex items-center justify-center"
      >
        <VideoOff className="w-16 h-16 text-muted-foreground" />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-[90vw] max-w-[600px] h-[50vh] max-h-[600px] rounded-[15px] overflow-hidden bg-black"
    >
      <div ref={containerRef} className="w-full h-full" />
      {/* Camera Active Indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-2 h-2 bg-white rounded-full"
        />
        <span>REC</span>
      </div>
    </motion.div>
  )
}
