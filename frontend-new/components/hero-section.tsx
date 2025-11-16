"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
          CuraAI: AI-Powered Medical Decision Support
        </h1>

        <p className="text-lg sm:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
          Integrating GPT-4.1 with Retrieval-Augmented Generation for up-to-date, validated clinical insights.
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Link href="/signin" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Sign In</Link>
          <Link href="/signup" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Sign Up</Link>
        </div>
      </div>

      {/* Decorative gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl"></div>
        <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
      </div>
    </section>
  )
}
