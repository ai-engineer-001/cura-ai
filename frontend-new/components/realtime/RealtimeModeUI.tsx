"use client"

import { useChatStore } from "@/store/chatStore"
import { motion, AnimatePresence } from "framer-motion"
import { WaveformVisualizer } from "./WaveformVisualizer"
import { VideoPreview } from "./VideoPreview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Camera, CameraOff, X } from "lucide-react"
import { useState, useEffect } from "react"

interface RealtimeModeUIProps {
  transcription?: string
  videoElement?: HTMLVideoElement | null
}

export function RealtimeModeUI({ transcription, videoElement }: RealtimeModeUIProps) {
  const { isRealtimeMode, isListening, isVideoActive, currentTranscription, showSubtitles, setListening, setVideoActive, setRealtimeMode } = useChatStore()

  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true) // Camera ON by default for mock

  // Ensure camera is on when entering realtime mode, off when exiting
  // (useEffect runs on mount/unmount of this component)
  useEffect(() => {
    setVideoActive(true)
    return () => {
      setCameraOn(false)
      setVideoActive(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isRealtimeMode) return null

  const handleMicToggle = () => {
    setMicOn((prev) => {
      setListening(!prev)
      return !prev
    })
  }

  const handleCameraToggle = () => {
    setCameraOn((prev) => {
      setVideoActive(!prev)
      return !prev
    })
  }

  const handleCancel = () => {
    setRealtimeMode(false)
  }
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-10 p-6"
      >
        {/* Card (waveform, subtitles) at the top */}
        <Card className="w-full max-w-2xl mb-6">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Waveform Visualizer (hide when camera is on and video is active) */}
              {!(cameraOn && isVideoActive) && (
                <WaveformVisualizer isActive={micOn && isListening} />
              )}

              {/* Live Transcription Subtitles */}
              {showSubtitles && (currentTranscription || transcription) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-muted rounded-lg"
                >
                  <p className="text-sm text-center text-foreground">
                    {currentTranscription || transcription}
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Preview above the controls, below the Card */}
        {cameraOn && isVideoActive && (
          <div className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50 flex justify-center">
            <VideoPreview isActive={isVideoActive} videoElement={videoElement} />
          </div>
        )}
        {/* Controls fixed at the bottom of the tab/modal */}
        <div className="absolute left-0 right-0 bottom-0 flex justify-center pb-6 pt-2 z-50 pointer-events-none">
          <div className="flex gap-4 bg-background/90 rounded-full shadow-lg px-6 py-3 pointer-events-auto border border-muted max-w-xs w-full justify-center">
            <Button
              variant={micOn ? "default" : "outline"}
              size="lg"
              aria-pressed={micOn}
              onClick={handleMicToggle}
              className={micOn ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            <Button
              variant={cameraOn ? "default" : "outline"}
              size="lg"
              aria-pressed={cameraOn}
              onClick={handleCameraToggle}
              className={cameraOn ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}
            >
              <Camera className="w-5 h-5" />
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={handleCancel}
              className="bg-red-600 text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
