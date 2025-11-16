"use client"

import { useChatStore, type Message as MessageType } from "@/store/chatStore"
import { MessageBubble } from "./MessageBubble"
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function ChatWindow() {
  const { chats, activeChat, createChat, setActiveChat } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);


  let currentChat = chats.find((chat) => chat.id === activeChat);

  // Removed auto-creation of new chat. Handled in [id]/page.tsx only.

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  if (!currentChat) {
    // While chat is being created, show nothing or a loading spinner
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" data-chat-window>
      <div className="flex-1 overflow-y-auto px-2 py-3 md:px-4 md:py-6 space-y-4">
        {currentChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="text-4xl md:text-6xl">🩺</div>
              <h2 className="text-lg md:text-2xl font-semibold">Welcome to Cura AI</h2>
              <p className="text-xs md:text-sm max-w-xs md:max-w-md mx-auto">
                Your intelligent medical emergency assistant. Start a conversation or enable realtime mode for voice interaction.
              </p>
            </motion.div>
          </div>
        ) : (
          currentChat.messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLast={index === currentChat.messages.length - 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
