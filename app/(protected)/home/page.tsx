"use client"
import { useState } from "react"
import Link from "next/link"
import  CalendarCard  from "@/components/ui/calenderCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { Plus, Sparkles, TrendingUp } from "lucide-react"

export default function HomePage() {
  const [userName] = useState("Sarah")
  const [todayMood] = useState("calm")
  const moodEmojis: Record<string, string> = {
    calm: "🌿",
    happy: "😊",
    reflective: "🤔",
    peaceful: "🌙",
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 md:pb-8">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 md:top-40 md:left-20 w-72 md:w-96 h-72 md:h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 md:bottom-40 md:right-20 w-72 md:w-96 h-72 md:h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md md:max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
        {/* Header greeting */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold text-balance">Good Evening, {userName}</h1>
          <p className="text-muted-foreground md:text-lg">Let's capture your thoughts today</p>
        </div>
        <CalendarCard />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Today's mood snapshot */}
          <Card className="glass-gradient-primary border-0 p-6 md:p-8 space-y-4 md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base text-muted-foreground">Today's Mood</p>
                <p className="text-2xl md:text-3xl font-semibold capitalize">{todayMood}</p>
              </div>
              <div className="text-5xl md:text-6xl">{moodEmojis[todayMood]}</div>
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs md:text-sm text-muted-foreground italic">
                "Take a moment to breathe. Your thoughts matter."
              </p>
            </div>
          </Card>

          {/* Quick stats and AI Insight */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Card className="glass-gradient-secondary border-0 p-4 md:p-6 text-center space-y-2">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto" />
                <p className="text-2xl md:text-3xl font-bold">12</p>
                <p className="text-xs md:text-sm text-muted-foreground">Memories</p>
              </Card>
              <Card className="glass-gradient-cool border-0 p-4 md:p-6 text-center space-y-2">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent mx-auto" />
                <p className="text-2xl md:text-3xl font-bold">3</p>
                <p className="text-xs md:text-sm text-muted-foreground">This Week</p>
              </Card>
            </div>

            {/* AI Reflection tip */}
            <Card className="glass-gradient-accent border-0 p-4 md:p-6 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base font-medium">AI Insight</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    You've been more reflective this week. Consider exploring what's on your mind.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA to add memory */}
        <Link href="/add" className="block">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary h-12 md:h-14 text-base md:text-lg">
            <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2" />
            Add Memory
          </Button>
        </Link>

        {/* Recent memories preview */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-sm md:text-base font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Memories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className="glass-gradient-primary border-0 p-4 md:p-6 space-y-2 cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm md:text-base font-medium">Memory {i}</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Today at 2:30 PM</p>
                  </div>
                  <span className="text-lg md:text-2xl">🌙</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  A brief summary of your memory would appear here...
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
