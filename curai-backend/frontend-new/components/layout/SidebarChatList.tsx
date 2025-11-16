"use client"

import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Trash2, Settings, LogOut } from "lucide-react"
import { formatTime, truncate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface SidebarChatListProps {
  onNewChat: () => void
  onOpenSettings: () => void
}

export function SidebarChatList({ onNewChat, onOpenSettings }: SidebarChatListProps) {
  const { chats, activeChat, setActiveChat, deleteChat } = useChatStore()

  return (
    <div className="flex flex-col h-full w-64 border-r border-border bg-card fixed z-40 left-0 top-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 w-4/5 max-w-xs sm:w-64" style={{ minWidth: 0 }}>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4 gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">🩺</span>
            </div>
            <span className="font-bold text-base md:text-lg">Cura AI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={onNewChat} className="w-full text-xs md:text-sm" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-2 min-h-0">
        <div className="space-y-1">
          {chats.length === 0 ? (
            <div className="text-center text-xs md:text-sm text-muted-foreground py-8">
              No conversations yet
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg p-2 md:p-3 cursor-pointer hover:bg-accent transition-colors text-xs md:text-sm",
                  activeChat === chat.id && "bg-accent"
                )}
                onClick={() => setActiveChat(chat.id)}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-xs md:text-sm">{truncate(chat.title, 30)}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{formatTime(chat.updatedAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChat(chat.id)
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          Cura AI v1.0
          <br />
          Medical Emergency Assistant
        </p>
      </div>
    </div>
  )
}
