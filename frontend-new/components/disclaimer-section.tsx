"use client"

import { AlertCircle } from "lucide-react"

export default function DisclaimerSection() {
  return (
    <section id="safety" className="w-full bg-muted/50 px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
      <div className="mx-auto max-w-4xl">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">For Decision Support Only</h3>
            <p className="text-foreground/70 leading-relaxed">
              CuraAI is a decision support tool for qualified medical professionals. It is not a substitute for
              professional clinical judgment, diagnosis, or treatment. All outputs must be independently validated by
              licensed healthcare providers before clinical application.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
