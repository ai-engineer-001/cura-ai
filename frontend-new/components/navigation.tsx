"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <img src="/curaai-logo.png" alt="CuraAI Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">Cura AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#safety"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Safety
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="flex gap-2">
            <Link href="/chat/demo">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Try Chat Demo
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" className="text-foreground border-border hover:bg-muted bg-transparent">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
