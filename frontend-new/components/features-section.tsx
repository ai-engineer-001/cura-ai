"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Database, Users } from "lucide-react"

const features = [
  {
    title: "Dynamic Knowledge",
    subtitle: "Uses RAG to integrate real-time medical literature, not static data.",
    icon: BookOpen,
  },
  {
    title: "Comprehensive Datasets",
    subtitle: "Trained on USMLE, MIMIC-IV, and PubMed for robust reasoning.",
    icon: Database,
  },
  {
    title: "Clinician-Focused",
    subtitle: "Built for decision support, with clear source validation and feedback.",
    icon: Users,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full bg-background px-4 py-20 sm:px-6 lg:px-8 border-t border-border">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">A New Standard in Clinical AI</h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Purpose-built for medical professionals with validated, real-time insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-card-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-card-foreground/70">{feature.subtitle}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
