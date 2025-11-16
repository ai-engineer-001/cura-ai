"use client"

import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { Menu, User } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface TopBarProps {
  onToggleSidebar?: () => void
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { chats, activeChat } = useChatStore()
  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-lg font-semibold">
            {currentChat?.title || "Cura AI"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Medical Emergency Assistant
          </p>
        </div>
      </div>
      {/* No profile icon */}
    </div>
  )
}
