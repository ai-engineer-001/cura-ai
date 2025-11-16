"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessageCircle, Users, CheckSquare, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  open: boolean
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Query", href: "/dashboard/query", icon: MessageCircle },
  { label: "Validation", href: "/dashboard/validation", icon: CheckSquare },
]

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out flex flex-col z-40 ${
        !open ? "-translate-x-full" : "translate-x-0"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary">
            <span className="text-xs font-bold text-sidebar-primary-foreground">CA</span>
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">CuraAI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <Link href="/dashboard/settings">
          <Button
            variant={pathname === "/dashboard/settings" ? "default" : "ghost"}
            className={`w-full justify-start gap-3 ${
              pathname === "/dashboard/settings"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </Link>
      </div>
    </aside>
  )
}
