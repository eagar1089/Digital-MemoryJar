"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Download, LogOut, Moon, Sun } from "lucide-react"

export default function ProfilePage() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto")

  const user = {
    name: "Sagar Parab",
    email: "sgrp9801@gmail.com",
    joinDate: "January 2024",
    avatar: "SA",
    stats: {
      totalMemories: 47,
      thisMonth: 12,
      streak: 8,
      averageMood: 8.2,
    },
    badges: [
      { name: "Optimistic Thinker", emoji: "🌟", description: "Mostly positive entries" },
      { name: "Reflective Soul", emoji: "🤔", description: "Deep and thoughtful" },
      { name: "Consistent Logger", emoji: "📝", description: "8-day streak" },
    ],
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Link href="/settings">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Settings size={20} />
            </Button>
          </Link>
        </div>

        {/* User info card */}
        <Card className="glass-gradient-primary border-0 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
              {user.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Joined {user.joinDate}</p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-gradient-primary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{user.stats.totalMemories}</p>
            <p className="text-xs text-muted-foreground">Total Memories</p>
          </Card>
          <Card className="glass-gradient-secondary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{user.stats.streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </Card>
          <Card className="glass-gradient-cool border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{user.stats.thisMonth}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </Card>
          <Card className="glass-gradient-accent border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{user.stats.averageMood}</p>
            <p className="text-xs text-muted-foreground">Avg. Mood</p>
          </Card>
        </div>

        {/* Badges */}
        <Card className="glass-gradient-primary border-0 p-6 space-y-4">
          <h3 className="text-sm font-semibold">Achievements</h3>
          <div className="space-y-3">
            {user.badges.map((badge) => (
              <div key={badge.name} className="flex items-start gap-3">
                <span className="text-2xl">{badge.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Theme toggle */}
        <Card className="glass-gradient-secondary border-0 p-4 space-y-3">
          <p className="text-sm font-semibold">Theme</p>
          <div className="flex gap-2">
            {(["light", "dark", "auto"] as const).map((t) => (
              <Button
                key={t}
                onClick={() => setTheme(t)}
                variant={theme === t ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${
                  theme === t
                    ? "bg-primary text-primary-foreground"
                    : "border-primary/30 hover:bg-primary/5 bg-transparent"
                }`}
              >
                {t === "light" && <Sun size={16} className="mr-1" />}
                {t === "dark" && <Moon size={16} className="mr-1" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-2 pt-4">
          <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/5 bg-transparent">
            <Download size={16} className="mr-2" />
            Export Memories
          </Button>
          <Button
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/5 bg-transparent text-destructive hover:text-destructive"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </main>
  )
}
