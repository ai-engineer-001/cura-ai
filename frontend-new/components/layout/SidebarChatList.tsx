"use client"

import { useChatStore } from "@/store/chatStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Trash2, Settings, LogOut, Menu } from "lucide-react"
import { formatTime, truncate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import Link from "next/link"


interface SidebarChatListProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function SidebarChatList({ onNewChat, onOpenSettings, onToggleSidebar, isSidebarOpen }: SidebarChatListProps) {
  const { chats, activeChat, setActiveChat, deleteChat } = useChatStore();

  return (
    <div
      className={`flex flex-col h-full w-64 border-r border-border bg-card fixed z-40 left-0 top-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 w-4/5 max-w-xs sm:w-64 ${typeof window !== 'undefined' && window.innerWidth < 768 && typeof isSidebarOpen !== 'undefined' && !isSidebarOpen ? '-translate-x-full' : ''}`}
      style={{ minWidth: 0 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4 gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/curaai-logo.png" alt="CuraAI Logo" className="w-20 h-20 object-contain" />
            <span className="font-bold text-base md:text-lg">Cura AI</span>
          </Link>
          {/* Menu button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          {/* Settings button for desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="hidden md:inline-flex"
            aria-label="Open settings"
          >
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
      <div className="p-4 border-t border-border flex-shrink-0 relative">
        <p className="text-xs text-muted-foreground text-center">
          Cura AI v1.0
          <br />
          Medical Emergency Assistant
        </p>
        {/* Settings button for mobile, fixed to bottom left */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="md:hidden fixed left-4 bottom-4 z-50 bg-background border border-border shadow-lg"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
