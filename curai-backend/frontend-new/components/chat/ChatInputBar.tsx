"use client"

import { useState, useRef, useEffect } from "react"
import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Mic, Video, StopCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ChatInputBarProps {
  onSendMessage: (message: string) => void
  onToggleRealtime: () => void
  onToggleVideo: () => void
}

export function ChatInputBar({ onSendMessage, onToggleRealtime, onToggleVideo }: ChatInputBarProps) {
  const [input, setInput] = useState("")
  const { isRealtimeMode, isListening, isVideoActive } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isRealtimeMode) {
      onSendMessage(input.trim())
      setInput("")
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <div className="py-3 px-2 md:py-5 md:px-24 w-full">
      <div className="flex items-center gap-2 w-full">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
          <div className="flex items-center w-full rounded-full bg-[#2c2c2c] px-3 py-2 md:px-6 md:py-3 shadow-inner relative">
            <input
              ref={textareaRef as any}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRealtimeMode ? "Realtime mode active..." : "Type your message..."}
              disabled={isRealtimeMode}
              className="flex-1 bg-transparent border-none outline-none text-white text-base md:text-lg placeholder:text-gray-400"
              style={{ minHeight: 36 }}
            />
            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || isRealtimeMode}
              className="ml-2 md:ml-4 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shadow transition hover:bg-gray-200 disabled:opacity-60"
            >
              <Send className="w-5 h-5 text-black" />
            </button>
          </div>
        </form>
        <Button
          type="button"
          onClick={onToggleRealtime}
          disabled={isRealtimeMode}
          className="whitespace-nowrap font-semibold px-4 py-2 rounded-full bg-contrast text-white shadow-md hover:bg-contrast/90 transition disabled:opacity-60"
          style={{ backgroundColor: '#ff0055' }}
        >
          Real Time
        </Button>
      </div>
      {/* Realtime Status */}
      {isRealtimeMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs md:text-sm text-muted-foreground text-center"
        >
          {isListening ? (
            <span className="text-red-600 font-medium">● Listening...</span>
          ) : (
            <span>Realtime mode active</span>
          )}
        </motion.div>
      )}
    </div>
  )
}
