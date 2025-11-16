"use client"

import { type Message } from "@/store/chatStore"
import { motion } from "framer-motion"
import { formatMessageTime } from "@/lib/utils"
import { User, Bot, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  isLast?: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system" || message.role === "state-event"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        isSystem && "justify-center"
      )}
    >
      {!isSystem && (
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isUser && "items-end",
          isSystem && "items-center max-w-full"
        )}
      >
        {isSystem ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{message.content}</span>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "px-4 py-2 rounded-2xl break-words",
                isUser
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.isStreaming && isLast && (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="inline-block w-2 h-4 ml-1 bg-current"
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground mt-1 px-2">
              {formatMessageTime(message.timestamp)}
            </span>
          </>
        )}
      </div>
    </motion.div>
  )
}
