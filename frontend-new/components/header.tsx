"use client"

import { Button } from "@/components/ui/button"
import { Menu, Bell, User } from "lucide-react"

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <Button
        onClick={onToggleSidebar}
        variant="ghost"
        size="icon"
        className="text-foreground hover:bg-muted"
      >
        <Menu className="w-6 h-6" />
      </Button>

      <div className="flex-1" />

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
