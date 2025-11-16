"use client"

import { Button } from "@/components/ui/button"
import { Menu, Bell, User } from "lucide-react"

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={onToggleSidebar}
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-muted"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <img src="/curaai-logo.png" alt="CuraAI Logo" className="w-10 h-10 object-contain" />
        <span className="font-bold text-lg text-foreground hidden sm:inline">Cura AI</span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
